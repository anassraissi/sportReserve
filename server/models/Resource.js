import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Resource name is required'],
    trim: true,
  },
  slug: {
    type: String,
    unique: true,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['terrain', 'salle', 'equipment'],
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ResourceCategory',
  },
  subcategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ResourceSubcategory',
  },
  
  // Basic information
  description: String,
  shortDescription: {
    type: String,
    maxlength: 500,
  },
  capacity: Number,
  unit: {
    type: String,
    enum: ['persons', 'items', 'square_meters', 'players'],
  },
  
  // Location
  locationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
  },
  address: String,
  latitude: Number,
  longitude: Number,
  floor: String,
  roomNumber: String,
  
  // Characteristics
  features: {
    type: [String],
    default: [],
  },
  specifications: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
  },
  requirements: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
  },
  
  // Default availability
  defaultAvailability: {
    type: Map,
    of: {
      start: String,
      end: String,
    },
    default: {
      monday: { start: '00:00', end: '23:59' },
      tuesday: { start: '00:00', end: '23:59' },
      wednesday: { start: '00:00', end: '23:59' },
      thursday: { start: '00:00', end: '23:59' },
      friday: { start: '00:00', end: '23:59' },
      saturday: { start: '00:00', end: '23:59' },
      sunday: { start: '00:00', end: '23:59' },
    },
  },
  
  // Pricing
  pricingModel: {
    type: String,
    enum: ['hourly', 'daily', 'weekly', 'monthly', 'package'],
    default: 'hourly',
  },
  pricePerUnit: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'DH',
    maxlength: 3,
  },
  taxRate: {
    type: Number,
    default: 20.0,
  },
  depositRequired: {
    type: Number,
    default: 0,
  },
  depositRefundDays: {
    type: Number,
    default: 7,
  },
  
  // Booking restrictions
  minBookingHours: {
    type: Number,
    default: 1,
  },
  maxBookingHours: {
    type: Number,
    default: 24,
  },
  advanceBookingDays: {
    type: Number,
    default: 30,
  },
  cancellationHoursBefore: {
    type: Number,
    default: 24,
  },
  
  // Management
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  maintenanceSchedule: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
  },
  status: {
    type: String,
    enum: ['active', 'maintenance', 'inactive', 'deleted'],
    default: 'active',
  },
  cleaningTimeMinutes: {
    type: Number,
    default: 30,
  },
  
  // Statistics
  totalBookings: {
    type: Number,
    default: 0,
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  lastMaintenanceDate: Date,
  
  // Metadata
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
  },
  tags: {
    type: [String],
    default: [],
  },
  seoTitle: String,
  seoDescription: String,
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Indexes
resourceSchema.index({ type: 1 });
resourceSchema.index({ categoryId: 1 });
resourceSchema.index({ locationId: 1 });
resourceSchema.index({ status: 1 });
resourceSchema.index({ tags: 1 });
resourceSchema.index({ slug: 1 }, { unique: true });

const Resource = mongoose.model('Resource', resourceSchema);

export default Resource;

