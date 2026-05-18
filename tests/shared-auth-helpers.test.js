import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../shared-auth-foundation/src/js/supabaseClient.js", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
    from: vi.fn(),
  },
}));

import { supabase } from "../shared-auth-foundation/src/js/supabaseClient.js";

import {
  getCurrentSessionUser,
  getUserRole,
  getVendorProfile,
  createUserProfile,
  createVendorProfile,
} from "../shared-auth-foundation/src/js/authHelpers.js";

function makeSingleQuery(result) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    single: vi.fn(async () => result),
  };

  return query;
}

function makeInsertQuery(result) {
  return {
    insert: vi.fn(async () => result),
  };
}

describe("shared authHelpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the current session user when a session exists", async () => {
    const fakeUser = {
      id: "user-1",
      email: "student@example.com",
    };

    supabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          user: fakeUser,
        },
      },
      error: null,
    });

    const user = await getCurrentSessionUser();

    expect(user).toEqual(fakeUser);
    expect(supabase.auth.getSession).toHaveBeenCalledTimes(1);
  });

  it("returns null when there is no active session", async () => {
    supabase.auth.getSession.mockResolvedValue({
      data: {
        session: null,
      },
      error: null,
    });

    const user = await getCurrentSessionUser();

    expect(user).toBeNull();
  });

  it("returns null when Supabase returns a session error", async () => {
    supabase.auth.getSession.mockResolvedValue({
      data: {
        session: null,
      },
      error: {
        message: "Session error",
      },
    });

    const user = await getCurrentSessionUser();

    expect(user).toBeNull();
  });

  it("fetches and returns the user role", async () => {
    const query = makeSingleQuery({
      data: {
        role: "admin",
      },
      error: null,
    });

    supabase.from.mockReturnValue(query);

    const role = await getUserRole("user-1");

    expect(role).toBe("admin");
    expect(supabase.from).toHaveBeenCalledWith("users");
    expect(query.select).toHaveBeenCalledWith("role");
    expect(query.eq).toHaveBeenCalledWith("id", "user-1");
    expect(query.single).toHaveBeenCalledTimes(1);
  });

  it("throws an error when the user role cannot be fetched", async () => {
    const query = makeSingleQuery({
      data: null,
      error: {
        message: "Database error",
      },
    });

    supabase.from.mockReturnValue(query);

    await expect(getUserRole("user-1")).rejects.toThrow(
      "Error fetching user role"
    );
  });

  it("fetches and returns the vendor profile", async () => {
    const vendorProfile = {
      id: "vendor-1",
      status: "approved",
      business_name: "RDF Cafeteria",
    };

    const query = makeSingleQuery({
      data: vendorProfile,
      error: null,
    });

    supabase.from.mockReturnValue(query);

    const profile = await getVendorProfile("user-1");

    expect(profile).toEqual(vendorProfile);
    expect(supabase.from).toHaveBeenCalledWith("vendors");
    expect(query.select).toHaveBeenCalledWith("id, status, business_name");
    expect(query.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(query.single).toHaveBeenCalledTimes(1);
  });

  it("throws an error when the vendor profile cannot be fetched", async () => {
    const query = makeSingleQuery({
      data: null,
      error: {
        message: "Vendor not found",
      },
    });

    supabase.from.mockReturnValue(query);

    await expect(getVendorProfile("user-1")).rejects.toThrow(
      "Error fetching vendor profile"
    );
  });

  it("creates a user profile", async () => {
    const query = makeInsertQuery({
      error: null,
    });

    supabase.from.mockReturnValue(query);

    await createUserProfile({
      id: "user-1",
      email: "student@example.com",
      role: "student",
    });

    expect(supabase.from).toHaveBeenCalledWith("users");

    expect(query.insert).toHaveBeenCalledWith([
      {
        id: "user-1",
        email: "student@example.com",
        role: "student",
      },
    ]);
  });

  it("throws an error when creating a user profile fails", async () => {
    const query = makeInsertQuery({
      error: {
        message: "User insert failed",
      },
    });

    supabase.from.mockReturnValue(query);

    await expect(
      createUserProfile({
        id: "user-1",
        email: "student@example.com",
        role: "student",
      })
    ).rejects.toThrow("User insert failed");
  });

  it("creates a vendor profile with pending status", async () => {
    const query = makeInsertQuery({
      error: null,
    });

    supabase.from.mockReturnValue(query);

    await createVendorProfile({
      userId: "user-1",
      businessName: "RDF Cafeteria",
    });

    expect(supabase.from).toHaveBeenCalledWith("vendors");

    expect(query.insert).toHaveBeenCalledWith([
      {
        user_id: "user-1",
        business_name: "RDF Cafeteria",
        status: "pending",
      },
    ]);
  });

  it("throws an error when creating a vendor profile fails", async () => {
    const query = makeInsertQuery({
      error: {
        message: "Vendor insert failed",
      },
    });

    supabase.from.mockReturnValue(query);

    await expect(
      createVendorProfile({
        userId: "user-1",
        businessName: "RDF Cafeteria",
      })
    ).rejects.toThrow("Vendor insert failed");
  });
});