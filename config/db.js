const mongoose = require('mongoose');
const seedDatabase = require('../data/seedDb');

const isDbConnected = () => mongoose.connection.readyState === 1;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/servedeserve';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`🍃 Connected to MongoDB: ${conn.connection.host}/${conn.connection.name}`);
    await seedDatabase();
    return conn;
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    console.warn('⚠️  Continuing with in-memory store fallback.');
  }
};

module.exports = connectDB;
module.exports.isDbConnected = isDbConnected;
