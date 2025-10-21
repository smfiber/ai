// fileName: ui-modals.js
import { CONSTANTS, state, ANALYSIS_ICONS, SECTOR_KPI_SUGGESTIONS, QUALITATIVE_DILIGENCE_QUESTIONS, STRUCTURED_DILIGENCE_QUESTIONS } from './config.js'; // Removed MARKET_SENTIMENT_QUESTIONS
import { getFmpStockData, getGroupedFmpData } from './api.js';
import { renderValuationHealthDashboard, _renderGroupedStockList, renderPortfolioManagerList, renderGarpScorecardDashboard, renderGarpInterpretationAnalysis, updateGarpCandidacyStatus, renderCandidacyAnalysis, renderGarpAnalysisSummary, renderDiligenceLog, renderPeerComparisonTable, renderOngoingReviewLog } from './ui-render.js';
import { getSavedReports } from './ui-handlers.js';

// --- GENERIC MODAL HELPERS ---

/**
 * Opens a modal dialog by its ID.
 * @param {string} modalId The ID of the modal element to open.
 */
export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add(CONSTANTS.CLASS_MODAL_OPEN);
        document.body.classList.add(CONSTANTS.CLASS_BODY_MODAL_OPEN);
    }
}

/**
 * Closes a modal dialog by its ID.
 * @param {string} modalId The ID of the modal element to close.
 */
export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove(CONSTANTS.CLASS_MODAL_OPEN);
        // Only remove the body class if no other modals are open
        const anyModalOpen = document.querySelector('.modal.is-open');
        if (!anyModalOpen) {
            document.body.classList.remove(CONSTANTS.CLASS_BODY_MODAL_OPEN);
        }
    }
}

/**
 * Displays a temporary message in a dedicated message modal.
 * @param {string} message The message to display.
 * @param {string} type The type of message ('info', 'warning', 'error').
 * @param {number} duration The time in milliseconds before the modal auto-closes.
 */
export function displayMessageInModal(message, type = 'info', duration = 2500) {
    const modal = document.getElementById(CONSTANTS.MODAL_MESSAGE);
    const content = modal.querySelector('.modal-content');
    if (!content) return;

    const typeClasses = {
        info: 'bg-blue-100 border-blue-500 text-blue-700',
        warning: 'bg-yellow-100 border-yellow-500 text-yellow-700',
        error: 'bg-red-100 border-red-500 text-red-700',
    };

    content.innerHTML = `<div class="p-6 rounded-lg border-l-4 ${typeClasses[type] || typeClasses.info}" role="alert">
                           <p class="font-bold">${type.charAt(0).toUpperCase() + type.slice(1)}</p>
                           <p>${message}</p>
                         </div>`;
    openModal(CONSTANTS.MODAL_MESSAGE);
    setTimeout(() => closeModal(CONSTANTS.MODAL_MESSAGE), duration);
}

/**
 * Opens a confirmation dialog with a specific action.
 * @param {string} title The title for the confirmation dialog.
 * @param {string} message The message/question to ask the user.
 * @param {function} onConfirm A callback function to execute if the user confirms.
 */
export function openConfirmationModal(title, message, onConfirm) {
    document.getElementById('confirmation-title').textContent = title;
    document.getElementById('confirmation-message').textContent = message;

    const confirmButton = document.getElementById('confirm-button');
    // Clone and replace the button to remove old event listeners
    const newConfirmButton = confirmButton.cloneNode(true);
    confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);

    newConfirmButton.addEventListener('click', () => {
        closeModal(CONSTANTS.MODAL_CONFIRMATION);
        onConfirm();
    }, { once: true });

    openModal(CONSTANTS.MODAL_CONFIRMATION);
}

/**
 * Dynamically adds a KPI input row to the Manage Stock modal.
 * @param {object} [kpi={}] - The KPI object with name and value.
 */
export function addKpiRow(kpi = {}) {
    const container = document.getElementById('kpi-list-container');
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'kpi-row grid grid-cols-12 gap-2 items-center';
    row.innerHTML = `
        <div class="col-span-5">
            <input type="text" class="kpi-name-input mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm" placeholder="KPI Name (e.g., MAU)" value="${kpi.name || ''}">
        </div>
        <div class="col-span-5">
            <input type="text" class="kpi-value-input mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm" placeholder="Value or Trend" value="${kpi.value || ''}">
        </div>
        <div class="col-span-2 text-right">
            <button type="button" class="remove-kpi-button text-red-500 hover:text-red-700 font-bold text-xl">&times;</button>
        </div>
    `;
    container.appendChild(row);
}


/**
 * Opens the "Manage Stock" modal and pre-populates its form fields.
 * @param {object} stockData The data for the stock to be managed.
 */
export function openManageStockModal(stockData) {
    const form = document.getElementById('manage-stock-form');
    form.reset();

    document.getElementById('manage-stock-original-ticker').value = stockData.ticker || '';
    document.getElementById('manage-stock-ticker').value = stockData.ticker || '';
    document.getElementById('manage-stock-name').value = stockData.companyName || '';
    document.getElementById('manage-stock-exchange').value = stockData.exchange || '';
    document.getElementById('manage-stock-sector').value = stockData.sector || 'N/A';
    document.getElementById('manage-stock-industry').value = stockData.industry || 'N/A';
    document.getElementById('manage-stock-status').value = stockData.status || 'Portfolio';

    const deleteButton = document.getElementById('delete-stock-button');
    deleteButton.style.display = stockData.isEditMode ? 'block' : 'none';

    // --- KPI Logic ---
    const kpiContainer = document.getElementById('kpi-list-container');
    kpiContainer.innerHTML = '';
    document.getElementById('kpi-suggestion-container').innerHTML = '';

    if (stockData.customKpis && stockData.customKpis.length > 0) {
        stockData.customKpis.forEach(addKpiRow);
    } else {
        addKpiRow(); // Add one blank row for a new stock
    }

    // --- Transaction Logic ---
    const transactionContainer = document.getElementById('transaction-list-container');
    transactionContainer.innerHTML = ''; // Clear previous rows

    const addTransactionRow = (transaction = {}) => {
        const row = document.createElement('div');
        row.className = 'transaction-row grid grid-cols-12 gap-2 items-center';
        row.innerHTML = `
            <div class="col-span-4">
                <input type="date" class="transaction-date-input mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm" value="${transaction.date || ''}">
            </div>
            <div class="col-span-3">
                <input type="number" step="any" class="transaction-shares-input mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm" placeholder="Shares" value="${transaction.shares || ''}">
            </div>
            <div class="col-span-3">
                <input type="number" step="any" class="transaction-cost-input mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm" placeholder="Cost/Share" value="${transaction.costPerShare || ''}">
            </div>
            <div class="col-span-2 text-right">
                <button type="button" class="remove-transaction-button text-red-500 hover:text-red-700 font-bold text-xl">&times;</button>
            </div>
        `;
        transactionContainer.appendChild(row);
    };

    if (stockData.transactions && stockData.transactions.length > 0) {
        stockData.transactions.forEach(addTransactionRow);
    } else if (stockData.purchaseDate || stockData.shares || stockData.costPerShare) {
        // Handle legacy single transaction format if present
        addTransactionRow({
            date: stockData.purchaseDate,
            shares: stockData.shares,
            costPerShare: stockData.costPerShare
        });
    } else {
        addTransactionRow(); // Start with one blank row for new stocks
    }

    transactionContainer.addEventListener('click', (e) => {
        if (e.target.closest('.remove-transaction-button')) {
            e.target.closest('.transaction-row').remove();
        }
    });

    // Use cloneNode to prevent multiple listeners from being attached
    const addButton = document.getElementById('add-transaction-button');
    const newAddButton = addButton.cloneNode(true);
    addButton.parentNode.replaceChild(newAddButton, addButton);
    newAddButton.addEventListener('click', () => addTransactionRow());

    openModal(CONSTANTS.MODAL_MANAGE_STOCK);
}


/**
 * Opens the "Portfolio & Watchlist Manager" modal.
 */
export function openPortfolioManagerModal() {
    renderPortfolioManagerList();
    openModal(CONSTANTS.MODAL_PORTFOLIO_MANAGER);
}

/**
 * Opens a modal displaying a list of stocks, fetches their data, and renders the list.
 * @param {string} listType The type of list to display (e.g., 'Portfolio').
 */
export async function openStockListModal(listType) {
    const modalId = CONSTANTS.MODAL_STOCK_LIST;
    const titleEl = document.getElementById('stock-list-modal-title');
    const contentContainer = document.getElementById('stock-list-modal-content');

    if (!titleEl || !contentContainer) return;

    // Set title and loading state immediately
    titleEl.textContent = listType;
    contentContainer.innerHTML = '<div class="loader mx-auto my-8"></div>';
    openModal(modalId);

    try {
        // Filter the cached stocks based on the list type
        const filteredStocks = state.portfolioCache.filter(s => s.status === listType);

        // Enrich the filtered stocks with their cached FMP data
        const stocksWithData = await Promise.all(
            filteredStocks.map(async (stock) => {
                const fmpData = await getFmpStockData(stock.ticker);
                return { ...stock, fmpData }; // Combine portfolio data with FMP data
            })
        );

        // Render the fully populated list
        await _renderGroupedStockList(contentContainer, stocksWithData, listType);

    } catch (error) {
        console.error(`Error populating stock list for ${listType}:`, error);
        contentContainer.innerHTML = `<p class="text-center text-red-500 p-8">Could not load stock list: ${error.message}</p>`;
    }
}


// --- SPECIFIC, COMPLEX MODAL CONTROLLERS ---

export function addDiligenceEntryRow() {
    const container = document.getElementById('manual-diligence-entries-container');
    if (!container) return;
    const entryDiv = document.createElement('div');
    entryDiv.className = 'diligence-entry-row border p-3 rounded-lg bg-gray-50 space-y-2';
    entryDiv.innerHTML = `
        <div class="flex justify-between items-center">
            <label class="block text-sm font-medium text-gray-700">New Question</label>
            <button type="button" class="delete-diligence-entry-button text-red-500 hover:text-red-700 font-bold text-xl">&times;</button>
        </div>
        <textarea class="diligence-question-manual-input w-full border border-gray-300 rounded-lg p-2 text-sm" rows="3" placeholder="Enter your diligence question..."></textarea>
        <label class="block text-sm font-medium text-gray-700 pt-2">Answer</label>
        <textarea class="diligence-answer-manual-input w-full border border-gray-300 rounded-lg p-2 text-sm" rows="5" placeholder="Enter the answer you found..."></textarea>
    `;
    container.appendChild(entryDiv);
}

/**
 * Resets the analysis modal to a clean state. This is the "erase the whiteboard" action.
 */
function _resetAnalysisModal() {
    // Helper to safely clear an element if it exists
    const safeClear = (id, content = '') => {
        const el = document.getElementById(id);
        if (el) {
            el.innerHTML = content;
        }
    };

    state.reportCache = []; // Clear the local report cache

    // Clear main tab containers first
    safeClear('dashboard-tab', '<div class="loader mx-auto my-8"></div>'); // Show loading state for dashboard initially
    safeClear('diligence-hub-tab');
    safeClear('ongoing-diligence-tab');
    safeClear('position-analysis-tab'); // Clear this as well
    safeClear('raw-data-tab', '<div id="raw-data-accordion-container"><div class="loader mx-auto my-8"></div></div>'); // Keep container

    // Reset tabs to default view (Dashboard active)
    document.querySelectorAll('#rawDataViewerModal .tab-content').forEach(c => c.classList.add('hidden'));
    document.querySelectorAll('#rawDataViewerModal .tab-button').forEach(b => {
        b.classList.remove('active');
        b.removeAttribute('data-loaded'); // Remove any loaded indicators if used
    });
    document.getElementById('dashboard-tab')?.classList.remove('hidden');
    document.querySelector('.tab-button[data-tab="dashboard"]')?.classList.add('active');

    // Hide position analysis tab button by default
    const positionAnalysisTabButton = document.querySelector('.tab-button[data-tab="position-analysis"]');
    if (positionAnalysisTabButton) {
        positionAnalysisTabButton.classList.add('hidden');
    }

    // Clear specific elements inside tabs (redundant now but safe)
    safeClear('raw-data-accordion-container', '<div class="loader mx-auto my-8"></div>');
    safeClear('position-analysis-content-container');
    safeClear('company-profile-display-container');

    const statusContainerAnalysis = document.getElementById('report-status-container-analysis');
    if (statusContainerAnalysis) {
        statusContainerAnalysis.innerHTML = '';
        statusContainerAnalysis.classList.add('hidden');
        delete statusContainerAnalysis.dataset.activeReportType; // Clear active report type
    }
    const statusContainerPosition = document.getElementById('report-status-container-position');
     if (statusContainerPosition) {
        statusContainerPosition.innerHTML = '';
        statusContainerPosition.classList.add('hidden');
    }

}

export async function openRawDataViewer(ticker) {
    const modalId = 'rawDataViewerModal';
    openModal(modalId);

    // 1. ✅ ERASE THE WHITEBOARD FIRST
    _resetAnalysisModal();

    // 2. Set the context for the new analysis
    const modal = document.getElementById(modalId);
    modal.dataset.activeTicker = ticker; // Store ticker for later use
    const titleEl = document.getElementById('raw-data-viewer-modal-title');
    titleEl.textContent = `Analyzing ${ticker}...`;

    const sanitizeText = (text) => {
        if (typeof text !== 'string') return '';
        const tempDiv = document.createElement('div');
        tempDiv.textContent = text;
        return tempDiv.innerHTML;
    };

    // --- Declare container variables here ---
    let rawDataContainer, diligenceHubContainer, ongoingDiligenceContainer, positionAnalysisContainer, profileDisplayContainer, positionAnalysisTabButton;


    try {
        // --- Get main tab containers ---
        diligenceHubContainer = document.getElementById('diligence-hub-tab');
        ongoingDiligenceContainer = document.getElementById('ongoing-diligence-tab');
        const dashboardTab = document.getElementById('dashboard-tab');
        const rawDataTab = document.getElementById('raw-data-tab');
        const positionAnalysisTab = document.getElementById('position-analysis-tab');

        // 3. THEN, FETCH THE NEW DATA
        const fmpDataPromise = getFmpStockData(ticker);
        const groupedDataPromise = getGroupedFmpData(ticker);

        const reportsRef = state.db.collection(CONSTANTS.DB_COLLECTION_AI_REPORTS).where("ticker", "==", ticker);
        const savedReportsPromise = reportsRef.get().then(snapshot => {
            state.reportCache = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return state.reportCache;
        });

        const qualitativeAnswersPromise = state.db.collection(CONSTANTS.DB_COLLECTION_FMP_CACHE).doc(ticker).collection('diligence_answers').doc('Qualitative').get();
        const structuredAnswersPromise = state.db.collection(CONSTANTS.DB_COLLECTION_FMP_CACHE).doc(ticker).collection('diligence_answers').doc('Structured').get();
        // MarketSentimentPromise removed

        const [
            fmpData,
            groupedFmpData,
            allSavedReports,
            qualitativeSnap,
            structuredSnap
            // marketSentimentSnap removed
        ] = await Promise.all([
            fmpDataPromise,
            groupedDataPromise,
            savedReportsPromise,
            qualitativeAnswersPromise,
            structuredAnswersPromise
            // marketSentimentAnswersPromise removed
        ]);

        if (!fmpData || !fmpData.profile || !fmpData.profile.length === 0) {
            closeModal(modalId);
            displayMessageInModal(
                `Crucial data is missing for ${ticker}. Please use the "Refresh FMP" button for this stock, then try again.`,
                'warning'
            );
            return;
        }

        // Filter reports from the now-populated local cache
        const savedReportTypes = new Set(allSavedReports.map(report => report.reportType));

        const profile = fmpData.profile[0];

        const getAnswersMap = (snap) => snap.exists ? new Map(snap.data().answers.map(item => [item.question, item.answer, item.filingDate])) : new Map(); // Adjusted to include filingDate
        const savedQualitativeAnswers = getAnswersMap(qualitativeSnap);
        const savedStructuredAnswers = getAnswersMap(structuredSnap);
        // savedMarketSentimentAnswers removed

        // 4. POPULATE THE CLEAN STATE
        titleEl.textContent = `Analysis for ${ticker}`;

        // --- DASHBOARD TAB ---
        // Ensure dashboard tab container exists before populating
        if (dashboardTab) {
            // Add skeleton/placeholders first
            dashboardTab.innerHTML = `
                <div class="grid grid-cols-1 gap-8 mb-8">
                    <div id="company-profile-display-container" class="bg-white p-6 rounded-2xl shadow-lg border border-gray-200"></div>
                </div>
            `;
            // NOW get handles to elements inside the dashboard
            profileDisplayContainer = document.getElementById('company-profile-display-container');

            const description = profile.description || 'No description available.';
            if (profileDisplayContainer) profileDisplayContainer.innerHTML = `<h3 class="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Company Overview</h3><p class="text-sm text-gray-700">${description}</p>`;
        }


        // --- POSITION ANALYSIS TAB ---
        positionAnalysisTabButton = document.querySelector('.tab-button[data-tab="position-analysis"]');
        const portfolioData = state.portfolioCache.find(s => s.ticker === ticker);
        if (positionAnalysisTab && portfolioData && (portfolioData.transactions?.length > 0 || portfolioData.shares > 0)) {
            positionAnalysisTabButton?.classList.remove('hidden');
            const helpIconHtmlPos = `<button data-report-type="PositionAnalysis" class="ai-help-button p-1 rounded-full hover:bg-indigo-100" title="What is this?"><svg class="w-5 h-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg></button>`;
            positionAnalysisTab.innerHTML = `
                <div id="report-status-container-position" class="hidden p-3 mb-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between gap-4"></div>
                <div id="position-analysis-content-container">
                    <div class="text-center p-8 bg-gray-50 rounded-lg">
                        <div class="flex justify-center items-center gap-2 mb-2">
                            <h3 class="text-xl font-bold text-gray-800">Position Review</h3>
                            ${helpIconHtmlPos}
                        </div>
                        <p class="text-gray-600 mb-6 max-w-2xl mx-auto">Re-evaluate the original GARP thesis for this holding based on your actual cost basis and the current market price.</p>
                        <button id="generate-position-analysis-button" data-symbol="${ticker}" data-report-type="PositionAnalysis" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg text-base shadow-md transition-transform hover:scale-105">
                            Generate Position Analysis
                        </button>
                    </div>
                    <div id="position-analysis-report-container" class="prose max-w-none mt-6"></div>
                </div>`;
            positionAnalysisContainer = document.getElementById('position-analysis-content-container'); // Now get handle
        }

        // --- RAW DATA TAB ---
        if (rawDataTab) {
            rawDataTab.innerHTML = `<div id="raw-data-accordion-container"></div>`; // Set innerHTML first
            rawDataContainer = document.getElementById('raw-data-accordion-container'); // Then get handle
            let rawDataAccordionHtml = '';
            if (groupedFmpData) {
                const sortedKeys = Object.keys(groupedFmpData).sort();
                for (const key of sortedKeys) {
                    rawDataAccordionHtml += `
                        <details class="mb-2 bg-white rounded-lg border">
                            <summary class="p-3 font-semibold text-gray-700 cursor-pointer hover:bg-gray-50">${key.replace(/_/g, ' ')}</summary>
                            <pre class="text-xs whitespace-pre-wrap break-all bg-gray-900 text-white p-3 rounded-b-lg">${JSON.stringify(groupedFmpData[key], null, 2)}</pre>
                        </details>
                    `;
                }
                if (rawDataContainer) rawDataContainer.innerHTML = rawDataAccordionHtml;
            } else if (rawDataContainer) {
                 rawDataContainer.innerHTML = '<p class="text-center text-gray-500 py-8">Could not load grouped raw data.</p>';
            }
        }

        // --- DILIGENCE HUB TAB ---
        if (diligenceHubContainer) {
            const copyIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125H4.875A1.125 1.125 0 013.75 20.625V7.875c0-.621.504-1.125 1.125-1.125H6.75m9 9.375h3.375c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125h-9.75A1.125 1.125 0 006 9.375v9.75c0 .621.504 1.125 1.125 1.125h3.375m-3.75-9.375V6.125c0-.621.504-1.125 1.125-1.125h9.75c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-3.375" /></svg>`;
            diligenceHubContainer.innerHTML = `
                <div class="space-y-6">
                     <div class="mb-4 text-right p-4 bg-gray-100 rounded-lg border flex justify-end gap-4">
                        <button id="delete-old-diligence-logs-button" data-symbol="${ticker}" class="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-lg text-sm">Delete Old Log Entries</button>
                        <button id="delete-all-diligence-button" class="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg text-sm">Delete All Saved Answers</button>
                    </div>
                    <div id="manual-diligence-forms-container"></div>
                    <div id="qualitative-diligence-forms-container"></div>
                    <div id="structured-diligence-forms-container"></div>
                    <div id="diligence-log-display-container">
                        <div id="diligence-log-container" class="mb-6 text-left"></div>
                    </div>
                </div>
            `;

            // Populate Manual Diligence
            const manualContainer = diligenceHubContainer.querySelector('#manual-diligence-forms-container');
            if(manualContainer) manualContainer.innerHTML = `<div class="p-6 bg-white rounded-lg border shadow-sm text-left"><div class="flex justify-between items-center mb-4"><div><h4 class="text-base font-semibold text-gray-800">Manual Diligence Entry</h4><p class="text-sm text-gray-500">Add custom questions and answers to the log.</p></div><button id="add-diligence-entry-button" class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg text-sm">Add New Q&A</button></div><div id="manual-diligence-entries-container" class="space-y-4"></div><div class="text-right mt-4"><button id="save-manual-diligence-button" class="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg">Save Manual Entries</button></div></div>`;

            // Populate Qualitative Diligence
            const qualitativeContainer = diligenceHubContainer.querySelector('#qualitative-diligence-forms-container');
            let qualitativeHtml = `<div class="text-left border rounded-lg p-4 bg-gray-50"><h4 class="text-base font-semibold text-gray-800 mb-1">Qualitative Diligence</h4><p class="text-sm text-gray-500 mb-4">Answer high-level questions about the business itself.</p><div class="space-y-4">`;
            for (const [category, question] of Object.entries(QUALITATIVE_DILIGENCE_QUESTIONS)) {
                const savedAnswer = sanitizeText(savedQualitativeAnswers.get(question) || '');
                qualitativeHtml += `<div class="diligence-card p-3 bg-white rounded-lg border border-gray-200"><h5 class="font-semibold text-sm text-indigo-700 mb-2">${category}</h5><div class="flex items-start gap-2 mb-2"><p class="text-xs text-gray-600 flex-grow" data-question-text>${question}</p><button type="button" class="copy-icon-btn structured-diligence-copy-btn" title="Copy Question">${copyIcon}</button></div><textarea class="qualitative-diligence-answer w-full border border-gray-300 rounded-lg p-2 text-sm" rows="4" data-category="${category}" placeholder="Your analysis and findings here...">${savedAnswer}</textarea></div>`;
            }
            qualitativeHtml += `</div><div class="text-right mt-4"><button data-diligence-type="Qualitative" class="save-diligence-answers-button bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg">Save Qualitative Answers</button></div></div>`;
            if(qualitativeContainer) qualitativeContainer.innerHTML = qualitativeHtml;

            // Populate Structured Diligence
            const structuredContainer = diligenceHubContainer.querySelector('#structured-diligence-forms-container');
            let structuredHtml = `<div class="text-left border rounded-lg p-4 bg-gray-50"><h4 class="text-base font-semibold text-gray-800 mb-1">Structured (Quantitative) Diligence</h4><p class="text-sm text-gray-500 mb-4">Answer these core questions to build a foundational thesis.</p><div class="space-y-4">`;
            for (const [category, questionData] of Object.entries(STRUCTURED_DILIGENCE_QUESTIONS)) {
                let questionText = '';
                let hasDateField = false;
                if (typeof questionData === 'string') {
                    questionText = questionData;
                } else if (typeof questionData === 'object' && questionData.question) {
                    questionText = questionData.question;
                    hasDateField = questionData.hasDateField; // Check the flag
                } else {
                    continue; // Skip if format is unexpected
                }

                const savedAnswerData = savedStructuredAnswers.get(questionText);
                const savedAnswer = sanitizeText(savedAnswerData?.answer || '');
                const savedDate = sanitizeText(savedAnswerData?.filingDate || ''); // Get saved date

                let dateInputHtml = '';
                if (hasDateField) {
                    dateInputHtml = `
                        <div class="mt-2">
                            <label class="block text-xs font-medium text-gray-700 mb-1">Filing Date:</label>
                            <input type="date" class="structured-diligence-date border border-gray-300 rounded-lg p-1 text-sm" value="${savedDate}">
                        </div>`;
                }

                structuredHtml += `
                    <div class="diligence-card p-3 bg-white rounded-lg border border-gray-200">
                        <h5 class="font-semibold text-sm text-indigo-700 mb-2">${category}</h5>
                        <div class="flex items-start gap-2 mb-2">
                            <p class="text-xs text-gray-600 flex-grow" data-question-text>${questionText}</p>
                            <button type="button" class="copy-icon-btn structured-diligence-copy-btn" title="Copy Question">${copyIcon}</button>
                        </div>
                        <textarea class="structured-diligence-answer w-full border border-gray-300 rounded-lg p-2 text-sm" rows="4" data-category="${category}" placeholder="Your analysis and findings here...">${savedAnswer}</textarea>
                        ${dateInputHtml}
                    </div>`;
            }
            structuredHtml += `</div><div class="text-right mt-4"><button data-diligence-type="Structured" class="save-diligence-answers-button bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg">Save Structured Answers</button></div></div>`;
            if(structuredContainer) structuredContainer.innerHTML = structuredHtml;


            // Market Sentiment population block removed

            // Populate Diligence Log
            const diligenceReports = allSavedReports.filter(r => r.reportType === 'DiligenceInvestigation');
            const diligenceLogContainer = diligenceHubContainer.querySelector('#diligence-log-container');
            if (diligenceLogContainer) renderDiligenceLog(diligenceLogContainer, diligenceReports);

            const checkIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>`;
            diligenceHubContainer.addEventListener('click', (e) => {
                const copyBtn = e.target.closest('.structured-diligence-copy-btn');
                if (copyBtn) {
                    const textToCopy = copyBtn.previousElementSibling.textContent;
                    navigator.clipboard.writeText(textToCopy).then(() => {
                        copyBtn.classList.add('copied');
                        copyBtn.innerHTML = checkIcon;
                        setTimeout(() => {
                            copyBtn.classList.remove('copied');
                            copyBtn.innerHTML = copyIcon;
                        }, 2000);
                    });
                }
            });

            diligenceHubContainer.addEventListener('click', (e) => {
                if (e.target.closest('.delete-diligence-entry-button')) {
                    e.target.closest('.diligence-entry-row').remove();
                }
            });
        }


        // --- ONGOING DILIGENCE TAB ---
        if (ongoingDiligenceContainer) {
            let nextEarningsDate = 'N/A';
            if (fmpData.earning_calendar && fmpData.earning_calendar.length > 0) {
                const today = new Date(); today.setHours(0, 0, 0, 0);
                const futureEarnings = fmpData.earning_calendar.map(e => ({ ...e, dateObj: new Date(e.date) })).filter(e => e.dateObj >= today).sort((a, b) => a.dateObj - b.dateObj);
                if (futureEarnings.length > 0) { nextEarningsDate = futureEarnings[0].date; }
            }

            const reportTypesForLog = ['FilingDiligence', 'EightKAnalysis', 'UpdatedGarpMemo', 'UpdatedQarpMemo', 'QuarterlyReview', 'AnnualReview'];
            const filingDiligenceReports = allSavedReports.filter(r => reportTypesForLog.includes(r.reportType));

            ongoingDiligenceContainer.innerHTML = `
                <div class="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
                    <div class="flex justify-between items-center mb-6 border-b pb-4">
                        <div>
                            <h3 class="text-xl font-bold text-gray-800">Ongoing Review Hub</h3>
                            <p class="text-sm text-gray-500">Periodically re-evaluate your investment thesis.</p>
                        </div>
                        <div class="text-right">
                            <p class="text-sm font-semibold text-gray-600">Next Earnings Date</p>
                            <p class="text-lg font-bold text-indigo-700">${nextEarningsDate}</p>
                        </div>
                    </div>
                    <div id="ongoing-review-actions" class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <button data-review-type="Quarterly" class="start-review-button bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-5 rounded-lg">Start Quarterly Review</button>
                        <button data-review-type="Annual" class="start-review-button bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-5 rounded-lg">Start Annual Review</button>
                        <button id="show-filing-input-button" class="bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-5 rounded-lg">Analyze Filing</button>
                    </div>
                    <div id="review-form-container" class="hidden mb-6"></div>
                    <div id="filing-diligence-input-container" class="hidden mb-6 text-center p-4 border rounded-lg bg-gray-50">
                        <label for="filing-diligence-textarea" class="block text-sm font-medium text-gray-700 mb-2">Paste 10-K, 10-Q, or 8-K Filing Text Below</label>
                        <textarea id="filing-diligence-textarea" class="w-full border border-gray-300 rounded-lg p-2 text-sm" rows="10" placeholder="Paste the full text of the filing here..."></textarea>
                        <div class="mt-4 flex justify-center gap-4">
                            <button id="generate-filing-questions-button" data-symbol="${ticker}" class="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 px-5 rounded-lg">Generate Q&A Form</button>
                            <button id="analyze-eight-k-button-new" data-symbol="${ticker}" class="bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-5 rounded-lg">Analyze as 8-K</button>
                        </div>
                    </div>
                    <div id="filing-diligence-form-container" class="hidden mb-6"></div>
                    <div id="updated-memo-section" class="hidden mb-6">
                         <h4 class="text-lg font-semibold text-gray-800 mb-2">Updated AI-Generated Memo</h4>
                         <div class="flex items-center gap-4 mb-2">
                            <button id="generate-updated-garp-memo-button" data-symbol="${ticker}" class="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg text-sm">Update GARP Memo</button>
                            <button id="generate-updated-qarp-memo-button" data-symbol="${ticker}" class="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-4 rounded-lg text-sm">Update QARP Memo</button>
                         </div>
                         <div id="updated-memo-container" class="prose max-w-none p-4 border rounded-lg bg-gray-50"></div>
                    </div>
                    <div id="ongoing-review-log-container"></div>
                </div>
            `;
            const logContainer = ongoingDiligenceContainer.querySelector('#ongoing-review-log-container');
            if (logContainer) renderOngoingReviewLog(logContainer, filingDiligenceReports);
        }

    } catch (error) {
        console.error('Error opening raw data viewer:', error);
        titleEl.textContent = `Error Loading Data for ${ticker}`;
        // Add checks before setting innerHTML in catch block
        const errorDisplayTargets = ['company-profile-display-container'];
        errorDisplayTargets.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.innerHTML = `<p class="text-red-500 text-center">${error.message}</p>`;
            }
        });
    }
}
