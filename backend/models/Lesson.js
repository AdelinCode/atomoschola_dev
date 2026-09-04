import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'video', 'audio', 'presentation'],
    default: 'text'
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  creators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  editors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['draft', 'pending_review', 'published', 'archived'],
    default: 'draft'
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  language: {
    type: String,
    default: 'română'
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 30
  }],
  attachments: [{
    name: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['document', 'spreadsheet', 'presentation', 'pdf', 'image', 'video', 'other'],
      default: 'document'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  ratings: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  averageRating: {
    type: Number,
    default: 0
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  // Problem archive fields
  isOlympiad: {
    type: Boolean,
    default: false
  },
  olympiadName: {
    type: String,
    default: null
  },
  olympiadYear: {
    type: Number,
    default: null
  },
  problemYear: {
    type: Number,
    default: null
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'very_hard'],
    default: null
  },
  originalLesson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
    default: null
  },
  translatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Calculate average rating
lessonSchema.methods.calculateAverageRating = function() {
  if (this.ratings.length === 0) {
    this.averageRating = 0;
    this.totalRatings = 0;
  } else {
    const sum = this.ratings.reduce((acc, item) => acc + item.rating, 0);
    this.averageRating = sum / this.ratings.length;
    this.totalRatings = this.ratings.length;
  }
};

const Lesson = mongoose.model('Lesson', lessonSchema);

export default Lesson;
