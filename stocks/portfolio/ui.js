// ui.js
import { CONSTANTS, SECTORS, SECTOR_ICONS, state, NEWS_SENTIMENT_PROMPT, DEEP_DIVE_PROMPT } from './config.js';
import { getFmpStockData, callApi, filterValidNews, callGeminiApi, generatePolishedArticle, getDriveToken, getOrCreateDriveFolder, createDriveFile, getGroupedFmpData, generateMorningBriefing, calculatePortfolioHealthScore, runOpportunityScanner, generatePortfolioAnalysis, generateTrendAnalysis, getCachedNews, getScannerResults, generateNewsSummary } from './api.js';
import { getFirestore, Timestamp, doc, setDoc, getDoc, deleteDoc, collection, getDocs, query, limit, addDoc, increment, updateDoc, where, orderBy } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- CHART INSTANCES ---
let allocationChartInstance = null;

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

function formatCurrency(value) {
    if (typeof value !== 'number') return '$--';
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
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
            { name: 'insider_trading_stats', path: 'insider-trading/search', params: 'limit=100', version: 'stable', symbolAsQuery: true }
        ];

        let successfulFetches = 0;

        for (const endpoint of coreEndpoints) {
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
        
        // Fetch executive compensation from SEC-API.io
        if (state.secApiKey) {
            loadingMessage.textContent = `Fetching SEC Data: Executive Compensation...`;
            const secUrl = `https://api.sec-api.io/compensation/${symbol}?token=${state.secApiKey}`;
            try {
                const data = await callApi(secUrl);
                if (data && (!Array.isArray(data) || data.length > 0)) {
                    const docRef = doc(state.db, CONSTANTS.DB_COLLECTION_FMP_CACHE, symbol, 'endpoints', 'executive_compensation');
                    await setDoc(docRef, { cachedAt: Timestamp.now(), data: data });
                    successfulFetches++;
                }
            } catch (error) {
                console.warn(`Could not fetch executive compensation from SEC-API.io for ${symbol}:`, error.message);
                // Don't throw an error, just warn and continue, as it's supplemental data.
            }
        }

        displayMessageInModal(`Successfully fetched and updated data for ${successfulFetches} endpoint(s).`, 'info');
        await fetchAndCachePortfolioData(); // Refresh portfolio cache
        
        // Refresh stock list modal if it's open
        if (document.getElementById(CONSTANTS.MODAL_STOCK_LIST).classList.contains(CONSTANTS.CLASS_MODAL_OPEN)) {
            const modal = document.getElementById(CONSTANTS.MODAL_STOCK_LIST);
            const activeTabButton = modal.querySelector('.modal-tab-button.active');
            if (activeTabButton) {
                const listType = activeTabButton.dataset.tab === 'portfolio' ? 'Portfolio' : 'Watchlist';
                const containerId = listType === 'Portfolio' ? 'portfolio-tab-pane' : 'watchlist-tab-pane';
                document.getElementById(containerId).innerHTML = ''; // Clear to force reload
                await _renderStockListForTab(listType);
            }
        }

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
    if (!briefingContainer) return;

    try {
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

export async function renderPortfolioValue() {
    const valueDisplay = document.getElementById('portfolio-value-display');
    const breakdownDisplay = document.getElementById('portfolio-value-breakdown');
    if (!valueDisplay || !breakdownDisplay) return;

    valueDisplay.textContent = '--';
    breakdownDisplay.innerHTML = `<p>Stocks: $--</p><p>Cash: $--</p>`;

    try {
        const portfolioStocks = state.portfolioCache.filter(s => s.status === 'Portfolio' && s.shares > 0);
        
        const dataPromises = portfolioStocks.map(stock => getFmpStockData(stock.ticker));
        const allStockData = await Promise.all(dataPromises);

        let totalStockValue = 0;
        allStockData.forEach((fmpData, index) => {
            const stock = portfolioStocks[index];
            const price = fmpData?.profile?.[0]?.price;
            if (price && stock.shares) {
                totalStockValue += price * stock.shares;
            }
        });

        const cashBalance = state.cashBalance || 0;
        const totalPortfolioValue = totalStockValue + cashBalance;

        valueDisplay.textContent = formatCurrency(totalPortfolioValue);
        breakdownDisplay.innerHTML = `
            <p>Stocks: ${formatCurrency(totalStockValue)}</p>
            <p>Cash: ${formatCurrency(cashBalance)}</p>
        `;
    } catch (error) {
        console.error("Error rendering portfolio value:", error);
        valueDisplay.textContent = 'Error';
    }
}

export async function renderAllocationChart() {
    const container = document.getElementById('allocation-chart-container');
    if (!container) return;

    if (allocationChartInstance) {
        allocationChartInstance.destroy();
        allocationChartInstance = null;
    }
    container.innerHTML = '<canvas id="allocation-chart"></canvas>';
    const ctx = document.getElementById('allocation-chart').getContext('2d');

    try {
        const portfolioStocks = state.portfolioCache.filter(s => s.status === 'Portfolio' && s.shares > 0);
        const cashBalance = state.cashBalance || 0;

        if (portfolioStocks.length === 0 && cashBalance <= 0) {
            container.innerHTML = `<p class="text-center text-sm text-gray-500">Add stocks to your portfolio to see allocation.</p>`;
            return;
        }

        container.innerHTML = '<div class="loader"></div>';

        const dataPromises = portfolioStocks.map(stock => getFmpStockData(stock.ticker));
        const allStockData = await Promise.all(dataPromises);

        let totalPortfolioValue = 0;
        const chartData = [];

        allStockData.forEach((fmpData, index) => {
            const stock = portfolioStocks[index];
            const price = fmpData?.profile?.[0]?.price;
            const sector = stock.sector || 'Uncategorized';
            if (price && stock.shares) {
                const value = price * stock.shares;
                totalPortfolioValue += value;
                chartData.push({ value, ticker: stock.ticker, sector });
            }
        });
        
        if (cashBalance > 0) {
            chartData.push({ value: cashBalance, ticker: 'Cash', sector: 'Cash' });
            totalPortfolioValue += cashBalance;
        }

        if (chartData.length === 0) {
             container.innerHTML = `<p class="text-center text-sm text-gray-500">Could not calculate portfolio values.</p>`;
             return;
        }

        container.innerHTML = '<canvas id="allocation-chart"></canvas>';
        const finalCtx = document.getElementById('allocation-chart').getContext('2d');

        const sectorColors = {};
        const sectors = [...new Set(chartData.map(d => d.sector))];
        sectors.forEach(sector => {
            if (sector === 'Cash') {
                sectorColors['Cash'] = '#6b7280'; // Gray for cash
                return;
            }
            let hash = 0;
            for (let i = 0; i < sector.length; i++) {
                hash = sector.charCodeAt(i) + ((hash << 5) - hash);
            }
            const color = (hash & 0x00FFFFFF).toString(16).toUpperCase();
            sectorColors[sector] = "#" + "00000".substring(0, 6 - color.length) + color;
        });

        allocationChartInstance = new Chart(finalCtx, {
            type: 'treemap',
            data: {
                datasets: [{
                    tree: chartData,
                    key: 'value',
                    groups: ['sector'],
                    captions: {
                        display: true,
                        color: 'rgba(255, 255, 255, 0.8)',
                        font: { size: 16, weight: 'bold' },
                        padding: 6,
                    },
                    labels: {
                        display: true,
                        formatter: (ctx) => ctx.raw._data.ticker,
                        color: 'white',
                        font: { weight: 'bold', size: 14 }
                    },
                    backgroundColor: (ctx) => {
                        if (ctx.type === 'data') {
                            const sector = ctx.raw._data.sector;
                            const baseColor = sectorColors[sector] || '#CCCCCC';
                            return Chart.helpers.color(baseColor).darken(0.2).rgbString();
                        }
                        if (ctx.type === 'group') {
                            return sectorColors[ctx.raw.g] || '#CCCCCC';
                        }
                        return 'transparent';
                    },
                    borderColor: 'white',
                    borderWidth: 2,
                    spacing: 1
                }]
            },
            options: {
                maintainAspectRatio: false,
                plugins: {
                    title: { display: false },
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            title: (items) => {
                                const item = items[0];
                                const raw = item.raw;
                                return raw.g ? raw.g : raw._data.sector;
                            },
                            label: (item) => {
                                const raw = item.raw;
                                const value = raw.v;
                                const percentage = totalPortfolioValue > 0 ? ((value / totalPortfolioValue) * 100).toFixed(2) : 0;
                                if (raw.g) {
                                    return `${formatCurrency(value)} (${percentage}%)`;
                                } else {
                                    const stock = raw._data;
                                    return `${stock.ticker}: ${formatCurrency(value)} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            }
        });

    } catch (error) {
        console.error("Error rendering allocation chart:", error);
        container.innerHTML = `<p class="text-center text-xs text-red-500">Could not load chart: ${error.message}</p>`;
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
        // Fetch portfolio stocks
        const portfolioQuery = await getDocs(collection(state.db, CONSTANTS.DB_COLLECTION_PORTFOLIO));
        state.portfolioCache = portfolioQuery.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Fetch cash balance
        if (state.userId) {
            const cashDocRef = doc(state.db, CONSTANTS.DB_COLLECTION_USER_DATA, state.userId);
            const cashDoc = await getDoc(cashDocRef);
            if (cashDoc.exists()) {
                state.cashBalance = cashDoc.data().cashBalance || 0;
            } else {
                state.cashBalance = 0;
            }
        }

    } catch (error) {
        console.error("Error loading dashboard data:", error);
        displayMessageInModal(`Failed to load dashboard data: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

async function _renderStockListForTab(listType) {
    const containerId = listType === 'Portfolio' ? 'portfolio-tab-pane' : 'watchlist-tab-pane';
    const container = document.getElementById(containerId);
    if (!container) return;

    // Prevent re-rendering if content already exists
    if (container.innerHTML.trim() !== '') {
        return;
    }
    
    container.innerHTML = `<div class="flex justify-center p-8"><div class="loader"></div></div>`;

    try {
        const stocksToFetch = state.portfolioCache.filter(s => s.status === listType);
        if (stocksToFetch.length === 0) {
            container.innerHTML = `<p class="text-center text-gray-500 py-8">No stocks in your ${listType}.</p>`;
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
    } catch (error) {
        console.error(`Error loading ${listType} list:`, error);
        container.innerHTML = `<p class="text-red-500 text-center">Failed to load ${listType}: ${error.message}</p>`;
    }
}


async function handleOpenStockListViewer() {
    openModal(CONSTANTS.MODAL_STOCK_LIST);
    // Reset tabs to default state on open
    const modal = document.getElementById(CONSTANTS.MODAL_STOCK_LIST);
    modal.querySelectorAll('.modal-tab-button').forEach(btn => btn.classList.remove('active'));
    modal.querySelectorAll('.modal-tab-pane').forEach(pane => {
        pane.classList.remove('active');
        pane.innerHTML = ''; // Clear content to ensure it reloads
    });

    // Set portfolio as the default active tab
    modal.querySelector('.modal-tab-button[data-tab="portfolio"]').classList.add('active');
    modal.querySelector('#portfolio-tab-pane').classList.add('active');
    
    // Load the default tab's content
    await _renderStockListForTab('Portfolio');
}

async function openManageStockModal(stockData = {}) {
    const form = document.getElementById('manage-stock-form');
    form.reset();

    const sharesContainer = document.getElementById('manage-stock-shares-container');
    const sharesInput = document.getElementById('manage-stock-shares');
    const statusSelect = document.getElementById('manage-stock-status');
    
    if (stockData.isEditMode) {
        document.getElementById('manage-stock-modal-title').textContent = `Edit ${stockData.ticker}`;
        document.getElementById('manage-stock-original-ticker').value = stockData.ticker;
        document.getElementById('manage-stock-ticker').value = stockData.ticker;
        document.getElementById('manage-stock-name').value = stockData.companyName;
        document.getElementById('manage-stock-exchange').value = stockData.exchange;
        statusSelect.value = stockData.status || 'Watchlist';
        sharesInput.value = stockData.shares || '';
        document.getElementById('manage-stock-sector').value = stockData.sector || '';
        document.getElementById('manage-stock-industry').value = stockData.industry || '';
    } else {
        document.getElementById('manage-stock-modal-title').textContent = 'Add New Stock';
        document.getElementById('manage-stock-original-ticker').value = '';
        document.getElementById('manage-stock-ticker').value = stockData.ticker || '';
        document.getElementById('manage-stock-name').value = stockData.companyName || '';
        document.getElementById('manage-stock-exchange').value = stockData.exchange || '';
        statusSelect.value = 'Watchlist';
        sharesInput.value = '';
        document.getElementById('manage-stock-sector').value = stockData.sector || '';
        document.getElementById('manage-stock-industry').value = stockData.industry || '';
    }

    if (statusSelect.value === 'Portfolio') {
        sharesContainer.classList.remove('hidden');
    } else {
        sharesContainer.classList.add('hidden');
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

    const status = document.getElementById('manage-stock-status').value;
    const sharesInput = document.getElementById('manage-stock-shares').value;
    const shares = status === 'Portfolio' ? parseFloat(sharesInput) || 0 : 0;

    const stockData = {
        ticker: newTicker,
        companyName: document.getElementById('manage-stock-name').value.trim(),
        exchange: document.getElementById('manage-stock-exchange').value.trim(),
        status: status,
        shares: shares,
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
        renderPortfolioManagerList(); // Refresh the list in the manager modal
        renderPortfolioValue(); // Refresh dashboard value

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
                // Refresh stock list modal if it's open
                if (document.getElementById(CONSTANTS.MODAL_STOCK_LIST).classList.contains(CONSTANTS.CLASS_MODAL_OPEN)) {
                    const modal = document.getElementById(CONSTANTS.MODAL_STOCK_LIST);
                    const activeTabButton = modal.querySelector('.modal-tab-button.active');
                    if (activeTabButton) {
                        const listType = activeTabButton.dataset.tab === 'portfolio' ? 'Portfolio' : 'Watchlist';
                        const containerId = listType === 'Portfolio' ? 'portfolio-tab-pane' : 'watchlist-tab-pane';
                        document.getElementById(containerId).innerHTML = ''; // Clear to force reload
                        await _renderStockListForTab(listType);
                    }
                }
                renderPortfolioValue(); // Refresh dashboard value
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
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.dataset.activeSymbol = ticker; // Store the active symbol
    openModal(modalId);
    
    const rawDataContainer = document.getElementById('raw-data-accordion-container');
    const aiButtonsContainer = document.getElementById('ai-buttons-container');
    const aiArticleContainer = document.getElementById('ai-article-container');
    const profileDisplayContainer = document.getElementById('company-profile-display-container');
    const titleEl = document.getElementById('raw-data-viewer-modal-title');
    const trendContentContainer = document.getElementById('trend-analysis-content');
    const newsContentContainer = document.getElementById('news-content-container');
    const scannerResultsContainer = document.getElementById('scanner-results-tab');
    
    titleEl.textContent = `Analyzing ${ticker}...`;
    rawDataContainer.innerHTML = '<div class="loader mx-auto"></div>';
    aiButtonsContainer.innerHTML = '';
    aiArticleContainer.innerHTML = '';
    profileDisplayContainer.innerHTML = '';
    if (trendContentContainer) trendContentContainer.innerHTML = ''; // Clear trend content on open
    if (newsContentContainer) newsContentContainer.innerHTML = ''; // Clear news content on open
    if (scannerResultsContainer) scannerResultsContainer.innerHTML = ''; // Clear scanner content on open


    document.querySelectorAll('#rawDataViewerModal .tab-content').forEach(c => c.classList.add('hidden'));
    document.querySelectorAll('#rawDataViewerModal .tab-button').forEach(b => b.classList.remove('active'));
    document.getElementById('company-profile-tab').classList.remove('hidden');
    document.querySelector('.tab-button[data-tab="company-profile"]').classList.add('active');

    try {
        const fmpDataPromise = getFmpStockData(ticker);
        const groupedDataPromise = getGroupedFmpData(ticker);
        const savedReportsPromise = getDocs(query(collection(state.db, CONSTANTS.DB_COLLECTION_AI_REPORTS), where("ticker", "==", ticker)));

        const results = await Promise.all([fmpDataPromise, groupedDataPromise, savedReportsPromise]);
        const fmpData = results[0];
        const groupedFmpData = results[1];
        const savedReportsSnapshot = results[2];

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

        // Build the single "Deep Dive" button
        aiButtonsContainer.innerHTML = `
            <button data-symbol="${ticker}" id="deep-dive-analysis-button" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 10.5a.5.5 0 01.5-.5h3a.5.5 0 010 1h-3a.5.5 0 01-.5-.5z" />
                </svg>
                Generate Deep Dive Analysis
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
                <button data-symbol="${symbol}" class.fetch-news-button text-sm bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg">Fetch News</button>
            </div>
            <div class="text-right text-xs text-gray-400 mt-4">
                <div>${fmpTimestampString}</div>
            </div>
        </div>`;
}

// --- PORTFOLIO MANAGER MODAL ---
async function renderPortfolioManagerList() {
    const portfolioContainer = document.getElementById('manager-portfolio-tab-pane');
    const watchlistContainer = document.getElementById('manager-watchlist-tab-pane');
    if (!portfolioContainer || !watchlistContainer) return;

    const cashInput = document.getElementById('manage-cash-amount');
    if (cashInput) {
        cashInput.value = state.cashBalance > 0 ? state.cashBalance : '';
    }

    portfolioContainer.innerHTML = '<div class="flex justify-center p-8"><div class="loader"></div></div>';
    watchlistContainer.innerHTML = '<div class="flex justify-center p-8"><div class="loader"></div></div>';

    const fmpDataPromises = state.portfolioCache.map(stock => getFmpStockData(stock.ticker));
    const fmpDataResults = await Promise.all(fmpDataPromises);
    const fmpDataMap = new Map();
    state.portfolioCache.forEach((stock, index) => {
        if (fmpDataResults[index]) {
            fmpDataMap.set(stock.ticker, fmpDataResults[index]);
        }
    });

    function _generateHtmlForList(stocks) {
        if (stocks.length === 0) {
            return `<p class="text-center text-gray-500 p-8">No stocks in this list.</p>`;
        }
        const groupedBySector = stocks.reduce((acc, stock) => {
            const sector = stock.sector || 'Uncategorized';
            if (!acc[sector]) acc[sector] = [];
            acc[sector].push(stock);
            return acc;
        }, {});
        let html = '';
        const sortedSectors = Object.keys(groupedBySector).sort();
        for (const sector of sortedSectors) {
            html += `<div class="portfolio-exchange-header">${sanitizeText(sector)}</div>`;
            html += '<ul class="divide-y divide-gray-200">';
            groupedBySector[sector].sort((a, b) => a.companyName.localeCompare(b.companyName)).forEach(stock => {
                const statusBadge = stock.status === 'Portfolio'
                    ? '<span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-100 text-green-800">Portfolio</span>'
                    : '<span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">Watchlist</span>';
                const sharesDisplay = stock.status === 'Portfolio' && stock.shares > 0
                    ? `<p class="text-sm text-gray-500">${stock.shares} Shares</p>`: '';
                const fmpData = fmpDataMap.get(stock.ticker);
                const price = fmpData?.profile?.[0]?.price;
                const totalValue = (price && stock.shares) ? price * stock.shares : 0;
                html += `
                    <li class="p-4 flex justify-between items-center hover:bg-gray-50">
                        <div>
                            <p class="font-semibold text-gray-800">${sanitizeText(stock.companyName)} (${sanitizeText(stock.ticker)})</p>
                            <div class="flex items-center gap-2 mt-1">${statusBadge}${sharesDisplay}</div>
                        </div>
                        <div class="flex items-center gap-4">
                            <div class="text-right">
                                <p class="font-semibold text-gray-800">${totalValue > 0 ? formatCurrency(totalValue) : ''}</p>
                                <p class="text-sm text-gray-500">${price ? `${formatCurrency(price)}/share` : ''}</p>
                            </div>
                            <div class="flex gap-2">
                                <button class="edit-stock-btn text-sm font-medium text-indigo-600 hover:text-indigo-800" data-ticker="${sanitizeText(stock.ticker)}">Edit</button>
                                <button class="delete-stock-btn text-sm font-medium text-red-600 hover:text-red-800" data-ticker="${sanitizeText(stock.ticker)}">Delete</button>
                            </div>
                        </div>
                    </li>`;
            });
            html += '</ul>';
        }
        return html;
    }

    const portfolioStocks = state.portfolioCache.filter(s => s.status === 'Portfolio');
    const watchlistStocks = state.portfolioCache.filter(s => s.status === 'Watchlist');
    portfolioContainer.innerHTML = _generateHtmlForList(portfolioStocks);
    watchlistContainer.innerHTML = _generateHtmlForList(watchlistStocks);
}


function openPortfolioManagerModal() {
    const modal = document.getElementById(CONSTANTS.MODAL_PORTFOLIO_MANAGER);
    modal.querySelectorAll('.modal-tab-button').forEach(btn => btn.classList.remove('active'));
    modal.querySelectorAll('.modal-tab-pane').forEach(pane => pane.classList.remove('active'));

    modal.querySelector('.modal-tab-button[data-tab="manager-portfolio"]').classList.add('active');
    document.getElementById('manager-portfolio-tab-pane').classList.add('active');

    renderPortfolioManagerList();
    openModal(CONSTANTS.MODAL_PORTFOLIO_MANAGER);
}

async function handleSaveCash(e) {
    e.preventDefault();
    if (!state.userId) {
        displayMessageInModal("You must be logged in to save data.", "error");
        return;
    }

    const cashInput = document.getElementById('manage-cash-amount');
    const cashValue = parseFloat(cashInput.value);

    if (isNaN(cashValue) || cashValue < 0) {
        displayMessageInModal("Please enter a valid, non-negative number for your cash balance.", "warning");
        return;
    }

    const saveButton = e.target.querySelector('button[type="submit"]');
    saveButton.disabled = true;
    saveButton.textContent = 'Saving...';

    try {
        const docRef = doc(state.db, CONSTANTS.DB_COLLECTION_USER_DATA, state.userId);
        await setDoc(docRef, { cashBalance: cashValue }, { merge: true });
        state.cashBalance = cashValue;
        
        // Refresh dashboard widgets
        await renderPortfolioValue();

        displayMessageInModal("Cash balance updated successfully!", "info");

    } catch (error) {
        console.error("Error saving cash balance:", error);
        displayMessageInModal(`Could not save cash balance: ${error.message}`, 'error');
    } finally {
        saveButton.disabled = false;
        saveButton.textContent = 'Save Cash';
    }
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

// --- OPPORTUNITY SCANNER ---

function renderScannerResults(container, results) {
    if (!results || results.length === 0) {
        container.innerHTML = `<div class="text-center text-gray-500 py-16">
            <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 class="mt-2 text-lg font-medium text-gray-900">No Significant Shifts Detected</h3>
            <p class="mt-1 text-sm text-gray-500">The scanner didn't find any notable divergences in your portfolio or watchlist at this time.</p>
        </div>`;
        return;
    }

    const bullishResults = results.filter(r => r.type === 'Bullish');
    const bearishResults = results.filter(r => r.type === 'Bearish');
    
    let html = '';

    if (bullishResults.length > 0) {
        html += `<h3 class="text-xl font-bold text-green-600 mb-3">Potential Bullish Shifts 🟢</h3>`;
        html += '<div class="space-y-4">';
        bullishResults.forEach(item => {
            html += `<div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 class="font-bold text-green-800">${sanitizeText(item.companyName)} (${sanitizeText(item.ticker)})</h4>
                <p class="text-sm font-semibold text-green-700 mt-1">"${sanitizeText(item.headline)}"</p>
                <p class="text-sm text-green-900 mt-2">${sanitizeText(item.summary)}</p>
                 <button class="scanner-item-view-button text-sm font-semibold text-indigo-600 hover:underline mt-3" data-ticker="${sanitizeText(item.ticker)}">Perform Deep Dive →</button>
            </div>`;
        });
        html += '</div>';
    }

    if (bearishResults.length > 0) {
        html += `<h3 class="text-xl font-bold text-red-600 mt-6 mb-3">Potential Bearish Shifts 🔴</h3>`;
        html += '<div class="space-y-4">';
        bearishResults.forEach(item => {
            html += `<div class="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 class="font-bold text-red-800">${sanitizeText(item.companyName)} (${sanitizeText(item.ticker)})</h4>
                <p class="text-sm font-semibold text-red-700 mt-1">"${sanitizeText(item.headline)}"</p>
                <p class="text-sm text-red-900 mt-2">${sanitizeText(item.summary)}</p>
                <button class="scanner-item-view-button text-sm font-semibold text-indigo-600 hover:underline mt-3" data-ticker="${sanitizeText(item.ticker)}">Perform Deep Dive →</button>
            </div>`;
        });
        html += '</div>';
    }

    container.innerHTML = html;
}

async function handleRunOpportunityScanner() {
    const stocksToScan = state.portfolioCache;
    if (!stocksToScan || stocksToScan.length === 0) {
        displayMessageInModal("Please add stocks to your portfolio or watchlist before running the scanner.", "info");
        return;
    }

    const modalId = 'opportunityScannerModal';
    const modal = document.getElementById(modalId);
    const contentContainer = modal.querySelector('#opportunity-scanner-content');
    const statusBar = modal.querySelector('#scanner-progress-bar');
    const statusBarContainer = modal.querySelector('#scanner-progress-bar-container');
    const statusText = modal.querySelector('#scanner-status-text');

    contentContainer.innerHTML = '<div class="loader mx-auto mt-16"></div>';
    statusBar.style.width = '0%';
    statusBarContainer.classList.remove('hidden');
    statusText.textContent = 'Starting scan...';
    openModal(modalId);

    const updateProgress = (completed, total, message) => {
        const percentage = total > 0 ? (completed / total) * 100 : 0;
        statusBar.style.width = `${percentage}%`;
        statusText.textContent = `(${completed}/${total}) ${message}`;
    };

    try {
        const results = await runOpportunityScanner(stocksToScan, updateProgress);
        renderScannerResults(contentContainer, results);
        statusBarContainer.classList.add('hidden');
    } catch (error) {
        console.error("Error running opportunity scanner:", error);
        contentContainer.innerHTML = `<p class="text-red-500 text-center">The scan failed: ${error.message}</p>`;
    }
}

// --- NEW TREND ANALYSIS ---
async function handleTrendAnalysisRequest(ticker) {
    const contentContainer = document.getElementById('trend-analysis-content');
    if (!contentContainer) return;

    // Check if the content is already generated to avoid re-fetching on simple tab clicks
    if (contentContainer.innerHTML.trim() !== '') {
        return;
    }

    contentContainer.innerHTML = '<div class="flex justify-center items-center h-full pt-16"><div class="loader"></div></div>';

    try {
        const markdownResponse = await generateTrendAnalysis(ticker);
        contentContainer.innerHTML = marked.parse(markdownResponse);
    } catch (error) {
        console.error("Error generating trend analysis:", error);
        contentContainer.innerHTML = `<div class="text-center p-4 text-red-500 bg-red-50 rounded-lg"><p class="font-semibold">Could not generate trend analysis.</p><p class="text-sm">${error.message}</p></div>`;
    }
}

// --- NEW SCANNER RESULTS TAB ---
function renderScannerResultsForStock(container, results, ticker) {
    if (!results || results.length === 0) {
        container.innerHTML = `<div class="text-center text-gray-500 py-16">
            <h3 class="mt-2 text-lg font-medium text-gray-900">No Scanner Results Found</h3>
            <p class="mt-1 text-sm text-gray-500">No significant narrative shifts have been recorded for ${ticker}. Run the 'Scan for Opportunities' on the dashboard to generate data.</p>
        </div>`;
        return;
    }

    const resultsHtml = results.map(item => {
        const date = item.scannedAt && item.scannedAt.toDate ? item.scannedAt.toDate().toLocaleDateString() : 'N/A';
        const isBullish = item.type === 'Bullish';
        const badgeClass = isBullish ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
        const icon = isBullish ? '🟢' : '🔴';

        return `
            <div class="border border-gray-200 rounded-lg p-4 mb-4 bg-white shadow-sm">
                <div class="flex justify-between items-start">
                    <div>
                        <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full ${badgeClass}">${icon} ${item.type}</span>
                        <h4 class="font-bold text-gray-800 mt-2">"${sanitizeText(item.headline)}"</h4>
                    </div>
                    <span class="text-sm text-gray-500 flex-shrink-0 ml-4">${date}</span>
                </div>
                <p class="text-sm text-gray-700 mt-2">${sanitizeText(item.summary)}</p>
            </div>
        `;
    }).join('');

    container.innerHTML = `<h3 class="text-xl font-bold text-gray-800 mb-4">Historical Scanner Results for ${ticker}</h3><div class="space-y-4">${resultsHtml}</div>`;
}


async function handleScannerResultsRequest(ticker) {
    const contentContainer = document.getElementById('scanner-results-tab');
    if (!contentContainer) return;

    if (contentContainer.innerHTML.trim() !== '') {
        return; // Avoid re-fetching
    }

    contentContainer.innerHTML = '<div class="flex justify-center items-center h-full pt-16"><div class="loader"></div></div>';

    try {
        const results = await getScannerResults(ticker);
        renderScannerResultsForStock(contentContainer, results, ticker);
    } catch (error) {
        console.error("Error fetching scanner results:", error);
        contentContainer.innerHTML = `<div class="text-center p-4 text-red-500 bg-red-50 rounded-lg"><p class="font-semibold">Could not load scanner results.</p><p class="text-sm">${error.message}</p></div>`;
    }
}

// --- NEW CACHED NEWS TAB ---
function renderCachedNews(container, articles, ticker) {
    if (!articles || articles.length === 0) {
        container.innerHTML = `<div class="text-center text-gray-500 py-16">
            <h3 class="mt-2 text-lg font-medium text-gray-900">No Cached News Found</h3>
            <p class="mt-1 text-sm text-gray-500">No news for ${ticker} has been stored in the database. Run the Opportunity Scanner to cache the latest news.</p>
        </div>`;
        return;
    }

    const articlesHtml = articles.map(article => {
        const publishedDate = article.publishedDate ? new Date(article.publishedDate).toLocaleDateString() : 'No Date';
        return `
            <div class="mb-4 p-4 rounded-lg border border-gray-200 bg-white shadow-sm">
                <a href="${sanitizeText(article.url)}" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:underline font-semibold block mb-2">${sanitizeText(article.title)}</a>
                <p class="text-sm text-gray-700 mb-3">${sanitizeText(article.text)}</p>
                <div class="flex flex-wrap items-center gap-2 text-xs font-medium">
                    <span class="px-2 py-1 rounded-full bg-gray-200 text-gray-800">${sanitizeText(article.site)}</span>
                    <span class="px-2 py-1 rounded-full bg-gray-200 text-gray-800">${sanitizeText(publishedDate)}</span>
                </div>
            </div>
        `;
    }).join('');
    container.innerHTML = `<h3 class="text-xl font-bold text-gray-800 mb-4">Cached News for ${ticker}</h3>${articlesHtml}`;
}

async function handleNewsTabRequest(ticker) {
    const contentContainer = document.getElementById('news-content-container');
    if (!contentContainer) return;

    if (contentContainer.innerHTML.trim() !== '') {
        return;
    }

    contentContainer.innerHTML = '<div class="flex justify-center items-center h-full pt-16"><div class="loader"></div></div>';

    try {
        const articles = await getCachedNews(ticker);
        renderCachedNews(contentContainer, articles, ticker);
    } catch (error) {
        console.error("Error fetching cached news:", error);
        contentContainer.innerHTML = '<p class="text-red-500 text-center">Could not load cached news.</p>';
    }
}


// --- EVENT LISTENER SETUP ---

function setupGlobalEventListeners() {
    // This function will be expanded to handle the new "Add Stock" button in the manager modal
    document.getElementById('dashboard-section').addEventListener('click', async (e) => {
        const refreshButton = e.target.closest('.dashboard-refresh-button');
        if (refreshButton) {
            await fetchAndCachePortfolioData();
            await renderPortfolioValue();
            await renderMorningBriefing();
            await renderPortfolioHealthScore();
            await renderAllocationChart();
            return;
        }

        const viewAllButton = e.target.closest('#view-all-stocks-button');
        if (viewAllButton) {
            handleOpenStockListViewer();
        }
    });

    document.getElementById(CONSTANTS.MODAL_STOCK_LIST).addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        if (target.classList.contains('modal-tab-button')) {
            const tabId = target.dataset.tab;
            const modal = target.closest('.modal');

            modal.querySelectorAll('.modal-tab-button').forEach(btn => btn.classList.remove('active'));
            modal.querySelectorAll('.modal-tab-pane').forEach(pane => pane.classList.remove('active'));

            target.classList.add('active');
            document.getElementById(`${tabId}-tab-pane`).classList.add('active');

            const listType = tabId === 'portfolio' ? 'Portfolio' : 'Watchlist';
            _renderStockListForTab(listType);
            return;
        }

        if (target.id === 'expand-all-button') {
            document.querySelectorAll('#stockListModal .modal-tab-pane.active .sector-group').forEach(d => d.open = true);
            return;
        }
        if (target.id === 'collapse-all-button') {
            document.querySelectorAll('#stockListModal .modal-tab-pane.active .sector-group').forEach(d => d.open = false);
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

        if (target.id === 'add-new-stock-button') {
            openManageStockModal({});
            return;
        }

        if (target.id === 'refresh-manager-list-button') {
            renderPortfolioManagerList();
            return;
        }

        if (target.classList.contains('modal-tab-button')) {
            const tabId = target.dataset.tab;
            const modal = target.closest('.modal');
            modal.querySelectorAll('.modal-tab-button').forEach(btn => btn.classList.remove('active'));
            modal.querySelectorAll('.modal-tab-pane').forEach(pane => pane.classList.remove('active'));
            target.classList.add('active');
            document.getElementById(`${tabId}-tab-pane`).classList.add('active');
            return;
        }

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

async function handlePortfolioChatSubmit(e) {
    e.preventDefault();
    const form = document.getElementById('portfolio-chat-form');
    const input = document.getElementById('portfolio-chat-input');
    const button = form.querySelector('button[type="submit"]');
    const responseContainer = document.getElementById('portfolio-chat-response');
    const userQuestion = input.value.trim();

    if (!userQuestion) {
        displayMessageInModal("Please enter a question.", "warning");
        return;
    }

    input.disabled = true;
    button.disabled = true;
    responseContainer.innerHTML = '<div class="flex justify-center items-center h-full"><div class="loader"></div></div>';

    try {
        const markdownResponse = await generatePortfolioAnalysis(userQuestion);
        responseContainer.innerHTML = marked.parse(markdownResponse);
    } catch (error) {
        console.error("Error during portfolio chat analysis:", error);
        responseContainer.innerHTML = `<p class="text-red-500"><strong>Error:</strong> ${error.message}</p>`;
    } finally {
        input.disabled = false;
        button.disabled = false;
        input.value = '';
    }
}

export function setupEventListeners() {
    initializeTooltips();
    
    document.getElementById('manage-stock-form')?.addEventListener('submit', handleSaveStock);
    document.getElementById('cancel-manage-stock-button')?.addEventListener('click', () => closeModal(CONSTANTS.MODAL_MANAGE_STOCK));
    document.getElementById('delete-stock-button')?.addEventListener('click', (e) => {
        const ticker = document.getElementById('manage-stock-original-ticker').value;
        if(ticker) {
            closeModal(CONSTANTS.MODAL_MANAGE_STOCK);
            handleDeleteStock(ticker);
        }
    });

    // Listener for the status dropdown to toggle shares input
    document.getElementById('manage-stock-status')?.addEventListener('change', (e) => {
        const sharesContainer = document.getElementById('manage-stock-shares-container');
        if (e.target.value === 'Portfolio') {
            sharesContainer.classList.remove('hidden');
        } else {
            sharesContainer.classList.add('hidden');
        }
    });
    
    document.getElementById('manage-cash-form')?.addEventListener('submit', handleSaveCash);

    document.getElementById('manage-fmp-endpoint-form')?.addEventListener('submit', handleSaveFmpEndpoint);
    document.getElementById('cancel-fmp-endpoint-edit')?.addEventListener('click', cancelFmpEndpointEdit);

    document.getElementById('manage-broad-endpoint-form')?.addEventListener('submit', handleSaveBroadEndpoint);
    document.getElementById('cancel-broad-endpoint-edit')?.addEventListener('click', cancelBroadEndpointEdit);

    document.getElementById('portfolio-chat-form')?.addEventListener('submit', handlePortfolioChatSubmit);

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
    document.getElementById('opportunity-scanner-button')?.addEventListener('click', handleRunOpportunityScanner);

    const modalsToClose = [
        { modal: 'opportunityScannerModal', button: 'close-opportunity-scanner-modal', bg: 'close-opportunity-scanner-modal-bg' },
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
        const modal = document.getElementById('rawDataViewerModal');
        const activeSymbol = modal.dataset.activeSymbol;
        const target = e.target.closest('button');
        if (!target) return;
    
        if (target.matches('.tab-button')) {
            const tabId = target.dataset.tab;
            document.querySelectorAll('#rawDataViewerModal .tab-content').forEach(c => {
                c.classList.add('hidden');
            });
            document.querySelectorAll('#rawDataViewerModal .tab-button').forEach(b => b.classList.remove('active'));
            
            const activeTabContent = document.getElementById(`${tabId}-tab`);
            activeTabContent.classList.remove('hidden');
            target.classList.add('active');
    
            if (activeSymbol) {
                if (tabId === 'trend-analysis') {
                    handleTrendAnalysisRequest(activeSymbol);
                } else if (tabId === 'news') {
                    handleNewsTabRequest(activeSymbol);
                } else if (tabId === 'scanner-results') {
                    handleScannerResultsRequest(activeSymbol);
                }
            }
            return;
        }
        
        if (target.id === 'deep-dive-analysis-button') {
            if (activeSymbol) {
                handleDeepDiveRequest(activeSymbol);
            }
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

    document.getElementById('opportunityScannerModal')?.addEventListener('click', (e) => {
        const button = e.target.closest('.scanner-item-view-button');
        if (button && button.dataset.ticker) {
            closeModal('opportunityScannerModal');
            openRawDataViewer(button.dataset.ticker);
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

/**
 * Calculates a comprehensive summary of metrics for the "Deep Dive" prompt.
 * @param {object} data - The full FMP data object for a stock.
 * @param {string} newsNarrative - A concise summary of the recent news narrative.
 * @param {Array|null} institutionalHolders - Data from SEC-API.io.
 * @returns {object} A summary object with pre-calculated metrics and trends.
 */
function _calculateDeepDiveMetrics(data, newsNarrative, institutionalHolders) {
    const profile = data.profile?.[0] || {};
    const income = (data.income_statement_annual || []).slice().reverse(); // Oldest to newest
    const keyMetrics = (data.key_metrics_annual || []).slice().reverse();
    const cashFlow = (data.cash_flow_statement_annual || []).slice().reverse();
    const ratios = (data.ratios_annual || []).slice().reverse();
    const analystEstimates = data.analyst_estimates || [];
    const analystGrades = data.stock_grade_news || [];
    const insiderStats = data.insider_trading_stats || [];

    const latestMetrics = keyMetrics[keyMetrics.length - 1] || {};
    const latestCashFlow = cashFlow[cashFlow.length - 1] || {};
    const latestIncome = income[income.length - 1] || {};
    const lastYearIncome = income[income.length - 2] || {};

    const formatTrend = (series, key, lookback = 5) => {
        if (!series) return [];
        return series.slice(-lookback).map(item => ({
            year: item.calendarYear,
            value: typeof item[key] === 'number' ? item[key].toFixed(2) : 'N/A'
        }));
    };
    
    const formatLargeNumberTrend = (series, key, lookback = 5) => {
         if (!series) return [];
        return series.slice(-lookback).map(item => ({
            year: item.calendarYear,
            value: typeof item[key] === 'number' ? formatLargeNumber(item[key]) : 'N/A'
        }));
    };

    const calculateAverage = (data, key, lookback = 5) => {
        const values = data.slice(-lookback).map(d => d[key]).filter(v => typeof v === 'number');
        if (values.length === 0) return null;
        return values.reduce((a, b) => a + b, 0) / values.length;
    };
    
    const valuation = (metricKey, ratioKey) => {
        const current = latestMetrics[metricKey];
        const historical = calculateAverage(keyMetrics, metricKey);
        if (current && historical) {
            const status = current > historical ? 'at a premium' : 'at a discount';
            return `Current ${ratioKey} of ${current.toFixed(2)} is ${status} to its 5-year average of ${historical.toFixed(2)}.`;
        }
        return `Current ${ratioKey} is ${current ? current.toFixed(2) : 'N/A'}.`;
    };

    const nextYearEstimate = analystEstimates[0] || {};
    const lastActualRevenue = latestIncome.revenue;
    let revenueGrowthForecast = 'N/A';
    if (nextYearEstimate.estimatedRevenueAvg && lastActualRevenue) {
        revenueGrowthForecast = `${(((nextYearEstimate.estimatedRevenueAvg / lastActualRevenue) - 1) * 100).toFixed(2)}%`;
    }
    
    const recentRatings = analystGrades.slice(0, 5).map(grade => {
        const action = grade.action?.toLowerCase();
        const from = grade.previousGrade;
        const to = grade.newGrade;
        const firm = grade.gradingCompany;
        const date = grade.date;

        if (action === 'initiate' || !from || from.toLowerCase() === 'undefined') {
            return `Initiated coverage with '${to}' rating by ${firm} on ${date}`;
        }
        return `${grade.action} from '${from}' to '${to}' by ${firm} on ${date}`;
    });

    return {
        description: profile.description,
        sector: profile.sector,
        industry: profile.industry,
        currentPrice: profile.price || 'N/A',
        analystConsensus: {
            nextYearRevenueForecast: formatLargeNumber(nextYearEstimate.estimatedRevenueAvg),
            nextYearEpsForecast: nextYearEstimate.estimatedEpsAvg ? nextYearEstimate.estimatedEpsAvg.toFixed(2) : 'N/A',
            estimatedRevenueGrowth: revenueGrowthForecast
        },
        recentAnalystRatings: recentRatings,
        recentNewsNarrative: newsNarrative,
        insiderTransactionSummary: (() => {
            const stats6m = insiderStats.find(s => s.period === '6M');
            if (!stats6m) return 'Insider transaction data for the last 6 months is not available.';
            const netShares = stats6m.totalBought - stats6m.totalSold;
            if (netShares > 0) {
                return `Over the last 6 months, insiders were net buyers of ${netShares.toLocaleString()} shares.`;
            } else if (netShares < 0) {
                return `Over the last 6 months, insiders were net sellers of ${Math.abs(netShares).toLocaleString()} shares.`;
            } else {
                return 'Over the last 6 months, there was no net buying or selling by insiders.';
            }
        })(),
        topInstitutionalHolders: (() => {
            if (!institutionalHolders || institutionalHolders.length === 0) {
                return ['Institutional ownership data not available.'];
            }
            const sortedHolders = institutionalHolders.sort((a, b) => b.value - a.value);
            return sortedHolders.slice(0, 5).map(h => h.investorName);
        })(),
        roeTrend: formatTrend(ratios, 'returnOnEquity'),
        grossMarginTrend: formatTrend(ratios, 'grossProfitMargin'),
        netMarginTrend: formatTrend(ratios, 'netProfitMargin'),
        revenueTrend: formatLargeNumberTrend(income, 'revenue'),
        netIncomeTrend: formatLargeNumberTrend(income, 'netIncome'),
        debtToEquityTrend: formatTrend(ratios, 'debtEquityRatio'),
        cashFlowVsNetIncome: `Operating Cash Flow (${formatLargeNumber(latestCashFlow.operatingCashFlow)}) vs. Net Income (${formatLargeNumber(latestIncome.netIncome)}).`,
        dividendYield: latestMetrics.dividendYield ? `${(latestMetrics.dividendYield * 100).toFixed(2)}%` : 'N/A',
        fcfPayoutRatio: (latestCashFlow.freeCashFlow > 0) ? `${(Math.abs(latestCashFlow.dividendsPaid || 0) / latestCashFlow.freeCashFlow * 100).toFixed(2)}%` : 'N/A',
        pe_valuation: valuation('peRatio', 'P/E'),
        ps_valuation: valuation('priceToSalesRatio', 'P/S'),
        pb_valuation: valuation('pbRatio', 'P/B'),
        grahamNumber: latestMetrics.grahamNumber ? latestMetrics.grahamNumber.toFixed(2) : 'N/A'
    };
}


async function handleDeepDiveRequest(symbol, forceNew = false) {
    const reportType = 'DeepDive';
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
            updateReportStatus(statusContainer, savedReports, latestReport.id, { symbol, reportType });
            return; 
        }

        openModal(CONSTANTS.MODAL_LOADING);
        const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);
        
        loadingMessage.textContent = `Fetching financial data for ${symbol}...`;
        const data = await getFmpStockData(symbol);
        if (!data) throw new Error(`No cached FMP data found for ${symbol}.`);
        
        const requiredEndpoints = ['profile', 'ratios_annual', 'key_metrics_annual', 'income_statement_annual', 'cash_flow_statement_annual', 'analyst_estimates', 'stock_grade_news', 'insider_trading_stats'];
        const missingEndpoints = requiredEndpoints.filter(ep => !data[ep] || data[ep].length === 0);

        if (missingEndpoints.length > 0) {
            closeModal(CONSTANTS.MODAL_LOADING);
            openConfirmationModal(
                'Data Refresh Required',
                `This analysis requires data that is not yet cached for ${symbol} (${missingEndpoints.join(', ')}). Would you like to refresh all FMP data now? This may take a moment.`,
                async () => {
                    await handleRefreshFmpData(symbol);
                    await handleDeepDiveRequest(symbol, true);
                }
            );
            return;
        }

        loadingMessage.textContent = `Fetching institutional ownership for ${symbol}...`;
        let institutionalHolders = null;
        if (state.secApiKey) {
            try {
                const secUrl = `https://api.sec-api.io/form-13f-holdings?token=${state.secApiKey}`;
                const queryPayload = {
                    "query": { "query": `ticker:\"${symbol}\"` },
                    "from": "0",
                    "size": "20",
                    "sort": [{ "sortBy": "value", "order": "desc" }]
                };
                const secResponse = await callApi(secUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(queryPayload)
                });
                if (secResponse && Array.isArray(secResponse.holdings) && secResponse.holdings.length > 0) {
                    institutionalHolders = secResponse.holdings;
                }
            } catch (secError) {
                console.warn(`Could not fetch institutional ownership data for ${symbol}:`, secError);
            }
        }
        
        loadingMessage.textContent = `Analyzing recent news for ${symbol}...`;
        const profile = data.profile?.[0] || {};
        const companyName = profile.companyName || 'the company';
        const tickerSymbol = profile.symbol || symbol;
        
        const newsSummary = await generateNewsSummary(tickerSymbol, companyName);

        const payloadData = _calculateDeepDiveMetrics(data, newsSummary.dominant_narrative, institutionalHolders);

        const prompt = DEEP_DIVE_PROMPT
            .replace(/{companyName}/g, companyName)
            .replace(/{tickerSymbol}/g, tickerSymbol)
            .replace('{jsonData}', JSON.stringify(payloadData, null, 2));

        contentContainer.dataset.currentPrompt = prompt;

        const newReportContent = await generatePolishedArticle(prompt, loadingMessage);
        contentContainer.dataset.rawMarkdown = newReportContent;
        displayReport(contentContainer, newReportContent, prompt);
        updateReportStatus(statusContainer, [], null, { symbol, reportType });

    } catch (error) {
        displayMessageInModal(`Could not generate or load analysis: ${error.message}`, 'error');
        contentContainer.innerHTML = `<p class="text-red-500">Failed to generate report: ${error.message}</p>`;
    } finally {
        if (document.getElementById(CONSTANTS.MODAL_LOADING).classList.contains('is-open')) {
            closeModal(CONSTANTS.MODAL_LOADING);
        }
    }
}


async function handleSaveReportToDb() {
    const modal = document.getElementById('rawDataViewerModal');
    const symbol = modal.dataset.activeSymbol;
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
        updateReportStatus(document.getElementById('report-status-container-ai'), savedReports, latestReport.id, { symbol, reportType });

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
            handleDeepDiveRequest(analysisParams.symbol, true);
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
