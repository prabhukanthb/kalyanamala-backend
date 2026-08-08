// ==========================================
// PROFILE ROUTES
// New Kalyanamala Matrimony
// ==========================================

const express = require('express');
const router = express.Router();
const { body, validationResult, param } = require('express-validator');

// Import Models (will be created later)
// const Profile = require('../models/Profile');
// const User = require('../models/User');

// ==========================================
// MIDDLEWARE
// ==========================================

// Auth Middleware - Verify JWT Token
const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        error: 'No token provided',
        message: 'Authorization token is required'
      });
    }

    const jwt = require('jsonwebtoken');
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
  body('gender').isIn(['male','female']).withMessage('Invalid gender'),
  body('dateOfBirth').isISO8601().withMessage('Valid date is required'),
  body('height').matches(/^[0-9]{1,3}cm$/).withMessage('Height format: e.g., 170cm'),
  body('religion').trim().notEmpty().withMessage('Religion is required'),
  body('caste').trim().notEmpty().withMessage('Caste is required'),
  body('occupation').trim().notEmpty().withMessage('Occupation is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('state').trim().notEmpty().withMessage('State is required'),
  body('country').trim().notEmpty().withMessage('Country is required'),
  body('education').trim().notEmpty().withMessage('Education is required'),
  body('income').matches(/^[0-9]+$/).withMessage('Income must be numeric'),
  body('about').trim().isLength({ max: 500 }).withMessage('About must be max 500 characters')
];

const updateProfileValidation = [
  body('gender').optional().isIn(['male','female']).withMessage('Invalid gender'),
  body('dateOfBirth').optional().isISO8601().withMessage('Valid date is required'),
  body('height').optional().matches(/^[0-9]{1,3}cm$/).withMessage('Height format: e.g., 170cm'),
  body('religion').optional().trim().notEmpty().withMessage('Religion is required'),
  body('caste').optional().trim().notEmpty().withMessage('Caste is required'),
  body('occupation').optional().trim().notEmpty().withMessage('Occupation is required'),
  body('city').optional().trim().notEmpty().withMessage('City is required'),
  body('state').optional().trim().notEmpty().withMessage('State is required'),
  body('country').optional().trim().notEmpty().withMessage('Country is required'),
  body('education').optional().trim().notEmpty().withMessage('Education is required'),
  body('income').optional().matches(/^[0-9]+$/).withMessage('Income must be numeric'),
  body('about').optional().trim().isLength({ max: 500 }).withMessage('About must be max 500 characters')
];

const searchValidation = [
  body('gender').optional().isIn(['male','female']).withMessage('Invalid gender'),
  body('ageFrom').optional().isInt({ min: 18, max: 100 }).withMessage('Age from must be 18-100'),
  body('ageTo').optional().isInt({ min: 18, max: 100 }).withMessage('Age to must be 18-100'),
  body('city').optional().trim().notEmpty().withMessage('City is required'),
  body('religion').optional().trim().notEmpty().withMessage('Religion is required'),
  body('incomeFrom').optional().matches(/^[0-9]+$/).withMessage('Income must be numeric'),
  body('incomeTo').optional().matches(/^[0-9]+$/).withMessage('Income must be numeric'),
  body('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  body('page').optional().isInt({ min: 1 }).withMessage('Page must be positive number')
];

// ==========================================
// POST /api/profiles
// Create new profile (Protected)
// ==========================================

router.post('/', 
  authMiddleware,
  createProfileValidation,
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: errors.array().map(e => e.msg)
        });
      }

      const {
        gender, dateOfBirth, height, religion, caste, occupation,
        city, state, country, education, income, about
      } = req.body;

      // TODO: Uncomment when Profile model is created
      /*
      // Check if profile already exists for this user
      const existingProfile = await Profile.findOne({ userId: req.userId });
      
      if (existingProfile) {
        return res.status(400).json({ 
          error: 'Profile already exists',
          message: 'User can only have one profile'
        });
      }

      // Create new profile
      const profile = new Profile({
        userId: req.userId,
        gender,
        dateOfBirth,
        height,
        religion,
        caste,
        occupation,
        location: {
          city,
          state,
          country
        },
        education,
        income,
        about,
        isComplete: true,
        createdAt: new Date()
      });

      await profile.save();

      res.status(201).json({
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
          income: profile.income
        }
      });
      */

      // Temporary response
      res.status(201).json({
        message: 'Profile creation endpoint ready',
        note: 'Profile model needs to be created first'
      });

    } catch (error) {
      console.error('Create profile error:', error);
      res.status(500).json({ 
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
    // TODO: Uncomment when Profile model is created
    /*
    const profile = await Profile.findOne({ userId: req.userId })
      .populate('userId', 'email firstName lastName phone');

    if (!profile) {
      return res.status(404).json({ 
        error: 'Profile not found',
        message: 'Please create a profile first'
      });
    }

    res.status(200).json({
      profile: {
        id: profile._id,
        gender: profile.gender,
        dateOfBirth: profile.dateOfBirth,
        height: profile.height,
        religion: profile.religion,
        caste: profile.caste,
        occupation: profile.occupation,
        city: profile.location.city,
        state: profile.location.state,
        country: profile.location.country,
        education: profile.education,
        income: profile.income,
        about: profile.about,
        isComplete: profile.isComplete,
        photos: profile.photos,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt
      }
    });
    */

    res.status(200).json({
      message: 'Get profile endpoint ready',
      userId: req.userId
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch profile',
      message: error.message 
    });
  }
});

// ==========================================
// GET /api/profiles/:id
// Get specific profile by ID
// ==========================================

router.get('/:id', 
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

      const { id } = req.params;

      // TODO: Uncomment when Profile model is created
      /*
      const profile = await Profile.findById(id)
        .populate('userId', 'email firstName lastName');

      if (!profile) {
        return res.status(404).json({ 
          error: 'Profile not found'
        });
      }

      res.status(200).json({
        profile: {
          id: profile._id,
          name: `${profile.userId.firstName} ${profile.userId.lastName}`,
          gender: profile.gender,
          age: calculateAge(profile.dateOfBirth),
          height: profile.height,
          religion: profile.religion,
          caste: profile.caste,
          occupation: profile.occupation,
          city: profile.location.city,
          education: profile.education,
          income: profile.income,
          about: profile.about,
          photos: profile.photos
        }
      });
      */

      res.status(200).json({
        message: 'Get specific profile endpoint ready',
        profileId: id
      });

    } catch (error) {
      console.error('Get profile by ID error:', error);
      res.status(500).json({ 
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

router.put('/me',
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

      // TODO: Uncomment when Profile model is created
      /*
      const profile = await Profile.findOneAndUpdate(
        { userId: req.userId },
        { ...req.body, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      if (!profile) {
        return res.status(404).json({ 
          error: 'Profile not found'
        });
      }

      res.status(200).json({
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
          updatedAt: profile.updatedAt
        }
      });
      */

      res.status(200).json({
        message: 'Profile update endpoint ready'
      });

    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ 
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
    // TODO: Uncomment when Profile model is created
    /*
    const profile = await Profile.findOneAndDelete({ userId: req.userId });

    if (!profile) {
      return res.status(404).json({ 
        error: 'Profile not found'
      });
    }

    res.status(200).json({
      message: 'Profile deleted successfully'
    });
    */

    res.status(200).json({
      message: 'Profile delete endpoint ready'
    });

  } catch (error) {
    console.error('Delete profile error:', error);
    res.status(500).json({ 
      error: 'Failed to delete profile',
      message: error.message 
    });
  }
});

// ==========================================
// POST /api/profiles/search
// Search profiles with filters
// ==========================================

router.post('/search',
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
        gender, ageFrom, ageTo, city, religion, incomeFrom, incomeTo,
        limit = 10, page = 1
      } = req.body;

      // TODO: Uncomment when Profile model is created
      /*
      // Build search query
      let query = {};

      if (gender) query.gender = gender;
      if (city) query['location.city'] = { $regex: city, $options: 'i' };
      if (religion) query.religion = { $regex: religion, $options: 'i' };

      if (ageFrom || ageTo) {
        query.dateOfBirth = {};
        if (ageFrom) {
          const toDateFrom = new Date();
          toDateFrom.setFullYear(toDateFrom.getFullYear() - ageFrom);
          query.dateOfBirth.$lte = toDateFrom;
        }
        if (ageTo) {
          const toDateTo = new Date();
          toDateTo.setFullYear(toDateTo.getFullYear() - ageTo);
          query.dateOfBirth.$gte = toDateTo;
        }
      }

      if (incomeFrom || incomeTo) {
        query.income = {};
        if (incomeFrom) query.income.$gte = parseInt(incomeFrom);
        if (incomeTo) query.income.$lte = parseInt(incomeTo);
      }

      // Execute search with pagination
      const skip = (page - 1) * limit;
      const profiles = await Profile.find(query)
        .limit(parseInt(limit))
        .skip(skip)
        .select('-userId')
        .lean();

      const total = await Profile.countDocuments(query);

      res.status(200).json({
        message: 'Search results',
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        },
        profiles: profiles.map(p => ({
          id: p._id,
          gender: p.gender,
          age: calculateAge(p.dateOfBirth),
          religion: p.religion,
          caste: p.caste,
          occupation: p.occupation,
          city: p.location.city,
          education: p.education,
          income: p.income
        }))
      });
      */

      res.status(200).json({
        message: 'Profile search endpoint ready',
        note: 'Profile model needs to be created first'
      });

    } catch (error) {
      console.error('Search profiles error:', error);
      res.status(500).json({ 
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

router.post('/:id/view',
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

      // TODO: Implement view tracking
      /*
      - Record view in ProfileView collection
      - Update view count
      - Check if already viewed today
      */

      res.status(200).json({
        message: 'Profile view recorded'
      });

    } catch (error) {
      console.error('Mark view error:', error);
      res.status(500).json({ 
        error: 'Failed to record view',
        message: error.message 
      });
    }
  }
);

// ==========================================
// HELPER FUNCTIONS
// ==========================================

// Calculate age from date of birth
function calculateAge(dateOfBirth) {
  const today = new Date();
  let age = today.getFullYear() - new Date(dateOfBirth).getFullYear();
  const monthDiff = today.getMonth() - new Date(dateOfBirth).getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < new Date(dateOfBirth).getDate())) {
    age--;
  }
  
  return age;
}

// ==========================================
// EXPORT ROUTER
// ==========================================

module.exports = router;
