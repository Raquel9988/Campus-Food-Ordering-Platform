import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://sqbscxfolbckikrzxqhr.supabase.co'
const supabaseKey = 'sb_publishable_Zw_iCK1n54xXGPuDWALWQQ_k2cOQWay'

const supabase = createClient(supabaseUrl, supabaseKey)

// Check login
const { data: { user } } = await supabase.auth.getUser()

if (!user) {
    window.location.href = "login.html"
}

// Get role (FIXED: no .single())
const { data: users, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)

if (error || !users || users.length === 0) {
    window.location.href = "login.html"
}

const role = users[0].role

// Block non-vendors
if (role !== "vendor") {
    alert("Access denied")
    window.location.href = "login.html"
}

// Logout
const logoutBtn = document.getElementById("logout")

logoutBtn.addEventListener("click", async () => {
    await supabase.auth.signOut()
    window.location.href = "login.html"
})