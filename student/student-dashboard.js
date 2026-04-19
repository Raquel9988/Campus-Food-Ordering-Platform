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
   NOTIFICATION
======================================== */
function showNotification() {
  console.log("🔴 SHOW DOT");
  notificationDot?.classList.remove("hidden");
}

function hideNotification() {
  console.log("❌ HIDE DOT");
  notificationDot?.classList.add("hidden");
}

/* ========================================
   AUTH
======================================== */
async function getStudentAuth() {
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    alert("Please log in first.");
    window.location.href = "../auth/login.html";
    return null;
  }

  return user;
}

/* ========================================
   CHECK READY ORDERS (CRITICAL FIX)
======================================== */
async function checkReadyOrders(userId) {
  console.log("🔍 Checking ready orders...");

  const { data, error } = await supabase
    .from("orders")
    .select("updated_at, status, student_id")
    .eq("student_id", userId)
    .eq("status", "ready")
    .order("updated_at", { ascending: false })
    .limit(1);

  console.log("📦 Ready orders result:", data);

  if (error || !data || data.length === 0) {
    hideNotification();
    return;
  }

  const latestReady = new Date(data[0].updated_at).getTime();

  const lastSeenRaw = localStorage.getItem("orders_last_seen");
  const lastSeen = lastSeenRaw ? Number(lastSeenRaw) : 0;

  console.log("⏱ latestReady:", latestReady);
  console.log("⏱ lastSeen:", lastSeen);

  if (!lastSeen || latestReady > lastSeen) {
    showNotification(); // 🔴 SHOW DOT
  } else {
    hideNotification();
  }
}

/* ========================================
   REALTIME
======================================== */
function subscribeToOrderUpdates(userId) {
  console.log("📡 Subscribing to realtime...");

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
        console.log("⚡ Realtime event:", payload);

        const oldStatus = payload.old?.status;
        const newOrder = payload.new;

        if (
          newOrder.student_id === userId &&
          oldStatus === "preparing" &&
          newOrder.status === "ready"
        ) {
          console.log("🔥 NEW READY ORDER DETECTED");
          showNotification();
        }
      }
    )
    .subscribe();
}

/* ========================================
   LOAD PAGE
======================================== */
window.addEventListener("load", async () => {
  console.log("🚀 Dashboard loading...");

  const userInfo = document.getElementById("user-info");
  const logoutBtn = document.getElementById("logout");

  const user = await getStudentAuth();
  if (!user) return;

  userInfo.textContent = `Logged in as: ${user.email}`;

  /* 🔥 DO NOT overwrite existing value */
  if (!localStorage.getItem("orders_last_seen")) {
    localStorage.setItem("orders_last_seen", 0);
  }

  await checkReadyOrders(user.id);
  subscribeToOrderUpdates(user.id);

  logoutBtn?.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "../auth/login.html";
  });

  /* ========================================
     VIEW ORDERS CLICK (ONLY CLEAR HERE)
  ======================================== */
  viewOrdersBtn?.addEventListener("click", () => {
    console.log("👀 Orders viewed → clearing dot");

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
