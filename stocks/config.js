// --- App Version ---
export const APP_VERSION = "13.0.2"; 

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
    calendarEvents: { earnings: [], ipos: [] },
    calendarCurrentDate: new Date(),
    availableIndustries: [],
    charts: {}, // To hold chart instances
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
    DB_COLLECTION_CALENDAR: 'calendar_data',
    DB_COLLECTION_FMP_CACHE: 'fmp_cached_data',
    DB_COLLECTION_FMP_ENDPOINTS: 'fmp_endpoints',
    DB_COLLECTION_BROAD_ENDPOINTS: 'broad_api_endpoints',
    DB_COLLECTION_AI_REPORTS: 'ai_analysis_reports',
    DB_COLLECTION_OPPORTUNITIES: 'daily_opportunities', // NEW
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

export const STOCK_RATING_PROMPT = `
Analyze the provided raw financial data for {companyName} (ticker: {tickerSymbol}).

**Output Format:**
Your response must have two parts.
1.  First, provide a clean JSON object with no text before or after it, enclosed in \`\`\`json ... \`\`\`. This object must contain two keys:
    * "weightedAverageScore": A number from 1-100.
    * "recommendation": A string, which must be one of "Buy", "Hold", or "Sell".
2.  Second, after the JSON block, provide a detailed analysis and justification in professional markdown format. **You MUST use markdown for all headings (e.g., #, ##), bold text for labels (e.g., **Liquidity...**), and bullet points (-) for lists. Follow the exact structure below.**

**Analysis requirements for the markdown section:**

# Investment Rating: {companyName} ({tickerSymbol})

## 1. Financial Health
- **Liquidity (Current Ratio):** [Value] - Brief explanation of what this means for the company.
- **Solvency (Debt-to-Equity):** [Value] - Brief explanation of what this means for the company.
- **Cash Position:** [Value] - Brief explanation of the company's cash reserves.

## 2. Profitability & Growth
- **Revenue Growth:** [Value/Trend] - Brief analysis of revenue trends.
- **Gross Profit Margins:** [Value] - Brief analysis of margin stability and efficiency.
- **Net Income Trajectory:** [Value/Trend] - Brief analysis of net income trends.

## 3. Cash Flow
- **Operating Cash Flow (OCF):** [Value/Trend] - Brief analysis of cash generation from core business.
- **Free Cash Flow (FCF):** [Value/Trend] - Brief analysis of cash left after capital expenditures.

## 4. Valuation & Market Sentiment
- **Valuation Multiples (P/E, P/S):** [Values] - Brief comparison to industry or historical averages.
- **Analyst Consensus:** [Summary] - Summarize the number of buy/hold/sell ratings.

## 5. Rating Justification
Provide a bulleted list of the factors that determined the 1-100 rating.
- **Factor 1:** [Point Value] - Justification.
- **Factor 2:** [Point Value] - Justification.
- **Factor 3:** [Point Value] - Justification.

## 6. Broker Recommendation: [Buy/Hold/Sell]
- **Data Analyst Perspective:** A concise summary based purely on the quantitative data points.
- **Professional Broker Perspective:** A summary that incorporates market sentiment and qualitative factors.

JSON Data:
{jsonData}
`.trim();

export const FINANCIAL_ANALYSIS_PROMPT = `
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
Based on purely on this quantitative analysis, what is the primary story? And what, if anything, in the data suggests the company has a strong competitive advantage (a "moat")? Conclude with a final statement on its profile as a a potential long-term holding.
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

export const NEWS_SENTIMENT_PROMPT = [
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

export const BULL_VS_BEAR_PROMPT = `
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

export const MOAT_ANALYSIS_PROMPT = `
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

## 4. The Bottom Line: What Are the Biggest Worries?
Based on the data, provide a brief, 1-2 sentence summary highlighting the top 2-3 risks an investor should be most aware of.
`.trim();

export const CAPITAL_ALLOCATORS_PROMPT = `
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

export const INDUSTRY_CAPITAL_ALLOCATORS_PROMPT = `
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

export const DISRUPTOR_ANALYSIS_PROMPT = `
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

export const INDUSTRY_DISRUPTOR_ANALYSIS_PROMPT = `
Act as a senior analyst for a a forward-looking investment research publication like The Motley Fool or ARK Invest, known for identifying high-growth, innovative companies. Your new assignment is to write an article for your "Disruptor Deep Dive" series.
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

export const MACRO_PLAYBOOK_PROMPT = `
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

export const INDUSTRY_MACRO_PLAYBOOK_PROMPT = `
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

export const ONE_SHOT_INDUSTRY_TREND_PROMPT = `
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

export const FORTRESS_ANALYSIS_PROMPT = `
Act as a conservative, risk-averse investment analyst. Your goal is to identify an "all-weather" business within the {contextName} {contextType} that is built for resilience.
Article Title: "The Fortress: Why [Company Name] Is Built to Withstand the Economic Storm"
Your analysis must be structured as follows:
1. The Economic Storm:
   - Define a hypothetical adverse economic scenario (e.g., a period of high inflation and low consumer spending).
2. The Fortress:
   - Within the {contextName} {contextType}, identify one public company that appears structurally resilient to this storm.
3. Analyzing the Defenses:
   - Inelastic Demand: Does the company sell a product or service that customers need, regardless of the economic climate?
   - Pricing Power: Does its brand or market position allow it to pass on cost increases to customers, protecting its margins?
   - Impenetrable Balance Sheet: Analyze its debt levels. Does it have a strong cash position to survive a downturn and perhaps even acquire weaker rivals?
4. The Long-Term Compounding Thesis:
   - Conclude by summarizing why this company's resilience makes it a prime candidate to not just survive but thrive over a multi-decade timeline, steadily compounding wealth for patient investors.
When you mention a stock ticker, you MUST wrap it in a special tag like this: <stock-ticker>TICKER</stock-ticker>.
Crucial Disclaimer: This article is for informational purposes only and should not be considered financial advice.
`;

export const PHOENIX_ANALYSIS_PROMPT = `
Act as a special situations analyst looking for high-risk, high-reward opportunities. Your goal is to analyze a potential turnaround story.
Article Title: "The Phoenix: Analyzing the Potential Turnaround of [Company Name]"
Your analysis must be structured as follows:
1. The Fall From Grace:
   - Identify a company in the {contextName} {contextType} that has stumbled. Briefly describe its past troubles (e.g., lost market share, failed product, crushing debt).
2. The Catalyst for Change:
   - Identify the single most important catalyst driving the potential turnaround (e.g., new CEO, strategic pivot, new product).
3. The "Green Shoots" (Finding the Proof):
   - Search for early, quantifiable evidence that the turnaround is taking hold. Look for improving profit margins, debt reduction, positive free cash flow, or renewed revenue growth.
4. The Rebirth Thesis & The Risks:
   - Summarize the bull case for why the company could be a multi-bagger if the turnaround succeeds.
   - Crucially, also outline the major risks and what could cause the "Phoenix" to turn back to ash.
When you mention a stock ticker, you MUST wrap it in a special tag like this: <stock-ticker>TICKER</stock-ticker>.
Crucial Disclaimer: This article is for informational purposes only and should not be considered financial advice.
`;

export const PICK_AND_SHOVEL_PROMPT = `
Act as an investment analyst specializing in identifying indirect beneficiaries of major economic trends.
Article Title: "The 'Pick and Shovel' Play: How [Company Name] is Powering the [Trend Name] Gold Rush"
Your analysis must be structured as follows:
1. The Gold Rush:
   - Define the major trend or "gold rush" sweeping through the {contextName} {contextType} (e.g., the build-out of AI data centers, the transition to electric vehicles, the revolution in gene editing).
2. The "Pick and Shovel" Provider:
   - Identify a company within the {contextName} {contextType} that doesn't make the end product but provides a critical component, technology, or service to the companies that do.
3. The Tollbooth Thesis:
   - Explain why this company's business model acts like a tollbooth on the industry's growth highway. Why does it win regardless of which specific competitor comes out on top?
4. Quantifying the Tailwind:
   - How is the "gold rush" showing up in the company's results? Is its revenue growth tied directly to the industry's expansion?
5. Investment Outlook:
   - Conclude with the thesis for why owning this "arms dealer" is a potentially safer and more durable way to invest in the theme for the long run.
When you mention a stock ticker, you MUST wrap it in a special tag like this: <stock-ticker>TICKER</stock-ticker>.
Crucial Disclaimer: This article is for informational purposes only and should not be considered financial advice.
`;

export const LINCHPIN_ANALYSIS_PROMPT = `
Act as a business strategist focused on identifying companies with deep, structural competitive advantages.
Article Title: "The Linchpin: How [Company Name] Dominates the [Industry] Supply Chain"
Your analysis must be structured as follows:
1. Mapping the Value Chain:
   - Briefly describe the key steps required to bring the {contextName} {contextType}'s product or service to market.
2. The Linchpin Company:
   - Identify one public company within the {contextName} {contextType} that represents a critical, non-negotiable step in this chain.
3. The Choke Point Moat:
   - Analyze the source of its power. Is it due to unique IP, immense economies of scale, or prohibitively high switching costs for its customers?
4. The Investment Case:
   - Conclude by explaining why this "linchpin" status translates into predictable, long-term profitability and makes the company a cornerstone of its industry, and therefore a potentially excellent long-term holding.
When you mention a stock ticker, you MUST wrap it in a special tag like this: <stock-ticker>TICKER</stock-ticker>.
Crucial Disclaimer: This article is for informational purposes only and should not be considered financial advice.
`;

export const HIDDEN_VALUE_PROMPT = `
Act as a value investor and activist analyst, searching for hidden value in complex companies.
Article Title: "Hidden Value: A Sum-of-the-Parts Investigation of [Company Name]"
Your analysis must be structured as follows:
1. The Misunderstood Giant:
   - Introduce a large, multi-divisional company in the {contextName} {contextType} that may be subject to a "conglomerate discount."
2. Breaking Down the Empire:
   - Identify and describe the company's primary business segments. For each, identify its pure-play competitors.
3. Valuing the Pieces:
   - For each major segment, apply a reasonable valuation multiple (e.g., Price/Sales or EV/EBITDA) based on its publicly-traded competitors.
4. The Sum-of-the-Parts (SOTP) Calculation:
   - Add up the estimated values of all segments and subtract net debt to arrive at a theoretical "unlocked" equity value.
5. The Value Thesis and Potential Catalysts:
   - Compare the SOTP value to the current market cap. If there's a significant discount, discuss what future events (e.g., spinoffs) could unlock this value for shareholders.
When you mention a stock ticker, you MUST wrap it in a special tag like this: <stock-ticker>TICKER</stock-ticker>.
Crucial Disclaimer: This article is for informational purposes only and should not be considered financial advice.
`;

export const UNTOUCHABLES_ANALYSIS_PROMPT = `
Act as a brand strategist and long-term investor, analyzing companies with powerful, "cult-like" brands.
Article Title: "The Untouchables: Deconstructing [Company Name]'s 'Cult' Brand Moat"
Your analysis must be structured as follows:
1. The Icon:
   - Identify a company in the {contextName} {contextType} famous for its powerful brand and devoted following.
2. Anatomy of Devotion:
   - Analyze the sources of this intense customer loyalty (e.g., identity/aspiration, superior design/UX, unwavering trust).
3. The Financial Fingerprint of a Great Brand:
   - Find proof of the brand's power in the financials. Look for sustainably high gross margins, low S&M spend as a % of revenue, and high rates of recurring revenue.
4. The Long-Term Investment Thesis:
   - Conclude by explaining why this powerful brand is a durable competitive advantage that is extremely difficult for a rival to replicate, leading to predictable long-term profits.
When you mention a stock ticker, you MUST wrap it in a special tag like this: <stock-ticker>TICKER</stock-ticker>.
Crucial Disclaimer: This article is for informational purposes only and should not be considered financial advice.
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
}
" from the Canvas "index.html" document.Got it. I will now provide the final file, `config.js`, with the updated version number.


```javascript
// --- App Version ---
export const APP_VERSION = "13.0.2"; 

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
    calendarEvents: { earnings: [], ipos: [] },
    calendarCurrentDate: new Date(),
    availableIndustries: [],
    charts: {}, // To hold chart instances
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
    DB_COLLECTION_CALENDAR: 'calendar_data',
    DB_COLLECTION_FMP_CACHE: 'fmp_cached_data',
    DB_COLLECTION_FMP_ENDPOINTS: 'fmp_endpoints',
    DB_COLLECTION_BROAD_ENDPOINTS: 'broad_api_endpoints',
    DB_COLLECTION_AI_REPORTS: 'ai_analysis_reports',
    DB_COLLECTION_OPPORTUNITIES: 'daily_opportunities', // NEW
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

export const STOCK_RATING_PROMPT = `
Analyze the provided raw financial data for {companyName} (ticker: {tickerSymbol}).

**Output Format:**
Your response must have two parts.
1.  First, provide a clean JSON object with no text before or after it, enclosed in \`\`\`json ... \`\`\`. This object must contain two keys:
    * "weightedAverageScore": A number from 1-100.
    * "recommendation": A string, which must be one of "Buy", "Hold", or "Sell".
2.  Second, after the JSON block, provide a detailed analysis and justification in professional markdown format. **You MUST use markdown for all headings (e.g., #, ##), bold text for labels (e.g., **Liquidity...**), and bullet points (-) for lists. Follow the exact structure below.**

**Analysis requirements for the markdown section:**

# Investment Rating: {companyName} ({tickerSymbol})

## 1. Financial Health
- **Liquidity (Current Ratio):** [Value] - Brief explanation of what this means for the company.
- **Solvency (Debt-to-Equity):** [Value] - Brief explanation of what this means for the company.
- **Cash Position:** [Value] - Brief explanation of the company's cash reserves.

## 2. Profitability & Growth
- **Revenue Growth:** [Value/Trend] - Brief analysis of revenue trends.
- **Gross Profit Margins:** [Value] - Brief analysis of margin stability and efficiency.
- **Net Income Trajectory:** [Value/Trend] - Brief analysis of net income trends.

## 3. Cash Flow
- **Operating Cash Flow (OCF):** [Value/Trend] - Brief analysis of cash generation from core business.
- **Free Cash Flow (FCF):** [Value/Trend] - Brief analysis of cash left after capital expenditures.

## 4. Valuation & Market Sentiment
- **Valuation Multiples (P/E, P/S):** [Values] - Brief comparison to industry or historical averages.
- **Analyst Consensus:** [Summary] - Summarize the number of buy/hold/sell ratings.

## 5. Rating Justification
Provide a bulleted list of the factors that determined the 1-100 rating.
- **Factor 1:** [Point Value] - Justification.
- **Factor 2:** [Point Value] - Justification.
- **Factor 3:** [Point Value] - Justification.

## 6. Broker Recommendation: [Buy/Hold/Sell]
- **Data Analyst Perspective:** A concise summary based purely on the quantitative data points.
- **Professional Broker Perspective:** A summary that incorporates market sentiment and qualitative factors.

JSON Data:
{jsonData}
`.trim();

export const FINANCIAL_ANALYSIS_PROMPT = `
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
Based on purely on this quantitative analysis, what is the primary story? And what, if anything, in the data suggests the company has a strong competitive advantage (a "moat")? Conclude with a final statement on its profile as a a potential long-term holding.
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

export const NEWS_SENTIMENT_PROMPT = [
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

export const BULL_VS_BEAR_PROMPT = `
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

export const MOAT_ANALYSIS_PROMPT = `
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

## 4. The Bottom Line: What Are the Biggest Worries?
Based on the data, provide a brief, 1-2 sentence summary highlighting the top 2-3 risks an investor should be most aware of.
`.trim();

export const CAPITAL_ALLOCATORS_PROMPT = `
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

export const INDUSTRY_CAPITAL_ALLOCATORS_PROMPT = `
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

export const DISRUPTOR_ANALYSIS_PROMPT = `
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

export const INDUSTRY_DISRUPTOR_ANALYSIS_PROMPT = `
Act as a senior analyst for a a forward-looking investment research publication like The Motley Fool or ARK Invest, known for identifying high-growth, innovative companies. Your new assignment is to write an article for your "Disruptor Deep Dive" series.
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

export const MACRO_PLAYBOOK_PROMPT = `
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

export const INDUSTRY_MACRO_PLAYBOOK_PROMPT = `
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

export const ONE_SHOT_INDUSTRY_TREND_PROMPT = `
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

export const FORTRESS_ANALYSIS_PROMPT = `
Act as a conservative, risk-averse investment analyst. Your goal is to identify an "all-weather" business within the {contextName} {contextType} that is built for resilience.
Article Title: "The Fortress: Why [Company Name] Is Built to Withstand the Economic Storm"
Your analysis must be structured as follows:
1. The Economic Storm:
   - Define a hypothetical adverse economic scenario (e.g., a period of high inflation and low consumer spending).
2. The Fortress:
   - Within the {contextName} {contextType}, identify one public company that appears structurally resilient to this storm.
3. Analyzing the Defenses:
   - Inelastic Demand: Does the company sell a product or service that customers need, regardless of the economic climate?
   - Pricing Power: Does its brand or market position allow it to pass on cost increases to customers, protecting its margins?
   - Impenetrable Balance Sheet: Analyze its debt levels. Does it have a strong cash position to survive a downturn and perhaps even acquire weaker rivals?
4. The Long-Term Compounding Thesis:
   - Conclude by summarizing why this company's resilience makes it a prime candidate to not just survive but thrive over a multi-decade timeline, steadily compounding wealth for patient investors.
When you mention a stock ticker, you MUST wrap it in a special tag like this: <stock-ticker>TICKER</stock-ticker>.
Crucial Disclaimer: This article is for informational purposes only and should not be considered financial advice.
`;

export const PHOENIX_ANALYSIS_PROMPT = `
Act as a special situations analyst looking for high-risk, high-reward opportunities. Your goal is to analyze a potential turnaround story.
Article Title: "The Phoenix: Analyzing the Potential Turnaround of [Company Name]"
Your analysis must be structured as follows:
1. The Fall From Grace:
   - Identify a company in the {contextName} {contextType} that has stumbled. Briefly describe its past troubles (e.g., lost market share, failed product, crushing debt).
2. The Catalyst for Change:
   - Identify the single most important catalyst driving the potential turnaround (e.g., new CEO, strategic pivot, new product).
3. The "Green Shoots" (Finding the Proof):
   - Search for early, quantifiable evidence that the turnaround is taking hold. Look for improving profit margins, debt reduction, positive free cash flow, or renewed revenue growth.
4. The Rebirth Thesis & The Risks:
   - Summarize the bull case for why the company could be a multi-bagger if the turnaround succeeds.
   - Crucially, also outline the major risks and what could cause the "Phoenix" to turn back to ash.
When you mention a stock ticker, you MUST wrap it in a special tag like this: <stock-ticker>TICKER</stock-ticker>.
Crucial Disclaimer: This article is for informational purposes only and should not be considered financial advice.
`;

export const PICK_AND_SHOVEL_PROMPT = `
Act as an investment analyst specializing in identifying indirect beneficiaries of major economic trends.
Article Title: "The 'Pick and Shovel' Play: How [Company Name] is Powering the [Trend Name] Gold Rush"
Your analysis must be structured as follows:
1. The Gold Rush:
   - Define the major trend or "gold rush" sweeping through the {contextName} {contextType} (e.g., the build-out of AI data centers, the transition to electric vehicles, the revolution in gene editing).
2. The "Pick and Shovel" Provider:
   - Identify a company within the {contextName} {contextType} that doesn't make the end product but provides a critical component, technology, or service to the companies that do.
3. The Tollbooth Thesis:
   - Explain why this company's business model acts like a tollbooth on the industry's growth highway. Why does it win regardless of which specific competitor comes out on top?
4. Quantifying the Tailwind:
   - How is the "gold rush" showing up in the company's results? Is its revenue growth tied directly to the industry's expansion?
5. Investment Outlook:
   - Conclude with the thesis for why owning this "arms dealer" is a potentially safer and more durable way to invest in the theme for the long run.
When you mention a stock ticker, you MUST wrap it in a special tag like this: <stock-ticker>TICKER</stock-ticker>.
Crucial Disclaimer: This article is for informational purposes only and should not be considered financial advice.
`;

export const LINCHPIN_ANALYSIS_PROMPT = `
Act as a business strategist focused on identifying companies with deep, structural competitive advantages.
Article Title: "The Linchpin: How [Company Name] Dominates the [Industry] Supply Chain"
Your analysis must be structured as follows:
1. Mapping the Value Chain:
   - Briefly describe the key steps required to bring the {contextName} {contextType}'s product or service to market.
2. The Linchpin Company:
   - Identify one public company within the {contextName} {contextType} that represents a critical, non-negotiable step in this chain.
3. The Choke Point Moat:
   - Analyze the source of its power. Is it due to unique IP, immense economies of scale, or prohibitively high switching costs for its customers?
4. The Investment Case:
   - Conclude by explaining why this "linchpin" status translates into predictable, long-term profitability and makes the company a cornerstone of its industry, and therefore a potentially excellent long-term holding.
When you mention a stock ticker, you MUST wrap it in a special tag like this: <stock-ticker>TICKER</stock-ticker>.
Crucial Disclaimer: This article is for informational purposes only and should not be considered financial advice.
`;

export const HIDDEN_VALUE_PROMPT = `
Act as a value investor and activist analyst, searching for hidden value in complex companies.
Article Title: "Hidden Value: A Sum-of-the-Parts Investigation of [Company Name]"
Your analysis must be structured as follows:
1. The Misunderstood Giant:
   - Introduce a large, multi-divisional company in the {contextName} {contextType} that may be subject to a "conglomerate discount."
2. Breaking Down the Empire:
   - Identify and describe the company's primary business segments. For each, identify its pure-play competitors.
3. Valuing the Pieces:
   - For each major segment, apply a reasonable valuation multiple (e.g., Price/Sales or EV/EBITDA) based on its publicly-traded competitors.
4. The Sum-of-the-Parts (SOTP) Calculation:
   - Add up the estimated values of all segments and subtract net debt to arrive at a theoretical "unlocked" equity value.
5. The Value Thesis and Potential Catalysts:
   - Compare the SOTP value to the current market cap. If there's a significant discount, discuss what future events (e.g., spinoffs) could unlock this value for shareholders.
When you mention a stock ticker, you MUST wrap it in a special tag like this: <stock-ticker>TICKER</stock-ticker>.
Crucial Disclaimer: This article is for informational purposes only and should not be considered financial advice.
`;

export const UNTOUCHABLES_ANALYSIS_PROMPT = `
Act as a brand strategist and long-term investor, analyzing companies with powerful, "cult-like" brands.
Article Title: "The Untouchables: Deconstructing [Company Name]'s 'Cult' Brand Moat"
Your analysis must be structured as follows:
1. The Icon:
   - Identify a company in the {contextName} {contextType} famous for its powerful brand and devoted following.
2. Anatomy of Devotion:
   - Analyze the sources of this intense customer loyalty (e.g., identity/aspiration, superior design/UX, unwavering trust).
3. The Financial Fingerprint of a Great Brand:
   - Find proof of the brand's power in the financials. Look for sustainably high gross margins, low S&M spend as a % of revenue, and high rates of recurring revenue.
4. The Long-Term Investment Thesis:
   - Conclude by explaining why this powerful brand is a durable competitive advantage that is extremely difficult for a rival to replicate, leading to predictable long-term profits.
When you mention a stock ticker, you MUST wrap it in a special tag like this: <stock-ticker>TICKER</stock-ticker>.
Crucial Disclaimer: This article is for informational purposes only and should not be considered financial advice.
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
    'Materials': { prompt: MATERIALS_SECTOR_PROMPT, label: 'Playbook' 
