(function () {
  /*
     1. UTILITY — CSV / download helpers
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
          .join(",")
      )
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
    messageElement.style.display = "block";

    setTimeout(() => {
      messageElement.style.display = "none";
    }, 3500);
  }

  /*
     2. SALES REPORT CSV
     Source: window.analyticsOrders from sales-report.js
  */

  function exportSalesCSV() {
    const orders = window.analyticsOrders;

    if (!orders || orders.length === 0) {
      showExportMessage("No sales data available to export.", "error");
      return;
    }

    const vendorDateMap = {};

    orders.forEach((order) => {
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
      "sales-per-vendor-report.csv",
      toCSV(rows),
      "text/csv;charset=utf-8;"
    );

    showExportMessage("Sales report downloaded as CSV.", "success");
  }

  /*
     3. PEAK HOURS REPORT CSV
     Source: rendered peak hours table
  */

  function exportPeakHoursCSV() {
    const table = document.querySelector("#peak-hours-output .peak-hours-table");

    if (!table) {
      showExportMessage("Peak hours report is not loaded yet.", "error");
      return;
    }

    const rows = [
      ["Hour", "Number of Orders"]
    ];

    table.querySelectorAll("tbody tr").forEach((row) => {
      const cells = row.querySelectorAll("td");

      if (cells.length >= 2) {
        rows.push([
          cells[0].textContent.trim(),
          cells[1].textContent.trim()
        ]);
      }
    });

    if (rows.length <= 1) {
      showExportMessage("No peak hours data to export.", "error");
      return;
    }

    downloadFile(
      "peak-ordering-hours-report.csv",
      toCSV(rows),
      "text/csv;charset=utf-8;"
    );

    showExportMessage("Peak hours report downloaded as CSV.", "success");
  }

  /*
     4. CUSTOM VIEW CSV
     Source: window.customViewFilteredData from custom-view.js
  */

  function exportCustomCSV() {
    const data = window.customViewFilteredData;

    if (!data || data.length === 0) {
      showExportMessage(
        "No custom view data to export. Try adjusting your filters.",
        "error"
      );
      return;
    }

    const rows = [
      ["Date", "Vendor", "Order Status", "Payment Status", "Total Sales (R)"]
    ];

    data.forEach((order) => {
      rows.push([
        order.order_date || "",
        order.vendor_name || "",
        order.order_status || "",
        order.payment_status || "",
        Number(order.order_total || 0).toFixed(2)
      ]);
    });

    downloadFile(
      "custom-analytics-report.csv",
      toCSV(rows),
      "text/csv;charset=utf-8;"
    );

    showExportMessage("Custom view downloaded as CSV.", "success");
  }

  /*
     5. CUSTOM VIEW PDF
     Uses browser print dialog.
  */

  function exportCustomPDF() {
    const data = window.customViewFilteredData;

    if (!data || data.length === 0) {
      showExportMessage(
        "No custom view data to export. Try adjusting your filters.",
        "error"
      );
      return;
    }

    const totalSales = data.reduce((sum, order) => {
      return sum + Number(order.order_total || 0);
    }, 0);

    const tableRows = data
      .map((order) => {
        return `
          <tr>
            <td>${order.order_date || ""}</td>
            <td>${order.vendor_name || ""}</td>
            <td>${order.order_status || ""}</td>
            <td>${order.payment_status || ""}</td>
            <td class="amount">R ${Number(order.order_total || 0).toFixed(2)}</td>
          </tr>
        `;
      })
      .join("");

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
            font-family: 'Inter', 'Segoe UI', sans-serif;
            color: #111827;
            padding: 32px 40px;
            font-size: 13px;
            line-height: 1.5;
          }

          .report-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 28px;
            padding-bottom: 18px;
            border-bottom: 2px solid #166534;
          }

          .report-header h1 {
            font-size: 20px;
            font-weight: 800;
            color: #166534;
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
            font-size: 14px;
            display: block;
            margin-bottom: 2px;
          }

          .summary {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 10px;
            padding: 14px 18px;
            margin-bottom: 22px;
            display: flex;
            gap: 32px;
          }

          .summary-item {
            font-size: 12px;
            color: #374151;
          }

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
            color: #ffffff;
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

          tr:last-child td {
            border-bottom: none;
          }

          tr:nth-child(even) td {
            background: #f9fafb;
          }

          td.amount {
            font-weight: 700;
            color: #166534;
            text-align: right;
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
          </section>

          <section class="meta">
            <strong>R ${totalSales.toFixed(2)}</strong>
            Total Sales
          </section>
        </header>

        <section class="summary">
          <section class="summary-item">
            Total orders
            <span>${data.length}</span>
          </section>

          <section class="summary-item">
            Total sales
            <span>R ${totalSales.toFixed(2)}</span>
          </section>

          <section class="summary-item">
            Generated
            <span style="font-size:13px">${new Date().toLocaleString("en-ZA")}</span>
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

    const printWindow = window.open("", "_blank", "width=900,height=700");

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
      'Print dialog opened. Choose "Save as PDF" to download.',
      "success"
    );
  }

  /*
     6. RENDER EXPORT BUTTONS
  */

  function renderExportButtons() {
    const container = document.getElementById("export-output");

    if (!container) {
      console.error("export-report.js: #export-output not found.");
      return;
    }

    container.innerHTML = `
      <p class="export-intro">
        Download any report as a CSV file for Excel or Google Sheets, or export the
        Custom Analytics View as a PDF.
      </p>

      <section class="export-groups">

        <section class="export-group">
          <section class="export-group-label">
            Sales Per Vendor
          </section>

          <button class="export-btn export-btn--csv" id="btn-export-sales-csv">
            Export CSV
          </button>
        </section>

        <section class="export-group">
          <section class="export-group-label">
            Peak Ordering Hours
          </section>

          <button class="export-btn export-btn--csv" id="btn-export-peak-csv">
            Export CSV
          </button>
        </section>

        <section class="export-group">
          <section class="export-group-label">
            Custom Analytics View
            <span class="export-group-note">
              exports filtered rows only
            </span>
          </section>

          <section class="export-group-btns">
            <button class="export-btn export-btn--csv" id="btn-export-custom-csv">
              Export CSV
            </button>

            <button class="export-btn export-btn--pdf" id="btn-export-custom-pdf">
              Export PDF
            </button>
          </section>
        </section>

      </section>

      <p id="export-message" class="export-message" style="display:none;"></p>
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
