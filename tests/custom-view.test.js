import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const CUSTOM_VIEW_FILE_PATH = "../adminControls/custom-view.js";

function setupCustomViewDom() {
  document.body.innerHTML = `
    <main>
      <section id="custom-view-output"></section>
    </main>
  `;
}

async function importCustomViewModule() {
  await import(`${CUSTOM_VIEW_FILE_PATH}?test=${Date.now()}-${Math.random()}`);

  if (typeof window.initCustomView !== "function") {
    throw new Error("window.initCustomView was not created.");
  }
}

async function runCustomView() {
  await importCustomViewModule();
  await window.initCustomView();
}

describe("custom analytics view", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    setupCustomViewDom();

    global.fetch = vi.fn();

    global.MutationObserver = class {
      observe() {}
      disconnect() {}
    };

    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(window, "alert").mockImplementation(() => {});

    delete window.initCustomView;
    delete window.customViewFilteredData;
  });

  afterEach(() => {
    vi.restoreAllMocks();

    delete global.fetch;
    delete global.MutationObserver;
    delete window.initCustomView;
    delete window.customViewFilteredData;

    document.body.innerHTML = "";
  });

  it("loads custom analytics data and renders the filter UI and table", async () => {
    const orders = [
      {
        order_date: "2026-05-18",
        vendor_name: "RDF Cafeteria",
        order_status: "complete",
        payment_status: "paid",
        order_total: 50,
      },
      {
        order_date: "2026-05-18",
        vendor_name: "Matrix Cafe",
        order_status: "ready",
        payment_status: "paid",
        order_total: 30,
      },
    ];

    global.fetch.mockResolvedValue({
      ok: true,
      json: vi.fn(async () => ({
        success: true,
        data: orders,
      })),
    });

    await runCustomView();

    const output = document.getElementById("custom-view-output");

    expect(global.fetch).toHaveBeenCalledWith(
      "https://campus-food-ordering.pages.dev/api/analytics"
    );

    expect(output.innerHTML).toContain("cv-filters");
    expect(output.textContent).toContain("RDF Cafeteria");
    expect(output.textContent).toContain("Matrix Cafe");
    expect(output.textContent).toContain("2 orders found");
    expect(output.textContent).toContain("R80.00");

    expect(window.customViewFilteredData).toEqual(orders);
  });

  it("filters orders by vendor", async () => {
    const orders = [
      {
        order_date: "2026-05-18",
        vendor_name: "RDF Cafeteria",
        order_status: "complete",
        payment_status: "paid",
        order_total: 50,
      },
      {
        order_date: "2026-05-18",
        vendor_name: "Matrix Cafe",
        order_status: "ready",
        payment_status: "paid",
        order_total: 30,
      },
    ];

    global.fetch.mockResolvedValue({
      ok: true,
      json: vi.fn(async () => ({
        success: true,
        data: orders,
      })),
    });

    await runCustomView();

    document.getElementById("cv-vendor").value = "RDF Cafeteria";
    document.getElementById("cv-apply-btn").click();

    const output = document.getElementById("custom-view-output");

    expect(window.customViewFilteredData).toHaveLength(1);
    expect(window.customViewFilteredData[0].vendor_name).toBe("RDF Cafeteria");

    expect(output.textContent).toContain("1 order found");
    expect(output.textContent).toContain("R50.00");
    expect(output.textContent).not.toContain("R30.00");
  });

  it("filters orders by date, order status, and payment status", async () => {
    const orders = [
      {
        order_date: "2026-05-17",
        vendor_name: "RDF Cafeteria",
        order_status: "complete",
        payment_status: "paid",
        order_total: 40,
      },
      {
        order_date: "2026-05-18",
        vendor_name: "RDF Cafeteria",
        order_status: "ready",
        payment_status: "pending",
        order_total: 20,
      },
      {
        order_date: "2026-05-19",
        vendor_name: "Matrix Cafe",
        order_status: "complete",
        payment_status: "paid",
        order_total: 60,
      },
    ];

    global.fetch.mockResolvedValue({
      ok: true,
      json: vi.fn(async () => ({
        success: true,
        data: orders,
      })),
    });

    await runCustomView();

    document.getElementById("cv-start-date").value = "2026-05-17";
    document.getElementById("cv-end-date").value = "2026-05-18";
    document.getElementById("cv-order-status").value = "complete";
    document.getElementById("cv-payment-status").value = "paid";

    document.getElementById("cv-apply-btn").click();

    expect(window.customViewFilteredData).toHaveLength(1);
    expect(window.customViewFilteredData[0].order_total).toBe(40);

    expect(document.getElementById("custom-view-output").textContent).toContain(
      "R40.00"
    );
  });

  it("shows an alert when the start date is after the end date", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: vi.fn(async () => ({
        success: true,
        data: [
          {
            order_date: "2026-05-18",
            vendor_name: "RDF Cafeteria",
            order_status: "complete",
            payment_status: "paid",
            order_total: 50,
          },
        ],
      })),
    });

    await runCustomView();

    document.getElementById("cv-start-date").value = "2026-05-20";
    document.getElementById("cv-end-date").value = "2026-05-18";

    document.getElementById("cv-apply-btn").click();

    expect(window.alert).toHaveBeenCalledWith(
      "Start date cannot be after end date."
    );
  });

  it("resets filters back to all orders", async () => {
    const orders = [
      {
        order_date: "2026-05-18",
        vendor_name: "RDF Cafeteria",
        order_status: "complete",
        payment_status: "paid",
        order_total: 50,
      },
      {
        order_date: "2026-05-18",
        vendor_name: "Matrix Cafe",
        order_status: "ready",
        payment_status: "paid",
        order_total: 30,
      },
    ];

    global.fetch.mockResolvedValue({
      ok: true,
      json: vi.fn(async () => ({
        success: true,
        data: orders,
      })),
    });

    await runCustomView();

    document.getElementById("cv-vendor").value = "RDF Cafeteria";
    document.getElementById("cv-apply-btn").click();

    expect(window.customViewFilteredData).toHaveLength(1);

    document.getElementById("cv-reset-btn").click();

    expect(window.customViewFilteredData).toHaveLength(2);
    expect(document.getElementById("custom-view-output").textContent).toContain(
      "2 orders found"
    );
  });

  it("shows empty state when no analytics data is returned", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: vi.fn(async () => ({
        success: true,
        data: [],
      })),
    });

    await runCustomView();

    const output = document.getElementById("custom-view-output");

    expect(output.textContent).toContain("No Analytics Data");
    expect(output.textContent).toContain("No paid orders are available to display.");
    expect(window.customViewFilteredData).toEqual([]);
  });

  it("shows error state when the API fails", async () => {
    global.fetch.mockRejectedValue(new Error("Network error"));

    await runCustomView();

    const output = document.getElementById("custom-view-output");

    expect(console.error).toHaveBeenCalled();
    expect(output.textContent).toContain("Failed to load custom analytics.");
    expect(window.customViewFilteredData).toEqual([]);
  });
});