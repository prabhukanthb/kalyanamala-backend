// ==========================================
// CONVERSATION MODEL
// New Kalyanamala Matrimony
// ==========================================

const mongoose = require('mongoose');

// ==========================================
// CONVERSATION SCHEMA
// ==========================================

const conversationSchema = new mongoose.Schema(
  {
    // ==========================================
    // PARTICIPANTS
    // ==========================================

    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
      }
    ],

    // ==========================================
    // PARTICIPANT DETAILS
    // ==========================================

    participantDetails: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },

        firstName: String,

        lastName: String,

        profilePhoto: String,

        joinedAt: {
          type: Date,
          default: Date.now
        },

        leftAt: Date,

        isActive: {
          type: Boolean,
          default: true
        }
      }
    ],

    // ==========================================
    // MESSAGE INFORMATION
    // ==========================================

    lastMessage: {
      type: String,
      default: null
    },

    lastMessageAt: {
      type: Date,
      default: null,
      index: true
    },

    lastMessageBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    messageCount: {
      type: Number,
      default: 0
    },

    // ==========================================
    // UNREAD MESSAGE TRACKING
    // ==========================================

    unreadCounts: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },

        count: {
          type: Number,
          default: 0
        }
      }
    ],

    // ==========================================
    // CONVERSATION STATUS
    // ==========================================

    status: {
      type: String,
      enum: {
        values: ['active','archived','muted','deleted'],
        message: 'Status must be active, archived, muted, or deleted'
      },
      default: 'active',
      index: true
    },

    // ==========================================
    // ARCHIVING
    // ==========================================

    isArchived: {
      type: Boolean,
      default: false
    },

    archivedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],

    archivedAt: [Date],

    // ==========================================
    // MUTING
    // ==========================================

    isMuted: {
      type: Boolean,
      default: false
    },

    mutedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],

    mutedAt: [Date],

    muteDuration: [Number], // in milliseconds

    muteExpiresAt: [Date],

    // ==========================================
    // PINNING
    // ==========================================

    isPinned: {
      type: Boolean,
      default: false
    },

    pinnedAt: Date,

    pinnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    // ==========================================
    // CONVERSATION SETTINGS
    // ==========================================

    settings: {
      allowNotifications: {
        type: Boolean,
        default: true
      },

      allowMediaSharing: {
        type: Boolean,
        default: true
      },

      allowVideoCall: {
        type: Boolean,
        default: true
      },

      allowAudioCall: {
        type: Boolean,
        default: true
      },

      encryptionEnabled: {
        type: Boolean,
        default: false
      },

      isPrivate: {
        type: Boolean,
        default: true
      }
    },

    // ==========================================
    // CALL HISTORY
    // ==========================================

    callHistory: [
      {
        initiatorId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },

        recipientId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },

        callType: {
          type: String,
          enum: ['audio','video'],
          required: true
        },

        startedAt: {
          type: Date,
          required: true
        },

        endedAt: Date,

        duration: Number, // in seconds

        status: {
          type: String,
          enum: ['ongoing','completed','missed','rejected','cancelled'],
          default: 'ongoing'
        },

        callQuality: {
          type: String,
          enum: ['excellent','good','fair','poor'],
          default: null
        }
      }
    ],

    // ==========================================
    // MEDIA SHARING
    // ==========================================

    sharedMedia: [
      {
        messageId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Message'
        },

        type: {
          type: String,
          enum: ['image','document','audio','video'],
          required: true
        },

        url: String,

        sharedAt: {
          type: Date,
          default: Date.now
        },

        sharedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        }
      }
    ],

    // ==========================================
    // DELETION TRACKING
    // ==========================================

    deletedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],

    deletedAt: [Date],

    // ==========================================
    // CONVERSATION METADATA
    // ==========================================

    metadata: {
      totalDuration: {
        type: Number,
        default: 0 // in seconds
      },

      videoCallCount: {
        type: Number,
        default: 0
      },

      audioCallCount: {
        type: Number,
        default: 0
      },

      mediaItemsShared: {
        type: Number,
        default: 0
      },

      averageResponseTime: Number, // in seconds
    },

    // ==========================================
    // LABELS & TAGS
    // ==========================================

    labels: [
      {
        type: String,
        enum: ['favourite','important','follow_up','custom']
      }
    ],

    customLabels: [String],

    // ==========================================
    // NOTES (PRIVATE)
    // ==========================================

    notes: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },

        content: String,

        addedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],

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

// Participants index
conversationSchema.index({ participants: 1 });

// Status index
conversationSchema.index({ status: 1 });

// Last message date index
conversationSchema.index({ lastMessageAt: -1 });

// Created date index
conversationSchema.index({ createdAt: -1 });

// Pinned conversations index
conversationSchema.index({ isPinned: -1 });

// Compound index for finding conversations with specific users
conversationSchema.index({ participants: 1, lastMessageAt: -1 });

// Archived conversations index
conversationSchema.index({ isArchived: 1, lastMessageAt: -1 });

// Unread messages index
conversationSchema.index({ 'unreadCounts.userId': 1, 'unreadCounts.count': 1 });

// ==========================================
// VIRTUAL FIELDS
// ==========================================

// Get other participant(s) for 1-on-1 conversation
conversationSchema.virtual('otherParticipants').get(function() {
  // This will be populated based on context (userId passed to query)
  return this.participantDetails;
});

// Total unread count
conversationSchema.virtual('totalUnreadCount').get(function() {
  return this.unreadCounts.reduce((sum, item) => sum + item.count, 0);
});

// Days since last message
conversationSchema.virtual('daysSinceLastMessage').get(function() {
  if (!this.lastMessageAt) return null;
  const days = Math.floor((Date.now() - this.lastMessageAt.getTime()) / (1000 * 60 * 60 * 24));
  return days;
});

// Is active (has recent activity)
conversationSchema.virtual('isActive').get(function() {
  if (!this.lastMessageAt) return false;
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return this.lastMessageAt > sevenDaysAgo;
});

// ==========================================
// METHODS
// ==========================================

// Method to get conversation for user
conversationSchema.methods.getForUser = function(userId) {
  const userIndex = this.participants.findIndex(p => p.equals(userId));
  
  if (userIndex === -1) {
    throw new Error('User is not part of this conversation');
  }

  // Get other participant(s)
  const otherParticipants = this.participantDetails.filter(
    p => !p.userId.equals(userId)
  );

  // Get unread count for this user
  const unreadData = this.unreadCounts.find(u => u.userId.equals(userId));
  const unreadCount = unreadData ? unreadData.count : 0;

  return {
    id: this._id,
    otherParticipants,
    lastMessage: this.lastMessage,
    lastMessageAt: this.lastMessageAt,
    lastMessageBy: this.lastMessageBy,
    unreadCount,
    status: this.status,
    isArchived: this.isArchived,
    isPinned: this.isPinned,
    isMuted: this.isMuted,
    messageCount: this.messageCount,
    settings: this.settings,
    createdAt: this.createdAt
  };
};

// Method to mark all messages as read
conversationSchema.methods.markAsRead = function(userId) {
  const unreadIndex = this.unreadCounts.findIndex(u => u.userId.equals(userId));
  
  if (unreadIndex !== -1) {
    this.unreadCounts[unreadIndex].count = 0;
  }

  this.updatedAt = new Date();
  
  return this;
};

// Method to increment unread count
conversationSchema.methods.incrementUnreadCount = function(userId) {
  let unreadData = this.unreadCounts.find(u => u.userId.equals(userId));

  if (!unreadData) {
    this.unreadCounts.push({
      userId,
      count: 1
    });
  } else {
    unreadData.count += 1;
  }

  this.updatedAt = new Date();
  
  return this;
};

// Method to archive conversation
conversationSchema.methods.archiveConversation = function(userId) {
  if (!this.archivedBy.includes(userId)) {
    this.archivedBy.push(userId);
    this.archivedAt.push(new Date());
  }

  if (this.archivedBy.length === this.participants.length) {
    this.isArchived = true;
    this.status = 'archived';
  }

  this.updatedAt = new Date();

  return this;
};

// Method to unarchive conversation
conversationSchema.methods.unarchiveConversation = function(userId) {
  const archivedIndex = this.archivedBy.findIndex(id => id.equals(userId));

  if (archivedIndex !== -1) {
    this.archivedBy.splice(archivedIndex, 1);
    this.archivedAt.splice(archivedIndex, 1);
  }

  if (this.archivedBy.length === 0) {
    this.isArchived = false;
    this.status = 'active';
  }

  this.updatedAt = new Date();

  return this;
};

// Method to mute conversation
conversationSchema.methods.muteConversation = function(userId, duration = null) {
  if (!this.mutedBy.includes(userId)) {
    this.mutedBy.push(userId);
    this.mutedAt.push(new Date());

    if (duration) {
      this.muteDuration.push(duration);
      this.muteExpiresAt.push(new Date(Date.now() + duration));
    } else {
      this.muteDuration.push(null);
      this.muteExpiresAt.push(null);
    }
  }

  this.isMuted = true;
  this.updatedAt = new Date();

  return this;
};

// Method to unmute conversation
conversationSchema.methods.unmuteConversation = function(userId) {
  const muteIndex = this.mutedBy.findIndex(id => id.equals(userId));

  if (muteIndex !== -1) {
    this.mutedBy.splice(muteIndex, 1);
    this.mutedAt.splice(muteIndex, 1);
    this.muteDuration.splice(muteIndex, 1);
    this.muteExpiresAt.splice(muteIndex, 1);
  }

  if (this.mutedBy.length === 0) {
    this.isMuted = false;
  }

  this.updatedAt = new Date();

  return this;
};

// Method to pin conversation
conversationSchema.methods.pinConversation = function(userId) {
  this.isPinned = true;
  this.pinnedAt = new Date();
  this.pinnedBy = userId;
  this.updatedAt = new Date();

  return this;
};

// Method to unpin conversation
conversationSchema.methods.unpinConversation = function() {
  this.isPinned = false;
  this.pinnedAt = null;
  this.pinnedBy = null;
  this.updatedAt = new Date();

  return this;
};

// Method to update last message
conversationSchema.methods.updateLastMessage = function(message, senderId) {
  this.lastMessage = message;
  this.lastMessageAt = new Date();
  this.lastMessageBy = senderId;
  this.messageCount += 1;
  this.updatedAt = new Date();

  return this;
};

// Method to add call to history
conversationSchema.methods.addCallRecord = function(callData) {
  this.callHistory.push({
    initiatorId: callData.initiatorId,
    recipientId: callData.recipientId,
    callType: callData.callType,
    startedAt: new Date(),
    status: 'ongoing'
  });

  if (callData.callType === 'video') {
    this.metadata.videoCallCount += 1;
  } else {
    this.metadata.audioCallCount += 1;
  }

  this.updatedAt = new Date();

  return this;
};

// Method to end call
conversationSchema.methods.endCall = function(callIndex, duration, quality = null) {
  if (callIndex >= 0 && callIndex < this.callHistory.length) {
    const call = this.callHistory[callIndex];
    call.endedAt = new Date();
    call.duration = duration;
    call.status = 'completed';
    call.callQuality = quality;

    this.metadata.totalDuration += duration;
  }

  this.updatedAt = new Date();

  return this;
};

// Method to add shared media
conversationSchema.methods.addSharedMedia = function(messageId, type, url, userId) {
  this.sharedMedia.push({
    messageId,
    type,
    url,
    sharedBy: userId,
    sharedAt: new Date()
  });

  this.metadata.mediaItemsShared += 1;
  this.updatedAt = new Date();

  return this;
};

// Method to add label
conversationSchema.methods.addLabel = function(label) {
  if (label === 'custom') {
    return; // Need to use addCustomLabel for custom labels
  }

  if (!this.labels.includes(label)) {
    this.labels.push(label);
    this.updatedAt = new Date();
  }

  return this;
};

// Method to add custom label
conversationSchema.methods.addCustomLabel = function(customLabel) {
  if (!this.customLabels.includes(customLabel)) {
    this.customLabels.push(customLabel);
    if (!this.labels.includes('custom')) {
      this.labels.push('custom');
    }
    this.updatedAt = new Date();
  }

  return this;
};

// Method to remove label
conversationSchema.methods.removeLabel = function(label) {
  const index = this.labels.indexOf(label);
  if (index > -1) {
    this.labels.splice(index, 1);
    this.updatedAt = new Date();
  }

  return this;
};

// Method to remove custom label
conversationSchema.methods.removeCustomLabel = function(customLabel) {
  const index = this.customLabels.indexOf(customLabel);
  if (index > -1) {
    this.customLabels.splice(index, 1);
    if (this.customLabels.length === 0 && this.labels.includes('custom')) {
      this.removeLabel('custom');
    }
    this.updatedAt = new Date();
  }

  return this;
};

// Method to add note
conversationSchema.methods.addNote = function(userId, content) {
  this.notes.push({
    userId,
    content,
    addedAt: new Date()
  });

  this.updatedAt = new Date();

  return this;
};

// Method to delete conversation
conversationSchema.methods.deleteConversation = function(userId) {
  if (!this.deletedBy.includes(userId)) {
    this.deletedBy.push(userId);
    this.deletedAt.push(new Date());
  }

  if (this.deletedBy.length === this.participants.length) {
    this.status = 'deleted';
  }

  this.updatedAt = new Date();

  return this;
};

// ==========================================
// STATICS
// ==========================================

// Static method to find conversation between users
conversationSchema.statics.findBetweenUsers = function(userId1, userId2) {
  return this.findOne({
    participants: {
      $all: [userId1,userId2],
      $size: 2
    }
  });
};

// Static method to find user's conversations
conversationSchema.statics.findUserConversations = function(userId, options = {}) {
  const {
    limit = 50,
    page = 1,
    status = 'active',
    onlyUnread = false,
    sortBy = 'lastMessageAt'
  } = options;

  const skip = (page - 1) * limit;

  let query = {
    participants: userId,
    status
  };

  if (onlyUnread) {
    query['unreadCounts.userId'] = userId;
    query['unreadCounts.count'] = { $gt: 0 };
  }

  const sortObj = {};
  if (sortBy === 'lastMessageAt') {
    sortObj.lastMessageAt = -1;
  } else if (sortBy === 'pinned') {
    sortObj.isPinned = -1;
    sortObj.lastMessageAt = -1;
  }

  return this.find(query)
    .sort(sortObj)
    .limit(parseInt(limit))
    .skip(skip)
    .populate('participants', 'firstName lastName profilePhoto');
};

// Static method to count unread conversations
conversationSchema.statics.countUnreadConversations = function(userId) {
  return this.countDocuments({
    participants: userId,
    'unreadCounts.userId': userId,
    'unreadCounts.count': { $gt: 0 }
  });
};

// Static method to search conversations
conversationSchema.statics.searchConversations = function(userId, keyword) {
  return this.find({
    participants: userId,
    lastMessage: { $regex: keyword, $options: 'i' }
  })
    .sort({ lastMessageAt: -1 });
};

// Static method to get pinned conversations
conversationSchema.statics.getPinnedConversations = function(userId) {
  return this.find({
    participants: userId,
    isPinned: true
  })
    .sort({ pinnedAt: -1 })
    .populate('participants', 'firstName lastName profilePhoto');
};

// Static method to get active conversations
conversationSchema.statics.getActiveConversations = function(userId) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  return this.find({
    participants: userId,
    lastMessageAt: { $gte: sevenDaysAgo }
  })
    .sort({ lastMessageAt: -1 });
};

// ==========================================
// MIDDLEWARE HOOKS
// ==========================================

// Update the updatedAt timestamp on every save
conversationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Validate participants count
conversationSchema.pre('save', function(next) {
  if (this.participants.length < 2) {
    throw new Error('Conversation must have at least 2 participants');
  }
  next();
});

// ==========================================
// MODEL EXPORT
// ==========================================

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;
