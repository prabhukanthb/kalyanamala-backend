const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { globalErrorHandler, catchNotFound } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profiles');

const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://newkalyanamala.com',
  'https://www.newkalyanamala.com',
  'https://kalyanamala.com',
  'https://www.kalyanamala.com',
  'https://newkalyanamala.org',
  'https://www.newkalyanamala.org'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS','PATCH'],
  allowedHeaders: ['Content-Type','Authorization']
};
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);
app.use(helmet());
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

app.get('/api/version', (req, res) => {
  res.json({ success: true, version: '1.0.0' });
});

app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);

app.use(catchNotFound);
app.use(globalErrorHandler);

module.exports = app;
