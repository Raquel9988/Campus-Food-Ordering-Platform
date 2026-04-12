import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// Supabase setup
const supabaseUrl = "https://sqbscxfolbckikrzxqhr.supabase.co";
const supabaseKey = "sb_publishable_Zw_iCK1n54xXGPuDWALWQQ_k2cOQWay";

const supabase = createClient(supabaseUrl, supabaseKey);

// wait for page to fully load
window.addEventListener("load", async () => {
  console.log("Dashboard loaded"); // debug

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

  // Only allow vendors
  if (role !== "vendor") {
    alert("Access denied");
    window.location.href = "../auth/login.html";
    return;
  }

  // Show user email
  const userInfo = document.getElementById("user-info");
  if (userInfo) {
    userInfo.textContent = "Logged in as: " + user.email;
  }

  // Logout button
  const logoutBtn = document.getElementById("logout");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      console.log("Logout clicked");

      await supabase.auth.signOut();

      window.location.href = "../auth/login.html";
    });
  } else {
    console.log("Logout button not found");
  }
});
