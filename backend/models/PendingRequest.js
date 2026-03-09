import mongoose from 'mongoose';

const pendingRequestSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['domain', 'category', 'lesson'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  reviewNote: {
    type: String
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
  requiresCommissionVote: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const PendingRequest = mongoose.model('PendingRequest', pendingRequestSchema);

export default PendingRequest;
