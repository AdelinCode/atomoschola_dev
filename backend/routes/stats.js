import express from 'express';
import Subject from '../models/Subject.js';
import Domain from '../models/Domain.js';
import Category from '../models/Category.js';
import Lesson from '../models/Lesson.js';

const router = express.Router();

// @route   GET /api/stats
// @desc    Get platform statistics
// @access  Public
router.get('/', async (req, res) => {
  try {
    const [totalSubjects, totalDomains, totalCategories, totalLessons] = await Promise.all([
      Subject.countDocuments(),
      Domain.countDocuments(),
      Category.countDocuments(),
      Lesson.countDocuments({ status: 'published' })
    ]);

    res.json({
      success: true,
      data: {
        totalSubjects,
        totalDomains,
        totalCategories,
        totalLessons
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
