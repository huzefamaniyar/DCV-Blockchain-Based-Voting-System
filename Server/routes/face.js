const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Register face descriptor
router.post('/register-face', authenticateToken, async (req, res) => {
  try {
    const { faceDescriptor, faceImage } = req.body;

    if (!faceDescriptor || !Array.isArray(faceDescriptor)) {
      return res.status(400).json({
        success: false,
        message: 'Valid face descriptor is required'
      });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Store face descriptor and image
    user.faceDescriptor = faceDescriptor;
    user.faceImage = faceImage;
    user.isVerified = true;

    await user.save();

    res.json({
      success: true,
      message: 'Face registered successfully',
      user: {
        id: user._id,
        name: user.name,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error('Face registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering face',
      error: error.message
    });
  }
});

// Authenticate using face recognition
router.post('/authenticate', async (req, res) => {
  try {
    const { faceDescriptor, email } = req.body;

    if (!faceDescriptor || !Array.isArray(faceDescriptor)) {
      return res.status(400).json({
        success: false,
        message: 'Valid face descriptor is required'
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.faceDescriptor || user.faceDescriptor.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No face data registered for this user'
      });
    }

    // Calculate Euclidean distance
    const distance = calculateEuclideanDistance(
      faceDescriptor,
      user.faceDescriptor
    );

    const threshold = parseFloat(process.env.FACE_MATCH_THRESHOLD) || 0.6;

    if (distance <= threshold) {
      // Face matched
      user.lastLogin = new Date();
      await user.save();

      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        message: 'Face authentication successful',
        matched: true,
        distance: distance.toFixed(4),
        confidence: ((1 - distance) * 100).toFixed(2),
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          walletAddress: user.walletAddress,
          aadhaarNumber: user.aadhaarNumber
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Face does not match',
        matched: false,
        distance: distance.toFixed(4)
      });
    }

  } catch (error) {
    console.error('Face authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Error authenticating face',
      error: error.message
    });
  }
});

// Verify face before voting
router.post('/verify-for-voting', authenticateToken, async (req, res) => {
  try {
    const { faceDescriptor } = req.body;

    if (!faceDescriptor || !Array.isArray(faceDescriptor)) {
      return res.status(400).json({
        success: false,
        message: 'Valid face descriptor is required'
      });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.faceDescriptor || user.faceDescriptor.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No face data registered'
      });
    }

    const distance = calculateEuclideanDistance(
      faceDescriptor,
      user.faceDescriptor
    );

    const threshold = parseFloat(process.env.FACE_MATCH_THRESHOLD) || 0.6;

    if (distance <= threshold) {
      res.json({
        success: true,
        message: 'Face verified successfully',
        verified: true,
        aadhaarHash: user.getAadhaarHash()
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Face verification failed',
        verified: false
      });
    }

  } catch (error) {
    console.error('Face verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying face',
      error: error.message
    });
  }
});

// Helper function to calculate Euclidean distance
function calculateEuclideanDistance(descriptor1, descriptor2) {
  if (descriptor1.length !== descriptor2.length) {
    throw new Error('Descriptors must have the same length');
  }

  let sum = 0;
  for (let i = 0; i < descriptor1.length; i++) {
    const diff = descriptor1[i] - descriptor2[i];
    sum += diff * diff;
  }

  return Math.sqrt(sum);
}

module.exports = router;
// Finalize registration only after face capture
router.post('/register-and-create', async (req, res) => {
  try {
    const { registration_token, faceDescriptor, faceImage } = req.body;

    if (!registration_token) {
      return res.status(400).json({ success: false, message: 'registration_token is required' });
    }
    if (!faceDescriptor || !Array.isArray(faceDescriptor)) {
      return res.status(400).json({ success: false, message: 'Valid face descriptor is required' });
    }

    let payload;
    try {
      payload = jwt.verify(registration_token, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ success: false, message: 'Invalid or expired registration token' });
    }

    if (!payload || payload.type !== 'registration' || !payload.data) {
      return res.status(400).json({ success: false, message: 'Invalid registration payload' });
    }

    const { name, email, password, age, gender, aadhaarNumber, address, wardNumber } = payload.data;

    // Check duplicates now
    const existingUser = await User.findOne({ $or: [{ email }, { aadhaarNumber }] });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email or Aadhaar already exists' });
    }

    // Determine role: first user becomes admin
    const userCount = await User.countDocuments();
    const role = userCount === 0 ? 'admin' : 'user';

    // Create user with face data
    const user = new User({
      name,
      email,
      password,
      age,
      gender,
      aadhaarNumber,
      address,
      wardNumber,
      role,
      faceDescriptor,
      faceImage,
      isVerified: true
    });

    await user.save();

    // Return auth token
    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    return res.status(201).json({
      success: true,
      message: 'Registration completed with face verification',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        walletAddress: user.walletAddress,
        aadhaarNumber: user.aadhaarNumber
      }
    });
  } catch (error) {
    console.error('Register-and-create error:', error);
    res.status(500).json({ success: false, message: 'Error completing registration', error: error.message });
  }
});
