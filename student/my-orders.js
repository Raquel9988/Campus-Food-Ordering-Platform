const SUPABASE_URL = "https://sqbscxfolbckikrzxqhr.supabase.co";
const SUPABASE_KEY = "sb_publishable_Zw_iCK1n54xXGPuDWALWQQ_k2cOQWay";

export const ACTIVE_ORDER_STATUSES = ["received", "preparing", "ready"];
export const HISTORY_ORDER_STATUSES = ["complete"];
export const VALID_FILTERS = ["active", "history"];

const fallbackWindow = {
  location: {
    href: "",
    search: "",
  },

  history: {
    replaceState() {},
  },
};

async function createDefaultSupabaseClient() {
  const supabaseModuleUrl =
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

  const { createClient } = await import(
    /* @vite-ignore */ supabaseModuleUrl
  );

  return createClient(SUPABASE_URL, SUPABASE_KEY);
}

/* ========================================
   Utility Functions
======================================== */

export function escapeHtml(text) {
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

export function formatDate(dateString) {
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

export function formatCurrency(amount) {
  return `R${Number(amount || 0).toFixed(2)}`;
}

export function getSafeOrderId(orderId) {
  return String(orderId || "").substring(0, 6);
}

/* ========================================
   Order Status Helpers
======================================== */

export function isPaidOrder(order) {
  return order?.payment_status === "paid";
}

export function isActiveOrder(order) {
  return isPaidOrder(order) && ACTIVE_ORDER_STATUSES.includes(order?.status);
}

export function isHistoryOrder(order) {
  return isPaidOrder(order) && HISTORY_ORDER_STATUSES.includes(order?.status);
}

export function filterOrders(orders, filter) {
  if (filter === "history") {
    return orders.filter((order) => isHistoryOrder(order));
  }

  return orders.filter((order) => isActiveOrder(order));
}

export function getDisplayStatusKey(order) {
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

export function getStatusClass(order) {
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

export function getStudentOrderStatusText(order) {
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

export function getPaymentStatusText(status) {
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

export function getEmptyMessage(filter) {
  if (filter === "history") {
    return {
      title: "No order history",
      message:
        "Completed orders will appear here after the vendor marks them as complete.",
    };
  }

  return {
    title: "No active orders",
    message: "You have no paid orders in progress right now.",
  };
}

export function getInitialFilter(windowRef = fallbackWindow) {
  const search = windowRef?.location?.search || "";
  const filter = new URLSearchParams(search).get("filter") || "active";

  if (!VALID_FILTERS.includes(filter)) {
    return "active";
  }

  return filter;
}

/* ========================================
   Controller
======================================== */

export function createMyOrdersController({
  supabaseClient,
  documentRef = typeof document !== "undefined" ? document : null,
  windowRef = typeof window !== "undefined" ? window : fallbackWindow,
  setTimeoutRef = typeof setTimeout !== "undefined" ? setTimeout : () => {},
  consoleRef = console,
}) {
  let pageStarted = false;
  let realtimeSubscription = null;

  const state = {
    currentStudentId: null,
    allOrders: [],
    currentFilter: getInitialFilter(windowRef),
  };

  function getElement(id) {
    return documentRef?.getElementById(id) || null;
  }

  function getFilterTabs() {
    return Array.from(documentRef?.querySelectorAll(".filter-tab") || []);
  }

  function showToast(message) {
    if (!documentRef?.createElement || !documentRef?.body) {
      return;
    }

    const toast = documentRef.createElement("section");
    toast.textContent = message;

    toast.style.position = "fixed";
    toast.style.bottom = "20px";
    toast.style.right = "20px";
    toast.style.background = "black";
    toast.style.color = "white";
    toast.style.padding = "10px 15px";
    toast.style.borderRadius = "5px";
    toast.style.zIndex = "1000";

    documentRef.body.appendChild(toast);

    setTimeoutRef(() => {
      toast.remove();
    }, 3000);
  }

  function showLoading() {
    getElement("loading-container")?.classList.remove("hidden");
    getElement("error-container")?.classList.add("hidden");
    getElement("orders-container")?.classList.add("hidden");
    getElement("empty-state")?.classList.add("hidden");
  }

  function showError(message) {
    getElement("loading-container")?.classList.add("hidden");
    getElement("error-container")?.classList.remove("hidden");
    getElement("orders-container")?.classList.add("hidden");
    getElement("empty-state")?.classList.add("hidden");

    const errorText = getElement("error-text");

    if (errorText) {
      errorText.textContent = message;
    }
  }

  function showOrders() {
    getElement("loading-container")?.classList.add("hidden");
    getElement("error-container")?.classList.add("hidden");
    getElement("orders-container")?.classList.remove("hidden");
    getElement("empty-state")?.classList.add("hidden");
  }

  function showEmpty(filter) {
    getElement("loading-container")?.classList.add("hidden");
    getElement("error-container")?.classList.add("hidden");
    getElement("orders-container")?.classList.add("hidden");
    getElement("empty-state")?.classList.remove("hidden");

    const emptyText = getEmptyMessage(filter);

    const emptyTitle = getElement("empty-title");
    const emptyMessage = getElement("empty-message");

    if (emptyTitle) {
      emptyTitle.textContent = emptyText.title;
    }

    if (emptyMessage) {
      emptyMessage.textContent = emptyText.message;
    }
  }

  function setActiveTab(filter) {
    getFilterTabs().forEach((button) => {
      button.classList.toggle("active", button.dataset.filter === filter);
    });
  }

  function updateUrlFilter(filter) {
    const currentHref =
      windowRef?.location?.href || "https://test.local/student/my-orders.html";

    const url = new URL(currentHref);
    url.searchParams.set("filter", filter);

    windowRef?.history?.replaceState?.({}, "", url);
  }

  async function checkStudentAuth() {
    showLoading();

    const {
      data: { user },
      error,
    } = await supabaseClient.auth.getUser();

    if (error) {
      consoleRef.error("Auth error:", error);
      showError("Could not check your login session.");
      return null;
    }

    if (!user) {
      windowRef.location.href = "../auth/login.html";
      return null;
    }

    return user.id;
  }

  async function fetchOrders(studentId) {
    const { data: orders, error } = await supabaseClient
      .from("orders")
      .select(
        "id, student_id, vendor_id, status, created_at, updated_at, payment_status, payment_provider, payment_amount, transaction_id, paid_at"
      )
      .eq("student_id", studentId)
      .eq("payment_status", "paid")
      .in("status", [...ACTIVE_ORDER_STATUSES, ...HISTORY_ORDER_STATUSES])
      .order("created_at", { ascending: false });

    if (error) {
      consoleRef.error("Fetch orders error:", error);
      throw new Error("Could not load your orders.");
    }

    if (!orders || orders.length === 0) {
      return [];
    }

    return await Promise.all(
      orders.map(async (order) => {
        const { data: items, error: itemsError } = await supabaseClient
          .from("order_items")
          .select("menu_item_id, quantity, price")
          .eq("order_id", order.id);

        if (itemsError) {
          consoleRef.error("Fetch order items error:", itemsError);
        }

        const orderItems = items || [];

        const total = orderItems.reduce((sum, item) => {
          return sum + Number(item.price || 0) * Number(item.quantity || 0);
        }, 0);

        const itemsWithNames = await Promise.all(
          orderItems.map(async (item) => {
            const { data: menu } = await supabaseClient
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

        const { data: vendor } = await supabaseClient
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

  function createOrderCard(order) {
    const card = documentRef.createElement("article");
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
      ? `<p><strong>Payment Provider:</strong> ${escapeHtml(
          order.payment_provider
        )}</p>`
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
    const ordersContainer = getElement("orders-container");

    if (!ordersContainer) {
      return;
    }

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

  async function loadOrders() {
    try {
      showLoading();

      if (!state.currentStudentId) {
        state.currentStudentId = await checkStudentAuth();

        if (!state.currentStudentId) {
          return;
        }
      }

      state.allOrders = await fetchOrders(state.currentStudentId);
      renderOrders(state.allOrders, state.currentFilter);
    } catch (error) {
      consoleRef.error("Load orders error:", error);
      showError(error.message || "Could not load orders.");
    }
  }

  function subscribeToRealtime() {
    if (realtimeSubscription) {
      return realtimeSubscription;
    }

    realtimeSubscription = supabaseClient
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
          const relatedOrder = newOrder || oldOrder;

          if (!relatedOrder || relatedOrder.student_id !== state.currentStudentId) {
            return;
          }

          state.allOrders = await fetchOrders(state.currentStudentId);
          renderOrders(state.allOrders, state.currentFilter);

          if (
            oldOrder?.payment_status === "pending" &&
            newOrder?.payment_status === "paid"
          ) {
            showToast(
              `Payment confirmed for order #${getSafeOrderId(newOrder.id)}.`
            );
          }

          if (oldOrder?.status === "received" && newOrder?.status === "preparing") {
            showToast(`Order #${getSafeOrderId(newOrder.id)} is being prepared.`);
          }

          if (oldOrder?.status === "preparing" && newOrder?.status === "ready") {
            showToast(
              `Order #${getSafeOrderId(newOrder.id)} is ready for collection.`
            );
          }

          if (oldOrder?.status !== "complete" && newOrder?.status === "complete") {
            showToast(
              `Order #${getSafeOrderId(newOrder.id)} has moved to Order History.`
            );
          }
        }
      )
      .subscribe();

    return realtimeSubscription;
  }

  function handleFilterClick(button) {
    state.currentFilter = button.dataset.filter || "active";

    if (!VALID_FILTERS.includes(state.currentFilter)) {
      state.currentFilter = "active";
    }

    updateUrlFilter(state.currentFilter);
    renderOrders(state.allOrders, state.currentFilter);
  }

  async function initializePage() {
    if (pageStarted) {
      return;
    }

    pageStarted = true;

    state.currentStudentId = await checkStudentAuth();

    if (!state.currentStudentId) {
      return;
    }

    updateUrlFilter(state.currentFilter);

    await loadOrders();
    subscribeToRealtime();
  }

  function setupEventListeners() {
    const refreshBtn = getElement("refresh-btn");
    const retryBtn = getElement("retry-btn");
    const backBtn = getElement("back-btn");

    if (refreshBtn) {
      refreshBtn.onclick = loadOrders;
    }

    if (retryBtn) {
      retryBtn.onclick = loadOrders;
    }

    if (backBtn) {
      backBtn.onclick = () => {
        windowRef.location.href = "student-dashboard.html";
      };
    }

    getFilterTabs().forEach((button) => {
      button.onclick = () => {
        handleFilterClick(button);
      };
    });

    documentRef?.addEventListener?.("DOMContentLoaded", initializePage);

    if (
      documentRef?.readyState === "interactive" ||
      documentRef?.readyState === "complete"
    ) {
      initializePage();
    }
  }

  return {
    state,
    showToast,
    showLoading,
    showError,
    showOrders,
    showEmpty,
    setActiveTab,
    updateUrlFilter,
    checkStudentAuth,
    fetchOrders,
    createOrderCard,
    renderOrders,
    loadOrders,
    subscribeToRealtime,
    handleFilterClick,
    initializePage,
    setupEventListeners,
  };
}

export async function setupMyOrdersPage({
  supabaseClient,
  documentRef = typeof document !== "undefined" ? document : null,
  windowRef = typeof window !== "undefined" ? window : fallbackWindow,
  setTimeoutRef = typeof setTimeout !== "undefined" ? setTimeout : () => {},
  consoleRef = console,
} = {}) {
  const client = supabaseClient || (await createDefaultSupabaseClient());

  const controller = createMyOrdersController({
    supabaseClient: client,
    documentRef,
    windowRef,
    setTimeoutRef,
    consoleRef,
  });

  controller.setupEventListeners();

  return controller;
}

const isVitestEnvironment =
  typeof process !== "undefined" && process.env?.VITEST === "true";

if (
  typeof document !== "undefined" &&
  typeof window !== "undefined" &&
  !isVitestEnvironment
) {
  setupMyOrdersPage();
}
