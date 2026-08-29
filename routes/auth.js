const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const User = require('../models/User');
const Profile = require('../models/Profile');

// =========================
// AUTH MIDDLEWARE
// =========================
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : null;

    if (!token) {
      return res.status(401).json({
        error: 'No token provided',
        message: 'Authorization token is required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Please login again'
      });
    }

    return res.status(401).json({
      error: 'Invalid token',
      message: 'Authentication failed'
    });
  }
};

// =========================
// VALIDATION
// =========================
const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').matches(/^[0-9]{10}$/).withMessage('Phone must be 10 digits'),
  body('firstName').trim().notEmpty().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
  body('lastName').trim().notEmpty().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('confirmPassword').custom((value, { req }) => value === req.body.password).withMessage('Passwords do not match')
];

const loginValidation = [
  body('emailOrPhone').notEmpty().withMessage('Email or phone is required'),
  body('password').notEmpty().withMessage('Password is required')
];

// =========================
// REGISTER
// =========================
router.post('/register', registerValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array().map((e) => e.msg)
      });
    }

    const {
      email,
      phone,
      firstName,
      lastName,
      password,
      role
    } = req.body;

    const existingUser = await User.findOne({
      $or: [{email},{phone}]
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'User already exists',
        message: existingUser.email === email
          ? 'Email already registered'
          : 'Phone already registered'
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      parseInt(process.env.BCRYPT_ROUNDS || '10', 10)
    );

    const user = await User.create({
      email,
      phone,
      firstName,
      lastName,
      password: hashedPassword,
      role: role || 'user',
      status: 'active',
      isActive: true
    });

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: `${process.env.JWT_EXPIRY || 30}d` }
    );

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      error: 'Registration failed',
      message: error.message
    });
  }
});

// =========================
// LOGIN
// =========================
router.post('/login', loginValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array().map((e) => e.msg)
      });
    }

    const { emailOrPhone, password } = req.body;

    const user = await User.findOne({
      $or: [
        { email: emailOrPhone },
        { phone: emailOrPhone }
      ]
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email/phone or password is incorrect'
      });
    }

    if (user.status === 'deleted') {
      return res.status(403).json({
        error: 'Account deleted',
        message: 'This account has been deleted'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email/phone or password is incorrect'
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: `${process.env.JWT_EXPIRY || 30}d` }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Login failed',
      message: error.message
    });
  }
});

// =========================
// LOGOUT
// =========================
router.post('/logout', authMiddleware, (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

// =========================
// CURRENT USER
// =========================
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch user',
      message: error.message
    });
  }
});

// =========================
// CHANGE PASSWORD
// =========================
router.put(
  '/change-password',
  authMiddleware,
  body('oldPassword').notEmpty().withMessage('Old password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  body('confirmPassword').custom((value, { req }) => value === req.body.newPassword).withMessage('Passwords do not match'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array().map((e) => e.msg)
        });
      }

      const { oldPassword, newPassword } = req.body;

      const user = await User.findById(req.userId).select('+password');
      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          error: 'Invalid password',
          message: 'Old password is incorrect'
        });
      }

      user.password = await bcrypt.hash(
        newPassword,
        parseInt(process.env.BCRYPT_ROUNDS || '10', 10)
      );

      user.passwordResetRequired = false;
      await user.save();

      return res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Failed to change password',
        message: error.message
      });
    }
  }
);

// =========================
// RESET PASSWORD
// =========================
router.post(
  '/reset-password',
  body('emailOrPhone').notEmpty().withMessage('Email or phone is required'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array().map((e) => e.msg)
        });
      }

      const { emailOrPhone } = req.body;

      const user = await User.findOne({
        $or: [{email:emailOrPhone},{phone:emailOrPhone}]
      });

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          message: 'No user found with that email or phone'
        });
      }

      // Simple reset format: KM-FIRST-LAST4
      const firstNamePart = (user.firstName || 'USER').replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 4).padEnd(4, 'X');
      const last4Phone = (user.phone || '').slice(-4);
      const newPassword = `KM-${firstNamePart}-${last4Phone}`;

      user.password = await bcrypt.hash(
        newPassword,
        parseInt(process.env.BCRYPT_ROUNDS || '10', 10)
      );
      user.passwordResetRequired = true;
      await user.save();

      return res.status(200).json({
        success: true,
        message: 'Password reset successfully'
        newPassword
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Password reset failed',
        message: error.message
      });
    }
  }
);

module.exports = router;
