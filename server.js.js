// ==========================================
// SERVER ENTRY POINT
// New Kalyanamala Matrimony
// ==========================================

require('dotenv').config();

const app = require('./app');
const { connectDatabase, validateConnection } = require('./config/database');

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ==========================================
// START SERVER
// ==========================================

const startServer = async () => {
  try {
    console.log('🚀 Starting Kalyanamala Backend Server...');
    console.log(`📍 Environment: ${NODE_ENV}`);
    console.log(`🔌 Port: ${PORT}`);

    // Connect to database
    console.log('🔗 Connecting to MongoDB...');
    await connectDatabase();

    // Validate connection
    const isHealthy = await validateConnection();
    if (!isHealthy) {
      throw new Error('Database connection validation failed');
    }

    // Start server
    const server = app.listen(PORT, () => {
      console.log(`\n✅ Server started successfully!`);
      console.log(`📍 URL: http://localhost:${PORT}`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      console.log(`📚 API Docs: http://localhost:${PORT}/api/docs`);
      console.log(`\n🎉 Kalyanamala Backend is running!\n`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('📍 SIGTERM signal received: closing HTTP server');
      server.close(() => {
        console.log('✅ HTTP server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('📍 SIGINT signal received: closing HTTP server');
      server.close(() => {
        console.log('✅ HTTP server closed');
        process.exit(0);
      });
    });

    return server;

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;
