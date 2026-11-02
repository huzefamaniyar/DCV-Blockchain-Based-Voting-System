const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Begin registration (no DB write) -> returns registration_token
router.post('/begin-registration', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      age,
      gender,
      aadhaarNumber,
      address,
      wardNumber
    } = req.body;

    // Basic validation (same rules as register)
    if (!name || !email || !password || !age || !gender || !aadhaarNumber || !address || !wardNumber) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }
    if (String(aadhaarNumber).length !== 12 || !/^\d+$/.test(String(aadhaarNumber))) {
      return res.status(400).json({ success: false, message: 'Aadhaar number must be exactly 12 digits' });
    }
    if (Number(age) < 18) {
      return res.status(400).json({ success: false, message: 'You must be at least 18 years old to register' });
    }

    // We do NOT check for existing user here to avoid leaking presence; final create will check
    // Create a short-lived registration token (e.g., 15 minutes)
    const registrationPayload = {
      name, email, password, age, gender, aadhaarNumber, address, wardNumber
    };
    const registration_token = jwt.sign(
      { type: 'registration', data: registrationPayload },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    return res.json({ success: true, registration_token });
  } catch (error) {
    console.error('Begin registration error:', error);
    res.status(500).json({ success: false, message: 'Error beginning registration', error: error.message });
  }
});

// Register new user
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      age,
      gender,
      aadhaarNumber,
      address,
      wardNumber,
      role
    } = req.body;

    // Validation
    if (!name || !email || !password || !age || !gender || !aadhaarNumber || !address || !wardNumber) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Validate Aadhaar (12 digits)
    if (aadhaarNumber.length !== 12 || !/^\d+$/.test(aadhaarNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Aadhaar number must be exactly 12 digits'
      });
    }

    // Validate age (18+)
    if (age < 18) {
      return res.status(400).json({
        success: false,
        message: 'You must be at least 18 years old to register'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { aadhaarNumber }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or Aadhaar already exists'
      });
    }

    // Check if this is the first user (make them admin)
    const userCount = await User.countDocuments();
    const userRole = userCount === 0 ? 'admin' : (role || 'user');

    // Create new user
    const user = new User({
      name,
      email,
      password,
      age,
      gender,
      aadhaarNumber,
      address,
      wardNumber,
      role: userRole
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const message = userRole === 'admin' 
      ? 'Admin account created successfully! Please register your face to complete verification.'
      : 'User registered successfully. Please register your face to complete verification.';

    res.status(201).json({
      success: true,
      message,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        aadhaarNumber: user.aadhaarNumber
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message
    });
  }
});

// Login with password
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
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
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        hasFaceData: !!user.faceDescriptor,
        walletAddress: user.walletAddress,
        aadhaarNumber: user.aadhaarNumber,
        age: user.age,
        gender: user.gender,
        address: user.address,
        wardNumber: user.wardNumber
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
});

// Verify token
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        hasFaceData: !!user.faceDescriptor,
        walletAddress: user.walletAddress,
        aadhaarNumber: user.aadhaarNumber,
        age: user.age,
        gender: user.gender,
        address: user.address,
        wardNumber: user.wardNumber,
        faceImage: user.faceImage
      }
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

// Update wallet address
router.post('/update-wallet', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { walletAddress } = req.body;

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.walletAddress = walletAddress;
    await user.save();

    res.json({
      success: true,
      message: 'Wallet address updated successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating wallet address',
      error: error.message
    });
  }
});

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password -faceDescriptor');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
});

module.exports = router;
