import { supabase } from '../supabaseClient.js'
import {
    requireLoggedInUser,
    getUserById,
    getVendorProfileByUserId
} from '../authHelpers.js'

const menuForm = document.getElementById('menu-item-form')
const menuItemsContainer = document.getElementById('menu-items-container')
const submitBtn = document.getElementById('submit-btn')
const cancelEditBtn = document.getElementById('cancel-edit-btn')
const logoutBtn = document.getElementById('logout-btn')
const message = document.getElementById('message')
const formTitle = document.getElementById('form-title')

const editingItemIdInput = document.getElementById('editing-item-id')
const itemNameInput = document.getElementById('item-name')
const itemDescriptionInput = document.getElementById('item-description')
const itemPriceInput = document.getElementById('item-price')
const itemImageUrlInput = document.getElementById('item-image-url')
const itemAvailabilityInput = document.getElementById('item-availability')

let authUser = null
let vendorProfile = null

document.addEventListener('DOMContentLoaded', async () => {
    try {
        authUser = await requireLoggedInUser('vendor-login.html')

        if (!authUser) return

        const userRow = await getUserById(authUser.id)

        if (!userRow || userRow.role !== 'vendor') {
            alert('Access denied. Only vendors can access this page.')
            window.location.href = 'vendor-login.html'
            return
        }

        vendorProfile = await getVendorProfileByUserId(authUser.id)

        if (!vendorProfile) {
            window.location.href = 'vendor-onboarding.html'
            return
        }

        if (vendorProfile.status === 'pending') {
            message.textContent = 'Your vendor account is waiting for admin approval.'
            menuForm.style.display = 'none'
            return
        }

        if (vendorProfile.status === 'suspended') {
            message.textContent = 'Your vendor account has been suspended.'
            menuForm.style.display = 'none'
            return
        }

        if (vendorProfile.status !== 'approved') {
            message.textContent = 'Unknown vendor status.'
            menuForm.style.display = 'none'
            return
        }

        setupLogout()
        setupCancelEdit()
        setupFormSubmit()
        await loadMenuItems()
    } catch (error) {
        message.textContent = error.message || 'Failed to load menu management page.'
    }
})

function setupLogout() {
    logoutBtn.addEventListener('click', async () => {
        await supabase.auth.signOut()
        window.location.href = 'vendor-login.html'
    })
}

function setupCancelEdit() {
    cancelEditBtn.addEventListener('click', () => {
        resetForm()
    })
}

function setupFormSubmit() {
    menuForm.addEventListener('submit', async (event) => {
        event.preventDefault()

        const editingItemId = editingItemIdInput.value.trim()
        const itemName = itemNameInput.value.trim()
        const itemDescription = itemDescriptionInput.value.trim()
        const itemPrice = parseFloat(itemPriceInput.value)
        const itemImageUrl = itemImageUrlInput.value.trim()
        const itemAvailability = itemAvailabilityInput.value === 'true'

        if (!itemName) {
            message.textContent = 'Please enter the item name.'
            return
        }

        if (!itemDescription) {
            message.textContent = 'Please enter the item description.'
            return
        }

        if (Number.isNaN(itemPrice) || itemPrice < 0) {
            message.textContent = 'Please enter a valid price.'
            return
        }

        const payload = {
            vendor_id: vendorProfile.id,
            name: itemName,
            description: itemDescription,
            price: itemPrice,
            image_url: itemImageUrl || null,
            is_available: itemAvailability,
            updated_at: new Date().toISOString()
        }

        try {
            if (editingItemId) {
                const { error } = await supabase
                    .from('menu_items')
                    .update(payload)
                    .eq('id', editingItemId)
                    .eq('vendor_id', vendorProfile.id)

                if (error) {
                    throw new Error(error.message)
                }

                message.textContent = 'Menu item updated successfully.'
            } else {
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

                message.textContent = 'Menu item added successfully.'
            }

            resetForm()
            await loadMenuItems()
        } catch (error) {
            message.textContent = error.message || 'Failed to save menu item.'
        }
    })
}

async function loadMenuItems() {
    const { data: menuItems, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('vendor_id', vendorProfile.id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching menu items:', error)
        menuItemsContainer.innerHTML = '<p>Failed to load menu items.</p>'
        return
    }

    displayMenuItems(menuItems)
}

function displayMenuItems(items) {
    if (!items || items.length === 0) {
        menuItemsContainer.innerHTML = '<p>No menu items found. Please add some!</p>'
        return
    }

    menuItemsContainer.innerHTML = ''

    items.forEach((item) => {
        const itemElement = document.createElement('article')
        itemElement.classList.add('menu-item-card')

        itemElement.innerHTML = `
            <h3>${escapeHtml(item.name)}</h3>
            <p><strong>Description:</strong> ${escapeHtml(item.description || 'No description available.')}</p>
            <p><strong>Price:</strong> R${Number(item.price).toFixed(2)}</p>
            <p><strong>Availability:</strong> <span class="${item.is_available ? 'status-available' : 'status-sold-out'}">${item.is_available ? 'Available' : 'Sold Out'}</span></p>
            <p><strong>Image:</strong> ${item.image_url ? `<a href="${escapeAttribute(item.image_url)}" target="_blank" rel="noopener noreferrer">View image</a>` : 'No image'}</p>
            <div class="card-buttons">
                <button class="edit-button" data-id="${item.id}">Edit</button>
                <button class="toggle-button" data-id="${item.id}" data-available="${item.is_available}">
                    ${item.is_available ? 'Mark Sold Out' : 'Mark Available'}
                </button>
            </div>
        `

        const editBtn = itemElement.querySelector('.edit-button')
        const toggleBtn = itemElement.querySelector('.toggle-button')

        editBtn.addEventListener('click', () => {
            startEdit(item)
        })

        toggleBtn.addEventListener('click', async () => {
            await toggleAvailability(item.id, item.is_available)
        })

        menuItemsContainer.appendChild(itemElement)
    })
}

function startEdit(item) {
    editingItemIdInput.value = item.id
    itemNameInput.value = item.name
    itemDescriptionInput.value = item.description
    itemPriceInput.value = item.price
    itemImageUrlInput.value = item.image_url || ''
    itemAvailabilityInput.value = String(item.is_available)

    formTitle.textContent = 'Edit Menu Item'
    submitBtn.textContent = 'Update Item'
    cancelEditBtn.hidden = false
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function toggleAvailability(itemId, currentAvailability) {
    try {
        const { error } = await supabase
            .from('menu_items')
            .update({
                is_available: !currentAvailability,
                updated_at: new Date().toISOString()
            })
            .eq('id', itemId)
            .eq('vendor_id', vendorProfile.id)

        if (error) {
            throw new Error(error.message)
        }

        message.textContent = 'Item availability updated successfully.'
        await loadMenuItems()
    } catch (error) {
        message.textContent = error.message || 'Failed to update item availability.'
    }
}

function resetForm() {
    editingItemIdInput.value = ''
    menuForm.reset()
    formTitle.textContent = 'Add Menu Item'
    submitBtn.textContent = 'Add Item'
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