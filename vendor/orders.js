import { supabase } from '../shared-auth-foundation/src/js/supabaseClient.js'

/* ========================================
   DOM Elements
   ======================================== */

const loadingContainer = document.getElementById('loading-container')
const errorContainer = document.getElementById('error-container')
const errorText = document.getElementById('error-text')
const ordersContainer = document.getElementById('orders-container')
const emptyState = document.getElementById('empty-state')
const refreshBtn = document.getElementById('refresh-btn')
const retryBtn = document.getElementById('retry-btn')

/* ========================================
   State
   ======================================== */

let currentVendorId = null
let isRefreshing = false
let autoRefreshInterval = null

/* ========================================
   Utility Functions
   ======================================== */

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(unsafe) {
    if (!unsafe) return ''
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}

/**
 * Format date to readable string (local timezone)
 */
function formatDate(dateString) {
    if (!dateString) return 'N/A'
    try {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    } catch {
        return dateString
    }
}

/**
 * Format currency (assumes South African Rand based on codebase pattern)
 */
function formatCurrency(amount) {
    if (!amount) return 'R$0.00'
    return `R$${parseFloat(amount).toFixed(2)}`
}

/**
 * Show/hide UI states
 */
function showLoading() {
    loadingContainer.classList.remove('hidden')
    errorContainer.classList.add('hidden')
    ordersContainer.classList.add('hidden')
    emptyState.classList.add('hidden')
}

function showError(message) {
    loadingContainer.classList.add('hidden')
    errorContainer.classList.remove('hidden')
    ordersContainer.classList.add('hidden')
    emptyState.classList.add('hidden')
    errorText.textContent = message
}

function showOrders() {
    loadingContainer.classList.add('hidden')
    errorContainer.classList.add('hidden')
    ordersContainer.classList.remove('hidden')
    emptyState.classList.add('hidden')
}

function showEmpty() {
    loadingContainer.classList.add('hidden')
    errorContainer.classList.add('hidden')
    ordersContainer.classList.add('hidden')
    emptyState.classList.remove('hidden')
}

/* ========================================
   Authentication & Authorization
   ======================================== */

/**
 * Check vendor authentication and authorization
 * Returns vendor ID if authorized, null otherwise
 */
async function checkVendorAuth() {
    try {
        showLoading()

        // Get current authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            console.log('Not authenticated, redirecting to login')
            window.location.href = '../auth/login.html'
            return null
        }

        // Get user role from users table
        const { data: appUser, error: userError } = await supabase
            .from('users')
            .select('id, role')
            .eq('id', user.id)
            .single()

        if (userError || !appUser) {
            console.error('User record not found:', userError)
            window.location.href = '../auth/login.html'
            return null
        }

        // Check if user is a vendor
        if (appUser.role !== 'vendor') {
            console.log('User is not a vendor, redirecting to login')
            window.location.href = '../auth/login.html'
            return null
        }

        // Get vendor profile and check if approved
        const { data: vendor, error: vendorError } = await supabase
            .from('vendors')
            .select('id, status, business_name')
            .eq('user_id', user.id)
            .single()

        if (vendorError || !vendor) {
            console.error('Vendor record not found:', vendorError)
            showError('Vendor profile not found. Please contact support.')
            return null
        }

        // Check vendor approval status
        if (vendor.status !== 'approved') {
            console.log('Vendor not approved, status:', vendor.status)
            showError(
                vendor.status === 'pending'
                    ? 'Your vendor account is pending approval. Check back soon!'
                    : 'Your vendor account is suspended. Please contact support.'
            )
            return null
        }

        console.log('Vendor authorized:', vendor.id)
        return vendor.id
    } catch (error) {
        console.error('Auth check error:', error)
        showError('Authentication error. Please refresh and try again.')
        return null
    }
}

/* ========================================
   Data Fetching
   ======================================== */

/**
 * Fetch all orders for the current vendor
 * Includes order items and student information
 */
async function fetchOrders(vendorId) {
    if (!vendorId) return []

    try {
        // Fetch orders for this vendor (no total_price in DB)
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('id, student_id, status, created_at')
            .eq('vendor_id', vendorId)
            .order('created_at', { ascending: false })

        if (ordersError) throw new Error(`Failed to fetch orders: ${ordersError.message}`)
        if (!orders || orders.length === 0) return []

        // Enrich each order with items and student email
        const enrichedOrders = await Promise.all(
            orders.map(async (order) => {
                try {
                    // Fetch order items (using 'price' column)
                    const { data: orderItems, error: itemsError } = await supabase
                        .from('order_items')
                        .select('id, menu_item_id, quantity, price')
                        .eq('order_id', order.id)

                    if (itemsError) {
                        console.warn(`Failed to fetch items for order ${order.id}:`, itemsError)
                        return { ...order, items: [], total_price: 0 }
                    }

                    // Calculate total price from items
                    const totalPrice = (orderItems || []).reduce(
                        (sum, item) => sum + (item.price * item.quantity),
                        0
                    )

                    // Fetch menu item names
                    const itemsWithNames = await Promise.all(
                        (orderItems || []).map(async (item) => {
                            const { data: menuItem, error: menuError } = await supabase
                                .from('menu_items')
                                .select('name')
                                .eq('id', item.menu_item_id)
                                .single()
                            if (menuError || !menuItem) {
                                console.warn(`Menu item ${item.menu_item_id} not found`)
                                return { ...item, name: 'Item not found' }
                            }
                            return { ...item, name: menuItem.name }
                        })
                    )

                    // Fetch student email
                    const { data: student, error: studentError } = await supabase
                        .from('users')
                        .select('email')
                        .eq('id', order.student_id)
                        .single()

                    return {
                        ...order,
                        items: itemsWithNames,
                        studentEmail: student?.email || 'Unknown',
                        total_price: totalPrice   // computed, not from DB
                    }
                } catch (error) {
                    console.error(`Error enriching order ${order.id}:`, error)
                    return { ...order, items: [], studentEmail: 'Unknown', total_price: 0 }
                }
            })
        )

        return enrichedOrders
    } catch (error) {
        console.error('Fetch orders error:', error)
        throw error
    }
}

/* ========================================
   UI Rendering
   ======================================== */

/**
 * Render orders to the DOM
 */
function renderOrders(orders) {
    // Clear container
    ordersContainer.innerHTML = ''

    if (!orders || orders.length === 0) {
        showEmpty()
        return
    }

    // Create order cards
    orders.forEach((order) => {
        const orderCard = createOrderCard(order)
        ordersContainer.appendChild(orderCard)
    })

    showOrders()
}

/**
 * Create a single order card element
 */
function createOrderCard(order) {
    const card = document.createElement('div')
    card.className = 'order-card'

    // Status badge class
    const statusClass = `status-${order.status}`

    // Build items HTML
    const itemsHtml = order.items
        .map(
            (item) =>
                `<li>
                    <span class="item-name">${escapeHtml(item.name)}</span>
                    <span class="item-qty">× ${item.quantity}</span>
                    <span class="item-price">${formatCurrency(item.price_at_time)}</span>
                </li>`
        )
        .join('')

    const itemsSection = order.items.length
        ? `<div class="items-section">
               <strong>Items:</strong>
               <ul class="items-list">
                   ${itemsHtml}
               </ul>
           </div>`
        : ''

    card.innerHTML = `
        <div class="order-header">
            <h3>Order #${escapeHtml(order.id.substring(0, 8))}</h3>
            <span class="status-badge ${statusClass}">
                ${escapeHtml(order.status)}
            </span>
        </div>
        
        <div class="order-info">
            <p>
                <strong>Student:</strong>
                <span class="order-value">${escapeHtml(order.studentEmail)}</span>
            </p>
            <p>
                <strong>Date:</strong>
                <span class="order-value">${formatDate(order.created_at)}</span>
            </p>
        </div>

        ${itemsSection}

        <div class="order-total">
            <span>Total:</span>
            <span class="total-amount">${formatCurrency(order.total_price)}</span>
        </div>
    `

    return card
}

/* ========================================
   Refresh Logic
   ======================================== */

/**
 * Fetch and render orders (core refresh logic)
 */
async function loadOrders() {
    if (!currentVendorId) {
        showError('Vendor ID not set. Please refresh the page.')
        return
    }

    try {
        isRefreshing = true
        refreshBtn.disabled = true

        const orders = await fetchOrders(currentVendorId)
        renderOrders(orders)
    } catch (error) {
        console.error('Load orders error:', error)
        showError(`Error loading orders: ${error.message}. Please try again.`)
    } finally {
        isRefreshing = false
        refreshBtn.disabled = false
    }
}

/**
 * Silent refresh (for auto-refresh, no UI interruption)
 */
async function silentRefresh() {
    if (!currentVendorId || isRefreshing) return

    try {
        const orders = await fetchOrders(currentVendorId)
        // Only update if not in error/loading state
        if (!loadingContainer.classList.contains('hidden')) return
        if (!errorContainer.classList.contains('hidden')) return

        renderOrders(orders)
    } catch (error) {
        console.warn('Silent refresh error (not shown to user):', error)
    }
}

/* ========================================
   Event Listeners
   ======================================== */

refreshBtn.addEventListener('click', loadOrders)
retryBtn.addEventListener('click', loadOrders)

/* ========================================
   Auto-Refresh Setup
   ======================================== */

function startAutoRefresh() {
    // Auto-refresh every 30 seconds
    autoRefreshInterval = setInterval(() => {
        silentRefresh()
    }, 30000)

    console.log('Auto-refresh started (every 30 seconds)')
}

function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval)
        autoRefreshInterval = null
        console.log('Auto-refresh stopped')
    }
}

/* ========================================
   Page Initialization
   ======================================== */

async function initializePage() {
    try {
        // Check authentication and get vendor ID
        currentVendorId = await checkVendorAuth()

        if (!currentVendorId) {
            // Auth check already handled redirects or displayed error
            return
        }

        // Initial load of orders
        await loadOrders()

        // Start auto-refresh
        startAutoRefresh()

        // Clean up on page unload
        window.addEventListener('beforeunload', stopAutoRefresh)
    } catch (error) {
        console.error('Page initialization error:', error)
        showError('Failed to initialize. Please refresh the page.')
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializePage)
