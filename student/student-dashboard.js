import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://sqbscxfolbckikrzxqhr.supabase.co",
  "sb_publishable_Zw_iCK1n54xXGPuDWALWQQ_k2cOQWay"
);

/* ========================================
   DOM ELEMENTS
======================================== */

const userInfo = document.getElementById("user-info");
const logoutBtn = document.getElementById("logout");
const vendorsList = document.getElementById("vendors-list");
const notificationDot = document.getElementById("order-notification");

/* ========================================
   NOTIFICATION DOT
======================================== */

function showOrderNotification() {
  notificationDot?.classList.remove("hidden");
}

function hideOrderNotification() {
  notificationDot?.classList.add("hidden");
}

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
   REAL-TIME NOTIFICATIONS
======================================== */

function subscribeToOrderNotifications(studentId) {
  supabase
    .channel("dashboard-orders")
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "orders",
      },
      (payload) => {
        const newRow = payload.new;
        const oldRow = payload.old;

        // SAFETY: handle null cases
        if (!newRow || !oldRow) return;

        if (newRow.student_id !== studentId) return;

        // triggers any time it becomes "ready"
        if (newRow.status === "ready" && oldRow.status !== "ready") {
          showOrderNotification();
        }
      }
    )
    .subscribe();
}

/* ========================================
   NAVIGATION
======================================== */

function setupNavigation() {
  document.getElementById("view-cart")?.addEventListener("click", () => {
    window.location.href = "student-cart.html";
  });

  document.getElementById("my-orders")?.addEventListener("click", () => {
    hideOrderNotification(); // remove dot
    window.location.href = "my-orders.html";
  });

  logoutBtn?.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "../auth/login.html";
  });
}

/* ========================================
   INIT
======================================== */

window.addEventListener("load", async () => {
  const authResult = await getStudentAuth();

  if (!authResult.ok) {
    alert(authResult.message);
    window.location.href = "../auth/login.html";
    return;
  }

  const { user } = authResult;

  userInfo.textContent = `Logged in as: ${user.email}`;

  await loadVendors();

  subscribeToOrderNotifications(user.id);

  setupNavigation();
});
