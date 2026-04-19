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
   LOAD PAGE
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

  userInfo.textContent = `Logged in as: ${user.email}`;

  await checkReadyOrders(user.id); // 🔥 FIXED LOGIC
  subscribeToOrderUpdates(user.id);

  await loadVendors();

  logoutBtn?.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "../auth/login.html";
  });

  /* VIEW ORDERS CLICK */
  viewOrdersBtn?.addEventListener("click", async () => {
    await markOrdersSeen(user.id); // 🔥 FIXED
    hideNotification();
    window.location.href = "my-orders.html";
  });
});

/* ========================================
   AUTH
======================================== */
async function getStudentAuth() {
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { ok: false, message: "Please log in first." };
  }

  const { data: appUser } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!appUser || appUser.role !== "student") {
    return { ok: false, message: "Access denied." };
  }

  return { ok: true, user };
}

/* ========================================
   CHECK READY ORDERS (FIXED)
======================================== */
async function checkReadyOrders(userId) {
  const { data, error } = await supabase
    .from("orders")
    .select("id, updated_at")
    .eq("student_id", userId)
    .eq("status", "ready")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  if (!data || data.length === 0) {
    hideNotification();
    return;
  }

  const latestReadyTime = data[0].updated_at;
  const lastSeenTime = localStorage.getItem("orders_last_seen");

  if (!lastSeenTime || latestReadyTime > lastSeenTime) {
    showNotification();
  } else {
    hideNotification();
  }
}

/* ========================================
   MARK ORDERS SEEN (FIXED)
======================================== */
async function markOrdersSeen(userId) {
  const { data } = await supabase
    .from("orders")
    .select("updated_at")
    .eq("student_id", userId)
    .eq("status", "ready")
    .order("updated_at", { ascending: false })
    .limit(1);

  if (data && data.length > 0) {
    localStorage.setItem("orders_last_seen", data[0].updated_at);
  }
}

/* ========================================
   REAL-TIME (FIXED)
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
        const order = payload.new;

        if (order.student_id === userId && order.status === "ready") {
          showNotification(); // 🔥 immediate update
        }
      }
    )
    .subscribe();
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
    vendorsList.innerHTML = `<p class="error-text">Error loading vendors.</p>`;
    return;
  }

  if (!vendors || vendors.length === 0) {
    vendorsList.innerHTML = `<p class="empty-text">No vendors available.</p>`;
    return;
  }

  vendorsList.innerHTML = "";

  vendors.forEach((vendor) => {
    const card = document.createElement("div");
    card.className = "vendor-card";

    card.innerHTML = `
      <h4>${vendor.business_name}</h4>
      <p>Browse this vendor's available menu items.</p>
      <button>View Menu</button>
    `;

    card.querySelector("button").addEventListener("click", () => {
      window.location.href = `student-menu.html?vendorId=${vendor.id}`;
    });

    vendorsList.appendChild(card);
  });
}

/* ========================================
   CART
======================================== */
viewCartBtn?.addEventListener("click", () => {
  window.location.href = "student-cart.html";
});
