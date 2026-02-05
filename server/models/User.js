import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  password: {
    type: String,
    minlength: [6, 'Password must be at least 6 characters'],
    select: false, // Don't return password by default
  },
  googleId: String,
  googleEmail: String,
  googleProfilePicture: String,
  authMethod: {
    type: String,
    enum: ['password', 'google'],
    default: 'password',
  },
  isApprovedByAdmin: {
    type: Boolean,
    default: false,
  },
  approvedAt: Date,
  approvedBy: mongoose.Schema.Types.ObjectId,
  accountStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'blocked'],
    default: 'pending',
  },
  // Email verification for OAuth
  verificationCode: String,
  verificationCodeExpires: Date,
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
  },
  phone: String,
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  company: String,
  position: String,
  avatar: {
    type: String,
    default: null,
  },
  avatarUrl: String,
  emailVerified: {
    type: Boolean,
    default: false,
  },
  phoneVerified: {
    type: Boolean,
    default: false,
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false,
  },
  lastLogin: Date,
  failedLoginAttempts: {
    type: Number,
    default: 0,
  },
  accountLockedUntil: Date,
  preferences: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
  },
  notificationPreferences: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {
      email: true,
      push: true,
      sms: false,
      reminder_hours_before: 24,
    },
  },
  stripeCustomerId: String,
  isActive: {
    type: Boolean,
    default: true,
  },
  deletedAt: Date,
}, {
  timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get user without password
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ company: 1 });
userSchema.index({ deletedAt: 1 });

const User = mongoose.model('User', userSchema);

export default User;

