import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const PEAK_HOURS_FILE_PATH = "../adminControls/peak-hours-report.js";

function setupPeakHoursDom() {
  document.body.innerHTML = `
    <main>
      <section id="peak-hours-output"></section>
    </main>
  `;
}

async function importPeakHoursModule() {
  await import(`${PEAK_HOURS_FILE_PATH}?test=${Date.now()}-${Math.random()}`);

  if (typeof window.initPeakHoursReport !== "function") {
    throw new Error("window.initPeakHoursReport was not created.");
  }
}

async function runPeakHoursReport() {
  await importPeakHoursModule();
  await window.initPeakHoursReport();
}

describe("peak hours report", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    setupPeakHoursDom();

    global.fetch = vi.fn();

    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});

    delete window.initPeakHoursReport;
  });

  afterEach(() => {
    vi.restoreAllMocks();

    delete global.fetch;
    delete window.initPeakHoursReport;

    document.body.innerHTML = "";
  });

  it("loads analytics data and renders peak hours using South African time", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: vi.fn(async () => ({
        success: true,
        data: [
          {
            created_at: "2026-05-18T10:15:00.000Z",
            payment_status: "paid",
          },
          {
            created_at: "2026-05-18T10:45:00.000Z",
            payment_status: "paid",
          },
          {
            created_at: "2026-05-18T11:00:00.000Z",
            payment_status: "paid",
          },
          {
            created_at: "2026-05-18T12:00:00.000Z",
            payment_status: "pending",
          },
        ],
      })),
    });

    await runPeakHoursReport();

    const output = document.getElementById("peak-hours-output");

    expect(global.fetch).toHaveBeenCalledWith(
      "https://campus-food-ordering.pages.dev/api/analytics"
    );

    expect(output.innerHTML).toContain("peak-hours-table");
    expect(output.textContent).toContain("12:00 - 13:00");
    expect(output.textContent).toContain("13:00 - 14:00");
    expect(output.textContent).toContain("Number of Paid Orders");

    const rows = output.querySelectorAll("tbody tr");

    expect(rows.length).toBe(2);

    expect(rows[0].textContent).toContain("12:00 - 13:00");
    expect(rows[0].textContent).toContain("2");
    expect(rows[0].className).toContain("busiest-hour");

    expect(rows[1].textContent).toContain("13:00 - 14:00");
    expect(rows[1].textContent).toContain("1");
  });

  it("uses order_hour plus 2 hours when created_at is missing", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: vi.fn(async () => ({
        success: true,
        data: [
          {
            order_hour: 22,
            payment_status: "paid",
          },
        ],
      })),
    });

    await runPeakHoursReport();

    const output = document.getElementById("peak-hours-output");

    expect(output.textContent).toContain("00:00 - 01:00");
    expect(output.textContent).toContain("1");
    expect(console.warn).toHaveBeenCalled();
  });

  it("ignores unpaid, pending, and failed orders", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: vi.fn(async () => ({
        success: true,
        data: [
          {
            created_at: "2026-05-18T10:00:00.000Z",
            payment_status: "unpaid",
          },
          {
            created_at: "2026-05-18T11:00:00.000Z",
            payment_status: "pending",
          },
          {
            created_at: "2026-05-18T12:00:00.000Z",
            payment_status: "failed",
          },
        ],
      })),
    });

    await runPeakHoursReport();

    const output = document.getElementById("peak-hours-output");

    expect(output.textContent).toContain("No Peak Hours Data");
    expect(output.textContent).toContain(
      "No paid orders were found for the peak hours report."
    );
  });

  it("includes orders when payment_status is missing", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: vi.fn(async () => ({
        success: true,
        data: [
          {
            created_at: "2026-05-18T08:00:00.000Z",
          },
        ],
      })),
    });

    await runPeakHoursReport();

    const output = document.getElementById("peak-hours-output");

    expect(output.textContent).toContain("10:00 - 11:00");
    expect(output.textContent).toContain("1");
  });

  it("shows empty state when the API returns no data", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: vi.fn(async () => ({
        success: true,
        data: [],
      })),
    });

    await runPeakHoursReport();

    const output = document.getElementById("peak-hours-output");

    expect(output.textContent).toContain("No Peak Hours Data");
    expect(output.textContent).toContain(
      "No paid orders were found for the peak hours report."
    );
  });

  it("shows empty state when the API returns success false", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: vi.fn(async () => ({
        success: false,
        message: "Analytics API error",
      })),
    });

    await runPeakHoursReport();

    const output = document.getElementById("peak-hours-output");

    expect(console.error).toHaveBeenCalled();
    expect(output.textContent).toContain("No Peak Hours Data");
  });

  it("shows empty state when fetch fails", async () => {
    global.fetch.mockRejectedValue(new Error("Network error"));

    await runPeakHoursReport();

    const output = document.getElementById("peak-hours-output");

    expect(console.error).toHaveBeenCalled();
    expect(output.textContent).toContain("No Peak Hours Data");
  });

  it("shows empty state when the response is not ok", async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      json: vi.fn(),
    });

    await runPeakHoursReport();

    const output = document.getElementById("peak-hours-output");

    expect(console.error).toHaveBeenCalled();
    expect(output.textContent).toContain("No Peak Hours Data");
  });

  it("ignores invalid timestamps", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: vi.fn(async () => ({
        success: true,
        data: [
          {
            created_at: "not-a-real-date",
            payment_status: "paid",
          },
        ],
      })),
    });

    await runPeakHoursReport();

    const output = document.getElementById("peak-hours-output");

    expect(console.warn).toHaveBeenCalled();
    expect(output.textContent).toContain("No Peak Hours Data");
  });

  it("handles missing peak-hours-output element without crashing", async () => {
    document.body.innerHTML = "";

    global.fetch.mockResolvedValue({
      ok: true,
      json: vi.fn(async () => ({
        success: true,
        data: [
          {
            created_at: "2026-05-18T10:00:00.000Z",
            payment_status: "paid",
          },
        ],
      })),
    });

    await runPeakHoursReport();

    expect(console.error).toHaveBeenCalledWith(
      "peak-hours-output element not found."
    );
  });
});