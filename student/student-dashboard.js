import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// Supabase setup
const supabaseUrl = "https://sqbscxfolbckikrzxqhr.supabase.co";
const supabaseKey = "sb_publishable_Zw_iCK1n54xXGPuDWALWQQ_k2cOQWay";

const supabase = createClient(supabaseUrl, supabaseKey);

// Wait for page to fully load
window.addEventListener("load", async () => {
  console.log("Student dashboard loaded");

  // Check if user is logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    window.location.href = "../auth/login.html";
    return;
  }

  // Get user role from DB
  const { data: users, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id);

  if (error || !users || users.length === 0) {
    window.location.href = "../auth/login.html";
    return;
  }

  const role = users[0].role;

  // Only allow students
  if (role !== "student") {
    alert("Access denied - Students only");
    window.location.href = "../auth/login.html";
    return;
  }

  // Show user email
  const userInfo = document.getElementById("user-info");
  if (userInfo) {
    userInfo.textContent = "Logged in as: " + user.email;
  }

  // Load available vendors
  await loadVendors();

  // Logout button
  const logoutBtn = document.getElementById("logout");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      console.log("Logout clicked");

      await supabase.auth.signOut();

      window.location.href = "../auth/login.html";
    });
  }
});

// Function to load and display approved vendors
async function loadVendors() {
  const vendorsList = document.getElementById("vendors-list");

  // Get all approved vendors
  const { data: vendors, error } = await supabase
    .from("vendors")
    .select("id, business_name, user_id")
    .eq("status", "approved");

  if (error) {
    vendorsList.innerHTML = "<p>Error loading vendors</p>";
    console.error("Error fetching vendors:", error);
    return;
  }

  if (!vendors || vendors.length === 0) {
    vendorsList.innerHTML = "<p>No vendors available yet</p>";
    return;
  }

  // Display vendors
  vendorsList.innerHTML = "";

  vendors.forEach((vendor) => {
    const vendorCard = document.createElement("div");
    vendorCard.className = "vendor-card";
    vendorCard.innerHTML = `
            <h4>${vendor.business_name}</h4>
            <button onclick="viewMenu('${vendor.id}')">View Menu</button>
        `;
    vendorsList.appendChild(vendorCard);
  });
}

// Function to view a vendor's menu (placeholder for now)
window.viewMenu = function (vendorId) {
  alert("Menu viewing coming soon! Vendor ID: " + vendorId);
  // Future: redirect to menu page or show menu items
};
