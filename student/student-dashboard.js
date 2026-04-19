import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://sqbscxfolbckikrzxqhr.supabase.co",
  "sb_publishable_Zw_iCK1n54xXGPuDWALWQQ_k2cOQWay"
);

/* ========================================
   ELEMENTS
======================================== */
const userInfo = document.getElementById("user-info");
const logoutBtn = document.getElementById("logout");
const vendorsList = document.getElementById("vendors-list");
const notificationDot = document.getElementById("order-notification");

/* ========================================
   NOTIFICATION (SAME AS WORKING CODE)
======================================== */
function showNotification() {
  notificationDot?.classList.remove("hidden");
}

function hideNotification() {
  notificationDot?.classList.add("hidden");
}

/* ========================================
   AUTH (MATCHED STYLE)
======================================== */
async function getStudentAuth() {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { ok: false };

  const { data: appUser } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!appUser || appUser.role !== "student") {
    await supabase.auth.signOut();
    return { ok: false };
  }

  return { ok: true, user };
}

/* ========================================
   LOAD VENDORS (KEEP WORKING VERSION)
======================================== */
async function loadVendors() {
  const { data: vendors } = await supabase
    .from("vendors")
    .select("id, business_name")
    .eq("status", "approved");

  vendorsList.innerHTML = "";

  vendors.forEach(vendor => {
    const card = document.createElement("article");

    card.innerHTML = `
      <h4>${vendor.business_name}</h4>
      <button>View Menu</button>
    `;

    card.querySelector("button").onclick = () => {
      window.location.href = `student-menu.html?vendorId=${vendor.id}`;
    };

    vendorsList.appendChild(card);
  });
}

/* ========================================
   REALTIME (THIS IS THE KEY FIX)
======================================== */
function subscribeToOrderUpdates(studentId) {
  supabase
    .channel("orders")
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "orders"
      },
      (payload) => {
        // ✅ ONLY for this student
        if (payload.new?.student_id !== studentId) return;

        // ✅ SIMPLE + WORKING CONDITION
        if (
          payload.new.status === "ready" &&
          payload.old.status !== "ready"
        ) {
          showNotification();
        }
      }
    )
    .subscribe();
}

/* ========================================
   EVENTS
======================================== */
document.getElementById("view-orders")?.addEventListener("click", () => {
  hideNotification();
  window.location.href = "my-orders.html";
});

document.getElementById("view-cart")?.addEventListener("click", () => {
  window.location.href = "student-cart.html";
});

logoutBtn?.addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.href = "../auth/login.html";
});

/* ========================================
   INIT (CLEAN + WORKING)
======================================== */
window.addEventListener("load", async () => {
  const auth = await getStudentAuth();

  if (!auth.ok) {
    window.location.href = "../auth/login.html";
    return;
  }

  userInfo.textContent = `Logged in as: ${auth.user.email}`;

  await loadVendors();                 // ✅ vendors load properly
  subscribeToOrderUpdates(auth.user.id); // ✅ realtime works
});
