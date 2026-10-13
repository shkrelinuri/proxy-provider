const mongoose = require('mongoose');
const { mongoUri } = require('./env');

async function connectDB() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(mongoUri);
  console.log('[db] connected to MongoDB');

  mongoose.connection.on('error', (err) => {
    console.error('[db] connection error', err);
  });
}

module.exports = connectDB;
