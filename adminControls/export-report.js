(function () {
  /*
     1.  UTILITY — CSV / download helpers
   */

  /**
   * Converts a 2D array of values into a CSV string.
   * Cells that contain commas or quotes are wrapped in double-quotes.
   */
  function toCSV(rows) {
    return rows
      .map((row) =>
        row
          .map((cell) => {
            const str = cell == null ? "" : String(cell);
            return str.includes(",") || str.includes('"') || str.includes("\n")
              ? `"${str.replaceAll('"', '""')}"`
              : str;
          })
          .join(","),
      )
      .join("\n");
  }

  /** Triggers a file download in the browser. */
  function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /** Shows a brief status message next to the export buttons. */
  function showExportMessage(message, type = "success") {
    const el = document.getElementById("export-message");
    if (!el) return;
    el.textContent = message;
    el.className = `export-message export-message--${type}`;
    el.style.display = "block";
    setTimeout(() => {
      el.style.display = "none";
    }, 3500);
  }

  /* 
     2.  SALES REPORT  CSV
         Source: window.analyticsOrders (set by sales-report.js)
         Format: Vendor, Date, Number of Orders, Total Sales
   */

  function exportSalesCSV() {
    const orders = window.analyticsOrders;

    if (!orders || orders.length === 0) {
      showExportMessage("No sales data available to export.", "error");
      return;
    }

    // Rebuild vendor → date grouping (mirrors buildVendorMap in sales-report.js)
    const map = {};
    orders.forEach((order) => {
      const name = order.vendor_name;
      const date = order.order_date;
      if (!map[name]) map[name] = {};
      if (!map[name][date]) map[name][date] = { orders: 0, sales: 0 };
      map[name][date].orders += 1;
      map[name][date].sales += order.order_total;
    });

    const rows = [["Vendor", "Date", "Number of Orders", "Total Sales (R)"]];

    Object.entries(map)
      .sort(([, dA], [, dB]) => {
        // Sort vendors by total sales descending
        const totalA = Object.values(dA).reduce((s, d) => s + d.sales, 0);
        const totalB = Object.values(dB).reduce((s, d) => s + d.sales, 0);
        return totalB - totalA;
      })
      .forEach(([vendor, dates]) => {
        Object.entries(dates)
          .sort(([a], [b]) => a.localeCompare(b))
          .forEach(([date, data]) => {
            rows.push([vendor, date, data.orders, data.sales.toFixed(2)]);
          });
      });

    downloadFile(
      "sales-per-vendor-report.csv",
      toCSV(rows),
      "text/csv;charset=utf-8;",
    );
    showExportMessage("Sales report downloaded as CSV.", "success");
  }

  /* 
     3.  PEAK HOURS REPORT  CSV
         Source: rendered #peak-hours-output table
         (Person 4 keeps data local — reading the DOM is the safe approach)
         Format: Hour, Number of Orders
   */

  function exportPeakHoursCSV() {
    const table = document.querySelector(
      "#peak-hours-output .peak-hours-table",
    );

    if (!table) {
      showExportMessage("Peak hours report is not loaded yet.", "error");
      return;
    }

    const rows = [["Hour", "Number of Orders"]];

    table.querySelectorAll("tbody tr").forEach((tr) => {
      const cells = tr.querySelectorAll("td");
      if (cells.length >= 2) {
        rows.push([cells[0].textContent.trim(), cells[1].textContent.trim()]);
      }
    });

    if (rows.length <= 1) {
      showExportMessage("No peak hours data to export.", "error");
      return;
    }

    downloadFile(
      "peak-ordering-hours-report.csv",
      toCSV(rows),
      "text/csv;charset=utf-8;",
    );
    showExportMessage("Peak hours report downloaded as CSV.", "success");
  }

  /*
     4.  CUSTOM VIEW  CSV
         Source: window.customViewFilteredData (set by custom-view.js)
         Only exports the currently filtered rows — not all orders.
         Format: Date, Vendor, Order Status, Payment Status, Total Sales
  */

  function exportCustomCSV() {
    const data = window.customViewFilteredData;

    if (!data || data.length === 0) {
      showExportMessage(
        "No custom view data to export. Try adjusting your filters.",
        "error",
      );
      return;
    }

    const rows = [
      ["Date", "Vendor", "Order Status", "Payment Status", "Total Sales (R)"],
    ];

    data.forEach((order) => {
      rows.push([
        order.order_date || "",
        order.vendor_name || "",
        order.order_status || "",
        order.payment_status || "",
        Number(order.order_total).toFixed(2),
      ]);
    });

    downloadFile(
      "custom-analytics-report.csv",
      toCSV(rows),
      "text/csv;charset=utf-8;",
    );
    showExportMessage("Custom view downloaded as CSV.", "success");
  }

  /*
     5.  CUSTOM VIEW  PDF
         Uses the browser's built-in print-to-PDF dialog.
         We build a clean print-only page in a new window so the
         admin's main dashboard layout is not affected.
  */

  function exportCustomPDF() {
    const data = window.customViewFilteredData;

    if (!data || data.length === 0) {
      showExportMessage(
        "No custom view data to export. Try adjusting your filters.",
        "error",
      );
      return;
    }

    const totalSales = data.reduce((sum, o) => sum + Number(o.order_total), 0);

    const tableRows = data
      .map(
        (order) => `
      <tr>
        <td>${order.order_date || ""}</td>
        <td>${order.vendor_name || ""}</td>
        <td>${order.order_status || ""}</td>
        <td>${order.payment_status || ""}</td>
        <td class="amount">R ${Number(order.order_total).toFixed(2)}</td>
      </tr>`,
      )
      .join("");

    const printHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Custom Analytics Report – CampusEats</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', 'Segoe UI', sans-serif;
      color: #111827;
      padding: 32px 40px;
      font-size: 13px;
      line-height: 1.5;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 28px;
      padding-bottom: 18px;
      border-bottom: 2px solid #166534;
    }
    .header h1 {
      font-size: 20px;
      font-weight: 800;
      color: #166534;
      margin-bottom: 4px;
    }
    .header p { color: #6b7280; font-size: 12px; }
    .meta {
      text-align: right;
      font-size: 12px;
      color: #6b7280;
    }
    .meta strong { color: #166534; font-size: 14px; display: block; margin-bottom: 2px; }
    .summary {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 10px;
      padding: 14px 18px;
      margin-bottom: 22px;
      display: flex;
      gap: 32px;
    }
    .summary-item { font-size: 12px; color: #374151; }
    .summary-item span {
      display: block;
      font-size: 20px;
      font-weight: 800;
      color: #166534;
      margin-top: 2px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    thead {
      background: #166534;
      color: #fff;
    }
    th {
      padding: 10px 12px;
      text-align: left;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    td {
      padding: 10px 12px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 12px;
      color: #374151;
    }
    tr:last-child td { border-bottom: none; }
    tr:nth-child(even) td { background: #f9fafb; }
    td.amount { font-weight: 700; color: #166534; text-align: right; }
    th:last-child { text-align: right; }
    .footer {
      font-size: 11px;
      color: #9ca3af;
      text-align: center;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
    }
    @media print {
      body { padding: 20px 24px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Custom Analytics Report</h1>
      <p>CampusEats Analytics Dashboard</p>
    </div>
    <div class="meta">
      <strong>R ${totalSales.toFixed(2)}</strong>
      Total Sales
    </div>
  </div>

  <div class="summary">
    <div class="summary-item">
      Total orders
      <span>${data.length}</span>
    </div>
    <div class="summary-item">
      Total sales
      <span>R ${totalSales.toFixed(2)}</span>
    </div>
    <div class="summary-item">
      Generated
      <span style="font-size:13px">${new Date().toLocaleString("en-ZA")}</span>
    </div>
  </div>

  <table>
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
      ${tableRows}
    </tbody>
  </table>

  <div class="footer">
    CampusEats &mdash; Analytics Report &mdash; ${new Date().toLocaleDateString("en-ZA")}
  </div>
</body>
</html>`;

    const printWindow = window.open("", "_blank", "width=900,height=700");
    printWindow.document.write(printHTML);
    printWindow.document.close();

    // Wait for content to paint, then open print dialog
    printWindow.addEventListener("load", () => {
      printWindow.focus();
      printWindow.print();
    });

    showExportMessage(
      'Print dialog opened. Choose "Save as PDF" to download.',
      "success",
    );
  }

  //  6.  RENDER EXPORT BUTTONS into #export-output

  function renderExportButtons() {
    const container = document.getElementById("export-output");
    if (!container) {
      console.error("export-reports.js: #export-output not found.");
      return;
    }

    container.innerHTML = `
      <p class="export-intro">
        Download any report as a CSV file (for Excel / Sheets) or export the
        Custom Analytics View as a PDF.
      </p>

      <div class="export-groups">

        <!-- Sales -->
        <div class="export-group">
          <div class="export-group-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M3 3h18v4H3z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
              <path d="M3 11h18v4H3z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
              <path d="M3 19h18v2H3z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
            </svg>
            Sales Per Vendor
          </div>
          <button class="export-btn export-btn--csv" id="btn-export-sales-csv">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <polyline points="7 10 12 15 17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            Export CSV
          </button>
        </div>

        <!-- Peak Hours -->
        <div class="export-group">
          <div class="export-group-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
              <polyline points="12 6 12 12 16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Peak Ordering Hours
          </div>
          <button class="export-btn export-btn--csv" id="btn-export-peak-csv">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <polyline points="7 10 12 15 17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            Export CSV
          </button>
        </div>

        <!-- Custom View -->
        <div class="export-group">
          <div class="export-group-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Custom Analytics View
            <span class="export-group-note">(exports filtered rows only)</span>
          </div>
          <div class="export-group-btns">
            <button class="export-btn export-btn--csv" id="btn-export-custom-csv">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <polyline points="7 10 12 15 17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              Export CSV
            </button>
            <button class="export-btn export-btn--pdf" id="btn-export-custom-pdf">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <polyline points="14 2 14 8 20 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Export PDF
            </button>
          </div>
        </div>

      </div>

      <!-- Status message -->
      <p id="export-message" class="export-message" style="display:none;"></p>
    `;

    // Wire up buttons
    document
      .getElementById("btn-export-sales-csv")
      .addEventListener("click", exportSalesCSV);
    document
      .getElementById("btn-export-peak-csv")
      .addEventListener("click", exportPeakHoursCSV);
    document
      .getElementById("btn-export-custom-csv")
      .addEventListener("click", exportCustomCSV);
    document
      .getElementById("btn-export-custom-pdf")
      .addEventListener("click", exportCustomPDF);
  }

  window.addEventListener("load", () => {
    renderExportButtons();
  });
})();
