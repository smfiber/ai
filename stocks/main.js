import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, Timestamp, doc, setDoc, getDoc, deleteDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- App Version ---
const APP_VERSION = "5.1.0"; 

// --- Constants ---
const CONSTANTS = {
    MODAL_API_KEY: 'apiKeyModal',
    MODAL_LOADING: 'loadingStateModal',
    MODAL_MESSAGE: 'messageModal',
    MODAL_CONFIRMATION: 'confirmationModal',
    MODAL_FULL_DATA: 'fullDataModal',
    MODAL_FINANCIAL_ANALYSIS: 'financialAnalysisModal',
    MODAL_UNDERVALUED_ANALYSIS: 'undervaluedAnalysisModal',
    FORM_API_KEY: 'apiKeyForm',
    FORM_STOCK_RESEARCH: 'stock-research-form',
    INPUT_TICKER: 'ticker-input',
    INPUT_ALPHA_VANTAGE_KEY: 'alphaVantageApiKeyInput',
    INPUT_GEMINI_KEY: 'geminiApiKeyInput',
    INPUT_WEB_SEARCH_KEY: 'webSearchApiKeyInput',
    INPUT_SEARCH_ENGINE_ID: 'searchEngineIdInput',
    CONTAINER_DYNAMIC_CONTENT: 'dynamic-content-container',
    BUTTON_SCROLL_TOP: 'scroll-to-top-button',
    ELEMENT_LOADING_MESSAGE: 'loading-message',
    ELEMENT_FULL_DATA_CONTENT: 'full-data-content',
    ELEMENT_FINANCIAL_ANALYSIS_CONTENT: 'financial-analysis-content',
    ELEMENT_UNDERVALUED_ANALYSIS_CONTENT: 'undervalued-analysis-content',
    CLASS_MODAL_OPEN: 'is-open',
    CLASS_BODY_MODAL_OPEN: 'modal-open',
    CLASS_HIDDEN: 'hidden',
    DB_COLLECTION_STOCKS: 'cached_stock_data',
};

// List of comprehensive data endpoints to fetch
const API_FUNCTIONS = [
    'OVERVIEW',
    'INCOME_STATEMENT',
    'BALANCE_SHEET',
    'CASH_FLOW',
    'EARNINGS',
];


// --- Global State ---
let db;
let auth;
let userId;
let firebaseConfig = null;
let appIsInitialized = false;
let alphaVantageApiKey = "";
let geminiApiKey = "";
let searchApiKey = "";
let searchEngineId = "";

// --- UTILITY HELPERS ---

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

// --- SECURITY HELPERS ---

function sanitizeText(text) {
    if (typeof text !== 'string') return '';
    const tempDiv = document.createElement('div');
    tempDiv.textContent = text;
    return tempDiv.innerHTML;
}

function isValidHttpUrl(urlString) {
    if (typeof urlString !== 'string' || !urlString) return false;
    try {
        const url = new URL(urlString);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch (_) {
        return false;
    }
}


// --- MODAL HELPERS ---

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if(modal) {
        document.body.classList.add(CONSTANTS.CLASS_BODY_MODAL_OPEN);
        modal.classList.add(CONSTANTS.CLASS_MODAL_OPEN);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if(modal) {
        modal.classList.remove(CONSTANTS.CLASS_MODAL_OPEN);
        if (document.querySelectorAll('.modal.is-open').length === 0) {
             document.body.classList.remove(CONSTANTS.CLASS_BODY_MODAL_OPEN);
        }
    }
}

function displayMessageInModal(message, type = 'info') {
    const modalId = CONSTANTS.MODAL_MESSAGE;
    const modal = document.getElementById(modalId);
    const modalContent = modal ? modal.querySelector('.modal-content') : null;
    if (!modal || !modalContent) return;

    const card = document.createElement('div');
    card.className = 'bg-white rounded-2xl shadow-lg border border-gray-200 p-8 w-full max-w-sm m-4 text-center';
    const titleEl = document.createElement('h2');
    titleEl.className = 'text-2xl font-bold mb-4';
    const contentEl = document.createElement('p');
    contentEl.className = 'mb-6 text-gray-500';
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
    modal.querySelector('#cancel-button').addEventListener('click', () => closeModal(modalId), { once: true });
    openModal(modalId);
}


// --- CONFIG & INITIALIZATION ---

function safeParseConfig(str) {
    try {
        const startIndex = str.indexOf('{');
        if (startIndex === -1) throw new Error("Could not find a '{' in the config string.");
        const objectStr = str.substring(startIndex);
        const jsonLike = objectStr.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');
        return JSON.parse(jsonLike);
    } catch (error) {
        console.error("Failed to parse config string:", error);
        throw new Error("The provided Firebase config is not valid. Please paste the complete object from the Firebase console.");
    }
}

async function initializeAppContent() {
    if (appIsInitialized) return;
    appIsInitialized = true;
    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = "Initializing & loading dashboard...";
    await loadAllCachedStocks();
    setTimeout(() => {
        document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = "Application ready.";
        closeModal(CONSTANTS.MODAL_LOADING);
    }, 500);
}

function initializeFirebase() {
    if (!firebaseConfig) return;
    try {
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        onAuthStateChanged(auth, user => {
            if (user) {
                userId = user.uid;
                if (!appIsInitialized) initializeAppContent();
            } else {
                userId = null;
                appIsInitialized = false;
                document.getElementById(CONSTANTS.CONTAINER_DYNAMIC_CONTENT).innerHTML = '';
            }
            setupAuthUI(user);
        });
    } catch (error) {
        console.error("Firebase initialization error:", error);
        displayMessageInModal(`Firebase Error: ${error.message}. Please check your config object.`, 'error');
    }
}

async function handleApiKeySubmit(e) {
    e.preventDefault();
    const tempAlphaVantageKey = document.getElementById(CONSTANTS.INPUT_ALPHA_VANTAGE_KEY).value.trim();
    const tempGeminiKey = document.getElementById(CONSTANTS.INPUT_GEMINI_KEY).value.trim();
    const tempSearchApiKey = document.getElementById(CONSTANTS.INPUT_WEB_SEARCH_KEY).value.trim();
    const tempSearchEngineId = document.getElementById(CONSTANTS.INPUT_SEARCH_ENGINE_ID).value.trim();
    const tempFirebaseConfigText = document.getElementById('firebaseConfigInput').value.trim();
    let tempFirebaseConfig;

    if (!tempFirebaseConfigText || !tempAlphaVantageKey || !tempSearchApiKey || !tempSearchEngineId || !tempGeminiKey) {
        displayMessageInModal("All API Keys and the Firebase Config are required.", "warning");
        return;
    }
    
    try {
        tempFirebaseConfig = safeParseConfig(tempFirebaseConfigText);
        if (!tempFirebaseConfig.apiKey || !tempFirebaseConfig.projectId) {
            throw new Error("The parsed Firebase config is invalid or missing required properties.");
        }
    } catch (err) {
        displayMessageInModal(`Invalid Firebase Config: ${err.message}`, "error");
        return;
    }
    
    alphaVantageApiKey = tempAlphaVantageKey;
    geminiApiKey = tempGeminiKey;
    searchApiKey = tempSearchApiKey;
    searchEngineId = tempSearchEngineId;
    firebaseConfig = tempFirebaseConfig;
    
    initializeFirebase();
    closeModal(CONSTANTS.MODAL_API_KEY);
}

// --- AUTHENTICATION ---

function setupAuthUI(user) {
    const authStatusEl = document.getElementById('auth-status');
    const appContainer = document.getElementById('app-container');
    if (!authStatusEl || !appContainer) return;
    if (user) {
        appContainer.classList.remove(CONSTANTS.CLASS_HIDDEN);
        closeModal(CONSTANTS.MODAL_API_KEY);
        const photoEl = isValidHttpUrl(user.photoURL) 
            ? `<img src="${sanitizeText(user.photoURL)}" alt="User photo" class="w-8 h-8 rounded-full">`
            : `<div class="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-bold">${sanitizeText(user.displayName.charAt(0))}</div>`;
        authStatusEl.innerHTML = `
            <div class="bg-white/20 backdrop-blur-sm rounded-full p-1 flex items-center gap-2 text-white text-sm">
                ${photoEl}
                <span class="font-medium pr-2">${sanitizeText(user.displayName)}</span>
                <button id="logout-button" class="bg-white/20 hover:bg-white/40 text-white font-semibold py-1 px-3 rounded-full" title="Sign Out">Logout</button>
            </div>`;
        document.getElementById('logout-button').addEventListener('click', handleLogout);
    } else {
         authStatusEl.innerHTML = `<button id="login-button" class="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white font-semibold py-2 px-4 rounded-full">Login with Google</button>`;
        const loginButton = document.getElementById('login-button');
        if (loginButton) loginButton.addEventListener('click', handleLogin);
        appContainer.classList.add(CONSTANTS.CLASS_HIDDEN);
    }
}

async function handleLogin() {
    if (!auth) {
        displayMessageInModal("Authentication service is not ready. Please submit your API keys first.", "warning");
        return;
    }
    try {
        await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error) {
        console.error("Google Sign-In Popup failed:", error);
        displayMessageInModal(`Login failed: ${error.code}. Check for popup blockers.`, 'error');
    }
}

function handleLogout() {
    if (auth) signOut(auth).catch(error => console.error("Sign out failed:", error));
}


// --- API CALLS ---

async function callApi(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timeoutId);
        if (!response.ok) {
            let errorBody;
            try { errorBody = await response.json(); } catch { errorBody = await response.text(); }
            const errorMsg = errorBody?.error?.message || errorBody?.Information || response.statusText;
            throw new Error(`API request failed: ${errorMsg}`);
        }
        return await response.json();
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') throw new Error('The API request timed out.');
        throw error;
    }
}

async function callGeminiApi(prompt) {
    if (!geminiApiKey) {
        throw new Error("Gemini API key is not configured.");
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`;
    
    const body = {
        contents: [{
            parts: [{ "text": prompt }]
        }]
    };

    const data = await callApi(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts[0].text) {
        return data.candidates[0].content.parts[0].text;
    } else {
        console.error("Unexpected Gemini API response structure:", data);
        throw new Error("Failed to parse the response from the Gemini API. The structure was unexpected.");
    }
}


// --- CORE STOCK RESEARCH LOGIC ---

async function fetchAndCacheStockData(symbol) {
    const dataToCache = {};
    const failedFetches = [];

    const promises = API_FUNCTIONS.map(async (func) => {
        try {
            const data = await callApi(`https://www.alphavantage.co/query?function=${func}&symbol=${symbol}&apikey=${alphaVantageApiKey}`);
            if (data.Note || Object.keys(data).length === 0 || data.Information) {
                throw new Error(data.Note || data.Information || 'No data returned.');
            }
            return { func, data };
        } catch (error) {
            console.error(`Failed to fetch ${func} for ${symbol}:`, error);
            failedFetches.push(func);
            return null; // Return null for failed fetches
        }
    });

    const results = await Promise.all(promises);

    if (failedFetches.length > 0) {
        throw new Error(`Could not retrieve all required data. Failed to fetch: ${failedFetches.join(', ')}.`);
    }

    results.forEach(result => {
        if (result) dataToCache[result.func] = result.data;
    });

    if (!dataToCache.OVERVIEW) {
        throw new Error(`Essential 'OVERVIEW' data for ${symbol} could not be fetched. The symbol may be invalid.`);
    }

    dataToCache.cachedAt = Timestamp.now();
    await setDoc(doc(db, CONSTANTS.DB_COLLECTION_STOCKS, symbol), dataToCache);

    return dataToCache;
}

async function handleRefreshData(symbol) {
    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Refreshing all data for ${symbol}...`;
    try {
        await fetchAndCacheStockData(symbol);
        document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Rendering UI...`;
        await loadAllCachedStocks();
    } catch (error) {
        console.error("Error refreshing stock data:", error);
        displayMessageInModal(error.message, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

async function loadAllCachedStocks() {
    if (!db) return;
    const container = document.getElementById(CONSTANTS.CONTAINER_DYNAMIC_CONTENT);
    container.innerHTML = '';
    try {
        const querySnapshot = await getDocs(collection(db, CONSTANTS.DB_COLLECTION_STOCKS));
        if (querySnapshot.empty) {
            container.innerHTML = `<p class="text-center text-gray-500">No stocks researched yet. Use the form above to get started!</p>`;
            return;
        }
        const sortedDocs = querySnapshot.docs.sort((a, b) => a.data().OVERVIEW.Symbol.localeCompare(b.data().OVERVIEW.Symbol));
        sortedDocs.forEach(doc => renderOverviewCard(doc.data(), doc.id));
    } catch (error) {
        console.error("Error loading cached stocks: ", error);
        displayMessageInModal(`Failed to load dashboard: ${error.message}`, 'error');
    }
}

async function handleResearchSubmit(e) {
    e.preventDefault();
    const tickerInput = document.getElementById(CONSTANTS.INPUT_TICKER);
    const symbol = tickerInput.value.trim().toUpperCase();
    if (!/^[A-Z.]{1,10}$/.test(symbol)) {
        displayMessageInModal("Please enter a valid stock ticker symbol.", "warning");
        return;
    }
    
    openModal(CONSTANTS.MODAL_LOADING);
    
    try {
        document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Checking for existing data for ${symbol}...`;
        const docRef = doc(db, CONSTANTS.DB_COLLECTION_STOCKS, symbol);
        if ((await getDoc(docRef)).exists()) {
             displayMessageInModal(`${symbol} is already on your dashboard. Use 'Refresh Data' to get new data.`, 'info');
             tickerInput.value = '';
             return;
        }
        
        document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Fetching all data for ${symbol}... This may take a moment.`;
        await fetchAndCacheStockData(symbol);
        
        document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Rendering UI...`;
        await loadAllCachedStocks();
        tickerInput.value = '';

    } catch (error) {
        console.error("Error during stock research:", error);
        displayMessageInModal(error.message, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

// --- NEWS FEATURE ---

function filterValidNews(articles) {
    const validArticles = [];
    if (!Array.isArray(articles)) return validArticles;

    // Iterative process to validate news
    for (const article of articles) {
        const hasTitle = article.title && typeof article.title === 'string' && article.title.trim() !== '';
        const hasSnippet = article.snippet && typeof article.snippet === 'string' && article.snippet.trim() !== '';
        const hasValidLink = isValidHttpUrl(article.link);

        if (hasTitle && hasSnippet && hasValidLink) {
            validArticles.push(article);
        }
    }
    return validArticles;
}

function renderNewsArticles(articles, symbol) {
    const card = document.getElementById(`card-${symbol}`);
    if (!card) return;

    const existingNewsContainer = card.querySelector('.news-container');
    if (existingNewsContainer) existingNewsContainer.remove();

    const newsContainer = document.createElement('div');
    newsContainer.className = 'news-container mt-4 border-t pt-4';

    if (articles.length === 0) {
        newsContainer.innerHTML = `<p class="text-sm text-gray-500">No recent news articles found.</p>`;
    } else {
        const articlesHtml = articles.map(article => `
            <div class="mb-4">
                <a href="${sanitizeText(article.link)}" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:underline font-semibold">${sanitizeText(article.title)}</a>
                <p class="text-sm text-gray-600 mt-1">${sanitizeText(article.snippet)}</p>
            </div>
        `).join('');
        newsContainer.innerHTML = `<h3 class="text-lg font-bold text-gray-700 mb-2">Recent News</h3>${articlesHtml}`;
    }
    card.appendChild(newsContainer);
}

async function handleFetchNews(symbol) {
    const button = document.querySelector(`#card-${symbol} .fetch-news-button`);
    if (!button) return;

    if (!searchApiKey || !searchEngineId) {
        displayMessageInModal("News feature requires the Web Search API Key and Search Engine ID. Please provide them in the settings.", "warning");
        return;
    }
    
    button.disabled = true;
    button.textContent = 'Fetching...';

    try {
        const stockData = await getStockDataFromCache(symbol);
        const companyName = get(stockData, 'OVERVIEW.Name', symbol);
        const query = encodeURIComponent(`${companyName} (${symbol}) stock market news`);
        const url = `https://www.googleapis.com/customsearch/v1?key=${searchApiKey}&cx=${searchEngineId}&q=${query}`;
        
        const newsData = await callApi(url);
        const validArticles = filterValidNews(newsData.items);
        renderNewsArticles(validArticles, symbol);

    } catch (error) {
        console.error("Error fetching news:", error);
        displayMessageInModal(`Could not fetch news: ${error.message}`, 'error');
    } finally {
        button.disabled = false;
        button.textContent = 'Fetch News';
    }
}


// --- UI RENDERING ---

function renderOverviewCard(data, symbol) {
    const container = document.getElementById(CONSTANTS.CONTAINER_DYNAMIC_CONTENT);
    const overviewData = data.OVERVIEW;
    if (!overviewData || !overviewData.Symbol) return;
    if (container.innerHTML.includes('No stocks researched yet')) container.innerHTML = '';

    const marketCap = formatLargeNumber(overviewData.MarketCapitalization);
    const peRatio = overviewData.PERatio !== "None" ? overviewData.PERatio : "N/A";
    const eps = overviewData.EPS !== "None" ? overviewData.EPS : "N/A";
    const weekHigh = overviewData['52WeekHigh'] && overviewData['52WeekHigh'] !== "None" ? `$${overviewData['52WeekHigh']}` : "N/A";
    const timestampString = data.cachedAt ? `Data Stored On: ${data.cachedAt.toDate().toLocaleString()}` : '';

    const cardHtml = `
        <div class="bg-white rounded-2xl shadow-lg border border-gray-200 p-6" id="card-${symbol}">
            <div class="flex justify-between items-start gap-4">
                <div>
                    <h2 class="text-2xl font-bold text-gray-800">${sanitizeText(overviewData.Name)} (${sanitizeText(overviewData.Symbol)})</h2>
                    <p class="text-gray-500">${sanitizeText(overviewData.Exchange)} | ${sanitizeText(overviewData.Sector)}</p>
                </div>
                <div class="flex-shrink-0"><button data-symbol="${symbol}" class="refresh-data-button text-xs bg-red-100 text-red-700 hover:bg-red-200 font-semibold py-1 px-3 rounded-full">Refresh Data</button></div>
            </div>
            <p class="mt-4 text-sm text-gray-600">${sanitizeText(overviewData.Description)}</p>
            <div class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center border-t pt-4">
                <div><p class="text-sm text-gray-500">Market Cap</p><p class="text-lg font-semibold">${sanitizeText(marketCap)}</p></div>
                <div><p class="text-sm text-gray-500">P/E Ratio</p><p class="text-lg font-semibold">${sanitizeText(peRatio)}</p></div>
                <div><p class="text-sm text-gray-500">EPS</p><p class="text-lg font-semibold">${sanitizeText(eps)}</p></div>
                <div><p class="text-sm text-gray-500">52 Week High</p><p class="text-lg font-semibold">${sanitizeText(weekHigh)}</p></div>
            </div>
            <div class="mt-6 border-t pt-4 flex flex-wrap gap-2 justify-end">
                <button data-symbol="${symbol}" class="view-json-button text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg">View JSON</button>
                <button data-symbol="${symbol}" class="fetch-news-button text-sm bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg">Fetch News</button>
                <button data-symbol="${symbol}" class="undervalued-analysis-button text-sm bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-4 rounded-lg">Undervalued Analysis</button>
                <button data-symbol="${symbol}" class="financial-analysis-button text-sm bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg">Financial Analysis</button>
            </div>
            <div class="text-right text-xs text-gray-400 mt-4">${timestampString}</div>
        </div>`;
    container.insertAdjacentHTML('beforeend', cardHtml);
}

// --- EVENT LISTENER SETUP ---

function setupGlobalEventListeners() {
    const container = document.getElementById(CONSTANTS.CONTAINER_DYNAMIC_CONTENT);
    container.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        const symbol = target.dataset.symbol;
        if (!symbol) return;
        if (target.classList.contains('refresh-data-button')) handleRefreshData(symbol);
        if (target.classList.contains('view-json-button')) handleViewFullData(symbol);
        if (target.classList.contains('financial-analysis-button')) handleFinancialAnalysis(symbol);
        if (target.classList.contains('undervalued-analysis-button')) handleUndervaluedAnalysis(symbol);
        if (target.classList.contains('fetch-news-button')) handleFetchNews(symbol);
    });
}

function setupEventListeners() {
    document.getElementById(CONSTANTS.FORM_API_KEY)?.addEventListener('submit', handleApiKeySubmit);
    document.getElementById(CONSTANTS.FORM_STOCK_RESEARCH)?.addEventListener('submit', handleResearchSubmit);
    
    const scrollTopBtn = document.getElementById(CONSTANTS.BUTTON_SCROLL_TOP);
    if (scrollTopBtn) scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    // FIX: Correctly add event listeners to modal close buttons and backgrounds
    const modalsToClose = [
        { modal: 'fullDataModal', button: 'close-full-data-modal', bg: 'close-full-data-modal-bg' },
        { modal: 'financialAnalysisModal', button: 'close-financial-analysis-modal', bg: 'close-financial-analysis-modal-bg' },
        { modal: 'undervaluedAnalysisModal', button: 'close-undervalued-analysis-modal', bg: 'close-undervalued-analysis-modal-bg' },
    ];

    modalsToClose.forEach(item => {
        document.getElementById(item.button)?.addEventListener('click', () => closeModal(item.modal));
        document.getElementById(item.bg)?.addEventListener('click', () => closeModal(item.modal));
    });

    window.addEventListener('scroll', () => {
        const btn = document.getElementById(CONSTANTS.BUTTON_SCROLL_TOP);
        if (btn) btn.classList.toggle(CONSTANTS.CLASS_HIDDEN, window.scrollY <= 300);
    });
    setupGlobalEventListeners();
}

// --- AI ANALYSIS REPORT GENERATORS ---

function get(obj, path, defaultValue = "N/A") {
    const value = path.split('.').reduce((a, b) => (a ? a[b] : undefined), obj);
    return value !== undefined && value !== null && value !== "None" ? value : defaultValue;
}

async function getStockDataFromCache(symbol) {
    const docRef = doc(db, CONSTANTS.DB_COLLECTION_STOCKS, symbol);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
        displayMessageInModal(`Could not find cached data for ${symbol}.`, 'error');
        return null;
    }
    const data = docSnap.data();
    if (!data.INCOME_STATEMENT || !data.BALANCE_SHEET || !data.CASH_FLOW) {
         displayMessageInModal(`Analysis data for ${symbol} is incomplete. Please refresh it.`, 'warning');
        return null;
    }
    return data;
}

async function handleViewFullData(symbol) {
    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Loading full data for ${symbol}...`;
    try {
        const docSnap = await getDoc(doc(db, CONSTANTS.DB_COLLECTION_STOCKS, symbol));
        if (docSnap.exists()) {
            const data = docSnap.data();
            document.getElementById(CONSTANTS.ELEMENT_FULL_DATA_CONTENT).textContent = JSON.stringify(data, null, 2);
            document.getElementById('full-data-modal-title').textContent = `Full Cached Data for ${symbol}`;
            document.getElementById('full-data-modal-timestamp').textContent = `Data Stored On: ${data.cachedAt.toDate().toLocaleString()}`;
            openModal(CONSTANTS.MODAL_FULL_DATA);
        } else {
            displayMessageInModal(`Could not find cached data for ${symbol}.`, 'error');
        }
    } catch (error) {
        displayMessageInModal(`Error loading data: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

async function handleFinancialAnalysis(symbol) {
    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Generating AI analysis for ${symbol}...`;
    try {
        const data = await getStockDataFromCache(symbol);
        if (!data) return;

        const companyName = get(data, 'OVERVIEW.Name', 'the company');
        const tickerSymbol = get(data, 'OVERVIEW.Symbol', symbol);

        // --- NEW PROMPT ---
        const prompt = `
Role: You are a senior investment analyst AI. Your purpose is to generate a rigorous, data-driven financial statement analysis for a sophisticated audience (e.g., portfolio managers, institutional investors). Your analysis must be objective, precise, and derived exclusively from the provided JSON data. All calculations and interpretations must be clearly explained.
Output Format: The final report must be in professional markdown format. Use # for the main title, ## for major sections, ### for sub-sections, and bullet points for key data and lists. Do NOT use any emojis. Present financial figures clearly, using 'Billion' or 'Million' where appropriate for readability.

Analyze the comprehensive financial data for ${companyName} (Ticker: ${tickerSymbol}) provided below:

JSON Data:
${JSON.stringify(data, null, 2)}

Based on the provided data, generate the following multi-faceted financial report:

# Comprehensive Financial Analysis: ${companyName} (${tickerSymbol})

## 1. Executive Summary
Begin with a concise, top-level summary (3-4 sentences) that encapsulates the company's financial condition, recent performance trajectory, and core investment profile. Synthesize the most critical findings from the profitability, solvency, and valuation analyses into a coherent opening statement.

## 2. Company Profile & Market Overview
### Business Description
Briefly describe the company's business based on the Description, Sector, and Industry from the OVERVIEW data.
### Market Snapshot
Present key market-related metrics for context.
- Market Capitalization: $XXX.XX Billion
- 52-Week Price Range: $XX.XX - $XX.XX
- 50-Day Moving Average: $XX.XX
- 200-Day Moving Average: $XX.XX
- Analyst Target Price: $XX.XX

## 3. Performance & Profitability Analysis
Assess the company's ability to generate earnings and create value for shareholders.
### 3.1. Revenue & Earnings Trend
Analyze the historical trend of totalRevenue and netIncome over the last 3-5 fiscal years using the INCOME_STATEMENT annual data.
Calculate and discuss the Year-over-Year (YoY) growth rates for both revenue and net income for the most recent two years.
Incorporate the QuarterlyRevenueGrowthYOY and QuarterlyEarningsGrowthYOY from the OVERVIEW data to comment on recent momentum.
### 3.2. Profitability Margins & Returns
Extract the ProfitMargin and OperatingMarginTTM from the OVERVIEW section.
Calculate the Gross Profit Margin for the last three fiscal years (grossProfit / totalRevenue).
Analyze the trend in these margins. Are they expanding, contracting, or stable? Provide potential reasons based on the data (e.g., changes in costOfRevenue vs. totalRevenue).
Analyze the ReturnOnEquityTTM (ROE) and ReturnOnAssetsTTM (ROA). Interpret these figures as indicators of management's efficiency in using its equity and asset bases to generate profit.

## 4. Financial Health & Risk Assessment
Evaluate the company's balance sheet strength, liquidity position, and reliance on debt.
### 4.1. Liquidity Analysis
Using the most recent BALANCE_SHEET annual report, calculate and interpret the following ratios:
- Current Ratio: (totalCurrentAssets / totalCurrentLiabilities). Explain its implication for the company's ability to meet short-term obligations.
- Quick Ratio (Acid-Test): (cashAndShortTermInvestments + currentNetReceivables) / totalCurrentLiabilities. Explain what this reveals about its reliance on selling inventory.
### 4.2. Solvency and Debt Structure
Calculate the Debt-to-Equity Ratio (totalLiabilities / totalShareholderEquity) for the last three fiscal years. Analyze the trend and comment on the company's leverage.
Analyze the composition of debt by comparing longTermDebt to shortTermDebt. Is the debt structure sustainable?
Calculate the Interest Coverage Ratio (EBIT / interestExpense) from the most recent INCOME_STATEMENT. Assess the company's ability to service its debt payments from its operating earnings.

## 5. Cash Flow Analysis
Analyze the generation and utilization of cash as detailed in the CASH_FLOW statement for the most recent 3 fiscal years.
### Operating Cash Flow (OCF)
Analyze the trend in operatingCashflow. Is it growing? Is it consistently positive?
### Quality of Earnings
Compare operatingCashflow to netIncome. A significant divergence can be a red flag. Is the company's profit backed by actual cash?
### Investing and Financing Activities
Analyze the major uses and sources of cash from cashflowFromInvestment (e.g., capitalExpenditures) and cashflowFromFinancing (e.g., dividendPayout, paymentsForRepurchaseOfCommonStock, debt issuance/repayment). What do these activities suggest about the company's strategy?

## 6. Valuation Analysis
Assess the company's current market valuation relative to its earnings and fundamentals.
Present and interpret the following valuation multiples from the OVERVIEW data:
- P/E Ratio (PERatio)
- Forward P/E (ForwardPE)
- Price-to-Sales Ratio (PriceToSalesRatioTTM)
- Price-to-Book Ratio (PriceToBookRatio)
- EV-to-EBITDA (EVToEBITDA)
Discuss what these multiples imply. Is the stock valued for growth, value, or something else? Compare the TrailingPE to the ForwardPE to understand earnings expectations.

## 7. Investment Thesis: Synthesis & Conclusion
Conclude with a final synthesis that integrates all the preceding analyses.
- **Key Strengths**: Identify 2-3 of the most significant financial strengths based on the data (e.g., strong OCF, low leverage, margin expansion).
- **Potential Weaknesses & Red Flags**: Identify 2-3 key weaknesses or areas for concern (e.g., high debt, declining revenue growth, poor quality of earnings, negative cash flow).
- **Overall Verdict**: Provide a concluding statement on the company's overall financial standing and investment profile. Based purely on this quantitative analysis, what is the primary narrative for a potential investor? (e.g., "A financially robust company with a premium valuation," or "A highly leveraged company facing profitability headwinds").
`;

        const report = await callGeminiApi(prompt);
        document.getElementById(CONSTANTS.ELEMENT_FINANCIAL_ANALYSIS_CONTENT).innerHTML = marked.parse(report);
        document.getElementById('financial-analysis-modal-title').textContent = `Financial Analysis for ${symbol}`;
        openModal(CONSTANTS.MODAL_FINANCIAL_ANALYSIS);

    } catch (error) {
        displayMessageInModal(`Could not generate AI analysis: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

async function handleUndervaluedAnalysis(symbol) {
    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Performing AI valuation for ${symbol}...`;
    try {
        const data = await getStockDataFromCache(symbol);
        if (!data) return;

        const companyName = get(data, 'OVERVIEW.Name', 'the company');
        const tickerSymbol = get(data, 'OVERVIEW.Symbol', symbol);

        const prompt = `
Role: You are an expert investment broker AI. Your task is to determine if a stock is undervalued by synthesizing fundamental and technical data.
Output Format: The output must be in professional markdown format for an investor. Use '#' for the main title, '##' for section headings, and '###' for sub-sections. Use '*' for bullet points. Do NOT use any emojis.

Analyze the following full JSON data for ${companyName} (Ticker: ${tickerSymbol}):
JSON:
${JSON.stringify(data, null, 2)}

Based on the provided data, generate the following analysis:

# Undervalued Analysis for ${companyName} (${tickerSymbol})
An investment broker assesses a stock's value by combining fundamental financial health with market sentiment (technical analysis). Here is a breakdown for **${tickerSymbol}**.

## 1. Fundamental Analysis: Company Worth
Assess the company's intrinsic value using key valuation ratios from the JSON data.

### Key Valuation Ratios
- **P/E Ratio**: **[Value]** (Comment on whether this is high or low, if possible).
- **P/B Ratio**: **[Value]** (Interpret this value, especially if it's below 1).
- **PEG Ratio**: **[Value]** (Explain the significance, especially if it's below 1).
- **Dividend Yield**: **[Value]**% (Comment on its attractiveness and sustainability if possible by checking the cash flow statement).
- **Return on Equity (ROE)**: **[Value]**% (Comment on the company's profitability from shareholder equity).

### Analyst Consensus
- **Analyst Target Price**: **$[Value]** (Compare this to the current market price if available in the data).

## 2. Technical Analysis: Market Sentiment
Assess the current market sentiment using technical indicators from the JSON data.

- **52-Week Range**: The stock has traded between **$[52WeekLow]** and **$[52WeekHigh]**.
- **Moving Averages**:
  - **50-Day MA**: $[50DayMovingAverage]
  - **200-Day MA**: $[200DayMovingAverage]
(Comment on the current price relative to these averages to determine the trend).

## Synthesis: The Broker's Conclusion
Synthesize all the points above to provide a final verdict.
- **Fundamental View**: Summarize the findings from the valuation ratios.
- **Technical View**: Summarize the findings from the market sentiment indicators.
- **Final Verdict**: Conclude whether the stock appears to be truly undervalued, fairly valued, or overvalued. Explain *why* based on the evidence. Is it a good investment opportunity right now?

*Disclaimer: This is an automated analysis for informational purposes and is not investment advice.*
`;
        
        const report = await callGeminiApi(prompt);
        document.getElementById(CONSTANTS.ELEMENT_UNDERVALUED_ANALYSIS_CONTENT).innerHTML = marked.parse(report);
        document.getElementById('undervalued-analysis-modal-title').textContent = `Undervalued Analysis for ${symbol}`;
        openModal(CONSTANTS.MODAL_UNDERVALUED_ANALYSIS);

    } catch (error) {
        displayMessageInModal(`Could not generate AI analysis: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}
// --- APP INITIALIZATION TRIGGER ---

function initializeApplication() {
    setupEventListeners();
    const versionDisplay = document.getElementById('app-version-display');
    if(versionDisplay) versionDisplay.textContent = `v${APP_VERSION}`;
    openModal(CONSTANTS.MODAL_API_KEY);
}

document.addEventListener('DOMContentLoaded', initializeApplication);
