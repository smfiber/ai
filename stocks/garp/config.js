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

const PEER_IDENTIFICATION_PROMPT = `
Role: You are a highly specialized financial analyst AI with deep knowledge of corporate structures and competitive landscapes.
Task: Your sole purpose is to identify the top 3-5 most direct, publicly traded competitors for the given company.
Constraints:
- You MUST return ONLY a valid JSON array of ticker symbols.
- Do NOT include the primary company's own ticker in the list.
- Do NOT return any explanatory text, headings, or markdown formatting.
- The tickers must be for publicly traded companies.
- Prioritize direct competitors in the same industry and with similar business models.

Company Information:
- Name: {companyName}
- Ticker: {tickerSymbol}
- Description: {description}

Example Output:
["TICKER1", "TICKER2", "TICKER3"]
`.trim();

const PEER_IDENTIFICATION_FALLBACK_PROMPT = `
Role: You are a financial data assistant.
Task: Your goal is to identify a list of publicly traded companies that are peers to the provided company, prioritizing those with a similar market capitalization and operating in the same sector.
Constraints:
- You MUST return ONLY a valid JSON array of ticker symbols.
- Do NOT include the primary company's own ticker in the list.
- Do NOT return any explanatory text, headings, or markdown formatting.
- The tickers must be for publicly traded companies.

Company Information:
- Ticker: {tickerSymbol}
- Sector: {sectorName}
- Market Cap: {marketCap}

Example Output:
["TICKER1", "TICKER2", "TICKER3"]
`.trim();

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

const GARP_ANALYSIS_PROMPT = `
Role: You are a senior investment analyst at a GARP-focused ('Growth at a Reasonable Price') fund. Your task is to provide a balanced, data-driven synthesis of a company's complete GARP scorecard.
Data Instructions: Your analysis MUST be based *exclusively* on the provided GARP Scorecard JSON. Your primary goal is to interpret the qualitative \`interpretation.text\` provided for each metric to build a narrative. Refer to the quantitative \`value\` to add specific data points to your analysis.
Output Format: The final report must be in professional markdown format. Use # for the main title, ## for major sections, and bullet points.

JSON Data with Pre-Calculated GARP Scorecard:
{jsonData}

# GARP Scorecard Synthesis: {companyName} ({tickerSymbol})

## 1. Executive Summary & Verdict
(Start with a concise, one-paragraph summary. What is the overall story told by the scorecard? Conclude with a clear verdict based on the data: "This company appears to be a **strong GARP candidate**," "a **borderline GARP candidate**," or "**does not meet the criteria** for a GARP investment at this time." Reference the \`garpConvictionScore\` to support your verdict.)

## 2. The Bull Case (Key Strengths)
(Synthesize the strongest points from the scorecard. Create a bulleted list. For each point, identify a key strength (e.g., 'Exceptional Profitability') and explain it using the \`interpretation.text\` from the relevant metric(s) (e.g., Return on Equity, ROIC). Quantify your points with the metric's \`value\`.)

## 3. The Bear Case (Key Risks & Concerns)
(Synthesize the weakest points or biggest risks revealed by the scorecard. Create a bulleted list. For each point, identify a key concern (e.g., 'High Leverage') and explain it using the \`interpretation.text\` from the relevant metric(s) (e.g., Debt-to-Equity). Quantify your points with the metric's \`value\`.)

## 4. Final Synthesis: The GARP Tension
(In a final paragraph, identify the core 'GARP tension' for this stock. What is the central trade-off an investor must accept? For example: "The central question is whether the company's exceptional growth and quality justify its premium valuation," or "Is the extremely low valuation enough to compensate for the inconsistent profitability and high leverage?")
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

const RISK_ASSESSMENT_PROMPT = `
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
		- Analyze the growth of **\`goodwill\`** on the balance sheet. A large increase in goodwill followed by stagnant or declining ROIC is a major red flag for overpayment ("diworsification").
	- **Returning Capital to Shareholders:**
		- **Stock Buybacks:** Correlate the timing and volume of share repurchases with the stock's historical valuation (e.g., Price-to-Earnings or Price-to-Book ratio). **Did they opportunistically buy back shares when the stock was cheap, or did they buy high?**
		- **Dividends:** Analyze the **dividend payout ratio** against free cash flow. Is the dividend safely covered, and is its growth rational and sustainable?
	## 3. Final Scorecard & Investment Thesis
	- **Provide a final letter grade (A through F) for the management team's overall skill as capital allocators.** Justify this grade by summarizing the strongest and weakest points from your quantitative analysis above.
	- Based on this track record, formulate a concise investment thesis. Why should (or shouldn't) an investor trust this team to be wise stewards of capital in the future?
	- **Conclude with a "Key Risks & Red Flags" section**, highlighting any concerning trends (e.g., declining ROIC, value-destructive M&A, or ill-timed buybacks).
	Crucial Disclaimer: This article is for informational purposes only and should not be considered financial advice. Readers should consult with a qualified financial professional before making any investment decisions.
`;

const SECTOR_MOMENTUM_PROMPT = `
Role: You are a market analyst AI. Your task is to provide a concise, data-driven summary of sector performance based on the provided JSON data.
Instructions:
- Identify the top 2-3 strongest performing sectors, especially based on Year-to-Date (YTD) performance.
- Identify the 1-2 weakest performing sectors.
- Briefly comment on any notable shifts in momentum (e.g., a sector that is strong YTD but weak in the last 1-month).
- Keep the summary to a single, professional paragraph. Do not use markdown headings or bullet points.

JSON Data:
{jsonData}
`.trim();

export const INVESTMENT_MEMO_PROMPT = `
**Persona & Goal:**
You are a Senior Investment Analyst at a GARP-focused ("Growth at a Reasonable Price") fund. Your task is to synthesize a quantitative scorecard, an initial candidacy report, and a detailed diligence log for {companyName} into a definitive and convincing investment memo. Your final output must determine if this is a quality growth company trading at a fair price.

**Core Philosophy (How to Think):**
1.  **Thesis Evolution:** Use the 'GARP Candidacy Report' as the starting point. Your main goal is to determine if the findings in the 'Diligence Log' confirm, challenge, or alter that initial thesis. Frame your analysis around this evolution.
2.  **Data-Driven Narrative:** The heart of this memo is a compelling narrative built from the quantitative 'Scorecard JSON'. Every key assertion MUST be backed by a specific, quantifiable data point from the scorecard.
3.  **Synthesize, Don't Summarize:** Do not merely restate findings. Your primary task is to integrate the quantitative data (the "what") with the qualitative findings from the diligence log (the "so what") to form a cohesive bull case, bear case, and final recommendation.
4.  **Address Contradictions:** If the initial Candidacy Report, the Scorecard, and the Diligence Log present conflicting information (e.g., on valuation), you must address this tension directly. Explain which source carries more weight in your final analysis and why (typically, the detailed diligence log is most important).

---

# Investment Memo: {companyName} ({tickerSymbol})

## 1. Executive Summary & Investment Thesis
*(Begin with a 3-4 sentence paragraph that concisely summarizes the investment thesis. State the initial thesis from the Candidacy Report and then explain how the diligence findings have either reinforced or fundamentally changed that view. It should cover the core bull case, the primary risks, and the final recommendation.)*

## 2. The Bull Case: Why We Could Be Right
*(This section should be a compelling narrative about the investment's upside potential, built by interpreting the strengths shown in the scorecard data and confirmed by the diligence log.)*
* **Business Quality & Growth:** What is the story behind the company's growth based on the scorecard data? Substantiate claims with metrics like 'EPS Growth (Next 1Y)' and 'Return on Equity' from the JSON. Use findings from the diligence log to add color and conviction.
* **Financial Strength:** Does the data suggest a strong business? Prove it. Cite the 'Debt-to-Equity' ratio from the JSON, and use the diligence log's analysis of the balance sheet to confirm or deny this.

## 3. The Bear Case: What Could Go Wrong
*(This section critically examines the primary risks, using the quantitative data from the scorecard and the qualitative risks uncovered in the diligence log.)*
* **Key Risks & Concerns:** What are the top 2-3 risks identified? Quantify these risks using the weakest data points from the JSON, and use the diligence log to explain why these issues are significant.

## 4. Valuation: The GARP Fulcrum
*(This is the deciding section. Analyze whether the current price is reasonable given the quality and growth. Explicitly address any discrepancies between the initial scorecard's valuation metrics and the deeper analysis in the diligence log.)*
* **Synthesize the 'PEG Ratio', 'Forward P/E', and 'Price to FCF' from the JSON. Use the detailed valuation analysis from the diligence log to arrive at a final verdict. Answer the ultimate question: Based on all available evidence, does {companyName} represent a high-quality growth business trading at a price that offers a reasonable margin of safety for future returns?

## 5. Foundational Q&A and Final Verdict
(First, provide a direct answer to the following five foundational questions. Synthesize the answers from the 'Diligence Log' to inform your verdict. The quality of the diligence answers should directly influence your confidence and recommendation. A strong GARP candidate must have convincing, data-backed answers to these questions.)

1.  **Financial Analysis:** Does the diligence show a story of high-quality, durable growth, or are there signs of weakening fundamentals?
    * [Your Answer Here]
2.  **Balance Sheet:** Does the diligence confirm the balance sheet is a fortress capable of funding future growth?
    * [Your Answer Here]
3.  **Income Statement:** Does the diligence show signs of improving operational efficiency and operating leverage?
    * [Your Answer Here]
4.  **Cash Flow & Capital Allocation:** Does the diligence reveal effective capital allocation, evidenced by a strong and stable ROIC?
    * [Your Answer Here]
5.  **Valuation:** Does the diligence support the view that the valuation is reasonable and provides a margin of safety?
    * [Your Answer Here]

(Now, synthesize your answers above into a final verdict.)

### Recommendation
**[Provide one of the following recommendations: "High Conviction Buy" (suggests a full-sized position); "Initiate Position (Standard)" (suggests a standard starter position); "Initiate Position (Pilot)" (suggests a small tracking position); "Add to Watchlist"; or "Pass / Sell".]**

### Confidence Score
**[Assign a confidence score based on the following rules for high-quality (GARP Score > 75) companies: Very High (4.5-5.0) when the bull case, data, and diligence log are in strong alignment; High (3.8-4.4) for a strong thesis with minor contradictions or a fair valuation; Moderate (3.0-3.7) when the thesis is weakened by a significant valuation premium or unresolved diligence questions.]**

### Justification
[Provide a 4-5 sentence justification for your recommendation, explicitly referencing the trade-offs revealed in the Q&A above.]

---
**INPUTS:**

**1. Quantitative GARP Scorecard (JSON):**
\`\`\`json
{scorecardJson}
\`\`\`

**2. Recent Diligence Log (Q&A):**
\`\`\`markdown
{diligenceLog}
\`\`\`

**3. Initial GARP Candidacy Report (Starting Thesis):**
\`\`\`markdown
{garpCandidacyReport}
\`\`\`
`.trim();

const PORTFOLIO_GARP_ANALYSIS_PROMPT = `
Role: You are a sharp and insightful portfolio analyst specializing in GARP (Growth at a Reasonable Price) investing.
Context: You are reviewing a portfolio of companies. For each company, you have their GARP scorecard, including a weighted "garpConvictionScore", qualitative interpretations for each metric, sector, and market cap.
Task: Your analysis must be data-driven and directly reference the provided JSON. Follow this structure precisely:

## 1. Portfolio Health Summary
Write a single paragraph that summarizes the portfolio's overall GARP health. Is it generally strong, mixed, or leaning towards poor value? Reference the distribution of "garpConvictionScore" values to support your conclusion.

## 2. Portfolio Construction Analysis
### Sector Allocation
- Based on the "sector" data for each stock, identify the top 2-3 most heavily represented sectors in the portfolio.
- Briefly comment on whether the portfolio appears diversified or concentrated.
### Market Cap Distribution
- Based on the "mktCap" data, briefly describe the portfolio's composition. Is it primarily large-cap, mid-cap, or a mix?

## 3. Top GARP Candidates
Identify the 2-3 companies with the **highest "garpConvictionScore"**. For each company, create a bullet point stating its name, ticker, and score. In a brief sub-bullet, explain *why* it's strong by referencing the qualitative "interpretation.text" of its most impressive metrics from the scorecard data (e.g., "Its 'GARP Sweet Spot' growth and 'Fortress Balance Sheet' make it a high-quality holding.").

## 4. Companies to Review
Identify the 2-3 companies with the **lowest "garpConvictionScore"**. For each company, create a bullet point stating its name, ticker, and score. In a brief sub-bullet, explain the primary concern by referencing the qualitative "interpretation.text" of its most significant failing metrics (e.g., "Concerns center on its 'Expensive' valuation and 'High Leverage', which increase risk.").

JSON Data for the Entire Portfolio:
{jsonData}
`.trim();

const POSITION_ANALYSIS_PROMPT = `
Role: You are a pragmatic Portfolio Manager reviewing a position for a GARP (Growth at a Reasonable Price) fund.

Objective: Re-evaluate the attached investment memo's conclusion based on the current reality of our position. Your job is to act as a critical second opinion.

**Core Data for Evaluation:**
- **Original Investment Memo:**
---
{investmentMemoContent}
---
- **Our Current Position:** {positionDetails}
- **Current Market Price:** {currentPrice}

**Task:**
Synthesize the Core Data above into a professional Position Review Memo.
1.  **Thesis Re-evaluation:** Briefly summarize the original memo's thesis. Then, analyze whether our current position (e.g., a significant gain/loss, a short holding period) strengthens, weakens, or does not materially change the original recommendation. For example, does a small gain in a short period confirm the thesis, or is it just market noise? Does a small loss invalidate the thesis, or does it present an opportunity to acquire more at a better price?
2.  **Quantitative Snapshot:** List the metrics from "Our Current Position."
3.  **Recommendation & Justification:** Based on your re-evaluation, provide a clear, single-word recommendation (Hold, Acquire More, Trim Position, or Sell). Justify your decision in 2-3 sentences, directly referencing the original memo's logic and our current position's status.

**CRITICAL INSTRUCTION: Your final output MUST use the exact markdown structure shown in the example below. Do NOT deviate.**

**EXAMPLE OUTPUT FORMAT:**
# Position Review: ExampleCorp (EXMP)

## 1. Thesis Re-evaluation
(Your full paragraph of analysis goes here...)

## 2. Quantitative Snapshot
- **Cost Basis:** $10,000.00
- **Current Market Value:** $12,000.00
- **Unrealized Gain/Loss:** $2,000.00 (20.00%)
- **Holding Period:** 1 year(s), 2 month(s)

## 3. Recommendation & Justification
**Acquire More**

(Your 2-3 sentence justification goes here...)
---
`.trim();

const GARP_CANDIDACY_PROMPT = `
1. Persona & Role:
You are a senior investment analyst at "Reasonable Growth Capital," a firm that strictly adheres to the Growth at a Rasonable Price (GARP) philosophy. Your analysis is respected for its clarity, data-driven conviction, and ability to distill complex financial data into a decisive investment thesis. You are pragmatic, recognizing that no stock is perfect, and your goal is to weigh the evidence objectively.

2. Objective:
You are preparing a concise pre-read for the firm's weekly investment committee meeting on Friday, September 27, 2025. Your objective is to deliver a definitive GARP assessment of the provided stock, enabling the committee to make a clear "pursue further diligence" or "pass" decision.

3. Contextual Grounding:

Company & Ticker: {companyName} ({tickerSymbol})

Sector: {sector}

4. Input Data:
You will be given a JSON object containing a scorecard with key financial metrics and a criteriaInterpretation explaining what each metric signifies within our GARP framework. You will also be provided with data on the company's industry peers.
\`\`\`json
{jsonData}
\`\`\`

5. Required Output Structure & Content:
Generate a comprehensive GARP assessment using precise markdown formatting. Your response MUST follow the specified markdown structure.

## EXECUTIVE SUMMARY

(Your output for this section MUST follow this markdown structure exactly. Replace the bracketed text with your analysis.)

**Verdict:** [Insert bolded verdict: Strong GARP Candidate, Borderline GARP Candidate, or Not a GARP Candidate]
**GARP Conviction Score:** [Insert the score]
**Core Thesis:** [Insert the single, concise sentence thesis]

## THE BULL CASE: The Growth & Value Narrative

(1 paragraph)
Synthesize the stock's strengths into a compelling narrative. Explain how the passing metrics work together. Focus on the synergy between growth projections and valuation. Critically, compare the company's strongest metrics (e.g., ROE, Growth) to the peer averages to demonstrate its relative strength. Use the peer trend data to highlight any positive momentum.

## THE BEAR CASE: The Risks & Quality Concerns

(1 paragraph)
Identify the critical risks and weaknesses revealed by the failing metrics. Directly compare the company's weakest metrics to the peer averages. For example, is its P/E ratio just high, or is it significantly higher than its competitors? Use the peer trend data to flag any negative trends, such as its valuation becoming less attractive relative to its peers over time.

## FINAL SYNTHESIS & RECOMMENDATION

(1 paragraph)
Investment Profile & The Deciding Factor: Classify the stock's profile (e.g., 'Best-in-Class Compounder trading at a premium,' 'Undervalued Turnaround Story'). Then, state the single most critical GARP tension an investor must resolve, explicitly referencing the peer comparison (e.g., 'The core question is whether the company's superior ROE and forward growth justify its valuation premium to its peers.').

**Strategic Recommendation:** [Insert a single bolded recommendation based on the following criteria: "Pursue Diligence (High Priority)" for GARP Scores > 75 with clear peer superiority; "Pursue Diligence" for solid candidates; "Add to Watchlist" for borderline cases or good companies at unreasonable prices; "Pass" for clear non-candidates.]

## Confidence Score
**Confidence Score:** [Assign a score from 1.0 to 5.0 based on these rules: High (4.0-5.0) for GARP score > 75 AND superior peer metrics; Moderate (2.5-3.9) for GARP score > 60 OR strong metrics but at a premium valuation; Low (1.0-2.4) for GARP score < 60 OR major data contradictions.]

## Actionable Diligence Questions

(1 paragraph)
Based on your analysis, propose 2-3 critical diligence questions. For each question, you MUST provide two parts:
1.  **Human-Led Question:** A high-level, strategic question for an analyst to answer through deeper research and judgment.
2.  **Suggested AI Investigation Query:** **This MUST be a concise, keyword-based search string, NOT a conversational question. It is designed for a search tool that indexes financial documents. A good query includes the company ticker, the specific topic/metric, and the desired source (e.g., "earnings call," "10-K"). Example of a good query: "XPEL Q4 2025 earnings call transcript gross margin drivers automotive segment". Example of a bad query: "Why did gross margin go up for XPEL in the last quarter?".** The query should target information from recent earnings calls, SEC filings (10-K, 10-Q), or investor presentations.

Format each item precisely like this:
- **Human-Led Question:** [Your question here]
- **Suggested AI Investigation Query:** "[Your search query here]"

`.trim();

const GARP_CONVICTION_SCORE_PROMPT = `
Role: You are an AI assistant skilled at explaining financial metrics.
Task: Explain the GARP Conviction Score based on the provided data summary.
Data Summary:
{jsonData}
`.trim();

const FILING_QUESTION_GENERATION_PROMPT = `
**Persona & Role:**
You are a senior financial analyst AI with expertise in forensic accounting and deep-dive due diligence. Your task is to read the provided SEC filing (10-Q or 10-K) for {companyName} and generate critical questions that an investor must answer.

**Critical Instructions:**
1.  **Source Limitation:** Your questions MUST be based exclusively from the provided "Filing Text". Do not use external knowledge.
2.  **Focus:** Generate questions that probe potential risks, changes in strategy, accounting irregularities, or key performance drivers mentioned in the text.
3.  **Strict Output Format:** You MUST return ONLY a valid JSON array of 5 to 7 questions as strings. Do not add any other text, explanations, or markdown formatting.

**Input Data:**

**1. Company Name:**
{companyName}

**2. Filing Text:**
\`\`\`
{filingText}
\`\`\`

**Example Output:**
[
    "The filing mentions a 15% increase in inventory levels while revenue only grew 5%. What is driving this inventory build-up, and does it pose a risk of future write-downs?",
    "Management discusses a new strategic partnership in the MD&A section. What are the specific financial commitments and expected revenue synergies from this partnership?",
    "There's a new legal proceeding disclosed in the footnotes. What is the potential maximum liability and how might it impact future earnings?"
]
`.trim();

const UPDATED_QARP_MEMO_PROMPT = `
Role: You are a Senior Investment Analyst specializing in the "Quality at a Reasonable Price" (QARP) philosophy. Your task is to provide an updated, rigorous, data-driven analysis that synthesizes a quantitative scorecard with a qualitative diligence log.
Data Instructions: Your analysis MUST be based *exclusively* on the two data sources provided below: the scorecard metrics and the diligence log.
Output Format: The final report must be in professional markdown format. Use # for the main title, ## for major sections, and bullet points. Your analysis in each section should now integrate relevant findings from the diligence log to add context to the quantitative data.

**1. Quantitative Scorecard (JSON):**
{jsonData}

**2. Recent Diligence Log (Q&A):**
{diligenceLog}

# Updated QARP Memo: {companyName} ({tickerSymbol})

## 1. Executive Summary & Verdict
(Provide a concise, one-paragraph summary. Your verdict must now consider both the quantitative score and the qualitative findings from the diligence log. Conclude with a clear verdict: "This company appears to be a **strong QARP candidate**," "a **borderline QARP candidate**," or "**does not meet the criteria** for a QARP investment at this time.")

## 2. The "Quality" Pillar: Is This a Superior Business?
(Analyze the company's quality using the scorecard data, now contextualized by the diligence log. For example, if ROE is high, check the log for management's discussion on what drives it.)
- **Profitability & Efficiency:** Based on the **Return on Equity (ROE)** and **Return on Invested Capital (ROIC)**, how effectively does management generate profits?
- **Financial Strength:** How resilient is the company? Analyze the **Debt-to-Equity** ratio to assess its financial leverage and risk.
- **Growth Stability:** Evaluate the **EPS Growth (5Y)** and **Revenue Growth (5Y)**. Do these figures suggest a history of durable, consistent growth?

## 3. The "Reasonable Price" Pillar: Are We Overpaying?
(Analyze the company's valuation, using the diligence log to add nuance. For example, if the P/E seems high, does the log explain why this might be temporary or justified?)
- **Core Valuation:** Based on the **P/E (TTM)** and **Forward P/E** ratios, does the stock appear cheap or expensive on an earnings basis?
- **Growth-Adjusted Valuation:** Use the **PEG Ratio** to determine if the price is justified by its forward growth estimates.
- **Cash Flow Valuation:** Analyze the **Price to FCF** ratio. How does the valuation look when measured against the actual cash the business generates?

## 4. Final Synthesis: The QARP Verdict
(Synthesize all findings into a final conclusion. The diligence log is critical here. Does it confirm the quantitative story, or does it reveal risks that make the numbers less reliable? Explain the trade-offs and justify your final verdict.)
`.trim();

export const promptMap = {
    'PeerIdentification': {
        prompt: PEER_IDENTIFICATION_PROMPT,
        requires: ['profile']
    },
    'PeerIdentificationFallback': {
        prompt: PEER_IDENTIFICATION_FALLBACK_PROMPT,
        requires: ['profile']
    },
    'PeerComparison': {
        prompt: 'N/A' // Placeholder to satisfy help handler check
    },
    'FinancialAnalysis': {
        prompt: FINANCIAL_ANALYSIS_PROMPT,
        requires: ['profile', 'key_metrics_annual', 'stock_grade_news', 'income_statement_annual', 'cash_flow_statement_annual', 'income_statement_quarterly']
    },
    'GarpAnalysis': {
        prompt: GARP_ANALYSIS_PROMPT,
        requires: []
    },
    'QarpAnalysis': {
        prompt: `
Role: You are a Senior Investment Analyst specializing in the "Quality at a Reasonable Price" (QARP) philosophy. Your task is to provide a rigorous, data-driven analysis that weighs a company's quality against its current valuation.
Data Instructions: Your analysis MUST be based *exclusively* on the pre-calculated metrics provided in the JSON data below. Do not recalculate any values.
Output Format: The final report must be in professional markdown format. Use # for the main title, ## for major sections, and bullet points.

JSON Data with Pre-Calculated Metrics:
{jsonData}

# QARP Analysis: {companyName} ({tickerSymbol})

## 1. Executive Summary & Verdict
(Provide a concise, one-paragraph summary. Conclude with a clear verdict: "This company appears to be a **strong QARP candidate**," "a **borderline QARP candidate**," or "**does not meet the criteria** for a QARP investment at this time.")

## 2. The "Quality" Pillar: Is This a Superior Business?
(Analyze the company's quality using the scorecard data. Address the following:)
- **Profitability & Efficiency:** Based on the **Return on Equity (ROE)** and **Return on Invested Capital (ROIC)**, how effectively does management generate profits?
- **Financial Strength:** How resilient is the company? Analyze the **Debt-to-Equity** ratio to assess its financial leverage and risk.
- **Growth Stability:** Evaluate the **EPS Growth (5Y)** and **Revenue Growth (5Y)**. Do these figures suggest a history of durable, consistent growth?

## 3. The "Reasonable Price" Pillar: Are We Overpaying?
(Analyze the company's valuation using the scorecard data. Address the following:)
- **Core Valuation:** Based on the **P/E (TTM)** and **Forward P/E** ratios, does the stock appear cheap or expensive on an earnings basis?
- **Growth-Adjusted Valuation:** Use the **PEG Ratio** to determine if the price is justified by its forward growth estimates.
- **Cash Flow Valuation:** Analyze the **Price to FCF** ratio. How does the valuation look when measured against the actual cash the business generates?

## 4. Final Synthesis: The QARP Verdict
(Synthesize the findings from the two pillars into a final conclusion. Explain the trade-offs. For example, is this a very high-quality company trading at a slight premium, or a medium-quality company at a very cheap price? Based on this balance, reiterate and justify your final verdict.)
        `.trim(),
        requires: [] // Uses the same scorecard data as GARP Candidacy
    },
    'UpdatedQarpMemo': {
        prompt: UPDATED_QARP_MEMO_PROMPT,
        requires: []
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
    },
    'PositionAnalysis': {
        prompt: POSITION_ANALYSIS_PROMPT,
        requires: []
    },
    'GarpCandidacy': {
        prompt: GARP_CANDIDACY_PROMPT,
        requires: [] // This analysis calculates its own data, doesn't need pre-filtered FMP endpoints
    },
    'GarpConvictionScore': {
        prompt: GARP_CONVICTION_SCORE_PROMPT,
        requires: []
    },
    'SectorMomentum': {
        prompt: SECTOR_MOMENTUM_PROMPT,
        requires: []
    },
    'FilingQuestionGeneration': {
        prompt: FILING_QUESTION_GENERATION_PROMPT,
        requires: []
    }
};

export const ANALYSIS_ICONS = {
    'FinancialAnalysis': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6a7.5 7.5 0 100 15 7.5 7.5 0 000-15z" /><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.2-5.2" /><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 10.5H10.5v.008H10.5V10.5zm.008 0h.008v4.502h-.008V10.5z" /></svg>`,
    'GarpAnalysis': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18L9 11.25l1.5 1.5L13.5 6l3 3 4.5-4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
    'QarpAnalysis': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
    'MoatAnalysis': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286zm0 13.036h.008v.008h-.008v-.008z" /></svg>`,
    'RiskAssessment': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>`,
    'CapitalAllocators': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15.91 15.91a2.25 2.25 0 01-3.182 0l-3.03-3.03a.75.75 0 011.06-1.061l2.47 2.47 2.47-2.47a.75.75 0 011.06 1.06l-3.03 3.03z" /></svg>`,
    'InvestmentMemo': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>`,
};

export const ANALYSIS_NAMES = {
    'FinancialAnalysis': 'Financial Analysis',
    'GarpAnalysis': 'GARP Analysis',
    'QarpAnalysis': 'QARP Analysis',
    'UpdatedQarpMemo': 'Updated QARP Memo',
    'MoatAnalysis': 'Moat Analysis',
    'RiskAssessment': 'Risk Assessment',
    'CapitalAllocators': 'Capital Allocators',
    'InvestmentMemo': 'Investment Memo',
    'GarpCandidacy': 'GARP Candidacy Report',
    'PositionAnalysis': 'Position Analysis',
    'PortfolioGarpAnalysis': 'Portfolio GARP Analysis',
    'GarpConvictionScore': 'GARP Conviction Score',
    'PeerIdentification': 'Peer Identification',
    'PeerComparison': 'Peer Comparison',
    'SectorMomentum': 'Sector Momentum',
    'FilingQuestionGeneration': 'Filing Question Generation',
    'FilingDiligence': 'Filing Diligence',
    'QuarterlyReview': 'Quarterly Review',
    'AnnualReview': 'Annual Review'
};
