// fileName: config.js
// --- App Version ---
export const APP_VERSION = "15.1.0-GARP"; // Incremented version

// --- Shared State ---
export const state = {
    db: null,
    auth: null,
    userId: null,
    firebaseConfig: null,
    appIsInitialized: false,
    fmpApiKey: "",
    geminiApiKey: "",
    googleClientId: "",
    portfolioCache: [],
    sessionLog: [],
    reportCache: []
};

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
    MODAL_MANAGE_STOCK: 'manageStockModal',
    MODAL_PORTFOLIO_MANAGER: 'portfolioManagerModal',
    MODAL_STOCK_LIST: 'stockListModal',
    MODAL_SESSION_LOG: 'sessionLogModal',
    MODAL_HELP: 'helpModal',
    // Forms & Inputs
    FORM_API_KEY: 'apiKeyForm',
    FORM_STOCK_RESEARCH: 'stock-research-form',
    INPUT_TICKER: 'ticker-input',
    INPUT_GEMINI_KEY: 'geminiApiKeyInput',
    INPUT_GOOGLE_CLIENT_ID: 'googleClientIdInput',
    // Containers & Elements
    CONTAINER_PORTFOLIO_LIST: 'portfolio-list-container',
    ELEMENT_LOADING_MESSAGE: 'loading-message',
    // Classes
    CLASS_MODAL_OPEN: 'is-open',
    CLASS_BODY_MODAL_OPEN: 'modal-open',
    CLASS_HIDDEN: 'hidden',
    // Database Collections
    DB_COLLECTION_PORTFOLIO: 'portfolio_stocks',
    DB_COLLECTION_FMP_CACHE: 'fmp_cached_data',
    DB_COLLECTION_AI_REPORTS: 'ai_analysis_reports',
};

// --- Diligence Questions (Kept for manual entry/review prompts) ---
export const STRUCTURED_DILIGENCE_QUESTIONS = {
    'Financial Analysis': "Based on this data, is the company's financial story one of high-quality, durable growth, or are there signs of weakening fundamentals? Analyze the relationship between its revenue trend, margin stability, and cash flow quality to form a verdict.",
    'Balance Sheet': "Does the balance sheet represent a fortress capable of funding future growth, or a potential risk? Evaluate its debt-to-equity ratio and current ratio against its peers to determine if its financial health is a competitive advantage or a liability.",
    'Income Statement': "Analyze the income statement for signs of improving operational efficiency. Is the company demonstrating operating leverage (i.e., are earnings growing faster than revenue)? Compare its net profit margin trend to its competitors.",
    'Cash Flow': "Evaluate management's effectiveness as capital allocators. Based on the cash flow statement, are they reinvesting capital effectively to drive growth, or are they returning it to shareholders? Crucially, compare the Return on Invested Capital (ROIC) to its historical trend and its peers to judge their skill.",
    'Earnings & Valuation Snapshot': "Synthesize the key earnings data into a single summary. Please provide the following points: 1) The earnings surprise history for the last four reported quarters (consensus vs. actual). 2) The forward-looking consensus EPS estimates for the current and next full year, along with the implied YoY growth rate. 3) A comparison of the company's TTM P/E and TTM EPS growth rates against its Industry and Sector averages."
};

export const QUALITATIVE_DILIGENCE_QUESTIONS = {
    'Competitive Moat': "What is the source and durability of the company's competitive moat (e.g., brand, network effects, high switching costs, low-cost production), and is there evidence that this advantage is strengthening or weakening over time?",
    'Management Quality': "After reviewing recent earnings call transcripts or shareholder letters, what is your assessment of management's transparency, operational focus, and long-term strategy? Do they demonstrate a rational and shareholder-aligned approach?",
    'Incentive Alignment (The \"Why\")': "Review the latest Proxy Statement (DEF 14A). How is the executive team compensated? Is their pay tied to long-term value drivers (e.g., ROIC, 3-year TSR, FCF per share) or short-term, gameable metrics (e.g., non-GAAP EPS, annual revenue)?",
    'Shareholder Base Quality (The \"Who\")': "Review the institutional ownership (13F filings). Who are the top 5-10 owners? Are they 'sticky money' (e.g., founders, long-term focused funds, index funds) or 'fast money' (e.g., high-turnover hedge funds)? A committed, long-term shareholder base is a significant asset.",
    'The Non-Consensus Thesis (The "Edge")': "Evaluate potential non-consensus beliefs about this company. Select the *single* belief you find most compelling and likely to be the primary driver of future financial outperformance, distinct from the consensus view (e.g., as reflected in the 'Market Sentiment' report). Explain *why* this specific belief makes the company 'great' when others only see it as 'good', detailing the expected mechanism of financial impact. Finally, **estimate the timeframe (e.g., 1-3 years, 5+ years) over which you expect this edge to materially impact the investment thesis.**",
    'Core Thesis & Linchpin Risk (The "Linchpin")': "First, clearly state your single, most important investment thesis in one sentence (The 'Edge'). Second, identify the single most critical 'linchpin' risk or assumption that, if proven wrong, would invalidate this entire thesis. Finally, describe the specific evidence or data (e..g, a specific metric, a competitor's action) you will monitor to track this risk."
};

export const MARKET_SENTIMENT_QUESTIONS = {
    'Analyst Consensus': "Based on the LSEG and other analyst reports, what is the overall analyst rating (e.g., Bullish 8.6/10), and what is the breakdown of Buy/Neutral/Sell opinions?",
    'Fundamental Factors': "Summarize the S&P Global Market Intelligence factor scores. What are the scores for Valuation, Quality, Growth Stability, and Financial Health, and how do they compare to the sector median?",
    'Technical Sentiment': "According to the Trading Central report, what is the technical sentiment for the short-term (2-6 weeks), mid-term (6 weeks-9 months), and long-term (9 months-2 years)?",
    'Price Performance': "Summarize the stock's price performance over key timeframes (e.g., 1-month, 3-month, YTD, 1-year, 5-year). Is the stock showing short-term weakness but long-term strength, or vice versa?",
    'Short Interest': "What is the current Short % of Float, and has the number of shares short increased or decreased recently? What is the 'days to cover' ratio?",
    'Competitor Snapshot Comparison': "Based on the competitor snapshot, how does the company stack up against its top direct competitors (e.g., CCO, OUT) and the industry average regarding the LSEG StarMine Equity Summary Score, 52-week price performance, and forward P/E (this year's estimate)?",
    'Insider Activity Analysis': "Review the recent insider transaction data. Are key insiders predominantly buying or selling shares? Note any significant patterns (e.g., volume, timing, specific executives/directors involved) and assess the potential signal regarding insider sentiment."
};

// --- Review Checklists (Kept for now) ---
export const QUARTERLY_REVIEW_QUESTIONS = {
    'Results vs. Expectations': "Did the company meet, beat, or miss revenue and EPS expectations? Analyze the key drivers behind the results and any significant one-time items.",
    'Quantitative Thesis Check': "How have the key GARP Scorecard metrics (e.g., ROIC, D/E, forward growth, valuation) changed since the last review? Does the quantitative data still support the original thesis?",
    'Management Outlook': "Summarize management's forward-looking guidance and commentary from the earnings call. Are they more optimistic or pessimistic, and what are the key opportunities and risks they highlighted?",
    'Qualitative Thesis Check': "Does management's commentary and the quarter's results confirm or challenge the qualitative bull/bear case from the original Investment Memo? Has the core investment thesis evolved?",
    'Action Plan': "Based on this review, what is the new investment decision? (e.g., Hold, Add, Trim, Sell). Justify the decision."
};

export const ANNUAL_REVIEW_QUESTIONS = {
    'Full-Year Performance vs. Guidance': "Did the company meet its full-year guidance for revenue and EPS? Analyze the primary drivers of outperformance or underperformance for the year.",
    'Strategic Progress & Capital Allocation': "Review the company's strategic initiatives from the start of the year. Was capital allocated effectively (e.g., acquisitions, buybacks, R&D)? How has ROIC trended over the full year?",
    'Updated Competitive Landscape': "Based on the 10-K's 'Competition' and 'Risk Factors' sections, have there been any material changes to the competitive environment or long-term business risks?",
    'Long-Term Thesis Validation': "Does the full-year performance and management's outlook for the next year strengthen or weaken the original long-term investment thesis? Re-evaluate the core bull and bear cases.",
    'Forward-Looking Action Plan': "Given the full-year results and outlook, what is the investment plan for the stock over the next 6-12 months? (e.g., Hold, Add on weakness, Trim on strength, Exit position). Justify the plan."
};

// --- Sector KPI Suggestions ---
export const SECTOR_KPI_SUGGESTIONS = {
    'Technology': [
        { name: 'Revenue Growth (YoY)', description: 'Measures the increase in revenue over the past year.' },
        { name: 'Customer Acquisition Cost (CAC)', description: 'The cost to acquire a new customer.' },
        { name: 'Customer Lifetime Value (LTV)', description: 'The total revenue a company can expect from a single customer.' },
        { name: 'LTV/CAC Ratio', description: 'Compares customer lifetime value to acquisition cost. A 3:1 ratio is often considered healthy.' },
        { name: 'Monthly Active Users (MAU)', description: 'Total unique users who engage with the product in a month.' },
        { name: 'Daily Active Users (DAU)', description: 'Total unique users who engage with the product daily.' },
        { name: 'DAU/MAU Ratio', description: 'Measures user stickiness and engagement.' },
        { name: 'Net Revenue Retention (NRR)', description: 'Measures revenue from existing customers, accounting for upsells, downgrades, and churn.' },
        { name:S: 'Gross Churn', description: 'Percentage of revenue or customers lost in a period.' },
        { name: 'Rule of 40', description: 'A benchmark for SaaS companies where (YoY Revenue Growth %) + (Free Cash Flow Margin %) should be 40% or more.' },
        { name: 'R&D as % of Revenue', description: 'Indicates investment in future innovation.' }
    ],
    'Healthcare': [
        { name: 'Revenue Growth (YoY)', description: 'Measures the increase in revenue over the past year.' },
        { name: 'Medical Loss Ratio (MLR)', description: '(For Insurers) The percentage of premium revenue spent on medical claims.' },
        { name: 'Occupancy Rate', description: '(For Providers) The percentage of available beds/rooms that are occupied.' },
        { name: 'Revenue per Patient', description: 'Average revenue generated from each patient.' },
        { name: 'Drug Pipeline Status', description: '(For Pharma/Biotech) Number of drugs in Phase 1, 2, 3, and pending approval.' },
        { name: 'R&D as % of Revenue', description: '(For Pharma/Biotech) Investment in new drug development.' },
        { name: 'Patient Enrollment Rate', description: '(For Clinical Trials) Speed at which patients are enrolled in studies.' }
    ],
    'Financials': [
        { name: 'Net Interest Margin (NIM)', description: '(For Banks) The difference between interest income earned and interest paid out.' },
        { name: 'Efficiency Ratio', description: '(For Banks) Non-interest expenses as a percentage of revenue. Lower is better.' },
        { name: 'Loan-to-Deposit Ratio', description: '(For Banks) Measures a bank\'s liquidity.' },
        { name: 'Return on Assets (ROA)', description: 'How profitable a company is relative to its total assets.' },
        { name: 'Book Value per Share', description: 'The net asset value of a company divided by its number of outstanding shares.' },
        { name: 'Price-to-Book (P/B) Ratio', description: 'Compares a company\'s market value to its book value.' },
        { name: 'Assets Under Management (AUM)', description: '(For Asset Managers) The total market value of investments managed.' },
        { name: 'Combined Ratio', description: '(For Insurers) Incurred losses and expenses as a percentage of earned premiums. Below 100% is profitable.' }
    ],
    'Consumer Discretionary': [
        { name: 'Same-Store Sales (SSS) Growth', description: 'Measures revenue growth from existing locations open for at least one year.' },
        { name: 'Inventory Turnover', description: 'How many times a company sells and replaces its inventory in a period.' },
        { name: 'Gross Margin %', description: 'Measures profitability after accounting for the cost of goods sold.' },
        { name: 'E-commerce as % of Total Sales', description: 'The percentage of revenue generated from online sales.' },
        { name: 'Foot Traffic Trends', description: 'Change in the number of customers visiting physical stores.' },
        { name: 'Average Order Value (AOV)', description: 'The average amount spent each time a customer places an order.' }
    ],
    'Consumer Staples': [
        { name: 'Organic Revenue Growth', description: 'Revenue growth excluding the effects of acquisitions or divestitures.' },
        { name: 'Volume Growth vs. Price/Mix', description: 'Breaks down revenue growth into how much came from selling more units vs. raising prices.' },
        { name: 'Market Share', description: 'The company\'s sales as a percentage of total sales in its industry.' },
        { name: 'Brand Penetration', description: 'Percentage of target market customers who have purchased the brand.' },
        { name: 'Dividend Payout Ratio', description: 'The percentage of earnings paid out as dividends.' }
    ],
    'Industrials': [
        { name: 'Backlog', description: 'The total value of confirmed orders that have not yet been fulfilled.' },
        { name: 'Book-to-Bill Ratio', description: 'The ratio of new orders received to units shipped and billed. >1 indicates growing demand.' },
        { name: 'Capacity Utilization', description: 'The percentage of a company\'s potential output that is being used.' },
        { name: 'Operating Margin %', description: 'Measures operational efficiency.' },
        { name: 'Working Capital as % of Sales', description: 'Measures liquidity and operational efficiency.' }
    ],
    'Energy': [
        { name: 'Production Growth (YoY)', description: '(For E&P) Increase in oil and gas production.' },
        { name: 'Proved Reserves (1P)', description: 'The amount of oil and gas that can be economically recovered with reasonable certainty.' },
        { name: 'Finding and Development (F&D) Costs', description: 'The cost to find and develop new reserves.' },
        { name: 'Realized Price per Barrel/MCF', description: 'The actual price received for oil or gas, including hedging.' },
        { name:Read: 'Operating Costs per Barrel/MCF', description: 'The cost to extract the oil or gas.' }
    ],
    'Utilities': [
        { name: 'Rate Base Growth', description: 'The growth in the value of assets on which a utility is allowed to earn a regulated rate of return.' },
        { name: 'Allowed Return on Equity (ROE)', description: 'The ROE that regulators permit the utility to earn.' },
        { name: 'O&M Expense Control', description: 'Operations & Maintenance expenses, a key cost to manage.' },
        { name: 'Customer Growth', description: 'Increase in the number of customers in the utility\'s service area.' },
        { name: 'Dividend Yield', description: 'The annual dividend per share as a percentage of the stock\'s price.' }
    ],
    'Real Estate': [
        { name: 'Funds From Operations (FFO) per Share', description: 'A key measure of profitability for REITs.' },
        { name: 'Adjusted FFO (AFFO) per Share', description: 'FFO adjusted for recurring capital expenditures.' },
        { name: 'Net Operating Income (NOI) Growth', description: 'Measures the income growth from a portfolio of properties.' },
        { name: 'Same-Property NOI Growth', description: 'Measures NOI growth from properties owned for at least one year.' },
        { name: 'Occupancy Rate', description: 'The percentage of leasable space that is currently rented.' },
        { name: 'Net Debt to EBITDA', description: 'A measure of leverage.' }
    ],
    'Materials': [
        { name: 'Volume Growth', description: 'Increase in the physical quantity of goods sold.' },
        { name: 'Price per Ton/Pound', description: 'The realized selling price for the commodity.' },
        { name: 'Cash Cost per Ton/Pound', description: 'The cash cost to produce one unit of the commodity.' },
        { name: 'Capacity Utilization', description: 'The percentage of a plant\'s potential output that is being used.' }
    ],
    'Communication Services': [
        { name: 'Average Revenue Per User (ARPU)', description: 'Measures the revenue generated per user or subscriber.' },
        { name: 'Subscriber Growth', description: 'The rate at which new customers are being added.' },
        { name: 'Churn Rate', description: 'The percentage of subscribers who discontinue their service.' },
        { name: 'Content Spend', description: '(For Media) The amount spent on creating or acquiring new content.' },
        { name: 'Ad Revenue Growth', description: '(For Ad-Supported) The growth in revenue from advertising.' }
    ]
};

// --- AI PROMPTS ---

// Helper Prompts
const PEER_IDENTIFICATION_PROMPT = `
Role: You are a financial analyst AI. Your task is to identify a company's primary competitors based on its profile.
Task: Read the provided company profile and identify the top 3-5 *publicly traded* competitors.
Company Profile: {jsonData}
Format: Return a JSON object with a single key "peers", which is an array of ticker symbols.
Example: { "peers": ["AAPL", "MSFT", "GOOGL"] }
Constraint: Only return competitors mentioned in the profile or widely known direct competitors. Do not guess. If no peers are identifiable, return { "peers": [] }.
`;
const PEER_IDENTIFICATION_FALLBACK_PROMPT = `
Role: You are a financial analyst AI. Your task is to identify a company's primary competitors based on its name and industry.
Task: The initial competitor identification failed. Please use the company name ({companyName}) and industry ({industry}) to identify the top 3-5 *publicly traded* competitors.
Format: Return a JSON object with a single key "peers", which is an array of ticker symbols.
Example: { "peers": ["AAPL", "MSFT", "GOOGL"] }
Constraint: Only return widely known direct competitors. Do not guess. If no peers are identifiable, return { "peers": [] }.
`;
const SECTOR_MOMENTUM_PROMPT = `
Role: You are a concise market commentator.
Task: I will provide you with JSON data showing the 1-month, 3-month, and Year-to-Date (YTD) performance for all 11 GICS sectors.
Your job is to analyze this data and provide a brief, 2-3 sentence summary of the key trends.
Key things to identify:
1.  **Leadership:** Which 1-2 sectors are showing the strongest *relative strength* (e.g., positive across all timeframes, or strongest YTD)?
2.  **Laggards:** Which 1-2 sectors are the weakest (e.g., negative across all timeframes, or weakest YTD)?
3.  **Divergence:** Is there any notable divergence (e.g., a sector is strong YTD but very weak in the last 1-month)?

Data:
{jsonData}

Constraint: Provide only the 2-3 sentence summary. Do not add a greeting or any other text.
`;

// Core Analysis Prompts
const MOAT_ANALYSIS_PROMPT = `
Role: You are a financial analyst AI inspired by Pat Dorsey's "The Little Book That Builds Wealth," with a focus on competitive moats.
Task: Analyze the provided 10-year financial data for {companyName} ({tickerSymbol}) to identify potential competitive advantages.

Data:
{jsonData}

Analysis Structure:
1.  **ROIC Trend Analysis:**
    * Review the 10-year 'roicTrend' data.
    * Is the ROIC consistently high (e.g., >15%)? Is it stable, growing, or declining?
    * What does this trend imply about the company's ability to generate returns on its capital, and the durability of any potential moat?

2.  **Profitability Trend Analysis:**
    * Review the 10-year 'profitabilityTrends' (net, operating, gross margins).
    * Are the margins stable or expanding? This suggests pricing power (an intangible asset or high switching cost moat) or a cost advantage.
    * Are margins declining? This suggests intense competition or a weakening moat.

3.  **Reinvestment & Moat Source:**
    * Review the 'reinvestmentTrends' (capex vs. rdExpenses).
    * If R&D is high relative to capex, the moat might be an intangible asset (e.g., patents, brand) or network effect.
    * If capex is high, the moat might be a cost advantage (e.g., economies of scale, efficient process) or tied to a unique asset.
    * How does the company's description ('qualitativeClues') support one of these moat types?

4.  **Final Moat Assessment:**
    * Based on all the data, synthesize your findings into a single assessment.
    * Does {companyName} show quantitative evidence of a 'Wide Moat', 'Narrow Moat', or 'No Moat'?
    * Justify your conclusion by linking the financial trends (ROIC, margins) to a specific potential moat source (e.g., "The company's consistently high ROIC > 20% and expanding operating margins, combined with significant R&D spending, strongly suggest a 'Wide Moat' based on intangible assets (brand and patents).").
`;
const CAPITAL_ALLOCATORS_PROMPT = `
Role: You are a financial analyst AI, acting as a "Capital Allocators" expert, inspired by William Thorndike's "The Outsiders."
Task: Analyze the provided 10-year financial data for {companyName} ({tickerSymbol}) to evaluate management's effectiveness at capital allocation.

Data:
{jsonData}

Analysis Structure (Follow this precisely):

1.  **Cash Flow Priorities (10-Year Summary):**
    * Using the 'summaryTotals' data, state the total 10-year figures for:
        * Total Reinvestment (Capex + Acquisitions)
        * Total Shareholder Returns (Dividends + Buybacks)
    * Based on these totals, what has been management's primary priority over the last decade?

2.  **Reinvestment Effectiveness:**
    * Review the 'reinvestmentEffectiveness' data ('roicTrend', 'roeTrend', 'revenueGrowth').
    * Is there a clear correlation between periods of high reinvestment (capex/acquisitions) and subsequent growth in revenue, profitability, and, most importantly, ROIC/ROE?
    * Does management appear to be deploying capital into high-return projects?

3.  **Acquisition History & Goodwill:**
    * Review the 'acquisitionHistory' data.
    * Is the 'goodwill' on the balance sheet growing significantly?
    * Compare the amount spent on 'acquisitions' to the growth in 'goodwill'.
    * Does it appear management has been successful at integrating acquisitions (judged by the overall ROIC trend), or are they potentially overpaying and destroying value?

4.  **Shareholder Returns (Buybacks & Dividends):**
    * Review the 'shareholderReturns' data.
    * **Buybacks:** Look at 'buybacksWithValuation'. Does management appear to repurchase shares opportunistically (i.e., buying back more shares in years when P/E or P/B ratios were low)?
    * **Dividends:** Look at 'fcfPayoutRatioTrend'. Is the dividend well-covered by free cash flow, and is the payout ratio stable, growing, or erratic?

5.  **Final Verdict:**
    * Synthesize all points into a final verdict.
    * Does management behave like an "Outsider" (i.e., rational, opportunistic, ROIC-focused, and agnostic between buybacks, dividends, M&A, or reinvestment)?
    * Provide a 1-2 sentence summary of their capital allocation skill.
`;
const GARP_CANDIDACY_PROMPT = `
Role: You are a GARP (Growth at a Reasonable Price) analyst AI.
Task: Analyze the provided {companyName} ({tickerSymbol}) data against GARP criteria. The data includes a quantitative scorecard, peer averages, and peer performance changes.

Data:
{jsonData}

Analysis Structure (Follow this precisely):

## GARP Analysis Report: {companyName} ({tickerSymbol})

### 1. Quantitative GARP Candidacy
Based on the provided scorecard, does {companyName} meet the criteria for a GARP investment?

* **Growth:** (Analyze 'EPS Growth (Next 1Y)', 'EPS Growth (5Y)', 'Revenue Growth (5Y)'). Are these metrics strong and consistent?
* **Quality & Stability:** (Analyze 'Return on Invested Capital', 'Return on Equity', 'Profitable Yrs (5Y)', 'Quarterly Earnings Progress'). Does the company show signs of a durable, high-quality business?
* **Financial Health:** (Analyze 'Debt-to-Equity', 'Interest Coverage'). Is the balance sheet healthy?
* **Valuation:** (Analyze 'PEG Ratio', 'Forward P/E', 'Price to FCF', 'P/S Ratio'). Do the valuation multiples appear reasonable or attractive *relative to the growth prospects*?

### 2. Peer & Sector Context
* **Peer Comparison:** How does {companyName}'s scorecard (especially ROIC, Growth, and P/E) compare to the 'peerAverages'? Is it a best-in-class operator, average, or a laggard?
* **Sector Trend:** (If 'peerDataChanges' is available and shows a clear trend, comment on it). Is the sector facing headwinds or tailwinds?

### 3. Bull & Bear Case Synthesis

* **Bull Case (GARP Thesis):** Based on the data, what is the primary bull case? (e.g., "The company appears to be a high-quality compounder, with a 20% ROIC and 15% EPS growth, trading at a reasonable 1.2 PEG ratio.")
* **Bear Case (Key Risks):** What are the most significant risks or red flags in the scorecard? (e.g., "The 10% revenue growth is solid, but the high D/E ratio of 1.5 and negative Price to FCF are major concerns.")

### 4. GARP Conviction Score & Confidence
* **GARP Conviction Score:** The model calculated a score of **{jsonData.garpConvictionScore} / 100**.
* **Analyst Confidence:** Based *only* on the data provided (scorecard, peer data), rate your confidence in this stock as a GARP candidate (High, Medium, Low).
* **Justification:** Briefly explain *why* you have this level of confidence. (e.g., "High confidence: The score is strong, and the company beats peer averages in all key quality and growth metrics." or "Low confidence: The score is borderline, and the company is trading at a significant premium to peers despite having lower growth.").

## Actionable Diligence Questions
Based on your analysis, provide **two** "Human-Led Questions" to investigate further and **two** "Suggested AI Investigation Queries" to run next.

* **Human-Led Question:** (A qualitative question for an earnings call or 10-K review)
* **Suggested AI Investigation Query:** (A specific, actionable query for the AI)
* **Human-Led Question:** (A qualitative question for an earnings call or 10-K review)
* **Suggested AI Investigation Query:** (A specific, actionable query for the AI)
`;
const GARP_CONVICTION_SCORE_PROMPT = `
Role: You are an AI assistant explaining a financial metric.
Task: Explain the "GARP Conviction Score" based on the provided data summary.

Data Summary:
{jsonData}

Constraint: Provide a 1-2 paragraph explanation in markdown. Do not add a greeting.
`;
const QARP_ANALYSIS_PROMPT = `
Role: You are a QARP (Quality at a Reasonable Price) analyst AI, with a heavy bias towards *Quality*.
Task: Analyze the provided scorecard data for {companyName} ({tickerSymbol}).

Data:
{jsonData}

Analysis Structure (Follow this precisely):

## QARP Analysis Report: {companyName} ({tickerSymbol})

### 1. Quality Assessment (The "Q")
* **Profitability & Moat:** (Analyze 'Return on Invested Capital', 'Return on Equity'). Are these metrics exceptional (>20%), high (>15%), or merely adequate? What does this imply about the business's competitive moat?
* **Financial Health:** (Analyze 'Debt-to-Equity', 'Interest Coverage'). Is the balance sheet a fortress, or does it carry risk?
* **Consistency:** (Analyze 'Profitable Yrs (5Y)', 'Rev. Growth Stability'). Is this a stable, all-weather business, or is it cyclical/unpredictable?
* **Quality Verdict:** (Assign a verdict: 'Exceptional Quality', 'High Quality', or 'Average Quality').

### 2. Price Assessment (The "RP")
* **Valuation vs. Growth:** (Analyze 'PEG Ratio'). Is the price justified by the growth?
* **Valuation vs. Peers/Cash Flow:** (Analyze 'Forward P/E' and 'Price to FCF'). Is the stock trading at a reasonable multiple, or is it expensive?
* **Price Verdict:** (Assign a verdict: 'Reasonably Priced', 'Fairly Priced', or 'Expensive').

### 3. QARP Thesis
* Synthesize your findings.
* **Is this a QARP candidate?** (Yes/No)
* **Justification:** (Provide a 1-2 sentence justification, e.g., "Yes. The company is 'Exceptional Quality' (30% ROIC, 0.2 D/E) and 'Reasonably Priced' (1.5 PEG, 20x P/FCF), making it a prime QARP candidate." or "No. While the company is 'High Quality', its 'Expensive' valuation (3.0 PEG, 40x P/FCF) fails the 'Reasonable Price' test.")
`;
const LONG_TERM_COMPOUNDER_PROMPT = `
Role: You are a long-term, business-focused investment analyst, inspired by investors like Terry Smith and Chuck Akre.
Task: Analyze the provided 10-year financial data for {companyName} ({tickerSymbol}) to determine if it qualifies as a "Long-Term Compounder." Your focus should be on identifying a high-quality business that can sustainably reinvest its capital at high rates of return.

Data:
{jsonData}

Analysis Structure (Follow this precisely):

## Long-Term Compounder Memo: {companyName} ({tickerSymbol})

### 1. The Business (Quality & Moat)
* **Returns on Capital:** Based on the 'moatAnalysis.roicTrend', does this company *consistently* generate high returns on capital (ideally > 15-20%)?
* **Profitability:** Based on 'moatAnalysis.profitabilityTrends', are gross and operating margins high and stable/expanding?
* **Verdict:** Does this business possess the high-quality, high-return characteristics of a compounder?

### 2. Management (Capital Allocation)
* **Reinvestment Skill:** Based on 'capitalAllocation.reinvestmentEffectiveness', does management have a history of reinvesting capital (capex, M&A) and achieving high returns (ROIC/ROE)?
* **Shareholder-Friendliness:** Based on 'capitalAllocation.shareholderReturns', does management return excess capital to shareholders (buybacks, dividends) in a rational, opportunistic way?
* **Verdict:** Does management act like skilled, owner-oriented capital allocators?

### 3. Reinvestment Opportunity (The "Long Runway")
* **Past Reinvestment:** Based on 'capitalAllocation.cashFlowPriorities' and 'summaryTotals', has the company historically favored reinvestment (capex, M&A) over shareholder returns?
* **Future Potential:** Synthesize all data. Does this high-quality business appear to have a long runway for future high-return reinvestment, or is it a mature "cash cow" that primarily returns capital?

### 4. Final Recommendation
* **Is {companyName} a "Long-Term Compounder"?** (Yes / No / Borderline)
* **Justification:** (Provide a 2-3 sentence summary synthesizing your findings on business quality, management skill, and reinvestment runway to justify your recommendation.)
`;
const BMQV_MEMO_PROMPT = `
Role: You are a value-oriented investment analyst, inspired by the principles of Buffett and Munger (Business, Management, Quality, Value).
Task: Analyze the provided 10-year financial data for {companyName} ({tickerSymbol}) to assess its investment merits.

Data:
{jsonData}

Analysis Structure (Follow this precisely):

## Buffett-Munger Q&V Memo: {companyName} ({tickerSymbol})

### 1. Business Quality
* **Moat:** Based on the 'moatAnalysis' data (ROIC, margins), does this business have a durable competitive advantage (i.e., a wide/narrow moat)?
* **Profitability:** Are its profitability trends (margins) strong and consistent?

### 2. Management Quality
* **Capital Allocation:** Based on the 'capitalAllocation' data, does management demonstrate skill and rationality in deploying capital (reinvestment, M&A, buybacks, dividends)?
* **ROIC/ROE Trend:** Is management actively enhancing or at least maintaining the high returns of the business?

### 3. Value
* **(This is a qualitative assessment of the framework, not a price target.)**
* Given the assessments of Business Quality and Management Quality, is this the *type* of company that would be a "wonderful business" to own?
* Does the 'capitalAllocation.shareholderReturns.buybacksWithValuation' data suggest that management has historically repurchased shares at rational prices?

### 4. Final Verdict
* **Is {companyName} a "Wonderful Business"?** (Yes / No / Borderline)
* **Justification:** (Provide a 2-3 sentence summary synthesizing your findings. e.g., "Yes. The company demonstrates a clear wide moat with 25%+ ROIC, and management has skillfully reinvested capital to grow the business while opportunistically repurchasing shares.")
`;

// Synthesis Prompts
const UPDATED_GARP_MEMO_PROMPT = `
Role: You are a GARP analyst AI synthesizing multiple reports into a final investment memo.
Task: Create a formal investment memo for {companyName} ({tickerSymbol}). You must synthesize the data from the 'GARP Candidacy Report', 'Structured Diligence Memo', 'Qualitative Diligence Memo', and the 'GARP Scorecard'.

**Data:**
1.  **GARP Scorecard (JSON):** {scorecardJson}
2.  **GARP Candidacy Report (Markdown):** {garpCandidacyReport}
3.  **Structured Diligence Memo (Markdown):** {structuredDiligenceMemo}
4.  **Qualitative Diligence Memo (Markdown):** {qualitativeDiligenceMemo}
5.  **Market Sentiment Memo (Markdown):** {marketSentimentMemo}

**Memo Structure (Follow this precisely):**

## Investment Memo: {companyName} ({tickerSymbol})

### 1. Recommendation
(State a clear recommendation: **Buy**, **Hold**, or **Sell**. Justify it in 1-2 sentences that synthesize the core thesis.)

### 2. Core Thesis
(This is the "Bull Case." Synthesize the most compelling arguments from the GARP Candidacy Report and the Qualitative/Structured Memos. Focus on the *growth story* and the *quality metrics* that justify the investment.)

### 3. Key Risks & Bear Case
(Synthesize the primary risks identified in the GARP Candidacy Report, Qualitative Memo (e.g., moat degradation, management), and Structured Memo (e.g., balance sheet weakness, poor cash flow). What is the main reason this investment could fail?)

### 4. Valuation Analysis
(Synthesize the valuation discussion from the GARP Candidacy Report and the GARP Scorecard. Is the stock cheap, reasonable, or expensive relative to its growth and quality? Reference key metrics like PEG, Forward P/E, and P/FCF.)

### 5. Market Sentiment
(Summarize the findings from the 'Market Sentiment Memo'. Does the market agree with the thesis (analysts bullish, good momentum) or disagree (analysts bearish, poor momentum, high short interest)?)

### 6. Final Verdict
(A concluding 2-3 sentence summary that weighs the Thesis (Bull Case) against the Risks (Bear Case) and Valuation to reaffirm your recommendation.)
`;
const PORTFOLIO_GARP_ANALYSIS_PROMPT = `
Role: You are a portfolio manager AI.
Task: I will provide you with JSON data for all stocks in your portfolio. Each stock has a 'garpConvictionScore' and a full 'scorecard'.
Analyze this data and provide a high-level overview of the portfolio's characteristics.

Data:
{jsonData}

Analysis Structure:
1.  **Portfolio Conviction:**
    * What is the *average* 'garpConvictionScore' for the portfolio?
    * What is the *distribution* of scores (e.g., "The portfolio is concentrated in high-conviction names (X stocks > 75), with a few medium-conviction holdings (Y stocks 50-75).")?

2.  **Portfolio Profile (Strengths):**
    * Based on the aggregated scorecards, what are the *strongest* characteristics of this portfolio?
    * (e.g., "The portfolio is overwhelmingly composed of high-quality businesses, with an average ROIC of 22% and low D/E ratios.")
    * (e.g., "The portfolio is geared for growth, with an average 'EPS Growth (Next 1Y)' of 18%.")

3.  **Portfolio Profile (Weaknesses):**
    * Based on the aggregated scorecards, what are the *weakest* characteristics or potential risks?
    * (e.g., "The primary risk is valuation; the portfolio's average Forward P/E is 28x, suggesting these stocks are expensive.")
    * (e.g., "The portfolio's 5-year revenue growth is sluggish at an average of 4%, indicating a bias towards mature, slow-growing companies.")

4.  **Key Holdings to Review:**
    * Identify the stock with the *highest* 'garpConvictionScore' as a "Source of Strength."
    * Identify the stock with the *lowest* 'garpConvictionScore' as a "Potential Underperformer."
`;
const POSITION_ANALYSIS_PROMPT = `
Role: You are a GARP (Growth at a Reasonable Price) analyst AI.
Task: You are reviewing an existing position in {companyName} ({tickerSymbol}). Your goal is to re-evaluate the original investment thesis against the position's actual performance and current market data.

**Data:**
1.  **Original Investment Memo / Thesis:**
    \`\`\`
    {investmentMemoContent}
    \`\`\`
2.  **Updated Deep-Dive Analysis:**
    * **Moat Report:** {moatAnalysisReport}
    * **Capital Allocation Report:** {capitalAllocatorsReport}
3.  **Position Details (Your Holding):**
    \`\`\`json
    {positionDetails}
    \`\`\`
4.  **Current Market Price:** {currentPrice}

**Analysis Structure (Follow this precisely):**

## Position Review: {companyName} ({tickerSymbol})

### 1. Original Thesis vs. Current Reality
* **Original Thesis:** (Summarize the 1-2 key pillars of the 'Original Investment Memo'.)
* **Thesis Update:** Based on the new 'Moat Report' and 'Capital Allocation Report', is the original thesis still 100% intact, has it strengthened, or has it weakened? (e.g., "The Moat Report confirms the original thesis of a wide moat, with ROIC remaining stable at 25%.")

### 2. Performance Review
* **Your Position:** (Reference the 'positionDetails'). "You are currently holding **{positionDetails.totalShares} shares** with an average cost of **{positionDetails.averageCostPerShare}**. You have an **unrealized gain/loss of {positionDetails.unrealizedGainLoss}**."
* **Market vs. Thesis:** Has the market agreed with the thesis (stock is up) or disagreed (stock is down)?

### 3. Valuation Re-Assessment
* **Original Price:** The original thesis was based on a price near your cost basis of **{positionDetails.averageCostPerShare}**.
* **Current Price:** The stock is now at **{currentPrice}**.
* **Verdict:** Does the *current* price still represent "Growth at a *Reasonable* Price" given the updated analysis, or has it become overvalued (if up) or a potential value trap (if down)?

### 4. Actionable Recommendation
* Based on your analysis of the thesis strength and current valuation, what is the recommended action?
    * **Hold:** The thesis is intact, and the valuation is still reasonable.
    * **Add (Buy More):** The thesis has strengthened, and the valuation remains attractive.
    * **Trim (Sell Some):** The thesis is intact, but the position has become overvalued.
    * **Sell (Exit Position):** The thesis is broken, or the stock has become wildly overvalued.
* **Justification:** (Provide a 2-3 sentence explanation for your recommendation.)
`;
const UPDATED_QARP_MEMO_PROMPT = `
Role: You are a QARP (Quality at a Reasonable Price) analyst AI synthesizing an updated memo.
Task: Create a formal QARP memo for {companyName} ({tickerSymbol}). You must synthesize data from the 'GARP Scorecard' (as your primary data source) and the 'Diligence Log' (as a source of *recent updates*).

**Data:**
1.  **GARP Scorecard (JSON):** {jsonData}
2.  **Recent Diligence Log (Markdown):** {diligenceLog}

**Memo Structure (Follow this precisely):**

## Updated QARP Memo: {companyName} ({tickerSymbol})

### 1. Quality Assessment
* **Profitability & Moat (Scorecard):** (Analyze 'Return on Invested Capital', 'Return on Equity'). Are these metrics exceptional (>20%), high (>15%), or merely adequate?
* **Financial Health (Scorecard):** (Analyze 'Debt-to-Equity', 'Interest Coverage'). Is the balance sheet a fortress, or does it carry risk?
* **Recent Developments (Diligence Log):** Does the 'Diligence Log' contain any new information (e.g., from 8-Ks or Q&A) that impacts the Quality assessment?

### 2. Price Assessment
* **Valuation (Scorecard):** (Analyze 'PEG Ratio', 'Forward P/E', 'Price to FCF'). Do the multiples appear reasonable, fair, or expensive relative to the company's growth and quality?
* **Recent Developments (Diligence Log):** Does the 'Diligence Log' contain any new information that impacts the Price assessment?

### 3. Updated Recommendation
* **Is this a QARP candidate?** (Yes / No / Hold)
* **Justification:** (Provide a 2-3 sentence justification, synthesizing the Scorecard data *and* any new insights from the Diligence Log to make a final, updated recommendation.)
`;
const FINAL_INVESTMENT_THESIS_PROMPT = `
Role: You are a "Portfolio Manager" AI.
Task: You have been presented with four distinct analyst reports, each providing a "buy/sell/hold" recommendation from a different investment style (GARP, QARP, Long-Term Compounder, Buffett-Munger Q&V). Your job is to synthesize these, identify the *key conflict* or *consensus*, and make a *final, decisive recommendation* with a portfolio allocation size.

**Data:**
1.  **Company:** {companyName} ({tickerSymbol})
2.  **Overall GARP Conviction Score:** {garpScore} / 100
3.  **Analyst Summaries (JSON):**
    \`\`\`json
    {analystSummaries}
    \`\`\`

**Memo Structure (Follow this precisely):**

## Final Investment Thesis: {companyName} ({tickerSymbol})

### 1. Summary of Analyst Recommendations
| Analyst Style | Recommendation | Key Rationale |
| :--- | :--- | :--- |
| **GARP Memo** | {analystSummaries.InvestmentMemo.recommendation} | {analystSummaries.InvestmentMemo.rationale} |
| **QARP Analysis** | {analystSummaries.QarpAnalysis.recommendation} | {analystSummaries.QarpAnalysis.rationale} |
| **Long-Term Compounder** | {analystSummaries.LongTermCompounder.recommendation} | {analystSummaries.LongTermCompounder.rationale} |
| **Buffett-Munger Q&V** | {analystSummaries.BmqvMemo.recommendation} | {analystSummaries.BmqvMemo.rationale} |

### 2. Key Point of Conflict / Consensus
(Identify the main theme. Are all analysts in agreement? Or is there a central conflict? e.g., "The key point of conflict is **Valuation**. All analysts agree this is a 'Wonderful Business' of the highest quality (BMQV, Compounder, QARP), but the GARP analyst argues the price is too high, while the QARP analyst sees it as 'Reasonable'.")

### 3. Final Recommendation & Rationale
(This is YOUR final decision as the Portfolio Manager.)
* **Synthesize:** Weigh the consensus or conflict. Which argument is most compelling?
* **Decide:** Make a final, decisive recommendation (e.g., "High Conviction Buy," "Strong Buy," "Hold/Monitor," "Sell/Pass").
* **Allocate:** Assign a portfolio allocation percentage based on your conviction (e.g., 4-5% for High Conviction, 2-3% for Strong Buy, 1% for Hold/Monitor).
* **Justify:** Write a 1-2 sentence justification for your decision.

### Final Recommendation
**Recommendation Grade:** [Your Grade Here]
**Suggested Allocation:** [Your % Here]
(Your 1-2 sentence justification here)

### 4. Implications for Portfolio Management
* **For a New Investment:** (e.g., "Initiate a 2-3% position. The consensus on business quality is overwhelming, and the QARP analysis provides confidence that the price is reasonable for a long-term hold.")
* **For an Existing Position:** (e.g., "Trim the position. While the business is high quality, the GARP analyst's valuation concerns are valid, and the stock has likely met its short-term potential.")
`;
const UPDATED_FINAL_THESIS_PROMPT = `
Role: You are a "Portfolio Manager" AI, updating your final investment thesis based on new diligence.
Task: You must review your **Original Final Investment Thesis** and compare it against the *new* findings from the four core diligence memos (Qualitative, Structured, Market Sentiment, Investigation Summary). Your goal is to determine if the new diligence *confirms*, *challenges*, or *reframes* the original thesis and issue an updated recommendation.

**Data:**
1.  **Company:** {companyName} ({tickerSymbol})
2.  **Original Final Investment Thesis (Markdown):**
    \`\`\`markdown
    {originalFinalThesisContent}
    \`\`\`
3.  **New Diligence Summaries (JSON):**
    \`\`\`json
    {diligenceSummaries}
    \`\`\`

**Memo Structure (Follow this precisely):**

## Final Thesis Update: {companyName} ({tickerSymbol})

### 1. Summary of Diligence Findings
| Diligence Memo | Key Finding / Verdict |
| :--- | :--- |
| **Qualitative Memo** | {diligenceSummaries.QualitativeDiligenceMemo.verdict} {diligenceSummaries.QualitativeDiligenceMemo.keyFinding} |
| **Structured Memo** | {diligenceSummaries.StructuredDiligenceMemo.verdict} {diligenceSummaries.StructuredDiligenceMemo.keyFinding} |
| **Market Sentiment** | {diligenceSummaries.MarketSentimentMemo.verdict} {diligenceSummaries.MarketSentimentMemo.keyFinding} |
| **Investigation Summary** | {diligenceSummaries.InvestigationSummaryMemo.verdict} {diligenceSummaries.InvestigationSummaryMemo.keyFinding} |

### 2. Re-evaluating the Core Narrative
(Extract the core narrative/conflict from the **Original Final Thesis** (Section 2 & 3). Now, analyze how the **New Diligence Findings** (from Section 1 above) *directly conflict with, confirm, or reframe* that original conclusion. Is the original thesis still valid? Has a new, more powerful narrative emerged from the diligence?)

### 3. Updated Recommendation and Rationale
(Based on your re-evaluation in Section 2, issue an updated recommendation. Explain *why* the new diligence (or lack thereof) justifies this new stance, even if it's the same as the original. The diligence findings *must* be the primary driver of your updated rationale.)

### Updated Recommendation
**Recommendation Grade:** [Your New Grade Here]
**Suggested Allocation:** [Your New % Here]
(Your new 1-2 sentence justification based *explicitly* on the new diligence findings.)

### 4. Updated Implications for Portfolio Management
(Based *only* on your new recommendation in Section 3, provide updated, actionable guidance.)
* **For a New Investment:** (e.g., "Initiate a 2-3% position...")
* **For an Existing Position:** (e.g., "Increase position to target 2-3% allocation...")
`;

// Diligence Memo Prompts
const QUALITATIVE_DILIGENCE_MEMO_PROMPT = `
Role: You are a qualitative financial analyst AI.
Task: Read the provided Questions & Answers (Q&A) from the Qualitative Diligence process for {companyName} ({tickerSymbol}). Synthesize these findings into a concise, formal memo.

**Q&A Data:**
{qaData}

**Memo Structure (Follow this precisely):**

## Qualitative Diligence Memo: {companyName} ({tickerSymbol})

### 1. Competitive Moat
(Summarize the findings from the "Competitive Moat" Q&A.)

### 2. Management Quality & Alignment
(Summarize the findings from the "Management Quality" and "Incentive Alignment" Q&A.)

### 3. Shareholder Base & Thesis
(Summarize the findings from the "Shareholder Base Quality" and "The Non-Consensus Thesis" Q&A.)

### 4. Core Thesis & Linchpin Risk
(Summarize the findings from the "Core Thesis & Linchpin Risk" Q&A.)

### 5. Final Qualitative Verdict
(Synthesize all points into a final verdict: **High**, **Average**, or **Low**. Justify this verdict with a 1-2 sentence summary of the *most critical* findings, focusing on the core thesis and its primary risk. Example: "Verdict: High. The company's moat is widening, and management's incentives are strongly aligned with the non-consensus thesis. The primary risk is X, but it appears manageable.")
`;
const STRUCTURED_DILIGENCE_MEMO_PROMPT = `
Role: You are a quantitative financial analyst AI.
Task: Read the provided Questions & Answers (Q&A) from the Structured Diligence process for {companyName} ({tickerSymbol}). Synthesize these findings into a concise, formal memo.

**Q&A Data:**
{qaData}

**Memo Structure (Follow this precisely):**

## Structured Diligence Memo: {companyName} ({tickerSymbol})

### 1. Financial Story (Durable Growth or Weakness)
(Summarize the findings from the "Financial Analysis" Q&A.)

### 2. Balance Sheet & Capital Allocation
(Summarize the findings from the "Balance Sheet" and "Cash Flow" Q&A.)

### 3. Operational Efficiency & Earnings
(Summarize the findings from the "Income Statement" and "Earnings & Valuation Snapshot" Q&A.)

### 4. Final Quantitative Verdict
(Synthesize all points into a final verdict: **Strong**, **Average**, or **Weak**. Justify this verdict with a 1-2 sentence summary of the *most critical* quantitative findings. Example: "Verdict: Weak. While revenue growth is present, the company suffers from margin compression, poor cash flow quality, and a high-leverage balance sheet.")
`;
const MARKET_SENTIMENT_MEMO_PROMPT = `
Role: You are a market sentiment analyst AI.
Task: Read the provided Questions & Answers (Q&A) from the Market Sentiment Diligence process for {companyName} ({tickerSymbol}). Synthesize these findings into a concise, formal memo.

**Q&A Data:**
{qaData}

**Memo Structure (Follow this precisely):**

## Market Sentiment Memo: {companyName} ({tickerSymbol})

### 1. Analyst & Factor Consensus
(Summarize the findings from the "Analyst Consensus" and "Fundamental Factors" Q&A.)

### 2. Price, Technicals & Short Interest
(Summarize the findings from the "Technical Sentiment," "Price Performance," and "Short Interest" Q&A.)

### 3. Competitor & Insider Context
(Summarize the findings from the "Competitor Snapshot Comparison" and "Insider Activity Analysis" Q&A.)

### 4. Final Sentiment Verdict
(Synthesize all points into a final verdict: **Bullish**, **Neutral**, or **Bearish**. Justify this verdict with a 1-2 sentence summary of the *strongest signals*. Example: "Verdict: Bullish. The consensus analyst rating is a 'Strong Buy', which is supported by elite factor scores and positive technicals, despite recent insider selling.")
`;
const INVESTIGATION_SUMMARY_MEMO_PROMPT = `
Role: You are a financial analyst AI.
Task: Read the provided log of custom Questions & Answers (Q&A) from a manual diligence investigation for {companyName} ({tickerSymbol}). Synthesize these findings into a concise summary.

**Q&A Log:**
{qaData}

**Memo Structure (Follow this precisely):**

## Investigation Summary Memo: {companyName} ({tickerSymbol})

### 1. Summary of Key Findings
(Go through each Q&A pair and create a bulleted list summarizing the *answer* to each question.
Example:
* **Regarding [Question 1 Topic]:** [Summary of Answer 1].
* **Regarding [Question 2 Topic]:** [Summary of Answer 2].
)

### 2. Final Investigation Verdict
(Synthesize all the answers into a final verdict: **Positive**, **Negative**, or **Mixed View**. Justify this verdict with a 1-2 sentence summary of the *most impactful* findings from the investigation. Example: "Verdict: Mixed View. The investigation confirmed strong FCF conversion but also revealed that the recent earnings shortfall is structural, not temporary.")
`;

// Review Memo Prompts
const QUARTERLY_REVIEW_MEMO_PROMPT = `
Role: You are a portfolio manager AI conducting a quarterly review for {companyName} ({tickerSymbol}).
Task: You will be given the original investment memo and a checklist of Q&A based on the *new* quarterly results. Synthesize this information into a formal Quarterly Review Memo.

**Data:**
1.  **Original Investment Memo (The Thesis):**
    \`\`\`
    {originalInvestmentMemo}
    \`\`\`
2.  **Quarterly Review Q&A (The New Facts):**
    \`\`\`
    {qaData}
    \`\`\`

**Memo Structure (Follow this precisely):**

## Quarterly Review Memo: {companyName} ({tickerSymbol})

### 1. Results vs. Expectations
(Summarize the findings from the "Results vs. Expectations" Q&A.)

### 2. Thesis Validation
(Summarize the findings from the "Quantitative Thesis Check" and "Qualitative Thesis Check" Q&A. Did the new data confirm or challenge the original thesis?)

### 3. Management Outlook
(Summarize the findings from the "Management Outlook" Q&A.)

### 4. Updated Recommendation
(State the "Action Plan" from the Q&A and provide the 1-2 sentence justification for the decision.)
`;
const ANNUAL_REVIEW_MEMO_PROMPT = `
Role: You are a portfolio manager AI conducting an annual review for {companyName} ({tickerSymbol}).
Task: You will be given the original investment memo and a checklist of Q&A based on the *new* annual results (10-K). Synthesize this information into a formal Annual Review Memo.

**Data:**
1.  **Original Investment Memo (The Thesis):**
    \`\`\`
    {originalInvestmentMemo}
    \`\`\`
2.  **Annual Review Q&A (The New Facts):**
    \`\`\`
    {qaData}
    \`\`\`

**Memo Structure (Follow this precisely):**

## Annual Review Memo: {companyName} ({tickerSymbol})

### 1. Full-Year Performance
(Summarize the findings from the "Full-Year Performance vs. Guidance" Q&A.)

### 2. Strategic Progress & Capital Allocation
(Summarize the findings from the "Strategic Progress & Capital Allocation" Q&A.)

### 3. Risk & Thesis Validation
(Summarize the findings from the "Updated Competitive Landscape" and "Long-Term Thesis Validation" Q&A. Have the long-term risks or thesis materially changed?)

### 4. Updated Recommendation
(State the "Forward-Looking Action Plan" from the Q&A and provide the 1-2 sentence justification for the plan.)
`;

// --- FILING ANALYSIS PROMPTS ---

const TEN_Q_ANALYSIS_PROMPT = `
**Persona & Role:**
You are a financial analyst AI specializing in extracting key quarterly performance data from SEC Form 10-Q filings for GARP/QARP investors. Your analysis must be objective, concise, and focused on material financial changes.

**Core Task:**
Read the provided 10-Q filing text for {companyName} and generate a structured analysis summarizing key performance indicators and relevant updates.

**Critical Instructions:**
1.  **Source Limitation:** Your analysis must derive *exclusively* from the provided 'Filing Text'. Do not infer information or use outside knowledge.
2.  **Strict Output Format:** You MUST return a response in markdown following this structure precisely. Do not add introductory/concluding paragraphs.

**Input Data:**
**1. Company Name:** {companyName}
**2. Filing Text:**
\`\`\`
{filingText}
\`\`\`
---
# 10-Q Key Findings: {companyName} - {Period} // e.g., Q3 2025

## 1. Headline Performance vs. Prior Year
(Extract and list the reported figures and YoY % change for:)
* **Net Sales/Revenue:**
* **Gross Profit Margin (%):**
* **Operating Income:**
* **Net Income:**
* **Diluted EPS:**

## 2. Key Segment Performance (if applicable)
(If the filing breaks down revenue/profit by segment, summarize the performance of the 1-2 most significant segments.)

## 3. Cash Flow Summary
* **Cash Flow from Operations (YTD):** [Extract YTD figure and compare vs. YTD Net Income]
* **Capital Expenditures (YTD):**
* **Share Repurchases (YTD):**
* **Dividends Paid (YTD):**

## 4. Balance Sheet & Liquidity Update
* **Cash & Equivalents:** [Extract end-of-period balance]
* **Total Debt:** [Extract end-of-period balance, specify if it includes/excludes operating leases if mentioned]

## 5. Management Outlook/Guidance Changes (if mentioned)
(Summarize any explicit changes or reaffirmations of full-year guidance mentioned in the 10-Q text, including specific metrics if provided.)

## 6. Other Material Events/Updates
(Briefly note any other significant events disclosed, e.g., acquisitions, litigation updates, regulatory news.)
`.trim();

const TEN_K_ANALYSIS_PROMPT = `
**Persona & Role:**
You are a financial analyst AI specializing in extracting key annual performance data and strategic insights from SEC Form 10-K filings for GARP/QARP investors. Your analysis must be objective, concise, and focused on material financial results and forward-looking statements.

**Core Task:**
Read the provided 10-K filing text for {companyName} and generate a structured analysis summarizing key annual performance indicators, strategic updates, and risk factors.

**Critical Instructions:**
1.  **Source Limitation:** Your analysis must derive *exclusively* from the provided 'Filing Text'. Do not infer information or use outside knowledge.
2.  **Strict Output Format:** You MUST return a response in markdown following this structure precisely. Do not add introductory/concluding paragraphs.

**Input Data:**
**1. Company Name:** {companyName}
**2. Filing Text:**
\`\`\`
{filingText}
\`\`\`
---
# 10-K Key Findings: {companyName} - Fiscal Year {Year}

## 1. Full-Year Performance vs. Prior Year
(Extract and list the reported figures and YoY % change for:)
* **Net Sales/Revenue:**
* **Gross Profit Margin (%):**
* **Operating Income:**
* **Net Income:**
* **Diluted EPS:**

## 2. Key Segment Performance (if applicable)
(If the filing breaks down annual revenue/profit by segment, summarize the performance of the 1-2 most significant segments.)

## 3. Full-Year Cash Flow & Capital Allocation Summary
* **Cash Flow from Operations:** [Extract full-year figure and compare vs. Net Income]
* **Capital Expenditures:**
* **Share Repurchases:**
* **Dividends Paid:**
* **Acquisitions (Net):**

## 4. Balance Sheet Position
* **Cash & Equivalents:** [Extract year-end balance]
* **Total Debt:** [Extract year-end balance, specify if it includes/excludes operating leases if mentioned]
* **Shareholders' Equity:**

## 5. Management's Outlook & Strategy (from MD&A/Business Overview)
(Summarize key strategic priorities, market commentary, or forward-looking statements made by management within the 10-K text.)

## 6. Key Risk Factors Update
(Identify 1-2 new or significantly emphasized risk factors mentioned in the 'Risk Factors' section compared to previous understanding, if discernible from the text.)

## 7. Executive Compensation Alignment (if readily available)
(Briefly summarize the primary performance metrics used for executive bonuses if clearly stated in a compensation discussion section.)
`.trim();

const EIGHT_K_ANALYSIS_PROMPT = `
**Persona & Role:**
You are a meticulous financial data extraction AI. Your task is to read an SEC Form 8-K filing (which might be a standard form or an attached press release exhibit like 99.1) and create a concise, factual summary of the material information disclosed.

**Core Task:**
Generate a structured markdown report summarizing the key events, facts, figures, and qualitative statements presented in the provided 8-K text for {companyName}.

**Critical Instructions:**
1.  **Source Limitation:** Base your entire summary *exclusively* on the provided 'Filing Text'. Do NOT infer, analyze impact, or use outside knowledge.
2.  **Identify Core Events:** Determine the primary reason(s) for the filing. If multiple distinct events are reported (often under different Item numbers like 1.02, 2.02, 5.02, etc.), summarize each one separately.
3.  **Extract Key Data:** Pull out the most important quantitative data (e.g., financial results, guidance changes, transaction amounts, executive compensation figures) and qualitative statements (e.g., management commentary, reasons for changes, strategic rationale provided *in the text*).
4.  **Handle Earnings Releases:** If the text appears to be an earnings release (often Exhibit 99.1), focus on:
    * Headline Results vs. Expectations (if mentioned).
    * Key Financial Metrics (Revenue, EPS, Margins, Cash Flow).
    * Segment Performance Highlights.
    * Updated Financial Guidance.
    * Significant Management Commentary explaining results or outlook.
    * Major Corporate Updates (M&A, approvals, etc.).
5.  **Handle Specific Event Reports:** If the text reports specific events (like executive changes, JV terminations, acquisitions):
    * Clearly state the event.
    * Summarize the key terms, dates, parties involved, and financial details provided.
    * Include any stated reasons or rationale mentioned in the filing.
6.  **Strict Output Format:** Use markdown headings (##) for distinct sections (e.g., "## Event Summary", "## Key Financial Results", "## Updated Guidance", "## Management Commentary", "## Joint Venture Termination", "## Executive Appointment"). Use bullet points for lists of data or facts. Do NOT add an introduction, conclusion, or any analysis of impact/significance.
7.  **Ignore Boilerplate:** Actively ignore standard, non-material boilerplate language. This includes "Forward-Looking Statements" disclaimers, safe harbor paragraphs, definitions of non-GAAP measures, and signature blocks, unless they contain a specific new fact central to the filing.
8.  **Handle Non-Material Filings:** If the filing contains no new, material financial or operational information (e.g., it is purely administrative, like reporting routine annual meeting vote results or a change in auditors), summarize that single fact concisely (e.g., "## Event Summary \\n * Reports results of 2025 Annual Shareholder Meeting."). Do not attempt to find financial data that isn't present.

**Input Data:**

**1. Company Name:**
{companyName}

**2. Filing Text:**
\`\`\`
{filingText}
\`\`\`
`.trim();

// --- FILING IMPACT PROMPTS (MODIFIED) ---

const TEN_Q_THESIS_IMPACT_PROMPT = `
**Persona & Role:**
You are the Chief Investment Officer, re-evaluating an investment thesis based on a new 10-Q filing. Your primary duty is to protect capital and act decisively if the facts change.

**Core Task:**
Read the **Updated Final Investment Thesis** (containing the core recommendation, rationale, 'Edge', and 'Linchpin Risk') and the **10-Q Key Findings Summary**. Your task is to *act* as the CIO: determine how the new 10-Q facts impact the thesis's *linchpin risks* and *core narrative* ('Edge'), and then issue an *updated recommendation and rationale*.

**Critical Instructions:**
1.  **Facts vs. Thesis:** The **10-Q Summary** has the new facts. The **Updated Final Thesis** has the existing story. Does the new quarter's data break the story?
2.  **Focus on Conflicts:** Identify the *most significant conflict* between the new 10-Q data and the existing thesis's bull case ('Edge').
3.  **Assess Linchpin Risk:** Explicitly state whether the 10-Q data confirms or invalidates the 'Edge', or if it triggers the identified 'Linchpin Risk'.
4.  **Issue a New Recommendation:** Conclude with a *new, decisive recommendation* (A, B, C, D, or F). If the facts invalidate the thesis, a downgrade is required.
5.  **Conditional Brainstorming:** If your updated recommendation is a downgrade (C, D, or F), add section ## 4. Exploring Alternative Angles. Brainstorm 1-2 *potential* alternative non-consensus viewpoints suggested by the 10-Q data, framed as speculative ideas requiring further investigation. Otherwise, omit section 4.
6.  **Grading Scale:** A (Upgrade/Reiterate: High Conviction Buy, 4-5%), B (Reiterate: Strong Buy, 2-3%), C (Downgrade/Hold: Hold/Monitor, 1%), D (Downgrade: Hold/Reduce), F (Downgrade: Sell/Pass).
7.  **Strict Output Format:** Use the exact markdown structure below. Section 4 is conditional.

**Input Data:**

**1. Updated Final Investment Thesis (The "Old Story"):**
\`\`\`markdown
{originalThesis}
\`\`\`

**2. 10-Q Key Findings Summary (The "New Facts"):**
\`\`\`markdown
{filingSummary}
\`\`\`
---
# 10-Q Impact Re-evaluation: {companyName} ({tickerSymbol})

## 1. Key Findings from 10-Q
(Concisely list 2-3 of the most impactful data points from the '10-Q Summary' relevant to the thesis 'Edge' or 'Linchpin Risk'.)

## 2. Re-evaluating the Core Narrative ('Edge') & 'Linchpin Risk'
(First, extract and state the core 'Edge' and 'Linchpin Risk' from the 'Updated Final Thesis'. Then, analyze how the 'Key Findings from 10-Q' *specifically* confirm or conflict with the 'Edge' and whether the 'Linchpin Risk' has materialized based on this quarterly data.)

## 3. Updated Recommendation & Rationale
(Explain *why* the 10-Q findings force a change (or reaffirmation) of the investment thesis, directly referencing your analysis of the 'Edge' and 'Linchpin Risk'. Justify your new recommendation grade.)

### Updated Recommendation
**Recommendation Grade:** [Assign an updated letter grade (A, B, C, D, or F) based on this 10-Q.]
**Suggested Allocation:** [State the corresponding allocation percentage or action.]
(Your updated one-sentence justification summarizing your *new* conclusion based on the 10-Q data.)

## 4. Exploring Alternative Angles (Post-Filing Reassessment)
*(Include this section ONLY IF the Recommendation Grade above is C, D, or F)*
(Acknowledge the original thesis is challenged. Brainstorm 1-2 *potential* alternative non-consensus angles suggested by the 10-Q data. Frame these as speculative ideas needing more research, mentioning potential impact/timeframe. Example format: "*Angle 1: [Idea]?* The 10-Q showed [Data Point]. Perhaps the market is missing [Alternative Viewpoint]. *Further Investigation:* [Action]. *Timeframe:* [Estimate].")

## 5. Updated Implications for Portfolio Management
(Based on your *new* recommendation grade, provide revised, actionable interpretations.)
* **For a New Investment:** [Explain the updated meaning.]
* **For an Existing Position:** [Explain the updated meaning.]
`.trim();

const TEN_K_THESIS_IMPACT_PROMPT = `
**Persona & Role:**
You are the Chief Investment Officer, re-evaluating an investment thesis based on a new 10-K filing. Your primary duty is to protect capital and act decisively if the facts change.

**Core Task:**
Read the **Updated Final Investment Thesis** (containing the core recommendation, rationale, 'Edge', and 'Linchpin Risk') and the **10-K Key Findings Summary**. Your task is to *act* as the CIO: determine how the new 10-K facts impact the thesis's *linchpin risks* and *core narrative* ('Edge'), and then issue an *updated recommendation and rationale*.

**Critical Instructions:**
1.  **Facts vs. Thesis:** The **10-K Summary** has the new annual facts. The **Updated Final Thesis** has the existing story. Does the full year's data break the story?
2.  **Focus on Conflicts:** Identify the *most significant conflict* between the new 10-K data (especially strategic updates/risk factors) and the existing thesis's bull case ('Edge').
3.  **Assess Linchpin Risk:** Explicitly state whether the 10-K data confirms or invalidates the 'Edge', or if it triggers the identified 'Linchpin Risk' based on annual performance or outlook.
4.  **Issue a New Recommendation:** Conclude with a *new, decisive recommendation* (A, B, C, D, or F). If the facts invalidate the thesis, a downgrade is required.
5.  **Conditional Brainstorming:** If your updated recommendation is a downgrade (C, D, or F), add section ## 4. Exploring Alternative Angles. Brainstorm 1-2 *potential* alternative non-consensus viewpoints suggested by the 10-K data, framed as speculative ideas requiring further investigation. Otherwise, omit section 4.
6.  **Grading Scale:** A (Upgrade/Reiterate: High Conviction Buy, 4-5%), B (Reiterate: Strong Buy, 2-3%), C (Downgrade/Hold: Hold/Monitor, 1%), D (Downgrade: Hold/Reduce), F (Downgrade: Sell/Pass).
7.  **Strict Output Format:** Use the exact markdown structure below. Section 4 is conditional.

**Input Data:**

**1. Updated Final Investment Thesis (The "Old Story"):**
\`\`\`markdown
{originalThesis}
\`\`\`

**2. 10-K Key Findings Summary (The "New Facts"):**
\`\`\`markdown
{filingSummary}
\`\`\`
---
# 10-K Impact Re-evaluation: {companyName} ({tickerSymbol})

## 1. Key Findings from 10-K
(Concisely list 2-3 of the most impactful strategic updates, risk changes, or annual performance trends from the '10-K Summary' relevant to the thesis 'Edge' or 'Linchpin Risk'.)

## 2. Re-evaluating the Core Narrative ('Edge') & 'Linchpin Risk'
(First, extract and state the core 'Edge' and 'Linchpin Risk' from the 'Updated Final Thesis'. Then, analyze how the 'Key Findings from 10-K' *specifically* confirm or conflict with the 'Edge' and whether the 'Linchpin Risk' has materialized based on this annual data/outlook.)

## 3. Updated Recommendation & Rationale
(Explain *why* the 10-K findings force a change (or reaffirmation) of the investment thesis, directly referencing your analysis of the 'Edge' and 'Linchpin Risk'. Justify your new recommendation grade.)

### Updated Recommendation
**Recommendation Grade:** [Assign an updated letter grade (A, B, C, D, or F) based on this 10-K.]
**Suggested Allocation:** [State the corresponding allocation percentage or action.]
(Your updated one-sentence justification summarizing your *new* conclusion based on the 10-K data.)

## 4. Exploring Alternative Angles (Post-Filing Reassessment)
*(Include this section ONLY IF the Recommendation Grade above is C, D, or F)*
(Acknowledge the original thesis is challenged. Brainstorm 1-2 *potential* alternative non-consensus angles suggested by the 10-K data. Frame these as speculative ideas needing more research, mentioning potential impact/timeframe. Example format: "*Angle 1: [Idea]?* The 10-K reported [Data Point/Outlook]. Perhaps the market is misinterpreting [Alternative Viewpoint]. *Further Investigation:* [Action]. *Timeframe:* [Estimate].")

## 5. Updated Implications for Portfolio Management
(Based on your *new* recommendation grade, provide revised, actionable interpretations.)
* **For a New Investment:** [Explain the updated meaning.]
* **For an Existing Position:** [Explain the updated meaning.]
`.trim();

const EIGHT_K_THESIS_IMPACT_PROMPT = `
**Persona & Role:**
You are the Chief Investment Officer, re-evaluating an investment thesis based on a new, material 8-K filing. Your primary duty is to protect capital and act decisively if the facts change.

**Core Task:**
Read the **Updated Final Investment Thesis** (containing the core recommendation, rationale, 'Edge', and 'Linchpin Risk') and the **8-K Material Event Summary**. Your task is to *act* as the CIO: determine how the new 8-K facts impact the thesis's *linchpin risks* and *core narrative* ('Edge'), and then issue an *updated recommendation and rationale*.

**Critical Instructions:**
1.  **Facts vs. Thesis:** The **8-K Summary** has the new facts. The **Updated Final Thesis** has the existing story. Do the new facts break the story?
2.  **Focus on Conflicts:** Identify the *most significant conflict* between the new 8-K data and the existing thesis's bull case ('Edge').
3.  **Assess Linchpin Risk:** Explicitly state whether the 8-K data confirms or invalidates the 'Edge', or if it triggers the identified 'Linchpin Risk'.
4.  **Issue a New Recommendation:** Conclude with a *new, decisive recommendation* (A, B, C, D, or F). If the facts invalidate the thesis, a downgrade is required.
5.  **Conditional Brainstorming:** If your updated recommendation is a downgrade (C, D, or F), add section ## 4. Exploring Alternative Angles. Brainstorm 1-2 *potential* alternative non-consensus viewpoints suggested by the 8-K data, framed as speculative ideas requiring further investigation. Otherwise, omit section 4.
6.  **Grading Scale:** A (Upgrade/Reiterate: High Conviction Buy, 4-5%), B (Reiterate: Strong Buy, 2-3%), C (Downgrade/Hold: Hold/Monitor, 1%), D (Downgrade: Hold/Reduce), F (Downgrade: Sell/Pass).
7.  **Strict Output Format:** Use the exact markdown structure below. Section 4 is conditional.

**Input Data:**

**1. Updated Final Investment Thesis (The "Old Story"):**
\`\`\`markdown
{originalThesis}
\`\`\`

**2. 8-K Material Event Summary (The "New Facts"):**
\`\`\`markdown
{eightKSummary}
\`\`\`
---
# 8-K Impact Re-evaluation: {companyName} ({tickerSymbol})

## 1. 8-K Event Summary
(Concisely summarize the 1-2 most material facts from the '8-K Material Event Summary' relevant to the thesis 'Edge' or 'Linchpin Risk'.)

## 2. Re-evaluating the Core Narrative ('Edge') & 'Linchpin Risk'
(First, extract and state the core 'Edge' and 'Linchpin Risk' from the 'Updated Final Thesis'. Then, analyze how the '8-K Event Summary' facts *specifically* confirm or conflict with the 'Edge' and whether the 'Linchpin Risk' has materialized based on this event.)

## 3. Updated Recommendation & Rationale
(Explain *why* the 8-K findings force a change (or reaffirmation) of the investment thesis, directly referencing your analysis of the 'Edge' and 'Linchpin Risk'. Justify your new recommendation grade.)

### Updated Recommendation
**Recommendation Grade:** [Assign an updated letter grade (A, B, C, D, or F) based on this 8-K.]
**Suggested Allocation:** [State the corresponding allocation percentage or action.]
(Your updated one-sentence justification summarizing your *new* conclusion based on the 8-K data.)

## 4. Exploring Alternative Angles (Post-Filing Reassessment)
*(Include this section ONLY IF the Recommendation Grade above is C, D, or F)*
(Acknowledge the original thesis is challenged. Brainstorm 1-2 *potential* alternative non-consensus angles suggested by the 8-K event/data. Frame these as speculative ideas needing more research, mentioning potential impact/timeframe. Example format: "*Angle 1: [Idea]?* The 8-K revealed [Data Point/Event]. Could this mean [Alternative Viewpoint]? *Further Investigation:* [Action]. *Timeframe:* [Estimate].")

## 5. Updated Implications for Portfolio Management
(Based on your *new* recommendation grade, provide revised, actionable interpretations.)
* **For a New Investment:** [Explain the updated meaning.]
* **For an Existing Position:** [Explain the updated meaning.]
`.trim();

// --- NEW MARKET REACTION PROMPT ---
const MARKET_REACTION_ANALYSIS_PROMPT = `
**Persona & Role:**
You are an experienced Market Analyst AI. Your task is to explain the *discrepancy* between a company's reported fundamental performance (from a filing) and the immediate market reaction (stock price change).

**Core Task:**
Analyze the provided **Filing Summary**, the **Thesis Impact Report** (which details the fundamental conclusion based on the filing), and the **Actual Market Reaction** (the stock price change). Generate a concise explanation hypothesizing *why* the market reacted the way it did, even if it contradicts the fundamental analysis.

**Critical Instructions:**
1.  **Acknowledge the Discrepancy:** Start by clearly stating the core conflict (e.g., "Despite the negative 10-Q results and the thesis downgrade, the stock price increased...").
2.  **Hypothesize Reasons:** Based *only* on the information in the Filing Summary and Thesis Impact Report, formulate 2-3 plausible hypotheses for the market's reaction. Consider:
    * **Expectations:** Could the market have expected even worse results? (Infer this possibility if the report was very negative).
    * **Forward-Looking Clues:** Did the Filing Summary or Thesis Impact Report mention any potentially positive forward-looking details (even minor ones like strong cash flow, litigation progress, future divestitures) that the market might be focusing on?
    * **Alternative Angles:** Did the Thesis Impact Report's "Alternative Angles" section offer explanations that align with the market reaction?
    * **"Priced In":** Could the negative news have been anticipated and already reflected in the stock price *before* the filing release?
    * **Non-Fundamental Factors:** Briefly mention the possibility of broader market trends or sector movements (though you don't have data for this, acknowledge it as a potential factor).
3.  **Concise Explanation:** Keep each hypothesis brief (1-2 sentences).
4.  **No New Data/Opinions:** Do *not* introduce external information, analyst ratings, or personal opinions. Stick strictly to rationalizing the *observed* reaction based on the *provided* documents.
5.  **Strict Output Format:** Use the exact markdown structure below.

**Input Data:**

**1. Company Name:** {companyName} ({tickerSymbol})
**2. Filing Type:** {filingType} (e.g., 10-Q, 8-K)
**3. Filing Summary (The "Facts"):**
\`\`\`markdown
{filingSummary}
\`\`\`
**4. Thesis Impact Report (The "Fundamental Conclusion"):**
\`\`\`markdown
{thesisImpactReport}
\`\`\`
**5. Actual Market Reaction:** The stock price changed by **{priceChangePercent}%** following the filing release.

---
# Market Reaction Analysis: {companyName} ({tickerSymbol}) - Post-{filingType}

## 1. The Discrepancy
(Clearly state the conflict between the fundamental conclusion in the Thesis Impact Report and the Actual Market Reaction.)

## 2. Potential Explanations for Market Reaction
(Provide 2-3 bullet points, each offering a brief hypothesis based *only* on the provided reports.)
* **Hypothesis 1:** ...
* **Hypothesis 2:** ...
* **(Optional) Hypothesis 3:** ...

## 3. Conclusion
(Briefly summarize that market reactions can diverge from immediate fundamentals due to expectations, forward-looking focus, or other factors evident in the provided context.)
`.trim();


// Extraction Prompts
const MOAT_ANALYSIS_EXTRACT_PROMPT = `
Role: You are an AI parsing a financial report.
Task: Read the provided "Moat Analysis" report and extract the final verdict and a 1-sentence justification.
Report: {reportContent}
Format: Return only a JSON object with "verdict" and "keyFinding" keys.
Example: {"verdict": "Wide Moat", "keyFinding": "The company's consistently high ROIC > 20% and expanding operating margins suggest a 'Wide Moat' based on intangible assets."}
`;
const CAPITAL_ALLOCATORS_EXTRACT_PROMPT = `
Role: You are an AI parsing a financial report.
Task: Read the provided "Capital Allocators" report and extract the final verdict and a 1-sentence justification.
Report: {reportContent}
Format: Return only a JSON object with "verdict" and "keyFinding" keys.
Example: {"verdict": "Outsider", "keyFinding": "Management behaves like an 'Outsider' by opportunistically repurchasing shares and deploying capital at high rates of return."}
`;
const GARP_MEMO_EXTRACT_PROMPT = `
Role: You are an AI parsing a financial report.
Task: Read the provided "Investment Memo" and extract the final recommendation and the 1-sentence justification.
Report: {reportContent}
Format: Return only a JSON object with "recommendation" and "rationale" keys.
Example: {"recommendation": "Buy", "rationale": "The company is a high-quality compounder trading at a reasonable 1.2 PEG ratio."}
`;
const QARP_ANALYSIS_EXTRACT_PROMPT = `
Role: You are an AI parsing a financial report.
Task: Read the provided "QARP Analysis Report" and extract the "Is this a QARP candidate?" answer (Yes/No) and the 1-sentence justification.
Report: {reportContent}
Format: Return only a JSON object with "recommendation" (Yes/No) and "rationale" keys.
Example: {"recommendation": "Yes", "rationale": "The company is 'Exceptional Quality' (30% ROIC) and 'Reasonably Priced' (1.5 PEG), making it a prime QARP candidate."}
`;
const COMPOUNDER_BMQV_EXTRACT_PROMPT = `
Role: You are an AI parsing a financial report.
Task: Read the provided "Long-Term Compounder Memo" or "Buffett-Munger Q&V Memo" and extract the final "Is it?" verdict (Yes/No/Borderline) and the 1-sentence justification.
Report: {reportContent}
Format: Return only a JSON object with "recommendation" (Yes/No/Borderline) and "rationale" keys.
Example: {"recommendation": "Yes", "rationale": "The company demonstrates a clear wide moat with 25%+ ROIC and skilled capital allocation."}
`;
const QUALITATIVE_DILIGENCE_MEMO_EXTRACT_PROMPT = `
Role: You are an AI parsing a financial report.
Task: Read the provided "Qualitative Diligence Memo" and extract the "Final Qualitative Verdict" (High/Average/Low) and the 1-2 sentence justification.
Report: {reportContent}
Format: Return only a JSON object with "verdict" and "keyFinding" keys.
Example: {"verdict": "High", "keyFinding": "The company's moat is widening, and management's incentives are strongly aligned. The primary risk is X, but it appears manageable."}
`;
const STRUCTURED_DILIGENCE_MEMO_EXTRACT_PROMPT = `
Role: You are an AI parsing a financial report.
Task: Read the provided "Structured Diligence Memo" and extract the "Final Quantitative Verdict" (Strong/Average/Weak) and the 1-2 sentence justification.
Report: {reportContent}
Format: Return only a JSON object with "verdict" and "keyFinding" keys.
Example: {"verdict": "Weak", "keyFinding": "While revenue growth is present, the company suffers from margin compression, poor cash flow quality, and a high-leverage balance sheet."}
`;
const MARKET_SENTIMENT_MEMO_EXTRACT_PROMPT = `
Role: You are an AI parsing a financial report.
Task: Read the provided "Market Sentiment Memo" and extract the "Final Sentiment Verdict" (Bullish/Neutral/Bearish) and the 1-2 sentence justification.
Report: {reportContent}
Format: Return only a JSON object with "verdict" and "keyFinding" keys.
Example: {"verdict": "Bullish", "keyFinding": "The consensus analyst rating is a 'Strong Buy', which is supported by elite factor scores and positive technicals."}
`;
const INVESTIGATION_SUMMARY_MEMO_EXTRACT_PROMPT = `
Role: You are an AI parsing a financial report.
Task: Read the provided "Investigation Summary Memo" and extract the "Final Investigation Verdict" (Positive/Negative/Mixed View) and the 1-2 sentence justification.
Report: {reportContent}
Format: Return only a JSON object with "verdict" and "keyFinding" keys.
Example: {"verdict": "Mixed View", "keyFinding": "The investigation confirmed strong FCF conversion but also revealed that the recent earnings shortfall is structural, not temporary."}
`;
const FINAL_THESIS_CONFLICT_ID_PROMPT = `
Role: You are an AI text analysis tool.
Task: Read the "Final Investment Thesis" memo provided. Identify the *key conflict* or *main consensus* from Section 2 ("Key Point of Conflict / Consensus"). Return this as a single-sentence string.
Memo: {reportContent}
Constraint: Return *only* the single-sentence summary. Do not add any other text.
`;

// --- Prompt Map ---
export const promptMap = {
    // Core Analysis
    'MoatAnalysis': { prompt: MOAT_ANALYSIS_PROMPT, requires: ['profile', 'key_metrics_annual', 'income_statement_annual', 'cash_flow_statement_annual', 'ratios_annual'] },
    'CapitalAllocators': { prompt: CAPITAL_ALLOCATORS_PROMPT, requires: ['cash_flow_statement_annual', 'key_metrics_annual', 'income_statement_annual', 'balance_sheet_statement_annual', 'ratios_annual'] },
    'GarpCandidacy': { prompt: GARP_CANDIDACY_PROMPT, requires: [] },
    'QarpAnalysis': { prompt: QARP_ANALYSIS_PROMPT, requires: [] },
    'LongTermCompounder': { prompt: LONG_TERM_COMPOUNDER_PROMPT, requires: [] },
    'BmqvMemo': { prompt: BMQV_MEMO_PROMPT, requires: [] },
    // Synthesis & Thesis
    'InvestmentMemo': { prompt: UPDATED_GARP_MEMO_PROMPT, requires: [] }, // Uses GARP structure
    'UpdatedGarpMemo': { prompt: UPDATED_GARP_MEMO_PROMPT, requires: [] }, // Explicitly named for clarity if needed elsewhere
    'UpdatedQarpMemo': { prompt: UPDATED_QARP_MEMO_PROMPT, requires: [] },
    'FinalInvestmentThesis': { prompt: FINAL_INVESTMENT_THESIS_PROMPT, requires: [] },
    'UpdatedFinalThesis': { prompt: UPDATED_FINAL_THESIS_PROMPT, requires: [] },
    // Diligence Memos (Manual Input Synthesis)
    'QualitativeDiligenceMemo': { prompt: QUALITATIVE_DILIGENCE_MEMO_PROMPT, requires: [] },
    'StructuredDiligenceMemo': { prompt: STRUCTURED_DILIGENCE_MEMO_PROMPT, requires: [] },
    'MarketSentimentMemo': { prompt: MARKET_SENTIMENT_MEMO_PROMPT, requires: [] },
    'InvestigationSummaryMemo': { prompt: INVESTIGATION_SUMMARY_MEMO_PROMPT, requires: [] },
    // Ongoing Review & Filing Analysis
    'QuarterlyReview': { prompt: QUARTERLY_REVIEW_MEMO_PROMPT, requires: [] }, // Checklist-based
    'AnnualReview': { prompt: ANNUAL_REVIEW_MEMO_PROMPT, requires: [] },     // Checklist-based
    'EightKAnalysis': { prompt: EIGHT_K_ANALYSIS_PROMPT, requires: [] }, // Filing text summary
    'EightKThesisImpact': { prompt: EIGHT_K_THESIS_IMPACT_PROMPT, requires: [] }, // Compares EightKAnalysis to UpdatedFinalThesis
    'TenQAnalysis': { prompt: TEN_Q_ANALYSIS_PROMPT, requires: [] },      // NEW: Filing text summary
    'TenQThesisImpact': { prompt: TEN_Q_THESIS_IMPACT_PROMPT, requires: [] }, // NEW: Compares TenQAnalysis to UpdatedFinalThesis
    'TenKAnalysis': { prompt: TEN_K_ANALYSIS_PROMPT, requires: [] },      // NEW: Filing text summary
    'TenKThesisImpact': { prompt: TEN_K_THESIS_IMPACT_PROMPT, requires: [] }, // NEW: Compares TenKAnalysis to UpdatedFinalThesis
    'MarketReactionAnalysis': { prompt: MARKET_REACTION_ANALYSIS_PROMPT, requires: [] }, // NEW: Explains market reaction vs fundamentals
    // Helpers & Other
    'PeerIdentification': { prompt: PEER_IDENTIFICATION_PROMPT, requires: ['profile'] },
    'PeerIdentificationFallback': { prompt: PEER_IDENTIFICATION_FALLBACK_PROMPT, requires: ['profile'] },
    'PeerComparison': { prompt: 'N/A' },
    'PortfolioGarpAnalysis': { prompt: PORTFOLIO_GARP_ANALYSIS_PROMPT, requires: [] },
    'PositionAnalysis': { prompt: POSITION_ANALYSIS_PROMPT, requires: [] },
    'GarpConvictionScore': { prompt: GARP_CONVICTION_SCORE_PROMPT, requires: [] },
    'SectorMomentum': { prompt: SECTOR_MOMENTUM_PROMPT, requires: [] },
    // Extraction Prompts
    'MoatAnalysis_Extract': { prompt: MOAT_ANALYSIS_EXTRACT_PROMPT },
    'CapitalAllocators_Extract': { prompt: CAPITAL_ALLOCATORS_EXTRACT_PROMPT },
    'InvestmentMemo_Extract': { prompt: GARP_MEMO_EXTRACT_PROMPT },
    'QarpAnalysis_Extract': { prompt: QARP_ANALYSIS_EXTRACT_PROMPT },
    'LongTermCompounder_Extract': { prompt: COMPOUNDER_BMQV_EXTRACT_PROMPT },
    'BmqvMemo_Extract': { prompt: COMPOUNDER_BMQV_EXTRACT_PROMPT },
    'QualitativeDiligenceMemo_Extract': { prompt: QUALITATIVE_DILIGENCE_MEMO_EXTRACT_PROMPT },
    'StructuredDiligenceMemo_Extract': { prompt: STRUCTURED_DILIGENCE_MEMO_EXTRACT_PROMPT },
    'MarketSentimentMemo_Extract': { prompt: MARKET_SENTIMENT_MEMO_EXTRACT_PROMPT },
    'InvestigationSummaryMemo_Extract': { prompt: INVESTIGATION_SUMMARY_MEMO_EXTRACT_PROMPT },
    'FinalThesis_ConflictID': { prompt: FINAL_THESIS_CONFLICT_ID_PROMPT }
};

// --- Analysis Icons & Names ---
export const ANALYSIS_ICONS = {
    'MoatAnalysis': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 4.006 4.006 0 00-3.662-.138 4.006 4.006 0 00-3.7 3.7 4.006 4.006 0 00-.138 3.662 4.006 4.006 0 003.7 3.7 4.006 4.006 0 003.662.138 4.006 4.006 0 003.7-3.7 4.006 4.006 0 00.138-3.662z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>`,
    'CapitalAllocators': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.75A.75.75 0 013 4.5h.75m0 0H21m-12 6h9m-9 6h9m-9-6l-3-3v6l3-3zm9-6l3 3v-6l-3 3z" /></svg>`,
    'GarpCandidacy': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-2.894-.879-4.001 0a2.25 2.25 0 000 3.182V15M12 6v12m-3 2.818l.879-.659c1.171-.879 3.07-.879 4.242 0 1.172.879 1.172 2.303 0 3.182C13.536 18.781 12.768 19 12 19c-.725 0-1.45.22-2.003.659-1.106.879-2.894.879-4.001 0a2.25 2.25 0 010-3.182V17" /></svg>`,
    'QarpAnalysis': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.745 3.745 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>`,
    'LongTermCompounder': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>`,
    'BmqvMemo': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" /></svg>`,
    'InvestmentMemo': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>`,
    'FinalInvestmentThesis': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
    'UpdatedFinalThesis': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0M2.985 19.644A8.25 8.25 0 0116.023 9.348" /></svg>`,
    'TenQAnalysis': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" /></svg>`, // Example Calendar Icon
    'TenKAnalysis': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>`, // Example Document Icon
};

export const ANALYSIS_NAMES = {
    // Core
    'MoatAnalysis': 'Moat Analysis',
    'CapitalAllocators': 'Capital Allocators',
    'GarpCandidacy': 'GARP Candidacy Report',
    'QarpAnalysis': 'QARP Analysis',
    'LongTermCompounder': 'Long-Term Compounder Memo',
    'BmqvMemo': 'Buffett-Munger Q&V Memo',
    // Synthesis & Thesis
    'InvestmentMemo': 'Investment Memo',
    'UpdatedGarpMemo': 'Updated GARP Memo',
    'UpdatedQarpMemo': 'Updated QARP Memo',
    'FinalInvestmentThesis': 'Final Investment Thesis',
    'UpdatedFinalThesis': 'Updated Final Thesis',
    // Diligence Memos
    'QualitativeDiligenceMemo': 'Qualitative Diligence Memo',
    'StructuredDiligenceMemo': 'Structured Diligence Memo',
    'MarketSentimentMemo': 'Market Sentiment Memo',
    'InvestigationSummaryMemo': 'Investigation Summary',
    // Ongoing Review & Filings
    'QuarterlyReview': 'Quarterly Review', // Checklist-based
    'AnnualReview': 'Annual Review',     // Checklist-based
    'FilingDiligence': 'Filing Diligence Q&A', // Manual Q&A saved
    'EightKAnalysis': '8-K Filing Summary', // NEW NAME
    'EightKThesisImpact': '8-K Thesis Impact', // NEW NAME
    'TenQAnalysis': '10-Q Filing Summary',   // NEW
    'TenQThesisImpact': '10-Q Thesis Impact',  // NEW
    'TenKAnalysis': '10-K Filing Summary',   // NEW
    'TenKThesisImpact': '10-K Thesis Impact',  // NEW
    'MarketReactionAnalysis': 'Market Reaction Analysis', // NEW
    // Helpers & Other
    'PositionAnalysis': 'Position Analysis',
    'PortfolioGarpAnalysis': 'Portfolio GARP Analysis',
    'GarpConvictionScore': 'GARP Conviction Score',
    'PeerIdentification': 'Peer Identification',
    'PeerComparison': 'Peer Comparison',
    'SectorMomentum': 'Sector Momentum'
    // FilingQuestionGeneration REMOVED
};

// --- CALCULATION_SUMMARIES ---
// Add entries for new reports if needed for the help modal, otherwise can be omitted.
export const CALCULATION_SUMMARIES = {
    'QarpAnalysis': 'Performs a "Quality at a Reasonable Price" (QARP) analysis. This report uses the same underlying data as the GARP Scorecard but instructs the AI to synthesize it through a different lens, focusing on the critical balance between business quality (measured by ROE, ROIC, D/E) and valuation (measured by P/E, PEG, P/FCF).',
    'MoatAnalysis': 'Assesses a company\'s competitive advantage ("moat") by calculating 10-year historical trends for key quality metrics like Return on Invested Capital (ROIC), profitability margins (net, operating, gross), and reinvestment rates (e.g., CapEx, R&D expenses).',
    'CapitalAllocators': 'Evaluates management\'s effectiveness by analyzing historical data on how they prioritize cash flow (e.g., CapEx vs. buybacks), the effectiveness of their investments (ROIC trends), their acquisition history (goodwill), and how they return capital to shareholders (dividends and buybacks).',
    'InvestmentMemo': 'This report does not perform new calculations. Instead, it synthesizes the existing "GARP Candidacy Report" and the "GARP Scorecard" data into a formal, thesis-driven investment memo.',
    'GarpCandidacy': 'Calculates a 10-point GARP scorecard, checking key metrics like EPS & Revenue Growth, Profitability (ROE, ROIC), and Valuation (P/E, PEG, P/S, D/E) against predefined thresholds to determine if a stock qualifies as a GARP candidate.',
    'PositionAnalysis': 'This report does not perform new calculations. It uses the previously generated "GARP Candidacy Report" as the original investment thesis and compares it against the user\'s specific position details (cost basis, shares) and the current market price.',
    'PortfolioGarpAnalysis': 'This report aggregates the pre-calculated GARP scorecards for every stock currently in the user\'s "Portfolio" status. It then prepares this aggregated data for an AI to analyze.',
    'PeerComparison': 'This section uses AI to identify a company\'s top publicly traded competitors. It then fetches key financial metrics for both the primary company and the peer group, calculating the average for each metric. The "Premium / (Discount)" column shows how the primary company\'s metric compares to the peer average. A negative percentage (discount) is a good thing for valuation ratios like P/E, while a positive percentage (premium) is a good thing for performance ratios like ROE.',
    'GarpConvictionScore': 'The GARP Conviction Score is a proprietary metric calculated out of 100, designed to provide a nuanced view of a company\'s quality. Instead of a simple pass/fail, it uses a scaled scoring system. Each of the 10 GARP criteria (covering Growth, Profitability, and Valuation) is graded on its performance, earning a score multiplier (e.g., 0x for poor, 1.0x for good, 1.2x for exceptional). The final score is the weighted sum of these graded results, providing a more precise measure of a company\'s alignment with the GARP strategy.',
    'SectorMomentum': 'This report fetches historical sector performance data from the FMP API, which provides a cumulative year-to-date return for each day. It then calculates the 1-month and 3-month performance by comparing the most recent cumulative figure against the figures from one and three months prior. The Year-to-Date (YTD) figure is the latest cumulative performance data available. The AI then summarizes these trends to identify market leaders and laggards.',
    'TenQAnalysis': 'Summarizes key financial performance (Revenue, EPS, Margins, Cash Flow) and material updates from a 10-Q filing text provided by the user.',
    'TenKAnalysis': 'Summarizes key annual financial performance, strategic commentary, and risk factor updates from a 10-K filing text provided by the user.',
    'EightKAnalysis': 'Summarizes the core event reported in an 8-K filing text provided by the user.',
    'TenQThesisImpact': 'Compares the key findings from a generated 10-Q Summary against the latest Updated Final Thesis report to assess the impact on the investment case, specifically evaluating the core "Edge" and "Linchpin Risk". Conditionally suggests alternative angles if the thesis is downgraded.',
    'TenKThesisImpact': 'Compares the key findings from a generated 10-K Summary against the latest Updated Final Thesis report to assess the impact on the long-term investment case, specifically evaluating the core "Edge" and "Linchpin Risk". Conditionally suggests alternative angles if the thesis is downgraded.',
    'EightKThesisImpact': 'Compares the key findings from a generated 8-K Summary against the latest Updated Final Thesis report to assess the impact on the investment case, specifically evaluating the core "Edge" and "Linchpin Risk". Conditionally suggests alternative angles if the thesis is downgraded.',
    'MarketReactionAnalysis': 'Analyzes the discrepancy between the fundamental conclusion drawn in a Thesis Impact Report and the actual stock price change following the filing release. It uses the Filing Summary and Thesis Impact Report to hypothesize reasons for the market\'s behavior.' // NEW
};
