import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://sqbscxfolbckikrzxqhr.supabase.co",
  "sb_publishable_Zw_iCK1n54xXGPuDWALWQQ_k2cOQWay"
);

window.addEventListener("load", async () => {
  const userInfo = document.getElementById("user-info");
  const logoutBtn = document.getElementById("logout");

  const authResult = await getApprovedVendorAuth();

  if (!authResult.ok) {
    alert(authResult.message);
    window.location.href = "../auth/login.html";
    return;
  }

  const { user, vendor } = authResult;

  if (userInfo) {
    userInfo.textContent = `Logged in as: ${user.email} | Business: ${vendor.business_name}`;
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await supabase.auth.signOut();
      window.location.href = "../auth/login.html";
    });
  }
});

async function getApprovedVendorAuth() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, message: "Please log in first." };
  }

  const { data: appUser, error: userError } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (userError || !appUser) {
    return { ok: false, message: "Unable to verify user profile." };
  }

  if (appUser.role !== "vendor") {
    return { ok: false, message: "Access denied. Vendors only." };
  }

  const { data: vendor, error: vendorError } = await supabase
    .from("vendors")
    .select("id, business_name, status")
    .eq("user_id", user.id)
    .single();

  if (vendorError || !vendor) {
    return { ok: false, message: "Vendor profile not found." };
  }

  if (vendor.status === "pending") {
    await supabase.auth.signOut();
    return { ok: false, message: "Your vendor account is still pending approval." };
  }

  if (vendor.status === "suspended") {
    await supabase.auth.signOut();
    return { ok: false, message: "Your vendor account has been suspended." };
  }

  if (vendor.status !== "approved") {
    await supabase.auth.signOut();
    return { ok: false, message: "Unknown vendor status." };
  }

  return { ok: true, user, vendor };
}