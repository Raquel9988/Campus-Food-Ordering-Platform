import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const SALES_REPORT_FILE_PATH = "../adminControls/sales-report.js";

function setupSalesReportDom() {
  document.head.innerHTML = "";

  document.body.innerHTML = `
    <main>
      <section id="sales-report-section">
        <section id="sales-report-output"></section>
      </section>
    </main>
  `;
}

async function importSalesReportModule() {
  await import(`${SALES_REPORT_FILE_PATH}?test=${Date.now()}-${Math.random()}`);

  if (typeof window.initSalesReport !== "function") {
    throw new Error("window.initSalesReport was not created.");
  }
}

async function importAndStartSalesReport() {
  await importSalesReportModule();

  document.dispatchEvent(new Event("DOMContentLoaded"));

  await new Promise(resolve => setTimeout(resolve, 0));
}

describe("sales report", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    setupSalesReportDom();

    global.fetch = vi.fn();

    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(window, "alert").mockImplementation(() => {});

    delete window.initSalesReport;
  });

  afterEach(() => {
    vi.restoreAllMocks();

    delete global.fetch;
    delete window.initSalesReport;

    document.head.innerHTML = "";
    document.body.innerHTML = "";
  });

  it("creates the filter UI and shows the prompt on page load", async () => {
    await importAndStartSalesReport();

    expect(document.getElementById("sales-filter-bar")).not.toBeNull();
    expect(document.getElementById("sr-styles")).not.toBeNull();

    expect(document.getElementById("sales-report-output").textContent).toContain(
      "Choose a date range to view sales"
    );
  });

  it("shows a prompt when initSalesReport is called without dates", async () => {
    await importSalesReportModule();

    await window.initSalesReport();

    expect(document.getElementById("sales-report-output").textContent).toContain(
      "Choose a date range to view sales"
    );

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("loads sales data, filters by date range, and renders vendor totals", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: vi.fn(async () => ({
        success: true,
        data: [
          {
            order_date: "2026-05-17",
            vendor_name: "RDF Cafeteria",
            order_total: 30,
          },
          {
            order_date: "2026-05-18",
            vendor_name: "RDF Cafeteria",
            order_total: 20,
          },
          {
            order_date: "2026-05-18",
            vendor_name: "Matrix Cafe",
            order_total: 80,
          },
          {
            order_date: "2026-05-25",
            vendor_name: "Outside Date Vendor",
            order_total: 500,
          },
        ],
      })),
    });

    await importSalesReportModule();

    await window.initSalesReport("2026-05-17", "2026-05-18");

    const output = document.getElementById("sales-report-output");

    expect(global.fetch).toHaveBeenCalledWith(
      "https://campus-food-ordering.pages.dev/api/analytics"
    );

    expect(output.textContent).toContain("Top performing vendor");
    expect(output.textContent).toContain("Matrix Cafe");
    expect(output.textContent).toContain("RDF Cafeteria");
    expect(output.textContent).not.toContain("Outside Date Vendor");
  });

  it("shows empty state when no sales exist in the selected date range", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: vi.fn(async () => ({
        success: true,
        data: [
          {
            order_date: "2026-05-25",
            vendor_name: "Outside Date Vendor",
            order_total: 500,
          },
        ],
      })),
    });

    await importSalesReportModule();

    await window.initSalesReport("2026-05-17", "2026-05-18");

    const output = document.getElementById("sales-report-output");

    expect(output.textContent).toContain("No sales found");
    expect(output.textContent).toContain(
      "No vendor sales exist for the selected period."
    );
  });

  it("shows error state when the analytics API request fails", async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      json: vi.fn(),
    });

    await importSalesReportModule();

    await window.initSalesReport("2026-05-17", "2026-05-18");

    const output = document.getElementById("sales-report-output");

    expect(console.error).toHaveBeenCalled();
    expect(output.textContent).toContain("Failed to load sales data");
    expect(output.textContent).toContain("Please check your connection and try again.");
  });

  it("shows error state when the analytics API returns success false", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: vi.fn(async () => ({
        success: false,
        message: "Analytics API returned an error",
      })),
    });

    await importSalesReportModule();

    await window.initSalesReport("2026-05-17", "2026-05-18");

    const output = document.getElementById("sales-report-output");

    expect(console.error).toHaveBeenCalled();
    expect(output.textContent).toContain("Failed to load sales data");
  });

  it("alerts when the apply button is clicked without both dates", async () => {
    await importAndStartSalesReport();

    document.getElementById("apply-filter-btn").click();

    expect(window.alert).toHaveBeenCalledWith(
      "Please choose both a start date and an end date."
    );
  });

  it("alerts when the start date is after the end date", async () => {
    await importAndStartSalesReport();

    document.getElementById("sr-start-date").value = "2026-05-20";
    document.getElementById("sr-end-date").value = "2026-05-18";

    document.getElementById("apply-filter-btn").click();

    expect(window.alert).toHaveBeenCalledWith(
      "Start date cannot be after end date."
    );
  });

  it("clears the date filters and returns to the prompt", async () => {
    await importAndStartSalesReport();

    document.getElementById("sr-start-date").value = "2026-05-17";
    document.getElementById("sr-end-date").value = "2026-05-18";

    document.getElementById("clear-filter-btn").click();

    expect(document.getElementById("sr-start-date").value).toBe("");
    expect(document.getElementById("sr-end-date").value).toBe("");

    expect(document.getElementById("sales-report-output").textContent).toContain(
      "Choose a date range to view sales"
    );
  });
});