// ==========================================
// MESSAGES ROUTES
// New Kalyanamala Matrimony
// ==========================================

const express = require('express');
const router = express.Router();
const { body, validationResult, param, query } = require('express-validator');

// Import Models (will be created later)
// const Message = require('../models/Message');
// const Conversation = require('../models/Conversation');
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

const sendMessageValidation = [
  param('recipientId').isMongoId().withMessage('Invalid recipient ID'),
  body('content').trim().notEmpty().isLength({ min: 1, max: 1000 }).withMessage('Message must be 1-1000 characters'),
  body('type').optional().isIn(['text','image','document']).withMessage('Invalid message type')
];

const conversationValidation = [
  param('conversationId').isMongoId().withMessage('Invalid conversation ID')
];

const getMessagesValidation = [
  param('recipientId').isMongoId().withMessage('Invalid recipient ID'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive number'),
  query('from').optional().isISO8601().withMessage('Invalid from date')
];

const markReadValidation = [
  param('messageId').isMongoId().withMessage('Invalid message ID')
];

const deleteMessageValidation = [
  param('messageId').isMongoId().withMessage('Invalid message ID')
];

// ==========================================
// POST /api/messages/:recipientId
// Send a message (Protected)
// ==========================================

router.post('/:recipientId',
  authMiddleware,
  sendMessageValidation,
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
      const { content, type = 'text' } = req.body;
      const senderId = req.userId;

      // Prevent self-messaging
      if (senderId === recipientId) {
        return res.status(400).json({ 
          error: 'Invalid request',
          message: 'Cannot send message to yourself'
        });
      }

      // TODO: Uncomment when Message and Conversation models are created
      /*
      // Check if users are connected
      const Connection = require('../models/Connection');
      const connection = await Connection.findOne({
        $or: [
          { senderId, recipientId, status: 'accepted' },
          { senderId: recipientId, recipientId: senderId, status: 'accepted' }
        ]
      });

      if (!connection) {
        return res.status(403).json({ 
          error: 'Not connected',
          message: 'You must be connected to send messages'
        });
      }

      // Check if recipient has blocked sender
      const isBlocked = await Connection.findOne({
        senderId: recipientId,
        recipientId: senderId,
        status: 'blocked'
      });

      if (isBlocked) {
        return res.status(403).json({ 
          error: 'Blocked',
          message: 'You cannot send message to this user'
        });
      }

      // Find or create conversation
      let conversation = await Conversation.findOne({
        participants: {
          $all: [senderId,recipientId]
        }
      });

      if (!conversation) {
        conversation = new Conversation({
          participants: [senderId,recipientId],
          lastMessage: content,
          lastMessageAt: new Date(),
          createdAt: new Date()
        });
        await conversation.save();
      }

      // Create message
      const message = new Message({
        conversationId: conversation._id,
        senderId,
        recipientId,
        content,
        type,
        isRead: false,
        createdAt: new Date()
      });

      await message.save();

      // Update conversation
      conversation.lastMessage = content;
      conversation.lastMessageAt = new Date();
      await conversation.save();

      // TODO: Send real-time notification via WebSocket

      res.status(201).json({
        message: 'Message sent successfully',
        data: {
          id: message._id,
          conversationId: conversation._id,
          senderId: message.senderId,
          recipientId: message.recipientId,
          content: message.content,
          type: message.type,
          isRead: message.isRead,
          createdAt: message.createdAt
        }
      });
      */

      // Temporary response
      res.status(201).json({
        message: 'Message sent successfully',
        note: 'Message and Conversation models need to be created first',
        senderId,
        recipientId,
        content
      });

    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({ 
        error: 'Failed to send message',
        message: error.message 
      });
    }
  }
);

// ==========================================
// GET /api/messages/:recipientId
// Get messages with specific user (Protected)
// ==========================================

router.get('/:recipientId',
  authMiddleware,
  getMessagesValidation,
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
      const { limit = 20, page = 1, from } = req.query;
      const userId = req.userId;

      // TODO: Uncomment when Message model is created
      /*
      const skip = (page - 1) * limit;

      let query = {
        $or: [
          { senderId: userId, recipientId },
          { senderId: recipientId, recipientId: userId }
        ]
      };

      // Filter by date if provided
      if (from) {
        query.createdAt = { $gte: new Date(from) };
      }

      const messages = await Message.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .lean();

      const total = await Message.countDocuments(query);

      // Reverse to show oldest first
      messages.reverse();

      // Mark unread messages as read
      await Message.updateMany(
        {
          conversationId: messages[0]?.conversationId,
          recipientId: userId,
          isRead: false
        },
        { isRead: true }
      );

      res.status(200).json({
        message: 'Messages retrieved successfully',
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        },
        messages: messages.map(m => ({
          id: m._id,
          senderId: m.senderId,
          recipientId: m.recipientId,
          content: m.content,
          type: m.type,
          isRead: m.isRead,
          createdAt: m.createdAt
        }))
      });
      */

      // Temporary response
      res.status(200).json({
        message: 'Messages retrieved successfully',
        note: 'Message model needs to be created first',
        userId,
        recipientId
      });

    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch messages',
        message: error.message 
      });
    }
  }
);

// ==========================================
// GET /api/messages/conversations/list
// Get all conversations (Protected)
// ==========================================

router.get('/conversations/list',
  authMiddleware,
  async (req, res) => {
    try {
      const userId = req.userId;
      const { limit = 20, page = 1 } = req.query;

      // TODO: Uncomment when Conversation model is created
      /*
      const skip = (page - 1) * limit;

      const conversations = await Conversation.find({
        participants: userId
      })
        .populate('participants', 'firstName lastName email -_id')
        .sort({ lastMessageAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .lean();

      const total = await Conversation.countDocuments({
        participants: userId
      });

      res.status(200).json({
        message: 'Conversations retrieved successfully',
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        },
        conversations: conversations.map(c => {
          const otherParticipant = c.participants.find(p => p._id.toString() !== userId);
          
          return {
            id: c._id,
            otherUserId: otherParticipant._id,
            otherUserName: `${otherParticipant.firstName} ${otherParticipant.lastName}`,
            lastMessage: c.lastMessage,
            lastMessageAt: c.lastMessageAt,
            unreadCount: c.unreadCount || 0
          };
        })
      });
      */

      // Temporary response
      res.status(200).json({
        message: 'Conversations retrieved successfully',
        note: 'Conversation model needs to be created first',
        userId
      });

    } catch (error) {
      console.error('Get conversations error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch conversations',
        message: error.message 
      });
    }
  }
);

// ==========================================
// PUT /api/messages/:messageId/read
// Mark message as read (Protected)
// ==========================================

router.put('/:messageId/read',
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

      const { messageId } = req.params;
      const userId = req.userId;

      // TODO: Uncomment when Message model is created
      /*
      const message = await Message.findById(messageId);

      if (!message) {
        return res.status(404).json({ 
          error: 'Message not found'
        });
      }

      // Verify user is recipient
      if (message.recipientId.toString() !== userId) {
        return res.status(403).json({ 
          error: 'Unauthorized',
          message: 'You can only mark your own messages as read'
        });
      }

      message.isRead = true;
      message.readAt = new Date();
      await message.save();

      res.status(200).json({
        message: 'Message marked as read',
        data: {
          id: message._id,
          isRead: message.isRead,
          readAt: message.readAt
        }
      });
      */

      // Temporary response
      res.status(200).json({
        message: 'Message marked as read',
        messageId
      });

    } catch (error) {
      console.error('Mark read error:', error);
      res.status(500).json({ 
        error: 'Failed to mark message as read',
        message: error.message 
      });
    }
  }
);

// ==========================================
// PUT /api/messages/conversations/:conversationId/read
// Mark all messages in conversation as read (Protected)
// ==========================================

router.put('/conversations/:conversationId/read',
  authMiddleware,
  conversationValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: errors.array().map(e => e.msg)
        });
      }

      const { conversationId } = req.params;
      const userId = req.userId;

      // TODO: Uncomment when Message model is created
      /*
      // Verify user is part of conversation
      const conversation = await Conversation.findById(conversationId);

      if (!conversation) {
        return res.status(404).json({ 
          error: 'Conversation not found'
        });
      }

      if (!conversation.participants.includes(userId)) {
        return res.status(403).json({ 
          error: 'Unauthorized',
          message: 'You are not part of this conversation'
        });
      }

      // Mark all messages as read
      await Message.updateMany(
        {
          conversationId,
          recipientId: userId,
          isRead: false
        },
        {
          isRead: true,
          readAt: new Date()
        }
      );

      res.status(200).json({
        message: 'All messages marked as read',
        conversationId
      });
      */

      // Temporary response
      res.status(200).json({
        message: 'All messages marked as read',
        conversationId
      });

    } catch (error) {
      console.error('Mark conversation read error:', error);
      res.status(500).json({ 
        error: 'Failed to mark conversation as read',
        message: error.message 
      });
    }
  }
);

// ==========================================
// DELETE /api/messages/:messageId
// Delete a message (Protected)
// ==========================================

router.delete('/:messageId',
  authMiddleware,
  deleteMessageValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: errors.array().map(e => e.msg)
        });
      }

      const { messageId } = req.params;
      const userId = req.userId;

      // TODO: Uncomment when Message model is created
      /*
      const message = await Message.findById(messageId);

      if (!message) {
        return res.status(404).json({ 
          error: 'Message not found'
        });
      }

      // Verify user is sender
      if (message.senderId.toString() !== userId) {
        return res.status(403).json({ 
          error: 'Unauthorized',
          message: 'You can only delete your own messages'
        });
      }

      // Check if message is older than 1 hour
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (message.createdAt < hourAgo) {
        return res.status(400).json({ 
          error: 'Cannot delete',
          message: 'Messages can only be deleted within 1 hour of sending'
        });
      }

      // Soft delete - mark as deleted
      message.isDeleted = true;
      message.deletedAt = new Date();
      await message.save();

      res.status(200).json({
        message: 'Message deleted successfully'
      });
      */

      // Temporary response
      res.status(200).json({
        message: 'Message deleted successfully',
        messageId
      });

    } catch (error) {
      console.error('Delete message error:', error);
      res.status(500).json({ 
        error: 'Failed to delete message',
        message: error.message 
      });
    }
  }
);

// ==========================================
// POST /api/messages/conversations/:conversationId/delete
// Delete entire conversation (Protected)
// ==========================================

router.post('/conversations/:conversationId/delete',
  authMiddleware,
  conversationValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: errors.array().map(e => e.msg)
        });
      }

      const { conversationId } = req.params;
      const userId = req.userId;

      // TODO: Uncomment when Conversation model is created
      /*
      const conversation = await Conversation.findById(conversationId);

      if (!conversation) {
        return res.status(404).json({ 
          error: 'Conversation not found'
        });
      }

      // Verify user is part of conversation
      if (!conversation.participants.includes(userId)) {
        return res.status(403).json({ 
          error: 'Unauthorized',
          message: 'You are not part of this conversation'
        });
      }

      // Soft delete - mark as deleted for this user
      await Conversation.findByIdAndUpdate(
        conversationId,
        {
          $addToSet: { deletedBy: userId },
          deletedAt: new Date()
        }
      );

      res.status(200).json({
        message: 'Conversation deleted successfully'
      });
      */

      // Temporary response
      res.status(200).json({
        message: 'Conversation deleted successfully',
        conversationId
      });

    } catch (error) {
      console.error('Delete conversation error:', error);
      res.status(500).json({ 
        error: 'Failed to delete conversation',
        message: error.message 
      });
    }
  }
);

// ==========================================
// GET /api/messages/search
// Search messages (Protected)
// ==========================================

router.get('/search',
  authMiddleware,
  async (req, res) => {
    try {
      const userId = req.userId;
      const { keyword, recipientId, limit = 20, page = 1 } = req.query;

      if (!keyword) {
        return res.status(400).json({ 
          error: 'Validation failed',
          message: 'Search keyword is required'
        });
      }

      // TODO: Uncomment when Message model is created
      /*
      const skip = (page - 1) * limit;

      let query = {
        $or: [
          { senderId: userId },
          { recipientId: userId }
        ],
        content: { $regex: keyword, $options: 'i' }
      };

      if (recipientId) {
        query = {
          $or: [
            { senderId: userId, recipientId },
            { senderId: recipientId, recipientId: userId }
          ],
          content: { $regex: keyword, $options: 'i' }
        };
      }

      const messages = await Message.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .lean();

      const total = await Message.countDocuments(query);

      res.status(200).json({
        message: 'Search results',
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        },
        messages: messages.map(m => ({
          id: m._id,
          senderId: m.senderId,
          recipientId: m.recipientId,
          content: m.content,
          createdAt: m.createdAt
        }))
      });
      */

      // Temporary response
      res.status(200).json({
        message: 'Search results',
        note: 'Message model needs to be created first',
        keyword
      });

    } catch (error) {
      console.error('Search messages error:', error);
      res.status(500).json({ 
        error: 'Failed to search messages',
        message: error.message 
      });
    }
  }
);

// ==========================================
// POST /api/messages/:recipientId/typing
// Notify typing status (Protected)
// ==========================================

router.post('/:recipientId/typing',
  authMiddleware,
  param('recipientId').isMongoId().withMessage('Invalid recipient ID'),
  async (req, res) => {
    try {
      const { recipientId } = req.params;
      const senderId = req.userId;

      // TODO: Implement via WebSocket
      /*
      - Emit typing event to recipient in real-time
      - Include senderId and isTyping status
      - Stop typing after 3 seconds of inactivity
      */

      res.status(200).json({
        message: 'Typing status updated',
        senderId,
        recipientId,
        isTyping: true
      });

    } catch (error) {
      console.error('Typing status error:', error);
      res.status(500).json({ 
        error: 'Failed to update typing status',
        message: error.message 
      });
    }
  }
);

// ==========================================
// EXPORT ROUTER
// ==========================================

module.exports = router;
