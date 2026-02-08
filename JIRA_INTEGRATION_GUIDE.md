# Guide: Intégration dans Jira

## Option 1: Import Manuel (Recommandé pour débuter)

### Étape 1: Créer le Projet Jira
1. **Accéder à Jira**
   - URL: https://yourjira.atlassian.net (ou votre instance)
   - Login avec vos identifiants

2. **Créer un Projet**
   - Cliquer "Create Project"
   - **Type**: Select a template → **Scrum** (pour sprints)
   - **Nom**: "SportReserve"
   - **Clé**: "SR" ou "SF" (Flow Forge)
   - **Équipe**: Ajouter Dev A, Dev B, Dev C

### Étape 2: Configurer le Backlog

1. **Settings → Project settings → Issue Types**
   - Vérifier que les types existents:
     - Epic
     - Story
     - Sub-task (ou Task)
     - Bug

2. **Settings → Project settings → Custom Fields** (optionnel)
   - Ajouter "Story Points" si not present
   - Ajouter "Developer" custom field

### Étape 3: Créer les Épics

**Dans Backlog → Créer Epic**

```
Epic 1: Authentication & User Management
├─ Status: DONE
├─ Priority: HIGHEST
├─ Description: Complete auth system with roles

Epic 2: Core Features - P0 (Dashboard/Resources/Reservations)
├─ Status: IN PROGRESS
├─ Priority: HIGHEST
├─ Sprint: Sprint 4

Epic 3: Notifications & Communication
├─ Status: BACKLOG
├─ Priority: HIGH

Epic 4: Calendar & Advanced Features
├─ Status: BACKLOG
├─ Priority: HIGH

Epic 5: User Experience & Profile
├─ Status: BACKLOG
├─ Priority: MEDIUM

Epic 6: Analytics & Performance
├─ Status: BACKLOG
├─ Priority: LOW
```

### Étape 4: Créer les Stories (Lier à Epic)

**Epic 2 → Créer Story**

```
Story 5: Dashboard
├─ Epic: Epic 2
├─ Priority: HIGHEST
├─ Status: TO DO
├─ SP: 8
├─ Assignee: Dev B
├─ Description: 
   Créer dashboard avec KPIs et charts
   
   Acceptance:
   - Dashboard affiche KPIs (réservations, ressources, users, revenue)
   - Charts visibles
   - Loading states
   - Error handling
   - Responsive design
├─ Labels: frontend, sprint-4

Story 6: Resources Management
├─ Epic: Epic 2
├─ Priority: HIGHEST
├─ SP: 6
├─ Assignee: Dev B
├─ Status: TO DO
├─ Description:
   Page de gestion des ressources
   
   Acceptance:
   - Listing des ressources
   - Filtres (catégorie, prix)
   - CRUD operations
   - Upload d'images
├─ Labels: frontend, sprint-4

Story 7: Reservations Management
├─ Epic: Epic 2
├─ Priority: HIGHEST
├─ SP: 6
├─ Assignee: Dev C
├─ Status: TO DO
├─ Description:
   Page de gestion des réservations
   
   Acceptance:
   - Listing réservations
   - Filtres par statut
   - CRUD operations
   - Socket.IO sync temps réel
├─ Labels: fullstack, sprint-4
```

### Étape 5: Créer les Sub-tasks

**Story 5 → Créer Sub-task**

```
Sub-5.1: Create Dashboard Metrics API Endpoint
├─ Story: Story 5
├─ Assignee: Dev A
├─ SP: 2
├─ Status: TO DO
├─ Description: Endpoint GET /api/dashboard/metrics

Sub-5.2: Design Dashboard Layout & Components
├─ Story: Story 5
├─ Assignee: Dev B
├─ SP: 3
├─ Status: TO DO

Sub-5.3: Bind Data & Loading States
├─ Story: Story 5
├─ Assignee: Dev B
├─ SP: 2
├─ Status: TO DO

Sub-5.4: Error Handling & Edge Cases
├─ Story: Story 5
├─ Assignee: Dev B
├─ SP: 1
├─ Status: TO DO

[Idem pour Story 6 et 7]
```

### Étape 6: Créer un Sprint

1. Aller au **Backlog**
2. Cliquer "Create Sprint"
3. **Nom**: "Sprint 4"
4. **Dates**: 10 Feb - 24 Feb 2026
5. Drag-drop les stories de la Epic 2 vers Sprint 4

### Étape 7: Kanban Board

1. Aller à **Board**
2. Voir les colonnes: TO DO → IN PROGRESS → IN REVIEW → DONE
3. WIP Limit par colonne (Settings → Column)
   - IN PROGRESS: 2 per dev
   - IN REVIEW: 5

---

## Option 2: Import via CSV (Bulk)

### Fichier CSV à importer

Créer un fichier `jira-import.csv`:

```csv
Issue Type,Summary,Story Points,Assignee,Epic Link,Sprint,Priority,Status,Description
Epic,Authentication & User Management,,,,,DONE,HIGHEST,Complete auth system
Epic,Core Features - P0,,,,,IN PROGRESS,HIGHEST,Dashboard Resources Reservations
Epic,Notifications & Communication,,,,,BACKLOG,HIGH,Email + notifications
Story,Dashboard,8,Dev B,"Core Features - P0","Sprint 4",HIGHEST,TO DO,"Create dashboard with KPIs"
Story,Resources Management,6,Dev B,"Core Features - P0","Sprint 4",HIGHEST,TO DO,"Resource listing and CRUD"
Story,Reservations Management,6,Dev C,"Core Features - P0","Sprint 4",HIGHEST,TO DO,"Reservations with Socket.IO"
Sub-task,Create Dashboard Metrics API,2,Dev A,Story 5,"Sprint 4",HIGHEST,TO DO,"GET /api/dashboard/metrics"
Sub-task,Design Dashboard Layout,3,Dev B,Story 5,"Sprint 4",HIGHEST,TO DO,"UI components & styling"
Sub-task,Bind Data & Loading States,2,Dev B,Story 5,"Sprint 4",HIGHEST,TO DO,"Connect API to UI"
Sub-task,Error Handling,1,Dev B,Story 5,"Sprint 4",HIGHEST,TO DO,"Handle API failures gracefully"
```

### Import étapes:
1. **Jira Settings** → **Tools** → **Import and Export**
2. **Import Issues** → Upload CSV
3. **Map Fields** (associer colonnes CSV → champs Jira)
4. **Confirm & Import**

---

## Option 3: Utiliser Jira CLI (Avancé)

### Installation
```bash
# npm install -g jira-cli
npm install -g jira-cli
```

### Configuration
```bash
jira-cli config
# Ajouter:
# - Host: https://your-jira.atlassian.net
# - Email: your-email@company.com
# - API Token: (générer depuis Jira Account Settings)
```

### Script de création (bash)
```bash
#!/bin/bash

# Create Epics
jira-cli issue create --type Epic \
  --summary "Authentication & User Management" \
  --field "customfield_10000=8" \
  --project SR

jira-cli issue create --type Epic \
  --summary "Core Features - P0" \
  --field "customfield_10000=20" \
  --project SR

# Create Stories
jira-cli issue create --type Story \
  --summary "Dashboard" \
  --story-points 8 \
  --assignee "dev-b@company.com" \
  --parent "SR-1" \
  --project SR

jira-cli issue create --type Story \
  --summary "Resources Management" \
  --story-points 6 \
  --assignee "dev-b@company.com" \
  --parent "SR-1" \
  --project SR

# Etc...
```

---

## Option 4: Utiliser REST API Jira

### Setup
```bash
# Variables d'environnement
export JIRA_URL="https://your-jira.atlassian.net"
export JIRA_USER="your-email@company.com"
export JIRA_TOKEN="your-api-token"
```

### Créer une Epic (curl)
```bash
curl -X POST \
  -H "Authorization: Basic $(echo -n $JIRA_USER:$JIRA_TOKEN | base64)" \
  -H "Content-Type: application/json" \
  -d '{
    "fields": {
      "project": {"key": "SR"},
      "summary": "Authentication & User Management",
      "issuetype": {"name": "Epic"},
      "customfield_10000": "Authentication & User Management"
    }
  }' \
  $JIRA_URL/rest/api/3/issues
```

### Créer une Story
```bash
curl -X POST \
  -H "Authorization: Basic $(echo -n $JIRA_USER:$JIRA_TOKEN | base64)" \
  -H "Content-Type: application/json" \
  -d '{
    "fields": {
      "project": {"key": "SR"},
      "summary": "Dashboard",
      "issuetype": {"name": "Story"},
      "customfield_10034": 8,
      "assignee": {"name": "dev-b"},
      "customfield_10000": "SR-1",
      "priority": {"name": "Highest"}
    }
  }' \
  $JIRA_URL/rest/api/3/issues
```

---

## Option 5: Jira Cloud + Automation (Recommandé)

### Intégration avec Git
1. **Settings → Integrations → GitHub**
   - Connecter repo SportReserve
   - Les PR seront liées automatiquement aux issues

### Workflow Automation
1. **Settings → Automation**
   - Créer rule:
     - **Trigger**: Issue moved to IN PROGRESS
     - **Action**: Post comment "Started on #date"
   
   - Créer rule:
     - **Trigger**: PR merged
     - **Action**: Auto-move issue to DONE

### Boards
1. **Board Settings**
   - Columns: TO DO, IN PROGRESS, IN REVIEW, DONE
   - Trier par: Priority → Sprint → Assignee
   - WIP Limits: 2 per dev

---

## Workflow de travail quotidien

### Matin - Sprint Planning
1. **Board** → Voir Sprint 4
2. Dev A, Dev B, Dev C drag stories to "IN PROGRESS"
3. Create branches: `feature/SR-5-dashboard`

### Daily Standup
1. Update task status dans le board
2. Post comment avec blockers
3. Log time spent

### Fin de jour
1. Move completed tasks to DONE
2. Create PR (description inclut "Closes SR-5")
3. Jira auto-update quand PR merged

---

## Équipe & Permissions

### Ajouter les développeurs
1. **Settings → People**
2. Inviter:
   - dev-a@company.com (Backend Lead)
   - dev-b@company.com (Frontend Lead)
   - dev-c@company.com (Full-Stack/QA)

### Roles
- **Project Lead**: Vous (créer sprints, gerer backlog)
- **Developers**: Dev A, B, C (créer issues, update status)
- **Stakeholders**: Autres (voir reports, demo)

---

## Board Customization

### Colonnes du Kanban
```
TO DO → IN PROGRESS (2 WIP) → IN REVIEW (5 WIP) → DONE
```

### Filtres
- Par Sprint: "Sprint = Sprint 4"
- Par Assignee: "Assignee in (Dev A, Dev B, Dev C)"
- Par Priority: "Priority = Highest"

### Reports
- **Velocity Chart** (SP par sprint)
- **Burndown Chart** (jours vs SP restant)
- **Cumulative Flow** (flux des tâches)
- **Sprint Report** (résumé sprint)

---

## Checklist - Jira Setup Complet

- [ ] Projet Jira créé ("SportReserve")
- [ ] Équipe ajoutée (Dev A, B, C)
- [ ] 6 Épics créés
- [ ] Sprint 4 créé (dates 10-24 Feb)
- [ ] 7 Stories créées dans Sprint 4
- [ ] 12 Sub-tasks créées
- [ ] Custom fields: Story Points, Assignee
- [ ] Board Kanban configuré (colonnes + WIP)
- [ ] GitHub intégré (PR auto-link)
- [ ] Automation rules créées
- [ ] Daily standup agendé dans Jira
- [ ] Reports activés (velocity, burndown)

---

## Bonus: Postman pour API Jira

**Créer une Collection Postman** pour tester l'API Jira:

```http
### Create Epic
POST https://{{jira_url}}/rest/api/3/issues
Authorization: Basic {{jira_auth}}
Content-Type: application/json

{
  "fields": {
    "project": {"key": "SR"},
    "summary": "Epic Name",
    "issuetype": {"name": "Epic"}
  }
}

### List Issues
GET https://{{jira_url}}/rest/api/3/issues?jql=project=SR

### Update Issue Status
POST https://{{jira_url}}/rest/api/3/issues/{{issue_key}}/transitions
Content-Type: application/json
{
  "transition": {"id": "11"}
}
```

---

## Résumé

**Meilleur approach pour vous**:
1. **Commencer**: Option 1 (Manuel) - 30 min pour setup complet
2. **Escalader**: Option 2 (CSV) - si beaucoup de tâches à importer
3. **Automatiser**: Option 5 (Automation) - GitHub + Jira sync

**Coût**: Jira Cloud gratuit pour <10 users ou ~$7/user/mois
