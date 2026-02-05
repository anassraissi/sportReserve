# Quick Test Accounts

## Email/Password Test Accounts

You can use these credentials to test without Google OAuth while you wait for Google Cloud to process:

### Test User Account
```
Email: test@example.com
Password: test123456
```

### Test Admin Account
```
Email: admin@example.com
Password: admin123456
```

### How to Create Test Accounts

1. Go to MongoDB Atlas or your local MongoDB
2. Insert test users into the `users` collection:

```javascript
// Test User
{
  "email": "test@example.com",
  "password": "hashed_password",  // Will be hashed by bcrypt
  "firstName": "Test",
  "lastName": "User",
  "role": "user",
  "authMethod": "password",
  "accountStatus": "approved",
  "isApprovedByAdmin": true,
  "isEmailVerified": true,
  "isActive": true,
  "createdAt": new Date()
}

// Test Admin
{
  "email": "admin@example.com",
  "password": "hashed_password",
  "firstName": "Admin",
  "lastName": "User",
  "role": "admin",
  "authMethod": "password",
  "accountStatus": "approved",
  "isApprovedByAdmin": true,
  "isEmailVerified": true,
  "isActive": true,
  "createdAt": new Date()
}
```

### Or Use cURL to Create Test Accounts

```bash
# Create test user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456",
    "firstName": "Test",
    "lastName": "User",
    "role": "user"
  }'

# Create test admin
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123456",
    "firstName": "Admin",
    "lastName": "User",
    "role": "admin"
  }'
```

Then go to `/admin/pending-registrations` and approve the users manually in the database or through the API.

---

## Once Google Cloud Updates Complete

After 5-10 minutes and you've cleared your browser cache, Google OAuth login will work and you can use your Google account.

