import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://sqbscxfolbckikrzxqhr.supabase.co",
  "sb_publishable_Zw_iCK1n54xXGPuDWALWQQ_k2cOQWay"
);

const loadingContainer = document.getElementById("loading-container");
const errorContainer = document.getElementById("error-container");
const errorText = document.getElementById("error-text");
const ordersContainer = document.getElementById("orders-container");
const emptyState = document.getElementById("empty-state");
const refreshBtn = document.getElementById("refresh-btn");
const retryBtn = document.getElementById("retry-btn");
const dashboardBtn = document.getElementById("dashboard-btn");

let currentVendorId = null;
let isRefreshing = false;
let autoRefreshInterval = null;

const ACTIVE_VENDOR_STATUSES = ["received", "preparing", "ready"];

const STATUS_TRANSITIONS = {
  received: ["preparing"],
  preparing: ["ready"],
  ready: ["complete"],
  complete: [],
};

dashboardBtn?.addEventListener("click", () => {
  window.location.href = "../vendor/vendor-dashboard.html";
});

function escapeHtml(unsafe) {
  if (!unsafe) return "";

  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(dateString) {
  if (!dateString) return "N/A";

  try {
    const date = new Date(dateString);
    return date.toLocaleString();
  } catch {
    return dateString;
  }
}

function formatCurrency(amount) {
  return `R${Number(amount || 0).toFixed(2)}`;
}

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

function showEmpty() {
  loadingContainer.classList.add("hidden");
  errorContainer.classList.add("hidden");
  ordersContainer.classList.add("hidden");
  emptyState.classList.remove("hidden");
}

function isValidStatusTransition(currentStatus, nextStatus) {
  return STATUS_TRANSITIONS[currentStatus]?.includes(nextStatus) || false;
}

async function getApprovedVendorAuth() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      ok: false,
      message: "Please log in first.",
    };
  }

  const { data: appUser, error: userError } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (userError || !appUser) {
    return {
      ok: false,
      message: "Unable to verify user profile.",
    };
  }

  if (appUser.role !== "vendor") {
    return {
      ok: false,
      message: "Access denied. Vendors only.",
    };
  }

  const { data: vendor, error: vendorError } = await supabase
    .from("vendors")
    .select("id, business_name, status")
    .eq("user_id", user.id)
    .single();

  if (vendorError || !vendor) {
    return {
      ok: false,
      message: "Vendor profile not found.",
    };
  }

  if (vendor.status === "pending") {
    return {
      ok: false,
      message: "Your vendor account is pending approval.",
    };
  }

  if (vendor.status === "suspended") {
    return {
      ok: false,
      message: "Your vendor account has been suspended.",
    };
  }

  if (vendor.status !== "approved") {
    return {
      ok: false,
      message: "Unknown vendor status.",
    };
  }

  return {
    ok: true,
    vendor,
    user,
  };
}

async function fetchOrders(vendorId) {
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select(
      "id, student_id, vendor_id, status, payment_status, payment_provider, transaction_id, paid_at, created_at, updated_at"
    )
    .eq("vendor_id", vendorId)
    .eq("payment_status", "paid")
    .in("status", ACTIVE_VENDOR_STATUSES)
    .order("created_at", { ascending: false });

  if (ordersError) {
    throw new Error(ordersError.message);
  }

  if (!orders || orders.length === 0) {
    return [];
  }

  const enrichedOrders = await Promise.all(
    orders.map(async (order) => {
      const { data: orderItems, error: itemsError } = await supabase
        .from("order_items")
        .select("id, menu_item_id, quantity, price")
        .eq("order_id", order.id);

      if (itemsError) {
        return {
          ...order,
          items: [],
          studentEmail: "Unknown",
          total_price: 0,
        };
      }

      const itemsWithNames = await Promise.all(
        (orderItems || []).map(async (item) => {
          const { data: menuItem } = await supabase
            .from("menu_items")
            .select("name")
            .eq("id", item.menu_item_id)
            .single();

          return {
            ...item,
            name: menuItem?.name || "Unknown item",
          };
        })
      );

      const totalPrice = itemsWithNames.reduce((sum, item) => {
        return sum + Number(item.price) * Number(item.quantity);
      }, 0);

      const { data: student } = await supabase
        .from("users")
        .select("email")
        .eq("id", order.student_id)
        .single();

      return {
        ...order,
        items: itemsWithNames,
        studentEmail: student?.email || "Unknown",
        total_price: totalPrice,
      };
    })
  );

  return enrichedOrders;
}

async function updateOrderStatus(orderId, nextStatus, currentStatus) {
  if (!currentVendorId) {
    alert("Vendor not loaded. Please refresh the page.");
    return;
  }

  if (!isValidStatusTransition(currentStatus, nextStatus)) {
    alert("Invalid status change.");
    return;
  }

  const { data, error } = await supabase
    .from("orders")
    .update({
      status: nextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("vendor_id", currentVendorId)
    .eq("payment_status", "paid")
    .eq("status", currentStatus)
    .select("id, status, payment_status")
    .maybeSingle();

  if (error) {
    console.error("Update order status error:", error);
    alert("Failed to update order.");
    return;
  }

  if (!data) {
    alert(
      "Order could not be updated. It may be unpaid, already completed, or already changed by another user."
    );
    await loadOrders();
    return;
  }

  await loadOrders();
}

function createOrderCard(order) {
  const card = document.createElement("div");
  card.className = "order-card";

  const statusClass = `status-${order.status}`;

  const itemsHtml = order.items.length
    ? order.items
        .map(
          (item) => `
            <li>
              <span class="item-name">${escapeHtml(item.name)}</span>
              <span class="item-qty">× ${escapeHtml(item.quantity)}</span>
              <span class="item-price">${formatCurrency(item.price)}</span>
            </li>
          `
        )
        .join("")
    : `<li>No items found.</li>`;

  card.innerHTML = `
    <div class="order-header">
      <h3>Order #${escapeHtml(order.id.slice(0, 8))}</h3>
      <span class="status-badge ${statusClass}">
        ${escapeHtml(order.status)}
      </span>
    </div>

    <div class="payment-info">
      <p class="payment-badge">✓ Payment Received</p>

      ${
        order.payment_provider
          ? `<p class="payment-provider">via ${escapeHtml(order.payment_provider)}</p>`
          : ``
      }

      ${
        order.transaction_id
          ? `<p class="payment-provider">Transaction: ${escapeHtml(order.transaction_id)}</p>`
          : ``
      }

      ${
        order.paid_at
          ? `<p class="payment-provider">Paid at: ${formatDate(order.paid_at)}</p>`
          : ``
      }
    </div>

    <div class="order-info">
      <p>
        <strong>Student:</strong>
        <span class="order-value">${escapeHtml(order.studentEmail)}</span>
      </p>

      <p>
        <strong>Placed:</strong>
        <span class="order-value">${formatDate(order.created_at)}</span>
      </p>
    </div>

    <div class="items-section">
      <strong>Items:</strong>
      <ul class="items-list">
        ${itemsHtml}
      </ul>
    </div>

    <div class="order-total">
      <span>Total:</span>
      <span class="total-amount">${formatCurrency(order.total_price)}</span>
    </div>

    <div class="order-actions">
      ${
        order.status === "received"
          ? `<button class="prep-btn" type="button">Start Preparing</button>`
          : ``
      }

      ${
        order.status === "preparing"
          ? `<button class="ready-btn" type="button">Mark as Ready</button>`
          : ``
      }

      ${
        order.status === "ready"
          ? `<button class="complete-btn" type="button">Order Complete</button>`
          : ``
      }
    </div>
  `;

  const prepBtn = card.querySelector(".prep-btn");
  const readyBtn = card.querySelector(".ready-btn");
  const completeBtn = card.querySelector(".complete-btn");

  if (prepBtn) {
    prepBtn.addEventListener("click", async () => {
      await updateOrderStatus(order.id, "preparing", order.status);
    });
  }

  if (readyBtn) {
    readyBtn.addEventListener("click", async () => {
      await updateOrderStatus(order.id, "ready", order.status);
    });
  }

  if (completeBtn) {
    completeBtn.addEventListener("click", async () => {
      await updateOrderStatus(order.id, "complete", order.status);
    });
  }

  return card;
}

function renderOrders(orders) {
  ordersContainer.innerHTML = "";

  if (!orders || orders.length === 0) {
    showEmpty();
    return;
  }

  const activeOrders = orders.filter((order) => {
    return order.status === "received" || order.status === "preparing";
  });

  const readyOrders = orders.filter((order) => {
    return order.status === "ready";
  });

  if (activeOrders.length > 0) {
    const activeTitle = document.createElement("h2");
    activeTitle.className = "section-title";
    activeTitle.textContent = "Active Orders";
    ordersContainer.appendChild(activeTitle);

    activeOrders.forEach((order) => {
      ordersContainer.appendChild(createOrderCard(order));
    });
  }

  if (readyOrders.length > 0) {
    const readyTitle = document.createElement("h2");
    readyTitle.className = "section-title";
    readyTitle.textContent = "Ready for Pickup";
    ordersContainer.appendChild(readyTitle);

    readyOrders.forEach((order) => {
      ordersContainer.appendChild(createOrderCard(order));
    });
  }

  showOrders();
}

async function loadOrders() {
  if (!currentVendorId) {
    showError("Vendor ID not set.");
    return;
  }

  try {
    isRefreshing = true;
    refreshBtn.disabled = true;
    showLoading();

    const orders = await fetchOrders(currentVendorId);
    renderOrders(orders);
  } catch (error) {
    console.error("Load orders error:", error);
    showError(`Error loading orders: ${error.message}`);
  } finally {
    isRefreshing = false;
    refreshBtn.disabled = false;
  }
}

async function silentRefresh() {
  if (!currentVendorId || isRefreshing) return;

  try {
    const orders = await fetchOrders(currentVendorId);
    renderOrders(orders);
  } catch (error) {
    console.warn("Silent refresh failed:", error);
  }
}

function startAutoRefresh() {
  autoRefreshInterval = setInterval(() => {
    silentRefresh();
  }, 30000);
}

function stopAutoRefresh() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
  }
}

refreshBtn?.addEventListener("click", loadOrders);
retryBtn?.addEventListener("click", loadOrders);

async function initializePage() {
  const authResult = await getApprovedVendorAuth();

  if (!authResult.ok) {
    showError(authResult.message);
    return;
  }

  currentVendorId = authResult.vendor.id;

  await loadOrders();
  startAutoRefresh();

  window.addEventListener("beforeunload", stopAutoRefresh);
}

document.addEventListener("DOMContentLoaded", initializePage);

export {
  ACTIVE_VENDOR_STATUSES,
  STATUS_TRANSITIONS,
  escapeHtml,
  formatDate,
  formatCurrency,
  showLoading,
  showError,
  showOrders,
  showEmpty,
  isValidStatusTransition,
  getApprovedVendorAuth,
  fetchOrders,
  updateOrderStatus,
  createOrderCard,
  renderOrders,
  loadOrders,
  silentRefresh,
  startAutoRefresh,
  stopAutoRefresh,
  initializePage,
};