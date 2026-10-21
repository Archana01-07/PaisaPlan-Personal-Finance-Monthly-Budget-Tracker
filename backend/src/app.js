require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { isDBConnected } = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const insightsRoutes = require('./routes/insightsRoutes');

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(new Error('CORS not allowed for this origin'));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Health endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: isDBConnected() ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development',
  });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/insights', insightsRoutes);

// Central error handler
app.use(errorHandler);

module.exports = app;
