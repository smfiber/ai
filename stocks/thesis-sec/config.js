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
    // ... (content unchanged)
};

// --- AI PROMPTS ---

// Helper Prompts (Unchanged)
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

// Core Analysis Prompts (Unchanged)
const MOAT_ANALYSIS_PROMPT = `...`; // Unchanged
const CAPITAL_ALLOCATORS_PROMPT = `...`; // Unchanged
const GARP_CANDIDACY_PROMPT = `...`; // Unchanged
const GARP_CONVICTION_SCORE_PROMPT = `...`; // Unchanged
const QARP_ANALYSIS_PROMPT = `...`; // Unchanged
const LONG_TERM_COMPOUNDER_PROMPT = `...`; // Unchanged
const BMQV_MEMO_PROMPT = `...`; // Unchanged

// Synthesis Prompts (Unchanged)
const UPDATED_GARP_MEMO_PROMPT = `...`; // Unchanged
const PORTFOLIO_GARP_ANALYSIS_PROMPT = `...`; // Unchanged
const POSITION_ANALYSIS_PROMPT = `...`; // Unchanged
const UPDATED_QARP_MEMO_PROMPT = `...`; // Unchanged
const FINAL_INVESTMENT_THESIS_PROMPT = `...`; // Unchanged
const UPDATED_FINAL_THESIS_PROMPT = `...`; // Unchanged

// Diligence Memo Prompts (Unchanged, relevant for extraction)
const QUALITATIVE_DILIGENCE_MEMO_PROMPT = `...`; // Unchanged
const STRUCTURED_DILIGENCE_MEMO_PROMPT = `...`; // Unchanged
const MARKET_SENTIMENT_MEMO_PROMPT = `...`; // Unchanged
const INVESTIGATION_SUMMARY_MEMO_PROMPT = `...`; // Unchanged

// Review Memo Prompts (Unchanged, kept for now)
const QUARTERLY_REVIEW_MEMO_PROMPT = `...`; // Unchanged
const ANNUAL_REVIEW_MEMO_PROMPT = `...`; // Unchanged

// --- NEW FILING ANALYSIS PROMPTS ---

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

const TEN_Q_THESIS_IMPACT_PROMPT = `
**Persona & Role:**
You are a portfolio manager AI assessing the impact of a recent 10-Q filing on an existing investment thesis for {companyName} ({tickerSymbol}). Your analysis must be objective and directly compare the new findings against the established thesis.

**Core Task:**
Read the provided **10-Q Key Findings Summary** and compare it against the **Updated Final Investment Thesis**. Generate a structured impact assessment using the markdown template below.

**Critical Instructions:**
1.  **Source Limitation:** Base your analysis *only* on the two provided text inputs. Do not use outside knowledge.
2.  **Focus on Change:** Identify how the new 10-Q findings *confirm*, *challenge*, or *modify* the specific points made in the Updated Final Thesis (narrative, recommendation, risks).
3.  **Strict Output Format:** You MUST return a response in markdown following this structure precisely. Do not add introductory/concluding paragraphs.

**Input Data:**

**1. Updated Final Investment Thesis:**
\`\`\`markdown
{originalThesis}
\`\`\`

**2. 10-Q Key Findings Summary:**
\`\`\`markdown
{filingSummary}
\`\`\`
---
# 10-Q Impact Analysis: {companyName} ({tickerSymbol})

## 1. Key Findings from 10-Q
(Concisely list 2-3 of the most impactful data points or updates reported in the '10-Q Key Findings Summary' that are relevant to the investment thesis.)

## 2. Impact on Investment Thesis
(In one paragraph, analyze how the Key Findings listed above directly impact the core narrative, risks, and conclusions presented in the 'Updated Final Investment Thesis'. Explicitly state whether the new information strengthens the bull case, validates bear case concerns, introduces new risks, or changes the outlook.)

## 3. Overall Assessment & Recommendation Check
(In one paragraph, conclude whether the 10-Q materially changes the investment picture. Does it warrant a change to the recommendation grade provided in the 'Updated Final Thesis'? Explain why or why not, referencing specific data from the 10-Q summary.)
`.trim();

const TEN_K_THESIS_IMPACT_PROMPT = `
**Persona & Role:**
You are a portfolio manager AI assessing the impact of a recent 10-K filing on an existing investment thesis for {companyName} ({tickerSymbol}). Your analysis must be objective and directly compare the new annual findings against the established thesis.

**Core Task:**
Read the provided **10-K Key Findings Summary** and compare it against the **Updated Final Investment Thesis**. Generate a structured impact assessment using the markdown template below.

**Critical Instructions:**
1.  **Source Limitation:** Base your analysis *only* on the two provided text inputs. Do not use outside knowledge.
2.  **Focus on Change:** Identify how the new 10-K findings *confirm*, *challenge*, or *modify* the specific strategic points, risk assessments, and long-term outlook presented in the Updated Final Thesis.
3.  **Strict Output Format:** You MUST return a response in markdown following this structure precisely. Do not add introductory/concluding paragraphs.

**Input Data:**

**1. Updated Final Investment Thesis:**
\`\`\`markdown
{originalThesis}
\`\`\`

**2. 10-K Key Findings Summary:**
\`\`\`markdown
{filingSummary}
\`\`\`
---
# 10-K Impact Analysis: {companyName} ({tickerSymbol})

## 1. Key Findings from 10-K
(Concisely list 2-3 of the most impactful strategic updates, risk factor changes, or annual performance trends reported in the '10-K Key Findings Summary' that are relevant to the long-term investment thesis.)

## 2. Impact on Investment Thesis
(In one paragraph, analyze how the Key Findings listed above directly impact the core narrative, strategic assumptions, risk assessment, and long-term conclusions presented in the 'Updated Final Investment Thesis'. Explicitly state whether the new information strengthens the bull case, validates bear case concerns, alters the risk profile, or changes the long-term outlook.)

## 3. Overall Assessment & Recommendation Check
(In one paragraph, conclude whether the 10-K materially changes the long-term investment picture. Does it warrant a change to the recommendation grade provided in the 'Updated Final Thesis'? Explain why or why not, referencing specific strategic or risk-related information from the 10-K summary.)
`.trim();

// *** MODIFIED PROMPT ***
const EIGHT_K_THESIS_IMPACT_PROMPT = `
**Persona & Role:**
You are the Chief Investment Officer, re-evaluating an investment thesis based on a new, material 8-K filing.
Your primary duty is to protect capital and act decisively if the facts change.

**Core Task:**
Read the **Updated Final Investment Thesis** (which contains the core recommendation and rationale) and the **8-K Material Event Summary** (which contains new, factual data).
Your task is to *act* as the CIO: determine how the new 8-K facts impact the *linchpin risks* and *core narrative* of the thesis, and then issue an *updated recommendation and rationale*.

**Critical Instructions:**
1.  **Facts vs. Thesis:** The **8-K Summary** contains the new, hard facts. The **Updated Final Thesis** contains the *existing story and belief system*. Your job is to see if the new facts break the old story.
2.  **Focus on Conflicts:** Identify the *most significant conflict* between the new 8-K data and the existing thesis's bull case.
3.  **Assess Linchpin Risk:** Explicitly state whether the 8-K data confirms or invalidates the core thesis, or if it triggers one of the "linchpin" risks identified in the thesis.
4.  **Issue a New Recommendation:** You must conclude with a *new, decisive recommendation*. Do not be passive. If the facts invalidate the thesis, a downgrade is required.
5.  **Grading Scale:** Use this scale for your updated recommendation:
    * **A (Upgrade/Reiterate):** High Conviction Buy, 4-5%
    * **B (Reiterate):** Strong Buy, 2-3%
    * **C (Downgrade/Hold):** Hold/Monitor, 1%
    * **D (Downgrade):** Hold/Reduce
    * **F (Downgrade):** Sell/Pass
6.  **Strict Output Format:** You MUST return a response in markdown following this structure precisely.

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
(Concisely summarize the 1-2 most material facts from the '8-K Material Event Summary'.)

## 2. Re-evaluating the Core Narrative & Conflicts
(In one paragraph, identify the core narrative/linchpin thesis from the 'Updated Final Thesis'. Then, state how the '8-K Event Summary' facts *directly conflict with or confirm* that narrative. This is the most important section.)

## 3. Updated Recommendation & Rationale
(In one paragraph, explain *why* the 8-K findings force a change (or reaffirmation) of the investment thesis. Justify your new recommendation based on the conflict/confirmation you identified above.)

### Updated Recommendation
(Your response for this section MUST follow the format below exactly, including the bolding.)

**Recommendation Grade:** [Assign an updated letter grade (A, B, C, D, or F) based on this 8-K.]
**Suggested Allocation:** [State the corresponding allocation percentage or action.]

(Your updated one-sentence justification summarizing your *new* conclusion based on the 8-K data.)

## 4. Updated Implications for Portfolio Management
(Based on your *new* recommendation, provide revised, actionable interpretations.)
* **For a New Investment:** [Explain the updated meaning.]
* **For an Existing Position:** [Explain the updated meaning.]
`.trim();

// Extraction Prompts (Unchanged)
const MOAT_ANALYSIS_EXTRACT_PROMPT = `...`; // Unchanged
const CAPITAL_ALLOCATORS_EXTRACT_PROMPT = `...`; // Unchanged
const GARP_MEMO_EXTRACT_PROMPT = `...`; // Unchanged
const QARP_ANALYSIS_EXTRACT_PROMPT = `...`; // Unchanged
const COMPOUNDER_BMQV_EXTRACT_PROMPT = `...`; // Unchanged
const QUALITATIVE_DILIGENCE_MEMO_EXTRACT_PROMPT = `...`; // Unchanged
const STRUCTURED_DILIGENCE_MEMO_EXTRACT_PROMPT = `...`; // Unchanged
const MARKET_SENTIMENT_MEMO_EXTRACT_PROMPT = `...`; // Unchanged
const INVESTIGATION_SUMMARY_MEMO_EXTRACT_PROMPT = `...`; // Unchanged
const FINAL_THESIS_CONFLICT_ID_PROMPT = `...`; // Unchanged

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
    // ... (Existing Icons Unchanged)
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
    // ... (Existing summaries unchanged)
    'TenQAnalysis': 'Summarizes key financial performance (Revenue, EPS, Margins, Cash Flow) and material updates from a 10-Q filing text provided by the user.',
    'TenKAnalysis': 'Summarizes key annual financial performance, strategic commentary, and risk factor updates from a 10-K filing text provided by the user.',
    'EightKAnalysis': 'Summarizes the core event reported in an 8-K filing text provided by the user and assesses its potential impact pillars (Growth, Quality, Capital Allocation).',
    'TenQThesisImpact': 'Compares the key findings from a generated 10-Q Summary against the latest Updated Final Thesis report to assess the impact on the investment case.',
    'TenKThesisImpact': 'Compares the key findings from a generated 10-K Summary against the latest Updated Final Thesis report to assess the impact on the long-term investment case.',
    'EightKThesisImpact': 'Compares the key findings from a generated 8-K Summary against the latest Updated Final Thesis report to assess the impact on the investment case.',
};
