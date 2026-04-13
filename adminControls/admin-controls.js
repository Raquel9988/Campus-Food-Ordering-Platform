import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Supabase setup
const supabaseUrl = 'https://sqbscxfolbckikrzxqhr.supabase.co'
const supabaseKey = 'sb_publishable_Zw_iCK1n54xXGPuDWALWQQ_k2cOQWay'
const supabase = createClient(supabaseUrl, supabaseKey)

// DOM elements
const message = document.getElementById('message')
const vendorTableBody = document.getElementById('vendor-table-body')
const logoutBtn = document.getElementById('logout-btn')

// Run when page loads
document.addEventListener('DOMContentLoaded', async () => {
    const isAdmin = await checkAdminAccess()

    if (!isAdmin) {
        return
    }

    await loadVendors()
})

// Check current logged-in user and confirm admin role
async function checkAdminAccess() {
    message.textContent = 'Checking admin access...'

    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError || !authData.user) {
        message.textContent = 'Please log in first.'
        setTimeout(() => {
            window.location.href = '../auth/login.html'
        }, 1200)
        return false
    }

    const userId = authData.user.id

    const { data: users, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single()

    if (userError || !users) {
        message.textContent = 'Unable to verify user role.'
        setTimeout(() => {
            window.location.href = '../auth/login.html'
        }, 1200)
        return false
    }

    if (users.role !== 'admin') {
        message.textContent = 'Access denied. Admins only.'
        setTimeout(() => {
            window.location.href = '../auth/login.html'
        }, 1200)
        return false
    }

    message.textContent = 'Welcome, admin.'
    return true
}

// Load vendors + user emails
async function loadVendors() {
    message.textContent = 'Loading vendors...'

    vendorTableBody.innerHTML = `
        <tr>
            <td colspan="6">Loading vendors...</td>
        </tr>
    `

    // Get vendors
    const { data: vendors, error: vendorError } = await supabase
        .from('vendors')
        .select('*')
        .order('created_at', { ascending: false })

    if (vendorError) {
        message.textContent = vendorError.message
        vendorTableBody.innerHTML = `
            <tr>
                <td colspan="6">Failed to load vendors</td>
            </tr>
        `
        return
    }

    if (!vendors || vendors.length === 0) {
        vendorTableBody.innerHTML = `
            <tr>
                <td colspan="6">No vendors found</td>
            </tr>
        `
        message.textContent = 'No vendors found.'
        return
    }

    // Get corresponding users (emails)
    const userIds = vendors.map(v => v.user_id)

    const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email')
        .in('id', userIds)

    if (usersError) {
        message.textContent = usersError.message
        vendorTableBody.innerHTML = `
            <tr>
                <td colspan="6">Failed to load vendor emails</td>
            </tr>
        `
        return
    }

    // Map users
    const userMap = {}
    users.forEach(user => {
        userMap[user.id] = user.email
    })

    renderVendors(vendors, userMap)
    message.textContent = ''
}

// Render table
function renderVendors(vendors, userMap) {
    vendorTableBody.innerHTML = ''

    vendors.forEach(vendor => {
        const email = userMap[vendor.user_id] || 'N/A'

        const row = document.createElement('tr')

        row.innerHTML = `
            <td>${escapeHtml(vendor.business_name || 'N/A')}</td>
            <td>${escapeHtml(email)}</td>
            <td class="${escapeHtml(vendor.status)}">${escapeHtml(vendor.status)}</td>
            <td>${formatDate(vendor.created_at)}</td>
            <td>${formatDate(vendor.updated_at)}</td>
            <td>
                ${getButtons(vendor)}
            </td>
        `

        vendorTableBody.appendChild(row)
    })

    attachButtonEvents()
}

// Buttons based on status
function getButtons(vendor) {
    if (vendor.status === 'pending') {
        return `
            <button data-id="${vendor.id}" data-action="approve">Approve</button>
        `
    }

    if (vendor.status === 'approved') {
        return `
            <button data-id="${vendor.id}" data-action="suspend">Suspend</button>
        `
    }

    if (vendor.status === 'suspended') {
        return `
            <button data-id="${vendor.id}" data-action="approve">Re-Approve</button>
        `
    }

    return ''
}

// Attach click events
function attachButtonEvents() {
    const buttons = document.querySelectorAll('[data-action]')

    buttons.forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id
            const action = btn.dataset.action

            if (action === 'approve') {
                await updateStatus(id, 'approved')
            }

            if (action === 'suspend') {
                await updateStatus(id, 'suspended')
            }
        })
    })
}

// Update vendor status
async function updateStatus(vendorId, newStatus) {
    // Check admin again before sensitive action
    const isAdmin = await checkAdminAccess()

    if (!isAdmin) {
        return
    }

    message.textContent = `Updating to ${newStatus}...`

    const { error } = await supabase
        .from('vendors')
        .update({
            status: newStatus,
            updated_at: new Date().toISOString()
        })
        .eq('id', vendorId)

    if (error) {
        message.textContent = error.message
        return
    }

    message.textContent = `Vendor ${newStatus}`
    await loadVendors()
}

// Logout
logoutBtn.addEventListener('click', async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
        message.textContent = error.message
        return
    }

    window.location.href = '../auth/login.html'
})

// Format dates
function formatDate(date) {
    if (!date) return 'N/A'
    return new Date(date).toLocaleString()
}

// Escape HTML
function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;')
}