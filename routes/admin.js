// ==========================================
// ADMIN ROUTES
// New Kalyanamala Matrimony
// ==========================================

const express = require('express');
const router = express.Router();
const { body, validationResult, param, query } = require('express-validator');

// Import Models (will be created later)
// const User = require('../models/User');
// const Profile = require('../models/Profile');
// const Connection = require('../models/Connection');
// const Report = require('../models/Report');

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

// Admin Middleware - Verify Admin Role
const adminMiddleware = (req, res, next) => {
  if (req.userRole !== 'admin' && req.userRole !== 'superadmin') {
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
  query('role').optional().isIn(['user','admin','superadmin']).withMessage('Invalid role'),
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
  body('adminLevel').isIn(['admin','superadmin']).withMessage('Invalid admin level')
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

const reportValidation = [
  param('reportId').isMongoId().withMessage('Invalid report ID'),
  body('action').isIn(['approve','reject','pending']).withMessage('Invalid action'),
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes max 500 characters')
];

const profileValidation = [
  param('profileId').isMongoId().withMessage('Invalid profile ID'),
  body('status').isIn(['active','suspended','deleted']).withMessage('Invalid status'),
  body('reason').optional().trim().notEmpty().withMessage('Reason is required')
];

// ==========================================
// DASHBOARD ROUTES
// ==========================================

// ==========================================
// GET /api/admin/dashboard/stats
// Get dashboard statistics (Admin only)
// ==========================================

router.get('/dashboard/stats',
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      // TODO: Uncomment when models are created
      /*
      const totalUsers = await User.countDocuments();
      const totalProfiles = await Profile.countDocuments();
      const totalConnections = await Connection.countDocuments({ status: 'accepted' });
      const activeUsers = await User.countDocuments({ isActive: true });
      const newUsersToday = await User.countDocuments({
        createdAt: {
          $gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      });

      // Get user growth data for last 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const userGrowth = await User.aggregate([
        {
          $match: {
            createdAt: { $gte: sevenDaysAgo }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);

      res.status(200).json({
        message: 'Dashboard statistics retrieved',
        stats: {
          totalUsers,
          totalProfiles,
          totalConnections,
          activeUsers,
          newUsersToday,
          inactiveUsers: totalUsers - activeUsers
        },
        userGrowth
      });
      */

      // Temporary response
      res.status(200).json({
        message: 'Dashboard statistics retrieved',
        stats: {
          totalUsers: 0,
          totalProfiles: 0,
          totalConnections: 0,
          activeUsers: 0,
          newUsersToday: 0,
          inactiveUsers: 0
        },
        note: 'Models need to be created first'
      });

    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch dashboard statistics',
        message: error.message 
      });
    }
  }
);

// ==========================================
// USER MANAGEMENT ROUTES
// ==========================================

// ==========================================
// GET /api/admin/users
// Get all users (Admin only)
// ==========================================

router.get('/users',
  authMiddleware,
  adminMiddleware,
  listUsersValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: errors.array().map(e => e.msg)
        });
      }

      const { role, status, limit = 20, page = 1, search } = req.query;

      // TODO: Uncomment when User model is created
      /*
      let query = {};

      if (role) query.role = role;
      if (status) query.status = status;

      if (search) {
        query.$or = [
          { email: { $regex: search, $options: 'i' } },
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (page - 1) * limit;
      const users = await User.find(query)
        .select('-password')
        .limit(parseInt(limit))
        .skip(skip)
        .sort({ createdAt: -1 })
        .lean();

      const total = await User.countDocuments(query);

      res.status(200).json({
        message: 'Users retrieved successfully',
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        },
        users: users.map(u => ({
          id: u._id,
          email: u.email,
          firstName: u.firstName,
          lastName: u.lastName,
          phone: u.phone,
          role: u.role,
          status: u.status,
          isActive: u.isActive,
          createdAt: u.createdAt,
          lastLogin: u.lastLogin
        }))
      });
      */

      // Temporary response
      res.status(200).json({
        message: 'Users retrieved successfully',
        note: 'User model needs to be created first'
      });

    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch users',
        message: error.message 
      });
    }
  }
);

// ==========================================
// GET /api/admin/users/:userId
// Get user details (Admin only)
// ==========================================

router.get('/users/:userId',
  authMiddleware,
  adminMiddleware,
  userActionValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: errors.array().map(e => e.msg)
        });
      }

      const { userId } = req.params;

      // TODO: Uncomment when User model is created
      /*
      const user = await User.findById(userId)
        .select('-password')
        .populate('profile');

      if (!user) {
        return res.status(404).json({ 
          error: 'User not found'
        });
      }

      res.status(200).json({
        message: 'User details retrieved',
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
          status: user.status,
          isActive: user.isActive,
          profile: user.profile,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          lastLogin: user.lastLogin
        }
      });
      */

      // Temporary response
      res.status(200).json({
        message: 'User details retrieved',
        userId,
        note: 'User model needs to be created first'
      });

    } catch (error) {
      console.error('Get user details error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch user details',
        message: error.message 
      });
    }
  }
);

// ==========================================
// POST /api/admin/users/:userId/make-admin
// Make user admin (Superadmin only)
// ==========================================

router.post('/users/:userId/make-admin',
  authMiddleware,
  adminMiddleware,
  makeAdminValidation,
  async (req, res) => {
    try {
      // Check if requester is superadmin
      if (req.userRole !== 'superadmin') {
        return res.status(403).json({ 
          error: 'Forbidden',
          message: 'Only superadmin can promote users to admin'
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

      // TODO: Uncomment when User model is created
      /*
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ 
          error: 'User not found'
        });
      }

      user.role = adminLevel;
      user.updatedAt = new Date();
      await user.save();

      // Log audit trail
      // TODO: Create audit log entry

      res.status(200).json({
        message: `User promoted to ${adminLevel} successfully`,
        user: {
          id: user._id,
          email: user.email,
          role: user.role
        }
      });
      */

      // Temporary response
      res.status(200).json({
        message: `User promoted to ${req.body.adminLevel} successfully`,
        userId,
        adminLevel: req.body.adminLevel
      });

    } catch (error) {
      console.error('Make admin error:', error);
      res.status(500).json({ 
        error: 'Failed to promote user to admin',
        message: error.message 
      });
    }
  }
);

// ==========================================
// PUT /api/admin/users/:userId/suspend
// Suspend user account (Admin only)
// ==========================================

router.put('/users/:userId/suspend',
  authMiddleware,
  adminMiddleware,
  suspendUserValidation,
  async (req, res) => {
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

      // TODO: Uncomment when User model is created
      /*
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ 
          error: 'User not found'
        });
      }

      // Calculate suspension end date
      const suspensionEndDate = calculateSuspensionEndDate(duration);

      user.status = 'suspended';
      user.suspensionReason = reason;
      user.suspensionEndDate = suspensionEndDate;
      user.suspendedBy = req.userId;
      user.suspendedAt = new Date();
      user.updatedAt = new Date();
      await user.save();

      // TODO: Send notification to user
      // TODO: Create audit log entry

      res.status(200).json({
        message: 'User suspended successfully',
        user: {
          id: user._id,
          email: user.email,
          status: user.status,
          suspensionEndDate: user.suspensionEndDate
        }
      });
      */

      // Temporary response
      res.status(200).json({
        message: 'User suspended successfully',
        userId,
        reason,
        duration
      });

    } catch (error) {
      console.error('Suspend user error:', error);
      res.status(500).json({ 
        error: 'Failed to suspend user',
        message: error.message 
      });
    }
  }
);

// ==========================================
// PUT /api/admin/users/:userId/unsuspend
// Unsuspend user account (Admin only)
// ==========================================

router.put('/users/:userId/unsuspend',
  authMiddleware,
  adminMiddleware,
  userActionValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: errors.array().map(e => e.msg)
        });
      }

      const { userId } = req.params;

      // TODO: Uncomment when User model is created
      /*
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ 
          error: 'User not found'
        });
      }

      user.status = 'active';
      user.suspensionReason = null;
      user.suspensionEndDate = null;
      user.updatedAt = new Date();
      await user.save();

      res.status(200).json({
        message: 'User unsuspended successfully',
        user: {
          id: user._id,
          email: user.email,
          status: user.status
        }
      });
      */

      // Temporary response
      res.status(200).json({
        message: 'User unsuspended successfully',
        userId
      });

    } catch (error) {
      console.error('Unsuspend user error:', error);
      res.status(500).json({ 
        error: 'Failed to unsuspend user',
        message: error.message 
      });
    }
  }
);

// ==========================================
// DELETE /api/admin/users/:userId
// Delete user account (Superadmin only)
// ==========================================

router.delete('/users/:userId',
  authMiddleware,
  adminMiddleware,
  deleteUserValidation,
  async (req, res) => {
    try {
      if (req.userRole !== 'superadmin') {
        return res.status(403).json({ 
          error: 'Forbidden',
          message: 'Only superadmin can delete user accounts'
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
      const { reason, permanent = false } = req.body;

      // TODO: Uncomment when User model is created
      /*
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ 
          error: 'User not found'
        });
      }

      if (permanent) {
        // Hard delete - remove completely
        await User.findByIdAndRemove(userId);
        // TODO: Delete related data (profiles, messages, connections, etc.)
      } else {
        // Soft delete - mark as deleted
        user.status = 'deleted';
        user.deletionReason = reason;
        user.deletedAt = new Date();
        user.deletedBy = req.userId;
        await user.save();
      }

      // TODO: Create audit log entry

      res.status(200).json({
        message: 'User deleted successfully',
        permanent,
        userId
      });
      */

      // Temporary response
      res.status(200).json({
        message: 'User deleted successfully',
        userId,
        permanent: req.body.permanent
      });

    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ 
        error: 'Failed to delete user',
        message: error.message 
      });
    }
  }
);

// ==========================================
// PROFILE MANAGEMENT ROUTES
// ==========================================

// ==========================================
// GET /api/admin/profiles
// Get all profiles (Admin only)
// ==========================================

router.get('/profiles',
  authMiddleware,
  adminMiddleware,
  listUsersValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: errors.array().map(e => e.msg)
        });
      }

      const { status, limit = 20, page = 1, search } = req.query;

      // TODO: Uncomment when Profile model is created
      /*
      let query = {};

      if (status) query.status = status;

      if (search) {
        query.$or = [
          { religion: { $regex: search, $options: 'i' } },
          { 'location.city': { $regex: search, $options: 'i' } },
          { occupation: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (page - 1) * limit;
      const profiles = await Profile.find(query)
        .populate('userId', 'firstName lastName email')
        .limit(parseInt(limit))
        .skip(skip)
        .sort({ createdAt: -1 })
        .lean();

      const total = await Profile.countDocuments(query);

      res.status(200).json({
        message: 'Profiles retrieved successfully',
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        },
        profiles: profiles.map(p => ({
          id: p._id,
          userName: `${p.userId.firstName} ${p.userId.lastName}`,
          userEmail: p.userId.email,
          gender: p.gender,
          religion: p.religion,
          caste: p.caste,
          city: p.location.city,
          status: p.status,
          createdAt: p.createdAt
        }))
      });
      */

      // Temporary response
      res.status(200).json({
        message: 'Profiles retrieved successfully',
        note: 'Profile model needs to be created first'
      });

    } catch (error) {
      console.error('Get profiles error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch profiles',
        message: error.message 
      });
    }
  }
);

// ==========================================
// PUT /api/admin/profiles/:profileId/status
// Update profile status (Admin only)
// ==========================================

router.put('/profiles/:profileId/status',
  authMiddleware,
  adminMiddleware,
  profileValidation,
  async (req, res) => {
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

      // TODO: Uncomment when Profile model is created
      /*
      const profile = await Profile.findById(profileId);

      if (!profile) {
        return res.status(404).json({ 
          error: 'Profile not found'
        });
      }

      profile.status = status;
      profile.statusReason = reason;
      profile.statusUpdatedBy = req.userId;
      profile.statusUpdatedAt = new Date();
      await profile.save();

      // TODO: Notify user about profile status change
      // TODO: Create audit log entry

      res.status(200).json({
        message: 'Profile status updated successfully',
        profile: {
          id: profile._id,
          status: profile.status
        }
      });
      */

      // Temporary response
      res.status(200).json({
        message: 'Profile status updated successfully',
        profileId,
        status: req.body.status
      });

    } catch (error) {
      console.error('Update profile status error:', error);
      res.status(500).json({ 
        error: 'Failed to update profile status',
        message: error.message 
      });
    }
  }
);

// ==========================================
// REPORT MANAGEMENT ROUTES
// ==========================================

// ==========================================
// GET /api/admin/reports
// Get all reports (Admin only)
// ==========================================

router.get('/reports',
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { status = 'pending', limit = 20, page = 1 } = req.query;

      // TODO: Uncomment when Report model is created
      /*
      let query = {};
      if (status !== 'all') query.status = status;

      const skip = (page - 1) * limit;
      const reports = await Report.find(query)
        .populate('reportedBy', 'firstName lastName')
        .populate('reportedUser', 'firstName lastName email')
        .limit(parseInt(limit))
        .skip(skip)
        .sort({ createdAt: -1 })
        .lean();

      const total = await Report.countDocuments(query);

      res.status(200).json({
        message: 'Reports retrieved successfully',
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        },
        reports: reports.map(r => ({
          id: r._id,
          reportedUser: r.reportedUser.firstName + ' ' + r.reportedUser.lastName,
          reportedBy: r.reportedBy.firstName + ' ' + r.reportedBy.lastName,
          reason: r.reason,
          description: r.description,
          status: r.status,
          createdAt: r.createdAt
        }))
      });
      */

      // Temporary response
      res.status(200).json({
        message: 'Reports retrieved successfully',
        note: 'Report model needs to be created first'
      });

    } catch (error) {
      console.error('Get reports error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch reports',
        message: error.message 
      });
    }
  }
);

// ==========================================
// PUT /api/admin/reports/:reportId
// Update report status (Admin only)
// ==========================================

router.put('/reports/:reportId',
  authMiddleware,
  adminMiddleware,
  reportValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: errors.array().map(e => e.msg)
        });
      }

      const { reportId } = req.params;
      const { action, notes } = req.body;

      // TODO: Uncomment when Report model is created
      /*
      const report = await Report.findById(reportId);

      if (!report) {
        return res.status(404).json({ 
          error: 'Report not found'
        });
      }

      report.status = action;
      report.notes = notes;
      report.reviewedBy = req.userId;
      report.reviewedAt = new Date();
      await report.save();

      // If approved, take action against reported user
      if (action === 'approve') {
        // TODO: Implement action (suspend, delete, etc.)
      }

      // TODO: Notify reporter about review status

      res.status(200).json({
        message: 'Report updated successfully',
        report: {
          id: report._id,
          status: report.status,
          reviewedAt: report.reviewedAt
        }
      });
      */

      // Temporary response
      res.status(200).json({
        message: 'Report updated successfully',
        reportId,
        action: req.body.action
      });

    } catch (error) {
      console.error('Update report error:', error);
      res.status(500).json({ 
        error: 'Failed to update report',
        message: error.message 
      });
    }
  }
);

// ==========================================
// SYSTEM MANAGEMENT ROUTES
// ==========================================

// ==========================================
// POST /api/admin/system/backup
// Create database backup (Superadmin only)
// ==========================================

router.post('/system/backup',
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      if (req.userRole !== 'superadmin') {
        return res.status(403).json({ 
          error: 'Forbidden',
          message: 'Only superadmin can create backups'
        });
      }

      // TODO: Implement database backup
      /*
      - Use MongoDB backup tools
      - Store in secure location
      - Log backup creation
      */

      res.status(200).json({
        message: 'Database backup initiated',
        timestamp: new Date(),
        backupId: `backup_${Date.now()}`
      });

    } catch (error) {
      console.error('Backup error:', error);
      res.status(500).json({ 
        error: 'Failed to create backup',
        message: error.message 
      });
    }
  }
);

// ==========================================
// GET /api/admin/system/logs
// Get system logs (Admin only)
// ==========================================

router.get('/system/logs',
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { limit = 100, page = 1, type } = req.query;

      // TODO: Implement log retrieval
      /*
      - Get logs from logging system
      - Filter by type (error, warning, info, debug)
      - Support pagination
      */

      res.status(200).json({
        message: 'System logs retrieved',
        note: 'Logging system needs to be configured',
        limit,
        page
      });

    } catch (error) {
      console.error('Get logs error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch logs',
        message: error.message 
      });
    }
  }
);

// ==========================================
// GET /api/admin/audit-trail
// Get audit trail (Admin only)
// ==========================================

router.get('/audit-trail',
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { limit = 50, page = 1, userId, action } = req.query;

      // TODO: Uncomment when AuditLog model is created
      /*
      let query = {};
      if (userId) query.performedBy = userId;
      if (action) query.action = action;

      const skip = (page - 1) * limit;
      const auditLogs = await AuditLog.find(query)
        .populate('performedBy', 'firstName lastName email')
        .limit(parseInt(limit))
        .skip(skip)
        .sort({ createdAt: -1 })
        .lean();

      const total = await AuditLog.countDocuments(query);

      res.status(200).json({
        message: 'Audit trail retrieved',
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        },
        auditLogs
      });
      */

      // Temporary response
      res.status(200).json({
        message: 'Audit trail retrieved',
        note: 'AuditLog model needs to be created first'
      });

    } catch (error) {
      console.error('Get audit trail error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch audit trail',
        message: error.message 
      });
    }
  }
);

// ==========================================
// HELPER FUNCTIONS
// ==========================================

// Calculate suspension end date from duration string
function calculateSuspensionEndDate(duration) {
  const now = new Date();
  const match = duration.match(/^(\d+)([dmh])$/);
  
  if (!match) return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // Default 30 days

  const amount = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case 'd': // days
      return new Date(now.getTime() + amount * 24 * 60 * 60 * 1000);
    case 'h': // hours
      return new Date(now.getTime() + amount * 60 * 60 * 1000);
    case 'm': // minutes
      return new Date(now.getTime() + amount * 60 * 1000);
    default:
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  }
}

// ==========================================
// EXPORT ROUTER & MIDDLEWARE
// ==========================================

module.exports = router;
