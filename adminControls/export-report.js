(function () {
  /*
     Export Reports
     Handles CSV downloads and PDF print export for analytics reports.
  */

  function escapeExportHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatExportZAR(value) {
    return Number(value || 0).toLocaleString("en-ZA", {
      style: "currency",
      currency: "ZAR"
    });
  }

  function toCSV(rows) {
    return rows
      .map(row => {
        return row
          .map(cell => {
            const str = cell == null ? "" : String(cell);

            return str.includes(",") || str.includes('"') || str.includes("\n")
              ? `"${str.replaceAll('"', '""')}"`
              : str;
          })
          .join(",");
      })
      .join("\n");
  }

  function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], {
      type: mimeType
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  function showExportMessage(message, type = "success") {
    const messageElement = document.getElementById("export-message");

    if (!messageElement) {
      return;
    }

    messageElement.textContent = message;
    messageElement.className = `export-message export-message--${type}`;

    setTimeout(() => {
      messageElement.style.display = "none";
    }, 5000);
  }

  function getSalesOrdersForExport() {
    return (
      window.salesReportFilteredData ||
      window.analyticsOrders ||
      []
    );
  }

  function getCustomRowsForExport() {
    return window.customViewFilteredData || [];
  }

  function getCurrentDateStamp() {
    return new Date().toISOString().slice(0, 10);
  }

  /*
     1. SALES REPORT CSV
  */

  function exportSalesCSV() {
    const orders = getSalesOrdersForExport();

    if (!orders || orders.length === 0) {
      showExportMessage(
        "No sales data is available to export. Please apply a sales report date filter first.",
        "error"
      );
      return;
    }

    const vendorDateMap = {};

    orders.forEach(order => {
      const vendorName = order.vendor_name || "Unknown Vendor";
      const orderDate = order.order_date || "Unknown Date";

      if (!vendorDateMap[vendorName]) {
        vendorDateMap[vendorName] = {};
      }

      if (!vendorDateMap[vendorName][orderDate]) {
        vendorDateMap[vendorName][orderDate] = {
          orders: 0,
          sales: 0
        };
      }

      vendorDateMap[vendorName][orderDate].orders += 1;
      vendorDateMap[vendorName][orderDate].sales += Number(order.order_total || 0);
    });

    const rows = [
      ["Vendor", "Date", "Number of Orders", "Total Sales (R)"]
    ];

    Object.entries(vendorDateMap)
      .sort(([, vendorA], [, vendorB]) => {
        const totalA = Object.values(vendorA).reduce((sum, day) => {
          return sum + day.sales;
        }, 0);

        const totalB = Object.values(vendorB).reduce((sum, day) => {
          return sum + day.sales;
        }, 0);

        return totalB - totalA;
      })
      .forEach(([vendor, dates]) => {
        Object.entries(dates)
          .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
          .forEach(([date, data]) => {
            rows.push([
              vendor,
              date,
              data.orders,
              data.sales.toFixed(2)
            ]);
          });
      });

    downloadFile(
      `sales-per-vendor-report-${getCurrentDateStamp()}.csv`,
      toCSV(rows),
      "text/csv;charset=utf-8;"
    );

    showExportMessage("Sales report downloaded successfully as a CSV file.", "success");
  }

  /*
     2. PEAK HOURS REPORT CSV
  */

  function exportPeakHoursCSV() {
    const table = document.querySelector("#peak-hours-output .peak-hours-table");

    if (!table) {
      showExportMessage(
        "Peak hours report is not loaded yet. Please load the Peak Hours report first.",
        "error"
      );
      return;
    }

    const rows = [
      ["Hour", "Number of Paid Orders"]
    ];

    table.querySelectorAll("tbody tr").forEach(row => {
      const cells = row.querySelectorAll("td");

      if (cells.length >= 2) {
        rows.push([
          cells[0].textContent.replace("Busiest", "").trim(),
          cells[1].textContent.trim()
        ]);
      }
    });

    if (rows.length <= 1) {
      showExportMessage("No peak hours data is available to export.", "error");
      return;
    }

    downloadFile(
      `peak-ordering-hours-report-${getCurrentDateStamp()}.csv`,
      toCSV(rows),
      "text/csv;charset=utf-8;"
    );

    showExportMessage("Peak hours report downloaded successfully as a CSV file.", "success");
  }

  /*
     3. CUSTOM VIEW CSV
  */

  function exportCustomCSV() {
    const data = getCustomRowsForExport();

    if (!data || data.length === 0) {
      showExportMessage(
        "No custom analytics data is available. Please apply or reset filters in the Custom Analytics View first.",
        "error"
      );
      return;
    }

    const rows = [
      ["Date", "Vendor", "Order Status", "Payment Status", "Total Sales (R)"]
    ];

    data.forEach(order => {
      rows.push([
        order.order_date || "",
        order.vendor_name || "",
        order.order_status || "",
        order.payment_status || "",
        Number(order.order_total || 0).toFixed(2)
      ]);
    });

    downloadFile(
      `custom-analytics-report-${getCurrentDateStamp()}.csv`,
      toCSV(rows),
      "text/csv;charset=utf-8;"
    );

    showExportMessage("Custom analytics report downloaded successfully as a CSV file.", "success");
  }

  /*
     4. CUSTOM VIEW PDF
     Uses browser print dialog.
  */

  function exportCustomPDF() {
    const data = getCustomRowsForExport();

    if (!data || data.length === 0) {
      showExportMessage(
        "No custom analytics data is available. Please apply or reset filters before exporting a PDF.",
        "error"
      );
      return;
    }

    const totalSales = data.reduce((sum, order) => {
      return sum + Number(order.order_total || 0);
    }, 0);

    const uniqueVendors = new Set(
      data.map(order => order.vendor_name).filter(Boolean)
    ).size;

    const tableRows = data
      .map(order => {
        return `
          <tr>
            <td>${escapeExportHtml(order.order_date || "")}</td>
            <td>${escapeExportHtml(order.vendor_name || "")}</td>
            <td>${escapeExportHtml(order.order_status || "")}</td>
            <td>${escapeExportHtml(order.payment_status || "")}</td>
            <td class="amount">${formatExportZAR(order.order_total)}</td>
          </tr>
        `;
      })
      .join("");

    const generatedDate = new Date().toLocaleString("en-ZA");

    const printHTML = `
      <!DOCTYPE html>
      <html lang="en">

      <head>
        <meta charset="UTF-8" />
        <title>Custom Analytics Report – CampusEats</title>

        <style>
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }

          body {
            font-family: "Inter", "Segoe UI", Arial, sans-serif;
            color: #111827;
            padding: 32px 40px;
            font-size: 13px;
            line-height: 1.5;
            background: #ffffff;
          }

          .report-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 24px;
            margin-bottom: 26px;
            padding-bottom: 18px;
            border-bottom: 2px solid #111827;
          }

          .report-header h1 {
            font-size: 22px;
            font-weight: 800;
            color: #111827;
            margin-bottom: 4px;
          }

          .report-header p {
            color: #6b7280;
            font-size: 12px;
          }

          .meta {
            text-align: right;
            font-size: 12px;
            color: #6b7280;
          }

          .meta strong {
            color: #166534;
            font-size: 18px;
            display: block;
            margin-bottom: 2px;
          }

          .summary {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 24px;
          }

          .summary-item {
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 12px 14px;
            background: #f9fafb;
            font-size: 11px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            font-weight: 700;
          }

          .summary-item span {
            display: block;
            margin-top: 5px;
            font-size: 16px;
            font-weight: 800;
            color: #111827;
            text-transform: none;
            letter-spacing: 0;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
          }

          thead {
            background: #f8fafc;
            border-top: 1px solid #e5e7eb;
            border-bottom: 1px solid #e5e7eb;
          }

          th {
            padding: 10px 12px;
            text-align: left;
            font-size: 11px;
            font-weight: 800;
            color: #475569;
            letter-spacing: 0.05em;
            text-transform: uppercase;
          }

          td {
            padding: 10px 12px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 12px;
            color: #374151;
          }

          tr:nth-child(even) td {
            background: #f9fafb;
          }

          td.amount {
            font-weight: 800;
            color: #166534;
            text-align: right;
            white-space: nowrap;
          }

          th:last-child {
            text-align: right;
          }

          .footer {
            font-size: 11px;
            color: #9ca3af;
            text-align: center;
            padding-top: 16px;
            border-top: 1px solid #e5e7eb;
          }

          @media print {
            body {
              padding: 20px 24px;
            }
          }
        </style>
      </head>

      <body>

        <header class="report-header">
          <section>
            <h1>Custom Analytics Report</h1>
            <p>CampusEats Analytics Dashboard</p>
            <p>Generated on ${escapeExportHtml(generatedDate)}</p>
          </section>

          <section class="meta">
            <strong>${formatExportZAR(totalSales)}</strong>
            Total Sales
          </section>
        </header>

        <section class="summary">
          <section class="summary-item">
            Total Orders
            <span>${data.length}</span>
          </section>

          <section class="summary-item">
            Total Sales
            <span>${formatExportZAR(totalSales)}</span>
          </section>

          <section class="summary-item">
            Vendors
            <span>${uniqueVendors}</span>
          </section>

          <section class="summary-item">
            Report Type
            <span>Filtered View</span>
          </section>
        </section>

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

        <footer class="footer">
          CampusEats &mdash; Analytics Report &mdash; ${new Date().toLocaleDateString("en-ZA")}
        </footer>

      </body>

      </html>
    `;

    const printWindow = window.open("", "_blank", "width=950,height=720");

    if (!printWindow) {
      showExportMessage("Please allow pop-ups to export the PDF.", "error");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(printHTML);
    printWindow.document.close();

    printWindow.addEventListener("load", () => {
      printWindow.focus();
      printWindow.print();
    });

    showExportMessage(
      'PDF export opened. In the print window, choose "Save as PDF".',
      "success"
    );
  }

  /*
     5. RENDER EXPORT SECTION
  */

  function renderExportButtons() {
    const container = document.getElementById("export-output");

    if (!container) {
      console.error("export-report.js: #export-output not found.");
      return;
    }

    container.innerHTML = `
      <section class="export-panel">

        <header class="export-panel-header">
          <section class="export-panel-heading">
            <h3>Export Reports</h3>
            <p>
              Download analytics reports for evidence, submission, or further analysis
              in Excel and Google Sheets.
            </p>
          </section>

          <span class="export-panel-tag">CSV / PDF</span>
        </header>

        <section class="export-summary-grid">
          <article class="export-summary-card featured">
            <p class="export-summary-label">Available Formats</p>
            <p class="export-summary-value">CSV + PDF</p>
            <p class="export-summary-note">PDF is available for the custom view</p>
          </article>

          <article class="export-summary-card">
            <p class="export-summary-label">Sales Export</p>
            <p class="export-summary-value">Vendor Sales</p>
            <p class="export-summary-note">Uses the filtered sales report</p>
          </article>

          <article class="export-summary-card">
            <p class="export-summary-label">Custom Export</p>
            <p class="export-summary-value">Filtered Rows</p>
            <p class="export-summary-note">Only exports the current custom view</p>
          </article>
        </section>

        <section class="export-groups">

          <article class="export-group">
            <section class="export-group-top">
              <span class="export-icon sales">📊</span>

              <section class="export-group-label">
                <h4>Sales Per Vendor</h4>
                <p>
                  Export vendor sales totals and daily order counts from the Sales Report.
                </p>
                <span class="export-group-note">Requires sales report data</span>
              </section>
            </section>

            <section class="export-group-btns">
              <button type="button" class="export-btn export-btn--csv" id="btn-export-sales-csv">
                Export CSV
              </button>
            </section>
          </article>

          <article class="export-group">
            <section class="export-group-top">
              <span class="export-icon peak">⏱️</span>

              <section class="export-group-label">
                <h4>Peak Ordering Hours</h4>
                <p>
                  Export the currently displayed peak hours table as a CSV file.
                </p>
                <span class="export-group-note">Uses current table view</span>
              </section>
            </section>

            <section class="export-group-btns">
              <button type="button" class="export-btn export-btn--csv" id="btn-export-peak-csv">
                Export CSV
              </button>
            </section>
          </article>

          <article class="export-group">
            <section class="export-group-top">
              <span class="export-icon custom">🧾</span>

              <section class="export-group-label">
                <h4>Custom Analytics View</h4>
                <p>
                  Export the filtered custom analytics rows as either CSV or PDF.
                </p>
                <span class="export-group-note">Exports filtered results only</span>
              </section>
            </section>

            <section class="export-group-btns">
              <button type="button" class="export-btn export-btn--csv" id="btn-export-custom-csv">
                Export CSV
              </button>

              <button type="button" class="export-btn export-btn--pdf" id="btn-export-custom-pdf">
                Export PDF
              </button>
            </section>
          </article>

        </section>

        <section class="export-help-card">
          <h4>Export note</h4>
          <p>
            CSV files download directly. PDF export opens the browser print window,
            where you can choose <strong>Save as PDF</strong>.
          </p>
        </section>

        <p id="export-message" class="export-message"></p>

      </section>
    `;

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

  window.initExportReports = renderExportButtons;

  window.addEventListener("load", () => {
    renderExportButtons();
  });
})();