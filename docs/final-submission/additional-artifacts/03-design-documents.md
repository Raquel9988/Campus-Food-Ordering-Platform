# Design Documents

This document summarises the design documentation for the **Campus Food Ordering Platform**.

The design documents support the final submission by showing the system structure, user interactions, workflows, and feature behaviour from different UML views.

---

## 1. Design Document Folder

All design documents are stored in:

`docs/final-submission/additional-artifacts/design-documents/`

---

## 2. Included Design Documents

| Design Document | File | View / Purpose | Description |
|---|---|---|---|
| UML Activity Diagram | `UML Activity Diagram.png` | Process / Workflow View | Shows the full system workflow, including login, student ordering, dietary filtering, payment, vendor fulfilment, order tracking, order history, admin controls, and Sprint 4 analytics. |
| UML Class Diagram | `UML Class Diagram.jpeg` | Logical / Structural View | Shows the main system classes/entities and how they relate to each other, such as users, vendors, menu items, orders, payments, and analytics-related data. |
| UML Deployment Diagram | `UML Deployment Diagram.jpeg` | Physical / Deployment View | Shows how the system is deployed across the browser, Cloudflare Pages, Cloudflare Functions, Supabase, PayFast Sandbox, GitHub Actions, and Codecov. |
| Use Case Diagram | `Use Case Final Diagram.png` | User Interaction View | Shows what each user role can do in the system, including student, vendor, and admin actions. |
| UML Component Diagram | `UML Component Diagram.png` | Development View | Shows the main software components, including frontend modules, backend API workers, Supabase services, PayFast integration, analytics, and testing support. |
| UML Sequence Diagram | `UML Sequence Diagram.png` | Interaction View | Shows the order of messages between users, frontend pages, backend functions, Supabase, PayFast, vendor dashboard, and analytics/export features. |
| UML State Diagram | `UML State Diagram.png` | Logical View | Shows important system states, including user sessions, vendor approval states, and the order/payment/fulfilment lifecycle. |

---

## 3. Summary of Design Views

The design documents cover the system from multiple perspectives.

| UML View | Diagram Used | What It Explains |
|---|---|---|
| Process / Workflow View | Activity Diagram | How the system flows from login to ordering, payment, fulfilment, tracking, and analytics. |
| Logical / Structural View | Class Diagram and State Diagram | How the system data/entities are structured and how important objects move through different states. |
| User Interaction View | Use Case Diagram | What each user role can do in the system. |
| Interaction View | Sequence Diagram | How different parts of the system communicate during key scenarios. |
| Development View | Component Diagram | How the code and modules are organised into frontend, backend, database, payment, analytics, and testing components. |
| Deployment View | Deployment Diagram | How the system is hosted and connected across Cloudflare, Supabase, PayFast, GitHub Actions, and Codecov. |

---

## 4. Main System Areas Covered

The diagrams cover the following major features:

- User registration and login
- Student, vendor, and admin role-based access
- Vendor approval and suspension
- Vendor menu management
- Dietary tag management
- Student menu browsing and dietary filtering
- Cart management
- One-vendor cart restriction
- PayFast Sandbox payment flow
- Payment callback and payment status updates
- Paid-order visibility for vendors
- Vendor order fulfilment
- Order status updates
- Student active orders and order history
- Admin analytics dashboard
- Sales per vendor report
- Peak ordering hours report
- Custom analytics view
- CSV/PDF report export
- Cloudflare Pages and Functions deployment
- Supabase authentication and database storage
- GitHub Actions and Codecov testing evidence

---

## 5. Status

Completed.

The final design document folder now includes the required UML diagrams for the Campus Food Ordering Platform final submission.