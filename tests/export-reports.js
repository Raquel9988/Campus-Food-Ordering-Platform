import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const EXPORT_REPORTS_FILE_PATH = "../adminControls/export-reports.js";

function setupExportDom() {
  document.body.innerHTML = `
    <main>
      <section id="export-output"></section>

      <section id="peak-hours-output">
        <table class="peak-hours-table">
          <tbody>
            <tr>
              <td>10:00 - 11:00</td>
              <td>4</td>
            </tr>
            <tr>
              <td>11:00 - 12:00</td>
              <td>2</td>
            </tr>
          </tbody>
        </table>
      </section>
    </main>
  `;
}

async function importExportReportsModule() {
  await import(`${EXPORT_REPORTS_FILE_PATH}?test=${Date.now()}-${Math.random()}`);

  if (typeof window.initExportReports !== "function") {
    throw new Error("window.initExportReports was not created.");
  }
}

async function renderExportReports() {
  await importExportReportsModule();
  window.initExportReports();
}

describe("export reports", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    setupExportDom();

    global.URL.createObjectURL = vi.fn(() => "blob:test-url");
    global.URL.revokeObjectURL = vi.fn();

    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    vi.spyOn(global, "setTimeout").mockImplementation(() => 1);
    vi.spyOn(console, "error").mockImplementation(() => {});

    delete window.initExportReports;
    delete window.analyticsOrders;
    delete window.customViewFilteredData;
  });

  afterEach(() => {
    vi.restoreAllMocks();

    delete window.initExportReports;
    delete window.analyticsOrders;
    delete window.customViewFilteredData;

    document.body.innerHTML = "";
  });

  it("renders all export buttons", async () => {
    await renderExportReports();

    expect(document.getElementById("btn-export-sales-csv")).not.toBeNull();
    expect(document.getElementById("btn-export-peak-csv")).not.toBeNull();
    expect(document.getElementById("btn-export-custom-csv")).not.toBeNull();
    expect(document.getElementById("btn-export-custom-pdf")).not.toBeNull();

    expect(document.getElementById("export-output").textContent).toContain(
      "Download any report as a CSV file"
    );
  });

  it("exports the sales report as CSV", async () => {
    window.analyticsOrders = [
      {
        vendor_name: "RDF Cafeteria",
        order_date: "2026-05-18",
        order_total: 50,
      },
      {
        vendor_name: "RDF Cafeteria",
        order_date: "2026-05-18",
        order_total: 25,
      },
      {
        vendor_name: "Matrix Cafe",
        order_date: "2026-05-19",
        order_total: 30,
      },
    ];

    await renderExportReports();

    document.getElementById("btn-export-sales-csv").click();

    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:test-url");

    expect(document.getElementById("export-message").textContent).toBe(
      "Sales report downloaded as CSV."
    );
  });

  it("shows an error when there is no sales data to export", async () => {
    window.analyticsOrders = [];

    await renderExportReports();

    document.getElementById("btn-export-sales-csv").click();

    expect(URL.createObjectURL).not.toHaveBeenCalled();

    expect(document.getElementById("export-message").textContent).toBe(
      "No sales data available to export."
    );

    expect(document.getElementById("export-message").className).toContain(
      "export-message--error"
    );
  });

  it("exports the peak hours report as CSV", async () => {
    await renderExportReports();

    document.getElementById("btn-export-peak-csv").click();

    expect(URL.createObjectURL).toHaveBeenCalled();

    expect(document.getElementById("export-message").textContent).toBe(
      "Peak hours report downloaded as CSV."
    );
  });

  it("shows an error when the peak hours table is missing", async () => {
    document.getElementById("peak-hours-output").innerHTML = "";

    await renderExportReports();

    document.getElementById("btn-export-peak-csv").click();

    expect(URL.createObjectURL).not.toHaveBeenCalled();

    expect(document.getElementById("export-message").textContent).toBe(
      "Peak hours report is not loaded yet."
    );
  });

  it("exports the custom analytics view as CSV", async () => {
    window.customViewFilteredData = [
      {
        order_date: "2026-05-18",
        vendor_name: "RDF Cafeteria",
        order_status: "complete",
        payment_status: "paid",
        order_total: 50,
      },
    ];

    await renderExportReports();

    document.getElementById("btn-export-custom-csv").click();

    expect(URL.createObjectURL).toHaveBeenCalled();

    expect(document.getElementById("export-message").textContent).toBe(
      "Custom view downloaded as CSV."
    );
  });

  it("shows an error when no custom view data is available", async () => {
    window.customViewFilteredData = [];

    await renderExportReports();

    document.getElementById("btn-export-custom-csv").click();

    expect(URL.createObjectURL).not.toHaveBeenCalled();

    expect(document.getElementById("export-message").textContent).toBe(
      "No custom view data to export. Try adjusting your filters."
    );
  });

  it("opens the print window for custom PDF export", async () => {
    window.customViewFilteredData = [
      {
        order_date: "2026-05-18",
        vendor_name: "RDF Cafeteria",
        order_status: "complete",
        payment_status: "paid",
        order_total: 50,
      },
    ];

    const fakePrintWindow = {
      document: {
        open: vi.fn(),
        write: vi.fn(),
        close: vi.fn(),
      },
      addEventListener: vi.fn((event, handler) => {
        if (event === "load") {
          handler();
        }
      }),
      focus: vi.fn(),
      print: vi.fn(),
    };

    vi.spyOn(window, "open").mockReturnValue(fakePrintWindow);

    await renderExportReports();

    document.getElementById("btn-export-custom-pdf").click();

    expect(window.open).toHaveBeenCalled();
    expect(fakePrintWindow.document.write).toHaveBeenCalled();
    expect(fakePrintWindow.focus).toHaveBeenCalled();
    expect(fakePrintWindow.print).toHaveBeenCalled();

    expect(document.getElementById("export-message").textContent).toBe(
      'Print dialog opened. Choose "Save as PDF" to download.'
    );
  });

  it("shows an error when the PDF popup is blocked", async () => {
    window.customViewFilteredData = [
      {
        order_date: "2026-05-18",
        vendor_name: "RDF Cafeteria",
        order_status: "complete",
        payment_status: "paid",
        order_total: 50,
      },
    ];

    vi.spyOn(window, "open").mockReturnValue(null);

    await renderExportReports();

    document.getElementById("btn-export-custom-pdf").click();

    expect(document.getElementById("export-message").textContent).toBe(
      "Please allow pop-ups to export the PDF."
    );
  });

  it("does not crash when export-output is missing", async () => {
    document.body.innerHTML = "";

    await importExportReportsModule();

    window.initExportReports();

    expect(console.error).toHaveBeenCalledWith(
      "export-report.js: #export-output not found."
    );
  });
});