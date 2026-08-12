const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult, param } = require('express-validator');

const Profile = require('../models/Profile');
const User = require('../models/User');

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

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

const profileValidation = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('gender').isIn(['male','female']).withMessage('Gender must be male or female'),
  body('dateOfBirth').isISO8601().withMessage('Date of birth is required'),
  body('heightFeet').isNumeric().withMessage('Height feet is required'),
  body('heightInches').isNumeric().withMessage('Height inches is required'),

  body('religion').isIn(['Christian','Hindu','Ambedkarist','Buddhist','Other']).withMessage('Valid religion is required'),
  body('subCaste').isIn(['SC','BC','OC','NA']).withMessage('Valid sub caste is required'),
  body('siblingsCount').isNumeric().withMessage('Siblings count is required'),
  body('maritalStatus').isIn(['Nevermarried','Divorced','Widowed','AwaitingDivorce']).withMessage('Valid marital status is required'),
  body('haveChildren').isBoolean().withMessage('Have Children must be true or false'),

  body('fatherName').notEmpty().withMessage('Father name is required'),
  body('fatherOccupation').notEmpty().withMessage('Father occupation is required'),
  body('motherName').notEmpty().withMessage('Mother name is required'),
  body('motherOccupation').notEmpty().withMessage('Mother occupation is required'),

  body('highestEducation').notEmpty().withMessage('Highest education is required'),
  body('fieldOfStudy').notEmpty().withMessage('Field of study is required'),
  body('college').notEmpty().withMessage('College is required'),
  body('occupation').notEmpty().withMessage('Occupation is required'),
  body('employmentType').isIn(['private','public','govt','business','self-employed','other']).withMessage('Valid employment type is required'),
  body('companyName').notEmpty().withMessage('Company name is required'),
  body('jobTitle').notEmpty().withMessage('Job title is required'),
  body('jobLocation').notEmpty().withMessage('Job location is required'),
  body('industry').notEmpty().withMessage('Industry is required'),
  body('income').isNumeric().withMessage('Income is required'),

  body('currentAddress.country').notEmpty().withMessage('Country is required'),
  body('currentAddress.state').notEmpty().withMessage('State is required'),
  body('currentAddress.city').notEmpty().withMessage('City is required'),

  body('aboutMe').notEmpty().withMessage('About me is required')
];

function generateProfileId(gender) {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const genderCode = gender === 'male' ? 'M' : 'F';
  return { prefix: `KM-${yy}${mm}${genderCode}`, yy, mm, genderCode };
}

router.post('/', authMiddleware, profileValidation, async (req, res) => {
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

    const { prefix } = generateProfileId(req.body.gender);

    const lastProfile = await Profile.findOne({
      profileId: new RegExp(`^${prefix}`)
    }).sort({ profileId: -1 });

    let sequence = 1;
    if (lastProfile?.profileId) {
      sequence = parseInt(lastProfile.profileId.slice(-5), 10) + 1;
    }

    const profileId = `${prefix}${String(sequence).padStart(5, '0')}`;

    const profile = await Profile.create({
      profileId,
      userId: req.userId,
      fullName: req.body.fullName,
      gender: req.body.gender,
      dateOfBirth: req.body.dateOfBirth,
      heightFeet: Number(req.body.heightFeet),
      heightInches: Number(req.body.heightInches),
      religion: req.body.religion,
      caste: 'Mala',
      subCaste: req.body.subCaste,
      siblingsCount: Number(req.body.siblingsCount || 0),
      maritalStatus: req.body.maritalStatus,
      haveChildren: req.body.haveChildren === true || req.body.haveChildren === 'true',
      familyStatus: req.body.familyStatus || null,
      familyValues: req.body.familyValues || null,
      fatherName: req.body.fatherName,
      fatherOccupation: req.body.fatherOccupation,
      motherName: req.body.motherName,
      motherOccupation: req.body.motherOccupation,
      highestEducation: req.body.highestEducation,
      fieldOfStudy: req.body.fieldOfStudy,
      college: req.body.college,
      occupation: req.body.occupation,
      employmentType: req.body.employmentType,
      companyName: req.body.companyName,
      jobTitle: req.body.jobTitle,
      jobLocation: req.body.jobLocation,
      industry: req.body.industry,
      income: Number(req.body.income),
      incomeCurrency: 'INR',
      currentAddress: req.body.currentAddress,
      photos: Array.isArray(req.body.photos) ? req.body.photos.slice(0, 3) : [],
      aboutMe: req.body.aboutMe,
      preferredMatch: req.body.preferredMatch || 'any_religion',
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
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.userId })
      .populate('userId', 'email firstName lastName phone role status');

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

router.put('/me', authMiddleware, async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.userId });
    if (!profile) {
      return res.status(404).json({
        error: 'Profile not found'
      });
    }

    const updatableFields = [
      'fullName',
      'gender',
      'dateOfBirth',
      'heightFeet',
      'heightInches',
      'religion',
      'subCaste',
      'siblingsCount',
      'maritalStatus',
      'haveChildren',
      'familyStatus',
      'familyValues',
      'fatherName',
      'fatherOccupation',
      'motherName',
      'motherOccupation',
      'highestEducation',
      'fieldOfStudy',
      'college',
      'occupation',
      'employmentType',
      'companyName',
      'jobTitle',
      'jobLocation',
      'industry',
      'income',
      'currentAddress',
      'aboutMe',
      'preferredMatch'
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        profile[field] = req.body[field];
      }
    });

    if (req.body.photos !== undefined && Array.isArray(req.body.photos)) {
      profile.photos = req.body.photos.slice(0, 3);
    }

    profile.incomeCurrency = 'INR';
    profile.caste = 'Mala';

    await profile.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      profile
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to update profile',
      message: error.message
    });
  }
});

router.get('/', authMiddleware, requireRole('admin', 'subadmin'), async (req, res) => {
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
});

module.exports = router;
