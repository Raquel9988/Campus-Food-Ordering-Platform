const SUPABASE_URL = "https://sqbscxfolbckikrzxqhr.supabase.co";
const SUPABASE_KEY = "sb_publishable_Zw_iCK1n54xXGPuDWALWQQ_k2cOQWay";

const ACKNOWLEDGED_READY_ORDERS_KEY_PREFIX = "acknowledged_ready_orders";

const fallbackStorage = {
  getItem() {
    return null;
  },
  setItem() {},
  removeItem() {},
};

const fallbackWindow = {
  location: {
    href: "",
  },
  addEventListener() {},
  confirm() {
    return true;
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
   SAFE HTML
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

/* ========================================
   DASHBOARD CONTROLLER
======================================== */

export function createStudentDashboardController({
  supabaseClient,
  documentRef = typeof document !== "undefined" ? document : null,
  windowRef = typeof window !== "undefined" ? window : fallbackWindow,
  localStorageRef =
    typeof localStorage !== "undefined" ? localStorage : fallbackStorage,
  setTimeoutRef = typeof setTimeout !== "undefined" ? setTimeout : () => {},
  consoleRef = console,
}) {
  let dashboardStarted = false;
  let activeOrdersRefreshTimer = null;

  function getElement(id) {
    return documentRef?.getElementById(id) || null;
  }

  function normaliseStatus(value) {
    return String(value || "").trim().toLowerCase();
  }

  function isPaidReadyOrder(order) {
    return (
      normaliseStatus(order?.payment_status) === "paid" &&
      normaliseStatus(order?.status) === "ready"
    );
  }

  function showToast(message) {
    const toast = getElement("toast");

    if (!toast) {
      return;
    }

    toast.textContent = message;
    toast.classList.remove("hidden");
    toast.classList.add("show");

    setTimeoutRef(() => {
      toast.classList.remove("show");
      toast.classList.add("hidden");
    }, 3000);
  }

  async function getStudentAuth() {
    const {
      data: { user },
      error,
    } = await supabaseClient.auth.getUser();

    if (error || !user) {
      windowRef.location.href = "../auth/login.html";
      return null;
    }

    const { data: appUser, error: userError } = await supabaseClient
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userError || !appUser || appUser.role !== "student") {
      await supabaseClient.auth.signOut();
      windowRef.location.href = "../auth/login.html";
      return null;
    }

    return user;
  }

  function getSeenReadyOrders() {
    try {
      return JSON.parse(localStorageRef.getItem("seen_ready_orders") || "[]");
    } catch {
      return [];
    }
  }

  function saveSeenReadyOrders(orderIds) {
    localStorageRef.setItem("seen_ready_orders", JSON.stringify(orderIds));
  }

  function getAcknowledgedReadyOrdersKey(userId) {
    return `${ACKNOWLEDGED_READY_ORDERS_KEY_PREFIX}_${userId}`;
  }

  function getAcknowledgedReadyOrders(userId) {
    if (!userId) {
      return [];
    }

    try {
      const saved = JSON.parse(
        localStorageRef.getItem(getAcknowledgedReadyOrdersKey(userId)) || "[]"
      );

      return Array.isArray(saved) ? saved.map(String) : [];
    } catch {
      return [];
    }
  }

  function saveAcknowledgedReadyOrders(userId, orderIds) {
    if (!userId) {
      return [];
    }

    const uniqueOrderIds = [...new Set((orderIds || []).map(String))];

    localStorageRef.setItem(
      getAcknowledgedReadyOrdersKey(userId),
      JSON.stringify(uniqueOrderIds)
    );

    return uniqueOrderIds;
  }

  function addAcknowledgedReadyOrders(userId, orderIds) {
    const existing = getAcknowledgedReadyOrders(userId);
    const merged = [...new Set([...existing, ...(orderIds || []).map(String)])];

    return saveAcknowledgedReadyOrders(userId, merged);
  }

  function isReadyOrderAcknowledged(userId, orderId) {
    return getAcknowledgedReadyOrders(userId).includes(String(orderId));
  }

  function ensureActiveOrdersDot() {
    let dot = getElement("active-orders-dot");

    if (dot) {
      return dot;
    }

    const activeOrdersButton = getElement("active-orders");

    if (!activeOrdersButton || !documentRef?.createElement) {
      return null;
    }

    dot = documentRef.createElement("span");
    dot.id = "active-orders-dot";
    dot.className = "notification-dot hidden";
    dot.setAttribute("aria-label", "Ready order notification");
    dot.setAttribute("title", "You have an order ready for pickup");

    Object.assign(dot.style, {
      position: "absolute",
      top: "7px",
      right: "8px",
      width: "12px",
      height: "12px",
      borderRadius: "50%",
      backgroundColor: "#dc2626",
      border: "2px solid #ffffff",
      boxShadow: "0 0 0 2px rgba(220, 38, 38, 0.25)",
      display: "none",
      zIndex: "10",
    });

    if (!activeOrdersButton.style.position) {
      activeOrdersButton.style.position = "relative";
    }

    activeOrdersButton.appendChild(dot);

    return dot;
  }

  function showActiveOrdersDot() {
    const dot = ensureActiveOrdersDot();

    if (!dot) {
      return;
    }

    dot.hidden = false;
    dot.classList.remove("hidden");
    dot.style.display = "inline-block";
  }

  function hideActiveOrdersDot() {
    const dot = ensureActiveOrdersDot();

    if (!dot) {
      return;
    }

    dot.hidden = true;
    dot.classList.add("hidden");
    dot.style.display = "none";
  }

  async function fetchReadyOrderIds(userId) {
    const { data, error } = await supabaseClient
      .from("orders")
      .select("id, status, payment_status")
      .eq("student_id", userId)
      .eq("payment_status", "paid")
      .eq("status", "ready");

    if (error) {
      consoleRef.error("Ready orders check error:", error);
      return [];
    }

    return (data || [])
      .filter((order) => isPaidReadyOrder(order))
      .filter((order) => !isReadyOrderAcknowledged(userId, order.id))
      .map((order) => order.id);
  }

  async function fetchReadyOrdersForAcknowledgement(userId) {
    const { data: readyOrders, error } = await supabaseClient
      .from("orders")
      .select("id, vendor_id, status, payment_status, created_at, updated_at")
      .eq("student_id", userId)
      .eq("payment_status", "paid")
      .eq("status", "ready")
      .order("updated_at", { ascending: false });

    if (error) {
      consoleRef.error("Ready order acknowledgement fetch error:", error);
      return [];
    }

    const unacknowledgedReadyOrders = (readyOrders || []).filter((order) => {
      return isPaidReadyOrder(order) && !isReadyOrderAcknowledged(userId, order.id);
    });

    if (unacknowledgedReadyOrders.length === 0) {
      return [];
    }

    const enrichedOrders = await Promise.all(
      unacknowledgedReadyOrders.map(async (order) => {
        const vendorName = await fetchVendorName(order.vendor_id);
        const items = await fetchOrderItemNames(order.id);

        return {
          ...order,
          vendorName,
          items,
        };
      })
    );

    return enrichedOrders;
  }

  async function fetchVendorName(vendorId) {
    if (!vendorId) {
      return "Unknown vendor";
    }

    const { data, error } = await supabaseClient
      .from("vendors")
      .select("business_name")
      .eq("id", vendorId)
      .maybeSingle();

    if (error) {
      consoleRef.error("Fetch vendor name error:", error);
      return "Unknown vendor";
    }

    return data?.business_name || "Unknown vendor";
  }

  async function fetchOrderItemNames(orderId) {
    const { data: orderItems, error } = await supabaseClient
      .from("order_items")
      .select("menu_item_id, quantity")
      .eq("order_id", orderId);

    if (error || !orderItems || orderItems.length === 0) {
      return [];
    }

    const items = await Promise.all(
      orderItems.map(async (item) => {
        const { data: menuItem } = await supabaseClient
          .from("menu_items")
          .select("name")
          .eq("id", item.menu_item_id)
          .maybeSingle();

        const name = menuItem?.name || "Unknown item";
        const quantity = item.quantity || 1;

        return `${quantity} × ${name}`;
      })
    );

    return items;
  }

  function buildReadyOrdersMessage(readyOrders) {
    const orderLines = readyOrders
      .map((order, index) => {
        const orderNumber = order.id ? String(order.id).slice(0, 8) : "Unknown";
        const itemText =
          order.items && order.items.length > 0
            ? order.items.join(", ")
            : "Items unavailable";

        return `${index + 1}. Order #${orderNumber} from ${order.vendorName}\n   Items: ${itemText}`;
      })
      .join("\n\n");

    return `Your order is ready for pickup.

${orderLines}

Please collect your order from the vendor when you are available.

A confirmation email may also have been sent to your registered email address. Please check your inbox, and also check your spam or junk folder if you do not see it.

Click OK once you have seen this message. The order will then move to Order History.`;
  }

  function buildReadyOrderCardsHtml(readyOrders) {
    return readyOrders
      .map((order, index) => {
        const orderNumber = order.id ? String(order.id).slice(0, 8) : "Unknown";

        const itemText =
          order.items && order.items.length > 0
            ? order.items.join(", ")
            : "Items unavailable";

        return `
          <article class="ready-order-card">
            <h3>${index + 1}. Order #${escapeHtml(orderNumber)}</h3>

            <p>
              <strong>Vendor:</strong>
              ${escapeHtml(order.vendorName || "Unknown vendor")}
            </p>

            <p>
              <strong>Items:</strong>
              ${escapeHtml(itemText)}
            </p>
          </article>
        `;
      })
      .join("");
  }

  function showReadyOrdersDialog(readyOrders) {
    const modal = getElement("ready-orders-modal");
    const ordersContainer = getElement("ready-modal-orders");
    const orderCount = getElement("ready-modal-count");
    const confirmButton = getElement("ready-modal-confirm");
    const cancelButton = getElement("ready-modal-cancel");
    const closeButton = getElement("ready-modal-close");

    if (
      !modal ||
      !ordersContainer ||
      !orderCount ||
      !confirmButton ||
      !cancelButton ||
      !closeButton
    ) {
      const message = buildReadyOrdersMessage(readyOrders);

      return Promise.resolve(
        typeof windowRef.confirm === "function"
          ? windowRef.confirm(message)
          : true
      );
    }

    return new Promise((resolve) => {
      const orderWord = readyOrders.length === 1 ? "order" : "orders";

      ordersContainer.innerHTML = buildReadyOrderCardsHtml(readyOrders);
      orderCount.textContent = `${readyOrders.length} ready ${orderWord}`;

      modal.classList.remove("hidden");
      modal.setAttribute("aria-hidden", "false");

      documentRef?.body?.classList?.add("modal-open");

      function closeModal(result) {
        modal.classList.add("hidden");
        modal.setAttribute("aria-hidden", "true");

        documentRef?.body?.classList?.remove("modal-open");

        confirmButton.onclick = null;
        cancelButton.onclick = null;
        closeButton.onclick = null;
        modal.onclick = null;

        resolve(result);
      }

      confirmButton.onclick = () => {
        closeModal(true);
      };

      cancelButton.onclick = () => {
        closeModal(false);
      };

      closeButton.onclick = () => {
        closeModal(false);
      };

      modal.onclick = (event) => {
        if (event.target === modal) {
          closeModal(false);
        }
      };

      confirmButton.focus?.();
    });
  }

  async function completeReadyOrders(userId, orderIds) {
    if (!orderIds || orderIds.length === 0) {
      return false;
    }

    await Promise.all(
      orderIds.map(async (orderId) => {
        const { error } = await supabaseClient
          .from("orders")
          .update({
            status: "complete",
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId)
          .eq("student_id", userId)
          .eq("payment_status", "paid")
          .eq("status", "ready");

        if (error) {
          consoleRef.error("Best-effort complete ready order error:", error);
        }
      })
    );

    addAcknowledgedReadyOrders(userId, orderIds);
    saveSeenReadyOrders(orderIds);

    return true;
  }

  async function updateActiveOrdersDot(userId) {
    const readyOrderIds = await fetchReadyOrderIds(userId);

    if (readyOrderIds.length > 0) {
      showActiveOrdersDot();
      return;
    }

    hideActiveOrdersDot();
  }

  async function markReadyOrdersAsSeen(userId) {
    const readyOrderIds = await fetchReadyOrderIds(userId);

    addAcknowledgedReadyOrders(userId, readyOrderIds);
    saveSeenReadyOrders(readyOrderIds);
    hideActiveOrdersDot();
  }

  async function acknowledgeReadyOrders(userId) {
    const readyOrders = await fetchReadyOrdersForAcknowledgement(userId);

    if (!readyOrders || readyOrders.length === 0) {
      hideActiveOrdersDot();
      windowRef.location.href = "my-orders.html?filter=active";
      return;
    }

    showActiveOrdersDot();

    const confirmed = await showReadyOrdersDialog(readyOrders);

    if (!confirmed) {
      showActiveOrdersDot();
      return;
    }

    const readyOrderIds = readyOrders.map((order) => order.id);

    await completeReadyOrders(userId, readyOrderIds);

    hideActiveOrdersDot();
    showToast("Ready order acknowledged. It will now appear in Order History.");

    windowRef.location.href = "my-orders.html?filter=history";
  }

  function subscribeToOrders(userId) {
    return supabaseClient
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
            normaliseStatus(newOrder.payment_status) === "paid" &&
            normaliseStatus(oldOrder?.payment_status) !== "paid"
          ) {
            showToast("Payment confirmed. Your order has been received.");
          }

          if (
            newOrder &&
            isPaidReadyOrder(newOrder) &&
            !isReadyOrderAcknowledged(userId, newOrder.id)
          ) {
            showToast("Your order is ready for pickup.");
            showActiveOrdersDot();
          }

          if (
            newOrder &&
            normaliseStatus(newOrder.status) === "complete" &&
            normaliseStatus(oldOrder?.status) !== "complete"
          ) {
            showToast("Your order has moved to Order History.");
          }

          await updateActiveOrdersDot(userId);
        }
      )
      .subscribe();
  }

  function startActiveOrdersRefresh(userId) {
    if (activeOrdersRefreshTimer || typeof setInterval === "undefined") {
      return;
    }

    activeOrdersRefreshTimer = setInterval(() => {
      updateActiveOrdersDot(userId);
    }, 10000);
  }

  function stopActiveOrdersRefresh() {
    if (!activeOrdersRefreshTimer || typeof clearInterval === "undefined") {
      return;
    }

    clearInterval(activeOrdersRefreshTimer);
    activeOrdersRefreshTimer = null;
  }

  async function loadVendors() {
    const vendorsList = getElement("vendors-list");

    if (!vendorsList) {
      return;
    }

    vendorsList.innerHTML = `
      <p class="loading-text">
        <span class="spinner-sm"></span>
        Loading vendors…
      </p>
    `;

    const { data: vendors, error } = await supabaseClient
      .from("vendors")
      .select("id, business_name")
      .eq("status", "approved")
      .order("business_name", { ascending: true });

    if (error) {
      consoleRef.error("Load vendors error:", error);

      vendorsList.innerHTML = `
        <p class="error-text">
          Error loading vendors: ${escapeHtml(error.message || "Unknown error")}
        </p>
      `;

      return;
    }

    if (!vendors || vendors.length === 0) {
      vendorsList.innerHTML = `<p class="empty-text">No vendors available.</p>`;
      return;
    }

    vendorsList.innerHTML = "";

    vendors.forEach((vendor) => {
      const card = documentRef.createElement("section");
      card.className = "vendor-card";

      card.innerHTML = `
        <h4>${escapeHtml(vendor.business_name)}</h4>
        <p>Browse this vendor's menu and add food to your cart.</p>
        <button type="button">View Menu</button>
      `;

      const button = card.querySelector("button");

      if (button) {
        button.onclick = () => {
          windowRef.location.href = `student-menu.html?vendorId=${vendor.id}`;
        };
      }

      vendorsList.appendChild(card);
    });
  }

  function setupEvents(user) {
    getElement("active-orders")?.addEventListener("click", async () => {
      await acknowledgeReadyOrders(user.id);
    });

    getElement("order-history")?.addEventListener("click", () => {
      windowRef.location.href = "my-orders.html?filter=history";
    });

    getElement("view-cart")?.addEventListener("click", () => {
      windowRef.location.href = "student-cart.html";
    });

    getElement("logout")?.addEventListener("click", async () => {
      stopActiveOrdersRefresh();
      await supabaseClient.auth.signOut();
      windowRef.location.href = "../auth/login.html";
    });
  }

  async function handlePageLoad() {
    if (dashboardStarted) {
      return;
    }

    dashboardStarted = true;

    try {
      const user = await getStudentAuth();

      if (!user) {
        return;
      }

      const userInfo = getElement("user-info");

      if (userInfo) {
        userInfo.textContent = `Logged in as: ${user.email}`;
      }

      ensureActiveOrdersDot();

      await loadVendors();
      await updateActiveOrdersDot(user.id);

      subscribeToOrders(user.id);
      startActiveOrdersRefresh(user.id);
      setupEvents(user);
    } catch (error) {
      consoleRef.error("Student dashboard load error:", error);

      const vendorsList = getElement("vendors-list");

      if (vendorsList) {
        vendorsList.innerHTML = `
          <p class="error-text">
            Could not load dashboard: ${escapeHtml(
              error?.message || "Unknown error"
            )}
          </p>
        `;
      }
    }
  }

  function setupStudentDashboardPage() {
    windowRef.addEventListener("load", handlePageLoad);

    documentRef?.addEventListener?.("DOMContentLoaded", handlePageLoad);

    if (
      documentRef?.readyState === "interactive" ||
      documentRef?.readyState === "complete"
    ) {
      handlePageLoad();
    }
  }

  return {
    showToast,
    getStudentAuth,
    getSeenReadyOrders,
    saveSeenReadyOrders,
    getAcknowledgedReadyOrdersKey,
    getAcknowledgedReadyOrders,
    saveAcknowledgedReadyOrders,
    addAcknowledgedReadyOrders,
    isReadyOrderAcknowledged,
    showActiveOrdersDot,
    hideActiveOrdersDot,
    fetchReadyOrderIds,
    fetchReadyOrdersForAcknowledgement,
    fetchVendorName,
    fetchOrderItemNames,
    buildReadyOrdersMessage,
    buildReadyOrderCardsHtml,
    showReadyOrdersDialog,
    completeReadyOrders,
    updateActiveOrdersDot,
    markReadyOrdersAsSeen,
    acknowledgeReadyOrders,
    subscribeToOrders,
    loadVendors,
    setupEvents,
    handlePageLoad,
    setupStudentDashboardPage,
  };
}

/* ========================================
   BROWSER INIT
======================================== */

export async function setupStudentDashboardPage({
  supabaseClient,
  documentRef = typeof document !== "undefined" ? document : null,
  windowRef = typeof window !== "undefined" ? window : fallbackWindow,
  localStorageRef =
    typeof localStorage !== "undefined" ? localStorage : fallbackStorage,
  setTimeoutRef = typeof setTimeout !== "undefined" ? setTimeout : () => {},
  consoleRef = console,
} = {}) {
  const client = supabaseClient || (await createDefaultSupabaseClient());

  const controller = createStudentDashboardController({
    supabaseClient: client,
    documentRef,
    windowRef,
    localStorageRef,
    setTimeoutRef,
    consoleRef,
  });

  controller.setupStudentDashboardPage();

  return controller;
}

const isVitestEnvironment =
  (typeof process !== "undefined" &&
    (process.env?.VITEST === "true" || process.env?.NODE_ENV === "test")) ||
  (typeof navigator !== "undefined" &&
    navigator.userAgent.toLowerCase().includes("jsdom"));

if (
  typeof document !== "undefined" &&
  typeof window !== "undefined" &&
  !isVitestEnvironment
) {
  setupStudentDashboardPage();
}