const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const { generateTokens } = require('../middleware/auth');
const { sendEmail } = require('../utils/email');
const { generateOTP } = require('../utils/otp');

// @desc    Register user
// @route   POST /auth/register
// @access  Public
const register = catchAsync(async (req, res, next) => {
  const {
    name,
    email,
    phone,
    password,
    dateOfBirth,
    gender,
    bloodGroup,
    location,
    isDonor = true,
    weight
  } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { phone }]
  });

  if (existingUser) {
    return next(new AppError('User already exists with this email or phone', 400));
  }

  // Create user
  const user = await User.create({
    name,
    email,
    phone,
    password,
    dateOfBirth,
    gender,
    bloodGroup,
    location,
    isDonor,
    weight
  });

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user._id);

  // Save refresh token
  user.refreshTokens.push(refreshToken);
  await user.save({ validateBeforeSave: false });

  // Remove password from output
  user.password = undefined;

  // Generate OTP for verification
  const otp = generateOTP();
  
  // Here you would typically send OTP via SMS or email
  // For now, we'll just log it (remove in production)
  console.log(`Verification OTP for ${phone}: ${otp}`);

  res.status(201).json({
    success: true,
    message: 'User registered successfully. Please verify your phone number.',
    data: {
      user,
      accessToken,
      refreshToken,
      expiresIn: process.env.JWT_EXPIRE || '7d'
    }
  });
});

// @desc    Login user
// @route   POST /auth/login
// @access  Public
const login = catchAsync(async (req, res, next) => {
  const { email, phone, password } = req.body;

  // Find user by email or phone
  const user = await User.findOne({
    $or: [{ email }, { phone }]
  }).select('+password +refreshTokens');

  // Check if user exists and password is correct
  if (!user || !(await user.comparePassword(password))) {
    if (user) {
      await user.incLoginAttempts();
    }
    return next(new AppError('Invalid credentials', 401));
  }

  // Check if account is locked
  if (user.isLocked) {
    return next(new AppError('Account temporarily locked due to multiple failed login attempts', 423));
  }

  // Check if account is active
  if (user.status !== 'active') {
    return next(new AppError('Account has been suspended. Please contact support.', 401));
  }

  // Reset login attempts on successful login
  if (user.loginAttempts) {
    await user.resetLoginAttempts();
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user._id);

  // Save refresh token
  user.refreshTokens.push(refreshToken);
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  // Remove sensitive data from output
  user.password = undefined;
  user.refreshTokens = undefined;

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user,
      accessToken,
      refreshToken,
      expiresIn: process.env.JWT_EXPIRE || '7d'
    }
  });
});

// @desc    Logout user
// @route   POST /auth/logout
// @access  Private
const logout = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    // Remove refresh token from user
    req.user.refreshTokens = req.user.refreshTokens.filter(token => token !== refreshToken);
    await req.user.save({ validateBeforeSave: false });
  }

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// @desc    Refresh access token
// @route   POST /auth/refresh-token
// @access  Public
const refreshToken = catchAsync(async (req, res, next) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    return next(new AppError('Refresh token is required', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('+refreshTokens');

    if (!user || !user.refreshTokens.includes(token)) {
      return next(new AppError('Invalid refresh token', 401));
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);

    // Replace old refresh token with new one
    user.refreshTokens = user.refreshTokens.filter(t => t !== token);
    user.refreshTokens.push(newRefreshToken);
    await user.save({ validateBeforeSave: false });

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
    return next(new AppError('Invalid refresh token', 401));
  }
});

// @desc    Forgot password
// @route   POST /auth/forgot-password
// @access  Public
const forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  // Find user by email
  const user = await User.findOne({ email });

  if (!user) {
    return next(new AppError('No user found with this email address', 404));
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  await user.save({ validateBeforeSave: false });

  // Create reset URL
  const resetURL = `${req.protocol}://${req.get('host')}/auth/reset-password/${resetToken}`;

  const message = `
    You are receiving this email because you (or someone else) has requested a password reset for your account.
    
    Please click on the following link to reset your password:
    ${resetURL}
    
    If you did not request this password reset, please ignore this email and your password will remain unchanged.
    
    This link will expire in 10 minutes.
  `;

  try {
    await sendEmail({
      to: user.email,
      subject: 'BloodCare - Password Reset Request',
      text: message
    });

    res.json({
      success: true,
      message: 'Password reset email sent successfully'
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError('There was an error sending the email. Try again later.', 500));
  }
});

// @desc    Reset password
// @route   POST /auth/reset-password
// @access  Public
const resetPassword = catchAsync(async (req, res, next) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return next(new AppError('Passwords do not match', 400));
  }

  // Get user based on token
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  // Set new password
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.refreshTokens = []; // Invalidate all refresh tokens

  await user.save();

  // Generate new tokens
  const { accessToken, refreshToken } = generateTokens(user._id);

  // Save new refresh token
  user.refreshTokens.push(refreshToken);
  await user.save({ validateBeforeSave: false });

  res.json({
    success: true,
    message: 'Password reset successful',
    data: {
      accessToken,
      refreshToken,
      expiresIn: process.env.JWT_EXPIRE || '7d'
    }
  });
});

// @desc    Verify OTP
// @route   POST /auth/verify-otp
// @access  Public
const verifyOTP = catchAsync(async (req, res, next) => {
  const { phone, otp, type = 'phone' } = req.body;

  // Here you would verify the OTP against your OTP service
  // For demo purposes, we'll accept any 6-digit number
  if (!otp || otp.length !== 6) {
    return next(new AppError('Invalid OTP format', 400));
  }

  const user = await User.findOne({ phone });

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Mark phone as verified
  if (type === 'phone') {
    user.phoneVerified = true;
  }

  // If both phone and email are verified, mark account as verified
  if (user.phoneVerified && user.emailVerified) {
    user.isVerified = true;
  }

  await user.save({ validateBeforeSave: false });

  res.json({
    success: true,
    message: 'OTP verified successfully',
    data: {
      phoneVerified: user.phoneVerified,
      emailVerified: user.emailVerified,
      isVerified: user.isVerified
    }
  });
});

// @desc    Resend OTP
// @route   POST /auth/resend-otp
// @access  Public
const resendOTP = catchAsync(async (req, res, next) => {
  const { phone, type = 'phone' } = req.body;

  const user = await User.findOne({ phone });

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Generate new OTP
  const otp = generateOTP();
  
  // Here you would send OTP via SMS or email
  console.log(`New OTP for ${phone}: ${otp}`);

  res.json({
    success: true,
    message: 'OTP sent successfully'
  });
});

// @desc    Change password
// @route   POST /auth/change-password
// @access  Private
const changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  if (!(await user.comparePassword(currentPassword))) {
    return next(new AppError('Current password is incorrect', 400));
  }

  // Update password
  user.password = newPassword;
  user.refreshTokens = []; // Invalidate all refresh tokens
  await user.save();

  // Generate new tokens
  const { accessToken, refreshToken } = generateTokens(user._id);

  // Save new refresh token
  user.refreshTokens.push(refreshToken);
  await user.save({ validateBeforeSave: false });

  res.json({
    success: true,
    message: 'Password changed successfully',
    data: {
      accessToken,
      refreshToken,
      expiresIn: process.env.JWT_EXPIRE || '7d'
    }
  });
});

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyOTP,
  resendOTP,
  changePassword
};