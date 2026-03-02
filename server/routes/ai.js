import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Reservation from '../models/Reservation.js';
import Review from '../models/Review.js';
import Resource from '../models/Resource.js';
import ReviewAnalyzer from '../utils/reviewAnalyzer.js';
import RecommendationEngine from '../utils/recommendationEngine.js';
import ImageRecognitionService from '../utils/imageRecognition.js';
import PredictiveAnalytics from '../utils/predictiveAnalytics.js';
import VoiceBookingService from '../utils/voiceBooking.js';

const router = express.Router();

// Fallback chatbot responses (no API needed)
function getFallbackResponse(message, user) {
  const msg = message.toLowerCase();
  const name = user?.firstName || 'cher utilisateur';
  
  // Greetings
  if (msg.match(/bonjour|salut|hello|hi|hey/)) {
    return `Bonjour ${name} ! 👋 Je suis votre assistant sportReserve. Comment puis-je vous aider aujourd'hui ? Vous pouvez me demander de l'aide pour réserver un terrain, consulter vos réservations, ou en savoir plus sur nos installations.`;
  }
  
  // Reservations
  if (msg.match(/réserv|book|terrain|salle/)) {
    return `Pour réserver un terrain ou une salle ⚽🏀:\n\n1. Allez dans la section "Réservations"\n2. Choisissez le type d'installation (terrain, salle, équipement)\n3. Sélectionnez la date et l'heure souhaitées\n4. Confirmez votre réservation\n\nLes prix varient entre 50 et 300 DH selon le type et la durée. Besoin d'aide pour trouver une installation spécifique ?`;
  }
  
  // My reservations
  if (msg.match(/mes réserv|my book|historique/)) {
    return `Pour consulter vos réservations 📅:\n\nAllez dans votre tableau de bord, section "Mes Réservations". Vous y trouverez:\n- Vos réservations à venir\n- Votre historique\n- La possibilité d'annuler ou modifier\n\nVoulez-vous que je vous guide vers une section spécifique ?`;
  }
  
  // Prices
  if (msg.match(/prix|tarif|cost|combien/)) {
    return `💰 Nos tarifs sont très compétitifs:\n\n• Terrains de sport: 100-300 DH/heure\n• Salles de fitness: 50-150 DH/session\n• Équipements: 20-100 DH/jour\n\nLes prix varient selon le type d'installation, la durée et les horaires. Consultez la page de chaque ressource pour les détails précis.`;
  }
  
  // Help/Support
  if (msg.match(/aide|help|support|comment|how/)) {
    return `Je suis là pour vous aider ! 🤝\n\nVoici ce que je peux faire:\n✅ Vous guider pour réserver\n✅ Expliquer notre plateforme\n✅ Répondre à vos questions sur les prix\n✅ Vous aider à gérer vos réservations\n\nQue souhaitez-vous savoir ?`;
  }
  
  // Weather
  if (msg.match(/météo|weather|temps|pluie/)) {
    return `🌤️ Pour connaître les conditions météo:\n\nConsultez la section météo sur la page de chaque installation. Nous vous fournissons des recommandations météo pour vos réservations à venir.\n\nNote: Actuellement, l'assistant IA est en mode basique. Pour des réponses plus détaillées, l'administrateur doit configurer une clé API valide.`;
  }
  
  // Thanks
  if (msg.match(/merci|thanks|thank/)) {
    return `De rien ${name} ! 😊 Je suis toujours là si vous avez besoin d'aide. N'hésitez pas à me poser d'autres questions !`;
  }
  
  // Default response
  return `Je suis actuellement en mode basique (sans IA avancée). Je peux vous aider avec:\n\n• Réservations de terrains et salles\n• Consultation de vos réservations\n• Informations sur les prix\n• Guide d'utilisation de la plateforme\n\n⚠️ Note: Pour des réponses plus intelligentes et personnalisées, l'administrateur doit configurer une clé API Gemini valide.\n\nQue puis-je faire pour vous ?`;
}

function getFallbackSuggestions(recentReservations) {
  if (!recentReservations || recentReservations.length === 0) {
    return [
      'Découvrez nos terrains de football',
      'Essayez une seance de fitness',
      'Reservez pour le weekend'
    ];
  }

  const types = new Set(recentReservations.map((r) => r.resourceId?.type).filter(Boolean));
  const suggestions = [];

  if (types.has('football')) suggestions.push('Terrain de football en soiree');
  if (types.has('tennis')) suggestions.push('Terrain de tennis - 1 heure');
  if (types.has('basketball')) suggestions.push('Terrain de basketball ce weekend');
  if (types.has('fitness')) suggestions.push('Seance de fitness apres-midi');

  while (suggestions.length < 3) {
    suggestions.push('Nouvelle activite sportive a essayer');
  }

  return suggestions.slice(0, 3);
}

// Check if using Google Gemini (FREE) or OpenAI
const USE_GEMINI = process.env.GEMINI_API_KEY ? true : false;

let genAI, model;
let reviewAnalyzer, recommendationEngine, imageRecognition, predictiveAnalytics, voiceBooking;

if (USE_GEMINI) {
  // Google Gemini (FREE) - Get key from: https://makersuite.google.com/app/apikey
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  
  // Initialize AI services
  reviewAnalyzer = new ReviewAnalyzer(genAI, model);
  recommendationEngine = new RecommendationEngine(genAI, model);
  predictiveAnalytics = new PredictiveAnalytics(genAI, model);
  voiceBooking = new VoiceBookingService(genAI, model);
}

// GET /api/ai/models - List available models for your Gemini key
router.get('/models', async (req, res) => {
  try {
    if (!USE_GEMINI || !process.env.GEMINI_API_KEY) {
      return res.json({ 
        provider: 'openai',
        message: 'Using OpenAI, not Gemini'
      });
    }

    // Use REST API to list models
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${await response.text()}`);
    }
    
    const data = await response.json();
    
    const availableModels = (data.models || [])
      .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
      .map(m => ({
        name: m.name,
        displayName: m.displayName,
        description: m.description,
        supportedMethods: m.supportedGenerationMethods
      }));

    res.json({
      provider: 'gemini',
      available_models: availableModels,
      total: availableModels.length
    });
  } catch (error) {
    console.error('Error listing models:', error.message);
    res.status(500).json({
      error: error.message || 'Failed to list models',
      details: 'Make sure your Gemini API key is valid and has Generative Language API enabled'
    });
  }
});

// POST /api/ai/chat - Chat with AI assistant
router.post('/chat', authenticate, async (req, res) => {
  try {
    const { message, context } = req.body;
    const user = req.user;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // System prompt - defines the AI assistant's behavior
    const systemPrompt = `Tu es un assistant virtuel pour sportReserve, une plateforme de réservation d'installations sportives au Maroc.

Contexte:
- Utilisateur: ${context?.userName || user.firstName} ${user.lastName}
- Rôle: ${context?.userRole || user.role}

Tes capacités:
1. Aider à trouver et réserver des terrains de sport, salles, et équipements
2. Gérer les réservations (consulter, modifier, annuler)
3. Répondre aux questions sur les prix, disponibilités, et conditions météo
4. Guider les utilisateurs dans l'utilisation de la plateforme
5. Fournir des informations sur les différentes installations

Règles importantes:
- Réponds toujours en français
- Sois amical, professionnel et concis
- Si tu ne peux pas effectuer une action directement, guide l'utilisateur sur comment le faire
- Pour les réservations spécifiques, dirige l'utilisateur vers la section appropriée
- Utilise des emojis pour rendre la conversation plus engageante 🏀⚽🎾

Types de ressources disponibles:
- Terrains (football, basketball, tennis, etc.)
- Salles (fitness, danse, yoga, etc.)
- Équipements (vélos, raquettes, ballons, etc.)

Prix: généralement entre 50 et 300 DH selon le type et la durée.`;

    let response;
    let provider = 'fallback';

    try {
      if (USE_GEMINI) {
        // Use Google Gemini (FREE)
        const prompt = `${systemPrompt}\n\nUtilisateur: ${message}`;
        const result = await model.generateContent(prompt);
        response = result.response.text();
        provider = 'gemini';
      } else {
        // No AI provider available
        throw new Error('No AI provider available');
      }
    } catch (aiError) {
      // Fallback to rule-based responses
      console.error('AI provider failed, using fallback', {
        message: aiError?.message,
        code: aiError?.code,
        status: aiError?.status,
      });
      response = getFallbackResponse(message, user);
      provider = 'fallback';
    }

    res.json({
      success: true,
      response,
      provider,
    });

  } catch (error) {
    console.error('AI Chat Error:', error);
    
    // Check if no API keys are configured
    if (!process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY) {
      return res.status(503).json({ 
        message: '🔧 Service IA non configuré. L\'administrateur doit ajouter une clé API.',
        code: 'no_api_key'
      });
    }
    
    if (error.code === 'insufficient_quota' || error.status === 429) {
      return res.status(402).json({ 
        message: '⚠️ Quota dépassé. Recommandation: utilisez Google Gemini (gratuit). Voir FREE_AI_SETUP.md',
        code: 'insufficient_quota'
      });
    }

    if (error.code === 'invalid_api_key' || error.message?.includes('API_KEY_INVALID')) {
      return res.status(401).json({ 
        message: 'Clé API invalide. Vérifiez votre configuration dans le fichier .env',
        code: 'invalid_api_key'
      });
    }

    res.status(500).json({ 
      message: 'Erreur lors de la communication avec l\'assistant IA',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================
// 🧠 INTENT PARSING (TEXT) - For typed client messages
// ============================================

// POST /api/ai/intent/parse - Parse a typed message into booking intent JSON
router.post('/intent/parse', authenticate, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'message is required' });
    }

    // Prefer AI parser (Gemini) via VoiceBookingService prompt
    if (voiceBooking) {
      const parsed = await voiceBooking.parseVoiceCommand(message, {
        userName: req.user.firstName,
        userRole: req.user.role
      });

      return res.json({
        success: true,
        provider: USE_GEMINI ? 'gemini' : 'unknown',
        parsed
      });
    }

    // Fallback (very simple heuristic)
    const msg = message.toLowerCase();
    const sportMap = [
      { key: 'football', match: /foot|football/ },
      { key: 'tennis', match: /tennis/ },
      { key: 'basketball', match: /basket|basketball/ },
      { key: 'padel', match: /padel/ },
      { key: 'fitness', match: /fitness|gym/ },
      { key: 'yoga', match: /yoga/ },
    ];
    const foundSport = sportMap.find(s => s.match.test(msg))?.key || 'other';

    res.json({
      success: true,
      provider: 'fallback',
      parsed: {
        intent: msg.includes('réserv') || msg.includes('reserve') ? 'book_facility' : 'other',
        sport_type: foundSport,
        date: null,
        time: null,
        duration: null,
        location: null,
        price_range: null,
        additional_info: null,
        confidence: 'low',
        clarification_needed: 'Pouvez-vous préciser la date et l’heure ?'
      }
    });
  } catch (error) {
    console.error('Intent parse error:', error);
    res.status(500).json({ message: 'Erreur lors du parsing de l’intention' });
  }
});

// GET /api/ai/suggestions - Get smart suggestions based on user history
router.get('/suggestions', authenticate, async (req, res) => {
  try {
    const user = req.user;
    
    // Get user's recent reservations
    const recentReservations = await Reservation.find({ 
      userId: user._id 
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('resourceId');

    // Analyze patterns using AI
    const prompt = `Basé sur l'historique de réservations suivant, suggere 3 activites sportives pertinentes:
    
${recentReservations.map((r, i) => 
  `${i+1}. ${r.resourceId?.name} - ${r.resourceId?.type} - ${new Date(r.startTime).toLocaleDateString('fr-FR')}`
).join('\n')}

Format de reponse: Retourne uniquement un tableau JSON de 3 suggestions courtes (maximum 10 mots chacune).
Exemple: ["Terrain de tennis - 18h00", "Cours de yoga debutant", "Salle de fitness - weekend"]`;

    let suggestions = [];

    try {
      if (USE_GEMINI) {
        const result = await model.generateContent(prompt);
        const content = result.response.text() || '[]';
        suggestions = JSON.parse(content);
      } else {
        throw new Error('No AI provider available');
      }
    } catch (parseError) {
      // Fallback suggestions
      suggestions = getFallbackSuggestions(recentReservations);
    }

    res.json({
      success: true,
      suggestions,
    });

// ============================================
// 🎯 REVIEW ANALYZER ENDPOINTS
// ============================================

// GET /api/ai/reviews/analyze/:resourceId - Analyze reviews for a resource
router.get('/reviews/analyze/:resourceId', authenticate, async (req, res) => {
  try {
    if (!reviewAnalyzer) {
      return res.status(503).json({ message: 'Service non disponible' });
    }

    const { resourceId } = req.params;
    const analysis = await reviewAnalyzer.getResourceAnalysis(resourceId, { limit: 50 });

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Review analysis error:', error);
    res.status(500).json({ message: 'Erreur lors de l\'analyse des avis' });
  }
});

// GET /api/ai/reviews/suspicious/:resourceId - Detect suspicious reviews
router.get('/reviews/suspicious/:resourceId', authenticate, async (req, res) => {
  try {
    if (!reviewAnalyzer) {
      return res.status(503).json({ message: 'Service non disponible' });
    }

    const { resourceId } = req.params;
    const suspicious = await reviewAnalyzer.flagSuspiciousReviews(resourceId);

    res.json({
      success: true,
      suspicious_reviews: suspicious,
      total: suspicious.length
    });
  } catch (error) {
    console.error('Suspicious review detection error:', error);
    res.status(500).json({ message: 'Erreur lors de la détection' });
  }
});

// ============================================
// 🤖 RECOMMENDATION ENGINE ENDPOINTS
// ============================================

// GET /api/ai/recommendations/personalized - Get personalized recommendations
router.get('/recommendations/personalized', authenticate, async (req, res) => {
  try {
    if (!recommendationEngine) {
      return res.status(503).json({ message: 'Service non disponible' });
    }

    const userId = req.user._id;
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const historyLimit = req.query.historyLimit ? parseInt(req.query.historyLimit) : undefined;
    
    const recommendations = await recommendationEngine.getPersonalizedRecommendations(userId, { limit, historyLimit });

    res.json({
      success: true,
      recommendations: recommendations.slice(0, limit),
      count: recommendations.length
    });
  } catch (error) {
    console.error('Personalized recommendations error:', error);
    res.status(500).json({ message: 'Erreur lors de la génération des recommandations' });
  }
});

// GET /api/ai/recommendations/trending - Get trending resources
router.get('/recommendations/trending', async (req, res) => {
  try {
    if (!recommendationEngine) {
      return res.status(503).json({ message: 'Service non disponible' });
    }

    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const dayRange = req.query.days ? parseInt(req.query.days) : 7;
    
    const trending = await recommendationEngine.getTrendingResources({ limit, dayRange });

    res.json({
      success: true,
      trending: trending.slice(0, limit),
      count: trending.length
    });
  } catch (error) {
    console.error('Trending resources error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des tendances' });
  }
});

// GET /api/ai/recommendations/popular - Get popular resources
router.get('/recommendations/popular', async (req, res) => {
  try {
    if (!recommendationEngine) {
      return res.status(503).json({ message: 'Service non disponible' });
    }

    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const dayRange = req.query.days ? parseInt(req.query.days) : 30;
    
    const popular = await recommendationEngine.getPopularResources({ limit, dayRange });

    res.json({
      success: true,
      popular: popular.slice(0, limit),
      count: popular.length
    });
  } catch (error) {
    console.error('Popular resources error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des populaires' });
  }
});

// ============================================
// 📊 PREDICTIVE ANALYTICS ENDPOINTS
// ============================================

// GET /api/ai/predict/demand/:resourceId - Forecast demand
router.get('/predict/demand/:resourceId', authenticate, async (req, res) => {
  try {
    if (!predictiveAnalytics) {
      return res.status(503).json({ message: 'Service non disponible' });
    }

    const { resourceId } = req.params;
    const days = req.query.days ? parseInt(req.query.days) : 30;
    
    const forecast = await predictiveAnalytics.forecastDemand(resourceId, { days });

    res.json({
      success: true,
      resourceId,
      forecast,
      period: `${days} jours`
    });
  } catch (error) {
    console.error('Demand forecast error:', error);
    res.status(500).json({ message: 'Erreur lors de la prévision' });
  }
});

// GET /api/ai/predict/noshow/:reservationId - Predict no-show probability
router.get('/predict/noshow/:reservationId', authenticate, async (req, res) => {
  try {
    if (!predictiveAnalytics) {
      return res.status(503).json({ message: 'Service non disponible' });
    }

    const { reservationId } = req.params;
    const prediction = await predictiveAnalytics.predictNoShow(reservationId);

    res.json({
      success: true,
      prediction
    });
  } catch (error) {
    console.error('No-show prediction error:', error);
    res.status(500).json({ message: 'Erreur lors de la prédiction' });
  }
});

// GET /api/ai/predict/revenue/:resourceId - Get revenue optimization
router.get('/predict/revenue/:resourceId', authenticate, async (req, res) => {
  try {
    if (!predictiveAnalytics) {
      return res.status(503).json({ message: 'Service non disponible' });
    }

    const { resourceId } = req.params;
    const days = req.query.days ? parseInt(req.query.days) : 30;
    
    const optimization = await predictiveAnalytics.getRevenueOptimization(resourceId, { days });

    res.json({
      success: true,
      optimization
    });
  } catch (error) {
    console.error('Revenue optimization error:', error);
    res.status(500).json({ message: 'Erreur lors de l\'optimisation' });
  }
});

// GET /api/ai/predict/occupancy/:resourceId - Get occupancy trends
router.get('/predict/occupancy/:resourceId', authenticate, async (req, res) => {
  try {
    if (!predictiveAnalytics) {
      return res.status(503).json({ message: 'Service non disponible' });
    }

    const { resourceId } = req.params;
    const days = req.query.days ? parseInt(req.query.days) : 90;
    
    const trends = await predictiveAnalytics.getOccupancyTrends(resourceId, { days });

    res.json({
      success: true,
      trends
    });
  } catch (error) {
    console.error('Occupancy trends error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des tendances' });
  }
});

// ============================================
// 🎙️ VOICE BOOKING ENDPOINTS
// ============================================

// POST /api/ai/voice/parse - Parse voice command
router.post('/voice/parse', authenticate, async (req, res) => {
  try {
    if (!voiceBooking) {
      return res.status(503).json({ message: 'Service non disponible' });
    }

    const { command } = req.body;

    if (!command) {
      return res.status(400).json({ message: 'Command is required' });
    }

    const parsed = await voiceBooking.parseVoiceCommand(command, {
      userName: req.user.firstName,
      userRole: req.user.role
    });

    res.json({
      success: true,
      parsed,
      response: voiceBooking.buildVoiceResponse(parsed)
    });
  } catch (error) {
    console.error('Voice parsing error:', error);
    res.status(500).json({ message: 'Erreur lors du traitement de la commande' });
  }
});

// POST /api/ai/voice/transcribe - Transcribe audio to text
router.post('/voice/transcribe', authenticate, async (req, res) => {
  try {
    if (!voiceBooking || !voiceBooking.speechClient) {
      return res.status(503).json({ message: 'Service de transcription non configuré' });
    }

    const { audioBase64, language = 'fr-FR' } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ message: 'audioBase64 is required' });
    }

    const transcription = await voiceBooking.transcribeVoice(audioBase64, language);

    res.json({
      success: true,
      transcription
    });
  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({ message: 'Erreur lors de la transcription' });
  }
});

// POST /api/ai/voice/synthesize - Convert text to speech
router.post('/voice/synthesize', authenticate, async (req, res) => {
  try {
    if (!voiceBooking) {
      return res.status(503).json({ message: 'Service non disponible' });
    }

    const { text, language = 'fr-FR' } = req.body;

    if (!text) {
      return res.status(400).json({ message: 'text is required' });
    }

    const audio = await voiceBooking.synthesizeResponse(text, language);

    res.json({
      success: true,
      audio: audio.toString('base64'),
      message: 'Audio synthétisé'
    });
  } catch (error) {
    console.error('Synthesis error:', error);
    res.status(500).json({ message: 'Erreur lors de la synthèse vocale' });
  }
});

// POST /api/ai/voice/conversation - Handle multi-turn conversation
router.post('/voice/conversation', authenticate, async (req, res) => {
  try {
    if (!voiceBooking) {
      return res.status(503).json({ message: 'Service non disponible' });
    }

    const { command, history = [] } = req.body;

    if (!command) {
      return res.status(400).json({ message: 'Command is required' });
    }

    const conversation = await voiceBooking.handleConversation(command, history);

    res.json({
      success: true,
      conversation
    });
  } catch (error) {
    console.error('Conversation error:', error);
    res.status(500).json({ message: 'Erreur lors de la conversation' });
  }
});

// GET /api/ai/voice/examples - Get voice command examples
router.get('/voice/examples', (req, res) => {
  const language = req.query.language || 'fr';
  
  if (!voiceBooking) {
    return res.status(503).json({ message: 'Service non disponible' });
  }

  const examples = voiceBooking.getCommandExamples(language);

  res.json({
    success: true,
    language,
    examples
  });
});

// ============================================
// 📸 IMAGE RECOGNITION ENDPOINTS
// ============================================

// POST /api/ai/image/analyze - Analyze facility image
router.post('/image/analyze', authenticate, async (req, res) => {
  try {
    // Note: This requires Google Cloud Vision API setup
    return res.status(503).json({ 
      message: 'Image Recognition requires Google Cloud Vision API setup',
      note: 'Contact admin to enable this feature'
    });
  } catch (error) {
    console.error('Image analysis error:', error);
    res.status(500).json({ message: 'Erreur lors de l\'analyse' });
  }
});

// POST /api/ai/image/auto-tag - Auto-tag image
router.post('/image/auto-tag', authenticate, async (req, res) => {
  try {
    // Note: This requires Google Cloud Vision API setup
    return res.status(503).json({ 
      message: 'Image Recognition requires Google Cloud Vision API setup',
      note: 'Contact admin to enable this feature'
    });
  } catch (error) {
    console.error('Auto-tag error:', error);
    res.status(500).json({ message: 'Erreur lors du tag automatique' });
  }
});

// ============================================
// 📊 ADMIN DASHBOARD ENDPOINTS
// ============================================

// GET /api/ai/admin/dashboard - Get AI insights for admin
router.get('/admin/dashboard', authenticate, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    // Check Gemini and AI service status
    if (!USE_GEMINI || !process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        message: 'Service IA Gemini non configuré. Ajoutez GEMINI_API_KEY dans votre .env.'
      });
    }
    if (!reviewAnalyzer || !recommendationEngine || !predictiveAnalytics || !voiceBooking) {
      return res.status(503).json({
        message: 'Un ou plusieurs services IA ne sont pas initialisés correctement.',
        systems: {
          reviewAnalyzer: reviewAnalyzer ? 'Active' : 'Inactive',
          recommendations: recommendationEngine ? 'Active' : 'Inactive',
          predictiveAnalytics: predictiveAnalytics ? 'Active' : 'Inactive',
          voiceBooking: voiceBooking ? 'Active' : 'Inactive'
        }
      });
    }

    const dashboard = {
      reviewsAnalyzed: await Review.countDocuments(),
      resourcesTracked: await Resource.countDocuments({ status: 'active' }),
      predictiveModels: 6,
      voiceCommandsProcessed: 0,
      systems: {
        gemini: USE_GEMINI ? 'Active' : 'Inactive',
        reviewAnalyzer: reviewAnalyzer ? 'Active' : 'Inactive',
        recommendations: recommendationEngine ? 'Active' : 'Inactive',
        predictiveAnalytics: predictiveAnalytics ? 'Active' : 'Inactive',
        voiceBooking: voiceBooking ? 'Active' : 'Inactive'
      }
    };

    res.json({
      success: true,
      dashboard
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Erreur lors du chargement du dashboard' });
  }
});

  } catch (error) {
    console.error('AI Suggestions Error:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la génération des suggestions' 
    });
  }
});

export default router;
