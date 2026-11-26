import express from 'express';
import mongoose from 'mongoose';
import Event, { eventFormats, eventTypes } from '../models/Event.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
const canManageEvents = user => user.userType === 'owner';

function requireEventManager(req, res, next) {
  if (!canManageEvents(req.user)) {
    return res.status(403).json({ success: false, message: 'Only administrators can manage events.' });
  }
  next();
}

function readEvent(body) {
  const fields = {};
  for (const key of ['title', 'summary', 'article', 'type', 'format', 'organizer', 'location', 'coverUrl', 'registrationUrl']) {
    fields[key] = typeof body[key] === 'string' ? body[key].trim() : '';
  }
  if (!eventTypes.includes(fields.type) || !eventFormats.includes(fields.format)) {
    throw new Error('Choose a valid category and format.');
  }
  if (fields.format !== 'online' && !fields.location) {
    throw new Error('Enter a venue for in-person and hybrid events.');
  }
  for (const key of ['startsAt', 'endsAt']) {
    const value = body[key];
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value))) {
      throw new Error('Enter a valid start and end time.');
    }
    fields[key] = new Date(value);
  }
  if (fields.endsAt <= fields.startsAt) throw new Error('The end time must be after the start time.');

  for (const key of ['coverUrl', 'registrationUrl']) {
    if (!fields[key]) continue;
    let url;
    try { url = new URL(fields[key]); } catch { /* handled below */ }
    if (!url || !['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
      throw new Error('Use a valid HTTP or HTTPS link for the cover and registration.');
    }
    fields[key] = url.href;
  }
  fields.capacity = body.capacity == null || body.capacity === '' ? null : body.capacity;
  if (fields.capacity !== null && !Number.isSafeInteger(fields.capacity)) throw new Error('Capacity must be a whole number.');
  return fields;
}

router.get('/permissions', protect, (req, res) => {
  res.json({ success: true, data: { canManage: canManageEvents(req.user) } });
});

router.get('/', async (req, res) => {
  try {
    const events = await Event.find().select('-article -createdBy').sort({ startsAt: 1, _id: 1 }).lean();
    res.json({ success: true, data: events });
  } catch (error) {
    console.error('Error loading events:', error);
    res.status(500).json({ success: false, message: 'Could not load events.' });
  }
});

router.get('/:id', async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) return res.status(404).json({ success: false, message: 'Event not found.' });
  try {
    const event = await Event.findById(req.params.id).select('-createdBy').lean();
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
    res.json({ success: true, data: event });
  } catch (error) {
    console.error('Error loading event:', error);
    res.status(500).json({ success: false, message: 'Could not load the event.' });
  }
});

async function saveEvent(req, res) {
  const { id } = req.params;
  if (id && !mongoose.isObjectIdOrHexString(id)) return res.status(404).json({ success: false, message: 'Event not found.' });
  let fields;
  try {
    fields = readEvent(req.body || {});
    await new Event({ ...fields, createdBy: req.user._id }).validate();
  } catch (error) {
    const message = error.errors ? Object.values(error.errors)[0].message : error.message;
    return res.status(400).json({ success: false, message });
  }
  try {
    const event = id
      ? await Event.findByIdAndUpdate(id, { $set: fields }, { new: true })
      : await Event.create({ ...fields, createdBy: req.user._id });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
    res.status(id ? 200 : 201).json({ success: true, data: { _id: event._id } });
  } catch (error) {
    console.error('Error saving event:', error);
    res.status(500).json({ success: false, message: 'Could not save the event.' });
  }
}

router.post('/', protect, requireEventManager, saveEvent);
router.put('/:id', protect, requireEventManager, saveEvent);

export default router;
