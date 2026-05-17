import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://sqbscxfolbckikrzxqhr.supabase.co'
const supabaseKey = 'sb_publishable_Zw_iCK1n54xXGPuDWALWQQ_k2cOQWay'
const supabase = createClient(supabaseUrl, supabaseKey)

const message = document.getElementById('message')
const vendorTableBody = document.getElementById('vendor-table-body')
const logoutBtn = document.getElementById('logout-btn')

document.addEventListener('DOMContentLoaded', async () => {
  const isAdmin = await checkAdminAccess()

  if (!isAdmin) {
    return
  }

  await loadVendors()
})

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

  const { data: appUser, error: userError } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', authData.user.id)
    .single()

  if (userError || !appUser) {
    message.textContent = 'Unable to verify user role.'

    setTimeout(() => {
      window.location.href = '../auth/login.html'
    }, 1200)

    return false
  }

  if (appUser.role !== 'admin') {
    message.textContent = 'Access denied. Admins only.'

    setTimeout(() => {
      window.location.href = '../auth/login.html'
    }, 1200)

    return false
  }

  const { data: adminProfile, error: adminError } = await supabase
    .from('admins')
    .select('id, user_id, status, is_master')
    .eq('user_id', authData.user.id)
    .single()

  if (adminError || !adminProfile) {
    message.textContent = 'Admin profile not found.'

    setTimeout(() => {
      window.location.href = '../auth/login.html'
    }, 1200)

    return false
  }

  if (adminProfile.status !== 'approved') {
    message.textContent = 'Access denied. Your admin account is not approved yet.'

    setTimeout(() => {
      window.location.href = '../auth/login.html'
    }, 1500)

    return false
  }

  message.textContent = 'Welcome, admin.'
  return true
}

async function loadVendors() {
  message.textContent = 'Loading vendors...'

  vendorTableBody.innerHTML = `
    <tr>
      <td colspan="6" class="loading">
        <span class="spinner-sm"></span>
        Loading vendors…
      </td>
    </tr>
  `

  const { data: vendors, error: vendorError } = await supabase
    .from('vendors')
    .select('*')
    .order('created_at', { ascending: false })

  if (vendorError) {
    message.textContent = vendorError.message

    vendorTableBody.innerHTML = `
      <tr>
        <td colspan="6">Failed to load vendors.</td>
      </tr>
    `

    return
  }

  if (!vendors || vendors.length === 0) {
    vendorTableBody.innerHTML = `
      <tr>
        <td colspan="6">No vendors found.</td>
      </tr>
    `

    message.textContent = 'No vendors found.'
    return
  }

  const userIds = vendors.map(vendor => vendor.user_id)

  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email')
    .in('id', userIds)

  if (usersError) {
    message.textContent = usersError.message

    vendorTableBody.innerHTML = `
      <tr>
        <td colspan="6">Failed to load vendor emails.</td>
      </tr>
    `

    return
  }

  const userMap = {}

  users.forEach(user => {
    userMap[user.id] = user.email
  })

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

function getButtons(vendor) {
  if (vendor.status === 'pending') {
    return `
      <button class="action-btn" data-id="${vendor.id}" data-action="approve">
        Approve
      </button>
    `
  }

  if (vendor.status === 'approved') {
    return `
      <button class="action-btn" data-id="${vendor.id}" data-action="suspend">
        Suspend
      </button>
    `
  }

  if (vendor.status === 'suspended') {
    return `
      <button class="action-btn" data-id="${vendor.id}" data-action="approve">
        Re-Approve
      </button>
    `
  }

  return ''
}

function attachButtonEvents() {
  document.querySelectorAll('[data-action]').forEach(button => {
    button.addEventListener('click', async () => {
      const vendorId = button.dataset.id
      const action = button.dataset.action

      if (action === 'approve') {
        await updateStatus(vendorId, 'approved')
      }

      if (action === 'suspend') {
        await updateStatus(vendorId, 'suspended')
      }
    })
  })
}

async function updateStatus(vendorId, newStatus) {
  const isAdmin = await checkAdminAccess()

  if (!isAdmin) {
    return
  }

  message.textContent = `Updating vendor to ${newStatus}...`

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

  message.textContent = `Vendor ${newStatus}.`
  await loadVendors()
}

logoutBtn.addEventListener('click', async () => {
  const { error } = await supabase.auth.signOut()

  if (error) {
    message.textContent = error.message
    return
  }

  window.location.href = '../auth/login.html'
})

function formatDate(date) {
  if (!date) {
    return 'N/A'
  }

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
