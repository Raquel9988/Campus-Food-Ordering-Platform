import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://sqbscxfolbckikrzxqhr.supabase.co",
  "sb_publishable_Zw_iCK1n54xXGPuDWALWQQ_k2cOQWay"
);

/* ========================================
   PAGE LOAD
======================================== */

window.addEventListener("load", async () => {
  const userInfo = document.getElementById("user-info");
  const logoutBtn = document.getElementById("logout");

  const authResult = await getStudentAuth();

  if (!authResult.ok) {
    alert(authResult.message);
    window.location.href = "../auth/login.html";
    return;
  }

  const { user } = authResult;

  if (userInfo) {
    userInfo.textContent = `Logged in as: ${user.email}`;
  }

  await loadVendors();

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await supabase.auth.signOut();
      window.location.href = "../auth/login.html";
    });
  }
});

/* ========================================
   AUTH CHECK
======================================== */

async function getStudentAuth() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, message: "Please log in first." };
  }

  const { data: appUser, error: roleError } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (roleError || !appUser) {
    return { ok: false, message: "Unable to verify your account." };
  }

  if (appUser.role !== "student") {
    await supabase.auth.signOut();
    return { ok: false, message: "Access denied. Students only." };
  }

  return { ok: true, user };
}

/* ========================================
   LOAD VENDORS
======================================== */

async function loadVendors() {
  const vendorsList = document.getElementById("vendors-list");

  vendorsList.innerHTML = `<p class="loading-text">Loading vendors...</p>`;

  const { data: vendors, error } = await supabase
    .from("vendors")
    .select("id, business_name")
    .eq("status", "approved")
    .order("business_name", { ascending: true });

  if (error) {
    console.error("Error fetching vendors:", error);
    vendorsList.innerHTML = `<p class="error-text">Error loading vendors.</p>`;
    return;
  }

  if (!vendors || vendors.length === 0) {
    vendorsList.innerHTML = `<p class="empty-text">No vendors available yet.</p>`;
    return;
  }

  vendorsList.innerHTML = "";

  vendors.forEach((vendor) => {
    // ✅ NO div — using article
    const vendorCard = document.createElement("article");
    vendorCard.className = "vendor-card";

    vendorCard.innerHTML = `
      <h4>${vendor.business_name}</h4>
      <p>Browse this vendor's available menu items.</p>
      <button type="button">View Menu</button>
    `;

    vendorCard.querySelector("button").addEventListener("click", () => {
      window.location.href = `student-menu.html?vendorId=${vendor.id}`;
    });

    vendorsList.appendChild(vendorCard);
  });
}

/* ========================================
   NAVIGATION
======================================== */

document.getElementById("view-cart")?.addEventListener("click", () => {
  window.location.href = "student-cart.html";
});

document.getElementById("my-orders")?.addEventListener("click", () => {
  window.location.href = "my-orders.html";
});