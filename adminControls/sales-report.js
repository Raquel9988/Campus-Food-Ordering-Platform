// sales-report.js
// Person 3 – Sales Per Vendor Over Time Report

// ─── Styles ───────────────────────────────────────────────────────────────────
// Colours are taken directly from analytics.css:
//   #166534  – dark green (primary)
//   #22c55e  – bright green (accent)
//   #16a34a  – mid green (highlight text)
//   #dcfce7  – light green tint (backgrounds)
//   #e5e7eb  – border grey (matches dashboard borders)
//   #6b7280  – muted text (matches dashboard secondary text)
//   #111827  – primary text (matches body colour)

const SALES_REPORT_STYLES = `
  #sales-report-section * { box-sizing: border-box; }

  /* ── Filter bar ── */
  #sales-filter-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    padding: 14px 16px;
    background: #f9fafb;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    margin-bottom: 20px;
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

  /* ── Buttons ── */
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

  /* ── Top vendor banner card ── */
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

  /* ── Table wrapper ── */
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

  /* Table header */
  .sr-table thead tr { background: #f9fafb; }
  .sr-table th {
    text-align: left;
    padding: 11px 14px;
    font-size: 12px;
    font-weight: 600;
    color: #6b7280;
    border-bottom: 1px solid #e5e7eb;
    white-space: nowrap;
  }

  /* All table cells */
  .sr-table td {
    padding: 11px 14px;
    border-bottom: 1px solid #e5e7eb;
    color: #111827;
    vertical-align: middle;
  }
  .sr-table tbody tr:last-child td { border-bottom: none; }

  /* Vendor group header row */
  .sr-table tbody tr.sr-vendor-header td {
    background: #f9fafb;
    font-weight: 700;
    border-top: 1px solid #e5e7eb;
  }
  /* Top vendor header gets the light green tint */
  .sr-table tbody tr.sr-vendor-header.sr-top-vendor td {
    background: #dcfce7;
  }

  /* Date detail rows – indented, smaller, muted */
  .sr-table tbody tr.sr-date-row td {
    padding-top: 8px;
    padding-bottom: 8px;
    font-size: 12px;
    color: #6b7280;
  }
  .sr-table tbody tr.sr-date-row:hover td {
    background: #f9fafb;
  }
  /* Indent the first cell on date rows to show hierarchy */
  .sr-table tbody tr.sr-date-row td:first-child {
    padding-left: 48px;
  }
  /* Remove bottom border on last date row of a group to avoid double lines */
  .sr-table tbody tr.sr-date-row.sr-group-last td {
    border-bottom: none;
  }

  /* ── Vendor avatar ── */
  .sr-vendor-cell { display: flex; align-items: center; gap: 8px; }
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
  /* Top vendor avatar uses the gradient */
  .sr-avatar.top {
    background: linear-gradient(135deg, #166534, #22c55e);
    color: #ffffff;
  }

  /* ── Cell variants ── */
  .sr-date-cell { color: #6b7280; font-size: 12px; }
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

  /* ── State placeholders ── */
  .sr-empty, .sr-loading, .sr-error {
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
  .sr-empty-title {
    font-size: 15px;
    font-weight: 700;
    color: #111827;
  }
  .sr-error-title {
    font-size: 15px;
    font-weight: 700;
    color: #dc2626;
  }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatZAR(value) {
  return Number(value).toLocaleString("en-ZA", { style: "currency", currency: "ZAR" });
}

/** Returns 2-letter initials from a vendor name. e.g. "Campus Café" → "CC" */
function getInitials(name) {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/** Formats an ISO date string to "11 May 2026" */
function formatDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Data loading ─────────────────────────────────────────────────────────────

/**
 * Fetches analytics data from the API.
 * Results are cached in window.analyticsOrders to avoid redundant requests.
 * Pass forceRefresh = true to bypass the cache (used when applying date filters).
 */
async function loadAnalyticsData(startDate = null, endDate = null, forceRefresh = false) {
  if (!forceRefresh && !startDate && !endDate && window.analyticsOrders) {
    return window.analyticsOrders;
  }

  const response = await fetch("https://campus-food-ordering.pages.dev/api/analytics");
  const result = await response.json();
  let orders = result.data;

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    orders = orders.filter(order => {
      const d = new Date(order.order_date);
      return d >= start && d <= end;
    });
  } else {
    // Only cache the full unfiltered dataset
    window.analyticsOrders = orders;
  }

  return orders;
}

// ─── Data processing ──────────────────────────────────────────────────────────

/**
 * Builds a vendor map from raw orders.
 *
 * Structure produced:
 * {
 *   "Campus Café": {
 *     vendorName: "Campus Café",
 *     totalSales: 1240,       // sum across ALL dates
 *     totalOrders: 22,        // count across ALL dates
 *     dates: [
 *       { date: "2026-05-10", orders: 6, sales: 680 },
 *       { date: "2026-05-11", orders: 8, sales: 560 },
 *       ...sorted oldest → newest
 *     ]
 *   },
 *   ...
 * }
 *
 * Top vendor = vendor with highest totalSales across all dates.
 */
function buildVendorMap(orders) {
  const map = {};

  orders.forEach(order => {
    const name = order.vendor_name;
    const date = order.order_date;

    if (!map[name]) {
      map[name] = { vendorName: name, totalSales: 0, totalOrders: 0, dates: {} };
    }
    if (!map[name].dates[date]) {
      map[name].dates[date] = { date, orders: 0, sales: 0 };
    }

    map[name].dates[date].orders += 1;
    map[name].dates[date].sales  += order.order_total;
    map[name].totalOrders        += 1;
    map[name].totalSales         += order.order_total;
  });

  // Convert date objects into arrays sorted oldest → newest per vendor
  Object.values(map).forEach(vendor => {
    vendor.dates = Object.values(vendor.dates).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
  });

  return map;
}

/**
 * Returns the vendor entry with the highest totalSales across all time.
 * Correct top-vendor logic – based on overall total, not best single day.
 */
function getTopVendor(vendorMap) {
  return Object.values(vendorMap).reduce(
    (best, v) => v.totalSales > best.totalSales ? v : best
  );
}

/**
 * Returns vendor entries sorted by totalSales descending
 * so the strongest vendor appears first in the table.
 */
function sortVendorsByTotalSales(vendorMap) {
  return Object.values(vendorMap).sort((a, b) => b.totalSales - a.totalSales);
}

// ─── Rendering ────────────────────────────────────────────────────────────────

/**
 * Renders the vendor-over-time report into #sales-report-output.
 *
 * Table structure:
 *   Vendor header row  (all-time totals for this vendor)
 *     └─ Date row – oldest
 *     └─ Date row
 *     └─ Date row – newest
 *   Next vendor header row
 *     └─ ...
 *
 * Vendors: sorted by total sales descending.
 * Dates within each vendor: sorted oldest → newest.
 * Top vendor (by total sales across all time): green tint highlight.
 */
function renderSalesReport(vendorMap) {
  const container = document.getElementById("sales-report-output");
  if (!container) { console.error("Missing #sales-report-output"); return; }

  if (Object.keys(vendorMap).length === 0) {
    container.innerHTML = `
      <div class="sr-empty">
        <div class="sr-empty-title">No sales found</div>
        <div>No vendor sales exist for the selected period.</div>
      </div>`;
    return;
  }

  const topVendor     = getTopVendor(vendorMap);
  const sortedVendors = sortVendorsByTotalSales(vendorMap);

  // ── Top vendor banner ──────────────────────────────────────────────────────
  const banner = `
    <div class="sr-top-card">
      <div class="sr-trophy-icon">🏆</div>
      <div class="sr-top-info">
        <div class="sr-top-label">Top performing vendor</div>
        <div class="sr-top-name">
          ${topVendor.vendorName}<span class="sr-best-badge">Best</span>
        </div>
        <div class="sr-top-amount">
          ${formatZAR(topVendor.totalSales)} total sales across all time
        </div>
      </div>
      <div class="sr-top-orders">
        <div class="sr-top-orders-label">Total orders</div>
        <div class="sr-top-orders-count">${topVendor.totalOrders}</div>
      </div>
    </div>`;

  // ── Table rows ─────────────────────────────────────────────────────────────
  let rows = "";

  sortedVendors.forEach(vendor => {
    const isTopVendor  = vendor.vendorName === topVendor.vendorName;
    const initials     = getInitials(vendor.vendorName);
    const headerClass  = isTopVendor
      ? "sr-vendor-header sr-top-vendor"
      : "sr-vendor-header";

    // Vendor summary row – totals across all dates
    rows += `
      <tr class="${headerClass}">
        <td>
          <div class="sr-vendor-cell">
            <div class="sr-avatar${isTopVendor ? ' top' : ''}">${initials}</div>
            <span>${vendor.vendorName}</span>
          </div>
        </td>
        <td class="sr-date-cell">
          ${vendor.dates.length} day${vendor.dates.length !== 1 ? 's' : ''}
        </td>
        <td style="text-align:center">
          <span class="sr-orders-pill">${vendor.totalOrders}</span>
        </td>
        <td class="sr-amount-cell">${formatZAR(vendor.totalSales)}</td>
      </tr>`;

    // Date detail rows – one per trading day, oldest → newest
    vendor.dates.forEach((d, i) => {
      const isLast = i === vendor.dates.length - 1;
      rows += `
        <tr class="sr-date-row${isLast ? ' sr-group-last' : ''}">
          <td class="sr-date-cell">${formatDate(d.date)}</td>
          <td></td>
          <td style="text-align:center">
            <span class="sr-orders-pill">${d.orders}</span>
          </td>
          <td class="sr-amount-cell">${formatZAR(d.sales)}</td>
        </tr>`;
    });
  });

  const table = `
    <div class="sr-table-wrap">
      <table class="sr-table">
        <thead>
          <tr>
            <th>Vendor / Date</th>
            <th>Active days</th>
            <th style="text-align:center">Orders</th>
            <th style="text-align:right">Total sales</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;

  container.innerHTML = banner + table;
}

// ─── Filter UI ────────────────────────────────────────────────────────────────

/**
 * Injects the styled date-range filter bar into the sales report section
 * and wires up Apply + Clear button handlers.
 */
function createSalesFilterUI() {
  const section = document.getElementById("sales-report-section");
  if (!section || document.getElementById("sales-filter-bar")) return;

  section.insertAdjacentHTML("afterbegin", `
    <div id="sales-filter-bar">
      <label for="sr-start-date">From</label>
      <input type="date" id="sr-start-date" />
      <label for="sr-end-date">To</label>
      <input type="date" id="sr-end-date" />
      <button class="sr-filter-btn primary" id="apply-filter-btn">Apply filter</button>
      <button class="sr-filter-btn" id="clear-filter-btn">Clear</button>
    </div>
  `);

  document.getElementById("apply-filter-btn").addEventListener("click", () => {
    const startDate = document.getElementById("sr-start-date").value;
    const endDate   = document.getElementById("sr-end-date").value;
    if (startDate && endDate && startDate > endDate) {
      alert("Start date cannot be after end date.");
      return;
    }
    initSalesReport(startDate || null, endDate || null, true);
  });

  document.getElementById("clear-filter-btn").addEventListener("click", () => {
    document.getElementById("sr-start-date").value = "";
    document.getElementById("sr-end-date").value   = "";
    initSalesReport(null, null, false);
  });
}

/** Injects the component's CSS into the page once on first load. */
function injectSalesReportStyles() {
  if (document.getElementById("sr-styles")) return;
  const style       = document.createElement("style");
  style.id          = "sr-styles";
  style.textContent = SALES_REPORT_STYLES;
  document.head.appendChild(style);
}

// ─── Entry point ──────────────────────────────────────────────────────────────

/**
 * Main function: shows a loading state, fetches data, builds the vendor map,
 * and renders the report.
 *
 * @param {string|null} startDate    - ISO date string e.g. "2026-05-01", or null
 * @param {string|null} endDate      - ISO date string e.g. "2026-05-15", or null
 * @param {boolean}     forceRefresh - bypass the in-memory cache
 */
async function initSalesReport(startDate = null, endDate = null, forceRefresh = false) {
  const container = document.getElementById("sales-report-output");
  if (!container) return;

  container.innerHTML = `<p class="loading-message">Loading sales analytics...</p>`;

  try {
    const orders      = await loadAnalyticsData(startDate, endDate, forceRefresh);
    const vendorMap   = buildVendorMap(orders);
    renderSalesReport(vendorMap);
  } catch (error) {
    console.error("Sales report failed to load:", error);
    container.innerHTML = `
      <div class="sr-error">
        <div class="sr-error-title">Failed to load sales data</div>
        <div>Please check your connection and try again.</div>
      </div>`;
  }
}

// ─── Initialise on DOM ready ───────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  injectSalesReportStyles();  // inject CSS once
  createSalesFilterUI();      // build and wire the filter bar
  initSalesReport();          // load the full unfiltered report
});