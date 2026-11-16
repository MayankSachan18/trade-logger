
document.addEventListener("DOMContentLoaded", function () {

    const API_URL = "/api/trades";

    let allTrades = [];

    let setupPerformanceChart = null;

    let winLossDistributionChart = null;

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

            console.log("Trades loaded for Analytics:", allTrades);

            populateInstrumentFilter();
            populateSetupFilter();

            applyFilters();

        } catch (error) {
            console.error("Error fetching trades:", error);
        }
    }

    // ==============================
    // POPULATE INSTRUMENT FILTER
    // ==============================

    function populateInstrumentFilter() {

        const filter = document.getElementById("instrumentFilter");

        const instruments = [...new Set(
            allTrades.map(trade => trade.instrument).filter(Boolean)
        )].sort();

        instruments.forEach(instrument => {
            const option = document.createElement("option");
            option.value = instrument;
            option.textContent = instrument;
            filter.appendChild(option);
        });
    }

    // ==============================
    // POPULATE SETUP FILTER
    // ==============================

    function populateSetupFilter() {

        const filter = document.getElementById("setupFilter");

        const setups = [...new Set(
            allTrades.map(trade => trade.setupName).filter(Boolean)
        )].sort();

        setups.forEach(setup => {
            const option = document.createElement("option");
            option.value = setup;
            option.textContent = setup;
            filter.appendChild(option);
        });
    }

    // ==============================
    // APPLY FILTERS
    // ==============================

    function applyFilters() {

        const instrument = document.getElementById("instrumentFilter").value;
        const setup = document.getElementById("setupFilter").value;
        const direction = document.getElementById("directionFilter").value;
        const startDate = document.getElementById("startDate").value;
        const endDate = document.getElementById("endDate").value;

        const filteredTrades = allTrades.filter(trade => {

            const tradeDate = trade.entryTime
                ? trade.entryTime.substring(0, 10)
                : "";

            return (
                (!instrument || trade.instrument === instrument) &&
                (!setup || trade.setupName === setup) &&
                (!direction || trade.direction === direction) &&
                (!startDate || tradeDate >= startDate) &&
                (!endDate || tradeDate <= endDate)
            );
        });

        calculateOverallMetrics(filteredTrades);
        calculateSetupPerformance(filteredTrades);
        calculateBestWorstSetup(filteredTrades);
        calculateDetailedSetupMetrics(filteredTrades);
        calculateTopInstrumentsBySetup(filteredTrades);
        calculateSetupInstrumentPerformance(filteredTrades);
        renderSetupPerformanceTrend(filteredTrades);
        renderWinLossDistribution(filteredTrades);
    }

    // ==============================
    // CALCULATE METRICS
    // ==============================

    function calculateMetrics(trades) {

        // Only trades with recorded P&L are considered closed.
        const closedTrades = trades.filter(
            trade => trade.profitLoss !== null &&
                trade.profitLoss !== undefined
        );

        const wins = closedTrades.filter(
            trade => Number(trade.profitLoss) > 0
        );

        const losses = closedTrades.filter(
            trade => Number(trade.profitLoss) < 0
        );

        const grossProfit = wins.reduce(
            (total, trade) => total + Number(trade.profitLoss), 0
        );

        const grossLoss = Math.abs(losses.reduce(
            (total, trade) => total + Number(trade.profitLoss), 0
        ));

        const netPnl = closedTrades.reduce(
            (total, trade) => total + Number(trade.profitLoss), 0
        );

        const winRate = closedTrades.length
            ? (wins.length / closedTrades.length) * 100
            : 0;

        const lossRate = closedTrades.length
            ? (losses.length / closedTrades.length) * 100
            : 0;

        const profitFactor = grossLoss > 0
            ? grossProfit / grossLoss
            : null;

        const rrTrades = closedTrades.filter(
            trade => trade.riskReward !== null &&
                trade.riskReward !== undefined
        );

        const averageRR = rrTrades.length
            ? rrTrades.reduce(
            (total, trade) => total + Number(trade.riskReward), 0
        ) / rrTrades.length
            : 0;

        return {
            totalTrades: closedTrades.length,
            wins: wins.length,
            losses: losses.length,
            winRate,
            lossRate,
            netPnl,
            grossProfit,
            grossLoss,
            profitFactor,
            averageRR
        };
    }

    // ==============================
    // OVERALL KPI CARDS
    // ==============================

    function calculateOverallMetrics(trades) {

        const metrics = calculateMetrics(trades);

        document.getElementById("totalTrades").textContent =
            metrics.totalTrades;

        document.getElementById("winRate").textContent =
            metrics.winRate.toFixed(2) + "%";

        document.getElementById("netPnl").textContent =
            "$" + metrics.netPnl.toFixed(2);

        document.getElementById("profitFactor").textContent =
            metrics.profitFactor === null
                ? "—"
                : metrics.profitFactor.toFixed(2);
    }

    // ==============================
    // SETUP PERFORMANCE TABLE
    // ==============================

    function calculateSetupPerformance(trades) {

        const tableBody = document.getElementById(
            "setupPerformanceTable"
        );

        const closedTrades = trades.filter(
            trade => trade.profitLoss !== null &&
                trade.profitLoss !== undefined
        );

        const setupGroups = {};

        closedTrades.forEach(trade => {

            const setupName = trade.setupName || "Unspecified";

            if (!setupGroups[setupName]) {
                setupGroups[setupName] = [];
            }

            setupGroups[setupName].push(trade);
        });

        const setups = Object.keys(setupGroups).map(setupName => {

            const metrics = calculateMetrics(setupGroups[setupName]);

            return {
                setupName,
                ...metrics
            };
        });

        // Highest net P&L first
        setups.sort((a, b) => b.netPnl - a.netPnl);

        if (setups.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7">No closed trades found.</td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = setups.map(setup => {

            const profitFactor = setup.profitFactor === null
                ? "—"
                : setup.profitFactor.toFixed(2);

            return `
                <tr>
                    <td>${escapeHtml(setup.setupName)}</td>
                    <td>${setup.totalTrades}</td>
                    <td>${setup.winRate.toFixed(2)}%</td>
                    <td>${setup.lossRate.toFixed(2)}%</td>
                    <td>$${setup.netPnl.toFixed(2)}</td>
                    <td>${setup.averageRR.toFixed(2)}</td>
                    <td>${profitFactor}</td>
                </tr>
            `;

        }).join("");
    }

    // ==============================
    // BEST VS WORST SETUP
    // ==============================

    function calculateBestWorstSetup(trades) {

        const closedTrades = trades.filter(trade =>
            trade.profitLoss !== null &&
            trade.profitLoss !== undefined
        );

        const setupGroups = {};

        closedTrades.forEach(trade => {

            const setupName = trade.setupName || "Unspecified";

            if (!setupGroups[setupName]) {
                setupGroups[setupName] = [];
            }

            setupGroups[setupName].push(trade);
        });

        const setups = Object.keys(setupGroups).map(setupName => {

            return {
                setupName,
                ...calculateMetrics(setupGroups[setupName])
            };
        });

        const bestSetup = setups.length
            ? [...setups].sort((a, b) => b.netPnl - a.netPnl)[0]
            : null;

        const worstSetup = setups.length
            ? [...setups].sort((a, b) => a.netPnl - b.netPnl)[0]
            : null;

        // Best setup
        document.getElementById("bestSetupName").textContent =
            bestSetup ? bestSetup.setupName : "No data";

        document.getElementById("bestSetupPnl").textContent =
            bestSetup ? "$" + bestSetup.netPnl.toFixed(2) : "—";

        document.getElementById("bestSetupTrades").textContent =
            bestSetup ? bestSetup.totalTrades : "—";

        document.getElementById("bestSetupWinRate").textContent =
            bestSetup ? bestSetup.winRate.toFixed(2) + "%" : "—";

        document.getElementById("bestSetupProfitFactor").textContent =
            bestSetup && bestSetup.profitFactor !== null
                ? bestSetup.profitFactor.toFixed(2)
                : "—";

        // Worst setup
        document.getElementById("worstSetupName").textContent =
            worstSetup ? worstSetup.setupName : "No data";

        document.getElementById("worstSetupPnl").textContent =
            worstSetup ? "$" + worstSetup.netPnl.toFixed(2) : "—";

        document.getElementById("worstSetupTrades").textContent =
            worstSetup ? worstSetup.totalTrades : "—";

        document.getElementById("worstSetupWinRate").textContent =
            worstSetup ? worstSetup.winRate.toFixed(2) + "%" : "—";

        document.getElementById("worstSetupProfitFactor").textContent =
            worstSetup && worstSetup.profitFactor !== null
                ? worstSetup.profitFactor.toFixed(2)
                : "—";
    }

    // ==============================
    // DETAILED SETUP METRICS
    // ==============================

    function calculateDetailedSetupMetrics(trades) {

        const closedTrades = trades.filter(trade =>
            trade.profitLoss !== null &&
            trade.profitLoss !== undefined
        );

        const setupGroups = {};

        closedTrades.forEach(trade => {

            const setupName = trade.setupName || "Unspecified";

            if (!setupGroups[setupName]) {
                setupGroups[setupName] = [];
            }

            setupGroups[setupName].push(trade);
        });

        const tableBody = document.getElementById("detailedSetupMetrics");

        tableBody.innerHTML = "";

        const setupNames = Object.keys(setupGroups);

        if (setupNames.length === 0) {
            tableBody.innerHTML = `
            <tr>
                <td colspan="8">No closed trades available</td>
            </tr>
        `;
            return;
        }

        setupNames.forEach(setupName => {

            const setupTrades = setupGroups[setupName];

            const winners = setupTrades.filter(trade =>
                Number(trade.profitLoss) > 0
            );

            const losers = setupTrades.filter(trade =>
                Number(trade.profitLoss) < 0
            );

            const netPnl = setupTrades.reduce((total, trade) =>
                total + Number(trade.profitLoss), 0
            );

            const grossProfit = winners.reduce((total, trade) =>
                total + Number(trade.profitLoss), 0
            );

            const grossLoss = Math.abs(losers.reduce((total, trade) =>
                total + Number(trade.profitLoss), 0
            ));

            const averageWinner = winners.length
                ? grossProfit / winners.length
                : null;

            const averageLoser = losers.length
                ? grossLoss / losers.length
                : null;

            const rrTrades = setupTrades.filter(trade =>
                trade.riskReward !== null &&
                trade.riskReward !== undefined
            );

            const averageRR = rrTrades.length
                ? rrTrades.reduce((total, trade) =>
                total + Number(trade.riskReward), 0
            ) / rrTrades.length
                : null;

            const profitFactor = grossLoss > 0
                ? grossProfit / grossLoss
                : null;

            // Calculate maximum consecutive losses chronologically
            const chronologicalTrades = [...setupTrades].sort((a, b) => {

                const dateA = new Date(a.exitTime || a.entryTime || 0).getTime();
                const dateB = new Date(b.exitTime || b.entryTime || 0).getTime();

                return (Number.isNaN(dateA) ? 0 : dateA) -
                    (Number.isNaN(dateB) ? 0 : dateB);
            });

            let currentLossStreak = 0;
            let maxConsecutiveLosses = 0;

            chronologicalTrades.forEach(trade => {

                if (Number(trade.profitLoss) < 0) {
                    currentLossStreak++;

                    maxConsecutiveLosses = Math.max(
                        maxConsecutiveLosses,
                        currentLossStreak
                    );

                } else {
                    currentLossStreak = 0;
                }
            });

            const row = document.createElement("tr");

            row.innerHTML = `
            <td>${setupName}</td>
            <td>${setupTrades.length}</td>
            <td>${averageWinner !== null ? "$" + averageWinner.toFixed(2) : "—"}</td>
            <td>${averageLoser !== null ? "$" + averageLoser.toFixed(2) : "—"}</td>
            <td>${averageRR !== null ? averageRR.toFixed(2) : "—"}</td>
            <td>${netPnl < 0 ? "-$" + Math.abs(netPnl).toFixed(2) : "$" + netPnl.toFixed(2)}</td>
            <td>${profitFactor !== null ? profitFactor.toFixed(2) : "—"}</td>
            <td>${maxConsecutiveLosses}</td>
        `;

            tableBody.appendChild(row);
        });
    }

    // ==============================
    // TOP INSTRUMENTS BY SETUP
    // ==============================

    function calculateTopInstrumentsBySetup(trades) {

        const closedTrades = trades.filter(trade =>
            trade.profitLoss !== null &&
            trade.profitLoss !== undefined
        );

        const setupGroups = {};

        closedTrades.forEach(trade => {

            const setupName = trade.setupName || "Unspecified";
            const instrument = trade.instrument || "Unknown";

            if (!setupGroups[setupName]) {
                setupGroups[setupName] = {};
            }

            if (!setupGroups[setupName][instrument]) {
                setupGroups[setupName][instrument] = [];
            }

            setupGroups[setupName][instrument].push(trade);
        });

        const tableBody = document.getElementById("topInstrumentsBySetup");

        tableBody.innerHTML = "";

        const setupNames = Object.keys(setupGroups);

        if (setupNames.length === 0) {
            tableBody.innerHTML = `
            <tr>
                <td colspan="6">No closed trades available</td>
            </tr>
        `;
            return;
        }

        setupNames.forEach(setupName => {

            const instruments = Object.entries(setupGroups[setupName]);

            const instrumentMetrics = instruments.map(([instrument, instrumentTrades]) => {

                const winners = instrumentTrades.filter(trade =>
                    Number(trade.profitLoss) > 0
                );

                const losers = instrumentTrades.filter(trade =>
                    Number(trade.profitLoss) < 0
                );

                const grossProfit = winners.reduce((total, trade) =>
                    total + Number(trade.profitLoss), 0
                );

                const grossLoss = Math.abs(losers.reduce((total, trade) =>
                    total + Number(trade.profitLoss), 0
                ));

                const netPnl = instrumentTrades.reduce((total, trade) =>
                    total + Number(trade.profitLoss), 0
                );

                const winRate = (winners.length / instrumentTrades.length) * 100;

                const profitFactor = grossLoss > 0
                    ? grossProfit / grossLoss
                    : null;

                return {
                    instrument,
                    totalTrades: instrumentTrades.length,
                    winRate,
                    netPnl,
                    profitFactor
                };
            });

            // Rank instruments by Net P&L
            instrumentMetrics.sort((a, b) => b.netPnl - a.netPnl);

            const topInstrument = instrumentMetrics[0];

            const row = document.createElement("tr");

            const values = [
                setupName,
                topInstrument.instrument,
                topInstrument.totalTrades,
                topInstrument.winRate.toFixed(2) + "%",
                (topInstrument.netPnl < 0 ? "-$" : "$") +
                Math.abs(topInstrument.netPnl).toFixed(2),
                topInstrument.profitFactor !== null
                    ? topInstrument.profitFactor.toFixed(2)
                    : "—"
            ];

            values.forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value;
                row.appendChild(cell);
            });

            tableBody.appendChild(row);
        });
    }

    // ==============================
    // SETUP PERFORMANCE BY INSTRUMENT
    // ==============================

    function calculateSetupInstrumentPerformance(trades) {

        const tableBody = document.getElementById(
            "setupInstrumentTable"
        );

        const closedTrades = trades.filter(
            trade => trade.profitLoss !== null &&
                trade.profitLoss !== undefined
        );

        const groups = {};

        closedTrades.forEach(trade => {

            const setup = trade.setupName || "Unspecified";
            const instrument = trade.instrument || "Unspecified";

            const key = `${setup}|||${instrument}`;

            if (!groups[key]) {
                groups[key] = {
                    setup,
                    instrument,
                    trades: []
                };
            }

            groups[key].trades.push(trade);
        });

        const results = Object.values(groups).map(group => {

            const metrics = calculateMetrics(group.trades);

            return {
                setup: group.setup,
                instrument: group.instrument,
                ...metrics
            };
        });

        results.sort((a, b) => b.netPnl - a.netPnl);

        if (results.length === 0) {
            tableBody.innerHTML = `
            <tr>
                <td colspan="8">No closed trades found.</td>
            </tr>
        `;
            return;
        }

        tableBody.innerHTML = results.map(result => {

            const profitFactor = result.profitFactor === null
                ? "—"
                : result.profitFactor.toFixed(2);

            return `
            <tr>
                <td>${escapeHtml(result.setup)}</td>
                <td>${escapeHtml(result.instrument)}</td>
                <td>${result.totalTrades}</td>
                <td>${result.winRate.toFixed(2)}%</td>
                <td>${result.lossRate.toFixed(2)}%</td>
                <td>$${result.netPnl.toFixed(2)}</td>
                <td>${result.averageRR.toFixed(2)}</td>
                <td>${profitFactor}</td>
            </tr>
        `;

        }).join("");
    }

    // ==============================
    // SETUP PERFORMANCE TREND
    // ==============================

    function renderSetupPerformanceTrend(trades) {

        const canvas = document.getElementById(
            "setupPerformanceTrend"
        );

        const closedTrades = trades.filter(trade =>
            trade.profitLoss !== null &&
            trade.profitLoss !== undefined &&
            (trade.exitTime || trade.entryTime)
        );

        const dates = [...new Set(
            closedTrades.map(trade =>
                (trade.exitTime || trade.entryTime).substring(0, 10)
            )
        )].sort();

        const setups = [...new Set(
            closedTrades.map(trade =>
                trade.setupName || "Unspecified"
            )
        )];

        const datasets = setups.map(setup => {

            let cumulativePnl = 0;

            const data = dates.map(date => {

                const dailyPnl = closedTrades
                    .filter(trade =>
                        (trade.setupName || "Unspecified") === setup &&
                        (trade.exitTime || trade.entryTime).substring(0, 10) === date
                    )
                    .reduce((total, trade) =>
                        total + Number(trade.profitLoss), 0
                    );

                cumulativePnl += dailyPnl;

                return Number(cumulativePnl.toFixed(2));
            });

            return {
                label: setup,
                data: data,
                tension: 0.3,
                fill: false,
                pointRadius: 5,
                pointHoverRadius: 8,
                pointBorderWidth: 2,
                spanGaps: true
            };
        });

        if (setupPerformanceChart) {
            setupPerformanceChart.destroy();
        }

        setupPerformanceChart = new Chart(canvas, {
            type: "line",

            data: {
                labels: dates,
                datasets: datasets
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,

                plugins: {
                    legend: {
                        position: "top",
                        labels: {
                            color: "#cbd5e1"
                        }
                    },

                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label +
                                    ": $" + context.parsed.y.toFixed(2);
                            }
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
                        },
                        title: {
                            display: true,
                            text: "Exit Date",
                            color: "#cbd5e1"
                        }
                    },

                    y: {
                        ticks: {
                            color: "#94a3b8",
                            callback: function(value) {
                                return "$" + value;
                            }
                        },
                        grid: {
                            color: "#263449"
                        },
                        title: {
                            display: true,
                            text: "Cumulative P&L",
                            color: "#cbd5e1"
                        }
                    }
                }
            }
        });
    }

    // ==============================
    // OVERALL WIN/LOSS DISTRIBUTION
    // ==============================

    function renderWinLossDistribution(trades) {

        const canvas = document.getElementById("winLossDistribution");

        // Only include closed trades with a valid P&L.
        const closedTrades = trades.filter(trade =>
            trade.profitLoss !== null &&
            trade.profitLoss !== undefined &&
            Number.isFinite(Number(trade.profitLoss))
        );

        const wins = closedTrades.filter(
            trade => Number(trade.profitLoss) > 0
        ).length;

        const losses = closedTrades.filter(
            trade => Number(trade.profitLoss) < 0
        ).length;

        const breakEven = closedTrades.filter(
            trade => Number(trade.profitLoss) === 0
        ).length;

        const total = closedTrades.length;

        const percentages = total > 0
            ? [
                (wins / total * 100).toFixed(2),
                (losses / total * 100).toFixed(2),
                (breakEven / total * 100).toFixed(2)
            ]
            : ["0.00", "0.00", "0.00"];

        const labels = [
            `Winning (${wins} - ${percentages[0]}%)`,
            `Losing (${losses} - ${percentages[1]}%)`,
            `Break-even (${breakEven} - ${percentages[2]}%)`
        ];

        if (winLossDistributionChart) {
            winLossDistributionChart.destroy();
        }

        winLossDistributionChart = new Chart(canvas, {
            type: "doughnut",

            data: {
                labels: labels,
                datasets: [{
                    data: [wins, losses, breakEven],
                    backgroundColor: [
                        "#22c55e",
                        "#ef4444",
                        "#94a3b8"
                    ],
                    borderColor: "#0b1120",
                    borderWidth: 3,
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

                                const count = context.raw;

                                const percentage = total > 0
                                    ? (count / total * 100).toFixed(2)
                                    : "0.00";

                                return `${context.label.split(" (")[0]}: ${count} trades (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // ==============================
    // ESCAPE HTML
    // ==============================

    function escapeHtml(value) {

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // ==============================
    // FILTER BUTTONS
    // ==============================

    document.getElementById("applyFilters")
        .addEventListener("click", applyFilters);

    document.getElementById("resetFilters")
        .addEventListener("click", function () {

            document.getElementById("instrumentFilter").value = "";
            document.getElementById("setupFilter").value = "";
            document.getElementById("directionFilter").value = "";
            document.getElementById("startDate").value = "";
            document.getElementById("endDate").value = "";

            applyFilters();
        });

    // INITIAL LOAD
    fetchTrades();

});
