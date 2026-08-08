// ==========================================
// CONNECTIONS ROUTES
// New Kalyanamala Matrimony
// ==========================================

const express = require('express');
const router = express.Router();
const { body, validationResult, param, query } = require('express-validator');

// Import Models (will be created later)
// const Connection = require('../models/Connection');
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

const sendConnectionValidation = [
  param('recipientId').isMongoId().withMessage('Invalid recipient ID'),
  body('message').optional().trim().isLength({ max: 200 }).withMessage('Message max 200 characters')
];

const connectionActionValidation = [
  param('connectionId').isMongoId().withMessage('Invalid connection ID')
];

const listConnectionsValidation = [
  query('status').optional().isIn(['pending','accepted','rejected','blocked']).withMessage('Invalid status'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive number')
];

const blockUnblockValidation = [
  param('userId').isMongoId().withMessage('Invalid user ID')
];

// ==========================================
// POST /api/connections/send/:recipientId
// Send connection request (Protected)
// ==========================================

router.post('/send/:recipientId',
  authMiddleware,
  sendConnectionValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: errors.array().map(e => e.msg)
        });
      }

      const { recipientId } = req.params;
      const { message } = req.body;
      const senderId = req.userId;

      // Prevent self-connection
      if (senderId === recipientId) {
        return res.status(400).json({ 
          error: 'Invalid request',
          message: 'Cannot send connection request to yourself'
        });
      }

      // TODO: Uncomment when Connection model is created
      /*
      // Check if connection already exists
      const existingConnection = await Connection.findOne({
        $or: [
          { senderId, recipientId },
          { senderId: recipientId, recipientId: senderId }
        ]
      });

      if (existingConnection) {
        return res.status(400).json({ 
          error: 'Connection exists',
          message: `Connection status: ${existingConnection.status}`
        });
      }

      // Check if user is blocked
      const isBlocked = await Connection.findOne({
        senderId: recipientId,
        recipientId: senderId,
        status: 'blocked'
      });

      if (isBlocked) {
        return res.status(403).json({ 
          error: 'Blocked',
          message: 'You cannot send request to this user'
        });
      }

      // Create connection request
      const connection = new Connection({
        senderId,
        recipientId,
        status: 'pending',
        message,
        sentAt: new Date(),
        createdAt: new Date()
      });

      await connection.save();

      // TODO: Send notification to recipient

      res.status(201).json({
        message: 'Connection request sent successfully',
        connection: {
          id: connection._id,
          recipientId: connection.recipientId,
          status: connection.status,
          sentAt: connection.sentAt
        }
      });
      */

      // Temporary response
      res.status(201).json({
        message: 'Connection request sent successfully',
        note: 'Connection model needs to be created first',
        senderId,
        recipientId
      });

    } catch (error) {
      console.error('Send connection error:', error);
      res.status(500).json({ 
        error: 'Failed to send connection request',
        message: error.message 
      });
    }
  }
);

// ==========================================
// PUT /api/connections/:connectionId/accept
// Accept connection request (Protected)
// ==========================================

router.put('/:connectionId/accept',
  authMiddleware,
  connectionActionValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: errors.array().map(e => e.msg)
        });
      }

      const { connectionId } = req.params;
      const userId = req.userId;

      // TODO: Uncomment when Connection model is created
      /*
      const connection = await Connection.findById(connectionId);

      if (!connection) {
        return res.status(404).json({ 
          error: 'Connection not found'
        });
      }

      // Verify user is the recipient
      if (connection.recipientId.toString() !== userId) {
        return res.status(403).json({ 
          error: 'Unauthorized',
          message: 'You can only accept requests sent to you'
        });
      }

      // Check if already accepted
      if (connection.status !== 'pending') {
        return res.status(400).json({ 
          error: 'Invalid request',
          message: `Connection is already ${connection.status}`
        });
      }

      // Update connection status
      connection.status = 'accepted';
      connection.acceptedAt = new Date();
      await connection.save();

      // TODO: Send notification to sender

      res.status(200).json({
        message: 'Connection request accepted',
        connection: {
          id: connection._id,
          senderId: connection.senderId,
          recipientId: connection.recipientId,
          status: connection.status,
          acceptedAt: connection.acceptedAt
        }
      });
      */

      // Temporary response
      res.status(200).json({
        message: 'Connection request accepted',
        note: 'Connection model needs to be created first',
        connectionId
      });

    } catch (error) {
      console.error('Accept connection error:', error);
      res.status(500).json({ 
        error: 'Failed to accept connection',
        message: error.message 
      });
    }
  }
);

// ==========================================
// PUT /api/connections/:connectionId/reject
// Reject connection request (Protected)
// ==========================================

router.put('/:connectionId/reject',
  authMiddleware,
  connectionActionValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: errors.array().map(e => e.msg)
        });
      }

      const { connectionId } = req.params;
      const userId = req.userId;

      // TODO: Uncomment when Connection model is created
      /*
      const connection = await Connection.findById(connectionId);

      if (!connection) {
        return res.status(404).json({ 
          error: 'Connection not found'
        });
      }

      // Verify user is the recipient
      if (connection.recipientId.toString() !== userId) {
        return res.status(403).json({ 
          error: 'Unauthorized',
          message: 'You can only reject requests sent to you'
        });
      }

      // Check if already processed
      if (connection.status !== 'pending') {
        return res.status(400).json({ 
          error: 'Invalid request',
          message: `Connection is already ${connection.status}`
        });
      }

      // Update connection status
      connection.status = 'rejected';
      connection.rejectedAt = new Date();
      await connection.save();

      res.status(200).json({
        message: 'Connection request rejected',
        connection: {
          id: connection._id,
          status: connection.status,
          rejectedAt: connection.rejectedAt
        }
      });
      */

      // Temporary response
      res.status(200).json({
        message: 'Connection request rejected',
        connectionId
      });

    } catch (error) {
      console.error('Reject connection error:', error);
      res.status(500).json({ 
        error: 'Failed to reject connection',
        message: error.message 
      });
    }
  }
);

// ==========================================
// GET /api/connections/received
// Get received connection requests (Protected)
// ==========================================

router.get('/received',
  authMiddleware,
  listConnectionsValidation,
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
      const { status, limit = 10, page = 1 } = req.query;

      // TODO: Uncomment when Connection model is created
      /*
      let query = { recipientId: userId };

      if (status) {
        query.status = status;
      }

      const skip = (page - 1) * limit;
      const connections = await Connection.find(query)
        .populate('senderId', 'firstName lastName email')
        .populate('recipientId', 'firstName lastName email')
        .sort({ sentAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .lean();

      const total = await Connection.countDocuments(query);

      res.status(200).json({
        message: 'Received connection requests',
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        },
        connections: connections.map(c => ({
          id: c._id,
          senderId: c.senderId._id,
          senderName: `${c.senderId.firstName} ${c.senderId.lastName}`,
          senderEmail: c.senderId.email,
          status: c.status,
          message: c.message,
          sentAt: c.sentAt
        }))
      });
      */

      // Temporary response
      res.status(200).json({
        message: 'Received connection requests endpoint ready',
        userId,
        note: 'Connection model needs to be created first'
      });

    } catch (error) {
      console.error('Get received connections error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch received requests',
        message: error.message 
      });
    }
  }
);

// ==========================================
// GET /api/connections/sent
// Get sent connection requests (Protected)
// ==========================================

router.get('/sent',
  authMiddleware,
  listConnectionsValidation,
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
      const { status, limit = 10, page = 1 } = req.query;

      // TODO: Uncomment when Connection model is created
      /*
      let query = { senderId: userId };

      if (status) {
        query.status = status;
      }

      const skip = (page - 1) * limit;
      const connections = await Connection.find(query)
        .populate('recipientId', 'firstName lastName email')
        .sort({ sentAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .lean();

      const total = await Connection.countDocuments(query);

      res.status(200).json({
        message: 'Sent connection requests',
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        },
        connections: connections.map(c => ({
          id: c._id,
          recipientId: c.recipientId._id,
          recipientName: `${c.recipientId.firstName} ${c.recipientId.lastName}`,
          recipientEmail: c.recipientId.email,
          status: c.status,
          sentAt: c.sentAt
        }))
      });
      */

      // Temporary response
      res.status(200).json({
        message: 'Sent connection requests endpoint ready',
        userId
      });

    } catch (error) {
      console.error('Get sent connections error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch sent requests',
        message: error.message 
      });
    }
  }
);

// ==========================================
// GET /api/connections/accepted
// Get accepted connections (Protected)
// ==========================================

router.get('/accepted',
  authMiddleware,
  listConnectionsValidation,
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
      const { limit = 10, page = 1 } = req.query;

      // TODO: Uncomment when Connection model is created
      /*
      const skip = (page - 1) * limit;
      const connections = await Connection.find({
        $or: [
          { senderId: userId, status: 'accepted' },
          { recipientId: userId, status: 'accepted' }
        ]
      })
        .populate('senderId', 'firstName lastName email')
        .populate('recipientId', 'firstName lastName email')
        .sort({ acceptedAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .lean();

      const total = await Connection.countDocuments({
        $or: [
          { senderId: userId, status: 'accepted' },
          { recipientId: userId, status: 'accepted' }
        ]
      });

      res.status(200).json({
        message: 'Accepted connections',
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        },
        connections: connections.map(c => {
          const isInitiator = c.senderId._id.toString() === userId;
          const otherUser = isInitiator ? c.recipientId : c.senderId;
          
          return {
            id: c._id,
            connectedUserId: otherUser._id,
            connectedUserName: `${otherUser.firstName} ${otherUser.lastName}`,
            connectedUserEmail: otherUser.email,
            acceptedAt: c.acceptedAt,
            canMessage: true
          };
        })
      });
      */

      // Temporary response
      res.status(200).json({
        message: 'Accepted connections endpoint ready',
        userId
      });

    } catch (error) {
      console.error('Get accepted connections error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch accepted connections',
        message: error.message 
      });
    }
  }
);

// ==========================================
// POST /api/connections/block/:userId
// Block a user (Protected)
// ==========================================

router.post('/block/:userId',
  authMiddleware,
  blockUnblockValidation,
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
      const blockerId = req.userId;

      if (blockerId === userId) {
        return res.status(400).json({ 
          error: 'Invalid request',
          message: 'Cannot block yourself'
        });
      }

      // TODO: Uncomment when Connection model is created
      /*
      // Check if already blocked
      const existingBlock = await Connection.findOne({
        senderId: blockerId,
        recipientId: userId,
        status: 'blocked'
      });

      if (existingBlock) {
        return res.status(400).json({ 
          error: 'Already blocked',
          message: 'User is already blocked'
        });
      }

      // Create block connection
      const connection = new Connection({
        senderId: blockerId,
        recipientId: userId,
        status: 'blocked',
        blockedAt: new Date(),
        createdAt: new Date()
      });

      await connection.save();

      res.status(201).json({
        message: 'User blocked successfully',
        connection: {
          id: connection._id,
          blockedUserId: connection.recipientId,
          status: connection.status,
          blockedAt: connection.blockedAt
        }
      });
      */

      // Temporary response
      res.status(201).json({
        message: 'User blocked successfully',
        blockerId,
        blockedUserId: userId
      });

    } catch (error) {
      console.error('Block user error:', error);
      res.status(500).json({ 
        error: 'Failed to block user',
        message: error.message 
      });
    }
  }
);

// ==========================================
// DELETE /api/connections/unblock/:userId
// Unblock a user (Protected)
// ==========================================

router.delete('/unblock/:userId',
  authMiddleware,
  blockUnblockValidation,
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
      const blockerId = req.userId;

      // TODO: Uncomment when Connection model is created
      /*
      const blockConnection = await Connection.findOneAndDelete({
        senderId: blockerId,
        recipientId: userId,
        status: 'blocked'
      });

      if (!blockConnection) {
        return res.status(404).json({ 
          error: 'Not blocked',
          message: 'User is not in your blocked list'
        });
      }

      res.status(200).json({
        message: 'User unblocked successfully',
        unblockedUserId: userId
      });
      */

      // Temporary response
      res.status(200).json({
        message: 'User unblocked successfully',
        unblockedUserId: userId
      });

    } catch (error) {
      console.error('Unblock user error:', error);
      res.status(500).json({ 
        error: 'Failed to unblock user',
        message: error.message 
      });
    }
  }
);

// ==========================================
// GET /api/connections/blocked
// Get list of blocked users (Protected)
// ==========================================

router.get('/blocked',
  authMiddleware,
  listConnectionsValidation,
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
      const { limit = 10, page = 1 } = req.query;

      // TODO: Uncomment when Connection model is created
      /*
      const skip = (page - 1) * limit;
      const blockedConnections = await Connection.find({
        senderId: userId,
        status: 'blocked'
      })
        .populate('recipientId', 'firstName lastName email')
        .limit(parseInt(limit))
        .skip(skip)
        .lean();

      const total = await Connection.countDocuments({
        senderId: userId,
        status: 'blocked'
      });

      res.status(200).json({
        message: 'Blocked users list',
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        },
        blockedUsers: blockedConnections.map(c => ({
          id: c._id,
          blockedUserId: c.recipientId._id,
          blockedUserName: `${c.recipientId.firstName} ${c.recipientId.lastName}`,
          blockedUserEmail: c.recipientId.email,
          blockedAt: c.blockedAt
        }))
      });
      */

      // Temporary response
      res.status(200).json({
        message: 'Blocked users list endpoint ready',
        userId
      });

    } catch (error) {
      console.error('Get blocked users error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch blocked users',
        message: error.message 
      });
    }
  }
);

// ==========================================
// DELETE /api/connections/:connectionId
// Delete/Disconnect a connection (Protected)
// ==========================================

router.delete('/:connectionId',
  authMiddleware,
  connectionActionValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: errors.array().map(e => e.msg)
        });
      }

      const { connectionId } = req.params;
      const userId = req.userId;

      // TODO: Uncomment when Connection model is created
      /*
      const connection = await Connection.findById(connectionId);

      if (!connection) {
        return res.status(404).json({ 
          error: 'Connection not found'
        });
      }

      // Verify user is part of the connection
      if (connection.senderId.toString() !== userId && connection.recipientId.toString() !== userId) {
        return res.status(403).json({ 
          error: 'Unauthorized',
          message: 'You are not part of this connection'
        });
      }

      // Soft delete - mark as disconnected
      connection.status = 'disconnected';
      connection.disconnectedAt = new Date();
      await connection.save();

      res.status(200).json({
        message: 'Connection removed successfully'
      });
      */

      // Temporary response
      res.status(200).json({
        message: 'Connection removed successfully',
        connectionId
      });

    } catch (error) {
      console.error('Delete connection error:', error);
      res.status(500).json({ 
        error: 'Failed to delete connection',
        message: error.message 
      });
    }
  }
);

// ==========================================
// EXPORT ROUTER
// ==========================================

module.exports = router;
