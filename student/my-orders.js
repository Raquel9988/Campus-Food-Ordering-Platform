import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// Supabase setup
const supabase = createClient(
    "https://sqbscxfolbckikrzxqhr.supabase.co",
    "sb_publishable_Zw_iCK1n54xXGPuDWALWQQ_k2cOQWay"
);

/* ========================================
   DOM Elements
   ======================================== */

const loadingContainer = document.getElementById("loading-container");
const errorContainer = document.getElementById("error-container");
const errorText = document.getElementById("error-text");
const ordersContainer = document.getElementById("orders-container");
const emptyState = document.getElementById("empty-state");
const refreshBtn = document.getElementById("refresh-btn");
const retryBtn = document.getElementById("retry-btn");
const backBtn = document.getElementById("back-btn");

/* ========================================
   State
   ======================================== */

let currentStudentId = null;
let isRefreshing = false;

/* ========================================
   Utility Functions
   ======================================== */

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return "";
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Format date to readable string
function formatDate(dateString) {
    if (!dateString) return "N/A";
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-ZA", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    } catch {
        return dateString;
    }
}

// Format currency
function formatCurrency(amount) {
    if (!amount) return "R0.00";
    return `R${parseFloat(amount).toFixed(2)}`;
}

// Get status color class
function getStatusClass(status) {
    switch (status) {
        case "received":
            return "status-received";
        case "preparing":
            return "status-preparing";
        case "ready":
            return "status-ready";
        default:
            return "status-default";
    }
}

// Get status display text
function getStatusText(status) {
    switch (status) {
        case "received":
            return "Order Received";
        case "preparing":
            return "Preparing";
        case "ready":
            return "Ready for Pickup";
        default:
            return status;
    }
}

/* ========================================
   UI State Functions
   ======================================== */

function showLoading() {
    loadingContainer.classList.remove("hidden");
    errorContainer.classList.add("hidden");
    ordersContainer.classList.add("hidden");
    emptyState.classList.add("hidden");
}

function showError(message) {
    loadingContainer.classList.add("hidden");
    errorContainer.classList.remove("hidden");
    ordersContainer.classList.add("hidden");
    emptyState.classList.add("hidden");
    errorText.textContent = message;
}

function showOrders() {
    loadingContainer.classList.add("hidden");
    errorContainer.classList.add("hidden");
    ordersContainer.classList.remove("hidden");
    emptyState.classList.add("hidden");
}

function showEmpty() {
    loadingContainer.classList.add("hidden");
    errorContainer.classList.add("hidden");
    ordersContainer.classList.add("hidden");
    emptyState.classList.remove("hidden");
}

/* ========================================
   Authentication
   ======================================== */

async function checkStudentAuth() {
    try {
        showLoading();

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            window.location.href = "../auth/login.html";
            return null;
        }

        // Get user role
        const { data: appUser, error: userError } = await supabase
            .from("users")
            .select("id, role")
            .eq("id", user.id)
            .single();

        if (userError || !appUser) {
            window.location.href = "../auth/login.html";
            return null;
        }

        // Check if student
        if (appUser.role !== "student") {
            await supabase.auth.signOut();
            window.location.href = "../auth/login.html";
            return null;
        }

        return user.id;
    } catch (error) {
        console.error("Auth check error:", error);
        showError("Authentication error. Please try again.");
        return null;
    }
}

/* ========================================
   Data Fetching
   ======================================== */

async function fetchOrders(studentId) {
    if (!studentId) return [];

    try {
        // Fetch orders for this student
        const { data: orders, error: ordersError } = await supabase
            .from("orders")
            .select("id, vendor_id, status, created_at")
            .eq("student_id", studentId)
            .order("created_at", { ascending: false });

        if (ordersError) {
            throw new Error(`Failed to fetch orders: ${ordersError.message}`);
        }

        if (!orders || orders.length === 0) {
            return [];
        }

        // Enrich each order with items and vendor info
        const enrichedOrders = await Promise.all(
            orders.map(async (order) => {
                try {
                    // Fetch order items
                    const { data: orderItems, error: itemsError } = await supabase
                        .from("order_items")
                        .select("id, menu_item_id, quantity, price")
                        .eq("order_id", order.id);

                    if (itemsError) {
                        console.warn(`Failed to fetch items for order ${order.id}:`, itemsError);
                        return { ...order, items: [], total_price: 0, vendorName: "Unknown" };
                    }

                    // Calculate total price
                    const totalPrice = (orderItems || []).reduce(
                        (sum, item) => sum + (item.price * item.quantity),
                        0
                    );

                    // Fetch menu item names
                    const itemsWithNames = await Promise.all(
                        (orderItems || []).map(async (item) => {
                            const { data: menuItem } = await supabase
                                .from("menu_items")
                                .select("name")
                                .eq("id", item.menu_item_id)
                                .single();

                            return {
                                ...item,
                                name: menuItem?.name || "Item not found"
                            };
                        })
                    );

                    // Fetch vendor name
                    const { data: vendor } = await supabase
                        .from("vendors")
                        .select("business_name")
                        .eq("id", order.vendor_id)
                        .single();

                    return {
                        ...order,
                        items: itemsWithNames,
                        total_price: totalPrice,
                        vendorName: vendor?.business_name || "Unknown Vendor"
                    };
                } catch (error) {
                    console.error(`Error enriching order ${order.id}:`, error);
                    return { ...order, items: [], total_price: 0, vendorName: "Unknown" };
                }
            })
        );

        return enrichedOrders;
    } catch (error) {
        console.error("Fetch orders error:", error);
        throw error;
    }
}

/* ========================================
   UI Rendering
   ======================================== */

function renderOrders(orders) {
    ordersContainer.innerHTML = "";

    if (!orders || orders.length === 0) {
        showEmpty();
        return;
    }

    // Separate current and past orders
    const currentOrders = orders.filter(o => o.status !== "ready");
    const pastOrders = orders.filter(o => o.status === "ready");

    // Render current orders
    if (currentOrders.length > 0) {
        const currentSection = document.createElement("section");
        currentSection.className = "orders-section";
        currentSection.innerHTML = `<h2>Current Orders</h2>`;

        currentOrders.forEach(order => {
            currentSection.appendChild(createOrderCard(order));
        });

        ordersContainer.appendChild(currentSection);
    }

    // Render past orders
    if (pastOrders.length > 0) {
        const pastSection = document.createElement("section");
        pastSection.className = "orders-section past-orders";
        pastSection.innerHTML = `<h2>Order History</h2>`;

        pastOrders.forEach(order => {
            pastSection.appendChild(createOrderCard(order));
        });

        ordersContainer.appendChild(pastSection);
    }

    showOrders();
}

function createOrderCard(order) {
    const card = document.createElement("div");
    card.className = "order-card";

    const statusClass = getStatusClass(order.status);
    const statusText = getStatusText(order.status);

    // Build items list
    const itemsHtml = order.items
        .map(item => `
            <li>
                <span class="item-name">${escapeHtml(item.name)}</span>
                <span class="item-qty">× ${item.quantity}</span>
                <span class="item-price">${formatCurrency(item.price)}</span>
            </li>
        `)
        .join("");

    card.innerHTML = `
        <div class="order-header">
            <div class="order-id">
                <h3>Order #${escapeHtml(order.id.substring(0, 8))}</h3>
                <span class="order-date">${formatDate(order.created_at)}</span>
            </div>
            <span class="status-badge ${statusClass}">${statusText}</span>
        </div>

        <div class="order-vendor">
            <strong>From:</strong> ${escapeHtml(order.vendorName)}
        </div>

        <div class="order-items">
            <strong>Items:</strong>
            <ul class="items-list">
                ${itemsHtml || "<li>No items</li>"}
            </ul>
        </div>

        <div class="order-total">
            <span>Total:</span>
            <span class="total-amount">${formatCurrency(order.total_price)}</span>
        </div>
    `;

    return card;
}

/* ========================================
   Load Orders
   ======================================== */

async function loadOrders() {
    if (!currentStudentId) {
        showError("Not authenticated. Please log in.");
        return;
    }

    try {
        isRefreshing = true;
        refreshBtn.disabled = true;
        refreshBtn.textContent = "Refreshing...";

        const orders = await fetchOrders(currentStudentId);
        renderOrders(orders);
    } catch (error) {
        console.error("Load orders error:", error);
        showError(`Error loading orders: ${error.message}`);
    } finally {
        isRefreshing = false;
        refreshBtn.disabled = false;
        refreshBtn.textContent = "Refresh";
    }
}

/* ========================================
   Event Listeners
   ======================================== */

refreshBtn.addEventListener("click", loadOrders);
retryBtn.addEventListener("click", loadOrders);
backBtn.addEventListener("click", () => {
    window.location.href = "student-dashboard.html";
});

/* ========================================
   Page Initialization
   ======================================== */

async function initializePage() {
    try {
        // Check auth and get student ID
        currentStudentId = await checkStudentAuth();

        if (!currentStudentId) {
            return;
        }

        // Load orders
        await loadOrders();
    } catch (error) {
        console.error("Page init error:", error);
        showError("Failed to load page. Please refresh.");
    }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", initializePage);
