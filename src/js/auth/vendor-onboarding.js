import {
    getCurrentSessionUser,
    getUserById,
    getVendorProfileByUserId,
    createVendorProfile
} from '../authHelpers.js'

const form = document.getElementById('vendor-form')
const message = document.getElementById('message')

document.addEventListener('DOMContentLoaded', async () => {
    const user = await getCurrentSessionUser()

    if (!user) {
        window.location.href = 'vendor-login.html'
        return
    }

    const userRow = await getUserById(user.id)

    if (!userRow || userRow.role !== 'vendor') {
        window.location.href = 'vendor-login.html'
        return
    }

    const vendor = await getVendorProfileByUserId(user.id)

    if (vendor) {
        if (vendor.status === 'approved') {
            window.location.href = 'vendor-dashboard.html'
            return
        }

        message.textContent = `Vendor account status: ${vendor.status}`
    }
})

form.addEventListener('submit', async (e) => {
    e.preventDefault()

    try {
        const authUser = await getCurrentSessionUser()
        const businessName = document.getElementById('business-name').value.trim()

        if (!authUser || !businessName) {
            message.textContent = 'Please complete all fields.'
            return
        }

        const existingVendor = await getVendorProfileByUserId(authUser.id)

        if (existingVendor) {
            message.textContent = 'Vendor profile already exists.'
            return
        }

        await createVendorProfile({
            userId: authUser.id,
            businessName
        })

        message.textContent = 'Vendor profile created. Waiting for admin approval.'
        form.reset()
    } catch (error) {
        message.textContent = error.message || 'Failed to create vendor profile.'
    }
})