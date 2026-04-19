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
   NOTIFICATION
======================================== */
function showNotification() {
  notificationDot?.classList.remove("hidden");
}

function hideNotification() {
  notificationDot?.classList.add("hidden");
}

/* ========================================
   AUTH
======================================== */
async function getStudentAuth() {
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    alert("Please log in first.");
    window.location.href = "../auth/login.html";
    return null;
  }

  const { data: appUser } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!appUser || appUser.role !== "student") {
    alert("Access denied.");
    window.location.href = "../auth/login.html";
    return null;
  }

  return user;
}

/* ========================================
   CHECK READY ORDERS (FIXED PROPERLY)
======================================== */
async function checkReadyOrders(userId) {
  const { data, error } = await supabase
    .from("orders")
    .select("updated_at")
    .eq("student_id", userId)
    .eq("status", "ready")
    .order("updated_at", { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    hideNotification();
    return;
  }

  const latestReady = new Date(data[0].updated_at).getTime();
  const lastSeen = Number(localStorage.getItem("orders_last_seen") || 0);

  if (latestReady > lastSeen) {
    showNotification();
  } else {
    hideNotification();
  }
}

/* ========================================
   REALTIME
======================================== */
function subscribeToOrderUpdates(userId) {
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
        if (
          payload.new.student_id === userId &&
          payload.old?.status === "preparing" &&
          payload.new.status === "ready"
        ) {
          showNotification();
        }
      }
    )
    .subscribe();
}

/* ========================================
   LOAD VENDORS (UNCHANGED, WORKING)
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
    card.className = "vendor-card";

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

  /* 🔥 CRITICAL FIX */
  if (!localStorage.getItem("orders_last_seen")) {
    localStorage.setItem("orders_last_seen", 0);
  }

  await checkReadyOrders(user.id);
  subscribeToOrderUpdates(user.id);
  await loadVendors(); // ✅ vendors now load correctly

  logoutBtn?.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "../auth/login.html";
  });

  /* 🔴 ONLY CLEAR HERE */
  viewOrdersBtn?.addEventListener("click", () => {
    localStorage.setItem("orders_last_seen", Date.now());
    hideNotification();
    window.location.href = "my-orders.html";
  });
});

/* ========================================
   CART
======================================== */
viewCartBtn?.addEventListener("click", () => {
  window.location.href = "student-cart.html";
});
