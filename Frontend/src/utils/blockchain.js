import { ethers } from 'ethers';
import { HARDHAT_NETWORK } from '../config';
import VotingSystemABI from '../contracts/VotingSystem.json';

let provider = null;
let signer = null;
let contract = null;

// Initialize provider
export const initProvider = () => {
  if (window.ethereum) {
    provider = new ethers.BrowserProvider(window.ethereum);
    return provider;
  }
  throw new Error('MetaMask not installed');
};

// Connect wallet
export const connectWallet = async () => {
  try {
    if (!window.ethereum) {
      throw new Error('Please install MetaMask');
    }

    // Request account access
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });

    // Check if on correct network
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    
    if (chainId !== HARDHAT_NETWORK.chainId) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: HARDHAT_NETWORK.chainId }]
        });
      } catch (switchError) {
        // Network doesn't exist, add it
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [HARDHAT_NETWORK]
          });
        } else {
          throw switchError;
        }
      }
    }

    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();

    return {
      address: accounts[0],
      provider,
      signer
    };
  } catch (error) {
    console.error('Wallet connection error:', error);
    throw error;
  }
};

// Get contract instance
export const getContract = async () => {
  if (!contract) {
    if (!signer) {
      await connectWallet();
    }
    
    const contractAddress = VotingSystemABI.address;
    const contractABI = VotingSystemABI.abi;
    
    contract = new ethers.Contract(contractAddress, contractABI, signer);
  }
  
  return contract;
};

// Get current account
export const getCurrentAccount = async () => {
  try {
    if (!provider) {
      provider = new ethers.BrowserProvider(window.ethereum);
    }
    
    const accounts = await provider.listAccounts();
    return accounts[0]?.address || null;
  } catch (error) {
    return null;
  }
};

// Get account balance
export const getBalance = async (address) => {
  try {
    if (!provider) {
      provider = new ethers.BrowserProvider(window.ethereum);
    }
    
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error('Get balance error:', error);
    return '0';
  }
};

// Listen to account changes
export const onAccountsChanged = (callback) => {
  if (window.ethereum) {
    window.ethereum.on('accountsChanged', callback);
  }
};

// Listen to chain changes
export const onChainChanged = (callback) => {
  if (window.ethereum) {
    window.ethereum.on('chainChanged', callback);
  }
};

// Create election
export const createElection = async (title, candidateNames, candidateImages, startTime, endTime) => {
  try {
    const contract = await getContract();
    
    const tx = await contract.createElection(
      title,
      candidateNames,
      candidateImages,
      Math.floor(new Date(startTime).getTime() / 1000),
      Math.floor(new Date(endTime).getTime() / 1000)
    );
    
    const receipt = await tx.wait();
    return receipt;
  } catch (error) {
    console.error('Create election error:', error);
    throw error;
  }
};

// Vote
export const castVote = async (electionId, candidateIndex, aadhaarHash) => {
  try {
    const contract = await getContract();
    
    const tx = await contract.vote(electionId, candidateIndex, aadhaarHash);
    const receipt = await tx.wait();
    
    return receipt;
  } catch (error) {
    console.error('Cast vote error:', error);
    throw error;
  }
};

// Get election details
export const getElectionDetails = async (electionId) => {
  try {
    const contract = await getContract();
    
    const election = await contract.getElection(electionId);
    const candidates = await contract.getCandidates(electionId);
    
    return {
      election: {
        id: election[0].toString(),
        title: election[1],
        startTime: new Date(Number(election[2]) * 1000),
        endTime: new Date(Number(election[3]) * 1000),
        status: ['Upcoming', 'Active', 'Closed'][election[4]],
        totalVotes: election[5].toString(),
        candidateCount: election[6].toString()
      },
      candidates: candidates.map(c => ({
        name: c.name,
        imageUrl: c.imageUrl,
        voteCount: c.voteCount.toString()
      }))
    };
  } catch (error) {
    console.error('Get election details error:', error);
    throw error;
  }
};

// Get results
export const getElectionResults = async (electionId) => {
  try {
    const contract = await getContract();
    
    const results = await contract.getResults(electionId);
    const election = await contract.getElection(electionId);
    
    const totalVotes = Number(election[5]);
    
    const candidates = results[0].map((name, index) => ({
      name,
      voteCount: results[1][index].toString(),
      imageUrl: results[2][index],
      percentage: totalVotes > 0 
        ? ((Number(results[1][index]) / totalVotes) * 100).toFixed(2)
        : '0.00'
    }));
    
    // Sort by vote count
    candidates.sort((a, b) => Number(b.voteCount) - Number(a.voteCount));
    
    return {
      electionId,
      title: election[1],
      totalVotes: totalVotes.toString(),
      candidates
    };
  } catch (error) {
    console.error('Get results error:', error);
    throw error;
  }
};

// Check if user has voted
export const hasUserVoted = async (electionId, address) => {
  try {
    const contract = await getContract();
    return await contract.hasAddressVoted(electionId, address);
  } catch (error) {
    console.error('Check voted error:', error);
    return false;
  }
};

// Delete election
export const deleteElection = async (electionId) => {
  try {
    const contract = await getContract();
    
    const tx = await contract.deleteElection(electionId);
    const receipt = await tx.wait();
    
    return receipt;
  } catch (error) {
    console.error('Delete election error:', error);
    throw error;
  }
};

export default {
  initProvider,
  connectWallet,
  getContract,
  getCurrentAccount,
  getBalance,
  onAccountsChanged,
  onChainChanged,
  createElection,
  castVote,
  getElectionDetails,
  getElectionResults,
  hasUserVoted,
  deleteElection
};
