import {
    getCurrentSessionUser,
    getUserById,
    createUserProfile,
    getVendorProfileByUserId
} from '../authHelpers.js'

const message = document.getElementById('message')

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const authUser = await getCurrentSessionUser()

        if (!authUser) {
            message.textContent = 'No active session found.'
            return
        }

        const params = new URLSearchParams(window.location.search)
        const requestedRole = params.get('role')

        if (!requestedRole || !['student', 'vendor', 'admin'].includes(requestedRole)) {
            message.textContent = 'Invalid role.'
            return
        }

        let userRow = await getUserById(authUser.id)

        if (!userRow) {
            await createUserProfile({
                id: authUser.id,
                email: authUser.email,
                role: requestedRole
            })

            userRow = await getUserById(authUser.id)
        }

        if (requestedRole !== userRow.role) {
            message.textContent = `This account is registered as ${userRow.role}, not ${requestedRole}.`
            return
        }

        if (userRow.role === 'student') {
            window.location.href = 'student-dashboard.html'
            return
        }

        if (userRow.role === 'vendor') {
            const vendor = await getVendorProfileByUserId(authUser.id)

            if (!vendor) {
                window.location.href = 'vendor-onboarding.html'
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

            if (vendor.status === 'approved') {
                window.location.href = 'vendor-dashboard.html'
                return
            }

            message.textContent = 'Unknown vendor status.'
            return
        }

        if (userRow.role === 'admin') {
            window.location.href = 'admin-dashboard.html'
            return
        }

        message.textContent = 'Unknown user role.'
    } catch (error) {
        message.textContent = error.message || 'Authentication failed.'
    }
})