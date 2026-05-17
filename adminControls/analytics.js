import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://sqbscxfolbckikrzxqhr.supabase.co'
const supabaseKey = 'sb_publishable_Zw_iCK1n54xXGPuDWALWQQ_k2cOQWay'
const supabase = createClient(supabaseUrl, supabaseKey)

window.addEventListener('load', async () => {
  const summaryNumbers = document.querySelectorAll('.summary-number')

  const salesReportOutput = document.getElementById('sales-report-output')
  const peakHoursOutput = document.getElementById('peak-hours-output')
  const customViewOutput = document.getElementById('custom-view-output')
  const exportOutput = document.getElementById('export-output')

  const hasAccess = await checkAnalyticsAccess()

  if (!hasAccess) {
    showAccessDeniedState()

    setTimeout(() => {
      window.location.href = '../auth/login.html'
    }, 1500)

    return
  }

  try {
    showLoadingState()

    const response = await fetch('https://campus-food-ordering.pages.dev/api/analytics')

    if (!response.ok) {
      throw new Error('Failed to fetch analytics data')
    }

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.message || 'Analytics API returned an error')
    }

    const orders = result.data

    if (!orders || orders.length === 0) {
      showEmptyState()
      return
    }

    window.analyticsOrders = orders

    const totalOrders = orders.length

    const totalRevenue = orders.reduce((total, order) => {
      return total + Number(order.order_total || 0)
    }, 0)

    const activeVendors = new Set(
      orders.map(order => order.vendor_name).filter(Boolean)
    ).size

    const hourCounts = {}

    orders.forEach(order => {
      const hour = order.order_hour

      if (hour !== null && hour !== undefined) {
        hourCounts[hour] = (hourCounts[hour] || 0) + 1
      }
    })

    let peakHour = null
    let highestCount = 0

    for (const hour in hourCounts) {
      if (hourCounts[hour] > highestCount) {
        highestCount = hourCounts[hour]
        peakHour = hour
      }
    }

    const analyticsData = {
      totalOrders,
      totalRevenue: `R${totalRevenue.toFixed(2)}`,
      peakHour: peakHour === null ? 'N/A' : `${String(peakHour).padStart(2, '0')}:00`,
      activeVendors
    }

    updateSummaryCards(analyticsData)
    showDashboardReadyState()
  } catch (error) {
    console.error('Analytics dashboard failed to load:', error)
    showErrorState()
  }

  async function checkAnalyticsAccess() {
    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError || !authData.user) {
      return false
    }

    const { data: appUser, error: userError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', authData.user.id)
      .single()

    if (userError || !appUser) {
      return false
    }

    if (appUser.role !== 'admin') {
      return false
    }

    const { data: adminProfile, error: adminError } = await supabase
      .from('admins')
      .select('id, user_id, status, is_master')
      .eq('user_id', authData.user.id)
      .single()

    if (adminError || !adminProfile) {
      return false
    }

    if (adminProfile.status !== 'approved') {
      return false
    }

    return true
  }

  function updateSummaryCards(data) {
    summaryNumbers[0].textContent = data.totalOrders
    summaryNumbers[1].textContent = data.totalRevenue
    summaryNumbers[2].textContent = data.peakHour
    summaryNumbers[3].textContent = data.activeVendors
  }

  function showLoadingState() {
    salesReportOutput.innerHTML = `
      <p class="loading-message">Loading sales analytics...</p>
    `

    peakHoursOutput.innerHTML = `
      <p class="loading-message">Loading peak ordering data...</p>
    `

    customViewOutput.innerHTML = `
      <p class="loading-message">Loading custom analytics...</p>
    `

    exportOutput.innerHTML = `
      <p class="loading-message">Loading export tools...</p>
    `
  }

  function showDashboardReadyState() {
    if (typeof initPeakHoursReport === 'function') {
      initPeakHoursReport()
    } else {
      console.error('Peak hours report module not loaded')

      peakHoursOutput.innerHTML = `
        <p class="error-message">Error loading peak hours report.</p>
      `
    }

    if (typeof initCustomView === 'function') {
      initCustomView()
    } else {
      console.error('Custom view module not loaded')

      customViewOutput.innerHTML = `
        <p class="error-message">Error loading custom analytics view.</p>
      `
    }

    if (typeof initExportReports === 'function') {
      initExportReports()
    } else {
      console.error('Export reports module not loaded')

      exportOutput.innerHTML = `
        <p class="error-message">Error loading export reports.</p>
      `
    }
  }

  function showEmptyState() {
    salesReportOutput.innerHTML = `
      <p class="loading-message">No analytics data available.</p>
    `

    peakHoursOutput.innerHTML = `
      <p class="loading-message">No peak hours data available.</p>
    `

    customViewOutput.innerHTML = `
      <p class="loading-message">No custom analytics available.</p>
    `

    exportOutput.innerHTML = `
      <p class="loading-message">No export data available.</p>
    `
  }

  function showErrorState() {
    salesReportOutput.innerHTML = `
      <p class="error-message">Failed to load sales analytics.</p>
    `

    peakHoursOutput.innerHTML = `
      <p class="error-message">Failed to load peak hours analytics.</p>
    `

    customViewOutput.innerHTML = `
      <p class="error-message">Failed to load custom analytics.</p>
    `

    exportOutput.innerHTML = `
      <p class="error-message">Failed to load export tools.</p>
    `
  }

  function showAccessDeniedState() {
    salesReportOutput.innerHTML = `
      <p class="error-message">Access denied. Approved admins only.</p>
    `

    peakHoursOutput.innerHTML = `
      <p class="error-message">Access denied. Approved admins only.</p>
    `

    customViewOutput.innerHTML = `
      <p class="error-message">Access denied. Approved admins only.</p>
    `

    exportOutput.innerHTML = `
      <p class="error-message">Access denied. Approved admins only.</p>
    `
  }
})
