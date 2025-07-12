require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

// Import database connection
const connectDB = require('./config/database');

// Import middleware with error handling
let globalErrorHandler, handleNotFound, handleUncaughtException, handleUnhandledRejection, handleSIGTERM, requestLogger, rateLimitHandler, maintenanceMode;
let authRateLimit, generalRateLimit, uploadRateLimit, passwordResetRateLimit, helmetConfig, requestSignature, ipFilter, requestId, securityHeaders, inputSanitization, corsOptions, securityRequestLogger, apiVersioning, compressionConfig, requestSizeLimit, deviceFingerprint, securityMaintenanceMode;
let serveStaticFiles, dualUploadMiddleware;
let protect, optionalAuth;
let validateUserRegistration, validateUserLogin, validateBloodRequest, validateDonationRecord, validateMessage, validateProfileUpdate, validatePasswordChange, validateMongoId, validatePagination, validateSearchQuery;
let authController;

try {
  const errorHandler = require('./middleware/errorHandler');
  globalErrorHandler = errorHandler.globalErrorHandler;
  handleNotFound = errorHandler.handleNotFound;
  handleUncaughtException = errorHandler.handleUncaughtException;
  handleUnhandledRejection = errorHandler.handleUnhandledRejection;
  handleSIGTERM = errorHandler.handleSIGTERM;
  requestLogger = errorHandler.requestLogger;
  rateLimitHandler = errorHandler.rateLimitHandler;
  maintenanceMode = errorHandler.maintenanceMode;
} catch (error) {
  console.error('Error loading error handler middleware:', error.message);
  // Create fallback functions
  globalErrorHandler = (err, req, res, next) => {
    res.status(500).json({ success: false, message: 'Internal server error' });
  };
  handleNotFound = (req, res, next) => {
    res.status(404).json({ success: false, message: 'Route not found' });
  };
  handleUncaughtException = () => {};
  handleUnhandledRejection = () => {};
  handleSIGTERM = () => {};
  requestLogger = (req, res, next) => next();
  rateLimitHandler = (req, res) => {
    res.status(429).json({ success: false, message: 'Too many requests' });
  };
  maintenanceMode = (req, res, next) => next();
}

try {
  const security = require('./middleware/security');
  authRateLimit = security.authRateLimit;
  generalRateLimit = security.generalRateLimit;
  uploadRateLimit = security.uploadRateLimit;
  passwordResetRateLimit = security.passwordResetRateLimit;
  helmetConfig = security.helmetConfig;
  requestSignature = security.requestSignature;
  ipFilter = security.ipFilter;
  requestId = security.requestId;
  securityHeaders = security.securityHeaders;
  inputSanitization = security.inputSanitization;
  corsOptions = security.corsOptions;
  securityRequestLogger = security.requestLogger;
  apiVersioning = security.apiVersioning;
  compressionConfig = security.compressionConfig;
  requestSizeLimit = security.requestSizeLimit;
  deviceFingerprint = security.deviceFingerprint;
  securityMaintenanceMode = security.maintenanceMode;
} catch (error) {
  console.error('Error loading security middleware:', error.message);
  // Create fallback functions
  authRateLimit = (req, res, next) => next();
  generalRateLimit = (req, res, next) => next();
  uploadRateLimit = (req, res, next) => next();
  passwordResetRateLimit = (req, res, next) => next();
  helmetConfig = (req, res, next) => next();
  requestSignature = (req, res, next) => next();
  ipFilter = (req, res, next) => next();
  requestId = (req, res, next) => next();
  securityHeaders = (req, res, next) => next();
  inputSanitization = [(req, res, next) => next()];
  corsOptions = {};
  securityRequestLogger = (req, res, next) => next();
  apiVersioning = (req, res, next) => next();
  compressionConfig = (req, res, next) => next();
  requestSizeLimit = (req, res, next) => next();
  deviceFingerprint = (req, res, next) => next();
  securityMaintenanceMode = (req, res, next) => next();
}

try {
  const upload = require('./middleware/upload');
  serveStaticFiles = upload.serveStaticFiles;
  dualUploadMiddleware = upload.dualUploadMiddleware;
} catch (error) {
  console.error('Error loading upload middleware:', error.message);
  serveStaticFiles = (app) => {};
  dualUploadMiddleware = (fieldName) => (req, res, next) => next();
}

try {
  const auth = require('./middleware/auth');
  protect = auth.protect;
  optionalAuth = auth.optionalAuth;
} catch (error) {
  console.error('Error loading auth middleware:', error.message);
  protect = (req, res, next) => next();
  optionalAuth = (req, res, next) => next();
}

try {
  const validation = require('./middleware/validation');
  validateUserRegistration = validation.validateUserRegistration;
  validateUserLogin = validation.validateUserLogin;
  validateBloodRequest = validation.validateBloodRequest;
  validateDonationRecord = validation.validateDonationRecord;
  validateMessage = validation.validateMessage;
  validateProfileUpdate = validation.validateProfileUpdate;
  validatePasswordChange = validation.validatePasswordChange;
  validateMongoId = validation.validateMongoId;
  validatePagination = validation.validatePagination;
  validateSearchQuery = validation.validateSearchQuery;
} catch (error) {
  console.error('Error loading validation middleware:', error.message);
  validateUserRegistration = [(req, res, next) => next()];
  validateUserLogin = [(req, res, next) => next()];
  validateBloodRequest = [(req, res, next) => next()];
  validateDonationRecord = [(req, res, next) => next()];
  validateMessage = [(req, res, next) => next()];
  validateProfileUpdate = [(req, res, next) => next()];
  validatePasswordChange = [(req, res, next) => next()];
  validateMongoId = (paramName) => [(req, res, next) => next()];
  validatePagination = [(req, res, next) => next()];
  validateSearchQuery = [(req, res, next) => next()];
}

try {
  authController = require('./controllers/authController');
} catch (error) {
  console.error('Error loading auth controller:', error.message);
  authController = {
    register: (req, res) => res.json({ success: true, message: 'Register endpoint - Implementation pending' }),
    login: (req, res) => res.json({ success: true, message: 'Login endpoint - Implementation pending' }),
    logout: (req, res) => res.json({ success: true, message: 'Logout endpoint - Implementation pending' }),
    refreshToken: (req, res) => res.json({ success: true, message: 'Refresh token endpoint - Implementation pending' }),
    forgotPassword: (req, res) => res.json({ success: true, message: 'Forgot password endpoint - Implementation pending' }),
    resetPassword: (req, res) => res.json({ success: true, message: 'Reset password endpoint - Implementation pending' }),
    verifyOTP: (req, res) => res.json({ success: true, message: 'Verify OTP endpoint - Implementation pending' }),
    changePassword: (req, res) => res.json({ success: true, message: 'Change password endpoint - Implementation pending' })
  };
}

// Import models (to ensure they're registered)
try {
  require('./models/User');
  require('./models/BloodRequest');
  require('./models/Donation');
  require('./models/Notification');
  require('./models/Message');
  require('./models/Achievement');
} catch (error) {
  console.error('Error loading models:', error.message);
}

// Handle uncaught exceptions
handleUncaughtException();

// Connect to database
console.log('About to connect to database...');
connectDB().catch(err => {
  console.error('Failed to connect to database:', err.message);
  // Don't exit the process, let the app continue without database
});
console.log('Database connection initiated...');

console.log('Creating Express app...');
const app = express();

console.log('Setting up middleware...');

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Create logs directory
const fs = require('fs');
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

// Create assets directories
const dirs = ['assets', 'assets/profileimage', 'assets/documents', 'assets/certificates'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Advanced Security Middleware
console.log('Setting up security middleware...');
app.use(requestId); // Add unique request ID
app.use(ipFilter); // IP filtering and blacklist
app.use(deviceFingerprint); // Device fingerprinting
app.use(helmetConfig); // Advanced Helmet configuration
app.use(securityHeaders); // Additional security headers
app.use(cors(corsOptions)); // Advanced CORS configuration
app.use(compressionConfig); // Smart compression
app.use(requestSizeLimit); // Request size limiting
app.use(...inputSanitization); // XSS and NoSQL injection protection
app.use(apiVersioning); // API versioning support
app.use(requestSignature); // Request signature verification

// Body parsing middleware
console.log('Setting up body parsing middleware...');
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
console.log('Setting up static files...');
try {
  serveStaticFiles(app);
} catch (error) {
  console.error('Error setting up static files:', error.message);
}

// Request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use(requestLogger);

// Maintenance mode
app.use(securityMaintenanceMode);

// Global rate limiting
app.use(generalRateLimit);

// Security request logging
app.use(securityRequestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'BloodCare API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API Routes

// 🔐 Authentication & User Management Routes
app.post('/auth/register', authRateLimit, validateUserRegistration, authController.register);
app.post('/auth/login', authRateLimit, validateUserLogin, authController.login);
app.post('/auth/logout', protect, authController.logout);
app.post('/auth/refresh-token', authRateLimit, authController.refreshToken);
app.post('/auth/forgot-password', passwordResetRateLimit, authController.forgotPassword);
app.post('/auth/reset-password/:token', passwordResetRateLimit, validatePasswordChange, authController.resetPassword);
app.post('/auth/verify-otp', authRateLimit, authController.verifyOTP);
app.post('/auth/change-password', protect, authRateLimit, validatePasswordChange, authController.changePassword);

// 👤 User Profile Management Routes
app.get('/user/profile', protect, (req, res) => {
  res.json({
    success: true,
    message: 'User profile retrieved successfully',
    data: req.user
  });
});

app.put('/user/profile', protect, validateProfileUpdate, (req, res) => {
  res.json({ success: true, message: 'Profile update endpoint - Implementation pending' });
});

app.post('/user/upload-avatar', protect, uploadRateLimit, dualUploadMiddleware('avatar'), (req, res) => {
  if (!req.file && !req.uploadResults) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  let fileInfo = {};
  
  if (req.uploadResults) {
    // Dual upload
    fileInfo = req.uploadResults;
  } else if (req.file) {
    // Single upload
    if (process.env.UPLOAD_STRATEGY === 'cloudinary') {
      fileInfo.cloudinary = {
        public_id: req.file.filename,
        url: req.file.path
      };
    } else {
      fileInfo.local = {
        filename: req.file.filename,
        path: req.file.path,
        url: `${req.protocol}://${req.get('host')}/assets/profileimage/${req.file.filename}`
      };
    }
  }

  res.json({
    success: true,
    message: 'Avatar uploaded successfully',
    data: {
      fileInfo,
      uploadStrategy: process.env.UPLOAD_STRATEGY || 'local',
      availableUrls: {
        local: fileInfo.local?.url,
        cloudinary: fileInfo.cloudinary?.url
      },
      primaryUrl: fileInfo.cloudinary?.url || fileInfo.local?.url
    }
  });
});

app.get('/user/stats', protect, (req, res) => {
  res.json({ success: true, message: 'User stats endpoint - Implementation pending' });
});

app.put('/user/availability', protect, (req, res) => {
  res.json({ success: true, message: 'Availability toggle endpoint - Implementation pending' });
});

app.get('/user/achievements', protect, (req, res) => {
  res.json({ success: true, message: 'User achievements endpoint - Implementation pending' });
});

app.put('/user/settings', protect, (req, res) => {
  res.json({ success: true, message: 'User settings endpoint - Implementation pending' });
});

app.delete('/user/account', protect, (req, res) => {
  res.json({ success: true, message: 'Account deletion endpoint - Implementation pending' });
});

// 🩸 Blood Request Management Routes
app.post('/requests/create', protect, validateBloodRequest, (req, res) => {
  res.json({ success: true, message: 'Create blood request endpoint - Implementation pending' });
});

app.get('/requests', optionalAuth, validatePagination, (req, res) => {
  res.json({ success: true, message: 'Get blood requests endpoint - Implementation pending' });
});

app.get('/requests/emergency', optionalAuth, validatePagination, (req, res) => {
  res.json({ success: true, message: 'Emergency requests endpoint - Implementation pending' });
});

app.get('/requests/my-requests', protect, validatePagination, (req, res) => {
  res.json({ success: true, message: 'My requests endpoint - Implementation pending' });
});

app.get('/requests/nearby', protect, validatePagination, (req, res) => {
  res.json({ success: true, message: 'Nearby requests endpoint - Implementation pending' });
});

app.get('/requests/:id', optionalAuth, validateMongoId('id'), (req, res) => {
  res.json({ success: true, message: 'Get blood request by ID endpoint - Implementation pending' });
});

app.put('/requests/:id', protect, validateMongoId('id'), (req, res) => {
  res.json({ success: true, message: 'Update blood request endpoint - Implementation pending' });
});

app.delete('/requests/:id', protect, validateMongoId('id'), (req, res) => {
  res.json({ success: true, message: 'Delete blood request endpoint - Implementation pending' });
});

app.post('/requests/:id/respond', protect, validateMongoId('id'), (req, res) => {
  res.json({ success: true, message: 'Respond to blood request endpoint - Implementation pending' });
});

// 🔍 Donor Search & Matching Routes
app.get('/donors/search', optionalAuth, validateSearchQuery, validatePagination, (req, res) => {
  res.json({ success: true, message: 'Search donors endpoint - Implementation pending' });
});

app.get('/donors/compatible', protect, validatePagination, (req, res) => {
  res.json({ success: true, message: 'Compatible donors endpoint - Implementation pending' });
});

app.get('/donors/nearby', protect, validatePagination, (req, res) => {
  res.json({ success: true, message: 'Nearby donors endpoint - Implementation pending' });
});

app.get('/donors/favorites', protect, validatePagination, (req, res) => {
  res.json({ success: true, message: 'Favorite donors endpoint - Implementation pending' });
});

app.post('/donors/add-favorite', protect, (req, res) => {
  res.json({ success: true, message: 'Add favorite donor endpoint - Implementation pending' });
});

app.delete('/donors/remove-favorite', protect, (req, res) => {
  res.json({ success: true, message: 'Remove favorite donor endpoint - Implementation pending' });
});

app.get('/donors/:id', optionalAuth, validateMongoId('id'), (req, res) => {
  res.json({ success: true, message: 'Get donor profile endpoint - Implementation pending' });
});

app.post('/donors/contact', protect, (req, res) => {
  res.json({ success: true, message: 'Contact donor endpoint - Implementation pending' });
});

// 📊 Dashboard & Statistics Routes
app.get('/dashboard/stats', optionalAuth, (req, res) => {
  res.json({ success: true, message: 'Dashboard statistics endpoint - Implementation pending' });
});

app.get('/dashboard/recent-requests', optionalAuth, validatePagination, (req, res) => {
  res.json({ success: true, message: 'Recent requests endpoint - Implementation pending' });
});

app.get('/dashboard/emergency-banner', optionalAuth, (req, res) => {
  res.json({ success: true, message: 'Emergency banner endpoint - Implementation pending' });
});

app.get('/analytics/donation-trends', optionalAuth, (req, res) => {
  res.json({ success: true, message: 'Donation trends endpoint - Implementation pending' });
});

app.get('/analytics/regional-stats', optionalAuth, (req, res) => {
  res.json({ success: true, message: 'Regional statistics endpoint - Implementation pending' });
});

// 🩸 Donation History Routes
app.get('/donations/history', protect, validatePagination, (req, res) => {
  res.json({ success: true, message: 'Donation history endpoint - Implementation pending' });
});

app.post('/donations/record', protect, validateDonationRecord, (req, res) => {
  res.json({ success: true, message: 'Record donation endpoint - Implementation pending' });
});

app.get('/donations/summary', protect, (req, res) => {
  res.json({ success: true, message: 'Donation summary endpoint - Implementation pending' });
});

app.get('/donations/next-eligible', protect, (req, res) => {
  res.json({ success: true, message: 'Next eligible donation date endpoint - Implementation pending' });
});

app.post('/donations/export', protect, (req, res) => {
  res.json({ success: true, message: 'Export donation history endpoint - Implementation pending' });
});

app.put('/donations/:id/feedback', protect, validateMongoId('id'), (req, res) => {
  res.json({ success: true, message: 'Donation feedback endpoint - Implementation pending' });
});

// 🔔 Notifications Routes
app.get('/notifications', protect, validatePagination, (req, res) => {
  res.json({ success: true, message: 'Get notifications endpoint - Implementation pending' });
});

app.post('/notifications/mark-read', protect, (req, res) => {
  res.json({ success: true, message: 'Mark notification as read endpoint - Implementation pending' });
});

app.delete('/notifications/:id', protect, validateMongoId('id'), (req, res) => {
  res.json({ success: true, message: 'Delete notification endpoint - Implementation pending' });
});

app.post('/notifications/bulk-action', protect, (req, res) => {
  res.json({ success: true, message: 'Bulk notification action endpoint - Implementation pending' });
});

app.get('/notifications/unread-count', protect, (req, res) => {
  res.json({ success: true, message: 'Unread notification count endpoint - Implementation pending' });
});

app.post('/notifications/subscribe', protect, (req, res) => {
  res.json({ success: true, message: 'Subscribe push notification endpoint - Implementation pending' });
});

// 📍 Location & Geography Routes
app.get('/locations/districts', (req, res) => {
  // Static data for Bangladesh districts
  const districts = [
    'Dhaka', 'Chittagong', 'Rajshahi', 'Khulna', 'Barisal', 'Sylhet', 'Rangpur', 'Mymensingh',
    'Comilla', 'Feni', 'Brahmanbaria', 'Rangamati', 'Noakhali', 'Chandpur', 'Lakshmipur',
    'Cox\'s Bazar', 'Bandarban', 'Patuakhali', 'Pirojpur', 'Jhalokati', 'Barguna', 'Bhola'
  ];
  res.json({ success: true, message: 'Districts retrieved successfully', data: districts });
});

app.get('/locations/hospitals', validatePagination, (req, res) => {
  res.json({ success: true, message: 'Hospitals list endpoint - Implementation pending' });
});

app.get('/locations/nearby', protect, (req, res) => {
  res.json({ success: true, message: 'Nearby locations endpoint - Implementation pending' });
});

app.post('/locations/geocode', (req, res) => {
  res.json({ success: true, message: 'Geocode address endpoint - Implementation pending' });
});

// 💬 Communication Routes
app.post('/messages/send', protect, validateMessage, (req, res) => {
  res.json({ success: true, message: 'Send message endpoint - Implementation pending' });
});

app.get('/messages/conversations', protect, validatePagination, (req, res) => {
  res.json({ success: true, message: 'Get conversations endpoint - Implementation pending' });
});

app.get('/messages/:conversationId', protect, validatePagination, (req, res) => {
  res.json({ success: true, message: 'Get conversation messages endpoint - Implementation pending' });
});

app.post('/calls/initiate', protect, (req, res) => {
  res.json({ success: true, message: 'Initiate call log endpoint - Implementation pending' });
});

// 🏆 Achievements & Rewards Routes
app.get('/achievements', protect, validatePagination, (req, res) => {
  res.json({ success: true, message: 'Achievements system endpoint - Implementation pending' });
});

app.post('/achievements/unlock', protect, (req, res) => {
  res.json({ success: true, message: 'Unlock achievement endpoint - Implementation pending' });
});

app.get('/leaderboard', optionalAuth, validatePagination, (req, res) => {
  res.json({ success: true, message: 'Leaderboard endpoint - Implementation pending' });
});

// ⚙️ System & Configuration Routes
app.get('/config/app-settings', (req, res) => {
  const settings = {
    bloodTypes: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    urgencyLevels: ['low', 'medium', 'high', 'critical'],
    donationTypes: ['whole_blood', 'plasma', 'platelets', 'double_red_cells'],
    maxUnitsPerRequest: 10,
    minDonationAge: 18,
    maxDonationAge: 65,
    minWeight: 45
  };
  res.json({ success: true, message: 'App settings retrieved successfully', data: settings });
});

app.get('/config/blood-types', (req, res) => {
  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  res.json({ success: true, message: 'Blood types retrieved successfully', data: bloodTypes });
});

app.get('/config/urgency-levels', (req, res) => {
  const urgencyLevels = [
    { value: 'low', label: 'Low', color: '#28a745' },
    { value: 'medium', label: 'Medium', color: '#ffc107' },
    { value: 'high', label: 'High', color: '#fd7e14' },
    { value: 'critical', label: 'Critical', color: '#dc3545' }
  ];
  res.json({ success: true, message: 'Urgency levels retrieved successfully', data: urgencyLevels });
});

app.post('/feedback', (req, res) => {
  res.json({ success: true, message: 'Feedback endpoint - Implementation pending' });
});

app.get('/terms-and-conditions', (req, res) => {
  res.json({ success: true, message: 'Terms and conditions endpoint - Implementation pending' });
});

// 📱 Mobile Specific Routes
app.post('/device/register', protect, (req, res) => {
  res.json({ success: true, message: 'Device registration endpoint - Implementation pending' });
});

app.put('/device/update-location', protect, (req, res) => {
  res.json({ success: true, message: 'Update device location endpoint - Implementation pending' });
});

// 📊 Admin Panel Routes (Future)
app.get('/admin/users', protect, (req, res) => {
  res.json({ success: true, message: 'Admin users endpoint - Implementation pending' });
});

app.get('/admin/requests', protect, (req, res) => {
  res.json({ success: true, message: 'Admin requests endpoint - Implementation pending' });
});

app.put('/admin/users/:id/status', protect, validateMongoId('id'), (req, res) => {
  res.json({ success: true, message: 'Update user status endpoint - Implementation pending' });
});

app.get('/admin/analytics', protect, (req, res) => {
  res.json({ success: true, message: 'Admin analytics endpoint - Implementation pending' });
});

// Default route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to BloodCare API',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      auth: '/auth/*',
      users: '/user/*',
      requests: '/requests/*',
      donors: '/donors/*',
      dashboard: '/dashboard/*',
      donations: '/donations/*',
      notifications: '/notifications/*',
      locations: '/locations/*',
      messages: '/messages/*',
      achievements: '/achievements/*',
      config: '/config/*'
    }
  });
});

// Handle unhandled routes
app.all('*', handleNotFound);

// Global error handling middleware
app.use(globalErrorHandler);

const PORT = process.env.PORT || 3000;
console.log(`Starting server on port ${PORT}...`);
const server = app.listen(PORT, () => {
  console.log(`🚀 BloodCare API Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

// Handle server startup errors
server.on('error', (error) => {
  console.error('Server startup error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  }
});

// Handle unhandled promise rejections
handleUnhandledRejection(server);

// Handle SIGTERM
handleSIGTERM(server);

module.exports = app;
