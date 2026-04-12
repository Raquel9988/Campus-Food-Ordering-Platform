import { supabase } from '../supabaseClient.js'
import { getUserRole } from '../authHelpers.js'

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form')
    const message = document.getElementById('message')

    form.addEventListener('submit', async (e) => {
        e.preventDefault()

        const email = document.getElementById('email').value.trim()
        const password = document.getElementById('password').value

        if (!email || !password) {
            message.textContent = 'Please fill in all fields'
            return
        }

        message.textContent = 'Logging in...'

        try {
            const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
                email,
                password
            })

            if (loginError) {
                throw new Error(loginError.message)
            }

            const user = loginData.user

            if (!user) {
                throw new Error('Login failed')
            }

            const role = await getUserRole(user.id)

            if (role !== 'student') {
                message.textContent = 'This login page is for students only'
                await supabase.auth.signOut()
                return
            }

            message.textContent = 'Login successful! Redirecting...'

            setTimeout(() => {
                window.location.href = 'student-dashboard.html'
            }, 1000)
        } catch (error) {
            message.textContent = error.message || 'Login failed'
        }
    })
})