import { supabase } from './supabaseClient.js'

export async function getCurrentSessionUser() {
    const { data, error } = await supabase.auth.getSession()

    if (error || !data.session) {
        return null
    }

    return data.session.user
}

export async function getUserById(userId) {
    const { data, error } = await supabase
        .from('users')
        .select('id, email, role, created_at')
        .eq('id', userId)
        .maybeSingle()

    if (error) {
        throw new Error(error.message)
    }

    return data
}

export async function createUserProfile({ id, email, role }) {
    const { error } = await supabase
        .from('users')
        .insert([
            {
                id,
                email,
                role
            }
        ])

    if (error) {
        throw new Error(error.message)
    }
}

export async function getVendorProfileByUserId(userId) {
    const { data, error } = await supabase
        .from('vendors')
        .select('id, user_id, business_name, status, created_at, updated_at')
        .eq('user_id', userId)
        .maybeSingle()

    if (error) {
        throw new Error(error.message)
    }

    return data
}

export async function createVendorProfile({ userId, businessName }) {
    const { error } = await supabase
        .from('vendors')
        .insert([
            {
                user_id: userId,
                business_name: businessName,
                status: 'pending'
            }
        ])

    if (error) {
        throw new Error(error.message)
    }
}

export async function requireLoggedInUser(redirectTo) {
    const user = await getCurrentSessionUser()

    if (!user) {
        window.location.href = redirectTo
        return null
    }

    return user
}