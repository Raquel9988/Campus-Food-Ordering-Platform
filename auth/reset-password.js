import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Supabase setup
const supabase = createClient(
    'https://sqbscxfolbckikrzxqhr.supabase.co',
    'sb_publishable_Zw_iCK1n54xXGPuDWALWQQ_k2cOQWay'
)

const form = document.getElementById('reset-form')
const message = document.getElementById('message')

// Check session from email link
window.addEventListener('load', async () => {
    const { data, error } = await supabase.auth.getSession()

    if (!data.session) {
        message.textContent = 'Invalid or expired reset link'
    }
})

// Handle password update
form.addEventListener('submit', async (e) => {
    e.preventDefault()

    const newPassword = document.getElementById('new-password').value
    const confirmPassword = document.getElementById('confirm-password').value

    if (newPassword !== confirmPassword) {
        message.textContent = 'Passwords do not match'
        return
    }

    message.textContent = 'Updating password...'

    const { error } = await supabase.auth.updateUser({
        password: newPassword
    })

    if (error) {
        message.textContent = error.message
        return
    }

    message.textContent = 'Password updated successfully!'

    setTimeout(() => {
        window.location.href = 'login.html'
    }, 1500)
})