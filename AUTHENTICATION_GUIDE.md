# Authentication System - User Guide

## 🎯 Quick Start

### For Users

#### 1. Register Your Account
1. Go to `/register`
2. Choose registration method:
   - **Email**: Fill in name, email, password
   - **Google**: Click "Sign up with Google" (coming soon)
3. Click "Create account"
4. **Wait for admin approval** - Check email for notification
5. Once approved, proceed to login

#### 2. Login
1. Go to `/login`
2. Enter email and password
3. Click "Sign in"
4. **Only works if account is approved by admin**

#### 3. Change Password
1. Login to your account
2. Go to `/profile/change-password`
3. Enter current password
4. Enter new password (min 6 characters)
5. Confirm new password
6. Click "Update Password"

### For Admins

#### 1. Access Admin Dashboard
1. Login with admin account
2. Navigate to `/admin`

#### 2. Review Pending Registrations
1. Go to `/admin/pending-registrations`
2. View all pending user registrations
3. See registration method (Email/Google)
4. See user details and registration date

#### 3. Approve Users
1. Review user information
2. Click "Approve" button (green)
3. User will receive approval notification
4. User can now login

#### 4. Reject Users
1. Click "Reject" button (red)
2. Confirm rejection in dialog
3. User will receive rejection notification
4. User cannot login

---

## 🔐 Authentication Flow

### Email Registration Flow
```
User Registration
      ↓
Account Created (Status: pending)
      ↓
Admin Notification
      ↓
Admin Review
      ├─→ Approve → User can login
      └─→ Reject → User gets notification
```

### After Login
```
Login Success
      ↓
Access Dashboard
      ↓
(Optional) Change Password
      ↓
Access Application Features
```

---

## 📋 Account Statuses

| Status | User Can Login? | Description |
|--------|-----------------|-------------|
| **Pending** | ❌ No | Waiting for admin review |
| **Approved** | ✅ Yes | Admin approved, can access |
| **Rejected** | ❌ No | Admin rejected registration |
| **Blocked** | ❌ No | Admin blocked account |

---

## 🔐 Security Tips

1. **Strong Passwords**
   - Use at least 6 characters
   - Mix uppercase, lowercase, numbers
   - Avoid personal information

2. **Change Password After Google Login**
   - Recommended for additional security
   - Set a unique password

3. **Keep Token Safe**
   - Browser stores authentication token
   - Clear token when logout
   - Don't share token with others

4. **Secure Your Account**
   - Use strong, unique password
   - Don't reuse passwords
   - Change password periodically

---

## ❓ Troubleshooting

### "Your account is pending admin approval"
- **Cause:** You registered but admin hasn't approved yet
- **Solution:** Wait for email notification from admin

### "Invalid email or password"
- **Cause:** Wrong credentials or account doesn't exist
- **Solution:** Check email and password, or register new account

### "Account has been rejected"
- **Cause:** Admin rejected your registration
- **Solution:** Contact support or create new account

### "Your account has been blocked"
- **Cause:** Admin blocked your account
- **Solution:** Contact support

### "Password change failed - Current password incorrect"
- **Cause:** Wrong current password entered
- **Solution:** Re-enter current password carefully

---

## 📧 Email Notifications

Users receive notifications for:
- ✉️ Account registration received
- ✅ Account approved (can now login)
- ❌ Account rejected
- 🔒 Password changed

---

## 🌐 Google OAuth (Coming Soon)

### Setup Instructions
1. Admin creates Google OAuth app
2. Get Client ID from Google
3. Add to environment variables
4. Users can "Sign up with Google"
5. Same approval flow as email

---

## 🔗 Important URLs

| Page | URL | Access |
|------|-----|--------|
| Login | `/login` | Everyone |
| Register | `/register` | Everyone |
| Dashboard | `/dashboard` | Approved Users |
| Change Password | `/profile/change-password` | Logged In Users |
| Pending Registrations | `/admin/pending-registrations` | Admins Only |

---

## 💡 Pro Tips

1. **Admin Dashboard**: Check pending registrations regularly
2. **User Notifications**: Check email after registration
3. **Password Reset**: If you forget password, contact admin
4. **Account Recovery**: Admin can approve/reject/block accounts

---

## 📞 Support

For issues or questions:
1. Check troubleshooting section above
2. Contact system administrator
3. Review error messages carefully

---

**Last Updated:** February 3, 2026
**System Version:** 1.0
