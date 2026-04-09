import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Supabase setup
const supabase = createClient(
    'https://sqbscxfolbckikrzxqhr.supabase.co',
    'sb_publishable_Zw_iCK1n54xXGPuDWALWQQ_k2cOQWay'
)

// Elements
const form = document.getElementById('forgot-form')
const message = document.getElementById('message')

// Handle submit
form.addEventListener('submit', async (e) => {
    e.preventDefault()

    const email = document.getElementById('email').value.trim()
    message.textContent = 'Checking account...'

    // Check if user exists
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, role')
        .eq('email', email)

    if (userError) {
        message.textContent = 'Error checking user'
        return
    }

    if (!users || users.length === 0) {
        message.textContent = 'User not found'
        return
    }

    const user = users[0]

    // If vendor → check approval
    if (user.role === 'vendor') {
        const { data: vendors, error: vendorError } = await supabase
            .from('vendors')
            .select('status')
            .eq('user_id', user.id)

        if (vendorError) {
            message.textContent = 'Error checking vendor'
            return
        }

        if (!vendors || vendors.length === 0) {
            message.textContent = 'Vendor profile not found'
            return
        }

        if (vendors[0].status !== 'approved') {
            message.textContent = 'Vendor not approved yet'
            return
        }
    }

    // ✅ FIXED: Use your deployed Netlify URL
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://f7e717.netlify.app/reset-password.html'
    })

    if (resetError) {
        message.textContent = resetError.message
        return
    }

    message.textContent = 'Reset email sent! Check your inbox.'
})