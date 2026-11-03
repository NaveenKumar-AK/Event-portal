const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  user_id: { type: Number, unique: true, index: true },
  full_name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, default: null },
  password_hash: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  last_login_at: { type: Date, default: null },
  name: { type: String }
}, {
  collection: 'Users',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

UserSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compareSync(candidatePassword, this.password_hash);
};

module.exports = mongoose.model('User', UserSchema, 'Users');

