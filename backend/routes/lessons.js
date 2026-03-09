import express from 'express';
import Lesson from '../models/Lesson.js';
import Category from '../models/Category.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/lessons
// @desc    Get all lessons with filters (PUBLIC - no auth required)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, type, status, sort, subject } = req.query;
    
    let query = {};
    
    // Only show published lessons to public (unless status is explicitly requested)
    if (status) {
      query.status = status;
    } else {
      query.status = 'published';
    }
    
    if (category) query.category = category;
    if (type) query.type = type;

    let lessons = Lesson.find(query)
      .populate({
        path: 'category',
        populate: {
          path: 'domain',
          populate: {
            path: 'subject'
          }
        }
      })
      .populate('creators', 'username firstName lastName')
      .populate('editors', 'username firstName lastName');

    // Filter by subject if provided
    if (subject) {
      const result = await lessons;
      const filtered = result.filter(lesson => {
        return lesson.category?.domain?.subject?.slug === subject;
      });
      
      // Apply sorting
      if (sort === 'rating') {
        filtered.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
      } else if (sort === 'newest') {
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } else if (sort === 'oldest') {
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      }
      
      return res.json({
        success: true,
        count: filtered.length,
        data: filtered
      });
    }

    // Sorting
    if (sort === 'rating') {
      lessons = lessons.sort('-averageRating');
    } else if (sort === 'newest') {
      lessons = lessons.sort('-createdAt');
    } else if (sort === 'oldest') {
      lessons = lessons.sort('createdAt');
    }

    const result = await lessons;

    res.json({
      success: true,
      count: result.length,
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/lessons/:id
// @desc    Get lesson by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id)
      .populate({
        path: 'category',
        populate: {
          path: 'domain',
          populate: {
            path: 'subject'
          }
        }
      })
      .populate('creators', 'username firstName lastName')
      .populate('editors', 'username firstName lastName')
      .populate('ratings.user', 'username');

    if (!lesson) {
      return res.status(404).json({ 
        success: false, 
        message: 'Lesson not found' 
      });
    }

    res.json({
      success: true,
      data: lesson
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/lessons
// @desc    Create lesson (creator/editor/staff/owner)
// @access  Private
router.post('/', protect, authorize('creator', 'editor', 'staff', 'owner'), async (req, res) => {
  try {
    const { title, slug, description, content, type, category, isPremium, attachments } = req.body;

    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(404).json({ 
        success: false, 
        message: 'Category not found' 
      });
    }

    const lesson = await Lesson.create({
      title,
      slug,
      description,
      content,
      type,
      category,
      isPremium: isPremium || false,
      attachments: attachments || [],
      creators: [req.user._id],
      status: (req.user.userType === 'owner' || req.user.userType === 'staff') ? 'published' : 'pending_review'
    });

    // Add to category
    categoryExists.lessons.push(lesson._id);
    await categoryExists.save();

    // Add to user's created lessons
    req.user.createdLessons.push(lesson._id);
    await req.user.save();

    const populatedLesson = await Lesson.findById(lesson._id)
      .populate('category')
      .populate('creators', 'username email');

    res.status(201).json({
      success: true,
      data: populatedLesson
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/lessons/:id
// @desc    Update lesson (creator/editor/staff/owner)
// @access  Private
router.put('/:id', protect, authorize('creator', 'editor', 'staff', 'owner'), async (req, res) => {
  try {
    let lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
      return res.status(404).json({ 
        success: false, 
        message: 'Lesson not found' 
      });
    }

    // Check permissions
    const isCreator = lesson.creators.some(creator => creator.toString() === req.user._id.toString());
    const isEditor = req.user.userType === 'editor' || req.user.userType === 'staff' || req.user.userType === 'owner';

    if (!isCreator && !isEditor) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to edit this lesson' 
      });
    }

    // Add editor to lesson if not creator
    if (!isCreator && isEditor && !lesson.editors.includes(req.user._id)) {
      lesson.editors.push(req.user._id);
      if (!req.user.editedLessons.includes(lesson._id)) {
        req.user.editedLessons.push(lesson._id);
        await req.user.save();
      }
    }

    // Update lesson
    Object.assign(lesson, req.body);
    await lesson.save();

    const populatedLesson = await Lesson.findById(lesson._id)
      .populate('category')
      .populate('creators', 'username email')
      .populate('editors', 'username email');

    res.json({
      success: true,
      data: populatedLesson
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/lessons/:id
// @desc    Delete lesson (owner only)
// @access  Private/Owner
router.delete('/:id', protect, authorize('owner'), async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
      return res.status(404).json({ 
        success: false, 
        message: 'Lesson not found' 
      });
    }

    await lesson.deleteOne();

    res.json({
      success: true,
      message: 'Lesson deleted'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/lessons/:id/rate
// @desc    Rate a lesson
// @access  Private
router.post('/:id/rate', protect, async (req, res) => {
  try {
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ 
        success: false, 
        message: 'Rating must be between 1 and 5' 
      });
    }

    const lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
      return res.status(404).json({ 
        success: false, 
        message: 'Lesson not found' 
      });
    }

    // Check if user already rated
    const existingRating = lesson.ratings.find(
      r => r.user.toString() === req.user._id.toString()
    );

    if (existingRating) {
      existingRating.rating = rating;
    } else {
      lesson.ratings.push({
        user: req.user._id,
        rating
      });
    }

    lesson.calculateAverageRating();
    await lesson.save();

    res.json({
      success: true,
      data: {
        averageRating: lesson.averageRating,
        totalRatings: lesson.totalRatings
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/lessons/:id/status
// @desc    Update lesson status (editor/staff/owner)
// @access  Private
router.put('/:id/status', protect, authorize('editor', 'staff', 'owner'), async (req, res) => {
  try {
    const { status } = req.body;

    if (!['draft', 'pending_review', 'published', 'archived'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status' 
      });
    }

    const lesson = await Lesson.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('creators', 'username email');

    if (!lesson) {
      return res.status(404).json({ 
        success: false, 
        message: 'Lesson not found' 
      });
    }

    res.json({
      success: true,
      data: lesson
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
