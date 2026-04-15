import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
    "https://sqbscxfolbckikrzxqhr.supabase.co",
    "sb_publishable_Zw_iCK1n54xXGPuDWALWQQ_k2cOQWay"
);

const form = document.getElementById("signup-form");
const roleSelect = document.getElementById("role");
const businessNameGroup = document.getElementById("business-name-group");
const businessNameInput = document.getElementById("business-name");
const message = document.getElementById("message");

const REGISTRATION_KEY = "campus_food_registration";

roleSelect.addEventListener("change", () => {
    const role = roleSelect.value;

    if (role === "vendor") {
        businessNameGroup.style.display = "block";
        businessNameInput.required = true;
    } else {
        businessNameGroup.style.display = "none";
        businessNameInput.required = false;
        businessNameInput.value = "";
    }
});

document.addEventListener("DOMContentLoaded", async () => {
    await completeRegistrationIfAuthenticated();
});

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim().toLowerCase();
    const role = roleSelect.value;
    const businessName = businessNameInput.value.trim();

    message.style.color = "red";

    if (!email) {
        message.textContent = "Please enter your email.";
        return;
    }

    if (!role) {
        message.textContent = "Please select a role.";
        return;
    }

    if (role === "vendor" && !businessName) {
        message.textContent = "Please enter the business name.";
        return;
    }

    const registrationData = {
        email,
        role,
        businessName: role === "vendor" ? businessName : "",
    };

    localStorage.setItem(REGISTRATION_KEY, JSON.stringify(registrationData));

    message.style.color = "black";
    message.textContent = "Sending registration link...";

    const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
            shouldCreateUser: true,
            emailRedirectTo: window.location.href,
            data: {
                requested_role: role,
                business_name: role === "vendor" ? businessName : null,
            },
        },
    });

    if (error) {
        message.style.color = "red";
        message.textContent = error.message || "Failed to send registration link.";
        return;
    }

    message.style.color = "green";
    message.textContent = "Registration link sent. Check your email to continue.";
});

async function completeRegistrationIfAuthenticated() {
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return;
    }

    const saved = localStorage.getItem(REGISTRATION_KEY);
    if (!saved) {
        return;
    }

    let registration;
    try {
        registration = JSON.parse(saved);
    } catch {
        localStorage.removeItem(REGISTRATION_KEY);
        return;
    }

    if (!registration?.email || registration.email !== user.email?.toLowerCase()) {
        return;
    }

    message.style.color = "black";
    message.textContent = "Completing registration...";

    const { data: existingUser, error: existingUserError } = await supabase
        .from("users")
        .select("id, role")
        .eq("id", user.id)
        .maybeSingle();

    if (existingUserError) {
        message.style.color = "red";
        message.textContent = "Could not verify your profile.";
        return;
    }

    if (!existingUser) {
        const { error: insertUserError } = await supabase.from("users").insert([
            {
                id: user.id,
                email: registration.email,
                role: registration.role,
            },
        ]);

        if (insertUserError) {
            message.style.color = "red";
            message.textContent = `Profile creation failed: ${insertUserError.message}`;
            return;
        }
    }

    if (registration.role === "vendor") {
        const { data: existingVendor, error: vendorCheckError } = await supabase
            .from("vendors")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();

        if (vendorCheckError) {
            message.style.color = "red";
            message.textContent = "Could not verify vendor profile.";
            return;
        }

        if (!existingVendor) {
            const { error: vendorInsertError } = await supabase.from("vendors").insert([
                {
                    user_id: user.id,
                    business_name: registration.businessName,
                    status: "pending",
                },
            ]);

            if (vendorInsertError) {
                message.style.color = "red";
                message.textContent = `Vendor registration failed: ${vendorInsertError.message}`;
                return;
            }
        }
    }

    if (registration.role === "admin") {
        const { data: existingAdmin, error: adminCheckError } = await supabase
            .from("admins")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();

        if (adminCheckError) {
            message.style.color = "red";
            message.textContent = "Could not verify admin profile.";
            return;
        }

        if (!existingAdmin) {
            const { error: adminInsertError } = await supabase.from("admins").insert([
                {
                    user_id: user.id,
                    status: "pending",
                    is_master: false,
                },
            ]);

            if (adminInsertError) {
                message.style.color = "red";
                message.textContent = `Admin registration failed: ${adminInsertError.message}`;
                return;
            }
        }
    }

    localStorage.removeItem(REGISTRATION_KEY);

    message.style.color = "green";
    if (registration.role === "student") {
        message.textContent = "Registration complete. Redirecting to student dashboard...";
        setTimeout(() => {
            window.location.href = "../student/student-dashboard.html";
        }, 1200);
        return;
    }

    if (registration.role === "vendor") {
        message.textContent = "Vendor registration complete. Await admin approval before menu access.";
        setTimeout(() => {
            window.location.href = "login.html";
        }, 1800);
        return;
    }

    if (registration.role === "admin") {
        message.textContent = "Admin registration complete. Await master admin approval.";
        setTimeout(() => {
            window.location.href = "login.html";
        }, 1800);
    }
}