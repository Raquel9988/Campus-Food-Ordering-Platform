/**
 * Peak Hours Report
 * Loads paid order data, calculates peak ordering hours,
 * and renders a professional analytics report with filters.
 */

const PEAK_HOURS_STATE = {
  rawOrders: [],
  peakHoursData: [],
  period: "all",
  displayLimit: "top10",
  sortMode: "busiest",
  viewMode: "both"
};

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

function getFullDayHourData(hourData) {
  const hourMap = new Map();

  hourData.forEach(item => {
    hourMap.set(Number(item.hour), Number(item.orderCount));
  });

  return Array.from({ length: 24 }, (_, hour) => {
    return {
      hour,
      orderCount: hourMap.get(hour) || 0
    };
  });
}

function isHourInSelectedPeriod(hour, period) {
  if (period === "morning") {
    return hour >= 6 && hour <= 11;
  }

  if (period === "afternoon") {
    return hour >= 12 && hour <= 16;
  }

  if (period === "evening") {
    return hour >= 17 && hour <= 21;
  }

  if (period === "night") {
    return hour >= 22 || hour <= 5;
  }

  return true;
}

function getPeriodName(period) {
  const periodNames = {
    all: "Full Day",
    morning: "Morning",
    afternoon: "Afternoon",
    evening: "Evening",
    night: "Night"
  };

  return periodNames[period] || "Full Day";
}

function getFilteredPeakHoursData(hourData) {
  let filteredData = getFullDayHourData(hourData).filter(item => {
    return isHourInSelectedPeriod(item.hour, PEAK_HOURS_STATE.period);
  });

  if (PEAK_HOURS_STATE.displayLimit !== "all24") {
    filteredData = filteredData.filter(item => item.orderCount > 0);
  }

  if (PEAK_HOURS_STATE.sortMode === "chronological") {
    filteredData.sort((a, b) => a.hour - b.hour);
  } else {
    filteredData.sort((a, b) => {
      if (b.orderCount !== a.orderCount) {
        return b.orderCount - a.orderCount;
      }

      return a.hour - b.hour;
    });
  }

  if (PEAK_HOURS_STATE.displayLimit === "top5") {
    return filteredData.slice(0, 5);
  }

  if (PEAK_HOURS_STATE.displayLimit === "top10") {
    return filteredData.slice(0, 10);
  }

  return filteredData;
}

function getCurrentPeriodData(hourData) {
  return getFullDayHourData(hourData).filter(item => {
    return isHourInSelectedPeriod(item.hour, PEAK_HOURS_STATE.period);
  });
}

function getPeakHoursSummary(hourData) {
  const periodData = getCurrentPeriodData(hourData);
  const activeHours = periodData.filter(item => item.orderCount > 0);

  const totalPaidOrders = periodData.reduce((total, item) => {
    return total + item.orderCount;
  }, 0);

  if (activeHours.length === 0) {
    return {
      totalPaidOrders: 0,
      busiestHour: "--",
      busiestCount: 0,
      quietestHour: "--",
      quietestCount: 0,
      activeHours: 0
    };
  }

  const busiest = [...activeHours].sort((a, b) => {
    if (b.orderCount !== a.orderCount) {
      return b.orderCount - a.orderCount;
    }

    return a.hour - b.hour;
  })[0];

  const quietest = [...activeHours].sort((a, b) => {
    if (a.orderCount !== b.orderCount) {
      return a.orderCount - b.orderCount;
    }

    return a.hour - b.hour;
  })[0];

  return {
    totalPaidOrders,
    busiestHour: formatHourRange(busiest.hour),
    busiestCount: busiest.orderCount,
    quietestHour: formatHourRange(quietest.hour),
    quietestCount: quietest.orderCount,
    activeHours: activeHours.length
  };
}

function renderPeakHoursControls() {
  return `
    <section class="peak-hours-controls" aria-label="Peak hours report controls">

      <section class="peak-control-group">
        <label for="peak-hours-period">Time Period</label>
        <select id="peak-hours-period">
          <option value="all" ${PEAK_HOURS_STATE.period === "all" ? "selected" : ""}>Full day</option>
          <option value="morning" ${PEAK_HOURS_STATE.period === "morning" ? "selected" : ""}>Morning: 06:00 - 12:00</option>
          <option value="afternoon" ${PEAK_HOURS_STATE.period === "afternoon" ? "selected" : ""}>Afternoon: 12:00 - 17:00</option>
          <option value="evening" ${PEAK_HOURS_STATE.period === "evening" ? "selected" : ""}>Evening: 17:00 - 22:00</option>
          <option value="night" ${PEAK_HOURS_STATE.period === "night" ? "selected" : ""}>Night: 22:00 - 06:00</option>
        </select>
      </section>

      <section class="peak-control-group">
        <label for="peak-hours-limit">Rows Shown</label>
        <select id="peak-hours-limit">
          <option value="top5" ${PEAK_HOURS_STATE.displayLimit === "top5" ? "selected" : ""}>Top 5 hours</option>
          <option value="top10" ${PEAK_HOURS_STATE.displayLimit === "top10" ? "selected" : ""}>Top 10 hours</option>
          <option value="all24" ${PEAK_HOURS_STATE.displayLimit === "all24" ? "selected" : ""}>All hours</option>
        </select>
      </section>

      <section class="peak-control-group">
        <label for="peak-hours-sort">Sort By</label>
        <select id="peak-hours-sort">
          <option value="busiest" ${PEAK_HOURS_STATE.sortMode === "busiest" ? "selected" : ""}>Busiest first</option>
          <option value="chronological" ${PEAK_HOURS_STATE.sortMode === "chronological" ? "selected" : ""}>Time order</option>
        </select>
      </section>

      <section class="peak-control-group">
        <label for="peak-hours-view">View</label>
        <select id="peak-hours-view">
          <option value="both" ${PEAK_HOURS_STATE.viewMode === "both" ? "selected" : ""}>Chart and table</option>
          <option value="chart" ${PEAK_HOURS_STATE.viewMode === "chart" ? "selected" : ""}>Chart only</option>
          <option value="table" ${PEAK_HOURS_STATE.viewMode === "table" ? "selected" : ""}>Table only</option>
        </select>
      </section>

      <button type="button" class="peak-refresh-btn" id="peak-hours-refresh">
        Refresh
      </button>

    </section>
  `;
}

function renderPeakHoursSummary(hourData) {
  const summary = getPeakHoursSummary(hourData);
  const periodName = getPeriodName(PEAK_HOURS_STATE.period);

  return `
    <section class="peak-summary-grid" aria-label="Peak hours summary">

      <article class="peak-summary-card featured">
        <p class="peak-summary-label">Busiest Hour</p>
        <p class="peak-summary-value">${summary.busiestHour}</p>
        <p class="peak-summary-note">
          ${summary.busiestCount} paid order${summary.busiestCount === 1 ? "" : "s"}
        </p>
      </article>

      <article class="peak-summary-card">
        <p class="peak-summary-label">Paid Orders</p>
        <p class="peak-summary-value">${summary.totalPaidOrders}</p>
        <p class="peak-summary-note">${periodName} total</p>
      </article>

      <article class="peak-summary-card">
        <p class="peak-summary-label">Quietest Active Hour</p>
        <p class="peak-summary-value">${summary.quietestHour}</p>
        <p class="peak-summary-note">
          ${summary.quietestCount} paid order${summary.quietestCount === 1 ? "" : "s"}
        </p>
      </article>

      <article class="peak-summary-card">
        <p class="peak-summary-label">Active Hours</p>
        <p class="peak-summary-value">${summary.activeHours}</p>
        <p class="peak-summary-note">Hour slots with paid orders</p>
      </article>

    </section>
  `;
}

function renderPeakHoursInsight(hourData) {
  const summary = getPeakHoursSummary(hourData);
  const periodName = getPeriodName(PEAK_HOURS_STATE.period);

  if (summary.totalPaidOrders === 0) {
    return "";
  }

  return `
    <section class="peak-insight-card">
      <h4>Ordering Insight</h4>
      <p>
        During the selected <strong>${periodName}</strong> period, the busiest order time is
        <strong>${summary.busiestHour}</strong> with
        <strong>${summary.busiestCount}</strong> paid order${summary.busiestCount === 1 ? "" : "s"}.
        This can help admins identify when vendors may need to prepare for higher demand.
      </p>
    </section>
  `;
}

function renderPeakHoursChart(displayData, maxOrderCount) {
  if (!displayData || displayData.length === 0) {
    return "";
  }

  const chartRows = displayData.map(item => {
    const timeRange = formatHourRange(item.hour);

    const widthPercentage = maxOrderCount > 0
      ? Math.max((item.orderCount / maxOrderCount) * 100, item.orderCount > 0 ? 6 : 0)
      : 0;

    const busiestClass = item.orderCount === maxOrderCount && maxOrderCount > 0
      ? "busiest-hour"
      : "";

    return `
      <section class="peak-chart-row ${busiestClass}">
        <span class="peak-chart-time">${timeRange}</span>

        <section class="peak-chart-track" aria-hidden="true">
          <span class="peak-chart-bar" style="width: ${widthPercentage}%"></span>
        </section>

        <span class="peak-chart-value">
          ${item.orderCount} order${item.orderCount === 1 ? "" : "s"}
        </span>
      </section>
    `;
  }).join("");

  return `
    <section class="peak-hours-chart" aria-label="Peak ordering hours bar chart">
      <h3 class="peak-chart-title">Order Volume by Hour</h3>
      ${chartRows}
    </section>
  `;
}

function renderPeakHoursTableOnly(displayData, maxOrderCount) {
  if (!displayData || displayData.length === 0) {
    return "";
  }

  const rows = displayData.map(item => {
    const timeRange = formatHourRange(item.hour);

    const busiestClass = item.orderCount === maxOrderCount && maxOrderCount > 0
      ? "busiest-hour"
      : "";

    const busiestBadge = busiestClass
      ? `<span class="peak-badge">Busiest</span>`
      : "";

    return `
      <tr class="${busiestClass}">
        <td>${timeRange}${busiestBadge}</td>
        <td>${item.orderCount}</td>
      </tr>
    `;
  }).join("");

  return `
    <section class="peak-table-card">
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
    </section>
  `;
}

function attachPeakHoursControlEvents() {
  const periodSelect = document.getElementById("peak-hours-period");
  const limitSelect = document.getElementById("peak-hours-limit");
  const sortSelect = document.getElementById("peak-hours-sort");
  const viewSelect = document.getElementById("peak-hours-view");
  const refreshButton = document.getElementById("peak-hours-refresh");

  if (periodSelect) {
    periodSelect.addEventListener("change", event => {
      PEAK_HOURS_STATE.period = event.target.value;
      renderPeakHoursTable(PEAK_HOURS_STATE.peakHoursData);
    });
  }

  if (limitSelect) {
    limitSelect.addEventListener("change", event => {
      PEAK_HOURS_STATE.displayLimit = event.target.value;
      renderPeakHoursTable(PEAK_HOURS_STATE.peakHoursData);
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", event => {
      PEAK_HOURS_STATE.sortMode = event.target.value;
      renderPeakHoursTable(PEAK_HOURS_STATE.peakHoursData);
    });
  }

  if (viewSelect) {
    viewSelect.addEventListener("change", event => {
      PEAK_HOURS_STATE.viewMode = event.target.value;
      renderPeakHoursTable(PEAK_HOURS_STATE.peakHoursData);
    });
  }

  if (refreshButton) {
    refreshButton.addEventListener("click", () => {
      initPeakHoursReport();
    });
  }
}

function renderPeakHoursTable(hourData) {
  const peakOutput = document.getElementById("peak-hours-output");

  if (!peakOutput) {
    console.error("peak-hours-output element not found.");
    return;
  }

  if (!hourData || hourData.length === 0) {
    peakOutput.innerHTML = `
      <section class="peak-state-card">
        <h3>No Peak Hours Data</h3>
        <p>No paid orders were found for the peak hours report.</p>
      </section>
    `;

    return;
  }

  const displayData = getFilteredPeakHoursData(hourData);
  const currentPeriodData = getCurrentPeriodData(hourData);
  const maxOrderCount = Math.max(...currentPeriodData.map(item => item.orderCount), 0);

  if (!displayData || displayData.length === 0) {
    peakOutput.innerHTML = `
      <section class="peak-hours-panel">

        <header class="peak-hours-header">
          <section class="peak-hours-heading">
            <h3>Peak Ordering Hours</h3>
            <p>
              Filter paid orders by time period and choose how the report should be displayed.
            </p>
          </section>

          <span class="peak-report-tag">Admin Report</span>
        </header>

        ${renderPeakHoursControls()}

        <section class="peak-state-card">
          <h3>No Orders in This Filter</h3>
          <p>No paid orders match the selected time period. Try choosing another time period.</p>
        </section>

      </section>
    `;

    attachPeakHoursControlEvents();
    return;
  }

  const shouldShowChart =
    PEAK_HOURS_STATE.viewMode === "chart" ||
    PEAK_HOURS_STATE.viewMode === "both";

  const shouldShowTable =
    PEAK_HOURS_STATE.viewMode === "table" ||
    PEAK_HOURS_STATE.viewMode === "both";

  peakOutput.innerHTML = `
    <section class="peak-hours-panel">

      <header class="peak-hours-header">
        <section class="peak-hours-heading">
          <h3>Peak Ordering Hours</h3>
          <p>
            This report shows when paid orders are most common, using South African time.
          </p>
        </section>

        <span class="peak-report-tag">Admin Report</span>
      </header>

      ${renderPeakHoursControls()}

      ${renderPeakHoursSummary(hourData)}

      ${renderPeakHoursInsight(hourData)}

      ${shouldShowChart ? renderPeakHoursChart(displayData, maxOrderCount) : ""}

      ${shouldShowTable ? renderPeakHoursTableOnly(displayData, maxOrderCount) : ""}

    </section>
  `;

  attachPeakHoursControlEvents();
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

    PEAK_HOURS_STATE.rawOrders = orders;
    PEAK_HOURS_STATE.peakHoursData = processPeakHours(orders);

    renderPeakHoursTable(PEAK_HOURS_STATE.peakHoursData);
  } catch (error) {
    console.error("Error initializing peak hours report:", error);

    if (peakOutput) {
      peakOutput.innerHTML = `
        <section class="peak-state-card error">
          <h3>Error Loading Peak Hours</h3>
          <p>Peak hours data could not be loaded. Please try again later.</p>
        </section>
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