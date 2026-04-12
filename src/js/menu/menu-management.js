import { supabase } from '../supabaseClient.js'
import { requireApprovedVendor } from '../routeGuards.js'
import { getVendorProfile } from '../authHelpers.js'

const message = document.getElementById('message')
const logoutBtn = document.getElementById('logout-btn')

const menuForm = document.getElementById('menu-form')
const formTitle = document.getElementById('form-title')
const cancelEditBtn = document.getElementById('cancel-edit-btn')

const itemIdInput = document.getElementById('item-id')
const nameInput = document.getElementById('name')
const descriptionInput = document.getElementById('description')
const priceInput = document.getElementById('price')
const photoUrlInput = document.getElementById('photo-url')
const isAvailableInput = document.getElementById('is-available')

const menuTableBody = document.getElementById('menu-table-body')

let currentUser = null
let currentVendor = null

document.addEventListener('DOMContentLoaded', async () => {
    currentUser = await requireApprovedVendor('vendor-login.html')

    if (!currentUser) return

    try {
        currentVendor = await getVendorProfile(currentUser.id)
        setupLogout()
        setupForm()
        await loadMenuItems()
    } catch (error) {
        message.textContent = error.message || 'Failed to load vendor profile'
    }
})

function setupLogout() {
    if (!logoutBtn) return

    logoutBtn.addEventListener('click', async () => {
        await supabase.auth.signOut()
        window.location.href = 'vendor-login.html'
    })
}

function setupForm() {
    menuForm.addEventListener('submit', async (e) => {
        e.preventDefault()

        const itemId = itemIdInput.value.trim()
        const name = nameInput.value.trim()
        const description = descriptionInput.value.trim()
        const price = parseFloat(priceInput.value)
        const photoUrl = photoUrlInput.value.trim()
        const isAvailable = isAvailableInput.value === 'true'

        if (!name) {
            message.textContent = 'Please enter an item name'
            return
        }

        if (Number.isNaN(price) || price < 0) {
            message.textContent = 'Please enter a valid price'
            return
        }

        const payload = {
            vendor_id: currentVendor.id,
            name,
            description,
            price,
            photo_url: photoUrl || null,
            is_available: isAvailable,
            updated_at: new Date().toISOString()
        }

        try {
            if (itemId) {
                await updateMenuItem(itemId, payload)
            } else {
                await createMenuItem(payload)
            }

            resetForm()
            await loadMenuItems()
        } catch (error) {
            message.textContent = error.message || 'Failed to save menu item'
        }
    })

    cancelEditBtn.addEventListener('click', () => {
        resetForm()
    })
}

async function loadMenuItems() {
    menuTableBody.innerHTML = `
        <tr>
            <td colspan="6">Loading menu items...</td>
        </tr>
    `

    try {
        const { data, error } = await supabase
            .from('menu_items')
            .select('id, name, description, price, photo_url, is_available, created_at, updated_at')
            .eq('vendor_id', currentVendor.id)
            .order('created_at', { ascending: false })

        if (error) {
            throw new Error(error.message)
        }

        renderMenuItems(data || [])
        message.textContent = ''
    } catch (error) {
        menuTableBody.innerHTML = `
            <tr>
                <td colspan="6">Failed to load menu items</td>
            </tr>
        `
        message.textContent = error.message || 'Failed to load menu items'
    }
}

function renderMenuItems(items) {
    menuTableBody.innerHTML = ''

    if (!items.length) {
        menuTableBody.innerHTML = `
            <tr>
                <td colspan="6">No menu items found</td>
            </tr>
        `
        return
    }

    items.forEach(item => {
        const row = document.createElement('tr')

        row.innerHTML = `
            <td>${escapeHtml(item.name)}</td>
            <td>${escapeHtml(item.description || '')}</td>
            <td>R${Number(item.price).toFixed(2)}</td>
            <td class="${item.is_available ? 'available' : 'sold-out'}">
                ${item.is_available ? 'Available' : 'Sold Out'}
            </td>
            <td>
                ${
                    item.photo_url
                        ? `<a href="${escapeAttribute(item.photo_url)}" target="_blank" rel="noopener noreferrer">View</a>`
                        : 'N/A'
                }
            </td>
            <td>
                <button data-action="edit" data-id="${item.id}">Edit</button>
                <button data-action="toggle" data-id="${item.id}" data-current="${item.is_available}">
                    ${item.is_available ? 'Mark Sold Out' : 'Mark Available'}
                </button>
            </td>
        `

        menuTableBody.appendChild(row)
    })

    attachRowEvents(items)
}

function attachRowEvents(items) {
    const editButtons = document.querySelectorAll('[data-action="edit"]')
    const toggleButtons = document.querySelectorAll('[data-action="toggle"]')

    editButtons.forEach(button => {
        button.addEventListener('click', () => {
            const itemId = button.dataset.id
            const item = items.find(entry => entry.id === itemId)

            if (!item) return

            populateFormForEdit(item)
        })
    })

    toggleButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const itemId = button.dataset.id
            const currentValue = button.dataset.current === 'true'

            try {
                await toggleAvailability(itemId, !currentValue)
                await loadMenuItems()
            } catch (error) {
                message.textContent = error.message || 'Failed to update item status'
            }
        })
    })
}

async function createMenuItem(payload) {
    message.textContent = 'Creating menu item...'

    const { error } = await supabase
        .from('menu_items')
        .insert([
            {
                ...payload
            }
        ])

    if (error) {
        throw new Error(error.message)
    }

    message.textContent = 'Menu item created successfully'
}

async function updateMenuItem(itemId, payload) {
    message.textContent = 'Updating menu item...'

    const { error } = await supabase
        .from('menu_items')
        .update(payload)
        .eq('id', itemId)
        .eq('vendor_id', currentVendor.id)

    if (error) {
        throw new Error(error.message)
    }

    message.textContent = 'Menu item updated successfully'
}

async function toggleAvailability(itemId, newValue) {
    message.textContent = 'Updating item availability...'

    const { error } = await supabase
        .from('menu_items')
        .update({
            is_available: newValue,
            updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .eq('vendor_id', currentVendor.id)

    if (error) {
        throw new Error(error.message)
    }

    message.textContent = 'Item availability updated successfully'
}

function populateFormForEdit(item) {
    formTitle.textContent = 'Edit Menu Item'
    itemIdInput.value = item.id
    nameInput.value = item.name || ''
    descriptionInput.value = item.description || ''
    priceInput.value = item.price ?? ''
    photoUrlInput.value = item.photo_url || ''
    isAvailableInput.value = item.is_available ? 'true' : 'false'
    cancelEditBtn.hidden = false
}

function resetForm() {
    formTitle.textContent = 'Add Menu Item'
    itemIdInput.value = ''
    nameInput.value = ''
    descriptionInput.value = ''
    priceInput.value = ''
    photoUrlInput.value = ''
    isAvailableInput.value = 'true'
    cancelEditBtn.hidden = true
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

function escapeAttribute(value) {
    if (value === null || value === undefined) return ''

    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
}