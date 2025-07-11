const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'bloodcare-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Custom error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Handle Cast Error (Invalid MongoDB ObjectId)
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

// Handle Duplicate Field Error
const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  
  let message = `Duplicate field value: ${value}. Please use another value!`;
  
  // Customize message for common fields
  if (field === 'email') {
    message = 'This email address is already registered. Please use a different email.';
  } else if (field === 'phone') {
    message = 'This phone number is already registered. Please use a different phone number.';
  }
  
  return new AppError(message, 400);
};

// Handle Validation Error
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// Handle JWT Error
const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401);

// Handle JWT Expired Error
const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401);

// Send error in development
const sendErrorDev = (err, req, res) => {
  // API Error
  if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/')) {
    return res.status(err.statusCode).json({
      success: false,
      error: err,
      message: err.message,
      stack: err.stack
    });
  }
};

// Send error in production
const sendErrorProd = (err, req, res) => {
  // API Error
  if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/')) {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message
      });
    }
    
    // Programming or other unknown error: don't leak error details
    // 1) Log error
    logger.error('ERROR 💥', err);
    
    // 2) Send generic message
    return res.status(500).json({
      success: false,
      message: 'Something went wrong!'
    });
  }
};

// Global error handling middleware
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // MongoDB Cast Error
    if (err.name === 'CastError') error = handleCastErrorDB(error);
    
    // MongoDB Duplicate Key Error
    if (err.code === 11000) error = handleDuplicateFieldsDB(error);
    
    // MongoDB Validation Error
    if (err.name === 'ValidationError') error = handleValidationErrorDB(error);
    
    // JWT Invalid Signature
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    
    // JWT Expired
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, req, res);
  }
};

// Catch async errors
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// Handle unhandled routes
const handleNotFound = (req, res, next) => {
  const err = new AppError(`Can't find ${req.originalUrl} on this server!`, 404);
  next(err);
};

// Handle uncaught exceptions
const handleUncaughtException = () => {
  process.on('uncaughtException', (err) => {
    logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    logger.error(err.name, err.message);
    process.exit(1);
  });
};

// Handle unhandled rejections
const handleUnhandledRejection = (server) => {
  process.on('unhandledRejection', (err) => {
    logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
    logger.error(err.name, err.message);
    server.close(() => {
      process.exit(1);
    });
  });
};

// Handle SIGTERM
const handleSIGTERM = (server) => {
  process.on('SIGTERM', () => {
    logger.info('👋 SIGTERM RECEIVED. Shutting down gracefully');
    server.close(() => {
      logger.info('💥 Process terminated!');
    });
  });
};

// Response formatter middleware
const formatResponse = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // If it's already a formatted response, send as is
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        if (parsed.hasOwnProperty('success')) {
          return originalSend.call(this, data);
        }
      } catch (e) {
        return originalSend.call(this, data);
      }
    }
    
    // Format the response
    const formattedResponse = {
      success: res.statusCode < 400,
      message: res.statusMessage || 'Success',
      data: data,
      timestamp: new Date().toISOString()
    };
    
    return originalSend.call(this, JSON.stringify(formattedResponse));
  };
  
  next();
};

// Request logger middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user ? req.user._id : null
    };
    
    if (res.statusCode >= 400) {
      logger.error('Request failed', logData);
    } else {
      logger.info('Request completed', logData);
    }
  });
  
  next();
};

// Rate limiting error handler
const rateLimitHandler = (req, res) => {
  logger.warn('Rate limit exceeded', {
    ip: req.ip,
    url: req.originalUrl,
    userAgent: req.get('User-Agent')
  });
  
  res.status(429).json({
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    error: 'RATE_LIMIT_EXCEEDED'
  });
};

// Maintenance mode middleware
const maintenanceMode = (req, res, next) => {
  if (process.env.MAINTENANCE_MODE === 'true') {
    return res.status(503).json({
      success: false,
      message: 'Server is currently under maintenance. Please try again later.',
      error: 'MAINTENANCE_MODE'
    });
  }
  next();
};

module.exports = {
  AppError,
  globalErrorHandler,
  catchAsync,
  handleNotFound,
  handleUncaughtException,
  handleUnhandledRejection,
  handleSIGTERM,
  formatResponse,
  requestLogger,
  rateLimitHandler,
  maintenanceMode,
  logger
};