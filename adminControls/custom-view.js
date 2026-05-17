(function () {
  const API_URL = 'https://campus-food-ordering.pages.dev/api/analytics';

  const ORDER_STATUSES = ['received', 'preparing', 'ready', 'complete'];

  let allOrders = [];
  let cachedVendors = [];
  let domObserver = null;

  function getContainer() {
    return document.getElementById('custom-view-output');
  }

  function buildFiltersHTML(vendors) {
    const vendorOptions = vendors
      .map(v => `<option value="${v}">${v}</option>`)
      .join('');

    const statusOptions = ORDER_STATUSES
      .map(s => `<option value="${s}">${s.charAt(0).toUpperCase() + s.slice(1)}</option>`)
      .join('');

    return `
      <div class="cv-filters">
        <div class="cv-filter-row">
          <div class="cv-filter-group">
            <label class="cv-label" for="cv-vendor">Vendor</label>
            <select class="cv-select" id="cv-vendor">
              <option value="">All Vendors</option>
              ${vendorOptions}
            </select>
          </div>

          <div class="cv-filter-group">
            <label class="cv-label" for="cv-start-date">Start Date</label>
            <input type="date" class="cv-input" id="cv-start-date" />
          </div>

          <div class="cv-filter-group">
            <label class="cv-label" for="cv-end-date">End Date</label>
            <input type="date" class="cv-input" id="cv-end-date" />
          </div>

          <div class="cv-filter-group">
            <label class="cv-label" for="cv-order-status">Order Status</label>
            <select class="cv-select" id="cv-order-status">
              <option value="">All Statuses</option>
              ${statusOptions}
            </select>
          </div>

          <div class="cv-filter-group">
            <label class="cv-label" for="cv-payment-status">Payment Status</label>
            <select class="cv-select" id="cv-payment-status">
              <option value="">All</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>

        <div class="cv-filter-actions">
          <button class="cv-apply-btn" id="cv-apply-btn">Apply Filters</button>
          <button class="cv-reset-btn" id="cv-reset-btn">Reset</button>
        </div>
      </div>

      <div id="cv-table-container"></div>
    `;
  }

  function getOrderStatusClass(status) {
    const map = {
      complete: 'success',
      ready: 'cv-status-ready',
      preparing: 'warning',
      received: 'cv-status-received',
    };
    return map[status] || '';
  }

  function renderTable(orders) {
    const container = document.getElementById('cv-table-container');
    if (!container) return;

    if (orders.length === 0) {
      container.innerHTML = `
        <section class="empty-state">
          <h3>No Results</h3>
          <p>No orders match the selected filters.</p>
        </section>
      `;
      return;
    }

    const totalSales = orders.reduce((sum, o) => sum + o.order_total, 0);

    const rows = orders.map(o => `
      <tr>
        <td>${o.order_date}</td>
        <td>${o.vendor_name}</td>
        <td><span class="status-badge ${getOrderStatusClass(o.order_status)}">${o.order_status}</span></td>
        <td><span class="status-badge success">${o.payment_status}</span></td>
        <td class="cv-amount">R${o.order_total.toFixed(2)}</td>
      </tr>
    `).join('');

    container.innerHTML = `
      <p class="cv-result-count">
        ${orders.length} order${orders.length !== 1 ? 's' : ''} found
        &mdash; Total: <strong>R${totalSales.toFixed(2)}</strong>
      </p>
      <div class="cv-table-wrapper">
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
      </div>
    `;
  }

  function applyFilters() {
    const vendor      = document.getElementById('cv-vendor').value;
    const startDate   = document.getElementById('cv-start-date').value;
    const endDate     = document.getElementById('cv-end-date').value;
    const orderStatus = document.getElementById('cv-order-status').value;
    const payStatus   = document.getElementById('cv-payment-status').value;

    const filtered = allOrders.filter(order => {
      if (vendor && order.vendor_name !== vendor) return false;
      if (startDate && order.order_date < startDate) return false;
      if (endDate && order.order_date > endDate) return false;
      if (orderStatus && order.order_status !== orderStatus) return false;
      if (payStatus && order.payment_status !== payStatus) return false;
      return true;
    });

    window.customViewFilteredData = filtered;
    renderTable(filtered);
  }

  function resetFilters() {
    document.getElementById('cv-vendor').value = '';
    document.getElementById('cv-start-date').value = '';
    document.getElementById('cv-end-date').value = '';
    document.getElementById('cv-order-status').value = '';
    document.getElementById('cv-payment-status').value = '';
    applyFilters();
  }

  function bindEvents() {
    document.getElementById('cv-apply-btn').addEventListener('click', applyFilters);
    document.getElementById('cv-reset-btn').addEventListener('click', resetFilters);
  }

  function renderView() {
    const container = getContainer();
    if (!container) return;
    container.innerHTML = buildFiltersHTML(cachedVendors);
    bindEvents();
    renderTable(window.customViewFilteredData || allOrders);
    watchContainer();
  }

  // Re-render filters if another script (analytics.js) overwrites #custom-view-output
  function watchContainer() {
    const container = getContainer();
    if (!container) return;
    if (domObserver) domObserver.disconnect();

    domObserver = new MutationObserver(() => {
      if (!document.getElementById('cv-apply-btn')) {
        domObserver.disconnect();
        renderView();
      }
    });
    domObserver.observe(container, { childList: true });
  }

  async function init() {
    const container = getContainer();
    if (!container) return;

    container.innerHTML = '<p class="loading-message">Loading custom analytics...</p>';

    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Failed to fetch analytics data');

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
      cachedVendors = [...new Set(allOrders.map(o => o.vendor_name))].sort();
      window.customViewFilteredData = allOrders;

      renderView();
    } catch (error) {
      console.error('Custom analytics view failed to load:', error);
      container.innerHTML = '<p class="error-message">Failed to load custom analytics.</p>';
      window.customViewFilteredData = [];
    }
  }

  window.addEventListener('load', init);
})();
