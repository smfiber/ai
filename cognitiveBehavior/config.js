// config.js

// --- Application Constants ---
// [CHANGED] Version bumped to reflect Rich UI + Casual Persona update
export const APP_VERSION = "2.1.0-psych";
export const APP_ID = 'psych-research-assistant-v1'; 
export const DEFAULT_THEME_PROMPT = "Calm Academic Library";

// --- Storage Keys Namespace ---
const KEY_PREFIX = 'psych_';

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
    // Returns false to ensure the app always checks/prompts for keys on fresh load
    // while keeping user preferences intact.
    return false; 
}

// --- Helper: Get Hierarchy Base Path ---
export function getHierarchyBasePath() {
    return `artifacts/${APP_ID}/public/data`;
}
