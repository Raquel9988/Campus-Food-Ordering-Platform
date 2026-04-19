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
  if (userInfo) {
    userInfo.textContent = `Logged in as: ${user.email}`;
  }

  // 🔥 Check existing ready orders
  await checkReadyOrders(user.id);

  // 🔥 Real-time updates
  subscribeToOrderUpdates(user.id);

  // Load vendors
  await loadVendors();

  // Logout
  logoutBtn?.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "../auth/login.html";
  });
});

/* ========================================
   AUTH
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
   CHECK READY ORDERS (INITIAL)
======================================== */
async function checkReadyOrders(userId) {
  const { data, error } = await supabase
    .from("orders")
    .select("id, status")
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
        table: "orders",
      },
      (payload) => {
        const updatedOrder = payload.new;

        if (updatedOrder.student_id === userId) {
          if (updatedOrder.status === "ready") {
            showNotification();
          } else {
            checkReadyOrders(userId); // re-check all
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
    const vendorCard = document.createElement("div");
    vendorCard.className = "vendor-card";

    vendorCard.innerHTML = `
      <h4>${vendor.business_name}</h4>
      <p>Browse this vendor's available menu items.</p>
      <button>View Menu</button>
    `;

    vendorCard.querySelector("button").addEventListener("click", () => {
      window.location.href = `student-menu.html?vendorId=${vendor.id}`;
    });

    vendorsList.appendChild(vendorCard);
  });
}

/* ========================================
   CART BUTTON
======================================== */
viewCartBtn?.addEventListener("click", () => {
  hideNotification(); // clear dot when viewed
  window.location.href = "student-cart.html";
});
