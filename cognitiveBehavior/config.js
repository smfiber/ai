// config.js

// --- Application Constants ---
export const APP_VERSION = "2.0.1-psych";
// [CHANGED] Updated to ensure uniqueness in Firestore paths
export const APP_ID = 'psych-research-assistant-v1'; 
export const DEFAULT_THEME_PROMPT = "Calm Academic Library";

// --- Storage Keys Namespace ---
// [ADDED] unique prefixes to prevent conflict with other localhost apps
const KEY_PREFIX = 'psych_';

// [CHANGED] Removed Sensitive API Keys from Storage Definitions
export const STORAGE_KEYS = {
    // UI & State Preferences (Safe to store)
    APP_VERSION: `${KEY_PREFIX}appVersion`,
    LAST_BACKUP: `${KEY_PREFIX}lastBackupTimestamp`,
    
    // UI Visual Preferences (Fonts, etc.)
    FONT_FAMILY: `${KEY_PREFIX}ui_fontFamily`,
    FONT_SIZE: `${KEY_PREFIX}ui_fontSize`,
    LINE_HEIGHT: `${KEY_PREFIX}ui_lineHeight`
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
    // [CHANGED] This function no longer loads API keys. 
    // It is effectively a "Check if App Version Matches" utility now.
    
    const storedVersion = localStorage.getItem(STORAGE_KEYS.APP_VERSION);
    
    // We return false to indicate "No Config Loaded" (forcing the modal),
    // but we can still return the version status if needed.
    // For the new "Always Prompt" flow, we simply return false regarding keys.
    return false; 
}

// --- Helper: Get Hierarchy Base Path ---
export function getHierarchyBasePath() {
    return `artifacts/${APP_ID}/public/data`;
}
