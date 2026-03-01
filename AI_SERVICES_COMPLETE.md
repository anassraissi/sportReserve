# 🤖 Complete AI Services Implementation Guide

## Overview
This document describes all 6 AI services implemented for the sportReserve platform using Google Gemini APIs and advanced analytics.

---

## 1. 🎯 Real Gemini Chat API
**Status**: ✅ ACTIVE
**Location**: `/server/routes/ai.js` - `/api/ai/chat`

### Features
- Real-time AI responses using Google Gemini 2.5 Flash
- Multi-language support (French, English, Arabic)
- Context-aware conversations
- Fallback to rule-based responses if API fails

### Endpoints
```bash
POST /api/ai/chat
- Request: { "message": "...", "context": {...} }
- Response: { "response": "...", "provider": "gemini|openai|fallback" }

GET /api/ai/models
- Lists available Gemini models
```

### Usage Example
```javascript
const response = await fetch('/api/ai/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "Je veux réserver un terrain de tennis",
    context: { userName: "Ahmed" }
  })
});
const data = await response.json();
console.log(data.response); // AI-generated response
```

---

## 2. 📊 AI Review Analyzer
**Status**: ✅ ACTIVE
**Location**: `/server/utils/reviewAnalyzer.js`
**Frontend**: `/src/components/ai/ReviewAnalyzerPanel.tsx`

### Features
- Sentiment analysis (positive/negative/neutral)
- Issue detection and categorization
- Keyword extraction
- Suspicious review detection
- Actionable recommendations

### Key Methods

#### `getResourceAnalysis(resourceId, limit)`
Comprehensive review analysis including:
- Average rating
- Sentiment breakdown
- Common issues
- Top keywords
- Recommendations for improvement

#### `flagSuspiciousReviews(resourceId)`
Detects:
- Multiple reviews from same user (spam)
- Extreme ratings (outliers)
- Generic/too short comments

### Endpoints
```bash
GET /api/ai/reviews/analyze/:resourceId
- Returns: { totalReviews, averageRating, sentiment, issues, recommendations, ... }

GET /api/ai/reviews/suspicious/:resourceId
- Returns: { suspicious_reviews: [...], total: N }
```

### Usage Example
```typescript
import { ReviewAnalyzerPanel } from '@/components/ai';

export function ResourcePage({ resourceId }) {
  return (
    <ReviewAnalyzerPanel resourceId={resourceId} />
  );
}
```

---

## 3. 🎯 Smart Recommendation Engine
**Status**: ✅ ACTIVE
**Location**: `/server/utils/recommendationEngine.js`
**Frontend**: `/src/components/ai/RecommendationsPanel.tsx`

### Features
- Personalized recommendations based on booking history
- User preference extraction
- AI-powered ranking system
- Trending resources detection
- Popular resources by time range

### Key Methods

#### `getPersonalizedRecommendations(userId, limit)`
Returns resources based on:
- User's favorite sports types
- Preferred price range
- Favorite locations
- Booking patterns

#### `getTrendingResources(limit, dayRange)`
Last 7-30 days trending by bookings

#### `getPopularResources(limit, dayRange)`
Most booked resources overall

### Endpoints
```bash
GET /api/ai/recommendations/personalized?limit=10
- Returns: { recommendations: [...], count: N }

GET /api/ai/recommendations/trending?limit=10&days=7
- Returns: { trending: [...], count: N }

GET /api/ai/recommendations/popular?limit=10&days=30
- Returns: { popular: [...], count: N }
```

### Usage Example
```typescript
import { RecommendationsPanel } from '@/components/ai';

export function DashboardPage() {
  return (
    <RecommendationsPanel />
  );
}
```

---

## 4. 📸 Image Recognition Service
**Status**: 🔧 READY (requires Google Cloud Vision API setup)
**Location**: `/server/utils/imageRecognition.js`

### Features
- Facility image analysis
- Sport type detection
- Equipment identification
- Condition assessment
- Quality scoring
- Issue flagging

### Key Methods

#### `analyzeFacilityImage(imagePath or imageBase64)`
Returns:
- Detected labels and objects
- Sport types (with confidence)
- Estimated condition (Excellent/Good/Fair/Poor)
- Detected equipment
- Quality confidence score
- Flagged issues

#### `autoTagImage(imagePath)`
Auto-generates:
- Tags (sports types)
- Category
- Equipment list
- Description
- Quality score

### Endpoints
```bash
POST /api/ai/image/analyze
- Requires: Google Cloud Vision API setup

POST /api/ai/image/auto-tag
- Requires: Google Cloud Vision API setup
```

### To Enable Image Recognition
1. Set up Google Cloud Vision API
2. Add credentials to environment
3. Update endpoints (currently return 503)

---

## 5. 🎙️ Voice Booking Feature
**Status**: ✅ ACTIVE (Speech-to-Text ready)
**Location**: `/server/utils/voiceBooking.js`
**Frontend**: `/src/components/ai/VoiceBooking.tsx`

### Features
- Natural language command parsing
- Voice command examples (FR/EN/AR)
- Multi-turn conversations
- Intent detection
- Entity extraction (date, time, sport, location)
- Conversation history

### Supported Commands
```
"Réserve un terrain de tennis demain à 18h"
"Quel est le prix d'une salle de fitness?"
"Je veux jouer au football ce weekend"
"Appelle-moi quand un badminton est disponible"
```

### Key Methods

#### `parseVoiceCommand(command, userContext)`
Extracts:
- Intent (book_facility, check_availability, get_price, etc.)
- Sport type
- Date (relative or absolute)
- Time
- Location
- Budget
- Confidence level

#### `handleConversation(command, history)`
Multi-turn conversation with:
- Command parsing
- Response generation
- Synthesized speech response
- Conversation history

### Endpoints
```bash
POST /api/ai/voice/parse
- Request: { "command": "..." }
- Returns: { "parsed": {...}, "response": "..." }

POST /api/ai/voice/transcribe
- Request: { "audioBase64": "...", "language": "fr-FR" }
- Returns: { "transcription": {...} }

POST /api/ai/voice/synthesize
- Request: { "text": "...", "language": "fr-FR" }
- Returns: { "audio": "base64" }

POST /api/ai/voice/conversation
- Request: { "command": "...", "history": [...] }
- Returns: { "conversation": {...} }

GET /api/ai/voice/examples?language=fr
- Returns: { "examples": [...] }
```

### Usage Example
```typescript
import { VoiceBooking } from '@/components/ai';

export function HomePage() {
  const handleBooking = (bookingData) => {
    console.log('Creating booking:', bookingData);
    // Call reservation API
  };

  return (
    <VoiceBooking onBooking={handleBooking} />
  );
}
```

---

## 6. 📊 Predictive Analytics & Price Optimizer
**Status**: ✅ ACTIVE
**Location**: `/server/utils/predictiveAnalytics.js`
**Frontend**: `/src/components/ai/PredictiveAnalyticsPanel.tsx`

### Features
- 30-day demand forecasting
- Dynamic price recommendations
- No-show probability prediction
- Revenue optimization
- Occupancy trends analysis
- Peak hour identification

### Key Methods

#### `forecastDemand(resourceId, days)`
Returns for each day:
- Expected bookings
- Demand level (Very High/High/Medium/Low/Very Low)
- Recommended price
- Peak hours
- Confidence %

#### `predictNoShow(reservationId)`
Predicts no-show probability based on:
- User's no-show history
- Resource patterns
- Time until reservation
- Risk level assessment

#### `getRevenueOptimization(resourceId, days)`
Suggests:
- Current daily rate
- Optimized pricing strategy
- Potential revenue increase
- Specific recommendations

#### `getOccupancyTrends(resourceId, days)`
Shows:
- Average daily bookings
- Total revenue
- 7-day breakdown
- Trend analysis

### Endpoints
```bash
GET /api/ai/predict/demand/:resourceId?days=30
- Returns: { forecast: [...], period: "30 jours" }

GET /api/ai/predict/noshow/:reservationId
- Returns: { prediction: {...} }

GET /api/ai/predict/revenue/:resourceId?days=30
- Returns: { optimization: {...} }

GET /api/ai/predict/occupancy/:resourceId?days=90
- Returns: { trends: {...} }
```

### Usage Example
```typescript
import { PredictiveAnalyticsPanel } from '@/components/ai';

export function ResourceAdminPage({ resourceId, basePrice }) {
  return (
    <PredictiveAnalyticsPanel resourceId={resourceId} basePrice={basePrice} />
  );
}
```

---

## 7. 🛠️ Admin Dashboard
**Status**: ✅ ACTIVE
**Location**: `/server/routes/ai.js` - `/api/ai/admin/dashboard`

### Features
- System status overview
- AI service metrics
- Integration status

### Endpoint
```bash
GET /api/ai/admin/dashboard
- Returns: { dashboard: { reviewsAnalyzed, systems: {...}, ... } }
```

---

## Integration Examples

### Complete Resource Page
```typescript
import React from 'react';
import { 
  ReviewAnalyzerPanel, 
  PredictiveAnalyticsPanel 
} from '@/components/ai';

export function ResourceDetailPage({ resourceId, basePrice }) {
  return (
    <div className="space-y-6">
      <h1>Resource Details</h1>
      
      {/* Admin features */}
      <ReviewAnalyzerPanel resourceId={resourceId} />
      <PredictiveAnalyticsPanel resourceId={resourceId} basePrice={basePrice} />
    </div>
  );
}
```

### Complete User Dashboard
```typescript
import React from 'react';
import { 
  AIChatbot, 
  RecommendationsPanel, 
  VoiceBooking 
} from '@/components/ai';

export function UserDashboard() {
  return (
    <div>
      <RecommendationsPanel />
      <AIChatbot />
      <VoiceBooking />
    </div>
  );
}
```

---

## Environment Setup

### Required API Keys in `.env`
```env
# Google Gemini (FREE)
GEMINI_API_KEY=your_key_here

# Optional: OpenAI (PAID)
OPENAI_API_KEY=your_key_here

# Optional: Google Cloud Vision (PAID)
GOOGLE_CLOUD_VISION_API_KEY=your_key_here
```

### Dependencies Installed
```bash
npm install @google/generative-ai
npm install openai (optional)
npm install @google-cloud/vision (optional)
```

---

## Monitoring & Metrics

### Available Metrics
- Reviews analyzed
- Resources tracked
- Predictive models active
- Voice commands processed
- System status (Active/Inactive)

### Check System Status
```bash
GET /api/ai/admin/dashboard
```

---

## Security & Privacy

### Data Handling
- User data only used for personalized recommendations
- Reviews analyzed in aggregate (privacy-preserving)
- No personal data stored in voice commands
- All API calls authenticated

### Rate Limiting
- Google Gemini: 60 requests/minute (FREE tier)
- Voice features: 100 requests/minute per user

---

## Troubleshooting

### Gemini API Not Working
1. Verify API key in `.env`
2. Check API key is enabled for Generative Language
3. Fall back to rule-based responses automatically

### Voice Commands Not Recognized
1. Check browser supports Web Speech API (Chrome, Edge)
2. Ensure microphone permissions granted
3. Try manual text input instead

### Predictions Inaccurate
1. System needs >5 historical reservations
2. More data = better predictions (90+ days optimal)
3. Confidence % indicates reliability

---

## Future Enhancements
- [ ] WhatsApp integration for booking
- [ ] Video analysis for facility inspection
- [ ] Multilingual voice support (Arabic, Spanish)
- [ ] Advanced ML models for demand forecasting
- [ ] Competitor price monitoring
- [ ] Auto-cancellation prediction and prevention

---

## Support

For issues or questions:
1. Check `/api/ai/admin/dashboard` for system status
2. Review logs in `/server/routes/ai.js`
3. Verify environment variables
4. Contact: support@sportreserve.local

