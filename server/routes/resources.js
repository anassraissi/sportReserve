import express from 'express';
import { body, validationResult, query } from 'express-validator';
import Resource from '../models/Resource.js';
import ResourceCategory from '../models/ResourceCategory.js';
import EquipmentItem from '../models/EquipmentItem.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all resources with filters
router.get('/', [
  query('type').optional().isIn(['terrain', 'salle', 'equipment']),
  query('categoryId').optional().isMongoId(),
  query('locationId').optional().isMongoId(),
  query('status').optional().isIn(['active', 'maintenance', 'inactive']),
  query('search').optional().isString(),
  query('managerId').optional().isMongoId(),
  query('admin').optional().isBoolean(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { type, categoryId, locationId, status, search, managerId, page = 1, limit = 20, admin } = req.query;
    const filter = {};

    // If admin is requesting all resources
    if (admin === 'true') {
      // Show all resources - no manager filter
    } 
    // If managerId is provided, filter by it (for managers to see only their resources)
    else if (managerId) {
      filter.managerId = managerId;
    }

    if (type) filter.type = type;
    if (categoryId) filter.categoryId = categoryId;
    if (locationId) filter.locationId = locationId;
    if (status) filter.status = status;
    else filter.status = { $ne: 'deleted' };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const resources = await Resource.find(filter)
      .populate('categoryId', 'name')
      .populate('locationId', 'name address')
      .populate('managerId', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Resource.countDocuments(filter);

    res.json({
      resources,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get resources error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Search resources
router.get('/search', async (req, res) => {
  try {
    const { q, type, locationId } = req.query;
    const filter = { status: 'active' };

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } },
      ];
    }

    if (type) filter.type = type;
    if (locationId) filter.locationId = locationId;

    const resources = await Resource.find(filter)
      .populate('locationId', 'name address')
      .limit(50)
      .sort({ averageRating: -1, totalBookings: -1 });

    res.json({ resources });
  } catch (error) {
    console.error('Search resources error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get resource by ID
router.get('/:id', async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id)
      .populate('categoryId')
      .populate('locationId')
      .populate('managerId', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName');

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    res.json({ resource });
  } catch (error) {
    console.error('Get resource error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create resource
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const data = req.body;
    data.createdBy = req.user._id;
    data.managerId = req.user._id; // treat admin as owner
    
    // Generate slug from name
    if (!data.slug) {
      data.slug = data.name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    // Ensure required fields have defaults
    if (!data.status) data.status = 'active';
    if (!data.pricingModel) data.pricingModel = 'hourly';
    if (!data.currency) data.currency = 'DH';
    if (!data.unit) {
      // Set default unit based on type
      if (data.type === 'terrain') data.unit = 'players';
      else if (data.type === 'salle') data.unit = 'persons';
      else data.unit = 'items';
    }

    const resource = new Resource(data);
    await resource.save();

    res.status(201).json({ message: 'Resource created', resource });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Resource with this slug already exists' });
    }
    console.error('Create resource error:', error);
    // Return more detailed error message
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: 'Validation error', errors });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update resource
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    Object.assign(resource, req.body);
    resource.updatedBy = req.user._id;
    await resource.save();

    res.json({ message: 'Resource updated', resource });
  } catch (error) {
    console.error('Update resource error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete resource
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    resource.status = 'deleted';
    await resource.save();

    res.json({ message: 'Resource deleted' });
  } catch (error) {
    console.error('Delete resource error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get categories
router.get('/categories/all', async (req, res) => {
  try {
    const categories = await ResourceCategory.find({ isActive: true })
      .sort({ order: 1, name: 1 });
    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get equipment for resource
router.get('/:id/equipment', async (req, res) => {
  try {
    const equipment = await EquipmentItem.find({ resourceId: req.params.id })
      .sort({ name: 1 });
    res.json({ equipment });
  } catch (error) {
    console.error('Get equipment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;

