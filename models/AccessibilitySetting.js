const mongoose = require('mongoose');

// ─── 2.10 Accessibility_Settings Schema ───
const AccessibilitySettingSchema = new mongoose.Schema({
  setting_id: { type: Number, unique: true, index: true },
  user_id: { type: Number, required: true, unique: true, index: true },
  font_size_level: { type: String, enum: ['normal', 'large', 'extra_large'], default: 'normal' },
  high_contrast: { type: Boolean, default: false },
  reduce_motion: { type: Boolean, default: false },
  screen_reader_mode: { type: Boolean, default: false },
  language_code: { type: String, default: 'en' },
  updated_at: { type: Date, default: Date.now }
}, {
  collection: 'Accessibility_Settings',
  timestamps: { createdAt: false, updatedAt: 'updated_at' }
});

module.exports = mongoose.model('AccessibilitySetting', AccessibilitySettingSchema, 'Accessibility_Settings');

