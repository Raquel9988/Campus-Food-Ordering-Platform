const SUPABASE_URL = "https://sqbscxfolbckikrzxqhr.supabase.co";
const SUPABASE_KEY = "sb_publishable_Zw_iCK1n54xXGPuDWALWQQ_k2cOQWay";

export const REGISTRATION_KEY = "campus_food_registration";

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

export function updateBusinessNameVisibility({
  role,
  businessNameGroup,
  businessNameInput,
}) {
  if (!businessNameGroup || !businessNameInput) return;

  if (role === "vendor") {
    businessNameGroup.style.display = "block";
    businessNameInput.required = true;
    return;
  }

  businessNameGroup.style.display = "none";
  businessNameInput.required = false;
  businessNameInput.value = "";
}

export async function sendRegistrationLink({
  supabaseClient,
  email,
  role,
  businessName,
  messageElement,
  browserWindow,
  localStorageRef,
}) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanRole = String(role || "").trim();
  const cleanBusinessName = String(businessName || "").trim();

  setMessage(messageElement, "red", "");

  if (!cleanEmail) {
    setMessage(messageElement, "red", "Please enter your email.");
    return;
  }

  if (!cleanRole) {
    setMessage(messageElement, "red", "Please select a role.");
    return;
  }

  if (cleanRole === "vendor" && !cleanBusinessName) {
    setMessage(messageElement, "red", "Please enter the business name.");
    return;
  }

  const registrationData = {
    email: cleanEmail,
    role: cleanRole,
    businessName: cleanRole === "vendor" ? cleanBusinessName : "",
  };

  localStorageRef.setItem(REGISTRATION_KEY, JSON.stringify(registrationData));

  setMessage(messageElement, "black", "Sending registration link...");

  const { error } = await supabaseClient.auth.signInWithOtp({
    email: cleanEmail,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: browserWindow.location.href,
      data: {
        requested_role: cleanRole,
        business_name: cleanRole === "vendor" ? cleanBusinessName : null,
      },
    },
  });

  if (error) {
    setMessage(
      messageElement,
      "red",
      error.message || "Failed to send registration link."
    );
    return;
  }

  setMessage(
    messageElement,
    "green",
    "Registration link sent. Check your email to continue."
  );
}

export async function completeRegistrationIfAuthenticated({
  supabaseClient,
  messageElement,
  browserWindow,
  localStorageRef,
  setTimeoutRef = setTimeout,
}) {
  const {
    data: { user },
    error: userError,
  } = await supabaseClient.auth.getUser();

  if (userError || !user) {
    return;
  }

  const saved = localStorageRef.getItem(REGISTRATION_KEY);

  if (!saved) {
    return;
  }

  let registration;

  try {
    registration = JSON.parse(saved);
  } catch {
    localStorageRef.removeItem(REGISTRATION_KEY);
    return;
  }

  const registeredEmail = String(registration?.email || "").toLowerCase();
  const userEmail = String(user.email || "").toLowerCase();

  if (!registeredEmail || registeredEmail !== userEmail) {
    return;
  }

  setMessage(messageElement, "black", "Completing registration...");

  const { data: existingUser, error: existingUserError } = await supabaseClient
    .from("users")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (existingUserError) {
    setMessage(messageElement, "red", "Could not verify your profile.");
    return;
  }

  if (!existingUser) {
    const { error: insertUserError } = await supabaseClient.from("users").insert([
      {
        id: user.id,
        email: registration.email,
        role: registration.role,
      },
    ]);

    if (insertUserError) {
      setMessage(
        messageElement,
        "red",
        `Profile creation failed: ${insertUserError.message}`
      );
      return;
    }
  }

  if (registration.role === "vendor") {
    const { data: existingVendor, error: vendorCheckError } =
      await supabaseClient
        .from("vendors")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

    if (vendorCheckError) {
      setMessage(messageElement, "red", "Could not verify vendor profile.");
      return;
    }

    if (!existingVendor) {
      const { error: vendorInsertError } = await supabaseClient
        .from("vendors")
        .insert([
          {
            user_id: user.id,
            business_name: registration.businessName,
            status: "pending",
          },
        ]);

      if (vendorInsertError) {
        setMessage(
          messageElement,
          "red",
          `Vendor registration failed: ${vendorInsertError.message}`
        );
        return;
      }
    }
  }

  if (registration.role === "admin") {
    const { data: existingAdmin, error: adminCheckError } = await supabaseClient
      .from("admins")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (adminCheckError) {
      setMessage(messageElement, "red", "Could not verify admin profile.");
      return;
    }

    if (!existingAdmin) {
      const { error: adminInsertError } = await supabaseClient.from("admins").insert([
        {
          user_id: user.id,
          status: "pending",
          is_master: false,
        },
      ]);

      if (adminInsertError) {
        setMessage(
          messageElement,
          "red",
          `Admin registration failed: ${adminInsertError.message}`
        );
        return;
      }
    }
  }

  localStorageRef.removeItem(REGISTRATION_KEY);

  setMessage(messageElement, "green", "");

  if (registration.role === "student") {
    messageElement.textContent =
      "Registration complete. Redirecting to student dashboard...";

    setTimeoutRef(() => {
      browserWindow.location.href = "../student/student-dashboard.html";
    }, 1200);

    return;
  }

  if (registration.role === "vendor") {
    messageElement.textContent =
      "Vendor registration complete. Await admin approval before menu access.";

    setTimeoutRef(() => {
      browserWindow.location.href = "login.html";
    }, 1800);

    return;
  }

  if (registration.role === "admin") {
    messageElement.textContent =
      "Admin registration complete. Await master admin approval.";

    setTimeoutRef(() => {
      browserWindow.location.href = "login.html";
    }, 1800);
  }
}

export async function setupRegisterPage({
  documentRef = document,
  browserWindow = window,
  localStorageRef = localStorage,
  supabaseClient,
  setTimeoutRef = setTimeout,
} = {}) {
  const client = supabaseClient || (await createDefaultSupabaseClient());

  const form = documentRef.getElementById("signup-form");
  const roleSelect = documentRef.getElementById("role");
  const businessNameGroup = documentRef.getElementById("business-name-group");
  const businessNameInput = documentRef.getElementById("business-name");
  const message = documentRef.getElementById("message");

  if (!form || !roleSelect || !businessNameGroup || !businessNameInput || !message) {
    return;
  }

  roleSelect.addEventListener("change", () => {
    updateBusinessNameVisibility({
      role: roleSelect.value,
      businessNameGroup,
      businessNameInput,
    });
  });

  await completeRegistrationIfAuthenticated({
    supabaseClient: client,
    messageElement: message,
    browserWindow,
    localStorageRef,
    setTimeoutRef,
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const emailInput = documentRef.getElementById("email");

    await sendRegistrationLink({
      supabaseClient: client,
      email: emailInput ? emailInput.value : "",
      role: roleSelect.value,
      businessName: businessNameInput.value,
      messageElement: message,
      browserWindow,
      localStorageRef,
    });
  });
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", async () => {
    await setupRegisterPage();
  });
}