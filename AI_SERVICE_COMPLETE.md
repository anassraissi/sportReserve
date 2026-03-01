# 🤖 Service IA Professionnel - sportReserve

Service IA complet pour clients et admins avec toutes les fonctionnalités demandées.

## 📋 Table des matières

1. [Fonctionnalités Client](#fonctionnalités-client)
2. [Fonctionnalités Admin](#fonctionnalités-admin)
3. [API Endpoints](#api-endpoints)
4. [Configuration](#configuration)
5. [Exemples d'utilisation](#exemples-dutilisation)

---

## 👤 Fonctionnalités Client

### 1️⃣ Assistant Intelligent (Chat AI)

Réservation en langage naturel - comme Airbnb ou Booking.com

**Exemple:**
```
"Je veux terrain foot vendredi soir à Rabat"
```

L'IA comprend automatiquement:
- ✅ Sport (football)
- ✅ Date (vendredi)
- ✅ Heure (soir = 18h-20h)
- ✅ Ville (Rabat)

**Endpoint:** `POST /api/ai/booking/parse`

**Réponse:**
```json
{
  "success": true,
  "parsed": {
    "intent": "book",
    "sport": "football",
    "date": "2024-01-19",
    "time": "18:00-20:00",
    "location": "Rabat",
    "confidence": "high",
    "suggested_resources": [...]
  },
  "message": "✅ Parfait ! J'ai trouvé 3 terrains disponibles..."
}
```

### 2️⃣ Recommandations Personnalisées

L'IA analyse:
- 📊 Historique de réservations
- 💰 Budget habituel
- ⚽ Sport préféré
- 📍 Localisation

**Exemple:**
```
"Anass réserve souvent padel à 19h → on propose créneaux similaires"
```

**Endpoint:** `GET /api/ai/recommendations/personalized-weather`

**Réponse:**
```json
{
  "success": true,
  "recommendations": [
    {
      "name": "Terrain Padel Premium",
      "type": "padel",
      "aiScore": 95,
      "weather": {
        "status": "good",
        "score": 85,
        "summary": "Conditions favorables"
      },
      "recommendation": "☀️ Conditions parfaites pour jouer en extérieur !"
    }
  ]
}
```

### 3️⃣ Suggestions Météo ☀️🌧️

- Mauvais temps → propose terrain couvert
- Beau temps → propose extérieur

**Intégré automatiquement** dans les recommandations personnalisées.

### 4️⃣ Rappels Intelligents

L'IA peut:
- 📧 Rappeler réservation 24h avant
- 🔄 Proposer rebooking automatique
- 💡 Détecter patterns: "Tu joues chaque mardi. On réserve pour mardi prochain ?"

**Automatique** - généré toutes les 6 heures par job planifié.

---

## 👨‍💼 Fonctionnalités Admin

### 1️⃣ Dashboard Intelligent

L'IA analyse:
- 📈 Jours les plus rentables
- ⏰ Heures creuses
- ⚽ Sport le plus demandé

**Génère:**
```
"Le padel génère 35% plus de revenu le week-end."
```

**Endpoint:** `GET /api/ai/admin/dashboard`

**Réponse:**
```json
{
  "success": true,
  "overview": {
    "totalReservations": 1250,
    "totalRevenue": 125000,
    "activeUsers": 450
  },
  "topResources": [...],
  "aiInsights": {
    "insights": [
      {
        "title": "Optimisation Pricing",
        "description": "Le padel génère 35% plus de revenu le week-end",
        "impact": "high",
        "action": "Appliquer pricing dynamique week-end"
      }
    ]
  },
  "recommendations": [...]
}
```

### 2️⃣ Dynamic Pricing 💰

Comme Uber - Prix augmente/baisse automatiquement:

**Facteurs:**
- ⏰ Heures pleines (17h-20h): +25%
- 🌙 Heures creuses (22h-8h): -15%
- 📅 Weekend: +30%

**Endpoint:** `GET /api/ai/pricing/dynamic?resourceId=xxx&date=2024-01-19&time=18:00`

**Réponse:**
```json
{
  "success": true,
  "pricing": {
    "basePrice": 100,
    "finalPrice": 163,
    "multiplier": "1.63",
    "factors": {
      "weekend": true,
      "peakHours": true,
      "offPeak": false
    }
  }
}
```

### 3️⃣ Détection Comportement Suspect

Détecte:
- ❌ Taux d'annulation élevé (>50%)
- 🚨 Réservations multiples rapides
- ⚠️ No-show répétés (>30%)
- 🔒 Annulations immédiates (pattern suspect)

**Endpoint:** `GET /api/ai/admin/suspicious-behavior?userId=xxx`

**Réponse:**
```json
{
  "success": true,
  "userId": "...",
  "alerts": [
    {
      "type": "high_cancellation_rate",
      "severity": "high",
      "message": "Taux d'annulation élevé: 60%",
      "recommendation": "Surveiller ce compte. Considérer des restrictions."
    }
  ],
  "riskScore": 7,
  "recommendation": "Action requise: Comportement suspect détecté"
}
```

### 4️⃣ Prédiction de Demande

L'IA prédit:
- 📊 "Samedi prochain forte demande foot"
- 💡 Admin peut: augmenter prix, ouvrir créneaux, ajouter promo

**Endpoint:** `GET /api/ai/admin/demand-predictions?resourceId=xxx&days=30`

**Réponse:**
```json
{
  "success": true,
  "predictions": [
    {
      "date": "2024-01-20",
      "dayOfWeek": "Saturday",
      "expectedBookings": 8,
      "demandLevel": "Very High",
      "recommendedPrice": 140,
      "peakHours": [17, 18, 19],
      "confidence": "75%"
    }
  ]
}
```

---

## 🔌 API Endpoints

### Client Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai/booking/parse` | POST | Parser réservation langage naturel |
| `/api/ai/recommendations/personalized-weather` | GET | Recommandations avec météo |
| `/api/ai/pricing/dynamic` | GET | Calculer prix dynamique |

### Admin Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai/admin/dashboard` | GET | Dashboard intelligent |
| `/api/ai/admin/suspicious-behavior` | GET | Détecter comportement suspect |
| `/api/ai/admin/demand-predictions` | GET | Prédictions de demande |
| `/api/ai/admin/alert` | POST | Créer alerte intelligente |
| `/api/ai/admin/analytics` | GET | Analytics avancées |

---

## ⚙️ Configuration

### 1. Variables d'environnement

Ajoutez dans `.env`:

```env
# Google Gemini (GRATUIT)
GEMINI_API_KEY=your_gemini_api_key_here

# Ou OpenAI (PAYANT)
OPENAI_API_KEY=your_openai_api_key_here
```

### 2. Obtenir clé Gemini (Gratuit)

1. Allez sur: https://makersuite.google.com/app/apikey
2. Créez une clé API
3. Copiez dans `.env`

### 3. Vérifier configuration

```bash
# Tester si l'IA fonctionne
curl http://localhost:5000/api/ai/models
```

---

## 💡 Exemples d'utilisation

### Exemple 1: Réservation en langage naturel

```javascript
// Frontend
const response = await fetch('/api/ai/booking/parse', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    message: "Je veux terrain foot vendredi soir à Rabat"
  })
});

const data = await response.json();
// data.parsed contient toutes les infos extraites
// data.suggested_resources contient les terrains disponibles
```

### Exemple 2: Obtenir recommandations personnalisées

```javascript
const response = await fetch('/api/ai/recommendations/personalized-weather?limit=5', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { recommendations } = await response.json();
// Chaque recommandation inclut météo et score IA
```

### Exemple 3: Dashboard Admin

```javascript
const response = await fetch('/api/ai/admin/dashboard', {
  headers: {
    'Authorization': `Bearer ${adminToken}`
  }
});

const dashboard = await response.json();
// dashboard.aiInsights contient les insights IA
// dashboard.recommendations contient les actions recommandées
```

### Exemple 4: Détecter comportement suspect

```javascript
const response = await fetch('/api/ai/admin/suspicious-behavior?userId=xxx', {
  headers: {
    'Authorization': `Bearer ${adminToken}`
  }
});

const { alerts, riskScore } = await response.json();
if (riskScore > 5) {
  // Action requise
}
```

---

## 🚀 Jobs Planifiés

Les rappels intelligents sont générés automatiquement toutes les 6 heures.

Pour déclencher manuellement:
```bash
POST /api/ai/reminders/generate
(Requiert admin)
```

---

## 📊 Métriques et Analytics

### Analytics Admin

```javascript
GET /api/ai/admin/analytics?days=30
```

Retourne:
- 📈 Réservations totales
- 💰 Revenu total
- 📊 Sports populaires
- ⏰ Heures de pointe
- 🧠 Insights IA

---

## 🔔 Alertes Intelligentes

Types d'alertes disponibles:

1. **weather_alert** - Alerte météo défavorable
2. **price_drop** - Prix réduit détecté
3. **high_demand** - Forte demande prévue
4. **suspicious_activity** - Comportement suspect

**Créer une alerte:**
```javascript
POST /api/ai/admin/alert
{
  "userId": "xxx",
  "type": "weather_alert",
  "data": {
    "startTime": "2024-01-20T18:00:00Z",
    "recommendation": "Considérez un terrain couvert"
  }
}
```

---

## ✅ Checklist de Déploiement

- [ ] Ajouter `GEMINI_API_KEY` dans `.env`
- [ ] Vérifier que MongoDB est connecté
- [ ] Tester endpoint `/api/ai/models`
- [ ] Vérifier jobs planifiés (rappels intelligents)
- [ ] Tester réservation langage naturel
- [ ] Vérifier dashboard admin

---

## 🎯 Résultat Attendu

### Pour le Client:
- ✅ Réservation 2x plus rapide
- ✅ Expérience premium
- ✅ Recommandations intelligentes
- ✅ Rappels automatiques

### Pour l'Admin:
- ✅ Insights business automatiques
- ✅ Pricing optimisé
- ✅ Détection d'abus
- ✅ Prédictions de demande

---

## 📝 Notes

- Le service utilise **Google Gemini (gratuit)** par défaut
- Fallback automatique si IA non configurée
- Tous les endpoints sont sécurisés (authentification requise)
- Admin endpoints nécessitent rôle `admin`

---

## 🆘 Support

En cas de problème:
1. Vérifier que `GEMINI_API_KEY` est configuré
2. Vérifier les logs serveur
3. Tester avec `/api/ai/models` pour vérifier la connexion IA

---

**Service IA Professionnel - Prêt à l'emploi ! 🚀**
