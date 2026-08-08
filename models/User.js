// ==========================================
// USER MODEL
// New Kalyanamala Matrimony
// ==========================================

const mongoose = require('mongoose');

// ==========================================
// USER SCHEMA
// ==========================================

const userSchema = new mongoose.Schema(
  {
    // ==========================================
    // BASIC INFORMATION
    // ==========================================
    
    email: {
      type: String,
      required: [true,'Emailisrequired'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email'
      ]
    },

    phone: {
      type: String,
      required: [true,'Phonenumberisrequired'],
      unique: true,
      match: [/^[0-9]{10}$/, 'Phone must be 10 digits']
    },

    firstName: {
      type: String,
      required: [true,'Firstnameisrequired'],
      trim: true,
      minlength: [2,'Firstnamemustbeatleast2characters'],
      maxlength: [50,'Firstnamecannotexceed50characters']
    },

    lastName: {
      type: String,
      required: [true,'Lastnameisrequired'],
      trim: true,
      minlength: [2,'Lastnamemustbeatleast2characters'],
      maxlength: [50,'Lastnamecannotexceed50characters']
    },

    // ==========================================
    // AUTHENTICATION
    // ==========================================

    password: {
      type: String,
      required: [true,'Passwordisrequired'],
      minlength: [6,'Passwordmustbeatleast6characters'],
      select: false // Don't return password by default
    },

    // ==========================================
    // VERIFICATION
    // ==========================================

    emailVerified: {
      type: Boolean,
      default: false
    },

    emailVerificationToken: {
      type: String,
      select: false
    },

    emailVerificationTokenExpiry: {
      type: Date,
      select: false
    },

    phoneVerified: {
      type: Boolean,
      default: false
    },

    phoneOtp: {
      type: String,
      select: false
    },

    phoneOtpExpiry: {
      type: Date,
      select: false
    },

    // ==========================================
    // ACCOUNT INFORMATION
    // ==========================================

    role: {
      type: String,
      enum: {
        values: ['user','admin','superadmin'],
        message: 'Role must be user, admin, or superadmin'
      },
      default: 'user'
    },

    status: {
      type: String,
      enum: {
        values: ['active','inactive','suspended','deleted'],
        message: 'Status must be active, inactive, suspended, or deleted'
      },
      default: 'active'
    },

    isActive: {
      type: Boolean,
      default: true
    },

    // ==========================================
    // SUSPENSION INFORMATION
    // ==========================================

    suspensionReason: {
      type: String,
      default: null
    },

    suspensionEndDate: {
      type: Date,
      default: null
    },

    suspendedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    suspendedAt: {
      type: Date,
      default: null
    },

    // ==========================================
    // DELETION INFORMATION
    // ==========================================

    deletionReason: {
      type: String,
      default: null
    },

    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    deletedAt: {
      type: Date,
      default: null
    },

    // ==========================================
    // PROFILE REFERENCE
    // ==========================================

    profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      default: null
    },

    // ==========================================
    // LOGIN TRACKING
    // ==========================================

    lastLogin: {
      type: Date,
      default: null
    },

    lastLoginIp: {
      type: String,
      default: null
    },

    loginAttempts: {
      type: Number,
      default: 0
    },

    lockUntil: {
      type: Date,
      default: null
    },

    // ==========================================
    // PREFERENCES
    // ==========================================

    preferences: {
      language: {
        type: String,
        default: 'en',
        enum: ['en','hi','ta','te','mr','gu']
      },

      theme: {
        type: String,
        default: 'light',
        enum: ['light','dark']
      },

      timezone: {
        type: String,
        default: 'Asia/Kolkata'
      },

      newsletter: {
        type: Boolean,
        default: true
      }
    },

    // ==========================================
    // ADDITIONAL INFORMATION
    // ==========================================

    profilePhoto: {
      type: String,
      default: null
    },

    bio: {
      type: String,
      maxlength: [500,'Biocannotexceed500characters'],
      default: null
    },

    dateOfBirth: {
      type: Date,
      default: null
    },

    gender: {
      type: String,
      enum: {
        values: ['male','female','other'],
        message: 'Gender must be male, female, or other'
      },
      default: null
    },

    // ==========================================
    // SOCIAL LINKS
    // ==========================================

    socialLinks: {
      facebook: String,
      instagram: String,
      linkedin: String,
      twitter: String
    },

    // ==========================================
    // CONTACT INFORMATION
    // ==========================================

    alternatePhone: String,

    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      postalCode: String
    },

    // ==========================================
    // PRIVACY SETTINGS
    // ==========================================

    privacy: {
      profileVisibility: {
        type: String,
        default: 'everyone',
        enum: ['everyone','connections','verified_only','private']
      },

      showPhone: {
        type: Boolean,
        default: false
      },

      showEmail: {
        type: Boolean,
        default: false
      },

      allowMessages: {
        type: Boolean,
        default: true
      }
    },

    // ==========================================
    // VERIFICATION DOCUMENTS
    // ==========================================

    documents: [
      {
        type: {
          type: String,
          enum: ['aadhar','pan','driving_license','passport','voter_id'],
          required: true
        },
        documentUrl: String,
        isVerified: {
          type: Boolean,
          default: false
        },
        verifiedAt: Date,
        verifiedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        }
      }
    ],

    // ==========================================
    // TOKENS
    // ==========================================

    passwordResetToken: {
      type: String,
      select: false
    },

    passwordResetTokenExpiry: {
      type: Date,
      select: false
    },

    refreshToken: {
      type: String,
      select: false
    },

    // ==========================================
    // STATISTICS
    // ==========================================

    statistics: {
      totalConnections: {
        type: Number,
        default: 0
      },

      totalProfileViews: {
        type: Number,
        default: 0
      },

      totalLikes: {
        type: Number,
        default: 0
      },

      totalMessages: {
        type: Number,
        default: 0
      }
    },

    // ==========================================
    // PREMIUM/SUBSCRIPTION
    // ==========================================

    isPremium: {
      type: Boolean,
      default: false
    },

    premiumExpiresAt: {
      type: Date,
      default: null
    },

    subscriptionPlan: {
      type: String,
      enum: ['basic','gold','platinum','diamond'],
      default: null
    },

    // ==========================================
    // DEVICE TOKENS (FOR PUSH NOTIFICATIONS)
    // ==========================================

    deviceTokens: [
      {
        token: String,
        device: String, // ios, android, web
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
    timestamps: false // We're managing timestamps manually
  }
);

// ==========================================
// INDEXES
// ==========================================

// Index for email lookups
userSchema.index({ email: 1 });

// Index for phone lookups
userSchema.index({ phone: 1 });

// Index for status
userSchema.index({ status: 1 });

// Index for role
userSchema.index({ role: 1 });

// Index for premium status
userSchema.index({ isPremium: 1 });

// Index for created date (for sorting)
userSchema.index({ createdAt: -1 });

// TTL Index for OTP expiry cleanup
userSchema.index({ phoneOtpExpiry: 1 }, { expireAfterSeconds: 0 });

// TTL Index for reset token expiry cleanup
userSchema.index(
  { passwordResetTokenExpiry: 1 },
  { expireAfterSeconds: 0, sparse: true }
);

// ==========================================
// VIRTUAL FIELDS
// ==========================================

// Full name virtual
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// User age virtual
userSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  let age = today.getFullYear() - this.dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - this.dateOfBirth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < this.dateOfBirth.getDate())) {
    age--;
  }
  
  return age;
});

// Account age in days
userSchema.virtual('accountAgeDays').get(function() {
  const today = new Date();
  return Math.floor((today - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Is account locked
userSchema.virtual('isLocked').get(function() {
  return this.lockUntil && this.lockUntil > Date.now();
});

// ==========================================
// METHODS
// ==========================================

// Method to compare password
userSchema.methods.comparePassword = function(enteredPassword) {
  const bcrypt = require('bcryptjs');
  return bcrypt.compareSync(enteredPassword, this.password);
};

// Method to get public profile
userSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    email: this.email,
    firstName: this.firstName,
    lastName: this.lastName,
    fullName: this.fullName,
    phone: this.phoneVerified ? this.phone : null,
    profilePhoto: this.profilePhoto,
    bio: this.bio,
    gender: this.gender,
    age: this.age,
    isPremium: this.isPremium,
    createdAt: this.createdAt,
    statistics: this.statistics
  };
};

// Method to check if account is suspended
userSchema.methods.isSuspended = function() {
  if (this.status !== 'suspended') return false;
  if (!this.suspensionEndDate) return true;
  return this.suspensionEndDate > new Date();
};

// Method to check if account is deleted
userSchema.methods.isDeleted = function() {
  return this.status === 'deleted';
};

// Method to lock account
userSchema.methods.lockAccount = function() {
  this.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
  this.loginAttempts = 0;
};

// Method to unlock account
userSchema.methods.unlockAccount = function() {
  this.lockUntil = null;
  this.loginAttempts = 0;
};

// Method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
  if (this.lockUntil && this.lockUntil <= Date.now()) {
    return this.unlockAccount();
  }

  this.loginAttempts += 1;

  if (this.loginAttempts >= 5) {
    return this.lockAccount();
  }

  return this;
};

// Method to record successful login
userSchema.methods.recordSuccessfulLogin = function(ip = null) {
  this.lastLogin = new Date();
  this.lastLoginIp = ip;
  this.loginAttempts = 0;
  this.lockUntil = null;
  this.isActive = true;
};

// Method to update statistics
userSchema.methods.updateStatistics = function(type, increment = 1) {
  if (['totalConnections','totalProfileViews','totalLikes','totalMessages'].includes(type)) {
    this.statistics[type] += increment;
  }
};

// ==========================================
// STATICS
// ==========================================

// Static method to find by email or phone
userSchema.statics.findByEmailOrPhone = function(emailOrPhone) {
  return this.findOne({
    $or: [
      { email: emailOrPhone.toLowerCase() },
      { phone: emailOrPhone }
    ]
  });
};

// Static method to find by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find by phone
userSchema.statics.findByPhone = function(phone) {
  return this.findOne({ phone });
};

// Static method to find active admins
userSchema.statics.findActiveAdmins = function() {
  return this.find({
    role: { $in: ['admin','superadmin'] },
    status: 'active'
  });
};

// Static method to count by status
userSchema.statics.countByStatus = function() {
  return this.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
};

// ==========================================
// MIDDLEWARE HOOKS
// ==========================================

// Hash password before saving (only if modified)
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS || 10));
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Update the updatedAt timestamp on every save
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Prevent sensitive data from being returned
userSchema.post('find', function(docs) {
  if (!Array.isArray(docs)) return;

  docs.forEach(doc => {
    if (doc.password) doc.password = undefined;
    if (doc.emailVerificationToken) doc.emailVerificationToken = undefined;
    if (doc.phoneOtp) doc.phoneOtp = undefined;
  });
});

userSchema.post('findOne', function(doc) {
  if (doc && doc.password) doc.password = undefined;
  if (doc && doc.emailVerificationToken) doc.emailVerificationToken = undefined;
  if (doc && doc.phoneOtp) doc.phoneOtp = undefined;
});

// ==========================================
// MODEL EXPORT
// ==========================================

const User = mongoose.model('User', userSchema);

module.exports = User;
