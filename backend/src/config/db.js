const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoMemoryServerInstance = null;

async function connectDB() {
  // If running tests, always use isolated in-memory MongoDB so test runs never wipe user data
  if (process.env.NODE_ENV === 'test') {
    try {
      if (!mongoMemoryServerInstance) {
        mongoMemoryServerInstance = await MongoMemoryServer.create();
      }
      const testUri = mongoMemoryServerInstance.getUri();
      await mongoose.connect(testUri);
      return;
    } catch (err) {
      console.error('Failed to initialize test in-memory MongoDB:', err.message);
      throw err;
    }
  }

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
        serverSelectionTimeoutMS: 2000,
      });
      console.log('MongoDB connected successfully to local daemon.');
      return;
    } catch (err) {
      console.warn(`Local MongoDB daemon not reachable on default port (${err.message}). Starting embedded local MongoDB...`);
    }
  }

  // Fallback to MongoMemoryServer for zero-dependency persistent local operation
  try {
    const path = require('path');
    const os = require('os');
    const fs = require('fs');
    const dbPath = process.env.MEMORY_DB_PATH || path.join(os.homedir(), '.paisaplan-dev-db');
    fs.mkdirSync(dbPath, { recursive: true });
    console.log(`Starting embedded local MongoDB daemon (persistent storage: ${dbPath})...`);

    // Try starting on default 27017 so local tools can connect directly, or fallback to auto-port
    try {
      mongoMemoryServerInstance = await MongoMemoryServer.create({
        instance: {
          port: 27017,
          dbPath,
          storageEngine: 'wiredTiger',
        },
      });
    } catch (portErr) {
      console.log('Port 27017 busy or restricted, using dynamic local port...');
      mongoMemoryServerInstance = await MongoMemoryServer.create({
        instance: {
          dbPath,
          storageEngine: 'wiredTiger',
        },
      });
    }

    let memoryUri = mongoMemoryServerInstance.getUri();
    if (!memoryUri.includes('/paisaplan')) {
      memoryUri = memoryUri.replace(/\/+$/, '') + '/paisaplan';
    }
    await mongoose.connect(memoryUri);
    console.log(`Connected to embedded local MongoDB at ${memoryUri}`);
    // Write the URI to temp file so other scripts/tools can reference it
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
