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

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
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

  if (!appUser || appUser.role !== "student") {
    return { ok: false };
  }

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
   RENDER CART (NO DIV)
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

    const vendorSection = document.createElement("section"); // ✅
    vendorSection.className = "vendor-cart-group";

    const header = document.createElement("header"); // ✅
    header.innerHTML = `
      <h3>${vendor?.business_name || "Vendor"}</h3>
      <p>Items from this vendor</p>
    `;

    vendorSection.appendChild(header);

    for (const item of cart[vendorId].items) {

      total += item.price * item.quantity;

      const itemCard = document.createElement("article"); // ✅
      itemCard.className = "cart-item";

      itemCard.innerHTML = `
        <figure class="${item.image_url ? "" : "empty"}">
          ${
            item.image_url
              ? `<img src="${item.image_url}" alt="${item.name}">`
              : `<figcaption>No image</figcaption>`
          }
        </figure>

        <section>
          <h4>${item.name}</h4>
          <p>Price: R ${item.price.toFixed(2)}</p>
          <p>Quantity: ${item.quantity}</p>
        </section>

        <footer>
          <button class="minus">-</button>
          <span>${item.quantity}</span>
          <button class="plus">+</button>
          <button class="remove-btn">Remove</button>
        </footer>
      `;

      itemCard.querySelector(".minus").onclick = async () => {
        const cart = await getCart();
        const found = cart[vendorId].items.find(i => i.menuItemId == item.menuItemId);

        if (found.quantity > 1) found.quantity--;
        else await removeItem(vendorId, item.menuItemId);

        await saveCart(cart);
        renderCart();
      };

      itemCard.querySelector(".plus").onclick = async () => {
        const cart = await getCart();
        const found = cart[vendorId].items.find(i => i.menuItemId == item.menuItemId);

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

  if (!auth.ok) {
    window.location.href = "../auth/login.html";
    return;
  }

  const cart = await getCart();

  for (const vendorId of Object.keys(cart)) {

    const { data: order } = await supabase
      .from("orders")
      .insert([{ student_id: auth.user.id, vendor_id: vendorId, status: "received" }])
      .select()
      .single();

    const items = cart[vendorId].items.map(i => ({
      order_id: order.id,
      menu_item_id: i.menuItemId,
      quantity: i.quantity,
      price: i.price
    }));

    await supabase.from("order_items").insert(items);
  }

  await clearCart();
  await renderCart();
  showToast("Order placed successfully");

  setTimeout(() => {
    window.location.href = "student-dashboard.html";
  }, 1000);
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