import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Vote as VoteIcon, User, CheckCircle, AlertCircle, Camera, Loader2, ArrowLeft, Shield, StopCircle, Trash2, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getVotingContract } from '../web3/contract';
import { electionAPI, faceAPI } from '../utils/api';
import { toast } from 'react-toastify';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import FaceCapture from '../components/FaceCapture';
import { formatDate } from '../lib/utils';

const Vote = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, walletAddress } = useAuth();
  
  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [step, setStep] = useState('select'); // select, verify, confirm, success
  const [timeLeft, setTimeLeft] = useState(null); // { d,h,m,s }
  const [aadhar, setAadhar] = useState('');
  const isAdmin = user?.role === 'admin';
  const [confirmAction, setConfirmAction] = useState(null); // 'stop' | 'delete' | null

  const fetchElectionDetails = useCallback(async () => {
    try {
      const response = await electionAPI.getById(id);
      if (response.data.success) {
        const e = response.data.election;
        const start = new Date(e.startTime);
        const end = new Date(e.endTime);
        const now = new Date();
        let status = e.status;
        if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
          if (now < start) status = 'Upcoming';
          else if (now > end) status = 'Ended';
          else status = 'Active';
        }
        setElection({ ...e, status });
        setCandidates(response.data.election.candidates || []);
      }
    } catch (error) {
      toast.error('Failed to fetch election details');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchElectionDetails();
  }, [fetchElectionDetails]);

  // Countdown updater
  useEffect(() => {
    if (!election) return;
    const start = new Date(election.startTime).getTime();
    const end = new Date(election.endTime).getTime();
    const tick = () => {
      const now = Date.now();
      let target = null;
      if (election.status === 'Upcoming') target = start; else if (election.status === 'Active') target = end; else target = null;
      if (!target) { setTimeLeft(null); return; }
      let diff = Math.max(target - now, 0);
      const d = Math.floor(diff / (24*3600*1000)); diff -= d*24*3600*1000;
      const h = Math.floor(diff / (3600*1000)); diff -= h*3600*1000;
      const m = Math.floor(diff / (60*1000)); diff -= m*60*1000;
      const s = Math.floor(diff / 1000);
      setTimeLeft({ d, h, m, s });
    };
    tick();
    const int = setInterval(tick, 1000);
    return () => clearInterval(int);
  }, [election]);

  // Admin: stop election now (on-chain)
  const handleStopElection = async () => {
    try {
      const contract = await getVotingContract();
      const tx = await contract.updateElectionStatus(Number(id));
      await tx.wait();
      toast.success('Election stopped on-chain');
      setConfirmAction(null);
      await fetchElectionDetails();
    } catch (err) {
      console.error(err);
      toast.error(err?.message || 'Failed to stop election');
    }
  };

  // Admin: delete election (on-chain) then navigate
  const handleDeleteElection = async () => {
    try {
      const contract = await getVotingContract();
      const tx = await contract.deleteElection(Number(id));
      await tx.wait();
      toast.success('Election deleted on-chain');
      setConfirmAction(null);
      // Best-effort backend cleanup
      try { await electionAPI.delete(id); } catch {}
      navigate('/elections');
    } catch (err) {
      console.error(err);
      toast.error(err?.message || 'Delete failed');
    }
  };

  const handleSelectCandidate = (candidate) => {
    setSelectedCandidate(candidate);
  };

  const handleProceedToVerify = () => {
    // Check prerequisites
    if (!user?.isVerified) {
      toast.error('Please register your face first in your profile');
      navigate('/profile');
      return;
    }

    if (!walletAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    setStep('verify');
  };

  const handleFaceVerificationSuccess = async ({ image, descriptor }) => {
    try {
      // Verify face before allowing to confirm vote
      const resp = await faceAPI.verifyForVoting({ image, descriptor });
      if (resp?.data?.success) {
        setStep('confirm');
      } else {
        toast.error(resp?.data?.message || 'Face verification failed');
      }
    } catch (err) {
      console.error('Face verify error:', err);
      toast.error('Face verification failed');
    }
  };

  const handleConfirmVote = async () => {
    setVoting(true);
    try {
      // Optional per-vote payment (env-configured)
      const to = import.meta.env.VITE_TREASURY_ADDRESS;
      const voteFeeWei = import.meta.env.VITE_VOTE_FEE_WEI;
      if (to && voteFeeWei && window?.ethereum) {
        try {
          const txParams = {
            from: window.ethereum.selectedAddress,
            to,
            value: '0x' + BigInt(voteFeeWei).toString(16),
          };
          await window.ethereum.request({ method: 'eth_sendTransaction', params: [txParams] });
        } catch (err) {
          console.error('Vote payment error:', err);
          toast.error('Vote payment cancelled/failed');
          setVoting(false);
          return;
        }
      }

      // On-chain vote
      const contract = await getVotingContract();
      const tx = await contract.vote(Number(id), selectedCandidate.id, aadhar || '');
      const receipt = await tx.wait();

      // Backend sync (best-effort, keep existing signature for compatibility)
      try {
        await electionAPI.vote(id, {
          candidateId: selectedCandidate.id,
          walletAddress,
          onChainTxHash: receipt?.hash,
        });
      } catch (err) {
        console.warn('Backend vote sync failed (non-fatal):', err);
      }

      setStep('success');
      toast.success('Vote cast successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cast vote');
      console.error('Voting error:', error);
    } finally {
      setVoting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading election...</p>
        </div>
      </div>
    );
  }

  if (!election) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Election Not Found</h3>
            <p className="text-gray-400 mb-4">The election you're looking for doesn't exist</p>
            <Button onClick={() => navigate('/elections')}>
              Back to Elections
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (election.status !== 'Active') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Election Not Active</h3>
            <p className="text-gray-400 mb-4">
              This election is {election.status.toLowerCase()}. You can only vote in active elections.
            </p>
            <Button onClick={() => navigate('/elections')}>
              Back to Elections
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            icon={ArrowLeft}
            onClick={() => navigate('/elections')}
            className="mb-4"
          >
            Back to Elections
          </Button>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{election.title}</h1>
              <p className="text-gray-400">{election.description}</p>
              <div className="flex flex-wrap items-center gap-3 mt-4">
                <Badge variant={election.status === 'Active' ? 'success' : election.status === 'Upcoming' ? 'warning' : 'default'}>
                  {election.status}
                </Badge>
                <span className="inline-flex items-center gap-1 text-sm text-gray-400">
                  <Clock className="w-4 h-4" />
                  {election.status === 'Upcoming' ? 'Starts' : election.status === 'Active' ? 'Ends' : 'Ended'}:&nbsp;
                  {election.status === 'Upcoming' ? formatDate(election.startTime) : formatDate(election.endTime)}
                </span>
                {timeLeft && (
                  <span className="inline-flex items-center gap-1 text-sm text-blue-300">
                    {election.status === 'Upcoming' ? 'Starts in' : 'Ends in'}
                    {` ${timeLeft.d}d ${timeLeft.h}h ${timeLeft.m}m ${timeLeft.s}s`}
                  </span>
                )}
              </div>
            </div>
            {isAdmin && (
              <div className="flex gap-2">
                {election.status === 'Active' && (
                  <Button variant="outline" icon={StopCircle} onClick={() => setConfirmAction('stop')}>Stop</Button>
                )}
                {election.status !== 'Active' && (
                  <Button variant="destructive" icon={Trash2} onClick={() => setConfirmAction('delete')}>Delete</Button>
                )}
              </div>
            )}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* Step 1: Select Candidate */}
          {step === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Select Your Candidate</CardTitle>
                  <CardDescription>
                    Choose the candidate you want to vote for
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {candidates.map((candidate) => (
                      <motion.div
                        key={candidate.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div
                          onClick={() => handleSelectCandidate(candidate)}
                          className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedCandidate?.id === candidate.id
                              ? 'border-blue-500 bg-blue-500/10'
                              : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                              {candidate.name.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-white mb-1">
                                {candidate.name}
                              </h3>
                              <p className="text-sm text-gray-400">{candidate.party}</p>
                              {candidate.description && (
                                <p className="text-xs text-gray-500 mt-2">
                                  {candidate.description}
                                </p>
                              )}
                            </div>
                            {selectedCandidate?.id === candidate.id && (
                              <CheckCircle className="w-6 h-6 text-blue-500" />
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {selectedCandidate && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 flex justify-end"
                    >
                      <Button
                        size="lg"
                        icon={Camera}
                        onClick={handleProceedToVerify}
                      >
                        Proceed to Verification
                      </Button>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Face Verification */}
          {step === 'verify' && (
            <motion.div
              key="verify"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Verify Your Identity</CardTitle>
                  <CardDescription>
                    Position your face in the camera for verification
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FaceCapture
                    mode="verify"
                    onCapture={handleFaceVerificationSuccess}
                    onCancel={() => setStep('select')}
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Confirm Vote */}
          {step === 'confirm' && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Confirm Your Vote</CardTitle>
                  <CardDescription>
                    Please review your selection before submitting
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-800/50 rounded-lg p-6 mb-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                        {selectedCandidate.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-1">
                          {selectedCandidate.name}
                        </h3>
                        <p className="text-gray-400">{selectedCandidate.party}</p>
                      </div>
                    </div>
                    {selectedCandidate.description && (
                      <p className="text-gray-400 text-sm">
                        {selectedCandidate.description}
                      </p>
                    )}
                  </div>

                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-white mb-1">
                          Important: Your vote is final
                        </p>
                        <p className="text-xs text-gray-400">
                          Once submitted, your vote cannot be changed. It will be recorded on the blockchain and cannot be modified or deleted.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Aadhar input required for on-chain vote call */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Aadhar ID</label>
                    <input
                      type="text"
                      value={aadhar}
                      onChange={(e) => setAadhar(e.target.value)}
                      placeholder="Enter your Aadhar ID"
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button
                      variant="ghost"
                      onClick={() => setStep('select')}
                      disabled={voting}
                      className="flex-1"
                    >
                      Go Back
                    </Button>
                    <Button
                      variant="success"
                      icon={VoteIcon}
                      onClick={handleConfirmVote}
                      loading={voting}
                      disabled={voting || !aadhar}
                      className="flex-1"
                    >
                      {voting ? 'Submitting Vote...' : 'Confirm & Submit Vote'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 4: Success */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card>
                <CardContent className="p-12 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6"
                  >
                    <CheckCircle className="w-12 h-12 text-white" />
                  </motion.div>
                  <h2 className="text-3xl font-bold text-white mb-4">
                    Vote Cast Successfully!
                  </h2>
                  <p className="text-gray-400 mb-2">
                    Your vote for <span className="text-white font-semibold">{selectedCandidate.name}</span> has been recorded on the blockchain.
                  </p>
                  <p className="text-sm text-gray-500 mb-8">
                    Thank you for participating in this election.
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Button
                      variant="outline"
                      onClick={() => navigate('/elections')}
                    >
                      Back to Elections
                    </Button>
                    <Button
                      onClick={() => navigate(`/results/${id}`)}
                    >
                      View Results
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Confirm Modal */}
        {isAdmin && confirmAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>{confirmAction === 'stop' ? 'Stop Election' : 'Delete Election'}</CardTitle>
                <CardDescription>
                  {confirmAction === 'stop'
                    ? 'This will end the election immediately. Are you sure?'
                    : 'This will permanently delete the election. Are you sure?'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setConfirmAction(null)}>Cancel</Button>
                  {confirmAction === 'stop' ? (
                    <Button variant="warning" onClick={handleStopElection}>Stop Now</Button>
                  ) : (
                    <Button variant="destructive" onClick={handleDeleteElection}>Delete</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Vote;
