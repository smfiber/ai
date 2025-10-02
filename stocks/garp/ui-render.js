// fileName: ui-render.js
import { state, ANALYSIS_NAMES } from './config.js';
import { getDocs, collection } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { openManageStockModal, openRawDataViewer } from './ui-modals.js';
import { handleRefreshFmpData } from './ui-handlers.js';

/**
 * Renders the generated AI report content into a container.
 * @param {HTMLElement} container The element to display the report in.
 * @param {string} content The HTML/markdown content of the report.
 * @param {string} prompt The prompt used to generate the report.
 */
export function displayReport(container, content, prompt) {
    if (!container) return;
    container.innerHTML = content;
    container.dataset.rawMarkdown = content; 
    container.dataset.currentPrompt = prompt || '';
}

/**
 * Updates the status bar for a displayed report, showing save date and action buttons.
 * @param {HTMLElement} container The status container element.
 * @param {Array} savedReports An array of saved report objects.
 * @param {string} activeReportId The ID of the currently displayed report.
 * @param {object} options An object containing symbol, reportType, etc.
 */
export function updateReportStatus(container, savedReports, activeReportId, { symbol, reportType }) {
    if (!container) return;
    
    const reportName = ANALYSIS_NAMES[reportType] || reportType;
    container.dataset.activeReportType = reportType;

    const savedDate = savedReports.find(r => r.id === activeReportId)?.savedAt.toDate().toLocaleString() || 'Just now';

    let historyHtml = '';
    if (savedReports.length > 1) {
        historyHtml = `<select id="report-history-select" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-1.5">`;
        savedReports.forEach(report => {
            const date = report.savedAt.toDate().toLocaleString();
            historyHtml += `<option value="${report.id}" ${report.id === activeReportId ? 'selected' : ''}>${date}</option>`;
        });
        historyHtml += `</select>`;
    } else {
        historyHtml = `<span class="text-sm text-gray-600">Saved: ${savedDate}</span>`;
    }

    container.innerHTML = `
        <div class="flex-grow">
            <h4 class="font-bold text-gray-800">${reportName}</h4>
            ${historyHtml}
        </div>
        <div class="flex items-center gap-2">
            <button data-symbol="${symbol}" data-report-type="${reportType}" class="regenerate-report-button bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold py-1 px-3 rounded-lg text-sm">Regenerate</button>
            <button data-report-id="${activeReportId}" data-symbol="${symbol}" data-report-type="${reportType}" class="delete-report-button bg-red-100 hover:red-bg-blue-200 text-red-800 font-semibold py-1 px-3 rounded-lg text-sm">Delete</button>
        </div>
    `;
    container.classList.remove('hidden');
}

/**
 * Fetches all portfolio and watchlist stocks from Firestore and caches them in the state.
 * Also updates the dashboard counts.
 */
export async function fetchAndCachePortfolioData() {
    if (!state.db) return;
    try {
        const querySnapshot = await getDocs(collection(state.db, 'portfolio_stocks'));
        state.portfolioCache = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

        const counts = {
            Portfolio: 0,
            Watchlist: 0,
            'Revisit 3 months': 0,
            'Revisit 6 months': 0,
        };

        state.portfolioCache.forEach(stock => {
            if (counts.hasOwnProperty(stock.status)) {
                counts[stock.status]++;
            }
        });

        document.getElementById('portfolio-count').textContent = counts.Portfolio;
        document.getElementById('watchlist-count').textContent = counts.Watchlist;
        document.getElementById('revisit-3-months-count').textContent = counts['Revisit 3 months'];
        document.getElementById('revisit-6-months-count').textContent = counts['Revisit 6 months'];

    } catch (error) {
        console.error("Error fetching portfolio data:", error);
    }
}


// --- STUBBED/PLACEHOLDER FUNCTIONS ---
// NOTE: The implementation for the following functions was not found in the provided files.
// They are included here as placeholders to resolve import errors.

export function renderValuationHealthDashboard(container, ticker, fmpData) {
    console.warn('renderValuationHealthDashboard is not implemented.');
    container.innerHTML = '<p class="text-center text-gray-500">Valuation Health Dashboard not implemented.</p>';
}

export function _renderGroupedStockList(container, stocks, listType) {
    console.warn('_renderGroupedStockList is not implemented.');
    container.innerHTML = '<p class="text-center text-gray-500">Grouped Stock List not implemented.</p>';
}

export async function renderPortfolioManagerList() {
    const container = document.getElementById('portfolio-manager-list-container');
    if (!container) return;

    container.innerHTML = '';
    if (state.portfolioCache.length === 0) {
        container.innerHTML = '<p class="p-8 text-center text-gray-500">No stocks found in any list.</p>';
        return;
    }

    const sortedStocks = [...state.portfolioCache].sort((a, b) => a.ticker.localeCompare(b.ticker));

    const list = document.createElement('div');
    list.className = 'divide-y divide-gray-200';

    sortedStocks.forEach(stock => {
        const item = document.createElement('div');
        item.className = 'p-4 flex justify-between items-center';
        item.innerHTML = `
            <div>
                <p class="font-bold text-lg text-gray-800">${stock.ticker}</p>
                <p class="text-sm text-gray-500">${stock.companyName}</p>
                <p class="text-xs text-indigo-600 font-semibold mt-1">${stock.status}</p>
            </div>
            <div class="flex gap-2">
                <button data-ticker="${stock.ticker}" class="edit-stock-btn bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-1 px-3 rounded-lg text-sm">Edit</button>
                <button data-ticker="${stock.ticker}" class="delete-stock-btn bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-1 px-3 rounded-lg text-sm">Delete</button>
            </div>
        `;
        list.appendChild(item);
    });
    container.appendChild(list);
}

export function renderGarpScorecardDashboard(container, ticker, fmpData) {
    console.warn('renderGarpScorecardDashboard is not implemented.');
    container.innerHTML = '<p class="text-center text-gray-500">GARP Scorecard not implemented.</p>';
    return {}; // Return empty object to prevent downstream errors
}

export function renderGarpInterpretationAnalysis(container, metrics) {
    console.warn('renderGarpInterpretationAnalysis is not implemented.');
    const interpContainer = document.getElementById('garp-interpretation-container');
    if(interpContainer) {
        interpContainer.innerHTML = '<p class="text-center text-gray-500">GARP Interpretation not implemented.</p>';
    }
}

export function updateGarpCandidacyStatus(container, reports, activeId, ticker) {
    console.warn('updateGarpCandidacyStatus is not implemented.');
     if(container) {
        container.innerHTML = '';
        container.classList.add('hidden');
    }
}

export function renderCandidacyAnalysis(container, content, prompt, questions) {
    console.warn('renderCandidacyAnalysis is not implemented.');
    container.innerHTML = marked.parse(content);
}

export function renderGarpAnalysisSummary(container, ticker) {
    console.warn('renderGarpAnalysisSummary is not implemented.');
    container.innerHTML = `
        <div class="text-center p-8 bg-gray-50 rounded-lg">
            <h3 class="text-xl font-bold text-gray-800 mb-2">GARP Candidacy Report</h3>
            <p class="text-gray-600 mb-6 max-w-2xl mx-auto">Generate a data-driven verdict on whether this stock qualifies as a potential GARP investment.</p>
            <button data-ticker="${ticker}" class="generate-candidacy-button bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg text-base shadow-md transition-transform hover:scale-105">
                Analyze Candidacy
            </button>
        </div>
        <div id="garp-candidacy-status-container" class="hidden mt-4"></div>
        <div id="garp-analysis-container" class="prose max-w-none mt-6"></div>
    `;
}

export function renderDiligenceLog(container, reports) {
    console.warn('renderDiligenceLog is not implemented.');
    container.innerHTML = '<p class="text-center text-gray-500">Diligence Log not implemented.</p>';
}

export function renderPeerComparisonTable(container, ticker, metrics, peerData) {
    console.warn('renderPeerComparisonTable is not implemented.');
    container.innerHTML = '<p class="text-center text-gray-500">Peer Comparison Table not implemented.</p>';
}

export function renderSectorMomentumHeatMap(data, summary) {
     console.warn('renderSectorMomentumHeatMap is not implemented.');
    const container = document.getElementById('sector-momentum-container');
    const summaryContainer = document.getElementById('sector-momentum-ai-summary');
    if(container) container.innerHTML = '<p class="text-center text-gray-500">Sector Momentum Heat Map not implemented.</p>';
    if(summaryContainer) summaryContainer.innerHTML = '';
}
