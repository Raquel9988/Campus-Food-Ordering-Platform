import { describe, test, expect, vi, beforeEach } from "vitest";

import {
  escapeHtml,
  getVendorIds,
  isSuccessfulPaidOrder,
  clearPendingPaymentStorage,
  createCartController,
} from "../student/student-cart.js";

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
  return {
    id,
    innerHTML: "",
    textContent: "",
    disabled: false,
    className: "",
    required: false,
    value: "",
    method: "",
    action: "",
    type: "",
    name: "",
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
    },
    style: {},
    children: [],
    appendChild: vi.fn(function (child) {
      this.children.push(child);
    }),
    querySelector: vi.fn(() => {
      return {
        onclick: null,
      };
    }),
    addEventListener: vi.fn(),
    submit: vi.fn(),
  };
}

function createDocumentMock() {
  const elements = {
    toast: createElementMock("toast"),
    "cart-message": createElementMock("cart-message"),
    "place-order": createElementMock("place-order"),
    "clear-cart": createElementMock("clear-cart"),
    "cart-items": createElementMock("cart-items"),
    total: createElementMock("total"),
  };

  const body = createElementMock("body");

  return {
    elements,
    body,

    getElementById: vi.fn((id) => {
      return elements[id] || null;
    }),

    querySelector: vi.fn(() => {
      return createElementMock("back-btn");
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
    addEventListener: vi.fn(),
  };
}

function createSupabaseMock({
  user = {
    id: "student-1",
  },
  userError = null,
  appUser = {
    role: "student",
  },
  vendorName = "Campus Burgers",
  paymentCleanupOrder = null,
  paymentCleanupError = null,
  createdOrder = {
    id: "ORDER-123",
  },
  orderError = null,
  orderItemsError = null,
} = {}) {
  const insertedRows = [];
  const updatedRows = [];

  const supabaseClient = {
    insertedRows,
    updatedRows,

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
        insert: vi.fn((rows) => {
          insertedRows.push({
            tableName,
            rows,
          });

          if (tableName === "orders") {
            return {
              select: vi.fn(() => {
                return {
                  single: vi.fn(async () => {
                    return {
                      data: createdOrder,
                      error: orderError,
                    };
                  }),
                };
              }),
            };
          }

          return Promise.resolve({
            error: tableName === "order_items" ? orderItemsError : null,
          });
        }),

        update: vi.fn((data) => {
          updatedRows.push({
            tableName,
            data,
          });

          return {
            eq: vi.fn(async () => {
              return {
                data: null,
                error: null,
              };
            }),
          };
        }),

        single: vi.fn(async () => {
          if (tableName === "users") {
            return {
              data: appUser,
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

        maybeSingle: vi.fn(async () => {
          if (tableName === "orders") {
            return {
              data: paymentCleanupOrder,
              error: paymentCleanupError,
            };
          }

          return {
            data: null,
            error: null,
          };
        }),
      };

      return query;
    }),
  };

  return supabaseClient;
}

describe("actual student cart logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("escapes unsafe HTML text", () => {
    expect(escapeHtml(`<script>alert("x")</script>`)).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;"
    );
  });

  test("returns only vendors that have cart items", () => {
    const cart = {
      vendor1: {
        items: [
          {
            menuItemId: "item-1",
          },
        ],
      },
      vendor2: {
        items: [],
      },
      vendor3: {
        items: [
          {
            menuItemId: "item-2",
          },
        ],
      },
    };

    expect(getVendorIds(cart)).toEqual(["vendor1", "vendor3"]);
  });

  test("recognises paid successful orders", () => {
    expect(
      isSuccessfulPaidOrder({
        payment_status: "paid",
        status: "received",
      })
    ).toBe(true);

    expect(
      isSuccessfulPaidOrder({
        payment_status: "paid",
        status: "ready",
      })
    ).toBe(true);

    expect(
      isSuccessfulPaidOrder({
        payment_status: "failed",
        status: "payment_failed",
      })
    ).toBe(false);

    expect(isSuccessfulPaidOrder(null)).toBe(false);
  });

  test("clears pending payment storage keys", () => {
    const sessionStorageRef = createStorageMock({
      campus_pending_order_id: "ORDER-123",
      campus_pending_cart_key: "campus_cart_student-1",
    });

    clearPendingPaymentStorage(sessionStorageRef);

    expect(sessionStorageRef.removeItem).toHaveBeenCalledWith(
      "campus_pending_order_id"
    );
    expect(sessionStorageRef.removeItem).toHaveBeenCalledWith(
      "campus_pending_cart_key"
    );
  });

  test("uses student-specific cart key when user is logged in", async () => {
    const controller = createCartController({
      supabaseClient: createSupabaseMock({
        user: {
          id: "student-1",
        },
      }),
      localStorageRef: createStorageMock(),
      sessionStorageRef: createStorageMock(),
      documentRef: createDocumentMock(),
      windowRef: createWindowMock(),
      fetchRef: vi.fn(),
      setTimeoutRef: vi.fn(),
    });

    await expect(controller.getCartKey()).resolves.toBe(
      "campus_cart_student-1"
    );
  });

  test("uses guest cart key when no user is logged in", async () => {
    const controller = createCartController({
      supabaseClient: createSupabaseMock({
        user: null,
      }),
      localStorageRef: createStorageMock(),
      sessionStorageRef: createStorageMock(),
      documentRef: createDocumentMock(),
      windowRef: createWindowMock(),
      fetchRef: vi.fn(),
      setTimeoutRef: vi.fn(),
    });

    await expect(controller.getCartKey()).resolves.toBe("campus_cart_guest");
  });

  test("gets cart from localStorage", async () => {
    const localStorageRef = createStorageMock({
      "campus_cart_student-1": JSON.stringify({
        vendor1: {
          items: [
            {
              menuItemId: "item-1",
              quantity: 2,
            },
          ],
        },
      }),
    });

    const controller = createCartController({
      supabaseClient: createSupabaseMock(),
      localStorageRef,
      sessionStorageRef: createStorageMock(),
      documentRef: createDocumentMock(),
      windowRef: createWindowMock(),
      fetchRef: vi.fn(),
      setTimeoutRef: vi.fn(),
    });

    await expect(controller.getCart()).resolves.toEqual({
      vendor1: {
        items: [
          {
            menuItemId: "item-1",
            quantity: 2,
          },
        ],
      },
    });
  });

  test("returns empty cart when localStorage JSON is invalid", async () => {
    const localStorageRef = createStorageMock({
      "campus_cart_student-1": "{ invalid json",
    });

    const controller = createCartController({
      supabaseClient: createSupabaseMock(),
      localStorageRef,
      sessionStorageRef: createStorageMock(),
      documentRef: createDocumentMock(),
      windowRef: createWindowMock(),
      fetchRef: vi.fn(),
      setTimeoutRef: vi.fn(),
    });

    await expect(controller.getCart()).resolves.toEqual({});
  });

  test("saves cart to localStorage", async () => {
    const localStorageRef = createStorageMock();

    const controller = createCartController({
      supabaseClient: createSupabaseMock(),
      localStorageRef,
      sessionStorageRef: createStorageMock(),
      documentRef: createDocumentMock(),
      windowRef: createWindowMock(),
      fetchRef: vi.fn(),
      setTimeoutRef: vi.fn(),
    });

    const cart = {
      vendor1: {
        items: [
          {
            menuItemId: "item-1",
            quantity: 1,
          },
        ],
      },
    };

    await controller.saveCart(cart);

    expect(localStorageRef.setItem).toHaveBeenCalledWith(
      "campus_cart_student-1",
      JSON.stringify(cart)
    );
  });

  test("removes item from cart", async () => {
    const localStorageRef = createStorageMock({
      "campus_cart_student-1": JSON.stringify({
        vendor1: {
          items: [
            {
              menuItemId: "item-1",
              quantity: 2,
            },
            {
              menuItemId: "item-2",
              quantity: 1,
            },
          ],
        },
      }),
    });

    const controller = createCartController({
      supabaseClient: createSupabaseMock(),
      localStorageRef,
      sessionStorageRef: createStorageMock(),
      documentRef: createDocumentMock(),
      windowRef: createWindowMock(),
      fetchRef: vi.fn(),
      setTimeoutRef: vi.fn(),
    });

    await controller.removeItem("vendor1", "item-1");

    expect(JSON.parse(localStorageRef.store["campus_cart_student-1"])).toEqual({
      vendor1: {
        items: [
          {
            menuItemId: "item-2",
            quantity: 1,
          },
        ],
      },
    });
  });

  test("deletes vendor from cart when last item is removed", async () => {
    const localStorageRef = createStorageMock({
      "campus_cart_student-1": JSON.stringify({
        vendor1: {
          items: [
            {
              menuItemId: "item-1",
              quantity: 1,
            },
          ],
        },
      }),
    });

    const controller = createCartController({
      supabaseClient: createSupabaseMock(),
      localStorageRef,
      sessionStorageRef: createStorageMock(),
      documentRef: createDocumentMock(),
      windowRef: createWindowMock(),
      fetchRef: vi.fn(),
      setTimeoutRef: vi.fn(),
    });

    await controller.removeItem("vendor1", "item-1");

    expect(JSON.parse(localStorageRef.store["campus_cart_student-1"])).toEqual(
      {}
    );
  });

  test("increases item quantity", async () => {
    const localStorageRef = createStorageMock({
      "campus_cart_student-1": JSON.stringify({
        vendor1: {
          items: [
            {
              menuItemId: "item-1",
              quantity: 1,
            },
          ],
        },
      }),
    });

    const controller = createCartController({
      supabaseClient: createSupabaseMock(),
      localStorageRef,
      sessionStorageRef: createStorageMock(),
      documentRef: createDocumentMock(),
      windowRef: createWindowMock(),
      fetchRef: vi.fn(),
      setTimeoutRef: vi.fn(),
    });

    await controller.updateQuantity("vendor1", "item-1", 2);

    expect(JSON.parse(localStorageRef.store["campus_cart_student-1"])).toEqual({
      vendor1: {
        items: [
          {
            menuItemId: "item-1",
            quantity: 3,
          },
        ],
      },
    });
  });

  test("removes item when quantity becomes zero", async () => {
    const localStorageRef = createStorageMock({
      "campus_cart_student-1": JSON.stringify({
        vendor1: {
          items: [
            {
              menuItemId: "item-1",
              quantity: 1,
            },
          ],
        },
      }),
    });

    const controller = createCartController({
      supabaseClient: createSupabaseMock(),
      localStorageRef,
      sessionStorageRef: createStorageMock(),
      documentRef: createDocumentMock(),
      windowRef: createWindowMock(),
      fetchRef: vi.fn(),
      setTimeoutRef: vi.fn(),
    });

    await controller.updateQuantity("vendor1", "item-1", -1);

    expect(JSON.parse(localStorageRef.store["campus_cart_student-1"])).toEqual(
      {}
    );
  });

  test("returns not ok when user is not a student", async () => {
    const controller = createCartController({
      supabaseClient: createSupabaseMock({
        appUser: {
          role: "vendor",
        },
      }),
      localStorageRef: createStorageMock(),
      sessionStorageRef: createStorageMock(),
      documentRef: createDocumentMock(),
      windowRef: createWindowMock(),
      fetchRef: vi.fn(),
      setTimeoutRef: vi.fn(),
    });

    await expect(controller.getStudentAuth()).resolves.toEqual({
      ok: false,
    });
  });

  test("returns ok when authenticated user is a student", async () => {
    const controller = createCartController({
      supabaseClient: createSupabaseMock({
        user: {
          id: "student-1",
        },
        appUser: {
          role: "student",
        },
      }),
      localStorageRef: createStorageMock(),
      sessionStorageRef: createStorageMock(),
      documentRef: createDocumentMock(),
      windowRef: createWindowMock(),
      fetchRef: vi.fn(),
      setTimeoutRef: vi.fn(),
    });

    await expect(controller.getStudentAuth()).resolves.toEqual({
      ok: true,
      user: {
        id: "student-1",
      },
    });
  });

  test("sets pay button loading state", () => {
    const documentRef = createDocumentMock();

    const controller = createCartController({
      supabaseClient: createSupabaseMock(),
      localStorageRef: createStorageMock(),
      sessionStorageRef: createStorageMock(),
      documentRef,
      windowRef: createWindowMock(),
      fetchRef: vi.fn(),
      setTimeoutRef: vi.fn(),
    });

    controller.setPayButtonLoading(true);

    expect(documentRef.elements["place-order"].disabled).toBe(true);
    expect(documentRef.elements["place-order"].innerHTML).toContain(
      "Starting payment"
    );

    controller.setPayButtonLoading(false);

    expect(documentRef.elements["place-order"].disabled).toBe(false);
    expect(documentRef.elements["place-order"].innerHTML).toContain("Pay Now");
  });

  test("clears cart when completed paid order is found", async () => {
    const localStorageRef = createStorageMock({
      "campus_cart_student-1": JSON.stringify({
        vendor1: {
          items: [
            {
              menuItemId: "item-1",
            },
          ],
        },
      }),
    });

    const sessionStorageRef = createStorageMock({
      campus_pending_order_id: "ORDER-123",
      campus_pending_cart_key: "campus_cart_student-1",
    });

    const controller = createCartController({
      supabaseClient: createSupabaseMock({
        paymentCleanupOrder: {
          id: "ORDER-123",
          status: "received",
          payment_status: "paid",
        },
      }),
      localStorageRef,
      sessionStorageRef,
      documentRef: createDocumentMock(),
      windowRef: createWindowMock(),
      fetchRef: vi.fn(),
      setTimeoutRef: vi.fn((callback) => callback()),
    });

    await controller.clearCartIfPaymentCompleted();

    expect(localStorageRef.removeItem).toHaveBeenCalledWith(
      "campus_cart_student-1"
    );
    expect(sessionStorageRef.removeItem).toHaveBeenCalledWith(
      "campus_pending_order_id"
    );
    expect(sessionStorageRef.removeItem).toHaveBeenCalledWith(
      "campus_pending_cart_key"
    );
  });

  test("clears pending payment storage when payment failed", async () => {
    const sessionStorageRef = createStorageMock({
      campus_pending_order_id: "ORDER-123",
      campus_pending_cart_key: "campus_cart_student-1",
    });

    const controller = createCartController({
      supabaseClient: createSupabaseMock({
        paymentCleanupOrder: {
          id: "ORDER-123",
          status: "payment_failed",
          payment_status: "failed",
        },
      }),
      localStorageRef: createStorageMock(),
      sessionStorageRef,
      documentRef: createDocumentMock(),
      windowRef: createWindowMock(),
      fetchRef: vi.fn(),
      setTimeoutRef: vi.fn(),
    });

    await controller.clearCartIfPaymentCompleted();

    expect(sessionStorageRef.removeItem).toHaveBeenCalledWith(
      "campus_pending_order_id"
    );
    expect(sessionStorageRef.removeItem).toHaveBeenCalledWith(
      "campus_pending_cart_key"
    );
  });

  test("starts PayFast payment and stores pending payment data", async () => {
    const sessionStorageRef = createStorageMock();
    const documentRef = createDocumentMock();

    const fetchRef = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          success: true,
          paymentUrl: "https://sandbox.payfast.co.za/eng/process",
          paymentFields: {
            merchant_id: "10000100",
            amount: "50.00",
          },
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    });

    const controller = createCartController({
      supabaseClient: createSupabaseMock(),
      localStorageRef: createStorageMock(),
      sessionStorageRef,
      documentRef,
      windowRef: createWindowMock(),
      fetchRef,
      setTimeoutRef: vi.fn(),
    });

    await controller.startPayFastPayment({
      id: "ORDER-123",
      amount: 50,
      student_id: "student-1",
      vendor_id: "vendor1",
    });

    expect(fetchRef).toHaveBeenCalledWith("/api/payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: 50,
        orderReference: "ORDER-123",
        payerReference: "student-1",
        vendorReference: "vendor1",
      }),
    });

    expect(sessionStorageRef.setItem).toHaveBeenCalledWith(
      "campus_pending_order_id",
      "ORDER-123"
    );

    expect(documentRef.body.appendChild).toHaveBeenCalled();
  });

  test("does not allow PayFast payment to start if API returns failure", async () => {
    const fetchRef = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Payment failed",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    });

    const controller = createCartController({
      supabaseClient: createSupabaseMock(),
      localStorageRef: createStorageMock(),
      sessionStorageRef: createStorageMock(),
      documentRef: createDocumentMock(),
      windowRef: createWindowMock(),
      fetchRef,
      setTimeoutRef: vi.fn(),
    });

    await expect(
      controller.startPayFastPayment({
        id: "ORDER-123",
        amount: 50,
        student_id: "student-1",
        vendor_id: "vendor1",
      })
    ).rejects.toThrow("Payment failed");
  });
});