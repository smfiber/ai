import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, Timestamp, doc, setDoc, getDoc, deleteDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- App Version ---
const APP_VERSION = "5.0.1"; 

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

const COMPREHENSIVE_API_FUNCTIONS = ['INCOME_STATEMENT', 'BALANCE_SHEET', 'CASH_FLOW', 'EARNINGS'];

// --- Global State ---
let db;
let auth;
let userId;
let firebaseConfig = null;
let appIsInitialized = false;
let alphaVantageApiKey = "";
let geminiApiKey = "";

// --- AI PROMPTS ---
const financialAnalysisPromptTemplate = `Role: You are an expert financial analyst AI. Your goal is to provide a clear, concise, and insightful analysis of a company's financial health based on the provided JSON data. The output should be easy to understand for a general audience using a mobile app. Use emojis to make the information more engaging.
Analyze the following financial data for [Company Name] (Ticker: [Ticker Symbol]):
JSON
[Paste the full JSON data here]
Based on the data, generate the following analysis in markdown format:
Overview 📈
Provide a brief, high-level summary (2-3 sentences) of the company's overall financial performance and health. Mention its general trajectory (e.g., growth, stability, or decline).
Key Financial Highlights 📊
Extract and present the following key metrics for the most recent fiscal year ([Year]). Use bullet points and relevant emojis:
	• Total Revenue: $XXX.XX Billion
	• Net Income: $XX.XX Billion
	• Net Profit Margin: XX.X%
	• Earnings Per Share (EPS): $X.XX
	• Operating Cash Flow: $XXX.XX Billion
Financial Deep Dive 🕵️
Profitability Analysis 💰
Analyze the company's ability to generate profit. Focus on:
	• Revenue and Net Income Trends: Describe the growth or decline over the last 3-5 years.
	• Profit Margins: Comment on the Gross, Operating, and Net Profit Margins. Are they stable, improving, or declining?

Financial Health & Stability 💪
Assess the company's financial stability and risk. Focus on:
	• Liquidity: Calculate and interpret the Current Ratio for the most recent fiscal year. Explain what this means for the company's ability to cover its short-term debts.
	• Debt Levels: Analyze the Debt-to-Equity Ratio. Is the company heavily reliant on debt? How has this changed over the last few years?

Final Verdict 📝
Provide a concluding paragraph summarizing the key strengths and potential weaknesses based on this financial data. Is the company in a strong financial position? What are the key takeaways for a potential investor?`;

const undervaluedAnalysisPromptTemplate = `Role: You are an expert investment analyst and stockbroker. Your task is to synthesize the provided JSON data to determine if a stock is truly undervalued. Your analysis must be clear, insightful, and accessible to a non-expert investor using a mobile app. The output must be in markdown format, using emojis to enhance readability.
Analyze the following financial data for [Company Name] (Ticker: [Ticker Symbol]):
JSON
[Paste the full JSON data here]
Based on the data, generate the following valuation analysis:
Valuation Verdict ⚖️
Start with a direct, 2-3 sentence conclusion. Is this stock a potential bargain, fairly priced, or a value trap? Briefly state the main reasons based on your synthesis of its fundamentals and market sentiment.
---
1. Fundamental Analysis: Is the Company a Good Value? 💰
Assess the company's financial health and profitability to determine its intrinsic worth.
* **Key Valuation Ratios**:
    * **P/E Ratios (PERatio, TrailingPE, ForwardPE)**: Interpret these ratios. Is the company trading at a discount compared to what's typical for its industry? Is its future P/E looking better or worse?
    * **Price-to-Book (PriceToBookRatio)**: Analyze the P/B ratio. Note if it is below 1.0, explaining why this is a classic sign of potential undervaluation.
    * **PEG Ratio (PEGRatio)**: Explain how the PEG ratio provides context to the P/E by factoring in growth. A value below 1 is a strong positive signal.
* **Deeper Financial Health**:
    * **Debt-to-Equity**: Calculate this using the most recent \`totalLiabilities\` and \`totalShareholderEquity\` from the \`BALANCE_SHEET\`. Is the company's debt level a risk?
    * **Return on Equity (ReturnOnEquityTTM)**: Interpret the ROE. Does it indicate a high-quality, efficient business?
* **Analyst Consensus**:
    * **Target Price (AnalystTargetPrice)**: State the consensus target. How significant is the potential upside from the price suggested by the 50 and 200-day moving averages?
---
2. Technical Analysis: What is the Market Sentiment? 📉📈
Analyze price data to gauge whether the market is overly pessimistic, creating a buying opportunity.
* **Price Context (52WeekHigh, 52WeekLow)**: Where is the stock trading within its 52-week range? A price near the low can signal a potential entry point if fundamentals are strong.
* **Trend Identification (50DayMovingAverage, 200DayMovingAverage)**: Is the stock in a downtrend (trading below its moving averages)? A technically weak price for a fundamentally strong company is the classic setup for a value investment.
---
The Broker's Synthesis & Recommendation 📝
Combine the fundamental and technical insights into a final, actionable conclusion.
* **The Big Picture**: Is this a fundamentally strong company that is simply unloved by the market right now? Or do the technical weaknesses reflect deeper, unstated fundamental problems?
* **Final Word**: Based on the complete picture, does this stock represent a compelling investment opportunity for a value-oriented investor?`;


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
    const tempFirebaseConfigText = document.getElementById('firebaseConfigInput').value.trim();
    let tempFirebaseConfig;

    if (!tempFirebaseConfigText || !tempAlphaVantageKey || !tempGeminiKey) {
        displayMessageInModal("All API keys (Gemini, Alpha Vantage) and the Firebase Config are required.", "warning");
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
async function callGeminiApi(promptTemplate, jsonData) {
    if (!geminiApiKey) throw new Error("Gemini API Key is not configured.");
    const companyName = jsonData.OVERVIEW?.Name || 'the company';
    const tickerSymbol = jsonData.OVERVIEW?.Symbol || 'N/A';
    let fullPrompt = promptTemplate.replace(/\[Company Name\]/g, companyName);
    fullPrompt = fullPrompt.replace(/\[Ticker Symbol\]/g, tickerSymbol);
    fullPrompt = fullPrompt.replace('[Paste the full JSON data here]', JSON.stringify(jsonData, null, 2));
    
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
        `This will permanently delete and refetch all data for ${symbol}. This may consume your API quota.`,
        async () => {
            openModal(CONSTANTS.MODAL_LOADING);
            const loadingMessageEl = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);
            try {
                loadingMessageEl.textContent = `Deleting old data for ${symbol}...`;
                await Promise.all([
                    deleteDoc(doc(db, 'cached_stock_data', symbol)),
                    deleteDoc(doc(db, 'comprehensive_stock_data', symbol))
                ]);
                loadingMessageEl.textContent = `Fetching fresh data for ${symbol}...`;
                const overview = await fetchAlphaVantageData(CONSTANTS.API_FUNC_OVERVIEW, symbol);
                await setDoc(doc(db, 'cached_stock_data', symbol), { overview: { data: overview, cachedAt: Timestamp.now() } });
                fetchAndCacheComprehensiveData(symbol);
                loadingMessageEl.textContent = `Refreshing dashboard...`;
                await loadAllCachedStocks();
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
    const comprehensiveData = {};
    const errors = {};
    const promises = COMPREHENSIVE_API_FUNCTIONS.map(async (func) => {
        try {
            const data = await fetchAlphaVantageData(func, symbol);
            return { func, data, status: 'fulfilled' };
        } catch (error) {
            console.error(`Failed to fetch ${func} for ${symbol}:`, error);
            return { func, error: error.message, status: 'rejected' };
        }
    });
    const results = await Promise.allSettled(promises);
    results.forEach(result => {
        if (result.status === 'fulfilled') {
            const resValue = result.value;
            if (resValue.status === 'fulfilled') {
                comprehensiveData[resValue.func] = resValue.data;
            } else {
                errors[resValue.func] = resValue.error;
            }
        }
    });
    try {
        await setDoc(doc(db, 'comprehensive_stock_data', symbol), {
            data: comprehensiveData,
            errors: errors,
            cachedAt: Timestamp.now()
        }, { merge: true });
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
        displayMessageInModal("Please enter a valid stock ticker symbol.", "warning");
        return;
    }
    openModal(CONSTANTS.MODAL_LOADING);
    try {
        document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Checking for existing data for ${symbol}...`;
        const mainCacheRef = doc(db, 'cached_stock_data', symbol);
        if ((await getDoc(mainCacheRef)).exists()) {
            displayMessageInModal(`${symbol} is already on your dashboard. Use 'Refresh Data' on its card for new data.`, 'info');
            tickerInput.value = '';
            return;
        }
        document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Fetching new data for ${symbol}...`;
        const overview = await fetchAlphaVantageData(CONSTANTS.API_FUNC_OVERVIEW, symbol);
        await setDoc(mainCacheRef, { overview: { data: overview, cachedAt: Timestamp.now() } });
        fetchAndCacheComprehensiveData(symbol);
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
            const combinedData = { OVERVIEW: overviewData, ...fullData.data };
            document.getElementById('full-data-modal-title').textContent = `Full Cached Data for ${symbol}`;
            document.getElementById('full-data-modal-timestamp').textContent = `Data Stored On: ${fullData.cachedAt.toDate().toLocaleString()}`;
            if (fullData.errors && Object.keys(fullData.errors).length > 0) {
                document.getElementById(CONSTANTS.ELEMENT_FULL_DATA_CONTENT).textContent = `Errors occurred:\n\n${JSON.stringify(fullData.errors, null, 2)}\n\nAvailable data:\n\n${JSON.stringify(combinedData, null, 2)}`;
            } else {
                document.getElementById(CONSTANTS.ELEMENT_FULL_DATA_CONTENT).textContent = JSON.stringify(combinedData, null, 2);
            }
            openModal(CONSTANTS.MODAL_FULL_DATA);
        } else {
            displayMessageInModal(`Comprehensive data for ${symbol} has not been stored yet. Please try again in a moment.`, 'info');
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
    if (!overviewData || !overviewData.Symbol) { return; }
    if (container.innerHTML.includes('No stocks researched yet')) { container.innerHTML = ''; }
    const marketCap = formatLargeNumber(overviewData.MarketCapitalization);
    const peRatio = overviewData.PERatio !== "None" ? overviewData.PERatio : "N/A";
    const eps = overviewData.EPS !== "None" ? overviewData.EPS : "N/A";
    const weekHigh = overviewData['52WeekHigh'] && overviewData['52WeekHigh'] !== "None" ? `$${overviewData['52WeekHigh']}` : "N/A";
    const timestampString = cacheTimestamp ? `Data Stored On: ${cacheTimestamp.toDate().toLocaleString()}` : '';
    const analysisButtonsState = isComprehensiveDataReady ? '' : 'disabled';
    const analysisButtonsClasses = isComprehensiveDataReady ? '' : 'opacity-50 cursor-not-allowed';
    const cardHtml = `<div class="bg-white rounded-2xl shadow-lg border border-gray-200 p-6" id="card-${symbol}">
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
    });
}
function setupEventListeners() {
    document.getElementById(CONSTANTS.FORM_API_KEY)?.addEventListener('submit', handleApiKeySubmit);
    document.getElementById(CONSTANTS.FORM_STOCK_RESEARCH)?.addEventListener('submit', handleResearchSubmit);
    const scrollTopBtn = document.getElementById(CONSTANTS.BUTTON_SCROLL_TOP);
    if (scrollTopBtn) scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    document.getElementById('close-full-data-modal')?.addEventListener('click', () => closeModal(CONSTANTS.MODAL_FULL_DATA));
    document.getElementById('close-full-data-modal-bg')?.addEventListener('click', () => closeModal(CONSTANTS.MODAL_FULL_DATA));
    document.getElementById('close-financial-analysis-modal')?.addEventListener('click', () => closeModal(CONSTANTS.MODAL_FINANCIAL_ANALYSIS));
    document.getElementById('close-financial-analysis-modal-bg')?.addEventListener('click', () => closeModal(CONSTANTS.MODAL_FINANCIAL_ANALYSIS));
    document.getElementById('close-undervalued-analysis-modal')?.addEventListener('click', () => closeModal(CONSTANTS.MODAL_UNDERVALUED_ANALYSIS));
    document.getElementById('close-undervalued-analysis-modal-bg')?.addEventListener('click', () => closeModal(CONSTANTS.MODAL_UNDERVALUED_ANALYSIS));
    window.addEventListener('scroll', () => {
        const scrollTopButton = document.getElementById(CONSTANTS.BUTTON_SCROLL_TOP);
        if (scrollTopButton) { scrollTopButton.classList.toggle(CONSTANTS.CLASS_HIDDEN, window.scrollY <= 300); }
    });
    setupGlobalEventListeners();
}

// --- AI ANALYSIS HANDLERS ---
async function getComprehensiveData(symbol) {
    const docRef = doc(db, 'comprehensive_stock_data', symbol);
    const overviewRef = doc(db, 'cached_stock_data', symbol);
    const [docSnap, overviewSnap] = await Promise.all([getDoc(docRef), getDoc(overviewRef)]);
    if (!docSnap.exists() || !overviewSnap.exists()) {
        displayMessageInModal(`Comprehensive data for ${symbol} has not been stored yet. Please try again in a moment.`, 'info');
        return null;
    }
    return { ...docSnap.data().data, OVERVIEW: overviewSnap.data().overview.data };
}
async function handleFinancialAnalysis(symbol) {
    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Asking AI to analyze ${symbol}...`;
    try {
        const data = await getComprehensiveData(symbol);
        if (!data) return;
        const reportMarkdown = await callGeminiApi(financialAnalysisPromptTemplate, data);
        const contentEl = document.getElementById(CONSTANTS.ELEMENT_FINANCIAL_ANALYSIS_CONTENT);
        document.getElementById('financial-analysis-modal-title').textContent = `Financial Analysis for ${symbol}`;
        contentEl.innerHTML = marked.parse(reportMarkdown);
        openModal(CONSTANTS.MODAL_FINANCIAL_ANALYSIS);
    } catch (error) {
        console.error("Error generating financial analysis:", error);
        displayMessageInModal(`Could not generate AI analysis: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}
async function handleUndervaluedAnalysis(symbol) {
    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Asking AI for valuation of ${symbol}...`;
    try {
        const data = await getComprehensiveData(symbol);
        if (!data) return;
        const reportMarkdown = await callGeminiApi(undervaluedAnalysisPromptTemplate, data);
        const contentEl = document.getElementById(CONSTANTS.ELEMENT_UNDERVALUED_ANALYSIS_CONTENT);
        document.getElementById('undervalued-analysis-modal-title').textContent = `Undervalued Analysis for ${symbol}`;
        contentEl.innerHTML = marked.parse(reportMarkdown);
        openModal(CONSTANTS.MODAL_UNDERVALUED_ANALYSIS);
    } catch (error) {
        console.error("Error generating undervalued analysis:", error);
        displayMessageInModal(`Could not generate AI analysis: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

// --- APP INITIALIZATION TRIGGER ---
function initializeApplication() {
    setupEventListeners();
    const versionDisplay = document.getElementById('app-version-display');
    if (versionDisplay) { versionDisplay.textContent = `v${APP_VERSION}`; }
    openModal(CONSTANTS.MODAL_API_KEY);
}

document.addEventListener('DOMContentLoaded', initializeApplication);
