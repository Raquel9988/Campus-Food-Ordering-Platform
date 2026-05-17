const SALES_REPORT_STYLES = `
  #sales-report-section * { box-sizing: border-box; }

  #sales-filter-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    padding: 14px 16px;
    background: #f9fafb;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    margin-bottom: 12px;
  }

  #sales-filter-bar label {
    font-size: 13px;
    color: #6b7280;
    font-weight: 600;
  }

  #sales-filter-bar input[type="date"] {
    font-size: 13px;
    padding: 7px 10px;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    background: #ffffff;
    color: #111827;
    outline: none;
    font-family: inherit;
    transition: border-color 0.2s ease;
  }

  #sales-filter-bar input[type="date"]:focus {
    border-color: #22c55e;
    box-shadow: 0 0 0 3px rgba(34,197,94,0.15);
  }

  .sr-filter-btn {
    font-size: 13px;
    padding: 7px 16px;
    border-radius: 10px;
    border: 1px solid #e5e7eb;
    background: #ffffff;
    color: #374151;
    cursor: pointer;
    font-family: inherit;
    font-weight: 600;
    transition: 0.2s ease;
  }

  .sr-filter-btn:hover {
    background: #dcfce7;
    color: #166534;
    border-color: #22c55e;
  }

  .sr-filter-btn.primary {
    background: linear-gradient(135deg, #166534, #22c55e);
    color: #ffffff;
    border: none;
    box-shadow: 0 4px 12px rgba(34,197,94,0.25);
  }

  .sr-filter-btn.primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(34,197,94,0.35);
  }

  .sr-filter-hint {
    font-size: 12.5px;
    color: #6b7280;
    margin-bottom: 20px;
  }

  .sr-prompt {
    padding: 40px 20px;
    text-align: center;
    color: #6b7280;
    font-size: 14px;
    border: 2px dashed #d1d5db;
    border-radius: 18px;
    background: #f9fafb;
    min-height: 180px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
  }

  .sr-prompt-title {
    font-size: 16px;
    font-weight: 700;
    color: #111827;
  }

  .sr-top-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 20px;
    background: linear-gradient(135deg, #166534, #22c55e);
    border-radius: 16px;
    margin-bottom: 20px;
    box-shadow: 0 6px 18px rgba(34,197,94,0.25);
    color: #ffffff;
  }

  .sr-trophy-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: rgba(255,255,255,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    flex-shrink: 0;
    backdrop-filter: blur(4px);
  }

  .sr-top-info { flex: 1; }

  .sr-top-label {
    font-size: 12px;
    color: rgba(255,255,255,0.75);
    margin-bottom: 2px;
    font-weight: 600;
  }

  .sr-top-name {
    font-size: 15px;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 2px;
  }

  .sr-top-amount {
    font-size: 13px;
    color: rgba(255,255,255,0.85);
    font-weight: 600;
  }

  .sr-best-badge {
    display: inline-block;
    font-size: 11px;
    padding: 2px 9px;
    border-radius: 999px;
    background: rgba(255,255,255,0.25);
    color: #ffffff;
    font-weight: 700;
    margin-left: 8px;
    vertical-align: middle;
    backdrop-filter: blur(4px);
  }

  .sr-top-orders { text-align: right; }

  .sr-top-orders-label {
    font-size: 12px;
    color: rgba(255,255,255,0.75);
    font-weight: 600;
  }

  .sr-top-orders-count {
    font-size: 26px;
    font-weight: 800;
    color: #ffffff;
  }

  .sr-table-wrap {
    border: 1px solid #e5e7eb;
    border-radius: 16px;
    overflow: hidden;
  }

  .sr-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  .sr-table thead tr {
    background: #f9fafb;
  }

  .sr-table th {
    text-align: left;
    padding: 11px 14px;
    font-size: 12px;
    font-weight: 600;
    color: #6b7280;
    border-bottom: 1px solid #e5e7eb;
    white-space: nowrap;
  }

  .sr-table td {
    padding: 11px 14px;
    border-bottom: 1px solid #e5e7eb;
    color: #111827;
    vertical-align: middle;
  }

  .sr-table tbody tr:last-child td {
    border-bottom: none;
  }

  .sr-table tbody tr.sr-vendor-header td {
    background: #f9fafb;
    font-weight: 700;
    border-top: 1px solid #e5e7eb;
  }

  .sr-table tbody tr.sr-vendor-header.sr-top-vendor td {
    background: #dcfce7;
  }

  .sr-table tbody tr.sr-date-row td {
    padding-top: 8px;
    padding-bottom: 8px;
    font-size: 12px;
    color: #6b7280;
  }

  .sr-table tbody tr.sr-date-row:hover td {
    background: #f9fafb;
  }

  .sr-table tbody tr.sr-date-row td:first-child {
    padding-left: 48px;
  }

  .sr-table tbody tr.sr-date-row.sr-group-last td {
    border-bottom: none;
  }

  .sr-vendor-cell {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .sr-avatar {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    background: #dcfce7;
    color: #166534;
    font-size: 11px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    text-transform: uppercase;
  }

  .sr-avatar.top {
    background: linear-gradient(135deg, #166534, #22c55e);
    color: #ffffff;
  }

  .sr-date-cell {
    color: #6b7280;
    font-size: 12px;
  }

  .sr-orders-pill {
    display: inline-block;
    font-size: 11px;
    padding: 3px 9px;
    background: #dcfce7;
    color: #166534;
    border-radius: 999px;
    font-weight: 600;
  }

  .sr-amount-cell {
    text-align: right;
    font-weight: 700;
    color: #16a34a;
  }

  .sr-empty,
  .sr-error {
    padding: 40px 20px;
    text-align: center;
    color: #6b7280;
    font-size: 14px;
    border: 2px dashed #d1d5db;
    border-radius: 18px;
    background: #f9fafb;
    min-height: 180px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
  }

  .sr-empty-title,
  .sr-error-title {
    font-size: 15px;
    font-weight: 700;
    color: #111827;
  }

  .sr-error-title {
    color: #dc2626;
  }
`;

function formatZAR(value) {
  return Number(value || 0).toLocaleString("en-ZA", {
    style: "currency",
    currency: "ZAR"
  });
}

function getInitials(name) {
  const safeName = String(name || "NA").trim();

  if (!safeName) {
    return "NA";
  }

  const words = safeName.split(/\s+/);

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return (words[0][0] + words[1][0]).toUpperCase();
}

function formatDate(iso) {
  if (!iso) {
    return "N/A";
  }

  const date = new Date(`${iso}T00:00:00`);

  return date.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

async function loadAnalyticsData(startDate, endDate) {
  const response = await fetch("https://campus-food-ordering.pages.dev/api/analytics");

  if (!response.ok) {
    throw new Error("Failed to fetch analytics data");
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Analytics API returned an error");
  }

  let orders = result.data || [];

  const start = new Date(startDate);
  const end = new Date(endDate);

  end.setHours(23, 59, 59, 999);

  orders = orders.filter(order => {
    const orderDate = new Date(order.order_date);
    return orderDate >= start && orderDate <= end;
  });

  return orders;
}

function buildVendorMap(orders) {
  const map = {};

  orders.forEach(order => {
    const vendorName = order.vendor_name || "Unknown Vendor";
    const orderDate = order.order_date || "Unknown Date";
    const orderTotal = Number(order.order_total || 0);

    if (!map[vendorName]) {
      map[vendorName] = {
        vendorName,
        totalSales: 0,
        totalOrders: 0,
        dates: {}
      };
    }

    if (!map[vendorName].dates[orderDate]) {
      map[vendorName].dates[orderDate] = {
        date: orderDate,
        orders: 0,
        sales: 0
      };
    }

    map[vendorName].dates[orderDate].orders += 1;
    map[vendorName].dates[orderDate].sales += orderTotal;
    map[vendorName].totalOrders += 1;
    map[vendorName].totalSales += orderTotal;
  });

  Object.values(map).forEach(vendor => {
    vendor.dates = Object.values(vendor.dates).sort((a, b) => {
      return new Date(a.date) - new Date(b.date);
    });
  });

  return map;
}

function getTopVendor(vendorMap) {
  const vendors = Object.values(vendorMap);

  if (vendors.length === 0) {
    return null;
  }

  return vendors.reduce((best, vendor) => {
    return vendor.totalSales > best.totalSales ? vendor : best;
  });
}

function sortVendorsByTotalSales(vendorMap) {
  return Object.values(vendorMap).sort((a, b) => {
    return b.totalSales - a.totalSales;
  });
}

function renderPrompt() {
  const container = document.getElementById("sales-report-output");

  if (!container) {
    return;
  }

  container.innerHTML = `
    <section class="sr-prompt">
      <section class="sr-prompt-title">
        Choose a date range to view sales
      </section>

      <section>
        Select both a start date and an end date, then click
        <strong>Apply date filter</strong>.
      </section>
    </section>
  `;
}

function renderSalesReport(vendorMap) {
  const container = document.getElementById("sales-report-output");

  if (!container) {
    console.error("Missing #sales-report-output");
    return;
  }

  if (!vendorMap || Object.keys(vendorMap).length === 0) {
    container.innerHTML = `
      <section class="sr-empty">
        <section class="sr-empty-title">No sales found</section>
        <section>No vendor sales exist for the selected period.</section>
      </section>
    `;

    return;
  }

  const topVendor = getTopVendor(vendorMap);
  const sortedVendors = sortVendorsByTotalSales(vendorMap);

  const banner = `
    <section class="sr-top-card">
      <section class="sr-trophy-icon">🏆</section>

      <section class="sr-top-info">
        <section class="sr-top-label">Top performing vendor</section>

        <section class="sr-top-name">
          ${topVendor.vendorName}
          <span class="sr-best-badge">Best</span>
        </section>

        <section class="sr-top-amount">
          ${formatZAR(topVendor.totalSales)} total sales for selected period
        </section>
      </section>

      <section class="sr-top-orders">
        <section class="sr-top-orders-label">Total orders</section>
        <section class="sr-top-orders-count">${topVendor.totalOrders}</section>
      </section>
    </section>
  `;

  let rows = "";

  sortedVendors.forEach(vendor => {
    const isTopVendor = vendor.vendorName === topVendor.vendorName;
    const initials = getInitials(vendor.vendorName);
    const headerClass = isTopVendor
      ? "sr-vendor-header sr-top-vendor"
      : "sr-vendor-header";

    rows += `
      <tr class="${headerClass}">
        <td>
          <section class="sr-vendor-cell">
            <section class="sr-avatar${isTopVendor ? " top" : ""}">
              ${initials}
            </section>
            <span>${vendor.vendorName}</span>
          </section>
        </td>

        <td class="sr-date-cell">
          ${vendor.dates.length} day${vendor.dates.length !== 1 ? "s" : ""}
        </td>

        <td style="text-align:center">
          <span class="sr-orders-pill">${vendor.totalOrders}</span>
        </td>

        <td class="sr-amount-cell">${formatZAR(vendor.totalSales)}</td>
      </tr>
    `;

    vendor.dates.forEach((dateEntry, index) => {
      const isLast = index === vendor.dates.length - 1;

      rows += `
        <tr class="sr-date-row${isLast ? " sr-group-last" : ""}">
          <td class="sr-date-cell">${formatDate(dateEntry.date)}</td>
          <td></td>
          <td style="text-align:center">
            <span class="sr-orders-pill">${dateEntry.orders}</span>
          </td>
          <td class="sr-amount-cell">${formatZAR(dateEntry.sales)}</td>
        </tr>
      `;
    });
  });

  container.innerHTML = `
    ${banner}

    <section class="sr-table-wrap">
      <table class="sr-table">
        <thead>
          <tr>
            <th>Vendor / Date</th>
            <th>Active days</th>
            <th style="text-align:center">Orders</th>
            <th style="text-align:right">Total sales</th>
          </tr>
        </thead>

        <tbody>
          ${rows}
        </tbody>
      </table>
    </section>
  `;
}

function createSalesFilterUI() {
  const section = document.getElementById("sales-report-section");

  if (!section || document.getElementById("sales-filter-bar")) {
    return;
  }

  section.insertAdjacentHTML("afterbegin", `
    <section id="sales-filter-bar">
      <label for="sr-start-date">From</label>
      <input type="date" id="sr-start-date" />

      <label for="sr-end-date">To</label>
      <input type="date" id="sr-end-date" />

      <button class="sr-filter-btn primary" id="apply-filter-btn">
        Apply date filter
      </button>

      <button class="sr-filter-btn" id="clear-filter-btn">
        Clear
      </button>
    </section>

    <p class="sr-filter-hint">
      Select a date range to generate the sales report.
    </p>
  `);

  document.getElementById("apply-filter-btn").addEventListener("click", () => {
    const startDate = document.getElementById("sr-start-date").value;
    const endDate = document.getElementById("sr-end-date").value;

    if (!startDate || !endDate) {
      alert("Please choose both a start date and an end date.");
      return;
    }

    if (startDate > endDate) {
      alert("Start date cannot be after end date.");
      return;
    }

    initSalesReport(startDate, endDate);
  });

  document.getElementById("clear-filter-btn").addEventListener("click", () => {
    document.getElementById("sr-start-date").value = "";
    document.getElementById("sr-end-date").value = "";

    renderPrompt();
  });
}

function injectSalesReportStyles() {
  if (document.getElementById("sr-styles")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "sr-styles";
  style.textContent = SALES_REPORT_STYLES;
  document.head.appendChild(style);
}

async function initSalesReport(startDate = null, endDate = null) {
  const container = document.getElementById("sales-report-output");

  if (!container) {
    return;
  }

  if (!startDate || !endDate) {
    renderPrompt();
    return;
  }

  container.innerHTML = `
    <p class="loading-message">Loading sales analytics...</p>
  `;

  try {
    const orders = await loadAnalyticsData(startDate, endDate);
    const vendorMap = buildVendorMap(orders);

    renderSalesReport(vendorMap);
  } catch (error) {
    console.error("Sales report failed to load:", error);

    container.innerHTML = `
      <section class="sr-error">
        <section class="sr-error-title">Failed to load sales data</section>
        <section>Please check your connection and try again.</section>
      </section>
    `;
  }
}

window.initSalesReport = initSalesReport;

document.addEventListener("DOMContentLoaded", () => {
  injectSalesReportStyles();
  createSalesFilterUI();
  renderPrompt();
});
