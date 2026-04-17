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

async function clearCart() {
  const key = await getCartKey();
  localStorage.removeItem(key);
}

async function getStudentAuth() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, message: "Please log in first." };
  }

  const { data: appUser, error: roleError } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (roleError || !appUser) {
    return { ok: false, message: "Unable to verify your account." };
  }

  if (appUser.role !== "student") {
    return { ok: false, message: "Access denied. Students only." };
  }

  return { ok: true, user };
}

async function validateVendor(vendorId) {
  const { data, error } = await supabase
    .from("vendors")
    .select("id, business_name, status")
    .eq("id", vendorId)
    .eq("status", "approved")
    .single();

  if (error || !data) {
    return { ok: false, message: "One of the selected vendors is no longer available." };
  }

  return { ok: true, vendor: data };
}

async function validateMenuItems(vendorId, cartItems) {
  const itemIds = cartItems.map((item) => item.menuItemId);

  const { data, error } = await supabase
    .from("menu_items")
    .select("id, vendor_id, name, price, is_available")
    .in("id", itemIds)
    .eq("vendor_id", vendorId);

  if (error) {
    return { ok: false, message: "Failed to validate menu items." };
  }

  const dbMap = new Map(data.map((item) => [String(item.id), item]));
  const validatedItems = [];

  for (const cartItem of cartItems) {
    const dbItem = dbMap.get(String(cartItem.menuItemId));

    if (!dbItem) {
      return { ok: false, message: `Item "${cartItem.name}" no longer exists.` };
    }

    if (!dbItem.is_available) {
      return { ok: false, message: `Item "${dbItem.name}" is currently sold out.` };
    }

    if (!Number.isInteger(cartItem.quantity) || cartItem.quantity <= 0) {
      return { ok: false, message: `Invalid quantity for "${cartItem.name}".` };
    }

    validatedItems.push({
      menu_item_id: dbItem.id,
      quantity: cartItem.quantity,
      price: dbItem.price,
      name: dbItem.name,
    });
  }

  return { ok: true, items: validatedItems };
}

async function createVendorOrder(studentId, vendorId, validatedItems) {
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert([
      {
        student_id: studentId,
        vendor_id: vendorId,
        status: "received",
      },
    ])
    .select()
    .single();

  if (orderError) {
    return { ok: false, message: orderError.message };
  }

  const orderItemsPayload = validatedItems.map((item) => ({
    order_id: order.id,
    menu_item_id: item.menu_item_id,
    quantity: item.quantity,
    price: item.price,
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItemsPayload);

  if (itemsError) {
    return { ok: false, message: itemsError.message };
  }

  return { ok: true, orderId: order.id };
}

async function removeItem(vendorId, menuItemId) {
  const cart = await getCart();
  const vendorItems = cart[vendorId]?.items || [];

  const updatedItems = vendorItems.filter(
    (item) => String(item.menuItemId) !== String(menuItemId)
  );

  if (updatedItems.length === 0) {
    delete cart[vendorId];
  } else {
    cart[vendorId].items = updatedItems;
  }

  await saveCart(cart);
}

async function renderCart() {
  const container = document.getElementById("cart-items");
  const totalEl = document.getElementById("total");

  const cart = await getCart();
  container.innerHTML = "";

  let total = 0;
  const vendorIds = Object.keys(cart);

  if (vendorIds.length === 0) {
    container.innerHTML = `<p class="empty-cart">Your cart is empty.</p>`;
    totalEl.textContent = "Total: R0.00";
    return;
  }

  for (const vendorId of vendorIds) {
    const { data: vendor } = await supabase
      .from("vendors")
      .select("business_name")
      .eq("id", vendorId)
      .single();

    const vendorName = vendor?.business_name || "Unknown Vendor";

    const vendorSection = document.createElement("div");
    vendorSection.className = "vendor-cart-group";

    const vendorHeader = document.createElement("div");
    vendorHeader.className = "vendor-cart-header";
    vendorHeader.innerHTML = `
      <h3>${vendorName}</h3>
      <p>Items from this vendor</p>
    `;

    vendorSection.appendChild(vendorHeader);

    for (const item of cart[vendorId].items) {
      total += Number(item.price) * Number(item.quantity);

      const itemDiv = document.createElement("div");
      itemDiv.className = "cart-item";

      itemDiv.innerHTML = `
        <div class="cart-item-image ${item.image_url ? "" : "empty"}">
          ${
            item.image_url
              ? `<img src="${item.image_url}" alt="${item.name}" />`
              : `<span>No image</span>`
          }
        </div>

        <div class="cart-item-details">
          <h4>${item.name}</h4>
          <p class="cart-item-price">Price: R ${Number(item.price).toFixed(2)}</p>
          <p>Quantity: ${item.quantity}</p>
        </div>

        <div class="cart-item-actions">
          <div class="quantity-controls">
            <button class="minus" type="button">-</button>
            <span class="quantity-value">${item.quantity}</span>
            <button class="plus" type="button">+</button>
          </div>

          <button class="remove-btn" type="button">Remove</button>
        </div>
      `;

      itemDiv.querySelector(".minus").addEventListener("click", async () => {
        const latestCart = await getCart();
        const existingItem = latestCart[vendorId]?.items?.find(
          (i) => String(i.menuItemId) === String(item.menuItemId)
        );

        if (!existingItem) return;

        if (existingItem.quantity > 1) {
          existingItem.quantity -= 1;
          await saveCart(latestCart);
        } else {
          await removeItem(vendorId, item.menuItemId);
        }

        await renderCart();
      });

      itemDiv.querySelector(".plus").addEventListener("click", async () => {
        const latestCart = await getCart();
        const existingItem = latestCart[vendorId]?.items?.find(
          (i) => String(i.menuItemId) === String(item.menuItemId)
        );

        if (!existingItem) return;

        existingItem.quantity += 1;
        await saveCart(latestCart);
        await renderCart();
      });

      itemDiv.querySelector(".remove-btn").addEventListener("click", async () => {
        await removeItem(vendorId, item.menuItemId);
        await renderCart();
      });

      vendorSection.appendChild(itemDiv);
    }

    container.appendChild(vendorSection);
  }

  totalEl.textContent = `Total: R ${total.toFixed(2)}`;
}

document.getElementById("place-order")?.addEventListener("click", placeOrder);

async function placeOrder() {
  const button = document.getElementById("place-order");
  button.disabled = true;
  button.textContent = "Placing order...";

  try {
    const authResult = await getStudentAuth();
    if (!authResult.ok) {
      alert(authResult.message);
      window.location.href = "../auth/login.html";
      return;
    }

    const { user } = authResult;
    const cart = await getCart();

    const vendorIds = Object.keys(cart);
    if (vendorIds.length === 0) {
      showToast("Your cart is empty.");
      return;
    }

    for (const vendorId of vendorIds) {
      const vendorGroup = cart[vendorId];

      if (!vendorGroup?.items || vendorGroup.items.length === 0) {
        showToast("Your cart contains an empty vendor section.");
        return;
      }

      const vendorCheck = await validateVendor(vendorId);
      if (!vendorCheck.ok) {
        showToast(vendorCheck.message);
        return;
      }

      const itemsCheck = await validateMenuItems(vendorId, vendorGroup.items);
      if (!itemsCheck.ok) {
        showToast(itemsCheck.message);
        return;
      }

      const orderResult = await createVendorOrder(user.id, vendorId, itemsCheck.items);
      if (!orderResult.ok) {
        showToast("Failed to place one of your vendor orders.");
        console.error(orderResult.message);
        return;
      }
    }

    await clearCart();
    await renderCart();
    showToast("Order placed successfully.");

    setTimeout(() => {
      window.location.href = "student-dashboard.html";
    }, 1000);
  } catch (error) {
    console.error("Order placement error:", error);
    showToast("Failed to place order.");
  } finally {
    button.disabled = false;
    button.textContent = "Place Order";
  }
}

window.addEventListener("load", async () => {
  const authResult = await getStudentAuth();

  if (!authResult.ok) {
    alert(authResult.message);
    window.location.href = "../auth/login.html";
    return;
  }

  await renderCart();
});

document.querySelector(".back-btn")?.addEventListener("click", () => {
  window.location.href = "student-dashboard.html";
});