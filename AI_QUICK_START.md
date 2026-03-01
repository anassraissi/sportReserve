# 🚀 Quick Start: Using All AI Services

## For Users

### 1. Get Smart Recommendations
Add to your dashboard:
```typescript
import { RecommendationsPanel } from '@/components/ai';

// In your dashboard component
<RecommendationsPanel />
```

What you'll see:
- Personalized recommendations based on your booking history
- Trending facilities (hot this week)
- Popular facilities (all-time favorites)

### 2. Use Voice Booking
```typescript
import { VoiceBooking } from '@/components/ai';

// Add floating button
<VoiceBooking onBooking={(booking) => {
  // Handle booking confirmation
  console.log('Booking:', booking);
}} />
```

How to use:
- Click the microphone button
- Say: "Reserve a tennis court tomorrow at 6 PM"
- Confirm the booking from the parsed intent

Supported languages: French (fr-FR), English (en-US), Arabic (ar-MA)

### 3. Chat with AI Assistant
```typescript
import { AIChatbot } from '@/components/ai';

// Add to any page
<AIChatbot />
```

Try asking:
- "How do I book a facility?"
- "What are the prices?"
- "Tell me about fitness classes"
- "Check the weather"

---

## For Facility Owners (Admin)

### 1. Analyze Your Reviews
```typescript
import { ReviewAnalyzerPanel } from '@/components/ai';

// On your facility details page
<ReviewAnalyzerPanel resourceId={facilityId} />
```

You'll get:
- Sentiment breakdown (% positive/negative/neutral)
- Common issues customers mention
- Top keywords from reviews
- Suggestions for improvement
- Suspicious review detection

### 2. View Demand Forecast & Revenue Optimization
```typescript
import { PredictiveAnalyticsPanel } from '@/components/ai';

// On your admin dashboard
<PredictiveAnalyticsPanel 
  resourceId={facilityId} 
  basePrice={100} 
/>
```

You'll see:
- **Forecast Tab**: 30-day demand prediction with recommended prices
- **Revenue Tab**: Exact revenue increase potential + specific actions
- **Occupancy Tab**: Historical trends and insights

### 3. Manage Risks
The system automatically:
- Predicts no-shows (helps you allocate resources)
- Flags suspicious reviews (spam detection)
- Identifies declining trends

---

## API Endpoints Reference

### Chat & Suggestions
```bash
# Chat with AI
POST /api/ai/chat
{ "message": "..." }

# Get suggestions based on history
GET /api/ai/suggestions
```

### Reviews
```bash
# Analyze reviews for a facility
GET /api/ai/reviews/analyze/:resourceId

# Flag suspicious reviews
GET /api/ai/reviews/suspicious/:resourceId
```

### Recommendations
```bash
# Personalized for logged-in user
GET /api/ai/recommendations/personalized?limit=10

# Trending this week
GET /api/ai/recommendations/trending?limit=10&days=7

# Most popular all-time
GET /api/ai/recommendations/popular?limit=10&days=30
```

### Predictions
```bash
# 30-day demand forecast
GET /api/ai/predict/demand/:resourceId?days=30

# No-show probability
GET /api/ai/predict/noshow/:reservationId

# Revenue optimization
GET /api/ai/predict/revenue/:resourceId?days=30

# Occupancy trends
GET /api/ai/predict/occupancy/:resourceId?days=90
```

### Voice Commands
```bash
# Parse voice command
POST /api/ai/voice/parse
{ "command": "..." }

# Get command examples
GET /api/ai/voice/examples?language=fr

# Multi-turn conversation
POST /api/ai/voice/conversation
{ "command": "...", "history": [...] }
```

### Admin Dashboard
```bash
# System status & metrics
GET /api/ai/admin/dashboard
```

---

## Step-by-Step Integration

### Step 1: Update Your Dashboard Page
```typescript
// src/pages/DashboardPage.tsx
import React from 'react';
import {
  AIChatbot,
  RecommendationsPanel,
  VoiceBooking
} from '@/components/ai';

export function DashboardPage() {
  return (
    <div className="space-y-6 p-6">
      <h1>Your Dashboard</h1>
      
      {/* AI Recommendations */}
      <RecommendationsPanel />
      
      {/* Voice Booking */}
      <VoiceBooking onBooking={(booking) => {
        console.log('New booking:', booking);
        // TODO: Create booking
      }} />
      
      {/* AI Chat */}
      <AIChatbot />
    </div>
  );
}

export default DashboardPage;
```

### Step 2: Update Resource Detail Page  
```typescript
// src/pages/ResourceDetailPage.tsx
import React from 'react';
import { ReviewAnalyzerPanel, PredictiveAnalyticsPanel } from '@/components/ai';

export function ResourceDetailPage({ resourceId, basePrice }) {
  return (
    <div className="space-y-6 p-6">
      {/* Resource info... */}
      
      {/* Admin section */}
      <div className="admin-only">
        <ReviewAnalyzerPanel resourceId={resourceId} />
        <PredictiveAnalyticsPanel resourceId={resourceId} basePrice={basePrice} />
      </div>
    </div>
  );
}
```

### Step 3: Check Admin Dashboard
```bash
# Check all systems are running
curl http://localhost:5000/api/ai/admin/dashboard

# Expected response:
{
  "success": true,
  "dashboard": {
    "reviewsAnalyzed": 245,
    "resourcesTracked": 32,
    "predictiveModels": 6,
    "systems": {
      "gemini": "Active",
      "reviewAnalyzer": "Active",
      "recommendations": "Active",
      "predictiveAnalytics": "Active",
      "voiceBooking": "Active"
    }
  }
}
```

---

## Testing Each Feature

### Test Recommendations
```bash
curl http://localhost:5000/api/ai/recommendations/trending?limit=5
```

### Test Voice Parsing
```bash
curl -X POST http://localhost:5000/api/ai/voice/parse \
  -H "Content-Type: application/json" \
  -d '{"command": "Reserve a tennis court tomorrow at 3 PM"}'
```

### Test Review Analysis
```bash
curl http://localhost:5000/api/ai/reviews/analyze/RESOURCE_ID
```

### Test Demand Forecast
```bash
curl http://localhost:5000/api/ai/predict/demand/RESOURCE_ID?days=30
```

---

## Common Issues & Solutions

### "Service not available" (503)
✓ AI services might be initializing
✓ Check Gemini API key in `.env`
✓ Restart the server: `npm run start:server`

### Voice commands not working
✓ Browser must support Web Speech API (Chrome, Edge, Firefox)
✓ Check microphone permissions
✓ Use text input as fallback

### No recommendations shown
✓ User needs at least 1 previous booking
✓ New users see popular/trending instead
✓ Recommendations improve with more bookings

### Predictions seem inaccurate
✓ System needs 5+ historical reservations
✓ More data available = better predictions
✓ Confidence % shows reliability

---

## Next Steps

1. **Deploy to production**: All services ready
2. **Monitor performance**: Check admin dashboard regularly
3. **Gather feedback**: User reviews help improve AI
4. **Scale up**: As booking volume increases, predictions improve
5. **Add image recognition**: Optional premium feature

---

## Support Commands

```bash
# Check server status
npm run dev:all

# View logs
tail -f server.log

# Test AI endpoints
node server/test-ai.js (create this file)

# Reset AI services
# (Delete all cached data and restart)
npm run start:server
```

---

**All 6 AI Services are now live! 🚀**

Start by adding the components to your dashboard and see the magic happen!

