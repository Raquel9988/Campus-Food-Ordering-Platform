import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://sqbscxfolbckikrzxqhr.supabase.co",
  "sb_publishable_Zw_iCK1n54xXGPuDWALWQQ_k2cOQWay"
);

/* =========================
   TOAST
========================= */
function showToast(message) {
  const toast = document.getElementById("toast");

  if (!toast) {
    alert(message);
    return;
  }

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

/* =========================
   CART STORAGE
========================= */
async function getCartKey() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user ? `campus_cart_${user.id}` : "campus_cart_guest";
}

async function getCart() {
  const key = await getCartKey();
  return JSON.parse(localStorage.getItem(key)) || {};
}

async function saveCart(cart) {
  const key = await getCartKey();
  localStorage.setItem(key, JSON.stringify(cart));
}

async function clearCart() {
  const key = await getCartKey();
  localStorage.removeItem(key);
}

/* =========================
   AUTH
========================= */
async function getStudentAuth() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return { ok: false };

  const { data: appUser } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!appUser || appUser.role !== "student") {
    return { ok: false };
  }

  return { ok: true, user };
}

/* =========================
   CART ITEM ACTIONS
========================= */
async function removeItem(vendorId, menuItemId) {
  const cart = await getCart();
  const items = cart[vendorId]?.items || [];

  const updatedItems = items.filter(
    (item) => String(item.menuItemId) !== String(menuItemId)
  );

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

  const item = items.find(
    (cartItem) => String(cartItem.menuItemId) === String(menuItemId)
  );

  if (!item) return;

  item.quantity += changeAmount;

  if (item.quantity <= 0) {
    await removeItem(vendorId, menuItemId);
    return;
  }

  await saveCart(cart);
}

/* =========================
   RENDER CART
========================= */
async function renderCart() {
  const container = document.getElementById("cart-items");
  const totalEl = document.getElementById("total");

  const cart = await getCart();
  container.innerHTML = "";

  let total = 0;

  if (Object.keys(cart).length === 0) {
    container.innerHTML = `<p class="empty-cart">Your cart is empty.</p>`;
    totalEl.textContent = "Total: R0.00";
    return;
  }

  for (const vendorId of Object.keys(cart)) {
    const { data: vendor } = await supabase
      .from("vendors")
      .select("business_name")
      .eq("id", vendorId)
      .single();

    const vendorSection = document.createElement("section");
    vendorSection.className = "vendor-cart-group";

    const vendorHeader = document.createElement("header");
    vendorHeader.className = "vendor-cart-header";
    vendorHeader.innerHTML = `
      <h3>${vendor?.business_name || "Vendor"}</h3>
      <p>Items from this vendor</p>
    `;

    vendorSection.appendChild(vendorHeader);

    for (const item of cart[vendorId].items) {
      total += Number(item.price) * Number(item.quantity);

      const itemCard = document.createElement("article");
      itemCard.className = "cart-item";

      itemCard.innerHTML = `
        <figure class="cart-item-image ${item.image_url ? "" : "empty"}">
          ${
            item.image_url
              ? `<img src="${item.image_url}" alt="${item.name}">`
              : `<figcaption>No image</figcaption>`
          }
        </figure>

        <section class="cart-item-details">
          <h4>${item.name}</h4>
          <p>Price: R ${Number(item.price).toFixed(2)}</p>
          <p class="cart-item-price">
            Subtotal: R ${(Number(item.price) * Number(item.quantity)).toFixed(2)}
          </p>
        </section>

        <footer class="cart-item-actions">
          <section class="quantity-controls">
            <button class="minus" type="button">-</button>
            <span class="quantity-value">${item.quantity}</span>
            <button class="plus" type="button">+</button>
          </section>

          <button class="remove-btn" type="button">Remove</button>
        </footer>
      `;

      itemCard.querySelector(".minus").onclick = async () => {
        await updateQuantity(vendorId, item.menuItemId, -1);
        await renderCart();
      };

      itemCard.querySelector(".plus").onclick = async () => {
        await updateQuantity(vendorId, item.menuItemId, 1);
        await renderCart();
      };

      itemCard.querySelector(".remove-btn").onclick = async () => {
        await removeItem(vendorId, item.menuItemId);
        await renderCart();
      };

      vendorSection.appendChild(itemCard);
    }

    container.appendChild(vendorSection);
  }

  totalEl.textContent = `Total: R ${total.toFixed(2)}`;
}

/* =========================
   PAYFAST PAYMENT
========================= */
function redirectToPayFast(paymentUrl, paymentFields) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = paymentUrl;

  for (const [name, value] of Object.entries(paymentFields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
}

async function startPayFastPayment(order) {
  const response = await fetch("/api/payment", {
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

  if (!result.success) {
    throw new Error(result.message || "Payment could not be started.");
  }

  redirectToPayFast(result.paymentUrl, result.paymentFields);
}

/* =========================
   PLACE ORDER + START PAYFAST PAYMENT
========================= */
document.getElementById("place-order")?.addEventListener("click", async () => {
  const placeOrderBtn = document.getElementById("place-order");

  try {
    placeOrderBtn.disabled = true;
    placeOrderBtn.textContent = "Starting payment...";

    const auth = await getStudentAuth();

    if (!auth.ok) {
      window.location.href = "../auth/login.html";
      return;
    }

    const cart = await getCart();
    const vendorIds = Object.keys(cart);

    if (vendorIds.length === 0) {
      showToast("Your cart is empty.");
      placeOrderBtn.disabled = false;
      placeOrderBtn.textContent = "Pay Now";
      return;
    }

    /*
      Current Sprint 3 payment setup:
      One PayFast payment request = one vendor order.
      This prevents one payment from being attached to multiple vendors.
    */
    if (vendorIds.length > 1) {
      showToast("Please order from one vendor at a time for online payment.");
      placeOrderBtn.disabled = false;
      placeOrderBtn.textContent = "Pay Now";
      return;
    }

    const vendorId = vendorIds[0];
    const vendorCart = cart[vendorId];

    const totalAmount = vendorCart.items.reduce((sum, item) => {
      return sum + Number(item.price) * Number(item.quantity);
    }, 0);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          student_id: auth.user.id,
          vendor_id: vendorId,

          // Food order status
          status: "payment_pending",

          // Payment-specific fields
          payment_status: "pending",
          payment_provider: "payfast_sandbox",
          payment_amount: Number(totalAmount.toFixed(2)),
        },
      ])
      .select()
      .single();

    if (orderError || !order) {
      console.error("Order insert error:", orderError);
      throw new Error("Could not create order.");
    }

    const items = vendorCart.items.map((item) => ({
      order_id: order.id,
      menu_item_id: item.menuItemId,
      quantity: item.quantity,
      price: item.price,
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(items);

    if (itemsError) {
      console.error("Order items insert error:", itemsError);
      throw new Error("Could not save order items.");
    }

    await startPayFastPayment({
      id: order.id,
      amount: totalAmount,
      student_id: auth.user.id,
      vendor_id: vendorId,
    });
  } catch (error) {
    console.error("Payment start error:", error);
    showToast(error.message || "Could not start payment.");

    placeOrderBtn.disabled = false;
    placeOrderBtn.textContent = "Pay Now";
  }
});

/* =========================
   INIT
========================= */
window.addEventListener("load", async () => {
  const auth = await getStudentAuth();

  if (!auth.ok) {
    window.location.href = "../auth/login.html";
    return;
  }

  await renderCart();
});

/* =========================
   NAV
========================= */
document.querySelector(".back-btn")?.addEventListener("click", () => {
  window.location.href = "student-dashboard.html";
});