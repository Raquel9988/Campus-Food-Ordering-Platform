import { getCurrentSessionUser, getUserById, getVendorProfile, createVendorProfile } from '../authHelpers.js'

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

    const vendor = await getVendorProfile(user.id)
    if (vendor) {
        window.location.href = 'vendor-dashboard.html'
    }
})

form.addEventListener('submit', async (e) => {
    e.preventDefault()

    try {
        const user = await getCurrentSessionUser()
        const businessName = document.getElementById('business-name').value.trim()

        if (!user || !businessName) {
            message.textContent = 'Please complete the form.'
            return
        }

        await createVendorProfile({
            userId: user.id,
            businessName
        })

        message.textContent = 'Vendor profile created. Waiting for admin approval.'
    } catch (error) {
        message.textContent = error.message || 'Failed to create vendor profile.'
    }
})