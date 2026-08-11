const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const User = require('../models/User');

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

const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').matches(/^[0-9]{10}$/).withMessage('Phone must be 10 digits'),
  body('firstName').trim().notEmpty().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
  body('lastName').trim().notEmpty().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/[A-Z]/).withMessage('Password must contain uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain number'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwords do not match');
    }
    return true;
  })
];

const loginValidation = [
  body('emailOrPhone').notEmpty().withMessage('Email or phone is required'),
  body('password').notEmpty().withMessage('Password is required')
];

router.post('/register', registerValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array().map(e => e.msg)
      });
    }

    const { email, phone, firstName, lastName, password } = req.body;

    const existingUser = await User.findOne({ $or: [{email},{phone}] });

    if (existingUser) {
      return res.status(400).json({
        error: 'User already exists',
        message: existingUser.email === email ? 'Email already registered' : 'Phone already registered'
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      parseInt(process.env.BCRYPT_ROUNDS || '10', 10)
    );

    const user = new User({
      email,
      phone,
      firstName,
      lastName,
      password: hashedPassword,
      role: 'user',
      gender: 'male',
      subscriptionPlan: 'basic',
      status: 'active',
      emailVerified: false,
      phoneVerified: false,
      isActive: true,
      isPremium: false
    });

    await user.save();

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

router.post('/login', loginValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array().map(e => e.msg)
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

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email/phone or password is incorrect'
      });
    }

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

router.post('/logout', authMiddleware, (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
      note: 'Client should clear localStorage token'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Logout failed',
      message: error.message
    });
  }
});

router.post(
  '/reset-password',
  body('email').isEmail().withMessage('Valid email is required'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array().map(e => e.msg)
        });
      }

      const { email } = req.body;
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(200).json({
          message: 'If email exists, password reset link has been sent'
        });
      }

      return res.status(200).json({
        message: 'Password reset link sent to email',
        note: 'Check your email for reset instructions'
      });
    } catch (error) {
      console.error('Password reset error:', error);
      return res.status(500).json({
        error: 'Password reset failed',
        message: error.message
      });
    }
  }
);

router.put(
  '/verify-email',
  body('email').isEmail().withMessage('Valid email is required'),
  body('otp').matches(/^[0-9]{6}$/).withMessage('OTP must be 6 digits'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array().map(e => e.msg)
        });
      }

      const { email } = req.body;
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          message: 'Email not registered'
        });
      }

      user.emailVerified = true;
      await user.save();

      return res.status(200).json({
        message: 'Email verified successfully'
      });
    } catch (error) {
      console.error('Email verification error:', error);
      return res.status(500).json({
        error: 'Email verification failed',
        message: error.message
      });
    }
  }
);

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        gender: user.gender,
        isPremium: user.isPremium
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      error: 'Failed to fetch profile',
      message: error.message
    });
  }
});

router.put(
  '/change-password',
  authMiddleware,
  body('oldPassword').notEmpty().withMessage('Old password is required'),
  body('newPassword')
    .isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
    .matches(/[A-Z]/).withMessage('New password must contain uppercase letter')
    .matches(/[0-9]/).withMessage('New password must contain number'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('Passwords do not match');
    }
    return true;
  }),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array().map(e => e.msg)
        });
      }

      const { oldPassword, newPassword } = req.body;
      const user = await User.findById(req.userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({
          error: 'Invalid password',
          message: 'Old password is incorrect'
        });
      }

      const hashedPassword = await bcrypt.hash(
        newPassword,
        parseInt(process.env.BCRYPT_ROUNDS || '10', 10)
      );

      user.password = hashedPassword;
      user.updatedAt = new Date();
      await user.save();

      return res.status(200).json({
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Change password error:', error);
      return res.status(500).json({
        error: 'Failed to change password',
        message: error.message
      });
    }
  }
);

router.delete(
  '/delete-account',
  authMiddleware,
  body('password').notEmpty().withMessage('Password required for confirmation'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array().map(e => e.msg)
        });
      }

      const { password } = req.body;
      const user = await User.findById(req.userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({
          error: 'Invalid password',
          message: 'Password is incorrect'
        });
      }

      user.status = 'deleted';
      user.deletedAt = new Date();
      await user.save();

      return res.status(200).json({
        message: 'Account deleted successfully'
      });
    } catch (error) {
      console.error('Delete account error:', error);
      return res.status(500).json({
        error: 'Failed to delete account',
        message: error.message
      });
    }
  }
);

module.exports = router;
