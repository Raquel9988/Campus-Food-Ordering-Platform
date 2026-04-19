import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://sqbscxfolbckikrzxqhr.supabase.co",
  "sb_publishable_Zw_iCK1n54xXGPuDWALWQQ_k2cOQWay"
);

/* ========================================
   ELEMENTS
======================================== */
const notificationDot = document.getElementById("order-notification");
const viewCartBtn = document.getElementById("view-cart");
const viewOrdersBtn = document.getElementById("view-orders");

/* ========================================
   DOT CONTROL (KEEP THIS — WORKS)
======================================== */
function showDot() {
  notificationDot?.classList.remove("hidden");
}

function hideDot() {
  notificationDot?.classList.add("hidden");
}

/* ========================================
   AUTH
======================================== */
async function getStudentAuth() {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    window.location.href = "../auth/login.html";
    return null;
  }

  return user;
}

/* ========================================
   CHECK EXISTING READY ORDERS (WORKING)
======================================== */
async function checkExistingReadyOrders(userId) {
  const { data } = await supabase
    .from("orders")
    .select("id")
    .eq("student_id", userId)
    .eq("status", "ready");

  if (data && data.length > 0) {
    showDot(); // 🔴 WORKS PERFECTLY
  }
}

/* ========================================
   REALTIME (WORKING)
======================================== */
function subscribeToOrders(userId) {
  supabase
    .channel("orders-channel")
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "orders"
      },
      (payload) => {
        const newRow = payload.new;
        const oldRow = payload.old;

        if (!newRow || !oldRow) return;
        if (newRow.student_id !== userId) return;

        if (newRow.status === "ready" && oldRow.status !== "ready") {
          showDot(); // 🔴 NEW READY
        }
      }
    )
    .subscribe();
}

/* ========================================
   LOAD VENDORS (UPDATED LOOK)
======================================== */
async function loadVendors() {
  const vendorsList = document.getElementById("vendors-list");

  vendorsList.innerHTML = `<p class="loading-text">Loading vendors...</p>`;

  const { data: vendors, error } = await supabase
    .from("vendors")
    .select("id, business_name")
    .eq("status", "approved")
    .order("business_name", { ascending: true });

  if (error || !vendors) {
    vendorsList.innerHTML = `<p class="error-text">Error loading vendors.</p>`;
    return;
  }

  if (vendors.length === 0) {
    vendorsList.innerHTML = `<p class="empty-text">No vendors available.</p>`;
    return;
  }

  vendorsList.innerHTML = "";

  vendors.forEach((vendor) => {
    const card = document.createElement("section");
    card.className = "vendor-card"; // ✅ THIS IS THE STYLING

    card.innerHTML = `
      <h4>${vendor.business_name}</h4>
      <p>Browse this vendor's menu.</p>
      <button>View Menu</button>
    `;

    card.querySelector("button").addEventListener("click", () => {
      window.location.href = `student-menu.html?vendorId=${vendor.id}`;
    });

    vendorsList.appendChild(card);
  });
}

/* ========================================
   INIT
======================================== */
window.addEventListener("load", async () => {
  const userInfo = document.getElementById("user-info");
  const logoutBtn = document.getElementById("logout");

  const user = await getStudentAuth();
  if (!user) return;

  userInfo.textContent = `Logged in as: ${user.email}`;

  await loadVendors(); // ✅ LOAD FIRST (UI)

  await checkExistingReadyOrders(user.id); // 🔴 DOT

  subscribeToOrders(user.id); // 🔴 REALTIME

  logoutBtn?.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "../auth/login.html";
  });

  viewOrdersBtn?.addEventListener("click", () => {
    hideDot(); // ❌ CLEAR DOT
    window.location.href = "my-orders.html";
  });
});

/* ========================================
   CART
======================================== */
viewCartBtn?.addEventListener("click", () => {
  window.location.href = "student-cart.html";
});
