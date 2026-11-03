// Vercel serverless entry point
// Loads the Express app from backend/src/app.js and handles DB init + demo seeding

const path = require('path');

// Load env from backend/.env in production (Vercel env vars take precedence anyway)
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const app = require('../backend/src/app');
const { connectDB } = require('../backend/src/config/db');
const { ensureSeeded } = require('../backend/scripts/seed');

let initPromise = null;

async function initialize() {
  await connectDB();
  await ensureSeeded();
}

module.exports = async (req, res) => {
  try {
    if (!initPromise) {
      initPromise = initialize().catch((err) => {
        // Reset so next request retries
        initPromise = null;
        throw err;
      });
    }
    await initPromise;
    return app(req, res);
  } catch (error) {
    console.error('Server init error:', error.message);
    return res.status(500).json({ message: 'Server initialization failed', error: error.message });
  }
};
