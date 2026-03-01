# 📊 Logique de Calcul - Dashboard Admin IA

## Vue d'ensemble

Le dashboard admin calcule 4 métriques principales à partir des données de la base de données.

---

## 1️⃣ Revenu Total (Total Revenue)

### Calcul
```javascript
Reservation.aggregate([
  { 
    $match: { 
      status: { $in: ['confirmed', 'paid', 'completed'] } 
    } 
  },
  { 
    $group: { 
      _id: null, 
      total: { $sum: '$totalAmount' } 
    } 
  }
])
```

### Logique
- **Filtre:** Seules les réservations avec statut `confirmed`, `paid`, ou `completed`
- **Somme:** Addition de tous les `totalAmount` de ces réservations
- **Résultat:** 7,404 DH = somme de tous les montants payés/confirmés

### Exemple
```
Réservation 1: 500 DH (paid)
Réservation 2: 1,200 DH (completed)
Réservation 3: 390 DH (confirmed)
...
Total = 7,404 DH
```

---

## 2️⃣ Réservations (Total Reservations)

### Calcul
```javascript
Reservation.countDocuments({ 
  status: { $in: ['confirmed', 'paid', 'completed'] } 
})
```

### Logique
- **Compte:** Nombre total de réservations avec statut `confirmed`, `paid`, ou `completed`
- **Exclut:** `pending`, `cancelled`, `no_show`, `refunded`, `disputed`
- **Résultat:** 19 = nombre de réservations valides

### Exemple
```
Réservations avec statut:
- confirmed: 5
- paid: 10
- completed: 4
Total = 19 réservations
```

---

## 3️⃣ Utilisateurs Actifs (Active Users)

### Calcul
```javascript
User.countDocuments({ isActive: true })
```

### Logique
- **Filtre:** Utilisateurs avec `isActive: true`
- **Exclut:** Utilisateurs désactivés (`isActive: false`)
- **Résultat:** 5 = nombre d'utilisateurs actifs dans le système

### Note
- Un utilisateur est "actif" si son compte n'est pas désactivé
- Peut inclure des utilisateurs qui n'ont jamais fait de réservation

---

## 4️⃣ Revenu Moyen (Average Revenue Per Reservation)

### Calcul
```javascript
averageRevenuePerReservation = totalReservations > 0 
  ? totalRevenue / totalReservations 
  : 0
```

### Logique
- **Formule:** `Revenu Total / Nombre de Réservations`
- **Protection:** Si aucune réservation, retourne 0
- **Résultat:** 390 DH = 7,404 DH / 19 réservations

### Exemple
```
Revenu Total: 7,404 DH
Réservations: 19
Revenu Moyen = 7,404 / 19 = 389.68 ≈ 390 DH
```

---

## 📍 Code Source

### Backend: `server/utils/aiService.js`

```javascript
async getAdminDashboardInsights() {
  const [
    totalReservations,
    totalRevenue,
    activeUsers,
    topResources,
    suspiciousUsers,
    demandPredictions
  ] = await Promise.all([
    // 1. Compter réservations valides
    Reservation.countDocuments({ 
      status: { $in: ['confirmed', 'paid', 'completed'] } 
    }),
    
    // 2. Calculer revenu total
    Reservation.aggregate([
      { 
        $match: { 
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
    
    // 3. Compter utilisateurs actifs
    User.countDocuments({ isActive: true }),
    
    // ... autres calculs
  ]);

  const revenue = totalRevenue[0]?.total || 0;

  return {
    overview: {
      totalReservations,
      totalRevenue: revenue,
      activeUsers,
      averageRevenuePerReservation: totalReservations > 0 
        ? revenue / totalReservations 
        : 0
    },
    // ...
  };
}
```

### Frontend: `src/components/ai/AdminAIDashboard.tsx`

```typescript
// Les valeurs sont affichées directement depuis l'API
<Card>
  <CardContent>
    <p className="text-2xl font-bold">
      {insights.overview.totalRevenue.toLocaleString()} DH
    </p>
  </CardContent>
</Card>
```

---

## 🔍 Détails Techniques

### Statuts de Réservation Inclus
- ✅ `confirmed` - Réservation confirmée
- ✅ `paid` - Réservation payée
- ✅ `completed` - Réservation complétée

### Statuts Exclus
- ❌ `pending` - En attente
- ❌ `cancelled` - Annulée
- ❌ `no_show` - Client absent
- ❌ `refunded` - Remboursée
- ❌ `disputed` - Contestée

### Champ Utilisé pour le Revenu
- **Champ:** `totalAmount` (dans le modèle Reservation)
- **Type:** Number
- **Unité:** DH (Dirhams marocains)

---

## 📊 Exemple de Calcul Complet

### Données de Base
```
Réservations en base:
- ID1: status='paid', totalAmount=500
- ID2: status='completed', totalAmount=1200
- ID3: status='confirmed', totalAmount=390
- ID4: status='paid', totalAmount=800
- ID5: status='cancelled', totalAmount=600 (EXCLU)
- ID6: status='pending', totalAmount=300 (EXCLU)
... (14 autres réservations valides)

Utilisateurs:
- User1: isActive=true
- User2: isActive=true
- User3: isActive=false (EXCLU)
- User4: isActive=true
- User5: isActive=true
- User6: isActive=true
```

### Calculs
```
1. Revenu Total:
   500 + 1200 + 390 + 800 + ... = 7,404 DH

2. Réservations:
   Compte des réservations avec status in ['confirmed', 'paid', 'completed']
   = 19 réservations

3. Utilisateurs Actifs:
   Compte des utilisateurs avec isActive=true
   = 5 utilisateurs

4. Revenu Moyen:
   7,404 / 19 = 389.68 ≈ 390 DH
```

---

## ⚠️ Points d'Attention

1. **Revenu Total:** Utilise `totalAmount`, pas `basePrice` (inclut taxes, réductions, etc.)
2. **Utilisateurs Actifs:** Compte tous les utilisateurs actifs, pas seulement ceux qui ont réservé
3. **Revenu Moyen:** Arrondi à l'entier le plus proche
4. **Performance:** Les calculs sont faits en parallèle avec `Promise.all()`

---

## 🔄 Mise à Jour

Les métriques sont recalculées à chaque chargement du dashboard (pas de cache).

Pour forcer un recalcul:
- Recharger la page
- Les données sont toujours à jour avec la base de données

---

**Logique de calcul claire et transparente ! 📊**
