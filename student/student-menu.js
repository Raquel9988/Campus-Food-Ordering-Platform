import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://sqbscxfolbckikrzxqhr.supabase.co",
  "sb_publishable_Zw_iCK1n54xXGPuDWALWQQ_k2cOQWay"
);

const params = new URLSearchParams(window.location.search);
const vendorId = params.get("vendorId");

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
   CART
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

async function addToCart(vendorId, item) {
  const cart = await getCart();

  const existingVendors = Object.keys(cart);
  if (existingVendors.length > 0 && !cart[vendorId]) {
    const confirmed = confirm(
      "Your cart has items from another vendor. Clear it and add this item instead?"
    );
    if (!confirmed) return;
    Object.keys(cart).forEach((id) => delete cart[id]);
  }

  if (!cart[vendorId]) {
    cart[vendorId] = { items: [] };
  }

  const items = cart[vendorId].items;
  const existing = items.find((i) => i.menuItemId === item.menuItemId);

  if (existing) {
    existing.quantity += 1;
  } else {
    items.push({
      menuItemId: item.menuItemId,
      name: item.name,
      price: Number(item.price),
      image_url: item.image_url || "",
      quantity: 1,
    });
  }

  await saveCart(cart);
}

/* =========================
   LOAD VENDOR NAME
========================= */
async function loadVendorName() {
  const { data } = await supabase
    .from("vendors")
    .select("business_name")
    .eq("id", vendorId)
    .single();

  const title = document.getElementById("vendor-name");
  title.textContent = data?.business_name || "Vendor Menu";
}

/* =========================
   LOAD MENU (NO DIV)
========================= */
async function loadMenu() {
  const menuList = document.getElementById("menu-list");
  menuList.innerHTML = `<p class="loading-text">Loading menu...</p>`;

  const { data, error } = await supabase
    .from("menu_items")
    .select("id, name, price, description, image_url")
    .eq("vendor_id", vendorId)
    .eq("is_available", true);

  if (error) {
    menuList.innerHTML = `<p class="error-text">Error loading menu.</p>`;
    return;
  }

  if (!data || data.length === 0) {
    menuList.innerHTML = `<p class="empty-text">No menu items available.</p>`;
    return;
  }

  menuList.innerHTML = "";

  data.forEach((item) => {

    // ✅ MAIN CARD
    const card = document.createElement("article");
    card.className = "menu-item";

    // ✅ IMAGE
    const figure = document.createElement("figure");
    figure.className = item.image_url ? "image-wrapper" : "image-wrapper empty";

    if (item.image_url) {
      const img = document.createElement("img");
      img.src = item.image_url;
      img.alt = item.name;
      img.className = "menu-image";
      figure.appendChild(img);
    } else {
      const caption = document.createElement("figcaption");
      caption.textContent = "No image available";
      figure.appendChild(caption);
    }

    // ✅ INFO SECTION
    const info = document.createElement("section");
    info.className = "menu-info";

    const name = document.createElement("h3");
    name.textContent = item.name;

    const desc = document.createElement("p");
    desc.className = "description";
    desc.textContent = item.description || "No description available.";

    const price = document.createElement("p");
    price.className = "menu-price";
    price.textContent = `R ${Number(item.price).toFixed(2)}`;

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Add to Cart 🛒";

    button.addEventListener("click", async () => {
      await addToCart(vendorId, {
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        image_url: item.image_url,
      });
      showToast("Added to cart!");
    });

    // assemble
    info.appendChild(name);
    info.appendChild(desc);
    info.appendChild(price);
    info.appendChild(button);

    card.appendChild(figure);
    card.appendChild(info);

    menuList.appendChild(card);
  });
}

/* =========================
   INIT
========================= */
async function initMenu() {
  await loadVendorName();
  await loadMenu();
}

initMenu();

/* =========================
   NAV
========================= */
document.getElementById("back-btn")?.addEventListener("click", () => {
  window.location.href = "student-dashboard.html";
});

document.getElementById("view-cart")?.addEventListener("click", () => {
  window.location.href = "student-cart.html";
});
