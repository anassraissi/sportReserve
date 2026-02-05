# Plan Agile complet — SportReserve (Kanban)

> Projet : SportReserve
> Date : 2026-02-05
> Équipe : 3 développeurs
> Durée d’un sprint : 2 semaines

---

## 1) Langages & Stack technique (utilisés)
- **Frontend** : React, TypeScript, Vite, Tailwind CSS
- **Backend** : Node.js, Express
- **Base de données** : MongoDB (Mongoose)
- **Auth** : JWT, bcrypt, Google OAuth
- **Temps réel** : Socket.IO
- **Outillage** : ESLint, PostCSS

---

## 2) Rôles de l’équipe (3 développeurs)
- **Dev A (Lead Backend)** : API, modèles DB, auth, stabilité serveur
- **Dev B (Lead Frontend)** : UI/UX, pages React, intégration API
- **Dev C (Full‑Stack/QA)** : features transverses, tests, corrections, préparation release

---

## 3) Ce qui est FAIT (réellement livré)

### Sprints réalisés ✅
- **Sprint 1** : fondations backend + modèles + auth + pages login/register
- **Sprint 2** : CRUD ressources/réservations + uploads + notifications temps réel
- **Sprint 3** : projets/tâches + UI Kanban + intégration API principale

### Opérations Kanban déjà faites ✅
- Colonnes (todo, inprogress, review, done)
- Création/édition/suppression de tâches
- Déplacement des tâches entre colonnes
- Synchronisation état des tâches ↔ API

### Backend ✅
- Serveur Express + Socket.IO
- Modèles MongoDB (users, resources, reservations, notifications, projects, tasks)
- Auth JWT + rôles
- Système d’upload de fichiers
- APIs CRUD principales (resources, reservations, notifications, projects, tasks)

### Frontend ✅
- Login/Register connectés au backend
- Service API dans src/lib/api.ts
- Notifications temps réel (UI + socket)
- Kanban UI (projects + tasks)

### Changement récent ✅
- Comptes auto‑approuvés (approbation admin supprimée)

---

## 4) Ce qui est À FAIRE (besoin réel)

### Fonctionnel (priorités)
- **Notifications email** (non implémentées)
- **Notifications système** : couverture complète sur toutes les actions
- **Dashboard, Resources, Reservations** : intégration API complète + états loading/error
- **Vue calendrier** pour les réservations
- **Analytics / KPIs**
- **Export** (CSV/PDF)

### Qualité
- Tests smoke E2E sur les flows critiques
- Harmonisation UX (messages, loaders, empty states)

---

## 5) Méthode Agile

### Cérémonies
- Daily standup (10–15 min)
- Sprint planning (2 h)
- Sprint review (1 h)
- Rétrospective (45 min)
- Refinement (1 h/semaine)

### Definition of Done (DoD)
- Feature implémentée et revue
- Lint/type checks OK
- Parcours nominal vérifié
- Aucun blocage UI/logs serveur

---

## 6) Estimation & Vélocité

### Estimation
- Unité : **Story Points (SP)**
- Capacité : **3 devs × 8 SP = 24 SP / sprint**

### Tableau de vélocité
| Sprint | SP planifiés | SP terminés | Vélocité |
|--------|-------------|-------------|----------|
| Sprint 1 | 24 | 24 | 24 |
| Sprint 2 | 24 | 24 | 24 |
| Sprint 3 | 24 | 24 | 24 |
| Sprint 4 | 24 | 0 | 0 |

---

## 7) Backlog détaillé (estimation)

### P0 — Critique
1. Intégration API complète pages Resources (8 SP)
2. Intégration API complète pages Reservations (8 SP)
3. États loading/error globaux (5 SP)
4. Fix bugs + polish (3 SP)

### P1 — Élevé
5. Notifications email (backend + templates) (8 SP)
6. Couverture notifications système (6 SP)
7. Vue calendrier (10 SP)

### P2 — Moyen
8. Dashboard KPIs (6 SP)
9. Export CSV/PDF (6 SP)
10. Tests smoke E2E (6 SP)

---

## 8) Plan de sprint (prochaines itérations)

### Sprint 4 (24 SP) — Stabiliser le cœur UX
- Resources API (8)
- Reservations API (8)
- Loading/Error states (5)
- Bug fixes + polish (3)

### Sprint 5 (24 SP) — Notifications + Calendrier
- Notifications email (8)
- Notifications système (6)
- Vue calendrier (10)

### Sprint 6 (24 SP) — Analytics + Export + Tests
- Dashboard KPIs (6)
- Export CSV/PDF (6)
- Tests smoke E2E (6)
- Buffer correctif (6)

---

## 9) Kanban détaillé (table par sprint)

### Sprint 4 — Kanban
| À faire | En cours | Revue | Terminé |
|------|-------------|--------|------|
| Resources API intégration (8) |  |  |  |
| Reservations API intégration (8) |  |  |  |
| Loading/Error states (5) |  |  |  |
| Bug fixes + polish (3) |  |  |  |

### Sprint 5 — Kanban
| À faire | En cours | Revue | Terminé |
|------|-------------|--------|------|
| Notifications email (8) |  |  |  |
| Notifications système (6) |  |  |  |
| Vue calendrier (10) |  |  |  |

### Sprint 6 — Kanban
| À faire | En cours | Revue | Terminé |
|------|-------------|--------|------|
| Dashboard KPIs (6) |  |  |  |
| Export CSV/PDF (6) |  |  |  |
| Tests smoke E2E (6) |  |  |  |
| Buffer correctif (6) |  |  |  |

---

## 10) Répartition (3 développeurs)

### Sprint 4
- **Dev A** : Resources API + backend ajustements
- **Dev B** : UI Resources + hooks
- **Dev C** : UI Reservations + tests

### Sprint 5
- **Dev A** : Notifications email (backend)
- **Dev B** : UI calendrier
- **Dev C** : Notifications système + QA

### Sprint 6
- **Dev A** : Dashboard KPIs (backend)
- **Dev B** : UI KPIs + export
- **Dev C** : Tests smoke + QA

---

## 11) Risques & Mitigation
- Désalignement API/UI → updates contract‑first
- Sur‑engagement → cap à 24 SP
- Régressions → smoke tests + checklist
