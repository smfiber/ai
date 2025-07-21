import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, onSnapshot, Timestamp, doc, setDoc, deleteDoc, updateDoc, query, orderBy, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- App Version ---
const APP_VERSION = "3.0.1"; 

// --- Global State ---
let db;
let auth;
let userId;
let firebaseConfig = null;
let appIsInitialized = false;
let geminiApiKey = "";
let alphaVantageApiKey = "";
const root = document.documentElement;

// --- Prompt Engineering Constants ---
const jsonInstruction = ` IMPORTANT: Ensure your response is ONLY a valid JSON object. All strings must be enclosed in double quotes. Any double quotes or backslashes within a string value must be properly escaped (e.g., "This is a \\"sample\\" description." or "C:\\\\Users\\\\Admin"). Do not wrap the JSON in markdown code fences.`;

// --- MODAL HELPERS ---

/**
 * Opens a modal and manages body classes for scroll locking.
 * @param {string} modalId The ID of the modal element to open.
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if(modal) {
        document.body.classList.add('modal-open');
        modal.classList.add('is-open');
    }
}

/**
 * Closes a modal and intelligently manages body classes.
 * @param {string} modalId The ID of the modal element to close.
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if(modal) {
        modal.classList.remove('is-open');
        if (document.querySelectorAll('.modal.is-open').length === 0) {
             document.body.classList.remove('modal-open');
        }
    }
}

/**
 * Displays a generic message to the user in a modal.
 * @param {string} message The message to display.
 * @param {'info' | 'success' | 'warning' | 'error'} type The type of message.
 */
function displayMessageInModal(message, type = 'info') {
    const modalId = 'messageModal';
    let modal = document.getElementById(modalId);
    
    if (modal) {
        modal.innerHTML = `<div class="card p-8 w-full max-w-sm m-4 text-center"><h2 id="messageModalTitle" class="text-2xl font-bold mb-4"></h2><p id="messageModalContent" class="mb-6 themed-text-muted"></p><button id="closeMessageModal" class="btn-primary w-full">OK</button></div>`;
        modal.querySelector('#closeMessageModal').addEventListener('click', () => closeModal(modalId));

        const titleEl = modal.querySelector('#messageModalTitle');
        const contentEl = modal.querySelector('#messageModalContent');
        
        titleEl.textContent = type === 'error' ? 'Error!' : (type === 'warning' ? 'Warning!' : 'Info');
        titleEl.className = `text-2xl font-bold mb-4 ${type === 'error' ? 'text-red-600' : (type === 'warning' ? 'text-yellow-600' : 'themed-text-primary')}`;
        contentEl.textContent = message;
        
        openModal(modalId);
    }
}


// --- CONFIG & INITIALIZATION ---

/**
 * Safely parses a string that represents a JavaScript object (like the Firebase config).
 * @param {string} str The string to parse.
 * @returns {object} The parsed object.
 */
function parseJavaScriptObject(str) {
    try {
        const startIndex = str.indexOf('{');
        if (startIndex === -1) {
            throw new Error("Could not find a '{' in the config string.");
        }
        // The Function constructor provides a safer way to evaluate the object string than eval().
        return (new Function(`return ${str.substring(startIndex)}`))();
    } catch (e) {
        console.error("Failed to parse JS object string:", e);
        throw new Error("The provided config string is not a valid JavaScript object.");
    }
}

/**
 * Initializes the main application content after keys are verified.
 */
async function initializeAppContent() {
    if (appIsInitialized) return;
    appIsInitialized = true;

    openModal('loadingStateModal');
    document.getElementById('loading-message').textContent = "Initializing...";
    
    setTimeout(() => {
        document.getElementById('loading-message').textContent = "Application ready.";
        closeModal('loadingStateModal');
    }, 500);
}

/**
 * Initializes Firebase services (Auth, Firestore).
 */
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
        openModal('apiKeyModal');
        const errorEl = document.getElementById('api-key-error');
        if (errorEl) {
            errorEl.textContent = `Firebase Error: ${error.message}. Please check your config object.`;
        }
    }
}

/**
 * Handles the submission of the API key form.
 * @param {Event} e The form submission event.
 */
async function handleApiKeySubmit(e) {
    e.preventDefault();
    const tempGeminiKey = document.getElementById('geminiApiKeyInput').value.trim();
    const tempAlphaVantageKey = document.getElementById('alphaVantageApiKeyInput').value.trim();
    const tempFirebaseConfigText = document.getElementById('firebaseConfigInput').value.trim();
    let tempFirebaseConfig;

    const errorEl = document.getElementById('api-key-error');
    errorEl.textContent = '';

    if (!tempGeminiKey || !tempFirebaseConfigText || !tempAlphaVantageKey) {
        errorEl.textContent = "All API Keys and the Firebase Config are required.";
        return;
    }
    
    try {
        // Use the flexible parser for the Firebase config object.
        tempFirebaseConfig = parseJavaScriptObject(tempFirebaseConfigText);
        if (!tempFirebaseConfig.apiKey || !tempFirebaseConfig.projectId) {
            throw new Error("The parsed Firebase config is invalid or missing required properties.");
        }
    } catch (err) {
        errorEl.textContent = `Invalid Firebase Config: ${err.message}. Please paste the complete object.`;
        return;
    }
    
    geminiApiKey = tempGeminiKey;
    alphaVantageApiKey = tempAlphaVantageKey;
    firebaseConfig = tempFirebaseConfig;
    
    initializeFirebase();
}

// --- AUTHENTICATION ---

/**
 * Sets up the login/logout UI based on user's auth state.
 * @param {object|null} user The Firebase user object.
 */
function setupAuthUI(user) {
    const authStatusEl = document.getElementById('auth-status');
    const appContainer = document.getElementById('app-container');
    if (!authStatusEl || !appContainer) return;

    if (user) {
        appContainer.classList.remove('hidden');
        closeModal('apiKeyModal');
        
        authStatusEl.innerHTML = `
            <div class="bg-white/20 backdrop-blur-sm rounded-full p-1 flex items-center gap-2 text-white text-sm">
                <img src="${user.photoURL}" alt="User photo" class="w-8 h-8 rounded-full">
                <span class="font-medium pr-2">${user.displayName}</span>
                <button id="logout-button" class="bg-white/20 hover:bg-white/40 text-white font-semibold py-1 px-3 rounded-full" title="Sign Out">Logout</button>
            </div>
        `;
        document.getElementById('logout-button').addEventListener('click', handleLogout);
    } else {
         authStatusEl.innerHTML = `
             <button id="login-button" class="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white font-semibold py-2 px-4 rounded-full">Login with Google</button>
        `;
        const loginButton = document.getElementById('login-button');
        if (loginButton) {
            loginButton.addEventListener('click', handleLogin);
        }
        appContainer.classList.add('hidden');
    }
}

/**
 * Handles the Google login popup flow.
 */
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

/**
 * Handles the user logout flow.
 */
function handleLogout() {
    if (auth) {
        signOut(auth).catch(error => console.error("Sign out failed:", error));
    }
}


// --- API CALLS ---

/**
 * A generic, cancellable fetch wrapper for API calls.
 * @param {string} url The URL to fetch.
 * @param {object} options The options for the fetch call.
 * @returns {Promise<object>} The JSON response from the API.
 */
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

/**
 * Calls the Gemini API to process a prompt.
 * @param {string} prompt The prompt to send to the AI.
 * @returns {Promise<string>} The text response from the AI.
 */
async function callGeminiAPI(prompt) {
    if (!geminiApiKey) throw new Error("Gemini API Key is not set.");
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;
    const payload = { contents: [{ parts: [{ text: prompt }] }] };
    const result = await callApi(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    return result?.candidates?.[0]?.content?.parts?.[0]?.text || null;
}

/**
 * Fetches data from the Alpha Vantage API for a specific function.
 * @param {string} functionName The Alpha Vantage function name (e.g., 'OVERVIEW', 'NEWS_SENTIMENT').
 * @param {string} symbol The stock ticker symbol.
 * @returns {Promise<object>} The JSON response from Alpha Vantage.
 */
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
 * Main handler for the research form submission.
 * @param {Event} e The form submission event.
 */
async function handleResearchSubmit(e) {
    e.preventDefault();
    const tickerInput = document.getElementById('ticker-input');
    const symbol = tickerInput.value.trim().toUpperCase();
    if (!symbol) {
        displayMessageInModal("Please enter a stock ticker symbol.", "warning");
        return;
    }

    const container = document.getElementById('dynamic-content-container');
    container.innerHTML = ''; // Clear previous results
    openModal('loadingStateModal');
    document.getElementById('loading-message').textContent = `Researching ${symbol}...`;

    try {
        const [overview, news] = await Promise.all([
            fetchAlphaVantageData('OVERVIEW', symbol),
            fetchAlphaVantageData('NEWS_SENTIMENT', symbol)
        ]);
        
        document.getElementById('loading-message').textContent = `Analyzing news for ${symbol}...`;

        renderOverviewCard(overview);

        const newsFeed = news.feed || [];
        if (newsFeed.length > 0) {
            const summarizedNews = await processNewsWithAI(newsFeed.slice(0, 10));
            renderNewsCard(summarizedNews, symbol);
        } else {
             container.insertAdjacentHTML('beforeend', `<div class="card p-6"><h3 class="font-bold text-lg themed-text-accent">Recent News</h3><p class="themed-text-muted">No recent news found for ${symbol}.</p></div>`);
        }

    } catch (error) {
        console.error("Error during stock research:", error);
        displayMessageInModal(error.message, 'error');
    } finally {
        tickerInput.value = '';
        closeModal('loadingStateModal');
    }
}

/**
 * Processes a list of news articles with Gemini for summarization.
 * @param {Array<object>} articles An array of news article objects from Alpha Vantage.
 * @returns {Promise<Array<object>>} A promise that resolves to the array of articles with summaries.
 */
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

/**
 * Renders the company overview card.
 * @param {object} data The overview data from Alpha Vantage.
 */
function renderOverviewCard(data) {
    const container = document.getElementById('dynamic-content-container');
    const marketCap = (parseInt(data.MarketCapitalization) / 1_000_000_000).toFixed(2);
    const peRatio = data.PERatio;
    const eps = data.EPS;

    const cardHtml = `
        <div class="card p-6">
            <div class="flex justify-between items-start">
                <div>
                    <h2 class="text-2xl font-bold themed-text-primary">${data.Name} (${data.Symbol})</h2>
                    <p class="themed-text-muted">${data.Exchange} | ${data.Sector}</p>
                </div>
                <span class="text-sm font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-800">${data.AssetType}</span>
            </div>
            <p class="mt-4 text-sm">${data.Description}</p>
            <div class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center border-t pt-4">
                <div>
                    <p class="text-sm themed-text-muted">Market Cap</p>
                    <p class="text-lg font-semibold">$${marketCap}B</p>
                </div>
                <div>
                    <p class="text-sm themed-text-muted">P/E Ratio</p>
                    <p class="text-lg font-semibold">${peRatio}</p>
                </div>
                <div>
                    <p class="text-sm themed-text-muted">EPS</p>
                    <p class="text-lg font-semibold">${eps}</p>
                </div>
                 <div>
                    <p class="text-sm themed-text-muted">52 Week High</p>
                    <p class="text-lg font-semibold">$${data['52WeekHigh']}</p>
                </div>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', cardHtml);
}

/**
 * Renders the news and sentiment card.
 * @param {Array<object>} newsItems The processed news items.
 * @param {string} symbol The stock ticker symbol.
 */
function renderNewsCard(newsItems, symbol) {
    const container = document.getElementById('dynamic-content-container');
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
                <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="hover:bg-gray-50 -m-3 p-3 block rounded-lg">
                    <p class="text-sm themed-text-muted">${item.source} &bull; ${publishedDate.toLocaleDateString()}</p>
                    <h4 class="font-semibold themed-text-accent">${item.title}</h4>
                    <p class="text-sm mt-1">${item.ai_summary}</p>
                    <div class="mt-2">
                        <span class="text-xs font-semibold px-2 py-1 rounded-full ${sentimentColorClass}">${sentimentLabel}</span>
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
    document.getElementById('apiKeyForm')?.addEventListener('submit', handleApiKeySubmit);
    document.getElementById('stock-research-form')?.addEventListener('submit', handleResearchSubmit);
    
    const scrollTopBtn = document.getElementById('scroll-to-top-button');
    if (scrollTopBtn) scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    
    window.addEventListener('scroll', () => {
        const scrollTopButton = document.getElementById('scroll-to-top-button');
        if (scrollTopButton) {
            scrollTopButton.classList.toggle('hidden', window.scrollY <= 300);
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
    });

    openModal('apiKeyModal');
}

document.addEventListener('DOMContentLoaded', initializeApplication);
