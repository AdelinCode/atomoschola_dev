import express from 'express';
import Folder from '../models/Folder.js';
import Lesson from '../models/Lesson.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
const canCreate = ['creator', 'staff', 'owner'];

// ── GET /api/folders?creatorId=xxx  — public, list folders by creator ─────────
router.get('/', async (req, res) => {
  try {
    const { creatorId } = req.query;
    const filter = creatorId ? { creator: creatorId } : {};

    const folders = await Folder.find(filter)
      .populate('creator', 'username firstName lastName')
      .populate({ path: 'lessons', select: 'title slug type language level averageRating', match: { status: 'published' } })
      .sort('-createdAt');

    res.json({ success: true, data: folders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/folders/:id  — public, single folder ────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id)
      .populate('creator', 'username firstName lastName')
      .populate({ path: 'lessons', select: 'title slug type language level averageRating description', match: { status: 'published' } });

    if (!folder) return res.status(404).json({ success: false, message: 'Folder not found' });
    res.json({ success: true, data: folder });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/folders  — creator creates a folder ────────────────────────────
router.post('/', protect, authorize(...canCreate), async (req, res) => {
  try {
    const { title, description, lessonIds } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required.' });
    }

    // Verify all lessons belong to this creator and are published
    if (lessonIds && lessonIds.length > 0) {
      const lessons = await Lesson.find({ _id: { $in: lessonIds }, status: 'published' });
      const unauthorized = lessons.filter(l =>
        !l.creators.some(c => c.toString() === req.user._id.toString())
      );
      if (unauthorized.length > 0) {
        return res.status(403).json({ success: false, message: 'You can only add your own published lessons.' });
      }
    }

    const folder = await Folder.create({
      title: title.trim(),
      description: (description || '').trim(),
      creator: req.user._id,
      lessons: lessonIds || []
    });

    await folder.populate('creator', 'username firstName lastName');
    res.status(201).json({ success: true, data: folder });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/folders/:id  — update title/description/lesson order ─────────────
router.put('/:id', protect, authorize(...canCreate), async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id);
    if (!folder) return res.status(404).json({ success: false, message: 'Folder not found' });

    if (folder.creator.toString() !== req.user._id.toString() && !['staff','owner'].includes(req.user.userType)) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this folder.' });
    }

    const { title, description, lessonIds } = req.body;

    if (lessonIds && lessonIds.length > 0) {
      const lessons = await Lesson.find({ _id: { $in: lessonIds }, status: 'published' });
      const unauthorized = lessons.filter(l =>
        !l.creators.some(c => c.toString() === req.user._id.toString())
      );
      if (unauthorized.length > 0) {
        return res.status(403).json({ success: false, message: 'You can only add your own published lessons.' });
      }
    }

    if (title !== undefined) folder.title = title.trim();
    if (description !== undefined) folder.description = description.trim();
    if (lessonIds !== undefined) folder.lessons = lessonIds;

    await folder.save();
    await folder.populate('creator', 'username firstName lastName');
    await folder.populate({ path: 'lessons', select: 'title slug type language level averageRating', match: { status: 'published' } });

    res.json({ success: true, data: folder });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/folders/:id ───────────────────────────────────────────────────
router.delete('/:id', protect, authorize(...canCreate), async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id);
    if (!folder) return res.status(404).json({ success: false, message: 'Folder not found' });

    if (folder.creator.toString() !== req.user._id.toString() && !['staff','owner'].includes(req.user.userType)) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this folder.' });
    }

    await folder.deleteOne();
    res.json({ success: true, message: 'Folder deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
