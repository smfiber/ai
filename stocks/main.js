import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithCredential, signOut, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, Timestamp, doc, setDoc, getDoc, deleteDoc, collection, getDocs, query, limit, addDoc, increment, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- App Version ---
const APP_VERSION = "11.0.0"; 

// --- Constants ---
const CONSTANTS = {
    // Modals
    MODAL_API_KEY: 'apiKeyModal',
    MODAL_LOADING: 'loadingStateModal',
    MODAL_MESSAGE: 'messageModal',
    MODAL_CONFIRMATION: 'confirmationModal',
    MODAL_CUSTOM_ANALYSIS: 'customAnalysisModal',
    MODAL_INDUSTRY_ANALYSIS: 'industryAnalysisModal',
    MODAL_MANAGE_STOCK: 'manageStockModal',
    MODAL_VIEW_FMP_DATA: 'viewFmpDataModal',
    MODAL_MANAGE_FMP_ENDPOINTS: 'manageFmpEndpointsModal',
    MODAL_MANAGE_BROAD_ENDPOINTS: 'manageBroadEndpointsModal',
    MODAL_PORTFOLIO_MANAGER: 'portfolioManagerModal',
    MODAL_STOCK_LIST: 'stockListModal',
    // Forms & Inputs
    FORM_API_KEY: 'apiKeyForm',
    FORM_STOCK_RESEARCH: 'stock-research-form',
    INPUT_TICKER: 'ticker-input',
    INPUT_GEMINI_KEY: 'geminiApiKeyInput',
    INPUT_GOOGLE_CLIENT_ID: 'googleClientIdInput',
    INPUT_WEB_SEARCH_KEY: 'webSearchApiKeyInput',
    INPUT_SEARCH_ENGINE_ID: 'searchEngineIdInput',
    // Containers & Elements
    CONTAINER_DYNAMIC_CONTENT: 'dynamic-content-container',
    CONTAINER_PORTFOLIO_LIST: 'portfolio-list-container',
    ELEMENT_LOADING_MESSAGE: 'loading-message',
    ELEMENT_FINANCIAL_ANALYSIS_CONTENT: 'financial-analysis-content',
    ELEMENT_UNDERVALUED_ANALYSIS_CONTENT: 'undervalued-analysis-content',
    // Buttons
    BUTTON_SCROLL_TOP: 'scroll-to-top-button',
    // Classes
    CLASS_MODAL_OPEN: 'is-open',
    CLASS_BODY_MODAL_OPEN: 'modal-open',
    CLASS_HIDDEN: 'hidden',
    // Database Collections
    DB_COLLECTION_PORTFOLIO: 'portfolio_stocks',
    DB_COLLECTION_SECTOR_ANALYSIS: 'sector_analysis_runs',
    DB_COLLECTION_CALENDAR: 'calendar_data',
    DB_COLLECTION_FMP_CACHE: 'fmp_cached_data',
    DB_COLLECTION_FMP_ENDPOINTS: 'fmp_endpoints',
    DB_COLLECTION_BROAD_ENDPOINTS: 'broad_api_endpoints',
};

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

const FINANCIAL_ANALYSIS_PROMPT = `
Role: You are a financial analyst AI who excels at explaining complex topics to everyday investors. Your purpose is to generate a rigorous, data-driven financial analysis that is also educational, objective, and easy to understand. Use relatable analogies to clarify financial concepts (e.g., comparing debt to a mortgage). Your analysis must be derived exclusively from the provided JSON data from the Financial Modeling Prep (FMP) API.

Output Format: The final report must be in professional markdown format. Use # for the main title, ## for major sections, ### for sub-sections, and bullet points for key data and lists. Present financial figures clearly, using 'Billion' or 'Million' where appropriate for readability.

IMPORTANT: Do not include any HTML tags in your output. Generate pure markdown only.

Analyze the comprehensive financial data for {companyName} (Ticker: {tickerSymbol}) provided below. If a specific data point is "N/A" or missing, state that clearly in your analysis.

JSON Data:
{jsonData}

Based on the provided data, generate the following multi-faceted financial report:

# Comprehensive Financial Analysis: {companyName} ({tickerSymbol})

## 1. Executive Summary
Begin with a concise, one-paragraph summary written in plain English. For someone in a hurry, what is the most important takeaway about this company's financial health, performance, and overall story as a potential investment, based on the provided FMP data?

## 2. Company Profile (What Do They Actually Do?)
### Business Description
In simple terms, describe the company's business based on the 'description', 'sector', and 'industry' from the 'company_profile' data. Avoid jargon.
### Market Snapshot
Present key market-related metrics for context from the 'stock_quote' and 'company_profile' data.
- Market Capitalization: $XXX.XX Billion (from 'marketCap')
- 52-Week Price Range: $XX.XX - $XX.XX (from 'range' in profile or 'yearLow'/'yearHigh' in quote)
- 50-Day Moving Average: $XX.XX (from 'priceAvg50')
- 200-Day Moving Average: $XX.XX (from 'priceAvg200')

## 3. Performance & Profitability (How Well Does It Make Money?)
Assess the company's ability to generate profit. Explain all concepts simply.
### 3.1. Revenue & Earnings Trend
Analyze the historical trend of 'revenue' and 'netIncome' from the 'income_statement' array. Is the company making more money and keeping more profit over time? Discuss the Year-over-Year (YoY) growth rates for the most recent two years in simple terms.
### 3.2. Profitability Margins & Returns
Explain what 'netProfitMargin' means from the 'key_metrics' data. For every $100 in sales, how much is actual profit? Analyze the trend in this margin. Is it getting better or worse?
Explain 'returnOnEquity' (ROE) and 'returnOnAssets' (ROA) from 'key_metrics' as a grade for the management team. How well are they using shareholder money and company resources to make a profit?

## 4. Financial Health & Risk (Is the Company on Solid Ground?)
Evaluate the company's financial stability. Use an analogy to explain debt (e.g., like a mortgage on a house).
### 4.1. Liquidity Analysis
Interpret the 'currentRatio' from the 'key_metrics' data. Explain its meaning: Does the company have enough cash and easily-sold assets to pay its bills for the next year?
### 4.2. Solvency and Debt Structure
Analyze the 'debtToEquity' ratio from 'key_metrics'. How much of the company is funded by debt versus shareholder money? Is the trend getting riskier or safer?
Explain the 'interestCoverage' ratio from 'key_metrics' simply: From its operating earnings, how many times over can the company pay the interest on its debt? A high number is safer.

## 5. Cash Flow Analysis (Following the Actual Cash)
Analyze where the company's cash came from and where it went using the 'cash_flow_statement' array. Explain the key difference between "profit" ('netIncome') and "cash flow" ('operatingCashFlow').
### Operating Cash Flow (OCF)
Is the company consistently generating real cash from its main business operations ('operatingCashFlow')? Is this amount growing?
### Quality of Earnings
Compare 'operatingCashFlow' to 'netIncome'. Are the company's profits backed by actual cash? A big difference can be a red flag.
### Investing and Financing Activities
Briefly explain what the company is doing with its cash. Is it reinvesting for growth ('capitalExpenditure'), paying down debt ('debtRepayment'), or returning money to shareholders ('dividendsPaid')?

## 6. Valuation Analysis (Is the Stock Price Fair?)
Assess if the company's stock price seems expensive, cheap, or reasonable. Explain what the key ratios mean.
Present and interpret the following valuation multiples from the 'key_metrics' data:
- P/E Ratio ('peRatio'): Explain this simply (e.g., "The price you pay for $1 of the company's profit").
- Price-to-Sales Ratio ('priceToSalesRatio')
- Price-to-Book Ratio ('priceToBookRatio')
- Enterprise Value to EBITDA ('enterpriseValueOverEBITDA')
Briefly discuss what these multiples imply. Is the stock priced for high growth, or is it seen as a stable value company?

## 7. The Long-Term Investment Thesis: Bull vs. Bear
Conclude with a final synthesis that integrates all the preceding analyses into a clear bull and bear case.
### The Bull Case (Key Strengths & Competitive Edge)
Identify 2-3 of the most significant financial strengths and what they mean for a long-term investor. What is the primary "bull" argument for owning this stock based on the FMP data?
### The Bear Case (Potential Weaknesses & Risks)
Identify 2-3 of the most significant weaknesses or financial red flags from the FMP data. What is the primary "bear" argument against owning this stock?
### Final Verdict: The "Moat" and Long-Hold Potential
Based on purely on this quantitative analysis, what is the primary story? And what, if anything, in the data suggests the company has a strong competitive advantage (a "moat")? Conclude with a final statement on its profile as a potential long-term holding.
`.trim();

const UNDERVALUED_ANALYSIS_PROMPT = `
Role: You are a financial analyst AI who excels at explaining complex topics to everyday investors. Your purpose is to conduct a clear, data-driven valuation analysis to determine if a stock is a potential bargain. Use relatable analogies and explain all financial terms simply. Your analysis must be derived exclusively from the provided FMP JSON data.

Output Format: The final report must be in professional markdown format. Use # for the main title, ## for major sections, ### for sub-sections, and bullet points for key data points.

IMPORTANT: Do not include any HTML tags in your output. Generate pure markdown only.

Conduct a comprehensive valuation analysis for {companyName} (Ticker: {tickerSymbol}) using the financial data provided below. If a specific data point is "N/A" or missing, state that clearly in your analysis.

JSON Data:
{jsonData}

Based on the data, generate the following in-depth report:
# Investment Valuation Report: Is {companyName} ({tickerSymbol}) a Bargain?

## 1. The Bottom Line: Our Verdict
Provide a concise, one-paragraph conclusion that immediately answers the main question: Based on the data, does this stock seem Undervalued, Fairly Valued, or Overvalued? Briefly mention the top 1-2 reasons for this verdict in plain English, considering its fundamentals, health, and market sentiment.

## 2. Is the Price Fair? (Fundamental & Health Analysis)
Let's look at the company's valuation metrics and financial health to see if the price makes sense.
### 2.1. Valuation Multiples Explained
- **Price-to-Earnings (P/E) Ratio:** [Value from 'key_metrics.peRatio']. Explain this simply: It’s the price you pay for $1 of the company’s profit.
- **Price-to-Book (P/B) Ratio:** [Value from 'key_metrics.priceToBookRatio']. Explain this as the stock's price compared to the company's net worth on paper. A value under 1.0 can sometimes suggest it's a bargain.
- **Price-to-Sales (P/S) Ratio:** [Value from 'key_metrics.priceToSalesRatio']. Explain this as the price you pay for $1 of the company’s sales. Is it a good deal, or does it signal low profitability?
- **Enterprise Value to Sales (EV/Sales):** [Value from 'key_metrics.evToSales']. Explain this is often considered a more thorough valuation metric than P/S.

### 2.2. Financial Health Check (Debt Load)
- **Debt-to-Equity Ratio:** [Value from 'key_metrics.debtToEquity']. Explain this like a personal debt-to-income ratio. A high number means the company relies heavily on debt, which can be risky.

### 2.3. Value vs. Growth (The Graham Number)
- **Graham Number:** [Value from 'key_metrics.grahamNumber']. Explain this as a theoretical intrinsic value for defensive investors, calculated by Benjamin Graham. If the current stock price ('stock_quote.price') is below the Graham Number, it may be considered undervalued.

### 2.4. Getting Paid to Wait (Dividend Analysis)
- **Dividend Yield:** [Value from 'key_metrics.dividendYield']%. Explain this as the annual return you get from dividends, like interest from a savings account.
- **Is the Dividend Safe?** Calculate the Cash Flow Payout Ratio ('cash_flow_statement.dividendsPaid' / 'cash_flow_statement.operatingCashFlow'). Explain what this means for the dividend's sustainability. A low number is a good sign.

### 2.5. What Does Wall Street Think?
- **Analyst Grades:** Review the 'stock_grade_news' array. Summarize the recent analyst actions (e.g., "Upgraded to Buy from Hold"). How does this sentiment compare to the stock's current valuation?

## 3. Sizing Up the Competition (Relative Value)
A stock might seem cheap or expensive on its own, but how does it look compared to its peers?
- **Industry Context:** Using the 'industry' from the 'company_profile' data, comment on the valuation. For example, are the P/E and P/S ratios high or low for a company in this specific industry? (e.g., "Tech stocks often have higher P/E ratios than banks.") This provides crucial context.

## 4. Market Mood & Stock Trends (Sentiment & Technicals)
Let's check the stock's recent price trends and what other investors are doing.
### 4.1. The Trend is Your Friend
- **50-Day & 200-Day Moving Averages:** Analyze the stock's current trend by comparing the 'stock_quote.price' to the 'priceAvg50' and 'priceAvg200' levels. Is it in a "hot" uptrend or a "cold" downtrend?
### 4.2. Where Does the Price Stand?
- **52-Week Range:** The stock has traded between $[Value from 'stock_quote.yearLow'] and $[Value from 'stock_quote.yearHigh']. Is the price currently near its yearly low (a potential discount) or its high (strong momentum)?

## 5. Final Conclusion: The Investment Case
Combine all our findings into a final, clear summary.
- **The Case for a Bargain:** Summarize the key data points (e.g., low P/E, healthy balance sheet, price below Graham Number, positive analyst grades) that suggest the stock is undervalued.
- **The Case for Caution:** Summarize the key risks or red flags (e.g., high debt, high valuation vs. peers, bearish trend) that suggest the stock might not be a good deal right now.
- **Final Takeaway:** End with a clear, final statement. For example: "The stock looks like a potential bargain based on its fundamentals and low debt. However, it appears expensive compared to its industry, and a recent downtrend suggests market caution. A patient approach may be warranted."

**Disclaimer:** This AI-generated analysis is for informational and educational purposes only. It is not financial advice. Data may not be real-time.
`.trim();

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

const BULL_VS_BEAR_PROMPT = `
Role: You are a financial analyst AI who excels at presenting a balanced view. Your task is to explain the two sides of the investment story for {companyName}, acting as a neutral moderator in a debate. Use ONLY the provided FMP JSON data to build your arguments.

Output Format: Use markdown format. Explain each point in simple terms, as if talking to a friend who is new to investing. Create a clear "Bull Case" and a "Bear Case" section, each with 3-5 bullet points supported by specific data from the JSON.

JSON Data:
{jsonData}

# The Investment Debate: {companyName} ({tickerSymbol})

## The Bull Case (The Bright Side: Reasons to be Optimistic)
Construct a positive argument for the company. For each point, state the supporting data and then briefly explain *why* it matters to an investor.
Focus on strengths like:
- **Strong Growth:** Is 'revenue' or 'netIncome' consistently increasing? (Use 'income_statement' data).
- **High Profitability:** Is the company a good money-maker? (Use 'returnOnEquity' from 'key_metrics'). Explain ROE as a "grade" for how well management uses shareholder money.
- **Solid Cash Flow:** Is the business generating real cash? (Use 'operatingCashFlow' from 'cash_flow_statement'). Explain this as the company's "lifeblood".
- **Potential Bargain:** Does the stock seem cheap relative to its earnings? (Use 'peRatio' from 'key_metrics').
- **Wall Street Optimism:** Do the 'stock_grade_news' entries show recent "Buy" ratings or upgrades, indicating that market experts are also bullish?

## The Bear Case (The Cautious View: Reasons for Concern)
Construct a negative argument for the company. For each point, state the supporting data and explain the potential risk.
Focus on weaknesses like:
- **Heavy Debt Load:** Does the company owe a lot of money? (Use 'debtToEquity' from 'key_metrics'). Explain this like having a large mortgage; it can be risky if times get tough.
- **Slowing Growth or Profitability:** Are sales or profits shrinking, potentially falling behind competitors? (Use 'income_statement' data).
- **Weak Cash Flow:** Is the company burning through cash? (Use 'cash_flow_statement' data).
- **Expensive Stock:** Does the stock seem overpriced for its performance? (Use high valuation multiples like 'priceToSalesRatio' or 'evToSales' from 'key_metrics').
- **Analyst Skepticism:** Do the 'stock_grade_news' entries show "Sell" ratings or downgrades?

## The Final Takeaway: What's the Core Debate?
Conclude with a 1-2 sentence summary that frames the central conflict for an investor. For example: "The core debate for {companyName} is whether its strong profitability and growth (the bull case) are enough to outweigh its significant debt load and increasing competition (the bear case)."
`.trim();

const MOAT_ANALYSIS_PROMPT = `
Role: You are a business strategist AI who excels at explaining complex business concepts in simple, relatable terms. Your task is to analyze {companyName}'s competitive advantages using FMP data.
Concept: An "economic moat" is a company's ability to maintain its competitive advantages and defend its long-term profits from competitors. Think of it like the moat around a castle—the wider the moat, the harder it is for invaders (competitors) to attack.
Output Format: Provide a brief report in markdown. Explain each point simply and conclude with a clear verdict on the moat's strength.

JSON Data:
{jsonData}

# Economic Moat Analysis: {companyName} ({tickerSymbol})

## 1. What Gives This Company Its Edge? (Sources of the Moat)
Analyze the data for signs of a durable competitive advantage. Discuss:
- **Return on Invested Capital (ROIC):** [Value from 'key_metrics.returnOnInvestedCapital']. Explain this as the "gold standard" for moat analysis: it shows how much profit the company generates for every dollar of capital invested. A consistently high ROIC (>15%) is a strong sign of a moat.
- **Pricing Power:** Are the 'netProfitMargin' and 'operatingIncome' (from 'income_statement') consistently high? Explain this as a sign that the company can charge more for its products without losing customers, often due to a strong brand or unique technology.
- **Qualitative Clues (Network Effects/Switching Costs):** Analyze the company's 'description' from 'company_profile'. Does it mention a "platform," "network," or "marketplace" that grows more valuable as more people use it? Does it sell "enterprise software" or "integrated systems" that would be difficult for a customer to switch away from?
- **Shareholder Returns (ROE):** Is the 'returnOnEquity' from 'key_metrics' high? Explain this as a sign that management is highly effective at turning shareholder money into profits, a hallmark of a well-run company.

## 2. How Strong is the Castle Wall? (Moat Sustainability)
Assess how sustainable this advantage might be by looking at:
- **Reinvesting in the Business:** Are 'capitalExpenditure' (from 'cash_flow_statement') significant? Explain this as the company spending money to strengthen its moat, like building higher castle walls.
- **Financial Fortress:** Is the balance sheet strong (low 'debtToEquity' from 'key_metrics')? A company with low debt is better equipped to survive tough times and fight off competitors.

## 3. The Verdict: How Wide is the Moat?
Based on all the evidence (quantitative and qualitative), provide a concluding assessment. Classify the moat as "Wide," "Narrow," or "None," and explain what this means for a long-term investor.
- **Wide Moat:** The company has strong, sustainable advantages (like high ROIC and clear network effects) that are very difficult for competitors to copy.
- **Narrow Moat:** The company has some advantages (like good profitability), but they could be overcome by competitors over time.
- **No Moat:** The company has no clear, sustainable competitive advantage and is vulnerable to competition.
`.trim();

const DIVIDEND_SAFETY_PROMPT = `
Role: You are a conservative income investment analyst AI. Your goal is to explain dividend safety in simple, clear terms for an investor who relies on that income, using FMP data.
Concept: Dividend safety analysis is all about figuring out how likely a company is to continue paying its dividend. A safe dividend is supported by strong earnings and cash flow and isn't threatened by high debt.
Output Format: Create a markdown report. Explain each point using simple analogies and conclude with a clear safety rating.

JSON Data:
{jsonData}

# Dividend Safety Analysis: {companyName} ({tickerSymbol})

## 1. The Payout: What Are You Earning?
- **Current Dividend Yield:** [Value from 'key_metrics.dividendYield']%. Explain this as the annual return you get from dividends, like interest from a savings account.

## 2. Can the Company Afford Its Dividend? (Payout Ratios)
This is the most important test. A company should pay its dividend from the money it actually makes.
- **Free Cash Flow (FCF) Payout Ratio:** Calculate this using ('cash_flow_statement.dividendsPaid' / 'cash_flow_statement.freeCashFlow'). Explain this as the most conservative test: "Is the dividend covered by the true discretionary cash left after running and growing the business?" A low ratio here is an excellent sign of safety.
- **Earnings Payout Ratio:** ('cash_flow_statement.dividendsPaid' / 'income_statement.netIncome'). Explain this as: "For every $1 of profit, how much is paid out as a dividend?" A ratio over 100% means the company is paying out more than it earns, which is a red flag.

## 3. What is the Track Record? (History & Consistency)
A company's past behavior is a good indicator of its future commitment to the dividend.
- **Dividend Growth:** Analyze the trend of 'dividendsPaid' over the last several years from the 'cash_flow_statement' array. Has the company consistently increased its dividend payment? Explain that a history of dividend growth is a powerful sign of a healthy, confident business.

## 4. Does the Company Have a Safety Net? (Balance Sheet Health)
A strong company can protect its dividend even when times get tough.
- **Debt Load:** How has the 'debtToEquity' ratio (from 'key_metrics') trended? Explain this like a personal mortgage: high or rising debt can put dividend payments at risk if the company needs to prioritize paying back lenders.
- **Cash Cushion:** Examine the trend in 'cashAndCashEquivalents' from 'balance_sheet_statement'). Does the company have a healthy cash pile to fall back on? This acts as a buffer to protect the dividend during a downturn.

## 5. The Final Verdict: How Safe Are Your Dividend Checks?
Conclude with a clear rating and a simple, one-sentence justification.
- **"Very Safe":** The dividend has a history of growth, is easily covered by free cash flow, and the balance sheet is strong. Like a salary from a very stable job that gives you a raise every year.
- **"Safe":** The dividend is covered, but may lack a long history of growth or there might be a minor concern (like rising debt) to watch. Like a salary from a good job, but the company is taking on some new projects.
- **"At Risk":** The payout ratios are high, the dividend isn't growing, and/or the balance sheet is weak. The dividend could be cut if business slows down. Like a salary from a job that is facing financial trouble.
`.trim();

const GROWTH_OUTLOOK_PROMPT = `
Role: You are a forward-looking equity analyst AI. Your goal is to identify the key signs of future growth for {companyName} and explain them in simple terms, using FMP data.
Concept: Growth outlook analysis tries to answer the question, "Where will this company be in the future?" We look at its history, recent performance, how it invests in itself, and what the market expects.
Output Format: A concise markdown summary of key growth indicators and a concluding outlook.

JSON Data:
{jsonData}

# Growth Outlook: {companyName} ({tickerSymbol})

## 1. What is the Long-Term Track Record? (Historical Growth)
Analyze the annual 'income_statement' data for the last 3-5 years.
- **Revenue & Earnings Trend:** Has the company consistently grown its 'revenue' and 'netIncome' over the long term? Explain that a proven track record is a strong sign of a durable business.

## 2. Are You Paying a Fair Price for Growth? (Valuation)
It's important not to overpay for growth. Analyze the valuation of the company's growth:
- **P/E Ratio:** [Value from 'key_metrics.peRatio']. A high P/E can indicate that the market expects high future growth.
- **EV to Sales Ratio:** [Value from 'key_metrics.evToSales']. This can be useful for growth companies that are not yet profitable.

## 3. Planting Seeds for Future Trees (Reinvestment)
A company must invest today to grow tomorrow. Examine the data for signs of this:
- **R&D as a Percentage of Revenue:** [Value from 'key_metrics.researchAndDevelopementToRevenue']. A high value suggests a strong commitment to innovation.
- **Capex as a Percentage of Revenue:** [Value from 'key_metrics.capexToRevenue']. This shows how much the company is investing in physical assets to fuel future growth.

## 4. What Does the Market Expect? (Future Outlook)
Interpret the market's view on the company's growth prospects:
- **Analyst Grades:** Review the 'stock_grade_news' array. Do recent analyst actions ("Buy", "Hold", "Sell") suggest optimism or pessimism about the company's growth?

## 5. Final Outlook: What is the Growth Story?
Based on all the factors above, provide a brief, synthesized outlook. Is this a consistent, long-term grower that is reasonably priced, or is its growth recent and potentially expensive? What is the primary story for a potential investor looking for growth?
`.trim();

const RISK_ASSESSMENT_PROMPT = `
Role: You are a risk analyst AI. Your job is to act like a cautious inspector, identifying the most significant potential problems or "red flags" for {companyName} and explaining them simply, using FMP data.
Concept: Risk assessment is about looking for potential problems that could hurt a company or its stock price. We will check the company's financial health, its stock price valuation, and its business operations for any warning signs.
Output Format: A prioritized, bulleted list in markdown, categorized by risk type. Explain each risk in simple terms.

JSON Data:
{jsonData}

# Uncovering the Risks: {companyName} ({tickerSymbol})

## 1. Financial Risks (Is the Foundation Solid?)
These are risks related to the company's balance sheet and cash flow.
- **Debt Load (Leverage):** Is the 'debtToEquity' ratio from 'key_metrics' high? Explain this risk like having a large mortgage; it can become a heavy burden, especially if business slows down.
- **Paying Short-Term Bills (Liquidity):** Is the 'currentRatio' from 'key_metrics' low (below 1.5)? This could suggest the company might have trouble paying its bills over the next year without selling long-term assets.
- **"Real" Cash vs. "Paper" Profit (Earnings Quality):** Is 'operatingCashFlow' from 'cash_flow_statement' significantly lower than 'netIncome' from 'income_statement'? This can be a red flag that the company's reported profits aren't turning into actual cash.
- **Dividend Sustainability:** Is the 'dividendsPaid' from 'cash_flow_statement' greater than 'netIncome' from 'income_statement'? This is a major warning sign that the dividend is being funded by debt or cash reserves, not profits, and could be at risk of a cut.

## 2. Market & Stock Price Risks (Is the Stock Itself Risky?)
These are risks related to the stock's price and behavior in the market.
- **Volatility (The "Drama" Level):** Is the 'beta' from 'company_profile' greater than 1? This means the stock tends to have bigger price swings (both up and down) than the overall market.
- **Priced for Perfection? (Valuation Risk):** Are the 'peRatio' or 'priceToSalesRatio' from 'key_metrics' exceptionally high? Explain that a stock price is built on high expectations and could fall sharply if the company delivers even slightly disappointing news.
- **Analyst Pessimism:** Do the 'stock_grade_news' entries show "Sell" ratings or downgrades? This indicates that some experts are betting against the stock.

## 3. Business Risks (Are There Cracks in the Operations?)
These are risks related to the day-to-day health of the business.
- **Recession Sensitivity (Economic Cycle Risk):** Based on the company's 'sector' from 'company_profile', is it "Cyclical" (like Consumer Cyclical or Industrials) or "Defensive" (like Utilities or Consumer Defensive)? Cyclical companies are often hit harder during economic downturns.
- **Shrinking Profits? (Margin Compression):** Are profitability margins like 'netProfitMargin' from 'key_metrics' trending downwards over the past few years? This means it's getting harder for the company to make a profit on what it sells.

## 4. The Bottom Line: What Are the Biggest Worries?
Based on the data, provide a brief, 1-2 sentence summary highlighting the top 2-3 risks an investor should be most aware of.
`.trim();

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
When you mention a stock ticker, you MUST wrap it in a special tag like this: <stock-ticker>TICKER</stock-ticker>.
Crucial Disclaimer: This article is for informational purposes only and should not be considered financial advice. Readers should consult with a qualified financial professional before making any investment decisions.
`;

const INDUSTRY_CAPITAL_ALLOCATORS_PROMPT = `
	Act as a discerning investment strategist focused on management quality, in the style of a shareholder letter from a firm like Constellation Software or Berkshire Hathaway.
	Your task is to analyze one CEO/management team from the {industryName} industry known for their skill in capital allocation.
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
When you mention a stock ticker, you MUST wrap it in a special tag like this: <stock-ticker>TICKER</stock-ticker>.
Crucial Disclaimer: This article is for informational purposes only and should not be considered financial advice. Readers should consult with a qualified financial professional before making any investment decisions.
`;

const DISRUPTOR_ANALYSIS_PROMPT = `
Act as a senior analyst for a forward-looking investment research publication like The Motley Fool or ARK Invest, known for identifying high-growth, innovative companies. Your new assignment is to write an article for your "Disruptor Deep Dive" series.
For the {sectorName} sector, your task is to identify one public company that perfectly fits the "disruptor" profile: it has already hit its stride with a proven product and significant traction, but it still has immense potential to disrupt the established leaders and redefine its industry.
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

When you mention a stock ticker, you MUST wrap it in a special tag like this: <stock-ticker>TICKER</stock-ticker>.
The tone should be insightful and optimistic about innovation, but grounded in business fundamentals and realistic about the challenges of disruption.
`;

const INDUSTRY_DISRUPTOR_ANALYSIS_PROMPT = `
Act as a senior analyst for a forward-looking investment research publication like The Motley Fool or ARK Invest, known for identifying high-growth, innovative companies. Your new assignment is to write an article for your "Disruptor Deep Dive" series.
For the {industryName} industry, your task is to identify one public company that perfectly fits the "disruptor" profile: it has already hit its stride with a proven product and significant traction, but it still has immense potential to disrupt the established leaders and redefine its industry.
Article Title: "Disruptor Deep Dive: How [Company Name] is Rewriting the Rules of the [Industry] Market"
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

When you mention a stock ticker, you MUST wrap it in a special tag like this: <stock-ticker>TICKER</stock-ticker>.
The tone should be insightful and optimistic about innovation, but grounded in business fundamentals and realistic about the challenges of disruption.
`;

const MACRO_PLAYBOOK_PROMPT = `
Act as a thematic investment strategist for a global macro fund. You are authoring a new report for your "Macro Playbook" series.
	1. The Wave (The Macro Trend):
		- Start by identifying and explaining one powerful, multi-year macro or societal trend. (e.g., The Electrification of Everything, The On-Shoring of Manufacturing, The Rise of the Global Middle Class, The Aging Population). Provide data on the size and expected growth of this trend.
	2. The 'Surfboard' (The Company):
		- Within the {sectorName} sector, identify 1 company that is a best-in-class, pure-play beneficiary of this macro wave. Explain why its business model is perfectly aligned to capture the growth from this trend.
	3. Quantifying the Tail-Wind:
		- How much of the company's current and projected revenue growth can be attributed directly to this macro trend? How does management talk about this trend in their investor presentations and earnings calls?
	4. Thesis Risks (When the Wave Breaks):
		- What could disrupt this thesis? Could the macro trend fizzle out, could government policy change, or could a new technology allow competitors to ride the wave more effectively?
	5. Conclusion: Investing in a Megatrend
		- Conclude with a summary of why owning this specific company is a smart and direct way for a long-term investor to gain exposure to this powerful, enduring global trend.
When you mention a stock ticker, you MUST wrap it in a special tag like this: <stock-ticker>TICKER</stock-ticker>.
`;

const INDUSTRY_MACRO_PLAYBOOK_PROMPT = `
Act as a thematic investment strategist for a global macro fund. You are authoring a new report for your "Macro Playbook" series.
	1. The Wave (The Macro Trend):
		- Start by identifying and explaining one powerful, multi-year macro or societal trend. (e.g., The Electrification of Everything, The On-Shoring of Manufacturing, The Rise of the Global Middle Class, The Aging Population). Provide data on the size and expected growth of this trend.
	2. The 'Surfboard' (The Company):
		- Within the {industryName} industry, identify 1 company that is a best-in-class, pure-play beneficiary of this macro wave. Explain why its business model is perfectly aligned to capture the growth from this trend.
	3. Quantifying the Tail-Wind:
		- How much of the company's current and projected revenue growth can be attributed directly to this macro trend? How does management talk about this trend in their investor presentations and earnings calls?
	4. Thesis Risks (When the Wave Breaks):
		- What could disrupt this thesis? Could the macro trend fizzle out, could government policy change, or could a new technology allow competitors to ride the wave more effectively?
	5. Conclusion: Investing in a Megatrend
		- Conclude with a summary of why owning this specific company is a smart and direct way for a long-term investor to gain exposure to this powerful, enduring global trend.
When you mention a stock ticker, you MUST wrap it in a special tag like this: <stock-ticker>TICKER</stock-ticker>.
`;

const ONE_SHOT_INDUSTRY_TREND_PROMPT = `
Role: You are an expert financial analyst AI. Your task is to write a detailed investment research report for a specific economic industry based on a provided list of companies and recent news articles.

Task:
You will be given a list of companies in the {industryName} industry and a list of recent news articles that may or may not be relevant to them.
Your task is to generate a comprehensive markdown report by following these steps:

1.  **Analyze and Synthesize:** Read all news articles and identify the most noteworthy trends, events, and narratives affecting the companies in the provided list.
2.  **Rank Companies:** From your analysis, identify the Top 3-5 most favorably mentioned companies. Your ranking must be based on the significance (e.g., earnings reports, major partnerships > product updates) and positive sentiment of the news.
3.  **Generate Report:** Structure your output as a single, professional markdown report.

Output Format:
The report must start with an overall summary, followed by a deeper dive into the top companies you identified. For each catalyst you mention, you MUST append a source placeholder at the end of the line, like this: \`[Source: X]\`, where X is the \`articleIndex\` from the original news data JSON.
When you mention a stock ticker, you MUST wrap it in a special tag like this: <stock-ticker>TICKER</stock-ticker>.

--- START OF REPORT ---
## AI-Powered Market Analysis: {industryName} Industry
### Overall Industry Outlook & Key Themes
Provide a 2-3 sentence summary of the overall outlook for the {industryName} industry based on the collective news. Identify the most significant themes present (e.g., M&A activity, supply chain pressures, regulatory changes).

### Deeper Dive: Top Companies in the News
For each of the top companies you identified:
1.  Use its name and ticker as a sub-header (e.g., "### 1. NVIDIA Corp (NVDA)"). You will have to find the company name associated with the ticker from the news articles.
2.  **Investment Thesis:** Write a concise, 2-3 sentence investment thesis summarizing why this company is currently viewed favorably based on the news.
3.  **Positive Catalysts:** Create a bulleted list of the specific positive events or catalysts from the news. Remember to append the source placeholder for each point.

--- END OF REPORT ---

List of companies in the industry:
[\${industryStocks}]

News Articles JSON Data:
{newsArticlesJson}
`;

// --- NEW NARRATIVE SECTOR PROMPTS (v7.2.0) ---
const TECHNOLOGY_SECTOR_PROMPT = CAPITAL_ALLOCATORS_PROMPT;
const HEALTH_CARE_SECTOR_PROMPT = CAPITAL_ALLOCATORS_PROMPT;
const FINANCIALS_SECTOR_PROMPT = CAPITAL_ALLOCATORS_PROMPT;
const CONSUMER_DISCRETIONARY_SECTOR_PROMPT = CAPITAL_ALLOCATORS_PROMPT;
const COMMUNICATION_SERVICES_SECTOR_PROMPT = CAPITAL_ALLOCATORS_PROMPT;
const INDUSTRIALS_SECTOR_PROMPT = CAPITAL_ALLOCATORS_PROMPT;
const CONSUMER_STAPLES_SECTOR_PROMPT = CAPITAL_ALLOCATORS_PROMPT;
const ENERGY_SECTOR_PROMPT = CAPITAL_ALLOCATORS_PROMPT;
const UTILITIES_SECTOR_PROMPT = CAPITAL_ALLOCATORS_PROMPT;
const REAL_ESTATE_SECTOR_PROMPT = CAPITAL_ALLOCATORS_PROMPT;
const MATERIALS_SECTOR_PROMPT = CAPITAL_ALLOCATORS_PROMPT;


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

// --- Global State ---
let db;
let auth;
let userId;
let firebaseConfig = null;
let appIsInitialized = false;
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
let availableIndustries = [];

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
    document.getElementById('industry-screener-section').classList.remove(CONSTANTS.CLASS_HIDDEN);
    document.getElementById('market-calendar-accordion').classList.remove(CONSTANTS.CLASS_HIDDEN);
    
    await fetchAndCachePortfolioData();
    displayMarketCalendar();
    renderSectorButtons();
    displayIndustryScreener();
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
    fmpApiKey = document.getElementById('fmpApiKeyInput').value.trim();
    geminiApiKey = document.getElementById(CONSTANTS.INPUT_GEMINI_KEY).value.trim();
    googleClientId = document.getElementById(CONSTANTS.INPUT_GOOGLE_CLIENT_ID).value.trim();
    searchApiKey = document.getElementById(CONSTANTS.INPUT_WEB_SEARCH_KEY).value.trim();
    searchEngineId = document.getElementById(CONSTANTS.INPUT_SEARCH_ENGINE_ID).value.trim();
    const tempFirebaseConfigText = document.getElementById('firebaseConfigInput').value.trim();
    let tempFirebaseConfig;

    if (!fmpApiKey || !geminiApiKey || !googleClientId || !searchApiKey || !searchEngineId || !tempFirebaseConfigText) {
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
            const errorText = await response.text(); // Read the body ONCE as text.
            let errorBody;
            try {
                // Now, try to parse the text as JSON.
                errorBody = JSON.parse(errorText);
            } catch {
                // If parsing fails, use the raw text.
                errorBody = errorText;
            }
            const errorMsg = typeof errorBody === 'object' ? (errorBody?.error?.message || errorBody?.Information) : errorBody;
            throw new Error(`API request failed: ${response.statusText || errorMsg}`);
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


// --- PORTFOLIO & DASHBOARD MANAGEMENT ---

async function _renderGroupedStockList(container, stocksWithData, listType) {
    container.innerHTML = ''; 
    if (stocksWithData.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-500 py-8">No stocks in your ${listType}.</p>`;
        return;
    }

    const groupedBySector = stocksWithData.reduce((acc, stock) => {
        const sector = stock.sector || 'Uncategorized';
        if (!acc[sector]) acc[sector] = [];
        acc[sector].push(stock);
        return acc;
    }, {});

    const sortedSectors = Object.keys(groupedBySector).sort();

    let html = '';
    sortedSectors.forEach(sector => {
        const stocks = groupedBySector[sector].sort((a, b) => a.companyName.localeCompare(b.companyName));
        html += `
            <details class="sector-group" open>
                <summary class="sector-header">
                    <span>${sanitizeText(sector)}</span>
                    <span class="sector-toggle-icon"></span>
                </summary>
                <div class="sector-content">
                    <ul class="divide-y divide-gray-200">`;
        
        stocks.forEach(stock => {
            const fmp = stock.fmpData;
            const refreshedAt = fmp.cachedAt ? fmp.cachedAt.toDate().toLocaleString() : 'N/A';

            html += `
                <li class="dashboard-list-item-detailed">
                    <div class="stock-main-info">
                        <p class="font-bold text-indigo-700">${sanitizeText(stock.companyName)}</p>
                        <p class="text-sm text-gray-600">${sanitizeText(stock.ticker)}</p>
                    </div>
                    <div class="stock-actions">
                        <div class="flex items-center justify-end gap-2">
                            <button class="dashboard-item-view bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold py-1 px-3 rounded-full" data-ticker="${sanitizeText(stock.ticker)}">View</button>
                            <button class="dashboard-item-refresh bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-semibold py-1 px-3 rounded-full" data-ticker="${sanitizeText(stock.ticker)}">Refresh</button>
                            <button class="dashboard-item-edit" data-ticker="${sanitizeText(stock.ticker)}">Edit</button>
                        </div>
                        <p class="text-xs text-gray-400 mt-2 text-right whitespace-nowrap" title="Last Refreshed">Refreshed: ${refreshedAt}</p>
                    </div>
                </li>`;
        });

        html += `</ul></div></details>`;
    });
    container.innerHTML = html;
}

async function fetchAndCachePortfolioData() {
    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = "Loading dashboard data...";
    
    try {
        const querySnapshot = await getDocs(collection(db, CONSTANTS.DB_COLLECTION_PORTFOLIO));
        portfolioCache = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const portfolioStocks = portfolioCache.filter(s => s.status === 'Portfolio');
        const watchlistStocks = portfolioCache.filter(s => s.status === 'Watchlist');

        document.getElementById('portfolio-count').textContent = portfolioStocks.length;
        document.getElementById('watchlist-count').textContent = watchlistStocks.length;

    } catch (error) {
        console.error("Error loading dashboard data:", error);
        displayMessageInModal(`Failed to load dashboard data: ${error.message}`, 'error');
        document.getElementById('portfolio-count').textContent = 'E';
        document.getElementById('watchlist-count').textContent = 'E';
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

async function openStockListModal(listType) {
    const modalId = CONSTANTS.MODAL_STOCK_LIST;
    const modal = document.getElementById(modalId);
    if (!modal) return;

    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Loading ${listType}...`;

    const title = modal.querySelector('#stock-list-modal-title');
    const container = modal.querySelector('#stock-list-modal-content');
    title.textContent = listType === 'Portfolio' ? 'My Portfolio' : 'My Watchlist';
    container.innerHTML = '';

    try {
        const stocksToFetch = portfolioCache.filter(s => s.status === listType);
        if (stocksToFetch.length === 0) {
            container.innerHTML = `<p class="text-center text-gray-500 py-8">No stocks in your ${listType}.</p>`;
            openModal(modalId);
            closeModal(CONSTANTS.MODAL_LOADING);
            return;
        }

        const stockDataPromises = stocksToFetch.map(stock => getFmpStockData(stock.ticker));
        const results = await Promise.allSettled(stockDataPromises);

        const stocksWithData = stocksToFetch.map((stock, index) => {
            if (results[index].status === 'fulfilled' && results[index].value) {
                return { ...stock, fmpData: results[index].value };
            }
            return { ...stock, fmpData: null };
        }).filter(stock => stock.fmpData);

        await _renderGroupedStockList(container, stocksWithData, listType);
        openModal(modalId);
    } catch (error) {
        console.error(`Error loading ${listType} modal:`, error);
        displayMessageInModal(`Failed to load ${listType}: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

async function openManageStockModal(stockData = {}) {
    const form = document.getElementById('manage-stock-form');
    form.reset();
    
    if (stockData.isEditMode) {
        document.getElementById('manage-stock-modal-title').textContent = `Edit ${stockData.ticker}`;
        document.getElementById('manage-stock-original-ticker').value = stockData.ticker;
        document.getElementById('manage-stock-ticker').value = stockData.ticker;
        document.getElementById('manage-stock-name').value = stockData.companyName;
        document.getElementById('manage-stock-exchange').value = stockData.exchange;
        document.getElementById('manage-stock-status').value = stockData.status || 'Watchlist';
        document.getElementById('manage-stock-sector').value = stockData.sector || '';
        document.getElementById('manage-stock-industry').value = stockData.industry || '';
    } else {
        document.getElementById('manage-stock-modal-title').textContent = 'Add New Stock';
        document.getElementById('manage-stock-original-ticker').value = '';
        document.getElementById('manage-stock-ticker').value = stockData.ticker || '';
        document.getElementById('manage-stock-name').value = stockData.companyName || '';
        document.getElementById('manage-stock-exchange').value = stockData.exchange || '';
        document.getElementById('manage-stock-status').value = 'Watchlist';
        document.getElementById('manage-stock-sector').value = stockData.sector || '';
        document.getElementById('manage-stock-industry').value = stockData.industry || '';
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
        sector: document.getElementById('manage-stock-sector').value.trim(),
        industry: document.getElementById('manage-stock-industry').value.trim(),
    };

    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = "Saving to your lists...";
    
    try {
        if (originalTicker && originalTicker !== newTicker) {
            await deleteDoc(doc(db, CONSTANTS.DB_COLLECTION_PORTFOLIO, originalTicker));
        }

        await setDoc(doc(db, CONSTANTS.DB_COLLECTION_PORTFOLIO, newTicker), stockData);

        const fmpCacheRef = collection(db, CONSTANTS.DB_COLLECTION_FMP_CACHE, newTicker, 'endpoints');
        const fmpSnapshot = await getDocs(query(fmpCacheRef, limit(1)));
        if (fmpSnapshot.empty) {
            document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `First time setup: Caching FMP data for ${newTicker}...`;
            await handleRefreshFmpData(newTicker);
        }

        closeModal(CONSTANTS.MODAL_MANAGE_STOCK);
        await fetchAndCachePortfolioData();
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
                await fetchAndCachePortfolioData();
                if(document.getElementById(CONSTANTS.MODAL_PORTFOLIO_MANAGER).classList.contains(CONSTANTS.CLASS_MODAL_OPEN)) {
                    renderPortfolioManagerList();
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
        
        const profileUrl = `https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${fmpApiKey}`;
        const profileData = await callApi(profileUrl);

        if (!profileData || profileData.length === 0 || !profileData[0].symbol) {
            throw new Error(`Could not fetch data for ${symbol}. It may be an invalid ticker.`);
        }
        const overviewData = profileData[0];

        const newStock = {
            ticker: overviewData.symbol,
            companyName: overviewData.companyName,
            exchange: overviewData.exchange,
            sector: overviewData.sector,
            industry: overviewData.industry,
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

async function openRawDataViewer(ticker) {
    const modalId = 'rawDataViewerModal';
    openModal(modalId);
    const mainAccordionContent = document.getElementById('raw-data-accordion-content');
    const aiButtonsContainer = document.getElementById('ai-buttons-container');
    const aiArticleContainer = document.getElementById('ai-article-container');
    const profileDisplayContainer = document.getElementById('company-profile-display-container');
    const titleEl = document.getElementById('raw-data-viewer-modal-title');
    
    titleEl.textContent = `Analyzing ${ticker}...`;
    mainAccordionContent.innerHTML = '<div class="loader mx-auto"></div>';
    aiButtonsContainer.innerHTML = '';
    aiArticleContainer.innerHTML = '';
    profileDisplayContainer.innerHTML = '';

    try {
        const fmpData = await getFmpStockData(ticker);
        if (!fmpData) {
            throw new Error('No cached FMP data found for this stock.');
        }

        titleEl.textContent = `Analysis for ${ticker}`;
        
        // Build nested accordions for raw data
        let accordionHtml = '';
        const sortedKeys = Object.keys(fmpData).filter(key => key !== 'cachedAt' && fmpData[key]).sort();

        for (const key of sortedKeys) {
            accordionHtml += `
                <details class="mb-2 bg-white rounded-lg border">
                    <summary class="p-3 font-semibold text-gray-700 cursor-pointer hover:bg-gray-50">${sanitizeText(key)}</summary>
                    <pre class="text-xs whitespace-pre-wrap break-all bg-gray-900 text-white p-3 rounded-b-lg">${sanitizeText(JSON.stringify(fmpData[key], null, 2))}</pre>
                </details>
            `;
        }
        mainAccordionContent.innerHTML = accordionHtml;

        // Build AI buttons
        const buttons = [
            { class: 'financial-analysis-button', text: 'Financial Analysis', bg: 'bg-teal-500 hover:bg-teal-600' },
            { class: 'undervalued-analysis-button', text: 'Undervalued Analysis', bg: 'bg-amber-500 hover:bg-amber-600' },
            { class: 'bull-bear-analysis-button', text: 'Bull vs. Bear', bg: 'bg-purple-500 hover:bg-purple-600' },
            { class: 'moat-analysis-button', text: 'Moat Analysis', bg: 'bg-cyan-500 hover:bg-cyan-600' },
            { class: 'dividend-safety-button', text: 'Dividend Safety', bg: 'bg-sky-500 hover:bg-sky-600' },
            { class: 'growth-outlook-button', text: 'Growth Outlook', bg: 'bg-lime-500 hover:bg-lime-600' },
            { class: 'risk-assessment-button', text: 'Risk Assessment', bg: 'bg-rose-500 hover:bg-rose-600' },
            { class: 'capital-allocators-button', text: 'Capital Allocators', bg: 'bg-orange-500 hover:bg-orange-600' }
        ];
        
        aiButtonsContainer.innerHTML = buttons.map(btn => 
            `<button data-symbol="${ticker}" class="${btn.class} text-sm ${btn.bg} text-white font-semibold py-2 px-4 rounded-lg">${btn.text}</button>`
        ).join('');
        
        // Render the new company profile section
        const imageUrl = get(fmpData, 'company_profile_data.0.image', '');
        const description = get(fmpData, 'company_profile_data.0.description', 'No description available.');
        const exchange = get(fmpData, 'sec_company_full_profile.0.exchange', 'N/A');
        const sector = get(fmpData, 'company_profile_data.0.sector', 'N/A');
        const filingsUrl = get(fmpData, 'sec_company_full_profile.0.secFilingsUrl', '');

        let profileHtml = '<div class="mt-6 border-t pt-4">';
        if (imageUrl) {
            profileHtml += `
                <div class="flex flex-col md:flex-row gap-6 items-start">
                    <img src="${sanitizeText(imageUrl)}" alt="Company Logo" class="w-24 h-24 rounded-md object-contain border p-1 bg-white flex-shrink-0" />
                    <div>`;
        } else {
            profileHtml += `<div>`;
        }

        profileHtml += `<p class="text-sm text-gray-700 mb-4">${sanitizeText(description)}</p>`;
        
        profileHtml += `<div class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mt-4 border-t pt-3">`;
        profileHtml += `<div><p class="font-semibold text-gray-500">Exchange</p><p class="text-gray-800">${sanitizeText(exchange)}</p></div>`;
        profileHtml += `<div><p class="font-semibold text-gray-500">Sector</p><p class="text-gray-800">${sanitizeText(sector)}</p></div>`;

        if (filingsUrl) {
             profileHtml += `<div class="col-span-2"><p class="font-semibold text-gray-500">SEC Filings</p><a href="${sanitizeText(filingsUrl)}" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:underline">${sanitizeText(filingsUrl)}</a></div>`;
        }
        
        profileHtml += `</div></div></div>`;
        profileDisplayContainer.innerHTML = profileHtml;


    } catch (error) {
        console.error('Error opening raw data viewer:', error);
        titleEl.textContent = `Error Loading Data for ${ticker}`;
        mainAccordionContent.innerHTML = `<p class="text-red-500 text-center">${error.message}</p>`;
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
        const stockData = await getFmpStockData(ticker);
        if (!stockData) {
            throw new Error(`Could not load required FMP data for ${ticker}. Please ensure data is cached.`);
        }

        const portfolioInfo = portfolioCache.find(s => s.ticker === ticker);
        const status = portfolioInfo ? portfolioInfo.status : null;
        
        const newCardHtml = renderOverviewCard(stockData, ticker, status);

        const container = document.getElementById(CONSTANTS.CONTAINER_DYNAMIC_CONTENT);
        const oldCard = document.getElementById(`card-${ticker}`);
        if(oldCard) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = newCardHtml;
            oldCard.replaceWith(tempDiv.firstElementChild);
        } else {
            container.insertAdjacentHTML('beforeend', newCardHtml);
        }
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
        article.title && article.text && isValidHttpUrl(article.url)
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
                    <a href="${sanitizeText(article.url)}" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:underline font-semibold block mb-2">${sanitizeText(article.title)}</a>
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
    
    button.disabled = true;
    button.textContent = 'Analyzing...';

    try {
        const stockData = await getFmpStockData(symbol);
        const companyName = get(stockData, 'company_profile.0.companyName', symbol);
        const url = `https://financialmodelingprep.com/api/v3/stock_news?tickers=${symbol}&limit=50&apikey=${fmpApiKey}`;
        
        const newsData = await callApi(url);
        const validArticles = filterValidNews(newsData);

        if (validArticles.length > 0) {
            const articlesForPrompt = validArticles.slice(0, 10).map(a => ({ 
                title: a.title, 
                snippet: a.text,
                publicationDate: a.publishedDate ? a.publishedDate.split(' ')[0] : 'N/A' 
            }));

            const prompt = NEWS_SENTIMENT_PROMPT
                .replace('{companyName}', companyName)
                .replace('{tickerSymbol}', symbol)
                .replace('{news_articles_json}', JSON.stringify(articlesForPrompt, null, 2));

            const rawResult = await callGeminiApi(prompt);
            
            const jsonMatch = rawResult.match(/```json\n([\s\S]*?)\n```|(\[[\s\S]*\])/);
            const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[2]).trim() : '';
            const summaryMarkdown = rawResult.split(jsonMatch ? jsonMatch[0] : ']').pop().trim();

            const sentiments = JSON.parse(jsonString);
            
            if (Array.isArray(sentiments) && sentiments.length > 0) {
                 const articlesWithSentiment = sentiments.map((sentiment, index) => ({
                    ...sentiment,
                    title: validArticles[index].title,
                    url: validArticles[index].url
                }));
                 renderNewsArticles(articlesWithSentiment, summaryMarkdown, symbol);
            } else {
                 renderNewsArticles([], '', symbol);
            }
        } else {
             renderNewsArticles([], '', symbol);
        }

    } catch (error) {
        console.error("Error fetching news:", error);
        displayMessageInModal(`Could not fetch news: ${error.message}`, 'error');
        renderNewsArticles([], '', symbol);
    } finally {
        button.disabled = false;
        button.textContent = 'Fetch News';
    }
}

// --- UI RENDERING ---

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

    const earningsForDay = calendarEvents.earnings.filter(e => new Date(e.date).toDateString() === calendarCurrentDate.toDateString());
    const iposForDay = calendarEvents.ipos.filter(i => new Date(i.date).toDateString() === calendarCurrentDate.toDateString());

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
                            <p class="font-bold ${itemTextColor}">${sanitizeText(e.company || e.symbol)} (${sanitizeText(e.symbol)})</p>
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

    const docRef = doc(db, CONSTANTS.DB_COLLECTION_CALENDAR, 'latest_fmp');
    let shouldFetchNewData = true;

    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const cachedData = docSnap.data();
            const cacheDate = cachedData.cachedAt.toDate();
            const daysSinceCache = (new Date() - cacheDate) / (1000 * 60 * 60 * 24);
            
            if (daysSinceCache < 1) { // FMP data can be refreshed daily
                calendarEvents.earnings = cachedData.earnings || [];
                calendarEvents.ipos = cachedData.ipos || [];
                shouldFetchNewData = false;
            }
        }
    } catch (dbError) {
        console.error("Error reading calendar cache from Firestore:", dbError);
    }
    
    if (shouldFetchNewData) {
        try {
            const today = new Date();
            const from = today.toISOString().split('T')[0];
            const to = from; // Fetch only one day of data

            const [earningsData, ipoData] = await Promise.all([
                callApi(`https://financialmodelingprep.com/api/v3/earning_calendar?from=${from}&to=${to}&apikey=${fmpApiKey}`),
                callApi(`https://financialmodelingprep.com/api/v3/ipo_calendar?from=${from}&to=${to}&apikey=${fmpApiKey}`)
            ]);

            calendarEvents.earnings = (earningsData || []).filter(e => e.exchange && !e.exchange.includes('OTC'));
            calendarEvents.ipos = (ipoData || []).filter(i => i.exchange && !i.exchange.includes('OTC'));

            const dataToCache = { 
                earnings: calendarEvents.earnings, 
                ipos: calendarEvents.ipos, 
                cachedAt: Timestamp.now() 
            };
            await setDoc(docRef, dataToCache);

        } catch (apiError) {
            console.error("Error fetching calendar data from FMP API:", apiError);
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
    const profile = get(data, 'company_profile.0', {});
    const quote = get(data, 'stock_quote.0', {});
    const income = get(data, 'income_statement.0', {});

    if (!profile.symbol) return '';

    const price = get(quote, 'price', 0);
    const change = get(quote, 'change', 0);
    const changePercent = get(quote, 'changesPercentage', 0);
    const changeColorClass = change >= 0 ? 'price-gain' : 'price-loss';
    const changeSign = change >= 0 ? '+' : '';

    let statusBadge = '';
    if (status === 'Portfolio') {
        statusBadge = '<span class="ml-2 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-100 text-green-800">Portfolio</span>';
    } else if (status === 'Watchlist') {
        statusBadge = '<span class="ml-2 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">Watchlist</span>';
    }

    const marketCap = formatLargeNumber(get(profile, 'mktCap'));
    const netIncome = get(income, 'netIncome', 0);
    const peRatio = (profile.mktCap && netIncome && netIncome > 0) ? (profile.mktCap / netIncome).toFixed(2) : 'N/A';
    
    const sma50 = get(quote, 'priceAvg50', 'N/A');
    const sma200 = get(quote, 'priceAvg200', 'N/A');
    
    const fmpTimestampString = data.cachedAt ? `FMP Data Stored On: ${data.cachedAt.toDate().toLocaleDateString()}` : '';

    return `
        <div class="bg-white rounded-2xl shadow-lg border border-gray-200 p-6" id="card-${symbol}">
            <div class="flex justify-between items-start gap-4">
                <div>
                    <h2 class="text-2xl font-bold text-gray-800 flex items-center">${sanitizeText(profile.companyName)} (${sanitizeText(profile.symbol)}) ${statusBadge}</h2>
                    <p class="text-gray-500">${sanitizeText(profile.exchange)} | ${sanitizeText(profile.sector)}</p>
                </div>
                <div class="text-right flex-shrink-0">
                    <p class="text-2xl font-bold">$${price.toFixed(2)}</p>
                    <p class="text-sm font-semibold ${changeColorClass}">${changeSign}${change.toFixed(2)} (${changeSign}${changePercent.toFixed(2)}%)</p>
                </div>
            </div>
            
            <p class="mt-4 text-sm text-gray-600">${sanitizeText(profile.description)}</p>
            
            <div class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center border-t pt-4">
                <div><p class="text-sm text-gray-500">Market Cap</p><p class="text-lg font-semibold">${sanitizeText(marketCap)}</p></div>
                <div><p class="text-sm text-gray-500">P/E Ratio</p><p class="text-lg font-semibold">${sanitizeText(peRatio)}</p></div>
                <div><p class="text-sm text-gray-500">50-Day MA</p><p class="text-lg font-semibold">$${sma50.toFixed(2)}</p></div>
                <div><p class="text-sm text-gray-500">200-Day MA</p><p class="text-lg font-semibold">$${sma200.toFixed(2)}</p></div>
            </div>

            <div class="mt-6 border-t pt-4 flex items-center flex-wrap gap-x-4 gap-y-2 justify-center">
                <button data-symbol="${symbol}" class="refresh-fmp-button text-sm bg-cyan-100 text-cyan-700 hover:bg-cyan-200 font-semibold py-2 px-4 rounded-lg">Refresh FMP</button>
                <button data-symbol="${symbol}" class="view-fmp-data-button text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg">View FMP Data</button>
                <button data-symbol="${symbol}" class="fetch-news-button text-sm bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg">Fetch News</button>
            </div>
            <div class="text-right text-xs text-gray-400 mt-4">
                <div>${fmpTimestampString}</div>
            </div>
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

    const groupedBySector = portfolioCache.reduce((acc, stock) => {
        const sector = stock.sector || 'Uncategorized';
        if (!acc[sector]) {
            acc[sector] = [];
        }
        acc[sector].push(stock);
        return acc;
    }, {});

    let html = '';
    const sortedSectors = Object.keys(groupedBySector).sort();
    
    for (const sector of sortedSectors) {
        html += `<div class="portfolio-exchange-header">${sanitizeText(sector)}</div>`;
        html += '<ul class="divide-y divide-gray-200">';
        groupedBySector[sector].sort((a,b) => a.companyName.localeCompare(b.companyName)).forEach(stock => {
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

// --- FMP API INTEGRATION & MANAGEMENT ---
async function handleRefreshFmpData(symbol) {
    if (!fmpApiKey) {
        displayMessageInModal("Financial Modeling Prep API Key is required for this feature.", "warning");
        return;
    }

    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Fetching all FMP data for ${symbol}...`;

    try {
        const endpointsSnapshot = await getDocs(collection(db, CONSTANTS.DB_COLLECTION_FMP_ENDPOINTS));
        if (endpointsSnapshot.empty) {
            throw new Error("No FMP endpoints configured. Please add endpoints via the manager.");
        }

        const endpoints = endpointsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        let successfulFetches = 0;

        for (const endpoint of endpoints) {
            if (!endpoint.url_template || !endpoint.name) continue;

            document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Fetching FMP Data: ${endpoint.name}...`;
            
            const url = endpoint.url_template
                .replace('${symbol}', symbol)
                .replace('${fmpApiKey}', fmpApiKey);
            
            const data = await callApi(url);

            if (!data || (Array.isArray(data) && data.length === 0)) {
                 console.warn(`No data returned from FMP for endpoint: ${endpoint.name}`);
                 continue;
            }

            const dataToCache = {
                cachedAt: Timestamp.now(),
                data: data
            };

            const docRef = doc(db, CONSTANTS.DB_COLLECTION_FMP_CACHE, symbol, 'endpoints', endpoint.id);
            await setDoc(docRef, dataToCache);
            
            const endpointDocRef = doc(db, CONSTANTS.DB_COLLECTION_FMP_ENDPOINTS, endpoint.id);
            await updateDoc(endpointDocRef, {
                usageCount: increment(1)
            });

            successfulFetches++;
        }
        
        displayMessageInModal(`Successfully fetched and updated data for ${successfulFetches} FMP endpoint(s). You can now view it.`, 'info');
        
        await fetchAndCachePortfolioData();

    } catch (error) {
        console.error("Error fetching FMP data:", error);
        displayMessageInModal(`Could not fetch FMP data: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

async function handleViewFmpData(symbol) {
    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Loading FMP data for ${symbol}...`;
    
    const contentContainer = document.getElementById('view-fmp-data-content');
    contentContainer.innerHTML = '';

    try {
        const endpointsSnapshot = await getDocs(collection(db, CONSTANTS.DB_COLLECTION_FMP_ENDPOINTS));
        const endpointNames = {};
        endpointsSnapshot.forEach(doc => {
            endpointNames[doc.id] = doc.data().name || 'Unnamed Endpoint';
        });

        const fmpCacheRef = collection(db, CONSTANTS.DB_COLLECTION_FMP_CACHE, symbol, 'endpoints');
        const fmpCacheSnapshot = await getDocs(fmpCacheRef);

        if (fmpCacheSnapshot.empty) {
            contentContainer.innerHTML = '<p class="text-center text-gray-500 py-8">No FMP data has been cached for this stock yet. Use the "Refresh FMP" button first.</p>';
        } else {
            const fmpData = fmpCacheSnapshot.docs.map(doc => ({
                name: endpointNames[doc.id] || `Unknown (${doc.id})`,
                ...doc.data()
            })).sort((a, b) => a.name.localeCompare(b.name));

            const html = fmpData.map(item => `
                <div>
                    <h3 class="text-lg font-bold text-gray-800">${sanitizeText(item.name)}</h3>
                    <p class="text-xs text-gray-500 mb-2">Cached On: ${item.cachedAt.toDate().toLocaleString()}</p>
                    <pre class="text-xs whitespace-pre-wrap break-all bg-white p-4 rounded-lg border">${sanitizeText(JSON.stringify(item.data, null, 2))}</pre>
                </div>
            `).join('');
            contentContainer.innerHTML = html;
        }

        document.getElementById('view-fmp-data-modal-title').textContent = `Cached FMP Data for ${symbol}`;
        openModal(CONSTANTS.MODAL_VIEW_FMP_DATA);

    } catch (error) {
        console.error("Error viewing FMP data:", error);
        displayMessageInModal(`Could not display FMP data: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

async function openManageFmpEndpointsModal() {
    await renderFmpEndpointsList();
    openModal(CONSTANTS.MODAL_MANAGE_FMP_ENDPOINTS);
}

async function renderFmpEndpointsList() {
    const container = document.getElementById('fmp-endpoints-list-container');
    container.innerHTML = 'Loading endpoints...';
    try {
        const querySnapshot = await getDocs(collection(db, CONSTANTS.DB_COLLECTION_FMP_ENDPOINTS));
        if (querySnapshot.empty) {
            container.innerHTML = '<p class="text-center text-gray-500 py-4">No endpoints saved.</p>';
            return;
        }
        const endpoints = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        container.innerHTML = endpoints.map(ep => `
            <div class="p-3 bg-white border rounded-lg flex justify-between items-center">
                <div>
                    <p class="font-semibold text-gray-700">${sanitizeText(ep.name)} <span class="text-xs font-normal text-gray-500">(Used: ${ep.usageCount || 0})</span></p>
                    <p class="text-xs text-gray-500 font-mono">${sanitizeText(ep.url_template)}</p>
                </div>
                <div class="flex gap-2">
                    <button class="edit-fmp-endpoint-btn text-sm font-medium text-indigo-600 hover:text-indigo-800" data-id="${ep.id}" data-name="${sanitizeText(ep.name)}" data-url="${sanitizeText(ep.url_template)}">Edit</button>
                    <button class="delete-fmp-endpoint-btn text-sm font-medium text-red-600 hover:text-red-800" data-id="${ep.id}">Delete</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error rendering FMP endpoints:', error);
        container.innerHTML = '<p class="text-red-500">Could not load endpoints.</p>';
    }
}

function handleEditFmpEndpoint(id, name, url) {
    document.getElementById('fmp-endpoint-id').value = id;
    document.getElementById('fmp-endpoint-name').value = name;
    document.getElementById('fmp-endpoint-url').value = url;
    document.getElementById('cancel-fmp-endpoint-edit').classList.remove('hidden');
    document.querySelector('#manage-fmp-endpoint-form button[type="submit"]').textContent = "Update Endpoint";
}

function cancelFmpEndpointEdit() {
    document.getElementById('manage-fmp-endpoint-form').reset();
    document.getElementById('fmp-endpoint-id').value = '';
    document.getElementById('cancel-fmp-endpoint-edit').classList.add('hidden');
    document.querySelector('#manage-fmp-endpoint-form button[type="submit"]').textContent = "Save Endpoint";
}

async function handleSaveFmpEndpoint(e) {
    e.preventDefault();
    const id = document.getElementById('fmp-endpoint-id').value;
    const name = document.getElementById('fmp-endpoint-name').value.trim();
    const url_template = document.getElementById('fmp-endpoint-url').value.trim();

    if (!name || !url_template) {
        displayMessageInModal('Endpoint Name and URL Template are required.', 'warning');
        return;
    }

    const data = { name, url_template };
    
    try {
        if (id) {
            await setDoc(doc(db, CONSTANTS.DB_COLLECTION_FMP_ENDPOINTS, id), data, { merge: true });
        } else {
            const docId = name.toLowerCase().replace(/\s+/g, '_');
            data.usageCount = 0;
            await setDoc(doc(db, CONSTANTS.DB_COLLECTION_FMP_ENDPOINTS, docId), data);
        }
        cancelFmpEndpointEdit();
        await renderFmpEndpointsList();
    } catch (error) {
        console.error('Error saving FMP endpoint:', error);
        displayMessageInModal(`Could not save endpoint: ${error.message}`, 'error');
    }
}

function handleDeleteFmpEndpoint(id) {
    openConfirmationModal('Delete Endpoint?', 'Are you sure you want to delete this endpoint? This cannot be undone.', async () => {
        try {
            await deleteDoc(doc(db, CONSTANTS.DB_COLLECTION_FMP_ENDPOINTS, id));
            await renderFmpEndpointsList();
        } catch (error) {
            console.error('Error deleting FMP endpoint:', error);
            displayMessageInModal(`Could not delete endpoint: ${error.message}`, 'error');
        }
    });
}

// --- BROAD API ENDPOINT MANAGEMENT ---

async function openManageBroadEndpointsModal() {
    await renderBroadEndpointsList();
    openModal(CONSTANTS.MODAL_MANAGE_BROAD_ENDPOINTS);
}

async function renderBroadEndpointsList() {
    const container = document.getElementById('broad-endpoints-list-container');
    container.innerHTML = 'Loading endpoints...';
    try {
        const querySnapshot = await getDocs(collection(db, CONSTANTS.DB_COLLECTION_BROAD_ENDPOINTS));
        if (querySnapshot.empty) {
            container.innerHTML = '<p class="text-center text-gray-500 py-4">No endpoints saved.</p>';
            return;
        }
        const endpoints = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        container.innerHTML = endpoints.map(ep => `
            <div class="p-3 bg-white border rounded-lg flex justify-between items-center">
                <div>
                    <p class="font-semibold text-gray-700">${sanitizeText(ep.name)} <span class="text-xs font-normal text-gray-500">(Used: ${ep.usageCount || 0})</span></p>
                    <p class="text-xs text-gray-500 font-mono">${sanitizeText(ep.url_template)}</p>
                </div>
                <div class="flex gap-2">
                    <button class="edit-broad-endpoint-btn text-sm font-medium text-indigo-600 hover:text-indigo-800" data-id="${ep.id}" data-name="${sanitizeText(ep.name)}" data-url="${sanitizeText(ep.url_template)}">Edit</button>
                    <button class="delete-broad-endpoint-btn text-sm font-medium text-red-600 hover:text-red-800" data-id="${ep.id}">Delete</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error rendering Broad API endpoints:', error);
        container.innerHTML = '<p class="text-red-500">Could not load endpoints.</p>';
    }
}

function handleEditBroadEndpoint(id, name, url) {
    document.getElementById('broad-endpoint-id').value = id;
    document.getElementById('broad-endpoint-name').value = name;
    document.getElementById('broad-endpoint-url').value = url;
    document.getElementById('cancel-broad-endpoint-edit').classList.remove('hidden');
    document.querySelector('#manage-broad-endpoint-form button[type="submit"]').textContent = "Update Endpoint";
}

function cancelBroadEndpointEdit() {
    document.getElementById('manage-broad-endpoint-form').reset();
    document.getElementById('broad-endpoint-id').value = '';
    document.getElementById('cancel-broad-endpoint-edit').classList.add('hidden');
    document.querySelector('#manage-broad-endpoint-form button[type="submit"]').textContent = "Save Endpoint";
}

async function handleSaveBroadEndpoint(e) {
    e.preventDefault();
    const id = document.getElementById('broad-endpoint-id').value;
    const name = document.getElementById('broad-endpoint-name').value.trim();
    const url_template = document.getElementById('broad-endpoint-url').value.trim();

    if (!name || !url_template) {
        displayMessageInModal('Endpoint Name and URL Template are required.', 'warning');
        return;
    }

    const data = { name, url_template };
    
    try {
        if (id) {
            await setDoc(doc(db, CONSTANTS.DB_COLLECTION_BROAD_ENDPOINTS, id), data, { merge: true });
        } else {
            const docId = name.toLowerCase().replace(/\s+/g, '_');
            data.usageCount = 0;
            await setDoc(doc(db, CONSTANTS.DB_COLLECTION_BROAD_ENDPOINTS, docId), data);
        }
        cancelBroadEndpointEdit();
        await renderBroadEndpointsList();
    } catch (error) {
        console.error('Error saving Broad API endpoint:', error);
        displayMessageInModal(`Could not save endpoint: ${error.message}`, 'error');
    }
}

function handleDeleteBroadEndpoint(id) {
    openConfirmationModal('Delete Endpoint?', 'Are you sure you want to delete this endpoint? This cannot be undone.', async () => {
        try {
            await deleteDoc(doc(db, CONSTANTS.DB_COLLECTION_BROAD_ENDPOINTS, id));
            await renderBroadEndpointsList();
        } catch (error) {
            console.error('Error deleting Broad API endpoint:', error);
            displayMessageInModal(`Could not delete endpoint: ${error.message}`, 'error');
        }
    });
}


// --- EVENT LISTENER SETUP ---

function setupGlobalEventListeners() {
    document.getElementById('dashboard-section').addEventListener('click', (e) => {
        const refreshButton = e.target.closest('.dashboard-refresh-button');
        if (refreshButton) {
            fetchAndCachePortfolioData();
            return;
        }
        
        const portfolioButton = e.target.closest('#open-portfolio-modal-button');
        if (portfolioButton) {
            openStockListModal('Portfolio');
            return;
        }

        const watchlistButton = e.target.closest('#open-watchlist-modal-button');
        if (watchlistButton) {
            openStockListModal('Watchlist');
            return;
        }
    });

    document.getElementById(CONSTANTS.MODAL_STOCK_LIST).addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        if (target.id === 'expand-all-button') {
            document.querySelectorAll('#stock-list-modal-content .sector-group').forEach(d => d.open = true);
            return;
        }
        if (target.id === 'collapse-all-button') {
            document.querySelectorAll('#stock-list-modal-content .sector-group').forEach(d => d.open = false);
            return;
        }
        
        const ticker = target.dataset.ticker;
        if (ticker) {
            if (target.classList.contains('dashboard-item-edit')) {
                const stockData = portfolioCache.find(s => s.ticker === ticker);
                if (stockData) {
                    openManageStockModal({ ...stockData, isEditMode: true });
                }
            } else if (target.classList.contains('dashboard-item-view')) {
                openRawDataViewer(ticker);
            } else if (target.classList.contains('dashboard-item-refresh')) {
                handleRefreshFmpData(ticker);
            }
        }
    });

    document.getElementById(CONSTANTS.CONTAINER_DYNAMIC_CONTENT).addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        
        const symbol = target.dataset.symbol || target.dataset.ticker;
        if (!symbol) return;

        if (target.classList.contains('fetch-news-button')) handleFetchNews(symbol);
        if (target.classList.contains('refresh-fmp-button')) handleRefreshFmpData(symbol);
        if (target.classList.contains('view-fmp-data-button')) handleViewFmpData(symbol);
    });

    document.getElementById('customAnalysisModal').addEventListener('click', (e) => {
        const target = e.target.closest('button[data-prompt-name]');
        if (target) {
            const sector = target.dataset.sector;
            const promptName = target.dataset.promptName;
            if (promptName === 'MarketTrends') {
                handleMarketTrendsAnalysis(sector, 'sector');
            } else if (promptName === 'DisruptorAnalysis') {
                handleDisruptorAnalysis(sector);
            } else if (promptName === 'MacroPlaybook') {
                handleMacroPlaybookAnalysis(sector);
            } else {
                handleCreativeSectorAnalysis(sector, promptName);
            }
        }
    });

    document.getElementById('industryAnalysisModal').addEventListener('click', (e) => {
        const target = e.target.closest('button[data-prompt-name]');
        if (target) {
            const industry = target.dataset.industry;
            const promptName = target.dataset.promptName;
            if (promptName === 'MarketTrends') {
                handleIndustryMarketTrendsAnalysis(industry);
            } else if (promptName === 'DisruptorAnalysis') {
                handleIndustryDisruptorAnalysis(industry);
            } else if (promptName === 'MacroPlaybook') {
                handleIndustryMacroPlaybookAnalysis(industry);
            } else if (promptName === 'PlaybookAnalysis') {
                handleIndustryPlaybookAnalysis(industry);
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
    
    document.getElementById('manageFmpEndpointsModal')?.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        const id = target.dataset.id;
        if (target.classList.contains('edit-fmp-endpoint-btn')) {
            handleEditFmpEndpoint(id, target.dataset.name, target.dataset.url);
        } else if (target.classList.contains('delete-fmp-endpoint-btn')) {
            handleDeleteFmpEndpoint(id);
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

    document.getElementById('manage-fmp-endpoint-form')?.addEventListener('submit', handleSaveFmpEndpoint);
    document.getElementById('cancel-fmp-endpoint-edit')?.addEventListener('click', cancelFmpEndpointEdit);

    document.getElementById('manage-broad-endpoint-form')?.addEventListener('submit', handleSaveBroadEndpoint);
    document.getElementById('cancel-broad-endpoint-edit')?.addEventListener('click', cancelBroadEndpointEdit);

    document.querySelectorAll('.save-to-drive-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const modalId = e.target.dataset.modalId;
            handleSaveToDrive(modalId);
        });
    });

    const scrollTopBtn = document.getElementById(CONSTANTS.BUTTON_SCROLL_TOP);
    if (scrollTopBtn) scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    document.getElementById('manage-all-stocks-button')?.addEventListener('click', openPortfolioManagerModal);
    document.getElementById('manage-fmp-endpoints-button')?.addEventListener('click', openManageFmpEndpointsModal);
    document.getElementById('manage-broad-endpoints-button')?.addEventListener('click', openManageBroadEndpointsModal);

    const modalsToClose = [
        { modal: CONSTANTS.MODAL_CUSTOM_ANALYSIS, button: 'close-custom-analysis-modal', bg: 'close-custom-analysis-modal-bg' },
        { modal: CONSTANTS.MODAL_INDUSTRY_ANALYSIS, button: 'close-industry-analysis-modal', bg: 'close-industry-analysis-modal-bg' },
        { modal: CONSTANTS.MODAL_MANAGE_STOCK, bg: 'close-manage-stock-modal-bg'},
        { modal: CONSTANTS.MODAL_CONFIRMATION, button: 'cancel-button'},
        { modal: CONSTANTS.MODAL_PORTFOLIO_MANAGER, button: 'close-portfolio-manager-modal', bg: 'close-portfolio-manager-modal-bg' },
        { modal: CONSTANTS.MODAL_VIEW_FMP_DATA, button: 'close-view-fmp-data-modal', bg: 'close-view-fmp-data-modal-bg' },
        { modal: CONSTANTS.MODAL_MANAGE_FMP_ENDPOINTS, button: 'close-manage-fmp-endpoints-modal', bg: 'close-manage-fmp-endpoints-modal-bg' },
        { modal: CONSTANTS.MODAL_MANAGE_BROAD_ENDPOINTS, button: 'close-manage-broad-endpoints-modal', bg: 'close-manage-broad-endpoints-modal-bg' },
        { modal: 'rawDataViewerModal', button: 'close-raw-data-viewer-modal-button', bg: 'close-raw-data-viewer-modal-bg' },
        { modal: 'rawDataViewerModal', button: 'close-raw-data-viewer-modal' },
        { modal: CONSTANTS.MODAL_STOCK_LIST, button: 'close-stock-list-modal', bg: 'close-stock-list-modal-bg' },
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

    document.getElementById('industry-buttons-container')?.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (target && target.dataset.industry) {
            handleIndustrySelection(target.dataset.industry);
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

    document.getElementById('rawDataViewerModal').addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;
    
        if (target.id === 'raw-data-accordion-toggle') {
            const content = document.getElementById('raw-data-accordion-content');
            const icon = document.getElementById('raw-data-toggle-icon');
            content.classList.toggle('hidden');
            icon.classList.toggle('rotate-180');
            return;
        }
    
        const symbol = target.dataset.symbol;
        if (!symbol) return;
    
        if (target.classList.contains('financial-analysis-button')) handleFinancialAnalysis(symbol);
        if (target.classList.contains('undervalued-analysis-button')) handleUndervaluedAnalysis(symbol);
        if (target.classList.contains('bull-bear-analysis-button')) handleBullBearAnalysis(symbol);
        if (target.classList.contains('moat-analysis-button')) handleMoatAnalysis(symbol);
        if (target.classList.contains('dividend-safety-button')) handleDividendSafetyAnalysis(symbol);
        if (target.classList.contains('growth-outlook-button')) handleGrowthOutlookAnalysis(symbol);
        if (target.classList.contains('risk-assessment-button')) handleRiskAssessmentAnalysis(symbol);
        if (target.classList.contains('capital-allocators-button')) handleCapitalAllocatorsAnalysis(symbol);
    });

    document.getElementById('manageBroadEndpointsModal')?.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        const id = target.dataset.id;
        if (target.classList.contains('edit-broad-endpoint-btn')) {
            handleEditBroadEndpoint(id, target.dataset.name, target.dataset.url);
        } else if (target.classList.contains('delete-broad-endpoint-btn')) {
            handleDeleteBroadEndpoint(id);
        }
    });

    setupGlobalEventListeners();
}

// --- SECTOR ANALYSIS: AI AGENT WORKFLOW ---

async function searchSectorNews({ sectorName, sectorStocks }) {
    if (!fmpApiKey) {
        throw new Error("FMP API Key is required for news search.");
    }
    const url = `https://financialmodelingprep.com/api/v3/stock_news?limit=100&apikey=${fmpApiKey}`;
    
    const newsData = await callApi(url);
    const validArticles = filterValidNews(newsData || []);

    if (validArticles.length === 0) {
        return { error: "No relevant news articles found", detail: `Could not find any recent news.` };
    }

    return {
        articles: validArticles.map((a, index) => ({
            title: a.title,
            snippet: a.text,
            link: a.url,
            source: a.site,
            symbol: a.symbol,
            publicationDate: a.publishedDate ? a.publishedDate.split(' ')[0] : 'N/A',
            articleIndex: index
        })),
        sectorStocks: sectorStocks
    };
}

async function synthesizeAndRankCompanies({ newsArticles, sectorStocks }) {
    const prompt = `
        Role: You are a quantitative financial analyst AI. Your task is to analyze a general list of financial news articles and identify the most noteworthy companies that belong to a specific sector.

        Task:
        1. You are given a list of stock tickers that belong to the target sector: [${sectorStocks.join(', ')}].
        2. Read the provided JSON data of general news articles.
        3. Filter these articles, considering only those where the article's "symbol" matches one of the tickers in the provided sector list.
        4. From this filtered list, identify the Top 3-5 most favorably mentioned companies. Your ranking must be based on the significance (e.g., earnings reports > product updates) and positive sentiment of the news.
        
        Output Format: Return ONLY a valid JSON object. The JSON should have a single key "topCompanies" which is an array of objects. Each object must contain "companyName", "ticker", and a "rankingJustification" that briefly explains why it was ranked highly based on its positive news mentions. Include the source article indices in the justification.

        News Articles JSON Data:
        ${JSON.stringify(newsArticles, null, 2)}
    `;

    const resultText = await callGeminiApi(prompt);
    try {
        const cleanedJson = resultText.replace(/```json\n|```/g, '').trim();
        return JSON.parse(cleanedJson);
    } catch (error) {
        console.error("Error parsing synthesis result:", error);
        return { error: "Failed to parse analysis from AI", detail: error.message };
    }
}

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

    finalReport = finalReport.replace(/\[Source: (?:Article )?(\d+)\]/g, (match, indexStr) => {
        const index = parseInt(indexStr, 10);
        const article = originalArticles.find(a => a.articleIndex === index);
        if (article) {
            const sourceParts = article.source.split('.');
            const sourceName = sourceParts.length > 1 ? sourceParts[sourceParts.length - 2] : article.source;
            return `[(Source: ${sourceName}, ${article.publicationDate})](${article.link})`;
        }
        return match;
    });

    return { report: finalReport };
}

async function handleMarketTrendsAnalysis(contextName, contextType) {
    openModal(CONSTANTS.MODAL_LOADING);
    const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);
    loadingMessage.textContent = `Initiating AI analysis for the ${contextName} ${contextType}...`;
    
    const contentArea = document.getElementById('custom-analysis-content');
    contentArea.innerHTML = `<div class="p-4 text-center text-gray-500">Initiating AI analysis for the ${contextName} ${contextType}...</div>`;

    const tools = {
        functionDeclarations: [
            {
                name: "searchSectorNews",
                description: "Fetches a list of recent general stock market news articles and identifies which stocks in the user's portfolio belong to the specified sector.",
                parameters: {
                    type: "object",
                    properties: {
                        sectorName: { type: "string", description: "The financial sector to analyze, e.g., 'Technology'." },
                        sectorStocks: { type: "array", items: { type: "string" }, description: "A list of ticker symbols belonging to the specified sector." }
                    },
                    required: ["sectorName", "sectorStocks"],
                },
            },
            {
                name: "synthesizeAndRankCompanies",
                description: "Filters a general news list to find articles relevant to a specific list of sector stocks, then analyzes them to rank the top 3-5 most favorably mentioned companies.",
                parameters: {
                    type: "object",
                    properties: {
                        newsArticles: { type: "array", description: "An array of general news article objects.", items: { type: "object" } },
                        sectorStocks: { type: "array", items: { type: "string" }, description: "A list of ticker symbols for the target sector." }
                    },
                    required: ["newsArticles", "sectorStocks"],
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

    const toolFunctions = {
        'searchSectorNews': searchSectorNews,
        'synthesizeAndRankCompanies': synthesizeAndRankCompanies,
        'generateDeepDiveReport': generateDeepDiveReport,
    };

    try {
        loadingMessage.textContent = `Identifying stocks in the ${contextName} ${contextType}...`;
        const portfolioSnapshot = await getDocs(collection(db, CONSTANTS.DB_COLLECTION_PORTFOLIO));
        const portfolio = portfolioSnapshot.docs.map(doc => doc.data());
        
        const fmpDataPromises = portfolio.map(stock => getFmpStockData(stock.ticker).then(data => ({...stock, fmpData: data })));
        const stocksWithFmpData = await Promise.all(fmpDataPromises);

        const contextStocks = stocksWithFmpData
            .filter(stock => get(stock, `fmpData.company_profile.0.${contextType}`) === contextName)
            .map(stock => stock.ticker);

        if (contextStocks.length === 0) {
            throw new Error(`You have no stocks from the ${contextName} ${contextType} in your portfolio or watchlist to analyze.`);
        }

        const conversationHistory = [{
            role: "user",
            parts: [{ text: `Generate a deep-dive analysis report for the ${contextName} ${contextType}. The stocks in this ${contextType} are ${contextStocks.join(', ')}. Start by searching for relevant news.` }],
        }];
        
        let originalArticles = [];

        for (let i = 0; i < 5; i++) { 
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
                loadingMessage.textContent = 'Finalizing report...';
                const finalReportText = responseParts.map(part => part.text || '').join('\n');
                document.getElementById('custom-analysis-content').innerHTML = marked.parse(finalReportText);
                break;
            }

            loadingMessage.textContent = `AI is running tools: ${toolCalls.map(tc => tc.name).join(', ')}...`;
            const toolExecutionPromises = toolCalls.map(toolCall => {
                const func = toolFunctions[toolCall.name];
                if (!func) throw new Error(`Unknown tool: ${toolCall.name}`);
                
                if (toolCall.name === 'generateDeepDiveReport') {
                    toolCall.args.originalArticles = originalArticles;
                } else if (toolCall.name === 'searchSectorNews') {
                    toolCall.args.sectorStocks = contextStocks;
                } else if (toolCall.name === 'synthesizeAndRankCompanies') {
                    toolCall.args.sectorStocks = contextStocks;
                }
                
                return func(toolCall.args);
            });
            
            const toolResults = await Promise.all(toolExecutionPromises);

            const newsSearchResult = toolResults.find((res, idx) => toolCalls[idx].name === 'searchSectorNews');
            if(newsSearchResult && newsSearchResult.articles) {
                originalArticles = newsSearchResult.articles;
            }

            conversationHistory.push({
                role: 'user',
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

function handleSectorSelection(sectorName) {
    const modalTitle = document.getElementById('custom-analysis-modal-title');
    const selectorContainer = document.getElementById('custom-analysis-selector-container');
    const contentArea = document.getElementById('custom-analysis-content');

    modalTitle.textContent = `Sector Deep Dive | ${sectorName}`;
    contentArea.innerHTML = `<div class="text-center text-gray-500 pt-16">Please select an analysis type above to begin.</div>`;
    
    const analysisTypes = [
        {
            category: 'Data-Driven Analysis',
            name: 'Market Trends',
            promptName: 'MarketTrends',
            description: 'Uses an AI agent to search recent news, identify top-performing companies in the sector, and generate a data-driven market summary.',
            svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>`
        },
        {
            category: 'Analysis',
            name: creativePromptMap[sectorName]?.label || 'Playbook',
            promptName: sectorName.replace(/\s/g, ''),
            description: "Generates an in-depth analysis of a single, well-known company in the sector, focusing on its management's skill in capital allocation, styled like a professional investor letter.",
            svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>`
        },
        {
            category: 'Analysis',
            name: 'Disruptor',
            promptName: 'DisruptorAnalysis',
            description: "Identifies a high-growth, innovative company in the sector and analyzes its potential to disrupt established industry leaders, styled like a venture capital report.",
            svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>`
        },
        {
            category: 'Analysis',
            name: 'Macro Trend',
            promptName: 'MacroPlaybook',
            description: "Identifies a powerful, multi-year macro trend (e.g., electrification) and analyzes a best-in-class company in the sector that is positioned to benefit from it.",
            svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12.75 3.03v.568c0 .334.148.65.405.864l1.068.89c.442.369.535 1.01.216 1.49l-.51.766a2.25 2.25 0 01-1.161.886l-.143.048a1.107 1.107 0 00-.57 1.664c.369.555.169 1.307-.427 1.605L9 13.125l.423 1.059a.956.956 0 01-1.652.928l-.679-.906a1.125 1.125 0 00-1.906.172L4.5 15.75l-.612.153M12.75 3.031a9 9 0 00-8.862 12.872M12.75 3.031a9 9 0 016.69 14.036m0 0l-.177.177a2.25 2.25 0 00-.177 3.183l1.575 1.575L15.75 21l2.25-2.25l.53-1.06a.956.956 0 011.652-.928l.679.906a1.125 1.125 0 001.906-.172L21 15.75l.612-.153" /></svg>`
        }
    ];

    const groupedByType = analysisTypes.reduce((acc, type) => {
        if (!creativePromptMap[sectorName] && type.promptName === sectorName.replace(/\s/g, '')) {
            return acc; // Skip the playbook button if no creative prompt exists
        }
        if (!acc[type.category]) {
            acc[type.category] = [];
        }
        acc[type.category].push(type);
        return acc;
    }, {});

    let html = '<div class="flex flex-col md:flex-row gap-8 justify-center items-start w-full">';
    for (const category in groupedByType) {
        html += `<div class="text-center">
            <span class="block text-xs font-bold text-gray-500 uppercase mb-2">${category}</span>
            <div class="flex flex-wrap justify-center gap-4">`;
        
        groupedByType[category].forEach(type => {
            html += `
                <button 
                    class="flex flex-col items-center justify-center p-4 text-center bg-white rounded-lg shadow-md border hover:shadow-xl hover:border-indigo-500 transition-all duration-200 hover:-translate-y-1 w-40 h-40"
                    data-sector="${sectorName}" 
                    data-prompt-name="${type.promptName}"
                    title="${type.description}">
                    <div class="w-12 h-12 mb-2 text-indigo-600">
                        ${type.svgIcon}
                    </div>
                    <span class="font-semibold text-gray-800">${type.name}</span>
                </button>
            `;
        });
        
        html += `</div></div>`;
    }
    html += '</div>';

    selectorContainer.innerHTML = html;
    openModal(CONSTANTS.MODAL_CUSTOM_ANALYSIS);
}

async function handleCreativeSectorAnalysis(contextName, promptNameKey) {
    const promptData = creativePromptMap[contextName];
    if (!promptData) {
        displayMessageInModal(`No creative analysis prompt found for: ${contextName}`, 'error');
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
        console.error(`Error generating creative analysis for ${contextName}:`, error);
        displayMessageInModal(`Could not generate AI article: ${error.message}`, 'error');
        contentArea.innerHTML = `<div class="p-4 text-center text-red-500">Error: ${error.message}</div>`;
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

async function handleDisruptorAnalysis(contextName) {
    openModal(CONSTANTS.MODAL_LOADING);
    const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);
    loadingMessage.textContent = `Generating AI article: "Disruptor Analysis"...`;

    const contentArea = document.getElementById('custom-analysis-content');
    contentArea.innerHTML = `<div class="p-4 text-center text-gray-500">Generating AI article: "Disruptor Analysis"...</div>`;

    try {
        const prompt = DISRUPTOR_ANALYSIS_PROMPT.replace(/\[SECTOR NAME\]/g, contextName);
        const report = await callGeminiApi(prompt);
        contentArea.innerHTML = marked.parse(report);
    } catch (error) {
        console.error(`Error generating disruptor analysis for ${contextName}:`, error);
        displayMessageInModal(`Could not generate AI article: ${error.message}`, 'error');
        contentArea.innerHTML = `<div class="p-4 text-center text-red-500">Error: ${error.message}</div>`;
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

async function handleMacroPlaybookAnalysis(contextName) {
    openModal(CONSTANTS.MODAL_LOADING);
    const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);
    loadingMessage.textContent = `Generating AI article: "Macro Playbook"...`;

    const contentArea = document.getElementById('custom-analysis-content');
    contentArea.innerHTML = `<div class="p-4 text-center text-gray-500">Generating AI article: "Macro Playbook"...</div>`;

    try {
        const standardDisclaimer = "This article is for informational purposes only and should not be considered financial advice. Readers should consult with a qualified financial professional before making any investment decisions.";
        const prompt = MACRO_PLAYBOOK_PROMPT
            .replace(/\[SECTOR NAME\]/g, contextName)
            .replace(/\[Include standard disclaimer\]/g, standardDisclaimer);
        const report = await callGeminiApi(prompt);
        contentArea.innerHTML = marked.parse(report);
    } catch (error) {
        console.error(`Error generating macro playbook analysis for ${contextName}:`, error);
        displayMessageInModal(`Could not generate AI article: ${error.message}`, 'error');
        contentArea.innerHTML = `<div class="p-4 text-center text-red-500">Error: ${error.message}</div>`;
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

async function displayIndustryScreener() {
    try {
        const url = `https://financialmodelingprep.com/stable/available-industries?apikey=${fmpApiKey}`;
        const industryData = await callApi(url);
        if (Array.isArray(industryData)) {
            availableIndustries = industryData.map(item => item.industry).sort();
            renderIndustryButtons();
        }
    } catch (error) {
        console.error("Error fetching available industries:", error);
        const container = document.getElementById('industry-buttons-container');
        if (container) {
            container.innerHTML = `<p class="text-red-500 col-span-full">Could not load industry data.</p>`;
        }
    }
}

function renderIndustryButtons() {
    const container = document.getElementById('industry-buttons-container');
    if (!container) return;

    const genericIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>`; // Using Industrials icon as generic

    container.innerHTML = availableIndustries.map(industry => `
        <button class="flex flex-col items-center justify-center p-4 text-center bg-teal-100 text-teal-800 hover:bg-teal-200 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-1" data-industry="${sanitizeText(industry)}">
            ${genericIcon}
            <span class="mt-2 font-semibold text-sm">${sanitizeText(industry)}</span>
        </button>
    `).join('');
}


function handleIndustrySelection(industryName) {
    const modalTitle = document.getElementById('industry-analysis-modal-title');
    const selectorContainer = document.getElementById('industry-analysis-selector-container');
    const contentArea = document.getElementById('industry-analysis-content');

    modalTitle.textContent = `Industry Deep Dive | ${industryName}`;
    contentArea.innerHTML = `<div class="text-center text-gray-500 pt-16">Please select an analysis type above to begin.</div>`;
    
    const analysisTypes = [
        {
            category: 'Data-Driven Analysis',
            name: 'Market Trends',
            promptName: 'MarketTrends',
            description: 'Uses an AI agent to search recent news, identify top-performing companies in the industry, and generate a data-driven market summary.',
            svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>`
        },
        {
            category: 'Analysis',
            name: 'Playbook',
            promptName: 'PlaybookAnalysis',
            description: "Generates an in-depth analysis of a single, well-known company in the industry, focusing on its management's skill in capital allocation, styled like a professional investor letter.",
            svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>`
        },
        {
            category: 'Analysis',
            name: 'Disruptor',
            promptName: 'DisruptorAnalysis',
            description: "Identifies a high-growth, innovative company in the industry and analyzes its potential to disrupt established industry leaders, styled like a venture capital report.",
            svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>`
        },
        {
            category: 'Analysis',
            name: 'Macro Trend',
            promptName: 'MacroPlaybook',
            description: "Identifies a powerful, multi-year macro trend (e.g., electrification) and analyzes a best-in-class company in the industry that is positioned to benefit from it.",
            svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12.75 3.03v.568c0 .334.148.65.405.864l1.068.89c.442.369.535 1.01.216 1.49l-.51.766a2.25 2.25 0 01-1.161.886l-.143.048a1.107 1.107 0 00-.57 1.664c.369.555.169 1.307-.427 1.605L9 13.125l.423 1.059a.956.956 0 01-1.652.928l-.679-.906a1.125 1.125 0 00-1.906.172L4.5 15.75l-.612.153M12.75 3.031a9 9 0 00-8.862 12.872M12.75 3.031a9 9 0 016.69 14.036m0 0l-.177.177a2.25 2.25 0 00-.177 3.183l1.575 1.575L15.75 21l2.25-2.25l.53-1.06a.956.956 0 011.652-.928l.679.906a1.125 1.125 0 001.906-.172L21 15.75l.612-.153" /></svg>`
        }
    ];

    const groupedByType = analysisTypes.reduce((acc, type) => {
        if (!acc[type.category]) {
            acc[type.category] = [];
        }
        acc[type.category].push(type);
        return acc;
    }, {});

    let html = '<div class="flex flex-col md:flex-row gap-8 justify-center items-start w-full">';
    for (const category in groupedByType) {
        html += `<div class="text-center">
            <span class="block text-xs font-bold text-gray-500 uppercase mb-2">${category}</span>
            <div class="flex flex-wrap justify-center gap-4">`;
        
        groupedByType[category].forEach(type => {
            html += `
                <button 
                    class="flex flex-col items-center justify-center p-4 text-center bg-white rounded-lg shadow-md border hover:shadow-xl hover:border-indigo-500 transition-all duration-200 hover:-translate-y-1 w-40 h-40"
                    data-industry="${industryName}" 
                    data-prompt-name="${type.promptName}"
                    title="${type.description}">
                    <div class="w-12 h-12 mb-2 text-indigo-600">
                        ${type.svgIcon}
                    </div>
                    <span class="font-semibold text-gray-800">${type.name}</span>
                </button>
            `;
        });
        
        html += `</div></div>`;
    }
    html += '</div>';

    selectorContainer.innerHTML = html;
    openModal(CONSTANTS.MODAL_INDUSTRY_ANALYSIS);
}

// --- NEW INDUSTRY DEEP DIVE WORKFLOW ---
async function findStocksByIndustry({ industryName }) {
    if (!fmpApiKey) {
        throw new Error("FMP API Key is required for this feature.");
    }
    const url = `https://financialmodelingprep.com/api/v3/stock-screener?industry=${encodeURIComponent(industryName)}&limit=50&apikey=${fmpApiKey}`;
    
    try {
        const stocks = await callApi(url);
        if (!stocks || stocks.length === 0) {
            return { error: "No stocks found", detail: `Could not find any stocks for the ${industryName} industry.` };
        }
        return { stocks: stocks.map(s => s.symbol) };
    } catch (error) {
        console.error("Error fetching stocks by industry:", error);
        return { error: "API call failed", detail: error.message };
    }
}

async function handleIndustryMarketTrendsAnalysis(industryName) {
    openModal(CONSTANTS.MODAL_LOADING);
    const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);
    const contentArea = document.getElementById('industry-analysis-content');

    try {
        loadingMessage.textContent = `Finding companies in the ${industryName} industry...`;
        contentArea.innerHTML = `<div class="p-4 text-center text-gray-500">${loadingMessage.textContent}</div>`;

        const stocksResult = await findStocksByIndustry({ industryName });
        if (stocksResult.error || !stocksResult.stocks || stocksResult.stocks.length === 0) {
            throw new Error(`Could not find any companies for the ${industryName} industry.`);
        }
        const industryStocks = stocksResult.stocks;

        loadingMessage.textContent = `Searching news for up to ${industryStocks.length} companies...`;
        contentArea.innerHTML = `<div class="p-4 text-center text-gray-500">${loadingMessage.textContent}</div>`;
        const newsResult = await searchSectorNews({ sectorName: industryName, sectorStocks: industryStocks });
        if (newsResult.error || !newsResult.articles || newsResult.articles.length === 0) {
            throw new Error(`Could not find any recent news for the ${industryName} industry.`);
        }
        const validArticles = newsResult.articles;

        loadingMessage.textContent = `AI is analyzing news and generating the report...`;
        contentArea.innerHTML = `<div class="p-4 text-center text-gray-500">${loadingMessage.textContent}</div>`;

        const prompt = ONE_SHOT_INDUSTRY_TREND_PROMPT
            .replace(/{industryName}/g, industryName)
            .replace('${industryStocks}', industryStocks.join(', '))
            .replace('{newsArticlesJson}', JSON.stringify(validArticles, null, 2));

        let finalReport = await callGeminiApi(prompt);

        finalReport = finalReport.replace(/\[Source: (?:Article )?(\d+)\]/g, (match, indexStr) => {
            const index = parseInt(indexStr, 10);
            const article = validArticles.find(a => a.articleIndex === index);
            if (article) {
                const sourceParts = article.source.split('.');
                const sourceName = sourceParts.length > 1 ? sourceParts[sourceParts.length - 2] : article.source;
                return `[(Source: ${sourceName}, ${article.publicationDate})](${article.link})`;
            }
            return match;
        });

        contentArea.innerHTML = marked.parse(finalReport);

    } catch (error) {
        console.error("Error during AI agent industry analysis:", error);
        displayMessageInModal(`Could not complete AI analysis: ${error.message}`, 'error');
        contentArea.innerHTML = `<div class="p-4 text-center text-red-500">Error: ${error.message}</div>`;
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}


async function handleIndustryPlaybookAnalysis(industryName) {
    openModal(CONSTANTS.MODAL_LOADING);
    const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);
    loadingMessage.textContent = `Generating AI article: "Playbook"...`;

    const contentArea = document.getElementById('industry-analysis-content');
    contentArea.innerHTML = `<div class="p-4 text-center text-gray-500">Generating AI article: "Playbook"...</div>`;

    try {
        const prompt = INDUSTRY_CAPITAL_ALLOCATORS_PROMPT
            .replace(/{industryName}/g, industryName)
            .replace(/{companyName}/g, 'a Key Company'); 

        const report = await callGeminiApi(prompt);
        contentArea.innerHTML = marked.parse(report);
    } catch (error) {
        console.error(`Error generating creative analysis for ${industryName}:`, error);
        displayMessageInModal(`Could not generate AI article: ${error.message}`, 'error');
        contentArea.innerHTML = `<div class="p-4 text-center text-red-500">Error: ${error.message}</div>`;
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

async function handleIndustryDisruptorAnalysis(industryName) {
    openModal(CONSTANTS.MODAL_LOADING);
    const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);
    loadingMessage.textContent = `Generating AI article: "Disruptor Analysis"...`;

    const contentArea = document.getElementById('industry-analysis-content');
    contentArea.innerHTML = `<div class="p-4 text-center text-gray-500">Generating AI article: "Disruptor Analysis"...</div>`;

    try {
        const prompt = INDUSTRY_DISRUPTOR_ANALYSIS_PROMPT.replace(/\[INDUSTRY NAME\]/g, industryName);
        const report = await callGeminiApi(prompt);
        contentArea.innerHTML = marked.parse(report);
    } catch (error) {
        console.error(`Error generating disruptor analysis for ${industryName}:`, error);
        displayMessageInModal(`Could not generate AI article: ${error.message}`, 'error');
        contentArea.innerHTML = `<div class="p-4 text-center text-red-500">Error: ${error.message}</div>`;
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

async function handleIndustryMacroPlaybookAnalysis(industryName) {
    openModal(CONSTANTS.MODAL_LOADING);
    const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);
    loadingMessage.textContent = `Generating AI article: "Macro Playbook"...`;

    const contentArea = document.getElementById('industry-analysis-content');
    contentArea.innerHTML = `<div class="p-4 text-center text-gray-500">Generating AI article: "Macro Playbook"...</div>`;

    try {
        const standardDisclaimer = "This article is for informational purposes only and should not be considered financial advice. Readers should consult with a qualified financial professional before making any investment decisions.";
        const prompt = INDUSTRY_MACRO_PLAYBOOK_PROMPT
            .replace(/\[INDUSTRY NAME\]/g, industryName)
            .replace(/\[Include standard disclaimer\]/g, standardDisclaimer);
        const report = await callGeminiApi(prompt);
        contentArea.innerHTML = marked.parse(report);
    } catch (error) {
        console.error(`Error generating macro playbook analysis for ${industryName}:`, error);
        displayMessageInModal(`Could not generate AI article: ${error.message}`, 'error');
        contentArea.innerHTML = `<div class="p-4 text-center text-red-500">Error: ${error.message}</div>`;
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}


// --- AI ANALYSIS REPORT GENERATORS ---

async function getFmpStockData(symbol) {
    const fmpCacheRef = collection(db, CONSTANTS.DB_COLLECTION_FMP_CACHE, symbol, 'endpoints');
    const fmpCacheSnapshot = await getDocs(fmpCacheRef);

    if (fmpCacheSnapshot.empty) {
        console.warn(`No FMP data found for ${symbol}.`);
        return null;
    }

    const allData = { cachedAt: null };
    let latestTimestamp = null;

    fmpCacheSnapshot.forEach(docSnap => {
        const docData = docSnap.data();
        const endpointName = docSnap.id.toLowerCase().replace(/\s+/g, '_');
        allData[endpointName] = docData.data;

        if (docData.cachedAt && typeof docData.cachedAt.toMillis === 'function') {
            if (!latestTimestamp || docData.cachedAt.toMillis() > latestTimestamp.toMillis()) {
                latestTimestamp = docData.cachedAt;
            }
        }
    });

    allData.cachedAt = latestTimestamp;
    return allData;
}

async function handleFinancialAnalysis(symbol) {
    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Generating AI financial analysis for ${symbol}...`;
    try {
        const data = await getFmpStockData(symbol);
        if (!data) throw new Error(`No cached FMP data found for ${symbol}.`);
        const companyName = get(data, 'company_profile.0.companyName', 'the company');
        const tickerSymbol = get(data, 'company_profile.0.symbol', symbol);

        const prompt = FINANCIAL_ANALYSIS_PROMPT
            .replace(/{companyName}/g, companyName)
            .replace(/{tickerSymbol}/g, tickerSymbol)
            .replace('{jsonData}', JSON.stringify(data, null, 2));

        const report = await callGeminiApi(prompt);
        const articleContainer = document.querySelector('#rawDataViewerModal #ai-article-container');
        if (articleContainer) {
            const analysisTitleHtml = '<h3 class="text-xl font-bold text-gray-800 mb-2 mt-4 border-t pt-4">AI Analysis Result</h3>';
            articleContainer.innerHTML = analysisTitleHtml + marked.parse(report);
        }

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
        const data = await getFmpStockData(symbol);
        if (!data) throw new Error(`No cached FMP data found for ${symbol}.`);
        
        const companyName = get(data, 'company_profile.0.companyName', 'the company');
        const tickerSymbol = get(data, 'company_profile.0.symbol', symbol);

        const prompt = UNDERVALUED_ANALYSIS_PROMPT
            .replace(/{companyName}/g, companyName)
            .replace(/{tickerSymbol}/g, tickerSymbol)
            .replace('{jsonData}', JSON.stringify(data, null, 2));
        
        const report = await callGeminiApi(prompt);
        const articleContainer = document.querySelector('#rawDataViewerModal #ai-article-container');
        if (articleContainer) {
            const analysisTitleHtml = '<h3 class="text-xl font-bold text-gray-800 mb-2 mt-4 border-t pt-4">AI Analysis Result</h3>';
            articleContainer.innerHTML = analysisTitleHtml + marked.parse(report);
        }

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
        const data = await getFmpStockData(symbol);
        if (!data) throw new Error(`No cached FMP data found for ${symbol}.`);
        const companyName = get(data, 'company_profile.0.companyName', 'the company');
        const tickerSymbol = get(data, 'company_profile.0.symbol', symbol);
        const prompt = BULL_VS_BEAR_PROMPT
            .replace(/{companyName}/g, companyName)
            .replace(/{tickerSymbol}/g, tickerSymbol)
            .replace('{jsonData}', JSON.stringify(data, null, 2));
        const report = await callGeminiApi(prompt);
        const articleContainer = document.querySelector('#rawDataViewerModal #ai-article-container');
        if (articleContainer) {
            const analysisTitleHtml = '<h3 class="text-xl font-bold text-gray-800 mb-2 mt-4 border-t pt-4">AI Analysis Result</h3>';
            articleContainer.innerHTML = analysisTitleHtml + marked.parse(report);
        }
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
        const data = await getFmpStockData(symbol);
        if (!data) throw new Error(`No cached FMP data found for ${symbol}.`);
        const companyName = get(data, 'company_profile.0.companyName', 'the company');
        const tickerSymbol = get(data, 'company_profile.0.symbol', symbol);
        const prompt = MOAT_ANALYSIS_PROMPT
            .replace(/{companyName}/g, companyName)
            .replace(/{tickerSymbol}/g, tickerSymbol)
            .replace('{jsonData}', JSON.stringify(data, null, 2));
        const report = await callGeminiApi(prompt);
        const articleContainer = document.querySelector('#rawDataViewerModal #ai-article-container');
        if (articleContainer) {
            const analysisTitleHtml = '<h3 class="text-xl font-bold text-gray-800 mb-2 mt-4 border-t pt-4">AI Analysis Result</h3>';
            articleContainer.innerHTML = analysisTitleHtml + marked.parse(report);
        }
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
        const data = await getFmpStockData(symbol);
        if (!data) throw new Error(`No cached FMP data found for ${symbol}.`);
        const companyName = get(data, 'company_profile.0.companyName', 'the company');
        const tickerSymbol = get(data, 'company_profile.0.symbol', symbol);
        const prompt = DIVIDEND_SAFETY_PROMPT
            .replace(/{companyName}/g, companyName)
            .replace(/{tickerSymbol}/g, tickerSymbol)
            .replace('{jsonData}', JSON.stringify(data, null, 2));
        const report = await callGeminiApi(prompt);
        const articleContainer = document.querySelector('#rawDataViewerModal #ai-article-container');
        if (articleContainer) {
            const analysisTitleHtml = '<h3 class="text-xl font-bold text-gray-800 mb-2 mt-4 border-t pt-4">AI Analysis Result</h3>';
            articleContainer.innerHTML = analysisTitleHtml + marked.parse(report);
        }
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
        const data = await getFmpStockData(symbol);
        if (!data) throw new Error(`No cached FMP data found for ${symbol}.`);
        const companyName = get(data, 'company_profile.0.companyName', 'the company');
        const tickerSymbol = get(data, 'company_profile.0.symbol', symbol);
        const prompt = GROWTH_OUTLOOK_PROMPT
            .replace(/{companyName}/g, companyName)
            .replace(/{tickerSymbol}/g, tickerSymbol)
            .replace('{jsonData}', JSON.stringify(data, null, 2));
        const report = await callGeminiApi(prompt);
        const articleContainer = document.querySelector('#rawDataViewerModal #ai-article-container');
        if (articleContainer) {
            const analysisTitleHtml = '<h3 class="text-xl font-bold text-gray-800 mb-2 mt-4 border-t pt-4">AI Analysis Result</h3>';
            articleContainer.innerHTML = analysisTitleHtml + marked.parse(report);
        }
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
        const data = await getFmpStockData(symbol);
        if (!data) throw new Error(`No cached FMP data found for ${symbol}.`);
        const companyName = get(data, 'company_profile.0.companyName', 'the company');
        const tickerSymbol = get(data, 'company_profile.0.symbol', symbol);
        const prompt = RISK_ASSESSMENT_PROMPT
            .replace(/{companyName}/g, companyName)
            .replace(/{tickerSymbol}/g, tickerSymbol)
            .replace('{jsonData}', JSON.stringify(data, null, 2));
        const report = await callGeminiApi(prompt);
        const articleContainer = document.querySelector('#rawDataViewerModal #ai-article-container');
        if (articleContainer) {
            const analysisTitleHtml = '<h3 class="text-xl font-bold text-gray-800 mb-2 mt-4 border-t pt-4">AI Analysis Result</h3>';
            articleContainer.innerHTML = analysisTitleHtml + marked.parse(report);
        }
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
        const data = await getFmpStockData(symbol);
        if (!data) throw new Error(`No cached FMP data found for ${symbol}.`);
        const companyName = get(data, 'company_profile.0.companyName', 'the company');
        const tickerSymbol = get(data, 'company_profile.0.symbol', symbol);
        const prompt = CAPITAL_ALLOCATORS_PROMPT
            .replace(/{companyName}/g, companyName)
            .replace(/{tickerSymbol}/g, tickerSymbol);
        const report = await callGeminiApi(prompt);
        const articleContainer = document.querySelector('#rawDataViewerModal #ai-article-container');
        if (articleContainer) {
            const analysisTitleHtml = '<h3 class="text-xl font-bold text-gray-800 mb-2 mt-4 border-t pt-4">AI Analysis Result</h3>';
            articleContainer.innerHTML = analysisTitleHtml + marked.parse(report);
        }
    } catch (error) {
        displayMessageInModal(`Could not generate analysis: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}


// --- GOOGLE DRIVE FUNCTIONS ---

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
    let fileName = '';

    const contentContainer = modal.querySelector('#custom-analysis-content, #industry-analysis-content, #view-fmp-data-content, #ai-article-container');

    if (!contentContainer || !contentContainer.innerHTML.trim()) {
        displayMessageInModal('There is no content to save.', 'warning');
        return;
    }
    contentToSave = contentContainer.innerHTML;
    
    const modalTitleText = modal.querySelector('h2').textContent;
    const reportH1 = contentContainer.querySelector('h1');
    const reportTitleText = reportH1 ? reportH1.textContent : '';

    let symbolOrContext = '';
    let reportTypeName = '';

    if (modalId === 'rawDataViewerModal' && reportTitleText) {
        symbolOrContext = modalTitleText.replace('Analysis for', '').trim();
        reportTypeName = reportTitleText.split(':')[0].trim();
    } else {
        const titleParts = modalTitleText.split('|').map(s => s.trim());
        reportTypeName = titleParts[0];
        symbolOrContext = titleParts.length > 1 ? titleParts[1] : '';
    }

    const cleanSymbol = symbolOrContext.replace(/\s+/g, '_');
    const cleanReportType = reportTypeName.replace(/\s+/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];

    if (cleanSymbol && cleanReportType) {
        fileName = `${cleanSymbol}_${cleanReportType}_${dateStr}.md`;
    } else {
        fileName = `${(cleanReportType || cleanSymbol).replace(/ /g, '_') || 'AI_Analysis'}_${dateStr}.md`;
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
