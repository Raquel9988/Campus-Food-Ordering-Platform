import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'


const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseKey = 'YOUR_ANON_KEY'

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
        message.textContent = "User created, but no user returned"
        return
    }

    
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
})