window.addEventListener("load", async()=>{
    const summaryNumbers = document.querySelectorAll(".summary-number");

    const salesReportOutput = document.getElementById("sales-report-output");
    const peakHoursOutput = document.getElementById("peak-hours-output");
    const customViewOutput = document.getElementById("custom-view-output");
    const exportOutput = document.getElementById("export-output");

    try{
        showLoadingState();

        const response = await fetch('https://campus-food-ordering.pages.dev/api/analytics');

        if(!response.ok){
            throw new Error("Failed to fetch analytics data");
        }

        const result = await response.json();
        const orders = result.data;
        if(!orders || orders.length === 0){
            showEmptyState();
            return;
        }

        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((total, order) => {
            return total + order.order_total;
        }, 0);

        const activeVendors = new Set(
            orders.map(order => order.vendor_name)
        ).size;

        const hourCounts = {};
        orders.forEach(order => {
            const hour = order.order_hour;
            if (hour !== null) {
                hourCounts[hour] = (hourCounts[hour] || 0) + 1;
            }
        });

        let peakHour = null;
        let highestCount = 0;

        for (const hour in hourCounts) {
            if (hourCounts[hour] > highestCount) {
                highestCount = hourCounts[hour];
                peakHour = hour;
            }
        }
        const analyticsData = {
            totalOrders,
            totalRevenue: `R${totalRevenue.toFixed(2)}`,
            peakHour: `${peakHour}:00`,
            activeVendors
        };

        updateSummaryCards(analyticsData);
        showDashboardReadyState();
    }

    catch(error){
        console.error("Analytics dashboard failed to load:", error);
        showErrorState();
    }

    function updateSummaryCards(data){
        summaryNumbers[0].textContent = data.totalOrders;
        summaryNumbers[1].textContent = data.totalRevenue;
        summaryNumbers[2].textContent = data.peakHour;
        summaryNumbers[3].textContent = data.activeVendors;
    }

    function showLoadingState(){
        salesReportOutput.innerHTML = `
            <p class="loading-message">Loading sales analytics...</p>
        `;
        peakHoursOutput.innerHTML = `
            <p class="loading-message">Loading peak ordering data...</p>
        `;
        customViewOutput.innerHTML = `
            <p class="loading-message">Loading custom analytics...</p>
        `;
        exportOutput.innerHTML = `
            <p class="loading-message">Loading export tools...</p>
        `;
    }

function showDashboardReadyState(){

  // Sales Report Card

    peakHoursOutput.innerHTML = `
        <section class="analytics-highlight">

            <h3>Most Active Ordering Time</h3>

            <p class="highlight-hour">${summaryNumbers[2].textContent}</p>

            <span>Highest student ordering activity detected.</span>

        </section>
    `;

    customViewOutput.innerHTML = `
        <section class="empty-state">

            <h3>No Custom Filters Applied</h3>

            <p>Select filters to generate custom analytics reports.</p>

        </section>
    `;

    exportOutput.innerHTML = `
        <section class="export-actions">

            <button class="export-btn">Export CSV</button>
            <button class="export-btn">Export PDF</button>

        </section>
    `;
}

    function showEmptyState(){
        salesReportOutput.innerHTML = `
            <p class="loading-message">No analytics data available.</p>
        `;
        peakHoursOutput.innerHTML = `
            <p class="loading-message">No peak hours data available.</p>
        `;
        customViewOutput.innerHTML = `
            <p class="loading-message">No custom analytics available.</p>
        `;
        exportOutput.innerHTML = `
            <p class="loading-message">No export data available.</p>
        `;
    }

    function showErrorState() {

        salesReportOutput.innerHTML = `
            <p class="error-message">Failed to load sales analytics.</p>
        `;
        peakHoursOutput.innerHTML = `
            <p class="error-message">Failed to load peak hours analytics.</p>
        `;
        customViewOutput.innerHTML = `
            <p class="error-message">Failed to load custom analytics.</p>
        `;
        exportOutput.innerHTML = `
            <p class="error-message">Failed to load export tools.</p>
        `;
    }

});