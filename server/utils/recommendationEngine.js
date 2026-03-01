import Reservation from '../models/Reservation.js';
import Resource from '../models/Resource.js';
import Review from '../models/Review.js';

/**
 * Smart Recommendation Engine
 * Uses AI to recommend resources based on user behavior, preferences, and availability
 */

export class RecommendationEngine {
  constructor(genAI, model) {
    this.genAI = genAI;
    this.model = model;
  }

  /**
   * Get personalized recommendations for a user
   */
  async getPersonalizedRecommendations(userId, options = {}) {
    try {
      // Get user's booking history
      const historyLimit = options.historyLimit ? Number(options.historyLimit) : 10;
      const userReservations = await Reservation.find({ userId })
        .populate('resourceId')
        .sort({ createdAt: -1 })
        .limit(historyLimit);

      if (userReservations.length === 0) {
        // New user - return popular resources
        return await this.getPopularResources(options);
      }

      // Extract user preferences
      const preferences = this.extractUserPreferences(userReservations);

      // Get similar resources
      const recommendations = await this.findSimilarResources(preferences, options);

      // Rank by AI
      const ranked = await this.rankRecommendations(recommendations, preferences, userReservations);

      return ranked;
    } catch (error) {
      console.error('Recommendation error:', error);
      return [];
    }
  }

  /**
   * Extract user preferences from booking history
   */
  extractUserPreferences(reservations) {
    const preferences = {
      favoriteTypes: [],
      favoriteCategories: [],
      preferredTimes: [],
      budgetRange: { min: Infinity, max: 0 },
      locations: [],
      frequency: reservations.length
    };

    reservations.forEach(reservation => {
      const resource = reservation.resourceId;
      
      // Track types
      if (resource.type) {
        preferences.favoriteTypes.push(resource.type);
      }

      // Track categories
      if (resource.categoryId) {
        preferences.favoriteCategories.push(resource.categoryId);
      }

      // Track times
      const hour = new Date(reservation.startTime).getHours();
      preferences.preferredTimes.push(hour);

      // Track budget
      if (resource.basePrice) {
        preferences.budgetRange.min = Math.min(preferences.budgetRange.min, resource.basePrice);
        preferences.budgetRange.max = Math.max(preferences.budgetRange.max, resource.basePrice);
      }

      // Track locations
      if (resource.city) {
        preferences.locations.push(resource.city);
      }
    });

    // Count frequencies
    preferences.favoriteTypes = this.getTopItems(preferences.favoriteTypes, 3);
    preferences.favoriteCategories = this.getTopItems(preferences.favoriteCategories, 3);
    preferences.preferredTimes = this.getTopItems(preferences.preferredTimes, 3);
    preferences.locations = this.getTopItems(preferences.locations, 3);

    return preferences;
  }

  /**
   * Get top N items from an array
   */
  getTopItems(arr, limit) {
    const counts = {};
    arr.forEach(item => {
      const key = item.toString();
      counts[key] = (counts[key] || 0) + 1;
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([item]) => item);
  }

  /**
   * Find resources similar to user preferences
   */
  async findSimilarResources(preferences, options = {}) {
    try {
      const limit = options.limit || 20;

      let query = { status: 'active' };

      // Filter by type
      if (preferences.favoriteTypes.length > 0) {
        query.type = { $in: preferences.favoriteTypes };
      }

      // Filter by price range (with 20% flexibility)
      const minPrice = Math.max(0, preferences.budgetRange.min * 0.8);
      const maxPrice = preferences.budgetRange.max * 1.2;

      if (preferences.budgetRange.min !== Infinity) {
        query.basePrice = { $gte: minPrice, $lte: maxPrice };
      }

      // Filter by category
      if (preferences.favoriteCategories.length > 0) {
        query.categoryId = { $in: preferences.favoriteCategories };
      }

      const resources = await Resource.find(query)
        .populate('categoryId')
        .limit(limit);

      return resources;
    } catch (error) {
      console.error('Similar resources error:', error);
      return [];
    }
  }

  /**
   * Rank recommendations using AI
   */
  async rankRecommendations(resources, preferences, userHistory) {
    if (resources.length === 0) return [];

    const resourceDescriptions = resources.map(r => 
      `${r.name} (Type: ${r.type}, Prix: ${r.basePrice}DH, Ville: ${r.city})`
    ).join('\n');

    const prompt = `Vous êtes un expert en recommandations de ressources sportives.

Basé sur l'historique de réservations de l'utilisateur:
- Types favori: ${preferences.favoriteTypes.join(', ')}
- Budget habituel: ${preferences.budgetRange.min}-${preferences.budgetRange.max} DH
- Heures préférées: ${preferences.preferredTimes.join(', ')}h
- Villes: ${preferences.locations.join(', ')}

Voici les ressources candidates:
${resourceDescriptions}

Classez ces ressources de 1 à ${resources.length} (1 = meilleure recommandation) en JSON:
{"rankings": [{"name": "Resource Name", "rank": 1, "score": 95, "reason": "Court texte"}]}

Retournez UNIQUEMENT du JSON valide:`;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      const cleanJson = text.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      const ranked = parsed.rankings.map((ranking, idx) => {
        const resource = resources.find(r => r.name === ranking.name);
        return {
          ...resource?.toObject(),
          aiScore: ranking.score,
          rank: ranking.rank,
          reason: ranking.reason
        };
      }).sort((a, b) => a.rank - b.rank);

      return ranked;
    } catch (error) {
      console.error('AI ranking error:', error);
      // Fallback: sort by rating
      return resources.map((r, idx) => ({
        ...r.toObject(),
        aiScore: 50,
        rank: idx + 1
      }));
    }
  }

  /**
   * Get popular/trending resources
   */
  async getPopularResources(options = {}) {
    try {
      const limit = options.limit || 10;
      const dayRange = options.dayRange || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - dayRange);

      // Find most booked resources recently
      const popularResourceIds = await Reservation.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            status: { $in: ['confirmed', 'paid', 'completed'] }
          }
        },
        {
          $group: {
            _id: '$resourceId',
            count: { $sum: 1 },
            avgPrice: { $avg: '$totalPrice' }
          }
        },
        {
          $sort: { count: -1 }
        },
        {
          $limit: limit
        }
      ]);

      const resources = await Resource.find({
        _id: { $in: popularResourceIds.map(p => p._id) },
        status: 'active'
      }).populate('categoryId');

      return resources.map(r => ({
        ...r.toObject(),
        popularity: 'trending',
        aiScore: 75
      }));
    } catch (error) {
      console.error('Popular resources error:', error);
      return [];
    }
  }

  /**
   * Get recommendations for a specific time slot
   */
  async getTimeBasedRecommendations(userId, dateTime, options = {}) {
    try {
      const recommendations = await this.getPersonalizedRecommendations(userId, options);

      // Filter by availability at specific time
      const availableAtTime = recommendations.filter(resource => {
        // TODO: Check availability rules for this resource at this time
        return true; // Placeholder
      });

      return availableAtTime;
    } catch (error) {
      console.error('Time-based recommendations error:', error);
      return [];
    }
  }

  /**
   * Get trending resources overall
   */
  async getTrendingResources(options = {}) {
    try {
      const limit = options.limit || 10;
      const dayRange = options.dayRange || 7;

      const pipeline = [
        {
          $match: {
            createdAt: {
              $gte: new Date(Date.now() - dayRange * 24 * 60 * 60 * 1000)
            },
            status: { $in: ['confirmed', 'paid', 'completed'] }
          }
        },
        {
          $group: {
            _id: '$resourceId',
            bookingCount: { $sum: 1 },
            avgRating: { $avg: '$rating' },
            totalRevenue: { $sum: '$totalPrice' }
          }
        },
        {
          $sort: { bookingCount: -1 }
        },
        {
          $limit: limit
        }
      ];

      const results = await Reservation.aggregate(pipeline);
      const resourceIds = results.map(r => r._id);
      const resources = await Resource.find({ _id: { $in: resourceIds }, status: 'active' });

      // Add trend data
      return resources.map((resource, idx) => {
        const trendData = results.find(r => r._id.toString() === resource._id.toString());
        return {
          ...resource.toObject(),
          bookingCount: trendData?.bookingCount || 0,
          trend: 'hot',
          aiScore: 85
        };
      });
    } catch (error) {
      console.error('Trending resources error:', error);
      return [];
    }
  }
}

export default RecommendationEngine;
