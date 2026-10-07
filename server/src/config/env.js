const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: process.env.ENV_FILE || path.resolve(__dirname, '../../../.env') });

function requireValue(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required. Add it to your .env file.`);
  return value;
}

module.exports = {
  port: Number(process.env.PORT || 5001),
  mongoUri: () => requireValue('MONGODB_URI'),
  jwtSecret: () => requireValue('JWT_SECRET')
};
