import { supabase } from '../supabaseClient.js'
import { createUserProfile, createVendorProfile } from '../authHelpers.js'

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('signup-form')
    const message = document.getElementById('message')

    form.addEventListener('submit', async (e) => {
        e.preventDefault()

        const email = document.getElementById('email').value.trim()
        const password = document.getElementById('password').value
        const businessName = document.getElementById('business-name').value.trim()

        if (!email || !password || !businessName) {
            message.textContent = 'Please fill in all fields'
            return
        }

        if (password.length < 6) {
            message.textContent = 'Password must be at least 6 characters'
            return
        }

        message.textContent = 'Registering vendor...'

        try {
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email,
                password
            })

            if (signUpError) {
                throw new Error(signUpError.message)
            }

            const user = signUpData.user

            if (!user) {
                message.textContent = 'Check your email to confirm registration'
                return
            }

            await createUserProfile({
                id: user.id,
                email,
                role: 'vendor'
            })

            await createVendorProfile({
                userId: user.id,
                businessName
            })

            message.textContent = 'Vendor registration successful! Waiting for admin approval.'

            setTimeout(() => {
                window.location.href = 'vendor-login.html'
            }, 1500)
        } catch (error) {
            message.textContent = error.message || 'Vendor registration failed'
        }
    })
})