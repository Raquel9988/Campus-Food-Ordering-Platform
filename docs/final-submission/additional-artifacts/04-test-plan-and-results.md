# Test Plan and Results

This document summarises the testing strategy, main test areas, results, and automated testing evidence for the Campus Food Ordering Platform.

Detailed Codecov screenshots and coverage explanations are stored in the separate evidence document:

`docs/final-submission/additional-artifacts/test-plan-results/Codecov-Test-Evidence.docx`

---

# 1. Testing Strategy

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

---

# 2. Main Areas Tested

| Area | Testing Focus | Result |
|---|---|---|
| Authentication | Student, vendor, and admin login/register | Passed |
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
| Analytics | Admins can view sales, peak hours, and custom reports | Passed |
| Export reports | Analytics reports can be exported as CSV/PDF | Passed |

---

# 3. Acceptance Testing Summary

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
- View sales per vendor
- View peak ordering hours
- Use custom analytics filters
- Export reports as CSV/PDF

---

# 4. Automated Testing and Code Coverage

Automated testing was connected to the project using GitHub Actions and Codecov.

The updated Codecov evidence shows the following results for the `main` branch:

| Metric | Result |
|---|---:|
| Branch tested | main |
| Overall coverage | 81.42% |
| Covered lines | 1420 of 1744 |
| Missed lines | 324 |
| Coverage trend | +100.00% |

## Coverage by Main Folder

| Folder / Area | Coverage |
|---|---:|
| auth | 82.56% |
| functions/api | 92.03% |
| student | 74.39% |
| tests/mocks | 11.11% |
| vendor | 93.33% |

The detailed screenshots for these results are included in:

`docs/final-submission/additional-artifacts/test-plan-results/Codecov-Test-Evidence.docx`

---

# 5. Interpretation of Results

The Codecov report shows that the project has strong overall automated test coverage at **81.42%**.

The strongest tested areas are:

- `vendor` at **93.33%**
- `functions/api` at **92.03%**
- `auth` at **82.56%**

The `student` folder has acceptable coverage at **74.39%**.

The `tests/mocks` folder has low coverage because it contains support files used for testing, not core production features.

---

# 6. Final Testing Summary

The testing process confirmed that the main system features were working correctly across the student, vendor, and admin roles.

The project includes evidence of:

- Manual feature testing
- Acceptance testing
- Payment testing using PayFast Sandbox
- Analytics testing
- Export testing
- Automated test coverage through Codecov

The separate Codecov evidence document provides the detailed screenshots and coverage breakdown needed to support this test plan.