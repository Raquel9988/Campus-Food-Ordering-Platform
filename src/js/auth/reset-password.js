import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Supabase setup
const supabase = createClient(
    'https://sqbscxfolbckikrzxqhr.supabase.co',
    'sb_publishable_Zw_iCK1n54xXGPuDWALWQQ_k2cOQWay'
)

const form = document.getElementById('reset-form')
const message = document.getElementById('message')

// ✅ Handle session from email link properly
window.addEventListener('load', async () => {
    // This extracts token from URL automatically
    const { data, error } = await supabase.auth.getSession()

    if (error || !data.session) {
        message.textContent = 'Invalid or expired reset link'
        form.style.display = 'none'
        return
    }

    message.textContent = 'Enter your new password'
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

    if (newPassword.length < 6) {
        message.textContent = 'Password must be at least 6 characters'
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

    message.textContent = 'Password updated successfully! Redirecting...'

    setTimeout(() => {
        window.location.href = 'student-login.html'
    }, 1500)
})