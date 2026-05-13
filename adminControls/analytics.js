window.addEventListener("load", async()=>{
    const summaryNumbers = document.querySelectorAll(".summary-number");

    const salesReportOutput = document.getElementById("sales-report-output");
    const peakHoursOutput = document.getElementById("peak-hours-output");
    const customViewOutput = document.getElementById("custom-view-output");
    const exportOutput = document.getElementById("export-output");

    try{
        showLoadingState();

        await simulateLoading();

        /*//Mock Analytics Data
        const analyticsData = {
            totalOrders: 124,
            totalRevenue: "R18,450",
            peakHour: "13:00 - 14:00",
            activeVendors: 12
        };*/
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
            <p>Sales analytics module connected successfully</p>
        `;
        peakHoursOutput.innerHTML = `
            <p>Peak ordering hours module connected successfully</p>
        `;
        customViewOutput.innerHTML = `
            <p>Custom analytics module connected successfully</p>
        `;
        exportOutput.innerHTML = `
            <p>Export reporting tools connected successfully</p>
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