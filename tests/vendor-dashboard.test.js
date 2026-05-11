import { describe, expect, test, beforeEach, afterEach, vi } from "vitest";

function setupDom() {
  document.body.innerHTML = `
    <main class="main-grid">
      <section class="field-group">
        <input id="business-name" />
      </section>

      <section class="field-group">
        <input id="vendor-email" />
      </section>

      <p id="user-info"></p>

      <button id="logout" type="button">Logout</button>
      <button id="orders-dashboard" type="button">Orders</button>
    </main>
  `;
}

function createQueryBuilder(tableName, mockState) {
  return {
    tableName,
    filters: [],
    selectedColumns: "",

    select(columns) {
      this.selectedColumns = columns;
      return this;
    },

    eq(column, value) {
      this.filters.push({
        column,
        value,
      });

      return this;
    },

    single() {
      if (this.tableName === "users") {
        return Promise.resolve({
          data: mockState.appUser,
          error: mockState.userError,
        });
      }

      if (this.tableName === "vendors") {
        return Promise.resolve({
          data: mockState.vendor,
          error: mockState.vendorError,
        });
      }

      return Promise.resolve({
        data: null,
        error: null,
      });
    },
  };
}

function createMockSupabase(overrides = {}) {
  const mockState = {
    user: {
      id: "user-1",
      email: "vendor@example.com",
    },

    authError: null,

    appUser: {
      id: "user-1",
      role: "vendor",
    },

    userError: null,

    vendor: {
      id: "vendor-1",
      business_name: "Campus Cafe",
      status: "approved",
    },

    vendorError: null,

    ...overrides,
  };

  return {
    __state: mockState,

    auth: {
      getUser: vi.fn(async () => ({
        data: {
          user: mockState.user,
        },
        error: mockState.authError,
      })),

      signOut: vi.fn(async () => ({
        error: null,
      })),
    },

    from: vi.fn((tableName) => {
      return createQueryBuilder(tableName, mockState);
    }),
  };
}

async function importVendorDashboardFile(mockSupabase = createMockSupabase()) {
  vi.resetModules();

  globalThis.__mockSupabase = mockSupabase;

  return await import("../vendor/vendor-dashboard.js");
}

beforeEach(() => {
  vi.useFakeTimers();
  setupDom();
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.resetModules();

  delete globalThis.__mockSupabase;

  document.body.innerHTML = "";
});

describe("vendor dashboard field errors", () => {
  test("showFieldError adds an error class and displays an error message", async () => {
    const dashboardModule = await importVendorDashboardFile();

    dashboardModule.showFieldError(
      "business-name",
      "Business name is required."
    );

    const field = document.getElementById("business-name");
    const hint = document.querySelector(".field-hint-error");

    expect(field.classList.contains("field-error")).toBe(true);
    expect(hint.textContent).toBe("Business name is required.");
  });

  test("showFieldError replaces an old error message for the same field", async () => {
    const dashboardModule = await importVendorDashboardFile();

    dashboardModule.showFieldError("business-name", "Old error.");
    dashboardModule.showFieldError("business-name", "New error.");

    const hints = document.querySelectorAll(".field-hint-error");

    expect(hints).toHaveLength(1);
    expect(hints[0].textContent).toBe("New error.");
  });

  test("clearFieldError removes the error class and error message", async () => {
    const dashboardModule = await importVendorDashboardFile();

    dashboardModule.showFieldError(
      "business-name",
      "Business name is required."
    );

    dashboardModule.clearFieldError("business-name");

    const field = document.getElementById("business-name");
    const hint = document.querySelector(".field-hint-error");

    expect(field.classList.contains("field-error")).toBe(false);
    expect(hint).toBe(null);
  });

  test("showFieldError safely does nothing when field does not exist", async () => {
    const dashboardModule = await importVendorDashboardFile();

    expect(() => {
      dashboardModule.showFieldError("missing-field", "Missing field.");
    }).not.toThrow();
  });

  test("clearFieldError safely does nothing when field does not exist", async () => {
    const dashboardModule = await importVendorDashboardFile();

    expect(() => {
      dashboardModule.clearFieldError("missing-field");
    }).not.toThrow();
  });
});

describe("vendor dashboard banner messages", () => {
  test("showBanner creates an error banner when one does not exist", async () => {
    const dashboardModule = await importVendorDashboardFile();

    dashboardModule.showBanner("Please log in first.", "error");

    const banner = document.getElementById("auth-banner");

    expect(banner).not.toBe(null);
    expect(banner.textContent).toBe("Please log in first.");
    expect(banner.className).toBe("auth-banner auth-banner--error");
  });

  test("showBanner uses error type by default", async () => {
    const dashboardModule = await importVendorDashboardFile();

    dashboardModule.showBanner("Access denied.");

    const banner = document.getElementById("auth-banner");

    expect(banner.textContent).toBe("Access denied.");
    expect(banner.className).toBe("auth-banner auth-banner--error");
  });

  test("showBanner can display a success banner", async () => {
    const dashboardModule = await importVendorDashboardFile();

    dashboardModule.showBanner("Vendor loaded successfully.", "success");

    const banner = document.getElementById("auth-banner");

    expect(banner.textContent).toBe("Vendor loaded successfully.");
    expect(banner.className).toBe("auth-banner auth-banner--success");
  });

  test("showBanner updates an existing banner instead of creating duplicates", async () => {
    const dashboardModule = await importVendorDashboardFile();

    dashboardModule.showBanner("Old message.", "error");
    dashboardModule.showBanner("New message.", "success");

    const banners = document.querySelectorAll("#auth-banner");

    expect(banners).toHaveLength(1);
    expect(banners[0].textContent).toBe("New message.");
    expect(banners[0].className).toBe("auth-banner auth-banner--success");
  });
});

describe("vendor dashboard auth checks", () => {
  test("getApprovedVendorAuth returns error when no user is logged in", async () => {
    const mockSupabase = createMockSupabase({
      user: null,
    });

    const dashboardModule = await importVendorDashboardFile(mockSupabase);

    const result = await dashboardModule.getApprovedVendorAuth();

    expect(result).toEqual({
      ok: false,
      message: "Please log in first.",
    });
  });

  test("getApprovedVendorAuth returns error when user profile cannot be verified", async () => {
    const mockSupabase = createMockSupabase({
      appUser: null,
      userError: {
        message: "User not found",
      },
    });

    const dashboardModule = await importVendorDashboardFile(mockSupabase);

    const result = await dashboardModule.getApprovedVendorAuth();

    expect(result).toEqual({
      ok: false,
      message: "Unable to verify user profile.",
    });
  });

  test("getApprovedVendorAuth returns error when user is not a vendor", async () => {
    const mockSupabase = createMockSupabase({
      appUser: {
        id: "user-1",
        role: "student",
      },
    });

    const dashboardModule = await importVendorDashboardFile(mockSupabase);

    const result = await dashboardModule.getApprovedVendorAuth();

    expect(result).toEqual({
      ok: false,
      message: "Access denied. Vendors only.",
    });
  });

  test("getApprovedVendorAuth returns error when vendor profile is not found", async () => {
    const mockSupabase = createMockSupabase({
      vendor: null,
      vendorError: {
        message: "Vendor not found",
      },
    });

    const dashboardModule = await importVendorDashboardFile(mockSupabase);

    const result = await dashboardModule.getApprovedVendorAuth();

    expect(result).toEqual({
      ok: false,
      message: "Vendor profile not found.",
    });
  });

  test("getApprovedVendorAuth signs out pending vendors", async () => {
    const mockSupabase = createMockSupabase({
      vendor: {
        id: "vendor-1",
        business_name: "Campus Cafe",
        status: "pending",
      },
    });

    const dashboardModule = await importVendorDashboardFile(mockSupabase);

    const result = await dashboardModule.getApprovedVendorAuth();

    expect(result).toEqual({
      ok: false,
      message: "Your vendor account is still pending approval.",
    });

    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
  });

  test("getApprovedVendorAuth signs out suspended vendors", async () => {
    const mockSupabase = createMockSupabase({
      vendor: {
        id: "vendor-1",
        business_name: "Campus Cafe",
        status: "suspended",
      },
    });

    const dashboardModule = await importVendorDashboardFile(mockSupabase);

    const result = await dashboardModule.getApprovedVendorAuth();

    expect(result).toEqual({
      ok: false,
      message: "Your vendor account has been suspended.",
    });

    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
  });

  test("getApprovedVendorAuth signs out unknown vendor statuses", async () => {
    const mockSupabase = createMockSupabase({
      vendor: {
        id: "vendor-1",
        business_name: "Campus Cafe",
        status: "blocked",
      },
    });

    const dashboardModule = await importVendorDashboardFile(mockSupabase);

    const result = await dashboardModule.getApprovedVendorAuth();

    expect(result).toEqual({
      ok: false,
      message: "Unknown vendor status.",
    });

    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
  });

  test("getApprovedVendorAuth returns success for approved vendor", async () => {
    const mockSupabase = createMockSupabase();

    const dashboardModule = await importVendorDashboardFile(mockSupabase);

    const result = await dashboardModule.getApprovedVendorAuth();

    expect(result.ok).toBe(true);
    expect(result.user.id).toBe("user-1");
    expect(result.user.email).toBe("vendor@example.com");
    expect(result.vendor.id).toBe("vendor-1");
    expect(result.vendor.business_name).toBe("Campus Cafe");
  });
});