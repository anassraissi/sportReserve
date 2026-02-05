# 📚 GUIDE COMPLET MÉTHODE AGILE — SportReserve
## Projet Kanban pour 3 Développeurs — Expliqué du Début à la Fin

> **Projet** : SportReserve (Flow Forge Kanban Board)  
> **Date** : 5 Février 2026  
> **Équipe** : 3 développeurs  
> **Méthodologie** : Scrum Agile  
> **Durée Sprint** : 2 semaines  
> **Objectif** : Système de réservation de ressources sportives

---

## 📖 TABLE DES MATIÈRES

1. [C'est Quoi la Méthode Agile](#1-cest-quoi-la-méthode-agile)
2. [Analyse du Projet SportReserve](#2-analyse-du-projet-sportreserve)
3. [L'Équipe de 3 Développeurs](#3-léquipe-de-3-développeurs)
4. [Les Opérations Réalisées (Sprints 1-3)](#4-les-opérations-réalisées-sprints-1-3)
5. [Le Backlog Complet](#5-le-backlog-complet)
6. [Les Sprints Futurs](#6-les-sprints-futurs)
7. [Comment Organiser les Tâches](#7-comment-organiser-les-tâches)
8. [Les Cérémonies Agile](#8-les-cérémonies-agile)
9. [Le Tableau Kanban](#9-le-tableau-kanban)
10. [Estimation et Vélocité](#10-estimation-et-vélocité)
11. [Definition of Done](#11-definition-of-done)
12. [Roadmap et Planning](#12-roadmap-et-planning)

---

## 1) C'EST QUOI LA MÉTHODE AGILE ?

### 🎯 Définition Simple
La **méthode Agile** est une façon de travailler en équipe pour créer un logiciel **progressivement** et **rapidement**, en livrant des fonctionnalités **tous les 15 jours** au lieu d'attendre 6 mois pour tout finir.

### 🔑 Principes Clés

#### **1. Sprints (Itérations)**
```
Un Sprint = 2 semaines de travail concentré
À la fin : on a quelque chose qui FONCTIONNE
```

**Exemple** :
- Sprint 1 → Login + Inscription fonctionnels
- Sprint 2 → Réservations fonctionnelles
- Sprint 3 → Kanban fonctionnel

#### **2. Le Backlog (Liste de Tâches)**
```
BACKLOG = Toutes les fonctionnalités qu'on veut faire
Trié par PRIORITÉ (du plus urgent au moins urgent)
```

**Notre Backlog** :
- P0 (Critique) : Dashboard, Resources, Reservations
- P1 (Important) : Emails, Calendrier
- P2 (Moyen) : Analytics, Export
- P3 (Peut attendre) : Optimisations

#### **3. Les Cérémonies (Réunions)**
```
Standup Daily    : 10 min chaque jour ("Qu'est-ce que tu fais ?")
Sprint Planning  : 2h au début ("Qu'est-ce qu'on fait ce sprint ?")
Sprint Review    : 1h à la fin ("Démo de ce qu'on a fait")
Retrospective    : 45 min ("Qu'est-ce qu'on améliore ?")
```

#### **4. Le Tableau Kanban (Visual Board)**
```
[TODO] → [EN COURS] → [REVUE] → [TERMINÉ]
```

Chaque tâche avance de gauche à droite comme une chaîne de montage.

---

## 2) ANALYSE DU PROJET SPORTRESERVE

### 🏗️ Architecture Technique

```
┌─────────────────────────────────────────┐
│           FRONTEND (React)              │
│  - Pages (Login, Dashboard, Kanban)    │
│  - Components (UI shadcn)               │
│  - State Management (Context API)      │
│  - API Calls (axios)                    │
└──────────────┬──────────────────────────┘
               │ HTTP/WebSocket
┌──────────────▼──────────────────────────┐
│           BACKEND (Node.js)             │
│  - Express Server                       │
│  - Socket.IO (temps réel)               │
│  - Routes API (/api/auth, /resources)   │
│  - Middleware (auth, validation)        │
└──────────────┬──────────────────────────┘
               │ Mongoose
┌──────────────▼──────────────────────────┐
│          DATABASE (MongoDB)             │
│  - Collections: users, resources,       │
│    reservations, projects, tasks        │
└─────────────────────────────────────────┘
```

### 📦 Fonctionnalités Principales

#### **Module 1 : Authentification**
- Inscription utilisateur (email + password)
- Login avec JWT token
- Google OAuth login
- Gestion des rôles (user, admin, manager)
- Comptes auto-approuvés (plus besoin d'approbation admin)

#### **Module 2 : Ressources Sportives**
- Listing des ressources (terrains, équipements)
- Création/modification/suppression
- Upload d'images
- Catégorisation
- Disponibilités

#### **Module 3 : Réservations**
- Créer une réservation
- Voir ses réservations
- Modifier/annuler
- Statuts (pending, confirmed, cancelled)
- Notifications temps réel

#### **Module 4 : Projets & Kanban**
- Créer des projets
- Ajouter des tâches
- Board Kanban (Todo, In Progress, Review, Done)
- Drag & drop des tâches
- Synchronisation API

#### **Module 5 : Notifications**
- Notifications en temps réel (Socket.IO)
- Bell icon avec compteur
- Marquage lu/non-lu
- Types : réservation, approbation, reminder

---

## 3) L'ÉQUIPE DE 3 DÉVELOPPEURS

### 👨‍💻 Dev A — Backend Lead

**Rôle Principal** : Chef backend
**Responsabilités** :
- Créer les API endpoints (`/api/*`)
- Modéliser la base de données (Mongoose schemas)
- Authentification & sécurité (JWT, bcrypt)
- Upload de fichiers
- WebSocket (Socket.IO) pour temps réel
- Optimisation DB (indexes, queries)

**Compétences** :
- ⭐⭐⭐⭐⭐ Node.js, Express, MongoDB
- ⭐⭐⭐⭐ REST API, WebSocket
- ⭐⭐⭐ React (support)

**Workload par Sprint** : 6-7 Story Points (SP)

**Exemples de Tâches** :
```
✅ Créer endpoint POST /api/resources
✅ Ajouter middleware d'authentification
✅ Optimiser query MongoDB avec .populate()
✅ Setup email service avec Nodemailer
```

---

### 👩‍💻 Dev B — Frontend Lead

**Rôle Principal** : Chef frontend
**Responsabilités** :
- Créer les pages React (Dashboard, Resources, etc.)
- Développer composants UI (avec shadcn/ui)
- Intégrer les appels API
- State management (Context API, hooks)
- Design responsive (Tailwind CSS)
- UX/UI (animations, loading states, error handling)

**Compétences** :
- ⭐⭐⭐⭐⭐ React, TypeScript, Tailwind
- ⭐⭐⭐⭐ State management, API integration
- ⭐⭐⭐ Backend (support)

**Workload par Sprint** : 6-7 Story Points (SP)

**Exemples de Tâches** :
```
✅ Créer page Dashboard avec graphiques
✅ Intégrer API resources dans ResourcesPage
✅ Ajouter loading spinner sur les calls API
✅ Créer composant Card pour les réservations
```

---

### 🧑‍💼 Dev C — Full-Stack / QA

**Rôle Principal** : Support & Qualité
**Responsabilités** :
- Features qui touchent backend ET frontend
- Tests (unitaires, E2E)
- QA (vérification manuelle)
- DevOps (déploiement, CI/CD)
- Documentation
- Bug fixes
- Release preparation

**Compétences** :
- ⭐⭐⭐⭐ React + Node.js (équilibré)
- ⭐⭐⭐⭐⭐ Testing, QA
- ⭐⭐⭐⭐ DevOps, Git

**Workload par Sprint** : 6-7 Story Points (SP)

**Exemples de Tâches** :
```
✅ Écrire tests E2E pour login flow
✅ Corriger bugs UI + backend
✅ Setup CI/CD pipeline
✅ Tester manuellement toutes les features S4
✅ Rédiger release notes
```

---

## 4) LES OPÉRATIONS RÉALISÉES (SPRINTS 1-3)

### 🚀 Sprint 1 — Fondations (Terminé ✅)
**Dates** : Sprint historique  
**Story Points Planifiés** : 24 SP  
**Story Points Réalisés** : 24 SP ✅ (100%)  
**Vélocité** : 24

#### 📋 Backlog Sprint 1
| Tâche | SP | Dev | Statut |
|-------|----|----|--------|
| Setup serveur Express | 3 | A | ✅ DONE |
| Setup MongoDB + Mongoose | 3 | A | ✅ DONE |
| Créer modèle User | 2 | A | ✅ DONE |
| Endpoint POST /api/auth/register | 3 | A | ✅ DONE |
| Endpoint POST /api/auth/login | 3 | A | ✅ DONE |
| JWT token generation | 2 | A | ✅ DONE |
| Page Register (React) | 3 | B | ✅ DONE |
| Page Login (React) | 3 | B | ✅ DONE |
| Setup Tailwind CSS | 1 | B | ✅ DONE |
| Tests auth endpoints | 1 | C | ✅ DONE |

#### 🎯 Réalisations Sprint 1
```
✅ Serveur Node.js opérationnel (port 5000)
✅ Base MongoDB connectée
✅ Utilisateurs peuvent s'inscrire
✅ Utilisateurs peuvent se connecter
✅ JWT token générés et validés
✅ Pages Login/Register fonctionnelles
✅ Protection des routes avec middleware auth
```

#### 📊 Métriques Sprint 1
- **Bugs trouvés** : 2 (mineurs)
- **Bugs résolus** : 2 ✅
- **Temps moyen par tâche** : 1.2 jours
- **Code reviews** : 10 PRs mergées

---

### 🚀 Sprint 2 — CRUD & Temps Réel (Terminé ✅)
**Dates** : Sprint historique  
**Story Points Planifiés** : 24 SP  
**Story Points Réalisés** : 24 SP ✅ (100%)  
**Vélocité** : 24

#### 📋 Backlog Sprint 2
| Tâche | SP | Dev | Statut |
|-------|----|----|--------|
| Modèle Resource (DB) | 2 | A | ✅ DONE |
| CRUD API Resources | 5 | A | ✅ DONE |
| Modèle Reservation | 2 | A | ✅ DONE |
| CRUD API Reservations | 5 | A | ✅ DONE |
| Upload fichiers (multer) | 3 | A | ✅ DONE |
| Socket.IO setup | 2 | A | ✅ DONE |
| Page Resources (UI) | 3 | B | ✅ DONE |
| Page Reservations (UI) | 3 | B | ✅ DONE |
| Composant NotificationBell | 2 | B | ✅ DONE |
| Tests CRUD + Socket | 2 | C | ✅ DONE |

#### 🎯 Réalisations Sprint 2
```
✅ Ressources sportives créables/modifiables
✅ Upload d'images pour ressources
✅ Réservations fonctionnelles (CRUD complet)
✅ Notifications temps réel (Socket.IO)
✅ Bell icon avec compteur de notifications
✅ System de stockage fichiers (server/uploads/)
```

#### 📊 Métriques Sprint 2
- **Bugs trouvés** : 4 (2 critiques, 2 mineurs)
- **Bugs résolus** : 4 ✅
- **API endpoints créés** : 8
- **Temps moyen par tâche** : 1.5 jours

---

### 🚀 Sprint 3 — Kanban & Projets (Terminé ✅)
**Dates** : Sprint historique  
**Story Points Planifiés** : 24 SP  
**Story Points Réalisés** : 24 SP ✅ (100%)  
**Vélocité** : 24

#### 📋 Backlog Sprint 3
| Tâche | SP | Dev | Statut |
|-------|----|----|--------|
| Modèle Project | 2 | A | ✅ DONE |
| Modèle Task | 2 | A | ✅ DONE |
| CRUD API Projects | 4 | A | ✅ DONE |
| CRUD API Tasks | 4 | A | ✅ DONE |
| Google OAuth backend | 3 | A | ✅ DONE |
| Page Kanban (colonnes) | 5 | B | ✅ DONE |
| Drag & drop tâches | 3 | B | ✅ DONE |
| Intégration API Projects | 2 | B | ✅ DONE |
| Approbation auto comptes | 2 | A+C | ✅ DONE |
| Tests Kanban flow | 2 | C | ✅ DONE |

#### 🎯 Réalisations Sprint 3
```
✅ Kanban Board complet avec 4 colonnes
   - Todo
   - In Progress
   - Review
   - Done
✅ Drag & drop des tâches
✅ Projets créables avec tâches associées
✅ Synchronisation état Kanban ↔ API
✅ Google OAuth fonctionnel
✅ Comptes auto-approuvés (plus besoin admin)
```

#### 📊 Métriques Sprint 3
- **Bugs trouvés** : 3 (1 critique, 2 mineurs)
- **Bugs résolus** : 3 ✅
- **Features majeures** : 2 (Kanban + OAuth)
- **Temps moyen par tâche** : 1.3 jours

---

### 📈 Bilan des 3 Premiers Sprints

#### Vélocité Moyenne
```
Sprint 1 : 24 SP ✅
Sprint 2 : 24 SP ✅
Sprint 3 : 24 SP ✅
─────────────────
Moyenne : 24 SP par sprint
```

#### Réalisations Globales
```
✅ Backend
   • 3 modèles principaux (User, Resource, Reservation)
   • 5 modèles secondaires (Project, Task, Notification, etc.)
   • 15+ API endpoints REST
   • Socket.IO temps réel
   • Authentification JWT + Google OAuth
   • Upload fichiers

✅ Frontend
   • 6 pages principales
   • 20+ composants UI
   • Kanban fonctionnel
   • Notifications temps réel
   • Routing + protection routes

✅ Qualité
   • 0 bugs critiques en production
   • Code TypeScript (0 erreurs)
   • ESLint configuré
   • Git workflow établi
```

---

## 5) LE BACKLOG COMPLET

### 📊 Structure du Backlog

Le backlog contient **TOUTES** les fonctionnalités à faire, triées par priorité.

```
BACKLOG TOTAL : ~120 Story Points
├─ P0 (Critique)    : 24 SP → SPRINT 4
├─ P1 (Important)   : 24 SP → SPRINT 5
├─ P2 (Moyen)       : 24 SP → SPRINT 6
└─ P3 (Peut Attendre): 18 SP → SPRINT 7+
```

---

### 🔴 P0 — CRITIQUE (Sprint 4)

#### Feature 1 : Dashboard Complète
**Story Points** : 8 SP  
**Priorité** : P0 (bloque beaucoup de choses)  
**Description** :  
Créer un tableau de bord qui affiche les métriques principales du système.

**Acceptance Criteria** :
- [ ] KPIs visibles (réservations, ressources, utilisateurs)
- [ ] Graphiques (barres, lignes)
- [ ] Refresh automatique toutes les 30s
- [ ] Loading states pendant chargement
- [ ] Error handling si API fail
- [ ] Responsive (mobile + desktop)

**Sub-tasks** :
```
1. [Backend] API GET /api/dashboard/metrics (2 SP) - Dev A
   - Calculer total réservations
   - Calculer total ressources
   - Calculer total utilisateurs
   - Calculer revenus (si applicable)
   
2. [Frontend] DashboardPage.tsx layout (3 SP) - Dev B
   - Header avec titre
   - Grid layout pour KPI cards
   - Section graphiques
   
3. [Frontend] Intégration API + state (2 SP) - Dev B
   - useEffect pour fetch metrics
   - useState pour data
   - Loading spinner
   - Error message
   
4. [Frontend] Charts avec Recharts (1 SP) - Dev B
   - Line chart réservations
   - Bar chart ressources populaires
```

**Impact** : HIGH (page d'accueil principale)  
**Risque** : Moyen (dépend de données DB)

---

#### Feature 2 : Resources Page API Integration
**Story Points** : 8 SP  
**Priorité** : P0 (fonctionnalité core)  
**Description** :  
Connecter la page Resources au backend pour afficher/créer/modifier les ressources.

**Acceptance Criteria** :
- [ ] Liste ressources chargée depuis API
- [ ] Filtrage par catégorie
- [ ] Recherche texte
- [ ] Bouton "Ajouter ressource" ouvre formulaire
- [ ] Upload image fonctionne
- [ ] Edit inline ou modal
- [ ] Delete avec confirmation
- [ ] Pagination (20 items par page)

**Sub-tasks** :
```
1. [Backend] Optimiser GET /api/resources (2 SP) - Dev A
   - Ajouter pagination (?page=1&limit=20)
   - Ajouter filtres (?category=terrain)
   - Ajouter recherche (?search=football)
   - Ajouter sorting (?sort=price)
   
2. [Frontend] ResourcesPage fetch & display (3 SP) - Dev B
   - useEffect fetch resources
   - Map sur array pour afficher cards
   - Loading skeleton
   - Empty state si aucune ressource
   
3. [Frontend] Formulaire Add/Edit (2 SP) - Dev B
   - Modal ou formulaire inline
   - Champs (nom, description, prix, catégorie)
   - Upload image avec preview
   - Validation
   
4. [Frontend] Delete + Error handling (1 SP) - Dev C
   - Confirmation dialog
   - API call DELETE /api/resources/:id
   - Toast success/error
```

**Impact** : HIGH (fonctionnalité principale)  
**Risque** : Faible

---

#### Feature 3 : Reservations Page API Integration
**Story Points** : 8 SP  
**Priorité** : P0 (fonctionnalité core)  
**Description** :  
Connecter la page Reservations au backend + ajouter temps réel.

**Acceptance Criteria** :
- [ ] Liste réservations chargée depuis API
- [ ] Filtrage par statut (pending, confirmed, cancelled)
- [ ] Filtrage par date range
- [ ] Créer nouvelle réservation
- [ ] Modifier réservation existante
- [ ] Annuler réservation
- [ ] Updates temps réel via Socket.IO
- [ ] Badges de statut colorés

**Sub-tasks** :
```
1. [Backend] Optimiser GET /api/reservations (2 SP) - Dev A
   - Ajouter filtres statut/date
   - Populate resource + user
   - Pagination
   
2. [Frontend] ReservationsPage fetch (3 SP) - Dev B
   - useEffect fetch
   - Display avec cards ou table
   - Filtres UI (dropdowns)
   - Status badges
   
3. [Frontend] Formulaire Create/Edit (2 SP) - Dev B
   - Modal booking
   - Sélectionner ressource + date/heure
   - Calcul prix total
   - Submit API
   
4. [Socket.IO] Real-time updates (1 SP) - Dev C
   - Écouter event 'reservationCreated'
   - Ajouter à la liste locale
   - Toast notification
```

**Impact** : HIGH (fonctionnalité critique business)  
**Risque** : Moyen (Socket.IO sync)

---

### 🟡 P1 — IMPORTANT (Sprint 5)

#### Feature 4 : Email Notifications
**Story Points** : 8 SP  
**Priorité** : P1  
**Description** :  
Envoyer des emails automatiques pour certains événements.

**Events à notifier par email** :
- Nouvelle inscription (bienvenue)
- Réservation créée (confirmation)
- Réservation confirmée par admin
- Réservation annulée
- Rappel 24h avant réservation
- Mot de passe changé

**Sub-tasks** :
```
1. [Backend] Setup Nodemailer/SendGrid (2 SP) - Dev A
   - Installer nodemailer
   - Configuration SMTP
   - Test email send
   
2. [Backend] Email templates HTML (2 SP) - Dev A
   - Template welcome.html
   - Template booking-confirmation.html
   - Template reminder.html
   - Variables dynamiques {{name}}
   
3. [Backend] Intégrer dans routes (3 SP) - Dev A
   - Hook après POST /api/reservations
   - Hook après POST /api/auth/register
   - Hook après DELETE /api/reservations/:id
   
4. [Backend] Logs & retry logic (1 SP) - Dev C
   - Logger les emails envoyés
   - Retry si échec
   - Queue système (optionnel)
```

**Impact** : HIGH (communication utilisateurs)  
**Risque** : Moyen (SMTP config, spam)

---

#### Feature 5 : Vue Calendrier
**Story Points** : 10 SP  
**Priorité** : P1  
**Description** :  
Ajouter une vue calendrier pour visualiser les réservations par date.

**Acceptance Criteria** :
- [ ] Calendrier mensuel
- [ ] Réservations affichées sur dates
- [ ] Click sur date → créer réservation
- [ ] Drag & drop pour modifier dates (optionnel)
- [ ] Légende des statuts
- [ ] Switch entre vue liste et calendrier

**Sub-tasks** :
```
1. [Frontend] Installer react-big-calendar (1 SP) - Dev B
   
2. [Frontend] CalendarView component (4 SP) - Dev B
   - Intégrer calendrier
   - Mapper réservations → events
   - Styling CSS
   
3. [Frontend] Interactions (3 SP) - Dev B
   - Click date → modal booking
   - Click event → voir détails
   - Filtres sur calendar
   
4. [Backend] API par date range (2 SP) - Dev A
   - GET /api/reservations?start=2026-02-01&end=2026-02-28
   - Optimisation query
```

**Impact** : MEDIUM (améliore UX)  
**Risque** : Faible

---

#### Feature 6 : Notifications Système Complètes
**Story Points** : 6 SP  
**Priorité** : P1  
**Description** :  
Étendre le système de notifications à toutes les actions.

**Nouvelles notifications** :
- Nouvelle ressource ajoutée
- Ressource modifiée
- Projet créé
- Tâche assignée
- Commentaire ajouté
- Deadline approche

**Sub-tasks** :
```
1. [Backend] Créer helper notifications (2 SP) - Dev A
   - utils/notificationHelper.js
   - Fonction createNotification()
   - Socket emit
   
2. [Backend] Hook dans routes (2 SP) - Dev C
   - POST /api/resources → notify admins
   - POST /api/projects → notify team
   - POST /api/tasks → notify assignee
   
3. [Frontend] UI preferences (2 SP) - Dev B
   - Page Settings > Notifications
   - Toggle par type
   - Sauvegarder preferences
```

**Impact** : MEDIUM (engagement utilisateurs)  
**Risque** : Faible

---

### 🟢 P2 — MOYEN (Sprint 6)

#### Feature 7 : User Profile
**Story Points** : 5 SP  
**Priorité** : P2  
**Description** :  
Page profil utilisateur avec édition.

**Sub-tasks** :
```
1. [Backend] Endpoint PATCH /api/users/me (1 SP) - Dev A
2. [Frontend] ProfilePage (3 SP) - Dev B
3. [Frontend] Avatar upload (1 SP) - Dev B
```

---

#### Feature 8 : Advanced Search & Filters
**Story Points** : 6 SP  
**Priorité** : P2  
**Description** :  
Améliorer système de recherche/filtrage.

---

#### Feature 9 : Export CSV/PDF
**Story Points** : 5 SP  
**Priorité** : P2  
**Description** :  
Bouton export pour télécharger données.

**Sub-tasks** :
```
1. [Backend] Endpoint GET /api/export/reservations (2 SP) - Dev A
2. [Frontend] Bouton export (1 SP) - Dev B
3. [Library] PDF generation (2 SP) - Dev C
```

---

#### Feature 10 : Tests E2E
**Story Points** : 6 SP  
**Priorité** : P2  
**Description** :  
Tests automatisés sur flows critiques.

**Flows à tester** :
- Login → Dashboard
- Créer réservation → Confirmer
- Drag tâche Kanban

---

### 🔵 P3 — PEUT ATTENDRE (Sprint 7+)

- Analytics Dashboard (8 SP)
- Password Reset (4 SP)
- Performance Optimization (6 SP)

---

## 6) LES SPRINTS FUTURS

### 🚀 Sprint 4 — Stabiliser UX (10-24 Février)

**Objectif** : Compléter les 3 pages P0 critiques  
**Story Points** : 24 SP  
**Dates** : 10 Février → 24 Février 2026

#### Planning Sprint 4
| Feature | SP | Assigné | Début | Fin |
|---------|----|----|-------|-----|
| Dashboard | 8 | Dev B | 10 Fév | 14 Fév |
| Resources Page | 8 | Dev B | 14 Fév | 18 Fév |
| Reservations Page | 8 | Dev B | 18 Fév | 21 Fév |

**Répartition par Dev** :
```
Dev A (8 SP):
  - API dashboard metrics (2)
  - Optimiser API resources (3)
  - Optimiser API reservations (3)

Dev B (12 SP):
  - Dashboard UI (6)
  - Resources UI (3)
  - Reservations UI (3)

Dev C (4 SP):
  - Testing S4 features (3)
  - Documentation (1)
```

#### Risques Sprint 4
- ⚠️ Beaucoup de frontend pour Dev B → paire avec Dev C si débordé
- ⚠️ Requêtes DB lentes → Dev A optimise indexes

---

### 🚀 Sprint 5 — Notifications + Calendrier (24 Fév - 10 Mars)

**Objectif** : Email notifications + Calendrier  
**Story Points** : 24 SP

#### Planning Sprint 5
```
Dev A (10 SP):
  - Email service setup (8)
  - API calendar endpoints (2)

Dev B (10 SP):
  - Calendar view (10)

Dev C (4 SP):
  - Notifications système (4)
```

---

### 🚀 Sprint 6 — Polish + Export (10-24 Mars)

**Objectif** : Profil, Export, Tests  
**Story Points** : 24 SP

#### Planning Sprint 6
```
Dev A (6 SP):
  - User profile API (3)
  - Export endpoints (3)

Dev B (8 SP):
  - Profile page (5)
  - Export UI (3)

Dev C (10 SP):
  - Tests E2E (6)
  - Performance (4)
```

---

### 🚀 Sprint 7 — Release v1.0 (24-31 Mars)

**Objectif** : Analytics + Release finale  
**Story Points** : 18 SP (sprint court)

```
Toute l'équipe:
  - Analytics (12 SP)
  - Derniers bugs (3 SP)
  - Release prep (3 SP)
  
🎉 31 Mars : RELEASE v1.0 PRODUCTION
```

---

## 7) COMMENT ORGANISER LES TÂCHES

### 🎯 La Matrice de Priorisation

```
┌───────────────────────────────────────────┐
│         IMPACT vs EFFORT                  │
│                                           │
│  HIGH IMPACT                              │
│  LOW EFFORT    → P0 (Do First)            │
│                                           │
│  HIGH IMPACT                              │
│  HIGH EFFORT   → P1 (Plan Well)           │
│                                           │
│  LOW IMPACT                               │
│  LOW EFFORT    → P2 (Nice to Have)        │
│                                           │
│  LOW IMPACT                               │
│  HIGH EFFORT   → P3 (Avoid)               │
└───────────────────────────────────────────┘
```

### 📝 Créer une User Story

**Format** :
```
En tant que [type d'utilisateur]
Je veux [action]
Afin de [bénéfice]

Exemple:
En tant que manager sportif
Je veux voir un calendrier de réservations
Afin de mieux gérer les disponibilités
```

### 🔨 Découper une Story en Sub-tasks

**Règle** : Une sub-task = max 1 jour de travail (< 6h)

**Exemple** : Dashboard (8 SP)
```
Dashboard (8 SP)
├─ API metrics (2 SP) ─────── Backend
│  ├─ Compter réservations
│  ├─ Compter ressources
│  └─ Compter users
│
├─ Dashboard layout (3 SP) ──── Frontend
│  ├─ Header component
│  ├─ KPI cards grid
│  └─ Charts section
│
├─ API integration (2 SP) ───── Frontend
│  ├─ useEffect fetch
│  ├─ Loading state
│  └─ Error handling
│
└─ Charts (1 SP) ────────────── Frontend
   ├─ Line chart
   └─ Bar chart
```

### 🏷️ Labels GitHub

```
type: feature     (nouvelle fonctionnalité)
type: bug         (correction)
type: chore       (tâche technique)

priority: P0      (critique)
priority: P1      (important)
priority: P2      (moyen)
priority: P3      (bas)

size: small       (1-3 SP)
size: medium      (5-8 SP)
size: large       (10-13 SP)

status: todo      
status: in-progress
status: in-review
status: done
```

---

## 8) LES CÉRÉMONIES AGILE

### 1️⃣ DAILY STANDUP (Chaque matin 10h00)

**Durée** : 10-15 minutes MAX  
**Participants** : Les 3 devs  
**Format** : Chacun répond à 3 questions

#### Questions
```
1. ✅ Qu'est-ce que j'ai FAIT hier ?
2. 🔄 Qu'est-ce que je FAIS aujourd'hui ?
3. 🚧 Quels sont mes BLOCAGES ?
```

#### Exemple Standup
```
🗣️ Dev A:
✅ Hier: Terminé API dashboard metrics, testé avec Postman
🔄 Aujourd'hui: Commencer optimisation API resources
🚧 Blocages: Aucun

🗣️ Dev B:
✅ Hier: Dashboard layout terminé, KPI cards faits
🔄 Aujourd'hui: Intégrer API dans Dashboard, ajouter charts
🚧 Blocages: Attends endpoint metrics de Dev A → OK maintenant

🗣️ Dev C:
✅ Hier: Setup Jest pour tests, écrit 3 tests unitaires
🔄 Aujourd'hui: Continuer tests, review PR de Dev A
🚧 Blocages: Aucun
```

#### Règles d'Or
- ⏰ **PONCTUEL** : 10h00 pile (pas 10h05)
- ⚡ **RAPIDE** : 1-2 min par personne
- 🧍 **DEBOUT** : Pour rester court (si présentiel)
- 🚫 **PAS DE DÉBAT** : Si problème complexe → discuter APRÈS
- 📝 **BLOCKER = URGENT** : Si quelqu'un bloqué → aide immédiate

---

### 2️⃣ SPRINT PLANNING (Lundi début de sprint, 9h00)

**Durée** : 2 heures  
**Participants** : Les 3 devs  
**Objectif** : Décider ce qu'on fait ces 2 prochaines semaines

#### Ordre du Jour

**Partie 1 : QUOI faire ? (1h)**
```
1. Review Sprint précédent (15 min)
   - Ce qui était prévu
   - Ce qui est fait
   - Vélocité atteinte
   
2. Objectif Sprint nouveau (5 min)
   - "Ce sprint, on livre Dashboard + Resources + Reservations"
   
3. Sélection User Stories (30 min)
   - Prendre du Backlog (P0 en premier)
   - Lire chaque story
   - Questions/clarifications
   - Voter si on prend ou pas
   
4. Estimation (10 min)
   - Planning Poker pour chaque story
   - Total = 20-24 SP max
```

**Partie 2 : COMMENT faire ? (1h)**
```
5. Découpage en sub-tasks (30 min)
   - Découper chaque story
   - Identifier dépendances
   - Backend avant frontend ?
   
6. Assignment (20 min)
   - Qui prend quoi ?
   - Dev A → backend
   - Dev B → frontend
   - Dev C → support + tests
   
7. Commit & Kickoff (10 min)
   - Équipe dit "on s'engage à livrer ça"
   - Création tickets GitHub
   - GO!
```

#### Exemple Planning Poker

**Comment estimer avec Planning Poker** :
```
1. Product Owner lit la story
2. Chaque dev choisit secrètement un chiffre (1,2,3,5,8,13)
3. On révèle en même temps
4. Si différence → discussion
5. On re-vote jusqu'à consensus
```

**Exemple** :
```
Story: "Dashboard avec KPIs"

Vote 1:
  Dev A → 5 (pense que backend facile)
  Dev B → 13 (pense que charts complexes)
  Dev C → 8 (entre les deux)

Discussion:
  Dev B: "Charts React c'est galère, j'ai jamais fait"
  Dev A: "OK mais backend juste 3 queries"
  Dev C: "On peut prendre library Recharts, c'est plus simple"

Vote 2:
  Dev A → 8
  Dev B → 8
  Dev C → 8

✅ Consensus: 8 SP
```

---

### 3️⃣ SPRINT REVIEW (Vendredi fin sprint, 15h00)

**Durée** : 1 heure  
**Participants** : Team + Stakeholders (boss, clients)  
**Objectif** : Démontrer ce qu'on a fait

#### Format

```
1. Intro (5 min)
   - Objectif du sprint (ce qu'on voulait faire)
   
2. DÉMO LIVE (40 min)
   - Chaque dev montre ses features
   - Sur environnement STAGING
   - Pas de PowerPoint, du CODE QUI TOURNE
   
3. Métriques (10 min)
   - SP planifiés vs réalisés
   - Bugs trouvés/résolus
   - Vélocité
   
4. Feedback (5 min)
   - Stakeholders posent questions
   - Suggestions
```

#### Exemple Démo Sprint 4

```
🎬 Dev B:
"Je vais vous montrer le nouveau Dashboard"
[Ouvre navigateur → http://staging.sportreserve.com]
[Login]
"Voici la page Dashboard avec les KPIs"
[Montre cards: 150 réservations, 25 ressources, 80 users]
[Montre graphique ligne: réservations par jour]
[Montre graphique barres: top 5 ressources]
"Si je clique refresh, les données se rechargent"
[Click refresh → loading spinner → data update]

👏 Applaudissements

📊 Dev C:
"Métriques Sprint 4:
 - Planifié: 20 SP
 - Réalisé: 20 SP ✅
 - Vélocité: 20 (stable)
 - Bugs: 2 trouvés, 2 résolus
 - Date release: On track pour 31 Mars"
 
💬 Stakeholder:
"Super! Question: peut-on filtrer le Dashboard par date?"
Dev B: "Pas encore, mais on peut l'ajouter au Backlog pour Sprint 5"
```

---

### 4️⃣ RETROSPECTIVE (Vendredi fin sprint, 16h00)

**Durée** : 45 minutes  
**Participants** : Les 3 devs SEULEMENT (pas de boss)  
**Objectif** : Améliorer notre façon de travailler

#### Format : Start / Stop / Continue

```
1. Collecte (15 min)
   Chacun écrit sur post-its:
   
   🟢 START (qu'est-ce qu'on devrait commencer à faire ?)
   🔴 STOP (qu'est-ce qu'on devrait arrêter ?)
   🟡 CONTINUE (qu'est-ce qui marche bien ?)

2. Partage (15 min)
   Chacun lit ses post-its
   On regroupe les similaires

3. Vote (5 min)
   Chaque dev vote pour top 3 items

4. Actions (10 min)
   Top 3 → Actions concrètes pour prochain sprint
```

#### Exemple Retro Sprint 4

```
🟢 START:
- "Pair programming pour features complexes" (5 votes)
- "Tests automatisés dès le début" (4 votes)
- "Documentation API au fur et à mesure" (2 votes)

🔴 STOP:
- "Meetings de 15h (on est fatigué)" (6 votes) ← TOP
- "Commits énormes (difficile à review)" (3 votes)
- "Coder sans tests" (2 votes)

🟡 CONTINUE:
- "Standups courts et efficaces" (7 votes) ← TOP
- "Code reviews rapides (< 2h)" (5 votes)
- "Slack pour comm rapide" (3 votes)

✅ ACTIONS SPRINT 5:
1. Décaler meetings à 14h au lieu de 15h
2. Code reviews dans les 2h max
3. Faire pair programming sur Calendar (feature complexe)
```

---

### 5️⃣ BACKLOG REFINEMENT (Mercredi 15h00)

**Durée** : 1 heure  
**Participants** : Les 3 devs  
**Objectif** : Préparer les stories du prochain sprint

#### Activités

```
1. Revue Backlog (20 min)
   - Lire prochaines stories prioritaires
   - Clarifier requirements
   - Poser questions
   
2. Estimation préliminaire (20 min)
   - Planning Poker rapide
   - Juste pour avoir une idée
   
3. Découpage (15 min)
   - Découper grosses stories (> 13 SP)
   - Identifier dépendances
   
4. Priorités (5 min)
   - Vérifier ordre Backlog
   - Déplacer si besoin
```

**Résultat** : Prochain Sprint Planning sera RAPIDE car déjà préparé ✅

---

## 9) LE TABLEAU KANBAN

### 🎨 Structure du Board

```
┌──────────┬──────────────┬───────────┬──────┐
│ BACKLOG  │ TODO        │ IN DEV    │ REVIEW│ DONE
│  (51)    │  (20)       │  (3)      │  (2)  │ (70+)
├──────────┼──────────────┼───────────┼──────┤──────┐
│          │              │           │      │      │
│ • Story  │ • Dashboard  │• Opt API  │• PR  │• Login
│   Future │   (8 SP)     │  (2 SP)   │  #45 │• Kanban
│          │   Dev B      │  Dev A    │      │• OAuth
│ • Export │              │           │• PR  │
│   CSV    │• Resources   │• Charts   │  #46 │
│          │   (8 SP)     │  (1 SP)   │      │
│ • ...    │   Dev B      │  Dev B    │      │
│          │              │           │      │
└──────────┴──────────────┴───────────┴──────┴──────┘
```

### 📋 Colonnes Expliquées

#### 1. BACKLOG
```
Quoi: Toutes les stories pas encore sélectionnées
Quand: Création initiale
Qui: Product Owner (ou Team Lead)
Règle: Trié par priorité (P0 en haut)
```

#### 2. TODO (Sprint Backlog)
```
Quoi: Stories sélectionnées pour ce sprint
Quand: Après Sprint Planning
Qui: Toute l'équipe
Règle: Max 24 SP dans cette colonne
```

#### 3. IN DEV (In Progress)
```
Quoi: Stories en cours de développement
Quand: Dev commence à coder
Qui: Dev assigné
Règle: WIP limit = 2 par dev (max 6 total)
Action: Créer branch Git, coder
```

#### 4. IN REVIEW (Code Review)
```
Quoi: PR créée, attend review
Quand: Dev termine + push
Qui: Autre dev (reviewer)
Règle: Review dans les 2h max
Action: Review code, approve ou request changes
```

#### 5. DONE
```
Quoi: Story complète, merged, déployée
Quand: PR mergée + tests passés
Qui: Dev original + reviewer
Règle: Doit respecter Definition of Done
Action: Célébrer! 🎉
```

---

### 🚦 WIP Limits (Work In Progress)

**Pourquoi limiter ?**
- Éviter multitasking (concentration)
- Finir avant de commencer nouveau
- Flux constant

**Nos limites** :
```
Dev A: Max 2 tasks IN DEV (backend prend du temps)
Dev B: Max 2 tasks IN DEV
Dev C: Max 3 tasks IN DEV (support multiple)

Total équipe: Max 6 tasks IN REVIEW
```

**Que faire si WIP atteint ?**
- ❌ Ne PAS prendre nouvelle tâche
- ✅ Aider quelqu'un d'autre
- ✅ Faire code reviews
- ✅ Écrire documentation
- ✅ Optimiser code existant

---

### 🔄 Lifecycle d'une Tâche (Exemple Complet)

#### Étape 1 : BACKLOG → TODO
```
Lundi Sprint Planning:
Dev B: "Je prends Dashboard (8 SP)"
[Move card de BACKLOG → TODO]
```

#### Étape 2 : TODO → IN DEV
```
Lundi 11h:
Dev B: [Crée branch Git]
$ git checkout -b feature/dashboard-kpis

[Commence à coder]
[Move card TODO → IN DEV]
[Assigné: Dev B]
```

#### Étape 3 : Coding...
```
Lundi-Mercredi: Dev B code
- Crée DashboardPage.tsx
- Intègre API
- Ajoute charts
- Teste manuellement
- Commits réguliers
```

#### Étape 4 : IN DEV → IN REVIEW
```
Mercredi 16h:
Dev B: "Dashboard terminé!"

$ git push origin feature/dashboard-kpis
[Crée Pull Request sur GitHub]

PR #47: feat: Dashboard with KPIs
Assignee: Dev B
Reviewer: @DevA

[Move card IN DEV → IN REVIEW]
```

#### Étape 5 : Code Review
```
Mercredi 17h:
Dev A: [Ouvre PR #47]
[Lit code]
[Teste localement]
[Laisse commentaire: "LGTM! Just one typo"]

Dev B: [Corrige typo]
Dev B: [Push fix]

Dev A: [Approve PR ✅]
```

#### Étape 6 : IN REVIEW → DONE
```
Mercredi 18h:
Dev B: [Merge PR]
$ git checkout develop
$ git merge feature/dashboard-kpis
$ git push origin develop

[CI/CD auto-deploy to staging]
[Tests passent ✅]

[Move card IN REVIEW → DONE]

🎉 Dashboard terminé!!!
```

---

## 10) ESTIMATION ET VÉLOCITÉ

### 🎲 Story Points (SP)

**Qu'est-ce que c'est ?**  
Unité de mesure de la **complexité** d'une tâche (pas le temps!)

**Échelle de Fibonacci** :
```
1 pts  = Trivial (typo fix)
2 pts  = Trivial (config)
3 pts  = Simple (basic component)
5 pts  = Moyen (CRUD simple)
8 pts  = Complexe (feature avec dépendances)
13 pts = Très complexe (feature majeure)
21 pts = Trop gros! (découper en sub-stories)
```

### 🧮 Comment Estimer ?

#### Méthode : Comparaison Relative

**Exemple** :
```
Story de référence: Login page = 3 SP (on l'a déjà fait)

Nouvelle story: Dashboard

Questions:
- Plus complexe que Login? → OUI (charts, multiple APIs)
- 2x plus? → OUI environ
- 3x plus? → Non, pas tant

Estimation: 3 SP × 2.5 ≈ 8 SP ✅
```

#### Facteurs de Complexité

```
✅ Simple (SP bas):
- Déjà fait similaire avant
- Technologies connues
- Pas de dépendances
- Specs claires

❌ Complexe (SP haut):
- Jamais fait avant
- Nouvelles technologies
- Dépendances multiples
- Specs floues
- Intégrations externes
```

---

### 📊 Vélocité

**Définition** :  
Nombre moyen de Story Points que l'équipe termine par sprint.

**Notre vélocité** :
```
Sprint 1: 24 SP ✅
Sprint 2: 24 SP ✅
Sprint 3: 24 SP ✅
──────────────────
Vélocité moyenne: 24 SP/sprint
```

**Utilité** :  
Prédire le futur!

```
Backlog restant: 96 SP
Vélocité: 24 SP/sprint
────────────────────────
Sprints nécessaires: 96 ÷ 24 = 4 sprints
Durée: 4 × 2 semaines = 8 semaines
Date fin: 5 Fév + 8 semaines = 31 Mars ✅
```

---

### 📈 Burndown Chart

**Définition** :  
Graphique montrant les SP restants jour par jour.

```
SP
24 │●
   │ ╲
20 │  ╲
   │   ●
16 │    ╲
   │     ●
12 │      ╲
   │       ●
 8 │        ╲
   │         ●
 4 │          ╲
   │           ●
 0 │            ●────
   └──────────────────→ Jours
     1  3  5  7  9  10

Ligne idéale: ╲ (droite)
Ligne réelle: ● (peut varier)
```

**Interprétation** :
- 📉 **En dessous** de la ligne idéale → AVANCE (bien!)
- 📈 **Au dessus** → RETARD (attention!)
- 📊 **Plateau** → Bloqué (aide needed!)

---

### 🎯 Capacité par Sprint

**Calcul** :
```
Équipe: 3 développeurs
Jours travaillés: 10 jours (2 semaines)
Heures codage/jour: 6h (après meetings)

Théorique:
3 devs × 10 jours × 6h = 180h de code

Story Points:
3 devs × 8 SP = 24 SP baseline

Ajustements:
- Meetings: -2 SP
- Imprévus: -1 SP
- Buffer: -1 SP
─────────────────
Capacité réaliste: 20 SP/sprint
```

**Sécurité** : On planifie 20 SP, mais capacité max is 24 SP.  
→ Si urgence, on peut ajouter 4 SP, mais pas idéal.

---

## 11) DEFINITION OF DONE (DoD)

### ✅ Checklist Avant de Dire "Done"

Une tâche est **DONE** seulement si TOUTES ces conditions sont remplies:

#### 1. Code
```
✅ Feature implemented selon acceptance criteria
✅ TypeScript: 0 errors
✅ ESLint: 0 warnings
✅ Code formaté (Prettier)
✅ Pas de console.log() oubliés
✅ Pas de code commenté inutile
```

#### 2. Tests
```
✅ Tests unitaires écrits (min 80% coverage)
✅ Tests passent en local
✅ Tests passent en CI/CD
✅ Manual testing du happy path
✅ Manual testing des edge cases
```

#### 3. Code Review
```
✅ Pull Request créée
✅ Description claire du changement
✅ Screenshots si UI
✅ ≥1 reviewer assigned
✅ Review approuvée (✅ approval)
✅ Pas de "Request Changes" non résolus
```

#### 4. Documentation
```
✅ Commentaires code (fonctions complexes)
✅ README mis à jour (si besoin)
✅ API doc updated (si backend)
✅ Changelog entry (si release)
```

#### 5. Déploiement
```
✅ Branch merged to develop
✅ Déployé sur staging
✅ Smoke test sur staging OK
✅ Pas de regression
✅ Ready for production
```

#### 6. Qualité
```
✅ Responsive (mobile + desktop)
✅ Accessible (keyboard navigation)
✅ Performance OK (< 3s loading)
✅ No console errors/warnings
✅ No broken links
```

---

### 🚫 Pas Done = Pas Done!

**Faux "Done"** :
- ❌ "Je le mergerai demain" → NOT DONE
- ❌ "Les tests viendront après" → NOT DONE
- ❌ "Ça marche chez moi" (pas sur staging) → NOT DONE
- ❌ "Il manque juste un petit détail" → NOT DONE

**Vrai Done** :
- ✅ Merged + Deployed + Tested → DONE! 🎉

---

## 12) ROADMAP ET PLANNING

### 🗓️ Timeline Complète

```
AUJOURD'HUI
───────────
5 Février 2026

SPRINT 4 — Dashboard/Resources/Reservations
───────────────────────────────────────────
10 Fév → 24 Fév (2 semaines)
Features: Dashboard (8), Resources (8), Reservations (8)
Deliverable: 3 pages P0 complètes ✅

SPRINT 5 — Email + Calendar
────────────────────────────
24 Fév → 10 Mars (2 semaines)
Features: Email notifs (8), Calendar (10), Sys notifs (6)
Deliverable: Communication utilisateurs ✅

SPRINT 6 — Profile + Export
────────────────────────────
10 Mars → 24 Mars (2 semaines)
Features: User profile (5), Export (5), Tests E2E (6)
Deliverable: Features complètes + QA ✅

SPRINT 7 — Analytics + Release
───────────────────────────────
24 Mars → 31 Mars (1 semaine)
Features: Analytics (8), Bug fixes (3), Release prep (3)
Deliverable: v1.0 PRODUCTION 🚀

🎉 31 MARS 2026 : RELEASE v1.0
```

---

### 📊 Gantt Chart (Simplifié)

```
Février                      Mars
10  14  18  21  24  28  3   7  10  14  18  21  24  28  31
│───────────────│───────────────│───────────────│──────│
│   SPRINT 4    │   SPRINT 5    │   SPRINT 6    │ S7   │
│               │               │               │      │
│ Dashboard ████│               │               │      │
│ Resources ████│               │               │      │
│ Reservat  ████│               │               │      │
│               │ Email ████████│               │      │
│               │ Calendar ████ │               │      │
│               │ Notifs ██████ │               │      │
│               │               │ Profile ██████│      │
│               │               │ Export ███████│      │
│               │               │ Tests ████████│      │
│               │               │               │ Ana ██
│               │               │               │ Bug ██
│───────────────│───────────────│───────────────│──────│
                                                        🚀
                                                   RELEASE
```

---

### 🎯 Milestones

| Date | Milestone | Critères de Succès |
|------|-----------|-------------------|
| **24 Fév** | Sprint 4 Complete | Dashboard + Resources + Reservations déployés staging |
| **10 Mars** | Sprint 5 Complete | Emails fonctionnels + Calendar live |
| **24 Mars** | Sprint 6 Complete | Tous P0+P1 done + Tests passent |
| **31 Mars** | **v1.0 RELEASE** | Production deployment + 0 critical bugs |

---

### ✅ Release Checklist v1.0

**1 semaine avant (24 Mars)** :
- [ ] Tous P0+P1 features done
- [ ] Tests E2E passent
- [ ] Performance acceptable
- [ ] Security audit
- [ ] Staging stable

**3 jours avant (28 Mars)** :
- [ ] Release notes rédigées
- [ ] User documentation
- [ ] Backup database plan
- [ ] Rollback plan ready

**Jour J (31 Mars)** :
- [ ] Production deployment
- [ ] Smoke tests production
- [ ] Monitoring actif
- [ ] 🎉 CÉLÉBRATION!

---

## 📌 RÉSUMÉ ULTRA-CONDENSÉ

### En 10 Points

1. **Projet** : SportReserve (réservation ressources sportives)
2. **Équipe** : 3 devs (Backend Lead, Frontend Lead, Full-Stack/QA)
3. **Tech** : React + Node.js + MongoDB + Socket.IO
4. **Sprints** : 2 semaines, 20 SP de capacité réaliste
5. **Fait** : Auth + CRUD resources + Reservations + Kanban + Notifs temps réel (Sprints 1-3 = 72 SP)
6. **À Faire** : Dashboard + Email + Calendar + Profile + Export + Analytics (~96 SP restants)
7. **Backlog** : Trié P0 (critique) → P3 (peut attendre)
8. **Cérémonies** : Daily standup (10 min), Planning (2h), Review (1h), Retro (45 min)
9. **Kanban** : Backlog → Todo → In Dev → In Review → Done (WIP limits = 2 par dev)
10. **Release** : v1.0 le 31 Mars 2026 (dans 8 semaines, 4 sprints)

---

### En 1 Phrase

> *SportReserve est un projet Kanban géré en Scrum Agile par 3 développeurs en sprints de 2 semaines, avec 3 sprints déjà livrés (auth + CRUD + temps réel) et 4 sprints restants (dashboard + email + calendar + analytics) pour une release v1.0 le 31 Mars 2026.*

---

**📘 FIN DU GUIDE COMPLET**

**Document créé le** : 5 Février 2026  
**Prochaine mise à jour** : 24 Février 2026 (fin Sprint 4)  
**Version** : 1.0  
**Équipe** : Dev A, Dev B, Dev C  
**Contact** : [Votre email/Slack]

---

**🎯 ACTIONS IMMÉDIATES**

1. ✅ Lire tout ce document (1h)
2. ✅ Sprint 4 Planning lundi 10 Fév 9h
3. ✅ Créer les tickets GitHub pour Sprint 4
4. ✅ Setup daily standup 10h
5. ✅ Commencer Dashboard feature!

**Bonne chance pour Sprint 4! 🚀**
