
async function loadPeakHoursAnalyticsData() {
  try {
    const response = await fetch("https://campus-food-ordering.pages.dev/api/analytics");

    if (!response.ok) {
      throw new Error("Failed to fetch analytics data");
    }

    const result = await response.json();

    if (!result.success) {
      console.error("Analytics API error:", result.message);
      return [];
    }

    return result.data || [];
  } catch (error) {
    console.error("Failed to load analytics data:", error);
    return [];
  }
}

function processPeakHours(orders) {
  if (!orders || orders.length === 0) {
    return [];
  }

  const hourCounts = {};

  orders.forEach(order => {
    const hour = order.order_hour;

    if (hour !== null && hour !== undefined) {
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }
  });

  const hourArray = Object.entries(hourCounts).map(([hour, count]) => {
    return {
      hour: Number(hour),
      orderCount: count
    };
  });

  hourArray.sort((a, b) => b.orderCount - a.orderCount);

  return hourArray;
}

function formatHourRange(hour) {
  const startHour = String(hour).padStart(2, "0");
  const endHour = String((hour + 1) % 24).padStart(2, "0");

  return `${startHour}:00 - ${endHour}:00`;
}

function renderPeakHoursTable(hourData) {
  const peakOutput = document.getElementById("peak-hours-output");

  if (!peakOutput) {
    console.error("peak-hours-output element not found.");
    return;
  }

  if (!hourData || hourData.length === 0) {
    peakOutput.innerHTML = `
      <section class="empty-state">
        <h3>No Peak Hours Data</h3>
        <p>No paid orders were found for the peak hours report.</p>
      </section>
    `;

    return;
  }

  const maxOrderCount = Math.max(...hourData.map(item => item.orderCount));

  const rows = hourData.map(item => {
    const timeRange = formatHourRange(item.hour);
    const busiestClass = item.orderCount === maxOrderCount ? "busiest-hour" : "";

    return `
      <tr class="${busiestClass}">
        <td>${timeRange}</td>
        <td>${item.orderCount}</td>
      </tr>
    `;
  }).join("");

  peakOutput.innerHTML = `
    <table class="peak-hours-table">
      <thead>
        <tr>
          <th>Hour</th>
          <th>Number of Orders</th>
        </tr>
      </thead>

      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

async function initPeakHoursReport() {
  const peakOutput = document.getElementById("peak-hours-output");

  if (peakOutput) {
    peakOutput.innerHTML = `
      <p class="loading-message">Loading peak hours data...</p>
    `;
  }

  try {
    const orders = await loadPeakHoursAnalyticsData();
    const peakHoursData = processPeakHours(orders);

    renderPeakHoursTable(peakHoursData);
  } catch (error) {
    console.error("Error initializing peak hours report:", error);

    if (peakOutput) {
      peakOutput.innerHTML = `
        <p class="error-message">Error loading peak hours data. Please try again later.</p>
      `;
    }
  }
}

window.initPeakHoursReport = initPeakHoursReport;

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    loadPeakHoursAnalyticsData,
    processPeakHours,
    formatHourRange,
    renderPeakHoursTable,
    initPeakHoursReport
  };
}
