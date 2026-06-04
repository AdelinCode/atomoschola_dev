import express from 'express';
import User from '../models/User.js';
import Lesson from '../models/Lesson.js';
import ApprovedEdit from '../models/ApprovedEdit.js';

const router = express.Router();

// @route   GET /api/leaderboard
// @desc    Get top creators and editors leaderboard
// @access  Public
router.get('/', async (req, res) => {
  try {
    // ── CREATORS ──────────────────────────────────────────────────
    const creators = await User.find({
      $or: [
        { userType: { $in: ['creator', 'editor', 'staff', 'owner'] } },
        { isCreatorCommissionMember: true },
        { isEditorCommissionMember: true }
      ]
    }).select('_id username firstName lastName');

    const creatorScores = await Promise.all(
      creators.map(async (user) => {
        const publishedLessons = await Lesson.find({
          creators: user._id,
          status: 'published'
        }).select('averageRating');

        const lessonsCount = publishedLessons.length;

        const avgRating =
          lessonsCount > 0
            ? publishedLessons.reduce((sum, l) => sum + (l.averageRating || 0), 0) / lessonsCount
            : 0;

        // Score formula: lessons * 10 + avgRating * 5
        const score = Math.round(lessonsCount * 10 + avgRating * 5);

        return {
          username: user.username,
          displayName: user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.username,
          lessonsCount,
          avgRating: parseFloat(avgRating.toFixed(2)),
          score
        };
      })
    );

    const topCreators = creatorScores
      .filter(u => u.lessonsCount > 0) // Only show creators with at least 1 published lesson
      .sort((a, b) => b.score - a.score)
      .slice(0, 7)
      .map((u, i) => ({ ...u, rank: i + 1 }));

    // ── EDITORS ───────────────────────────────────────────────────
    const editors = await User.find({
      $or: [
        { userType: { $in: ['creator', 'editor', 'staff', 'owner'] } },
        { isCreatorCommissionMember: true },
        { isEditorCommissionMember: true }
      ]
    }).select('_id username firstName lastName');

    const editorScores = await Promise.all(
      editors.map(async (user) => {
        const approvedEdits = await ApprovedEdit.countDocuments({ proposedBy: user._id });

        // Score formula: approvedEdits * 10
        const score = approvedEdits * 10;

        return {
          username: user.username,
          displayName: user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.username,
          editsCount: approvedEdits,
          score
        };
      })
    );

    // Only include editors who have at least 1 approved edit
    const topEditors = editorScores
      .filter(u => u.editsCount > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 7)
      .map((u, i) => ({ ...u, rank: i + 1 }));

    res.json({
      success: true,
      data: {
        creators: topCreators,
        editors: topEditors
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
