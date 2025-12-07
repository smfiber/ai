// config.js

// --- Application Constants ---
export const APP_VERSION = "2.0.0-psych";
export const APP_ID = 'everything-psychology-v1'; // [CHANGED] New database namespace
export const DEFAULT_THEME_PROMPT = "Calm Academic Library"; // [CHANGED] New default visual theme

// --- External Library Imports (CDN) ---
// We export these strings to ensure consistent versioning across modules if needed,
// though modules will usually import directly.
export const FIREBASE_SDK_URL = "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";

// --- Global State Container ---
// We use a shared state object to manage dependencies (like db, auth) across modules
// without relying on the global 'window' scope.
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
    appState.geminiApiKey = localStorage.getItem('geminiApiKey');
    const firebaseConfigString = localStorage.getItem('firebaseConfig');
    appState.googleClientId = localStorage.getItem('googleClientId');
    appState.googleSearchEngineId = localStorage.getItem('googleSearchEngineId');
    appState.algoliaAppId = localStorage.getItem('algoliaAppId');
    appState.algoliaSearchKey = localStorage.getItem('algoliaSearchKey');

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
