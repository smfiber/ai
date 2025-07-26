import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithCredential, signOut, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, Timestamp, doc, setDoc, getDoc, deleteDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- App Version ---
const APP_VERSION = "6.3.0"; 

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
    MODAL_CUSTOM_ANALYSIS: 'customAnalysisModal',
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

const FINANCIAL_ANALYSIS_PROMPT = [
    "Role: You are a senior investment analyst AI. Your purpose is to generate a rigorous, data-driven financial statement analysis for a sophisticated audience (e.g., portfolio managers, institutional investors). Your analysis must be objective, precise, and derived exclusively from the provided JSON data. All calculations and interpretations must be clearly explained.",
    "Output Format: The final report must be in professional markdown format. Use # for the main title, ## for major sections, ### for sub-sections, and bullet points for key data and lists. Present financial figures clearly, using 'Billion' or 'Million' where appropriate for readability.",
    "IMPORTANT: Do not include any HTML tags in your output. Generate pure markdown only.",
    '',
    'Analyze the comprehensive financial data for {companyName} (Ticker: {tickerSymbol}) provided below. If a specific data point is "N/A" or missing, state that clearly in your analysis.',
    '',
    'JSON Data:',
    '{jsonData}',
    '',
    'Based on the provided data, generate the following multi-faceted financial report:',
    '',
    '# Comprehensive Financial Analysis: {companyName} ({tickerSymbol})',
    '',
    '## 1. Executive Summary',
    "Begin with a concise, top-level summary (3-4 sentences) that encapsulates the company's financial condition, recent performance trajectory, and core investment profile. Synthesize the most critical findings from the profitability, solvency, and valuation analyses into a coherent opening statement.",
    '',
    '## 2. Company Profile & Market Overview',
    '### Business Description',
    "Briefly describe the company's business based on the Description, Sector, and Industry from the OVERVIEW data.",
    '### Market Snapshot',
    'Present key market-related metrics for context.',
    '- Market Capitalization: $XXX.XX Billion',
    '- 52-Week Price Range: $XX.XX - $XX.XX',
    '- 50-Day Moving Average: $XX.XX',
    '- 200-Day Moving Average: $XX.XX',
    '- Analyst Target Price: $XX.XX',
    '',
    '## 3. Performance & Profitability Analysis',
    "Assess the company's ability to generate earnings and create value for shareholders.",
    '### 3.1. Revenue & Earnings Trend',
    'Analyze the historical trend of totalRevenue and netIncome over the last 3-5 fiscal years using the INCOME_STATEMENT annual data.',
    'Calculate and discuss the Year-over-Year (YoY) growth rates for both revenue and net income for the most recent two years.',
    'Incorporate the QuarterlyRevenueGrowthYOY and QuarterlyEarningsGrowthYOY from the OVERVIEW data to comment on recent momentum.',
    '### 3.2. Profitability Margins & Returns',
    'Extract the ProfitMargin and OperatingMarginTTM from the OVERVIEW section.',
    'Calculate the Gross Profit Margin for the last three fiscal years (grossProfit / totalRevenue).',
    'Analyze the trend in these margins. Are they expanding, contracting, or stable? Provide potential reasons based on the data (e.g., changes in costOfRevenue vs. totalRevenue).',
    "Analyze the ReturnOnEquityTTM (ROE) and ReturnOnAssetsTTM (ROA). Interpret these figures as indicators of management's efficiency in using its equity and asset bases to generate profit.",
    '',
    '## 4. Financial Health & Risk Assessment',
    "Evaluate the company's balance sheet strength, liquidity position, and reliance on debt.",
    '### 4.1. Liquidity Analysis',
    'Using the most recent BALANCE_SHEET annual report, calculate and interpret the following ratios:',
    "- Current Ratio: (totalCurrentAssets / totalCurrentLiabilities). Explain its implication for the company's ability to meet short-term obligations.",
    "- Quick Ratio (Acid-Test): (cashAndShortTermInvestments + currentNetReceivables) / totalCurrentLiabilities. Explain what this reveals about its reliance on selling inventory.",
    '### 4.2. Solvency and Debt Structure',
    "Calculate the Debt-to-Equity Ratio (totalLiabilities / totalShareholderEquity) for the last three fiscal years. Analyze the trend and comment on the company's leverage.",
    'Analyze the composition of debt by comparing longTermDebt to shortTermDebt. Is the debt structure sustainable?',
    "Calculate the Interest Coverage Ratio (EBIT / interestExpense) from the most recent INCOME_STATEMENT. Assess the company's ability to service its debt payments from its operating earnings.",
    '',
    '## 5. Cash Flow Analysis',
    'Analyze the generation and utilization of cash as detailed in the CASH_FLOW statement for the most recent 3 fiscal years.',
    '### Operating Cash Flow (OCF)',
    'Analyze the trend in operatingCashflow. Is it growing? Is it consistently positive?',
    '### Quality of Earnings',
    "Compare operatingCashflow to netIncome. A significant divergence can be a red flag. Is the company's profit backed by actual cash?",
    '### Investing and Financing Activities',
    "Analyze the major uses and sources of cash from cashflowFromInvestment (e.g., capitalExpenditures) and cashflowFromFinancing (e.g., dividendPayout, paymentsForRepurchaseOfCommonStock, debt issuance/repayment). What do these activities suggest about the company's strategy?",
    '',
    '## 6. Valuation Analysis',
    "Assess the company's current market valuation relative to its earnings and fundamentals.",
    'Present and interpret the following valuation multiples from the OVERVIEW data:',
    '- P/E Ratio (PERatio)',
    '- Forward P/E (ForwardPE)',
    '- Price-to-Sales Ratio (PriceToSalesRatioTTM)',
    '- Price-to-Book Ratio (PriceToBookRatio)',
    '- EV-to-EBITDA (EVToEBITDA)',
    'Discuss what these multiples imply. Is the stock valued for growth, value, or something else? Compare the TrailingPE to the ForwardPE to understand earnings expectations.',
    '',
    '## 7. Investment Thesis: Synthesis & Conclusion',
    'Conclude with a final synthesis that integrates all the preceding analyses.',
    '- **Key Strengths**: Identify 2-3 of the most significant financial strengths based on the data (e.g., strong OCF, low leverage, margin expansion).',
    '- **Potential Weaknesses & Red Flags**: Identify 2-3 key weaknesses or areas for concern (e.g., high debt, declining revenue growth, poor quality of earnings, negative cash flow).',
    '- **Overall Verdict**: Provide a concluding statement on the company\'s overall financial standing and investment profile. Based purely on this quantitative analysis, what is the primary narrative for a potential investor? (e.g., "A financially robust company with a premium valuation," or "A highly leveraged company facing profitability headwinds").'
].join('\n');

const UNDERVALUED_ANALYSIS_PROMPT = [
    'Role: You are a Chartered Financial Analyst (CFA) level AI. Your objective is to conduct a meticulous stock valuation analysis for an informed investor. You must synthesize fundamental data, technical indicators, and profitability metrics to determine if a stock is potentially trading below its intrinsic value. Your reasoning must be transparent, data-driven, and based exclusively on the provided JSON.',
    'Output Format: The final report must be delivered in a professional markdown report. Use # for the main title, ## for major sections, ### for sub-sections, and bullet points for key data points. Direct and professional language is required.',
    'IMPORTANT: Do not include any HTML tags in your output. Generate pure markdown only.',
    '',
    'Conduct a comprehensive valuation analysis for {companyName} (Ticker: {tickerSymbol}) using the financial data provided below. If a specific data point is "N/A" or missing, state that clearly in your analysis.',
    '',
    'JSON Data:',
    '{jsonData}',
    '',
    'Based on the data, generate the following in-depth report:',
    '# Investment Valuation Report: {companyName} ({tickerSymbol})',
    '',
    '## 1. Executive Verdict',
    'Provide a concise, top-line conclusion (3-4 sentences) that immediately answers the core question: Based on a synthesis of all available data, does the stock appear Undervalued, Fairly Valued, or Overvalued? Briefly state the primary factors (e.g., strong cash flow, low multiples, technical trends) that support this initial verdict.',
    '',
    '## 2. Fundamental Valuation Deep Dive',
    "Evaluate the company窶冱 intrinsic value through a rigorous examination of its financial health and market multiples.",
    '### 2.1. Relative Valuation Multiples',
    '- **Price-to-Earnings (P/E) Ratio:** [Value from OVERVIEW.PERatio]. Interpret this by comparing the TrailingPE to the ForwardPE. Does the difference suggest anticipated earnings growth or decline?',
    "- **Price-to-Book (P/B) Ratio:** [Value from OVERVIEW.PriceToBookRatio]. Explain what this ratio indicates about how the market values the company's net assets. A value under 1.0 is particularly noteworthy.",
    '- **Price-to-Sales (P/S) Ratio:** [Value from OVERVIEW.PriceToSalesRatioTTM]. Analyze this in the context of profitability. Is a low P/S ratio a sign of undervaluation or indicative of low-profit margins?',
    "- **Enterprise Value-to-EBITDA (EV/EBITDA):** [Value from OVERVIEW.EVToEBITDA]. Explain this ratio's significance as a capital structure-neutral valuation metric.",
    '### 2.2. Growth and Profitability-Adjusted Value',
    '- **PEG Ratio:** [Value from OVERVIEW.PEGRatio]. Interpret this critical figure. A PEG ratio under 1.0 often suggests a stock may be undervalued relative to its expected earnings growth.',
    "- **Return on Equity (ROE):** [Value from OVERVIEW.ReturnOnEquityTTM]%. Analyze this as a measure of core profitability and management's effectiveness at generating profits from shareholder capital.",
    '### 2.3. Dividend Analysis',
    '- **Dividend Yield:** [Value from OVERVIEW.DividendYield]%.',
    '- **Sustainability Check:** Calculate the Cash Flow Payout Ratio by dividing dividendPayout (from the most recent annual CASH_FLOW report) by operatingCashflow. A low ratio (<60%) suggests the dividend is well-covered and sustainable.',
    '### 2.4. Wall Street Consensus',
    "- **Analyst Target Price:** $[Value from OVERVIEW.AnalystTargetPrice]. Compare this target to the stock's recent price movement as indicated by its moving averages and 52-week range.",
    '',
    '## 3. Technical Analysis & Market Dynamics',
    "Assess the stock's current price action and market sentiment to determine if the timing is opportune.",
    '### 3.1. Trend Analysis',
    '- **50-Day MA:** $[Value from OVERVIEW.50DayMovingAverage]',
    '- **200-Day MA:** $[Value from OVERVIEW.200DayMovingAverage]',
    "- **Interpretation:** Analyze the stock's current trend. Is it in a bullish trend (trading above both MAs), a bearish trend (below both), or at an inflection point? How do these averages contain the price?",
    '### 3.2. Momentum and Volatility',
    '- **52-Week Range:** The stock has traded between $[Value from OVERVIEW.52WeekLow] and $[Value from OVERVIEW.52WeekHigh]. Where is the price currently situated within this range based on its moving averages? A price near the low may suggest value, while a price near the high suggests strong momentum.',
    '- **Market Volatility (Beta):** [Value from OVERVIEW.Beta]. Interpret the Beta. Does the stock tend to be more or less volatile than the overall market?',
    '',
    '## 4. Synthesized Conclusion: Framing the Opportunity',
    'Combine the fundamental and technical findings into a final, actionable synthesis.',
    '- **Fundamental Case:** Summarize the evidence. Do the valuation multiples, profitability, and growth metrics collectively suggest the stock is fundamentally cheap, expensive, or fairly priced?',
    '- **Technical Case:** Summarize the market sentiment. Is the current price trend and momentum working for or against a potential investment right now?',
    '- **Final Verdict & Investment Profile:** State a clear, final conclusion on whether the stock appears to be a compelling value opportunity. Characterize the potential investment by its profile. For example: "The stock appears fundamentally undervalued due to its low P/E and PEG ratios, supported by a sustainable dividend. However, technicals are currently bearish as the price is below its key moving averages, suggesting a patient approach may be warranted."',
    '',
    '**Disclaimer:** This AI-generated analysis is for informational and educational purposes only. It is not financial advice. Data may not be real-time.'
].join('\n');

const NEWS_SENTIMENT_PROMPT = [
    'Role: You are an expert financial news sentiment analyst.',
    'Task: Analyze the sentiment of the following news articles for {companyName} ({tickerSymbol}). Classify each article as \'Positive\', \'Negative\', or \'Neutral\'. Provide a brief, one-sentence justification for your classification.',
    'Format: Return a JSON array of objects, where each object has "sentiment" and "justification" keys. The array order must match the article order.',
    '',
    'Articles (JSON format):',
    '{news_articles_json}',
    '',
    'Example Output:',
    '[',
    '  { "sentiment": "Positive", "justification": "The article reports higher-than-expected quarterly earnings and a positive outlook." },',
    '  { "sentiment": "Negative", "justification": "The article discusses a new regulatory investigation into the company\'s sales practices." },',
    '  { "sentiment": "Neutral", "justification": "The article provides a factual overview of the company\'s upcoming shareholder meeting." }',
    ']'
].join('\n');

const BULL_VS_BEAR_PROMPT = [
    'Role: You are a skilled financial debater AI. Your task is to generate a concise and data-driven Bull and Bear case for {companyName} using ONLY the provided JSON data.',
    'Output Format: Use markdown format. Create a clear "Bull Case" section and a "Bear Case" section, each with 3-4 bullet points supported by specific data from the JSON.',
    '',
    'JSON Data:',
    '{jsonData}',
    '',
    '# Bull vs. Bear Analysis: {companyName} ({tickerSymbol})',
    '',
    '## The Bull Case (Reasons to be Optimistic)',
    'Construct an argument based on the company\'s strengths. Focus on metrics like:',
    '- Consistent revenue or earnings growth (from INCOME_STATEMENT).',
    '- Strong profitability margins (ProfitMargin, ROE from OVERVIEW).',
    '- Robust operating cash flow (from CASH_FLOW).',
    '- A potentially undervalued state based on key multiples (PERatio, PEGRatio from OVERVIEW).',
    '',
    '## The Bear Case (Reasons for Caution)',
    'Construct an argument based on the company\'s weaknesses. Focus on metrics like:',
    '- High debt levels or leverage (Debt-to-Equity from BALANCE_SHEET).',
    '- Declining revenue or shrinking margins.',
    '- Weak cash flow or a high reliance on financing activities.',
    '- A potentially overvalued state, indicated by high valuation multiples compared to growth.',
].join('\n');

const MOAT_ANALYSIS_PROMPT = [
    'Role: You are a business strategy analyst AI. Your goal is to assess the likely strength of {companyName}\'s economic moat using the provided financial data.',
    'Output Format: Provide a brief report in markdown, concluding with a qualitative verdict on the moat\'s strength (e.g., "Wide," "Narrow," or "None").',
    '',
    'JSON Data:',
    '{jsonData}',
    '',
    '# Economic Moat Assessment: {companyName} ({tickerSymbol})',
    '',
    '## 1. Evidence of Competitive Advantage',
    'Analyze the data for signs of a durable competitive advantage. Discuss:',
    '- **Profitability as a Signal:** Are the ProfitMargin, OperatingMarginTTM, and ReturnOnEquityTTM (from OVERVIEW) consistently high, suggesting pricing power?',
    '- **Brand/Intangible Assets:** While not directly stated, does the company\'s Description hint at a strong brand that supports its margins?',
    '- **Scale or Cost Advantages:** Does the trend in gross margins (calculable from INCOME_STATEMENT) show stability even as revenue grows?',
    '',
    '## 2. Moat Sustainability',
    'Assess how sustainable this advantage might be by looking at:',
    '- **Capital Allocation:** How is cash from operations being used? Are capitalExpenditures (from CASH_FLOW) significant, suggesting reinvestment to maintain the moat?',
    '- **Financial Health:** Is the balance sheet strong enough (low Debt-to-Equity) to fend off competitors?',
    '',
    '## 3. Verdict on Moat Strength',
    'Based on the evidence, provide a concluding assessment of the company\'s economic moat.',
].join('\n');

const DIVIDEND_SAFETY_PROMPT = [
    'Role: You are a conservative income investment analyst AI. Your sole focus is to determine the safety and sustainability of {companyName}\'s dividend based on the provided data.',
    'Output Format: Create a markdown report with specific ratio calculations and a final safety rating.',
    '',
    'JSON Data:',
    '{jsonData}',
    '',
    '# Dividend Safety Analysis: {companyName} ({tickerSymbol})',
    '',
    '## 1. Core Dividend Metrics',
    '- **Current Dividend Yield:** [Value from OVERVIEW.DividendYield]',
    '',
    '## 2. Payout Ratio Analysis',
    'Calculate and interpret the following payout ratios using the most recent annual data from the financial statements:',
    '- **Earnings Payout Ratio:** (dividendPayout / netIncome). Is the company paying out more than it earns?',
    '- **Cash Flow Payout Ratio:** (dividendPayout / operatingCashflow). This is critical. Is the dividend covered by actual cash generated from operations?',
    '',
    '## 3. Balance Sheet Impact',
    'Analyze the company\'s ability to sustain the dividend under pressure:',
    '- **Debt Load:** How has the Debt-to-Equity ratio (from BALANCE_SHEET) trended? High or rising debt can threaten dividend payments.',
    '- **Cash Position:** Examine the trend in cashAndShortTermInvestments (from BALANCE_SHEET). Is there a sufficient cash buffer?',
    '',
    '## 4. Final Dividend Safety Verdict',
    'Conclude with a rating: **"Safe," "Adequate,"** or **"At Risk,"** with a one-sentence justification based on the analysis above.',
].join('\n');

const GROWTH_OUTLOOK_PROMPT = [
    'Role: You are a forward-looking equity analyst AI. Identify the primary potential growth drivers for {companyName} based on the provided data.',
    'Output Format: A concise markdown summary of key growth indicators and a concluding outlook.',
    '',
    'JSON Data:',
    '{jsonData}',
    '',
    '# Growth Outlook: {companyName} ({tickerSymbol})',
    '',
    '## 1. Recent Performance Momentum',
    'Analyze the most recent growth signals from the OVERVIEW data:',
    '- **Quarterly Growth:** What do the QuarterlyRevenueGrowthYOY and QuarterlyEarningsGrowthYOY figures indicate about recent business momentum?',
    '',
    '## 2. Reinvestment for Future Growth',
    'Examine the CASH_FLOW statement for signs of investment:',
    '- **Capital Expenditures:** What is the trend in capitalExpenditures? Is the company actively investing in its future operations?',
    '',
    '## 3. Market Expectations',
    'Interpret the market\'s view on the company\'s growth prospects from the OVERVIEW data:',
    '- **Forward P/E vs. Trailing P/E:** Does the ForwardPE suggest earnings are expected to grow, shrink, or stay flat?',
    '- **Analyst Consensus:** How does the AnalystTargetPrice compare to the stock\'s 50-Day and 200-Day Moving Averages?',
    '',
    '## 4. Synthesized Growth Outlook',
    'Based on the factors above, provide a brief, synthesized outlook on the company\'s growth prospects.',
].join('\n');

const RISK_ASSESSMENT_PROMPT = [
    'Role: You are a risk analyst AI. Your job is to identify and summarize the most significant risks for {companyName} using only the provided data.',
    'Output Format: A prioritized, bulleted list in markdown, categorized by risk type.',
    '',
    'JSON Data:',
    '{jsonData}',
    '',
    '# Key Risk Summary: {companyName} ({tickerSymbol})',
    '',
    '## Financial Risks',
    '- **Leverage:** Is the Debt-to-Equity ratio (from BALANCE_SHEET) high? Calculate and state the current ratio.',
    '- **Liquidity:** Is the Current Ratio (totalCurrentAssets / totalCurrentLiabilities) low, suggesting short-term risk?',
    '- **Cash Flow:** Is operatingCashflow negative or significantly lower than netIncome, suggesting poor earnings quality?',
    '',
    '## Market & Valuation Risks',
    '- **Volatility:** Is the Beta (from OVERVIEW) greater than 1, indicating higher-than-market volatility?',
    '- **Valuation:** Is the PERatio or PriceToSalesRatioTTM exceptionally high, suggesting the stock price is built on high expectations and vulnerable to setbacks?',
    '',
    '## Operational Risks',
    '- **Growth Deceleration:** Is the QuarterlyRevenueGrowthYOY negative or showing a sharp slowdown?',
    '- **Margin Compression:** Are profitability margins (ProfitMargin, OperatingMarginTTM) trending downwards?',
].join('\n');

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
let googleClientId = "";
let driveTokenClient = null;
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

async function initializeFirebase() {
    if (!firebaseConfig) return;
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
                if (appIsInitialized) {
                    displayMessageInModal("Your session has expired. Please log in again to continue.", "warning");
                }
                appIsInitialized = false;
                document.getElementById(CONSTANTS.CONTAINER_DYNAMIC_CONTENT).innerHTML = '';
            }
            setupAuthUI(user);
        });
        
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
        }

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
    initializeGoogleSignIn();
    closeModal(CONSTANTS.MODAL_API_KEY);
}

// --- AUTHENTICATION & GAPI INITIALIZATION ---

function initializeGoogleSignIn() {
    if (!googleClientId) return;
    try {
        google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleCredentialResponse,
        });
    } catch (error) {
        console.error("Google Sign-In initialization error:", error);
        displayMessageInModal("Could not initialize Google Sign-In. Check your Client ID and ensure you are loading the page from a valid origin.", "error");
    }
}

async function handleCredentialResponse(response) {
    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = "Verifying login...";
    try {
        const credential = GoogleAuthProvider.credential(response.credential);
        await signInWithCredential(auth, credential);
    } catch (error) {
        console.error("Firebase sign-in with Google credential failed:", error);
        displayMessageInModal(`Login failed: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

function initializeDriveTokenClient() {
    if (!googleClientId) return;
    try {
        driveTokenClient = google.accounts.oauth2.initTokenClient({
            client_id: googleClientId,
            scope: 'https://www.googleapis.com/auth/drive.file',
            callback: '', // Callback is handled by the promise in getDriveToken
        });
    } catch (error) {
        console.error("Drive token client initialization failed:", error);
    }
}

function handleLogout() {
    if (auth) {
        signOut(auth).catch(error => console.error("Sign out failed:", error));
    }
    if (typeof google !== 'undefined' && google.accounts) {
        google.accounts.id.disableAutoSelect();
    }
}

function setupAuthUI(user) {
    const authStatusEl = document.getElementById('auth-status');
    const appContainer = document.getElementById('app-container');
    if (!authStatusEl || !appContainer) return;

    authStatusEl.innerHTML = ''; // Clear previous state

    if (user && !user.isAnonymous) {
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
        initializeDriveTokenClient();
    } else {
        appContainer.classList.add(CONSTANTS.CLASS_HIDDEN);
        if (typeof google !== 'undefined' && google.accounts) {
            google.accounts.id.renderButton(
                authStatusEl,
                { theme: "outline", size: "large", type: "standard", text: "signin_with" }
            );
        }
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
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;
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

    const groupedByExchange = filteredPortfolio.reduce((acc, stock) => {
        const exchange = stock.exchange || 'Uncategorized';
        if (!acc[exchange]) acc[exchange] = [];
        acc[exchange].push(stock);
        return acc;
    }, {});

    const sortedExchanges = Object.keys(groupedByExchange).sort();
    
    let html = '';
    for (const exchange of sortedExchanges) {
        html += `<div class="portfolio-exchange-header">${sanitizeText(exchange)}</div>`;
        html += `<ul class="divide-y divide-gray-200">`;
        for (const stock of groupedByExchange[exchange]) {
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

async function openManageStockModal(ticker = null) {
    const form = document.getElementById('manage-stock-form');
    form.reset();
    
    if (ticker) {
        // Edit mode
        document.getElementById('manage-stock-modal-title').textContent = `Edit ${ticker}`;
        const stockData = portfolioCache.find(s => s.ticker === ticker);
        if (stockData) {
            document.getElementById('manage-stock-original-ticker').value = stockData.ticker;
            document.getElementById('manage-stock-ticker').value = stockData.ticker;
            document.getElementById('manage-stock-name').value = stockData.companyName;
            document.getElementById('manage-stock-exchange').value = stockData.exchange;
        }
    } else {
        // Add mode
        document.getElementById('manage-stock-modal-title').textContent = 'Add New Stock';
        document.getElementById('manage-stock-original-ticker').value = '';
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
    };

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
             // Re-render topics after refresh
             await displayStockCard(symbol);
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
            exchange: overviewData.Exchange,
        };
        
        document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Adding ${symbol} to portfolio...`;
        await setDoc(doc(db, CONSTANTS.DB_COLLECTION_PORTFOLIO, newStock.ticker), newStock);

        tickerInput.value = '';
        displayMessageInModal(`${symbol} has been added to your portfolio.`, 'info');
        await displayStockCard(newStock.ticker);

    } catch (error) {
        console.error("Error during stock research:", error);
        displayMessageInModal(error.message, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

async function displayStockCard(ticker) {
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
            stockData = await fetchAndCacheStockData(ticker);
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

// --- NEWS FEATURE ---

function filterValidNews(articles) {
    if (!Array.isArray(articles)) return [];
    return articles.filter(article => 
        article.title && article.snippet && isValidHttpUrl(article.link)
    );
}

function getSentimentDisplay(sentiment) {
    switch (sentiment) {
        case 'Positive':
            return { icon: '総', colorClass: 'text-green-600', bgClass: 'bg-green-100' };
        case 'Negative':
            return { icon: '綜', colorClass: 'text-red-600', bgClass: 'bg-red-100' };
        case 'Neutral':
            return { icon: '�', colorClass: 'text-gray-600', bgClass: 'bg-gray-100' };
        default:
            return { icon: '', colorClass: '', bgClass: '' };
    }
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
        const articlesHtml = articles.slice(0, 5).map(article => {
            let sentimentHtml = '';
            if (article.sentiment && article.sentiment.sentiment) {
                const { icon, colorClass, bgClass } = getSentimentDisplay(article.sentiment.sentiment);
                sentimentHtml = `
                    <div class="mt-2 p-2 rounded-lg ${bgClass} flex items-start gap-2">
                        <span class="text-lg ${colorClass}">${icon}</span>
                        <p class="text-sm ${colorClass}">
                            <span class="font-semibold">${article.sentiment.sentiment}:</span>
                            ${sanitizeText(article.sentiment.justification)}
                        </p>
                    </div>
                `;
            }

            return `
                <div class="mb-4">
                    <a href="${sanitizeText(article.link)}" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:underline font-semibold">${sanitizeText(article.title)}</a>
                    <p class="text-sm text-gray-600 mt-1">${sanitizeText(article.snippet)}</p>
                    ${sentimentHtml}
                </div>
            `;
        }).join('');
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
    button.textContent = 'Analyzing...';

    try {
        const stockData = await getStockDataFromCache(symbol);
        const companyName = get(stockData, 'OVERVIEW.Name', symbol);
        const query = encodeURIComponent(`${companyName} (${symbol}) stock market news`);
        const url = `https://www.googleapis.com/customsearch/v1?key=${searchApiKey}&cx=${searchEngineId}&q=${query}&sort=date`;
        
        const newsData = await callApi(url);
        let validArticles = filterValidNews(newsData.items);

        if (validArticles.length > 0) {
            try {
                const articlesForPrompt = validArticles.slice(0, 5).map(a => ({ title: a.title, snippet: a.snippet }));
                const prompt = NEWS_SENTIMENT_PROMPT
                    .replace('{companyName}', companyName)
                    .replace('{tickerSymbol}', symbol)
                    .replace('{news_articles_json}', JSON.stringify(articlesForPrompt, null, 2));

                const sentimentResult = await callGeminiApi(prompt);
                const cleanedJsonString = sentimentResult.replace(/```json\n|```/g, '').trim();
                const sentiments = JSON.parse(cleanedJsonString);
                
                if (Array.isArray(sentiments) && sentiments.length === articlesForPrompt.length) {
                    validArticles = validArticles.map((article, index) => ({
                        ...article,
                        sentiment: sentiments[index]
                    }));
                }
            } catch (sentimentError) {
                console.error("Could not perform sentiment analysis:", sentimentError);
            }
        }

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
            <div class="mt-6 border-t pt-4 flex flex-wrap gap-2 justify-center">
                <button data-symbol="${symbol}" class="view-json-button text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg">View JSON</button>
                <button data-symbol="${symbol}" class="fetch-news-button text-sm bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg">Fetch News</button>
                <button data-symbol="${symbol}" class="undervalued-analysis-button text-sm bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-4 rounded-lg">Undervalued Analysis</button>
                <button data-symbol="${symbol}" class="financial-analysis-button text-sm bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg">Financial Analysis</button>
            </div>
            <div class="mt-4 border-t pt-4 flex flex-wrap gap-2 justify-center">
                <button data-symbol="${symbol}" class="bull-bear-analysis-button text-sm bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg">Bull vs. Bear</button>
                <button data-symbol="${symbol}" class="moat-analysis-button text-sm bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-2 px-4 rounded-lg">Moat Analysis</button>
                <button data-symbol="${symbol}" class="dividend-safety-button text-sm bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-4 rounded-lg">Dividend Safety</button>
                <button data-symbol="${symbol}" class="growth-outlook-button text-sm bg-lime-500 hover:bg-lime-600 text-white font-semibold py-2 px-4 rounded-lg">Growth Outlook</button>
                <button data-symbol="${symbol}" class="risk-assessment-button text-sm bg-rose-500 hover:bg-rose-600 text-white font-semibold py-2 px-4 rounded-lg">Risk Assessment</button>
            </div>
            <div class="text-right text-xs text-gray-400 mt-4">${timestampString}</div>
        </div>`;
}

// --- EVENT LISTENER SETUP ---

function setupGlobalEventListeners() {
    document.getElementById(CONSTANTS.CONTAINER_DYNAMIC_CONTENT).addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        
        const symbol = target.dataset.symbol || target.dataset.ticker;
        if (!symbol) return;

        if (target.classList.contains('refresh-data-button')) handleRefreshData(symbol);
        if (target.classList.contains('view-json-button')) handleViewFullData(symbol);
        if (target.classList.contains('financial-analysis-button')) handleFinancialAnalysis(symbol);
        if (target.classList.contains('undervalued-analysis-button')) handleUndervaluedAnalysis(symbol);
        if (target.classList.contains('fetch-news-button')) handleFetchNews(symbol);
        if (target.classList.contains('bull-bear-analysis-button')) handleBullBearAnalysis(symbol);
        if (target.classList.contains('moat-analysis-button')) handleMoatAnalysis(symbol);
        if (target.classList.contains('dividend-safety-button')) handleDividendSafetyAnalysis(symbol);
        if (target.classList.contains('growth-outlook-button')) handleGrowthOutlookAnalysis(symbol);
        if (target.classList.contains('risk-assessment-button')) handleRiskAssessmentAnalysis(symbol);
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
        { modal: CONSTANTS.MODAL_CUSTOM_ANALYSIS, button: 'close-custom-analysis-modal', bg: 'close-custom-analysis-modal-bg' },
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

async function handleBullBearAnalysis(symbol) {
    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Generating Bull vs. Bear case for ${symbol}...`;
    try {
        const data = await getStockDataFromCache(symbol);
        const companyName = get(data, 'OVERVIEW.Name', 'the company');
        const tickerSymbol = get(data, 'OVERVIEW.Symbol', symbol);
        const prompt = BULL_VS_BEAR_PROMPT
            .replace(/{companyName}/g, companyName)
            .replace(/{tickerSymbol}/g, tickerSymbol)
            .replace('{jsonData}', JSON.stringify(data, null, 2));
        const report = await callGeminiApi(prompt);
        document.getElementById('custom-analysis-content').innerHTML = marked.parse(report);
        document.getElementById('custom-analysis-modal-title').textContent = `Bull vs. Bear | ${symbol}`;
        openModal(CONSTANTS.MODAL_CUSTOM_ANALYSIS);
    } catch (error) {
        displayMessageInModal(`Could not generate analysis: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

async function handleMoatAnalysis(symbol) {
    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Generating Moat analysis for ${symbol}...`;
    try {
        const data = await getStockDataFromCache(symbol);
        const companyName = get(data, 'OVERVIEW.Name', 'the company');
        const tickerSymbol = get(data, 'OVERVIEW.Symbol', symbol);
        const prompt = MOAT_ANALYSIS_PROMPT
            .replace(/{companyName}/g, companyName)
            .replace(/{tickerSymbol}/g, tickerSymbol)
            .replace('{jsonData}', JSON.stringify(data, null, 2));
        const report = await callGeminiApi(prompt);
        document.getElementById('custom-analysis-content').innerHTML = marked.parse(report);
        document.getElementById('custom-analysis-modal-title').textContent = `Moat Analysis | ${symbol}`;
        openModal(CONSTANTS.MODAL_CUSTOM_ANALYSIS);
    } catch (error) {
        displayMessageInModal(`Could not generate analysis: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

async function handleDividendSafetyAnalysis(symbol) {
    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Generating Dividend Safety analysis for ${symbol}...`;
    try {
        const data = await getStockDataFromCache(symbol);
        const companyName = get(data, 'OVERVIEW.Name', 'the company');
        const tickerSymbol = get(data, 'OVERVIEW.Symbol', symbol);
        const prompt = DIVIDEND_SAFETY_PROMPT
            .replace(/{companyName}/g, companyName)
            .replace(/{tickerSymbol}/g, tickerSymbol)
            .replace('{jsonData}', JSON.stringify(data, null, 2));
        const report = await callGeminiApi(prompt);
        document.getElementById('custom-analysis-content').innerHTML = marked.parse(report);
        document.getElementById('custom-analysis-modal-title').textContent = `Dividend Safety | ${symbol}`;
        openModal(CONSTANTS.MODAL_CUSTOM_ANALYSIS);
    } catch (error) {
        displayMessageInModal(`Could not generate analysis: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

async function handleGrowthOutlookAnalysis(symbol) {
    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Generating Growth Outlook analysis for ${symbol}...`;
    try {
        const data = await getStockDataFromCache(symbol);
        const companyName = get(data, 'OVERVIEW.Name', 'the company');
        const tickerSymbol = get(data, 'OVERVIEW.Symbol', symbol);
        const prompt = GROWTH_OUTLOOK_PROMPT
            .replace(/{companyName}/g, companyName)
            .replace(/{tickerSymbol}/g, tickerSymbol)
            .replace('{jsonData}', JSON.stringify(data, null, 2));
        const report = await callGeminiApi(prompt);
        document.getElementById('custom-analysis-content').innerHTML = marked.parse(report);
        document.getElementById('custom-analysis-modal-title').textContent = `Growth Outlook | ${symbol}`;
        openModal(CONSTANTS.MODAL_CUSTOM_ANALYSIS);
    } catch (error) {
        displayMessageInModal(`Could not generate analysis: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

async function handleRiskAssessmentAnalysis(symbol) {
    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Generating Risk Assessment for ${symbol}...`;
    try {
        const data = await getStockDataFromCache(symbol);
        const companyName = get(data, 'OVERVIEW.Name', 'the company');
        const tickerSymbol = get(data, 'OVERVIEW.Symbol', symbol);
        const prompt = RISK_ASSESSMENT_PROMPT
            .replace(/{companyName}/g, companyName)
            .replace(/{tickerSymbol}/g, tickerSymbol)
            .replace('{jsonData}', JSON.stringify(data, null, 2));
        const report = await callGeminiApi(prompt);
        document.getElementById('custom-analysis-content').innerHTML = marked.parse(report);
        document.getElementById('custom-analysis-modal-title').textContent = `Risk Assessment | ${symbol}`;
        openModal(CONSTANTS.MODAL_CUSTOM_ANALYSIS);
    } catch (error) {
        displayMessageInModal(`Could not generate analysis: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}


// --- GOOGLE DRIVE FUNCTIONS (v6.1.0) ---

function getDriveToken() {
    return new Promise((resolve, reject) => {
        if (!driveTokenClient) {
            return reject(new Error("Drive token client not initialized."));
        }
        
        try {
            driveTokenClient.callback = (tokenResponse) => {
                if (tokenResponse.error) {
                    return reject(new Error(`Error getting drive token: ${tokenResponse.error}`));
                }
                resolve(tokenResponse.access_token);
            };
        
            driveTokenClient.requestAccessToken({ prompt: '' });
        } catch (e) {
            reject(e);
        }
    });
}

async function handleSaveToDrive(modalId) {
    if (!auth.currentUser || auth.currentUser.isAnonymous) {
        displayMessageInModal("Please log in with Google to save files to Drive.", "warning");
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
        
        const titleText = modal.querySelector('h2').textContent;
        if (modalId === CONSTANTS.MODAL_CUSTOM_ANALYSIS) {
            const parts = titleText.split(' | ');
            analysisType = parts[0].trim().replace(/\s/g, '');
            stockSymbol = parts[1].trim();
        } else {
            stockSymbol = titleText.split(' for ')[1].trim();
            analysisType = titleText.split(' for ')[0].replace(/\s/g, '');
        }
    }

    const fileName = `${stockSymbol}_${analysisType}_${new Date().toISOString().split('T')[0]}.md`;

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

async function getOrCreateDriveFolder() {
    let folderId = driveFolderId;
    if (folderId) return folderId;

    const folderName = "Stock Evaluations";
    
    const response = await gapi.client.drive.files.list({
        q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`,
        fields: 'files(id, name)',
    });

    if (response.result.files && response.result.files.length > 0) {
        folderId = response.result.files[0].id;
    } else {
        const fileMetadata = {
            'name': folderName,
            'mimeType': 'application/vnd.google-apps.folder'
        };
        const createResponse = await gapi.client.drive.files.create({
            resource: fileMetadata,
            fields: 'id'
        });
        folderId = createResponse.result.id;
    }
    driveFolderId = folderId;
    return folderId;
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

    const response = await gapi.client.request({
        path: '/upload/drive/v3/files',
        method: 'POST',
        params: { uploadType: 'multipart' },
        headers: { 'Content-Type': 'multipart/related; boundary="' + boundary + '"' },
        body: multipartRequestBody,
    });
    
    return response;
}

// --- APP INITIALIZATION TRIGGER ---

function initializeApplication() {
    setupEventListeners();
    const versionDisplay = document.getElementById('app-version-display');
    if(versionDisplay) versionDisplay.textContent = `v${APP_VERSION}`;
    openModal(CONSTANTS.MODAL_API_KEY);
}

document.addEventListener('DOMContentLoaded', initializeApplication);
```html:index.html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Stock Research Hub</title>
    
    <script src="[https://cdn.tailwindcss.com](https://cdn.tailwindcss.com)"></script>
    <script src="[https://cdn.jsdelivr.net/npm/marked/marked.min.js](https://cdn.jsdelivr.net/npm/marked/marked.min.js)"></script>
    <script src="[https://accounts.google.com/gsi/client](https://accounts.google.com/gsi/client)" async defer></script>
    <script src="[https://apis.google.com/js/api.js](https://apis.google.com/js/api.js)" async defer></script>
    <link rel="preconnect" href="[https://fonts.googleapis.com](https://fonts.googleapis.com)">
    <link rel="preconnect" href="[https://fonts.gstatic.com](https://fonts.gstatic.com)" crossorigin>
    <link href="[https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap](https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap)" rel="stylesheet">
    
    <link rel="stylesheet" href="style.css">
    <link rel="icon" href="data:,">
</head>
<body class="bg-gray-100">

    <header class="relative bg-gray-800 text-white p-6 shadow-lg">
        <div id="header-bg-image" class="absolute inset-0 bg-cover bg-center opacity-20"></div>
        <div class="relative container mx-auto flex justify-between items-center">
            <div>
                <h1 class="text-3xl font-bold tracking-tight">Stock Research Hub</h1>
                <div class="flex items-center gap-x-3">
                    <p class="text-sm text-gray-300 mt-1">Your Personal Market Co-Pilot</p>
                    <span id="app-version-display" class="text-xs text-gray-400 mt-1"></span>
                </div>
            </div>
            <div id="auth-status" class="flex items-center"></div>
        </div>
    </header>

    <div id="app-container" class="hidden">
        <main class="container mx-auto p-4 sm:p-6 lg:p-8">
            <div id="main-view" class="text-center py-16">
                <button id="view-stocks-button" class="btn-main-action bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg">
                    View My Stock Portfolio
                </button>
            </div>
            <div id="stock-screener-section" class="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 my-8 hidden">
                <h2 class="text-xl font-bold mb-1 text-emerald-500">Add New Stock to Portfolio</h2>
                <p class="text-sm text-gray-500 mb-4">Enter a stock ticker symbol to add it to your portfolio.</p>
                <form id="stock-research-form" class="flex items-center gap-4">
                    <label for="ticker-input" class="sr-only">Stock Ticker Symbol</label>
                    <input type="text" id="ticker-input" class="border border-gray-300 rounded-lg w-full transition-all duration-200 ease-in-out focus:ring-2 focus:ring-indigo-600 focus:border-transparent bg-white text-gray-800 shadow-sm flex-grow p-3 text-lg uppercase" placeholder="e.g., AAPL, MSFT, NVDA">
                    <button type="submit" id="research-button" class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-5 rounded-lg shadow-md transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600">Add Stock</button>
                </form>
            </div>
            <div id="dynamic-content-container" class="space-y-8"></div>
        </main>
        <button id="scroll-to-top-button" class="fixed w-14 h-14 rounded-full shadow-lg text-2xl flex items-center justify-center transition-transform duration-200 hover:scale-110 bg-indigo-600 hover:bg-indigo-700 text-white z-30 hidden" style="bottom: 2rem; left: 2rem;">&uarr;</button>
    </div>

    <div id="apiKeyModal" class="fixed inset-0 z-[100] items-center justify-center p-4 modal">
        <div class="absolute inset-0 bg-gray-900 bg-opacity-75"></div>
        <div class="relative bg-white rounded-2xl shadow-lg border border-gray-200 p-8 w-full max-w-lg m-4 overflow-y-auto max-h-[90vh]">
            <h2 class="text-2xl font-bold mb-4">API Keys Required</h2>
            <p class="text-gray-500 mb-6">Please provide your API keys to get started. These are required for the application to function.</p>
            <form id="apiKeyForm">
                <div class="space-y-4">
                    <div>
                        <label for="alphaVantageApiKeyInput" class="block text-sm font-semibold text-gray-800 mb-1">Alpha Vantage API Key</label>
                        <input type="text" id="alphaVantageApiKeyInput" class="border border-gray-300 rounded-lg w-full p-2" placeholder="Enter your Alpha Vantage API Key">
                    </div>
                    <div>
                        <label for="geminiApiKeyInput" class="block text-sm font-semibold text-gray-800 mb-1">Google Gemini API Key</label>
                        <input type="text" id="geminiApiKeyInput" class="border border-gray-300 rounded-lg w-full p-2" placeholder="Enter your Google Gemini API Key">
                    </div>
                    <div>
                        <label for="googleClientIdInput" class="block text-sm font-semibold text-gray-800 mb-1">Google Cloud Client ID</label>
                        <input type="text" id="googleClientIdInput" class="border border-gray-300 rounded-lg w-full p-2" placeholder="Enter your Google Cloud Web Client ID">
                    </div>
                    <div>
                        <label for="webSearchApiKeyInput" class="block text-sm font-semibold text-gray-800 mb-1">Web Search API Key (Google)</label>
                        <input type="text" id="webSearchApiKeyInput" class="border border-gray-300 rounded-lg w-full p-2" placeholder="Enter your Google Cloud API Key">
                    </div>
                    <div>
                        <label for="searchEngineIdInput" class="block text-sm font-semibold text-gray-800 mb-1">Search Engine ID (cx value)</label>
                        <input type="text" id="searchEngineIdInput" class="border border-gray-300 rounded-lg w-full p-2" placeholder="Enter your Custom Search Engine ID">
                    </div>
                    <div>
                        <label for="firebaseConfigInput" class="block text-sm font-semibold text-gray-800 mb-1">Firebase Web App Config</label>
                        <textarea id="firebaseConfigInput" class="border border-gray-300 rounded-lg w-full p-2" rows="6" placeholder="Paste your Firebase Web App Config Object"></textarea>
                    </div>
                </div>
                <p id="api-key-error" class="text-red-500 text-sm mt-2"></p>
                <div class="mt-6 flex justify-end">
                    <button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-5 rounded-lg shadow-md">Save and Continue</button>
                </div>
            </form>
        </div>
    </div>
    
    <div id="loadingStateModal" class="fixed inset-0 z-[110] flex-col items-center justify-center p-4 modal"><div class="absolute inset-0 bg-gray-900 bg-opacity-75"></div><div class="relative flex flex-col items-center"><div class="loader"></div><p id="loading-message" class="text-white mt-4"></p></div></div>
    <div id="messageModal" class="fixed inset-0 z-[110] items-center justify-center p-4 modal"><div class="absolute inset-0 bg-gray-900 bg-opacity-75"></div><div class="relative modal-content"></div></div>
    <div id="confirmationModal" class="fixed inset-0 z-[110] items-center justify-center p-4 modal"><div class="absolute inset-0 bg-gray-900 bg-opacity-75"></div><div class="relative bg-white rounded-2xl shadow-lg border border-gray-200 p-8 w-full max-w-sm m-4 text-center"><h2 id="confirmation-title" class="text-2xl font-bold mb-4 text-yellow-600">Are you sure?</h2><p id="confirmation-message" class="mb-6 text-gray-500">This action cannot be undone.</p><div class="flex justify-center gap-4"><button id="cancel-button" class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-5 rounded-lg w-full">Cancel</button><button id="confirm-button" class="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-5 rounded-lg w-full">Confirm</button></div></div></div>
    
    <div id="fullDataModal" class="fixed inset-0 z-[105] items-center justify-center p-4 modal">
        <div class="absolute inset-0 bg-gray-900 bg-opacity-75" id="close-full-data-modal-bg"></div>
        <div class="relative bg-white rounded-2xl shadow-lg border border-gray-200 flex flex-col w-full max-w-4xl h-full max-h-[90vh] m-4">
            <div class="p-6 border-b border-gray-200 flex justify-between items-center">
                <div>
                    <h2 id="full-data-modal-title" class="text-2xl font-bold text-gray-800">Full Cached Data</h2>
                    <p id="full-data-modal-timestamp" class="text-sm text-gray-500"></p>
                </div>
                <button id="close-full-data-modal" class="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div class="p-6 overflow-y-auto flex-grow bg-gray-50">
                <pre id="full-data-content" class="text-xs whitespace-pre-wrap break-all"></pre>
            </div>
            <div class="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
                <button data-modal-id="fullDataModal" class="save-to-drive-button bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg">Save to Drive</button>
            </div>
        </div>
    </div>
    
    <div id="financialAnalysisModal" class="fixed inset-0 z-[105] items-center justify-center p-4 modal">
        <div class="absolute inset-0 bg-gray-900 bg-opacity-75" id="close-financial-analysis-modal-bg"></div>
        <div class="relative bg-white rounded-2xl shadow-lg border border-gray-200 flex flex-col w-full max-w-4xl h-full max-h-[90vh] m-4">
            <div class="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 id="financial-analysis-modal-title" class="text-2xl font-bold text-gray-800">Financial Analysis</h2>
                <button id="close-financial-analysis-modal" class="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div id="financial-analysis-content" class="prose p-6 overflow-y-auto flex-grow"></div>
            <div class="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
                <button data-modal-id="financialAnalysisModal" class="save-to-drive-button bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg">Save to Drive</button>
            </div>
        </div>
    </div>

    <div id="undervaluedAnalysisModal" class="fixed inset-0 z-[105] items-center justify-center p-4 modal">
        <div class="absolute inset-0 bg-gray-900 bg-opacity-75" id="close-undervalued-analysis-modal-bg"></div>
        <div class="relative bg-white rounded-2xl shadow-lg border border-gray-200 flex flex-col w-full max-w-4xl h-full max-h-[90vh] m-4">
            <div class="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 id="undervalued-analysis-modal-title" class="text-2xl font-bold text-gray-800">Undervalued Stock Analysis</h2>
                <button id="close-undervalued-analysis-modal" class="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div id="undervalued-analysis-content" class="prose p-6 overflow-y-auto flex-grow"></div>
            <div class="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
                <button data-modal-id="undervaluedAnalysisModal" class="save-to-drive-button bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg">Save to Drive</button>
            </div>
        </div>
    </div>

    <div id="customAnalysisModal" class="fixed inset-0 z-[105] items-center justify-center p-4 modal">
        <div class="absolute inset-0 bg-gray-900 bg-opacity-75" id="close-custom-analysis-modal-bg"></div>
        <div class="relative bg-white rounded-2xl shadow-lg border border-gray-200 flex flex-col w-full max-w-4xl h-full max-h-[90vh] m-4">
            <div class="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 id="custom-analysis-modal-title" class="text-2xl font-bold text-gray-800">Custom Analysis</h2>
                <button id="close-custom-analysis-modal" class="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div id="custom-analysis-content" class="prose p-6 overflow-y-auto flex-grow"></div>
            <div class="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
                <button data-modal-id="customAnalysisModal" class="save-to-drive-button bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg">Save to Drive</button>
            </div>
        </div>
    </div>

    <div id="portfolioModal" class="fixed inset-0 z-[105] items-center justify-center p-4 modal"><div class="absolute inset-0 bg-gray-900 bg-opacity-75" id="close-portfolio-modal-bg"></div><div class="relative bg-white rounded-2xl shadow-lg border border-gray-200 flex flex-col w-full max-w-4xl h-full max-h-[90vh] m-4"><div class="p-6 border-b border-gray-200 flex justify-between items-center"><h2 class="text-2xl font-bold text-gray-800">My Stock Portfolio</h2><button id="close-portfolio-modal" class="text-gray-400 hover:text-gray-600 text-2xl">&times;</button></div><div class="p-4 border-b border-gray-200"><input type="text" id="portfolio-search-input" class="border border-gray-300 rounded-lg w-full p-2" placeholder="Search by Company or Ticker..."></div><div id="portfolio-list-container" class="overflow-y-auto flex-grow"></div><div class="p-4 border-t border-gray-200 bg-gray-50 flex justify-end"><button id="add-new-stock-button" class="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg">Add New Stock</button></div></div></div>
    <div id="manageStockModal" class="fixed inset-0 z-[106] items-center justify-center p-4 modal"><div class="absolute inset-0 bg-gray-900 bg-opacity-75" id="close-manage-stock-modal-bg"></div><div class="relative bg-white rounded-2xl shadow-lg border border-gray-200 flex flex-col w-full max-w-2xl h-full max-h-[90vh] m-4"><form id="manage-stock-form" class="flex flex-col h-full"><div class="p-6 border-b border-gray-200"><h2 id="manage-stock-modal-title" class="text-2xl font-bold text-gray-800">Manage Stock</h2></div><div class="p-6 overflow-y-auto flex-grow space-y-4"><input type="hidden" id="manage-stock-original-ticker"><div><label for="manage-stock-ticker" class="block text-sm font-medium text-gray-700">Ticker Symbol</label><input type="text" id="manage-stock-ticker" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 uppercase" required></div><div><label for="manage-stock-name" class="block text-sm font-medium text-gray-700">Company Name</label><input type="text" id="manage-stock-name" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required></div><div><label for="manage-stock-exchange" class="block text-sm font-medium text-gray-700">Exchange</label><input type="text" id="manage-stock-exchange" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required></div></div><div class="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-4"><button type="button" id="cancel-manage-stock-button" class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg">Cancel</button><button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg">Save Changes</button></div></form></div></div>

    <script type="module" src="main.js"></script>
</body>
</html>
```css:style.css
/*
 * AI Stock Research Hub Stylesheet
 * Version: 6.0.0
 * Description: Provides essential, centralized styles that supplement the Tailwind CSS framework.
 * This includes the loading spinner animation, modal visibility rules, and root theme variables.
 */

/*
 * =================================================================
 * THEME & COLOR VARIABLES
 * =================================================================
 */
:root {
    --color-primary: #4f46e5;
    font-family: 'Inter', sans-serif;
}

body {
    background-color: #f3f4f6; /* bg-gray-100 */
    color: #1f2937; /* color-text */
}

/*
 * =================================================================
 * MODAL STYLES
 * =================================================================
 */
.modal {
    display: none;
}
.modal.is-open {
    display: flex;
}
body.modal-open {
    overflow: hidden;
}

/*
 * =================================================================
 * LOADER & SPINNER STYLES
 * =================================================================
 */
.loader {
    width: 4rem; /* 16px * 4 = 64px */
    height: 4rem;
    border-width: 4px;
    border-style: solid;
    border-radius: 9999px; /* rounded-full */
    border-color: #e5e7eb; /* border-gray-200 */
    animation: spin 1s linear infinite;
    border-top-color: var(--color-primary);
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/*
 * =================================================================
 * AI-GENERATED CONTENT STYLES
 * =================================================================
 */
#financial-analysis-content.prose h2,
#undervalued-analysis-content.prose h2 {
    margin-top: 1.75em;
    margin-bottom: 1em;
}

#financial-analysis-content.prose h3,
#undervalued-analysis-content.prose h3 {
    margin-top: 1.5em;
    margin-bottom: 0.5em;
}

#financial-analysis-content.prose p,
#undervalued-analysis-content.prose p,
#financial-analysis-content.prose ul,
#undervalued-analysis-content.prose ul {
    margin-bottom: 1em;
}

/* Enhanced list styling for better modal display */
#financial-analysis-content.prose ul,
#undervalued-analysis-content.prose ul {
    padding-left: 1.5em; /* Add indentation */
    list-style-type: disc; /* Ensure bullets are visible */
}

#financial-analysis-content.prose ul li,
#undervalued-analysis-content.prose ul li {
    margin-bottom: 0.5em; /* Space out list items */
}

/*
 * =================================================================
 * NEW COMPONENT STYLES (v6.0.0)
 * =================================================================
 */

/* Main action button on the home screen */
.btn-main-action {
    padding: 1.5rem 2.5rem;
    font-size: 1.5rem;
    font-weight: 700;
    transition: all 0.3s ease;
}
.btn-main-action:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

/* Portfolio Hierarchy View */
.portfolio-exchange-header {
    background-color: #eef2ff; /* indigo-50 */
    color: #4338ca; /* indigo-800 */
    padding: 0.5rem 1rem;
    font-weight: 600;
    font-size: 0.875rem;
    border-top: 1px solid #e0e7ff; /* indigo-200 */
    border-bottom: 1px solid #e0e7ff; /* indigo-200 */
    position: sticky;
    top: 0;
}
