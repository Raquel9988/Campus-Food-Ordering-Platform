window.addEventListener("load", async()=>{
    const summaryNumbers = document.querySelectorAll(".summary-number");

    const salesReportOutput = document.getElementById("sales-report-output");
    const peakHoursOutput = document.getElementById("peak-hours-output");
    const customViewOutput = document.getElementById("custom-view-output");
    const exportOutput = document.getElementById("export-output");

    try{
        showLoadingState();

        await simulateLoading();

        //Mock Analytics Data
        const analyticsData = {
            totalOrders: 124,
            totalRevenue: "R12,230",
            peakHour: "13:00-14:00",
            activeVendors: 12
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

    salesReportOutput.innerHTML = `
        <table class="analytics-table">

            <thead>
                <tr>
                    <th>Vendor</th>
                    <th>Total Sales</th>
                    <th>Status</th>
                </tr>
            </thead>

            <tbody>
                <tr>
                    <td>Campus Grill</td>
                    <td>R5,400</td>
                    <td>
                        <span class="status-badge success">Active</span>
                    </td>
                </tr>

                <tr>
                    <td>Burger Spot</td>
                    <td>R3,850</td>
                    <td>
                        <span class="status-badge success">Active</span>
                    </td>
                </tr>

                <tr>
                    <td>Pizza Hub</td>
                    <td>R2,980</td>
                    <td>
                        <span class="status-badge warning">Low Orders</span>
                    </td>
                </tr>
            </tbody>

        </table>
    `;

    peakHoursOutput.innerHTML = `
        <section class="analytics-highlight">

            <h3>Most Active Ordering Time</h3>

            <p class="highlight-hour">13:00-14:00</p>

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

    function showErrorState(){
        salesReportOutput.innerHTML = `
            <p class="error-message">Failed to load sales analytics</p>
        `;
        peakHoursOutput.innerHTML = `
            <p class="error-message">Failed to load peak hours analytics</p>
        `;
        customViewOutput.innerHTML = `
            <p class="error-message">Failed to load custom analytics</p>
        `;
        exportOutput.innerHTML = `
            <p class="error-message">Failed to load export tools</p>
        `;
    }

    function simulateLoading(){
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, 1500);
        });
    }
});