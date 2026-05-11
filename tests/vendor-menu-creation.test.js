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
      this.filters.push({ column, value });
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

async function importMenuCreationFile(mockSupabase = createMockSupabase()) {
  vi.resetModules();

  globalThis.__mockSupabase = mockSupabase;

  return await import("../vendor/menuCreation.js");
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

    globalThis.FileReader = MockFileReader;

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