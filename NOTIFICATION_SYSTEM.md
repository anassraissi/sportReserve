# 📢 Notification System Guide

## Overview
The sportReserve notification system provides:
- ✅ **Automatic reservation confirmations** - Sent immediately after booking
- ⏰ **Reminder notifications** - 3 hours before reservation start time
- ❌ **Cancellation notifications** - When a reservation is cancelled
- 📧 **Multi-channel delivery** - Email + In-app notifications
- 📣 **Admin broadcasts** - Send messages to all/filtered users
- 🗓️ **Scheduled delivery** - Schedule notifications for future delivery

---

## Features

### 1. **Automatic Reservation Notifications**

#### Confirmation (Instant)
- **When**: Immediately after booking
- **Recipients**: User who made the booking
- **Channels**: Email + In-app
- **Includes**: Resource details, date/time, confirmation number

#### Reminder (3 hours before)
- **When**: 3 hours before reservation start time
- **Recipients**: User with the reservation
- **Channels**: Email + In-app (optional)
- **Content**: Gentle reminder with location and preparation tips

#### Cancellation (Instant)
- **When**: When a reservation is cancelled
- **Recipients**: User who made the booking
- **Channels**: Email + In-app
- **Includes**: Cancellation reason, refund information

### 2. **Admin Broadcast Notifications**

Admins can send notifications to:
- All users
- Users of specific roles (admin, manager, user)
- Custom filtered user groups

**Channels available**:
- 📱 In-app notifications (real-time)
- 📧 Email notifications

**Access**: Admin Dashboard → Broadcast Notification button

### 3. **Scheduled Notifications**

Notifications can be:
- Scheduled for future delivery
- Automatically processed by scheduled job runner
- Automatically retried if delivery fails

---

## Technical Implementation

### Backend Architecture

#### Files Created/Modified:

1. **`server/utils/notificationService.js`** - Core notification service
   - `sendNotification()` - Send to user(s)
   - `sendEmail()` - Send email via SMTP
   - `sendReservationConfirmation()` - Booking confirmation
   - `sendReservationReminder()` - Pre-booking reminder
   - `sendReservationCancellation()` - Cancellation notice
   - `broadcastNotification()` - Broadcast to multiple users

2. **`server/jobs/scheduledJobs.js`** - Background job scheduler
   - `processScheduledNotifications()` - Process pending notifications
   - `sendReservationReminders()` - Send 3-hour reminders
   - `initializeScheduledJobs()` - Initialize all jobs

3. **`server/routes/notifications.js`** - API endpoints
   - `GET /notifications` - Get user notifications
   - `POST /notifications` - Create notification (admin)
   - `POST /notifications/broadcast/all` - Broadcast to all users
   - `POST /notifications/send/:userId` - Send to specific user
   - `POST /notifications/:id/read` - Mark as read
   - `POST /notifications/read-all` - Mark all as read
   - `DELETE /notifications/:id` - Delete notification

4. **`server/routes/bookings.js`** - Modified to trigger notifications
   - Sends confirmation on booking creation
   - Sends cancellation on reservation cancellation

### Frontend Components

1. **`src/components/notifications/NotificationCenter.tsx`**
   - Real-time notification display
   - Mark as read functionality
   - Notification history
   - Auto-polling every 30 seconds

2. **`src/components/notifications/AdminBroadcast.tsx`**
   - Admin broadcast interface
   - Channel selection (email + in-app)
   - User role filtering
   - Preview before sending

### API Integration

```typescript
// Get notifications
notificationsAPI.getAll({ unread: true })

// Mark as read
notificationsAPI.markAsRead(notificationId)

// Broadcast to all users
notificationsAPI.broadcastAll({
  title: "Maintenance Alert",
  message: "System maintenance scheduled...",
  channels: ["in_app", "email"],
  userRole: "user" // optional
})

// Send to specific user
notificationsAPI.sendToUser(userId, {
  title: "Special Offer",
  message: "Check out our weekend deals...",
  channels: ["email"]
})
```

---

## Configuration

### Environment Variables

Add to `.env`:

```env
# Email Configuration
EMAIL_SERVICE=gmail  # or your email provider
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@sportreserve.com

# Notification Settings
NOTIFICATION_REMINDER_HOURS=3  # Hours before reservation
NOTIFICATION_POLL_INTERVAL=30000  # ms between polling
```

### Email Setup (Gmail Example)

1. Enable 2-Step Verification in Gmail
2. Create App Password:
   - Go to myaccount.google.com
   - Select "Security" 
   - Find "App passwords"
   - Generate password for Mail
3. Use generated password as `EMAIL_PASS`

### Scheduled Job Timing

Jobs run automatically:
- **Scheduled notifications**: Every 5 minutes
- **Reservation reminders**: Every 30 minutes

Adjust in `scheduledJobs.js`:
```javascript
// Process scheduled notifications every 5 minutes
setInterval(processScheduledNotifications, 5 * 60 * 1000);

// Check for reservation reminders every 30 minutes
setInterval(sendReservationReminders, 30 * 60 * 1000);
```

---

## Usage Examples

### For Users

1. **View Notifications**
   - Click bell icon in top navigation
   - See all recent notifications
   - Mark as read
   - Delete notifications

2. **Receive Automatic Notifications**
   - Book a reservation → Get confirmation email + in-app
   - 3 hours before → Get reminder
   - Cancel reservation → Get cancellation notice

### For Admins

1. **Send Broadcast Notification**
   - Dashboard → "Broadcast Notification" button
   - Fill in title and message
   - Select channels (Email, In-app)
   - Choose target users (all/specific role)
   - Click "Send Now"

2. **Common Broadcast Scenarios**
   - System maintenance notices
   - Special promotions or offers
   - Service announcements
   - Emergency alerts

---

## Database Schema

### Notification Model

```javascript
{
  userId: ObjectId,              // Target user
  type: String,                   // booking_confirmation, booking_reminder, etc.
  title: String,                  // Notification title
  message: String,                // Notification message
  channel: String,                // 'email' | 'sms' | 'push' | 'in_app'
  status: String,                 // 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
  data: {                         // Custom data (resourceId, reservationId, etc.)
    type: Map,
    of: Mixed
  },
  scheduledFor: Date,             // When to send (for scheduled notifications)
  sentAt: Date,                   // When it was sent
  readAt: Date,                   // When user read it
  errorMessage: String,           // Error details if failed
  retryCount: Number,             // Number of retry attempts
  createdAt: Date,
  updatedAt: Date
}
```

---

## Monitoring & Debugging

### Check Notification Status

```bash
# In browser console
// Get unread notifications count
notificationsAPI.getAll({ unread: true })

// Check notifications by type
notificationsAPI.getAll({ type: 'booking_reminder' })
```

### Server Logs

```bash
# Check scheduled job execution
[Scheduled Jobs] Processing pending notifications...
[Reservation Reminders] Found X upcoming reservations
[Scheduled Jobs] Notification {id} sent
```

### Email Testing

Test email delivery:
1. Create a test reservation
2. Check user email for confirmation
3. Verify delivery within 1 minute

---

## Troubleshooting

### Emails Not Sending

**Problem**: No emails received
**Solutions**:
1. Check `EMAIL_USER` and `EMAIL_PASS` are correct
2. Enable Less secure app access (Gmail)
3. Check spam folder
4. Check server logs for errors
5. Verify SMTP credentials

### Reminders Not Triggering

**Problem**: No 3-hour reminders
**Solutions**:
1. Check server is running
2. Verify MongoDB connection
3. Check scheduled jobs are initialized
4. Look for errors in server logs: `[Reservation Reminders]`

### Notifications Not Displaying

**Problem**: No notifications in UI
**Solutions**:
1. User is logged in? Check `localStorage['token']`
2. Refresh page to poll notifications
3. Check browser console for API errors
4. Verify notification database has records

---

## Best Practices

✅ **DO**:
- Test notifications before going live
- Use email for critical notices (confirmations)
- Use in-app for routine updates
- Keep messages concise and actionable
- Include customer support contact info

❌ **DON'T**:
- Send too many notifications (causes fatigue)
- Use HTML-only emails (include text fallback)
- Send at odd hours (respect time zones)
- Spam with marketing (use broadcast wisely)

---

## Future Enhancements

Possible improvements:
- SMS notifications via Twilio
- Push notifications for mobile app
- Notification preferences per user
- Notification templates
- Analytics dashboard
- Quiet hours / Do Not Disturb
- Reply-to functionality
- Webhook integrations

---

## Support

For issues or questions about the notification system:
1. Check this documentation
2. Review server logs
3. Check MongoDB logs
4. Test email configuration
5. Create an issue with detailed logs
