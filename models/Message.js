const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // Conversation Information
  conversationId: {
    type: String,
    required: [true, 'Conversation ID is required'],
    index: true
  },
  
  // Participants
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender is required']
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipient is required']
  },
  
  // Message Content
  message: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  
  // Message Type
  messageType: {
    type: String,
    enum: ['text', 'image', 'document', 'location', 'contact', 'blood_request', 'system'],
    default: 'text'
  },
  
  // Attachments
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'document', 'audio', 'video']
    },
    url: String,
    filename: String,
    size: Number,
    mimeType: String
  }],
  
  // Related Blood Request (if applicable)
  relatedBloodRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BloodRequest'
  },
  
  // Message Status
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed'],
    default: 'sent'
  },
  
  // Read Status
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  
  // Delivery Status
  deliveredAt: {
    type: Date,
    default: Date.now
  },
  
  // System Message Information
  isSystemMessage: {
    type: Boolean,
    default: false
  },
  systemMessageType: {
    type: String,
    enum: ['user_joined', 'user_left', 'request_shared', 'donation_completed', 'conversation_started']
  },
  
  // Priority
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  // Metadata
  metadata: {
    userAgent: String,
    ipAddress: String,
    deviceInfo: mongoose.Schema.Types.Mixed
  },
  
  // Moderation
  isFlagged: {
    type: Boolean,
    default: false
  },
  flaggedReason: String,
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  moderatedAt: Date,
  
  // Auto-delete
  expiresAt: {
    type: Date,
    index: { expireAfterSeconds: 0 }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for time since message
messageSchema.virtual('timeAgo').get(function() {
  const diff = Date.now() - this.createdAt.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return this.createdAt.toLocaleDateString();
});

// Pre-save middleware to generate conversation ID
messageSchema.pre('save', function(next) {
  if (this.isNew && !this.conversationId) {
    // Create consistent conversation ID from sender and recipient
    const participants = [this.sender.toString(), this.recipient.toString()].sort();
    this.conversationId = participants.join('_');
  }
  next();
});

// Pre-save middleware to set expiration (auto-delete after 1 year)
messageSchema.pre('save', function(next) {
  if (this.isNew && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
  }
  next();
});

// Method to mark as read
messageSchema.methods.markAsRead = function() {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    this.status = 'read';
    return this.save();
  }
  return Promise.resolve(this);
};

// Static method to get conversation between two users
messageSchema.statics.getConversation = function(userId1, userId2, options = {}) {
  const { limit = 50, skip = 0 } = options;
  const participants = [userId1.toString(), userId2.toString()].sort();
  const conversationId = participants.join('_');
  
  return this.find({ conversationId })
    .populate('sender', 'name avatar')
    .populate('recipient', 'name avatar')
    .populate('relatedBloodRequest', 'title bloodGroup urgencyLevel')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to get user's conversations list
messageSchema.statics.getUserConversations = function(userId, options = {}) {
  const { limit = 20, skip = 0 } = options;
  
  return this.aggregate([
    {
      $match: {
        $or: [
          { sender: mongoose.Types.ObjectId(userId) },
          { recipient: mongoose.Types.ObjectId(userId) }
        ]
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $group: {
        _id: '$conversationId',
        lastMessage: { $first: '$$ROOT' },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$recipient', mongoose.Types.ObjectId(userId)] },
                  { $eq: ['$isRead', false] }
                ]
              },
              1,
              0
            ]
          }
        },
        totalMessages: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'lastMessage.sender',
        foreignField: '_id',
        as: 'sender'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'lastMessage.recipient',
        foreignField: '_id',
        as: 'recipient'
      }
    },
    {
      $addFields: {
        otherParticipant: {
          $cond: [
            { $eq: ['$lastMessage.sender', mongoose.Types.ObjectId(userId)] },
            { $arrayElemAt: ['$recipient', 0] },
            { $arrayElemAt: ['$sender', 0] }
          ]
        }
      }
    },
    {
      $project: {
        conversationId: '$_id',
        lastMessage: 1,
        unreadCount: 1,
        totalMessages: 1,
        otherParticipant: {
          _id: 1,
          name: 1,
          avatar: 1,
          isAvailable: 1,
          lastLogin: 1
        }
      }
    },
    {
      $sort: { 'lastMessage.createdAt': -1 }
    },
    {
      $skip: skip
    },
    {
      $limit: limit
    }
  ]);
};

// Static method to get unread message count
messageSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    recipient: userId,
    isRead: false
  });
};

// Static method to mark conversation as read
messageSchema.statics.markConversationAsRead = function(conversationId, userId) {
  return this.updateMany(
    {
      conversationId,
      recipient: userId,
      isRead: false
    },
    {
      $set: {
        isRead: true,
        readAt: new Date(),
        status: 'read'
      }
    }
  );
};

// Static method to search messages
messageSchema.statics.searchMessages = function(userId, searchTerm, options = {}) {
  const { limit = 20, skip = 0 } = options;
  
  return this.find({
    $or: [
      { sender: userId },
      { recipient: userId }
    ],
    message: { $regex: searchTerm, $options: 'i' },
    messageType: 'text'
  })
  .populate('sender', 'name avatar')
  .populate('recipient', 'name avatar')
  .sort({ createdAt: -1 })
  .limit(limit)
  .skip(skip);
};

// Create indexes
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ recipient: 1, isRead: 1 });
messageSchema.index({ createdAt: -1 });
messageSchema.index({ message: 'text' }); // Text search index
messageSchema.index({ relatedBloodRequest: 1 });
messageSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('Message', messageSchema);