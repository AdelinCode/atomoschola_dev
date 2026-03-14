import express from 'express';
import Subject from '../models/Subject.js';
import Domain from '../models/Domain.js';
import Category from '../models/Category.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/subjects
// @desc    Get all subjects (PUBLIC - no auth required)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { majorCategory } = req.query;
    
    // Build filter
    const filter = {};
    if (majorCategory) {
      filter.majorCategory = majorCategory;
    }
    
    const subjects = await Subject.find(filter)
      .populate({
        path: 'domains',
        populate: {
          path: 'categories',
          populate: {
            path: 'lessons',
            match: { status: 'published' }, // Only count published lessons
            select: '_id averageRating'
          }
        }
      });

    // Calculate statistics for each subject
    const subjectsWithStats = subjects.map(subject => {
      let totalLessons = 0;
      let totalRatings = 0;
      let ratingSum = 0;
      
      if (subject.domains) {
        subject.domains.forEach(domain => {
          if (domain.categories) {
            domain.categories.forEach(category => {
              if (category.lessons) {
                totalLessons += category.lessons.length;
                category.lessons.forEach(lesson => {
                  if (lesson.averageRating && lesson.averageRating > 0) {
                    ratingSum += lesson.averageRating;
                    totalRatings++;
                  }
                });
              }
            });
          }
        });
      }
      
      const subjectObj = subject.toObject();
      subjectObj.stats = {
        totalLessons,
        averageRating: totalRatings > 0 ? (ratingSum / totalRatings).toFixed(1) : 0
      };
      
      return subjectObj;
    });

    res.json({
      success: true,
      count: subjectsWithStats.length,
      data: subjectsWithStats
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/subjects/:slug
// @desc    Get subject by slug
// @access  Public
router.get('/:slug', async (req, res) => {
  try {
    const subject = await Subject.findOne({ slug: req.params.slug })
      .populate({
        path: 'domains',
        populate: {
          path: 'categories',
          select: 'name slug description'
        }
      });

    if (!subject) {
      return res.status(404).json({ 
        success: false, 
        message: 'Subject not found' 
      });
    }

    res.json({
      success: true,
      data: subject
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/subjects
// @desc    Create subject (owner only)
// @access  Private/Owner
router.post('/', protect, authorize('owner'), async (req, res) => {
  try {
    const { name, slug, icon, description, isPremium, majorCategory } = req.body;

    const subject = await Subject.create({
      name,
      slug,
      icon,
      description,
      majorCategory: majorCategory || 'STEAM',
      isPremium: isPremium || false,
      managedBy: [req.user._id]
    });

    res.status(201).json({
      success: true,
      data: subject
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/subjects/:id
// @desc    Update subject (owner only)
// @access  Private/Owner
router.put('/:id', protect, authorize('owner'), async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!subject) {
      return res.status(404).json({ 
        success: false, 
        message: 'Subject not found' 
      });
    }

    res.json({
      success: true,
      data: subject
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/subjects/:id
// @desc    Delete subject (owner only)
// @access  Private/Owner
router.delete('/:id', protect, authorize('owner'), async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({ 
        success: false, 
        message: 'Subject not found' 
      });
    }

    await subject.deleteOne();

    res.json({
      success: true,
      message: 'Subject deleted'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/subjects/:subjectId/domains
// @desc    Create domain for subject (owner/editor/staff)
// @access  Private
router.post('/:subjectId/domains', protect, authorize('owner', 'editor', 'staff'), async (req, res) => {
  try {
    const { name, slug, description } = req.body;

    const subject = await Subject.findById(req.params.subjectId);
    if (!subject) {
      return res.status(404).json({ 
        success: false, 
        message: 'Subject not found' 
      });
    }

    const domain = await Domain.create({
      name,
      slug,
      description,
      subject: subject._id
    });

    subject.domains.push(domain._id);
    await subject.save();

    res.status(201).json({
      success: true,
      data: domain
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/subjects/:subjectId/domains/:domainId/categories
// @desc    Create category for domain (owner/editor/staff)
// @access  Private
router.post('/:subjectId/domains/:domainId/categories', protect, authorize('owner', 'editor', 'staff'), async (req, res) => {
  try {
    const { name, slug, description } = req.body;

    const domain = await Domain.findById(req.params.domainId);
    if (!domain) {
      return res.status(404).json({ 
        success: false, 
        message: 'Domain not found' 
      });
    }

    const category = await Category.create({
      name,
      slug,
      description,
      domain: domain._id
    });

    domain.categories.push(category._id);
    await domain.save();

    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
