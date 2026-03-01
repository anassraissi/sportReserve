/**
 * 🤖 AI Service Professionnel - sportReserve
 * Service IA complet pour clients et admins
 * - Réservation intelligente en langage naturel
 * - Recommandations personnalisées
 * - Suggestions météo
 * - Rappels intelligents
 * - Pricing dynamique
 * - Détection comportement suspect
 * - Prédictions de demande
 * - Alertes intelligentes
 */

import Reservation from '../models/Reservation.js';
import Resource from '../models/Resource.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { getWeatherRecommendation } from './weatherService.js';
import RecommendationEngine from './recommendationEngine.js';
import PredictiveAnalytics from './predictiveAnalytics.js';

export class AIService {
  constructor(genAI, model) {
    this.genAI = genAI;
    this.model = model;
    this.recommendationEngine = new RecommendationEngine(genAI, model);
    this.predictiveAnalytics = new PredictiveAnalytics(genAI, model);
  }

  /**
   * 1️⃣ ASSISTANT INTELLIGENT - Réservation en langage naturel
   * "Je veux terrain foot vendredi soir à Rabat"
   */
  async parseNaturalLanguageBooking(message, userId) {
    try {
      const user = await User.findById(userId);
      const userReservations = await Reservation.find({ userId })
        .populate('resourceId')
        .sort({ createdAt: -1 })
        .limit(5);

      const prompt = `Tu es un assistant IA pour sportReserve (plateforme de réservation sportive au Maroc).

Message utilisateur: "${message}"

Historique récent de l'utilisateur:
${userReservations.map((r, i) => 
  `${i+1}. ${r.resourceId?.name || 'N/A'} - ${r.resourceId?.type || 'N/A'} - ${new Date(r.startTime).toLocaleDateString('fr-FR')}`
).join('\n') || 'Aucune réservation récente'}

Extrais les informations de réservation et réponds UNIQUEMENT en JSON valide:
{
  "intent": "book|check_availability|get_price|modify|cancel|other",
  "sport": "football|tennis|basketball|padel|fitness|yoga|other",
  "date": "YYYY-MM-DD ou 'demain', 'vendredi', 'weekend', etc.",
  "time": "HH:MM ou 'matin', 'après-midi', 'soir', 'nuit'",
  "location": "ville (Rabat, Casablanca, etc.)",
  "duration": "durée en heures",
  "budget": "montant en DH",
  "confidence": "high|medium|low",
  "suggested_resources": [],
  "needs_clarification": "question si besoin"
}

Important: Si la date est relative (demain, vendredi), convertis en date absolue YYYY-MM-DD.
Si l'heure est relative (soir, matin), convertis en heure précise (ex: soir = 18:00-20:00).`;

      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      const cleanJson = text.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      // Rechercher des ressources correspondantes
      if (parsed.intent === 'book' || parsed.intent === 'check_availability') {
        parsed.suggested_resources = await this.findMatchingResources(parsed);
      }

      return {
        success: true,
        parsed,
        message: this.buildBookingResponse(parsed)
      };
    } catch (error) {
      console.error('Natural language parsing error:', error);
      return {
        success: false,
        error: error.message,
        parsed: this.fallbackParse(message)
      };
    }
  }

  /**
   * Trouver des ressources correspondant aux critères
   */
  async findMatchingResources(criteria) {
    try {
      let query = { status: 'active' };

      // Filtre par type de sport
      if (criteria.sport && criteria.sport !== 'other') {
        query.type = criteria.sport;
      }

      // Filtre par ville
      if (criteria.location) {
        query.city = new RegExp(criteria.location, 'i');
      }

      // Filtre par budget
      if (criteria.budget) {
        query.pricePerUnit = { $lte: parseFloat(criteria.budget) };
      }

      const resources = await Resource.find(query)
        .populate('locationId')
        .limit(10);

      // Calculer la disponibilité pour la date/heure demandée
      const availableResources = await Promise.all(
        resources.map(async (resource) => {
          const availability = await this.checkAvailability(
            resource._id,
            criteria.date,
            criteria.time
          );
          return {
            ...resource.toObject(),
            available: availability.available,
            suggestedPrice: this.calculateDynamicPrice(resource, criteria.date, criteria.time)
          };
        })
      );

      return availableResources.filter(r => r.available).slice(0, 5);
    } catch (error) {
      console.error('Find matching resources error:', error);
      return [];
    }
  }

  /**
   * Vérifier la disponibilité
   */
  async checkAvailability(resourceId, date, time) {
    try {
      // Convertir date relative en date absolue
      const targetDate = this.parseRelativeDate(date);
      const timeRange = this.parseRelativeTime(time);

      const conflicts = await Reservation.find({
        resourceId,
        status: { $in: ['pending', 'confirmed', 'paid', 'active'] },
        startTime: {
          $gte: new Date(`${targetDate}T${timeRange.start}:00`),
          $lt: new Date(`${targetDate}T${timeRange.end}:00`)
        }
      });

      return {
        available: conflicts.length === 0,
        conflicts: conflicts.length
      };
    } catch (error) {
      return { available: false, error: error.message };
    }
  }

  /**
   * Parser date relative
   */
  parseRelativeDate(dateStr) {
    if (!dateStr) return new Date().toISOString().split('T')[0];

    const today = new Date();
    const days = {
      'demain': 1,
      'après-demain': 2,
      'lundi': this.getNextDayOfWeek(1),
      'mardi': this.getNextDayOfWeek(2),
      'mercredi': this.getNextDayOfWeek(3),
      'jeudi': this.getNextDayOfWeek(4),
      'vendredi': this.getNextDayOfWeek(5),
      'samedi': this.getNextDayOfWeek(6),
      'dimanche': this.getNextDayOfWeek(0),
    };

    if (days[dateStr.toLowerCase()]) {
      today.setDate(today.getDate() + days[dateStr.toLowerCase()]);
      return today.toISOString().split('T')[0];
    }

    // Si c'est déjà une date YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }

    return today.toISOString().split('T')[0];
  }

  getNextDayOfWeek(dayOfWeek) {
    const today = new Date();
    const currentDay = today.getDay();
    const daysUntil = (dayOfWeek - currentDay + 7) % 7 || 7;
    return daysUntil;
  }

  /**
   * Parser heure relative
   */
  parseRelativeTime(timeStr) {
    const timeMap = {
      'matin': { start: '08:00', end: '12:00' },
      'midi': { start: '12:00', end: '14:00' },
      'après-midi': { start: '14:00', end: '18:00' },
      'soir': { start: '18:00', end: '22:00' },
      'nuit': { start: '20:00', end: '23:00' },
    };

    if (timeMap[timeStr?.toLowerCase()]) {
      return timeMap[timeStr.toLowerCase()];
    }

    // Si c'est déjà une heure HH:MM
    if (/^\d{2}:\d{2}$/.test(timeStr)) {
      const [hours, minutes] = timeStr.split(':');
      const startHour = parseInt(hours);
      return {
        start: `${startHour.toString().padStart(2, '0')}:${minutes}`,
        end: `${(startHour + 1).toString().padStart(2, '0')}:${minutes}`
      };
    }

    return { start: '18:00', end: '20:00' }; // Par défaut: soir
  }

  /**
   * Construire réponse de réservation
   */
  buildBookingResponse(parsed) {
    if (parsed.intent === 'book' && parsed.confidence === 'high') {
      return `✅ Parfait ! J'ai trouvé ${parsed.suggested_resources?.length || 0} terrains disponibles pour ${parsed.sport} ${parsed.date ? `le ${parsed.date}` : ''} ${parsed.time ? `à ${parsed.time}` : ''} ${parsed.location ? `à ${parsed.location}` : ''}. Voulez-vous que je procède à la réservation ?`;
    } else if (parsed.needs_clarification) {
      return `❓ ${parsed.needs_clarification}`;
    } else {
      return `Je peux vous aider à réserver. Pouvez-vous préciser le sport, la date et l'heure souhaités ?`;
    }
  }

  /**
   * Parse fallback (sans IA)
   */
  fallbackParse(message) {
    const msg = message.toLowerCase();
    return {
      intent: msg.includes('réserv') || msg.includes('book') ? 'book' : 'other',
      sport: this.extractSport(msg),
      date: null,
      time: null,
      location: this.extractLocation(msg),
      confidence: 'low',
      needs_clarification: 'Pouvez-vous préciser la date et l\'heure ?'
    };
  }

  extractSport(msg) {
    const sports = {
      'football': /foot|football|soccer/,
      'tennis': /tennis/,
      'basketball': /basket|basketball/,
      'padel': /padel/,
      'fitness': /fitness|gym/,
      'yoga': /yoga/,
    };

    for (const [sport, regex] of Object.entries(sports)) {
      if (regex.test(msg)) return sport;
    }
    return 'other';
  }

  extractLocation(msg) {
    const cities = ['rabat', 'casablanca', 'marrakech', 'fes', 'tanger', 'agadir'];
    for (const city of cities) {
      if (msg.includes(city)) return city;
    }
    return null;
  }

  /**
   * 2️⃣ RECOMMANDATIONS PERSONNALISÉES avec météo
   */
  async getPersonalizedRecommendationsWithWeather(userId, options = {}) {
    try {
      // Récupérer recommandations de base
      const recommendations = await this.recommendationEngine.getPersonalizedRecommendations(
        userId,
        options
      );

      // Enrichir avec météo
      const enriched = await Promise.all(
        recommendations.map(async (rec) => {
          // Vérifier météo pour les prochains jours
          const weatherRec = await this.getWeatherRecommendationForResource(
            rec._id || rec.resourceId,
            options.date || new Date()
          );

          return {
            ...rec,
            weather: weatherRec,
            recommendation: this.buildWeatherBasedRecommendation(rec, weatherRec)
          };
        })
      );

      return enriched;
    } catch (error) {
      console.error('Personalized recommendations error:', error);
      return [];
    }
  }

  /**
   * Recommandation basée sur météo
   */
  async getWeatherRecommendationForResource(resourceId, date) {
    try {
      const resource = await Resource.findById(resourceId).populate('locationId');
      if (!resource) return null;

      const latitude = resource.latitude || resource.locationId?.latitude;
      const longitude = resource.longitude || resource.locationId?.longitude;

      if (!latitude || !longitude) return null;

      // Créer une plage horaire pour la recommandation (ex: 18h-20h)
      const startTime = new Date(date);
      startTime.setHours(18, 0, 0, 0);
      const endTime = new Date(date);
      endTime.setHours(20, 0, 0, 0);

      return await getWeatherRecommendation({
        latitude,
        longitude,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      });
    } catch (error) {
      console.error('Weather recommendation error:', error);
      return null;
    }
  }

  /**
   * Construire recommandation basée sur météo
   */
  buildWeatherBasedRecommendation(resource, weather) {
    if (!weather) return 'Recommandé selon vos préférences';

    if (weather.status === 'avoid' || weather.score < 40) {
      // Mauvais temps → suggérer terrain couvert
      if (resource.features?.includes('couvert') || resource.features?.includes('indoor')) {
        return `☔ Météo défavorable, mais ce terrain est couvert - parfait pour jouer !`;
      } else {
        return `🌧️ Météo défavorable. Considérez un terrain couvert ou reportez.`;
      }
    } else if (weather.status === 'good' && weather.score >= 80) {
      // Beau temps → suggérer extérieur
      if (!resource.features?.includes('couvert') && !resource.features?.includes('indoor')) {
        return `☀️ Conditions parfaites pour jouer en extérieur !`;
      }
    }

    return 'Recommandé selon vos préférences et conditions météo';
  }

  /**
   * 3️⃣ RAPPELS INTELLIGENTS avec auto-rebooking
   */
  async generateIntelligentReminders() {
    try {
      // Récupérer réservations à venir (dans les 48h)
      const upcomingReservations = await Reservation.find({
        status: { $in: ['confirmed', 'paid'] },
        startTime: {
          $gte: new Date(),
          $lte: new Date(Date.now() + 48 * 60 * 60 * 1000)
        }
      })
        .populate('userId')
        .populate('resourceId');

      const reminders = [];

      for (const reservation of upcomingReservations) {
        // Vérifier si rappel déjà envoyé
        const existingReminder = await Notification.findOne({
          userId: reservation.userId._id,
          type: 'booking_reminder',
          'data.reservationId': reservation._id.toString()
        });

        if (existingReminder) continue;

        // Analyser pattern utilisateur pour auto-rebooking
        const userPattern = await this.analyzeUserBookingPattern(reservation.userId._id);
        
        // Créer rappel intelligent
        const reminder = {
          userId: reservation.userId._id,
          type: 'booking_reminder',
          title: `Rappel: Réservation ${reservation.resourceId?.name || 'sport'} demain`,
          message: this.buildIntelligentReminderMessage(reservation, userPattern),
          data: {
            reservationId: reservation._id.toString(),
            resourceId: reservation.resourceId?._id.toString(),
            startTime: reservation.startTime,
            autoRebooking: userPattern.suggestAutoRebook ? {
              suggestedDate: userPattern.nextSuggestedDate,
              resourceId: reservation.resourceId?._id.toString()
            } : null
          },
          channel: 'email',
          scheduledFor: new Date(reservation.startTime.getTime() - 24 * 60 * 60 * 1000) // 24h avant
        };

        reminders.push(reminder);
      }

      // Créer les notifications
      await Notification.insertMany(reminders);

      return {
        success: true,
        remindersCreated: reminders.length,
        reminders
      };
    } catch (error) {
      console.error('Intelligent reminders error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Analyser pattern de réservation utilisateur
   */
  async analyzeUserBookingPattern(userId) {
    try {
      const reservations = await Reservation.find({
        userId,
        status: { $in: ['confirmed', 'paid', 'completed'] }
      })
        .populate('resourceId')
        .sort({ startTime: -1 })
        .limit(10);

      if (reservations.length < 3) {
        return { suggestAutoRebook: false };
      }

      // Analyser récurrence
      const dayOfWeekCounts = {};
      const hourCounts = {};
      const resourceCounts = {};

      reservations.forEach(r => {
        const date = new Date(r.startTime);
        const dayOfWeek = date.getDay();
        const hour = date.getHours();

        dayOfWeekCounts[dayOfWeek] = (dayOfWeekCounts[dayOfWeek] || 0) + 1;
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        
        const resourceId = r.resourceId?._id.toString();
        resourceCounts[resourceId] = (resourceCounts[resourceId] || 0) + 1;
      });

      // Trouver pattern le plus fréquent
      const mostFrequentDay = Object.entries(dayOfWeekCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0];
      const mostFrequentHour = Object.entries(hourCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0];
      const mostFrequentResource = Object.entries(resourceCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0];

      // Si pattern clair (même jour/heure 3+ fois)
      const hasPattern = dayOfWeekCounts[mostFrequentDay] >= 3;

      if (hasPattern) {
        // Calculer prochaine date suggérée
        const nextDate = new Date();
        const currentDay = nextDate.getDay();
        const daysUntil = (parseInt(mostFrequentDay) - currentDay + 7) % 7 || 7;
        nextDate.setDate(nextDate.getDate() + daysUntil);
        nextDate.setHours(parseInt(mostFrequentHour), 0, 0, 0);

        return {
          suggestAutoRebook: true,
          pattern: {
            dayOfWeek: mostFrequentDay,
            hour: mostFrequentHour,
            resourceId: mostFrequentResource
          },
          nextSuggestedDate: nextDate.toISOString(),
          confidence: 'high'
        };
      }

      return { suggestAutoRebook: false };
    } catch (error) {
      console.error('User pattern analysis error:', error);
      return { suggestAutoRebook: false };
    }
  }

  /**
   * Construire message de rappel intelligent
   */
  buildIntelligentReminderMessage(reservation, userPattern) {
    let message = `Bonjour ${reservation.userId?.firstName || ''},\n\n`;
    message += `Rappel: Votre réservation pour ${reservation.resourceId?.name || 'sport'} est prévue le ${new Date(reservation.startTime).toLocaleDateString('fr-FR')} à ${new Date(reservation.startTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}.\n\n`;

    if (userPattern.suggestAutoRebook) {
      message += `💡 Astuce: Vous réservez souvent le ${this.getDayName(userPattern.pattern.dayOfWeek)} à ${userPattern.pattern.hour}h. `;
      message += `Voulez-vous réserver automatiquement pour la semaine prochaine ?\n\n`;
    }

    // Ajouter météo si disponible
    message += `N'oubliez pas de vérifier les conditions météo avant votre réservation.`;

    return message;
  }

  getDayName(dayOfWeek) {
    const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    return days[dayOfWeek] || '';
  }

  /**
   * 4️⃣ PRICING DYNAMIQUE (Uber-style)
   */
  calculateDynamicPrice(resource, date, time) {
    try {
      const basePrice = resource.pricePerUnit || 100;
      let multiplier = 1.0;

      // Facteur 1: Jour de la semaine
      const targetDate = new Date(date);
      const dayOfWeek = targetDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) { // Weekend
        multiplier *= 1.3; // +30% weekend
      }

      // Facteur 2: Heure (heures de pointe)
      const hour = parseInt(time?.split(':')[0] || '18');
      if (hour >= 17 && hour <= 20) { // Heures de pointe (17h-20h)
        multiplier *= 1.25; // +25% heures pleines
      } else if (hour >= 22 || hour <= 8) { // Heures creuses
        multiplier *= 0.85; // -15% heures creuses
      }

      // Facteur 3: Demande (à calculer avec historique)
      // Pour l'instant, on utilise un facteur fixe basé sur le jour

      const finalPrice = Math.round(basePrice * multiplier);

      return {
        basePrice,
        finalPrice,
        multiplier: multiplier.toFixed(2),
        factors: {
          weekend: dayOfWeek === 0 || dayOfWeek === 6,
          peakHours: hour >= 17 && hour <= 20,
          offPeak: hour >= 22 || hour <= 8
        }
      };
    } catch (error) {
      console.error('Dynamic pricing error:', error);
      return {
        basePrice: resource.pricePerUnit || 100,
        finalPrice: resource.pricePerUnit || 100,
        multiplier: '1.0'
      };
    }
  }

  /**
   * 5️⃣ DÉTECTION COMPORTEMENT SUSPECT
   */
  async detectSuspiciousBehavior(userId) {
    try {
      const user = await User.findById(userId);
      const reservations = await Reservation.find({ userId })
        .sort({ createdAt: -1 })
        .limit(50);

      const alerts = [];

      // 1. Taux d'annulation élevé
      const cancelled = reservations.filter(r => r.status === 'cancelled').length;
      const total = reservations.length;
      const cancellationRate = total > 0 ? cancelled / total : 0;

      if (cancellationRate > 0.5 && total >= 5) {
        alerts.push({
          type: 'high_cancellation_rate',
          severity: 'high',
          message: `Taux d'annulation élevé: ${(cancellationRate * 100).toFixed(0)}%`,
          recommendation: 'Surveiller ce compte. Considérer des restrictions.'
        });
      }

      // 2. Réservations multiples rapides
      const recentReservations = reservations.filter(
        r => new Date(r.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      );
      if (recentReservations.length > 10) {
        alerts.push({
          type: 'rapid_booking_spam',
          severity: 'medium',
          message: `${recentReservations.length} réservations en 24h`,
          recommendation: 'Vérifier si comportement normal ou spam'
        });
      }

      // 3. No-show répétés
      const noShows = reservations.filter(r => r.status === 'no_show').length;
      const noShowRate = total > 0 ? noShows / total : 0;
      if (noShowRate > 0.3 && total >= 5) {
        alerts.push({
          type: 'repeated_no_show',
          severity: 'high',
          message: `Taux de no-show: ${(noShowRate * 100).toFixed(0)}%`,
          recommendation: 'Considérer un dépôt de garantie ou restrictions'
        });
      }

      // 4. Réservations puis annulation immédiate
      const immediateCancellations = reservations.filter(r => {
        if (r.status !== 'cancelled') return false;
        const created = new Date(r.createdAt);
        const cancelled = new Date(r.cancelledAt || r.updatedAt);
        const diffHours = (cancelled - created) / (1000 * 60 * 60);
        return diffHours < 1; // Annulé dans l'heure
      });

      if (immediateCancellations.length > 5) {
        alerts.push({
          type: 'immediate_cancellation_pattern',
          severity: 'medium',
          message: `${immediateCancellations.length} annulations immédiates`,
          recommendation: 'Possible blocage de créneaux. Surveiller.'
        });
      }

      return {
        userId,
        userEmail: user.email,
        alerts,
        riskScore: this.calculateRiskScore(alerts),
        recommendation: this.getOverallRecommendation(alerts)
      };
    } catch (error) {
      console.error('Suspicious behavior detection error:', error);
      return { userId, alerts: [], riskScore: 0 };
    }
  }

  calculateRiskScore(alerts) {
    const weights = {
      high: 3,
      medium: 2,
      low: 1
    };

    const score = alerts.reduce((sum, alert) => sum + (weights[alert.severity] || 1), 0);
    return Math.min(10, score); // Score sur 10
  }

  getOverallRecommendation(alerts) {
    if (alerts.length === 0) return 'Comportement normal';
    if (alerts.some(a => a.severity === 'high')) {
      return 'Action requise: Comportement suspect détecté';
    }
    return 'Surveillance recommandée';
  }

  /**
   * 6️⃣ PRÉDICTIONS DE DEMANDE pour Admin
   */
  async getDemandPredictions(options = {}) {
    try {
      const days = options.days || 30;
      const resourceId = options.resourceId;

      if (resourceId) {
        // Prédiction pour une ressource spécifique
        return await this.predictiveAnalytics.forecastDemand(resourceId, { days });
      } else {
        // Prédiction globale
        const resources = await Resource.find({ status: 'active' }).limit(20);
        const predictions = await Promise.all(
          resources.map(async (resource) => {
            const forecast = await this.predictiveAnalytics.forecastDemand(resource._id, { days });
            return {
              resourceId: resource._id,
              resourceName: resource.name,
              resourceType: resource.type,
              forecast: forecast.slice(0, 7), // 7 prochains jours
              summary: this.summarizeForecast(forecast)
            };
          })
        );

        return predictions;
      }
    } catch (error) {
      console.error('Demand predictions error:', error);
      return [];
    }
  }

  summarizeForecast(forecast) {
    if (!forecast || forecast.length === 0) return null;

    const avgBookings = forecast.reduce((sum, d) => sum + (d.expectedBookings || 0), 0) / forecast.length;
    const peakDays = forecast
      .filter(d => d.demandLevel === 'High' || d.demandLevel === 'Very High')
      .map(d => d.date);

    return {
      averageDailyBookings: Math.round(avgBookings),
      peakDays,
      totalExpectedBookings: Math.round(forecast.reduce((sum, d) => sum + (d.expectedBookings || 0), 0))
    };
  }

  /**
   * 7️⃣ DASHBOARD INTELLIGENT ADMIN
   */
  async getAdminDashboardInsights() {
    try {
      const [
        totalReservations,
        totalRevenue,
        activeUsers,
        topResources,
        suspiciousUsers,
        demandPredictions
      ] = await Promise.all([
        Reservation.countDocuments({ status: { $in: ['confirmed', 'paid', 'completed'] } }),
        Reservation.aggregate([
          { $match: { status: { $in: ['confirmed', 'paid', 'completed'] } } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]),
        User.countDocuments({ isActive: true }),
        this.getTopPerformingResources(),
        this.getSuspiciousUsersList(),
        this.getDemandPredictions({ days: 7 })
      ]);

      const revenue = totalRevenue[0]?.total || 0;

      // Analyser avec IA
      const insights = await this.generateAIInsights({
        totalReservations,
        revenue,
        activeUsers,
        topResources
      });

      return {
        overview: {
          totalReservations,
          totalRevenue: revenue,
          activeUsers,
          averageRevenuePerReservation: totalReservations > 0 ? revenue / totalReservations : 0
        },
        topResources,
        suspiciousUsers: suspiciousUsers.slice(0, 10),
        demandPredictions: demandPredictions.slice(0, 5),
        aiInsights: insights,
        recommendations: this.generateAdminRecommendations(insights, topResources)
      };
    } catch (error) {
      console.error('Admin dashboard error:', error);
      return { error: error.message };
    }
  }

  /**
   * Top ressources performantes
   */
  async getTopPerformingResources() {
    try {
      const topResources = await Reservation.aggregate([
        {
          $match: {
            status: { $in: ['confirmed', 'paid', 'completed'] },
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: '$resourceId',
            bookings: { $sum: 1 },
            revenue: { $sum: '$totalAmount' },
            avgRating: { $avg: '$rating' }
          }
        },
        { $sort: { revenue: -1 } },
        { $limit: 10 }
      ]);

      const resourceIds = topResources.map(r => r._id);
      const resources = await Resource.find({ _id: { $in: resourceIds } });

      return topResources.map(tr => {
        const resource = resources.find(r => r._id.toString() === tr._id.toString());
        return {
          resourceId: tr._id,
          resourceName: resource?.name || 'N/A',
          bookings: tr.bookings,
          revenue: tr.revenue,
          avgRating: tr.avgRating || 0
        };
      });
    } catch (error) {
      console.error('Top resources error:', error);
      return [];
    }
  }

  /**
   * Liste utilisateurs suspects
   */
  async getSuspiciousUsersList() {
    try {
      const users = await User.find({ isActive: true, role: 'user' }).limit(100);
      const suspicious = await Promise.all(
        users.map(user => this.detectSuspiciousBehavior(user._id))
      );

      return suspicious
        .filter(s => s.riskScore > 3)
        .sort((a, b) => b.riskScore - a.riskScore);
    } catch (error) {
      console.error('Suspicious users list error:', error);
      return [];
    }
  }

  /**
   * Générer insights IA
   */
  async generateAIInsights(data) {
    try {
      const prompt = `Analyse ces données business pour sportReserve et génère 3 insights clés en JSON:

Données:
- Réservations totales: ${data.totalReservations}
- Revenu total: ${data.revenue} DH
- Utilisateurs actifs: ${data.activeUsers}
- Top ressources: ${JSON.stringify(data.topResources.slice(0, 3))}

Réponds UNIQUEMENT en JSON:
{
  "insights": [
    {
      "title": "Titre insight",
      "description": "Description détaillée",
      "impact": "high|medium|low",
      "action": "Action recommandée"
    }
  ]
}`;

      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      const cleanJson = text.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (error) {
      console.error('AI insights generation error:', error);
      return {
        insights: [
          {
            title: 'Analyse en cours',
            description: 'Les insights IA seront disponibles bientôt',
            impact: 'medium',
            action: 'Surveiller les métriques'
          }
        ]
      };
    }
  }

  /**
   * Générer recommandations admin
   */
  generateAdminRecommendations(insights, topResources) {
    const recommendations = [];

    // Recommandation 1: Pricing dynamique
    if (topResources.length > 0) {
      const topResource = topResources[0];
      recommendations.push({
        type: 'dynamic_pricing',
        title: 'Optimiser le pricing',
        description: `${topResource.resourceName} génère ${topResource.revenue}DH. Considérez un pricing dynamique pour maximiser les revenus.`,
        priority: 'high'
      });
    }

    // Recommandation 2: Promotions heures creuses
    recommendations.push({
      type: 'promotion',
      title: 'Promotions heures creuses',
      description: 'Offrez des réductions pour les heures creuses (22h-8h) pour augmenter l\'occupation.',
      priority: 'medium'
    });

    return recommendations;
  }

  /**
   * 8️⃣ ALERTES INTELLIGENTES
   */
  async createIntelligentAlert(userId, type, data) {
    try {
      const user = await User.findById(userId);
      if (!user) return { success: false, error: 'User not found' };

      let alert = {
        userId,
        type,
        title: '',
        message: '',
        data,
        channel: 'email',
        status: 'pending'
      };

      switch (type) {
        case 'weather_alert':
          alert.title = '⚠️ Alerte Météo';
          alert.message = `Les conditions météo pour votre réservation du ${new Date(data.startTime).toLocaleDateString('fr-FR')} sont défavorables. ${data.recommendation || 'Considérez un terrain couvert.'}`;
          break;

        case 'price_drop':
          alert.title = '💰 Prix réduit !';
          alert.message = `Le prix pour ${data.resourceName} a baissé ! Nouveau prix: ${data.newPrice}DH (était ${data.oldPrice}DH)`;
          break;

        case 'high_demand':
          alert.title = '🔥 Forte demande détectée';
          alert.message = `Forte demande prévue pour ${data.resourceName} le ${new Date(data.date).toLocaleDateString('fr-FR')}. Réservez maintenant !`;
          break;

        case 'suspicious_activity':
          alert.title = '🚨 Activité suspecte détectée';
          alert.message = `Comportement suspect détecté sur votre compte. ${data.recommendation || 'Contactez le support si vous avez des questions.'}`;
          break;

        default:
          alert.title = 'Notification';
          alert.message = data.message || 'Vous avez une nouvelle notification';
      }

      const notification = new Notification(alert);
      await notification.save();

      return { success: true, notification };
    } catch (error) {
      console.error('Intelligent alert creation error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default AIService;
