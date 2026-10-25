require('dotenv').config();
const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');
const { ensureSeeded, DEMO_EMAIL, DEMO_PASSWORD } = require('../scripts/seed');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();
    await ensureSeeded();

    const server = app.listen(PORT, () => {
      console.log(`\n======================================================`);
      console.log(` PaisaPlan API server running on http://localhost:${PORT}`);
      console.log(` Demo Account Ready: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
      console.log(`======================================================\n`);
    });

    const gracefulShutdown = async () => {
      console.log('\nShutting down server gracefully...');
      server.close(async () => {
        await disconnectDB();
        console.log('Server and database closed. Exiting process.');
        process.exit(0);
      });
    };

    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
