import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://sqbscxfolbckikrzxqhr.supabase.co",
  "sb_publishable_Zw_iCK1n54xXGPuDWALWQQ_k2cOQWay"
);

/* ========================================
   ELEMENTS
======================================== */
const notificationDot = document.getElementById("order-notification");
const viewOrdersBtn = document.getElementById("view-orders");
const viewCartBtn = document.getElementById("view-cart");

/* ========================================
   DOT CONTROL
======================================== */
function showDot() {
  notificationDot?.classList.remove("hidden");
}

function hideDot() {
  notificationDot?.classList.add("hidden");
}

/* ========================================
   TOAST NOTIFICATION
======================================== */
function showToast(message) {
  const toast = document.createElement("section");
  toast.textContent = message;

  toast.style.position = "fixed";
  toast.style.bottom = "20px";
  toast.style.right = "20px";
  toast.style.background = "#14532d";
  toast.style.color = "white";
  toast.style.padding = "12px 16px";
  toast.style.borderRadius = "10px";
  toast.style.boxShadow = "0 6px 20px rgba(0,0,0,0.2)";
  toast.style.zIndex = "9999";

  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
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
   STORAGE (TRACK SEEN READY ORDERS)
======================================== */
function getSeenIds() {
  const raw = localStorage.getItem("seen_ready_orders");
  return raw ? JSON.parse(raw) : [];
}

function setSeenIds(ids) {
  localStorage.setItem("seen_ready_orders", JSON.stringify(ids));
}

/* ========================================
   FETCH READY ORDERS
======================================== */
async function getReadyOrderIds(userId) {
  const { data } = await supabase
    .from("orders")
    .select("id")
    .eq("student_id", userId)
    .eq("status", "ready");

  return data ? data.map(o => o.id) : [];
}

/* ========================================
   UPDATE DOT STATE
======================================== */
async function updateNotificationState(userId) {
  const readyIds = await getReadyOrderIds(userId);
  const seenIds = getSeenIds();

  const hasUnseen = readyIds.some(id => !seenIds.includes(id));

  if (hasUnseen) {
    showDot();
  } else {
    hideDot();
  }
}

/* ========================================
   REAL-TIME SUBSCRIPTION (FINAL FIX)
======================================== */
function subscribeToOrders(userId) {
  supabase
    .channel("orders-channel")
    .on(
      "postgres_changes",
      {
        event: "*", // ✅ handles INSERT, UPDATE, DELETE
        schema: "public",
        table: "orders"
      },
      async (payload) => {
        const newRow = payload.new;
        const oldRow = payload.old;

        // Ignore unrelated users
        if (newRow && newRow.student_id !== userId) return;
        if (oldRow && oldRow.student_id !== userId) return;

        // 🔴 Detect NEW READY status
        if (
          newRow &&
          newRow.status === "ready" &&
          (!oldRow || oldRow.status !== "ready")
        ) {
          showDot();
          showToast("Your order is ready for pickup!");
        }

        // 🔄 Always sync UI
        await updateNotificationState(userId);
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

    card.querySelector("button").onclick = () => {
      window.location.href = `student-menu.html?vendorId=${vendor.id}`;
    };

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

  // Initialize storage
  if (!localStorage.getItem("seen_ready_orders")) {
    setSeenIds([]);
  }

  await loadVendors();
  await updateNotificationState(user.id);
  subscribeToOrders(user.id);

  logoutBtn.onclick = async () => {
    await supabase.auth.signOut();
    window.location.href = "../auth/login.html";
  };

  /* 🔴 CLEAR DOT WHEN VIEWING ORDERS */
  viewOrdersBtn.onclick = async () => {
    const readyIds = await getReadyOrderIds(user.id);
    setSeenIds(readyIds);
    hideDot();
    window.location.href = "my-orders.html";
  };
});

/* ========================================
   CART
======================================== */
viewCartBtn?.addEventListener("click", () => {
  window.location.href = "student-cart.html";
});
