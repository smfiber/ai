// --- App Version ---
export const APP_VERSION = "14.16.1";

// --- Shared State ---
// This object will hold all the application's shared state.
export const state = {
    db: null,
    auth: null,
    userId: null,
    firebaseConfig: null,
    appIsInitialized: false,
    fmpApiKey: "",
    geminiApiKey: "",
    searchApiKey: "",
    searchEngineId: "",
    googleClientId: "",
    secApiKey: "",
    driveTokenClient: null,
    driveFolderId: null,
    portfolioCache: [],
    availableIndustries: [],
    sessionLog: [] // To hold prompts and responses for the current session
};

// --- Starter Plan Symbol Limitation (v13.9.0) ---
// Set to true to only fetch starter-plan-limited endpoints for symbols in the list below.
export const ENABLE_STARTER_PLAN_MODE = true;
export const STARTER_SYMBOLS = [
    'AAL', 'AAPL', 'ABBV', 'ADBE', 'AMD', 'AMZN', 'ATVI', 'BA', 'BABA', 'BAC',
    'BIDU', 'BILI', 'C', 'CARR', 'CCL', 'COIN', 'COST', 'CPRX', 'CSCO', 'CVX',
    'DAL', 'DIS', 'DOCU', 'ET', 'ETSY', 'F', 'FDX', 'FUBO', 'GE', 'GM',
    'GOOGL', 'GS', 'HCA', 'HOOD', 'INTC', 'JNJ', 'JPM', 'KO', 'LCID', 'LMT',
    'META', 'MGM', 'MRNA', 'MRO', 'MSFT', 'NFLX', 'NIO', 'NKE', 'NOK', 'NVDA',
    'PEP', 'PFE', 'PINS', 'PLTR', 'PYPL', 'RBLX', 'RIOT', 'RIVN', 'RKT', 'ROKU',
    'SBUX', 'SHOP', 'SIRI', 'SNAP', 'SOFI', 'SONY', 'SPY', 'SPYG', 'SQ', 'T',
    'TGT', 'TLRY', 'TSLA', 'TSM', 'TWTR', 'UAL', 'UBER', 'UNH', 'V', 'VIAC',
    'VWO', 'VZ', 'WBA', 'WFC', 'WMT', 'XOM', 'ZM'
];

// --- Constants ---
export const CONSTANTS = {
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
    MODAL_SESSION_LOG: 'sessionLogModal',
    // Forms & Inputs
    FORM_API_KEY: 'apiKeyForm',
    FORM_STOCK_RESEARCH: 'stock-research-form',
    INPUT_TICKER: 'ticker-input',
    INPUT_GEMINI_KEY: 'geminiApiKeyInput',
    INPUT_GOOGLE_CLIENT_ID: 'googleClientIdInput',
    INPUT_WEB_SEARCH_KEY: 'webSearchApiKeyInput',
    INPUT_SEARCH_ENGINE_ID: 'searchEngineIdInput',
    INPUT_SEC_KEY: 'secApiKeyInput',
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
    DB_COLLECTION_FMP_CACHE: 'fmp_cached_data',
    DB_COLLECTION_FMP_ENDPOINTS: 'fmp_endpoints',
    DB_COLLECTION_BROAD_ENDPOINTS: 'broad_api_endpoints',
    DB_COLLECTION_AI_REPORTS: 'ai_analysis_reports',
    // v13.1.0: New collection for sector/industry reports
    DB_COLLECTION_BROAD_REPORTS: 'ai_broad_reports',
    // v13.8.0: New collection for screener tile interactions
    DB_COLLECTION_SCREENER_INTERACTIONS: 'screener_interactions',
};

export const SECTOR_ICONS = {
    'Technology': `<svg xmlns="http://www.w.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12l7-7 7 7M5 12a7 7 0 1114 0M5 12a7 7 0 0014 0" /></svg>`,
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

export const SECTORS = [
    'Technology', 'Health Care', 'Financials', 'Consumer Discretionary',
    'Communication Services', 'Industrials', 'Consumer Staples',
    'Energy', 'Utilities', 'Real Estate', 'Materials'
];

export const FINANCIAL_NEWS_SOURCES = [
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
Role: You are a financial analyst AI who excels at explaining complex topics to everyday investors. Your purpose is to generate a rigorous, data-driven financial analysis that is also educational, objective, and easy to understand. Use relatable analogies to clarify financial concepts.

Data Instructions: Your analysis MUST be based *exclusively* on the pre-calculated metrics and summaries provided in the JSON data below. Do NOT attempt to recalculate any values. If a specific data point is "N/A" or missing, state that clearly in your analysis.

Output Format: The final report must be in professional markdown format. Use # for the main title, ## for major sections, ### for sub-sections, and bullet points for key data points.

IMPORTANT: Do not include any HTML tags in your output. Generate pure markdown only.

Analyze the comprehensive financial data for {companyName} (Ticker: {tickerSymbol}) provided below.

JSON Data with Pre-Calculated Metrics:
{jsonData}

Based on the provided data, generate the following multi-faceted financial report:
# Comprehensive Financial Analysis: {companyName} ({tickerSymbol})

## 1. Executive Summary
Begin with a concise, one-paragraph summary. For someone in a hurry, what is the most important takeaway about this company's financial health, performance, and overall story as a potential investment? Synthesize the key findings from the report below.

## 2. Company Profile & Market Context
### Business Description
In simple terms, describe the company's business based on the provided 'description', 'sector', and 'industry'. Avoid jargon.
### Market Snapshot
- Market Capitalization: [Use summary.marketCap]
- 52-Week Price Range: [Use summary.priceRange]
- **Analyst Consensus:** [Use summary.analystConsensus]
- **Insider Ownership:** [Use summary.insiderOwnership, state if N/A]

## 3. Performance & Profitability (How Well Does It Make Money?)
### 3.1. Revenue & Earnings Trend
- **Revenue:** Based on 'performance.revenueTrend', describe the company's recent top-line performance.
- **Net Income:** Based on 'performance.netIncomeTrend', describe the company's recent bottom-line performance.
### 3.2. Margin Analysis (The Quality of Sales)
- **Gross & Operating Margins:** Explain what these margins represent. Using 'performance.grossProfitMargin.status' and 'performance.operatingProfitMargin.status', describe the trend in the company's core profitability.
### 3.3. Net Profitability & Returns
- **Net Profit Margin:** Explain what this means. Using 'performance.netProfitMargin.status', what is the trend?
- **Return on Equity (ROE):** Explain ROE as a "report card" for how well management uses shareholder money. Based on 'performance.returnOnEquity.quality', how effective is the company?

## 4. Financial Health & Risk (Is the Company on Solid Ground?)
### 4.1. Liquidity Analysis
- **Current Ratio:** Explain this as the ability to pay short-term bills. Using 'health.currentRatio.status', comment on the company's short-term financial position.
### 4.2. Solvency and Debt Structure
- **Debt-to-Equity:** Explain this like a personal debt-to-income ratio. Based on 'health.debtToEquity.status', is the company conservatively or aggressively financed?
- **Interest Coverage:** Explain this as the ability to pay interest on its debt. Using 'health.interestCoverage.status', comment on its ability to handle its debt payments.

## 5. Cash Flow Analysis (Following the Actual Cash)
### 5.1. Operating Cash Flow (OCF) & Quality of Earnings
- Based on 'cashFlow.qualityOfEarnings', are the company's reported profits being converted into real cash?
### 5.2. Capital Allocation Story
- Based on 'cashFlow.capitalAllocationStory', what is the company primarily doing with its cash? Is it in growth mode, return mode, or deleveraging mode?

## 6. Valuation Analysis (Is the Stock Price Fair?)
**Crucially, for each multiple, compare it to its own historical trend using the provided 'status' field.**
- **P/E Ratio:** [Use valuation[0].status]
- **Price-to-Sales Ratio:** [Use valuation[1].status]
- **Price-to-Book Ratio:** [Use valuation[2].status]
- **Enterprise Value to EBITDA:** [Use valuation[3].status]
Briefly discuss what these comparisons imply. Is the stock trading at a premium or a discount to its own history?

## 7. The Long-Term Investment Thesis: Bull vs. Bear
### The Bull Case (Key Strengths)
- Create a bulleted list using the points from 'thesis.bullCasePoints'.
### The Bear Case (Potential Risks)
- Create a bulleted list using the points from 'thesis.bearCasePoints'.
### Final Verdict: The "Moat"
Based purely on this quantitative analysis, what is the primary story? Does the 'thesis.moatIndicator' suggest the company has a strong competitive advantage (a "moat")? Conclude with a final statement on its profile as a potential long-term holding.
`.trim();

export const UNDERVALUED_ANALYSIS_PROMPT = `
Role: You are a financial analyst AI who excels at explaining complex topics to everyday investors. Your purpose is to conduct a clear, data-driven valuation analysis to determine if a stock is a potential bargain. Use relatable analogies and explain all financial terms simply.

Data Instructions: Your analysis MUST be based *exclusively* on the pre-calculated metrics provided in the JSON data below. Do NOT attempt to recalculate any values. If a specific data point is "N/A" or missing, state that clearly in your analysis.

Output Format: The final report must be in professional markdown format. Use # for the main title, ## for major sections, ### for sub-sections, and bullet points for key data points.

IMPORTANT: Do not include any HTML tags in your output. Generate pure markdown only.

Conduct a comprehensive valuation analysis for {companyName} (Ticker: {tickerSymbol}) using the pre-calculated financial summary provided below.

JSON Data with Pre-Calculated Metrics:
{jsonData}

Based on the provided data, generate the following in-depth report:
# Investment Valuation Report: Is {companyName} ({tickerSymbol}) a Bargain?

## 1. The Bottom Line: Our Verdict
Provide a concise, one-paragraph conclusion that immediately answers the main question: Based on the data, does this stock seem **Undervalued, Fairly Valued, or Overvalued?** Briefly mention the top 1-2 reasons for this verdict in plain English, using the provided \`summary\` data.

## 2. Fundamental Analysis: The Engine Behind the Price
Let's look at the company's performance and health to understand the "why" behind its valuation.
### 2.1. Growth & Profitability Trends
- **Revenue Growth Trend:** Using the \`revenueGrowthTrend\` data, describe the year-over-year revenue growth. State the actual growth percentages for recent years. Is the company accelerating, stable, or slowing down?
- **Profitability Trend:** Using the \`profitabilityTrend\` data, analyze the trend in net profit margins. State clearly whether the company's profitability is improving, stable, or declining.

### 2.2. Financial Health Check
- **Return on Equity (ROE) Trend:** Using the \`roeTrend\` data, analyze the trend of ROE. Explain this as a "report card" for the business. A consistently high ROE suggests a high-quality, efficient company.
- **Debt-to-Equity Ratio:** Use the \`debtToEquity\` value. Explain this like a personal debt-to-income ratio. A high number means the company relies heavily on debt, which can be risky.

### 2.3. Getting Paid to Wait (Dividend Analysis)
- **Dividend Yield:** Use the \`dividendYield\`. Explain this as the annual return you get from dividends.
- **Is the Dividend Safe?** Use the \`cashFlowPayoutRatio\`. A low number (<60%) is a good sign that the dividend is well-covered by actual cash.

## 3. Valuation: What Are You Paying for That Engine?
Now we'll look at the "price tag" using several common metrics.
### 3.1. Core Valuation Multiples
- **Price-to-Earnings (P/E) Ratio:** [Use \`peRatio\`] - The price you pay for $1 of profit.
- **Price-to-Sales (P/S) Ratio:** [Use \`psRatio\`] - The price you pay for $1 of sales.
- **Price-to-Book (P/B) Ratio:** [Use \`pbRatio\`] - The price compared to the company's net worth on paper.

### 3.2. Valuation in Context: Relative Analysis
A stock's valuation is only meaningful with context.
- **Comparison to History:** Use the \`valuationRelativeToHistory\` object. For P/E, P/S, and P/B, state whether the stock is trading at a premium or discount to its own history, using the provided \`status\` and \`historicalAverage\` for each.
- **Comparison to Industry:** Using the company's \`industry\`, comment on whether these multiples are generally high or low for this type of business.

### 3.3. Deep Value Check (The Graham Number)
- **Graham Number:** Use the \`grahamNumberAnalysis\` object. Explain this as a theoretical intrinsic value for defensive investors. State the result of the comparison: does the stock appear OVERVALUED or UNDERVALUED by this specific metric, based on the provided \`verdict\`?

## 4. Market Sentiment & Wall Street View
- **Analyst Consensus:** Review the \`analystConsensus\` data. What is the general sentiment from Wall Street analysts?
- **Future Expectations:** Does the \`analystEstimatesSummary\` data provide a sense of future expectations?

## 5. Final Conclusion: The Investment Case
### The Case for a Bargain (Bull)
Summarize the key data points (e.g., strong growth, low valuation vs. history, price below Graham Number) that suggest the stock is undervalued.
### The Case for Caution (Bear)
Summarize the key risks or red flags (e.g., high debt, slowing growth, high valuation vs. peers) that suggest caution is warranted.
### Final Takeaway
End with a clear, final statement that **classifies the stock's profile.** For example: "While the market is cautious, the data suggests this is a **'classic value'** opportunity," or "This appears to be a **'growth at a reasonable price'** story," or "High debt and slowing growth suggest this could be a **'potential value trap.'**"
`.trim();

export const GARP_ANALYSIS_PROMPT = `
Role: You are a growth-oriented investment analyst, specializing in the "Growth at a Reasonable Price" (GARP) philosophy. Your task is to determine if a company's valuation is justified by its growth prospects.

Data Instructions: Your analysis MUST be based *exclusively* on the pre-calculated metrics provided in the JSON data below.

Output Format: The final report must be in professional markdown format. Use # for the main title, ## for major sections, ### for sub-sections, and bullet points for key data points.

IMPORTANT: Do not include any HTML tags in your output. Generate pure markdown only.

Conduct a GARP analysis for {companyName} (Ticker: {tickerSymbol}) using the provided data.

JSON Data with Pre-Calculated Metrics:
{jsonData}

# GARP Analysis: Is {companyName} ({tickerSymbol}) Priced for Perfection?

## 1. The Valuation Question
Start by framing the core debate. Is this a high-quality company whose growth justifies its price, or is it an over-hyped stock?
- **Current P/E Ratio:** [Use \`valuation.peRatio\`]
- **Current P/S Ratio:** [Use \`valuation.psRatio\`]
- **Valuation vs. History:** Based on \`valuation.peStatusVsHistory\`, is the company trading at a premium or discount to its own past?

## 2. The Growth Engine: Justifying the Price
This section analyzes the growth that investors are paying for.
- **Historical EPS Growth:** Based on \`growth.historicalEpsGrowth\`, what has the recent track record of earnings growth been?
- **Forward EPS Growth (Analyst Forecast):** What is the market's expectation for next year's earnings growth, according to \`growth.forwardEpsGrowth\`? This is the most critical number for the GARP thesis.

## 3. The PEG Ratio Verdict
The Price/Earnings-to-Growth (PEG) ratio is a key tool for GARP investors.
- **Explain the PEG Ratio:** Briefly explain that a PEG ratio of around 1.0 suggests a fair balance between a stock's P/E ratio and its expected earnings growth.
- **Calculated PEG Ratio:** [Use \`pegRatio.value\`]
- **Interpretation:** Based on the calculated PEG ratio, does the stock appear to be attractively priced, fairly priced, or expensively priced relative to its growth forecast? Use the provided \`pegRatio.verdict\`.

## 4. Final Conclusion: The Investment Profile
Synthesize all the points above into a final verdict.
- **The Bull Case (GARP Opportunity):** Summarize the data points (e.g., strong forecast growth, PEG ratio below 1.2) that support the idea of this being a GARP opportunity.
- **The Bear Case (Priced for Perfection):** Summarize the data points (e.g., very high P/E, slowing growth, PEG ratio above 2.0) that suggest the stock is priced for perfection and carries high expectations.
- **Final Takeaway:** Classify the stock's profile based on this analysis. For example: "This appears to be a classic **GARP opportunity**, where strong future growth is available at a reasonable price," or "The analysis suggests this stock is **priced for perfection**, and any slowdown in growth could pose a significant risk to the share price."
`.trim();

export const NEWS_SENTIMENT_PROMPT = `
Role: You are a financial news analyst AI who is an expert at cutting through the noise and explaining what headlines *really* mean for an everyday investor. Your goal is to assess the mood and key narratives surrounding a company based on recent news.

Task: Analyze the sentiment of the following news articles for {companyName} ({tickerSymbol}). IMPORTANT: Process only the articles that include a publication date.

For each valid article, you will perform **six** actions:
1. Extract the publication date (format as YYYY-MM-DD).
2. **Extract the article headline and source URL.**
3. Classify the sentiment as 'Bullish', 'Bearish', 'Neutral'.
4. Classify the impact as 'High', 'Medium', or 'Low'. High impact news is likely to move the stock price.
5. Categorize the news into one of the following themes: 'Financials', 'Legal/Regulatory', 'Product/Innovation', 'Management', or 'Market'.
6. Provide a brief, one-sentence summary explaining the key takeaway for a potential investor.

After analyzing all articles, you will provide a final, overall summary.

Output Format:
First, return a JSON array of objects. Each object must have **"date", "headline", "sourceUrl", "sentiment", "impact", "category", and "summary"** keys. The final JSON array MUST be sorted by impact, from 'High' down to 'Low'. This JSON block must be clean, with no text before or after it.

Second, after the JSON block, add a final markdown section titled "## News Narrative & Pulse". Structure this summary with the following three bullet points:
-   **Overall Sentiment:** Provide a quick tally of the news (e.g., "Slightly Bullish: 3 Bullish, 2 Bearish, 1 Neutral").
-   **Dominant Narrative:** Synthesize the most impactful articles into a single, cohesive story. What is the main narrative an investor would take away from this news flow?
-   **Investor Outlook:** Based on the news, provide a forward-looking sentence. What should an investor be watching for next?

Articles (JSON format):
{news_articles_json}

--- START OF EXAMPLE ---
Example JSON Output:
[
  { "date": "2025-07-28", "headline": "XYZ Corp Shatters Q2 Earnings Estimates on Strong Cloud Growth", "sourceUrl": "https://example.com/news1", "sentiment": "Bullish", "impact": "High", "category": "Financials", "summary": "The company reported stronger-than-expected earnings, which is a significant positive for profitability." },
  { "date": "2025-07-27", "headline": "Regulators Announce Probe into XYZ Corp's Data Practices", "sourceUrl": "https://example.com/news2", "sentiment": "Bearish", "impact": "High", "category": "Legal/Regulatory", "summary": "A new regulatory investigation creates uncertainty and potentially significant legal and financial risks." },
  { "date": "2025-07-25", "headline": "Flagship Product 'Titan' Launch Pushed to Q4", "sourceUrl": "https://example.com/news3", "sentiment": "Bearish", "impact": "Medium", "category": "Product/Innovation", "summary": "A key product launch has been delayed by one quarter, potentially affecting next quarter's revenue." }
]

## News Narrative & Pulse
-   **Overall Sentiment:** Mixed (1 Bullish, 2 Bearish).
-   **Dominant Narrative:** The core story is a tug-of-war between exceptional financial performance and growing external risks. While the company is executing strongly, a new regulatory probe creates a significant overhang of uncertainty.
-   **Investor Outlook:** The upcoming earnings call will be crucial for management to address the regulatory concerns and provide clarity on the product delay.
--- END OF EXAMPLE ---
`.trim();

const BULL_VS_BEAR_PROMPT = `
Role: You are a financial analyst AI who excels at presenting a balanced view. Your task is to explain the two sides of the investment story for {companyName}, acting as a neutral moderator in a debate.

Data Instructions: Your analysis must be derived exclusively from the provided JSON data, which contains pre-calculated trends and metrics.

Output Format: Use markdown format. Explain each point in simple terms. Create a clear "Bull Case" and a "Bear Case" section, each with 3-5 bullet points supported by specific data.

JSON Data:
{jsonData}

# The Investment Debate: {companyName} ({tickerSymbol})

## The Bull Case (The Bright Side: Reasons to be Optimistic)
Construct a positive argument. For each point, state the supporting data and then briefly explain *why* it matters.
Focus on strengths like:
- **Strong Growth:** Is 'revenue' or 'net_income' consistently increasing? Use the trends in the 'growth_trends' object.
- **High Profitability:** Is the company a good money-maker? Analyze the trends in 'profitability_metrics'. If 'roe_trend' has valid data, use it. If not, analyze 'net_profit_margin_trend' or 'operating_margin_trend'.
- **Solid Cash Flow:** Is the business generating real cash? Check for consistent positive values in the 'cash_flow_trends.operating_cash_flow' array.
- **Attractive Valuation:** Does the stock seem cheap relative to its history? Use recent values from 'valuation_metrics.pe_ratio_trend' and 'valuation_metrics.pb_ratio_trend'.
- **Positive Market Momentum:** Does the \`price_performance\` data show strong recent gains? Interpret this as positive market sentiment.

## The Bear Case (The Cautious View: Reasons for Concern)
Construct a negative argument. For each point, state the supporting data and explain the potential risk.
Focus on weaknesses like:
- **Heavy Debt Load:** Does the company owe a lot of money? Analyze the trend in 'balance_sheet_health.debt_to_equity_trend'.
- **Slowing Growth or Declining Profitability:** Are sales or profits shrinking or stagnating? Check the 'growth_trends' object. Are the trends in 'profitability_metrics' declining?
- **Analyst Skepticism:** Do the 'analyst_ratings' show downgrades?
- **Negative Market Momentum:** Does the \`price_performance\` data show significant recent losses? Interpret this as negative market sentiment or specific company concerns.

## The Final Takeaway: What's the Core Debate?
Conclude with a 1-2 sentence summary that frames the central conflict for an investor **and identifies the single most important factor to watch going forward.** For example: "The core debate for {companyName} is whether its strong profitability (the bull case) can outweigh its significant debt load (the bear case). The key factor to watch will be if they can pay down debt while maintaining their high margins."
`.trim();

const MOAT_ANALYSIS_PROMPT = `
Role: You are a business strategist AI who excels at explaining complex business concepts in simple, relatable terms. Your task is to analyze {companyName}'s competitive advantages.
Concept: An "economic moat" is a company's ability to maintain its competitive advantages and defend its long-term profits from competitors.

Data Instructions: Your analysis must be derived exclusively from the provided JSON data, which contains pre-calculated trends and metrics.

Output Format: Provide a brief report in markdown. Explain each point simply and conclude with a clear verdict on the moat's strength.

JSON Data:
{jsonData}

# Economic Moat Analysis: {companyName} ({tickerSymbol})

## 1. What Gives This Company Its Edge? (Sources of the Moat)
Analyze the data for signs of a durable competitive advantage. Discuss:
- **Return on Invested Capital (ROIC):** Analyze the 'roicTrend' data. Explain this as the "gold standard" for moat analysis. A consistently high **and stable/rising** ROIC (>15%) is a strong sign of a moat.
- **Pricing Power & Profitability:** Are the trends in 'profitabilityTrends' (net profit margin, operating income, gross profit margin) consistently high **and stable** over time? Explain this as a sign that the company can reliably charge more.
- **Qualitative Clues (from Description):** Based on the 'qualitativeClues.description', what themes suggest a moat? Look for mentions of a "platform," "network," "marketplace," or "mission-critical" systems.

## 2. How Strong is the Castle Wall? (Moat Sustainability)
Assess how sustainable this advantage might be by looking at:
- **Reinvesting in the Defenses:** Are 'capex' and 'rdExpenses' significant in the 'reinvestmentTrends' data? Explain this as the company spending money to strengthen its moat.
- **Financial Fortress:** Is the balance sheet strong (low 'debtToEquity' in 'balanceSheetHealth')? A company with low debt is better equipped to survive tough times.

## 3. The Verdict: How Wide is the Moat?
Based on all the evidence, provide a concluding assessment. Classify the moat as **"Wide," "Narrow," or "None,"** and explain what this means for a long-term investor.
- **Wide Moat:** The company has strong, sustainable advantages (like consistently high ROIC and clear pricing power) that are very difficult to replicate, **leading to highly predictable long-term profits.**
- **Narrow Moat:** The company has some advantages, but they could be overcome by competitors over time, **making future profits less certain.**
- **No Moat:** The company has no clear, sustainable competitive advantage, **making it vulnerable to competition and price wars.**
`.trim();

const DIVIDEND_SAFETY_PROMPT = `
Role: You are a conservative income investment analyst AI. Your goal is to explain dividend safety in simple, clear terms for an investor who relies on that income.
Concept: Dividend safety analysis is all about figuring out how likely a company is to continue paying its dividend.

Data Instructions: Your analysis must be derived exclusively from the provided JSON data, which contains pre-calculated metrics and trends.

Output Format: Create a markdown report. Explain each point using simple analogies and conclude with a clear safety rating.

JSON Data:
{jsonData}

# Dividend Safety Analysis: {companyName} ({tickerSymbol})

## 1. The Payout: What Are You Earning?
- **Current Dividend Yield:** [Use 'currentYield' value]%. Explain this as the annual return you get from dividends.

## 2. Can the Company Afford Its Dividend? (Payout Ratios)
This is the most important test.
- **Free Cash Flow (FCF) Payout Ratio:** Use the 'payoutRatios.fcfPayoutRatio' value. Explain this as the most conservative test: "Is the dividend covered by the true discretionary cash left after running and growing the business?"
- **Earnings Payout Ratio:** Use the 'payoutRatios.earningsPayoutRatio' value. Explain this as: "For every $1 of profit, how much is paid out as a dividend?" A ratio over 100% is a red flag.

## 3. What is the Track Record? (History & Consistency)
A company's past behavior is a good indicator of its future commitment.
- **Dividend Growth:** Analyze the trend of 'dividendsPaid' in the 'dividendHistory' data. Has the company consistently increased its dividend payment year-over-year?

## 4. Does the Company Have a Safety Net? (Balance Sheet Health)
A strong company can protect its dividend even when times get tough.
- **Debt Load Trend:** Analyze the trend of the 'debtToEquityTrend' data. Is the debt load stable, increasing, or decreasing?
- **Cash Cushion Trend:** Examine the trend in 'cashTrend' data. Is the company's cash pile growing or shrinking?

## 5. The Final Verdict: How Safe Are Your Dividend Checks?
Conclude with a clear rating and a simple, one-sentence justification.
- **"Very Safe":** The dividend has a history of growth, is easily covered by free cash flow, and the balance sheet is strong.
- **"Safe":** The dividend is covered, but may lack a long history of growth or there might be a minor concern to watch.
- **"At Risk":** The payout ratios are high, the dividend isn't growing, and/or the balance sheet is weak. The dividend could be cut.
`.trim();

const GROWTH_OUTLOOK_PROMPT = `
Role: You are a forward-looking equity analyst AI. Your goal is to identify the key signs of future growth for {companyName} and explain them in simple terms.

Data Instructions: Your analysis must be derived exclusively from the provided JSON data, which contains pre-calculated trends and metrics.

Output Format: A concise markdown summary of key growth indicators and a concluding outlook.

JSON Data:
{jsonData}

# Growth Outlook: {companyName} ({tickerSymbol})

## 1. What is the Long-Term Track Record? (Historical Growth)
- **Revenue & Earnings Trend:** Analyze the 'historicalGrowth' trends to describe the long-term track record.

## 2. Are You Paying a Fair Price for Growth? (Valuation)
It's important not to overpay for growth.
- **P/E Ratio:** [Use 'valuation.peRatio']
- **EV to Sales Ratio:** [Use 'valuation.evToSalesRatio']

## 3. Planting Seeds for Future Trees (Reinvestment)
A company must invest today to grow tomorrow.
- **R&D as a Percentage of Revenue:** [Use 'reinvestment.rdToRevenue']. A high value suggests a strong commitment to innovation.
- **Capex as a Percentage of Revenue:** [Use 'reinvestment.capexToRevenue']. This shows investment in physical assets.

## 4. What Does the Market Expect? (Future Outlook)
Interpret the market's view on the company's growth prospects using the 'analystView' data.
- **Analyst Grades:** Review the 'analystView.grades' data. Do recent actions suggest optimism or pessimism?
- **Future Estimates:** Analyze the 'analystView.estimates' data. What is the consensus forecast for revenue and EPS growth?

## 5. Final Outlook: What is the Growth Story?
Based on all the factors above, provide a brief, synthesized outlook. Is this a consistent, long-term grower that is reasonably priced, or is its growth recent and potentially expensive? What is the primary story for a potential investor looking for growth?
`.trim();

const RISK_ASSESSMENT_PROMPT = `
Role: You are a risk analyst AI. Your job is to act like a cautious inspector, identifying the most significant potential problems or "red flags" for {companyName} and explaining them simply.

Data Instructions: Your analysis must be derived exclusively from the provided JSON data, which contains pre-calculated trends and metrics.

Output Format: You MUST return a prioritized, bulleted list in markdown, categorized by risk type. Do NOT use prose or paragraph format for the main analysis. Explain each risk in simple terms within the bullet points.

JSON Data:
{jsonData}

# Uncovering the Risks: {companyName} ({tickerSymbol})

## 1. Financial Risks (Is the Foundation Solid?)
These are risks related to the company's balance sheet and cash flow.
- **Debt Load (Leverage):** Is the 'financialRisks.debtToEquity' ratio high? Explain this risk like having a large mortgage.
- **Paying Short-Term Bills (Liquidity):** Is the 'financialRisks.currentRatio' low (below 1.5)?
- **"Real" Cash vs. "Paper" Profit (Earnings Quality):** Is 'financialRisks.earningsQuality.operating_cash_flow' significantly lower than 'financialRisks.earningsQuality.net_income'? This can be a red flag.
- **Dividend Sustainability:** Is the *amount* of 'dividends_paid' (a positive number representing cash outflow) greater than 'net_income'? This is a major warning sign.

## 2. Market & Stock Price Risks (Is the Stock Itself Risky?)
These are risks related to the stock's price and behavior in the market.
- **Volatility (The "Drama" Level):** Is the 'marketRisks.beta' greater than 1? This means the stock tends to have bigger price swings.
- **Priced for Perfection? (Valuation Risk):** Are the 'marketRisks.valuation.peRatio' or 'marketRisks.valuation.psRatio' exceptionally high?
- **Analyst Pessimism:** Does the 'marketRisks.analystPessimism' list contain any "Sell" ratings or downgrades?

## 3. Business Risks (Are There Cracks in the Operations?)
These are risks related to the day-to-day health of the business.
- **Recession Sensitivity (Economic Cycle Risk):** Based on the 'businessRisks.recession_sensitivity_sector', is it "Cyclical" or "Defensive"?
- **Shrinking Profits? (Margin Compression):** Is the 'businessRisks.marginTrend' trending downwards over the past few years?
- **Core Profitability for Financials (Net Interest Margin):** For banks, is the 'businessRisks.netInterestMarginTrend' trending downwards?

## 4. The Bottom Line: What Are the Biggest Worries?
Based on the data, provide a brief, 1-2 sentence summary highlighting the top 2-3 risks an investor should be most aware of.
`.trim();

const CAPITAL_ALLOCATORS_PROMPT = `
	Act as a senior analyst at a value-investing fund, channeling the analytical rigor of investors like Warren Buffett. Your analysis must be based *only* on the provided financial data for {companyName}.

	Data Instructions: Your analysis requires deep trend analysis. Use the pre-calculated trends and historical data in the JSON payload for your analysis.

	Your task is to critically evaluate the management team of {companyName} ({tickerSymbol}) on their skill as capital allocators. Every claim you make must be substantiated with specific metrics, figures, or trends from the data.

	Article Title: "The Capital Allocators: A Deep Dive into the Financial Stewardship of {companyName}'s Leadership"

    JSON Data:
    {jsonData}

	## 1. The CEO's Inferred Philosophy
	Deduce the CEO's philosophy from the 'cashFlowPriorities' data. Based on where the cash has flowed over the last 5-10 years (e.g., CapEx vs. Acquisitions vs. Buybacks), what are their strategic priorities?

	## 2. The Track Record: A Quantitative Analysis
	Analyze their capital allocation decisions over the last 5-10 years across three key areas, using the provided data:

	- **Reinvestment in the Business:**
		- Analyze the trends in **ROIC** and **ROE** from 'reinvestmentEffectiveness.roicTrend' and 'reinvestmentEffectiveness.roeTrend'. Have these metrics improved or declined as they've reinvested capital?
		- Compare the growth in **CapEx** and **R&D spending** ('cashFlowPriorities') to the corresponding growth in revenue and gross profit ('reinvestmentEffectiveness.revenueGrowth', 'reinvestmentEffectiveness.grossProfitGrowth'). Is there a profitable link between investment and growth?

	- **Acquisitions (M&A):**
		- Analyze the 'acquisitionHistory' data. Does a large increase in goodwill, following significant M&A spending, correlate with a subsequent decline or stagnation in ROIC, suggesting overpayment?

	- **Returning Capital to Shareholders:**
		- **Stock Buybacks:** Analyze the 'shareholderReturns.buybacksWithValuation' data. **Did they opportunistically buy back shares when the stock was cheap (low P/E or P/B), or did they buy high?**
		- **Dividends:** Analyze the 'shareholderReturns.fcfPayoutRatioTrend'. Is the dividend well-covered by free cash flow?

	## 3. The Scorecard & Investment Thesis
	- **Provide a final letter grade (A through F) for the management team's overall skill as capital allocators.** Justify this grade by summarizing the strongest and weakest points from your analysis.
	- Based *only* on this track record of capital allocation, formulate a concise investment thesis.
	- **Conclude with a "Red Flags" section, highlighting any concerning trends in the data.**

	When you mention a stock ticker, you MUST wrap it in a special tag like this: <stock-ticker>TICKER</stock-ticker>.
`.trim();

// --- NEW PROMPTS (v13.2.0) ---

const NARRATIVE_CATALYST_PROMPT = `
Role: You are a forward-looking equity analyst. Your task is to analyze the provided data for {companyName} and complete the following investment checklist. You MUST address every single item.

Data Instructions: Your analysis must be derived exclusively from the provided JSON data.

Output Format: First, complete the checklist. Then, write a final summary that synthesizes your findings into a coherent investment narrative.

JSON Data:
{jsonData}

# Narrative & Catalyst Checklist: {companyName} ({tickerSymbol})

## 1. The Big Picture: Secular Tailwinds
- **[ ] Megatrend Alignment:** Based on the 'description' and 'industry', does this company have direct exposure to a long-term secular trend (e.g., AI, Electrification, Demographics)?

## 2. The Foundation: Financial Health Check
*You must answer both of the following points.*
- **[ ] Profitability & Cash Flow:** Is the company profitable ('isProfitable') AND generating positive free cash flow ('isCashFlowPositive')?
- **[ ] Balance Sheet Strength:** Does the company have a manageable debt load ('manageableDebt')?

## 3. The Spark: Potential Future Catalysts
*You must evaluate all three potential catalysts.*
- **[ ] Operational Momentum:** Is revenue or net income growth **accelerating** ('isGrowthAccelerating')?
- **[ ] Margin Expansion:** Are profit margins showing a trend of improvement ('isMarginExpanding')?
- **[ ] Analyst Sentiment Shift:** Are there recent analyst "upgrades" ('hasRecentUpgrades')?

## 4. Final Summary: The Investment Narrative
*Synthesize all the points above into a final bull vs. bear summary.*
- **The Bull Case:** In one sentence, what is the main story an investor is buying into?
- **The Bear Case (Key Risk):** In one sentence, what is the single biggest data-driven risk to this narrative?
`.trim();

export const INVESTMENT_MEMO_PROMPT = `
Role: You are the Chief Investment Officer (CIO) of a value-investing fund. You have been given a dossier of reports from your analyst team on {companyName}. Your task is to synthesize these findings into a final, decisive investment memo, **weighing the pros and cons to arrive at a clear-cut recommendation.**

IMPORTANT: Your analysis MUST be based *only* on the provided summaries from the other reports. Do not use any external knowledge. Synthesize, do not invent.

Input Reports:
{allAnalysesData}

# Investment Memo: {companyName} ({tickerSymbol})

## 1. The Core Question
Based on the collection of reports, what is the primary reason this stock is under consideration now? (e.g., a potential price dislocation, a newly identified catalyst, a best-in-class business hitting a buy point, etc.).

## 2. Synthesis of Analyst Findings
Concisely synthesize the most critical conclusions from the analyst dossier.
- **Business Quality (Moat & Financials):** What is the fundamental quality of the business? Is it a financially robust "fortress" with a durable competitive moat? (Synthesize from Financial Analysis, Moat Analysis, Competitive Landscape).
- **Management & Stewardship:** Is the leadership team a net **asset or liability**? Are they skilled capital allocators who are aligned with shareholders? (Synthesize from Management Scorecard, Capital Allocators).
- **Growth & Catalysts:** What are the realistic prospects for future growth, and are there clear catalysts on the horizon to unlock value? (Synthesize from Growth Outlook, Narrative & Catalyst Checklist).

## 3. The Valuation Case
Based on the Undervalued Analysis report, is the stock currently trading at a price that offers a **compelling** margin of safety? **Briefly state the implied upside.**

## 4. Primary Risks & Mitigants
What are the 2-3 most critical risks that could permanently impair capital? **For each risk, note any potential mitigating factors mentioned in the reports.** (Synthesize from all reports, especially Risk Assessment and Bear Case).

## 5. Final Verdict & Actionable Recommendation
In one paragraph, deliver your final judgment. Justify your decision by **explicitly weighing the investment's strengths (e.g., moat, valuation) against its weaknesses (e.g., risks, management).**

- **Recommendation:** [Choose one: **Initiate a Position**, **Add to Watchlist**, **Pass**]
- **Conviction Level:** [Choose one: **High**, **Medium**, **Low**]
- **Key Monitoring Point (if Watchlist):** [If recommending 'Watchlist', state the single most important factor to monitor that would change the recommendation. E.g., "Two consecutive quarters of margin improvement."]
`.trim();

export const promptMap = {
    'FinancialAnalysis': {
        prompt: FINANCIAL_ANALYSIS_PROMPT,
        requires: ['profile', 'key_metrics_annual', 'stock_grade_news', 'income_statement_annual', 'cash_flow_statement_annual']
    },
    'UndervaluedAnalysis': {
        prompt: UNDERVALUED_ANALYSIS_PROMPT,
        requires: ['profile', 'key_metrics_annual', 'income_statement_annual', 'cash_flow_statement_annual', 'stock_grade_news', 'analyst_estimates', 'ratios_annual']
    },
    'GarpAnalysis': {
        prompt: GARP_ANALYSIS_PROMPT,
        requires: ['profile', 'key_metrics_annual', 'ratios_annual', 'analyst_estimates', 'income_statement_annual']
    },
    'BullVsBear': {
        prompt: BULL_VS_BEAR_PROMPT,
        requires: ['income_statement_annual', 'key_metrics_annual', 'cash_flow_statement_annual', 'stock_grade_news', 'historical_price']
    },
    'MoatAnalysis': {
        prompt: MOAT_ANALYSIS_PROMPT,
        requires: ['profile', 'key_metrics_annual', 'income_statement_annual', 'cash_flow_statement_annual']
    },
    'DividendSafety': {
        prompt: DIVIDEND_SAFETY_PROMPT,
        requires: ['key_metrics_annual', 'cash_flow_statement_annual', 'income_statement_annual', 'balance_sheet_statement_annual']
    },
    'GrowthOutlook': {
        prompt: GROWTH_OUTLOOK_PROMPT,
        requires: ['income_statement_annual', 'key_metrics_annual', 'stock_grade_news', 'analyst_estimates']
    },
    'RiskAssessment': {
        prompt: RISK_ASSESSMENT_PROMPT,
        requires: ['profile', 'key_metrics_annual', 'cash_flow_statement_annual', 'income_statement_annual', 'stock_grade_news']
    },
    'CapitalAllocators': {
        prompt: CAPITAL_ALLOCATORS_PROMPT,
        requires: ['cash_flow_statement_annual', 'key_metrics_annual', 'income_statement_annual', 'balance_sheet_statement_annual']
    },
    'NarrativeCatalyst': {
        prompt: NARRATIVE_CATALYST_PROMPT,
        requires: ['profile', 'key_metrics_annual', 'cash_flow_statement_annual', 'income_statement_annual', 'stock_grade_news']
    },
    'InvestmentMemo': {
        prompt: INVESTMENT_MEMO_PROMPT,
        requires: [] // This prompt uses other reports, not raw FMP data.
    }
};

export const ANALYSIS_ICONS = {
    'FinancialAnalysis': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6a7.5 7.5 0 100 15 7.5 7.5 0 000-15z" /><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.2-5.2" /><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 10.5H10.5v.008H10.5V10.5zm.008 0h.008v4.502h-.008V10.5z" /></svg>`,
    'UndervaluedAnalysis': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0l.879-.659M7.5 14.25l6-6M4.5 12l6-6m6 6l-6 6" /></svg>`,
    'GarpAnalysis': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18L9 11.25l1.5 1.5L13.5 6l3 3 4.5-4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
    'BullVsBear': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.774 4.774zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
    'MoatAnalysis': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286zm0 13.036h.008v.008h-.008v-.008z" /></svg>`,
    'DividendSafety': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25-2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 3a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 12m15 0a2.25 2.25 0 01-2.25 2.25H12a2.25 2.25 0 01-2.25-2.25" /></svg>`,
    'GrowthOutlook': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>`,
    'RiskAssessment': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>`,
    'CapitalAllocators': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15.91 15.91a2.25 2.25 0 01-3.182 0l-3.03-3.03a.75.75 0 011.06-1.061l2.47 2.47 2.47-2.47a.75.75 0 011.06 1.06l-3.03 3.03z" /></svg>`,
    'NarrativeCatalyst': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.62a8.983 8.983 0 013.362-3.867 8.262 8.262 0 013 2.456z" /><path stroke-linecap="round" stroke-linejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" /></svg>`,
    'InvestmentMemo': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>`
};

export const INDUSTRY_CAPITAL_ALLOCATORS_PROMPT = `
	Act as a discerning investment strategist, channeling the analytical rigor and long-term perspective of firms like Berkshire Hathaway. Your analysis must be in the style of a detailed shareholder letter and based *only* on the provided financial data for {companyName}. **Be critical; praise should be reserved for exceptional, data-backed performance.**

	Article Title: "The Capital Allocators: A Deep Dive into the Financial Stewardship of {companyName}'s Leadership"

	## 1. The CEO's Inferred Philosophy
	**Instead of their stated approach, deduce their *actual* philosophy from the numbers.** Based on the flow of capital over the last decade, what do their actions reveal about their priorities? Do they favor aggressive growth, maintaining a fortress balance sheet, or maximizing shareholder returns?

	## 2. A Quantitative Analysis of the Track Record
	Analyze their capital allocation decisions over the last 5-10 years, using specific metrics to judge their effectiveness:

	- **Reinvestment in the Business (The Primary Engine):**
		- Analyze the trend in **Return on Invested Capital (ROIC)**. Is it consistently high and stable, or is it volatile or declining? **This is the single most important measure of internal investment skill.**
		- Is the company's ROIC comfortably above its Weighted Average Cost of Capital (WACC)? **Value is only created when ROIC > WACC.**

	- **Acquisitions (M&A):**
		- Examine the company's **profit margins** and **ROIC** in the years immediately following major acquisitions. Did the deals enhance profitability (accretive) or dilute it (destructive)?
		- Analyze the growth of **"goodwill"** on the balance sheet. A large increase in goodwill followed by stagnant or declining ROIC is a major red flag for overpayment ("diworsification").

	- **Returning Capital to Shareholders:**
		- **Stock Buybacks:** Correlate the timing and volume of share repurchases with the stock's historical valuation (e.g., Price-to-Earnings or Price-to-Book ratio). **Did they opportunistically buy back shares when the stock was cheap, or did they buy high?**
		- **Dividends:** Analyze the **dividend payout ratio** against free cash flow. Is the dividend safely covered, and is its growth rational and sustainable?

	## 3. Final Scorecard & Investment Thesis
	- **Provide a final letter grade (A through F) for the management team's overall skill as capital allocators.** Justify this grade by summarizing the strongest and weakest points from your quantitative analysis above.
	- Based on this track record, formulate a concise investment thesis. Why should (or shouldn't) an investor trust this team to be wise stewards of capital in the future?
	- **Conclude with a "Key Risks & Red Flags" section**, highlighting any concerning trends (e.g., declining ROIC, value-destructive M&A, or ill-timed buybacks).

	When you mention a stock ticker, you MUST wrap it in a special tag like this: <stock-ticker>TICKER</stock-ticker>.

	Crucial Disclaimer: This article is for informational purposes only and should not be considered financial advice. Readers should consult with a qualified financial professional before making any investment decisions.
`;

export const DISRUPTOR_ANALYSIS_PROMPT = `
Act as a senior analyst for a forward-looking investment research publication like The Motley Fool or ARK Invest, known for identifying high-growth, innovative companies. Your new assignment is to write an article for your "Disruptor Deep Dive" series.

For the {sectorName} sector, your task is to identify one public company that perfectly fits the "disruptor" profile: it has already hit its stride with a proven product and significant traction, but it still has immense potential to disrupt the established leaders and redefine its industry.

Article Title: "Disruptor Deep Dive: How [Company Name] is Rewriting the Rules of the [Sub-Industry] Market"

Your analysis must be structured as follows:

## 1. Introduction: The Challenger Appears
Briefly introduce the company and its bold, simple mission. What industry is it targeting, and what fundamental problem is it solving?

## 2. The Old Guard and The Opening
Who are the established, legacy competitors (the "Goliaths")? Briefly describe the "old way" of doing things in this market and explain what inefficiency, technological gap, or customer dissatisfaction created the opening for a disruptor.

## 3. The Disruptor's Edge: The 'How'
This is the core of the analysis. What is this company's unique advantage or "unfair" edge? Focus on one or two of the following:
- **Technological Moat:** Do they have proprietary technology, a unique platform, or a data advantage that is hard to replicate?
- **Business Model Innovation:** Are they changing how the product/service is sold? (e.g., shifting to a subscription model, creating a marketplace, using a direct-to-consumer approach).
- **Network Effects:** **Is the product or service designed so that each new user adds value to the other users, creating a powerful, self-reinforcing moat?**

## 4. 'Hitting Their Stride': The Proof in the Numbers
Provide concrete evidence that this company is past the purely speculative stage. What are the key performance indicators (KPIs) that prove they are executing successfully?
- **(e.g., Sustained YoY revenue growth > 40%, an attractive LTV/CAC ratio, Net Revenue Retention > 120% for SaaS models, or reaching positive operating cash flow).**

## 5. The Path to Dominance: The Future
What is the long-term bull case? Analyze the Total Addressable Market (TAM) they are pursuing. What are the next steps in their strategy? What are the primary risks or hurdles that could derail their ascent?
- **(e.g., Can incumbents leverage their scale and distribution to retaliate? Regulatory threats? Execution risk as the company scales?)**

## 6. Valuation Context
**Briefly comment on the company's valuation. Is it trading at a high multiple? If so, what is the justification (e.g., superior growth, higher margins)? This is not a price target, but a crucial context check on the current stock price.**

## 7. Investment Thesis Summary
Conclude with a concise summary for an investor. In 2-3 sentences, what is the core reason to be bullish on this company's long-term potential, **why might it be a compelling idea now**, and what is the main risk to watch out for?

When you mention a stock ticker, you MUST wrap it in a special tag like this: <stock-ticker>TICKER</stock-ticker>.

The tone should be insightful and optimistic about innovation, but grounded in business fundamentals and realistic about the challenges of disruption.
`;

export const INDUSTRY_DISRUPTOR_ANALYSIS_PROMPT = `
Act as a senior analyst for a forward-looking investment research publication like The Motley Fool or ARK Invest, known for identifying high-growth, innovative companies. Your new assignment is to write an article for your "Disruptor Deep Dive" series.

For the {industryName} industry, your task is to identify one public company that perfectly fits the "disruptor" profile: it has already hit its stride with a proven product and significant traction, but it still has immense potential to disrupt the established leaders and redefine its industry.

Article Title: "Disruptor Deep Dive: How [Company Name] is Rewriting the Rules of the [Industry] Market"

Your analysis must be structured as follows:

## 1. Introduction: The Challenger Appears
Briefly introduce the company and its bold, simple mission. What industry is it targeting, and what fundamental problem is it solving?

## 2. The Old Guard and The Opening
Who are the established, legacy competitors (the "Goliaths")? Briefly describe the "old way" of doing things in this market and explain what inefficiency, technological gap, or customer dissatisfaction created the opening for a disruptor.

## 3. The Disruptor's Edge: The 'How'
This is the core of the analysis. What is this company's unique advantage or "unfair" edge? Focus on one or two of the following:
- **Technological Moat:** Do they have proprietary technology, a unique platform, or a data advantage that is hard to replicate?
- **Business Model Innovation:** Are they changing how the product/service is sold? (e.g., shifting to a subscription model, creating a marketplace, using a direct-to-consumer approach).
- **Network Effects:** **Is the product or service designed so that each new user adds value to the other users, creating a powerful, self-reinforcing moat?**

## 4. 'Hitting Their Stride': The Proof in the Numbers
Provide concrete evidence that this company is past the purely speculative stage. What are the key performance indicators (KPIs) that prove they are executing successfully?
- **(e.g., Sustained YoY revenue growth > 40%, an attractive LTV/CAC ratio, Net Revenue Retention > 120% for SaaS models, or reaching positive operating cash flow).**

## 5. The Path to Dominance: The Future
What is the long-term bull case? Analyze the Total Addressable Market (TAM) they are pursuing. What are the next steps in their strategy? What are the primary risks or hurdles that could derail their ascent?
- **(e.g., Can incumbents leverage their scale and distribution to retaliate? Regulatory threats? Execution risk as the company scales?)**

## 6. Valuation Context
**Briefly comment on the company's valuation. Is it trading at a high multiple? If so, what is the justification (e.g., superior growth, higher margins)? This is not a price target, but a crucial context check on the current stock price.**

## 7. Investment Thesis Summary
Conclude with a concise summary for an investor. In 2-3 sentences, what is the core reason to be bullish on this company's long-term potential, **why might it be a compelling idea now**, and what is the main risk to watch out for?

When you mention a stock ticker, you MUST wrap it in a special tag like this: <stock-ticker>TICKER</stock-ticker>.

The tone should be insightful and optimistic about innovation, but grounded in business fundamentals and realistic about the challenges of disruption.
`;

export const MACRO_PLAYBOOK_PROMPT = `
Act as a thematic investment strategist for a global macro fund. You are authoring a new report for your "Macro Playbook" series.

## 1. The Wave (The Macro Trend)
- Start by identifying and explaining one powerful, multi-year macro or societal trend (e.g., The Electrification of Everything, The On-Shoring of Manufacturing, The Rise of AI Compute).
- Provide key data points on the size ($) and expected growth (CAGR) of this trend.

## 2. The 'Surfboard' (The Best-in-Class Company)
- Within the {sectorName} sector, identify one company that is a best-in-class, pure-play beneficiary of this macro wave, defined by its **market leadership, technological edge, and superior financial profile.**
- **Business Model Alignment:** Explain exactly how the company's products or services are positioned to capture growth from this trend.
- **Competitive Differentiation:** **Why is this company a better "surfboard" for this wave than its key rivals?**

## 3. Quantifying the Tail-Wind
- Based on financial reports and management commentary, **estimate the percentage of the company's revenue that is directly exposed to this trend.** How is this exposure trending over time?
- **Find and quote management's most insightful public statement** regarding how they are capitalizing on this macro trend.

## 4. Thesis Risks (When the Wave Breaks)
- What could disrupt this thesis? Consider risks to the macro trend itself, competitive threats from new technology, and **valuation risk (i.e., is the powerful trend already fully priced into the stock?).**

## 5. Conclusion: Investing in a Megatrend
- Conclude with a summary of why owning this specific company is a **high-conviction** way for a long-term investor to gain direct exposure to this powerful, enduring global trend, despite the identified risks.

When you mention a stock ticker, you MUST wrap it in a special tag like this: <stock-ticker>TICKER</stock-ticker>.
`;

export const INDUSTRY_MACRO_PLAYBOOK_PROMPT = `
Act as a thematic investment strategist for a global macro fund. You are authoring a new report for your "Macro Playbook" series.

## 1. The Wave (The Macro Trend)
- Start by identifying and explaining one powerful, multi-year macro or societal trend (e.g., The Electrification of Everything, The On-Shoring of Manufacturing, The Rise of AI Compute).
- Provide key data points on the size ($) and expected growth (CAGR) of this trend.

## 2. The 'Surfboard' (The Best-in-Class Company)
- Within the {industryName} industry, identify one company that is a best-in-class, pure-play beneficiary of this macro wave, defined by its **market leadership, technological edge, and superior financial profile.**
- **Business Model Alignment:** Explain exactly how the company's products or services are positioned to capture growth from this trend.
- **Competitive Differentiation:** **Why is this company a better "surfboard" for this wave than its key rivals?**

## 3. Quantifying the Tail-Wind
- Based on financial reports and management commentary, **estimate the percentage of the company's revenue that is directly exposed to this trend.** How is this exposure trending over time?
- **Find and quote management's most insightful public statement** regarding how they are capitalizing on this macro trend.

## 4. Thesis Risks (When the Wave Breaks)
- What could disrupt this thesis? Consider risks to the macro trend itself, competitive threats from new technology, and **valuation risk (i.e., is the powerful trend already fully priced into the stock?).**

## 5. Conclusion: Investing in a Megatrend
- Conclude with a summary of why owning this specific company is a **high-conviction** way for a long-term investor to gain direct exposure to this powerful, enduring global trend, despite the identified risks.

When you mention a stock ticker, you MUST wrap it in a special tag like this: <stock-ticker>TICKER</stock-ticker>.
`;

export const ONE_SHOT_INDUSTRY_TREND_PROMPT = `
Role: You are an expert financial analyst AI. Your task is to write a detailed, **balanced** investment research report for a specific economic industry based on a provided list of companies and recent news articles.

Task:
You will be given a list of companies in the {industryName} industry and a list of recent news articles.
Your task is to generate a comprehensive markdown report by following these steps:

1.  **Analyze and Synthesize:** Read all news articles to identify the most noteworthy trends, events, and narratives affecting the companies in the provided list. **Separate findings into positive (tailwinds) and negative (headwinds).**
2.  **Identify Key Movers:** From your analysis, identify the **Top 3 most favorably mentioned** companies and the **1-2 companies facing the most significant headwinds**. Your ranking must be based on the significance and sentiment of the news.
3.  **Generate Report:** Structure your output as a single, professional markdown report.

Output Format:
The report must start with an overall summary, followed by a deeper dive into the key companies you identified. For each catalyst or event you mention, you MUST append a source placeholder like this: '[Source: X]', where X is the 'articleIndex' from the original news data JSON.
When you mention a stock ticker, you MUST wrap it in a special tag like this: <stock-ticker>TICKER</stock-ticker>.

--- START OF REPORT ---
## AI-Powered Market Analysis: {industryName} Industry
### Overall Industry Outlook & Key Themes
Provide a summary of the overall outlook for the {industryName} industry.
- **Key Tailwinds:** [Summarize the most significant positive themes from the news.]
- **Key Headwinds:** [Summarize the most significant challenges or negative themes from the news.]

### Deeper Dive: Top Companies in the News
For each of the top companies you identified:
1.  Use its name and ticker as a sub-header (e.g., "### 1. NVIDIA Corp (NVDA)"). You will have to find the company name associated with the ticker from the news articles.
2.  **News-Driven Outlook:** Write a concise, 2-3 sentence summary explaining why this company is in the spotlight based on recent news.
3.  **Positive Catalysts:** Create a bulleted list of the specific positive events or catalysts from the news. Remember to append the source placeholder for each point.

### Companies Facing Headwinds
*For the 1-2 companies you identified as facing challenges:*
1.  Use its name and ticker as a sub-header (e.g., "### ACME Corp (ACME)").
2.  **Summary of Challenges:** Write a 1-2 sentence summary of the key issues or negative events affecting the company according to the news.
3.  **Negative Catalysts:** Create a bulleted list of the specific negative events. Remember to append the source placeholder for each point.

**Disclaimer:** This report is an AI-generated synthesis of public news articles and is for informational purposes only. It does not constitute financial advice.

--- END OF REPORT ---

List of companies in the industry:
[\${industryStocks}]

News Articles JSON Data:
{newsArticlesJson}
`;

export const FORTRESS_ANALYSIS_PROMPT = `
Act as a conservative, risk-averse investment analyst. Your goal is to identify an "all-weather" business within the {contextName} {contextType} that is built for resilience.

Article Title: "The Fortress: Why [Company Name] Is Built to Withstand Any Economic Storm"

Your analysis must be structured as follows:

## 1. The Economic Storm
- Define a specific, adverse economic scenario to test our thesis (e.g., a "stagflation" environment with high inflation and stagnant growth).

## 2. The Fortress
- Within the {contextName} {contextType}, identify one public company that appears structurally resilient to this storm.

## 3. Analyzing the Defenses: A Four-Pillar Framework
- **Pillar 1: Inelastic Demand:** Does the company sell a product or service that customers **need**, not just want, regardless of the economic climate?

- **Pillar 2: Pricing Power:** Does its brand or market position allow it to pass on cost increases to customers? **Look for proof in its stable or expanding Gross Profit Margins over time.**

- **Pillar 3: Impenetrable Balance Sheet:** Analyze its debt levels (**Debt-to-Equity ratio**) and cash generation (**Free Cash Flow**). Is its balance sheet a source of strength that could allow it to survive a downturn and acquire weaker rivals?

- **Pillar 4: Disciplined Stewardship:** Does the management team have a **proven track record of conservative financial management**, as evidenced by the strong balance sheet and consistent profitability?

## 4. The Price of Safety: Valuation
- A fortress is only a good investment if you don't overpay for it. Briefly comment on the company's valuation. Does its current stock price offer a reasonable **margin of safety**, or is its quality fully recognized with a premium valuation?

## 5. The Long-Term Compounding Thesis
- Conclude by summarizing why this company's combination of a **defensive business model, pristine financials, disciplined management, and a reasonable valuation** makes it a prime candidate to not just survive but thrive, steadily compounding wealth for patient, long-term investors.

When you mention a stock ticker, you MUST wrap it in a special tag like this: <stock-ticker>TICKER</stock-ticker>.
`;

export const PHOENIX_ANALYSIS_PROMPT = `
Act as a special situations analyst looking for high-risk, high-reward opportunities. Your goal is to analyze a potential turnaround story.

Article Title: "The Phoenix: Analyzing the Potential Turnaround of [Company Name]"

Your analysis must be structured as follows:

## 1. The Fall From Grace
- Identify a company in the {contextName} {contextType} that has stumbled. Briefly describe its past troubles (e.g., lost market share, a failed strategy, or crushing debt).

## 2. The Catalyst for Change
- Identify the single most important catalyst driving the potential turnaround (e.g., a new CEO with a proven track record, a strategic divestiture, or a new blockbuster product).
- **If the catalyst is new leadership, briefly comment on their background and past successes.**

## 3. The Turnaround Plan & Early "Green Shoots"
- **Financial Runway:** First, does the company have the financial resources to **survive** long enough for the turnaround to work? Analyze its cash position and debt maturity schedule.
- **Early Evidence:** Search for early, quantifiable evidence ("green shoots") that the turnaround plan is taking hold. Look for improving profit margins, debt reduction, positive free cash flow, or renewed revenue growth.

## 4. The Valuation Opportunity
- The essence of a turnaround investment is buying at a point of maximum pessimism. **Is the company's stock still trading at a deeply discounted valuation multiple (e.g., low Price-to-Sales or Price-to-Book) that reflects its past troubles rather than its future potential?**

## 5. The Asymmetric Bet: Rebirth Thesis & Risks
- **The Bull Case:** Summarize the thesis for why the company could be a "multi-bagger" if the turnaround succeeds. What could the business look like in 3-5 years?
- **The Bear Case:** Crucially, outline the major risks. **What is the single most important "make-or-break" factor that could cause the "Phoenix" to turn back to ash?**

When you mention a stock ticker, you MUST wrap it in a special tag like this: <stock-ticker>TICKER</stock-ticker>.
`;

export const PICK_AND_SHOVEL_PROMPT = `
Act as an investment analyst specializing in identifying indirect beneficiaries of major economic trends.

Article Title: "The 'Pick and Shovel' Play: How [Company Name] is Powering the [Trend Name] Gold Rush"

Your analysis must be structured as follows:

## 1. The Gold Rush
- Define a major, specific trend (the 'gold rush') that is directly driving growth within the {contextName} {contextType} (e.g., the build-out of AI data centers, the transition to electric vehicles).

## 2. The "Pick and Shovel" Provider
- Identify a company that provides an essential 'pick and shovel' (a critical component, technology, or service) directly to the companies participating in that specific trend and industry.

## 3. The Tollbooth Thesis
- Explain why this company's business model acts like a tollbooth on the industry's growth highway.
- **Competitive Position:** **Is this a monopoly, an oligopoly, or just one of many suppliers? What is its market share, and what protects it from competition?**

## 4. Quantifying the Tailwind
- How is the "gold rush" showing up in the company's results? **Look for evidence in accelerating revenue growth, expanding margins, and management commentary about demand.**

## 5. Risks to the Thesis
- **What are the primary risks to this investment?** Consider factors like:
    - **Trend Risk:** What if the "gold rush" slows down or fizzles out?
    - **Technological Risk:** Could a new technology make their "picks and shovels" obsolete?
    - **Valuation Risk:** Is the company's strategic position already fully priced into the stock?

## 6. Investment Outlook
- Conclude with the thesis for why owning this "arms dealer" is a potentially safer and more durable way to invest in the theme, after considering the risks and valuation. **Crucially, your conclusion must explicitly state the logical link between the {contextName} {contextType}, the identified 'gold rush' trend, and the chosen 'pick and shovel' company.**

When you mention a stock ticker, you MUST wrap it in a special tag like this: <stock-ticker>TICKER</stock-ticker>.
`;

export const LINCHPIN_ANALYSIS_PROMPT = `
Act as a business strategist focused on identifying companies with deep, structural competitive advantages.

Article Title: "The Linchpin: How [Company Name] Dominates the [Industry] Supply Chain"

Your analysis must be structured as follows:

## 1. Mapping the Value Chain
- Briefly describe the key steps required to bring the {contextName} {contextType}'s product or service to market (e.g., design -> manufacturing -> logistics -> sales).

## 2. The Linchpin Company
- Identify one public company within the {contextName} {contextType} that represents a critical, non-negotiable step in this chain.

## 3. The Choke Point Moat
- Analyze the source of its power. Is it due to unique IP, immense economies of scale, or prohibitively high switching costs for its customers?
- **Find the proof in the numbers:** A true linchpin should exhibit **sustainably high and stable profit margins (Operating Margin, Net Margin)** and **Return on Invested Capital (ROIC)** that are superior to other companies in the value chain.

## 4. Threats to the Linchpin
- **Every fortress is under potential siege. What are the primary threats to this company's choke point position?** Consider **technological disruption, regulatory risk, or large customers attempting to vertically integrate or design around them.**

## 5. The Price of Power: Valuation
- Does the market already recognize this company's dominant position? Briefly comment on its valuation. **Is it trading at a premium multiple, and is that premium justified by its strategic importance and financial superiority?**

## 6. The Investment Case
- Conclude by explaining why this "linchpin" status—**supported by strong financial metrics and after considering the risks**—translates into predictable, long-term profitability, making it a potential cornerstone holding for a patient investor.

When you mention a stock ticker, you MUST wrap it in a special tag like this: <stock-ticker>TICKER</stock-ticker>.
`;

export const HIDDEN_VALUE_PROMPT = `
Act as a value investor and activist analyst, searching for hidden value in complex companies.

**Note:** This analysis is data-intensive. The quality of the output depends on the availability of public financial data for the company's individual business segments.

Article Title: "Hidden Value: A Sum-of-the-Parts Investigation of [Company Name]"

Your analysis must be structured as follows:

## 1. The Misunderstood Giant
- Introduce a large, multi-divisional company in the {contextName} {contextType} that you believe the market understands and may be subject to a "conglomerate discount."

## 2. Breaking Down the Empire
- Identify and describe the company's primary business segments. For each, identify its key pure-play competitors.

## 3. Valuing the Pieces
- For each major segment, apply a reasonable valuation multiple (e.g., Price/Sales or EV/EBITDA) based on its publicly-traded competitors.
- **You MUST briefly justify the choice of multiple for each segment** (e.g., "EV/EBITDA is appropriate for this mature, cash-flowing business, while Price/Sales is better for the high-growth, unprofitable division.").

## 4. The Sum-of-the-Parts (SOTP) Calculation
- Add up the estimated values of all segments.
- **From this total, subtract a capitalized value for unallocated corporate costs (the "conglomerate drag").**
- Finally, subtract the company's net debt to arrive at a theoretical "unlocked" equity value and a per-share SOTP target price.

## 5. Risks to the Thesis
- What could prevent this "hidden value" from being realized? Discuss the primary risks:
    - **Catalyst Risk:** Is management entrenched and unlikely to pursue spin-offs?
    - **Execution Risk:** Could a breakup be messy, costly, or destroy hidden synergies?
    - **Valuation Risk:** Are the chosen peer multiples at a cyclical peak, potentially inflating the SOTP value?

## 6. The Activist Playbook: Unlocking Value
- Compare your SOTP value to the current market cap. If there's a significant discount, summarize the activist thesis.
- What are the **specific catalysts (e.g., spin-offs, divestitures, a new management team)** that could unlock this value for shareholders?

When you mention a stock ticker, you MUST wrap it in a special tag like this: <stock-ticker>TICKER</stock-ticker>.
`;

export const UNTOUCHABLES_ANALYSIS_PROMPT = `
Act as a brand strategist and long-term investor, analyzing companies with powerful, "cult-like" brands.

Article Title: "The Untouchables: Deconstructing [Company Name]'s 'Cult' Brand Moat"

Your analysis must be structured as follows:

## 1. The Icon
- Identify a company in the {contextName} {contextType} famous for its powerful brand and devoted following.

## 2. Anatomy of Devotion
- Analyze the sources of this intense customer loyalty. Is it rooted in **creating a sense of identity/aspiration, delivering a superior and consistent user experience, or earning unwavering trust through quality?**

## 3. The Financial Proof of a Great Brand
- Find proof of the brand's power in the financials. Look for:
    - **Sustainably high gross margins** (evidence of pricing power).
    - **Low Sales & Marketing spend as a % of revenue** (the brand does the selling for them).
    - **High rates of recurring or repeat revenue.**

## 4. The Achilles' Heel: Risks to the Brand
- Even the strongest brands are not invincible. What are the primary threats to this company's brand moat? Consider risks like:
    - **Reputational Damage:** Could a major scandal or product failure break customer trust?
    - **Cultural Shifts:** Could the brand fall out of touch with the next generation?
    - **Technological Disruption:** Could a new technology make their product category less relevant?

## 5. The Price of Perfection: Valuation
- The market is rarely blind to a great brand. Briefly comment on the company's valuation. **Is it trading at a significant premium to its peers and the broader market? Is that premium justified by its superior profitability and growth prospects?**

## 6. The Long-Term Investment Thesis
- Conclude by explaining why this powerful brand—**validated by its financial performance and after considering the risks and valuation**—creates a durable competitive advantage that is extremely difficult to replicate, leading to predictable long-term profits.

When you mention a stock ticker, you MUST wrap it in a special tag like this: <stock-ticker>TICKER</stock-ticker>.
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


export const creativePromptMap = {
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
    'Materials': { prompt: MATERIALS_SECTOR_PROMPT, label: 'Playbook' }
};
