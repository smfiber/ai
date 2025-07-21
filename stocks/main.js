import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, onSnapshot, Timestamp, doc, setDoc, deleteDoc, updateDoc, query, orderBy, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- App Version ---
const APP_VERSION = "3.2.0"; 

// --- Constants ---
const CONSTANTS = {
    MODAL_API_KEY: 'apiKeyModal',
    MODAL_LOADING: 'loadingStateModal',
    MODAL_MESSAGE: 'messageModal',
    FORM_API_KEY: 'apiKeyForm',
    FORM_STOCK_RESEARCH: 'stock-research-form',
    INPUT_TICKER: 'ticker-input',
    CONTAINER_DYNAMIC_CONTENT: 'dynamic-content-container',
    BUTTON_SCROLL_TOP: 'scroll-to-top-button',
    ELEMENT_LOADING_MESSAGE: 'loading-message',
    CLASS_MODAL_OPEN: 'is-open',
    CLASS_BODY_MODAL_OPEN: 'modal-open',
    CLASS_HIDDEN: 'hidden'
};

// --- Global State ---
let db;
let auth;
let userId;
let firebaseConfig = null;
let appIsInitialized = false;
let geminiApiKey = "";
let alphaVantageApiKey = "";

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
    const tempDiv = document.createElement('div');
    tempDiv.textContent = text;
    return tempDiv.innerHTML;
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
        card.className = 'card p-8 w-full max-w-sm m-4 text-center';
        const titleEl = document.createElement('h2');
        titleEl.className = 'text-2xl font-bold mb-4';
        const contentEl = document.createElement('p');
        contentEl.className = 'mb-6 themed-text-muted';
        contentEl.textContent = message;
        const okButton = document.createElement('button');
        okButton.textContent = 'OK';
        okButton.className = 'btn-primary w-full';
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
                titleEl.classList.add('themed-text-primary');
        }

        card.append(titleEl, contentEl, okButton);
        modalContent.innerHTML = '';
        modalContent.appendChild(card);
        
        openModal(modalId);
    }
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
        // Find the start of the object
        const startIndex = str.indexOf('{');
        if (startIndex === -1) {
            throw new Error("Could not find a '{' in the config string.");
        }
        const objectStr = str.substring(startIndex);

        // A safer way to convert JS object literal to JSON.
        // 1. Add quotes to keys that don't have them.
        // This regex finds keys (alphanumeric, can include _) that are not enclosed in quotes.
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
}

// --- AUTHENTICATION ---

function setupAuthUI(user) {
    const authStatusEl = document.getElementById('auth-status');
    const appContainer = document.getElementById('app-container');
    if (!authStatusEl || !appContainer) return;

    if (user) {
        appContainer.classList.remove(CONSTANTS.CLASS_HIDDEN);
        closeModal(CONSTANTS.MODAL_API_KEY);
        
        authStatusEl.innerHTML = `
            <div class="bg-white/20 backdrop-blur-sm rounded-full p-1 flex items-center gap-2 text-white text-sm">
                <img src="${sanitizeText(user.photoURL)}" alt="User photo" class="w-8 h-8 rounded-full">
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
    return result?.candidates?.[0]?.content?.parts?.[0]?.text || null;
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

async function handleResearchSubmit(e) {
    e.preventDefault();
    const tickerInput = document.getElementById(CONSTANTS.INPUT_TICKER);
    const symbol = tickerInput.value.trim().toUpperCase();
    if (!symbol) {
        displayMessageInModal("Please enter a stock ticker symbol.", "warning");
        return;
    }

    const container = document.getElementById(CONSTANTS.CONTAINER_DYNAMIC_CONTENT);
    container.innerHTML = '';
    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Researching ${symbol}...`;

    try {
        const [overview, news] = await Promise.all([
            fetchAlphaVantageData('OVERVIEW', symbol),
            fetchAlphaVantageData('NEWS_SENTIMENT', symbol)
        ]);
        
        document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Analyzing news for ${symbol}...`;

        renderOverviewCard(overview);

        const newsFeed = news.feed || [];
        if (newsFeed.length > 0) {
            const summarizedNews = await processNewsWithAI(newsFeed.slice(0, 10));
            renderNewsCard(summarizedNews, symbol);
        } else {
             container.insertAdjacentHTML('beforeend', `<div class="card p-6"><h3 class="font-bold text-lg themed-text-accent">Recent News</h3><p class="themed-text-muted">No recent news found for ${symbol}.</p></div>`);
        }
        
        // UX Improvement: Only clear the input on a successful search.
        tickerInput.value = '';

    } catch (error) {
        console.error("Error during stock research:", error);
        displayMessageInModal(error.message, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

async function processNewsWithAI(articles) {
    const summaryPromises = articles.map(async (article) => {
        const prompt = `Please provide a neutral, one-sentence summary of the following news article title and summary. Focus only on the key information.
        
        Title: "${article.title}"
        Summary: "${article.summary}"
        
        One-sentence summary:`;

        try {
            const summary = await callGeminiAPI(prompt);
            return { ...article, ai_summary: summary || article.summary };
        } catch (error) {
            console.warn(`Could not summarize article: "${article.title}"`, error);
            return { ...article, ai_summary: article.summary };
        }
    });

    return Promise.all(summaryPromises);
}


// --- UI RENDERING ---

function renderOverviewCard(data) {
    const container = document.getElementById(CONSTANTS.CONTAINER_DYNAMIC_CONTENT);
    
    // Bug Fix: Gracefully handle non-numeric or missing Market Cap
    const marketCapValue = parseInt(data.MarketCapitalization, 10);
    const marketCap = !isNaN(marketCapValue) && marketCapValue > 0 ? (marketCapValue / 1_000_000_000).toFixed(2) + 'B' : "N/A";

    const peRatio = data.PERatio !== "None" ? data.PERatio : "N/A";
    const eps = data.EPS !== "None" ? data.EPS : "N/A";
    const weekHigh = data['52WeekHigh'] !== "None" ? data['52WeekHigh'] : "N/A";

    const cardHtml = `
        <div class="card p-6">
            <div class="flex justify-between items-start">
                <div>
                    <h2 class="text-2xl font-bold themed-text-primary">${sanitizeText(data.Name)} (${sanitizeText(data.Symbol)})</h2>
                    <p class="themed-text-muted">${sanitizeText(data.Exchange)} | ${sanitizeText(data.Sector)}</p>
                </div>
                <span class="text-sm font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-800">${sanitizeText(data.AssetType)}</span>
            </div>
            <p class="mt-4 text-sm">${sanitizeText(data.Description)}</p>
            <div class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center border-t pt-4">
                <div>
                    <p class="text-sm themed-text-muted">Market Cap</p>
                    <p class="text-lg font-semibold">$${sanitizeText(marketCap)}</p>
                </div>
                <div>
                    <p class="text-sm themed-text-muted">P/E Ratio</p>
                    <p class="text-lg font-semibold">${sanitizeText(peRatio)}</p>
                </div>
                <div>
                    <p class="text-sm themed-text-muted">EPS</p>
                    <p class="text-lg font-semibold">${sanitizeText(eps)}</p>
                </div>
                 <div>
                    <p class="text-sm themed-text-muted">52 Week High</p>
                    <p class="text-lg font-semibold">$${sanitizeText(weekHigh)}</p>
                </div>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', cardHtml);
}

function renderNewsCard(newsItems, symbol) {
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

        const publishedDate = new Date(item.time_published.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6Z'));

        return `
            <li class="py-4 border-b">
                <a href="${sanitizeText(item.url)}" target="_blank" rel="noopener noreferrer" class="hover:bg-gray-50 -m-3 p-3 block rounded-lg">
                    <p class="text-sm themed-text-muted">${sanitizeText(item.source)} &bull; ${sanitizeText(publishedDate.toLocaleDateString())}</p>
                    <h4 class="font-semibold themed-text-accent">${sanitizeText(item.title)}</h4>
                    <div class="text-sm mt-1 prose prose-sm max-w-none">${sanitizeAndParseMarkdown(item.ai_summary)}</div>
                    <div class="mt-2">
                        <span class="text-xs font-semibold px-2 py-1 rounded-full ${sentimentColorClass}">${sanitizeText(sentimentLabel)}</span>
                    </div>
                </a>
            </li>
        `;
    }).join('');

    const cardHtml = `
        <div class="card p-6">
            <h3 class="font-bold text-lg themed-text-accent mb-2">Recent News & AI Summary</h3>
            <ul class="divide-y">${articlesHtml}</ul>
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
