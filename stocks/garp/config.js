// fileName: config.js
// --- App Version ---
export const APP_VERSION = "15.0.0-GARP";

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
    sessionLog: []
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
	Crucial Disclaimer: This article is for informational purposes only and should not be considered financial advice. Readers should consult with a qualified financial professional before making any investment decisions.
`;

export const INVESTMENT_MEMO_PROMPT = `
**Persona & Goal:**
You are a Senior Investment Analyst at a GARP-focused ("Growth at a Reasonable Price") fund. Your task is to synthesize a quantitative scorecard and a qualitative candidacy report on {companyName} into a definitive and convincing investment memo. The final output must be a clear, thesis-driven analysis that determines if this is a quality growth company trading at a fair price.

**Core Philosophy (How to Think):**
1.  **Data-Driven Narrative:** The heart of this memo is a compelling narrative built from the qualitative 'Candidacy Report'. However, every key assertion in your narrative MUST be backed by a specific, quantifiable data point from the 'Scorecard JSON'. Do not just list numbers; weave them into your prose to support your arguments.
2.  **Synthesize, Don't Summarize:** Do not merely restate findings from the reports. Your primary task is to integrate the quantitative data (the "what") with the qualitative analysis (the "so what") to form a cohesive bull case, bear case, and final recommendation.
3.  **Address Contradictions:** If the qualitative report is optimistic but a quantitative metric is poor (or vice-versa), you must address this tension directly. Explain which factor carries more weight in your final analysis and why.

---

# Investment Memo: {companyName} ({tickerSymbol})

## 1. Executive Summary & Investment Thesis
*(Begin with a 3-4 sentence paragraph that concisely summarizes the investment thesis. It should cover the core bull case (supported by key metrics from the JSON), the primary risks (highlighted by weak metrics from the JSON), and the final recommendation based on the current valuation.)*

## 2. The Bull Case: Why We Could Be Right
*(This section should be a compelling narrative about the investment's upside potential, drawing its themes from the 'Candidacy Report'.)*
* **Business Quality & Growth:** Based on the qualitative report, what is the story behind the company's growth and competitive position? Substantiate claims about growth and profitability with specific metrics like 'EPS Growth (Next 1Y)' and 'Return on Equity' from the JSON.
* **Financial Strength:** Does the qualitative report suggest a strong business? Prove it with data. Cite the 'Debt-to-Equity' ratio from the JSON to support claims about the balance sheet.

## 3. The Bear Case: What Could Go Wrong
*(This section critically examines the primary risks and counterarguments, drawing its themes from the 'Candidacy Report'.)*
* **Key Risks & Concerns:** What are the top 2-3 risks identified in the qualitative report? Quantify these risks using the weakest data points from the JSON. For example, if the report mentions valuation concerns, cite the 'P/E (TTM)' and 'PEG Ratio'. If it mentions low profitability, cite the 'Return on Invested Capital'.

## 4. Valuation: The GARP Fulcrum
*(This is the deciding section. Analyze whether the current price is reasonable given the quality of the business and its growth prospects.)*
* **Synthesize the 'PEG Ratio' and 'Forward P/E' from the JSON with the growth narrative from the 'Candidacy Report'. Answer the ultimate question: Based on this evidence, is {companyName} a quality growth company trading at a fair price *today*?*

## 5. Final Verdict & Actionable Recommendation
### A. Recommendation
*(Provide a clear, actionable recommendation based on your synthesis.)*
* **High Conviction Buy**
* **Initiate Position**
* **Add to Watchlist**
* **Pass**
### B. Justification
*(Provide a 1-2 sentence justification for your recommendation, explicitly referencing the most critical trade-off between the bull and bear case.)*

---
**INPUTS:**

**1. Quantitative GARP Scorecard (JSON):**
\`\`\`json
{scorecardJson}
\`\`\`

**2. Qualitative AI GARP Candidacy Report (Markdown):**
\`\`\`markdown
{candidacyReport}
\`\`\`
`.trim();

const PORTFOLIO_GARP_ANALYSIS_PROMPT = `
Role: You are a sharp and concise portfolio analyst specializing in GARP (Growth at a Reasonable Price) investing.
Context: You are reviewing a portfolio of companies. For each company, you have their GARP scorecard, which checks 10 specific criteria.
Task: Your analysis must be data-driven and directly reference the provided JSON. Follow this structure precisely:
1.  **Top Performers:** In a section titled "## Top GARP Candidates", identify the 2-3 companies with the highest number of "criteriaMet". For each company, create a bullet point stating its name, ticker, and score (e.g., "9/10"). In a brief sub-bullet, explain *why* it's strong by mentioning 1-2 of its most impressive passing metrics from the scorecard data (e.g., "Excellent forward growth and a low PEG ratio.").
2.  **Companies to Review:** In a section titled "## Companies to Review", identify 2-3 companies with the lowest number of "criteriaMet". For each, create a bullet point with its name, ticker, and score. In a sub-bullet, explain the primary concern by highlighting 1-2 of its most significant failing metrics (e.g., "High P/E ratio and declining revenue growth.").
3.  **Portfolio Overview:** In a final section titled "## Portfolio Health Summary", write a single paragraph that summarizes the portfolio's overall GARP health. Is it generally strong, mixed, or leaning towards poor value? Reference the distribution of scores to support your conclusion.

JSON Data for the Entire Portfolio:
{jsonData}
`.trim();

export const promptMap = {
    'FinancialAnalysis': {
        prompt: FINANCIAL_ANALYSIS_PROMPT,
        requires: ['profile', 'key_metrics_annual', 'stock_grade_news', 'income_statement_annual', 'cash_flow_statement_annual', 'income_statement_quarterly']
    },
    'GarpAnalysis': {
        prompt: GARP_ANALYSIS_PROMPT,
        requires: ['profile', 'key_metrics_annual', 'ratios_annual', 'analyst_estimates', 'income_statement_annual']
    },
    'MoatAnalysis': {
        prompt: MOAT_ANALYSIS_PROMPT,
        requires: ['profile', 'key_metrics_annual', 'income_statement_annual', 'cash_flow_statement_annual', 'ratios_annual']
    },
    'RiskAssessment': {
        prompt: RISK_ASSESSMENT_PROMPT,
        requires: ['profile', 'key_metrics_annual', 'cash_flow_statement_annual', 'income_statement_annual', 'stock_grade_news', 'ratios_annual']
    },
    'CapitalAllocators': {
        prompt: CAPITAL_ALLOCATORS_PROMPT,
        requires: ['cash_flow_statement_annual', 'key_metrics_annual', 'income_statement_annual', 'balance_sheet_statement_annual', 'ratios_annual']
    },
    'InvestmentMemo': {
        prompt: INVESTMENT_MEMO_PROMPT,
        requires: []
    },
    'PortfolioGarpAnalysis': {
        prompt: PORTFOLIO_GARP_ANALYSIS_PROMPT,
        requires: []
    }
};

export const ANALYSIS_ICONS = {
    'FinancialAnalysis': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6a7.5 7.5 0 100 15 7.5 7.5 0 000-15z" /><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.2-5.2" /><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 10.5H10.5v.008H10.5V10.5zm.008 0h.008v4.502h-.008V10.5z" /></svg>`,
    'GarpAnalysis': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18L9 11.25l1.5 1.5L13.5 6l3 3 4.5-4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
    'MoatAnalysis': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286zm0 13.036h.008v.008h-.008v-.008z" /></svg>`,
    'RiskAssessment': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>`,
    'CapitalAllocators': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15.91 15.91a2.25 2.25 0 01-3.182 0l-3.03-3.03a.75.75 0 011.06-1.061l2.47 2.47 2.47-2.47a.75.75 0 011.06 1.06l-3.03 3.03z" /></svg>`,
    'InvestmentMemo': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>`,
};
