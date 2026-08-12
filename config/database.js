const mongoose = require('mongoose');

const connectDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/kalyanamala';

    const options = {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 5
    };

    console.log('Connecting to MongoDB...');
    console.log(`URI: ${mongoUri.replace(/:[^:]*@/, ':****@')}`);

    const conn = await mongoose.connect(mongoUri, options);

    console.log('MongoDB connected successfully');
    console.log(`Database: ${conn.connection.name}`);
    console.log(`Host: ${conn.connection.host}`);
    console.log(`Port: ${conn.connection.port}`);

    setupEventListeners(conn);

    return conn;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

const setupEventListeners = (connection) => {
  connection.connection.on('open', () => {
    console.log('MongoDB connection opened');
  });

  connection.connection.on('disconnected', () => {
    console.warn('MongoDB connection disconnected');
  });

  connection.connection.on('error', (error) => {
    console.error('MongoDB connection error:', error.message);
  });
};

const disconnectDatabase = async () => {
  try {
    await mongoose.disconnect();
    console.log('MongoDB disconnected successfully');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error.message);
    process.exit(1);
  }
};

const checkDatabaseHealth = async () => {
  try {
    await mongoose.connection.db.admin().ping();
    return { healthy: true, message: 'Database is healthy' };
  } catch (error) {
    return { healthy: false, message: error.message };
  }
};

const validateConnection = async () => {
  try {
    const health = await checkDatabaseHealth();
    return health.healthy;
  } catch (error) {
    console.error('Connection validation error:', error.message);
    return false;
  }
};

const gracefulShutdown = async () => {
  try {
    console.log('Gracefully shutting down...');
    await disconnectDatabase();
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error.message);
    process.exit(1);
  }
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

module.exports = {
  connectDatabase,
  disconnectDatabase,
  checkDatabaseHealth,
  validateConnection,
  gracefulShutdown
};
