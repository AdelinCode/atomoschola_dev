import express from 'express';
import InviteCode from '../models/InviteCode.js';
import { protect, authorize } from '../middleware/auth.js';
import generateInviteCode from '../utils/generateInviteCode.js';

const router = express.Router();

// @route   POST /api/invite-codes
// @desc    Create invite code (owner only)
// @access  Private/Owner
router.post('/', protect, authorize('owner'), async (req, res) => {
  try {
    const { userType, expiresInDays } = req.body;

    if (!['creator', 'editor'].includes(userType)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user type. Must be creator or editor' 
      });
    }

    const code = generateInviteCode();
    
    const inviteCode = await InviteCode.create({
      code,
      userType,
      createdBy: req.user._id,
      expiresAt: expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : null
    });

    res.status(201).json({
      success: true,
      data: inviteCode
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/invite-codes
// @desc    Get all invite codes (owner only)
// @access  Private/Owner
router.get('/', protect, authorize('owner'), async (req, res) => {
  try {
    const inviteCodes = await InviteCode.find()
      .populate('createdBy', 'username email')
      .populate('usedBy', 'username email')
      .sort('-createdAt');

    res.json({
      success: true,
      count: inviteCodes.length,
      data: inviteCodes
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/invite-codes/:id
// @desc    Delete invite code (owner only)
// @access  Private/Owner
router.delete('/:id', protect, authorize('owner'), async (req, res) => {
  try {
    const inviteCode = await InviteCode.findById(req.params.id);

    if (!inviteCode) {
      return res.status(404).json({ 
        success: false, 
        message: 'Invite code not found' 
      });
    }

    await inviteCode.deleteOne();

    res.json({
      success: true,
      message: 'Invite code deleted'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/invite-codes/validate
// @desc    Validate invite code
// @access  Public
router.post('/validate', async (req, res) => {
  try {
    const { code } = req.body;

    const inviteCode = await InviteCode.findOne({ code, isUsed: false });

    if (!inviteCode) {
      return res.status(404).json({ 
        success: false, 
        message: 'Invalid or already used invite code' 
      });
    }

    if (inviteCode.expiresAt && new Date() > inviteCode.expiresAt) {
      return res.status(400).json({ 
        success: false, 
        message: 'This invite code has expired' 
      });
    }

    res.json({
      success: true,
      data: {
        userType: inviteCode.userType,
        valid: true
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
