# Project Plan

This document outlines the high-level project plan for the **Campus Food Ordering Platform**.

It summarises the project purpose, sprint milestones, major deliverables, deadlines, and final submission preparation.

---

## 1. Project Overview

| Item | Details |
|---|---|
| Project Name | Campus Food Ordering Platform |
| Project Type | Web-based campus food ordering system |
| Development Methodology | Scrum |
| Main Users | Students, Vendors, Admins |
| Final Submission Deadline | 22 May 2026 |

---

## 2. Project Purpose

The purpose of the Campus Food Ordering Platform is to allow students to browse campus food vendors, view menus, place food orders, pay online, track active orders, and view completed order history.

The platform also supports vendors and admins:

| User Role | Main Purpose |
|---|---|
| Students | Browse vendors, order food, pay online, and track orders |
| Vendors | Manage menus, receive paid orders, and update order statuses |
| Admins | Approve/suspend vendors and view analytics reports |

---

## 3. Overall Project Goal

The overall goal of the project was to build a complete campus food ordering platform that supports:

- User registration and login
- Student, vendor, and admin roles
- Vendor menu management
- Student cart and order placement
- Online payments using PayFast Sandbox
- Dietary tag filtering
- Vendor order management
- Order status tracking
- Admin analytics reports
- CSV/PDF report exports
- Public deployment
- Scrum documentation and final project evidence

---

## 4. High-Level Project Timeline

| Sprint / Phase | Dates | Main Goal | Status |
|---|---|---|---|
| Sprint 1 | 30 March 2026 – 13 April 2026 | Build authentication, roles, menus, and admin controls | Completed |
| Sprint 2 | 15 April 2026 – 20 April 2026 | Build cart, ordering, vendor dashboard, tracking, and notifications | Completed |
| Sprint 3 | 24 April 2026 – 11 May 2026 | Add PayFast payments and dietary filtering | Completed |
| Sprint 4 | 12 May 2026 – 22 May 2026 | Add analytics, exports, testing evidence, and final documentation | Completed |
| Final Submission | 22 May 2026 | Submit hosted app, GitHub repo, video, Scrum artefacts, and final form | Completed |

---

## 5. Major Project Milestones

| Milestone | Description | Target Date | Status |
|---|---|---:|---|
| Milestone 1 | Project setup, authentication, user roles, and menu foundation | 13 April 2026 | Completed |
| Milestone 2 | Student cart, order placement, vendor dashboard, and order tracking | 20 April 2026 | Completed |
| Milestone 3 | Online payment system and dietary filtering system | 11 May 2026 | Completed |
| Milestone 4 | Admin analytics dashboard and report export functionality | 22 May 2026 | Completed |
| Milestone 5 | Final documentation, diagrams, test evidence, hosted app, GitHub repo, and video | 22 May 2026 | Completed |

---

## 6. Sprint Summary

### Sprint 1: System Foundation

Sprint 1 focused on creating the basic foundation of the system.

| Deliverable | Status |
|---|---|
| Student authentication | Completed |
| Vendor authentication | Completed |
| Admin authentication | Completed |
| Role-based access | Completed |
| Vendor approval and suspension | Completed |
| Vendor menu creation | Completed |
| Student menu display | Completed |
| GitHub repository and project setup | Completed |
| Basic CI/CD setup | Completed |

**Sprint 1 outcome:**  
The team created the foundation of the platform, including authentication, user roles, menu management, and admin vendor controls.

---

### Sprint 2: Ordering Workflow

Sprint 2 focused on building the core food ordering process.

| Deliverable | Status |
|---|---|
| Cart functionality | Completed |
| Order placement | Completed |
| Orders database and order item storage | Completed |
| Vendor orders dashboard | Completed |
| Order status management | Completed |
| Student order tracking | Completed |
| Notifications / status updates | Completed |

**Sprint 2 outcome:**  
Students could place orders, vendors could manage incoming orders, and students could track order progress.

---

### Sprint 3: Payments and Dietary System

Sprint 3 focused on online payments and dietary filtering.

| Deliverable | Status |
|---|---|
| PayFast Sandbox payment API | Completed |
| Payment notification endpoint | Completed |
| Order and payment linking | Completed |
| Payment user interface | Completed |
| One-vendor cart rule | Completed |
| Active Orders page | Completed |
| Order History page | Completed |
| Vendor dietary tag selection | Completed |
| Dietary backend storage | Completed |
| Student dietary filtering | Completed |

**Sprint 3 outcome:**  
Students could complete payments, vendors only processed paid orders, and menu items could be filtered by dietary requirements.

---

### Sprint 4: Analytics and Final Submission

Sprint 4 focused on admin analytics and final project preparation.

| Deliverable | Status |
|---|---|
| Analytics backend/data foundation | Completed |
| Analytics dashboard layout | Completed |
| Sales per vendor report | Completed |
| Peak ordering hours report | Completed |
| Custom analytics view | Completed |
| CSV/PDF report export | Completed |
| Analytics testing | Completed |
| Final documentation and artefacts | Completed |

**Sprint 4 outcome:**  
Admins could view analytics reports, filter analytics data, and export reports. The team also prepared the final documentation, diagrams, Scrum evidence, and test evidence.

---

## 7. Key Dependency Plan

The project was planned around feature dependencies so that team members could work in the correct order.

### Sprint 2 Ordering Dependency Flow

```text
Database / Backend
↓
Cart and Place Order
↓
Vendor Dashboard
↓
Order Status Management
↓
Student Tracking
↓
Notifications
```

### Sprint 3 Payment Dependency Flow

```text
Payment API
↓
Order and Payment Logic
↓
Payment UI
```

### Sprint 3 Dietary Dependency Flow

```text
Dietary Definitions and Vendor UI
↓
Dietary Backend
↓
Student Filtering UI
```

### Sprint 4 Analytics Dependency Flow

```text
Analytics Backend / Data Foundation
↓
Analytics Dashboard Layout
↓
Sales Report / Peak Hours Report / Custom View
↓
CSV/PDF Export
↓
Testing and Final Documentation
```

---

## 8. Final Submission Artefacts

The final submission includes the following artefacts:

| Submission Item | Evidence / Location | Status |
|---|---|---|
| Hosted application | Public deployed website link | Completed |
| GitHub repository | Public repository link | Completed |
| README documentation | Main README and final submission README | Completed |
| Scrum methodology artefacts | Backlogs, burndown charts, stand-ups, retrospectives, and review evidence | Completed |
| Project plan | `docs/final-submission/additional-artifacts/01-project-plan.md` | Completed |
| Architecture diagram | `docs/final-submission/additional-artifacts/architecture-diagram/` | Completed |
| Design documents | `docs/final-submission/additional-artifacts/design-documents/` | Completed |
| Test plan and results | `docs/final-submission/additional-artifacts/04-test-plan-and-results.md` | Completed |
| Codecov test evidence | `docs/final-submission/additional-artifacts/test-plan-results/Codecov-Test-Evidence.docx` | Completed |
| Final submission form | Completed form with links and checklist | Completed |
| Screen recording video | Demonstration video under 6 minutes | Completed |
| Moodle submission | Final upload before deadline |Completed |

---

## 9. Final Deadline Checklist

| Task | Deadline | Status |
|---|---:|---|
| Complete Sprint 4 analytics feature | 22 May 2026 | Completed |
| Complete Scrum methodology documents | 22 May 2026 | Completed |
| Complete project plan | 22 May 2026 | Completed |
| Add architecture diagram | 22 May 2026 | Completed |
| Add design documents | 22 May 2026 | Completed |
| Add test plan and results | 22 May 2026 | Completed |
| Add Codecov test evidence | 22 May 2026 | Completed |
| Check hosted app link | 22 May 2026 | To be checked |
| Check GitHub repository link | 22 May 2026 | Completed |
| Add final video link | 22 May 2026 | Completed |
| Submit final Moodle form | 22 May 2026 | Completed |

---

## 10. Conclusion

The Campus Food Ordering Platform was planned and developed across four Scrum sprints.

- **Sprint 1** created the system foundation.
- **Sprint 2** added the ordering workflow.
- **Sprint 3** added payments and dietary filtering.
- **Sprint 4** added analytics, exports, testing evidence, and final submission artefacts.

This project plan shows the overall development path, the major milestones, and the main deliverables completed for the final submission.
