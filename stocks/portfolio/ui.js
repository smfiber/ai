import { CONSTANTS, SECTORS, SECTOR_ICONS, state, NEWS_SENTIMENT_PROMPT, promptMap, creativePromptMap, INVESTMENT_MEMO_PROMPT, ENABLE_STARTER_PLAN_MODE, STARTER_SYMBOLS } from './config.js';
import { getFmpStockData, callApi, filterValidNews, callGeminiApi, generatePolishedArticle, getDriveToken, getOrCreateDriveFolder, createDriveFile, getGroupedFmpData, generateMorningBriefing, calculatePortfolioHealthScore } from './api.js';
import { getFirestore, Timestamp, doc, setDoc, getDoc, deleteDoc, collection, getDocs, query, limit, addDoc, increment, updateDoc, where, orderBy } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- PROMPT MAPPING ---
// The main promptMap is now imported directly from config.js

// Map specific AI analysis types to the FMP endpoints they require.
const ANALYSIS_REQUIREMENTS = {
    'ManagementScorecard': ['executive_compensation']
};

// v13.1.0: Icons for stock-specific analysis tiles
const ANALYSIS_ICONS = {
    'FinancialAnalysis': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6a7.5 7.5 0 100 15 7.5 7.5 0 000-15z" /><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.2-5.2" /><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 10.5H10.5v.008H10.5V10.5zm.008 0h.008v4.502h-.008V10.5z" /></svg>`,
    'UndervaluedAnalysis': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0l.879-.659M7.5 14.25l6-6M4.5 12l6-6m6 6l-6 6" /></svg>`,
    'BullVsBear': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.774 4.774zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
    'MoatAnalysis': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286zm0 13.036h.008v.008h-.008v-.008z" /></svg>`,
    'DividendSafety': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25-2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 3a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 12m15 0a2.25 2.25 0 01-2.25 2.25H12a2.25 2.25 0 01-2.25-2.25" /></svg>`,
    'GrowthOutlook': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>`,
    'RiskAssessment': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>`,
    'CapitalAllocators': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15.91 15.91a2.25 2.25 0 01-3.182 0l-3.03-3.03a.75.75 0 011.06-1.061l2.47 2.47 2.47-2.47a.75.75 0 011.06 1.06l-3.03 3.03z" /></svg>`,
    'NarrativeCatalyst': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.62a8.983 8.983 0 013.362-3.867 8.262 8.262 0 013 2.456z" /><path stroke-linecap="round" stroke-linejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" /></svg>`,
    'InvestmentMemo': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>`
};

// --- UTILITY & SECURITY HELPERS ---

function formatLargeNumber(value, precision = 2) {
    const num = parseFloat(value);
    if (isNaN(num) || num === 0) return "N/A";
    const tiers = [
        { value: 1e12, suffix: 'T' }, { value: 1e9,  suffix: 'B' },
        { value: 1e6,  suffix: 'M' }, { value: 1e3,  suffix: 'K' },
    ];
    const tier = tiers.find(t => Math.abs(num) >= t.value);
    if (tier) {
        const formattedNum = (num / tier.value).toFixed(precision);
        return `${formattedNum}${tier.suffix}`;
    }
    return num.toFixed(precision);
}

function sanitizeText(text) {
    if (typeof text !== 'string') return '';
    const tempDiv = document.createElement('div');
    tempDiv.textContent = text;
    return tempDiv.innerHTML;
}

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

function openConfirmationModal(title, message, onConfirm) {
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
                    <pre class="text-xs whitespace-pre-wrap break-all bg-gray-900 text-white p-4">${sanitizeText(log.content)}</pre>
                </div>
            `;
        }).join('');
        contentContainer.innerHTML = logHtml;
    }

    openModal(CONSTANTS.MODAL_SESSION_LOG);
}

// --- FMP API INTEGRATION & MANAGEMENT ---
async function handleRefreshFmpData(symbol) {
    if (!state.fmpApiKey) {
        displayMessageInModal("Financial Modeling Prep API Key is required for this feature.", "warning");
        return;
    }

    openModal(CONSTANTS.MODAL_LOADING);
    const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);
    loadingMessage.textContent = `Fetching all FMP data for ${symbol}...`;

    try {
        const coreEndpoints = [
            { name: 'profile', path: 'profile', version: 'v3' },
            { name: 'income_statement_annual', path: 'income-statement', params: 'period=annual&limit=10', version: 'v3' },
            { name: 'income_statement_growth_annual', path: 'income-statement-growth', params: 'period=annual&limit=5', version: 'stable', symbolAsQuery: true },
            { name: 'balance_sheet_statement_annual', path: 'balance-sheet-statement', params: 'period=annual&limit=10', version: 'v3' },
            { name: 'cash_flow_statement_annual', path: 'cash-flow-statement', params: 'period=annual&limit=10', version: 'v3' },
            { name: 'key_metrics_annual', path: 'key-metrics', params: 'period=annual&limit=10', version: 'v3' },
            { name: 'ratios_annual', path: 'ratios', params: 'period=annual&limit=10', version: 'v3' },
            { name: 'stock_grade_news', path: 'grade', version: 'v3' },
            { name: 'analyst_estimates', path: 'analyst-estimates', version: 'v3'},
            { name: 'company_core_information', path: 'company-core-information', version: 'v4', symbolAsQuery: true },
            { name: 'executive_compensation', path: 'governance-executive-compensation', version: 'stable', symbolAsQuery: true }
        ];

        let successfulFetches = 0;

        for (const endpoint of coreEndpoints) {
            if (endpoint.name === 'executive_compensation' && ENABLE_STARTER_PLAN_MODE && !STARTER_SYMBOLS.includes(symbol)) {
                console.log(`Skipping starter-plan-limited endpoint '${endpoint.name}' for non-starter symbol ${symbol}.`);
                continue;
            }

            loadingMessage.textContent = `Fetching FMP Data: ${endpoint.name.replace(/_/g, ' ')}...`;
            
            const version = endpoint.version || 'v3';
            const base = version === 'stable'
                ? `https://financialmodelingprep.com/${version}/`
                : `https://financialmodelingprep.com/api/${version}/`;
            
            const key = `apikey=${state.fmpApiKey}`;
            const params = endpoint.params ? `${endpoint.params}&` : '';
            let url;

            if (endpoint.symbolAsQuery) {
                // For endpoints like `.../grade?symbol=AAPL&...` or `.../stable/key-executives?symbol=AAPL...`
                url = `${base}${endpoint.path}?symbol=${symbol}&${params}${key}`;
            } else {
                // For endpoints like `.../profile/AAPL?...`
                url = `${base}${endpoint.path}/${symbol}?${params}${key}`;
            }

            const data = await callApi(url);

            if (!data || (Array.isArray(data) && data.length === 0)) {
                console.warn(`No data returned from FMP for core endpoint: ${endpoint.name}`);
                continue;
            }

            const docRef = doc(state.db, CONSTANTS.DB_COLLECTION_FMP_CACHE, symbol, 'endpoints', endpoint.name);
            await setDoc(docRef, { cachedAt: Timestamp.now(), data: data });
            successfulFetches++;
        }
        
        // Fetch user-defined endpoints
        const endpointsSnapshot = await getDocs(collection(state.db, CONSTANTS.DB_COLLECTION_FMP_ENDPOINTS));
        if (!endpointsSnapshot.empty) {
            const userEndpoints = endpointsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            for (const endpoint of userEndpoints) {
                 if (!endpoint.url_template || !endpoint.name) continue;
                loadingMessage.textContent = `Fetching FMP Data: ${endpoint.name}...`;
                const url = endpoint.url_template.replace('${symbol}', symbol).replace('${fmpApiKey}', state.fmpApiKey);
                const data = await callApi(url);

                if (data && (!Array.isArray(data) || data.length > 0)) {
                    const docRef = doc(state.db, CONSTANTS.DB_COLLECTION_FMP_CACHE, symbol, 'endpoints', endpoint.id);
                    await setDoc(docRef, { cachedAt: Timestamp.now(), data: data });
                    await updateDoc(doc(state.db, CONSTANTS.DB_COLLECTION_FMP_ENDPOINTS, endpoint.id), { usageCount: increment(1) });
                    successfulFetches++;
                }
            }
        }
        
        displayMessageInModal(`Successfully fetched and updated data for ${successfulFetches} FMP endpoint(s).`, 'info');
        await fetchAndCachePortfolioData(); // Refresh portfolio cache which might contain new FMP data references

    } catch (error) {
        console.error("Error fetching FMP data:", error);
        displayMessageInModal(`Could not fetch FMP data: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}


// --- PORTFOLIO & DASHBOARD MANAGEMENT ---

export async function renderMorningBriefing() {
    const briefingContainer = document.getElementById('morning-briefing-content');
    const briefingTitle = document.querySelector('#dashboard-section h3');
    if (!briefingContainer || !briefingTitle) return;

    try {
        const currentDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        briefingTitle.textContent = `AI Morning Briefing for ${currentDate}`;

        const portfolioStocks = state.portfolioCache.filter(s => s.status === 'Portfolio');

        if (portfolioStocks.length === 0) {
            briefingContainer.innerHTML = `<div class="text-center p-8 text-gray-500">Add stocks to your portfolio to see your morning briefing.</div>`;
            return;
        }

        const briefingMarkdown = await generateMorningBriefing(portfolioStocks);
        briefingContainer.innerHTML = marked.parse(briefingMarkdown);

    } catch (error) {
        console.error("Error generating morning briefing:", error);
        briefingContainer.innerHTML = `<div class="text-center p-4 text-red-500 bg-red-50 rounded-lg">
            <p class="font-semibold">Could not generate briefing.</p>
            <p class="text-sm">${error.message}</p>
        </div>`;
    }
}

export async function renderPortfolioHealthScore() {
    const scoreDisplay = document.getElementById('health-score-display');
    if (!scoreDisplay) return;

    try {
        const portfolioStocks = state.portfolioCache.filter(s => s.status === 'Portfolio');
        if (portfolioStocks.length === 0) {
            scoreDisplay.textContent = '--';
            return;
        }
        
        const score = await calculatePortfolioHealthScore(portfolioStocks);
        scoreDisplay.textContent = score;
        
        // Update color based on score
        scoreDisplay.classList.remove('text-green-500', 'text-yellow-500', 'text-red-500');
        if (score >= 75) {
            scoreDisplay.classList.add('text-green-500');
        } else if (score >= 50) {
            scoreDisplay.classList.add('text-yellow-500');
        } else {
            scoreDisplay.classList.add('text-red-500');
        }

    } catch (error) {
        console.error("Error calculating portfolio health score:", error);
        scoreDisplay.textContent = '--';
    }
}

async function _renderGroupedStockList(container, stocksWithData, listType) {
    container.innerHTML = ''; 
    if (stocksWithData.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-500 py-8">No stocks in your ${listType}.</p>`;
        return;
    }

    const groupedBySector = stocksWithData.reduce((acc, stock) => {
        const sector = stock.sector || 'Uncategorized';
        if (!acc[sector]) acc[sector] = [];
        acc[sector].push(stock);
        return acc;
    }, {});

    const sortedSectors = Object.keys(groupedBySector).sort();

    let html = '';
    sortedSectors.forEach(sector => {
        const stocks = groupedBySector[sector].sort((a, b) => a.companyName.localeCompare(b.companyName));
        html += `
            <details class="sector-group" open>
                <summary class="sector-header">
                    <span>${sanitizeText(sector)}</span>
                    <span class="sector-toggle-icon"></span>
                </summary>
                <div class="sector-content">
                    <ul class="divide-y divide-gray-200">`;
        
        stocks.forEach(stock => {
            const profile = stock.fmpData?.profile?.[0] || {};
            const refreshedAt = stock.fmpData?.cachedAt ? stock.fmpData.cachedAt.toDate().toLocaleString() : 'N/A';

            html += `
                <li class="dashboard-list-item-detailed">
                    <div class="stock-main-info">
                        <p class="font-bold text-indigo-700">${sanitizeText(stock.companyName)}</p>
                        <p class="text-sm text-gray-600">${sanitizeText(stock.ticker)}</p>
                    </div>
                    <div class="stock-actions">
                        <div class="flex items-center justify-end gap-2">
                            <button class="dashboard-item-view bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold py-1 px-3 rounded-full" data-ticker="${sanitizeText(stock.ticker)}">View</button>
                            <button class="dashboard-item-refresh bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-semibold py-1 px-3 rounded-full" data-ticker="${sanitizeText(stock.ticker)}">Refresh</button>
                            <button class="dashboard-item-edit" data-ticker="${sanitizeText(stock.ticker)}">Edit</button>
                        </div>
                        <p class="text-xs text-gray-400 mt-2 text-right whitespace-nowrap" title="Last Refreshed">Refreshed: ${refreshedAt}</p>
                    </div>
                </li>`;
        });

        html += `</ul></div></details>`;
    });
    container.innerHTML = html;
}

export async function fetchAndCachePortfolioData() {
    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = "Loading dashboard data...";
    
    try {
        const querySnapshot = await getDocs(collection(state.db, CONSTANTS.DB_COLLECTION_PORTFOLIO));
        state.portfolioCache = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const portfolioStocks = state.portfolioCache.filter(s => s.status === 'Portfolio');
        const watchlistStocks = state.portfolioCache.filter(s => s.status === 'Watchlist');

        // These elements are no longer in the HTML, but we leave the logic for now
        // document.getElementById('portfolio-count').textContent = portfolioStocks.length;
        // document.getElementById('watchlist-count').textContent = watchlistStocks.length;

    } catch (error) {
        console.error("Error loading dashboard data:", error);
        displayMessageInModal(`Failed to load dashboard data: ${error.message}`, 'error');
        // document.getElementById('portfolio-count').textContent = 'E';
        // document.getElementById('watchlist-count').textContent = 'E';
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

async function openStockListModal(listType) {
    const modalId = CONSTANTS.MODAL_STOCK_LIST;
    const modal = document.getElementById(modalId);
    if (!modal) return;

    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Loading ${listType}...`;

    const title = modal.querySelector('#stock-list-modal-title');
    const container = modal.querySelector('#stock-list-modal-content');
    title.textContent = listType === 'Portfolio' ? 'My Portfolio' : 'My Watchlist';
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

async function openManageStockModal(stockData = {}) {
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

async function handleSaveStock(e) {
    e.preventDefault();
    const originalTicker = document.getElementById('manage-stock-original-ticker').value.trim().toUpperCase();
    const newTicker = document.getElementById('manage-stock-ticker').value.trim().toUpperCase();
    
    if (!/^[A-Z.]{1,10}$/.test(newTicker)) {
        displayMessageInModal("Please enter a valid stock ticker symbol.", "warning");
        return;
    }

    const stockData = {
        ticker: newTicker,
        companyName: document.getElementById('manage-stock-name').value.trim(),
        exchange: document.getElementById('manage-stock-exchange').value.trim(),
        status: document.getElementById('manage-stock-status').value.trim(),
        sector: document.getElementById('manage-stock-sector').value.trim(),
        industry: document.getElementById('manage-stock-industry').value.trim(),
    };

    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = "Saving to your lists...";
    
    try {
        if (originalTicker && originalTicker !== newTicker) {
            await deleteDoc(doc(state.db, CONSTANTS.DB_COLLECTION_PORTFOLIO, originalTicker));
        }

        await setDoc(doc(state.db, CONSTANTS.DB_COLLECTION_PORTFOLIO, newTicker), stockData);

        const fmpCacheRef = collection(state.db, CONSTANTS.DB_COLLECTION_FMP_CACHE, newTicker, 'endpoints');
        const fmpSnapshot = await getDocs(query(fmpCacheRef, limit(1)));
        if (fmpSnapshot.empty) {
            document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `First time setup: Caching FMP data for ${newTicker}...`;
            await handleRefreshFmpData(newTicker);
        }

        closeModal(CONSTANTS.MODAL_MANAGE_STOCK);
        await fetchAndCachePortfolioData();
    } catch(error) {
        console.error("Error saving stock:", error);
        displayMessageInModal(`Could not save stock: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

async function handleDeleteStock(ticker) {
    openConfirmationModal(
        `Delete ${ticker}?`, 
        `Are you sure you want to remove ${ticker} from your lists? This will not delete the cached API data.`,
        async () => {
            openModal(CONSTANTS.MODAL_LOADING);
            document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Deleting ${ticker}...`;
            try {
                await deleteDoc(doc(state.db, CONSTANTS.DB_COLLECTION_PORTFOLIO, ticker));
                await fetchAndCachePortfolioData();
                if(document.getElementById(CONSTANTS.MODAL_PORTFOLIO_MANAGER).classList.contains(CONSTANTS.CLASS_MODAL_OPEN)) {
                    renderPortfolioManagerList();
                }
            } catch (error) {
                console.error("Error deleting stock:", error);
                displayMessageInModal(`Could not delete ${ticker}: ${error.message}`, 'error');
            } finally {
                closeModal(CONSTANTS.MODAL_LOADING);
            }
        }
    );
}

// --- CORE STOCK RESEARCH LOGIC (Now used for adding stocks in the modal) ---

async function handleResearchSubmit(e) {
    e.preventDefault();
    const tickerInput = document.getElementById(CONSTANTS.INPUT_TICKER);
    const symbol = tickerInput.value.trim().toUpperCase();
    if (!/^[A-Z.]{1,10}$/.test(symbol)) {
        displayMessageInModal("Please enter a valid stock ticker symbol.", "warning");
        return;
    }
    
    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Checking your lists for ${symbol}...`;
    
    try {
        const docRef = doc(state.db, CONSTANTS.DB_COLLECTION_PORTFOLIO, symbol);
        if ((await getDoc(docRef)).exists()) {
             displayMessageInModal(`${symbol} is already in your portfolio or watchlist. You can edit it from the dashboard.`, 'info');
             tickerInput.value = '';
             closeModal(CONSTANTS.MODAL_LOADING);
             return;
        }
        
        document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Fetching overview for ${symbol}...`;
        
        const profileUrl = `https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${state.fmpApiKey}`;
        const profileData = await callApi(profileUrl);

        if (!profileData || profileData.length === 0 || !profileData[0].symbol) {
            throw new Error(`Could not fetch data for ${symbol}. It may be an invalid ticker.`);
        }
        const overviewData = profileData[0];

        const newStock = {
            ticker: overviewData.symbol,
            companyName: overviewData.companyName,
            exchange: overviewData.exchange,
            sector: overviewData.sector,
            industry: overviewData.industry,
            isEditMode: false
        };
        
        tickerInput.value = '';
        openManageStockModal(newStock);

    } catch (error) {
        console.error("Error during stock research:", error);
        displayMessageInModal(error.message, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

async function openRawDataViewer(ticker) {
    const modalId = 'rawDataViewerModal';
    openModal(modalId);
    
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

    document.querySelectorAll('#rawDataViewerModal .tab-content').forEach(c => c.classList.add('hidden'));
    document.querySelectorAll('#rawDataViewerModal .tab-button').forEach(b => b.classList.remove('active'));
    document.getElementById('company-profile-tab').classList.remove('hidden');
    document.querySelector('.tab-button[data-tab="company-profile"]').classList.add('active');

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
                        <summary class="p-3 font-semibold text-gray-700 cursor-pointer hover:bg-gray-50">${sanitizeText(key.replace(/_/g, ' '))}</summary>
                        <pre class="text-xs whitespace-pre-wrap break-all bg-gray-900 text-white p-3 rounded-b-lg">${sanitizeText(JSON.stringify(groupedFmpData[key], null, 2))}</pre>
                    </details>
                `;
            }
            rawDataContainer.innerHTML = accordionHtml;
        } else {
             rawDataContainer.innerHTML = '<p class="text-center text-gray-500 py-8">Could not load grouped raw data.</p>';
        }


        // Build AI buttons
        const buttons = [
            { reportType: 'FinancialAnalysis', text: 'Financial Analysis', tooltip: 'Deep dive into financial statements, ratios, and health.' },
            { reportType: 'UndervaluedAnalysis', text: 'Undervalued', tooltip: 'Assess if the stock is a potential bargain based on valuation metrics.' },
            { reportType: 'BullVsBear', text: 'Bull vs. Bear', tooltip: 'Presents both the positive and negative investment arguments.' },
            { reportType: 'MoatAnalysis', text: 'Moat Analysis', tooltip: 'Evaluates the company\'s competitive advantages.' },
            { reportType: 'DividendSafety', text: 'Dividend Safety', tooltip: 'Checks the sustainability of the company\'s dividend payments.' },
            { reportType: 'GrowthOutlook', text: 'Growth Outlook', tooltip: 'Analyzes the company\'s future growth potential.' },
            { reportType: 'RiskAssessment', text: 'Risk Assessment', tooltip: 'Identifies potential financial, market, and business risks.' },
            { reportType: 'CapitalAllocators', text: 'Capital Allocators', tooltip: 'Assesses management\'s skill in deploying capital.' },
            { reportType: 'NarrativeCatalyst', text: 'Catalysts', tooltip: 'Identifies the investment story and future catalysts.' }
        ];
        
        aiButtonsContainer.innerHTML = buttons.map(btn => {
            const hasSaved = savedReportTypes.has(btn.reportType) ? 'has-saved-report' : '';
            const icon = ANALYSIS_ICONS[btn.reportType] || '';
            return `<button data-symbol="${ticker}" data-report-type="${btn.reportType}" class="ai-analysis-button analysis-tile ${hasSaved}" data-tooltip="${btn.tooltip}">
                        ${icon}
                        <span class="tile-name">${btn.text}</span>
                    </button>`
        }).join('');
        
        // Add the special Investment Memo button
        aiButtonsContainer.innerHTML += `
            <div class="w-full border-t my-4"></div>
            <button data-symbol="${ticker}" id="investment-memo-button" class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg" data-tooltip="Synthesizes all other reports into a final verdict. Requires all other analyses to be saved first.">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Generate Investment Committee Memo
            </button>
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
                    <img src="${sanitizeText(imageUrl)}" alt="Company Logo" class="w-24 h-24 rounded-md object-contain border p-1 bg-white flex-shrink-0" />
                    <div>`;
        } else {
            profileHtml += `<div>`;
        }

        profileHtml += `<p class="text-sm text-gray-700 mb-4">${sanitizeText(description)}</p>`;
        
        profileHtml += `<div class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mt-4 border-t pt-3">`;
        profileHtml += `<div><p class="font-semibold text-gray-500">Exchange</p><p class="text-gray-800">${sanitizeText(exchange)}</p></div>`;
        profileHtml += `<div><p class="font-semibold text-gray-500">Sector</p><p class="text-gray-800">${sanitizeText(sector)}</p></div>`;

        if (filingsUrl) {
             profileHtml += `<div class="col-span-2"><p class="font-semibold text-gray-500">SEC Filings</p><a href="${sanitizeText(filingsUrl)}" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:underline">${sanitizeText(filingsUrl)}</a></div>`;
        }
        
        profileHtml += `</div></div></div>`;
        profileDisplayContainer.innerHTML = profileHtml;

    } catch (error) {
        console.error('Error opening raw data viewer:', error);
        titleEl.textContent = `Error Loading Data for ${ticker}`;
        aiArticleContainer.innerHTML = `<p class="text-red-500 text-center">${error.message}</p>`;
        profileDisplayContainer.innerHTML = `<p class="text-red-500 text-center">${error.message}</p>`;
    }
}


async function displayStockCard(ticker) {
    if (document.getElementById(`card-${ticker}`)) {
        document.getElementById(`card-${ticker}`).scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Loading card for ${ticker}...`;
    
    try {
        const stockData = await getFmpStockData(ticker);
        if (!stockData) {
            throw new Error(`Could not load required FMP data for ${ticker}. Please ensure data is cached.`);
        }

        const portfolioInfo = state.portfolioCache.find(s => s.ticker === ticker);
        const status = portfolioInfo ? portfolioInfo.status : null;
        
        const newCardHtml = renderOverviewCard(stockData, ticker, status);

        const container = document.getElementById(CONSTANTS.CONTAINER_DYNAMIC_CONTENT);
        const oldCard = document.getElementById(`card-${ticker}`);
        if(oldCard) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = newCardHtml;
            oldCard.replaceWith(tempDiv.firstElementChild);
        } else {
            container.insertAdjacentHTML('beforeend', newCardHtml);
        }
    } catch(error) {
        console.error(`Error displaying card for ${ticker}:`, error);
        displayMessageInModal(error.message, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

// --- NEWS FEATURE ---

function getSentimentDisplay(sentiment) {
    switch (sentiment) {
        case 'Bullish':
        case 'Positive':
            return { icon: '総', colorClass: 'text-green-600', bgClass: 'bg-green-100', textClass: 'text-green-800' };
        case 'Bearish':
        case 'Negative':
            return { icon: '綜', colorClass: 'text-red-600', bgClass: 'bg-red-100', textClass: 'text-red-800' };
        case 'Neutral':
            return { icon: '', colorClass: 'text-gray-600', bgClass: 'bg-gray-100', textClass: 'text-gray-800' };
        default:
            return { icon: '', colorClass: '', bgClass: '', textClass: '' };
    }
}

function renderNewsArticles(articlesWithSentiment, summaryMarkdown, symbol) {
    const card = document.getElementById(`card-${symbol}`);
    if (!card) return;

    let existingNewsContainer = card.querySelector('.news-container');
    if (existingNewsContainer) existingNewsContainer.remove();

    const newsContainer = document.createElement('div');
    newsContainer.className = 'news-container mt-4 border-t pt-4';

    if (articlesWithSentiment.length === 0) {
        newsContainer.innerHTML = `<p class="text-sm text-gray-500">No recent news articles found in the last 30 days.</p>`;
    } else {
        const impactColorMap = { 'High': 'bg-red-500', 'Medium': 'bg-yellow-500', 'Low': 'bg-blue-500' };
        const articlesHtml = articlesWithSentiment.map(article => {
            const { bgClass: sentimentBg, textClass: sentimentText } = getSentimentDisplay(article.sentiment);
            const impactColor = impactColorMap[article.impact] || 'bg-gray-500';

            return `
                <div class="mb-4 p-4 rounded-lg border border-gray-200 bg-white shadow-sm">
                    <a href="${sanitizeText(article.url)}" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:underline font-semibold block mb-2">${sanitizeText(article.title)}</a>
                    <p class="text-sm text-gray-700 mb-3">"${sanitizeText(article.summary)}"</p>
                    <div class="flex flex-wrap items-center gap-2 text-xs font-medium">
                        <span class="px-2 py-1 rounded-full ${sentimentBg} ${sentimentText}">${sanitizeText(article.sentiment)}</span>
                        <span class="px-2 py-1 rounded-full text-white ${impactColor}">Impact: ${sanitizeText(article.impact)}</span>
                        <span class="px-2 py-1 rounded-full bg-gray-200 text-gray-800">${sanitizeText(article.category)}</span>
                        <span class="px-2 py-1 rounded-full bg-gray-200 text-gray-800">${sanitizeText(article.date)}</span>
                    </div>
                </div>
            `;
        }).join('');
        
        const summaryHtml = summaryMarkdown ? marked.parse(summaryMarkdown) : '';
        newsContainer.innerHTML = `<h3 class="text-lg font-bold text-gray-700 mb-3">Recent News Analysis</h3>${articlesHtml}${summaryHtml}`;
    }
    card.appendChild(newsContainer);
}

async function handleFetchNews(symbol) {
    const button = document.querySelector(`#card-${symbol} .fetch-news-button`);
    if (!button) return;
    
    button.disabled = true;
    button.textContent = 'Analyzing...';

    try {
        const stockData = await getFmpStockData(symbol);
        const profile = stockData?.profile?.[0] || {};
        const companyName = profile.companyName || symbol;
        const url = `https://financialmodelingprep.com/api/v3/stock_news?tickers=${symbol}&limit=50&apikey=${state.fmpApiKey}`;
        
        const newsData = await callApi(url);
        const validArticles = filterValidNews(newsData);

        if (validArticles.length > 0) {
            const articlesForPrompt = validArticles.slice(0, 10).map(a => ({ 
                title: a.title, 
                snippet: a.text,
                publicationDate: a.publishedDate ? a.publishedDate.split(' ')[0] : 'N/A' 
            }));

            const prompt = NEWS_SENTIMENT_PROMPT
                .replace('{companyName}', companyName)
                .replace('{tickerSymbol}', symbol)
                .replace('{news_articles_json}', JSON.stringify(articlesForPrompt, null, 2));

            const rawResult = await callGeminiApi(prompt);
            
            const jsonMatch = rawResult.match(/```json\n([\s\S]*?)\n```|(\[[\s\S]*\])/);
            const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[2]).trim() : '';
            const summaryMarkdown = rawResult.split(jsonMatch ? jsonMatch[0] : ']').pop().trim();

            const sentiments = JSON.parse(jsonString);
            
            if (Array.isArray(sentiments) && sentiments.length > 0) {
                 const articlesWithSentiment = sentiments.map((sentiment, index) => ({
                    ...sentiment,
                    title: validArticles[index].title,
                    url: validArticles[index].url
                }));
                 renderNewsArticles(articlesWithSentiment, summaryMarkdown, symbol);
            } else {
                 renderNewsArticles([], '', symbol);
            }
        } else {
             renderNewsArticles([], '', symbol);
        }

    } catch (error) {
        console.error("Error fetching news:", error);
        displayMessageInModal(`Could not fetch news: ${error.message}`, 'error');
        renderNewsArticles([], '', symbol);
    } finally {
        button.disabled = false;
        button.textContent = 'Fetch News';
    }
}

// --- UI RENDERING ---

function renderOverviewCard(data, symbol, status) {
    const profile = data.profile?.[0] || {};
    if (!profile.symbol) return '';

    const price = profile.price || 0;
    const change = profile.change || 0;
    const changePercent = profile.changesPercentage || 0;
    const changeColorClass = change >= 0 ? 'price-gain' : 'price-loss';
    const changeSign = change >= 0 ? '+' : '';

    let statusBadge = '';
    if (status === 'Portfolio') {
        statusBadge = '<span class="ml-2 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-100 text-green-800">Portfolio</span>';
    } else if (status === 'Watchlist') {
        statusBadge = '<span class="ml-2 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">Watchlist</span>';
    }

    const marketCap = formatLargeNumber(profile.mktCap);
    const keyMetricsLatest = data.key_metrics_annual?.[0] || {};
    const peRatio = keyMetricsLatest.peRatio ? keyMetricsLatest.peRatio.toFixed(2) : 'N/A';
    
    const sma50 = profile.priceAvg50 || 'N/A';
    const sma200 = profile.priceAvg200 || 'N/A';
    
    const fmpTimestampString = data.cachedAt ? `FMP Data Stored On: ${data.cachedAt.toDate().toLocaleDateString()}` : '';

    return `
        <div class="bg-white rounded-2xl shadow-lg border border-gray-200 p-6" id="card-${symbol}">
            <div class="flex justify-between items-start gap-4">
                <div>
                    <h2 class="text-2xl font-bold text-gray-800 flex items-center">${sanitizeText(profile.companyName)} (${sanitizeText(profile.symbol)}) ${statusBadge}</h2>
                    <p class="text-gray-500">${sanitizeText(profile.exchange)} | ${sanitizeText(profile.sector)}</p>
                </div>
                <div class="text-right flex-shrink-0">
                    <p class="text-2xl font-bold">$${price.toFixed(2)}</p>
                    <p class="text-sm font-semibold ${changeColorClass}">${changeSign}${change.toFixed(2)} (${changeSign}${changePercent.toFixed(2)}%)</p>
                </div>
            </div>
            
            <p class="mt-4 text-sm text-gray-600">${sanitizeText(profile.description)}</p>
            
            <div class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center border-t pt-4">
                <div><p class="text-sm text-gray-500">Market Cap</p><p class="text-lg font-semibold">${sanitizeText(marketCap)}</p></div>
                <div><p class="text-sm text-gray-500">P/E Ratio</p><p class="text-lg font-semibold">${sanitizeText(peRatio)}</p></div>
                <div><p class="text-sm text-gray-500">50-Day MA</p><p class="text-lg font-semibold">$${typeof sma50 === 'number' ? sma50.toFixed(2) : 'N/A'}</p></div>
                <div><p class="text-sm text-gray-500">200-Day MA</p><p class="text-lg font-semibold">$${typeof sma200 === 'number' ? sma200.toFixed(2) : 'N/A'}</p></div>
            </div>

            <div class="mt-6 border-t pt-4 flex items-center flex-wrap gap-x-4 gap-y-2 justify-center">
                <button data-symbol="${symbol}" class="refresh-fmp-button text-sm bg-cyan-100 text-cyan-700 hover:bg-cyan-200 font-semibold py-2 px-4 rounded-lg">Refresh FMP</button>
                <button data-symbol="${symbol}" class="view-fmp-data-button text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg">View FMP Data</button>
                <button data-symbol="${symbol}" class="fetch-news-button text-sm bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg">Fetch News</button>
            </div>
            <div class="text-right text-xs text-gray-400 mt-4">
                <div>${fmpTimestampString}</div>
            </div>
        </div>`;
}

// --- PORTFOLIO MANAGER MODAL ---
function renderPortfolioManagerList() {
    const container = document.getElementById('portfolio-manager-list-container');
    if (!container) return;

    if (state.portfolioCache.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-500 p-8">No stocks in your portfolio or watchlist.</p>`;
        return;
    }

    const groupedBySector = state.portfolioCache.reduce((acc, stock) => {
        const sector = stock.sector || 'Uncategorized';
        if (!acc[sector]) {
            acc[sector] = [];
        }
        acc[sector].push(stock);
        return acc;
    }, {});

    let html = '';
    const sortedSectors = Object.keys(groupedBySector).sort();
    
    for (const sector of sortedSectors) {
        html += `<div class="portfolio-exchange-header">${sanitizeText(sector)}</div>`;
        html += '<ul class="divide-y divide-gray-200">';
        groupedBySector[sector].sort((a,b) => a.companyName.localeCompare(b.companyName)).forEach(stock => {
            const statusBadge = stock.status === 'Portfolio'
                ? '<span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-100 text-green-800">Portfolio</span>'
                : '<span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">Watchlist</span>';

            html += `
                <li class="p-4 flex justify-between items-center hover:bg-gray-50">
                    <div>
                        <p class="font-semibold text-gray-800">${sanitizeText(stock.companyName)} (${sanitizeText(stock.ticker)})</p>
                        <p class="text-sm text-gray-500">${statusBadge}</p>
                    </div>
                    <div class="flex gap-2">
                        <button class="edit-stock-btn text-sm font-medium text-indigo-600 hover:text-indigo-800" data-ticker="${sanitizeText(stock.ticker)}">Edit</button>
                        <button class="delete-stock-btn text-sm font-medium text-red-600 hover:text-red-800" data-ticker="${sanitizeText(stock.ticker)}">Delete</button>
                    </div>
                </li>
            `;
        });
        html += '</ul>';
    }
    container.innerHTML = html;
}


function openPortfolioManagerModal() {
    renderPortfolioManagerList();
    openModal(CONSTANTS.MODAL_PORTFOLIO_MANAGER);
}

async function handleViewFmpData(symbol) {
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
                    <h3 class="text-lg font-bold text-gray-800">${sanitizeText(item.name)}</h3>
                    <p class="text-xs text-gray-500 mb-2">Cached On: ${item.cachedAt.toDate().toLocaleString()}</p>
                    <pre class="text-xs whitespace-pre-wrap break-all bg-white p-4 rounded-lg border">${sanitizeText(JSON.stringify(item.data, null, 2))}</pre>
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

async function openManageFmpEndpointsModal() {
    await renderFmpEndpointsList();
    openModal(CONSTANTS.MODAL_MANAGE_FMP_ENDPOINTS);
}

async function renderFmpEndpointsList() {
    const container = document.getElementById('fmp-endpoints-list-container');
    container.innerHTML = 'Loading endpoints...';
    try {
        const querySnapshot = await getDocs(collection(state.db, CONSTANTS.DB_COLLECTION_FMP_ENDPOINTS));
        if (querySnapshot.empty) {
            container.innerHTML = '<p class="text-center text-gray-500 py-4">No endpoints saved.</p>';
            return;
        }
        const endpoints = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        container.innerHTML = endpoints.map(ep => `
            <div class="p-3 bg-white border rounded-lg flex justify-between items-center">
                <div>
                    <p class="font-semibold text-gray-700">${sanitizeText(ep.name)} <span class="text-xs font-normal text-gray-500">(Used: ${ep.usageCount || 0})</span></p>
                    <p class="text-xs text-gray-500 font-mono">${sanitizeText(ep.url_template)}</p>
                </div>
                <div class="flex gap-2">
                    <button class="edit-fmp-endpoint-btn text-sm font-medium text-indigo-600 hover:text-indigo-800" data-id="${ep.id}" data-name="${sanitizeText(ep.name)}" data-url="${sanitizeText(ep.url_template)}">Edit</button>
                    <button class="delete-fmp-endpoint-btn text-sm font-medium text-red-600 hover:text-red-800" data-id="${ep.id}">Delete</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error rendering FMP endpoints:', error);
        container.innerHTML = '<p class="text-red-500">Could not load endpoints.</p>';
    }
}

function handleEditFmpEndpoint(id, name, url) {
    document.getElementById('fmp-endpoint-id').value = id;
    document.getElementById('fmp-endpoint-name').value = name;
    document.getElementById('fmp-endpoint-url').value = url;
    document.getElementById('cancel-fmp-endpoint-edit').classList.remove('hidden');
    document.querySelector('#manage-fmp-endpoint-form button[type="submit"]').textContent = "Update Endpoint";
}

function cancelFmpEndpointEdit() {
    document.getElementById('manage-fmp-endpoint-form').reset();
    document.getElementById('fmp-endpoint-id').value = '';
    document.getElementById('cancel-fmp-endpoint-edit').classList.add('hidden');
    document.querySelector('#manage-fmp-endpoint-form button[type="submit"]').textContent = "Save Endpoint";
}

async function handleSaveFmpEndpoint(e) {
    e.preventDefault();
    const id = document.getElementById('fmp-endpoint-id').value;
    const name = document.getElementById('fmp-endpoint-name').value.trim();
    const url_template = document.getElementById('fmp-endpoint-url').value.trim();

    if (!name || !url_template) {
        displayMessageInModal('Endpoint Name and URL Template are required.', 'warning');
        return;
    }

    const data = { name, url_template };
    
    try {
        if (id) {
            await setDoc(doc(state.db, CONSTANTS.DB_COLLECTION_FMP_ENDPOINTS, id), data, { merge: true });
        } else {
            const docId = name.toLowerCase().replace(/\s+/g, '_');
            data.usageCount = 0;
            await setDoc(doc(state.db, CONSTANTS.DB_COLLECTION_FMP_ENDPOINTS, docId), data);
        }
        cancelFmpEndpointEdit();
        await renderFmpEndpointsList();
    } catch (error) {
        console.error('Error saving FMP endpoint:', error);
        displayMessageInModal(`Could not save endpoint: ${error.message}`, 'error');
    }
}

function handleDeleteFmpEndpoint(id) {
    openConfirmationModal('Delete Endpoint?', 'Are you sure you want to delete this endpoint? This cannot be undone.', async () => {
        try {
            await deleteDoc(doc(state.db, CONSTANTS.DB_COLLECTION_FMP_ENDPOINTS, id));
            await renderFmpEndpointsList();
        } catch (error) {
            console.error('Error deleting FMP endpoint:', error);
            displayMessageInModal(`Could not delete endpoint: ${error.message}`, 'error');
        }
    });
}

// --- BROAD API ENDPOINT MANAGEMENT ---

async function openManageBroadEndpointsModal() {
    await renderBroadEndpointsList();
    openModal(CONSTANTS.MODAL_MANAGE_BROAD_ENDPOINTS);
}

async function renderBroadEndpointsList() {
    const container = document.getElementById('broad-endpoints-list-container');
    container.innerHTML = 'Loading endpoints...';
    try {
        const querySnapshot = await getDocs(collection(state.db, CONSTANTS.DB_COLLECTION_BROAD_ENDPOINTS));
        if (querySnapshot.empty) {
            container.innerHTML = '<p class="text-center text-gray-500 py-4">No endpoints saved.</p>';
            return;
        }
        const endpoints = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        container.innerHTML = endpoints.map(ep => `
            <div class="p-3 bg-white border rounded-lg flex justify-between items-center">
                <div>
                    <p class="font-semibold text-gray-700">${sanitizeText(ep.name)} <span class="text-xs font-normal text-gray-500">(Used: ${ep.usageCount || 0})</span></p>
                    <p class="text-xs text-gray-500 font-mono">${sanitizeText(ep.url_template)}</p>
                </div>
                <div class="flex gap-2">
                    <button class="edit-broad-endpoint-btn text-sm font-medium text-indigo-600 hover:text-indigo-800" data-id="${ep.id}" data-name="${sanitizeText(ep.name)}" data-url="${sanitizeText(ep.url_template)}">Edit</button>
                    <button class="delete-broad-endpoint-btn text-sm font-medium text-red-600 hover:text-red-800" data-id="${ep.id}">Delete</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error rendering Broad API endpoints:', error);
        container.innerHTML = '<p class="text-red-500">Could not load endpoints.</p>';
    }
}

function handleEditBroadEndpoint(id, name, url) {
    document.getElementById('broad-endpoint-id').value = id;
    document.getElementById('broad-endpoint-name').value = name;
    document.getElementById('broad-endpoint-url').value = url;
    document.getElementById('cancel-broad-endpoint-edit').classList.remove('hidden');
    document.querySelector('#manage-broad-endpoint-form button[type="submit"]').textContent = "Update Endpoint";
}

function cancelBroadEndpointEdit() {
    document.getElementById('manage-broad-endpoint-form').reset();
    document.getElementById('broad-endpoint-id').value = '';
    document.getElementById('cancel-broad-endpoint-edit').classList.add('hidden');
    document.querySelector('#manage-broad-endpoint-form button[type="submit"]').textContent = "Save Endpoint";
}

async function handleSaveBroadEndpoint(e) {
    e.preventDefault();
    const id = document.getElementById('broad-endpoint-id').value;
    const name = document.getElementById('broad-endpoint-name').value.trim();
    const url_template = document.getElementById('broad-endpoint-url').value.trim();

    if (!name || !url_template) {
        displayMessageInModal('Endpoint Name and URL Template are required.', 'warning');
        return;
    }

    const data = { name, url_template };
    
    try {
        if (id) {
            await setDoc(doc(state.db, CONSTANTS.DB_COLLECTION_BROAD_ENDPOINTS, id), data, { merge: true });
        } else {
            const docId = name.toLowerCase().replace(/\s+/g, '_');
            data.usageCount = 0;
            await setDoc(doc(state.db, CONSTANTS.DB_COLLECTION_BROAD_ENDPOINTS, docId), data);
        }
        cancelBroadEndpointEdit();
        await renderBroadEndpointsList();
    } catch (error) {
        console.error('Error saving Broad API endpoint:', error);
        displayMessageInModal(`Could not save endpoint: ${error.message}`, 'error');
    }
}

function handleDeleteBroadEndpoint(id) {
    openConfirmationModal('Delete Endpoint?', 'Are you sure you want to delete this endpoint? This cannot be undone.', async () => {
        try {
            await deleteDoc(doc(state.db, CONSTANTS.DB_COLLECTION_BROAD_ENDPOINTS, id));
            await renderBroadEndpointsList();
        } catch (error) {
            console.error('Error deleting Broad API endpoint:', error);
            displayMessageInModal(`Could not delete endpoint: ${error.message}`, 'error');
        }
    });
}


// --- EVENT LISTENER SETUP ---

function setupGlobalEventListeners() {
    // This function will be expanded to handle the new "Add Stock" button in the manager modal
    document.getElementById('dashboard-section').addEventListener('click', (e) => {
        const refreshButton = e.target.closest('.dashboard-refresh-button');
        if (refreshButton) {
            fetchAndCachePortfolioData();
            // We will add a call to refresh the dashboard widgets here later
            return;
        }
    });

    document.getElementById(CONSTANTS.MODAL_STOCK_LIST).addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        if (target.id === 'expand-all-button') {
            document.querySelectorAll('#stock-list-modal-content .sector-group').forEach(d => d.open = true);
            return;
        }
        if (target.id === 'collapse-all-button') {
            document.querySelectorAll('#stock-list-modal-content .sector-group').forEach(d => d.open = false);
            return;
        }
        
        const ticker = target.dataset.ticker;
        if (ticker) {
            if (target.classList.contains('dashboard-item-edit')) {
                const stockData = state.portfolioCache.find(s => s.ticker === ticker);
                if (stockData) {
                    openManageStockModal({ ...stockData, isEditMode: true });
                }
            } else if (target.classList.contains('dashboard-item-view')) {
                openRawDataViewer(ticker);
            } else if (target.classList.contains('dashboard-item-refresh')) {
                handleRefreshFmpData(ticker);
            }
        }
    });

    document.getElementById(CONSTANTS.CONTAINER_DYNAMIC_CONTENT).addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        
        const symbol = target.dataset.symbol || target.dataset.ticker;
        if (!symbol) return;

        if (target.classList.contains('fetch-news-button')) handleFetchNews(symbol);
        if (target.classList.contains('refresh-fmp-button')) handleRefreshFmpData(symbol);
        if (target.classList.contains('view-fmp-data-button')) handleViewFmpData(symbol);
    });

    document.getElementById('portfolioManagerModal').addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        const ticker = target.dataset.ticker;

        if (target.classList.contains('edit-stock-btn')) {
            const stockData = state.portfolioCache.find(s => s.ticker === ticker);
            if (stockData) {
                openManageStockModal({ ...stockData, isEditMode: true });
            }
        } else if (target.classList.contains('delete-stock-btn')) {
            if (ticker) handleDeleteStock(ticker);
        }
    });
    
    document.getElementById('manageFmpEndpointsModal')?.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        const id = target.dataset.id;
        if (target.classList.contains('edit-fmp-endpoint-btn')) {
            handleEditFmpEndpoint(id, target.dataset.name, target.dataset.url);
        } else if (target.classList.contains('delete-fmp-endpoint-btn')) {
            handleDeleteFmpEndpoint(id);
        }
    });
}

// --- DYNAMIC TOOLTIPS ---
function initializeTooltips() {
    let tooltipElement;

    // Use event delegation on the body for efficiency
    document.body.addEventListener('mouseover', e => {
        const target = e.target.closest('[data-tooltip]');
        if (!target) return;

        const tooltipText = target.getAttribute('data-tooltip');
        if (!tooltipText) return;

        // Create and append tooltip element
        tooltipElement = document.createElement('div');
        tooltipElement.className = 'custom-tooltip';
        tooltipElement.textContent = tooltipText;
        document.body.appendChild(tooltipElement);
        
        // Position the tooltip dynamically
        positionTooltip(target, tooltipElement);

        // Use requestAnimationFrame to ensure the element is in the DOM before animating opacity
        requestAnimationFrame(() => {
            tooltipElement.style.opacity = '1';
        });
    });

    document.body.addEventListener('mouseout', e => {
        const target = e.target.closest('[data-tooltip]');
        // Hide and remove the tooltip when the mouse leaves the target
        if (target && tooltipElement) {
            tooltipElement.remove();
            tooltipElement = null;
        }
    });
    
    // Helper function to calculate the best position for the tooltip
    function positionTooltip(target, tooltip) {
        const targetRect = target.getBoundingClientRect();
        // Get tooltip dimensions *after* adding content but before making it visible
        const tooltipRect = tooltip.getBoundingClientRect(); 
        const margin = 8; // Space between the target and the tooltip

        // Default position: centered above the target
        let top = targetRect.top - tooltipRect.height - margin;
        let left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);

        // If the tooltip would go off the top of the screen, place it below the target instead
        if (top < 0) {
            top = targetRect.bottom + margin;
        }

        // Adjust horizontally to keep it within the viewport
        if (left < 0) {
            left = margin;
        } else if (left + tooltipRect.width > window.innerWidth) {
            left = window.innerWidth - tooltipRect.width - margin;
        }

        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
    }
}

export function setupEventListeners() {
    initializeTooltips();
    // The main research form is gone, but we'll re-purpose its handler for the modal
    // document.getElementById(CONSTANTS.FORM_STOCK_RESEARCH)?.addEventListener('submit', handleResearchSubmit);
    
    document.getElementById('manage-stock-form')?.addEventListener('submit', handleSaveStock);
    document.getElementById('cancel-manage-stock-button')?.addEventListener('click', () => closeModal(CONSTANTS.MODAL_MANAGE_STOCK));
    document.getElementById('delete-stock-button')?.addEventListener('click', (e) => {
        const ticker = document.getElementById('manage-stock-original-ticker').value;
        if(ticker) {
            closeModal(CONSTANTS.MODAL_MANAGE_STOCK);
            handleDeleteStock(ticker);
        }
    });

    document.getElementById('manage-fmp-endpoint-form')?.addEventListener('submit', handleSaveFmpEndpoint);
    document.getElementById('cancel-fmp-endpoint-edit')?.addEventListener('click', cancelFmpEndpointEdit);

    document.getElementById('manage-broad-endpoint-form')?.addEventListener('submit', handleSaveBroadEndpoint);
    document.getElementById('cancel-broad-endpoint-edit')?.addEventListener('click', cancelBroadEndpointEdit);

    document.querySelectorAll('.save-to-drive-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const modalId = e.target.dataset.modalId;
            handleSaveToDrive(modalId);
        });
    });
    
    document.querySelectorAll('.save-to-db-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const modalId = e.target.dataset.modalId;
            if (modalId === 'rawDataViewerModal') {
                handleSaveReportToDb();
            }
        });
    });

    const scrollTopBtn = document.getElementById(CONSTANTS.BUTTON_SCROLL_TOP);
    if (scrollTopBtn) scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    document.getElementById('manage-all-stocks-button')?.addEventListener('click', openPortfolioManagerModal);
    document.getElementById('manage-fmp-endpoints-button')?.addEventListener('click', openManageFmpEndpointsModal);
    document.getElementById('manage-broad-endpoints-button')?.addEventListener('click', openManageBroadEndpointsModal);
    document.getElementById('session-log-button')?.addEventListener('click', openSessionLogModal);

    const modalsToClose = [
        { modal: CONSTANTS.MODAL_CUSTOM_ANALYSIS, button: 'close-custom-analysis-modal', bg: 'close-custom-analysis-modal-bg' },
        { modal: CONSTANTS.MODAL_INDUSTRY_ANALYSIS, button: 'close-industry-analysis-modal', bg: 'close-industry-analysis-modal-bg' },
        { modal: CONSTANTS.MODAL_MANAGE_STOCK, bg: 'close-manage-stock-modal-bg'},
        { modal: CONSTANTS.MODAL_CONFIRMATION, button: 'cancel-button'},
        { modal: CONSTANTS.MODAL_PORTFOLIO_MANAGER, button: 'close-portfolio-manager-modal', bg: 'close-portfolio-manager-modal-bg' },
        { modal: CONSTANTS.MODAL_VIEW_FMP_DATA, button: 'close-view-fmp-data-modal', bg: 'close-view-fmp-data-modal-bg' },
        { modal: CONSTANTS.MODAL_MANAGE_FMP_ENDPOINTS, button: 'close-manage-fmp-endpoints-modal', bg: 'close-manage-fmp-endpoints-modal-bg' },
        { modal: CONSTANTS.MODAL_MANAGE_BROAD_ENDPOINTS, button: 'close-manage-broad-endpoints-modal', bg: 'close-manage-broad-endpoints-modal-bg' },
        { modal: 'rawDataViewerModal', button: 'close-raw-data-viewer-modal-button', bg: 'close-raw-data-viewer-modal-bg' },
        { modal: 'rawDataViewerModal', button: 'close-raw-data-viewer-modal' },
        { modal: CONSTANTS.MODAL_STOCK_LIST, button: 'close-stock-list-modal', bg: 'close-stock-list-modal-bg' },
        { modal: CONSTANTS.MODAL_SESSION_LOG, button: 'close-session-log-modal', bg: 'close-session-log-modal-bg' },
    ];

    modalsToClose.forEach(item => {
        const close = () => closeModal(item.modal);
        if (item.button) document.getElementById(item.button)?.addEventListener('click', close);
        if (item.bg) document.getElementById(item.bg)?.addEventListener('click', close);
    });

    window.addEventListener('scroll', () => {
        const btn = document.getElementById(CONSTANTS.BUTTON_SCROLL_TOP);
        if (btn) btn.classList.toggle(CONSTANTS.CLASS_HIDDEN, window.scrollY <= 300);
    });

    document.getElementById('rawDataViewerModal').addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        if (target.matches('.tab-button')) {
            const tabId = target.dataset.tab;
            document.querySelectorAll('#rawDataViewerModal .tab-content').forEach(c => c.classList.add('hidden'));
            document.querySelectorAll('#rawDataViewerModal .tab-button').forEach(b => b.classList.remove('active'));
            document.getElementById(`${tabId}-tab`).classList.remove('hidden');
            target.classList.add('active');
            return;
        }
        
        const symbol = target.dataset.symbol;
        if (!symbol) return;

        if (target.matches('.ai-analysis-button')) {
            const reportType = target.dataset.reportType;
            const promptConfig = promptMap[reportType];
            if (promptConfig) {
                handleAnalysisRequest(symbol, reportType, promptConfig);
            }
        }
        
        if (target.id === 'investment-memo-button') {
            handleInvestmentMemoRequest(symbol);
        }
    });
	
	document.getElementById('manageBroadEndpointsModal')?.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        const id = target.dataset.id;
        if (target.classList.contains('edit-broad-endpoint-btn')) {
            handleEditBroadEndpoint(id, target.dataset.name, target.dataset.url);
        } else if (target.classList.contains('delete-broad-endpoint-btn')) {
            handleDeleteBroadEndpoint(id);
        }
    });

    setupGlobalEventListeners();
}

// --- AI ANALYSIS REPORT GENERATORS ---

async function getSavedReports(ticker, reportType) {
    const reportsRef = collection(state.db, CONSTANTS.DB_COLLECTION_AI_REPORTS);
    const q = query(reportsRef, where("ticker", "==", ticker), where("reportType", "==", reportType), orderBy("savedAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

function buildAnalysisPayload(fullData, requiredEndpoints) {
    const payload = {};
    for (const endpointName of requiredEndpoints) {
        if (fullData.hasOwnProperty(endpointName)) {
            payload[endpointName] = fullData[endpointName];
        }
    }
    return payload;
}


async function handleAnalysisRequest(symbol, reportType, promptConfig, forceNew = false) {
    const contentContainer = document.getElementById('ai-article-container');
    const statusContainer = document.getElementById('report-status-container-ai');
    
    contentContainer.innerHTML = ''; // Clear previous content
    statusContainer.classList.add('hidden');

    try {
        const savedReports = await getSavedReports(symbol, reportType);

        if (savedReports.length > 0 && !forceNew) {
            const latestReport = savedReports[0];
            displayReport(contentContainer, latestReport.content, latestReport.prompt);
            contentContainer.dataset.currentPrompt = latestReport.prompt || '';
            contentContainer.dataset.rawMarkdown = latestReport.content;
            updateReportStatus(statusContainer, savedReports, latestReport.id, { symbol, reportType, promptConfig });
            return; 
        }

        openModal(CONSTANTS.MODAL_LOADING);
        const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);
        
        const data = await getFmpStockData(symbol);
        if (!data) throw new Error(`No cached FMP data found for ${symbol}.`);
        
        const requiredEndpoints = promptConfig.requires || [];
        const missingEndpoints = requiredEndpoints.filter(ep => !data[ep]);

        if (missingEndpoints.length > 0) {
            const specialReqs = ANALYSIS_REQUIREMENTS[reportType] || [];
            const isSpecialMissing = specialReqs.some(req => missingEndpoints.includes(req));

            if (isSpecialMissing) {
                closeModal(CONSTANTS.MODAL_LOADING);
                openConfirmationModal(
                    'Data Refresh Required',
                    `This analysis requires specific data that is not yet cached for ${symbol} (${missingEndpoints.join(', ')}). Would you like to refresh all FMP data now? This may take a moment.`,
                    async () => {
                        await handleRefreshFmpData(symbol);
                        // After refresh, re-run the request forcing a new generation
                        await handleAnalysisRequest(symbol, reportType, promptConfig, true);
                    }
                );
                return;
            }
        }
        
        let payloadData;
        if (reportType === 'UndervaluedAnalysis') {
            payloadData = _calculateUndervaluedMetrics(data);
        } else if (reportType === 'FinancialAnalysis') {
            payloadData = _calculateFinancialAnalysisMetrics(data);
        } else if (reportType === 'BullVsBear') {
            payloadData = _calculateBullVsBearMetrics(data);
        } else if (reportType === 'MoatAnalysis') {
            payloadData = _calculateMoatAnalysisMetrics(data);
        } else if (reportType === 'DividendSafety') {
            payloadData = _calculateDividendSafetyMetrics(data);
        } else if (reportType === 'GrowthOutlook') {
            payloadData = _calculateGrowthOutlookMetrics(data);
        } else if (reportType === 'RiskAssessment') {
            payloadData = _calculateRiskAssessmentMetrics(data);
        } else if (reportType === 'CapitalAllocators') {
            payloadData = _calculateCapitalAllocatorsMetrics(data);
        } else if (reportType === 'NarrativeCatalyst') {
            payloadData = _calculateNarrativeCatalystMetrics(data);
        } else {
            payloadData = buildAnalysisPayload(data, requiredEndpoints);
        }

        const profile = data.profile?.[0] || {};
        const companyName = profile.companyName || 'the company';
        const tickerSymbol = profile.symbol || symbol;

        const promptTemplate = promptConfig.prompt;
        const prompt = promptTemplate
            .replace(/{companyName}/g, companyName)
            .replace(/{tickerSymbol}/g, tickerSymbol)
            .replace('{jsonData}', JSON.stringify(payloadData, null, 2));

        contentContainer.dataset.currentPrompt = prompt;

        const newReportContent = await generatePolishedArticle(prompt, loadingMessage);
        contentContainer.dataset.rawMarkdown = newReportContent;
        displayReport(contentContainer, newReportContent, prompt);
        updateReportStatus(statusContainer, [], null, { symbol, reportType, promptConfig });

    } catch (error) {
        displayMessageInModal(`Could not generate or load analysis: ${error.message}`, 'error');
        contentContainer.innerHTML = `<p class="text-red-500">Failed to generate report: ${error.message}</p>`;
    } finally {
        if (document.getElementById(CONSTANTS.MODAL_LOADING).classList.contains('is-open')) {
            closeModal(CONSTANTS.MODAL_LOADING);
        }
    }
}

async function handleInvestmentMemoRequest(symbol) {
    const contentContainer = document.getElementById('ai-article-container');
    const statusContainer = document.getElementById('report-status-container-ai');
    contentContainer.innerHTML = '';
    statusContainer.classList.add('hidden');

    openModal(CONSTANTS.MODAL_LOADING);
    const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);

    try {
        loadingMessage.textContent = "Gathering all latest analysis reports from the database...";
        const reportTypes = [
            'FinancialAnalysis', 'UndervaluedAnalysis', 'BullVsBear', 'MoatAnalysis', 
            'DividendSafety', 'GrowthOutlook', 'RiskAssessment', 'CapitalAllocators',
            'NarrativeCatalyst'
        ];

        const reportPromises = reportTypes.map(type => getSavedReports(symbol, type).then(reports => reports[0])); // Get only the latest
        const allLatestReports = await Promise.all(reportPromises);

        const foundReports = allLatestReports.filter(Boolean); // Filter out any undefined/null reports
        const missingReports = reportTypes.filter((type, index) => !allLatestReports[index]);

        if (missingReports.length > 0) {
            throw new Error(`Cannot generate memo. Please generate and save the following reports first: ${missingReports.join(', ')}`);
        }

        loadingMessage.textContent = "Synthesizing reports into a final memo...";
        
        let allAnalysesData = foundReports.map(report => {
            const reportTitle = report.content.match(/#\s*(.*)/)?.[1] || report.reportType;
            return `--- REPORT: ${reportTitle} ---\n\n${report.content}\n\n`;
        }).join('\n');
        
        const data = await getFmpStockData(symbol);
        const profile = data.profile?.[0] || {};
        const companyName = profile.companyName || 'the company';

        const prompt = INVESTMENT_MEMO_PROMPT
            .replace(/{companyName}/g, companyName)
            .replace(/{tickerSymbol}/g, symbol)
            .replace('{allAnalysesData}', allAnalysesData);

        const memoContent = await generatePolishedArticle(prompt, loadingMessage);
        displayReport(contentContainer, memoContent);
        
        // Since this is a unique, synthesized report, we don't show versioning for it.
        statusContainer.innerHTML = `<span class="text-sm font-semibold text-green-800">Investment Memo generated successfully.</span>`;
        statusContainer.classList.remove('hidden');

    } catch (error) {
        console.error("Error generating investment memo:", error);
        displayMessageInModal(`Could not generate memo: ${error.message}`, 'error');
        contentContainer.innerHTML = `<p class="text-red-500">Failed to generate memo: ${error.message}</p>`;
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}


async function handleSaveReportToDb() {
    const modal = document.getElementById('rawDataViewerModal');
    const symbol = modal.querySelector('.ai-analysis-button')?.dataset.symbol;
    const contentContainer = document.getElementById('ai-article-container');
    const statusContainer = document.getElementById('report-status-container-ai');
    const reportType = statusContainer.dataset.activeReportType;
    const contentToSave = contentContainer.dataset.rawMarkdown;

    if (!symbol || !reportType || !contentToSave) {
        displayMessageInModal("Please generate an analysis before saving.", "warning");
        return;
    }

    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Saving ${reportType} report to database...`;

    try {
        const reportData = {
            ticker: symbol,
            reportType: reportType,
            content: contentToSave,
            savedAt: Timestamp.now()
        };
        await addDoc(collection(state.db, CONSTANTS.DB_COLLECTION_AI_REPORTS), reportData);
        displayMessageInModal("Report saved successfully!", "info");
        
        const savedReports = await getSavedReports(symbol, reportType);
        const latestReport = savedReports[0];
        const promptConfig = promptMap[reportType];
        updateReportStatus(document.getElementById('report-status-container-ai'), savedReports, latestReport.id, { symbol, reportType, promptConfig });

    } catch (error) {
        console.error("Error saving report to DB:", error);
        displayMessageInModal(`Could not save report: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}


function displayReport(container, content, prompt = null) {
    let finalHtml = '';
    if (prompt) {
        finalHtml += `
            <details class="mb-4 border rounded-lg">
                <summary class="p-2 font-semibold text-sm text-gray-700 cursor-pointer hover:bg-gray-50 bg-gray-100">View Prompt</summary>
                <pre class="text-xs whitespace-pre-wrap break-all bg-gray-900 text-white p-3 rounded-b-lg">${sanitizeText(prompt)}</pre>
            </details>
        `;
    }

    finalHtml += marked.parse(content || '');
    container.innerHTML = finalHtml;
}

function updateReportStatus(statusContainer, reports, activeReportId, analysisParams) {
    statusContainer.classList.remove('hidden');
    statusContainer.dataset.activeReportType = analysisParams.reportType;
    let statusHtml = '';

    if (reports.length > 0) {
        const activeReport = reports.find(r => r.id === activeReportId) || reports[0];
        const savedDate = activeReport.savedAt.toDate().toLocaleString();
        
        statusHtml = `
            <div class="flex items-center gap-2">
                <span class="text-sm font-semibold text-blue-800">Displaying report from: ${savedDate}</span>
                <select id="version-selector-${analysisParams.reportType}" class="text-sm border-gray-300 rounded-md">
                    ${reports.map(r => `<option value="${r.id}" ${r.id === activeReport.id ? 'selected' : ''}>${r.savedAt.toDate().toLocaleString()}</option>`).join('')}
                </select>
            </div>
            <button id="generate-new-${analysisParams.reportType}" class="bg-green-500 hover:bg-green-600 text-white text-xs font-semibold py-1 px-3 rounded-full">Generate New Report</button>
        `;
    } else {
        statusHtml = `
            <span class="text-sm font-semibold text-green-800">Displaying newly generated report.</span>
            <button id="generate-new-${analysisParams.reportType}" class="bg-green-500 hover:bg-green-600 text-white text-xs font-semibold py-1 px-3 rounded-full">Generate New Report</button>
        `;
    }
    
    statusContainer.innerHTML = statusHtml;

    const versionSelector = document.getElementById(`version-selector-${analysisParams.reportType}`);
    if (versionSelector) {
        versionSelector.addEventListener('change', (e) => {
            const selectedReport = reports.find(r => r.id === e.target.value);
            if (selectedReport) {
                const contentContainer = statusContainer.nextElementSibling;
                displayReport(contentContainer, selectedReport.content, selectedReport.prompt);
                contentContainer.dataset.currentPrompt = selectedReport.prompt || '';
                contentContainer.dataset.rawMarkdown = selectedReport.content;
                updateReportStatus(statusContainer, reports, selectedReport.id, analysisParams);
            }
        });
    }

    const generateNewBtn = document.getElementById(`generate-new-${analysisParams.reportType}`);
    if (generateNewBtn) {
        generateNewBtn.addEventListener('click', () => {
            handleAnalysisRequest(analysisParams.symbol, analysisParams.reportType, analysisParams.promptConfig, true);
        });
    }
}

async function handleSaveToDrive(modalId) {
    if (!state.auth.currentUser || state.auth.currentUser.isAnonymous) {
        displayMessageInModal("Please log in with Google to save files to Drive.", "warning");
        return;
    }

    const modal = document.getElementById(modalId);
    if (!modal) return;

    let contentToSave = '';
    let fileName = '';

    const contentContainer = modal.querySelector('#custom-analysis-content, #industry-analysis-content, #view-fmp-data-content, #ai-article-container');

    if (!contentContainer || !contentContainer.innerHTML.trim()) {
        displayMessageInModal('There is no content to save.', 'warning');
        return;
    }
    contentToSave = contentContainer.innerHTML;
    
    const modalTitleText = modal.querySelector('h2').textContent;
    const reportH1 = contentContainer.querySelector('h1');
    const reportTitleText = reportH1 ? reportH1.textContent : '';

    let symbolOrContext = '';
    let reportTypeName = modal.dataset.analysisName || '';

    if (modalId === 'rawDataViewerModal' && reportTitleText) {
        symbolOrContext = modalTitleText.replace('Analysis for', '').trim();
        reportTypeName = reportTitleText.split(':')[0].trim();
    } else {
        const titleParts = modalTitleText.split('|').map(s => s.trim());
        if (!reportTypeName) {
            reportTypeName = titleParts[0];
        }
        symbolOrContext = titleParts.length > 1 ? titleParts[1] : '';
    }

    const cleanSymbol = symbolOrContext.replace(/\s+/g, '_');
    const cleanReportType = reportTypeName.replace(/\s+/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];

    if (cleanSymbol && cleanReportType) {
        fileName = `${cleanSymbol}_${cleanReportType}_${dateStr}.md`;
    } else {
        fileName = `${(cleanReportType || cleanSymbol).replace(/ /g, '_') || 'AI_Analysis'}_${dateStr}.md`;
    }


    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Saving to Google Drive...`;

    try {
        const accessToken = await getDriveToken();
        
        await new Promise((resolve, reject) => {
            gapi.load('client', () => {
                gapi.client.setToken({ access_token: accessToken });
                gapi.client.load('drive', 'v3').then(resolve).catch(reject);
            });
        });

        const folderId = await getOrCreateDriveFolder();
        await createDriveFile(folderId, fileName, contentToSave);
        displayMessageInModal(`${fileName} was saved successfully to your "Stock Evaluations" folder in Google Drive.`, 'info');
    } catch (error) {
        console.error("Error saving to drive:", error);
        displayMessageInModal(`Failed to save to Drive: ${error.message || 'Check console for details.'}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

/**
 * Calculates a summary of metrics for the "Undervalued Analysis" prompt.
 * @param {object} data - The full FMP data object for a stock.
 * @returns {object} A summary object with pre-calculated metrics.
 */
function _calculateUndervaluedMetrics(data) {
    const profile = data.profile?.[0] || {};
    const incomeStatements = (data.income_statement_annual || []).slice().reverse(); // Oldest to newest
    const keyMetrics = (data.key_metrics_annual || []).slice().reverse(); // Oldest to newest
    const cashFlows = (data.cash_flow_statement_annual || []).slice().reverse();
    const ratios = (data.ratios_annual || []).slice().reverse(); // Oldest to newest

    const latestMetrics = keyMetrics[keyMetrics.length - 1] || {};
    const latestCashFlow = cashFlows[cashFlows.length - 1] || {};
    const latestRatios = ratios[ratios.length - 1] || {};
    
    // Helper to calculate YoY Growth
    const calculateYoyGrowth = (data, key) => {
        const trends = [];
        for (let i = 1; i < data.length; i++) {
            const prev = data[i - 1][key];
            const curr = data[i][key];
            if (prev && curr && prev !== 0) {
                const growth = ((curr - prev) / prev) * 100;
                trends.push({ year: data[i].calendarYear, growth: `${growth.toFixed(2)}%` });
            }
        }
        return trends.slice(-6); // Last 6 years of growth
    };

    // Helper to get last N years of a metric
    const getTrend = (data, key, formatFn = (v) => v) => {
        return data.slice(-6).map(d => ({ year: d.calendarYear, value: formatFn(d[key]) }));
    };
    
    // Helper to calculate historical average
    const calculateAverage = (data, key) => {
        const values = data.slice(-5).map(d => d[key]).filter(v => typeof v === 'number');
        if (values.length === 0) return null;
        return values.reduce((a, b) => a + b, 0) / values.length;
    };

    // 1. Growth & Profitability
    const revenueGrowthTrend = calculateYoyGrowth(incomeStatements, 'revenue');
    const profitabilityTrend = getTrend(ratios, 'netProfitMargin', v => typeof v === 'number' ? `${(v * 100).toFixed(2)}%` : 'N/A');

    // 2. Financial Health
    const roeTrend = getTrend(ratios, 'returnOnEquity', v => typeof v === 'number' ? `${(v * 100).toFixed(2)}%` : 'N/A');
    const debtToEquity = latestRatios.debtToEquityRatio ? latestRatios.debtToEquityRatio.toFixed(2) : 'N/A';
    
    // 3. Dividend Analysis
    const dividendYield = latestMetrics.dividendYield ? `${(latestMetrics.dividendYield * 100).toFixed(2)}%` : 'N/A';
    let cashFlowPayoutRatio = 'N/A';
    if (latestCashFlow.operatingCashFlow && latestCashFlow.dividendsPaid) {
        if (latestCashFlow.operatingCashFlow > 0) {
            const ratio = (Math.abs(latestCashFlow.dividendsPaid) / latestCashFlow.operatingCashFlow) * 100;
            cashFlowPayoutRatio = `${ratio.toFixed(2)}%`;
        }
    }

    // 4. Valuation Multiples
    const peRatio = latestMetrics.peRatio ? latestMetrics.peRatio.toFixed(2) : 'N/A';
    const psRatio = latestMetrics.priceToSalesRatio ? latestMetrics.priceToSalesRatio.toFixed(2) : 'N/A';
    const pbRatio = latestMetrics.pbRatio ? latestMetrics.pbRatio.toFixed(2) : 'N/A';

    // 5. Valuation in Context
    const historicalPe = calculateAverage(keyMetrics, 'peRatio');
    const historicalPs = calculateAverage(keyMetrics, 'priceToSalesRatio');
    const historicalPb = calculateAverage(keyMetrics, 'pbRatio');

    const valuationRelativeToHistory = {
        pe: {
            current: peRatio,
            historicalAverage: historicalPe ? historicalPe.toFixed(2) : 'N/A',
            status: historicalPe && peRatio !== 'N/A' ? (peRatio > historicalPe ? 'Premium' : 'Discount') : 'N/A'
        },
        ps: {
            current: psRatio,
            historicalAverage: historicalPs ? historicalPs.toFixed(2) : 'N/A',
            status: historicalPs && psRatio !== 'N/A' ? (psRatio > historicalPs ? 'Premium' : 'Discount') : 'N/A'
        },
        pb: {
            current: pbRatio,
            historicalAverage: historicalPb ? historicalPb.toFixed(2) : 'N/A',
            status: historicalPb && pbRatio !== 'N/A' ? (pbRatio > historicalPb ? 'Premium' : 'Discount') : 'N/A'
        }
    };
    
    // 6. Graham Number
    const grahamNumber = latestMetrics.grahamNumber;
    const currentPrice = profile.price;
    let grahamVerdict = 'N/A';
    if (grahamNumber && currentPrice) {
        grahamVerdict = currentPrice < grahamNumber ? 'UNDERVALUED' : 'OVERVALUED';
    }

    // 7. Analyst Consensus & Estimates
    const analystConsensus = (data.stock_grade_news || []).slice(0, 5).map(g => `${g.gradingCompany}: ${g.newGrade}`).join(', ');
    const latestEstimate = (data.analyst_estimates || []).find(e => new Date(e.date).getFullYear() === new Date().getFullYear() + 1);

    return {
        summary: {
            industry: profile.industry || 'N/A',
        },
        revenueGrowthTrend,
        profitabilityTrend,
        roeTrend,
        debtToEquity,
        dividendYield,
        cashFlowPayoutRatio,
        peRatio,
        psRatio,
        pbRatio,
        valuationRelativeToHistory,
        grahamNumberAnalysis: {
            grahamNumber: grahamNumber ? grahamNumber.toFixed(2) : 'N/A',
            currentPrice: currentPrice || 'N/A',
            verdict: grahamVerdict
        },
        analystConsensus: analystConsensus || 'No recent ratings.',
        analystEstimatesSummary: latestEstimate ? `Avg. estimated revenue for next year is ${formatLargeNumber(latestEstimate.estimatedRevenueAvg)}.` : 'No estimates available.'
    };
}

/**
 * Calculates a comprehensive summary of metrics for the "Financial Analysis" prompt.
 * @param {object} data - The full FMP data object for a stock.
 * @returns {object} A summary object with pre-calculated metrics and trends.
 */
function _calculateFinancialAnalysisMetrics(data) {
    // 1. Helpers
    const getTrendStatus = (series, lookback = 5, isPercentage = true) => {
        if (!series || series.length < 3) return "Not enough data for a trend.";
        const recentSeries = series.slice(-lookback);
        if (recentSeries.length < 3) return "Not enough data for a trend.";

        const firstHalf = recentSeries.slice(0, Math.floor(recentSeries.length / 2));
        const secondHalf = recentSeries.slice(Math.ceil(recentSeries.length / 2));
        
        const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
        const firstAvg = avg(firstHalf);
        const secondAvg = avg(secondHalf);

        const change = ((secondAvg - firstAvg) / Math.abs(firstAvg)) * 100;
        
        if (change > (isPercentage ? 5 : 10)) return 'is improving';
        if (change < -(isPercentage ? 5 : 10)) return 'is declining';
        return 'has been stable';
    };
    
    const calculateAverage = (data, key, lookback = 5) => {
        const values = data.slice(-lookback).map(d => d[key]).filter(v => typeof v === 'number');
        if (values.length === 0) return null;
        return values.reduce((a, b) => a + b, 0) / values.length;
    };

    // 2. Data Preparation
    const profile = data.profile?.[0] || {};
    const incomeStatements = (data.income_statement_annual || []).slice().reverse();
    const keyMetrics = (data.key_metrics_annual || []).slice().reverse();
    const cashFlows = (data.cash_flow_statement_annual || []).slice().reverse();
    const grades = (data.stock_grade_news || []).slice(0, 15);

    const latestIncome = incomeStatements[incomeStatements.length - 1] || {};
    const latestMetrics = keyMetrics[keyMetrics.length - 1] || {};
    const latestCashFlow = cashFlows[cashFlows.length - 1] || {};

    // 3. Calculations
    // Summary
    const analystConsensus = (() => {
        if (grades.length === 0) return "No recent analyst ratings available.";
        const buys = grades.filter(g => ['buy', 'outperform', 'overweight', 'strong buy'].includes(g.newGrade.toLowerCase())).length;
        const sells = grades.filter(g => ['sell', 'underperform', 'underweight'].includes(g.newGrade.toLowerCase())).length;
        const holds = grades.length - buys - sells;
        return `Generally ${buys > sells ? 'positive' : 'neutral'}, with ${buys} buys, ${holds} holds, and ${sells} sells in the last ${grades.length} ratings.`;
    })();
    const summary = {
        companyName: profile.companyName,
        tickerSymbol: profile.symbol,
        description: profile.description,
        sector: profile.sector,
        industry: profile.industry,
        marketCap: formatLargeNumber(profile.mktCap),
        priceRange: profile.range || 'N/A',
        analystConsensus: analystConsensus,
        insiderOwnership: 'N/A' // This field is not in the provided profile data
    };

    // Performance
    const performance = {
        revenueTrend: `Revenue ${getTrendStatus(incomeStatements.map(i=>i.revenue), 5, false)}.`,
        netIncomeTrend: `Net income ${getTrendStatus(incomeStatements.map(i=>i.netIncome), 5, false)}.`,
        grossProfitMargin: { status: getTrendStatus(keyMetrics.map(k=>k.grossProfitMargin)) },
        operatingProfitMargin: { status: getTrendStatus(keyMetrics.map(k=>k.operatingProfitMargin)) },
        netProfitMargin: { status: getTrendStatus(keyMetrics.map(k=>k.netProfitMargin)) },
        returnOnEquity: { quality: latestMetrics.returnOnEquity > 0.15 ? 'High' : (latestMetrics.returnOnEquity > 0.05 ? 'Moderate' : 'Low') }
    };
    
    // Health
    const health = {
        currentRatio: { status: latestMetrics.currentRatio > 2 ? 'Strong' : (latestMetrics.currentRatio > 1 ? 'Healthy' : 'a potential risk') },
        debtToEquity: { status: latestMetrics.debtToEquity > 1 ? 'Aggressive' : (latestMetrics.debtToEquity > 0.5 ? 'Moderate' : 'Conservative') },
        interestCoverage: { status: latestMetrics.interestCoverage > 5 ? 'Very strong' : (latestMetrics.interestCoverage > 2 ? 'Healthy' : 'a potential concern') }
    };

    // Cash Flow
    const capitalAllocationStory = (() => {
        const recentFlows = cashFlows.slice(-3);
        if (recentFlows.length === 0) return "Not enough data.";
        const total = (key) => recentFlows.reduce((sum, cf) => sum + Math.abs(cf[key] || 0), 0);
        const capex = total('capitalExpenditure');
        const dividends = total('dividendsPaid');
        const buybacks = total('commonStockRepurchased');
        const debtRepay = total('debtRepayment');
        const allocations = { 'investing in growth (CapEx)': capex, 'paying dividends': dividends, 'buying back stock': buybacks, 'paying down debt': debtRepay };
        const largest = Object.keys(allocations).reduce((a, b) => allocations[a] > allocations[b] ? a : b);
        return `The company is primarily in return/deleveraging mode, with its largest use of cash over the last few years being ${largest}.`;
    })();
    const cashFlow = {
        qualityOfEarnings: latestCashFlow.operatingCashFlow > latestIncome.netIncome ? "Strong, as operating cash flow exceeds net income." : "A potential concern, as net income is higher than operating cash flow.",
        capitalAllocationStory
    };

    // Valuation
    const valuationMetrics = ['peRatio', 'priceToSalesRatio', 'pbRatio', 'enterpriseValueOverEBITDA'];
    const valuation = valuationMetrics.map(metric => {
        const current = latestMetrics[metric];
        const historicalAverage = calculateAverage(keyMetrics, metric);
        let status = 'N/A';
        if (current && historicalAverage) {
            status = current > historicalAverage ? 'trading at a premium to its historical average' : 'trading at a discount to its historical average';
        }
        return { metric, status };
    });

    // Thesis
    const bullCasePoints = [];
    if (performance.revenueTrend.includes('growing')) bullCasePoints.push("Consistent or growing revenue.");
    if (cashFlow.qualityOfEarnings.includes('Strong')) bullCasePoints.push("Strong operating cash flow that exceeds net income.");
    if (health.debtToEquity.status === 'Conservative') bullCasePoints.push("A strong balance sheet with a conservative debt load.");
    if (performance.returnOnEquity.quality === 'High') bullCasePoints.push("High return on equity, indicating efficient use of shareholder capital.");

    const bearCasePoints = [];
    if (performance.revenueTrend.includes('declining')) bearCasePoints.push("Declining or stagnant revenue.");
    if (performance.netIncomeTrend.includes('declining')) bearCasePoints.push("Declining profitability.");
    if (health.debtToEquity.status === 'Aggressive') bearCasePoints.push("High debt load, which adds financial risk.");
    if (health.currentRatio.status === 'a potential risk') bearCasePoints.push("Low liquidity, which could be a short-term risk.");
    
    const moatIndicator = (() => {
        const highRoe = keyMetrics.slice(-5).every(k => k.returnOnEquity > 0.15);
        const stableMargins = !performance.netProfitMargin.status.includes('declining');
        if (highRoe && stableMargins) return "The data, showing consistently high ROE and stable margins, suggests the presence of a strong competitive moat.";
        if (stableMargins) return "The data suggests a potential moat, indicated by stable profit margins.";
        return "The data does not strongly indicate a durable competitive moat, due to fluctuating margins or returns.";
    })();

    const thesis = { bullCasePoints, bearCasePoints, moatIndicator };
    
    return { summary, performance, health, cashFlow, valuation, thesis };
}

/**
 * NEW: Calculates metrics for the "Bull Vs Bear" prompt.
 */
function _calculateBullVsBearMetrics(data) {
    const income = (data.income_statement_annual || []).slice(-5);
    const metrics = (data.key_metrics_annual || []).slice(-5);
    const cashFlow = (data.cash_flow_statement_annual || []).slice(-5);
    const grades = (data.stock_grade_news || []).slice(0, 10);
    const ratios = (data.ratios_annual || []).slice(-5);

    const formatTrend = (arr, key) => arr.map(item => ({ year: item.calendarYear, value: formatLargeNumber(item[key]) }));
    const formatPercentTrend = (arr, key) => arr.map(item => ({ year: item.calendarYear, value: item[key] ? `${(item[key] * 100).toFixed(2)}%` : 'N/A' }));

    return {
        growth_trends: {
            revenue: formatTrend(income, 'revenue'),
            net_income: formatTrend(income, 'netIncome')
        },
        profitability_metrics: {
            roe_trend: formatPercentTrend(ratios, 'returnOnEquity'),
            net_profit_margin_trend: formatPercentTrend(ratios, 'netProfitMargin'),
            operating_margin_trend: formatPercentTrend(metrics, 'operatingMargin')
        },
        cash_flow_trends: {
            operating_cash_flow: formatTrend(cashFlow, 'operatingCashFlow')
        },
        valuation_metrics: {
            pe_ratio_trend: metrics.map(m => ({ year: m.calendarYear, value: m.peRatio?.toFixed(2) })),
            pb_ratio_trend: metrics.map(m => ({ year: m.calendarYear, value: m.pbRatio?.toFixed(2) }))
        },
        balance_sheet_health: {
            debt_to_equity_trend: metrics.map(m => ({ year: m.calendarYear, value: m.debtToEquity?.toFixed(2) }))
        },
        analyst_ratings: grades.map(g => ({ company: g.gradingCompany, from: g.previousGrade, to: g.newGrade }))
    };
}

/**
 * NEW: Calculates metrics for the "Moat Analysis" prompt.
 */
function _calculateMoatAnalysisMetrics(data) {
    const profile = data.profile?.[0] || {};
    const metrics = (data.key_metrics_annual || []).slice(-10);
    const income = (data.income_statement_annual || []).slice(-10);
    const cashFlow = (data.cash_flow_statement_annual || []).slice(-10);

    const formatPercentTrend = (arr, key) => arr.map(item => ({ year: item.calendarYear, value: item[key] ? `${(item[key] * 100).toFixed(2)}%` : 'N/A' }));

    return {
        description: profile.description,
        trends: {
            returnOnInvestedCapital: formatPercentTrend(metrics, 'returnOnInvestedCapital'),
            netProfitMargin: formatPercentTrend(metrics, 'netProfitMargin'),
            operatingIncome: income.map(i => ({ year: i.calendarYear, value: formatLargeNumber(i.operatingIncome) })),
            grossProfitMargin: formatPercentTrend(metrics, 'grossProfitMargin'),
            capitalExpenditure: cashFlow.map(cf => ({ year: cf.calendarYear, value: formatLargeNumber(cf.capitalExpenditure) })),
            researchAndDevelopment: income.map(i => ({ year: i.calendarYear, value: formatLargeNumber(i.researchAndDevelopmentExpenses) }))
        },
        latest_health: {
            debtToEquity: metrics[metrics.length - 1]?.debtToEquity?.toFixed(2) || 'N/A'
        }
    };
}

/**
 * NEW: Calculates metrics for the "Dividend Safety" prompt.
 */
function _calculateDividendSafetyMetrics(data) {
    const metrics = (data.key_metrics_annual || []).slice(-10);
    const cashFlow = (data.cash_flow_statement_annual || []).slice(-10);
    const income = (data.income_statement_annual || []).slice(-10);
    const balanceSheet = (data.balance_sheet_statement_annual || []).slice(-10);

    const latestMetrics = metrics[metrics.length - 1] || {};
    
    // Create a map for easy lookup by year
    const incomeMap = new Map(income.map(i => [i.calendarYear, i]));

    const payoutRatios = cashFlow.map(cf => {
        const correspondingIncome = incomeMap.get(cf.calendarYear);
        const dividends = Math.abs(cf.dividendsPaid || 0);
        const fcf = cf.freeCashFlow;
        const netIncome = correspondingIncome?.netIncome;

        return {
            year: cf.calendarYear,
            fcf_payout_ratio: (fcf && fcf > 0) ? `${((dividends / fcf) * 100).toFixed(2)}%` : 'N/A',
            earnings_payout_ratio: (netIncome && netIncome > 0) ? `${((dividends / netIncome) * 100).toFixed(2)}%` : 'N/A'
        };
    });

    return {
        current_yield: latestMetrics.dividendYield ? `${(latestMetrics.dividendYield * 100).toFixed(2)}%` : 'N/A',
        payout_ratios: payoutRatios,
        dividend_growth_trend: cashFlow.map(cf => ({ year: cf.calendarYear, dividends_paid: formatLargeNumber(cf.dividendsPaid) })),
        balance_sheet_trends: {
            debt_to_equity: metrics.map(m => ({ year: m.calendarYear, value: m.debtToEquity?.toFixed(2) })),
            cash_cushion: balanceSheet.map(bs => ({ year: bs.calendarYear, value: formatLargeNumber(bs.cashAndCashEquivalents) }))
        }
    };
}

/**
 * NEW: Calculates metrics for the "Growth Outlook" prompt.
 */
function _calculateGrowthOutlookMetrics(data) {
    const income = (data.income_statement_annual || []).slice(-5);
    const metrics = (data.key_metrics_annual || []).slice(-5);
    const grades = (data.stock_grade_news || []).slice(0, 10);
    const estimates = (data.analyst_estimates || []).slice(0, 5);

    const latestMetrics = metrics[metrics.length - 1] || {};

    return {
        historical_growth: {
            revenue_trend: income.map(i => ({ year: i.calendarYear, value: formatLargeNumber(i.revenue) })),
            net_income_trend: income.map(i => ({ year: i.calendarYear, value: formatLargeNumber(i.netIncome) }))
        },
        valuation: {
            pe_ratio: latestMetrics.peRatio?.toFixed(2) || 'N/A',
            ev_to_sales: latestMetrics.evToSales?.toFixed(2) || 'N/A'
        },
        reinvestment: {
            rd_as_percent_of_revenue: latestMetrics.researchAndDevelopementToRevenue ? `${(latestMetrics.researchAndDevelopementToRevenue * 100).toFixed(2)}%` : 'N/A',
            capex_as_percent_of_revenue: latestMetrics.capexToRevenue ? `${(latestMetrics.capexToRevenue * 100).toFixed(2)}%` : 'N/A'
        },
        market_expectations: {
            analyst_grades: grades.map(g => ({ date: g.date, company: g.gradingCompany, action: g.action, from: g.previousGrade, to: g.newGrade })),
            future_estimates: estimates.map(e => ({
                date: e.date,
                revenue_avg: formatLargeNumber(e.estimatedRevenueAvg),
                eps_avg: e.estimatedEpsAvg?.toFixed(2)
            }))
        }
    };
}

/**
 * NEW: Calculates metrics for the "Risk Assessment" prompt.
 */
function _calculateRiskAssessmentMetrics(data) {
    const profile = data.profile?.[0] || {};
    const metrics = (data.key_metrics_annual || []).slice(-5);
    const cashFlow = (data.cash_flow_statement_annual || []).slice(-5);
    const income = (data.income_statement_annual || []).slice(-5);
    const grades = (data.stock_grade_news || []).slice(0, 10);

    const latestMetrics = metrics[metrics.length - 1] || {};
    const latestCashFlow = cashFlow[cashFlow.length - 1] || {};
    const latestIncome = income[income.length - 1] || {};

    return {
        financial_risks: {
            debt_to_equity: latestMetrics.debtToEquity?.toFixed(2) || 'N/A',
            current_ratio: latestMetrics.currentRatio?.toFixed(2) || 'N/A',
            earnings_quality: {
                operating_cash_flow: formatLargeNumber(latestCashFlow.operatingCashFlow),
                net_income: formatLargeNumber(latestIncome.netIncome)
            },
            dividend_sustainability: {
                dividends_paid: formatLargeNumber(Math.abs(latestCashFlow.dividendsPaid)),
                net_income: formatLargeNumber(latestIncome.netIncome)
            }
        },
        market_risks: {
            beta: profile.beta?.toFixed(2) || 'N/A',
            valuation: {
                pe_ratio: latestMetrics.peRatio?.toFixed(2) || 'N/A',
                ps_ratio: latestMetrics.priceToSalesRatio?.toFixed(2) || 'N/A'
            },
            analyst_pessimism: grades.filter(g => ['sell', 'underperform', 'underweight'].includes(g.newGrade.toLowerCase()))
                                    .map(g => `${g.gradingCompany} rated ${g.newGrade}`)
        },
        business_risks: {
            recession_sensitivity_sector: profile.sector,
            margin_trend: metrics.map(m => ({ year: m.calendarYear, net_profit_margin: m.netProfitMargin ? `${(m.netProfitMargin * 100).toFixed(2)}%` : 'N/A' })),
            net_interest_margin_trend: (profile.sector === 'Financial Services') ? metrics.map(m => ({ year: m.calendarYear, net_interest_margin: m.netInterestMargin ? `${(m.netInterestMargin * 100).toFixed(2)}%` : 'N/A' })) : 'N/A for this sector'
        }
    };
}

/**
 * NEW: Calculates metrics for the "Capital Allocators" prompt.
 */
function _calculateCapitalAllocatorsMetrics(data) {
    const cashFlow = (data.cash_flow_statement_annual || []).slice(-10);
    const metrics = (data.key_metrics_annual || []).slice(-10);
    const income = (data.income_statement_annual || []).slice(-10);
    const balanceSheet = (data.balance_sheet_statement_annual || []).slice(-10);

    // Create a map for easy lookup by year
    const metricsMap = new Map(metrics.map(m => [m.calendarYear, m]));

    const buyback_vs_valuation = cashFlow.map(cf => {
        const correspondingMetrics = metricsMap.get(cf.calendarYear);
        return {
            year: cf.calendarYear,
            common_stock_repurchased: formatLargeNumber(cf.commonStockRepurchased),
            pe_ratio_that_year: correspondingMetrics?.peRatio?.toFixed(2) || 'N/A',
            pb_ratio_that_year: correspondingMetrics?.priceToBookRatio?.toFixed(2) || 'N/A'
        };
    });

    return {
        cash_flow_statement_annual: cashFlow,
        key_metrics_annual: metrics,
        income_statement_annual: income,
        balance_sheet_statement_annual: balanceSheet,
        buyback_vs_valuation // Add the correlated data directly
    };
}

/**
 * NEW: Calculates metrics for the "Narrative & Catalyst" prompt.
 */
function _calculateNarrativeCatalystMetrics(data) {
    const profile = data.profile?.[0] || {};
    const metrics = (data.key_metrics_annual || []).slice(-5);
    const cashFlow = (data.cash_flow_statement_annual || []).slice(-5);
    const income = (data.income_statement_annual || []).slice(-5);
    const grades = (data.stock_grade_news || []).slice(0, 10);

    const latestMetrics = metrics[metrics.length - 1] || {};
    const latestCashFlow = cashFlow[cashFlow.length - 1] || {};
    const latestIncome = income[income.length - 1] || {};

    const isGrowthAccelerating = () => {
        if (income.length < 3) return false;
        const yoy = (arr, key) => ((arr[arr.length - 1][key] / arr[arr.length - 2][key]) - 1);
        const latestGrowth = yoy(income, 'revenue');
        const prevGrowth = yoy(income.slice(0, -1), 'revenue');
        return latestGrowth > prevGrowth;
    };

    const isMarginExpanding = () => {
        if (metrics.length < 2) return false;
        return metrics[metrics.length - 1].operatingMargin > metrics[metrics.length - 2].operatingMargin;
    };

    return {
        profile: { description: profile.description, industry: profile.industry },
        financial_health: {
            is_profitable: (latestIncome.netIncome || 0) > 0,
            is_cash_flow_positive: (latestCashFlow.freeCashFlow || 0) > 0,
            debt_to_equity: latestMetrics.debtToEquity?.toFixed(2) || 'N/A'
        },
        catalysts: {
            is_growth_accelerating: isGrowthAccelerating(),
            is_margin_expanding: isMarginExpanding(),
            has_recent_upgrades: grades.filter(g => g.action.toLowerCase() === 'upgrade').length > 0
        }
    };
}
