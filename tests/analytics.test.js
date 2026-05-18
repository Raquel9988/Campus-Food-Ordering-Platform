import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const ANALYTICS_FILE_PATH = "../adminControls/analytics.js";

let loadHandler;

function setupAnalyticsPageDom() {
  document.body.innerHTML = `
    <main>
      <section>
        <p class="summary-number"></p>
        <p class="summary-number"></p>
        <p class="summary-number"></p>
        <p class="summary-number"></p>
      </section>

      <section id="sales-report-output"></section>
      <section id="peak-hours-output"></section>
      <section id="custom-view-output"></section>
      <section id="export-output"></section>
    </main>
  `;
}

function makeSingleQuery(result) {
  return {
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(async () => result),
      })),
    })),
  };
}

function makeSupabaseMock({
  authUser = { id: "admin-user-1" },
  authError = null,
  appUser = { id: "admin-user-1", role: "admin" },
  userError = null,
  adminProfile = {
    id: "admin-profile-1",
    user_id: "admin-user-1",
    status: "approved",
    is_master: false,
  },
  adminError = null,
} = {}) {
  return {
    auth: {
      getUser: vi.fn(async () => ({
        data: {
          user: authUser,
        },
        error: authError,
      })),
    },

    from: vi.fn((tableName) => {
      if (tableName === "users") {
        return makeSingleQuery({
          data: appUser,
          error: userError,
        });
      }

      if (tableName === "admins") {
        return makeSingleQuery({
          data: adminProfile,
          error: adminError,
        });
      }

      throw new Error(`Unexpected Supabase table used: ${tableName}`);
    }),
  };
}

async function importAnalyticsAndRunLoadHandler() {
  await import(`${ANALYTICS_FILE_PATH}?test=${Date.now()}-${Math.random()}`);

  if (typeof loadHandler !== "function") {
    throw new Error("Analytics load event handler was not registered.");
  }

  await loadHandler();
}

describe("admin analytics dashboard", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    loadHandler = undefined;

    setupAnalyticsPageDom();

    globalThis.__mockSupabase = makeSupabaseMock();

    global.fetch = vi.fn();

    vi.spyOn(window, "addEventListener").mockImplementation((event, handler) => {
      if (event === "load") {
        loadHandler = handler;
      }
    });

    vi.spyOn(global, "setTimeout").mockImplementation(() => 1);

    vi.spyOn(console, "error").mockImplementation(() => {});

    window.initPeakHoursReport = vi.fn();
    window.initCustomView = vi.fn();
    window.initExportReports = vi.fn();

    delete window.analyticsOrders;
  });

  afterEach(() => {
    vi.restoreAllMocks();

    delete globalThis.__mockSupabase;
    delete global.fetch;

    delete window.initPeakHoursReport;
    delete window.initCustomView;
    delete window.initExportReports;
    delete window.analyticsOrders;

    document.body.innerHTML = "";
  });

  it("loads analytics for an approved admin and updates the summary cards", async () => {
    const orders = [
      {
        order_total: 30,
        vendor_name: "RDF Cafeteria",
        order_hour: 10,
      },
      {
        order_total: "25.50",
        vendor_name: "RDF Cafeteria",
        order_hour: 10,
      },
      {
        order_total: 14.5,
        vendor_name: "Matrix Cafe",
        order_hour: 12,
      },
    ];

    global.fetch.mockResolvedValue({
      ok: true,
      json: vi.fn(async () => ({
        success: true,
        data: orders,
      })),
    });

    await importAnalyticsAndRunLoadHandler();

    const summaryNumbers = document.querySelectorAll(".summary-number");

    expect(summaryNumbers[0].textContent).toBe("3");
    expect(summaryNumbers[1].textContent).toBe("R70.00");
    expect(summaryNumbers[2].textContent).toBe("10:00");
    expect(summaryNumbers[3].textContent).toBe("2");

    expect(global.fetch).toHaveBeenCalledWith(
      "https://campus-food-ordering.pages.dev/api/analytics"
    );

    expect(window.analyticsOrders).toEqual(orders);

    expect(window.initPeakHoursReport).toHaveBeenCalledTimes(1);
    expect(window.initCustomView).toHaveBeenCalledTimes(1);
    expect(window.initExportReports).toHaveBeenCalledTimes(1);
  });

  it("shows access denied when the user is not logged in", async () => {
    globalThis.__mockSupabase = makeSupabaseMock({
      authUser: null,
    });

    await importAnalyticsAndRunLoadHandler();

    expect(global.fetch).not.toHaveBeenCalled();

    expect(document.getElementById("sales-report-output").textContent).toContain(
      "Access denied. Approved admins only."
    );

    expect(document.getElementById("peak-hours-output").textContent).toContain(
      "Access denied. Approved admins only."
    );

    expect(document.getElementById("custom-view-output").textContent).toContain(
      "Access denied. Approved admins only."
    );

    expect(document.getElementById("export-output").textContent).toContain(
      "Access denied. Approved admins only."
    );
  });

  it("shows access denied when the logged-in user is not an admin", async () => {
    globalThis.__mockSupabase = makeSupabaseMock({
      appUser: {
        id: "student-user-1",
        role: "student",
      },
    });

    await importAnalyticsAndRunLoadHandler();

    expect(global.fetch).not.toHaveBeenCalled();

    expect(document.getElementById("sales-report-output").textContent).toContain(
      "Access denied. Approved admins only."
    );
  });

  it("shows access denied when the admin profile is not approved", async () => {
    globalThis.__mockSupabase = makeSupabaseMock({
      adminProfile: {
        id: "admin-profile-1",
        user_id: "admin-user-1",
        status: "pending",
        is_master: false,
      },
    });

    await importAnalyticsAndRunLoadHandler();

    expect(global.fetch).not.toHaveBeenCalled();

    expect(document.getElementById("sales-report-output").textContent).toContain(
      "Access denied. Approved admins only."
    );
  });

  it("shows empty messages when the API returns no analytics orders", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: vi.fn(async () => ({
        success: true,
        data: [],
      })),
    });

    await importAnalyticsAndRunLoadHandler();

    expect(document.getElementById("sales-report-output").textContent).toContain(
      "No analytics data available."
    );

    expect(document.getElementById("peak-hours-output").textContent).toContain(
      "No peak hours data available."
    );

    expect(document.getElementById("custom-view-output").textContent).toContain(
      "No custom analytics available."
    );

    expect(document.getElementById("export-output").textContent).toContain(
      "No export data available."
    );

    expect(window.initPeakHoursReport).not.toHaveBeenCalled();
    expect(window.initCustomView).not.toHaveBeenCalled();
    expect(window.initExportReports).not.toHaveBeenCalled();
  });

  it("shows error messages when the analytics API request fails", async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      json: vi.fn(),
    });

    await importAnalyticsAndRunLoadHandler();

    expect(document.getElementById("sales-report-output").textContent).toContain(
      "Failed to load sales analytics."
    );

    expect(document.getElementById("peak-hours-output").textContent).toContain(
      "Failed to load peak hours analytics."
    );

    expect(document.getElementById("custom-view-output").textContent).toContain(
      "Failed to load custom analytics."
    );

    expect(document.getElementById("export-output").textContent).toContain(
      "Failed to load export tools."
    );
  });

  it("shows error messages when the analytics API returns success false", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: vi.fn(async () => ({
        success: false,
        message: "Analytics API returned an error",
      })),
    });

    await importAnalyticsAndRunLoadHandler();

    expect(document.getElementById("sales-report-output").textContent).toContain(
      "Failed to load sales analytics."
    );

    expect(document.getElementById("peak-hours-output").textContent).toContain(
      "Failed to load peak hours analytics."
    );

    expect(document.getElementById("custom-view-output").textContent).toContain(
      "Failed to load custom analytics."
    );

    expect(document.getElementById("export-output").textContent).toContain(
      "Failed to load export tools."
    );
  });

  it("shows module error messages when report modules are missing", async () => {
    delete window.initPeakHoursReport;
    delete window.initCustomView;
    delete window.initExportReports;

    global.fetch.mockResolvedValue({
      ok: true,
      json: vi.fn(async () => ({
        success: true,
        data: [
          {
            order_total: 20,
            vendor_name: "RDF Cafeteria",
            order_hour: 9,
          },
        ],
      })),
    });

    await importAnalyticsAndRunLoadHandler();

    expect(document.getElementById("peak-hours-output").textContent).toContain(
      "Error loading peak hours report."
    );

    expect(document.getElementById("custom-view-output").textContent).toContain(
      "Error loading custom analytics view."
    );

    expect(document.getElementById("export-output").textContent).toContain(
      "Error loading export reports."
    );
  });
});