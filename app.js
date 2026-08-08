// ==========================================
// EXPRESS APP CONFIGURATION
// New Kalyanamala Matrimony
// ==========================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const {
  globalErrorHandler,
  jsonErrorHandler,
  catchNotFound
} = require('./middleware/errorHandler');

// Import Routes
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profiles');
const connectionRoutes = require('./routes/connections');
const messageRoutes = require('./routes/messages');
const notificationRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');

// ==========================================
// EXPRESS APP SETUP
// ==========================================

const app = express();

// ==========================================
// MIDDLEWARE
// ==========================================

// Security
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  optionsSuccessStatus: 200
}));

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// JSON Error Handler
app.use(jsonErrorHandler);

// ==========================================
// STATIC FILES
// ==========================================

app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// ROUTES
// ==========================================

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

// API version endpoint
app.get('/api/version', (req, res) => {
  res.json({
    success: true,
    version: '1.0.0',
    api: 'Kalyanamala Matrimonial Platform',
    documentation: '/api/docs'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// ==========================================
// 404 HANDLER
// ==========================================

app.use(catchNotFound);

// ==========================================
// ERROR HANDLER (MUST BE LAST)
// ==========================================

app.use(globalErrorHandler);

// ==========================================
// EXPORT APP
// ==========================================

module.exports = app;
