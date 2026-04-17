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

let CART_KEY = "campus_cart";

function getCart() {
  const cart = JSON.parse(localStorage.getItem(CART_KEY));
  return cart ? structuredClone(cart) : {};
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

document.getElementById("place-order").addEventListener("click", placeOrder);
async function placeOrder() {
  const cart = getCart();

  if (Object.keys(cart).length === 0) {
    showToast("Your cart is empty!");
    return;
  }

  // 🔥 get logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    alert("You must be logged in");
    return;
  }

  try {
    // 🔥 LOOP PER VENDOR (IMPORTANT)
    // This is crucial because each order can only have one vendor_id due to our DB design.
    for (const vendorId of Object.keys(cart)) {
      // 1️⃣ Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([
          {
            student_id: user.id,
            vendor_id: vendorId,
            status: "received",
          },
        ])
        .select()
        .single();

      if (orderError) throw orderError;

      // 2️⃣ Insert order items
      const items = cart[vendorId].items;

      const orderItems = items.map((item) => ({
  order_id: order.id,
  menu_item_id: item.menuItemId,
  quantity: item.quantity,
  price: item.price, // 🔥 IMPORTANT
}));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;
    }

    // ✅ SUCCESS
    showToast("Order placed successfully!🎊");

    localStorage.removeItem(CART_KEY); // clear cart

    window.location.href = "student-dashboard.html";
  } catch (err) {
    console.error("Order error:", err);
    alert("Failed to place order.");
  }
}

async function renderCart() {
  const container = document.getElementById("cart-items");
  const totalEl = document.getElementById("total");

  const cart = getCart();

  
  container.innerHTML = "";

  let total = 0;

  for (const vendorId of Object.keys(cart)) {
    const { data: vendor, error } = await supabase
      .from("vendors")
      .select("business_name")
      .eq("id", vendorId)
      .single();

    const vendorName = vendor?.business_name || "Unknown Vendor";

    const vendorSection = document.createElement("div");
    vendorSection.innerHTML = `<h3>${vendorName}</h3>`;  

    cart[vendorId].items.forEach((item) => {
      total += item.price * item.quantity;

      const itemDiv = document.createElement("div");

     itemDiv.innerHTML = `
  <div class="cart-item">
    <img src="${item.image_url}" class="cart-image" />

    <div class="cart-info">
      <p class="item-name">${item.name}</p>
      <p>R ${Number(item.price).toFixed(2)}</p>
      <p class="item-qty">Qty: ${item.quantity}</p>

      <div class="cart-actions">
        <button class="minus">-</button>
        <button class="plus">+</button>
        <button class="remove">Remove</button>
      </div>
    </div>
  </div>
`;

      // decrease qty
        itemDiv.querySelector(".minus").onclick = () => {
  if (item.quantity > 1) {
    item.quantity--;
    saveCart(cart);
  } else {
    removeItem(vendorId, item.menuItemId);
  }
  renderCart();
};

      // increase qty
      itemDiv.querySelector(".plus").onclick = () => {
        item.quantity++;
        saveCart(cart);
        renderCart();
      };

      // remove
      itemDiv.querySelector(".remove").onclick = () => {
  removeItem(vendorId, item.menuItemId);
  renderCart();
};

      vendorSection.appendChild(itemDiv);
    });

    container.appendChild(vendorSection);
  };

  totalEl.textContent = `Total: R ${total.toFixed(2)}`;
}

function removeItem(vendorId, menuItemId) {
  const cart = getCart();

  const vendorItems = cart[vendorId]?.items || [];

  const updatedItems = vendorItems.filter(item => {
    return String(item.menuItemId) !== String(menuItemId);
  });

  if (updatedItems.length === 0) {
    delete cart[vendorId];
  } else {
    cart[vendorId].items = updatedItems;
  }

  saveCart(cart);
}



async function initCart() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    CART_KEY = `campus_cart_${user.id}`;
  }

  renderCart();
}

initCart();


// 🔙 back button
//? prevents errors if the button doenst exist

document.querySelector(".back-btn")?.addEventListener("click", () => {
  window.location.href = "student-dashboard.html";
});
