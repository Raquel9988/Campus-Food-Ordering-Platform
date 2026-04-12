import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

window.addEventListener("load", async () => {

    //Supabase Setup

  const supabase = createClient(
    "https://sqbscxfolbckikrzxqhr.supabase.co",
    "sb_publishable_Zw_iCK1n54xXGPuDWALWQQ_k2cOQWay"
  );

  // Elements

  const menuForm = document.getElementById("menu-item-form");
  const menuItemsContainer = document.getElementById("menu-items-container");
  const submitBtn = document.getElementById("submit-btn");
  const cancelEditBtn = document.getElementById("cancel-edit-btn");

  let editingItemId = null;

  // AUTH CHECK
  
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    window.location.href = "../auth/login.html";
    return;
  }

  const { data: users, error: roleError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id);

  if (roleError || !users || users.length === 0) {
    window.location.href = "../auth/login.html";
    return;
  }

  if (users[0].role !== "vendor") {
    alert("Access denied");
    window.location.href = "../auth/login.html";
    return;
  }

 
  //LOAD MENU ITEMS
  
  async function loadMenuItems() {
    const { data: menuItems, error } = await supabase
      .from("menu_items")
      .select("*")
      .eq("vendor_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching menu items:", error);
      menuItemsContainer.innerHTML = "<p>Failed to load menu items.</p>";
      return;
    }

    displayMenuItems(menuItems);
  }

  
  //DISPLAY ITEMS
  
  function displayMenuItems(items) {
    if (!items || items.length === 0) {
      menuItemsContainer.innerHTML =
        "<p>No menu items found. Please add some!</p>";
      return;
    }

    menuItemsContainer.innerHTML = "";

    items.forEach((item) => {
      const itemElement = document.createElement("section");

      itemElement.innerHTML = `
        <h3><u>${item.name}</u></h3>
        ${
          item.image_url
            ? `<img src="${item.image_url}" alt="${item.name}" width="120">`
            : ""
        }
        <p><strong>Description:</strong> ${
          item.description || "No description available."
        }</p>
        <p><strong>Price:</strong> R${item.price.toFixed(2)}</p>
        <p><strong>Availability:</strong> ${
          item.is_available ? "Available" : "Sold Out"
        }</p>

        <button class="edit-btn">Edit</button>
        <button class="delete-btn">Delete</button>
      `;

      // EDIT BUTTON
      itemElement.querySelector(".edit-btn").addEventListener("click", () => {
        startEdit(item);
      });

      // DELETE BUTTON 
      itemElement.querySelector(".delete-btn").addEventListener("click", async () => {
        const confirmDelete = confirm("Are you sure you want to delete this item?");
        if (!confirmDelete) return;

        const { error } = await supabase
          .from("menu_items")
          .delete()
          .eq("id", item.id)
          .eq("vendor_id", user.id);

        if (error) {
          alert("Failed to delete item");
          return;
        }

        await loadMenuItems();
      });

      menuItemsContainer.appendChild(itemElement);
    });
  }

  //START EDIT//
  function startEdit(item) {
    editingItemId = item.id;

    document.getElementById("item-name").value = item.name;
    document.getElementById("item-description").value = item.description || "";
    document.getElementById("item-price").value = item.price;
    document.getElementById("item-availability").value = item.is_available
      ? "true"
      : "false";

    submitBtn.textContent = "Update Item";
    cancelEditBtn.style.display = "inline-block";
  }

  
  //CANCEL EDIT //
  cancelEditBtn.addEventListener("click", () => {
    editingItemId = null;
    menuForm.reset();
    submitBtn.textContent = "Add Item";
    cancelEditBtn.style.display = "none";
  });


  //FORM SUBMIT//
  
  menuForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const itemName = document.getElementById("item-name").value;
    const itemDescription = document.getElementById("item-description").value;
    const itemPrice = parseFloat(
      document.getElementById("item-price").value
    );
    const itemAvailability =
      document.getElementById("item-availability").value === "true";

    const imageFile = document.getElementById("item-image").files[0];
    let imageUrl = null;

    // VALIDATION//
    if (!itemName) {
      alert("Enter item name");
      return;
    }

    if (isNaN(itemPrice) || itemPrice < 0) {
      alert("Enter valid price");
      return;
    }

    // IMAGE UPLOAD//
    if (imageFile) {
      const fileName = `${user.id}_${Date.now()}_${imageFile.name}`;

      const { error: uploadError } = await supabase.storage
        .from("menu-images")
        .upload(fileName, imageFile);

      if (uploadError) {
        alert("Image upload failed");
        return;
      }

      const { data } = supabase.storage
        .from("menu-images")
        .getPublicUrl(fileName);

      imageUrl = data.publicUrl;
    }

    // UPDATE //
    if (editingItemId) {
      const updateData = {
        name: itemName,
        description: itemDescription,
        price: itemPrice,
        is_available: itemAvailability,
      };

      if (imageUrl) updateData.image_url = imageUrl;

      const { error } = await supabase
        .from("menu_items")
        .update(updateData)
        .eq("id", editingItemId)
        .eq("vendor_id", user.id);

      if (error) {
        alert("Update failed");
        return;
      }

      alert("Item updated!");
    }

    // INSERT//
    else {
      const { error } = await supabase.from("menu_items").insert([
        {
          vendor_id: user.id,
          name: itemName,
          description: itemDescription,
          price: itemPrice,
          is_available: itemAvailability,
          image_url: imageUrl || null,
        },
      ]);

      if (error) {
        alert("Insert failed");
        return;
      }

      alert("Item added!");
    }

    // RESET + RELOAD//
    editingItemId = null;
    menuForm.reset();
    cancelEditBtn.style.display = "none";
    submitBtn.textContent = "Add Item";

    await loadMenuItems();
  });

 
  //INITIAL LOAD//
  
  loadMenuItems();

});
