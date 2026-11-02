import { ethers } from 'ethers';

// Get provider from MetaMask
export const getProvider = () => {
  if (!window.ethereum) throw new Error('MetaMask not available');
  return new ethers.BrowserProvider(window.ethereum);
};

export const getSigner = async () => {
  const provider = getProvider();
  return await provider.getSigner();
};

// Minimal ABI for Voting.sol we need on the client
export const VOTING_ABI = [
  {
    "inputs": [],
    "name": "admin",
    "outputs": [{"internalType":"address","name":"","type":"address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType":"string","name":"_title","type":"string"},
      {"internalType":"string","name":"_description","type":"string"},
      {"internalType":"uint256","name":"_startTime","type":"uint256"},
      {"internalType":"uint256","name":"_endTime","type":"uint256"}
    ],
    "name":"createElection",
    "outputs":[{"internalType":"uint256","name":"","type":"uint256"}],
    "stateMutability":"nonpayable",
    "type":"function"
  },
  {
    "inputs":[{"internalType":"uint256","name":"_electionId","type":"uint256"},{"internalType":"string","name":"_name","type":"string"},{"internalType":"string","name":"_imageUrl","type":"string"}],
    "name":"addCandidate",
    "outputs":[],
    "stateMutability":"nonpayable",
    "type":"function"
  },
  {
    "inputs":[],
    "name":"electionCount",
    "outputs":[{"internalType":"uint256","name":"","type":"uint256"}],
    "stateMutability":"view",
    "type":"function"
  },
  {
    "inputs":[{"internalType":"uint256","name":"_electionId","type":"uint256"}],
    "name":"updateElectionStatus",
    "outputs":[],
    "stateMutability":"nonpayable",
    "type":"function"
  },
  {
    "inputs":[{"internalType":"uint256","name":"_electionId","type":"uint256"}],
    "name":"deleteElection",
    "outputs":[],
    "stateMutability":"nonpayable",
    "type":"function"
  }
];

export const getVotingContract = async () => {
  const address = import.meta.env.VITE_VOTING_ADDRESS;
  if (!address) throw new Error('VITE_VOTING_ADDRESS not configured');
  const signer = await getSigner();
  return new ethers.Contract(address, VOTING_ABI, signer);
};
