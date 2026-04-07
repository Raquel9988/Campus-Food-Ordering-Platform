import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Supabase setup
const supabaseUrl = 'https://sqbscxfolbckikrzxqhr.supabase.co'
const supabaseKey = 'sb_publishable_Zw_iCK1n54xXGPuDWALWQQ_k2cOQWay'

const supabase = createClient(supabaseUrl, supabaseKey)

// Get elements
const form = document.getElementById('signup-form')
const message = document.getElementById('message')

// Handle form submit
form.addEventListener('submit', async (e) => {
    e.preventDefault()

    const email = document.getElementById('email').value.trim()
    const password = document.getElementById('password').value
    const role = document.getElementById('role').value

    // Check role selected
    if (!role) {
        message.textContent = "Please select a role"
        return
    }

    message.textContent = "Registering..."

    // Create auth user
    const { data, error } = await supabase.auth.signUp({
        email,
        password
    })

    if (error) {
        message.textContent = error.message
        return
    }

    const user = data.user

    // If email confirmation required
    if (!user) {
        message.textContent = "Check your email to confirm registration"
        return
    }

    // tore user role in DB
    const { error: insertError } = await supabase
        .from('users')
        .insert([
            {
                id: user.id,
                email: email,
                role: role
            }
        ])

    if (insertError) {
        message.textContent = insertError.message
        return
    }

    message.textContent = "Registration successful!"

    // OPTIONAL: redirect to login after registration
    setTimeout(() => {
        window.location.href = "login.html"
    }, 1500)
})