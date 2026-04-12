import { getCurrentSessionUser, getUserById, createUserProfile, getVendorProfile } from '../authHelpers.js'

const message = document.getElementById('message')

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const user = await getCurrentSessionUser()

        if (!user) {
            message.textContent = 'No active session found.'
            return
        }

        const params = new URLSearchParams(window.location.search)
        const requestedRole = params.get('role')

        let userRow = await getUserById(user.id)

        if (!userRow) {
            await createUserProfile({
                id: user.id,
                email: user.email,
                role: requestedRole
            })
            userRow = await getUserById(user.id)
        }

        if (userRow.role === 'student') {
            window.location.href = 'student-dashboard.html'
            return
        }

        if (userRow.role === 'vendor') {
            const vendor = await getVendorProfile(user.id)

            if (!vendor) {
                window.location.href = 'vendor-onboarding.html'
                return
            }

            if (vendor.status === 'approved') {
                window.location.href = 'vendor-dashboard.html'
                return
            }

            if (vendor.status === 'pending') {
                message.textContent = 'Your vendor account is waiting for admin approval.'
                return
            }

            if (vendor.status === 'suspended') {
                message.textContent = 'Your vendor account has been suspended.'
                return
            }
        }

        if (userRow.role === 'admin') {
            window.location.href = 'admin-dashboard.html'
            return
        }

        message.textContent = 'Unknown role.'
    } catch (error) {
        message.textContent = error.message || 'Authentication failed.'
    }
})