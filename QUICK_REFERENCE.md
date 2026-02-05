# 🚀 QUICK REFERENCE — Agile Sprint Guide
## Pour 3 Développeurs

---

## ⏰ STANDUPS TODAY

### Questions à poser (10-15 min)
```
🟢 What did I complete yesterday?
🟡 What am I working on today?
🔴 What's blocking me?

Simple format, people stand, quick round-robin
```

### SCHEDULE
- **Chaque jour** : 10h00 sharp
- **Duration** : 10-15 min max
- **Location** : [Teams Room / Zoom Link]

---

## 📊 YOUR CURRENT TASKS

### Dev A (Backend) — Sprint 4
- [ ] Dashboard metrics API (8 SP) — IN PROGRESS
- [ ] Redis caching setup — BACKLOG
- [ ] Email service setup — ASSIGNED

### Dev B (Frontend) — Sprint 4
- [ ] Dashboard UI page (8 SP) — IN PROGRESS
- [ ] Resources page (6 SP) — TODO
- [ ] Reservations page (6 SP) — TODO

### Dev C (Full-Stack/QA) — Sprint 4
- [ ] Test framework setup (3 SP) — IN PROGRESS
- [ ] Smoke testing S4 (4 SP) — TODO
- [ ] Release prep docs (3 SP) — TODO

---

## 🎯 HOW TO GIT

### Start a Feature
```bash
git checkout develop
git pull
git checkout -b feature/API-dashboard
# ... code ...
git add .
git commit -m "feat: dashboard metrics endpoint"
git push origin feature/API-dashboard
```

### Create PR
- Go to GitHub
- Click "New Pull Request"
- Select your branch
- Title: `feat: dashboard metrics endpoint`
- Describe changes
- Request review
- Wait for ✅ approval

### Merge Feature
```bash
# After approved
git checkout develop
git pull
git merge feature/API-dashboard
git push origin develop
```

---

## 📅 CALENDAR

### THIS WEEK
```
MON 10  - Sprint Planning (9h), Kickoff
TUE 11  - Standup (10h)
WED 12  - Standup (10h), Refinement (15h)
THU 13  - Standup (10h)
FRI 14  - Standup (10h), Mid-sprint check-in (15h)
```

### NEXT WEEK
```
MON 17  - Standup (10h)
TUE 18  - Standup (10h)
WED 19  - Standup (10h)
THU 20  - Standup (10h)
FRI 21  - Standup (9h), Review Demo (15h), Retro (16h)
```

---

## 📝 TASK TEMPLATE

When you create a task, include:

```markdown
# [FEATURE-001] Dashboard Metrics

**Type**: Feature  
**Priority**: P0  
**Sprint**: S4  
**Story Points**: 8  
**Assignee**: Dev B  

## What needs to be done?
Display KPIs on dashboard

## How to know it's done?
- [ ] Metrics API working
- [ ] UI shows data correctly
- [ ] Loading state visible
- [ ] Error handling works
- [ ] No console errors
```

---

## 🐛 BUG REPORT TEMPLATE

```markdown
# [BUG-102] Dashboard crashes on mobile

**Severity**: High  
**Browser**: Chrome mobile  

## Steps to reproduce
1. Open dashboard on iPhone
2. Scroll down
3. Crashes

## Expected
Page should scroll

## Actual
White screen, console error 404

## Attachments
[Screenshot]
```

---

## ✅ BEFORE YOU MARK TASK "DONE"

```
☑️ Code is pushed to branch
☑️ PR created and reviewed
☑️ TypeScript: 0 errors
☑️ No console warnings
☑️ Tested manually
☑️ PR Approved
☑️ Merged to develop
☑️ Works on staging
```

---

## 🚨 IF YOU'RE BLOCKED

1. **Post in Slack** immediately (tag team)
2. **In standup** mention it
3. **Add comment on ticket** with details
4. **Escalate if** > 2 hours blocked

Example:
```
@Dev-A Can't pull latest DB model from API?
Getting 404 on /api/resources/{id}
Tried: [what you tried]
Started: 1h ago
```

---

## 📊 TOOLS WE USE

| Tool | URL | Purpose |
|------|-----|---------|
| Git | GitHub | Code version control |
| Sprint Board | GitHub Projects | Daily task tracking |
| Standup | Teams | Daily sync |
| Messages | Slack | Quick comms |
| API Testing | Postman | Backend testing |
| DB Admin | MongoDB Atlas | Database |

---

## 🎓 USEFUL COMMANDS

### Check your branch status
```bash
git status
```

### See what you've changed
```bash
git diff
```

### See your commits
```bash
git log --oneline -5
```

### Undo last commit (if not pushed)
```bash
git reset --soft HEAD~1
```

### See all branches
```bash
git branch -a
```

### Switch branch
```bash
git checkout feature/my-branch
```

---

## 📞 WHO TO ASK

| Question | Person |
|----------|--------|
| "How do I...?" | Dev C (experienced) |
| API design help | Dev A |
| UI component help | Dev B |
| Testing approach | Dev C |
| Git issues | Dev C |
| DB schema question | Dev A |
| React pattern question | Dev B |

---

## 💡 TIPS FOR SUCCESS

✅ **Commit daily** (even incomplete work)  
✅ **Test your own code first**  
✅ **Ask questions early** (don't wait)  
✅ **Check Slack morning** (catch blockers)  
✅ **Review PRs same day** (don't let them sit)  
✅ **Keep tasks small** (< 4 hours each)  
✅ **Update your task status** (keep board fresh)

---

## 🎯 SPRINT 4 TARGET

```
START:  20 SP backlog
        3 devs
        2 weeks
GOAL:   Complete Dashboard + Resources + Reservations pages
TARGET: Friday 21 Feb 15:00 Demo
```

---

## 🚀 AFTER SPRINT 4

- Friday Sprint Review (demo features)
- Friday Retrospective (lessons learned)
- Monday Sprint 5 Planning (next sprint)
- Focus: Email notifications + Calendar

---

**Print this & keep on your desk!**  
**Last updated**: 2026-02-05  
**Next sprint starts**: 2026-02-24
