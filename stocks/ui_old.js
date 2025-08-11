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

// --- FMP API INTEGRATION & MANAGEMENT ---
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
    investmentRatingContainer.innerHTML = '';
    profileDisplayContainer.innerHTML = '';
    chartsContainer.innerHTML = '';
    destroyCharts();

    document.querySelectorAll('#rawDataViewerModal .tab-content').forEach(c => c.classList.add('hidden'));
    document.querySelectorAll('#rawDataViewerModal .tab-button').forEach(b => b.classList.remove('active'));
    document.getElementById('company-profile-tab').classList.remove('hidden');
    document.querySelector('.tab-button[data-tab="company-profile"]').classList.add('active');

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

        // Check for saved investment rating report
        await handleAnalysisRequest(ticker, 'StockRating', STOCK_RATING_PROMPT);

    } catch (error) {
        console.error('Error opening raw data viewer:', error);
        titleEl.textContent = `Error Loading Data for ${ticker}`;
        aiArticleContainer.innerHTML = `<p class="text-red-500 text-center">${error.message}</p>`;
    }
}

// --- UI RENDERING ---

// *** NEW FUNCTION: Renders the main opportunities dashboard ***
export async function displayOpportunitiesDashboard() {
    const container = document.getElementById('opportunities-dashboard-container');
    const title = document.getElementById('opportunities-dashboard-title');
    if (!container || !title) return;

    container.innerHTML = '<div class="loader mx-auto my-8"></div>';

    try {
        const opportunitiesRef = collection(state.db, 'daily_opportunities');
        const q = query(opportunitiesRef, orderBy('score', 'desc'), limit(50));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            container.innerHTML = `<div class="text-center text-gray-500 p-8">No opportunities found. The daily analysis may not have run yet.</div>`;
            title.textContent = "Today's Top Opportunities";
            return;
        }

        const opportunities = querySnapshot.docs.map(doc => doc.data());
        const generationDate = opportunities[0].timestamp ? opportunities[0].timestamp.toDate().toLocaleDateString() : 'Today';
        title.textContent = `Today's Top Opportunities (Generated: ${generationDate})`;

        const html = opportunities.map(stock => {
            const scoreColor = stock.score >= 80 ? 'bg-green-100 text-green-800' : stock.score >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';

            return `
                <li class="opportunity-card">
                    <div class="flex-grow">
                        <h3 class="font-bold text-lg text-indigo-700">${sanitizeText(stock.companyName)} (${sanitizeText(stock.ticker)})</h3>
                        <p class="text-sm text-gray-600 mt-1 italic">"${sanitizeText(stock.justification)}"</p>
                    </div>
                    <div class="flex flex-col items-center justify-center flex-shrink-0 ml-4">
                        <div class="score-badge ${scoreColor}">${stock.score}/100</div>
                        <div class="flex gap-2 mt-2">
                            <button class="action-button-sm bg-blue-500 hover:bg-blue-600" data-ticker="${sanitizeText(stock.ticker)}" data-action="deep-dive">Deep Dive</button>
                            <button class="action-button-sm bg-gray-500 hover:bg-gray-600" data-ticker="${sanitizeText(stock.ticker)}" data-action="add-watchlist">Watchlist</button>
                        </div>
                    </div>
                </li>
            `;
        }).join('');

        container.innerHTML = `<ul class="space-y-4">${html}</ul>`;
    } catch (error) {
        console.error("Error displaying opportunities dashboard:", error);
        container.innerHTML = `<div class="text-center text-red-500 p-8">Could not load opportunities: ${error.message}</div>`;
        title.textContent = "Error Loading Opportunities";
    }
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

        if (target.matches('.ai-analysis-button') || target.matches('.generate-rating-button')) {
            const reportType = target.dataset.reportType;
            const promptTemplate = promptMap[reportType];
            if (promptTemplate) {
                const forceNew = target.matches('.generate-rating-button');
                handleAnalysisRequest(symbol, reportType, promptTemplate, forceNew);
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

    document.getElementById('opportunities-dashboard-container')?.addEventListener('click', (e) => {
        const button = e.target.closest('button[data-ticker]');
        if (!button) return;

        const ticker = button.dataset.ticker;
        const action = button.dataset.action;

        if (action === 'deep-dive') {
            openRawDataViewer(ticker);
        } else if (action === 'add-watchlist') {
            handleResearchSubmit({ preventDefault: () => {}, target: { elements: { 'ticker-input': { value: ticker } } } });
        }
    });
}

// --- AI ANALYSIS REPORT GENERATORS ---

async function handleAnalysisRequest(symbol, reportType, promptTemplate, forceNew = false) {
    const isRating = reportType === 'StockRating';
    const contentContainer = document.getElementById(isRating ? 'investment-rating-container' : 'ai-article-container');
    const statusContainer = document.getElementById(isRating ? 'report-status-container-rating' : 'report-status-container-ai');
    
    contentContainer.innerHTML = '<div class="loader mx-auto"></div>';
    statusContainer.classList.add('hidden');

    let newReportContent = null;

    try {
        const savedReports = await getSavedReports(symbol, reportType);

        if (savedReports.length > 0 && !forceNew) {
            const latestReport = savedReports[0];
            displayReport(contentContainer, latestReport.content);
            updateReportStatus(statusContainer, savedReports, latestReport.id, { symbol, reportType, promptTemplate });
            return; 
        }

        if (forceNew || (savedReports.length === 0 && !isRating)) {
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

            newReportContent = await generatePolishedArticle(prompt, loadingMessage);
            displayReport(contentContainer, newReportContent);
            updateReportStatus(statusContainer, [], null, { symbol, reportType, promptTemplate });
        } else {
            contentContainer.innerHTML = `<div class="text-center p-8"><button data-symbol="${symbol}" data-report-type="${reportType}" class="generate-rating-button bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-5 rounded-lg">Generate Investment Rating</button></div>`;
        }
    } catch (error) {
        displayMessageInModal(`Could not generate or load analysis: ${error.message}`, 'error');
        contentContainer.innerHTML = `<p class="text-red-500">Failed to generate report: ${error.message}</p>`;
    } finally {
        if (forceNew || (newReportContent && !isRating)) {
            closeModal(CONSTANTS.MODAL_LOADING);
        }
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
        const currentContent = document.getElementById('ai-article-container').innerHTML;
        if (!currentContent || currentContent.includes('loader')) {
            displayMessageInModal("Please generate an analysis before saving.", "warning");
            return;
        }
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
        
        const savedReports = await getSavedReports(symbol, reportType);
        const latestReport = savedReports[0];
        const promptTemplate = promptMap[reportType];
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
    if (content.startsWith('<')) { 
        container.innerHTML = content;
    } else { 
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
