const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');

function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, jwtSecret(), { expiresIn: '7d' });
}

module.exports = { signToken };
