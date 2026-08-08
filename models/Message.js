// ==========================================
// MESSAGE MODEL
// New Kalyanamala Matrimony
// ==========================================

const mongoose = require('mongoose');

// ==========================================
// MESSAGE SCHEMA
// ==========================================

const messageSchema = new mongoose.Schema(
  {
    // ==========================================
    // CONVERSATION REFERENCE
    // ==========================================

    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: [true,'ConversationIDisrequired'],
      index: true
    },

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
    // MESSAGE CONTENT
    // ==========================================

    content: {
      type: String,
      required: [true,'Messagecontentisrequired'],
      trim: true,
      minlength: [1,'Messagecannotbeempty'],
      maxlength: [5000,'Messagecannotexceed5000characters']
    },

    // ==========================================
    // MESSAGE TYPE
    // ==========================================

    type: {
      type: String,
      enum: {
        values: ['text','image','document','audio','video'],
        message: 'Message type must be text, image, document, audio, or video'
      },
      default: 'text'
    },

    // ==========================================
    // ATTACHMENTS
    // ==========================================

    attachments: [
      {
        url: {
          type: String,
          required: true
        },

        type: {
          type: String,
          enum: ['image','document','audio','video'],
          required: true
        },

        fileName: String,

        fileSize: Number, // in bytes

        mimeType: String,

        duration: Number, // for audio/video in seconds

        thumbnail: String, // for images and videos

        uploadedAt: {
          type: Date,
          default: Date.now
        },

        isVerified: {
          type: Boolean,
          default: false
        }
      }
    ],

    // ==========================================
    // MESSAGE STATUS
    // ==========================================

    status: {
      type: String,
      enum: {
        values: ['sent','delivered','read'],
        message: 'Status must be sent, delivered, or read'
      },
      default: 'sent',
      index: true
    },

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
    // MESSAGE DELIVERY
    // ==========================================

    deliveredAt: Date,

    failureReason: String,

    retryCount: {
      type: Number,
      default: 0,
      max: 3
    },

    // ==========================================
    // REACTIONS & EMOJIS
    // ==========================================

    reactions: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },

        emoji: {
          type: String,
          required: true,
          enum: ['👍','❤️','😂','😮','😢','😡','🔥','👏']
        },

        addedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],

    // ==========================================
    // REPLIES (THREADING)
    // ==========================================

    replyToMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null
    },

    replyToContent: String, // cached content for display

    replyCount: {
      type: Number,
      default: 0
    },

    // ==========================================
    // EDIT HISTORY
    // ==========================================

    isEdited: {
      type: Boolean,
      default: false
    },

    editedAt: Date,

    editHistory: [
      {
        previousContent: String,

        editedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],

    // ==========================================
    // DELETION
    // ==========================================

    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    },

    deletedBy: {
      type: String,
      enum: ['sender','recipient','admin'],
      default: null
    },

    deletedAt: Date,

    // ==========================================
    // FORWARD INFORMATION
    // ==========================================

    isForwarded: {
      type: Boolean,
      default: false
    },

    forwardedFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null
    },

    forwardedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    // ==========================================
    // IMPORTANT/PINNED
    // ==========================================

    isImportant: {
      type: Boolean,
      default: false
    },

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
    // METADATA
    // ==========================================

    metadata: {
      sender: {
        firstName: String,
        lastName: String,
        profilePhoto: String
      },

      recipient: {
        firstName: String,
        lastName: String,
        profilePhoto: String
      },

      platform: {
        type: String,
        enum: ['web','mobile_ios','mobile_android','desktop'],
        default: 'web'
      },

      ipAddress: String,

      userAgent: String
    },

    // ==========================================
    // ENCRYPTION (FOR PRIVACY)
    // ==========================================

    isEncrypted: {
      type: Boolean,
      default: false
    },

    encryptionKey: {
      type: String,
      select: false
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

// Conversation index
messageSchema.index({ conversationId: 1 });

// Sender index
messageSchema.index({ senderId: 1 });

// Recipient index
messageSchema.index({ recipientId: 1 });

// Status index
messageSchema.index({ status: 1 });

// Read status index
messageSchema.index({ isRead: 1 });

// Deleted flag index
messageSchema.index({ isDeleted: 1 });

// Created date index (for sorting)
messageSchema.index({ createdAt: -1 });

// Compound index for conversation and date
messageSchema.index({ conversationId: 1, createdAt: -1 });

// Compound index for unread messages
messageSchema.index({ conversationId: 1, recipientId: 1, isRead: 1 });

// Reply threading index
messageSchema.index({ replyToMessageId: 1 });

// TTL Index for auto-deleting old messages (optional)
// messageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

// ==========================================
// VIRTUAL FIELDS
// ==========================================

// Time since sent
messageSchema.virtual('timeSinceSent').get(function() {
  const seconds = Math.floor((Date.now() - this.createdAt.getTime()) / 1000);
  
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
});

// Is recent (within 1 hour)
messageSchema.virtual('isRecent').get(function() {
  return Date.now() - this.createdAt.getTime() < 3600000; // 1 hour
});

// Has attachments
messageSchema.virtual('hasAttachments').get(function() {
  return this.attachments && this.attachments.length > 0;
});

// Total reactions count
messageSchema.virtual('totalReactions').get(function() {
  return this.reactions ? this.reactions.length : 0;
});

// ==========================================
// METHODS
// ==========================================

// Method to mark as read
messageSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.status = 'read';
  this.readAt = new Date();
  this.updatedAt = new Date();
  
  return this;
};

// Method to mark as delivered
messageSchema.methods.markAsDelivered = function() {
  if (this.status === 'sent') {
    this.status = 'delivered';
    this.deliveredAt = new Date();
    this.updatedAt = new Date();
  }
  
  return this;
};

// Method to edit message
messageSchema.methods.editMessage = function(newContent) {
  if (this.isDeleted) {
    throw new Error('Cannot edit deleted message');
  }

  // Check if message is older than 1 hour
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  if (this.createdAt < hourAgo) {
    throw new Error('Messages can only be edited within 1 hour of sending');
  }

  // Save previous content to history
  this.editHistory.push({
    previousContent: this.content,
    editedAt: new Date()
  });

  this.content = newContent;
  this.isEdited = true;
  this.editedAt = new Date();
  this.updatedAt = new Date();

  return this;
};

// Method to soft delete message
messageSchema.methods.deleteMessage = function(deletedBy = 'sender') {
  if (this.isDeleted) {
    throw new Error('Message already deleted');
  }

  this.isDeleted = true;
  this.deletedBy = deletedBy;
  this.deletedAt = new Date();
  this.content = '[Messagedeleted]';
  this.attachments = [];
  this.updatedAt = new Date();

  return this;
};

// Method to restore deleted message (admin only)
messageSchema.methods.restoreMessage = function() {
  if (!this.isDeleted) {
    throw new Error('Message is not deleted');
  }

  this.isDeleted = false;
  this.deletedBy = null;
  this.deletedAt = null;
  this.updatedAt = new Date();

  return this;
};

// Method to add reaction
messageSchema.methods.addReaction = function(userId, emoji) {
  const validEmojis = ['👍','❤️','😂','😮','😢','😡','🔥','👏'];
  
  if (!validEmojis.includes(emoji)) {
    throw new Error('Invalid emoji reaction');
  }

  // Check if user already reacted with this emoji
  const existingReaction = this.reactions.find(
    r => r.userId.equals(userId) && r.emoji === emoji
  );

  if (existingReaction) {
    throw new Error('You already added this reaction');
  }

  // Check if user reacted with different emoji (remove old one)
  this.reactions = this.reactions.filter(r => !r.userId.equals(userId));

  this.reactions.push({
    userId,
    emoji,
    addedAt: new Date()
  });

  this.updatedAt = new Date();

  return this;
};

// Method to remove reaction
messageSchema.methods.removeReaction = function(userId, emoji) {
  this.reactions = this.reactions.filter(
    r => !(r.userId.equals(userId) && r.emoji === emoji)
  );

  this.updatedAt = new Date();

  return this;
};

// Method to get reactions grouped by emoji
messageSchema.methods.getReactionsSummary = function() {
  const summary = {};

  this.reactions.forEach(reaction => {
    if (!summary[reaction.emoji]) {
      summary[reaction.emoji] = {
        emoji: reaction.emoji,
        count: 0,
        users: []
      };
    }
    summary[reaction.emoji].count += 1;
    summary[reaction.emoji].users.push(reaction.userId);
  });

  return Object.values(summary);
};

// Method to add attachment
messageSchema.methods.addAttachment = function(attachment) {
  if (!attachment.url || !attachment.type) {
    throw new Error('Attachment must have url and type');
  }

  this.attachments.push({
    url: attachment.url,
    type: attachment.type,
    fileName: attachment.fileName,
    fileSize: attachment.fileSize,
    mimeType: attachment.mimeType,
    duration: attachment.duration,
    thumbnail: attachment.thumbnail,
    uploadedAt: new Date()
  });

  // Update message type
  if (this.type === 'text' && this.attachments.length > 0) {
    this.type = attachment.type;
  }

  this.updatedAt = new Date();

  return this;
};

// Method to remove attachment
messageSchema.methods.removeAttachment = function(url) {
  this.attachments = this.attachments.filter(a => a.url !== url);
  this.updatedAt = new Date();

  return this;
};

// Method to pin message
messageSchema.methods.pinMessage = function(userId) {
  this.isPinned = true;
  this.pinnedAt = new Date();
  this.pinnedBy = userId;
  this.updatedAt = new Date();

  return this;
};

// Method to unpin message
messageSchema.methods.unpinMessage = function() {
  this.isPinned = false;
  this.pinnedAt = null;
  this.pinnedBy = null;
  this.updatedAt = new Date();

  return this;
};

// Method to mark as important
messageSchema.methods.markAsImportant = function() {
  this.isImportant = true;
  this.updatedAt = new Date();

  return this;
};

// Method to unmark as important
messageSchema.methods.unmarkAsImportant = function() {
  this.isImportant = false;
  this.updatedAt = new Date();

  return this;
};

// Method to get message for display (respects permissions)
messageSchema.methods.getForDisplay = function(userId) {
  if (this.isDeleted && !userId.equals(this.senderId) && !userId.equals(this.recipientId)) {
    return null;
  }

  return {
    id: this._id,
    conversationId: this.conversationId,
    senderId: this.senderId,
    recipientId: this.recipientId,
    content: this.isDeleted ? '[Messagedeleted]' : this.content,
    type: this.type,
    attachments: this.attachments,
    status: this.status,
    isRead: this.isRead,
    reactions: this.getReactionsSummary(),
    replyToMessageId: this.replyToMessageId,
    replyToContent: this.replyToContent,
    replyCount: this.replyCount,
    isEdited: this.isEdited,
    editedAt: this.editedAt,
    isDeleted: this.isDeleted,
    isImportant: this.isImportant,
    isPinned: this.isPinned,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    timeSinceSent: this.timeSinceSent
  };
};

// ==========================================
// STATICS
// ==========================================

// Static method to find conversation messages
messageSchema.statics.findConversationMessages = function(conversationId, limit = 50, page = 1) {
  const skip = (page - 1) * limit;

  return this.find({
    conversationId,
    isDeleted: false
  })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(skip)
    .populate('senderId', 'firstName lastName profilePhoto')
    .populate('recipientId', 'firstName lastName profilePhoto');
};

// Static method to find unread messages for user
messageSchema.statics.findUnreadMessages = function(userId, conversationId = null) {
  const query = {
    recipientId: userId,
    isRead: false,
    isDeleted: false
  };

  if (conversationId) {
    query.conversationId = conversationId;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .populate('senderId', 'firstName lastName profilePhoto');
};

// Static method to count unread messages
messageSchema.statics.countUnreadMessages = function(userId, conversationId = null) {
  const query = {
    recipientId: userId,
    isRead: false,
    isDeleted: false
  };

  if (conversationId) {
    query.conversationId = conversationId;
  }

  return this.countDocuments(query);
};

// Static method to search messages
messageSchema.statics.searchMessages = function(conversationId, keyword) {
  return this.find({
    conversationId,
    content: { $regex: keyword, $options: 'i' },
    isDeleted: false
  })
    .sort({ createdAt: -1 })
    .limit(50);
};

// Static method to get pinned messages
messageSchema.statics.getPinnedMessages = function(conversationId) {
  return this.find({
    conversationId,
    isPinned: true,
    isDeleted: false
  })
    .sort({ pinnedAt: -1 });
};

// Static method to get message thread (replies)
messageSchema.statics.getMessageThread = function(messageId) {
  return this.find({
    replyToMessageId: messageId,
    isDeleted: false
  })
    .sort({ createdAt: 1 })
    .populate('senderId', 'firstName lastName profilePhoto');
};

// Static method to get important messages
messageSchema.statics.getImportantMessages = function(conversationId) {
  return this.find({
    conversationId,
    isImportant: true,
    isDeleted: false
  })
    .sort({ createdAt: -1 });
};

// Static method to get user's messages in a time range
messageSchema.statics.getMessagesByDateRange = function(conversationId, fromDate, toDate) {
  return this.find({
    conversationId,
    createdAt: {
      $gte: fromDate,
      $lte: toDate
    },
    isDeleted: false
  })
    .sort({ createdAt: 1 });
};

// ==========================================
// MIDDLEWARE HOOKS
// ==========================================

// Update the updatedAt timestamp on every save
messageSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Prevent sending message to self
messageSchema.pre('save