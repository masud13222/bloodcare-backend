const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  // Donor Information
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Donor is required']
  },
  
  // Recipient Information
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  bloodRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BloodRequest'
  },
  
  // Donation Details
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: [true, 'Blood group is required']
  },
  unitsdonated: {
    type: Number,
    required: [true, 'Units donated is required'],
    min: [1, 'At least 1 unit must be donated'],
    max: [4, 'Cannot donate more than 4 units at once']
  },
  
  // Donation Event Details
  donationDate: {
    type: Date,
    required: [true, 'Donation date is required'],
    default: Date.now
  },
  donationType: {
    type: String,
    enum: ['whole_blood', 'plasma', 'platelets', 'double_red_cells'],
    default: 'whole_blood',
    required: true
  },
  
  // Location Information
  hospital: {
    name: {
      type: String,
      required: [true, 'Hospital name is required']
    },
    address: String,
    district: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // Medical Information
  predonationVitals: {
    weight: Number,
    bloodPressure: {
      systolic: Number,
      diastolic: Number
    },
    hemoglobinLevel: Number,
    temperature: Number,
    pulse: Number
  },
  
  postDonationVitals: {
    bloodPressure: {
      systolic: Number,
      diastolic: Number
    },
    pulse: Number,
    condition: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'needs_monitoring'],
      default: 'good'
    }
  },
  
  // Medical Staff Information
  medicalStaff: {
    doctorName: String,
    nurseName: String,
    staffId: String
  },
  
  // Donation Status
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'rejected'],
    default: 'completed'
  },
  
  // Verification and Documentation
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationDocuments: [{
    type: String, // URLs to verification documents
    description: String
  }],
  donationCertificate: {
    certificateId: String,
    issuedDate: Date,
    url: String
  },
  
  // Health and Safety
  adverseReactions: {
    occurred: {
      type: Boolean,
      default: false
    },
    description: String,
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe']
    },
    treatmentGiven: String
  },
  
  // Follow-up Information
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: Date,
  followUpNotes: String,
  
  // Next Donation Eligibility
  nextEligibleDate: {
    type: Date,
    required: true
  },
  
  // Feedback and Rating
  donorFeedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    hospitalService: {
      type: Number,
      min: 1,
      max: 5
    },
    staffBehavior: {
      type: Number,
      min: 1,
      max: 5
    },
    overallExperience: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  
  recipientFeedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    thankYouMessage: String
  },
  
  // Administrative
  donationId: {
    type: String,
    unique: true,
    required: true
  },
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign'
  },
  
  // Tracking and Analytics
  bloodBagId: String,
  testResults: {
    hbLevel: Number,
    bloodType: String,
    infections: [{
      test: String,
      result: {
        type: String,
        enum: ['negative', 'positive', 'inconclusive']
      }
    }],
    testDate: Date,
    testedBy: String
  },
  
  // Lifecycle Management
  bloodUsage: {
    usedFor: String,
    patientBenefit: String,
    hospitalUsed: String,
    usageDate: Date
  },
  
  // Rewards and Recognition
  pointsEarned: {
    type: Number,
    default: 0
  },
  badgesEarned: [String],
  
  // Emergency/Special Cases
  isEmergencyDonation: {
    type: Boolean,
    default: false
  },
  specialNotes: String,
  
  // Data Privacy
  consentGiven: {
    dataSharing: {
      type: Boolean,
      default: true
    },
    researchParticipation: {
      type: Boolean,
      default: false
    },
    marketingCommunication: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for time since donation
donationSchema.virtual('timeSinceDonation').get(function() {
  const diff = Date.now() - this.donationDate.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
});

// Virtual for calculating days until next eligible donation
donationSchema.virtual('daysUntilNextEligible').get(function() {
  const diff = this.nextEligibleDate.getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
});

// Pre-save middleware to calculate next eligible date
donationSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('donationDate')) {
    const nextDate = new Date(this.donationDate);
    
    // Different intervals based on donation type
    switch (this.donationType) {
      case 'whole_blood':
        nextDate.setDate(nextDate.getDate() + 120); // 4 months
        break;
      case 'plasma':
        nextDate.setDate(nextDate.getDate() + 28); // 4 weeks
        break;
      case 'platelets':
        nextDate.setDate(nextDate.getDate() + 7); // 1 week
        break;
      case 'double_red_cells':
        nextDate.setDate(nextDate.getDate() + 168); // 24 weeks
        break;
      default:
        nextDate.setDate(nextDate.getDate() + 120);
    }
    
    this.nextEligibleDate = nextDate;
  }
  next();
});

// Pre-save middleware to generate donation ID
donationSchema.pre('save', function(next) {
  if (this.isNew && !this.donationId) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.donationId = `BCR-${timestamp}-${random}`.toUpperCase();
  }
  next();
});

// Method to calculate points earned
donationSchema.methods.calculatePoints = function() {
  let points = 0;
  
  // Base points for donation
  points += this.unitsdonated * 10;
  
  // Bonus for emergency donations
  if (this.isEmergencyDonation) points += 20;
  
  // Bonus for feedback
  if (this.donorFeedback && this.donorFeedback.rating) points += 5;
  
  // Bonus for verification documents
  if (this.verificationDocuments && this.verificationDocuments.length > 0) points += 5;
  
  this.pointsEarned = points;
  return points;
};

// Static method to get donation statistics
donationSchema.statics.getDonationStats = function(userId, timeframe = 'all') {
  const match = { donor: mongoose.Types.ObjectId(userId), status: 'completed' };
  
  if (timeframe !== 'all') {
    const date = new Date();
    switch (timeframe) {
      case 'thisYear':
        date.setFullYear(date.getFullYear(), 0, 1);
        break;
      case 'thisMonth':
        date.setDate(1);
        break;
      case 'last30Days':
        date.setDate(date.getDate() - 30);
        break;
    }
    match.donationDate = { $gte: date };
  }
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalDonations: { $sum: 1 },
        totalUnits: { $sum: '$unitsdonated' },
        totalPoints: { $sum: '$pointsEarned' },
        avgRating: { $avg: '$donorFeedback.rating' },
        emergencyDonations: {
          $sum: { $cond: ['$isEmergencyDonation', 1, 0] }
        }
      }
    }
  ]);
};

// Create indexes
donationSchema.index({ donor: 1, donationDate: -1 });
donationSchema.index({ bloodRequest: 1 });
donationSchema.index({ donationId: 1 });
donationSchema.index({ bloodGroup: 1, donationDate: -1 });
donationSchema.index({ status: 1 });
donationSchema.index({ isEmergencyDonation: 1 });
donationSchema.index({ nextEligibleDate: 1 });

module.exports = mongoose.model('Donation', donationSchema);