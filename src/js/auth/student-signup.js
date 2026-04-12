import { supabase } from '../supabaseClient.js'
import { createUserProfile } from '../authHelpers.js'

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('signup-form')
    const message = document.getElementById('message')

    form.addEventListener('submit', async (e) => {
        e.preventDefault()

        const email = document.getElementById('email').value.trim()
        const password = document.getElementById('password').value

        if (!email || !password) {
            message.textContent = 'Please fill in all fields'
            return
        }

        if (password.length < 6) {
            message.textContent = 'Password must be at least 6 characters'
            return
        }

        message.textContent = 'Registering...'

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
                role: 'student'
            })

            message.textContent = 'Registration successful! Redirecting...'

            setTimeout(() => {
                window.location.href = 'student-login.html'
            }, 1500)
        } catch (error) {
            message.textContent = error.message || 'Registration failed'
        }
    })
})