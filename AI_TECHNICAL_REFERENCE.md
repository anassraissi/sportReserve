# 🔍 AI Services Technical Reference

## Complete API Endpoint Reference

### **Base URL**
```
Development: http://localhost:3000/api/ai
Production: https://your-domain.com/api/ai
```

### **Authentication**
All endpoints require JWT token in header:
```bash
Authorization: Bearer {your_jwt_token}
```

---

## 1️⃣ CHAT & MODELS

### **POST /chat**
Send message to AI chat (supports streaming)

**Request:**
```json
{
  "message": "Can I book a tennis court for tomorrow?",
  "conversationId": "conv_123",
  "language": "fr"
}
```

**Response:**
```json
{
  "response": "Bien sûr! Je peux vous aider...",
  "conversationId": "conv_123",
  "timestamp": "2024-01-15T10:00:00Z"
}
```

**Status Codes:**
- `200`: Success
- `400`: Invalid message
- `500`: API error (returns fallback response)

**Use Case**: User questions about booking, facilities, policies

---

### **GET /models**
List available AI models

**Response:**
```json
{
  "models": [
    {
      "id": "gemini-2.5-flash",
      "name": "Gemini 2.5 Flash",
      "version": "2.5",
      "providers": ["google"],
      "maxTokens": 2000,
      "rateLimit": "60/min"
    }
  ]
}
```

---

## 2️⃣ REVIEW ANALYSIS

### **GET /reviews/analyze/:resourceId**
Analyze all reviews for a facility

**Query Parameters:**
```
?startDate=2024-01-01&endDate=2024-01-31&limit=100
```

**Response:**
```json
{
  "resourceId": "res_123",
  "totalReviews": 45,
  "summary": {
    "averageRating": 4.3,
    "sentimentDistribution": {
      "positive": 72,
      "neutral": 18,
      "negative": 10
    }
  },
  "topIssues": [
    { "issue": "Cleanliness", "mentions": 12, "severity": "high" },
    { "issue": "Parking", "mentions": 8, "severity": "medium" }
  ],
  "improvements": [
    "Address cleanliness concerns - mentioned in 27% of reviews",
    "Improve parking - mentioned in 18% of reviews"
  ],
  "trends": {
    "lastMonth": { "positive": 75, "neutral": 15, "negative": 10 },
    "thisMonth": { "positive": 68, "neutral": 22, "negative": 10 }
  }
}
```

**Use Case**: Facility owners track reputation, identify issues

---

### **GET /reviews/suspicious/:resourceId**
Find potentially fake or spam reviews

**Response:**
```json
{
  "suspiciousReviews": [
    {
      "reviewId": "rev_456",
      "text": "Best place ever!!!!",
      "rating": 5,
      "author": "user_789",
      "suspiciousFactors": [
        "Excessive punctuation",
        "Vague description",
        "Unusual user pattern"
      ],
      "spamScore": 0.85,
      "recommendation": "Consider removing"
    }
  ]
}
```

---

## 3️⃣ SMART RECOMMENDATIONS

### **GET /recommendations/personalized**
Get recommendations tailored to user's booking history

**Query Parameters:**
```
?userId=user_123&limit=5&radius=15km
```

**Response:**
```json
{
  "recommendations": [
    {
      "resourceId": "res_111",
      "name": "Tennis Center Pro",
      "type": "Tennis Court",
      "location": { "lat": 33.5731, "lng": -7.5898 },
      "distance": "2.3km",
      "averagePrice": 120,
      "rating": 4.6,
      "whyRecommended": "Similar to Tennis World which you booked 5 times",
      "availability": {
        "tomorrow": ["09:00", "14:00", "18:00"],
        "dayAfter": ["10:00", "15:00"]
      }
    }
  ],
  "algorithm": "collaborative_filtering_v2",
  "timestamp": "2024-01-15T10:00:00Z"
}
```

---

### **GET /recommendations/trending**
Get trending facilities in user's area this week

**Response:**
```json
{
  "trending": [
    {
      "rank": 1,
      "resourceId": "res_222",
      "name": "Squad Arena",
      "bookingsThisWeek": 247,
      "newUsersThisWeek": 34,
      "trendScore": 0.94,
      "reason": "Most booked this week - up 45% from last week"
    }
  ]
}
```

---

### **GET /recommendations/popular**
Get most popular facilities overall

**Response:**
```json
{
  "popular": [
    {
      "rank": 1,
      "resourceId": "res_333",
      "name": "Championship Court",
      "totalBookings": 5420,
      "averageRating": 4.8,
      "monthlyBookings": 487
    }
  ]
}
```

---

## 4️⃣ PREDICTIVE ANALYTICS

### **GET /predict/demand/:resourceId**
Get 30-day demand forecast for a facility

**Query Parameters:**
```
?startDate=2024-01-15&daysAhead=30&granularity=hourly
```

**Response:**
```json
{
  "resourceId": "res_123",
  "forecast": [
    {
      "date": "2024-01-15",
      "dayOfWeek": "Monday",
      "timeSlots": [
        {
          "time": "09:00",
          "predictedDemand": 8.5,
          "confidence": 0.92,
          "recommendation": "Expected high demand",
          "optimalPrice": 150,
          "capacity": 10
        }
      ]
    }
  ],
  "accuracy": 0.87,
  "model": "LSTM_prophet_ensemble",
  "lastUpdated": "2024-01-15T08:00:00Z"
}
```

**Data Fields:**
- `predictedDemand`: 0-10 scale (10 = fully booked)
- `confidence`: 0-1 (0.92 = 92% confident)
- `optimalPrice`: Suggested price for this slot
- `capacity`: Maximum bookings available

**Use Case**: Owners set dynamic pricing, manage staffing

---

### **GET /predict/noshow/:reservationId**
Predict if a user will show up to their reservation

**Response:**
```json
{
  "reservationId": "res_123",
  "userId": "user_456",
  "noshowProbability": 0.12,
  "predictedNoshow": false,
  "confidence": 0.88,
  "factors": {
    "userHistory": "Very reliable (98% show rate)",
    "bookingTiming": "Booked 5 days in advance (good)",
    "dayOfWeek": "Saturday (higher show rate)",
    "timeOfDay": "Morning (higher show rate)",
    "userEngagement": "Recently active (good)"
  },
  "recommendation": "Low risk - no action needed"
}
```

**Thresholds:**
- < 0.15: Low risk (green)
- 0.15-0.35: Medium risk (yellow)
- > 0.35: High risk (red) - Consider overbooking by 1

---

### **GET /predict/revenue/:resourceId**
Get revenue optimization recommendations

**Query Parameters:**
```
?timeRange=30days&resourceId=res_123
```

**Response:**
```json
{
  "resourceId": "res_123",
  "currentRevenue": {
    "last30Days": 12500,
    "avgPerSlot": 125,
    "occupancyRate": 0.68
  },
  "optimizationRecommendations": [
    {
      "action": "Increase prices during peak hours",
      "peakHours": ["18:00-20:00", "14:00-16:00"],
      "currentPrice": 100,
      "recommendedPrice": 140,
      "estimatedRevenueIncrease": 2300,
      "elasticity": 0.45,
      "confidence": 0.89
    },
    {
      "action": "Create promotions during slow hours",
      "slowHours": ["10:00-12:00"],
      "currentPrice": 100,
      "recommendedPrice": 70,
      "estimatedBookingIncrease": 0.25,
      "confidence": 0.82
    }
  ],
  "projectedMonthlyIncrease": 4500,
  "projectedIncreasePercent": 18
}
```

---

### **GET /predict/occupancy/:resourceId**
Get occupancy trends for next 7 days

**Response:**
```json
{
  "resourceId": "res_123",
  "occupancyTrend": [
    {
      "date": "2024-01-15",
      "dayOfWeek": "Monday",
      "occupancyRate": 0.72,
      "bookings": 36,
      "capacity": 50,
      "trend": "↑ +5% vs last Monday"
    }
  ],
  "weekAverage": 0.74,
  "weekTrend": "↓ -3% from last week",
  "forecast": "Expect busy weekend",
  "recommendations": [
    "Monday-Wednesday: Lower occupancy - run promotions",
    "Thursday-Sunday: High occupancy - increase prices by 15-20%"
  ]
}
```

---

## 5️⃣ VOICE BOOKING

### **POST /voice/parse**
Parse voice command text into booking intent

**Request:**
```json
{
  "text": "Book tennis court tomorrow at 3pm for 2 hours",
  "language": "en"
}
```

**Response:**
```json
{
  "intent": "book_slot",
  "confidence": 0.96,
  "entities": {
    "resourceType": "tennis_court",
    "date": "2024-01-16",
    "time": "15:00",
    "duration": 2,
    "durationUnit": "hours",
    "participants": 1
  },
  "requiresConfirmation": [
    "location",
    "numberOfCourts"
  ],
  "nextStep": "clarify_location"
}
```

**Supported Intents:**
- `book_slot`: Book a facility
- `check_availability`: Check if available
- `cancel_booking`: Cancel reservation
- `list_bookings`: Show my bookings
- `get_reviews`: Show reviews
- `get_pricing`: Show prices

---

### **POST /voice/transcribe**
Transcribe audio blob to text

**Request (FormData):**
```
audio: [audio_blob]
language: "fr"
```

**Response:**
```json
{
  "text": "Je veux réserver un terrain de tennis demain à 15 heures",
  "confidence": 0.94,
  "language": "fr"
}
```

**Supported Languages:**
- `en`: English (en-US)
- `fr`: French (fr-FR)  
- `ar`: Arabic (ar-MA)

---

### **POST /voice/synthesize**
Convert text to speech audio

**Request:**
```json
{
  "text": "Your booking has been confirmed",
  "language": "en",
  "speed": 1.0
}
```

**Response:**
```
[audio_blob]
Content-Type: audio/mp3
```

---

### **POST /voice/conversation**
Multi-turn voice booking conversation

**Request:**
```json
{
  "message": "Book tennis tomorrow",
  "conversationId": "conv_voice_123",
  "context": {
    "userId": "user_456",
    "location": "Casablanca"
  }
}
```

**Response:**
```json
{
  "response": "What time would you like to book?",
  "responseSynthesized": "[audio_blob]",
  "conversationId": "conv_voice_123",
  "expectedNextInputType": "time",
  "examples": ["3pm", "15:00", "afternoon"]
}
```

---

### **GET /voice/examples**
Get example voice commands for UI help

**Response:**
```json
{
  "english": [
    "Book tennis court tomorrow at 3pm",
    "What courts are available Saturday?",
    "Cancel my 2pm booking",
    "Show my bookings"
  ],
  "french": [
    "Réserver un terrain de tennis demain à 15h",
    "Quels terrains sont disponibles samedi?",
    "Annuler ma réservation de 14h",
    "Afficher mes réservations"
  ],
  "arabic": [
    "احجز ملعب تنس غدا الساعة الثالثة",
    "ما الملاعب المتاحة يوم السبت؟",
    "إلغاء حجزي في الساعة 2",
    "إظهار حجوزاتي"
  ]
}
```

---

## 6️⃣ IMAGE RECOGNITION (Google Vision API)

### **POST /media/analyze**
Analyze facility image

**Request (FormData):**
```
image: [image_file]
resourceType: "tennis_court"
```

**Response:**
```json
{
  "labels": [
    {
      "name": "Tennis",
      "confidence": 0.98
    },
    {
      "name": "Indoor Court",
      "confidence": 0.92
    }
  ],
  "condition": {
    "assessment": "Good",
    "score": 0.82,
    "issues": ["Minor wear on surface"]
  },
  "equipmentDetected": ["Net", "Court Lines", "Lighting"],
  "suggestedTags": ["indoor", "well-lit", "maintained"],
  "autoDescription": "Well-maintained indoor tennis court with professional lighting and modern equipment."
}
```

**Note**: Requires Google Cloud Vision API setup. See setup guide.

---

## 7️⃣ ADMIN DASHBOARD

### **GET /admin/dashboard**
System health and statistics

**Response:**
```json
{
  "system": {
    "status": "healthy",
    "apiLatency": "145ms",
    "errorRate": 0.02,
    "uptime": 0.999
  },
  "aiServices": {
    "gemini": {
      "status": "active",
      "tokenUsage": {
        "today": 45230,
        "limit": 1000000,
        "percentUsed": 4.5
      },
      "avgLatency": "890ms",
      "errorCount": 3
    }
  },
  "recentErrors": [
    {
      "timestamp": "2024-01-15T09:30:00Z",
      "service": "predictiveAnalytics",
      "error": "Insufficient historical data",
      "resourceId": "res_999",
      "severity": "warning"
    }
  ]
}
```

---

## 🔧 Error Handling

### **Standard Error Response**
```json
{
  "error": "Error message here",
  "code": "ERROR_CODE",
  "status": 400,
  "timestamp": "2024-01-15T10:00:00Z",
  "requestId": "req_abc123"
}
```

### **Common Errors**

| Code | Meaning | Solution |
|------|---------|----------|
| `INVALID_TOKEN` | JWT expired/invalid | Ask user to login again |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Wait 60 seconds, try again |
| `API_UNAVAILABLE` | Gemini API down | Show fallback response, retry |
| `INVALID_PARAMS` | Missing required params | Check request format |
| `RESOURCE_NOT_FOUND` | ResourceId doesn't exist | Verify resource ID |
| `INSUFFICIENT_DATA` | Not enough history | Tell user to wait, try later |

### **Fallback Responses**
When Gemini API is down:

**Chat:**
```json
{
  "response": "I'm temporarily unavailable. Please contact support.",
  "fallback": true
}
```

**Recommendations:**
```json
{
  "recommendations": [
    "Popular facilities",
    "Trending this week"
  ],
  "fallback": true
}
```

**Predictions:**
```json
{
  "forecast": "Based on historical data",
  "usingHistoricalModel": true,
  "fallback": true
}
```

---

## 📊 Rate Limits

### **Free Tier (Gemini API)**
```
60 requests/minute
1,000 tokens/minute
10 MB/day for image uploads
```

### **Recommended Caching**
```
Recommendations: Cache 1 hour
Reviews Analysis: Cache 24 hours
Predictions: Cache 6 hours
Chat: No cache (real-time)
```

---

## 🔐 Security Notes

### **Data Privacy**
- ✅ Only booking patterns sent to AI (not PII)
- ✅ No passwords stored
- ✅ All data encrypted in transit (HTTPS)
- ✅ JWT tokens expire in 7 days

### **API Key Security**
```js
// NEVER expose in frontend
// Always use backend proxy

// ❌ WRONG - NEVER DO THIS
const API_KEY = "AIzaSyD..."; // In frontend code

// ✅ CORRECT - Use backend proxy
fetch('/api/ai/chat', { /* options */ })
```

---

## 🧪 Testing Endpoints

### **Using curl**
```bash
# Get recommendations
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/ai/recommendations/personalized

# Send chat message
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello"}' \
  http://localhost:3000/api/ai/chat
```

### **Using Postman**
1. Create collection
2. Add Auth header: `Authorization: Bearer {{token}}`
3. Import endpoints from this file
4. Test each one

---

## 📈 Performance Benchmarks

| Endpoint | Latency | Success Rate | Notes |
|----------|---------|--------------|-------|
| /chat | 800-1200ms | 99.5% | Most latency-sensitive |
| /reviews/analyze | 300-500ms | 99.8% | Cached results |
| /recommendations/personalized | 200-400ms | 99.9% | Cached data |
| /predict/demand | 150-300ms | 99.7% | Real-time forecast |
| /voice/parse | 100-200ms | 99.9% | Local processing |
| /voice/transcribe | 500-1500ms | 98.5% | Depends on audio length |

**Target**: All endpoints < 2 seconds for user-facing features

---

## 🚀 Optimization Tips

### **Reduce Chat Latency**
```js
// Cache recent conversations
const chatCache = new Map();
const cacheKey = `${userId}_${conversationId}`;
```

### **Speed Up Recommendations**
```js
// Pre-compute for active users
setInterval(async () => {
  const activeUsers = await getActiveUsers();
  for (let user of activeUsers) {
    await computeRecommendations(user.id);
  }
}, 3600000); // Every hour
```

### **Efficient Voice Processing**
```js
// Only send necessary context
{
  "message": text,
  "userId": id,
  // ❌ DON'T send: full user object, history, etc
  // ✅ DO send: only what's needed for intent parsing
}
```

---

## 📚 Additional Resources

- AI_SERVICES_COMPLETE.md - Full feature guide
- AI_QUICK_START.md - Integration examples
- AI_INTEGRATION_CHECKLIST.md - Step-by-step setup
- AI_IMPLEMENTATION_PRIORITY.md - Deployment roadmap
- FIX_SUMMARY.md - Known issues & solutions

---

## ❓ Support

| Question | Where to look |
|----------|---------------|
| How to integrate? | AI_INTEGRATION_CHECKLIST.md |
| What's the API? | This file (API Reference) |
| How to deploy? | AI_IMPLEMENTATION_PRIORITY.md |
| Troubleshooting? | FIX_SUMMARY.md |
| Full feature docs? | AI_SERVICES_COMPLETE.md |

---

## ✅ Checklist for New Developer

- [ ] Read this file (API Reference)
- [ ] Understand endpoint structure
- [ ] Know how error handling works
- [ ] Know rate limits
- [ ] Know security best practices
- [ ] Test 1 endpoint with curl
- [ ] Test 1 endpoint with Postman
- [ ] Understand caching strategy
- [ ] Know fallback behavior

**You're ready to build!** 🚀

