import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { getRegionalWeatherSummary } from '../utils/regionWeatherService.js';

const router = express.Router();

// Get regional weather summary (today + tomorrow)
router.get('/regions', authenticate, async (req, res) => {
  try {
    const summary = await getRegionalWeatherSummary();
    res.json(summary);
  } catch (error) {
    console.error('Get regional weather error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
