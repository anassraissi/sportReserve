# 📋 AGILE GUIDE COMPLET — Flow Forge Kanban Board
## Pour 3 Développeurs – Sprint de 2 semaines

> **Projet** : Flow Forge Kanban Board (SportReserve)  
> **Date** : 2026-02-05  
> **Équipe** : 3 développeurs  
> **Durée des sprints** : 2 semaines  
> **Méthodologie** : Scrum Agile

---

## 📊 TABLE DES MATIÈRES
1. [Rôles & Équipe](#-rôles--équipe)
2. [Tech Stack](#-tech-stack)
3. [Opérations Réalisées ✅](#-opérations-réalisées-)
4. [Opérations À FAIRE 📝](#-opérations-à-faire-)
5. [Comment Organiser les Tâches](#-comment-organiser-les-tâches)
6. [Cérémonies Agile & Calendrier](#-cérémonies-agile--calendrier)
7. [Definition of Done (DoD)](#-definition-of-done-dod)
8. [Estimation & Vélocité](#-estimation--vélocité)
9. [Board Kanban & Statuts](#-board-kanban--statuts)
10. [Timeline & Roadmap](#-timeline--roadmap)

---

## 👥 RÔLES & ÉQUIPE

### Structure des 3 Développeurs

| Rôle | Responsable | Focus |
|------|-------------|-------|
| **Dev A (Backend Lead)** | API, DB, Auth, Stabilité | Serveur Express, MongoDB, Socket.IO, Auth JWT, Uploads |
| **Dev B (Frontend Lead)** | UI/UX, React, État | Pages React, Intégration API, Notifications, Kanban UI |
| **Dev C (Full-Stack/QA)** | Features Transverses, Tests | Détection bugs, Tests E2E, DevOps, Release, Documentation |

### Responsabilités Partagées
- ✅ **Code Reviews** (1 reviewer minimum)
- ✅ **Pair Debugging** (débogages complexes)
- ✅ **Documentation** (mise à jour régulière)
- ✅ **Demo Prep** (préparation démo pour Sprint Review)

---

## 🛠️ TECH STACK

### Frontend
- **Framework** : React 18+ (TypeScript)
- **Build** : Vite
- **Styling** : Tailwind CSS
- **State** : Context API + Custom Hooks
- **HTTP** : Axios (via `src/lib/api.ts`)
- **Real-time** : Socket.IO Client

### Backend
- **Runtime** : Node.js
- **Framework** : Express.js
- **Database** : MongoDB (Mongoose ODM)
- **Auth** : JWT + bcrypt + Google OAuth
- **Real-time** : Socket.IO Server
- **File Storage** : Local uploads (`server/uploads/`)

### DevOps & Qualité
- **Linting** : ESLint
- **Type Checking** : TypeScript
- **Testing** : (À configurer) Jest/Vitest
- **Version Control** : Git + GitHub

---

## ✅ OPÉRATIONS RÉALISÉES

### Sprint 1 ✅
- [x] Fondations backend (Express + Socket.IO)
- [x] Modèles MongoDB (User, Resource, Reservation, Project, Task)
- [x] Authentification JWT + rôles d'accès
- [x] Pages Login/Register connectées
- [x] Connexion Google OAuth

### Sprint 2 ✅
- [x] CRUD Ressources (Create, Read, Update, Delete)
- [x] CRUD Réservations
- [x] Système d'upload fichiers
- [x] Notifications temps réel (Socket.IO)
- [x] UI Notifications

### Sprint 3 ✅
- [x] Projets & Tâches
- [x] UI Kanban avec colonnes (Todo, In Progress, Review, Done)
- [x] Intégration API principale
- [x] Déplacement tâches entre colonnes
- [x] Comptes auto-approuvés

### Backend Actuel ✅
```
✅ Serveur Express fonctionnel
✅ Socket.IO pour temps réel
✅ MongoDB/Mongoose configuré
✅ Auth JWT + Rôles (user, admin, manager)
✅ Middleware de validation
✅ APIs CRUD:
   - /api/auth (register, login, approve)
   - /api/resources (get, create, update, delete)
   - /api/reservations (get, create, update, delete)
   - /api/projects (get, create, update, delete)
   - /api/tasks (get, create, update, delete)
   - /api/notifications (get, create, delete)
   - /api/reviews (get, create, update, delete)
✅ Upload files & avatars
✅ Audit logging
```

### Frontend Actuel ✅
```
✅ App layout & routing
✅ Auth pages (Login/Register)
✅ Kanban page avec UI fonctionnelle
✅ Service API centralisé (src/lib/api.ts)
✅ Context Auth (AuthContext.tsx)
✅ Notifications UI temps réel
✅ Composants UI (shadcn/ui)
✅ Protected Routes
```

---

## 📝 OPÉRATIONS À FAIRE

### Priorité P0 (CRITIQUE) — Sprint 4

#### 1. **Dashboard Complet** (8 SP)
- [ ] Intégration API complète
- [ ] Affichage KPIs (réservations, ressources, utilisateurs)
- [ ] Graphiques & statistiques
- [ ] États loading/error
- [ ] Refresh automatique

**Assigné** : Dev B (Frontend)  
**Task** : `FEATURE-dashboard-kpis`

#### 2. **Resources Page** (6 SP)
- [ ] Listing ressources avec API
- [ ] Filtrage & recherche
- [ ] Création/édition/suppression
- [ ] Upload images
- [ ] React loading states

**Assigné** : Dev B (Frontend)  
**Task** : `FEATURE-resources-page`

#### 3. **Reservations Page** (6 SP)
- [ ] Listing réservations avec API
- [ ] Filtrage par ressource/date/statut
- [ ] Création/édition/suppression
- [ ] États loading/error
- [ ] Synchronisation temps réel (Socket.IO)

**Assigné** : Dev B (Frontend)  
**Task** : `FEATURE-reservations-page`

### Priorité P1 (HAUT) — Sprint 5

#### 4. **Notifications Email** (8 SP)
- [ ] Service email (Nodemailer/SendGrid)
- [ ] Templates HTML
- [ ] Events d'envoi (réservation, approbation, etc.)
- [ ] Logs d'envoi
- [ ] Retry logic

**Assigné** : Dev A (Backend)  
**Task** : `FEATURE-email-notifications`

#### 5. **Calendrier Réservations** (8 SP)
- [ ] Composant calendrier React
- [ ] Intégration API
- [ ] Vue jour/semaine/mois
- [ ] Drag-drop réservations
- [ ] Affichage disponibilités

**Assigné** : Dev B (Frontend)  
**Task** : `FEATURE-calendar-view`

#### 6. **Notifications Système Complètes** (6 SP)
- [ ] Couverture toutes les actions
- [ ] UI toast + bell notifications
- [ ] Marquage as read/unread
- [ ] Archivage
- [ ] Préférences notifications

**Assigné** : Dev C (Full-Stack/QA)  
**Task** : `FEATURE-system-notifications`

### Priorité P2 (MOYEN) — Sprint 6

#### 7. **Profil Utilisateur** (5 SP)
- [ ] Page profil
- [ ] Édition infos (avatar, bio, etc.)
- [ ] Historique réservations
- [ ] Préférences utilisateur
- [ ] Suppression compte

**Assigné** : Dev B (Frontend)  
**Task** : `FEATURE-user-profile`

#### 8. **Recherche & Filtres Avancés** (6 SP)
- [ ] Recherche texte
- [ ] Filtres multi-critères
- [ ] Historique recherches
- [ ] Suggestions
- [ ] Sauvegarde filtres

**Assigné** : Dev A (Backend) + Dev B (Frontend)  
**Task** : `FEATURE-advanced-search`

#### 9. **Export (CSV/PDF)** (5 SP)
- [ ] Export réservations (PDF/CSV)
- [ ] Export ressources (PDF/CSV)
- [ ] Export rapports
- [ ] Formatage & design
- [ ] Téléchargement direct

**Assigné** : Dev C (Full-Stack)  
**Task** : `FEATURE-export`

### Priorité P3 (BAS) — Sprint 7+

#### 10. **Analytics & Dashboards** (8 SP)
- [ ] Métriques utilisation
- [ ] Graphiques revenues/occupancy
- [ ] Rapports périodiques
- [ ] ROI calculs
- [ ] Prédictions

**Assigné** : Dev A (Backend) + Dev B (Frontend)  
**Task** : `FEATURE-analytics`

#### 11. **Password Reset** (4 SP)
- [ ] Endpoint reset
- [ ] Email avec token
- [ ] Page de reset
- [ ] Validation & sécurité

**Assigné** : Dev A (Backend)  
**Task** : `FEATURE-password-reset`

#### 12. **Performance & Optimisations** (6 SP)
- [ ] Pagination
- [ ] Caching
- [ ] Lazy loading images
- [ ] Code splitting
- [ ] Bundle analysis

**Assigné** : Dev C (Full-Stack/QA)  
**Task** : `CHORE-performance`

---

## 🎯 COMMENT ORGANISER LES TÂCHES

### 1. **Matrice de Priorités**

```
┌──────────────────┬──────────┬──────────┐
│ IMPACT           │ EFFORT   │ PRIORITÉ │
├──────────────────┼──────────┼──────────┤
│ Dashboard        │ Haut     │ P0       │
│ Resources        │ Moyen    │ P0       │
│ Reservations     │ Moyen    │ P0       │
│ Email Notifs     │ Haut     │ P1       │
│ Calendar         │ Haut     │ P1       │
│ Sys Notifications│ Moyen    │ P1       │
│ User Profile     │ Moyen    │ P2       │
│ Export           │ Moyen    │ P2       │
└──────────────────┴──────────┴──────────┘
```

### 2. **Structure des Issues GitHub**

```markdown
# Feature: [Nom Feature]

**Type** : Feature / Bug / Chore  
**Priority** : P0 / P1 / P2 / P3  
**Story Points** : 5 / 8 / 13  
**Sprint** : Sprint 4  
**Assignee** : Dev A / Dev B / Dev C  

## 📋 Description
[Contexte et objectif]

## ✅ Acceptance Criteria
- [ ] Critère 1
- [ ] Critère 2
- [ ] Critère 3

## 📌 Sub-tasks
- [ ] Task 1 (Backend)
- [ ] Task 2 (Frontend)
- [ ] Task 3 (Testing)

## 🔗 Related
- Blocks #123
- Depends on #456
```

### 3. **Cycle de Vie d'une Tâche**

```
┌─────────┐     ┌──────────┐     ┌────────┐     ┌──────┐     ┌──────┐
│ BACKLOG │ --> │ TODO     │ --> │ IN DEV │ --> │ REVIEW │ --> │ DONE │
└─────────┘     └──────────┘     └────────┘     └──────┘     └──────┘
                   (Sprint)      (Dev A/B/C)    (Dev C/Lead)   (✅ Déployé)
```

### 4. **Affectation par Compétence**

| Task Type | Dev A | Dev B | Dev C |
|-----------|-------|-------|-------|
| API/DB | ✅ Lead | Support | Support |
| Frontend/UI | Support | ✅ Lead | Support |
| Testing/QA | Support | Support | ✅ Lead |
| DevOps | Support | - | ✅ Lead |
| Full-Stack | Support | Support | ✅ Lead |

---

## 📅 CÉRÉMONIES AGILE & CALENDRIER

### 1. **Daily Standup** ⏰
- **Quand** : 10h00 (chaque jour de travail)
- **Durée** : 10-15 min
- **Où** : Teams/Zoom/In-person

**Format (chacun)**:
```
✅ Hier : J'ai fait X, Y
🔄 Aujourd'hui : Je fais A, B
🚧 Blocages : Aucun / [Problème]
```

### 2. **Sprint Planning** 📊
- **Quand** : Lundi 9h00 (début du sprint)
- **Durée** : 2h
- **Participants** : Toute l'équipe

**Ordre du jour**:
```
0. Rétrospective rapide (si suite sprint)
1. Revue objectif = objectif sprint  
2. Selection user stories (priorités P0/P1)
3. Estimation (Planning Poker)
4. Engagement équipe
5. Répartition par dev (qui fait quoi)
```

### 3. **Daily Refinement** 🔍
- **Quand** : Mercredi/Jeudi 15h00
- **Durée** : 1h
- **Participants** : Toute l'équipe

**Ordre du jour**:
```
1. Revue des stories prioritaires
2. Questions/clarifications
3. Estimation préliminaire
4. Identification dépendances
5. Préparation pour prochain sprint
```

### 4. **Sprint Review** 🎬
- **Quand** : Vendredi 15h00 (fin sprint)
- **Durée** : 1h
- **Participants** : Équipe + Stakeholders (si possible)

**Format**:
```
✅ Démo features
📊 Métriques (SP réalisés vs prévu)
🚀 Release notes draft
💬 Feedback
🔄 Adapté workflow
```

### 5. **Sprint Retrospective** 💭
- **Quand** : Vendredi 16h00 (après Sprint Review)
- **Durée** : 45 min
- **Participants** : Équipe uniquement

**Format (ROTI)**:
```
👍 Qu'est-ce qui a bien marché ?
👎 Qu'est-ce qui a mal marché ?
🎯 Qu'est-ce qu'on peut améliorer ?
✅ Action items pour prochain sprint
```

### Sprint Calendar (Exemple)

```
SEMAINE 1
─────────
Lundi 09:00  - Sprint Planning (2h)
Lundi 10:15  - Daily Standup (15 min)
Mar-Jeu 10:00 - Daily Standup (15 min x3)
Mercredi 15:00 - Refinement (1h)
Vendredi 10:00 - Daily Standup (15 min)

SEMAINE 2
─────────
Lundi-Jeu 10:00 - Daily Standup (15 min x4)
Jeudi 15:00 - Refinement (1h)
Vendredi 15:00 - Sprint Review (1h)
Vendredi 16:00 - Retrospective (45 min)
```

---

## ✨ DEFINITION OF DONE (DoD)

### Pour chaque Tâche

- [ ] **Codé** : Code implémenté et compilé (0 erreurs TypeScript)
- [ ] **Linting** : ESLint sans erreurs/warnings
- [ ] **Tests** : Tests unitaires rédigés (min 80% coverage)
- [ ] **Revue Code** : ≥1 review approuvée
- [ ] **Testé** : Parcours nominal testé manuellement
- [ ] **Logs** : 0 erreurs/warnings console
- [ ] **Documenté** : Commentaires code + README mis à jour
- [ ] **Déployable** : Prêt pour staging/production

### Pour une Feature

- [ ] Toutes les sub-tasks terminées
- [ ] Pas de tech debt critical
- [ ] Works on dev/staging env
- [ ] Préparé pour démo

---

## 📊 ESTIMATION & VÉLOCITÉ

### Système de Points

| Points | Complexité | Exemple |
|--------|-----------|---------|
| 1-2 | Trivial | Typo fix, config |
| 3 | Facile | Simple UI component |
| 5 | Moyen | CRUD simple + API |
| 8 | Complexe | Feature avec dépendances |
| 13 | Très complexe | Feature majeure multi-layer |

### Capacité par Sprint

```
Équipe    : 3 devs
Jours    : 10 jours (2 semaines)
Charges  : ~6-7h codage/jour par dev
Capacity : 3 devs × 8 SP = 24 SP/sprint (baseline)

Facteur d'ajustement:
+ Ceremonies: -2 SP
+ Réunions: -1 SP
+ Buffer: -2 SP
───────────────
= ~19 SP réaliste par sprint
```

### Tableau de Suivi

| Sprint | Date | Planifié | Réalisé | Vélocité | Notes |
|--------|------|----------|---------|----------|-------|
| S1 | -Feb | 24 | 24 | 24 | Fondations |
| S2 | -Feb | 24 | 24 | 24 | Normal |
| S3 | -Feb | 24 | 24 | 24 | Normal |
| S4 | Feb 10-24 | 20 | ? | ? | Dashboard focus |
| S5 | Feb 24-Mar10 | 19 | ? | ? | Email + Calendar |

---

## 🎨 BOARD KANBAN & STATUTS

### Colonnes du Board

```
[BACKLOG] --> [TODO] --> [IN DEV] --> [IN REVIEW] --> [DONE]
  (51)         (20)       (5)          (3)            (70+)
```

### Lifecycle Tâche

```
1. BACKLOG     : Issue créée, pas en sprint
2. TODO        : Story sélectionnée en sprint planning
3. IN DEV      : Dev commence coding + push branch
4. IN REVIEW   : PR créée, await review
5. DONE        : PR merged + déployé
```

### Statuts API Backend

```
POST   /api/tasks/move  : Déplacer tâche entre colonnes
GET    /api/tasks       : Lister tâches filtrées par statut
PATCH  /api/tasks/:id   : Mettre à jour statut/assignee/priority
```

### WIP Limits (limite travail simultané)

```
Dev A: Max 2 tasks IN DEV
Dev B: Max 2 tasks IN DEV
Dev C: Max 3 tasks IN DEV (support)
```

---

## 🚀 TIMELINE & ROADMAP

### Sprint 4 (10-24 Février) — P0 Completion
```
Objectif: Terminer toutes fonctionnalités critiques P0

Dev A : Email notifications foundation
Dev B : Dashboard + Resources page
Dev C : Testing P0 features, preparing analytics

Deliverable: Dashboard + Resources + Reservations pages
```

### Sprint 5 (24 Février - 10 Mars) — P1 Features
```
Objectif: Ajouter email notifications + calendar

Dev A : Email notifications complètes
Dev B : Calendar view + advanced filters
Dev C : Notifications système, testing

Deliverable: Full email system + Calendar UI
```

### Sprint 6 (10-24 Mars) — P2 Polish
```
Objectif: User profile + Export + Performance

Dev A : Password reset + user endpoints
Dev B : User profile page + Export UI
Dev C : Performance optimization, monitoring

Deliverable: Complete user management + Export
```

### Sprint 7 (24-31 Mars) — Analytics & Release
```
Objectif: Analytics + Final release prep

Dev A : Analytics API endpoints
Dev B : Analytics dashboards
Dev C : E2E testing, release candidate

Deliverable: v1.0 Release Candidate
```

---

## 📈 MÉTRIQUES DE SUIVI

### Par Sprint

- **Vélocité** : SP réalisés vs planifiés
- **Burn-down** : Charge restante jour par jour
- **Cycle time** : Jours moyenne de Todo à Done
- **Lead time** : Jours moyenne de Backlog à Done
- **Défects** : Bugs trouvés vs résolus

### Par Dev

- **Productivity** : SP/semaine per dev
- **Code review time** : Moyenne temps review
- **Bugs créés** : Issues ouvertes par dev
- **Attendance** : Standup/refinement participation

### Projet Global

- **Release date** : v1.0 = 31 Mars
- **Feature completion** : % des P0/P1/P2
- **Quality** : Bugs en production = 0
- **Customer satisfaction** : User feedback

---

## 🛠️ PROCESS GIT & CODE REVIEW

### Git Workflow

```bash
# 1. Créer branch depuis develop
git checkout -b feature/TASKS-001-dashboard

# 2. Commit réguliers
git commit -m "feat: add dashboard header component"

# 3. Push et créer PR
git push origin feature/TASKS-001-dashboard

# 4. PR review (min 1 approval)
# - Code review via GitHub/GitLab
# - Feedback → Updates
# - Approval

# 5. Merge to develop
# - Merge PR
# - Delete branch

# 6. Deploy to staging
# - Auto-deploy via CI/CD
# - QA testing
```

### PR Template

```markdown
## What does this PR do?
[Description courte]

## Which issue does this PR resolve?
Closes #123

## How should this be tested?
[Steps]

## Checklist
- [ ] Tests written/updated
- [ ] Linting passed
- [ ] No console errors
- [ ] Documentation updated
```

---

## 📞 COMMUNICATION

### Channels Recommandés

| Type | Channel | Fréquence |
|------|---------|-----------|
| Daily standup | Teams/Zoom | Quotidien |
| Urgent issue | Slack/Teams | ASAP |
| PR discussions | GitHub | Continu |
| Release notes | Email | Fin sprint |
| Strategic | 1:1 meetings | Bi-weekly |

---

## ✅ CHECKLIST DÉMARRAGE

- [ ] Sprint 4 planning réalisé
- [ ] Tasks assignées par dev
- [ ] Jira/GitHub board setup
- [ ] Locals dev setup OK
- [ ] Daily standup scheduled
- [ ] Slack channels configurés
- [ ] Git workflow expliqué
- [ ] First PR review completed

---

**Last Updated**: 2026-02-05  
**Next Review**: 2026-02-24 (fin Sprint 4)  
**Version**: 1.0 Agile Complete
