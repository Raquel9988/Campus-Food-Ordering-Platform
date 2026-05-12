\# Sprint 4 Analytics Data Format



\## Person 1: Analytics Backend / Data Foundation



This document explains the analytics data API created for Sprint 4.



Person 1 created the backend/data foundation for the analytics section. The purpose of this work is to prepare clean sales and order data so that the dashboard reports can display correct information.



The analytics data is provided by this API endpoint:



```text

GET /api/analytics

```



On the deployed website, the endpoint can be tested here:



```text

https://campus-food-ordering.pages.dev/api/analytics

```



\---



\## What the Analytics API Does



The analytics API fetches order data from Supabase and prepares it for the rest of the analytics dashboard.



It does the following:



1\. Fetches orders from the `orders` table.

2\. Fetches the related vendor from the `vendors` table.

3\. Fetches the related order items from the `order\_items` table.

4\. Fetches the related menu item names from the `menu\_items` table.

5\. Filters the data so that only real paid orders are included.

6\. Calculates the total amount for each order.

7\. Returns clean data that the rest of the team can use for reports.



\---



\## Important Rule: Only Paid Orders Count



The analytics reports must only count real sales.



This means the API only includes orders where:



```text

payment\_status = "paid"

```



The API also only accepts these order statuses:



```text

received

preparing

ready

complete

```



The API does not count orders with statuses such as:



```text

payment\_pending

payment\_failed

cancelled

unpaid

```



This is important because unpaid, failed, or cancelled orders are not real sales and must not appear in sales reports.



\---



\## Tables Used



The analytics API uses these Supabase tables:



\### `orders`



Used for the main order information.



Important fields:



```text

id

student\_id

vendor\_id

status

created\_at

updated\_at

payment\_status

payment\_provider

payment\_amount

transaction\_id

paid\_at

```



\### `order\_items`



Used to calculate the order total and list the items in the order.



Important fields:



```text

id

order\_id

menu\_item\_id

quantity

price

created\_at

```



\### `vendors`



Used to get the vendor name.



Important fields:



```text

id

user\_id

business\_name

status

created\_at

updated\_at

```



\### `menu\_items`



Used to get the menu item name.



Important fields:



```text

id

vendor\_id

name

price

dietary\_tags

```



\---



\## How Order Total Is Calculated



The API calculates the total for each order using the order items.



For each item:



```text

quantity × price = line total

```



Then all line totals are added together.



Example:



```text

2 Hot Dogs × R40 = R80

2 Ice Creams × R20 = R40



Order Total = R120

```



This means the frontend dashboard does not need to calculate the order total from scratch.



\---



\## API Response Format



The API returns this general structure:



```json

{

&#x20; "success": true,

&#x20; "message": "Analytics data loaded successfully.",

&#x20; "count": 14,

&#x20; "data": \[]

}

```



\### Meaning of each top-level field



| Field | Meaning |

|---|---|

| `success` | Shows whether the request worked |

| `message` | Gives a short response message |

| `count` | Shows how many valid paid orders were returned |

| `data` | Contains the list of clean analytics orders |



\---



\## Analytics Order Object Format



Each order inside the `data` array has this format:



```json

{

&#x20; "order\_id": "51ad2087-58dd-4882-9c31-99ded5cdf4b6",

&#x20; "vendor\_id": "2fa8fe05-76e5-4086-82f9-af1352d2e6bb",

&#x20; "vendor\_name": "RDF",



&#x20; "order\_status": "received",

&#x20; "payment\_status": "paid",

&#x20; "payment\_provider": "payfast\_sandbox",

&#x20; "transaction\_id": "3150148",



&#x20; "created\_at": "2026-05-11T13:14:34.753288+00:00",

&#x20; "paid\_at": "2026-05-11T13:14:50.664+00:00",

&#x20; "order\_date": "2026-05-11",

&#x20; "order\_time": "13:14:34",

&#x20; "order\_hour": 13,



&#x20; "order\_total": 180,

&#x20; "payment\_amount": 180,

&#x20; "item\_count": 5,



&#x20; "items": \[

&#x20;   {

&#x20;     "item\_id": "ef2e75b3-0ad8-4ed0-a1ef-1f64ce6e5bda",

&#x20;     "item\_name": "Hot Dog",

&#x20;     "quantity": 4,

&#x20;     "price": 40,

&#x20;     "line\_total": 160

&#x20;   },

&#x20;   {

&#x20;     "item\_id": "8e779fb1-c0c1-413c-ba2f-55d1c71c088e",

&#x20;     "item\_name": "Ice Cream",

&#x20;     "quantity": 1,

&#x20;     "price": 20,

&#x20;     "line\_total": 20

&#x20;   }

&#x20; ]

}

```



\---



\## Field Descriptions



| Field | Meaning |

|---|---|

| `order\_id` | Unique ID of the order |

| `vendor\_id` | Unique ID of the vendor |

| `vendor\_name` | Name of the vendor/business |

| `order\_status` | Current order status, for example `received`, `ready`, or `complete` |

| `payment\_status` | Payment state; analytics only uses `paid` |

| `payment\_provider` | Payment provider used, for example `payfast\_sandbox` |

| `transaction\_id` | Payment transaction/reference ID |

| `created\_at` | Full date and time when the order was created |

| `paid\_at` | Full date and time when payment was confirmed |

| `order\_date` | Date only, used for date-based reports |

| `order\_time` | Time only, used for display |

| `order\_hour` | Hour of the day, used for peak ordering hour reports |

| `order\_total` | Total order amount calculated from order items |

| `payment\_amount` | Amount recorded from the payment |

| `item\_count` | Total number of items in the order |

| `items` | List of items inside the order |



\---



\## How Person 2 Should Use This



Person 2 is responsible for the analytics dashboard page/layout.



Person 2 should fetch data from:



```text

GET /api/analytics

```



Example JavaScript:



```js

async function loadAnalyticsData() {

&#x20; const response = await fetch("/api/analytics");

&#x20; const result = await response.json();



&#x20; if (!result.success) {

&#x20;   throw new Error(result.message || "Could not load analytics data.");

&#x20; }



&#x20; return result.data;

}

```



Person 2 should create dashboard sections/cards for:



```text

Sales per vendor over time

Peak ordering hours

Custom analytics view

Export buttons

```



Person 2 does not need to query Supabase directly. They should use the clean data returned by this API.



\---



\## How Person 3 Should Use This



Person 3 is responsible for the Sales Per Vendor Over Time report.



Person 3 should use these fields:



```text

vendor\_id

vendor\_name

order\_date

order\_total

order\_id

```



Person 3 can group the data by:



```text

vendor\_name + order\_date

```



They can calculate:



```text

number of orders per vendor

total sales per vendor

sales per vendor per date

```



Example output table:



| Vendor | Date | Number of Orders | Total Sales |

|---|---|---:|---:|

| RDF | 2026-05-11 | 3 | R240 |

| Pizza's | 2026-05-10 | 2 | R130 |



\---



\## How Person 4 Should Use This



Person 4 is responsible for the Peak Ordering Hours report.



Person 4 should use these fields:



```text

order\_hour

order\_time

order\_id

```



Person 4 can group orders by:



```text

order\_hour

```



They can calculate:



```text

number of orders per hour

busiest ordering hour

quietest ordering hour

```



Example output table:



| Hour | Number of Orders |

|---|---:|

| 13:00 - 14:00 | 5 |

| 17:00 - 18:00 | 3 |

| 18:00 - 19:00 | 4 |



\---



\## How Person 5 Should Use This



Person 5 is responsible for the Custom Analytics View.



Person 5 should use these fields:



```text

vendor\_id

vendor\_name

order\_date

order\_status

payment\_status

order\_total

payment\_provider

```



Person 5 can create filters for:



```text

vendor

start date

end date

order status

payment status

```



Example filtered output table:



| Date | Vendor | Order Status | Payment Status | Total Sales |

|---|---|---|---|---:|

| 2026-05-11 | RDF | received | paid | R180 |

| 2026-05-10 | Pizza's | ready | paid | R130 |



\---



\## How Person 6 Should Use This



Person 6 is responsible for exporting reports as CSV or PDF.



Person 6 should not fetch separate raw Supabase data.



They should export the final report data that Persons 3, 4, and 5 display.



Examples:



```text

sales-per-vendor-report.csv

peak-ordering-hours-report.csv

custom-analytics-report.pdf

```



Important rule:



```text

The exported file should only include the data currently shown in the report.

```



For example, if Person 5 filters the custom view by vendor or date range, Person 6 must export only that filtered data.



\---



\## Testing



The analytics API has automated tests.



Run:



```bash

npm run test:analytics

```



Expected result:



```text

Test Files  1 passed

Tests       5 passed

```



The tests check that:



```text

only valid paid orders are returned

unpaid orders are ignored

failed orders are ignored

order totals are calculated correctly

wrong request methods are rejected

missing Supabase environment variables are handled safely

Supabase/database errors are handled safely

```



\---



\## Final Summary



Person 1 created the analytics backend/data foundation.



The API:



```text

GET /api/analytics

```



returns clean paid-order data for the analytics dashboard.



This data is now ready for:



```text

Person 2: dashboard layout

Person 3: sales per vendor report

Person 4: peak ordering hours report

Person 5: custom analytics view

Person 6: CSV/PDF export

```

