import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Supabase setup
const supabaseUrl = 'https://sqbscxfolbckikrzxqhr.supabase.co'
const supabaseKey = 'sb_publishable_Zw_iCK1n54xXGPuDWALWQQ_k2cOQWay'
const supabase = createClient(supabaseUrl, supabaseKey)

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('signup-form')
    const roleSelect = document.getElementById('role')
    const businessNameGroup = document.getElementById('business-name-group')
    const businessNameInput = document.getElementById('business-name')
    const message = document.getElementById('message')

    console.log('register.js loaded')

    // Show/hide business name field based on selected role
    roleSelect.addEventListener('change', () => {
        const role = roleSelect.value
        console.log('Selected role:', role)

        if (role === 'vendor') {
            businessNameGroup.style.display = 'block'
            businessNameInput.required = true
        } else {
            businessNameGroup.style.display = 'none'
            businessNameInput.required = false
            businessNameInput.value = ''
        }
    })

    // Handle form submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault()

        const email = document.getElementById('email').value.trim()
        const password = document.getElementById('password').value
        const role = roleSelect.value
        const businessName = businessNameInput.value.trim()

        if (!role) {
            message.textContent = 'Please select a role'
            return
        }

        if (role === 'vendor' && !businessName) {
            message.textContent = 'Please enter the business name'
            return
        }

        message.textContent = 'Registering...'

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password
        })

        if (signUpError) {
            message.textContent = signUpError.message
            return
        }

        const user = signUpData.user

        if (!user) {
            message.textContent = 'Check your email to confirm registration'
            return
        }

        const { error: userInsertError } = await supabase
            .from('users')
            .insert([
                {
                    id: user.id,
                    email: email,
                    role: role
                }
            ])

        if (userInsertError) {
            message.textContent = userInsertError.message
            return
        }

        if (role === 'vendor') {
            const { error: vendorInsertError } = await supabase
                .from('vendors')
                .insert([
                    {
                        user_id: user.id,
                        business_name: businessName,
                        status: 'pending'
                    }
                ])

            if (vendorInsertError) {
                message.textContent = vendorInsertError.message
                return
            }
        }

        message.textContent = 'Registration successful!'

        setTimeout(() => {
            window.location.href = 'login.html'
        }, 1500)
    })
})