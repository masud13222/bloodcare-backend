const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { promisify } = require('util');

// Protect routes - check for valid JWT token
const protect = async (req, res, next) => {
  try {
    let token;
    
    // Check if token exists in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }
    
    // Verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    
    // Check if user still exists
    const currentUser = await User.findById(decoded.id).select('+refreshTokens');
    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.'
      });
    }
    
    // Check if user account is active
    if (currentUser.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Your account has been suspended. Please contact support.'
      });
    }
    
    // Check if user is locked
    if (currentUser.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Account temporarily locked due to multiple failed login attempts.'
      });
    }
    
    // Grant access to protected route
    req.user = currentUser;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Authentication error.'
    });
  }
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      
      if (token) {
        const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
        const currentUser = await User.findById(decoded.id);
        
        if (currentUser && currentUser.status === 'active' && !currentUser.isLocked) {
          req.user = currentUser;
        }
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Restrict to certain roles
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action.'
      });
    }
    next();
  };
};

// Check if user is verified
const requireVerification = (req, res, next) => {
  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your account to access this feature.'
    });
  }
  next();
};

// Check if user is donor
const requireDonor = (req, res, next) => {
  if (!req.user.isDonor) {
    return res.status(403).json({
      success: false,
      message: 'This feature is only available for donors.'
    });
  }
  next();
};

// Check if user is available for donation
const requireAvailable = (req, res, next) => {
  if (!req.user.isAvailable) {
    return res.status(403).json({
      success: false,
      message: 'You are currently not available for donations.'
    });
  }
  next();
};

// Check if user can donate (eligible)
const requireEligible = (req, res, next) => {
  if (!req.user.isEligibleToDonate()) {
    const reasons = [];
    
    if (!req.user.isDonor) reasons.push('Not registered as donor');
    if (!req.user.isAvailable) reasons.push('Currently unavailable');
    if (req.user.age < 18) reasons.push('Under 18 years old');
    if (req.user.age > 65) reasons.push('Over 65 years old');
    if (req.user.weight < 45) reasons.push('Weight below 45kg');
    if (req.user.nextEligibleDate && req.user.nextEligibleDate > Date.now()) {
      reasons.push(`Next eligible date: ${req.user.nextEligibleDate.toDateString()}`);
    }
    
    return res.status(403).json({
      success: false,
      message: 'You are not eligible to donate blood.',
      reasons
    });
  }
  next();
};

// Rate limiting for authentication endpoints
const authRateLimit = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();
  
  return (req, res, next) => {
    const key = req.ip + (req.body.email || req.body.phone || '');
    const now = Date.now();
    
    if (!attempts.has(key)) {
      attempts.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    const attempt = attempts.get(key);
    
    if (now > attempt.resetTime) {
      attempts.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (attempt.count >= maxAttempts) {
      return res.status(429).json({
        success: false,
        message: 'Too many authentication attempts. Please try again later.',
        retryAfter: Math.ceil((attempt.resetTime - now) / 1000)
      });
    }
    
    attempt.count++;
    next();
  };
};

// Generate JWT tokens
const generateTokens = (userId) => {
  const payload = { id: userId };
  
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
  
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d'
  });
  
  return { accessToken, refreshToken };
};

// Verify refresh token
const verifyRefreshToken = async (refreshToken) => {
  try {
    const decoded = await promisify(jwt.verify)(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('+refreshTokens');
    
    if (!user || !user.refreshTokens.includes(refreshToken)) {
      throw new Error('Invalid refresh token');
    }
    
    return user;
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

// Refresh access token
const refreshAccessToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is required.'
      });
    }
    
    const user = await verifyRefreshToken(refreshToken);
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);
    
    // Replace old refresh token with new one
    user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
    user.refreshTokens.push(newRefreshToken);
    await user.save();
    
    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: process.env.JWT_EXPIRE || '7d'
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
};

// Logout and invalidate tokens
const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (refreshToken && req.user) {
      // Remove refresh token from user
      req.user.refreshTokens = req.user.refreshTokens.filter(token => token !== refreshToken);
      await req.user.save();
    }
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
};

// Logout from all devices
const logoutFromAllDevices = async (req, res, next) => {
  try {
    req.user.refreshTokens = [];
    await req.user.save();
    
    res.json({
      success: true,
      message: 'Logged out from all devices successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
};

module.exports = {
  protect,
  optionalAuth,
  restrictTo,
  requireVerification,
  requireDonor,
  requireAvailable,
  requireEligible,
  authRateLimit,
  generateTokens,
  verifyRefreshToken,
  refreshAccessToken,
  logout,
  logoutFromAllDevices
};