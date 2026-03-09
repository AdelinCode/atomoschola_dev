import express from 'express';
import Lesson from '../models/Lesson.js';
import Subject from '../models/Subject.js';
import Domain from '../models/Domain.js';
import Category from '../models/Category.js';

const router = express.Router();

// @route   GET /api/search
// @desc    Search lessons, subjects, domains, categories
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.json({
        success: true,
        data: {
          lessons: [],
          subjects: [],
          domains: [],
          categories: []
        }
      });
    }
    
    const searchTerm = q.trim();
    const searchRegex = new RegExp(searchTerm, 'i');
    
    // Search lessons
    const lessons = await Lesson.find({
      $and: [
        { status: 'published' },
        {
          $or: [
            { title: searchRegex },
            { description: searchRegex }
          ]
        }
      ]
    })
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
    .limit(parseInt(limit))
    .sort({ averageRating: -1 });
    
    // Search subjects
    const subjects = await Subject.find({
      $or: [
        { name: searchRegex },
        { description: searchRegex }
      ]
    }).limit(5);
    
    // Search domains
    const domains = await Domain.find({
      $or: [
        { name: searchRegex },
        { description: searchRegex }
      ]
    })
    .populate('subject', 'name slug')
    .limit(5);
    
    // Search categories
    const categories = await Category.find({
      $or: [
        { name: searchRegex },
        { description: searchRegex }
      ]
    })
    .populate({
      path: 'domain',
      populate: {
        path: 'subject'
      }
    })
    .limit(5);
    
    res.json({
      success: true,
      data: {
        lessons: lessons.map(lesson => ({
          _id: lesson._id,
          title: lesson.title,
          description: lesson.description,
          type: lesson.type,
          averageRating: lesson.averageRating,
          isPremium: lesson.isPremium,
          subject: lesson.category?.domain?.subject?.name || 'Unknown',
          subjectSlug: lesson.category?.domain?.subject?.slug || 'unknown',
          domain: lesson.category?.domain?.name || 'Unknown',
          category: lesson.category?.name || 'Unknown',
          creators: lesson.creators
        })),
        subjects: subjects.map(subject => ({
          _id: subject._id,
          name: subject.name,
          slug: subject.slug,
          icon: subject.icon,
          description: subject.description
        })),
        domains: domains.map(domain => ({
          _id: domain._id,
          name: domain.name,
          description: domain.description,
          subject: domain.subject?.name || 'Unknown',
          subjectSlug: domain.subject?.slug || 'unknown'
        })),
        categories: categories.map(category => ({
          _id: category._id,
          name: category.name,
          description: category.description,
          domain: category.domain?.name || 'Unknown',
          subject: category.domain?.subject?.name || 'Unknown',
          subjectSlug: category.domain?.subject?.slug || 'unknown'
        }))
      }
    });
    
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;