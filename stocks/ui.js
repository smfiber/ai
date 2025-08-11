import { CONSTANTS, SECTORS, SECTOR_ICONS, state, NEWS_SENTIMENT_PROMPT, FINANCIAL_ANALYSIS_PROMPT, UNDERVALUED_ANALYSIS_PROMPT, BULL_VS_BEAR_PROMPT, MOAT_ANALYSIS_PROMPT, DIVIDEND_SAFETY_PROMPT, GROWTH_OUTLOOK_PROMPT, RISK_ASSESSMENT_PROMPT, CAPITAL_ALLOCATORS_PROMPT, creativePromptMap, DISRUPTOR_ANALYSIS_PROMPT, MACRO_PLAYBOOK_PROMPT, INDUSTRY_CAPITAL_ALLOCATORS_PROMPT, INDUSTRY_DISRUPTOR_ANALYSIS_PROMPT, INDUSTRY_MACRO_PLAYBOOK_PROMPT, ONE_SHOT_INDUSTRY_TREND_PROMPT, FORTRESS_ANALYSIS_PROMPT, PHOENIX_ANALYSIS_PROMPT, PICK_AND_SHOVEL_PROMPT, LINCHPIN_ANALYSIS_PROMPT, HIDDEN_VALUE_PROMPT, UNTOUCHABLES_ANALYSIS_PROMPT, STOCK_RATING_PROMPT } from './config.js';
import { getFmpStockData, callApi, filterValidNews, callGeminiApi, generatePolishedArticle, getDriveToken, getOrCreateDriveFolder, createDriveFile, findStocksByIndustry, searchSectorNews, findStocksBySector } from './api.js';
import { getFirestore, Timestamp, doc, setDoc, getDoc, deleteDoc, collection, getDocs, query, limit, addDoc, increment, updateDoc, where, orderBy } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- PROMPT MAPPING ---
const promptMap = {
    'FinancialAnalysis': FINANCIAL_ANALYSIS_PROMPT,
    'UndervaluedAnalysis': UNDERVALUED_ANALYSIS_PROMPT,
    'BullVsBear': BULL_VS_BEAR_PROMPT,
    'MoatAnalysis': MOAT_ANALYSIS_PROMPT,
    'DividendSafety': DIVIDEND_SAFETY_PROMPT,
    'GrowthOutlook': GROWTH_OUTLOOK_PROMPT,
    'RiskAssessment': RISK_ASSESSMENT_PROMPT,
    'CapitalAllocators': CAPITAL_ALLOCATORS_PROMPT,
    'StockRating': STOCK_RATING_PROMPT
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

function get(obj, path, defaultValue = undefined) {
  const value = path.split('.').reduce((a, b) => (a ? a[b] : undefined), obj);
  return value !== undefined ? value : defaultValue;
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

// --- FMP API INTEGRATION & MANAGEMENT (MOVED FROM API.JS)---
async function handleRefreshFmpData(symbol) {
    if (!state.fmpApiKey) {
        displayMessageInModal("Financial Modeling Prep API Key is required for this feature.", "warning");
        return;
    }

    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Fetching all FMP data for ${symbol}...`;

    try {
        const endpointsSnapshot = await getDocs(collection(state.db, CONSTANTS.DB_COLLECTION_FMP_ENDPOINTS));
        if (endpointsSnapshot.empty) {
            throw new Error("No FMP endpoints configured. Please add endpoints via the manager.");
        }

        const endpoints = endpointsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        let successfulFetches = 0;

        for (const endpoint of endpoints) {
            if (!endpoint.url_template || !endpoint.name) continue;

            document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Fetching FMP Data: ${endpoint.name}...`;
            
            const url = endpoint.url_template
                .replace('${symbol}', symbol)
                .replace('${fmpApiKey}', state.fmpApiKey);
            
            const data = await callApi(url);

            if (!data || (Array.isArray(data) && data.length === 0)) {
                 console.warn(`No data returned from FMP for endpoint: ${endpoint.name}`);
                 continue;
            }

            const dataToCache = {
                cachedAt: Timestamp.now(),
                data: data
            };

            const docRef = doc(state.db, CONSTANTS.DB_COLLECTION_FMP_CACHE, symbol, 'endpoints', endpoint.id);
            await setDoc(docRef, dataToCache);
            
            const endpointDocRef = doc(state.db, CONSTANTS.DB_COLLECTION_FMP_ENDPOINTS, endpoint.id);
            await updateDoc(endpointDocRef, {
                usageCount: increment(1)
            });

            successfulFetches++;
        }
        
        displayMessageInModal(`Successfully fetched and updated data for ${successfulFetches} FMP endpoint(s). You can now view it.`, 'info');
        
        await fetchAndCachePortfolioData();

    } catch (error) {
        console.error("Error fetching FMP data:", error);
        displayMessageInModal(`Could not fetch FMP data: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

// --- PORTFOLIO & DASHBOARD MANAGEMENT ---

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
            const fmp = stock.fmpData;
            const refreshedAt = fmp.cachedAt ? fmp.cachedAt.toDate().toLocaleString() : 'N/A';

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

        document.getElementById('portfolio-count').textContent = portfolioStocks.length;
        document.getElementById('watchlist-count').textContent = watchlistStocks.length;

    } catch (error) {
        console.error("Error loading dashboard data:", error);
        displayMessageInModal(`Failed to load dashboard data: ${error.message}`, 'error');
        document.getElementById('portfolio-count').textContent = 'E';
        document.getElementById('watchlist-count').textContent = 'E';
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

// --- CORE STOCK RESEARCH LOGIC ---

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

// --- CHARTING FUNCTIONS ---

function destroyCharts() {
    Object.values(state.charts).forEach(chart => {
        if (chart instanceof Chart) {
            chart.destroy();
        }
    });
    state.charts = {};
}

function createChartContainer(id, title, description) {
    const container = document.createElement('div');
    container.className = 'bg-white p-4 rounded-lg shadow border';
    container.innerHTML = `
        <h3 class="text-lg font-semibold text-gray-800">${title}</h3>
        <p class="text-xs text-gray-500 mb-2">${description}</p>
        <canvas id="${id}"></canvas>
    `;
    return container;
}

function renderStockPriceChart(fmpData) {
    const chartData = get(fmpData, 'stock_chart_light.historical', []);
    if (chartData.length === 0) return;

    const reversedData = [...chartData].reverse();
    const labels = reversedData.map(d => d.date);
    const prices = reversedData.map(d => d.price);
    const volumes = reversedData.map(d => d.volume);

    const container = createChartContainer(
        'priceVolumeChart',
        'Historical Price & Volume',
        'Tracks the daily closing price and trading volume over time.'
    );
    document.getElementById('charts-container').appendChild(container);

    const ctx = document.getElementById('priceVolumeChart').getContext('2d');
    state.charts.priceVolume = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    type: 'line',
                    label: 'Price',
                    data: prices,
                    borderColor: 'rgba(59, 130, 246, 1)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    yAxisID: 'yPrice',
                    tension: 0.1,
                    fill: true,
                },
                {
                    type: 'bar',
                    label: 'Volume',
                    data: volumes,
                    backgroundColor: 'rgba(107, 114, 128, 0.3)',
                    borderColor: 'rgba(107, 114, 128, 0.5)',
                    yAxisID: 'yVolume',
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'month'
                    },
                    ticks: {
                        autoSkip: true,
                        maxTicksLimit: 12
                    }
                },
                yPrice: {
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Price (USD)'
                    },
                    ticks: {
                        callback: value => `$${value.toFixed(2)}`
                    }
                },
                yVolume: {
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Volume'
                    },
                    ticks: {
                        callback: value => formatLargeNumber(value, 1)
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
}


async function openRawDataViewer(ticker) {
    const modalId = 'rawDataViewerModal';
    openModal(modalId);
    
    const rawDataContainer = document.getElementById('raw-data-accordion-container');
    const aiButtonsContainer = document.getElementById('ai-buttons-container');
    const aiArticleContainer = document.getElementById('ai-article-container');
    const investmentRatingContainer = document.getElementById('investment-rating-container');
    const profileDisplayContainer = document.getElementById('company-profile-display-container');
    const chartsContainer = document.getElementById('charts-container');
    const titleEl = document.getElementById('raw-data-viewer-modal-title');
    
    titleEl.textContent = `Analyzing ${ticker}...`;
    rawDataContainer.innerHTML = '<div class="loader mx-auto"></div>';
    aiButtonsContainer.innerHTML = '';
    aiArticleContainer.innerHTML = '';
    investmentRatingContainer.innerHTML = '<div class="loader mx-auto"></div>';
    profileDisplayContainer.innerHTML = '';
    chartsContainer.innerHTML = '';
    destroyCharts();

    document.querySelectorAll('#rawDataViewerModal .tab-content').forEach(c => c.classList.add('hidden'));
    document.querySelectorAll('#rawDataViewerModal .tab-button').forEach(b => b.classList.remove('active'));
    document.getElementById('investment-rating-tab').classList.remove('hidden');
    document.querySelector('.tab-button[data-tab="investment-rating"]').classList.add('active');

    try {
        const fmpData = await getFmpStockData(ticker);
        if (!fmpData) {
            throw new Error('No cached FMP data found for this stock.');
        }

        titleEl.textContent = `Analysis for ${ticker}`;
        
        // Render Chart Tab
        renderStockPriceChart(fmpData);

        // Build nested accordions for raw data
        let accordionHtml = '';
        const sortedKeys = Object.keys(fmpData).filter(key => key !== 'cachedAt' && fmpData[key]).sort();

        for (const key of sortedKeys) {
            accordionHtml += `
                <details class="mb-2 bg-white rounded-lg border">
                    <summary class="p-3 font-semibold text-gray-700 cursor-pointer hover:bg-gray-50">${sanitizeText(key)}</summary>
                    <pre class="text-xs whitespace-pre-wrap break-all bg-gray-900 text-white p-3 rounded-b-lg">${sanitizeText(JSON.stringify(fmpData[key], null, 2))}</pre>
                </details>
            `;
        }
        rawDataContainer.innerHTML = accordionHtml;

        // Build AI buttons
        const buttons = [
            { reportType: 'FinancialAnalysis', text: 'Financial Analysis', bg: 'bg-teal-500 hover:bg-teal-600' },
            { reportType: 'UndervaluedAnalysis', text: 'Undervalued Analysis', bg: 'bg-amber-500 hover:bg-amber-600' },
            { reportType: 'BullVsBear', text: 'Bull vs. Bear', bg: 'bg-purple-500 hover:bg-purple-600' },
            { reportType: 'MoatAnalysis', text: 'Moat Analysis', bg: 'bg-cyan-500 hover:bg-cyan-600' },
            { reportType: 'DividendSafety', text: 'Dividend Safety', bg: 'bg-sky-500 hover:bg-sky-600' },
            { reportType: 'GrowthOutlook', text: 'Growth Outlook', bg: 'bg-lime-500 hover:bg-lime-600' },
            { reportType: 'RiskAssessment', text: 'Risk Assessment', bg: 'bg-rose-500 hover:bg-rose-600' },
            { reportType: 'CapitalAllocators', text: 'Capital Allocators', bg: 'bg-orange-500 hover:bg-orange-600' }
        ];
        
        aiButtonsContainer.innerHTML = buttons.map(btn => 
            `<button data-symbol="${ticker}" data-report-type="${btn.reportType}" class="ai-analysis-button text-sm ${btn.bg} text-white font-semibold py-2 px-4 rounded-lg">${btn.text}</button>`
        ).join('');
        
        // Render the new company profile section
        const imageUrl = get(fmpData, 'company_profile_data.0.image', '');
        const description = get(fmpData, 'company_profile_data.0.description', 'No description available.');
        const exchange = get(fmpData, 'sec_company_full_profile.0.exchange', 'N/A');
        const sector = get(fmpData, 'company_profile_data.0.sector', 'N/A');
        const filingsUrl = get(fmpData, 'sec_company_full_profile.0.secFilingsUrl', '');

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

        // Automatically trigger the investment rating analysis
        handleAnalysisRequest(ticker, 'StockRating', STOCK_RATING_PROMPT);

    } catch (error) {
        console.error('Error opening raw data viewer:', error);
        titleEl.textContent = `Error Loading Data for ${ticker}`;
        aiArticleContainer.innerHTML = `<p class="text-red-500 text-center">${error.message}</p>`;
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
        const companyName = get(stockData, 'company_profile.0.companyName', symbol);
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

function renderDailyCalendarView() {
    const dayHeader = document.getElementById('day-header');
    const eventsContainer = document.getElementById('daily-events-container');
    if (!dayHeader || !eventsContainer) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const viewingDate = new Date(state.calendarCurrentDate);
    viewingDate.setHours(0, 0, 0, 0);

    let dateLabel = viewingDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    if (viewingDate.getTime() === today.getTime()) {
        dateLabel = `Today, ${dateLabel}`;
    }

    dayHeader.textContent = dateLabel;

    const earningsForDay = state.calendarEvents.earnings.filter(e => new Date(e.date).toDateString() === state.calendarCurrentDate.toDateString());
    const iposForDay = state.calendarEvents.ipos.filter(i => new Date(i.date).toDateString() === state.calendarCurrentDate.toDateString());

    eventsContainer.innerHTML = '';
    let html = '';

    const renderEventList = (events, type) => {
        let listHtml = '';
        const isEarning = type === 'earnings';
        const headerText = isEarning ? 'Upcoming Earnings' : 'Upcoming IPOs';
        const headerColor = isEarning ? 'text-green-700' : 'text-blue-700';
        const itemBg = isEarning ? 'bg-green-50' : 'bg-blue-50';
        const itemBorder = isEarning ? 'border-green-200' : 'border-blue-200';
        const itemTextColor = isEarning ? 'text-green-800' : 'text-blue-800';

        listHtml += `<h3 class="text-lg font-semibold ${headerColor} mb-2 mt-4">${headerText}</h3>`;
        listHtml += '<ul class="space-y-3">';
        events.forEach(e => {
            const fidelityUrl = `https://digital.fidelity.com/prgw/digital/research/quote/dashboard/summary?symbol=${e.symbol}`;
            listHtml += `
                <li class="p-3 ${itemBg} ${itemBorder} rounded-lg">
                    <div class="flex justify-between items-center">
                        <div>
                            <p class="font-bold ${itemTextColor}">${sanitizeText(e.company || e.symbol)} (${sanitizeText(e.symbol)})</p>
                        </div>
                        <div class="flex items-center gap-3 text-xs">
                            <a href="${fidelityUrl}" target="_blank" rel="noopener noreferrer" class="broker-link">Fidelity</a>
                        </div>
                    </div>
                </li>
            `;
        });
        listHtml += '</ul>';
        return listHtml;
    };

    if (earningsForDay.length > 0) {
        html += renderEventList(earningsForDay, 'earnings');
    }

    if (iposForDay.length > 0) {
        html += renderEventList(iposForDay, 'ipos');
    }

    if (html === '') {
        html = '<p class="text-center text-gray-500 py-8">No scheduled events for this day.</p>';
    }

    eventsContainer.innerHTML = html;
}


export async function displayMarketCalendar() {
    const eventsContainer = document.getElementById('daily-events-container');
    const dayHeader = document.getElementById('day-header');

    if (!eventsContainer || !dayHeader) return;

    eventsContainer.innerHTML = `<div class="p-4 text-center text-gray-400">Loading calendar data...</div>`;

    const docRef = doc(state.db, CONSTANTS.DB_COLLECTION_CALENDAR, 'latest_fmp');
    let shouldFetchNewData = true;

    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const cachedData = docSnap.data();
            const cacheDate = cachedData.cachedAt.toDate();
            const daysSinceCache = (new Date() - cacheDate) / (1000 * 60 * 60 * 24);
            
            if (daysSinceCache < 1) { // FMP data can be refreshed daily
                state.calendarEvents.earnings = cachedData.earnings || [];
                state.calendarEvents.ipos = cachedData.ipos || [];
                shouldFetchNewData = false;
            }
        }
    } catch (dbError) {
        console.error("Error reading calendar cache from Firestore:", dbError);
    }
    
    if (shouldFetchNewData) {
        try {
            const today = new Date();
            const from = today.toISOString().split('T')[0];
            const to = from; // Fetch only one day of data

            const [earningsData, ipoData] = await Promise.all([
                callApi(`https://financialmodelingprep.com/api/v3/earning_calendar?from=${from}&to=${to}&apikey=${state.fmpApiKey}`),
                callApi(`https://financialmodelingprep.com/api/v3/ipo_calendar?from=${from}&to=${to}&apikey=${state.fmpApiKey}`)
            ]);

            state.calendarEvents.earnings = (earningsData || []).filter(e => e.exchange && !e.exchange.includes('OTC'));
            state.calendarEvents.ipos = (ipoData || []).filter(i => i.exchange && !i.exchange.includes('OTC'));

            const dataToCache = { 
                earnings: state.calendarEvents.earnings, 
                ipos: state.calendarEvents.ipos, 
                cachedAt: Timestamp.now() 
            };
            await setDoc(docRef, dataToCache);

        } catch (apiError) {
            console.error("Error fetching calendar data from FMP API:", apiError);
            eventsContainer.innerHTML = `<div class="p-4 text-center text-red-500">Could not load calendar data. The API might be unavailable.</div>`;
            dayHeader.textContent = 'Error';
            return;
        }
    }

    renderDailyCalendarView();
}

export function renderSectorButtons() {
    const container = document.getElementById('sector-buttons-container');
    if (!container) return;
    container.innerHTML = SECTORS.map(sector => {
        const icon = SECTOR_ICONS[sector] || '';
        return `
            <button class="flex flex-col items-center justify-center p-4 text-center bg-sky-100 text-sky-800 hover:bg-sky-200 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-1" data-sector="${sanitizeText(sector)}">
                ${icon}
                <span class="mt-2 font-semibold text-sm">${sanitizeText(sector)}</span>
            </button>
        `
    }).join('');
}

function renderOverviewCard(data, symbol, status) {
    const profile = get(data, 'company_profile.0', {});
    const quote = get(data, 'stock_quote.0', {});
    const income = get(data, 'income_statement.0', {});

    if (!profile.symbol) return '';

    const price = get(quote, 'price', 0);
    const change = get(quote, 'change', 0);
    const changePercent = get(quote, 'changesPercentage', 0);
    const changeColorClass = change >= 0 ? 'price-gain' : 'price-loss';
    const changeSign = change >= 0 ? '+' : '';

    let statusBadge = '';
    if (status === 'Portfolio') {
        statusBadge = '<span class="ml-2 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-100 text-green-800">Portfolio</span>';
    } else if (status === 'Watchlist') {
        statusBadge = '<span class="ml-2 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">Watchlist</span>';
    }

    const marketCap = formatLargeNumber(get(profile, 'mktCap'));
    const netIncome = get(income, 'netIncome', 0);
    const peRatio = (profile.mktCap && netIncome && netIncome > 0) ? (profile.mktCap / netIncome).toFixed(2) : 'N/A';
    
    const sma50 = get(quote, 'priceAvg50', 'N/A');
    const sma200 = get(quote, 'priceAvg200', 'N/A');
    
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
                <div><p class="text-sm text-gray-500">50-Day MA</p><p class="text-lg font-semibold">$${sma50.toFixed(2)}</p></div>
                <div><p class="text-sm text-gray-500">200-Day MA</p><p class="text-lg font-semibold">$${sma200.toFixed(2)}</p></div>
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
    document.getElementById('dashboard-section').addEventListener('click', (e) => {
        const refreshButton = e.target.closest('.dashboard-refresh-button');
        if (refreshButton) {
            fetchAndCachePortfolioData();
            return;
        }
        
        const portfolioButton = e.target.closest('#open-portfolio-modal-button');
        if (portfolioButton) {
            openStockListModal('Portfolio');
            return;
        }

        const watchlistButton = e.target.closest('#open-watchlist-modal-button');
        if (watchlistButton) {
            openStockListModal('Watchlist');
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

    document.getElementById('customAnalysisModal').addEventListener('click', (e) => {
        const target = e.target.closest('button[data-prompt-name]');
        if (target) {
            const sector = target.dataset.sector;
            const promptName = target.dataset.promptName;
            const analysisName = target.querySelector('.tile-name')?.textContent || promptName;
            
            const modal = document.getElementById('customAnalysisModal');
            modal.dataset.analysisName = analysisName;

            if (promptName === 'MarketTrends') {
                handleMarketTrendsAnalysis(sector, 'sector');
            } else if (promptName === 'DisruptorAnalysis') {
                handleDisruptorAnalysis(sector);
            } else if (promptName === 'MacroPlaybook') {
                handleMacroPlaybookAnalysis(sector);
            } else if (promptName === 'FortressAnalysis') {
                handleFortressAnalysis(sector, 'sector');
            } else if (promptName === 'PhoenixAnalysis') {
                handlePhoenixAnalysis(sector, 'sector');
            } else if (promptName === 'PickAndShovel') {
                handlePickAndShovelAnalysis(sector, 'sector');
            } else if (promptName === 'Linchpin') {
                handleLinchpinAnalysis(sector, 'sector');
            } else if (promptName === 'HiddenValue') {
                handleHiddenValueAnalysis(sector, 'sector');
            } else if (promptName === 'Untouchables') {
                handleUntouchablesAnalysis(sector, 'sector');
            } else {
                handleCreativeSectorAnalysis(sector, promptName);
            }
        }
    });

    document.getElementById('industryAnalysisModal').addEventListener('click', (e) => {
        const target = e.target.closest('button[data-prompt-name]');
        if (target) {
            const industry = target.dataset.industry;
            const promptName = target.dataset.promptName;
            const analysisName = target.querySelector('.tile-name')?.textContent || promptName;
            
            const modal = document.getElementById('industryAnalysisModal');
            modal.dataset.analysisName = analysisName;

            if (promptName === 'MarketTrends') {
                handleIndustryMarketTrendsAnalysis(industry);
            } else if (promptName === 'DisruptorAnalysis') {
                handleIndustryDisruptorAnalysis(industry);
            } else if (promptName === 'MacroPlaybook') {
                handleIndustryMacroPlaybookAnalysis(industry);
            } else if (promptName === 'PlaybookAnalysis') {
                handleIndustryPlaybookAnalysis(industry);
            } else if (promptName === 'FortressAnalysis') {
                handleFortressAnalysis(industry, 'industry');
            } else if (promptName === 'PhoenixAnalysis') {
                handlePhoenixAnalysis(industry, 'industry');
            } else if (promptName === 'PickAndShovel') {
                handlePickAndShovelAnalysis(industry, 'industry');
            } else if (promptName === 'Linchpin') {
                handleLinchpinAnalysis(industry, 'industry');
            } else if (promptName === 'HiddenValue') {
                handleHiddenValueAnalysis(industry, 'industry');
            } else if (promptName === 'Untouchables') {
                handleUntouchablesAnalysis(industry, 'industry');
            }
        }
    });

    document.getElementById('portfolioManagerModal').addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        const ticker = target.dataset.ticker;
        if (!ticker) return;

        if (target.classList.contains('edit-stock-btn')) {
            const stockData = state.portfolioCache.find(s => s.ticker === ticker);
            if (stockData) {
                openManageStockModal({ ...stockData, isEditMode: true });
            }
        } else if (target.classList.contains('delete-stock-btn')) {
            handleDeleteStock(ticker);
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

export function setupEventListeners() {
    document.getElementById(CONSTANTS.FORM_STOCK_RESEARCH)?.addEventListener('submit', handleResearchSubmit);
    
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
    
    document.getElementById('sector-buttons-container')?.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (target && target.dataset.sector) {
            handleSectorSelection(target.dataset.sector);
        }
    });

    document.getElementById('industry-buttons-container')?.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (target && target.dataset.industry) {
            handleIndustrySelection(target.dataset.industry);
        }
    });

    document.getElementById('prev-day-button')?.addEventListener('click', () => {
        state.calendarCurrentDate.setDate(state.calendarCurrentDate.getDate() - 1);
        renderDailyCalendarView();
    });

    document.getElementById('next-day-button')?.addEventListener('click', () => {
        state.calendarCurrentDate.setDate(state.calendarCurrentDate.getDate() + 1);
        renderDailyCalendarView();
    });

    document.getElementById('calendar-accordion-toggle')?.addEventListener('click', () => {
        const content = document.getElementById('market-calendar-content');
        const icon = document.getElementById('calendar-toggle-icon');
        content.classList.toggle('hidden');
        icon.classList.toggle('rotate-180');
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
            
            if (tabId === 'charts') {
                Object.values(state.charts).forEach(chart => {
                    if (chart && typeof chart.resize === 'function') {
                        chart.resize();
                    }
                });
            }
            return;
        }
        
        if (target.matches('.save-to-db-button')) {
            handleSaveReportToDb();
            return;
        }

        const symbol = target.dataset.symbol;
        if (!symbol) return;

        if (target.classList.contains('ai-analysis-button')) {
            const reportType = target.dataset.reportType;
            const promptTemplate = promptMap[reportType];
            if (promptTemplate) {
                handleAnalysisRequest(symbol, reportType, promptTemplate);
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

    setupGlobalEventListeners();
}

// --- NEW SECTOR DEEP DIVE WORKFLOW (v7.2.0) ---

async function handleMarketTrendsAnalysis(sectorName) {
    openModal(CONSTANTS.MODAL_LOADING);
    const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);
    const contentArea = document.getElementById('custom-analysis-content');

    try {
        loadingMessage.textContent = `Finding companies for the ${sectorName} sector...`;
        contentArea.innerHTML = `<div class="p-4 text-center text-gray-500">${loadingMessage.textContent}</div>`;
        
        const stocksResult = await findStocksBySector({ sectorName });
        if (stocksResult.error || !stocksResult.stocks || stocksResult.stocks.length === 0) {
            throw new Error(stocksResult.detail || `Could not find any companies for the ${sectorName} sector.`);
        }
        const sectorStocks = stocksResult.stocks;

        loadingMessage.textContent = `Searching news for up to ${sectorStocks.length} companies...`;
        contentArea.innerHTML = `<div class="p-4 text-center text-gray-500">${loadingMessage.textContent}</div>`;
        const newsResult = await searchSectorNews({ sectorName, sectorStocks });

        if (newsResult.error || !newsResult.articles || newsResult.articles.length === 0) {
            throw new Error(newsResult.detail || `Could not find any recent news for the ${sectorName} sector.`);
        }
        const validArticles = newsResult.articles;

        loadingMessage.textContent = `AI is analyzing news and ranking companies...`;
        contentArea.innerHTML = `<div class="p-4 text-center text-gray-500">${loadingMessage.textContent}</div>`;
        const synthesisResult = await synthesizeAndRankCompanies({ newsArticles: validArticles, sectorStocks });
        
        if (synthesisResult.error || !synthesisResult.topCompanies || synthesisResult.topCompanies.length === 0) {
            throw new Error(synthesisResult.detail || "AI could not identify top companies from the news.");
        }

        loadingMessage.textContent = `AI is generating the final deep dive report...`;
        contentArea.innerHTML = `<div class="p-4 text-center text-gray-500">${loadingMessage.textContent}</div>`;
        const reportResult = await generateDeepDiveReport({
            companyAnalysis: synthesisResult,
            sectorName: sectorName,
            originalArticles: validArticles
        });

        contentArea.innerHTML = marked.parse(reportResult.report);

    } catch (error) {
        console.error("Error during AI agent sector analysis:", error);
        displayMessageInModal(`Could not complete AI analysis: ${error.message}`, 'error');
        contentArea.innerHTML = `<div class="p-4 text-center text-red-500">Error: ${error.message}</div>`;
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

function handleSectorSelection(sectorName) {
    const modal = document.getElementById(CONSTANTS.MODAL_CUSTOM_ANALYSIS);
    const modalTitle = modal.querySelector('#custom-analysis-modal-title');
    const selectorContainer = modal.querySelector('#custom-analysis-selector-container');
    const contentArea = modal.querySelector('#custom-analysis-content');

    modalTitle.textContent = `Sector Deep Dive | ${sectorName}`;
    contentArea.innerHTML = `<div class="text-center text-gray-500 pt-16">Please select an analysis type above to begin.</div>`;
    modal.dataset.analysisName = 'Sector_Deep_Dive'; // Reset on new selection
    
    const analysisTypes = [
        {
            name: 'Market Trends',
            promptName: 'MarketTrends',
            description: 'AI agent searches news, finds top companies in your portfolio for this sector, and generates a market summary.',
            svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>`
        },
        {
            name: 'The Disruptor',
            promptName: 'DisruptorAnalysis',
            description: "VC-style report on a high-growth, innovative company with potential to disrupt its industry.",
            svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>`
        },
        {
            name: 'The Fortress',
            promptName: 'FortressAnalysis',
            description: 'Identifies a resilient, "all-weather" business with strong pricing power and a rock-solid balance sheet, built to withstand economic downturns.',
            svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286zm0 13.036h.008v.008h-.008v-.008z" /></svg>`
        },
        {
            name: 'The Phoenix',
            promptName: 'PhoenixAnalysis',
            description: 'Analyzes a "fallen angel" company that has stumbled badly but is now showing credible, quantifiable signs of a fundamental business turnaround.',
            svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.62a8.983 8.983 0 013.362-3.867 8.262 8.262 0 013 2.456z" /><path stroke-linecap="round" stroke-linejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" /></svg>`
        },
        {
            name: 'Pick & Shovel',
            promptName: 'PickAndShovel',
            description: 'Identifies essential suppliers that power an entire industry, a lower-risk way to invest in a trend.',
            svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21.75 17.25v-.228a4.5 4.5 0 00-.12-1.03l-2.268-9.64a3.375 3.375 0 00-3.285-2.602H7.923a3.375 3.375 0 00-3.285 2.602l-2.268 9.64a4.5 4.5 0 00-.12 1.03v.228m19.5 0a3 3 0 01-3 3H5.25a3 3 0 01-3-3m19.5 0a3 3 0 00-3-3H5.25a3 3 0 00-3 3m16.5 0h.008v.008h-.008v-.008zm-3 0h.008v.008h-.008v-.008z" /></svg>`
        },
        {
            name: 'The Linchpin',
            promptName: 'Linchpin',
            description: 'Focuses on companies that control a vital, irreplaceable choke point in an industry’s value chain.',
            svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M13.192 7.027a5.25 5.25 0 017.423 0L21 7.402a5.25 5.25 0 010 7.423l-.385.385a5.25 5.25 0 01-7.423 0L13.192 7.027zm-6.384 0a5.25 5.25 0 017.423 0L15 7.402a5.25 5.25 0 010 7.423l-5.385 5.385a5.25 5.25 0 01-7.423 0L2 19.973a5.25 5.25 0 010-7.423l.385-.385z" /><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6" /></svg>`
        },
        {
            name: 'Hidden Value',
            promptName: 'HiddenValue',
            description: 'A sum-of-the-parts investigation to find complex companies the market may be undervaluing.',
            svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h12v-1.5M3.75 3h16.5v13.5A2.25 2.25 0 0118 18.75h-9.75A2.25 2.25 0 016 16.5v-1.5" /><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6h1.5m-1.5 3h1.5m-1.5 3h1.5" /></svg>`
        },
        {
            name: 'The Untouchables',
            promptName: 'Untouchables',
            description: 'Deconstructs the "cult" brand moat of a company with fanatical customer loyalty, analyzing how that translates into durable pricing power and long-term profits.',
            svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>`
        }
    ];

    let html = `
        <div class="text-center w-full">
            <span class="block text-sm font-bold text-gray-500 uppercase mb-4">AI Analysis</span>
            <div class="flex flex-wrap justify-center gap-4">`;

    analysisTypes.forEach(type => {
        html += `
            <button class="analysis-tile" data-sector="${sectorName}" data-prompt-name="${type.promptName}" data-tooltip="${type.description}">
                ${type.svgIcon}
                <span class="tile-name">${type.name}</span>
            </button>
        `;
    });

    html += `</div></div>`;
    selectorContainer.innerHTML = html;
    openModal(CONSTANTS.MODAL_CUSTOM_ANALYSIS);
}

async function handleCreativeSectorAnalysis(contextName, promptNameKey) {
    const promptData = creativePromptMap[contextName];
    if (!promptData) {
        displayMessageInModal(`No creative analysis prompt found for: ${contextName}`, 'error');
        return;
    }
    
    openModal(CONSTANTS.MODAL_LOADING);
    const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);
    
    const contentArea = document.getElementById('custom-analysis-content');
    contentArea.innerHTML = `<div class="p-4 text-center text-gray-500">Generating AI article: "${promptData.label}"...</div>`;

    try {
        const report = await generatePolishedArticle(promptData.prompt, loadingMessage);
        contentArea.innerHTML = marked.parse(report);
    } catch (error) {
        console.error(`Error generating creative analysis for ${contextName}:`, error);
        displayMessageInModal(`Could not generate AI article: ${error.message}`, 'error');
        contentArea.innerHTML = `<div class="p-4 text-center text-red-500">Error: ${error.message}</div>`;
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

async function handleDisruptorAnalysis(contextName) {
    openModal(CONSTANTS.MODAL_LOADING);
    const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);

    const contentArea = document.getElementById('custom-analysis-content');
    contentArea.innerHTML = `<div class="p-4 text-center text-gray-500">Generating AI article: "Disruptor Analysis"...</div>`;

    try {
        const prompt = DISRUPTOR_ANALYSIS_PROMPT.replace(/{sectorName}/g, contextName);
        const report = await generatePolishedArticle(prompt, loadingMessage);
        contentArea.innerHTML = marked.parse(report);
    } catch (error) {
        console.error(`Error generating disruptor analysis for ${contextName}:`, error);
        displayMessageInModal(`Could not generate AI article: ${error.message}`, 'error');
        contentArea.innerHTML = `<div class="p-4 text-center text-red-500">Error: ${error.message}</div>`;
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

async function handleMacroPlaybookAnalysis(contextName) {
    openModal(CONSTANTS.MODAL_LOADING);
    const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);

    const contentArea = document.getElementById('custom-analysis-content');
    contentArea.innerHTML = `<div class="p-4 text-center text-gray-500">Generating AI article: "Macro Playbook"...</div>`;

    try {
        const standardDisclaimer = "This article is for informational purposes only and should not be considered financial advice. Readers should consult with a qualified financial professional before making any investment decisions.";
        const prompt = MACRO_PLAYBOOK_PROMPT
            .replace(/{sectorName}/g, contextName)
            .replace(/\[Include standard disclaimer\]/g, standardDisclaimer);
        const report = await generatePolishedArticle(prompt, loadingMessage);
        contentArea.innerHTML = marked.parse(report);
    } catch (error) {
        console.error(`Error generating macro playbook analysis for ${contextName}:`, error);
        displayMessageInModal(`Could not generate AI article: ${error.message}`, 'error');
        contentArea.innerHTML = `<div class="p-4 text-center text-red-500">Error: ${error.message}</div>`;
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

async function handleFortressAnalysis(contextName, contextType) {
    openModal(CONSTANTS.MODAL_LOADING);
    const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);

    const modalId = contextType === 'sector' ? 'customAnalysisModal' : 'industryAnalysisModal';
    const contentArea = document.getElementById(modalId).querySelector(contextType === 'sector' ? '#custom-analysis-content' : '#industry-analysis-content');
    contentArea.innerHTML = `<div class="p-4 text-center text-gray-500">Generating AI article: "The Fortress"...</div>`;

    try {
        const prompt = FORTRESS_ANALYSIS_PROMPT
            .replace(/{contextName}/g, contextName)
            .replace(/{contextType}/g, contextType);
        const report = await generatePolishedArticle(prompt, loadingMessage);
        contentArea.innerHTML = marked.parse(report);
    } catch (error) {
        console.error(`Error generating fortress analysis for ${contextName}:`, error);
        displayMessageInModal(`Could not generate AI article: ${error.message}`, 'error');
        contentArea.innerHTML = `<div class="p-4 text-center text-red-500">Error: ${error.message}</div>`;
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

async function handlePhoenixAnalysis(contextName, contextType) {
    openModal(CONSTANTS.MODAL_LOADING);
    const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);
    
    const modalId = contextType === 'sector' ? 'customAnalysisModal' : 'industryAnalysisModal';
    const contentArea = document.getElementById(modalId).querySelector(contextType === 'sector' ? '#custom-analysis-content' : '#industry-analysis-content');
    contentArea.innerHTML = `<div class="p-4 text-center text-gray-500">Generating AI article: "The Phoenix"...</div>`;

    try {
        const prompt = PHOENIX_ANALYSIS_PROMPT
            .replace(/{contextName}/g, contextName)
            .replace(/{contextType}/g, contextType);
        const report = await generatePolishedArticle(prompt, loadingMessage);
        contentArea.innerHTML = marked.parse(report);
    } catch (error) {
        console.error(`Error generating phoenix analysis for ${contextName}:`, error);
        displayMessageInModal(`Could not generate AI article: ${error.message}`, 'error');
        contentArea.innerHTML = `<div class="p-4 text-center text-red-500">Error: ${error.message}</div>`;
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

async function handlePickAndShovelAnalysis(contextName, contextType) {
    openModal(CONSTANTS.MODAL_LOADING);
    const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);
    const modalId = contextType === 'sector' ? 'customAnalysisModal' : 'industryAnalysisModal';
    const contentArea = document.getElementById(modalId).querySelector(contextType === 'sector' ? '#custom-analysis-content' : '#industry-analysis-content');
    contentArea.innerHTML = `<div class="p-4 text-center text-gray-500">Generating AI article: "The Pick and Shovel Play"...</div>`;

    try {
        const prompt = PICK_AND_SHOVEL_PROMPT
            .replace(/{contextName}/g, contextName)
            .replace(/{contextType}/g, contextType);
        const report = await generatePolishedArticle(prompt, loadingMessage);
        contentArea.innerHTML = marked.parse(report);
    } catch (error) {
        console.error(`Error generating Pick and Shovel analysis for ${contextName}:`, error);
        displayMessageInModal(`Could not generate AI article: ${error.message}`, 'error');
        contentArea.innerHTML = `<div class="p-4 text-center text-red-500">Error: ${error.message}</div>`;
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

async function handleLinchpinAnalysis(contextName, contextType) {
    openModal(CONSTANTS.MODAL_LOADING);
    const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);
    const modalId = contextType === 'sector' ? 'customAnalysisModal' : 'industryAnalysisModal';
    const contentArea = document.getElementById(modalId).querySelector(contextType === 'sector' ? '#custom-analysis-content' : '#industry-analysis-content');
    contentArea.innerHTML = `<div class="p-4 text-center text-gray-500">Generating AI article: "The Linchpin"...</div>`;

    try {
        const prompt = LINCHPIN_ANALYSIS_PROMPT
            .replace(/{contextName}/g, contextName)
            .replace(/{contextType}/g, contextType);
        const report = await generatePolishedArticle(prompt, loadingMessage);
        contentArea.innerHTML = marked.parse(report);
    } catch (error) {
        console.error(`Error generating Linchpin analysis for ${contextName}:`, error);
        displayMessageInModal(`Could not generate AI article: ${error.message}`, 'error');
        contentArea.innerHTML = `<div class="p-4 text-center text-red-500">Error: ${error.message}</div>`;
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

async function handleHiddenValueAnalysis(contextName, contextType) {
    openModal(CONSTANTS.MODAL_LOADING);
    const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);
    const modalId = contextType === 'sector' ? 'customAnalysisModal' : 'industryAnalysisModal';
    const contentArea = document.getElementById(modalId).querySelector(contextType === 'sector' ? '#custom-analysis-content' : '#industry-analysis-content');
    contentArea.innerHTML = `<div class="p-4 text-center text-gray-500">Generating AI article: "Hidden Value"...</div>`;

    try {
        const prompt = HIDDEN_VALUE_PROMPT
            .replace(/{contextName}/g, contextName)
            .replace(/{contextType}/g, contextType);
        const report = await generatePolishedArticle(prompt, loadingMessage);
        contentArea.innerHTML = marked.parse(report);
    } catch (error) {
        console.error(`Error generating Hidden Value analysis for ${contextName}:`, error);
        displayMessageInModal(`Could not generate AI article: ${error.message}`, 'error');
        contentArea.innerHTML = `<div class="p-4 text-center text-red-500">Error: ${error.message}</div>`;
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

async function handleUntouchablesAnalysis(contextName, contextType) {
    openModal(CONSTANTS.MODAL_LOADING);
    const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);
    const modalId = contextType === 'sector' ? 'customAnalysisModal' : 'industryAnalysisModal';
    const contentArea = document.getElementById(modalId).querySelector(contextType === 'sector' ? '#custom-analysis-content' : '#industry-analysis-content');
    contentArea.innerHTML = `<div class="p-4 text-center text-gray-500">Generating AI article: "The Untouchables"...</div>`;

    try {
        const prompt = UNTOUCHABLES_ANALYSIS_PROMPT
            .replace(/{contextName}/g, contextName)
            .replace(/{contextType}/g, contextType);
        const report = await generatePolishedArticle(prompt, loadingMessage);
        contentArea.innerHTML = marked.parse(report);
    } catch (error) {
        console.error(`Error generating Untouchables analysis for ${contextName}:`, error);
        displayMessageInModal(`Could not generate AI article: ${error.message}`, 'error');
        contentArea.innerHTML = `<div class="p-4 text-center text-red-500">Error: ${error.message}</div>`;
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}



export async function displayIndustryScreener() {
    try {
        const url = `https://financialmodelingprep.com/stable/available-industries?apikey=${state.fmpApiKey}`;
        const industryData = await callApi(url);
        if (Array.isArray(industryData)) {
            state.availableIndustries = industryData.map(item => item.industry).sort();
            renderIndustryButtons();
        }
    } catch (error) {
        console.error("Error fetching available industries:", error);
        const container = document.getElementById('industry-buttons-container');
        if (container) {
            container.innerHTML = `<p class="text-red-500 col-span-full">Could not load industry data.</p>`;
        }
    }
}

function renderIndustryButtons() {
    const container = document.getElementById('industry-buttons-container');
    if (!container) return;

    const genericIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>`; // Using Industrials icon as generic

    container.innerHTML = state.availableIndustries.map(industry => `
        <button class="flex flex-col items-center justify-center p-4 text-center bg-teal-100 text-teal-800 hover:bg-teal-200 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-1" data-industry="${sanitizeText(industry)}">
            ${genericIcon}
            <span class="mt-2 font-semibold text-sm">${sanitizeText(industry)}</span>
        </button>
    `).join('');
}


function handleIndustrySelection(industryName) {
    const modal = document.getElementById(CONSTANTS.MODAL_INDUSTRY_ANALYSIS);
    const modalTitle = modal.querySelector('#industry-analysis-modal-title');
    const selectorContainer = modal.querySelector('#industry-analysis-selector-container');
    const contentArea = modal.querySelector('#industry-analysis-content');

    modalTitle.textContent = `Industry Deep Dive | ${industryName}`;
    contentArea.innerHTML = `<div class="text-center text-gray-500 pt-16">Please select an analysis type above to begin.</div>`;
    modal.dataset.analysisName = 'Industry_Deep_Dive'; // Reset on new selection
    
    const analysisTypes = [
        {
            name: 'Market Trends',
            promptName: 'MarketTrends',
            description: 'AI agent finds companies in this industry, searches news, and generates a market summary.',
            svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>`
        },
        {
            name: 'The Disruptor',
            promptName: 'DisruptorAnalysis',
            description: "VC-style report on a high-growth, innovative company with potential to disrupt its industry.",
            svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>`
        },
        {
            name: 'The Fortress',
            promptName: 'FortressAnalysis',
            description: 'Identifies a resilient, "all-weather" business with strong pricing power and a rock-solid balance sheet, built to withstand economic downturns.',
            svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286zm0 13.036h.008v.008h-.008v-.008z" /></svg>`
        },
        {
            name: 'The Phoenix',
            promptName: 'PhoenixAnalysis',
            description: 'Analyzes a "fallen angel" company that has stumbled badly but is now showing credible, quantifiable signs of a fundamental business turnaround.',
            svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.62a8.983 8.983 0 013.362-3.867 8.262 8.262 0 013 2.456z" /><path stroke-linecap="round" stroke-linejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" /></svg>`
        },
        {
            name: 'Pick & Shovel',
            promptName: 'PickAndShovel',
            description: 'Identifies essential suppliers that power an entire industry, a lower-risk way to invest in a trend.',
            svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21.75 17.25v-.228a4.5 4.5 0 00-.12-1.03l-2.268-9.64a3.375 3.375 0 00-3.285-2.602H7.923a3.375 3.375 0 00-3.285 2.602l-2.268 9.64a4.5 4.5 0 00-.12 1.03v.228m19.5 0a3 3 0 01-3 3H5.25a3 3 0 01-3-3m19.5 0a3 3 0 00-3-3H5.25a3 3 0 00-3 3m16.5 0h.008v.008h-.008v-.008zm-3 0h.008v.008h-.008v-.008z" /></svg>`
        },
        {
            name: 'The Linchpin',
            promptName: 'Linchpin',
            description: 'Focuses on companies that control a vital, irreplaceable choke point in an industry’s value chain.',
            svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M13.192 7.027a5.25 5.25 0 017.423 0L21 7.402a5.25 5.25 0 010 7.423l-.385.385a5.25 5.25 0 01-7.423 0L13.192 7.027zm-6.384 0a5.25 5.25 0 017.423 0L15 7.402a5.25 5.25 0 010 7.423l-5.385 5.385a5.25 5.25 0 01-7.423 0L2 19.973a5.25 5.25 0 010-7.423l.385-.385z" /><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6" /></svg>`
        },
        {
            name: 'Hidden Value',
            promptName: 'HiddenValue',
            description: 'A sum-of-the-parts investigation to find complex companies the market may be undervaluing.',
            svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h12v-1.5M3.75 3h16.5v13.5A2.25 2.25 0 0118 18.75h-9.75A2.25 2.25 0 016 16.5v-1.5" /><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6h1.5m-1.5 3h1.5m-1.5 3h1.5" /></svg>`
        },
        {
            name: 'The Untouchables',
            promptName: 'Untouchables',
            description: 'Deconstructs the "cult" brand moat of a company with fanatical customer loyalty, analyzing how that translates into durable pricing power and long-term profits.',
            svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>`
        }
    ];

    let html = `
        <div class="text-center w-full">
            <span class="block text-sm font-bold text-gray-500 uppercase mb-4">AI Analysis</span>
            <div class="flex flex-wrap justify-center gap-4">`;

    analysisTypes.forEach(type => {
        html += `
            <button class="analysis-tile" data-industry="${industryName}" data-prompt-name="${type.promptName}" data-tooltip="${type.description}">
                ${type.svgIcon}
                <span class="tile-name">${type.name}</span>
            </button>
        `;
    });

    html += `</div></div>`;
    selectorContainer.innerHTML = html;
    openModal(CONSTANTS.MODAL_INDUSTRY_ANALYSIS);
}

// --- NEW INDUSTRY DEEP DIVE WORKFLOW ---
async function handleIndustryMarketTrendsAnalysis(industryName) {
    openModal(CONSTANTS.MODAL_LOADING);
    const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);
    const contentArea = document.getElementById('industry-analysis-content');

    try {
        loadingMessage.textContent = `Finding companies in the ${industryName} industry...`;
        contentArea.innerHTML = `<div class="p-4 text-center text-gray-500">${loadingMessage.textContent}</div>`;

        const stocksResult = await findStocksByIndustry({ industryName });
        if (stocksResult.error || !stocksResult.stocks || stocksResult.stocks.length === 0) {
            throw new Error(`Could not find any companies for the ${industryName} industry.`);
        }
        const industryStocks = stocksResult.stocks;

        loadingMessage.textContent = `Searching news for up to ${industryStocks.length} companies...`;
        contentArea.innerHTML = `<div class="p-4 text-center text-gray-500">${loadingMessage.textContent}</div>`;
        const newsResult = await searchSectorNews({ sectorName: industryName, sectorStocks: industryStocks });
        if (newsResult.error || !newsResult.articles || newsResult.articles.length === 0) {
            throw new Error(`Could not find any recent news for the ${industryName} industry.`);
        }
        const validArticles = newsResult.articles;

        loadingMessage.textContent = `AI is analyzing news and generating the report...`;
        contentArea.innerHTML = `<div class="p-4 text-center text-gray-500">${loadingMessage.textContent}</div>`;

        const prompt = ONE_SHOT_INDUSTRY_TREND_PROMPT
            .replace(/{industryName}/g, industryName)
            .replace('${industryStocks}', industryStocks.join(', '))
            .replace('{newsArticlesJson}', JSON.stringify(validArticles, null, 2));

        let finalReport = await generatePolishedArticle(prompt, loadingMessage);

        finalReport = finalReport.replace(/\[Source: (?:Article )?(\d+)\]/g, (match, indexStr) => {
            const index = parseInt(indexStr, 10);
            const article = validArticles.find(a => a.articleIndex === index);
            if (article) {
                const sourceParts = article.source.split('.');
                const sourceName = sourceParts.length > 1 ? sourceParts[sourceParts.length - 2] : article.source;
                return `[(Source: ${sourceName}, ${article.publicationDate})](${article.link})`;
            }
            return match;
        });

        contentArea.innerHTML = marked.parse(finalReport);

    } catch (error) {
        console.error("Error during AI agent industry analysis:", error);
        displayMessageInModal(`Could not complete AI analysis: ${error.message}`, 'error');
        contentArea.innerHTML = `<div class="p-4 text-center text-red-500">Error: ${error.message}</div>`;
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}


async function handleIndustryPlaybookAnalysis(industryName) {
    openModal(CONSTANTS.MODAL_LOADING);
    const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);

    const contentArea = document.getElementById('industry-analysis-content');
    contentArea.innerHTML = `<div class="p-4 text-center text-gray-500">Generating AI article: "Playbook"...</div>`;

    try {
        const prompt = INDUSTRY_CAPITAL_ALLOCATORS_PROMPT
            .replace(/{industryName}/g, industryName)
            .replace(/{companyName}/g, 'a Key Company'); 

        const report = await generatePolishedArticle(prompt, loadingMessage);
        contentArea.innerHTML = marked.parse(report);
    } catch (error) {
        console.error(`Error generating creative analysis for ${industryName}:`, error);
        displayMessageInModal(`Could not generate AI article: ${error.message}`, 'error');
        contentArea.innerHTML = `<div class="p-4 text-center text-red-500">Error: ${error.message}</div>`;
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

async function handleIndustryDisruptorAnalysis(industryName) {
    openModal(CONSTANTS.MODAL_LOADING);
    const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);

    const contentArea = document.getElementById('industry-analysis-content');
    contentArea.innerHTML = `<div class="p-4 text-center text-gray-500">Generating AI article: "Disruptor Analysis"...</div>`;

    try {
        const prompt = INDUSTRY_DISRUPTOR_ANALYSIS_PROMPT.replace(/{industryName}/g, industryName);
        const report = await generatePolishedArticle(prompt, loadingMessage);
        contentArea.innerHTML = marked.parse(report);
    } catch (error) {
        console.error(`Error generating disruptor analysis for ${industryName}:`, error);
        displayMessageInModal(`Could not generate AI article: ${error.message}`, 'error');
        contentArea.innerHTML = `<div class="p-4 text-center text-red-500">Error: ${error.message}</div>`;
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

async function handleIndustryMacroPlaybookAnalysis(industryName) {
    openModal(CONSTANTS.MODAL_LOADING);
    const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);

    const contentArea = document.getElementById('industry-analysis-content');
    contentArea.innerHTML = `<div class="p-4 text-center text-gray-500">Generating AI article: "Macro Playbook"...</div>`;

    try {
        const standardDisclaimer = "This article is for informational purposes only and should not be considered financial advice. Readers should consult with a qualified financial professional before making any investment decisions.";
        const prompt = INDUSTRY_MACRO_PLAYBOOK_PROMPT
            .replace(/{industryName}/g, industryName)
            .replace(/\[Include standard disclaimer\]/g, standardDisclaimer);
        const report = await generatePolishedArticle(prompt, loadingMessage);
        contentArea.innerHTML = marked.parse(report);
    } catch (error) {
        console.error(`Error generating macro playbook analysis for ${industryName}:`, error);
        displayMessageInModal(`Could not generate AI article: ${error.message}`, 'error');
        contentArea.innerHTML = `<div class="p-4 text-center text-red-500">Error: ${error.message}</div>`;
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}


// --- AI ANALYSIS REPORT GENERATORS ---

async function handleAnalysisRequest(symbol, reportType, promptTemplate, forceNew = false) {
    const isRating = reportType === 'StockRating';
    const contentContainer = document.getElementById(isRating ? 'investment-rating-container' : 'ai-article-container');
    const statusContainer = document.getElementById(isRating ? 'report-status-container-rating' : 'report-status-container-ai');
    
    contentContainer.innerHTML = '<div class="loader mx-auto"></div>';
    statusContainer.classList.add('hidden');

    try {
        const savedReports = await getSavedReports(symbol, reportType);

        if (savedReports.length > 0 && !forceNew) {
            const latestReport = savedReports[0];
            displayReport(contentContainer, latestReport.content);
            updateReportStatus(statusContainer, savedReports, latestReport.id, { symbol, reportType, promptTemplate });
        } else {
            openModal(CONSTANTS.MODAL_LOADING);
            const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);
            
            const data = await getFmpStockData(symbol);
            if (!data) throw new Error(`No cached FMP data found for ${symbol}.`);
            
            const companyName = get(data, 'company_profile.0.companyName', 'the company');
            const tickerSymbol = get(data, 'company_profile.0.symbol', symbol);

            const prompt = promptTemplate
                .replace(/{companyName}/g, companyName)
                .replace(/{tickerSymbol}/g, tickerSymbol)
                .replace('{jsonData}', JSON.stringify(data, null, 2));

            const newReportContent = await generatePolishedArticle(prompt, loadingMessage);
            displayReport(contentContainer, newReportContent);
            updateReportStatus(statusContainer, savedReports, null, { symbol, reportType, promptTemplate }); // Show status for newly generated report
            closeModal(CONSTANTS.MODAL_LOADING);
        }
    } catch (error) {
        displayMessageInModal(`Could not generate or load analysis: ${error.message}`, 'error');
        contentContainer.innerHTML = `<p class="text-red-500">Failed to generate report: ${error.message}</p>`;
    }
}


async function handleSaveReportToDb() {
    const modal = document.getElementById('rawDataViewerModal');
    const symbol = modal.querySelector('.ai-analysis-button')?.dataset.symbol || modal.querySelector('.tab-button.active')?.dataset.symbol;
    const activeTab = modal.querySelector('.tab-button.active').dataset.tab;

    let reportType, contentContainer;

    if (activeTab === 'investment-rating') {
        reportType = 'StockRating';
        contentContainer = document.getElementById('investment-rating-container');
    } else if (activeTab === 'ai-analysis') {
        // This part is tricky as we don't have a single "active" report type.
        // We will assume we're saving the content currently visible in ai-article-container.
        // A better approach might be to store the last loaded/generated reportType in a state variable.
        // For now, let's disable saving from the generic AI tab if a specific report hasn't been run.
        const currentContent = document.getElementById('ai-article-container').innerHTML;
        if (!currentContent || currentContent.includes('loader')) {
            displayMessageInModal("Please generate an analysis before saving.", "warning");
            return;
        }
        // We need to know which report this is. We'll add this to the status container's dataset.
        const statusContainer = document.getElementById('report-status-container-ai');
        reportType = statusContainer.dataset.activeReportType;
        contentContainer = document.getElementById('ai-article-container');
    }

    if (!reportType || !contentContainer || !symbol) {
        displayMessageInModal("Could not determine which report to save. Please select a specific analysis.", "warning");
        return;
    }

    const contentToSave = contentContainer.innerHTML;

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
        
        // Refresh the status to show the new saved version
        const savedReports = await getSavedReports(symbol, reportType);
        const latestReport = savedReports[0];
        const promptTemplate = promptMap[reportType]; // We'll need to store prompts globally
        updateReportStatus(document.getElementById(activeTab === 'investment-rating' ? 'report-status-container-rating' : 'report-status-container-ai'), savedReports, latestReport.id, { symbol, reportType, promptTemplate });

    } catch (error) {
        console.error("Error saving report to DB:", error);
        displayMessageInModal(`Could not save report: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}


async function getSavedReports(ticker, reportType) {
    const reportsRef = collection(state.db, CONSTANTS.DB_COLLECTION_AI_REPORTS);
    const q = query(reportsRef, where("ticker", "==", ticker), where("reportType", "==", reportType), orderBy("savedAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

function displayReport(container, content) {
    if (content.startsWith('<')) { // If content is HTML
        container.innerHTML = content;
    } else { // Assume it's markdown
        container.innerHTML = marked.parse(content);
    }
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
        `;
    }
    
    statusContainer.innerHTML = statusHtml;

    const versionSelector = document.getElementById(`version-selector-${analysisParams.reportType}`);
    if (versionSelector) {
        versionSelector.addEventListener('change', (e) => {
            const selectedReport = reports.find(r => r.id === e.target.value);
            if (selectedReport) {
                const contentContainer = statusContainer.nextElementSibling;
                displayReport(contentContainer, selectedReport.content);
                updateReportStatus(statusContainer, reports, selectedReport.id, analysisParams);
            }
        });
    }

    const generateNewBtn = document.getElementById(`generate-new-${analysisParams.reportType}`);
    if (generateNewBtn) {
        generateNewBtn.addEventListener('click', () => {
            handleAnalysisRequest(analysisParams.symbol, analysisParams.reportType, analysisParams.promptTemplate, true);
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

    const contentContainer = modal.querySelector('#custom-analysis-content, #industry-analysis-content, #view-fmp-data-content, #ai-article-container, #investment-rating-container');

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
