import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://sqbscxfolbckikrzxqhr.supabase.co",
  "sb_publishable_Zw_iCK1n54xXGPuDWALWQQ_k2cOQWay"
);

/* ══════════════════════════════════════════════════════
   INLINE UI HELPERS  (no alert / confirm anywhere)
══════════════════════════════════════════════════════ */

function showFieldError(fieldId, msg) {
  const el = document.getElementById(fieldId);
  if (!el) return;
  el.classList.add("field-error");
  // Remove stale hint
  const group = el.closest(".field-group");
  if (group) group.querySelectorAll(".field-hint-error-dynamic").forEach(n => n.remove());
  const hint = document.createElement("p");
  hint.className = "field-hint-error field-hint-error-dynamic";
  hint.textContent = msg;
  el.insertAdjacentElement("afterend", hint);
}

function clearFieldError(fieldId) {
  const el = document.getElementById(fieldId);
  if (!el) return;
  el.classList.remove("field-error");
  const group = el.closest(".field-group");
  if (group) group.querySelectorAll(".field-hint-error-dynamic").forEach(n => n.remove());
}

function clearAllErrors() {
  document.querySelectorAll(".field-error").forEach(el => el.classList.remove("field-error"));
  document.querySelectorAll(".field-hint-error-dynamic").forEach(el => el.remove());
  hideDietaryError();
}

function showDietaryError(msg) {
  const el = document.getElementById("dietary-error");
  if (!el) return;
  el.textContent = msg;
  el.style.display = "block";
}

function hideDietaryError() {
  const el = document.getElementById("dietary-error");
  if (el) el.style.display = "none";
}

function showFormMessage(msg, type = "info") {
  const el = document.getElementById("form-message");
  if (!el) return;
  el.className = `form-message form-message--${type}`;
  el.textContent = msg;
  el.style.display = "block";
  // Auto-clear success after 4s
  if (type === "success") setTimeout(() => { el.style.display = "none"; }, 4000);
}

function clearFormMessage() {
  const el = document.getElementById("form-message");
  if (el) el.style.display = "none";
}

/* ══════════════════════════════════════════════════════
   IMAGE PREVIEW
══════════════════════════════════════════════════════ */

function setupImagePreview() {
  const fileInput = document.getElementById("item-image");
  const dropLabel = document.querySelector(".file-drop");
  if (!fileInput || !dropLabel) return;

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) { resetImagePreview(); return; }

    if (!file.type.startsWith("image/")) {
      showFieldError("item-image", "Please select a valid image file.");
      resetImagePreview();
      return;
    }

    clearFieldError("item-image");

    const reader = new FileReader();
    reader.onload = (ev) => {
      const old = dropLabel.querySelector(".img-preview");
      if (old) old.remove();
      const img = document.createElement("img");
      img.src = ev.target.result;
      img.className = "img-preview";
      img.alt = "Preview";
      dropLabel.prepend(img);
      const span = dropLabel.querySelector("span");
      if (span) span.textContent = file.name;
    };
    reader.readAsDataURL(file);
  });
}

function resetImagePreview() {
  const dropLabel = document.querySelector(".file-drop");
  if (!dropLabel) return;
  const old = dropLabel.querySelector(".img-preview");
  if (old) old.remove();
  const span = dropLabel.querySelector("span");
  if (span) span.textContent = "Click to upload image";
}

/* ══════════════════════════════════════════════════════
   MAIN LOAD  — mirrors original structure exactly
══════════════════════════════════════════════════════ */

window.addEventListener("load", async () => {
  const menuForm          = document.getElementById("menu-item-form");
  const menuItemsContainer = document.getElementById("menu-items-container");
  const submitBtn         = document.getElementById("submit-btn");
  const cancelEditBtn     = document.getElementById("cancel-edit-btn");
  const otherCheckbox     = document.getElementById("other-checkbox");
  const otherInputWrap    = document.getElementById("other-input-wrap");
  const otherInput        = document.getElementById("other-input");

  /* ── Image preview ── */
  setupImagePreview();

  /* ── "Other" dietary checkbox toggle ── */
  otherCheckbox.addEventListener("change", () => {
    otherInputWrap.style.display = otherCheckbox.checked ? "block" : "none";
    if (!otherCheckbox.checked) otherInput.value = "";
    hideDietaryError();
  });

  otherInput.addEventListener("input", hideDietaryError);

  document.querySelectorAll(".dietary-tag").forEach(tag => {
    tag.addEventListener("change", hideDietaryError);
  });

  /* ── Auth check ── */
  const authResult = await getApprovedVendorAuth();

  if (!authResult.ok) {
    // Show inline banner, no alert
    showFormMessage(authResult.message, "error");
    setTimeout(() => { window.location.href = "../auth/login.html"; }, 1800);
    return;
  }

  const { vendor } = authResult;

  let editingItemId = null;

  /* ══════════════════════════════════════════════════════
     LOAD MENU ITEMS
  ══════════════════════════════════════════════════════ */

  async function loadMenuItems() {
    if (menuItemsContainer) {
      menuItemsContainer.innerHTML = `
        <p class="empty-hint">
          <span class="spinner-sm"></span>
          Loading your menu…
        </p>`;
    }

    const { data: menuItems, error } = await supabase
      .from("menu_items")
      .select("*")
      .eq("vendor_id", vendor.id)
      .order("created_at", { ascending: false });
      console.log("MENU ITEMS FROM DB:", menuItems);

    if (error) {
      if (menuItemsContainer) {
        menuItemsContainer.innerHTML = `<p class="empty-hint" style="color:#b91c1c;">Failed to load menu items: ${error.message}</p>`;
      }
      return;
    }

    displayMenuItems(menuItems || []);
  }

  /* ══════════════════════════════════════════════════════
     DISPLAY MENU ITEMS
  ══════════════════════════════════════════════════════ */

  function displayMenuItems(items) {
    if (!menuItemsContainer) return;

    if (items.length === 0) {
      menuItemsContainer.innerHTML = `<p class="empty-hint">No menu items yet — add your first one!</p>`;
      return;
    }

    menuItemsContainer.innerHTML = "";

    items.forEach((item) => {
      const card = document.createElement("section");
      card.className = "menu-item-card";

      const availBadge = item.is_available
        ? `<span class="badge badge--green">Available</span>`
        : `<span class="badge badge--red">Sold Out</span>`;

      const dietaryHtml = item.dietary_tags?.length
        ? item.dietary_tags.map(t =>
            `<span class="diet-tag">${formatDietaryTag(t)}</span>`
          ).join("")
        : `<span style="color:#9ca3af;font-size:0.8rem;">None</span>`;

      card.innerHTML = `
        ${item.image_url
          ? `<img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.name)}" class="item-card-img" />`
          : `<div class="item-card-img item-card-img--placeholder">
               <svg width="32" height="32" viewBox="0 0 24 24" fill="none" opacity="0.3">
                 <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                 <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" stroke-width="2"/>
                 <polyline points="21 15 16 10 5 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
               </svg>
             </div>`
        }
        <div class="item-card-body">
          <div class="item-card-header">
            <h3>${escapeHtml(item.name)}</h3>
            ${availBadge}
          </div>
          <p class="item-card-desc">${escapeHtml(item.description || "No description.")}</p>
          <p class="item-card-price">R ${Number(item.price).toFixed(2)}</p>
          <div class="item-dietary-tags">${dietaryHtml}</div>
          <div class="item-card-actions">
            <button class="edit-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Edit
            </button>
            <button class="delete-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <polyline points="3 6 5 6 21 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M10 11v6M14 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              Delete
            </button>
          </div>
        </div>
      `;

      card.querySelector(".edit-btn").addEventListener("click", () => startEdit(item));
      card.querySelector(".delete-btn").addEventListener("click", () => confirmDelete(card, item));

      menuItemsContainer.appendChild(card);
    });
  }

  /* ══════════════════════════════════════════════════════
     INLINE DELETE CONFIRM  (replaces confirm())
  ══════════════════════════════════════════════════════ */

  function confirmDelete(card, item) {
    if (card.querySelector(".delete-confirm")) return; // already showing

    const bar = document.createElement("div");
    bar.className = "delete-confirm";
    bar.innerHTML = `
      <span>Delete "${escapeHtml(item.name)}"?</span>
      <button class="confirm-yes">Yes, delete</button>
      <button class="confirm-no">Cancel</button>
    `;
    card.appendChild(bar);

    bar.querySelector(".confirm-no").addEventListener("click", () => bar.remove());

    bar.querySelector(".confirm-yes").addEventListener("click", async () => {
      bar.remove();

      const { error } = await supabase
        .from("menu_items")
        .delete()
        .eq("id", item.id)
        .eq("vendor_id", vendor.id);

      if (error) {
        showFormMessage(`Delete failed: ${error.message}`, "error");
        return;
      }

      await loadMenuItems();
    });
  }

  /* ══════════════════════════════════════════════════════
     START EDIT  — populates form from existing item
  ══════════════════════════════════════════════════════ */

  function startEdit(item) {
    editingItemId = item.id;
    clearAllErrors();
    clearFormMessage();

    document.getElementById("item-name").value        = item.name;
    document.getElementById("item-description").value = item.description || "";
    document.getElementById("item-price").value       = item.price;
    document.getElementById("item-availability").value = item.is_available ? "true" : "false";

    // Reset all dietary checkboxes
    const predefinedTags = ["halal", "vegetarian", "vegan", "nut_free", "gluten_free", "dairy_free"];
    document.querySelectorAll(".dietary-tag").forEach(cb => { cb.checked = false; });
    otherCheckbox.checked = false;
    otherInputWrap.style.display = "none";
    otherInput.value = "";

    const customTags = [];
    item.dietary_tags?.forEach(tag => {
      if (predefinedTags.includes(tag)) {
        const cb = document.querySelector(`.dietary-tag[value="${tag}"]`);
        if (cb) cb.checked = true;
      } else {
        customTags.push(tag);
      }
    });

    if (customTags.length > 0) {
      otherCheckbox.checked = true;
      otherInputWrap.style.display = "block";
      otherInput.value = customTags.join(", ");
    }

    // Show existing image preview
    const dropLabel = document.querySelector(".file-drop");
    if (dropLabel && item.image_url) {
      const old = dropLabel.querySelector(".img-preview");
      if (old) old.remove();
      const img = document.createElement("img");
      img.src = item.image_url;
      img.className = "img-preview";
      img.alt = "Current image";
      dropLabel.prepend(img);
      const span = dropLabel.querySelector("span");
      if (span) span.textContent = "Click to replace image";
    }

    // Update form card title + button
    const cardTitle = document.getElementById("form-card-title");
    if (cardTitle) cardTitle.textContent = "Edit Menu Item";

    submitBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
        <polyline points="17 21 17 13 7 13 7 21" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
      </svg>
      Save Changes`;

    cancelEditBtn.style.display = "inline-flex";

    menuForm.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ══════════════════════════════════════════════════════
     CANCEL EDIT
  ══════════════════════════════════════════════════════ */

  cancelEditBtn.addEventListener("click", () => {
    editingItemId = null;
    menuForm.reset();
    resetImagePreview();
    clearAllErrors();
    clearFormMessage();
    otherInputWrap.style.display = "none";
    otherInput.value = "";
    cancelEditBtn.style.display = "none";
    submitBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
        <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      Add Item`;
    const cardTitle = document.getElementById("form-card-title");
    if (cardTitle) cardTitle.textContent = "Add Menu Item";
  });

  /* ══════════════════════════════════════════════════════
     FORM SUBMIT
  ══════════════════════════════════════════════════════ */

  menuForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearAllErrors();
    clearFormMessage();

    const itemName        = document.getElementById("item-name").value.trim();
    const itemDescription = document.getElementById("item-description").value.trim();
    const priceRaw        = document.getElementById("item-price").value;
    const itemPrice       = parseFloat(priceRaw);
    const itemAvailability = document.getElementById("item-availability").value === "true";
    const imageFile       = document.getElementById("item-image").files[0];

    let selectedTags = [...document.querySelectorAll(".dietary-tag:checked")].map(t => t.value);

    /* ── Field validation (inline, not alert) ── */
    let valid = true;

    if (!itemName) {
      showFieldError("item-name", "Item name is required.");
      valid = false;
    }

    if (!itemDescription) {
      showFieldError("item-description", "Description is required.");
      valid = false;
    }

    if (priceRaw === "" || isNaN(itemPrice)) {
      showFieldError("item-price", "Please enter a price.");
      valid = false;
    } else if (itemPrice <= 0) {
      showFieldError("item-price", "Price must be greater than R0.");
      valid = false;
    }

    /* ── Dietary tag validation ── */
    if (otherCheckbox.checked) {
      if (otherInput.value.trim() === "") {
        showDietaryError("Please enter a custom dietary tag, or uncheck 'Other'.");
        valid = false;
      }
    } else if (selectedTags.length === 0) {
      showDietaryError("Please select at least one dietary tag.");
      valid = false;
    }

    if (!valid) return;

    /* ── Merge "other" tags ── */
    if (otherCheckbox.checked) {
      const extraTags = otherInput.value
        .split(",")
        .map(t => t.trim().toLowerCase())
        .filter(t => t !== "");
      selectedTags.push(...extraTags);
    }

    selectedTags = [...new Set(selectedTags)];

    /* ── Disable submit ── */
    submitBtn.disabled = true;
    const originalLabel = submitBtn.innerHTML;
    submitBtn.innerHTML = editingItemId ? "Saving…" : "Adding…";

    try {
      /* ── Image upload ── */
      let imageUrl = null;

      if (imageFile) {
        const fileName = `${vendor.id}_${Date.now()}_${imageFile.name}`;

        const { error: uploadError } = await supabase.storage
          .from("menu-images")
          .upload(fileName, imageFile, { upsert: true });

        if (uploadError) {
          showFormMessage(`Image upload failed: ${uploadError.message}`, "error");
          return;
        }

        const { data: urlData } = supabase.storage
          .from("menu-images")
          .getPublicUrl(fileName);

        imageUrl = urlData?.publicUrl ?? null;
      }

      /* ── Update or Insert ── */
      if (editingItemId) {
        const updateData = {
          name:          itemName,
          description:   itemDescription,
          price:         itemPrice,
          is_available:  itemAvailability,
          dietary_tags:  selectedTags,
          updated_at:    new Date().toISOString(),
        };
        if (imageUrl) updateData.image_url = imageUrl;

        const { error } = await supabase
          .from("menu_items")
          .update(updateData)
          .eq("id", editingItemId)
          .eq("vendor_id", vendor.id);

        if (error) { showFormMessage(`Update failed: ${error.message}`, "error"); return; }

        showFormMessage("Item updated successfully.", "success");

      } else {
        const { error } = await supabase.from("menu_items").insert([{
          vendor_id:    vendor.id,
          name:         itemName,
          description:  itemDescription,
          price:        itemPrice,
          is_available: itemAvailability,
          image_url:    imageUrl,
          dietary_tags: selectedTags,
        }]);

        if (error) { showFormMessage(`Failed to add item: ${error.message}`, "error"); return; }

        // Fire-and-forget dietary API — silent fail is fine
        try {
          await fetch("http://localhost:3000/api/dietary-tags", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ item_name: itemName, tags: selectedTags }),
          });
        } catch {
          console.log("Dietary API not available yet.");
        }

        showFormMessage("Item added successfully!", "success");
      }

      /* ── Reset form ── */
      editingItemId = null;
      menuForm.reset();
      resetImagePreview();
      clearAllErrors();
      otherInputWrap.style.display = "none";
      otherInput.value = "";
      cancelEditBtn.style.display = "none";

      const cardTitle = document.getElementById("form-card-title");
      if (cardTitle) cardTitle.textContent = "Add Menu Item";

      await loadMenuItems();

    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = editingItemId
        ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><polyline points="17 21 17 13 7 13 7 21" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg> Save Changes`
        : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> Add Item`;
    }
  });

  /* ── Initial load ── */
  await loadMenuItems();
});

/* ══════════════════════════════════════════════════════
   AUTH  (defined at module scope — no scoping issues)
══════════════════════════════════════════════════════ */

async function getApprovedVendorAuth() {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false, message: "Please log in first." };

  const { data: appUser, error: userError } = await supabase
    .from("users").select("id, role").eq("id", user.id).single();

  if (userError || !appUser) return { ok: false, message: "Unable to verify user profile." };
  if (appUser.role !== "vendor") return { ok: false, message: "Access denied. Vendors only." };

  const { data: vendor, error: vendorError } = await supabase
    .from("vendors").select("id, business_name, status").eq("user_id", user.id).single();

  if (vendorError || !vendor) return { ok: false, message: "Vendor profile not found." };

  if (vendor.status === "pending") {
    await supabase.auth.signOut();
    return { ok: false, message: "Your vendor account is still pending approval." };
  }
  if (vendor.status === "suspended") {
    await supabase.auth.signOut();
    return { ok: false, message: "Your vendor account has been suspended." };
  }
  if (vendor.status !== "approved") {
    await supabase.auth.signOut();
    return { ok: false, message: "Unknown vendor status." };
  }

  return { ok: true, user, vendor };
}

/* ══════════════════════════════════════════════════════
   UTILS
══════════════════════════════════════════════════════ */

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDietaryTag(tag) {
  return tag
    .replaceAll("_", "-")
    .replace(/\b\w/g, l => l.toUpperCase());
}