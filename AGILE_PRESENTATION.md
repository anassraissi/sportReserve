# Presentation Agile - SportReserve (Flow Forge Kanban Board)

## 1. Contexte du projet
- Plateforme moderne de reservation de ressources sportives.
- Frontend: Vite + React + TypeScript + Tailwind.
- Backend: Node.js + Express + MongoDB + Socket.IO.
- Objectif: MVP stable, pages principales connectees a l API, notifications, reservations, ressources.

## 2. Methode agile adoptee
- Cadence: sprints de 2 semaines.
- Framework: Scrum pour la gestion des sprints + Kanban pour le flux des taches.
- Outils: backlog, estimation en Story Points, Definition of Done, ceremonies reguliers.

## 3. Ceremonies
- Daily standup (10-15 min): avancees, blocages, priorites du jour.
- Sprint planning (2h): selection des stories, estimation, attribution.
- Refinement (1h/sem): clarifier et decouper les stories.
- Sprint review (1h): demo, feedback, metriques.
- Retrospective (45 min): ce qui a marche, ce qui doit changer.

## 4. Roles et repartition (3 developpeurs)
Organisation par modules: Auth, Reservations, Resources.
- Dev A (Auth/Backend): API, auth, modeles, stabilite serveur.
- Dev B (Resources/Frontend): UI ressources, integration API, UX.
- Dev C (Reservations/Full-Stack/QA): pages reservations, tests, qualite, release.

Responsabilites partagees:
- Code review (1 reviewer minimum), pair debugging, documentation, demo.

## 5. Artefacts agiles
- Product backlog priorise (P0 a P3).
- Sprint backlog (stories + sous-taches).
- Kanban board: BACKLOG -> TODO -> IN PROGRESS -> IN REVIEW -> DONE.
- Burndown chart et suivi de velocite.

## 6. Definition of Done (DoD)
- Feature mergee sur develop.
- TypeScript: 0 erreurs, ESLint: 0 warnings.
- Tests passes et validation manuelle du happy path.
- Aucun warning dans la console.
- Documentation mise a jour, API contract valide.

## 7. Operations deja faites (Sprints 1-3)
Backend:
- Serveur Express + Socket.IO, MongoDB, CORS, JWT.
- Modeles: User, Resource, Reservation, Notification, Project, Task.
- APIs: auth, resources, reservations, notifications, projects, tasks.
- Upload de fichiers (images/videos), detection de conflits de reservations.
- Auth et roles (user/manager/admin).

Frontend:
- Auth (login/register) connecte a l API.
- Context auth + routes protegees.
- Couche API centralisee (src/lib/api.ts).
- Notifications en temps reel + UI.
- Kanban UI pour projets et taches.

Changements recents:
- Ameliorations auth (statuts de compte) et documentation.
- Evolution vers auto-approval des comptes (suppression de validation admin).

## 8. Backlog priorise (P0 a P3)
P0 (Critique):
- Dashboard connecte a l API (KPIs, charts, loading).
- Resources page (listing, filtres, CRUD, upload).
- Reservations page (listing, status, CRUD, Socket.IO).

P1 (High):
- Email notifications.
- Calendar view des reservations.
- System notifications (qualite et UX).

P2 (Medium):
- Profile utilisateur + settings.
- Recherche avancee + filtres.
- Export CSV/PDF.

P3 (Low):
- Analytics dashboard.
- Reset password.
- Optimisations performance (pagination, caching).

## 9. Sprint 4 (10-24 fev 2026) - objectif P0
Objectif: livrer 3 pages critiques.
- Dashboard (8 SP): endpoint metrics, UI, loading, errors.
- Resources (6 SP): liste + filtres + forms CRUD + upload.
- Reservations (6 SP): liste + statuts + forms + sync temps reel.

Assignations:
- Dev A: endpoints metrics + ajustements API.
- Dev B: UI dashboard/resources + integration API.
- Dev C: reservations + tests + gestion des erreurs.

## 10. Sprints suivants (plan)
Sprint 5 (P1):
- Email notifications (A), Calendar view (B), System notifications (C).

Sprint 6 (P2):
- Profile utilisateur, filtres avances, export.

Sprint 7+ (P3):
- Analytics, reset password, performance.

## 11. Probleme et risques rencontres
- R1: mismatch API / UI -> mitigations: alignement quotidien, contract-first.
- R2: lenteurs DB -> mitigations: index, pagination.
- R3: upload images instable -> mitigations: tests precoces.
- R4: timezones reservations -> mitigations: clarifier regles, tests edge cases.

## 12. Suivi et metriques
- Velocite par sprint (SP planifies vs completes).
- Cycle time par ticket.
- Defect rate par sprint.

## 13. Conclusion
- La methode agile structure le travail et garantit la visibilite.
- Les livrables sont decoupes par sprints avec des objectifs clairs.
- La suite: stabiliser les pages P0 puis enrichir les features P1/P2.
