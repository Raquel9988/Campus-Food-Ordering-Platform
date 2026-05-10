import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://sqbscxfolbckikrzxqhr.supabase.co",
  "sb_publishable_Zw_iCK1n54xXGPuDWALWQQ_k2cOQWay",
);

const params = new URLSearchParams(window.location.search);
const vendorId = params.get("vendorId");


//  TOAST
function showToast(message) {
  const toast = document.getElementById("toast");

  if (!toast) {
    alert(message);
    return;
  }

  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
}


function escapeHtml(text) {
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
   CART

//  CART
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

async function addToCart(selectedVendorId, item) {
  const cart = await getCart();

  if (!cart[vendorId]) cart[vendorId] = { items: [] };

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


/* ════════════════════════════════════════════
   LOAD VENDOR NAME  (unchanged)
════════════════════════════════════════════ */
async function loadVendorName() {
  if (!vendorId) {
    document.getElementById("vendor-name").textContent = "Vendor Menu";
    return;
  }

  const { data } = await supabase
    .from("vendors")
    .select("business_name")
    .eq("id", vendorId)
    .single();

  const title = document.getElementById("vendor-name");

async function loadMenu() {
  const menuList = document.getElementById("menu-list");

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
  if (title) title.textContent = data?.business_name || "Vendor Menu";
}

/* ════════════════════════════════════════════
   ALL ITEMS CACHE
   We fetch once and filter in memory so that
   toggling filters doesn't re-hit the database.
════════════════════════════════════════════ */
let allMenuItems = [];

/* ════════════════════════════════════════════
   LOAD MENU FROM SUPABASE
════════════════════════════════════════════ */
async function loadMenu() {
  const menuList = document.getElementById("menu-list");
  menuList.innerHTML = `<p class="loading-text"><span class="spinner-sm"></span> Loading menu…</p>`;

  // Include dietary_tags in the select so filters can work
  const { data, error } = await supabase
    .from("menu_items")
    .select("id, name, price, description, image_url, dietary_tags")
    .eq("vendor_id", vendorId)
    .eq("is_available", true)
    .order("name", { ascending: true });

  if (error) {
    console.error("Load menu error:", error);
    menuList.innerHTML = `<p class="error-text">Error loading menu.</p>`;
    return;
  }

  if (!data || data.length === 0) {
    menuList.innerHTML = `<p class="empty-text">No menu items available.</p>`;
    return;
  }

  allMenuItems = data;
  renderMenu(allMenuItems);
}


/* ════════════════════════════════════════════
   RENDER MENU ITEMS  (builds cards from array)
════════════════════════════════════════════ */
function renderMenu(items) {
  const menuList = document.getElementById("menu-list");
  menuList.innerHTML = "";

  if (items.length === 0) {
    menuList.innerHTML = `
      <div class="empty-filter-state">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" opacity="0.35">
          <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <p>No items match your filters.</p>
        <button class="clear-filter-btn" id="clear-filter-inline">Clear filters</button>
      </div>`;

    document
      .getElementById("clear-filter-inline")
      ?.addEventListener("click", () => resetFilters());
    return;
  }

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "menu-item";

    // Image
    const figure = document.createElement("figure");
    figure.className = item.image_url ? "image-wrapper" : "image-wrapper empty";

    if (item.image_url) {
      const img = document.createElement("img");
      img.src = item.image_url;
      img.alt = item.name;
      img.className = "menu-image";
      figure.appendChild(img);
    } else {
      const cap = document.createElement("figcaption");
      cap.textContent = "No image";
      figure.appendChild(cap);
    }

    // Info section
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

    const tagsRow = document.createElement("section");
    tagsRow.className = "card-diet-tags";

    getItemTags(item).forEach((tag) => {
      const pill = document.createElement("span");
      pill.className = "card-diet-pill";
      pill.textContent = formatTag(tag);
      tagsRow.appendChild(pill);
    });

    // Dietary tag pills on the card
    const tagsRow = document.createElement("div");
    tagsRow.className = "card-diet-tags";
    if (item.dietary_tags?.length) {
      item.dietary_tags.forEach((tag) => {
        const pill = document.createElement("span");
        pill.className = "card-diet-pill";
        pill.textContent = formatTag(tag);
        tagsRow.appendChild(pill);
      });
    }

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
      showToast(`${item.name} added to cart!`);
    });

    info.appendChild(name);
    info.appendChild(description);
    info.appendChild(price);
    if (item.dietary_tags?.length) info.appendChild(tagsRow);
    info.appendChild(button);

    card.appendChild(figure);
    card.appendChild(info);
    menuList.appendChild(card);
  });
}

/* ════════════════════════════════════════════
   PERSON 6 — DIETARY FILTER LOGIC
════════════════════════════════════════════ */

// Tracks which filters are currently active (Set of tag strings, or "all")
const activeFilters = new Set();

function applyFilters() {
  if (activeFilters.size === 0) {
    renderMenu(allMenuItems);
    updateFilterSummary([]);
    return;
  }

  // Sprint spec: "only items matching ALL filters are shown"
  const filtered = allMenuItems.filter((item) => {
    const tags = item.dietary_tags || [];
    return [...activeFilters].every((f) => tags.includes(f));
  });

  renderMenu(filtered);
  updateFilterSummary([...activeFilters]);
}

function updateFilterSummary(activeList) {
  const el = document.getElementById("filter-summary");
  if (!el) return;

  if (activeList.length === 0) {
    el.innerHTML = "";
    return;
  }

  const labels = activeList.map((f) => formatTag(f)).join(", ");
  el.innerHTML = `
    Showing items matching: <strong>${labels}</strong>
    <button class="clear-filters-btn" id="clear-filters-btn" aria-label="Clear all filters">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
        <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      Clear all
    </button>`;

  document
    .getElementById("clear-filters-btn")
    ?.addEventListener("click", resetFilters);
}

function resetFilters() {
  activeFilters.clear();

  // Reset chip UI
  document.querySelectorAll(".filter-chip").forEach((chip) => {
    const isAll = chip.dataset.filter === "all";
    chip.classList.toggle("active", isAll);
    chip.setAttribute("aria-pressed", isAll ? "true" : "false");
  });

  updateFilterSummary([]);
  renderMenu(allMenuItems);
}

function setupFilters() {
  document.querySelectorAll(".filter-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const filter = chip.dataset.filter;

      if (filter === "all") {
        resetFilters();
        return;
      }

      // Toggle this filter in the active set
      if (activeFilters.has(filter)) {
        activeFilters.delete(filter);
        chip.classList.remove("active");
        chip.setAttribute("aria-pressed", "false");
      } else {
        activeFilters.add(filter);
        chip.classList.add("active");
        chip.setAttribute("aria-pressed", "true");
      }

      // Deactivate "All" chip when any specific filter is active
      const allChip = document.querySelector('.filter-chip[data-filter="all"]');
      if (allChip) {
        const noneActive = activeFilters.size === 0;
        allChip.classList.toggle("active", noneActive);
        allChip.setAttribute("aria-pressed", noneActive ? "true" : "false");
      }

      applyFilters();
    });
  });
}

/* ════════════════════════════════════════════
   UTILS
════════════════════════════════════════════ */
function formatTag(tag) {
  return tag.replaceAll("_", "-").replace(/\b\w/g, (l) => l.toUpperCase());
}

/* ════════════════════════════════════════════
   INIT
════════════════════════════════════════════ */
async function initMenu() {
  await loadVendorName();
  await loadMenu();
  setupFilters(); // wire up filter chips after items are loaded
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
        allChip.setAttribute("aria-pressed", noFiltersSelected ? "true" : "false");
      }

      applyFilters();
    });
  });
}


/* ════════════════════════════════════════════
   NAV  (unchanged from original)
════════════════════════════════════════════ */
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