// ==========================================
// NOTIFICATIONS ROUTES
// New Kalyanamala Matrimony
// ==========================================

const express = require('express');
const router = express.Router();
const { body, validationResult, param, query } = require('express-validator');

// Import Models (will be created later)
// const Notification = require('../models/Notification');
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

const listNotificationsValidation = [
  query('status').optional().isIn(['read','unread','all']).withMessage('Invalid status'),
  query('type').optional().isIn(['connection_request','connection_accepted','message','profile_view','like','system']).withMessage('Invalid notification type'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive number')
];

const markReadValidation = [
  param('notificationId').isMongoId().withMessage('Invalid notification ID')
];

const deleteNotificationValidation = [
  param('notificationId').isMongoId().withMessage('Invalid notification ID')
];

const notificationPreferencesValidation = [
  body('email_notifications').optional().isBoolean().withMessage('Must be boolean'),
  body('push_notifications').optional().isBoolean().withMessage('Must be boolean'),
  body('sms_notifications').optional().isBoolean().withMessage('Must be boolean'),
  body('notification_frequency').optional().isIn(['immediate','daily','weekly','never']).withMessage('Invalid frequency'),
  body('notify_connection_requests').optional().isBoolean().withMessage('Must be boolean'),
  body('notify_messages').optional().isBoolean().withMessage('Must be boolean'),
  body('notify_profile_views').optional().isBoolean().withMessage('Must be boolean'),
  body('notify_likes').optional().isBoolean().withMessage('Must be boolean'),
  body('notify_system').optional().isBoolean().withMessage('Must be boolean')
];

// ==========================================
// GET /api/notifications
// Get all notifications (Protected)
// ==========================================

router.get('/',
  authMiddleware,
  listNotificationsValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: errors.array().map(e => e.msg)
        });
      }

      const userId = req.userId;
      const { status = 'all', type, limit = 20, page = 1 } = req.query;

      // TODO: Uncomment when Notification model is created
      /*
      let query = { userId };

      if (status === 'read') {
        query.isRead = true;
      } else if (status === 'unread') {
        query.isRead = false;
      }

      if (type) {
        query.type = type;
      }

      const skip = (page - 1) * limit;
      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .lean();

      const total = await Notification.countDocuments(query);

      // Get count of unread notifications
      const unreadCount = await Notification.countDocuments({
        userId,
        isRead: false
      });

      res.status(200).json({
        message: 'Notifications retrieved successfully',
        unreadCount,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        },
        notifications: notifications.map(n => ({
          id: n._id,
          type: n.type,
          title: n.title,
          message: n.message,
          relatedUserId: n.relatedUserId,
          relatedProfileId: n.relatedProfileId,
          data: n.data,
          isRead: n.isRead,
          createdAt: n.createdAt,
          readAt: n.readAt
        }))
      });
      */

      // Temporary response
      res.status(200).json({
        message: 'Notifications retrieved successfully',
        note: 'Notification model needs to be created first',
        userId,
        status
      });

    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch notifications',
        message: error.message 
      });
    }
  }
);

// ==========================================
// GET /api/notifications/unread/count
// Get unread notifications count (Protected)
// ==========================================

router.get('/unread/count', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    // TODO: Uncomment when Notification model is created
    /*
    const unreadCount = await Notification.countDocuments({
      userId,
      isRead: false
    });

    // Also get breakdown by type
    const breakdown = await Notification.aggregate([
      { $match: { userId, isRead: false } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      unreadCount,
      breakdown: breakdown.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    });
    */

    // Temporary response
    res.status(200).json({
      unreadCount: 0,
      breakdown: {},
      note: 'Notification model needs to be created first'
    });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ 
      error: 'Failed to get unread count',
      message: error.message 
    });
  }
});

// ==========================================
// PUT /api/notifications/:notificationId/read
// Mark notification as read (Protected)
// ==========================================

router.put('/:notificationId/read',
  authMiddleware,
  markReadValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: errors.array().map(e => e.msg)
        });
      }

      const { notificationId } = req.params;
      const userId = req.userId;

      // TODO: Uncomment when Notification model is created
      /*
      const notification = await Notification.findById(notificationId);

      if (!notification) {
        return res.status(404).json({ 
          error: 'Notification not found'
        });
      }

      // Verify user owns notification
      if (notification.userId.toString() !== userId) {
        return res.status(403).json({ 
          error: 'Unauthorized',
          message: 'You can only mark your own notifications as read'
        });
      }

      notification.isRead = true;
      notification.readAt = new Date();
      await notification.save();

      res.status(200).json({
        message: 'Notification marked as read',
        notification: {
          id: notification._id,
          isRead: notification.isRead,
          readAt: notification.readAt
        }
      });
      */

      // Temporary response
      res.status(200).json({
        message: 'Notification marked as read',
        notificationId
      });

    } catch (error) {
      console.error('Mark read error:', error);
      res.status(500).json({ 
        error: 'Failed to mark notification as read',
        message: error.message 
      });
    }
  }
);

// ==========================================
// PUT /api/notifications/read-all
// Mark all notifications as read (Protected)
// ==========================================

router.put('/read-all', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    // TODO: Uncomment when Notification model is created
    /*
    await Notification.updateMany(
      { userId, isRead: false },
      { 
        isRead: true,
        readAt: new Date()
      }
    );

    res.status(200).json({
      message: 'All notifications marked as read'
    });
    */

    // Temporary response
    res.status(200).json({
      message: 'All notifications marked as read',
      userId
    });

  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ 
      error: 'Failed to mark all notifications as read',
      message: error.message 
    });
  }
});

// ==========================================
// DELETE /api/notifications/:notificationId
// Delete a notification (Protected)
// ==========================================

router.delete('/:notificationId',
  authMiddleware,
  deleteNotificationValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: errors.array().map(e => e.msg)
        });
      }

      const { notificationId } = req.params;
      const userId = req.userId;

      // TODO: Uncomment when Notification model is created
      /*
      const notification = await Notification.findById(notificationId);

      if (!notification) {
        return res.status(404).json({ 
          error: 'Notification not found'
        });
      }

      // Verify user owns notification
      if (notification.userId.toString() !== userId) {
        return res.status(403).json({ 
          error: 'Unauthorized',
          message: 'You can only delete your own notifications'
        });
      }

      await Notification.findByIdAndDelete(notificationId);

      res.status(200).json({
        message: 'Notification deleted successfully'
      });
      */

      // Temporary response
      res.status(200).json({
        message: 'Notification deleted successfully',
        notificationId
      });

    } catch (error) {
      console.error('Delete notification error:', error);
      res.status(500).json({ 
        error: 'Failed to delete notification',
        message: error.message 
      });
    }
  }
);

// ==========================================
// DELETE /api/notifications/delete-all
// Delete all notifications (Protected)
// ==========================================

router.delete('/delete-all', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    // TODO: Uncomment when Notification model is created
    /*
    await Notification.deleteMany({ userId });

    res.status(200).json({
      message: 'All notifications deleted successfully'
    });
    */

    // Temporary response
    res.status(200).json({
      message: 'All notifications deleted successfully',
      userId
    });

  } catch (error) {
    console.error('Delete all notifications error:', error);
    res.status(500).json({ 
      error: 'Failed to delete all notifications',
      message: error.message 
    });
  }
});

// ==========================================
// GET /api/notifications/preferences
// Get notification preferences (Protected)
// ==========================================

router.get('/preferences', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    // TODO: Uncomment when NotificationPreference model is created
    /*
    let preferences = await NotificationPreference.findOne({ userId });

    if (!preferences) {
      // Create default preferences
      preferences = new NotificationPreference({
        userId,
        email_notifications: true,
        push_notifications: true,
        sms_notifications: false,
        notification_frequency: 'immediate',
        notify_connection_requests: true,
        notify_messages: true,
        notify_profile_views: true,
        notify_likes: true,
        notify_system: true
      });
      await preferences.save();
    }

    res.status(200).json({
      message: 'Notification preferences retrieved',
      preferences: {
        email_notifications: preferences.email_notifications,
        push_notifications: preferences.push_notifications,
        sms_notifications: preferences.sms_notifications,
        notification_frequency: preferences.notification_frequency,
        notify_connection_requests: preferences.notify_connection_requests,
        notify_messages: preferences.notify_messages,
        notify_profile_views: preferences.notify_profile_views,
        notify_likes: preferences.notify_likes,
        notify_system: preferences.notify_system
      }
    });
    */

    // Temporary response
    res.status(200).json({
      message: 'Notification preferences retrieved',
      preferences: {
        email_notifications: true,
        push_notifications: true,
        sms_notifications: false,
        notification_frequency: 'immediate',
        notify_connection_requests: true,
        notify_messages: true,
        notify_profile_views: true,
        notify_likes: true,
        notify_system: true
      },
      note: 'NotificationPreference model needs to be created first'
    });

  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch preferences',
      message: error.message 
    });
  }
});

// ==========================================
// PUT /api/notifications/preferences
// Update notification preferences (Protected)
// ==========================================

router.put('/preferences',
  authMiddleware,
  notificationPreferencesValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: errors.array().map(e => e.msg)
        });
      }

      const userId = req.userId;
      const updates = req.body;

      // TODO: Uncomment when NotificationPreference model is created
      /*
      let preferences = await NotificationPreference.findOne({ userId });

      if (!preferences) {
        preferences = new NotificationPreference({ userId });
      }

      // Update preferences
      Object.assign(preferences, updates);
      preferences.updatedAt = new Date();
      await preferences.save();

      res.status(200).json({
        message: 'Notification preferences updated successfully',
        preferences: {
          email_notifications: preferences.email_notifications,
          push_notifications: preferences.push_notifications,
          sms_notifications: preferences.sms_notifications,
          notification_frequency: preferences.notification_frequency,
          notify_connection_requests: preferences.notify_connection_requests,
          notify_messages: preferences.notify_messages,
          notify_profile_views: preferences.notify_profile_views,
          notify_likes: preferences.notify_likes,
          notify_system: preferences.notify_system
        }
      });
      */

      // Temporary response
      res.status(200).json({
        message: 'Notification preferences updated successfully',
        preferences: updates,
        note: 'NotificationPreference model needs to be created first'
      });

    } catch (error) {
      console.error('Update preferences error:', error);
      res.status(500).json({ 
        error: 'Failed to update preferences',
        message: error.message 
      });
    }
  }
);

// ==========================================
// POST /api/notifications/test
// Send test notification (Protected - Admin only)
// ==========================================

router.post('/test', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    // TODO: Implement test notification
    /*
    - Create test notification
    - Send to user
    - Use for testing notification system
    */

    res.status(200).json({
      message: 'Test notification sent successfully',
      notification: {
        type: 'system',
        title: 'Test Notification',
        message: 'This is a test notification from Kalyanamala',
        createdAt: new Date()
      }
    });

  } catch (error) {
    console.error('Send test notification error:', error);
    res.status(500).json({ 
      error: 'Failed to send test notification',
      message: error.message 
    });
  }
});

// ==========================================
// GET /api/notifications/by-type/:type
// Get notifications by type (Protected)
// ==========================================

router.get('/by-type/:type',
  authMiddleware,
  async (req, res) => {
    try {
      const { type } = req.params;
      const validTypes = ['connection_request','connection_accepted','message','profile_view','like','system'];

      if (!validTypes.includes(type)) {
        return res.status(400).json({ 
          error: 'Invalid notification type',
          message: `Type must be one of: ${validTypes.join(', ')}`
        });
      }

      const userId = req.userId;
      const { limit = 20, page = 1 } = req.query;

      // TODO: Uncomment when Notification model is created
      /*
      const skip = (page - 1) * limit;
      const notifications = await Notification.find({
        userId,
        type
      })
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .lean();

      const total = await Notification.countDocuments({
        userId,
        type
      });

      res.status(200).json({
        message: `${type} notifications retrieved`,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        },
        notifications: notifications.map(n => ({
          id: n._id,
          type: n.type,
          title: n.title,
          message: n.message,
          isRead: n.isRead,
          createdAt: n.createdAt
        }))
      });
      */

      // Temporary response
      res.status(200).json({
        message: `${type} notifications retrieved`,
        type,
        note: 'Notification model needs to be created first'
      });

    } catch (error) {
      console.error('Get notifications by type error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch notifications',
        message: error.message 
      });
    }
  }
);

// ==========================================
// HELPER FUNCTION - Create Notification
// Used internally by other routes
// ==========================================

async function createNotification(userId, type, title, message, data = {}) {
  try {
    // TODO: Uncomment when Notification model is created
    /*
    const notification = new Notification({
      userId,
      type,
      title,
      message,
      data,
      isRead: false,
      createdAt: new Date()
    });

    await notification.save();

    // Check user preferences
    const preferences = await NotificationPreference.findOne({ userId });
    
    // Send based on preferences and type
    // TODO: Send email, push notification, SMS, etc.

    return notification;
    */
  } catch (error) {
    console.error('Create notification error:', error);
  }
}

// ==========================================
// EXPORT ROUTER & HELPER FUNCTION
// ==========================================

module.exports = router;
module.exports.createNotification = createNotification;
