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
   NOTIFICATION DOT
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

  // Show logged in user
  userInfo.textContent = `Logged in as: ${user.email}`;

  // 🔴 Check if any orders are ready
  await checkReadyOrders(user.id);

  // 🔄 Subscribe to live updates
  subscribeToOrderUpdates(user.id);

  // Load vendors
  await loadVendors();

  // Logout
  logoutBtn?.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "../auth/login.html";
  });

  // 📦 View Orders button
  viewOrdersBtn?.addEventListener("click", () => {
    hideNotification(); // clear dot when clicked
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
   CHECK READY ORDERS
======================================== */
async function checkReadyOrders(userId) {
  const { data, error } = await supabase
    .from("orders")
    .select("id")
    .eq("student_id", userId)
    .eq("status", "ready");

  if (error) {
    console.error("Error checking orders:", error);
    return;
  }

  if (data && data.length > 0) {
    showNotification();
  } else {
    hideNotification();
  }
}

/* ========================================
   REAL-TIME ORDER UPDATES
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
        const updatedOrder = payload.new;

        if (updatedOrder.student_id === userId) {
          if (updatedOrder.status === "ready") {
            showNotification();
          } else {
            checkReadyOrders(userId);
          }
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
   CART BUTTON
======================================== */
viewCartBtn?.addEventListener("click", () => {
  window.location.href = "student-cart.html";
});
