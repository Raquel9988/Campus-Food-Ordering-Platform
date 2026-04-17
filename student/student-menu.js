import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://sqbscxfolbckikrzxqhr.supabase.co",
  "sb_publishable_Zw_iCK1n54xXGPuDWALWQQ_k2cOQWay"
);

const params = new URLSearchParams(window.location.search);
const vendorId = params.get("vendorId");

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

async function getCartKey() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return "campus_cart_guest";
  return `campus_cart_${user.id}`;
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

async function loadVendorName() {
  const { data, error } = await supabase
    .from("vendors")
    .select("business_name")
    .eq("id", vendorId)
    .single();

  const title = document.getElementById("vendor-name");

  if (!error && data) {
    title.textContent = data.business_name;
  } else {
    title.textContent = "Vendor Menu";
  }
}

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
    const div = document.createElement("div");
    div.className = "menu-item";

    const imageHtml = item.image_url
      ? `<img src="${item.image_url}" alt="${item.name}" class="menu-image" />`
      : `<div class="image-wrapper empty">No image available</div>`;

    div.innerHTML = `
      ${
        item.image_url
          ? `<div class="image-wrapper">${imageHtml}</div>`
          : imageHtml
      }

      <div class="menu-info">
        <h3>${item.name}</h3>
        <p class="description">${item.description || "No description available."}</p>
        <p class="menu-price">R ${Number(item.price).toFixed(2)}</p>
        <button type="button">Add to Cart 🛒</button>
      </div>
    `;

    div.querySelector("button").addEventListener("click", async () => {
      await addToCart(vendorId, {
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        image_url: item.image_url,
      });
      showToast("Added to cart!");
    });

    menuList.appendChild(div);
  });
}

async function initMenu() {
  await loadVendorName();
  await loadMenu();
}

initMenu();

document.getElementById("back-btn")?.addEventListener("click", () => {
  window.location.href = "student-dashboard.html";
});

document.getElementById("view-cart")?.addEventListener("click", () => {
  window.location.href = "student-cart.html";
});