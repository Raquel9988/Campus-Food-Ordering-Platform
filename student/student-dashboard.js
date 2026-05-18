const SUPABASE_URL = "https://sqbscxfolbckikrzxqhr.supabase.co";
const SUPABASE_KEY = "sb_publishable_Zw_iCK1n54xXGPuDWALWQQ_k2cOQWay";

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

  function getElement(id) {
    return documentRef?.getElementById(id) || null;
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

  function showActiveOrdersDot() {
    getElement("active-orders-dot")?.classList.remove("hidden");
  }

  function hideActiveOrdersDot() {
    getElement("active-orders-dot")?.classList.add("hidden");
  }

  async function fetchReadyOrderIds(userId) {
    const { data, error } = await supabaseClient
      .from("orders")
      .select("id")
      .eq("student_id", userId)
      .eq("payment_status", "paid")
      .eq("status", "ready");

    if (error) {
      consoleRef.error("Ready orders check error:", error);
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
      return;
    }

    hideActiveOrdersDot();
  }

  async function markReadyOrdersAsSeen(userId) {
    const readyOrderIds = await fetchReadyOrderIds(userId);

    saveSeenReadyOrders(readyOrderIds);
    hideActiveOrdersDot();
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
      await markReadyOrdersAsSeen(user.id);
      windowRef.location.href = "my-orders.html?filter=active";
    });

    getElement("order-history")?.addEventListener("click", () => {
      windowRef.location.href = "my-orders.html?filter=history";
    });

    getElement("view-cart")?.addEventListener("click", () => {
      windowRef.location.href = "student-cart.html";
    });

    getElement("logout")?.addEventListener("click", async () => {
      await supabaseClient.auth.signOut();
      windowRef.location.href = "../auth/login.html";
    });
  }

  async function handlePageLoad() {
    try {
      const user = await getStudentAuth();

      if (!user) {
        return;
      }

      const userInfo = getElement("user-info");

      if (userInfo) {
        userInfo.textContent = `Logged in as: ${user.email}`;
      }

      await loadVendors();
      await updateActiveOrdersDot(user.id);
      subscribeToOrders(user.id);
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

  async function startDashboardOnce() {
    if (dashboardStarted) {
      return;
    }

    dashboardStarted = true;
    await handlePageLoad();
  }

  function setupStudentDashboardPage() {
    if (documentRef?.readyState === "loading") {
      documentRef.addEventListener("DOMContentLoaded", startDashboardOnce, {
        once: true,
      });

      return;
    }

    startDashboardOnce();
  }

  return {
    showToast,
    getStudentAuth,
    getSeenReadyOrders,
    saveSeenReadyOrders,
    showActiveOrdersDot,
    hideActiveOrdersDot,
    fetchReadyOrderIds,
    updateActiveOrdersDot,
    markReadyOrdersAsSeen,
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
