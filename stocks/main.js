import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, Timestamp, doc, setDoc, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- App Version ---
const APP_VERSION = "3.6.0"; 

// --- Constants ---
const CONSTANTS = {
    MODAL_API_KEY: 'apiKeyModal',
    MODAL_LOADING: 'loadingStateModal',
    MODAL_MESSAGE: 'messageModal',
    MODAL_CONFIRMATION: 'confirmationModal',
    MODAL_FULL_DATA: 'fullDataModal',
    FORM_API_KEY: 'apiKeyForm',
    FORM_STOCK_RESEARCH: 'stock-research-form',
    INPUT_TICKER: 'ticker-input',
    CONTAINER_DYNAMIC_CONTENT: 'dynamic-content-container',
    BUTTON_SCROLL_TOP: 'scroll-to-top-button',
    ELEMENT_LOADING_MESSAGE: 'loading-message',
    ELEMENT_FULL_DATA_CONTENT: 'full-data-content',
    CLASS_MODAL_OPEN: 'is-open',
    CLASS_BODY_MODAL_OPEN: 'modal-open',
    CLASS_HIDDEN: 'hidden',
    MAX_NEWS_ARTICLES: 5,
    API_FUNC_OVERVIEW: 'OVERVIEW',
    API_FUNC_NEWS: 'NEWS_SENTIMENT',
};

// List of comprehensive data endpoints to fetch
const COMPREHENSIVE_API_FUNCTIONS = [
    'INCOME_STATEMENT',
    'BALANCE_SHEET',
    'CASH_FLOW',
    'EARNINGS',
    'LISTING_DELISTING_STATUS',
    'TIME_SERIES_DAILY_ADJUSTED',
    'TIME_SERIES_WEEKLY_ADJUSTED',
    'TIME_SERIES_MONTHLY_ADJUSTED'
];


// --- Global State ---
let db;
let auth;
let userId;
let firebaseConfig = null;
let appIsInitialized = false;
let geminiApiKey = "";
let alphaVantageApiKey = "";
// Cache settings are no longer based on TTL, but this object can remain for reference
let cacheSettings = {
    // These values are no longer used in the fetching logic
    OVERVIEW_TTL: -1, // -1 signifies indefinite caching
    NEWS_SENTIMENT_TTL: -1,
    AI_OVERVIEW_TTL: -1,
    COMPREHENSIVE_TTL: -1
};

// --- UTILITY HELPERS ---

/**
 * Formats a large number into a readable string with a suffix (K, M, B, T).
 * Prepends a dollar sign for valid numbers.
 * @param {string | number} value The numeric value to format.
 * @returns {string} The formatted string (e.g., "$2.95T") or "N/A".
 */
function formatMarketCap(value) {
    const num = parseInt(value, 10);
    if (isNaN(num) || num <= 0) {
        return "N/A";
    }
    
    const tiers = [
        { value: 1e12, suffix: 'T' },
        { value: 1e9,  suffix: 'B' },
        { value: 1e6,  suffix: 'M' },
        { value: 1e3,  suffix: 'K' },
    ];
    
    const tier = tiers.find(t => num >= t.value);

    if (tier) {
        const formattedNum = (num / tier.value).toFixed(2);
        return `$${formattedNum}${tier.suffix}`;
    }
    
    return `$${num}`;
}


// --- SECURITY HELPERS ---

/**
 * Sanitizes a string of HTML to prevent XSS attacks. It first converts Markdown to HTML,
 * then purifies the result.
 * @param {string} dirtyMarkdown The potentially unsafe string, which may contain Markdown.
 * @returns {string} The sanitized HTML string, safe to insert into the DOM.
 */
function sanitizeAndParseMarkdown(dirtyMarkdown) {
    if (typeof dirtyMarkdown !== 'string' || !dirtyMarkdown) {
        return '';
    }
    const rawHtml = marked.parse(dirtyMarkdown);
    return DOMPurify.sanitize(rawHtml, { USE_PROFILES: { html: true } });
}

/**
 * Sanitizes a plain text string to prevent it from being interpreted as HTML.
 * @param {string} text The plain text to sanitize.
 * @returns {string} The sanitized text.
 */
function sanitizeText(text) {
    if (typeof text !== 'string') return '';
    const tempDiv = document.createElement('div');
    tempDiv.textContent = text;
    return tempDiv.innerHTML;
}

/**
 * Validates if a string is a valid HTTP/HTTPS URL.
 * @param {string} urlString The string to validate.
 * @returns {boolean} True if the URL is valid, false otherwise.
 */
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
    
    if (modal && modalContent) {
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
            case 'error':
                titleEl.textContent = 'Error!';
                titleEl.classList.add('text-red-600');
                break;
            case 'warning':
                titleEl.textContent = 'Warning!';
                titleEl.classList.add('text-yellow-600');
                break;
            default:
                titleEl.textContent = 'Info';
                titleEl.classList.add('text-gray-800');
        }

        card.append(titleEl, contentEl, okButton);
        modalContent.innerHTML = '';
        modalContent.appendChild(card);
        
        openModal(modalId);
    }
}

function openConfirmationModal(title, message, onConfirm) {
    const modalId = CONSTANTS.MODAL_CONFIRMATION;
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.querySelector('#confirmation-title').textContent = title;
    modal.querySelector('#confirmation-message').textContent = message;

    const confirmBtn = modal.querySelector('#confirm-button');
    const cancelBtn = modal.querySelector('#cancel-button');

    // Clone and replace the confirm button to remove old event listeners
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    
    newConfirmBtn.addEventListener('click', () => {
        onConfirm();
        closeModal(modalId);
    });

    cancelBtn.addEventListener('click', () => closeModal(modalId), { once: true });
    
    openModal(modalId);
}


// --- CONFIG & INITIALIZATION ---

/**
 * Safely parses a string that might be a JavaScript object literal into a standard JSON object.
 * This is a security enhancement to avoid using eval-like constructs.
 * @param {string} str The string to parse, expected to be a Firebase config object.
 * @returns {object} The parsed object.
 * @throws {Error} If the string cannot be parsed.
 */
function safeParseConfig(str) {
    try {
        const startIndex = str.indexOf('{');
        if (startIndex === -1) {
            throw new Error("Could not find a '{' in the config string.");
        }
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
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = "Initializing...";
    
    setTimeout(() => {
        document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = "Application ready.";
        closeModal(CONSTANTS.MODAL_LOADING);
    }, 500);
}

function initializeFirebase() {
    if (!firebaseConfig) {
        console.warn("Firebase config is missing. Firebase initialization skipped.");
        return;
    }
    try {
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);

        onAuthStateChanged(auth, user => {
            if (user) {
                userId = user.uid;
                if (!appIsInitialized) {
                    initializeAppContent();
                }
            } else {
                userId = null;
                appIsInitialized = false;
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
    const tempGeminiKey = document.getElementById('geminiApiKeyInput').value.trim();
    const tempAlphaVantageKey = document.getElementById('alphaVantageApiKeyInput').value.trim();
    const tempFirebaseConfigText = document.getElementById('firebaseConfigInput').value.trim();
    let tempFirebaseConfig;

    if (!tempGeminiKey || !tempFirebaseConfigText || !tempAlphaVantageKey) {
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
    
    geminiApiKey = tempGeminiKey;
    alphaVantageApiKey = tempAlphaVantageKey;
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
            </div>
        `;
        document.getElementById('logout-button').addEventListener('click', handleLogout);
    } else {
         authStatusEl.innerHTML = `
             <button id="login-button" class="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white font-semibold py-2 px-4 rounded-full">Login with Google</button>
        `;
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
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("Google Sign-In Popup failed:", error);
        displayMessageInModal(`Login failed: ${error.code}. Check for popup blockers.`, 'error');
    }
}

function handleLogout() {
    if (auth) {
        signOut(auth).catch(error => console.error("Sign out failed:", error));
    }
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
            console.error("API Error Response:", { status: response.status, body: errorBody });
            const errorMsg = errorBody?.error?.message || errorBody?.Information || response.statusText;
            throw new Error(`API request failed with status ${response.status}. Message: ${errorMsg}`);
        }
        return await response.json();
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') throw new Error('The API request timed out. Please try again.');
        throw error;
    }
}

async function callGeminiAPI(prompt) {
    if (!geminiApiKey) throw new Error("Gemini API Key is not set.");
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;
    const payload = { contents: [{ parts: [{ text: prompt }] }] };
    const result = await callApi(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });

    if (result.error) {
        throw new Error(`Gemini API Error: ${result.error.message}`);
    }
    if (!result.candidates || result.candidates.length === 0) {
        throw new Error('Invalid response from Gemini API: No candidates returned.');
    }
    
    return result.candidates[0]?.content?.parts?.[0]?.text || null;
}

async function fetchAlphaVantageData(functionName, symbol) {
    if (!alphaVantageApiKey) throw new Error("Alpha Vantage API Key is not set.");
    const url = `https://www.alphavantage.co/query?function=${functionName}&symbol=${symbol}&apikey=${alphaVantageApiKey}`;
    const data = await callApi(url);
    if (data.Note || (Object.keys(data).length === 0)) {
        throw new Error(data.Note || `No data returned from Alpha Vantage for ${functionName}. This may be due to API limits or an invalid symbol.`);
    }
    return data;
}

// --- CORE STOCK RESEARCH LOGIC ---

/**
 * Handles the user request to clear the cache for a specific stock ticker.
 * @param {string} symbol The stock symbol to clear from the cache.
 */
function handleClearCache(symbol) {
    openConfirmationModal(
        'Clear All Cache?',
        `This will permanently delete all stored data for ${symbol}. The next time you search for it, fresh data will be fetched from the APIs. Are you sure?`,
        async () => {
            openModal(CONSTANTS.MODAL_LOADING);
            document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Clearing cache for ${symbol}...`;
            try {
                // Delete both the main and comprehensive cache documents
                const mainDocRef = doc(db, 'cached_stock_data', symbol);
                const comprehensiveDocRef = doc(db, 'comprehensive_stock_data', symbol);
                
                await Promise.all([
                    deleteDoc(mainDocRef),
                    deleteDoc(comprehensiveDocRef)
                ]);

                document.getElementById(CONSTANTS.CONTAINER_DYNAMIC_CONTENT).innerHTML = '';
                displayMessageInModal(`Cache for ${symbol} has been cleared. You can now research it again to get fresh data.`, 'info');
            } catch (error) {
                console.error("Error clearing cache:", error);
                displayMessageInModal(`Failed to clear cache: ${error.message}`, 'error');
            } finally {
                closeModal(CONSTANTS.MODAL_LOADING);
            }
        }
    );
}

/**
 * Fetches and caches the full set of fundamental and time series data.
 * This runs in the background after the initial research request.
 * @param {string} symbol The stock symbol to fetch data for.
 */
async function fetchAndCacheComprehensiveData(symbol) {
    console.log(`Starting comprehensive data fetch for ${symbol}...`);
    const comprehensiveData = {};
    const errors = {};

    for (const func of COMPREHENSIVE_API_FUNCTIONS) {
        try {
            console.log(`Fetching ${func} for ${symbol}...`);
            // Add a small delay between calls to be kind to the API
            await new Promise(resolve => setTimeout(resolve, 1000));
            const data = await fetchAlphaVantageData(func, symbol);
            comprehensiveData[func] = data;
        } catch (error) {
            console.error(`Failed to fetch ${func} for ${symbol}:`, error);
            errors[func] = error.message;
        }
    }

    const docRef = doc(db, 'comprehensive_stock_data', symbol);
    const dataToCache = {
        data: comprehensiveData,
        errors: errors,
        cachedAt: Timestamp.now()
    };
    
    try {
        await setDoc(docRef, dataToCache);
        console.log(`Successfully cached comprehensive data for ${symbol}.`);
    } catch (dbError) {
        console.error(`Failed to write comprehensive data for ${symbol} to Firestore:`, dbError);
    }
}


/**
 * Generates a dynamic, AI-powered company overview based on recent news.
 * @param {string} symbol The stock symbol.
 * @param {Array} newsFeed The array of news articles from Alpha Vantage.
 * @returns {Promise<string>} A promise that resolves to the AI-generated overview.
 */
async function generateAiOverview(symbol, newsFeed) {
    if (!newsFeed || newsFeed.length === 0) {
        return "No recent news available to generate a dynamic overview.";
    }
    const headlines = newsFeed
        .slice(0, CONSTANTS.MAX_NEWS_ARTICLES)
        .map(article => `- ${article.title}`)
        .join('\n');
    
    const prompt = `As a financial analyst reviewing recent news for ${symbol}, write a concise, one-paragraph company overview. Focus on the current primary business drivers, strategic initiatives, and market position revealed in these headlines. Do not list the headlines themselves.

Recent Headlines:
${headlines}

Modern, news-driven company overview for ${symbol}:`;

    try {
        const overview = await callGeminiAPI(prompt);
        return overview || "AI overview could not be generated at this time.";
    } catch (error) {
        console.error("Failed to generate AI overview:", error);
        return "AI overview could not be generated due to an error.";
    }
}

/**
 * Main handler for stock research, with a "fetch-once" cache architecture.
 */
async function handleResearchSubmit(e) {
    e.preventDefault();
    const tickerInput = document.getElementById(CONSTANTS.INPUT_TICKER);
    const symbol = tickerInput.value.trim().toUpperCase();

    const tickerRegex = /^[A-Z.]{1,10}$/;
    if (!tickerRegex.test(symbol)) {
        displayMessageInModal("Please enter a valid stock ticker symbol (e.g., 'AAPL', 'GOOG').", "warning");
        return;
    }
    
    const container = document.getElementById(CONSTANTS.CONTAINER_DYNAMIC_CONTENT);
    container.innerHTML = '';
    openModal(CONSTANTS.MODAL_LOADING);
    
    try {
        const mainCacheRef = doc(db, 'cached_stock_data', symbol);
        const cachedDoc = await getDoc(mainCacheRef);

        let overview, aiOverview, summarizedNews, overviewTimestamp, newsTimestamp;

        if (cachedDoc.exists()) {
            // --- DATA EXISTS IN CACHE: USE IT ---
            document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Retrieving stored data for ${symbol}...`;
            console.log(`Using cached data for ${symbol}.`);
            
            const cachedData = cachedDoc.data();
            overview = cachedData.overview.data;
            overviewTimestamp = cachedData.overview.cachedAt;
            aiOverview = cachedData.aiOverview.data;
            summarizedNews = cachedData.news.data;
            newsTimestamp = cachedData.news.cachedAt;

        } else {
            // --- NO CACHE: FETCH FROM APIs AND STORE PERMANENTLY ---
            document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Fetching new data for ${symbol}...`;
            console.log(`No cache found for ${symbol}. Fetching new data...`);

            // 1. Fetch Overview
            overview = await fetchAlphaVantageData(CONSTANTS.API_FUNC_OVERVIEW, symbol);
            overviewTimestamp = Timestamp.now();
            
            // 2. Fetch News
            document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Fetching news for ${symbol}...`;
            const rawNewsData = await fetchAlphaVantageData(CONSTANTS.API_FUNC_NEWS, symbol);
            const rawNewsFeed = (rawNewsData.feed || [])
                .filter(article => article.ticker_sentiment.some(t => t.ticker === symbol && parseFloat(t.relevance_score) >= 0.5))
                .slice(0, CONSTANTS.MAX_NEWS_ARTICLES);

            // 3. Process News with AI
            document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Generating AI summaries...`;
            summarizedNews = await processNewsWithAI(rawNewsFeed, symbol);
            newsTimestamp = Timestamp.now();

            // 4. Generate AI Overview
            document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Generating AI overview...`;
            aiOverview = await generateAiOverview(symbol, rawNewsFeed);

            // 5. Save all generated data to the main cache
            const dataToUpdate = {
                overview: { data: overview, cachedAt: overviewTimestamp },
                news: { data: summarizedNews, cachedAt: newsTimestamp },
                aiOverview: { data: aiOverview, cachedAt: Timestamp.now() }
            };
            await setDoc(mainCacheRef, dataToUpdate);
            
            // 6. Trigger comprehensive data fetch in the background
            fetchAndCacheComprehensiveData(symbol);
        }

        // --- RENDER UI ---
        document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Rendering UI...`;
        renderOverviewCard(overview, aiOverview, overviewTimestamp, symbol);
        if (summarizedNews && summarizedNews.length > 0) {
            renderNewsCard(summarizedNews, symbol, newsTimestamp);
        } else {
             container.insertAdjacentHTML('beforeend', `<div class="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"><h3 class="font-bold text-lg text-emerald-500">Recent News</h3><p class="text-gray-500">No recent, relevant news found for ${symbol}.</p></div>`);
        }

        tickerInput.value = '';

    } catch (error) {
        console.error("Error during stock research:", error);
        displayMessageInModal(error.message, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

async function processNewsWithAI(articles, symbol) {
    if (!articles || articles.length === 0) return [];
    
    const summaryPromises = articles.map(async (article) => {
        const prompt = `As a financial analyst, provide a neutral, one-sentence summary of the following news article's key information, specifically as it relates to the company ${symbol}.
        
        Title: "${article.title}"
        Summary: "${article.summary}"
        
        One-sentence summary about ${symbol}:`;

        try {
            const summary = await callGeminiAPI(prompt);
            return { ...article, ai_summary: summary || article.summary };
        } catch (error) {
            console.warn(`Could not summarize article: "${article.title}"`, error);
            return { ...article, ai_summary: "[AI summary could not be generated.]" };
        }
    });

    return Promise.all(summaryPromises);
}


// --- UI RENDERING ---

/**
 * Handles showing the full cached data in a modal.
 * @param {string} symbol The stock symbol to view data for.
 */
async function handleViewFullData(symbol) {
    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Loading full data for ${symbol}...`;

    const docRef = doc(db, 'comprehensive_stock_data', symbol);
    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const fullData = docSnap.data();
            const contentEl = document.getElementById(CONSTANTS.ELEMENT_FULL_DATA_CONTENT);
            
            // Format the JSON with 2-space indentation for readability
            contentEl.textContent = JSON.stringify(fullData, null, 2);

            document.getElementById('full-data-modal-title').textContent = `Full Cached Data for ${symbol}`;
            document.getElementById('full-data-modal-timestamp').textContent = `Data Stored On: ${fullData.cachedAt.toDate().toLocaleString()}`;
            
            openModal(CONSTANTS.MODAL_FULL_DATA);
        } else {
            displayMessageInModal(`Comprehensive data for ${symbol} has not been stored yet. It is likely being fetched in the background. Please try again in a few moments.`, 'info');
        }
    } catch (error) {
        console.error("Failed to load full data:", error);
        displayMessageInModal(`Error loading data: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

/**
 * Renders the main company overview card with additional action buttons.
 * @param {object} overviewData The raw data from the OVERVIEW API call.
 * @param {string} aiOverview The AI-generated dynamic overview text.
 * @param {Timestamp} cacheTimestamp The timestamp of when the data was cached.
 * @param {string} symbol The stock symbol.
 */
function renderOverviewCard(overviewData, aiOverview, cacheTimestamp, symbol) {
    const container = document.getElementById(CONSTANTS.CONTAINER_DYNAMIC_CONTENT);
    
    const marketCap = formatMarketCap(overviewData.MarketCapitalization);
    const peRatio = overviewData.PERatio !== "None" ? overviewData.PERatio : "N/A";
    const eps = overviewData.EPS !== "None" ? overviewData.EPS : "N/A";
    const weekHigh = overviewData['52WeekHigh'] !== "None" && overviewData['52WeekHigh'] ? `$${overviewData['52WeekHigh']}` : "N/A";
    const timestampString = cacheTimestamp ? `Data Stored On: ${cacheTimestamp.toDate().toLocaleString()}` : '';

    const cardHtml = `
        <div class="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div class="flex justify-between items-start gap-4">
                <div>
                    <h2 class="text-2xl font-bold text-gray-800">${sanitizeText(overviewData.Name)} (${sanitizeText(overviewData.Symbol)})</h2>
                    <p class="text-gray-500">${sanitizeText(overviewData.Exchange)} | ${sanitizeText(overviewData.Sector)}</p>
                </div>
                <div class="flex-shrink-0 flex gap-2">
                    <button id="view-full-data-button" class="text-xs bg-indigo-100 text-indigo-700 hover:bg-indigo-200 font-semibold py-1 px-3 rounded-full">View Full Data</button>
                    <button id="clear-cache-button" class="text-xs bg-red-100 text-red-700 hover:bg-red-200 font-semibold py-1 px-3 rounded-full">Refresh Data</button>
                </div>
            </div>
            <h3 class="text-lg font-semibold text-gray-700 mt-4 mb-1">AI-Powered Overview</h3>
            <p class="mt-1 text-sm prose prose-sm max-w-none">${sanitizeAndParseMarkdown(aiOverview)}</p>
            <div class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center border-t pt-4">
                <div>
                    <p class="text-sm text-gray-500">Market Cap</p>
                    <p class="text-lg font-semibold">${sanitizeText(marketCap)}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-500">P/E Ratio</p>
                    <p class="text-lg font-semibold">${sanitizeText(peRatio)}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-500">EPS</p>
                    <p class="text-lg font-semibold">${sanitizeText(eps)}</p>
                </div>
                 <div>
                    <p class="text-sm text-gray-500">52 Week High</p>
                    <p class="text-lg font-semibold">${sanitizeText(weekHigh)}</p>
                </div>
            </div>
            <div class="text-right text-xs text-gray-400 mt-4">${timestampString}</div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', cardHtml);
    
    // Add event listeners for the newly created buttons
    document.getElementById('clear-cache-button')?.addEventListener('click', () => handleClearCache(symbol));
    document.getElementById('view-full-data-button')?.addEventListener('click', () => handleViewFullData(symbol));
}

/**
 * Parses non-standard YYYYMMDDTHHMMSS date strings safely.
 * @param {string} timeString The date string from the API.
 * @returns {string|Date} A JavaScript Date object or "Invalid Date" string on failure.
 */
function parseAlphaVantageDate(timeString) {
    if (!timeString || timeString.length < 15) return "Invalid Date";

    const year = timeString.substring(0, 4);
    const month = timeString.substring(4, 6);
    const day = timeString.substring(6, 8);
    const hours = timeString.substring(9, 11);
    const minutes = timeString.substring(11, 13);
    const seconds = timeString.substring(13, 15);
    
    const isoString = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`;

    const parsedDate = new Date(isoString);
    return isNaN(parsedDate) ? "Invalid Date" : parsedDate;
}

/**
 * Renders the news card with a timestamp.
 * @param {Array} newsItems The array of summarized news articles.
 * @param {string} symbol The stock symbol.
 * @param {Timestamp} cacheTimestamp The timestamp of when the news was cached.
 */
function renderNewsCard(newsItems, symbol, cacheTimestamp) {
    const container = document.getElementById(CONSTANTS.CONTAINER_DYNAMIC_CONTENT);
    const articlesHtml = newsItems.map(item => {
        const sentiment = item.ticker_sentiment.find(t => t.ticker === symbol) || { ticker_sentiment_label: 'Neutral' };
        const sentimentLabel = sentiment.ticker_sentiment_label;
        let sentimentColorClass = 'bg-gray-200 text-gray-800';
        if (sentimentLabel.includes('Bullish') || sentimentLabel.includes('Positive')) {
            sentimentColorClass = 'bg-green-100 text-green-800';
        } else if (sentimentLabel.includes('Bearish') || sentimentLabel.includes('Negative')) {
            sentimentColorClass = 'bg-red-100 text-red-800';
        }

        const publishedDate = parseAlphaVantageDate(item.time_published);
        const dateString = (publishedDate instanceof Date) ? publishedDate.toLocaleDateString() : publishedDate;

        return `
            <li class="py-4 border-b border-gray-200 last:border-b-0">
                <a href="${sanitizeText(item.url)}" target="_blank" rel="noopener noreferrer" class="hover:bg-gray-50 -m-3 p-3 block rounded-lg">
                    <p class="text-sm text-gray-500">${sanitizeText(item.source)} &bull; ${sanitizeText(dateString)}</p>
                    <h4 class="font-semibold text-emerald-500">${sanitizeText(item.title)}</h4>
                    <div class="text-sm mt-1 prose prose-sm max-w-none">${sanitizeAndParseMarkdown(item.ai_summary)}</div>
                    <div class="mt-2">
                        <span class="text-xs font-semibold px-2 py-1 rounded-full ${sentimentColorClass}">${sanitizeText(sentimentLabel)}</span>
                    </div>
                </a>
            </li>
        `;
    }).join('');

    const timestampString = cacheTimestamp ? `News Stored On: ${cacheTimestamp.toDate().toLocaleString()}` : '';

    const cardHtml = `
        <div class="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h3 class="font-bold text-lg text-emerald-500 mb-2">Recent News & AI Summary</h3>
            <ul class="divide-y divide-gray-200">${articlesHtml}</ul>
            <div class="text-right text-xs text-gray-400 mt-2">${timestampString}</div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', cardHtml);
}

// --- EVENT LISTENERS ---

function setupEventListeners() {
    document.getElementById(CONSTANTS.FORM_API_KEY)?.addEventListener('submit', handleApiKeySubmit);
    document.getElementById(CONSTANTS.FORM_STOCK_RESEARCH)?.addEventListener('submit', handleResearchSubmit);
    
    const scrollTopBtn = document.getElementById(CONSTANTS.BUTTON_SCROLL_TOP);
    if (scrollTopBtn) scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    // Add listener for closing the full data modal
    const closeFullDataBtn = document.getElementById('close-full-data-modal');
    if(closeFullDataBtn) closeFullDataBtn.addEventListener('click', () => closeModal(CONSTANTS.MODAL_FULL_DATA));
    
    window.addEventListener('scroll', () => {
        const scrollTopButton = document.getElementById(CONSTANTS.BUTTON_SCROLL_TOP);
        if (scrollTopButton) {
            scrollTopButton.classList.toggle(CONSTANTS.CLASS_HIDDEN, window.scrollY <= 300);
        }
    });
}

// --- APP INITIALIZATION TRIGGER ---

function initializeApplication() {
    setupEventListeners();
    marked.setOptions({
        renderer: new marked.Renderer(),
        gfm: true,
        breaks: true,
        pedantic: false,
        smartLists: true,
        smartypants: false
    });

    openModal(CONSTANTS.MODAL_API_KEY);
}

document.addEventListener('DOMContentLoaded', initializeApplication);
