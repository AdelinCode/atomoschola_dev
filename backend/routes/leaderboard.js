import express from 'express';
import User from '../models/User.js';
import Lesson from '../models/Lesson.js';

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
        }).select('averageRating createdAt');

        const lessonsCount = publishedLessons.length;

        // Calculate time periods
        const now = new Date();
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 12, now.getDate());

        // Filter lessons by time period
        const lessons0to3months = publishedLessons.filter(l => new Date(l.createdAt) >= threeMonthsAgo);
        const lessons3to12months = publishedLessons.filter(l => {
          const date = new Date(l.createdAt);
          return date < threeMonthsAgo && date >= twelveMonthsAgo;
        });
        const lessonsOver12months = publishedLessons.filter(l => new Date(l.createdAt) < twelveMonthsAgo);

        // Calculate average ratings for each period
        const avg0to3 = lessons0to3months.length > 0
          ? lessons0to3months.reduce((sum, l) => sum + (l.averageRating || 0), 0) / lessons0to3months.length
          : 0;

        const avg3to12 = lessons3to12months.length > 0
          ? lessons3to12months.reduce((sum, l) => sum + (l.averageRating || 0), 0) / lessons3to12months.length
          : 0;

        const avgOver12 = lessonsOver12months.length > 0
          ? lessonsOver12months.reduce((sum, l) => sum + (l.averageRating || 0), 0) / lessonsOver12months.length
          : 0;

        // Translation bonus: min(translations in last 12 months, 10)
        const translationsCount = await Lesson.countDocuments({
          translatedBy: user._id,
          status: 'published',
          createdAt: { $gte: twelveMonthsAgo }
        });
        const translationBonus = Math.min(translationsCount, 10);

        // New score formula: 15*(0-3mo avg) + 10*(3-12mo avg) + 7.5*(>12mo avg) + 1*(total lessons) + translation bonus
        const score = Math.round(
          15 * avg0to3 +
          10 * avg3to12 +
          7.5 * avgOver12 +
          1 * lessonsCount +
          translationBonus
        );

        // Overall average for display
        const avgRating = lessonsCount > 0
          ? publishedLessons.reduce((sum, l) => sum + (l.averageRating || 0), 0) / lessonsCount
          : 0;

        return {
          _id: user._id,
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
        // Use Lesson.editors field (same source as profile) instead of ApprovedEdit collection
        const editedLessons = await Lesson.find({
          editors: user._id,
          status: 'published'
        }).select('averageRating updatedAt');

        const editsCount = editedLessons.length;

        // Calculate time periods
        const now = new Date();
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 12, now.getDate());

        // Filter edits by time period (using updatedAt as proxy for edit date)
        const edits0to3months = editedLessons.filter(l => new Date(l.updatedAt) >= threeMonthsAgo);
        const edits3to12months = editedLessons.filter(l => {
          const date = new Date(l.updatedAt);
          return date < threeMonthsAgo && date >= twelveMonthsAgo;
        });
        const editsOver12months = editedLessons.filter(l => new Date(l.updatedAt) < twelveMonthsAgo);

        // Calculate average ratings for each period (based on lesson ratings)
        const avg0to3 = edits0to3months.length > 0
          ? edits0to3months.reduce((sum, l) => sum + (l.averageRating || 0), 0) / edits0to3months.length
          : 0;

        const avg3to12 = edits3to12months.length > 0
          ? edits3to12months.reduce((sum, l) => sum + (l.averageRating || 0), 0) / edits3to12months.length
          : 0;

        const avgOver12 = editsOver12months.length > 0
          ? editsOver12months.reduce((sum, l) => sum + (l.averageRating || 0), 0) / editsOver12months.length
          : 0;

        // Translation bonus: min(translations in last 12 months, 10)
        const translationsCount = await Lesson.countDocuments({
          translatedBy: user._id,
          status: 'published',
          createdAt: { $gte: twelveMonthsAgo }
        });
        const translationBonus = Math.min(translationsCount, 10);

        // Score formula: 15*(0-3mo avg) + 10*(3-12mo avg) + 7.5*(>12mo avg) + 1*(total edits) + translation bonus
        const score = Math.round(
          15 * avg0to3 +
          10 * avg3to12 +
          7.5 * avgOver12 +
          1 * editsCount +
          translationBonus
        );

        return {
          _id: user._id,
          username: user.username,
          displayName: user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : user.username,
          editsCount: editsCount,
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
