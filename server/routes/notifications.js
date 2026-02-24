import express from 'express';
import { body, validationResult, query } from 'express-validator';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { sendNotification, broadcastNotification, sendEmail } from '../utils/notificationService.js';

const router = express.Router();

// Get user notifications
router.get('/', authenticate, [
  query('status').optional().isString(),
  query('type').optional().isString(),
  query('unread').optional().isBoolean(),
  query('channel').optional().isString(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const filter = { userId: req.user._id };
    const { status, type, unread, channel, page = 1, limit = 20 } = req.query;

    if (status) filter.status = status;
    if (type) filter.type = type;
    if (unread === 'true') filter.readAt = { $exists: false };
    // Default to in_app channel for notification center
    if (channel) {
      filter.channel = channel;
    } else {
      filter.channel = 'in_app'; // Only show in-app notifications by default
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({ ...filter, readAt: { $exists: false } });

    res.json({
      notifications,
      unreadCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get notification by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ notification });
  } catch (error) {
    console.error('Get notification error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark as read
router.post('/:id/read', authenticate, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    notification.readAt = new Date();
    notification.status = 'read';
    await notification.save();

    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark all as read
router.post('/read-all', authenticate, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user._id, readAt: { $exists: false } },
      { $set: { readAt: new Date(), status: 'read' } }
    );

    res.json({ message: 'All notifications marked as read', count: result.modifiedCount });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete notification
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (notification.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await notification.deleteOne();

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create notification (admin only)
router.post('/', authenticate, authorize('admin'), [
  body('userId').optional().isMongoId().withMessage('Valid userId required'),
  body('type').isString().withMessage('Type is required'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('message').trim().notEmpty().withMessage('Message is required'),
  body('channel').optional().isIn(['email', 'in_app', 'sms', 'push']).withMessage('Invalid channel'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const notification = new Notification({
      ...req.body,
      channel: req.body.channel || 'in_app',
    });

    await notification.save();

    // Emit Socket.IO event
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${req.body.userId}`).emit('notification', notification);
    }

    res.status(201).json({ message: 'Notification created', notification });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Broadcast notification to all users (admin only)
router.post('/broadcast/all', authenticate, authorize('admin'), [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('message').trim().notEmpty().withMessage('Message is required'),
  body('type').optional().isString().withMessage('Type must be a string'),
  body('channels').optional().isArray().withMessage('Channels must be an array'),
  body('userRole').optional().isIn(['user', 'admin', 'manager']).withMessage('Invalid user role filter'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const {
      title,
      message,
      type = 'system_alert',
      channels = ['in_app', 'email'],
      userRole,
    } = req.body;

    // Build filter
    const filter = {};
    if (userRole) {
      filter.role = userRole;
    }

    // Send broadcast
    const notifications = await broadcastNotification({
      title,
      message,
      type,
      channels,
      filter,
    });

    // Emit Socket.IO event to all connected clients
    const io = req.app.get('io');
    if (io) {
      io.emit('broadcast_notification', {
        title,
        message,
        type,
        createdAt: new Date(),
      });
    }

    res.status(201).json({
      message: `Broadcast sent to ${notifications.length} users`,
      count: notifications.length,
      notifications: notifications.slice(0, 10), // Return first 10 as sample
    });
  } catch (error) {
    console.error('Broadcast notification error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send notification to specific user (admin only)
router.post('/send/:userId', authenticate, authorize('admin'), [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('message').trim().notEmpty().withMessage('Message is required'),
  body('type').optional().isString().withMessage('Type must be a string'),
  body('channels').optional().isArray().withMessage('Channels must be an array'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const {
      title,
      message,
      type = 'system_alert',
      channels = ['in_app', 'email'],
    } = req.body;

    const notifications = await sendNotification({
      userId: req.params.userId,
      title,
      message,
      type,
      channels,
    });

    // Emit Socket.IO event
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${req.params.userId}`).emit('notification', notifications[0]);
    }

    res.status(201).json({
      message: 'Notification sent',
      notifications,
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;

