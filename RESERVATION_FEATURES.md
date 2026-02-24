# Reservation Features - Implementation Guide

## ✅ Features Implemented

### 1. **Email Reminders - 3 Hours Before Reservation**

**Status**: ✅ ACTIVE

#### How It Works:
- Scheduled job runs every **30 minutes** 
- Checks for reservations starting in ~3 hours
- Automatically sends email reminders to users

#### Email Configuration:
```env
EMAIL_SERVICE=gmail
EMAIL_USER=anass.raissi.ar@gmail.com
EMAIL_PASS=gilsekmapwzlldif
EMAIL_FROM=anass.raissi.ar@gmail.com
```

#### Files Involved:
- **Job Scheduler**: `/server/jobs/scheduledJobs.js` (lines 61-106)
- **Email Service**: `/server/utils/notificationService.js`
- **Server**: `/server/server.js` (initializes jobs on startup)

#### Process Flow:
```
Server Starts
    ↓
DB Connection Established
    ↓
initializeScheduledJobs() called
    ↓
Runs immediately + every 30 minutes:
  1. Query reservations starting in 2.5-3.5 hours
  2. Filter status: confirmed or paid
  3. Check if reminder already sent (avoid duplicates)
  4. Schedule email notification
    ↓
3 Hours Before Reservation:
  1. Email is sent to user
  2. Message includes: Resource name, Start time
  3. Reminder in French (Rappel de réservation)
```

---

### 2. **Prevent Reservation Changes Within 24 Hours**

**Status**: ✅ ACTIVE

#### How It Works:
- User cannot **modify** reservation within 24 hours before start time
- User can still **cancel** the reservation
- Admins/managers have full access

#### Implementation:
- **Route**: `PUT /api/bookings/:id` 
- **Check**: Compares current time with reservation start time
- **Time Lock**: 24 hours before reservation

#### Error Response Example:
```json
{
  "message": "Cannot modify reservation within 24 hours before start time",
  "hoursRemaining": 15.5,
  "restrictedUntil": "2026-02-25T14:00:00.000Z"
}
```

#### Code Location:
- File: `/server/routes/bookings.js` (lines 245-263)

---

## 📋 Configuration Checklist

- [x] Email credentials set in `.env`
- [x] MongoDB connection configured
- [x] Scheduled jobs initialized on server startup
- [x] Notification database model ready
- [x] Reservation model with status tracking
- [x] Email templates configured

---

## 🧪 Testing the Features

### Test Email Reminder:
1. Create a reservation with start time = **3 hours 5 minutes from now**
2. Server scheduled job runs every 30 minutes
3. Should receive email **within 30 minutes**

### Test 24-Hour Lock:
1. Create a reservation with start time = **12 hours from now**
2. Try to update the reservation
3. Should receive error: "Cannot modify reservation within 24 hours before start time"

---

## 📧 Email Template

Reminder emails are sent with:
- **Subject**: ⏰ Rappel: [Resource Name] dans 3 heures
- **Body**: 
  - Reservation resource name
  - Exact start time
  - Request to arrive 15 minutes early
  - HTML formatted template with branding

---

## 🔧 Troubleshooting

### Emails Not Sending?

**Check 1**: Verify credentials in `.env`:
```bash
# Should display:
EMAIL_USER: anass.raissi.ar@gmail.com
EMAIL_PASS: (set)
```

**Check 2**: Server logs should show:
```
✅ Email service is ready to send messages
[Email] From: anass.raissi.ar@gmail.com
```

**Check 3**: Verify user has email in database:
```javascript
// In MongoDB, check users collection:
db.users.findOne({ _id: ObjectId(...) }, { email: 1 })
```

**Check 4**: Check notification logs:
```bash
# Server console should show:
[Reservation Reminders] Found X upcoming reservations
[Email] Sending email to user ...
```

### 24-Hour Lock Not Working?

- Verify reservation.startTime is properly saved
- Check current server time is correct
- Verify user is owner of reservation (not admin bypass)

---

## 🚀 Future Enhancements

- [ ] SMS reminders in addition to email
- [ ] Customizable reminder time (instead of fixed 3 hours)
- [ ] Reminder frequency options (daily, day before, etc.)
- [ ] Cancellation warnings before 24-hour lock
- [ ] Early bird pricing incentives to book far in advance

---

## 📝 API Endpoints

### Create Reservation
```
POST /api/bookings
```
- Triggers confirmation email
- Schedules reminder for 3 hours before
- Starts update lock timer

### Update Reservation
```
PUT /api/bookings/:id
```
- ❌ Blocked within 24 hours before start
- ✅ Allowed more than 24 hours before start
- Admin bypass available

### Cancel Reservation
```
POST /api/bookings/:id/cancel
```
- ✅ Always allowed
- Sends cancellation email
- Ignores 24-hour lock

---

**Last Updated**: February 24, 2026
**Email Provider**: Gmail SMTP
**Timezone**: UTC (configured in reservation schema)
