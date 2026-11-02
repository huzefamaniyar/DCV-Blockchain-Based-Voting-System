const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  voteCount: {
    type: Number,
    default: 0
  }
}, { _id: true });

const electionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        return value > this.startTime;
      },
      message: 'End time must be after start time'
    }
  },
  status: {
    type: String,
    enum: ['upcoming', 'active', 'completed'],
    default: 'upcoming'
  },
  candidates: [candidateSchema],
  voters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  blockchainElectionId: {
    type: Number,
    default: -1
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
electionSchema.index({ status: 1 });
electionSchema.index({ startTime: 1 });
electionSchema.index({ endTime: 1 });

// Virtual for checking if election is active
electionSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.startTime <= now && this.endTime >= now && this.status === 'active';
});

// Middleware to update status based on current time
electionSchema.pre('save', function(next) {
  const now = new Date();
  if (this.startTime <= now && this.endTime >= now) {
    this.status = 'active';
  } else if (this.endTime < now) {
    this.status = 'completed';
  }
  next();
});

// Static method to get active elections
electionSchema.statics.getActiveElections = function() {
  const now = new Date();
  return this.find({
    startTime: { $lte: now },
    endTime: { $gte: now },
    status: 'active'
  }).populate('createdBy', 'name email');
};

// Method to add a vote
electionSchema.methods.addVote = async function(candidateId, userId) {
  const candidate = this.candidates.id(candidateId);
  if (!candidate) {
    throw new Error('Candidate not found');
  }
  
  if (this.voters.includes(userId)) {
    throw new Error('User has already voted in this election');
  }
  
  candidate.voteCount += 1;
  this.voters.push(userId);
  
  await this.save();
  return this;
};

const Election = mongoose.model('Election', electionSchema);

module.exports = Election;
