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

/*
  Supabase stores timestamptz values in UTC.
  South Africa is UTC+2.

  This function takes the order created_at time from Supabase
  and converts it to South African time before extracting the hour.
*/
function getSouthAfricanHour(order) {
  const timestamp =
    order.created_at ||
    order.order_created_at ||
    order.createdAt ||
    order.timestamp;

  if (!timestamp) {
    console.warn("Order has no created_at timestamp:", order);

    if (order.order_hour !== null && order.order_hour !== undefined) {
      return (Number(order.order_hour) + 2) % 24;
    }

    return null;
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    console.warn("Invalid order timestamp:", timestamp);
    return null;
  }

  const formatter = new Intl.DateTimeFormat("en-ZA", {
    timeZone: "Africa/Johannesburg",
    hour: "2-digit",
    hour12: false
  });

  const parts = formatter.formatToParts(date);
  const hourPart = parts.find(part => part.type === "hour");

  if (!hourPart) {
    return null;
  }

  let hour = Number(hourPart.value);

  if (hour === 24) {
    hour = 0;
  }

  return hour;
}

function processPeakHours(orders) {
  if (!orders || orders.length === 0) {
    return [];
  }

  const hourCounts = {};

  orders.forEach(order => {
    const paymentStatus = String(order.payment_status || "").toLowerCase();

    if (paymentStatus && paymentStatus !== "paid") {
      return;
    }

    const hour = getSouthAfricanHour(order);

    if (hour !== null && hour !== undefined && !Number.isNaN(hour)) {
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }
  });

  const hourArray = Object.entries(hourCounts).map(([hour, count]) => {
    return {
      hour: Number(hour),
      orderCount: count
    };
  });

  hourArray.sort((a, b) => {
    if (b.orderCount !== a.orderCount) {
      return b.orderCount - a.orderCount;
    }

    return a.hour - b.hour;
  });

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
          <th>Number of Paid Orders</th>
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
    getSouthAfricanHour,
    processPeakHours,
    formatHourRange,
    renderPeakHoursTable,
    initPeakHoursReport
  };
}
