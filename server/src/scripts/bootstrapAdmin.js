const User = require('../models/User');
const { passwordValidationMessage } = require('../controllers/authController');
const { connectDatabase } = require('../config/database');
const mongoose = require('mongoose');

async function bootstrapAdmin() {
  const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  if (!email) return;
  const existing = await User.findOne({ email }).select('+passwordHash');
  if (existing) {
    if (existing.role !== 'admin') {
      existing.role = 'admin';
      console.log(`ADMIN_EMAIL account promoted to admin: ${email}`);
    }
    // A few legacy local records were created without either password field.
    // Repair only that unusable state; a real hash is never overwritten.
    if (!existing.passwordHash) {
      const password = process.env.ADMIN_PASSWORD;
      const passwordError = passwordValidationMessage(password);
      if (passwordError) throw new Error(`ADMIN_PASSWORD is required to repair this account: ${passwordError}`);
      existing.passwordHash = password;
      console.log(`ADMIN_EMAIL account password hash repaired for ${email}`);
    }
    if (existing.isModified()) await existing.save();
    return;
  }

  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    console.warn('ADMIN_EMAIL has no matching account. Set ADMIN_PASSWORD to create the initial admin.');
    return;
  }
  const passwordError = passwordValidationMessage(password);
  if (passwordError) throw new Error(`ADMIN_PASSWORD is invalid: ${passwordError}`);
  await User.create({
    name: String(process.env.ADMIN_NAME || 'TRENDZ Administrator').trim(),
    email,
    passwordHash: password,
    role: 'admin',
    status: 'active'
  });
  console.log(`Initial administrator created for ${email}`);
}

module.exports = { bootstrapAdmin };

// Allows the documented local command to be run independently as well as from
// server startup. Credentials remain environment-only and are never printed.
if (require.main === module) {
  connectDatabase()
    .then(bootstrapAdmin)
    .then(() => mongoose.disconnect())
    .catch(async (error) => {
      console.error(`Admin bootstrap failed: ${error.message}`);
      await mongoose.disconnect();
      process.exit(1);
    });
}
