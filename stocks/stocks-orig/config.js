// --- App Version ---
export const APP_VERSION = "13.7.9"; 

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
    driveTokenClient: null,
    driveFolderId: null,
    portfolioCache: [],
    availableIndustries: [],
    sessionLog: [] // To hold prompts and responses for the current session
};

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
};

export const SECTOR_ICONS = {
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

export const FINANCIAL_ANALYSIS_PROMPT = `
Role: You are a financial analyst AI who excels at explaining complex topics to everyday investors. Your purpose is to generate a rigorous, data-driven financial analysis that is also educational, objective, and easy to understand. Use relatable analogies to clarify financial concepts. Your analysis must be derived exclusively from the provided JSON data.

Output Format: The final report must be in professional markdown format. Use # for the main title, ## for major sections, ### for sub-sections, and bullet points. Present financial figures clearly, using 'Billion' or 'Million' where appropriate.

IMPORTANT: Do not include any HTML tags in your output. Generate pure markdown only.

Analyze the comprehensive financial data for {companyName} (Ticker: {tickerSymbol}) provided below. If a specific data point is "N/A" or missing, state that clearly.

JSON Data:
{jsonData}

Based on the provided data, generate the following multi-faceted financial report:

# Comprehensive Financial Analysis: {companyName} ({tickerSymbol})

## 1. Executive Summary
Begin with a concise, one-paragraph summary. For someone in a hurry, what is the most important takeaway about this company's financial health, performance, and overall story as a potential investment?

## 2. Company Profile & Market Context
### Business Description
In simple terms, describe the company's business based on the 'description', 'sector', and 'industry'. Avoid jargon.
### Market Snapshot
- Market Capitalization: $XXX.XX Billion
- 52-Week Price Range: $XX.XX - $XX.XX
- **Analyst Consensus:** [e.g., "Strong Buy" based on 'ratingDetailsDCFRecommendation']
- **Insider Ownership:** [e.g., XX% based on 'insiderOwnership' if available]

## 3. Performance & Profitability (How Well Does It Make Money?)
### 3.1. Revenue & Earnings Trend
Analyze the historical trend of 'revenue' and 'netIncome'. Is the company growing? Discuss the Year-over-Year (YoY) growth rates for the most recent two years and the **3- or 5-year Compound Annual Growth Rate (CAGR)** to show the long-term trajectory.
### 3.2. Margin Analysis (The Quality of Sales)
Explain and analyze the trends in **'grossProfitMargin'** (shows pricing power) and **'operatingProfitMargin'** (shows operational efficiency) before discussing the final profit.
### 3.3. Net Profitability & Returns
Explain what 'netProfitMargin' means. For every $100 in sales, how much is actual profit?
Explain 'returnOnEquity' (ROE) and 'returnOnAssets' (ROA) as a grade for management. How well are they using resources to generate profit?

## 4. Financial Health & Risk (Is the Company on Solid Ground?)
### 4.1. Liquidity Analysis
Interpret the 'currentRatio'. Does the company have enough short-term assets to pay its short-term bills?
### 4.2. Solvency and Debt Structure
Analyze the 'debtToEquity' ratio. Is the company conservatively or aggressively financed?
Explain the 'interestCoverage' ratio simply: From its operating earnings, how many times over can the company pay the interest on its debt?

## 5. Cash Flow Analysis (Following the Actual Cash)
### 5.1. Operating Cash Flow (OCF) & Quality of Earnings
Is the company consistently generating real cash from its main business ('operatingCashFlow')? Compare OCF to 'netIncome'. Are profits backed by cash?
### 5.2. Capital Allocation Story
Briefly explain what the company is doing with its cash. Is it in **growth mode** (high 'capitalExpenditure'), **mature/return mode** (high 'dividendsPaid' and 'commonStockRepurchased'), or **deleveraging mode** (high 'debtRepayment')?

## 6. Valuation Analysis (Is the Stock Price Fair?)
**Crucially, for each multiple, compare it to the company's historical average and its industry average (if data is available).** Context is key.
- P/E Ratio ('peRatio')
- Price-to-Sales Ratio ('priceToSalesRatio')
- Price-to-Book Ratio ('priceToBookRatio')
- Enterprise Value to EBITDA ('enterpriseValueOverEBITDA')
Briefly discuss what these comparisons imply. Is the stock trading at a premium or a discount, and why might that be?

## 7. The Long-Term Investment Thesis: Bull vs. Bear
### The Bull Case (Key Strengths)
Identify 2-3 of the most significant financial strengths. What is the primary "bull" argument based on the FMP data?
### The Bear Case (Potential Risks)
Identify 2-3 of the most significant weaknesses or financial red flags. What is the primary "bear" argument based on the FMP data?
### Final Verdict: The "Moat"
Based purely on this quantitative analysis, what is the primary story? Does the data suggest the company has a strong competitive advantage (a "moat")? **Look for clues like consistently high ROE/ROIC, durable profit margins, or a fortress balance sheet.** Conclude with a final statement on its profile as a potential long-term holding.
`.trim();

export const UNDERVALUED_ANALYSIS_PROMPT = `
Role: You are a financial analyst AI who excels at explaining complex topics to everyday investors. Your purpose is to conduct a clear, data-driven valuation analysis to determine if a stock is a potential bargain. Use relatable analogies and explain all financial terms simply. Your analysis must be derived exclusively from the provided FMP JSON data.

Output Format: The final report must be in professional markdown format. Use # for the main title, ## for major sections, ### for sub-sections, and bullet points for key data points.

IMPORTANT: Do not include any HTML tags in your output. Generate pure markdown only.

Conduct a comprehensive valuation analysis for {companyName} (Ticker: {tickerSymbol}) using the financial data provided below. If a specific data point is "N/A" or missing, state that clearly in your analysis.

JSON Data:
{jsonData}

Based on the data, generate the following in-depth report:
# Investment Valuation Report: Is {companyName} ({tickerSymbol}) a Bargain?

## 1. The Bottom Line: Our Verdict
Provide a concise, one-paragraph conclusion that immediately answers the main question: Based on the data, does this stock seem **Undervalued, Fairly Valued, or Overvalued?** Briefly mention the top 1-2 reasons for this verdict in plain English.

## 2. Fundamental Analysis: The Engine Behind the Price
Let's look at the company's performance and health to understand the "why" behind its valuation.
### 2.1. Growth & Profitability Trends
- **Revenue Growth:** Analyze the Year-over-Year (YoY) growth and the **3- or 5-year Compound Annual Growth Rate (CAGR)** from the 'income_statement' data. Is the company's growth accelerating, stable, or slowing down?
- **Profit Margin Trend:** Analyze the trend in 'netProfitMargin' from 'key_metrics'. Is the company becoming more or less profitable over time? **A rising margin is a strong positive signal.**

### 2.2. Financial Health Check
- **Return on Equity (ROE):** [Value from 'key_metrics.returnOnEquity']. Explain this as a "report card" for the business. A consistently high ROE suggests a high-quality, efficient company.
- **Debt-to-Equity Ratio:** [Value from 'key_metrics.debtToEquity']. Explain this like a personal debt-to-income ratio. A high number means the company relies heavily on debt, which can be risky.

### 2.3. Getting Paid to Wait (Dividend Analysis)
- **Dividend Yield:** [Value from 'key_metrics.dividendYield']%. Explain this as the annual return you get from dividends.
- **Is the Dividend Safe?** Calculate the **Cash Flow Payout Ratio** ('dividendsPaid' / 'operatingCashFlow'). A low number (<60%) is a good sign that the dividend is well-covered by actual cash.

## 3. Valuation: What Are You Paying for That Engine?
Now we'll look at the "price tag" using several common metrics.
### 3.1. Core Valuation Multiples
- **Price-to-Earnings (P/E) Ratio:** [Value] - The price you pay for $1 of profit.
- **Price-to-Sales (P/S) Ratio:** [Value] - The price you pay for $1 of sales.
- **Price-to-Book (P/B) Ratio:** [Value] - The price compared to the company's net worth on paper.

### 3.2. Valuation in Context: Relative Analysis
A stock's valuation is only meaningful with context.
- **Comparison to History:** **How do the current P/E, P/S, and P/B ratios compare to the company's own 5-year average multiples?** Is it cheap or expensive compared to its own past?
- **Comparison to Industry:** Using the 'industry' from the 'company_profile', are these multiples generally high or low for this type of business?

### 3.3. Deep Value Check (The Graham Number)
- **Graham Number:** [Value]. Explain this as a theoretical intrinsic value for defensive investors. If the current stock price is below the Graham Number, it may be considered deeply undervalued.

## 4. Market Sentiment & Wall Street View
- **Analyst Consensus:** Review the 'stock_grade_news' array. What is the general sentiment from Wall Street analysts?
- **Future Expectations:** Does the news mention any **analyst price targets or earnings estimates?** This gives a sense of future expectations.

## 5. Final Conclusion: The Investment Case
### The Case for a Bargain (Bull)
Summarize the key data points (e.g., strong growth, low valuation vs. history, price below Graham Number) that suggest the stock is undervalued.
### The Case for Caution (Bear)
Summarize the key risks or red flags (e.g., high debt, slowing growth, high valuation vs. peers) that suggest caution is warranted.
### Final Takeaway
End with a clear, final statement that **classifies the stock's profile.** For example: "While the market is cautious, the data suggests this is a **'classic value'** opportunity," or "This appears to be a **'growth at a reasonable price'** story," or "High debt and slowing growth suggest this could be a **'potential value trap.'**"
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

export const BULL_VS_BEAR_PROMPT = `
Role: You are a financial analyst AI who excels at presenting a balanced view. Your task is to explain the two sides of the investment story for {companyName}, acting as a neutral moderator in a debate. **Use ONLY the provided FMP JSON data to build your arguments. Do not reference any data points not present in the provided JSON. If a key data point (like historical employee counts) is missing, you must state that it is unavailable instead of fabricating a trend.**

Output Format: Use markdown format. Explain each point in simple terms, as if talking to a friend who is new to investing. Create a clear "Bull Case" and a "Bear Case" section, each with 3-5 bullet points supported by specific data from the JSON.

JSON Data:
{jsonData}

# The Investment Debate: {companyName} ({tickerSymbol})

## The Bull Case (The Bright Side: Reasons to be Optimistic)
Construct a positive argument for the company. For each point, state the supporting data and then briefly explain *why* it matters to an investor.
Focus on strengths like:
- **Strong Growth:** Is 'revenue' or 'netIncome' consistently increasing? (Use 'income_statement' data).
- **High Profitability:** Is the company a good money-maker? (Use 'returnOnEquity' from 'key_metrics'). For financial institutions, also look at the **'netInterestMargin'** trend, which shows the core profitability of its lending operations.
- **Durable Competitive Advantage (Moat):** Does the data suggest a strong moat? Look for **consistently high profit margins or ROE over time**. Explain this as the company's "protective wall" that keeps competitors at bay.
- **Solid Cash Flow:** Is the business generating real cash? (Use 'operatingCashFlow' from 'cash_flow_statement'). Explain this as the company's "lifeblood".
- **Attractive Valuation:** Does the stock seem cheap relative to its earnings or net assets? (Use 'peRatio' and **'priceToBookRatio'** from 'key_metrics').

## The Bear Case (The Cautious View: Reasons for Concern)
Construct a negative argument for the company. For each point, state the supporting data and explain the potential risk.
Focus on weaknesses like:
- **Heavy Debt Load:** Does the company owe a lot of money? (Use 'debtToEquity' from 'key_metrics'). Explain this like having a large mortgage; it can be risky if times get tough.
- **Slowing Growth:** Are sales or profits shrinking or stagnating? (Use 'income_statement' data).
- **Weakening Competitive Position:** Are **profit margins or ROE declining**? This could be a red flag that the company's "protective wall" is crumbling and competition is hurting them.
- **Expensive Stock:** Does the stock seem overpriced for its performance? (Use high valuation multiples like 'peRatio' or **'priceToBookRatio'** from 'key_metrics', especially when compared to its historical average).
- **Analyst Skepticism:** Do the 'stock_grade_news' entries show "Sell" ratings or downgrades?

## The Final Takeaway: What's the Core Debate?
Conclude with a 1-2 sentence summary that frames the central conflict for an investor **and identifies the single most important factor to watch going forward.** For example: "The core debate for {companyName} is whether its strong profitability (the bull case) can outweigh its significant debt load (the bear case). The key factor to watch will be if they can pay down debt while maintaining their high margins."
`.trim();

export const MOAT_ANALYSIS_PROMPT = `
Role: You are a business strategist AI who excels at explaining complex business concepts in simple, relatable terms. Your task is to analyze {companyName}'s competitive advantages using the FMP JSON data provided. **Your analysis must be strictly based on the provided data. Do not invent numbers for operational details like locations, customers, or employees.**

Concept: An "economic moat" is a company's ability to maintain its competitive advantages and defend its long-term profits from competitors. Think of it like the moat around a castle—the wider the moat, the harder it is for invaders (competitors) to attack.

Output Format: Provide a brief report in markdown. Explain each point simply and conclude with a clear verdict on the moat's strength.

JSON Data:
{jsonData}

# Economic Moat Analysis: {companyName} ({tickerSymbol})

## 1. What Gives This Company Its Edge? (Sources of the Moat)
Analyze the data for signs of a durable competitive advantage. Discuss:
- **Return on Invested Capital (ROIC):** [Value from 'key_metrics.returnOnInvestedCapital'] **and its trend over the last 5 years.** Explain this as the "gold standard" for moat analysis. A consistently high **and stable/rising** ROIC (>15%) is a strong sign of a moat. If trend data is unavailable, state that.
- **Pricing Power & Profitability:** Are the 'netProfitMargin' and 'operatingIncome' consistently high **and stable**? Explain this as a sign that the company can reliably charge more for its products without losing customers.
- **Cost Advantages:** Are the company's **'grossProfitMargin'** consistently high? This can be a sign of economies of scale or a superior process, allowing the company to produce its goods or services cheaper than rivals.
- **Qualitative Clues (from Description):** Based on the company's 'description', what themes suggest a moat? Look for mentions of a "platform," "network," "marketplace," or "mission-critical" systems that would be costly for a customer to switch from. **Summarize the theme, do not invent specific numbers.** For workforce size, reference the 'fullTimeEmployees' field if available, and note it is a single data point.

## 2. How Strong is the Castle Wall? (Moat Sustainability)
Assess how sustainable this advantage might be by looking at:
- **Reinvesting in the Defenses:** Are 'capitalExpenditure' and 'researchAndDevelopmentExpenses' significant? Explain this as the company spending money to strengthen its moat. Acknowledge that for some industries (like banking), these specific line items may not tell the whole story.
- **Financial Fortress:** Is the balance sheet strong (low 'debtToEquity')? A company with low debt is better equipped to survive tough times and fight off competitors.

## 3. The Verdict: How Wide is the Moat?
Based on all the evidence, provide a concluding assessment. Classify the moat as **"Wide," "Narrow," or "None,"** and explain what this means for a long-term investor.
- **Wide Moat:** The company has strong, sustainable advantages (like consistently high ROIC and clear pricing power) that are very difficult to replicate, **leading to highly predictable long-term profits.**
- **Narrow Moat:** The company has some advantages, but they could be overcome by competitors over time, **making future profits less certain.**
- **No Moat:** The company has no clear, sustainable competitive advantage, **making it vulnerable to competition and price wars.**
`.trim();

export const DIVIDEND_SAFETY_PROMPT = `
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
A company's past behavior is a good indicator of its future commitment to the dividend. The JSON provides an array for financial statements, sorted from most recent to oldest.
- **Dividend Growth:** Analyze the trend of 'dividendsPaid' over the last several years from the 'cash_flow_statement_annual' array. Has the company consistently increased its dividend payment year-over-year? A history of dividend growth is a powerful sign of a healthy, confident business.

## 4. Does the Company Have a Safety Net? (Balance Sheet Health)
A strong company can protect its dividend even when times get tough. The JSON provides arrays for financial statements, sorted from most recent to oldest.
- **Debt Load Trend:** Analyze the trend of the 'debtToEquity' ratio from the 'key_metrics_annual' array. Is the debt load stable, increasing, or decreasing? High or rising debt can put dividend payments at risk if the company needs to prioritize paying back lenders.
- **Cash Cushion Trend:** Examine the trend in 'cashAndCashEquivalents' from the 'balance_sheet_statement_annual' array. Is the company's cash pile growing or shrinking? This acts as a buffer to protect the dividend during a downturn.

## 5. The Final Verdict: How Safe Are Your Dividend Checks?
Conclude with a clear rating and a simple, one-sentence justification.
- **"Very Safe":** The dividend has a history of growth, is easily covered by free cash flow, and the balance sheet is strong. Like a salary from a very stable job that gives you a raise every year.
- **"Safe":** The dividend is covered, but may lack a long history of growth or there might be a minor concern (like rising debt) to watch. Like a salary from a good job, but the company is taking on some new projects.
- **"At Risk":** The payout ratios are high, the dividend isn't growing, and/or the balance sheet is weak. The dividend could be cut if business slows down. Like a salary from a job that is facing financial trouble.
`.trim();

export const GROWTH_OUTLOOK_PROMPT = `
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
- **Future Estimates:** Analyze the 'analyst_estimates' data. What is the consensus forecast for revenue and EPS growth over the next 2-3 years? This provides a quantitative look at Wall Street's expectations.

## 5. Final Outlook: What is the Growth Story?
Based on all the factors above, provide a brief, synthesized outlook. Is this a consistent, long-term grower that is reasonably priced, or is its growth recent and potentially expensive? What is the primary story for a potential investor looking for growth?
`.trim();

export const RISK_ASSESSMENT_PROMPT = `
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
- **Core Profitability for Financials (Net Interest Margin):** For banks and financial services companies, is the 'netInterestMargin' from 'key_metrics' trending downwards? This is a critical indicator of core lending profitability and is highly sensitive to interest rate changes.

## 4. The Bottom Line: What Are the Biggest Worries?
Based on the data, provide a brief, 1-2 sentence summary highlighting the top 2-3 risks an investor should be most aware of.
`.trim();

export const CAPITAL_ALLOCATORS_PROMPT = `
	Act as a senior analyst at a value-investing fund, channeling the analytical rigor of investors like Warren Buffett. Your analysis must be in the style of a detailed shareholder letter and based *only* on the provided financial data for {companyName}. The provided JSON data contains multi-year arrays for key financial metrics; you MUST use these arrays to analyze trends. Avoid any information not present in the data provided.

	Your task is to critically evaluate the management team of {companyName} ({tickerSymbol}) on their skill as capital allocators. Every claim you make must be substantiated with specific metrics, figures, or trends from the data.

	Article Title: "The Capital Allocators: A Deep Dive into the Financial Stewardship of {companyName}'s Leadership"

	## 1. The CEO's Inferred Philosophy

	Instead of stating the CEO's philosophy, **deduce it directly from the numbers**. Based on where the cash has flowed over the last 5-10 years (e.g., CapEx vs. R&D vs. Acquisitions vs. Buybacks), what can you infer about their strategic priorities? **Is it a growth-at-all-costs model, a focus on maintaining a fortress balance sheet, or a commitment to shareholder returns?**

	## 2. The Track Record: A Quantitative Analysis

	Analyze their capital allocation decisions over the last 5-10 years across three key areas, using specific metrics:

	- **Reinvestment in the Business:**
		- Analyze the trend in **Return on Invested Capital (ROIC)** and **Return on Equity (ROE)** using the historical arrays provided in the `key_metrics_annual` data. Have these core profitability metrics improved, declined, or remained volatile as they've reinvested capital?
		- Compare the growth in **Capital Expenditures (CapEx)** and **R&D spending** to the corresponding growth in revenue and gross profit. **Is there a clear and profitable link between investment and growth?**

	- **Acquisitions (M&A):**
		- Analyze the historical arrays for `goodwill` (from `balance_sheet_statement_annual`) and `acquisitionsNet` (from `cash_flow_statement_annual`). Does a large increase in goodwill, following significant M&A spending, correlate with a subsequent decline or stagnation in ROIC, suggesting overpayment?

	- **Returning Capital to Shareholders:**
		- **Stock Buybacks:** Analyze the `commonStockRepurchased` array from `cash_flow_statement_annual`. Correlate the amount of repurchases each year with the stock's historical valuation (e.g., `peRatio` and `priceToBookRatio` from the corresponding year in `key_metrics_annual`). **Did they opportunistically buy back shares when the stock was cheap, or did they buy high?** Calculate the change in shares outstanding.
		- **Dividends:** Analyze the **dividend payout ratio** over time. Is the dividend well-covered by free cash flow? Is its growth steady and sustainable, or erratic?

	## 3. The Scorecard & Investment Thesis

	- **Provide a final letter grade (A through F) for the management team's overall skill as capital allocators.** Justify this grade by summarizing the strongest and weakest points from your analysis above.
	- Based *only* on this track record of capital allocation, formulate a concise investment thesis. Why should (or shouldn't) an investor trust this team to compound wealth effectively in the future?
	- **Conclude with a "Red Flags" section, highlighting any concerning trends in the data (e.g., consistently poor returns on investment, value-destructive M&A, or ill-timed buybacks).**

	When you mention a stock ticker, you MUST wrap it in a special tag like this: <stock-ticker>TICKER</stock-ticker>.
`;

// --- NEW PROMPTS (v13.2.0) ---

export const MANAGEMENT_SCORECARD_PROMPT = `
Role: You are an analyst specializing in corporate governance, in the style of a proxy advisory firm like Glass Lewis. Your goal is to conduct a **preliminary** evaluation of the management team's quality and shareholder alignment, based **strictly and exclusively** on the limited JSON data provided. **Acknowledge where the data is insufficient to make a full judgment.**

Output Format: Provide a report in markdown. Use ## for major sections, ### for sub-sections, and bullet points. Conclude with a final letter grade.

JSON Data:
{jsonData}

# Management & Governance Scorecard: {companyName} ({tickerSymbol})

## 1. Leadership Snapshot
Based on the 'company_profile' and 'executive_compensation' data, provide a factual snapshot of the key executives (CEO, CFO, etc.) including their names, titles, and total compensation for the most recent year.

## 2. Shareholder Alignment Signals
This section assesses alignment based on management's own words and actions as reflected in the data.

### ### Stated Philosophy (from Corporate Description)
- **Keyword Analysis:** Scan the 'company_profile.description' for keywords related to shareholder value (e.g., "long-term value," "ROI," "capital discipline," "dividends," "share repurchases").
- **Assessment:** **Is the language specific and strategy-focused, or is it generic corporate jargon?** Quote a brief, relevant excerpt if available.

### ### Analyst Commentary on Execution
- **Management-Specific Sentiment:** Review the 'stock_grade_news'. Find and summarize any analyst commentary that **specifically mentions management, strategy, or execution**. Ignore general market or price target commentary.
- **Example:** "Does news mention praise for a 'strong quarter execution' or concern over 'strategic missteps'?"

## 3. Potential Red Flags
Based on all available data, identify potential governance or alignment risks.
- **Executive Compensation:** Is the CEO's pay disproportionate to the company's performance (e.g., high pay despite falling net income or ROE)? Are there any unusual compensation structures evident in the data?
- **Misalignment:** Are there any contradictions between the company's stated strategy and the focus of recent analyst grades (e.g., company talks about long-term value, but analysts are focused on short-term misses)?
- **Negative Sentiment:** Is there a recurring theme of negative commentary directed at management's decisions in the news items?

## 4. Final Grade & Summary
Provide a final letter grade (A, B, C, D, F) for the management team's **perceived quality and alignment based *only* on this data**. Justify the grade by summarizing the key data points.
- **Grade:** [Your Grade]
- **Summary:** [Your justification, directly referencing findings from the sections above].
`.trim();

export const NARRATIVE_CATALYST_PROMPT = `
Role: You are a forward-looking equity analyst. Your task is to analyze the provided data for {companyName} and complete the following investment checklist. You MUST address every single item.

Output Format: First, complete the checklist. Then, write a final summary that synthesizes your findings into a coherent investment narrative.

JSON Data:
{jsonData}

# Narrative & Catalyst Checklist: {companyName} ({tickerSymbol})

## 1. The Big Picture: Secular Tailwinds
- **[ ] Megatrend Alignment:** Based on the 'company_profile.description' and 'industry', does this company have direct exposure to a long-term secular trend (e.g., AI, Electrification, Demographics)? If yes, briefly explain the link. If no, state that it's a cyclical or macro-driven business.

## 2. The Foundation: Financial Health Check
*You must answer both of the following points.*
- **[ ] Profitability & Cash Flow:** Is the company profitable (positive 'netIncome' in the most recent year) AND generating positive 'freeCashFlow'?
- **[ ] Balance Sheet Strength:** Does the company have a manageable debt load (e.g., 'debtToEquity' ratio)? State the ratio and comment on its level.

## 3. The Spark: Potential Future Catalysts
*You must evaluate all three potential catalysts.*
- **[ ] Operational Momentum:** Is 'revenue' or 'netIncome' growth **accelerating year-over-year** in the most recent 'income_statement' data?
- **[ ] Margin Expansion:** Are 'grossProfitMargin' or 'operatingMargin' in the \`key_metrics_annual\` data showing a trend of improvement?
- **[ ] Analyst Sentiment Shift:** Are recent "upgrades" in the 'stock_grade_news' data indicating that Wall Street's view is becoming more positive?

## 4. Final Summary: The Investment Narrative
*Synthesize all the points above into a final bull vs. bear summary.*
- **The Bull Case:** In one sentence, what is the main story an investor is buying into?
- **The Bear Case (Key Risk):** In one sentence, what is the single biggest data-driven risk to this narrative? (e.g., High debt, margin compression, lack of profitability).
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
The report must start with an overall summary, followed by a deeper dive into the key companies you identified. For each catalyst or event you mention, you MUST append a source placeholder like this: ` + "`[Source: X]`" + `, where X is the \`articleIndex\` from the original news data JSON.
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
- Define the major trend or "gold rush" sweeping through the {contextName} {contextType} (e.g., the build-out of AI data centers, the transition to electric vehicles).

## 2. The "Pick and Shovel" Provider
- Identify a company within the {contextName} {contextType} that doesn't make the end product but provides a critical component, technology, or service to the companies that do.

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
- Conclude with the thesis for why owning this "arms dealer" is a potentially safer and more durable way to invest in the theme, **after considering the risks and valuation.**

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
- Introduce a large, multi-divisional company in the {contextName} {contextType} that you believe the market misunderstands and may be subject to a "conglomerate discount."

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
export const TECHNOLOGY_SECTOR_PROMPT = CAPITAL_ALLOCATORS_PROMPT;
export const HEALTH_CARE_SECTOR_PROMPT = CAPITAL_ALLOCATORS_PROMPT;
export const FINANCIALS_SECTOR_PROMPT = CAPITAL_ALLOCATORS_PROMPT;
export const CONSUMER_DISCRETIONARY_SECTOR_PROMPT = CAPITAL_ALLOCATORS_PROMPT;
export const COMMUNICATION_SERVICES_SECTOR_PROMPT = CAPITAL_ALLOCATORS_PROMPT;
export const INDUSTRIALS_SECTOR_PROMPT = CAPITAL_ALLOCATORS_PROMPT;
export const CONSUMER_STAPLES_SECTOR_PROMPT = CAPITAL_ALLOCATORS_PROMPT;
export const ENERGY_SECTOR_PROMPT = CAPITAL_ALLOCATORS_PROMPT;
export const UTILITIES_SECTOR_PROMPT = CAPITAL_ALLOCATORS_PROMPT;
export const REAL_ESTATE_SECTOR_PROMPT = CAPITAL_ALLOCATORS_PROMPT;
export const MATERIALS_SECTOR_PROMPT = CAPITAL_ALLOCATORS_PROMPT;


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
