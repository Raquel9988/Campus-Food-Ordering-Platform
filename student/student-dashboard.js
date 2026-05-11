import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://sqbscxfolbckikrzxqhr.supabase.co",
  "sb_publishable_Zw_iCK1n54xXGPuDWALWQQ_k2cOQWay"
);

/* ========================================
   ELEMENTS
======================================== */

const userInfo = document.getElementById("user-info");
const vendorsList = document.getElementById("vendors-list");
const toast = document.getElementById("toast");

const activeOrdersBtn = document.getElementById("active-orders");
const orderHistoryBtn = document.getElementById("order-history");
const viewCartBtn = document.getElementById("view-cart");
const logoutBtn = document.getElementById("logout");

const activeOrdersDot = document.getElementById("active-orders-dot");

/* ========================================
   SAFE HTML
======================================== */

function escapeHtml(text) {
  if (text === null || text === undefined) {
    return "";
  }

  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ========================================
   TOAST
======================================== */

function showToast(message) {
  if (!toast) {
    return;
  }

  toast.textContent = message;
  toast.classList.remove("hidden");
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
    toast.classList.add("hidden");
  }, 3000);
}

/* ========================================
   AUTH
======================================== */

async function getStudentAuth() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    window.location.href = "../auth/login.html";
    return null;
  }

  const { data: appUser, error: userError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (userError || !appUser || appUser.role !== "student") {
    await supabase.auth.signOut();
    window.location.href = "../auth/login.html";
    return null;
  }

  return user;
}

/* ========================================
   READY ORDER NOTIFICATION DOT
======================================== */

function getSeenReadyOrders() {
  try {
    return JSON.parse(localStorage.getItem("seen_ready_orders") || "[]");
  } catch {
    return [];
  }
}

function saveSeenReadyOrders(orderIds) {
  localStorage.setItem("seen_ready_orders", JSON.stringify(orderIds));
}

function showActiveOrdersDot() {
  activeOrdersDot?.classList.remove("hidden");
}

function hideActiveOrdersDot() {
  activeOrdersDot?.classList.add("hidden");
}

async function fetchReadyOrderIds(userId) {
  const { data, error } = await supabase
    .from("orders")
    .select("id")
    .eq("student_id", userId)
    .eq("payment_status", "paid")
    .eq("status", "ready");

  if (error) {
    console.error("Ready orders check error:", error);
    return [];
  }

  return (data || []).map((order) => order.id);
}

async function updateActiveOrdersDot(userId) {
  const readyOrderIds = await fetchReadyOrderIds(userId);

  if (readyOrderIds.length === 0) {
    hideActiveOrdersDot();
    return;
  }

  const seenReadyOrders = getSeenReadyOrders();

  const hasUnseenReadyOrder = readyOrderIds.some((orderId) => {
    return !seenReadyOrders.includes(orderId);
  });

  if (hasUnseenReadyOrder) {
    showActiveOrdersDot();
  } else {
    hideActiveOrdersDot();
  }
}

async function markReadyOrdersAsSeen(userId) {
  const readyOrderIds = await fetchReadyOrderIds(userId);

  saveSeenReadyOrders(readyOrderIds);
  hideActiveOrdersDot();
}

/* ========================================
   REAL-TIME ORDERS
======================================== */

function subscribeToOrders(userId) {
  supabase
    .channel("student-dashboard-orders")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "orders",
      },
      async (payload) => {
        const newOrder = payload.new;
        const oldOrder = payload.old;
        const relatedOrder = newOrder || oldOrder;

        if (!relatedOrder || relatedOrder.student_id !== userId) {
          return;
        }

        if (
          newOrder &&
          newOrder.payment_status === "paid" &&
          oldOrder?.payment_status !== "paid"
        ) {
          showToast("Payment confirmed. Your order has been received.");
        }

        if (
          newOrder &&
          newOrder.payment_status === "paid" &&
          newOrder.status === "ready" &&
          oldOrder?.status !== "ready"
        ) {
          showToast("Your order is ready for pickup.");
        }

        if (
          newOrder &&
          newOrder.status === "complete" &&
          oldOrder?.status !== "complete"
        ) {
          showToast("Your order has moved to Order History.");
        }

        await updateActiveOrdersDot(userId);
      }
    )
    .subscribe();
}

/* ========================================
   LOAD VENDORS
======================================== */

async function loadVendors() {
  if (!vendorsList) {
    return;
  }

  vendorsList.innerHTML = `
    <p class="loading-text">
      <span class="spinner-sm"></span>
      Loading vendors…
    </p>
  `;

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
      <h4>${escapeHtml(vendor.business_name)}</h4>
      <p>Browse this vendor's menu and add food to your cart.</p>
      <button type="button">View Menu</button>
    `;

    card.querySelector("button").onclick = () => {
      window.location.href = `student-menu.html?vendorId=${vendor.id}`;
    };

    vendorsList.appendChild(card);
  });
}

/* ========================================
   EVENTS
======================================== */

function setupEvents(user) {
  activeOrdersBtn?.addEventListener("click", async () => {
    await markReadyOrdersAsSeen(user.id);
    window.location.href = "my-orders.html?filter=active";
  });

  orderHistoryBtn?.addEventListener("click", () => {
    window.location.href = "my-orders.html?filter=history";
  });

  viewCartBtn?.addEventListener("click", () => {
    window.location.href = "student-cart.html";
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
  const user = await getStudentAuth();

  if (!user) {
    return;
  }

  if (userInfo) {
    userInfo.textContent = `Logged in as: ${user.email}`;
  }

  await loadVendors();
  await updateActiveOrdersDot(user.id);
  subscribeToOrders(user.id);
  setupEvents(user);
});
