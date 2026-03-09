import express from 'express';
import User from '../models/User.js';
import PendingRequest from '../models/PendingRequest.js';
import Notification from '../models/Notification.js';
import Subject from '../models/Subject.js';
import Domain from '../models/Domain.js';
import Category from '../models/Category.js';
import Lesson from '../models/Lesson.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/commission/members
// @desc    Get all commission members (creator and editor)
// @access  Public
router.get('/members', async (req, res) => {
  try {
    const creatorMembers = await User.find({ isCreatorCommissionMember: true })
      .select('username email firstName lastName userType')
      .sort({ createdAt: 1 });

    const editorMembers = await User.find({ isEditorCommissionMember: true })
      .select('username email firstName lastName userType')
      .sort({ createdAt: 1 });

    // Add commissionType to each member
    const creatorMembersWithType = creatorMembers.map(member => ({
      ...member.toObject(),
      commissionType: 'creator'
    }));

    const editorMembersWithType = editorMembers.map(member => ({
      ...member.toObject(),
      commissionType: 'editor'
    }));

    // Combine both arrays
    const allMembers = [...creatorMembersWithType, ...editorMembersWithType];

    res.json({
      success: true,
      count: allMembers.length,
      data: allMembers
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/commission/toggle/:userId
// @desc    Toggle creator commission membership (owner only)
// @access  Private/Owner
router.put('/toggle/:userId', protect, authorize('owner'), async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Check if user is creator, editor, or staff
    if (!['creator', 'editor', 'staff'].includes(user.userType)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Only creators, editors, and staff can be creator commission members' 
      });
    }

    // Check commission size limit
    if (!user.isCreatorCommissionMember) {
      const currentCount = await User.countDocuments({ isCreatorCommissionMember: true });
      if (currentCount >= 7) {
        return res.status(400).json({ 
          success: false, 
          message: 'Creator commission is full (maximum 7 members)' 
        });
      }
    }

    user.isCreatorCommissionMember = !user.isCreatorCommissionMember;
    await user.save();

    res.json({
      success: true,
      message: user.isCreatorCommissionMember ? 'User added to creator commission' : 'User removed from creator commission',
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/commission/pending-requests
// @desc    Get pending requests for commission voting
// @access  Private (commission members only)
router.get('/pending-requests', protect, async (req, res) => {
  try {
    // Check if user is creator commission member
    if (!req.user.isCreatorCommissionMember) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Creator commission members only.' 
      });
    }

    const requests = await PendingRequest.find({ 
      status: 'pending',
      requiresCommissionVote: true
    })
      .populate('requestedBy', 'username email firstName lastName userType')
      .populate('votes.user', 'username')
      .sort('-createdAt');

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/commission/vote/:requestId
// @desc    Vote on a pending request
// @access  Private (commission members only)
router.post('/vote/:requestId', protect, async (req, res) => {
  try {
    // Check if user is creator commission member
    if (!req.user.isCreatorCommissionMember) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Creator commission members only.' 
      });
    }

    const { vote } = req.body;

    if (!['yes', 'no'].includes(vote)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vote must be "yes" or "no"' 
      });
    }

    const request = await PendingRequest.findById(req.params.requestId);

    if (!request) {
      return res.status(404).json({ 
        success: false, 
        message: 'Request not found' 
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: 'Request already processed' 
      });
    }

    // Check if user already voted
    const existingVote = request.votes.find(
      v => v.user.toString() === req.user._id.toString()
    );

    if (existingVote) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have already voted on this request' 
      });
    }

    // Add vote
    request.votes.push({
      user: req.user._id,
      vote: vote,
      votedAt: new Date()
    });

    await request.save();

    // Check if all commission members have voted
    const commissionCount = await User.countDocuments({ isCreatorCommissionMember: true });
    
    // Commission must have exactly 7 members
    if (commissionCount < 7) {
      return res.json({
        success: true,
        message: 'Vote recorded. Note: Creator commission needs 7 members to make decisions.',
        votesCount: request.votes.length,
        totalNeeded: 7,
        currentCommissionSize: commissionCount
      });
    }
    
    // Check if all 7 members have voted
    if (request.votes.length >= 7) {
      // Count votes
      const yesVotes = request.votes.filter(v => v.vote === 'yes').length;
      const noVotes = request.votes.filter(v => v.vote === 'no').length;

      // Majority decision (need at least 4 YES votes to approve)
      if (yesVotes >= 4) {
        // Approve request
        let createdResource;

        if (request.type === 'domain') {
          const domain = await Domain.create(request.data);
          if (request.data.subject) {
            await Subject.findByIdAndUpdate(request.data.subject, {
              $push: { domains: domain._id }
            });
          }
          createdResource = domain;
        } else if (request.type === 'category') {
          const category = await Category.create(request.data);
          if (request.data.domain) {
            await Domain.findByIdAndUpdate(request.data.domain, {
              $push: { categories: category._id }
            });
          }
          createdResource = category;
        } else if (request.type === 'lesson') {
          const lessonData = { ...request.data, status: 'published' };
          const lesson = await Lesson.create(lessonData);
          if (request.data.category) {
            await Category.findByIdAndUpdate(request.data.category, {
              $push: { lessons: lesson._id }
            });
          }
          if (request.requestedBy) {
            const requestUser = await User.findById(request.requestedBy);
            
            // Add lesson to user's created lessons
            await User.findByIdAndUpdate(request.requestedBy, {
              $push: { createdLessons: lesson._id }
            });
            
            // Promote editor to creator if they had an editor role
            if (requestUser && requestUser.userType === 'editor') {
              requestUser.userType = 'creator';
              await requestUser.save();
              
              // Add notification about promotion
              await Notification.create({
                user: request.requestedBy,
                type: 'lesson_approved',
                title: 'Promoted to Creator!',
                message: `Congratulations! Your lesson "${request.data.title}" was approved and you have been promoted to Creator!`,
                relatedItem: lesson._id,
                relatedModel: 'Lesson',
                isRead: false
              });
            }
          }
          createdResource = lesson;
        }

        request.status = 'approved';
        request.reviewedAt = new Date();
        request.reviewNote = `Approved by commission vote (${yesVotes}-${noVotes})`;
        await request.save();

        // Create notification
        const notificationMessages = {
          lesson: `Your lesson "${request.data.title}" has been approved by the commission! (Vote: ${yesVotes}-${noVotes})`,
          domain: `Your domain "${request.data.name}" has been approved by the commission! (Vote: ${yesVotes}-${noVotes})`,
          category: `Your category "${request.data.name}" has been approved by the commission! (Vote: ${yesVotes}-${noVotes})`
        };

        await Notification.create({
          user: request.requestedBy,
          type: `${request.type}_approved`,
          title: `${request.type.charAt(0).toUpperCase() + request.type.slice(1)} Approved`,
          message: notificationMessages[request.type],
          relatedItem: createdResource._id,
          relatedModel: request.type.charAt(0).toUpperCase() + request.type.slice(1),
          isRead: false
        });

        return res.json({
          success: true,
          message: 'Request approved by commission',
          status: 'approved',
          votes: { yes: yesVotes, no: noVotes }
        });
      } else {
        // Reject request
        request.status = 'rejected';
        request.reviewedAt = new Date();
        request.reviewNote = `Rejected by commission vote (${yesVotes}-${noVotes})`;
        await request.save();

        // Create notification
        const notificationMessages = {
          lesson: `Your lesson "${request.data.title}" was rejected by the commission. (Vote: ${yesVotes}-${noVotes})`,
          domain: `Your domain "${request.data.name}" was rejected by the commission. (Vote: ${yesVotes}-${noVotes})`,
          category: `Your category "${request.data.name}" was rejected by the commission. (Vote: ${yesVotes}-${noVotes})`
        };

        await Notification.create({
          user: request.requestedBy,
          type: `${request.type}_rejected`,
          title: `${request.type.charAt(0).toUpperCase() + request.type.slice(1)} Rejected`,
          message: notificationMessages[request.type],
          relatedItem: request._id,
          relatedModel: 'PendingRequest',
          isRead: false
        });

        return res.json({
          success: true,
          message: 'Request rejected by commission',
          status: 'rejected',
          votes: { yes: yesVotes, no: noVotes }
        });
      }
    }

    res.json({
      success: true,
      message: 'Vote recorded',
      votesCount: request.votes.length,
      totalNeeded: commissionCount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
