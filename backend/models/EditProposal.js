import mongoose from 'mongoose';

const editProposalSchema = new mongoose.Schema({
  proposedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  edits: [{
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
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  votes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    vote: {
      type: String,
      enum: ['yes', 'no'],
      required: true
    },
    votedAt: {
      type: Date,
      default: Date.now
    }
  }],
  reviewedAt: {
    type: Date
  },
  reviewNote: {
    type: String
  }
}, {
  timestamps: true
});

const EditProposal = mongoose.model('EditProposal', editProposalSchema);

export default EditProposal;
