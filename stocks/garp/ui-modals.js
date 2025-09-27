import { CONSTANTS, state, ANALYSIS_ICONS } from './config.js';
import { getFmpStockData, getGroupedFmpData } from './api.js';
import { renderValuationHealthDashboard, _renderGroupedStockList, renderPortfolioManagerList, renderGarpScorecardDashboard, renderGarpInterpretationAnalysis, updateGarpCandidacyStatus, renderCandidacyAnalysis, renderGarpAnalysisSummary, renderDiligenceLog, renderPeerComparisonTable } from './ui-render.js'; 
import { getDocs, query, collection, where, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
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

    // --- New Transaction Logic ---
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

    // Populate with existing transactions or create a backward-compatible entry
    if (stockData.transactions && stockData.transactions.length > 0) {
        stockData.transactions.forEach(addTransactionRow);
    } else if (stockData.purchaseDate || stockData.shares || stockData.costPerShare) {
        // Backward compatibility for old single-entry data
        addTransactionRow({ 
            date: stockData.purchaseDate, 
            shares: stockData.shares, 
            costPerShare: stockData.costPerShare 
        });
    } else {
        // Add one blank row for a new stock
        addTransactionRow();
    }

    // Event listeners for the Add/Remove buttons
    const addButton = document.getElementById('add-transaction-button');
    const newAddButton = addButton.cloneNode(true); // Remove old listeners
    addButton.parentNode.replaceChild(newAddButton, addButton);
    newAddButton.addEventListener('click', () => addTransactionRow());

    transactionContainer.addEventListener('click', (e) => {
        if (e.target.closest('.remove-transaction-button')) {
            e.target.closest('.transaction-row').remove();
        }
    });

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


/**
 * Opens a dedicated warning modal when a critical diligence question has not been answered.
 * @param {string} ticker The stock ticker.
 * @param {Array<object>} questions The list of unanswered diligence questions.
 * @param {function} onConfirm The callback to execute if the user chooses to proceed.
 */
export function openDiligenceWarningModal(ticker, questions, onConfirm) {
    const modal = document.getElementById(CONSTANTS.MODAL_CONFIRMATION);
    const titleEl = document.getElementById('confirmation-title');
    const messageEl = document.getElementById('confirmation-message');
    const confirmButton = document.getElementById('confirm-button');
    const cancelButton = document.getElementById('cancel-button');
    
    titleEl.textContent = `Warning: Unanswered Diligence for ${ticker}`;
    
    let questionsHtml = questions.map(q => `
        <li class="p-2 border-b last:border-b-0 text-left text-sm font-medium text-gray-700">
            ${q.humanQuestion}
        </li>
    `).join('');

    messageEl.innerHTML = `
        <p class="text-gray-500 mb-4">
            The initial GARP analysis identified a hyper-growth metric that requires investigation.
            The following critical questions have not yet been answered in the diligence log.
            Generating the Investment Memo now without this information is not recommended.
        </p>
        <ul class="bg-gray-100 p-3 rounded-lg border border-gray-200 divide-y divide-gray-200">
            ${questionsHtml}
        </ul>
    `;
    
    confirmButton.textContent = 'Continue Anyway';
    confirmButton.classList.remove('bg-red-600', 'hover:bg-red-700');
    confirmButton.classList.add('bg-orange-500', 'hover:bg-orange-600');
    
    cancelButton.textContent = 'Go Back to Diligence';
    cancelButton.classList.remove('bg-gray-200', 'hover:bg-gray-300');
    cancelButton.classList.add('bg-indigo-600', 'hover:bg-indigo-700', 'text-white');

    const newConfirmButton = confirmButton.cloneNode(true);
    const newCancelButton = cancelButton.cloneNode(true);
    confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);
    cancelButton.parentNode.replaceChild(newCancelButton, cancelButton);

    newConfirmButton.addEventListener('click', () => {
        closeModal(CONSTANTS.MODAL_CONFIRMATION);
        onConfirm();
    }, { once: true });
    
    newCancelButton.addEventListener('click', () => {
        closeModal(CONSTANTS.MODAL_CONFIRMATION);
    }, { once: true });

    openModal(CONSTANTS.MODAL_CONFIRMATION);
}


// --- SPECIFIC, COMPLEX MODAL CONTROLLERS ---

export const STRUCTURED_DILIGENCE_QUESTIONS = {
    'Financial Analysis': "Based on this data, is the company's financial story one of high-quality, durable growth, or are there signs of weakening fundamentals? Analyze the relationship between its revenue trend, margin stability, and cash flow quality to form a verdict.",
    'Balance Sheet': "Does the balance sheet represent a fortress capable of funding future growth, or a potential risk? Evaluate its debt-to-equity ratio and current ratio against its peers to determine if its financial health is a competitive advantage or a liability.",
    'Income Statement': "Analyze the income statement for signs of improving operational efficiency. Is the company demonstrating operating leverage (i.e., are earnings growing faster than revenue)? Compare its net profit margin trend to its competitors.",
    'Cash Flow': "Evaluate management's effectiveness as capital allocators. Based on the cash flow statement, are they reinvesting capital effectively to drive growth, or are they returning it to shareholders? Crucially, compare the Return on Invested Capital (ROIC) to its historical trend and its peers to judge their skill.",
    'Valuation': "Is the company's current valuation reasonable relative to its growth prospects? Analyze its PEG ratio and compare its current P/E ratio to both its own 5-year historical average and the industry average to determine if we have a margin of safety."
};

export async function openRawDataViewer(ticker) {
    const modalId = 'rawDataViewerModal';
    openModal(modalId);

    const modal = document.getElementById(modalId);
    modal.dataset.activeTicker = ticker; // Store ticker for later use
    
    const rawDataContainer = document.getElementById('raw-data-accordion-container');
    const aiButtonsContainer = document.getElementById('ai-buttons-container');
    const aiArticleContainer = document.getElementById('ai-article-container');
    const profileDisplayContainer = document.getElementById('company-profile-display-container');
    const titleEl = document.getElementById('raw-data-viewer-modal-title');
    const garpScorecardContainer = document.getElementById('garp-scorecard-container');
    const garpInterpretationContainer = document.getElementById('garp-interpretation-container');
    const positionAnalysisTabButton = document.querySelector('.tab-button[data-tab="position-analysis"]');
    const positionAnalysisContainer = document.getElementById('position-analysis-content-container');
    const peerAnalysisContainer = document.getElementById('peer-analysis-section-container');
    
    titleEl.textContent = `Analyzing ${ticker}...`;
    rawDataContainer.innerHTML = '<div class="loader mx-auto"></div>';
    aiButtonsContainer.innerHTML = '';
    aiArticleContainer.innerHTML = '';
    profileDisplayContainer.innerHTML = '';
    garpScorecardContainer.innerHTML = '';
    garpInterpretationContainer.innerHTML = '';
    positionAnalysisContainer.innerHTML = '';
    peerAnalysisContainer.innerHTML = '';
    document.getElementById('valuation-health-container').innerHTML = '';
    document.getElementById('ai-garp-summary-container').innerHTML = '';
    
    // Reset tabs to default state
    document.querySelectorAll('#rawDataViewerModal .tab-content').forEach(c => c.classList.add('hidden'));
    document.querySelectorAll('#rawDataViewerModal .tab-button').forEach(b => {
        b.classList.remove('active');
        b.removeAttribute('data-loaded');
    });
    positionAnalysisTabButton.classList.add('hidden');
    document.getElementById('dashboard-tab').classList.remove('hidden');
    document.querySelector('.tab-button[data-tab="dashboard"]').classList.add('active');

    try {
        const fmpDataPromise = getFmpStockData(ticker);
        const groupedDataPromise = getGroupedFmpData(ticker);
        const savedReportsPromise = getDocs(query(collection(state.db, CONSTANTS.DB_COLLECTION_AI_REPORTS), where("ticker", "==", ticker)));
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
        
        titleEl.textContent = `Analysis for ${ticker}`;
        const helpIconHtml = `<button data-report-type="PositionAnalysis" class="ai-help-button p-1 rounded-full hover:bg-indigo-100" title="What is this?"><svg class="w-5 h-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg></button>`;

        // Conditionally show and populate the Position Analysis tab
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

        let accordionHtml = '';
        if (groupedFmpData) {
            const sortedKeys = Object.keys(groupedFmpData).sort();
            for (const key of sortedKeys) {
                accordionHtml += `
                    <details class="mb-2 bg-white rounded-lg border">
                        <summary class="p-3 font-semibold text-gray-700 cursor-pointer hover:bg-gray-50">${key.replace(/_/g, ' ')}</summary>
                        <pre class="text-xs whitespace-pre-wrap break-all bg-gray-900 text-white p-3 rounded-b-lg">${JSON.stringify(groupedFmpData[key], null, 2)}</pre>
                    </details>
                `;
            }
            rawDataContainer.innerHTML = accordionHtml;
        } else {
             rawDataContainer.innerHTML = '<p class="text-center text-gray-500 py-8">Could not load grouped raw data.</p>';
        }

        const deepDiveButtons = [
            { reportType: 'FinancialAnalysis', text: 'Financial Analysis', tooltip: 'Deep dive into financial statements, ratios, and health.' },
            { reportType: 'GarpAnalysis', text: 'GARP Analysis', tooltip: 'Growth at a Reasonable Price. Is the valuation justified by its growth?' },
            { reportType: 'MoatAnalysis', text: 'Moat Analysis', tooltip: 'Evaluates the company\'s competitive advantages.' },
            { reportType: 'RiskAssessment', text: 'Risk Assessment', tooltip: 'Identifies potential financial, market, and business risks.' },
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
            
        const candidacyBtn = `<button data-symbol="${ticker}" data-report-type="GarpCandidacy" class="generate-candidacy-button bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg text-base">Generate GARP Candidacy Report</button>`;
        const generateAllBtn = `<button data-symbol="${ticker}" id="generate-all-reports-button" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Generate All Deep Dives</button>`;
        const garpMemoBtn = `<button data-symbol="${ticker}" id="investment-memo-button" data-report-type="InvestmentMemo" class="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-base">Generate GARP Memo</button>`;
        
        const diligenceLogContainerHtml = `<div id="diligence-log-container" class="mb-6 text-left"></div>`;

        // --- NEW STRUCTURED DILIGENCE HTML ---
        let structuredDiligenceHtml = `
            <div class="text-left mt-4 border rounded-lg p-4 bg-gray-50">
                <h4 class="text-base font-semibold text-gray-800 mb-1">Structured Diligence</h4>
                <p class="text-sm text-gray-500 mb-4">Answer these core questions to build a foundational thesis.</p>
                <div id="structured-diligence-container" class="space-y-4">
        `;
        for (const [category, question] of Object.entries(STRUCTURED_DILIGENCE_QUESTIONS)) {
            structuredDiligenceHtml += `
                <div class="diligence-card p-3 bg-white rounded-lg border border-gray-200">
                    <h5 class="font-semibold text-sm text-indigo-700 mb-2">${category}</h5>
                    <p class="text-xs text-gray-600 mb-2 italic">"${question}"</p>
                    <textarea class="structured-diligence-answer w-full border border-gray-300 rounded-lg p-2 text-sm" 
                              rows="4" 
                              data-category="${category}"
                              placeholder="Your analysis and findings here..."></textarea>
                </div>
            `;
        }
        structuredDiligenceHtml += `
                </div>
                <div class="text-right mt-4">
                    <button id="save-structured-diligence-button" class="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg">Save Structured Answers</button>
                </div>
            </div>
        `;

        // --- EXISTING MANUAL DILIGENCE HTML ---
        const manualDiligenceHtml = `
            <div class="text-left mt-6 pt-6 border-t">
                <div class="flex justify-between items-center mb-4">
                    <div>
                        <h4 class="text-base font-semibold text-gray-800">Manual Diligence Entry</h4>
                        <p class="text-sm text-gray-500">Add custom questions and answers to the log.</p>
                    </div>
                    <button id="add-diligence-entry-button" class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg text-sm">Add New Q&A</button>
                </div>
                <div id="manual-diligence-entries-container" class="space-y-4"></div>
                <div class="text-right mt-4">
                     <button id="save-manual-diligence-button" class="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg">Save Manual Entries</button>
                </div>
            </div>
        `;

        aiButtonsContainer.innerHTML = `
            <div class="space-y-8 text-center bg-gray-50 p-4 rounded-lg">
                <div class="p-4 bg-white rounded-lg border shadow-sm">
                    <div class="flex justify-center items-center gap-2 mb-4">
                        <h3 class="text-lg font-bold text-gray-800">Step 1: Initial Assessment (Required)</h3>
                        <button data-report-type="GarpCandidacy" class="ai-help-button p-1 rounded-full hover:bg-indigo-100" title="What is this?"><svg class="w-5 h-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg></button>
                    </div>
                    <div class="flex justify-center">${candidacyBtn}</div>
                </div>

                <div class="p-4 bg-white rounded-lg border shadow-sm">
                    <h3 class="text-lg font-bold text-gray-800 mb-4">Step 2: Deep Dive Analysis (Optional)</h3>
                    <p class="text-sm text-gray-500 mb-4">Generate these reports for more detail after a promising candidacy assessment.</p>
                    <div class="flex flex-wrap gap-4 justify-center">${deepDiveHtml}</div>
                    <div class="text-center mt-4">${generateAllBtn}</div>
                </div>

                <div class="p-4 bg-white rounded-lg border shadow-sm">
                    <div class="flex justify-center items-center gap-2 mb-4">
                        <h3 class="text-lg font-bold text-gray-800">Step 3: Diligence Investigation</h3>
                    </div>
                    ${diligenceLogContainerHtml}
                    ${structuredDiligenceHtml}
                    ${manualDiligenceHtml}
                </div>

                <div class="p-4 bg-white rounded-lg border shadow-sm">
                    <div class="flex justify-center items-center gap-2 mb-4">
                        <h3 class="text-lg font-bold text-gray-800">Step 4: Synthesize Final Memo</h3>
                        <button data-report-type="InvestmentMemo" class="ai-help-button p-1 rounded-full hover:bg-indigo-100" title="What is this?"><svg class="w-5 h-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></button>
                    </div>
                    <div class="flex justify-center">${garpMemoBtn}</div>
                </div>
            </div>
        `;

        const addDiligenceEntryRow = () => {
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
        };
        
        const addBtn = document.getElementById('add-diligence-entry-button');
        if (addBtn) {
            addBtn.addEventListener('click', addDiligenceEntryRow);
        }

        const entriesContainer = document.getElementById('manual-diligence-entries-container');
        if (entriesContainer) {
            entriesContainer.addEventListener('click', (e) => {
                const deleteBtn = e.target.closest('.delete-diligence-entry-button');
                if (deleteBtn) {
                    deleteBtn.closest('.diligence-entry-row').remove();
                }
            });
        }
        
        const diligenceReports = allSavedReports.filter(r => r.reportType === 'DiligenceInvestigation');
        const diligenceLogContainer = document.getElementById('diligence-log-container');
        if (diligenceLogContainer) {
            renderDiligenceLog(diligenceLogContainer, diligenceReports);
        }

        const description = profile.description || 'No description available.';
        profileDisplayContainer.innerHTML = `<h3 class="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Company Overview</h3><p class="text-sm text-gray-700">${description}</p>`;
        
        const metrics = renderGarpScorecardDashboard(garpScorecardContainer, ticker, fmpData);
        renderGarpInterpretationAnalysis(garpInterpretationContainer, metrics);
        renderValuationHealthDashboard(document.getElementById('valuation-health-container'), ticker, fmpData);
        renderGarpAnalysisSummary(document.getElementById('ai-garp-summary-container'), ticker);
        
        const peerDocRef = doc(state.db, CONSTANTS.DB_COLLECTION_FMP_CACHE, ticker, 'analysis', 'peer_comparison');
        const peerDocSnap = await getDoc(peerDocRef);
        const peerHelpIcon = `<button data-report-type="PeerComparison" class="ai-help-button p-1 rounded-full hover:bg-indigo-100" title="What is this?"><svg class="w-5 h-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"></path></svg></button>`;
        const initialPeerHtml = `
            <div class="flex justify-between items-center mb-4 border-b pb-2">
                 <div class="flex items-center gap-2">
                    <h3 class="text-xl font-bold text-gray-800">Peer Comparison</h3>
                    ${peerHelpIcon}
                </div>
                <button id="fetch-peer-analysis-button" data-ticker="${ticker}" class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-1 px-4 rounded-lg text-sm">
                    Fetch Peer Data
                </button>
            </div>
            <div id="peer-analysis-content-container">
                <p class="text-gray-500 italic">Click the button to identify competitors and compare key metrics.</p>
            </div>
            <div id="manual-peer-entry-container" class="hidden mt-4 pt-4 border-t">
                <label for="manual-peer-input" class="block text-sm font-medium text-gray-700">Enter comma-separated peer tickers:</label>
                <textarea id="manual-peer-input" rows="2" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 uppercase" placeholder="e.g., MSFT, AMZN, META"></textarea>
                <div class="mt-2 text-right">
                    <button id="analyze-manual-peers-button" data-ticker="${ticker}" class="bg-green-600 hover:bg-green-700 text-white font-semibold py-1 px-3 rounded-lg text-sm">Analyze Manual Peers</button>
                </div>
            </div>
        `;

        if (peerDocSnap.exists()) {
            const peerData = peerDocSnap.data();
            peerAnalysisContainer.innerHTML = `
                <div class="flex justify-between items-center mb-4 border-b pb-2">
                    <div class="flex items-center gap-2">
                        <h3 class="text-xl font-bold text-gray-800">Peer Comparison</h3>
                        ${peerHelpIcon}
                    </div>
                    <button id="fetch-peer-analysis-button" data-ticker="${ticker}" class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-1 px-4 rounded-lg text-sm">
                        Refresh Peer Data
                    </button>
                </div>
                <div id="peer-analysis-content-container"></div>
                <div id="manual-peer-entry-container" class="hidden mt-4 pt-4 border-t">
                     <label for="manual-peer-input" class="block text-sm font-medium text-gray-700">Enter comma-separated peer tickers:</label>
                     <textarea id="manual-peer-input" rows="2" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 uppercase" placeholder="e.g., MSFT, AMZN, META"></textarea>
                     <div class="mt-2 text-right">
                         <button id="analyze-manual-peers-button" data-ticker="${ticker}" class="bg-green-600 hover:bg-green-700 text-white font-semibold py-1 px-3 rounded-lg text-sm">Analyze Manual Peers</button>
                     </div>
                </div>
            `;
            const contentContainer = peerAnalysisContainer.querySelector('#peer-analysis-content-container');
            renderPeerComparisonTable(contentContainer, ticker, metrics, peerData);
        } else {
            peerAnalysisContainer.innerHTML = initialPeerHtml;
        }


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
        aiArticleContainer.innerHTML = `<p class="text-red-500 text-center">${error.message}</p>`;
        profileDisplayContainer.innerHTML = `<p class="text-red-500 text-center">${error.message}</p>`;
    }
}
