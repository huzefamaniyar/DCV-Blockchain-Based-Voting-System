// API Configuration
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// Blockchain Configuration
export const HARDHAT_NETWORK = {
  chainId: '0x539', // 1337 in hex
  chainName: 'Hardhat Local',
  rpcUrls: ['http://127.0.0.1:8545'],
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18
  }
};

// Face Recognition Configuration
export const FACE_API_CONFIG = {
  modelUrl: `${import.meta.env.BASE_URL || '/'}models`,
  minConfidence: 0.5,
  matchThreshold: 0.6
};

// App Configuration
export const APP_CONFIG = {
  appName: 'Decentralized Voting dApp',
  maxCandidates: 50,
  minCandidates: 2,
  minAge: 18,
  aadhaarLength: 12
};
