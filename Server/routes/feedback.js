const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Feedback = require('../models/Feedback');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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

// Submit feedback
router.post('/submit', authenticateToken, async (req, res) => {
  try {
    const { subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Subject and message are required'
      });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const feedback = new Feedback({
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      subject,
      message
    });

    await feedback.save();

    res.json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback: {
        id: feedback._id,
        subject: feedback.subject,
        status: feedback.status,
        createdAt: feedback.createdAt
      }
    });

  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting feedback',
      error: error.message
    });
  }
});

// Get all feedback (Admin only)
router.get('/all', authenticateToken, async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const feedbacks = await Feedback.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      feedbacks
    });

  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching feedback',
      error: error.message
    });
  }
});

// Get user's feedback
router.get('/my-feedback', authenticateToken, async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ userId: req.userId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      feedbacks
    });

  } catch (error) {
    console.error('Get user feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching feedback',
      error: error.message
    });
  }
});

// Update feedback status (Admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { status, adminResponse } = req.body;
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    if (status) feedback.status = status;
    if (adminResponse) feedback.adminResponse = adminResponse;
    feedback.updatedAt = new Date();

    await feedback.save();

    res.json({
      success: true,
      message: 'Feedback updated successfully',
      feedback
    });

  } catch (error) {
    console.error('Update feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating feedback',
      error: error.message
    });
  }
});

module.exports = router;
