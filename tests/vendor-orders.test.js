import { describe, expect, test, beforeEach, afterEach, vi } from "vitest";

function setupDom() {
  document.body.innerHTML = `
    <section id="loading-container" class="hidden"></section>
    <section id="error-container" class="hidden"></section>
    <p id="error-text"></p>
    <section id="orders-container" class="hidden"></section>
    <section id="empty-state" class="hidden"></section>

    <button id="refresh-btn" type="button">Refresh</button>
    <button id="retry-btn" type="button">Retry</button>
    <button id="dashboard-btn" type="button">Dashboard</button>
  `;
}

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

function createMockSupabase(overrides = {}) {
  const state = {
    user: {
      id: "user-1",
      email: "vendor@test.com",
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

    orders: [],
    ordersError: null,

    orderItems: [],
    orderItemsError: null,

    menuItem: {
      name: "Burger",
    },

    student: {
      email: "student@test.com",
    },

    updateResult: {
      id: "order-1",
      status: "preparing",
      payment_status: "paid",
    },
    updateError: null,

    updatedRows: [],
    orderQueries: [],

    ...overrides,
  };

  const supabaseClient = {
    __state: state,

    auth: {
      getUser: vi.fn(async () => ({
        data: {
          user: state.user,
        },
        error: state.authError,
      })),
    },

    from: vi.fn((tableName) => {
      const query = {
        tableName,
        filters: [],
        updateData: null,

        select: vi.fn(() => query),

        eq: vi.fn((column, value) => {
          query.filters.push({
            column,
            value,
          });

          if (tableName === "order_items" && column === "order_id") {
            return Promise.resolve({
              data: state.orderItems,
              error: state.orderItemsError,
            });
          }

          return query;
        }),

        in: vi.fn((column, value) => {
          query.filters.push({
            column,
            value,
          });

          return query;
        }),

        order: vi.fn(async () => {
          if (tableName === "orders") {
            state.orderQueries.push({
              filters: [...query.filters],
            });

            return {
              data: state.orders,
              error: state.ordersError,
            };
          }

          return {
            data: [],
            error: null,
          };
        }),

        single: vi.fn(async () => {
          if (tableName === "users" && query.filters.some((f) => f.column === "id")) {
            const selectedUserId = query.filters.find((f) => f.column === "id")?.value;

            if (selectedUserId === "student-1") {
              return {
                data: state.student,
                error: null,
              };
            }

            return {
              data: state.appUser,
              error: state.userError,
            };
          }

          if (tableName === "vendors") {
            return {
              data: state.vendor,
              error: state.vendorError,
            };
          }

          if (tableName === "menu_items") {
            return {
              data: state.menuItem,
              error: null,
            };
          }

          return {
            data: null,
            error: null,
          };
        }),

        update: vi.fn((data) => {
          query.updateData = data;

          state.updatedRows.push({
            tableName,
            data,
            filters: query.filters,
          });

          return query;
        }),

        maybeSingle: vi.fn(async () => {
          return {
            data: state.updateResult,
            error: state.updateError,
          };
        }),
      };

      return query;
    }),
  };

  return supabaseClient;
}

async function importOrdersFile(mockSupabase = createMockSupabase()) {
  vi.resetModules();

  globalThis.__mockSupabase = mockSupabase;

  return await import("../vendor/orders.js");
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.resetModules();
  setupDom();

  vi.stubGlobal("alert", vi.fn());

  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.resetModules();

  delete globalThis.__mockSupabase;

  document.body.innerHTML = "";
});

describe("vendor order status transitions", () => {
  test("vendor status transitions allow received to preparing", async () => {
    const { isValidStatusTransition } = await importOrdersFile();

    expect(isValidStatusTransition("received", "preparing")).toBe(true);
  });

  test("vendor status transitions allow preparing to ready", async () => {
    const { isValidStatusTransition } = await importOrdersFile();

    expect(isValidStatusTransition("preparing", "ready")).toBe(true);
  });

  test("vendor status transitions no longer allow ready to complete directly", async () => {
    const { isValidStatusTransition } = await importOrdersFile();

    expect(isValidStatusTransition("ready", "complete")).toBe(false);
  });

  test("vendor status transitions prevent invalid jumps", async () => {
    const { isValidStatusTransition } = await importOrdersFile();

    expect(isValidStatusTransition("received", "ready")).toBe(false);
    expect(isValidStatusTransition("received", "complete")).toBe(false);
    expect(isValidStatusTransition("preparing", "complete")).toBe(false);
    expect(isValidStatusTransition("ready", "preparing")).toBe(false);
    expect(isValidStatusTransition("ready", "received")).toBe(false);
  });

  test("vendor status transitions deny any change from complete", async () => {
    const { isValidStatusTransition } = await importOrdersFile();

    expect(isValidStatusTransition("complete", "received")).toBe(false);
    expect(isValidStatusTransition("complete", "preparing")).toBe(false);
    expect(isValidStatusTransition("complete", "ready")).toBe(false);
  });
});

describe("vendor order formatting", () => {
  test("currency is formatted with rand symbol and two decimals", async () => {
    const { formatCurrency } = await importOrdersFile();

    expect(formatCurrency(50)).toBe("R50.00");
    expect(formatCurrency(25.5)).toBe("R25.50");
    expect(formatCurrency(null)).toBe("R0.00");
  });

  test("missing date is shown as N/A", async () => {
    const { formatDate } = await importOrdersFile();

    expect(formatDate(null)).toBe("N/A");
    expect(formatDate("")).toBe("N/A");
  });

  test("unsafe HTML is escaped", async () => {
    const { escapeHtml } = await importOrdersFile();

    expect(escapeHtml("<script>bad</script>")).toBe(
      "&lt;script&gt;bad&lt;/script&gt;"
    );

    expect(escapeHtml("Fish & Chips")).toBe("Fish &amp; Chips");
    expect(escapeHtml('"quoted"')).toBe("&quot;quoted&quot;");
    expect(escapeHtml("it's nice")).toBe("it&#039;s nice");
  });
});

describe("vendor order cards", () => {
  test("received order card shows Start Preparing button", async () => {
    const { createOrderCard } = await importOrdersFile();

    const card = createOrderCard({
      id: "order-12345678",
      status: "received",
      payment_provider: "PayFast",
      transaction_id: "TX-001",
      paid_at: "2026-05-11T10:00:00Z",
      studentEmail: "student@example.com",
      created_at: "2026-05-11T09:50:00Z",
      total_price: 50,
      items: [
        {
          name: "Burger",
          quantity: 2,
          price: 25,
        },
      ],
    });

    expect(card.textContent).toContain("Order #order-12");
    expect(card.textContent).toContain("received");
    expect(card.textContent).toContain("Payment Received");
    expect(card.textContent).toContain("PayFast");
    expect(card.textContent).toContain("TX-001");
    expect(card.textContent).toContain("student@example.com");
    expect(card.textContent).toContain("Burger");
    expect(card.textContent).toContain("R25.00");
    expect(card.textContent).toContain("R50.00");
    expect(card.textContent).toContain("Start Preparing");
  });

  test("preparing order card shows Mark as Ready button", async () => {
    const { createOrderCard } = await importOrdersFile();

    const card = createOrderCard({
      id: "order-22222222",
      status: "preparing",
      payment_provider: "PayFast",
      transaction_id: "TX-002",
      paid_at: "2026-05-11T10:00:00Z",
      studentEmail: "student@example.com",
      created_at: "2026-05-11T09:50:00Z",
      total_price: 30,
      items: [
        {
          name: "Wrap",
          quantity: 1,
          price: 30,
        },
      ],
    });

    expect(card.textContent).toContain("preparing");
    expect(card.textContent).toContain("Mark as Ready");
    expect(card.textContent).not.toContain("Start Preparing");
    expect(card.textContent).not.toContain("Order Complete");
  });

  test("ready order card shows Order Complete button for student notification", async () => {
    const { createOrderCard } = await importOrdersFile();

    const card = createOrderCard({
      id: "order-33333333",
      status: "ready",
      payment_provider: "PayFast",
      transaction_id: "TX-003",
      paid_at: "2026-05-11T10:00:00Z",
      studentEmail: "student@example.com",
      created_at: "2026-05-11T09:50:00Z",
      total_price: 40,
      items: [
        {
          name: "Pizza",
          quantity: 1,
          price: 40,
        },
      ],
    });

    expect(card.textContent).toContain("ready");
    expect(card.textContent).toContain("Order Complete");
    expect(card.textContent).not.toContain("Start Preparing");
    expect(card.textContent).not.toContain("Mark as Ready");
  });

  test("order card shows no items found when items list is empty", async () => {
    const { createOrderCard } = await importOrdersFile();

    const card = createOrderCard({
      id: "order-44444444",
      status: "received",
      payment_provider: "PayFast",
      transaction_id: "TX-004",
      paid_at: "2026-05-11T10:00:00Z",
      studentEmail: "student@example.com",
      created_at: "2026-05-11T09:50:00Z",
      total_price: 0,
      items: [],
    });

    expect(card.textContent).toContain("No items found.");
    expect(card.textContent).toContain("R0.00");
  });

  test("order card escapes unsafe HTML in displayed text", async () => {
    const { createOrderCard } = await importOrdersFile();

    const card = createOrderCard({
      id: "order-55555555",
      status: "received",
      payment_provider: "PayFast",
      transaction_id: "TX-005",
      paid_at: "2026-05-11T10:00:00Z",
      studentEmail: "<script>alert('bad')</script>",
      created_at: "2026-05-11T09:50:00Z",
      total_price: 20,
      items: [
        {
          name: "<img src=x onerror=alert(1)>",
          quantity: 1,
          price: 20,
        },
      ],
    });

    expect(card.innerHTML).not.toContain("<script>");
    expect(card.innerHTML).not.toContain("<img src=x");
    expect(card.innerHTML).toContain("&lt;script&gt;");
    expect(card.innerHTML).toContain("&lt;img");
  });
});

describe("vendor order rendering", () => {
  test("renderOrders shows empty state when there are no orders", async () => {
    const { renderOrders } = await importOrdersFile();

    renderOrders([]);

    const emptyState = document.getElementById("empty-state");
    const ordersContainer = document.getElementById("orders-container");

    expect(emptyState.classList.contains("hidden")).toBe(false);
    expect(ordersContainer.classList.contains("hidden")).toBe(true);
  });

  test("renderOrders displays received and preparing orders under Active Orders", async () => {
    const { renderOrders } = await importOrdersFile();

    renderOrders([
      {
        id: "order-11111111",
        status: "received",
        payment_provider: "PayFast",
        transaction_id: "TX-111",
        paid_at: "2026-05-11T10:00:00Z",
        studentEmail: "student1@example.com",
        created_at: "2026-05-11T09:50:00Z",
        total_price: 50,
        items: [
          {
            name: "Burger",
            quantity: 2,
            price: 25,
          },
        ],
      },
      {
        id: "order-22222222",
        status: "preparing",
        payment_provider: "PayFast",
        transaction_id: "TX-222",
        paid_at: "2026-05-11T10:05:00Z",
        studentEmail: "student2@example.com",
        created_at: "2026-05-11T10:01:00Z",
        total_price: 30,
        items: [
          {
            name: "Wrap",
            quantity: 1,
            price: 30,
          },
        ],
      },
    ]);

    const ordersContainer = document.getElementById("orders-container");

    expect(ordersContainer.textContent).toContain("Active Orders");
    expect(ordersContainer.textContent).toContain("student1@example.com");
    expect(ordersContainer.textContent).toContain("student2@example.com");
    expect(ordersContainer.textContent).toContain("Start Preparing");
    expect(ordersContainer.textContent).toContain("Mark as Ready");
  });

  test("renderOrders displays ready orders under Ready for Pickup", async () => {
    const { renderOrders } = await importOrdersFile();

    renderOrders([
      {
        id: "order-33333333",
        status: "ready",
        payment_provider: "PayFast",
        transaction_id: "TX-333",
        paid_at: "2026-05-11T10:10:00Z",
        studentEmail: "student3@example.com",
        created_at: "2026-05-11T10:02:00Z",
        total_price: 40,
        items: [
          {
            name: "Pizza",
            quantity: 1,
            price: 40,
          },
        ],
      },
    ]);

    const ordersContainer = document.getElementById("orders-container");

    expect(ordersContainer.textContent).toContain("Ready for Pickup");
    expect(ordersContainer.textContent).toContain("student3@example.com");
    expect(ordersContainer.textContent).toContain("Order Complete");
  });
});

describe("vendor page display states", () => {
  test("showLoading displays loading and hides the other sections", async () => {
    const { showLoading } = await importOrdersFile();

    showLoading();

    expect(
      document.getElementById("loading-container").classList.contains("hidden")
    ).toBe(false);

    expect(
      document.getElementById("error-container").classList.contains("hidden")
    ).toBe(true);

    expect(
      document.getElementById("orders-container").classList.contains("hidden")
    ).toBe(true);

    expect(
      document.getElementById("empty-state").classList.contains("hidden")
    ).toBe(true);
  });

  test("showError displays the error message", async () => {
    const { showError } = await importOrdersFile();

    showError("Something went wrong");

    expect(
      document.getElementById("error-container").classList.contains("hidden")
    ).toBe(false);

    expect(
      document.getElementById("loading-container").classList.contains("hidden")
    ).toBe(true);

    expect(document.getElementById("error-text").textContent).toBe(
      "Something went wrong"
    );
  });

  test("showOrders displays orders container and hides empty state", async () => {
    const { showOrders } = await importOrdersFile();

    showOrders();

    expect(
      document.getElementById("orders-container").classList.contains("hidden")
    ).toBe(false);

    expect(
      document.getElementById("empty-state").classList.contains("hidden")
    ).toBe(true);

    expect(
      document.getElementById("error-container").classList.contains("hidden")
    ).toBe(true);
  });

  test("showEmpty displays the empty state", async () => {
    const { showEmpty } = await importOrdersFile();

    showEmpty();

    expect(
      document.getElementById("empty-state").classList.contains("hidden")
    ).toBe(false);

    expect(
      document.getElementById("orders-container").classList.contains("hidden")
    ).toBe(true);

    expect(
      document.getElementById("error-container").classList.contains("hidden")
    ).toBe(true);
  });
});

describe("vendor orders auth coverage", () => {
  test("getApprovedVendorAuth returns error when no user is logged in", async () => {
    const mockSupabase = createMockSupabase({
      user: null,
    });

    const { getApprovedVendorAuth } = await importOrdersFile(mockSupabase);

    await expect(getApprovedVendorAuth()).resolves.toEqual({
      ok: false,
      message: "Please log in first.",
    });
  });

  test("getApprovedVendorAuth returns error when user profile cannot be verified", async () => {
    const mockSupabase = createMockSupabase({
      appUser: null,
      userError: {
        message: "No profile",
      },
    });

    const { getApprovedVendorAuth } = await importOrdersFile(mockSupabase);

    await expect(getApprovedVendorAuth()).resolves.toEqual({
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

    const { getApprovedVendorAuth } = await importOrdersFile(mockSupabase);

    await expect(getApprovedVendorAuth()).resolves.toEqual({
      ok: false,
      message: "Access denied. Vendors only.",
    });
  });

  test("getApprovedVendorAuth returns error when vendor profile is not found", async () => {
    const mockSupabase = createMockSupabase({
      vendor: null,
      vendorError: {
        message: "Vendor missing",
      },
    });

    const { getApprovedVendorAuth } = await importOrdersFile(mockSupabase);

    await expect(getApprovedVendorAuth()).resolves.toEqual({
      ok: false,
      message: "Vendor profile not found.",
    });
  });

  test("getApprovedVendorAuth blocks pending vendor", async () => {
    const mockSupabase = createMockSupabase({
      vendor: {
        id: "vendor-1",
        business_name: "Campus Cafe",
        status: "pending",
      },
    });

    const { getApprovedVendorAuth } = await importOrdersFile(mockSupabase);

    await expect(getApprovedVendorAuth()).resolves.toEqual({
      ok: false,
      message: "Your vendor account is pending approval.",
    });
  });

  test("getApprovedVendorAuth blocks suspended vendor", async () => {
    const mockSupabase = createMockSupabase({
      vendor: {
        id: "vendor-1",
        business_name: "Campus Cafe",
        status: "suspended",
      },
    });

    const { getApprovedVendorAuth } = await importOrdersFile(mockSupabase);

    await expect(getApprovedVendorAuth()).resolves.toEqual({
      ok: false,
      message: "Your vendor account has been suspended.",
    });
  });

  test("getApprovedVendorAuth blocks unknown vendor status", async () => {
    const mockSupabase = createMockSupabase({
      vendor: {
        id: "vendor-1",
        business_name: "Campus Cafe",
        status: "blocked",
      },
    });

    const { getApprovedVendorAuth } = await importOrdersFile(mockSupabase);

    await expect(getApprovedVendorAuth()).resolves.toEqual({
      ok: false,
      message: "Unknown vendor status.",
    });
  });

  test("getApprovedVendorAuth returns vendor and user when approved", async () => {
    const mockSupabase = createMockSupabase();

    const { getApprovedVendorAuth } = await importOrdersFile(mockSupabase);

    const result = await getApprovedVendorAuth();

    expect(result.ok).toBe(true);
    expect(result.user.id).toBe("user-1");
    expect(result.vendor.id).toBe("vendor-1");
  });
});

describe("vendor orders data fetching coverage", () => {
  test("fetchOrders returns empty array when vendor has no paid active orders", async () => {
    const mockSupabase = createMockSupabase({
      orders: [],
    });

    const { fetchOrders } = await importOrdersFile(mockSupabase);

    await expect(fetchOrders("vendor-1")).resolves.toEqual([]);
  });

  test("fetchOrders throws when orders query fails", async () => {
    const mockSupabase = createMockSupabase({
      ordersError: {
        message: "Orders failed",
      },
    });

    const { fetchOrders } = await importOrdersFile(mockSupabase);

    await expect(fetchOrders("vendor-1")).rejects.toThrow("Orders failed");
  });

  test("fetchOrders enriches orders with items, student email, and total price", async () => {
    const mockSupabase = createMockSupabase({
      orders: [
        {
          id: "order-1",
          student_id: "student-1",
          vendor_id: "vendor-1",
          status: "received",
          payment_status: "paid",
          payment_provider: "PayFast",
          transaction_id: "TX-001",
          paid_at: "2026-05-11T10:00:00Z",
          created_at: "2026-05-11T09:50:00Z",
          updated_at: "2026-05-11T09:50:00Z",
        },
      ],

      orderItems: [
        {
          id: "item-row-1",
          menu_item_id: "menu-1",
          quantity: 2,
          price: 25,
        },
      ],

      menuItem: {
        name: "Burger",
      },

      student: {
        email: "student@test.com",
      },
    });

    const { fetchOrders } = await importOrdersFile(mockSupabase);

    const orders = await fetchOrders("vendor-1");

    expect(orders).toHaveLength(1);
    expect(orders[0].items[0].name).toBe("Burger");
    expect(orders[0].studentEmail).toBe("student@test.com");
    expect(orders[0].total_price).toBe(50);

    expect(mockSupabase.__state.orderQueries[0].filters).toEqual([
      {
        column: "vendor_id",
        value: "vendor-1",
      },
      {
        column: "payment_status",
        value: "paid",
      },
      {
        column: "status",
        value: ["received", "preparing", "ready"],
      },
    ]);
  });

  test("fetchOrders handles order item query error by returning empty items", async () => {
    const mockSupabase = createMockSupabase({
      orders: [
        {
          id: "order-1",
          student_id: "student-1",
          vendor_id: "vendor-1",
          status: "received",
          payment_status: "paid",
          created_at: "2026-05-11T09:50:00Z",
          updated_at: "2026-05-11T09:50:00Z",
        },
      ],

      orderItemsError: {
        message: "Items failed",
      },
    });

    const { fetchOrders } = await importOrdersFile(mockSupabase);

    const orders = await fetchOrders("vendor-1");

    expect(orders[0].items).toEqual([]);
    expect(orders[0].studentEmail).toBe("Unknown");
    expect(orders[0].total_price).toBe(0);
  });

  test("fetchOrders uses fallback values when menu item and student email are missing", async () => {
    const mockSupabase = createMockSupabase({
      orders: [
        {
          id: "order-1",
          student_id: "student-1",
          vendor_id: "vendor-1",
          status: "received",
          payment_status: "paid",
          created_at: "2026-05-11T09:50:00Z",
          updated_at: "2026-05-11T09:50:00Z",
        },
      ],

      orderItems: [
        {
          id: "item-row-1",
          menu_item_id: "menu-1",
          quantity: 1,
          price: 20,
        },
      ],

      menuItem: null,
      student: null,
    });

    const { fetchOrders } = await importOrdersFile(mockSupabase);

    const orders = await fetchOrders("vendor-1");

    expect(orders[0].items[0].name).toBe("Unknown item");
    expect(orders[0].studentEmail).toBe("Unknown");
    expect(orders[0].total_price).toBe(20);
  });
});

describe("vendor orders update and page flow coverage", () => {
  test("updateOrderStatus shows alert when vendor has not loaded", async () => {
    const { updateOrderStatus } = await importOrdersFile();

    await updateOrderStatus("order-1", "preparing", "received");

    expect(alert).toHaveBeenCalledWith("Vendor not loaded. Please refresh the page.");
  });

  test("updateOrderStatus shows alert for invalid status change", async () => {
    const mockSupabase = createMockSupabase({
      orders: [],
    });

    const { initializePage, updateOrderStatus, stopAutoRefresh } =
      await importOrdersFile(mockSupabase);

    await initializePage();

    await updateOrderStatus("order-1", "ready", "received");

    expect(alert).toHaveBeenCalledWith("Invalid status change.");

    stopAutoRefresh();
  });

  test("updateOrderStatus blocks direct ready to complete updates", async () => {
    const mockSupabase = createMockSupabase({
      orders: [],
    });

    const { initializePage, updateOrderStatus, stopAutoRefresh } =
      await importOrdersFile(mockSupabase);

    await initializePage();

    await updateOrderStatus("order-1", "complete", "ready");

    expect(alert).toHaveBeenCalledWith("Invalid status change.");
    expect(mockSupabase.__state.updatedRows).toHaveLength(0);

    stopAutoRefresh();
  });

  test("updateOrderStatus updates a paid order and reloads orders", async () => {
    const mockSupabase = createMockSupabase({
      orders: [],
      updateResult: {
        id: "order-1",
        status: "preparing",
        payment_status: "paid",
      },
    });

    const { initializePage, updateOrderStatus, stopAutoRefresh } =
      await importOrdersFile(mockSupabase);

    await initializePage();

    await updateOrderStatus("order-1", "preparing", "received");

    expect(mockSupabase.__state.updatedRows[0]).toMatchObject({
      tableName: "orders",
      data: {
        status: "preparing",
      },
    });

    expect(mockSupabase.__state.orderQueries.length).toBeGreaterThanOrEqual(2);

    stopAutoRefresh();
  });

  test("updateOrderStatus shows error alert when Supabase update fails", async () => {
    const mockSupabase = createMockSupabase({
      orders: [],
      updateError: {
        message: "Update failed",
      },
    });

    const { initializePage, updateOrderStatus, stopAutoRefresh } =
      await importOrdersFile(mockSupabase);

    await initializePage();

    await updateOrderStatus("order-1", "preparing", "received");

    expect(console.error).toHaveBeenCalledWith("Update order status error:", {
      message: "Update failed",
    });

    expect(alert).toHaveBeenCalledWith("Failed to update order.");

    stopAutoRefresh();
  });

  test("updateOrderStatus shows conflict alert when no updated row is returned", async () => {
    const mockSupabase = createMockSupabase({
      orders: [],
      updateResult: null,
    });

    const { initializePage, updateOrderStatus, stopAutoRefresh } =
      await importOrdersFile(mockSupabase);

    await initializePage();

    await updateOrderStatus("order-1", "preparing", "received");

    expect(alert).toHaveBeenCalledWith(
      "Order could not be updated. It may be unpaid, already completed, or already changed by another user."
    );

    expect(mockSupabase.__state.orderQueries.length).toBeGreaterThanOrEqual(2);

    stopAutoRefresh();
  });

  test("loadOrders shows error when vendor id is not set", async () => {
    const { loadOrders } = await importOrdersFile();

    await loadOrders();

    expect(document.getElementById("error-text").textContent).toBe(
      "Vendor ID not set."
    );
  });

  test("initializePage shows auth error when vendor is not approved", async () => {
    const mockSupabase = createMockSupabase({
      vendor: {
        id: "vendor-1",
        business_name: "Campus Cafe",
        status: "pending",
      },
    });

    const { initializePage } = await importOrdersFile(mockSupabase);

    await initializePage();

    expect(document.getElementById("error-text").textContent).toBe(
      "Your vendor account is pending approval."
    );
  });

  test("initializePage loads vendor orders and registers beforeunload handler", async () => {
    const mockSupabase = createMockSupabase({
      orders: [
        {
          id: "order-1",
          student_id: "student-1",
          vendor_id: "vendor-1",
          status: "received",
          payment_status: "paid",
          created_at: "2026-05-11T09:50:00Z",
          updated_at: "2026-05-11T09:50:00Z",
        },
      ],

      orderItems: [
        {
          id: "item-row-1",
          menu_item_id: "menu-1",
          quantity: 1,
          price: 25,
        },
      ],
    });

    const addEventSpy = vi.spyOn(window, "addEventListener");

    const { initializePage, stopAutoRefresh } = await importOrdersFile(mockSupabase);

    await initializePage();

    expect(document.getElementById("orders-container").textContent).toContain(
      "Active Orders"
    );

    expect(addEventSpy).toHaveBeenCalledWith(
      "beforeunload",
      expect.any(Function)
    );

    stopAutoRefresh();
  });

  test("silentRefresh does nothing when vendor is not loaded", async () => {
    const mockSupabase = createMockSupabase({
      orders: [
        {
          id: "order-1",
          status: "received",
        },
      ],
    });

    const { silentRefresh } = await importOrdersFile(mockSupabase);

    await silentRefresh();

    expect(mockSupabase.from).not.toHaveBeenCalledWith("orders");
  });

  test("silentRefresh logs warning when refresh fails", async () => {
    const mockSupabase = createMockSupabase({
      ordersError: {
        message: "Refresh failed",
      },
    });

    const { initializePage, silentRefresh, stopAutoRefresh } =
      await importOrdersFile(mockSupabase);

    await initializePage();

    await silentRefresh();

    expect(console.warn).toHaveBeenCalledWith(
      "Silent refresh failed:",
      expect.any(Error)
    );

    stopAutoRefresh();
  });

  test("startAutoRefresh triggers silent refresh on interval", async () => {
    const mockSupabase = createMockSupabase({
      orders: [],
    });

    const { initializePage, startAutoRefresh, stopAutoRefresh } =
      await importOrdersFile(mockSupabase);

    await initializePage();

    const before = mockSupabase.__state.orderQueries.length;

    startAutoRefresh();

    await vi.advanceTimersByTimeAsync(30000);

    expect(mockSupabase.__state.orderQueries.length).toBeGreaterThan(before);

    stopAutoRefresh();
  });

  test("stopAutoRefresh safely handles no active interval", async () => {
    const { stopAutoRefresh } = await importOrdersFile();

    expect(() => {
      stopAutoRefresh();
    }).not.toThrow();
  });
});

describe("vendor ready pickup notification flow", () => {
  test("notifyStudentForPickup shows alert when vendor has not loaded", async () => {
    const { notifyStudentForPickup } = await importOrdersFile();

    await notifyStudentForPickup("order-1", "ready");

    expect(alert).toHaveBeenCalledWith("Vendor not loaded. Please refresh the page.");
  });

  test("notifyStudentForPickup only allows ready orders", async () => {
    const mockSupabase = createMockSupabase({
      orders: [],
    });

    const { initializePage, notifyStudentForPickup, stopAutoRefresh } =
      await importOrdersFile(mockSupabase);

    await initializePage();

    await notifyStudentForPickup("order-1", "preparing");

    expect(alert).toHaveBeenCalledWith(
      "Only ready orders can be sent to the student for pickup."
    );

    expect(mockSupabase.__state.updatedRows).toHaveLength(0);

    stopAutoRefresh();
  });

  test("notifyStudentForPickup keeps the order ready and tells the vendor the student was notified", async () => {
    const mockSupabase = createMockSupabase({
      orders: [],
      updateResult: {
        id: "order-1",
        status: "ready",
        payment_status: "paid",
      },
    });

    const { initializePage, notifyStudentForPickup, stopAutoRefresh } =
      await importOrdersFile(mockSupabase);

    await initializePage();

    await notifyStudentForPickup("order-1", "ready");

    expect(mockSupabase.__state.updatedRows[0]).toMatchObject({
      tableName: "orders",
      data: {
        status: "ready",
      },
    });

    expect(mockSupabase.__state.updatedRows[0].data.status).not.toBe("complete");

    expect(alert).toHaveBeenCalledWith(
      "The student has been notified that this order is ready. The order will move to Order History after the student clicks OK on their side."
    );

    expect(mockSupabase.__state.orderQueries.length).toBeGreaterThanOrEqual(2);

    stopAutoRefresh();
  });

  test("notifyStudentForPickup shows error alert when Supabase update fails", async () => {
    const mockSupabase = createMockSupabase({
      orders: [],
      updateError: {
        message: "Notify failed",
      },
    });

    const { initializePage, notifyStudentForPickup, stopAutoRefresh } =
      await importOrdersFile(mockSupabase);

    await initializePage();

    await notifyStudentForPickup("order-1", "ready");

    expect(console.error).toHaveBeenCalledWith("Notify student error:", {
      message: "Notify failed",
    });

    expect(alert).toHaveBeenCalledWith("Failed to notify student.");

    stopAutoRefresh();
  });

  test("notifyStudentForPickup shows conflict alert when no updated row is returned", async () => {
    const mockSupabase = createMockSupabase({
      orders: [],
      updateResult: null,
    });

    const { initializePage, notifyStudentForPickup, stopAutoRefresh } =
      await importOrdersFile(mockSupabase);

    await initializePage();

    await notifyStudentForPickup("order-1", "ready");

    expect(alert).toHaveBeenCalledWith(
      "Order could not be confirmed for pickup. Please refresh and try again."
    );

    expect(mockSupabase.__state.orderQueries.length).toBeGreaterThanOrEqual(2);

    stopAutoRefresh();
  });

  test("clicking Order Complete on a ready card notifies the student instead of completing the order directly", async () => {
    const mockSupabase = createMockSupabase({
      orders: [],
      updateResult: {
        id: "order-33333333",
        status: "ready",
        payment_status: "paid",
      },
    });

    const { initializePage, createOrderCard, stopAutoRefresh } =
      await importOrdersFile(mockSupabase);

    await initializePage();

    const card = createOrderCard({
      id: "order-33333333",
      status: "ready",
      payment_provider: "PayFast",
      transaction_id: "TX-333",
      paid_at: "2026-05-11T10:10:00Z",
      studentEmail: "student3@example.com",
      created_at: "2026-05-11T10:02:00Z",
      total_price: 40,
      items: [
        {
          name: "Pizza",
          quantity: 1,
          price: 40,
        },
      ],
    });

    const completeButton = card.querySelector(".complete-btn");

    expect(completeButton).not.toBeNull();

    completeButton.click();

    await flushPromises();

    expect(mockSupabase.__state.updatedRows[0]).toMatchObject({
      tableName: "orders",
      data: {
        status: "ready",
      },
    });

    expect(mockSupabase.__state.updatedRows[0].data.status).not.toBe("complete");

    expect(alert).toHaveBeenCalledWith(
      "The student has been notified that this order is ready. The order will move to Order History after the student clicks OK on their side."
    );

    stopAutoRefresh();
  });
});