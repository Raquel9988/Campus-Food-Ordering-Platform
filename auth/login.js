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

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

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
    return;
  }

  const user = loginData.user;

  const { data: users, error: roleError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id);

  if (roleError) {
    message.textContent = "Error fetching role";
    return;
  }

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