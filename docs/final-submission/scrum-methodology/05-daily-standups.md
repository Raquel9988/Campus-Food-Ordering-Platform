# Daily Stand-Up Summaries

This document summarises the team’s daily stand-up and Scrum progress meetings for the **Campus Food Ordering Platform**.

The purpose of this document is to show how the team communicated during each sprint, tracked progress, identified blockers, and agreed on next steps.

Detailed meeting evidence, call screenshots, and supporting proof are stored separately.

---

## 1. Summary of Stand-Up Evidence

| Sprint | Main Focus | Meeting Types Included |
|---|---|---|
| Sprint 1 | Authentication, roles, menu management, and admin controls | Planning, Scrum check-ins, progress meeting, review preparation |
| Sprint 2 | Cart, ordering, vendor dashboard, tracking, and notifications | Sprint planning and daily scrum progress meetings |
| Sprint 3 | Online payments and dietary system | Sprint planning, progress meetings, merge preparation, review |
| Sprint 4 | Admin analytics and final submission preparation | Sprint planning, branch coordination, final preparation |

---

# Sprint 1 Stand-Up / Scrum Summaries

Sprint 1 focused on building the foundation of the platform. The main work included user verification, menu management, role-based access, and admin controls.

---

## Sprint 1 Meeting 1 — Sprint Planning Meeting

| Field | Details |
|---|---|
| Date | 30 March 2026 |
| Type | In-person planning meeting |
| Duration | 1 hour 30 minutes |
| Attendees | Raquel, Keitu, Lesego, Lukho, Ntando, Sthembile, Calvin |

### Main Points Discussed

- The team agreed that Sprint 1 would focus on **User Verification** and **Menu Management**.
- The first user stories were identified for the main user roles:
  - Student
  - Vendor
  - Admin
- Required Sprint 1 features were discussed:
  - Student registration and login
  - Vendor registration and login
  - Admin login and role-based access
  - Vendor menu creation
  - Menu display and availability
  - Admin approval and suspension of vendors
- The team discussed the initial technology stack and project structure.
- GitHub Issues and GitHub Projects were selected for tracking user stories and tasks.

### Blockers / Issues

- The project was still new, so members were still learning how the system would be structured.
- The task split still needed to be refined.
- Some members were not yet fully clear on how their work would connect to the full system.

### Outcome / Next Steps

- Sprint 1 focus areas were agreed.
- Initial user stories were identified.
- Tasks were allocated to team members.
- Development started after the meeting.

---

## Sprint 1 Meeting 2 — Scrum / Planning Check-In

| Field | Details |
|---|---|
| Date | 7 April 2026 |
| Type | WhatsApp Scrum / Planning Meeting |
| Duration | 16 minutes |
| Attendees | All team members present |

### Main Points Discussed

- The team discussed the CI/CD pipeline that had been set up on GitHub.
- The team confirmed that user stories should be created as GitHub Issues.
- User stories needed to follow the **Who–What–Why** format.
- Acceptance tests needed to follow the **Given–When–Then** format.
- The team discussed the vendor approval system.
- Vendor accounts should remain pending until approved by an admin.
- The team reviewed the GitHub workflow:
  - Each member should work on their own branch.
  - Members should not push directly to `main`.
  - Work should be merged through pull requests.

### Blockers / Issues

- Some members still needed clarity on role responsibilities.
- Some user stories needed clearer acceptance tests.
- The team needed to improve understanding of the GitHub workflow.

### Outcome / Next Steps

- GitHub Issues were confirmed as the place for user stories.
- Branching and pull request rules were reinforced.
- The shared authentication system would be reused across student, vendor, and admin roles.

---

## Sprint 1 Meeting 3 — Scrum Progress Meeting

| Field | Details |
|---|---|
| Date | 10 April 2026 |
| Type | WhatsApp Scrum / Progress Meeting |
| Duration | 30 minutes |
| Attendees | All team members present |

### Main Points Discussed

- The team discussed whether admin functionality should be public or private.
- The team agreed that admin access should remain private.
- Completed authentication functionality was reviewed.
- The team confirmed that the following features were working:
  - Login
  - Registration
  - Forgot Password
- The team discussed how vendor menu creation would be connected to the vendor dashboard.

### Blockers / Issues

- Menu creation still needed to be connected properly to the vendor dashboard.
- Some integration details still needed clarification.
- Sprint review preparation still needed to be organised.

### Outcome / Next Steps

- Admin access would remain private.
- Authentication-related functionality was confirmed as complete.
- The team continued working toward completing Sprint 1 functionality.

---

## Sprint 1 Meeting 4 — Sprint Review Preparation Meeting

| Field | Details |
|---|---|
| Date | 13 April 2026 |
| Type | WhatsApp Call |
| Duration | 19 minutes |
| Attendees | All team members present |

### Main Points Discussed

- The team checked whether Sprint 1 features were ready for presentation.
- The working system was reviewed.
- Presentation responsibilities were discussed.
- The team identified that third-party identity provider support still needed attention.
- Google authentication was discussed as a future improvement.

### Blockers / Issues

- Presentation preparation happened late.
- Third-party identity provider support was not fully completed yet.
- Some members needed more time to prepare clear explanations of their own work.

### Outcome / Next Steps

- The system was considered ready for the Sprint 1 review.
- Presentation roles were assigned.
- The team agreed that task splitting, GitHub workflow, and preparation needed to improve in Sprint 2.

---

# Sprint 2 Stand-Up / Scrum Summaries

Sprint 2 focused on the main ordering workflow. The main work included cart functionality, order placement, vendor orders, order tracking, and notifications.

---

## Sprint 2 Meeting 1 — Sprint Planning Meeting

| Field | Details |
|---|---|
| Date | 15 April 2026 |
| Type | WhatsApp Sprint Planning Meeting |
| Duration | Approximately 27 minutes |
| Attendees | All team members present |

### Main Points Discussed

- Sprint 2 would focus on the main ordering workflow.
- The selected Sprint 2 areas were:
  - Cart and order placement
  - Database and backend order logic
  - Vendor dashboard and order management
  - Order status updates
  - Student tracking interface
  - Real-time updates and notifications
- The team applied lessons from Sprint 1.
- Tasks needed to be split more clearly and fairly.
- Each member needed clearer responsibility for their own work.
- The GitHub Projects board would be used to track:
  - Backlog
  - Ready
  - In Progress
  - Done
- The team confirmed that work should be completed through branches and pull requests.
- Sthembile was assigned as the main code reviewer.

### Blockers / Issues

- Sprint 1 had weak task ownership, so Sprint 2 needed better structure.
- Contribution tracking needed improvement.
- Some members needed clearer responsibilities.

### Outcome / Next Steps

- Sprint 2 structure was clearly defined.
- Tasks were distributed more evenly.
- The team agreed to use the GitHub Projects board and pull request workflow more consistently.

---

## Sprint 2 Meeting 2 — Daily Scrum / Progress Meeting

| Field | Details |
|---|---|
| Date | 17 April 2026 |
| Type | WhatsApp Daily Scrum |
| Duration | Approximately 16 minutes |
| Attendees | All team members present |

### Main Points Discussed

- Each member gave a short progress update.
- Members reported:
  - What they had completed
  - What they were currently working on
  - What they planned to complete next
- Work remained aligned with the Sprint 2 user stories and task allocations.
- Members were reminded to push completed work to their own branches.
- Pull requests would be reviewed before merging into `main`.

### Blockers / Issues

- No major blockers were reported.
- No serious technical issues were raised.

### Outcome / Next Steps

- Sprint 2 work was confirmed to be on track.
- Members continued with assigned tasks.
- The team continued using the GitHub Projects board and pull request workflow.

---

## Sprint 2 Meeting 3 — Daily Scrum / Final Progress Meeting

| Field | Details |
|---|---|
| Date | 19 April 2026 |
| Type | WhatsApp Daily Scrum / Progress Meeting |
| Duration | Approximately 29 minutes |
| Attendees | All team members present |

### Main Points Discussed

- The team confirmed that all major Sprint 2 features had been completed.
- The full ordering flow was reviewed.
- The team checked how the different parts of the system connected.
- Remaining minor work included:
  - Completing notifications
  - Fixing timestamp display
  - Showing when an order was placed
  - Showing when an order status changed

### Blockers / Issues

- No major blockers were reported.
- Only minor fixes remained.

### Outcome / Next Steps

- Sprint 2 was nearly complete.
- The team moved into final testing and refinement.
- Remaining issues were clearly identified.

---

# Sprint 3 Stand-Up / Scrum Summaries

Sprint 3 focused on two major features: online payments and the dietary system.

---

## Sprint 3 Meeting 1 — Sprint Planning Meeting

| Field | Details |
|---|---|
| Date | 24 April 2026 |
| Type | Sprint Planning Meeting |
| Duration | 30 minutes |
| Attendees | All team members present |

### Main Points Discussed

- Sprint 3 would focus on:
  - Online payments
  - Dietary system
- Payment work was divided into:
  - Payment API
  - Order and payment logic
  - Payment UI
- Dietary work was divided into:
  - Dietary tag definitions and vendor UI
  - Dietary backend/database
  - Student filtering UI
- The team agreed on the dependency order:
  - Person 2 would start the Payment API first.
  - Person 4 would start Dietary Definitions and Vendor UI first.
  - Person 3 and Person 5 would start after the foundations were ready.
  - Person 1 and Person 6 would complete frontend-dependent work later.

### Blockers / Issues

- Some tasks depended on other members finishing first.
- Payment and dietary tag formats needed coordination between team members.

### Outcome / Next Steps

- Sprint 3 goal was agreed.
- Work was divided between all six members.
- Dependency order was confirmed to prevent blocking.

---

## Sprint 3 Meeting 2 — General Scrum / Progress Meeting

| Field | Details |
|---|---|
| Date | 30 April 2026 |
| Type | General Scrum / Project Progress Meeting |
| Duration | 16 minutes |
| Attendees | All team members present |

### Main Points Discussed

- The team discussed the payment provider.
- PayFast was selected for online payments.
- Students would complete payment through PayFast.
- Students should only order from one vendor at a time.
- Vendors should only receive orders after successful payment.
- Student orders should be separated into:
  - Active Orders
  - Order History
- Dietary requirements were discussed.
- The dietary system should include common options:
  - Halal
  - Vegan
  - Vegetarian
  - Gluten-free
  - Nut-free
- A custom dietary input option should also be supported.

### Blockers / Issues

- Multi-vendor payments would make the system more complicated.
- Dietary requirements needed a clear and consistent list.

### Outcome / Next Steps

- PayFast was selected.
- One-vendor checkout was agreed.
- Vendors would only process paid orders.
- Dietary filtering requirements were clarified.

---

## Sprint 3 Meeting 3 — General Scrum / Progress Meeting

| Field | Details |
|---|---|
| Date | 8 May 2026 |
| Type | General Scrum / Project Progress Meeting |
| Duration | 15 minutes |
| Attendees | All team members present |

### Main Points Discussed

- The payment feature was complete.
- Student-side work was still in progress.
- Vendor-side work was complete but still needed review.
- Sthembile needed to review vendor-side work before it was merged.
- Dietary feature progress:
  - Person 4 completed their part.
  - Person 5 was still in progress.
  - Person 6 was still in progress.

### Blockers / Issues

- No major blockers were identified.
- Vendor work still required review.
- Student-side and some dietary work still needed completion.

### Outcome / Next Steps

- Payment was confirmed as done.
- Vendor work awaited review.
- Dietary work continued.
- The team confirmed that there were no major blockers.

---

## Sprint 3 Meeting 4 — Final Scrum / Merge Preparation Meeting

| Field | Details |
|---|---|
| Date | 10 May 2026 |
| Type | General Scrum / Project Progress Meeting |
| Duration | 12 minutes |
| Attendees | All team members present |

### Main Points Discussed

- The team confirmed that all Sprint 3 parts were complete:
  - Payment feature
  - Student side
  - Vendor side
  - Dietary requirements feature
- Sthembile would merge everything into the main branch.
- The team would test the full system after merging.
- UML diagrams needed to be updated to reflect:
  - Payment flow
  - Student order flow
  - Vendor order flow
  - Dietary requirements

### Blockers / Issues

- No blockers were identified.
- The main risk was whether everything would work smoothly after merging.

### Outcome / Next Steps

- Sprint 3 work was complete.
- Merge into `main` was planned.
- UML diagram updates were reminded.

---

## Sprint 3 Meeting 5 — Sprint Review / Scrum Reflection

| Field | Details |
|---|---|
| Date | 11 May 2026 |
| Type | Team Sprint Review |
| Duration | 17 minutes |
| Attendees | All team members present |

### Main Points Discussed

- The team reviewed whether the Sprint 3 goal had been achieved.
- Payment and dietary features were completed and integrated.
- The payment system was considered one of the strongest sprint features.
- GitHub branch management caused some difficulty.
- One member worked on an outdated branch, which made merging harder.
- The team agreed that new work must always start from the latest updated code.
- Communication needed improvement.

### Blockers / Issues

- No unresolved blockers remained.
- The main issue was outdated branches and merge conflicts.
- Communication could have been more consistent.

### Outcome / Next Steps

- Sprint 3 was considered successful.
- The team agreed to improve communication and branch management in Sprint 4.
- Members should pull the latest code before continuing work.

---

# Sprint 4 Stand-Up / Scrum Summaries

Sprint 4 focused on admin analytics, report exports, testing evidence, UML diagrams, and final submission preparation.

---

## Sprint 4 Meeting 1 — Sprint Planning and Task Breakdown Meeting

| Field | Details |
|---|---|
| Date | 12 May 2026 |
| Type | Sprint 4 Planning / First Scrum Meeting |
| Duration | 25 minutes |
| Attendees | Team members present |

### Main Points Discussed

- Sprint 4 would focus on the admin analytics section.
- Required analytics features included:
  - Sales per vendor over time
  - Peak ordering hours
  - Custom analytics view
  - Export reports as CSV or PDF
- Work was divided between six members:
  - Person 1: Analytics backend/data foundation
  - Person 2: Analytics dashboard page/layout
  - Person 3: Sales per vendor report
  - Person 4: Peak ordering hours report
  - Person 5: Custom analytics view
  - Person 6: CSV/PDF export feature
- The team agreed on the dependency order:
  - Person 1 starts with analytics data.
  - Person 2 creates the dashboard structure.
  - Persons 3, 4, and 5 create reports.
  - Person 6 completes export functionality.

### Blockers / Risks

- Reports depend on clean analytics data.
- Export functionality depends on completed report data.
- Multiple people editing the same files could create merge conflicts.

### Outcome / Next Steps

- Sprint 4 analytics goal was agreed.
- Individual responsibilities were assigned.
- Work order and dependencies were clearly confirmed.

---

## Sprint 4 Meeting 2 — Daily Scrum / Branch Coordination Meeting

| Field | Details |
|---|---|
| Date | 15 May 2026 |
| Type | Daily Scrum Meeting |
| Duration | 13 minutes |
| Sprint | Sprint 4 Analytics |

### Main Points Discussed

- Person 1 completed the analytics backend/data foundation.
- The `GET /api/analytics` endpoint was ready.
- The endpoint provides clean paid-order data for the analytics reports.
- The endpoint returns fields such as:
  - Vendor name
  - Order date
  - Order time
  - Order hour
  - Order total
  - Payment status
  - Items
- The team discussed how the remaining members should connect to the analytics data.
- The team discussed the risk of everyone working on the same branch.
- The team decided to continue working on the same branch as Person 2 because Person 2 controlled the analytics dashboard layout.
- Members were told to avoid unnecessary edits to shared files.

### Blockers / Risks

- Merge conflicts could happen if multiple people edited `analytics.html`.
- Someone working on outdated code could break the shared branch.
- Reports might not connect properly if the API data format was misunderstood.

### Outcome / Next Steps

- The analytics backend was confirmed as ready.
- Everyone agreed to pull the latest branch before editing or pushing code.
- Persons 3, 4, 5, and 6 would mainly work in their own JavaScript files.

### Team Rule Agreed

```text
git checkout feature/analytics-dashboard-UI
git pull origin feature/analytics-dashboard-UI
```

Each member must pull the latest version before making changes.

---

## Sprint 4 Meeting 3 — Daily Scrum / Final Preparation Meeting

| Field | Details |
|---|---|
| Date | 17 May 2026 |
| Type | Daily Scrum Meeting |
| Duration | 10 minutes |
| Sprint | Sprint 4 |

### Main Points Discussed

- Almost all Sprint 4 tasks were complete.
- Remaining work focused on:
  - Final documentation
  - PDF exports
  - UML diagrams
  - Final presentation video
  - Final report
- Sthembile was still working on PDF exports.
- Team members were reminded to send or update UML diagrams.
- Sthembile would create the final video.
- Raquel would finalise the final report.

### Blockers / Risks

| Risk | Planned Response |
|---|---|
| PDF exports not finished | Sthembile to complete exports |
| UML diagrams missing from some members | All members reminded to send/update diagrams |
| Final report still needed work | Raquel to finalise report |
| Final video still needed work | Sthembile to create video |

### Outcome / Next Steps

- Sprint 4 was confirmed as almost complete.
- The team moved into final polishing and evidence preparation.
- Remaining tasks were assigned clearly.

---

# Overall Daily Stand-Up Summary

Across the project, the daily stand-ups and Scrum progress meetings helped the team to:

- Track feature progress during each sprint.
- Identify blockers and risks.
- Confirm what each member was working on.
- Coordinate dependent work between team members.
- Improve GitHub branch and pull request workflow.
- Prepare for sprint reviews and final submission.
- Keep the team aligned as the project became more complex.

The most common blockers or risks were:

- Unclear task splitting during early sprints.
- GitHub branch management problems.
- Working from outdated branches.
- Merge conflict risks.
- Late documentation and UML preparation.
- Final submission organisation.

The team improved over time by using clearer task allocation, better dependency planning, regular progress checks, and stronger GitHub workflow rules.
