import { supabase } from '../supabaseClient.js'
import { getUserRole, getVendorProfile } from '../authHelpers.js'

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

            if (role !== 'vendor') {
                message.textContent = 'This login page is for vendors only'
                await supabase.auth.signOut()
                return
            }

            const vendor = await getVendorProfile(user.id)

            if (vendor.status === 'pending') {
                message.textContent = 'Your account is waiting for admin approval'
                await supabase.auth.signOut()
                return
            }

            if (vendor.status === 'suspended') {
                message.textContent = 'Your account has been suspended'
                await supabase.auth.signOut()
                return
            }

            if (vendor.status === 'approved') {
                message.textContent = 'Login successful! Redirecting...'

                setTimeout(() => {
                    window.location.href = 'vendor-dashboard.html'
                }, 1000)
                return
            }

            message.textContent = 'Unknown vendor status'
            await supabase.auth.signOut()
        } catch (error) {
            message.textContent = error.message || 'Login failed'
        }
    })
})