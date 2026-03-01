# ⏰ Calcul des Heures de Pointe

## 📊 Vue d'ensemble

Les **heures de pointe** (peak hours) sont calculées automatiquement en analysant l'historique des réservations pour identifier les créneaux les plus demandés.

---

## 🔍 Logique de Calcul

### 1️⃣ Calcul Backend (Analytics)

**Endpoint:** `GET /api/ai/admin/analytics`

**Code:** `server/routes/aiEnhanced.js` (ligne 409-424)

```javascript
Reservation.aggregate([
  {
    $match: {
      createdAt: { $gte: startDate }, // Derniers 30 jours par défaut
      status: { $in: ['confirmed', 'paid', 'completed'] }
    }
  },
  {
    $group: {
      _id: { $hour: '$startTime' }, // Extraire l'heure de début
      count: { $sum: 1 } // Compter les réservations
    }
  },
  { $sort: { count: -1 } }, // Trier par nombre décroissant
  { $limit: 5 } // Top 5 heures
])
```

### 2️⃣ Résultat

Retourne les **5 heures les plus fréquentes** :

```json
{
  "peakHours": [
    { "hour": 18, "bookings": 12 },  // 18h = 12 réservations
    { "hour": 19, "bookings": 10 },  // 19h = 10 réservations
    { "hour": 17, "bookings": 8 },   // 17h = 8 réservations
    { "hour": 20, "bookings": 6 },   // 20h = 6 réservations
    { "hour": 16, "bookings": 5 }    // 16h = 5 réservations
  ]
}
```

---

## 📈 Exemple de Calcul

### Données de Base (30 derniers jours)

```
Réservations:
- 10 réservations à 18h
- 8 réservations à 19h
- 6 réservations à 17h
- 5 réservations à 20h
- 4 réservations à 16h
- 3 réservations à 15h
- 2 réservations à 14h
- ... autres heures
```

### Calcul

1. **Grouper par heure** :
   ```
   18h: 10 réservations
   19h: 8 réservations
   17h: 6 réservations
   20h: 5 réservations
   16h: 4 réservations
   ```

2. **Trier par nombre décroissant** :
   ```
   18h: 10 (1er)
   19h: 8  (2ème)
   17h: 6  (3ème)
   20h: 5  (4ème)
   16h: 4  (5ème)
   ```

3. **Top 5** :
   ```
   peakHours = [18, 19, 17, 20, 16]
   ```

---

## 🎯 Utilisation

### 1. Dashboard Admin

**Affichage:** Graphique en barres dans l'onglet "Analytics"

```typescript
// src/components/ai/AdminAIDashboard.tsx
<BarChart data={analytics.peakHours}>
  <Bar dataKey="bookings" />
  <XAxis dataKey="hour" />
</BarChart>
```

### 2. Pricing Dynamique

**Utilisation:** Calcul du prix dynamique

```javascript
// server/utils/aiService.js (ligne 556-562)
const hour = parseInt(time?.split(':')[0] || '18');

if (hour >= 17 && hour <= 20) { 
  // Heures de pointe (17h-20h)
  multiplier *= 1.25; // +25% heures pleines
} else if (hour >= 22 || hour <= 8) { 
  // Heures creuses
  multiplier *= 0.85; // -15% heures creuses
}
```

### 3. Prédictions de Demande

**Utilisation:** Prévisions futures

```javascript
// server/utils/predictiveAnalytics.js
patterns.peakHours = Object.entries(patterns.byHour)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .map(([hour, count]) => ({ hour: parseInt(hour), bookings: count }));
```

---

## 📊 Affichage dans le Dashboard

### Graphique "Heures de Pointe"

- **Type:** Bar Chart (Recharts)
- **Axe X:** Heure (0-23)
- **Axe Y:** Nombre de réservations
- **Données:** Top 5 heures les plus fréquentes

### Exemple Visuel

```
Heures de Pointe
│
12 │     ████
   │     ████
10 │     ████
   │ ████ ████
 8 │ ████ ████
   │ ████ ████
 6 │ ████ ████
   │ ████ ████
 4 │ ████ ████
   │ ████ ████
 2 │ ████ ████
   └─────────────────
     16  17  18  19  20
```

---

## ⚙️ Paramètres

### Période d'Analyse

- **Par défaut:** 30 derniers jours
- **Configurable:** `?days=60` pour 60 jours

### Filtres

- **Statuts inclus:** `confirmed`, `paid`, `completed`
- **Statuts exclus:** `pending`, `cancelled`, `no_show`, etc.

### Limite

- **Top 5** heures les plus fréquentes
- Modifiable dans le code (ligne 423: `{ $limit: 5 }`)

---

## 🔄 Mise à Jour

Les heures de pointe sont **recalculées à chaque chargement** du dashboard admin.

**Pas de cache** - toujours à jour avec les dernières réservations.

---

## 💡 Insights

### Heures Typiques de Pointe

Au Maroc, les heures de pointe pour les terrains sportifs sont généralement :

- **17h-20h** : Après le travail/école
- **Weekend après-midi** : 14h-18h

### Utilisation pour Pricing

Si une heure est dans le top 5 des heures de pointe :
- ✅ Prix peut être augmenté de **+25%**
- ✅ Recommandation: "Heure de forte demande"

---

## 📝 Code Source

### Backend
- `server/routes/aiEnhanced.js` (ligne 409-424)
- `server/utils/predictiveAnalytics.js` (ligne 78-82)
- `server/utils/aiService.js` (ligne 556-562)

### Frontend
- `src/components/ai/AdminAIDashboard.tsx` (ligne 438-450)

---

**Calcul automatique et intelligent des heures de pointe ! ⏰📊**
