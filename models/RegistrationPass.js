const mongoose = require('mongoose');

// ─── 2.7 Registration_Passes Schema ───
const RegistrationPassSchema = new mongoose.Schema({
  pass_id: { type: Number, unique: true, index: true },
  registration_id: { type: Number, unique: true, index: true },
  pass_code: { type: String, required: true, unique: true },
  status: { type: String, enum: ['active', 'used', 'revoked', 'expired'], default: 'active' },
  issued_at: { type: Date, default: Date.now },
  expires_at: { type: Date, default: null },
  checked_in_at: { type: Date, default: null },
  checked_in_by: { type: Number, default: null }
}, {
  collection: 'Registration_Passes',
  timestamps: { createdAt: 'issued_at', updatedAt: false }
});

module.exports = mongoose.model('RegistrationPass', RegistrationPassSchema, 'Registration_Passes');

