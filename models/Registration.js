const mongoose = require('mongoose');

const RegistrationSchema = new mongoose.Schema({
  id: { type: String, unique: true, index: true },
  eventId: { type: mongoose.Schema.Types.Mixed, required: true },
  referenceId: { type: String, unique: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  department: String,
  status: { type: String, default: 'Confirmed' },
  accessibilityNeeds: [String],
  dietaryRequirements: String,
  registeredAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('Registration', RegistrationSchema);
