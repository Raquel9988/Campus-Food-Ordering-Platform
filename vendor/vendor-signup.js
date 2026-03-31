import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://sqbscxfolbckikrzxqhr.supabase.co'
const supabaseKey = 'sb_publishable_Zw_iCK1n54xXGPuDWALWQQ_k2cOQWay'

const supabase = createClient(supabaseUrl, supabaseKey)

const form = document.getElementById('signup-form')
const message = document.getElementById('message')

form.addEventListener('submit', async (e) => {
    e.preventDefault()

    const email = document.getElementById('email').value.trim()
    const password = document.getElementById('password').value
    const role = document.getElementById('role').value

    if (!role) {
        message.textContent = "Please select a role"
        return
    }

    message.textContent = "Registering..."

    const { data, error } = await supabase.auth.signUp({
        email,
        password
    })

    if (error) {
        message.textContent = error.message
        return
    }

    const user = data.user

    if (!user) {
        message.textContent = "Check your email to confirm registration"
        return
    }

    await supabase.from('users').insert([
        {
            id: user.id,
            email,
            role
        }
    ])

    message.textContent = "Registration successful!"
})