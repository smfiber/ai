// --- App Version ---
export const APP_VERSION = "14.17.0";

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

// Map specific AI analysis types to the FMP endpoints they require.
export const ANALYSIS_REQUIREMENTS = {
    'ManagementScorecard': ['executive_compensation']
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
    DB_COLLECTION_MANUAL_FILINGS: 'manual_filings',
    // v13.1.0: New collection for sector/industry reports
    DB_COLLECTION_BROAD_REPORTS: 'ai_broad_reports',
    // v13.8.0: New collection for screener tile interactions
    DB_COLLECTION_SCREENER_INTERACTIONS: 'screener_interactions',
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

export const GEMINI_COMPETITOR_PROMPT = `
Role: You are a market intelligence analyst AI.
Task: Identify the top 10 publicly traded, direct competitors for the company {companyName} ({tickerSymbol}).
- Focus on companies that compete directly in the same primary business segments.
- Exclude companies that are only minor or indirect competitors.
- Exclude private companies.

Output Format: You MUST return ONLY a valid JSON array of objects. Each object must contain "companyName" and "ticker" keys. Do not include any text, explanation, or markdown formatting before or after the JSON array.

Example:
[
  {"companyName": "Microsoft Corporation", "ticker": "MSFT"},
  {"companyName": "Alphabet Inc.", "ticker": "GOOGL"},
  {"companyName": "Samsung Electronics Co., Ltd.", "ticker": "SSNLF"}
]
`;

const COMPETITIVE_LANDSCAPE_PROMPT = `
Role: You are a sharp, insightful financial analyst. Your task is to provide a clear, data-driven comparison of {companyName} against its key competitors. Your goal is to determine if the company is a leader, a laggard, or just part of the pack.

Data Instructions: Your analysis MUST be based *exclusively* on the provided JSON data, which includes the target company's metrics, a list of its peers' metrics, and the calculated peer average for each metric.

Output Format: The final report must be in professional markdown format. Use # for the main title, ## for major sections, and bullet points for key data points.

JSON Data with Pre-Calculated Metrics:
{jsonData}

# Competitive Landscape: {companyName} vs. The Field

## 1. Executive Summary: The Verdict in 30 Seconds
Based on the data, write a 2-3 sentence summary that directly answers: Is {companyName} quantitatively superior, inferior, or in-line with its competitors? Highlight the one or two most significant areas of strength or weakness.

## 2. Valuation: Is the Stock Cheap or Expensive?
Compare the target company's valuation metrics against the peer average.
- **P/E Ratio:** Is it trading at a premium (higher P/E) or discount (lower P/E) to its peers? What does this suggest about market expectations?
- **P/S Ratio:** How does its Price-to-Sales ratio compare? Is the market valuing its revenues more or less than competitors?

## 3. Profitability: Who is the Most Efficient Operator?
Analyze the company's ability to turn revenue into profit compared to the peer group.
- **Return on Equity (ROE):** Does the company generate a higher or lower return for its shareholders than its rivals?
- **Net Profit Margin:** Is the company more or less profitable on each dollar of sales compared to the average?

## 4. Financial Health: Who Has the Strongest Foundation?
Assess the company's balance sheet strength relative to its peers.
- **Debt-to-Equity:** Does the company use more or less debt than its competitors? What are the implications of this (e.g., higher risk vs. more flexibility)?

## 5. Final Takeaway: Investment Profile
Synthesize all the points above to classify {companyName}'s competitive position. Choose ONE of the following profiles and briefly justify your choice based on the data.
- **Best-in-Breed Leader:** The company demonstrates clear superiority across most key metrics (e.g., higher profitability, stronger balance sheet), justifying a premium valuation.
- **Undervalued Contender:** The company shows comparable or even superior profitability/health but trades at a valuation discount to its peers, suggesting a potential opportunity.
- **Middle of the Pack:** The company's metrics are largely in-line with the peer group, suggesting it is a solid but not exceptional player in its industry.
- **Turnaround Play / Laggard:** The company significantly underperforms its peers on key metrics, suggesting it may be a higher-risk investment that needs to prove it can catch up.
`;

const STOCK_DISRUPTOR_PROMPT = `
Role: You are an analyst for a forward-looking investment publication, analyzing if a specific company fits the "disruptor" profile.

Task: Evaluate if {companyName} ({tickerSymbol}) is a true disruptor based *only* on the provided data.

Output Format: A concise markdown report.

JSON Data:
{jsonData}

# Disruptor Analysis: Is {companyName} a Market Shaker?

## 1. The Disruptor's Edge
Based on the company 'description', what is its unique advantage? Is it a **Technological Moat**, an innovative **Business Model**, or a powerful **Network Effect**?

## 2. The Proof in the Numbers
Does the quantitative data support the "disruptor" thesis?
- **Growth:** Analyze the 'revenueGrowth' and 'netIncomeGrowth' trends. Are they consistently high and/or accelerating, as expected from a disruptor?
- **Reinvestment:** Look at 'rdToRevenue' and 'capexToRevenue'. Is the company aggressively reinvesting capital to fuel innovation and solidify its lead?

## 3. The Price of Innovation
- **Valuation:** Review the 'peRatio' and 'psRatio'. Is the company trading at high multiples? Acknowledge if the market is already pricing in significant future growth.

## 4. Verdict: Is It a True Disruptor?
Based on the synthesis of the narrative and the numbers, provide a final verdict. Classify the company as one of the following and briefly justify your choice.
- **Confirmed Disruptor:** High growth, aggressive reinvestment, and a clear competitive edge are evident.
- **Potential Disruptor:** Shows some signs, but the data is not yet conclusive (e.g., growth is lumpy, reinvestment is low).
- **Legacy Player:** The company does not fit the high-growth, innovative profile of a disruptor.
`;

const STOCK_FORTRESS_PROMPT = `
Role: You are a conservative, risk-averse investment analyst evaluating if a company is a resilient "all-weather" business.

Task: Evaluate if {companyName} ({tickerSymbol}) fits the "Fortress" profile based *only* on the provided data.

Output Format: A concise markdown report.

JSON Data:
{jsonData}

# Fortress Analysis: Is {companyName} Built to Last?

## 1. Pillar 1: Pricing Power
- A true fortress can pass costs to customers. Is there evidence of this in the 'grossMarginTrend' and 'netMarginTrend'? Are margins consistently high and stable/expanding?

## 2. Pillar 2: Impenetrable Balance Sheet
- Analyze its financial health. Is the 'debtToEquity' ratio low and stable/decreasing? Is the 'currentRatio' strong?

## 3. Pillar 3: Superior Profitability
- A fortress is a superior money-maker. Is the 'roeTrend' consistently high (>15%) and stable?

## 4. The Price of Safety
- Review the 'peRatio' and 'pbRatio'. Is the stock trading at a premium valuation that reflects its quality, or does it offer a reasonable margin of safety?

## 5. Verdict: Is It a True Fortress?
Based on the data, provide a final verdict. Classify the company as one of the following and briefly justify your choice.
- **Confirmed Fortress:** Demonstrates high margins, a rock-solid balance sheet, and superior profitability.
- **Solid Contender:** Strong in some areas but shows minor weaknesses in others (e.g., moderate debt, slightly inconsistent margins).
- **Not a Fortress:** Lacks the consistent profitability and balance sheet strength required.
`;

const STOCK_PHOENIX_PROMPT = `
Role: You are a special situations analyst looking for high-risk, high-reward turnaround stories.

Task: Evaluate if {companyName} ({tickerSymbol}) shows signs of a "Phoenix" (a fundamental business turnaround) based *only* on the provided data.

Output Format: A concise markdown report.

JSON Data:
{jsonData}

# Phoenix Analysis: Is {companyName} Rising from the Ashes?

## 1. The Fall (Historical Context)
- Briefly check the long-term 'revenueTrend' and 'netIncomeTrend'. Does the data show a period of significant decline or stagnation in the past that would necessitate a turnaround?

## 2. Early "Green Shoots" of a Turnaround
This is the most critical section. Look for recent, quantifiable evidence of improvement.
- **Renewed Growth:** Is the most recent 'revenueYoyGrowth' positive and accelerating compared to previous years?
- **Margin Improvement:** Are the 'netProfitMargin' and 'operatingMargin' in the 'profitabilityTrend' showing a clear positive inflection in the most recent year(s)?
- **Financial Triage:** Is the 'debtToEquity' ratio improving (decreasing)?

## 3. The Valuation Opportunity
- Does the 'peRatio' or 'psRatio' still appear low relative to historical levels or the company's newfound growth, suggesting the market hasn't fully bought into the turnaround story yet?

## 4. Verdict: Is It a Potential Phoenix?
Based on the evidence of a business inflection, provide a final verdict.
- **Credible Phoenix:** There is clear, multi-faceted data (improving growth, margins, AND balance sheet) suggesting a turnaround is underway.
- **Early Smoke Signal:** There are tentative signs in one or two areas, but the turnaround is not yet confirmed across the business.
- **Still in the Ashes:** There is no clear quantitative evidence of a fundamental business improvement.
`;

const STOCK_LINCHPIN_PROMPT = `
Role: You are a business strategist analyzing a company's structural competitive advantages.

Task: Evaluate if {companyName} ({tickerSymbol}) acts as a "Linchpin" (a company controlling a vital choke point in its industry) based *only* on the provided data.

Output Format: A concise markdown report.

JSON Data:
{jsonData}

# Linchpin Analysis: Does {companyName} Control a Choke Point?

## 1. The Choke Point Moat (Proof in the Numbers)
A true linchpin should have financials that are superior to typical companies.
- **Superior Profitability:** Are the 'grossProfitMargin' and 'netProfitMargin' trends from the 'profitabilityTrends' object consistently high and stable? This signals pricing power.
- **Exceptional Returns on Capital:** Is the 'roicTrend' consistently high (e.g., >20%)? This indicates a powerful, hard-to-replicate business model.

## 2. Qualitative Clues
- Based on the company 'description', does it mention controlling a "platform," "standard," "ecosystem," or providing a "mission-critical" component that other businesses in its industry depend on?

## 3. The Price of Power
- Is the company's strategic importance reflected in a premium valuation? Briefly comment on its 'peRatio' and 'psRatio'.

## 4. Verdict: Is It a Linchpin?
Based on the synthesis of its financial superiority and qualitative description, provide a final verdict.
- **Confirmed Linchpin:** The company exhibits both exceptional, sustained profitability/ROIC and has a clear strategic role described in its profile.
- **Potential Linchpin:** The company has strong financials but its strategic choke point is not immediately obvious from the description.
- **Supplier, Not a Linchpin:** The company is part of the value chain but lacks the extraordinary financial metrics that would indicate a true choke point.
`;

const STOCK_UNTOUCHABLES_PROMPT = `
Role: You are a brand strategist analyzing companies with powerful, "cult-like" brands.

Task: Evaluate if {companyName} ({tickerSymbol}) fits "The Untouchables" profile (a company with a fanatical customer base that translates into durable profits) based *only* on the provided data.

Output Format: A concise markdown report.

JSON Data:
{jsonData}

# The Untouchables: Deconstructing {companyName}'s Brand Moat

## 1. The Financial Fingerprints of a Great Brand
A powerful brand should be visible in the financial statements.
- **Pricing Power:** Is the 'grossMargin' in the 'profitabilityMetrics' object consistently high? This is the clearest sign that customers are willing to pay more for the brand.
- **Marketing Efficiency:** Is the 'rdToRevenue' ratio high while the 'sgnaToRevenue' ratio is stable or declining? This can suggest the brand's reputation does the heavy lifting, allowing for efficient marketing spend focused on innovation.

## 2. Qualitative Clues
- Does the company 'description' mention themes like "community," "loyalty," "design," "experience," or a strong "mission"? These often point to a powerful brand identity.

## 3. The Price of Perfection
- Powerful brands are rarely cheap. Briefly comment on the company's valuation ('peRatio', 'psRatio'). Does the market already award the stock a significant premium for its brand strength?

## 4. Verdict: Is It an Untouchable?
Based on the financial evidence and qualitative clues, provide a final verdict.
- **Confirmed Untouchable:** The company shows clear evidence of pricing power (high gross margins) and its description aligns with a strong brand ethos.
- **Strong Brand, Unconfirmed Moat:** The company has qualitative signs of a strong brand, but the financial proof (e.g., high margins) is not yet consistently demonstrated.
- **Product, Not a Brand:** The company competes primarily on product features or price, not on brand loyalty.
`;

const FINANCIAL_ANALYSIS_PROMPT = `
Role: You are a financial analyst AI who excels at explaining complex topics to everyday investors. Your purpose is to generate a rigorous, data-driven financial analysis that is also educational, objective, and easy to understand. Use relatable analogies to clarify financial concepts.

Data Instructions: Your analysis MUST be based *exclusively* on the pre-calculated metrics and summaries provided in the JSON data below. Do NOT attempt to recalculate any values. If a specific data point is "N/A" or missing, state that clearly in your analysis.

Output Format: The final report must be in professional markdown format. Use # for the main title, ## for major sections, ### for sub-sections, and bullet points for key data points.

IMPORTANT: Do not include any HTML tags in your output. Generate pure markdown only.

Based on the provided data for {companyName} (Ticker: {tickerSymbol}), generate a multi-faceted financial report. Follow the structure below, replacing all instructions with your analysis derived from the JSON data.

JSON Data with Pre-Calculated Metrics:
{jsonData}

# Comprehensive Financial Analysis: {companyName} ({tickerSymbol})

## 1. Executive Summary
Write a concise, one-paragraph summary synthesizing the most important takeaways about this company's financial health, performance, and overall story as a potential investment.

## 2. Company Profile & Market Context
### Business Description
In simple terms, describe the company's business using the 'description', 'sector', and 'industry' from the JSON. Avoid jargon.
### Market Snapshot
- **Market Capitalization:** State the value from \`summary.marketCap\`.
- **Latest Price:** State the value from \`summary.price\`.
- **52-Week Price Range:** State the value from \`summary.priceRange\`.
- **Analyst Consensus:** Report the analyst consensus from \`summary.analystConsensus\`.
- **Insider Ownership:** Report the insider ownership from \`summary.insiderOwnership\`, stating if it's N/A.

## 3. Annual Performance & Profitability (The Long-Term View)
### 3.1. Annual Revenue & Earnings Trend
- **Revenue Trend:** Describe the company's long-term top-line performance using the text from \`performance.revenueTrend\`.
- **Net Income Trend:** Describe the company's long-term bottom-line performance using the text from \`performance.netIncomeTrend\`.
### 3.2. Annual Margin Analysis (The Quality of Sales)
- **Gross & Operating Margins:** Explain what these margins represent. Describe the trend in the company's core profitability by using the 'status' from \`performance.grossProfitMargin\` and \`performance.operatingProfitMargin\`.
### 3.3. Annual Net Profitability & Returns
- **Net Profit Margin:** Explain what this means. What is the trend according to the 'status' in \`performance.netProfitMargin\`?
- **Return on Equity (ROE):** Explain ROE as a "report card" for how well management uses shareholder money. How effective is the company based on the 'quality' from \`performance.returnOnEquity\`?

## 4. Recent Quarterly Performance (The Latest Snapshot)
This section provides a look at the company's most recent performance, which can indicate current momentum.
- **Most Recent Quarter (MRQ):** State the quarter ending date from \`recentPerformance.mrqDate\`.
- **MRQ Revenue & YoY Growth:** Report the revenue for the latest quarter from \`recentPerformance.mrqRevenue\` and its year-over-year growth from \`recentPerformance.revenueYoyGrowth\`. Explain what this growth rate signifies about the company's current sales trajectory.
- **MRQ Net Income & YoY Growth:** Report the net income for the latest quarter from \`recentPerformance.mrqNetIncome\` and its year-over-year growth from \`recentPerformance.netIncomeYoyGrowth\`. Comment on the current profitability trend.
- **Trailing Twelve Months (TTM) Net Income:** State the TTM Net Income from \`recentPerformance.ttmNetIncome\` and explain that this gives a better picture of recent full-year profitability than a single quarter alone.

## 5. Financial Health & Risk (Is the Company on Solid Ground?)
### 5.1. Liquidity Analysis
- **Current Ratio:** Explain this as the ability to pay short-term bills. Using the 'status' from \`health.currentRatio\`, comment on the company's short-term financial position.
### 5.2. Solvency and Debt Structure
- **Debt-to-Equity:** Explain this like a personal debt-to-income ratio. Based on the 'status' from \`health.debtToEquity\`, is the company conservatively or aggressively financed?
- **Interest Coverage:** Explain this as the ability to pay interest on its debt. Using the 'status' from \`health.interestCoverage\`, comment on its ability to handle its debt payments.

## 6. Cash Flow Analysis (Following the Actual Cash)
### 6.1. Operating Cash Flow (OCF) & Quality of Earnings
- Based on \`cashFlow.qualityOfEarnings\`, are the company's reported profits being converted into real cash?
### 6.2. Capital Allocation Story
- Based on \`cashFlow.capitalAllocationStory\`, what is the company primarily doing with its cash? Is it in growth mode, return mode, or deleveraging mode?

## 7. Valuation Analysis (Is the Stock Price Fair?)
For each valuation multiple below, report its status relative to its own historical trend.
- **P/E Ratio:** Use the 'status' from the object in the \`valuation\` array where 'metric' is 'peRatio'.
- **Price-to-Sales Ratio:** Use the 'status' from the object where 'metric' is 'priceToSalesRatio'.
- **Price-to-Book Ratio:** Use the 'status' from the object where 'metric' is 'pbRatio'.
- **Enterprise Value to EBITDA:** Use the 'status' from the object where 'metric' is 'enterpriseValueToEBITDA'.
After listing the statuses, briefly discuss what these comparisons imply. Is the stock trading at a premium or a discount to its own history overall?

## 8. The Long-Term Investment Thesis: Bull vs. Bear
### The Bull Case (Key Strengths)
- Create a bulleted list using the points provided in \`thesis.bullCasePoints\`.
### The Bear Case (Potential Risks)
- Create a bulleted list using the points provided in \`thesis.bearCasePoints\`.
### Final Verdict: The "Moat"
Based purely on this quantitative analysis, what is the primary story? Does the \`thesis.moatIndicator\` suggest the company has a strong competitive advantage (a "moat")? Conclude with a final statement on its profile as a potential long-term holding.
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

Output Format: The final report must be in professional markdown format. Use # for the main title, ## for major sections, and bullet points for key data points. Each bullet point MUST start on a new line.

IMPORTANT: Do not include any HTML tags in your output. Generate pure markdown only.

Conduct a GARP analysis for {companyName} (Ticker: {tickerSymbol}) using the provided data.

JSON Data with Pre-Calculated Metrics:
{jsonData}

# GARP Analysis: Is {companyName} ({tickerSymbol}) Priced for Perfection?

## 1. The Valuation Question
Start by framing the core debate. Is this a high-quality company whose growth justifies its price, or is it an over-hyped stock? Each bullet point below must start on a new line.
- **Current P/E Ratio:** State the value from \`valuation.peRatio\`.
- **Current P/S Ratio:** State the value from \`valuation.psRatio\`.
- **Valuation vs. History:** Based on \`valuation.peStatusVsHistory\`, state whether the company is trading at a premium or discount to its own past.

## 2. The Growth Engine: Justifying the Price
This section analyzes the growth that investors are paying for. Each bullet point below must start on a new line.
- **Historical EPS Growth:** Based on \`growth.historicalEpsGrowth\`, state the recent track record of earnings growth.
- **Forward EPS Growth (Analyst Forecast):** State the market's expectation for next year's earnings growth from \`growth.forwardEpsGrowth\`. This is the most critical number for the GARP thesis.

## 3. The PEG Ratio Verdict
The Price/Earnings-to-Growth (PEG) ratio is a key tool for GARP investors. Each bullet point below must start on a new line.
- **Explain the PEG Ratio:** Briefly explain that a PEG ratio of around 1.0 suggests a fair balance between a stock's P/E ratio and its expected earnings growth.
- **Calculated PEG Ratio:** State the value from \`pegRatio.value\`.
- **Interpretation:** Based on the \`pegRatio.verdict\`, describe whether the stock appears attractively priced, fairly priced, or expensive relative to its growth forecast.

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

const COMPOUNDING_MACHINE_PROMPT = `
Role: You are a long-term, business-focused investor, in the style of Chuck Akre or Terry Smith. Your goal is to identify "compounding machines" – exceptional businesses that can be held for a decade or more. Your analysis is a series of critical questions that a quality-focused investor would ask.

Data Instructions: Your analysis must be derived exclusively from the provided JSON data. You must answer every question.

Output Format: A markdown report answering the following questions.

JSON Data:
{jsonData}

# Quality Investor Checklist: Is {companyName} a Compounding Machine?

### 1. Is this a truly exceptional business?
- **Return on Invested Capital (ROIC):** Analyze the 'roicTrend'. Is it consistently high (ideally > 15-20%) and stable/increasing? This is the primary indicator of a great business.
- **Profitability & Pricing Power:** Analyze the 'profitabilityTrends'. Are gross and net margins consistently high and stable? This demonstrates a durable competitive advantage.

### 2. Does the company have a long runway for growth?
- **Reinvestment Opportunity:** Analyze the 'reinvestmentTrends' (capex and R&D). Does the company have ample opportunities to reinvest its cash flow at high rates of return?
- **Qualitative Clues:** Based on the 'qualitativeClues.description', does the business operate in a large and/or growing market?

### 3. Is the balance sheet a fortress?
- **Financial Health:** Analyze the 'balanceSheetHealth'. Is the debt-to-equity ratio low? A true compounder should not rely on excessive leverage.

### 4. Final Verdict: The "Buy and Hold" Test
Based on the answers above, synthesize a final verdict. Classify the company into one of the following categories and provide a brief justification.
- **Exceptional Compounder:** Demonstrates consistently high ROIC, a long growth runway, and a pristine balance sheet. A true "buy and hold" candidate.
- **High-Quality Business:** Shows strong profitability and a good balance sheet, but its runway for high-return reinvestment may be less certain.
- **Cyclical/Average Business:** Does not exhibit the consistent, high returns on capital that define a true compounding machine.
`.trim();

const DIVIDEND_DEEP_DIVE_PROMPT = `
Role: You are a conservative income investment analyst AI. Your goal is to explain dividend safety in simple, clear terms for an investor who relies on that income.
Concept: Dividend safety analysis is all about figuring out how likely a company is to continue paying its dividend.

Data Instructions: Your analysis must be derived exclusively from the provided JSON data, which contains pre-calculated metrics and trends.

Output Format: Create a markdown report. Explain each point using simple analogies and conclude with a clear safety rating.

JSON Data:
{jsonData}

# Dividend Deep Dive: {companyName} ({tickerSymbol})

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

export const RISK_ASSESSMENT_PROMPT = `
Role: You are a risk analyst AI. Your job is to act like a cautious inspector, identifying the most significant potential problems or "red flags" for {companyName} and explaining them simply.

Data Instructions: Your analysis must be derived exclusively from the provided JSON data. For each potential risk listed below, evaluate the data. **Only include the bullet point in your final output if the data indicates a risk is present.**

Output Format: You MUST return a prioritized, bulleted list in markdown, categorized by risk type. Do NOT use prose or paragraph format for the main analysis. Explain each risk in simple terms within the bullet points.

JSON Data:
{jsonData}

# Uncovering the Risks: {companyName} ({tickerSymbol})

## 1. Financial Risks (Is the Foundation Solid?)
- **Debt Load (Leverage):** Evaluate \`financialRisks.debtToEquity\`. If the ratio is high (e.g., > 1.0), state the value and explain the risk.
- **Liquidity:** Evaluate \`financialRisks.currentRatio\`. If the ratio is low (e.g., < 1.5), state the value and explain the risk of paying short-term bills.
- **Earnings Quality:** Compare \`financialRisks.earningsQuality.operating_cash_flow\` to \`financialRisks.earningsQuality.net_income\`. If operating cash flow is significantly lower, flag this as a potential red flag.
- **Dividend Sustainability:** Compare the \`financialRisks.dividends_paid\` amount to \`financialRisks.net_income\`. If dividends paid are greater than net income, flag this as a major risk to the dividend.

## 2. Market & Stock Price Risks (Is the Stock Itself Risky?)
- **Volatility:** Evaluate \`marketRisks.beta\`. If it is > 1.2, state the value and explain that the stock is more volatile than the market.
- **Valuation Risk:** Evaluate \`marketRisks.valuation.peRatio\` and \`psRatio\`. If either is high for its industry, note this as a risk that the stock may be "priced for perfection."
- **Analyst Pessimism:** Check the \`marketRisks.analystPessimism\` list. If it is not empty, list the pessimistic ratings as a risk.

## 3. Business Risks (Are There Cracks in the Operations?)
- **Recession Sensitivity:** Based on \`businessRisks.recession_sensitivity_sector\`, explain the risk if it's a cyclical sector like 'Industrials' or 'Consumer Discretionary'.
- **Margin Compression:** Analyze the \`businessRisks.marginTrend\`. If the net profit margin shows a clear downward trend over the last few years, identify this as a risk.

## 4. The Bottom Line: What Are the Biggest Worries?
Based on the risks you identified above, provide a brief, 1-2 sentence summary highlighting the top 2-3 risks an investor should be most aware of.
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

export const GARP_VALIDATION_PROMPT = `
Role: You are a skeptical senior portfolio manager. Your goal is to critically evaluate an investment opportunity by synthesizing three separate analyst reports (GARP, Financial Health, and Risk). Your final output must be a decisive, data-driven investment thesis.

**CRITICAL INSTRUCTIONS:**
- **Synthesize, Don't Invent:** Base your analysis *exclusively* on the information within the provided reports. Do not introduce outside information.
- **Quantify When Possible:** Use the specific metrics and figures from the reports to support your claims.
- **Be Decisive:** Avoid vague language. Your conclusion should be clear and actionable.

**Input Reports:**
\`\`\`
{allAnalysesData}
\`\`\`

---

# Investment Thesis: {companyName} ({tickerSymbol})

## 1. The Growth Opportunity (from GARP Analysis)
* **Core Thesis:** What is the primary narrative driving the forecasted growth? (e.g., market expansion, new product cycle, pricing power).
* **Key Metrics:** What is the projected forward growth rate? How does the PEG ratio quantify the attractiveness of this growth relative to its valuation?

---

## 2. The Financial Foundation (from Financial Health Analysis)
* **Overall Strength:** Does the company's balance sheet and cash flow provide a stable foundation to achieve the growth thesis?
* **Specifics:** Comment on the **trajectory** (improving, stable, or deteriorating) of key indicators like debt levels, profitability margins, and cash flow generation. Is the company's financial health a tailwind or a headwind for the growth story?

---

## 3. The Primary Obstacles (from Risk Assessment)
* **Key Risks:** Identify the top 2-3 risks that could derail the growth thesis.
* **Impact Assessment:** For each risk, briefly assess its potential impact. Are these near-term threats or long-term structural issues?

---

## 4. Synthesis & Recommendation
* **The Balancing Act:** Directly weigh the growth opportunity against the financial foundation and the identified risks. Is the potential reward significant enough to justify the risks? Does the company have the financial resilience to withstand these threats?
* **Final Verdict:** Based on this synthesis, provide a clear investment recommendation.

---

## 5. Classification & Key Monitoring Points
* **Classification:** Classify the stock into **ONE** of the following categories, providing a concise justification that links directly to your synthesis.
    * **High-Conviction GARP:** A compelling growth story backed by a robust financial position and manageable risks. The investment thesis is strong.
    * **Speculative GARP:** A promising growth story, but undermined by significant financial concerns or high-impact risks that make the outcome uncertain.
    * **Potential Value Trap:** The "cheap" valuation appears deceptive, hiding fundamental weaknesses or highly probable risks that make the forecasted growth unlikely to materialize.

* **Next Steps:** What are the top 1-2 specific metrics or events we must monitor over the next 6-12 months to validate or invalidate this thesis? (e.g., "Monitor gross margins in the next two earnings reports," "Track regulatory decisions regarding X.")
`.trim();

export const INVESTMENT_MEMO_PROMPT = `
**Persona & Goal:**
You are a Senior Investment Analyst at a GARP-focused ("Growth at a Reasonable Price") fund, channeling the analytical rigor and narrative style of top-tier investors. Your goal is to synthesize a dossier of qualitative and quantitative reports on {companyName} into a definitive and convincing investment memo. The final output must be a clear, thesis-driven analysis that determines if this is a quality growth company trading at a fair price.

**Core Philosophy (How to Think):**
1.  **Narrative Over Numbers:** The heart of this memo is the qualitative analysis. The scores are a summary, not the main event. Your primary task is to build a compelling investment case, not just fill out a scorecard.
2.  **Synthesize, Don't Summarize:** Do not merely list findings from each report. Weave them together to form a cohesive bull case, bear case, and valuation assessment.
3.  **Weigh Contradictions:** Explicitly address conflicting data points between reports. Explain which view is more relevant to our GARP thesis and why. For example, if a value fund sees a "value trap," but a growth fund sees a "compounding machine," your job is to determine if the price justifies the growth.
4.  **Cite Your Evidence:** Casually reference the source of key data points within your narrative (e.g., "The GARP analysis highlights strong FCF conversion," or "Conversely, the deep-value report warns of margin compression...").

---

# Investment Memo: {companyName} ({tickerSymbol})

## 1. Executive Summary & Investment Thesis
*(Begin with a 3-4 sentence paragraph that concisely summarizes the investment thesis. It should cover the core bull case, the primary risks (the bear case), and the final recommendation based on the current valuation. This is the "elevator pitch" for the entire memo.)*

## 2. The Bull Case: Why We Could Be Right
*(This section should be a compelling narrative about the investment's upside potential. Synthesize the strongest points from the provided reports.)*
* **Business Quality & Moat:** Analyze the company's competitive advantages. Is it a dominant leader with strong pricing power, or simply a good operator in a tough industry?
* **Growth Outlook:** What are the key drivers of future growth? Are they secular (long-term tailwinds) or cyclical? How large is the total addressable market (TAM)?
* **Management & Capital Allocation:** Is the leadership team proven and shareholder-aligned? Do they have a strong track record of intelligent capital allocation (e.g., high ROIC, smart M&A, opportunistic buybacks)?

## 3. The Bear Case: What Could Go Wrong
*(This section critically examines the primary risks and counterarguments. Acknowledge the potential downsides mentioned in the reports.)*
* **Key Risks & Competitive Threats:** What are the top 2-3 most critical risks? Are there credible threats to the company's moat?
* **Financial Health Concerns:** Are there any red flags on the balance sheet (e.g., high leverage)? Is cash flow consistent? Are margins sustainable or at risk of compression?
* **Potential Headwinds:** Are there any secular or cyclical headwinds that could derail the growth story?

## 4. Valuation: The GARP Fulcrum
*(This is the deciding section. Analyze whether the current price is reasonable given the quality of the business and its growth prospects.)*
* **Current Valuation Picture:** Based on the reports, what do key GARP metrics like the PEG ratio, P/FCF, or EV/EBITDA tell us?
* **Margin of Safety:** Does the current price offer a sufficient margin of safety? Is the market overly optimistic or pessimistic about the company's future?
* **Conclusion on Price:** Synthesize the bull and bear cases to answer the ultimate question: Is {companyName} a quality growth company trading at a fair price *today*?

## 5. Final Verdict & Actionable Recommendation

### A. Recommendation
*(Provide a clear, actionable recommendation.)*
* **High Conviction Buy:** A compelling opportunity; recommend a full position.
* **Initiate Position:** A good opportunity; recommend building a starter (e.g., 1/3) position and adding on weakness.
* **Add to Watchlist:** An interesting company, but the current price/risk profile isn't compelling. Specify the catalyst or price target you'd be waiting for.
* **Pass:** The risks outweigh the potential rewards; not a suitable GARP investment at this time.

### B. Internal Scorecard Summary
*(Here, you will summarize your analysis using the 1-10 scoring system as a final quantitative check. The rationale for each score is the detailed analysis you've already written above.)*
* **Business Quality & Moat:** \`[1-10]\`
* **Financial Health:** \`[1-10]\`
* **Management & Capital Allocation:** \`[1-10]\`
* **Growth Outlook:** \`[1-10]\`
* **Valuation & Margin of Safety:** \`[1-10]\`
* ---
* **Final Weighted Score:**
    * **Calculation:** \`[(Growth * 0.3) + (Valuation * 0.25) + (Business Quality * 0.25) + (Financial Health * 0.1) + (Management * 0.1)] = Final Score\`
    * **Score:** \`[Calculated Score / 10.0]\`

---
**Input Reports:**
{allAnalysesData}
`.trim();

export const INCOME_MEMO_PROMPT = `
**Persona & Goal:**
You are a Senior Investment Analyst at a conservative, income-focused fund. Your primary goal is to assess the safety and long-term viability of {companyName}'s dividend. You must synthesize the provided reports into a definitive investment memo for the income portfolio.

**Core Philosophy (How to Think):**
1.  **Safety First:** The central question is, "How safe is the dividend?" The business quality and financial health are analyzed through the lens of their ability to protect and grow the dividend.
2.  **Synthesize, Don't Summarize:** Weave the findings from the 'Dividend Deep Dive', 'Financial Health', and 'Moat Analysis' reports into a cohesive narrative.
3.  **Address Contradictions:** If the 'Moat Analysis' shows a strong business but the 'Dividend Deep Dive' reveals a high payout ratio, you must address this conflict directly.
4.  **Cite Your Evidence:** Casually reference the source of key data points within your narrative (e.g., "The Dividend Deep Dive confirms the payout ratio is well-covered by cash flow," or "However, the Financial Health analysis points to a rising debt load...").

---

# Income Investment Memo: {companyName} ({tickerSymbol})

## 1. Executive Summary & Thesis
*(Begin with a 3-4 sentence paragraph. State the current dividend yield. Summarize the thesis for or against the stock as a reliable income investment, highlighting the dividend's safety and the business's ability to support it long-term.)*

## 2. The Dividend: Safety & Growth Potential
*(This is the core section. Synthesize findings from the 'Dividend Deep Dive' report.)*
* **Coverage & Affordability:** How well is the dividend covered by Free Cash Flow? Is the payout ratio conservative or aggressive?
* **Track Record & Management Commitment:** Does the company have a history of consistent and growing dividend payments? What does this signal about management's philosophy?

## 3. The Business: Can it Sustain the Dividend?
*(Synthesize findings from the 'Financial Health' and 'Moat Analysis' reports.)*
* **Financial Foundation:** Is the balance sheet strong enough to protect the dividend during a recession? Focus on debt levels and cash reserves.
* **Economic Moat:** Does the company have a durable competitive advantage that protects the long-term cash flows needed to fund the dividend? A business with no moat has an inherently unsafe dividend.

## 4. Risks to the Income Stream
*(Critically examine the primary threats to the dividend.)*
* **Key Risks:** What are the top 2-3 most critical risks identified in the reports that could force a dividend cut? (e.g., margin compression, secular decline in the industry, rising debt).
* **Valuation:** Is the current yield attractive for the level of risk being taken? A high yield can often be a warning sign (a "yield trap").

## 5. Final Verdict & Recommendation for the Income Portfolio

### A. Recommendation
*(Provide a clear, actionable recommendation for an income-focused portfolio.)*
* **Core Income Holding:** A blue-chip quality stock with a very safe and growing dividend.
* **Accumulate for Income:** A solid company with a well-covered dividend; a good candidate for the portfolio.
* **Monitor / High Yield Watch:** The yield is attractive but comes with elevated risks. Keep on a watchlist, but do not add to the core portfolio.
* **Avoid for Income:** The dividend is unsafe, or the company is not a suitable income investment.

### B. Dividend Scorecard
*(Summarize your analysis with a 1-10 scoring system.)*
* **Dividend Safety (Payout Ratio & Balance Sheet):** \`[1-10]\`
* **Dividend Growth (History & Future Prospects):** \`[1-10]\`
* **Business Quality (Moat & Cash Flow Stability):** \`[1-10]\`
* **Yield Attractiveness (Yield vs. Risk):** \`[1-10]\`
* ---
* **Final Weighted Score:**
    * **Calculation:** \`[(Safety * 0.4) + (Business Quality * 0.3) + (Growth * 0.2) + (Yield * 0.1)] = Final Score\`
    * **Score:** \`[Calculated Score / 10.0]\`

---
**Input Reports:**
{allAnalysesData}
`.trim();

export const QUALITY_COMPOUNDER_MEMO_PROMPT = `
**Persona & Goal:**
You are a Senior Investment Analyst at a long-term, quality-focused fund. Your goal is to synthesize a dossier of reports on {companyName} to determine if it meets the high bar of a "Quality Compounder" – a business you would be comfortable owning for a decade.

**Core Philosophy (How to Think):**
1.  **Quality is Paramount:** Your primary focus is on the durability of the business's competitive advantages (moat) and its ability to generate high returns on capital. Valuation is a secondary, but still important, consideration.
2.  **Synthesize, Don't Summarize:** Weave together insights from the 'Compounding Machine', 'Financial Health', 'Growth Outlook', and 'Risk' reports into a cohesive thesis.
3.  **Weigh Contradictions:** Explicitly address conflicting data. For example, if the 'Growth Outlook' is strong but the 'Risk Assessment' highlights significant threats, you must reconcile these two views.
4.  **Cite Your Evidence:** Casually reference the source of key data points within your narrative (e.g., "The Compounding Machine checklist confirms a consistently high ROIC," or "However, the Risk Assessment flags the company's high customer concentration...").

---

# Quality Compounder Memo: {companyName} ({tickerSymbol})

## 1. Executive Summary & Investment Thesis
*(Begin with a 3-4 sentence paragraph that concisely summarizes the investment thesis. Does the company have the DNA of a long-term compounder? What is the core reason to own it, and what is the primary risk to that thesis?)*

## 2. The "Compounding Machine" Thesis
*(This section should be a compelling narrative about the quality of the business. Synthesize the strongest points from the provided reports.)*
* **Business Quality & Moat (from 'Compounding Machine' report):** What is the verdict on the company's competitive advantage? Is the ROIC exceptional and consistent? Is there evidence of strong pricing power?
* **Growth Outlook (from 'Growth Outlook' report):** Does the company have a long runway for growth? What are the key drivers? Is management effectively reinvesting for the future?
* **Financial Fortress (from 'Financial Health' report):** Is the business built on a rock-solid financial foundation? Comment on the debt levels and cash flow generation. A true compounder should not require excessive leverage to grow.

## 3. Key Risks to Compounding
*(This section critically examines the primary risks that could interrupt the long-term compounding story.)*
* **Primary Threats (from 'Risk Assessment' report):** What are the top 2-3 most critical long-term risks? Are there credible threats to the company's moat (e.g., technological disruption, regulatory change)?
* **Growth Deceleration:** Does the 'Growth Outlook' report suggest any potential for growth to slow down, which would impact the compounding thesis?

## 4. Valuation: The Price of Quality
*(Analyze whether the current price is a reasonable entry point for a long-term hold.)*
* **Is Quality Already Priced In?** Acknowledge the company's valuation. Great businesses are rarely cheap. Is the current valuation justifiable given the quality and growth prospects, or is it in "priced for perfection" territory?
* **Conclusion on Price:** Is the current price a fair price to pay for an exceptional business, or should we wait for a better entry point?

## 5. Final Verdict & Actionable Recommendation

### A. Recommendation
*(Provide a clear, actionable recommendation for a long-term, quality-focused portfolio.)*
* **Core Compounder:** A high-conviction, best-in-breed company. Recommend a full position.
* **Initiate & Build:** A high-quality business at a fair price. Recommend building a starter position and adding over time.
* **Quality Watchlist:** An exceptional company that is currently too expensive. Specify the conditions (e.g., a 20% pullback) under which you would become a buyer.
* **Pass:** The business does not meet the high bar for quality, or the risks are too great.

### B. Quality Scorecard
*(Summarize your analysis with a 1-10 scoring system.)*
* **Business Quality & Moat:** \`[1-10]\`
* **Growth Runway & Reinvestment:** \`[1-10]\`
* **Financial Health & Resilience:** \`[1-10]\`
* **Valuation (Price vs. Quality):** \`[1-10]\`
* ---
* **Final Weighted Score:**
    * **Calculation:** \`[(Business Quality * 0.4) + (Growth * 0.3) + (Financial Health * 0.2) + (Valuation * 0.1)] = Final Score\`
    * **Score:** \`[Calculated Score / 10.0]\`

---
**Input Reports:**
{allAnalysesData}
`.trim();

export const ALL_REPORTS_PROMPT = `
Role: You are an expert financial analyst AI. Your task is to generate a comprehensive dossier of 10 distinct financial analysis reports for {companyName} ({tickerSymbol}).

Data Instructions:
- Your analysis MUST be based *exclusively* on the pre-calculated metrics provided in the JSON data below.
- You will generate each of the 10 reports listed below.
- The instructions for each report are embedded in their respective sections.

Output Format:
- The entire output must be a single block of text in professional markdown format.
- You MUST separate each of the 10 reports with a unique delimiter on its own line: \`--- REPORT: [ReportType] ---\`, where \`[ReportType]\` is the exact name from the list (e.g., FinancialAnalysis, UndervaluedAnalysis, GarpAnalysis).
- The first line of each report section MUST be its title in markdown (e.g., \`# Comprehensive Financial Analysis: {companyName} ({tickerSymbol})\`).

JSON Data with All Pre-Calculated Metrics:
{jsonData}

--- REPORT: FinancialAnalysis ---
# Comprehensive Financial Analysis: {companyName} ({tickerSymbol})
(Follow the full instructions from the FINANCIAL_ANALYSIS_PROMPT to generate this report section based on the provided JSON data.)

--- REPORT: UndervaluedAnalysis ---
# Investment Valuation Report: Is {companyName} ({tickerSymbol}) a Bargain?
(Follow the full instructions from the UNDERVALUED_ANALYSIS_PROMPT to generate this report section based on the provided JSON data.)

--- REPORT: GarpAnalysis ---
# GARP Analysis: Is {companyName} ({tickerSymbol}) Priced for Perfection?
(Follow the full instructions from the GARP_ANALYSIS_PROMPT to generate this report section based on the provided JSON data.)

--- REPORT: BullVsBear ---
# The Investment Debate: {companyName} ({tickerSymbol})
(Follow the full instructions from the BULL_VS_BEAR_PROMPT to generate this report section based on the provided JSON data.)

--- REPORT: MoatAnalysis ---
# Economic Moat Analysis: {companyName} ({tickerSymbol})
(Follow the full instructions from the MOAT_ANALYSIS_PROMPT to generate this report section based on the provided JSON data.)

--- REPORT: DividendSafety ---
# Dividend Safety Analysis: {companyName} ({tickerSymbol})
(Follow the full instructions from the DIVIDEND_SAFETY_PROMPT to generate this report section based on the provided JSON data.)

--- REPORT: GrowthOutlook ---
# Growth Outlook: {companyName} ({tickerSymbol})
(Follow the full instructions from the GROWTH_OUTLOOK_PROMPT to generate this report section based on the provided JSON data.)

--- REPORT: RiskAssessment ---
# Uncovering the Risks: {companyName} ({tickerSymbol})
(Follow the full instructions from the RISK_ASSESSMENT_PROMPT to generate this report section based on the provided JSON data.)

--- REPORT: CapitalAllocators ---
# The Capital Allocators: A Deep Dive into the Financial Stewardship of {companyName}'s Leadership
(Follow the full instructions from the CAPITAL_ALLOCATORS_PROMPT to generate this report section based on the provided JSON data.)

--- REPORT: NarrativeCatalyst ---
# Narrative & Catalyst Checklist: {companyName} ({tickerSymbol})
(Follow the full instructions from the NARRATIVE_CATALYST_PROMPT to generate this report section based on the provided JSON data.)
`.trim();

export const FORM_8K_ANALYSIS_PROMPT = `
Role: You are a skeptical and meticulous financial analyst specializing in SEC filings. Your task is to dissect the provided Form 8-K for {companyName} and distill the critical, investment-relevant information. You must look beyond the corporate jargon to identify both the stated facts and the unstated implications. Your audience is a busy portfolio manager who needs the bottom-line impact immediately.

Data Instructions: Your analysis MUST be based *exclusively* on the provided filing text. Do not invent facts or speculate beyond what a reasonable analyst would infer from the text.

Output Format: A concise, professional markdown report.

Filing Text:
{filingText}

# Form 8-K Analysis: {companyName} ({tickerSymbol})

## 1. Executive Summary: The Core Event and Its Immediate Implication
In one or two sentences, what is the single most important event disclosed and what is its direct consequence for the company and its investors?

## 2. Key Disclosed Items & Data Points
Create a bulleted list of the specific "Items" disclosed (e.g., Item 1.01, Item 5.02). For each item:
- **Item [Number] - [Description]:** Briefly summarize the event in one sentence.
- **Key Data:** Extract critical quantitative data (e.g., dollar amounts, dates, percentages, executive names). If none, state "N/A".

## 3. The Bull Case (Potential Positives)
Based ONLY on the filing, what is the most positive interpretation of this news? What opportunities or strengths does it signal?
- **Positive Interpretation:** [Explain the upside in 3-4 sentences.]

## 4. The Bear Case (Potential Risks & Red Flags)
As a skeptical analyst, what are the potential risks, downsides, or unanswered questions raised by this filing? What could be the negative interpretation?
- **Risks & Red Flags:** [Explain the potential negatives or concerns in 3-4 sentences.]

## 5. Final Verdict & Justification
Provide a clear verdict on the immediate net impact.
- **Verdict:** [Bullish / Bearish / Neutral]
- **Justification:** [Concisely synthesize why the bull or bear case is stronger in the immediate term, based on the disclosed facts.]
`.trim();

export const FORM_10K_ANALYSIS_PROMPT = `
Role: You are a Senior Equity Analyst and Forensic Accountant. Your task is to perform a deep, qualitative analysis of the Form 10-K for {companyName}. Go beyond the obvious statements to uncover the underlying story, changes in strategy, and potential disconnects between management's narrative and the disclosed risks. Your audience is an investment committee deciding on a long-term position.

Data Instructions: Your analysis MUST be based *exclusively* on the provided filing text. Synthesize information from across the document to form your conclusions.

Output Format: A professional markdown report structured as follows.

Filing Text:
{filingText}

# Form 10-K Intelligence Brief: {companyName} ({tickerSymbol})

## 1. The Core Narrative: Strategy & Competitive Moat
Based on the "Business" section (Item 1), summarize management's description of their core business model and competitive advantage ("moat"). What is the central pillar of their strategy for the upcoming year?

## 2. Risk Factors: What's New and What's Escalating?
From the "Risk Factors" section (Item 1A), identify the 3-5 most material risks. For each, note if it appears to be a new or an escalating concern compared to previous years (based on phrasing like "increasingly," "new," or the level of detail provided).
- **Risk:** [Summarize the risk.] **Assessment:** [New / Escalating / Chronic]
- **Risk:** [Summarize the risk.] **Assessment:** [New / Escalating / Chronic]
- **Risk:** [Summarize the risk.] **Assessment:** [New / Escalating / Chronic]

## 3. Management's Story (MD&A Insights)
From the "MD&A" section (Item 7), distill management's explanation of their performance.
- **Performance Narrative:** What specific factors are credited for successes, and what external or internal factors are blamed for failures?
- **Capital Allocation:** Where is management deploying capital? Note any significant mentions of spending on R&D, acquisitions, share buybacks, or capital expenditures, and the stated reason.
- **Tone & Outlook:** Characterize the tone of the forward-looking statements. Is it confident, defensive, or ambiguous? Quote a brief, representative phrase if possible.

## 4. Hidden Details: Legal & Accounting Notes
- **Legal Proceedings (Item 3):** Are there any new, significant legal proceedings disclosed? If so, what is the potential risk? If not, state "No significant new litigation noted."
- **Critical Accounting Policies (from MD&A):** Does management highlight any highly subjective accounting estimates (e.g., goodwill, revenue recognition)? Note any areas that require significant judgment.

## 5. Investment Thesis: Key Pillars & Cracks
Synthesize your entire analysis into a final verdict.
- **Pillars (Green Flags):** What are the 1-2 core strengths or positive dynamics evident from the narrative? (This is the foundation of a bull thesis).
- **Cracks (Red Flags):** What are the 1-2 most significant risks, inconsistencies, or concerns that undermine the bull thesis?
`.trim();

export const FORM_10Q_ANALYSIS_PROMPT = `
Role: You are a Senior Equity Analyst. Your task is to perform a concise, qualitative analysis of the Form 10-Q for {companyName}. Focus on identifying significant changes or trends since the last annual report (10-K). Your audience is an investment committee needing a quick update.

Data Instructions: Your analysis MUST be based *exclusively* on the provided filing text.

Output Format: A professional markdown report structured as follows.

Filing Text:
{filingText}

# Form 10-Q Interim Analysis: {companyName} ({tickerSymbol})

## 1. Executive Summary: What's the Story This Quarter?
In 2-3 sentences, what is the most important takeaway from this quarter? Did the company's performance meet, exceed, or miss the implied trajectory from their last 10-K?

## 2. Key Changes & Developments (MD&A Insights)
From the "MD&A" section (Item 2), distill management's explanation of their quarterly performance.
- **Performance Drivers:** What specific factors are credited for this quarter's results (both positive and negative)?
- **Strategic Updates:** Note any new initiatives, capital allocation decisions, or changes in outlook mentioned.
- **Emerging Risks:** Have any new risks emerged since the last annual report, or has management's commentary on existing risks intensified?

## 3. Financial Snapshot: Key Trends
Briefly analyze any significant sequential (vs. prior quarter) or year-over-year changes mentioned in the financial statements or MD&A. Focus on trends in revenue, margins, or cash flow.

## 4. Red Flags & Questions for Management
Based on your analysis, list 1-2 critical questions this 10-Q raises. What should an investor be watching for in the next earnings call?
`.trim();

export const promptMap = {
    'FinancialAnalysis': {
        prompt: FINANCIAL_ANALYSIS_PROMPT,
        requires: ['profile', 'key_metrics_annual', 'stock_grade_news', 'income_statement_annual', 'cash_flow_statement_annual', 'income_statement_quarterly']
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
        requires: ['income_statement_annual', 'key_metrics_annual', 'cash_flow_statement_annual', 'stock_grade_news', 'historical_price', 'ratios_annual']
    },
    'MoatAnalysis': {
        prompt: MOAT_ANALYSIS_PROMPT,
        requires: ['profile', 'key_metrics_annual', 'income_statement_annual', 'cash_flow_statement_annual', 'ratios_annual']
    },
    'CompoundingMachine': {
        prompt: COMPOUNDING_MACHINE_PROMPT,
        requires: ['profile', 'key_metrics_annual', 'income_statement_annual', 'cash_flow_statement_annual', 'ratios_annual']
    },
    'DividendDeepDive': {
        prompt: DIVIDEND_DEEP_DIVE_PROMPT,
        requires: ['key_metrics_annual', 'cash_flow_statement_annual', 'income_statement_annual', 'balance_sheet_statement_annual', 'ratios_annual']
    },
    'GrowthOutlook': {
        prompt: GROWTH_OUTLOOK_PROMPT,
        requires: ['income_statement_annual', 'key_metrics_annual', 'stock_grade_news', 'analyst_estimates', 'ratios_annual']
    },
    'RiskAssessment': {
        prompt: RISK_ASSESSMENT_PROMPT,
        requires: ['profile', 'key_metrics_annual', 'cash_flow_statement_annual', 'income_statement_annual', 'stock_grade_news', 'ratios_annual']
    },
    'CapitalAllocators': {
        prompt: CAPITAL_ALLOCATORS_PROMPT,
        requires: ['cash_flow_statement_annual', 'key_metrics_annual', 'income_statement_annual', 'balance_sheet_statement_annual', 'ratios_annual']
    },
    'NarrativeCatalyst': {
        prompt: NARRATIVE_CATALYST_PROMPT,
        requires: ['profile', 'key_metrics_annual', 'cash_flow_statement_annual', 'income_statement_annual', 'stock_grade_news', 'ratios_annual']
    },
    'CompetitiveLandscape': {
        prompt: COMPETITIVE_LANDSCAPE_PROMPT,
        requires: ['profile', 'key_metrics_annual', 'ratios_annual']
    },
    'StockDisruptor': {
        prompt: STOCK_DISRUPTOR_PROMPT,
        requires: ['profile', 'income_statement_annual', 'key_metrics_annual']
    },
    'StockFortress': {
        prompt: STOCK_FORTRESS_PROMPT,
        requires: ['ratios_annual', 'key_metrics_annual']
    },
    'StockPhoenix': {
        prompt: STOCK_PHOENIX_PROMPT,
        requires: ['income_statement_annual', 'income_statement_quarterly', 'ratios_annual', 'key_metrics_annual']
    },
    'StockLinchpin': {
        prompt: STOCK_LINCHPIN_PROMPT,
        requires: ['profile', 'ratios_annual', 'key_metrics_annual']
    },
    'StockUntouchables': {
        prompt: STOCK_UNTOUCHABLES_PROMPT,
        requires: ['profile', 'income_statement_annual', 'ratios_annual']
    },
    'Form8KAnalysis': {
        prompt: FORM_8K_ANALYSIS_PROMPT,
        requires: [] // This will be based on manually provided text
    },
    'Form10KAnalysis': {
        prompt: FORM_10K_ANALYSIS_PROMPT,
        requires: [] // This will be based on manually provided text
    },
    'Form10QAnalysis': {
        prompt: FORM_10Q_ANALYSIS_PROMPT,
        requires: [] // This will be based on manually provided text
    },	
    'InvestmentMemo': {
        prompt: INVESTMENT_MEMO_PROMPT,
        requires: [] // This prompt uses other reports, not raw FMP data.
    },
    'IncomeMemo': {
        prompt: INCOME_MEMO_PROMPT,
        requires: [] // This prompt uses other reports, not raw FMP data.
    },
    'GarpValidation': {
        prompt: GARP_VALIDATION_PROMPT,
        requires: [] // This prompt uses other reports, not raw FMP data.
    },
    'QualityCompounderMemo': {
        prompt: QUALITY_COMPOUNDER_MEMO_PROMPT,
        requires: [] // This prompt uses other reports, not raw FMP data.
    }
};

export const ANALYSIS_ICONS = {
    'FinancialAnalysis': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6a7.5 7.5 0 100 15 7.5 7.5 0 000-15z" /><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.2-5.2" /><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 10.5H10.5v.008H10.5V10.5zm.008 0h.008v4.502h-.008V10.5z" /></svg>`,
    'UndervaluedAnalysis': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0l.879-.659M7.5 14.25l6-6M4.5 12l6-6m6 6l-6 6" /></svg>`,
    'GarpAnalysis': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18L9 11.25l1.5 1.5L13.5 6l3 3 4.5-4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
    'BullVsBear': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.774 4.774zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
    'MoatAnalysis': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286zm0 13.036h.008v.008h-.008v-.008z" /></svg>`,
    'CompoundingMachine': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h6.75M9 11.25h6.75M9 15.75h6.75" /></svg>`,
    'DividendDeepDive': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25-2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 3a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 12m15 0a2.25 2.25 0 01-2.25 2.25H12a2.25 2.25 0 01-2.25-2.25" /></svg>`,
    'GrowthOutlook': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>`,
    'RiskAssessment': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>`,
    'CapitalAllocators': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15.91 15.91a2.25 2.25 0 01-3.182 0l-3.03-3.03a.75.75 0 011.06-1.061l2.47 2.47 2.47-2.47a.75.75 0 011.06 1.06l-3.03 3.03z" /></svg>`,
    'NarrativeCatalyst': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.62a8.983 8.983 0 013.362-3.867 8.262 8.262 0 013 2.456z" /><path stroke-linecap="round" stroke-linejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" /></svg>`,
    'CompetitiveLandscape': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.284-2.72a3 3 0 00-4.682 2.72 9.094 9.094 0 003.741.479m7.284-2.72a3 3 0 01-4.682-2.72 9.094 9.094 0 013.741-.479m-7.284 2.72a9.094 9.094 0 00-3.741-.479 3 3 0 004.682 2.72M12 12a3 3 0 11-6 0 3 3 0 016 0zm6 0a3 3 0 11-6 0 3 3 0 016 0z" /></svg>`,
    'StockDisruptor': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>`,
    'StockFortress': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286zm0 13.036h.008v.008h-.008v-.008z" /></svg>`,
    'StockPhoenix': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.62a8.983 8.983 0 013.362-3.867 8.262 8.262 0 013 2.456z" /><path stroke-linecap="round" stroke-linejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" /></svg>`,
    'StockLinchpin': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M13.192 7.027a5.25 5.25 0 017.423 0L21 7.402a5.25 5.25 0 010 7.423l-.385.385a5.25 5.25 0 01-7.423 0L13.192 7.027zm-6.384 0a5.25 5.25 0 017.423 0L15 7.402a5.25 5.25 0 010 7.423l-5.385 5.385a5.25 5.25 0 01-7.423 0L2 19.973a5.25 5.25 0 010-7.423l.385-.385z" /><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6" /></svg>`,
    'StockUntouchables': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>`,
    'Form8KAnalysis': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h.01M15 12h.01M10.5 16.5h3m-6.75-3.75a3 3 0 013-3h3a3 3 0 013 3v3a3 3 0 01-3 3h-3a3 3 0 01-3-3v-3z" /><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
    'Form10KAnalysis': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>`,
    'InvestmentMemo': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>`,
    'IncomeMemo': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /></svg>`,
    'QualityCompounderMemo': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12.75h4.875a2.25 2.25 0 0 0 2.25-2.25v-2.25a2.25 2.25 0 0 0-2.25-2.25H15M9 12l3 3m0 0 3-3m-3 3v-3m-3.75 6H5.625a2.25 2.25 0 0 1-2.25-2.25V7.875c0-1.242.984-2.25 2.25-2.25h4.5" /></svg>`
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
