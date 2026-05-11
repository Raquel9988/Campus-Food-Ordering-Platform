import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://sqbscxfolbckikrzxqhr.supabase.co",
  "sb_publishable_Zw_iCK1n54xXGPuDWALWQQ_k2cOQWay",
);

const params = new URLSearchParams(window.location.search);
const vendorId = params.get("vendorId");

let allMenuItems = [];
const activeFilters = new Set();

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
   HELPERS
========================= */

function normalizeTag(tag) {
  return String(tag || "")
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");
}

function formatTag(tag) {
  return normalizeTag(tag)
    .replaceAll("_", "-")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getItemTags(item) {
  if (!Array.isArray(item.dietary_tags)) {
    return [];
  }

  return item.dietary_tags.map(normalizeTag);
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

  try {
    return JSON.parse(localStorage.getItem(key)) || {};
  } catch {
    return {};
  }
}

async function saveCart(cart) {
  const key = await getCartKey();
  localStorage.setItem(key, JSON.stringify(cart));
}

/* =========================
   ONE-VENDOR CART RULE
========================= */

async function addToCart(selectedVendorId, item) {
  const cart = await getCart();

  const existingVendorIds = Object.keys(cart).filter((id) => {
    return cart[id]?.items?.length > 0;
  });

  const hasOtherVendor =
    existingVendorIds.length > 0 &&
    !existingVendorIds.includes(String(selectedVendorId));

  if (hasOtherVendor) {
    const shouldClear = confirm(
      "You can only order from one vendor at a time. Clear your current cart and start a new order from this vendor?",
    );

    if (!shouldClear) {
      showToast(
        "Item was not added. Your cart still has items from another vendor.",
      );
      return false;
    }

    existingVendorIds.forEach((id) => {
      delete cart[id];
    });
  }

  if (!cart[selectedVendorId]) {
    cart[selectedVendorId] = { items: [] };
  }

  const items = cart[selectedVendorId].items;

  const existing = items.find((cartItem) => {
    return String(cartItem.menuItemId) === String(item.menuItemId);
  });

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
  return true;
}

//  LOAD VENDOR NAME
async function loadVendorName() {
  const title = document.getElementById("vendor-name");

  if (!vendorId) {
    if (title) {
      title.textContent = "Vendor Menu";
    }

    return;
  }

  const { data, error } = await supabase
    .from("vendors")
    .select("business_name")
    .eq("id", vendorId)
    .single();

  const title = document.getElementById("vendor-name");
  if (title) title.textContent = data?.business_name || "Vendor Menu";
}

/* 
   ALL ITEMS CACHE
   We fetch once and filter in memory so that
   toggling filters doesn't re-hit the database.
 */
let allMenuItems = [];

//  LOAD MENU FROM SUPABASE
async function loadMenu() {
  const menuList = document.getElementById("menu-list");

  if (!menuList) {
    return;
  }

  if (!vendorId) {
    menuList.innerHTML = `<p class="error-text">No vendor selected.</p>`;
    return;
  }

  menuList.innerHTML = `
    <p class="loading-text">
      <span class="spinner-sm"></span>
      Loading menu…
    </p>
  `;

  const { data, error } = await supabase
    .from("menu_items")
    .select("id, name, price, description, image_url, dietary_tags")
    .eq("vendor_id", vendorId)
    .eq("is_available", true)
    .order("name", { ascending: true });

  if (error) {
    console.error("Load menu error:", error);

    menuList.innerHTML = `
      <p class="error-text">
        Error loading menu: ${error.message || "Unknown error"}
      </p>
    `;

    return;
  }

  if (!data || data.length === 0) {
    menuList.innerHTML = `<p class="empty-text">No menu items available.</p>`;
    return;
  }

  allMenuItems = data;
  renderMenu(allMenuItems);
}

//  RENDER MENU ITEMS  (builds cards from array)
function renderMenu(items) {
  const menuList = document.getElementById("menu-list");
  menuList.innerHTML = "";

  if (!items.length) {
    menuList.innerHTML = `
      <section class="empty-filter-state">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" opacity="0.35" aria-hidden="true">
          <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>

        <p>No items match your filters.</p>

        <button class="clear-filter-btn" id="clear-filter-inline" type="button">
          Clear filters
        </button>
      </section>
    `;

    document
      .getElementById("clear-filter-inline")
      ?.addEventListener("click", resetFilters);

    return;
  }

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "menu-item";

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

    const info = document.createElement("section");
    info.className = "menu-info";

    const name = document.createElement("h3");
    name.textContent = item.name;

    const description = document.createElement("p");
    description.className = "description";
    description.textContent = item.description || "No description available.";

    const price = document.createElement("p");
    price.className = "menu-price";
    price.textContent = `R ${Number(item.price || 0).toFixed(2)}`;

    const itemTags = getItemTags(item);

    const tagsRow = document.createElement("section");
    tagsRow.className = "card-diet-tags";

    itemTags.forEach((tag) => {
      const pill = document.createElement("span");
      pill.className = "card-diet-pill";
      pill.textContent = formatTag(tag);
      tagsRow.appendChild(pill);
    });

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Add to Cart 🛒";

    button.addEventListener("click", async () => {
      const added = await addToCart(vendorId, {
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        image_url: item.image_url,
      });

      if (added) {
        showToast(`${item.name} added to cart!`);
      }
    });

    info.appendChild(name);
    info.appendChild(description);
    info.appendChild(price);

    if (itemTags.length > 0) {
      info.appendChild(tagsRow);
    }

    info.appendChild(button);

    card.appendChild(figure);
    card.appendChild(info);

    menuList.appendChild(card);
  });
}

// DIETARY FILTER LOGIC
// Tracks which filters are currently active (Set of tag strings, or "all")
const activeFilters = new Set();

function applyFilters() {
  if (activeFilters.size === 0) {
    renderMenu(allMenuItems);
    updateFilterSummary([]);
    return;
  }

  const selectedFilters = [...activeFilters];

  const filteredItems = allMenuItems.filter((item) => {
    const itemTags = getItemTags(item);

    return selectedFilters.every((filter) => {
      return itemTags.includes(filter);
    });
  });

  renderMenu(filteredItems);
  updateFilterSummary(selectedFilters);
}

function updateFilterSummary(activeList) {
  const summary = document.getElementById("filter-summary");

  if (!summary) {
    return;
  }

  if (activeList.length === 0) {
    summary.innerHTML = "";
    return;
  }

  const labels = activeList.map(formatTag).join(", ");

  summary.innerHTML = `
    Showing items matching: <strong>${labels}</strong>
    <button
      class="clear-filters-btn"
      id="clear-filters-btn"
      type="button"
      aria-label="Clear all filters"
    >
      Clear all
    </button>
  `;

  document
    .getElementById("clear-filters-btn")
    ?.addEventListener("click", resetFilters);
}

function resetFilters() {
  activeFilters.clear();

  document.querySelectorAll(".filter-chip").forEach((chip) => {
    const isAllChip = chip.dataset.filter === "all";

    chip.classList.toggle("active", isAllChip);
    chip.setAttribute("aria-pressed", isAllChip ? "true" : "false");
  });

  updateFilterSummary([]);
  renderMenu(allMenuItems);
}

function setupFilters() {
  document.querySelectorAll(".filter-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const filter = normalizeTag(chip.dataset.filter);

      if (filter === "all") {
        resetFilters();
        return;
      }

      if (activeFilters.has(filter)) {
        activeFilters.delete(filter);
        chip.classList.remove("active");
        chip.setAttribute("aria-pressed", "false");
      } else {
        activeFilters.add(filter);
        chip.classList.add("active");
        chip.setAttribute("aria-pressed", "true");
      }

      const allChip = document.querySelector('.filter-chip[data-filter="all"]');

      if (allChip) {
        const noFiltersSelected = activeFilters.size === 0;

        allChip.classList.toggle("active", noFiltersSelected);
        allChip.setAttribute(
          "aria-pressed",
          noFiltersSelected ? "true" : "false",
        );
      }

      applyFilters();
    });
  });
}

//  UTILS
function formatTag(tag) {
  return tag.replaceAll("_", "-").replace(/\b\w/g, (l) => l.toUpperCase());
}

//  INIT
async function initMenu() {
  await loadVendorName();
  await loadMenu();
  setupFilters(); // wire up filter chips after items are loaded
}

initMenu();

//  NAV
document.getElementById("back-btn")?.addEventListener("click", () => {
  window.location.href = "student-dashboard.html";
});

document.getElementById("view-cart")?.addEventListener("click", () => {
  window.location.href = "student-cart.html";
});

/* =========================
   INIT
========================= */

async function initMenu() {
  await loadVendorName();
  await loadMenu();
  setupFilters();
}

initMenu();
