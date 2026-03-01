/**
 * 🤖 Routes API pour Service IA Professionnel
 * Endpoints pour clients et admins
 */

import express from 'express';
import { authenticate } from '../middleware/auth.js';
import AIService from '../utils/aiService.js';
import Reservation from '../models/Reservation.js';
import Resource from '../models/Resource.js';
import User from '../models/User.js';

const router = express.Router();

// Initialiser service IA
let aiService = null;

// Fonction pour initialiser le service IA
async function initializeAIService() {
  if (aiService) return aiService;

  const USE_GEMINI = process.env.GEMINI_API_KEY ? true : false;

  if (USE_GEMINI) {
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      aiService = new AIService(genAI, model);
      return aiService;
    } catch (error) {
      console.error('Failed to initialize Gemini AI:', error);
    }
  }

  // Fallback: service basique sans IA
  aiService = {
    parseNaturalLanguageBooking: async () => ({ success: false, error: 'IA non configurée' }),
    getPersonalizedRecommendationsWithWeather: async () => [],
    generateIntelligentReminders: async () => ({ success: false }),
    detectSuspiciousBehavior: async () => ({ alerts: [] }),
    getDemandPredictions: async () => [],
    getAdminDashboardInsights: async () => ({ error: 'IA non configurée' }),
    createIntelligentAlert: async () => ({ success: false }),
    calculateDynamicPrice: () => ({ basePrice: 100, finalPrice: 100, multiplier: '1.0' }),
    model: null
  };
  return aiService;
}

// Initialiser au chargement
initializeAIService();

// ============================================
// 👤 CLIENT ENDPOINTS
// ============================================

/**
 * POST /api/ai/booking/parse
 * Parser réservation en langage naturel
 * Ex: "Je veux terrain foot vendredi soir à Rabat"
 */
router.post('/booking/parse', authenticate, async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user._id;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message requis' });
    }

    const service = await initializeAIService();
    
    if (!service || !service.parseNaturalLanguageBooking || service.model === null) {
      return res.status(503).json({ 
        message: 'Service IA non configuré',
        note: 'Configurez GEMINI_API_KEY dans .env'
      });
    }

    const result = await service.parseNaturalLanguageBooking(message, userId);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Parse booking error:', error);
    res.status(500).json({ 
      message: 'Erreur lors du parsing',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/ai/recommendations/personalized-weather
 * Recommandations personnalisées avec météo
 */
router.get('/recommendations/personalized-weather', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 10;
    const date = req.query.date ? new Date(req.query.date) : new Date();

    const service = await initializeAIService();
    
    if (!service || !service.getPersonalizedRecommendationsWithWeather || service.model === null) {
      return res.status(503).json({ message: 'Service IA non configuré' });
    }

    const recommendations = await service.getPersonalizedRecommendationsWithWeather(userId, {
      limit,
      date
    });

    res.json({
      success: true,
      recommendations,
      count: recommendations.length
    });
  } catch (error) {
    console.error('Personalized recommendations error:', error);
    res.status(500).json({ message: 'Erreur lors de la génération des recommandations' });
  }
});

/**
 * POST /api/ai/reminders/generate
 * Générer rappels intelligents (appelé par cron job)
 */
router.post('/reminders/generate', authenticate, async (req, res) => {
  try {
    // Vérifier admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const service = await initializeAIService();
    
    if (!service || !service.generateIntelligentReminders || service.model === null) {
      return res.status(503).json({ message: 'Service IA non configuré' });
    }

    const result = await service.generateIntelligentReminders();

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Generate reminders error:', error);
    res.status(500).json({ message: 'Erreur lors de la génération des rappels' });
  }
});

/**
 * GET /api/ai/pricing/dynamic
 * Calculer prix dynamique pour une ressource
 */
router.get('/pricing/dynamic', authenticate, async (req, res) => {
  try {
    const { resourceId, date, time } = req.query;

    if (!resourceId || !date || !time) {
      return res.status(400).json({ message: 'resourceId, date et time requis' });
    }

    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({ message: 'Ressource non trouvée' });
    }

    const service = await initializeAIService();
    
    if (!service || !service.calculateDynamicPrice) {
      return res.status(503).json({ message: 'Service IA non configuré' });
    }

    const pricing = service.calculateDynamicPrice(resource, date, time);

    res.json({
      success: true,
      pricing
    });
  } catch (error) {
    console.error('Dynamic pricing error:', error);
    res.status(500).json({ message: 'Erreur lors du calcul du prix' });
  }
});

// ============================================
// 👨‍💼 ADMIN ENDPOINTS
// ============================================

/**
 * GET /api/ai/admin/dashboard
 * Dashboard intelligent avec insights IA
 */
router.get('/admin/dashboard', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const service = await initializeAIService();
    
    if (!service || !service.getAdminDashboardInsights || service.model === null) {
      return res.status(503).json({ message: 'Service IA non configuré' });
    }

    const insights = await service.getAdminDashboardInsights();

    res.json({
      success: true,
      ...insights
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ message: 'Erreur lors du chargement du dashboard' });
  }
});

/**
 * GET /api/ai/admin/suspicious-behavior
 * Détecter comportement suspect
 */
router.get('/admin/suspicious-behavior', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: 'userId requis' });
    }

    const service = await initializeAIService();
    
    if (!service || !service.detectSuspiciousBehavior || service.model === null) {
      return res.status(503).json({ message: 'Service IA non configuré' });
    }

    const result = await service.detectSuspiciousBehavior(userId);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Suspicious behavior detection error:', error);
    res.status(500).json({ message: 'Erreur lors de la détection' });
  }
});

/**
 * GET /api/ai/admin/demand-predictions
 * Prédictions de demande
 */
router.get('/admin/demand-predictions', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const resourceId = req.query.resourceId;
    const days = parseInt(req.query.days) || 30;

    const service = await initializeAIService();
    
    if (!service || !service.getDemandPredictions || service.model === null) {
      return res.status(503).json({ message: 'Service IA non configuré' });
    }

    const predictions = await service.getDemandPredictions({
      resourceId,
      days
    });

    res.json({
      success: true,
      predictions,
      period: `${days} jours`
    });
  } catch (error) {
    console.error('Demand predictions error:', error);
    res.status(500).json({ message: 'Erreur lors de la prédiction' });
  }
});

/**
 * POST /api/ai/admin/alert
 * Créer alerte intelligente
 */
router.post('/admin/alert', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const { userId, type, data } = req.body;

    if (!userId || !type) {
      return res.status(400).json({ message: 'userId et type requis' });
    }

    const service = await initializeAIService();
    
    if (!service || !service.createIntelligentAlert || service.model === null) {
      return res.status(503).json({ message: 'Service IA non configuré' });
    }

    const result = await service.createIntelligentAlert(userId, type, data);

    res.json({
      success: result.success,
      ...result
    });
  } catch (error) {
    console.error('Create alert error:', error);
    res.status(500).json({ message: 'Erreur lors de la création de l\'alerte' });
  }
});

/**
 * GET /api/ai/admin/analytics
 * Analytics avancées avec IA
 */
router.get('/admin/analytics', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Analytics de base
    const [
      totalReservations,
      totalRevenue,
      avgBookingValue,
      topSports,
      peakHours,
      cancellationRate
    ] = await Promise.all([
      Reservation.countDocuments({
        createdAt: { $gte: startDate },
        status: { $in: ['confirmed', 'paid', 'completed'] }
      }),
      Reservation.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            status: { $in: ['confirmed', 'paid', 'completed'] }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalAmount' }
          }
        }
      ]),
      Reservation.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            status: { $in: ['confirmed', 'paid', 'completed'] }
          }
        },
        {
          $group: {
            _id: null,
            avg: { $avg: '$totalAmount' }
          }
        }
      ]),
      Reservation.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            status: { $in: ['confirmed', 'paid', 'completed'] }
          }
        },
        {
          $lookup: {
            from: 'resources',
            localField: 'resourceId',
            foreignField: '_id',
            as: 'resource'
          }
        },
        {
          $unwind: '$resource'
        },
        {
          $group: {
            _id: '$resource.type',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      Reservation.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            status: { $in: ['confirmed', 'paid', 'completed'] }
          }
        },
        {
          $group: {
            _id: { $hour: '$startTime' },
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      Reservation.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            cancelled: {
              $sum: {
                $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0]
              }
            }
          }
        }
      ])
    ]);

    const revenue = totalRevenue[0]?.total || 0;
    const avgValue = avgBookingValue[0]?.avg || 0;
    const cancelled = cancellationRate[0]?.cancelled || 0;
    const total = cancellationRate[0]?.total || 1;
    const cancelRate = (cancelled / total) * 100;

    res.json({
      success: true,
      period: `${days} jours`,
      overview: {
        totalReservations,
        totalRevenue: revenue,
        averageBookingValue: Math.round(avgValue),
        cancellationRate: cancelRate.toFixed(1) + '%'
      },
      topSports: topSports.map(s => ({
        sport: s._id,
        bookings: s.count
      })),
      peakHours: peakHours.map(h => ({
        hour: h._id,
        bookings: h.count
      })),
      insights: await generateAnalyticsInsights({
        totalReservations,
        revenue,
        cancelRate,
        topSports,
        peakHours
      })
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Erreur lors du calcul des analytics' });
  }
});

/**
 * Générer insights analytics avec IA
 */
async function generateAnalyticsInsights(data) {
  const service = await initializeAIService();
  
  if (!service || !service.model) {
    return [];
  }

  try {
    const prompt = `Analyse ces analytics business et génère 3 insights en JSON:

Données:
- Réservations: ${data.totalReservations}
- Revenu: ${data.revenue}DH
- Taux annulation: ${data.cancelRate}%
- Sports populaires: ${JSON.stringify(data.topSports)}
- Heures de pointe: ${JSON.stringify(data.peakHours)}

Réponds en JSON:
{
  "insights": [
    {
      "title": "Titre",
      "description": "Description",
      "recommendation": "Action recommandée"
    }
  ]
}`;

    const result = await service.model.generateContent(prompt);
    const text = result.response.text();
    const cleanJson = text.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleanJson).insights || [];
  } catch (error) {
    console.error('Analytics insights error:', error);
    return [];
  }
}

export default router;
