import { initializeApp } from "[https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js](https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js)";
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from "[https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js](https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js)";
import { getFirestore, Timestamp, doc, setDoc, getDoc, deleteDoc, collection, getDocs } from "[https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js](https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js)";

// --- App Version ---
const APP_VERSION = "6.1.0"; 

// --- Constants ---
const CONSTANTS = {
    // Modals
    MODAL_API_KEY: 'apiKeyModal',
    MODAL_LOADING: 'loadingStateModal',
    MODAL_MESSAGE: 'messageModal',
    MODAL_CONFIRMATION: 'confirmationModal',
    MODAL_FULL_DATA: 'fullDataModal',
    MODAL_FINANCIAL_ANALYSIS: 'financialAnalysisModal',
    MODAL_UNDERVALUED_ANALYSIS: 'undervaluedAnalysisModal',
    MODAL_PORTFOLIO: 'portfolioModal',
    MODAL_MANAGE_STOCK: 'manageStockModal',
    // Forms & Inputs
    FORM_API_KEY: 'apiKeyForm',
    FORM_STOCK_RESEARCH: 'stock-research-form',
    INPUT_TICKER: 'ticker-input',
    INPUT_ALPHA_VANTAGE_KEY: 'alphaVantageApiKeyInput',
    INPUT_GEMINI_KEY: 'geminiApiKeyInput',
    INPUT_GOOGLE_CLIENT_ID: 'googleClientIdInput',
    INPUT_WEB_SEARCH_KEY: 'webSearchApiKeyInput',
    INPUT_SEARCH_ENGINE_ID: 'searchEngineIdInput',
    // Containers & Elements
    CONTAINER_DYNAMIC_CONTENT: 'dynamic-content-container',
    CONTAINER_PORTFOLIO_LIST: 'portfolio-list-container',
    ELEMENT_LOADING_MESSAGE: 'loading-message',
    ELEMENT_FULL_DATA_CONTENT: 'full-data-content',
    ELEMENT_FINANCIAL_ANALYSIS_CONTENT: 'financial-analysis-content',
    ELEMENT_UNDERVALUED_ANALYSIS_CONTENT: 'undervalued-analysis-content',
    // Buttons
    BUTTON_SCROLL_TOP: 'scroll-to-top-button',
    BUTTON_VIEW_STOCKS: 'view-stocks-button',
    BUTTON_ADD_NEW_STOCK: 'add-new-stock-button',
    // Classes
    CLASS_MODAL_OPEN: 'is-open',
    CLASS_BODY_MODAL_OPEN: 'modal-open',
    CLASS_HIDDEN: 'hidden',
    // Database Collections
    DB_COLLECTION_CACHE: 'cached_stock_data',
    DB_COLLECTION_PORTFOLIO: 'portfolio_stocks',
};

// List of comprehensive data endpoints to fetch for caching
const API_FUNCTIONS = ['OVERVIEW', 'INCOME_STATEMENT', 'BALANCE_SHEET', 'CASH_FLOW', 'EARNINGS'];

const FINANCIAL_ANALYSIS_PROMPT = `
Role: You are a senior investment analyst AI. Your purpose is to generate a rigorous, data-driven financial statement analysis for a sophisticated audience (e.g., portfolio managers, institutional investors). Your analysis must be objective, precise, and derived exclusively from the provided JSON data. All calculations and interpretations must be clearly explained.
Output Format: The final report must be in professional markdown format. Use # for the main title, ## for major sections, ### for sub-sections, and bullet points for key data and lists. Present financial figures clearly, using 'Billion' or 'Million' where appropriate for readability.
IMPORTANT: Do not include any HTML tags in your output. Generate pure markdown only.

Analyze the comprehensive financial data for {companyName} (Ticker: {tickerSymbol}) provided below. If a specific data point is "N/A" or missing, state that clearly in your analysis.

JSON Data:
{jsonData}

Based on the provided data, generate the following multi-faceted financial report:

# Comprehensive Financial Analysis: {companyName} ({tickerSymbol})

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

const UNDERVALUED_ANALYSIS_PROMPT = `
Role: You are a Chartered Financial Analyst (CFA) level AI. Your objective is to conduct a meticulous stock valuation analysis for an informed investor. You must synthesize fundamental data, technical indicators, and profitability metrics to determine if a stock is potentially trading below its intrinsic value. Your reasoning must be transparent, data-driven, and based exclusively on the provided JSON.
Output Format: The final report must be delivered in a professional markdown report. Use # for the main title, ## for major sections, ### for sub-sections, and bullet points for key data points. Direct and professional language is required.
IMPORTANT: Do not include any HTML tags in your output. Generate pure markdown only.

Conduct a comprehensive valuation analysis for {companyName} (Ticker: {tickerSymbol}) using the financial data provided below. If a specific data point is "N/A" or missing, state that clearly in your analysis.

JSON Data:
{jsonData}

Based on the data, generate the following in-depth report:
# Investment Valuation Report: {companyName} ({tickerSymbol})

## 1. Executive Verdict
Provide a concise, top-line conclusion (3-4 sentences) that immediately answers the core question: Based on a synthesis of all available data, does the stock appear Undervalued, Fairly Valued, or Overvalued? Briefly state the primary factors (e.g., strong cash flow, low multiples, technical trends) that support this initial verdict.

## 2. Fundamental Valuation Deep Dive
Evaluate the company’s intrinsic value through a rigorous examination of its financial health and market multiples.
### 2.1. Relative Valuation Multiples
- **Price-to-Earnings (P/E) Ratio:** [Value from OVERVIEW.PERatio]. Interpret this by comparing the TrailingPE to the ForwardPE. Does the difference suggest anticipated earnings growth or decline?
- **Price-to-Book (P/B) Ratio:** [Value from OVERVIEW.PriceToBookRatio]. Explain what this ratio indicates about how the market values the company's net assets. A value under 1.0 is particularly noteworthy.
- **Price-to-Sales (P/S) Ratio:** [Value from OVERVIEW.PriceToSalesRatioTTM]. Analyze this in the context of profitability. Is a low P/S ratio a sign of undervaluation or indicative of low-profit margins?
- **Enterprise Value-to-EBITDA (EV/EBITDA):** [Value from OVERVIEW.EVToEBITDA]. Explain this ratio's significance as a capital structure-neutral valuation metric.
### 2.2. Growth and Profitability-Adjusted Value
- **PEG Ratio:** [Value from OVERVIEW.PEGRatio]. Interpret this critical figure. A PEG ratio under 1.0 often suggests a stock may be undervalued relative to its expected earnings growth.
- **Return on Equity (ROE):** [Value from OVERVIEW.ReturnOnEquityTTM]%. Analyze this as a measure of core profitability and management's effectiveness at generating profits from shareholder capital.
### 2.3. Dividend Analysis
- **Dividend Yield:** [Value from OVERVIEW.DividendYield]%.
- **Sustainability Check:** Calculate the Cash Flow Payout Ratio by dividing dividendPayout (from the most recent annual CASH_FLOW report) by operatingCashflow. A low ratio (<60%) suggests the dividend is well-covered and sustainable.
### 2.4. Wall Street Consensus
- **Analyst Target Price:** $[Value from OVERVIEW.AnalystTargetPrice]. Compare this target to the stock's recent price movement as indicated by its moving averages and 52-week range.

## 3. Technical Analysis & Market Dynamics
Assess the stock's current price action and market sentiment to determine if the timing is opportune.
### 3.1. Trend Analysis
- **50-Day MA:** $[Value from OVERVIEW.50DayMovingAverage]
- **200-Day MA:** $[Value from OVERVIEW.200DayMovingAverage]
- **Interpretation:** Analyze the stock's current trend. Is it in a bullish trend (trading above both MAs), a bearish trend (below both), or at an inflection point? How do these averages contain the price?
### 3.2. Momentum and Volatility
- **52-Week Range:** The stock has traded between $[Value from OVERVIEW.52WeekLow] and $[Value from OVERVIEW.52WeekHigh]. Where is the price currently situated within this range based on its moving averages? A price near the low may suggest value, while a price near the high suggests strong momentum.
- **Market Volatility (Beta):** [Value from OVERVIEW.Beta]. Interpret the Beta. Does the stock tend to be more or less volatile than the overall market?

## 4. Synthesized Conclusion: Framing the Opportunity
Combine the fundamental and technical findings into a final, actionable synthesis.
- **Fundamental Case:** Summarize the evidence. Do the valuation multiples, profitability, and growth metrics collectively suggest the stock is fundamentally cheap, expensive, or fairly priced?
- **Technical Case:** Summarize the market sentiment. Is the current price trend and momentum working for or against a potential investment right now?
- **Final Verdict & Investment Profile:** State a clear, final conclusion on whether the stock appears to be a compelling value opportunity. Characterize the potential investment by its profile. For example: "The stock appears fundamentally undervalued due to its low P/E and PEG ratios, supported by a sustainable dividend. However, technicals are currently bearish as the price is below its key moving averages, suggesting a patient approach may be warranted."

**Disclaimer:** This AI-generated analysis is for informational and educational purposes only. It is not financial advice. Data may not be real-time.
`;

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
let googleClientId = ""; // New for Drive API
let googleAccessToken = null; // New for Drive API
let gapiInitialized = false; // New for Drive API
let driveFolderId = null; // Cache for Drive folder
let portfolioCache = [];

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
    openModal(modalId);
}

// --- CONFIG & INITIALIZATION ---

function safeParseConfig(str) {
    try {
        const startIndex = str.indexOf('{');
        if (startIndex === -1) throw new Error("Could not find a '{' in the config string.");
        const objectStr = str.substring(startIndex);
        return JSON.parse(objectStr);
    } catch (error) {
        console.error("Failed to parse config string:", error);
        throw new Error("The provided Firebase config is not valid. Please paste the complete, valid JSON object from the Firebase console.");
    }
}

async function initializeAppContent() {
    if (appIsInitialized) return;
    appIsInitialized = true;
    document.getElementById('main-view').classList.remove(CONSTANTS.CLASS_HIDDEN);
    document.getElementById('stock-screener-section').classList.remove(CONSTANTS.CLASS_HIDDEN);
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
    alphaVantageApiKey = document.getElementById(CONSTANTS.INPUT_ALPHA_VANTAGE_KEY).value.trim();
    geminiApiKey = document.getElementById(CONSTANTS.INPUT_GEMINI_KEY).value.trim();
    googleClientId = document.getElementById(CONSTANTS.INPUT_GOOGLE_CLIENT_ID).value.trim();
    searchApiKey = document.getElementById(CONSTANTS.INPUT_WEB_SEARCH_KEY).value.trim();
    searchEngineId = document.getElementById(CONSTANTS.INPUT_SEARCH_ENGINE_ID).value.trim();
    const tempFirebaseConfigText = document.getElementById('firebaseConfigInput').value.trim();
    let tempFirebaseConfig;

    if (!alphaVantageApiKey || !geminiApiKey || !googleClientId || !searchApiKey || !searchEngineId || !tempFirebaseConfigText) {
        displayMessageInModal("All API Keys, Client ID, and the Firebase Config are required.", "warning");
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
    
    firebaseConfig = tempFirebaseConfig;
    
    initializeFirebase();
    closeModal(CONSTANTS.MODAL_API_KEY);
}

// --- AUTHENTICATION & GAPI INITIALIZATION ---

async function handleLogin() {
    if (!auth) {
        displayMessageInModal("Authentication service is not ready. Please submit your API keys first.", "warning");
        return;
    }
    const provider = new GoogleAuthProvider();
    // Request scope for Google Drive file creation
    provider.addScope('[https://www.googleapis.com/auth/drive.file](https://www.googleapis.com/auth/drive.file)');
    
    try {
        const result = await signInWithPopup(auth, provider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        googleAccessToken = credential.accessToken;
        
        // Initialize the Google API client after getting the token
        await initializeGapiClient();

    } catch (error) {
        console.error("Google Sign-In or GAPI initialization failed:", error);
        googleAccessToken = null;
        displayMessageInModal(`Login failed: ${error.code}. Check for popup blockers or console errors.`, 'error');
    }
}

// GEMINI: START EDIT
async function initializeGapiClient() {
    return new Promise((resolve, reject) => {
        gapi.load('client', async () => {
            try {
                await gapi.client.init({
                    apiKey: searchApiKey, // Using Web Search key for GAPI, as it's a general Google Cloud key.
                    clientId: googleClientId,
                    discoveryDocs: ["[https://www.googleapis.com/discovery/v1/apis/drive/v3/rest](https://www.googleapis.com/discovery/v1/apis/drive/v3/rest)"],
                });
                gapi.client.setToken({ access_token: googleAccessToken });
                gapiInitialized = true;
                resolve();
            } catch (error) {
                console.error("Error initializing GAPI client:", error);
                reject(error);
            }
        });
    });
}
// GEMINI: END EDIT

function handleLogout() {
    if (auth) signOut(auth).catch(error => console.error("Sign out failed:", error));
}

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
    if (!geminiApiKey) throw new Error("Gemini API key is not configured.");
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;
    const body = { contents: [{ parts: [{ "text": prompt }] }] };
    const data = await callApi(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text;
    }
    console.error("Unexpected Gemini API response structure:", data);
    throw new Error("Failed to parse the response from the Gemini API.");
}

// --- PORTFOLIO MANAGEMENT (v6.0.0) ---

async function renderPortfolioView() {
    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = "Loading portfolio...";
    
    try {
        const querySnapshot = await getDocs(collection(db, CONSTANTS.DB_COLLECTION_PORTFOLIO));
        portfolioCache = querySnapshot.docs.map(doc => doc.data());
        portfolioCache.sort((a, b) => a.companyName.localeCompare(b.companyName));

        const container = document.getElementById(CONSTANTS.CONTAINER_PORTFOLIO_LIST);
        if (portfolioCache.length === 0) {
            container.innerHTML = `<p class="p-8 text-center text-gray-500">Your portfolio is empty. Add a stock to get started.</p>`;
            closeModal(CONSTANTS.MODAL_LOADING);
            return;
        }

        displayFilteredPortfolio(); // Initial display
        
    } catch (error) {
        console.error("Error loading portfolio:", error);
        displayMessageInModal(`Failed to load portfolio: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

// GEMINI: START EDIT
function displayFilteredPortfolio(filter = '') {
    const container = document.getElementById(CONSTANTS.CONTAINER_PORTFOLIO_LIST);
    const lowercasedFilter = filter.toLowerCase();

    const filteredPortfolio = portfolioCache.filter(stock => 
        stock.companyName.toLowerCase().includes(lowercasedFilter) || 
        stock.ticker.toLowerCase().includes(lowercasedFilter)
    );

    if (filteredPortfolio.length === 0) {
        container.innerHTML = `<p class="p-8 text-center text-gray-500">No stocks match your search.</p>`;
        return;
    }

    const groupedBySector = filteredPortfolio.reduce((acc, stock) => {
        const sector = stock.sector || 'Uncategorized';
        if (!acc[sector]) acc[sector] = [];
        acc[sector].push(stock);
        return acc;
    }, {});

    const sortedSectors = Object.keys(groupedBySector).sort();
    
    let html = '';
    for (const sector of sortedSectors) {
        html += `<div class="portfolio-exchange-header">${sanitizeText(sector)}</div>`;
        html += `<ul class="divide-y divide-gray-200">`;
        for (const stock of groupedBySector[sector]) {
            html += `
                <li class="p-4 flex justify-between items-center hover:bg-gray-50">
                    <div>
                        <button class="text-left portfolio-item-view" data-ticker="${sanitizeText(stock.ticker)}">
                            <p class="font-bold text-indigo-700">${sanitizeText(stock.companyName)}</p>
                            <p class="text-sm text-gray-600">${sanitizeText(stock.ticker)}</p>
                        </button>
                    </div>
                    <div class="flex gap-2">
                        <button class="portfolio-item-edit text-sm bg-yellow-100 text-yellow-800 hover:bg-yellow-200 font-semibold py-1 px-3 rounded-full" data-ticker="${sanitizeText(stock.ticker)}">Edit</button>
                        <button class="portfolio-item-delete text-sm bg-red-100 text-red-800 hover:bg-red-200 font-semibold py-1 px-3 rounded-full" data-ticker="${sanitizeText(stock.ticker)}">Delete</button>
                    </div>
                </li>`;
        }
        html += `</ul>`;
    }
    container.innerHTML = html;
}
// GEMINI: END EDIT

// GEMINI: START EDIT
async function openManageStockModal(ticker = null) {
    const form = document.getElementById('manage-stock-form');
    form.reset();
    document.getElementById('topics-container').innerHTML = '';
    
    if (ticker) {
        // Edit mode
        document.getElementById('manage-stock-modal-title').textContent = `Edit ${ticker}`;
        const stockData = portfolioCache.find(s => s.ticker === ticker);
        if (stockData) {
            document.getElementById('manage-stock-original-ticker').value = stockData.ticker;
            document.getElementById('manage-stock-ticker').value = stockData.ticker;
            document.getElementById('manage-stock-name').value = stockData.companyName;
            document.getElementById('manage-stock-sector').value = stockData.sector || '';
            (stockData.topics || []).forEach(addTopicToForm);
        }
    } else {
        // Add mode
        document.getElementById('manage-stock-modal-title').textContent = 'Add New Stock';
        document.getElementById('manage-stock-original-ticker').value = '';
    }
    openModal(CONSTANTS.MODAL_MANAGE_STOCK);
}
// GEMINI: END EDIT

function addTopicToForm(topic = {}) {
    const container = document.getElementById('topics-container');
    const topicIndex = container.children.length;
    const topicId = `topic-${topicIndex}-${Date.now()}`;
    
    const topicDiv = document.createElement('div');
    topicDiv.className = 'topic-item-container relative';
    topicDiv.innerHTML = `
        <button type="button" class="absolute top-2 right-2 text-red-400 hover:text-red-600 remove-topic-button" title="Remove Topic">&times;</button>
        <div class="space-y-2">
            <div>
                <label for="${topicId}-name" class="block text-xs font-medium text-gray-600">Topic</label>
                <input type="text" id="${topicId}-name" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm" value="${sanitizeText(topic.topicName || '')}">
            </div>
            <div>
                <label for="${topicId}-desc" class="block text-xs font-medium text-gray-600">Description</label>
                <textarea id="${topicId}-desc" rows="2" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm">${sanitizeText(topic.description || '')}</textarea>
            </div>
            <div>
                <label for="${topicId}-prompt1" class="block text-xs font-medium text-gray-600">Initial Prompt</label>
                <textarea id="${topicId}-prompt1" rows="4" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm">${sanitizeText(topic.initialPrompt || '')}</textarea>
            </div>
            <div>
                <label for="${topicId}-prompt2" class="block text-xs font-medium text-gray-600">Additional Prompt</label>
                <textarea id="${topicId}-prompt2" rows="4" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm">${sanitizeText(topic.additionalPrompt || '')}</textarea>
            </div>
        </div>
    `;
    topicDiv.querySelector('.remove-topic-button').addEventListener('click', () => topicDiv.remove());
    container.appendChild(topicDiv);
}

// GEMINI: START EDIT
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
        sector: document.getElementById('manage-stock-sector').value.trim(),
        topics: []
    };

    const topicContainers = document.querySelectorAll('.topic-item-container');
    topicContainers.forEach(container => {
        stockData.topics.push({
            topicName: container.querySelector('input[type="text"]').value,
            description: container.querySelectorAll('textarea')[0].value,
            initialPrompt: container.querySelectorAll('textarea')[1].value,
            additionalPrompt: container.querySelectorAll('textarea')[2].value
        });
    });

    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = "Saving to portfolio...";
    
    try {
        if (originalTicker && originalTicker !== newTicker) {
            await deleteDoc(doc(db, CONSTANTS.DB_COLLECTION_PORTFOLIO, originalTicker));
        }
        await setDoc(doc(db, CONSTANTS.DB_COLLECTION_PORTFOLIO, newTicker), stockData);
        closeModal(CONSTANTS.MODAL_MANAGE_STOCK);
        await renderPortfolioView(); 
    } catch(error) {
        console.error("Error saving stock:", error);
        displayMessageInModal(`Could not save stock: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}
// GEMINI: END EDIT

async function handleDeleteStock(ticker) {
    openConfirmationModal(
        `Delete ${ticker}?`, 
        `Are you sure you want to remove ${ticker} from your portfolio? This will not delete the cached API data.`,
        async () => {
            openModal(CONSTANTS.MODAL_LOADING);
            document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Deleting ${ticker}...`;
            try {
                await deleteDoc(doc(db, CONSTANTS.DB_COLLECTION_PORTFOLIO, ticker));
                await renderPortfolioView();
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

// GEMINI: START EDIT
async function fetchAndCacheStockData(symbol, preloadedOverview = null) {
    const dataToCache = {};
    const failedFetches = [];

    const promises = API_FUNCTIONS.map(async (func) => {
        // If overview data is preloaded and we're at the OVERVIEW function, use it instead of fetching.
        if (func === 'OVERVIEW' && preloadedOverview) {
            if (preloadedOverview.Note || Object.keys(preloadedOverview).length === 0 || preloadedOverview.Information) {
                throw new Error(preloadedOverview.Note || preloadedOverview.Information || 'Preloaded OVERVIEW data was invalid.');
            }
            return { func: 'OVERVIEW', data: preloadedOverview };
        }
        
        try {
            const data = await callApi(`https://www.alphavantage.co/query?function=${func}&symbol=${symbol}&apikey=${alphaVantageApiKey}`);
            if (data.Note || Object.keys(data).length === 0 || data.Information) {
                throw new Error(data.Note || data.Information || 'No data returned.');
            }
            return { func, data };
        } catch (error) {
            console.error(`Failed to fetch ${func} for ${symbol}:`, error);
            failedFetches.push(func);
            return null;
        }
    });

    const results = await Promise.all(promises);

    if (failedFetches.length > 0) {
        throw new Error(`Could not retrieve all required data. Failed to fetch: ${failedFetches.join(', ')}.`);
    }

    results.forEach(result => {
        if (result) dataToCache[result.func] = result.data;
    });

    if (!dataToCache.OVERVIEW || !dataToCache.OVERVIEW.Symbol) {
        throw new Error(`Essential 'OVERVIEW' data for ${symbol} could not be fetched. The symbol may be invalid.`);
    }

    dataToCache.cachedAt = Timestamp.now();
    await setDoc(doc(db, CONSTANTS.DB_COLLECTION_CACHE, symbol), dataToCache);
    return dataToCache;
}
// GEMINI: END EDIT

async function handleRefreshData(symbol) {
    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Refreshing all data for ${symbol}...`;
    try {
        const refreshedData = await fetchAndCacheStockData(symbol);
        document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Rendering UI...`;
        
        const newCardHtml = renderOverviewCard(refreshedData, symbol);
        const oldCard = document.getElementById(`card-${symbol}`);
        if(oldCard) {
             const tempDiv = document.createElement('div');
             tempDiv.innerHTML = newCardHtml;
             oldCard.replaceWith(tempDiv.firstChild);
        } else { 
            await displayStockCard(symbol);
        }

    } catch (error) {
        console.error("Error refreshing stock data:", error);
        displayMessageInModal(error.message, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

// GEMINI: START EDIT
async function handleResearchSubmit(e) {
    e.preventDefault();
    const tickerInput = document.getElementById(CONSTANTS.INPUT_TICKER);
    const symbol = tickerInput.value.trim().toUpperCase();
    if (!/^[A-Z.]{1,10}$/.test(symbol)) {
        displayMessageInModal("Please enter a valid stock ticker symbol.", "warning");
        return;
    }
    
    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Checking portfolio for ${symbol}...`;
    
    try {
        const docRef = doc(db, CONSTANTS.DB_COLLECTION_PORTFOLIO, symbol);
        if ((await getDoc(docRef)).exists()) {
             displayMessageInModal(`${symbol} is already in your portfolio.`, 'info');
             tickerInput.value = '';
             closeModal(CONSTANTS.MODAL_LOADING);
             return;
        }
        
        document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Fetching overview for ${symbol}...`;
        const overviewData = await callApi(`https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${alphaVantageApiKey}`);
        
        if (!overviewData.Symbol) {
            throw new Error(`Could not fetch data for ${symbol}. It may be an invalid ticker.`);
        }

        const newStock = {
            ticker: overviewData.Symbol,
            companyName: overviewData.Name,
            sector: overviewData.Sector,
            topics: []
        };
        
        document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Adding ${symbol} to portfolio...`;
        await setDoc(doc(db, CONSTANTS.DB_COLLECTION_PORTFOLIO, newStock.ticker), newStock);

        tickerInput.value = '';
        displayMessageInModal(`${symbol} has been added to your portfolio.`, 'info');
        // Pass the already-fetched overview data to prevent a redundant API call
        await displayStockCard(newStock.ticker, overviewData);

    } catch (error) {
        console.error("Error during stock research:", error);
        displayMessageInModal(error.message, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}
// GEMINI: END EDIT

// GEMINI: START EDIT
async function displayStockCard(ticker, preloadedOverview = null) {
    if (document.getElementById(`card-${ticker}`)) {
        document.getElementById(`card-${ticker}`).scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Loading card for ${ticker}...`;
    
    try {
        let stockData;
        const cachedDocRef = doc(db, CONSTANTS.DB_COLLECTION_CACHE, ticker);
        const cachedDocSnap = await getDoc(cachedDocRef);

        if (cachedDocSnap.exists()) {
            stockData = cachedDocSnap.data();
        } else {
            document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `First time load: Fetching all data for ${ticker}...`;
            // Pass the preloaded overview data if it exists to the caching function
            stockData = await fetchAndCacheStockData(ticker, preloadedOverview);
        }

        const newCardHtml = renderOverviewCard(stockData, ticker);
        document.getElementById(CONSTANTS.CONTAINER_DYNAMIC_CONTENT).insertAdjacentHTML('beforeend', newCardHtml);

    } catch(error) {
        console.error(`Error displaying card for ${ticker}:`, error);
        displayMessageInModal(error.message, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}
// GEMINI: END EDIT

// --- NEWS FEATURE ---

function filterValidNews(articles) {
    if (!Array.isArray(articles)) return [];
    return articles.filter(article => 
        article.title && article.snippet && isValidHttpUrl(article.link)
    );
}

function renderNewsArticles(articles, symbol) {
    const card = document.getElementById(`card-${symbol}`);
    if (!card) return;

    let existingNewsContainer = card.querySelector('.news-container');
    if (existingNewsContainer) existingNewsContainer.remove();

    const newsContainer = document.createElement('div');
    newsContainer.className = 'news-container mt-4 border-t pt-4';

    if (articles.length === 0) {
        newsContainer.innerHTML = `<p class="text-sm text-gray-500">No recent news articles found.</p>`;
    } else {
        const articlesHtml = articles.slice(0, 5).map(article => `
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
        displayMessageInModal("News feature requires the Web Search API Key and Search Engine ID.", "warning");
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
    const overviewData = data.OVERVIEW;
    if (!overviewData || !overviewData.Symbol) return '';

    const marketCap = formatLargeNumber(overviewData.MarketCapitalization);
    const peRatio = overviewData.PERatio !== "None" ? overviewData.PERatio : "N/A";
    const eps = overviewData.EPS !== "None" ? overviewData.EPS : "N/A";
    const weekHigh = overviewData['52WeekHigh'] && overviewData['52WeekHigh'] !== "None" ? `$${overviewData['52WeekHigh']}` : "N/A";
    const timestampString = data.cachedAt ? `Data Stored On: ${data.cachedAt.toDate().toLocaleString()}` : '';

    return `
        <div class="bg-white rounded-2xl shadow-lg border border-gray-200 p-6" id="card-${symbol}">
            <div class="flex justify-between items-start gap-4">
                <div>
                    <h2 class="text-2xl font-bold text-gray-800">${sanitizeText(overviewData.Name)} (${sanitizeText(overviewData.Symbol)})</h2>
                    <p class="text-gray-500">${sanitizeText(overviewData.Exchange)} | ${sanitizeText(overviewData.Sector)}</p>
                </div>
                <div class="flex-shrink-0"><button data-symbol="${symbol}" class="refresh-data-button text-xs bg-indigo-100 text-indigo-700 hover:bg-indigo-200 font-semibold py-1 px-3 rounded-full">Refresh Data</button></div>
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
}

// --- EVENT LISTENER SETUP ---

function setupGlobalEventListeners() {
    document.getElementById(CONSTANTS.CONTAINER_DYNAMIC_CONTENT).addEventListener('click', (e) => {
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

    document.getElementById(CONSTANTS.CONTAINER_PORTFOLIO_LIST).addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        const ticker = target.dataset.ticker;
        if (!ticker) return;

        if (target.classList.contains('portfolio-item-view')) {
            displayStockCard(ticker);
            closeModal(CONSTANTS.MODAL_PORTFOLIO);
        }
        if (target.classList.contains('portfolio-item-edit')) openManageStockModal(ticker);
        if (target.classList.contains('portfolio-item-delete')) handleDeleteStock(ticker);
    });
}

function setupEventListeners() {
    document.getElementById(CONSTANTS.FORM_API_KEY)?.addEventListener('submit', handleApiKeySubmit);
    document.getElementById(CONSTANTS.FORM_STOCK_RESEARCH)?.addEventListener('submit', handleResearchSubmit);
    document.getElementById(CONSTANTS.BUTTON_VIEW_STOCKS)?.addEventListener('click', () => {
        renderPortfolioView();
        openModal(CONSTANTS.MODAL_PORTFOLIO);
    });

    document.getElementById('portfolio-search-input')?.addEventListener('input', (e) => displayFilteredPortfolio(e.target.value));
    document.getElementById(CONSTANTS.BUTTON_ADD_NEW_STOCK)?.addEventListener('click', () => openManageStockModal());

    document.getElementById('manage-stock-form')?.addEventListener('submit', handleSaveStock);
    document.getElementById('add-topic-button')?.addEventListener('click', () => addTopicToForm());
    document.getElementById('cancel-manage-stock-button')?.addEventListener('click', () => closeModal(CONSTANTS.MODAL_MANAGE_STOCK));

    document.querySelectorAll('.save-to-drive-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const modalId = e.target.dataset.modalId;
            handleSaveToDrive(modalId);
        });
    });

    const scrollTopBtn = document.getElementById(CONSTANTS.BUTTON_SCROLL_TOP);
    if (scrollTopBtn) scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    const modalsToClose = [
        { modal: CONSTANTS.MODAL_FULL_DATA, button: 'close-full-data-modal', bg: 'close-full-data-modal-bg' },
        { modal: CONSTANTS.MODAL_FINANCIAL_ANALYSIS, button: 'close-financial-analysis-modal', bg: 'close-financial-analysis-modal-bg' },
        { modal: CONSTANTS.MODAL_UNDERVALUED_ANALYSIS, button: 'close-undervalued-analysis-modal', bg: 'close-undervalued-analysis-modal-bg' },
        { modal: CONSTANTS.MODAL_PORTFOLIO, button: 'close-portfolio-modal', bg: 'close-portfolio-modal-bg' },
        { modal: CONSTANTS.MODAL_MANAGE_STOCK, bg: 'close-manage-stock-modal-bg'},
        { modal: CONSTANTS.MODAL_CONFIRMATION, button: 'cancel-button'},
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
    
    setupGlobalEventListeners();
}

// --- AI ANALYSIS REPORT GENERATORS ---

function get(obj, path, defaultValue = "N/A") {
    const value = path.split('.').reduce((a, b) => (a ? a[b] : undefined), obj);
    return value !== undefined && value !== null && value !== "None" ? value : defaultValue;
}

async function getStockDataFromCache(symbol, collection = CONSTANTS.DB_COLLECTION_CACHE) {
    const docRef = doc(db, collection, symbol);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
        throw new Error(`Could not find cached data for ${symbol}. Please research it first.`);
    }
    const data = docSnap.data();
    if (collection === CONSTANTS.DB_COLLECTION_CACHE && (!data.INCOME_STATEMENT || !data.BALANCE_SHEET || !data.CASH_FLOW || !data.OVERVIEW)) {
         throw new Error(`Cached analysis data for ${symbol} is incomplete. Please refresh it.`);
    }
    return data;
}

async function handleViewFullData(symbol) {
    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Loading full data for ${symbol}...`;
    try {
        const data = await getStockDataFromCache(symbol);
        document.getElementById(CONSTANTS.ELEMENT_FULL_DATA_CONTENT).textContent = JSON.stringify(data, null, 2);
        document.getElementById('full-data-modal-title').textContent = `Full Cached Data for ${symbol}`;
        document.getElementById('full-data-modal-timestamp').textContent = `Data Stored On: ${data.cachedAt.toDate().toLocaleString()}`;
        openModal(CONSTANTS.MODAL_FULL_DATA);
    } catch (error) {
        displayMessageInModal(`Error loading data: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

async function handleFinancialAnalysis(symbol) {
    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Generating AI financial analysis for ${symbol}...`;
    try {
        const data = await getStockDataFromCache(symbol);
        const companyName = get(data, 'OVERVIEW.Name', 'the company');
        const tickerSymbol = get(data, 'OVERVIEW.Symbol', symbol);

        const prompt = FINANCIAL_ANALYSIS_PROMPT
            .replace(/{companyName}/g, companyName)
            .replace(/{tickerSymbol}/g, tickerSymbol)
            .replace('{jsonData}', JSON.stringify(data, null, 2));

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
        const cachedData = await getStockDataFromCache(symbol);
        
        const companyName = get(cachedData, 'OVERVIEW.Name', 'the company');
        const tickerSymbol = get(cachedData, 'OVERVIEW.Symbol', symbol);

        const prompt = UNDERVALUED_ANALYSIS_PROMPT
            .replace(/{companyName}/g, companyName)
            .replace(/{tickerSymbol}/g, tickerSymbol)
            .replace('{jsonData}', JSON.stringify(cachedData, null, 2));
        
        const report = await callGeminiApi(prompt);
        document.getElementById('undervalued-analysis-content').innerHTML = marked.parse(report);
        document.getElementById('undervalued-analysis-modal-title').textContent = `Undervalued Analysis for ${symbol}`;
        openModal(CONSTANTS.MODAL_UNDERVALUED_ANALYSIS);

    } catch (error) {
        displayMessageInModal(`Could not generate AI analysis: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

// --- GOOGLE DRIVE FUNCTIONS (v6.1.0) ---

async function handleSaveToDrive(modalId) {
    if (!gapiInitialized || !googleAccessToken) {
        displayMessageInModal("Google Drive is not ready. Please ensure you are logged in.", "warning");
        return;
    }

    const modal = document.getElementById(modalId);
    if (!modal) return;

    let contentToSave = '';
    let stockSymbol = '';
    let analysisType = '';

    if (modalId === CONSTANTS.MODAL_FULL_DATA) {
        contentToSave = modal.querySelector('#full-data-content').textContent;
        stockSymbol = modal.querySelector('#full-data-modal-title').textContent.replace('Full Cached Data for ', '').trim();
        analysisType = 'FullData';
    } else {
        const proseContent = modal.querySelector('.prose').innerHTML;
        contentToSave = proseContent.replace(/<br\s*\/?>/gi, '\n')
                                     .replace(/<p>/gi, '\n').replace(/<\/p>/gi, '')
                                     .replace(/<h2>/gi, '## ').replace(/<\/h2>/gi, '\n')
                                     .replace(/<h3>/gi, '### ').replace(/<\/h3>/gi, '\n')
                                     .replace(/<ul>/gi, '').replace(/<\/ul>/gi, '')
                                     .replace(/<li>/gi, '* ').replace(/<\/li>/gi, '\n');

        stockSymbol = modal.querySelector('h2').textContent.split(' for ')[1].trim();
        analysisType = modal.querySelector('h2').textContent.split(' for ')[0].replace(/\s/g, '');
    }

    const fileName = `${stockSymbol}_${analysisType}_${new Date().toISOString().split('T')[0]}.md`;

    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Saving to Google Drive...`;

    try {
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

async function getOrCreateDriveFolder() {
    if (driveFolderId) return driveFolderId;

    const folderName = "Stock Evaluations";
    
    const response = await gapi.client.drive.files.list({
        q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`,
        fields: 'files(id, name)',
    });

    if (response.result.files.length > 0) {
        driveFolderId = response.result.files[0].id;
        return driveFolderId;
    } else {
        const fileMetadata = {
            'name': folderName,
            'mimeType': 'application/vnd.google-apps.folder'
        };
        const createResponse = await gapi.client.drive.files.create({
            resource: fileMetadata,
            fields: 'id'
        });
        driveFolderId = createResponse.result.id;
        return driveFolderId;
    }
}

async function createDriveFile(folderId, fileName, content) {
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const close_delim = `\r\n--${boundary}--`;

    const metadata = {
        name: fileName,
        mimeType: 'text/markdown',
        parents: [folderId]
    };

    const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: text/markdown\r\n\r\n' +
        content +
        close_delim;

    await gapi.client.request({
        path: '/upload/drive/v3/files',
        method: 'POST',
        params: { uploadType: 'multipart' },
        headers: { 'Content-Type': 'multipart/related; boundary="' + boundary + '"' },
        body: multipartRequestBody,
    });
}

// --- APP INITIALIZATION TRIGGER ---

function initializeApplication() {
    setupEventListeners();
    const versionDisplay = document.getElementById('app-version-display');
    if(versionDisplay) versionDisplay.textContent = `v${APP_VERSION}`;
    openModal(CONSTANTS.MODAL_API_KEY);
}

document.addEventListener('DOMContentLoaded', initializeApplication);
