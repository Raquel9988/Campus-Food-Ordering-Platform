import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://sqbscxfolbckikrzxqhr.supabase.co",
  "sb_publishable_Zw_iCK1n54xXGPuDWALWQQ_k2cOQWay"
);

window.addEventListener("load", async () => {
  const menuForm = document.getElementById("menu-item-form");
  const menuItemsContainer = document.getElementById("menu-items-container");
  const submitBtn = document.getElementById("submit-btn");
  const cancelEditBtn = document.getElementById("cancel-edit-btn");
  const otherCheckbox = document.getElementById("other-checkbox");
  const otherInput = document.getElementById("other-input");

  otherCheckbox.addEventListener("change", () => {
    otherInput.style.display = otherCheckbox.checked?"block":"none";
    if (!otherCheckbox.checked){
      otherInput.value = "";
    }
    const dietaryAnchor = document.getElementById("dietary-anchor");
    otherInput.setCustomValidity("");
    dietaryAnchor.setCustomValidity("");
  });

  otherInput.addEventListener("input", () =>{
    otherInput.setCustomValidity("");

    const dietaryAnchor = document.getElementById("dietary-anchor");
    dietaryAnchor.setCustomValidity("");
  });

  document.querySelectorAll(".dietary-tag").forEach(tag => {
    tag.addEventListener("change", () => {
      const dietaryAnchor = document.getElementById("dietary-anchor");
      dietaryAnchor.setCustomValidity("");
    });
  });

  let editingItemId = null;

  const authResult = await getApprovedVendorAuth();

  if (!authResult.ok) {
    alert(authResult.message);
    window.location.href = "../auth/login.html";
    return;
  }

  const { user, vendor } = authResult;

  await loadMenuItems();

  async function loadMenuItems() {
    const { data: menuItems, error } = await supabase
      .from("menu_items")
      .select("*")
      .eq("vendor_id", vendor.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching menu items:", error);
      menuItemsContainer.innerHTML = "<p>Failed to load menu items.</p>";
      return;
    }

    displayMenuItems(menuItems || []);
  }

  function displayMenuItems(items) {
    if (items.length === 0) {
      menuItemsContainer.innerHTML = "<p>No menu items found. Please add some!</p>";
      return;
    }

    menuItemsContainer.innerHTML = "";

    items.forEach((item) => {
      const itemElement = document.createElement("section");

      itemElement.innerHTML = `
        <h3><u>${escapeHtml(item.name)}</u></h3>
        ${item.image_url
          ? `<img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.name)}" width="120">`
          : ""
        }
        <p><strong>Description:</strong> ${escapeHtml(item.description || "No description available.")}</p>
        <p><strong>Price:</strong> R${Number(item.price).toFixed(2)}</p>
        <p><strong>Availability:</strong> ${item.is_available ? "Available" : "Sold Out"}</p>
        <p><strong>Dietary Tags:</strong> ${
          item.dietary_tags?.length
          ? formatDietaryTags(item.dietary_tags)
          : "None"
        }</p>

        <button class="edit-btn">Edit</button>
        <button class="delete-btn">Delete</button>
      `;

      itemElement.querySelector(".edit-btn").addEventListener("click", () => {
        startEdit(item);
      });

      itemElement.querySelector(".delete-btn").addEventListener("click", async () => {
        const confirmDelete = confirm("Are you sure you want to delete this item?");
        if (!confirmDelete) return;

        const { error } = await supabase
          .from("menu_items")
          .delete()
          .eq("id", item.id)
          .eq("vendor_id", vendor.id);

        if (error) {
          alert("Failed to delete item.");
          return;
        }

        await loadMenuItems();
      });

      menuItemsContainer.appendChild(itemElement);
    });
  }

  function startEdit(item) {
    editingItemId = item.id;

    document.getElementById("item-name").value = item.name;
    document.getElementById("item-description").value = item.description || "";
    document.getElementById("item-price").value = item.price;
    document.getElementById("item-availability").value = item.is_available ? "true" : "false";
    
    const predefinedTags=["halal","vegetarian","vegan","nut_free","gluten_free","dairy_free"];
    document.querySelectorAll(".dietary-tag").forEach(tag => {
      tag.checked = false;
    });
    otherCheckbox.checked = false;
    otherInput.style.display = "none";
    otherInput.value = "";

    const customTags =[];

    item.dietary_tags?.forEach(tag => {
      if (predefinedTags.includes(tag)){
        const checkbox = document.querySelector(`.dietary-tag[value="${tag}"]`);
        if (checkbox) {
          checkbox.checked = true;
        }
      }
      else{
        customTags.push(tag);
      }
    });

    if (customTags.length > 0){
      otherCheckbox.checked = true;
      otherInput.style.display = "block";
      otherInput.value = customTags.join(", ");
    }

    submitBtn.textContent = "Update Item";
    cancelEditBtn.style.display = "inline-block";
  }

  cancelEditBtn.addEventListener("click", () => {
    editingItemId = null;
    menuForm.reset();
    submitBtn.textContent = "Add Item";
    cancelEditBtn.style.display = "none";
  });

  menuForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const itemName = document.getElementById("item-name").value.trim();
    const itemDescription = document.getElementById("item-description").value.trim();
    const itemPrice = parseFloat(document.getElementById("item-price").value);
    const itemAvailability = document.getElementById("item-availability").value === "true";
    const imageFile = document.getElementById("item-image").files[0];
    let selectedTags = [...document.querySelectorAll(".dietary-tag:checked")].map(tag => tag.value);

    const dietaryAnchor = document.getElementById("dietary-anchor");

    otherInput.setCustomValidity("");
    dietaryAnchor.setCustomValidity("");

    if (otherCheckbox.checked){
      if (otherInput.value.trim() === ""){
        otherInput.setCustomValidity("Please enter a custom dietary tag");
        otherInput.reportValidity();
        return;
      }
    }
    else{
      if (selectedTags.length === 0){
        dietaryAnchor.setCustomValidity("Please select at least one dietary tag");
        dietaryAnchor.reportValidity();
        return;
      }
    }

    if (otherCheckbox.checked){
      const extraTags = otherInput.value
        .split(",")
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag !== "");

      selectedTags.push(...extraTags);
    }

    let imageUrl = null;

    if (!itemName) {
      alert("Enter item name.");
      return;
    }

    if (isNaN(itemPrice) || itemPrice < 0) {
      alert("Enter a valid price.");
      return;
    }

    if (imageFile) {
      const fileName = `${vendor.id}_${Date.now()}_${imageFile.name}`;

      const { error: uploadError } = await supabase.storage
        .from("menu-images")
        .upload(fileName, imageFile);

      if (uploadError) {
        alert("Image upload failed.");
        return;
      }

      const { data } = supabase.storage.from("menu-images").getPublicUrl(fileName);
      imageUrl = data.publicUrl;
    }

    if (editingItemId) {
      const updateData = {
        name: itemName,
        description: itemDescription,
        price: itemPrice,
        is_available: itemAvailability,
        dietary_tags: selectedTags,
        updated_at: new Date().toISOString(),
      };

      if (imageUrl) {
        updateData.image_url = imageUrl;
      }

      const { error } = await supabase
        .from("menu_items")
        .update(updateData)
        .eq("id", editingItemId)
        .eq("vendor_id", vendor.id);

      if (error) {
        alert("Update failed.");
        return;
      }

      alert("Item updated.");
    } else {
      const { error } = await supabase.from("menu_items").insert([
        {
          vendor_id: vendor.id,
          name: itemName,
          description: itemDescription,
          price: itemPrice,
          is_available: itemAvailability,
          image_url: imageUrl,
          dietary_tags: selectedTags
        },
      ]);

      if (error) {
        alert("Insert failed.");
        return;
      }

      try{
        await fetch("http://localhost:3000/api/dietary-tags",{
          method:"POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            item_name: itemName,
            tags: selectedTags
          })
        });
      }
      catch(error){
        console.log("Dietary API not available yet.")
      }
      alert("Item added.");
    }

    editingItemId = null;
    menuForm.reset();

    document.querySelectorAll(".dietary-tag").forEach(tag =>{
      tag.checked = false;
    });

    otherInput.style.display = "none";
    otherInput.value = "";

    cancelEditBtn.style.display = "none";
    submitBtn.textContent = "Add Item";

    await loadMenuItems();
  });

  async function getApprovedVendorAuth() {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { ok: false, message: "Please log in first." };
    }

    const { data: appUser, error: userError } = await supabase
      .from("users")
      .select("id, role")
      .eq("id", user.id)
      .single();

    if (userError || !appUser) {
      return { ok: false, message: "Unable to verify user profile." };
    }

    if (appUser.role !== "vendor") {
      return { ok: false, message: "Access denied. Vendors only." };
    }

    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("id, business_name, status")
      .eq("user_id", user.id)
      .single();

    if (vendorError || !vendor) {
      return { ok: false, message: "Vendor profile not found." };
    }

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

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatDietaryTags(tags){
    return tags.map(tag => 
      tag
        .replaceAll("_","-")
        .replace(/\b\w/g, letter => letter.toUpperCase())
    ).join(", ");
  }
});