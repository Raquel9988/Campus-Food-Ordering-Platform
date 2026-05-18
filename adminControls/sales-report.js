/**
 * Sales Report
 * Creates a professional sales-per-vendor report with filters,
 * summary cards, a top vendor card, chart view, and table view.
 */

const SALES_REPORT_STATE = {
  allOrders: [],
  vendorMap: {},
  startDate: "",
  endDate: "",
  sortBy: "sales-desc",
  viewMode: "both"
};

function formatZAR(value) {
  return Number(value || 0).toLocaleString("en-ZA", {
    style: "currency",
    currency: "ZAR"
  });
}

function escapeSalesHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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
  if (!iso || iso === "Unknown Date") {
    return "N/A";
  }

  const date = new Date(`${iso}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function getOrderDateValue(order) {
  return order.order_date || order.created_at || order.order_created_at || "";
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

  if (!startDate || !endDate) {
    return orders;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  end.setHours(23, 59, 59, 999);

  orders = orders.filter(order => {
    const rawOrderDate = getOrderDateValue(order);

    if (!rawOrderDate) {
      return false;
    }

    const orderDate = new Date(rawOrderDate);

    if (Number.isNaN(orderDate.getTime())) {
      return false;
    }

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
        averageOrder: 0,
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
    vendor.averageOrder = vendor.totalOrders > 0
      ? vendor.totalSales / vendor.totalOrders
      : 0;

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

function sortVendors(vendorMap) {
  const vendors = Object.values(vendorMap);

  if (SALES_REPORT_STATE.sortBy === "orders-desc") {
    return vendors.sort((a, b) => {
      if (b.totalOrders !== a.totalOrders) {
        return b.totalOrders - a.totalOrders;
      }

      return b.totalSales - a.totalSales;
    });
  }

  if (SALES_REPORT_STATE.sortBy === "vendor-az") {
    return vendors.sort((a, b) => {
      return a.vendorName.localeCompare(b.vendorName);
    });
  }

  if (SALES_REPORT_STATE.sortBy === "sales-asc") {
    return vendors.sort((a, b) => {
      return a.totalSales - b.totalSales;
    });
  }

  return vendors.sort((a, b) => {
    if (b.totalSales !== a.totalSales) {
      return b.totalSales - a.totalSales;
    }

    return b.totalOrders - a.totalOrders;
  });
}

function getSalesSummary(vendorMap) {
  const vendors = Object.values(vendorMap);

  const totalSales = vendors.reduce((sum, vendor) => {
    return sum + vendor.totalSales;
  }, 0);

  const totalOrders = vendors.reduce((sum, vendor) => {
    return sum + vendor.totalOrders;
  }, 0);

  const averageOrder = totalOrders > 0 ? totalSales / totalOrders : 0;

  return {
    totalSales,
    totalOrders,
    averageOrder,
    vendorCount: vendors.length
  };
}

function createSalesFilterUI() {
  const section = document.getElementById("sales-report-section");

  if (!section || document.getElementById("sales-filter-panel")) {
    return;
  }

  const filterHTML = `
    <section id="sales-filter-panel" class="sr-filter-panel">
      <header class="sr-filter-header">
        <h4>Sales Report Filters</h4>
        <p>
          Select a date range, choose sorting, and decide how the report should be displayed.
        </p>
      </header>

      <section class="sr-filter-grid">
        <section class="sr-filter-group">
          <label for="sr-start-date">Start Date</label>
          <input type="date" id="sr-start-date" />
        </section>

        <section class="sr-filter-group">
          <label for="sr-end-date">End Date</label>
          <input type="date" id="sr-end-date" />
        </section>

        <section class="sr-filter-group">
          <label for="sr-sort-by">Sort By</label>
          <select id="sr-sort-by">
            <option value="sales-desc">Highest sales first</option>
            <option value="sales-asc">Lowest sales first</option>
            <option value="orders-desc">Most orders first</option>
            <option value="vendor-az">Vendor name A-Z</option>
          </select>
        </section>

        <section class="sr-filter-group">
          <label for="sr-view-mode">View</label>
          <select id="sr-view-mode">
            <option value="both">Chart and table</option>
            <option value="chart">Chart only</option>
            <option value="table">Table only</option>
          </select>
        </section>

        <button type="button" class="sr-filter-btn primary" id="apply-filter-btn">
          Apply
        </button>

        <button type="button" class="sr-filter-btn secondary" id="clear-filter-btn">
          Reset
        </button>
      </section>
    </section>
  `;

  const output = document.getElementById("sales-report-output");

  if (output) {
    output.insertAdjacentHTML("beforebegin", filterHTML);
  } else {
    section.insertAdjacentHTML("beforeend", filterHTML);
  }

  document.getElementById("apply-filter-btn").addEventListener("click", () => {
    const startDate = document.getElementById("sr-start-date").value;
    const endDate = document.getElementById("sr-end-date").value;
    const sortBy = document.getElementById("sr-sort-by").value;
    const viewMode = document.getElementById("sr-view-mode").value;

    if (!startDate || !endDate) {
      alert("Please choose both a start date and an end date.");
      return;
    }

    if (startDate > endDate) {
      alert("Start date cannot be after end date.");
      return;
    }

    SALES_REPORT_STATE.startDate = startDate;
    SALES_REPORT_STATE.endDate = endDate;
    SALES_REPORT_STATE.sortBy = sortBy;
    SALES_REPORT_STATE.viewMode = viewMode;

    initSalesReport(startDate, endDate);
  });

  document.getElementById("clear-filter-btn").addEventListener("click", () => {
    document.getElementById("sr-start-date").value = "";
    document.getElementById("sr-end-date").value = "";
    document.getElementById("sr-sort-by").value = "sales-desc";
    document.getElementById("sr-view-mode").value = "both";

    SALES_REPORT_STATE.allOrders = [];
    SALES_REPORT_STATE.vendorMap = {};
    SALES_REPORT_STATE.startDate = "";
    SALES_REPORT_STATE.endDate = "";
    SALES_REPORT_STATE.sortBy = "sales-desc";
    SALES_REPORT_STATE.viewMode = "both";

    window.salesReportFilteredData = [];
    window.salesReportVendorMap = {};

    renderPrompt();
  });
}

function renderPrompt() {
  const container = document.getElementById("sales-report-output");

  if (!container) {
    return;
  }

  container.innerHTML = `
    <section class="sr-state-card">
      <h3>Choose a Date Range</h3>
      <p>
        Select both a start date and an end date, then click <strong>Apply</strong>
        to generate the sales report.
      </p>
    </section>
  `;
}

function renderSummaryCards(vendorMap) {
  const summary = getSalesSummary(vendorMap);

  return `
    <section class="sr-summary-grid" aria-label="Sales report summary">
      <article class="sr-summary-card featured">
        <p class="sr-summary-label">Total Sales</p>
        <p class="sr-summary-value">${formatZAR(summary.totalSales)}</p>
        <p class="sr-summary-note">Selected date range</p>
      </article>

      <article class="sr-summary-card">
        <p class="sr-summary-label">Total Orders</p>
        <p class="sr-summary-value">${summary.totalOrders}</p>
        <p class="sr-summary-note">Paid order records</p>
      </article>

      <article class="sr-summary-card">
        <p class="sr-summary-label">Average Order</p>
        <p class="sr-summary-value">${formatZAR(summary.averageOrder)}</p>
        <p class="sr-summary-note">Average order value</p>
      </article>

      <article class="sr-summary-card">
        <p class="sr-summary-label">Vendors</p>
        <p class="sr-summary-value">${summary.vendorCount}</p>
        <p class="sr-summary-note">Vendors with sales</p>
      </article>
    </section>
  `;
}

function renderTopVendorCard(topVendor) {
  if (!topVendor) {
    return "";
  }

  return `
    <section class="sr-top-card">
      <section class="sr-trophy-icon">🏆</section>

      <section class="sr-top-info">
        <section class="sr-top-label">Top Performing Vendor</section>

        <section class="sr-top-name">
          ${escapeSalesHtml(topVendor.vendorName)}
          <span class="sr-best-badge">Best</span>
        </section>

        <section class="sr-top-amount">
          ${formatZAR(topVendor.totalSales)} total sales for the selected period
        </section>
      </section>

      <section class="sr-top-orders">
        <section class="sr-top-orders-label">Total Orders</section>
        <section class="sr-top-orders-count">${topVendor.totalOrders}</section>
      </section>
    </section>
  `;
}

function renderVendorChart(sortedVendors, topVendor) {
  if (!sortedVendors || sortedVendors.length === 0) {
    return "";
  }

  const maxSales = Math.max(...sortedVendors.map(vendor => vendor.totalSales), 0);

  const chartRows = sortedVendors.slice(0, 8).map(vendor => {
    const widthPercentage = maxSales > 0
      ? Math.max((vendor.totalSales / maxSales) * 100, vendor.totalSales > 0 ? 6 : 0)
      : 0;

    const isTopVendor = topVendor && vendor.vendorName === topVendor.vendorName;

    return `
      <section class="sr-chart-row ${isTopVendor ? "top" : ""}">
        <span class="sr-chart-vendor">${escapeSalesHtml(vendor.vendorName)}</span>

        <section class="sr-chart-track" aria-hidden="true">
          <span class="sr-chart-bar" style="width: ${widthPercentage}%"></span>
        </section>

        <span class="sr-chart-value">${formatZAR(vendor.totalSales)}</span>
      </section>
    `;
  }).join("");

  return `
    <section class="sr-chart-card" aria-label="Vendor sales chart">
      <h3 class="sr-chart-title">Vendor Sales Comparison</h3>
      ${chartRows}
    </section>
  `;
}

function renderVendorTable(sortedVendors, topVendor) {
  let rows = "";

  sortedVendors.forEach(vendor => {
    const isTopVendor = topVendor && vendor.vendorName === topVendor.vendorName;
    const initials = escapeSalesHtml(getInitials(vendor.vendorName));
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
            <span>${escapeSalesHtml(vendor.vendorName)}</span>
          </section>
        </td>

        <td class="sr-date-cell">
          ${vendor.dates.length} day${vendor.dates.length !== 1 ? "s" : ""}
        </td>

        <td style="text-align:center">
          <span class="sr-orders-pill">${vendor.totalOrders}</span>
        </td>

        <td style="text-align:center">
          <span class="sr-orders-pill">${formatZAR(vendor.averageOrder)}</span>
        </td>

        <td class="sr-amount-cell">${formatZAR(vendor.totalSales)}</td>
      </tr>
    `;

    vendor.dates.forEach(dateEntry => {
      rows += `
        <tr class="sr-date-row">
          <td class="sr-date-cell">${formatDate(dateEntry.date)}</td>
          <td></td>
          <td style="text-align:center">
            <span class="sr-orders-pill">${dateEntry.orders}</span>
          </td>
          <td style="text-align:center">--</td>
          <td class="sr-amount-cell">${formatZAR(dateEntry.sales)}</td>
        </tr>
      `;
    });
  });

  return `
    <section class="sr-table-wrap">
      <table class="sr-table">
        <thead>
          <tr>
            <th>Vendor / Date</th>
            <th>Active Days</th>
            <th>Orders</th>
            <th>Average Order</th>
            <th>Total Sales</th>
          </tr>
        </thead>

        <tbody>
          ${rows}
        </tbody>
      </table>
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
      <section class="sr-state-card">
        <h3>No Sales Found</h3>
        <p>No vendor sales exist for the selected period.</p>
      </section>
    `;

    return;
  }

  const topVendor = getTopVendor(vendorMap);
  const sortedVendors = sortVendors(vendorMap);

  const shouldShowChart =
    SALES_REPORT_STATE.viewMode === "chart" ||
    SALES_REPORT_STATE.viewMode === "both";

  const shouldShowTable =
    SALES_REPORT_STATE.viewMode === "table" ||
    SALES_REPORT_STATE.viewMode === "both";

  container.innerHTML = `
    <section class="sr-panel">
      <header class="sr-panel-header">
        <section class="sr-panel-heading">
          <h3>Sales Per Vendor Over Time</h3>
          <p>
            This report compares vendor sales across the selected date range.
          </p>
        </section>

        <span class="sr-panel-tag">Admin Report</span>
      </header>

      ${renderSummaryCards(vendorMap)}

      ${renderTopVendorCard(topVendor)}

      ${shouldShowChart ? renderVendorChart(sortedVendors, topVendor) : ""}

      ${shouldShowTable ? renderVendorTable(sortedVendors, topVendor) : ""}
    </section>
  `;
}

async function initSalesReport(startDate = null, endDate = null) {
  const container = document.getElementById("sales-report-output");

  if (!container) {
    return;
  }

  createSalesFilterUI();

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

    SALES_REPORT_STATE.allOrders = orders;
    SALES_REPORT_STATE.vendorMap = vendorMap;

    window.salesReportFilteredData = orders;
    window.salesReportVendorMap = vendorMap;

    renderSalesReport(vendorMap);
  } catch (error) {
    console.error("Sales report failed to load:", error);

    container.innerHTML = `
      <section class="sr-state-card error">
        <h3>Failed to Load Sales Data</h3>
        <p>Please check your connection and try again.</p>
      </section>
    `;
  }
}

window.initSalesReport = initSalesReport;

document.addEventListener("DOMContentLoaded", () => {
  createSalesFilterUI();
  renderPrompt();
});

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    formatZAR,
    getInitials,
    formatDate,
    loadAnalyticsData,
    buildVendorMap,
    getTopVendor,
    sortVendors,
    renderSalesReport,
    initSalesReport
  };
}