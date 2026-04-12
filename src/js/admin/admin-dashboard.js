import { supabase } from '../supabaseClient.js'
import { requireAdmin } from '../routeGuards.js'

const message = document.getElementById('message')
const vendorTableBody = document.getElementById('vendor-table-body')
const logoutBtn = document.getElementById('logout-btn')

document.addEventListener('DOMContentLoaded', async () => {
    const adminUser = await requireAdmin('student-login.html')

    if (!adminUser) return

    setupLogout()
    await loadVendors()
})

function setupLogout() {
    if (!logoutBtn) return

    logoutBtn.addEventListener('click', async () => {
        await supabase.auth.signOut()
        window.location.href = 'student-login.html'
    })
}

async function loadVendors() {
    message.textContent = 'Loading vendors...'

    vendorTableBody.innerHTML = `
        <tr>
            <td colspan="6" class="loading">Loading vendors...</td>
        </tr>
    `

    try {
        const { data: vendors, error: vendorError } = await supabase
            .from('vendors')
            .select('id, user_id, business_name, status, created_at, updated_at')
            .order('created_at', { ascending: false })

        if (vendorError) {
            throw new Error(vendorError.message)
        }

        if (!vendors || vendors.length === 0) {
            vendorTableBody.innerHTML = `
                <tr>
                    <td colspan="6">No vendors found</td>
                </tr>
            `
            message.textContent = ''
            return
        }

        const userIds = vendors.map(vendor => vendor.user_id)

        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, email')
            .in('id', userIds)

        if (usersError) {
            throw new Error(usersError.message)
        }

        const userMap = {}
        users.forEach(user => {
            userMap[user.id] = user.email
        })

        renderVendors(vendors, userMap)
        message.textContent = ''
    } catch (error) {
        vendorTableBody.innerHTML = `
            <tr>
                <td colspan="6">Failed to load vendors</td>
            </tr>
        `
        message.textContent = error.message || 'Something went wrong'
    }
}

function renderVendors(vendors, userMap) {
    vendorTableBody.innerHTML = ''

    vendors.forEach(vendor => {
        const email = userMap[vendor.user_id] || 'N/A'

        const row = document.createElement('tr')
        row.innerHTML = `
            <td>${escapeHtml(vendor.business_name)}</td>
            <td>${escapeHtml(email)}</td>
            <td class="${vendor.status}">${vendor.status}</td>
            <td>${formatDate(vendor.created_at)}</td>
            <td>${formatDate(vendor.updated_at)}</td>
            <td>${getActionButtons(vendor)}</td>
        `

        vendorTableBody.appendChild(row)
    })

    attachButtonEvents()
}

function getActionButtons(vendor) {
    if (vendor.status === 'pending') {
        return `<button data-id="${vendor.id}" data-action="approve">Approve</button>`
    }

    if (vendor.status === 'approved') {
        return `<button data-id="${vendor.id}" data-action="suspend">Suspend</button>`
    }

    if (vendor.status === 'suspended') {
        return `<button data-id="${vendor.id}" data-action="approve">Re-Approve</button>`
    }

    return ''
}

function attachButtonEvents() {
    const buttons = document.querySelectorAll('[data-action]')

    buttons.forEach(button => {
        button.addEventListener('click', async () => {
            const vendorId = button.dataset.id
            const action = button.dataset.action

            if (action === 'approve') {
                await updateVendorStatus(vendorId, 'approved')
            }

            if (action === 'suspend') {
                await updateVendorStatus(vendorId, 'suspended')
            }
        })
    })
}

async function updateVendorStatus(vendorId, newStatus) {
    message.textContent = `Updating vendor to ${newStatus}...`

    try {
        const { error } = await supabase
            .from('vendors')
            .update({
                status: newStatus,
                updated_at: new Date().toISOString()
            })
            .eq('id', vendorId)

        if (error) {
            throw new Error(error.message)
        }

        message.textContent = `Vendor ${newStatus} successfully`
        await loadVendors()
    } catch (error) {
        message.textContent = error.message || 'Failed to update vendor status'
    }
}

function formatDate(dateString) {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString()
}

function escapeHtml(value) {
    if (value === null || value === undefined) return ''

    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;')
}