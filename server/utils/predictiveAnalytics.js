import Reservation from '../models/Reservation.js';
import Resource from '../models/Resource.js';

/**
 * Predictive Analytics & Price Optimizer
 * Forecasts demand, predicts no-shows, and optimizes pricing
 */

export class PredictiveAnalytics {
  constructor(genAI, model) {
    this.genAI = genAI;
    this.model = model;
  }

  /**
   * Forecast demand for a resource
   */
  async forecastDemand(resourceId, options = {}) {
    try {
      const days = options.days || 30;
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);

      // Get historical data
      const historicalReservations = await Reservation.find({
        resourceId,
        startTime: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
        status: { $in: ['confirmed', 'paid', 'completed'] }
      }).sort({ startTime: 1 });

      if (historicalReservations.length < 5) {
        return this.getDefaultForecast(resourceId, days);
      }

      // Analyze patterns
      const patterns = this.analyzeReservationPatterns(historicalReservations);

      // Generate forecast
      const forecast = this.generateForecast(patterns, days);

      return forecast;
    } catch (error) {
      console.error('Demand forecast error:', error);
      return [];
    }
  }

  /**
   * Analyze reservation patterns
   */
  analyzeReservationPatterns(reservations) {
    const patterns = {
      byDayOfWeek: {},
      byHour: {},
      byDate: {},
      total: reservations.length,
      peakHours: [],
      peakDays: []
    };

    reservations.forEach(reservation => {
      const date = new Date(reservation.startTime);
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
      const hour = date.getHours();
      const dateStr = date.toISOString().split('T')[0];

      // By day of week
      patterns.byDayOfWeek[dayOfWeek] = (patterns.byDayOfWeek[dayOfWeek] || 0) + 1;

      // By hour
      patterns.byHour[hour] = (patterns.byHour[hour] || 0) + 1;

      // By date
      patterns.byDate[dateStr] = (patterns.byDate[dateStr] || 0) + 1;
    });

    // Get peak hours and days
    patterns.peakHours = Object.entries(patterns.byHour)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([hour, count]) => ({ hour: parseInt(hour), bookings: count }));

    patterns.peakDays = Object.entries(patterns.byDayOfWeek)
      .sort((a, b) => b[1] - a[1])
      .map(([day, count]) => ({ day, bookings: count }));

    return patterns;
  }

  /**
   * Generate demand forecast
   */
  generateForecast(patterns, days) {
    const forecast = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
      const forecastDate = new Date(today);
      forecastDate.setDate(forecastDate.getDate() + i);

      const dayOfWeek = forecastDate.toLocaleDateString('en-US', { weekday: 'long' });
      const dayPatterns = patterns.byDayOfWeek[dayOfWeek] || 0;
      const avgDaily = patterns.total / 90; // Average per day

      // Calculate demand level
      const expectedBookings = dayPatterns > 0 ? dayPatterns : avgDaily;
      const demandLevel = this.calculateDemandLevel(expectedBookings);

      forecast.push({
        date: forecastDate.toISOString().split('T')[0],
        dayOfWeek,
        expectedBookings: Math.round(expectedBookings),
        demandLevel,
        recommendedPrice: this.calculateOptimalPrice(demandLevel),
        peakHours: patterns.peakHours.map(h => h.hour),
        confidence: '75%'
      });
    }

    return forecast;
  }

  /**
   * Calculate demand level
   */
  calculateDemandLevel(bookings) {
    if (bookings >= 8) return 'Very High';
    if (bookings >= 6) return 'High';
    if (bookings >= 3) return 'Medium';
    if (bookings >= 1) return 'Low';
    return 'Very Low';
  }

  /**
   * Calculate optimal price based on demand
   */
  calculateOptimalPrice(demandLevel, basePrice = 100) {
    const priceMultipliers = {
      'Very High': 1.4,
      'High': 1.25,
      'Medium': 1.0,
      'Low': 0.85,
      'Very Low': 0.7
    };

    const multiplier = priceMultipliers[demandLevel] || 1.0;
    return Math.round(basePrice * multiplier);
  }

  /**
   * Get default forecast (no historical data)
   */
  async getDefaultForecast(resourceId, days = 30) {
    const resource = await Resource.findById(resourceId);
    const forecast = [];

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });

      const demandLevel = ['Monday', 'Wednesday', 'Friday'].includes(dayOfWeek) ? 'Medium' : 'Low';

      forecast.push({
        date: date.toISOString().split('T')[0],
        dayOfWeek,
        expectedBookings: 3,
        demandLevel,
        recommendedPrice: this.calculateOptimalPrice(demandLevel, resource?.basePrice || 100),
        peakHours: [16, 17, 18, 19],
        confidence: '50%'
      });
    }

    return forecast;
  }

  /**
   * Predict no-show probability for a reservation
   */
  async predictNoShow(reservationId) {
    try {
      const reservation = await Reservation.findById(reservationId)
        .populate('userId')
        .populate('resourceId');

      if (!reservation) {
        return null;
      }

      // Analyze user history
      const userReservations = await Reservation.find({
        userId: reservation.userId._id,
        status: { $in: ['confirmed', 'paid', 'no-show'] }
      });

      const noShowCount = userReservations.filter(r => r.status === 'no-show').length;
      const totalReservations = userReservations.length;
      const userNoShowRate = totalReservations > 0 ? (noShowCount / totalReservations) : 0;

      // Check resource patterns
      const resourceNoShows = await Reservation.countDocuments({
        resourceId: reservation.resourceId._id,
        status: 'no-show'
      });

      const resourceTotal = await Reservation.countDocuments({
        resourceId: reservation.resourceId._id
      });

      const resourceNoShowRate = resourceTotal > 0 ? (resourceNoShows / resourceTotal) : 0;

      // Combine factors
      const hoursUntilReservation = (reservation.startTime - new Date()) / (1000 * 60 * 60);
      const timeUrgency = hoursUntilReservation < 2 ? 0.15 : hoursUntilReservation < 24 ? 0.05 : 0;

      const noShowProbability = (userNoShowRate * 0.5 + resourceNoShowRate * 0.3 + timeUrgency * 0.2);

      return {
        reservationId,
        noShowProbability: (noShowProbability * 100).toFixed(1) + '%',
        riskLevel: noShowProbability > 0.4 ? 'High' : noShowProbability > 0.2 ? 'Medium' : 'Low',
        userHistory: {
          totalReservations,
          noShowCount,
          noShowRate: (userNoShowRate * 100).toFixed(1) + '%'
        },
        resourceHistory: {
          totalReservations: resourceTotal,
          noShowCount: resourceNoShows,
          noShowRate: (resourceNoShowRate * 100).toFixed(1) + '%'
        },
        recommendation: noShowProbability > 0.3 
          ? 'Considérez une confirmation 24h avant'
          : 'Pas de risque détecté'
      };
    } catch (error) {
      console.error('No-show prediction error:', error);
      return null;
    }
  }

  /**
   * Get revenue optimization recommendations
   */
  async getRevenueOptimization(resourceId, options = {}) {
    try {
      const resource = await Resource.findById(resourceId);
      const days = options.days || 30;

      // Get forecast
      const forecast = await this.forecastDemand(resourceId, { days });

      // Calculate potential revenue
      let currentRevenue = 0;
      let optimizedRevenue = 0;
      let recommendations = [];

      forecast.forEach(day => {
        currentRevenue += resource.basePrice * day.expectedBookings;
        optimizedRevenue += day.recommendedPrice * day.expectedBookings;
      });

      const potentialIncrease = optimizedRevenue - currentRevenue;
      const increasePercentage = ((potentialIncrease / currentRevenue) * 100).toFixed(1);

      if (potentialIncrease > 0) {
        recommendations.push({
          title: 'Optimiser les prix',
          description: `Augmenter les prix pendant les pics de demande pourrait générer +${potentialIncrease}DH`,
          impact: `+${increasePercentage}%`
        });
      }

      // Peak hour recommendations
      const peakHours = forecast[0]?.peakHours || [];
      if (peakHours.length > 0) {
        recommendations.push({
          title: 'Heures de pointe',
          description: `Heures de forte demande: ${peakHours.join(', ')}h. Appliquer tarif premium.`,
          impact: '+15-25%'
        });
      }

      // Occupancy recommendations
      const avgOccupancy = (forecast.reduce((sum, d) => sum + d.expectedBookings, 0) / forecast.length);
      if (avgOccupancy < 3) {
        recommendations.push({
          title: 'Augmenter la visibilité',
          description: 'Taux d\'occupation faible. Promouvoir la ressource ou offrir des réductions.',
          impact: '+30-40%'
        });
      }

      return {
        resourceId,
        currentDailyRate: resource.basePrice,
        forecastPeriod: `${days} jours`,
        currentProjectedRevenue: Math.round(currentRevenue),
        optimizedProjectedRevenue: Math.round(optimizedRevenue),
        potentialIncrease: Math.round(potentialIncrease),
        increasePercentage: parseFloat(increasePercentage),
        recommendations
      };
    } catch (error) {
      console.error('Revenue optimization error:', error);
      return null;
    }
  }

  /**
   * Get occupancy trends
   */
  async getOccupancyTrends(resourceId, options = {}) {
    try {
      const days = options.days || 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const dailyReservations = await Reservation.aggregate([
        {
          $match: {
            resourceId: require('mongoose').Types.ObjectId(resourceId),
            startTime: { $gte: startDate },
            status: { $in: ['confirmed', 'paid', 'completed'] }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$startTime' }
            },
            count: { $sum: 1 },
            revenue: { $sum: '$totalPrice' }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);

      const avgDaily = dailyReservations.length > 0
        ? dailyReservations.reduce((sum, d) => sum + d.count, 0) / dailyReservations.length
        : 0;

      const totalRevenue = dailyReservations.reduce((sum, d) => sum + d.revenue, 0);

      return {
        resourceId,
        period: `${days} jours`,
        averageDailyBookings: avgDaily.toFixed(1),
        totalReservations: dailyReservations.reduce((sum, d) => sum + d.count, 0),
        totalRevenue,
        dailyBreakdown: dailyReservations.slice(-7).map(d => ({
          date: d._id,
          bookings: d.count,
          revenue: d.revenue
        }))
      };
    } catch (error) {
      console.error('Occupancy trends error:', error);
      return null;
    }
  }
}

export default PredictiveAnalytics;
