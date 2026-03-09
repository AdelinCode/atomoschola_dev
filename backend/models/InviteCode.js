import mongoose from 'mongoose';

const inviteCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    length: 16
  },
  userType: {
    type: String,
    enum: ['creator', 'editor'],
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  usedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

const InviteCode = mongoose.model('InviteCode', inviteCodeSchema);

export default InviteCode;
