import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://sqbscxfolbckikrzxqhr.supabase.co";
const supabaseKey = "sb_publishable_Zw_iCK1n54xXGPuDWALWQQ_k2cOQWay";
const supabase = createClient(supabaseUrl, supabaseKey);

const ANALYTICS_API_URL = "https://campus-food-ordering.pages.dev/api/analytics";

window.addEventListener("load", initAnalyticsDashboard);

async function initAnalyticsDashboard() {
  const elements = getDashboardElements();

  if (!elements.hasRequiredElements) {
    console.error("Analytics dashboard is missing one or more required elements.");
    return;
  }

  setupNavigationHighlighting();

  const hasAccess = await checkAnalyticsAccess();

  if (!hasAccess) {
    showAccessDeniedState(elements);

    setTimeout(() => {
      window.location.href = "../auth/login.html";
    }, 1500);

    return;
  }

  try {
    showLoadingState(elements);

    const orders = await fetchAnalyticsOrders();

    if (!orders || orders.length === 0) {
      window.analyticsOrders = [];

      updateSummaryCards({
        totalOrders: 0,
        totalRevenue: "R0.00",
        peakHour: "N/A",
        activeVendors: 0
      });

      showEmptyState(elements);
      return;
    }

    window.analyticsOrders = orders;

    const analyticsData = calculateDashboardSummary(orders);

    updateSummaryCards(analyticsData);
    showDashboardReadyState(elements);
  } catch (error) {
    console.error("Analytics dashboard failed to load:", error);
    showErrorState(elements);
  }
}

function getDashboardElements() {
  const salesReportOutput = document.getElementById("sales-report-output");
  const peakHoursOutput = document.getElementById("peak-hours-output");
  const customViewOutput = document.getElementById("custom-view-output");
  const exportOutput = document.getElementById("export-output");

  return {
    salesReportOutput,
    peakHoursOutput,
    customViewOutput,
    exportOutput,
    hasRequiredElements:
      Boolean(salesReportOutput) &&
      Boolean(peakHoursOutput) &&
      Boolean(customViewOutput) &&
      Boolean(exportOutput)
  };
}

async function checkAnalyticsAccess() {
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return false;
  }

  const { data: appUser, error: userError } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", authData.user.id)
    .single();

  if (userError || !appUser) {
    return false;
  }

  if (appUser.role !== "admin") {
    return false;
  }

  const { data: adminProfile, error: adminError } = await supabase
    .from("admins")
    .select("id, user_id, status, is_master")
    .eq("user_id", authData.user.id)
    .single();

  if (adminError || !adminProfile) {
    return false;
  }

  return adminProfile.status === "approved";
}

async function fetchAnalyticsOrders() {
  const response = await fetch(ANALYTICS_API_URL);

  if (!response.ok) {
    throw new Error("Failed to fetch analytics data.");
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.message || "Analytics API returned an error.");
  }

  return result.data || [];
}

function calculateDashboardSummary(orders) {
  const totalOrders = orders.length;

  const totalRevenue = orders.reduce((total, order) => {
    return total + Number(order.order_total || 0);
  }, 0);

  const activeVendors = new Set(
    orders.map(order => order.vendor_name).filter(Boolean)
  ).size;

  const hourCounts = {};

  orders.forEach(order => {
    const hour = getOrderHour(order);

    if (hour !== null && hour !== undefined && !Number.isNaN(hour)) {
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }
  });

  const peakHour = getPeakHour(hourCounts);

  return {
    totalOrders,
    totalRevenue: formatRevenue(totalRevenue),
    peakHour: peakHour === null ? "N/A" : `${String(peakHour).padStart(2, "0")}:00`,
    activeVendors
  };
}

function getOrderHour(order) {
  if (order.order_hour !== null && order.order_hour !== undefined) {
    return Number(order.order_hour);
  }

  const timestamp =
    order.created_at ||
    order.order_created_at ||
    order.createdAt ||
    order.timestamp;

  if (!timestamp) {
    return null;
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
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

  const hour = Number(hourPart.value);

  if (hour === 24) {
    return 0;
  }

  return hour;
}

function getPeakHour(hourCounts) {
  let peakHour = null;
  let highestCount = 0;

  Object.entries(hourCounts).forEach(([hour, count]) => {
    if (count > highestCount) {
      highestCount = count;
      peakHour = Number(hour);
    }
  });

  return peakHour;
}

function formatRevenue(value) {
  return `R${Number(value || 0).toFixed(2)}`;
}

function updateSummaryCards(data) {
  setSummaryValue("total-orders", 0, data.totalOrders);
  setSummaryValue("total-revenue", 1, data.totalRevenue);
  setSummaryValue("peak-hour", 2, data.peakHour);
  setSummaryValue("active-vendors", 3, data.activeVendors);
}

function setSummaryValue(summaryName, fallbackIndex, value) {
  const dataSummaryElement = document.querySelector(`[data-summary="${summaryName}"]`);

  if (dataSummaryElement) {
    dataSummaryElement.textContent = value;
    return;
  }

  const summaryNumbers = document.querySelectorAll(".summary-number");

  if (summaryNumbers[fallbackIndex]) {
    summaryNumbers[fallbackIndex].textContent = value;
  }
}

function showLoadingState(elements) {
  elements.salesReportOutput.innerHTML = `
    <p class="loading-message">Loading sales analytics...</p>
  `;

  elements.peakHoursOutput.innerHTML = `
    <p class="loading-message">Loading peak ordering data...</p>
  `;

  elements.customViewOutput.innerHTML = `
    <p class="loading-message">Loading custom analytics...</p>
  `;

  elements.exportOutput.innerHTML = `
    <p class="loading-message">Loading export tools...</p>
  `;
}

function showDashboardReadyState(elements) {
  if (typeof window.initSalesReport === "function") {
    window.initSalesReport();
  } else {
    console.error("Sales report module not loaded.");

    elements.salesReportOutput.innerHTML = `
      <p class="error-message">Error loading sales report.</p>
    `;
  }

  if (typeof window.initPeakHoursReport === "function") {
    window.initPeakHoursReport();
  } else {
    console.error("Peak hours report module not loaded.");

    elements.peakHoursOutput.innerHTML = `
      <p class="error-message">Error loading peak hours report.</p>
    `;
  }

  if (typeof window.initCustomView === "function") {
    window.initCustomView();
  } else {
    console.error("Custom view module not loaded.");

    elements.customViewOutput.innerHTML = `
      <p class="error-message">Error loading custom analytics view.</p>
    `;
  }

  if (typeof window.initExportReports === "function") {
    window.initExportReports();
  } else {
    console.error("Export reports module not loaded.");

    elements.exportOutput.innerHTML = `
      <p class="error-message">Error loading export reports.</p>
    `;
  }
}

function showEmptyState(elements) {
  const emptyMessage = `
    <section class="dashboard-state-message">
      <h3>No Analytics Data Available</h3>
      <p>There are currently no orders available for analytics reporting.</p>
    </section>
  `;

  elements.salesReportOutput.innerHTML = emptyMessage;
  elements.peakHoursOutput.innerHTML = emptyMessage;
  elements.customViewOutput.innerHTML = emptyMessage;
  elements.exportOutput.innerHTML = emptyMessage;
}

function showErrorState(elements) {
  elements.salesReportOutput.innerHTML = `
    <p class="error-message">Failed to load sales analytics.</p>
  `;

  elements.peakHoursOutput.innerHTML = `
    <p class="error-message">Failed to load peak hours analytics.</p>
  `;

  elements.customViewOutput.innerHTML = `
    <p class="error-message">Failed to load custom analytics.</p>
  `;

  elements.exportOutput.innerHTML = `
    <p class="error-message">Failed to load export tools.</p>
  `;
}

function showAccessDeniedState(elements) {
  const accessDeniedMessage = `
    <section class="dashboard-state-message error-message">
      <h3>Access Denied</h3>
      <p>Only approved administrators can view the analytics dashboard.</p>
    </section>
  `;

  elements.salesReportOutput.innerHTML = accessDeniedMessage;
  elements.peakHoursOutput.innerHTML = accessDeniedMessage;
  elements.customViewOutput.innerHTML = accessDeniedMessage;
  elements.exportOutput.innerHTML = accessDeniedMessage;
}

function setupNavigationHighlighting() {
  const navItems = document.querySelectorAll(".nav-item");
  const reportSections = document.querySelectorAll(".report-card");

  if (!navItems.length || !reportSections.length) {
    return;
  }

  navItems.forEach(item => {
    item.addEventListener("click", () => {
      navItems.forEach(navItem => {
        navItem.classList.remove("active");
      });

      item.classList.add("active");
    });
  });

  window.addEventListener("scroll", () => {
    let currentSectionId = "";

    reportSections.forEach(section => {
      const sectionTop = section.offsetTop - 140;

      if (window.scrollY >= sectionTop) {
        currentSectionId = section.id;
      }
    });

    if (!currentSectionId) {
      return;
    }

    navItems.forEach(item => {
      const href = item.getAttribute("href");

      if (href === `#${currentSectionId}`) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });
  });
}