import { supabase } from './supabaseClient.js'

export async function getCurrentSessionUser() {
    const { data, error } = await supabase.auth.getSession()

    if (error || !data.session) {
        return null
    }

    return data.session.user
}

export async function getUserRole(userId) {
    const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single()

    if (error) {
        throw new Error('Error fetching user role')
    }

    return data.role
}

export async function getVendorProfile(userId) {
    const { data, error } = await supabase
        .from('vendors')
        .select('id, status, business_name')
        .eq('user_id', userId)
        .single()

    if (error) {
        throw new Error('Error fetching vendor profile')
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