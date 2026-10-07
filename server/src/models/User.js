const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  // Normalize before the unique index is evaluated, independent of the caller.
  email: { type: String, required: true, unique: true, set: normalizeEmail, match: [/^\S+@\S+\.\S+$/, 'Enter a valid email address.'] },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  status: { type: String, enum: ['active', 'disabled'], default: 'active', index: true }
}, { timestamps: true, versionKey: false });

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('passwordHash')) return next();
  try {
    this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);
module.exports.normalizeEmail = normalizeEmail;
