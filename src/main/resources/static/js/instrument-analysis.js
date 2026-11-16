document.addEventListener("DOMContentLoaded", function () {

    const API_URL = "/api/trades";

    let allTrades = [];

    let instrumentPerformanceChart = null;

    let instrumentWinLossChart = null;

    // ==============================
    // FETCH TRADES
    // ==============================

    async function fetchTrades() {

        try {

            const response = await fetch(API_URL);

            if (!response.ok) {
                throw new Error("Unable to fetch trades");
            }

            allTrades = await response.json();

            populateInstrumentFilter();

            applyFilters();

        } catch (error) {

            console.error("Error loading instrument analysis:", error);

        }
    }


    // ==============================
    // POPULATE INSTRUMENT FILTER
    // ==============================

    function populateInstrumentFilter() {

        const instrumentFilter = document.getElementById("instrumentFilter");

        const instruments = [
            ...new Set(
                allTrades
                    .map(trade => trade.instrument)
                    .filter(Boolean)
            )
        ].sort();

        instrumentFilter.innerHTML = `<option value="">All Instruments</option>`;

        instruments.forEach(instrument => {

            const option = document.createElement("option");

            option.value = instrument;
            option.textContent = instrument;

            instrumentFilter.appendChild(option);

        });
    }


    // ==============================
    // APPLY FILTERS
    // ==============================

    function applyFilters() {

        const selectedInstrument =
            document.getElementById("instrumentFilter").value;

        const selectedDirection =
            document.getElementById("directionFilter").value;

        const startDate =
            document.getElementById("startDate").value;

        const endDate =
            document.getElementById("endDate").value;

        const filteredTrades = allTrades.filter(trade => {

            const instrumentMatch =
                !selectedInstrument ||
                trade.instrument === selectedInstrument;

            const directionMatch =
                !selectedDirection ||
                trade.direction === selectedDirection;

            const tradeDate = trade.entryTime
                ? trade.entryTime.substring(0, 10)
                : "";

            const startDateMatch =
                !startDate || (tradeDate && tradeDate >= startDate);

            const endDateMatch =
                !endDate || (tradeDate && tradeDate <= endDate);

            return instrumentMatch &&
                directionMatch &&
                startDateMatch &&
                endDateMatch;

        });

        calculateInstrumentMetrics(filteredTrades);
        renderInstrumentPerformanceTrend(filteredTrades);
        renderInstrumentWinLossDistribution(filteredTrades);
        calculateInstrumentSetupPerformance(filteredTrades);
        calculateDetailedInstrumentPerformance(filteredTrades);
    }


    // ==============================
    // CALCULATE INSTRUMENT METRICS
    // ==============================

    function calculateInstrumentMetrics(trades) {

        const closedTrades = trades.filter(trade =>
            trade.profitLoss !== null &&
            trade.profitLoss !== undefined
        );

        const winners = closedTrades.filter(trade =>
            Number(trade.profitLoss) > 0
        );

        const losers = closedTrades.filter(trade =>
            Number(trade.profitLoss) < 0
        );

        const netPnl = closedTrades.reduce((total, trade) =>
            total + Number(trade.profitLoss), 0
        );

        const grossProfit = winners.reduce((total, trade) =>
            total + Number(trade.profitLoss), 0
        );

        const grossLoss = Math.abs(losers.reduce((total, trade) =>
            total + Number(trade.profitLoss), 0
        ));

        const winRate = closedTrades.length
            ? (winners.length / closedTrades.length) * 100
            : 0;

        const profitFactor = grossLoss > 0
            ? grossProfit / grossLoss
            : null;

        const rrTrades = closedTrades.filter(trade =>
            trade.riskReward !== null &&
            trade.riskReward !== undefined
        );

        const averageRR = rrTrades.length
            ? rrTrades.reduce((total, trade) =>
            total + Number(trade.riskReward), 0
        ) / rrTrades.length
            : null;

        const averageWinner = winners.length
            ? grossProfit / winners.length
            : null;

        const averageLoser = losers.length
            ? grossLoss / losers.length
            : null;

        // Update KPI cards

        document.getElementById("totalTrades").textContent =
            closedTrades.length;

        document.getElementById("winRate").textContent =
            winRate.toFixed(2) + "%";

        document.getElementById("netPnl").textContent =
            (netPnl < 0 ? "-$" : "$") + Math.abs(netPnl).toFixed(2);

        document.getElementById("profitFactor").textContent =
            profitFactor !== null ? profitFactor.toFixed(2) : "—";

        document.getElementById("averageRR").textContent =
            averageRR !== null ? averageRR.toFixed(2) : "—";

        document.getElementById("averageWinner").textContent =
            averageWinner !== null ? "$" + averageWinner.toFixed(2) : "—";

        document.getElementById("averageLoser").textContent =
            averageLoser !== null ? "$" + averageLoser.toFixed(2) : "—";

        document.getElementById("winningTrades").textContent =
            winners.length;
    }



    // ==============================
// INSTRUMENT PERFORMANCE TREND
// ==============================

    function renderInstrumentPerformanceTrend(trades) {

        const closedTrades = trades.filter(trade =>
            trade.profitLoss !== null &&
            trade.profitLoss !== undefined &&
            (trade.exitTime || trade.entryTime)
        );

        const dates = [
            ...new Set(
                closedTrades.map(trade =>
                    (trade.exitTime || trade.entryTime).substring(0, 10)
                )
            )
        ].sort();

        const instruments = [
            ...new Set(closedTrades.map(trade => trade.instrument))
        ].sort();

        const datasets = instruments.map(instrument => {

            let cumulativePnl = 0;

            const data = dates.map(date => {

                const dailyTrades = closedTrades.filter(trade =>
                    trade.instrument === instrument &&
                    (trade.exitTime || trade.entryTime).substring(0, 10) === date
                );

                const dailyPnl = dailyTrades.reduce((total, trade) =>
                    total + Number(trade.profitLoss), 0
                );

                cumulativePnl += dailyPnl;

                return cumulativePnl;
            });

            return {
                label: instrument,
                data: data,
                tension: 0.3,
                fill: false,
                pointRadius: 3,
                pointHoverRadius: 6
            };
        });

        const ctx = document
            .getElementById("instrumentPerformanceTrend")
            .getContext("2d");

        if (instrumentPerformanceChart) {
            instrumentPerformanceChart.destroy();
        }

        instrumentPerformanceChart = new Chart(ctx, {
            type: "line",

            data: {
                labels: dates,
                datasets: datasets
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,

                interaction: {
                    intersect: false,
                    mode: "index"
                },

                plugins: {
                    legend: {
                        position: "top",
                        labels: {
                            color: "#cbd5e1"
                        }
                    }
                },

                scales: {
                    x: {
                        ticks: {
                            color: "#94a3b8"
                        },
                        grid: {
                            color: "#263449"
                        }
                    },

                    y: {
                        title: {
                            display: true,
                            text: "Cumulative P&L",
                            color: "#94a3b8"
                        },
                        ticks: {
                            color: "#94a3b8"
                        },
                        grid: {
                            color: "#263449"
                        }
                    }
                }
            }
        });
    }

    // ==============================
    // INSTRUMENT WIN/LOSS DISTRIBUTION
    // ==============================

    function renderInstrumentWinLossDistribution(trades) {

        const closedTrades = trades.filter(trade =>
            trade.profitLoss !== null &&
            trade.profitLoss !== undefined
        );

        const winningTrades = closedTrades.filter(trade =>
            Number(trade.profitLoss) > 0
        );

        const losingTrades = closedTrades.filter(trade =>
            Number(trade.profitLoss) < 0
        );

        const breakEvenTrades = closedTrades.filter(trade =>
            Number(trade.profitLoss) === 0
        );

        const ctx = document
            .getElementById("instrumentWinLossDistribution")
            .getContext("2d");

        if (instrumentWinLossChart) {
            instrumentWinLossChart.destroy();
        }

        instrumentWinLossChart = new Chart(ctx, {
            type: "doughnut",

            data: {
                labels: ["Winning Trades", "Losing Trades", "Break-even Trades"],

                datasets: [{
                    data: [
                        winningTrades.length,
                        losingTrades.length,
                        breakEvenTrades.length
                    ],
                    backgroundColor: [
                        "#22c55e",
                        "#ef4444",
                        "#94a3b8"
                    ],
                    borderWidth: 0,
                    hoverOffset: 8
                }]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,

                plugins: {
                    legend: {
                        position: "bottom",
                        labels: {
                            color: "#cbd5e1",
                            padding: 20
                        }
                    },

                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = closedTrades.length;
                                const count = context.raw;
                                const percentage = total > 0
                                    ? ((count / total) * 100).toFixed(2)
                                    : 0;

                                return `${context.label}: ${count} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }


    // ==============================
// SETUP-WISE PERFORMANCE BREAKDOWN
// ==============================

    function calculateInstrumentSetupPerformance(trades) {

        const closedTrades = trades.filter(trade =>
            trade.profitLoss !== null &&
            trade.profitLoss !== undefined
        );

        const setupGroups = {};

        closedTrades.forEach(trade => {

            const setup = trade.setupName || "Unknown Setup";

            if (!setupGroups[setup]) {
                setupGroups[setup] = [];
            }

            setupGroups[setup].push(trade);
        });

        const tbody = document.getElementById(
            "instrumentSetupPerformanceTable"
        );

        tbody.innerHTML = "";

        const setups = Object.entries(setupGroups).sort((a, b) => {

            const pnlA = a[1].reduce(
                (total, trade) => total + Number(trade.profitLoss), 0
            );

            const pnlB = b[1].reduce(
                (total, trade) => total + Number(trade.profitLoss), 0
            );

            return pnlB - pnlA;
        });

        if (setups.length === 0) {
            tbody.innerHTML = `
            <tr>
                <td colspan="7">No setup performance data available</td>
            </tr>
        `;
            return;
        }

        setups.forEach(([setup, setupTrades]) => {

            const totalTrades = setupTrades.length;

            const winners = setupTrades.filter(
                trade => Number(trade.profitLoss) > 0
            );

            const losers = setupTrades.filter(
                trade => Number(trade.profitLoss) < 0
            );

            const grossProfit = winners.reduce(
                (total, trade) => total + Number(trade.profitLoss), 0
            );

            const grossLoss = Math.abs(losers.reduce(
                (total, trade) => total + Number(trade.profitLoss), 0
            ));

            const netPnl = setupTrades.reduce(
                (total, trade) => total + Number(trade.profitLoss), 0
            );

            const winRate = (winners.length / totalTrades) * 100;
            const lossRate = (losers.length / totalTrades) * 100;

            const rrTrades = setupTrades.filter(
                trade => trade.riskReward !== null &&
                    trade.riskReward !== undefined
            );

            const averageRR = rrTrades.length
                ? rrTrades.reduce(
                (total, trade) => total + Number(trade.riskReward), 0
            ) / rrTrades.length
                : null;

            const profitFactor = grossLoss > 0
                ? grossProfit / grossLoss
                : null;

            const row = document.createElement("tr");

            row.innerHTML = `
            <td>${setup}</td>
            <td>${totalTrades}</td>
            <td>${winRate.toFixed(2)}%</td>
            <td>${lossRate.toFixed(2)}%</td>
            <td style="color: ${netPnl >= 0 ? '#22c55e' : '#ef4444'}">
                $${netPnl.toFixed(2)}
            </td>
            <td>${averageRR !== null ? averageRR.toFixed(2) : "N/A"}</td>
            <td>${profitFactor !== null ? profitFactor.toFixed(2) : "N/A"}</td>
        `;

            tbody.appendChild(row);
        });
    }

    // ==============================
// DETAILED INSTRUMENT PERFORMANCE
// ==============================

    function calculateDetailedInstrumentPerformance(trades) {

        const closedTrades = trades.filter(trade =>
            trade.profitLoss !== null &&
            trade.profitLoss !== undefined
        );

        const instrumentGroups = {};

        closedTrades.forEach(trade => {

            const instrument = trade.instrument || "Unknown";

            if (!instrumentGroups[instrument]) {
                instrumentGroups[instrument] = [];
            }

            instrumentGroups[instrument].push(trade);
        });

        const tbody = document.getElementById(
            "detailedInstrumentPerformanceTable"
        );

        tbody.innerHTML = "";

        const instruments = Object.entries(instrumentGroups).sort((a, b) => {

            const pnlA = a[1].reduce(
                (total, trade) => total + Number(trade.profitLoss), 0
            );

            const pnlB = b[1].reduce(
                (total, trade) => total + Number(trade.profitLoss), 0
            );

            return pnlB - pnlA;
        });

        if (instruments.length === 0) {
            tbody.innerHTML = `
            <tr>
                <td colspan="9">No instrument performance data available</td>
            </tr>
        `;
            return;
        }

        instruments.forEach(([instrument, instrumentTrades]) => {

            const totalTrades = instrumentTrades.length;

            const winners = instrumentTrades.filter(
                trade => Number(trade.profitLoss) > 0
            );

            const losers = instrumentTrades.filter(
                trade => Number(trade.profitLoss) < 0
            );

            const grossProfit = winners.reduce(
                (total, trade) => total + Number(trade.profitLoss), 0
            );

            const grossLoss = Math.abs(losers.reduce(
                (total, trade) => total + Number(trade.profitLoss), 0
            ));

            const netPnl = instrumentTrades.reduce(
                (total, trade) => total + Number(trade.profitLoss), 0
            );

            const winRate = (winners.length / totalTrades) * 100;
            const lossRate = (losers.length / totalTrades) * 100;

            const rrTrades = instrumentTrades.filter(
                trade => trade.riskReward !== null &&
                    trade.riskReward !== undefined
            );

            const averageRR = rrTrades.length
                ? rrTrades.reduce(
                (total, trade) => total + Number(trade.riskReward), 0
            ) / rrTrades.length
                : null;

            const profitFactor = grossLoss > 0
                ? grossProfit / grossLoss
                : null;

            const row = document.createElement("tr");

            row.innerHTML = `
            <td>${instrument}</td>
            <td>${totalTrades}</td>
            <td>${winners.length}</td>
            <td>${losers.length}</td>
            <td>${winRate.toFixed(2)}%</td>
            <td>${lossRate.toFixed(2)}%</td>
            <td style="color: ${netPnl >= 0 ? '#22c55e' : '#ef4444'}">
                $${netPnl.toFixed(2)}
            </td>
            <td>${averageRR !== null ? averageRR.toFixed(2) : "N/A"}</td>
            <td>${profitFactor !== null ? profitFactor.toFixed(2) : "N/A"}</td>
        `;

            tbody.appendChild(row);
        });
    }

    // ==============================
    // FILTER BUTTONS
    // ==============================

    document.getElementById("applyFilters")
        .addEventListener("click", applyFilters);

    document.getElementById("resetFilters")
        .addEventListener("click", function () {

            document.getElementById("instrumentFilter").value = "";
            document.getElementById("directionFilter").value = "";
            document.getElementById("startDate").value = "";
            document.getElementById("endDate").value = "";

            applyFilters();

        });


    // INITIALIZE

    fetchTrades();

});