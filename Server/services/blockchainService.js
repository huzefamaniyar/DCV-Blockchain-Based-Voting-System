const { ethers } = require('ethers');
const VotingABI = require('../../Frontend/src/contracts/Voting.json');
const contractAddresses = require('../../Frontend/src/contracts/contract-address.json');

let contractInstance = null;
let provider = null;
let signer = null;

/**
 * Initialize the blockchain service with a provider and signer
 */
const initBlockchainService = async () => {
  try {
    // Use MetaMask provider if available, otherwise use default provider
    if (window.ethereum) {
      await window.ethereum.enable();
      provider = new ethers.BrowserProvider(window.ethereum);
      signer = await provider.getSigner();
    } else {
      // Fallback to default provider (for development)
      provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:8545');
      // Use the first account as the default signer for development
      const accounts = await provider.listAccounts();
      if (accounts.length > 0) {
        signer = accounts[0];
      } else {
        throw new Error('No accounts available');
      }
    }
    
    // Initialize contract instance
    contractInstance = new ethers.Contract(
      contractAddresses.Voting,
      VotingABI.abi,
      signer
    );
    
    console.log('Blockchain service initialized');
    return contractInstance;
    
  } catch (error) {
    console.error('Error initializing blockchain service:', error);
    throw error;
  }
};

/**
 * Get the contract instance
 * Initializes it if not already done
 */
const getContract = async () => {
  if (!contractInstance) {
    await initBlockchainService();
  }
  return contractInstance;
};

/**
 * Get the current signer's address
 */
const getSignerAddress = async () => {
  if (!signer) {
    await initBlockchainService();
  }
  return signer.getAddress();
};

/**
 * Check if the connected wallet is the admin of the contract
 */
const isAdmin = async () => {
  try {
    const contract = await getContract();
    const admin = await contract.admin();
    const signerAddress = await getSignerAddress();
    return admin.toLowerCase() === signerAddress.toLowerCase();
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

/**
 * Get the current network ID
 */
const getNetworkId = async () => {
  if (!provider) {
    await initBlockchainService();
  }
  const network = await provider.getNetwork();
  return network.chainId;
};

/**
 * Format error messages from blockchain transactions
 */
const formatBlockchainError = (error) => {
  // Handle common MetaMask/user rejection errors
  if (error.code === 4001 || error.message.includes('user rejected')) {
    return { message: 'Transaction was rejected by user', isUserRejected: true };
  }
  
  // Handle insufficient funds
  if (error.message.includes('insufficient funds')) {
    return { message: 'Insufficient funds for transaction' };
  }
  
  // Handle revert with reason
  const revertReason = error.reason || 
    (error.data && error.data.message) || 
    error.message;
    
  return { 
    message: `Blockchain error: ${revertReason}`,
    originalError: error
  };
};

/**
 * Wait for a transaction to be mined
 */
const waitForTransaction = async (txHash) => {
  if (!provider) {
    await initBlockchainService();
  }
  return provider.waitForTransaction(txHash);
};

/**
 * Get events from the contract
 */
const getEvents = async (eventName, filter = {}, fromBlock = 0, toBlock = 'latest') => {
  const contract = await getContract();
  const filterObj = contract.filters[eventName](...Object.values(filter));
  return contract.queryFilter(filterObj, fromBlock, toBlock);
};

module.exports = {
  initBlockchainService,
  getContract,
  getSignerAddress,
  isAdmin,
  getNetworkId,
  formatBlockchainError,
  waitForTransaction,
  getEvents
};
