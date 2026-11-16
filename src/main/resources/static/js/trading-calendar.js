
document.addEventListener("DOMContentLoaded", function () {

    const API_URL = "/api/trades";

    const calendarGrid = document.getElementById("calendarGrid");
    const currentMonthLabel = document.getElementById("currentMonth");
    const previousMonthButton = document.getElementById("previousMonth");
    const nextMonthButton = document.getElementById("nextMonth");

    let allTrades = [];

    let currentDate = new Date();
    let currentYear = currentDate.getFullYear();
    let currentMonth = currentDate.getMonth();

    // FETCH TRADES
    async function fetchTrades() {

        try {
            const response = await fetch(API_URL);

            if (!response.ok) {
                throw new Error("Unable to fetch trades");
            }

            allTrades = await response.json();

            renderCalendar();

        } catch (error) {
            console.error("Error loading calendar trades:", error);
            calendarGrid.innerHTML = "<p>Unable to load trading data.</p>";
        }
    }

    // CALCULATE DAILY PERFORMANCE
    function calculateDailyPerformance() {

        const dailyPerformance = {};

        const closedTrades = allTrades.filter(trade =>
            trade.profitLoss !== null &&
            trade.profitLoss !== undefined
        );

        closedTrades.forEach(trade => {

            const tradeDate = trade.exitTime || trade.entryTime;

            if (!tradeDate) return;

            const dateKey = tradeDate.substring(0, 10);

            if (!dailyPerformance[dateKey]) {
                dailyPerformance[dateKey] = {
                    trades: 0,
                    wins: 0,
                    losses: 0,
                    pnl: 0
                };
            }

            const day = dailyPerformance[dateKey];
            const pnl = Number(trade.profitLoss);

            day.trades++;
            day.pnl += pnl;

            if (pnl > 0) {
                day.wins++;
            } else if (pnl < 0) {
                day.losses++;
            }
        });

        Object.values(dailyPerformance).forEach(day => {
            day.winRate = day.trades > 0
                ? (day.wins / day.trades) * 100
                : 0;
        });

        return dailyPerformance;
    }

    // ==============================
// MONTHLY PERFORMANCE SUMMARY
// ==============================

    function updateMonthlySummary(dailyPerformance) {

        let monthlyPnl = 0;
        let totalTrades = 0;
        let totalWins = 0;
        let winningDays = 0;

        const monthPrefix =
            `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;

        Object.entries(dailyPerformance).forEach(([date, day]) => {

            if (!date.startsWith(monthPrefix)) return;

            monthlyPnl += day.pnl;
            totalTrades += day.trades;
            totalWins += day.wins;

            if (day.pnl > 0) {
                winningDays++;
            }
        });

        const winRate = totalTrades > 0
            ? (totalWins / totalTrades) * 100
            : 0;

        document.getElementById("monthlyTotalPnl").textContent =
            `${monthlyPnl >= 0 ? "+" : "-"}$${Math.abs(monthlyPnl).toFixed(2)}`;

        document.getElementById("monthlyTotalPnl").style.color =
            monthlyPnl >= 0 ? "#22c55e" : "#ef4444";

        document.getElementById("monthlyTotalTrades").textContent =
            totalTrades;

        document.getElementById("monthlyWinRate").textContent =
            `${winRate.toFixed(2)}%`;

        document.getElementById("monthlyWinningDays").textContent =
            winningDays;
    }

    // RENDER CALENDAR
    function renderCalendar() {

        calendarGrid.innerHTML = "";

        const dailyPerformance = calculateDailyPerformance();
        updateMonthlySummary(dailyPerformance);

        const firstDay = new Date(
            currentYear,
            currentMonth,
            1
        ).getDay();

        const daysInMonth = new Date(
            currentYear,
            currentMonth + 1,
            0
        ).getDate();

        const monthName = new Date(
            currentYear,
            currentMonth
        ).toLocaleString("en-US", {
            month: "long"
        });

        currentMonthLabel.textContent =
            `${monthName} ${currentYear}`;

        // EMPTY CELLS BEFORE FIRST DATE
        for (let i = 0; i < firstDay; i++) {

            const emptyDay = document.createElement("div");

            emptyDay.className = "calendar-day empty";

            calendarGrid.appendChild(emptyDay);
        }

        // GENERATE CALENDAR DAYS
        for (let day = 1; day <= daysInMonth; day++) {

            const dateKey =
                `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

            const performance = dailyPerformance[dateKey];

            const dayElement = document.createElement("div");

            dayElement.className = "calendar-day";

            if (performance) {

                if (performance.pnl > 0) {
                    dayElement.classList.add("profit");
                } else if (performance.pnl < 0) {
                    dayElement.classList.add("loss");
                } else {
                    dayElement.classList.add("break-even");
                }

                dayElement.innerHTML = `
                    <span class="calendar-day-number">${day}</span>

                    <span class="calendar-day-pnl">
                        ${performance.pnl >= 0 ? "+" : "-"}$${Math.abs(performance.pnl).toFixed(2)}
                    </span>

                    <span class="calendar-day-winrate">
                        ${performance.winRate.toFixed(1)}% Win
                    </span>
                `;

            } else {

                dayElement.innerHTML = `
                    <span class="calendar-day-number">${day}</span>
                `;
            }

            calendarGrid.appendChild(dayElement);
        }

        // EMPTY CELLS AFTER LAST DATE
        const totalCells = firstDay + daysInMonth;
        const remainingCells = (7 - (totalCells % 7)) % 7;

        for (let i = 0; i < remainingCells; i++) {

            const emptyDay = document.createElement("div");

            emptyDay.className = "calendar-day empty";

            calendarGrid.appendChild(emptyDay);
        }
    }

    // PREVIOUS MONTH
    previousMonthButton.addEventListener("click", function () {

        currentMonth--;

        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }

        renderCalendar();
    });

    // NEXT MONTH
    nextMonthButton.addEventListener("click", function () {

        currentMonth++;

        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }

        renderCalendar();
    });

    // INITIAL LOAD
    fetchTrades();

});
