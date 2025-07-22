import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, Timestamp, doc, setDoc, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- App Version ---
const APP_VERSION = "3.7.0"; 

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
    API_FUNC_OVERVIEW: 'OVERVIEW',
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
let alphaVantageApiKey = "";

// --- UTILITY HELPERS ---

/**
 * Formats a large number into a readable string with a suffix (K, M, B, T).
 * Prepends a dollar sign for valid numbers.
 * @param {string | number} value The numeric value to format.
 * @returns {string} The formatted string (e.g., "$2.95T") or "N/A".
 */
function formatMarketCap(value) {
    const num = parseFloat(value);
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

function handleClearCache(symbol) {
    openConfirmationModal(
        'Clear All Cache?',
        `This will permanently delete all stored data for ${symbol}. The next time you search for it, fresh data will be fetched from the API. Are you sure?`,
        async () => {
            openModal(CONSTANTS.MODAL_LOADING);
            document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Clearing cache for ${symbol}...`;
            try {
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

async function fetchAndCacheComprehensiveData(symbol) {
    console.log(`Starting comprehensive data fetch for ${symbol}...`);
    const comprehensiveData = {};
    const errors = {};

    for (const func of COMPREHENSIVE_API_FUNCTIONS) {
        try {
            console.log(`Fetching ${func} for ${symbol}...`);
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
    const container = document.getElementById(CONSTANTS.CONTAINER_DYNAMIC_CONTENT);
    const previousContent = container.innerHTML;

    const tickerRegex = /^[A-Z.]{1,10}$/;
    if (!tickerRegex.test(symbol)) {
        displayMessageInModal("Please enter a valid stock ticker symbol (e.g., 'AAPL', 'BRK.A').", "warning");
        return;
    }
    
    openModal(CONSTANTS.MODAL_LOADING);
    
    try {
        const mainCacheRef = doc(db, 'cached_stock_data', symbol);
        const cachedDoc = await getDoc(mainCacheRef);

        let overview, overviewTimestamp;

        if (cachedDoc.exists()) {
            document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Retrieving stored data for ${symbol}...`;
            console.log(`Using cached data for ${symbol}.`);
            
            const cachedData = cachedDoc.data();
            overview = cachedData.overview.data;
            overviewTimestamp = cachedData.overview.cachedAt;
        } else {
            document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Fetching new data for ${symbol}...`;
            console.log(`No cache found for ${symbol}. Fetching new data...`);

            overview = await fetchAlphaVantageData(CONSTANTS.API_FUNC_OVERVIEW, symbol);
            overviewTimestamp = Timestamp.now();
            
            const dataToCache = {
                overview: { data: overview, cachedAt: overviewTimestamp },
            };
            await setDoc(mainCacheRef, dataToCache);
            
            fetchAndCacheComprehensiveData(symbol);
        }

        document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Rendering UI...`;
        container.innerHTML = '';
        renderOverviewCard(overview, overviewTimestamp, symbol);

        tickerInput.value = '';

    } catch (error) {
        console.error("Error during stock research:", error);
        container.innerHTML = previousContent; // Restore previous content on error
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
            const contentEl = document.getElementById(CONSTANTS.ELEMENT_FULL_DATA_CONTENT);
            
            document.getElementById('full-data-modal-title').textContent = `Full Cached Data for ${symbol}`;
            document.getElementById('full-data-modal-timestamp').textContent = `Data Stored On: ${fullData.cachedAt.toDate().toLocaleString()}`;

            if (fullData.errors && Object.keys(fullData.errors).length > 0) {
                let errorText = 'The following errors occurred during the background data fetch:\n\n';
                for (const [key, value] of Object.entries(fullData.errors)) {
                    errorText += `- ${key}: ${value}\n`;
                }
                contentEl.textContent = errorText;
            } else {
                contentEl.textContent = JSON.stringify(fullData.data, null, 2);
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

function renderOverviewCard(overviewData, cacheTimestamp, symbol) {
    const container = document.getElementById(CONSTANTS.CONTAINER_DYNAMIC_CONTENT);
    
    const marketCap = formatMarketCap(overviewData.MarketCapitalization);
    const peRatio = overviewData.PERatio !== "None" ? overviewData.PERatio : "N/A";
    const eps = overviewData.EPS !== "None" ? overviewData.EPS : "N/A";
    const weekHigh = overviewData['52WeekHigh'] && overviewData['52WeekHigh'] !== "None" ? `$${overviewData['52WeekHigh']}` : "N/A";
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
            <h3 class="text-lg font-semibold text-gray-700 mt-4 mb-2">Company Overview</h3>
            <p class="mt-1 text-sm text-gray-600">${sanitizeText(overviewData.Description)}</p>
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
    
    document.getElementById('clear-cache-button')?.addEventListener('click', () => handleClearCache(symbol));
    document.getElementById('view-full-data-button')?.addEventListener('click', () => handleViewFullData(symbol));
}

function parseAlphaVantageDate(timeString) {
    if (!timeString) return "Invalid Date";
    
    const match = timeString.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/);
    if (!match) return "Invalid Date";

    const [, year, month, day, hours, minutes, seconds] = match;
    const isoString = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`;
    
    const parsedDate = new Date(isoString);
    return isNaN(parsedDate) ? "Invalid Date" : parsedDate;
}

// --- EVENT LISTENERS ---

function setupEventListeners() {
    document.getElementById(CONSTANTS.FORM_API_KEY)?.addEventListener('submit', handleApiKeySubmit);
    document.getElementById(CONSTANTS.FORM_STOCK_RESEARCH)?.addEventListener('submit', handleResearchSubmit);
    
    const scrollTopBtn = document.getElementById(CONSTANTS.BUTTON_SCROLL_TOP);
    if (scrollTopBtn) scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

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
    const versionDisplay = document.getElementById('app-version-display');
    if(versionDisplay) {
        versionDisplay.textContent = `v${APP_VERSION}`;
    }
    openModal(CONSTANTS.MODAL_API_KEY);
}

document.addEventListener('DOMContentLoaded', initializeApplication);
