const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const User = require('../models/User');

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (!token) {
      return res.status(401).json({ error: 'No token provided', message: 'Authorization token is required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token', message: 'Authentication failed' });
  }
};

const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('phone').matches(/^[0-9]{10}$/),
  body('firstName').trim().notEmpty(),
  body('lastName').trim().notEmpty(),
  body('password').isLength({ min: 6 }),
  body('confirmPassword').custom((value, { req }) => value === req.body.password)
];

const loginValidation = [
  body('emailOrPhone').notEmpty(),
  body('password').notEmpty()
];

router.post('/register', registerValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array().map(e => e.msg) });
    }

    const { email, phone, firstName, lastName, password } = req.body;
    const existing = await User.findOne({ $or: [{email},{phone}] });
    if (existing) {
      return res.status(400).json({ error: 'User already exists', message: 'Email or phone already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS || '10', 10));

    const user = await User.create({
      email,
      phone,
      firstName,
      lastName,
      password: hashedPassword
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
    return res.status(500).json({ success: false, error: 'Registration failed', message: error.message });
  }
});

router.post('/login', loginValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array().map(e => e.msg) });
    }

    const { emailOrPhone, password } = req.body;
    const user = await User.findOne({
      $or: [{email:emailOrPhone},{phone:emailOrPhone}]
    }).select('+password');

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials', message: 'Email/phone or password is incorrect' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials', message: 'Email/phone or password is incorrect' });
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
    return res.status(500).json({ success: false, error: 'Login failed', message: error.message });
  }
});

router.post('/logout', authMiddleware, (req, res) => {
  return res.status(200).json({ success: true, message: 'Logged out successfully' });
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch profile', message: error.message });
  }
});

module.exports = router;
