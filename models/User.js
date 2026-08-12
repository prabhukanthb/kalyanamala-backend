const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    profileId: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },

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

    alternativePhone: {
      type: String,
      trim: true,
      default: null
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
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('User', userSchema);
