import mongoose from 'mongoose';

const equipmentItemSchema = new mongoose.Schema({
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource',
  },
  serialNumber: {
    type: String,
    unique: true,
    sparse: true,
  },
  name: {
    type: String,
    required: true,
  },
  model: String,
  brand: String,
  condition: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor', 'needs_repair'],
    default: 'excellent',
  },
  status: {
    type: String,
    enum: ['available', 'reserved', 'in_use', 'maintenance', 'lost', 'damaged', 'retired'],
    default: 'available',
  },
  purchaseDate: Date,
  purchasePrice: Number,
  warrantyExpiry: Date,
  lastMaintenanceDate: Date,
  nextMaintenanceDate: Date,
  maintenanceNotes: String,
  location: String,
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

// Indexes
equipmentItemSchema.index({ resourceId: 1 });
equipmentItemSchema.index({ status: 1 });
equipmentItemSchema.index({ condition: 1 });

const EquipmentItem = mongoose.model('EquipmentItem', equipmentItemSchema);

export default EquipmentItem;

