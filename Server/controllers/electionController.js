const { ethers } = require('ethers');
const Election = require('../models/Election');
const Vote = require('../models/Vote');
const { successResponse, errorResponse, validationError } = require('../utils/responseHelper');
const { getContract } = require('../services/blockchainService');

// @desc    Create a new election
// @route   POST /api/elections
// @access  Admin
exports.createElection = async (req, res) => {
  try {
    const { title, description, startTime, endTime, candidates } = req.body;
    const userId = req.user._id;

    // Basic validation
    if (!title || !description || !startTime || !endTime || !candidates || candidates.length < 2) {
      return errorResponse(res, 'Please provide all required fields', 400);
    }

    // Check if end time is after start time
    if (new Date(endTime) <= new Date(startTime)) {
      return errorResponse(res, 'End time must be after start time', 400);
    }

    // Format candidates
    const formattedCandidates = candidates.map((candidate, index) => ({
      _id: new require('mongoose').Types.ObjectId(),
      name: candidate.name,
      imageUrl: candidate.imageUrl,
      description: candidate.description || '',
      voteCount: 0
    }));

    // Create election in database
    const election = new Election({
      title,
      description,
      startTime,
      endTime,
      candidates: formattedCandidates,
      createdBy: userId
    });

    // Deploy to blockchain
    try {
      const contract = await getContract();
      const tx = await contract.createElection(
        title,
        description,
        Math.floor(new Date(startTime).getTime() / 1000), // Convert to Unix timestamp
        Math.floor(new Date(endTime).getTime() / 1000)    // Convert to Unix timestamp
      );
      
      const receipt = await tx.wait();
      const event = receipt.events?.find(e => e.event === 'ElectionCreated');
      const electionId = event?.args?.electionId.toNumber();
      
      if (!electionId && electionId !== 0) {
        throw new Error('Failed to get election ID from blockchain');
      }
      
      // Update election with blockchain ID
      election.blockchainElectionId = electionId;
      
      // Add candidates to blockchain
      for (const candidate of candidates) {
        await contract.addCandidate(electionId, candidate.name, candidate.imageUrl);
      }
      
    } catch (blockchainError) {
      console.error('Blockchain error:', blockchainError);
      return errorResponse(res, 'Failed to create election on blockchain', 500);
    }

    await election.save();
    
    successResponse(res, { election }, 'Election created successfully', 201);
    
  } catch (err) {
    console.error('Error creating election:', err);
    errorResponse(res, 'Server error while creating election', 500);
  }
};

// @desc    Get all elections
// @route   GET /api/elections
// @access  Public
exports.getElections = async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    
    if (status && ['upcoming', 'active', 'completed'].includes(status)) {
      query.status = status;
    }
    
    const elections = await Election.find(query)
      .populate('createdBy', 'name email')
      .sort({ startTime: -1 });
      
    successResponse(res, { elections });
    
  } catch (err) {
    console.error('Error fetching elections:', err);
    errorResponse(res, 'Server error while fetching elections', 500);
  }
};

// @desc    Get single election
// @route   GET /api/elections/:id
// @access  Public
exports.getElection = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('voters', 'name email');
      
    if (!election) {
      return errorResponse(res, 'Election not found', 404);
    }
    
    successResponse(res, { election });
    
  } catch (err) {
    console.error('Error fetching election:', err);
    errorResponse(res, 'Server error while fetching election', 500);
  }
};

// @desc    Cast a vote
// @route   POST /api/elections/:electionId/vote
// @access  Private
exports.castVote = async (req, res) => {
  const session = await Election.startSession();
  session.startTransaction();
  
  try {
    const { electionId } = req.params;
    const { candidateId } = req.body;
    const userId = req.user._id;
    
    // Get election with session for transaction
    const election = await Election.findById(electionId).session(session);
    
    if (!election) {
      await session.abortTransaction();
      session.endSession();
      return errorResponse(res, 'Election not found', 404);
    }
    
    // Check if user has already voted
    const hasVoted = await Vote.exists({ 
      election: electionId, 
      user: userId 
    }).session(session);
    
    if (hasVoted) {
      await session.abortTransaction();
      session.endSession();
      return errorResponse(res, 'You have already voted in this election', 400);
    }
    
    // Find the candidate
    const candidate = election.candidates.id(candidateId);
    if (!candidate) {
      await session.abortTransaction();
      session.endSession();
      return errorResponse(res, 'Invalid candidate', 400);
    }
    
    // Record vote in blockchain
    try {
      const contract = await getContract();
      const aadharHash = req.user.getAadhaarHash();
      
      const tx = await contract.vote(
        election.blockchainElectionId,
        candidateId,
        aadharHash,
        { gasLimit: 300000 } // Adjust gas limit as needed
      );
      
      const receipt = await tx.wait();
      
      // Create vote record
      const vote = new Vote({
        election: electionId,
        candidate: candidateId,
        user: userId,
        aadharHash,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber
      });
      
      // Update candidate vote count
      candidate.voteCount += 1;
      election.voters.push(userId);
      
      // Save all changes in a transaction
      await Promise.all([
        vote.save({ session }),
        election.save({ session })
      ]);
      
      await session.commitTransaction();
      session.endSession();
      
      // Emit real-time update
      req.app.get('io').emit('voteUpdate', { 
        electionId,
        candidateId,
        voteCount: candidate.voteCount 
      });
      
      successResponse(res, { vote }, 'Vote cast successfully');
      
    } catch (blockchainError) {
      await session.abortTransaction();
      session.endSession();
      console.error('Blockchain error:', blockchainError);
      return errorResponse(res, 'Failed to record vote on blockchain', 500);
    }
    
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error casting vote:', err);
    errorResponse(res, 'Server error while casting vote', 500);
  }
};

// @desc    Get election results
// @route   GET /api/elections/:id/results
// @access  Public
exports.getElectionResults = async (req, res) => {
  try {
    const { id } = req.params;
    
    const election = await Election.findById(id)
      .select('title description startTime endTime status candidates')
      .populate('candidates', 'name imageUrl voteCount');
      
    if (!election) {
      return errorResponse(res, 'Election not found', 404);
    }
    
    // Get vote statistics
    const voteStats = await Vote.aggregate([
      { $match: { election: election._id } },
      {
        $group: {
          _id: '$candidate',
          votes: { $sum: 1 }
        }
      }
    ]);
    
    // Format results
    const results = {
      election: {
        _id: election._id,
        title: election.title,
        description: election.description,
        startTime: election.startTime,
        endTime: election.endTime,
        status: election.status,
        totalVotes: voteStats.reduce((sum, stat) => sum + stat.votes, 0),
        candidates: election.candidates.map(candidate => ({
          _id: candidate._id,
          name: candidate.name,
          imageUrl: candidate.imageUrl,
          voteCount: candidate.voteCount,
          percentage: voteStats.length > 0 
            ? (voteStats.find(s => s._id.toString() === candidate._id.toString())?.votes || 0) / 
              voteStats.reduce((sum, stat) => sum + stat.votes, 1) * 100
            : 0
        })).sort((a, b) => b.voteCount - a.voteCount)
      }
    };
    
    successResponse(res, results);
    
  } catch (err) {
    console.error('Error fetching election results:', err);
    errorResponse(res, 'Server error while fetching results', 500);
  }
};

// @desc    Delete an election
// @route   DELETE /api/elections/:id
// @access  Admin
exports.deleteElection = async (req, res) => {
  try {
    const { id } = req.params;
    
    const election = await Election.findById(id);
    
    if (!election) {
      return errorResponse(res, 'Election not found', 404);
    }
    
    // Check if election can be deleted
    if (election.status === 'active') {
      return errorResponse(res, 'Cannot delete an active election', 400);
    }
    
    // Delete from blockchain if it exists there
    if (election.blockchainElectionId !== -1) {
      try {
        const contract = await getContract();
        await contract.deleteElection(election.blockchainElectionId);
      } catch (blockchainError) {
        console.error('Blockchain error during deletion:', blockchainError);
        // Continue with database deletion even if blockchain deletion fails
      }
    }
    
    // Delete related votes
    await Vote.deleteMany({ election: id });
    
    // Delete the election
    await Election.findByIdAndDelete(id);
    
    successResponse(res, null, 'Election deleted successfully');
    
  } catch (err) {
    console.error('Error deleting election:', err);
    errorResponse(res, 'Server error while deleting election', 500);
  }
};
