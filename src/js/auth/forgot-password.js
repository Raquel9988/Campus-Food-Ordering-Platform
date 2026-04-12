import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabase = createClient(
    'https://sqbscxfolbckikrzxqhr.supabase.co',
    'sb_publishable_Zw_iCK1n54xXGPuDWALWQQ_k2cOQWay'
)

const form = document.getElementById('forgot-form')
const message = document.getElementById('message')

form.addEventListener('submit', async (e) => {
    e.preventDefault()

    const email = document.getElementById('email').value.trim()

    if (!email) {
        message.textContent = 'Please enter your email'
        return
    }

    message.textContent = 'Checking account...'

    try {
        const { data: users, error: userError } = await supabase
            .from('users')
            .select('id, role')
            .eq('email', email)

        if (userError) throw userError

        if (!users || users.length === 0) {
            message.textContent = 'User not found'
            return
        }

        const user = users[0]

        if (user.role === 'vendor') {
            const { data: vendors, error: vendorError } = await supabase
                .from('vendors')
                .select('status')
                .eq('user_id', user.id)

            if (vendorError) throw vendorError

            if (!vendors || vendors.length === 0) {
                message.textContent = 'Vendor profile not found'
                return
            }

            if (vendors[0].status !== 'approved') {
                message.textContent = 'Vendor not approved yet'
                return
            }
        }

        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: 'https://darling-belekoy-f7e717.netlify.app/reset-password.html'
        })

        if (resetError) throw resetError

        message.textContent = 'Reset email sent! Check your inbox.'

    } catch (err) {
        console.error(err)
        message.textContent = 'Something went wrong. Try again.'
    }
})