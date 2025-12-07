// config.js

// --- Application Constants ---
export const APP_VERSION = "2.0.1-psych";
// [CHANGED] Updated to ensure uniqueness in Firestore paths
export const APP_ID = 'psych-research-assistant-v1'; 
export const DEFAULT_THEME_PROMPT = "Calm Academic Library";

// --- Storage Keys Namespace ---
// [ADDED] unique prefixes to prevent conflict with other localhost apps
const KEY_PREFIX = 'psych_';
export const STORAGE_KEYS = {
    GEMINI_KEY: `${KEY_PREFIX}geminiApiKey`,
    FB_CONFIG: `${KEY_PREFIX}firebaseConfig`,
    GOOGLE_CLIENT_ID: `${KEY_PREFIX}googleClientId`,
    GOOGLE_SEARCH_ID: `${KEY_PREFIX}googleSearchEngineId`,
    ALGOLIA_APP_ID: `${KEY_PREFIX}algoliaAppId`,
    ALGOLIA_KEY: `${KEY_PREFIX}algoliaSearchKey`,
    APP_VERSION: `${KEY_PREFIX}appVersion`,
    LAST_BACKUP: `${KEY_PREFIX}lastBackupTimestamp`
};

// --- External Library Imports (CDN) ---
export const FIREBASE_SDK_URL = "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";

// --- Global State Container ---
export const appState = {
    db: null,
    auth: null,
    userId: null,
    firebaseConfig: null,
    geminiApiKey: "",
    
    // Google API State
    googleClientId: '',
    googleSearchEngineId: '',
    driveFolderId: null,
    oauthToken: null,
    gapiInited: false,
    gisInited: false,
    tokenClient: null,

    // Algolia State
    algoliaAppId: '',
    algoliaSearchKey: '',
    algoliaClient: null,
    algoliaIndex: null,

    // App Logic State
    appIsInitialized: false,
    viewedItemIds: new Set(),
    stickyTopics: {},
    userAddedTopics: {},
    allThemeData: {},
    originalGeneratedText: new Map(), // Stores the markdown content
    currentHierarchyPath: [],
    selectedHierarchyItems: { main: null, sub: null, final: null },
    pendingDriveSave: null,
    
    // Unsubscribers
    stickyTopicsUnsubscribe: null,
    userTopicsUnsubscribes: {}
};

// --- Helper: Load Config from LocalStorage ---
export function loadConfigFromStorage() {
    // [CHANGED] Now uses namespaced keys
    appState.geminiApiKey = localStorage.getItem(STORAGE_KEYS.GEMINI_KEY);
    const firebaseConfigString = localStorage.getItem(STORAGE_KEYS.FB_CONFIG);
    appState.googleClientId = localStorage.getItem(STORAGE_KEYS.GOOGLE_CLIENT_ID);
    appState.googleSearchEngineId = localStorage.getItem(STORAGE_KEYS.GOOGLE_SEARCH_ID);
    appState.algoliaAppId = localStorage.getItem(STORAGE_KEYS.ALGOLIA_APP_ID);
    appState.algoliaSearchKey = localStorage.getItem(STORAGE_KEYS.ALGOLIA_KEY);

    if (firebaseConfigString) {
        try {
            appState.firebaseConfig = JSON.parse(firebaseConfigString);
        } catch (e) {
            console.error("Failed to parse Firebase config from localStorage", e);
            return false;
        }
    }

    // Return true if critical keys exist
    return !!(appState.geminiApiKey && appState.firebaseConfig);
}

// --- Helper: Get Hierarchy Base Path ---
export function getHierarchyBasePath() {
    return `artifacts/${APP_ID}/public/data`;
}
