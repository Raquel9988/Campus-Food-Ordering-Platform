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

describe("additional student cart rendering coverage", () => {
  test("showToast displays message and hides it after timeout", () => {
    const documentRef = createDocumentMock();
    const setTimeoutRef = vi.fn((callback) => callback());

    const controller = createCartController({
      supabaseClient: createSupabaseMock(),
      localStorageRef: createStorageMock(),
      sessionStorageRef: createStorageMock(),
      documentRef,
      windowRef: createWindowMock(),
      fetchRef: vi.fn(),
      setTimeoutRef,
    });

    controller.showToast("Cart updated.");

    expect(documentRef.elements.toast.textContent).toBe("Cart updated.");
    expect(documentRef.elements.toast.classList.add).toHaveBeenCalledWith("show");
    expect(documentRef.elements.toast.classList.remove).toHaveBeenCalledWith(
      "show"
    );
  });

  test("showToast uses alert fallback when toast element is missing", () => {
    const documentRef = createDocumentMock();
    documentRef.elements.toast = null;

    const alertRef = vi.fn();

    const controller = createCartController({
      supabaseClient: createSupabaseMock(),
      localStorageRef: createStorageMock(),
      sessionStorageRef: createStorageMock(),
      documentRef,
      windowRef: createWindowMock(),
      fetchRef: vi.fn(),
      setTimeoutRef: vi.fn(),
      alertRef,
    });

    controller.showToast("Fallback message.");

    expect(alertRef).toHaveBeenCalledWith("Fallback message.");
  });

  test("showCartMessage displays cart message with selected type", () => {
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

    controller.showCartMessage("Only one vendor allowed.", "error");

    expect(documentRef.elements["cart-message"].textContent).toBe(
      "Only one vendor allowed."
    );
    expect(documentRef.elements["cart-message"].className).toBe(
      "cart-message error"
    );
    expect(documentRef.elements["cart-message"].classList.remove).toHaveBeenCalledWith(
      "hidden"
    );
  });

  test("clearCartMessage hides and clears the cart message", () => {
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

    controller.showCartMessage("Message first.", "warning");
    controller.clearCartMessage();

    expect(documentRef.elements["cart-message"].textContent).toBe("");
    expect(documentRef.elements["cart-message"].classList.add).toHaveBeenCalledWith(
      "hidden"
    );
  });

  test("renderCart shows empty cart message and disables place order button", async () => {
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

    await controller.renderCart();

    expect(documentRef.elements["cart-items"].innerHTML).toContain(
      "Your cart is empty."
    );
    expect(documentRef.elements.total.textContent).toBe("Total: R0.00");
    expect(documentRef.elements["place-order"].disabled).toBe(true);
  });

  test("renderCart shows one vendor cart and calculates total", async () => {
    const documentRef = createDocumentMock();

    const localStorageRef = createStorageMock({
      "campus_cart_student-1": JSON.stringify({
        vendor1: {
          items: [
            {
              menuItemId: "item-1",
              name: "Burger",
              price: 30,
              quantity: 2,
              image_url: "",
            },
            {
              menuItemId: "item-2",
              name: "Chips",
              price: 15,
              quantity: 1,
              image_url: "https://example.com/chips.png",
            },
          ],
        },
      }),
    });

    const controller = createCartController({
      supabaseClient: createSupabaseMock({
        vendorName: "Campus Burgers",
      }),
      localStorageRef,
      sessionStorageRef: createStorageMock(),
      documentRef,
      windowRef: createWindowMock(),
      fetchRef: vi.fn(),
      setTimeoutRef: vi.fn(),
    });

    await controller.renderCart();

    expect(documentRef.elements["place-order"].disabled).toBe(false);
    expect(documentRef.elements["cart-items"].children).toHaveLength(1);
    expect(documentRef.elements.total.textContent).toBe("Total: R 75.00");
    expect(documentRef.elements["cart-message"].textContent).toBe("");
  });

  test("renderCart shows warning when cart has items from multiple vendors", async () => {
    const documentRef = createDocumentMock();

    const localStorageRef = createStorageMock({
      "campus_cart_student-1": JSON.stringify({
        vendor1: {
          items: [
            {
              menuItemId: "item-1",
              name: "Burger",
              price: 30,
              quantity: 1,
              image_url: "",
            },
          ],
        },
        vendor2: {
          items: [
            {
              menuItemId: "item-2",
              name: "Pizza",
              price: 50,
              quantity: 1,
              image_url: "",
            },
          ],
        },
      }),
    });

    const controller = createCartController({
      supabaseClient: createSupabaseMock(),
      localStorageRef,
      sessionStorageRef: createStorageMock(),
      documentRef,
      windowRef: createWindowMock(),
      fetchRef: vi.fn(),
      setTimeoutRef: vi.fn(),
    });

    await controller.renderCart();

    expect(documentRef.elements["cart-message"].textContent).toContain(
      "You can only order from one vendor at a time"
    );
    expect(documentRef.elements["cart-message"].className).toBe(
      "cart-message error"
    );
    expect(documentRef.elements.total.textContent).toBe("Total: R 80.00");
  });

  test("clearCartIfPaymentCompleted does nothing when no pending payment exists", async () => {
    const localStorageRef = createStorageMock();
    const sessionStorageRef = createStorageMock();

    const controller = createCartController({
      supabaseClient: createSupabaseMock(),
      localStorageRef,
      sessionStorageRef,
      documentRef: createDocumentMock(),
      windowRef: createWindowMock(),
      fetchRef: vi.fn(),
      setTimeoutRef: vi.fn(),
    });

    await controller.clearCartIfPaymentCompleted();

    expect(localStorageRef.removeItem).not.toHaveBeenCalled();
    expect(sessionStorageRef.removeItem).not.toHaveBeenCalled();
  });

  test("clearCartIfPaymentCompleted logs error when cleanup query fails", async () => {
    const consoleRef = {
      error: vi.fn(),
    };

    const sessionStorageRef = createStorageMock({
      campus_pending_order_id: "ORDER-123",
      campus_pending_cart_key: "campus_cart_student-1",
    });

    const controller = createCartController({
      supabaseClient: createSupabaseMock({
        paymentCleanupError: {
          message: "Database error",
        },
      }),
      localStorageRef: createStorageMock(),
      sessionStorageRef,
      documentRef: createDocumentMock(),
      windowRef: createWindowMock(),
      fetchRef: vi.fn(),
      setTimeoutRef: vi.fn(),
      consoleRef,
    });

    await controller.clearCartIfPaymentCompleted();

    expect(consoleRef.error).toHaveBeenCalledWith(
      "Payment cleanup check error:",
      {
        message: "Database error",
      }
    );
  });

  test("redirectToPayFast throws error when payment response is invalid", () => {
    const controller = createCartController({
      supabaseClient: createSupabaseMock(),
      localStorageRef: createStorageMock(),
      sessionStorageRef: createStorageMock(),
      documentRef: createDocumentMock(),
      windowRef: createWindowMock(),
      fetchRef: vi.fn(),
      setTimeoutRef: vi.fn(),
    });

    expect(() => {
      controller.redirectToPayFast("", null);
    }).toThrow("Invalid PayFast payment response.");
  });

  test("handleBackClick redirects back to student dashboard", () => {
    const windowRef = createWindowMock();

    const controller = createCartController({
      supabaseClient: createSupabaseMock(),
      localStorageRef: createStorageMock(),
      sessionStorageRef: createStorageMock(),
      documentRef: createDocumentMock(),
      windowRef,
      fetchRef: vi.fn(),
      setTimeoutRef: vi.fn(),
    });

    controller.handleBackClick();

    expect(windowRef.location.href).toBe("student-dashboard.html");
  });
});

describe("additional student cart order placement coverage", () => {
  test("handlePageLoad redirects when user is not authenticated as a student", async () => {
    const windowRef = createWindowMock();

    const controller = createCartController({
      supabaseClient: createSupabaseMock({
        user: null,
      }),
      localStorageRef: createStorageMock(),
      sessionStorageRef: createStorageMock(),
      documentRef: createDocumentMock(),
      windowRef,
      fetchRef: vi.fn(),
      setTimeoutRef: vi.fn(),
    });

    await controller.handlePageLoad();

    expect(windowRef.location.href).toBe("../auth/login.html");
  });

  test("handlePageLoad renders cart when user is authenticated", async () => {
    const documentRef = createDocumentMock();

    const localStorageRef = createStorageMock({
      "campus_cart_student-1": JSON.stringify({
        vendor1: {
          items: [
            {
              menuItemId: "item-1",
              name: "Burger",
              price: 25,
              quantity: 2,
              image_url: "",
            },
          ],
        },
      }),
    });

    const controller = createCartController({
      supabaseClient: createSupabaseMock(),
      localStorageRef,
      sessionStorageRef: createStorageMock(),
      documentRef,
      windowRef: createWindowMock(),
      fetchRef: vi.fn(),
      setTimeoutRef: vi.fn(),
    });

    await controller.handlePageLoad();

    expect(documentRef.elements.total.textContent).toBe("Total: R 50.00");
  });

  test("handlePlaceOrderClick redirects when user is not authenticated", async () => {
    const windowRef = createWindowMock();

    const controller = createCartController({
      supabaseClient: createSupabaseMock({
        user: null,
      }),
      localStorageRef: createStorageMock(),
      sessionStorageRef: createStorageMock(),
      documentRef: createDocumentMock(),
      windowRef,
      fetchRef: vi.fn(),
      setTimeoutRef: vi.fn(),
    });

    await controller.handlePlaceOrderClick();

    expect(windowRef.location.href).toBe("../auth/login.html");
  });

  test("handlePlaceOrderClick shows toast when cart is empty", async () => {
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

    await controller.handlePlaceOrderClick();

    expect(documentRef.elements.toast.textContent).toBe("Your cart is empty.");
    expect(documentRef.elements["place-order"].disabled).toBe(false);
  });

  test("handlePlaceOrderClick blocks checkout when cart has multiple vendors", async () => {
    const documentRef = createDocumentMock();

    const localStorageRef = createStorageMock({
      "campus_cart_student-1": JSON.stringify({
        vendor1: {
          items: [
            {
              menuItemId: "item-1",
              name: "Burger",
              price: 30,
              quantity: 1,
            },
          ],
        },
        vendor2: {
          items: [
            {
              menuItemId: "item-2",
              name: "Pizza",
              price: 50,
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
      documentRef,
      windowRef: createWindowMock(),
      fetchRef: vi.fn(),
      setTimeoutRef: vi.fn(),
    });

    await controller.handlePlaceOrderClick();

    expect(documentRef.elements["cart-message"].textContent).toContain(
      "You can only order from one vendor at a time"
    );
    expect(documentRef.elements["place-order"].disabled).toBe(false);
  });

  test("handlePlaceOrderClick rejects cart with zero total", async () => {
    const documentRef = createDocumentMock();

    const localStorageRef = createStorageMock({
      "campus_cart_student-1": JSON.stringify({
        vendor1: {
          items: [
            {
              menuItemId: "item-1",
              name: "Free item",
              price: 0,
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
      documentRef,
      windowRef: createWindowMock(),
      fetchRef: vi.fn(),
      setTimeoutRef: vi.fn(),
    });

    await controller.handlePlaceOrderClick();

    expect(documentRef.elements["cart-message"].textContent).toBe(
      "Your cart total must be greater than R0.00."
    );
    expect(documentRef.elements["place-order"].disabled).toBe(false);
  });

  test("handlePlaceOrderClick creates order, saves order items, and starts PayFast payment", async () => {
    const documentRef = createDocumentMock();
    const sessionStorageRef = createStorageMock();

    const localStorageRef = createStorageMock({
      "campus_cart_student-1": JSON.stringify({
        vendor1: {
          items: [
            {
              menuItemId: "item-1",
              name: "Burger",
              price: 30,
              quantity: 2,
            },
            {
              menuItemId: "item-2",
              name: "Chips",
              price: 15,
              quantity: 1,
            },
          ],
        },
      }),
    });

    const fetchRef = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          success: true,
          paymentUrl: "https://sandbox.payfast.co.za/eng/process",
          paymentFields: {
            merchant_id: "10000100",
            amount: "75.00",
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

    const supabaseClient = createSupabaseMock({
      createdOrder: {
        id: "ORDER-123",
      },
    });

    const controller = createCartController({
      supabaseClient,
      localStorageRef,
      sessionStorageRef,
      documentRef,
      windowRef: createWindowMock(),
      fetchRef,
      setTimeoutRef: vi.fn(),
    });

    await controller.handlePlaceOrderClick();

    expect(supabaseClient.insertedRows[0]).toEqual({
      tableName: "orders",
      rows: [
        {
          student_id: "student-1",
          vendor_id: "vendor1",
          status: "payment_pending",
          payment_status: "pending",
          payment_provider: "payfast_sandbox",
          payment_amount: 75,
        },
      ],
    });

    expect(supabaseClient.insertedRows[1]).toEqual({
      tableName: "order_items",
      rows: [
        {
          order_id: "ORDER-123",
          menu_item_id: "item-1",
          quantity: 2,
          price: 30,
        },
        {
          order_id: "ORDER-123",
          menu_item_id: "item-2",
          quantity: 1,
          price: 15,
        },
      ],
    });

    expect(fetchRef).toHaveBeenCalledWith("/api/payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: 75,
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

  test("handlePlaceOrderClick shows error when order cannot be created", async () => {
    const documentRef = createDocumentMock();

    const localStorageRef = createStorageMock({
      "campus_cart_student-1": JSON.stringify({
        vendor1: {
          items: [
            {
              menuItemId: "item-1",
              name: "Burger",
              price: 30,
              quantity: 1,
            },
          ],
        },
      }),
    });

    const controller = createCartController({
      supabaseClient: createSupabaseMock({
        createdOrder: null,
        orderError: {
          message: "Insert failed",
        },
      }),
      localStorageRef,
      sessionStorageRef: createStorageMock(),
      documentRef,
      windowRef: createWindowMock(),
      fetchRef: vi.fn(),
      setTimeoutRef: vi.fn(),
    });

    await controller.handlePlaceOrderClick();

    expect(documentRef.elements["cart-message"].textContent).toBe(
      "Could not create order."
    );
    expect(documentRef.elements["place-order"].disabled).toBe(false);
  });

  test("handlePlaceOrderClick marks order as failed when order items cannot be saved", async () => {
    const documentRef = createDocumentMock();

    const localStorageRef = createStorageMock({
      "campus_cart_student-1": JSON.stringify({
        vendor1: {
          items: [
            {
              menuItemId: "item-1",
              name: "Burger",
              price: 30,
              quantity: 1,
            },
          ],
        },
      }),
    });

    const supabaseClient = createSupabaseMock({
      createdOrder: {
        id: "ORDER-123",
      },
      orderItemsError: {
        message: "Items failed",
      },
    });

    const controller = createCartController({
      supabaseClient,
      localStorageRef,
      sessionStorageRef: createStorageMock(),
      documentRef,
      windowRef: createWindowMock(),
      fetchRef: vi.fn(),
      setTimeoutRef: vi.fn(),
    });

    await controller.handlePlaceOrderClick();

    expect(supabaseClient.updatedRows).toEqual([
      {
        tableName: "orders",
        data: {
          status: "payment_failed",
          payment_status: "failed",
        },
      },
    ]);

    expect(documentRef.elements["cart-message"].textContent).toBe(
      "Could not save order items."
    );
  });

  test("handlePlaceOrderClick marks order as failed when PayFast payment cannot start", async () => {
    const documentRef = createDocumentMock();

    const localStorageRef = createStorageMock({
      "campus_cart_student-1": JSON.stringify({
        vendor1: {
          items: [
            {
              menuItemId: "item-1",
              name: "Burger",
              price: 30,
              quantity: 1,
            },
          ],
        },
      }),
    });

    const fetchRef = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Payment could not start",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    });

    const supabaseClient = createSupabaseMock({
      createdOrder: {
        id: "ORDER-123",
      },
    });

    const controller = createCartController({
      supabaseClient,
      localStorageRef,
      sessionStorageRef: createStorageMock(),
      documentRef,
      windowRef: createWindowMock(),
      fetchRef,
      setTimeoutRef: vi.fn(),
    });

    await controller.handlePlaceOrderClick();

    expect(supabaseClient.updatedRows).toEqual([
      {
        tableName: "orders",
        data: {
          status: "payment_failed",
          payment_status: "failed",
        },
      },
    ]);

    expect(documentRef.elements["cart-message"].textContent).toBe(
      "Payment could not start"
    );
  });

  test("handleClearCartClick does nothing when user cancels confirmation", async () => {
    const localStorageRef = createStorageMock({
      "campus_cart_student-1": JSON.stringify({
        vendor1: {
          items: [
            {
              menuItemId: "item-1",
              name: "Burger",
              price: 30,
              quantity: 1,
            },
          ],
        },
      }),
    });

    const confirmRef = vi.fn(() => false);

    const controller = createCartController({
      supabaseClient: createSupabaseMock(),
      localStorageRef,
      sessionStorageRef: createStorageMock(),
      documentRef: createDocumentMock(),
      windowRef: createWindowMock(),
      fetchRef: vi.fn(),
      setTimeoutRef: vi.fn(),
      confirmRef,
    });

    await controller.handleClearCartClick();

    expect(confirmRef).toHaveBeenCalledWith(
      "Are you sure you want to clear your cart?"
    );
    expect(localStorageRef.removeItem).not.toHaveBeenCalled();
  });

  test("handleClearCartClick clears the cart when user confirms", async () => {
    const documentRef = createDocumentMock();

    const localStorageRef = createStorageMock({
      "campus_cart_student-1": JSON.stringify({
        vendor1: {
          items: [
            {
              menuItemId: "item-1",
              name: "Burger",
              price: 30,
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
      documentRef,
      windowRef: createWindowMock(),
      fetchRef: vi.fn(),
      setTimeoutRef: vi.fn(),
      confirmRef: vi.fn(() => true),
    });

    await controller.handleClearCartClick();

    expect(localStorageRef.removeItem).toHaveBeenCalledWith(
      "campus_cart_student-1"
    );
    expect(documentRef.elements.toast.textContent).toBe("Cart cleared.");
  });
});