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

// --- Master List of Top Investors ---
export const TOP_25_INVESTORS = [
    { name: "Berkshire Hathaway (Warren Buffett)", cik: "1067983" },
    { name: "Scion Asset Management (Michael Burry)", cik: "1649339" },
    { name: "Pershing Square Capital (Bill Ackman)", cik: "1336528" },
    { name: "Soros Fund Management", cik: "1029160" },
    { name: "Duquesne Family Office (Stan Druckenmiller)", cik: "1536411" },
    { name: "Greenlight Capital (David Einhorn)", cik: "1079114" },
    { name: "Starboard Value (Jeffrey Smith)", cik: "1449333" },
    { name: "Trian Fund Management (Nelson Peltz)", cik: "1338697" },
    { name: "ValueAct Capital Management", cik: "1157444" },
    { name: "Third Point (Dan Loeb)", cik: "1040273" },    
];

export const FORM_8K_ANALYSIS_PROMPT = `...`; // Unchanged
export const FORM_10K_ANALYSIS_PROMPT = `...`; // Unchanged
export const FORM_10Q_ANALYSIS_PROMPT = `...`; // Unchanged
export const promptMap = { /* ... Unchanged ... */ };
