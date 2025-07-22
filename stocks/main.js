import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, Timestamp, doc, setDoc, getDoc, deleteDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- App Version ---
const APP_VERSION = "4.1.0"; 

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
    CONTAINER_DYNAMIC_CONTENT: 'dynamic-content-container',
    BUTTON_SCROLL_TOP: 'scroll-to-top-button',
    ELEMENT_LOADING_MESSAGE: 'loading-message',
    ELEMENT_FULL_DATA_CONTENT: 'full-data-content',
    ELEMENT_FINANCIAL_ANALYSIS_CONTENT: 'financial-analysis-content',
    ELEMENT_UNDERVALUED_ANALYSIS_CONTENT: 'undervalued-analysis-content',
    CLASS_MODAL_OPEN: 'is-open',
    CLASS_BODY_MODAL_OPEN: 'modal-open',
    CLASS_HIDDEN: 'hidden',
    API_FUNC_OVERVIEW: 'OVERVIEW',
};

// List of comprehensive data endpoints to fetch
const COMPREHENSIVE_API_FUNCTIONS = [
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

// --- UTILITY HELPERS ---

/**
 * Formats a large number into a readable string with a suffix (B, M, K).
 * Returns "N/A" for invalid or zero values.
 * @param {string | number} value The numeric value to format.
 * @param {number} precision The number of decimal places.
 * @returns {string} The formatted string (e.g., "$2.95T") or "N/A".
 */
function formatLargeNumber(value, precision = 2) {
    const num = parseFloat(value);
    if (isNaN(num) || num === 0) return "N/A";
    
    const tiers = [
        { value: 1e12, suffix: 'T' },
        { value: 1e9,  suffix: 'B' },
        { value: 1e6,  suffix: 'M' },
        { value: 1e3,  suffix: 'K' },
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
                document.getElementById(CONSTANTS.CONTAINER_DYNAMIC_CONTENT).innerHTML = ''; // Clear content on logout
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
    const tempAlphaVantageKey = document.getElementById('alphaVantageApiKeyInput').value.trim();
    const tempFirebaseConfigText = document.getElementById('firebaseConfigInput').value.trim();
    let tempFirebaseConfig;

    if (!tempFirebaseConfigText || !tempAlphaVantageKey) {
        displayMessageInModal("The Alpha Vantage API Key and the Firebase Config are required.", "warning");
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

async function fetchAlphaVantageData(functionName, symbol) {
    if (!alphaVantageApiKey) throw new Error("Alpha Vantage API Key is not set.");
    const url = `https://www.alphavantage.co/query?function=${functionName}&symbol=${symbol}&apikey=${alphaVantageApiKey}`;
    const data = await callApi(url);
    if (data.Note || (Object.keys(data).length === 0) || data.Information) {
        throw new Error(data.Note || data.Information || `No data returned from Alpha Vantage for ${functionName}. This may be due to API limits or an invalid symbol.`);
    }
    return data;
}

// --- CORE STOCK RESEARCH LOGIC ---

async function loadAllCachedStocks() {
    if (!db) return;
    const container = document.getElementById(CONSTANTS.CONTAINER_DYNAMIC_CONTENT);
    container.innerHTML = ''; // Clear previous content

    try {
        const querySnapshot = await getDocs(collection(db, "cached_stock_data"));
        if (querySnapshot.empty) {
            container.innerHTML = `<p class="text-center text-gray-500">No stocks researched yet. Use the form above to get started!</p>`;
            return;
        }
        
        for (const docSnapshot of querySnapshot.docs) {
            const symbol = docSnapshot.id;
            const data = docSnapshot.data();
            
            const comprehensiveDocRef = doc(db, 'comprehensive_stock_data', symbol);
            const comprehensiveDocSnap = await getDoc(comprehensiveDocRef);
            const isComprehensiveDataReady = comprehensiveDocSnap.exists() && Object.keys(comprehensiveDocSnap.data().errors).length === 0;

            if (data.overview && data.overview.data) {
                renderOverviewCard(data.overview.data, data.overview.cachedAt, symbol, isComprehensiveDataReady);
            }
        }
    } catch (error) {
        console.error("Error loading cached stocks: ", error);
        displayMessageInModal(`Failed to load dashboard: ${error.message}`, 'error');
    }
}

function handleRefreshData(symbol) {
    openConfirmationModal(
        'Refresh All Data?',
        `This will permanently delete all stored data for ${symbol} and then refetch it from the API. This may consume your API quota. Are you sure?`,
        async () => {
            openModal(CONSTANTS.MODAL_LOADING);
            const loadingMessageEl = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);
            try {
                loadingMessageEl.textContent = `Deleting old data for ${symbol}...`;
                const mainDocRef = doc(db, 'cached_stock_data', symbol);
                const comprehensiveDocRef = doc(db, 'comprehensive_stock_data', symbol);
                
                await Promise.all([
                    deleteDoc(mainDocRef),
                    deleteDoc(comprehensiveDocRef)
                ]);

                loadingMessageEl.textContent = `Fetching fresh data for ${symbol}...`;
                const overview = await fetchAlphaVantageData(CONSTANTS.API_FUNC_OVERVIEW, symbol);
                const overviewTimestamp = Timestamp.now();
                
                const dataToCache = {
                    overview: { data: overview, cachedAt: overviewTimestamp },
                };
                await setDoc(mainDocRef, dataToCache);

                // This runs in the background and does not block the UI
                fetchAndCacheComprehensiveData(symbol);
                
                loadingMessageEl.textContent = `Refreshing dashboard...`;
                await loadAllCachedStocks(); // Refresh the dashboard
                displayMessageInModal(`Data for ${symbol} has been refreshed.`, 'info');

            } catch (error) {
                console.error("Error refreshing data:", error);
                displayMessageInModal(`Failed to refresh data: ${error.message}`, 'error');
            } finally {
                closeModal(CONSTANTS.MODAL_LOADING);
            }
        }
    );
}


async function fetchAndCacheComprehensiveData(symbol) {
    console.log(`Starting comprehensive data fetch for ${symbol}...`);
    const comprehensiveData = {};
    const errors = {};

    const promises = COMPREHENSIVE_API_FUNCTIONS.map(async (func) => {
        try {
            console.log(`Fetching ${func} for ${symbol}...`);
            const data = await fetchAlphaVantageData(func, symbol);
            return { func, data, status: 'fulfilled' };
        } catch (error) {
            console.error(`Failed to fetch ${func} for ${symbol}:`, error);
            return { func, error: error.message, status: 'rejected' };
        }
    });

    const results = await Promise.allSettled(promises);

    results.forEach(result => {
        // This check is for the Promise.allSettled wrapper itself.
        if (result.status === 'fulfilled') {
            const resValue = result.value;
            // This checks our custom status from the internal try/catch block.
            if (resValue.status === 'fulfilled') {
                comprehensiveData[resValue.func] = resValue.data;
            } else { // Our custom 'rejected' status
                errors[resValue.func] = resValue.error;
            }
        }
        // An `else` for `result.status === 'rejected'` is not needed here
        // because our internal try/catch ensures the promises always fulfill.
    });

    const docRef = doc(db, 'comprehensive_stock_data', symbol);
    const dataToCache = {
        data: comprehensiveData,
        errors: errors,
        cachedAt: Timestamp.now()
    };
    
    try {
        await setDoc(docRef, dataToCache, { merge: true });
        console.log(`Successfully cached comprehensive data for ${symbol}.`);
    } catch (dbError) {
        console.error(`Failed to write comprehensive data for ${symbol} to Firestore:`, dbError);
    }
}


async function handleResearchSubmit(e) {
    e.preventDefault();
    const tickerInput = document.getElementById(CONSTANTS.INPUT_TICKER);
    const symbol = tickerInput.value.trim().toUpperCase();

    const tickerRegex = /^[A-Z.]{1,10}$/;
    if (!tickerRegex.test(symbol)) {
        displayMessageInModal("Please enter a valid stock ticker symbol (e.g., 'AAPL', 'BRK.A').", "warning");
        return;
    }
    
    openModal(CONSTANTS.MODAL_LOADING);
    
    try {
        document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Checking for existing data for ${symbol}...`;
        const mainCacheRef = doc(db, 'cached_stock_data', symbol);
        const cachedDoc = await getDoc(mainCacheRef);

        if (cachedDoc.exists()) {
             displayMessageInModal(`${symbol} is already on your dashboard. To get fresh data, please use the 'Refresh Data' button on its card.`, 'info');
             tickerInput.value = '';
             return;
        }
        
        document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Fetching new data for ${symbol}...`;
        const overview = await fetchAlphaVantageData(CONSTANTS.API_FUNC_OVERVIEW, symbol);
        const overviewTimestamp = Timestamp.now();
        
        const dataToCache = {
            overview: { data: overview, cachedAt: overviewTimestamp },
        };
        await setDoc(mainCacheRef, dataToCache);
        
        // This runs in the background and does not block the UI
        fetchAndCacheComprehensiveData(symbol);
        
        document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Rendering UI...`;
        await loadAllCachedStocks(); // Refresh the entire dashboard
        tickerInput.value = '';

    } catch (error) {
        console.error("Error during stock research:", error);
        displayMessageInModal(error.message, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

// --- UI RENDERING ---

async function handleViewFullData(symbol) {
    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Loading full data for ${symbol}...`;

    const docRef = doc(db, 'comprehensive_stock_data', symbol);
    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const fullData = docSnap.data();
            const overviewDoc = await getDoc(doc(db, 'cached_stock_data', symbol));
            const overviewData = overviewDoc.exists() ? overviewDoc.data().overview.data : {};
            
            // Combine overview with comprehensive data for a complete picture
            const combinedData = {
                OVERVIEW: overviewData,
                ...fullData.data
            };

            const contentEl = document.getElementById(CONSTANTS.ELEMENT_FULL_DATA_CONTENT);
            
            document.getElementById('full-data-modal-title').textContent = `Full Cached Data for ${symbol}`;
            document.getElementById('full-data-modal-timestamp').textContent = `Data Stored On: ${fullData.cachedAt.toDate().toLocaleString()}`;

            if (fullData.errors && Object.keys(fullData.errors).length > 0) {
                 contentEl.textContent = `Errors occurred during the background fetch:\n\n${JSON.stringify(fullData.errors, null, 2)}\n\nAvailable data:\n\n${JSON.stringify(combinedData, null, 2)}`;
            } else {
                 contentEl.textContent = JSON.stringify(combinedData, null, 2);
            }
            
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

function renderOverviewCard(overviewData, cacheTimestamp, symbol, isComprehensiveDataReady = false) {
    const container = document.getElementById(CONSTANTS.CONTAINER_DYNAMIC_CONTENT);
    if (!overviewData || !overviewData.Symbol) {
        console.warn(`Skipping render for ${symbol} due to missing overview data.`);
        return;
    }

    if (container.innerHTML.includes('No stocks researched yet')) {
        container.innerHTML = '';
    }

    const marketCap = formatLargeNumber(overviewData.MarketCapitalization);
    const peRatio = overviewData.PERatio !== "None" ? overviewData.PERatio : "N/A";
    const eps = overviewData.EPS !== "None" ? overviewData.EPS : "N/A";
    const weekHigh = overviewData['52WeekHigh'] && overviewData['52WeekHigh'] !== "None" ? `$${overviewData['52WeekHigh']}` : "N/A";
    const timestampString = cacheTimestamp ? `Data Stored On: ${cacheTimestamp.toDate().toLocaleString()}` : '';
    
    const analysisButtonsState = isComprehensiveDataReady ? '' : 'disabled';
    const analysisButtonsClasses = isComprehensiveDataReady ? '' : 'opacity-50 cursor-not-allowed';


    const cardHtml = `
        <div class="bg-white rounded-2xl shadow-lg border border-gray-200 p-6" id="card-${symbol}">
            <div class="flex justify-between items-start gap-4">
                <div>
                    <h2 class="text-2xl font-bold text-gray-800">${sanitizeText(overviewData.Name)} (${sanitizeText(overviewData.Symbol)})</h2>
                    <p class="text-gray-500">${sanitizeText(overviewData.Exchange)} | ${sanitizeText(overviewData.Sector)}</p>
                </div>
                <div class="flex-shrink-0">
                    <button data-symbol="${symbol}" class="refresh-data-button text-xs bg-red-100 text-red-700 hover:bg-red-200 font-semibold py-1 px-3 rounded-full">Refresh Data</button>
                </div>
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
                <button data-symbol="${symbol}" class="undervalued-analysis-button text-sm bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-4 rounded-lg ${analysisButtonsClasses}" ${analysisButtonsState}>Undervalued Analysis</button>
                <button data-symbol="${symbol}" class="financial-analysis-button text-sm bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg ${analysisButtonsClasses}" ${analysisButtonsState}>Financial Analysis</button>
            </div>
            <div class="text-right text-xs text-gray-400 mt-4">${timestampString}</div>
        </div>
    `;
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
    });
}

function setupEventListeners() {
    document.getElementById(CONSTANTS.FORM_API_KEY)?.addEventListener('submit', handleApiKeySubmit);
    document.getElementById(CONSTANTS.FORM_STOCK_RESEARCH)?.addEventListener('submit', handleResearchSubmit);
    
    const scrollTopBtn = document.getElementById(CONSTANTS.BUTTON_SCROLL_TOP);
    if (scrollTopBtn) scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    // Listeners for closing modals
    document.getElementById('close-full-data-modal')?.addEventListener('click', () => closeModal(CONSTANTS.MODAL_FULL_DATA));
    document.getElementById('close-full-data-modal-bg')?.addEventListener('click', () => closeModal(CONSTANTS.MODAL_FULL_DATA));
    document.getElementById('close-financial-analysis-modal')?.addEventListener('click', () => closeModal(CONSTANTS.MODAL_FINANCIAL_ANALYSIS));
    document.getElementById('close-financial-analysis-modal-bg')?.addEventListener('click', () => closeModal(CONSTANTS.MODAL_FINANCIAL_ANALYSIS));
    document.getElementById('close-undervalued-analysis-modal')?.addEventListener('click', () => closeModal(CONSTANTS.MODAL_UNDERVALUED_ANALYSIS));
    document.getElementById('close-undervalued-analysis-modal-bg')?.addEventListener('click', () => closeModal(CONSTANTS.MODAL_UNDERVALUED_ANALYSIS));
    
    window.addEventListener('scroll', () => {
        const scrollTopButton = document.getElementById(CONSTANTS.BUTTON_SCROLL_TOP);
        if (scrollTopButton) {
            scrollTopButton.classList.toggle(CONSTANTS.CLASS_HIDDEN, window.scrollY <= 300);
        }
    });
    
    setupGlobalEventListeners();
}

// --- AI ANALYSIS REPORT GENERATORS ---

/**
 * Safely get a nested property from an object.
 * @param {object} obj The object to query.
 * @param {string} path The path to the property (e.g., 'data.OVERVIEW.Name').
 * @param {*} defaultValue The default value to return if not found.
 * @returns The property value or the default value.
 */
function get(obj, path, defaultValue = "N/A") {
    const value = path.split('.').reduce((a, b) => (a ? a[b] : undefined), obj);
    return value !== undefined && value !== null && value !== "None" ? value : defaultValue;
}


async function getComprehensiveData(symbol) {
    const docRef = doc(db, 'comprehensive_stock_data', symbol);
    const overviewRef = doc(db, 'cached_stock_data', symbol);
    
    const [docSnap, overviewSnap] = await Promise.all([getDoc(docRef), getDoc(overviewRef)]);

    if (!docSnap.exists() || !overviewSnap.exists()) {
        displayMessageInModal(`Comprehensive data for ${symbol} has not been stored yet. It is likely being fetched in the background. Please try again in a few moments.`, 'info');
        return null;
    }
    
    return {
        ...docSnap.data().data,
        OVERVIEW: overviewSnap.data().overview.data
    };
}


// --- Financial Analysis Report Generator ---
async function handleFinancialAnalysis(symbol) {
    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Analyzing ${symbol}...`;

    try {
        const data = await getComprehensiveData(symbol);
        if (!data) return;

        const report = generateFinancialAnalysisReport(data);
        const contentEl = document.getElementById(CONSTANTS.ELEMENT_FINANCIAL_ANALYSIS_CONTENT);
        document.getElementById('financial-analysis-modal-title').textContent = `Financial Analysis for ${symbol}`;
        
        contentEl.innerHTML = marked.parse(report);

        openModal(CONSTANTS.MODAL_FINANCIAL_ANALYSIS);
    } catch (error) {
        console.error("Error generating financial analysis:", error);
        displayMessageInModal(`Could not generate analysis: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

function generateFinancialAnalysisReport(data) {
    const { OVERVIEW, INCOME_STATEMENT, BALANCE_SHEET, CASH_FLOW } = data;

    const companyName = get(OVERVIEW, 'Name');
    const symbol = get(OVERVIEW, 'Symbol');

    const latest = (arr) => (Array.isArray(arr) && arr.length > 0 ? arr[0] : {});

    const latestIncome = latest(get(INCOME_STATEMENT, 'annualReports', []));
    const latestBalanceSheet = latest(get(BALANCE_SHEET, 'annualReports', []));
    const latestCashFlow = latest(get(CASH_FLOW, 'annualReports', []));
    
    const year = get(latestIncome, 'fiscalDateEnding', 'N/A').substring(0, 4);
    const totalRevenue = get(latestIncome, 'totalRevenue');
    const netIncome = get(latestIncome, 'netIncome');
    const eps = get(OVERVIEW, 'EPS');
    const operatingCashFlow = get(latestCashFlow, 'operatingCashflow');
    const netProfitMargin = get(OVERVIEW, 'ProfitMargin');
    
    const totalCurrentAssets = parseFloat(get(latestBalanceSheet, 'totalCurrentAssets', 0));
    const totalCurrentLiabilities = parseFloat(get(latestBalanceSheet, 'totalCurrentLiabilities', 0));
    const currentRatio = totalCurrentLiabilities > 0 ? (totalCurrentAssets / totalCurrentLiabilities).toFixed(2) : "N/A";
    
    const totalLiabilities = parseFloat(get(latestBalanceSheet, 'totalLiabilities', 0));
    const totalShareholderEquity = parseFloat(get(latestBalanceSheet, 'totalShareholderEquity', 0));
    const debtToEquity = totalShareholderEquity > 0 ? (totalLiabilities / totalShareholderEquity).toFixed(2) : "N/A";

    const incomeTrend = get(INCOME_STATEMENT, 'annualReports', []).slice(0, 3).reverse().map(r => 
        `\n  - **${r.fiscalDateEnding.substring(0,4)}:** Revenue: $${formatLargeNumber(r.totalRevenue)}, Net Income: $${formatLargeNumber(r.netIncome)}`
    ).join('');

    return `
# Overview 📈
This report provides a financial analysis for **${companyName} (${symbol})**. 
The data suggests a company with a market capitalization of **$${formatLargeNumber(get(OVERVIEW, 'MarketCapitalization'))}** operating in the **${get(OVERVIEW, 'Sector')}** sector.

# Key Financial Highlights (${year}) 📊
- **Total Revenue**: $${formatLargeNumber(totalRevenue)}
- **Net Income**: $${formatLargeNumber(netIncome)}
- **Net Profit Margin**: ${netProfitMargin === "N/A" ? "N/A" : (netProfitMargin * 100).toFixed(2) + '%'}
- **Earnings Per Share (EPS)**: $${eps}
- **Operating Cash Flow**: $${formatLargeNumber(operatingCashFlow)}

# Financial Deep Dive 🕵️
## Profitability Analysis 💰
The company's ability to generate profit is a key indicator of its success.
- **Revenue and Net Income Trends**: Here is a look at the past few years:${incomeTrend}
- **Profit Margins**: The company has a **Gross Profit Margin** of **${(get(OVERVIEW, 'GrossProfitTTM') / get(latestIncome, 'totalRevenue', 1) * 100).toFixed(2)}%**. The trailing twelve months **Net Profit Margin** stands at **${(get(OVERVIEW, 'ProfitMargin') * 100).toFixed(2)}%**.

## Financial Health & Stability 💪
- **Liquidity**: The **Current Ratio** is **${currentRatio}**. This suggests that for every $1 of short-term debt, the company has $${currentRatio} in short-term assets to cover it. A ratio above 1 generally indicates good short-term financial health.
- **Debt Levels**: The **Debt-to-Equity Ratio** is **${debtToEquity}**. This figure shows how much of the company's financing comes from debt versus shareholder equity. A higher number can indicate higher risk.

# Final Verdict 📝
This analysis provides a snapshot of **${companyName}'s** financial standing.
**Strengths**: Key strengths may include its market position, profitability margins, and cash flow generation.
**Weaknesses**: Potential areas for concern could be its debt levels or trends in revenue growth.
A potential investor should weigh these factors and consider the company's strategic initiatives and the broader economic environment.
    `;
}

// --- Undervalued Analysis Report Generator ---
async function handleUndervaluedAnalysis(symbol) {
    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Performing valuation analysis for ${symbol}...`;

    try {
        const data = await getComprehensiveData(symbol);
        if (!data) return;

        const report = generateUndervaluedAnalysisReport(data);
        const contentEl = document.getElementById(CONSTANTS.ELEMENT_UNDERVALUED_ANALYSIS_CONTENT);
        document.getElementById('undervalued-analysis-modal-title').textContent = `Undervalued Analysis for ${symbol}`;
        
        contentEl.innerHTML = marked.parse(report);

        openModal(CONSTANTS.MODAL_UNDERVALUED_ANALYSIS);
    } catch (error) {
        console.error("Error generating undervalued analysis:", error);
        displayMessageInModal(`Could not generate analysis: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

function generateUndervaluedAnalysisReport(data) {
    const { OVERVIEW } = data;
    
    const companyName = get(OVERVIEW, 'Name');
    const symbol = get(OVERVIEW, 'Symbol');

    const peRatio = get(OVERVIEW, 'PERatio');
    const pbRatio = get(OVERVIEW, 'PriceToBookRatio');
    const pegRatio = get(OVERVIEW, 'PEGRatio');
    const dividendYield = get(OVERVIEW, 'DividendYield');
    const roe = get(OVERVIEW, 'ReturnOnEquityTTM');
    const targetPrice = get(OVERVIEW, 'AnalystTargetPrice');
    
    const weekHigh52 = get(OVERVIEW, '52WeekHigh');
    const weekLow52 = get(OVERVIEW, '52WeekLow');
    const ma50 = get(OVERVIEW, '50DayMovingAverage');
    const ma200 = get(OVERVIEW, '200DayMovingAverage');

    return `
# Is ${companyName} (${symbol}) Undervalued? 🧐
An investment broker assesses a stock's value by combining fundamental financial health with market sentiment (technical analysis). Here is a breakdown for **${symbol}**.

## 1. Fundamental Analysis: Company Worth 💰
This looks at the financial strength to determine an intrinsic value.

### Key Valuation Ratios
- **P/E Ratio**: **${peRatio}**. A low P/E can indicate undervaluation. This should be compared to industry peers.
- **P/B Ratio**: **${pbRatio}**. A ratio below 1 is a classic sign of potential undervaluation.
- **PEG Ratio**: **${pegRatio}**. Enhances P/E with growth. A value below 1 is often considered ideal.
- **Dividend Yield**: **${dividendYield === "N/A" ? "N/A" : (dividendYield * 100).toFixed(2) + '%'}**. A high, sustainable yield can suggest the stock price is low.
- **Return on Equity (ROE)**: **${roe === "N/A" ? "N/A" : (roe * 100).toFixed(2) + '%'}**. A high ROE indicates efficient profit generation.

### Analyst Consensus
- **Analyst Target Price**: **$${targetPrice}**. This represents the median target price from professional analysts. Comparing this to the current market price is a strong indicator of market sentiment.

## 2. Technical Analysis: Market Sentiment 📉📈
This uses price data to gauge whether the stock is "on sale" or in a downtrend.

- **52-Week Range**: The stock has traded between **$${weekLow52}** and **$${weekHigh52}** over the past year. A price near the low may signal a buying opportunity if fundamentals are strong.
- **Moving Averages**:
  - **50-Day MA**: $${ma50}
  - **200-Day MA**: $${ma200}
  - **Interpretation**: If the current price is below these averages, the stock is in a short-term or long-term downtrend, respectively. A "golden cross" (50-day moves above 200-day) is a bullish signal, while a "death cross" is bearish.

## Synthesis: The Broker's Conclusion 📝
- **Fundamental View**: The valuation ratios provide a snapshot of whether the stock is cheap relative to its earnings, book value, and growth. A strong ROE and sustainable dividend are positive signs of a healthy business.
- **Market View**: The technical indicators show where the stock price is in its recent cycle. Is it beaten down and potentially oversold, or is it trading at a premium?
- **Final Verdict**: To determine if **${symbol}** is truly undervalued, an investor must synthesize these points. An ideal candidate would have **strong fundamentals (low P/E, high ROE) combined with bearish market sentiment (trading near 52-week lows)**. The gap between the current price and the **Analyst Target Price** is a critical data point for this conclusion.

*Disclaimer: This is an automated analysis for informational purposes and is not investment advice.*
    `;
}


// --- APP INITIALIZATION TRIGGER ---

function initializeApplication() {
    setupEventListeners();
    const versionDisplay = document.getElementById('app-version-display');
    if(versionDisplay) {
        versionDisplay.textContent = `v${APP_VERSION}`;
    }
    openModal(CONSTANTS.MODAL_API_KEY);
}

document.addEventListener('DOMContentLoaded', initializeApplication);
