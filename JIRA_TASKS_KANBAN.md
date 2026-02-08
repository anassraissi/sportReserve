# JIRA - Kanban Board & Task Organization
## SportReserve Project (Flow Forge Kanban Board)

---

## 📊 EPIC STRUCTURE

### Epic-1: AUTHENTICATION & USER MANAGEMENT (P0)
**Status**: COMPLETED (Sprint 1-3)
**Total SP**: 21 SP
- Story-1: User Registration System (5 SP) ✅
- Story-2: User Login System (5 SP) ✅
- Story-3: Password Management (5 SP) ✅
- Story-4: Role-Based Authorization (6 SP) ✅

### Epic-2: CORE FEATURES - P0 CRITICAL (In Progress)
**Status**: IN PROGRESS (Sprint 4)
**Total SP**: 20 SP
- Story-5: Dashboard (8 SP) 🔄
- Story-6: Resources Management (6 SP) 🔄
- Story-7: Reservations Management (6 SP) 🔄

### Epic-3: NOTIFICATIONS & COMMUNICATION (P1)
**Status**: BACKLOG (Sprint 5)
**Total SP**: 14 SP
- Story-8: Email Notifications (8 SP)
- Story-9: System Notifications Enhancement (6 SP)

### Epic-4: CALENDAR & ADVANCED FEATURES (P1)
**Status**: BACKLOG (Sprint 5)
**Total SP**: 8 SP
- Story-10: Calendar View (8 SP)

### Epic-5: USER EXPERIENCE & PROFILE (P2)
**Status**: BACKLOG (Sprint 6)
**Total SP**: 16 SP
- Story-11: User Profile & Settings (5 SP)
- Story-12: Advanced Search & Filters (6 SP)
- Story-13: Export Functionality (5 SP)

### Epic-6: ANALYTICS & PERFORMANCE (P3)
**Status**: BACKLOG (Sprint 7+)
**Total SP**: 14 SP
- Story-14: Analytics Dashboard (8 SP)
- Story-15: Password Reset Flow (4 SP)
- Story-16: Performance Optimization (6 SP)

---

## 🎯 SPRINT 4 - DETAILED TASK BREAKDOWN

### Story-5: Dashboard (8 SP)
**Priority**: P0  
**Assignee**: Dev B (Frontend Lead)  
**Status**: NOT STARTED  
**Sprint**: Sprint 4  

#### Acceptance Criteria:
- [ ] Dashboard displays KPIs (total reservations, total resources, active users, revenue)
- [ ] Chart visualization working (line chart for reservations, bar chart for categories)
- [ ] Loading state displayed while fetching data
- [ ] Error state with retry button if API fails
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Zero console errors/warnings
- [ ] Refresh button works

#### Sub-tasks:

**Sub-5.1: Create Dashboard Metrics API Endpoint**
- **Dev**: Dev A (Backend)
- **SP**: 2
- **Status**: NOT STARTED
- **Details**:
  - [ ] Create GET `/api/dashboard/metrics` endpoint
  - [ ] Calculate total reservations count
  - [ ] Calculate total resources count
  - [ ] Calculate active users count
  - [ ] Calculate total revenue
  - [ ] Add response caching (5 min TTL)
  - [ ] Test with Postman
- **Definition of Done**:
  - Endpoint returns correct JSON
  - Includes timestamp
  - Handles no data gracefully
  - Performance < 500ms

**Sub-5.2: Design Dashboard Layout & Components**
- **Dev**: Dev B (Frontend)
- **SP**: 3
- **Status**: NOT STARTED
- **Details**:
  - [ ] Create DashboardPage component structure
  - [ ] Build KPI card components (4 cards)
  - [ ] Create chart container components
  - [ ] Style with Tailwind + shadcn/ui
  - [ ] Responsive grid layout (1 col mobile, 2 col tablet, 4 col desktop)
  - [ ] Light/dark mode support
- **Definition of Done**:
  - No hardcoded data
  - Components exist and render
  - Styling polished
  - No console errors

**Sub-5.3: Bind Data & Loading States**
- **Dev**: Dev B (Frontend)
- **SP**: 2
- **Status**: NOT STARTED
- **Details**:
  - [ ] Fetch data from `/api/dashboard/metrics`
  - [ ] Display data in KPI cards
  - [ ] Show loading skeleton while fetching
  - [ ] Update charts with real data
  - [ ] Add refresh interval (auto-update every 30s)
  - [ ] Test with network throttling
- **Definition of Done**:
  - Data flows from API to UI
  - Loading states show/hide correctly
  - No state management bugs

**Sub-5.4: Error Handling & Edge Cases**
- **Dev**: Dev B (Frontend)
- **SP**: 1
- **Status**: NOT STARTED
- **Details**:
  - [ ] Handle API failures gracefully
  - [ ] Display error toast notification
  - [ ] Show retry button
  - [ ] Handle empty data (0 reservations, etc.)
  - [ ] Test offline scenario
- **Definition of Done**:
  - All error paths tested
  - User-friendly error messages
  - No broken UI states

---

### Story-6: Resources Management Page (6 SP)
**Priority**: P0  
**Assignee**: Dev B (Frontend Lead)  
**Status**: NOT STARTED  
**Sprint**: Sprint 4  

#### Acceptance Criteria:
- [ ] List all resources with API data
- [ ] Filter by category/type
- [ ] Search by name/description
- [ ] Add new resource form
- [ ] Edit existing resource
- [ ] Delete resource with confirmation
- [ ] Image upload and preview
- [ ] Loading & error states
- [ ] Responsive design
- [ ] No console errors

#### Sub-tasks:

**Sub-6.1: Resources Listing Component**
- **Dev**: Dev B
- **SP**: 2
- **Status**: NOT STARTED
- **Details**:
  - [ ] Create ResourcesPage component
  - [ ] Fetch from GET `/api/resources`
  - [ ] Display in grid/table layout
  - [ ] Show image thumbnail
  - [ ] Show name, type, capacity, price
  - [ ] Add pagination (10 items per page)
  - [ ] Responsive cards layout
- **Definition of Done**:
  - Data displays correctly
  - Pagination working
  - No styling issues
  - Mobile responsive

**Sub-6.2: Filter & Search UI**
- **Dev**: Dev B
- **SP**: 2
- **Status**: NOT STARTED
- **Details**:
  - [ ] Add category filter dropdown
  - [ ] Add search input field
  - [ ] Add price range filter
  - [ ] Apply filters without page reload
  - [ ] Show "No results" state
  - [ ] Clear filters button
- **Definition of Done**:
  - Filters work correctly
  - UI clean and intuitive
  - No duplicate requests

**Sub-6.3: Create/Edit/Delete Forms**
- **Dev**: Dev B
- **SP**: 1
- **Status**: NOT STARTED
- **Details**:
  - [ ] Create modal for new resource
  - [ ] Form fields: name, type, capacity, price, description
  - [ ] Image upload field (drag & drop + click)
  - [ ] Edit modal for existing resources
  - [ ] Delete confirmation dialog
  - [ ] Submit handling & validation
- **Definition of Done**:
  - Forms validate input
  - API calls successful
  - Success/error toasts show
  - Modal closes on success

**Sub-6.4: Image Upload & Error Handling**
- **Dev**: Dev C (QA/Full-Stack)
- **SP**: 1
- **Status**: NOT STARTED
- **Details**:
  - [ ] Handle image file upload
  - [ ] Show preview before upload
  - [ ] File size validation (< 5MB)
  - [ ] Loading indicator during upload
  - [ ] Error handling for failed uploads
  - [ ] Test with various image formats
- **Definition of Done**:
  - Upload works end-to-end
  - Error cases handled
  - No console errors

---

### Story-7: Reservations Management Page (6 SP)
**Priority**: P0  
**Assignee**: Dev C (Full-Stack/QA)  
**Status**: NOT STARTED  
**Sprint**: Sprint 4  

#### Acceptance Criteria:
- [ ] List all user reservations
- [ ] Filter by status (pending, confirmed, cancelled, completed)
- [ ] Show reservation details (resource, date, time, status)
- [ ] Create new reservation
- [ ] Edit reservation (if not confirmed)
- [ ] Cancel reservation with confirmation
- [ ] Real-time status updates via Socket.IO
- [ ] Loading & error states
- [ ] Responsive design
- [ ] No console errors

#### Sub-tasks:

**Sub-7.1: Reservations Listing Component**
- **Dev**: Dev C
- **SP**: 2
- **Status**: NOT STARTED
- **Details**:
  - [ ] Create ReservationsPage component
  - [ ] Fetch from GET `/api/reservations`
  - [ ] Display in table/card layout
  - [ ] Show resource name, date, time, status
  - [ ] Add status color badges (pending=yellow, confirmed=green, etc.)
  - [ ] Sort by date (newest first)
  - [ ] Pagination (10 items per page)
- **Definition of Done**:
  - Data displays correctly
  - Status badges visually clear
  - Pagination working
  - Mobile responsive

**Sub-7.2: Status Filtering & Display**
- **Dev**: Dev C
- **SP**: 2
- **Status**: NOT STARTED
- **Details**:
  - [ ] Add status filter tabs
  - [ ] Filter by All / Pending / Confirmed / Completed / Cancelled
  - [ ] Update list when filter changes
  - [ ] Show count per status
  - [ ] Highlight pending reservations
- **Definition of Done**:
  - Filters work correctly
  - Tab UI clean and intuitive
  - No API spam

**Sub-7.3: Create/Edit/Cancel Forms**
- **Dev**: Dev C
- **SP**: 1
- **Status**: NOT STARTED
- **Details**:
  - [ ] Create reservation modal
  - [ ] Date/time picker
  - [ ] Resource selector
  - [ ] Duration input
  - [ ] Notes field
  - [ ] Edit form (disable date if confirmed)
  - [ ] Cancel button with confirmation dialog
- **Definition of Done**:
  - Forms validate dates/times
  - API calls successful
  - Confirmation dialogs work
  - Modal closes on success

**Sub-7.4: Socket.IO Real-Time Sync & Error Handling**
- **Dev**: Dev C
- **SP**: 1
- **Status**: NOT STARTED
- **Details**:
  - [ ] Listen for `reservation:updated` Socket events
  - [ ] Update list when reservation status changes
  - [ ] Listen for `reservation:created` events
  - [ ] Add new reservation to list
  - [ ] Error handling for failed operations
  - [ ] Conflict detection (prevent double booking)
  - [ ] Test Socket events with backend
- **Definition of Done**:
  - Real-time updates working
  - No duplicate entries
  - Error handling solid
  - Console clean

---

## 📋 KANBAN BOARD - SPRINT 4 (10-24 FEB 2026)

### BACKLOG (20 SP Total)
```
[BACKLOG] 20 SP

ID | Title | Assignee | SP | Status
---|-------|----------|-----|-------
S-5 | Dashboard | Dev B | 8 | NOT STARTED
S-6 | Resources Management | Dev B | 6 | NOT STARTED
S-7 | Reservations Management | Dev C | 6 | NOT STARTED
```

### TODO (20 SP Total)
```
[TODO] 20 SP (Ready to start)

ID | Title | Assignee | SP | Status
---|-------|----------|-----|-------
S-5.1 | Create Dashboard Metrics API | Dev A | 2 | TODO
S-5.2 | Design Dashboard Layout | Dev B | 3 | TODO
S-5.3 | Bind Data & Loading States | Dev B | 2 | TODO
S-5.4 | Error Handling | Dev B | 1 | TODO
S-6.1 | Resources Listing | Dev B | 2 | TODO
S-6.2 | Filter & Search UI | Dev B | 2 | TODO
S-6.3 | Create/Edit/Delete Forms | Dev B | 1 | TODO
S-6.4 | Image Upload | Dev C | 1 | TODO
S-7.1 | Reservations Listing | Dev C | 2 | TODO
S-7.2 | Status Filtering | Dev C | 2 | TODO
S-7.3 | Create/Edit/Cancel Forms | Dev C | 1 | TODO
S-7.4 | Socket.IO Sync | Dev C | 1 | TODO
```

### IN PROGRESS (Current Day)
```
[IN PROGRESS] WIP Limit: 2 per dev

Dev A Capacity: 6-7 SP
- [ ] (Waiting for sprint kickoff)

Dev B Capacity: 6-7 SP  
- [ ] (Waiting for sprint kickoff)

Dev C Capacity: 6-7 SP
- [ ] (Waiting for sprint kickoff)
```

### IN REVIEW (PR Review)
```
[IN REVIEW] 

ID | Author | Reviewer | Status
---|--------|----------|-------
(none yet) |
```

### DONE (Completed)
```
[DONE] 0 SP completed

ID | Title | Assignee | Completed Date
---|-------|----------|---------------
(Sprint 4 just started)
```

---

## 🗓️ SPRINT 4 DAILY STANDUP TEMPLATE

### Monday 10 Feb | 09:00

**Daily Status**:
```
Morning Standup (09:00-09:15)
- Sprint planning kickoff (09:15-11:15)
- Setup & first branch creation (11:15+)

Dev A:
✅ Yesterday: Prepared dashboard metrics spec
🔄 Today: Start Sub-5.1 (Dashboard API endpoint)
🚧 Blockers: None

Dev B:
✅ Yesterday: Design review for dashboard UI
🔄 Today: Start Sub-5.2 (Dashboard components) + Sub-6.1 (Resources listing)
🚧 Blockers: Waiting for Dev A API endpoint

Dev C:
✅ Yesterday: Prepared test cases for Sprint 4
🔄 Today: Start Sub-7.1 (Reservations listing)
🚧 Blockers: None
```

### Tuesday 11 Feb | 10:00

**Daily Status**:
```
Dev A:
✅ Yesterday: Dashboard API endpoint 60% done
🔄 Today: Complete Sub-5.1, Push to develop
🚧 Blockers: None estimated

Dev B:
✅ Yesterday: Dashboard UI structure done
🔄 Today: Bind data to dashboard (Sub-5.3)
🚧 Blockers: Waiting for Sub-5.1 completion

Dev C:
✅ Yesterday: Reservations listing 50% done
🔄 Today: Complete listing + start filtering (Sub-7.2)
🚧 Blockers: None
```

### Wednesday 12 Feb | 10:00

**Daily Status**:
```
Dev A:
✅ Yesterday: Dashboard API complete & deployed
🔄 Today: Help Dev B with any API issues, start refinement
🚧 Blockers: None

Dev B:
✅ Yesterday: Dashboard data binding complete
🔄 Today: Complete loading states (Sub-5.4) + start Resources page
🚧 Blockers: None

Dev C:
✅ Yesterday: Reservations filtering done
🔄 Today: Start forms (Sub-7.3)
🚧 Blockers: None
```

### Thursday 13 Feb | 10:00

**Daily Status**:
```
Dev A:
✅ Yesterday: Mid-sprint check-in
🔄 Today: Code review for team PRs
🚧 Blockers: None

Dev B:
✅ Yesterday: Resources listing 70% done
🔄 Today: Complete Resources filtering + forms
🚧 Blockers: None

Dev C:
✅ Yesterday: Reservation forms structure done
🔄 Today: Complete forms + Socket.IO integration
🚧 Blockers: Waiting for Socket events from backend
```

### Friday 14 Feb | 10:00

**Daily Status**:
```
Dev A:
✅ Yesterday: Code reviews complete
🔄 Today: Final API testing + bug fixes
🚧 Blockers: None

Dev B:
✅ Yesterday: Resources CRUD complete
🔄 Today: Image upload handling + testing
🚧 Blockers: None

Dev C:
✅ Yesterday: Socket.IO integration 80% done
🔄 Today: Testing + error handling
🚧 Blockers: None
```

---

## 📊 BURNDOWN CHART - SPRINT 4

```
Day 1 (Mon 10):  20 SP remaining ████████████████░░ (100%)
Day 2 (Tue 11):  17 SP remaining █████████████░░░░░ (85%)
Day 3 (Wed 12):  14 SP remaining ██████████░░░░░░░░ (70%)
Day 4 (Thu 13):  10 SP remaining ████████░░░░░░░░░░ (50%)
Day 5 (Fri 14):   5 SP remaining ███░░░░░░░░░░░░░░░ (25%)

Week 2:
Day 8 (Mon 17):   3 SP remaining ██░░░░░░░░░░░░░░░░ (15%)
Day 9 (Tue 18):   1 SP remaining █░░░░░░░░░░░░░░░░░ (5%)
Day 10(Wed 19):   0 SP remaining ✅ DONE (0%)
```

---

## 👥 DEVELOPER CAPACITY & DISTRIBUTION

### Dev A - Backend Lead
**Capacity**: 6-7 SP/sprint

**Sprint 4 Assignments**:
1. Sub-5.1: Dashboard Metrics API (2 SP)
2. Code reviews & support (2-3 SP)
3. Bug fixes & stability (2 SP)

**Total**: 6-7 SP

### Dev B - Frontend Lead
**Capacity**: 6-7 SP/sprint

**Sprint 4 Assignments**:
1. Sub-5.2: Dashboard Layout (3 SP)
2. Sub-5.3: Dashboard Data Binding (2 SP)
3. Sub-5.4: Error Handling (1 SP)
4. Sub-6.1: Resources Listing (2 SP)
5. Sub-6.2: Resources Filtering (2 SP)
6. Sub-6.3: Resources Forms (1 SP)

**Total**: 11 SP (needs rebalancing - move some to Dev C)

### Dev C - Full-Stack/QA
**Capacity**: 6-7 SP/sprint

**Sprint 4 Assignments**:
1. Sub-6.4: Image Upload (1 SP)
2. Sub-7.1: Reservations Listing (2 SP)
3. Sub-7.2: Status Filtering (2 SP)
4. Sub-7.3: Reservation Forms (1 SP)
5. Sub-7.4: Socket.IO Sync (1 SP)
6. Testing & QA (1 SP)

**Total**: 8 SP

---

## 🔄 GIT WORKFLOW - BRANCH NAMING

### Feature Branches
```
feature/TASK-123-dashboard-api
feature/TASK-124-resources-listing
feature/TASK-125-reservations-page
```

### Pull Request Template
```
## Description
Linked task: #123
What does this PR do?

## Changes
- Change 1
- Change 2

## Testing
How to test this feature?

## Screenshots (if UI)
(Attach images)

## Checklist
- [ ] Code compiles (0 TS errors)
- [ ] ESLint: 0 warnings
- [ ] Tests passing
- [ ] No console errors
- [ ] Mobile responsive
```

---

## 📋 DEFINITION OF DONE - Sprint 4

Before marking task DONE:
- [ ] Code merged to `develop` branch
- [ ] TypeScript: 0 errors, 0 warnings
- [ ] ESLint: 0 warnings
- [ ] Tests written and passing
- [ ] Manual testing passed (happy path)
- [ ] Console: 0 errors, 0 warnings
- [ ] Code reviewed & approved (≥1 reviewer)
- [ ] Documentation updated (if needed)
- [ ] Responsive design verified (mobile, tablet, desktop)
- [ ] API contract verified (Postman)
- [ ] PR merged and deployed to staging

---

## 🚨 SPRINT 4 RISKS & MITIGATION

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|-----------|
| Dashboard API slow | High | Medium | Optimize queries, test load |
| Image upload fails | High | Medium | Start Sub-6.4 early, test thoroughly |
| Socket.IO sync issues | Medium | Medium | Frequent testing, dev collaboration |
| Resource conflicts during filtering | Low | Low | Add conflict detection tests |

---

## ✅ ACCEPTANCE TESTING CHECKLIST

### Dashboard
- [ ] Navigate to `/dashboard`
- [ ] KPIs display correct data
- [ ] Charts render without errors
- [ ] Loading state shows while fetching
- [ ] Refresh button updates data
- [ ] Works on mobile/tablet/desktop
- [ ] Console: 0 errors

### Resources
- [ ] Navigate to `/resources`
- [ ] List displays all resources
- [ ] Filter by category works
- [ ] Search by name/description works
- [ ] Add resource form opens
- [ ] Upload image and submit
- [ ] Edit resource works
- [ ] Delete with confirmation works
- [ ] Works on mobile/tablet/desktop
- [ ] Console: 0 errors

### Reservations
- [ ] Navigate to `/reservations`
- [ ] List displays user's reservations
- [ ] Filter by status works
- [ ] Create reservation form opens
- [ ] Date/time picker works
- [ ] Submit creates reservation (API response)
- [ ] Edit reservation works
- [ ] Cancel with confirmation works
- [ ] Real-time updates appear (Socket.IO test)
- [ ] Works on mobile/tablet/desktop
- [ ] Console: 0 errors

---

## 📅 SPRINT 4 SCHEDULE

```
MONDAY 10 FEB
─────────────
09:00-09:15  : Daily Standup
09:15-11:15  : Sprint Planning
              • Review S3 complete
              • Discuss P0 priorities
              • Estimate Sprint 4 tasks
              • Assign to developers
11:15-12:00  : Developers setup
              • Pull latest develop branch
              • Create feature branches
              • First commits

TUE-THU 11-13 FEB
──────────────────
10:00-10:15  : Daily Standup
              • 15-min status check
              • Blockers resolution
16:00-17:00  : Refinement (optional)
              • Prep Sprint 5 stories

FRIDAY 14 FEB
──────────────
10:00-10:15  : Daily Standup
15:00-16:00  : Mid-Sprint Review
              • Check burndown
              • Any concerns?
              • Adjust if needed

NEXT WEEK (17-21 FEB)
──────────────────────
10:00-10:15  : Daily Standup (daily)
15:00-16:00  : Final push & testing
18:00+       : Prepare for Sprint Review

FRIDAY 21 FEB
──────────────
15:00-16:00  : Sprint Review (Demo to stakeholders)
16:00-16:45  : Retrospective
              • What went well?
              • What to improve?
              • Action items for S5
```

---

## 📈 VELOCITY & SUCCESS METRICS

### Success Criteria for Sprint 4
- [ ] 20 SP completed (100% of planned)
- [ ] Zero critical bugs
- [ ] All 3 pages deployed to staging
- [ ] Team velocity maintained at 20 SP+

### Tracking Sheet
```
Metric | S1 | S2 | S3 | S4 Target | S4 Actual
-------|----|----|----|-----------|-----------
Planned | 24 | 24 | 24 | 20 | ?
Completed | 24 | 24 | 24 | 20 | ?
% Complete | 100% | 100% | 100% | 100% | ?
Bugs Found | 2 | 1 | 0 | <2 | ?
```

---

## 🎯 CONCLUSION

**Sprint 4 is critical for:**
1. Stabilizing 3 main pages (Dashboard, Resources, Reservations)
2. Validating API/Frontend integration
3. Building momentum toward production release
4. Testing team velocity & capacity

**Next Phase** (Sprint 5+): Add notifications, calendar, profile features
