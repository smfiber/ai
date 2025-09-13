import { CONSTANTS, state, promptMap, ANALYSIS_ICONS } from './config.js';
import { getFmpStockData, getGroupedFmpData } from './api.js';
import { getDocs, collection, query, limit, where, orderBy } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { renderPortfolioManagerList, renderFmpEndpointsList, renderBroadEndpointsList, _renderGroupedStockList, renderValuationHealthDashboard, renderThesisTracker, renderSecFilings, displayReport, updateReportStatus } from './ui-render.js';
import { handleAnalysisRequest, handleInvestmentMemoRequest, handleRefreshFmpData, handleGarpValidationRequest } from './ui-handlers.js';

// --- MODAL HELPERS ---

export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if(modal) {
        document.body.classList.add(CONSTANTS.CLASS_BODY_MODAL_OPEN);
        modal.classList.add(CONSTANTS.CLASS_MODAL_OPEN);
    }
}

export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if(modal) {
        modal.classList.remove(CONSTANTS.CLASS_MODAL_OPEN);
        if (document.querySelectorAll('.modal.is-open').length === 0) {
             document.body.classList.remove(CONSTANTS.CLASS_BODY_MODAL_OPEN);
        }
    }
}

export function displayMessageInModal(message, type = 'info') {
    const modalId = CONSTANTS.MODAL_MESSAGE;
    const modal = document.getElementById(modalId);
    const modalContent = modal ? modal.querySelector('.modal-content') : null;
    if (!modal || !modalContent) return;

    const card = document.createElement('div');
    card.className = 'bg-white rounded-2xl shadow-lg border border-gray-200 p-8 w-full max-w-sm m-4 text-center';
    const titleEl = document.createElement('h2');
    titleEl.className = 'text-2xl font-bold mb-4';
    const contentEl = document.createElement('p');
    contentEl.className = 'mb-6 text-gray-500 whitespace-pre-wrap';
    contentEl.textContent = message;
    const okButton = document.createElement('button');
    okButton.textContent = 'OK';
    okButton.className = 'bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-5 rounded-lg shadow-md transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 w-full';
    okButton.addEventListener('click', () => closeModal(modalId));

    switch (type) {
        case 'error': titleEl.textContent = 'Error!'; titleEl.classList.add('text-red-600'); break;
        case 'warning': titleEl.textContent = 'Warning!'; titleEl.classList.add('text-yellow-600'); break;
        default: titleEl.textContent = 'Info'; titleEl.classList.add('text-gray-800');
    }

    card.append(titleEl, contentEl, okButton);
    modalContent.innerHTML = '';
    modalContent.appendChild(card);
    openModal(modalId);
}

export function openConfirmationModal(title, message, onConfirm) {
    const modalId = CONSTANTS.MODAL_CONFIRMATION;
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.querySelector('#confirmation-title').textContent = title;
    modal.querySelector('#confirmation-message').textContent = message;
    const confirmBtn = modal.querySelector('#confirm-button');
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    newConfirmBtn.addEventListener('click', () => {
        onConfirm();
        closeModal(modalId);
    });
    openModal(modalId);
}

// --- SESSION LOG MODAL ---
export function openSessionLogModal() {
    const contentContainer = document.getElementById('session-log-content');
    if (!contentContainer) return;

    if (state.sessionLog.length === 0) {
        contentContainer.innerHTML = '<p class="text-center text-gray-500 py-8">No AI interactions have been logged in this session yet.</p>';
    } else {
        const logHtml = state.sessionLog.slice().reverse().map(log => {
            const isPrompt = log.type === 'prompt';
            const headerBg = isPrompt ? 'bg-indigo-100' : 'bg-emerald-100';
            const headerText = isPrompt ? 'text-indigo-800' : 'text-emerald-800';
            const icon = isPrompt 
                ? `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>`
                : `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>`;

            return `
                <div class="border rounded-lg bg-white overflow-hidden">
                    <div class="p-3 ${headerBg} ${headerText} font-semibold text-sm flex items-center justify-between">
                        <div class="flex items-center">
                            ${icon}
                            <span>${isPrompt ? 'Prompt Sent' : 'AI Response Received'}</span>
                        </div>
                        <span class="font-mono text-xs">${log.timestamp.toLocaleTimeString()}</span>
                    </div>
                    <pre class="text-xs whitespace-pre-wrap break-all bg-gray-900 text-white p-4">${log.content}</pre>
                </div>
            `;
        }).join('');
        contentContainer.innerHTML = logHtml;
    }

    openModal(CONSTANTS.MODAL_SESSION_LOG);
}

export async function openStockListModal(listType) {
    const modalId = CONSTANTS.MODAL_STOCK_LIST;
    const modal = document.getElementById(modalId);
    if (!modal) return;

    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Loading ${listType}...`;

    const title = modal.querySelector('#stock-list-modal-title');
    const container = modal.querySelector('#stock-list-modal-content');
    title.textContent = `My ${listType}`;
    container.innerHTML = '';

    try {
        const stocksToFetch = state.portfolioCache.filter(s => s.status === listType);
        if (stocksToFetch.length === 0) {
            container.innerHTML = `<p class="text-center text-gray-500 py-8">No stocks in your ${listType}.</p>`;
            openModal(modalId);
            closeModal(CONSTANTS.MODAL_LOADING);
            return;
        }

        const stockDataPromises = stocksToFetch.map(stock => getFmpStockData(stock.ticker));
        const results = await Promise.allSettled(stockDataPromises);

        const stocksWithData = stocksToFetch.map((stock, index) => {
            if (results[index].status === 'fulfilled' && results[index].value) {
                return { ...stock, fmpData: results[index].value };
            }
            return { ...stock, fmpData: null };
        }).filter(stock => stock.fmpData);

        await _renderGroupedStockList(container, stocksWithData, listType);
        openModal(modalId);
    } catch (error) {
        console.error(`Error loading ${listType} modal:`, error);
        displayMessageInModal(`Failed to load ${listType}: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

export async function openManageStockModal(stockData = {}) {
    const form = document.getElementById('manage-stock-form');
    form.reset();
    
    if (stockData.isEditMode) {
        document.getElementById('manage-stock-modal-title').textContent = `Edit ${stockData.ticker}`;
        document.getElementById('manage-stock-original-ticker').value = stockData.ticker;
        document.getElementById('manage-stock-ticker').value = stockData.ticker;
        document.getElementById('manage-stock-name').value = stockData.companyName;
        document.getElementById('manage-stock-exchange').value = stockData.exchange;
        document.getElementById('manage-stock-status').value = stockData.status || 'Watchlist';
        document.getElementById('manage-stock-sector').value = stockData.sector || '';
        document.getElementById('manage-stock-industry').value = stockData.industry || '';
    } else {
        document.getElementById('manage-stock-modal-title').textContent = 'Add New Stock';
        document.getElementById('manage-stock-original-ticker').value = '';
        document.getElementById('manage-stock-ticker').value = stockData.ticker || '';
        document.getElementById('manage-stock-name').value = stockData.companyName || '';
        document.getElementById('manage-stock-exchange').value = stockData.exchange || '';
        document.getElementById('manage-stock-status').value = 'Watchlist';
        document.getElementById('manage-stock-sector').value = stockData.sector || '';
        document.getElementById('manage-stock-industry').value = stockData.industry || '';
    }
    openModal(CONSTANTS.MODAL_MANAGE_STOCK);
}

export function openPortfolioManagerModal() {
    renderPortfolioManagerList();
    openModal(CONSTANTS.MODAL_PORTFOLIO_MANAGER);
}

export async function openViewFmpDataModal(symbol) {
    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Loading FMP data for ${symbol}...`;
    
    const contentContainer = document.getElementById('view-fmp-data-content');
    contentContainer.innerHTML = '';

    try {
        const endpointsSnapshot = await getDocs(collection(state.db, CONSTANTS.DB_COLLECTION_FMP_ENDPOINTS));
        const endpointNames = {};
        endpointsSnapshot.forEach(doc => {
            endpointNames[doc.id] = doc.data().name || 'Unnamed Endpoint';
        });

        const fmpCacheRef = collection(state.db, CONSTANTS.DB_COLLECTION_FMP_CACHE, symbol, 'endpoints');
        const fmpCacheSnapshot = await getDocs(fmpCacheRef);

        if (fmpCacheSnapshot.empty) {
            contentContainer.innerHTML = '<p class="text-center text-gray-500 py-8">No FMP data has been cached for this stock yet. Use the "Refresh FMP" button first.</p>';
        } else {
            const fmpData = fmpCacheSnapshot.docs.map(doc => ({
                name: endpointNames[doc.id] || `Unknown (${doc.id})`,
                ...doc.data()
            })).sort((a, b) => a.name.localeCompare(b.name));

            const html = fmpData.map(item => `
                <div>
                    <h3 class="text-lg font-bold text-gray-800">${item.name}</h3>
                    <p class="text-xs text-gray-500 mb-2">Cached On: ${item.cachedAt.toDate().toLocaleString()}</p>
                    <pre class="text-xs whitespace-pre-wrap break-all bg-white p-4 rounded-lg border">${JSON.stringify(item.data, null, 2)}</pre>
                </div>
            `).join('');
            contentContainer.innerHTML = html;
        }

        document.getElementById('view-fmp-data-modal-title').textContent = `Cached FMP Data for ${symbol}`;
        openModal(CONSTANTS.MODAL_VIEW_FMP_DATA);

    } catch (error) {
        console.error("Error viewing FMP data:", error);
        displayMessageInModal(`Could not display FMP data: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

export async function openManageFmpEndpointsModal() {
    await renderFmpEndpointsList();
    openModal(CONSTANTS.MODAL_MANAGE_FMP_ENDPOINTS);
}

export async function openManageBroadEndpointsModal() {
    await renderBroadEndpointsList();
    openModal(CONSTANTS.MODAL_MANAGE_BROAD_ENDPOINTS);
}

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

    // Reset 8-K and 10-K tabs
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


        // Build AI buttons
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
            { reportType: 'CompetitiveLandscape', text: 'Peer Analysis', tooltip: 'How does this company stack up against its main competitors?' },
        ];

        const specializedButtons = [
             { reportType: 'CapitalAllocators', text: 'Capital Allocators', tooltip: 'Assesses management\'s skill in deploying capital.' },
             { reportType: 'GrowthOutlook', text: 'Growth Outlook', tooltip: 'Analyzes the company\'s future growth potential.' },
             { reportType: 'DividendSafety', text: 'Dividend Safety', tooltip: 'Checks the sustainability of the company\'s dividend payments.' },
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

        const tileContainer = `
            <div class="flex-grow space-y-4">
                 <h3 class="text-sm font-bold text-gray-500 uppercase text-center">Quantitative Analysis</h3>
                 <div class="flex flex-wrap gap-2 justify-center">${quantHtml}</div>
                 <h3 class="text-sm font-bold text-gray-500 uppercase pt-4 text-center">Investment Thesis & Narrative Analysis</h3>
                 <div class="flex flex-wrap gap-2 justify-center">${narrativeHtml}</div>
                 <h3 class="text-sm font-bold text-gray-500 uppercase pt-4 text-center">Specialized Analysis</h3>
                 <div class="flex flex-wrap gap-2 justify-center">${specializedHtml}</div>
            </div>
        `;

        const actionButtonContainer = `
            <div class="flex flex-col gap-4 pl-6 ml-6 border-l border-gray-200" style="width: 240px;"> <button data-symbol="${ticker}" id="generate-all-reports-button" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg" data-tooltip="Generates all 10 core analysis reports and saves them to the database in a single, efficient batch.">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12l3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                    Generate All Reports
                </button>
                <button data-symbol="${ticker}" id="investment-memo-button" class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg" data-tooltip="Synthesizes all other reports into a final verdict. Requires all other analyses to be saved first.">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Generate Investment Memo
                </button>
                <button data-symbol="${ticker}" id="garp-validation-button" class="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg" data-tooltip="Synthesizes GARP, Financial, and Risk reports into a final verdict. Requires these 3 analyses to be saved first.">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    GARP Validation Report
                </button>
            </div>
        `;

        aiButtonsContainer.innerHTML = `
            <div class="flex items-start">
                ${tileContainer}
                ${actionButtonContainer}
            </div>
        `;

        // Render the new company profile section
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
        // SEC Filings are lazy-loaded via tab click event

    } catch (error) {
        console.error('Error opening raw data viewer:', error);
        titleEl.textContent = `Error Loading Data for ${ticker}`;
        aiArticleContainer.innerHTML = `<p class="text-red-500 text-center">${error.message}</p>`;
        profileDisplayContainer.innerHTML = `<p class="text-red-500 text-center">${error.message}</p>`;
    }
}

export function openThesisTrackerModal(ticker) {
    const modal = document.getElementById('thesisTrackerModal');
    if (!modal) return;

    const stock = state.portfolioCache.find(s => s.ticker === ticker);
    if (!stock) {
        displayMessageInModal(`Could not find ${ticker} in your portfolio.`, 'error');
        return;
    }

    modal.querySelector('#thesis-tracker-ticker').value = ticker;
    modal.querySelector('#thesis-tracker-modal-title').textContent = `Investment Thesis for ${ticker}`;
    modal.querySelector('#thesis-tracker-content').value = stock.thesis || '';
    
    openModal('thesisTrackerModal');
}
