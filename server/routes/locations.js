import express from 'express';
import { body, query, validationResult } from 'express-validator';
import Location from '../models/Location.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all locations (admin)
router.get('/', authenticate, authorize('admin'), [
  query('active').optional().isBoolean(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const filter = {};
    if (req.query.active === 'true') {
      filter.isActive = true;
    }

    const locations = await Location.find(filter).sort({ name: 1 });
    res.json({ locations });
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create location (admin)
router.post('/', authenticate, authorize('admin'), [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const location = new Location(req.body);
    await location.save();

    res.status(201).json({ message: 'Location created', location });
  } catch (error) {
    console.error('Create location error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
