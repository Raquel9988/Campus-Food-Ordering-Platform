import { describe, test, expect, vi, beforeEach } from "vitest";

import {
  sendLoginLink,
  handleAuthenticatedLogin,
} from "../auth/login.js";

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
      origin: "https://campus-food-ordering.pages.dev",
      href: "",
    },
  };
}

function createSupabaseMock({
  user = { id: "user-1" },
  userError = null,
  appUser = null,
  roleError = null,
  vendor = null,
  vendorError = null,
  admin = null,
  adminError = null,
  signInError = null,
} = {}) {
  const supabaseClient = {
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
              error: roleError,
            };
          }

          if (tableName === "vendors") {
            return {
              data: vendor,
              error: vendorError,
            };
          }

          if (tableName === "admins") {
            return {
              data: admin,
              error: adminError,
            };
          }

          return {
            data: null,
            error: new Error("Unknown table"),
          };
        }),
      };

      return query;
    }),
  };

  return supabaseClient;
}

describe("actual login page logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("does not send login link when email is empty", async () => {
    const message = createMessageElement();
    const browserWindow = createBrowserWindow();
    const supabaseClient = createSupabaseMock();

    await sendLoginLink({
      supabaseClient,
      email: "",
      messageElement: message,
      browserWindow,
    });

    expect(message.style.color).toBe("red");
    expect(message.textContent).toBe("Please enter your email.");
    expect(supabaseClient.auth.signInWithOtp).not.toHaveBeenCalled();
  });

  test("cleans email before sending login link", async () => {
    const message = createMessageElement();
    const browserWindow = createBrowserWindow();
    const supabaseClient = createSupabaseMock();

    await sendLoginLink({
      supabaseClient,
      email: " STUDENT@TEST.COM ",
      messageElement: message,
      browserWindow,
    });

    expect(supabaseClient.auth.signInWithOtp).toHaveBeenCalledWith({
      email: "student@test.com",
      options: {
        shouldCreateUser: false,
        emailRedirectTo:
          "https://campus-food-ordering.pages.dev/auth/login.html",
      },
    });

    expect(message.style.color).toBe("green");
    expect(message.textContent).toBe("Login link sent. Check your email.");
  });

  test("shows error message when Supabase cannot send login link", async () => {
    const message = createMessageElement();
    const browserWindow = createBrowserWindow();

    const supabaseClient = createSupabaseMock({
      signInError: {
        message: "Email not registered",
      },
    });

    await sendLoginLink({
      supabaseClient,
      email: "student@test.com",
      messageElement: message,
      browserWindow,
    });

    expect(message.style.color).toBe("red");
    expect(message.textContent).toBe("Email not registered");
  });

  test("does nothing when there is no authenticated user", async () => {
    const message = createMessageElement();
    const browserWindow = createBrowserWindow();

    const supabaseClient = createSupabaseMock({
      user: null,
    });

    await handleAuthenticatedLogin({
      supabaseClient,
      messageElement: message,
      browserWindow,
    });

    expect(message.style.color).toBe("");
    expect(message.textContent).toBe("");
    expect(browserWindow.location.href).toBe("");
  });

  test("does nothing when Supabase getUser returns an error", async () => {
    const message = createMessageElement();
    const browserWindow = createBrowserWindow();

    const supabaseClient = createSupabaseMock({
      userError: {
        message: "Session error",
      },
    });

    await handleAuthenticatedLogin({
      supabaseClient,
      messageElement: message,
      browserWindow,
    });

    expect(message.textContent).toBe("");
    expect(browserWindow.location.href).toBe("");
  });

  test("shows error when user role is not found", async () => {
    const message = createMessageElement();
    const browserWindow = createBrowserWindow();

    const supabaseClient = createSupabaseMock({
      appUser: null,
      roleError: {
        message: "No user role",
      },
    });

    await handleAuthenticatedLogin({
      supabaseClient,
      messageElement: message,
      browserWindow,
    });

    expect(message.style.color).toBe("red");
    expect(message.textContent).toBe("User role not found.");
  });

  test("redirects student to student dashboard", async () => {
    const message = createMessageElement();
    const browserWindow = createBrowserWindow();

    const supabaseClient = createSupabaseMock({
      appUser: {
        id: "user-1",
        role: "student",
      },
    });

    await handleAuthenticatedLogin({
      supabaseClient,
      messageElement: message,
      browserWindow,
    });

    expect(browserWindow.location.href).toBe(
      "../student/student-dashboard.html"
    );
  });

  test("shows error when vendor profile is missing", async () => {
    const message = createMessageElement();
    const browserWindow = createBrowserWindow();

    const supabaseClient = createSupabaseMock({
      appUser: {
        id: "user-1",
        role: "vendor",
      },
      vendor: null,
      vendorError: {
        message: "Vendor missing",
      },
    });

    await handleAuthenticatedLogin({
      supabaseClient,
      messageElement: message,
      browserWindow,
    });

    expect(message.style.color).toBe("red");
    expect(message.textContent).toBe("Vendor profile not found.");
  });

  test("redirects approved vendor to vendor dashboard", async () => {
    const message = createMessageElement();
    const browserWindow = createBrowserWindow();

    const supabaseClient = createSupabaseMock({
      appUser: {
        id: "user-1",
        role: "vendor",
      },
      vendor: {
        status: "approved",
      },
    });

    await handleAuthenticatedLogin({
      supabaseClient,
      messageElement: message,
      browserWindow,
    });

    expect(browserWindow.location.href).toBe(
      "../vendor/vendor-dashboard.html"
    );
  });

  test("blocks pending vendor and signs out", async () => {
    const message = createMessageElement();
    const browserWindow = createBrowserWindow();

    const supabaseClient = createSupabaseMock({
      appUser: {
        id: "user-1",
        role: "vendor",
      },
      vendor: {
        status: "pending",
      },
    });

    await handleAuthenticatedLogin({
      supabaseClient,
      messageElement: message,
      browserWindow,
    });

    expect(message.style.color).toBe("orange");
    expect(message.textContent).toBe(
      "Your vendor account is waiting for admin approval."
    );
    expect(supabaseClient.auth.signOut).toHaveBeenCalled();
    expect(browserWindow.location.href).toBe("");
  });

  test("blocks suspended vendor and signs out", async () => {
    const message = createMessageElement();
    const browserWindow = createBrowserWindow();

    const supabaseClient = createSupabaseMock({
      appUser: {
        id: "user-1",
        role: "vendor",
      },
      vendor: {
        status: "suspended",
      },
    });

    await handleAuthenticatedLogin({
      supabaseClient,
      messageElement: message,
      browserWindow,
    });

    expect(message.style.color).toBe("red");
    expect(message.textContent).toBe("Your vendor account has been suspended.");
    expect(supabaseClient.auth.signOut).toHaveBeenCalled();
  });

  test("handles unknown vendor status and signs out", async () => {
    const message = createMessageElement();
    const browserWindow = createBrowserWindow();

    const supabaseClient = createSupabaseMock({
      appUser: {
        id: "user-1",
        role: "vendor",
      },
      vendor: {
        status: "unknown-status",
      },
    });

    await handleAuthenticatedLogin({
      supabaseClient,
      messageElement: message,
      browserWindow,
    });

    expect(message.style.color).toBe("red");
    expect(message.textContent).toBe("Unknown vendor status.");
    expect(supabaseClient.auth.signOut).toHaveBeenCalled();
  });

  test("shows error when admin profile is missing", async () => {
    const message = createMessageElement();
    const browserWindow = createBrowserWindow();

    const supabaseClient = createSupabaseMock({
      appUser: {
        id: "user-1",
        role: "admin",
      },
      admin: null,
      adminError: {
        message: "Admin missing",
      },
    });

    await handleAuthenticatedLogin({
      supabaseClient,
      messageElement: message,
      browserWindow,
    });

    expect(message.style.color).toBe("red");
    expect(message.textContent).toBe("Admin profile not found.");
  });

  test("redirects approved admin to admin controls page", async () => {
    const message = createMessageElement();
    const browserWindow = createBrowserWindow();

    const supabaseClient = createSupabaseMock({
      appUser: {
        id: "user-1",
        role: "admin",
      },
      admin: {
        status: "approved",
        is_master: false,
      },
    });

    await handleAuthenticatedLogin({
      supabaseClient,
      messageElement: message,
      browserWindow,
    });

    expect(browserWindow.location.href).toBe(
      "../adminControls/admin-controls.html"
    );
  });

  test("redirects master admin even when status is pending", async () => {
    const message = createMessageElement();
    const browserWindow = createBrowserWindow();

    const supabaseClient = createSupabaseMock({
      appUser: {
        id: "user-1",
        role: "admin",
      },
      admin: {
        status: "pending",
        is_master: true,
      },
    });

    await handleAuthenticatedLogin({
      supabaseClient,
      messageElement: message,
      browserWindow,
    });

    expect(browserWindow.location.href).toBe(
      "../adminControls/admin-controls.html"
    );
  });

  test("blocks pending admin and signs out", async () => {
    const message = createMessageElement();
    const browserWindow = createBrowserWindow();

    const supabaseClient = createSupabaseMock({
      appUser: {
        id: "user-1",
        role: "admin",
      },
      admin: {
        status: "pending",
        is_master: false,
      },
    });

    await handleAuthenticatedLogin({
      supabaseClient,
      messageElement: message,
      browserWindow,
    });

    expect(message.style.color).toBe("orange");
    expect(message.textContent).toBe(
      "Your admin account is waiting for master admin approval."
    );
    expect(supabaseClient.auth.signOut).toHaveBeenCalled();
  });

  test("blocks suspended admin and signs out", async () => {
    const message = createMessageElement();
    const browserWindow = createBrowserWindow();

    const supabaseClient = createSupabaseMock({
      appUser: {
        id: "user-1",
        role: "admin",
      },
      admin: {
        status: "suspended",
        is_master: false,
      },
    });

    await handleAuthenticatedLogin({
      supabaseClient,
      messageElement: message,
      browserWindow,
    });

    expect(message.style.color).toBe("red");
    expect(message.textContent).toBe("Your admin account has been suspended.");
    expect(supabaseClient.auth.signOut).toHaveBeenCalled();
  });

  test("blocks admin with unknown status and signs out", async () => {
    const message = createMessageElement();
    const browserWindow = createBrowserWindow();

    const supabaseClient = createSupabaseMock({
      appUser: {
        id: "user-1",
        role: "admin",
      },
      admin: {
        status: "unknown-status",
        is_master: false,
      },
    });

    await handleAuthenticatedLogin({
      supabaseClient,
      messageElement: message,
      browserWindow,
    });

    expect(message.style.color).toBe("red");
    expect(message.textContent).toBe("Admin access denied.");
    expect(supabaseClient.auth.signOut).toHaveBeenCalled();
  });

  test("handles unknown user role and signs out", async () => {
    const message = createMessageElement();
    const browserWindow = createBrowserWindow();

    const supabaseClient = createSupabaseMock({
      appUser: {
        id: "user-1",
        role: "unknown-role",
      },
    });

    await handleAuthenticatedLogin({
      supabaseClient,
      messageElement: message,
      browserWindow,
    });

    expect(message.style.color).toBe("red");
    expect(message.textContent).toBe("Unknown user role.");
    expect(supabaseClient.auth.signOut).toHaveBeenCalled();
  });
});