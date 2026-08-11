const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['user','admin','superadmin'], default: 'user' },
    gender: { type: String, enum: ['male','female','other'], default: 'other' },
    subscriptionPlan: { type: String, enum: ['basic','premium','gold'], default: 'basic' },
    status: { type: String, enum: ['active','inactive','suspended','deleted'], default: 'active' },
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isPremium: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
