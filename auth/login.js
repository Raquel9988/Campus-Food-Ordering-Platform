import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
import { getRedirectPath } from "./redirectUtils.js";

export function validateLogin(email, password) {
  if (!email || !password) {
    return false;
  }
  return true;
}

const supabase = createClient(
  "https://sqbscxfolbckikrzxqhr.supabase.co",
  "sb_publishable_Zw_iCK1n54xXGPuDWALWQQ_k2cOQWay"
);

const form = document.getElementById("login-form");
const message = document.getElementById("message");

<<<<<<< HEAD
document.addEventListener("DOMContentLoaded", async () => {
  await handleAuthenticatedLogin();
});

=======
>>>>>>> 140aa6a197488fa279d6b2d14687413c9e93c5f2
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim().toLowerCase();

<<<<<<< HEAD
  if (!email) {
    message.style.color = "red";
    message.textContent = "Please enter your email.";
=======
  if (!validateLogin(email, password)) {
    message.textContent = "Please fill in all fields";
    return;
  }

  message.textContent = "Logging in...";

  const { data: loginData, error: loginError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (loginError) {
    message.textContent = loginError.message;
>>>>>>> 140aa6a197488fa279d6b2d14687413c9e93c5f2
    return;
  }

  message.style.color = "black";
  message.textContent = "Sending login link...";

<<<<<<< HEAD
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: window.location.href,
    },
  });

  if (error) {
    message.style.color = "red";
    message.textContent =
      error.message || "Could not send login link. Make sure you are registered.";
    return;
  }

  message.style.color = "green";
  message.textContent = "Login link sent. Check your email.";
});

async function handleAuthenticatedLogin() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return;
  }

  message.style.color = "black";
  message.textContent = "Signing you in...";

  const { data: appUser, error: roleError } = await supabase
=======
  const { data: users, error: roleError } = await supabase
>>>>>>> 140aa6a197488fa279d6b2d14687413c9e93c5f2
    .from("users")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (roleError || !appUser) {
    message.style.color = "red";
    message.textContent = "User role not found.";
    return;
  }

<<<<<<< HEAD
  if (appUser.role === "student") {
    window.location.href = "../student/student-dashboard.html";
    return;
  }

  if (appUser.role === "vendor") {
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("status")
      .eq("user_id", user.id)
      .single();

    if (vendorError || !vendor) {
      message.style.color = "red";
      message.textContent = "Vendor profile not found.";
      return;
    }

    if (vendor.status === "pending") {
      message.style.color = "orange";
      message.textContent = "Your vendor account is waiting for admin approval.";
      await supabase.auth.signOut();
      return;
    }

    if (vendor.status === "suspended") {
      message.style.color = "red";
      message.textContent = "Your vendor account has been suspended.";
      await supabase.auth.signOut();
      return;
    }

    if (vendor.status === "approved") {
      window.location.href = "../vendor/vendor-dashboard.html";
      return;
    }

    message.style.color = "red";
    message.textContent = "Unknown vendor status.";
    await supabase.auth.signOut();
    return;
  }

  if (appUser.role === "admin") {
    const { data: admin, error: adminError } = await supabase
      .from("admins")
      .select("status, is_master")
      .eq("user_id", user.id)
      .single();

    if (adminError || !admin) {
      message.style.color = "red";
      message.textContent = "Admin profile not found.";
      return;
    }

    const hasAdminAccess = admin.is_master || admin.status === "approved";

    if (!hasAdminAccess) {
      if (admin.status === "pending") {
        message.style.color = "orange";
        message.textContent = "Your admin account is waiting for master admin approval.";
      } else if (admin.status === "suspended") {
        message.style.color = "red";
        message.textContent = "Your admin account has been suspended.";
      } else {
        message.style.color = "red";
        message.textContent = "Admin access denied.";
      }

      await supabase.auth.signOut();
      return;
    }

    window.location.href = "../adminControls/admin-controls.html";
    return;
  }

  message.style.color = "red";
  message.textContent = "Unknown user role.";
  await supabase.auth.signOut();
}
=======
  if (!users || users.length === 0) {
    message.textContent = "User role not found";
    return;
  }

  const role = users[0].role;

  let status = null;

  if (role === "vendor") {
    const { data: vendors, error: vendorError } = await supabase
      .from("vendors")
      .select("status")
      .eq("user_id", user.id);

    if (vendorError) {
      message.textContent = "Error fetching vendor data";
      return;
    }

    if (!vendors || vendors.length === 0) {
      message.textContent = "Vendor profile not found";
      return;
    }

    status = vendors[0].status;
  }

  const redirect = getRedirectPath(role, status);

  if (redirect === "PENDING") {
    message.textContent = "Your account is waiting for admin approval";
    return;
  }

  if (redirect === "SUSPENDED") {
    message.textContent = "Your account has been suspended";
    return;
  }

  if (redirect === "UNKNOWN") {
    message.textContent = "Unknown user role";
    return;
  }

  window.location.href = redirect;
});
>>>>>>> 140aa6a197488fa279d6b2d14687413c9e93c5f2
