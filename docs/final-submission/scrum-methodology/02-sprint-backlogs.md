\# Sprint Backlogs



This document summarises the sprint backlogs for the Campus Food Ordering Platform.



Each sprint backlog contains the main user stories selected for that sprint, the assigned feature area, estimated effort, dependencies, and final status.



Story points were recorded as estimated effort values for the final Scrum documentation. Higher story points indicate more complex or dependency-heavy work.



\---



\# Sprint 1 Backlog



\## Sprint 1 Goal



The goal of Sprint 1 was to build the foundation of the system by focusing on user verification and menu management.



Sprint 1 focused on:



\- Student authentication

\- Vendor authentication

\- Admin authentication

\- Role-based access

\- Vendor menu management

\- Menu display and availability

\- Admin vendor controls

\- GitHub Issues and project board setup

\- Basic CI/CD setup



\## Sprint 1 Backlog Table



| ID | Sprint Backlog Item | Assigned Area | Story Points | Dependencies | Status |

|---|---|---|---:|---|---|

| S1-01 | Student signup and login | Student Authentication | 5 | None | Done |

| S1-02 | Vendor signup and login | Vendor Authentication | 5 | None | Done |

| S1-03 | Admin login and role-based access | Admin Authentication | 5 | Authentication setup | Done |

| S1-04 | Store and check user roles | Role Management | 5 | Authentication setup | Done |

| S1-05 | Vendor approval and suspension | Admin Controls | 8 | Vendor accounts and admin access | Done |

| S1-06 | Add and edit menu items | Menu Creation | 8 | Vendor login | Done |

| S1-07 | Display menu items and availability | Menu Display | 5 | Menu creation | Done |

| S1-08 | GitHub Issues and project board setup | Scrum / Project Management | 3 | Repository setup | Done |

| S1-09 | Basic CI/CD setup | DevOps | 5 | GitHub repository | Done |



\## Sprint 1 Dependency Notes



Authentication needed to be completed early because role-based access depended on it.



Vendor menu features depended on vendors being able to log in.



Admin controls depended on vendor accounts existing.



GitHub Issues and the project board were used to track user stories and tasks.



\## Sprint 1 Outcome



By the end of Sprint 1, the team had created the foundation for the application. The system supported the core authentication and role-based access structure, and the first menu management features were implemented.



\---



\# Sprint 2 Backlog



\## Sprint 2 Goal



The goal of Sprint 2 was to build the ordering workflow.



Sprint 2 focused on:



\- Cart functionality

\- Order placement

\- Database and backend order logic

\- Vendor order dashboard

\- Order status updates

\- Student order tracking

\- Real-time updates and notifications



\## Sprint 2 Backlog Table



| ID | Sprint Backlog Item | Assigned Area | Story Points | Dependencies | Status |

|---|---|---|---:|---|---|

| S2-01 | Create orders table and order items table | Database / Backend | 8 | None | Done |

| S2-02 | Store orders and order items | Database / Backend | 8 | Orders tables | Done |

| S2-03 | Fetch orders by student or vendor role | Database / Backend | 5 | Orders data | Done |

| S2-04 | Secure order data using access rules | Database / Backend | 8 | Orders tables and roles | Done |

| S2-05 | Add items to cart | Student Cart | 5 | Menu display | Done |

| S2-06 | Update item quantities and remove items | Student Cart | 5 | Cart state | Done |

| S2-07 | Place an order | Student Orders | 8 | Cart and database logic | Done |

| S2-08 | Handle multi-vendor orders | Student Orders | 8 | Cart and order backend | Done |

| S2-09 | Vendor orders dashboard | Vendor Orders | 8 | Orders stored in database | Done |

| S2-10 | Display vendor order details | Vendor Orders | 5 | Vendor orders dashboard | Done |

| S2-11 | Update order status | Order Status | 5 | Vendor dashboard and database update logic | Done |

| S2-12 | Enforce valid order status flow | Order Status | 5 | Status update logic | Done |

| S2-13 | Student My Orders page | Student Tracking | 5 | Orders stored in database | Done |

| S2-14 | Student order status and history | Student Tracking | 5 | Order status updates | Done |

| S2-15 | Real-time order updates | Notifications | 8 | Database events and order updates | Done |

| S2-16 | Ready-for-pickup notifications | Notifications | 5 | Real-time updates | Done |



\## Sprint 2 Dependency Notes



The main Sprint 2 dependency flow was:



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



Person 2’s database and backend work was the foundation because orders had to exist before the cart, vendor dashboard, tracking, and notifications could fully work.



\## Sprint 2 Outcome



By the end of Sprint 2, the team had implemented the main order workflow. Students could place orders, vendors could view and update orders, and students could track their order progress.



\---



\# Sprint 3 Backlog



\## Sprint 3 Goal



The goal of Sprint 3 was to add online payments and dietary features.



Sprint 3 focused on:



\- PayFast / payment API

\- Linking payments to orders

\- Payment user interface

\- One-vendor cart rule

\- Active orders and order history

\- Dietary tag selection

\- Dietary backend storage

\- Student dietary filtering

\- Updated UML diagrams

\- Integration testing



\## Sprint 3 Backlog Table



| ID | Sprint Backlog Item | Assigned Area | Story Points | Dependencies | Status |

|---|---|---|---:|---|---|

| S3-01 | Payment API / PayFast integration | Payments Backend | 13 | None | Done |

| S3-02 | PayFast Sandbox/test mode | Payments Backend | 8 | Payment provider choice | Done |

| S3-03 | PayFast notify endpoint | Payments Backend | 8 | Payment API | Done |

| S3-04 | Link successful payments to orders | Order + Payment Logic | 13 | Payment API | Done |

| S3-05 | Prevent unpaid orders from being processed | Order + Payment Logic | 8 | Payment status fields | Done |

| S3-06 | Payment user interface | Payment UI | 8 | Payment/order backend | Done |

| S3-07 | One-vendor cart rule | Student Cart | 5 | Existing cart | Done |

| S3-08 | Active Orders page | Student Orders | 5 | Payment/order statuses | Done |

| S3-09 | Order History page | Student Orders | 5 | Complete order status | Done |

| S3-10 | Dietary tag definitions | Dietary System | 3 | None | Done |

| S3-11 | Vendor dietary tag UI | Dietary Vendor UI | 5 | Tag definitions | Done |

| S3-12 | Store dietary tags in backend/database | Dietary Backend | 8 | Vendor dietary UI | Done |

| S3-13 | Student dietary filtering UI | Dietary Filtering | 8 | Dietary backend | Done |

| S3-14 | Update UML diagrams for payment and dietary system | Documentation | 5 | Completed system flow | Done |

| S3-15 | Sprint 3 integration testing | Testing | 5 | Completed features | Done |



\## Sprint 3 Dependency Notes



The payment dependency flow was:



Payment API  

↓  

Order and Payment Logic  

↓  

Payment UI  



The dietary dependency flow was:



Dietary Definitions and Vendor UI  

↓  

Dietary Backend  

↓  

Student Filtering UI  



The team agreed that Person 2 and Person 4 had to start first because their work created the foundation for other members.



\## Sprint 3 Outcome



By the end of Sprint 3, the team had completed and integrated the payment system and dietary system. Students could complete payments, vendors only processed paid orders, and menu items could be filtered using dietary requirements.



\---



\# Sprint 4 Backlog



\## Sprint 4 Goal



The goal of Sprint 4 was to add an admin analytics section and finalise the project for submission.



Sprint 4 focused on:



\- Analytics data preparation

\- Analytics dashboard page

\- Sales per vendor over time

\- Peak ordering hours

\- Custom analytics view

\- Exporting reports as CSV or PDF

\- Analytics testing

\- Final submission documentation



\## Sprint 4 Backlog Table



| ID | Sprint Backlog Item | Assigned Area | Story Points | Dependencies | Status |

|---|---|---|---:|---|---|

| S4-01 | Prepare clean analytics data/API | Analytics Backend | 13 | Paid orders and order data | Done |

| S4-02 | Create analytics dashboard page/layout | Analytics UI | 8 | Can start with mock data | Done |

| S4-03 | Sales per vendor over time report | Sales Report | 8 | Analytics data and dashboard layout | Done |

| S4-04 | Peak ordering hours report | Time Report | 8 | Analytics data and dashboard layout | Done |

| S4-05 | Custom analytics view with filters | Custom Report | 8 | Analytics data and dashboard layout | Done |

| S4-06 | Export reports as CSV/PDF | Export Feature | 8 | Report data from sales, peak hours, and custom view | Done |

| S4-07 | Analytics testing | Testing | 5 | Completed analytics reports | Done |

| S4-08 | Final submission documentation | Documentation | 5 | Completed project artefacts | In Progress |



\## Sprint 4 Dependency Notes



The Sprint 4 dependency flow was:



Analytics Backend / Data Foundation  

↓  

Analytics Dashboard Layout  

↓  

Sales Report / Peak Hours Report / Custom View  

↓  

CSV/PDF Export  

↓  

Testing and Final Documentation  



Person 1 started first because all analytics reports depended on clean paid-order data.



Person 2 created the dashboard layout so that Persons 3, 4, and 5 had clear sections for their reports.



Persons 3, 4, and 5 worked on the different report types.



Person 6 completed the export functionality after the report data formats were clear.



\## Sprint 4 Outcome



By the end of Sprint 4, the team had added analytics functionality for admins, including sales reporting, peak ordering hour reporting, custom filtered analytics, and report export functionality.



\---



\# Overall Sprint Backlog Summary



| Sprint | Main Goal | Main Deliverables | Status |

|---|---|---|---|

| Sprint 1 | Build authentication and menu foundation | Login, registration, roles, menu management, admin controls | Done |

| Sprint 2 | Build ordering workflow | Cart, orders, vendor dashboard, status tracking, notifications | Done |

| Sprint 3 | Add payments and dietary system | PayFast, paid orders, dietary tags, dietary filtering | Done |

| Sprint 4 | Add analytics and finalise project | Analytics reports, exports, final documentation | In Progress |



\---



\# Notes on Story Points



The story points in this document are final documentation estimates based on task complexity, dependencies, and implementation effort.



The estimate scale used was:



| Story Points | Meaning |

|---:|---|

| 3 | Small task with low complexity |

| 5 | Medium task with some logic or UI work |

| 8 | Large task with important functionality or dependencies |

| 13 | Very large task with major backend, payment, or shared system responsibility |



These estimates help show how the team understood and planned the relative effort of each sprint backlog item.

