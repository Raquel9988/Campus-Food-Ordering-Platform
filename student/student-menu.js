import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://sqbscxfolbckikrzxqhr.supabase.co",
  "sb_publishable_Zw_iCK1n54xXGPuDWALWQQ_k2cOQWay"
);

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;

  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

const params = new URLSearchParams(window.location.search);
const vendorId = params.get("vendorId");

let CART_KEY = "campus_cart";

function getCart() {
  return JSON.parse(localStorage.getItem(CART_KEY)) || {};
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function addToCart(vendorId, item) {
  const cart = getCart();

  if (!cart[vendorId]) {
    cart[vendorId] = { items: [] };
  }

  const items = cart[vendorId].items;

  const existing = items.find(i => i.menuItemId === item.menuItemId);

  if (existing) {
    const updatedItems = items.map(item =>
  item.menuItemId === existing.menuItemId
    ? { ...item, quantity: item.quantity + 1 }
    : item
);

cart[vendorId].items = updatedItems;
  } else {
    items.push({
      menuItemId: item.menuItemId,
      name: item.name,
      price: item.price,
      image_url: item.image_url,
      quantity: 1
    });
  }

  saveCart(cart);
}

async function loadVendorName() {
  const { data, error } = await supabase
    .from("vendors")
    .select("business_name")
    .eq("id", vendorId)
    .single();

  if (!error && data) {
    document.getElementById("vendor-name").textContent = data.business_name;
  } else {
    document.getElementById("vendor-name").textContent = "Vendor Menu";
  }
}

async function loadMenu() {
  const menuList = document.getElementById("menu-list");
  menuList.innerHTML = `<p class="loading-text">Loading menu...</p>`;

  const { data, error } = await supabase
    .from("menu_items")
    .select("id, name, price, description, image_url")
    .eq("vendor_id", vendorId);

  if (error) {
    menuList.innerHTML = "Error loading menu.";
    return;
  }

  if (!data || data.length === 0) {
    menuList.innerHTML = "No menu items.";
    return;
  }

  menuList.innerHTML = "";

  data.forEach(item => {
    const div = document.createElement("div");
    div.className = "menu-item";

    div.innerHTML = `
  <div class="image-wrapper">
    <img src="${item.image_url}" alt="${item.name}" class="menu-image"/>
  </div>

  <div class="menu-info">
    <h3>${item.name}</h3>
    <p class="description">${item.description || ""}</p>
    <p>R ${Number(item.price).toFixed(2)}</p>
    <button>Add to Cart 🛒</button>
  </div>
`;
    

    div.querySelector("button").addEventListener("click", () => {
      addToCart(vendorId, {
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        image_url: item.image_url
      });
      showToast("Added to cart!");
    });

    menuList.appendChild(div);
  });
}

async function initMenu() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    CART_KEY = `campus_cart_${user.id}`;
  }

  await loadVendorName();
  await loadMenu();
}

initMenu();

// 🔙 back button
document.querySelector(".back-btn")?.addEventListener("click", () => {
  window.location.href = "student-dashboard.html";
});

document.getElementById("view-cart")?.addEventListener("click", () => {
  window.location.href = "student-cart.html";
});
