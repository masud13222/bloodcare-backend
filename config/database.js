const mongoose = require('mongoose');
const { logger } = require('../middleware/errorHandler');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed through app termination');
      } catch (error) {
        logger.error('Error closing MongoDB connection:', error);
      }
      process.exit(0);
    });

  } catch (error) {
    logger.error('MongoDB connection failed:', error);
    // Don't exit the process, let the app continue without database
    console.error('Warning: Database connection failed, continuing without database');
  }
};

module.exports = connectDB;