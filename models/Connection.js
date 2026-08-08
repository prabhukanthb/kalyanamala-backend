// ==========================================
// CONNECTION MODEL
// New Kalyanamala Matrimony
// ==========================================

const mongoose = require('mongoose');

// ==========================================
// CONNECTION SCHEMA
// ==========================================

const connectionSchema = new mongoose.Schema(
  {
    // ==========================================
    // USER REFERENCES
    // ==========================================

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true,'SenderIDisrequired'],
      index: true
    },

    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true,'RecipientIDisrequired'],
      index: true
    },

    // ==========================================
    // CONNECTION STATUS
    // ==========================================

    status: {
      type: String,
      enum: {
        values: ['pending','accepted','rejected','blocked','disconnected'],
        message: 'Status must be pending, accepted, rejected, blocked, or disconnected'
      },
      default: 'pending',
      index: true
    },

    // ==========================================
    // CONNECTION MESSAGE
    // ==========================================

    message: {
      type: String,
      maxlength: [200,'Messagecannotexceed200characters'],
      default: null
    },

    // ==========================================
    // TIMESTAMPS FOR DIFFERENT STATUSES
    // ==========================================

    sentAt: {
      type: Date,
      default: Date.now,
      index: true
    },

    acceptedAt: Date,

    rejectedAt: Date,

    blockedAt: Date,

    disconnectedAt: Date,

    // ==========================================
    // BLOCKING INFORMATION
    // ==========================================

    blockReason: String,

    blockExpiry: Date,

    permanentBlock: {
      type: Boolean,
      default: false
    },

    // ==========================================
    // INTERACTION TRACKING
    // ==========================================

    interactions: [
      {
        type: {
          type: String,
          enum: ['message_sent','profile_viewed','call_initiated','like_sent'],
          required: true
        },

        performedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },

        timestamp: {
          type: Date,
          default: Date.now
        },

        data: mongoose.Schema.Types.Mixed // For storing additional data
      }
    ],

    // ==========================================
    // MESSAGING TRACKING
    // ==========================================

    lastMessage: String,

    lastMessageAt: Date,

    lastMessageBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    unreadMessageCount: {
      type: Number,
      default: 0
    },

    // ==========================================
    // INTERACTION METRICS
    // ==========================================

    metrics: {
      totalInteractions: {
        type: Number,
        default: 0
      },

      profileViewCount: {
        type: Number,
        default: 0
      },

      messageCount: {
        type: Number,
        default: 0
      },

      callCount: {
        type: Number,
        default: 0
      },

      totalCommunicationTime: {
        type: Number,
        default: 0 // in seconds
      },

      lastActivityAt: Date
    },

    // ==========================================
    // RATING & FEEDBACK
    // ==========================================

    rating: {
      senderRating: {
        type: Number,
        min: 1,
        max: 5,
        default: null
      },

      senderFeedback: {
        type: String,
        maxlength: [500,'Feedbackcannotexceed500characters']
      },

      recipientRating: {
        type: Number,
        min: 1,
        max: 5,
        default: null
      },

      recipientFeedback: {
        type: String,
        maxlength: [500,'Feedbackcannotexceed500characters']
      },

      ratedAt: Date
    },

    // ==========================================
    // MEMBER PREFERENCE
    // ==========================================

    senderPreference: {
      type: String,
      enum: ['interested','maybe','not_interested'],
      default: null
    },

    recipientPreference: {
      type: String,
      enum: ['interested','maybe','not_interested'],
      default: null
    },

    preferencesUpdatedAt: Date,

    // ==========================================
    // MATCHING SCORE
    // ==========================================

    matchScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },

    matchScoreBreakdown: {
      ageMatch: Number,
      religionMatch: Number,
      locationMatch: Number,
      educationMatch: Number,
      incomeMatch: Number,
      otherMatches: Number
    },

    // ==========================================
    // VERIFICATION STATUS
    // ==========================================

    isVerified: {
      type: Boolean,
      default: false
    },

    verifiedAt: Date,

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    // ==========================================
    // NOTES & COMMENTS (PRIVATE)
    // ==========================================

    senderNotes: {
      type: String,
      maxlength: [1000,'Notescannotexceed1000characters'],
      default: null
    },

    recipientNotes: {
      type: String,
      maxlength: [1000,'Notescannotexceed1000characters'],
      default: null
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

// Sender ID index
connectionSchema.index({ senderId: 1 });

// Recipient ID index
connectionSchema.index({ recipientId: 1 });

// Status index
connectionSchema.index({ status: 1 });

// Composite index for finding connections between two users
connectionSchema.index({
  $or: [
    { senderId: 1, recipientId: 1 },
    { senderId: 1, recipientId: 1 }
  ]
});

// Status and sender index (for getting user's outgoing requests)
connectionSchema.index({ senderId: 1, status: 1 });

// Status and recipient index (for getting user's incoming requests)
connectionSchema.index({ recipientId: 1, status: 1 });

// Created date index
connectionSchema.index({ createdAt: -1 });

// Last message date index
connectionSchema.index({ lastMessageAt: -1 });

// Match score index (for sorting matches)
connectionSchema.index({ matchScore: -1 });

// Metrics activity index
connectionSchema.index({ 'metrics.lastActivityAt': -1 });

// Blocked users index
connectionSchema.index({ senderId: 1, status: 1, blockedAt: 1 });

// ==========================================
// VIRTUAL FIELDS
// ==========================================

// Days since connection sent
connectionSchema.virtual('daysSinceSent').get(function() {
  if (!this.sentAt) return null;
  const days = Math.floor((Date.now() - this.sentAt.getTime()) / (1000 * 60 * 60 * 24));
  return days;
});

// Days since connection accepted
connectionSchema.virtual('daysSinceAccepted').get(function() {
  if (!this.acceptedAt) return null;
  const days = Math.floor((Date.now() - this.acceptedAt.getTime()) / (1000 * 60 * 60 * 24));
  return days;
});

// Is blocked
connectionSchema.virtual('isBlocked').get(function() {
  if (this.status !== 'blocked') return false;
  if (this.permanentBlock) return true;
  if (this.blockExpiry && this.blockExpiry > new Date()) return true;
  return false;
});

// Status duration (for how long in current status)
connectionSchema.virtual('statusDuration').get(function() {
  let statusDate;
  
  switch (this.status) {
    case 'accepted':
      statusDate = this.acceptedAt;
      break;
    case 'rejected':
      statusDate = this.rejectedAt;
      break;
    case 'blocked':
      statusDate = this.blockedAt;
      break;
    case 'disconnected':
      statusDate = this.disconnectedAt;
      break;
    default:
      statusDate = this.sentAt;
  }

  if (!statusDate) return null;
  return Math.floor((Date.now() - statusDate.getTime()) / 1000); // seconds
});

// ==========================================
// METHODS
// ==========================================

// Method to accept connection request
connectionSchema.methods.accept = function() {
  if (this.status !== 'pending') {
    throw new Error(`Cannot accept connection with status: ${this.status}`);
  }
  
  this.status = 'accepted';
  this.acceptedAt = new Date();
  this.updatedAt = new Date();
  
  return this;
};

// Method to reject connection request
connectionSchema.methods.reject = function() {
  if (this.status !== 'pending') {
    throw new Error(`Cannot reject connection with status: ${this.status}`);
  }
  
  this.status = 'rejected';
  this.rejectedAt = new Date();
  this.updatedAt = new Date();
  
  return this;
};

// Method to block user
connectionSchema.methods.block = function(reason = null, duration = null, permanent = false) {
  this.status = 'blocked';
  this.blockReason = reason;
  this.blockedAt = new Date();
  this.permanentBlock = permanent;
  
  if (duration && !permanent) {
    this.blockExpiry = new Date(Date.now() + duration);
  }
  
  this.updatedAt = new Date();
  
  return this;
};

// Method to unblock user
connectionSchema.methods.unblock = function() {
  if (this.status !== 'blocked') {
    throw new Error('Connection is not blocked');
  }
  
  this.status = 'pending';
  this.blockReason = null;
  this.blockedAt = null;
  this.blockExpiry = null;
  this.permanentBlock = false;
  this.updatedAt = new Date();
  
  return this;
};

// Method to disconnect
connectionSchema.methods.disconnect = function() {
  if (this.status !== 'accepted') {
    throw new Error('Can only disconnect from accepted connections');
  }
  
  this.status = 'disconnected';
  this.disconnectedAt = new Date();
  this.updatedAt = new Date();
  
  return this;
};

// Method to add interaction
connectionSchema.methods.addInteraction = function(type, performedBy, data = null) {
  this.interactions.push({
    type,
    performedBy,
    timestamp: new Date(),
    data
  });
  
  this.metrics.totalInteractions += 1;
  this.metrics.lastActivityAt = new Date();
  
  // Update specific metric
  switch (type) {
    case 'profile_viewed':
      this.metrics.profileViewCount += 1;
      break;
    case 'message_sent':
      this.metrics.messageCount += 1;
      break;
    case 'call_initiated':
      this.metrics.callCount += 1;
      break;
  }
  
  this.updatedAt = new Date();
  
  return this;
};

// Method to update last message
connectionSchema.methods.updateLastMessage = function(message, senderId) {
  this.lastMessage = message;
  this.lastMessageAt = new Date();
  this.lastMessageBy = senderId;
  this.updatedAt = new Date();
  
  return this;
};

// Method to update communication time
connectionSchema.methods.addCommunicationTime = function(seconds) {
  this.metrics.totalCommunicationTime += seconds;
  this.metrics.lastActivityAt = new Date();
  this.updatedAt = new Date();
  
  return this;
};

// Method to add rating
connectionSchema.methods.addRating = function(userId, rating, feedback = null) {
  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }
  
  if (userId.equals(this.senderId)) {
    this.rating.senderRating = rating;
    this.rating.senderFeedback = feedback;
  } else if (userId.equals(this.recipientId)) {
    this.rating.recipientRating = rating;
    this.rating.recipientFeedback = feedback;
  } else {
    throw new Error('User is not part of this connection');
  }
  
  this.rating.ratedAt = new Date();
  this.updatedAt = new Date();
  
  return this;
};

// Method to update preference
connectionSchema.methods.updatePreference = function(userId, preference) {
  if (!['interested','maybe','not_interested'].includes(preference)) {
    throw new Error('Invalid preference value');
  }
  
  if (userId.equals(this.senderId)) {
    this.senderPreference = preference;
  } else if (userId.equals(this.recipientId)) {
    this.recipientPreference = preference;
  } else {
    throw new Error('User is not part of this connection');
  }
  
  this.preferencesUpdatedAt = new Date();
  this.updatedAt = new Date();
  
  return this;
};

// Method to update match score
connectionSchema.methods.updateMatchScore = function(score, breakdown = {}) {
  this.matchScore = Math.min(100, Math.max(0, score));
  this.matchScoreBreakdown = { ...this.matchScoreBreakdown, ...breakdown };
  this.updatedAt = new Date();
  
  return this;
};

// Method to get connection for user perspective
connectionSchema.methods.getForUser = function(userId) {
  const isInitiator = userId.equals(this.senderId);
  
  return {
    id: this._id,
    otherUserId: isInitiator ? this.recipientId : this.senderId,
    status: this.status,
    message: this.message,
    lastMessage: this.lastMessage,
    lastMessageAt: this.lastMessageAt,
    sentAt: this.sentAt,
    acceptedAt: this.acceptedAt,
    matchScore: this.matchScore,
    myPreference: isInitiator ? this.senderPreference : this.recipientPreference,
    theirPreference: isInitiator ? this.recipientPreference : this.senderPreference,
    isInitiator,
    daysSinceSent: this.daysSinceSent,
    daysSinceAccepted: this.daysSinceAccepted,
    myNotes: isInitiator ? this.senderNotes : this.recipientNotes
  };
};

// ==========================================
// STATICS
// ==========================================

// Static method to find connection between two users
connectionSchema.statics.findBetweenUsers = function(userId1, userId2) {
  return this.findOne({
    $or: [
      { senderId: userId1, recipientId: userId2 },
      { senderId: userId2, recipientId: userId1 }
    ]
  });
};

// Static method to find sent requests
connectionSchema.statics.findSentRequests = function(userId, status = null) {
  const query = { senderId: userId };
  if (status) query.status = status;
  
  return this.find(query)
    .populate('recipientId', 'firstName lastName profilePhoto')
    .sort({ sentAt: -1 });
};

// Static method to find received requests
connectionSchema.statics.findReceivedRequests = function(userId, status = null) {
  const query = { recipientId: userId };
  if (status) query.status = status;
  
  return this.find(query)
    .populate('senderId', 'firstName lastName profilePhoto')
    .sort({ sentAt: -1 });
};

// Static method to find accepted connections
connectionSchema.statics.findAcceptedConnections = function(userId) {
  return this.find({
    $or: [
      { senderId: userId, status: 'accepted' },
      { recipientId: userId, status: 'accepted' }
    ]
  })
    .populate('senderId', 'firstName lastName profilePhoto')
    .populate('recipientId', 'firstName lastName profilePhoto')
    .sort({ acceptedAt: -1 });
};

// Static method to find blocked users
connectionSchema.statics.findBlockedUsers = function(userId) {
  return this.find({
    senderId: userId,
    status: 'blocked'
  })
    .populate('recipientId', 'firstName lastName email')
    .sort({ blockedAt: -1 });
};

// Static method to check if users are connected
connectionSchema.statics.areConnected = function(userId1, userId2) {
  return this.findOne({
    $or: [
      { senderId: userId1, recipientId: userId2, status: 'accepted' },
      { senderId: userId2, recipientId: userId1, status: 'accepted' }
    ]
  });
};

// Static method to check if user is blocked
connectionSchema.statics.isUserBlocked = function(blockerId, blockedId) {
  return this.findOne({
    senderId: blockerId,
    recipientId: blockedId,
    status: 'blocked'
  });
};

// Static method to get connection suggestions (high match score)
connectionSchema.statics.getMatchSuggestions = function(userId, limit = 10) {
  return this.find({
    $or: [
      { senderId: userId, status: 'pending' },
      { recipientId: userId, status: 'pending' }
    ]
  })
    .sort({ matchScore: -1 })
    .limit(limit)
    .populate('senderId', 'firstName lastName profilePhoto')
    .populate('recipientId', 'firstName lastName profilePhoto');
};

// Static method to get recent conversations
connectionSchema.statics.getRecentConversations = function(userId, limit = 20) {
  return this.find({
    $or: [
      { senderId: userId, status: 'accepted' },
      { recipientId: userId, status: 'accepted' }
    ]
  })
    .sort({ lastMessageAt: -1 })
    .limit(limit)
    .populate('senderId', 'firstName lastName profilePhoto')
    .populate('recipientId', 'firstName lastName profilePhoto');
};

// Static method to get pending requests count
connectionSchema.statics.getPendingCount = function(userId) {
  return this.countDocuments({
    recipientId: userId,
    status: 'pending'
  });
};

// Static method to search connections
connectionSchema.statics.searchConnections = function(userId, filters = {}) {
  const query = {
    $or: [
      { senderId: userId },
      { recipientId: userId }
    ]
  };

  if (filters.status) query.status = filters.status;
  if (filters.matchScoreMin) query.matchScore = { $gte: filters.matchScoreMin };
  if (filters.matchScoreMax) {
    query.matchScore = query.matchScore || {};
    query.matchScore.$lte = filters.matchScoreMax;
  }

  return this.find(query);
};

// ==========================================
// MIDDLEWARE HOOKS
// ==========================================

// Update the updatedAt timestamp on every save
connectionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Validate that sender and recipient are different
connectionSchema.pre('save', function(next) {
  if (this.senderId.equals(this.recipientId)) {
    throw new Error('Cannot create connection with same user');
  }
  next();
});

// ==========================================
// MODEL EXPORT
// ==========================================

const Connection = mongoose.model('Connection', connectionSchema);

module.exports = Connection;
