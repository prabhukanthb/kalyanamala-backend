const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult, param } = require('express-validator');

const Profile = require('../models/Profile');
const User = require('../models/User');

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
    return res.status(401).json({
      error: 'Invalid token',
      message: 'Authentication failed'
    });
  }
};

// =========================
// ROLE MIDDLEWARE
// =========================
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to perform this action'
      });
    }
    next();
  };
};

// =========================
// VALIDATION
// =========================
const profileValidation = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('gender').isIn(['male','female']).withMessage('Gender must be male or female'),
  body('dateOfBirth').isISO8601().withMessage('Date of birth is required'),
  body('heightCm').isNumeric().withMessage('Height in cm is required'),
  body('caste').notEmpty().withMessage('Caste is required'),
  body('subCaste').isIn(['SC','BC','OC','NA','Other']).withMessage('Valid sub caste is required'),
  body('religion').isIn(['Christian','Hindu','Ambedkarist','Buddhist','Other']).withMessage('Valid religion is required'),
  body('maritalStatus').isIn(['Nevermarried','Divorced','Widowed','AwaitingDivorce']).withMessage('Valid marital status is required'),
  body('education').notEmpty().withMessage('Education is required'),
  body('fieldOfStudy').notEmpty().withMessage('Field of study is required'),
  body('employedIn').isIn(['private','public','govt','business','self-employed','other']).withMessage('Valid employed in is required'),
  body('occupation').notEmpty().withMessage('Occupation is required'),
  body('jobTitle').notEmpty().withMessage('Job title is required'),
  body('jobLocation').notEmpty().withMessage('Job location is required'),
  body('industry').notEmpty().withMessage('Industry is required'),
  body('annualIncome').isNumeric().withMessage('Annual income is required'),
  body('fatherName').notEmpty().withMessage('Father name is required'),
  body('fatherOccupation').notEmpty().withMessage('Father occupation is required'),
  body('motherName').notEmpty().withMessage('Mother name is required'),
  body('motherOccupation').notEmpty().withMessage('Mother occupation is required'),
  body('siblingsCount').isNumeric().withMessage('Siblings count is required'),
  body('currentAddress.location').notEmpty().withMessage('Current address location is required'),
  body('currentAddress.city').notEmpty().withMessage('Current address city is required'),
  body('currentAddress.state').notEmpty().withMessage('Current address state is required'),
  body('currentAddress.country').notEmpty().withMessage('Current address country is required'),
  body('aboutMe').notEmpty().withMessage('About me is required')
];

// =========================
// CREATE PROFILE
// =========================
router.post(
  '/',
  authMiddleware,
  profileValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array().map((e) => e.msg)
        });
      }

      const existingProfile = await Profile.findOne({ userId: req.userId });
      if (existingProfile) {
        return res.status(400).json({
          error: 'Profile already exists',
          message: 'User can only have one profile'
        });
      }

      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      const {
        fullName,
        gender,
        dateOfBirth,
        heightCm,
        heightFeet,
        heightInches,
        caste,
        subCaste,
        religion,
        maritalStatus,
        education,
        fieldOfStudy,
        employedIn,
        occupation,
        jobTitle,
        jobLocation,
        industry,
        annualIncome,
        fatherName,
        fatherOccupation,
        motherName,
        motherOccupation,
        siblingsCount,
        currentAddress,
        aboutMe,
        bodyType,
        complexion,
        employmentType,
        companyName,
        college,
        incomeCurrency,
        incomeFrequency,
        willingToRelocate,
        lifestyle,
        photos,
        preferredMatch
      } = req.body;

      const now = new Date();
      const year = String(now.getFullYear()).slice(-2);
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const genderCode = gender === 'male' ? 'M' : 'F';

      const lastProfile = await Profile.findOne({
        profileId: new RegExp(`^KM-${year}${month}${genderCode}`)
      }).sort({ profileId: -1 });

      let sequence = 1;
      if (lastProfile?.profileId) {
        const lastSeq = parseInt(lastProfile.profileId.slice(-5), 10);
        sequence = lastSeq + 1;
      }

      const profileId = `KM-${year}${month}${genderCode}${String(sequence).padStart(5, '0')}`;

      const profile = await Profile.create({
        profileId,
        userId: req.userId,
        fullName,
        gender,
        dateOfBirth,
        heightCm: Number(heightCm),
        heightFeet: heightFeet || null,
        heightInches: heightInches || null,
        bodyType: bodyType || 'average',
        complexion: complexion || null,
        caste,
        subCaste,
        religion,
        maritalStatus,
        education,
        fieldOfStudy,
        employedIn,
        occupation,
        jobTitle,
        jobLocation,
        industry,
        annualIncome: Number(annualIncome),
        fatherName,
        fatherOccupation,
        motherName,
        motherOccupation,
        siblingsCount: Number(siblingsCount || 0),
        currentAddress,
        aboutMe,
        employmentType: employmentType || null,
        companyName: companyName || null,
        college: college || null,
        incomeCurrency: incomeCurrency || 'INR',
        incomeFrequency: incomeFrequency || 'annual',
        willingToRelocate: willingToRelocate ?? true,
        lifestyle: lifestyle || {},
        photos: Array.isArray(photos) ? photos.slice(0, 3) : [],
        preferredMatches: preferredMatch || 'any_religion',
        approvalStatus: 'pending',
        showInSearch: false
      });

      return res.status(201).json({
        success: true,
        message: 'Profile created successfully',
        profile
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

// =========================
// GET MY PROFILE
// =========================
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.userId })
      .populate('userId', 'email firstName lastName phone role');

    if (!profile) {
      return res.status(404).json({
        error: 'Profile not found',
        message: 'create profile first'
      });
    }

    return res.status(200).json({
      success: true,
      profile
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch profile',
      message: error.message
    });
  }
});

// =========================
// UPDATE MY PROFILE
// =========================
router.put('/me', authMiddleware, async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.userId });
    if (!profile) {
      return res.status(404).json({
        error: 'Profile not found'
      });
    }

    const allowedFields = [
      'fullName',
      'gender',
      'dateOfBirth',
      'heightCm',
      'heightFeet',
      'heightInches',
      'bodyType',
      'complexion',
      'caste',
      'subCaste',
      'religion',
      'maritalStatus',
      'education',
      'fieldOfStudy',
      'employedIn',
      'occupation',
      'jobTitle',
      'jobLocation',
      'industry',
      'annualIncome',
      'fatherName',
      'fatherOccupation',
      'motherName',
      'motherOccupation',
      'siblingsCount',
      'currentAddress',
      'aboutMe',
      'employmentType',
      'companyName',
      'college',
      'incomeCurrency',
      'incomeFrequency',
      'willingToRelocate',
      'lifestyle',
      'preferredMatch'
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        profile[field] = req.body[field];
      }
    });

    if (req.body.photos !== undefined && Array.isArray(req.body.photos)) {
      profile.photos = req.body.photos.slice(0, 3);
    }

    await profile.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      profile
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({
      error: 'Failed to update profile',
      message: error.message
    });
  }
});

// =========================
// ADMIN / SUBADMIN: LIST ALL
// =========================
router.get(
  '/',
  authMiddleware,
  requireRole('admin', 'subadmin'),
  async (req, res) => {
    try {
      const profiles = await Profile.find()
        .populate('userId', 'email firstName lastName phone role status')
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        count: profiles.length,
        profiles
      });
    } catch (error) {
      return res.status(500).json({
        error: 'Failed to fetch profiles',
        message: error.message
      });
    }
  }
);

module.exports = router;
