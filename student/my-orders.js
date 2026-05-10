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
const emptyTitle = document.getElementById("empty-title");
const emptyMessage = document.getElementById("empty-message");
const filterTabs = document.querySelectorAll(".filter-tab");

/* ========================================
   State
======================================== */

let currentStudentId = null;
let allOrders = [];

const validFilters = ["active", "history"];

let currentFilter =
  new URLSearchParams(window.location.search).get("filter") || "active";

if (!validFilters.includes(currentFilter)) {
  currentFilter = "active";
}

/* ========================================
   Utility Functions
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

function formatDate(dateString) {
  if (!dateString) {
    return "N/A";
  }

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
  return `R${Number(amount || 0).toFixed(2)}`;
}

function getSafeOrderId(orderId) {
  return String(orderId || "").substring(0, 6);
}

/* ========================================
   Order Status Helpers
======================================== */

function isCompleteOrder(order) {
  return order?.status === "complete";
}

function filterOrders(orders, filter) {
  if (filter === "history") {
    return orders.filter((order) => isCompleteOrder(order));
  }

  return orders.filter((order) => !isCompleteOrder(order));
}

function getDisplayStatusKey(order) {
  if (order.payment_status === "pending" || order.status === "payment_pending") {
    return "payment_pending";
  }

  if (order.payment_status === "failed" || order.status === "payment_failed") {
    return "payment_failed";
  }

  if (order.payment_status === "cancelled" || order.status === "cancelled") {
    return "cancelled";
  }

  return order.status || "unknown";
}

function getStatusClass(order) {
  const status = getDisplayStatusKey(order);

  switch (status) {
    case "received":
      return "status-received";

    case "preparing":
      return "status-preparing";

    case "ready":
      return "status-ready";

    case "complete":
      return "status-complete";

    case "payment_pending":
    case "payment_failed":
    case "cancelled":
    default:
      return "status-default";
  }
}

function getStudentOrderStatusText(order) {
  if (order.payment_status === "pending" || order.status === "payment_pending") {
    return "Waiting for Payment";
  }

  if (order.payment_status === "failed" || order.status === "payment_failed") {
    return "Payment Failed";
  }

  if (order.payment_status === "cancelled" || order.status === "cancelled") {
    return "Payment Cancelled";
  }

  if (order.payment_status === "paid" && order.status === "received") {
    return "Payment Received / Order Received";
  }

  switch (order.status) {
    case "received":
      return "Order Received";

    case "preparing":
      return "Being Prepared";

    case "ready":
      return "Order Ready";

    case "complete":
      return "Completed";

    default:
      return order.status || "Unknown";
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

function getEmptyMessage(filter) {
  if (filter === "history") {
    return {
      title: "No order history",
      message:
        "Completed orders will appear here after the vendor marks them as complete.",
    };
  }

  return {
    title: "No active orders",
    message: "You have no orders in progress right now.",
  };
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

  const emptyText = getEmptyMessage(filter);

  if (emptyTitle) {
    emptyTitle.textContent = emptyText.title;
  }

  if (emptyMessage) {
    emptyMessage.textContent = emptyText.message;
  }
}

function setActiveTab(filter) {
  filterTabs.forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === filter);
  });
}

function updateUrlFilter(filter) {
  const url = new URL(window.location.href);
  url.searchParams.set("filter", filter);
  window.history.replaceState({}, "", url);
}

/* ========================================
   Auth
======================================== */

async function checkStudentAuth() {
  showLoading();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("Auth error:", error);
    showError("Could not check your login session.");
    return null;
  }

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
      "id, student_id, vendor_id, status, created_at, updated_at, payment_status, payment_provider, payment_amount, transaction_id, paid_at"
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

      const orderItems = items || [];

      const total = orderItems.reduce((sum, item) => {
        return sum + Number(item.price || 0) * Number(item.quantity || 0);
      }, 0);

      const itemsWithNames = await Promise.all(
        orderItems.map(async (item) => {
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
      const itemName = escapeHtml(item.name);
      const quantity = Number(item.quantity || 0);
      const price = formatCurrency(Number(item.price || 0));

      return `<li>${itemName} × ${quantity} <span>(${price} each)</span></li>`;
    })
    .join("");

  const readyTime =
    order.status === "ready"
      ? `<p><strong>Ready Time:</strong> ${formatDate(order.updated_at)}</p>`
      : "";

  const completedTime =
    order.status === "complete"
      ? `<p><strong>Completed Time:</strong> ${formatDate(order.updated_at)}</p>`
      : "";

  const transactionHtml = order.transaction_id
    ? `<p><strong>Transaction ID:</strong> ${escapeHtml(order.transaction_id)}</p>`
    : "";

  const paidAtHtml = order.paid_at
    ? `<p><strong>Paid At:</strong> ${formatDate(order.paid_at)}</p>`
    : "";

  const providerHtml = order.payment_provider
    ? `<p><strong>Payment Provider:</strong> ${escapeHtml(order.payment_provider)}</p>`
    : `<p><strong>Payment Provider:</strong> N/A</p>`;

  const paymentAmount = order.payment_amount || order.total_price;

  card.innerHTML = `
    <header>
      <h3>Order #${getSafeOrderId(order.id)}</h3>

      <span class="${getStatusClass(order)}">
        ${getStudentOrderStatusText(order)}
      </span>
    </header>

    <section class="order-meta">
      <p><strong>Vendor:</strong> ${escapeHtml(order.vendorName)}</p>
      <p><strong>Order Time:</strong> ${formatDate(order.created_at)}</p>
      <p><strong>Payment:</strong> ${getPaymentStatusText(order.payment_status)}</p>
      ${providerHtml}
      <p><strong>Payment Amount:</strong> ${formatCurrency(paymentAmount)}</p>
      ${transactionHtml}
      ${paidAtHtml}
      ${readyTime}
      ${completedTime}
    </section>

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

  setActiveTab(filter);

  const filteredOrders = filterOrders(orders, filter);

  if (!filteredOrders.length) {
    showEmpty(filter);
    return;
  }

  filteredOrders.forEach((order) => {
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
    renderOrders(allOrders, currentFilter);
  } catch (error) {
    console.error("Load orders error:", error);
    showError(error.message || "Could not load orders.");
  }
}

/* ========================================
   Real-time Updates
======================================== */

function subscribeToRealtime() {
  supabase
    .channel("student-orders-realtime")
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
          oldOrder?.payment_status === "pending" &&
          newOrder.payment_status === "paid"
        ) {
          showToast(`Payment confirmed for order #${getSafeOrderId(newOrder.id)}.`);
        }

        if (
          oldOrder?.payment_status === "pending" &&
          newOrder.payment_status === "failed"
        ) {
          showToast(`Payment failed for order #${getSafeOrderId(newOrder.id)}.`);
        }

        if (oldOrder?.status === "received" && newOrder.status === "preparing") {
          showToast(`Order #${getSafeOrderId(newOrder.id)} is being prepared.`);
        }

        if (oldOrder?.status === "preparing" && newOrder.status === "ready") {
          showToast(`Order #${getSafeOrderId(newOrder.id)} is ready for collection.`);
        }

        if (oldOrder?.status !== "complete" && newOrder.status === "complete") {
          showToast(`Order #${getSafeOrderId(newOrder.id)} has moved to Order History.`);
        }
      }
    )
    .subscribe();
}

/* ========================================
   Events
======================================== */

if (refreshBtn) {
  refreshBtn.onclick = loadOrders;
}

if (retryBtn) {
  retryBtn.onclick = loadOrders;
}

if (backBtn) {
  backBtn.onclick = () => {
    window.location.href = "student-dashboard.html";
  };
}

filterTabs.forEach((button) => {
  button.onclick = () => {
    currentFilter = button.dataset.filter || "active";

    if (!validFilters.includes(currentFilter)) {
      currentFilter = "active";
    }

    updateUrlFilter(currentFilter);
    renderOrders(allOrders, currentFilter);
  };
});

/* ========================================
   Init
======================================== */

async function initializePage() {
  currentStudentId = await checkStudentAuth();

  if (!currentStudentId) {
    return;
  }

  updateUrlFilter(currentFilter);

  await loadOrders();
  subscribeToRealtime();
}

document.addEventListener("DOMContentLoaded", initializePage);