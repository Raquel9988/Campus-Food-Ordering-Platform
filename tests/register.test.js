import { describe, test, expect, vi, beforeEach } from "vitest";

import {
  REGISTRATION_KEY,
  updateBusinessNameVisibility,
  sendRegistrationLink,
  completeRegistrationIfAuthenticated,
} from "../auth/register.js";

function createMessageElement() {
  return {
    style: {
      color: "",
    },
    textContent: "",
  };
}

function createBrowserWindow() {
  return {
    location: {
      href: "https://campus-food-ordering.pages.dev/auth/register.html",
    },
  };
}

function createLocalStorageMock(initialValues = {}) {
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

function createSupabaseMock({
  user = {
    id: "user-1",
    email: "student@test.com",
  },
  userError = null,
  signInError = null,

  existingUser = null,
  existingUserError = null,
  userInsertError = null,

  existingVendor = null,
  vendorCheckError = null,
  vendorInsertError = null,

  existingAdmin = null,
  adminCheckError = null,
  adminInsertError = null,
} = {}) {
  const insertCalls = [];

  const supabaseClient = {
    insertCalls,

    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user,
        },
        error: userError,
      }),

      signInWithOtp: vi.fn().mockResolvedValue({
        error: signInError,
      }),
    },

    from: vi.fn((tableName) => {
      const query = {
        select: vi.fn(() => query),
        eq: vi.fn(() => query),

        maybeSingle: vi.fn(async () => {
          if (tableName === "users") {
            return {
              data: existingUser,
              error: existingUserError,
            };
          }

          if (tableName === "vendors") {
            return {
              data: existingVendor,
              error: vendorCheckError,
            };
          }

          if (tableName === "admins") {
            return {
              data: existingAdmin,
              error: adminCheckError,
            };
          }

          return {
            data: null,
            error: new Error("Unknown table"),
          };
        }),

        insert: vi.fn(async (rows) => {
          insertCalls.push({
            tableName,
            rows,
          });

          if (tableName === "users") {
            return {
              error: userInsertError,
            };
          }

          if (tableName === "vendors") {
            return {
              error: vendorInsertError,
            };
          }

          if (tableName === "admins") {
            return {
              error: adminInsertError,
            };
          }

          return {
            error: null,
          };
        }),
      };

      return query;
    }),
  };

  return supabaseClient;
}

describe("actual register page logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("shows business name field when role is vendor", () => {
    const businessNameGroup = {
      style: {
        display: "none",
      },
    };

    const businessNameInput = {
      required: false,
      value: "",
    };

    updateBusinessNameVisibility({
      role: "vendor",
      businessNameGroup,
      businessNameInput,
    });

    expect(businessNameGroup.style.display).toBe("block");
    expect(businessNameInput.required).toBe(true);
  });

  test("hides and clears business name field when role is not vendor", () => {
    const businessNameGroup = {
      style: {
        display: "block",
      },
    };

    const businessNameInput = {
      required: true,
      value: "Campus Burgers",
    };

    updateBusinessNameVisibility({
      role: "student",
      businessNameGroup,
      businessNameInput,
    });

    expect(businessNameGroup.style.display).toBe("none");
    expect(businessNameInput.required).toBe(false);
    expect(businessNameInput.value).toBe("");
  });

  test("does not send registration link when email is missing", async () => {
    const message = createMessageElement();
    const browserWindow = createBrowserWindow();
    const localStorageRef = createLocalStorageMock();
    const supabaseClient = createSupabaseMock();

    await sendRegistrationLink({
      supabaseClient,
      email: "",
      role: "student",
      businessName: "",
      messageElement: message,
      browserWindow,
      localStorageRef,
    });

    expect(message.style.color).toBe("red");
    expect(message.textContent).toBe("Please enter your email.");
    expect(supabaseClient.auth.signInWithOtp).not.toHaveBeenCalled();
    expect(localStorageRef.setItem).not.toHaveBeenCalled();
  });

  test("does not send registration link when role is missing", async () => {
    const message = createMessageElement();
    const browserWindow = createBrowserWindow();
    const localStorageRef = createLocalStorageMock();
    const supabaseClient = createSupabaseMock();

    await sendRegistrationLink({
      supabaseClient,
      email: "student@test.com",
      role: "",
      businessName: "",
      messageElement: message,
      browserWindow,
      localStorageRef,
    });

    expect(message.style.color).toBe("red");
    expect(message.textContent).toBe("Please select a role.");
    expect(supabaseClient.auth.signInWithOtp).not.toHaveBeenCalled();
  });

  test("does not send vendor registration link when business name is missing", async () => {
    const message = createMessageElement();
    const browserWindow = createBrowserWindow();
    const localStorageRef = createLocalStorageMock();
    const supabaseClient = createSupabaseMock();

    await sendRegistrationLink({
      supabaseClient,
      email: "vendor@test.com",
      role: "vendor",
      businessName: "",
      messageElement: message,
      browserWindow,
      localStorageRef,
    });

    expect(message.style.color).toBe("red");
    expect(message.textContent).toBe("Please enter the business name.");
    expect(supabaseClient.auth.signInWithOtp).not.toHaveBeenCalled();
  });

  test("sends student registration link and saves registration data", async () => {
    const message = createMessageElement();
    const browserWindow = createBrowserWindow();
    const localStorageRef = createLocalStorageMock();
    const supabaseClient = createSupabaseMock();

    await sendRegistrationLink({
      supabaseClient,
      email: " STUDENT@TEST.COM ",
      role: "student",
      businessName: "",
      messageElement: message,
      browserWindow,
      localStorageRef,
    });

    expect(localStorageRef.setItem).toHaveBeenCalledWith(
      REGISTRATION_KEY,
      JSON.stringify({
        email: "student@test.com",
        role: "student",
        businessName: "",
      })
    );

    expect(supabaseClient.auth.signInWithOtp).toHaveBeenCalledWith({
      email: "student@test.com",
      options: {
        shouldCreateUser: true,
        emailRedirectTo:
          "https://campus-food-ordering.pages.dev/auth/register.html",
        data: {
          requested_role: "student",
          business_name: null,
        },
      },
    });

    expect(message.style.color).toBe("green");
    expect(message.textContent).toBe(
      "Registration link sent. Check your email to continue."
    );
  });

  test("sends vendor registration link with business name", async () => {
    const message = createMessageElement();
    const browserWindow = createBrowserWindow();
    const localStorageRef = createLocalStorageMock();
    const supabaseClient = createSupabaseMock();

    await sendRegistrationLink({
      supabaseClient,
      email: "vendor@test.com",
      role: "vendor",
      businessName: " Campus Burgers ",
      messageElement: message,
      browserWindow,
      localStorageRef,
    });

    expect(localStorageRef.setItem).toHaveBeenCalledWith(
      REGISTRATION_KEY,
      JSON.stringify({
        email: "vendor@test.com",
        role: "vendor",
        businessName: "Campus Burgers",
      })
    );

    expect(supabaseClient.auth.signInWithOtp).toHaveBeenCalledWith({
      email: "vendor@test.com",
      options: {
        shouldCreateUser: true,
        emailRedirectTo:
          "https://campus-food-ordering.pages.dev/auth/register.html",
        data: {
          requested_role: "vendor",
          business_name: "Campus Burgers",
        },
      },
    });
  });

  test("shows error if Supabase cannot send registration link", async () => {
    const message = createMessageElement();
    const browserWindow = createBrowserWindow();
    const localStorageRef = createLocalStorageMock();

    const supabaseClient = createSupabaseMock({
      signInError: {
        message: "Could not send email",
      },
    });

    await sendRegistrationLink({
      supabaseClient,
      email: "student@test.com",
      role: "student",
      businessName: "",
      messageElement: message,
      browserWindow,
      localStorageRef,
    });

    expect(message.style.color).toBe("red");
    expect(message.textContent).toBe("Could not send email");
  });

  test("does nothing when there is no authenticated user", async () => {
    const message = createMessageElement();
    const browserWindow = createBrowserWindow();
    const localStorageRef = createLocalStorageMock();

    const supabaseClient = createSupabaseMock({
      user: null,
    });

    await completeRegistrationIfAuthenticated({
      supabaseClient,
      messageElement: message,
      browserWindow,
      localStorageRef,
      setTimeoutRef: vi.fn(),
    });

    expect(message.textContent).toBe("");
    expect(browserWindow.location.href).toBe(
      "https://campus-food-ordering.pages.dev/auth/register.html"
    );
  });

  test("removes saved registration when saved JSON is invalid", async () => {
    const message = createMessageElement();
    const browserWindow = createBrowserWindow();

    const localStorageRef = createLocalStorageMock({
      [REGISTRATION_KEY]: "{ invalid json",
    });

    const supabaseClient = createSupabaseMock();

    await completeRegistrationIfAuthenticated({
      supabaseClient,
      messageElement: message,
      browserWindow,
      localStorageRef,
      setTimeoutRef: vi.fn(),
    });

    expect(localStorageRef.removeItem).toHaveBeenCalledWith(REGISTRATION_KEY);
  });

  test("does nothing when saved email does not match authenticated user", async () => {
    const message = createMessageElement();
    const browserWindow = createBrowserWindow();

    const localStorageRef = createLocalStorageMock({
      [REGISTRATION_KEY]: JSON.stringify({
        email: "wrong@test.com",
        role: "student",
        businessName: "",
      }),
    });

    const supabaseClient = createSupabaseMock({
      user: {
        id: "user-1",
        email: "student@test.com",
      },
    });

    await completeRegistrationIfAuthenticated({
      supabaseClient,
      messageElement: message,
      browserWindow,
      localStorageRef,
      setTimeoutRef: vi.fn(),
    });

    expect(message.textContent).toBe("");
    expect(localStorageRef.removeItem).not.toHaveBeenCalled();
  });

  test("shows error when existing user check fails", async () => {
    const message = createMessageElement();
    const browserWindow = createBrowserWindow();

    const localStorageRef = createLocalStorageMock({
      [REGISTRATION_KEY]: JSON.stringify({
        email: "student@test.com",
        role: "student",
        businessName: "",
      }),
    });

    const supabaseClient = createSupabaseMock({
      existingUserError: {
        message: "Database error",
      },
    });

    await completeRegistrationIfAuthenticated({
      supabaseClient,
      messageElement: message,
      browserWindow,
      localStorageRef,
      setTimeoutRef: vi.fn(),
    });

    expect(message.style.color).toBe("red");
    expect(message.textContent).toBe("Could not verify your profile.");
  });

  test("creates student user profile and redirects to student dashboard", async () => {
    const message = createMessageElement();
    const browserWindow = createBrowserWindow();

    const localStorageRef = createLocalStorageMock({
      [REGISTRATION_KEY]: JSON.stringify({
        email: "student@test.com",
        role: "student",
        businessName: "",
      }),
    });

    const setTimeoutRef = vi.fn((callback) => {
      callback();
    });

    const supabaseClient = createSupabaseMock({
      existingUser: null,
    });

    await completeRegistrationIfAuthenticated({
      supabaseClient,
      messageElement: message,
      browserWindow,
      localStorageRef,
      setTimeoutRef,
    });

    expect(supabaseClient.insertCalls).toContainEqual({
      tableName: "users",
      rows: [
        {
          id: "user-1",
          email: "student@test.com",
          role: "student",
        },
      ],
    });

    expect(localStorageRef.removeItem).toHaveBeenCalledWith(REGISTRATION_KEY);
    expect(message.style.color).toBe("green");
    expect(message.textContent).toBe(
      "Registration complete. Redirecting to student dashboard..."
    );
    expect(browserWindow.location.href).toBe(
      "../student/student-dashboard.html"
    );
  });

  test("shows profile creation error when user insert fails", async () => {
    const message = createMessageElement();
    const browserWindow = createBrowserWindow();

    const localStorageRef = createLocalStorageMock({
      [REGISTRATION_KEY]: JSON.stringify({
        email: "student@test.com",
        role: "student",
        businessName: "",
      }),
    });

    const supabaseClient = createSupabaseMock({
      existingUser: null,
      userInsertError: {
        message: "Insert failed",
      },
    });

    await completeRegistrationIfAuthenticated({
      supabaseClient,
      messageElement: message,
      browserWindow,
      localStorageRef,
      setTimeoutRef: vi.fn(),
    });

    expect(message.style.color).toBe("red");
    expect(message.textContent).toBe("Profile creation failed: Insert failed");
  });

  test("creates vendor profile when vendor does not already exist", async () => {
    const message = createMessageElement();
    const browserWindow = createBrowserWindow();

    const localStorageRef = createLocalStorageMock({
      [REGISTRATION_KEY]: JSON.stringify({
        email: "vendor@test.com",
        role: "vendor",
        businessName: "Campus Burgers",
      }),
    });

    const setTimeoutRef = vi.fn((callback) => {
      callback();
    });

    const supabaseClient = createSupabaseMock({
      user: {
        id: "user-2",
        email: "vendor@test.com",
      },
      existingUser: null,
      existingVendor: null,
    });

    await completeRegistrationIfAuthenticated({
      supabaseClient,
      messageElement: message,
      browserWindow,
      localStorageRef,
      setTimeoutRef,
    });

    expect(supabaseClient.insertCalls).toContainEqual({
      tableName: "vendors",
      rows: [
        {
          user_id: "user-2",
          business_name: "Campus Burgers",
          status: "pending",
        },
      ],
    });

    expect(message.style.color).toBe("green");
    expect(message.textContent).toBe(
      "Vendor registration complete. Await admin approval before menu access."
    );
    expect(browserWindow.location.href).toBe("login.html");
  });

  test("shows error when vendor check fails", async () => {
    const message = createMessageElement();
    const browserWindow = createBrowserWindow();

    const localStorageRef = createLocalStorageMock({
      [REGISTRATION_KEY]: JSON.stringify({
        email: "vendor@test.com",
        role: "vendor",
        businessName: "Campus Burgers",
      }),
    });

    const supabaseClient = createSupabaseMock({
      user: {
        id: "user-2",
        email: "vendor@test.com",
      },
      vendorCheckError: {
        message: "Vendor check failed",
      },
    });

    await completeRegistrationIfAuthenticated({
      supabaseClient,
      messageElement: message,
      browserWindow,
      localStorageRef,
      setTimeoutRef: vi.fn(),
    });

    expect(message.style.color).toBe("red");
    expect(message.textContent).toBe("Could not verify vendor profile.");
  });

  test("shows error when vendor insert fails", async () => {
    const message = createMessageElement();
    const browserWindow = createBrowserWindow();

    const localStorageRef = createLocalStorageMock({
      [REGISTRATION_KEY]: JSON.stringify({
        email: "vendor@test.com",
        role: "vendor",
        businessName: "Campus Burgers",
      }),
    });

    const supabaseClient = createSupabaseMock({
      user: {
        id: "user-2",
        email: "vendor@test.com",
      },
      existingVendor: null,
      vendorInsertError: {
        message: "Vendor insert failed",
      },
    });

    await completeRegistrationIfAuthenticated({
      supabaseClient,
      messageElement: message,
      browserWindow,
      localStorageRef,
      setTimeoutRef: vi.fn(),
    });

    expect(message.style.color).toBe("red");
    expect(message.textContent).toBe(
      "Vendor registration failed: Vendor insert failed"
    );
  });

  test("creates admin profile when admin does not already exist", async () => {
    const message = createMessageElement();
    const browserWindow = createBrowserWindow();

    const localStorageRef = createLocalStorageMock({
      [REGISTRATION_KEY]: JSON.stringify({
        email: "admin@test.com",
        role: "admin",
        businessName: "",
      }),
    });

    const setTimeoutRef = vi.fn((callback) => {
      callback();
    });

    const supabaseClient = createSupabaseMock({
      user: {
        id: "user-3",
        email: "admin@test.com",
      },
      existingUser: null,
      existingAdmin: null,
    });

    await completeRegistrationIfAuthenticated({
      supabaseClient,
      messageElement: message,
      browserWindow,
      localStorageRef,
      setTimeoutRef,
    });

    expect(supabaseClient.insertCalls).toContainEqual({
      tableName: "admins",
      rows: [
        {
          user_id: "user-3",
          status: "pending",
          is_master: false,
        },
      ],
    });

    expect(message.style.color).toBe("green");
    expect(message.textContent).toBe(
      "Admin registration complete. Await master admin approval."
    );
    expect(browserWindow.location.href).toBe("login.html");
  });

  test("shows error when admin check fails", async () => {
    const message = createMessageElement();
    const browserWindow = createBrowserWindow();

    const localStorageRef = createLocalStorageMock({
      [REGISTRATION_KEY]: JSON.stringify({
        email: "admin@test.com",
        role: "admin",
        businessName: "",
      }),
    });

    const supabaseClient = createSupabaseMock({
      user: {
        id: "user-3",
        email: "admin@test.com",
      },
      adminCheckError: {
        message: "Admin check failed",
      },
    });

    await completeRegistrationIfAuthenticated({
      supabaseClient,
      messageElement: message,
      browserWindow,
      localStorageRef,
      setTimeoutRef: vi.fn(),
    });

    expect(message.style.color).toBe("red");
    expect(message.textContent).toBe("Could not verify admin profile.");
  });

  test("shows error when admin insert fails", async () => {
    const message = createMessageElement();
    const browserWindow = createBrowserWindow();

    const localStorageRef = createLocalStorageMock({
      [REGISTRATION_KEY]: JSON.stringify({
        email: "admin@test.com",
        role: "admin",
        businessName: "",
      }),
    });

    const supabaseClient = createSupabaseMock({
      user: {
        id: "user-3",
        email: "admin@test.com",
      },
      existingAdmin: null,
      adminInsertError: {
        message: "Admin insert failed",
      },
    });

    await completeRegistrationIfAuthenticated({
      supabaseClient,
      messageElement: message,
      browserWindow,
      localStorageRef,
      setTimeoutRef: vi.fn(),
    });

    expect(message.style.color).toBe("red");
    expect(message.textContent).toBe(
      "Admin registration failed: Admin insert failed"
    );
  });
});