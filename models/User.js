const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    match: [/^(\+88)?01[3-9]\d{8}$/, 'Please enter a valid Bangladeshi phone number']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  
  // Profile Information
  avatar: {
    public_id: String,
    url: String
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: [true, 'Gender is required']
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: [true, 'Blood group is required']
  },
  
  // Location Information
  location: {
    district: {
      type: String,
      required: [true, 'District is required']
    },
    upazila: String,
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // Donation Status
  isDonor: {
    type: Boolean,
    default: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  lastDonationDate: Date,
  nextEligibleDate: Date,
  totalDonations: {
    type: Number,
    default: 0
  },
  
  // Health Information
  weight: {
    type: Number,
    min: [45, 'Weight must be at least 45 kg'],
    max: [200, 'Weight cannot exceed 200 kg']
  },
  medicalConditions: [String],
  medications: [String],
  
  // Account Settings
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  phoneVerified: {
    type: Boolean,
    default: false
  },
  
  // Notification Settings
  notificationSettings: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    smsNotifications: {
      type: Boolean,
      default: true
    },
    pushNotifications: {
      type: Boolean,
      default: true
    },
    emergencyAlerts: {
      type: Boolean,
      default: true
    }
  },
  
  // Privacy Settings
  privacySettings: {
    showPhone: {
      type: Boolean,
      default: true
    },
    showEmail: {
      type: Boolean,
      default: false
    },
    showLastDonation: {
      type: Boolean,
      default: true
    }
  },
  
  // Statistics
  lifeSaved: {
    type: Number,
    default: 0
  },
  requestsFulfilled: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 5,
    min: 1,
    max: 5
  },
  
  // Device Information
  deviceTokens: [String],
  lastActiveLocation: {
    latitude: Number,
    longitude: Number,
    updatedAt: Date
  },
  
  // Security
  refreshTokens: [String],
  passwordResetToken: String,
  passwordResetExpires: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  
  // Timestamps
  lastLogin: Date,
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'banned'],
    default: 'active'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for age calculation
userSchema.virtual('age').get(function() {
  return Math.floor((Date.now() - this.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
});

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Pre-save middleware to calculate next eligible donation date
userSchema.pre('save', function(next) {
  if (this.lastDonationDate) {
    const nextDate = new Date(this.lastDonationDate);
    nextDate.setDate(nextDate.getDate() + 120); // 4 months gap
    this.nextEligibleDate = nextDate;
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Increment login attempts
userSchema.methods.incLoginAttempts = function() {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1, loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = {
      lockUntil: Date.now() + 2 * 60 * 60 * 1000 // Lock for 2 hours
    };
  }
  
  return this.updateOne(updates);
};

// Reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Check if user is eligible to donate
userSchema.methods.isEligibleToDonate = function() {
  if (!this.isDonor || !this.isAvailable) return false;
  if (this.age < 18 || this.age > 65) return false;
  if (this.weight < 45) return false;
  if (this.nextEligibleDate && this.nextEligibleDate > Date.now()) return false;
  return true;
};

// Create indexes
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ bloodGroup: 1, isAvailable: 1, isDonor: 1 });
userSchema.index({ 'location.district': 1, bloodGroup: 1 });
userSchema.index({ 'location.coordinates.latitude': 1, 'location.coordinates.longitude': 1 });

module.exports = mongoose.model('User', userSchema);