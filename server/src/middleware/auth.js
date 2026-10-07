const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { jwtSecret } = require('../config/env');
const asyncHandler = require('../utils/asyncHandler');

const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return res.status(401).json({ message: 'Authentication token is required.' });
  let payload;
  try {
    payload = jwt.verify(header.slice(7), jwtSecret());
  } catch {
    return res.status(401).json({ message: 'Invalid or expired authentication token.' });
  }
  const user = await User.findById(payload.sub);
  if (!user) return res.status(401).json({ message: 'User no longer exists.' });
  if (user.status === 'disabled') return res.status(403).json({ message: 'This account is disabled.' });
  req.user = user;
  next();
});

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Administrator access is required.' });
  next();
}

module.exports = { protect, requireAdmin };
