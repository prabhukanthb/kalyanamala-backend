require('dotenv').config();

const app = require('./app');
const { connectDatabase, validateConnection } = require('./config/database');

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const startServer = async () => {
  try {
    console.log('Starting backend...');
    console.log(`Environment: ${NODE_ENV}`);
    console.log(`Port: ${PORT}`);

    await connectDatabase();
    const ok = await validateConnection();
    if (!ok) throw new Error('Database validation failed');

    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    process.on('SIGTERM', () => {
      server.close(() => process.exit(0));
    });

    process.on('SIGINT', () => {
      server.close(() => process.exit(0));
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
