const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { ethers } = require('ethers');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const { emitVoteUpdate, emitElectionStatusChange, emitNewElection, emitElectionDeleted } = require('../services/socketService');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// In-memory cache for elections (simple caching)
const electionCache = {
  data: null,
  timestamp: null,
  ttl: 5000 // 5 seconds cache
};

// Voting queue to handle concurrent votes
const votingQueue = new Map();

// Middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Invalid token' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

// Get blockchain contract instance
function getContract() {
  try {
    // Try to load contract from JSON file first
    let contractAddress = process.env.CONTRACT_ADDRESS;
    let contractABI;
    
    try {
      const contractData = require('../contracts/VotingSystem.json');
      if (contractData.address) {
        contractAddress = contractData.address;
      }
      contractABI = contractData.abi;
    } catch (err) {
      console.warn('Could not load contract from JSON file:', err.message);
    }
    
    // Validate contract address
    if (!contractAddress || contractAddress.trim() === '' || !ethers.isAddress(contractAddress)) {
      throw new Error(`Invalid contract address: "${contractAddress}". Please run start-all.bat to deploy the contract.`);
    }
    
    const provider = new ethers.JsonRpcProvider(process.env.HARDHAT_NETWORK_URL || 'http://127.0.0.1:8545');
    
    // For read operations, we don't need a wallet
    if (!contractABI) {
      throw new Error('Contract ABI not found. Please deploy the contract first.');
    }
    
    const contract = new ethers.Contract(contractAddress, contractABI, provider);
    
    return contract;
  } catch (error) {
    console.error('Error initializing contract:', error.message);
    throw error;
  }
}

// Create election (Admin only)
router.post('/create', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { title, description, candidates, startTime, endTime } = req.body;

    if (!title || !candidates || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (candidates.length < 2 || candidates.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Must have between 2 and 50 candidates'
      });
    }

    const contract = getContract();
    // Use local Hardhat signer for write transactions (no private key in .env)
    const provider = new ethers.JsonRpcProvider(process.env.HARDHAT_NETWORK_URL || 'http://127.0.0.1:8545');
    const signer = await provider.getSigner(0);
    const contractWithSigner = contract.connect(signer);

    // Create election per current ABI: (title, description, start, end)
    const tx = await contractWithSigner.createElection(
      title,
      description || '',
      Math.floor(new Date(startTime).getTime() / 1000),
      Math.floor(new Date(endTime).getTime() / 1000)
    );

    const receipt = await tx.wait();
    const event = receipt.logs.find(log => {
      try {
        return contract.interface.parseLog(log).name === 'ElectionCreated';
      } catch {
        return false;
      }
    });

    const electionId = event ? contract.interface.parseLog(event).args[0].toString() : null;

    // Add candidates via addCandidate while election is UPCOMING
    if (electionId) {
      for (const c of candidates) {
        const atx = await contractWithSigner.addCandidate(Number(electionId), c.name, c.imageUrl || '');
        await atx.wait();
      }
    }

    res.json({
      success: true,
      message: 'Election created successfully',
      electionId,
      transactionHash: receipt.hash
    });

  } catch (error) {
    console.error('Create election error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating election',
      error: error.message
    });
  }
});

// Get all elections with caching
router.get('/all', async (req, res) => {
  try {
    // Check cache first
    const now = Date.now();
    if (electionCache.data && electionCache.timestamp && (now - electionCache.timestamp < electionCache.ttl)) {
      return res.json({
        success: true,
        elections: electionCache.data,
        cached: true
      });
    }

    const contract = getContract();
    const totalElections = await contract.getTotalElections();
    
    const elections = [];
    const promises = [];
    
    // Fetch elections in parallel for better performance
    for (let i = 1; i <= totalElections; i++) {
      promises.push(
        contract.getElection(i)
          .then(async election => {
            // Current getElection: [id, title, description, startTime, endTime, status, candidateCount]
            const id = election[0].toString();
            const cand = await contract.getCandidates(id);
            const totalVotes = cand.reduce((s, c) => s + Number(c.voteCount), 0);
            return {
              id,
              title: election[1],
              description: election[2],
              startTime: new Date(Number(election[3]) * 1000),
              endTime: new Date(Number(election[4]) * 1000),
              status: ['Upcoming', 'Active', 'Closed'][Number(election[5])],
              totalVotes: totalVotes.toString(),
              candidateCount: Number(election[6]).toString()
            };
          })
          .catch(() => null) // Election might be deleted
      );
    }

    const results = await Promise.all(promises);
    elections.push(...results.filter(e => e !== null));

    // Update cache
    electionCache.data = elections;
    electionCache.timestamp = now;

    res.json({
      success: true,
      elections
    });

  } catch (error) {
    console.error('Get elections error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching elections',
      error: error.message
    });
  }
});

// Get election details
router.get('/:id', async (req, res) => {
  try {
    const contract = getContract();
    const electionId = req.params.id;

    const election = await contract.getElection(electionId);
    const candidates = await contract.getCandidates(electionId);
    const totalVotes = candidates.reduce((s, c) => s + Number(c.voteCount), 0);

    res.json({
      success: true,
      election: {
        id: election[0].toString(),
        title: election[1],
        description: election[2],
        startTime: new Date(Number(election[3]) * 1000),
        endTime: new Date(Number(election[4]) * 1000),
        status: ['Upcoming', 'Active', 'Closed'][Number(election[5])],
        totalVotes: totalVotes.toString(),
        candidateCount: Number(election[6]).toString()
      },
      candidates: candidates.map(c => ({
        name: c.name,
        imageUrl: c.imageUrl,
        voteCount: c.voteCount.toString()
      }))
    });

  } catch (error) {
    console.error('Get election error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching election',
      error: error.message
    });
  }
});

// Delete election (Admin only)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const contract = getContract();
    const electionId = req.params.id;

    const tx = await contract.deleteElection(electionId);
    await tx.wait();

    res.json({
      success: true,
      message: 'Election deleted successfully'
    });

  } catch (error) {
    console.error('Delete election error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting election',
      error: error.message
    });
  }
});

// Cast vote with concurrent support
router.post('/vote', authenticateToken, async (req, res) => {
  const voteId = `${req.userId}-${req.body.electionId}`;
  
  try {
    // Check if this user is already voting (prevent duplicate submissions)
    if (votingQueue.has(voteId)) {
      return res.status(429).json({
        success: false,
        message: 'Vote already in progress. Please wait.'
      });
    }

    // Add to voting queue
    votingQueue.set(voteId, Date.now());

    const { electionId, candidateIndex } = req.body;

    // Validate inputs
    if (!electionId || candidateIndex === undefined) {
      votingQueue.delete(voteId);
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      votingQueue.delete(voteId);
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.isVerified) {
      votingQueue.delete(voteId);
      return res.status(400).json({
        success: false,
        message: 'Please register your face first'
      });
    }

    if (!user.walletAddress) {
      votingQueue.delete(voteId);
      return res.status(400).json({
        success: false,
        message: 'Please connect your wallet first'
      });
    }

    // Check if already voted
    const hasVoted = user.votedElections.some(v => v.electionId === electionId);
    if (hasVoted) {
      votingQueue.delete(voteId);
      return res.status(400).json({
        success: false,
        message: 'You have already voted in this election'
      });
    }

    const contract = getContract();
    const provider = new ethers.JsonRpcProvider(process.env.HARDHAT_NETWORK_URL || 'http://127.0.0.1:8545');
    // Use local Hardhat signer account
    const signer = await provider.getSigner(0);
    const contractWithSigner = contract.connect(signer);

    // Cast vote on blockchain
    // Compute Aadhaar hash server-side to avoid exposing sensitive data on client
    const aadhaarHash = user.getAadhaarHash();
    const tx = await contractWithSigner.vote(electionId, candidateIndex, aadhaarHash);
    const receipt = await tx.wait();

    // Update user's voted elections in database
    user.votedElections.push({
      electionId,
      timestamp: new Date()
    });
    await user.save();

    // Clear cache to force refresh
    electionCache.data = null;

    // Emit real-time update
    emitVoteUpdate(electionId, {
      candidateIndex,
      totalVotes: (await contract.getElection(electionId))[5].toString()
    });

    // Send confirmation email (non-blocking)
    sendVoteConfirmationEmail(user, electionId).catch(err => 
      console.error('Email error:', err)
    );

    // Remove from queue
    votingQueue.delete(voteId);

    res.json({
      success: true,
      message: 'Vote cast successfully',
      transactionHash: receipt.hash
    });

  } catch (error) {
    // Remove from queue on error
    votingQueue.delete(voteId);
    
    console.error('Vote error:', error);
    res.status(500).json({
      success: false,
      message: 'Error casting vote',
      error: error.message
    });
  }
});

// Get election results
router.get('/:id/results', async (req, res) => {
  try {
    const contract = getContract();
    const electionId = req.params.id;

    const election = await contract.getElection(electionId);
    const cand = await contract.getCandidates(electionId);
    const totalVotes = cand.reduce((s, c) => s + Number(c.voteCount), 0);

    const candidates = cand.map(c => ({
      name: c.name,
      imageUrl: c.imageUrl,
      voteCount: c.voteCount.toString(),
      percentage: totalVotes > 0 ? ((Number(c.voteCount) / totalVotes) * 100).toFixed(2) : '0.00'
    }));

    // Sort by vote count (descending)
    candidates.sort((a, b) => Number(b.voteCount) - Number(a.voteCount));

    res.json({
      success: true,
      results: {
        electionId,
        title: election[1],
        totalVotes: totalVotes.toString(),
        candidates
      }
    });

  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching results',
      error: error.message
    });
  }
});

// Send vote confirmation email
async function sendVoteConfirmationEmail(user, electionId) {
  try {
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: 'Vote Confirmation - Voting dApp',
      html: `
        <h2>Vote Confirmation</h2>
        <p>Dear ${user.name},</p>
        <p>Your vote has been successfully recorded for Election ID: ${electionId}</p>
        <p>Timestamp: ${new Date().toLocaleString()}</p>
        <p>Thank you for participating in the democratic process!</p>
        <br>
        <p>Best regards,<br>Voting dApp Team</p>
      `
    });
  } catch (error) {
    console.error('Email error:', error);
  }
}

module.exports = router;
