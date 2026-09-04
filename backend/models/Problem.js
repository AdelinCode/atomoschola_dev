import mongoose from 'mongoose';

const problemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    subject: { type: String, required: true, trim: true },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard', 'very_hard'],
      required: true
    },
    language: { type: String, required: true, trim: true },
    year: { type: Number, default: null },
    isOlympiad: { type: Boolean, default: false },
    olympiadName: { type: String, default: null },
    olympiadYear: { type: Number, default: null },
    fileUrl: { type: String, default: null },
    fileType: {
      type: String,
      enum: ['pdf', 'image', 'document', 'other'],
      default: 'pdf'
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    tags: [{ type: String, trim: true }]
  },
  { timestamps: true }
);

const Problem = mongoose.model('Problem', problemSchema);

export default Problem;
