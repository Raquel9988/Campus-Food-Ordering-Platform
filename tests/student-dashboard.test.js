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