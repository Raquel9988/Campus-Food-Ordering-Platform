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
const backBtn = document.getElementById('back-btn')   

/* ========================================
   State
======================================== */

let currentVendorId = null
let isRefreshing = false
let autoRefreshInterval = null

/* ========================================
   Email Trigger (FULL DEBUG VERSION)
======================================== */

async function triggerReadyEmail(orderId) {
    try {
        console.log('🚨🚨🚨 triggerReadyEmail CALLED with orderId:', orderId)

        const response = await fetch(
            'https://sqbscxfolbckikrzxqhr.supabase.co/functions/v1/send-ready-email',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    order_id: orderId
                })
            }
        )

        console.log('📡 FETCH REQUEST SENT')

        // Check raw response first
        if (!response.ok) {
            const text = await response.text()
            console.error('❌ Response not OK:', text)
            throw new Error('Failed to trigger email')
        }

        const result = await response.json()

        console.log('📩 Email function response:', result)
        console.log('✅ Email trigger request SUCCEEDED')

    } catch (error) {
        console.error('❌ Email trigger FAILED:', error)
    }
}
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
 * Format currency
 */
function formatCurrency(amount) {
    if (!amount) return 'R0.00'
    return `R${parseFloat(amount).toFixed(2)}`
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

        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            console.log('Not authenticated, redirecting to login')
            window.location.href = '../auth/login.html'
            return null
        }

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

        if (appUser.role !== 'vendor') {
            console.log('User is not a vendor, redirecting to login')
            window.location.href = '../auth/login.html'
            return null
        }

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
   Order Status Update (FULL DEBUG VERSION)
======================================== */

async function updateOrderStatus(orderId, newStatus) {
    try {
        console.log('🔥 BUTTON CLICKED:', orderId, newStatus)

        const { error } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', orderId)
            .eq('vendor_id', currentVendorId)

        if (error) {
            console.error('❌ Failed to update order:', error)
            alert('Failed to update order.')
            return
        }

        console.log('✅ Order status updated:', orderId, newStatus)

        // Only trigger email if status is "ready"
        if (newStatus && newStatus.toLowerCase() === 'ready') {
            console.log('🔥🔥🔥 TRIGGERING EMAIL NOW for order:', orderId)

            try {
                await triggerReadyEmail(orderId)
                console.log('✅ EMAIL FUNCTION COMPLETED SUCCESSFULLY')
            } catch (emailError) {
                console.error('❌ EMAIL FUNCTION FAILED:', emailError)
            }

        } else {
            console.log('ℹ️ Status is not ready, no email triggered:', newStatus)
        }

        console.log('🔄 Reloading orders...')
        await loadOrders()

        console.log('✅ updateOrderStatus FINISHED')

    } catch (error) {
        console.error('❌ updateOrderStatus error:', error)
        alert('Something went wrong while updating the order.')
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
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('id, student_id, status, created_at')
            .eq('vendor_id', vendorId)
            .order('created_at', { ascending: false })

        if (ordersError) throw new Error(`Failed to fetch orders: ${ordersError.message}`)
        if (!orders || orders.length === 0) return []

        const enrichedOrders = await Promise.all(
            orders.map(async (order) => {
                try {
                    // Fetch order items
                    const { data: orderItems, error: itemsError } = await supabase
                        .from('order_items')
                        .select('id, menu_item_id, quantity, price')
                        .eq('order_id', order.id)

                    if (itemsError) {
                        console.warn(`⚠️ Failed to fetch items for order ${order.id}:`, itemsError)
                        return { ...order, items: [], total_price: 0, studentEmail: 'Unknown' }
                    }

                    // Calculate total
                    const totalPrice = (orderItems || []).reduce(
                        (sum, item) => sum + (item.price * item.quantity),
                        0
                    )

                    // Get item names
                    const itemsWithNames = await Promise.all(
                        (orderItems || []).map(async (item) => {
                            const { data: menuItem, error: menuError } = await supabase
                                .from('menu_items')
                                .select('name')
                                .eq('id', item.menu_item_id)
                                .single()

                            if (menuError || !menuItem) {
                                console.warn(`⚠️ Menu item ${item.menu_item_id} not found`)
                                return { ...item, name: 'Item not found' }
                            }

                            return { ...item, name: menuItem.name }
                        })
                    )

                    // Get student email
                    const { data: student, error: studentError } = await supabase
                        .from('users')
                        .select('email')
                        .eq('id', order.student_id)
                        .single()

                    if (studentError) {
                        console.warn(`⚠️ Student not found for order ${order.id}`)
                    }

                    return {
                        ...order,
                        items: itemsWithNames,
                        studentEmail: student?.email || 'Unknown',
                        total_price: totalPrice
                    }

                } catch (error) {
                    console.error(`❌ Error enriching order ${order.id}:`, error)
                    return {
                        ...order,
                        items: [],
                        studentEmail: 'Unknown',
                        total_price: 0
                    }
                }
            })
        )

        return enrichedOrders

    } catch (error) {
        console.error('❌ Fetch orders error:', error)
        throw error
    }
}
/* ========================================
   UI Rendering (SEMANTIC VERSION)
======================================== */

/**
 * Render orders to the DOM
 */
function renderOrders(orders) {
    ordersContainer.innerHTML = ''

    if (!orders || orders.length === 0) {
        showEmpty()
        return
    }

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
    
    const card = document.createElement('article')
    card.className = 'order-card'

    const statusClass = `status-${order.status}`

    const itemsHtml = order.items
        .map(
            (item) =>
                `<li>
                    <span>${escapeHtml(item.name)}</span>
                    <span> × ${item.quantity}</span>
                    <span> ${formatCurrency(item.price)}</span>
                </li>`
        )
        .join('')

    const itemsSection = order.items.length
        ? `<section>
               <strong>Items:</strong>
               <ul>
                   ${itemsHtml}
               </ul>
           </section>`
        : ''

    
    card.innerHTML = `
        <header>
            <h3>Order #${escapeHtml(order.id.substring(0, 8))}</h3>
            <p class="${statusClass}">
                ${escapeHtml(order.status)}
            </p>
        </header>
        
        <section>
            <p>
                <strong>Student:</strong>
                ${escapeHtml(order.studentEmail)}
            </p>
            <p>
                <strong>Date:</strong>
                ${formatDate(order.created_at)}
            </p>
        </section>

        ${itemsSection}

        <section>
            <p>
                <strong>Total:</strong>
                ${formatCurrency(order.total_price)}
            </p>
        </section>

        <section class="order-actions">
            ${order.status === 'received'
                ? `<button class="prep-btn" type="button">Preparing</button>`
                : ''}
            ${order.status === 'preparing'
                ? `<button class="ready-btn" type="button">Ready for Pickup</button>`
                : ''}
        </section>
    `

    const prepBtn = card.querySelector('.prep-btn')
    const readyBtn = card.querySelector('.ready-btn')

   

    if (prepBtn) {
        prepBtn.onclick = async () => {
            console.log('🟡 PREPARING BUTTON CLICKED for order:', order.id)
            await updateOrderStatus(order.id, 'preparing')
        }
    }

    if (readyBtn) {
        readyBtn.onclick = async () => {
            console.log('🟢 READY BUTTON CLICKED for order:', order.id)

            await updateOrderStatus(order.id, 'ready')

            console.log('🟢 READY FLOW FINISHED for order:', order.id)
        }
    }

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

backBtn.addEventListener('click', () => {
    window.location.href = 'vendor-dashboard.html'
})
/* ========================================
   Auto-Refresh Setup
======================================== */

function startAutoRefresh() {
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
        currentVendorId = await checkVendorAuth()

        if (!currentVendorId) {
            return
        }

        await loadOrders()
        startAutoRefresh()
        window.addEventListener('beforeunload', stopAutoRefresh)
    } catch (error) {
        console.error('Page initialization error:', error)
        showError('Failed to initialize. Please refresh the page.')
    }
}

document.addEventListener('DOMContentLoaded', initializePage)
