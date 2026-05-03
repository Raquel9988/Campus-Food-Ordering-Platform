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
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
}

/* =========================
   CART STORAGE
========================= */
async function getCartKey() {
  const { data: { user } } = await supabase.auth.getUser();
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
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { ok: false };

  const { data: appUser } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!appUser || appUser.role !== "student") return { ok: false };
  return { ok: true, user };
}

/* =========================
   REMOVE ITEM
========================= */
async function removeItem(vendorId, menuItemId) {
  const cart = await getCart();
  const items = cart[vendorId]?.items || [];
  const updated = items.filter(i => String(i.menuItemId) !== String(menuItemId));

  if (updated.length === 0) delete cart[vendorId];
  else cart[vendorId].items = updated;

  await saveCart(cart);
}

/* =========================
   RENDER CART
========================= */
async function renderCart() {
  const container = document.getElementById("cart-items");
  const totalEl   = document.getElementById("total");
  const cart      = await getCart();
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

    const header = document.createElement("div");
    header.className = "vendor-cart-header";
    header.innerHTML = `
      <h3>${vendor?.business_name || "Vendor"}</h3>
      <p>Items from this vendor</p>
    `;
    vendorSection.appendChild(header);

    for (const item of cart[vendorId].items) {
      total += item.price * item.quantity;

      const itemCard = document.createElement("article");
      itemCard.className = "cart-item";

      itemCard.innerHTML = `
        <div class="cart-item-image ${item.image_url ? "" : "empty"}">
          ${item.image_url
            ? `<img src="${item.image_url}" alt="${item.name}">`
            : `<span>No image</span>`}
        </div>

        <div class="cart-item-details">
          <h4>${item.name}</h4>
          <p class="cart-item-price">R ${item.price.toFixed(2)} each</p>
        </div>

        <div class="cart-item-actions">
          <div class="quantity-controls">
            <button class="minus" aria-label="Decrease quantity">−</button>
            <span class="quantity-value">${item.quantity}</span>
            <button class="plus" aria-label="Increase quantity">+</button>
          </div>
          <button class="remove-btn">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <polyline points="3 6 5 6 21 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M10 11v6M14 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
            </svg>
            Remove
          </button>
        </div>
      `;

      /* ── Decrement: remove when reaching 0 ── */
      itemCard.querySelector(".minus").onclick = async () => {
        const cart  = await getCart();
        const found = cart[vendorId]?.items?.find(i => i.menuItemId == item.menuItemId);
        if (!found) return;

        if (found.quantity <= 1) {
          // Remove item entirely when decrementing from 1
          await removeItem(vendorId, item.menuItemId);
        } else {
          found.quantity--;
          await saveCart(cart);
        }
        renderCart();
      };

      itemCard.querySelector(".plus").onclick = async () => {
        const cart  = await getCart();
        const found = cart[vendorId]?.items?.find(i => i.menuItemId == item.menuItemId);
        if (!found) return;
        found.quantity++;
        await saveCart(cart);
        renderCart();
      };

      itemCard.querySelector(".remove-btn").onclick = async () => {
        await removeItem(vendorId, item.menuItemId);
        renderCart();
      };

      vendorSection.appendChild(itemCard);
    }

    container.appendChild(vendorSection);
  }

  totalEl.textContent = `Total: R ${total.toFixed(2)}`;
}

/* =========================
   PLACE ORDER
========================= */
document.getElementById("place-order")?.addEventListener("click", async () => {
  const auth = await getStudentAuth();
  if (!auth.ok) { window.location.href = "../auth/login.html"; return; }

  const cart = await getCart();

  for (const vendorId of Object.keys(cart)) {
    const { data: order } = await supabase
      .from("orders")
      .insert([{ student_id: auth.user.id, vendor_id: vendorId, status: "received" }])
      .select()
      .single();

    const items = cart[vendorId].items.map(i => ({
      order_id:     order.id,
      menu_item_id: i.menuItemId,
      quantity:     i.quantity,
      price:        i.price
    }));

    await supabase.from("order_items").insert(items);
  }

  await clearCart();
  await renderCart();
  showToast("Order placed successfully! 🎉");
  setTimeout(() => { window.location.href = "student-dashboard.html"; }, 1000);
});

/* =========================
   INIT
========================= */
window.addEventListener("load", async () => {
  const auth = await getStudentAuth();
  if (!auth.ok) { window.location.href = "../auth/login.html"; return; }
  await renderCart();
});

/* =========================
   NAV
========================= */
document.querySelector(".back-btn")?.addEventListener("click", () => {
  window.location.href = "student-dashboard.html";
});