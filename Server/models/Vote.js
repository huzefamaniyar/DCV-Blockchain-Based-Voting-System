const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  election: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Election',
    required: true
  },
  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  aadhaarHash: {
    type: String,
    required: true
  },
  transactionHash: {
    type: String,
    required: true
  },
  blockNumber: {
    type: Number,
    required: true
  },
  votedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create a compound index to ensure one vote per user per election
voteSchema.index({ election: 1, user: 1 }, { unique: true });

// Create a compound index for aadhaar to prevent duplicate votes
voteSchema.index({ election: 1, aadhaarHash: 1 }, { unique: true });

// Create index for faster lookups
voteSchema.index({ transactionHash: 1 }, { unique: true });
voteSchema.index({ user: 1 });
voteSchema.index({ election: 1, candidate: 1 });

// Static method to get election results
voteSchema.statics.getElectionResults = async function(electionId) {
  return this.aggregate([
    { $match: { election: mongoose.Types.ObjectId(electionId) } },
    {
      $group: {
        _id: '$candidate',
        votes: { $sum: 1 },
        voters: { $push: '$user' }
      }
    },
    { $sort: { votes: -1 } }
  ]);
};

// Static method to check if user has voted in an election
voteSchema.statics.hasVoted = function(electionId, userId) {
  return this.exists({ 
    election: electionId, 
    user: userId 
  });
};

// Static method to get voter participation stats
voteSchema.statics.getVoterStats = async function(electionId) {
  const result = await this.aggregate([
    { $match: { election: mongoose.Types.ObjectId(electionId) } },
    {
      $group: {
        _id: null,
        totalVotes: { $sum: 1 },
        uniqueVoters: { $addToSet: '$user' }
      }
    },
    {
      $project: {
        _id: 0,
        totalVotes: 1,
        uniqueVoterCount: { $size: '$uniqueVoters' }
      }
    }
  ]);
  
  return result[0] || { totalVotes: 0, uniqueVoterCount: 0 };
};

const Vote = mongoose.model('Vote', voteSchema);

module.exports = Vote;
