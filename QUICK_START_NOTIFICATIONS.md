# ⚡ Notification System - Quick Setup (5 Minutes)

## Step 1: Configure Email (1 minute)

### For Gmail (Recommended)

1. Go to: https://myaccount.google.com/apppasswords
2. Generate App Password for Mail
3. Copy the 16-character password
4. Add to `.env`:

```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx
EMAIL_FROM=noreply@sportreserve.com
```

### For Other Providers

See `ENV_SETUP_NOTIFICATIONS.md` for SendGrid, Mailgun, AWS SES, etc.

---

## Step 2: Restart Server (1 minute)

```bash
npm start
```

Check logs for:
```
[Jobs] Initializing scheduled jobs...
```

---

## Step 3: Add Notification Components (2 minutes)

### Add to Navbar
File: `src/components/layout/AppLayout.tsx` or your navigation component

```tsx
import { NotificationCenter } from '@/components/notifications/NotificationCenter';

// In your navbar
<div className="flex items-center gap-4">
  <NotificationCenter />
  {/* other nav items */}
</div>
```

### Add Broadcast to Admin Panel
File: Where you have admin controls

```tsx
import { AdminBroadcastNotification } from '@/components/notifications/AdminBroadcast';

// In admin section
<AdminBroadcastNotification />
```

---

## Step 4: Test It! (1 minute)

### Test 1: Booking Confirmation
```
1. Make a reservation
2. Check email immediately
3. Check app for notification
```

### Test 2: Admin Broadcast
```
1. Login as admin
2. Click "Broadcast Notification"
3. Send test message
4. Check as regular user
```

---

## What You Get

✅ Automatic confirmations when customers book
✅ Automatic reminders 3 hours before
✅ Email notifications
✅ In-app notifications
✅ Admin broadcast capability
✅ User notification management

---

## Troubleshooting

**Emails not working?**
```
1. Check .env has EMAIL_USER and EMAIL_PASS
2. For Gmail: Ensure Less secure apps enabled
3. Check server logs for errors
4. Test one more time
```

**Reminders not showing?**
```
1. Server running? npm start
2. Check logs for "[Scheduled Jobs]"
3. Wait up to 30 minutes for first run
```

**Notifications not showing in UI?**
```
1. Refresh browser
2. Check you're logged in
3. Check browser console
```

---

## Quick Reference

### For Users
- Click bell icon to see notifications
- Click to mark as read
- Click X to delete

### For Admins
- Click "Broadcast Notification" button
- Fill title and message
- Choose email and/or in-app
- Click "Send Now"

---

## That's It! 🎉

Your notification system is now live!

📧 Customers get emails
🔔 Users see in-app notifications  
⏰ Reminders sent automatically
📣 You can broadcast announcements

Need help? See full docs:
- `NOTIFICATION_SYSTEM.md` (complete guide)
- `ENV_SETUP_NOTIFICATIONS.md` (detailed setup)
- `NOTIFICATION_IMPLEMENTATION.md` (technical details)
