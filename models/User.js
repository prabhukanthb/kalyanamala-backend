const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true,'Emailisrequired'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },

    phone: {
      type: String,
      required: [true,'Phoneisrequired'],
      unique: true,
      trim: true,
      index: true
    },

    firstName: {
      type: String,
      required: [true,'Firstnameisrequired'],
      trim: true
    },

    lastName: {
      type: String,
      required: [true,'Lastnameisrequired'],
      trim: true
    },

    surname: {
      type: String,
      trim: true,
      default: ''
    },

    profileId: {
      type: String,
      default: null
    },

    alternativePhone: {
      type: String,
      trim: true,
      default: null
    },

    password: {
      type: String,
      required: [true,'Passwordisrequired'],
      select: false
    },

    role: {
      type: String,
      enum: ['user','subadmin','admin'],
      default: 'user',
      index: true
    },

    status: {
      type: String,
      enum: ['active','inactive','suspended','deleted'],
      default: 'active',
      index: true
    },

    isActive: {
      type: Boolean,
      default: true
    },

    emailVerified: {
      type: Boolean,
      default: false
    },

    phoneVerified: {
      type: Boolean,
      default: false
    },

    passwordResetRequired: {
      type: Boolean,
      default: false
    },

    lastLoginAt: {
      type: Date,
      default: null
    },

    deletedAt: {
      type: Date,
      default: null
    },

    suspensionReason: {
      type: String,
      default: null
    },

    suspensionDuration: {
      type: String,
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
    }
  },
  {
    timestamps: true
  }
);

// Optional helpful indexes
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });

module.exports = mongoose.model('User', userSchema);
