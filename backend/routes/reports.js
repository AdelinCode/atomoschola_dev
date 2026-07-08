import express from 'express';
import Report from '../models/Report.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Lesson from '../models/Lesson.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/reports
// @desc    Create a report
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { targetType, targetId, reason, description } = req.body;

    if (!['lesson', 'user'].includes(targetType)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid target type' 
      });
    }

    // Verify target exists
    const targetModel = targetType === 'lesson' ? Lesson : User;
    const target = await targetModel.findById(targetId);
    if (!target) {
      return res.status(404).json({ 
        success: false, 
        message: `${targetType} not found` 
      });
    }

    const report = await Report.create({
      reportedBy: req.user._id,
      targetType,
      targetId,
      targetModel: targetType === 'lesson' ? 'Lesson' : 'User',
      reason,
      description
    });

    // Notify all staff and owner members
    const staffUsers = await User.find({ userType: { $in: ['staff', 'owner'] } });
    const targetName = targetType === 'lesson' ? target.title : target.username;
    
    const notificationPromises = staffUsers.map(staff => 
      Notification.create({
        user: staff._id,
        type: 'report',
        title: `New ${targetType} report`,
        message: `${req.user.username} reported ${targetType === 'lesson' ? 'lesson' : 'user'} "${targetName}" — reason: ${reason}`,
        relatedItem: report._id,
        relatedModel: 'Report'
      })
    );

    await Promise.all(notificationPromises);

    res.status(201).json({
      success: true,
      data: report,
      message: 'Report submitted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/reports
// @desc    Get all reports (staff only)
// @access  Private/Staff
router.get('/', protect, authorize('staff', 'owner'), async (req, res) => {
  try {
    const { status, targetType } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (targetType) query.targetType = targetType;

    const reports = await Report.find(query)
      .populate('reportedBy', 'username email')
      .populate('reviewedBy', 'username')
      .populate('targetId')
      .sort('-createdAt');

    res.json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/reports/:id/review
// @desc    Review a report (staff only)
// @access  Private/Staff
router.put('/:id/review', protect, authorize('staff', 'owner'), async (req, res) => {
  try {
    const { status, reviewNote } = req.body;

    if (!['reviewed', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status' 
      });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ 
        success: false, 
        message: 'Report not found' 
      });
    }

    report.status = status;
    report.reviewedBy = req.user._id;
    report.reviewNote = reviewNote || '';
    report.reviewedAt = new Date();
    await report.save();

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
