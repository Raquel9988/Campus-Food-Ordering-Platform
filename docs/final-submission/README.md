# Final Submission Folder

This folder contains the final submission documentation and evidence for the **Campus Food Ordering Platform**.

The purpose of this folder is to organise all required final project artefacts in one place so that reviewers can easily find the Scrum documents, additional artefacts, testing evidence, diagrams, and supporting documentation.

---

## 1. Core Submission Links

| Item | Link |
|---|---|
| Publicly Hosted Application | https://campus-food-ordering.pages.dev |
| GitHub Pages Preview | https://raquel9988.github.io/Campus-Food-Ordering-Platform/ |
| GitHub Repository | https://github.com/Raquel9988/Campus-Food-Ordering-Platform |
| Final Submission Documentation Folder | `docs/final-submission/` |

---

## 2. Project Summary

The **Campus Food Ordering Platform** is a web-based food ordering system for campus users.

The platform supports three main user roles:

| User Role | Main Purpose |
|---|---|
| Student | Browse vendors, view menus, place orders, pay online, track active orders, and view order history |
| Vendor | Manage menu items, assign dietary tags, view paid orders, and update order statuses |
| Admin | Approve or suspend vendors and view analytics reports |

The project was developed across four Scrum sprints.

---

## 3. Folder Structure

```text
docs/
└── final-submission/
    ├── README.md
    ├── scrum-methodology/
    │   ├── 01-product-backlog.md
    │   ├── 02-sprint-backlogs.md
    │   ├── 03-burndown-charts.md
    │   ├── 04-retrospectives.md
    │   ├── 05-daily-standups.md
    │   ├── 06-sprint-review-evidence.md
    │   └── evidence/
    │       └── Combined_Daily_Standup_and_Retrospective_Evidence.pdf
    └── additional-artifacts/
        ├── 01-project-plan.md
        ├── 02-architecture-diagram.md
        ├── 03-design-documents.md
        ├── 04-test-plan-and-results.md
        ├── architecture-diagram/
        │   └── campus_food_architecture_diagram.png
        ├── design-documents/
        │   ├── UML Activity Diagram.png
        │   ├── UML Class Diagram.jpeg
        │   ├── UML Deployment Diagram.jpeg
        │   ├── Use Case Final Diagram.png
        │   ├── UML Component Diagram.png
        │   ├── UML Sequence Diagram.png
        │   └── UML State Diagram.png
        └── test-plan-results/
            └── Codecov-Test-Evidence.pdf
```

---

## 4. Scrum Methodology Artefacts

The following documents provide evidence that the team followed Scrum methodology during the project.

| Scrum Artefact | Location | Description |
|---|---|---|
| Product Backlog | `scrum-methodology/01-product-backlog.md` | Prioritised list of product features and user stories |
| Sprint Backlogs | `scrum-methodology/02-sprint-backlogs.md` | Per-sprint task lists, dependencies, story points, and statuses |
| Sprint Burndown Charts | `scrum-methodology/03-burndown-charts.md` | Burndown tables and charts showing remaining effort over time |
| Sprint Retrospective Reports | `scrum-methodology/04-retrospectives.md` | What went well, what could improve, blockers, and action items |
| Daily Stand-Up Summaries | `scrum-methodology/05-daily-standups.md` | Scrum meeting summaries and progress updates across sprints |
| Sprint Review Evidence | `scrum-methodology/06-sprint-review-evidence.md` | Short summary of sprint review and evidence locations |
| Meeting Evidence Document | `scrum-methodology/evidence/Combined_Daily_Standup_and_Retrospective_Evidence.pdf` | Combined evidence document containing daily Scrum, sprint review, and retrospective meeting evidence |

---

## 5. Additional Artefacts

The following documents support the final project submission requirements.

| Additional Artefact | Location | Description |
|---|---|---|
| Project Plan | `additional-artifacts/01-project-plan.md` | High-level project plan with milestones and deadlines |
| Architecture Diagram | `additional-artifacts/02-architecture-diagram.md` | Explanation and location of the architecture diagram |
| Design Documents | `additional-artifacts/03-design-documents.md` | Summary and location of all UML/design diagrams |
| Test Plan and Results | `additional-artifacts/04-test-plan-and-results.md` | Testing strategy, test areas, results, and Codecov evidence |
| Architecture Diagram Folder | `additional-artifacts/architecture-diagram/` | Contains the final architecture diagram PNG |
| Design Documents Folder | `additional-artifacts/design-documents/` | Contains the final UML and design diagrams |
| Codecov Test Evidence | `additional-artifacts/test-plan-results/Codecov-Test-Evidence.pdf` | PDF evidence document containing Codecov screenshots and coverage results |

---

## 6. Included Design Documents

The final design document folder includes the following diagrams:

| Diagram | File |
|---|---|
| UML Activity Diagram | `additional-artifacts/design-documents/UML Activity Diagram.png` |
| UML Class Diagram | `additional-artifacts/design-documents/UML Class Diagram.jpeg` |
| UML Deployment Diagram | `additional-artifacts/design-documents/UML Deployment Diagram.jpeg` |
| Use Case Diagram | `additional-artifacts/design-documents/Use Case Final Diagram.png` |
| UML Component Diagram | `additional-artifacts/design-documents/UML Component Diagram.png` |
| UML Sequence Diagram | `additional-artifacts/design-documents/UML Sequence Diagram.png` |
| UML State Diagram | `additional-artifacts/design-documents/UML State Diagram.png` |

These diagrams support the final submission by showing the system from multiple views, including workflow, structure, deployment, user interaction, component organisation, object interactions, and state behaviour.

---

## 7. Sprint Summary

| Sprint | Main Focus | Status |
|---|---|---|
| Sprint 1 | User verification, menu management, role-based access, and admin controls | Completed |
| Sprint 2 | Cart, order placement, vendor dashboard, order tracking, and notifications | Completed |
| Sprint 3 | Online payments and dietary filtering | Completed |
| Sprint 4 | Admin analytics, report exports, testing evidence, UML diagrams, and final submission preparation | Completed |

---

## 8. Testing Evidence Summary

Testing evidence is included in:

```text
additional-artifacts/04-test-plan-and-results.md
```

and:

```text
additional-artifacts/test-plan-results/Codecov-Test-Evidence.pdf
```

The Codecov evidence document includes automated code coverage screenshots and coverage breakdowns for the `main` branch.

The updated Codecov results were:

| Metric | Result |
|---|---:|
| Branch tested | main |
| Overall coverage | 83.84% |
| Covered lines | 1718 of 2049 |
| Missed lines | 331 |
| Coverage trend | +100.00% |

Coverage breakdown:

| Folder / Area | Coverage |
|---|---:|
| adminControls | 91.67% |
| auth | 82.56% |
| functions/api | 92.03% |
| shared-auth-foundation/src/js | 100.00% |
| student | 74.39% |
| vendor | 93.33% |

The `tests/mocks` folder was removed from Codecov production coverage tracking because it contains testing support files, not production application logic.

The updated Codecov evidence confirms that the project is above the 80% coverage target and that the strongest tested areas include:

- Shared authentication logic
- Vendor workflows
- Backend/API logic
- Admin analytics functionality
- Authentication logic

Additional automated tests were added for:

- Analytics dashboard loading and access control
- Peak ordering hours report
- Sales per vendor report
- Custom analytics filtering
- Export reports as CSV/PDF
- Master admin workflows
- Shared authentication helpers
- Shared route guards

---

## 9. Final Submission Checklist

| Item | Status |
|---|---|
| Publicly hosted application link added | Done |
| GitHub repository link added | Done |
| GitHub Pages preview link added | Done |
| Product backlog added | Done |
| Sprint backlogs added | Done |
| Burndown charts added | Done |
| Retrospectives added | Done |
| Daily stand-up summaries added | Done |
| Sprint review evidence added | Done |
| Combined Scrum meeting evidence added | Done |
| Project plan added | Done |
| Architecture diagram added | Done |
| Design documents added | Done |
| Test plan and results added | Done |
| Codecov evidence added | Done |
| Final video link | Done |
| Final link checks | Done |
| Final Moodle submission | Done |

---

## 10. How Reviewers Should Use This Folder

Reviewers should begin with this `README.md` file.

Then they can open:

1. `scrum-methodology/` for all Scrum methodology artefacts.
2. `scrum-methodology/evidence/` for the combined meeting evidence PDF.
3. `additional-artifacts/` for the project plan, architecture diagram, design documents, and testing evidence.
4. The hosted website link to view the live application.
5. The GitHub repository root to review the full source code, README, branches, and commit history.

---

## 11. Important Final Links for Submission Form

| Submission Form Field | Link / Location |
|---|---|
| Publicly Hosted Application | https://campus-food-ordering.pages.dev |
| GitHub Pages Preview | https://raquel9988.github.io/Campus-Food-Ordering-Platform/ |
| GitHub Repository | https://github.com/Raquel9988/Campus-Food-Ordering-Platform |
| Product Backlog | `docs/final-submission/scrum-methodology/01-product-backlog.md` |
| Sprint Backlogs | `docs/final-submission/scrum-methodology/02-sprint-backlogs.md` |
| Sprint Burndown Charts | `docs/final-submission/scrum-methodology/03-burndown-charts.md` |
| Sprint Retrospective Reports | `docs/final-submission/scrum-methodology/04-retrospectives.md` |
| Daily Stand-Up Summaries | `docs/final-submission/scrum-methodology/05-daily-standups.md` |
| Sprint Review Evidence | `docs/final-submission/scrum-methodology/06-sprint-review-evidence.md` |
| Combined Scrum Meeting Evidence | `docs/final-submission/scrum-methodology/evidence/Combined_Daily_Standup_and_Retrospective_Evidence.pdf` |
| Project Plan | `docs/final-submission/additional-artifacts/01-project-plan.md` |
| Architecture Diagram | `docs/final-submission/additional-artifacts/02-architecture-diagram.md` |
| Architecture Diagram PNG | `docs/final-submission/additional-artifacts/architecture-diagram/campus_food_architecture_diagram.png` |
| Design Documents | `docs/final-submission/additional-artifacts/03-design-documents.md` |
| Design Documents Folder | `docs/final-submission/additional-artifacts/design-documents/` |
| Test Plan and Results | `docs/final-submission/additional-artifacts/04-test-plan-and-results.md` |
| Codecov Test Evidence | `docs/final-submission/additional-artifacts/test-plan-results/Codecov-Test-Evidence.pdf` |

---

## 12. Current Status

The final submission folder has been organised and updated.

All Scrum methodology artefacts, additional artefacts, diagrams, and testing evidence have been added.

The latest Codecov evidence has also been updated to show:

- 83.84% overall coverage
- 1718 of 2049 lines covered
- 331 missed lines
- 100.00% shared authentication foundation coverage
- `tests/mocks` removed from production coverage tracking
