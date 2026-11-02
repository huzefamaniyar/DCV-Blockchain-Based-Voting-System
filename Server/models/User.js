const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  age: {
    type: Number,
    required: true,
    min: 18
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  aadhaarNumber: {
    type: String,
    required: true,
    unique: true,
    minlength: 12,
    maxlength: 12
  },
  address: {
    type: String,
    required: true
  },
  wardNumber: {
    type: String,
    required: true
  },
  faceDescriptor: {
    type: Array,
    default: null
  },
  faceImage: {
    type: String, // Cloudinary URL
    default: null
  },
  walletAddress: {
    type: String,
    default: null
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  votedElections: [{
    electionId: String,
    timestamp: Date
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Hash Aadhaar for blockchain
userSchema.methods.getAadhaarHash = function() {
  return bcrypt.hashSync(this.aadhaarNumber, 10);
};

module.exports = mongoose.model('User', userSchema);
