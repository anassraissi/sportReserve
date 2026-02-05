import mongoose from 'mongoose';

const resourceAvailabilitySchema = new mongoose.Schema({
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['available', 'booked', 'maintenance', 'blocked', 'partial', 'unavailable'],
    default: 'available',
  },
  slotType: {
    type: String,
    enum: ['regular', 'peak', 'off_peak', 'special'],
    default: 'regular',
  },
  priceMultiplier: {
    type: Number,
    default: 1.0,
  },
  maxDurationHours: Number,
  minDurationHours: Number,
  reservationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reservation',
  },
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Unique constraint for resource, date, and startTime
resourceAvailabilitySchema.index({ resourceId: 1, date: 1, startTime: 1 }, { unique: true });
resourceAvailabilitySchema.index({ resourceId: 1, date: 1 });
resourceAvailabilitySchema.index({ status: 1 });
resourceAvailabilitySchema.index({ date: 1, startTime: 1, endTime: 1 });

const ResourceAvailability = mongoose.model('ResourceAvailability', resourceAvailabilitySchema);

export default ResourceAvailability;








