import express from 'express';
import PasswordResetRequest from '../models/PasswordResetRequest.js';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// @route   POST /api/password-reset/request
// @desc    Create password reset request
// @access  Public
router.post('/request', async (req, res) => {
  try {
    const { email, reason } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email'
      });
    }

    // Check if there's already a pending request
    const existingRequest = await PasswordResetRequest.findOne({
      user: user._id,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending password reset request'
      });
    }

    const resetRequest = await PasswordResetRequest.create({
      user: user._id,
      email: user.email,
      reason: reason || 'Forgot password'
    });

    res.status(201).json({
      success: true,
      message: 'Password reset request submitted. An admin will review it shortly.',
      data: resetRequest
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/password-reset/requests
// @desc    Get all password reset requests (admin only)
// @access  Private/Admin
router.get('/requests', protect, authorize('staff', 'owner'), async (req, res) => {
  try {
    const requests = await PasswordResetRequest.find()
      .populate('user', 'username email userType')
      .populate('processedBy', 'username email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/password-reset/approve/:id
// @desc    Approve password reset and set new password
// @access  Private/Admin
router.put('/approve/:id', protect, authorize('staff', 'owner'), async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    const resetRequest = await PasswordResetRequest.findById(req.params.id);
    
    if (!resetRequest) {
      return res.status(404).json({
        success: false,
        message: 'Reset request not found'
      });
    }

    if (resetRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'This request has already been processed'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user password
    await User.updateOne(
      { _id: resetRequest.user },
      { $set: { password: hashedPassword } }
    );

    // Update reset request status
    resetRequest.status = 'approved';
    resetRequest.processedBy = req.user._id;
    resetRequest.processedAt = new Date();
    await resetRequest.save();

    res.json({
      success: true,
      message: 'Password reset approved and updated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/password-reset/reject/:id
// @desc    Reject password reset request
// @access  Private/Admin
router.put('/reject/:id', protect, authorize('staff', 'owner'), async (req, res) => {
  try {
    const resetRequest = await PasswordResetRequest.findById(req.params.id);
    
    if (!resetRequest) {
      return res.status(404).json({
        success: false,
        message: 'Reset request not found'
      });
    }

    if (resetRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'This request has already been processed'
      });
    }

    resetRequest.status = 'rejected';
    resetRequest.processedBy = req.user._id;
    resetRequest.processedAt = new Date();
    await resetRequest.save();

    res.json({
      success: true,
      message: 'Password reset request rejected'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
