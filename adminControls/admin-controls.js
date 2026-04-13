import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Supabase setup
const supabaseUrl = 'https://sqbscxfolbckikrzxqhr.supabase.co'
const supabaseKey = 'sb_publishable_Zw_iCK1n54xXGPuDWALWQQ_k2cOQWay'
const supabase = createClient(supabaseUrl, supabaseKey)

// DOM elements
const message = document.getElementById('message')
const vendorTableBody = document.getElementById('vendor-table-body')

// Load vendors immediately
document.addEventListener('DOMContentLoaded', async () => {
    await loadVendors()
})

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
        return
    }

    if (!vendors || vendors.length === 0) {
        vendorTableBody.innerHTML = `
            <tr>
                <td colspan="6">No vendors found</td>
            </tr>
        `
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
            <td>${vendor.business_name}</td>
            <td>${email}</td>
            <td class="${vendor.status}">${vendor.status}</td>
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

// Format dates
function formatDate(date) {
    if (!date) return 'N/A'
    return new Date(date).toLocaleString()
}