# Architecture Diagram

This folder contains the final architecture diagram for the **Campus Food Ordering Platform**.

The architecture diagram gives a high-level visual explanation of how the system is structured. It shows how the student, vendor, and admin interfaces connect to the frontend website, backend API logic, Supabase services, PayFast Sandbox, analytics reports, exports, testing tools, and deployment workflow.

The purpose of this diagram is to make the system architecture easy to understand for marking, documentation, and final submission.

---

## Diagram File

The final architecture diagram is stored in:

```text
docs/final-submission/additional-artifacts/architecture-diagram/Campus Food Ordering Architecture.png
```

---

## What the Diagram Shows

The architecture diagram includes the following main parts of the system:

- Student frontend
- Vendor frontend
- Admin frontend
- Shared login and role-based pages
- Cloudflare Pages static hosting
- Cloudflare Functions / Worker API endpoints
- Supabase authentication
- Supabase database
- PayFast Sandbox payment flow
- Payment callback and payment status update flow
- Order status flow
- Active order notification and student pickup acknowledgement logic
- Analytics API
- Analytics reports
- CSV/PDF export functionality
- GitHub repository workflow
- GitHub Actions automated tests
- Codecov test coverage reporting
- Cloudflare Pages deployment

---

## System Overview

The Campus Food Ordering Platform is a web-based food ordering system for campus users. It supports three main user roles: students, vendors, and admins.

Students use the platform to browse approved vendors, filter menu items by dietary requirements, add items to a cart, pay for orders, and track their order progress.

Vendors use the platform to manage menu items, assign dietary tags, view paid orders, and update order statuses as orders move through preparation.

Admins use the platform to approve or suspend vendors and view analytics reports such as sales per vendor, peak ordering hours, and custom filtered reports.

The system is built using vanilla **HTML**, **CSS**, and **JavaScript** on the frontend. The website is hosted using **Cloudflare Pages**, while backend API logic runs through **Cloudflare Functions / Workers**. **Supabase** is used for authentication and database storage, and **PayFast Sandbox** is used for the payment flow.

---

## Architecture Layers

The diagram is organised into five main layers.

---

## 1. Users / Roles

The top layer shows the three main user roles in the system:

- **Student**
- **Vendor**
- **Admin**

Each role uses the system differently.

Students interact with the ordering features. Vendors interact with menu and order management features. Admins interact with vendor approval and analytics features.

This role separation is important because the system uses role-based access to direct users to the correct pages after login.

---

## 2. Frontend Website

The frontend website is hosted through **Cloudflare Pages**. It contains the student, vendor, admin, and shared pages.

### Student Frontend

The student frontend includes:

- `student-dashboard.html/js`
- `student-cart.html/js`
- `my-orders.html/js`
- vendor browsing
- dietary filtering
- active order notification
- student pickup acknowledgement

Students can browse vendors, apply dietary filters, add items to a cart, pay, and track orders. When an order is ready, the student receives an Active Orders notification. The student must acknowledge pickup before the order is moved into Order History.

### Vendor Frontend

The vendor frontend includes:

- vendor dashboard pages
- vendor menu pages
- vendor orders pages
- add/update menu item functionality
- dietary tag submission
- paid order viewing
- order preparation updates
- ready status updates
- student pickup notification logic

Vendors only see paid orders. They can update orders from **received** to **preparing**, and then from **preparing** to **ready**.

The vendor can notify the student that an order is ready for pickup, but this does **not** complete the order immediately.

### Admin Frontend

The admin frontend includes:

- `admin-controls.html`
- `analytics.html`
- analytics CSS and JavaScript modules
- analytics reports
- export modules

Admins can approve or suspend vendors and view analytics reports.

### Shared Pages

Shared pages include:

- login pages
- registration pages
- role-based navigation
- common frontend logic

These pages help ensure that students, vendors, and admins are redirected to the correct part of the system.

### Static Hosting

The frontend website is deployed as a static site through **Cloudflare Pages**. The site is built using vanilla HTML, CSS, and JavaScript.

---

## 3. API / Backend Logic

The backend logic is handled using **Cloudflare Functions / Workers**.

### Payment API Worker

The Payment API Worker is located at:

```text
functions/api/payment.js
```

It creates the PayFast Sandbox payment request and returns the checkout redirect or payment status to the frontend.

### PayFast Notify Worker

The PayFast Notify Worker is located at:

```text
functions/api/payfast/notify.js
```

It receives the PayFast payment callback, verifies the callback, and updates the order payment fields in the database.

### Analytics API Worker

The Analytics API Worker is located at:

```text
functions/api/analytics.js
```

It retrieves valid paid order data and returns analytics/order data for reports.

### Frontend Business Logic

The frontend also contains important business logic, including:

- one-vendor cart rule
- order status rules
- dietary filtering
- CSV/PDF export support

The one-vendor cart rule ensures that students can only checkout items from one vendor at a time.

---

## 4. External Services & Database

The system uses external services and database storage to support authentication, payments, analytics, and order management.

### Supabase Auth

Supabase Auth stores and verifies user accounts. It supports role-based access for:

- students
- vendors
- admins

### Supabase Database

The Supabase database stores the main platform data, including:

- users
- vendors
- menu items
- dietary tags
- orders
- order items
- payment fields

This database is used by the frontend and backend logic to store and retrieve system data.

### PayFast Sandbox

PayFast Sandbox is used as the payment gateway during checkout and testing.

When a student clicks Pay Now, the frontend sends a payment request to the backend Payment API Worker. The student is then redirected to PayFast Sandbox. After payment, PayFast sends a callback to the PayFast Notify Worker, which updates the order payment status.

### Analytics Reports

The analytics reports use valid paid order data from the database.

The analytics section supports:

- sales per vendor over time
- peak ordering hours
- custom analytics views
- CSV/PDF exports

### Analytics Rule

Analytics only counts valid paid orders. Failed, cancelled, or unpaid orders are excluded from sales and reporting calculations.

---

## Order Status Flow

The order status flow shown in the architecture diagram is:

```text
payment_pending
↓
paid
↓
received
↓
preparing
↓
ready
↓
complete
↓
order history
```

The important updated rule is:

```text
Vendor notification does not complete the order.
The order stays READY until the student acknowledges pickup.
```

This means that when the vendor marks an order as ready and notifies the student, the order remains in the **ready** state. The student must open Active Orders, read the ready-for-pickup message, and acknowledge pickup. Only after the student acknowledges pickup does the system move the order to **complete** and then into **Order History**.

This prevents the order from disappearing before the student has seen the ready notification.

---

## 5. Development & Deployment

The project includes a development and deployment workflow.

### GitHub Repository

The GitHub repository is used for:

- team branches
- pull requests
- protected main branch
- issue tracking

### GitHub Actions + Tests

GitHub Actions runs automated checks before merging and deployment. This includes:

- installing dependencies
- running tests
- running coverage checks

### Codecov

Codecov receives the coverage report from CI and displays the project’s testing progress.

### Cloudflare Pages

Cloudflare Pages deploys the final static website and connects the frontend to the Worker API endpoints.

---

## Full System Flow Summary

The overall architecture works as follows:

1. Users access the platform through the browser.
2. The frontend website is served through Cloudflare Pages.
3. Students, vendors, and admins are directed to different frontend pages based on their roles.
4. Supabase Auth verifies user accounts and role-based access.
5. Supabase Database stores users, vendors, menu items, orders, order items, dietary tags, and payment fields.
6. Students create orders through the cart and checkout flow.
7. The Payment API Worker creates a PayFast Sandbox payment request.
8. PayFast Sandbox processes the payment.
9. The PayFast Notify Worker receives and verifies the callback.
10. Paid orders become visible to vendors.
11. Vendors prepare orders and mark them as ready.
12. The student receives an Active Orders notification.
13. The student acknowledges pickup.
14. The order moves to complete and then into Order History.
15. Admin analytics use valid paid order data to generate reports and exports.
16. GitHub Actions, Codecov, and Cloudflare Pages support testing, coverage, and deployment.

---

## Key Design Decisions

The architecture was designed around the following project requirements:

- Students should only checkout from one vendor at a time.
- Vendors should only see paid orders.
- Payment confirmation should happen through PayFast Sandbox callback handling.
- Ready orders should not disappear before the student sees the notification.
- Orders should only become complete after student pickup acknowledgement.
- Admin analytics should only count valid paid orders.
- Reports should support CSV/PDF export.
- Testing and deployment should be supported through GitHub Actions, Codecov, and Cloudflare Pages.

---

## Summary

Overall, the architecture diagram shows how the Campus Food Ordering Platform is structured from the user interface down to the database, payment gateway, analytics reports, and deployment pipeline.

It shows that:

- Users access role-specific frontend pages.
- The frontend is hosted on Cloudflare Pages.
- Backend logic runs through Cloudflare Functions.
- Supabase handles authentication and database storage.
- PayFast Sandbox handles online payment testing.
- Vendors only see paid orders.
- Ready orders are completed only after student acknowledgement.
- Admin analytics use valid paid orders for reports and exports.
- GitHub Actions and Codecov support testing and code coverage.
- Cloudflare Pages deploys the final website.
