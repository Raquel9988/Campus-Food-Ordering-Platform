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
   DOT CONTROL
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
   🔥 NEW: CHECK EXISTING READY ORDERS
======================================== */
async function checkExistingReadyOrders(userId) {
  const { data, error } = await supabase
    .from("orders")
    .select("id")
    .eq("student_id", userId)
    .eq("status", "ready");

  if (data && data.length > 0) {
    showDot(); // 🔴 SHOW DOT if any ready orders exist
  }
}

/* ========================================
   REALTIME (ONLY NEW CHANGES)
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
          showDot(); // 🔴 new ready order
        }
      }
    )
    .subscribe();
}

/* ========================================
   LOAD VENDORS (UNCHANGED)
======================================== */
async function loadVendors() {
  const vendorsList = document.getElementById("vendors-list");

  const { data: vendors } = await supabase
    .from("vendors")
    .select("id, business_name")
    .eq("status", "approved");

  vendorsList.innerHTML = "";

  vendors.forEach(vendor => {
    const card = document.createElement("section");

    card.innerHTML = `
      <h4>${vendor.business_name}</h4>
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

  await loadVendors();

  // 🔥 THIS FIXES YOUR PROBLEM
  await checkExistingReadyOrders(user.id);

  subscribeToOrders(user.id);

  logoutBtn?.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "../auth/login.html";
  });

  viewOrdersBtn?.addEventListener("click", () => {
    hideDot();
    window.location.href = "my-orders.html";
  });
});

/* ========================================
   CART
======================================== */
viewCartBtn?.addEventListener("click", () => {
  window.location.href = "student-cart.html";
});
