const crypto = require('crypto');

// Generate OTP
const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  
  return otp;
};

// Generate secure OTP using crypto
const generateSecureOTP = (length = 6) => {
  const buffer = crypto.randomBytes(length);
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    otp += (buffer[i] % 10).toString();
  }
  
  return otp;
};

// Validate OTP format
const validateOTPFormat = (otp, length = 6) => {
  if (!otp) return false;
  if (typeof otp !== 'string') return false;
  if (otp.length !== length) return false;
  if (!/^\d+$/.test(otp)) return false;
  
  return true;
};

// In-memory OTP storage (in production, use Redis or database)
const otpStorage = new Map();

// Store OTP with expiration
const storeOTP = (identifier, otp, expirationMinutes = 10) => {
  const expirationTime = Date.now() + (expirationMinutes * 60 * 1000);
  
  otpStorage.set(identifier, {
    otp,
    expirationTime,
    attempts: 0,
    maxAttempts: 3
  });
  
  // Clean up expired OTPs periodically
  setTimeout(() => {
    if (otpStorage.has(identifier)) {
      const stored = otpStorage.get(identifier);
      if (stored.expirationTime < Date.now()) {
        otpStorage.delete(identifier);
      }
    }
  }, expirationMinutes * 60 * 1000 + 1000);
};

// Verify OTP
const verifyOTP = (identifier, providedOTP) => {
  const stored = otpStorage.get(identifier);
  
  if (!stored) {
    return { success: false, message: 'OTP not found or expired' };
  }
  
  // Check expiration
  if (stored.expirationTime < Date.now()) {
    otpStorage.delete(identifier);
    return { success: false, message: 'OTP has expired' };
  }
  
  // Check attempts
  if (stored.attempts >= stored.maxAttempts) {
    otpStorage.delete(identifier);
    return { success: false, message: 'Maximum verification attempts exceeded' };
  }
  
  // Increment attempts
  stored.attempts++;
  
  // Verify OTP
  if (stored.otp === providedOTP) {
    otpStorage.delete(identifier);
    return { success: true, message: 'OTP verified successfully' };
  }
  
  return { 
    success: false, 
    message: 'Invalid OTP',
    attemptsLeft: stored.maxAttempts - stored.attempts
  };
};

// Generate and store OTP
const generateAndStoreOTP = (identifier, length = 6, expirationMinutes = 10) => {
  const otp = generateSecureOTP(length);
  storeOTP(identifier, otp, expirationMinutes);
  return otp;
};

// Get remaining time for OTP
const getOTPRemainingTime = (identifier) => {
  const stored = otpStorage.get(identifier);
  
  if (!stored) {
    return 0;
  }
  
  const remainingTime = stored.expirationTime - Date.now();
  return Math.max(0, Math.ceil(remainingTime / 1000)); // Return in seconds
};

// Clear OTP
const clearOTP = (identifier) => {
  return otpStorage.delete(identifier);
};

// Check if OTP exists
const hasOTP = (identifier) => {
  const stored = otpStorage.get(identifier);
  return stored && stored.expirationTime > Date.now();
};

// Get OTP attempts count
const getOTPAttempts = (identifier) => {
  const stored = otpStorage.get(identifier);
  return stored ? stored.attempts : 0;
};

module.exports = {
  generateOTP,
  generateSecureOTP,
  validateOTPFormat,
  storeOTP,
  verifyOTP,
  generateAndStoreOTP,
  getOTPRemainingTime,
  clearOTP,
  hasOTP,
  getOTPAttempts
};