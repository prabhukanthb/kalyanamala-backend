const express = require('express');
const router = express.Router();
const { body, validationResult, param, query } = require('express-validator');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const Profile = require('../models/Profile');

// ==========================================
// AUTH MIDDLEWARE
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

const adminMiddleware = (req, res, next) => {
  if (req.userRole !== 'admin' && req.userRole !== 'subadmin') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Admin access required'
    });
  }
  next();
};

// ==========================================
// VALIDATION
// ==========================================
const userIdValidation = [
  param('userId').isMongoId().withMessage('Invalid user ID')
];

const profileIdValidation = [
  param('profileId').isMongoId().withMessage('Invalid profile ID')
];

const listProfilesValidation = [
  query('search').optional().trim(),
  query('status').optional().isIn(['all', 'draft', 'pending', 'approved', 'rejected', 'deleted']).withMessage('Invalid status'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive number')
];
const listUsersValidation = [
  query('role').optional().isIn(['user','subadmin','admin']).withMessage('Invalid role'),
  query('status').optional().isIn(['active','inactive','suspended','deleted']).withMessage('Invalid status'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive number'),
  query('search').optional().trim().notEmpty().withMessage('Search term cannot be empty')
];

const profileValidation = [
  body('gender').isIn(['male','female']).withMessage('Gender must be male or female'),
  body('dateOfBirth').isISO8601().withMessage('Date of birth is required'),
  body('heightFeet').isNumeric().withMessage('Height feet is required'),
  body('heightInches').isNumeric().withMessage('Height inches is required'),

  body('religion')
    .isIn(['Christian','Hindu','Ambedkarist','Buddhist','Other'])
    .withMessage('Valid religion is required'),

  body('subCaste')
    .isIn(['SC','BC','OC','NA'])
    .withMessage('Valid sub caste is required'),

  body('siblingsCount').optional().isNumeric().withMessage('Siblings count must be numeric'),

  body('maritalStatus')
    .isIn(['Nevermarried','Divorced','Widowed','AwaitingDivorce'])
    .withMessage('Valid marital status is required'),

  body('haveChildren').custom((value) => {
    if (
      value === true ||
      value === false ||
      value === 'true' ||
      value === 'false'
    ) {
      return true;
    }
    throw new Error('Have Children must be true or false');
  }),

  body('fatherName').notEmpty().withMessage('Father name is required'),
  body('fatherOccupation').notEmpty().withMessage('Father occupation is required'),
  body('motherName').notEmpty().withMessage('Mother name is required'),
  body('motherOccupation').notEmpty().withMessage('Mother occupation is required'),

  body('highestEducation')
    .isIn([
      '10th Pass',
      '12th Pass',
      'Diploma',
      'ITI',
      'B.A',
      'B.Sc',
      'B.Com',
      'B.Tech',
      'M.A',
      'M.Sc',
      'M.Com',
      'M.Tech',
      'MBA',
      'MCA',
      'MBBS',
      'BDS',
      'MD',
      'MS',
      'PhD',
      'Other'
    ])
    .withMessage('Valid highest education is required'),

  body('fieldOfStudy').notEmpty().withMessage('Field of study is required'),
  body('college').notEmpty().withMessage('College is required'),
  body('occupation').notEmpty().withMessage('Occupation is required'),

  body('employmentType')
    .isIn(['private','public','govt','business','self-employed','other'])
    .withMessage('Valid employment type is required'),

  body('companyName').notEmpty().withMessage('Company name is required'),
  body('jobTitle').notEmpty().withMessage('Job title is required'),
  body('jobLocation').notEmpty().withMessage('Job location is required'),
  body('industry').notEmpty().withMessage('Industry is required'),

  body('income').isNumeric().withMessage('Income is required'),

  body('currentAddress.streetName').notEmpty().withMessage('Street name is required'),
  body('currentAddress.city').notEmpty().withMessage('City is required'),
  body('currentAddress.state').notEmpty().withMessage('State is required'),
  body('currentAddress.country').notEmpty().withMessage('Country is required'),
  body('currentAddress.pinCode').notEmpty().withMessage('Pin code is required'),

  body('aboutMe').notEmpty().withMessage('About me is required')
];

// ==========================================
// HELPERS
// ==========================================
function generateProfilePrefix(gender) {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const genderCode = gender === 'male' ? 'M' : 'F';
  return `KM-${yy}${mm}${genderCode}`;
}

function buildProfilePayload(bodyData, reqUserId, isAdminCreate = false) {
  const profilePayload = {
    gender: bodyData.gender,
    dateOfBirth: bodyData.dateOfBirth,
    heightFeet: Number(bodyData.heightFeet),
    heightInches: Number(bodyData.heightInches),

    religion: bodyData.religion,
    caste: 'Mala',
    subCaste: bodyData.subCaste,
    siblingsCount: Number(bodyData.siblingsCount || 0),
    maritalStatus: bodyData.maritalStatus,
    haveChildren: bodyData.haveChildren === true || bodyData.haveChildren === 'true',

    familyStatus: bodyData.familyStatus || null,
    familyValues: bodyData.familyValues || null,

    fatherName: bodyData.fatherName,
    fatherOccupation: bodyData.fatherOccupation,
    motherName: bodyData.motherName,
    motherOccupation: bodyData.motherOccupation,

    highestEducation: bodyData.highestEducation,
    fieldOfStudy: bodyData.fieldOfStudy,
    college: bodyData.college,
    occupation: bodyData.occupation,
    employmentType: bodyData.employmentType,
    companyName: bodyData.companyName,
    jobTitle: bodyData.jobTitle,
    jobLocation: bodyData.jobLocation,
    industry: bodyData.industry,
    income: Number(bodyData.income),
    incomeCurrency: 'INR',

    currentAddress: {
      streetName: bodyData.currentAddress?.streetName,
      city: bodyData.currentAddress?.city,
      state: bodyData.currentAddress?.state,
      country: bodyData.currentAddress?.country || 'India',
      pinCode: bodyData.currentAddress?.pinCode
    },

    photos: Array.isArray(bodyData.photos) ? bodyData.photos.slice(0, 3) : [],
    aboutMe: bodyData.aboutMe,
    preferredMatch: bodyData.preferredMatch || 'any_religion',

    membershipType: bodyData.membershipType || 'free',
    isPremium: bodyData.isPremium === true || bodyData.isPremium === 'true',
    hideMobile: bodyData.hideMobile === true || bodyData.hideMobile === 'true' || true,
    hideCurrentAddress: bodyData.hideCurrentAddress === true || bodyData.hideCurrentAddress === 'true' || true,
    hideJobLocation: bodyData.hideJobLocation === true || bodyData.hideJobLocation === 'true' || true,

    showInSearch: isAdminCreate ? true : false,
    approvalStatus: isAdminCreate ? 'approved' : 'pending',
    approvedBy: isAdminCreate ? reqUserId : null,
    approvedAt: isAdminCreate ? new Date() : null
  };

  return profilePayload;
}

// ==========================================
// DASHBOARD STATS
// ==========================================
router.get('/dashboard/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProfiles = await Profile.countDocuments();
    const approvedProfiles = await Profile.countDocuments({ approvalStatus: 'approved' });
    const pendingProfiles = await Profile.countDocuments({ approvalStatus: 'pending' });
    const rejectedProfiles = await Profile.countDocuments({ approvalStatus: 'rejected' });
    const deletedProfiles = await Profile.countDocuments({ approvalStatus: 'deleted' });
    const activeUsers = await User.countDocuments({ status: 'active' });
    const newUsersToday = await User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    return res.status(200).json({
      success: true,
      message: 'Dashboard statistics retrieved',
      stats: {
        totalUsers,
        totalProfiles,
        approvedProfiles,
        pendingProfiles,
        rejectedProfiles,
        deletedProfiles,
        activeUsers,
        newUsersToday,
        inactiveUsers: totalUsers - activeUsers
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return res.status(500).json({
      error: 'Failed to fetch dashboard statistics',
      message: error.message
    });
  }
});

// ==========================================
// USERS
// ==========================================
router.get('/users', authMiddleware, adminMiddleware, listUsersValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array().map(e => e.msg)
      });
    }

    const { role, status, limit = 20, page = 1, search } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (role) query.role = role;
    if (status) query.status = status;

    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { surname: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .limit(parseInt(limit, 10))
      .skip(skip)
      .sort({ createdAt: -1 })
      .lean();

    const total = await User.countDocuments(query);

    return res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / limit)
      },
      users: users.map(u => ({
        id: u._id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        surname: u.surname,
        phone: u.phone,
        role: u.role,
        status: u.status,
        isActive: u.isActive,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt
      }))
    });
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({
      error: 'Failed to fetch users',
      message: error.message
    });
  }
});

router.get('/users/:userId', authMiddleware, adminMiddleware, userIdValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array().map(e => e.msg)
      });
    }

    const user = await User.findById(req.params.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const profile = await Profile.findOne({ userId: req.params.userId }).lean();

    return res.status(200).json({
      success: true,
      message: 'User details retrieved',
      user: {
        ...user.toObject?.() || user,
        profile: profile || null
      }
    });
  } catch (error) {
    console.error('Get user details error:', error);
    return res.status(500).json({
      error: 'Failed to fetch user details',
      message: error.message
    });
  }
});

router.put('/users/:userId', authMiddleware, adminMiddleware, userIdValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array().map(e => e.msg)
      });
    }

    const { email, phone, firstName, lastName, surname, role, status } = req.body;

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (surname !== undefined) user.surname = surname;
    if (role !== undefined) user.role = role;
    if (status !== undefined) user.status = status;

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: await User.findById(req.params.userId).select('-password')
    });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({
      error: 'Failed to update user',
      message: error.message
    });
  }
});

// ==========================================
// PROFILES LIST / SEARCH
// ==========================================
router.get('/profiles', authMiddleware, adminMiddleware, listProfilesValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array().map(e => e.msg)
      });
    }

    const { search, status = 'all', limit = 20, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    if (status && status !== 'all') {
      query.approvalStatus = status;
    }

    if (search) {
      query.$or = [
        { profileId: { $regex: search, $options: 'i' } },
        { 'userId.firstName': { $regex: search, $options: 'i' } },
        { 'userId.lastName': { $regex: search, $options: 'i' } },
        { 'userId.surname': { $regex: search, $options: 'i' } },
        { 'userId.email': { $regex: search, $options: 'i' } },
        { 'userId.phone': { $regex: search, $options: 'i' } },
        { religion: { $regex: search, $options: 'i' } },
        { occupation: { $regex: search, $options: 'i' } },
        { 'currentAddress.city': { $regex: search, $options: 'i' } },
        { 'currentAddress.state': { $regex: search, $options: 'i' } }
      ];
    }

    const profiles = await Profile.find(query)
      .populate('userId', 'firstName lastName surname email phone role status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .lean();

    const total = await Profile.countDocuments(query);

    return res.status(200).json({
      success: true,
      message: 'Profiles retrieved successfully',
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / limit)
      },
      profiles
    });
  } catch (error) {
    console.error('Get profiles error:', error);
    return res.status(500).json({
      error: 'Failed to fetch profiles',
      message: error.message
    });
  }
});

// ==========================================
// PROFILE FULL VIEW
// ==========================================
router.get('/profiles/:profileId', authMiddleware, adminMiddleware, profileIdValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array().map(e => e.msg)
      });
    }

    const profile = await Profile.findById(req.params.profileId)
      .populate('userId', 'firstName lastName surname email phone role status');

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    return res.status(200).json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('Get profile details error:', error);
    return res.status(500).json({
      error: 'Failed to fetch profile',
      message: error.message
    });
  }
});

// ==========================================
// ADMIN CREATE PROFILE - AUTO APPROVE
// ==========================================
router.post('/profiles', authMiddleware, adminMiddleware, profileValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array().map(e => e.msg)
      });
    }

    const userId = req.body.userId || null;

    if (userId) {
      const userExists = await User.findById(userId);
      if (!userExists) {
        return res.status(404).json({ error: 'Linked user not found' });
      }

      const existingProfile = await Profile.findOne({ userId });
      if (existingProfile) {
        return res.status(400).json({
          error: 'Profile already exists for this user'
        });
      }
    }

    const prefix = generateProfilePrefix(req.body.gender);
    const lastProfile = await Profile.findOne({
      profileId: new RegExp(`^${prefix}`)
    }).sort({ profileId: -1 });

    let sequence = 1;
    if (lastProfile?.profileId) {
      sequence = parseInt(lastProfile.profileId.slice(-5), 10) + 1;
    }

    const profileId = `${prefix}${String(sequence).padStart(5, '0')}`;

    const profileData = buildProfilePayload(req.body, req.userId, true);

    const profile = await Profile.create({
      profileId,
      userId: userId || req.userId,
      ...profileData
    });

    return res.status(201).json({
      success: true,
      message: 'Profile created successfully and auto-approved',
      profile
    });
  } catch (error) {
    console.error('Admin create profile error:', error);
    return res.status(500).json({
      error: 'Failed to create profile',
      message: error.message
    });
  }
});

// ==========================================
// ADMIN EDIT FULL PROFILE
// ==========================================
router.put('/profiles/:profileId', authMiddleware, adminMiddleware, profileIdValidation, profileValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array().map(e => e.msg)
      });
    }

    const profile = await Profile.findById(req.params.profileId);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const updated = buildProfilePayload(req.body, req.userId, false);

    Object.assign(profile, updated);

    // preserve approval unless admin explicitly changes it elsewhere
    if (req.body.approvalStatus) {
      profile.approvalStatus = req.body.approvalStatus;
    }

    if (req.body.showInSearch !== undefined) {
      profile.showInSearch = req.body.showInSearch === true || req.body.showInSearch === 'true';
    }

    await profile.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      profile
    });
  } catch (error) {
    console.error('Admin update profile error:', error);
    return res.status(500).json({
      error: 'Failed to update profile',
      message: error.message
    });
  }
});

// ==========================================
// APPROVE / REJECT / DELETE PROFILE
// ==========================================
router.put('/profiles/:profileId/approve', authMiddleware, adminMiddleware, profileIdValidation, async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.profileId);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    profile.approvalStatus = 'approved';
    profile.approvedBy = req.userId;
    profile.approvedAt = new Date();
    profile.showInSearch = true;

    await profile.save();

    return res.status(200).json({
      success: true,
      message: 'Profile approved successfully',
      profile
    });
  } catch (error) {
    console.error('Approve profile error:', error);
    return res.status(500).json({
      error: 'Failed to approve profile',
      message: error.message
    });
  }
});

router.put('/profiles/:profileId/reject', authMiddleware, adminMiddleware, profileIdValidation, async (req, res) => {
  try {
    const { rejectedReason } = req.body;

    const profile = await Profile.findById(req.params.profileId);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    profile.approvalStatus = 'rejected';
    profile.rejectedReason = rejectedReason || 'Rejected by admin';
    profile.approvedBy = req.userId;
    profile.approvedAt = new Date();
    profile.showInSearch = false;

    await profile.save();

    return res.status(200).json({
      success: true,
      message: 'Profile rejected successfully',
      profile
    });
  } catch (error) {
    console.error('Reject profile error:', error);
    return res.status(500).json({
      error: 'Failed to reject profile',
      message: error.message
    });
  }
});

router.delete('/profiles/:profileId', authMiddleware, adminMiddleware, profileIdValidation, async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.profileId);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    profile.isDeleted = true;
    profile.deletedAt = new Date();
    profile.deletedBy = req.userId;
    profile.approvalStatus = 'deleted';
    profile.showInSearch = false;

    await profile.save();

    return res.status(200).json({
      success: true,
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

module.exports = router;
