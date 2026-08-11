// ==========================================
// PROFILE ROUTES
// New Kalyanamala Matrimony
// ==========================================

const express = require('express');
const router = express.Router();
const { body, validationResult, param } = require('express-validator');
const jwt = require('jsonwebtoken');

const Profile = require('../models/Profile');
const User = require('../models/User');

// ==========================================
// MIDDLEWARE
// ==========================================

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
    return res.status(401).json({
      error: 'Invalid token',
      message: 'Authentication failed'
    });
  }
};

// ==========================================
// VALIDATION RULES
// ==========================================

const createProfileValidation = [
  body('gender').isIn(['male','female','other']).withMessage('Invalid gender'),
  body('dateOfBirth').isISO8601().withMessage('Valid date is required'),
  body('height').matches(/^[0-9]{1,3}cm$/).withMessage('Height format: e.g., 170cm'),
  body('religion').trim().notEmpty().withMessage('Religion is required'),
  body('caste').trim().notEmpty().withMessage('Caste is required'),
  body('occupation').trim().notEmpty().withMessage('Occupation is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('state').trim().notEmpty().withMessage('State is required'),
  body('country').trim().notEmpty().withMessage('Country is required'),
  body('education').trim().notEmpty().withMessage('Education is required'),
  body('income').isNumeric().withMessage('Income must be numeric'),
  body('about').optional().trim().isLength({ max: 1000 }).withMessage('About must be max 1000 characters')
];

const updateProfileValidation = [
  body('gender').optional().isIn(['male','female','other']).withMessage('Invalid gender'),
  body('dateOfBirth').optional().isISO8601().withMessage('Valid date is required'),
  body('height').optional().matches(/^[0-9]{1,3}cm$/).withMessage('Height format: e.g., 170cm'),
  body('religion').optional().trim().notEmpty().withMessage('Religion is required'),
  body('caste').optional().trim().notEmpty().withMessage('Caste is required'),
  body('occupation').optional().trim().notEmpty().withMessage('Occupation is required'),
  body('city').optional().trim().notEmpty().withMessage('City is required'),
  body('state').optional().trim().notEmpty().withMessage('State is required'),
  body('country').optional().trim().notEmpty().withMessage('Country is required'),
  body('education').optional().trim().notEmpty().withMessage('Education is required'),
  body('income').optional().isNumeric().withMessage('Income must be numeric'),
  body('about').optional().trim().isLength({ max: 1000 }).withMessage('About must be max 1000 characters')
];

const searchValidation = [
  body('gender').optional().isIn(['male','female','other']).withMessage('Invalid gender'),
  body('ageFrom').optional().isInt({ min: 18, max: 100 }).withMessage('Age from must be 18-100'),
  body('ageTo').optional().isInt({ min: 18, max: 100 }).withMessage('Age to must be 18-100'),
  body('city').optional().trim().notEmpty().withMessage('City is required'),
  body('religion').optional().trim().notEmpty().withMessage('Religion is required'),
  body('incomeFrom').optional().isNumeric().withMessage('Income must be numeric'),
  body('incomeTo').optional().isNumeric().withMessage('Income must be numeric'),
  body('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  body('page').optional().isInt({ min: 1 }).withMessage('Page must be positive number')
];

// ==========================================
// POST /api/profiles
// Create new profile (Protected)
// ==========================================

router.post(
  '/',
  authMiddleware,
  createProfileValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array().map(e => e.msg)
        });
      }

      const existingProfile = await Profile.findOne({ userId: req.userId });
      if (existingProfile) {
        return res.status(400).json({
          error: 'Profile already exists',
          message: 'User can only have one profile'
        });
      }

      const {
        gender,
        dateOfBirth,
        height,
        religion,
        caste,
        occupation,
        city,
        state,
        country,
        education,
        income,
        about
      } = req.body;

      const profile = new Profile({
        userId: req.userId,
        gender,
        dateOfBirth,
        height,
        religion,
        caste,
        occupation,
        education,
        income,
        about: about || null,
        location: {
          city,
          state,
          country
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await profile.save();

      return res.status(201).json({
        message: 'Profile created successfully',
        profile: {
          id: profile._id,
          userId: profile.userId,
          gender: profile.gender,
          religion: profile.religion,
          caste: profile.caste,
          occupation: profile.occupation,
          city: profile.location.city,
          education: profile.education,
          income: profile.income,
          profileCompletion: profile.profileCompletion,
          isComplete: profile.isComplete
        }
      });
    } catch (error) {
      console.error('Create profile error:', error);
      return res.status(500).json({
        error: 'Failed to create profile',
        message: error.message
      });
    }
  }
);

// ==========================================
// GET /api/profiles/me
// Get current user's profile (Protected)
// ==========================================

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.userId })
      .populate('userId', 'email firstName lastName phone');

    if (!profile) {
      return res.status(404).json({
        error: 'Profile not found',
        message: 'Please create a profile first'
      });
    }

    return res.status(200).json({
      profile: {
        id: profile._id,
        user: profile.userId,
        gender: profile.gender,
        dateOfBirth: profile.dateOfBirth,
        height: profile.height,
        bodyType: profile.bodyType,
        complexion: profile.complexion,
        religion: profile.religion,
        caste: profile.caste,
        occupation: profile.occupation,
        location: profile.location,
        education: profile.education,
        income: profile.income,
        about: profile.about,
        photos: profile.photos,
        profileCompletion: profile.profileCompletion,
        isComplete: profile.isComplete,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt
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

// ==========================================
// GET /api/profiles/:id
// Get specific profile by ID
// ==========================================

router.get(
  '/:id',
  param('id').isMongoId().withMessage('Invalid profile ID'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array().map(e => e.msg)
        });
      }

      const profile = await Profile.findById(req.params.id)
        .populate('userId', 'email firstName lastName phone');

      if (!profile) {
        return res.status(404).json({
          error: 'Profile not found'
        });
      }

      return res.status(200).json({
        profile: {
          id: profile._id,
          user: profile.userId,
          gender: profile.gender,
          age: profile.age,
          height: profile.height,
          religion: profile.religion,
          caste: profile.caste,
          occupation: profile.occupation,
          location: profile.location,
          education: profile.education,
          income: profile.income,
          about: profile.about,
          photos: profile.photos,
          profileCompletion: profile.profileCompletion,
          isComplete: profile.isComplete
        }
      });
    } catch (error) {
      console.error('Get profile by ID error:', error);
      return res.status(500).json({
        error: 'Failed to fetch profile',
        message: error.message
      });
    }
  }
);

// ==========================================
// PUT /api/profiles/me
// Update current user's profile (Protected)
// ==========================================

router.put(
  '/me',
  authMiddleware,
  updateProfileValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array().map(e => e.msg)
        });
      }

      const profile = await Profile.findOne({ userId: req.userId });

      if (!profile) {
        return res.status(404).json({
          error: 'Profile not found'
        });
      }

      const {
        gender,
        dateOfBirth,
        height,
        bodyType,
        complexion,
        religion,
        caste,
        occupation,
        city,
        state,
        country,
        education,
        income,
        about
      } = req.body;

      if (gender !== undefined) profile.gender = gender;
      if (dateOfBirth !== undefined) profile.dateOfBirth = dateOfBirth;
      if (height !== undefined) profile.height = height;
      if (bodyType !== undefined) profile.bodyType = bodyType;
      if (complexion !== undefined) profile.complexion = complexion;
      if (religion !== undefined) profile.religion = religion;
      if (caste !== undefined) profile.caste = caste;
      if (occupation !== undefined) profile.occupation = occupation;
      if (education !== undefined) profile.education = education;
      if (income !== undefined) profile.income = income;
      if (about !== undefined) profile.about = about;

      if (city !== undefined) profile.location.city = city;
      if (state !== undefined) profile.location.state = state;
      if (country !== undefined) profile.location.country = country;

      profile.updatedAt = new Date();
      await profile.save();

      return res.status(200).json({
        message: 'Profile updated successfully',
        profile: {
          id: profile._id,
          gender: profile.gender,
          religion: profile.religion,
          caste: profile.caste,
          occupation: profile.occupation,
          city: profile.location.city,
          education: profile.education,
          income: profile.income,
          profileCompletion: profile.profileCompletion,
          isComplete: profile.isComplete,
          updatedAt: profile.updatedAt
        }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      return res.status(500).json({
        error: 'Failed to update profile',
        message: error.message
      });
    }
  }
);

// ==========================================
// DELETE /api/profiles/me
// Delete current user's profile (Protected)
// ==========================================

router.delete('/me', authMiddleware, async (req, res) => {
  try {
    const profile = await Profile.findOneAndDelete({ userId: req.userId });

    if (!profile) {
      return res.status(404).json({
        error: 'Profile not found'
      });
    }

    return res.status(200).json({
      message: 'Profile deleted successfully'
    });
  } catch (error) {
    console.error('Delete profile error:', error);
    return res.status(500).json({
      error: 'Failed to delete profile',
      message: error.message
    });
  }
});

// ==========================================
// POST /api/profiles/search
// Search profiles with filters
// ==========================================

router.post(
  '/search',
  searchValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array().map(e => e.msg)
        });
      }

      const {
        gender,
        ageFrom,
        ageTo,
        city,
        religion,
        incomeFrom,
        incomeTo,
        limit = 10,
        page = 1
      } = req.body;

      const query = {};

      if (gender) query.gender = gender;
      if (city) query['location.city'] = { $regex: city, $options: 'i' };
      if (religion) query.religion = { $regex: religion, $options: 'i' };

      if (ageFrom || ageTo) {
        query.dateOfBirth = {};
        if (ageFrom) {
          const fromDate = new Date();
          fromDate.setFullYear(fromDate.getFullYear() - Number(ageFrom));
          query.dateOfBirth.$lte = fromDate;
        }
        if (ageTo) {
          const toDate = new Date();
          toDate.setFullYear(toDate.getFullYear() - Number(ageTo));
          query.dateOfBirth.$gte = toDate;
        }
      }

      if (incomeFrom || incomeTo) {
        query.income = {};
        if (incomeFrom) query.income.$gte = Number(incomeFrom);
        if (incomeTo) query.income.$lte = Number(incomeTo);
      }

      const skip = (Number(page) - 1) * Number(limit);

      const profiles = await Profile.find(query)
        .limit(Number(limit))
        .skip(skip)
        .populate('userId', 'firstName lastName')
        .lean();

      const total = await Profile.countDocuments(query);

      return res.status(200).json({
        message: 'Search results',
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit))
        },
        profiles
      });
    } catch (error) {
      console.error('Search profiles error:', error);
      return res.status(500).json({
        error: 'Search failed',
        message: error.message
      });
    }
  }
);

// ==========================================
// POST /api/profiles/:id/view
// Mark profile as viewed
// ==========================================

router.post(
  '/:id/view',
  authMiddleware,
  param('id').isMongoId().withMessage('Invalid profile ID'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array().map(e => e.msg)
        });
      }

      const profile = await Profile.findById(req.params.id);
      if (!profile) {
        return res.status(404).json({
          error: 'Profile not found'
        });
      }

      profile.statistics.viewCount += 1;
      profile.statistics.lastViewedAt = new Date();
      await profile.save();

      return res.status(200).json({
        message: 'Profile view recorded'
      });
    } catch (error) {
      console.error('Mark view error:', error);
      return res.status(500).json({
        error: 'Failed to record view',
        message: error.message
      });
    }
  }
);

module.exports = router;
