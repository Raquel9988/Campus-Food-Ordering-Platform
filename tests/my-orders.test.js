import { describe, test, expect, vi, beforeEach } from "vitest";

import {
  escapeHtml,
  formatCurrency,
  getSafeOrderId,
  normaliseStatus,
  isPaidOrder,
  isActiveOrder,
  isHistoryOrder,
  filterOrders,
  getAcknowledgedReadyOrdersKey,
  getAcknowledgedReadyOrderIds,
  isAcknowledgedReadyOrder,
  getDisplayStatusKey,
  getStatusClass,
  getStudentOrderStatusText,
  getPaymentStatusText,
  getEmptyMessage,
  getInitialFilter,
  createMyOrdersController,
} from "../student/my-orders.js";

function createElementMock(id = "") {
  return {
    id,
    innerHTML: "",
    textContent: "",
    dataset: {},
    style: {},
    className: "",
    onclick: null,
    children: [],

    classList: {
      add: vi.fn(),
      remove: vi.fn(),
      toggle: vi.fn(),
    },

    appendChild: vi.fn(function (child) {
      this.children.push(child);
    }),

    remove: vi.fn(),
  };
}

function createDocumentMock() {
  const elements = {
    "loading-container": createElementMock("loading-container"),
    "error-container": createElementMock("error-container"),
    "error-text": createElementMock("error-text"),
    "orders-container": createElementMock("orders-container"),
    "empty-state": createElementMock("empty-state"),
    "refresh-btn": createElementMock("refresh-btn"),
    "retry-btn": createElementMock("retry-btn"),
    "back-btn": createElementMock("back-btn"),
    "empty-title": createElementMock("empty-title"),
    "empty-message": createElementMock("empty-message"),
  };

  const activeTab = createElementMock("active-tab");
  activeTab.dataset.filter = "active";

  const historyTab = createElementMock("history-tab");
  historyTab.dataset.filter = "history";

  return {
    elements,
    filterTabs: [activeTab, historyTab],
    body: createElementMock("body"),
    readyState: "loading",

    getElementById: vi.fn((id) => {
      return elements[id] || null;
    }),

    querySelectorAll: vi.fn((selector) => {
      if (selector === ".filter-tab") {
        return [activeTab, historyTab];
      }

      return [];
    }),

    createElement: vi.fn((tagName) => {
      const element = createElementMock(tagName);
      element.tagName = tagName.toUpperCase();
      return element;
    }),

    addEventListener: vi.fn(),
  };
}

function createWindowMock(search = "") {
  return {
    location: {
      href: `https://campus-food-ordering.pages.dev/student/my-orders.html${search}`,
      search,
    },

    history: {
      replaceState: vi.fn(),
    },
  };
}

function createLocalStorageMock(initialValues = {}) {
  const store = { ...initialValues };

  return {
    getItem: vi.fn((key) => {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    }),

    setItem: vi.fn((key, value) => {
      store[key] = String(value);
    }),

    removeItem: vi.fn((key) => {
      delete store[key];
    }),

    clear: vi.fn(() => {
      Object.keys(store).forEach((key) => {
        delete store[key];
      });
    }),

    store,
  };
}

function createSupabaseMock({
  user = { id: "student-1" },
  userError = null,
  orders = [],
  ordersError = null,
  items = [],
  itemsError = null,
  menuName = "Burger",
  vendorName = "Campus Burgers",
} = {}) {
  const supabaseClient = {
    realtimeCallback: null,

    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user,
        },
        error: userError,
      }),
    },

    from: vi.fn((tableName) => {
      const query = {
        select: vi.fn(() => query),
        eq: vi.fn(() => query),
        in: vi.fn(() => query),

        order: vi.fn(async () => {
          if (tableName === "orders") {
            return {
              data: orders,
              error: ordersError,
            };
          }

          return {
            data: [],
            error: null,
          };
        }),

        single: vi.fn(async () => {
          if (tableName === "menu_items") {
            return {
              data: {
                name: menuName,
              },
              error: null,
            };
          }

          if (tableName === "vendors") {
            return {
              data: {
                business_name: vendorName,
              },
              error: null,
            };
          }

          return {
            data: null,
            error: null,
          };
        }),
      };

      if (tableName === "order_items") {
        query.eq = vi.fn(async () => {
          return {
            data: items,
            error: itemsError,
          };
        });
      }

      return query;
    }),

    channel: vi.fn(() => {
      return {
        on: vi.fn((eventName, config, callback) => {
          supabaseClient.realtimeCallback = callback;

          return {
            subscribe: vi.fn(() => {
              return {
                subscribed: true,
              };
            }),
          };
        }),
      };
    }),
  };

  return supabaseClient;
}

describe("actual my-orders page logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("escapes unsafe HTML", () => {
    expect(escapeHtml(`<script>alert("x")</script>`)).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;"
    );
  });

  test("formats currency", () => {
    expect(formatCurrency(25)).toBe("R25.00");
    expect(formatCurrency("12.5")).toBe("R12.50");
    expect(formatCurrency(null)).toBe("R0.00");
  });

  test("gets safe shortened order id", () => {
    expect(getSafeOrderId("ORDER-123456")).toBe("ORDER-");
  });

  test("normalises status text", () => {
    expect(normaliseStatus(" READY ")).toBe("ready");
    expect(normaliseStatus(null)).toBe("");
    expect(normaliseStatus(undefined)).toBe("");
  });

  test("detects active and history paid orders", () => {
    const activeOrder = {
      id: "ORDER-1",
      payment_status: "paid",
      status: "ready",
    };

    const historyOrder = {
      id: "ORDER-2",
      payment_status: "paid",
      status: "complete",
    };

    const unpaidOrder = {
      id: "ORDER-3",
      payment_status: "pending",
      status: "ready",
    };

    expect(isPaidOrder(activeOrder)).toBe(true);
    expect(isActiveOrder(activeOrder)).toBe(true);
    expect(isHistoryOrder(activeOrder)).toBe(false);

    expect(isHistoryOrder(historyOrder)).toBe(true);
    expect(isActiveOrder(historyOrder)).toBe(false);

    expect(isActiveOrder(unpaidOrder)).toBe(false);
  });

  test("treats acknowledged ready orders as history, not active", () => {
    const acknowledgedReadyOrder = {
      id: "ORDER-READY-1",
      payment_status: "paid",
      status: "ready",
    };

    const acknowledgedIds = ["ORDER-READY-1"];

    expect(isAcknowledgedReadyOrder(acknowledgedReadyOrder, acknowledgedIds)).toBe(
      true
    );

    expect(isActiveOrder(acknowledgedReadyOrder, acknowledgedIds)).toBe(false);
    expect(isHistoryOrder(acknowledgedReadyOrder, acknowledgedIds)).toBe(true);
  });

  test("filters orders by active and history without acknowledgements", () => {
    const orders = [
      {
        id: "1",
        payment_status: "paid",
        status: "received",
      },
      {
        id: "2",
        payment_status: "paid",
        status: "complete",
      },
      {
        id: "3",
        payment_status: "pending",
        status: "received",
      },
    ];

    expect(filterOrders(orders, "active").map((order) => order.id)).toEqual([
      "1",
    ]);

    expect(filterOrders(orders, "history").map((order) => order.id)).toEqual([
      "2",
    ]);
  });

  test("filters acknowledged ready orders into history", () => {
    const orders = [
      {
        id: "1",
        payment_status: "paid",
        status: "ready",
      },
      {
        id: "2",
        payment_status: "paid",
        status: "complete",
      },
      {
        id: "3",
        payment_status: "paid",
        status: "preparing",
      },
    ];

    const acknowledgedIds = ["1"];

    expect(
      filterOrders(orders, "active", acknowledgedIds).map((order) => order.id)
    ).toEqual(["3"]);

    expect(
      filterOrders(orders, "history", acknowledgedIds).map((order) => order.id)
    ).toEqual(["1", "2"]);
  });

  test("gets acknowledged ready orders key", () => {
    expect(getAcknowledgedReadyOrdersKey("student-1")).toBe(
      "acknowledged_ready_orders_student-1"
    );
  });

  test("gets acknowledged ready order ids from localStorage", () => {
    const localStorageRef = createLocalStorageMock({
      acknowledged_ready_orders_student_1: JSON.stringify(["ORDER-1"]),
    });

    expect(
      getAcknowledgedReadyOrderIds("student_1", localStorageRef)
    ).toEqual(["ORDER-1"]);
  });

  test("returns empty acknowledged list when localStorage is invalid", () => {
    const localStorageRef = createLocalStorageMock({
      acknowledged_ready_orders_student_1: "not-json",
    });

    expect(
      getAcknowledgedReadyOrderIds("student_1", localStorageRef)
    ).toEqual([]);
  });

  test("gets display status key and status class", () => {
    expect(
      getDisplayStatusKey({
        payment_status: "pending",
        status: "payment_pending",
      })
    ).toBe("payment_pending");

    expect(
      getDisplayStatusKey({
        payment_status: "failed",
        status: "received",
      })
    ).toBe("payment_failed");

    expect(
      getStatusClass({
        payment_status: "paid",
        status: "ready",
      })
    ).toBe("status-ready");
  });

  test("gets student order status text", () => {
    expect(
      getStudentOrderStatusText({
        id: "ORDER-1",
        payment_status: "paid",
        status: "received",
      })
    ).toBe("Payment Received / Order Received");

    expect(
      getStudentOrderStatusText({
        id: "ORDER-2",
        payment_status: "paid",
        status: "preparing",
      })
    ).toBe("Being Prepared");

    expect(
      getStudentOrderStatusText({
        id: "ORDER-3",
        payment_status: "failed",
        status: "payment_failed",
      })
    ).toBe("Payment Failed");
  });

  test("gets acknowledged ready student order status text", () => {
    expect(
      getStudentOrderStatusText(
        {
          id: "ORDER-READY-1",
          payment_status: "paid",
          status: "ready",
        },
        ["ORDER-READY-1"]
      )
    ).toBe("Ready for Collection / Acknowledged");
  });

  test("gets payment status text", () => {
    expect(getPaymentStatusText("pending")).toBe("Payment Pending");
    expect(getPaymentStatusText("paid")).toBe("Paid");
    expect(getPaymentStatusText("unknown_status")).toBe("unknown_status");
  });

  test("gets correct empty messages", () => {
    expect(getEmptyMessage("active").title).toBe("No active orders");
    expect(getEmptyMessage("history").title).toBe("No order history");

    expect(getEmptyMessage("history").message).toBe(
      "Completed orders and acknowledged ready orders will appear here."
    );
  });

  test("gets initial filter from URL", () => {
    expect(getInitialFilter(createWindowMock("?filter=history"))).toBe("history");
    expect(getInitialFilter(createWindowMock("?filter=bad"))).toBe("active");
  });

  test("redirects to login when no user is authenticated", async () => {
    const documentRef = createDocumentMock();
    const windowRef = createWindowMock();

    const controller = createMyOrdersController({
      supabaseClient: createSupabaseMock({
        user: null,
      }),
      documentRef,
      windowRef,
      localStorageRef: createLocalStorageMock(),
      setTimeoutRef: vi.fn(),
    });

    const userId = await controller.checkStudentAuth();

    expect(userId).toBe(null);
    expect(windowRef.location.href).toBe("../auth/login.html");
  });

  test("shows error when auth check fails", async () => {
    const documentRef = createDocumentMock();

    const controller = createMyOrdersController({
      supabaseClient: createSupabaseMock({
        userError: {
          message: "Auth failed",
        },
      }),
      documentRef,
      windowRef: createWindowMock(),
      localStorageRef: createLocalStorageMock(),
      setTimeoutRef: vi.fn(),
    });

    const userId = await controller.checkStudentAuth();

    expect(userId).toBe(null);
    expect(documentRef.elements["error-text"].textContent).toBe(
      "Could not check your login session."
    );
  });

  test("fetches paid orders and adds items, total, and vendor name", async () => {
    const supabaseClient = createSupabaseMock({
      orders: [
        {
          id: "ORDER-1",
          student_id: "student-1",
          vendor_id: "vendor-1",
          status: "received",
          payment_status: "paid",
          created_at: "2026-05-01T10:00:00Z",
          updated_at: "2026-05-01T10:00:00Z",
        },
      ],
      items: [
        {
          menu_item_id: "menu-1",
          quantity: 2,
          price: 30,
        },
      ],
      menuName: "Burger",
      vendorName: "Campus Burgers",
    });

    const controller = createMyOrdersController({
      supabaseClient,
      documentRef: createDocumentMock(),
      windowRef: createWindowMock(),
      localStorageRef: createLocalStorageMock(),
      setTimeoutRef: vi.fn(),
    });

    const orders = await controller.fetchOrders("student-1");

    expect(orders).toHaveLength(1);
    expect(orders[0].items[0].name).toBe("Burger");
    expect(orders[0].total_price).toBe(60);
    expect(orders[0].vendorName).toBe("Campus Burgers");
  });

  test("throws error when orders cannot be loaded", async () => {
    const controller = createMyOrdersController({
      supabaseClient: createSupabaseMock({
        ordersError: {
          message: "Database error",
        },
      }),
      documentRef: createDocumentMock(),
      windowRef: createWindowMock(),
      localStorageRef: createLocalStorageMock(),
      setTimeoutRef: vi.fn(),
    });

    await expect(controller.fetchOrders("student-1")).rejects.toThrow(
      "Could not load your orders."
    );
  });

  test("renders active orders into orders container", () => {
    const documentRef = createDocumentMock();

    const controller = createMyOrdersController({
      supabaseClient: createSupabaseMock(),
      documentRef,
      windowRef: createWindowMock(),
      localStorageRef: createLocalStorageMock(),
      setTimeoutRef: vi.fn(),
    });

    controller.renderOrders(
      [
        {
          id: "ORDER-123",
          vendorName: "Campus Burgers",
          created_at: "2026-05-01T10:00:00Z",
          updated_at: "2026-05-01T10:00:00Z",
          payment_status: "paid",
          payment_provider: "payfast_sandbox",
          payment_amount: 50,
          status: "ready",
          total_price: 50,
          items: [
            {
              name: "Burger",
              quantity: 1,
              price: 50,
            },
          ],
        },
      ],
      "active"
    );

    expect(documentRef.elements["orders-container"].appendChild).toHaveBeenCalled();
    expect(documentRef.elements["orders-container"].children).toHaveLength(1);
  });

  test("renders acknowledged ready order in history", () => {
    const documentRef = createDocumentMock();

    const localStorageRef = createLocalStorageMock({
      acknowledged_ready_orders_student_1: JSON.stringify(["ORDER-123"]),
    });

    const controller = createMyOrdersController({
      supabaseClient: createSupabaseMock(),
      documentRef,
      windowRef: createWindowMock("?filter=history"),
      localStorageRef,
      setTimeoutRef: vi.fn(),
    });

    controller.state.currentStudentId = "student_1";

    controller.renderOrders(
      [
        {
          id: "ORDER-123",
          vendorName: "Campus Burgers",
          created_at: "2026-05-01T10:00:00Z",
          updated_at: "2026-05-01T10:30:00Z",
          payment_status: "paid",
          payment_provider: "payfast_sandbox",
          payment_amount: 50,
          status: "ready",
          total_price: 50,
          items: [
            {
              name: "Burger",
              quantity: 1,
              price: 50,
            },
          ],
        },
      ],
      "history"
    );

    expect(documentRef.elements["orders-container"].appendChild).toHaveBeenCalled();
    expect(documentRef.elements["orders-container"].children).toHaveLength(1);

    const renderedCard = documentRef.elements["orders-container"].children[0];

    expect(renderedCard.innerHTML).toContain(
      "Ready for Collection / Acknowledged"
    );

    expect(renderedCard.innerHTML).toContain(
      "Student Acknowledgement:"
    );
  });

  test("does not render acknowledged ready order as active", () => {
    const documentRef = createDocumentMock();

    const localStorageRef = createLocalStorageMock({
      acknowledged_ready_orders_student_1: JSON.stringify(["ORDER-123"]),
    });

    const controller = createMyOrdersController({
      supabaseClient: createSupabaseMock(),
      documentRef,
      windowRef: createWindowMock("?filter=active"),
      localStorageRef,
      setTimeoutRef: vi.fn(),
    });

    controller.state.currentStudentId = "student_1";

    controller.renderOrders(
      [
        {
          id: "ORDER-123",
          vendorName: "Campus Burgers",
          created_at: "2026-05-01T10:00:00Z",
          updated_at: "2026-05-01T10:30:00Z",
          payment_status: "paid",
          payment_provider: "payfast_sandbox",
          payment_amount: 50,
          status: "ready",
          total_price: 50,
          items: [
            {
              name: "Burger",
              quantity: 1,
              price: 50,
            },
          ],
        },
      ],
      "active"
    );

    expect(documentRef.elements["empty-title"].textContent).toBe(
      "No active orders"
    );

    expect(documentRef.elements["orders-container"].children).toHaveLength(0);
  });

  test("shows empty state when active filter has no matching orders", () => {
    const documentRef = createDocumentMock();

    const controller = createMyOrdersController({
      supabaseClient: createSupabaseMock(),
      documentRef,
      windowRef: createWindowMock(),
      localStorageRef: createLocalStorageMock(),
      setTimeoutRef: vi.fn(),
    });

    controller.renderOrders([], "active");

    expect(documentRef.elements["empty-title"].textContent).toBe(
      "No active orders"
    );
  });

  test("updates URL and renders when filter tab is clicked", () => {
    const documentRef = createDocumentMock();
    const windowRef = createWindowMock();

    const controller = createMyOrdersController({
      supabaseClient: createSupabaseMock(),
      documentRef,
      windowRef,
      localStorageRef: createLocalStorageMock(),
      setTimeoutRef: vi.fn(),
    });

    controller.state.allOrders = [];
    controller.handleFilterClick(documentRef.filterTabs[1]);

    expect(controller.state.currentFilter).toBe("history");
    expect(windowRef.history.replaceState).toHaveBeenCalled();
  });

  test("refreshes acknowledged ready orders from localStorage", () => {
    const localStorageRef = createLocalStorageMock({
      acknowledged_ready_orders_student_1: JSON.stringify(["ORDER-99"]),
    });

    const controller = createMyOrdersController({
      supabaseClient: createSupabaseMock(),
      documentRef: createDocumentMock(),
      windowRef: createWindowMock(),
      localStorageRef,
      setTimeoutRef: vi.fn(),
    });

    controller.state.currentStudentId = "student_1";

    const acknowledgedIds = controller.refreshAcknowledgedReadyOrders();

    expect(acknowledgedIds).toEqual(["ORDER-99"]);
    expect(controller.state.acknowledgedReadyOrderIds).toEqual(["ORDER-99"]);
  });

  test("sets up event listeners", () => {
    const documentRef = createDocumentMock();

    const controller = createMyOrdersController({
      supabaseClient: createSupabaseMock(),
      documentRef,
      windowRef: createWindowMock(),
      localStorageRef: createLocalStorageMock(),
      setTimeoutRef: vi.fn(),
    });

    controller.setupEventListeners();

    expect(documentRef.elements["refresh-btn"].onclick).toBeTypeOf("function");
    expect(documentRef.elements["retry-btn"].onclick).toBeTypeOf("function");
    expect(documentRef.elements["back-btn"].onclick).toBeTypeOf("function");

    expect(documentRef.addEventListener).toHaveBeenCalledWith(
      "DOMContentLoaded",
      controller.initializePage
    );
  });
});