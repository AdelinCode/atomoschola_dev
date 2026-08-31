import mongoose from 'mongoose';

const voteSchema = new mongoose.Schema({
  editor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vote: { type: String, enum: ['yes', 'no'], required: true },
  votedAt: { type: Date, default: Date.now }
});

const voteSessionSchema = new mongoose.Schema({
  openedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  openedAt: { type: Date, default: Date.now },
  closedAt: { type: Date },
  status: { type: String, enum: ['open', 'approved', 'rejected'], default: 'open' },
  votes: [voteSchema],
  yesCount: { type: Number, default: 0 },
  noCount:  { type: Number, default: 0 }
});

const lessonReviewSchema = new mongoose.Schema({
  // The lesson data (same structure as Lesson, stored here until approved)
  lessonData: { type: mongoose.Schema.Types.Mixed, required: true },

  // Creator who submitted
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Review status
  status: {
    type: String,
    enum: ['under_review', 'published', 'rejected'],
    default: 'under_review'
  },

  // Editors who joined the review panel (max 9)
  panel: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // Vote sessions (creator can open multiple after rejections)
  voteSessions: [voteSessionSchema],

  // When published, reference to the actual created lesson
  publishedLesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },

  // Staff/owner override
  reviewedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt:   { type: Date },
  reviewNote:   { type: String },

  // Translation fields
  isTranslation:    { type: Boolean, default: false },
  originalLessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', default: null },
  targetLanguage:   { type: String, default: null }
}, { timestamps: true });

const LessonReview = mongoose.model('LessonReview', lessonReviewSchema);
export default LessonReview;
