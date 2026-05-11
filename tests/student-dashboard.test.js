import { describe, test, expect, vi, beforeEach } from "vitest";

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

function createDocumentMock() {
  const elements = {
    "user-info": createElementMock("user-info"),
    "vendors-list": createElementMock("vendors-list"),
    toast: createElementMock("toast"),
    "active-orders": createElementMock("active-orders"),
    "order-history": createElementMock("order-history"),
    "view-cart": createElementMock("view-cart"),
    logout: createElementMock("logout"),
    "active-orders-dot": createElementMock("active-orders-dot"),
  };

  return {
    elements,

    getElementById: vi.fn((id) => {
      return elements[id] || null;
    }),

    createElement: vi.fn((tagName) => {
      const element = createElementMock(tagName);
      element.tagName = tagName.toUpperCase();
      return element;
    }),
  };
}

function createWindowMock() {
  return {
    location: {
      href: "",
    },

    addEventListener: vi.fn(function (event, handler) {
      this[`on${event}`] = handler;
    }),
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
  vendors = [
    {
      id: "vendor-1",
      business_name: "Campus Burgers",
    },
  ],
  vendorsError = null,
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

      signOut: vi.fn().mockResolvedValue({}),
    },

    from: vi.fn((tableName) => {
      const query = {
        select: vi.fn(() => query),
        eq: vi.fn(() => query),

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

        order: vi.fn(async () => {
          if (tableName === "vendors") {
            return {
              data: vendors,
              error: vendorsError,
            };
          }

          return {
            data: [],
            error: null,
          };
        }),

        then(resolve) {
          if (tableName === "orders") {
            return Promise.resolve({
              data: readyOrders,
              error: readyOrdersError,
            }).then(resolve);
          }

          return Promise.resolve({
            data: null,
            error: null,
          }).then(resolve);
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

describe("actual student dashboard logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
          {
            id: "ORDER-1",
          },
          {
            id: "ORDER-2",
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
      "ORDER-2",
    ]);
  });

  test("shows active orders dot when there is an unseen ready order", async () => {
    const documentRef = createDocumentMock();

    const controller = createStudentDashboardController({
      supabaseClient: createSupabaseMock({
        readyOrders: [
          {
            id: "ORDER-1",
          },
        ],
      }),
      documentRef,
      windowRef: createWindowMock(),
      localStorageRef: createStorageMock({
        seen_ready_orders: JSON.stringify([]),
      }),
      setTimeoutRef: vi.fn(),
    });

    await controller.updateActiveOrdersDot("student-1");

    expect(
      documentRef.elements["active-orders-dot"].classList.remove
    ).toHaveBeenCalledWith("hidden");
  });

  test("hides active orders dot when all ready orders were seen", async () => {
    const documentRef = createDocumentMock();

    const controller = createStudentDashboardController({
      supabaseClient: createSupabaseMock({
        readyOrders: [
          {
            id: "ORDER-1",
          },
        ],
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
      documentRef.elements["active-orders-dot"].classList.add
    ).toHaveBeenCalledWith("hidden");
  });

  test("marks ready orders as seen and hides dot", async () => {
    const documentRef = createDocumentMock();
    const localStorageRef = createStorageMock();

    const controller = createStudentDashboardController({
      supabaseClient: createSupabaseMock({
        readyOrders: [
          {
            id: "ORDER-1",
          },
        ],
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
});
describe("additional student dashboard coverage", () => {
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

  test("showActiveOrdersDot removes hidden class", () => {
    const documentRef = createDocumentMock();

    const controller = createStudentDashboardController({
      supabaseClient: createSupabaseMock(),
      documentRef,
      windowRef: createWindowMock(),
      localStorageRef: createStorageMock(),
      setTimeoutRef: vi.fn(),
    });

    controller.showActiveOrdersDot();

    expect(
      documentRef.elements["active-orders-dot"].classList.remove
    ).toHaveBeenCalledWith("hidden");
  });

  test("hideActiveOrdersDot adds hidden class", () => {
    const documentRef = createDocumentMock();

    const controller = createStudentDashboardController({
      supabaseClient: createSupabaseMock(),
      documentRef,
      windowRef: createWindowMock(),
      localStorageRef: createStorageMock(),
      setTimeoutRef: vi.fn(),
    });

    controller.hideActiveOrdersDot();

    expect(
      documentRef.elements["active-orders-dot"].classList.add
    ).toHaveBeenCalledWith("hidden");
  });

  test("updateActiveOrdersDot hides dot when there are no ready orders", async () => {
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
  });

  test("fetchReadyOrderIds returns empty list and logs error when query fails", async () => {
    const consoleRef = {
      error: vi.fn(),
    };

    const controller = createStudentDashboardController({
      supabaseClient: createSupabaseMock({
        readyOrdersError: {
          message: "Database error",
        },
      }),
      documentRef: createDocumentMock(),
      windowRef: createWindowMock(),
      localStorageRef: createStorageMock(),
      setTimeoutRef: vi.fn(),
      consoleRef,
    });

    const result = await controller.fetchReadyOrderIds("student-1");

    expect(result).toEqual([]);
    expect(consoleRef.error).toHaveBeenCalledWith("Ready orders check error:", {
      message: "Database error",
    });
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

  test("active orders button marks ready orders as seen and redirects to active orders page", async () => {
    const documentRef = createDocumentMock();
    const windowRef = createWindowMock();
    const localStorageRef = createStorageMock();

    const controller = createStudentDashboardController({
      supabaseClient: createSupabaseMock({
        readyOrders: [
          {
            id: "ORDER-1",
          },
        ],
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

    expect(localStorageRef.setItem).toHaveBeenCalledWith(
      "seen_ready_orders",
      JSON.stringify(["ORDER-1"])
    );

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

  test("subscribeToOrders shows ready for pickup toast", async () => {
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
      readyOrders: [
        {
          id: "ORDER-1",
        },
      ],
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

  test("setupStudentDashboardPage registers load event", () => {
    const windowRef = createWindowMock();

    const controller = createStudentDashboardController({
      supabaseClient: createSupabaseMock(),
      documentRef: createDocumentMock(),
      windowRef,
      localStorageRef: createStorageMock(),
      setTimeoutRef: vi.fn(),
    });

    controller.setupStudentDashboardPage();

    expect(windowRef.addEventListener).toHaveBeenCalledWith(
      "load",
      controller.handlePageLoad
    );
  });
});