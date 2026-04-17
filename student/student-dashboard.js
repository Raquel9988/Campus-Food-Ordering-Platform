import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://sqbscxfolbckikrzxqhr.supabase.co",
  "sb_publishable_Zw_iCK1n54xXGPuDWALWQQ_k2cOQWay"
);


const CART_KEY = "campus_cart";

window.addEventListener("load", async () => {
  const userInfo = document.getElementById("user-info");
  const logoutBtn = document.getElementById("logout");

  const authResult = await getStudentAuth();

  if (!authResult.ok) {
    alert(authResult.message);
    window.location.href = "../auth/login.html";
    return;
  }

  const { user } = authResult;

  if (userInfo) {
    userInfo.textContent = `Logged in as: ${user.email}`;
  }

  await loadVendors();

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await supabase.auth.signOut();
      window.location.href = "../auth/login.html";
    });
  }
});

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
    await supabase.auth.signOut();
    return { ok: false, message: "Access denied. Students only." };
  }

  return { ok: true, user };
}

async function loadVendors() {
  const vendorsList = document.getElementById("vendors-list");

  vendorsList.innerHTML = `<p class="loading-text">Loading vendors...</p>`;

  const { data: vendors, error } = await supabase
    .from("vendors")
    .select("id, business_name, user_id")
    .eq("status", "approved")
    .order("business_name", { ascending: true });

  if (error) {
    console.error("Error fetching vendors:", error);
    vendorsList.innerHTML = `<p class="error-text">Error loading vendors.</p>`;
    return;
  }

  if (!vendors || vendors.length === 0) {
    vendorsList.innerHTML = `<p class="empty-text">No vendors available yet.</p>`;
    return;
  }

  vendorsList.innerHTML = "";

  vendors.forEach((vendor) => {
    const vendorCard = document.createElement("div");
    vendorCard.className = "vendor-card";

    const title = document.createElement("h4");
    title.textContent = vendor.business_name;

    const description = document.createElement("p");
    description.textContent = "Browse this vendor's available menu items.";

    const button = document.createElement("button");
    button.textContent = "View Menu";
    button.addEventListener("click", () => {
      viewMenu(vendor.id);
    });

    vendorCard.appendChild(title);
    vendorCard.appendChild(description);
    vendorCard.appendChild(button);

    vendorsList.appendChild(vendorCard);
  });
}

function viewMenu(vendorId) {

  window.location.href = `student-menu.html?vendorId=${vendorId}`;
}
// this loads the cart from localStorage, or returns an empty object if no cart exists
function getCart() {
  return JSON.parse(localStorage.getItem(CART_KEY)) || {};
}

//this saves the cart to localStorage as a JSON string
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

// this adds an item to the cart for a specific vendor, or increments quantity if it already exists
function addToCart(vendorId, item) {
  const cart = getCart(); // load existing cart or start with empty object

  if (!cart[vendorId]) { // if no cart for this vendor yet, create it
    cart[vendorId] = { items: [] }; // initialize with empty items array
  }

  const vendorCart = cart[vendorId].items; // get the items array for this vendor

  const existingItem = vendorCart.find( 
    (i) => i.menuItemId === item.menuItemId
  );

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    vendorCart.push({
      menuItemId: item.menuItemId,
      name: item.name,
      price: item.price,
      quantity: 1,
    });
  }

  saveCart(cart);
}

document.getElementById("view-cart")?.addEventListener("click", () => {
  window.location.href = "student-cart.html";
});