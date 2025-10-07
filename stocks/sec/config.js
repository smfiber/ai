export const APP_VERSION = '1.0.0';

/**
 * =================================================================
 * GLOBAL STATE MANAGEMENT
 * =================================================================
 */
export const state = {
    // API Keys & Config
    geminiApiKey: null,
    fmpApiKey: null,
    googleClientId: null,
    secApiKey: null,
    firebaseConfig: null,

    // Firebase Services
    db: null,
    auth: null,
    userId: null,

    // App Status
    appIsInitialized: false,
    sessionLog: [],

    // Data Caches
    portfolioCache: [],
    recentFilingsCache: [],
    whaleFilingsCache: [],
};

/**
 * =================================================================
 * APPLICATION CONSTANTS
 * =================================================================
 */
export const CONSTANTS = {
    // Element IDs
    FORM_API_KEY: 'apiKeyForm',
    ELEMENT_LOADING_MESSAGE: 'loading-message',

    // Modal IDs
    MODAL_API_KEY: 'apiKeyModal',
    MODAL_LOADING: 'loadingStateModal',
    MODAL_MESSAGE: 'messageModal',
    MODAL_CONFIRMATION: 'confirmationModal',

    // CSS Classes
    CLASS_HIDDEN: 'hidden',

    // --- CHANGE STARTS HERE ---
    // Firestore Collections
    DB_COLLECTION_PORTFOLIO: 'portfolio_stocks',
    // --- CHANGE ENDS HERE ---
    DB_COLLECTION_INVESTOR_DATA: 'investorData',
    DB_COLLECTION_FMP_CACHE: 'fmpCache',
};

/**
 * =================================================================
 * STATIC DATA
 * =================================================================
 */
export const TOP_25_INVESTORS = [
    { "name": "Baupost Group (Seth Klarman)", "cik": "1061768" },
    { "name": "Berkshire Hathaway (Warren Buffett & Greg Abel)", "cik": "1067983" },
    { "name": "Bridgewater Associates (Ray Dalio)", "cik": "1350694" },
    { "name": "Cevian Capital", "cik": "1365341" },
    { "name": "Citadel Advisors (Ken Griffin)", "cik": "1423053" },
    { "name": "D. E. Shaw & Co.", "cik": "1067983" },
    { "name": "Duquesne Family Office (Stan Druckenmiller)", "cik": "1536411" },
    { "name": "Elliott Management (Paul Singer)", "cik": "1791786" },
    { "name": "FMR LLC (Fidelity)", "cik": "315066" },
    { "name": "Goldman Sachs Group", "cik": "886982" },
    { "name": "Icahn Enterprises (Carl Icahn)", "cik": "921669" },
    { "name": "JPMorgan Chase & Co.", "cik": "19617" },
    { "name": "Millennium Management", "cik": "1273087" },
    { "name": "Morgan Stanley", "cik": "895421" },
    { "name": "Pershing Square Capital (Bill Ackman)", "cik": "1336528" },
    { "name": "Renaissance Technologies (Jim Simons)", "cik": "1037389" },
    { "name": "Scion Asset Management (Michael Burry)", "cik": "1649339" },
    { "name": "Soros Fund Management (Dawn Fitzpatrick)", "cik": "1029160" },
    { "name": "Starboard Value (Jeffrey Smith)", "cik": "1517137" },
    { "name": "Third Point (Dan Loeb)", "cik": "1040273" },
    { "name": "Tiger Global Management", "cik": "1167483" },
];

/**
 * Prompts for analyzing different types of SEC filings.
 */
export const promptMap = {
    '8-K': `
        Analyze the provided text from an SEC 8-K filing for the company. Your goal is to provide a clear, concise summary for an investor.

        Follow these steps:
        1.  **Identify the Core Event:** What is the primary reason for this filing? (e.g., Earnings Release, Executive Change, Merger Agreement, Bankruptcy).
        2.  **Extract Key Details:** Pull out the most important qualitative and quantitative information related to the event. For earnings, this includes revenue, net income, and EPS vs. expectations. For executive changes, who is leaving and who is replacing them. For mergers, the target, price, and expected closing.
        3.  **Determine Sentiment:** Based on the language and the data, classify the sentiment of the filing as Positive, Neutral, or Negative for the company's stock.
        4.  **Synthesize a Summary:** Combine the above points into a well-structured summary using Markdown formatting. Start with a title that includes the company ticker and the core event. Use bullet points for key details. End with a bolded "Sentiment" line.

        The analysis should be objective and based ONLY on the text provided. Do not include external information or speculation.
    `,
    '10-K': `
        You are an expert financial analyst. Analyze the provided text from the "Risk Factors" and "Management's Discussion and Analysis" (MD&A) sections of a 10-K annual report for the company.

        Your analysis should be structured as follows, using Markdown:

        ### 🔍 Key Risk Factors Analysis
        - Identify and summarize the top 3-5 most significant or newly emerging risks disclosed by the company.
        - For each risk, briefly explain its potential impact on the business.
        - Quote a critical sentence or phrase from the text that encapsulates the risk.

        ### 📈 Management's Discussion & Analysis (MD&A) Summary
        - **Performance:** Summarize management's explanation of the company's financial performance over the past year. Did revenues/profits increase or decrease, and why?
        - **Liquidity:** Briefly describe the company's liquidity position. Does management express any concerns about cash flow or their ability to meet financial obligations?
        - **Outlook:** Does management provide any forward-looking statements or guidance? Summarize their outlook on future trends, opportunities, or challenges.

        ### 💡 Analyst Conclusion
        Based ONLY on the provided text, provide a one-paragraph conclusion. Does management's tone seem confident, cautious, or concerned? What is the single most important takeaway an investor should have after reading these sections?
    `,
    '10-Q': `
        You are a financial analyst reviewing a 10-Q quarterly report for the company. Analyze the provided text, focusing on changes since the last annual report.

        Structure your analysis using Markdown:

        ### 📊 Quarterly Performance Highlights
        - **Financials:** Summarize the key financial results for the quarter (Revenue, Net Income). Compare them to the same quarter in the prior year if the data is available in the text.
        - **Management's Commentary:** What are the main reasons given by management for the quarterly performance? (e.g., strong sales, new products, economic headwinds, increased costs).

        ### ⚠️ Updated Risk Factors
        - Have any new or significantly changed risk factors been identified since the last 10-K filing? If so, summarize them. If not, state that there are no material changes.

        ### 📜 Legal Proceedings & Commitments
        - Is there any mention of new or significant legal proceedings?
        - Are there any new major financial commitments or obligations?

        ### 📉 Overall Assessment
        Provide a brief, one-paragraph summary. Based on the text, did the company's position improve, decline, or remain stable during the quarter? What is the most critical update for an investor from this filing?
    `,
    '4': `
        Analyze the provided text from an SEC Form 4 filing, which reports an insider transaction.

        Your task is to extract the key details and present them clearly. Structure your response in Markdown as follows:

        - **Filer Name:** [Name of the insider]
        - **Relationship to Company:** [e.g., Director, CEO, CFO, 10% Owner]
        - **Transaction Date:** [Date of the transaction]
        - **Transaction Type:** [e.g., Purchase, Sale, Grant, Award]
        - **Security:** [e.g., Common Stock]
        - **Transaction Details:** [Number of shares] shares at an average price of [$XX.XX per share].
        - **Total Value:** Approximately [$XXX,XXX].
        - **Ownership After Transaction:** [Number of shares] shares.

        Finally, add a one-sentence **"Significance"** line. Classify the transaction as either "Informative Buy/Sell" (a direct, open-market transaction) or "Non-Informative" (related to compensation, options exercise, or a gift).
    `
};
