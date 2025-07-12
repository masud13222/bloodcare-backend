const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const compression = require('compression');
const { AppError } = require('./errorHandler');
const crypto = require('crypto');

// Rate limiting configurations
const createRateLimit = (windowMs, max, message, skipSuccessfulRequests = false) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
      error: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message,
        error: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.round(windowMs / 1000)
      });
    }
  });
};

// Different rate limits for different endpoints
const authRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts
  'Too many authentication attempts from this IP, please try again later.',
  false
);

const generalRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests
  'Too many requests from this IP, please try again later.',
  true
);

const uploadRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  10, // 10 uploads
  'Too many file uploads from this IP, please try again later.',
  false
);

const passwordResetRateLimit = createRateLimit(
  60 * 60 * 1000, // 1 hour
  3, // 3 attempts
  'Too many password reset attempts from this IP, please try again later.',
  false
);

// Advanced helmet configuration
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com', 'https://*.cloudinary.com'],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", 'https://api.cloudinary.com'],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Request signing middleware for API integrity
const requestSignature = (req, res, next) => {
  if (req.method === 'GET') return next();
  
  const signature = req.headers['x-api-signature'];
  const timestamp = req.headers['x-timestamp'];
  
  if (!signature || !timestamp) {
    return next(); // Skip for now, can be made mandatory later
  }
  
  const now = Date.now();
  const requestTime = parseInt(timestamp);
  
  // Check if request is not older than 5 minutes
  if (now - requestTime > 5 * 60 * 1000) {
    return next(new AppError('Request timestamp is too old', 400));
  }
  
  next();
};

// IP whitelist/blacklist middleware
const ipFilter = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  
  // Blacklisted IPs (can be stored in database)
  const blacklistedIPs = process.env.BLACKLISTED_IPS ? 
    process.env.BLACKLISTED_IPS.split(',') : [];
  
  if (blacklistedIPs.includes(clientIP)) {
    return next(new AppError('Access denied from this IP address', 403));
  }
  
  next();
};

// Request ID middleware for tracing
const requestId = (req, res, next) => {
  const reqId = crypto.randomBytes(16).toString('hex');
  req.requestId = reqId;
  res.setHeader('X-Request-ID', reqId);
  next();
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Remove sensitive headers
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');
  
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  next();
};

// Input validation middleware
const inputSanitization = [
  mongoSanitize(), // Prevent NoSQL injection
  xss(), // Prevent XSS attacks
  hpp({ // Prevent HTTP Parameter Pollution
    whitelist: ['bloodGroup', 'district', 'urgency', 'page', 'limit']
  })
];

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.CORS_ORIGIN ? 
      process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000'];
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With', 
    'Content-Type', 
    'Accept', 
    'Authorization',
    'X-API-Signature',
    'X-Timestamp'
  ],
  maxAge: 86400 // 24 hours
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    };
    
    if (res.statusCode >= 400) {
      console.error('Request Error:', logData);
    } else {
      console.log('Request:', logData);
    }
  });
  
  next();
};

// API versioning middleware
const apiVersioning = (req, res, next) => {
  const version = req.headers['api-version'] || req.query.version || 'v1';
  req.apiVersion = version;
  res.setHeader('API-Version', version);
  next();
};

// Content compression
const compressionConfig = compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
});

// Request size limiting
const requestSizeLimit = (req, res, next) => {
  const contentLength = parseInt(req.headers['content-length']);
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (contentLength > maxSize) {
    return next(new AppError('Request payload too large', 413));
  }
  
  next();
};

// Device fingerprinting (for suspicious activity detection)
const deviceFingerprint = (req, res, next) => {
  const fingerprint = {
    userAgent: req.get('User-Agent'),
    acceptLanguage: req.get('Accept-Language'),
    acceptEncoding: req.get('Accept-Encoding'),
    ip: req.ip
  };
  
  req.deviceFingerprint = crypto
    .createHash('sha256')
    .update(JSON.stringify(fingerprint))
    .digest('hex');
  
  next();
};

// Maintenance mode middleware
const maintenanceMode = (req, res, next) => {
  if (process.env.MAINTENANCE_MODE === 'true') {
    // Allow health check during maintenance
    if (req.path === '/health') return next();
    
    return res.status(503).json({
      success: false,
      message: 'API is under maintenance. Please try again later.',
      error: 'MAINTENANCE_MODE'
    });
  }
  next();
};

module.exports = {
  // Rate limits
  authRateLimit,
  generalRateLimit,
  uploadRateLimit,
  passwordResetRateLimit,
  
  // Security middleware
  helmetConfig,
  requestSignature,
  ipFilter,
  requestId,
  securityHeaders,
  inputSanitization,
  corsOptions,
  requestLogger,
  apiVersioning,
  compressionConfig,
  requestSizeLimit,
  deviceFingerprint,
  maintenanceMode
};