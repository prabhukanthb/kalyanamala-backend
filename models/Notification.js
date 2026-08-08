// ==========================================
// NOTIFICATION MODEL
// New Kalyanamala Matrimony
// ==========================================

const mongoose = require('mongoose');

// ==========================================
// NOTIFICATION SCHEMA
// ==========================================

const notificationSchema = new mongoose.Schema(
  {
    // ==========================================
    // USER REFERENCE
    // ==========================================

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true,'UserIDisrequired'],
      index: true
    },

    // ==========================================
    // NOTIFICATION TYPE
    // ==========================================

    type: {
      type: String,
      enum: {
        values: [
          'connection_request',
          'connection_accepted',
          'connection_rejected',
          'message',
          'profile_view',
          'like',
          'call_incoming',
          'call_missed',
          'subscription_expiring',
          'subscription_expired',
          'profile_approved',
          'profile_suspended',
          'account_warning',
          'system_announcement',
          'support_response',
          'reminder'
        ],
        message: 'Invalid notification type'
      },
      required: [true,'Notificationtypeisrequired'],
      index: true
    },

    // ==========================================
    // NOTIFICATION CONTENT
    // ==========================================

    title: {
      type: String,
      required: [true,'Titleisrequired'],
      maxlength: [100,'Titlecannotexceed100characters']
    },

    message: {
      type: String,
      required: [true,'Messageisrequired'],
      maxlength: [500,'Messagecannotexceed500characters']
    },

    description: {
      type: String,
      maxlength: [1000,'Descriptioncannotexceed1000characters'],
      default: null
    },

    // ==========================================
    // RELATED ENTITIES
    // ==========================================

    relatedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    relatedProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      default: null
    },

    relatedConnectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Connection',
      default: null
    },

    relatedMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null
    },

    relatedConversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      default: null
    },

    // ==========================================
    // NOTIFICATION DATA (FLEXIBLE)
    // ==========================================

    data: mongoose.Schema.Types.Mixed, // Store additional data (JSON format)

    // ==========================================
    // READ STATUS
    // ==========================================

    isRead: {
      type: Boolean,
      default: false,
      index: true
    },

    readAt: Date,

    // ==========================================
    // ACTION URL
    // ==========================================

    actionUrl: {
      type: String,
      default: null
    },

    actionType: {
      type: String,
      enum: [
        'view_profile',
        'view_message',
        'accept_connection',
        'view_connection',
        'view_conversation',
        'renew_subscription',
        'review_profile',
        'contact_support'
      ],
      default: null
    },

    // ==========================================
    // DELIVERY CHANNELS
    // ==========================================

    channels: {
      inApp: {
        type: Boolean,
        default: true
      },

      email: {
        type: Boolean,
        default: true
      },

      push: {
        type: Boolean,
        default: true
      },

      sms: {
        type: Boolean,
        default: false
      }
    },

    // ==========================================
    // DELIVERY STATUS
    // ==========================================

    deliveryStatus: {
      inApp: {
        type: String,
        enum: ['pending','delivered','failed'],
        default: 'pending'
      },

      email: {
        type: String,
        enum: ['pending','sent','failed'],
        default: 'pending'
      },

      push: {
        type: String,
        enum: ['pending','sent','failed'],
        default: 'pending'
      },

      sms: {
        type: String,
        enum: ['pending','sent','failed'],
        default: 'pending'
      }
    },

    // ==========================================
    // PRIORITY
    // ==========================================

    priority: {
      type: String,
      enum: ['low','normal','high','urgent'],
      default: 'normal',
      index: true
    },

    // ==========================================
    // SCHEDULING
    // ==========================================

    scheduledFor: Date,

    isSent: {
      type: Boolean,
      default: true
    },

    sentAt: Date,

    // ==========================================
    // EXPIRATION
    // ==========================================

    expiresAt: Date,

    // ==========================================
    // TAGS
    // ==========================================

    tags: [String],

    // ==========================================
    // CAMPAIGN TRACKING (FOR MARKETING)
    // ==========================================

    campaignId: {
      type: String,
      default: null
    },

    campaignName: String,

    // ==========================================
    // BATCH OPERATIONS
    // ==========================================

    batchId: {
      type: String,
      default: null
    },

    // ==========================================
    // METADATA
    // ==========================================

    metadata: {
      source: {
        type: String,
        enum: ['system','user_action','scheduled','admin','api'],
        default: 'system'
      },

      ipAddress: String,

      userAgent: String,

      locale: {
        type: String,
        default: 'en'
      }
    },

    // ==========================================
    // DISMISSAL & ARCHIVAL
    // ==========================================

    isDismissed: {
      type: Boolean,
      default: false
    },

    dismissedAt: Date,

    isArchived: {
      type: Boolean,
      default: false
    },

    archivedAt: Date,

    // ==========================================
    // ENGAGEMENT TRACKING
    // ==========================================

    engagement: {
      isClicked: {
        type: Boolean,
        default: false
      },

      clickedAt: Date,

      clickCount: {
        type: Number,
        default: 0
      },

      isShared: {
        type: Boolean,
        default: false
      },

      sharedAt: Date,

      isLiked: {
        type: Boolean,
        default: false
      },

      likedAt: Date
    },

    // ==========================================
    // TIMESTAMPS
    // ==========================================

    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    },

    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false
  }
);

// ==========================================
// INDEXES
// ==========================================

// User index
notificationSchema.index({ userId: 1 });

// Type index
notificationSchema.index({ type: 1 });

// Read status index
notificationSchema.index({ isRead: 1 });

// Priority index
notificationSchema.index({ priority: 1 });

// Created date index
notificationSchema.index({ createdAt: -1 });

// Compound indexes for efficient queries
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

notificationSchema.index({ userId: 1, type: 1, isRead: 1 });

notificationSchema.index({ userId: 1, createdAt: -1 });

// Expiration index (for TTL cleanup)
notificationSchema.index({ expiresAt: 1 }, { sparse: true });

// TTL Index for auto-deleting old notifications (90 days)
notificationSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 7776000,
    partialFilterExpression: { isArchived: false }
  }
);

// Scheduled notifications index
notificationSchema.index({ scheduledFor: 1, isSent: 1 });

// ==========================================
// VIRTUAL FIELDS
// ==========================================

// Time since creation
notificationSchema.virtual('timeSinceCreation').get(function() {
  const seconds = Math.floor((Date.now() - this.createdAt.getTime()) / 1000);
  
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
});

// Is expired
notificationSchema.virtual('isExpired').get(function() {
  if (!this.expiresAt) return false;
  return this.expiresAt < new Date();
});

// Is old (older than 7 days)
notificationSchema.virtual('isOld').get(function() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return this.createdAt < sevenDaysAgo;
});

// Total read time
notificationSchema.virtual('readTime').get(function() {
  if (!this.isRead || !this.readAt) return null;
  return this.readAt - this.createdAt; // milliseconds
});

// Engagement score (0-100)
notificationSchema.virtual('engagementScore').get(function() {
  let score = 0;
  
  if (this.isRead) score += 25;
  if (this.engagement.isClicked) score += 30;
  if (this.engagement.isShared) score += 20;
  if (this.engagement.isLiked) score += 25;
  
  return Math.min(100, score);
});

// ==========================================
// METHODS
// ==========================================

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  this.updatedAt = new Date();
  
  return this;
};

// Method to mark as unread
notificationSchema.methods.markAsUnread = function() {
  this.isRead = false;
  this.readAt = null;
  this.updatedAt = new Date();
  
  return this;
};

// Method to dismiss notification
notificationSchema.methods.dismiss = function() {
  this.isDismissed = true;
  this.dismissedAt = new Date();
  this.updatedAt = new Date();
  
  return this;
};

// Method to restore dismissed notification
notificationSchema.methods.restore = function() {
  this.isDismissed = false;
  this.dismissedAt = null;
  this.updatedAt = new Date();
  
  return this;
};

// Method to archive notification
notificationSchema.methods.archive = function() {
  this.isArchived = true;
  this.archivedAt = new Date();
  this.updatedAt = new Date();
  
  return this;
};

// Method to unarchive notification
notificationSchema.methods.unarchive = function() {
  this.isArchived = false;
  this.archivedAt = null;
  this.updatedAt = new Date();
  
  return this;
};

// Method to record click
notificationSchema.methods.recordClick = function() {
  this.engagement.isClicked = true;
  this.engagement.clickedAt = new Date();
  this.engagement.clickCount += 1;
  this.updatedAt = new Date();
  
  return this;
};

// Method to record share
notificationSchema.methods.recordShare = function() {
  this.engagement.isShared = true;
  this.engagement.sharedAt = new Date();
  this.updatedAt = new Date();
  
  return this;
};

// Method to record like
notificationSchema.methods.recordLike = function() {
  this.engagement.isLiked = true;
  this.engagement.likedAt = new Date();
  this.updatedAt = new Date();
  
  return this;
};

// Method to update delivery status
notificationSchema.methods.updateDeliveryStatus = function(channel, status) {
  if (this.deliveryStatus[channel]) {
    this.deliveryStatus[channel] = status;
    
    if (status === 'sent') {
      this.isSent = true;
      this.sentAt = new Date();
    }
    
    this.updatedAt = new Date();
  }
  
  return this;
};

// Method to get notification for display
notificationSchema.methods.getForDisplay = function() {
  return {
    id: this._id,
    type: this.type,
    title: this.title,
    message: this.message,
    description: this.description,
    isRead: this.isRead,
    priority: this.priority,
    actionUrl: this.actionUrl,
    actionType: this.actionType,
    relatedUserId: this.relatedUserId,
    relatedProfileId: this.relatedProfileId,
    engagement: this.engagement,
    createdAt: this.createdAt,
    timeSinceCreation: this.timeSinceCreation,
    engagementScore: this.engagementScore
  };
};

// ==========================================
// STATICS
// ==========================================

// Static method to find user notifications
notificationSchema.statics.findUserNotifications = function(userId, options = {}) {
  const {
    limit = 20,
    page = 1,
    status = 'all', // all, unread, read, dismissed, archived
    type = null,
    priority = null,
    sortBy = 'createdAt'
  } = options;

  const skip = (page - 1) * limit;
  let query = { userId };

  // Filter by status
  if (status === 'unread') {
    query.isRead = false;
    query.isDismissed = false;
  } else if (status === 'read') {
    query.isRead = true;
  } else if (status === 'dismissed') {
    query.isDismissed = true;
  } else if (status === 'archived') {
    query.isArchived = true;
  } else if (status === 'all') {
    query.isArchived = false;
  }

  if (type) query.type = type;
  if (priority) query.priority = priority;

  const sortObj = {};
  sortObj[sortBy] = -1;

  return this.find(query)
    .sort(sortObj)
    .limit(parseInt(limit))
    .skip(skip);
};

// Static method to count unread notifications
notificationSchema.statics.countUnreadNotifications = function(userId) {
  return this.countDocuments({
    userId,
    isRead: false,
    isDismissed: false
  });
};

// Static method to get unread count by type
notificationSchema.statics.getUnreadCountByType = function(userId) {
  return this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        isRead: false,
        isDismissed: false
      }
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 }
      }
    }
  ]);
};

// Static method to find by type
notificationSchema.statics.findByType = function(userId, type, limit = 20) {
  return this.find({
    userId,
    type,
    isArchived: false
  })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to find high priority notifications
notificationSchema.statics.findHighPriority = function(userId) {
  return this.find({
    userId,
    priority: { $in: ['high','urgent'] },
    isRead: false,
    isArchived: false
  })
    .sort({ createdAt: -1 });
};

// Static method to find recent notifications
notificationSchema.statics.findRecent = function(userId, days = 7) {
  const dateFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return this.find({
    userId,
    createdAt: { $gte: dateFrom },
    isArchived: false
  })
    .sort({ createdAt: -1 });
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { userId, isRead: false },
    {
      isRead: true,
      readAt: new Date(),
      updatedAt: new Date()
    }
  );
};

// Static method to delete old notifications
notificationSchema.statics.deleteOldNotifications = function(daysOld = 90) {
  const dateThreshold = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
  
  return this.deleteMany({
    createdAt: { $lt: dateThreshold },
    isArchived: false
  });
};

// Static method to get notifications for sending (scheduled)
notificationSchema.statics.findScheduledToSend = function() {
  return this.find({
    isSent: false,
    scheduledFor: { $lte: new Date() }
  });
};

// Static method to get notification stats
notificationSchema.statics.getStats = function(userId, days = 7) {
  const dateFrom = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        createdAt: { $gte: dateFrom }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        unread: {
          $sum: { $cond: [{$eq:['$isRead',false] }, 1, 0] }
        },
        clicked: {
          $sum: { $cond: [{$eq:['$engagement.isClicked',true] }, 1, 0] }
        },
        shared: {
          $sum: { $cond: [{$eq:['$engagement.isShared',true] }, 1, 0] }
        }
      }
    }
  ]);
};

// Static method to create bulk notifications
notificationSchema.statics.createBulk = function(notifications) {
  return this.insertMany(notifications);
};

// ==========================================
// MIDDLEWARE HOOKS
// ==========================================

// Update the updatedAt timestamp on every save
notificationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Set expiration if not already set (30 days default)
notificationSchema.pre('save', function(next) {
  if (!this.expiresAt && !this.isArchived) {
    this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }
  next();
});

// ==========================================
// MODEL EXPORT
// ==========================================

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
