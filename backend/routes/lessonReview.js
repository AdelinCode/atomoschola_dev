import express from 'express';
import LessonReview from '../models/LessonReview.js';
import Lesson from '../models/Lesson.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Notification from '../models/Notification.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// helper — editors + higher
const canReview = ['editor', 'creator', 'staff', 'owner'];

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/lesson-reviews
// Submit a lesson for peer review (creator, staff, owner)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', protect, authorize('creator', 'editor', 'staff', 'owner'), async (req, res) => {
  try {
    const user = req.user;

    // Only owner can bypass — staff goes through review too
    if (user.userType === 'owner') {
      return res.status(400).json({ success: false, message: 'Owners should use the direct lesson creation endpoint.' });
    }

    // Daily limit: max 1 submission per calendar day per creator (not staff)
    if (user.userType !== 'staff') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const todayCount = await LessonReview.countDocuments({
        creator: user._id,
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });

      if (todayCount >= 1) {
        return res.status(429).json({
          success: false,
          message: 'You can only submit 1 lesson for review per day. Try again tomorrow.'
        });
      }
    }

    const review = await LessonReview.create({
      lessonData: req.body.lessonData,
      creator: user._id,
      status: 'under_review'
    });

    // Notify all editors/creators that a new lesson is up for review
    const editors = await User.find({
      userType: { $in: ['editor', 'creator', 'staff'] },
      _id: { $ne: user._id }
    }).select('_id');

    const notifications = editors.map(e => ({
      user: e._id,
      type: 'lesson_approved',
      title: 'New Lesson Available for Review',
      message: `"${req.body.lessonData.title}" by ${user.username} is now available on the Review Dashboard.`,
      relatedItem: review._id,
      relatedModel: 'LessonReview',
      isRead: false
    }));
    if (notifications.length) await Notification.insertMany(notifications);

    res.status(201).json({ success: true, data: review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/lesson-reviews
// List all under_review lessons (editor+)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', protect, authorize(...canReview), async (req, res) => {
  try {
    const { status = 'under_review' } = req.query;
    const filter = status === 'all' ? {} : { status };

    const reviews = await LessonReview.find(filter)
      .populate('creator', 'username firstName lastName')
      .populate('panel', 'username firstName lastName')
      .sort('-createdAt');

    res.json({ success: true, data: reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/lesson-reviews/mine
// Creator's own submissions
// ─────────────────────────────────────────────────────────────────────────────
router.get('/mine', protect, async (req, res) => {
  try {
    const reviews = await LessonReview.find({ creator: req.user._id })
      .populate('panel', 'username')
      .sort('-createdAt');
    res.json({ success: true, data: reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/lesson-reviews/:id
// Single review detail
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', protect, authorize(...canReview), async (req, res) => {
  try {
    const review = await LessonReview.findById(req.params.id)
      .populate('creator', 'username firstName lastName')
      .populate('panel', 'username firstName lastName userType')
      .populate('voteSessions.votes.editor', 'username');

    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    res.json({ success: true, data: review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/lesson-reviews/:id/join
// Join or leave review panel (editor+)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/join', protect, authorize(...canReview), async (req, res) => {
  try {
    const review = await LessonReview.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    if (review.status !== 'under_review') {
      return res.status(400).json({ success: false, message: 'This lesson is no longer under review.' });
    }

    const userId = req.user._id.toString();
    const inPanel = review.panel.map(p => p.toString()).includes(userId);

    if (inPanel) {
      // Leave panel
      review.panel = review.panel.filter(p => p.toString() !== userId);
      await review.save();
      return res.json({ success: true, message: 'Left the review panel.', inPanel: false });
    }

    if (review.panel.length >= 9) {
      return res.status(400).json({ success: false, message: 'Review panel is full (max 9 editors).' });
    }

    review.panel.push(req.user._id);
    await review.save();

    // Notify creator
    await Notification.create({
      user: review.creator,
      type: 'lesson_approved',
      title: 'Editor Joined Your Review Panel',
      message: `${req.user.username} joined the review panel for "${review.lessonData.title}".`,
      relatedItem: review._id,
      relatedModel: 'LessonReview',
      isRead: false
    });

    res.json({ success: true, message: 'Joined the review panel.', inPanel: true, panelSize: review.panel.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/lesson-reviews/:id/open-vote
// Creator opens a new vote session
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/open-vote', protect, async (req, res) => {
  try {
    const review = await LessonReview.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    if (review.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the creator can open a vote session.' });
    }
    if (review.status !== 'under_review') {
      return res.status(400).json({ success: false, message: 'Lesson is not under review.' });
    }
    if (review.panel.length === 0) {
      return res.status(400).json({ success: false, message: 'No editors in the review panel yet.' });
    }

    // Check for existing open session
    const openSession = review.voteSessions.find(s => s.status === 'open');
    if (openSession) {
      return res.status(400).json({ success: false, message: 'A vote session is already open.' });
    }

    review.voteSessions.push({ openedBy: req.user._id, status: 'open', votes: [] });
    await review.save();

    // Notify panel editors
    const notifications = review.panel.map(editorId => ({
      user: editorId,
      type: 'lesson_approved',
      title: 'Vote Session Opened',
      message: `${req.user.username} opened a vote session for "${review.lessonData.title}". Please cast your vote.`,
      relatedItem: review._id,
      relatedModel: 'LessonReview',
      isRead: false
    }));
    if (notifications.length) await Notification.insertMany(notifications);

    res.json({ success: true, message: 'Vote session opened.', sessionId: review.voteSessions.at(-1)._id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/lesson-reviews/:id/vote/:sessionId
// Panel editor casts a vote
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/vote/:sessionId', protect, authorize(...canReview), async (req, res) => {
  try {
    const { vote } = req.body;
    if (!['yes', 'no'].includes(vote)) {
      return res.status(400).json({ success: false, message: 'Vote must be "yes" or "no".' });
    }

    const review = await LessonReview.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    const session = review.voteSessions.id(req.params.sessionId);
    if (!session) return res.status(404).json({ success: false, message: 'Vote session not found' });
    if (session.status !== 'open') return res.status(400).json({ success: false, message: 'This vote session is closed.' });

    // Must be in panel
    const inPanel = review.panel.map(p => p.toString()).includes(req.user._id.toString());
    if (!inPanel) return res.status(403).json({ success: false, message: 'You are not on this lesson\'s review panel.' });

    // No double voting
    const alreadyVoted = session.votes.some(v => v.editor.toString() === req.user._id.toString());
    if (alreadyVoted) return res.status(400).json({ success: false, message: 'You have already voted in this session.' });

    session.votes.push({ editor: req.user._id, vote });

    // Tally
    session.yesCount = session.votes.filter(v => v.vote === 'yes').length;
    session.noCount  = session.votes.filter(v => v.vote === 'no').length;

    // Check close conditions
    if (session.yesCount >= 7) {
      // APPROVED
      session.status    = 'approved';
      session.closedAt  = new Date();
      review.status     = 'published';

      // Create the actual lesson
      const lessonData = { ...review.lessonData, status: 'published' };
      const lesson = await Lesson.create(lessonData);

      if (lessonData.category) {
        await Category.findByIdAndUpdate(lessonData.category, { $push: { lessons: lesson._id } });
      }
      await User.findByIdAndUpdate(review.creator, { $push: { createdLessons: lesson._id } });
      review.publishedLesson = lesson._id;

      await review.save();

      await Notification.create({
        user: review.creator,
        type: 'lesson_approved',
        title: 'Lesson Approved!',
        message: `Your lesson "${review.lessonData.title}" was approved by the review panel (${session.yesCount} YES votes) and is now published.`,
        relatedItem: lesson._id,
        relatedModel: 'Lesson',
        isRead: false
      });

      return res.json({ success: true, result: 'approved', yesCount: session.yesCount, noCount: session.noCount });
    }

    // All panel members voted → close as rejected
    if (session.votes.length >= review.panel.length) {
      session.status   = 'rejected';
      session.closedAt = new Date();
      await review.save();

      await Notification.create({
        user: review.creator,
        type: 'lesson_approved',
        title: 'Vote Session Rejected',
        message: `The vote session for "${review.lessonData.title}" closed with ${session.yesCount} YES / ${session.noCount} NO. You can open a new session after further discussion.`,
        relatedItem: review._id,
        relatedModel: 'LessonReview',
        isRead: false
      });

      return res.json({ success: true, result: 'rejected', yesCount: session.yesCount, noCount: session.noCount });
    }

    await review.save();
    res.json({ success: true, result: 'voted', yesCount: session.yesCount, noCount: session.noCount, totalVotes: session.votes.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/lesson-reviews/:id/staff-approve
// Staff/owner direct approval
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id/staff-approve', protect, authorize('staff', 'owner'), async (req, res) => {
  try {
    const review = await LessonReview.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    if (review.status !== 'under_review') return res.status(400).json({ success: false, message: 'Lesson is not under review.' });

    const lessonData = { ...review.lessonData, status: 'published' };
    const lesson = await Lesson.create(lessonData);
    if (lessonData.category) {
      await Category.findByIdAndUpdate(lessonData.category, { $push: { lessons: lesson._id } });
    }
    await User.findByIdAndUpdate(review.creator, { $push: { createdLessons: lesson._id } });

    review.status = 'published';
    review.publishedLesson = lesson._id;
    review.reviewedBy = req.user._id;
    review.reviewedAt = new Date();
    review.reviewNote = req.body.note || 'Approved by staff.';
    await review.save();

    await Notification.create({
      user: review.creator,
      type: 'lesson_approved',
      title: 'Lesson Approved by Staff',
      message: `Your lesson "${review.lessonData.title}" was approved directly by ${req.user.username} and is now published.`,
      relatedItem: lesson._id,
      relatedModel: 'Lesson',
      isRead: false
    });

    res.json({ success: true, data: lesson });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/lesson-reviews/:id/staff-reject
// Staff/owner direct rejection
// ─────────────────────────────────────────────────────────────────────────────
router.put('/:id/staff-reject', protect, authorize('staff', 'owner'), async (req, res) => {
  try {
    const review = await LessonReview.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    review.status     = 'rejected';
    review.reviewedBy = req.user._id;
    review.reviewedAt = new Date();
    review.reviewNote = req.body.note || '';
    await review.save();

    await Notification.create({
      user: review.creator,
      type: 'lesson_approved',
      title: 'Lesson Rejected by Staff',
      message: `Your lesson "${review.lessonData.title}" was rejected by ${req.user.username}.${req.body.note ? ' Reason: ' + req.body.note : ''}`,
      relatedItem: review._id,
      relatedModel: 'LessonReview',
      isRead: false
    });

    res.json({ success: true, message: 'Lesson rejected.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
