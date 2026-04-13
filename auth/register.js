import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// Supabase setup
const supabaseUrl = "https://sqbscxfolbckikrzxqhr.supabase.co";
const supabaseKey = "sb_publishable_Zw_iCK1n54xXGPuDWALWQQ_k2cOQWay";
const supabase = createClient(supabaseUrl, supabaseKey);

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("signup-form");
    const roleSelect = document.getElementById("role");
    const businessNameGroup = document.getElementById("business-name-group");
    const businessNameInput = document.getElementById("business-name");
    const message = document.getElementById("message");
    const passwordInput = document.getElementById("password");

    console.log("register.js loaded");

    // Live password validation - shows error as user types
    passwordInput.addEventListener("input", () => {
        if (passwordInput.value.length > 0 && passwordInput.value.length < 6) {
            message.textContent = "Password must be at least 6 characters";
            message.style.color = "red";
        } else if (passwordInput.value.length >= 6) {
            message.textContent = "";
        }
    });

    // Show/hide business name field based on selected role
    roleSelect.addEventListener("change", () => {
        const role = roleSelect.value;
        console.log("Selected role:", role);

        if (role === "vendor") {
            businessNameGroup.style.display = "block";
            businessNameInput.required = true;
        } else {
            businessNameGroup.style.display = "none";
            businessNameInput.required = false;
            businessNameInput.value = "";
        }
    });

    // Handle form submit
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const role = roleSelect.value;
        const businessName = businessNameInput.value.trim();

        // Clear previous messages
        message.style.color = "red";

        // Validation checks
        if (!email) {
            message.textContent = "Please enter your email";
            return;
        }

        if (!email.includes("@") || !email.includes(".")) {
            message.textContent = "Please enter a valid email address";
            return;
        }

        if (!password) {
            message.textContent = "Please enter a password";
            return;
        }

        if (password.length < 6) {
            message.textContent = "Password must be at least 6 characters";
            return;
        }

        if (!role) {
            message.textContent = "Please select a role";
            return;
        }

        if (role === "vendor" && !businessName) {
            message.textContent = "Please enter the business name";
            return;
        }

        message.style.color = "black";
        message.textContent = "Registering...";

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (signUpError) {
            message.style.color = "red";
            // Show user-friendly error messages
            if (signUpError.message.includes("already registered") || signUpError.message.includes("already been registered")) {
                message.textContent = "This email is already registered. Try logging in.";
            } else if (signUpError.message.includes("valid email") || signUpError.message.includes("invalid email")) {
                message.textContent = "Please enter a valid email address";
            } else if (signUpError.message.includes("password") || signUpError.message.includes("Password")) {
                message.textContent = "Password must be at least 6 characters";
            } else {
                message.textContent = signUpError.message;
            }
            return;
        }

        const user = signUpData.user;

        if (!user) {
            message.style.color = "orange";
            message.textContent = "Check your email to confirm registration";
            return;
        }

        const { error: userInsertError } = await supabase.from("users").insert([
            {
                id: user.id,
                email: email,
                role: role,
            },
        ]);

        if (userInsertError) {
            message.style.color = "red";
            message.textContent = "Registration error: " + userInsertError.message;
            return;
        }

        if (role === "vendor") {
            const { error: vendorInsertError } = await supabase
                .from("vendors")
                .insert([
                    {
                        user_id: user.id,
                        business_name: businessName,
                        status: "pending",
                    },
                ]);

            if (vendorInsertError) {
                message.style.color = "red";
                message.textContent = "Vendor registration error: " + vendorInsertError.message;
                return;
            }
        }

        message.style.color = "green";
        message.textContent = "Registration successful!";

        setTimeout(() => {
            window.location.href = "login.html";
        }, 1500);
    });
});
