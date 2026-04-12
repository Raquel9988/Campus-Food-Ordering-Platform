import { supabase } from '../supabaseClient.js'

const button = document.getElementById('google-login-btn')
const message = document.getElementById('message')

button.addEventListener('click', async () => {
    message.textContent = 'Redirecting to Google...'

    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${window.location.origin}/public/auth-callback.html?role=admin`
        }
    })

    if (error) {
        message.textContent = error.message
    }
})