import { getCurrentSessionUser, getUserRole, getVendorProfile } from './authHelpers.js'

export async function requireLoggedInUser(redirectTo = 'student-login.html') {
    const user = await getCurrentSessionUser()

    if (!user) {
        window.location.href = redirectTo
        return null
    }

    return user
}

export async function requireAdmin(redirectTo = 'student-login.html') {
    const user = await requireLoggedInUser(redirectTo)

    if (!user) return null

    try {
        const role = await getUserRole(user.id)

        if (role !== 'admin') {
            window.location.href = redirectTo
            return null
        }

        return user
    } catch {
        window.location.href = redirectTo
        return null
    }
}

export async function requireApprovedVendor(redirectTo = 'vendor-login.html') {
    const user = await requireLoggedInUser(redirectTo)

    if (!user) return null

    try {
        const role = await getUserRole(user.id)

        if (role !== 'vendor') {
            window.location.href = redirectTo
            return null
        }

        const vendor = await getVendorProfile(user.id)

        if (vendor.status !== 'approved') {
            window.location.href = redirectTo
            return null
        }

        return user
    } catch {
        window.location.href = redirectTo
        return null
    }
}