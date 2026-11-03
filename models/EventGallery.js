const mongoose = require('mongoose');

// ─── 2.9 Event_Gallery Schema ───
const EventGallerySchema = new mongoose.Schema({
  gallery_id: { type: Number, unique: true, index: true },
  event_id: { type: Number, required: true, index: true },
  uploaded_by: { type: Number, default: 1 },
  media_type: { type: String, enum: ['image', 'video'], default: 'image' },
  file_url: { type: String, required: true },
  caption: { type: String },
  alt_text: { type: String },
  is_published: { type: Boolean, default: true },
  uploaded_at: { type: Date, default: Date.now }
}, {
  collection: 'Event_Gallery',
  timestamps: { createdAt: 'uploaded_at', updatedAt: false }
});

module.exports = mongoose.model('EventGallery', EventGallerySchema, 'Event_Gallery');

