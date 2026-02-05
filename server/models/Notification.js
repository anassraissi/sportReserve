import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  type: {
    type: String,
    required: true,
    enum: [
      'booking_confirmation',
      'booking_reminder',
      'booking_cancellation',
      'payment_receipt',
      'approval_required',
      'system_alert',
      'promotional',
      'maintenance_notice',
    ],
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  data: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
  },
  channel: {
    type: String,
    enum: ['email', 'sms', 'push', 'in_app'],
    default: 'email',
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'read', 'failed', 'bounced'],
    default: 'pending',
  },
  scheduledFor: Date,
  sentAt: Date,
  readAt: Date,
  errorMessage: String,
  retryCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Indexes
notificationSchema.index({ userId: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ status: 1 });
notificationSchema.index({ scheduledFor: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;








