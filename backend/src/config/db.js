const mongoose = require('mongoose');

let mongoServer;

const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fleetsphere';

    try {
      const conn = await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
      console.log(`[Database] MongoDB Connected to: ${conn.connection.host}`);
      return conn;
    } catch (localErr) {
      if (process.env.NODE_ENV === 'production') {
        console.error(`[Database Critical] Failed to connect to MongoDB production URI: ${localErr.message}`);
        throw localErr;
      }
      console.warn(`[Database] Standard connect failed (${localErr.message}). Attempting MongoMemoryServer fallback for local development...`);
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoServer = await MongoMemoryServer.create();
      mongoUri = mongoServer.getUri();
      console.log(`[Database] Using MongoMemoryServer at: ${mongoUri}`);
      const conn = await mongoose.connect(mongoUri);
      return conn;
    }
  } catch (error) {
    console.error(`[Database Error] ${error.message}`);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
};

module.exports = { connectDB, disconnectDB };
