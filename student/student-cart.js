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

export const PAY_BUTTON_HTML = `
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <polyline
      points="22 4 12 14.01 9 11.01"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
  Pay Now
`;

async function createDefaultSupabaseClient() {
  const supabaseModuleUrl =
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

  const { createClient } = await import(
    /* @vite-ignore */ supabaseModuleUrl
  );

  return createClient(SUPABASE_URL, SUPABASE_KEY);
}

function getDefaultLocalStorage() {
  return typeof localStorage !== "undefined" ? localStorage : fallbackStorage;
}

function getDefaultSessionStorage() {
  return typeof sessionStorage !== "undefined" ? sessionStorage : fallbackStorage;
}

function getDefaultDocument() {
  return typeof document !== "undefined" ? document : null;
}

function getDefaultWindow() {
  return typeof window !== "undefined" ? window : fallbackWindow;
}

function getDefaultFetch() {
  return typeof fetch !== "undefined" ? fetch : async () => {
    throw new Error("Fetch is not available.");
  };
}

/* =========================
   SAFE HTML HELPERS
========================= */

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

export function getVendorIds(cart) {
  return Object.keys(cart || {}).filter((vendorId) => {
    return cart[vendorId]?.items?.length > 0;
  });
}

export function isSuccessfulPaidOrder(order) {
  if (!order) {
    return false;
  }

  const successfulStatuses = ["received", "preparing", "ready", "complete"];

  return (
    order.payment_status === "paid" &&
    successfulStatuses.includes(order.status)
  );
}

export function clearPendingPaymentStorage(sessionStorageRef = getDefaultSessionStorage()) {
  sessionStorageRef.removeItem("campus_pending_order_id");
  sessionStorageRef.removeItem("campus_pending_cart_key");
}

/* =========================
   CART CONTROLLER
========================= */

export function createCartController({
  supabaseClient,
  localStorageRef = getDefaultLocalStorage(),
  sessionStorageRef = getDefaultSessionStorage(),
  documentRef = getDefaultDocument(),
  windowRef = getDefaultWindow(),
  fetchRef = getDefaultFetch(),
  setTimeoutRef = typeof setTimeout !== "undefined" ? setTimeout : () => {},
  alertRef = typeof alert !== "undefined" ? alert : () => {},
  confirmRef = typeof confirm !== "undefined" ? confirm : () => true,
  consoleRef = console,
}) {
  function showToast(message) {
    const toast = documentRef?.getElementById("toast");

    if (!toast) {
      alertRef(message);
      return;
    }

    toast.textContent = message;
    toast.classList.add("show");

    setTimeoutRef(() => {
      toast.classList.remove("show");
    }, 2500);
  }

  function showCartMessage(message, type = "warning") {
    const messageBox = documentRef?.getElementById("cart-message");

    if (!messageBox) {
      showToast(message);
      return;
    }

    messageBox.textContent = message;
    messageBox.className = `cart-message ${type}`;
    messageBox.classList.remove("hidden");
  }

  function clearCartMessage() {
    const messageBox = documentRef?.getElementById("cart-message");

    if (messageBox) {
      messageBox.classList.add("hidden");
      messageBox.textContent = "";
    }
  }

  async function getCartKey() {
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    return user ? `campus_cart_${user.id}` : "campus_cart_guest";
  }

  async function getCart() {
    const key = await getCartKey();

    try {
      return JSON.parse(localStorageRef.getItem(key)) || {};
    } catch {
      return {};
    }
  }

  async function saveCart(cart) {
    const key = await getCartKey();
    localStorageRef.setItem(key, JSON.stringify(cart));
  }

  async function clearCart() {
    const key = await getCartKey();
    localStorageRef.removeItem(key);
  }

  function clearCartByKey(cartKey) {
    if (cartKey) {
      localStorageRef.removeItem(cartKey);
    }
  }

  async function clearCartIfPaymentCompleted() {
    const pendingOrderId = sessionStorageRef.getItem("campus_pending_order_id");
    const pendingCartKey = sessionStorageRef.getItem("campus_pending_cart_key");

    if (!pendingOrderId || !pendingCartKey) {
      return;
    }

    const { data: order, error } = await supabaseClient
      .from("orders")
      .select("id, status, payment_status")
      .eq("id", pendingOrderId)
      .maybeSingle();

    if (error) {
      consoleRef.error("Payment cleanup check error:", error);
      return;
    }

    if (isSuccessfulPaidOrder(order)) {
      clearCartByKey(pendingCartKey);
      clearPendingPaymentStorage(sessionStorageRef);
      showToast("Payment successful. Cart cleared.");
      return;
    }

    if (
      order?.payment_status === "failed" ||
      order?.payment_status === "cancelled" ||
      order?.status === "payment_failed" ||
      order?.status === "cancelled"
    ) {
      clearPendingPaymentStorage(sessionStorageRef);
    }
  }

  async function getStudentAuth() {
    const {
      data: { user },
      error,
    } = await supabaseClient.auth.getUser();

    if (error || !user) {
      return { ok: false };
    }

    const { data: appUser } = await supabaseClient
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!appUser || appUser.role !== "student") {
      return { ok: false };
    }

    return { ok: true, user };
  }

  function setPayButtonLoading(isLoading) {
    const placeOrderBtn = documentRef?.getElementById("place-order");

    if (!placeOrderBtn) {
      return;
    }

    if (isLoading) {
      placeOrderBtn.disabled = true;
      placeOrderBtn.innerHTML =
        `<span class="btn-spinner"></span> Starting payment...`;
      return;
    }

    placeOrderBtn.disabled = false;
    placeOrderBtn.innerHTML = PAY_BUTTON_HTML;
  }

  async function removeItem(vendorId, menuItemId) {
    const cart = await getCart();
    const items = cart[vendorId]?.items || [];

    const updatedItems = items.filter((item) => {
      return String(item.menuItemId) !== String(menuItemId);
    });

    if (updatedItems.length === 0) {
      delete cart[vendorId];
    } else {
      cart[vendorId].items = updatedItems;
    }

    await saveCart(cart);
  }

  async function updateQuantity(vendorId, menuItemId, changeAmount) {
    const cart = await getCart();
    const items = cart[vendorId]?.items || [];

    const item = items.find((cartItem) => {
      return String(cartItem.menuItemId) === String(menuItemId);
    });

    if (!item) {
      return;
    }

    item.quantity += changeAmount;

    if (item.quantity <= 0) {
      await removeItem(vendorId, menuItemId);
      return;
    }

    await saveCart(cart);
  }

  async function renderCart() {
    const container = documentRef?.getElementById("cart-items");
    const totalEl = documentRef?.getElementById("total");
    const placeOrderBtn = documentRef?.getElementById("place-order");

    if (!container || !totalEl) {
      return;
    }

    const cart = await getCart();
    const vendorIds = getVendorIds(cart);

    container.innerHTML = "";

    let total = 0;

    if (vendorIds.length === 0) {
      container.innerHTML = `<p class="empty-cart">Your cart is empty.</p>`;
      totalEl.textContent = "Total: R0.00";

      if (placeOrderBtn) {
        placeOrderBtn.disabled = true;
      }

      clearCartMessage();
      return;
    }

    if (placeOrderBtn) {
      placeOrderBtn.disabled = false;
    }

    if (vendorIds.length > 1) {
      showCartMessage(
        "You can only order from one vendor at a time. Please remove items from other vendors or clear your cart.",
        "error"
      );
    } else {
      clearCartMessage();
    }

    for (const vendorId of vendorIds) {
      const { data: vendor } = await supabaseClient
        .from("vendors")
        .select("business_name")
        .eq("id", vendorId)
        .single();

      const vendorSection = documentRef.createElement("section");
      vendorSection.className = "vendor-cart-group";

      const vendorHeader = documentRef.createElement("header");
      vendorHeader.className = "vendor-cart-header";
      vendorHeader.innerHTML = `
        <h3>${escapeHtml(vendor?.business_name || "Vendor")}</h3>
        <p>Items from this vendor</p>
      `;

      vendorSection.appendChild(vendorHeader);

      for (const item of cart[vendorId].items) {
        total += Number(item.price || 0) * Number(item.quantity || 0);

        const itemCard = documentRef.createElement("article");
        itemCard.className = "cart-item";

        const safeName = escapeHtml(item.name || "Item");
        const safeImageUrl = escapeHtml(item.image_url || "");
        const price = Number(item.price || 0);
        const quantity = Number(item.quantity || 0);
        const subtotal = price * quantity;

        itemCard.innerHTML = `
          <figure class="cart-item-image ${safeImageUrl ? "" : "empty"}">
            ${
              safeImageUrl
                ? `<img src="${safeImageUrl}" alt="${safeName}">`
                : `<figcaption>No image</figcaption>`
            }
          </figure>

          <section class="cart-item-details">
            <h4>${safeName}</h4>
            <p>Price: R ${price.toFixed(2)}</p>
            <p class="cart-item-price">
              Subtotal: R ${subtotal.toFixed(2)}
            </p>
          </section>

          <footer class="cart-item-actions">
            <section class="quantity-controls">
              <button class="minus" type="button" aria-label="Decrease quantity">-</button>
              <span class="quantity-value">${quantity}</span>
              <button class="plus" type="button" aria-label="Increase quantity">+</button>
            </section>

            <button class="remove-btn" type="button">Remove</button>
          </footer>
        `;

        const minusButton = itemCard.querySelector(".minus");
        const plusButton = itemCard.querySelector(".plus");
        const removeButton = itemCard.querySelector(".remove-btn");

        if (minusButton) {
          minusButton.onclick = async () => {
            await updateQuantity(vendorId, item.menuItemId, -1);
            await renderCart();
          };
        }

        if (plusButton) {
          plusButton.onclick = async () => {
            await updateQuantity(vendorId, item.menuItemId, 1);
            await renderCart();
          };
        }

        if (removeButton) {
          removeButton.onclick = async () => {
            await removeItem(vendorId, item.menuItemId);
            await renderCart();
          };
        }

        vendorSection.appendChild(itemCard);
      }

      container.appendChild(vendorSection);
    }

    totalEl.textContent = `Total: R ${total.toFixed(2)}`;
  }

  function redirectToPayFast(paymentUrl, paymentFields) {
    if (!paymentUrl || !paymentFields) {
      throw new Error("Invalid PayFast payment response.");
    }

    const form = documentRef.createElement("form");
    form.method = "POST";
    form.action = paymentUrl;

    for (const [name, value] of Object.entries(paymentFields)) {
      const input = documentRef.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = value;
      form.appendChild(input);
    }

    documentRef.body.appendChild(form);
    form.submit();
  }

  async function startPayFastPayment(order) {
    const response = await fetchRef("/api/payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: order.amount,
        orderReference: order.id,
        payerReference: order.student_id,
        vendorReference: order.vendor_id,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Payment could not be started.");
    }

    const paymentUrl = result.paymentUrl || result.payment_url;
    const paymentFields = result.paymentFields || result.payment_fields;

    sessionStorageRef.setItem("campus_pending_order_id", order.id);
    sessionStorageRef.setItem("campus_pending_cart_key", await getCartKey());

    redirectToPayFast(paymentUrl, paymentFields);
  }

  async function handlePlaceOrderClick() {
    let createdOrderId = null;

    try {
      clearCartMessage();
      setPayButtonLoading(true);

      const auth = await getStudentAuth();

      if (!auth.ok) {
        windowRef.location.href = "../auth/login.html";
        return;
      }

      const cart = await getCart();
      const vendorIds = getVendorIds(cart);

      if (vendorIds.length === 0) {
        showToast("Your cart is empty.");
        setPayButtonLoading(false);
        return;
      }

      if (vendorIds.length > 1) {
        showCartMessage(
          "You can only order from one vendor at a time. Please clear your cart or remove items from other vendors.",
          "error"
        );
        setPayButtonLoading(false);
        return;
      }

      const vendorId = vendorIds[0];
      const vendorCart = cart[vendorId];

      const totalAmount = vendorCart.items.reduce((sum, item) => {
        return sum + Number(item.price || 0) * Number(item.quantity || 0);
      }, 0);

      if (totalAmount <= 0) {
        throw new Error("Your cart total must be greater than R0.00.");
      }

      const { data: order, error: orderError } = await supabaseClient
        .from("orders")
        .insert([
          {
            student_id: auth.user.id,
            vendor_id: vendorId,
            status: "payment_pending",
            payment_status: "pending",
            payment_provider: "payfast_sandbox",
            payment_amount: Number(totalAmount.toFixed(2)),
          },
        ])
        .select()
        .single();

      if (orderError || !order) {
        consoleRef.error("Order insert error:", orderError);
        throw new Error("Could not create order.");
      }

      createdOrderId = order.id;

      const items = vendorCart.items.map((item) => ({
        order_id: order.id,
        menu_item_id: item.menuItemId,
        quantity: item.quantity,
        price: item.price,
      }));

      const { error: itemsError } = await supabaseClient
        .from("order_items")
        .insert(items);

      if (itemsError) {
        consoleRef.error("Order items insert error:", itemsError);
        throw new Error("Could not save order items.");
      }

      await startPayFastPayment({
        id: order.id,
        amount: totalAmount,
        student_id: auth.user.id,
        vendor_id: vendorId,
      });
    } catch (error) {
      consoleRef.error("Payment start error:", error);

      if (createdOrderId) {
        await supabaseClient
          .from("orders")
          .update({
            status: "payment_failed",
            payment_status: "failed",
          })
          .eq("id", createdOrderId);
      }

      showCartMessage(
        error.message || "Payment could not be started. Please try again.",
        "error"
      );

      setPayButtonLoading(false);
    }
  }

  async function handleClearCartClick() {
    const shouldClear = confirmRef("Are you sure you want to clear your cart?");

    if (!shouldClear) {
      return;
    }

    await clearCart();
    await renderCart();
    showToast("Cart cleared.");
  }

  async function handlePageLoad() {
    const auth = await getStudentAuth();

    if (!auth.ok) {
      windowRef.location.href = "../auth/login.html";
      return;
    }

    await clearCartIfPaymentCompleted();
    await renderCart();
  }

  function handleBackClick() {
    windowRef.location.href = "student-dashboard.html";
  }

  function setupEventListeners() {
    documentRef
      ?.getElementById("place-order")
      ?.addEventListener("click", handlePlaceOrderClick);

    documentRef
      ?.getElementById("clear-cart")
      ?.addEventListener("click", handleClearCartClick);

    documentRef
      ?.querySelector(".back-btn")
      ?.addEventListener("click", handleBackClick);

    windowRef?.addEventListener("load", handlePageLoad);
  }

  return {
    showToast,
    showCartMessage,
    clearCartMessage,
    getCartKey,
    getCart,
    saveCart,
    clearCart,
    clearCartByKey,
    clearCartIfPaymentCompleted,
    getStudentAuth,
    setPayButtonLoading,
    removeItem,
    updateQuantity,
    renderCart,
    redirectToPayFast,
    startPayFastPayment,
    handlePlaceOrderClick,
    handleClearCartClick,
    handlePageLoad,
    handleBackClick,
    setupEventListeners,
  };
}

/* =========================
   BROWSER INIT
========================= */

export async function setupStudentCartPage({
  supabaseClient,
  localStorageRef = getDefaultLocalStorage(),
  sessionStorageRef = getDefaultSessionStorage(),
  documentRef = getDefaultDocument(),
  windowRef = getDefaultWindow(),
  fetchRef = getDefaultFetch(),
  setTimeoutRef = typeof setTimeout !== "undefined" ? setTimeout : () => {},
  alertRef = typeof alert !== "undefined" ? alert : () => {},
  confirmRef = typeof confirm !== "undefined" ? confirm : () => true,
  consoleRef = console,
} = {}) {
  const client = supabaseClient || (await createDefaultSupabaseClient());

  const controller = createCartController({
    supabaseClient: client,
    localStorageRef,
    sessionStorageRef,
    documentRef,
    windowRef,
    fetchRef,
    setTimeoutRef,
    alertRef,
    confirmRef,
    consoleRef,
  });

  controller.setupEventListeners();

  return controller;
}

if (typeof document !== "undefined" && typeof window !== "undefined") {
  setupStudentCartPage();
}