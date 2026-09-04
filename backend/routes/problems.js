import express from 'express';
import Problem from '../models/Problem.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/problems
// @desc    Get all problems with optional filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { subject, difficulty, language, isOlympiad, yearFrom, yearTo, sort } = req.query;

    const query = {};
    if (subject) query.subject = subject;
    if (difficulty) query.difficulty = difficulty;
    if (language) query.language = language;
    if (isOlympiad !== undefined) query.isOlympiad = isOlympiad === 'true';
    if (yearFrom || yearTo) {
      query.year = {};
      if (yearFrom) query.year.$gte = parseInt(yearFrom, 10);
      if (yearTo) query.year.$lte = parseInt(yearTo, 10);
    }

    let sortObj = { createdAt: -1 };
    if (sort === 'oldest') sortObj = { createdAt: 1 };
    else if (sort === 'title') sortObj = { title: 1 };
    else if (sort === 'year') sortObj = { year: -1 };

    const problems = await Problem.find(query)
      .sort(sortObj)
      .populate('uploadedBy', 'username');

    res.json({ success: true, count: problems.length, data: problems });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/problems
// @desc    Upload a problem (staff/owner only)
// @access  Private
router.post('/', protect, authorize('staff', 'owner'), async (req, res) => {
  try {
    const {
      title, description, subject, difficulty, language,
      year, isOlympiad, olympiadName, olympiadYear,
      fileUrl, fileType, tags
    } = req.body;

    if (!title || !subject || !difficulty || !language) {
      return res.status(400).json({
        success: false,
        message: 'Title, subject, difficulty and language are required.'
      });
    }

    const problem = await Problem.create({
      title,
      description: description || '',
      subject,
      difficulty,
      language,
      year: year || null,
      isOlympiad: isOlympiad || false,
      olympiadName: isOlympiad ? (olympiadName || null) : null,
      olympiadYear: isOlympiad ? (olympiadYear || null) : null,
      fileUrl: fileUrl || null,
      fileType: fileType || 'pdf',
      tags: tags || [],
      uploadedBy: req.user._id
    });

    await problem.populate('uploadedBy', 'username');

    res.status(201).json({ success: true, data: problem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/problems/:id
// @desc    Get a single problem by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id).populate('uploadedBy', 'username');
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }
    res.json({ success: true, data: problem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PUT /api/problems/:id
// @desc    Edit a problem (staff/owner only)
// @access  Private
router.put('/:id', protect, authorize('staff', 'owner'), async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }

    const {
      title, description, subject, difficulty, language,
      year, isOlympiad, olympiadName, olympiadYear,
      fileUrl, fileType, tags
    } = req.body;

    if (title) problem.title = title;
    if (description !== undefined) problem.description = description;
    if (subject) problem.subject = subject;
    if (difficulty) problem.difficulty = difficulty;
    if (language) problem.language = language;
    problem.year = year || null;
    problem.isOlympiad = isOlympiad || false;
    problem.olympiadName = isOlympiad ? (olympiadName || null) : null;
    problem.olympiadYear = isOlympiad ? (olympiadYear || null) : null;
    problem.fileUrl = fileUrl || null;
    if (fileType) problem.fileType = fileType;
    if (tags) problem.tags = tags;

    await problem.save();
    await problem.populate('uploadedBy', 'username');

    res.json({ success: true, data: problem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/problems/:id
// @desc    Delete a problem (staff/owner only)
// @access  Private
router.delete('/:id', protect, authorize('staff', 'owner'), async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) {
      return res.status(404).json({ success: false, message: 'Problem not found' });
    }
    await problem.deleteOne();
    res.json({ success: true, message: 'Problem deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
