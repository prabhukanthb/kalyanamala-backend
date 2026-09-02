const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');

const Profile = require('../models/Profile');
const User = require('../models/User');

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

// ==========================================
// ROLE MIDDLEWARE
// ==========================================
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

// ==========================================
// HELPERS
// ==========================================
const safeString = (value) => {
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

const getAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  const birth = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

const isAdult = (dateOfBirth) => {
  const age = getAge(dateOfBirth);
  return age !== null && age >= 18;
};

// ==========================================
// VALIDATION
// ==========================================
const profileValidation = [
  body('gender')
    .isIn(['male','female'])
    .withMessage('Valid gender is required'),

  body('dateOfBirth')
    .isISO8601()
    .withMessage('Date of birth is required')
    .custom((value) => {
      if (!isAdult(value)) {
        throw new Error('User must be at least 18 years old');
      }
      return true;
    }),

  body('heightFeet')
    .isInt({ min: 4, max: 7 })
    .withMessage('Height feet must be between 4 and 7'),

  body('heightInches')
    .isInt({ min: 0, max: 11 })
    .withMessage('Height inches must be between 0 and 11'),

  body('religion')
    .isIn(['Christian','Hindu','Ambedkarist','Buddhist','Other'])
    .withMessage('Valid religion is required'),

  body('subCaste')
    .isIn(['SC','BC','OC','NA'])
    .withMessage('Valid sub caste is required'),

  body('siblingsCount')
    .isInt({ min: 0, max: 3 })
    .withMessage('Siblings count must be between 0 and 3'),

  body('maritalStatus')
    .isIn(['Nevermarried','Divorced','Widowed','AwaitingDivorce'])
    .withMessage('Valid marital status is required'),

  body('fatherName')
    .trim()
    .notEmpty()
    .withMessage('Father name is required'),

  body('fatherOccupation')
    .trim()
    .notEmpty()
    .withMessage('Father occupation is required'),

  body('motherName')
    .trim()
    .notEmpty()
    .withMessage('Mother name is required'),

  body('motherOccupation')
    .trim()
    .notEmpty()
    .withMessage('Mother occupation is required'),

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

  body('fieldOfStudy')
    .trim()
    .notEmpty()
    .withMessage('Field of study is required'),

  body('college')
    .trim()
    .notEmpty()
    .withMessage('College is required'),

  body('occupation')
    .trim()
    .notEmpty()
    .withMessage('Occupation is required'),

  body('employmentType')
    .trim()
    .notEmpty()
    .withMessage('Employment type is required'),

  body('companyName')
    .trim()
    .notEmpty()
    .withMessage('Company name is required'),

  body('jobTitle')
    .trim()
    .notEmpty()
    .withMessage('Job title is required'),

  body('jobLocation')
    .trim()
    .notEmpty()
    .withMessage('Job location is required'),

  body('industry')
    .trim()
    .notEmpty()
    .withMessage('Industry is required'),

  body('income')
    .isNumeric()
    .withMessage('Income must be a number'),

  body('currentAddress.streetName')
    .trim()
    .notEmpty()
    .withMessage('Street name is required'),

  body('currentAddress.city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),

  body('currentAddress.state')
    .trim()
    .notEmpty()
    .withMessage('State is required'),

  body('currentAddress.country')
    .trim()
    .notEmpty()
    .withMessage('Country is required'),

  body('currentAddress.pinCode')
    .trim()
    .notEmpty()
    .withMessage('Pin code is required'),

  body('aboutMe')
    .trim()
    .notEmpty()
    .withMessage('About me is required')
];

// ==========================================
// PROFILE ID GENERATOR
// ==========================================
function generateProfilePrefix(gender) {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const genderCode = gender === 'male' ? 'M' : 'F';
  return `KM-${yy}${mm}${genderCode}`;
}

async function generateProfileId(gender) {
  const prefix = generateProfilePrefix(gender);

  const lastProfile = await Profile.findOne({ profileId: new RegExp(`^${prefix}`) })
    .sort({ createdAt: -1 });

  let sequence = 1;
  if (lastProfile?.profileId) {
    sequence = parseInt(lastProfile.profileId.slice(-5), 10) + 1;
  }

  return `${prefix}${String(sequence).padStart(5, '0')}`;
}

// ==========================================
// CREATE PROFILE (self)
// ==========================================
router.post('/', authMiddleware, profileValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array().map((e) => ({
          field: e.path,
          message: e.msg
        }))
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

    const profileId = await generateProfileId(req.body.gender);

    const profile = await Profile.create({
      profileId,
      userId: req.userId,

      gender: req.body.gender,
      dateOfBirth: req.body.dateOfBirth,
      heightFeet: Number(req.body.heightFeet),
      heightInches: Number(req.body.heightInches),

      religion: req.body.religion,
      caste: 'Mala',
      subCaste: req.body.subCaste,
      siblingsCount: Number(req.body.siblingsCount),
      maritalStatus: req.body.maritalStatus,

      fatherName: safeString(req.body.fatherName),
      fatherOccupation: safeString(req.body.fatherOccupation),
      motherName: safeString(req.body.motherName),
      motherOccupation: safeString(req.body.motherOccupation),

      highestEducation: req.body.highestEducation,
      fieldOfStudy: safeString(req.body.fieldOfStudy),
      college: safeString(req.body.college),
      occupation: safeString(req.body.occupation),
      employmentType: safeString(req.body.employmentType),
      companyName: safeString(req.body.companyName),
      jobTitle: safeString(req.body.jobTitle),
      jobLocation: safeString(req.body.jobLocation),
      industry: safeString(req.body.industry),
      income: Number(req.body.income),
      incomeCurrency: 'INR',

      currentAddress: {
        streetName: safeString(req.body.currentAddress?.streetName),
        city: safeString(req.body.currentAddress?.city),
        state: safeString(req.body.currentAddress?.state),
        country: safeString(req.body.currentAddress?.country || 'India'),
        pinCode: safeString(req.body.currentAddress?.pinCode)
      },

      photos: Array.isArray(req.body.photos) ? req.body.photos.slice(0, 3) : [],
      aboutMe: safeString(req.body.aboutMe),
      preferredMatch: safeString(req.body.preferredMatch || 'any_religion'),

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

// ==========================================
// ADMIN / SUBADMIN: CREATE USER + PROFILE
// ==========================================
const adminCreateValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').matches(/^[0-9]{10}$/).withMessage('Phone must be 10 digits'),
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  ...profileValidation
];

router.post(
  '/admin-create',
  authMiddleware,
  requireRole('admin', 'subadmin'),
  adminCreateValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array().map((e) => ({
            field: e.path,
            message: e.msg
          }))
        });
      }

      const { email, phone, firstName, lastName } = req.body;

      const existingUser = await User.findOne({ $or: [{email},{phone}] });
      if (existingUser) {
        return res.status(400).json({
          error: 'User already exists',
          message: existingUser.email === email
            ? 'Email already registered'
            : 'Phone already registered'
        });
      }

      // Temporary password the admin shares with the user
      const namePart = safeString(firstName)
        .replace(/[^a-zA-Z]/g, '')
        .toUpperCase()
        .slice(0, 4)
        .padEnd(4, 'X');
      const tempPassword = `KM-${namePart}-${String(phone).slice(-4)}`;

      const hashedPassword = await bcrypt.hash(
        tempPassword,
        parseInt(process.env.BCRYPT_ROUNDS || '10', 10)
      );

      const newUser = await User.create({
        email,
        phone,
        firstName: safeString(firstName),
        lastName: safeString(lastName),
        password: hashedPassword,
        role: 'user',
        status: 'active',
        isActive: true,
        passwordResetRequired: true
      });

      const profileId = await generateProfileId(req.body.gender);

      const profile = await Profile.create({
        profileId,
        userId: newUser._id,

        gender: req.body.gender,
        dateOfBirth: req.body.dateOfBirth,
        heightFeet: Number(req.body.heightFeet),
        heightInches: Number(req.body.heightInches),

        religion: req.body.religion,
        caste: 'Mala',
        subCaste: req.body.subCaste,
        siblingsCount: Number(req.body.siblingsCount),
        maritalStatus: req.body.maritalStatus,

        fatherName: safeString(req.body.fatherName),
        fatherOccupation: safeString(req.body.fatherOccupation),
        motherName: safeString(req.body.motherName),
        motherOccupation: safeString(req.body.motherOccupation),

        highestEducation: req.body.highestEducation,
        fieldOfStudy: safeString(req.body.fieldOfStudy),
        college: safeString(req.body.college),
        occupation: safeString(req.body.occupation),
        employmentType: safeString(req.body.employmentType),
        companyName: safeString(req.body.companyName),
        jobTitle: safeString(req.body.jobTitle),
        jobLocation: safeString(req.body.jobLocation),
        industry: safeString(req.body.industry),
        income: Number(req.body.income),
        incomeCurrency: 'INR',

        currentAddress: {
          streetName: safeString(req.body.currentAddress?.streetName),
          city: safeString(req.body.currentAddress?.city),
          state: safeString(req.body.currentAddress?.state),
          country: safeString(req.body.currentAddress?.country || 'India'),
          pinCode: safeString(req.body.currentAddress?.pinCode)
        },

        photos: Array.isArray(req.body.photos) ? req.body.photos.slice(0, 3) : [],
        aboutMe: safeString(req.body.aboutMe),
        preferredMatch: safeString(req.body.preferredMatch || 'any_religion'),

        createdByAdmin: req.userId,
        approvalStatus: 'pending',
        showInSearch: false
      });

      return res.status(201).json({
        success: true,
        message: 'User and profile created successfully',
        tempPassword,
        profile
      });
    } catch (error) {
      console.error('Admin create profile error:', error);
      return res.status(500).json({
        error: 'Failed to create user and profile',
        message: error.message
      });
    }
  }
);

// ==========================================
// GET MY PROFILE
// ==========================================
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.userId })
      .populate('userId', 'email firstName lastName surname phone role status');

    if (!profile) {
      return res.status(404).json({
        error: 'Profile not found',
        message: 'Create profile first'
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

// ==========================================
// UPDATE MY PROFILE
// ==========================================
router.put('/me', authMiddleware, profileValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array().map((e) => ({
          field: e.path,
          message: e.msg
        }))
      });
    }

    const profile = await Profile.findOne({ userId: req.userId });
    if (!profile) {
      return res.status(404).json({
        error: 'Profile not found'
      });
    }

    profile.gender = req.body.gender;
    profile.dateOfBirth = req.body.dateOfBirth;
    profile.heightFeet = Number(req.body.heightFeet);
    profile.heightInches = Number(req.body.heightInches);

    profile.religion = req.body.religion;
    profile.caste = 'Mala';
    profile.subCaste = req.body.subCaste;
    profile.siblingsCount = Number(req.body.siblingsCount);
    profile.maritalStatus = req.body.maritalStatus;

    profile.fatherName = safeString(req.body.fatherName);
    profile.fatherOccupation = safeString(req.body.fatherOccupation);
    profile.motherName = safeString(req.body.motherName);
    profile.motherOccupation = safeString(req.body.motherOccupation);

    profile.highestEducation = req.body.highestEducation;
    profile.fieldOfStudy = safeString(req.body.fieldOfStudy);
    profile.college = safeString(req.body.college);
    profile.occupation = safeString(req.body.occupation);
    profile.employmentType = safeString(req.body.employmentType);
    profile.companyName = safeString(req.body.companyName);
    profile.jobTitle = safeString(req.body.jobTitle);
    profile.jobLocation = safeString(req.body.jobLocation);
    profile.industry = safeString(req.body.industry);
    profile.income = Number(req.body.income);
    profile.incomeCurrency = 'INR';

    profile.currentAddress = {
      streetName: safeString(req.body.currentAddress?.streetName),
      city: safeString(req.body.currentAddress?.city),
      state: safeString(req.body.currentAddress?.state),
      country: safeString(req.body.currentAddress?.country || 'India'),
      pinCode: safeString(req.body.currentAddress?.pinCode)
    };

    profile.aboutMe = safeString(req.body.aboutMe);
    profile.preferredMatch = safeString(req.body.preferredMatch || 'any_religion');

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

// ==========================================
// ADMIN / SUBADMIN: LIST ALL PROFILES
// ==========================================
router.get('/', authMiddleware, requireRole('admin', 'subadmin'), async (req, res) => {
  try {
    const profiles = await Profile.find()
      .populate('userId', 'email firstName lastName surname phone role status')
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

// ==========================================
// BROWSE PROFILES
// ==========================================
router.get('/browse', authMiddleware, async (req, res) => {
  try {
    const isAdmin = req.userRole === 'admin' || req.userRole === 'subadmin';

    if (isAdmin) {
      const all = await Profile.find({ userId: { $ne: req.userId } })
        .populate('userId', 'firstName lastName surname')
        .sort({ createdAt: -1 });
      return res.status(200).json({ success: true, profiles: all });
    }

    const me = await Profile.findOne({ userId: req.userId });
    if (!me) {
      return res.status(400).json({ message: 'Please create your profile first.' });
    }
    if (!me.gender || !me.dateOfBirth) {
      return res.status(400).json({ message: 'Complete your gender and date of birth to browse.' });
    }

    const myDob = new Date(me.dateOfBirth);

    const filter = {
      approvalStatus: 'approved',
      showInSearch: true,
      userId: { $ne: req.userId }
    };

    if (me.gender === 'female') {
      filter.gender = 'male';
      filter.dateOfBirth = { $lt: myDob };
    } else {
      filter.gender = 'female';
      filter.dateOfBirth = { $gte: myDob };
    }

    const profiles = await Profile.find(filter)
      .populate('userId', 'firstName lastName surname')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, profiles });
  } catch (err) {
    console.error('Browse profiles error:', err);
    return res.status(500).json({ message: err.message || 'Failed to load profiles' });
  }
});

// ==========================================
// ADMIN / SUBADMIN: GET PROFILE BY ID
// ==========================================
router.get('/:id', authMiddleware, requireRole('admin', 'subadmin'), async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id)
      .populate('userId', 'email firstName lastName surname phone role status');

    if (!profile) {
      return res.status(404).json({
        error: 'Profile not found'
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

// ==========================================
// ADMIN / SUBADMIN: UPDATE PROFILE
// ==========================================
router.put('/:id', authMiddleware, requireRole('admin', 'subadmin'), async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({
        error: 'Profile not found'
      });
    }

    if (req.body.gender !== undefined) profile.gender = req.body.gender;
    if (req.body.dateOfBirth !== undefined) profile.dateOfBirth = req.body.dateOfBirth;
    if (req.body.heightFeet !== undefined) profile.heightFeet = Number(req.body.heightFeet);
    if (req.body.heightInches !== undefined) profile.heightInches = Number(req.body.heightInches);

    if (req.body.religion !== undefined) profile.religion = req.body.religion;
    if (req.body.caste !== undefined) profile.caste = req.body.caste;
    if (req.body.subCaste !== undefined) profile.subCaste = req.body.subCaste;
    if (req.body.siblingsCount !== undefined) profile.siblingsCount = Number(req.body.siblingsCount);
    if (req.body.maritalStatus !== undefined) profile.maritalStatus = req.body.maritalStatus;

    if (req.body.fatherName !== undefined) profile.fatherName = safeString(req.body.fatherName);
    if (req.body.fatherOccupation !== undefined) profile.fatherOccupation = safeString(req.body.fatherOccupation);
    if (req.body.motherName !== undefined) profile.motherName = safeString(req.body.motherName);
    if (req.body.motherOccupation !== undefined) profile.motherOccupation = safeString(req.body.motherOccupation);

    if (req.body.highestEducation !== undefined) profile.highestEducation = req.body.highestEducation;
    if (req.body.fieldOfStudy !== undefined) profile.fieldOfStudy = safeString(req.body.fieldOfStudy);
    if (req.body.college !== undefined) profile.college = safeString(req.body.college);
    if (req.body.occupation !== undefined) profile.occupation = safeString(req.body.occupation);
    if (req.body.employmentType !== undefined) profile.employmentType = safeString(req.body.employmentType);
    if (req.body.companyName !== undefined) profile.companyName = safeString(req.body.companyName);
    if (req.body.jobTitle !== undefined) profile.jobTitle = safeString(req.body.jobTitle);
    if (req.body.jobLocation !== undefined) profile.jobLocation = safeString(req.body.jobLocation);
    if (req.body.industry !== undefined) profile.industry = safeString(req.body.industry);
    if (req.body.income !== undefined) profile.income = Number(req.body.income);

    if (req.body.currentAddress) {
      profile.currentAddress = {
        streetName: safeString(req.body.currentAddress.streetName ?? profile.currentAddress?.streetName),
        city: safeString(req.body.currentAddress.city ?? profile.currentAddress?.city),
        state: safeString(req.body.currentAddress.state ?? profile.currentAddress?.state),
        country: safeString(req.body.currentAddress.country ?? profile.currentAddress?.country),
        pinCode: safeString(req.body.currentAddress.pinCode ?? profile.currentAddress?.pinCode)
      };
    }

    if (req.body.aboutMe !== undefined) profile.aboutMe = safeString(req.body.aboutMe);
    if (req.body.preferredMatch !== undefined) profile.preferredMatch = safeString(req.body.preferredMatch);
    if (req.body.approvalStatus !== undefined) profile.approvalStatus = req.body.approvalStatus;
    if (req.body.showInSearch !== undefined) profile.showInSearch = req.body.showInSearch === true || req.body.showInSearch === 'true';

    if (req.body.photos !== undefined && Array.isArray(req.body.photos)) {
      profile.photos = req.body.photos.slice(0, 3);
    }

    await profile.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated by admin successfully',
      profile
    });
  } catch (error) {
    console.error('Admin profile update error:', error);
    return res.status(500).json({
      error: 'Failed to update profile',
      message: error.message
    });
  }
});

// ==========================================
// ADMIN / SUBADMIN: APPROVE PROFILE
// ==========================================
router.put('/:id/approve', authMiddleware, requireRole('admin', 'subadmin'), async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({
        error: 'Profile not found'
      });
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
    return res.status(500).json({
      error: 'Failed to approve profile',
      message: error.message
    });
  }
});

// ==========================================
// ADMIN / SUBADMIN: REJECT PROFILE
// ==========================================
router.put('/:id/reject', authMiddleware, requireRole('admin', 'subadmin'), async (req, res) => {
  try {
    const { rejectedReason } = req.body;

    const profile = await Profile.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({
        error: 'Profile not found'
      });
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
    return res.status(500).json({
      error: 'Failed to reject profile',
      message: error.message
    });
  }
});

// ==========================================
// ADMIN / SUBADMIN: SOFT DELETE PROFILE
// ==========================================
router.delete('/:id', authMiddleware, requireRole('admin', 'subadmin'), async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({
        error: 'Profile not found'
      });
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
    return res.status(500).json({
      error: 'Failed to delete profile',
      message: error.message
    });
  }
});

module.exports = router;
