import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://sqbscxfolbckikrzxqhr.supabase.co'
const supabaseKey = 'sb_publishable_Zw_iCK1n54xXGPuDWALWQQ_k2cOQWay'
const supabase = createClient(supabaseUrl, supabaseKey)

const message = document.getElementById('message')
const vendorTableBody = document.getElementById('vendor-table-body')
const logoutBtn = document.getElementById('logout-btn')

document.addEventListener('DOMContentLoaded', async () => {
    const isAdmin = await checkAdminAccess()
    if (!isAdmin) return
    await loadVendors()
})

async function checkAdminAccess() {
    message.textContent = 'Checking admin access...'

    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError || !authData.user) {
        message.textContent = 'Please log in first.'
        setTimeout(() => { window.location.href = '../auth/login.html' }, 1200)
        return false
    }

    const { data: users, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', authData.user.id)
        .single()

    if (userError || !users || users.role !== 'admin') {
        message.textContent = userError ? 'Unable to verify user role.' : 'Access denied. Admins only.'
        setTimeout(() => { window.location.href = '../auth/login.html' }, 1200)
        return false
    }

    message.textContent = 'Welcome, admin.'
    return true
}

async function loadVendors() {
    message.textContent = 'Loading vendors...'
    vendorTableBody.innerHTML = `<tr><td colspan="6" class="loading"><span class="spinner-sm"></span> Loading vendors…</td></tr>`

    const { data: vendors, error: vendorError } = await supabase
        .from('vendors')
        .select('*')
        .order('created_at', { ascending: false })

    if (vendorError) {
        message.textContent = vendorError.message
        vendorTableBody.innerHTML = `<tr><td colspan="6">Failed to load vendors.</td></tr>`
        return
    }

    if (!vendors || vendors.length === 0) {
        vendorTableBody.innerHTML = `<tr><td colspan="6">No vendors found.</td></tr>`
        message.textContent = 'No vendors found.'
        return
    }

    const userIds = vendors.map(v => v.user_id)
    const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email')
        .in('id', userIds)

    if (usersError) {
        message.textContent = usersError.message
        vendorTableBody.innerHTML = `<tr><td colspan="6">Failed to load vendor emails.</td></tr>`
        return
    }

    const userMap = {}
    users.forEach(user => { userMap[user.id] = user.email })

    renderVendors(vendors, userMap)
    message.textContent = ''
}

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
            <td>${getButtons(vendor)}</td>
        `

        vendorTableBody.appendChild(row)
    })

    attachButtonEvents()
}

/* ── getButtons: includes action-btn class so CSS styles apply ── */
function getButtons(vendor) {
    if (vendor.status === 'pending') {
        return `
            <button class="action-btn" data-id="${vendor.id}" data-action="approve">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <polyline points="20 6 9 17 4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Approve
            </button>
        `
    }

    if (vendor.status === 'approved') {
        return `
            <button class="action-btn" data-id="${vendor.id}" data-action="suspend">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                Suspend
            </button>
        `
    }

    if (vendor.status === 'suspended') {
        return `
            <button class="action-btn" data-id="${vendor.id}" data-action="approve">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <polyline points="23 4 23 10 17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Re-Approve
            </button>
        `
    }

    return ''
}

function attachButtonEvents() {
    document.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id
            const action = btn.dataset.action
            if (action === 'approve') await updateStatus(id, 'approved')
            if (action === 'suspend') await updateStatus(id, 'suspended')
        })
    })
}

async function updateStatus(vendorId, newStatus) {
    const isAdmin = await checkAdminAccess()
    if (!isAdmin) return

    message.textContent = `Updating to ${newStatus}...`

    const { error } = await supabase
        .from('vendors')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', vendorId)

    if (error) {
        message.textContent = error.message
        return
    }

    message.textContent = `Vendor ${newStatus}.`
    await loadVendors()
}

logoutBtn.addEventListener('click', async () => {
    const { error } = await supabase.auth.signOut()
    if (error) { message.textContent = error.message; return }
    window.location.href = '../auth/login.html'
})

function formatDate(date) {
    if (!date) return 'N/A'
    return new Date(date).toLocaleString()
}

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;')
}