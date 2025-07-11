const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Recipient Information
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipient is required']
  },
  
  // Notification Content
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  
  // Notification Type and Category
  type: {
    type: String,
    enum: [
      'blood_request',
      'donation_reminder',
      'request_response',
      'emergency_alert',
      'achievement_unlock',
      'system_update',
      'account_update',
      'donation_confirmation',
      'appointment_reminder',
      'thank_you_message',
      'campaign_invitation',
      'security_alert',
      'feedback_request',
      'general_info'
    ],
    required: [true, 'Notification type is required']
  },
  
  category: {
    type: String,
    enum: ['urgent', 'important', 'info', 'promotional'],
    default: 'info'
  },
  
  // Priority and Urgency
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  
  isEmergency: {
    type: Boolean,
    default: false
  },
  
  // Related Data
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'relatedModel'
  },
  relatedModel: {
    type: String,
    enum: ['BloodRequest', 'Donation', 'User', 'Achievement', 'Campaign']
  },
  
  // Notification Data (for app-specific information)
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Action Information
  actionRequired: {
    type: Boolean,
    default: false
  },
  actionType: {
    type: String,
    enum: ['view', 'respond', 'confirm', 'update', 'complete', 'none'],
    default: 'none'
  },
  actionUrl: String,
  actionText: String,
  
  // Delivery Status
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'read', 'failed'],
    default: 'pending'
  },
  
  // Read Status
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  
  // Delivery Channels
  deliveryChannels: {
    push: {
      enabled: {
        type: Boolean,
        default: true
      },
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date,
      messageId: String,
      response: mongoose.Schema.Types.Mixed
    },
    email: {
      enabled: {
        type: Boolean,
        default: false
      },
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date,
      messageId: String,
      response: mongoose.Schema.Types.Mixed
    },
    sms: {
      enabled: {
        type: Boolean,
        default: false
      },
      sent: {
        type: Boolean,
        default: false
      },
      sentAt: Date,
      messageId: String,
      response: mongoose.Schema.Types.Mixed
    },
    inApp: {
      enabled: {
        type: Boolean,
        default: true
      },
      sent: {
        type: Boolean,
        default: true
      },
      sentAt: {
        type: Date,
        default: Date.now
      }
    }
  },
  
  // Scheduling
  scheduledFor: Date,
  isScheduled: {
    type: Boolean,
    default: false
  },
  
  // Expiration
  expiresAt: {
    type: Date,
    index: { expireAfterSeconds: 0 }
  },
  
  // Interaction Tracking
  interactions: {
    clicked: {
      type: Boolean,
      default: false
    },
    clickedAt: Date,
    dismissed: {
      type: Boolean,
      default: false
    },
    dismissedAt: Date,
    shared: {
      type: Boolean,
      default: false
    },
    sharedAt: Date
  },
  
  // Sender Information (for system notifications)
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  senderType: {
    type: String,
    enum: ['system', 'admin', 'user', 'automated'],
    default: 'system'
  },
  
  // Localization
  language: {
    type: String,
    default: 'bn', // Bengali
    enum: ['bn', 'en']
  },
  
  // Template Information
  template: {
    id: String,
    variables: mongoose.Schema.Types.Mixed
  },
  
  // Retry Logic
  retryCount: {
    type: Number,
    default: 0,
    max: 3
  },
  lastRetryAt: Date,
  
  // Batch Information
  batchId: String,
  campaignId: String,
  
  // Administrative
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedAt: Date,
  
  metadata: {
    userAgent: String,
    ipAddress: String,
    deviceInfo: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for time since notification
notificationSchema.virtual('timeAgo').get(function() {
  const diff = Date.now() - this.createdAt.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return this.createdAt.toLocaleDateString();
});

// Virtual for checking if notification is expired
notificationSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < Date.now();
});

// Pre-save middleware to set expiration for certain types
notificationSchema.pre('save', function(next) {
  if (this.isNew && !this.expiresAt) {
    const expireInDays = {
      'emergency_alert': 1,
      'appointment_reminder': 7,
      'donation_reminder': 30,
      'general_info': 30,
      'promotional': 7
    };
    
    const daysToExpire = expireInDays[this.type] || 30;
    this.expiresAt = new Date(Date.now() + daysToExpire * 24 * 60 * 60 * 1000);
  }
  next();
});

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    this.status = 'read';
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to mark interaction
notificationSchema.methods.trackInteraction = function(interactionType, data = {}) {
  this.interactions[interactionType] = true;
  this.interactions[`${interactionType}At`] = new Date();
  
  if (interactionType === 'clicked' && !this.isRead) {
    this.markAsRead();
  }
  
  return this.save();
};

// Method to update delivery status
notificationSchema.methods.updateDeliveryStatus = function(channel, status, messageId = null, response = null) {
  if (this.deliveryChannels[channel]) {
    this.deliveryChannels[channel].sent = (status === 'sent' || status === 'delivered');
    this.deliveryChannels[channel].sentAt = new Date();
    if (messageId) this.deliveryChannels[channel].messageId = messageId;
    if (response) this.deliveryChannels[channel].response = response;
  }
  
  // Update overall status
  const allChannelsSent = Object.values(this.deliveryChannels)
    .filter(channel => channel.enabled)
    .every(channel => channel.sent);
    
  if (allChannelsSent) {
    this.status = 'sent';
  }
  
  return this.save();
};

// Static method to create bulk notifications
notificationSchema.statics.createBulkNotifications = function(recipients, notificationData) {
  const notifications = recipients.map(recipientId => ({
    ...notificationData,
    recipient: recipientId,
    batchId: notificationData.batchId || new mongoose.Types.ObjectId().toString()
  }));
  
  return this.insertMany(notifications);
};

// Static method to get unread count for user
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    recipient: userId,
    isRead: false,
    isArchived: false,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  });
};

// Static method to get user notifications with filters
notificationSchema.statics.getUserNotifications = function(userId, options = {}) {
  const {
    type,
    category,
    isRead,
    priority,
    limit = 20,
    skip = 0,
    sortBy = '-createdAt'
  } = options;
  
  const query = {
    recipient: userId,
    isArchived: false,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  };
  
  if (type) query.type = type;
  if (category) query.category = category;
  if (typeof isRead === 'boolean') query.isRead = isRead;
  if (priority) query.priority = priority;
  
  return this.find(query)
    .populate('sender', 'name avatar')
    .populate('relatedId')
    .sort(sortBy)
    .skip(skip)
    .limit(limit);
};

// Static method to clean up old notifications
notificationSchema.statics.cleanupOldNotifications = function() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  return this.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { 
        createdAt: { $lt: thirtyDaysAgo },
        isRead: true,
        category: { $in: ['info', 'promotional'] }
      }
    ]
  });
};

// Create indexes
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1 });
notificationSchema.index({ recipient: 1, priority: 1 });
notificationSchema.index({ status: 1 });
notificationSchema.index({ isScheduled: 1, scheduledFor: 1 });
notificationSchema.index({ batchId: 1 });
notificationSchema.index({ expiresAt: 1 });
notificationSchema.index({ createdAt: 1 });

module.exports = mongoose.model('Notification', notificationSchema);