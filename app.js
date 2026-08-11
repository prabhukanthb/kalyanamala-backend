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
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://newkalyanamala.com',
  'https://www.newkalyanamala.com',
  'https://kalyanamala.com',
  'https://www.kalyanamala.com',
  'https://newkalyanamala.org',
  'https://www.newkalyanamala.org',
  'https://kalyanamala-frontend.vercel.app',
  'https://kalyanamala-frontend-j11gdtcp7-prabhukanthbs-projects.vercel.app'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests without origin like curl/Postman/mobile apps
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS','PATCH'],
  allowedHeaders: ['Content-Type','Authorization']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

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
