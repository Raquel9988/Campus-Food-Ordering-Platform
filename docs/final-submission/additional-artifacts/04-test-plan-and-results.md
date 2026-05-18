# Test Plan and Results

This document summarises the testing strategy, main test areas, results, and automated testing evidence for the **Campus Food Ordering Platform**.

The purpose of this document is to show how the team tested the main system features and confirmed that the student, vendor, admin, analytics, payment, and shared authentication workflows work correctly.

---

# 1. Evidence Location

The detailed testing evidence is stored in:

`docs/final-submission/additional-artifacts/test-plan-results/Codecov-Test-Evidence.pdf`

This evidence document includes:

- Codecov screenshots
- Automated coverage results
- Coverage breakdown by folder
- Coverage breakdown by key files
- Explanation of the test coverage results
- Evidence that `tests/mocks` was removed from production coverage tracking

---

# 2. Testing Strategy

The project was tested using a combination of:

- Manual testing
- User acceptance testing
- Automated testing
- GitHub Actions
- Codecov coverage reporting
- PayFast Sandbox testing
- Final integration testing

Testing focused on confirming that the system worked correctly for the three main user roles:

- Student
- Vendor
- Admin

Testing also included shared logic and backend/API functionality, including:

- Shared authentication helper functions
- Shared route guards
- PayFast payment API logic
- PayFast notification handling
- Admin analytics API logic
- Admin analytics dashboard reports
- CSV/PDF export functionality

---

# 3. Main Areas Tested

| Area | Testing Focus | Result |
|---|---|---|
| Authentication | Student, vendor, and admin login/register | Passed |
| Shared authentication helpers | Session user, role lookup, vendor profile lookup, user/vendor profile creation | Passed |
| Shared route guards | Logged-in user access, admin-only access, approved vendor-only access | Passed |
| Role-based access | Users are directed to the correct pages based on their role | Passed |
| Vendor approval | Admin can approve or suspend vendors | Passed |
| Menu management | Vendors can add, edit, and manage menu items | Passed |
| Cart | Students can add, remove, and update cart items | Passed |
| Orders | Students can place orders and vendors can view them | Passed |
| Order tracking | Students can view active orders and order history | Passed |
| Status updates | Vendors can update orders through the correct status flow | Passed |
| Payments | PayFast Sandbox payment flow works correctly | Passed |
| Paid order handling | Vendors only process paid orders | Passed |
| Dietary filtering | Students can filter menu items by dietary requirements | Passed |
| Analytics dashboard | Admins can view analytics dashboard summary cards | Passed |
| Sales report | Admins can view sales per vendor by date range | Passed |
| Peak hours report | Admins can view peak ordering hours using South African time | Passed |
| Custom analytics view | Admins can filter analytics data by vendor, date, order status, and payment status | Passed |
| Export reports | Analytics reports can be exported as CSV/PDF | Passed |

---

# 4. Test Case Results Summary

| Test Category | Number of Main Test Areas | Overall Result |
|---|---:|---|
| Authentication and roles | 3 | Passed |
| Shared authentication foundation | 2 | Passed |
| Menu and vendor management | 2 | Passed |
| Cart and order workflow | 3 | Passed |
| Payment flow | 2 | Passed |
| Dietary filtering | 1 | Passed |
| Admin analytics and reports | 4 | Passed |
| Export functionality | 1 | Passed |
| Automated coverage evidence | 1 | Passed |

Overall, the main feature areas passed testing. The Codecov report provides additional automated testing evidence for the tested JavaScript and API files.

---

# 5. Acceptance Testing Summary

The main user stories were tested against their expected behaviour.

## Student Testing

Students were able to:

- Register and log in
- Browse approved vendors
- View menu items
- Filter menu items using dietary requirements
- Add items to cart
- Follow the one-vendor cart rule
- Start the payment process
- Track active orders
- View completed orders in order history

## Vendor Testing

Vendors were able to:

- Log in to the vendor dashboard
- Add and update menu items
- Assign dietary tags to menu items
- View paid orders only
- Update order statuses in the correct order:
  - received
  - preparing
  - ready
  - complete

## Admin Testing

Admins were able to:

- Log in to the admin area
- Approve and suspend vendors
- Open the analytics dashboard
- View dashboard summary cards
- View sales per vendor
- View peak ordering hours
- Use custom analytics filters
- Export reports as CSV/PDF

## Shared Authentication Testing

The shared authentication foundation was tested to confirm that:

- The current logged-in session user can be retrieved
- A missing session returns `null`
- User roles can be fetched from Supabase
- Vendor profiles can be fetched from Supabase
- User profiles can be created
- Vendor profiles can be created with `pending` status
- Admin route protection works correctly
- Approved vendor route protection works correctly
- Unauthorised users are redirected correctly

---

# 6. Automated Testing and Code Coverage

Automated testing was connected to the project using GitHub Actions and Codecov.

The updated Codecov evidence shows the following results for the `main` branch:

| Metric | Result |
|---|---:|
| Branch tested | main |
| Overall coverage | 83.84% |
| Covered lines | 1718 of 2049 |
| Missed lines | 331 |
| Coverage trend | +100.00% |

The latest Codecov evidence confirms that the project is above the 80% coverage target.

---

# 7. Coverage by Main Folder

| Folder / Area | Tracked Lines | Covered Lines | Missed Lines | Coverage |
|---|---:|---:|---:|---:|
| adminControls | 276 | 253 | 23 | 91.67% |
| auth | 195 | 161 | 34 | 82.56% |
| functions/api | 138 | 127 | 11 | 92.03% |
| shared-auth-foundation/src/js | 47 | 47 | 0 | 100.00% |
| student | 898 | 668 | 230 | 74.39% |
| vendor | 495 | 462 | 33 | 93.33% |
| **Subtotal** | **2049** | **1718** | **331** | **83.84%** |

The `tests/mocks` folder was removed from the Codecov production coverage breakdown because mock files are testing support files, not production application logic.

---

# 8. Detailed Coverage Breakdown

## Admin Controls Coverage

| File / Area | Coverage | Covered Lines | Comment |
|---|---:|---:|---|
| analytics.js | 96.84% | 92 of 95 | Analytics dashboard logic is very strongly covered. |
| custom-view.js | 87.62% | 92 of 105 | Custom analytics filtering and table rendering are strongly covered. |
| peak-hours-report.js | 90.79% | 69 of 76 | Peak ordering hour logic is strongly covered. |

## Authentication Coverage

| File / Area | Coverage | Covered Lines | Comment |
|---|---:|---:|---|
| login.js | 82.28% | 65 of 79 | Login logic is well covered. |
| register.js | 82.76% | 96 of 116 | Registration logic is well covered. |

## API / Backend Coverage

| File / Area | Coverage | Covered Lines | Comment |
|---|---:|---:|---|
| payfast folder | 100.00% | 39 of 39 | PayFast callback/payment support logic is fully covered. |
| analytics.js | 87.50% | 42 of 48 | Analytics endpoint logic is strongly covered. |
| payment.js | 90.20% | 46 of 51 | Payment API logic is strongly covered. |

## Shared Authentication Foundation Coverage

| File / Area | Coverage | Covered Lines | Comment |
|---|---:|---:|---|
| authHelpers.js | 100.00% | 18 of 18 | Shared authentication helper functions are fully covered. |
| routeGuards.js | 100.00% | 29 of 29 | Shared route protection logic is fully covered. |

## Student Feature Coverage

| File / Area | Coverage | Covered Lines | Comment |
|---|---:|---:|---|
| my-orders.js | 65.15% | 157 of 241 | Order display logic has partial coverage and can be improved. |
| student-cart.js | 85.98% | 227 of 264 | Cart logic is strongly covered. |
| student-dashboard.js | 87.88% | 116 of 132 | Dashboard logic is strongly covered. |
| student-menu.js | 64.37% | 168 of 261 | Menu browsing and filtering has partial coverage and can be improved. |

## Vendor Feature Coverage

| File / Area | Coverage | Covered Lines | Comment |
|---|---:|---:|---|
| menuCreation.js | 96.25% | 257 of 267 | Menu creation and update logic is very strongly covered. |
| orders.js | 97.04% | 164 of 169 | Vendor order workflow is very strongly covered. |
| vendor-dashboard.js | 69.49% | 41 of 59 | Dashboard display logic has acceptable but improvable coverage. |

---

# 9. Interpretation of Results

The Codecov report shows that the project has strong overall automated test coverage at **83.84%**.

The strongest tested areas are:

- `shared-auth-foundation/src/js` at **100.00%**
- `vendor` at **93.33%**
- `functions/api` at **92.03%**
- `adminControls` at **91.67%**
- `auth` at **82.56%**

The `student` folder has acceptable coverage at **74.39%**. This folder has more missed lines because it contains more user-interface, DOM rendering, and interaction-heavy code paths.

The updated coverage report no longer includes `tests/mocks` as a production coverage folder. This makes the Codecov report cleaner and more accurate because mock files are test support files rather than application features.

---

# 10. Codecov Configuration Update

The Codecov/Vitest coverage configuration was updated so that mock files are excluded from production coverage reporting.

The following support files are excluded from the coverage report:

- `tests/**`
- `tests/mocks/**`
- `*.test.js`
- `*.spec.js`
- `node_modules/**`
- `coverage/**`
- `vite.config.js`

This means the final coverage report focuses on actual production code, including:

- `adminControls`
- `auth`
- `functions/api`
- `shared-auth-foundation/src/js`
- `student`
- `vendor`

---

# 11. Assessment Relevance

This evidence supports the testing and continuous integration requirements of the final submission.

| Requirement | Evidence |
|---|---|
| Automated testing evidence | Codecov dashboard screenshots show measured test coverage on the main branch. |
| Coverage percentage | Overall coverage is 83.84%, which is above the 80% target. |
| Backend/API testing | `functions/api` has 92.03% coverage, including strong payment and analytics coverage. |
| Frontend testing | `auth`, `student`, `vendor`, and `adminControls` folders show measurable coverage across main user workflows. |
| Shared code testing | `shared-auth-foundation/src/js` has 100.00% coverage. |
| Updated evidence | The screenshots in the Codecov evidence document replace the older coverage evidence screenshots. |
| Cleaner coverage report | `tests/mocks` was excluded so that Codecov reflects production code coverage more accurately. |

---

# 12. Final Testing Summary

The testing process confirmed that the main system features were working correctly across the student, vendor, and admin roles.

The project includes evidence of:

- Manual feature testing
- Acceptance testing
- Payment testing using PayFast Sandbox
- Analytics testing
- Export testing
- Shared authentication testing
- Route guard testing
- Automated test coverage through Codecov

The separate Codecov evidence document provides the detailed screenshots and coverage breakdown needed to support this test plan.

---

# 13. Status

Completed.

The test plan, testing summary, and Codecov evidence have been updated for the final submission documentation.

The latest Codecov result is:

**83.84% overall coverage, with 1718 of 2049 lines covered on the main branch.**