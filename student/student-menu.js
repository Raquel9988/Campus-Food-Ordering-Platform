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
    search: "",
  },
};

async function createDefaultSupabaseClient() {
  const supabaseModuleUrl =
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

  const { createClient } = await import(
    /* @vite-ignore */ supabaseModuleUrl
  );

  return createClient(SUPABASE_URL, SUPABASE_KEY);
}

/* =========================
   HELPERS
========================= */

export function normalizeTag(tag) {
  return String(tag || "")
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");
}

export function formatTag(tag) {
  return normalizeTag(tag)
    .replaceAll("_", "-")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function getItemTags(item) {
  if (!Array.isArray(item.dietary_tags)) {
    return [];
  }

  return item.dietary_tags.map(normalizeTag);
}

export function getVendorIdFromUrl(windowRef = fallbackWindow) {
  const params = new URLSearchParams(windowRef.location.search || "");
  return params.get("vendorId");
}

/* =========================
   STUDENT MENU CONTROLLER
========================= */

export function createStudentMenuController({
  supabaseClient,
  documentRef = typeof document !== "undefined" ? document : null,
  windowRef = typeof window !== "undefined" ? window : fallbackWindow,
  localStorageRef =
    typeof localStorage !== "undefined" ? localStorage : fallbackStorage,
  setTimeoutRef = typeof setTimeout !== "undefined" ? setTimeout : () => {},
  alertRef = typeof alert !== "undefined" ? alert : () => {},
  confirmRef = typeof confirm !== "undefined" ? confirm : () => true,
  consoleRef = console,
  vendorId = getVendorIdFromUrl(windowRef),
}) {
  const state = {
    vendorId,
    allMenuItems: [],
    activeFilters: new Set(),
  };

  function getElement(id) {
    return documentRef?.getElementById(id) || null;
  }

  function getFilterChips() {
    return Array.from(documentRef?.querySelectorAll(".filter-chip") || []);
  }

  function showToast(message) {
    const toast = getElement("toast");

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

  async function addToCart(selectedVendorId, item) {
    const cart = await getCart();

    const existingVendorIds = Object.keys(cart).filter((id) => {
      return cart[id]?.items?.length > 0;
    });

    const hasOtherVendor =
      existingVendorIds.length > 0 &&
      !existingVendorIds.includes(String(selectedVendorId));

    if (hasOtherVendor) {
      const shouldClear = confirmRef(
        "You can only order from one vendor at a time. Clear your current cart and start a new order from this vendor?"
      );

      if (!shouldClear) {
        showToast(
          "Item was not added. Your cart still has items from another vendor."
        );
        return false;
      }

      existingVendorIds.forEach((id) => {
        delete cart[id];
      });
    }

    if (!cart[selectedVendorId]) {
      cart[selectedVendorId] = {
        items: [],
      };
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

  async function loadVendorName() {
    const vendorNameTitle = getElement("vendor-name");

    if (!vendorNameTitle) {
      return;
    }

    if (!state.vendorId) {
      vendorNameTitle.textContent = "Vendor Menu";
      return;
    }

    const { data, error } = await supabaseClient
      .from("vendors")
      .select("business_name")
      .eq("id", state.vendorId)
      .single();

    if (error) {
      consoleRef.error("Load vendor name error:", error);
      vendorNameTitle.textContent = "Vendor Menu";
      return;
    }

    vendorNameTitle.textContent = data?.business_name || "Vendor Menu";
  }

  async function loadMenu() {
    const menuList = getElement("menu-list");

    if (!menuList) {
      return;
    }

    if (!state.vendorId) {
      menuList.innerHTML = `<p class="error-text">No vendor selected.</p>`;
      return;
    }

    menuList.innerHTML = `
      <p class="loading-text">
        <span class="spinner-sm"></span>
        Loading menu…
      </p>
    `;

    const { data, error } = await supabaseClient
      .from("menu_items")
      .select("id, name, price, description, image_url, dietary_tags")
      .eq("vendor_id", state.vendorId)
      .eq("is_available", true)
      .order("name", { ascending: true });

    if (error) {
      consoleRef.error("Load menu error:", error);

      menuList.innerHTML = `
        <p class="error-text">
          Error loading menu: ${error.message || "Unknown error"}
        </p>
      `;

      return;
    }

    if (!data || data.length === 0) {
      state.allMenuItems = [];
      menuList.innerHTML = `<p class="empty-text">No menu items available.</p>`;
      return;
    }

    state.allMenuItems = data;
    renderMenu(state.allMenuItems);
  }

  function renderMenu(items) {
    const menuList = getElement("menu-list");

    if (!menuList) {
      return;
    }

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

      getElement("clear-filter-inline")?.addEventListener("click", resetFilters);
      return;
    }

    items.forEach((item) => {
      const card = documentRef.createElement("article");
      card.className = "menu-item";

      const figure = documentRef.createElement("figure");
      figure.className = item.image_url ? "image-wrapper" : "image-wrapper empty";

      if (item.image_url) {
        const img = documentRef.createElement("img");
        img.src = item.image_url;
        img.alt = item.name || "Menu item image";
        img.className = "menu-image";
        figure.appendChild(img);
      } else {
        const caption = documentRef.createElement("figcaption");
        caption.textContent = "No image available";
        figure.appendChild(caption);
      }

      const info = documentRef.createElement("section");
      info.className = "menu-info";

      const name = documentRef.createElement("h3");
      name.textContent = item.name || "Unnamed item";

      const description = documentRef.createElement("p");
      description.className = "description";
      description.textContent = item.description || "No description available.";

      const price = documentRef.createElement("p");
      price.className = "menu-price";
      price.textContent = `R ${Number(item.price || 0).toFixed(2)}`;

      const itemTags = getItemTags(item);

      const tagsRow = documentRef.createElement("section");
      tagsRow.className = "card-diet-tags";

      itemTags.forEach((tag) => {
        const pill = documentRef.createElement("span");
        pill.className = "card-diet-pill";
        pill.textContent = formatTag(tag);
        tagsRow.appendChild(pill);
      });

      const button = documentRef.createElement("button");
      button.type = "button";
      button.textContent = "Add to Cart 🛒";

      button.addEventListener("click", async () => {
        const added = await addToCart(state.vendorId, {
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

  function applyFilters() {
    if (state.activeFilters.size === 0) {
      renderMenu(state.allMenuItems);
      updateFilterSummary([]);
      return;
    }

    const selectedFilters = [...state.activeFilters];

    const filteredItems = state.allMenuItems.filter((item) => {
      const itemTags = getItemTags(item);

      return selectedFilters.every((filter) => {
        return itemTags.includes(filter);
      });
    });

    renderMenu(filteredItems);
    updateFilterSummary(selectedFilters);
  }

  function updateFilterSummary(activeList) {
    const summary = getElement("filter-summary");

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

    getElement("clear-filters-btn")?.addEventListener("click", resetFilters);
  }

  function resetFilters() {
    state.activeFilters.clear();

    getFilterChips().forEach((chip) => {
      const isAllChip = chip.dataset.filter === "all";

      chip.classList.toggle("active", isAllChip);
      chip.setAttribute("aria-pressed", isAllChip ? "true" : "false");
    });

    updateFilterSummary([]);
    renderMenu(state.allMenuItems);
  }

  function setupFilters() {
    getFilterChips().forEach((chip) => {
      chip.addEventListener("click", () => {
        const filter = normalizeTag(chip.dataset.filter);

        if (filter === "all") {
          resetFilters();
          return;
        }

        if (state.activeFilters.has(filter)) {
          state.activeFilters.delete(filter);
          chip.classList.remove("active");
          chip.setAttribute("aria-pressed", "false");
        } else {
          state.activeFilters.add(filter);
          chip.classList.add("active");
          chip.setAttribute("aria-pressed", "true");
        }

        const allChip = documentRef?.querySelector?.(
          '.filter-chip[data-filter="all"]'
        );

        if (allChip) {
          const noFiltersSelected = state.activeFilters.size === 0;

          allChip.classList.toggle("active", noFiltersSelected);
          allChip.setAttribute(
            "aria-pressed",
            noFiltersSelected ? "true" : "false"
          );
        }

        applyFilters();
      });
    });
  }

  function setupNavigation() {
    getElement("back-btn")?.addEventListener("click", () => {
      windowRef.location.href = "student-dashboard.html";
    });

    getElement("view-cart")?.addEventListener("click", () => {
      windowRef.location.href = "student-cart.html";
    });
  }

  async function initMenu() {
    await loadVendorName();
    await loadMenu();
    setupFilters();
    setupNavigation();
  }

  function setupStudentMenuPage() {
    documentRef?.addEventListener?.("DOMContentLoaded", initMenu);
  }

  return {
    state,
    showToast,
    getCartKey,
    getCart,
    saveCart,
    addToCart,
    loadVendorName,
    loadMenu,
    renderMenu,
    applyFilters,
    updateFilterSummary,
    resetFilters,
    setupFilters,
    setupNavigation,
    initMenu,
    setupStudentMenuPage,
  };
}

/* =========================
   BROWSER INIT
========================= */

export async function setupStudentMenuPage({
  supabaseClient,
  documentRef = typeof document !== "undefined" ? document : null,
  windowRef = typeof window !== "undefined" ? window : fallbackWindow,
  localStorageRef =
    typeof localStorage !== "undefined" ? localStorage : fallbackStorage,
  setTimeoutRef = typeof setTimeout !== "undefined" ? setTimeout : () => {},
  alertRef = typeof alert !== "undefined" ? alert : () => {},
  confirmRef = typeof confirm !== "undefined" ? confirm : () => true,
  consoleRef = console,
  vendorId,
} = {}) {
  const client = supabaseClient || (await createDefaultSupabaseClient());

  const controller = createStudentMenuController({
    supabaseClient: client,
    documentRef,
    windowRef,
    localStorageRef,
    setTimeoutRef,
    alertRef,
    confirmRef,
    consoleRef,
    vendorId,
  });

  controller.setupStudentMenuPage();

  return controller;
}

const isVitestEnvironment =
  typeof process !== "undefined" && process.env?.VITEST === "true";

if (
  typeof document !== "undefined" &&
  typeof window !== "undefined" &&
  !isVitestEnvironment
) {
  setupStudentMenuPage();
}