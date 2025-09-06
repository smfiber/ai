// config.js
// --- App Version ---
export const APP_VERSION = "14.43.0";

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
    secApiKey: "", // New state for SEC-API.io key
    googleClientId: "",
    driveTokenClient: null,
    driveFolderId: null,
    portfolioCache: [],
    availableIndustries: [],
    cashBalance: 0, // v14.18.0: Add cash balance to state
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
    INPUT_SEC_KEY: 'secApiKeyInput', // New constant for SEC API input
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
    DB_COLLECTION_AI_REPORTS: 'ai_analysis_reports',
    DB_COLLECTION_BROAD_ENDPOINTS: 'broad_api_endpoints',
    // v13.1.0: New collection for sector/industry reports
    DB_COLLECTION_BROAD_REPORTS: 'ai_broad_reports',
    DB_COLLECTION_FMP_CACHE: 'fmp_cached_data',
    DB_COLLECTION_FMP_ENDPOINTS: 'fmp_endpoints',
    DB_COLLECTION_FMP_NEWS_CACHE: 'fmp_news_cache',
    DB_COLLECTION_PORTFOLIO: 'portfolio_stocks',
    // v13.8.0: New collection for screener tile interactions
    DB_COLLECTION_SCREENER_INTERACTIONS: 'screener_interactions',
    DB_COLLECTION_SCANNER_RESULTS: 'scanner_results',
    DB_COLLECTION_SECTOR_ANALYSIS: 'sector_analysis_runs',
    DB_COLLECTION_USER_DATA: 'user_data', // v14.18.0: New collection for user-specific data like cash
    DB_DOC_ID_USER_MDA: 'user_mda_summary',
    DB_DOC_ID_USER_10K_RISKS: 'user_10k_risks',
    DB_DOC_ID_USER_10Q_RISKS: 'user_10q_risks',
    DB_DOC_ID_USER_8K: 'user_8k_summary',
    DB_DOC_ID_INSTITUTIONAL_OWNERSHIP: 'institutional_ownership',
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

export const DEEP_DIVE_PROMPT = `
Role: You are a senior investment analyst AI for a discerning, value-oriented fund. Your task is to synthesize a comprehensive set of financial data into a clear, decisive, and data-driven investment memo. Your analysis must be objective and based *exclusively* on the provided data.

CRITICAL INSTRUCTION: The user is analyzing **{companyName} ({tickerSymbol})**. Your entire response MUST be about this specific company and its provided data. Do NOT mention or analyze any other company.

Data Instructions: Your entire analysis MUST be based on the pre-calculated metrics, financial statements, and SEC filing summaries provided in the JSON data below. Do NOT attempt to recalculate any values. If a specific data point is "N/A" or missing, state that clearly in your analysis. Use simple analogies where appropriate to explain financial concepts.

Output Format: The final report must be in professional markdown format. Use # for the main title, ## for major sections, ### for sub-sections, and bullet points for key data points.

IMPORTANT: Do not include any HTML tags in your output. Generate pure markdown only.

Analyze the comprehensive financial data for {companyName} (Ticker: {tickerSymbol}) provided below.

JSON Data with Pre-Calculated Metrics & SEC Summaries:
{jsonData}

Based on the provided data, generate the following multi-faceted investment memo:
# Investment Memo: {companyName} ({tickerSymbol})

## 1. Executive Summary & Investment Thesis
Begin with a concise, one-paragraph summary. What is the most important takeaway about this company's quality, valuation, and overall story as a potential investment? Synthesize the key findings from the report below, including the forward-looking analyst consensus, **management's outlook from the provided MD&A summary, material events from the provided 8-K summary, and key risks from the provided 10-K/10-Q filing summaries,** into a coherent investment thesis.

## 2. Forward-Looking Outlook & Recent Events
### Analyst Consensus
- Based on the provided forecasts, what is the market's expectation for next year's revenue and EPS?
- What does the estimated revenue growth rate suggest about the company's future trajectory?
- What is the consensus analyst price target and the implied upside/downside from the current price?
### Management's Discussion & Analysis (from latest 10-Q)
- **Based on the provided MD&A summary (filing date: [date]), what is management's narrative regarding recent performance and future outlook?**
### Material Events (from latest 8-K)
- **Based on the provided 8-K summary (filing date: [date]), what recent material events has the company disclosed?**
### Recent Analyst Actions
- Review the list of recent analyst ratings. What is the prevailing sentiment? Is there a clear trend of upgrades, downgrades, or mixed opinions?
### Key News Narrative
- Summarize the dominant news narrative. How does this recent story frame the company's current situation and potential future?
### Key Stakeholder Analysis
- **Insider Transactions:** Based on the 6-month transaction summary, are company insiders net buyers or sellers of the stock? What does this suggest about their confidence in the company's near-term prospects?
- **Institutional Ownership:** Reference the 'institutionalOwnershipTimeframe' from the data. Based on filings from this period, who are some of the largest institutional holders listed? Does this snapshot of recent ownership suggest a high level of conviction from sophisticated investors?

## 3. Business Quality & Competitive Moat
### Business Description
In simple terms, describe the company's business based on the provided 'description', 'sector', 'industry'.
### Moat Analysis
- **Return on Equity (ROE):** Explain ROE as a "report card" for how well management uses shareholder money. Based on the ROE trend, how effective and consistent is the company at generating profits from its equity?
- **Margin Stability:** Analyze the trends in Gross and Net Profit Margins. Are they stable, expanding, or contracting? What does this suggest about the company's pricing power and competitive position?

## 4. Financial Health & Performance
### Performance Trends
- **Revenue Growth:** Describe the company's recent top-line performance based on the revenue trend. Is it accelerating, stable, or slowing down?
- **Net Income Growth:** Describe the company's recent bottom-line performance based on the net income trend.
### Balance Sheet Strength
- **Debt-to-Equity:** Explain this like a personal debt-to-income ratio. Based on the trend, is the company conservatively or aggressively financed?
### Cash Flow Analysis
- **Quality of Earnings:** Are the company's reported profits being converted into real cash? Compare Operating Cash Flow to Net Income.
- **Dividend Safety:** If applicable, analyze the dividend yield and cash flow payout ratio. Is the dividend well-covered by actual cash?

## 5. Valuation Analysis
### Key Multiples vs. History
- For each key multiple (P/E, P/S, P/B), compare its current value to its historical average.
- **Overall Verdict:** Based on this comparison and considering the analyst price target consensus, is the stock currently trading at a premium, a discount, or in line with its own history?
### Deep Value Check
- **Graham Number:** State the pre-calculated 'grahamVerdict'. This classic value investing metric provides a strict, conservative measure of a stock's intrinsic value.

## 6. Bull & Bear Case (Strengths & Risks)
### The Bull Case (Key Strengths)
- Create a bulleted list summarizing the most compelling positive data points from your analysis (e.g., strong ROE, positive analyst revisions, favorable news narrative, attractive valuation).
### The Bear Case (Potential Risks)
- Create a bulleted list summarizing the most significant risks or red flags identified in the data (e.g., high debt, declining margins, negative news, high valuation).
- **Incorporate the key points from the provided "Risk Factors" summaries. For each summary, note its source (e.g., 10-K or 10-Q) and its filing date to determine which is most recent and relevant.**

## 7. Final Verdict & Recommendation
Conclude with a final, decisive paragraph. Weigh the strengths against the risks, incorporating both the historical financial data and the forward-looking context **from the provided MD&A, 8-K, and Risk Factor summaries**. Based *only* on this quantitative and qualitative analysis, classify the stock's profile (e.g., "High-Quality Compounder," "Classic Value Play," "Speculative Turnaround," "Potential Value Trap") and state a clear recommendation.
`.trim();

export const MORNING_BRIEFING_PROMPT = `
Role: You are a sharp, concise financial analyst AI. Your task is to generate a "Morning Briefing" for an investor based on the provided JSON data for their personal stock portfolio. Your tone should be professional, objective, and straight to the point, like a pre-market brief from a top-tier financial firm.

Data Instructions:
- Your analysis MUST be based *exclusively* on the provided JSON data.
- The data includes stock profiles (with price changes), recent news, and analyst rating changes.
- Do NOT include any information not present in the data.
- Focus on synthesis and relevance. Do not just list data; explain *why* it's important for the investor this morning.

Output Format:
- The entire output must be in professional markdown format.
- Use the specified headers exactly as written.

JSON Data for the portfolio:
{portfolioJson}

---

Generate the briefing according to this structure:

# AI Morning Briefing for {currentDate}

## Market Snapshot & Biggest Movers
Start with a single sentence summarizing the general mood based on the number of stocks that are up versus down. Then, identify the most significant pre-market movers from the portfolio data.

- **Top Gainers:** List up to 3 stocks with the highest positive 'changesPercentage'. For each, briefly state the percentage change.
- **Top Losers:** List up to 3 stocks with the most negative 'changesPercentage'. For each, briefly state the percentage change.

## Key Portfolio News & Events
Synthesize the **most impactful and relevant** news from the provided articles. Do not simply list headlines. Group related stories (e.g., multiple stories about a single company's earnings) and summarize the key takeaways. Focus on what an investor needs to know right now. If there's no significant news, state that clearly.

## Analyst Sentiment Shifts
Review the 'analyst_grades' for all stocks. Report any notable upgrades, downgrades, or new coverage initiations. Mention the firm and the change in rating (e.g., "from Hold to Buy"). If there are no changes, state "No significant analyst rating changes detected."

## The Bottom Line
Conclude with a 1-2 sentence summary that synthesizes the above points. What is the overall "story" for this portfolio heading into the trading day? Is it facing headwinds from negative news, enjoying tailwinds from positive earnings, or is it a mixed picture?
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

export const OPPORTUNITY_SCANNER_PROMPT = `
Role: You are an AI financial analyst specializing in detecting narrative inflection points and data divergences. Your goal is to help an investor operating on a "buy low, sell high" strategy.

Task: Analyze the provided data packet for {companyName} ({tickerSymbol}). Your task is to identify if a significant bullish or bearish narrative shift is occurring that warrants an investor's immediate attention. You are looking for CONFLICTS and DIVERGENCES between technicals, fundamentals, and news flow.

Data Packet:
{jsonData}

Analysis Framework:
1.  **Bullish Divergence (A "Buy Low" Signal):** Look for situations where the price action is weak, but the underlying news or analyst sentiment is turning positive.
    * Example: The stock price is below its 50-day moving average, but the company just received two analyst upgrades and a wave of positive news about a new product.
2.  **Bearish Divergence (A "Sell High" Signal):** Look for situations where the price action is strong, but the underlying news or analyst sentiment is turning negative.
    * Example: The stock price is near its 52-week high, but several analysts have recently downgraded it to "Hold" and news has emerged about new regulatory scrutiny.

Output Format:
You MUST return a single, clean JSON object. Do not add any text before or after the JSON block.
The JSON object must have the following structure:
{
  "is_significant": boolean,
  "type": "Bullish" | "Bearish" | "Neutral",
  "headline": string,
  "summary": string
}

-   **is_significant**: Set to 'true' only if a clear, actionable divergence is found. Otherwise, set to 'false'.
-   **type**: Classify the signal as "Bullish", "Bearish", or "Neutral".
-   **headline**: A very brief, punchy headline summarizing the divergence (e.g., "Positive News Diverges From Weak Price Action").
-   **summary**: A 1-2 sentence explanation of the specific divergence, mentioning the key data points that are in conflict and explaining the potential opportunity or risk for an investor.

If no significant divergence is found, return:
{
  "is_significant": false,
  "type": "Neutral",
  "headline": "No Significant Shift Detected",
  "summary": "The stock's current price action, news flow, and analyst sentiment appear to be aligned. No actionable divergence was found."
}
`.trim();

export const PORTFOLIO_ANALYSIS_PROMPT = `
Role: You are a professional portfolio analyst AI. Your task is to answer a specific question about an investment portfolio based *only* on the provided JSON data. Your tone should be objective, data-driven, and clear.

Data Instructions:
- Your entire analysis MUST be based exclusively on the provided JSON data which contains profiles, key metrics, and news summaries for every stock in the portfolio.
- Do NOT use any external knowledge or make assumptions beyond what is in the data.
- If the data is insufficient to answer the question, state that clearly and explain what data is missing.

User's Question:
"{userQuestion}"

Portfolio Data (JSON):
{portfolioJson}

Based on the user's question and the portfolio data, provide a concise and direct answer in markdown format.
`.trim();

export const TREND_ANALYSIS_PROMPT = `
Role: You are an AI financial analyst specializing in narrative evolution. Your task is to analyze how the investment story for a company has changed over time by comparing its most recent scanner-generated narrative against its historical narratives and news.

Data Instructions:
- Your analysis MUST be based *only* on the provided JSON data.
- The data includes the latest scanner result, a list of historical results, and a summary of historical news themes.
- Synthesize the information to identify trends, reversals, or new developments.

JSON Data for the analysis:
{jsonData}

Based on the provided data for {companyName} ({tickerSymbol}), generate the following report in markdown format:

# Narrative Trend Analysis: {companyName} ({tickerSymbol})

## 1. Current Narrative vs. History
Directly compare the latest scanner result to the historical ones. Is the current signal a **continuation** of a previous trend, a **reversal** (e.g., flipping from Bearish to Bullish), or a **new narrative** altogether? Explain your reasoning.

## 2. Key Themes Evolution
Analyze the historical news themes and scanner headlines. What were the dominant topics in the past? Have those themes faded, intensified, or been replaced by new ones in the latest scan? (e.g., "The focus has shifted from 'turnaround potential' to 'margin compression concerns'.")

## 3. Conviction Score (1-10)
Based on the data, provide a "Conviction Score" for the LATEST narrative.
- A **high score (8-10)** means the latest narrative is supported by a clear, multi-period trend or a sharp, decisive reversal.
- A **medium score (4-7)** means the narrative is emerging but lacks a long history, or contradicts some previous data.
- A **low score (1-3)** means the latest narrative is noisy, unsupported by historical trends, or appears to be a minor, temporary divergence.
Justify your score in one sentence.

## 4. The Bottom Line
Provide a 1-2 sentence summary for an investor. What is the most important takeaway from this trend analysis? For example: "The consistently bullish narrative around undervaluation is strengthening over time, suggesting the market continues to overlook the company's progress." or "The recent bearish signal about competition is a new and significant risk that has not appeared in previous scans."
`.trim();

export const SEC_RISK_FACTOR_SUMMARY_PROMPT = `
Role: You are an expert risk analyst AI. Your task is to read the "Risk Factors" section from a company's 10-K filing and create a concise, bulleted summary of the **most critical risks** for a potential investor.

Instructions:
- Focus on risks that are specific to the company, its industry, or its strategy, rather than generic boilerplate risks (e.g., "general economic conditions").
- Group related risks under a clear sub-heading if appropriate.
- Each bullet point should be a single, clear sentence.
- The entire summary should be no more than 5-7 bullet points.
- Return ONLY the markdown-formatted summary. Do not add any introductory or concluding sentences.

Raw Text from "Risk Factors" section:
---
{sectionText}
---
`.trim();

export const SEC_MDA_SUMMARY_PROMPT = `
Role: You are an expert financial analyst AI. Your task is to read the "Management's Discussion and Analysis" (MD&A) section from a company's 10-Q filing and create a concise, bulleted summary of the **most important takeaways** for a potential investor.

Instructions:
- Focus on management's commentary on financial performance, key trends, forward-looking outlook, and any significant changes or challenges mentioned.
- Do not just repeat numbers; explain what they *mean* according to management.
- Each bullet point should be a single, clear sentence.
- The entire summary should be no more than 5-7 bullet points.
- Return ONLY the markdown-formatted summary. Do not add any introductory or concluding sentences.

Raw Text from "MD&A" section:
---
{sectionText}
---
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

## 6. The The Investment Case
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
