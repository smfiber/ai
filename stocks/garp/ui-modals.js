import { CONSTANTS, state, ANALYSIS_ICONS } from './config.js';
import { getFmpStockData, getGroupedFmpData } from './api.js';
import { renderValuationHealthDashboard, _renderGroupedStockList, renderPortfolioManagerList, renderGarpScorecardDashboard, renderGarpAnalysisSummary, updateGarpCandidacyStatus, renderCandidacyAnalysis, renderGarpInterpretationAnalysis } from './ui-render.js'; 
import { getDocs, query, collection, where } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
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
export function displayMessageInModal(message, type = 'info', duration = 4000) {
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
    
    titleEl.textContent = `Analyzing ${ticker}...`;
    rawDataContainer.innerHTML = '<div class="loader mx-auto"></div>';
    aiButtonsContainer.innerHTML = '';
    aiArticleContainer.innerHTML = '';
    profileDisplayContainer.innerHTML = '';
    garpScorecardContainer.innerHTML = '';
    garpInterpretationContainer.innerHTML = '';
    document.getElementById('valuation-health-container').innerHTML = '';
    document.getElementById('ai-garp-summary-container').innerHTML = '';
    
    // Reset tabs to default state
    document.querySelectorAll('#rawDataViewerModal .tab-content').forEach(c => c.classList.add('hidden'));
    document.querySelectorAll('#rawDataViewerModal .tab-button').forEach(b => {
        b.classList.remove('active');
        b.removeAttribute('data-loaded');
    });
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
        const profile = fmpData.profile[0];
        
        titleEl.textContent = `Analysis for ${ticker}`;

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

        const prerequisiteButtons = [
            { reportType: 'FinancialAnalysis', text: 'Financial Analysis', tooltip: 'Deep dive into financial statements, ratios, and health.' },
            { reportType: 'GarpAnalysis', text: 'GARP Analysis', tooltip: 'Growth at a Reasonable Price. Is the valuation justified by its growth?' },
            { reportType: 'MoatAnalysis', text: 'Moat Analysis', tooltip: 'Evaluates the company\'s competitive advantages.' },
            { reportType: 'RiskAssessment', text: 'Risk Assessment', tooltip: 'Identifies potential financial, market, and business risks.' },
            { reportType: 'CapitalAllocators', text: 'Capital Allocators', tooltip: 'Assesses management\'s skill in deploying capital.' },
        ];
        
        const buildButtonHtml = (buttons) => buttons.map((btn) => {
             const hasSaved = savedReportTypes.has(btn.reportType) ? 'has-saved-report' : '';
             const icon = ANALYSIS_ICONS[btn.reportType] || '';
             return `<button data-symbol="${ticker}" data-report-type="${btn.reportType}" class="ai-analysis-button analysis-tile ${hasSaved}" data-tooltip="${btn.tooltip}">
                         ${icon}
                         <span class="tile-name">${btn.text}</span>
                     </button>`;
        }).join('');
        
        const prerequisiteHtml = buildButtonHtml(prerequisiteButtons);
            
        const generateAllBtn = `<button data-symbol="${ticker}" id="generate-all-reports-button" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">Generate All Prerequisites</button>`;
        const garpMemoBtn = `<button data-symbol="${ticker}" id="investment-memo-button" class="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-base">Generate GARP Memo</button>`;

        aiButtonsContainer.innerHTML = `
            <div class="space-y-8">
                <div>
                    <h3 class="text-lg font-bold text-gray-700 text-center mb-4">Step 1: Generate Prerequisite Reports</h3>
                    <div class="flex flex-wrap gap-2 justify-center">${prerequisiteHtml}</div>
                    <div class="text-center mt-4">${generateAllBtn}</div>
                </div>
                <div>
                    <h3 class="text-lg font-bold text-gray-700 text-center mb-4">Step 2: Synthesize Final Memo</h3>
                     <div class="flex justify-center">${garpMemoBtn}</div>
                </div>
            </div>
        `;
        
        const description = profile.description || 'No description available.';
        profileDisplayContainer.innerHTML = `<div class="mt-6 border-t pt-4"><p class="text-sm text-gray-700 mb-4">${description}</p></div>`;
        
        // Render Dashboard tab content
        const metrics = renderGarpScorecardDashboard(garpScorecardContainer, ticker, fmpData);
        renderGarpInterpretationAnalysis(garpInterpretationContainer, metrics);
        renderValuationHealthDashboard(document.getElementById('valuation-health-container'), ticker, fmpData);
        renderGarpAnalysisSummary(document.getElementById('ai-garp-summary-container'), ticker);

        // If saved candidacy reports exist, load the latest one
        if (savedCandidacyReports.length > 0) {
            const latestReport = savedCandidacyReports[0];
            const resultContainer = document.getElementById('garp-analysis-container');
            renderCandidacyAnalysis(resultContainer, latestReport.content, latestReport.prompt);
            updateGarpCandidacyStatus(document.getElementById('garp-candidacy-status-container'), savedCandidacyReports, latestReport.id, ticker);
        }

    } catch (error) {
        console.error('Error opening raw data viewer:', error);
        titleEl.textContent = `Error Loading Data for ${ticker}`;
        aiArticleContainer.innerHTML = `<p class="text-red-500 text-center">${error.message}</p>`;
        profileDisplayContainer.innerHTML = `<p class="text-red-500 text-center">${error.message}</p>`;
    }
}
