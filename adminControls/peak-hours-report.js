/**
 * Peak Ordering Hours Report Module
 * Shows which hours have the most orders
 * Part of the Analytics Dashboard (Person 4)
 */

/**
 * Fetches clean analytics data from the API endpoint
 * @returns {Promise<Array>} Array of paid orders with fields like order_hour, order_time, order_id, etc.
 */
async function loadAnalyticsData() {
  try {
    const response = await fetch('https://campus-food-ordering.pages.dev/api/analytics');
    const result = await response.json();

    if (!result.success) {
      console.error('Analytics API error:', result.message);
      return [];
    }

    return result.data || [];
  } catch (error) {
    console.error('Failed to load analytics data:', error);
    return [];
  }
}

/**
 * Groups orders by hour and counts how many orders occurred in each hour
 * @param {Array} orders - Array of order objects from the API
 * @returns {Array} Array of objects with { hour, orderCount } sorted by orderCount descending
 */
function processPeakHours(orders) {
  if (!orders || orders.length === 0) {
    return [];
  }

  // Group orders by hour and count them
  const hourCounts = {};

  orders.forEach(order => {
    const hour = order.order_hour; // 0-23 format

    if (hour !== null && hour !== undefined) {
      if (hourCounts[hour]) {
        hourCounts[hour]++;
      } else {
        hourCounts[hour] = 1;
      }
    }
  });

  // Convert to array and sort by orderCount descending (busiest first)
  const hourArray = Object.entries(hourCounts).map(([hour, count]) => ({
    hour: parseInt(hour),
    orderCount: count,
  }));

  // Sort by order count descending (busiest first)
  hourArray.sort((a, b) => b.orderCount - a.orderCount);

  return hourArray;
}

/**
 * Formats a 24-hour number to a time range string
 * @param {number} hour - Hour in 24-hour format (0-23)
 * @returns {string} Formatted time range like "13:00 - 14:00"
 */
function formatHourRange(hour) {
  const startHour = String(hour).padStart(2, '0');
  const endHour = String((hour + 1) % 24).padStart(2, '0');
  return `${startHour}:00 - ${endHour}:00`;
}

/**
 * Generates and displays the peak hours report table
 * @param {Array} hourData - Array of { hour, orderCount } objects sorted by order count
 */
function renderPeakHoursTable(hourData) {
  const peakOutput = document.getElementById('peak-hours-output');

  if (!peakOutput) {
    console.error('peak-hours-output element not found in the DOM');
    return;
  }

  // Handle empty data
  if (!hourData || hourData.length === 0) {
    peakOutput.innerHTML = '<p>No orders found.</p>';
    return;
  }

  // Find the maximum order count to highlight the busiest hour
  const maxOrderCount = Math.max(...hourData.map(h => h.orderCount));

  // Build the table HTML
  let tableHTML = `
    <table class="peak-hours-table">
      <thead>
        <tr>
          <th>Hour</th>
          <th>Number of Orders</th>
        </tr>
      </thead>
      <tbody>
  `;

  hourData.forEach(item => {
    const timeRange = formatHourRange(item.hour);
    const isBusiest = item.orderCount === maxOrderCount ? 'class="busiest-hour"' : '';

    tableHTML += `
        <tr ${isBusiest}>
          <td>${timeRange}</td>
          <td>${item.orderCount}</td>
        </tr>
    `;
  });

  tableHTML += `
      </tbody>
    </table>
  `;

  peakOutput.innerHTML = tableHTML;
}

/**
 * Main initialization function
 * Loads analytics data, processes peak hours, and renders the report
 */
async function initPeakHoursReport() {
  try {
    // Show loading state
    const peakOutput = document.getElementById('peak-hours-output');
    if (peakOutput) {
      peakOutput.innerHTML = '<p>Loading peak hours data...</p>';
    }

    // Load analytics data
    const orders = await loadAnalyticsData();

    // Process the data to find peak hours
    const peakHoursData = processPeakHours(orders);

    // Render the report
    renderPeakHoursTable(peakHoursData);
  } catch (error) {
    console.error('Error initializing peak hours report:', error);
    const peakOutput = document.getElementById('peak-hours-output');
    if (peakOutput) {
      peakOutput.innerHTML = '<p>Error loading peak hours data. Please try again later.</p>';
    }
  }
}

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    loadAnalyticsData,
    processPeakHours,
    formatHourRange,
    renderPeakHoursTable,
    initPeakHoursReport,
  };
}
