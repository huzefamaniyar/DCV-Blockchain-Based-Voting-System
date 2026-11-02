const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { errorResponse } = require('../utils/responseHelper');

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to verify JWT token
exports.authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return errorResponse(res, 'No token, authorization denied', 401);
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Add user from payload
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Authentication error:', err);
    if (err.name === 'JsonWebTokenError') {
      return errorResponse(res, 'Invalid token', 401);
    } else if (err.name === 'TokenExpiredError') {
      return errorResponse(res, 'Token expired', 401);
    }
    errorResponse(res, 'Server error during authentication', 500);
  }
};

// Middleware to check admin role
exports.authorizeAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    errorResponse(res, 'Admin access required', 403);
  }
};

// Middleware to check if user has voted in an election
exports.checkVoteEligibility = async (req, res, next) => {
  try {
    const { electionId } = req.params;
    const userId = req.user._id;
    
    const hasVoted = await req.app.locals.db.models.Vote.exists({ 
      election: electionId, 
      user: userId 
    });
    
    if (hasVoted) {
      return errorResponse(res, 'You have already voted in this election', 400);
    }
    
    next();
  } catch (err) {
    console.error('Vote eligibility check error:', err);
    errorResponse(res, 'Error checking vote eligibility', 500);
  }
};

// Middleware to check if election is active
exports.checkElectionStatus = async (req, res, next) => {
  try {
    const { electionId } = req.params;
    const election = await req.app.locals.db.models.Election.findById(electionId);
    
    if (!election) {
      return errorResponse(res, 'Election not found', 404);
    }
    
    const now = new Date();
    if (election.startTime > now) {
      return errorResponse(res, 'Voting has not started yet', 400);
    }
    
    if (election.endTime < now || election.status === 'completed') {
      return errorResponse(res, 'Voting has ended', 400);
    }
    
    if (election.status !== 'active') {
      return errorResponse(res, 'Election is not active', 400);
    }
    
    req.election = election;
    next();
  } catch (err) {
    console.error('Election status check error:', err);
    errorResponse(res, 'Error checking election status', 500);
  }
};
