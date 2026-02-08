import express from 'express';
import { body, validationResult, query } from 'express-validator';
import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Resource from '../models/Resource.js';
import MediaAsset from '../models/MediaAsset.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get all reviews
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, resourceId, userId } = req.query;

    const filter = { status: 'approved' };

    if (resourceId) {
      filter.resourceId = resourceId;
    }

    if (userId) {
      filter.userId = userId;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const reviews = await Review.find(filter)
      .populate('userId', 'firstName lastName avatarUrl')
      .populate('resourceId', 'name type')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    // Add first image from MediaAsset for each resource
    const reviewsWithImages = await Promise.all(reviews.map(async (review) => {
      const reviewObj = review.toObject();
      if (reviewObj.resourceId && reviewObj.resourceId._id) {
        const firstImage = await MediaAsset.findOne({
          resourceId: reviewObj.resourceId._id,
          mediaType: 'image'
        }).sort({ displayOrder: 1, createdAt: 1 });
        
        if (firstImage) {
          reviewObj.resourceId.imageUrl = firstImage.originalUrl;
        }
      }
      return reviewObj;
    }));

    const total = await Review.countDocuments(filter);

    res.json({
      reviews: reviewsWithImages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get review by ID
router.get('/:id', async (req, res) => {
  try {
    // Skip if ID looks like a special route
    if (req.params.id === 'resource') {
      return res.status(400).json({ message: 'Invalid review ID' });
    }

    const review = await Review.findById(req.params.id)
      .populate('userId', 'firstName lastName avatarUrl')
      .populate('resourceId', 'name type');

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Add first image from MediaAsset for the resource
    const reviewObj = review.toObject();
    if (reviewObj.resourceId && reviewObj.resourceId._id) {
      const firstImage = await MediaAsset.findOne({
        resourceId: reviewObj.resourceId._id,
        mediaType: 'image'
      }).sort({ displayOrder: 1, createdAt: 1 });
      
      if (firstImage) {
        reviewObj.resourceId.imageUrl = firstImage.originalUrl;
      }
    }

    res.json({ review: reviewObj });
  } catch (error) {
    console.error('Get review error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create review
router.post(
  '/',
  authenticate,
  [
    body('resourceId').notEmpty().withMessage('Resource ID required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
    body('comment').notEmpty().isLength({ min: 3, max: 1000 }).withMessage('Comment required (3-1000 chars)'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      const { reservationId, resourceId, rating, comment } = req.body;

      // Check if resource exists
      const resource = await Resource.findById(resourceId);
      if (!resource) {
        return res.status(404).json({ message: 'Resource not found' });
      }

      // Check if user already reviewed this reservation (if reservationId provided)
      if (reservationId) {
        const existingReview = await Review.findOne({
          reservationId,
          userId: req.user._id,
        });
        if (existingReview) {
          return res.status(400).json({ message: 'You have already reviewed this reservation' });
        }
      }

      const review = new Review({
        reservationId: reservationId || null,
        resourceId,
        userId: req.user._id,
        rating,
        comment,
        status: 'approved',
      });

      await review.save();
      await review.populate('userId', 'firstName lastName avatarUrl');
      await review.populate('resourceId', 'name type');

      // Add first image from MediaAsset for the resource
      const reviewObj = review.toObject();
      if (reviewObj.resourceId && reviewObj.resourceId._id) {
        const firstImage = await MediaAsset.findOne({
          resourceId: reviewObj.resourceId._id,
          mediaType: 'image'
        }).sort({ displayOrder: 1, createdAt: 1 });
        
        if (firstImage) {
          reviewObj.resourceId.imageUrl = firstImage.originalUrl;
        }
      }

      res.status(201).json({ review: reviewObj });
    } catch (error) {
      console.error('Create review error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// Update review
router.put(
  '/:id',
  authenticate,
  [
    body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
    body('comment').optional().isLength({ min: 3, max: 1000 }).withMessage('Comment must be 3-1000 chars'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
      }

      const review = await Review.findById(req.params.id);
      if (!review) {
        return res.status(404).json({ message: 'Review not found' });
      }

      // Check ownership
      if (review.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }

      const { rating, comment } = req.body;
      if (rating) review.rating = rating;
      if (comment) review.comment = comment;

      await review.save();
      await review.populate('userId', 'firstName lastName avatarUrl');
      await review.populate('resourceId', 'name type');

      res.json({ review });
    } catch (error) {
      console.error('Update review error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// Delete review
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check ownership
    if (review.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Review.findByIdAndDelete(req.params.id);
    res.json({ message: 'Review deleted' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
