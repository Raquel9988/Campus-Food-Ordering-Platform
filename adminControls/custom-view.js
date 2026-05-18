(function () {
  const API_URL = "https://campus-food-ordering.pages.dev/api/analytics";

  const ORDER_STATUSES = ["received", "preparing", "ready", "complete"];
  const PAYMENT_STATUSES = ["paid", "pending", "failed"];

  let allOrders = [];
  let cachedVendors = [];
  let domObserver = null;

  function getContainer() {
    return document.getElementById("custom-view-output");
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatLabel(value) {
    if (!value) {
      return "N/A";
    }

    return String(value)
      .replaceAll("_", " ")
      .replace(/\b\w/g, letter => letter.toUpperCase());
  }

  function formatCurrency(value) {
    return `R${Number(value || 0).toFixed(2)}`;
  }

  function getSelectedFilters() {
    return {
      vendor: document.getElementById("cv-vendor")?.value || "",
      startDate: document.getElementById("cv-start-date")?.value || "",
      endDate: document.getElementById("cv-end-date")?.value || "",
      orderStatus: document.getElementById("cv-order-status")?.value || "",
      paymentStatus: document.getElementById("cv-payment-status")?.value || "",
      sortBy: document.getElementById("cv-sort-by")?.value || "newest"
    };
  }

  function buildFiltersHTML(vendors) {
    const vendorOptions = vendors
      .map(vendor => {
        return `<option value="${escapeHtml(vendor)}">${escapeHtml(vendor)}</option>`;
      })
      .join("");

    const statusOptions = ORDER_STATUSES
      .map(status => {
        return `<option value="${escapeHtml(status)}">${escapeHtml(formatLabel(status))}</option>`;
      })
      .join("");

    const paymentOptions = PAYMENT_STATUSES
      .map(status => {
        return `<option value="${escapeHtml(status)}">${escapeHtml(formatLabel(status))}</option>`;
      })
      .join("");

    return `
      <section class="cv-panel">

        <header class="cv-panel-header">
          <section class="cv-panel-heading">
            <h3>Custom Analytics View</h3>
            <p>
              Filter order analytics by vendor, date, order status, and payment status.
            </p>
          </section>

          <span class="cv-panel-tag">Admin Report</span>
        </header>

        <section class="cv-filters">

          <header class="cv-filter-header">
            <section>
              <h4>Report Filters</h4>
              <p>
                Choose the values below, then apply the filters to update the report.
              </p>
            </section>
          </header>

          <section class="cv-filter-row">

            <section class="cv-filter-group">
              <label class="cv-label" for="cv-vendor">Vendor</label>
              <select class="cv-select" id="cv-vendor">
                <option value="">All Vendors</option>
                ${vendorOptions}
              </select>
            </section>

            <section class="cv-filter-group">
              <label class="cv-label" for="cv-start-date">Start Date</label>
              <input type="date" class="cv-input" id="cv-start-date" />
            </section>

            <section class="cv-filter-group">
              <label class="cv-label" for="cv-end-date">End Date</label>
              <input type="date" class="cv-input" id="cv-end-date" />
            </section>

            <section class="cv-filter-group">
              <label class="cv-label" for="cv-order-status">Order Status</label>
              <select class="cv-select" id="cv-order-status">
                <option value="">All Statuses</option>
                ${statusOptions}
              </select>
            </section>

            <section class="cv-filter-group">
              <label class="cv-label" for="cv-payment-status">Payment Status</label>
              <select class="cv-select" id="cv-payment-status">
                <option value="">All Payment Statuses</option>
                ${paymentOptions}
              </select>
            </section>

            <section class="cv-filter-group">
              <label class="cv-label" for="cv-sort-by">Sort By</label>
              <select class="cv-select" id="cv-sort-by">
                <option value="newest">Newest orders first</option>
                <option value="oldest">Oldest orders first</option>
                <option value="highest-total">Highest total first</option>
                <option value="lowest-total">Lowest total first</option>
                <option value="vendor">Vendor name A-Z</option>
              </select>
            </section>

          </section>

          <section class="cv-filter-actions">
            <button type="button" class="cv-reset-btn" id="cv-reset-btn">
              Reset
            </button>

            <button type="button" class="cv-apply-btn" id="cv-apply-btn">
              Apply Filters
            </button>
          </section>

        </section>

        <section id="cv-summary-container"></section>
        <section id="cv-active-filters-container"></section>
        <section id="cv-table-container"></section>

      </section>
    `;
  }

  function getOrderStatusClass(status) {
    const statusMap = {
      complete: "cv-status-complete",
      ready: "cv-status-ready",
      preparing: "cv-status-preparing",
      received: "cv-status-received"
    };

    return statusMap[status] || "cv-status-received";
  }

  function getPaymentStatusClass(status) {
    const statusMap = {
      paid: "cv-payment-paid",
      pending: "cv-payment-pending",
      failed: "cv-payment-failed"
    };

    return statusMap[status] || "cv-payment-unknown";
  }

  function getOrderDate(order) {
    return order.order_date || order.created_at || order.order_created_at || "";
  }

  function sortOrders(orders, sortBy) {
    const sortedOrders = [...orders];

    if (sortBy === "oldest") {
      sortedOrders.sort((a, b) => {
        return String(getOrderDate(a)).localeCompare(String(getOrderDate(b)));
      });
    } else if (sortBy === "highest-total") {
      sortedOrders.sort((a, b) => {
        return Number(b.order_total || 0) - Number(a.order_total || 0);
      });
    } else if (sortBy === "lowest-total") {
      sortedOrders.sort((a, b) => {
        return Number(a.order_total || 0) - Number(b.order_total || 0);
      });
    } else if (sortBy === "vendor") {
      sortedOrders.sort((a, b) => {
        return String(a.vendor_name || "").localeCompare(String(b.vendor_name || ""));
      });
    } else {
      sortedOrders.sort((a, b) => {
        return String(getOrderDate(b)).localeCompare(String(getOrderDate(a)));
      });
    }

    return sortedOrders;
  }

  function renderSummary(orders) {
    const container = document.getElementById("cv-summary-container");

    if (!container) {
      return;
    }

    const totalSales = orders.reduce((sum, order) => {
      return sum + Number(order.order_total || 0);
    }, 0);

    const averageOrder = orders.length > 0 ? totalSales / orders.length : 0;

    const uniqueVendors = new Set(
      orders.map(order => order.vendor_name).filter(Boolean)
    ).size;

    const paidOrders = orders.filter(order => {
      return String(order.payment_status || "").toLowerCase() === "paid";
    }).length;

    container.innerHTML = `
      <section class="cv-summary-grid" aria-label="Custom view summary">

        <article class="cv-summary-card featured">
          <p class="cv-summary-label">Total Sales</p>
          <p class="cv-summary-value">${formatCurrency(totalSales)}</p>
          <p class="cv-summary-note">Based on the current filter</p>
        </article>

        <article class="cv-summary-card">
          <p class="cv-summary-label">Orders Found</p>
          <p class="cv-summary-value">${orders.length}</p>
          <p class="cv-summary-note">Matching orders</p>
        </article>

        <article class="cv-summary-card">
          <p class="cv-summary-label">Average Order</p>
          <p class="cv-summary-value">${formatCurrency(averageOrder)}</p>
          <p class="cv-summary-note">Average order value</p>
        </article>

        <article class="cv-summary-card">
          <p class="cv-summary-label">Vendors</p>
          <p class="cv-summary-value">${uniqueVendors}</p>
          <p class="cv-summary-note">${paidOrders} paid order${paidOrders === 1 ? "" : "s"}</p>
        </article>

      </section>
    `;
  }

  function renderActiveFilters(filters) {
    const container = document.getElementById("cv-active-filters-container");

    if (!container) {
      return;
    }

    const chips = [];

    if (filters.vendor) {
      chips.push(`<span class="cv-filter-chip">Vendor: <strong>&nbsp;${escapeHtml(filters.vendor)}</strong></span>`);
    }

    if (filters.startDate) {
      chips.push(`<span class="cv-filter-chip">From: <strong>&nbsp;${escapeHtml(filters.startDate)}</strong></span>`);
    }

    if (filters.endDate) {
      chips.push(`<span class="cv-filter-chip">To: <strong>&nbsp;${escapeHtml(filters.endDate)}</strong></span>`);
    }

    if (filters.orderStatus) {
      chips.push(`<span class="cv-filter-chip">Order: <strong>&nbsp;${escapeHtml(formatLabel(filters.orderStatus))}</strong></span>`);
    }

    if (filters.paymentStatus) {
      chips.push(`<span class="cv-filter-chip">Payment: <strong>&nbsp;${escapeHtml(formatLabel(filters.paymentStatus))}</strong></span>`);
    }

    chips.push(`<span class="cv-filter-chip">Sort: <strong>&nbsp;${escapeHtml(formatLabel(filters.sortBy))}</strong></span>`);

    container.innerHTML = `
      <section class="cv-active-filters" aria-label="Active custom view filters">
        ${chips.join("")}
      </section>
    `;
  }

  function renderTable(orders) {
    const container = document.getElementById("cv-table-container");

    if (!container) {
      return;
    }

    const filters = getSelectedFilters();
    const sortedOrders = sortOrders(orders, filters.sortBy);

    renderSummary(sortedOrders);
    renderActiveFilters(filters);

    if (!sortedOrders || sortedOrders.length === 0) {
      container.innerHTML = `
        <section class="cv-state-card">
          <h3>No Results</h3>
          <p>No orders match the selected filters. Try changing or resetting the filters.</p>
        </section>
      `;

      return;
    }

    const totalSales = sortedOrders.reduce((sum, order) => {
      return sum + Number(order.order_total || 0);
    }, 0);

    const rows = sortedOrders.map(order => {
      const orderDate = escapeHtml(order.order_date || getOrderDate(order) || "N/A");
      const vendorName = escapeHtml(order.vendor_name || "N/A");
      const orderStatus = String(order.order_status || "N/A").toLowerCase();
      const paymentStatus = String(order.payment_status || "N/A").toLowerCase();
      const orderTotal = formatCurrency(order.order_total);

      return `
        <tr>
          <td class="cv-date">${orderDate}</td>

          <td class="cv-vendor">${vendorName}</td>

          <td>
            <span class="cv-status-badge ${getOrderStatusClass(orderStatus)}">
              ${escapeHtml(formatLabel(orderStatus))}
            </span>
          </td>

          <td>
            <span class="cv-status-badge ${getPaymentStatusClass(paymentStatus)}">
              ${escapeHtml(formatLabel(paymentStatus))}
            </span>
          </td>

          <td class="cv-amount">
            ${orderTotal}
          </td>
        </tr>
      `;
    }).join("");

    container.innerHTML = `
      <p class="cv-result-count">
        <span>
          <strong>${sortedOrders.length}</strong> order${sortedOrders.length !== 1 ? "s" : ""} found
        </span>

        <span>
          Total Sales: <strong>${formatCurrency(totalSales)}</strong>
        </span>
      </p>

      <section class="cv-table-wrapper">
        <table class="analytics-table cv-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Vendor</th>
              <th>Order Status</th>
              <th>Payment Status</th>
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

  function applyFilters() {
    const filters = getSelectedFilters();

    if (filters.startDate && filters.endDate && filters.startDate > filters.endDate) {
      alert("Start date cannot be after end date.");
      return;
    }

    const filteredOrders = allOrders.filter(order => {
      const orderDate = getOrderDate(order);

      if (filters.vendor && order.vendor_name !== filters.vendor) {
        return false;
      }

      if (filters.startDate && orderDate < filters.startDate) {
        return false;
      }

      if (filters.endDate && orderDate > filters.endDate) {
        return false;
      }

      if (filters.orderStatus && order.order_status !== filters.orderStatus) {
        return false;
      }

      if (filters.paymentStatus && order.payment_status !== filters.paymentStatus) {
        return false;
      }

      return true;
    });

    window.customViewFilteredData = sortOrders(filteredOrders, filters.sortBy);

    renderTable(window.customViewFilteredData);
  }

  function resetFilters() {
    document.getElementById("cv-vendor").value = "";
    document.getElementById("cv-start-date").value = "";
    document.getElementById("cv-end-date").value = "";
    document.getElementById("cv-order-status").value = "";
    document.getElementById("cv-payment-status").value = "";
    document.getElementById("cv-sort-by").value = "newest";

    applyFilters();
  }

  function bindEvents() {
    const applyButton = document.getElementById("cv-apply-btn");
    const resetButton = document.getElementById("cv-reset-btn");

    if (applyButton) {
      applyButton.addEventListener("click", applyFilters);
    }

    if (resetButton) {
      resetButton.addEventListener("click", resetFilters);
    }
  }

  function renderView() {
    const container = getContainer();

    if (!container) {
      return;
    }

    container.innerHTML = buildFiltersHTML(cachedVendors);

    bindEvents();

    renderTable(window.customViewFilteredData || allOrders);

    watchContainer();
  }

  function watchContainer() {
    const container = getContainer();

    if (!container) {
      return;
    }

    if (domObserver) {
      domObserver.disconnect();
    }

    domObserver = new MutationObserver(() => {
      if (!document.getElementById("cv-apply-btn")) {
        domObserver.disconnect();
        renderView();
      }
    });

    domObserver.observe(container, {
      childList: true
    });
  }

  async function initCustomView() {
    const container = getContainer();

    if (!container) {
      return;
    }

    container.innerHTML = `
      <p class="loading-message">Loading custom analytics...</p>
    `;

    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Failed to fetch analytics data");
      }

      const result = await response.json();

      if (!result.success || !result.data || result.data.length === 0) {
        container.innerHTML = `
          <section class="cv-state-card">
            <h3>No Analytics Data</h3>
            <p>No orders are available to display in the custom analytics view.</p>
          </section>
        `;

        window.customViewFilteredData = [];
        return;
      }

      allOrders = result.data;

      cachedVendors = [...new Set(
        allOrders.map(order => order.vendor_name).filter(Boolean)
      )].sort();

      window.customViewFilteredData = allOrders;

      renderView();
    } catch (error) {
      console.error("Custom analytics view failed to load:", error);

      container.innerHTML = `
        <section class="cv-state-card error">
          <h3>Failed to Load Custom Analytics</h3>
          <p>The custom analytics report could not be loaded. Please try again later.</p>
        </section>
      `;

      window.customViewFilteredData = [];
    }
  }

  window.initCustomView = initCustomView;
})();