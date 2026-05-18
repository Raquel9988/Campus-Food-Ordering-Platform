# Campus Food Ordering Platform

The **Campus Food Ordering Platform** is a web-based food ordering system designed for a university campus environment. The platform allows students to browse approved campus food vendors, view menus, place orders, pay online, track order progress, and view completed order history.

The system also supports vendor and admin roles. Vendors can manage their menus and process paid orders, while admins can approve vendors and view analytics reports.

---

## Live Project Links

| Item | Link |
|---|---|
| Public Hosted Application | https://campus-food-ordering.pages.dev |
| GitHub Pages Preview | https://raquel9988.github.io/Campus-Food-Ordering-Platform/ |
| Repository | https://github.com/Raquel9988/Campus-Food-Ordering-Platform |
| Final Submission Documentation | `docs/final-submission/README.md` |

---

## Project Overview

The project was developed as part of the **Software Design Project 2026**.

The main goal was to build a complete campus food ordering platform that supports:

- Student, vendor, and admin roles
- User registration and login
- Vendor approval and suspension
- Menu management
- Cart and order placement
- Online payments
- Order tracking
- Dietary and allergen filtering
- Admin analytics
- CSV/PDF report exporting
- Scrum documentation and final project evidence

---

## User Roles

The system has three main user roles.

| Role | Description |
|---|---|
| Student | Can browse approved vendors, view menus, add items to cart, pay online, track active orders, and view order history. |
| Vendor | Can manage menu items, assign dietary tags, view paid orders, and update order statuses. |
| Admin | Can approve or suspend vendors and view analytics reports. |

---

## Main Features

### Student Features

Students can:

- Register and log in
- Browse approved vendors
- View vendor menus
- Filter menu items by dietary requirements
- Add menu items to cart
- Update or remove cart items
- Follow the one-vendor cart rule
- Start the online payment process
- Track active orders
- View completed orders in order history
- Receive order status updates

---

### Vendor Features

Vendors can:

- Register and log in
- Access a vendor dashboard
- Add menu items
- Update menu item details
- Mark menu items as available or sold out
- Assign dietary tags to menu items
- View paid incoming orders only
- Update order statuses through the correct flow:

```text
received → preparing → ready → complete
```

Vendors only receive orders after successful payment.

---

### Admin Features

Admins can:

- Log in to the admin area
- Approve pending vendors
- Suspend vendors
- View analytics reports
- View sales per vendor over time
- View peak ordering hours
- Use a custom analytics view with filters
- Export reports as CSV or PDF

---

## Requirement Coverage

| Requirement | How It Is Covered |
|---|---|
| User Verification | The system supports three user roles: student, vendor, and admin. Authentication and role-based access are used to direct users to the correct pages. |
| Menu Management | Vendors can create and update menu items, including names, descriptions, prices, availability, and dietary information. Admins can approve or suspend vendors. |
| Order Management | Students can place orders, and vendors can manage incoming paid orders by updating preparation statuses. |
| Order Tracking | Students can view active orders, see order status updates, and access completed orders in order history. |
| Payments | The system integrates with PayFast Sandbox for online payment flow. Orders are linked to payment status. |
| SA Data Integration | Menu items include dietary and allergen information such as halal, vegan, vegetarian, gluten-free, and nut-free. |
| Analytics | Admins can view sales per vendor, peak ordering hours, custom analytics, and export reports as CSV/PDF. |

---

## Technology Stack

| Area | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| Backend/API Logic | Cloudflare Functions / Workers |
| Hosting | Cloudflare Pages |
| Authentication | Supabase Auth |
| Database | Supabase Database |
| Payments | PayFast Sandbox |
| Testing | Vitest / automated tests |
| CI/CD | GitHub Actions |
| Coverage Reporting | Codecov |
| Version Control | Git and GitHub |

---

## Project Structure

```text
Campus-Food-Ordering-Platform/
├── auth/
│   ├── login.js
│   └── register.js
│
├── student/
│   ├── student-dashboard.js
│   ├── student-menu.js
│   ├── student-cart.js
│   └── my-orders.js
│
├── vendor/
│   ├── vendor-dashboard.js
│   ├── menuCreation.js
│   └── orders.js
│
├── adminControls/
│   ├── analytics.html
│   ├── analytics.css
│   ├── analytics.js
│   ├── sales-report.js
│   ├── peak-hours-report.js
│   ├── custom-view.js
│   └── export-reports.js
│
├── functions/
│   └── api/
│       ├── payment.js
│       ├── analytics.js
│       └── payfast/
│           └── notify.js
│
├── tests/
│   └── test files and mocks
│
├── docs/
│   └── final-submission/
│       ├── README.md
│       ├── scrum-methodology/
│       └── additional-artifacts/
│
├── index.html
├── index.css
├── index.js
├── package.json
└── README.md
```

---

## Payment Flow

The platform uses a PayFast Sandbox payment flow.

The general payment process is:

```text
Student adds items to cart
↓
Student clicks checkout
↓
System validates cart
↓
Pending order is created
↓
Payment request is sent to the Payment API
↓
Student is redirected to PayFast Sandbox
↓
PayFast sends callback/notification
↓
System updates payment status
↓
Paid order becomes visible to vendor
```

Important payment rules:

- Students may only order from one vendor at a time.
- Vendors only see paid orders.
- Failed or cancelled payments do not become active vendor orders.
- Successful payments update the order to a paid/received state.

---

## Order Status Flow

The order lifecycle follows this flow:

```text
payment_pending
↓
paid / received
↓
preparing
↓
ready
↓
complete
↓
order history
```

Students can track active orders until the order is completed. Once the order is completed or collected, it moves to order history.

---

## Dietary and Allergen Support

The platform supports dietary and allergen information for menu items.

Examples include:

- Halal
- Vegan
- Vegetarian
- Gluten-free
- Nut-free
- Custom dietary tags

Vendors assign dietary tags to menu items, and students can filter menu items based on their dietary needs.

---

## Analytics Features

The admin analytics section includes:

- Sales per vendor over time
- Peak ordering hours
- Custom analytics view
- CSV/PDF report export

Analytics are based on valid paid orders only. Failed, cancelled, or unpaid orders are excluded from analytics calculations.

---

## Testing and Code Coverage

The project includes manual testing, acceptance testing, automated testing, and Codecov coverage reporting.

Latest Codecov results for the `main` branch:

| Metric | Result |
|---|---:|
| Overall coverage | 81.42% |
| Covered lines | 1420 of 1744 |
| Missed lines | 324 |
| Coverage trend | +100.00% |

Coverage by main folder:

| Folder / Area | Coverage |
|---|---:|
| auth | 82.56% |
| functions/api | 92.03% |
| student | 74.39% |
| tests/mocks | 11.11% |
| vendor | 93.33% |

Detailed testing evidence is stored in:

```text
docs/final-submission/additional-artifacts/test-plan-results/Codecov-Test-Evidence.pdf
```

---

## Scrum Methodology

The project was developed using Scrum across four sprints.

| Sprint | Main Focus | Status |
|---|---|---|
| Sprint 1 | User verification, menu management, role-based access, and admin controls | Completed |
| Sprint 2 | Cart, order placement, vendor dashboard, order tracking, and notifications | Completed |
| Sprint 3 | Online payments and dietary filtering | Completed |
| Sprint 4 | Admin analytics, report exporting, testing evidence, UML diagrams, and final submission preparation | Completed |

Scrum artefacts are stored in:

```text
docs/final-submission/scrum-methodology/
```

This includes:

- Product backlog
- Sprint backlogs
- Burndown charts
- Sprint retrospectives
- Daily stand-up summaries
- Sprint review evidence
- Combined meeting evidence

---

## Final Submission Documentation

The final submission documentation is stored in:

```text
docs/final-submission/
```

Important files include:

| Document | Location |
|---|---|
| Final Submission README | `docs/final-submission/README.md` |
| Product Backlog | `docs/final-submission/scrum-methodology/01-product-backlog.md` |
| Sprint Backlogs | `docs/final-submission/scrum-methodology/02-sprint-backlogs.md` |
| Burndown Charts | `docs/final-submission/scrum-methodology/03-burndown-charts.md` |
| Retrospectives | `docs/final-submission/scrum-methodology/04-retrospectives.md` |
| Daily Stand-Ups | `docs/final-submission/scrum-methodology/05-daily-standups.md` |
| Sprint Review Evidence | `docs/final-submission/scrum-methodology/06-sprint-review-evidence.md` |
| Project Plan | `docs/final-submission/additional-artifacts/01-project-plan.md` |
| Architecture Diagram | `docs/final-submission/additional-artifacts/02-architecture-diagram.md` |
| Design Documents | `docs/final-submission/additional-artifacts/03-design-documents.md` |
| Test Plan and Results | `docs/final-submission/additional-artifacts/04-test-plan-and-results.md` |

---

## Design Documentation

The project includes several UML and design diagrams:

- UML Activity Diagram
- UML Class Diagram
- UML Deployment Diagram
- Use Case Diagram
- UML Component Diagram
- UML Sequence Diagram
- UML State Diagram
- Architecture Diagram

Design documents are stored in:

```text
docs/final-submission/additional-artifacts/design-documents/
```

The architecture diagram is stored in:

```text
docs/final-submission/additional-artifacts/architecture-diagram/
```

---

## How to Run the Project Locally

Clone the repository:

```bash
git clone https://github.com/Raquel9988/Campus-Food-Ordering-Platform.git
```

Move into the project folder:

```bash
cd Campus-Food-Ordering-Platform
```

Install dependencies:

```bash
npm install
```

Run tests:

```bash
npm test
```

Run coverage:

```bash
npm run coverage
```

Open the project locally using a local server or by opening the HTML files in a browser.

---

## Deployment

The project is publicly deployed using Cloudflare Pages:

```text
https://campus-food-ordering.pages.dev
```

The project also has a GitHub Pages preview:

```text
https://raquel9988.github.io/Campus-Food-Ordering-Platform/
```

---

## Team Members

| Member | Student Number |
|---|---|
| Raquel de Franca | 1609751 |
| Keitumetse Julius | 2730098 |
| Lesego Ngobeni | 2814875 |
| Ntandoyenkosi Nemadozi | 2812316 |
| Sthembile | 2611748 |
| Member 6 | To be added if applicable |

---

## Project Status

The main implementation is complete.

Completed areas include:

- Authentication and role-based access
- Vendor approval and suspension
- Menu management
- Cart and ordering
- Payment flow
- Order tracking
- Dietary filtering
- Admin analytics
- CSV/PDF exports
- Testing evidence
- Scrum methodology documentation
- UML/design documentation
- Final submission artefacts

Remaining final submission tasks:

- Add the final screen-recording video link
- Check all public links before Moodle submission
- Submit final form via Moodle

---

## Conclusion

The **Campus Food Ordering Platform** provides a complete campus food ordering workflow for students, vendors, and admins.

It supports browsing, ordering, payment, dietary filtering, vendor order fulfilment, admin analytics, and final reporting. The project also includes Scrum documentation, testing evidence, UML diagrams, and final submission artefacts to support the Software Design Project requirements.
