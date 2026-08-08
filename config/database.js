// ==========================================
// DATABASE CONFIGURATION
// New Kalyanamala Matrimony
// ==========================================

const mongoose = require('mongoose');

// ==========================================
// DATABASE CONNECTION
// ==========================================

const connectDatabase = async () => {
  try {
    // Get MongoDB URI from environment variables
   let mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/kalyanamala';

// Handle mongodb+srv protocol
if (mongoUri.includes('mongodb+srv')) {
  // Keep as-is, mongoose handles it
} else if (!mongoUri.includes('localhost')) {
  // It's a remote connection, keep as-is
}

    // Connection options
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // 10 seconds
      socketTimeoutMS: 45000, // 45 seconds
      family: 4, // IPv4, use 4 or 6 for IPv6
      maxPoolSize: 10,
      minPoolSize: 5,
      retryWrites: true,
      retryReads: true,
   
      // Automatic retry
      autoIndex: process.env.NODE_ENV !== 'production', // Disable in production
    };

    // Add authentication options if credentials are provided
    if (process.env.MONGODB_USER && process.env.MONGODB_PASSWORD) {
      options.authSource = process.env.MONGODB_AUTH_SOURCE || 'admin';
    }

    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    console.log(`📍 URI: ${mongoUri.replace(/:[^:]*@/, ':****@')}`);

    const conn = await mongoose.connect(mongoUri, options);

    console.log(`✅ MongoDB connected successfully`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🖥️  Host: ${conn.connection.host}`);
    console.log(`🔌 Port: ${conn.connection.port}`);

    // Set up event listeners
    setupEventListeners(conn);

    // Set up indexes
    await setupIndexes();

    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// ==========================================
// EVENT LISTENERS
// ==========================================

const setupEventListeners = (connection) => {
  // Connection open
  connection.connection.on('open', () => {
    console.log('📡 MongoDB connection opened');
  });

  // Connection disconnected
  connection.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB connection disconnected');
  });

  // Connection error
  connection.connection.on('error', (error) => {
    console.error('❌ MongoDB connection error:', error.message);
  });

  // Connection reconnecting
  connection.connection.on('reconnect', () => {
    console.log('🔄 MongoDB reconnecting...');
  });

  // Connection reconnected
  connection.connection.on('reconnected', () => {
    console.log('✅ MongoDB reconnected successfully');
  });

  // Connection timeout
  connection.connection.on('timeout', () => {
    console.warn('⏱️  MongoDB connection timeout');
  });
};

// ==========================================
// CREATE INDEXES
// ==========================================

const setupIndexes = async () => {
  try {
    console.log('📑 Setting up database indexes...');

    // Import models
    const User = require('../models/User');
    const Profile = require('../models/Profile');
    const Connection = require('../models/Connection');
    const Message = require('../models/Message');
    const Conversation = require('../models/Conversation');
    const Notification = require('../models/Notification');

    // Create all indexes
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ phone: 1 }, { unique: true });
    await User.collection.createIndex({ createdAt: -1 });
    await User.collection.createIndex({ status: 1 });
    await User.collection.createIndex({ role: 1 });
    
    await Profile.collection.createIndex({ userId: 1 }, { unique: true });
    await Profile.collection.createIndex({ 'location.city': 1 });
    await Profile.collection.createIndex({ gender: 1, religion: 1 });
    await Profile.collection.createIndex({ 'statistics.viewCount': -1 });
    
    await Connection.collection.createIndex({ senderId: 1, recipientId: 1, status: 1 });
    await Connection.collection.createIndex({ recipientId: 1, status: 1 });
    await Connection.collection.createIndex({ status: 1 });
    
    await Message.collection.createIndex({ conversationId: 1, createdAt: -1 });
    await Message.collection.createIndex({ senderId: 1, recipientId: 1 });
    await Message.collection.createIndex({ isRead: 1 });
    
    await Conversation.collection.createIndex({ participants: 1, lastMessageAt: -1 });
    await Conversation.collection.createIndex({ 'unreadCounts.userId': 1 });
    
    await Notification.collection.createIndex({ userId: 1, isRead: 1, createdAt: -1 });
    await Notification.collection.createIndex({ userId: 1, type: 1 });

    console.log('✅ All indexes created successfully');
  } catch (error) {
    console.warn('⚠️  Error creating indexes:', error.message);
    // Don't exit on index error, as they might already exist
  }
};

// ==========================================
// DISCONNECT DATABASE
// ==========================================

const disconnectDatabase = async () => {
  try {
    await mongoose.disconnect();
    console.log('✅ MongoDB disconnected successfully');
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error.message);
    process.exit(1);
  }
};

// ==========================================
// HEALTH CHECK
// ==========================================

const checkDatabaseHealth = async () => {
  try {
    const admin = mongoose.connection.db.admin();
    const status = await admin.ping();
    return { healthy: true, message: 'Database is healthy' };
  } catch (error) {
    return { healthy: false, message: error.message };
  }
};

// ==========================================
// DROP ALL COLLECTIONS (DEVELOPMENT ONLY)
// ==========================================

const dropAllCollections = async () => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Cannot drop collections in production');
  }

  try {
    console.warn('🗑️  Dropping all collections...');
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    for (const collection of collections) {
      await mongoose.connection.db.dropCollection(collection.name);
    }
    
    console.log('✅ All collections dropped successfully');
  } catch (error) {
    console.error('❌ Error dropping collections:', error.message);
  }
};

// ==========================================
// SEED DATABASE (DEVELOPMENT ONLY)
// ==========================================

const seedDatabase = async () => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Cannot seed database in production');
  }

  try {
    console.log('🌱 Seeding database...');

    const User = require('../models/User');
    const bcrypt = require('bcryptjs');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists');
      return;
    }

    // Create admin user
    const adminPassword = await bcrypt.hash('Admin@123456', 10);
    
    const adminUser = new User({
      email: 'admin@kalyanamala.com',
      phone: '1234567890',
      firstName: 'Admin',
      lastName: 'User',
      password: adminPassword,
      role: 'admin',
      status: 'active',
      emailVerified: true,
      phoneVerified: true,
      isPremium: true
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully');
    console.log(`📧 Email: admin@kalyanamala.com`);
    console.log(`🔑 Password: Admin@123456`);

    // Create test users
    const testUsers = [];
    for (let i = 1; i <= 5; i++) {
      const testPassword = await bcrypt.hash('Test@123456', 10);
      
      const testUser = new User({
        email: `user${i}@example.com`,
        phone: `${1000000000 + i}`,
        firstName: `User`,
        lastName: `${i}`,
        password: testPassword,
        role: 'user',
        status: 'active',
        emailVerified: true,
        phoneVerified: true
      });

      testUsers.push(testUser);
    }

    await User.insertMany(testUsers);
    console.log(`✅ ${testUsers.length} test users created successfully`);

  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
  }
};

// ==========================================
// CLEANUP OLD DATA (MAINTENANCE)
// ==========================================

const cleanupOldData = async () => {
  try {
    console.log('🧹 Cleaning up old data...');

    const Message = require('../models/Message');
    const Notification = require('../models/Notification');

    // Delete messages older than 1 year
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const deletedMessages = await Message.deleteMany({
      createdAt: { $lt: oneYearAgo },
      isDeleted: true
    });

    console.log(`✅ Deleted ${deletedMessages.deletedCount} old messages`);

    // Delete notifications older than 90 days
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const deletedNotifications = await Notification.deleteMany({
      createdAt: { $lt: ninetyDaysAgo },
      isArchived: true
    });

    console.log(`✅ Deleted ${deletedNotifications.deletedCount} old notifications`);

  } catch (error) {
    console.error('❌ Error cleaning up old data:', error.message);
  }
};

// ==========================================
// BACKUP DATABASE (HELPER)
// ==========================================

const backupDatabase = async () => {
  try {
    console.log('💾 Creating database backup...');

    const admin = mongoose.connection.db.admin();
    const collections = await mongoose.connection.db.listCollections().toArray();

    const backup = {
      timestamp: new Date(),
      database: mongoose.connection.name,
      collections: []
    };

    for (const collection of collections) {
      const data = await mongoose.connection.db.collection(collection.name).find({}).toArray();
      backup.collections.push({
        name: collection.name,
        count: data.length,
        data
      });
    }

    console.log(`✅ Database backup created with ${backup.collections.length} collections`);

    return backup;

  } catch (error) {
    console.error('❌ Error creating backup:', error.message);
  }
};

// ==========================================
// GET DATABASE STATISTICS
// ==========================================

const getDatabaseStats = async () => {
  try {
    const User = require('../models/User');
    const Profile = require('../models/Profile');
    const Connection = require('../models/Connection');
    const Message = require('../models/Message');
    const Conversation = require('../models/Conversation');
    const Notification = require('../models/Notification');

    const stats = {
      users: await User.countDocuments(),
      profiles: await Profile.countDocuments(),
      connections: await Connection.countDocuments(),
      acceptedConnections: await Connection.countDocuments({ status: 'accepted' }),
      messages: await Message.countDocuments(),
      conversations: await Conversation.countDocuments(),
      notifications: await Notification.countDocuments(),
      unreadNotifications: await Notification.countDocuments({ isRead: false }),
      timestamp: new Date()
    };

    return stats;

  } catch (error) {
    console.error('❌ Error getting database stats:', error.message);
  }
};

// ==========================================
// VALIDATE CONNECTION
// ==========================================

const validateConnection = async () => {
  try {
    const health = await checkDatabaseHealth();
    
    if (health.healthy) {
      console.log('✅ Database connection is valid');
      return true;
    } else {
      console.error('❌ Database connection is invalid:', health.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Connection validation error:', error.message);
    return false;
  }
};

// ==========================================
// GRACEFUL SHUTDOWN
// ==========================================

const gracefulShutdown = async () => {
  try {
    console.log('🛑 Gracefully shutting down...');
    
    await disconnectDatabase();
    console.log('✅ Application shutdown complete');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error.message);
    process.exit(1);
  }
};

// ==========================================
// HANDLE PROCESS SIGNALS
// ==========================================

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  connectDatabase,
  disconnectDatabase,
  checkDatabaseHealth,
  dropAllCollections,
  seedDatabase,
  cleanupOldData,
  backupDatabase,
  getDatabaseStats,
  validateConnection,
  gracefulShutdown
};
