// fileName: ui-modals.js
import { CONSTANTS, state, ANALYSIS_ICONS, SECTOR_KPI_SUGGESTIONS } from './config.js';
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
        addTransactionRow({ 
            date: stockData.purchaseDate, 
            shares: stockData.shares, 
            costPerShare: stockData.costPerShare 
        });
    } else {
        addTransactionRow();
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

export const STRUCTURED_DILIGENCE_QUESTIONS = {
    'Financial Analysis': "Based on this data, is the company's financial story one of high-quality, durable growth, or are there signs of weakening fundamentals? Analyze the relationship between its revenue trend, margin stability, and cash flow quality to form a verdict.",
    'Balance Sheet': "Does the balance sheet represent a fortress capable of funding future growth, or a potential risk? Evaluate its debt-to-equity ratio and current ratio against its peers to determine if its financial health is a competitive advantage or a liability.",
    'Income Statement': "Analyze the income statement for signs of improving operational efficiency. Is the company demonstrating operating leverage (i.e., are earnings growing faster than revenue)? Compare its net profit margin trend to its competitors.",
    'Cash Flow': "Evaluate management's effectiveness as capital allocators. Based on the cash flow statement, are they reinvesting capital effectively to drive growth, or are they returning it to shareholders? Crucially, compare the Return on Invested Capital (ROIC) to its historical trend and its peers to judge their skill.",
    'Valuation': "Is the company's current valuation reasonable relative to its growth prospects? Analyze its PEG ratio and compare its current P/E ratio to both its own 5-year historical average and the industry average to determine if we have a margin of safety."
};

export const QUALITATIVE_DILIGENCE_QUESTIONS = {
    'Competitive Moat': "What is the source and durability of the company's competitive moat (e.g., brand, network effects, high switching costs, low-cost production), and is there evidence that this advantage is strengthening or weakening over time?",
    'Management Quality': "After reviewing recent earnings call transcripts or shareholder letters, what is your assessment of management's transparency, operational focus, and long-term strategy? Do they demonstrate a rational and shareholder-aligned approach?",
    'Scuttlebutt': "What are the most common praises or complaints about the company's products or services found in independent reviews, forums, or other non-company sources?"
};


export const QUARTERLY_REVIEW_QUESTIONS = {
    'Results vs. Expectations': "Did the company meet, beat, or miss revenue and EPS expectations? Analyze the key drivers behind the results and any significant one-time items.",
    'Quantitative Thesis Check': "How have the key GARP Scorecard metrics (e.g., ROIC, D/E, forward growth, valuation) changed since the last review? Does the quantitative data still support the original thesis?",
    'Management Outlook': "Summarize management's forward-looking guidance and commentary from the earnings call. Are they more optimistic or pessimistic, and what are the key opportunities and risks they highlighted?",
    'Qualitative Thesis Check': "Does management's commentary and the quarter's results confirm or challenge the qualitative bull/bear case from the original Investment Memo? Has the core investment thesis evolved?",
    'Action Plan': "Based on this review, what is the new investment decision? (e.g., Hold, Add, Trim, Sell). Justify the decision."
};

export const ANNUAL_REVIEW_QUESTIONS = {
    'Full-Year Performance vs. Guidance': "Did the company meet its full-year guidance for revenue and EPS? Analyze the primary drivers of outperformance or underperformance for the year.",
    'Strategic Progress & Capital Allocation': "Review the company's strategic initiatives from the start of the year. Was capital allocated effectively (e.g., acquisitions, buybacks, R&D)? How has ROIC trended over the full year?",
    'Updated Competitive Landscape': "Based on the 10-K's 'Competition' and 'Risk Factors' sections, have there been any material changes to the competitive environment or long-term business risks?",
    'Long-Term Thesis Validation': "Does the full-year performance and management's outlook for the next year strengthen or weaken the original long-term investment thesis? Re-evaluate the core bull and bear cases.",
    'Forward-Looking Action Plan': "Given the full-year results and outlook, what is the investment plan for the stock over the next 6-12 months? (e.g., Hold, Add on weakness, Trim on strength, Exit position). Justify the plan."
};


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

    // Clear all content areas to their initial state
    safeClear('raw-data-accordion-container', '<div class="loader mx-auto"></div>');
    safeClear('ai-analysis-tab');
    safeClear('diligence-hub-tab');
    safeClear('ongoing-diligence-tab');
    safeClear('position-analysis-content-container');
    safeClear('ai-article-container-analysis');
    safeClear('company-profile-display-container');
    safeClear('garp-scorecard-container');
    safeClear('peer-analysis-section-container');
    safeClear('valuation-health-container');
    safeClear('ai-garp-summary-container');
    
    const statusContainer = document.getElementById('report-status-container-analysis');
    if (statusContainer) {
        statusContainer.innerHTML = '';
        statusContainer.classList.add('hidden');
    }
    
    // Reset tabs to default view
    document.querySelectorAll('#rawDataViewerModal .tab-content').forEach(c => c.classList.add('hidden'));
    document.querySelectorAll('#rawDataViewerModal .tab-button').forEach(b => {
        b.classList.remove('active');
        b.removeAttribute('data-loaded');
    });

    const positionAnalysisTabButton = document.querySelector('.tab-button[data-tab="position-analysis"]');
    if (positionAnalysisTabButton) {
        positionAnalysisTabButton.classList.add('hidden');
    }
    
    const dashboardTab = document.getElementById('dashboard-tab');
    if (dashboardTab) {
        dashboardTab.classList.remove('hidden');
    }

    const dashboardButton = document.querySelector('.tab-button[data-tab="dashboard"]');
    if (dashboardButton) {
        dashboardButton.classList.add('active');
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

    try {
        // Re-acquire handles to containers now that they are clean
        const rawDataContainer = document.getElementById('raw-data-accordion-container');
        const aiAnalysisContainer = document.getElementById('ai-analysis-tab');
        const diligenceHubContainer = document.getElementById('diligence-hub-tab');
        const ongoingDiligenceContainer = document.getElementById('ongoing-diligence-tab');
        const positionAnalysisContainer = document.getElementById('position-analysis-content-container');
        const profileDisplayContainer = document.getElementById('company-profile-display-container');
        const garpScorecardContainer = document.getElementById('garp-scorecard-container');
        const positionAnalysisTabButton = document.querySelector('.tab-button[data-tab="position-analysis"]');
        const peerAnalysisContainer = document.getElementById('peer-analysis-section-container');

        // 3. THEN, FETCH THE NEW DATA
        const fmpDataPromise = getFmpStockData(ticker);
        const groupedDataPromise = getGroupedFmpData(ticker);
        const savedReportsPromise = state.db.collection(CONSTANTS.DB_COLLECTION_AI_REPORTS).where("ticker", "==", ticker).get();
        const candidacyReportType = 'GarpCandidacy';
        const savedCandidacyReportsPromise = getSavedReports(ticker, candidacyReportType);


        const [fmpData, groupedFmpData, savedReportsSnapshot, savedCandidacyReports] = await Promise.all([fmpDataPromise, groupedDataPromise, savedReportsPromise, savedCandidacyReportsPromise]);

        if (!fmpData || !fmpData.profile || fmpData.profile.length === 0) {
            closeModal(modalId);
            displayMessageInModal(
                `Crucial data is missing for ${ticker}. Please use the "Refresh FMP" button for this stock, then try again.`,
                'warning'
            );
            return;
        }

        const savedReportTypes = new Set(savedReportsSnapshot.docs.map(doc => doc.data().reportType));
        const allSavedReports = savedReportsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const profile = fmpData.profile[0];
        
        // 4. POPULATE THE CLEAN STATE
        titleEl.textContent = `Analysis for ${ticker}`;
        const helpIconHtml = `<button data-report-type="PositionAnalysis" class="ai-help-button p-1 rounded-full hover:bg-indigo-100" title="What is this?"><svg class="w-5 h-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg></button>`;

        // --- POSITION ANALYSIS TAB ---
        const portfolioData = state.portfolioCache.find(s => s.ticker === ticker);
        if (portfolioData && (portfolioData.transactions?.length > 0 || portfolioData.shares > 0)) {
            positionAnalysisTabButton.classList.remove('hidden');
            positionAnalysisContainer.innerHTML = `
                <div class="text-center p-8 bg-gray-50 rounded-lg">
                    <div class="flex justify-center items-center gap-2 mb-2">
                        <h3 class="text-xl font-bold text-gray-800">Position Review</h3>
                        ${helpIconHtml}
                    </div>
                    <p class="text-gray-600 mb-6 max-w-2xl mx-auto">Re-evaluate the original GARP thesis for this holding based on your actual cost basis and the current market price.</p>
                    <button id="generate-position-analysis-button" data-symbol="${ticker}" data-report-type="PositionAnalysis" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg text-base shadow-md transition-transform hover:scale-105">
                        Generate Position Analysis
                    </button>
                </div>
                <div id="position-analysis-report-container" class="prose max-w-none mt-6"></div>
            `;
        }
        
        // --- RAW DATA TAB ---
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
            rawDataContainer.innerHTML = rawDataAccordionHtml;
        } else {
             rawDataContainer.innerHTML = '<p class="text-center text-gray-500 py-8">Could not load grouped raw data.</p>';
        }

        // --- AI ANALYSIS TAB ---
        const deepDiveButtons = [
            { reportType: 'MoatAnalysis', text: 'Moat Analysis', tooltip: 'Evaluates the company\'s competitive advantages.' },
            { reportType: 'CapitalAllocators', text: 'Capital Allocators', tooltip: 'Assesses management\'s skill in deploying capital.' },
        ];
        
        const buildButtonHtml = (buttons) => buttons.map((btn) => {
             const hasSaved = savedReportTypes.has(btn.reportType) ? 'has-saved-report' : '';
             const icon = ANALYSIS_ICONS[btn.reportType] || '';
             const helpIconSvg = `<svg class="w-5 h-5 text-indigo-500 group-hover:text-indigo-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg>`;
             
             return `<div class="relative group">
                         <button data-symbol="${ticker}" data-report-type="${btn.reportType}" class="ai-analysis-button analysis-tile ${hasSaved}" data-tooltip="${btn.tooltip}">
                             ${icon}
                             <span class="tile-name">${btn.text}</span>
                         </button>
                         <button data-report-type="${btn.reportType}" class="ai-help-button absolute -top-2 -right-2 bg-white p-1 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity" title="What is this report?">
                             ${helpIconSvg}
                         </button>
                     </div>`;
        }).join('');
        
        const deepDiveHtml = buildButtonHtml(deepDiveButtons);
        const garpMemoBtn = `<button data-symbol="${ticker}" id="garp-memo-button" data-report-type="InvestmentMemo" class="ai-analysis-button bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg text-base">Generate GARP Memo</button>`;
        const compounderBtn = `<button data-symbol="${ticker}" id="long-term-compounder-button" data-report-type="LongTermCompounder" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg text-base">Generate Compounder Memo</button>`;
        const bmqvBtn = `<button data-symbol="${ticker}" id="bmqv-memo-button" data-report-type="BmqvMemo" class="ai-analysis-button bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg text-base">Generate BMQV Memo</button>`;
        const qarpBtn = `<button data-symbol="${ticker}" id="qarp-analysis-button" data-report-type="QarpAnalysis" class="ai-analysis-button bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg text-base">Generate QARP Analysis</button>`;
        const finalThesisBtn = `<button data-symbol="${ticker}" id="final-thesis-button" data-report-type="FinalInvestmentThesis" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg text-base">Generate Final Thesis</button>`;
        
        aiAnalysisContainer.innerHTML = `
            <div id="analysis-content-container" class="space-y-8 text-center bg-gray-50 p-4 rounded-lg border-b pb-4 mb-4">

                <div class="p-4 bg-white rounded-lg border shadow-sm">
                    <h3 class="text-lg font-bold text-gray-800 mb-4">Step 1: Foundational Analysis</h3>
                    <p class="text-sm text-gray-500 mb-4">Generate these core reports first. They are the building blocks for the synthesis memos.</p>
                    <div class="flex flex-wrap gap-4 justify-center">
                        ${deepDiveHtml}
                    </div>
                </div>

                <div class="p-4 bg-white rounded-lg border shadow-sm">
                    <div class="flex justify-center items-center gap-2 mb-4">
                        <h3 class="text-lg font-bold text-gray-800">Step 2: Synthesis Memos</h3>
                    </div>
                     <p class="text-sm text-gray-500 mb-4">Synthesize the foundational reports into different analytical frameworks.</p>
                    <div class="flex justify-center flex-wrap gap-4">
                        ${compounderBtn}
                        ${bmqvBtn}
                        ${garpMemoBtn}
                        ${qarpBtn}
                    </div>
                </div>

                <div class="p-4 bg-white rounded-lg border shadow-sm">
                    <div class="flex justify-center items-center gap-2 mb-4">
                        <h3 class="text-lg font-bold text-gray-800">Step 3: The Final Verdict</h3>
                    </div>
                     <p class="text-sm text-gray-500 mb-4">Combine all synthesis memos into a single, definitive investment thesis.</p>
                    <div class="flex justify-center flex-wrap gap-4">
                        ${finalThesisBtn}
                    </div>
                </div>

            </div>
            <div id="report-status-container-analysis" class="hidden p-3 mb-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between gap-4"></div>
            <div id="ai-article-container-analysis" class="prose max-w-none"></div>
        `;
        
        // --- DILIGENCE HUB TAB ---
        const copyIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125H4.875A1.125 1.125 0 013.75 20.625V7.875c0-.621.504-1.125 1.125-1.125H6.75m9 9.375h3.375c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125h-9.75A1.125 1.125 0 006 9.375v9.75c0 .621.504 1.125 1.125 1.125h3.375m-3.75-9.375V6.125c0-.621.504-1.125 1.125-1.125h9.75c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-3.375" /></svg>`;
        
        diligenceHubContainer.innerHTML = `
            <div class="space-y-6">
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
        manualContainer.innerHTML = `<div class="p-6 bg-white rounded-lg border shadow-sm text-left"><div class="flex justify-between items-center mb-4"><div><h4 class="text-base font-semibold text-gray-800">Manual Diligence Entry</h4><p class="text-sm text-gray-500">Add custom questions and answers to the log.</p></div><button id="add-diligence-entry-button" class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg text-sm">Add New Q&A</button></div><div id="manual-diligence-entries-container" class="space-y-4"></div><div class="text-right mt-4"><button id="save-manual-diligence-button" class="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg">Save Manual Entries</button></div></div>`;

        // Populate Qualitative Diligence
        const qualitativeContainer = diligenceHubContainer.querySelector('#qualitative-diligence-forms-container');
        let qualitativeHtml = `<div class="text-left border rounded-lg p-4 bg-gray-50"><h4 class="text-base font-semibold text-gray-800 mb-1">Qualitative Diligence</h4><p class="text-sm text-gray-500 mb-4">Answer high-level questions about the business itself.</p><div class="space-y-4">`;
        for (const [category, question] of Object.entries(QUALITATIVE_DILIGENCE_QUESTIONS)) {
            qualitativeHtml += `<div class="diligence-card p-3 bg-white rounded-lg border border-gray-200"><h5 class="font-semibold text-sm text-indigo-700 mb-2">${category}</h5><div class="flex items-start gap-2 mb-2"><p class="text-xs text-gray-600 flex-grow" data-question-text>${question}</p><button type="button" class="copy-icon-btn structured-diligence-copy-btn" title="Copy Question">${copyIcon}</button></div><textarea class="qualitative-diligence-answer w-full border border-gray-300 rounded-lg p-2 text-sm" rows="4" data-category="${category}" placeholder="Your analysis and findings here..."></textarea></div>`;
        }
        qualitativeHtml += `</div><div class="text-right mt-4"><button id="save-qualitative-diligence-button" class="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg">Save Qualitative Answers</button></div></div>`;
        qualitativeContainer.innerHTML = qualitativeHtml;
        
        // Populate Structured Diligence
        const structuredContainer = diligenceHubContainer.querySelector('#structured-diligence-forms-container');
        let structuredHtml = `<div class="text-left border rounded-lg p-4 bg-gray-50"><h4 class="text-base font-semibold text-gray-800 mb-1">Structured (Quantitative) Diligence</h4><p class="text-sm text-gray-500 mb-4">Answer these core questions to build a foundational thesis.</p><div class="space-y-4">`;
        for (const [category, question] of Object.entries(STRUCTURED_DILIGENCE_QUESTIONS)) {
            structuredHtml += `<div class="diligence-card p-3 bg-white rounded-lg border border-gray-200"><h5 class="font-semibold text-sm text-indigo-700 mb-2">${category}</h5><div class="flex items-start gap-2 mb-2"><p class="text-xs text-gray-600 flex-grow" data-question-text>${question}</p><button type="button" class="copy-icon-btn structured-diligence-copy-btn" title="Copy Question">${copyIcon}</button></div><textarea class="structured-diligence-answer w-full border border-gray-300 rounded-lg p-2 text-sm" rows="4" data-category="${category}" placeholder="Your analysis and findings here..."></textarea></div>`;
        }
        structuredHtml += `</div><div class="text-right mt-4"><button id="save-structured-diligence-button" class="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg">Save Structured Answers</button></div></div>`;
        structuredContainer.innerHTML = structuredHtml;
        
        // Populate Diligence Log
        const diligenceReports = allSavedReports.filter(r => r.reportType === 'DiligenceInvestigation');
        renderDiligenceLog(diligenceHubContainer.querySelector('#diligence-log-container'), diligenceReports);

        // --- ONGOING DILIGENCE TAB ---
        let nextEarningsDate = 'N/A';
        if (fmpData.earning_calendar && fmpData.earning_calendar.length > 0) {
            const today = new Date(); today.setHours(0, 0, 0, 0);
            const futureEarnings = fmpData.earning_calendar.map(e => ({ ...e, dateObj: new Date(e.date) })).filter(e => e.dateObj >= today).sort((a, b) => a.dateObj - b.dateObj);
            if (futureEarnings.length > 0) { nextEarningsDate = futureEarnings[0].date; }
        }
        
        const reportTypesForLog = ['FilingDiligence', 'UpdatedGarpMemo', 'UpdatedQarpMemo'];
        const filingDiligenceReports = allSavedReports.filter(r => reportTypesForLog.includes(r.reportType));
        const hasFilingDiligence = filingDiligenceReports.some(r => r.reportType === 'FilingDiligence');

        ongoingDiligenceContainer.innerHTML = `
            <div class="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
                <div class="flex justify-between items-center mb-4 border-b pb-2">
                    <h3 class="text-xl font-bold text-gray-800">Filing Diligence Workflow</h3>
                    <div class="text-right">
                        <p class="text-sm font-semibold text-gray-600">Next Earnings Date</p>
                        <p class="text-lg font-bold text-indigo-700">${nextEarningsDate}</p>
                    </div>
                </div>
                
                <div id="filing-diligence-input-container">
                    <label for="filing-diligence-textarea" class="block text-sm font-medium text-gray-700 mb-2">Paste 10-Q, 10-K, or 8-K Filing Text</label>
                    <textarea id="filing-diligence-textarea" class="w-full border border-gray-300 rounded-lg p-2 text-sm" rows="10" placeholder="Paste the full text from the company's latest SEC filing (10-Q, 10-K, 8-K) here..."></textarea>
                    <div class="text-center mt-4 flex justify-center gap-4">
                        <button id="generate-filing-questions-button" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-5 rounded-lg">
                            Generate Diligence Questions
                        </button>
                        <button id="analyze-eight-k-button" class="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-5 rounded-lg">
                            Analyze 8-K Filing
                        </button>
                    </div>
                </div>

                <div id="filing-diligence-form-container" class="hidden mt-4"></div>
                
                <div id="ongoing-review-log-container" class="mt-6"></div>

                <div id="updated-memo-section" class="${hasFilingDiligence ? '' : 'hidden'} mt-6 pt-6 border-t">
                     <h3 class="text-xl font-bold text-gray-800 mb-4">Generate Updated Memo</h3>
                     <p class="text-sm text-gray-500 mb-4">Generate a new GARP or QARP memo that incorporates the Filing Diligence Q&A you saved above.</p>
                     <div class="flex justify-center gap-4">
                        <button id="generate-updated-garp-memo-button" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-5 rounded-lg">Generate Updated GARP Memo</button>
                        <button id="generate-updated-qarp-memo-button" class="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-5 rounded-lg">Generate Updated QARP Memo</button>
                     </div>
                     <div id="updated-memo-container" class="mt-6"></div>
                </div>
            </div>
        `;
        renderOngoingReviewLog(ongoingDiligenceContainer.querySelector('#ongoing-review-log-container'), filingDiligenceReports);
        
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
        
        // --- DASHBOARD TAB (CONTINUED) ---
        const description = profile.description || 'No description available.';
        profileDisplayContainer.innerHTML = `<h3 class="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Company Overview</h3><p class="text-sm text-gray-700">${description}</p>`;
        
        const metrics = renderGarpScorecardDashboard(garpScorecardContainer, ticker, fmpData);
        renderGarpInterpretationAnalysis(garpScorecardContainer, metrics);
        renderValuationHealthDashboard(document.getElementById('valuation-health-container'), ticker, fmpData);
        renderGarpAnalysisSummary(document.getElementById('ai-garp-summary-container'), ticker);
        
        const peerDocRef = state.db.collection(CONSTANTS.DB_COLLECTION_FMP_CACHE).doc(ticker).collection('analysis').doc('peer_comparison');
        const peerDocSnap = await peerDocRef.get();
        const peerHelpIcon = `<button data-report-type="PeerComparison" class="ai-help-button p-1 rounded-full hover:bg-indigo-100" title="What is this?"><svg class="w-5 h-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"></path></svg></button>`;

        peerAnalysisContainer.innerHTML = `
            <div class="flex justify-between items-center mb-4 border-b pb-2">
                <div class="flex items-center gap-2">
                    <h3 class="text-xl font-bold text-gray-800">Peer Comparison</h3>
                    ${peerHelpIcon}
                </div>
            </div>
            <div id="peer-analysis-content-container">
                <p class="text-gray-500 italic">Enter comma-separated tickers below and click "Analyze Peers" to build a comparison table.</p>
            </div>
            <div id="manual-peer-entry-container" class="mt-4 pt-4 border-t">
                <label for="manual-peer-input" class="block text-sm font-medium text-gray-700">Enter Comma-Separated Peer Tickers:</label>
                <textarea id="manual-peer-input" rows="2" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 uppercase" placeholder="e.g., PEP, KOF, CCEP"></textarea>
                <div class="mt-2 text-right">
                    <button id="analyze-manual-peers-button" data-ticker="${ticker}" class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-1 px-4 rounded-lg text-sm">Analyze Peers</button>
                </div>
            </div>
        `;


        if (savedCandidacyReports.length > 0) {
            const latestReport = savedCandidacyReports[0];
            const resultContainer = document.getElementById('garp-analysis-container');
            const statusContainer = document.getElementById('garp-candidacy-status-container');
            
            updateGarpCandidacyStatus(statusContainer, savedCandidacyReports, latestReport.id, ticker);

            const savedDate = latestReport.savedAt.toDate().toLocaleString();
            const tempContainer = document.createElement('div');
            renderCandidacyAnalysis(tempContainer, latestReport.content, latestReport.prompt, latestReport.diligenceQuestions);
            const accordionContent = tempContainer.innerHTML;

            resultContainer.innerHTML = `
                <details class="border rounded-md bg-gray-50/50">
                    <summary class="p-3 font-semibold text-gray-700 cursor-pointer hover:bg-gray-100">
                        View Latest Saved Report (from ${savedDate})
                    </summary>
                    <div class="p-4 border-t bg-white">
                        ${accordionContent}
                    </div>
                </details>
            `;
        }

    } catch (error) {
        console.error('Error opening raw data viewer:', error);
        titleEl.textContent = `Error Loading Data for ${ticker}`;
        document.getElementById('ai-article-container-analysis').innerHTML = `<p class="text-red-500 text-center">${error.message}</p>`;
        document.getElementById('company-profile-display-container').innerHTML = `<p class="text-red-500 text-center">${error.message}</p>`;
    }
}
