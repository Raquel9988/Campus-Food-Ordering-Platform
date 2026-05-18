import { describe, test, expect, vi, beforeEach } from "vitest";

import {
  normalizeTag,
  formatTag,
  getItemTags,
  getVendorIdFromUrl,
  createStudentMenuController,
} from "../student/student-menu.js";

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
  const element = {
    id,
    textContent: "",
    className: "",
    type: "",
    src: "",
    alt: "",
    dataset: {},
    children: [],

    classList: {
      add: vi.fn(),
      remove: vi.fn(),
      toggle: vi.fn(),
    },

    appendChild: vi.fn(function (child) {
      this.children.push(child);
    }),

    addEventListener: vi.fn(function (event, handler) {
      this[`on${event}`] = handler;
    }),

    setAttribute: vi.fn(function (name, value) {
      this[name] = value;
    }),
  };

  let innerHtmlValue = "";

  Object.defineProperty(element, "innerHTML", {
    get() {
      return innerHtmlValue;
    },

    set(value) {
      innerHtmlValue = String(value);

      if (value === "") {
        this.children = [];
      }
    },
  });

  return element;
}

function createDocumentMock() {
  const elements = {
    toast: createElementMock("toast"),
    "vendor-name": createElementMock("vendor-name"),
    "menu-list": createElementMock("menu-list"),
    "filter-summary": createElementMock("filter-summary"),
    "back-btn": createElementMock("back-btn"),
    "view-cart": createElementMock("view-cart"),
    "clear-filter-inline": createElementMock("clear-filter-inline"),
    "clear-filters-btn": createElementMock("clear-filters-btn"),
  };

  const allChip = createElementMock("all-chip");
  allChip.dataset.filter = "all";

  const veganChip = createElementMock("vegan-chip");
  veganChip.dataset.filter = "vegan";

  const halalChip = createElementMock("halal-chip");
  halalChip.dataset.filter = "halal";

  return {
    elements,
    filterChips: [allChip, veganChip, halalChip],

    getElementById: vi.fn((id) => {
      return elements[id] || null;
    }),

    querySelectorAll: vi.fn((selector) => {
      if (selector === ".filter-chip") {
        return [allChip, veganChip, halalChip];
      }

      return [];
    }),

    querySelector: vi.fn((selector) => {
      if (selector === '.filter-chip[data-filter="all"]') {
        return allChip;
      }

      return null;
    }),

    createElement: vi.fn((tagName) => {
      const element = createElementMock(tagName);
      element.tagName = tagName.toUpperCase();
      return element;
    }),

    addEventListener: vi.fn(),
  };
}

function createWindowMock(search = "?vendorId=vendor-1") {
  return {
    location: {
      href: "https://campus-food-ordering.pages.dev/student/student-menu.html",
      search,
    },
  };
}

function createSupabaseMock({
  user = {
    id: "student-1",
  },
  vendor = {
    business_name: "Campus Burgers",
  },
  vendorError = null,
  menuItems = [
    {
      id: "item-1",
      name: "Burger",
      price: 50,
      description: "Beef burger",
      image_url: "",
      dietary_tags: ["halal"],
    },
  ],
  menuError = null,
} = {}) {
  const supabaseClient = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user,
        },
      }),
    },

    from: vi.fn((tableName) => {
      const query = {
        select: vi.fn(() => query),
        eq: vi.fn(() => query),

        single: vi.fn(async () => {
          if (tableName === "vendors") {
            return {
              data: vendor,
              error: vendorError,
            };
          }

          return {
            data: null,
            error: null,
          };
        }),

        order: vi.fn(async () => {
          if (tableName === "menu_items") {
            return {
              data: menuItems,
              error: menuError,
            };
          }

          return {
            data: [],
            error: null,
          };
        }),
      };

      return query;
    }),
  };

  return supabaseClient;
}

describe("actual student menu page logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("normalizes dietary tags", () => {
    expect(normalizeTag(" Gluten-Free ")).toBe("gluten_free");
    expect(normalizeTag("Nut Free")).toBe("nut_free");
    expect(normalizeTag("HALAL")).toBe("halal");
  });

  test("formats dietary tags for display", () => {
    expect(formatTag("gluten_free")).toBe("Gluten-Free");
    expect(formatTag("nut_free")).toBe("Nut-Free");
  });

  test("gets normalized tags from a menu item", () => {
    expect(
      getItemTags({
        dietary_tags: ["Vegan", "Gluten-Free"],
      })
    ).toEqual(["vegan", "gluten_free"]);

    expect(
      getItemTags({
        dietary_tags: null,
      })
    ).toEqual([]);
  });

  test("gets vendor id from URL", () => {
    expect(getVendorIdFromUrl(createWindowMock("?vendorId=vendor-123"))).toBe(
      "vendor-123"
    );
  });

  test("uses student-specific cart key when user is logged in", async () => {
    const controller = createStudentMenuController({
      supabaseClient: createSupabaseMock({
        user: {
          id: "student-1",
        },
      }),
      documentRef: createDocumentMock(),
      windowRef: createWindowMock(),
      localStorageRef: createStorageMock(),
      setTimeoutRef: vi.fn(),
    });

    await expect(controller.getCartKey()).resolves.toBe(
      "campus_cart_student-1"
    );
  });

  test("uses guest cart key when no user is logged in", async () => {
    const controller = createStudentMenuController({
      supabaseClient: createSupabaseMock({
        user: null,
      }),
      documentRef: createDocumentMock(),
      windowRef: createWindowMock(),
      localStorageRef: createStorageMock(),
      setTimeoutRef: vi.fn(),
    });

    await expect(controller.getCartKey()).resolves.toBe("campus_cart_guest");
  });

  test("adds new item to cart", async () => {
    const localStorageRef = createStorageMock();

    const controller = createStudentMenuController({
      supabaseClient: createSupabaseMock(),
      documentRef: createDocumentMock(),
      windowRef: createWindowMock(),
      localStorageRef,
      setTimeoutRef: vi.fn(),
      vendorId: "vendor-1",
    });

    const added = await controller.addToCart("vendor-1", {
      menuItemId: "item-1",
      name: "Burger",
      price: 50,
      image_url: "",
    });

    expect(added).toBe(true);

    expect(JSON.parse(localStorageRef.store["campus_cart_student-1"])).toEqual({
      "vendor-1": {
        items: [
          {
            menuItemId: "item-1",
            name: "Burger",
            price: 50,
            image_url: "",
            quantity: 1,
          },
        ],
      },
    });
  });

  test("increases quantity when same item is added again", async () => {
    const localStorageRef = createStorageMock({
      "campus_cart_student-1": JSON.stringify({
        "vendor-1": {
          items: [
            {
              menuItemId: "item-1",
              name: "Burger",
              price: 50,
              image_url: "",
              quantity: 1,
            },
          ],
        },
      }),
    });

    const controller = createStudentMenuController({
      supabaseClient: createSupabaseMock(),
      documentRef: createDocumentMock(),
      windowRef: createWindowMock(),
      localStorageRef,
      setTimeoutRef: vi.fn(),
      vendorId: "vendor-1",
    });

    const added = await controller.addToCart("vendor-1", {
      menuItemId: "item-1",
      name: "Burger",
      price: 50,
      image_url: "",
    });

    expect(added).toBe(true);

    expect(JSON.parse(localStorageRef.store["campus_cart_student-1"])).toEqual({
      "vendor-1": {
        items: [
          {
            menuItemId: "item-1",
            name: "Burger",
            price: 50,
            image_url: "",
            quantity: 2,
          },
        ],
      },
    });
  });

  test("blocks adding an item from a different vendor and keeps the original cart", async () => {
    const confirmRef = vi.fn(() => true);

    const localStorageRef = createStorageMock({
      "campus_cart_student-1": JSON.stringify({
        "vendor-old": {
          items: [
            {
              menuItemId: "old-item",
              name: "Old Item",
              price: 20,
              image_url: "",
              quantity: 1,
            },
          ],
        },
      }),
    });

    const controller = createStudentMenuController({
      supabaseClient: createSupabaseMock(),
      documentRef: createDocumentMock(),
      windowRef: createWindowMock(),
      localStorageRef,
      setTimeoutRef: vi.fn(),
      confirmRef,
      vendorId: "vendor-new",
    });

    const added = await controller.addToCart("vendor-new", {
      menuItemId: "new-item",
      name: "New Vendor Burger",
      price: 50,
      image_url: "",
    });

    expect(added).toBe(false);

    expect(confirmRef).not.toHaveBeenCalled();

    expect(JSON.parse(localStorageRef.store["campus_cart_student-1"])).toEqual({
      "vendor-old": {
        items: [
          {
            menuItemId: "old-item",
            name: "Old Item",
            price: 20,
            image_url: "",
            quantity: 1,
          },
        ],
      },
    });
  });

  test("allows adding another item from the original vendor after a different vendor was blocked", async () => {
    const localStorageRef = createStorageMock({
      "campus_cart_student-1": JSON.stringify({
        "vendor-old": {
          items: [
            {
              menuItemId: "old-item",
              name: "Old Item",
              price: 20,
              image_url: "",
              quantity: 1,
            },
          ],
        },
      }),
    });

    const controller = createStudentMenuController({
      supabaseClient: createSupabaseMock(),
      documentRef: createDocumentMock(),
      windowRef: createWindowMock(),
      localStorageRef,
      setTimeoutRef: vi.fn(),
      confirmRef: vi.fn(() => true),
      vendorId: "vendor-old",
    });

    const blocked = await controller.addToCart("vendor-new", {
      menuItemId: "new-item",
      name: "New Vendor Burger",
      price: 50,
      image_url: "",
    });

    expect(blocked).toBe(false);

    const addedOriginalVendorItem = await controller.addToCart("vendor-old", {
      menuItemId: "second-old-item",
      name: "Second Pizza",
      price: 60,
      image_url: "",
    });

    expect(addedOriginalVendorItem).toBe(true);

    expect(JSON.parse(localStorageRef.store["campus_cart_student-1"])).toEqual({
      "vendor-old": {
        items: [
          {
            menuItemId: "old-item",
            name: "Old Item",
            price: 20,
            image_url: "",
            quantity: 1,
          },
          {
            menuItemId: "second-old-item",
            name: "Second Pizza",
            price: 60,
            image_url: "",
            quantity: 1,
          },
        ],
      },
    });
  });

  test("loads vendor name", async () => {
    const documentRef = createDocumentMock();

    const controller = createStudentMenuController({
      supabaseClient: createSupabaseMock({
        vendor: {
          business_name: "Campus Burgers",
        },
      }),
      documentRef,
      windowRef: createWindowMock(),
      localStorageRef: createStorageMock(),
      setTimeoutRef: vi.fn(),
      vendorId: "vendor-1",
    });

    await controller.loadVendorName();

    expect(documentRef.elements["vendor-name"].textContent).toBe(
      "Campus Burgers"
    );
  });

  test("shows default vendor title when no vendor is selected", async () => {
    const documentRef = createDocumentMock();

    const controller = createStudentMenuController({
      supabaseClient: createSupabaseMock(),
      documentRef,
      windowRef: createWindowMock(""),
      localStorageRef: createStorageMock(),
      setTimeoutRef: vi.fn(),
      vendorId: null,
    });

    await controller.loadVendorName();

    expect(documentRef.elements["vendor-name"].textContent).toBe("Vendor Menu");
  });

  test("shows error when no vendor is selected for menu", async () => {
    const documentRef = createDocumentMock();

    const controller = createStudentMenuController({
      supabaseClient: createSupabaseMock(),
      documentRef,
      windowRef: createWindowMock(""),
      localStorageRef: createStorageMock(),
      setTimeoutRef: vi.fn(),
      vendorId: null,
    });

    await controller.loadMenu();

    expect(documentRef.elements["menu-list"].innerHTML).toContain(
      "No vendor selected"
    );
  });

  test("loads menu items and renders them", async () => {
    const documentRef = createDocumentMock();

    const controller = createStudentMenuController({
      supabaseClient: createSupabaseMock({
        menuItems: [
          {
            id: "item-1",
            name: "Burger",
            price: 50,
            description: "Beef burger",
            image_url: "",
            dietary_tags: ["halal"],
          },
        ],
      }),
      documentRef,
      windowRef: createWindowMock(),
      localStorageRef: createStorageMock(),
      setTimeoutRef: vi.fn(),
      vendorId: "vendor-1",
    });

    await controller.loadMenu();

    expect(controller.state.allMenuItems).toHaveLength(1);
    expect(documentRef.elements["menu-list"].appendChild).toHaveBeenCalled();
    expect(documentRef.elements["menu-list"].children).toHaveLength(1);
  });

  test("shows empty menu message when there are no menu items", async () => {
    const documentRef = createDocumentMock();

    const controller = createStudentMenuController({
      supabaseClient: createSupabaseMock({
        menuItems: [],
      }),
      documentRef,
      windowRef: createWindowMock(),
      localStorageRef: createStorageMock(),
      setTimeoutRef: vi.fn(),
      vendorId: "vendor-1",
    });

    await controller.loadMenu();

    expect(documentRef.elements["menu-list"].innerHTML).toContain(
      "No menu items available"
    );
  });

  test("shows menu loading error", async () => {
    const documentRef = createDocumentMock();

    const controller = createStudentMenuController({
      supabaseClient: createSupabaseMock({
        menuError: {
          message: "Database error",
        },
      }),
      documentRef,
      windowRef: createWindowMock(),
      localStorageRef: createStorageMock(),
      setTimeoutRef: vi.fn(),
      vendorId: "vendor-1",
    });

    await controller.loadMenu();

    expect(documentRef.elements["menu-list"].innerHTML).toContain(
      "Error loading menu"
    );
  });

  test("filters menu items by selected dietary tag", () => {
    const documentRef = createDocumentMock();

    const controller = createStudentMenuController({
      supabaseClient: createSupabaseMock(),
      documentRef,
      windowRef: createWindowMock(),
      localStorageRef: createStorageMock(),
      setTimeoutRef: vi.fn(),
      vendorId: "vendor-1",
    });

    controller.state.allMenuItems = [
      {
        id: "item-1",
        name: "Vegan Wrap",
        price: 40,
        description: "Wrap",
        image_url: "",
        dietary_tags: ["vegan"],
      },
      {
        id: "item-2",
        name: "Chicken Burger",
        price: 50,
        description: "Burger",
        image_url: "",
        dietary_tags: ["halal"],
      },
    ];

    controller.state.activeFilters.add("vegan");
    controller.applyFilters();

    expect(documentRef.elements["menu-list"].children).toHaveLength(1);
    expect(documentRef.elements["filter-summary"].innerHTML).toContain("Vegan");
  });

  test("resets filters", () => {
    const documentRef = createDocumentMock();

    const controller = createStudentMenuController({
      supabaseClient: createSupabaseMock(),
      documentRef,
      windowRef: createWindowMock(),
      localStorageRef: createStorageMock(),
      setTimeoutRef: vi.fn(),
      vendorId: "vendor-1",
    });

    controller.state.allMenuItems = [
      {
        id: "item-1",
        name: "Burger",
        price: 50,
        description: "Burger",
        image_url: "",
        dietary_tags: ["halal"],
      },
    ];

    controller.state.activeFilters.add("halal");

    controller.resetFilters();

    expect(controller.state.activeFilters.size).toBe(0);
    expect(documentRef.filterChips[0].classList.toggle).toHaveBeenCalledWith(
      "active",
      true
    );
    expect(documentRef.elements["filter-summary"].innerHTML).toBe("");
  });

  test("sets up navigation buttons", () => {
    const documentRef = createDocumentMock();
    const windowRef = createWindowMock();

    const controller = createStudentMenuController({
      supabaseClient: createSupabaseMock(),
      documentRef,
      windowRef,
      localStorageRef: createStorageMock(),
      setTimeoutRef: vi.fn(),
      vendorId: "vendor-1",
    });

    controller.setupNavigation();

    documentRef.elements["back-btn"].onclick();
    expect(windowRef.location.href).toBe("student-dashboard.html");

    documentRef.elements["view-cart"].onclick();
    expect(windowRef.location.href).toBe("student-cart.html");
  });

  test("sets up DOMContentLoaded event for menu page", () => {
    const documentRef = createDocumentMock();

    const controller = createStudentMenuController({
      supabaseClient: createSupabaseMock(),
      documentRef,
      windowRef: createWindowMock(),
      localStorageRef: createStorageMock(),
      setTimeoutRef: vi.fn(),
      vendorId: "vendor-1",
    });

    controller.setupStudentMenuPage();

    expect(documentRef.addEventListener).toHaveBeenCalledWith(
      "DOMContentLoaded",
      controller.initMenu
    );
  });
});
