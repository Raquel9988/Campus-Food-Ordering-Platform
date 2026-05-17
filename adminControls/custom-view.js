(function () {
  const API_URL = "https://campus-food-ordering.pages.dev/api/analytics";

  const ORDER_STATUSES = ["received", "preparing", "ready", "complete"];

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

  function buildFiltersHTML(vendors) {
    const vendorOptions = vendors
      .map(vendor => {
        return `<option value="${escapeHtml(vendor)}">${escapeHtml(vendor)}</option>`;
      })
      .join("");

    const statusOptions = ORDER_STATUSES
      .map(status => {
        const label = status.charAt(0).toUpperCase() + status.slice(1);
        return `<option value="${escapeHtml(status)}">${escapeHtml(label)}</option>`;
      })
      .join("");

    return `
      <section class="cv-filters">

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
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </section>

        </section>

        <section class="cv-filter-actions">
          <button class="cv-apply-btn" id="cv-apply-btn">
            Apply Filters
          </button>

          <button class="cv-reset-btn" id="cv-reset-btn">
            Reset
          </button>
        </section>

      </section>

      <section id="cv-table-container"></section>
    `;
  }

  function getOrderStatusClass(status) {
    const statusMap = {
      complete: "success",
      ready: "cv-status-ready",
      preparing: "warning",
      received: "cv-status-received"
    };

    return statusMap[status] || "";
  }

  function renderTable(orders) {
    const container = document.getElementById("cv-table-container");

    if (!container) {
      return;
    }

    if (!orders || orders.length === 0) {
      container.innerHTML = `
        <section class="empty-state">
          <h3>No Results</h3>
          <p>No orders match the selected filters.</p>
        </section>
      `;

      return;
    }

    const totalSales = orders.reduce((sum, order) => {
      return sum + Number(order.order_total || 0);
    }, 0);

    const rows = orders.map(order => {
      const orderDate = escapeHtml(order.order_date || "N/A");
      const vendorName = escapeHtml(order.vendor_name || "N/A");
      const orderStatus = escapeHtml(order.order_status || "N/A");
      const paymentStatus = escapeHtml(order.payment_status || "N/A");
      const orderTotal = Number(order.order_total || 0).toFixed(2);

      return `
        <tr>
          <td>${orderDate}</td>
          <td>${vendorName}</td>
          <td>
            <span class="status-badge ${getOrderStatusClass(order.order_status)}">
              ${orderStatus}
            </span>
          </td>
          <td>
            <span class="status-badge success">
              ${paymentStatus}
            </span>
          </td>
          <td class="cv-amount">
            R${orderTotal}
          </td>
        </tr>
      `;
    }).join("");

    container.innerHTML = `
      <p class="cv-result-count">
        <strong>${orders.length}</strong> order${orders.length !== 1 ? "s" : ""} found
        &mdash; Total Sales: <strong>R${totalSales.toFixed(2)}</strong>
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
    const vendor = document.getElementById("cv-vendor").value;
    const startDate = document.getElementById("cv-start-date").value;
    const endDate = document.getElementById("cv-end-date").value;
    const orderStatus = document.getElementById("cv-order-status").value;
    const paymentStatus = document.getElementById("cv-payment-status").value;

    if (startDate && endDate && startDate > endDate) {
      alert("Start date cannot be after end date.");
      return;
    }

    const filteredOrders = allOrders.filter(order => {
      if (vendor && order.vendor_name !== vendor) {
        return false;
      }

      if (startDate && order.order_date < startDate) {
        return false;
      }

      if (endDate && order.order_date > endDate) {
        return false;
      }

      if (orderStatus && order.order_status !== orderStatus) {
        return false;
      }

      if (paymentStatus && order.payment_status !== paymentStatus) {
        return false;
      }

      return true;
    });

    window.customViewFilteredData = filteredOrders;

    renderTable(filteredOrders);
  }

  function resetFilters() {
    document.getElementById("cv-vendor").value = "";
    document.getElementById("cv-start-date").value = "";
    document.getElementById("cv-end-date").value = "";
    document.getElementById("cv-order-status").value = "";
    document.getElementById("cv-payment-status").value = "";

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
          <section class="empty-state">
            <h3>No Analytics Data</h3>
            <p>No paid orders are available to display.</p>
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
        <p class="error-message">Failed to load custom analytics.</p>
      `;

      window.customViewFilteredData = [];
    }
  }

  window.initCustomView = initCustomView;
})();
