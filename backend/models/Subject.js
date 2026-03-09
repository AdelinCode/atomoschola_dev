import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  icon: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  managedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  domains: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Domain'
  }]
}, {
  timestamps: true
});

const Subject = mongoose.model('Subject', subjectSchema);

export default Subject;
