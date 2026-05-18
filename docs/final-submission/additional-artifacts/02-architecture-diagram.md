# Architecture Diagram

This folder contains the final architecture diagram for the Campus Food Ordering Platform.

The architecture diagram provides a high-level visual representation of the system architecture. It shows the main components of the software and how they interact with each other, including the frontend pages, backend API logic, database, payment gateway, analytics feature, and deployment workflow.

## Diagram File

The final architecture diagram is stored in:

`docs/final-submission/additional-artifacts/architecture-diagram/campus_food_architecture_diagram.png`

## What the Diagram Shows

The architecture diagram includes the following main parts of the system:

- Student frontend
- Vendor frontend
- Admin frontend
- Login and role-based access
- Supabase authentication
- Supabase database
- Cloudflare Pages hosting
- Cloudflare Functions / API endpoints
- PayFast Sandbox payment flow
- Order status and payment update flow
- Analytics API
- Analytics reports and CSV/PDF export
- GitHub repository
- GitHub Actions CI/CD workflow
- Codecov test coverage reporting

## System Overview

The Campus Food Ordering Platform is built using a vanilla HTML, CSS, and JavaScript frontend. Different users interact with different parts of the system depending on their role.

Students can browse approved vendors, filter menu items using dietary requirements, add items to a cart, make payments, and track their orders.

Vendors can manage their menu items, assign dietary tags, view paid orders, and update order statuses.

Admins can approve or suspend vendors and access the analytics dashboard to view sales reports, peak ordering hours, custom filtered views, and exported reports.

## Backend and Data Flow

The system uses Supabase for authentication and database storage. Supabase stores important data such as users, vendors, menu items, orders, order items, payment statuses, and dietary tags.

Cloudflare Functions are used for backend API logic. These functions handle payment requests, PayFast payment callbacks, and analytics data retrieval.

The PayFast Sandbox payment gateway is used to process online payments. After payment, the system updates the order payment status and moves valid paid orders into the correct order flow.

## Analytics

The architecture diagram also includes the Sprint 4 analytics feature. The analytics dashboard uses data from valid paid orders only. Failed, cancelled, or unpaid orders are not counted as real sales.

The analytics section supports:

- Sales per vendor over time
- Peak ordering hours
- Custom filtered analytics views
- CSV/PDF report exports

