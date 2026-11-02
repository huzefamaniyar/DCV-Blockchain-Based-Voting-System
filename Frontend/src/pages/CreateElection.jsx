import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Trash2, Calendar, Users, Save, X, Upload, Image as ImageIcon, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { electionAPI, uploadAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { getVotingContract, getSigner, getProvider } from '../web3/contract';

const CreateElection = () => {
  const navigate = useNavigate();
  const { connectWallet, walletAddress } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const [step, setStep] = useState(1); // 1: Details, 2: Candidates, 3: Review
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    candidates: [
      { name: '', party: '', description: '', imageUrl: '' },
      { name: '', party: '', description: '', imageUrl: '' }
    ]
  });

  const fillTestData = () => {
    const now = new Date();
    const start = new Date(now.getTime() + 5 * 60 * 1000); // +5 min
    const end = new Date(now.getTime() + 65 * 60 * 1000);  // +65 min
    const toLocalDT = (d) => {
      const pad = (n) => String(n).padStart(2, '0');
      const yyyy = d.getFullYear();
      const mm = pad(d.getMonth() + 1);
      const dd = pad(d.getDate());
      const hh = pad(d.getHours());
      const mi = pad(d.getMinutes());
      return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
    };
    setFormData({
      title: 'Test Election 1',
      description: 'Auto-filled test election for quick verification',
      startTime: toLocalDT(start),
      endTime: toLocalDT(end),
      candidates: [
        { name: 'Alice', party: 'Alpha', description: 'Test candidate A', imageUrl: '' },
        { name: 'Bob', party: 'Beta', description: 'Test candidate B', imageUrl: '' }
      ]
    });
    setStep(3);
    toast.info('Filled test data. Review & Create when ready.');
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCandidateChange = (index, field, value) => {
    const newCandidates = [...formData.candidates];
    newCandidates[index][field] = value;
    setFormData({ ...formData, candidates: newCandidates });
  };

  const handleCandidateImage = async (index, file) => {
    try {
      if (!file) return;
      setUploadingIndex(index);
      const form = new FormData();
      form.append('image', file);
      const resp = await uploadAPI.uploadImage(form);
      const imageUrl = resp?.data?.imageUrl;
      if (!imageUrl) throw new Error('Upload failed');
      const newCandidates = [...formData.candidates];
      newCandidates[index].imageUrl = imageUrl;
      setFormData({ ...formData, candidates: newCandidates });
      toast.success('Image uploaded');
    } catch (err) {
      console.error('Upload image error:', err);
      toast.error('Failed to upload image');
    } finally {
      setUploadingIndex(null);
    }
  };

  const addCandidate = () => {
    if (formData.candidates.length >= 50) {
      toast.warning('Maximum 50 candidates allowed');
      return;
    }
    setFormData({
      ...formData,
      candidates: [...formData.candidates, { name: '', party: '', description: '', imageUrl: '' }]
    });
  };

  const removeCandidate = (index) => {
    if (formData.candidates.length <= 2) {
      toast.warning('Minimum 2 candidates required');
      return;
    }
    const newCandidates = formData.candidates.filter((_, i) => i !== index);
    setFormData({ ...formData, candidates: newCandidates });
  };

  const validateDetails = () => {
    if (!formData.title || !formData.startTime || !formData.endTime) {
      toast.error('Please fill in all required fields');
      return false;
    }
    const start = new Date(formData.startTime);
    const end = new Date(formData.endTime);
    const now = new Date();
    if (start >= end) {
      toast.error('End time must be after start time');
      return false;
    }
    if (start <= now) {
      toast.error('Start time must be in the future');
      return false;
    }
    return true;
  };

  const validateCandidates = () => {
    if (formData.candidates.length < 2) {
      toast.error('At least 2 candidates are required');
      return false;
    }
    const invalid = formData.candidates.some(c => !c.name || !c.party);
    if (invalid) {
      toast.error('All candidates must have name and party');
      return false;
    }
    return true;
  };

  const goNext = () => {
    if (step === 1 && !validateDetails()) return;
    if (step === 2 && !validateCandidates()) return;
    setStep(step + 1);
  };

  const goBack = () => setStep(step - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (uploadingIndex !== null) {
      toast.warning('Please wait for the image upload to finish');
      return;
    }
    if (!validateDetails() || !validateCandidates()) return;
    setLoading(true);
    try {
      // Ensure wallet connected / accounts authorized in MetaMask
      if (!walletAddress) {
        const res = await connectWallet();
        if (!res?.success) {
          toast.error(res?.message || 'Please connect your wallet to continue');
          setLoading(false);
          return;
        }
      }
      // Request accounts explicitly to avoid -32603 errors on eth_sendTransaction
      if (window?.ethereum?.request) {
        try {
          await window.ethereum.request({ method: 'eth_requestAccounts' });
        } catch (reqErr) {
          console.warn('eth_requestAccounts denied or failed:', reqErr);
        }
      }

      // Send MetaMask payment (platform/creation fee)
      const to = import.meta.env.VITE_TREASURY_ADDRESS;
      const valueWei = import.meta.env.VITE_ELECTION_FEE_WEI; // string in wei, e.g. "1000000000000000" for 0.001 ETH
      let txHash = undefined;
      if (to && valueWei) {
        try {
          const signer = await getSigner();
          const txPay = await signer.sendTransaction({ to, value: BigInt(valueWei) });
          const recPay = await txPay.wait();
          txHash = recPay?.hash || txPay.hash;
          toast.success('Payment submitted');
        } catch (payErr) {
          console.error('Payment error:', payErr);
          toast.error('Payment was cancelled or failed');
          setLoading(false);
          return;
        }
      } else {
        toast.warning('Treasury address or fee not configured; skipping payment');
      }

      // Call on-chain create election
      let contract;
      try {
        contract = await getVotingContract();
      } catch (cErr) {
        console.error('Contract init error:', cErr);
        toast.error(cErr?.message || 'Failed to initialize contract. Check VITE_VOTING_ADDRESS and MetaMask connection.');
        setLoading(false);
        return;
      }
      // Ensure caller is contract admin to avoid revert from onlyAdmin
      try {
        const signerAddr = (await (await getSigner()).getAddress()).toLowerCase();
        const adminAddr = (await contract.admin()).toLowerCase();
        if (signerAddr !== adminAddr) {
          toast.warning(`You are not the admin (${adminAddr.substring(0,6)}...${adminAddr.substring(38)}). Proceeding as non-admin per frontend policy.`);
        }
      } catch (admErr) {
        console.warn('Admin check failed:', admErr);
        toast.warning('Could not verify admin wallet; continuing may fail on-chain.');
      }
      // Verify network (expect Hardhat localhost: chainId 31337)
      try {
        const network = await (await getProvider()).getNetwork();
        if (Number(network.chainId) !== 31337) {
          toast.error(`Wrong network: connected to chainId ${Number(network.chainId)}. Switch MetaMask to Hardhat (31337).`);
          setLoading(false);
          return;
        }
      } catch (netErr) {
        console.warn('Network check failed:', netErr);
        toast.warning('Could not verify network; ensure MetaMask is on Hardhat (31337).');
      }
      const startSec = Math.floor(new Date(formData.startTime).getTime() / 1000);
      const endSec = Math.floor(new Date(formData.endTime).getTime() / 1000);
      let receipt;
      try {
        // Preflight simulate to catch revert reasons before sending
        try {
          if (contract?.createElection?.staticCall) {
            await contract.createElection.staticCall(
              formData.title,
              formData.description || '',
              startSec,
              endSec
            );
          } else {
            console.warn('staticCall not available, skipping preflight');
          }
        } catch (simErr) {
          console.error('createElection simulate error:', simErr);
          const simMsg = simErr?.shortMessage || simErr?.info?.error?.message || simErr?.message || 'Simulation failed';
          toast.error(simMsg);
          setLoading(false);
          return;
        }
        // Gas estimation preflight for clearer errors
        try {
          if (contract?.createElection?.estimateGas) {
            await contract.createElection.estimateGas(
              formData.title,
              formData.description || '',
              startSec,
              endSec
            );
          }
        } catch (estErr) {
          console.error('createElection estimateGas error:', estErr);
          const estMsg = estErr?.shortMessage || estErr?.info?.error?.message || estErr?.message || 'Gas estimation failed';
          toast.error(estMsg);
          setLoading(false);
          return;
        }
        const tx = await contract.createElection(
          formData.title,
          formData.description || '',
          startSec,
          endSec,
          { gasLimit: 1_000_000 }
        );
        receipt = await tx.wait();
        toast.success('Election created on-chain');
      } catch (chainErr) {
        console.error('createElection error:', chainErr);
        const msg = chainErr?.shortMessage || chainErr?.info?.error?.message || chainErr?.message || 'On-chain create failed';
        toast.error(msg);
        setLoading(false);
        return;
      }
      const onChainElectionId = await contract.electionCount();

      // Push candidates on-chain
      try {
        for (const c of formData.candidates) {
          const txC = await contract.addCandidate(onChainElectionId, c.name, c.imageUrl || '');
          await txC.wait();
        }
        toast.success('Candidates added on-chain');
      } catch (candErr) {
        console.error('addCandidate error:', candErr);
        toast.error(candErr?.shortMessage || candErr?.info?.error?.message || candErr?.message || 'Failed to add candidates on-chain');
        setLoading(false);
        return;
      }

      const response = await electionAPI.create({
        title: formData.title,
        description: formData.description,
        startTime: formData.startTime,
        endTime: formData.endTime,
        candidates: formData.candidates,
        paymentTxHash: txHash,
        onChainElectionId: onChainElectionId.toString(),
        onChainTxHash: receipt?.hash,
      });
      if (response.data.success) {
        toast.success('Election created successfully!', { position: 'top-right', autoClose: 3000 });
        navigate('/admin');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create election', { position: 'top-right', autoClose: 3000 });
      console.error('Create election error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Create New Election</h1>
              <p className="text-gray-400">Set up a new election in three steps</p>
            </div>
            <Button type="button" variant="outline" onClick={fillTestData}>Fill Test Data</Button>
          </div>
        </motion.div>

        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
              <Card>
                <CardHeader>
                  <CardTitle>Election Details</CardTitle>
                  <CardDescription>Basic information about the election</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Election Title <span className="text-red-500">*</span>
                      </label>
                      <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="e.g., Student Council Election 2024" required className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                      <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Provide details about this election..." rows={3} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Start Date & Time <span className="text-red-500">*</span></label>
                        <input type="datetime-local" name="startTime" value={formData.startTime} onChange={handleChange} required className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">End Date & Time <span className="text-red-500">*</span></label>
                        <input type="datetime-local" name="endTime" value={formData.endTime} onChange={handleChange} required className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Candidates</CardTitle>
                      <CardDescription>Add candidates for this election (2-50)</CardDescription>
                    </div>
                    <Button type="button" variant="outline" icon={Plus} onClick={addCandidate}>Add Candidate</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {formData.candidates.map((candidate, index) => (
                      <motion.div key={index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                        <div className="flex items-start justify-between mb-4">
                          <h4 className="text-lg font-semibold text-white">Candidate {index + 1}</h4>
                          {formData.candidates.length > 2 && (
                            <button type="button" onClick={() => removeCandidate(index)} className="text-red-400 hover:text-red-300 transition-colors">
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Name <span className="text-red-500">*</span></label>
                            <input type="text" value={candidate.name} onChange={(e) => handleCandidateChange(index, 'name', e.target.value)} placeholder="Candidate name" required className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Party <span className="text-red-500">*</span></label>
                            <input type="text" value={candidate.party} onChange={(e) => handleCandidateChange(index, 'party', e.target.value)} placeholder="Party name" required className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
                            <textarea value={candidate.description} onChange={(e) => handleCandidateChange(index, 'description', e.target.value)} placeholder="Brief description about the candidate..." rows={2} className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-400 mb-2">Upload Image</label>
                            <div className="flex items-center gap-3">
                              <input type="file" accept="image/*" onChange={(e) => handleCandidateImage(index, e.target.files?.[0])} className="block w-full text-sm text-gray-400 file:mr-4 file:rounded-md file:border-0 file:bg-gray-700 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-gray-600" />
                              {candidate.imageUrl && (
                                <img src={candidate.imageUrl} alt="preview" className="h-10 w-10 rounded object-cover border border-gray-700" />
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
              <Card>
                <CardHeader>
                  <CardTitle>Review & Create</CardTitle>
                  <CardDescription>Confirm details before creating the election</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="rounded-lg border border-gray-700 p-4 bg-gray-800/50">
                      <h3 className="text-white font-semibold mb-2">Details</h3>
                      <p className="text-gray-300"><span className="text-gray-400">Title:</span> {formData.title}</p>
                      {formData.description && <p className="text-gray-300"><span className="text-gray-400">Description:</span> {formData.description}</p>}
                      <p className="text-gray-300"><span className="text-gray-400">Start:</span> {formData.startTime}</p>
                      <p className="text-gray-300"><span className="text-gray-400">End:</span> {formData.endTime}</p>
                    </div>
                    <div className="rounded-lg border border-gray-700 p-4 bg-gray-800/50">
                      <h3 className="text-white font-semibold mb-4">Candidates</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {formData.candidates.map((c, i) => (
                          <div key={i} className="flex items-start gap-3 rounded-md border border-gray-700 p-3">
                            {c.imageUrl ? (
                              <img src={c.imageUrl} alt={c.name} className="h-12 w-12 rounded object-cover border border-gray-700" />
                            ) : (
                              <div className="h-12 w-12 rounded bg-gray-700 flex items-center justify-center text-gray-400">?
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-white font-medium">{c.name || 'Unnamed'}</span>
                                <span className="text-xs text-gray-400">{c.party || '—'}</span>
                                <CheckCircle className="h-4 w-4 text-green-400" />
                              </div>
                              {c.description && <p className="text-sm text-gray-400 mt-1">{c.description}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
            <div>
              <Button type="button" variant="ghost" icon={X} onClick={() => navigate('/admin')} disabled={loading}>Cancel</Button>
            </div>
            <div className="flex gap-2">
              {step > 1 && (
                <Button type="button" variant="outline" icon={ArrowLeft} onClick={goBack} disabled={loading}>Back</Button>
              )}
              {step < 3 && (
                <Button type="button" icon={ArrowRight} onClick={goNext}>Next</Button>
              )}
              {step === 3 && (
                <Button type="submit" icon={Save} loading={loading} disabled={loading}>{loading ? 'Creating...' : 'Create Election'}</Button>
              )}
            </div>
          </motion.div>
        </form>
      </div>
    </div>
  );
};

export default CreateElection;
