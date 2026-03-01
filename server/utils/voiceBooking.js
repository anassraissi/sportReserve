/**
 * Voice Booking Service
 * Handles voice-to-text and natural language understanding for booking
 */

export class VoiceBookingService {
  constructor(genAI, model, speechClient = null) {
    this.genAI = genAI;
    this.model = model;
    this.speechClient = speechClient;
  }

  /**
   * Parse voice command and extract booking intent
   */
  async parseVoiceCommand(command, userContext = {}) {
    try {
      const prompt = `Analysez cette commande vocale pour réserver une installation sportive et extrayez les informations pertinentes.

Commande: "${command}"

Répondez avec JSON UNIQUEMENT:
{
  "intent": "book_facility|check_availability|get_price|cancel_booking|modify_booking|other",
  "sport_type": "tennis|football|basketball|badminton|volleyball|fitness|swimming|yoga|other",
  "date": "YYYY-MM-DD or relative like 'tomorrow', 'next monday'",
  "time": "HH:MM or 'morning|afternoon|evening'",
  "duration": "minutes or null",
  "location": "city name or null",
  "price_range": "budget in DH or null",
  "additional_info": "any other relevant info",
  "confidence": "high|medium|low",
  "clarification_needed": "any questions to clarify"
}`;

      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      const cleanJson = text.replace(/```json\n?|\n?```/g, '').trim();

      return JSON.parse(cleanJson);
    } catch (error) {
      console.error('Voice command parsing error:', error);
      return {
        intent: 'unclear',
        confidence: 'low',
        error: error.message
      };
    }
  }

  /**
   * Convert voice to text (using Google Cloud Speech-to-Text)
   */
  async transcribeVoice(audioBase64, languageCode = 'fr-FR') {
    if (!this.speechClient) {
      throw new Error('Speech-to-Text client not configured');
    }

    try {
      const audio = {
        content: audioBase64
      };

      const config = {
        encoding: 'LINEAR16',
        sampleRateHertz: 16000,
        languageCode: languageCode, // 'en-US', 'fr-FR', 'ar-MA'
        enableAutomaticPunctuation: true
      };

      const request = {
        audio,
        config
      };

      const [response] = await this.speechClient.recognize(request);
      const transcription = response.results
        .map(result => result.alternatives[0].transcript)
        .join('\n');

      return {
        text: transcription,
        confidence: response.results[0]?.alternatives[0]?.confidence || 0.9,
        language: languageCode
      };
    } catch (error) {
      console.error('Voice transcription error:', error);
      throw error;
    }
  }

  /**
   * Convert text to speech response
   */
  async synthesizeResponse(text, languageCode = 'fr-FR') {
    const textToSpeechClient = require('@google-cloud/text-to-speech');
    const client = new textToSpeechClient.TextToSpeechClient();

    try {
      const request = {
        input: { text: text },
        voice: {
          languageCode: languageCode,
          ssmlGender: 'FEMALE'
        },
        audioConfig: { audioEncoding: 'MP3' }
      };

      const [response] = await client.synthesizeSpeech(request);
      return response.audioContent;
    } catch (error) {
      console.error('Text-to-speech error:', error);
      throw error;
    }
  }

  /**
   * Build conversational response to voice command
   */
  buildVoiceResponse(parsedCommand) {
    const responses = {
      high: this.buildConfidentResponse(parsedCommand),
      medium: this.buildClarificationRequest(parsedCommand),
      low: this.buildHelpRequest()
    };

    return responses[parsedCommand.confidence] || responses.low;
  }

  /**
   * Build confident response
   */
  buildConfidentResponse(command) {
    const { sport_type, date, time, location } = command;

    let response = `Parfait ! `;

    if (command.intent === 'book_facility') {
      response += `Je vous aide à réserver un terrain de ${sport_type} `;
      
      if (date) response += `le ${date} `;
      if (time) response += `à ${time} `;
      if (location) response += `à ${location} `;

      response += `. Confirmez-vous cette réservation ?`;
    } else if (command.intent === 'check_availability') {
      response += `Je vérифie la disponibilité pour ${sport_type} ${date ? `le ${date}` : 'aujourd\'hui'}.`;
    } else if (command.intent === 'get_price') {
      response += `Je vous affiche les tarifs pour ${sport_type}.`;
    }

    return response;
  }

  /**
   * Build clarification request
   */
  buildClarificationRequest(command) {
    const { clarification_needed } = command;

    if (clarification_needed) {
      return `Un instant... ${clarification_needed}`;
    }

    return 'Pourriez-vous préciser ? Par exemple: "Je veux réserver un terrain de tennis demain à 18h".';
  }

  /**
   * Build help request
   */
  buildHelpRequest() {
    return `Je n'ai pas bien compris. Pouvez-vous reformuler ? Par exemple: "Réserve un terrain de football demain à 15h" ou "Quel est le prix d'une salle de fitness ?"`;
  }

  /**
   * Handle multi-turn conversation
   */
  async handleConversation(command, conversationHistory = []) {
    try {
      // Add current command to history
      conversationHistory.push({
        role: 'user',
        content: command,
        timestamp: new Date()
      });

      // Parse command
      const parsed = await this.parseVoiceCommand(command);

      // Build response
      const responseText = this.buildVoiceResponse(parsed);

      // Synthesize speech
      const audioResponse = await this.synthesizeResponse(responseText);

      // Add response to history
      conversationHistory.push({
        role: 'assistant',
        content: responseText,
        parsed,
        timestamp: new Date()
      });

      return {
        text: responseText,
        audio: audioResponse,
        parsed,
        history: conversationHistory,
        nextAction: this.determineNextAction(parsed)
      };
    } catch (error) {
      console.error('Conversation handling error:', error);
      return {
        error: error.message,
        text: 'Une erreur s\'est produite. Veuillez réessayer.'
      };
    }
  }

  /**
   * Determine next action based on parsed command
   */
  determineNextAction(parsed) {
    const actions = {
      book_facility: {
        action: 'SHOW_CONFIRMATION',
        data: {
          sport: parsed.sport_type,
          date: parsed.date,
          time: parsed.time,
          location: parsed.location
        }
      },
      check_availability: {
        action: 'SEARCH_FACILITIES',
        data: {
          sport: parsed.sport_type,
          date: parsed.date,
          location: parsed.location
        }
      },
      get_price: {
        action: 'SHOW_PRICING',
        data: {
          sport: parsed.sport_type,
          location: parsed.location,
          price_range: parsed.price_range
        }
      },
      other: {
        action: 'CLARIFY',
        data: { question: parsed.clarification_needed }
      }
    };

    return actions[parsed.intent] || actions.other;
  }

  /**
   * Create booking from voice command
   */
  async createBookingFromVoice(parsedCommand, userId) {
    // This would call the actual reservation endpoint
    // Returns booking confirmation
    return {
      success: true,
      bookingId: 'VOICE_' + Date.now(),
      details: {
        sport: parsedCommand.sport_type,
        date: parsedCommand.date,
        time: parsedCommand.time,
        location: parsedCommand.location,
        userId
      },
      confirmationMessage: `Votre réservation pour ${parsedCommand.sport_type} est confirmée !`
    };
  }

  /**
   * Get voice command examples
   */
  getCommandExamples(language = 'fr') {
    const examples = {
      fr: [
        'Réserve un terrain de tennis demain à 18h',
        'Quel est le prix d\'une salle de fitness ?',
        'Je veux jouer au football ce weekend',
        'Appelle-moi quand un terrain de badminton est disponible',
        'Annule ma réservation de demain'
      ],
      en: [
        'Book a tennis court tomorrow at 6 PM',
        'What\'s the price for a fitness center ?',
        'I want to play football this weekend',
        'Notify me when a badminton court is available',
        'Cancel my tomorrow\'s reservation'
      ],
      ar: [
        'احجز ملعب تنس غدا الساعة 6 مساء',
        'ما سعر قاعة اللياقة البدنية؟',
        'أريد لعب كرة القدم في نهاية الأسبوع',
        'أخبرني عندما يكون ملعب الريشة متاحا',
        'ألغ حجزي في الغد'
      ]
    };

    return examples[language] || examples.en;
  }
}

export default VoiceBookingService;
