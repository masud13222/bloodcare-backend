const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  // Achievement Basic Information
  name: {
    type: String,
    required: [true, 'Achievement name is required'],
    unique: true,
    trim: true
  },
  nameLocalized: {
    en: String,
    bn: String
  },
  description: {
    type: String,
    required: [true, 'Achievement description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  descriptionLocalized: {
    en: String,
    bn: String
  },
  
  // Achievement Category
  category: {
    type: String,
    enum: ['donation', 'social', 'milestone', 'special', 'community', 'consecutive'],
    required: [true, 'Achievement category is required']
  },
  
  // Achievement Criteria
  criteria: {
    type: {
      type: String,
      enum: ['donation_count', 'life_saved', 'consecutive_donations', 'blood_units', 'emergency_donations', 'referrals', 'rating', 'special_event'],
      required: true
    },
    value: {
      type: Number,
      required: true,
      min: 1
    },
    timeframe: {
      type: String,
      enum: ['all_time', 'yearly', 'monthly', 'weekly'],
      default: 'all_time'
    }
  },
  
  // Visual Information
  icon: {
    type: String,
    required: [true, 'Achievement icon is required']
  },
  badge: {
    url: String,
    color: {
      type: String,
      default: '#FFD700'
    },
    borderColor: String
  },
  
  // Reward Information
  points: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Difficulty and Rarity
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'legendary'],
    default: 'easy'
  },
  rarity: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isSecret: {
    type: Boolean,
    default: false
  },
  
  // Order and Grouping
  order: {
    type: Number,
    default: 0
  },
  group: String,
  
  // Prerequisites
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Achievement'
  }],
  
  // Special Conditions
  specialConditions: {
    bloodGroups: [String],
    locations: [String],
    emergencyOnly: {
      type: Boolean,
      default: false
    },
    firstTimeOnly: {
      type: Boolean,
      default: false
    }
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Statistics
  totalUnlocked: {
    type: Number,
    default: 0
  },
  unlockRate: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// User Achievement Schema (for tracking user's achievements)
const userAchievementSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  achievement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Achievement',
    required: true
  },
  unlockedAt: {
    type: Date,
    default: Date.now
  },
  progress: {
    current: {
      type: Number,
      default: 0
    },
    required: {
      type: Number,
      required: true
    },
    percentage: {
      type: Number,
      default: 0
    }
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: Date,
  pointsEarned: {
    type: Number,
    default: 0
  },
  
  // Tracking
  firstProgressAt: Date,
  lastProgressAt: Date,
  
  // Sharing
  isShared: {
    type: Boolean,
    default: false
  },
  sharedAt: Date,
  
  // Metadata
  unlockedBy: {
    donationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donation'
    },
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BloodRequest'
    },
    action: String
  }
}, {
  timestamps: true
});

// Virtual for formatted localized name
achievementSchema.virtual('localizedName').get(function() {
  return this.nameLocalized?.bn || this.name;
});

// Virtual for formatted localized description
achievementSchema.virtual('localizedDescription').get(function() {
  return this.descriptionLocalized?.bn || this.description;
});

// Static method to check and unlock achievements for user
achievementSchema.statics.checkAndUnlockAchievements = async function(userId, triggerType = null, triggerData = {}) {
  const User = mongoose.model('User');
  const Donation = mongoose.model('Donation');
  const UserAchievement = mongoose.model('UserAchievement');
  
  const user = await User.findById(userId);
  if (!user) return [];
  
  // Get user's current achievements
  const userAchievements = await UserAchievement.find({
    user: userId,
    isCompleted: true
  }).populate('achievement');
  
  const completedAchievementIds = userAchievements.map(ua => ua.achievement._id.toString());
  
  // Get all active achievements not yet completed
  const availableAchievements = await this.find({
    _id: { $nin: completedAchievementIds },
    isActive: true
  });
  
  const newlyUnlocked = [];
  
  for (const achievement of availableAchievements) {
    // Check prerequisites
    const prerequisitesMet = achievement.prerequisites.length === 0 || 
      achievement.prerequisites.every(prereqId => 
        completedAchievementIds.includes(prereqId.toString())
      );
    
    if (!prerequisitesMet) continue;
    
    // Calculate current progress based on criteria
    let currentProgress = 0;
    
    switch (achievement.criteria.type) {
      case 'donation_count':
        currentProgress = user.totalDonations || 0;
        break;
        
      case 'life_saved':
        currentProgress = user.lifeSaved || 0;
        break;
        
      case 'blood_units':
        const donations = await Donation.find({ donor: userId, status: 'completed' });
        currentProgress = donations.reduce((sum, d) => sum + d.unitsdonated, 0);
        break;
        
      case 'emergency_donations':
        const emergencyDonations = await Donation.find({ 
          donor: userId, 
          status: 'completed',
          isEmergencyDonation: true
        });
        currentProgress = emergencyDonations.length;
        break;
        
      case 'consecutive_donations':
        // Complex logic for consecutive donations
        const recentDonations = await Donation.find({
          donor: userId,
          status: 'completed'
        }).sort({ donationDate: -1 }).limit(10);
        
        let consecutive = 0;
        for (let i = 0; i < recentDonations.length - 1; i++) {
          const current = recentDonations[i].donationDate;
          const next = recentDonations[i + 1].donationDate;
          const diffMonths = (current.getFullYear() - next.getFullYear()) * 12 + 
                           (current.getMonth() - next.getMonth());
          
          if (diffMonths >= 4 && diffMonths <= 6) { // 4-6 months gap is ideal
            consecutive++;
          } else {
            break;
          }
        }
        currentProgress = consecutive;
        break;
        
      case 'rating':
        currentProgress = Math.floor(user.rating || 0);
        break;
    }
    
    // Check if achievement should be unlocked
    if (currentProgress >= achievement.criteria.value) {
      // Check special conditions
      let meetsSpecialConditions = true;
      
      if (achievement.specialConditions.bloodGroups.length > 0) {
        meetsSpecialConditions = achievement.specialConditions.bloodGroups.includes(user.bloodGroup);
      }
      
      if (achievement.specialConditions.emergencyOnly && triggerType !== 'emergency_donation') {
        meetsSpecialConditions = false;
      }
      
      if (meetsSpecialConditions) {
        // Create or update user achievement
        let userAchievement = await UserAchievement.findOne({
          user: userId,
          achievement: achievement._id
        });
        
        if (!userAchievement) {
          userAchievement = new UserAchievement({
            user: userId,
            achievement: achievement._id,
            progress: {
              current: currentProgress,
              required: achievement.criteria.value,
              percentage: 100
            },
            isCompleted: true,
            completedAt: new Date(),
            pointsEarned: achievement.points,
            unlockedBy: triggerData
          });
        } else {
          userAchievement.progress.current = currentProgress;
          userAchievement.progress.percentage = 100;
          userAchievement.isCompleted = true;
          userAchievement.completedAt = new Date();
          userAchievement.pointsEarned = achievement.points;
        }
        
        await userAchievement.save();
        
        // Update achievement statistics
        await this.findByIdAndUpdate(achievement._id, {
          $inc: { totalUnlocked: 1 }
        });
        
        // Update user points
        await User.findByIdAndUpdate(userId, {
          $inc: { totalPoints: achievement.points }
        });
        
        newlyUnlocked.push({
          achievement,
          userAchievement,
          pointsEarned: achievement.points
        });
      }
    } else {
      // Update progress for incomplete achievements
      const progressPercentage = Math.floor((currentProgress / achievement.criteria.value) * 100);
      
      await UserAchievement.findOneAndUpdate(
        { user: userId, achievement: achievement._id },
        {
          user: userId,
          achievement: achievement._id,
          progress: {
            current: currentProgress,
            required: achievement.criteria.value,
            percentage: progressPercentage
          },
          lastProgressAt: new Date(),
          $setOnInsert: {
            firstProgressAt: new Date()
          }
        },
        { upsert: true, new: true }
      );
    }
  }
  
  return newlyUnlocked;
};

// Static method to get user's achievements with progress
achievementSchema.statics.getUserAchievements = function(userId, options = {}) {
  const { category, isCompleted, limit = 50 } = options;
  
  const UserAchievement = mongoose.model('UserAchievement');
  
  const query = { user: userId };
  if (typeof isCompleted === 'boolean') query.isCompleted = isCompleted;
  
  return UserAchievement.find(query)
    .populate({
      path: 'achievement',
      match: category ? { category, isActive: true } : { isActive: true },
      select: 'name nameLocalized description descriptionLocalized category icon badge points difficulty rarity'
    })
    .sort({ completedAt: -1, 'progress.percentage': -1 })
    .limit(limit);
};

// Create indexes
achievementSchema.index({ category: 1, isActive: 1 });
achievementSchema.index({ difficulty: 1, rarity: 1 });
achievementSchema.index({ isActive: 1, order: 1 });

userAchievementSchema.index({ user: 1, achievement: 1 }, { unique: true });
userAchievementSchema.index({ user: 1, isCompleted: 1 });
userAchievementSchema.index({ user: 1, completedAt: -1 });

const Achievement = mongoose.model('Achievement', achievementSchema);
const UserAchievement = mongoose.model('UserAchievement', userAchievementSchema);

module.exports = { Achievement, UserAchievement };