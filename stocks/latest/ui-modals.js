import { CONSTANTS, state, ANALYSIS_ICONS } from './config.js';
import { getFmpStockData, getGroupedFmpData } from './api.js';
// ADD THIS IMPORT to get the list rendering function
import { renderValuationHealthDashboard, renderThesisTracker, _renderGroupedStockList } from './ui-render.js'; 
import { getDocs, query, collection, where } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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
    document.getElementById('manage-stock-status').value = stockData.status || 'Watchlist';
    
    const deleteButton = document.getElementById('delete-stock-button');
    deleteButton.style.display = stockData.isEditMode ? 'block' : 'none';

    openModal(CONSTANTS.MODAL_MANAGE_STOCK);
}

/**
 * Opens the "Portfolio & Watchlist Manager" modal.
 */
export function openPortfolioManagerModal() {
    openModal(CONSTANTS.MODAL_PORTFOLIO_MANAGER);
}

/**
 * Opens the "View FMP Data" modal.
 * @param {string} symbol The stock ticker symbol.
 */
export function openViewFmpDataModal(symbol) {
    openModal(CONSTANTS.MODAL_VIEW_FMP_DATA);
}

/**
 * Opens the "Manage FMP Endpoints" modal.
 */
export function openManageFmpEndpointsModal() {
    openModal(CONSTANTS.MODAL_MANAGE_FMP_ENDPOINTS);
}

/**
 * Opens the "Manage Broad API Endpoints" modal.
 */
export function openManageBroadEndpointsModal() {
    openModal(CONSTANTS.MODAL_MANAGE_BROAD_ENDPOINTS);
}

// --- REVISED FUNCTION ---
/**
 * Opens a modal displaying a list of stocks, fetches their data, and renders the list.
 * @param {string} listType The type of list to display (e.g., 'Portfolio', 'Watchlist').
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
 * Opens the "Session Log" modal.
 */
export function openSessionLogModal() {
    openModal(CONSTANTS.MODAL_SESSION_LOG);
}

/**
 * Opens the "Thesis Tracker" modal.
 * @param {string} ticker The stock ticker symbol.
 */
export function openThesisTrackerModal(ticker) {
    openModal('thesisTrackerModal');
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
    
    titleEl.textContent = `Analyzing ${ticker}...`;
    rawDataContainer.innerHTML = '<div class="loader mx-auto"></div>';
    aiButtonsContainer.innerHTML = '';
    aiArticleContainer.innerHTML = '';
    profileDisplayContainer.innerHTML = '';
    document.getElementById('valuation-health-container').innerHTML = '';
    document.getElementById('thesis-tracker-container').innerHTML = '';
    
    // Reset SEC tab content to loading placeholders
    document.getElementById('insider-trading-container').innerHTML = `<h3 class="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Recent Insider Activity (Form 4)</h3><div class="content-placeholder text-center text-gray-500 py-8">Loading...</div>`;
    document.getElementById('institutional-ownership-container').innerHTML = `<h3 class="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Top Institutional Holders (13F)</h3><div class="content-placeholder text-center text-gray-500 py-8">Loading...</div>`;
    document.getElementById('material-events-container').innerHTML = `<h3 class="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Recent Material Events (8-K)</h3><div class="content-placeholder text-center text-gray-500 py-8">Loading...</div>`;
    document.getElementById('annual-reports-container').innerHTML = `<h3 class="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Recent Annual Reports (10-K)</h3><div class="content-placeholder text-center text-gray-500 py-8">Loading...</div>`;
    document.getElementById('quarterly-reports-container').innerHTML = `<h3 class="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Recent Quarterly Reports (10-Q)</h3><div class="content-placeholder text-center text-gray-500 py-8">Loading...</div>`;

    // Reset 8-K, 10-K, and 10-Q tabs
    const eightKTab = document.getElementById('form-8k-analysis-tab');
    if (eightKTab) {
        eightKTab.querySelector('#recent-8k-list').innerHTML = '<div class="content-placeholder text-center text-gray-500 py-8">Loading...</div>';
        eightKTab.querySelector('#latest-saved-8k-container').innerHTML = '<div class="content-placeholder text-center text-gray-500 py-8">No filing text has been saved yet.</div>';
        eightKTab.querySelector('#ai-article-container-8k').innerHTML = '';
        eightKTab.querySelector('#report-status-container-8k').classList.add('hidden');
        eightKTab.querySelector('#analyze-latest-8k-button').disabled = true;
        const form8k = eightKTab.querySelector('#manual-8k-form');
        if (form8k) form8k.reset();
    }
    const tenKTab = document.getElementById('form-10k-analysis-tab');
    if (tenKTab) {
        tenKTab.querySelector('#recent-10k-list').innerHTML = '<div class="content-placeholder text-center text-gray-500 py-8">Loading...</div>';
        tenKTab.querySelector('#latest-saved-10k-container').innerHTML = '<div class="content-placeholder text-center text-gray-500 py-8">No filing text has been saved yet.</div>';
        tenKTab.querySelector('#ai-article-container-10k').innerHTML = '';
        tenKTab.querySelector('#report-status-container-10k').classList.add('hidden');
        tenKTab.querySelector('#analyze-latest-10k-button').disabled = true;
        const form10k = tenKTab.querySelector('#manual-10k-form');
        if (form10k) form10k.reset();
    }
    const tenQTab = document.getElementById('form-10q-analysis-tab');
    if (tenQTab) {
        tenQTab.querySelector('#recent-10q-list').innerHTML = '<div class="content-placeholder text-center text-gray-500 py-8">Loading...</div>';
        tenQTab.querySelector('#latest-saved-10q-container').innerHTML = '<div class="content-placeholder text-center text-gray-500 py-8">No filing text has been saved yet.</div>';
        tenQTab.querySelector('#ai-article-container-10q').innerHTML = '';
        tenQTab.querySelector('#report-status-container-10q').classList.add('hidden');
        tenQTab.querySelector('#analyze-latest-10q-button').disabled = true;
        const form10q = tenQTab.querySelector('#manual-10q-form');
        if (form10q) form10q.reset();
    }

    // Reset tabs to default state
    document.querySelectorAll('#rawDataViewerModal .tab-content').forEach(c => c.classList.add('hidden'));
    document.querySelectorAll('#rawDataViewerModal .tab-button').forEach(b => {
        b.classList.remove('active');
        b.removeAttribute('data-loaded'); // Clear loaded state for lazy loading
    });
    document.getElementById('dashboard-tab').classList.remove('hidden');
    document.querySelector('.tab-button[data-tab="dashboard"]').classList.add('active');

    try {
        const fmpDataPromise = getFmpStockData(ticker);
        const groupedDataPromise = getGroupedFmpData(ticker);
        const savedReportsPromise = getDocs(query(collection(state.db, CONSTANTS.DB_COLLECTION_AI_REPORTS), where("ticker", "==", ticker)));

        const [fmpData, groupedFmpData, savedReportsSnapshot] = await Promise.all([fmpDataPromise, groupedDataPromise, savedReportsPromise]);

        if (!fmpData || !fmpData.profile || fmpData.profile.length === 0) {
            closeModal(modalId);
            displayMessageInModal(
                `Crucial data is missing for ${ticker}. This usually means it needs to be fetched from the FMP service.\n\nPlease go to the stock list and use the "Refresh" button for this stock, then try viewing it again.`,
                'warning'
            );
            return;
        }

        const savedReportTypes = new Set(savedReportsSnapshot.docs.map(doc => doc.data().reportType));
        const profile = fmpData.profile[0];
        
        titleEl.textContent = `Analysis for ${ticker}`;

        // Build nested accordions for raw data
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

        // --- START OF UI REFACTOR ---

        // Build individual analysis tile buttons
        const quantButtons = [
            { reportType: 'FinancialAnalysis', text: 'Financial Analysis', tooltip: 'Deep dive into financial statements, ratios, and health.' },
            { reportType: 'UndervaluedAnalysis', text: 'Undervalued', tooltip: 'Assess if the stock is a potential bargain based on valuation metrics.' },
            { reportType: 'GarpAnalysis', text: 'GARP', tooltip: 'Growth at a Reasonable Price. Is the valuation justified by its growth?' },
            { reportType: 'MoatAnalysis', text: 'Moat Analysis', tooltip: 'Evaluates the company\'s competitive advantages.' },
            { reportType: 'RiskAssessment', text: 'Risk Assessment', tooltip: 'Identifies potential financial, market, and business risks.' },
            { reportType: 'BullVsBear', text: 'Bull vs. Bear', tooltip: 'Presents both the positive and negative investment arguments.' },
        ];
        const narrativeButtons = [
            { reportType: 'StockFortress', text: 'The Fortress', tooltip: 'Is this a resilient, all-weather business with a rock-solid balance sheet?' },
            { reportType: 'StockDisruptor', text: 'The Disruptor', tooltip: 'Is this a high-growth innovator with potential to redefine its industry?' },
            { reportType: 'StockPhoenix', text: 'The Phoenix', tooltip: 'Is this a fallen angel showing credible signs of a business turnaround?' },
            { reportType: 'StockLinchpin', text: 'The Linchpin', tooltip: 'Does this company control a vital, irreplaceable choke point in its industry?' },
            { reportType: 'StockUntouchables', text: 'The Untouchables', tooltip: 'Analyzes the power of a "cult" brand and its translation to durable profits.' },
        ];
        const specializedButtons = [
             { reportType: 'CapitalAllocators', text: 'Capital Allocators', tooltip: 'Assesses management\'s skill in deploying capital.' },
             { reportType: 'GrowthOutlook', text: 'Growth Outlook', tooltip: 'Analyzes the company\'s future growth potential.' },
             { reportType: 'NarrativeCatalyst', text: 'Catalysts', tooltip: 'Identifies the investment story and future catalysts.' },
        ];
        
        const buildButtonHtml = (buttons) => buttons.map((btn) => {
             const hasSaved = savedReportTypes.has(btn.reportType) ? 'has-saved-report' : '';
             const icon = ANALYSIS_ICONS[btn.reportType] || '';
             return `<button data-symbol="${ticker}" data-report-type="${btn.reportType}" class="ai-analysis-button analysis-tile ${hasSaved}" data-tooltip="${btn.tooltip}">
                         ${icon}
                         <span class="tile-name">${btn.text}</span>
                     </button>`;
        }).join('');
        
        const quantHtml = buildButtonHtml(quantButtons);
        const narrativeHtml = buildButtonHtml(narrativeButtons);
        const specializedHtml = buildButtonHtml(specializedButtons);

        // Define the main workflow buttons
        const peerAnalysisBtn = `
            <button data-symbol="${ticker}" data-report-type="CompetitiveLandscape" class="ai-analysis-button bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg text-base" data-tooltip="How does this company stack up against its main competitors?">
                ${ANALYSIS_ICONS['CompetitiveLandscape']}
                Run Peer Analysis
            </button>`;
            
        const generateAllBtn = `
            <button data-symbol="${ticker}" id="generate-all-reports-button" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg text-base" data-tooltip="Generates all 10 core analysis reports and saves them to the database in a single, efficient batch.">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12l3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                Generate Reports for GARP Analysis
            </button>`;

        const garpValidationBtn = `
            <button data-symbol="${ticker}" id="garp-validation-button" class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg text-base" data-tooltip="Synthesizes GARP, Financial, and Risk reports into a final verdict. Requires these 3 analyses to be saved first.">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                GARP Validation Report
            </button>`;
            
        const investmentMemoBtn = `
            <button data-symbol="${ticker}" id="investment-memo-button" class="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg text-base" data-tooltip="Synthesizes all other reports into a final verdict. Requires all other analyses to be saved first.">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Generate GARP Memo
            </button>`;

        // Assemble the new single-column guided workflow layout
        aiButtonsContainer.innerHTML = `
            <div class="space-y-10">
                <div>
                    <div class="relative text-center mb-4">
                        <span class="absolute inset-x-0 top-1/2 h-px bg-gray-200" aria-hidden="true"></span>
                        <span class="relative bg-white px-4 text-sm font-bold text-gray-500 uppercase">Step 1: Start with the Competitive Landscape</span>
                    </div>
                    <div class="flex justify-center">${peerAnalysisBtn}</div>
                </div>

                <div>
                    <div class="relative text-center mb-6">
                        <span class="absolute inset-x-0 top-1/2 h-px bg-gray-200" aria-hidden="true"></span>
                        <span class="relative bg-white px-4 text-sm font-bold text-gray-500 uppercase">Step 2: Perform a Deep Dive</span>
                    </div>
                    <div class="flex justify-center mb-6">${generateAllBtn}</div>
                    <p class="text-center text-sm text-gray-500 mb-4 italic">...or run individual analyses:</p>
                    <div class="space-y-6">
                        <div>
                            <h3 class="text-sm font-bold text-gray-500 uppercase text-center mb-3">Quantitative Analysis</h3>
                            <div class="flex flex-wrap gap-2 justify-center">${quantHtml}</div>
                        </div>
                        <div>
                            <h3 class="text-sm font-bold text-gray-500 uppercase text-center mb-3">Investment Thesis & Narrative Analysis</h3>
                            <div class="flex flex-wrap gap-2 justify-center">${narrativeHtml}</div>
                        </div>
                        <div>
                            <h3 class="text-sm font-bold text-gray-500 uppercase text-center mb-3">Specialized Analysis</h3>
                            <div class="flex flex-wrap gap-2 justify-center">${specializedHtml}</div>
                        </div>
                    </div>
                </div>

                <div>
                    <div class="relative text-center mb-4">
                        <span class="absolute inset-x-0 top-1/2 h-px bg-gray-200" aria-hidden="true"></span>
                        <span class="relative bg-white px-4 text-sm font-bold text-gray-500 uppercase">Step 3: Synthesize & Conclude</span>
                    </div>
                    <div class="flex flex-wrap justify-center gap-4">
                        ${garpValidationBtn}
                        ${investmentMemoBtn}
                    </div>
                </div>
            </div>
        `;
        // --- END OF UI REFACTOR ---

        // Render the company profile section
        const imageUrl = profile.image || '';
        const description = profile.description || 'No description available.';
        const exchange = profile.exchange || 'N/A';
        const sector = profile.sector || profile.marketSector || 'N/A';
        const filingsUrl = profile.secFilingsUrl || '';

        let profileHtml = '<div class="mt-6 border-t pt-4">';
        if (imageUrl) {
            profileHtml += `
                <div class="flex flex-col md:flex-row gap-6 items-start">
                    <img src="${imageUrl}" alt="Company Logo" class="w-24 h-24 rounded-md object-contain border p-1 bg-white flex-shrink-0" />
                    <div>`;
        } else {
            profileHtml += `<div>`;
        }

        profileHtml += `<p class="text-sm text-gray-700 mb-4">${description}</p>`;
        profileHtml += `<div class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mt-4 border-t pt-3">`;
        profileHtml += `<div><p class="font-semibold text-gray-500">Exchange</p><p class="text-gray-800">${exchange}</p></div>`;
        profileHtml += `<div><p class="font-semibold text-gray-500">Sector</p><p class="text-gray-800">${sector}</p></div>`;
        if (filingsUrl) {
             profileHtml += `<div class="col-span-2"><p class="font-semibold text-gray-500">SEC Filings</p><a href="${filingsUrl}" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:underline">${filingsUrl}</a></div>`;
        }
        profileHtml += `</div></div></div>`;
        profileDisplayContainer.innerHTML = profileHtml;
        
        // Render Dashboard tab content
        renderValuationHealthDashboard(document.getElementById('valuation-health-container'), ticker, fmpData);
        renderThesisTracker(document.getElementById('thesis-tracker-container'), ticker);

    } catch (error) {
        console.error('Error opening raw data viewer:', error);
        titleEl.textContent = `Error Loading Data for ${ticker}`;
        aiArticleContainer.innerHTML = `<p class="text-red-500 text-center">${error.message}</p>`;
        profileDisplayContainer.innerHTML = `<p class="text-red-500 text-center">${error.message}</p>`;
    }
}
