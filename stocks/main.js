import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithCredential, signOut, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, Timestamp, doc, setDoc, getDoc, deleteDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- App Version ---
const APP_VERSION = "7.6.0"; 

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
    MODAL_PORTFOLIO_MANAGER: 'portfolioManagerModal',
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
    DB_COLLECTION_SECTOR_ANALYSIS: 'sector_analysis_runs',
    DB_COLLECTION_CALENDAR: 'calendar_data',
    DB_COLLECTION_FMP_CACHE: 'fmp_cached_data',
};

// --- NEW (v7.3.0) ---
const SECTOR_ICONS = {
    'Technology': `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12l7-7 7 7M5 12a7 7 0 1114 0M5 12a7 7 0 0014 0" /></svg>`,
    'Health Care': `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>`,
    'Financials': `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>`,
    'Consumer Discretionary': `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>`,
    'Communication Services': `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>`,
    'Industrials': `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>`,
    'Consumer Staples': `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>`,
    'Energy': `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>`,
    'Utilities': `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>`,
    'Real Estate': `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>`,
    'Materials': `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>`
};

// List of comprehensive data endpoints to fetch for caching
const ESSENTIAL_API_FUNCTIONS = ['OVERVIEW', 'GLOBAL_QUOTE'];
const OPTIONAL_API_FUNCTIONS = ['TIME_SERIES_DAILY', 'EARNINGS', 'SMA', 'CASH_FLOW'];
const ALL_API_FUNCTIONS = [...ESSENTIAL_API_FUNCTIONS, ...OPTIONAL_API_FUNCTIONS];

const SECTORS = [
    'Technology', 'Health Care', 'Financials', 'Consumer Discretionary',
    'Communication Services', 'Industrials', 'Consumer Staples',
    'Energy', 'Utilities', 'Real Estate', 'Materials'
];

const FINANCIAL_NEWS_SOURCES = [
    'reuters.com', 'bloomberg.com', 'wsj.com', 'ft.com', 'marketwatch.com',
    'cnbc.com', 'finance.yahoo.com', 'seekingalpha.com', 'themotleyfool.com',
    'investors.com', 'barrons.com', 'forbes.com', 'investopedia.com',
    'benzinga.com', 'zacks.com', 'kiplinger.com', 'thestreet.com',
    'morningstar.com', 'nasdaq.com', 'fool.com', 'businessinsider.com',
    'fortune.com', 'cnn.com', 'foxbusiness.com', 'twst.com',
    'americanbanker.com', 'theinformation.com', 'axios.com', 'asia.nikkei.com',
    'caixinglobal.com', 'economist.com', 'theglobeandmail.com', 'economictimes.indiatimes.com',
    'afr.com', 'tipranks.com', 'businesswire.com', 'prnewswire.com',
    'globenewswire.com', 'apnews.com', 'money.usatoday.com', 'npr.org',
    'theguardian.com', 'bbc.com', 'financialpost.com', 'scmp.com',
    'spglobal.com', 'nytimes.com', 'gurufocus.com', 'streetinsider.com', 'moodys.com'
];

const FINANCIAL_ANALYSIS_PROMPT = [
    "Role: You are a financial analyst AI who excels at explaining complex topics to everyday investors. Your purpose is to generate a rigorous, data-driven financial analysis that is also educational, objective, and easy to understand. Use relatable analogies to clarify financial concepts (e.g., comparing debt to a mortgage). Your analysis must be derived exclusively from the provided JSON data.",
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
    "Begin with a concise, one-paragraph summary written in plain English. For someone in a hurry, what is the most important takeaway about this company's financial health, performance, and overall story as a potential investment?",
    '',
    '## 2. Company Profile (What Do They Actually Do?)',
    '### Business Description',
    "In simple terms, describe the company's business based on the Description, Sector, and Industry from the OVERVIEW data. Avoid jargon.",
    '### Market Snapshot',
    'Present key market-related metrics for context.',
    '- Market Capitalization: $XXX.XX Billion',
    '- 52-Week Price Range: $XX.XX - $XX.XX',
    '- 50-Day Moving Average: $XX.XX',
    '- 200-Day Moving Average: $XX.XX',
    '- Analyst Target Price: $XX.XX',
    '',
    '## 3. Performance & Profitability (How Well Does It Make Money?)',
    "Assess the company's ability to generate profit. Explain all concepts simply.",
    '### 3.1. Revenue & Earnings Trend',
    'Analyze the historical trend of totalRevenue and netIncome. Is the company making more money and keeping more profit over time? Discuss the Year-over-Year (YoY) growth rates for the most recent two years in simple terms.',
    '### 3.2. Profitability Margins & Returns',
    'Explain what ProfitMargin and OperatingMarginTTM mean. For every $100 in sales, how much is actual profit? Analyze the trend in these margins. Are they getting better or worse?',
    "Explain ReturnOnEquityTTM (ROE) and ReturnOnAssetsTTM (ROA) as a grade for the management team. How well are they using shareholder money and company resources to make a profit?",
    '',
    '## 4. Financial Health & Risk (Is the Company on Solid Ground?)',
    "Evaluate the company's financial stability. Use an analogy to explain debt (e.g., like a mortgage on a house).",
    '### 4.1. Liquidity Analysis',
    "Calculate and interpret the Current Ratio. Explain its meaning: Does the company have enough cash and easily-sold assets to pay its bills for the next year?",
    "Calculate and interpret the Quick Ratio. Explain what this reveals about its reliance on selling inventory to pay its bills.",
    '### 4.2. Solvency and Debt Structure',
    "Analyze the Debt-to-Equity Ratio. How much of the company is funded by debt versus shareholder money? Is the trend getting riskier or safer?",
    "Explain the Interest Coverage Ratio simply: From its operating earnings, how many times over can the company pay the interest on its debt? A high number is safer.",
    '',
    '## 5. Cash Flow Analysis (Following the Actual Cash)',
    'Analyze where the company\'s cash came from and where it went. Explain the key difference between "profit" (netIncome) and "cash flow" (operatingCashflow).',
    '### Operating Cash Flow (OCF)',
    'Is the company consistently generating real cash from its main business operations? Is this amount growing?',
    '### Quality of Earnings',
    "Compare operatingCashflow to netIncome. Are the company's profits backed by actual cash? A big difference can be a red flag.",
    '### Investing and Financing Activities',
    "Briefly explain what the company is doing with its cash. Is it reinvesting for growth (capitalExpenditures), paying down debt, or returning money to shareholders (dividendPayout, stock buybacks)?",
    '',
    '## 6. Valuation Analysis (Is the Stock Price Fair?)',
    "Assess if the company's stock price seems expensive, cheap, or reasonable. Explain what the key ratios mean.",
    'Present and interpret the following valuation multiples:',
    '- P/E Ratio (PERatio): Explain this simply (e.g., "The price you pay for $1 of the company\'s profit").',
    '- Forward P/E (ForwardPE): Compare this to the P/E Ratio to see if analysts expect profits to grow or shrink.',
    '- Price-to-Sales Ratio (PriceToSalesRatioTTM)',
    '- Price-to-Book Ratio (PriceToBookRatio)',
    'Briefly discuss what these multiples imply. Is the stock priced for high growth, or is it seen as a stable value company?',
    '',
    '## 7. The Long-Term Investment Thesis: Bull vs. Bear',
    'Conclude with a final synthesis that integrates all the preceding analyses into a clear bull and bear case.',
    '### The Bull Case (Key Strengths & Competitive Edge)',
    'Identify 2-3 of the most significant financial strengths and what they mean for a long-term investor. What is the primary "bull" argument for owning this stock?',
    '### The Bear Case (Potential Weaknesses & Risks)',
    'Identify 2-3 of the most significant weaknesses or financial red flags. What is the primary "bear" argument against owning this stock?',
    '### Final Verdict: The "Moat" and Long-Hold Potential',
    'Based purely on this quantitative analysis, what is the primary story? And what, if anything, in the data suggests the company has a strong competitive advantage (a "moat")? Conclude with a final statement on its profile as a potential long-term holding.'
].join('\n');

const UNDERVALUED_ANALYSIS_PROMPT = [
    'Role: You are a financial analyst AI who excels at explaining complex topics to everyday investors. Your purpose is to conduct a clear, data-driven valuation analysis to determine if a stock is a potential bargain. Use relatable analogies and explain all financial terms simply. Your analysis must be derived exclusively from the provided JSON data.',
    'Output Format: The final report must be in professional markdown format. Use # for the main title, ## for major sections, ### for sub-sections, and bullet points for key data points.',
    'IMPORTANT: Do not include any HTML tags in your output. Generate pure markdown only.',
    '',
    'Conduct a comprehensive valuation analysis for {companyName} (Ticker: {tickerSymbol}) using the financial data provided below. If a specific data point is "N/A" or missing, state that clearly in your analysis.',
    '',
    'JSON Data:',
    '{jsonData}',
    '',
    'Based on the data, generate the following in-depth report:',
    '# Investment Valuation Report: Is {companyName} ({tickerSymbol}) a Bargain?',
    '',
    '## 1. The Bottom Line: Our Verdict',
    'Provide a concise, one-paragraph conclusion that immediately answers the main question: Based on the data, does this stock seem Undervalued, Fairly Valued, or Overvalued? Briefly mention the top 1-2 reasons for this verdict in plain English, considering its fundamentals, health, and market sentiment.',
    '',
    '## 2. Is the Price Fair? (Fundamental & Health Analysis)',
    "Let's look at the company's valuation metrics and financial health to see if the price makes sense.",
    '### 2.1. Valuation Multiples Explained',
    '- **Price-to-Earnings (P/E) Ratio:** [Value from OVERVIEW.PERatio]. Explain this simply: It’s the price you pay for $1 of the company’s profit. Compare the current P/E to the Forward P/E to see if analysts expect profits to rise or fall.',
    "- **Price-to-Book (P/B) Ratio:** [Value from OVERVIEW.PriceToBookRatio]. Explain this as the stock's price compared to the company's net worth on paper. A value under 1.0 can sometimes suggest it's a bargain.",
    '- **Price-to-Sales (P/S) Ratio:** [Value from OVERVIEW.PriceToSalesRatioTTM]. Explain this as the price you pay for $1 of the company’s sales. Is it a good deal, or does it signal low profitability?',
    '### 2.2. Financial Health Check (Debt Load)',
    '- **Debt-to-Equity Ratio:** Calculate this using totalLiabilities / totalShareholderEquity from the most recent annual BALANCE_SHEET. Explain this like a personal debt-to-income ratio. A high number means the company relies heavily on debt, which can be risky.',
    '### 2.3. Value vs. Growth (The PEG Ratio)',
    '- **PEG Ratio:** [Value from OVERVIEW.PEGRatio]. Explain this as the secret weapon for value investors. It balances the P/E ratio with future growth expectations. A PEG ratio under 1.0 is often a green flag for an undervalued growth stock.',
    "### 2.4. Getting Paid to Wait (Dividend Analysis)",
    '- **Dividend Yield:** [Value from OVERVIEW.DividendYield]%. Explain this as the annual return you get from dividends, like interest from a savings account.',
    '- **Is the Dividend Safe?** Calculate the Cash Flow Payout Ratio (dividendPayout / operatingCashflow). Explain what this means for the dividend\'s sustainability. A low number is a good sign.',
    '### 2.5. What Does Wall Street Think?',
    "- **Analyst Target Price:** $[Value from OVERVIEW.AnalystTargetPrice]. How does Wall Street's target price compare to the current price? Is there potential upside according to the pros?",
    '',
    '## 3. Sizing Up the Competition (Relative Value)',
    'A stock might seem cheap or expensive on its own, but how does it look compared to its peers?',
    '- **Industry Context:** Using the `Industry` from the OVERVIEW data, comment on the valuation. For example, are the P/E and P/S ratios high or low for a company in this specific industry? (e.g., "Tech stocks often have higher P/E ratios than banks.") This provides crucial context.',
    '',
    '## 4. Market Mood & Stock Trends (Sentiment & Technicals)',
    "Let's check the stock's recent price trends and what other investors are doing.",
    '### 4.1. The Trend is Your Friend',
    '- **50-Day & 200-Day Moving Averages:** Analyze the stock\'s current trend by comparing the price to these key levels. Is it in a "hot" uptrend or a "cold" downtrend?',
    '### 4.2. Where Does the Price Stand?',
    '- **52-Week Range:** The stock has traded between $[Value from OVERVIEW.52WeekLow] and $[Value from OVERVIEW.52WeekHigh]. Is the price currently near its yearly low (a potential discount) or its high (strong momentum)?',
    '### 4.3. Market Sentiment Check',
    '- **Short Interest:** [Value from OVERVIEW.ShortPercentOutstanding]%. Explain this as the percentage of shares being bet *against* the company. A high number (>10%) is a red flag that many investors expect the price to fall.',
    '- **Insider Ownership:** [Value from OVERVIEW.PercentInsiders]%. Explain this as "skin in the game." When executives and directors own a good chunk of the stock, their interests are better aligned with shareholders.',
    '',
    '## 5. Final Conclusion: The Investment Case',
    'Combine all our findings into a final, clear summary.',
    '- **The Case for a Bargain:** Summarize the key data points (e.g., low P/E, healthy balance sheet, positive trend, strong insider ownership) that suggest the stock is undervalued.',
    '- **The Case for Caution:** Summarize the key risks or red flags (e.g., high debt, high valuation vs. peers, bearish trend, high short interest) that suggest the stock might not be a good deal right now.',
    '- **Final Takeaway:** End with a clear, final statement. For example: "The stock looks like a potential bargain based on its fundamentals and low debt. However, it appears expensive compared to its industry, and high short interest suggests market caution. A patient approach may be warranted."',
    '',
    '**Disclaimer:** This AI-generated analysis is for informational and educational purposes only. It is not financial advice. Data may not be real-time.'
].join('\n');

const NEWS_SENTIMENT_PROMPT = [
    'Role: You are a financial news analyst AI who is an expert at cutting through the noise and explaining what headlines *really* mean for an everyday investor. Your goal is to assess the mood and key narratives surrounding a company based on recent news.',
    'Task: Analyze the sentiment of the following news articles for {companyName} ({tickerSymbol}). IMPORTANT: Process only the articles that include a publication date. Ignore any articles where this date is missing.',
    'For each valid article, you will perform five actions:',
    '1. Extract the publication date (format as YYYY-MM-DD).',
    '2. Classify the sentiment as \'Bullish\' (good news), \'Bearish\' (bad news), or \'Neutral\' (factual).',
    '3. Classify the impact as \'High\', \'Medium\', or \'Low\'. High impact news (like earnings reports, CEO changes, or major lawsuits) is likely to move the stock price.',
    '4. Categorize the news into one of the following themes: \'Financials\', \'Legal/Regulatory\', \'Product/Innovation\', \'Management\', or \'Market\'.',
    '5. Provide a brief, one-sentence summary explaining the key takeaway for a potential investor.',
    '',
    'After analyzing all articles, you will provide a final, overall summary of the news sentiment.',
    '',
    'Output Format:',
    'First, return a JSON array of objects for programmatic use. Each object must have "date", "sentiment", "impact", "category", and "summary" keys. The final JSON array MUST be sorted by impact, from \'High\' down to \'Low\'. This JSON block must be clean, with no text before or after it.',
    'Second, after the JSON block, add a final markdown section titled "## Overall News Pulse". In this section, provide a 2-3 sentence summary of the collective sentiment. Focus on the most impactful news. Are there any recurring themes (e.g., multiple articles about legal troubles or product successes)?',
    '',
    'Articles (JSON format):',
    '{news_articles_json}',
    '',
    '--- START OF EXAMPLE ---',
    'Example JSON Output:',
    '[',
    '  { "date": "2025-07-28", "sentiment": "Bullish", "impact": "High", "category": "Financials", "summary": "The company reported stronger-than-expected earnings, which is a significant positive for profitability." },',
    '  { "date": "2025-07-27", "sentiment": "Bearish", "impact": "High", "category": "Legal/Regulatory", "summary": "A new regulatory investigation creates uncertainty and potentially significant legal and financial risks." },',
    '  { "date": "2025-07-25", "sentiment": "Bearish", "impact": "Medium", "category": "Product/Innovation", "summary": "A key product launch has been delayed by one quarter, potentially affecting next quarter\'s revenue." },',
    '  { "date": "2025-07-26", "sentiment": "Neutral", "impact": "Low", "category": "Management", "summary": "The article factually reports on an upcoming shareholder meeting without offering a strong opinion." }',
    ']',
    '',
    '## Overall News Pulse',
    'The overall news sentiment is mixed but defined by high-impact events. While the strong earnings report is very bullish, it is counter-balanced by a new, high-risk regulatory investigation. The dominant theme is a conflict between strong financial performance and emerging legal risks.',
    '--- END OF EXAMPLE ---'
].join('\n');

const BULL_VS_BEAR_PROMPT = [
    'Role: You are a financial analyst AI who excels at presenting a balanced view. Your task is to explain the two sides of the investment story for {companyName}, acting as a neutral moderator in a debate. Use ONLY the provided JSON data to build your arguments.',
    'Output Format: Use markdown format. Explain each point in simple terms, as if talking to a friend who is new to investing. Create a clear "Bull Case" and a "Bear Case" section, each with 3-5 bullet points supported by specific data from the JSON.',
    '',
    'JSON Data:',
    '{jsonData}',
    '',
    '# The Investment Debate: {companyName} ({tickerSymbol})',
    '',
    '## The Bull Case (The Bright Side: Reasons to be Optimistic)',
    'Construct a positive argument for the company. For each point, state the supporting data and then briefly explain *why* it matters to an investor.',
    'Focus on strengths like:',
    '- **Strong Growth:** Is revenue or profit consistently increasing? (Use INCOME_STATEMENT data).',
    '- **High Profitability:** Is the company a good money-maker? (Use ProfitMargin, ROE from OVERVIEW). Explain ROE as a "grade" for how well management uses shareholder money.',
    '- **Solid Cash Flow:** Is the business generating real cash? (Use operatingCashflow from CASH_FLOW). Explain this as the company\'s "lifeblood".',
    '- **Potential Bargain:** Does the stock seem cheap relative to its earnings or growth? (Use PERatio, PEGRatio from OVERVIEW).',
    '- **Wall Street Optimism:** Does the AnalystTargetPrice suggest significant upside from the current price, indicating that market experts are also bullish?',
    '',
    '## The Bear Case (The Cautious View: Reasons for Concern)',
    'Construct a negative argument for the company. For each point, state the supporting data and explain the potential risk.',
    'Focus on weaknesses like:',
    '- **Heavy Debt Load:** Does the company owe a lot of money? (Use Debt-to-Equity from BALANCE_SHEET). Explain this like having a large mortgage; it can be risky if times get tough.',
    '- **Slowing Growth or Profitability:** Are sales or profits shrinking, potentially falling behind competitors? (Use INCOME_STATEMENT data).',
    '- **Weak Cash Flow:** Is the company burning through cash? (Use CASH_FLOW data).',
    '- **Expensive Stock:** Does the stock seem overpriced for its performance? (Use high valuation multiples from OVERVIEW).',
    '- **Analyst Skepticism:** Is the AnalystTargetPrice near or below the current price, suggesting experts see limited room for growth?',
    '',
    '## The Final Takeaway: What\'s the Core Debate?',
    'Conclude with a 1-2 sentence summary that frames the central conflict for an investor. For example: "The core debate for {companyName} is whether its strong profitability and growth (the bull case) are enough to outweigh its significant debt load and increasing competition (the bear case)."'
].join('\n');

const MOAT_ANALYSIS_PROMPT = [
    'Role: You are a business strategist AI who excels at explaining complex business concepts in simple, relatable terms. Your task is to analyze {companyName}\'s competitive advantages.',
    'Concept: An "economic moat" is a company\'s ability to maintain its competitive advantages and defend its long-term profits from competitors. Think of it like the moat around a castle—the wider the moat, the harder it is for invaders (competitors) to attack.',
    'Output Format: Provide a brief report in markdown. Explain each point simply and conclude with a clear verdict on the moat\'s strength.',
    '',
    'JSON Data:',
    '{jsonData}',
    '',
    '# Economic Moat Analysis: {companyName} ({tickerSymbol})',
    '',
    '## 1. What Gives This Company Its Edge? (Sources of the Moat)',
    'Analyze the data for signs of a durable competitive advantage. Discuss:',
    '- **Return on Invested Capital (ROIC):** Calculate a simplified ROIC using (EBIT / (totalAssets - totalCurrentLiabilities)). Explain this as the "gold standard" for moat analysis: it shows how much profit the company generates for every dollar of capital invested. A consistently high ROIC (>15%) is a strong sign of a moat.',
    '- **Pricing Power:** Are the ProfitMargin and OperatingMarginTTM consistently high? Explain this as a sign that the company can charge more for its products without losing customers, often due to a strong brand or unique technology.',
    '- **Qualitative Clues (Network Effects/Switching Costs):** Analyze the company\'s Description. Does it mention a "platform," "network," or "marketplace" that grows more valuable as more people use it? Does it sell "enterprise software" or "integrated systems" that would be difficult for a customer to switch away from?',
    '- **Shareholder Returns (ROE):** Is the ReturnOnEquityTTM (ROE) high? Explain this as a sign that management is highly effective at turning shareholder money into profits, a hallmark of a well-run company.',
    '',
    '## 2. How Strong is the Castle Wall? (Moat Sustainability)',
    'Assess how sustainable this advantage might be by looking at:',
    '- **Reinvesting in the Business:** Are capitalExpenditures (from CASH_FLOW) significant? Explain this as the company spending money to strengthen its moat, like building higher castle walls.',
    '- **Financial Fortress:** Is the balance sheet strong (low Debt-to-Equity)? A company with low debt is better equipped to survive tough times and fight off competitors.',
    '',
    '## 3. The Verdict: How Wide is the Moat?',
    'Based on all the evidence (quantitative and qualitative), provide a concluding assessment. Classify the moat as "Wide," "Narrow," or "None," and explain what this means for a long-term investor.',
    '- **Wide Moat:** The company has strong, sustainable advantages (like high ROIC and clear network effects) that are very difficult for competitors to copy.',
    '- **Narrow Moat:** The company has some advantages (like good profitability), but they could be overcome by competitors over time.',
    '- **No Moat:** The company has no clear, sustainable competitive advantage and is vulnerable to competition.'
].join('\n');

const DIVIDEND_SAFETY_PROMPT = [
    'Role: You are a conservative income investment analyst AI. Your goal is to explain dividend safety in simple, clear terms for an investor who relies on that income.',
    'Concept: Dividend safety analysis is all about figuring out how likely a company is to continue paying its dividend. A safe dividend is supported by strong earnings and cash flow and isn\'t threatened by high debt.',
    'Output Format: Create a markdown report. Explain each point using simple analogies and conclude with a clear safety rating.',
    '',
    'JSON Data:',
    '{jsonData}',
    '',
    '# Dividend Safety Analysis: {companyName} ({tickerSymbol})',
    '',
    '## 1. The Payout: What Are You Earning?',
    '- **Current Dividend Yield:** [Value from OVERVIEW.DividendYield]%. Explain this as the annual return you get from dividends, like interest from a savings account.',
    '',
    '## 2. Can the Company Afford Its Dividend? (Payout Ratios)',
    'This is the most important test. A company should pay its dividend from the money it actually makes.',
    '- **Free Cash Flow (FCF) Payout Ratio:** Calculate this using (dividendPayout / (operatingCashflow - capitalExpenditures)). Explain this as the most conservative test: "Is the dividend covered by the true discretionary cash left after running and growing the business?" A low ratio here is an excellent sign of safety.',
    '- **Earnings Payout Ratio:** (dividendPayout / netIncome). Explain this as: "For every $1 of profit, how much is paid out as a dividend?" A ratio over 100% means the company is paying out more than it earns, which is a red flag.',
    '',
    '## 3. What is the Track Record? (History & Consistency)',
    'A company\'s past behavior is a good indicator of its future commitment to the dividend.',
    '- **Dividend Growth:** Analyze the trend of dividendPayout over the last several years from the CASH_FLOW statements. Has the company consistently increased its dividend payment? Explain that a history of dividend growth is a powerful sign of a healthy, confident business.',
    '',
    '## 4. Does the Company Have a Safety Net? (Balance Sheet Health)',
    'A strong company can protect its dividend even when times get tough.',
    '- **Debt Load:** How has the Debt-to-Equity ratio (from BALANCE_SHEET) trended? Explain this like a personal mortgage: high or rising debt can put dividend payments at risk if the company needs to prioritize paying back lenders.',
    '- **Cash Cushion:** Examine the trend in cashAndShortTermInvestments (from BALANCE_SHEET). Does the company have a healthy cash pile to fall back on? This acts as a buffer to protect the dividend during a downturn.',
    '',
    '## 5. The Final Verdict: How Safe Are Your Dividend Checks?',
    'Conclude with a clear rating and a simple, one-sentence justification.',
    '- **"Very Safe":** The dividend has a history of growth, is easily covered by free cash flow, and the balance sheet is strong. Like a salary from a very stable job that gives you a raise every year.',
    '- **"Safe":** The dividend is covered, but may lack a long history of growth or there might be a minor concern (like rising debt) to watch. Like a salary from a good job, but the company is taking on some new projects.',
    '- **"At Risk":** The payout ratios are high, the dividend isn\'t growing, and/or the balance sheet is weak. The dividend could be cut if business slows down. Like a salary from a job that is facing financial trouble.'
].join('\n');

const GROWTH_OUTLOOK_PROMPT = [
    'Role: You are a forward-looking equity analyst AI. Your goal is to identify the key signs of future growth for {companyName} and explain them in simple terms.',
    'Concept: Growth outlook analysis tries to answer the question, "Where will this company be in the future?" We look at its history, recent performance, how it invests in itself, and what the market expects.',
    'Output Format: A concise markdown summary of key growth indicators and a concluding outlook.',
    '',
    'JSON Data:',
    '{jsonData}',
    '',
    '# Growth Outlook: {companyName} ({tickerSymbol})',
    '',
    '## 1. What is the Long-Term Track Record? (Historical Growth)',
    'Analyze the annual INCOME_STATEMENT data for the last 3-5 years.',
    '- **Revenue & Earnings Trend:** Has the company consistently grown its totalRevenue and netIncome over the long term? Explain that a proven track record is a strong sign of a durable business.',
    '',
    '## 2. Is the Company Growing Right Now? (Recent Momentum)',
    'Analyze the most recent growth signals from the OVERVIEW data:',
    '- **Quarterly Growth:** What do the QuarterlyRevenueGrowthYOY and QuarterlyEarningsGrowthYOY figures tell us? Explain this as a recent "report card" on the company\'s performance.',
    '',
    '## 3. Are You Paying a Fair Price for Growth? (PEG Ratio)',
    'It\'s important not to overpay for growth. Analyze the valuation of the company\'s growth:',
    '- **PEG Ratio:** [Value from OVERVIEW.PEGRatio]. Explain this as a key metric that balances the stock\'s P/E ratio with its growth rate. A PEG ratio under 1.0 is often considered a sign that the stock is reasonably priced for its growth.',
    '',
    '## 4. Planting Seeds for Future Trees (Reinvestment)',
    'A company must invest today to grow tomorrow. Examine the CASH_FLOW statement for signs of this:',
    '- **Capital Expenditures:** What is the trend in capitalExpenditures? Explain this as the company spending money on new projects, equipment, or technology to fuel future growth.',
    '',
    '## 5. What Does the Market Expect? (Future Outlook)',
    'Interpret the market\'s view on the company\'s growth prospects from the OVERVIEW data:',
    '- **Earnings Expectations (Forward P/E):** Compare the ForwardPE to the current PERatio. If the Forward P/E is lower, it suggests that analysts expect earnings to grow over the next year.',
    '- **Wall Street\'s Target:** How does the AnalystTargetPrice compare to the current stock price? This gives us a hint about how much growth professional analysts are forecasting.',
    '',
    '## 6. Final Outlook: What is the Growth Story?',
    'Based on all the factors above, provide a brief, synthesized outlook. Is this a consistent, long-term grower that is reasonably priced, or is its growth recent and potentially expensive? What is the primary story for a potential investor looking for growth?'
].join('\n');

const RISK_ASSESSMENT_PROMPT = [
    'Role: You are a risk analyst AI. Your job is to act like a cautious inspector, identifying the most significant potential problems or "red flags" for {companyName} and explaining them simply.',
    'Concept: Risk assessment is about looking for potential problems that could hurt a company or its stock price. We will check the company\'s financial health, its stock price valuation, and its business operations for any warning signs.',
    'Output Format: A prioritized, bulleted list in markdown, categorized by risk type. Explain each risk in simple terms.',
    '',
    'JSON Data:',
    '{jsonData}',
    '',
    '# Uncovering the Risks: {companyName} ({tickerSymbol})',
    '',
    '## 1. Financial Risks (Is the Foundation Solid?)',
    'These are risks related to the company\'s balance sheet and cash flow.',
    '- **Debt Load (Leverage):** Is the Debt-to-Equity ratio high? Explain this risk like having a large mortgage; it can become a heavy burden, especially if business slows down.',
    '- **Paying Short-Term Bills (Liquidity):** Is the Current Ratio low (below 1.5)? This could suggest the company might have trouble paying its bills over the next year without selling long-term assets.',
    '- **"Real" Cash vs. "Paper" Profit (Earnings Quality):** Is operatingCashflow significantly lower than netIncome? This can be a red flag that the company\'s reported profits aren\'t turning into actual cash.',
    '- **Dividend Sustainability:** Is the dividendPayout greater than netIncome? This is a major warning sign that the dividend is being funded by debt or cash reserves, not profits, and could be at risk of a cut.',
    '',
    '## 2. Market & Stock Price Risks (Is the Stock Itself Risky?)',
    'These are risks related to the stock\'s price and behavior in the market.',
    '- **Negative Market Sentiment (Short Interest):** Is the ShortPercentOutstanding high (e.g., >10%)? Explain that this means a significant number of investors are betting that the stock price will fall.',
    '- **Volatility (The "Drama" Level):** Is the Beta (from OVERVIEW) greater than 1? This means the stock tends to have bigger price swings (both up and down) than the overall market.',
    '- **Priced for Perfection? (Valuation Risk):** Is the PERatio or PriceToSalesRatioTTM exceptionally high? Explain that a stock price is built on high expectations and could fall sharply if the company delivers even slightly disappointing news.',
    '',
    '## 3. Business Risks (Are There Cracks in the Operations?)',
    'These are risks related to the day-to-day health of the business.',
    '- **Recession Sensitivity (Economic Cycle Risk):** Based on the company\'s Sector, is it "Cyclical" (like automotive or travel) or "Defensive" (like utilities or consumer staples)? Cyclical companies are often hit harder during economic downturns.',
    '- **Losing Steam? (Growth Deceleration):** Is the QuarterlyRevenueGrowthYOY negative or showing a sharp slowdown? This is a key warning sign that the business is facing headwinds.',
    '- **Shrinking Profits? (Margin Compression):** Are profitability margins (ProfitMargin, OperatingMarginTTM) trending downwards? This means it\'s getting harder for the company to make a profit on what it sells.',
    '',
    '## 4. The Bottom Line: What Are the Biggest Worries?',
    'Based on the data, provide a brief, 1-2 sentence summary highlighting the top 2-3 risks an investor should be most aware of.'
].join('\n');

const CAPITAL_ALLOCATORS_PROMPT = `
	Act as a discerning investment strategist focused on management quality, in the style of a shareholder letter from a firm like Constellation Software or Berkshire Hathaway.
	Your task is to analyze one CEO/management team from the {tickerSymbol} sector known for their skill in capital allocation.
	Article Title: "The Capital Allocators: A Deep Dive into the Financial Stewardship of {companyName}'s Leadership"
	1. The CEO's Philosophy:
		○ Introduce the CEO and their stated approach to managing the company's capital. What do they prioritize?
	2. The Track Record: Analyzing the Decisions
		○ Analyze their capital allocation decisions over the last 5-10 years across three key areas:
			§ Reinvestment in the Business: Have their internal investments (R&D, new factories) generated high returns on capital?
			§ Acquisitions (M&A): Has their track record of buying other companies been successful and created value, or have they overpaid?
			§ Returning Capital to Shareholders: How disciplined are they with stock buybacks (buying low) and dividend growth?
	3. The Scorecard & Investment Thesis:
		○ Provide an overall assessment of the management team's skill as capital allocators. Based on their track record, what is the investment thesis for trusting this team to wisely compound shareholder wealth for the future?
Crucial Disclaimer: This article is for informational purposes only and should not be considered financial advice. Readers should consult with a qualified financial professional before making any investment decisions.
`;

const DISRUPTOR_ANALYSIS_PROMPT = `
Act as a senior analyst for a forward-looking investment research publication like The Motley Fool or ARK Invest, known for identifying high-growth, innovative companies. Your new assignment is to write an article for your "Disruptor Deep Dive" series.
For the [SECTOR NAME] sector, your task is to identify one public company that perfectly fits the "disruptor" profile: it has already hit its stride with a proven product and significant traction, but it still has immense potential to disrupt the established leaders and redefine its industry.
Article Title: "Disruptor Deep Dive: How [Company Name] is Rewriting the Rules of the [Sub-Industry] Market"
Your analysis must be structured as follows:
1. Introduction: The Challenger Appears

Briefly introduce the company and its bold, simple mission. What industry is it targeting, and what fundamental problem is it solving?
2. The Old Guard and The Opening

Who are the established, legacy competitors (the "Goliaths")? Briefly describe the "old way" of doing things in this market and explain what inefficiency, technological gap, or customer dissatisfaction created the opening for a disruptor.
3. The Disruptor's Edge: The 'How'

This is the core of the analysis. What is this company's unique advantage or "unfair" edge? Focus on one or two of the following:
Technological Moat: Do they have proprietary technology, a unique platform, or a data advantage that is hard to replicate?
Business Model Innovation: Are they changing how the product/service is sold? (e.g., shifting to a subscription model, creating a marketplace, using a direct-to-consumer approach).
Go-to-Market Strategy: Are they acquiring customers in a novel, cheaper, or more efficient way than the incumbents?
4. 'Hitting Their Stride': The Proof

Provide concrete evidence that this company is past the purely speculative stage. What are the key performance indicators (KPIs) that prove they are executing successfully? (e.g., exponential revenue growth, accelerating customer adoption, major strategic partnerships, achieving positive cash flow, etc.).
5. The Path to Dominance: The Future

What is the long-term bull case? Analyze the Total Addressable Market (TAM) they are pursuing. What are the next steps in their strategy? What are the primary risks or hurdles (e.g., competition waking up, regulatory threats, execution risk) that could derail their ascent?
6. Investment Thesis Summary

Conclude with a concise summary for an investor. In 2-3 sentences, what is the core reason to be bullish on this company's long-term potential, and what is the main risk to watch out for?

The tone should be insightful and optimistic about innovation, but grounded in business fundamentals and realistic about the challenges of disruption.
`;

const MACRO_PLAYBOOK_PROMPT = `
Act as a thematic investment strategist for a global macro fund. You are authoring a new report for your "Macro Playbook" series.
	1. The Wave (The Macro Trend):
		- Start by identifying and explaining one powerful, multi-year macro or societal trend. (e.g., The Electrification of Everything, The On-Shoring of Manufacturing, The Rise of the Global Middle Class, The Aging Population). Provide data on the size and expected growth of this trend.
	2. The 'Surfboard' (The Company):
		- Within the [SECTOR NAME] sector, identify 1 company that is a best-in-class, pure-play beneficiary of this macro wave. Explain why its business model is perfectly aligned to capture the growth from this trend.
	3. Quantifying the Tail-Wind:
		- How much of the company's current and projected revenue growth can be attributed directly to this macro trend? How does management talk about this trend in their investor presentations and earnings calls?
	4. Thesis Risks (When the Wave Breaks):
		- What could disrupt this thesis? Could the macro trend fizzle out, could government policy change, or could a new technology allow competitors to ride the wave more effectively?
	5. Conclusion: Investing in a Megatrend
		- Conclude with a summary of why owning this specific company is a smart and direct way for a long-term investor to gain exposure to this powerful, enduring global trend.
`;

// --- NEW NARRATIVE SECTOR PROMPTS (v7.2.0) ---

const TECHNOLOGY_SECTOR_PROMPT = `
Act as a lead writer for a publication like Bloomberg Businessweek or the Financial Times, where deep tech analysis meets savvy market commentary. Your editor has commissioned a major feature article called "The Tech Investor's Playbook for 2025." The goal is to give readers a clear-eyed guide to the technologies defining the rest of the decade and the investment landscape surrounding them.

Using your web search capabilities, focus on 3-4 key technology sectors that are moving from hype into real-world application and revenue generation. Examples could include the operationalization of AI in enterprise software, the emerging consumer hardware for spatial computing, the platform wars in robotics, or breakthroughs in battery and grid-scale energy storage.

For each sector, provide a comprehensive analysis covering two distinct angles:

1. The Technology Report:

The State of Play: What are the tangible, real-world products or services emerging right now?

The Key Players: Who are the dominant public companies, and who are the surprising private challengers or startups to watch?

The Road Ahead: What are the immediate challenges, regulatory hurdles, or controversies shaping the future of this tech?

2. The Investment Angle:

The Value Chain: Where is the money being made? Is it in the hardware, the software, the data, the integration services, or the raw materials? (e.g., In AI, is the value in the chips, the foundation models, or the application layer?)

Market Thesis: Based on your analysis, what is a smart investment thesis for this sector? This should focus on types of companies or sub-sectors that are well-positioned for growth (e.g., "investing in the 'picks and shovels' of AI" or "focusing on companies that bridge the physical and digital worlds").

Risk Factors: What are the specific risks investors should be aware of in this sector, such as new competition, technological obsolescence, or changing regulations?

Conclusion:
Conclude the article with a powerful synthesis. Based on your reporting, which single technology trend offers the most compelling risk/reward profile for an investor over the next five years, and why?

Crucial Disclaimer:
End the article with a clear and prominent disclaimer, such as: "This article is for informational purposes only and should not be considered financial advice. Readers should consult with a qualified financial professional before making any investment decisions."

The tone should be authoritative, analytical, and grounded in verifiable market data and trends.
`;
const HEALTH_CARE_SECTOR_PROMPT = `
Act as a senior analyst and writer for a specialized publication like STAT News or Fierce Biotech, where deep scientific understanding meets sharp market analysis. Your editor has tasked you with a major feature: "The Healthcare Investor's Playbook for the Next Decade." Your mission is to identify the most transformative areas of medicine and biotech that are moving from the lab into the clinic and marketplace.

Using your web search capabilities, focus on 3-4 of the most promising domains in healthcare innovation. Examples could include gene editing therapies (CRISPR), the GLP-1 revolution in metabolic disease, AI-driven drug discovery, personalized oncology (e.g., CAR-T), or neurotechnology for brain-computer interfaces.

For each domain, create a comprehensive analysis with two distinct sections:

1. The Clinical & Scientific Report:

The Breakthrough: In layman's terms, what is the core scientific innovation, and why is it reaching a critical inflection point now?

The Key Players: Who are the pioneering academic labs, the disruptive biotech startups, and the established pharmaceutical giants leading this space?

The Regulatory Pathway: What is the status of clinical trials (e.g., Phase I, II, III)? What are the major hurdles with regulatory bodies like the FDA or EMA that must be overcome?

2. The Investment Angle:

The Value Chain: Where is the primary value being created? Is it in the intellectual property (patents), the diagnostic tools, the manufacturing process, the data platforms that personalize treatment, or the final therapeutic drug itself?

Market Thesis: What is a compelling investment thesis for this domain? Should investors focus on diversified "platform" companies with multiple shots on goal, single-asset biotechs with blockbuster potential, or the "picks and shovels" companies that supply the entire sector?

Risk Factors: What are the unique risks? Be specific about the potential for clinical trial failures, unexpected side effects, patent disputes, challenges with insurance reimbursement, and competition from other emerging treatments.

Conclusion:
To conclude, provide a powerful synthesis. Based on your analysis, which single healthcare domain offers the most compelling long-term risk/reward profile for an investor, and why?

Crucial Disclaimer:
At the end of the article, you must include a clear and prominent disclaimer: "This article is for informational purposes only and should not be considered financial or medical advice. Readers should consult with qualified financial and healthcare professionals before making any decisions."

The tone should be authoritative and analytical, grounded in peer-reviewed science, clinical trial data, and sober market analysis.
`;
const FINANCIALS_SECTOR_PROMPT = `
Act as a senior financial analyst and contributing editor for a publication like The Wall Street Journal or Bloomberg, known for rigorous analysis of the financial markets. Your editor has greenlit a cornerstone article for the quarter: "The Future of Money: An Investor's Playbook for the Financials Sector." The objective is to cut through the noise and identify the most durable investment themes in a sector being fundamentally reshaped.

Using your web search capabilities, identify and analyze 3-4 of the most significant trends disrupting and defining the financial industry today. Potential topics could include the integration of AI in wealth management and trading, the rise of embedded finance, the ongoing battle between FinTech and incumbent banks, the evolution of digital payments, or the maturation of Decentralized Finance (DeFi) and its link to traditional markets.

For each trend, construct a detailed two-part analysis:

1. The Sector Disruption Report:

The Market Shift: What is the fundamental change occurring? Describe the "old way" versus the "new way" and explain the technological or behavioral drivers behind this shift.

The Key Players: Profile the landscape of companies involved. Include the incumbent giants (e.g., JPMorgan, Visa), the agile FinTech challengers (e.g., Stripe, Plaid, SoFi), and the essential infrastructure providers (e.g., core banking software, API connectors).

The Regulatory and Adoption Hurdles: What are the primary obstacles? Discuss specific regulatory pressures from bodies like the SEC, the Fed, or international counterparts. Analyze the challenges of achieving mainstream consumer trust and adoption.

2. The Investment Angle:

The Value Chain: Where is the profit concentrated? Is it in charging transaction fees, licensing software (SaaS models), earning interest spreads, managing assets, or providing the secure infrastructure that underpins it all?

Market Thesis: Formulate a clear investment thesis for this trend. Should investors favor the disruptive startups with high growth potential, the resilient incumbents who are successfully adapting, or the critical "picks and shovels" infrastructure players?

Risk Factors: What are the specific financial risks to consider? Analyze factors like sensitivity to interest rates, credit cycle exposure, the threat of regulatory crackdowns, cybersecurity vulnerabilities, and high valuations among the newer players.

Conclusion:
Conclude with a decisive synthesis. Of the trends you analyzed, which one presents the most compelling risk/reward profile for a portfolio over the next five to seven years, and why?

Crucial Disclaimer:
The article must conclude with a clear and prominent disclaimer: "This article is for informational purposes only and should not be considered financial advice. Readers should consult with a qualified financial professional before making any investment decisions."

The tone should be authoritative, insightful, and grounded in hard market data, regulatory filings, and established financial principles.
`;
const CONSUMER_DISCRETIONARY_SECTOR_PROMPT = `
Act as a senior consumer trends and market strategist for a publication like Bloomberg or The Economist Intelligence Unit, known for connecting macroeconomic trends with consumer behavior. You're writing a lead feature titled: "Beyond the Hype: An Investor's Playbook for the Modern Consumer." The goal is to identify durable investment theses in a sector defined by fickle tastes and economic sensitivity.

Using your web search capabilities, identify and analyze 3-4 of the most powerful trends shaping the consumer discretionary landscape. Potential areas could include the "experience economy" (travel, events, dining), the bifurcation of retail into luxury vs. value, the impact of AI on personalization and e-commerce, the rise of direct-to-consumer (DTC) brands, or the growing influence of sustainability and ethical consumption.

For each trend, provide a detailed two-part analysis:

1. The Consumer Shift Report:

The Behavioral Shift: What is the fundamental change in consumer psychology or spending habits? Explain the "why" behind this shift—is it driven by technology, social media, economic pressures, or changing values post-pandemic?

The Key Players: Who is winning and losing? Profile the legacy giants (e.g., Amazon, LVMH, McDonald's), the disruptive DTC brands challenging the status quo, and the enabling platforms (e.g., Shopify, social media marketplaces).

The Headwinds and Fickle Tastes: What are the primary obstacles? Analyze the impact of inflation on disposable income, supply chain vulnerabilities, high marketing costs, and the extreme speed at which consumer trends can appear and vanish.

2. The Investment Angle:

The Brand & Margin Analysis: Where does the real value lie? Is it in the brand equity that commands a price premium (like a luxury moat), manufacturing and supply chain efficiency, control over customer data, or a recurring revenue model?

Market Thesis: Formulate a clear investment thesis. Should investors prioritize companies with unshakeable brand loyalty, asset-light platforms that cater to many brands, or low-cost leaders who thrive in economic downturns?

Risk Factors: What are the specific risks inherent to this sector? Focus on high sensitivity to the economic cycle (recession risk), the threat of brand dilution or scandal, intense competition with low barriers to entry, and shifts in consumer taste.

Conclusion:
Conclude with a strong, forward-looking synthesis. Of the trends analyzed, which one offers the most resilient risk/reward profile for an investor navigating the economic uncertainties of the next five years, and why?

Crucial Disclaimer:
The article must end with a clear and prominent disclaimer: "This article is for informational purposes only and should not be considered financial advice. Readers should consult with a qualified financial professional before making any investment decisions."

The tone should be authoritative and analytical, grounded in consumer sentiment data, retail sales figures, and corporate financial reports.
`;
const COMMUNICATION_SERVICES_SECTOR_PROMPT = `
Act as a senior TMT (Technology, Media, & Telecom) analyst for a publication like The Wall Street Journal or the Financial Times. Your editor has commissioned a definitive feature for the current market, titled: "The Attention Economy: An Investor's Playbook for Communication Services." Your goal is to dissect the sector's main pillars—connectivity, content, and platforms—to find the most compelling investment theses for the years ahead.

Using your web search capabilities, identify and analyze 3-4 of the most significant trends shaping the Communication Services sector as of late 2025. Potential topics could include the shifting economics of the streaming wars, the monetization of the creator economy, the battle for dominance in interactive entertainment (gaming and virtual worlds), the future of advertising in a privacy-focused world, or the return on investment from 5G and fiber infrastructure.

For each trend, provide a detailed two-part analysis:

1. The Media & Connectivity Report:

The Battle for Engagement: Describe the fundamental shift in how people consume media, interact, and spend their time. Who is gaining or losing "share of attention," and what technological or cultural forces are driving this?

The Key Players (Pipes, Content, & Platforms): Profile the main competitors. Clearly distinguish between the "Pipes" (the foundational telecom and cable companies like AT&T, Verizon), the "Content" (the media and entertainment creators like Disney, Netflix), and the "Platforms" (the interactive social/search giants like Meta and Alphabet/Google).

The Content, Churn, and Regulatory Crosswinds: What are the major challenges? Analyze issues like escalating content production costs, high subscriber churn rates, net neutrality debates, and the growing threat of antitrust and data privacy regulation for the dominant platforms.

2. The Investment Angle:

Monetization Models & Moats: Where is the profit being generated? Is it through recurring subscription fees (SaaS), advertising revenue, licensing valuable intellectual property (IP), in-app/in-game purchases, or the reliable fees from providing core connectivity? What is the most durable competitive moat: the infrastructure, the content library, or the user network effect?

Market Thesis: Formulate a clear investment thesis. In the current environment, is the smarter bet on the predictable cash flows of the "pipes," the high-risk/high-reward growth of "content" creators, or the dominant, high-margin "platforms"?

Risk Factors: What are the specific risks associated with each model? Analyze factors like cyclicality of the advertising market, content pipeline failures (e.g., a movie flopping), subscriber fatigue, technological disruption from new apps, and major regulatory action.

Conclusion:
Conclude with a decisive synthesis. In the current battle for attention, does the greatest risk-adjusted opportunity for investors lie with the owners of the pipes, the creators of content, or the masters of the platforms? Justify your choice based on your analysis.

Crucial Disclaimer:
The article must end with a clear and prominent disclaimer: "This article is for informational purposes only and should not be considered financial advice. Readers should consult with a qualified financial professional before making any investment decisions."

The tone should be authoritative and strategic, grounded in subscriber data, advertising market trends, and an understanding of the sector's unique regulatory landscape.
`;
const INDUSTRIALS_SECTOR_PROMPT = `
Act as a senior industrial and economic analyst for a publication like The Wall Street Journal or Barron's, respected for your deep understanding of the cyclical and capital-intensive nature of the industrial economy. Your editor has assigned a lead feature for the third quarter of 2025: "Rebuilding the World: An Investor's Playbook for the Modern Industrial Renaissance." The objective is to look past the headlines and identify the most durable investment theses in the sector that forms the literal backbone of our economy.

Using your web search capabilities, identify and analyze 3-4 of the most powerful macro trends driving the Industrials sector in mid-2025. Potential themes should include the ongoing re-shoring and factory build-out in North America and Europe, the massive capital spending on electrification and green energy infrastructure, the widespread adoption of automation and robotics (Industry 4.0), or the peak spending cycle from government infrastructure modernization programs.

For each trend, provide a detailed two-part analysis:

1. The Macro & Modernization Report:

The Driving Force: What is the primary catalyst for this trend? Is it driven by geopolitical realignment (e.g., US-China relations), government policy (e.g., the Bipartisan Infrastructure Law), or a technological imperative (e.g., the need for automation to solve labor shortages)?

The Key Players: Who are the corporate leaders executing on this trend? Profile the diversified legacy giants (e.g., Caterpillar, Siemens), the specialized leaders in a niche (e.g., in robotics, electrical components, or engineering services), and the critical suppliers of equipment and raw materials.

The Backlog, Bottlenecks, and Cyclical Risks: What is the health of the order books (the "backlog") for these companies? What are the primary bottlenecks—be it skilled labor, raw materials, or regulatory permits? How vulnerable is this trend to a potential economic slowdown?

2. The Investment Angle:

The Profit & Cyclicality Profile: Where is the most defensible profit made in this value chain? Is it in the initial sale of heavy equipment, in high-margin consumable parts, in long-term service and maintenance contracts (e.g., aerospace), or in project management? Crucially, how does the business model hold up during different phases of the economic cycle?

Market Thesis: Formulate a clear investment thesis. Should investors favor the highly cyclical "pure-plays" that offer maximum exposure to a trend, the diversified giants that can weather a downturn, or the companies with significant, stable, recurring service revenue?

Risk Factors: What are the specific risks inherent to industrial operations? Analyze factors such as sensitivity to GDP growth and interest rates, execution risk on massive projects, volatility in commodity prices, and reliance on government spending and contracts.

Conclusion:
Conclude with a strategic outlook. Of the industrial trends you analyzed, which one offers the most durable risk/reward profile for an investor looking through to the end of the decade, considering the ever-present threat of economic cycles?

Crucial Disclaimer:
The article must end with a clear and prominent disclaimer: "This article is for informational purposes only and should not be considered financial advice. Readers should consult with a qualified financial professional before making any investment decisions."

The tone should be authoritative and pragmatic, grounded in macroeconomic data, industrial production figures, and corporate order backlogs.
`;
const CONSUMER_STAPLES_SECTOR_PROMPT = `
Act as a senior equity analyst specializing in consumer goods for a publication like The Wall Street Journal or Bloomberg Intelligence. Your editor has assigned a feature for your Q3 2025 report titled: "The Essential Dollar: An Investor's Playbook for Consumer Staples." The goal is to analyze which companies are best positioned to defend their margins and market share in an environment of cautious consumer spending and intense competition.

Using your web search capabilities, identify and analyze 3-4 of the most critical trends shaping the Consumer Staples sector in mid-2025. Key themes should include the ongoing tug-of-war between branded products and private labels, the strategic use of automation and AI in supply chains, the persistent consumer shift towards health & wellness or sustainable products, and the evolution of online grocery and direct-to-consumer (DTC) channels.

For each trend, provide a detailed two-part analysis:

1. The Shopper & Shelf-Space Report:

The Consumer & Cost Pressure: What is the core dynamic at play? Is it consumers "trading down" to cheaper alternatives to combat budget fatigue? Is it a demand for new, "better-for-you" products? How are shopping habits (online vs. in-store) evolving for essential goods?

The Key Players & Power Dynamics: Profile the main actors. This must include the Brand Giants (e.g., Procter & Gamble, Nestlé, Coca-Cola), the Retail Titans who control the physical and digital shelf space (e.g., Walmart, Costco, Kroger), and the rising threat of their own Private Label products (e.g., Kirkland Signature, Great Value).

The Margin Squeeze and Supply Chain Hurdles: What are the primary operational challenges? Analyze the struggle to protect profit margins against volatile input/commodity costs, intense pricing pressure from powerful retailers, and the need for constant investment in logistics and supply chain resilience.

2. The Investment Angle:

The Brand Moat & Pricing Power Analysis: Where is the most durable value created? Is it through the brand loyalty that allows for price increases without losing customers (i.e., "pricing power")? Is it through unmatched scale and operational efficiency that lowers costs? Or is it through innovation in high-growth niches?

Market Thesis: Formulate a clear investment thesis. In the current economic climate, should investors favor the diversified giants with massive scale, the nimble innovators capturing new health-conscious trends, or the dominant retailers who are effectively becoming their own competition?

Risk Factors: What are the specific risks for a staples company? Analyze the potential for market share erosion to private labels, margin compression from the inability to pass on costs, shifts in consumer taste away from legacy products, and currency exchange rate volatility for these global corporations.

Conclusion:
Conclude with a defensive-minded synthesis. For an investor seeking stability and dividend safety in the current economic climate, which trend or type of company within the staples sector offers the most resilient and defensive risk/reward profile for the next several years?

Crucial Disclaimer:
The article must end with a clear and prominent disclaimer: "This article is for informational purposes only and should not be considered financial advice. Readers should consult with a qualified financial professional before making any investment decisions."

The tone should be pragmatic and analytical, grounded in consumer price index (CPI) data, retail scanner data, and corporate margin analysis.
`;
const ENERGY_SECTOR_PROMPT = `
Act as a senior energy market analyst for a top-tier publication like BloombergNEF or The Wall Street Journal, known for your pragmatic view on the global energy landscape. For your Q3 2025 outlook, you are writing a feature article titled: "Powering the Future: An Investor's Playbook for the Great Energy Transition." The objective is to analyze the entire energy value chain—from fossil fuels to renewables—to identify where the most compelling risk-adjusted returns can be found.

Using your web search capabilities, identify and analyze 3-4 of the most critical trends shaping the global energy sector in mid-2025. Key themes should include the deployment of capital from traditional oil & gas profits, the challenge of making renewable projects profitable at scale, the emerging economics of hydrogen and carbon capture, the critical build-out of grid infrastructure, or the ongoing impact of geopolitics on commodity prices.

For each trend, provide a detailed two-part analysis:

1. The Technology & Policy Report:

The Driving Force: What is the primary catalyst for this trend? Is it geopolitical necessity (e.g., ensuring energy security), government policy (e.g., incentives from the Inflation Reduction Act), or a technological breakthrough (e.g., improved battery storage efficiency)?

The Key Players: Profile the company landscape. Clearly distinguish between the Integrated Oil Majors (e.g., ExxonMobil, Shell), the Pure-Play Renewable Developers (e.g., NextEra Energy), the critical Energy Services & Equipment providers (e.g., SLB, Baker Hughes), and the Midstream/Infrastructure operators.

The Execution, Integration, and Regulatory Hurdles: What are the real-world obstacles? Analyze the challenges of executing massive, multi-year projects on budget, integrating intermittent renewable sources into the existing power grid, and navigating the complex and lengthy process of environmental permitting.

2. The Investment Angle:

The Capital Cycle & Cash Flow Analysis: Where are we in the capital investment cycle for this trend (boom, bust, or equilibrium)? What is the nature of the cash flow—is it highly variable and tied to volatile commodity prices, or is it stable and secured by long-term power purchase agreements (PPAs)?

Market Thesis: Formulate a clear investment thesis. Should investors prioritize the immense free cash flow of traditional energy players, the high-growth potential of renewable developers, or the "picks and shovels" service companies that stand to benefit from all forms of energy investment?

Risk Factors: What are the specific risks? Analyze the acute threat of commodity price volatility, project cost overruns, sudden shifts in government policy or subsidies, long-term stranded asset risk for fossil fuel infrastructure, and technological obsolescence.

Conclusion:
Conclude with a strategic assessment of the "energy trilemma." For an investor balancing the need for near-term energy security, long-term sustainability, and affordability, which part of the energy sector offers the most compelling investment case for the rest of the decade?

Crucial Disclaimer:
The article must end with a clear and prominent disclaimer: "This article is for informational purposes only and should not be considered financial advice. Readers should consult with a qualified financial professional before making any investment decisions."

The tone should be authoritative and deeply informed, balancing an understanding of geopolitics, project economics, and technological potential.
`;
const UTILITIES_SECTOR_PROMPT = `
Act as a senior equity analyst specializing in regulated utilities and power infrastructure for a publication like Barron's or The Wall Street Journal's "Heard on the Street" column. You are writing a lead feature for Q3 2025 titled: "The Quiet Revolution: An Investor's Playbook for America's Utilities." The goal is to analyze how these traditionally conservative companies are navigating a period of unprecedented capital investment and transformation, and to identify the most attractive investment profiles in the current interest rate environment.

Using your web search capabilities, identify and analyze 3-4 of the most significant trends defining the Utilities sector in mid-2025. Key themes should include the massive rate base growth driven by decarbonization, the critical need for grid hardening and modernization in response to extreme weather, the challenges of integrating renewables and battery storage at scale, and the impact of interest rate policy on utility valuations.

For each trend, provide a detailed two-part analysis:

1. The Regulatory & Engineering Report:

The Mandate: What is the primary driver compelling this action? Is it a state-level clean energy mandate, a federal push for grid reliability, or the need to harden infrastructure against specific climate threats (e.g., wildfire risk in the West, hurricane resilience in the Southeast)?

The Key Players & Their Regulators: Profile the types of utilities leading this trend (e.g., vertically integrated, transmission-focused). Critically, analyze the role of their Public Utility Commissions (PUCs). Is the regulatory environment in their service territory considered constructive and favorable to investment?

The Regulatory Lag and Project Execution Risks: What are the major obstacles? Analyze the risk that regulators will not approve rate increases in a timely manner ("regulatory lag") to cover expenses. Assess the utility's track record of executing large, complex infrastructure projects on time and on budget.

2. The Investment Angle:

The Rate Base & Dividend Profile: This is the core of the investment case. How fast is the company projected to grow its rate base (the value of assets on which it can earn a regulated return)? What is the Allowed Return on Equity (ROE) granted by its regulator? How secure is the dividend, and what is its projected growth rate?

Market Thesis: Formulate a clear investment thesis. In the current environment, should investors prioritize utilities with the fastest rate base growth, those operating in the most favorable regulatory states, or those that appear undervalued due to their sensitivity to interest rates?

Risk Factors: What are the specific risks inherent to this sector? Analyze the potential for unfavorable regulatory rulings (rate case denials), rising interest rates making their dividends less attractive, major project cost overruns, and operational or liability risks (e.g., wildfire lawsuits).

Conclusion:
Conclude with a strategic assessment. For an investor seeking a balance of dividend income and capital appreciation, what is the key characteristic to look for in a utility in 2025—is it the scale of its clean energy transition plan, the constructive nature of its relationship with its regulator, or its valuation relative to the bond market?

Crucial Disclaimer:
The article must end with a clear and prominent disclaimer: "This article is for informational purposes only and should not be considered financial advice. Readers should consult with a qualified financial professional before making any investment decisions."

The tone should be conservative and deeply analytical, grounded in regulatory filings, company capital expenditure plans, and macroeconomic interest rate forecasts.
`;
const REAL_ESTATE_SECTOR_PROMPT = `
Act as a senior real estate investment analyst for a publication like The Wall Street Journal's property section or Barron's, with a focus on Real Estate Investment Trusts (REITs). You are writing the definitive Q3 2025 feature: "The Great Divergence: An Investor's Playbook for the New Real Estate Market." The objective is to move beyond generalities and provide a clear-eyed analysis of the distinct winners and losers across the major real estate sub-sectors.

Using your web search capabilities, provide an analysis of the current state of the U.S. real estate market by examining 3-4 of the most critical and divergent property sub-sectors. Your analysis must compare and contrast areas like:

The Digital Backbone: Data Centers and Industrial/Logistics real estate.

The Human Element: Multifamily apartments and the Build-to-Rent single-family boom.

The Troubled Core: Downtown office properties.

The Resilient Niche: Sectors like self-storage or healthcare facilities.

For each sub-sector you analyze, provide a detailed two-part report:

1. The Property & Tenant Report:

The Secular Trend: What is the powerful, long-term force shaping this sub-sector? Is it the growth of AI and cloud computing (for data centers), e-commerce and supply chain on-shoring (for industrial), the national housing shortage (for residential), or the persistence of hybrid work (for office)?

The Key Players: Profile the dominant publicly-traded REITs in this space (e.g., Prologis in industrial; Equinix in data centers). Who are the blue-chip leaders, and are there any specialized niche players worth noting?

The Supply, Demand, and Cap Rate Outlook: This is the core of the physical market analysis. Is new construction (supply) keeping pace with, or exceeding, tenant demand? Are vacancy rates rising or falling? And critically, how are property yields ("cap rates") responding to the current interest rate environment and perceived risk?

2. The REIT & FFO Analysis:

The Financial Picture: Analyze the health of the representative REITs. What is the consensus outlook for their Funds From Operations (FFO) growth—the key earnings metric for REITs? How safe is the dividend, and what is the current FFO payout ratio? How leveraged are their balance sheets?

Market Thesis: Formulate a clear investment thesis for this sub-sector. Is it a "growth" play on a durable tech trend, a "value" play on a beaten-down sector with recovery potential, or a "stable income" play on a resilient, needs-based property type?

Risk Factors: What are the specific risks? Analyze the impact of high interest rates on financing and property values, tenant default or vacancy risk, the threat of oversupply in hot markets, and geographic risks such as climate-related costs in coastal states like Florida.

Conclusion:
Conclude with a strategic allocation perspective. In this divergent market of mid-2025, where should an investor looking for a blend of growth and income focus their capital within the real estate sector? Which sub-sector offers the most compelling risk-adjusted return for the next five years?

Crucial Disclaimer:
The article must end with a clear and prominent disclaimer: "This article is for informational purposes only and should not be considered financial advice. Readers should consult with a qualified financial professional before making any investment decisions."

The tone should be authoritative and deeply analytical, grounded in real estate-specific metrics like Funds From Operations (FFO), Net Operating Income (NOI), and capitalization rates.
`;
const MATERIALS_SECTOR_PROMPT = `
Act as a senior commodities and materials analyst for Bloomberg or The Financial Times, respected for your global perspective on supply chains and industrial economies. You are writing the definitive Q3 2025 feature: "The Building Blocks of Tomorrow: An Investor's Playbook for the Materials Sector." Your objective is to dissect the global scramble for critical materials and identify the most strategic investment theses in this highly cyclical and geopolitically sensitive sector.

Using your web search capabilities, identify and analyze 3-4 of the most powerful trends shaping the materials landscape in mid-2025. Key themes should include the demand supercycle for "green metals" (copper, lithium, nickel) driven by the energy transition, the geopolitical imperative to secure critical mineral supply chains, the growth of high-margin specialty chemicals, or the outlook for core cyclical materials tied to global industrial production.

For each trend, provide a detailed two-part analysis:

1. The Global Supply & Demand Report:

The Demand Driver: What is the primary force fueling this trend? Is it decarbonization (e.g., EV and grid-scale battery production), geopolitical strategy (e.g., nations securing their own semiconductor or defense supply chains), or the underlying pulse of the global industrial cycle?

The Key Players: Profile the major producers. Distinguish between the diversified mining giants (e.g., BHP, Rio Tinto), the leading specialty chemical companies (e.g., DuPont, Air Liquide), and the pure-play producers focused on a single strategic commodity (e.g., a leading lithium or copper miner).

The Supply, CAPEX, and Geopolitical Headwinds: What is the outlook for bringing new supply online? Analyze the industry's capital expenditure (CAPEX) cycle and the long lead times for new mines or production facilities. What are the key geopolitical risks, such as resource nationalism, export controls, or trade tariffs?

2. The Investment Angle:

The Cost Curve & Profitability Analysis: This is the core of commodity investing. Where do the key players sit on the global cost curve for their main products? Analyze their production costs (e.g., "All-in Sustaining Costs" for miners) and operating margins to determine their resilience during periods of low commodity prices.

Market Thesis: Formulate a clear investment thesis. For exposure to this trend, should investors favor the diversified, lower-risk giants; the high-beta, pure-play producers; or the more stable, value-added specialty materials companies that are less tied to raw commodity prices?

Risk Factors: What are the specific risks inherent to this sector? Analyze the impact of extreme commodity price volatility, high sensitivity to the global economic cycle (particularly Chinese industrial demand), operational risks (e.g., mining accidents), geopolitical events, and evolving environmental regulations.

Conclusion:
Conclude with a strategic outlook. In the global scramble for the 21st century's resources, which part of the materials value chain—the upstream commodity producers or the downstream, value-added specialty creators—offers the more compelling risk-adjusted return for investors today?

Crucial Disclaimer:
The article must end with a clear and prominent disclaimer: "This article is for informational purposes only and should not be considered financial advice. Readers should consult with a qualified financial professional before making any investment decisions."

The tone should be authoritative and global in scope, grounded in macroeconomic indicators (like Global Manufacturing PMI), commodity price futures, and corporate capital expenditure plans.
`;

// --- Global State ---
let db;
let auth;
let userId;
let firebaseConfig = null;
let appIsInitialized = false;
let alphaVantageApiKey = "";
let fmpApiKey = "";
let geminiApiKey = "";
let searchApiKey = "";
let searchEngineId = "";
let googleClientId = "";
let driveTokenClient = null;
let driveFolderId = null; // Cache for Drive folder
let portfolioCache = [];
let calendarEvents = { earnings: [], ipos: [] };
let calendarCurrentDate = new Date();

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

function get(obj, path, defaultValue = undefined) {
  const value = path.split('.').reduce((a, b) => (a ? a[b] : undefined), obj);
  return value !== undefined ? value : defaultValue;
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
    
    document.getElementById('dashboard-section').classList.remove(CONSTANTS.CLASS_HIDDEN);
    document.getElementById('stock-screener-section').classList.remove(CONSTANTS.CLASS_HIDDEN);
    document.getElementById('sector-screener-section').classList.remove(CONSTANTS.CLASS_HIDDEN);
    document.getElementById('market-calendar-accordion').classList.remove(CONSTANTS.CLASS_HIDDEN);
    
    await renderDashboard();
    displayMarketCalendar();
    renderSectorButtons();
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
    fmpApiKey = document.getElementById('fmpApiKeyInput').value.trim();
    geminiApiKey = document.getElementById(CONSTANTS.INPUT_GEMINI_KEY).value.trim();
    googleClientId = document.getElementById(CONSTANTS.INPUT_GOOGLE_CLIENT_ID).value.trim();
    searchApiKey = document.getElementById(CONSTANTS.INPUT_WEB_SEARCH_KEY).value.trim();
    searchEngineId = document.getElementById(CONSTANTS.INPUT_SEARCH_ENGINE_ID).value.trim();
    const tempFirebaseConfigText = document.getElementById('firebaseConfigInput').value.trim();
    let tempFirebaseConfig;

    if (!alphaVantageApiKey || !fmpApiKey || !geminiApiKey || !googleClientId || !searchApiKey || !searchEngineId || !tempFirebaseConfigText) {
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

    const candidate = data.candidates?.[0];

    if (candidate?.content?.parts?.[0]?.text) {
        return candidate.content.parts[0].text;
    }
    
    if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
        throw new Error(`The API call was terminated. Reason: ${candidate.finishReason}.`);
    }

    console.error("Unexpected Gemini API response structure:", data);
    throw new Error("Failed to parse the response from the Gemini API.");
}

async function callGeminiApiWithTools(contents) {
    if (!geminiApiKey) throw new Error("Gemini API key is not configured.");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;
    const data = await callApi(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contents),
    });

    const candidate = data.candidates?.[0];

    if (candidate?.content) {
        return candidate.content;
    }

    if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
        throw new Error(`The API call was terminated. Reason: ${candidate.finishReason}.`);
    }

    console.error("Unexpected Gemini API response structure:", data);
    throw new Error("Failed to parse the response from the Gemini API with tools.");
}


// --- PORTFOLIO & DASHBOARD MANAGEMENT (v7.4.0) ---

function _renderGroupedStockList(container, stocksWithData, listType) {
    container.innerHTML = ''; 
    if (stocksWithData.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-500 py-8">No stocks in your ${listType}.</p>`;
        return;
    }

    const groupedBySector = stocksWithData.reduce((acc, stock) => {
        const sector = get(stock, 'cachedData.OVERVIEW.Sector', 'Unknown');
        if (!acc[sector]) acc[sector] = [];
        acc[sector].push(stock);
        return acc;
    }, {});

    const sortedSectors = Object.keys(groupedBySector).sort();

    let html = '';
    sortedSectors.forEach(sector => {
        const stocks = groupedBySector[sector].sort((a, b) => a.companyName.localeCompare(b.companyName));
        html += `
            <details class="sector-group">
                <summary class="sector-header">
                    <span>${sanitizeText(sector)}</span>
                    <span class="sector-toggle-icon"></span>
                </summary>
                <div class="sector-content">
                    <ul class="divide-y divide-gray-200">`;
        
        stocks.forEach(stock => {
            const cached = stock.cachedData;
            const quote = get(cached, 'GLOBAL_QUOTE.Global Quote', {});
            
            const priceStr = get(quote, '05. price');
            const changeStr = get(quote, '10. change percent');

            const priceNum = parseFloat(priceStr);
            const changeNum = parseFloat(changeStr);

            const displayPrice = !isNaN(priceNum) ? `$${priceNum.toFixed(2)}` : 'N/A';
            const displayChange = !isNaN(changeNum) ? `${changeNum.toFixed(2)}%` : 'N/A';
            const changeColorClass = !isNaN(changeNum) && changeNum >= 0 ? 'price-gain' : 'price-loss';
            
            const peRatio = get(cached, 'OVERVIEW.PERatio', 'N/A');
            const marketCap = formatLargeNumber(get(cached, 'OVERVIEW.MarketCapitalization', 'N/A'));
            const refreshedAt = cached.cachedAt ? cached.cachedAt.toDate().toLocaleString() : 'N/A';

            html += `
                <li class="dashboard-list-item-detailed">
                    <div class="stock-main-info">
                        <button class="font-bold text-indigo-700 hover:underline" data-ticker="${sanitizeText(stock.ticker)}">${sanitizeText(stock.companyName)}</button>
                        <p class="text-sm text-gray-600">${sanitizeText(stock.ticker)}</p>
                    </div>
                    <div class="stock-metrics">
                        <div><span class="metric-label">Price</span> ${displayPrice}</div>
                        <div class="${changeColorClass}"><span class="metric-label">Change</span> ${displayChange}</div>
                        <div><span class="metric-label">P/E</span> ${peRatio}</div>
                        <div><span class="metric-label">Mkt Cap</span> ${marketCap}</div>
                    </div>
                    <div class="stock-actions">
                         <button class="dashboard-item-edit" data-ticker="${sanitizeText(stock.ticker)}">Edit</button>
                         <p class="text-xs text-gray-400 mt-1" title="Last Refreshed">${refreshedAt}</p>
                    </div>
                </li>`;
        });

        html += `</ul></div></details>`;
    });
    container.innerHTML = html;
}

async function renderDashboard() {
    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = "Loading dashboard...";
    
    const portfolioContainer = document.getElementById('portfolio-snapshot-container');
    const watchlistContainer = document.getElementById('watchlist-container');

    try {
        const querySnapshot = await getDocs(collection(db, CONSTANTS.DB_COLLECTION_PORTFOLIO));
        portfolioCache = querySnapshot.docs.map(doc => doc.data());

        const stockDataPromises = portfolioCache.map(stock => getStockDataFromCache(stock.ticker));
        const results = await Promise.allSettled(stockDataPromises);

        const stocksWithData = portfolioCache.map((stock, index) => {
            if (results[index].status === 'fulfilled') {
                return { ...stock, cachedData: results[index].value };
            }
            return { ...stock, cachedData: null }; // Mark as having no cached data
        }).filter(stock => stock.cachedData); // Only include stocks with data

        const portfolioStocks = stocksWithData.filter(s => s.status === 'Portfolio');
        const watchlistStocks = stocksWithData.filter(s => s.status === 'Watchlist');

        _renderGroupedStockList(portfolioContainer, portfolioStocks, 'portfolio');
        _renderGroupedStockList(watchlistContainer, watchlistStocks, 'watchlist');

        document.getElementById('portfolio-count').textContent = portfolioStocks.length;
        document.getElementById('watchlist-count').textContent = watchlistStocks.length;

    } catch (error) {
        console.error("Error loading dashboard:", error);
        displayMessageInModal(`Failed to load dashboard: ${error.message}`, 'error');
        portfolioContainer.innerHTML = `<p class="text-center text-red-500 p-8">Could not load portfolio data.</p>`;
        watchlistContainer.innerHTML = `<p class="text-center text-red-500 p-8">Could not load watchlist data.</p>`;
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

async function openManageStockModal(stockData = {}) {
    const form = document.getElementById('manage-stock-form');
    form.reset();
    
    if (stockData.isEditMode) {
        // Edit mode
        document.getElementById('manage-stock-modal-title').textContent = `Edit ${stockData.ticker}`;
        document.getElementById('manage-stock-original-ticker').value = stockData.ticker;
        document.getElementById('manage-stock-ticker').value = stockData.ticker;
        document.getElementById('manage-stock-name').value = stockData.companyName;
        document.getElementById('manage-stock-exchange').value = stockData.exchange;
        document.getElementById('manage-stock-status').value = stockData.status || 'Watchlist';
    } else {
        // Add mode
        document.getElementById('manage-stock-modal-title').textContent = 'Add New Stock';
        document.getElementById('manage-stock-original-ticker').value = '';
        document.getElementById('manage-stock-ticker').value = stockData.ticker || '';
        document.getElementById('manage-stock-name').value = stockData.companyName || '';
        document.getElementById('manage-stock-exchange').value = stockData.exchange || '';
        document.getElementById('manage-stock-status').value = 'Watchlist'; // Default to watchlist
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
        status: document.getElementById('manage-stock-status').value.trim(),
    };

    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = "Saving to your lists...";
    
    try {
        // Delete the old document if the ticker has changed
        if (originalTicker && originalTicker !== newTicker) {
            await deleteDoc(doc(db, CONSTANTS.DB_COLLECTION_PORTFOLIO, originalTicker));
        }

        // Save the stock to the portfolio list
        await setDoc(doc(db, CONSTANTS.DB_COLLECTION_PORTFOLIO, newTicker), stockData);

        // Check if the detailed data is cached. If not, fetch and cache it now.
        const cacheDocRef = doc(db, CONSTANTS.DB_COLLECTION_CACHE, newTicker);
        const cacheDocSnap = await getDoc(cacheDocRef);
        if (!cacheDocSnap.exists()) {
            document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `First time setup: Caching data for ${newTicker}...`;
            await fetchAndCacheStockData(newTicker);
        }

        closeModal(CONSTANTS.MODAL_MANAGE_STOCK);
        await renderDashboard();
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
        `Are you sure you want to remove ${ticker} from your lists? This will not delete the cached API data.`,
        async () => {
            openModal(CONSTANTS.MODAL_LOADING);
            document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Deleting ${ticker}...`;
            try {
                await deleteDoc(doc(db, CONSTANTS.DB_COLLECTION_PORTFOLIO, ticker));
                await renderDashboard();
                if(document.getElementById(CONSTANTS.MODAL_PORTFOLIO_MANAGER).classList.contains(CONSTANTS.CLASS_MODAL_OPEN)) {
                    renderPortfolioManagerList(); // Refresh the manager list if it's open
                }
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
    const promises = ALL_API_FUNCTIONS.map(async (func) => {
        let url;
        if (func === 'SMA') {
            url = `https://www.alphavantage.co/query?function=SMA&symbol=${symbol}&interval=daily&time_period=50&series_type=close&apikey=${alphaVantageApiKey}`;
        } else {
            url = `https://www.alphavantage.co/query?function=${func}&symbol=${symbol}&apikey=${alphaVantageApiKey}`;
        }
        const data = await callApi(url);
        if (data.Note || Object.keys(data).length === 0 || data.Information || data["Error Message"]) {
            throw new Error(data.Note || data.Information || data["Error Message"] || `No data returned for ${func}.`);
        }
        return { func, data };
    });

    const results = await Promise.allSettled(promises);
    const failedEssentialFetches = [];

    results.forEach((result, index) => {
        const func = ALL_API_FUNCTIONS[index];
        if (result.status === 'fulfilled' && result.value) {
            dataToCache[func] = result.value.data;
        } else {
            const errorMessage = result.reason ? result.reason.message : 'Unknown error';
            if (ESSENTIAL_API_FUNCTIONS.includes(func)) {
                failedEssentialFetches.push(func);
            }
            console.warn(`Optional fetch failed for ${func} on symbol ${symbol}: ${errorMessage}`);
        }
    });

    if (failedEssentialFetches.length > 0) {
        throw new Error(`Could not retrieve essential data for ${symbol}. Failed to fetch: ${failedEssentialFetches.join(', ')}.`);
    }

    if (!dataToCache.OVERVIEW || !dataToCache.OVERVIEW.Symbol) {
        throw new Error(`Essential 'OVERVIEW' data for ${symbol} could not be fetched or was invalid. The symbol may not be supported.`);
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
        
        const portfolioInfo = portfolioCache.find(s => s.ticker === symbol);
        const status = portfolioInfo ? portfolioInfo.status : null;
        const newCardHtml = renderOverviewCard(refreshedData, symbol, status);

        const oldCard = document.getElementById(`card-${symbol}`);
        if(oldCard) {
             const tempDiv = document.createElement('div');
             tempDiv.innerHTML = newCardHtml;
             oldCard.replaceWith(tempDiv.firstElementChild);
             
             // Re-render sparkline
             const timeSeries = refreshedData.TIME_SERIES_DAILY ? refreshedData.TIME_SERIES_DAILY['Time Series (Daily)'] : null;
             const quoteData = refreshedData.GLOBAL_QUOTE ? refreshedData.GLOBAL_QUOTE['Global Quote'] : {};
             const change = quoteData && quoteData['09. change'] ? parseFloat(quoteData['09. change']) : 0;
             renderSparkline(`sparkline-${symbol}`, timeSeries, change);
        } else { 
            await displayStockCard(symbol);
        }
        await renderDashboard(); // Refresh the main dashboard lists
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
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Checking your lists for ${symbol}...`;
    
    try {
        const docRef = doc(db, CONSTANTS.DB_COLLECTION_PORTFOLIO, symbol);
        if ((await getDoc(docRef)).exists()) {
             displayMessageInModal(`${symbol} is already in your portfolio or watchlist. You can edit it from the dashboard.`, 'info');
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
            isEditMode: false
        };
        
        tickerInput.value = '';
        openManageStockModal(newStock);

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

        const portfolioInfo = portfolioCache.find(s => s.ticker === ticker);
        const status = portfolioInfo ? portfolioInfo.status : null;
        const newCardHtml = renderOverviewCard(stockData, ticker, status);

        document.getElementById(CONSTANTS.CONTAINER_DYNAMIC_CONTENT).insertAdjacentHTML('beforeend', newCardHtml);
        
        const timeSeries = stockData.TIME_SERIES_DAILY ? stockData.TIME_SERIES_DAILY['Time Series (Daily)'] : null;
        const quoteData = stockData.GLOBAL_QUOTE ? stockData.GLOBAL_QUOTE['Global Quote'] : {};
        const change = quoteData && quoteData['09. change'] ? parseFloat(quoteData['09. change']) : 0;
        renderSparkline(`sparkline-${ticker}`, timeSeries, change);

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
        case 'Bullish':
        case 'Positive':
            return { icon: '総', colorClass: 'text-green-600', bgClass: 'bg-green-100', textClass: 'text-green-800' };
        case 'Bearish':
        case 'Negative':
            return { icon: '綜', colorClass: 'text-red-600', bgClass: 'bg-red-100', textClass: 'text-red-800' };
        case 'Neutral':
            return { icon: '', colorClass: 'text-gray-600', bgClass: 'bg-gray-100', textClass: 'text-gray-800' };
        default:
            return { icon: '', colorClass: '', bgClass: '', textClass: '' };
    }
}

function renderNewsArticles(articlesWithSentiment, summaryMarkdown, symbol) {
    const card = document.getElementById(`card-${symbol}`);
    if (!card) return;

    let existingNewsContainer = card.querySelector('.news-container');
    if (existingNewsContainer) existingNewsContainer.remove();

    const newsContainer = document.createElement('div');
    newsContainer.className = 'news-container mt-4 border-t pt-4';

    if (articlesWithSentiment.length === 0) {
        newsContainer.innerHTML = `<p class="text-sm text-gray-500">No recent news articles found in the last 30 days.</p>`;
    } else {
        const impactColorMap = { 'High': 'bg-red-500', 'Medium': 'bg-yellow-500', 'Low': 'bg-blue-500' };
        const articlesHtml = articlesWithSentiment.map(article => {
            const { bgClass: sentimentBg, textClass: sentimentText } = getSentimentDisplay(article.sentiment);
            const impactColor = impactColorMap[article.impact] || 'bg-gray-500';

            return `
                <div class="mb-4 p-4 rounded-lg border border-gray-200 bg-white shadow-sm">
                    <a href="${sanitizeText(article.link)}" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:underline font-semibold block mb-2">${sanitizeText(article.title)}</a>
                    <p class="text-sm text-gray-700 mb-3">"${sanitizeText(article.summary)}"</p>
                    <div class="flex flex-wrap items-center gap-2 text-xs font-medium">
                        <span class="px-2 py-1 rounded-full ${sentimentBg} ${sentimentText}">${sanitizeText(article.sentiment)}</span>
                        <span class="px-2 py-1 rounded-full text-white ${impactColor}">Impact: ${sanitizeText(article.impact)}</span>
                        <span class="px-2 py-1 rounded-full bg-gray-200 text-gray-800">${sanitizeText(article.category)}</span>
                        <span class="px-2 py-1 rounded-full bg-gray-200 text-gray-800">${sanitizeText(article.date)}</span>
                    </div>
                </div>
            `;
        }).join('');
        
        const summaryHtml = summaryMarkdown ? marked.parse(summaryMarkdown) : '';
        newsContainer.innerHTML = `<h3 class="text-lg font-bold text-gray-700 mb-3">Recent News Analysis</h3>${articlesHtml}${summaryHtml}`;
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
        const url = `https://www.googleapis.com/customsearch/v1?key=${searchApiKey}&cx=${searchEngineId}&q=${query}&sort=date&dateRestrict=m[1]`;
        
        const newsData = await callApi(url);
        const validArticles = filterValidNews(newsData.items || []);

        // The API call already restricts to the last month, so we just format the articles we received.
        const recentArticles = validArticles.map(a => {
            const pubDateStr = a.pagemap?.newsarticle?.[0]?.datepublished || a.pagemap?.metatags?.[0]?.['article:published_time'] || a.pagemap?.metatags?.[0]?.date;
            // Use the date if available, but don't filter out the article if it's missing.
            const publicationDate = pubDateStr ? new Date(pubDateStr) : null;
            return { ...a, publicationDate };
        });

        if (recentArticles.length > 0) {
            const articlesForPrompt = recentArticles.slice(0, 10).map(a => ({ 
                title: a.title, 
                snippet: a.snippet,
                publicationDate: a.publicationDate ? a.publicationDate.toISOString().split('T')[0] : 'N/A' 
            }));

            const prompt = NEWS_SENTIMENT_PROMPT
                .replace('{companyName}', companyName)
                .replace('{tickerSymbol}', symbol)
                .replace('{news_articles_json}', JSON.stringify(articlesForPrompt, null, 2));

            const rawResult = await callGeminiApi(prompt);
            
            // Separate JSON from markdown summary
            const jsonMatch = rawResult.match(/```json\n([\s\S]*?)\n```|(\[[\s\S]*\])/);
            const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[2]).trim() : '';
            const summaryMarkdown = rawResult.split(jsonMatch ? jsonMatch[0] : ']').pop().trim();

            const sentiments = JSON.parse(jsonString);
            
            // The prompt asks the AI to return data for the articles we sent.
            // We can add the link back by matching the titles or assuming the order is preserved.
            // Assuming order is preserved is simpler and likely correct.
            if (Array.isArray(sentiments) && sentiments.length === articlesForPrompt.length) {
                const articlesWithSentiment = sentiments.map((sentiment, index) => ({
                    ...sentiment,
                    title: recentArticles[index].title,
                    link: recentArticles[index].link
                }));
                 renderNewsArticles(articlesWithSentiment, summaryMarkdown, symbol);
            } else {
                 renderNewsArticles([], '', symbol); // Fallback if parsing fails
            }
        } else {
             renderNewsArticles([], '', symbol);
        }

    } catch (error) {
        console.error("Error fetching news:", error);
        displayMessageInModal(`Could not fetch news: ${error.message}`, 'error');
        renderNewsArticles([], '', symbol); // Render empty state on error
    } finally {
        button.disabled = false;
        button.textContent = 'Fetch News';
    }
}

// --- UI RENDERING ---

function renderSparkline(canvasId, timeSeriesData, change) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !timeSeriesData) return;
    
    // Destroy previous chart instance if it exists
    const existingChart = Chart.getChart(canvasId);
    if (existingChart) {
        existingChart.destroy();
    }

    const dataPoints = Object.entries(timeSeriesData).map(([date, values]) => ({
        x: new Date(date),
        y: parseFloat(values['4. close'])
    })).sort((a, b) => a.x - b.x);

    if (dataPoints.length < 2) return;

    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                data: dataPoints,
                borderColor: change >= 0 ? '#16a34a' : '#dc2626',
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    intersect: false,
                    mode: 'index',
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day'
                    },
                    display: false
                },
                y: {
                    display: false
                }
            }
        }
    });
}

function renderDailyCalendarView() {
    const dayHeader = document.getElementById('day-header');
    const eventsContainer = document.getElementById('daily-events-container');
    if (!dayHeader || !eventsContainer) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const viewingDate = new Date(calendarCurrentDate);
    viewingDate.setHours(0, 0, 0, 0);

    let dateLabel = viewingDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    if (viewingDate.getTime() === today.getTime()) {
        dateLabel = `Today, ${dateLabel}`;
    }

    dayHeader.textContent = dateLabel;

    const earningsForDay = calendarEvents.earnings.filter(e => new Date(e.eventDate).toDateString() === calendarCurrentDate.toDateString());
    const iposForDay = calendarEvents.ipos.filter(i => new Date(i.eventDate).toDateString() === calendarCurrentDate.toDateString());

    eventsContainer.innerHTML = '';
    let html = '';

    const renderEventList = (events, type) => {
        let listHtml = '';
        const isEarning = type === 'earnings';
        const headerText = isEarning ? 'Upcoming Earnings' : 'Upcoming IPOs';
        const headerColor = isEarning ? 'text-green-700' : 'text-blue-700';
        const itemBg = isEarning ? 'bg-green-50' : 'bg-blue-50';
        const itemBorder = isEarning ? 'border-green-200' : 'border-blue-200';
        const itemTextColor = isEarning ? 'text-green-800' : 'text-blue-800';

        listHtml += `<h3 class="text-lg font-semibold ${headerColor} mb-2 mt-4">${headerText}</h3>`;
        listHtml += '<ul class="space-y-3">';
        events.forEach(e => {
            const fidelityUrl = `https://digital.fidelity.com/prgw/digital/research/quote/dashboard/summary?symbol=${e.symbol}`;
            listHtml += `
                <li class="p-3 ${itemBg} ${itemBorder} rounded-lg">
                    <div class="flex justify-between items-center">
                        <div>
                            <p class="font-bold ${itemTextColor}">${sanitizeText(e.name)} (${sanitizeText(e.symbol)})</p>
                        </div>
                        <div class="flex items-center gap-3 text-xs">
                            <a href="${fidelityUrl}" target="_blank" rel="noopener noreferrer" class="broker-link">Fidelity</a>
                        </div>
                    </div>
                </li>
            `;
        });
        listHtml += '</ul>';
        return listHtml;
    };

    if (earningsForDay.length > 0) {
        html += renderEventList(earningsForDay, 'earnings');
    }

    if (iposForDay.length > 0) {
        html += renderEventList(iposForDay, 'ipos');
    }

    if (html === '') {
        html = '<p class="text-center text-gray-500 py-8">No scheduled events for this day.</p>';
    }

    eventsContainer.innerHTML = html;
}


async function displayMarketCalendar() {
    const eventsContainer = document.getElementById('daily-events-container');
    const dayHeader = document.getElementById('day-header');

    if (!eventsContainer || !dayHeader) return;

    eventsContainer.innerHTML = `<div class="p-4 text-center text-gray-400">Loading calendar data...</div>`;

    function processRawCalendarData(earningsData, ipoData) {
        calendarEvents.earnings = [];
        calendarEvents.ipos = [];
        const symbolRegex = /^[A-Z]{1,4}$/;

        if (earningsData && earningsData.length > 0 && earningsData[0].symbol) {
            calendarEvents.earnings = earningsData
                .filter(e => e.symbol && e.reportDate)
                .filter(e => symbolRegex.test(e.symbol) && !e.name.toUpperCase().includes('OTC'))
                .map(e => ({...e, eventDate: new Date(e.reportDate)}));
        }
        if (ipoData && ipoData.length > 0 && ipoData[0].symbol) {
             calendarEvents.ipos = ipoData
                .filter(i => i.symbol && i.ipoDate)
                .filter(i => symbolRegex.test(i.symbol) && !i.name.toUpperCase().includes('OTC'))
                .map(i => ({...i, eventDate: new Date(i.ipoDate)}));
        }
    }
    
    const docRef = doc(db, CONSTANTS.DB_COLLECTION_CALENDAR, 'latest');
    let shouldFetchNewData = true;

    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const cachedData = docSnap.data();
            const cacheDate = cachedData.cachedAt.toDate();
            const daysSinceCache = (new Date() - cacheDate) / (1000 * 60 * 60 * 24);
            
            if (daysSinceCache < 30) {
                processRawCalendarData(cachedData.earnings, cachedData.ipos);
                shouldFetchNewData = false;
            }
        }
    } catch (dbError) {
        console.error("Error reading calendar cache from Firestore:", dbError);
        // Proceed to fetch new data if cache read fails
    }
    
    if (shouldFetchNewData) {
        try {
            const [earningsResponse, ipoResponse] = await Promise.all([
                fetch(`https://www.alphavantage.co/query?function=EARNINGS_CALENDAR&horizon=3month&apikey=${alphaVantageApiKey}`),
                fetch(`https://www.alphavantage.co/query?function=IPO_CALENDAR&apikey=${alphaVantageApiKey}`)
            ]);

            const earningsCsv = await earningsResponse.text();
            const ipoCsv = await ipoResponse.text();
            
            const rawEarningsData = Papa.parse(earningsCsv, { header: true, skipEmptyLines: true }).data;
            const rawIpoData = Papa.parse(ipoCsv, { header: true, skipEmptyLines: true }).data;
            const symbolRegex = /^[A-Z]{1,4}$/;
            
            const earningsToCache = rawEarningsData
                .filter(e => e.symbol && e.reportDate && symbolRegex.test(e.symbol) && !e.name.toUpperCase().includes('OTC'))
                .map(e => ({ symbol: e.symbol, name: e.name, reportDate: e.reportDate }));
            
            const iposToCache = rawIpoData
                .filter(i => i.symbol && i.ipoDate && symbolRegex.test(i.symbol) && !i.name.toUpperCase().includes('OTC'))
                .map(i => ({ symbol: i.symbol, name: i.name, ipoDate: i.ipoDate }));

            const dataToCache = { 
                earnings: earningsToCache, 
                ipos: iposToCache, 
                cachedAt: Timestamp.now() 
            };
            await setDoc(docRef, dataToCache);

            processRawCalendarData(earningsToCache, iposToCache);

        } catch (apiError) {
            console.error("Error fetching calendar data from API:", apiError);
            eventsContainer.innerHTML = `<div class="p-4 text-center text-red-500">Could not load calendar data. The API might be unavailable.</div>`;
            dayHeader.textContent = 'Error';
            return;
        }
    }

    renderDailyCalendarView();
}

function renderSectorButtons() {
    const container = document.getElementById('sector-buttons-container');
    if (!container) return;
    container.innerHTML = SECTORS.map(sector => {
        const icon = SECTOR_ICONS[sector] || '';
        return `
            <button class="flex flex-col items-center justify-center p-4 text-center bg-sky-100 text-sky-800 hover:bg-sky-200 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-1" data-sector="${sanitizeText(sector)}">
                ${icon}
                <span class="mt-2 font-semibold text-sm">${sanitizeText(sector)}</span>
            </button>
        `
    }).join('');
}

function renderOverviewCard(data, symbol, status) {
    const overviewData = data.OVERVIEW;
    if (!overviewData || !overviewData.Symbol) return '';

    const quoteData = data.GLOBAL_QUOTE ? data.GLOBAL_QUOTE['Global Quote'] : {};
    const price = quoteData && quoteData['05. price'] ? parseFloat(quoteData['05. price']).toFixed(2) : 'N/A';
    const change = quoteData && quoteData['09. change'] ? parseFloat(quoteData['09. change']) : 0;
    const changePercent = quoteData && quoteData['10. change percent'] ? parseFloat(quoteData['10. change percent'].replace('%','')).toFixed(2) : 0;
    const changeColorClass = change >= 0 ? 'price-gain' : 'price-loss';
    const changeSign = change >= 0 ? '+' : '';

    let statusBadge = '';
    if (status === 'Portfolio') {
        statusBadge = '<span class="ml-2 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-100 text-green-800">Portfolio</span>';
    } else if (status === 'Watchlist') {
        statusBadge = '<span class="ml-2 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">Watchlist</span>';
    }

    const smaData = data.SMA ? data.SMA['Technical Analysis: SMA'] : null;
    let sma50 = 'N/A';
    if (smaData) {
        const latestSmaDate = Object.keys(smaData)[0];
        if (latestSmaDate) {
            sma50 = parseFloat(smaData[latestSmaDate]['SMA']).toFixed(2);
        }
    }
    
    const marketCap = formatLargeNumber(overviewData.MarketCapitalization);
    const peRatio = overviewData.PERatio !== "None" ? overviewData.PERatio : "N/A";
    const sma200 = overviewData['200DayMovingAverage'] && overviewData['200DayMovingAverage'] !== "None" ? `$${parseFloat(overviewData['200DayMovingAverage']).toFixed(2)}` : "N/A";
    const timestampString = data.cachedAt ? `Data Stored On: ${data.cachedAt.toDate().toLocaleString()}` : '';

    return `
        <div class="bg-white rounded-2xl shadow-lg border border-gray-200 p-6" id="card-${symbol}">
            <div class="flex justify-between items-start gap-4">
                <div>
                    <h2 class="text-2xl font-bold text-gray-800 flex items-center">${sanitizeText(overviewData.Name)} (${sanitizeText(overviewData.Symbol)}) ${statusBadge}</h2>
                    <p class="text-gray-500">${sanitizeText(overviewData.Exchange)} | ${sanitizeText(overviewData.Sector)}</p>
                </div>
                <div class="text-right flex-shrink-0">
                    <p class="text-2xl font-bold">${price}</p>
                    <p class="text-sm font-semibold ${changeColorClass}">${changeSign}${change.toFixed(2)} (${changeSign}${changePercent}%)</p>
                </div>
            </div>
            
            <div class="my-4 h-20 relative">
                <canvas id="sparkline-${symbol}"></canvas>
            </div>

            <p class="mt-4 text-sm text-gray-600">${sanitizeText(overviewData.Description)}</p>
            
            <div class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center border-t pt-4">
                <div><p class="text-sm text-gray-500">Market Cap</p><p class="text-lg font-semibold">${sanitizeText(marketCap)}</p></div>
                <div><p class="text-sm text-gray-500">P/E Ratio</p><p class="text-lg font-semibold">${sanitizeText(peRatio)}</p></div>
                <div><p class="text-sm text-gray-500">50-Day MA</p><p class="text-lg font-semibold">$${sanitizeText(sma50)}</p></div>
                <div><p class="text-sm text-gray-500">200-Day MA</p><p class="text-lg font-semibold">${sanitizeText(sma200)}</p></div>
            </div>

            <div class="mt-6 border-t pt-4 flex flex-wrap gap-2 justify-center">
                <button data-symbol="${symbol}" class="refresh-data-button text-xs bg-indigo-100 text-indigo-700 hover:bg-indigo-200 font-semibold py-1 px-3 rounded-full">Refresh Data</button>
                <button data-symbol="${symbol}" class="view-json-button text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg">View JSON</button>
                <button data-symbol="${symbol}" class="fetch-news-button text-sm bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg">Fetch News</button>
                <button data-symbol="${symbol}" class="undervalued-analysis-button text-sm bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-4 rounded-lg">Undervalued Analysis</button>
                <button data-symbol="${symbol}" class="financial-analysis-button text-sm bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg">Financial Analysis</button>
                <button data-symbol="${symbol}" class="analyst-estimates-button text-sm bg-gray-700 hover:bg-gray-800 text-white font-semibold py-2 px-4 rounded-lg">Analyst Estimates</button>
            </div>
            <div class="mt-4 border-t pt-4 flex flex-wrap gap-2 justify-center">
                <button data-symbol="${symbol}" class="bull-bear-analysis-button text-sm bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg">Bull vs. Bear</button>
                <button data-symbol="${symbol}" class="moat-analysis-button text-sm bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-2 px-4 rounded-lg">Moat Analysis</button>
                <button data-symbol="${symbol}" class="dividend-safety-button text-sm bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-4 rounded-lg">Dividend Safety</button>
                <button data-symbol="${symbol}" class="growth-outlook-button text-sm bg-lime-500 hover:bg-lime-600 text-white font-semibold py-2 px-4 rounded-lg">Growth Outlook</button>
                <button data-symbol="${symbol}" class="risk-assessment-button text-sm bg-rose-500 hover:bg-rose-600 text-white font-semibold py-2 px-4 rounded-lg">Risk Assessment</button>
                <button data-symbol="${symbol}" class="capital-allocators-button text-sm bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg">Capital Allocators</button>
            </div>
            <div class="text-right text-xs text-gray-400 mt-4">${timestampString}</div>
        </div>`;
}

// --- PORTFOLIO MANAGER MODAL ---
function renderPortfolioManagerList() {
    const container = document.getElementById('portfolio-manager-list-container');
    if (!container) return;

    if (portfolioCache.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-500 p-8">No stocks in your portfolio or watchlist.</p>`;
        return;
    }

    const groupedByExchange = portfolioCache.reduce((acc, stock) => {
        const exchange = stock.exchange || 'Unknown';
        if (!acc[exchange]) {
            acc[exchange] = [];
        }
        acc[exchange].push(stock);
        return acc;
    }, {});

    let html = '';
    for (const exchange in groupedByExchange) {
        html += `<div class="portfolio-exchange-header">${sanitizeText(exchange)}</div>`;
        html += '<ul class="divide-y divide-gray-200">';
        groupedByExchange[exchange].forEach(stock => {
            const statusBadge = stock.status === 'Portfolio'
                ? '<span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-100 text-green-800">Portfolio</span>'
                : '<span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">Watchlist</span>';

            html += `
                <li class="p-4 flex justify-between items-center hover:bg-gray-50">
                    <div>
                        <p class="font-semibold text-gray-800">${sanitizeText(stock.companyName)} (${sanitizeText(stock.ticker)})</p>
                        <p class="text-sm text-gray-500">${statusBadge}</p>
                    </div>
                    <div class="flex gap-2">
                        <button class="edit-stock-btn text-sm font-medium text-indigo-600 hover:text-indigo-800" data-ticker="${sanitizeText(stock.ticker)}">Edit</button>
                        <button class="delete-stock-btn text-sm font-medium text-red-600 hover:text-red-800" data-ticker="${sanitizeText(stock.ticker)}">Delete</button>
                    </div>
                </li>
            `;
        });
        html += '</ul>';
    }
    container.innerHTML = html;
}


function openPortfolioManagerModal() {
    renderPortfolioManagerList();
    openModal(CONSTANTS.MODAL_PORTFOLIO_MANAGER);
}

// --- FMP API INTEGRATION (v7.6.0) ---
async function handleFmpAnalystEstimates(symbol) {
    if (!fmpApiKey) {
        displayMessageInModal("Financial Modeling Prep API Key is required for this feature.", "warning");
        return;
    }

    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Fetching Analyst Estimates for ${symbol}...`;

    try {
        const url = `https://financialmodelingprep.com/stable/analyst-estimates/?symbol=${symbol}&period=annual&${fmpApiKey}`;
        const data = await callApi(url);

        if (data.length === 0) {
            throw new Error("No analyst estimate data returned from FMP API.");
        }

        const dataToCache = {
            cachedAt: Timestamp.now(),
            estimates: data
        };

        await setDoc(doc(db, CONSTANTS.DB_COLLECTION_FMP_CACHE, symbol), dataToCache);

        document.getElementById(CONSTANTS.ELEMENT_FULL_DATA_CONTENT).textContent = JSON.stringify(data, null, 2);
        document.getElementById('full-data-modal-title').textContent = `FMP Analyst Estimates for ${symbol}`;
        document.getElementById('full-data-modal-timestamp').textContent = `Data Stored On: ${dataToCache.cachedAt.toDate().toLocaleString()}`;
        openModal(CONSTANTS.MODAL_FULL_DATA);

    } catch (error) {
        console.error("Error fetching FMP analyst estimates:", error);
        displayMessageInModal(`Could not fetch analyst estimates: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}


// --- EVENT LISTENER SETUP ---

function setupGlobalEventListeners() {
    document.getElementById('dashboard-section').addEventListener('click', (e) => {
        const target = e.target.closest('button, summary');
        if (!target) return;

        const ticker = target.dataset.ticker;
        if (ticker) {
            if (target.classList.contains('dashboard-item-edit')) {
                const stockData = portfolioCache.find(s => s.ticker === ticker);
                if (stockData) {
                    openManageStockModal({ ...stockData, isEditMode: true });
                }
            } else {
                displayStockCard(ticker);
            }
        }

        const refreshButton = e.target.closest('.dashboard-refresh-button');
        if (refreshButton) {
            renderDashboard();
        }

        const expandBtn = e.target.closest('.expand-all-btn');
        if (expandBtn) {
            const card = expandBtn.closest('.dashboard-card');
            card.querySelectorAll('details.sector-group').forEach(detail => detail.open = true);
        }

        const collapseBtn = e.target.closest('.collapse-all-btn');
        if (collapseBtn) {
            const card = collapseBtn.closest('.dashboard-card');
            card.querySelectorAll('details.sector-group').forEach(detail => detail.open = false);
        }
    });

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
        if (target.classList.contains('capital-allocators-button')) handleCapitalAllocatorsAnalysis(symbol);
        if (target.classList.contains('analyst-estimates-button')) handleFmpAnalystEstimates(symbol);
    });

    document.getElementById('customAnalysisModal').addEventListener('click', (e) => {
        const target = e.target.closest('button[data-prompt-name]');
        if (target) {
            const sector = target.dataset.sector;
            const promptName = target.dataset.promptName;
            if (promptName === 'MarketTrends') {
                handleSectorAnalysisWithAIAgent(sector);
            } else if (promptName === 'DisruptorAnalysis') {
                handleDisruptorAnalysis(sector);
            } else if (promptName === 'MacroPlaybook') {
                handleMacroPlaybookAnalysis(sector);
            } else {
                handleCreativeSectorAnalysis(sector, promptName);
            }
        }
    });

    document.getElementById('portfolioManagerModal').addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        const ticker = target.dataset.ticker;
        if (!ticker) return;

        if (target.classList.contains('edit-stock-btn')) {
            const stockData = portfolioCache.find(s => s.ticker === ticker);
            if (stockData) {
                openManageStockModal({ ...stockData, isEditMode: true });
            }
        } else if (target.classList.contains('delete-stock-btn')) {
            handleDeleteStock(ticker);
        }
    });
}

function setupEventListeners() {
    document.getElementById(CONSTANTS.FORM_API_KEY)?.addEventListener('submit', handleApiKeySubmit);
    document.getElementById(CONSTANTS.FORM_STOCK_RESEARCH)?.addEventListener('submit', handleResearchSubmit);
    
    document.getElementById('manage-stock-form')?.addEventListener('submit', handleSaveStock);
    document.getElementById('cancel-manage-stock-button')?.addEventListener('click', () => closeModal(CONSTANTS.MODAL_MANAGE_STOCK));
    document.getElementById('delete-stock-button')?.addEventListener('click', (e) => {
        const ticker = document.getElementById('manage-stock-original-ticker').value;
        if(ticker) {
            closeModal(CONSTANTS.MODAL_MANAGE_STOCK);
            handleDeleteStock(ticker);
        }
    });

    document.querySelectorAll('.save-to-drive-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const modalId = e.target.dataset.modalId;
            handleSaveToDrive(modalId);
        });
    });

    const scrollTopBtn = document.getElementById(CONSTANTS.BUTTON_SCROLL_TOP);
    if (scrollTopBtn) scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    document.getElementById('manage-all-stocks-button')?.addEventListener('click', openPortfolioManagerModal);

    const modalsToClose = [
        { modal: CONSTANTS.MODAL_FULL_DATA, button: 'close-full-data-modal', bg: 'close-full-data-modal-bg' },
        { modal: CONSTANTS.MODAL_FINANCIAL_ANALYSIS, button: 'close-financial-analysis-modal', bg: 'close-financial-analysis-modal-bg' },
        { modal: CONSTANTS.MODAL_UNDERVALUED_ANALYSIS, button: 'close-undervalued-analysis-modal', bg: 'close-undervalued-analysis-modal-bg' },
        { modal: CONSTANTS.MODAL_CUSTOM_ANALYSIS, button: 'close-custom-analysis-modal', bg: 'close-custom-analysis-modal-bg' },
        { modal: CONSTANTS.MODAL_MANAGE_STOCK, bg: 'close-manage-stock-modal-bg'},
        { modal: CONSTANTS.MODAL_CONFIRMATION, button: 'cancel-button'},
        { modal: CONSTANTS.MODAL_PORTFOLIO_MANAGER, button: 'close-portfolio-manager-modal', bg: 'close-portfolio-manager-modal-bg' },
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
    
    document.getElementById('sector-buttons-container')?.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (target && target.dataset.sector) {
            handleSectorSelection(target.dataset.sector);
        }
    });

    document.getElementById('prev-day-button')?.addEventListener('click', () => {
        calendarCurrentDate.setDate(calendarCurrentDate.getDate() - 1);
        renderDailyCalendarView();
    });

    document.getElementById('next-day-button')?.addEventListener('click', () => {
        calendarCurrentDate.setDate(calendarCurrentDate.getDate() + 1);
        renderDailyCalendarView();
    });

    document.getElementById('calendar-accordion-toggle')?.addEventListener('click', () => {
        const content = document.getElementById('market-calendar-content');
        const icon = document.getElementById('calendar-toggle-icon');
        content.classList.toggle('hidden');
        icon.classList.toggle('rotate-180');
    });

    setupGlobalEventListeners();
}

// --- SECTOR ANALYSIS: AI AGENT WORKFLOW (v7.0.3) ---

/**
 * Tool 1: Searches for recent news articles for a given financial sector.
 * This tool is declared to the Gemini model, which can then request its execution.
 */
async function searchSectorNews({ sectorName }) {
    if (!searchApiKey || !searchEngineId) {
        throw new Error("Web Search API Key and Search Engine ID are required for news search.");
    }
    const siteQuery = FINANCIAL_NEWS_SOURCES.map(site => `site:${site}`).join(' OR ');
    const query = encodeURIComponent(`"${sectorName} sector" ("earnings report" OR "analyst rating" OR "growth driver" OR "stock upgrade") (${siteQuery})`);
    const url = `https://www.googleapis.com/customsearch/v1?key=${searchApiKey}&cx=${searchEngineId}&q=${query}&sort=date&dateRestrict=d[30]&num=10`;
    
    const newsData = await callApi(url);
    const validArticles = filterValidNews(newsData.items || []);

    if (validArticles.length === 0) {
        // Return a structured error that the model can understand
        return { error: "No relevant news articles found", detail: `Could not find any recent news for the ${sectorName} sector in the last 30 days.` };
    }

    // Return a clean list of articles for the next tool
    return {
        articles: validArticles.map((a, index) => {
            const pubDateStr = a.pagemap?.newsarticle?.[0]?.datepublished || a.pagemap?.metatags?.[0]?.['article:published_time'] || a.pagemap?.metatags?.[0]?.date;
            return {
                title: a.title,
                snippet: a.snippet,
                link: a.link,
                source: a.displayLink,
                publicationDate: pubDateStr ? new Date(pubDateStr).toISOString().split('T')[0] : 'N/A',
                articleIndex: index
            };
        })
    };
}

/**
 * Tool 2: Synthesizes news articles to identify and rank noteworthy companies.
 * This tool is declared to the Gemini model.
 */
async function synthesizeAndRankCompanies({ newsArticles }) {
    const prompt = `
        Role: You are a quantitative financial analyst AI. Your task is to analyze a list of financial news articles and identify the most noteworthy companies based on the significance and sentiment of the news.

        Task:
        1. Read the provided JSON data of news articles.
        2. For each article, extract any mentioned companies, their ticker symbols (if possible), and the context of the mention.
        3. Based on the collective news, identify the Top 3-5 most favorably mentioned companies. Your ranking must be based on the significance (e.g., earnings reports > product updates) and positive sentiment of the news.
        
        Output Format: Return ONLY a valid JSON object. The JSON should have a single key "topCompanies" which is an array of objects. Each object must contain "companyName", "ticker", and a "rankingJustification" that briefly explains why it was ranked highly based on its positive news mentions. Include the source article indices in the justification.

        News Articles JSON Data:
        ${JSON.stringify(newsArticles, null, 2)}
    `;

    const resultText = await callGeminiApi(prompt);
    try {
        // Clean and parse the JSON response from the model
        const cleanedJson = resultText.replace(/```json\n|```/g, '').trim();
        return JSON.parse(cleanedJson);
    } catch (error) {
        console.error("Error parsing synthesis result:", error);
        return { error: "Failed to parse analysis from AI", detail: error.message };
    }
}

/**
 * Tool 3: Generates the final, user-facing deep-dive report.
 * This tool is declared to the Gemini model.
 */
async function generateDeepDiveReport({ companyAnalysis, sectorName, originalArticles }) {
    const prompt = `
        Role: You are an expert financial analyst AI. Your task is to write a detailed investment research report for a specific economic sector based on pre-analyzed news data.

        Task: Use the provided "Top Companies" JSON to generate a comprehensive markdown report. For each company, create a detailed section including an investment thesis and a list of the positive catalysts mentioned in the news.

        Output Format: Use professional markdown. For each catalyst, you MUST append a source placeholder at the end of the line, like this: \`[Source: X]\`, where X is the \`articleIndex\` from the original news data.

        Top Ranked Companies JSON:
        ${JSON.stringify(companyAnalysis, null, 2)}

        ---
        ## AI-Powered Market Analysis: ${sectorName} Sector

        ### Overall Sector Outlook & Key Themes
        Provide a 2-3 sentence summary of the overall outlook for the ${sectorName} sector based on the collective news represented in the ranked companies. Identify the most significant themes present.

        ### Deeper Dive: Top Companies in the News
        For each of the companies in the "Top Ranked Companies JSON", create a detailed section:
        1. Use its name and ticker as a sub-header (e.g., "### 1. NVIDIA Corp (NVDA)").
        2. **Investment Thesis:** Write a concise, 2-3 sentence investment thesis summarizing why this company is currently viewed favorably based on the provided justification.
        3. **Positive Catalysts:** Create a bulleted list of the specific positive events mentioned in the news. Use the 'rankingJustification' to construct these points and append the source placeholder for verifiability.
    `;
    
    let finalReport = await callGeminiApi(prompt);

    // Post-processing to inject verifiable source links
    finalReport = finalReport.replace(/\[Source: (?:Article )?(\d+)\]/g, (match, indexStr) => {
        const index = parseInt(indexStr, 10);
        const article = originalArticles.find(a => a.articleIndex === index);
        if (article) {
            const sourceParts = article.source.split('.');
            const sourceName = sourceParts.length > 1 ? sourceParts[sourceParts.length - 2] : article.source;
            return `[(Source: ${sourceName}, ${article.publicationDate})](${article.link})`;
        }
        return match; // Return original placeholder if article not found
    });

    return { report: finalReport };
}


/**
 * Main orchestrator function for the AI-driven sector analysis.
 * This function manages the conversation with Gemini, including executing tool calls.
 */
async function handleSectorAnalysisWithAIAgent(sectorName) {
    if (!searchApiKey || !searchEngineId || !geminiApiKey) {
        displayMessageInModal("This feature requires the Web Search API Key, Search Engine ID, and Gemini API Key.", "warning");
        return;
    }

    openModal(CONSTANTS.MODAL_LOADING);
    const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);
    loadingMessage.textContent = `Initiating AI analysis for the ${sectorName} sector...`;
    
    // Also update the content area in the modal
    const contentArea = document.getElementById('custom-analysis-content');
    contentArea.innerHTML = `<div class="p-4 text-center text-gray-500">Initiating AI analysis for the ${sectorName} sector...</div>`;


    // 1. Define the tools available to the Gemini model.
    const tools = {
        functionDeclarations: [
            {
                name: "searchSectorNews",
                description: "Searches for recent (last 30 days) financial news articles for a given economic sector from a list of reputable sources.",
                parameters: {
                    type: "object",
                    properties: {
                        sectorName: { type: "string", description: "The financial sector to search for, e.g., 'Technology' or 'Health Care'." },
                    },
                    required: ["sectorName"],
                },
            },
            {
                name: "synthesizeAndRankCompanies",
                description: "Analyzes a list of news articles to identify and rank the top 3-5 most favorably mentioned companies, returning a JSON object with justifications.",
                parameters: {
                    type: "object",
                    properties: {
                        newsArticles: { type: "array", description: "An array of news article objects, each with a title and snippet.", items: { type: "object" } },
                    },
                    required: ["newsArticles"],
                },
            },
            {
                name: "generateDeepDiveReport",
                description: "Generates a final, user-facing markdown report summarizing the analysis of top companies in a sector.",
                parameters: {
                    type: "object",
                    properties: {
                        companyAnalysis: { type: "object", description: "The JSON object containing the ranked list of top companies and their analysis." },
                        sectorName: { type: "string", description: "The name of the sector being analyzed." },
                    },
                    required: ["companyAnalysis", "sectorName"],
                },
            },
        ],
    };

    // 2. Map tool names to their actual callable JavaScript functions.
    const toolFunctions = {
        'searchSectorNews': searchSectorNews,
        'synthesizeAndRankCompanies': synthesizeAndRankCompanies,
        'generateDeepDiveReport': generateDeepDiveReport,
    };

    // 3. Start the conversation with the initial user request.
    const conversationHistory = [{
        role: "user",
        parts: [{ text: `Generate a deep-dive analysis report for the ${sectorName} sector. Start by searching for relevant news.` }],
    }];
    
    let originalArticles = []; // Store articles to pass to the final tool

    try {
        for (let i = 0; i < 5; i++) { // Max 5 turns to prevent infinite loops
            const contents = {
                contents: conversationHistory,
                tools: [tools]
            };
            
            const responseContent = await callGeminiApiWithTools(contents);
            const responseParts = responseContent.parts;
            conversationHistory.push({ role: 'model', parts: responseParts });

            const toolCalls = responseParts
                .filter(part => part.functionCall)
                .map(part => part.functionCall);

            if (toolCalls.length === 0) {
                // Final response received from the model
                loadingMessage.textContent = 'Finalizing report...';
                const finalReportText = responseParts.map(part => part.text || '').join('\n');
                document.getElementById('custom-analysis-content').innerHTML = marked.parse(finalReportText);
                break; // Exit the loop
            }

            // Execute tool calls in parallel
            loadingMessage.textContent = `AI is running tools: ${toolCalls.map(tc => tc.name).join(', ')}...`;
            const toolExecutionPromises = toolCalls.map(toolCall => {
                const func = toolFunctions[toolCall.name];
                if (!func) throw new Error(`Unknown tool: ${toolCall.name}`);
                
                // Special handling to pass original articles to the final reporting tool
                if (toolCall.name === 'generateDeepDiveReport') {
                    toolCall.args.originalArticles = originalArticles;
                }
                
                return func(toolCall.args);
            });
            
            const toolResults = await Promise.all(toolExecutionPromises);

            // Store articles if they were just fetched
            const newsSearchResult = toolResults.find((res, idx) => toolCalls[idx].name === 'searchSectorNews');
            if(newsSearchResult && newsSearchResult.articles) {
                originalArticles = newsSearchResult.articles;
            }

            // Add tool responses to conversation history
            conversationHistory.push({
                role: 'user', // Function results are sent back as the user
                parts: toolResults.map((result, i) => ({
                    functionResponse: { name: toolCalls[i].name, response: result }
                }))
            });
        }
    } catch (error) {
        console.error("Error during AI agent sector analysis:", error);
        displayMessageInModal(`Could not complete AI analysis: ${error.message}`, 'error');
        contentArea.innerHTML = `<div class="p-4 text-center text-red-500">Error: ${error.message}</div>`;
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

// --- NEW SECTOR DEEP DIVE WORKFLOW (v7.2.0) ---

const creativePromptMap = {
    'Technology': { prompt: TECHNOLOGY_SECTOR_PROMPT, label: 'Playbook' },
    'Health Care': { prompt: HEALTH_CARE_SECTOR_PROMPT, label: 'Playbook' },
    'Financials': { prompt: FINANCIALS_SECTOR_PROMPT, label: 'Playbook' },
    'Consumer Discretionary': { prompt: CONSUMER_DISCRETIONARY_SECTOR_PROMPT, label: 'Playbook' },
    'Communication Services': { prompt: COMMUNICATION_SERVICES_SECTOR_PROMPT, label: 'Playbook' },
    'Industrials': { prompt: INDUSTRIALS_SECTOR_PROMPT, label: 'Playbook' },
    'Consumer Staples': { prompt: CONSUMER_STAPLES_SECTOR_PROMPT, label: 'Playbook' },
    'Energy': { prompt: ENERGY_SECTOR_PROMPT, label: 'Playbook' },
    'Utilities': { prompt: UTILITIES_SECTOR_PROMPT, label: 'Playbook' },
    'Real Estate': { prompt: REAL_ESTATE_SECTOR_PROMPT, label: 'Playbook' },
    'Materials': { prompt: MATERIALS_SECTOR_PROMPT, label: 'Playbook' },
};

function handleSectorSelection(sectorName) {
    const modalTitle = document.getElementById('custom-analysis-modal-title');
    const selectorContainer = document.getElementById('custom-analysis-selector-container');
    const contentArea = document.getElementById('custom-analysis-content');

    modalTitle.textContent = `Sector Deep Dive | ${sectorName}`;
    contentArea.innerHTML = `<div class="text-center text-gray-500 pt-16">Please select an analysis type above to begin.</div>`;
    
    selectorContainer.innerHTML = ''; // Clear previous buttons

    const creativeAnalysis = creativePromptMap[sectorName];
    let creativeButtonHtml = '';
    if (creativeAnalysis) {
        creativeButtonHtml = `
            <div class="text-center">
                <span class="block text-xs font-bold text-gray-500 uppercase mb-2">Analysis</span>
                <div class="flex flex-wrap justify-center gap-4">
                    <button class="sector-analysis-btn" data-sector="${sectorName}" data-prompt-name="${sectorName.replace(/\s/g, '')}">${creativeAnalysis.label}</button>
                    <button class="sector-analysis-btn" data-sector="${sectorName}" data-prompt-name="DisruptorAnalysis">Disruptor</button>
                    <button class="sector-analysis-btn" data-sector="${sectorName}" data-prompt-name="MacroPlaybook">Macro Trend</button>
                </div>
            </div>
        `;
    }

    let buttonsHtml = `
        <div class="flex flex-col md:flex-row gap-8 justify-center items-start w-full">
            <div class="text-center">
                <span class="block text-xs font-bold text-gray-500 uppercase mb-2">Data-Driven Analysis</span>
                <button class="sector-analysis-btn" data-sector="${sectorName}" data-prompt-name="MarketTrends">Market Trends</button>
            </div>
            ${creativeButtonHtml}
        </div>
    `;
    
    selectorContainer.innerHTML = buttonsHtml.replace(/<button class="sector-analysis-btn"/g, '<button class="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-300 rounded-lg shadow-sm"');
    
    openModal(CONSTANTS.MODAL_CUSTOM_ANALYSIS);
}

async function handleCreativeSectorAnalysis(sectorName, promptNameKey) {
    const promptData = creativePromptMap[sectorName];
    if (!promptData) {
        displayMessageInModal(`No creative analysis prompt found for sector: ${sectorName}`, 'error');
        return;
    }
    
    openModal(CONSTANTS.MODAL_LOADING);
    const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);
    loadingMessage.textContent = `Generating AI article: "${promptData.label}"...`;
    
    const contentArea = document.getElementById('custom-analysis-content');
    contentArea.innerHTML = `<div class="p-4 text-center text-gray-500">Generating AI article: "${promptData.label}"...</div>`;

    try {
        const report = await callGeminiApi(promptData.prompt);
        contentArea.innerHTML = marked.parse(report);
    } catch (error) {
        console.error(`Error generating creative analysis for ${sectorName}:`, error);
        displayMessageInModal(`Could not generate AI article: ${error.message}`, 'error');
        contentArea.innerHTML = `<div class="p-4 text-center text-red-500">Error: ${error.message}</div>`;
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

async function handleDisruptorAnalysis(sectorName) {
    openModal(CONSTANTS.MODAL_LOADING);
    const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);
    loadingMessage.textContent = `Generating AI article: "Disruptor Analysis"...`;

    const contentArea = document.getElementById('custom-analysis-content');
    contentArea.innerHTML = `<div class="p-4 text-center text-gray-500">Generating AI article: "Disruptor Analysis"...</div>`;

    try {
        const prompt = DISRUPTOR_ANALYSIS_PROMPT.replace(/\[SECTOR NAME\]/g, sectorName);
        const report = await callGeminiApi(prompt);
        contentArea.innerHTML = marked.parse(report);
    } catch (error) {
        console.error(`Error generating disruptor analysis for ${sectorName}:`, error);
        displayMessageInModal(`Could not generate AI article: ${error.message}`, 'error');
        contentArea.innerHTML = `<div class="p-4 text-center text-red-500">Error: ${error.message}</div>`;
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

async function handleMacroPlaybookAnalysis(sectorName) {
    openModal(CONSTANTS.MODAL_LOADING);
    const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);
    loadingMessage.textContent = `Generating AI article: "Macro Playbook"...`;

    const contentArea = document.getElementById('custom-analysis-content');
    contentArea.innerHTML = `<div class="p-4 text-center text-gray-500">Generating AI article: "Macro Playbook"...</div>`;

    try {
        const standardDisclaimer = "This article is for informational purposes only and should not be considered financial advice. Readers should consult with a qualified financial professional before making any investment decisions.";
        const prompt = MACRO_PLAYBOOK_PROMPT
            .replace(/\[SECTOR NAME\]/g, sectorName)
            .replace(/\[Include standard disclaimer\]/g, standardDisclaimer);
        const report = await callGeminiApi(prompt);
        contentArea.innerHTML = marked.parse(report);
    } catch (error) {
        console.error(`Error generating macro playbook analysis for ${sectorName}:`, error);
        displayMessageInModal(`Could not generate AI article: ${error.message}`, 'error');
        contentArea.innerHTML = `<div class="p-4 text-center text-red-500">Error: ${error.message}</div>`;
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}


// --- AI ANALYSIS REPORT GENERATORS ---

async function getStockDataFromCache(symbol, collection = CONSTANTS.DB_COLLECTION_CACHE) {
    const docRef = doc(db, collection, symbol);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
        // This is not an error in the context of renderDashboard, so we return null instead of throwing.
        console.warn(`Could not find cached data for ${symbol}. It will be excluded from the dashboard view.`);
        return null;
    }
    const data = docSnap.data();
    if (collection === CONSTANTS.DB_COLLECTION_CACHE && (!data.OVERVIEW)) {
         console.warn(`Cached analysis data for ${symbol} is incomplete. It will be excluded from the dashboard view.`);
         return null;
    }
    return data;
}

async function handleViewFullData(symbol) {
    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Loading full data for ${symbol}...`;
    try {
        const data = await getStockDataFromCache(symbol);
        if (!data) throw new Error(`No cached data found for ${symbol}.`);
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
        if (!data) throw new Error(`No cached data found for ${symbol}.`);
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
        if (!cachedData) throw new Error(`No cached data found for ${symbol}.`);
        
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
        if (!data) throw new Error(`No cached data found for ${symbol}.`);
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
        if (!data) throw new Error(`No cached data found for ${symbol}.`);
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
        if (!data) throw new Error(`No cached data found for ${symbol}.`);
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
        if (!data) throw new Error(`No cached data found for ${symbol}.`);
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
        if (!data) throw new Error(`No cached data found for ${symbol}.`);
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

async function handleCapitalAllocatorsAnalysis(symbol) {
    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Generating Capital Allocators analysis for ${symbol}...`;
    try {
        const data = await getStockDataFromCache(symbol);
        if (!data) throw new Error(`No cached data found for ${symbol}.`);
        const companyName = get(data, 'OVERVIEW.Name', 'the company');
        const tickerSymbol = get(data, 'OVERVIEW.Symbol', symbol);
        const prompt = CAPITAL_ALLOCATORS_PROMPT
            .replace(/{companyName}/g, companyName)
            .replace(/{tickerSymbol}/g, tickerSymbol);
        const report = await callGeminiApi(prompt);
        document.getElementById('custom-analysis-content').innerHTML = marked.parse(report);
        document.getElementById('custom-analysis-modal-title').textContent = `Capital Allocators | ${symbol}`;
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
    let fileName = '';

    if (modalId === CONSTANTS.MODAL_FULL_DATA) {
        contentToSave = modal.querySelector('#full-data-content').textContent;
        stockSymbol = modal.querySelector('#full-data-modal-title').textContent.replace('Full Cached Data for ', '').trim();
        analysisType = 'FullData';
        fileName = `${stockSymbol}_${analysisType}_${new Date().toISOString().split('T')[0]}.md`;
    } else {
        const proseContainer = modal.querySelector('.prose');
        contentToSave = proseContainer.innerHTML; // Save as HTML for now to preserve formatting
        
        const titleText = modal.querySelector('h2').textContent;
        const titleParts = titleText.split(' | ');

        if (modalId === CONSTANTS.MODAL_CUSTOM_ANALYSIS) {
            if (titleParts.length > 1) { // Sector Deep Dive | Technology
                const sectorName = titleParts[1].trim();
                const selectedButton = modal.querySelector('#custom-analysis-selector-container button[disabled]'); // A bit fragile, better way? Maybe store last analysis type
                const analysisLabel = selectedButton ? selectedButton.textContent : 'CustomAnalysis';
                 fileName = `${sectorName.replace(/\s/g, '_')}_${analysisLabel.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.md`;
            } else {
                fileName = `${titleText.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.md`;
            }
        } else { // Individual stock analyses
            stockSymbol = titleParts.length > 1 ? titleParts[1].trim() : titleParts[0];
            analysisType = titleParts[0].trim().replace(/\s/g, '');
            fileName = `${stockSymbol}_${analysisType}_${new Date().toISOString().split('T')[0]}.md`;
        }
    }


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
