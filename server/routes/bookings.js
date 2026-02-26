import express from 'express';
import { body, validationResult, query } from 'express-validator';
import Reservation from '../models/Reservation.js';
import Resource from '../models/Resource.js';
import ResourceAvailability from '../models/ResourceAvailability.js';
import { authenticate } from '../middleware/auth.js';
import { getReservationWeatherRecommendation, getWeatherRecommendation } from '../utils/weatherService.js';
import {
  sendReservationConfirmation,
  sendReservationCancellation,
  sendReservationReminder,
  sendPaymentConfirmation,
} from '../utils/notificationService.js';

const router = express.Router();

const WEATHER_RECOMMENDATION_TTL_MS = 24 * 60 * 60 * 1000;

const getStoredWeatherRecommendation = (reservation) => {
  if (!reservation || !reservation.metadata) return null;
  if (typeof reservation.metadata.get === 'function') {
    return reservation.metadata.get('weatherRecommendation');
  }
  return reservation.metadata.weatherRecommendation || null;
};

const setStoredWeatherRecommendation = (reservation, recommendation) => {
  if (!reservation) return;
  if (!reservation.metadata) {
    reservation.metadata = new Map();
  }
  if (typeof reservation.metadata.set === 'function') {
    reservation.metadata.set('weatherRecommendation', recommendation);
  } else {
    reservation.metadata.weatherRecommendation = recommendation;
  }
};

const isRecommendationStale = (recommendation) => {
  if (!recommendation || !recommendation.updatedAt) return true;
  const updatedAt = new Date(recommendation.updatedAt).getTime();
  if (Number.isNaN(updatedAt)) return true;
  return Date.now() - updatedAt > WEATHER_RECOMMENDATION_TTL_MS;
};

// Get all bookings
router.get('/', authenticate, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const filter = {};
    const { status, resourceId, userId, page = 1, limit = 20, admin } = req.query;

    // Admin can see all bookings
    if (admin === 'true' && req.user.role === 'admin') {
      // Show all bookings - no user filter
    } 
    // Regular users can only see their own bookings
    else if (req.user.role === 'user') {
      filter.userId = req.user._id;
    } 
    // Managers can see bookings for resources they manage
    else if (req.user.role === 'manager') {
      if (userId) filter.userId = userId;
    }

    if (status) filter.status = status;
    if (resourceId) filter.resourceId = resourceId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const reservations = await Reservation.find(filter)
      .populate('userId', 'firstName lastName email')
      .populate('resourceId', 'name type category')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Reservation.countDocuments(filter);

    res.json({
      reservations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get weather recommendations for reservations
router.get('/recommendations', authenticate, async (req, res) => {
  try {
    const { scope = 'upcoming', days = 7, limit = 20 } = req.query;

    const filter = {};
    if (req.user.role === 'user') {
      filter.userId = req.user._id;
    }

    if (scope === 'upcoming') {
      const now = new Date();
      const end = new Date(now.getTime() + Number(days) * 24 * 60 * 60 * 1000);
      filter.startTime = { $gte: now, $lte: end };
      filter.status = { $nin: ['cancelled', 'completed'] };
    }

    const reservations = await Reservation.find(filter)
      .populate({
        path: 'resourceId',
        select: 'name type latitude longitude locationId',
        populate: {
          path: 'locationId',
          select: 'name address latitude longitude city timezone',
        },
      })
      .sort({ startTime: 1 })
      .limit(Number(limit));

    const recommendations = await Promise.all(
      reservations.map(async (reservation) => {
        let recommendation = getStoredWeatherRecommendation(reservation);
        if (isRecommendationStale(recommendation)) {
          recommendation = await getReservationWeatherRecommendation(reservation);
          setStoredWeatherRecommendation(reservation, recommendation);
          await reservation.save();
        }
        return {
          reservationId: reservation._id,
          recommendation,
        };
      })
    );

    res.json({ recommendations });
  } catch (error) {
    console.error('Get weather recommendations error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Preview weather recommendation before creating a reservation
router.get('/recommendation-preview', authenticate, [
  query('resourceId').isMongoId().withMessage('Valid resourceId required'),
  query('startTime').isISO8601().withMessage('Valid startTime required'),
  query('endTime').isISO8601().withMessage('Valid endTime required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { resourceId, startTime, endTime } = req.query;
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }

    const resource = await Resource.findById(resourceId)
      .populate('locationId', 'name address latitude longitude city timezone');

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    const latitude = resource.latitude ?? resource.locationId?.latitude ?? null;
    const longitude = resource.longitude ?? resource.locationId?.longitude ?? null;

    console.log(`[Weather Preview] Resource: ${resource.name}, Lat: ${latitude}, Lon: ${longitude}`);

    if (latitude === null || longitude === null) {
      console.error(`[Weather Preview] Missing coordinates for resource ${resourceId}:`, {
        resourceLatitude: resource.latitude,
        resourceLongitude: resource.longitude,
        locationId: resource.locationId?._id,
        locationLatitude: resource.locationId?.latitude,
        locationLongitude: resource.locationId?.longitude,
      });
      return res.status(400).json({
        message: 'Resource coordinates missing',
        details: 'Please set coordinates for resource or its location',
      });
    }

    const recommendation = await getWeatherRecommendation({
      latitude,
      longitude,
      startTime,
      endTime,
    });

    console.log(`[Weather Preview] Recommendation: status=${recommendation.status}, score=${recommendation.score}`);

    res.json({ recommendation });
  } catch (error) {
    console.error('Preview weather recommendation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get weather recommendation for a specific reservation
router.get('/:id/recommendation', authenticate, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate({
        path: 'resourceId',
        select: 'name type latitude longitude locationId',
        populate: {
          path: 'locationId',
          select: 'name address latitude longitude city timezone',
        },
      });

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    if (req.user.role === 'user' && reservation.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    let recommendation = getStoredWeatherRecommendation(reservation);
    if (isRecommendationStale(recommendation)) {
      recommendation = await getReservationWeatherRecommendation(reservation);
      setStoredWeatherRecommendation(reservation, recommendation);
      await reservation.save();
    }

    res.json({ reservationId: reservation._id, recommendation });
  } catch (error) {
    console.error('Get weather recommendation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get booking by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate('userId', 'firstName lastName email phone')
      .populate('resourceId')
      .populate('cancelledBy', 'firstName lastName');

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    // Check access
    if (req.user.role === 'user' && reservation.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ reservation });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Check availability
router.get('/availability/:resourceId', [
  query('startTime').isISO8601().withMessage('Valid startTime required'),
  query('endTime').isISO8601().withMessage('Valid endTime required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { resourceId } = req.params;
    const { startTime, endTime } = req.query;

    // Check for conflicting reservations
    const conflicts = await Reservation.find({
      resourceId,
      status: { $in: ['pending', 'confirmed', 'paid', 'active'] },
      $or: [
        { startTime: { $lt: new Date(endTime) }, endTime: { $gt: new Date(startTime) } },
      ],
    });

    const isAvailable = conflicts.length === 0;

    res.json({
      available: isAvailable,
      conflicts: conflicts.length,
      conflictingReservations: conflicts.map(r => ({
        id: r._id,
        startTime: r.startTime,
        endTime: r.endTime,
      })),
    });
  } catch (error) {
    console.error('Check availability error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create booking
router.post('/', authenticate, [
  body('resourceId').isMongoId().withMessage('Valid resourceId required'),
  body('startTime').isISO8601().withMessage('Valid startTime required'),
  body('endTime').isISO8601().withMessage('Valid endTime required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { resourceId, startTime, endTime, ...otherData } = req.body;
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }

    // Check availability
    const conflicts = await Reservation.find({
      resourceId,
      status: { $in: ['pending', 'confirmed', 'paid', 'active'] },
      $or: [
        { startTime: { $lt: end }, endTime: { $gt: start } },
      ],
    });

    if (conflicts.length > 0) {
      return res.status(409).json({ message: 'Time slot is not available', conflicts });
    }

    // Get resource for pricing
    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    // Calculate duration and price
    const durationHours = (end - start) / (1000 * 60 * 60);
    const basePrice = (resource.pricePerUnit || 0) * durationHours;
    const taxRate = resource.taxRate || 20.0; // Default to 20% if not set
    const taxAmount = basePrice * (taxRate / 100);
    const totalAmount = basePrice + taxAmount;

    // Create reservation
    const reservation = new Reservation({
      userId: req.user._id,
      resourceId,
      startTime: start,
      endTime: end,
      durationHours,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      basePrice,
      taxAmount,
      totalAmount,
      currency: resource.currency || 'DH',
      description: otherData.description || otherData.notes || '',
      ...otherData,
    });

    await reservation.save();
    await reservation.populate('resourceId', 'name type');
    await reservation.populate('userId', 'firstName lastName email');

    // NOTE: Confirmation email will be sent AFTER payment is processed
    // Do NOT send confirmation here - status is still "pending"
    console.log(`[Booking] Reservation created with status: pending. Email will be sent after payment.`);

    res.status(201).json({ message: 'Reservation created', reservation });
  } catch (error) {
    console.error('Create booking error:', error);
    // Provide more detailed error message
    const errorMessage = error.message || 'Unknown error occurred';
    const errorDetails = process.env.NODE_ENV === 'development' ? error.stack : undefined;
    
    // Check for specific error types
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        error: errorMessage,
        details: error.errors 
      });
    }
    
    if (error.code === 11000) {
      return res.status(409).json({ 
        message: 'Duplicate reservation number', 
        error: 'A reservation with this number already exists' 
      });
    }
    
    res.status(500).json({ 
      message: 'Server error', 
      error: errorMessage,
      ...(errorDetails && { details: errorDetails })
    });
  }
});

// Update booking
router.put('/:id', authenticate, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    // Check access
    if (req.user.role === 'user' && reservation.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Prevent TIME modifications within 24 hours before reservation start time
    // Allow status changes (confirm, payment, etc.) anytime
    const fieldsToCheckRestriction = ['startTime', 'endTime', 'title', 'description', 'attendeesCount', 'specialRequests', 'setupRequirements'];
    const isModifyingRestrictedFields = fieldsToCheckRestriction.some(field => field in req.body);

    if (isModifyingRestrictedFields) {
      const now = new Date();
      const reservationStart = new Date(reservation.startTime);
      const hoursUntilReservation = (reservationStart - now) / (1000 * 60 * 60);

      if (hoursUntilReservation < 24 && reservation.status !== 'cancelled') {
        return res.status(403).json({ 
          message: 'Cannot modify reservation details within 24 hours before start time',
          hoursRemaining: Math.round(hoursUntilReservation * 10) / 10,
          restrictedUntil: new Date(reservationStart.getTime() - 24 * 60 * 60 * 1000).toISOString()
        });
      }
    }

    // If updating times, check availability
    if (req.body.startTime || req.body.endTime) {
      const start = new Date(req.body.startTime || reservation.startTime);
      const end = new Date(req.body.endTime || reservation.endTime);

      const conflicts = await Reservation.find({
        resourceId: reservation.resourceId,
        _id: { $ne: reservation._id },
        status: { $in: ['pending', 'confirmed', 'paid', 'active'] },
        $or: [
          { startTime: { $lt: end }, endTime: { $gt: start } },
        ],
      });

      if (conflicts.length > 0) {
        return res.status(409).json({ message: 'Time slot is not available', conflicts });
      }

      // Recalculate price if times changed
      if (req.body.startTime || req.body.endTime) {
        const resource = await Resource.findById(reservation.resourceId);
        const durationHours = (end - start) / (1000 * 60 * 60);
        reservation.basePrice = resource.pricePerUnit * durationHours;
        reservation.taxAmount = reservation.basePrice * (resource.taxRate / 100);
        reservation.totalAmount = reservation.basePrice + reservation.taxAmount;
        reservation.durationHours = durationHours;
      }
    }

    Object.assign(reservation, req.body);
    await reservation.save();
    await reservation.populate('resourceId', 'name type');
    await reservation.populate('userId', 'firstName lastName email');

    res.json({ message: 'Reservation updated', reservation });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Cancel booking
router.post('/:id/cancel', authenticate, [
  body('reason').optional().isString(),
], async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    // Check access
    if (req.user.role === 'user' && reservation.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (['cancelled', 'completed'].includes(reservation.status)) {
      return res.status(400).json({ message: 'Reservation cannot be cancelled' });
    }

    reservation.status = 'cancelled';
    reservation.cancelledBy = req.user._id;
    reservation.cancelledAt = new Date();
    reservation.cancellationReason = req.body.reason;

    await reservation.save();

    // Send cancellation notification
    try {
      const populatedReservation = await Reservation.findById(reservation._id)
        .populate('resourceId')
        .populate('userId');
      await sendReservationCancellation(populatedReservation, req.body.reason);
    } catch (notificationError) {
      console.error('Notification error:', notificationError);
    }

    res.json({ message: 'Reservation cancelled', reservation });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Check-in
router.post('/:id/check-in', authenticate, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    if (reservation.status !== 'confirmed' && reservation.status !== 'paid') {
      return res.status(400).json({ message: 'Reservation must be confirmed or paid' });
    }

    reservation.status = 'active';
    reservation.checkInTime = new Date();
    await reservation.save();

    res.json({ message: 'Checked in', reservation });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Check-out
router.post('/:id/check-out', authenticate, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    if (reservation.status !== 'active') {
      return res.status(400).json({ message: 'Reservation must be active' });
    }

    reservation.status = 'completed';
    reservation.checkOutTime = new Date();
    await reservation.save();

    res.json({ message: 'Checked out', reservation });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Process payment for reservation
router.post('/:id/payment', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, currency, cardDetails, reservationId } = req.body;

    // Validate input
    if (!amount || !cardDetails) {
      return res.status(400).json({ message: 'Invalid payment data' });
    }

    // Fetch reservation
    const reservation = await Reservation.findById(id)
      .populate('userId')
      .populate('resourceId');

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    // Verify user owns this reservation
    if (reservation.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (reservation.paymentStatus === 'paid' || reservation.status === 'paid') {
      return res.json({
        success: true,
        message: 'Payment already processed',
        paymentId: reservation.paymentId,
        reservation: reservation,
      });
    }

    // Verify amount matches
    if (Math.round(amount / 100) !== Math.round(reservation.totalAmount)) {
      return res.status(400).json({ message: 'Payment amount mismatch' });
    }

    // Process payment (in production, use Stripe API)
    // For now, simulate successful payment
    console.log('Processing payment:', {
      reservationId: id,
      amount: amount / 100,
      currency,
      cardLastFour: cardDetails.number.slice(-4),
      cardholder: cardDetails.name,
    });

    // Update reservation status
    reservation.status = 'paid';
    reservation.paymentStatus = 'paid';
    reservation.paymentMethod = 'card';
    reservation.paymentDate = new Date();
    reservation.paymentId = 'PAY_' + Date.now();

    await reservation.save();

    // Send BOTH confirmation and payment emails after successful payment
    try {
      const populatedReservation = await Reservation.findById(reservation._id)
        .populate('resourceId')
        .populate('userId');
      
      // Send reservation confirmation email
      await sendReservationConfirmation(populatedReservation);
      console.log(`[Payment] ✅ Reservation confirmation email sent for reservation ${reservation._id}`);
      
      // Send payment confirmation email with address and details
      await sendPaymentConfirmation(populatedReservation);
      console.log(`[Payment] ✅ Payment confirmation email sent for reservation ${reservation._id}`);
    } catch (notificationError) {
      console.error(`[Payment] ❌ Notification error for reservation ${reservation._id}:`, notificationError.message);
      // Don't fail the request due to notification issues
    }

    res.json({
      success: true,
      message: 'Payment processed successfully',
      paymentId: reservation.paymentId,
      reservation: reservation,
    });
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Payment processing failed', 
      error: error.message 
    });
  }
});

// Get payment status
router.get('/:id/payment-status', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const reservation = await Reservation.findById(id);

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    // Verify user owns this reservation
    if (reservation.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json({
      paymentStatus: reservation.paymentStatus,
      paymentId: reservation.paymentId,
      reservation: reservation,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;





