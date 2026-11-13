
document.addEventListener("DOMContentLoaded", () => {

    const API_URL = "/api/trades";

    let allTrades = [];

    let currentPage = 1;
    const tradesPerPage = 10;
    let currentDisplayedTrades = [];

    // Fetch all trades
    async function fetchAllTrades() {

        try {
            const response = await fetch(API_URL);

            if (!response.ok) {
                throw new Error("Failed to fetch trades.");
            }

            allTrades = await response.json();

            populateInstrumentFilter(allTrades);
            populateSetupFilter(allTrades);

            displayTrades(allTrades);

        } catch (error) {
            console.error("Error fetching trades:", error);

            document.getElementById("allTrades").innerHTML = `
                <tr>
                    <td colspan="8">Unable to load trades.</td>
                </tr>
            `;
        }
    }

    // Display trades in table


    function displayTrades(trades, resetPage = true) {

        const tableBody = document.getElementById("allTrades");

        currentDisplayedTrades = trades;

        if (resetPage) {
            currentPage = 1;
        }

        const totalTrades = trades.length;
        const totalPages = Math.ceil(totalTrades / tradesPerPage);

        if (totalPages > 0 && currentPage > totalPages) {
            currentPage = totalPages;
        }

        if (totalTrades === 0) {
            tableBody.innerHTML = `
            <tr>
                <td colspan="9">No trades recorded yet.</td>
            </tr>
        `;

            updatePagination();
            return;
        }

        const startIndex = (currentPage - 1) * tradesPerPage;
        const endIndex = Math.min(startIndex + tradesPerPage, totalTrades);

        const pageTrades = trades.slice(startIndex, endIndex);

        tableBody.innerHTML = pageTrades.map(trade => `
        <tr>
            <td>${trade.entryTime
            ? new Date(trade.entryTime).toLocaleString()
            : "-"}</td>
            <td>${trade.instrument ?? "-"}</td>
            <td>${trade.direction ?? "-"}</td>
            <td>${trade.entryPrice ?? "-"}</td>
            <td>${trade.exitPrice ?? "-"}</td>
            <td>${trade.quantity ?? "-"}</td>
            <td>${trade.profitLoss ?? "-"}</td>
            <td>${trade.setupName ?? "-"}</td>

            <td class="action-buttons">
                <button class="edit-button"
                        onclick="window.location.href='/?editTrade=${trade.id}'"
                        title="Edit trade"
                        aria-label="Edit trade">
                    <svg viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" stroke-width="2"
                         stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 20h9"/>
                        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>
                    </svg>
                </button>

                <button class="delete-button"
                        onclick="deleteTrade(${trade.id})"
                        title="Delete trade"
                        aria-label="Delete trade">
                    <svg viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" stroke-width="2"
                         stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 6h18"/>
                        <path d="M8 6V4h8v2"/>
                        <path d="m19 6-1 14H6L5 6"/>
                        <path d="M10 11v6"/>
                        <path d="M14 11v6"/>
                    </svg>
                </button>
            </td>
        </tr>
    `).join("");

        updatePagination();
    }


    function updatePagination() {

        const totalTrades = currentDisplayedTrades.length;
        const totalPages = Math.ceil(totalTrades / tradesPerPage);

        const start = totalTrades === 0
            ? 0
            : (currentPage - 1) * tradesPerPage + 1;

        const end = Math.min(currentPage * tradesPerPage, totalTrades);

        document.getElementById("paginationInfo").textContent =
            `Showing ${start}–${end} of ${totalTrades} trades`;

        document.getElementById("currentPage").textContent =
            `${currentPage} / ${Math.max(totalPages, 1)}`;

        document.getElementById("prevPage").disabled =
            currentPage === 1;

        document.getElementById("nextPage").disabled =
            currentPage >= totalPages;
    }


    let currentSortColumn = null;
    let currentSortDirection = "asc";

    function sortTrades(column) {

        if (currentSortColumn === column) {
            currentSortDirection =
                currentSortDirection === "asc" ? "desc" : "asc";
        } else {
            currentSortColumn = column;
            currentSortDirection = "asc";
        }

        const sortedTrades = [...allTrades].sort((a, b) => {

            let valueA = a[column];
            let valueB = b[column];

            if (column === "entryTime") {
                valueA = valueA ? new Date(valueA).getTime() : 0;
                valueB = valueB ? new Date(valueB).getTime() : 0;
            } else if (
                ["entryPrice", "exitPrice", "quantity", "profitLoss"].includes(column)
            ) {
                valueA = Number(valueA ?? 0);
                valueB = Number(valueB ?? 0);
            } else {
                valueA = String(valueA ?? "").toLowerCase();
                valueB = String(valueB ?? "").toLowerCase();
            }

            if (valueA < valueB) {
                return currentSortDirection === "asc" ? -1 : 1;
            }

            if (valueA > valueB) {
                return currentSortDirection === "asc" ? 1 : -1;
            }

            return 0;
        });

        displayTrades(sortedTrades);

        document.querySelectorAll(".sort-button").forEach(button => {
            const icon = button.querySelector(".sort-icon");

            if (button.dataset.sort === column) {
                icon.textContent =
                    currentSortDirection === "asc" ? "↑" : "↓";
            } else {
                icon.textContent = "↕";
            }
        });
    }



    // Delete trade
    window.deleteTrade = async function (id) {

        const confirmed = confirm(
            "Are you sure you want to delete this trade?"
        );

        if (!confirmed) return;

        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: "DELETE"
            });

            if (!response.ok) {
                throw new Error("Unable to delete trade.");
            }

            alert("Trade deleted successfully!");

            await fetchAllTrades();

        } catch (error) {
            console.error("Delete error:", error);
            alert(error.message);
        }
    };

    // Initial load
    fetchAllTrades();

    // Populate instrument filter
    function populateInstrumentFilter(trades) {

        const instrumentFilter = document.getElementById("instrumentFilter");

        const selectedValue = instrumentFilter.value;

        const instruments = [...new Set(
            trades.map(trade => trade.instrument).filter(Boolean)
        )].sort();

        instrumentFilter.innerHTML = '<option value="">All Instruments</option>';

        instruments.forEach(instrument => {
            const option = document.createElement("option");
            option.value = instrument;
            option.textContent = instrument;
            instrumentFilter.appendChild(option);
        });

        instrumentFilter.value = selectedValue;
    }

    // Populate setup filter
    function populateSetupFilter(trades) {

        const setupFilter = document.getElementById("setupFilter");

        const selectedValue = setupFilter.value;

        const setups = [...new Set(
            trades.map(trade => trade.setupName).filter(Boolean)
        )].sort();

        setupFilter.innerHTML = '<option value="">All Setups</option>';

        setups.forEach(setup => {
            const option = document.createElement("option");
            option.value = setup;
            option.textContent = setup;
            setupFilter.appendChild(option);
        });

        setupFilter.value = selectedValue;
    }

    // Search trades by instrument or setup
    // Apply search and instrument filters
    function applyFilters() {

        const selectedInstrument = document
            .getElementById("instrumentFilter")
            .value;

        const selectedDirection = document
            .getElementById("directionFilter")
            .value;

        const selectedSetup = document
            .getElementById("setupFilter")
            .value;

        const startDate = document.getElementById("startDate").value;
        const endDate = document.getElementById("endDate").value;

        const filteredTrades = allTrades.filter(trade => {

            const matchesInstrument =
                !selectedInstrument ||
                trade.instrument === selectedInstrument;

            const matchesDirection =
                !selectedDirection ||
                trade.direction === selectedDirection;

            const matchesSetup =
                !selectedSetup ||
                trade.setupName === selectedSetup;

            const tradeDate = trade.entryTime
                ? trade.entryTime.substring(0, 10)
                : "";

            const matchesStartDate =
                !startDate || (tradeDate && tradeDate >= startDate);

            const matchesEndDate =
                !endDate || (tradeDate && tradeDate <= endDate);

            return matchesInstrument &&
                matchesDirection &&
                matchesSetup &&
                matchesStartDate &&
                matchesEndDate;
        });

        displayTrades(filteredTrades);
    }

    // Instrument filter listener
    document.getElementById("instrumentFilter").addEventListener("change", applyFilters);

    // Direction filter listener
    document.getElementById("directionFilter").addEventListener("change", applyFilters);

    // Setup filter listener
    document.getElementById("setupFilter").addEventListener("change", applyFilters);

    // Date filter listeners
    document.getElementById("startDate").addEventListener("change", applyFilters);
    document.getElementById("endDate").addEventListener("change", applyFilters);

    document.querySelectorAll(".sort-button").forEach(button => {
        button.addEventListener("click", function () {
            sortTrades(this.dataset.sort);
        });
    });


    document.getElementById("prevPage").addEventListener("click", function () {

        if (currentPage > 1) {
            currentPage--;
            displayTrades(currentDisplayedTrades, false);
        }

    });

    document.getElementById("nextPage").addEventListener("click", function () {

        const totalPages = Math.ceil(
            currentDisplayedTrades.length / tradesPerPage
        );

        if (currentPage < totalPages) {
            currentPage++;
            displayTrades(currentDisplayedTrades, false);
        }

    });


});
