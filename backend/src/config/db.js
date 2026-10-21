const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoMemoryServerInstance = null;

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (uri && !uri.includes('localhost') && !uri.includes('127.0.0.1')) {
    // External URI (like MongoDB Atlas)
    try {
      console.log(`Connecting to MongoDB at: ${uri.split('@')[1] || uri}`);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log('MongoDB connected successfully to external URI.');
      return;
    } catch (err) {
      console.error('Failed to connect to external MongoDB URI:', err.message);
      throw err;
    }
  }

  // If local URI is specified, try connecting to it first
  if (uri) {
    try {
      console.log(`Attempting to connect to local MongoDB at ${uri}...`);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 3000,
      });
      console.log('MongoDB connected successfully to local daemon.');
      return;
    } catch (err) {
      console.warn(`Local MongoDB daemon not reachable (${err.message}). Starting embedded in-memory MongoDB...`);
    }
  }

  // Fallback to MongoMemoryServer for flawless zero-dependency local operation
  try {
    const path = require('path');
    const os = require('os');
    const fs = require('fs');
    const dbPath = process.env.MEMORY_DB_PATH || path.join(os.homedir(), '.paisaplan-dev-db');
    // Ensure the directory exists before starting MongoMemoryServer
    fs.mkdirSync(dbPath, { recursive: true });
    console.log(`Starting embedded MongoDB (storage: ${dbPath})...`);
    mongoMemoryServerInstance = await MongoMemoryServer.create({
      instance: {
        dbPath,
        storageEngine: 'wiredTiger',
      },
    });
    const memoryUri = mongoMemoryServerInstance.getUri();
    await mongoose.connect(memoryUri);
    console.log(`Connected to embedded MongoDB at ${memoryUri}`);
    // Write the URI to a temp file so seed scripts can connect to the same instance
    const uriFile = path.join(os.tmpdir(), 'paisaplan-db-uri.txt');
    fs.writeFileSync(uriFile, memoryUri, 'utf8');
  } catch (err) {
    console.error('Failed to initialize embedded MongoDB:', err.message);
    throw err;
  }
}

async function disconnectDB() {
  try {
    await mongoose.disconnect();
    if (mongoMemoryServerInstance) {
      await mongoMemoryServerInstance.stop();
      mongoMemoryServerInstance = null;
    }
  } catch (err) {
    console.error('Error disconnecting MongoDB:', err.message);
  }
}

function isDBConnected() {
  return mongoose.connection.readyState === 1;
}

module.exports = {
  connectDB,
  disconnectDB,
  isDBConnected,
};
