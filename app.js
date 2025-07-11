require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');

// Import database connection
const connectDB = require('./config/database');

// Import middleware
const {
  globalErrorHandler,
  handleNotFound,
  handleUncaughtException,
  handleUnhandledRejection,
  handleSIGTERM,
  requestLogger,
  rateLimitHandler,
  maintenanceMode
} = require('./middleware/errorHandler');

const { protect, optionalAuth, authRateLimit } = require('./middleware/auth');
const {
  validateUserRegistration,
  validateUserLogin,
  validateBloodRequest,
  validateDonationRecord,
  validateMessage,
  validateProfileUpdate,
  validatePasswordChange,
  validateMongoId,
  validatePagination,
  validateSearchQuery
} = require('./middleware/validation');

// Import controllers
const authController = require('./controllers/authController');

// Import models (to ensure they're registered)
require('./models/User');
require('./models/BloodRequest');
require('./models/Donation');
require('./models/Notification');
require('./models/Message');
require('./models/Achievement');

// Handle uncaught exceptions
handleUncaughtException();

// Connect to database
connectDB();

const app = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Create logs directory
const fs = require('fs');
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token']
}));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use(requestLogger);

// Maintenance mode
app.use(maintenanceMode);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Strict rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: rateLimitHandler,
  skipSuccessfulRequests: true,
});

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
app.post('/auth/register', authLimiter, validateUserRegistration, authController.register);
app.post('/auth/login', authLimiter, validateUserLogin, authController.login);
app.post('/auth/logout', protect, authController.logout);
app.post('/auth/refresh-token', authController.refreshToken);
app.post('/auth/forgot-password', authLimiter, authController.forgotPassword);
app.post('/auth/reset-password/:token', validatePasswordChange, authController.resetPassword);
app.post('/auth/verify-otp', authController.verifyOTP);
app.post('/auth/change-password', protect, validatePasswordChange, authController.changePassword);

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

app.post('/user/upload-avatar', protect, (req, res) => {
  res.json({ success: true, message: 'Avatar upload endpoint - Implementation pending' });
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
const server = app.listen(PORT, () => {
  console.log(`🚀 BloodCare API Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

// Handle unhandled promise rejections
handleUnhandledRejection(server);

// Handle SIGTERM
handleSIGTERM(server);

module.exports = app;
