document.addEventListener("DOMContentLoaded", () => {

    let equityChart;
    let setupChart;
    let monthlyChart;

    const API_URL = "/api/trades";

    // Fetch trades from Spring Boot API
    async function fetchTrades() {
        try {
            const response = await fetch(API_URL);

            if (!response.ok) {
                throw new Error("Failed to fetch trades");
            }

            const trades = await response.json();

            updateDashboard(trades);

        } catch (error) {
            console.error("Dashboard error:", error);
        }
    }

    // Update all dashboard sections
    function updateDashboard(trades) {
        updateStatistics(trades);
        updateRecentTrades(trades);
        updateEquityChart(trades);
        updateSetupChart(trades);
        updateMonthlyChart(trades);
    }

    // Calculate dashboard statistics
    function updateStatistics(trades) {

        const completedTrades = trades.filter(
            trade => trade.profitLoss !== null &&
                trade.profitLoss !== undefined
        );

        const totalPnl = completedTrades.reduce(
            (sum, trade) => sum + Number(trade.profitLoss), 0
        );

        const winners = completedTrades.filter(
            trade => Number(trade.profitLoss) > 0
        );

        const losers = completedTrades.filter(
            trade => Number(trade.profitLoss) < 0
        );

        const grossProfit = winners.reduce(
            (sum, trade) => sum + Number(trade.profitLoss), 0
        );

        const grossLoss = Math.abs(losers.reduce(
            (sum, trade) => sum + Number(trade.profitLoss), 0
        ));

        const winRate = completedTrades.length > 0
            ? (winners.length / completedTrades.length) * 100
            : 0;

        const profitFactor = grossLoss > 0
            ? grossProfit / grossLoss
            : null;

        document.getElementById("totalPnl").textContent =
            formatCurrency(totalPnl);

        document.getElementById("winRate").textContent =
            winRate.toFixed(1) + "%";

        document.getElementById("totalTrades").textContent =
            trades.length;

        document.getElementById("profitFactor").textContent =
            profitFactor !== null ? profitFactor.toFixed(2) : "--";
    }

    // Currency formatting
    function formatCurrency(value) {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD"
        }).format(value);
    }

    // Populate recent trades table
    function updateRecentTrades(trades) {
        const tableBody = document.getElementById("recentTrades");

        const recentTrades = [...trades]
            .sort((a, b) => new Date(b.entryTime || 0) - new Date(a.entryTime || 0))
            .slice(0, 5);

        if (recentTrades.length === 0) {
            tableBody.innerHTML = `
            <tr>
                <td colspan="7">No trades recorded yet.</td>
            </tr>
        `;
            return;
        }

        tableBody.innerHTML = recentTrades.map(trade => `
                <tr>
            <td>${trade.instrument}</td>
            <td>${trade.direction}</td>
            <td>${trade.entryPrice ?? "-"}</td>
            <td>${trade.exitPrice ?? "-"}</td>
            <td>${trade.profitLoss ?? "-"}</td>
            <td>${trade.setupName}</td>
            <td class="action-buttons">

                <!-- Edit Button -->
                <button class="edit-button"
                        onclick="editTrade(${trade.id})"
                        title="Edit trade"
                        aria-label="Edit trade">
                    <svg xmlns="http://www.w3.org/2000/svg"
                         width="16" height="16"
                         viewBox="0 0 24 24"
                         fill="none"
                         stroke="currentColor"
                         stroke-width="2"
                         stroke-linecap="round"
                         stroke-linejoin="round">
                        <path d="M12 20h9"></path>
                        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"></path>
                    </svg>
                </button>

                <!-- Delete Button -->
                <button class="delete-button"
                        onclick="deleteTrade(${trade.id})"
                        title="Delete trade"
                        aria-label="Delete trade">
                    <svg xmlns="http://www.w3.org/2000/svg"
                         width="16" height="16"
                         viewBox="0 0 24 24"
                         fill="none"
                         stroke="currentColor"
                         stroke-width="2"
                         stroke-linecap="round"
                         stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6l-1 14H6L5 6"></path>
                        <path d="M10 11v6"></path>
                        <path d="M14 11v6"></path>
                        <path d="M9 6V4h6v2"></path>
                    </svg>
                </button>

            </td>
        </tr>
    `).join("");
    }

    // Equity Curve
    function updateEquityChart(trades) {

        const completedTrades = [...trades]
            .filter(trade => trade.profitLoss != null)
            .sort((a, b) =>
                new Date(a.exitTime || a.entryTime) -
                new Date(b.exitTime || b.entryTime)
            );

        let runningPnl = 0;

        const labels = [];
        const values = [];

        completedTrades.forEach(trade => {
            runningPnl += Number(trade.profitLoss);
            labels.push(
                trade.exitTime || trade.entryTime || "Trade"
            );
            values.push(runningPnl);
        });

        if (equityChart) {
            equityChart.destroy();
        }

        equityChart = new Chart(
            document.getElementById("equityChart"),
            {
                type: "line",
                data: {
                    labels: labels,
                    datasets: [{
                        label: "Cumulative P&L",
                        data: values,
                        borderColor: "#10b981",
                        backgroundColor: "rgba(16,185,129,0.12)",
                        fill: true,
                        tension: 0.35
                    }]
                },
                options: chartOptions("P&L ($)")
            }
        );
    }

    // Setup Performance
    function updateSetupChart(trades) {

        const setupTotals = {};

        trades.forEach(trade => {
            const setup = trade.setupName || "Other";

            setupTotals[setup] =
                (setupTotals[setup] || 0) + 1;
        });

        if (setupChart) {
            setupChart.destroy();
        }

        setupChart = new Chart(
            document.getElementById("setupChart"),
            {
                type: "doughnut",
                data: {
                    labels: Object.keys(setupTotals),
                    datasets: [{
                        data: Object.values(setupTotals),
                        backgroundColor: [
                            "#10b981",
                            "#3b82f6",
                            "#f59e0b",
                            "#8b5cf6",
                            "#ec4899",
                            "#64748b"
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    ...chartOptions(),
                    plugins: {
                        legend: {
                            position: "bottom",
                            labels: {
                                color: "#cbd5e1",
                                padding: 15
                            }
                        }
                    }
                }
            }
        );
    }

    // Monthly Performance
    function updateMonthlyChart(trades) {

        const monthlyTotals = {};

        trades.forEach(trade => {

            if (trade.profitLoss == null) {
                return;
            }

            const date = new Date(
                trade.exitTime || trade.entryTime
            );

            if (isNaN(date.getTime())) {
                return;
            }

            const month = date.toLocaleString("en-US", {
                month: "short",
                year: "numeric"
            });

            monthlyTotals[month] =
                (monthlyTotals[month] || 0) +
                Number(trade.profitLoss);
        });

        const labels = Object.keys(monthlyTotals);

        if (monthlyChart) {
            monthlyChart.destroy();
        }

        monthlyChart = new Chart(
            document.getElementById("monthlyChart"),
            {
                type: "bar",
                data: {
                    labels: labels,
                    datasets: [{
                        label: "Monthly P&L",
                        data: Object.values(monthlyTotals),
                        backgroundColor: "#10b981",
                        borderRadius: 5
                    }]
                },
                options: chartOptions("P&L ($)")
            }
        );
    }

    // Shared chart options
    function chartOptions(axisLabel) {

        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
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
                        color: "#1e293b"
                    }
                },
                y: {
                    title: {
                        display: Boolean(axisLabel),
                        text: axisLabel || "",
                        color: "#94a3b8"
                    },
                    ticks: {
                        color: "#94a3b8"
                    },
                    grid: {
                        color: "#1e293b"
                    }
                }
            }
        };
    }

    // Load dashboard
    fetchTrades();

    // Modal elements
    const tradeModal = document.getElementById("tradeModal");
    const tradeForm = document.getElementById("tradeForm");

    // Open Add Trade modal
    document.getElementById("openTradeForm").addEventListener("click", () => {

        editingTradeId = null;

        tradeForm.reset();

        document.querySelector(".modal-header h2").textContent = "Add New Trade";

        tradeModal.classList.remove("hidden");
    });

    // Close modal
    function closeTradeModal() {
        tradeModal.classList.add("hidden");
    }

    document.getElementById("closeTradeForm")
        .addEventListener("click", closeTradeModal);

    document.getElementById("cancelTradeForm")
        .addEventListener("click", closeTradeModal);

    // Close modal when clicking outside the form
    tradeModal.addEventListener("click", (event) => {
        if (event.target === tradeModal) {
            closeTradeModal();
        }
    });

    // Convert empty numeric fields to null
    function getNumberValue(id) {
        const value = document.getElementById(id).value;
        return value === "" ? null : Number(value);
    }

    // Track whether we are editing an existing trade
    let editingTradeId = null;

    // Edit existing trade
    window.editTrade = async function (id) {

        try {
            const response = await fetch(`${API_URL}/${id}`);

            if (!response.ok) {
                throw new Error("Unable to fetch trade details.");
            }

            const trade = await response.json();

            editingTradeId = id;

            // Populate form fields
            document.getElementById("instrument").value = trade.instrument ?? "";
            document.getElementById("direction").value = trade.direction ?? "";
            document.getElementById("entryPrice").value = trade.entryPrice ?? "";
            document.getElementById("exitPrice").value = trade.exitPrice ?? "";
            document.getElementById("stopLoss").value = trade.stopLoss ?? "";
            document.getElementById("takeProfit").value = trade.takeProfit ?? "";
            document.getElementById("quantity").value = trade.quantity ?? "";
            document.getElementById("setupName").value = trade.setupName ?? "";
            document.getElementById("entryTime").value = trade.entryTime ? trade.entryTime.substring(0, 16) : "";
            document.getElementById("exitTime").value = trade.exitTime ? trade.exitTime.substring(0, 16) : "";
            document.getElementById("profitLoss").value = trade.profitLoss ?? "";
            document.getElementById("riskReward").value = trade.riskReward ?? "";
            document.getElementById("tradingSession").value = trade.tradingSession ?? "";
            document.getElementById("notes").value = trade.notes ?? "";

            // Update modal heading
            document.querySelector(".modal-header h2").textContent = "Edit Trade";

            tradeModal.classList.remove("hidden");

        } catch (error) {
            console.error("Edit trade error:", error);
            alert(error.message);
        }
    };

    // Save trade
    tradeForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const tradeData = {
            instrument: document.getElementById("instrument").value.trim(),
            direction: document.getElementById("direction").value,
            entryPrice: getNumberValue("entryPrice"),
            exitPrice: getNumberValue("exitPrice"),
            stopLoss: getNumberValue("stopLoss"),
            takeProfit: getNumberValue("takeProfit"),
            quantity: getNumberValue("quantity"),
            setupName: document.getElementById("setupName").value.trim(),
            entryTime: document.getElementById("entryTime").value || null,
            exitTime: document.getElementById("exitTime").value || null,
            profitLoss: getNumberValue("profitLoss"),
            riskReward: getNumberValue("riskReward"),
            tradingSession: document.getElementById("tradingSession").value || null,
            notes: document.getElementById("notes").value.trim()
        };

        try {

            const response = await fetch(
                editingTradeId ? `${API_URL}/${editingTradeId}` : API_URL,
                {
                    method: editingTradeId ? "PUT" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(tradeData)
                }
            );

            const result = await response.json();

            if (!response.ok) {
                const errorMessage = result.errors
                    ? Object.values(result.errors).join("\n")
                    : result.detail || "Unable to save trade.";

                throw new Error(errorMessage);
            }

            alert(editingTradeId ? "Trade updated successfully!" : "Trade saved successfully!");

            editingTradeId = null;

            document.querySelector(".modal-header h2").textContent = "Add New Trade";

            tradeForm.reset();
            closeTradeModal();
            await fetchTrades();

        } catch (error) {

            console.error("Save trade error:", error);
            alert(error.message);

        }

    });
    // Delete trade
    window.deleteTrade = async function (id) {
        const confirmed = confirm("Are you sure you want to delete this trade?");

        if (!confirmed) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: "DELETE"
            });

            if (!response.ok) {
                throw new Error("Unable to delete trade.");
            }

            alert("Trade deleted successfully!");
            await fetchTrades();

        } catch (error) {
            console.error("Delete trade error:", error);
            alert(error.message);
        }
    };
    // Open edit modal when arriving from All Trades page
    const editTradeIdFromUrl = new URLSearchParams(window.location.search).get("editTrade");

    if (editTradeIdFromUrl) {
        window.editTrade(Number(editTradeIdFromUrl));
        window.history.replaceState({}, document.title, "/");
    }
});

