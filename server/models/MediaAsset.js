import mongoose from 'mongoose';

const mediaAssetSchema = new mongoose.Schema({
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource',
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  
  // File information
  mediaType: {
    type: String,
    required: true,
    enum: ['image', 'video', 'document', '360_image', 'panorama', 'floor_plan'],
  },
  fileName: {
    type: String,
    required: true,
  },
  originalName: String,
  mimeType: {
    type: String,
    required: true,
  },
  fileSize: {
    type: Number,
    required: true,
  },
  extension: String,
  
  // Storage URLs
  originalUrl: {
    type: String,
    required: true,
  },
  thumbnailUrl: String,
  optimizedUrl: String,
  compressedUrl: String,
  watermarkUrl: String,
  
  // Versions and transformations
  versions: {
    type: Map,
    of: String,
    default: {},
  },
  transformations: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
  },
  
  // Technical metadata
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
  },
  dimensions: {
    width: Number,
    height: Number,
    aspectRatio: String,
  },
  duration: Number, // seconds for videos
  bitrate: Number,
  frameRate: Number,
  
  // AI Analysis
  aiAnalysis: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
  },
  contentModeration: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
  },
  
  // Classification
  category: String,
  purpose: {
    type: String,
    enum: ['hero', 'gallery', 'thumbnail', 'documentation'],
  },
  tags: {
    type: [String],
    default: [],
  },
  description: String,
  altText: {
    type: String,
    maxlength: 500,
  },
  
  // Quality and validation
  qualityScore: {
    type: Number,
    min: 1,
    max: 100,
  },
  isPrimary: {
    type: Boolean,
    default: false,
  },
  isApproved: {
    type: Boolean,
    default: false,
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'needs_review'],
    default: 'pending',
  },
  rejectionReason: String,
  
  // Usage statistics
  viewCount: {
    type: Number,
    default: 0,
  },
  downloadCount: {
    type: Number,
    default: 0,
  },
  lastViewed: Date,
  
  // Security
  accessLevel: {
    type: String,
    enum: ['public', 'private', 'restricted'],
    default: 'public',
  },
  watermarkText: String,
  expiresAt: Date,
  
  // Audit
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Indexes
mediaAssetSchema.index({ resourceId: 1 });
mediaAssetSchema.index({ mediaType: 1 });
mediaAssetSchema.index({ purpose: 1 });
mediaAssetSchema.index({ isApproved: 1 });
mediaAssetSchema.index({ tags: 1 });
mediaAssetSchema.index({ uploadedBy: 1 });

const MediaAsset = mongoose.model('MediaAsset', mediaAssetSchema);

export default MediaAsset;








