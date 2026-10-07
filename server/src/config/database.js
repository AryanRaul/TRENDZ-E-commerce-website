const mongoose = require('mongoose');
const { mongoUri } = require('./env');

async function connectDatabase() {
  const uri = mongoUri();
  mongoose.connection.on('error', (error) => {
    console.error(`MongoDB connection error: ${error.message}`);
  });
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
}

function databaseStatus() {
  return mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
}

module.exports = { connectDatabase, databaseStatus };
