# Environment Configuration for Notifications

## Email Service Setup (Required for Notifications)

### Using Gmail

1. **Enable 2-Step Verification**
   - Go to myaccount.google.com
   - Click Security in the left menu
   - Enable 2-Step Verification

2. **Generate App Password**
   - Go to myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer"
   - Generate password (16 characters)
   - Copy the password

3. **Add to .env**
   ```env
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=xxxx xxxx xxxx xxxx
   EMAIL_FROM=noreply@sportreserve.com
   ```

### Using Other Email Providers

#### SendGrid
```env
EMAIL_SERVICE=sendgrid
EMAIL_USER=apikey
EMAIL_PASS=SG.xxxxxxxxxxxxx
EMAIL_FROM=noreply@sportreserve.com
```

#### Mailgun
```env
EMAIL_SERVICE=mailgun
EMAIL_USER=postmaster@mg.sportreserve.com
EMAIL_PASS=key-xxxxxxxxxxxxx
EMAIL_FROM=noreply@sportreserve.com
```

#### AWS SES
```env
EMAIL_SERVICE=ses
EMAIL_USER=your-access-key
EMAIL_PASS=your-secret-key
EMAIL_FROM=noreply@sportreserve.com
```

#### Custom SMTP
```env
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
EMAIL_FROM=noreply@sportreserve.com
```

---

## Complete .env Template

```env
# ===== BASIC CONFIG =====
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173

# ===== DATABASE =====
MONGODB_URI=mongodb://localhost:27017/sportreserve

# ===== JWT =====
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRY=7d

# ===== EMAIL (REQUIRED FOR NOTIFICATIONS) =====
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx
EMAIL_FROM=noreply@sportreserve.com

# ===== NOTIFICATIONS =====
NOTIFICATION_REMINDER_HOURS=3
NOTIFICATION_POLL_INTERVAL=30000
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_IN_APP_NOTIFICATIONS=true

# ===== OPTIONAL: FILE UPLOADS =====
MAX_FILE_SIZE=10485760
ALLOWED_IMAGE_FORMATS=jpg,jpeg,png,gif,webp
ALLOWED_VIDEO_FORMATS=mp4,webm,avi

# ===== OPTIONAL: SOCKET.IO =====
CORS_ORIGIN=http://localhost:5173

# ===== OPTIONAL: LOGGING =====
LOG_LEVEL=debug
```

---

## Quick Start Checklist

- [ ] Set `EMAIL_SERVICE` (gmail recommended)
- [ ] Set `EMAIL_USER` (your email address)
- [ ] Set `EMAIL_PASS` (app password for gmail)
- [ ] Set `EMAIL_FROM` (sender email)
- [ ] Verify MongoDB connection
- [ ] Test email by making a test reservation
- [ ] Check email is received

---

## Testing Configuration

### 1. Test Email Settings Locally

```bash
# Run this in terminal from server directory
node -e "
import nodemailer from 'nodemailer';
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password'
  }
});
transporter.sendMail({
  from: 'noreply@sportreserve.com',
  to: 'test@example.com',
  subject: 'Test Notification',
  html: '<h1>Test</h1>'
}, (err, info) => {
  if (err) console.log('Error:', err);
  else console.log('Email sent:', info.response);
});
"
```

### 2. Test via API

```bash
# Create test notification
curl -X POST http://localhost:5000/api/notifications \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID",
    "title": "Test Notification",
    "message": "This is a test",
    "type": "system_alert",
    "channel": "email"
  }'
```

### 3. Monitor Logs

```bash
# Check for notification logs
grep "Email sent to" server.log
grep "Scheduled Jobs" server.log
grep "Reservation Reminders" server.log
```

---

## Common Issues & Solutions

### "Invalid login credentials"
- ✓ Check EMAIL_USER is correct
- ✓ Check EMAIL_PASS is app password (not account password)
- ✓ For Gmail, ensure Less secure apps is enabled

### "Service not recognized"
- ✓ Verify EMAIL_SERVICE value matches supported provider
- ✓ Supported: gmail, sendgrid, mailgun, ses, smtp

### "Email field not set"
- ✓ Ensure EMAIL_FROM is configured
- ✓ Format: "noreply@yourdomain.com" or "Your App <noreply@yourdomain.com>"

### SMTP connection refused
- ✓ Verify SMTP_HOST and SMTP_PORT
- ✓ Check firewall allows outbound SMTP
- ✓ Verify credentials are correct

---

## Production Recommendations

1. **Use Email Service Provider**
   - SendGrid (most reliable)
   - Mailgun (great documentation)
   - AWS SES (cost-effective)

2. **Set Strong Secrets**
   ```env
   JWT_SECRET=$(openssl rand -base64 32)
   ```

3. **Enable Rate Limiting**
   - Prevent notification spam
   - Implement user notification preferences

4. **Monitor Delivery**
   - Log all sent notifications
   - Track delivery/bounce rates
   - Set up alerts for failures

5. **Use Environment Variables**
   - Never commit secrets to git
   - Use `.env.local` for development
   - Use deployment platform secrets for production

---

## Support

If email is not working:
1. Verify all environment variables are set
2. Check server logs for detailed error messages
3. Test email credentials manually
4. Verify network connectivity to SMTP server
5. Check firewall/port settings
