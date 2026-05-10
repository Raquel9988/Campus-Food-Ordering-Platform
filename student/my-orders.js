import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://sqbscxfolbckikrzxqhr.supabase.co",
  "sb_publishable_Zw_iCK1n54xXGPuDWALWQQ_k2cOQWay"
);

/* ========================================
   DOM Elements
======================================== */

const loadingContainer = document.getElementById("loading-container");
const errorContainer = document.getElementById("error-container");
const errorText = document.getElementById("error-text");
const ordersContainer = document.getElementById("orders-container");
const emptyState = document.getElementById("empty-state");
const refreshBtn = document.getElementById("refresh-btn");
const retryBtn = document.getElementById("retry-btn");
const backBtn = document.getElementById("back-btn");

/* ========================================
   Constants
======================================== */

const ACTIVE_STATUSES   = ["payment_pending", "received", "preparing", "ready"];
const HISTORY_STATUSES  = ["complete", "cancelled", "payment_failed"];

/* ========================================
   State
======================================== */

let currentStudentId = null;
let allOrders = [];
let currentFilter = new URLSearchParams(window.location.search).get("filter") || "active";

/* ========================================
   Utility Functions
======================================== */

function escapeHtml(text) {
  if (!text) return "";

  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(dateString) {
  if (!dateString) return "N/A";

  const date = new Date(dateString);

  return date.toLocaleString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(amount) {
  return `R${parseFloat(amount || 0).toFixed(2)}`;
}

function getStatusClass(status) {
  switch (status) {
    case "received":
      return "status-received";

    case "preparing":
      return "status-preparing";

    case "ready":
      return "status-ready";

    case "complete":
      return "status-complete";

    case "cancelled":
    case "payment_pending":
    case "payment_failed":
    default:
      return "status-default";
  }
}

function getStatusText(status) {
  switch (status) {
    case "payment_pending":
      return "Waiting for Payment";

    case "payment_failed":
      return "Payment Failed";

    case "received":
      return "Order Received";

    case "preparing":
      return "Being Prepared";

    case "ready":
      return "Order Ready";

    case "complete":
      return "Completed";

    case "cancelled":
      return "Cancelled";

    default:
      return status || "Unknown";
  }
}

function getPaymentStatusText(status) {
  switch (status) {
    case "pending":
      return "Payment Pending";

    case "paid":
      return "Paid";

    case "failed":
      return "Payment Failed";

    case "cancelled":
      return "Payment Cancelled";

    case "unpaid":
      return "Unpaid";

    default:
      return status || "Unknown";
  }
}

/* ========================================
   Toast
======================================== */

function showToast(message) {
  const toast = document.createElement("section");
  toast.textContent = message;

  toast.style.position = "fixed";
  toast.style.bottom = "20px";
  toast.style.right = "20px";
  toast.style.background = "black";
  toast.style.color = "white";
  toast.style.padding = "10px 15px";
  toast.style.borderRadius = "5px";
  toast.style.zIndex = "1000";

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

/* ========================================
   Filter helpers
======================================== */

function filterOrders(orders, filter) {
  if (filter === "active")  return orders.filter(o => ACTIVE_STATUSES.includes(o.status));
  if (filter === "history") return orders.filter(o => HISTORY_STATUSES.includes(o.status));
  return orders;
}

function setActiveTab(filter) {
  document.querySelectorAll(".filter-tab").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.filter === filter);
  });
}

function getEmptyMessage(filter) {
  if (filter === "active")  return { title: "No active orders", message: "You have no orders in progress right now." };
  if (filter === "history") return { title: "No order history", message: "Your completed and cancelled orders will appear here." };
  return { title: "No orders yet", message: "You haven't placed any orders yet." };
}

/* ========================================
   UI State
======================================== */

function showLoading() {
  loadingContainer.classList.remove("hidden");
  errorContainer.classList.add("hidden");
  ordersContainer.classList.add("hidden");
  emptyState.classList.add("hidden");
}

function showError(message) {
  loadingContainer.classList.add("hidden");
  errorContainer.classList.remove("hidden");
  ordersContainer.classList.add("hidden");
  emptyState.classList.add("hidden");

  errorText.textContent = message;
}

function showOrders() {
  loadingContainer.classList.add("hidden");
  errorContainer.classList.add("hidden");
  ordersContainer.classList.remove("hidden");
  emptyState.classList.add("hidden");
}

function showEmpty(filter) {
  loadingContainer.classList.add("hidden");
  errorContainer.classList.add("hidden");
  ordersContainer.classList.add("hidden");
  emptyState.classList.remove("hidden");

  const { title, message } = getEmptyMessage(filter);
  document.getElementById("empty-title").textContent = title;
  document.getElementById("empty-message").textContent = message;
}

/* ========================================
   Auth
======================================== */

async function checkStudentAuth() {
  showLoading();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    window.location.href = "../auth/login.html";
    return null;
  }

  return user.id;
}

/* ========================================
   Fetch Orders
======================================== */

async function fetchOrders(studentId) {
  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      "id, vendor_id, status, created_at, updated_at, payment_status, payment_provider, payment_amount, transaction_id, paid_at"
    )
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Fetch orders error:", error);
    throw new Error("Could not load your orders.");
  }

  if (!orders || orders.length === 0) {
    return [];
  }

  return await Promise.all(
    orders.map(async (order) => {
      const { data: items, error: itemsError } = await supabase
        .from("order_items")
        .select("menu_item_id, quantity, price")
        .eq("order_id", order.id);

      if (itemsError) {
        console.error("Fetch order items error:", itemsError);
      }

      const total = (items || []).reduce((sum, item) => {
        return sum + Number(item.price) * Number(item.quantity);
      }, 0);

      const itemsWithNames = await Promise.all(
        (items || []).map(async (item) => {
          const { data: menu } = await supabase
            .from("menu_items")
            .select("name")
            .eq("id", item.menu_item_id)
            .single();

          return {
            ...item,
            name: menu?.name || "Item",
          };
        })
      );

      const { data: vendor } = await supabase
        .from("vendors")
        .select("business_name")
        .eq("id", order.vendor_id)
        .single();

      return {
        ...order,
        items: itemsWithNames,
        total_price: total,
        vendorName: vendor?.business_name || "Vendor",
      };
    })
  );
}

/* ========================================
   Render Orders
======================================== */

function createOrderCard(order) {
  const card = document.createElement("article");
  card.className = "order-card";

  const itemsHtml = order.items
    .map((item) => {
      return `<li>${escapeHtml(item.name)} × ${item.quantity}</li>`;
    })
    .join("");

  const readyTime =
    order.status === "ready"
      ? `<p><strong>Ready Time:</strong> ${formatDate(order.updated_at)}</p>`
      : "";

  const transactionHtml = order.transaction_id
    ? `<p><strong>Transaction ID:</strong> ${escapeHtml(order.transaction_id)}</p>`
    : "";

  const paidAtHtml = order.paid_at
    ? `<p><strong>Paid At:</strong> ${formatDate(order.paid_at)}</p>`
    : "";

  card.innerHTML = `
    <header>
      <h3>Order #${order.id.substring(0, 6)}</h3>

      <span class="${getStatusClass(order.status)}">
        ${getStatusText(order.status)}
      </span>
    </header>

    <p><strong>Vendor:</strong> ${escapeHtml(order.vendorName)}</p>
    <p><strong>Order Time:</strong> ${formatDate(order.created_at)}</p>

    <p><strong>Payment:</strong> ${getPaymentStatusText(order.payment_status)}</p>
    <p><strong>Payment Provider:</strong> ${escapeHtml(order.payment_provider || "N/A")}</p>
    <p><strong>Payment Amount:</strong> ${formatCurrency(order.payment_amount || order.total_price)}</p>

    ${transactionHtml}
    ${paidAtHtml}
    ${readyTime}

    <ul>
      ${itemsHtml}
    </ul>

    <footer>
      <strong>Total: ${formatCurrency(order.total_price)}</strong>
    </footer>
  `;

  return card;
}

function renderOrders(orders, filter) {
  ordersContainer.innerHTML = "";

  const filtered = filterOrders(orders, filter);

  if (!filtered.length) {
    showEmpty(filter);
    return;
  }

  filtered.forEach((order) => {
    ordersContainer.appendChild(createOrderCard(order));
  });

  showOrders();
}

/* ========================================
   Load Orders
======================================== */

async function loadOrders() {
  try {
    showLoading();

    allOrders = await fetchOrders(currentStudentId);
    setActiveTab(currentFilter);
    renderOrders(allOrders, currentFilter);
  } catch (error) {
    console.error("Load orders error:", error);
    showError(error.message || "Could not load orders.");
  }
}

/* ========================================
   REAL-TIME
======================================== */

function subscribeToRealtime() {
  supabase
    .channel("orders-realtime")
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

        if (!newOrder || newOrder.student_id !== currentStudentId) {
          return;
        }

        allOrders = await fetchOrders(currentStudentId);
        renderOrders(allOrders, currentFilter);

        if (
          oldOrder?.status === "preparing" &&
          newOrder.status === "ready"
        ) {
          showToast(`Order #${newOrder.id.substring(0, 6)} is ready!`);
        }

        if (
          oldOrder?.payment_status === "pending" &&
          newOrder.payment_status === "paid"
        ) {
          showToast(`Payment confirmed for order #${newOrder.id.substring(0, 6)}.`);
        }

        if (
          oldOrder?.payment_status === "pending" &&
          newOrder.payment_status === "failed"
        ) {
          showToast(`Payment failed for order #${newOrder.id.substring(0, 6)}.`);
        }
      }
    )
    .subscribe();
}

/* ========================================
   Events
======================================== */

refreshBtn.onclick = loadOrders;
retryBtn.onclick = loadOrders;

backBtn.onclick = () => {
  window.location.href = "student-dashboard.html";
};

document.querySelectorAll(".filter-tab").forEach(btn => {
  btn.onclick = () => {
    currentFilter = btn.dataset.filter;
    setActiveTab(currentFilter);
    renderOrders(allOrders, currentFilter);
  };
});

/* ========================================
   INIT
======================================== */

async function initializePage() {
  currentStudentId = await checkStudentAuth();

  if (!currentStudentId) {
    return;
  }

  await loadOrders();
  subscribeToRealtime();
}

document.addEventListener("DOMContentLoaded", initializePage);