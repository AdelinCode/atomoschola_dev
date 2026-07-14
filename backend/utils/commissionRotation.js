import User from '../models/User.js';
import Lesson from '../models/Lesson.js';
import ApprovedEdit from '../models/ApprovedEdit.js';
import Notification from '../models/Notification.js';

/**
 * Compute top-7 creator leaderboard scores (same formula as leaderboard.js)
 */
async function getTopCreators() {
  const candidates = await User.find({
    userType: { $in: ['creator', 'editor', 'staff', 'owner'] }
  }).select('_id username');

  const scores = await Promise.all(candidates.map(async (user) => {
    const lessons = await Lesson.find({ creators: user._id, status: 'published' })
      .select('averageRating createdAt');

    if (lessons.length === 0) return null;

    const now = new Date();
    const t3  = new Date(now.getFullYear(), now.getMonth() - 3,  now.getDate());
    const t12 = new Date(now.getFullYear(), now.getMonth() - 12, now.getDate());

    const avg = (arr) => arr.length ? arr.reduce((s, l) => s + (l.averageRating || 0), 0) / arr.length : 0;

    const score = Math.round(
      15 * avg(lessons.filter(l => new Date(l.createdAt) >= t3)) +
      10 * avg(lessons.filter(l => { const d = new Date(l.createdAt); return d < t3 && d >= t12; })) +
      7.5 * avg(lessons.filter(l => new Date(l.createdAt) < t12)) +
      lessons.length
    );

    return { _id: user._id, score };
  }));

  return scores
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, 7)
    .map(u => u._id);
}

/**
 * Compute top-7 editor leaderboard scores
 */
async function getTopEditors() {
  const candidates = await User.find({
    userType: { $in: ['creator', 'editor', 'staff', 'owner'] }
  }).select('_id username');

  const scores = await Promise.all(candidates.map(async (user) => {
    const edits = await ApprovedEdit.find({ proposedBy: user._id })
      .populate('lesson', 'averageRating')
      .select('approvedAt lesson');

    if (edits.length === 0) return null;

    const now = new Date();
    const t3  = new Date(now.getFullYear(), now.getMonth() - 3,  now.getDate());
    const t12 = new Date(now.getFullYear(), now.getMonth() - 12, now.getDate());

    const avg = (arr) => arr.length ? arr.reduce((s, e) => s + (e.lesson?.averageRating || 0), 0) / arr.length : 0;

    const score = Math.round(
      15 * avg(edits.filter(e => new Date(e.approvedAt) >= t3)) +
      10 * avg(edits.filter(e => { const d = new Date(e.approvedAt); return d < t3 && d >= t12; })) +
      7.5 * avg(edits.filter(e => new Date(e.approvedAt) < t12)) +
      edits.length
    );

    return { _id: user._id, score };
  }));

  return scores
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, 7)
    .map(u => u._id);
}

/**
 * Rotate one commission type.
 * - If leaderboard has 7 → replace entire commission with the 7.
 * - If leaderboard has < 7 → keep current commission, replace slots occupied
 *   by people NOT in leaderboard with the leaderboard people not yet in commission.
 */
async function rotateCommission(type) {
  const field  = type === 'creator' ? 'isCreatorCommissionMember' : 'isEditorCommissionMember';
  const label  = type === 'creator' ? 'Creator' : 'Editor';

  const topIds = type === 'creator' ? await getTopCreators() : await getTopEditors();

  if (topIds.length === 0) {
    console.log(`[Commission Rotation] No ${label} leaderboard entries — skipping.`);
    return;
  }

  const topIdStrings = topIds.map(id => id.toString());

  if (topIds.length >= 7) {
    // Full replacement — clear old commission, set new one
    const oldMembers = await User.find({ [field]: true }).select('_id username');

    // Remove everyone
    await User.updateMany({ [field]: true }, { $set: { [field]: false } });

    // Add top 7
    await User.updateMany({ _id: { $in: topIds } }, { $set: { [field]: true } });

    // Notify removed members
    for (const member of oldMembers) {
      if (!topIdStrings.includes(member._id.toString())) {
        await Notification.create({
          user: member._id,
          type: 'commission_update',
          title: `${label} Commission — Monthly Rotation`,
          message: `Your term on the ${label} Commission has ended. The new commission has been selected from this month's leaderboard.`,
          isRead: false
        }).catch(() => {});
      }
    }

    // Notify new members
    for (const id of topIds) {
      const oldIds = oldMembers.map(m => m._id.toString());
      if (!oldIds.includes(id.toString())) {
        await Notification.create({
          user: id,
          type: 'commission_update',
          title: `Welcome to the ${label} Commission!`,
          message: `You have been added to the ${label} Commission based on your leaderboard ranking this month.`,
          isRead: false
        }).catch(() => {});
      }
    }

    console.log(`[Commission Rotation] ${label} commission fully replaced with top ${topIds.length}.`);
  } else {
    // Partial replacement
    const currentMembers = await User.find({ [field]: true }).select('_id');
    const currentIds = currentMembers.map(m => m._id.toString());

    // Members NOT in leaderboard — candidates for removal
    const toRemove = currentMembers.filter(m => !topIdStrings.includes(m._id.toString()));

    // Leaderboard members NOT yet in commission — candidates for addition
    const toAdd = topIds.filter(id => !currentIds.includes(id.toString()));

    // Replace slot-by-slot up to min(toRemove, toAdd)
    const slots = Math.min(toRemove.length, toAdd.length);

    for (let i = 0; i < slots; i++) {
      await User.findByIdAndUpdate(toRemove[i]._id, { $set: { [field]: false } });
      await User.findByIdAndUpdate(toAdd[i],        { $set: { [field]: true  } });

      await Notification.create({
        user: toRemove[i]._id,
        type: 'commission_update',
        title: `${label} Commission — Monthly Rotation`,
        message: `Your term on the ${label} Commission has ended due to the monthly leaderboard rotation.`,
        isRead: false
      }).catch(() => {});

      await Notification.create({
        user: toAdd[i],
        type: 'commission_update',
        title: `Welcome to the ${label} Commission!`,
        message: `You have been added to the ${label} Commission based on your leaderboard ranking.`,
        isRead: false
      }).catch(() => {});
    }

    console.log(`[Commission Rotation] ${label}: replaced ${slots} member(s). Leaderboard had ${topIds.length}/7.`);
  }
}

/**
 * Main rotation — runs on the 1st of each month
 */
export async function runMonthlyCommissionRotation() {
  console.log('[Commission Rotation] Starting monthly rotation...');
  try {
    await rotateCommission('creator');
    await rotateCommission('editor');
    console.log('[Commission Rotation] Done.');
  } catch (err) {
    console.error('[Commission Rotation] Error:', err.message);
  }
}
