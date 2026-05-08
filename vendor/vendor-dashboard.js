import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://sqbscxfolbckikrzxqhr.supabase.co",
  "sb_publishable_Zw_iCK1n54xXGPuDWALWQQ_k2cOQWay"
);

/* ══════════════════════════════════════════
   INLINE ERROR HELPERS
══════════════════════════════════════════ */

/** Show an error beneath a field input */
function showFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  if (!field) return;

  field.classList.add("field-error");

  // Remove any existing error hint for this field
  const existing = field.parentElement.querySelector(".field-hint-error");
  if (existing) existing.remove();

  const hint = document.createElement("p");
  hint.className = "field-hint-error";
  hint.textContent = message;
  field.parentElement.appendChild(hint);
}

/** Clear error state from a field */
function clearFieldError(fieldId) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  field.classList.remove("field-error");
  const hint = field.parentElement.querySelector(".field-hint-error");
  if (hint) hint.remove();
}

/** Show a banner message inside the card (not an alert) */
function showBanner(message, type = "error") {
  let banner = document.getElementById("auth-banner");
  if (!banner) {
    banner = document.createElement("p");
    banner.id = "auth-banner";
    const main = document.querySelector(".main-grid") || document.body;
    main.prepend(banner);
  }
  banner.className = `auth-banner auth-banner--${type}`;
  banner.textContent = message;
}

/* ══════════════════════════════════════════
   INIT
══════════════════════════════════════════ */

window.addEventListener("load", async () => {
  const userInfo  = document.getElementById("user-info");
  const logoutBtn = document.getElementById("logout");
  const orderBtn  = document.getElementById("orders-dashboard");

  const authResult = await getApprovedVendorAuth();

  if (!authResult.ok) {
    showBanner(authResult.message, "error");
    setTimeout(() => { window.location.href = "../auth/login.html"; }, 1800);
    return;
  }

  const { user, vendor } = authResult;

  if (userInfo) {
    userInfo.textContent = `${user.email} · ${vendor.business_name}`;
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await supabase.auth.signOut();
      window.location.href = "../auth/login.html";
    });
  }

  if (orderBtn) {
    orderBtn.addEventListener("click", () => {
      window.location.href = "../vendor/orders.html";
    });
  }
});

/* ══════════════════════════════════════════
   AUTH
══════════════════════════════════════════ */

async function getApprovedVendorAuth() {
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) return { ok: false, message: "Please log in first." };

  const { data: appUser, error: userError } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (userError || !appUser) return { ok: false, message: "Unable to verify user profile." };
  if (appUser.role !== "vendor") return { ok: false, message: "Access denied. Vendors only." };

  const { data: vendor, error: vendorError } = await supabase
    .from("vendors")
    .select("id, business_name, status")
    .eq("user_id", user.id)
    .single();

  if (vendorError || !vendor) return { ok: false, message: "Vendor profile not found." };

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