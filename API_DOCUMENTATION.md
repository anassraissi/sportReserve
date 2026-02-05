# Authentication API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication Header
```
Authorization: Bearer <token>
```

---

## 📝 Endpoints

### 1. Register (Email)
```
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "role": "user"
}
```

**Response (201):**
```json
{
  "message": "Registration successful. Waiting for admin approval.",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "accountStatus": "pending"
  }
}
```

**Error Responses:**
- `400` - Validation failed or user exists
- `500` - Server error

---

### 2. Register with Google
```
POST /auth/register-google
```

**Request Body:**
```json
{
  "googleId": "google_oauth_id",
  "email": "user@gmail.com",
  "firstName": "John",
  "lastName": "Doe",
  "googleProfilePicture": "https://..."
}
```

**Response (201):**
```json
{
  "message": "Google registration successful. Waiting for admin approval.",
  "user": {
    "id": "user_id",
    "email": "user@gmail.com",
    "firstName": "John",
    "lastName": "Doe",
    "authMethod": "google",
    "accountStatus": "pending"
  }
}
```

---

### 3. Login
```
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "accountStatus": "approved"
  }
}
```

**Error Responses:**
- `401` - Invalid credentials
- `403` - Account pending/rejected/blocked
- `500` - Server error

**Account Status Errors:**
```json
{
  "message": "Your account is pending admin approval. Check your email for updates."
}
```

---

### 4. Get Current User
```
GET /auth/me
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "avatar": "avatar_filename",
    "avatarUrl": "https://...",
    "createdAt": "2024-02-03T10:00:00Z"
  }
}
```

---

### 5. Change Password
```
POST /auth/change-password
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword456",
  "confirmPassword": "newpassword456"
}
```

**Response (200):**
```json
{
  "message": "Password changed successfully"
}
```

**Error Responses:**
- `400` - Passwords don't match or validation failed
- `401` - Current password incorrect
- `500` - Server error

---

### 6. Get Pending Registrations (Admin)
```
GET /auth/admin/pending-registrations
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "users": [
    {
      "_id": "user_id",
      "email": "newuser@example.com",
      "firstName": "Jane",
      "lastName": "Smith",
      "role": "user",
      "authMethod": "google",
      "accountStatus": "pending",
      "createdAt": "2024-02-03T10:00:00Z",
      "googleProfilePicture": "https://..."
    }
  ]
}
```

**Error Responses:**
- `401` - Not authenticated
- `403` - Not admin
- `500` - Server error

---

### 7. Approve User (Admin)
```
POST /auth/admin/approve-user/:id
Authorization: Bearer <admin_token>
```

**Request Body (Optional):**
```json
{
  "approvalNotes": "Approved - verified information"
}
```

**Response (200):**
```json
{
  "message": "User approved successfully",
  "user": {
    "id": "user_id",
    "email": "newuser@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "accountStatus": "approved"
  }
}
```

**Error Responses:**
- `400` - User not pending
- `401` - Not authenticated
- `403` - Not admin
- `404` - User not found
- `500` - Server error

---

### 8. Reject User (Admin)
```
POST /auth/admin/reject-user/:id
Authorization: Bearer <admin_token>
```

**Request Body (Optional):**
```json
{
  "rejectionReason": "Does not meet requirements"
}
```

**Response (200):**
```json
{
  "message": "User rejected",
  "user": {
    "id": "user_id",
    "email": "newuser@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "accountStatus": "rejected"
  }
}
```

**Error Responses:**
- `400` - User not pending
- `401` - Not authenticated
- `403` - Not admin
- `404` - User not found
- `500` - Server error

---

### 9. Update Profile
```
PUT /auth/profile
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "firstName": "Jonathan",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

**Response (200):**
```json
{
  "message": "Profile updated",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "Jonathan",
    "lastName": "Doe",
    "phone": "+1234567890"
  }
}
```

---

### 10. Upload Avatar
```
POST /auth/avatar
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body:**
```
avatar: <file>
```

**Response (200):**
```json
{
  "message": "Avatar updated",
  "avatar": "avatar-filename.jpg",
  "avatarUrl": "/uploads/avatars/avatar-filename.jpg"
}
```

---

## 🔐 Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized (invalid token/credentials) |
| 403 | Forbidden (account status issue) |
| 404 | Not Found |
| 500 | Server Error |

---

## 🔑 JWT Token

**Token Structure:**
```
Header.Payload.Signature
```

**Payload Example:**
```json
{
  "userId": "user_id",
  "iat": 1675351200,
  "exp": 1675955200
}
```

**Expiry:** Configurable (default: 7 days)

---

## 📊 Account Status Transitions

```
Registration
     ↓
pending ← → rejected
     ↓
  approved ← → blocked
```

---

## 🛡️ Validation Rules

### Email
- Valid email format required
- Unique in database
- Lowercase and trimmed

### Password
- Minimum 6 characters
- Hashed with bcryptjs
- Not stored in plain text

### First/Last Name
- Required
- Trimmed

### Role
- Enum: 'user' or 'admin'
- Default: 'user'

---

## 🚀 Usage Examples

### JavaScript/Fetch
```javascript
// Register
const registerRes = await fetch('http://localhost:5000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe'
  })
});
const registerData = await registerRes.json();

// Login
const loginRes = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});
const loginData = await loginRes.json();
localStorage.setItem('token', loginData.token);

// Change Password
const changeRes = await fetch('http://localhost:5000/api/auth/change-password', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  },
  body: JSON.stringify({
    currentPassword: 'password123',
    newPassword: 'newpassword456',
    confirmPassword: 'newpassword456'
  })
});
```

### Using API Wrapper
```typescript
import { authAPI } from '@/lib/api';

// Register
await authAPI.register({
  email: 'user@example.com',
  password: 'password123',
  firstName: 'John',
  lastName: 'Doe',
  role: 'user'
});

// Login
const { token, user } = await authAPI.login('user@example.com', 'password123');

// Change Password
await authAPI.changePassword({
  currentPassword: 'password123',
  newPassword: 'newpassword456',
  confirmPassword: 'newpassword456'
});

// Admin: Get Pending
const { users } = await authAPI.getPendingRegistrations();

// Admin: Approve
await authAPI.approveUser(userId);

// Admin: Reject
await authAPI.rejectUser(userId);
```

---

## 📝 Error Handling

All error responses follow this format:

```json
{
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

---

**Last Updated:** February 3, 2026
**API Version:** 1.0
