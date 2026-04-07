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

    message.textContent = "Logging in..."

    // Login user
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    })

    if (error) {
        message.textContent = error.message
        return
    }

    const user = data.user

    // Get role from database
    const { data: users, error: roleError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)

    if (roleError || !users || users.length === 0) {
        message.textContent = "User role not found"
        return
    }

    const role = users[0].role

    // Redirect (ONLY vendor handled for now)
    if (role === "vendor") {
        window.location.href = "../vendor/vendor-dashboard.html"
    } else {
        
        message.textContent = "Login successful, but your dashboard is not ready yet"
    }
})