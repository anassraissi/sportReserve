import mongoose from 'mongoose';

const bookingRuleSchema = new mongoose.Schema({
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource',
  },
  ruleType: {
    type: String,
    required: true,
    enum: ['advance', 'duration', 'frequency', 'blackout', 'capacity', 'approval', 'payment'],
  },
  name: {
    type: String,
    required: true,
  },
  description: String,
  conditions: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    required: true,
  },
  actions: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    required: true,
  },
  priority: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  validFrom: Date,
  validUntil: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Indexes
bookingRuleSchema.index({ resourceId: 1 });
bookingRuleSchema.index({ ruleType: 1 });
bookingRuleSchema.index({ isActive: 1 });

const BookingRule = mongoose.model('BookingRule', bookingRuleSchema);

export default BookingRule;








