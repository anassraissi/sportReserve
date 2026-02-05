import mongoose from 'mongoose';

const resourceCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  slug: {
    type: String,
    unique: true,
    required: true,
  },
  description: String,
  icon: String,
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ResourceCategory',
  },
  order: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

const ResourceCategory = mongoose.model('ResourceCategory', resourceCategorySchema);
export default ResourceCategory;








