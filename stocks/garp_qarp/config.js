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

export const SECTOR_KPI_SUGGESTIONS = {
    'Technology': [
        { name: 'Monthly Active Users (MAU)', description: 'Measures the number of unique users who engage with the product or service within a month.' },
        { name: 'Customer Acquisition Cost (CAC)', description: 'The total cost to acquire a new customer.' },
        { name: 'Customer Lifetime Value (LTV)', description: 'The total revenue a business can expect from a single customer account.' },
        { name: 'Churn Rate (%)', description: 'The percentage of subscribers who discontinue their subscriptions within a given time period.' }
    ],
    'Consumer Cyclical': [
        { name: 'Same-Store Sales Growth (%)', description: 'Compares sales from existing locations to the same period in the prior year.' },
        { name: 'Inventory Turnover', description: 'How many times a company has sold and replaced inventory during a given period.' },
        { name: 'Gross Margin (%)', description: 'The percentage of revenue left after subtracting the cost of goods sold.' }
    ],
    'Healthcare': [
        { name: 'R&D as % of Sales', description: 'Measures the intensity of research and development relative to revenue.' },
        { name: 'Pipeline Status (e.g., Phase III)', description: 'Tracks the progress of key drugs or treatments in the development pipeline.' },
        { name: 'Cash Burn Rate', description: 'The rate at which a company is spending its cash reserves, crucial for non-profitable biotech firms.' }
    ],
    'Financial Services': [
        { name: 'Net Interest Margin (NIM)', description: 'A measure of the difference between interest income generated and the amount of interest paid out.' },
        { name: 'Efficiency Ratio', description: 'Measures a bank\'s overhead as a percentage of its revenue.' },
        { name: 'Book Value Per Share Growth (%)', description: 'The rate at which the net asset value of the company per share is growing.' }
    ],
    'Industrials': [
        { name: 'Backlog', description: 'The total value of confirmed orders that have not yet been fulfilled.' },
        { name: 'Book-to-Bill Ratio', description: 'The ratio of orders received to units shipped and billed for a specific period.' },
        { name: 'Capacity Utilization (%)', description: 'The extent to which a firm uses its installed productive capacity.' }
    ],
    'Energy': [
        { name: 'Production Growth (BOE/day)', description: 'The growth in barrels of oil equivalent produced per day.' },
        { name: 'Finding and Development Costs ($/BOE)', description: 'The cost to find and develop new reserves, per barrel of oil equivalent.' },
        { name: 'Reserve Replacement Ratio (%)', description: 'The percentage of produced reserves that are replaced with new reserves.' }
    ]
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

const MOAT_ANALYSIS_PROMPT = `
Role: You are a business strategist AI who excels at explaining complex business concepts in simple, relatable terms. Your task is to analyze {companyName}'s competitive advantages.
Concept: An "economic moat" is a company's ability to maintain its competitive advantages and defend its long-term profits from competitors.
Data Instructions: Your analysis must be derived exclusively from the provided JSON data, which contains pre-calculated trends and metrics.
Output Format: Provide a brief report in markdown. Explain each point simply and conclude with a clear verdict on the moat's strength.

---
**CRITICAL INSTRUCTION: Your final output MUST use the exact markdown structure and headings provided below. Do not add any introductory or concluding paragraphs outside of this structure.**
---

JSON Data:
{jsonData}

# Economic Moat Analysis: {companyName} ({tickerSymbol})
## 1. What Gives This Company Its Edge? (Sources of the Moat)
Analyze the data for signs of a durable competitive advantage. Discuss:
- **Return on Invested Capital (ROIC):** Analyze the 'roicTrend' data. Explain this as the "gold standard" for moat analysis. A consistently high **and stable/rising** ROIC (>15%) is a strong sign of a moat.
- **Pricing Power & Profitability:** Are the trends in 'profitabilityTrends' (net profit margin, operating income, gross profit margin) consistently high **and stable** over time? Explain this as a sign that the company can reliably charge more.
- **Qualitative Clues (from Description):** Based on the 'qual-itativeClues.description', what themes suggest a moat? Look for mentions of a "platform," "network," "marketplace," or "mission-critical" systems.
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

const CAPITAL_ALLOCATORS_PROMPT = `
Role: You are a critical, business-focused investment analyst. Your task is to evaluate the skill of {companyName}'s management team as capital allocators, based *only* on the provided financial data.
Data Instructions: Your analysis must be derived exclusively from the provided JSON data. Be objective; praise should be reserved for exceptional, data-backed performance.
Output Format: Provide a detailed report in professional markdown format.

JSON Data:
{jsonData}

---
**CRITICAL INSTRUCTION: For Section 1, you MUST use the pre-calculated 'summaryTotals' from the JSON data as the source of truth for your analysis. Do not calculate these totals yourself.**
---

# Capital Allocation Report: {companyName} ({tickerSymbol})

## 1. Deduced Capital Allocation Philosophy
Based on the **pre-calculated 'summaryTotals'**, what have been the company's primary uses of cash over the last decade? State the total amounts for Acquisitions, CapEx, Buybacks, and Dividends. Is the philosophy geared towards aggressive growth (reinvestment) or shareholder returns?

## 2. Reinvestment Effectiveness
- **Return on Invested Capital (ROIC):** This is the key measure of management's skill. Analyze the 'reinvestmentEffectiveness.roicTrend'. Is it consistently high (e.g., >15%), stable, rising, or volatile/declining? A strong ROIC trend is the clearest sign of effective capital deployment.
- **Revenue & Profit Growth:** How has the reinvestment translated into top-line and bottom-line growth? Analyze the trends in 'reinvestmentEffectiveness.revenueGrowth' and 'reinvestmentEffectiveness.grossProfitGrowth'. Is growth accelerating or decelerating?

## 3. Acquisition Track Record (M&A)
- Analyze the 'acquisitionHistory' data. Analyze the 'acquisitionHistory' data. For periods of significant spending, **cite the acquisition amount for each individual year** and correlate it with the corresponding 'reinvestmentEffectiveness.roicTrend'. Did ROIC improve or decline after major acquisitions?
- Look at the 'goodwill' trend. A large increase in goodwill followed by stagnant or declining ROIC is a major red flag for overpaying for deals.

## 4. Shareholder Returns
- **Stock Buybacks:** Analyze the 'shareholderReturns.buybacksWithValuation' data. Did management opportunistically repurchase shares when valuation multiples (P/E, P/B) were low, or did they buy back stock at high valuations? Be critical here.
- **Dividends:** Analyze the 'shareholderReturns.fcfPayoutRatioTrend'. Is the dividend safely covered by free cash flow, and is its growth rational and sustainable?

## 5. Final Grade & Justification
- **Provide a final letter grade (A through F) for the management team's overall skill as capital allocators.** Justify this grade by summarizing the strongest and weakest points from your quantitative analysis above. Conclude with a bottom-line assessment for a long-term investor.
`.trim();

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

const UPDATED_GARP_MEMO_PROMPT = `
**Persona & Goal:**
You are a Senior Investment Analyst at a GARP-focused ("Growth at a Reasonable Price") fund. Your task is to synthesize a quantitative scorecard, an initial candidacy report, and three specialized diligence memos for {companyName} into a definitive and convincing final investment memo.

**Core Philosophy (How to Think):**
1.  **Synthesize, Don't Summarize:** Do not merely restate findings from the diligence memos. Your primary task is to integrate the findings from the **Qualitative Memo** (the "what"), the **Structured Memo** (the "how"), and the **Market Sentiment Memo** (the "who thinks what") to form a cohesive bull case, bear case, and final recommendation.
2.  **Address Contradictions:** If the specialized memos present conflicting information (e.g., the Structured Memo shows strong quantitative health, but the Market Sentiment Memo shows bearish analyst ratings), you must address this tension directly. Explain which source carries more weight in your final analysis and why.
3.  **Data-Driven Narrative:** Ground your narrative in the **Quantitative GARP Scorecard**. Every key assertion MUST be backed by a specific, quantifiable data point from the scorecard to validate or challenge the conclusions of the diligence memos.

---

# Investment Memo: {companyName} ({tickerSymbol})

## 1. Executive Summary & Investment Thesis
*(Begin with a 3-4 sentence paragraph that concisely summarizes the investment thesis. State the initial thesis from the Candidacy Report and then explain how the diligence findings from the three specialized memos have either reinforced or fundamentally changed that view. It should cover the core bull case, the primary risks, and the final recommendation.)*

## 2. The Bull Case: Why We Could Be Right
*(This section should be a compelling narrative about the investment's upside potential, built by integrating the strengths identified in the specialized memos and validating them with hard data from the Scorecard.)*
* **Business Quality & Moat (from Qualitative Memo):** What is the core conclusion about the company's competitive advantage?
* **Financial Strength & Growth (from Structured Memo):** What is the verdict on the company's quantitative health?
* **Market Confirmation (from Market Sentiment Memo):** Does the current market view (analysts, technicals) support the bull case?
* **Scorecard Validation:** Prove the bull case with key metrics from the Scorecard (e.g., 'Return on Equity', 'EPS Growth (Next 1Y)').

## 3. The Bear Case: What Could Go Wrong
*(This section critically examines the primary risks, synthesizing the weaknesses identified in the specialized memos and quantifying them with data from the Scorecard.)*
* **Key Risks (from all Memos):** What are the top 2-3 risks identified?
* **Scorecard Validation:** Quantify these risks using the weakest data points from the Scorecard (e.g., 'Debt-to-Equity', 'PEG Ratio').

## 4. Valuation: The GARP Fulcrum
*(This is the deciding section. Synthesize the valuation discussion from the memos with the hard data from the Scorecard to determine if a margin of safety exists.)*
* **Synthesize the 'PEG Ratio', 'Forward P/E', and 'Price to FCF' from the Scorecard.** Use these relative metrics to confirm or challenge the valuation assessments in the diligence memos. Answer the ultimate question: Based on all available evidence, does {companyName} represent a high-quality growth business trading at a price that offers a reasonable margin of safety?

## 5. Recommendation & Justification
**[Provide one of the following recommendations: "High Conviction Buy," "Initiate Position (Standard)," "Add to Watchlist," or "Pass / Sell".]**

**[Provide a 4-5 sentence justification for your recommendation, explicitly referencing the trade-offs and tensions revealed by synthesizing the three specialized memos and the quantitative scorecard.]**

---
**INPUTS:**

**1. Quantitative GARP Scorecard (JSON):**
\`\`\`json
{scorecardJson}
\`\`\`

**2. Initial GARP Candidacy Report (Starting Thesis):**
\`\`\`markdown
{garpCandidacyReport}
\`\`\`

**3. Structured (Quantitative) Diligence Memo:**
\`\`\`markdown
{structuredDiligenceMemo}
\`\`\`

**4. Qualitative Diligence Memo:**
\`\`\`markdown
{qualitativeDiligenceMemo}
\`\`\`

**5. Market Sentiment Memo:**
\`\`\`markdown
{marketSentimentMemo}
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
You are preparing a concise pre-read for the firm's weekly investment committee meeting on Friday, October 10, 2025. Your objective is to deliver a definitive GARP assessment of the provided stock, enabling the committee to make a clear "pursue further diligence" or "pass" decision.

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
You are a financial data extraction assistant AI, specializing in summarizing key facts from SEC documents for investors who follow GARP (Growth at a Reasonable Price) and QARP (Quality at a Reasonable Price) principles.

**Core Task:**
Your task is to read the provided SEC filing (10-Q or 10-K) for {companyName} and generate 5 to 7 questions that extract key data points relevant to GARP and QARP analysis.

**Critical Instructions:**
1.  **Source Limitation:** Every question you generate MUST be directly and factually answerable using only the information present in the 'Filing Text' provided. The goal is to extract key data points, not to ask for strategic rationale that is not present.
2.  **Focus on Key Topics:** Generate questions that pull specific facts related to these GARP & QARP themes:
    * **Growth:** Year-over-year changes in Net Sales, Net Income, and EPS.
    * **Profitability & Quality:** Trends in Gross Profit Margin and Operating Margin (as a % of sales), Cash Flow from Operations vs. Net Income, and significant changes in Inventory relative to sales.
    * **Financial Health:** Key balance sheet figures like the total Cash and Investments, and total Debt (if any, excluding operating leases).
    * **Shareholder Returns:** Amounts spent on Dividends or Share Repurchases.
3.  **Question Style:** Frame questions to elicit facts and figures. Start questions with "What was...", "By what percentage did...", or "How much did...". AVOID asking "Why..." or questions about "strategy" unless the filing explicitly details that strategy.
4.  **Strict Output Format:** You MUST return ONLY a valid JSON array of strings. Do not add any other text, explanations, or markdown formatting.

**Input Data:**

**1. Company Name:**
{companyName}

**2. Filing Text:**
\`\`\`
{filingText}
\`\`\`

**Example Output:**
[
    "What were the net sales for the twenty-six weeks ended August 2, 2025, and what was the percentage increase compared to the prior year period?",
    "What was the gross profit margin (as a percentage of net sales) for the thirteen weeks ended August 2, 2025, and how did it compare to the same period in 2024?",
    "How much cash was provided by operating activities for the twenty-six weeks ended August 2, 2025, and how does this compare to the reported Net Income for the same period?",
    "What was the total amount of inventory on the balance sheet as of August 2, 2025, and how does this compare to the balance on February 1, 2025?",
    "How much cash was used to pay dividends during the twenty-six weeks ended August 2, 2025?"
]
`.trim();

const QARP_ANALYSIS_PROMPT = `
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
`.trim();

const UPDATED_QARP_MEMO_PROMPT = `
Role: You are a Senior Investment Analyst specializing in the "Quality at a Reasonable Price" (QARP) philosophy. Your task is to provide an updated, rigorous, data-driven analysis that synthesizes a quantitative scorecard and a qualitative diligence log.
Data Instructions: Your analysis MUST be based *exclusively* on the data sources provided below.
Output Format: The final report must be in professional markdown format. Use # for the main title, ## for major sections, and bullet points. Your analysis in each section should now integrate relevant findings from the diligence log to add context to the quantitative data.

**1. Quantitative Scorecard (JSON):**
{jsonData}

**2. Recent Diligence Log (Q&A):**
{diligenceLog}

# Updated QARP Memo: {companyName} ({tickerSymbol})

## 1. Executive Summary & Verdict
(Provide a concise, one-paragraph summary. Your verdict must now consider the quantitative score and the qualitative findings from the diligence log. Conclude with a clear verdict: "This company appears to be a **strong QARP candidate**," "a **borderline QARP candidate**," or "**does not meet the criteria** for a QARP investment at this time.")

## 2. The "Quality" Pillar: Is This a Superior Business?
(Analyze the company's quality using the scorecard data, now contextualized by the diligence log. For example, if ROE is high, check the log for management's discussion on what drives it.)
- **Profitability & Efficiency:** Based on the **Return on Equity (ROE)** and **Return on Invested Capital (ROIC)**, how effectively does management generate profits?
- **Financial Strength:** How resilient is the company? Analyze the **Debt-to-Equity** ratio to assess its financial leverage and risk.
- **Growth Stability:** Evaluate the **EPS Growth (5Y)** and **Revenue Growth (5Y)**. Do these figures suggest a history of durable, consistent growth?

## 3. The "Reasonable Price" Pillar: Are We Overpaying?
(Analyze the company's valuation, using the diligence log to add nuance. For example, if the P/E seems high, does the diligence suggest it's justified?)
- **Relative Valuation:** Based on the **P/E (TTM)**, **Forward P/E**, and **PEG Ratio**, does the stock appear cheap or expensive relative to its earnings and growth?
- **Cash Flow Valuation:** Analyze the **Price to FCF** ratio. How does the valuation look when measured against the actual cash the business generates?

## 4. Final Synthesis: The QARP Verdict
(Synthesize all findings into a final conclusion. The diligence log is critical here. Does it reveal risks that make the numbers less reliable? Explain the trade-offs and justify your final verdict.)
`.trim();

const EIGHT_K_ANALYSIS_PROMPT = `
**Persona & Role:**
You are a financial analyst AI specializing in the rapid assessment of SEC Form 8-K filings for GARP ("Growth at a Reasonable Price") investors. Your analysis must be objective, concise, and focused on the material impact to a long-term investment thesis.

**Core Task:**
Read the provided 8-K filing text for {companyName} and generate a structured analysis that summarizes the event and assesses its impact.

**Critical Instructions:**
1.  **Source Limitation:** Your entire analysis must be derived *exclusively* from the provided 'Filing Text'. Do not infer information or use outside knowledge.
2.  **Strict Output Format:** You MUST return a response in markdown that follows this structure precisely. Do not add any introductory or concluding paragraphs outside of this structure.

**Input Data:**

**1. Company Name:**
{companyName}

**2. Filing Text:**
\`\`\`
{filingText}
\`\`\`

---

# 8-K Material Event Analysis: {companyName}

## 1. Event Summary
(In one paragraph, concisely summarize the core event being reported in the 8-K. For example: "The company announced the acquisition of Competitor Corp. for $500 million in cash and stock," or "The company announced the immediate resignation of its CEO, Jane Doe, for personal reasons.")

## 2. Impact on Investment Thesis
(For each of the three pillars below, write a brief, one-sentence analysis of the event's potential impact. If the filing does not provide enough information to make an assessment, state "The filing does not provide enough information to assess the impact.")
* **Growth:**
* **Quality / Risk Profile:**
* **Capital Allocation:**

## 3. Overall Significance
(Provide one of the following three verdicts, bolded, followed by a single sentence explaining your choice.)
* **Thesis-Altering:**
* **Monitor Closely:**
* **Minor / Informational:**
`.trim();

const LONG_TERM_COMPOUNDER_PROMPT = `
Role: You are a long-term, business-focused investment analyst, in the style of Warren Buffett or Chuck Akre. Your goal is to determine if {companyName} is a "wonderful business" that can be held for a decade or more, a true "compounder."
Data Instructions: Your analysis must be a synthesis of the two reports provided below: the 'Moat Analysis' and the 'Capital Allocators' report. Do not use any other data. Your job is to connect the findings from these two reports into a single, cohesive narrative.
Output Format: The final report must be in professional markdown format.

**Input Report 1: Moat Analysis**
{moatAnalysisReport}

**Input Report 2: Capital Allocators Analysis**
{capitalAllocatorsReport}

---
**CRITICAL INSTRUCTION: Before generating the memo, you must first state the key verdicts from the input reports below. Use these stated facts as the single source of truth for your analysis.**

-   **Moat Analysis Verdict:** [State the verdict from the Moat Analysis: "Wide," "Narrow," or "None"]
-   **Capital Allocators Grade:** [State the final letter grade from the Capital Allocators report]
---

# Long-Term Compounder Memo: {companyName} ({tickerSymbol})

## 1. The Core Investment Question
(Start with a one-paragraph summary. Based on the two reports, what is the single most important question an investor must answer about this company's long-term prospects? For example, "Is management's aggressive acquisition strategy sustainably widening the company's narrow moat, or is it a 'diworsification' that risks eroding shareholder value?")

## 2. The Makings of a "Wonderful Business"
(Synthesize the BULL case from both reports into a bulleted list.)
- **Competitive Advantage (The Moat):** What did the Moat Analysis conclude? Is it Wide, Narrow, or None? What is the primary source of that advantage (e.g., network effects, high switching costs)?
- **Management Quality (The Jockeys):** What grade did the Capital Allocators report assign to management? What are their greatest strengths as demonstrated by their track record (e.g., shrewd buybacks, high-ROIC internal projects)?
- **Profitability Engine:** Connect the two reports. Does the company's high ROIC (from the Capital Allocators report) confirm the existence and strength of the moat (from the Moat Analysis)? Explain the connection.

## 3. Potential Cracks in the Fortress
(Synthesize the BEAR case and risks from both reports into a bulleted list.)
- **Moat Sustainability Risks:** What are the biggest threats to the company's competitive advantage as identified in the Moat Analysis?
- **Capital Allocation Red Flags:** What were the biggest weaknesses identified in the Capital Allocators report (e.g., overpaying for acquisitions, buying back stock at high valuations)?
- **The Core Tension:** How do the risks from one report potentially impact the strengths of the other? (e.g., "While the company currently enjoys a wide moat, management's recent low-ROIC acquisitions could signal a deterioration of that advantage over time.")

## 4. Final Verdict: A True Compounder?
(Provide a final, one-paragraph verdict. Based *only* on the synthesis of these two reports, does the company have the key ingredients of a long-term compounder: a durable moat and exceptional management? Conclude with one of the following classifications: **"High-Conviction Compounder," "Potential Compounder with Reservations,"** or **"Not a Compounder."** Justify your choice.)
`.trim();

const BMQV_MEMO_PROMPT = `
Role: You are a long-term, business-focused investment analyst, embodying the principles of Warren Buffett and Charlie Munger. Your task is to determine if {companyName} is a "wonderful business" that can be held for a decade or more. Your analysis should be skeptical, focused on durable competitive advantages and rational management.
Data Instructions: Your analysis must be a synthesis of the two reports provided below: the 'Moat Analysis' and the 'Capital Allocators' report. Do not use any other data. Your job is to connect the findings from these two reports into a single, cohesive narrative.
Output Format: The final report must be in professional markdown format.

**Input Report 1: Moat Analysis**
{moatAnalysisReport}

**Input Report 2: Capital Allocators Analysis**
{capitalAllocatorsReport}

---
**CRITICAL INSTRUCTION: Before generating the memo, you must first state the key verdicts from the input reports below. Use these stated facts as the single source of truth for your analysis.**

-   **Moat Analysis Verdict:** [State the verdict from the Moat Analysis: "Wide," "Narrow," or "None"]
-   **Capital Allocators Grade:** [State the final letter grade from the Capital Allocators report]
---

# Buffett-Munger Quality & Value (BMQV) Memo: {companyName} ({tickerSymbol})

## 1. Executive Summary: Is This a "Wonderful Business"?
(In one paragraph, provide a direct answer to the core question. Synthesize the verdicts from the Moat and Capital Allocators reports. Is this a high-quality business with a durable competitive advantage run by skilled and honest managers? Or does it fail these critical tests?)

## 2. The Three Pillars of a "Wonderful Business"
(Synthesize the findings from both reports into a bulleted list, addressing each pillar.)
- **A Durable Moat:** What was the final verdict from the Moat Analysis (Wide, Narrow, or None)? Based on the report, what is the single most important source of this moat (e.g., brand, network effects, low-cost production)?
- **Skilled & Trustworthy Management:** What grade did the Capital Allocators report assign to the management team? What is the single most compelling piece of evidence (positive or negative) from their capital allocation track record (e.g., opportunistic buybacks, high-ROIC reinvestment, or value-destructive acquisitions)?
- **A Resilient Profitability Engine:** Connect the two reports. How does management's capital allocation skill (from the Capital Allocators report) directly impact the durability of the competitive moat (from the Moat Analysis)? For example, "Management's consistent high-ROIC reinvestment directly strengthens the company's low-cost production moat."

## 3. Potential Impairments to Long-Term Value
(Synthesize the primary risks and concerns identified in both reports into a bulleted list.)
- **Moat Erosion Risks:** What are the biggest long-term threats to the company's competitive advantage as identified in the Moat Analysis?
- **Capital Allocation Red Flags:** What were the most significant weaknesses identified in the most significant weaknesses identified in the Capital Allocators report (e.g., overpaying for deals, buying back stock at high valuations)?

## 4. Final Verdict
(Provide a final, one-paragraph verdict. Based on your synthesis, does the company meet the high bar of a "wonderful business" in the Buffett-Munger sense? Conclude with one of the following classifications: **"A Wonderful Business," "A Good Business with Flaws,"** or **"Not a Wonderful Business."** Justify your choice by referencing the trade-offs between the moat and management's skill.)
`.trim();

// --- NEW EXTRACTION & SYNTHESIS PROMPTS (VERSION 2.0) ---

const MOAT_ANALYSIS_EXTRACT_PROMPT = `
Role: You are a data extraction AI.
Task: Your only job is to read the provided 'Economic Moat Analysis' report and extract three specific pieces of information.
CRITICAL INSTRUCTIONS:
- You MUST return ONLY a valid JSON object.
- Do not add any text, explanations, or markdown formatting before or after the JSON.
- For 'verdict', extract one of three possible values: "Wide", "Narrow", or "None".
- For 'primarySource' and 'keyWeakness', extract the single most important reason, summarizing it in a short phrase.

Report Text:
{reportContent}

JSON Output Format:
{
  "verdict": "...",
  "primarySource": "...",
  "keyWeakness": "..."
}
`.trim();

const CAPITAL_ALLOCATORS_EXTRACT_PROMPT = `
Role: You are a data extraction AI.
Task: Your only job is to read the provided 'Capital Allocation Report' and extract three specific pieces of information.
CRITICAL INSTRUCTIONS:
- You MUST return ONLY a valid JSON object.
- Do not add any text, explanations, or markdown formatting before or after the JSON.
- For 'verdict', extract the final letter grade (e.g., "A", "C").
- For 'primaryStrength' and 'primaryWeakness', extract the single most important reason, summarizing it in a short phrase.

Report Text:
{reportContent}

JSON Output Format:
{
  "verdict": "...",
  "primaryStrength": "...",
  "primaryWeakness": "..."
}
`.trim();

const GARP_MEMO_EXTRACT_PROMPT = `
Role: You are a data extraction AI.
Task: Your only job is to read the provided 'Investment Memo' and extract three specific pieces of information.
CRITICAL INSTRUCTIONS:
- You MUST return ONLY a valid JSON object.
- Do not add any text, explanations, or markdown formatting before or after the JSON.
- For 'verdict', extract the final recommendation (e.g., "High Conviction Buy", "Pass / Sell").
- For 'coreTension', extract the central conflict the memo aims to resolve.
- For 'valuationVerdict', extract the memo's final conclusion on valuation.

Report Text:
{reportContent}

JSON Output Format:
{
  "verdict": "...",
  "coreTension": "...",
  "valuationVerdict": "..."
}
`.trim();

const QARP_ANALYSIS_EXTRACT_PROMPT = `
Role: You are a data extraction AI.
Task: Your only job is to read the provided 'QARP Analysis' report and extract three specific pieces of information.
CRITICAL INSTRUCTIONS:
- You MUST return ONLY a valid JSON object.
- Do not add any text, explanations, or markdown formatting before or after the JSON.
- For 'verdict', extract the final verdict (e.g., "strong QARP candidate", "borderline QARP candidate").
- For 'coreTension', synthesize the main trade-off discussed in the final synthesis section.
- For 'valuationVerdict', extract the report's overall conclusion on valuation.

Report Text:
{reportContent}

JSON Output Format:
{
  "verdict": "...",
  "coreTension": "...",
  "valuationVerdict": "..."
}
`.trim();

const COMPOUNDER_BMQV_EXTRACT_PROMPT = `
Role: You are a data extraction AI.
Task: Your only job is to read the provided 'Compounder' or 'BMQV' memo and extract two specific pieces of information.
CRITICAL INSTRUCTIONS:
- You MUST return ONLY a valid JSON object.
- Do not add any text, explanations, or markdown formatting before or after the JSON.
- For 'verdict', extract the final, one-sentence classification (e.g., "High-Conviction Compounder", "Not a Compounder", "A Wonderful Business", "Not a Wonderful Business").
- For 'coreTension', summarize the "Core Investment Question" or "Core Tension" identified in the report in a single sentence.

Report Text:
{reportContent}

JSON Output Format:
{
  "verdict": "...",
  "coreTension": "..."
}
`.trim();

const FINAL_THESIS_CONFLICT_ID_PROMPT = `
Role: You are a conflict identification AI.
Task: Based ONLY on the following JSON of analyst summaries, what is the core disagreement between these reports? Explain the conflict in one concise paragraph. Do not use markdown or headings.

JSON Data:
{jsonData}
`.trim();

const FINAL_INVESTMENT_THESIS_PROMPT = `
Role: You are the Chief Investment Officer of a multi-strategy fund. Your task is to synthesize four separate analyst reports on {companyName} into a final, decisive investment thesis. Your analysis must be objective and based exclusively on the provided inputs.

---
**INPUTS FOR ANALYSIS:**

**1. GARP Memo:** {garpMemo}
**2. QARP Analysis:** {qarpAnalysisReport}
**3. Long-Term Compounder Memo:** {longTermCompounderMemo}
**4. BMQV Memo:** {bmqvMemo}
**5. Market Sentiment Memo:** {marketSentimentMemo}

---
**YOUR TASK (Strict Output Format):**

# Final Investment Thesis: {companyName} ({tickerSymbol})

## 1. Summary of Analyst Verdicts
(First, you MUST complete this summary table by extracting the final verdict from each of the five input memos. This establishes the factual foundation for your analysis.)

| Analyst Memo            | Final Verdict                                 |
| ----------------------- | --------------------------------------------- |
| **GARP Memo** | [Extract the "Recommendation" field]          |
| **QARP Analysis** | [Extract the final "verdict" field]           |
| **Long-Term Compounder**| [Extract the final "Verdict" classification]  |
| **BMQV Memo** | [Extract the final "Verdict" classification]  |
| **Market Sentiment** | [Extract the final "Verdict" classification]  |


## 2. The Core Debate: Identifying the Conflict
(In one paragraph, analyze the completed table above to identify the central point of agreement or disagreement. Do the GARP/QARP frameworks, which focus on current valuation and growth, conflict with the long-term quality assessments of the Compounder/BMQV frameworks? How does the Market Sentiment verdict align with or contradict the fundamental views? State the conflict clearly.)

## 3. Weighing the Evidence & Final Recommendation
(In one or two paragraphs, resolve the conflict you identified in the previous section. Weigh the evidence from the different perspectives. For example, you might conclude that the near-term valuation opportunity identified in the GARP/QARP reports is compelling enough to outweigh the long-term structural risks highlighted by the BMQV/Compounder reports, or vice-versa. Your reasoning here must be logical and lead directly to your final recommendation.)

### Recommendation
**[Provide one of the following recommendations, bolded: "Initiate a Full Position," "Initiate a Half Position," "Add to Watchlist," or "Pass." Justify your choice in one final sentence summarizing your conclusion from the "Weighing the Evidence" section.]**
`.trim();

// --- NEW DILIGENCE MEMO PROMPTS ---

const QUALITATIVE_DILIGENCE_MEMO_PROMPT = `
Role: You are an investment analyst AI specializing in summarizing qualitative business factors.
Task: Based ONLY on the provided Question & Answer pairs, create a "Qualitative Business Memo." Synthesize the answers into a cohesive narrative for each section. Conclude with an overall verdict on the company's business quality.

**Q&A Data:**
{qaData}

# Qualitative Business Memo: {companyName} ({tickerSymbol})

## 1. Competitive Moat Analysis
(Synthesize the user's answer regarding the company's competitive moat here.)

## 2. Management Quality & Strategy
(Synthesize the user's answer regarding management's quality and strategy here.)

## 3. Synthesis & Verdict
(In one paragraph, synthesize all the points. Conclude with a clear verdict: **"Business quality appears High," "Moderate," or "Low."** Justify your choice.)
`.trim();

const STRUCTURED_DILIGENCE_MEMO_PROMPT = `
Role: You are an investment analyst AI specializing in summarizing quantitative financial data.
Task: Based ONLY on the provided Question & Answer pairs, create a "Quantitative Health Memo." Synthesize the answers into a cohesive summary for each section. Conclude with an overall verdict on the company's quantitative health.

**Q&A Data:**
{qaData}

# Quantitative Health Memo: {companyName} ({tickerSymbol})

## 1. Financial & Fundamental Analysis
(Synthesize the user's answer regarding the company's financial analysis here.)

## 2. Balance Sheet Strength
(Synthesize the user's answer regarding the balance sheet here.)

## 3. Income Statement & Cash Flow
(Synthesize the user's answers regarding the income statement and cash flow here.)

## 4. Valuation Assessment
(Synthesize the user's answer regarding valuation here.)

## 5. Synthesis & Verdict
(In one paragraph, synthesize all the points. Conclude with a clear verdict: **"Quantitative health appears Strong," "Average," or "Weak."** Justify your choice.)
`.trim();

const MARKET_SENTIMENT_MEMO_PROMPT = `
Role: You are a market analyst AI specializing in synthesizing sentiment data into a clear narrative.
Task: Based ONLY on the provided Question & Answer pairs, create a "Market Sentiment Memo." Summarize the findings for each section and conclude with an overall verdict on market sentiment.

**Q&A Data:**
{qaData}

# Market Sentiment Memo: {companyName} ({tickerSymbol})

## 1. Analyst Consensus
(Summarize the findings from the 'Analyst Consensus' Q&A here.)

## 2. Fundamental Factor Scores
(Summarize the S&P factor scores from the Q&A here.)

## 3. Technical & Price Momentum
(Summarize the technical sentiment and short interest data from the Q&A here.)

## 4. Synthesis & Verdict
(In one paragraph, synthesize all the points. Conclude with a clear verdict: **"Overall market sentiment appears Bullish," "Bearish," or "Neutral."** Justify your choice.)
`.trim();

const INVESTIGATION_SUMMARY_MEMO_PROMPT = `
Role: You are an investment analyst AI specializing in synthesizing research notes.
Task: Your sole job is to read the unstructured, manually-entered Question & Answer pairs from the diligence log and synthesize them into a professional "Investigation Summary Memo." Your goal is to identify the most critical findings and present them clearly.

**Diligence Log (Q&A Data):**
{qaData}

# Investigation Summary Memo: {companyName} ({tickerSymbol})

## 1. Executive Summary of Findings
(In one concise paragraph, summarize the most important theme or conclusion that emerges from the Q&A log. What is the single most critical insight an investor would gain from this manual research?)

## 2. Key Bullish Findings
(Create a bulleted list summarizing the key positive points, discoveries, or confirmations from the Q&A log.)

## 3. Key Bearish Findings & Unanswered Questions
(Create a bulleted list summarizing the most significant risks, negative findings, or remaining unanswered questions identified in the Q&A log.)
`.trim();


// --- NEW ONGOING REVIEW PROMPTS ---

const QUARTERLY_REVIEW_MEMO_PROMPT = `
Role: You are a portfolio manager conducting a quarterly review of an existing holding.
Task: Your task is to analyze the user's new quarterly findings in the context of the original investment thesis provided. Synthesize this information into a formal, professional Quarterly Review Memo. Your analysis must be objective and directly reference the provided data.

**Original Investment Thesis (Most Recent Investment Memo):**
---
{originalInvestmentMemo}
---

**User's New Quarterly Findings (Q&A):**
---
{qaData}
---

# Quarterly Review Memo: {companyName} ({tickerSymbol})

## 1. Thesis Confirmation or Challenge
(In one paragraph, synthesize the new findings. Does the quarter's performance and management commentary strengthen, weaken, or not materially change the original investment thesis? Be specific.)

## 2. Key Performance Indicators vs. Expectations
(Summarize the user's answer regarding the company's performance against revenue and EPS expectations. Detail the key drivers.)

## 3. Management Outlook & Guidance
(Summarize the user's answer regarding management's forward-looking guidance and commentary from the earnings call.)

## 4. Final Verdict & Action Plan
(Synthesize the user's proposed action plan. Conclude with a clear, single-word verdict based on the user's input: **Hold, Add, Trim, or Sell**. Provide a concise, 1-2 sentence justification for this action.)
`.trim();

const ANNUAL_REVIEW_MEMO_PROMPT = `
Role: You are a portfolio manager conducting an annual review of an existing holding.
Task: Your task is to analyze the user's new annual findings in the context of the original investment thesis provided. Synthesize this information into a formal, professional Annual Review Memo. Your analysis must be objective and directly reference the provided data.

**Original Investment Thesis (Most Recent Investment Memo):**
---
{originalInvestmentMemo}
---

**User's New Annual Findings (Q&A):**
---
{qaData}
---

# Annual Review Memo: {companyName} ({tickerSymbol})

## 1. Long-Term Thesis Validation
(In one paragraph, synthesize the full-year findings. Does the year's performance, strategic progress, and updated outlook strengthen or weaken the original long-term investment thesis? Be specific.)

## 2. Full-Year Performance vs. Guidance
(Summarize the user's answer regarding the company's full-year performance against its own guidance.)

## 3. Strategic Progress & Capital Allocation
(Summarize the user's answer regarding the company's strategic initiatives and the effectiveness of its capital allocation over the full year. Reference ROIC if available.)

## 4. Updated Competitive Landscape & Risks
(Summarize the user's answer regarding any material changes to the material changes to the competitive environment or long-term business risks.)

## 5. Final Verdict & Forward-Looking Action Plan
(Synthesize the user's proposed forward-looking action plan. Conclude with a clear, single-word verdict based on the user's input: **Hold, Add on Weakness, Trim on Strength, or Exit Position**. Provide a concise, 1-2 sentence justification for this plan.)
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
    'QarpAnalysis': {
        prompt: QARP_ANALYSIS_PROMPT,
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
    'CapitalAllocators': {
        prompt: CAPITAL_ALLOCATORS_PROMPT,
        requires: ['cash_flow_statement_annual', 'key_metrics_annual', 'income_statement_annual', 'balance_sheet_statement_annual', 'ratios_annual']
    },
    'InvestmentMemo': {
        prompt: UPDATED_GARP_MEMO_PROMPT,
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
    },
    'EightKAnalysis': {
        prompt: EIGHT_K_ANALYSIS_PROMPT,
        requires: []
    },
    'LongTermCompounder': {
        prompt: LONG_TERM_COMPOUNDER_PROMPT,
        requires: [] // Synthesis report, no direct FMP data
    },
    'BmqvMemo': {
        prompt: BMQV_MEMO_PROMPT,
        requires: [] // Synthesis report, no direct FMP data
    },
    // --- NEW DILIGENCE MEMOS ---
    'QualitativeDiligenceMemo': {
        prompt: QUALITATIVE_DILIGENCE_MEMO_PROMPT,
        requires: []
    },
    'StructuredDiligenceMemo': {
        prompt: STRUCTURED_DILIGENCE_MEMO_PROMPT,
        requires: []
    },
    'MarketSentimentMemo': {
        prompt: MARKET_SENTIMENT_MEMO_PROMPT,
        requires: []
    },
    'InvestigationSummaryMemo': {
        prompt: INVESTIGATION_SUMMARY_MEMO_PROMPT,
        requires: []
    },
    // --- NEW ONGOING REVIEW MEMOS ---
    'QuarterlyReview': {
        prompt: QUARTERLY_REVIEW_MEMO_PROMPT,
        requires: []
    },
    'AnnualReview': {
        prompt: ANNUAL_REVIEW_MEMO_PROMPT,
        requires: []
    },
    // --- V2 EXTRACTION & SYNTHESIS PROMPTS ---
    'MoatAnalysis_Extract': { prompt: MOAT_ANALYSIS_EXTRACT_PROMPT },
    'CapitalAllocators_Extract': { prompt: CAPITAL_ALLOCATORS_EXTRACT_PROMPT },
    'InvestmentMemo_Extract': { prompt: GARP_MEMO_EXTRACT_PROMPT },
    'QarpAnalysis_Extract': { prompt: QARP_ANALYSIS_EXTRACT_PROMPT },
    'LongTermCompounder_Extract': { prompt: COMPOUNDER_BMQV_EXTRACT_PROMPT },
    'BmqvMemo_Extract': { prompt: COMPOUNDER_BMQV_EXTRACT_PROMPT },
    'FinalThesis_ConflictID': { prompt: FINAL_THESIS_CONFLICT_ID_PROMPT },
    'FinalInvestmentThesis': {
        prompt: FINAL_INVESTMENT_THESIS_PROMPT,
        requires: [] // Synthesis report, no direct FMP data
    }
};

export const ANALYSIS_ICONS = {
    'QarpAnalysis': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
    'MoatAnalysis': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286zm0 13.036h.008v.008h-.008v-.008z" /></svg>`,
    'CapitalAllocators': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15.91 15.91a2.25 2.25 0 01-3.182 0l-3.03-3.03a.75.75 0 011.06-1.061l2.47 2.47 2.47-2.47a.75.75 0 011.06 1.06l-3.03 3.03z" /></svg>`,
    'InvestigationSummaryMemo': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" /></svg>`,
    'QualitativeDiligenceMemo': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.76 9.76 0 01-2.53-.388m-5.168-4.482A10.457 10.457 0 013 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25" /></svg>`,
    'StructuredDiligenceMemo': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>`,
    'InvestmentMemo': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2-2z" /></svg>`,
    'EightKAnalysis': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>`,
    'BmqvMemo': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-6.861 0c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-6.861 0c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" /></svg>`,
    'MarketSentimentMemo': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /></svg>`
};

export const ANALYSIS_NAMES = {
    'QarpAnalysis': 'QARP Analysis',
    'UpdatedQarpMemo': 'Updated QARP Memo',
    'MoatAnalysis': 'Moat Analysis',
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
    'EightKAnalysis': '8-K Filing Analysis',
    'QuarterlyReview': 'Quarterly Review',
    'AnnualReview': 'Annual Review',
    'LongTermCompounder': 'Long-Term Compounder Memo',
    'BmqvMemo': 'Buffett-Munger Q&V Memo',
    'FinalInvestmentThesis': 'Final Investment Thesis',
    'QualitativeDiligenceMemo': 'Qualitative Diligence Memo',
    'StructuredDiligenceMemo': 'Structured Diligence Memo',
    'MarketSentimentMemo': 'Market Sentiment Memo',
    'InvestigationSummaryMemo': 'Investigation Summary'
};
