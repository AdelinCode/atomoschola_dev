import mongoose from 'mongoose';

const approvedEditSchema = new mongoose.Schema({
  proposedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lesson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
    required: true
  },
  editDescription: {
    type: String,
    required: true
  },
  editContent: {
    type: String,
    required: true
  },
  approvedAt: {
    type: Date,
    default: Date.now
  },
  votes: {
    yes: Number,
    no: Number
  }
}, {
  timestamps: true
});

const ApprovedEdit = mongoose.model('ApprovedEdit', approvedEditSchema);

export default ApprovedEdit;
