const mongoose = require('mongoose');

// ─── 2.8 Event_Feedback Schema ───
const EventFeedbackSchema = new mongoose.Schema({
  feedback_id: { type: Number, unique: true, index: true },
  registration_id: { type: Number, index: true },
  event_id: { type: Number, index: true },
  user_name: { type: String },
  user_email: { type: String },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comments: { type: String },
  answers: { type: mongoose.Schema.Types.Mixed },
  is_visible: { type: Boolean, default: true },
  submitted_at: { type: Date, default: Date.now }
}, {
  collection: 'Event_Feedback',
  timestamps: { createdAt: 'submitted_at', updatedAt: false }
});

module.exports = mongoose.model('EventFeedback', EventFeedbackSchema, 'Event_Feedback');

