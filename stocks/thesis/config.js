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
    'Shareholder Base Quality (The \"Who\")': "Review the institutional ownership (13F filings). Who are the top 5-10 owners? Classify them as 'sticky money' (e.g., founders, long-term focused funds, index funds) or 'fast money' (e.g., high-turnover hedge funds).",
    
    // --- BIASED QUESTION #5 (REPLACED) ---
    // 'The "Wonderful Business" & The "Temporary Flaw"': "First, confirm if the \"BMQV\" or \"Compounder\" memos identify this as a \"Wonderful Business\" (wide moat, high quality). Second, identify the \"severe, temporary flaw\" (e.g., a solvable, near-term MCR crisis, a cyclical downturn) that is causing near-term pessimism and mispricing."
    'Business Quality & Flaw Assessment': "First, based on the 'BMQV' or 'Compounder' memos, what is the *consensus view* on business quality (e.g., 'Wonderful Business', 'Flawed Business', 'Not a Compounder')? Second, what is the *primary flaw* or risk identified that is causing near-term pessimism? Finally, based on your own diligence, assess if this flaw appears to be *temporary* (solvable, cyclical) or *structural* (permanent, a sign of decline).",

    // --- BIASED QUESTION #6 (REPLACED) ---
    // 'The Long-Term Bet & Margin of Safety': "Articulate the 10-20 year bet. Why will the \"Wonderful Business\" (e.g., pricing power, moat, integrated model) inevitably overcome the \"Temporary Flaw\"? Explain how the current, short-term panic (the \"flaw\") creates the \"margin of safety\" for a long-term purchase."
    'Final Thesis & Margin of Safety': "Synthesize all your findings. If a 'Wonderful Business' and 'Temporary Flaw' were identified, articulate the long-term *bullish* thesis and margin of safety. *Conversely*, if the business is 'Flawed' or the flaw is 'Structural,' articulate the long-term *bearish* thesis (e.g., 'value trap,' 'secular decline'). State your final, synthesized conclusion."
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
Role: You are a business strategist AI. Your task is to analyze {companyName}'s competitive advantages based *only* on the provided JSON data.

---
**CRITICAL INSTRUCTION: Your final output MUST use the exact markdown structure, headings, and bullet points provided in the template below. Fill in the [Your analysis here] sections based on the JSON data.**
---

JSON Data:
{jsonData}

# Economic Moat Analysis: {companyName} ({tickerSymbol})

## 1. What Gives This Company Its Edge? (Sources of the Moat)
- **Return on Invested Capital (ROIC):** [Your analysis here, explaining that a consistently high and stable/rising ROIC >15% is a strong sign of a moat. Analyze the 'roicTrend' data against this benchmark.]
- **Pricing Power & Profitability:** [Your analysis here, discussing whether the trends in 'profitabilityTrends' are consistently high and stable over time, which would be a sign of pricing power.]
- **Qualitative Clues (from Description):** [Your analysis here, looking for themes like "platform," "network," "marketplace," or "mission-critical" systems in the 'qualitativeClues.description' that suggest a moat.]

## 2. How Strong is the Castle Wall? (Moat Sustainability)
- **Reinvesting in the Defenses:** [Your analysis here, discussing whether 'capex' and 'rdExpenses' from the 'reinvestmentTrends' data are significant, which would show the company is strengthening its moat.]
- **Financial Fortress:** [Your analysis here, assessing if the balance sheet is strong based on a low 'debtToEquity' from the 'balanceSheetHealth' data.]

## 3. The Verdict: How Wide is the Moat?
(First, provide a one-sentence classification using one of the three bolded options below. Then, in a new paragraph, provide a concluding assessment justifying your choice based on the evidence from the previous sections.)

- **"Wide Moat"**
- **"Narrow Moat"**
- **"No Moat"**
`.trim();

const CAPITAL_ALLOCATORS_PROMPT = `
Role: You are a critical, business-focused investment analyst. Your task is to evaluate the skill of {companyName}'s management team as capital allocators, based *only* on the provided financial data.

---
**CRITICAL INSTRUCTIONS:**
1.  Your final output MUST use the exact markdown structure, headings, and bullet points provided in the template below.
2.  For Section 1, you MUST use the pre-calculated 'summaryTotals' from the JSON data as the source of truth for your analysis.
---

JSON Data:
{jsonData}

# Capital Allocation Report: {companyName} ({tickerSymbol})

## 1. Deduced Capital Allocation Philosophy
[Your analysis here. Based on the **pre-calculated 'summaryTotals'**, state the total amounts for Acquisitions, CapEx, Buybacks, and Dividends, and determine if the philosophy is geared towards reinvestment or shareholder returns.]

## 2. Reinvestment Effectiveness
- **Return on Invested Capital (ROIC):** [Your analysis here. Analyze the 'reinvestmentEffectiveness.roicTrend' to determine if it is high, stable, rising, or volatile.]
- **Revenue & Profit Growth:** [Your analysis here. Analyze the 'reinvestmentEffectiveness.revenueGrowth' and 'reinvestmentEffectiveness.grossProfitGrowth' trends to see if reinvestment has translated into growth.]

## 3. Acquisition Track Record (M&A)
- [Your analysis here. For periods of significant spending in 'acquisitionHistory', **cite the acquisition amount for each individual year** and correlate it with the corresponding 'roicTrend'. Analyze the 'goodwill' trend for signs of overpayment.]

## 4. Shareholder Returns
- **Stock Buybacks:** [Your analysis here. Critically analyze the 'shareholderReturns.buybacksWithValuation' data to determine if management repurchased shares at opportunistic (low) or poor (high) valuations.]
- **Dividends:** [Your analysis here. Analyze the 'shareholderReturns.fcfPayoutRatioTrend' to determine if the dividend is safely covered and sustainable.]

## 5. Final Grade & Justification
- **Final Grade:** [Provide a single letter grade from A through F.]
- **Justification:** [Your analysis here. Justify the grade by summarizing the strongest and weakest points from your quantitative analysis above and provide a bottom-line assessment.]
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

// --- FINAL GARP CANDIDACY PROMPT (Version 6 - Incorporating Sector Context, Contradiction Acknowledgment, and Neutral Tone) ---
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

const QARP_ANALYSIS_PROMPT = `
Role: You are a Senior Investment Analyst specializing in the "Quality at a Reasonable Price" (QARP) philosophy.
Task: Provide a rigorous, data-driven analysis by filling in the template below, based *exclusively* on the provided JSON data.

---
**CRITICAL INSTRUCTION: Your final output MUST use the exact markdown structure, headings, and bullet points provided in the template below. Fill in the [Your analysis here] sections based on the JSON data.**
---

JSON Data with Pre-Calculated Metrics:
{jsonData}

# QARP Analysis: {companyName} ({tickerSymbol})

## 1. Executive Summary & Verdict
[Your concise, one-paragraph summary here, weighing the company's quality against its valuation.]

## 2. The "Quality" Pillar: Is This a Superior Business?
- **Profitability & Efficiency:** [Your analysis here, based on ROE and ROIC.]
- **Financial Strength:** [Your analysis here, based on the Debt-to-Equity ratio.]
- **Growth Stability:** [Your analysis here, based on 5Y EPS and Revenue Growth.]

## 3. The "Reasonable Price" Pillar: Are We Overpaying?
- **Core Valuation:** [Your analysis here, based on P/E (TTM) and Forward P/E.]
- **Growth-Adjusted Valuation:** [Your analysis here, based on the PEG Ratio.]
- **Cash Flow Valuation:** [Your analysis here, based on the Price to FCF ratio.]

## 4. Final Synthesis: The QARP Verdict
[Synthesize your findings in one paragraph, explaining the trade-offs. Your final sentence MUST follow the example format exactly, including bolding. For example: **This company does not meet the criteria** for a QARP investment at this time because its high valuation does not offer a margin of safety for its quality issues.]
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
2.  **Strict OutputFormat:** You MUST return a response in markdown that follows this structure precisely. Do not add any introductory or concluding paragraphs outside of this structure.

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
Role: You are a long-term, business-focused investment analyst. Your task is to determine if {companyName} is a "compounder" by synthesizing the provided JSON data, which contains metrics related to its moat and how its management allocates capital.

---
**CRITICAL INSTRUCTIONS:**
1.  Your final output MUST use the exact markdown structure, headings, and bullet points provided in the template below.
2.  Your analysis for each section MUST be derived *directly* from the provided 'JSON Data'. Do NOT introduce any outside information or analysis not present in the data.
---

**JSON Data:**
{jsonData}

# Long-Term Compounder Memo: {companyName} ({tickerSymbol})

## 1. The Core Investment Question
[Your one-paragraph summary here. Based on the JSON data, what is the single most important question an investor must answer? Synthesize the primary source of the moat (from 'moatAnalysis.qualitativeClues.description') with the primary capital allocation philosophy (from 'capitalAllocation.summaryTotals') to frame this question.]

## 2. The Makings of a "Wonderful Business"
- **Competitive Advantage (The Moat):** [Your analysis here. Determine the moat's strength by analyzing the 'moatAnalysis.roicTrend'. A consistently high and rising ROIC above 15% is a strong indicator. Identify the source of the moat from 'moatAnalysis.qualitativeClues.description'.]
- **Management Quality (The Jockeys):** [Your analysis here. Evaluate management's skill by analyzing the 'capitalAllocation.reinvestmentEffectiveness.roicTrend'. Then, critique their shareholder return strategy by analyzing the 'capitalAllocation.shareholderReturns.buybacksWithValuation' data to see if buybacks were done at opportune (low P/E) or poor (high P/E) valuations.]
- **Profitability Engine:** [Your analysis here. Connect the two concepts by explaining how the strong ROIC ('moatAnalysis.roicTrend') is a direct financial result of the moat source ('moatAnalysis.qualitativClues.description') and is sustained by management's reinvestment effectiveness ('capitalAllocation.reinvestmentEffectiveness.revenueGrowth').]

## 3. Potential Cracks in the Fortress
- **Moat Sustainability Risks:** [Your analysis here. Based *only* on the provided data, identify potential risks. For example, if 'moatAnalysis.reinvestmentTrends.capex' is stagnant or declining, it could be a risk. If no clear risks are present in the data, state that "No specific sustainability risks were identified in the provided data."]
- **Capital Allocation Red Flags:** [Your analysis here. Identify the single biggest weakness based *only* on the 'capitalAllocation.shareholderReturns.buybacksWithValuation' data. State clearly if management tends to buy back shares at high or low valuations.]
- **The Core Tension:** [Your analysis here. Explain the primary conflict. For example: "The core tension is between the company's powerful moat, which generates immense cash, and management's tendency to return that cash via buybacks at high valuations, which may be a suboptimal use of capital."]

## 4. Final Verdict: A True Compounder?
[Your final one-paragraph verdict here. Synthesize all findings from the JSON to make a concluding assessment. Your final sentence MUST follow the example format exactly, including bolding. For example: **Potential Compounder with Reservations** because its wide moat is paired with a management team that has shown weaknesses in its capital return strategy.]
`.trim();

const BMQV_MEMO_PROMPT = `
Role: You are a long-term, business-focused investment analyst in the style of Buffett and Munger.
Task: Your task is to determine if {companyName} is a "wonderful business" by synthesizing the facts provided in the JSON data below. You MUST base your analysis exclusively on these facts and not use any outside knowledge.

---
**CRITICAL INSTRUCTIONS:**
1.  Your final output MUST use the exact markdown structure and headings provided in the template.
2.  Your analysis for each section MUST be derived *directly* from the provided 'JSON Data (Source of Truth)'. For example, to determine the moat, analyze the 'roicTrend' data. To assess management, analyze the 'summaryTotals' and 'buybacksWithValuation' data.
3.  Do NOT mention any company names, events (like acquisitions), or data not explicitly present in the JSON data.
---

**JSON Data (Source of Truth):**
{jsonData}

# Buffett-Munger Quality & Value (BMQV) Memo: {companyName} ({tickerSymbol})

## 1. Executive Summary: Is This a "Wonderful Business"?
[Synthesize your findings from the sections below to provide a top-line summary and verdict.]

## 2. The Three Pillars of a "Wonderful Business"
- **A Durable Moat:** [Analyze the 'moatAnalysis.roicTrend'. A consistently high and stable/rising ROIC above 15% indicates a strong moat. Also, use the 'moatAnalysis.qualitativeClues.description' to identify the source of the moat (e.g., network effects, brand).]
- **Skilled & Trustworthy Management:** [Analyze the 'capitalAllocation.summaryTotals' to determine if management prioritizes shareholder returns or reinvestment. Then, analyze 'capitalAllocation.shareholderReturns.buybacksWithValuation' to assess if buybacks were done at opportune (low P/E) or poor (high P/E) valuations.]
- **A Resilient Profitability Engine:** [Explain how the high ROIC from the 'moatAnalysis' data is sustained by management's capital allocation philosophy, as seen in the 'capitalAllocation' data.]

## 3. Potential Impairments to Long-Term Value
- **Identified Weaknesses:** [Based *only* on your analysis of the 'buybacksWithValuation' data, identify any weaknesses in management's capital allocation. If buybacks were consistently done at high P/E ratios, state that as the primary weakness. If no clear weakness is present in the data, state that.]

## 4. Final Verdict
[Provide a final, one-paragraph verdict synthesizing your data-driven findings. Your final sentence MUST follow the example format exactly, including bolding. For example: **A Good Business with Flaws** because its strong moat is undermined by management's tendency to repurchase shares at high valuations.]
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

// --- NEW DILIGENCE MEMO EXTRACTORS ---
const QUALITATIVE_DILIGENCE_MEMO_EXTRACT_PROMPT = `
Role: You are a data extraction AI.
Task: Your only job is to read the provided 'Qualitative Business Memo' and extract four specific pieces of information.
CRITICAL INSTRUCTIONS:
- You MUST return ONLY a valid JSON object.
- Do not add any text, explanations, or markdown formatting before or after the JSON.
- For 'verdict', extract the final verdict word (e.g., "High", "Average", "Low") from the final sentence of Section 5.
- For 'wonderfulBusinessFlaw', extract the summary for the 'Wonderful Business & Temporary Flaw' section. If the section is empty or states no info was provided, return "No flaw analysis provided.".
- For 'shareholderBaseQuality', extract the summary of the shareholder base quality from Section 3. If Section 3 states no information was provided or is empty, return "No shareholder base analysis provided.".
- For 'longTermBet', extract the synthesized answer for the 'Long-Term Bet & Margin of Safety' section. If the section is empty or does not contain this, return "No long-term bet analysis provided.".

Report Text:
{reportContent}

JSON Output Format:
{
  "verdict": "...",
  "wonderfulBusinessFlaw": "...",
  "shareholderBaseQuality": "...",
  "longTermBet": "..."
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

const MARKET_SENTIMENT_MEMO_EXTRACT_PROMPT = `
Role: You are a data extraction AI.
Task: Your only job is to read the provided 'Market Sentiment Memo' and extract two specific pieces of information.
CRITICAL INSTRUCTIONS:
- You MUST return ONLY a valid JSON object.
- Do not add any text, explanations, or markdown formatting before or after the JSON.
- For 'verdict', extract the final verdict word (e.g., "Bullish", "Neutral", "Bearish") from the final sentence of Section 4.
- For 'strongestSignal', identify the strongest sentiment signal (positive or negative) mentioned in the synthesis (Section 4). If no single strongest signal is clear, summarize the overall sentiment drivers.

Report Text:
{reportContent}

JSON Output Format:
{
  "verdict": "...",
  "strongestSignal": "..."
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
// --- END NEW DILIGENCE MEMO EXTRACTORS ---

const FINAL_THESIS_CONFLICT_ID_PROMPT = `
Role: You are a conflict identification AI.
Task: Based ONLY on the following JSON of analyst summaries, what is the core disagreement between these reports? Explain the conflict in one concise paragraph. Do not use markdown or headings.

JSON Data:
{jsonData}
`.trim();

const FINAL_INVESTMENT_THESIS_PROMPT = `
Role: You are the Chief Investment Officer of a multi-strategy fund. Your task is to synthesize four separate analyst reports on {companyName} into a final, decisive investment thesis. Your analysis must be objective and based exclusively on the provided inputs.

---
**CRITICAL INSTRUCTIONS & DEFINITIONS:**
1.  **Source of Truth:** Your analysis MUST be based on the quantitative **GARP Conviction Score** and the qualitative **Analyst Summaries**. These are your primary inputs.
2.  **Output Format:** Your final output MUST use the exact markdown structure, headings, and table format provided below. Do not deviate.
3.  **Grading Scale (for your final recommendation):**
    * **A (High Conviction Buy):** A top-tier GARP idea. Suggested 4-5% portfolio allocation for a full-size position.
    * **B (Strong Buy):** A solid idea that merits a starter position. Suggested 2-3% portfolio allocation.
    * **C (Hold / Add on Weakness):** A good company at a questionable price. Suggested 1% allocation for a small tracking position.
    * **D (Hold / Monitor):** For existing positions only. No new capital should be allocated.
    * **F (Sell / Pass):** A clear avoidance. The risk/reward is unfavorable.
---

**INPUTS FOR ANALYSIS:**

**1. Quantitative Anchor:**
* **GARP Conviction Score:** {garpScore}

**2. Qualitative Analyst Summaries (JSON):**
{analystSummaries}

---
**YOUR TASK (Strict Output Format):**

# Final Investment Thesis: {companyName} ({tickerSymbol})

## 1. Summary of Analyst Verdicts
(First, you MUST complete this summary table by extracting the final verdict from the provided JSON data. Do NOT alter the structure of this table.)

| Analyst Memo | Final Verdict |
| :--- | :--- |
| **GARP Memo** | [Extract the "verdict" field] |
| **QARP Analysis** | [Extract the "verdict" field] |
| **Long-Term Compounder**| [Extract the "verdict" field] |
| **BMQV Memo** | [Extract the "verdict" field] |

## 2. The Core Narrative: Identifying the Theme
(In one paragraph, analyze the completed table and the analyst summaries to identify the central, unifying theme. Instead of seeking conflict, find the consensus. What is the consistent story these reports are telling about the business?)

## 3. Weighing the Evidence & Final Recommendation
(In one or two paragraphs, build a case for your final recommendation. Start with the quantitative GARP Score as your anchor. Then, use the qualitative analyst summaries to add color and context to that score, explaining how the qualitative findings either strengthen or temper the quantitative result.)

### Recommendation
(Your response for this section MUST follow the format below exactly, including the bolding.)

**Recommendation Grade:** [Assign a letter grade from the scale defined above.]
**Suggested Allocation:** [State the corresponding allocation percentage from the scale.]

(Your one-sentence justification summarizing your conclusion goes here. It must be consistent with the grade and your analysis.)

## 4. Implications for Portfolio Management
(Based on your final recommendation, provide a brief, actionable interpretation for both scenarios below.)
* **For a New Investment:** [Explain what this recommendation means for an investor considering deploying new capital.]
* **For an Existing Position:** [Explain what this recommendation means for a current shareholder.]
`.trim();

// --- NEW UPDATED FINAL THESIS PROMPT (NEUTRAL SYNTHESIS) ---
const UPDATED_FINAL_THESIS_PROMPT = `
**Role:** You are an objective investment analyst.

**Task:** Your task is to **neutrally synthesize** a previously generated **"Original Final Thesis"** with a **"New Diligence Synthesis."** The New Diligence Synthesis is based on a specific analysis of the business's quality and structural flaws.

Your goal is to determine if the new diligence **confirms, contradicts, or modifies** the original thesis and its recommendation.

---

**KEY INSTRUCTIONS:**
1.  **Weigh Inputs Objectively:** The new diligence does not automatically override the original thesis. Weigh the original consensus against the new, specific findings.
2.  **Identify Conflicts:** If the new diligence contradicts the original thesis, your primary task is to **articulate this conflict**. Your updated recommendation must be based on the *synthesis* of this conflicting information.

---

**INPUTS FOR ANALYSIS:**

**1. Original Final Investment Thesis:**
(This is the pre-existing conclusion and grade.)
\`\`\`markdown
{originalFinalThesisContent}
\`\`\`

**2. NEW Diligence Synthesis:**
(This is the new analysis based on the core diligence questions. It should include the consensus on business quality, the primary flaw, and the resulting long-term thesis.)
\`\`\`markdown
{newDiligenceSynthesisContent}
\`\`\`

---

**YOUR TASK (Strict Output Format):**

# Updated Final Thesis: {companyName} ({tickerSymbol})

## 1. Summary of New Diligence Findings
(In one paragraph, summarize the key conclusions from the **"New Diligence Synthesis"** input. What is the consensus on business quality, the primary flaw, and the resulting long-term thesis (e.g., 'value trap', 'compounder')?)

## 2. Re-evaluating the Core Narrative & Conflicts
(In one paragraph, compare the **Original Final Thesis Core Narrative** (and its recommendation) with the **New Diligence Synthesis**.
* Explicitly state the main points of **alignment** or **contradiction**.
* For example, does the Original Thesis already account for the flaws identified, or does the New Diligence present a much more bearish/bullish case?
* State whether the new diligence *confirms, contradicts,* or *fundamentally modifies* the original thesis.)

## 3. Updated Recommendation & Rationale
(In one or two paragraphs, build your *new* recommendation by synthesizing *all* inputs. Explain how you are weighing the original consensus against the new, more detailed findings to arrive at this updated conclusion.)

### Updated Recommendation
(Your response for this section MUST follow the format below exactly, including the bolding. Use the standard A-F grading scale: A (High Conviction Buy), B (Strong Buy), C (Hold/Add), D (Hold/Monitor), F (Sell/Pass).)

**Recommendation Grade:** [Assign an updated letter grade based on your *new* synthesis.]
**Suggested Allocation:** [State the corresponding allocation percentage.]

(Your updated one-sentence justification summarizing your *new* conclusion goes here.)

## 4. Updated Implications for Portfolio Management
(Based on your *updated* recommendation, provide revised, actionable interpretations.)
* **For a New Investment:** [Explain the updated meaning.]
* **For an Existing Position:** [Explain the updated meaning.]
`.trim();
// --- END NEW UPDATED THESIS ---

// --- REVISED QUALITATIVE DILIGENCE MEMO PROMPT ---
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
4.  For Section 3 ("Shareholder Base & Long-Term Thesis"), synthesize the user's answers for the 'Shareholder Base Quality', 'The "Wonderful Business" & The "Temporary Flaw"', and 'The Long-Term Bet & Margin of Safety' questions. If answers for any of these are missing in {qaData}, explicitly state that information was not provided for that specific part.
5.  For Section 4 ("Synthesis & Verdict"), write a concise one-paragraph summary combining the key findings from the previous sections, with special emphasis on the 'Long-Term Bet' if provided. Conclude this paragraph with a final sentence using the exact bolded format: "**Business quality appears [High/Average/Low]** because..." replacing the bracketed word based on your overall synthesis and providing a brief justification.

**OUTPUT TEMPLATE (Use this exact structure):**

# Qualitative Business Memo: {companyName} ({tickerSymbol})

## 1. Competitive Moat Analysis
[Your synthesis for Section 1 goes here based on Instruction 2]

## 2. Management, Strategy, & Alignment
[Your synthesis for Section 2 goes here based on Instruction 3]

## 3. Shareholder Base & Long-Term Thesis
[Your synthesis for Section 3 goes here based on Instruction 4]

## 4. Synthesis & Verdict
[Your synthesis paragraph and final bolded verdict sentence go here based on Instruction 5]
`.trim();
// --- END REVISED PROMPT ---


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

const MARKET_SENTIMENT_MEMO_PROMPT = `
Role: You are a market analyst AI.
Task: Based ONLY on the provided Question & Answer pairs, fill in the template below to create a "Market Sentiment Memo."

---
**CRITICAL INSTRUCTION: Your final output MUST use the exact markdown structure and headings provided in the template below. Fill in the [Your analysis here] sections based on the Q&A data.**
---

**Q&A Data:**
{qaData}

# Market Sentiment Memo: {companyName} ({tickerSymbol})

## 1. Analyst Consensus
[Your summary of the 'Analyst Consensus' Q&A here.]

## 2. Fundamental Factor Scores
[Your summary of the S&P factor scores from the Q&A here.]

## 3. Technical & Price Momentum
[Your summary of the technical sentiment and short interest data from the Q&A here.]

## 4. Synthesis & Verdict
[Your one-paragraph synthesis of all points here. Your final sentence MUST follow the example format exactly, including bolding. For example: **Overall market sentiment appears Bullish** due to the stock's powerful price momentum, which outweighs the valuation concerns.]
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
    // --- NEW DILIGENCE EXTRACTORS ---
    'QualitativeDiligenceMemo_Extract': { prompt: QUALITATIVE_DILIGENCE_MEMO_EXTRACT_PROMPT },
    'StructuredDiligenceMemo_Extract': { prompt: STRUCTURED_DILIGENCE_MEMO_EXTRACT_PROMPT },
    'MarketSentimentMemo_Extract': { prompt: MARKET_SENTIMENT_MEMO_EXTRACT_PROMPT },
    'InvestigationSummaryMemo_Extract': { prompt: INVESTIGATION_SUMMARY_MEMO_EXTRACT_PROMPT },
    // --- END DILIGENCE EXTRACTORS ---
    'FinalThesis_ConflictID': { prompt: FINAL_THESIS_CONFLICT_ID_PROMPT },
    'FinalInvestmentThesis': {
        prompt: FINAL_INVESTMENT_THESIS_PROMPT,
        requires: [] // Synthesis report, no direct FMP data
    },
    // --- NEW UPDATED THESIS ---
    'UpdatedFinalThesis': {
        prompt: UPDATED_FINAL_THESIS_PROMPT,
        requires: [] // Synthesis report, requires original thesis + diligence summaries
    }
};

export const ANALYSIS_ICONS = {
    'QarpAnalysis': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
    'MoatAnalysis': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286zm0 13.036h.008v.008h-.008v-.008z" /></svg>`,
    'CapitalAllocators': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15.91 15.91a2.25 2.25 0 01-3.182 0l-3.03-3.03a.75.75 0 011.06-1.061l2.47 2.47 2.47-2.47a.75.75 0 011.06 1.06l-3.03 3.03z" /></svg>`,
    'InvestigationSummaryMemo': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" /></svg>`,
    'QualitativeDiligenceMemo': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.76 9.76 0 01-2.53-.388m-5.168-4.482A10.457 10.457 0 013 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25" /></svg>`,
    'StructuredDiligenceMemo': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>`,
    'InvestmentMemo': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>`,
    'EightKAnalysis': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>`,
    'BmqvMemo': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-6.861 0c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-6.861 0c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" /></svg>`,
    'MarketSentimentMemo': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /></svg>`,
    'FinalInvestmentThesis': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-4.5m-9 4.5v-4.5m0 0h9.75M5.25 14.25h13.5M5.25 14.25a3 3 0 00-3 3h19.5a3 3 0 00-3-3M5.25 14.25v-4.5m13.5 4.5v-4.5m0 0h-12a3 3 0 00-3 3v.75" /></svg>`,
    'UpdatedFinalThesis': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 01-4.5-4.5V4.5a4.5 4.5 0 014.5-4.5h7.5a4.5 4.5 0 014.5 4.5v1.25m-18 0A2.625 2.625 0 115.25 2.625M10.34 15.84a4.491 4.491 0 00-1.443-1.443 4.49 4.49 0 00-2.093-1.096m1.443 1.443s-.103-.017-.327-.052m2.093 1.096s-.103.017-.327.052m1.327 0c-.688-.06-1.386-.09-2.09-.09h-.094m2.183 0h-.094m2.183 0c.688.06 1.386.09 2.09.09h.094m-2.183 0h.094m2.183 0c.688.06 1.386.09 2.09.09h.094m-2.183 0h.094m2.183 0c.688.06 1.386.09 2.09.09h.094m-2.183 0h.094M10.34 15.84l-1.443-1.443M1.927 10.34l-1.443-1.443M14.25 10.34l1.443-1.443M14.25 10.34l-1.443 1.443M14.25 10.34l1.443 1.443M10.34 15.84l1.443 1.443m-1.443-1.443l-1.443 1.443m1.443-1.443l1.443 1.443M10.34 15.84l1.443 1.443m-4.49-4.49l-1.443-1.443m1.443 1.443l-1.443 1.443m1.443-1.443l1.443 1.443M10.34 15.84l1.443 1.443" /></svg>`
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
    'InvestigationSummaryMemo': 'Investigation Summary',
    'UpdatedFinalThesis': 'Updated Final Thesis' // New entry
};
