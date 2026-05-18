import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../shared-auth-foundation/src/js/authHelpers.js", () => ({
  getCurrentSessionUser: vi.fn(),
  getUserRole: vi.fn(),
  getVendorProfile: vi.fn(),
}));

import {
  getCurrentSessionUser,
  getUserRole,
  getVendorProfile,
} from "../shared-auth-foundation/src/js/authHelpers.js";

import {
  requireLoggedInUser,
  requireAdmin,
  requireApprovedVendor,
} from "../shared-auth-foundation/src/js/routeGuards.js";

describe("shared routeGuards", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    window.location.hash = "";
  });

  it("returns the logged-in user when a session user exists", async () => {
    const fakeUser = {
      id: "user-1",
      email: "student@example.com",
    };

    getCurrentSessionUser.mockResolvedValue(fakeUser);

    const result = await requireLoggedInUser("#login");

    expect(result).toEqual(fakeUser);
    expect(window.location.hash).toBe("");
  });

  it("redirects and returns null when no user is logged in", async () => {
    getCurrentSessionUser.mockResolvedValue(null);

    const result = await requireLoggedInUser("#login");

    expect(result).toBeNull();
    expect(window.location.hash).toBe("#login");
  });

  it("allows an admin user through requireAdmin", async () => {
    const fakeUser = {
      id: "admin-user-1",
      email: "admin@example.com",
    };

    getCurrentSessionUser.mockResolvedValue(fakeUser);
    getUserRole.mockResolvedValue("admin");

    const result = await requireAdmin("#login");

    expect(result).toEqual(fakeUser);
    expect(getUserRole).toHaveBeenCalledWith("admin-user-1");
    expect(window.location.hash).toBe("");
  });

  it("redirects when requireAdmin is used by a non-admin user", async () => {
    const fakeUser = {
      id: "student-user-1",
      email: "student@example.com",
    };

    getCurrentSessionUser.mockResolvedValue(fakeUser);
    getUserRole.mockResolvedValue("student");

    const result = await requireAdmin("#login");

    expect(result).toBeNull();
    expect(window.location.hash).toBe("#login");
  });

  it("redirects when requireAdmin cannot fetch the role", async () => {
    const fakeUser = {
      id: "admin-user-1",
      email: "admin@example.com",
    };

    getCurrentSessionUser.mockResolvedValue(fakeUser);
    getUserRole.mockRejectedValue(new Error("Role fetch failed"));

    const result = await requireAdmin("#login");

    expect(result).toBeNull();
    expect(window.location.hash).toBe("#login");
  });

  it("returns null when requireAdmin is called without a logged-in user", async () => {
    getCurrentSessionUser.mockResolvedValue(null);

    const result = await requireAdmin("#login");

    expect(result).toBeNull();
    expect(getUserRole).not.toHaveBeenCalled();
    expect(window.location.hash).toBe("#login");
  });

  it("allows an approved vendor through requireApprovedVendor", async () => {
    const fakeUser = {
      id: "vendor-user-1",
      email: "vendor@example.com",
    };

    getCurrentSessionUser.mockResolvedValue(fakeUser);
    getUserRole.mockResolvedValue("vendor");
    getVendorProfile.mockResolvedValue({
      id: "vendor-1",
      status: "approved",
      business_name: "RDF Cafeteria",
    });

    const result = await requireApprovedVendor("#vendor-login");

    expect(result).toEqual(fakeUser);
    expect(getUserRole).toHaveBeenCalledWith("vendor-user-1");
    expect(getVendorProfile).toHaveBeenCalledWith("vendor-user-1");
    expect(window.location.hash).toBe("");
  });

  it("redirects when requireApprovedVendor is used by a non-vendor user", async () => {
    const fakeUser = {
      id: "student-user-1",
      email: "student@example.com",
    };

    getCurrentSessionUser.mockResolvedValue(fakeUser);
    getUserRole.mockResolvedValue("student");

    const result = await requireApprovedVendor("#vendor-login");

    expect(result).toBeNull();
    expect(getVendorProfile).not.toHaveBeenCalled();
    expect(window.location.hash).toBe("#vendor-login");
  });

  it("redirects when the vendor profile is not approved", async () => {
    const fakeUser = {
      id: "vendor-user-1",
      email: "vendor@example.com",
    };

    getCurrentSessionUser.mockResolvedValue(fakeUser);
    getUserRole.mockResolvedValue("vendor");
    getVendorProfile.mockResolvedValue({
      id: "vendor-1",
      status: "pending",
      business_name: "RDF Cafeteria",
    });

    const result = await requireApprovedVendor("#vendor-login");

    expect(result).toBeNull();
    expect(window.location.hash).toBe("#vendor-login");
  });

  it("redirects when requireApprovedVendor cannot fetch the vendor profile", async () => {
    const fakeUser = {
      id: "vendor-user-1",
      email: "vendor@example.com",
    };

    getCurrentSessionUser.mockResolvedValue(fakeUser);
    getUserRole.mockResolvedValue("vendor");
    getVendorProfile.mockRejectedValue(new Error("Vendor fetch failed"));

    const result = await requireApprovedVendor("#vendor-login");

    expect(result).toBeNull();
    expect(window.location.hash).toBe("#vendor-login");
  });

  it("returns null when requireApprovedVendor is called without a logged-in user", async () => {
    getCurrentSessionUser.mockResolvedValue(null);

    const result = await requireApprovedVendor("#vendor-login");

    expect(result).toBeNull();
    expect(getUserRole).not.toHaveBeenCalled();
    expect(getVendorProfile).not.toHaveBeenCalled();
    expect(window.location.hash).toBe("#vendor-login");
  });
});