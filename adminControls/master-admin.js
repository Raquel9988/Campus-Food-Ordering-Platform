import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://sqbscxfolbckikrzxqhr.supabase.co",
  "sb_publishable_Zw_iCK1n54xXGPuDWALWQQ_k2cOQWay"
);

const message = document.getElementById("message");
const adminTableBody = document.getElementById("admin-table-body");
const logoutBtn = document.getElementById("logout-btn");

let currentMasterAdmin = null;

document.addEventListener("DOMContentLoaded", async () => {
  const authResult = await getMasterAdminAuth();

  if (!authResult.ok) {
    message.textContent = authResult.message;
    setTimeout(() => {
      window.location.href = "../auth/login.html";
    }, 1500);
    return;
  }

  currentMasterAdmin = authResult.admin;
  message.textContent = "Welcome, master admin.";

  await loadAdmins();
});

logoutBtn.addEventListener("click", async () => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    message.textContent = error.message;
    return;
  }

  window.location.href = "../auth/login.html";
});

async function getMasterAdminAuth() {
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
    return { ok: false, message: "Unable to verify user role." };
  }

  if (appUser.role !== "admin") {
    return { ok: false, message: "Access denied. Admins only." };
  }

  const { data: admin, error: adminError } = await supabase
    .from("admins")
    .select("id, user_id, status, is_master")
    .eq("user_id", user.id)
    .single();

  if (adminError || !admin) {
    return { ok: false, message: "Admin profile not found." };
  }

  if (!admin.is_master) {
    return { ok: false, message: "Access denied. Master admin only." };
  }

  return { ok: true, user, admin };
}

async function loadAdmins() {
  message.textContent = "Loading admins...";

  adminTableBody.innerHTML = `
    <tr>
      <td colspan="7">Loading admins...</td>
    </tr>
  `;

  const { data: admins, error: adminsError } = await supabase
    .from("admins")
    .select("*")
    .order("created_at", { ascending: false });

  if (adminsError) {
    message.textContent = adminsError.message;
    adminTableBody.innerHTML = `
      <tr>
        <td colspan="7">Failed to load admins.</td>
      </tr>
    `;
    return;
  }

  if (!admins || admins.length === 0) {
    adminTableBody.innerHTML = `
      <tr>
        <td colspan="7">No admins found.</td>
      </tr>
    `;
    message.textContent = "No admins found.";
    return;
  }

  const userIds = admins.map((admin) => admin.user_id);
  const approverIds = admins
    .filter((admin) => admin.approved_by)
    .map((admin) => admin.approved_by);

  const allUserIds = [...new Set([...userIds, ...approverIds])];

  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, email")
    .in("id", allUserIds);

  if (usersError) {
    message.textContent = usersError.message;
    adminTableBody.innerHTML = `
      <tr>
        <td colspan="7">Failed to load user emails.</td>
      </tr>
    `;
    return;
  }

  const userMap = {};
  users.forEach((user) => {
    userMap[user.id] = user.email;
  });

  renderAdmins(admins, userMap);
  message.textContent = "";
}

function renderAdmins(admins, userMap) {
  adminTableBody.innerHTML = "";

  admins.forEach((admin) => {
    const email = userMap[admin.user_id] || "N/A";
    const approvedByEmail = admin.approved_by
      ? userMap[admin.approved_by] || "Unknown"
      : "N/A";

    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${escapeHtml(email)}</td>
      <td class="${escapeHtml(admin.status)}">${escapeHtml(admin.status)}</td>
      <td>${admin.is_master ? "Yes" : "No"}</td>
      <td>${escapeHtml(approvedByEmail)}</td>
      <td>${formatDate(admin.created_at)}</td>
      <td>${formatDate(admin.updated_at)}</td>
      <td>${getButtons(admin)}</td>
    `;

    adminTableBody.appendChild(row);
  });

  attachButtonEvents();
}

function getButtons(admin) {
  if (admin.is_master) {
    return `<span>Protected</span>`;
  }

  if (admin.status === "pending") {
    return `
      <button data-id="${admin.id}" data-action="approve">Approve</button>
      <button data-id="${admin.id}" data-action="suspend">Suspend</button>
    `;
  }

  if (admin.status === "approved") {
    return `
      <button data-id="${admin.id}" data-action="suspend">Suspend</button>
    `;
  }

  if (admin.status === "suspended") {
    return `
      <button data-id="${admin.id}" data-action="approve">Re-Approve</button>
    `;
  }

  return "";
}

function attachButtonEvents() {
  const buttons = document.querySelectorAll("[data-action]");

  buttons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const adminId = btn.dataset.id;
      const action = btn.dataset.action;

      if (action === "approve") {
        await updateAdminStatus(adminId, "approved");
      }

      if (action === "suspend") {
        await updateAdminStatus(adminId, "suspended");
      }
    });
  });
}

async function updateAdminStatus(adminId, newStatus) {
  const authResult = await getMasterAdminAuth();

  if (!authResult.ok) {
    message.textContent = authResult.message;
    return;
  }

  message.textContent = `Updating admin to ${newStatus}...`;

  const updateData = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  if (newStatus === "approved") {
    updateData.approved_by = currentMasterAdmin.user_id;
  }

  const { data: targetAdmin, error: targetError } = await supabase
    .from("admins")
    .select("id, is_master")
    .eq("id", adminId)
    .single();

  if (targetError || !targetAdmin) {
    message.textContent = "Admin record not found.";
    return;
  }

  if (targetAdmin.is_master) {
    message.textContent = "Master admin cannot be changed here.";
    return;
  }

  const { error } = await supabase
    .from("admins")
    .update(updateData)
    .eq("id", adminId);

  if (error) {
    message.textContent = error.message;
    return;
  }

  message.textContent = `Admin ${newStatus}.`;
  await loadAdmins();
}

function formatDate(date) {
  if (!date) return "N/A";
  return new Date(date).toLocaleString();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}