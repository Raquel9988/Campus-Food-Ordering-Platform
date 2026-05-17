\# Project Plan



This document outlines the high-level project plan for the \*\*Campus Food Ordering Platform\*\*.  

It summarises the overall project goal, sprint milestones, planned deadlines, main deliverables, and final submission preparation.



\---



\# 1. Project Overview



| Item | Details |

|---|---|

| Project Name | Campus Food Ordering Platform |

| Project Type | Web-based food ordering system |

| Development Methodology | Scrum |

| Main Users | Students, Vendors, Admins |

| Final Submission Deadline | 22 May 2026 |



\## Project Purpose



The purpose of the Campus Food Ordering Platform is to allow students to browse campus food vendors, view menus, place orders, pay for food, track active orders, and view completed order history.



The platform also supports vendors and admins:



\- \*\*Students\*\* use the system to browse food, order, pay, and track orders.

\- \*\*Vendors\*\* use the system to manage menu items and process paid orders.

\- \*\*Admins\*\* use the system to manage vendors and view analytics reports.



\---



\# 2. Overall Project Goal



The overall goal of the project is to build a complete campus food ordering platform that supports:



\- User registration and login

\- Student, vendor, and admin roles

\- Vendor menu management

\- Student cart and order placement

\- Vendor order management

\- Order status tracking

\- Online payments

\- Dietary filtering

\- Admin analytics

\- Report exporting

\- Public deployment

\- Clear project documentation and Scrum evidence



\---



\# 3. High-Level Project Timeline



| Sprint / Phase | Dates | Main Goal | Deadline / Milestone | Status |

|---|---|---|---|---|

| Sprint 1 | 30 March 2026 – 13 April 2026 | Build the system foundation | Authentication, roles, menus, and admin controls ready for review | Completed |

| Sprint 2 | 15 April 2026 – 20 April 2026 | Build the ordering workflow | Cart, orders, vendor dashboard, tracking, and notifications working | Completed |

| Sprint 3 | 24 April 2026 – 11 May 2026 | Add payments and dietary features | PayFast payment flow and dietary filtering integrated | Completed |

| Sprint 4 | 12 May 2026 – 22 May 2026 | Add analytics and prepare final submission | Analytics reports, exports, documentation, and evidence prepared | In Progress / Finalising |

| Final Submission | 22 May 2026 | Submit final project | Hosted app, GitHub repo, video, Scrum artefacts, and additional artefacts submitted | Pending |



\---



\# 4. Major Project Milestones



| Milestone | Description | Target Date | Status |

|---|---|---|---|

| Milestone 1 | Project setup, user roles, login/register functionality, and menu foundation | 13 April 2026 | Completed |

| Milestone 2 | Student cart, order placement, vendor order dashboard, and order tracking | 20 April 2026 | Completed |

| Milestone 3 | Online payment system and dietary filtering system | 11 May 2026 | Completed |

| Milestone 4 | Admin analytics dashboard and report export functionality | 22 May 2026 | In Progress / Finalising |

| Milestone 5 | Final project documentation, evidence, hosted app, GitHub repo, and video submission | 22 May 2026 | Pending |



\---



\# 5. Sprint 1 Plan



\## Sprint 1 Goal



Sprint 1 focused on creating the foundation of the application.



The main focus areas were:



\- User verification

\- Menu management

\- Role-based access

\- Basic admin controls



\## Sprint 1 Planned Deliverables



| Deliverable | Description | Status |

|---|---|---|

| Student authentication | Students can sign up and log in | Completed |

| Vendor authentication | Vendors can register and log in | Completed |

| Admin authentication | Admins can access protected admin pages | Completed |

| Role-based access | Students, vendors, and admins are directed to the correct pages | Completed |

| Vendor approval controls | Admins can approve or suspend vendors | Completed |

| Menu creation | Vendors can add and edit menu items | Completed |

| Menu display | Students can view menu items and availability | Completed |

| GitHub setup | Repository, issues, branches, and project board started | Completed |

| Basic CI/CD setup | Automated checks prepared using GitHub | Completed |



\## Sprint 1 Outcome



Sprint 1 created the basic foundation of the platform.  

The team also learned that task splitting, communication, and sprint review preparation needed to improve in later sprints.



\---



\# 6. Sprint 2 Plan



\## Sprint 2 Goal



Sprint 2 focused on building the main ordering workflow.



The main focus areas were:



\- Cart functionality

\- Order placement

\- Database and backend order logic

\- Vendor order dashboard

\- Order status updates

\- Student order tracking

\- Real-time updates and notifications



\## Sprint 2 Planned Deliverables



| Deliverable | Description | Status |

|---|---|---|

| Cart functionality | Students can add, remove, and update cart items | Completed |

| Place order functionality | Students can submit food orders | Completed |

| Orders database | Orders and order items are stored | Completed |

| Vendor orders dashboard | Vendors can view incoming orders | Completed |

| Order status management | Vendors can update order progress | Completed |

| Student order tracking | Students can view order progress | Completed |

| Notifications | Students can be notified when order status changes | Completed |



\## Sprint 2 Dependency Plan



The planned dependency order was:



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

Real-Time Updates and Notifications

```



\## Sprint 2 Outcome

Sprint 2 improved the ordering flow of the system.  

It also improved team organisation because tasks were split more clearly and dependencies were identified before implementation.



\---



\# 7. Sprint 3 Plan



\## Sprint 3 Goal



Sprint 3 focused on adding two major features:



\- Online payments

\- Dietary system



\## Sprint 3 Planned Deliverables



| Deliverable | Description | Status |

|---|---|---|

| Payment API | Connect the system to a payment provider | Completed |

| PayFast Sandbox | Allow test payments without real money | Completed |

| Payment notify endpoint | Receive payment confirmation | Completed |

| Order and payment linking | Only paid orders are processed | Completed |

| Payment UI | Students can complete checkout | Completed |

| One-vendor cart rule | Students can only order from one vendor at a time | Completed |

| Active Orders | Students can view current orders | Completed |

| Order History | Students can view completed orders | Completed |

| Dietary tags | Vendors can assign dietary tags to menu items | Completed |

| Dietary backend | Dietary data is stored and retrieved | Completed |

| Dietary filtering | Students can filter menu items by dietary needs | Completed |



\## Sprint 3 Dependency Plan



Payment feature dependency order:



```text

Payment API

↓

Order and Payment Logic

↓

Payment UI

```



Dietary system dependency order:



```text

Dietary Definitions and Vendor UI

↓

Dietary Backend

↓

Student Filtering UI

```



\## Sprint 3 Outcome



Sprint 3 successfully added the payment and dietary systems.  

The sprint also showed that GitHub branch management needed improvement because working from outdated branches caused merging difficulties.



\---



\# 8. Sprint 4 Plan



\## Sprint 4 Goal



Sprint 4 focuses on adding an admin analytics section and preparing the final project submission.



The analytics section includes:



\- Sales per vendor over time

\- Peak ordering hours

\- Custom analytics view

\- Export reports as CSV or PDF



\## Sprint 4 Planned Deliverables



| Deliverable | Description | Status |

|---|---|---|

| Analytics backend/data foundation | Prepare clean analytics data from valid paid orders | Completed |

| Analytics dashboard layout | Create one admin dashboard page for all reports | In Progress / Finalising |

| Sales per vendor report | Show sales grouped by vendor and date | In Progress / Finalising |

| Peak ordering hours report | Show busiest ordering times | In Progress / Finalising |

| Custom analytics view | Allow admins to filter analytics data | In Progress / Finalising |

| Export reports | Allow CSV/PDF exports | In Progress / Finalising |

| Final documentation | Prepare Scrum evidence and final artefacts | In Progress |



\## Sprint 4 Dependency Plan



The planned dependency order is:



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



\## Sprint 4 Outcome So Far



Sprint 4 is still being finalised.  

The analytics backend/data foundation has been completed, and the team is connecting the remaining analytics reports and export features to the dashboard.



\---



\# 9. Final Submission Plan



The final submission must include the following:



| Final Submission Item | Description | Status |

|---|---|---|

| Screen recording video | A video demonstration of the application, under 6 minutes | To be completed / checked |

| Hosted application link | A public link to the deployed application | To be checked |

| GitHub repository link | A public repository containing code and documentation | To be checked |

| README file | Instructions for setup, running, and navigating the project | To be checked |

| Scrum methodology evidence | Backlogs, burndown charts, retrospectives, stand-ups, and review evidence | Completed |

| Project plan | High-level project plan with milestones and deadlines | Completed |

| Architecture diagram | Diagram showing system components and interactions | To be added |

| Design documents | UML diagrams, class diagrams, sequence diagrams, and wireframes | To be added |

| Test plan and results | Testing strategy, test cases, results, screenshots, or logs | To be added |

| Final submission form | Moodle submission form with all required links | To be completed |

| Moodle submission | Final upload before deadline | Pending |



\---



\# 10. Final Deadline Checklist



| Task | Deadline | Status |

|---|---|---|

| Complete Sprint 4 analytics feature | 22 May 2026 | In Progress / Finalising |

| Complete Scrum methodology documents | 22 May 2026 | Completed |

| Complete project plan | 22 May 2026 | Completed |

| Add architecture diagram | 22 May 2026 | To be added |

| Add design documents | 22 May 2026 | To be added |

| Add test plan and results | 22 May 2026 | To be added |

| Check hosted app link | 22 May 2026 | To be checked |

| Check GitHub repository link | 22 May 2026 | To be checked |

| Upload final video | 22 May 2026 | To be completed / checked |

| Submit final Moodle form | 22 May 2026 | Pending |



\---



\# 11. Conclusion



The project was planned across four sprints.



\- Sprint 1 created the system foundation.

\- Sprint 2 added the ordering workflow.

\- Sprint 3 added payments and dietary filtering.

\- Sprint 4 added analytics and final submission preparation.



This project plan shows the overall development path, the main deadlines, and the major milestones needed to complete and submit the Campus Food Ordering Platform.

