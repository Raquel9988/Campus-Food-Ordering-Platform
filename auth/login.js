import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://sqbscxfolbckikrzxqhr.supabase.co'
const supabaseKey = 'sb_publishable_Zw_iCK1n54xXGPuDWALWQQ_k2cOQWay'

const supabase = createClient(supabaseUrl, supabaseKey)

const form = document.getElementById('login-form')
const message = document.getElementById('message')

form.addEventListener('submit', async (e) => {
    e.preventDefault()

    const email = document.getElementById('email').value.trim()
    const password = document.getElementById('password').value

    message.textContent = "Logging in..."

    // Login
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    })

    if (error) {
        message.textContent = error.message
        return
    }

    const user = data.user

    // Get role (FIXED: no .single())
    const { data: users, error: roleError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)

    if (roleError || !users || users.length === 0) {
        message.textContent = "User role not found"
        return
    }

    const role = users[0].role

    // Redirect based on role
    if (role === "vendor") {
        window.location.href = "vendor-dashboard.html"
    } else {
        message.textContent = "Access denied (not a vendor)"
    }
})