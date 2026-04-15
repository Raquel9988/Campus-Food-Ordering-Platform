import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://sqbscxfolbckikrzxqhr.supabase.co",
  "sb_publishable_Zw_iCK1n54xXGPuDWALWQQ_k2cOQWay"
);

const form = document.getElementById("login-form");
const message = document.getElementById("message");

document.addEventListener("DOMContentLoaded", async () => {
  await handleAuthenticatedLogin();
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim().toLowerCase();

  if (!email) {
    message.style.color = "red";
    message.textContent = "Please enter your email.";
    return;
  }

  message.style.color = "black";
  message.textContent = "Sending login link...";

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
    .from("users")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (roleError || !appUser) {
    message.style.color = "red";
    message.textContent = "User role not found.";
    return;
  }

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