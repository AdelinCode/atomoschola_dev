import express from 'express';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/users/staff
// @desc    Get all staff members (owners, editors, creators)
// @access  Public
router.get('/staff', async (req, res) => {
  try {
    const staff = await User.find({
      userType: { $in: ['owner', 'editor', 'creator', 'staff'] }
    })
      .select('username email firstName lastName userType')
      .sort({ userType: 1, createdAt: 1 });

    res.json({
      success: true,
      data: staff
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/users/me
// @desc    Get current user profile
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('createdLessons')
      .populate('editedLessons')
      .populate('bookmarkedLessons');

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/users/me
// @desc    Update current user profile
// @access  Private
router.put('/me', protect, async (req, res) => {
  try {
    const { firstName, lastName, email, username } = req.body;

    const user = await User.findById(req.user._id);

    // Check if username is being changed and if it's available
    if (username && username !== user.username) {
      // Validate username format
      if (username.length < 3) {
        return res.status(400).json({ 
          success: false, 
          message: 'Username must be at least 3 characters long' 
        });
      }
      
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Username can only contain letters, numbers, and underscores' 
        });
      }
      
      const usernameExists = await User.findOne({ username });
      if (usernameExists) {
        return res.status(400).json({ 
          success: false, 
          message: 'Username already taken' 
        });
      }
      user.username = username;
    }

    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email already in use' 
        });
      }
      user.email = email;
    }

    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;

    await user.save();

    res.json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/users/me/bookmark/:lessonId
// @desc    Bookmark a lesson
// @access  Private
router.post('/me/bookmark/:lessonId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user.bookmarkedLessons.includes(req.params.lessonId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Lesson already bookmarked' 
      });
    }

    user.bookmarkedLessons.push(req.params.lessonId);
    await user.save();

    res.json({
      success: true,
      message: 'Lesson bookmarked'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/users/me/bookmark/:lessonId
// @desc    Remove bookmark
// @access  Private
router.delete('/me/bookmark/:lessonId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    user.bookmarkedLessons = user.bookmarkedLessons.filter(
      id => id.toString() !== req.params.lessonId
    );
    await user.save();

    res.json({
      success: true,
      message: 'Bookmark removed'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/users
// @desc    Get all users (owner only)
// @access  Private/Owner
router.get('/', protect, authorize('owner'), async (req, res) => {
  try {
    const users = await User.find().select('-password').sort('-createdAt');

    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/users/:id/type
// @desc    Change user type (owner only)
// @access  Private/Owner
router.put('/:id/type', protect, authorize('owner'), async (req, res) => {
  try {
    const { userType } = req.body;
    
    if (!['user', 'creator', 'editor', 'staff'].includes(userType)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user type' 
      });
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    if (user.userType === 'owner') {
      return res.status(403).json({ 
        success: false, 
        message: 'Cannot change owner type' 
      });
    }
    
    user.userType = userType;
    await user.save();
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (owner only)
// @access  Private/Owner
router.delete('/:id', protect, authorize('owner'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    if (user.userType === 'owner') {
      return res.status(403).json({ 
        success: false, 
        message: 'Cannot delete owner account' 
      });
    }
    
    await user.deleteOne();
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/users/:id/upgrade
// @desc    Upgrade user with invite code (user can upgrade themselves, owner can upgrade anyone)
// @access  Private
router.put('/:id/upgrade', protect, async (req, res) => {
  // Check if user is upgrading themselves or if they're an owner
  if (req.user._id.toString() !== req.params.id && req.user.userType !== 'owner') {
    return res.status(403).json({ 
      success: false, 
      message: 'You can only upgrade your own account' 
    });
  }
  try {
    const { userType, inviteCode } = req.body;
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    if (user.userType === 'owner') {
      return res.status(403).json({ 
        success: false, 
        message: 'Cannot upgrade owner' 
      });
    }
    
    // Validate and delete the invite code
    const InviteCode = (await import('../models/InviteCode.js')).default;
    const code = await InviteCode.findOne({ code: inviteCode, isUsed: false });
    
    if (!code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or already used invite code' 
      });
    }
    
    if (code.userType !== userType) {
      return res.status(400).json({ 
        success: false, 
        message: `This code is for ${code.userType} accounts only` 
      });
    }
    
    // Update user
    user.userType = userType;
    user.inviteCode = inviteCode;
    await user.save();
    
    // Delete the used code
    await InviteCode.findOneAndDelete({ code: inviteCode });
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
