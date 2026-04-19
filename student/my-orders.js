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

/* ========================================
   Utility Functions
======================================== */

function escapeHtml(text) {
    if (!text) return "";
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatDate(dateString) {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-ZA", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function formatCurrency(amount) {
    return `R${parseFloat(amount || 0).toFixed(2)}`;
}

function getStatusClass(status) {
    return `status-${status || "default"}`;
}

function getStatusText(status) {
    switch (status) {
        case "received": return "Order Received";
        case "preparing": return "Preparing";
        case "ready": return "Ready for Pickup";
        default: return status;
    }
}

/* ========================================
   Toast Notification
======================================== */

function showToast(message) {
    const toast = document.createElement("section"); // ✅ semantic
    toast.textContent = message;

    toast.style.position = "fixed";
    toast.style.bottom = "20px";
    toast.style.right = "20px";
    toast.style.background = "black";
    toast.style.color = "white";
    toast.style.padding = "10px 15px";
    toast.style.borderRadius = "5px";
    toast.style.zIndex = "1000";

    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

/* ========================================
   UI State
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
   Auth
======================================== */

async function checkStudentAuth() {
    showLoading();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        window.location.href = "../auth/login.html";
        return null;
    }

    const { data: appUser } = await supabase
        .from("users")
        .select("id, role")
        .eq("id", user.id)
        .single();

    if (!appUser || appUser.role !== "student") {
        await supabase.auth.signOut();
        window.location.href = "../auth/login.html";
        return null;
    }

    return user.id;
}

/* ========================================
   Fetch Orders
======================================== */

async function fetchOrders(studentId) {
    const { data: orders } = await supabase
        .from("orders")
        .select("id, vendor_id, status, created_at")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });

    if (!orders || orders.length === 0) return [];

    return await Promise.all(
        orders.map(async (order) => {

            const { data: items } = await supabase
                .from("order_items")
                .select("menu_item_id, quantity, price")
                .eq("order_id", order.id);

            const total = (items || []).reduce(
                (sum, i) => sum + (i.price * i.quantity),
                0
            );

            const itemsWithNames = await Promise.all(
                (items || []).map(async (item) => {
                    const { data: menu } = await supabase
                        .from("menu_items")
                        .select("name")
                        .eq("id", item.menu_item_id)
                        .single();

                    return {
                        ...item,
                        name: menu?.name || "Item"
                    };
                })
            );

            const { data: vendor } = await supabase
                .from("vendors")
                .select("business_name")
                .eq("id", order.vendor_id)
                .single();

            return {
                ...order,
                items: itemsWithNames,
                total_price: total,
                vendorName: vendor?.business_name || "Vendor"
            };
        })
    );
}

/* ========================================
   Render
======================================== */

function renderOrders(orders) {
    ordersContainer.innerHTML = "";

    if (!orders.length) return showEmpty();

    orders.forEach(order => {
        ordersContainer.appendChild(createOrderCard(order));
    });

    showOrders();
}

function createOrderCard(order) {
    const card = document.createElement("article"); // ✅ semantic
    card.className = "order-card";

    const itemsHtml = order.items.map(i => `
        <li>${escapeHtml(i.name)} × ${i.quantity}</li>
    `).join("");

    card.innerHTML = `
        <header>
            <h3>Order #${order.id.substring(0, 6)}</h3>
            <span class="${getStatusClass(order.status)}">
                ${getStatusText(order.status)}
            </span>
        </header>

        <p><strong>Vendor:</strong> ${escapeHtml(order.vendorName)}</p>

        <ul>${itemsHtml}</ul>

        <footer>
            <strong>Total: ${formatCurrency(order.total_price)}</strong>
        </footer>
    `;

    return card;
}

/* ========================================
   Load Orders
======================================== */

async function loadOrders() {
    const orders = await fetchOrders(currentStudentId);
    renderOrders(orders);
}

/* ========================================
   REAL-TIME
======================================== */

function subscribeToRealtime() {
    supabase
        .channel("orders-realtime")
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "orders",
            },
            async (payload) => {

                if (payload.new.student_id !== currentStudentId) return;

                await loadOrders();

                if (
                    payload.old?.status === "preparing" &&
                    payload.new.status === "ready"
                ) {
                    showToast(`Order #${payload.new.id.substring(0,6)} is ready!`);
                }
            }
        )
        .subscribe();
}

/* ========================================
   Events
======================================== */

refreshBtn.onclick = loadOrders;
retryBtn.onclick = loadOrders;
backBtn.onclick = () => window.location.href = "student-dashboard.html";

/* ========================================
   Init
======================================== */

async function initializePage() {
    currentStudentId = await checkStudentAuth();
    if (!currentStudentId) return;

    await loadOrders();
    subscribeToRealtime();
}

document.addEventListener("DOMContentLoaded", initializePage);