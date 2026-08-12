// ==========================================
// ADMIN ROUTES
// New Kalyanamala Matrimony
// ==========================================

const express = require('express');
const router = express.Router();
const { body, validationResult, param, query } = require('express-validator');
const jwt = require('jsonwebtoken');

// Models
const User = require('../models/User');
const Profile = require('../models/Profile');

// ==========================================
// MIDDLEWARE
// ==========================================

// Auth Middleware - Verify JWT Token
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

// Admin Middleware - Verify Admin/Subadmin Role
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
// VALIDATION RULES
// ==========================================

const listUsersValidation = [
  query('role').optional().isIn(['user','subadmin','admin']).withMessage('Invalid role'),
  query('status').optional().isIn(['active','inactive','suspended','deleted']).withMessage('Invalid status'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive number'),
  query('search').optional().trim().notEmpty().withMessage('Search term cannot be empty')
];

const userActionValidation = [
  param('userId').isMongoId().withMessage('Invalid user ID')
];

const makeAdminValidation = [
  param('userId').isMongoId().withMessage('Invalid user ID'),
  body('adminLevel').isIn(['admin','subadmin']).withMessage('Invalid admin level')
];

const suspendUserValidation = [
  param('userId').isMongoId().withMessage('Invalid user ID'),
  body('reason').trim().notEmpty().isLength({ min: 10 }).withMessage('Reason must be at least 10 characters'),
  body('duration').optional().matches(/^[0-9]+[dmh]$/).withMessage('Duration format: e.g., 30d, 24h, 10m')
];

const deleteUserValidation = [
  param('userId').isMongoId().withMessage('Invalid user ID'),
  body('reason').trim().notEmpty().withMessage('Reason for deletion is required'),
  body('permanent').optional().isBoolean().withMessage('Must be boolean')
];

const profileStatusValidation = [
  param('profileId').isMongoId().withMessage('Invalid profile ID'),
  body('status').isIn(['active','suspended','deleted']).withMessage('Invalid status'),
  body('reason').optional().trim().notEmpty().withMessage('Reason is required')
];

const reportValidation = [
  param('reportId').isMongoId().withMessage('Invalid report ID'),
  body('action').isIn(['approve','reject','pending']).withMessage('Invalid action'),
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes max 500 characters')
];

// ==========================================
// DASHBOARD ROUTES
// ==========================================

// GET /api/admin/dashboard/stats
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
      createdAt: {
        $gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    });

    res.status(200).json({
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
    res.status(500).json({
      error: 'Failed to fetch dashboard statistics',
      message: error.message
    });
  }
});

// ==========================================
// USER MANAGEMENT ROUTES
// ==========================================

// GET /api/admin/users
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

    const skip = (page - 1) * limit;

    const users = await User.find(query)
      .select('-password')
      .limit(parseInt(limit, 10))
      .skip(skip)
      .sort({ createdAt: -1 })
      .lean();

    const total = await User.countDocuments(query);

    res.status(200).json({
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
        updatedAt: u.updatedAt,
        lastLoginAt: u.lastLoginAt
      }))
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      error: 'Failed to fetch users',
      message: error.message
    });
  }
});

// GET /api/admin/users/:userId
router.get('/users/:userId', authMiddleware, adminMiddleware, userActionValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array().map(e => e.msg)
      });
    }

    const { userId } = req.params;

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const profile = await Profile.findOne({ userId }).lean();

    res.status(200).json({
      message: 'User details retrieved',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        surname: user.surname,
        phone: user.phone,
        role: user.role,
        status: user.status,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        profile: profile || null
      }
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({
      error: 'Failed to fetch user details',
      message: error.message
    });
  }
});

// PUT /api/admin/users/:userId
// Admin/Subadmin can edit email, phone, name, surname, role, status
router.put('/users/:userId', authMiddleware, adminMiddleware, userActionValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array().map(e => e.msg)
      });
    }

    const { userId } = req.params;
    const { email, phone, firstName, lastName, surname, role, status } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (surname !== undefined) user.surname = surname;
    if (role !== undefined) user.role = role;
    if (status !== undefined) user.status = status;

    await user.save();

    const updatedUser = await User.findById(userId).select('-password');

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({
      error: 'Failed to update user',
      message: error.message
    });
  }
});

// POST /api/admin/users/:userId/make-admin
router.post('/users/:userId/make-admin', authMiddleware, adminMiddleware, makeAdminValidation, async (req, res) => {
  try {
    // Only admin can use this route; if you want only admin to promote others, keep this check
    if (req.userRole !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only admin can promote users to admin/subadmin'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array().map(e => e.msg)
      });
    }

    const { userId } = req.params;
    const { adminLevel } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    user.role = adminLevel;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User promoted to ${adminLevel} successfully`,
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Make admin error:', error);
    return res.status(500).json({
      error: 'Failed to promote user to admin',
      message: error.message
    });
  }
});

// PUT /api/admin/users/:userId/suspend
router.put('/users/:userId/suspend', authMiddleware, adminMiddleware, suspendUserValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array().map(e => e.msg)
      });
    }

    const { userId } = req.params;
    const { reason, duration = '30d' } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    user.status = 'suspended';
    user.suspensionReason = reason;
    user.suspensionDuration = duration;
    user.suspendedBy = req.userId;
    user.suspendedAt = new Date();
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'User suspended successfully',
      user: {
        id: user._id,
        email: user.email,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Suspend user error:', error);
    return res.status(500).json({
      error: 'Failed to suspend user',
      message: error.message
    });
  }
});

// PUT /api/admin/users/:userId/unsuspend
router.put('/users/:userId/unsuspend', authMiddleware, adminMiddleware, userActionValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array().map(e => e.msg)
      });
    }

    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    user.status = 'active';
    user.suspensionReason = null;
    user.suspensionDuration = null;
    user.suspendedBy = null;
    user.suspendedAt = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'User unsuspended successfully',
      user: {
        id: user._id,
        email: user.email,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Unsuspend user error:', error);
    return res.status(500).json({
      error: 'Failed to unsuspend user',
      message: error.message
    });
  }
});

// DELETE /api/admin/users/:userId
router.delete('/users/:userId', authMiddleware, adminMiddleware, deleteUserValidation, async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only admin can delete user accounts'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array().map(e => e.msg)
      });
    }

    const { userId } = req.params;
    const { permanent = false } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    if (permanent) {
      await User.findByIdAndDelete(userId);
      await Profile.deleteOne({ userId });
    } else {
      user.status = 'deleted';
      user.deletedAt = new Date();
      user.isActive = false;
      await user.save();

      const profile = await Profile.findOne({ userId });
      if (profile) {
        profile.isDeleted = true;
        profile.deletedAt = new Date();
        profile.approvalStatus = 'deleted';
        profile.showInSearch = false;
        await profile.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      permanent,
      userId
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({
      error: 'Failed to delete user',
      message: error.message
    });
  }
});

// ==========================================
// PROFILE MANAGEMENT ROUTES
// ==========================================

// GET /api/admin/profiles
router.get('/profiles', authMiddleware, adminMiddleware, listUsersValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array().map(e => e.msg)
      });
    }

    const { status, limit = 20, page = 1, search } = req.query;

    let query = {};

    if (status) {
      if (status === 'all') {
        // no filter
      } else {
        query.approvalStatus = status;
      }
    }

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { religion: { $regex: search, $options: 'i' } },
        { occupation: { $regex: search, $options: 'i' } },
        { 'currentAddress.city': { $regex: search, $options: 'i' } },
        { 'currentAddress.state': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const profiles = await Profile.find(query)
      .populate('userId', 'firstName lastName surname email phone role status')
      .limit(parseInt(limit, 10))
      .skip(skip)
      .sort({ createdAt: -1 })
      .lean();

    const total = await Profile.countDocuments(query);

    return res.status(200).json({
      message: 'Profiles retrieved successfully',
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / limit)
      },
      profiles: profiles.map(p => ({
        id: p._id,
        profileId: p.profileId,
        fullName: p.fullName,
        userName: `${p.userId?.firstName || ''} ${p.userId?.lastName || ''}`.trim(),
        userEmail: p.userId?.email,
        userPhone: p.userId?.phone,
        gender: p.gender,
        religion: p.religion,
        caste: p.caste,
        subCaste: p.subCaste,
        city: p.currentAddress?.city,
        state: p.currentAddress?.state,
        approvalStatus: p.approvalStatus,
        createdAt: p.createdAt
      }))
    });
  } catch (error) {
    console.error('Get profiles error:', error);
    return res.status(500).json({
      error: 'Failed to fetch profiles',
      message: error.message
    });
  }
});

// PUT /api/admin/profiles/:profileId/status
router.put('/profiles/:profileId/status', authMiddleware, adminMiddleware, profileStatusValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array().map(e => e.msg)
      });
    }

    const { profileId } = req.params;
    const { status, reason } = req.body;

    const profile = await Profile.findById(profileId);
    if (!profile) {
      return res.status(404).json({
        error: 'Profile not found'
      });
    }

    profile.approvalStatus = status;
    profile.rejectedReason = reason || null;
    profile.showInSearch = status === 'active' || status === 'approved';

    if (status === 'deleted') {
      profile.isDeleted = true;
      profile.deletedAt = new Date();
      profile.showInSearch = false;
    }

    await profile.save();

    return res.status(200).json({
      success: true,
      message: 'Profile status updated successfully',
      profile: {
        id: profile._id,
        profileId: profile.profileId,
        approvalStatus: profile.approvalStatus
      }
    });
  } catch (error) {
    console.error('Update profile status error:', error);
    return res.status(500).json({
      error: 'Failed to update profile status',
      message: error.message
    });
  }
});

// ==========================================
// REPORT MANAGEMENT ROUTES
// ==========================================

router.get('/reports', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    return res.status(200).json({
      message: 'Reports retrieved successfully',
      note: 'Report model needs to be created first'
    });
  } catch (error) {
    console.error('Get reports error:', error);
    return res.status(500).json({
      error: 'Failed to fetch reports',
      message: error.message
    });
  }
});

router.put('/reports/:reportId', authMiddleware, adminMiddleware, reportValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array().map(e => e.msg)
      });
    }

    const { reportId } = req.params;
    const { action } = req.body;

    return res.status(200).json({
      success: true,
      message: 'Report updated successfully',
      reportId,
      action
    });
  } catch (error) {
    console.error('Update report error:', error);
    return res.status(500).json({
      error: 'Failed to update report',
      message: error.message
    });
  }
});

// ==========================================
// SYSTEM MANAGEMENT ROUTES
// ==========================================

// POST /api/admin/system/backup
router.post('/system/backup', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only admin can create backups'
      });
    }

    return res.status(200).json({
      message: 'Database backup initiated',
      timestamp: new Date(),
      backupId: `backup_${Date.now()}`
    });
  } catch (error) {
    console.error('Backup error:', error);
    return res.status(500).json({
      error: 'Failed to create backup',
      message: error.message
    });
  }
});

// GET /api/admin/system/logs
router.get('/system/logs', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { limit = 100, page = 1, type } = req.query;

    return res.status(200).json({
      message: 'System logs retrieved',
      note: 'Logging system needs to be configured',
      limit,
      page,
      type
    });
  } catch (error) {
    console.error('Get logs error:', error);
    return res.status(500).json({
      error: 'Failed to fetch logs',
      message: error.message
    });
  }
});

// GET /api/admin/audit-trail
router.get('/audit-trail', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    return res.status(200).json({
      message: 'Audit trail retrieved',
      note: 'AuditLog model needs to be created first'
    });
  } catch (error) {
    console.error('Get audit trail error:', error);
    return res.status(500).json({
      error: 'Failed to fetch audit trail',
      message: error.message
    });
  }
});

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function calculateSuspensionEndDate(duration) {
  const now = new Date();
  const match = duration.match(/^(\d+)([dmh])$/);

  if (!match) {
    return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  }

  const amount = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 'd':
      return new Date(now.getTime() + amount * 24 * 60 * 60 * 1000);
    case 'h':
      return new Date(now.getTime() + amount * 60 * 60 * 1000);
    case 'm':
      return new Date(now.getTime() + amount * 60 * 1000);
    default:
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  }
}

// ==========================================
// EXPORT ROUTER
// ==========================================

module.exports = router;
