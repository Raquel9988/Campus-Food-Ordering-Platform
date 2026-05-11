import { describe, expect, test, beforeEach, afterEach, vi } from "vitest";

function setupDom() {
  document.body.innerHTML = `
    <section class="field-group">
      <input id="item-name" />
    </section>

    <section class="field-group">
      <input id="item-description" />
    </section>

    <section class="field-group">
      <input id="item-price" />
    </section>

    <section class="field-group">
      <input id="item-image" type="file" />
    </section>

    <label class="file-drop">
      <span>Click to upload image</span>
    </label>

    <p id="dietary-error" style="display:none;"></p>
    <p id="form-message" style="display:none;"></p>
  `;
}

function setupFullMenuDom() {
  document.body.innerHTML = `
    <form id="menu-item-form">
      <h2 id="form-card-title">Add Menu Item</h2>

      <section class="field-group">
        <input id="item-name" />
      </section>

      <section class="field-group">
        <textarea id="item-description"></textarea>
      </section>

      <section class="field-group">
        <input id="item-price" />
      </section>

      <section class="field-group">
        <select id="item-availability">
          <option value="true">Available</option>
          <option value="false">Sold Out</option>
        </select>
      </section>

      <section class="field-group">
        <input id="item-image" type="file" />
      </section>

      <label class="file-drop">
        <span>Click to upload image</span>
      </label>

      <label>
        <input class="dietary-tag" type="checkbox" value="halal" />
        Halal
      </label>

      <label>
        <input class="dietary-tag" type="checkbox" value="vegetarian" />
        Vegetarian
      </label>

      <label>
        <input class="dietary-tag" type="checkbox" value="vegan" />
        Vegan
      </label>

      <label>
        <input class="dietary-tag" type="checkbox" value="nut_free" />
        Nut free
      </label>

      <label>
        <input class="dietary-tag" type="checkbox" value="gluten_free" />
        Gluten free
      </label>

      <label>
        <input class="dietary-tag" type="checkbox" value="dairy_free" />
        Dairy free
      </label>

      <label>
        <input id="other-checkbox" type="checkbox" />
        Other
      </label>

      <section id="other-input-wrap" style="display:none;">
        <input id="other-input" />
      </section>

      <p id="dietary-error" style="display:none;"></p>
      <p id="form-message" style="display:none;"></p>

      <button id="submit-btn" type="submit">Add Item</button>
      <button id="cancel-edit-btn" type="button" style="display:none;">
        Cancel
      </button>
    </form>

    <section id="menu-items-container"></section>
  `;

  document.getElementById("menu-item-form").scrollIntoView = vi.fn();
}

function flushPromises() {
  return Promise.resolve()
    .then(() => Promise.resolve())
    .then(() => Promise.resolve())
    .then(() => Promise.resolve());
}

function submitMenuForm() {
  const form = document.getElementById("menu-item-form");

  form.dispatchEvent(
    new Event("submit", {
      bubbles: true,
      cancelable: true,
    })
  );

  return flushPromises();
}

function createQueryBuilder(tableName, mockState) {
  return {
    tableName,
    filters: [],
    selectedColumns: "",
    operation: null,
    updateData: null,

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

    order() {
      if (this.tableName === "menu_items") {
        return Promise.resolve({
          data: mockState.menuItems,
          error: mockState.menuItemsError,
        });
      }

      return Promise.resolve({
        data: [],
        error: null,
      });
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

    insert(rows) {
      mockState.insertedRows.push({
        tableName: this.tableName,
        rows,
      });

      return Promise.resolve({
        data: mockState.insertData,
        error: mockState.insertError,
      });
    },

    update(data) {
      this.operation = "update";
      this.updateData = data;
      return this;
    },

    delete() {
      this.operation = "delete";
      return this;
    },

    then(resolve, reject) {
      if (this.operation === "update") {
        mockState.updatedRows.push({
          tableName: this.tableName,
          data: this.updateData,
          filters: [...this.filters],
        });

        return Promise.resolve({
          data: null,
          error: mockState.updateError,
        }).then(resolve, reject);
      }

      if (this.operation === "delete") {
        mockState.deletedRows.push({
          tableName: this.tableName,
          filters: [...this.filters],
        });

        return Promise.resolve({
          data: null,
          error: mockState.deleteError,
        }).then(resolve, reject);
      }

      return Promise.resolve({
        data: null,
        error: null,
      }).then(resolve, reject);
    },
  };
}

function createMockSupabase(overrides = {}) {
  const mockState = {
    user: {
      id: "user-1",
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

    menuItems: [],
    menuItemsError: null,

    insertedRows: [],
    updatedRows: [],
    deletedRows: [],
    uploads: [],

    insertData: null,
    insertError: null,
    updateError: null,
    deleteError: null,

    uploadError: null,
    publicUrl: "https://example.com/menu-image.png",

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

    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(async (fileName, file, options) => {
          mockState.uploads.push({
            fileName,
            file,
            options,
          });

          return {
            error: mockState.uploadError,
          };
        }),

        getPublicUrl: vi.fn(() => ({
          data: {
            publicUrl: mockState.publicUrl,
          },
        })),
      })),
    },

    from: vi.fn((tableName) => {
      return createQueryBuilder(tableName, mockState);
    }),
  };
}

async function importMenuCreationFile(mockSupabase = createMockSupabase()) {
  vi.resetModules();

  globalThis.__mockSupabase = mockSupabase;

  const loadHandlers = [];

  vi.spyOn(window, "addEventListener").mockImplementation((event, handler) => {
    if (event === "load") {
      loadHandlers.push(handler);
    }
  });

  const menuModule = await import("../vendor/menuCreation.js");

  return {
    ...menuModule,

    async __runLoad() {
      const handler = loadHandlers.at(-1);

      if (!handler) {
        throw new Error("No window load handler was registered.");
      }

      await handler();
      await flushPromises();
    },
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  setupDom();

  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      return new Response(
        JSON.stringify({
          ok: true,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    })
  );
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

describe("vendor menu creation field errors", () => {
  test("showFieldError adds an error class and displays a message", async () => {
    const menuModule = await importMenuCreationFile();

    menuModule.showFieldError("item-name", "Item name is required.");

    const input = document.getElementById("item-name");
    const hint = document.querySelector(".field-hint-error-dynamic");

    expect(input.classList.contains("field-error")).toBe(true);
    expect(hint.textContent).toBe("Item name is required.");
  });

  test("showFieldError replaces an old error message with the new one", async () => {
    const menuModule = await importMenuCreationFile();

    menuModule.showFieldError("item-name", "Old message.");
    menuModule.showFieldError("item-name", "New message.");

    const hints = document.querySelectorAll(".field-hint-error-dynamic");

    expect(hints).toHaveLength(1);
    expect(hints[0].textContent).toBe("New message.");
  });

  test("clearFieldError removes the error class and dynamic message", async () => {
    const menuModule = await importMenuCreationFile();

    menuModule.showFieldError("item-name", "Item name is required.");
    menuModule.clearFieldError("item-name");

    const input = document.getElementById("item-name");
    const hint = document.querySelector(".field-hint-error-dynamic");

    expect(input.classList.contains("field-error")).toBe(false);
    expect(hint).toBe(null);
  });

  test("clearAllErrors removes all field errors and hides dietary error", async () => {
    const menuModule = await importMenuCreationFile();

    menuModule.showFieldError("item-name", "Item name is required.");
    menuModule.showFieldError("item-price", "Please enter a price.");
    menuModule.showDietaryError("Please select at least one dietary tag.");

    menuModule.clearAllErrors();

    expect(document.querySelectorAll(".field-error")).toHaveLength(0);
    expect(document.querySelectorAll(".field-hint-error-dynamic")).toHaveLength(
      0
    );

    expect(document.getElementById("dietary-error").style.display).toBe("none");
  });
});

describe("vendor menu creation dietary error display", () => {
  test("showDietaryError displays the dietary error message", async () => {
    const menuModule = await importMenuCreationFile();

    menuModule.showDietaryError("Please select at least one dietary tag.");

    const dietaryError = document.getElementById("dietary-error");

    expect(dietaryError.textContent).toBe(
      "Please select at least one dietary tag."
    );

    expect(dietaryError.style.display).toBe("block");
  });

  test("hideDietaryError hides the dietary error message", async () => {
    const menuModule = await importMenuCreationFile();

    menuModule.showDietaryError("Please select at least one dietary tag.");
    menuModule.hideDietaryError();

    expect(document.getElementById("dietary-error").style.display).toBe("none");
  });
});

describe("vendor menu creation form messages", () => {
  test("showFormMessage displays an error message", async () => {
    const menuModule = await importMenuCreationFile();

    menuModule.showFormMessage("Something went wrong.", "error");

    const message = document.getElementById("form-message");

    expect(message.textContent).toBe("Something went wrong.");
    expect(message.className).toBe("form-message form-message--error");
    expect(message.style.display).toBe("block");
  });

  test("showFormMessage displays an info message by default", async () => {
    const menuModule = await importMenuCreationFile();

    menuModule.showFormMessage("Loading menu items.");

    const message = document.getElementById("form-message");

    expect(message.textContent).toBe("Loading menu items.");
    expect(message.className).toBe("form-message form-message--info");
    expect(message.style.display).toBe("block");
  });

  test("clearFormMessage hides the form message", async () => {
    const menuModule = await importMenuCreationFile();

    menuModule.showFormMessage("Saved.", "success");
    menuModule.clearFormMessage();

    expect(document.getElementById("form-message").style.display).toBe("none");
  });

  test("success form message hides automatically after 4 seconds", async () => {
    const menuModule = await importMenuCreationFile();

    menuModule.showFormMessage("Item added successfully!", "success");

    const message = document.getElementById("form-message");

    expect(message.style.display).toBe("block");

    vi.advanceTimersByTime(4000);

    expect(message.style.display).toBe("none");
  });
});

describe("vendor menu creation image preview", () => {
  test("resetImagePreview removes preview image and resets text", async () => {
    const menuModule = await importMenuCreationFile();

    const dropLabel = document.querySelector(".file-drop");

    const img = document.createElement("img");
    img.className = "img-preview";
    img.src = "old-image.png";
    dropLabel.prepend(img);

    dropLabel.querySelector("span").textContent = "old-image.png";

    menuModule.resetImagePreview();

    expect(dropLabel.querySelector(".img-preview")).toBe(null);
    expect(dropLabel.querySelector("span").textContent).toBe(
      "Click to upload image"
    );
  });

  test("setupImagePreview shows field error for a non-image file", async () => {
    const menuModule = await importMenuCreationFile();

    const fileInput = document.getElementById("item-image");
    const file = new File(["hello"], "notes.txt", {
      type: "text/plain",
    });

    Object.defineProperty(fileInput, "files", {
      value: [file],
      configurable: true,
    });

    menuModule.setupImagePreview();

    fileInput.dispatchEvent(new Event("change"));

    expect(fileInput.classList.contains("field-error")).toBe(true);

    expect(document.querySelector(".field-hint-error-dynamic").textContent).toBe(
      "Please select a valid image file."
    );
  });

  test("setupImagePreview creates an image preview for a valid image file", async () => {
    class MockFileReader {
      readAsDataURL() {
        this.onload({
          target: {
            result: "data:image/png;base64,test",
          },
        });
      }
    }

    vi.stubGlobal("FileReader", MockFileReader);

    const menuModule = await importMenuCreationFile();

    const fileInput = document.getElementById("item-image");
    const file = new File(["fake image"], "burger.png", {
      type: "image/png",
    });

    Object.defineProperty(fileInput, "files", {
      value: [file],
      configurable: true,
    });

    menuModule.setupImagePreview();

    fileInput.dispatchEvent(new Event("change"));

    const preview = document.querySelector(".img-preview");
    const labelText = document.querySelector(".file-drop span").textContent;

    expect(preview).not.toBe(null);
    expect(preview.src).toContain("data:image/png;base64,test");
    expect(labelText).toBe("burger.png");
  });
});

describe("vendor menu creation auth checks", () => {
  test("getApprovedVendorAuth returns error when no user is logged in", async () => {
    const mockSupabase = createMockSupabase({
      user: null,
    });

    const menuModule = await importMenuCreationFile(mockSupabase);

    const result = await menuModule.getApprovedVendorAuth();

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

    const menuModule = await importMenuCreationFile(mockSupabase);

    const result = await menuModule.getApprovedVendorAuth();

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

    const menuModule = await importMenuCreationFile(mockSupabase);

    const result = await menuModule.getApprovedVendorAuth();

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

    const menuModule = await importMenuCreationFile(mockSupabase);

    const result = await menuModule.getApprovedVendorAuth();

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

    const menuModule = await importMenuCreationFile(mockSupabase);

    const result = await menuModule.getApprovedVendorAuth();

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

    const menuModule = await importMenuCreationFile(mockSupabase);

    const result = await menuModule.getApprovedVendorAuth();

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

    const menuModule = await importMenuCreationFile(mockSupabase);

    const result = await menuModule.getApprovedVendorAuth();

    expect(result).toEqual({
      ok: false,
      message: "Unknown vendor status.",
    });

    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
  });

  test("getApprovedVendorAuth returns success for approved vendor", async () => {
    const mockSupabase = createMockSupabase();

    const menuModule = await importMenuCreationFile(mockSupabase);

    const result = await menuModule.getApprovedVendorAuth();

    expect(result.ok).toBe(true);
    expect(result.user.id).toBe("user-1");
    expect(result.vendor.id).toBe("vendor-1");
  });
});

describe("vendor menu creation utility functions", () => {
  test("escapeHtml escapes unsafe HTML", async () => {
    const menuModule = await importMenuCreationFile();

    expect(menuModule.escapeHtml("<script>bad</script>")).toBe(
      "&lt;script&gt;bad&lt;/script&gt;"
    );

    expect(menuModule.escapeHtml("Fish & Chips")).toBe("Fish &amp; Chips");
    expect(menuModule.escapeHtml('"quoted"')).toBe("&quot;quoted&quot;");
    expect(menuModule.escapeHtml("it's nice")).toBe("it&#039;s nice");
  });

  test("formatDietaryTag formats dietary tags for display", async () => {
    const menuModule = await importMenuCreationFile();

    expect(menuModule.formatDietaryTag("nut_free")).toBe("Nut-Free");
    expect(menuModule.formatDietaryTag("gluten_free")).toBe("Gluten-Free");
    expect(menuModule.formatDietaryTag("dairy_free")).toBe("Dairy-Free");
    expect(menuModule.formatDietaryTag("halal")).toBe("Halal");
  });
});

describe("vendor menu creation page load and menu rendering", () => {
  test("page load shows auth error message when vendor auth fails", async () => {
    setupFullMenuDom();

    const mockSupabase = createMockSupabase({
      user: null,
    });

    const menuModule = await importMenuCreationFile(mockSupabase);

    await menuModule.__runLoad();

    const message = document.getElementById("form-message");

    expect(message.textContent).toBe("Please log in first.");
    expect(message.className).toBe("form-message form-message--error");
  });

  test("page load shows empty message when vendor has no menu items", async () => {
    setupFullMenuDom();

    const mockSupabase = createMockSupabase({
      menuItems: [],
    });

    const menuModule = await importMenuCreationFile(mockSupabase);

    await menuModule.__runLoad();

    expect(document.getElementById("menu-items-container").innerHTML).toContain(
      "No menu items yet"
    );
  });

  test("page load shows database error when menu items cannot be loaded", async () => {
    setupFullMenuDom();

    const mockSupabase = createMockSupabase({
      menuItems: null,
      menuItemsError: {
        message: "Database error",
      },
    });

    const menuModule = await importMenuCreationFile(mockSupabase);

    await menuModule.__runLoad();

    expect(document.getElementById("menu-items-container").innerHTML).toContain(
      "Failed to load menu items: Database error"
    );
  });

  test("page load renders available and sold out menu item cards", async () => {
    setupFullMenuDom();

    const mockSupabase = createMockSupabase({
      menuItems: [
        {
          id: "item-1",
          name: "Burger",
          description: "Beef burger",
          price: 50,
          image_url: "https://example.com/burger.png",
          is_available: true,
          dietary_tags: ["halal", "gluten_free"],
        },
        {
          id: "item-2",
          name: "Wrap",
          description: "",
          price: 35,
          image_url: "",
          is_available: false,
          dietary_tags: [],
        },
      ],
    });

    const menuModule = await importMenuCreationFile(mockSupabase);

    await menuModule.__runLoad();

    const container = document.getElementById("menu-items-container");

    expect(container.querySelectorAll(".menu-item-card")).toHaveLength(2);
    expect(container.textContent).toContain("Burger");
    expect(container.textContent).toContain("Beef burger");
    expect(container.textContent).toContain("R 50.00");
    expect(container.textContent).toContain("Available");
    expect(container.textContent).toContain("Halal");
    expect(container.textContent).toContain("Gluten-Free");
    expect(container.textContent).toContain("Wrap");
    expect(container.textContent).toContain("Sold Out");
    expect(container.textContent).toContain("No description.");
    expect(container.textContent).toContain("None");
  });
});

describe("vendor menu creation delete and edit behaviour", () => {
  test("delete button opens confirmation and cancel removes it", async () => {
    setupFullMenuDom();

    const mockSupabase = createMockSupabase({
      menuItems: [
        {
          id: "item-1",
          name: "Burger",
          description: "Beef burger",
          price: 50,
          image_url: "",
          is_available: true,
          dietary_tags: ["halal"],
        },
      ],
    });

    const menuModule = await importMenuCreationFile(mockSupabase);

    await menuModule.__runLoad();

    document.querySelector(".delete-btn").click();

    const confirmBar = document.querySelector(".delete-confirm");

    expect(confirmBar).not.toBe(null);
    expect(confirmBar.textContent).toContain('Delete "Burger"?');

    confirmBar.querySelector(".confirm-no").click();

    expect(document.querySelector(".delete-confirm")).toBe(null);
  });

  test("confirm delete calls Supabase delete for the selected item", async () => {
    setupFullMenuDom();

    const mockSupabase = createMockSupabase({
      menuItems: [
        {
          id: "item-1",
          name: "Burger",
          description: "Beef burger",
          price: 50,
          image_url: "",
          is_available: true,
          dietary_tags: ["halal"],
        },
      ],
    });

    const menuModule = await importMenuCreationFile(mockSupabase);

    await menuModule.__runLoad();

    document.querySelector(".delete-btn").click();
    document.querySelector(".confirm-yes").click();

    await flushPromises();

    expect(mockSupabase.__state.deletedRows).toHaveLength(1);
    expect(mockSupabase.__state.deletedRows[0].tableName).toBe("menu_items");
    expect(mockSupabase.__state.deletedRows[0].filters).toEqual([
      {
        column: "id",
        value: "item-1",
      },
      {
        column: "vendor_id",
        value: "vendor-1",
      },
    ]);
  });

  test("edit button fills the form and cancel edit resets the form state", async () => {
    setupFullMenuDom();

    const mockSupabase = createMockSupabase({
      menuItems: [
        {
          id: "item-1",
          name: "Burger",
          description: "Beef burger",
          price: 50,
          image_url: "https://example.com/burger.png",
          is_available: false,
          dietary_tags: ["halal", "kosher"],
        },
      ],
    });

    const menuModule = await importMenuCreationFile(mockSupabase);

    await menuModule.__runLoad();

    document.querySelector(".edit-btn").click();

    expect(document.getElementById("item-name").value).toBe("Burger");
    expect(document.getElementById("item-description").value).toBe(
      "Beef burger"
    );
    expect(document.getElementById("item-price").value).toBe("50");
    expect(document.getElementById("item-availability").value).toBe("false");
    expect(document.querySelector('.dietary-tag[value="halal"]').checked).toBe(
      true
    );
    expect(document.getElementById("other-checkbox").checked).toBe(true);
    expect(document.getElementById("other-input-wrap").style.display).toBe(
      "block"
    );
    expect(document.getElementById("other-input").value).toBe("kosher");
    expect(document.getElementById("form-card-title").textContent).toBe(
      "Edit Menu Item"
    );
    expect(document.getElementById("submit-btn").innerHTML).toContain(
      "Save Changes"
    );

    document.getElementById("cancel-edit-btn").click();

    expect(document.getElementById("cancel-edit-btn").style.display).toBe(
      "none"
    );
    expect(document.getElementById("form-card-title").textContent).toBe(
      "Add Menu Item"
    );
    expect(document.getElementById("submit-btn").innerHTML).toContain(
      "Add Item"
    );
  });
});

describe("vendor menu creation form submission", () => {
  test("submitting an empty form shows field and dietary validation errors", async () => {
    setupFullMenuDom();

    const mockSupabase = createMockSupabase({
      menuItems: [],
    });

    const menuModule = await importMenuCreationFile(mockSupabase);

    await menuModule.__runLoad();
    await submitMenuForm();

    expect(document.getElementById("item-name").classList.contains("field-error")).toBe(
      true
    );
    expect(
      document.getElementById("item-description").classList.contains("field-error")
    ).toBe(true);
    expect(document.getElementById("item-price").classList.contains("field-error")).toBe(
      true
    );
    expect(document.getElementById("dietary-error").textContent).toBe(
      "Please select at least one dietary tag."
    );
    expect(document.getElementById("dietary-error").style.display).toBe(
      "block"
    );
  });

  test("submitting Other with empty custom tag shows dietary error", async () => {
    setupFullMenuDom();

    const mockSupabase = createMockSupabase({
      menuItems: [],
    });

    const menuModule = await importMenuCreationFile(mockSupabase);

    await menuModule.__runLoad();

    document.getElementById("item-name").value = "Burger";
    document.getElementById("item-description").value = "Beef burger";
    document.getElementById("item-price").value = "50";
    document.getElementById("item-availability").value = "true";
    document.getElementById("other-checkbox").checked = true;
    document.getElementById("other-input").value = "";

    await submitMenuForm();

    expect(document.getElementById("dietary-error").textContent).toBe(
      "Please enter a custom dietary tag, or uncheck 'Other'."
    );
    expect(mockSupabase.__state.insertedRows).toHaveLength(0);
  });

  test("successful submit inserts a new menu item and calls dietary API", async () => {
    setupFullMenuDom();

    const mockSupabase = createMockSupabase({
      menuItems: [],
    });

    const menuModule = await importMenuCreationFile(mockSupabase);

    await menuModule.__runLoad();

    document.getElementById("item-name").value = "Burger";
    document.getElementById("item-description").value = "Beef burger";
    document.getElementById("item-price").value = "50";
    document.getElementById("item-availability").value = "true";
    document.querySelector('.dietary-tag[value="halal"]').checked = true;

    await submitMenuForm();

    expect(mockSupabase.__state.insertedRows).toHaveLength(1);
    expect(mockSupabase.__state.insertedRows[0]).toEqual({
      tableName: "menu_items",
      rows: [
        {
          vendor_id: "vendor-1",
          name: "Burger",
          description: "Beef burger",
          price: 50,
          is_available: true,
          image_url: null,
          dietary_tags: ["halal"],
        },
      ],
    });

    expect(fetch).toHaveBeenCalledWith("http://localhost:3000/api/dietary-tags", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        item_name: "Burger",
        tags: ["halal"],
      }),
    });

    expect(document.getElementById("form-message").textContent).toBe(
      "Item added successfully!"
    );
  });

  test("image upload failure shows form error and does not insert item", async () => {
    setupFullMenuDom();

    const mockSupabase = createMockSupabase({
      menuItems: [],
      uploadError: {
        message: "Upload failed",
      },
    });

    const menuModule = await importMenuCreationFile(mockSupabase);

    await menuModule.__runLoad();

    const fileInput = document.getElementById("item-image");
    const imageFile = new File(["fake image"], "burger.png", {
      type: "image/png",
    });

    Object.defineProperty(fileInput, "files", {
      value: [imageFile],
      configurable: true,
    });

    document.getElementById("item-name").value = "Burger";
    document.getElementById("item-description").value = "Beef burger";
    document.getElementById("item-price").value = "50";
    document.getElementById("item-availability").value = "true";
    document.querySelector('.dietary-tag[value="halal"]').checked = true;

    await submitMenuForm();

    expect(mockSupabase.__state.uploads).toHaveLength(1);
    expect(mockSupabase.__state.insertedRows).toHaveLength(0);
    expect(document.getElementById("form-message").textContent).toBe(
      "Image upload failed: Upload failed"
    );
  });

  test("editing an existing item updates the menu item with selected and custom tags", async () => {
    setupFullMenuDom();

    const mockSupabase = createMockSupabase({
      menuItems: [
        {
          id: "item-1",
          name: "Burger",
          description: "Beef burger",
          price: 50,
          image_url: "",
          is_available: true,
          dietary_tags: ["halal", "kosher"],
        },
      ],
    });

    const menuModule = await importMenuCreationFile(mockSupabase);

    await menuModule.__runLoad();

    document.querySelector(".edit-btn").click();

    document.getElementById("item-name").value = "Updated Burger";
    document.getElementById("item-description").value = "Updated description";
    document.getElementById("item-price").value = "65";
    document.getElementById("item-availability").value = "false";
    document.getElementById("other-input").value = "kosher, low_sugar";

    await submitMenuForm();

    expect(mockSupabase.__state.updatedRows).toHaveLength(1);
    expect(mockSupabase.__state.updatedRows[0].tableName).toBe("menu_items");
    expect(mockSupabase.__state.updatedRows[0].filters).toEqual([
      {
        column: "id",
        value: "item-1",
      },
      {
        column: "vendor_id",
        value: "vendor-1",
      },
    ]);

    expect(mockSupabase.__state.updatedRows[0].data).toMatchObject({
      name: "Updated Burger",
      description: "Updated description",
      price: 65,
      is_available: false,
      dietary_tags: ["halal", "kosher", "low_sugar"],
    });

    expect(document.getElementById("form-message").textContent).toBe(
      "Item updated successfully."
    );
  });
});