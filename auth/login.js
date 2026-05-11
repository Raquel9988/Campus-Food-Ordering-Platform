const SUPABASE_URL = "https://sqbscxfolbckikrzxqhr.supabase.co";
const SUPABASE_KEY = "sb_publishable_Zw_iCK1n54xXGPuDWALWQQ_k2cOQWay";

async function createDefaultSupabaseClient() {
  const supabaseModuleUrl =
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

  const { createClient } = await import(
    /* @vite-ignore */ supabaseModuleUrl
  );

  return createClient(SUPABASE_URL, SUPABASE_KEY);
}

function setMessage(messageElement, color, text) {
  if (!messageElement) return;

  messageElement.style.color = color;
  messageElement.textContent = text;
}

export async function sendLoginLink({
  supabaseClient,
  email,
  messageElement,
  browserWindow,
}) {
  const cleanEmail = String(email || "").trim().toLowerCase();

  if (!cleanEmail) {
    setMessage(messageElement, "red", "Please enter your email.");
    return;
  }

  setMessage(messageElement, "black", "Sending login link...");

  const { error } = await supabaseClient.auth.signInWithOtp({
    email: cleanEmail,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: browserWindow.location.origin + "/auth/login.html",
    },
  });

  if (error) {
    setMessage(
      messageElement,
      "red",
      error.message || "Could not send login link. Make sure you are registered."
    );
    return;
  }

  setMessage(messageElement, "green", "Login link sent. Check your email.");
}

export async function handleAuthenticatedLogin({
  supabaseClient,
  messageElement,
  browserWindow,
}) {
  const {
    data: { user },
    error: userError,
  } = await supabaseClient.auth.getUser();

  if (userError || !user) {
    return;
  }

  setMessage(messageElement, "black", "Signing you in...");

  const { data: appUser, error: roleError } = await supabaseClient
    .from("users")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (roleError || !appUser) {
    setMessage(messageElement, "red", "User role not found.");
    return;
  }

  if (appUser.role === "student") {
    browserWindow.location.href = "../student/student-dashboard.html";
    return;
  }

  if (appUser.role === "vendor") {
    const { data: vendor, error: vendorError } = await supabaseClient
      .from("vendors")
      .select("status")
      .eq("user_id", user.id)
      .single();

    if (vendorError || !vendor) {
      setMessage(messageElement, "red", "Vendor profile not found.");
      return;
    }

    if (vendor.status === "pending") {
      setMessage(
        messageElement,
        "orange",
        "Your vendor account is waiting for admin approval."
      );
      await supabaseClient.auth.signOut();
      return;
    }

    if (vendor.status === "suspended") {
      setMessage(
        messageElement,
        "red",
        "Your vendor account has been suspended."
      );
      await supabaseClient.auth.signOut();
      return;
    }

    if (vendor.status === "approved") {
      browserWindow.location.href = "../vendor/vendor-dashboard.html";
      return;
    }

    setMessage(messageElement, "red", "Unknown vendor status.");
    await supabaseClient.auth.signOut();
    return;
  }

  if (appUser.role === "admin") {
    const { data: admin, error: adminError } = await supabaseClient
      .from("admins")
      .select("status, is_master")
      .eq("user_id", user.id)
      .single();

    if (adminError || !admin) {
      setMessage(messageElement, "red", "Admin profile not found.");
      return;
    }

    const hasAdminAccess = admin.is_master || admin.status === "approved";

    if (!hasAdminAccess) {
      if (admin.status === "pending") {
        setMessage(
          messageElement,
          "orange",
          "Your admin account is waiting for master admin approval."
        );
      } else if (admin.status === "suspended") {
        setMessage(
          messageElement,
          "red",
          "Your admin account has been suspended."
        );
      } else {
        setMessage(messageElement, "red", "Admin access denied.");
      }

      await supabaseClient.auth.signOut();
      return;
    }

    browserWindow.location.href = "../adminControls/admin-controls.html";
    return;
  }

  setMessage(messageElement, "red", "Unknown user role.");
  await supabaseClient.auth.signOut();
}

export async function setupLoginPage({
  documentRef = document,
  browserWindow = window,
  supabaseClient,
} = {}) {
  const client = supabaseClient || (await createDefaultSupabaseClient());

  const form = documentRef.getElementById("login-form");
  const message = documentRef.getElementById("message");

  if (!form || !message) {
    return;
  }

  await handleAuthenticatedLogin({
    supabaseClient: client,
    messageElement: message,
    browserWindow,
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const emailInput = documentRef.getElementById("email");

    await sendLoginLink({
      supabaseClient: client,
      email: emailInput ? emailInput.value : "",
      messageElement: message,
      browserWindow,
    });
  });
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", async () => {
    await setupLoginPage();
  });
}