import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema({
  reservationNumber: {
    type: String,
    unique: true,
    required: false, // Will be generated in pre-save hook
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource',
    required: true,
  },
  
  // Dates and times
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        return value > this.startTime;
      },
      message: 'End time must be after start time',
    },
  },
  durationHours: {
    type: Number,
    required: true,
    min: 0,
  },
  timezone: {
    type: String,
    required: true,
    default: 'UTC',
  },
  
  // Reservation details
  title: String,
  description: String,
  attendeesCount: Number,
  attendeesList: {
    type: [mongoose.Schema.Types.Mixed],
    default: [],
  },
  specialRequests: String,
  setupRequirements: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
  },
  
  // Status and workflow
  status: {
    type: String,
    enum: ['draft', 'pending', 'confirmed', 'paid', 'active', 'completed', 'cancelled', 'no_show', 'refunded', 'disputed'],
    default: 'pending',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'authorized', 'paid', 'partial', 'refunded', 'failed', 'cancelled'],
    default: 'pending',
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'auto_approved', 'approved', 'rejected', 'needs_review'],
    default: 'pending',
  },
  
  // Pricing
  basePrice: {
    type: Number,
    required: true,
  },
  taxAmount: {
    type: Number,
    default: 0,
  },
  discountAmount: {
    type: Number,
    default: 0,
  },
  depositAmount: {
    type: Number,
    default: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'EUR',
    maxlength: 3,
  },
  pricingDetails: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
  },
  
  // Payment
  paymentMethod: String,
  paymentGateway: String,
  transactionId: String,
  paymentDate: Date,
  refundAmount: {
    type: Number,
    default: 0,
  },
  refundDate: Date,
  
  // Cancellation
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  cancelledAt: Date,
  cancellationReason: String,
  cancellationFee: {
    type: Number,
    default: 0,
  },
  
  // Recurrence
  isRecurring: {
    type: Boolean,
    default: false,
  },
  recurrencePattern: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
  },
  recurrenceEndDate: Date,
  parentReservationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reservation',
  },
  
  // Access
  accessCode: String,
  qrCodeUrl: String,
  checkInTime: Date,
  checkOutTime: Date,
  
  // Evaluation
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  review: String,
  reviewDate: Date,
  
  // Metadata
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
  },
  ipAddress: String,
  userAgent: String,
  
  // Audit timestamps
  confirmedAt: Date,
  reminderSentAt: Date,
}, {
  timestamps: true,
});

// Indexes
reservationSchema.index({ userId: 1 });
reservationSchema.index({ resourceId: 1 });
reservationSchema.index({ status: 1 });
reservationSchema.index({ startTime: 1, endTime: 1 });
reservationSchema.index({ reservationNumber: 1 }, { unique: true });
reservationSchema.index({ paymentStatus: 1 });

// Generate reservation number before validation (so it's available for validation)
reservationSchema.pre('validate', async function(next) {
  if (!this.reservationNumber) {
    try {
      // Use mongoose.model to get the model (it's already registered at this point)
      const ReservationModel = mongoose.models.Reservation || mongoose.model('Reservation');
      const count = await ReservationModel.countDocuments();
      // Generate unique reservation number with timestamp and counter
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000);
      this.reservationNumber = `RES-${timestamp}-${String(count + 1).padStart(6, '0')}-${String(random).padStart(3, '0')}`;
    } catch (error) {
      // Fallback if count fails - use timestamp and random number
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000);
      this.reservationNumber = `RES-${timestamp}-${random}`;
    }
  }
  next();
});

const Reservation = mongoose.model('Reservation', reservationSchema);

export default Reservation;





