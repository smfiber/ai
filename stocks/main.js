import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, Timestamp, doc, setDoc, getDoc, deleteDoc, collection, getDocs, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- App Version ---
const APP_VERSION = "5.2.0"; 

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
    DB_COLLECTION_CACHE: 'cached_stock_data',
    DB_COLLECTION_COMPREHENSIVE: 'comprehensive_stock_data',
};

const COMPREHENSIVE_API_FUNCTIONS = ['INCOME_STATEMENT', 'BALANCE_SHEET', 'CASH_FLOW', 'EARNINGS'];

// --- Global State ---
let db;
let auth;
let userId;
let firebaseConfig = null;
let appIsInitialized = false;
let alphaVantageApiKey = "";
let geminiApiKey = "";
let webSearchApiKey = "";
let searchEngineId = "";

// --- AI PROMPTS ---

// STEP 1: DRAFTING PROMPTS
const financialDraftPrompt = `Role: You are an expert financial analyst AI. Your goal is to provide a clear, concise, and insightful analysis of a company's financial health based *only* on the provided JSON data. The output must be strictly in markdown format, without any emojis.
Analyze the following financial data for [Company Name] (Ticker: [Ticker Symbol]):
JSON:
[Paste the full JSON data here]
Based *only* on the data provided, generate a draft analysis. Use markdown headings, subheadings, and bolding for key terms.

# **Financial Analysis for [Ticker Symbol]**
## **Overview**
Provide a brief, high-level summary (2-3 sentences) of the company's financial performance and health based on the data.
***
## **Key Financial Highlights ([Year])**
Extract and present the following key metrics for the most recent fiscal year.
* **Total Revenue**: $XXX.XX Billion
* **Net Income**: $XX.XX Billion
* **Net Profit Margin**: XX.X%
* **Earnings Per Share (EPS)**: $X.XX
* **Operating Cash Flow**: $XXX.XX Billion
***
## **Financial Deep Dive**
### **Profitability Analysis**
Describe revenue trends, net income trends, and profit margins over the last 3-5 years.
### **Financial Health & Stability**
Analyze liquidity via the Current Ratio and debt levels via the Debt-to-Equity Ratio for the most recent fiscal year.
***
## **Initial Verdict**
Provide a concluding paragraph summarizing the key strengths and potential weaknesses based *only* on this financial data.`;

const undervaluedDraftPrompt = `Role: You are an expert investment analyst. Your task is to synthesize the provided JSON data to determine if a stock could be undervalued. The output must be a clear, insightful draft in markdown format, without any emojis.
Analyze the following financial data for [Company Name] (Ticker: [Ticker Symbol]):
JSON:
[Paste the full JSON data here]
Based *only* on the data provided, generate the following valuation analysis draft:

# **Undervalued Analysis for [Ticker Symbol]**
## **Valuation Verdict**
Based on the data, is this stock showing signs of being a potential bargain, fairly priced, or a value trap? State the main reasons.
***
## **1. Fundamental Analysis: Is the Company a Good Value?**
### **Key Valuation Ratios**
* **P/E Ratios (PERatio, TrailingPE, ForwardPE)**: Interpret these ratios.
* **Price-to-Book (PriceToBookRatio)**: Analyze the P/B ratio in context (e.g., for a tech company).
* **PEG Ratio (PEGRatio)**: Explain what the PEG ratio suggests about its value relative to growth.
### **Deeper Financial Health**
* **Debt-to-Equity**: Calculate and state the Debt-to-Equity ratio.
* **Return on Equity (ReturnOnEquityTTM)**: Interpret the ROE.
* **Analyst Consensus**: State the consensus target price (AnalystTargetPrice).
***
## **2. Technical Analysis: What is the Market Sentiment?**
### **Price Context**
* **Price Range (52WeekHigh, 52WeekLow)**: Where is the stock trading within its 52-week range?
* **Trend Identification (50DayMovingAverage, 200DayMovingAverage)**: Is the stock in a downtrend or uptrend based on its moving averages?
***
## **The Broker's Initial Synthesis**
Combine the fundamental and technical insights into a preliminary conclusion.`;

// STEP 3: REVISION PROMPT
const revisionPromptTemplate = `Role: You are an expert financial analyst and editor.
You have created an initial draft analysis based on raw financial data. You have now been provided with a list of recent news articles.
Your task is to **revise and enhance your original draft** by integrating the insights, context, and sentiment from these articles.

**Instructions:**
1.  Read your original draft and the provided news articles.
2.  Refine your analysis. Corroborate, challenge, or add nuance to your initial findings using information from the news.
3.  Quantify your statements wherever possible using data points from the articles.
4.  Where you use information from an article, you **must cite the source URL** in parentheses immediately after the statement, like this: (https://www.example.com/article-1).
5.  Maintain the original markdown structure but elevate the language to be more comprehensive and insightful.

**Here is the information to synthesize:**

---
**ORIGINAL DRAFT:**
[Paste the original draft here]
---
**RECENT NEWS ARTICLES (Title, URL, Snippet):**
[Paste the news articles here]
---

Now, produce the final, revised, and cited report.`;


// --- UTILITY HELPERS ---
function formatLargeNumber(value, precision = 2) {
    const num = parseFloat(value);
    if (isNaN(num) || num === 0) return "N/A";
    const tiers = [
        { value: 1e12, suffix: 'T' }, { value: 1e9,  suffix: 'B' },
        { value: 1e6,  suffix: 'M' }, { value: 1e3,  suffix: 'K' } ];
    const tier = tiers.find(t => Math.abs(num) >= t.value);
    if (tier) { const formattedNum = (num / tier.value).toFixed(precision); return `${formattedNum}${tier.suffix}`; }
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
    try { const url = new URL(urlString); return url.protocol === "http:" || url.protocol === "https:"; } catch (_) { return false; }
}

// --- MODAL HELPERS ---
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if(modal) { document.body.classList.add(CONSTANTS.CLASS_BODY_MODAL_OPEN); modal.classList.add(CONSTANTS.CLASS_MODAL_OPEN); }
}
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if(modal) { modal.classList.remove(CONSTANTS.CLASS_MODAL_OPEN); if (document.querySelectorAll('.modal.is-open').length === 0) { document.body.classList.remove(CONSTANTS.CLASS_BODY_MODAL_OPEN); } }
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
        okButton.className = 'bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-5 rounded-lg shadow-md transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 w-full modal-close-trigger';
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
    newConfirmBtn.addEventListener('click', () => { onConfirm(); closeModal(modalId); });
    cancelBtn.addEventListener('click', () => closeModal(modalId), { once: true });
    openModal(modalId);
}

// --- CONFIG & INITIALIZATION ---
function safeParseConfig(str) {
    try {
        const objectStr = str.substring(str.indexOf('{'));
        return (new Function('return ' + objectStr))();
    } catch (error) {
        console.error("Failed to parse config string:", error);
        throw new Error("The provided Firebase config is not a valid JavaScript object. Please paste the complete object from the Firebase console.");
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
    if (!firebaseConfig) { console.warn("Firebase config is missing."); return; }
    try {
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        onAuthStateChanged(auth, user => {
            if (user) {
                userId = user.uid;
                if (!appIsInitialized) { initializeAppContent(); }
            } else {
                userId = null;
                appIsInitialized = false;
                document.getElementById(CONSTANTS.CONTAINER_DYNAMIC_CONTENT).innerHTML = '';
            }
            setupAuthUI(user);
        });
    } catch (error) {
        console.error("Firebase initialization error:", error);
        displayMessageInModal(`Firebase Error: ${error.message}.`, 'error');
    }
}
async function handleApiKeySubmit(e) {
    e.preventDefault();
    const tempGeminiKey = document.getElementById('geminiApiKeyInput').value.trim();
    const tempAlphaVantageKey = document.getElementById('alphaVantageApiKeyInput').value.trim();
    const tempWebSearchKey = document.getElementById('webSearchApiKeyInput').value.trim();
    const tempSearchEngineId = document.getElementById('searchEngineIdInput').value.trim();
    const tempFirebaseConfigText = document.getElementById('firebaseConfigInput').value.trim();
    let tempFirebaseConfig;

    if (!tempFirebaseConfigText || !tempAlphaVantageKey || !tempGeminiKey || !tempWebSearchKey || !tempSearchEngineId) {
        displayMessageInModal("All API keys (Gemini, Alpha Vantage, Web Search), the Search Engine ID, and the Firebase Config are required.", "warning");
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
    webSearchApiKey = tempWebSearchKey;
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
        authStatusEl.innerHTML = `<div class="bg-white/20 backdrop-blur-sm rounded-full p-1 flex items-center gap-2 text-white text-sm">
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
    if (!auth) { displayMessageInModal("Authentication service is not ready.", "warning"); return; }
    const provider = new GoogleAuthProvider();
    try { await signInWithPopup(auth, provider); } catch (error) {
        console.error("Google Sign-In Popup failed:", error);
        displayMessageInModal(`Login failed: ${error.code}. Check for popup blockers.`, 'error');
    }
}
function handleLogout() { if (auth) { signOut(auth).catch(error => console.error("Sign out failed:", error)); } }

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
        if (error.name === 'AbortError') throw new Error('The API request timed out.');
        throw error;
    }
}
async function fetchAlphaVantageData(functionName, symbol) {
    if (!alphaVantageApiKey) throw new Error("Alpha Vantage API Key is not set.");
    const url = `https://www.alphavantage.co/query?function=${functionName}&symbol=${symbol}&apikey=${alphaVantageApiKey}`;
    const data = await callApi(url);
    if (data.Note || (Object.keys(data).length === 0) || data.Information) {
        throw new Error(data.Note || data.Information || `No data returned from Alpha Vantage for ${functionName}.`);
    }
    return data;
}

async function fetchNewsArticles(ticker, analysisType) {
    if (!webSearchApiKey || !searchEngineId) {
        console.warn("Web Search API Key or Search Engine ID is not set. Skipping news search.");
        return "No news articles could be retrieved as web search credentials were not fully provided.";
    }
    const query = encodeURIComponent(`"${ticker}" ${analysisType} analysis`);
    const url = `https://www.googleapis.com/customsearch/v1?key=${webSearchApiKey}&cx=${searchEngineId}&q=${query}&num=5`;
    
    try {
        const results = await callApi(url);
        if (!results.items || results.items.length === 0) {
            return "No recent news articles were found.";
        }
        return results.items.map(item => ({
            title: item.title,
            link: item.link,
            snippet: item.snippet
        })).map(article => `Title: ${article.title}\nURL: ${article.link}\nSnippet: ${article.snippet}`).join('\n\n---\n\n');

    } catch (error) {
        console.error("Failed to fetch news articles:", error);
        return `An error occurred while fetching news articles: ${error.message}`;
    }
}

async function callGeminiApi(promptTemplate, templateData) {
    if (!geminiApiKey) throw new Error("Gemini API Key is not configured.");
    
    let fullPrompt = promptTemplate;
    
    for (const key in templateData) {
        const placeholder = `[Paste the ${key} here]`;
        let dataToInsert = templateData[key];
        if (typeof dataToInsert !== 'string') {
            dataToInsert = JSON.stringify(dataToInsert, null, 2);
        }
        fullPrompt = fullPrompt.replace(placeholder, dataToInsert);
    }
    
    const companyName = templateData?.jsonData?.OVERVIEW?.Name || 'the company';
    const tickerSymbol = templateData?.jsonData?.OVERVIEW?.Symbol || 'N/A';
    fullPrompt = fullPrompt.replace(/\[Company Name\]/g, companyName);
    fullPrompt = fullPrompt.replace(/\[Ticker Symbol\]/g, tickerSymbol);
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: fullPrompt }] }] })
        });
        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(`Gemini API Error (${response.status}): ${errorBody.error?.message || 'Unknown error'}`);
        }
        const data = await response.json();
        const analysisText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!analysisText) { throw new Error("Received an empty or invalid response from Gemini API."); }
        return analysisText;
    } catch (error) { console.error("Error calling Gemini API:", error); throw error; }
}


// --- CORE STOCK RESEARCH LOGIC ---
async function loadAllCachedStocks() {
    if (!db) return;
    const container = document.getElementById(CONSTANTS.CONTAINER_DYNAMIC_CONTENT);
    container.innerHTML = '';
    try {
        const querySnapshot = await getDocs(collection(db, CONSTANTS.DB_COLLECTION_CACHE));
        if (querySnapshot.empty) {
            container.innerHTML = `<p class="text-center text-gray-500">No stocks researched yet. Use the form above to get started!</p>`;
            return;
        }
        const cardHtmls = querySnapshot.docs.map(docSnapshot => {
            const symbol = docSnapshot.id;
            const data = docSnapshot.data();
            if (data.overview && data.overview.data) {
                return getOverviewCardHtml(data.overview.data, data.overview.cachedAt, symbol, data.isComprehensiveDataReady);
            }
            return '';
        });
        container.innerHTML = cardHtmls.join('');

    } catch (error) {
        console.error("Error loading cached stocks: ", error);
        displayMessageInModal(`Failed to load dashboard: ${error.message}`, 'error');
    }
}
function handleRefreshData(symbol) {
    openConfirmationModal(
        'Refresh All Data?',
        `This will permanently delete and refetch all data for ${symbol}. This may consume your API quota.`,
        async () => {
            openModal(CONSTANTS.MODAL_LOADING);
            const loadingMessageEl = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);
            try {
                loadingMessageEl.textContent = `Deleting old data for ${symbol}...`;
                await Promise.all([
                    deleteDoc(doc(db, CONSTANTS.DB_COLLECTION_CACHE, symbol)),
                    deleteDoc(doc(db, CONSTANTS.DB_COLLECTION_COMPREHENSIVE, symbol))
                ]);
                loadingMessageEl.textContent = `Relaunching research for ${symbol}...`;
                // Re-run the initial research logic
                await researchAndDisplayStock(symbol, true);
                displayMessageInModal(`Data for ${symbol} has been refreshed.`, 'info');
            } catch (error) {
                console.error("Error refreshing data:", error);
                displayMessageInModal(`Failed to refresh data: ${error.message}`, 'error');
            } finally {
                await loadAllCachedStocks();
                closeModal(CONSTANTS.MODAL_LOADING);
            }
        }
    );
}
async function fetchAndCacheComprehensiveData(symbol) {
    const comprehensiveData = {};
    const errors = {};
    const promises = COMPREHENSIVE_API_FUNCTIONS.map(func =>
        fetchAlphaVantageData(func, symbol)
            .then(data => ({ func, data, status: 'fulfilled' }))
            .catch(error => {
                console.error(`Failed to fetch ${func} for ${symbol}:`, error);
                return { func, error: error.message, status: 'rejected' };
            })
    );

    const results = await Promise.all(promises);
    let allSucceeded = true;
    results.forEach(result => {
        if (result.status === 'fulfilled') {
            comprehensiveData[result.func] = result.data;
        } else {
            errors[result.func] = result.error;
            allSucceeded = false;
        }
    });

    await setDoc(doc(db, CONSTANTS.DB_COLLECTION_COMPREHENSIVE, symbol), {
        data: comprehensiveData,
        errors: errors,
        cachedAt: Timestamp.now()
    }, { merge: true });

    if (allSucceeded) {
        await updateDoc(doc(db, CONSTANTS.DB_COLLECTION_CACHE, symbol), {
            isComprehensiveDataReady: true
        });
    }
}
async function researchAndDisplayStock(symbol, isRefresh = false) {
    const mainCacheRef = doc(db, CONSTANTS.DB_COLLECTION_CACHE, symbol);

    if (!isRefresh) {
        document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Checking for existing data for ${symbol}...`;
        const docSnap = await getDoc(mainCacheRef);
        if (docSnap.exists()) {
            displayMessageInModal(`${symbol} is already on your dashboard. Use 'Refresh Data' on its card for new data.`, 'info');
            return;
        }
    }

    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Fetching new overview data for ${symbol}...`;
    const overview = await fetchAlphaVantageData(CONSTANTS.API_FUNC_OVERVIEW, symbol);
    await setDoc(mainCacheRef, { 
        overview: { data: overview, cachedAt: Timestamp.now() },
        isComprehensiveDataReady: false
    });
    
    // Add card to UI immediately
    const cardHtml = getOverviewCardHtml(overview, Timestamp.now(), symbol, false);
    if (isRefresh) {
        const existingCard = document.getElementById(`card-${symbol}`);
        if(existingCard) existingCard.outerHTML = cardHtml;
        else document.getElementById(CONSTANTS.CONTAINER_DYNAMIC_CONTENT).insertAdjacentHTML('beforeend', cardHtml);
    } else {
         document.getElementById(CONSTANTS.CONTAINER_DYNAMIC_CONTENT).insertAdjacentHTML('beforeend', cardHtml);
    }

    // Set up a listener to update the card when comprehensive data is ready
    const unsubscribe = onSnapshot(mainCacheRef, (docSnap) => {
        const data = docSnap.data();
        if (data && data.isComprehensiveDataReady) {
            const card = document.getElementById(`card-${symbol}`);
            if (card) {
                card.querySelectorAll('.undervalued-analysis-button, .financial-analysis-button').forEach(button => {
                    button.disabled = false;
                    button.classList.remove('opacity-50', 'cursor-not-allowed');
                });
            }
            unsubscribe(); // Stop listening after the update
        }
    });

    // Asynchronously fetch comprehensive data
    fetchAndCacheComprehensiveData(symbol);
}

async function handleResearchSubmit(e) {
    e.preventDefault();
    const tickerInput = document.getElementById(CONSTANTS.INPUT_TICKER);
    const symbol = tickerInput.value.trim().toUpperCase();
    const tickerRegex = /^[A-Z.]{1,10}$/;
    if (!tickerRegex.test(symbol)) {
        displayMessageInModal("Please enter a valid stock ticker symbol.", "warning");
        return;
    }
    openModal(CONSTANTS.MODAL_LOADING);
    try {
        await researchAndDisplayStock(symbol);
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
    try {
        const overviewRef = doc(db, CONSTANTS.DB_COLLECTION_CACHE, symbol);
        const comprehensiveRef = doc(db, CONSTANTS.DB_COLLECTION_COMPREHENSIVE, symbol);
        const [overviewSnap, comprehensiveSnap] = await Promise.all([getDoc(overviewRef), getDoc(comprehensiveRef)]);
        
        if(!comprehensiveSnap.exists()){
            throw new Error("Comprehensive data has not been cached yet.");
        }

        const combinedData = {
            OVERVIEW: overviewSnap.data().overview.data,
            ...comprehensiveSnap.data().data
        };
        const fullDataRecord = comprehensiveSnap.data();

        document.getElementById('full-data-modal-title').textContent = `Full Cached Data for ${symbol}`;
        document.getElementById('full-data-modal-timestamp').textContent = `Data Stored On: ${fullDataRecord.cachedAt.toDate().toLocaleString()}`;
        
        let content = JSON.stringify(combinedData, null, 2);
        if (fullDataRecord.errors && Object.keys(fullDataRecord.errors).length > 0) {
            content = `ERRORS:\n${JSON.stringify(fullDataRecord.errors, null, 2)}\n\nAVAILABLE DATA:\n${content}`;
        }
        document.getElementById(CONSTANTS.ELEMENT_FULL_DATA_CONTENT).textContent = content;
        openModal(CONSTANTS.MODAL_FULL_DATA);
        
    } catch (error) {
        console.error("Failed to load full data:", error);
        displayMessageInModal(`Error loading data: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

function getOverviewCardHtml(overviewData, cacheTimestamp, symbol, isComprehensiveDataReady = false) {
    if (!overviewData || !overviewData.Symbol) { return ''; }
    
    const marketCap = formatLargeNumber(overviewData.MarketCapitalization);
    const peRatio = overviewData.PERatio !== "None" ? overviewData.PERatio : "N/A";
    const eps = overviewData.EPS !== "None" ? overviewData.EPS : "N/A";
    const weekHigh = overviewData['52WeekHigh'] && overviewData['52WeekHigh'] !== "None" ? `$${overviewData['52WeekHigh']}` : "N/A";
    const timestampString = cacheTimestamp ? `Data Stored On: ${cacheTimestamp.toDate().toLocaleString()}` : '';
    const analysisButtonsState = isComprehensiveDataReady ? '' : 'disabled';
    const analysisButtonsClasses = isComprehensiveDataReady ? '' : 'opacity-50 cursor-not-allowed';
    
    return `<div class="bg-white rounded-2xl shadow-lg border border-gray-200 p-6" id="card-${symbol}">
            <div class="flex justify-between items-start gap-4">
                <div>
                    <h2 class="text-2xl font-bold text-gray-800">${sanitizeText(overviewData.Name)} (${sanitizeText(overviewData.Symbol)})</h2>
                    <p class="text-gray-500">${sanitizeText(overviewData.Exchange)} | ${sanitizeText(overviewData.Sector)}</p>
                </div>
                <div class="flex-shrink-0">
                    <button data-symbol="${symbol}" class="refresh-data-button text-xs bg-red-100 text-red-700 hover:bg-red-200 font-semibold py-1 px-3 rounded-full">Refresh Data</button>
                </div>
            </div>
            <p class="mt-4 text-sm text-gray-600 line-clamp-3">${sanitizeText(overviewData.Description)}</p>
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
        </div>`;
}

// --- EVENT LISTENER SETUP ---
function setupEventListeners() {
    document.getElementById(CONSTANTS.FORM_API_KEY)?.addEventListener('submit', handleApiKeySubmit);
    document.getElementById(CONSTANTS.FORM_STOCK_RESEARCH)?.addEventListener('submit', handleResearchSubmit);
    
    const scrollTopBtn = document.getElementById(CONSTANTS.BUTTON_SCROLL_TOP);
    if (scrollTopBtn) scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    
    window.addEventListener('scroll', () => {
        const scrollTopButton = document.getElementById(CONSTANTS.BUTTON_SCROLL_TOP);
        if (scrollTopButton) { scrollTopButton.classList.toggle(CONSTANTS.CLASS_HIDDEN, window.scrollY <= 300); }
    });

    // Delegated event listener for dynamic content
    document.body.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        const symbol = button?.dataset.symbol;
        if (symbol) {
            if (button.classList.contains('refresh-data-button')) handleRefreshData(symbol);
            if (button.classList.contains('view-json-button')) handleViewFullData(symbol);
            if (button.classList.contains('financial-analysis-button')) handleFinancialAnalysis(symbol);
            if (button.classList.contains('undervalued-analysis-button')) handleUndervaluedAnalysis(symbol);
        }

        // Generic modal close handler
        if(e.target.closest('.modal-close-trigger')) {
            const modal = e.target.closest('.modal');
            if(modal) closeModal(modal.id);
        }
    });
}

// --- AI ANALYSIS HANDLERS ---
async function getComprehensiveData(symbol) {
    const comprehensiveRef = doc(db, CONSTANTS.DB_COLLECTION_COMPREHENSIVE, symbol);
    const overviewRef = doc(db, CONSTANTS.DB_COLLECTION_CACHE, symbol);
    const [comprehensiveSnap, overviewSnap] = await Promise.all([getDoc(comprehensiveRef), getDoc(overviewRef)]);
    
    if (!comprehensiveSnap.exists() || !overviewSnap.exists()) {
        displayMessageInModal(`Comprehensive data for ${symbol} has not been stored yet. Please try again in a moment.`, 'info');
        return null;
    }

    const comprehensiveData = comprehensiveSnap.data();
    if (comprehensiveData.errors && Object.keys(comprehensiveData.errors).length > 0) {
        displayMessageInModal(`Could not perform analysis due to missing data: ${Object.keys(comprehensiveData.errors).join(', ')}. Please try refreshing the data for this stock.`, 'error');
        return null;
    }
    return { ...comprehensiveData.data, OVERVIEW: overviewSnap.data().overview.data };
}

async function performIterativeAnalysis(symbol, draftPrompt, analysisType, modalId, contentElId, titleElId) {
    const loadingMessageEl = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);
    openModal(CONSTANTS.MODAL_LOADING);

    try {
        // Step 0: Get Data
        loadingMessageEl.textContent = `Gathering financial data for ${symbol}...`;
        const data = await getComprehensiveData(symbol);
        if (!data) return;

        // Step 1: Draft Analysis
        loadingMessageEl.textContent = `Step 1/3: Drafting initial analysis for ${symbol}...`;
        const draftReport = await callGeminiApi(draftPrompt, { 'full JSON data': data });
        
        // Step 2: Fetch News
        loadingMessageEl.textContent = `Step 2/3: Searching for recent news about ${symbol}...`;
        const articles = await fetchNewsArticles(symbol, analysisType);

        // Step 3: Revise Analysis
        loadingMessageEl.textContent = `Step 3/3: Revising analysis with new data...`;
        const finalReport = await callGeminiApi(revisionPromptTemplate, {
            'original draft': draftReport,
            'news articles': articles,
        });

        // Render final report securely
        const contentEl = document.getElementById(contentElId);
        document.getElementById(titleElId).textContent = `Analysis for ${symbol}`;
        contentEl.innerHTML = DOMPurify.sanitize(marked.parse(finalReport));
        openModal(modalId);

    } catch (error) {
        console.error(`Error generating ${analysisType} analysis:`, error);
        displayMessageInModal(`Could not generate AI analysis: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}


async function handleFinancialAnalysis(symbol) {
    await performIterativeAnalysis(
        symbol,
        financialDraftPrompt,
        'financial',
        CONSTANTS.MODAL_FINANCIAL_ANALYSIS,
        CONSTANTS.ELEMENT_FINANCIAL_ANALYSIS_CONTENT,
        'financial-analysis-modal-title'
    );
}

async function handleUndervaluedAnalysis(symbol) {
     await performIterativeAnalysis(
        symbol,
        undervaluedDraftPrompt,
        'value',
        CONSTANTS.MODAL_UNDERVALUED_ANALYSIS,
        CONSTANTS.ELEMENT_UNDERVALUED_ANALYSIS_CONTENT,
        'undervalued-analysis-modal-title'
    );
}

// --- APP INITIALIZATION TRIGGER ---
function initializeApplication() {
    setupEventListeners();
    const versionDisplay = document.getElementById('app-version-display');
    if (versionDisplay) { versionDisplay.textContent = `v${APP_VERSION}`; }
    openModal(CONSTANTS.MODAL_API_KEY);
}

document.addEventListener('DOMContentLoaded', initializeApplication);
