// fileName: config.js
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
    googleClientId: "",
    secApiKey: "",
    portfolioCache: [],
    sessionLog: [], // To hold prompts and responses for the current session
    recentFilingsCache: [], // To cache filings for the new tabs
    whaleFilingsCache: [] // NEW: To cache whale filings for comparison
};

// --- Constants ---
export const CONSTANTS = {
    // Modals
    MODAL_API_KEY: 'apiKeyModal',
    MODAL_LOADING: 'loadingStateModal',
    MODAL_MESSAGE: 'messageModal',
    MODAL_CONFIRMATION: 'confirmationModal',
    // Forms & Inputs
    FORM_API_KEY: 'apiKeyForm',
    // Elements
    ELEMENT_LOADING_MESSAGE: 'loading-message',
    // Classes
    CLASS_HIDDEN: 'hidden',
    // Database Collections
    DB_COLLECTION_PORTFOLIO: 'portfolio_stocks',
    DB_COLLECTION_FMP_CACHE: 'fmp_cached_data',
};

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
    }
};
