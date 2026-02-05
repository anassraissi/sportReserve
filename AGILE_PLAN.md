# Agile Delivery Plan (Team of 3)

> Project: Flow Forge Kanban Board
> Date: 2026-02-05
> Cadence: 2-week sprints

---

## 1) Team Structure (3 Developers)

- **Developer A (Backend Lead)**
  - API, DB models, auth, server stability
- **Developer B (Frontend Lead)**
  - UI, React pages, state, API integration
- **Developer C (Full-Stack / QA)**
  - Cross-cutting features, tests, DevOps, bug triage

**Shared Responsibilities**
- Code reviews, pair-debugging, documentation updates, demo prep

---

## 2) Agile Ceremonies

- **Daily Standup**: 10–15 min
- **Sprint Planning**: 2 hours
- **Sprint Review**: 1 hour
- **Retrospective**: 45 min
- **Backlog Refinement**: 1 hour/week

---

## 3) Working Agreements

- Pull requests require 1 reviewer
- Definition of Done (DoD):
  - Feature implemented
  - Lint/type checks pass
  - Manual happy path verified
  - User-visible change documented
- WIP limit: 2 items per developer

---

## 4) Estimation & Velocity

- Estimation unit: **Story Points (SP)**
- Baseline capacity: **3 devs × 8 SP = 24 SP/sprint**
- Track velocity per sprint, update after each sprint

**Velocity Table**
| Sprint | Planned SP | Completed SP | Velocity |
|--------|------------|--------------|----------|
| Sprint 1 | 24 | 0 | 0 |
| Sprint 2 | 24 | 0 | 0 |

---

## 5) Completed Operations (Already Done)

**Backend**
- Server setup (Express + Socket.IO), MongoDB models
- Authentication (JWT, bcrypt, role-based access)
- Resources, reservations, notifications, projects, tasks APIs
- File upload system

**Frontend**
- Auth pages wired to backend
- API service layer in `src/lib/api.ts`
- Notifications system (real-time)
- Kanban UI with tasks/projects

**Recent Change**
- New accounts auto-approved (admin approval flow removed)

---

## 6) Current Product Backlog (Prioritized)

**P0 (Critical)**
1. Update pages to fully consume API (resources, reservations, dashboard)
2. Improve error boundaries and loading states

**P1 (High)**
3. Email notifications for key events
4. Calendar view for reservations
5. Advanced filters and search

**P2 (Medium)**
6. Analytics dashboard
7. Export functionality
8. User profile editing

**P3 (Low)**
9. Password reset flow
10. Performance optimizations (pagination, caching)

---

## 7) Sprint Plan (Next Two Sprints)

### Sprint 1 (2 weeks) — Target 24 SP
**Goal**: Stabilize core UX with API-backed pages and robust feedback

- Update Resource List page to use API (8 SP)
- Update Reservations page to use API (8 SP)
- Add standardized loading/error states to core pages (5 SP)
- Bug fixes + polishing (3 SP)

**Owners**
- Dev A: Resource API + server tweaks
- Dev B: Resource UI + hooks
- Dev C: Reservations page + testing

### Sprint 2 (2 weeks) — Target 24 SP
**Goal**: Add calendar + notifications; improve UX and stability

- Calendar view for reservations (10 SP)
- Email notifications for reservation status (8 SP)
- Dashboard API integration + KPIs (6 SP)

**Owners**
- Dev A: Email + backend endpoints
- Dev B: Calendar UI
- Dev C: Dashboard integration + QA

---

## 8) Definition of Done (DoD)

- Feature is merged to main
- UI tested in Chrome and Edge
- API contract updated if needed
- No critical console errors

---

## 9) Risk & Mitigation

- **Risk**: API/UI mismatch → **Mitigation**: Contract-first updates
- **Risk**: Velocity over-commit → **Mitigation**: Strict 24 SP cap
- **Risk**: Regression bugs → **Mitigation**: Add smoke tests and checklist

---

## 10) Sprint Tracking Template

**Sprint #:**
- Goal:
- Planned SP:
- Completed SP:
- Carryover:
- Notes:

---

## 11) Metrics

- Sprint velocity (SP)
- Cycle time per ticket
- Defect rate per sprint

---

## 12) Communication

- Use issues for backlog
- Use PRs for review
- Keep daily updates in team channel
