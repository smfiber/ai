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
    'ManagementScorecard': ['executive_compensation'] // Example, assuming this might still be needed indirectly or planned
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
    DB_COLLECTION_FMP_CACHE: 'fmp_cached_data_v2',
    DB_COLLECTION_AI_REPORTS: 'ai_analysis_reports_v2',
};

export const STRUCTURED_DILIGENCE_QUESTIONS = {
    'SEC Filing Analysis 10Q': { // Changed to an object
        question: "Paste the most recent 10-Q filing text here. What key insights does it provide regarding the company's recent performance and financial health?",
        hasDateField: true // Add a flag
    }
};

export const QUALITATIVE_DILIGENCE_QUESTIONS = {
    'The Non-Consensus Thesis (The "Edge")': "Evaluate potential non-consensus beliefs about this company. Select the *single* belief you find most compelling and likely to be the primary driver of future financial outperformance, distinct from the consensus view (e.g., as reflected in the 'Market Sentiment' report). Explain *why* this specific belief makes the company 'great' when others only see it as 'good', detailing the expected mechanism of financial impact. Finally, **estimate the timeframe (e.g., 1-3 years, 5+ years) over which you expect this edge to materially impact the investment thesis.**",
    'Core Thesis & Linchpin Risk (The "Linchpin")': "First, clearly state your single, most important investment thesis in one sentence (The 'Edge'). Second, identify the single most critical 'linchpin' risk or assumption that, if proven wrong, would invalidate this entire thesis. Finally, describe the specific evidence or data (e..g, a specific metric, a competitor's action) you will monitor to track this risk."
};

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

export const SECTOR_KPI_SUGGESTIONS = {
    'Technology': [
        { name: 'Monthly Active Users (MAU)', description: 'Measures the number of unique users who engage with the product or service within a month.' },
        { name: 'Customer Acquisition Cost (CAC)', description: 'The total cost to acquire a new customer.' },
        { name: 'Customer Lifetime Value (LTV)', description: 'The total revenue a business can expect from a single customer account.' },
        { name: 'Churn Rate (%)', description: 'The percentage of subscribers who discontinue their subscriptions within a given time period.' }
    ],
    'Consumer Cyclical': [
        { name: 'Same-Store Sales Growth (%)', description: 'Compares sales from existing locations to the same period in the prior year.' },
        { name: 'Inventory Turnover', description: 'How many times a company has sold and replaced inventory during a given time period.' },
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

// --- Prompts Still In Use ---

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
You are a Senior Investment Analyst at a GARP-focused fund. Your task is to synthesize the provided reports into the template below.

---
**CRITICAL INSTRUCTIONS:**
1.  Your final output MUST use the exact markdown structure, headings, and bullet points provided in the template.
2.  Fill in the [Your analysis here] sections based ONLY on the provided input reports, following the core philosophy of synthesizing, addressing contradictions, and using data-driven narratives.
---

**INPUTS:**
**1. Quantitative GARP Scorecard (JSON):**
{scorecardJson}

**2. Initial GARP Candidacy Report (Starting Thesis):**
{garpCandidacyReport}

**3. Structured (Quantitative) Diligence Memo:**
{structuredDiligenceMemo}

**4. Qualitative Diligence Memo:**
{qualitativeDiligenceMemo}

**5. Market Sentiment Memo:**
{marketSentimentMemo}
---

# Investment Memo: {companyName} ({tickerSymbol})

## 1. Executive Summary & Investment Thesis
[Your 3-4 sentence paragraph here, summarizing the investment thesis by synthesizing the initial candidacy report with the findings from the diligence memos.]

## 2. The Bull Case: Why We Could Be Right
- **Business Quality & Moat (from Qualitative Memo):** [Your analysis here.]
- **Financial Strength & Growth (from Structured Memo):** [Your analysis here.]
- **Market Confirmation (from Market Sentiment Memo):** [Your analysis here.]
- **Scorecard Validation:** [Your analysis here, proving the bull case with specific, quantifiable data points from the scorecard.]

## 3. The Bear Case: What Could Go Wrong
- **Key Risks (from all Memos):** [Your analysis here, synthesizing the top 2-3 risks.]
- **Scorecard Validation:** [Your analysis here, quantifying the risks with the weakest data points from the scorecard.]

## 4. Valuation: The GARP Fulcrum
[Your analysis here, synthesizing the 'PEG Ratio', 'Forward P/E', and 'Price to FCF' from the scorecard to answer the ultimate question of whether the company is trading at a reasonable margin of safety.]

## 5. Recommendation & Justification
(Your response for this section MUST follow the format below exactly, including the bolding.)

**Add to Watchlist**

(Your 4-5 sentence justification here, explicitly referencing the trade-offs and tensions revealed by synthesizing the reports and the quantitative scorecard.)
`.trim(); // Kept as it's used for the 'Updated GARP Memo' in ongoing diligence

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
Objective: Re-evaluate the investment thesis based on the current reality of our position. Your job is to act as a critical second opinion and identify crucial next steps before deploying more capital.

**Core Data for Evaluation:**
1. **Original Moat Analysis:**
---
{moatAnalysisReport}
---
2. **Original Capital Allocators Report:**
---
{capitalAllocatorsReport}
---
3. **Original Investment Memo (Synthesis):**
---
{investmentMemoContent}
---
4. **Our Current Position:** {positionDetails}
5. **Current Market Price:** {currentPrice}

**Task:**
Synthesize all the Core Data above into a professional Position Review Memo.
1.  **Thesis Re-evaluation:** Briefly summarize the memo's thesis. Now, critically re-evaluate it. Does the recent price action challenge the core assumptions about the company's Moat or Management Quality? Or does it confirm the original risks (like market sentiment)?
2.  **Quantitative Snapshot:** List the metrics from "Our Current Position."
3.  **Recommendation & Justification:** Provide a clear, single-word recommendation (Hold, Acquire More, Trim Position, or Sell). Justify it by directly referencing the original reports and our current position's status.
4.  **Critical Follow-Up Questions:** Based on your re-evaluation, what are the 1-2 most critical questions an analyst MUST answer *before* acting on your recommendation? Frame these as actionable diligence items.

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

## 4. Critical Follow-Up Questions
- (Your first critical question goes here...)
- (Your second critical question goes here...)
---
`.trim();

const GARP_CANDIDACY_PROMPT = `
1. Persona & Role:
You are a senior investment analyst at "Reasonable Growth Capital," a firm that strictly adheres to the Growth at a Rasonable Price (GARP) philosophy. Your role is not to make a final decision, but to act as an objective journalist. Your analysis is respected for its clarity, data-driven conviction, and ability to distill complex financial data into a balanced, unbiased assessment. Your tone MUST remain strictly neutral and factual throughout. Avoid judgmental or emotionally charged language (e.g., "alarming," "flawless," "pristine," "red flag").

2. Objective:
You are preparing a concise, data-first pre-read for the firm's weekly investment committee meeting on Friday, October 10, 2025. Your objective is to objectively summarize the qualitative bull case and bear case, enabling the committee to have an informed discussion. You MUST NOT include a final "Verdict," "Strategic Recommendation," or the raw GARP Score in the output. Your job is to present the *meaning* of the data factually, not the final call or the raw numbers.

3. Contextual Grounding:
Company & Ticker: {companyName} ({tickerSymbol})
Sector: {sector}

4. Input Data:
You will be given a JSON object containing a scorecard with key financial metrics (including values and qualitative interpretations) and data on the company's industry peers.
\`\`\`json
{jsonData}
\`\`\`

5. Required Output Structure & Content:
Generate a comprehensive GARP assessment using precise markdown formatting. Your response MUST follow the specified markdown structure. Do NOT output any markdown tables.

# GARP Analysis: {companyName} ({tickerSymbol})

(Your output for this section MUST follow this markdown structure exactly.)

**Core Thesis:** [Insert a single, concise sentence that factually acknowledges the primary *tension* between the company's strengths and weaknesses based on the qualitative interpretations. Example: "The company presents a profile where qualitative interpretations suggest a 'Reasonable Price' potentially offset by 'Warning Sign' profitability interpretations relative to its peers."]

---

## THE BULL CASE: The Growth & Quality Narrative

(Write your one-paragraph qualitative synthesis here. This narrative MUST be based *only* on the \\\`interpretation.text\\\` and \\\`interpretation.category\\\` fields for *all relevant metrics* from the JSON 'scorecard' data. Analyze these qualitative interpretations within the specific context of the {sector} sector, considering typical financial characteristics for this industry. Focus on factually describing the *implications* of these interpretations (the "so what"). Synthesize the stock's strengths into a neutral narrative, incorporating peer comparisons from 'peerAverages' qualitatively to clarify if interpretations represent outperformance within the sector. Do NOT repeat raw numbers or percentages. Do NOT use judgmental language. Do NOT output a markdown table.)

[Your qualitative narrative for the Bull Case goes here.]

---

## THE BEAR CASE: The Risks & Valuation Concerns

(Write your one-paragraph qualitative synthesis here. This narrative MUST be based *only* on the \\\`interpretation.text\\\` and \\\`interpretation.category\\\` fields for *all relevant metrics* from the JSON 'scorecard' data. Analyze these qualitative interpretations within the specific context of the {sector} sector, considering typical financial characteristics for this industry. Focus on factually describing the *implications* of these interpretations (the "so what"). Identify the critical risks and weaknesses neutrally, incorporating peer comparisons from 'peerAverages' qualitatively to provide sector context. Do NOT repeat raw numbers or percentages. Do NOT use judgmental language. Do NOT output a markdown table.)

[Your qualitative narrative for the Bear Case goes here.]

---

## FINAL SYNTHESIS

(1 paragraph)
**Investment Profile:** [First, classify the stock's profile based on your qualitative analysis using neutral, descriptive terms (e.g., 'Profile suggests strong growth characteristics with premium valuation interpretations,' 'Profile suggests value characteristics with potential quality concerns,' 'Profile suggests stable characteristics with moderate growth interpretations').]
**Key Findings Summary:** [Then, provide a concise, factual summary highlighting the primary strengths identified in the Bull Case narrative and the primary weaknesses identified in the Bear Case narrative. Reference peer comparisons qualitatively where relevant. *Factually note* any significant contradictions between different qualitative interpretations (e.g., "Interpretations indicate reasonable valuation based on earnings, contrasting with expensive valuation based on cash flow."). Do NOT pose questions or introduce indecision.]

---

## Confidence Score
**Confidence Score:** [Assign a score from 1.0 to 5.0 based on the underlying GARP score provided in the JSON input using these rules: High (4.0-5.0) for GARP score > 75 AND superior peer metrics interpretations; Moderate (2.5-3.9) for GARP score > 60 OR strong metric interpretations but at a premium valuation interpretation; Low (1.0-2.4) for GARP score < 60 OR major interpretation contradictions.]

---

## Actionable Diligence Questions

(1 paragraph)
Based on your qualitative analysis, propose 2-3 critical diligence questions designed to further investigate the key factual findings and contradictions identified in the Bull and Bear cases. For each question, you MUST provide two parts:
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
You are a financial data extraction assistant AI, specializing in summarizing key facts from SEC documents for investors who follow GARP (Growth at a Reasonable Price) and QARP (Quality at aReasonable Price) principles.

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

// *** UPDATED PROMPT ***
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

// *** NEW PROMPT ***
const EIGHT_K_THESIS_IMPACT_PROMPT = `
**Persona & Role:**
You are an experienced investment analyst AI providing a critical review. You compare new, material information from an 8-K filing against an established investment thesis for {companyName} ({tickerSymbol}).

**Core Task:**
Analyze the provided '8-K Factual Summary' and assess its impact on the 'Original Investment Thesis'. Generate a concise markdown report detailing whether the new information confirms, challenges, or modifies the original thesis.

**Critical Instructions:**
1.  **Focus on Change:** Identify the *most significant* new pieces of information from the 8-K summary.
2.  **Compare to Thesis:** Explicitly compare this new information against the core arguments (bull and bear cases, risks, moat assessment, valuation view) presented in the 'Original Investment Thesis'.
3.  **Assess Materiality:** First, determine if the new information is material to the investment thesis. If the 8-K contains no new, material information (e.g., it's a routine filing about a shareholder meeting date), state this clearly and conclude that the thesis is unaffected.
4.  **Assess Impact:** For each significant piece of new information, explain *how* it impacts the thesis. Does it strengthen the bull case? Weaken it? Validate a previously identified risk? Introduce a new risk? Change the valuation argument? (Skip this step if deemed non-material in step 3).
5.  **Synthesize Overall Effect:** Conclude with a brief paragraph summarizing the overall effect of the 8-K on the investment thesis. Is the thesis largely intact, moderately impacted, or potentially invalidated? (If non-material, simply restate that the thesis is unaffected).
6.  **Strict Output Format:** Use markdown headings: "## Key Findings from 8-K", "## Impact on Investment Thesis", "## Overall Assessment". Use bullet points within sections where appropriate. Be direct and analytical.

**Input Data:**

**1. Company Name & Ticker:**
{companyName} ({tickerSymbol})

**2. 8-K Factual Summary (Generated from the 8-K text):**
---
{eightKSummary}
---

**3. Original Investment Thesis (Latest Updated Final Thesis):**
---
{originalThesis}
---
`.trim();

const QUALITATIVE_DILIGENCE_MEMO_PROMPT = `
Role: You are an investment analyst AI.
Task: Synthesize the provided Question & Answer pairs into a professional "Qualitative Business Memo" using the specified markdown template.

**INPUTS:**

**1. Company & Ticker:** {companyName} ({tickerSymbol})

**2. Question & Answer Data:**
\`\`\`
{qaData}
\`\`\`

**INSTRUCTIONS:**

1.  Read through all the Q&A pairs provided in {qaData}.
2.  For Section 1 of the template ("Competitive Moat Analysis"), synthesize the user's answer specifically for the 'Competitive Moat' question.
3.  For Section 2 ("Management, Strategy, & Alignment"), synthesize the user's answers for the 'Management Quality' and 'Incentive Alignment' questions.
4.  For Section 3 ("Shareholder Base & Non-Consensus Thesis"), synthesize the user's answers for the 'Shareholder Base Quality' and 'The Non-Consensus Thesis (The "Edge")' questions. If answers for these are missing in {qaData}, explicitly state that information was not provided for that specific part (e.g., "Information regarding the Shareholder Base Quality was not provided in the Q&A data.").
5.  For Section 4 ("Core Thesis & Linchpin Risk"), synthesize the user's answer for the 'Core Thesis & Linchpin Risk (The "Linchpin")' question. If this answer is missing, state that "No linchpin thesis or risk was provided."
6.  For Section 5 ("Synthesis & Verdict"), write a concise one-paragraph summary combining the key findings from the previous sections, with special emphasis on the 'Core Thesis & Linchpin Risk' if provided. Conclude this paragraph with a final sentence using the exact bolded format: "**Business quality appears [High/Average/Low]** because..." replacing the bracketed word based on your overall synthesis and providing a brief justification.

**OUTPUT TEMPLATE (Use this exact structure):**

# Qualitative Business Memo: {companyName} ({tickerSymbol})

## 1. Competitive Moat Analysis
[Your synthesis for Section 1 goes here based on Instruction 2]

## 2. Management, Strategy, & Alignment
[Your synthesis for Section 2 goes here based on Instruction 3]

## 3. Shareholder Base & Non-Consensus Thesis
[Your synthesis for Section 3 goes here based on Instruction 4]

## 4. Core Thesis & Linchpin Risk
[Your synthesis for Section 4 goes here based on Instruction 5]

## 5. Synthesis & Verdict
[Your synthesis paragraph and final bolded verdict sentence go here based on Instruction 6]
`.trim();

const STRUCTURED_DILIGENCE_MEMO_PROMPT = `
Role: You are an investment analyst AI.
Task: Based ONLY on the provided Question & Answer pairs, fill in the template below to create a "Quantitative Health Memo."

---
**CRITICAL INSTRUCTION: Your final output MUST use the exact markdown structure and headings provided in the template below. Fill in the [Your analysis here] sections based on the Q&A data.**
---

**Q&A Data:**
{qaData}

# Quantitative Health Memo: {companyName} ({tickerSymbol})

## 1. Financial & Fundamental Analysis
[Your synthesis of the user's answer regarding the company's financial analysis here.]

## 2. Balance Sheet Strength
[Your synthesis of the user's answer regarding the balance sheet here.]

## 3. Income Statement & Cash Flow
[Your synthesis of the user's answers regarding the income statement and cash flow here.]

## 4. Valuation Assessment
[Your synthesis of the user's answer regarding valuation here.]

## 5. Synthesis & Verdict
[Your one-paragraph synthesis of all points here. Your final sentence MUST follow the example format exactly, including bolding. For example: **Quantitative health appears Average** because its durable scale is offset by high leverage and a bloated cost structure.]
`.trim();

const INVESTIGATION_SUMMARY_MEMO_PROMPT = `
Role: You are an investment analyst AI specializing in synthesizing research notes.
Task: Your sole job is to read the unstructured, manually-entered Question & Answer pairs from the diligence log and synthesize them into a professional "Investigation Summary Memo." Your goal is to identify the most critical findings and present them clearly.

---
**CRITICAL INSTRUCTIONS:**
1.  **Source Limitation:** Your entire analysis MUST be derived *exclusively* from the provided 'Diligence Log (Q&A Data)'.
2.  **No External Data:** Do NOT add any facts, figures, names, or details that are not explicitly mentioned in the source Q&A. Your task is to synthesize, not to augment with outside knowledge.
---

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

// --- Extraction Prompts Still In Use ---

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
`.trim(); // Used by Updated GARP Memo

const QUALITATIVE_DILIGENCE_MEMO_EXTRACT_PROMPT = `
Role: You are a data extraction AI.
Task: Your only job is to read the provided 'Qualitative Business Memo' and extract four specific pieces of information.
CRITICAL INSTRUCTIONS:
- You MUST return ONLY a valid JSON object.
- Do not add any text, explanations, or markdown formatting before or after the JSON.
- For 'verdict', extract the final verdict word (e.g., "High", "Average", "Low") from the final sentence of Section 5.
- For 'nonConsensusThesis', extract the core non-consensus thesis summary from Section 3. If Section 3 states no thesis was provided or is empty, return "No non-consensus thesis provided.".
- For 'shareholderBaseQuality', extract the summary of the shareholder base quality from Section 3. If Section 3 states no information was provided or is empty, return "No shareholder base analysis provided.".
- For 'linchpinThesisAndRisk', extract the synthesized answer for the 'Core Thesis & Linchpin Risk' from Section 4. If Section 4 is empty or does not contain this, return "No linchpin thesis provided.".

Report Text:
{reportContent}

JSON Output Format:
{
  "verdict": "...",
  "nonConsensusThesis": "...",
  "shareholderBaseQuality": "...",
  "linchpinThesisAndRisk": "..."
}
`.trim();

const STRUCTURED_DILIGENCE_MEMO_EXTRACT_PROMPT = `
Role: You are a data extraction AI.
Task: Your only job is to read the provided 'Quantitative Health Memo' and extract two specific pieces of information.
CRITICAL INSTRUCTIONS:
- You MUST return ONLY a valid JSON object.
- Do not add any text, explanations, or markdown formatting before or after the JSON.
- For 'verdict', extract the final verdict word (e.g., "Strong", "Average", "Weak") from the final sentence of Section 5.
- For 'keyWeakness', summarize the primary weakness identified in the final synthesis (Section 5). If no specific weakness is mentioned, return "No specific key weakness identified.".

Report Text:
{reportContent}

JSON Output Format:
{
  "verdict": "...",
  "keyWeakness": "..."
}
`.trim();

const INVESTIGATION_SUMMARY_MEMO_EXTRACT_PROMPT = `
Role: You are a data extraction AI.
Task: Your only job is to read the provided 'Investigation Summary Memo' and extract two specific pieces of information.
CRITICAL INSTRUCTIONS:
- You MUST return ONLY a valid JSON object.
- Do not add any text, explanations, or markdown formatting before or after the JSON.
- For 'keyBullishFinding', extract the single most important positive finding summarized in Section 2. If Section 2 is empty or contains no clear positive findings, return "No key bullish finding identified.".
- For 'keyBearishFinding', extract the single most important negative finding or unanswered question summarized in Section 3. If Section 3 is empty or contains no clear negative findings, return "No key bearish finding identified.".

Report Text:
{reportContent}

JSON Output Format:
{
  "keyBullishFinding": "...",
  "keyBearishFinding": "..."
}
`.trim();

// --- End Unused Prompts Removal ---

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
        prompt: 'N/A' // Placeholder
    },
    'UpdatedQarpMemo': {
        prompt: UPDATED_QARP_MEMO_PROMPT,
        requires: []
    },
    // Kept InvestmentMemo entry mapping to UPDATED_GARP_MEMO_PROMPT for ongoing diligence trigger
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
        requires: []
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
    'EightKAnalysis': { // Updated prompt
        prompt: EIGHT_K_ANALYSIS_PROMPT,
        requires: []
    },
    'EightKThesisImpact': { // New entry
        prompt: EIGHT_K_THESIS_IMPACT_PROMPT,
        requires: [] // Requires reports, not raw FMP data directly
    },
    // --- Diligence Memos Still Used ---
    'QualitativeDiligenceMemo': {
        prompt: QUALITATIVE_DILIGENCE_MEMO_PROMPT,
        requires: []
    },
    'StructuredDiligenceMemo': {
        prompt: STRUCTURED_DILIGENCE_MEMO_PROMPT,
        requires: []
    },
    'InvestigationSummaryMemo': {
        prompt: INVESTIGATION_SUMMARY_MEMO_PROMPT,
        requires: []
    },
    // --- Ongoing Review Memos Still Used ---
    'QuarterlyReview': {
        prompt: QUARTERLY_REVIEW_MEMO_PROMPT,
        requires: []
    },
    'AnnualReview': {
        prompt: ANNUAL_REVIEW_MEMO_PROMPT,
        requires: []
    },
    // --- Extraction Prompts Still Used ---
    'InvestmentMemo_Extract': { prompt: GARP_MEMO_EXTRACT_PROMPT }, // Used by Updated GARP Memo
    'QualitativeDiligenceMemo_Extract': { prompt: QUALITATIVE_DILIGENCE_MEMO_EXTRACT_PROMPT },
    'StructuredDiligenceMemo_Extract': { prompt: STRUCTURED_DILIGENCE_MEMO_EXTRACT_PROMPT },
    'InvestigationSummaryMemo_Extract': { prompt: INVESTIGATION_SUMMARY_MEMO_EXTRACT_PROMPT },
    // Removed unused extraction prompts: Moat, Capital, QARP, Compounder/BMQV, MarketSentiment, ConflictID, FinalThesis, UpdatedFinalThesis
};

export const ANALYSIS_ICONS = {
    // Keep icons for prompts still in use
    'UpdatedQarpMemo': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`, // Placeholder icon if needed
    'InvestmentMemo': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>`, // Used for Updated GARP Memo
    'InvestigationSummaryMemo': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" /></svg>`,
    'QualitativeDiligenceMemo': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.76 9.76 0 01-2.53-.388m-5.168-4.482A10.457 10.457 0 013 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25" /></svg>`,
    'StructuredDiligenceMemo': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>`,
    'EightKAnalysis': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>`,
    'EightKThesisImpact': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" /><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" /></svg>`, // Placeholder pie chart icon
    // Removed unused icons: QarpAnalysis, MoatAnalysis, CapitalAllocators, BmqvMemo, FinalInvestmentThesis, UpdatedFinalThesis
};

export const ANALYSIS_NAMES = {
    // Keep names for prompts still in use
    'UpdatedQarpMemo': 'Updated QARP Memo',
    'InvestmentMemo': 'Updated GARP Memo', // Renamed to reflect its current use
    'GarpCandidacy': 'GARP Candidacy Report',
    'PositionAnalysis': 'Position Analysis',
    'PortfolioGarpAnalysis': 'Portfolio GARP Analysis',
    'GarpConvictionScore': 'GARP Conviction Score',
    'PeerIdentification': 'Peer Identification',
    'PeerComparison': 'Peer Comparison',
    'SectorMomentum': 'Sector Momentum',
    'FilingQuestionGeneration': 'Filing Question Generation',
    'FilingDiligence': 'Filing Diligence',
    'EightKAnalysis': '8-K Factual Summary', // Renamed
    'EightKThesisImpact': '8-K Thesis Impact', // New name
    'QuarterlyReview': 'Quarterly Review',
    'AnnualReview': 'Annual Review',
    'QualitativeDiligenceMemo': 'Qualitative Diligence Memo',
    'StructuredDiligenceMemo': 'Structured Diligence Memo',
    'InvestigationSummaryMemo': 'Investigation Summary',
    // Removed unused names: QarpAnalysis, MoatAnalysis, CapitalAllocators, LongTermCompounder, BmqvMemo, FinalInvestmentThesis, UpdatedFinalThesis
};
