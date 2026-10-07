const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { signToken } = require('../utils/token');

function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email, role: user.role, status: user.status, createdAt: user.createdAt, updatedAt: user.updatedAt };
}

function passwordValidationMessage(password) {
  if (typeof password !== 'string' || password.length < 8) return 'Password must be at least 8 characters long.';
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    return 'Password must include uppercase, lowercase, number, and special characters.';
  }
  return null;
}

const register = asyncHandler(async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;
  if (!name || !email || !password || !confirmPassword) return res.status(400).json({ message: 'Name, email, password, and confirm password are required.' });
  if (password !== confirmPassword) return res.status(400).json({ message: 'Password and confirm password must match.' });
  const passwordError = passwordValidationMessage(password);
  if (passwordError) return res.status(400).json({ message: passwordError });
  const normalizedEmail = String(email).trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) return res.status(400).json({ message: 'Enter a valid email address.' });
  if (await User.exists({ email: normalizedEmail })) return res.status(409).json({ message: 'An account with this email already exists.' });
  // Public registration deliberately ignores every field except these values; role is always the schema default.
  const user = await User.create({ name: String(name).trim(), email: normalizedEmail, passwordHash: password });
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });
  const user = await User.findOne({ email: String(email).trim().toLowerCase() }).select('+passwordHash');
  if (!user || !(await user.comparePassword(password))) return res.status(401).json({ message: 'Invalid email or password.' });
  if (user.status === 'disabled') return res.status(401).json({ message: 'Invalid email or password.' });
  res.json({ token: signToken(user), user: publicUser(user) });
});

const me = asyncHandler(async (req, res) => res.json({ user: publicUser(req.user) }));
module.exports = { register, login, me, passwordValidationMessage };
