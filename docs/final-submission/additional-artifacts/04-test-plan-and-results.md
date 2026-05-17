\# Test Plan and Results



This document describes the testing strategy, test cases, results, and automated testing evidence for the Campus Food Ordering Platform.



The testing evidence is supported by a Codecov evidence document stored in:



`docs/final-submission/additional-artifacts/test-plan-results/Codecov-Test-Evidence.docx`



\---



\# 1. Testing Strategy



The project was tested using a combination of:



\- Manual testing

\- Acceptance testing

\- Automated testing

\- GitHub Actions

\- Codecov coverage reporting

\- PayFast Sandbox testing

\- Final integration testing



Testing was done throughout the project to make sure that each feature worked according to its user story and acceptance tests.



The main goal of testing was to confirm that the system works correctly for all major user roles:



\- Student

\- Vendor

\- Admin



\---



\# 2. Main Areas Tested



| Area | What Was Tested |

|---|---|

| Authentication | Student, vendor, and admin login/register functionality |

| Role-based access | Users are directed to the correct pages based on their role |

| Vendor approval | Admin can approve or suspend vendors |

| Menu management | Vendors can add, edit, and manage menu items |

| Menu display | Students can view available menu items |

| Cart | Students can add, remove, and update cart items |

| Order placement | Students can submit food orders |

| Order storage | Orders and order items are saved correctly |

| Vendor dashboard | Vendors can view their own orders |

| Order status updates | Vendors can update orders through the correct status flow |

| Student tracking | Students can view active orders and order history |

| Notifications | Students receive updates when order status changes |

| Payments | PayFast Sandbox payment flow works without real money |

| Paid order handling | Vendors only process paid orders |

| Dietary filtering | Students can filter food by dietary requirements |

| Analytics | Admins can view reports using valid paid-order data |

| Export reports | Reports can be exported as CSV or PDF |



\---



\# 3. Manual Test Cases



\## 3.1 Authentication and Roles



| Test Case | Steps | Expected Result | Result |

|---|---|---|---|

| Student registration | Register using student details | Student account is created successfully | Passed |

| Student login | Log in using student credentials | Student is taken to the student dashboard | Passed |

| Vendor registration | Register using vendor details | Vendor account is created successfully | Passed |

| Vendor login | Log in using vendor credentials | Vendor is taken to the vendor dashboard if allowed | Passed |

| Admin login | Log in using admin credentials | Admin is taken to the admin dashboard | Passed |

| Role protection | Try to access a page for another role | User is blocked or redirected | Passed |



\---



\## 3.2 Menu Management



| Test Case | Steps | Expected Result | Result |

|---|---|---|---|

| Add menu item | Vendor adds a new menu item | Item is saved and displayed | Passed |

| Edit menu item | Vendor updates an existing item | Updated details are shown | Passed |

| Show menu item | Student opens menu page | Menu items are displayed correctly | Passed |

| Show availability | Vendor marks item unavailable or sold out | Students can see the item status | Passed |



\---



\## 3.3 Cart and Orders



| Test Case | Steps | Expected Result | Result |

|---|---|---|---|

| Add item to cart | Student clicks Add to Cart | Item appears in cart | Passed |

| Update quantity | Student changes item quantity | Cart updates and total recalculates | Passed |

| Remove item | Student removes item from cart | Item is removed from cart | Passed |

| Prevent empty order | Student tries to order with empty cart | Error message is shown | Passed |

| Place valid order | Student submits a valid cart | Order is created successfully | Passed |

| Clear cart after order | Order is submitted successfully | Cart is cleared | Passed |



\---



\## 3.4 Order Status and Tracking



| Test Case | Steps | Expected Result | Result |

|---|---|---|---|

| Vendor views orders | Vendor opens orders dashboard | Only their orders are displayed | Passed |

| Update to preparing | Vendor marks order as preparing | Status updates to preparing | Passed |

| Update to ready | Vendor marks order as ready | Status updates to ready | Passed |

| Prevent invalid status flow | Vendor tries to skip a status | Invalid update is blocked | Passed |

| Student tracks order | Student opens Active Orders | Current order status is shown | Passed |

| Completed order history | Order is completed | Order moves to Order History | Passed |



\---



\## 3.5 Payment Testing



| Test Case | Steps | Expected Result | Result |

|---|---|---|---|

| Start payment | Student clicks Pay Now | Payment request is sent to backend | Passed |

| PayFast Sandbox redirect | Payment starts successfully | Student is redirected to PayFast Sandbox | Passed |

| Successful payment | Complete sandbox payment | Order is marked as paid | Passed |

| Failed or cancelled payment | Cancel or fail payment | Order is not marked as paid | Passed |

| Vendor paid order visibility | Vendor opens dashboard | Only paid orders are shown | Passed |

| Transaction data | Payment succeeds | Transaction ID and paid timestamp are stored | Passed |



\---



\## 3.6 Dietary System Testing



| Test Case | Steps | Expected Result | Result |

|---|---|---|---|

| Add dietary tag | Vendor selects dietary tags | Tags are saved with menu item | Passed |

| Fetch dietary tags | Menu loads | Tags are included with menu items | Passed |

| Filter by one tag | Student selects one dietary filter | Matching items are shown | Passed |

| Filter by multiple tags | Student selects multiple filters | Only matching items are shown | Passed |

| No matching items | Filter has no results | Empty state message is shown | Passed |



\---



\## 3.7 Analytics Testing



| Test Case | Steps | Expected Result | Result |

|---|---|---|---|

| Fetch analytics data | Admin opens analytics page | Valid paid-order data is loaded | Passed |

| Exclude unpaid orders | Reports are generated | Failed, cancelled, or unpaid orders are not counted | Passed |

| Sales per vendor report | Admin views sales report | Sales are grouped by vendor/date | Passed |

| Peak ordering hours report | Admin views peak hours | Orders are grouped by hour | Passed |

| Custom view filters | Admin applies filters | Only matching data is shown | Passed |

| Export CSV/PDF | Admin exports report | File downloads successfully | In Progress / Finalising |



\---



\# 4. Automated Testing and Code Coverage



Automated testing evidence was collected using Codecov.



Codecov was used to measure how much of the project code was covered by automated tests.



\## Codecov Evidence Document



The Codecov evidence document is stored here:



`docs/final-submission/additional-artifacts/test-plan-results/Codecov-Test-Evidence.docx`



This Word document contains screenshots from Codecov showing the project’s automated test coverage.



\## Codecov Results



| Metric | Result |

|---|---:|

| Branch tested | main |

| Overall coverage | 83.76% |

| Covered lines | 1383 of 1651 |

| Missed lines | 268 |

| Coverage trend | +100.00% |



\## Code Coverage by Folder



| Folder / Area | Coverage |

|---|---:|

| auth | 82.56% |

| functions/api | 92.03% |

| student | 78.39% |

| tests/mocks | 11.11% |

| vendor | 93.33% |



\---



\# 5. Interpretation of Results



The Codecov report shows that the project has strong overall coverage at \*\*83.76%\*\*.



The strongest covered areas are:



\- `vendor` at \*\*93.33%\*\*

\- `functions/api` at \*\*92.03%\*\*

\- `auth` at \*\*82.56%\*\*



The `student` folder has acceptable coverage at \*\*78.39%\*\*.



The `tests/mocks` folder has lower coverage because mock files are mainly support files used for testing rather than core production functionality.



\---



\# 6. Final Testing Summary



The system was tested through manual feature testing, acceptance testing, automated tests, and Codecov coverage reporting.



The testing process confirmed that:



\- Users can register and log in.

\- Roles are separated correctly.

\- Vendors can manage menu items.

\- Students can add items to cart and place orders.

\- Vendors can view and update orders.

\- Students can track active orders and view order history.

\- PayFast Sandbox payments work correctly.

\- Vendors only process paid orders.

\- Dietary filtering works.

\- Admin analytics reports use valid paid-order data.

\- Codecov confirms automated test coverage across important parts of the project.



The project is still being finalised for Sprint 4 analytics and final submission, but the testing evidence shows that the main implemented features have been tested and supported by automated coverage evidence.

