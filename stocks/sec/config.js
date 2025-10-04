// fileName: config.js
// --- App Version ---
export const APP_VERSION = "14.17.0";

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
    secApiKey: "",
    portfolioCache: [],
    sessionLog: [], 
    recentFilingsCache: [],
    whaleFilingsCache: []
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
    DB_COLLECTION_INVESTOR_DATA: 'InvestorData', // NEW
};

// --- NEW: List of Top 25 Investors ---
export const TOP_25_INVESTORS = [
    { name: "BlackRock Inc.", cik: "0001364742" },
    { name: "The Vanguard Group", cik: "0000102109" },
    { name: "State Street Corporation", cik: "0000093751" },
    { name: "Fidelity (FMR LLC)", cik: "0000035325" },
    { name: "Morgan Stanley", cik: "0000895421" },
    { name: "JPMorgan Chase & Co.", cik: "0000019617" },
    { name: "Geode Capital Management", cik: "0001134267" },
    { name: "Bank of America Corporation", cik: "0000070858" },
    { name: "Goldman Sachs Group, Inc.", cik: "0000886982" },
    { name: "Wellington Management Company", cik: "0000105233" },
    { name: "T. Rowe Price Associates, Inc.", cik: "0000105223" },
    { name: "Invesco Ltd.", cik: "0000914208" },
    { name: "Northern Trust Corporation", cik: "0000073124" },
    { name: "Bridgewater Associates (Ray Dalio)", cik: "0001066395" },
    { name: "Berkshire Hathaway (Warren Buffett)", cik: "0001067983" },
    { name: "Citadel Advisors (Ken Griffin)", cik: "0001423053" },
    { name: "Millennium Management", cik: "0001273087" },
    { name: "Renaissance Technologies (Jim Simons)", cik: "0001037389" },
    { name: "Two Sigma Investments", cik: "0001551336" },
    { name: "Elliott Investment Management", cik: "0000908862" },
    { name: "Appaloosa Management (David Tepper)", cik: "0001079121" },
    { name: "Scion Asset Management (Michael Burry)", cik: "0001649339" },
    { name: "Pershing Square Capital (Bill Ackman)", cik: "0001336528" },
    { name: "Soros Fund Management", cik: "0001029160" },
    { name: "Duquesne Family Office (Stan Druckenmiller)", cik: "0001536411" },
];


export const FORM_8K_ANALYSIS_PROMPT = `...`; // Unchanged
export const FORM_10K_ANALYSIS_PROMPT = `...`; // Unchanged
export const FORM_10Q_ANALYSIS_PROMPT = `...`; // Unchanged
export const promptMap = { /* ... Unchanged ... */ };
