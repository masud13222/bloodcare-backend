const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages
    });
  }
  
  next();
};

// User registration validation
const validateUserRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s\u0980-\u09FF]+$/)
    .withMessage('Name can only contain letters and spaces'),
    
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
    
  body('phone')
    .matches(/^(\+88)?01[3-9]\d{8}$/)
    .withMessage('Please provide a valid Bangladeshi phone number'),
    
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    }),
    
  body('dateOfBirth')
    .isISO8601()
    .toDate()
    .custom((value) => {
      const age = Math.floor((Date.now() - value.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      if (age < 16 || age > 70) {
        throw new Error('Age must be between 16 and 70 years');
      }
      return true;
    }),
    
  body('gender')
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),
    
  body('bloodGroup')
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .withMessage('Please select a valid blood group'),
    
  body('location.district')
    .trim()
    .notEmpty()
    .withMessage('District is required'),
    
  body('weight')
    .optional()
    .isFloat({ min: 30, max: 200 })
    .withMessage('Weight must be between 30 and 200 kg'),
    
  handleValidationErrors
];

// User login validation
const validateUserLogin = [
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
    
  body('phone')
    .optional()
    .matches(/^(\+88)?01[3-9]\d{8}$/)
    .withMessage('Please provide a valid phone number'),
    
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
    
  // Either email or phone must be provided
  body().custom((value, { req }) => {
    if (!req.body.email && !req.body.phone) {
      throw new Error('Either email or phone number is required');
    }
    return true;
  }),
  
  handleValidationErrors
];

// Blood request validation
const validateBloodRequest = [
  body('title')
    .trim()
    .isLength({ min: 10, max: 200 })
    .withMessage('Title must be between 10 and 200 characters'),
    
  body('patientName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Patient name must be between 2 and 100 characters'),
    
  body('patientAge')
    .isInt({ min: 0, max: 150 })
    .withMessage('Patient age must be between 0 and 150'),
    
  body('patientGender')
    .isIn(['male', 'female', 'other'])
    .withMessage('Patient gender must be male, female, or other'),
    
  body('bloodGroup')
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .withMessage('Please select a valid blood group'),
    
  body('unitsNeeded')
    .isInt({ min: 1, max: 10 })
    .withMessage('Units needed must be between 1 and 10'),
    
  body('urgencyLevel')
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Urgency level must be low, medium, high, or critical'),
    
  body('hospitalName')
    .trim()
    .notEmpty()
    .withMessage('Hospital name is required'),
    
  body('location.district')
    .trim()
    .notEmpty()
    .withMessage('District is required'),
    
  body('location.address')
    .trim()
    .notEmpty()
    .withMessage('Hospital address is required'),
    
  body('contactPerson.name')
    .trim()
    .notEmpty()
    .withMessage('Contact person name is required'),
    
  body('contactPerson.phone')
    .matches(/^(\+88)?01[3-9]\d{8}$/)
    .withMessage('Please provide a valid contact phone number'),
    
  body('neededBy')
    .isISO8601()
    .toDate()
    .custom((value) => {
      if (value <= Date.now()) {
        throw new Error('Needed by date must be in the future');
      }
      return true;
    }),
    
  handleValidationErrors
];

// Donation record validation
const validateDonationRecord = [
  body('bloodGroup')
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .withMessage('Please select a valid blood group'),
    
  body('unitsdonated')
    .isInt({ min: 1, max: 4 })
    .withMessage('Units donated must be between 1 and 4'),
    
  body('donationType')
    .isIn(['whole_blood', 'plasma', 'platelets', 'double_red_cells'])
    .withMessage('Invalid donation type'),
    
  body('hospital.name')
    .trim()
    .notEmpty()
    .withMessage('Hospital name is required'),
    
  body('donationDate')
    .optional()
    .isISO8601()
    .toDate(),
    
  handleValidationErrors
];

// Message validation
const validateMessage = [
  body('message')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters'),
    
  body('recipient')
    .isMongoId()
    .withMessage('Invalid recipient ID'),
    
  body('messageType')
    .optional()
    .isIn(['text', 'image', 'document', 'location', 'contact', 'blood_request'])
    .withMessage('Invalid message type'),
    
  handleValidationErrors
];

// Notification validation
const validateNotification = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title must be between 1 and 100 characters'),
    
  body('message')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Message must be between 1 and 500 characters'),
    
  body('type')
    .isIn([
      'blood_request', 'donation_reminder', 'request_response', 'emergency_alert',
      'achievement_unlock', 'system_update', 'account_update', 'donation_confirmation'
    ])
    .withMessage('Invalid notification type'),
    
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid priority level'),
    
  handleValidationErrors
];

// Profile update validation
const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
    
  body('phone')
    .optional()
    .matches(/^(\+88)?01[3-9]\d{8}$/)
    .withMessage('Please provide a valid phone number'),
    
  body('weight')
    .optional()
    .isFloat({ min: 30, max: 200 })
    .withMessage('Weight must be between 30 and 200 kg'),
    
  body('location.district')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('District cannot be empty'),
    
  handleValidationErrors
];

// Password change validation
const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
    
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
    
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    }),
    
  handleValidationErrors
];

// ID parameter validation
const validateMongoId = (paramName = 'id') => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName}`),
    
  handleValidationErrors
];

// Query parameter validation for pagination
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
    
  handleValidationErrors
];

// Search query validation
const validateSearchQuery = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2 and 100 characters'),
    
  query('bloodGroup')
    .optional()
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .withMessage('Invalid blood group'),
    
  query('district')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('District cannot be empty'),
    
  handleValidationErrors
];

// Coordinates validation
const validateCoordinates = [
  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
    
  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
    
  handleValidationErrors
];

// File upload validation
const validateFileUpload = (req, res, next) => {
  if (!req.file && !req.files) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }
  
  const file = req.file || req.files[0];
  const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024; // 5MB
  
  if (file.size > maxSize) {
    return res.status(400).json({
      success: false,
      message: `File size cannot exceed ${maxSize / (1024 * 1024)}MB`
    });
  }
  
  // Check file type for images
  if (req.route.path.includes('avatar') || req.route.path.includes('image')) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Only JPEG, JPG, PNG, and WebP images are allowed'
      });
    }
  }
  
  next();
};

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateBloodRequest,
  validateDonationRecord,
  validateMessage,
  validateNotification,
  validateProfileUpdate,
  validatePasswordChange,
  validateMongoId,
  validatePagination,
  validateSearchQuery,
  validateCoordinates,
  validateFileUpload
};