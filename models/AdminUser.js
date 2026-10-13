const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AdminUserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  name: { type: String, default: 'Institutional Administrator' },
  role: { type: String, default: 'admin' },
  isSetupNeeded: { type: Boolean, default: false }
}, {
  timestamps: true
});

AdminUserSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compareSync(candidatePassword, this.passwordHash);
};

module.exports = mongoose.model('AdminUser', AdminUserSchema);
