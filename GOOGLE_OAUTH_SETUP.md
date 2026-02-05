# Google OAuth Integration Guide

## Overview
This application now supports Google OAuth 2.0 authentication. Users can sign up and sign in using their Google account. All Google-authenticated accounts follow the same approval workflow as email-based registrations.

## What's Implemented

### Frontend Components
1. **Register.tsx** - Updated with Google OAuth button
   - Users can switch between Email and Google registration methods
   - Google Login component handles OAuth flow
   - Decodes JWT token from Google to extract user information
   - Sends registration data to `/auth/register-google` endpoint
   - Shows pending approval message after registration

2. **Login.tsx** - Updated with Google OAuth button
   - Users can switch between Email and Google login methods
   - Supports Google sign-in with account status validation
   - Redirects to home page if approved, shows pending message if waiting
   - Integrates with AuthContext for session management

3. **Package Dependencies**
   - `@react-oauth/google` - Google OAuth 2.0 library
   - `jwt-decode` - JWT token decoder for extracting user info

### Backend Endpoints

#### POST `/api/auth/register-google`
**Purpose:** Register a new user with Google OAuth credentials

**Request Body:**
```json
{
  "googleId": "string",           // Google user ID from JWT sub claim
  "email": "string",              // User's email
  "firstName": "string",          // User's first name
  "lastName": "string",           // User's last name
  "googleProfilePicture": "string" // Google profile picture URL (optional)
}
```

**Response:**
```json
{
  "message": "Google registration successful. Waiting for admin approval...",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "accountStatus": "pending"
  }
}
```

#### POST `/api/auth/login-google`
**Purpose:** Login with Google OAuth credentials

**Request Body:**
```json
{
  "googleId": "string",
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "googleProfilePicture": "string" // Optional
}
```

**Response (Approved Account):**
```json
{
  "message": "Login successful",
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "avatar": "profile_picture_url",
    "accountStatus": "approved",
    "authMethod": "google"
  }
}
```

**Response (Pending Approval):**
```json
{
  "message": "Your account is pending admin approval. Please check your email for updates.",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "accountStatus": "pending"
  }
}
```

### Database Updates
The User model now includes:
- `googleId` - Google's unique user identifier
- `googleEmail` - Email from Google account
- `googleProfilePicture` - Profile picture URL from Google
- `authMethod` - Either 'password' or 'google'

## Configuration

### Environment Variables
Your `.env` file should include:
```
VITE_GOOGLE_CLIENT_ID=508704375524-pfv6bkhb0opsfkult1o6o3g24apbvmg9.apps.googleusercontent.com
VITE_API_URL=http://localhost:5000/api
```

## User Flow

### Google Registration Flow
1. User clicks "Google" tab on Register page
2. Clicks "Sign up with Google" button
3. Google authentication popup appears
4. User logs into Google (or selects existing account)
5. Frontend decodes JWT from Google
6. Frontend sends registration data to `/auth/register-google`
7. Backend creates user with `accountStatus: 'pending'`
8. User sees "Waiting for admin approval" message
9. Admin reviews and approves/rejects user
10. User can then login with approved status

### Google Login Flow
1. User clicks "Google" tab on Login page
2. Clicks "Sign in with Google" button
3. Google authentication popup appears
4. Frontend decodes JWT from Google
5. Frontend sends login data to `/auth/login-google`
6. Backend validates account status:
   - **Pending**: Shows "Waiting for approval" message
   - **Approved**: Returns JWT token and user data, redirects to home
   - **Rejected**: Shows rejection message
   - **Blocked**: Shows account blocked message

### Linking Google to Existing Account
If a user already has an email/password account and then tries to register with Google:
- During registration: The system links Google ID to existing account
- During login: The system finds and logs in the user

## Features

### Account Status Management
Google users follow the same approval workflow:
- New Google accounts start in "pending" status
- Admin must approve through `/admin/pending-registrations` page
- Once approved, users can login with Google
- Admins can also reject or block accounts

### Profile Picture Integration
- Google profile pictures are automatically saved to user account
- Used as avatar when user hasn't uploaded custom avatar
- Falls back to default avatar if unavailable

### Authentication Method Tracking
- System tracks whether user authenticated via 'password' or 'google'
- Enables mixed authentication (email + Google for same account)

## Security Considerations

1. **JWT Verification**: JWT tokens from Google are decoded on frontend only (already verified by Google)
2. **Password Handling**: Google users get placeholder password in database (not used)
3. **Account Status**: All accounts require admin approval before access
4. **Token Expiry**: Backend JWT tokens expire according to JWT_EXPIRES_IN setting
5. **HTTPS in Production**: Always use HTTPS in production for OAuth

## Testing

### Test Google Registration
1. Go to `/register`
2. Click Google tab
3. Click "Sign up with Google" button
4. Complete Google authentication
5. Verify user appears in `/admin/pending-registrations`
6. Admin approves user
7. User can now login with Google

### Test Google Login
1. Go to `/login`
2. Click Google tab
3. Complete Google authentication
4. Verify redirect to home page (if approved)
5. Check user profile page for Google profile picture

## Troubleshooting

### "Google Client ID not configured"
- Ensure `.env` file has `VITE_GOOGLE_CLIENT_ID` set
- Verify Client ID is correct
- Rebuild app if environment variables changed

### Google popup doesn't appear
- Check browser console for errors
- Verify @react-oauth/google is installed
- Check that GoogleOAuthProvider wraps the component
- Verify Client ID is correct for your domain

### User can't login after registration
- Check `/admin/pending-registrations` to see if user is pending
- Verify admin has approved user
- Check user's `accountStatus` in database

### Profile picture not showing
- Verify `googleProfilePicture` URL is accessible
- Check browser console for image load errors
- Fall back to default avatar if URL is invalid

## Production Checklist

- [ ] Update Google OAuth Client ID for production domain
- [ ] Add email notification service for admin approvals
- [ ] Enable HTTPS for all OAuth requests
- [ ] Set up database backups
- [ ] Configure production database connection
- [ ] Review security settings in Google Cloud Console
- [ ] Test complete OAuth flow in production environment
- [ ] Monitor error logs for OAuth issues
- [ ] Set up rate limiting for auth endpoints
- [ ] Document support process for user account issues

## Files Modified

- `src/pages/Register.tsx` - Added Google OAuth button with callback
- `src/pages/Login.tsx` - Added Google OAuth button with callback
- `server/routes/auth.js` - Added `/login-google` endpoint
- `.env` - Added VITE_GOOGLE_CLIENT_ID
- `package.json` - Added jwt-decode dependency

## API Reference

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for complete API reference including:
- All authentication endpoints
- Request/response formats
- Error handling
- Status codes
