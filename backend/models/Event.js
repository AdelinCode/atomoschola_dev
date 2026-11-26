import mongoose from 'mongoose';

export const eventTypes = ['workshop', 'webinar', 'conference', 'competition', 'community'];
export const eventFormats = ['online', 'in-person', 'hybrid'];

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  summary: { type: String, required: true, trim: true, maxlength: 280 },
  article: { type: String, required: true, trim: true, maxlength: 20000 },
  type: { type: String, required: true, enum: eventTypes },
  format: { type: String, required: true, enum: eventFormats },
  startsAt: { type: Date, required: true, index: true },
  endsAt: { type: Date, required: true },
  organizer: { type: String, required: true, trim: true, maxlength: 120 },
  location: { type: String, trim: true, maxlength: 200 },
  capacity: { type: Number, min: 1, max: 100000 },
  coverUrl: { type: String, maxlength: 2048 },
  registrationUrl: { type: String, maxlength: 2048 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export default mongoose.model('Event', eventSchema);
