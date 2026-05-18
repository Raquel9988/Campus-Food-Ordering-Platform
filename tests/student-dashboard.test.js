import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";

import {
  escapeHtml,
  createStudentDashboardController,
} from "../student/student-dashboard.js";

function createStorageMock(initialValues = {}) {
  const store = {
    ...initialValues,
  };

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

    store,
  };
}

function createElementMock(id = "") {
  const button = {
    onclick: null,
  };

  return {
    id,
    innerHTML: "",
    textContent: "",
    className: "",
    children: [],
    onclick: null,
    hidden: false,
    style: {},
    attributes: {},

    setAttribute: vi.fn(function (name, value) {
      this.attributes[name] = value;
    }),

    classList: {
      add: vi.fn(),
      remove: vi.fn(),
    },

    appendChild: vi.fn(function (child) {
      this.children.push(child);
    }),

    addEventListener: vi.fn(function (event, handler) {
      this[`on${event}`] = handler;
    }),

    querySelector: vi.fn((selector) => {
      if (selector === "button") {
        return button;
      }

      return null;
    }),

    button,
  };
}

function createDocumentMock({ includeActiveOrdersDot = true } = {}) {
  const elements = {
    "user-info": createElementMock("user-info"),
    "vendors-list": createElementMock("vendors-list"),
    toast: createElementMock("toast"),
    "active-orders": createElementMock("active-orders"),
    "order-history": createElementMock("order-history"),
    "view-cart": createElementMock("view-cart"),
    logout: createElementMock("logout"),
  };

  if (includeActiveOrdersDot) {
    elements["active-orders-dot"] = createElementMock("active-orders-dot");
  }

  return {
    elements,
    readyState: "loading",

    getElementById: vi.fn((id) => {
      return elements[id] || null;
    }),

    createElement: vi.fn((tagName) => {
      const element = createElementMock(tagName);
      element.tagName = tagName.toUpperCase();

      if (tagName === "span") {
        elements["active-orders-dot"] = element;
      }

      return element;
    }),

    addEventListener: vi.fn(function (event, handler) {
      this[`on${event}`] = handler;
    }),
  };
}

function createWindowMock({ confirmResult = true } = {}) {
  return {
    location: {
      href: "",
    },

    confirm: vi.fn(() => confirmResult),

    addEventListener: vi.fn(function (event, handler) {
      this[`on${event}`] = handler;
    }),
  };
}

function createPaidReadyOrder(id = "ORDER-1") {
  return {
    id,
    vendor_id: "vendor-1",
    payment_status: "paid",
    status: "ready",
    created_at: "2026-05-18T10:00:00Z",
    updated_at: "2026-05-18T10:10:00Z",
  };
}

function createSupabaseMock({
  user = {
    id: "student-1",
    email: "student@test.com",
  },
  userError = null,

  appUser = {
    role: "student",
  },
  userRoleError = null,

  readyOrders = [],
  readyOrdersError = null,

  acknowledgementOrders = null,
  acknowledgementOrdersError = null,

  vendors = [
    {
      id: "vendor-1",
      business_name: "Campus Burgers",
    },
  ],
  vendorsError = null,

  vendorName = {
    business_name: "Campus Burgers",
  },
  vendorNameError = null,

  orderItems = [
    {
      menu_item_id: "menu-1",
      quantity: 2,
    },
  ],
  orderItemsError = null,

  menuItem = {
    name: "Burger",
  },
  menuItemError = null,

  updateResult = {
    id: "ORDER-1",
    status: "complete",
  },
  updateError = null,
} = {}) {
  const state = {
    updatedRows: [],
    orderQueries: [],
  };

  const supabaseClient = {
    __state: state,
    realtimeCallback: null,

    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user,
        },
        error: userError,
      }),

      signOut: vi.fn().mockResolvedValue({}),
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

          return query;
        }),

        order: vi.fn(async () => {
          if (tableName === "vendors") {
            return {
              data: vendors,
              error: vendorsError,
            };
          }

          if (tableName === "orders") {
            state.orderQueries.push({
              type: "acknowledgement",
              filters: [...query.filters],
            });

            return {
              data: acknowledgementOrders ?? readyOrders,
              error: acknowledgementOrdersError,
            };
          }

          return {
            data: [],
            error: null,
          };
        }),

        single: vi.fn(async () => {
          if (tableName === "users") {
            return {
              data: appUser,
              error: userRoleError,
            };
          }

          return {
            data: null,
            error: null,
          };
        }),

        maybeSingle: vi.fn(async () => {
          if (query.updateData) {
            return {
              data: updateResult,
              error: updateError,
            };
          }

          if (tableName === "vendors") {
            return {
              data: vendorName,
              error: vendorNameError,
            };
          }

          if (tableName === "menu_items") {
            return {
              data: menuItem,
              error: menuItemError,
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

        then(resolve, reject) {
          if (tableName === "orders") {
            state.orderQueries.push({
              type: "ready-id-check",
              filters: [...query.filters],
            });

            return Promise.resolve({
              data: readyOrders,
              error: readyOrdersError,
            }).then(resolve, reject);
          }

          if (tableName === "order_items") {
            return Promise.resolve({
              data: orderItems,
              error: orderItemsError,
            }).then(resolve, reject);
          }

          return Promise.resolve({
            data: null,
            error: null,
          }).then(resolve, reject);
        },
      };

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

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  vi.stubGlobal("alert", vi.fn());
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("actual student dashboard logic", () => {
  test("escapes unsafe HTML", () => {
    expect(escapeHtml(`<script>alert("x")</script>`)).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;"
    );
  });

  test("redirects to login when there is no authenticated user", async () => {
    const windowRef = createWindowMock();

    const controller = createStudentDashboardController({
      supabaseClient: createSupabaseMock({
        user: null,
      }),
      documentRef: createDocumentMock(),
      windowRef,
      localStorageRef: createStorageMock(),
      setTimeoutRef: vi.fn(),
    });

    const user = await controller.getStudentAuth();

    expect(user).toBe(null);
    expect(windowRef.location.href).toBe("../auth/login.html");
  });

  test("signs out and redirects when authenticated user is not a student", async () => {
    const windowRef = createWindowMock();
    const supabaseClient = createSupabaseMock({
      appUser: {
        role: "vendor",
      },
    });

    const controller = createStudentDashboardController({
      supabaseClient,
      documentRef: createDocumentMock(),
      windowRef,
      localStorageRef: createStorageMock(),
      setTimeoutRef: vi.fn(),
    });

    const user = await controller.getStudentAuth();

    expect(user).toBe(null);
    expect(supabaseClient.auth.signOut).toHaveBeenCalled();
    expect(windowRef.location.href).toBe("../auth/login.html");
  });

  test("returns user when authenticated user is a student", async () => {
    const controller = createStudentDashboardController({
      supabaseClient: createSupabaseMock(),
      documentRef: createDocumentMock(),
      windowRef: createWindowMock(),
      localStorageRef: createStorageMock(),
      setTimeoutRef: vi.fn(),
    });

    const user = await controller.getStudentAuth();

    expect(user.id).toBe("student-1");
    expect(user.email).toBe("student@test.com");
  });

  test("gets seen ready orders from localStorage", () => {
    const controller = createStudentDashboardController({
      supabaseClient: createSupabaseMock(),
      documentRef: createDocumentMock(),
      windowRef: createWindowMock(),
      localStorageRef: createStorageMock({
        seen_ready_orders: JSON.stringify(["ORDER-1", "ORDER-2"]),
      }),
      setTimeoutRef: vi.fn(),
    });

    expect(controller.getSeenReadyOrders()).toEqual(["ORDER-1", "ORDER-2"]);
  });

  test("returns empty seen orders when localStorage JSON is invalid", () => {
    const controller = createStudentDashboardController({
      supabaseClient: createSupabaseMock(),
      documentRef: createDocumentMock(),
      windowRef: createWindowMock(),
      localStorageRef: createStorageMock({
        seen_ready_orders: "{ invalid json",
      }),
      setTimeoutRef: vi.fn(),
    });

    expect(controller.getSeenReadyOrders()).toEqual([]);
  });

  test("saves seen ready order ids", () => {
    const localStorageRef = createStorageMock();

    const controller = createStudentDashboardController({
      supabaseClient: createSupabaseMock(),
      documentRef: createDocumentMock(),
      windowRef: createWindowMock(),
      localStorageRef,
      setTimeoutRef: vi.fn(),
    });

    controller.saveSeenReadyOrders(["ORDER-1"]);

    expect(localStorageRef.setItem).toHaveBeenCalledWith(
      "seen_ready_orders",
      JSON.stringify(["ORDER-1"])
    );
  });

  test("fetches ready paid order ids", async () => {
    const controller = createStudentDashboardController({
      supabaseClient: createSupabaseMock({
        readyOrders: [
          createPaidReadyOrder("ORDER-1"),
          createPaidReadyOrder("ORDER-2"),
        ],
      }),
      documentRef: createDocumentMock(),
      windowRef: createWindowMock(),
      localStorageRef: createStorageMock(),
      setTimeoutRef: vi.fn(),
    });

    await expect(controller.fetchReadyOrderIds("student-1")).resolves.toEqual([
      "ORDER-1",
      "ORDER-2",
    ]);
  });

  test("fetchReadyOrderIds ignores orders that are not paid and ready", async () => {
    const controller = createStudentDashboardController({
      supabaseClient: createSupabaseMock({
        readyOrders: [
          createPaidReadyOrder("ORDER-1"),
          {
            id: "ORDER-2",
            payment_status: "pending",
            status: "ready",
          },
          {
            id: "ORDER-3",
            payment_status: "paid",
            status: "preparing",
          },
        ],
      }),
      documentRef: createDocumentMock(),
      windowRef: createWindowMock(),
      localStorageRef: createStorageMock(),
      setTimeoutRef: vi.fn(),
    });

    await expect(controller.fetchReadyOrderIds("student-1")).resolves.toEqual([
      "ORDER-1",
    ]);
  });

  test("shows active orders dot when there is a ready order", async () => {
    const documentRef = createDocumentMock();

    const controller = createStudentDashboardController({
      supabaseClient: createSupabaseMock({
        readyOrders: [createPaidReadyOrder("ORDER-1")],
      }),
      documentRef,
      windowRef: createWindowMock(),
      localStorageRef: createStorageMock(),
      setTimeoutRef: vi.fn(),
    });

    await controller.updateActiveOrdersDot("student-1");

    expect(
      documentRef.elements["active-orders-dot"].classList.remove
    ).toHaveBeenCalledWith("hidden");

    expect(documentRef.elements["active-orders-dot"].style.display).toBe(
      "inline-block"
    );
  });

  test("shows active orders dot even if ready order was previously seen because it is still ready", async () => {
    const documentRef = createDocumentMock();

    const controller = createStudentDashboardController({
      supabaseClient: createSupabaseMock({
        readyOrders: [createPaidReadyOrder("ORDER-1")],
      }),
      documentRef,
      windowRef: createWindowMock(),
      localStorageRef: createStorageMock({
        seen_ready_orders: JSON.stringify(["ORDER-1"]),
      }),
      setTimeoutRef: vi.fn(),
    });

    await controller.updateActiveOrdersDot("student-1");

    expect(
      documentRef.elements["active-orders-dot"].classList.remove
    ).toHaveBeenCalledWith("hidden");
  });

  test("hides active orders dot when there are no ready orders", async () => {
    const documentRef = createDocumentMock();

    const controller = createStudentDashboardController({
      supabaseClient: createSupabaseMock({
        readyOrders: [],
      }),
      documentRef,
      windowRef: createWindowMock(),
      localStorageRef: createStorageMock(),
      setTimeoutRef: vi.fn(),
    });

    await controller.updateActiveOrdersDot("student-1");

    expect(
      documentRef.elements["active-orders-dot"].classList.add
    ).toHaveBeenCalledWith("hidden");

    expect(documentRef.elements["active-orders-dot"].style.display).toBe("none");
  });

  test("creates active orders dot if it is missing from the HTML", () => {
    const documentRef = createDocumentMock({
      includeActiveOrdersDot: false,
    });

    const controller = createStudentDashboardController({
      supabaseClient: createSupabaseMock(),
      documentRef,
      windowRef: createWindowMock(),
      localStorageRef: createStorageMock(),
      setTimeoutRef: vi.fn(),
    });

    controller.showActiveOrdersDot();

    expect(documentRef.createElement).toHaveBeenCalledWith("span");
    expect(documentRef.elements["active-orders"].appendChild).toHaveBeenCalled();
    expect(documentRef.elements["active-orders-dot"].style.display).toBe(
      "inline-block"
    );
  });

  test("marks ready orders as seen and hides dot", async () => {
    const documentRef = createDocumentMock();
    const localStorageRef = createStorageMock();

    const controller = createStudentDashboardController({
      supabaseClient: createSupabaseMock({
        readyOrders: [createPaidReadyOrder("ORDER-1")],
      }),
      documentRef,
      windowRef: createWindowMock(),
      localStorageRef,
      setTimeoutRef: vi.fn(),
    });

    await controller.markReadyOrdersAsSeen("student-1");

    expect(localStorageRef.setItem).toHaveBeenCalledWith(
      "seen_ready_orders",
      JSON.stringify(["ORDER-1"])
    );

    expect(
      documentRef.elements["active-orders-dot"].classList.add
    ).toHaveBeenCalledWith("hidden");
  });
});

describe("ready order acknowledgement flow", () => {
  test("fetchReadyOrdersForAcknowledgement enriches ready orders with vendor and item names", async () => {
    const controller = createStudentDashboardController({
      supabaseClient: createSupabaseMock({
        acknowledgementOrders: [createPaidReadyOrder("ORDER-1")],
        vendorName: {
          business_name: "Campus Burgers",
        },
        orderItems: [
          {
            menu_item_id: "menu-1",
            quantity: 2,
          },
        ],
        menuItem: {
          name: "Burger",
        },
      }),
      documentRef: createDocumentMock(),
      windowRef: createWindowMock(),
      localStorageRef: createStorageMock(),
      setTimeoutRef: vi.fn(),
    });

    const orders = await controller.fetchReadyOrdersForAcknowledgement(
      "student-1"
    );

    expect(orders).toHaveLength(1);
    expect(orders[0].vendorName).toBe("Campus Burgers");
    expect(orders[0].items).toEqual(["2 × Burger"]);
  });

  test("fetchReadyOrdersForAcknowledgement returns empty array and logs when query fails", async () => {
    const consoleRef = {
      error: vi.fn(),
    };

    const controller = createStudentDashboardController({
      supabaseClient: createSupabaseMock({
        acknowledgementOrdersError: {
          message: "Ready orders failed",
        },
      }),
      documentRef: createDocumentMock(),
      windowRef: createWindowMock(),
      localStorageRef: createStorageMock(),
      setTimeoutRef: vi.fn(),
      consoleRef,
    });

    const orders = await controller.fetchReadyOrdersForAcknowledgement(
      "student-1"
    );

    expect(orders).toEqual([]);
    expect(consoleRef.error).toHaveBeenCalledWith(
      "Ready order acknowledgement fetch error:",
      {
        message: "Ready orders failed",
      }
    );
  });

  test("fetchVendorName returns fallback when vendor lookup fails", async () => {
    const consoleRef = {
      error: vi.fn(),
    };

    const controller = createStudentDashboardController({
      supabaseClient: createSupabaseMock({
        vendorName: null,
        vendorNameError: {
          message: "Vendor failed",
        },
      }),
      documentRef: createDocumentMock(),
      windowRef: createWindowMock(),
      localStorageRef: createStorageMock(),
      setTimeoutRef: vi.fn(),
      consoleRef,
    });

    const vendorName = await controller.fetchVendorName("vendor-1");

    expect(vendorName).toBe("Unknown vendor");
    expect(consoleRef.error).toHaveBeenCalledWith("Fetch vendor name error:", {
      message: "Vendor failed",
    });
  });

  test("fetchOrderItemNames returns empty list when order items fail", async () => {
    const controller = createStudentDashboardController({
      supabaseClient: createSupabaseMock({
        orderItemsError: {
          message: "Items failed",
        },
      }),
      documentRef: createDocumentMock(),
      windowRef: createWindowMock(),
      localStorageRef: createStorageMock(),
      setTimeoutRef: vi.fn(),
    });

    const items = await controller.fetchOrderItemNames("ORDER-1");

    expect(items).toEqual([]);
  });

  test("buildReadyOrdersMessage includes order details and professional email spam reminder", () => {
    const controller = createStudentDashboardController({
      supabaseClient: createSupabaseMock(),
      documentRef: createDocumentMock(),
      windowRef: createWindowMock(),
      localStorageRef: createStorageMock(),
      setTimeoutRef: vi.fn(),
    });

    const message = controller.buildReadyOrdersMessage([
      {
        id: "ORDER-12345678",
        vendorName: "Campus Burgers",
        items: ["2 × Burger", "1 × Chips"],
      },
    ]);

    expect(message).toContain("Your order is ready for pickup.");
    expect(message).toContain("Order #ORDER-12 from Campus Burgers");
    expect(message).toContain("2 × Burger, 1 × Chips");
    expect(message).toContain("registered email address");
    expect(message).toContain("spam or junk folder");
    expect(message).toContain("The order will then move to Order History.");
  });

  test("completeReadyOrders updates ready paid orders to complete", async () => {
    const supabaseClient = createSupabaseMock({
      updateResult: {
        id: "ORDER-1",
        status: "complete",
      },
    });

    const controller = createStudentDashboardController({
      supabaseClient,
      documentRef: createDocumentMock(),
      windowRef: createWindowMock(),
      localStorageRef: createStorageMock(),
      setTimeoutRef: vi.fn(),
    });

    const result = await controller.completeReadyOrders("student-1", ["ORDER-1"]);

    expect(result).toBe(true);

    expect(supabaseClient.__state.updatedRows[0]).toMatchObject({
      tableName: "orders",
      data: {
        status: "complete",
      },
    });
  });

  test("completeReadyOrders returns false when no order ids are provided", async () => {
    const supabaseClient = createSupabaseMock();

    const controller = createStudentDashboardController({
      supabaseClient,
      documentRef: createDocumentMock(),
      windowRef: createWindowMock(),
      localStorageRef: createStorageMock(),
      setTimeoutRef: vi.fn(),
    });

    const result = await controller.completeReadyOrders("student-1", []);

    expect(result).toBe(false);
    expect(supabaseClient.__state.updatedRows).toHaveLength(0);
  });

  test("completeReadyOrders returns false and logs when update fails", async () => {
    const consoleRef = {
      error: vi.fn(),
    };

    const controller = createStudentDashboardController({
      supabaseClient: createSupabaseMock({
        updateError: {
          message: "Update failed",
        },
      }),
      documentRef: createDocumentMock(),
      windowRef: createWindowMock(),
      localStorageRef: createStorageMock(),
      setTimeoutRef: vi.fn(),
      consoleRef,
    });

    const result = await controller.completeReadyOrders("student-1", ["ORDER-1"]);

    expect(result).toBe(false);
    expect(consoleRef.error).toHaveBeenCalledWith(
      "Complete ready order error:",
      {
        message: "Update failed",
      }
    );
  });

  test("acknowledgeReadyOrders redirects to active orders when there are no ready orders", async () => {
    const documentRef = createDocumentMock();
    const windowRef = createWindowMock();

    const controller = createStudentDashboardController({
      supabaseClient: createSupabaseMock({
        acknowledgementOrders: [],
      }),
      documentRef,
      windowRef,
      localStorageRef: createStorageMock(),
      setTimeoutRef: vi.fn(),
    });

    await controller.acknowledgeReadyOrders("student-1");

    expect(
      documentRef.elements["active-orders-dot"].classList.add
    ).toHaveBeenCalledWith("hidden");

    expect(windowRef.location.href).toBe("my-orders.html?filter=active");
  });

  test("acknowledgeReadyOrders shows message, completes order, saves seen order, and redirects to history", async () => {
    const documentRef = createDocumentMock();
    const windowRef = createWindowMock({
      confirmResult: true,
    });
    const localStorageRef = createStorageMock();

    const controller = createStudentDashboardController({
      supabaseClient: createSupabaseMock({
        acknowledgementOrders: [createPaidReadyOrder("ORDER-1")],
        vendorName: {
          business_name: "Campus Burgers",
        },
        orderItems: [
          {
            menu_item_id: "menu-1",
            quantity: 2,
          },
        ],
        menuItem: {
          name: "Burger",
        },
        updateResult: {
          id: "ORDER-1",
          status: "complete",
        },
      }),
      documentRef,
      windowRef,
      localStorageRef,
      setTimeoutRef: vi.fn(),
    });

    await controller.acknowledgeReadyOrders("student-1");

    expect(windowRef.confirm).toHaveBeenCalledWith(
      expect.stringContaining("Your order is ready for pickup.")
    );

    expect(windowRef.confirm).toHaveBeenCalledWith(
      expect.stringContaining("spam or junk folder")
    );

    expect(localStorageRef.setItem).toHaveBeenCalledWith(
      "seen_ready_orders",
      JSON.stringify(["ORDER-1"])
    );

    expect(
      documentRef.elements["active-orders-dot"].classList.add
    ).toHaveBeenCalledWith("hidden");

    expect(windowRef.location.href).toBe("my-orders.html?filter=history");
  });

  test("acknowledgeReadyOrders does not complete order when student cancels the confirmation", async () => {
    const documentRef = createDocumentMock();
    const windowRef = createWindowMock({
      confirmResult: false,
    });
    const supabaseClient = createSupabaseMock({
      acknowledgementOrders: [createPaidReadyOrder("ORDER-1")],
    });

    const controller = createStudentDashboardController({
      supabaseClient,
      documentRef,
      windowRef,
      localStorageRef: createStorageMock(),
      setTimeoutRef: vi.fn(),
    });

    await controller.acknowledgeReadyOrders("student-1");

    expect(windowRef.confirm).toHaveBeenCalled();
    expect(supabaseClient.__state.updatedRows).toHaveLength(0);

    expect(
      documentRef.elements["active-orders-dot"].classList.remove
    ).toHaveBeenCalledWith("hidden");

    expect(windowRef.location.href).toBe("");
  });

  test("acknowledgeReadyOrders shows alert when ready order cannot be moved to history", async () => {
    const documentRef = createDocumentMock();
    const windowRef = createWindowMock({
      confirmResult: true,
    });

    const controller = createStudentDashboardController({
      supabaseClient: createSupabaseMock({
        acknowledgementOrders: [createPaidReadyOrder("ORDER-1")],
        updateResult: null,
      }),
      documentRef,
      windowRef,
      localStorageRef: createStorageMock(),
      setTimeoutRef: vi.fn(),
    });

    await controller.acknowledgeReadyOrders("student-1");

    expect(alert).toHaveBeenCalledWith(
      "The ready order could not be moved to Order History. Please try again."
    );

    expect(windowRef.location.href).toBe("");
  });
});

describe("student dashboard vendor loading", () => {
  test("loads approved vendors into dashboard", async () => {
    const documentRef = createDocumentMock();

    const controller = createStudentDashboardController({
      supabaseClient: createSupabaseMock({
        vendors: [
          {
            id: "vendor-1",
            business_name: "Campus Burgers",
          },
        ],
      }),
      documentRef,
      windowRef: createWindowMock(),
      localStorageRef: createStorageMock(),
      setTimeoutRef: vi.fn(),
    });

    await controller.loadVendors();

    expect(documentRef.elements["vendors-list"].appendChild).toHaveBeenCalled();
    expect(documentRef.elements["vendors-list"].children).toHaveLength(1);
  });

  test("shows empty message when no vendors are available", async () => {
    const documentRef = createDocumentMock();

    const controller = createStudentDashboardController({
      supabaseClient: createSupabaseMock({
        vendors: [],
      }),
      documentRef,
      windowRef: createWindowMock(),
      localStorageRef: createStorageMock(),
      setTimeoutRef: vi.fn(),
    });

    await controller.loadVendors();

    expect(documentRef.elements["vendors-list"].innerHTML).toContain(
      "No vendors available"
    );
  });

  test("shows error message when vendors fail to load", async () => {
    const documentRef = createDocumentMock();

    const controller = createStudentDashboardController({
      supabaseClient: createSupabaseMock({
        vendorsError: {
          message: "Database error",
        },
      }),
      documentRef,
      windowRef: createWindowMock(),
      localStorageRef: createStorageMock(),
      setTimeoutRef: vi.fn(),
    });

    await controller.loadVendors();

    expect(documentRef.elements["vendors-list"].innerHTML).toContain(
      "Error loading vendors"
    );
  });

  test("loadVendors does nothing when vendors-list element is missing", async () => {
    const documentRef = createDocumentMock();
    documentRef.elements["vendors-list"] = null;

    const controller = createStudentDashboardController({
      supabaseClient: createSupabaseMock(),
      documentRef,
      windowRef: createWindowMock(),
      localStorageRef: createStorageMock(),
      setTimeoutRef: vi.fn(),
    });

    await expect(controller.loadVendors()).resolves.toBeUndefined();
  });

  test("vendor card button redirects to selected vendor menu", async () => {
    const documentRef = createDocumentMock();
    const windowRef = createWindowMock();

    const controller = createStudentDashboardController({
      supabaseClient: createSupabaseMock({
        vendors: [
          {
            id: "vendor-123",
            business_name: "Campus Burgers",
          },
        ],
      }),
      documentRef,
      windowRef,
      localStorageRef: createStorageMock(),
      setTimeoutRef: vi.fn(),
    });

    await controller.loadVendors();

    const vendorCard = documentRef.elements["vendors-list"].children[0];

    vendorCard.button.onclick();

    expect(windowRef.location.href).toBe(
      "student-menu.html?vendorId=vendor-123"
    );
  });
});

describe("student dashboard button events", () => {
  test("sets up dashboard button events", () => {
    const documentRef = createDocumentMock();

    const controller = createStudentDashboardController({
      supabaseClient: createSupabaseMock(),
      documentRef,
      windowRef: createWindowMock(),
      localStorageRef: createStorageMock(),
      setTimeoutRef: vi.fn(),
    });

    controller.setupEvents({
      id: "student-1",
      email: "student@test.com",
    });

    expect(documentRef.elements["active-orders"].addEventListener).toHaveBeenCalled();
    expect(documentRef.elements["order-history"].addEventListener).toHaveBeenCalled();
    expect(documentRef.elements["view-cart"].addEventListener).toHaveBeenCalled();
    expect(documentRef.elements.logout.addEventListener).toHaveBeenCalled();
  });

  test("active orders button acknowledges ready orders and redirects to history after OK", async () => {
    const documentRef = createDocumentMock();
    const windowRef = createWindowMock({
      confirmResult: true,
    });
    const localStorageRef = createStorageMock();

    const controller = createStudentDashboardController({
      supabaseClient: createSupabaseMock({
        acknowledgementOrders: [createPaidReadyOrder("ORDER-1")],
        updateResult: {
          id: "ORDER-1",
          status: "complete",
        },
      }),
      documentRef,
      windowRef,
      localStorageRef,
      setTimeoutRef: vi.fn(),
    });

    controller.setupEvents({
      id: "student-1",
      email: "student@test.com",
    });

    await documentRef.elements["active-orders"].onclick();

    expect(windowRef.confirm).toHaveBeenCalledWith(
      expect.stringContaining("registered email address")
    );

    expect(localStorageRef.setItem).toHaveBeenCalledWith(
      "seen_ready_orders",
      JSON.stringify(["ORDER-1"])
    );

    expect(windowRef.location.href).toBe("my-orders.html?filter=history");
  });

  test("active orders button redirects to active orders page when there are no ready orders", async () => {
    const documentRef = createDocumentMock();
    const windowRef = createWindowMock();

    const controller = createStudentDashboardController({
      supabaseClient: createSupabaseMock({
        acknowledgementOrders: [],
      }),
      documentRef,
      windowRef,
      localStorageRef: createStorageMock(),
      setTimeoutRef: vi.fn(),
    });

    controller.setupEvents({
      id: "student-1",
      email: "student@test.com",
    });

    await documentRef.elements["active-orders"].onclick();

    expect(windowRef.location.href).toBe("my-orders.html?filter=active");
  });

  test("order history button redirects to history orders page", () => {
    const documentRef = createDocumentMock();
    const windowRef = createWindowMock();

    const controller = createStudentDashboardController({
      supabaseClient: createSupabaseMock(),
      documentRef,
      windowRef,
      localStorageRef: createStorageMock(),
      setTimeoutRef: vi.fn(),
    });

    controller.setupEvents({
      id: "student-1",
      email: "student@test.com",
    });

    documentRef.elements["order-history"].onclick();

    expect(windowRef.location.href).toBe("my-orders.html?filter=history");
  });

  test("view cart button redirects to student cart page", () => {
    const documentRef = createDocumentMock();
    const windowRef = createWindowMock();

    const controller = createStudentDashboardController({
      supabaseClient: createSupabaseMock(),
      documentRef,
      windowRef,
      localStorageRef: createStorageMock(),
      setTimeoutRef: vi.fn(),
    });

    controller.setupEvents({
      id: "student-1",
      email: "student@test.com",
    });

    documentRef.elements["view-cart"].onclick();

    expect(windowRef.location.href).toBe("student-cart.html");
  });

  test("logout button signs out and redirects to login", async () => {
    const documentRef = createDocumentMock();
    const windowRef = createWindowMock();
    const supabaseClient = createSupabaseMock();

    const controller = createStudentDashboardController({
      supabaseClient,
      documentRef,
      windowRef,
      localStorageRef: createStorageMock(),
      setTimeoutRef: vi.fn(),
    });

    controller.setupEvents({
      id: "student-1",
      email: "student@test.com",
    });

    await documentRef.elements.logout.onclick();

    expect(supabaseClient.auth.signOut).toHaveBeenCalled();
    expect(windowRef.location.href).toBe("../auth/login.html");
  });
});

describe("student dashboard toast and realtime updates", () => {
  test("showToast displays message and hides it after timeout", () => {
    const documentRef = createDocumentMock();
    const setTimeoutRef = vi.fn((callback) => callback());

    const controller = createStudentDashboardController({
      supabaseClient: createSupabaseMock(),
      documentRef,
      windowRef: createWindowMock(),
      localStorageRef: createStorageMock(),
      setTimeoutRef,
    });

    controller.showToast("Payment confirmed.");

    expect(documentRef.elements.toast.textContent).toBe("Payment confirmed.");
    expect(documentRef.elements.toast.classList.remove).toHaveBeenCalledWith(
      "hidden"
    );
    expect(documentRef.elements.toast.classList.add).toHaveBeenCalledWith(
      "show"
    );

    expect(documentRef.elements.toast.classList.remove).toHaveBeenCalledWith(
      "show"
    );
    expect(documentRef.elements.toast.classList.add).toHaveBeenCalledWith(
      "hidden"
    );
  });

  test("showToast does nothing when toast element is missing", () => {
    const documentRef = createDocumentMock();
    documentRef.elements.toast = null;

    const controller = createStudentDashboardController({
      supabaseClient: createSupabaseMock(),
      documentRef,
      windowRef: createWindowMock(),
      localStorageRef: createStorageMock(),
      setTimeoutRef: vi.fn(),
    });

    expect(() => {
      controller.showToast("No toast element.");
    }).not.toThrow();
  });

  test("subscribeToOrders ignores unrelated student orders", async () => {
    const supabaseClient = createSupabaseMock();
    const documentRef = createDocumentMock();

    const controller = createStudentDashboardController({
      supabaseClient,
      documentRef,
      windowRef: createWindowMock(),
      localStorageRef: createStorageMock(),
      setTimeoutRef: vi.fn(),
    });

    controller.subscribeToOrders("student-1");

    await supabaseClient.realtimeCallback({
      new: {
        id: "ORDER-2",
        student_id: "student-2",
        payment_status: "paid",
        status: "ready",
      },
      old: {
        status: "preparing",
      },
    });

    expect(documentRef.elements.toast.textContent).toBe("");
  });

  test("subscribeToOrders shows payment confirmed toast", async () => {
    const supabaseClient = createSupabaseMock();
    const documentRef = createDocumentMock();

    const controller = createStudentDashboardController({
      supabaseClient,
      documentRef,
      windowRef: createWindowMock(),
      localStorageRef: createStorageMock(),
      setTimeoutRef: vi.fn(),
    });

    controller.subscribeToOrders("student-1");

    await supabaseClient.realtimeCallback({
      new: {
        id: "ORDER-1",
        student_id: "student-1",
        payment_status: "paid",
        status: "received",
      },
      old: {
        payment_status: "pending",
        status: "payment_pending",
      },
    });

    expect(documentRef.elements.toast.textContent).toBe(
      "Payment confirmed. Your order has been received."
    );
  });

  test("subscribeToOrders shows ready for pickup toast and notification dot", async () => {
    const supabaseClient = createSupabaseMock({
      readyOrders: [createPaidReadyOrder("ORDER-1")],
    });
    const documentRef = createDocumentMock();

    const controller = createStudentDashboardController({
      supabaseClient,
      documentRef,
      windowRef: createWindowMock(),
      localStorageRef: createStorageMock(),
      setTimeoutRef: vi.fn(),
    });

    controller.subscribeToOrders("student-1");

    await supabaseClient.realtimeCallback({
      new: {
        id: "ORDER-1",
        student_id: "student-1",
        payment_status: "paid",
        status: "ready",
      },
      old: {
        payment_status: "paid",
        status: "preparing",
      },
    });

    expect(documentRef.elements.toast.textContent).toBe(
      "Your order is ready for pickup."
    );

    expect(
      documentRef.elements["active-orders-dot"].classList.remove
    ).toHaveBeenCalledWith("hidden");
  });

  test("subscribeToOrders shows complete order toast", async () => {
    const supabaseClient = createSupabaseMock();
    const documentRef = createDocumentMock();

    const controller = createStudentDashboardController({
      supabaseClient,
      documentRef,
      windowRef: createWindowMock(),
      localStorageRef: createStorageMock(),
      setTimeoutRef: vi.fn(),
    });

    controller.subscribeToOrders("student-1");

    await supabaseClient.realtimeCallback({
      new: {
        id: "ORDER-1",
        student_id: "student-1",
        payment_status: "paid",
        status: "complete",
      },
      old: {
        payment_status: "paid",
        status: "ready",
      },
    });

    expect(documentRef.elements.toast.textContent).toBe(
      "Your order has moved to Order History."
    );
  });
});

describe("student dashboard page loading", () => {
  test("handlePageLoad stops when authentication fails", async () => {
    const documentRef = createDocumentMock();
    const windowRef = createWindowMock();

    const controller = createStudentDashboardController({
      supabaseClient: createSupabaseMock({
        user: null,
      }),
      documentRef,
      windowRef,
      localStorageRef: createStorageMock(),
      setTimeoutRef: vi.fn(),
    });

    await controller.handlePageLoad();

    expect(windowRef.location.href).toBe("../auth/login.html");
    expect(documentRef.elements["vendors-list"].children).toHaveLength(0);
  });

  test("handlePageLoad loads user info, vendors, ready dot, realtime, and events", async () => {
    const documentRef = createDocumentMock();
    const supabaseClient = createSupabaseMock({
      readyOrders: [createPaidReadyOrder("ORDER-1")],
      vendors: [
        {
          id: "vendor-1",
          business_name: "Campus Burgers",
        },
      ],
    });

    const controller = createStudentDashboardController({
      supabaseClient,
      documentRef,
      windowRef: createWindowMock(),
      localStorageRef: createStorageMock(),
      setTimeoutRef: vi.fn(),
    });

    await controller.handlePageLoad();

    expect(documentRef.elements["user-info"].textContent).toBe(
      "Logged in as: student@test.com"
    );

    expect(documentRef.elements["vendors-list"].children).toHaveLength(1);

    expect(
      documentRef.elements["active-orders-dot"].classList.remove
    ).toHaveBeenCalledWith("hidden");

    expect(supabaseClient.channel).toHaveBeenCalledWith(
      "student-dashboard-orders"
    );

    expect(documentRef.elements["active-orders"].addEventListener).toHaveBeenCalled();
  });

  test("handlePageLoad only runs once", async () => {
    const documentRef = createDocumentMock();
    const supabaseClient = createSupabaseMock();

    const controller = createStudentDashboardController({
      supabaseClient,
      documentRef,
      windowRef: createWindowMock(),
      localStorageRef: createStorageMock(),
      setTimeoutRef: vi.fn(),
    });

    await controller.handlePageLoad();
    await controller.handlePageLoad();

    expect(supabaseClient.auth.getUser).toHaveBeenCalledTimes(1);
  });

  test("handlePageLoad shows dashboard error when loading fails", async () => {
    const documentRef = createDocumentMock();
    const consoleRef = {
      error: vi.fn(),
    };

    const brokenSupabase = {
      auth: {
        getUser: vi.fn(async () => {
          throw new Error("Auth crashed");
        }),
      },
    };

    const controller = createStudentDashboardController({
      supabaseClient: brokenSupabase,
      documentRef,
      windowRef: createWindowMock(),
      localStorageRef: createStorageMock(),
      setTimeoutRef: vi.fn(),
      consoleRef,
    });

    await controller.handlePageLoad();

    expect(consoleRef.error).toHaveBeenCalledWith(
      "Student dashboard load error:",
      expect.any(Error)
    );

    expect(documentRef.elements["vendors-list"].innerHTML).toContain(
      "Could not load dashboard"
    );
  });

  test("setupStudentDashboardPage registers load and DOMContentLoaded events", () => {
    const windowRef = createWindowMock();
    const documentRef = createDocumentMock();

    const controller = createStudentDashboardController({
      supabaseClient: createSupabaseMock(),
      documentRef,
      windowRef,
      localStorageRef: createStorageMock(),
      setTimeoutRef: vi.fn(),
    });

    controller.setupStudentDashboardPage();

    expect(windowRef.addEventListener).toHaveBeenCalledWith(
      "load",
      controller.handlePageLoad
    );

    expect(documentRef.addEventListener).toHaveBeenCalledWith(
      "DOMContentLoaded",
      controller.handlePageLoad
    );
  });
});