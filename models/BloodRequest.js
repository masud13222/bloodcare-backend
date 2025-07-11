const mongoose = require('mongoose');

const bloodRequestSchema = new mongoose.Schema({
  // Request Details
  title: {
    type: String,
    required: [true, 'Request title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  // Patient Information
  patientName: {
    type: String,
    required: [true, 'Patient name is required'],
    trim: true
  },
  patientAge: {
    type: Number,
    required: [true, 'Patient age is required'],
    min: [0, 'Age cannot be negative'],
    max: [150, 'Age cannot exceed 150']
  },
  patientGender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: [true, 'Patient gender is required']
  },
  
  // Blood Requirements
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: [true, 'Blood group is required']
  },
  unitsNeeded: {
    type: Number,
    required: [true, 'Units needed is required'],
    min: [1, 'At least 1 unit is required'],
    max: [10, 'Cannot request more than 10 units']
  },
  unitsFulfilled: {
    type: Number,
    default: 0
  },
  
  // Medical Information
  urgencyLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: [true, 'Urgency level is required'],
    default: 'medium'
  },
  medicalCondition: String,
  hospitalName: {
    type: String,
    required: [true, 'Hospital name is required']
  },
  doctorName: String,
  
  // Location Information
  location: {
    district: {
      type: String,
      required: [true, 'District is required']
    },
    upazila: String,
    address: {
      type: String,
      required: [true, 'Hospital address is required']
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // Request Information
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Requester is required']
  },
  contactPerson: {
    name: {
      type: String,
      required: [true, 'Contact person name is required']
    },
    phone: {
      type: String,
      required: [true, 'Contact phone is required'],
      match: [/^(\+88)?01[3-9]\d{8}$/, 'Please enter a valid phone number']
    },
    relationship: {
      type: String,
      enum: ['self', 'family', 'friend', 'doctor', 'other'],
      default: 'self'
    }
  },
  
  // Timing
  neededBy: {
    type: Date,
    required: [true, 'Needed by date is required'],
    validate: {
      validator: function(value) {
        return value > Date.now();
      },
      message: 'Needed by date must be in the future'
    }
  },
  
  // Status and Tracking
  status: {
    type: String,
    enum: ['active', 'partial', 'fulfilled', 'cancelled', 'expired'],
    default: 'active'
  },
  isEmergency: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Responses and Donations
  responses: [{
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: String,
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'completed'],
      default: 'pending'
    },
    responseDate: {
      type: Date,
      default: Date.now
    },
    donationDate: Date,
    unitsPromised: {
      type: Number,
      min: 1,
      default: 1
    }
  }],
  
  // Additional Information
  attachments: [{
    type: String, // URLs to medical documents
    description: String
  }],
  
  // Analytics
  viewCount: {
    type: Number,
    default: 0
  },
  shareCount: {
    type: Number,
    default: 0
  },
  
  // Administrative
  adminNotes: String,
  flaggedReason: String,
  isFlagged: {
    type: Boolean,
    default: false
  },
  
  // Expiration
  expiresAt: {
    type: Date,
    index: { expireAfterSeconds: 0 }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for checking if request is urgent
bloodRequestSchema.virtual('isUrgent').get(function() {
  const hoursLeft = (this.neededBy - Date.now()) / (1000 * 60 * 60);
  return hoursLeft <= 24 || this.urgencyLevel === 'critical';
});

// Virtual for completion percentage
bloodRequestSchema.virtual('completionPercentage').get(function() {
  return Math.round((this.unitsFulfilled / this.unitsNeeded) * 100);
});

// Virtual for time remaining
bloodRequestSchema.virtual('timeRemaining').get(function() {
  const diff = this.neededBy - Date.now();
  if (diff <= 0) return 'Expired';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) return `${days} days ${hours} hours`;
  return `${hours} hours`;
});

// Pre-save middleware to set expiration
bloodRequestSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('neededBy')) {
    // Expire 24 hours after needed by date
    this.expiresAt = new Date(this.neededBy.getTime() + 24 * 60 * 60 * 1000);
  }
  next();
});

// Pre-save middleware to update status based on fulfillment
bloodRequestSchema.pre('save', function(next) {
  if (this.unitsFulfilled >= this.unitsNeeded) {
    this.status = 'fulfilled';
  } else if (this.unitsFulfilled > 0) {
    this.status = 'partial';
  }
  next();
});

// Method to add response
bloodRequestSchema.methods.addResponse = function(donorId, message, unitsPromised = 1) {
  this.responses.push({
    donor: donorId,
    message,
    unitsPromised,
    status: 'pending'
  });
  return this.save();
};

// Method to accept/reject response
bloodRequestSchema.methods.updateResponseStatus = function(responseId, status, donationDate = null) {
  const response = this.responses.id(responseId);
  if (!response) throw new Error('Response not found');
  
  response.status = status;
  if (donationDate) response.donationDate = donationDate;
  
  if (status === 'completed') {
    this.unitsFulfilled += response.unitsPromised;
  }
  
  return this.save();
};

// Method to check if user can respond
bloodRequestSchema.methods.canUserRespond = function(userId) {
  if (this.status !== 'active' && this.status !== 'partial') return false;
  if (this.requestedBy.toString() === userId.toString()) return false;
  
  const existingResponse = this.responses.find(r => 
    r.donor.toString() === userId.toString() && 
    (r.status === 'pending' || r.status === 'accepted')
  );
  
  return !existingResponse;
};

// Static method to find compatible requests for a donor
bloodRequestSchema.statics.findCompatibleRequests = function(donorBloodGroup, location, limit = 10) {
  const compatibilityMap = {
    'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    'O+': ['O+', 'A+', 'B+', 'AB+'],
    'A-': ['A-', 'A+', 'AB-', 'AB+'],
    'A+': ['A+', 'AB+'],
    'B-': ['B-', 'B+', 'AB-', 'AB+'],
    'B+': ['B+', 'AB+'],
    'AB-': ['AB-', 'AB+'],
    'AB+': ['AB+']
  };

  const compatibleGroups = compatibilityMap[donorBloodGroup] || [];
  
  return this.find({
    bloodGroup: { $in: compatibleGroups },
    status: { $in: ['active', 'partial'] },
    neededBy: { $gt: Date.now() },
    'location.district': location.district
  })
  .populate('requestedBy', 'name phone')
  .sort({ isEmergency: -1, urgencyLevel: -1, createdAt: -1 })
  .limit(limit);
};

// Create indexes
bloodRequestSchema.index({ bloodGroup: 1, status: 1, neededBy: 1 });
bloodRequestSchema.index({ 'location.district': 1, bloodGroup: 1 });
bloodRequestSchema.index({ urgencyLevel: 1, isEmergency: 1 });
bloodRequestSchema.index({ requestedBy: 1 });
bloodRequestSchema.index({ status: 1, createdAt: -1 });
bloodRequestSchema.index({ 'location.coordinates.latitude': 1, 'location.coordinates.longitude': 1 });

module.exports = mongoose.model('BloodRequest', bloodRequestSchema);