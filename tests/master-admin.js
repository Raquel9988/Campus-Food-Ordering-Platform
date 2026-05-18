import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const MASTER_ADMIN_FILE_PATH = "../adminControls/master-admin.js";

function setupMasterAdminDom() {
  document.body.innerHTML = `
    <main>
      <p id="message"></p>

      <button id="logout-btn">Logout</button>

      <table>
        <tbody id="admin-table-body"></tbody>
      </table>
    </main>
  `;
}

function waitForAsyncCode() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

function makeMasterAdminSupabaseMock({
  authUser = { id: "master-user-1" },
  authError = null,
  appUser = { id: "master-user-1", role: "admin" },
  userError = null,
  masterAdmin = {
    id: "master-admin-1",
    user_id: "master-user-1",
    status: "approved",
    is_master: true,
  },
  masterAdminError = null,
  admins = [
    {
      id: "master-admin-1",
      user_id: "master-user-1",
      status: "approved",
      is_master: true,
      approved_by: null,
      created_at: "2026-05-01T10:00:00.000Z",
      updated_at: "2026-05-02T10:00:00.000Z",
    },
    {
      id: "normal-admin-1",
      user_id: "normal-user-1",
      status: "pending",
      is_master: false,
      approved_by: null,
      created_at: "2026-05-03T10:00:00.000Z",
      updated_at: null,
    },
  ],
  adminsError = null,
  users = [
    {
      id: "master-user-1",
      email: "master@example.com",
    },
    {
      id: "normal-user-1",
      email: "normal@example.com",
    },
  ],
  usersError = null,
  targetAdmin = {
    id: "normal-admin-1",
    is_master: false,
  },
  targetError = null,
  updateError = null,
  signOutError = null,
} = {}) {
  const updates = [];

  const mock = {
    updates,

    auth: {
      getUser: vi.fn(async () => ({
        data: {
          user: authUser,
        },
        error: authError,
      })),

      signOut: vi.fn(async () => ({
        error: signOutError,
      })),
    },

    from: vi.fn((tableName) => {
      const query = {
        tableName,
        selected: "",
        eqColumn: "",
        eqValue: "",

        select(fields) {
          this.selected = fields;
          return this;
        },

        eq(column, value) {
          this.eqColumn = column;
          this.eqValue = value;
          return this;
        },

        in(column, values) {
          if (tableName === "users") {
            const filteredUsers = users.filter(user => values.includes(user.id));

            return Promise.resolve({
              data: filteredUsers,
              error: usersError,
            });
          }

          return Promise.resolve({
            data: [],
            error: null,
          });
        },

        order() {
          if (tableName === "admins") {
            return Promise.resolve({
              data: admins,
              error: adminsError,
            });
          }

          return Promise.resolve({
            data: [],
            error: null,
          });
        },

        single() {
          if (tableName === "users") {
            return Promise.resolve({
              data: appUser,
              error: userError,
            });
          }

          if (tableName === "admins" && this.eqColumn === "user_id") {
            return Promise.resolve({
              data: masterAdmin,
              error: masterAdminError,
            });
          }

          if (tableName === "admins" && this.eqColumn === "id") {
            return Promise.resolve({
              data: targetAdmin,
              error: targetError,
            });
          }

          return Promise.resolve({
            data: null,
            error: null,
          });
        },

        update(updateData) {
          return {
            eq(column, value) {
              updates.push({
                tableName,
                column,
                value,
                updateData,
              });

              return Promise.resolve({
                error: updateError,
              });
            },
          };
        },
      };

      return query;
    }),
  };

  return mock;
}

async function importMasterAdminAndRunDOMContentLoaded() {
  await import(`${MASTER_ADMIN_FILE_PATH}?test=${Date.now()}-${Math.random()}`);

  document.dispatchEvent(new Event("DOMContentLoaded"));

  await waitForAsyncCode();
  await waitForAsyncCode();
  await waitForAsyncCode();
}

describe("master admin page", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    setupMasterAdminDom();

    globalThis.__mockSupabase = makeMasterAdminSupabaseMock();

    vi.spyOn(global, "setTimeout").mockImplementation(() => 1);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();

    delete globalThis.__mockSupabase;

    document.body.innerHTML = "";
  });

  it("allows an approved master admin to load and view admins", async () => {
    await importMasterAdminAndRunDOMContentLoaded();

    const message = document.getElementById("message");
    const adminTableBody = document.getElementById("admin-table-body");

    expect(message.textContent).toBe("");

    expect(adminTableBody.textContent).toContain("master@example.com");
    expect(adminTableBody.textContent).toContain("normal@example.com");
    expect(adminTableBody.textContent).toContain("Protected");
    expect(adminTableBody.textContent).toContain("Approve");
    expect(adminTableBody.textContent).toContain("Suspend");
  });

  it("blocks access when the logged-in user is not a master admin", async () => {
    globalThis.__mockSupabase = makeMasterAdminSupabaseMock({
      masterAdmin: {
        id: "normal-admin-1",
        user_id: "normal-user-1",
        status: "approved",
        is_master: false,
      },
    });

    await importMasterAdminAndRunDOMContentLoaded();

    expect(document.getElementById("message").textContent).toBe(
      "Access denied. Master admin only."
    );

    expect(setTimeout).toHaveBeenCalled();
  });

  it("blocks access when the user is not logged in", async () => {
    globalThis.__mockSupabase = makeMasterAdminSupabaseMock({
      authUser: null,
    });

    await importMasterAdminAndRunDOMContentLoaded();

    expect(document.getElementById("message").textContent).toBe(
      "Please log in first."
    );

    expect(setTimeout).toHaveBeenCalled();
  });

  it("blocks access when the user role is not admin", async () => {
    globalThis.__mockSupabase = makeMasterAdminSupabaseMock({
      appUser: {
        id: "student-user-1",
        role: "student",
      },
    });

    await importMasterAdminAndRunDOMContentLoaded();

    expect(document.getElementById("message").textContent).toBe(
      "Access denied. Admins only."
    );
  });

  it("approves a pending admin and records approved_by", async () => {
    const supabaseMock = makeMasterAdminSupabaseMock();

    globalThis.__mockSupabase = supabaseMock;

    await importMasterAdminAndRunDOMContentLoaded();

    const approveButton = document.querySelector(
      '[data-id="normal-admin-1"][data-action="approve"]'
    );

    expect(approveButton).not.toBeNull();

    approveButton.click();

    await waitForAsyncCode();
    await waitForAsyncCode();
    await waitForAsyncCode();

    expect(supabaseMock.updates).toHaveLength(1);

    expect(supabaseMock.updates[0].value).toBe("normal-admin-1");
    expect(supabaseMock.updates[0].updateData.status).toBe("approved");
    expect(supabaseMock.updates[0].updateData.approved_by).toBe("master-user-1");

    expect(document.getElementById("message").textContent).toBe("");
  });

  it("does not update a protected master admin", async () => {
    const supabaseMock = makeMasterAdminSupabaseMock({
      targetAdmin: {
        id: "master-admin-1",
        is_master: true,
      },
    });

    globalThis.__mockSupabase = supabaseMock;

    await importMasterAdminAndRunDOMContentLoaded();

    const normalAdminButton = document.querySelector(
      '[data-id="normal-admin-1"][data-action="suspend"]'
    );

    normalAdminButton.click();

    await waitForAsyncCode();
    await waitForAsyncCode();
    await waitForAsyncCode();

    expect(supabaseMock.updates).toHaveLength(0);

    expect(document.getElementById("message").textContent).toBe(
      "Master admin cannot be changed here."
    );
  });

  it("shows an error when admins fail to load", async () => {
    globalThis.__mockSupabase = makeMasterAdminSupabaseMock({
      adminsError: {
        message: "Failed to load admins from Supabase",
      },
    });

    await importMasterAdminAndRunDOMContentLoaded();

    expect(document.getElementById("message").textContent).toBe(
      "Failed to load admins from Supabase"
    );

    expect(document.getElementById("admin-table-body").textContent).toContain(
      "Failed to load admins."
    );
  });

  it("signs out and redirects when logout is clicked", async () => {
    const supabaseMock = makeMasterAdminSupabaseMock();

    globalThis.__mockSupabase = supabaseMock;

    await importMasterAdminAndRunDOMContentLoaded();

    document.getElementById("logout-btn").click();

    await waitForAsyncCode();

    expect(supabaseMock.auth.signOut).toHaveBeenCalled();
  });
});