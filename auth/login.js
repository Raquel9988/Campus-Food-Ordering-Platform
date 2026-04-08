import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Supabase setup
const supabaseUrl = 'https://sqbscxfolbckikrzxqhr.supabase.co'
const supabaseKey = 'sb_publishable_Zw_iCK1n54xXGPuDWALWQQ_k2cOQWay'

const supabase = createClient(supabaseUrl, supabaseKey)

// DOM elements
const form = document.getElementById('login-form')
const message = document.getElementById('message')

// Handle login
form.addEventListener('submit', async (e) => {
    e.preventDefault()

    const email = document.getElementById('email').value.trim()
    const password = document.getElementById('password').value

    message.textContent = 'Logging in...'

    // Login user
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password
    })

    if (loginError) {
        message.textContent = loginError.message
        return
    }

    const user = loginData.user

    // Get role from users table
    const { data: users, error: roleError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)

    if (roleError || !users || users.length === 0) {
        message.textContent = 'User role not found'
        return
    }

    const role = users[0].role

    if (role === 'vendor') {
        // Check vendor status
        const { data: vendors, error: vendorError } = await supabase
            .from('vendors')
            .select('status')
            .eq('user_id', user.id)

        if (vendorError || !vendors || vendors.length === 0) {
            message.textContent = 'Vendor profile not found'
            return
        }

        const status = vendors[0].status

        if (status === 'pending') {
            message.textContent = 'Your vendor account is waiting for admin approval'
            return
        }

        if (status === 'suspended') {
            message.textContent = 'Your vendor account has been suspended'
            return
        }

        if (status === 'approved') {
            window.location.href = '../vendor/vendor-dashboard.html'
            return
        }

        message.textContent = 'Unknown vendor status'
        return
    }

    if (role === 'student') {
        message.textContent = 'Student dashboard is not ready yet'
        return
    }

    if (role === 'admin') {
        message.textContent = 'Admin dashboard is not ready yet'
        return
    }

    message.textContent = 'Unknown user role'
})