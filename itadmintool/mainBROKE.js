import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, onSnapshot, Timestamp, doc, setDoc, deleteDoc, updateDoc, query, orderBy, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- App Version ---
const APP_VERSION = "1.6.1"; // [FIXED] Refactored the full guide generation to use a targeted 'replace or insert' for sections #6 & #9, ensuring their reliable inclusion.

// --- Global State ---
let db;
let auth;
let userId;
let viewedItemsCollectionRef;
const viewedItemIds = new Set();
let stickyTopicsUnsubscribe = null;
let stickyTopics = {};
let userAddedTopics = {};
let userTopicsUnsubscribes = {};
let firebaseConfig = null;
let appIsInitialized = false;
let geminiApiKey = "";
const root = document.documentElement;
const allThemeData = {};
let originalGeneratedText = new Map();
let aiLog = [];
let currentHierarchyPath = [];
let selectedHierarchyItems = { main: null, sub: null, final: null };
let pendingDriveSave = null;

// --- Algolia State ---
let algoliaAppId = '';
let algoliaSearchKey = '';
let algoliaClient;
let algoliaIndex;

// --- Google API State ---
let gapiInited = false;
let gisInited = false;
let tokenClient;
let GOOGLE_CLIENT_ID = '';
let Google Search_ENGINE_ID = '';
const G_SCOPES = 'https://www.googleapis.com/auth/drive.file';
let driveFolderId = null;
let oauthToken = null;

// --- Prompt Engineering Constants ---
const jsonInstruction = ` IMPORTANT: Ensure your response is ONLY a valid JSON object. All strings must be enclosed in double quotes. Any double quotes or backslashes within a string value must be properly escaped (e.g., "This is a \\"sample\\" description." or "C:\\\\Users\\\\Admin"). Do not wrap the JSON in markdown code fences.`;

// --- Function Declarations ---

/**
 * Saves a completed guide to the 'knowledgeBase' Firestore collection.
 * @param {string} title The title of the guide.
 * @param {string} markdownContent The full markdown content of the guide.
 * @param {Array} hierarchyPath The hierarchical path of the guide's topic.
 */
async function saveGuideToKB(title, markdownContent, hierarchyPath) {
    if (!userId) {
        displayMessageInModal("You must be logged in to save to the Knowledge Base.", 'warning');
        return;
    }
    if (!db || !firebaseConfig) {
        console.error("Firestore database or config is not initialized.");
        displayMessageInModal("Database connection error. Cannot save guide.", 'error');
        return;
    }

    const statusEl = document.getElementById('detailed-modal-status-message');
    statusEl.textContent = 'Adding to Knowledge Base...';

    const appId = firebaseConfig.appId || 'it-admin-hub-global';
    const kbCollectionRef = collection(db, `artifacts/${appId}/public/data/knowledgeBase`);
    const guideData = {
        title: title,
        markdownContent: markdownContent,
        hierarchyPath: hierarchyPath.map(p => p.title || p).join(' / '),
        createdAt: Timestamp.now(),
        status: 'completed',
        userId: userId,
    };

    try {
        const docRef = await addDoc(kbCollectionRef, guideData);
        console.log("Guide saved to Knowledge Base with ID: ", docRef.id);
        statusEl.textContent = 'Successfully added to Knowledge Base!';
        setTimeout(() => { statusEl.textContent = ''; }, 4000);
    } catch (error) {
        console.error("Error saving guide to Knowledge Base:", error);
        statusEl.textContent = `Error: ${error.message}`;
    }
}

/**
 * [NEW/REFACTORED] Saves a completed explanatory article to the 'explanatoryArticles' Firestore collection.
 * @param {string} title The title of the article.
 * @param {string} markdownContent The full markdown content of the article.
 * @param {Array} hierarchyPath The hierarchical path of the article's topic.
 */
async function saveArticleToKB(title, markdownContent, hierarchyPath) {
    if (!userId) {
        displayMessageInModal("You must be logged in to save to the Knowledge Base.", 'warning');
        return;
    }
    if (!db || !firebaseConfig) {
        console.error("Firestore database or config is not initialized.");
        displayMessageInModal("Database connection error. Cannot save article.", 'error');
        return;
    }

    const statusEl = document.getElementById('explanatory-article-modal-status-message');
    statusEl.textContent = 'Adding to Knowledge Base...';

    const appId = firebaseConfig.appId || 'it-admin-hub-global';
    // Save to a new collection to distinguish between structured guides and explanatory articles.
    const kbCollectionRef = collection(db, `artifacts/${appId}/public/data/explanatoryArticles`);
    const articleData = {
        title: title,
        markdownContent: markdownContent,
        hierarchyPath: hierarchyPath.map(p => p.title || p).join(' / '),
        createdAt: Timestamp.now(),
        status: 'completed',
        userId: userId,
    };

    try {
        const docRef = await addDoc(kbCollectionRef, articleData);
        console.log("Explanatory Article saved to Knowledge Base with ID: ", docRef.id);
        // This action can trigger a backend Firebase Function to index this record in Algolia.
        statusEl.textContent = 'Successfully added to Knowledge Base!';
        setTimeout(() => { statusEl.textContent = ''; }, 4000);
    } catch (error) {
        console.error("Error saving explanatory article to Knowledge Base:", error);
        statusEl.textContent = `Error: ${error.message}`;
    }
}


/**
 * [REFACTORED] Opens a modal and manages body classes for scroll locking.
 * @param {string} modalId The ID of the modal element to open.
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if(modal) {
        document.body.classList.add('modal-open');
        modal.classList.add('is-open');
    }
}

/**
 * [REFACTORED] Closes a modal and intelligently manages body classes.
 * @param {string} modalId The ID of the modal element to close.
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if(modal) {
        modal.classList.remove('is-open');
        // Only remove the body class if no other modals are open
        if (document.querySelectorAll('.modal.is-open').length === 0) {
             document.body.classList.remove('modal-open');
        }
    }
}

/**
 * Helper function to safely wait for the GAPI script to load.
 * @param {function} callback The function to execute once GAPI is ready.
 */
function gapiLoaded(callback) {
    if (typeof gapi !== 'undefined' && gapi.load) {
        callback();
    } else {
        setTimeout(() => gapiLoaded(callback), 100);
    }
}

/**
 * Helper function to safely wait for the Google Identity Services (GIS) script to load.
 * @param {function} callback The function to execute once GIS is ready.
 */
function gisLoaded(callback) {
    if (typeof google !== 'undefined' && google.accounts && google.accounts.oauth2) {
        callback();
    } else {
        setTimeout(() => gisLoaded(callback), 100);
    }
}

function loadConfigFromStorage() {
    geminiApiKey = localStorage.getItem('geminiApiKey');
    const firebaseConfigString = localStorage.getItem('firebaseConfig');
    GOOGLE_CLIENT_ID = localStorage.getItem('googleClientId');
    Google Search_ENGINE_ID = localStorage.getItem('googleSearchEngineId');
    algoliaAppId = localStorage.getItem('algoliaAppId');
    algoliaSearchKey = localStorage.getItem('algoliaSearchKey');

    if (firebaseConfigString) {
        try {
            firebaseConfig = JSON.parse(firebaseConfigString);
        } catch (e) {
            console.error("Failed to parse Firebase config from localStorage", e);
            localStorage.clear();
            return false;
        }
    }

    if (geminiApiKey && firebaseConfig) {
        document.getElementById('geminiApiKeyInput').value = geminiApiKey;
        document.getElementById('firebaseConfigInput').value = JSON.stringify(firebaseConfig, null, 2);
        if (GOOGLE_CLIENT_ID) document.getElementById('googleClientIdInput').value = GOOGLE_CLIENT_ID;
        if (Google Search_ENGINE_ID) document.getElementById('googleSearchEngineIdInput').value = Google Search_ENGINE_ID;
        if (algoliaAppId) document.getElementById('algoliaAppIdInput').value = algoliaAppId;
        if (algoliaSearchKey) document.getElementById('algoliaSearchKeyInput').value = algoliaSearchKey;
        return true;
    }
    return false;
}

async function initializeAppContent() {
    if (appIsInitialized) return;
    appIsInitialized = true;

    openModal('loadingStateModal');
    document.getElementById('loading-message').textContent = "Waking up the AI...";
    document.getElementById('gemini-result-container').innerHTML = '';
    
    checkBackupReminder();

    try {
        await generateAndApplyDefaultTheme();
        document.getElementById('loading-message').textContent = "Loading application content...";
        await loadAppContent();
        initializeAlgoliaSearch();
    } catch (error) {
        const errorMessage = error ? error.message : "An unknown error occurred.";
        console.error("A critical error occurred during app initialization:", errorMessage);
        localStorage.clear();
        openModal('apiKeyModal');
        document.getElementById('api-key-error').textContent = `Setup failed: ${errorMessage}. Your keys have been cleared. Please check and re-enter them.`;
    } finally {
        closeModal('loadingStateModal');
    }
}

function initializeFirebase() {
    if (!firebaseConfig) {
        console.warn("Firebase config is missing. Firebase initialization skipped.");
        return;
    }
    try {
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);

        onAuthStateChanged(auth, user => {
            if (user) {
                userId = user.uid;
                const appId = firebaseConfig.appId || 'it-admin-hub-global';
                viewedItemsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/viewedItems`);
                listenForViewedItems();
                
                if (!appIsInitialized) {
                    initializeAppContent();
                }
            } else {
                userId = null;
                viewedItemsCollectionRef = null;
                appIsInitialized = false;
            }
            setupAuthUI(user);
        });
    } catch (error) {
        console.error("Firebase initialization error:", error);
        openModal('apiKeyModal');
        document.getElementById('api-key-error').textContent = `Firebase Error: ${error.message}. Please check your config object.`;
    }
}

/**
 * Orchestrates the initialization of all Google API clients.
 */
function initializeGoogleApiClients() {
    if (!GOOGLE_CLIENT_ID) {
        console.warn("Google Client ID is not provided. Cloud features will be disabled.");
        return;
    }
    document.getElementById('cloud-storage-card').classList.remove('hidden');
    document.getElementById('google-drive-section').classList.remove('hidden');

    gisLoaded(initGisClient);
    gapiLoaded(() => {
        gapi.load('client:picker', initGapiClient);
    });
}

/**
 * Initializes the Google Identity Services (GIS) client for authentication.
 */
function initGisClient() {
    try {
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: G_SCOPES,
            callback: (tokenResponse) => {
                oauthToken = tokenResponse; 
                if (gapiInited && oauthToken && oauthToken.access_token) {
                    gapi.client.setToken(oauthToken);
                    updateSigninStatus(true);
                    if (pendingDriveSave) {
                        saveContentToDrive(pendingDriveSave.content, pendingDriveSave.fileName, pendingDriveSave.statusElement);
                        pendingDriveSave = null;
                    }
                } else if (!oauthToken || !oauthToken.access_token) {
                    console.error("Authentication failed or was cancelled. Token not received.");
                    displayMessageInModal("Google Drive connection failed. Please try again.", 'error');
                    updateSigninStatus(false);
                    pendingDriveSave = null;
                }
            },
        });
        gisInited = true;
    } catch (error) {
        console.error("Critical Error: Failed to initialize Google Identity Service client.", error);
        document.getElementById('drive-status').textContent = 'Error: Google Auth failed to load. Check console.';
        document.getElementById('auth-button').disabled = true;
    }
}

/**
 * Initializes the Google API (GAPI) client for Drive functionality.
 */
async function initGapiClient() {
    try {
        await gapi.client.init({
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        });
        gapiInited = true; 
        updateSigninStatus(!!(oauthToken && oauthToken.access_token));
    } catch(error) {
        console.error("Critical Error: Failed to initialize GAPI Client for Drive.", error);
        document.getElementById('drive-status').textContent = 'Error: Drive API failed to load. Check console.';
        document.getElementById('auth-button').disabled = true;
    }
}


function _performAuthUISetup(user, authStatusEl, appContainer) {
    if (user) {
        document.getElementById('app-container').classList.remove('hidden');
        closeModal('apiKeyModal');
        
        authStatusEl.innerHTML = `
            <div class="bg-white/20 backdrop-blur-sm rounded-full p-1 flex items-center gap-2 text-white text-sm">
                <img src="${user.photoURL}" alt="User photo" class="w-8 h-8 rounded-full">
                <span class="font-medium pr-2">${user.displayName}</span>
                <button id="logout-button" class="bg-white/20 hover:bg-white/40 text-white font-semibold py-1 px-3 rounded-full flex items-center justify-center gap-2" title="Sign Out">
                    <span>Logout</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                </button>
            </div>
        `;
        document.getElementById('logout-button').addEventListener('click', handleLogout);
    } else {
         authStatusEl.innerHTML = `
             <button id="login-button" class="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white font-semibold py-2 px-4 rounded-full flex items-center justify-center gap-2" title="Sign In with Google">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48" fill="none"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path><path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path><path fill="#4CAF50" d="M24 44c5.166 0 9.599-1.521 12.643-4.001L30.27 34.138C28.714 36.548 26.521 38 24 38c-5.223 0-9.657-3.341-11.303-7.918l-6.573 4.818C9.656 39.663 16.318 44 24 44z"></path><path fill="#1976D2" d="M43.611 20.083H24v8h11.303c-.792 2.237-2.231 4.16-4.082 5.571l5.657 5.657C41.389 36.197 44 30.669 44 24c0-1.341-.138-2.65-.389-3.917z"></path></svg>
                 <span>Login with Google</span>
            </button>
        `;
        document.getElementById('login-button').addEventListener('click', handleLogin);
        document.getElementById('app-container').classList.add('hidden');
        if (!localStorage.getItem('geminiApiKey')) {
             openModal('apiKeyModal');
        }
    }
}

function setupAuthUI(user) {
    const authStatusEl = document.getElementById('auth-status');
    const appContainer = document.getElementById('app-container');
    if (authStatusEl && appContainer) {
        _performAuthUISetup(user, authStatusEl, appContainer);
    }
}

async function handleLogin() {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/cloud-platform');
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("Google Sign-In Popup failed:", error);
        let userMessage = `Login failed: ${error.code}.`;
        if (error.code === 'auth/popup-closed-by-user') {
            userMessage += ' You closed the login window before completing sign-in.';
        } else {
            userMessage += ' This can be caused by pop-up blockers. Please check your browser settings.';
        }
        document.getElementById('api-key-error').textContent = userMessage;
    }
}

function handleLogout() {
    if (oauthToken && oauthToken.access_token) {
        google.accounts.oauth2.revoke(oauthToken.access_token, () => {
            console.log("Google Drive token revoked during logout.");
        });
    }
    if (gapi?.client) {
       gapi.client.setToken(null);
    }
    
    signOut(auth).then(() => {
        oauthToken = null;
        updateSigninStatus(false);
        localStorage.clear();
        sessionStorage.clear();
        location.reload();
    }).catch(error => {
        console.error("Sign out failed:", error);
    });
}

/**
 * Updates all UI elements related to Google Drive sign-in status.
 * @param {boolean} isSignedIn Whether the user is signed into Google Drive.
 */
function updateSigninStatus(isSignedIn) {
    const authButton = document.getElementById('auth-button');
    const loadBtn = document.getElementById('load-from-drive-btn');
    const statusEl = document.getElementById('drive-status');
    
    if (isSignedIn) {
        authButton.textContent = 'Disconnect';
        authButton.title = 'Disconnect your Google Account';
        loadBtn.classList.remove('hidden');
        statusEl.textContent = 'Connected to Google Drive.';
        getDriveFolderId();
    } else {
        authButton.textContent = 'Connect';
        authButton.title = 'Connect your Google Account';
        loadBtn.classList.add('hidden');
        statusEl.textContent = 'Connect to save and load guides from Google Drive.';
        driveFolderId = null;
    }

    const hasToken = !!(oauthToken && oauthToken.access_token);
    if (document.getElementById('inDepthModal')?.classList.contains('is-open')) {
        const isInitial = !!document.getElementById('generate-detailed-steps-btn');
        addModalActionButtons(document.getElementById('inDepthModalButtons'), isInitial, hasToken);
    }
    if (document.getElementById('inDepthDetailedModal')?.classList.contains('is-open')) {
        addDetailedModalActionButtons(document.getElementById('inDepthDetailedModalButtons'), hasToken);
    }
    if (document.getElementById('searchGeminiModal')?.classList.contains('is-open')) {
        addSearchModalActionButtons(document.getElementById('searchGeminiModalButtons'), hasToken);
    }
}

function listenForViewedItems() {
    if (!viewedItemsCollectionRef) return;
    onSnapshot(viewedItemsCollectionRef, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
                viewedItemIds.add(change.doc.id);
            }
        });
    }, (error) => {
        console.error("Error listening to viewed items:", error);
    });
}

async function handleApiKeySubmit(e) {
    e.preventDefault();
    const tempGeminiKey = document.getElementById('geminiApiKeyInput').value.trim();
    const tempFirebaseConfigText = document.getElementById('firebaseConfigInput').value.trim();
    const tempGoogleClientId = document.getElementById('googleClientIdInput').value.trim();
    const tempGoogleSearchEngineId = document.getElementById('googleSearchEngineIdInput').value.trim();
    const tempAlgoliaAppId = document.getElementById('algoliaAppIdInput').value.trim();
    const tempAlgoliaSearchKey = document.getElementById('algoliaSearchKeyInput').value.trim();
    let tempFirebaseConfig;

    const errorEl = document.getElementById('api-key-error');
    errorEl.textContent = '';

    if (!tempGeminiKey || !tempFirebaseConfigText) {
        errorEl.textContent = "Gemini API Key and Firebase Config are required.";
        return;
    }
    
    try {
        const match = tempFirebaseConfigText.match(/\{[\s\S]*\}/);
        if (!match) {
            throw new Error("Could not find a config object starting with '{' and ending with '}'.");
        }
        const configString = match[0];
        const configFactory = new Function(`return ${configString}`);
        tempFirebaseConfig = configFactory();

        if (!tempFirebaseConfig || typeof tempFirebaseConfig !== 'object' || !tempFirebaseConfig.apiKey || !tempFirebaseConfig.projectId) {
            throw new Error("The parsed Firebase config is invalid or missing required properties like 'apiKey' or 'projectId'.");
        }
    } catch (err) {
        errorEl.textContent = `Invalid Firebase Config: ${err.message}. Please ensure you've pasted the complete snippet from your Firebase project settings.`;
        return;
    }
    
    localStorage.setItem('geminiApiKey', tempGeminiKey);
    localStorage.setItem('firebaseConfig', JSON.stringify(tempFirebaseConfig));
    localStorage.setItem('googleClientId', tempGoogleClientId);
    localStorage.setItem('googleSearchEngineId', tempGoogleSearchEngineId);
    localStorage.setItem('algoliaAppId', tempAlgoliaAppId);
    localStorage.setItem('algoliaSearchKey', tempAlgoliaSearchKey);

    
    if (loadConfigFromStorage()) {
        initializeFirebase();
        initializeGoogleApiClients();
        handleLogin();
    }
}

function setupEventListeners() {
    document.getElementById('apiKeyForm')?.addEventListener('submit', handleApiKeySubmit);
    document.getElementById('gemini-form')?.addEventListener('submit', handleGeminiSubmit);

    document.getElementById('persona-selector')?.addEventListener('click', (e) => {
        if (e.target.classList.contains('prompt-builder-btn')) {
            document.querySelectorAll('#persona-selector .prompt-builder-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
        }
    });

    document.getElementById('tone-selector')?.addEventListener('click', (e) => {
        if (e.target.classList.contains('prompt-builder-btn')) {
            document.querySelectorAll('#tone-selector .prompt-builder-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
        }
    });

    document.getElementById('generate-theme-btn')?.addEventListener('click', handleCustomVisualThemeGeneration);
    document.getElementById('explore-featured-btn')?.addEventListener('click', () => openCategoryBrowser('featured'));
    document.getElementById('browse-all-btn')?.addEventListener('click', () => openCategoryBrowser('all'));
    document.getElementById('closeCategoryBrowserModal')?.addEventListener('click', () => closeModal('categoryBrowserModal'));
    document.getElementById('auth-button')?.addEventListener('click', handleAuthClick);
    
    document.getElementById('load-from-drive-btn')?.addEventListener('click', async () => {
        const folderId = await getDriveFolderId();
        createPicker('open', folderId);
    });
    
    document.getElementById('prompts-button')?.addEventListener('click', displayAppInternalsModal);
    
    document.getElementById('real-time-log-button')?.addEventListener('click', displayAiLog);
    document.getElementById('theme-changer-button')?.addEventListener('click', () => {
        if(!geminiApiKey) { openModal('apiKeyModal'); return; }
        openModal('themeGeneratorModal');
    });
    document.getElementById('ai-help-button')?.addEventListener('click', handleAIHelpRequest);
    document.getElementById('scroll-to-top-button')?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    document.getElementById('export-data-button')?.addEventListener('click', handleExportData);
    document.getElementById('import-data-button')?.addEventListener('click', handleImportData);
    document.getElementById('settings-button')?.addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('settings-panel').classList.toggle('hidden');
    });
    document.getElementById('font-family-select')?.addEventListener('change', (e) => root.style.setProperty('--font-family', e.target.value));
    document.getElementById('font-size-select')?.addEventListener('change', (e) => root.style.setProperty('--font-size-base', e.target.value));
    document.getElementById('line-height-select')?.addEventListener('change', (e) => root.style.setProperty('--line-height-base', e.target.value));
    
    document.getElementById('search-kb-button')?.addEventListener('click', () => openModal('searchModal'));
    document.getElementById('kb-button')?.addEventListener('click', openKbBrowser);
    document.getElementById('search-input')?.addEventListener('keyup', performSearch);


    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target.id.startsWith('close')) {
                closeModal(modal.id);
            }
        });
    });

    document.getElementById('search-gemini-button')?.addEventListener('click', handleSearchGemini);
    document.addEventListener('mouseup', handleTextSelection);
    document.addEventListener('mousedown', (e) => {
         const searchButton = document.getElementById('search-gemini-button');
         if (searchButton && !searchButton.classList.contains('hidden') && !searchButton.contains(e.target)) {
            searchButton.classList.add('hidden');
         }
    });
    document.addEventListener('click', (e) => {
        const settingsPanel = document.getElementById('settings-panel');
        if (settingsPanel && !settingsPanel.classList.contains('hidden') && !settingsPanel.contains(e.target) && !e.target.closest('#settings-button')) {
            settingsPanel.classList.add('hidden');
        }

        const target = e.target;
        if (target.closest('.copy-code-button')) {
            const codeBlock = target.closest('.code-block-container').querySelector('code, pre');
            copyElementTextToClipboard(codeBlock, target);
        } else if (target.closest('#save-to-drive-btn')) {
            handleSaveToDriveClick(target.closest('#save-to-drive-btn'));
        } else if (target.closest('.add-topic-button')) {            
            handleAddNewTopic(target.closest('.add-topic-button'));
        } else if (target.closest('.grid-card-selector')) {
            handleGridSelect(target.closest('.grid-card-selector'));
        } else if (target.closest('.explore-button')) {
            const button = target.closest('.explore-button');
            const card = button.closest('.card');
            if (card) {
                const topicId = button.dataset.topicId;
                const fullHierarchyPath = JSON.parse(card.dataset.fullHierarchyPath);
                handleExploreInDepth(topicId, fullHierarchyPath);
            } else {
                console.error("Could not find parent card for explore button.");
            }
        } else if (target.closest('.explanatory-article-button')) { // [MODIFIED]
            const button = target.closest('.explanatory-article-button');
            const { topicId, categoryId } = button.dataset;
            handleExplanatoryArticleRequest(topicId, categoryId); // [MODIFIED]
        } else if (target.closest('.refine-button')) {
            toggleRefineUI(target.closest('.refine-button').parentElement);
        } else if (target.closest('.modal-refine-button')) {
            const modal = target.closest('.card');
            const targetModalId = modal.parentElement.id;
            if(targetModalId) {
                 toggleRefineUI(target.closest('.modal-refine-button').parentElement, true, targetModalId);
            }
        } else if (target.closest('.submit-refinement-button')) {
            const targetModalId = target.closest('.submit-refinement-button').dataset.targetModalId;
            handleRefineRequest(target.closest('.refine-container'), targetModalId);
        } else if (target.closest('.generate-more-button')) {
            handleGenerateMoreClick(target.closest('.generate-more-button'));
        } else if (target.closest('.accordion-header')) {
            const header = target.closest('.accordion-header');
            header.classList.toggle('active');
            header.querySelector('.icon').style.transform = header.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0deg)';
            header.nextElementSibling.classList.toggle('open');
        } else if (target.closest('#generate-detailed-steps-btn')) {
            generateFullDetailedGuide(target.closest('#generate-detailed-steps-btn'));
        } else if (target.closest('.search-result-item')) {
            const objectID = target.closest('.search-result-item').dataset.id;
            const type = target.closest('.search-result-item').dataset.type;
            handleSearchResultClick(objectID, type);
        }
    });
    window.addEventListener('scroll', () => {
        const scrollTopButton = document.getElementById('scroll-to-top-button');
        if (scrollTopButton) {
            scrollTopButton.classList.toggle('hidden', window.scrollY <= 300);
        }
    });

    document.getElementById('hierarchy-manager-button')?.addEventListener('click', openHierarchyManagementModal);
    document.getElementById('add-main-category-btn')?.addEventListener('click', () => handleAddHierarchyItem('main'));
    document.getElementById('add-sub-category-btn')?.addEventListener('click', () => handleAddHierarchyItem('sub'));
    document.getElementById('add-final-category-btn')?.addEventListener('click', () => handleAddHierarchyItem('final'));
    document.getElementById('save-hierarchy-item-btn')?.addEventListener('click', handleSaveHierarchyItem);
    document.getElementById('delete-hierarchy-item-btn')?.addEventListener('click', handleDeleteHierarchyItem);
    document.getElementById('firebase-tools-button')?.addEventListener('click', openStickyTopicsModal);
    document.getElementById('sticky-topic-category-select')?.addEventListener('change', (e) => listenForStickyTopics(e.target.value));
    document.getElementById('add-sticky-topic-button')?.addEventListener('click', handleAddStickyTopic);
}

async function handleAuthClick() {
    if (oauthToken && oauthToken.access_token) {
        google.accounts.oauth2.revoke(oauthToken.access_token, () => {
            if (gapi?.client) {
                gapi.client.setToken(null);
            }
            oauthToken = null;
            updateSigninStatus(false);
            console.log('Google Drive token has been revoked.');
        });
    } else {
        if (gisInited && tokenClient) {
            tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
            console.error("Google token client is not initialized.");
            displayMessageInModal("Google services are not ready. Please wait a moment and try again.", "error");
        }
    }
}


async function getDriveFolderId() {
    if (driveFolderId) return driveFolderId;
    const driveStatusEl = document.getElementById('drive-status');
    driveStatusEl.textContent = 'Searching for app folder...';
    try {
        const response = await gapi.client.drive.files.list({
            q: "mimeType='application/vnd.google-apps.folder' and name='IT Administration Hub' and trashed=false",
            fields: 'files(id, name)',
        });
        if (response.result.files && response.result.files.length > 0) {
            driveFolderId = response.result.files[0].id;
        } else {
            driveStatusEl.textContent = 'Creating app folder...';
            const folderResponse = await gapi.client.drive.files.create({
                resource: { 'name': 'IT Administration Hub', 'mimeType': 'application/vnd.google-apps.folder' },
                fields: 'id'
            });
            driveFolderId = folderResponse.result.id;
        }
        driveStatusEl.textContent = 'Connected to Google Drive.';
        return driveFolderId;
    } catch (error) {
        console.error("Error finding/creating Drive folder:", error);
        driveStatusEl.textContent = 'Error with Drive folder access.';
        return null;
    }
}

async function handleSaveToDriveClick(button) {
    const modal = button.closest('.card');
    if (!modal) return;

    let contentToSave, statusEl, topicTitle, finalFileName, modalFooter;
    
    const now = new Date();
    const timestamp = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;


    if (modal.parentElement.id === 'searchGeminiModal') {
        contentToSave = document.getElementById('searchGeminiResult').innerText;
        const cardName = "Gemini Search";
        const fullTopicTitle = document.getElementById('searchGeminiQueryText').value;
        topicTitle = truncateText(fullTopicTitle, 40);
        statusEl = document.getElementById('search-modal-status-message');
        finalFileName = `${cardName} - ${topicTitle} - ${timestamp}.md`;
    } else {
        modalFooter = button.closest('[id$="ModalFooter"]');

        if (!modalFooter) {
            console.error("Save to Drive Error: Could not find the modal footer for the clicked button.");
            const anyStatusEl = modalFooter?.querySelector('p[id$="status-message"]');
            if (anyStatusEl) anyStatusEl.textContent = 'Error: Could not find modal data.';
            return;
        }

        const fullTitle = modalFooter.dataset.fullTitle;
        const hierarchyPathString = modalFooter.dataset.fullHierarchyPath;

        contentToSave = originalGeneratedText.get(fullTitle);
        topicTitle = fullTitle.replace(/In-Depth: |Custom Guide: |Complete Guide: |Explanatory Article: /g, '').trim();
        statusEl = modalFooter.querySelector('p[id$="status-message"]');

        let breadcrumbs = modalFooter.dataset.cardName || 'Guide';
        try {
            if (hierarchyPathString && hierarchyPathString !== 'undefined') {
                const hierarchyPath = JSON.parse(hierarchyPathString);
                if (Array.isArray(hierarchyPath)) {
                    breadcrumbs = hierarchyPath.map(p => p.title || p).join(' / ');
                }
            }
        } catch (e) {
            console.error("Could not parse hierarchy path for filename, using fallback.", e);
        }
        
        finalFileName = `${breadcrumbs} - ${topicTitle} - ${timestamp}.md`; // Default fallback

        if (fullTitle) {
            if (fullTitle.startsWith('Explanatory Article:')) {
                finalFileName = `${breadcrumbs} - ${topicTitle} - article - ${timestamp}.md`;
            } else if (
                fullTitle.startsWith('In-Depth:') ||
                fullTitle.startsWith('Custom Guide:') ||
                fullTitle.startsWith('Complete Guide:')
            ) {
                finalFileName = `${breadcrumbs} - ${topicTitle} - guide - ${timestamp}.md`;
            }
        }
    }

    if (!contentToSave) {
        if (statusEl) statusEl.textContent = "Error: Content not found.";
        return;
    }

    const safeFileName = finalFileName.replace(/[/\\?%*:|"<>]/g, '-');
    await saveContentToDrive(contentToSave, safeFileName, statusEl);
}

async function saveContentToDrive(content, fileName, statusElement) {
    if (!gapiInited || !gisInited || !oauthToken || !oauthToken.access_token) {
        pendingDriveSave = { content, fileName, statusElement };
        if (statusElement) statusElement.textContent = 'Connecting to Google Drive...';
        handleAuthClick();
        return;
    }

    statusElement.textContent = 'Saving to Google Drive...';
    const folderId = await getDriveFolderId();
    if (!folderId) {
        statusElement.textContent = 'Could not find or create the app folder in Drive.';
        return;
    }
    try {
        const safeFileName = fileName.replace(/'/g, "\\'").replace(/"/g, '\\"');
        const searchResponse = await gapi.client.drive.files.list({
            q: `name='${safeFileName}' and '${folderId}' in parents and trashed=false`,
            fields: 'files(id)',
            spaces: 'drive'
        });

        const fileExists = searchResponse.result.files && searchResponse.result.files.length > 0;
        const fileId = fileExists ? searchResponse.result.files[0].id : null;

        const boundary = '-------314159265358979323846';
        const delimiter = "\r\n--" + boundary + "\r\n";
        const close_delim = "\r\n--" + boundary + "--";
        const contentType = 'text/markdown';

        const metadata = fileExists
            ? {}
            : { name: fileName, parents: [folderId] };

        const multipartRequestBody = delimiter +
            `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
            JSON.stringify(metadata) +
            delimiter +
            `Content-Type: ${contentType}\r\n\r\n` +
            content +
            close_delim;

        const requestPath = `/upload/drive/v3/files${fileExists ? '/' + fileId : ''}`;
        const requestMethod = fileExists ? 'PATCH' : 'POST';

        await gapi.client.request({
            path: requestPath,
            method: requestMethod,
            params: { uploadType: 'multipart' },
            headers: { 'Content-Type': `multipart/related; boundary="${boundary}"` },
            body: multipartRequestBody
        });

        statusElement.textContent = `File '${fileName}' ${fileExists ? 'updated' : 'saved'} in Drive!`;
        setTimeout(() => { if (statusElement) statusElement.textContent = ''; }, 4000);
    } catch (error) {
        console.error('Error saving file to Drive:', error);
        statusElement.textContent = 'Error saving file. Check console.';
    }
}

function createPicker(mode, startInFolderId = null) {
    const statusEl = document.getElementById('drive-status');

    if (!gapiInited || !gisInited) {
        statusEl.textContent = 'Google API is not ready. Please try again in a moment.';
        console.error("Picker creation failed: GAPI or GIS not initialized.");
        return;
    }

    const token = oauthToken?.access_token;
    if (!token) {
        statusEl.textContent = 'Please connect to Google Drive first.';
        handleAuthClick(); 
        return;
    }

    try {
        const builder = new google.picker.PickerBuilder()
            .setOAuthToken(token)
            .setDeveloperKey(geminiApiKey); 
        if (mode === 'open') {
            const view = new google.picker.View(google.picker.ViewId.DOCS);
            view.setMimeTypes("text/markdown,text/plain,.md");
            if (startInFolderId) {
                view.setParent(startInFolderId);
            }
            builder.addView(view).setCallback(pickerCallbackOpen);
        }
        const picker = builder.build();
        picker.setVisible(true);

    } catch (error) {
        console.error("Error creating Google Picker:", error);
        statusEl.textContent = `Error launching the file picker: ${error.message}`;
    }
}


async function pickerCallbackOpen(data) {
    if (data.action === google.picker.Action.PICKED) {
        const fileId = data.docs[0].id;
        const statusEl = document.getElementById('drive-status');
        statusEl.textContent = 'Loading selected file...';
        try {
            const response = await gapi.client.drive.files.get({ fileId, alt: 'media' });
            const fileContent = response.body;
            const fileName = data.docs[0].name;
            displayImportedGuide(fileName, fileContent);
            statusEl.textContent = 'File loaded successfully.';
            setTimeout(() => {
                if (oauthToken && oauthToken.access_token) {
                    statusEl.textContent = 'Connected to Google Drive.';
                }
            }, 3000);
        } catch (error) {
            console.error("Error loading file content:", error);
            statusEl.textContent = 'Error loading file from Google Drive.';
        }
    }
}

function displayImportedGuide(fileName, markdownContent) {
    const section = document.getElementById('imported-guides-section');
    const container = document.getElementById('imported-guides-container');
    section.classList.remove('hidden');
    const cardId = `imported-${fileName.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now()}`;
    
    const card = document.createElement('div');
    card.className = 'card';
    card.id = cardId;

    const cardContent = document.createElement('div');
    cardContent.className = 'p-8 card-content';
    
    cardContent.innerHTML = `
        <h2 class="text-2xl font-bold mb-2 themed-text-primary flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 inline-block mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Imported: ${fileName}
        </h2>
        <div class="prose max-w-none mt-4"></div>
    `;
    
    const renderTarget = cardContent.querySelector('.prose');
    renderAccordionFromMarkdown(markdownContent, renderTarget);
    
    card.appendChild(cardContent);
    container.prepend(card);
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
}


async function loadAppContent() {
    try {
        await loadDynamicPlaceholders();
    } catch (error) {
        console.error("An error occurred while loading app content:", error.message);
        throw error;
    }
}

function createBreadcrumbsHtml(pathArray) {
    if (!pathArray || pathArray.length === 0) {
        return '';
    }
    const pathSegments = pathArray.map(p => `<span>${p.title}</span>`).join('<span class="mx-2 opacity-50">/</span>');
    return `<div class="flex items-center flex-wrap gap-x-2 text-sm themed-text-muted mb-3">${pathSegments}</div>`;
}

async function generateAndPopulateAICategory(fullHierarchyPath) {
    const finalCategory = fullHierarchyPath[fullHierarchyPath.length - 1];
    const cardId = `category-card-${finalCategory.id}`;
    const existingCard = document.getElementById(cardId);
    if (existingCard) {
        existingCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
    const card = document.createElement('div');
    card.className = 'card';
    card.id = cardId;
    card.dataset.fullHierarchyPath = JSON.stringify(fullHierarchyPath);
    const selectorId = `selector-${finalCategory.id}`;
    
    const breadcrumbsHtml = createBreadcrumbsHtml(fullHierarchyPath);
    card.innerHTML = `<div class="p-8 card-content">${breadcrumbsHtml}<h2 class="text-2xl font-bold mb-2 themed-text-primary">${finalCategory.title}</h2><p class="mb-6 themed-text-muted">${finalCategory.description}</p><div id="${selectorId}" data-category-id="${finalCategory.id}" class="w-full">${getLoaderHTML(`AI is generating topics for ${finalCategory.title}...`)}</div><div id="details-${finalCategory.id}" class="details-container mt-4"></div></div>`;
    
    const container = document.getElementById('dynamic-card-container');
    container.prepend(card);
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });

    allThemeData[finalCategory.id] = null;
    listenForUserAddedTopics(finalCategory.id);

    try {
        const defaultPrompt = `Generate 8 common administrative tasks or areas of focus for "${finalCategory.title}". Avoid generic numbered 'steps'. For each topic, provide a unique "id" (a short, URL-friendly string), a "title", and a short one-sentence "description". Return a valid JSON array of objects.`;
        const prompt = finalCategory.initialPrompt || defaultPrompt;
        
        const jsonText = await callGeminiAPI(prompt, true, "Initial Category Population");
        if (!jsonText) throw new Error(`API returned empty content for ${finalCategory.title}.`);
        
        let data = parseJsonWithCorrections(jsonText);
        if (!Array.isArray(data)) {
            throw new Error("Invalid API response format: Expected an array of topics for the category.");
        }
        
        data = data.map(item => {
            if (!item.title) item.title = "Untitled Topic";

            const sanitizedTitle = sanitizeTitle(item.title);

            if (sanitizedTitle.length > 65 && item.description && item.description.length < 65) {
                return {
                    ...item,
                    title: sanitizeTitle(item.description),
                    description: item.title
                };
            }
            
            return { ...item, title: sanitizedTitle };
        });
        
        data.forEach(item => {
            if (!item.id) {
                item.id = `${sanitizeTitle(item.title).replace(/\s+/g, '-')}-${Date.now()}`;
            }
        });
        
        data.sort((a, b) => a.title.localeCompare(b.title));
        allThemeData[finalCategory.id] = data;
        
        populateCardGridSelector(card.querySelector(`#${selectorId}`), finalCategory.id);
        return card;
    } catch (error) {
        allThemeData[finalCategory.id] = [];
        handleApiError(error, card.querySelector(`#${selectorId}`), finalCategory.title, card);
        throw error;
    }
}

function populateCardGridSelector(container, categoryId, newItemsIds = new Set()) {
    if (!container) return;

    if (allThemeData[categoryId] === null) {
        if (!container.querySelector('.loader')) {
            const cardTitle = document.getElementById(`category-card-${categoryId}`)?.querySelector('h2')?.textContent || 'this category';
            container.innerHTML = getLoaderHTML(`AI is generating topics for ${cardTitle}...`);
        }
        return;
    }
    
    const data = allThemeData[categoryId] || [];
    const stickies = stickyTopics[categoryId] || [];
    const userAdded = userAddedTopics[categoryId] || [];
    const topicInputId = `add-topic-input-${categoryId}`;
    const containerId = container.id;
    const addNewTopicHtml = `<div class="add-topic-container"><input type="text" id="${topicInputId}" name="${topicInputId}" placeholder="Add your own topic..." class="themed-input w-full p-2 rounded-lg text-sm"><button class="btn-secondary add-topic-button !px-4 !py-2" data-container-id="${containerId}" data-category-id="${categoryId}">Add Topic</button></div>`;

    if (data.length === 0 && stickies.length === 0 && userAdded.length === 0) {
         container.innerHTML = `<p class="themed-text-muted text-center py-8">No topics found. You can add your own below.</p>` + addNewTopicHtml;
         return;
    }

    const gridClass = 'card-grid-container';
    const card = container.closest('.card');
    const cardTitle = card.querySelector('h2').textContent;
    const stickyTitles = new Set(stickies.map(s => s.title));
    const userAddedTitles = new Set(userAdded.map(u => u.title));
    const stickyHtml = stickies.map(item => `
        <div id="grid-selector-${item.id}" class="grid-card-selector" data-topic-id="${item.id}" data-category-id="${categoryId}" title="${item.title}">
            <div class="indicator sticky-indicator" title="Sticky Topic"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L13 7.414V17a1 1 0 11-2 0V7.414L7.707 10.707a1 1 0 01-1.414-1.414l4-4z" clip-rule="evenodd" /></svg></div>
            <div class="icon">${getIconForTheme(categoryId, item.id)}</div>
            <div class="mt-2 overflow-hidden"><div class="text-sm font-normal leading-tight block">${truncateText(item.title, 50)}</div></div>
        </div>`).join('');
    const userAddedHtml = userAdded.map(item => `
        <div id="grid-selector-${item.id}" class="grid-card-selector" data-topic-id="${item.id}" data-category-id="${categoryId}" title="${item.title}">
            <div class="indicator" style="background-color: #f59e0b;" title="Your Added Topic"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4"><path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.41-1.412A6.962 6.962 0 0010 11.5c-2.25 0-4.33.9-5.535 2.993z"></path></svg></div>
            <div class="icon">${getIconForTheme(categoryId, item.id)}</div>
            <div class="mt-2 overflow-hidden"><div class="text-sm font-normal leading-tight block">${truncateText(item.title, 50)}</div></div>
        </div>`).join('');
    const regularItemsHtml = data.filter(item => !stickyTitles.has(item.title) && !userAddedTitles.has(item.title)).map(item => {
        const compositeKey = `${cardTitle} - ${item.title}`;
        const isViewed = viewedItemIds.has(compositeKey);
        const isNew = newItemsIds.has(item.id);
        const viewedIndicatorHtml = isViewed ? `<div class="indicator viewed-indicator" title="Viewed"><svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg></div>` : '';
        const newClass = isNew ? 'new-item-highlight' : '';
        return `<div id="grid-selector-${item.id}" class="grid-card-selector ${newClass}" data-topic-id="${item.id}" data-category-id="${categoryId}" title="${item.description || item.title}">
                ${viewedIndicatorHtml}
                <div class="icon">${getIconForTheme(categoryId, item.id)}</div>
                <div class="mt-2 overflow-hidden"><div class="text-sm font-normal leading-tight block">${truncateText(item.title, 50)}</div></div>
            </div>`;
    }).join('');
    
    const fullHierarchyPath = JSON.parse(card.dataset.fullHierarchyPath);
    const finalCategory = fullHierarchyPath[fullHierarchyPath.length - 1];
    const fullPrompt = finalCategory.fullPrompt;
    let actionButtonsHtml = '';
    
    if (fullPrompt && data.length > 0) {
        actionButtonsHtml = `<div class="col-span-full text-center mt-4"><button class="generate-more-button btn-secondary" data-container-id="${containerId}" data-category-id="${categoryId}" title="Use AI to generate more topics for this category"><span class="flex items-center justify-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>Add 8 more topics</span></button></div>`;
    }

    container.innerHTML = `<div class="${gridClass}">${stickyHtml}${userAddedHtml}${regularItemsHtml}</div>${addNewTopicHtml}<div class="mt-4">${actionButtonsHtml}</div>`;
}

async function handleAddNewTopic(button) {
    const { categoryId } = button.dataset;
    const inputField = button.previousElementSibling;
    const newTitle = inputField.value.trim();
    if (!newTitle) { inputField.focus(); return; }
    if (!userId) {
        displayMessageInModal("You must be logged in to add your own topics.", 'warning');
        return;
    }
    const appId = firebaseConfig.appId || 'it-admin-hub-global';
    const userTopicsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/userTopics/${categoryId}/topics`);
    button.disabled = true;
    button.innerHTML = 'Adding...';
    try {
        const newTopicData = {
            title: newTitle,
            id: `${sanitizeTitle(newTitle).replace(/\s+/g, '-')}-${Date.now()}`,
            description: `Custom user-added topic: ${newTitle}`,
            createdAt: Timestamp.now()
        };
        await addDoc(userTopicsCollectionRef, newTopicData);
        inputField.value = '';
    } catch (error) {
        console.error("Error adding user topic to Firebase:", error);
        displayMessageInModal(`Could not add topic: ${error.message}`, 'error');
    } finally {
        button.disabled = false;
        button.innerHTML = 'Add Topic';
    }
}

async function handleGenerateMoreClick(button, attempt = 1) {
    const MAX_ATTEMPTS = 2;
    const { containerId, categoryId } = button.dataset;
    const container = document.getElementById(containerId);
    if (!container || !categoryId || !allThemeData[categoryId]) return;

    button.disabled = true;
    button.innerHTML = `<span class="flex items-center justify-center gap-2"><div class="loader themed-loader" style="width:20px; height:20px; border-width: 2px;"></div>Generating (Attempt ${attempt})...</span>`;

    const card = container.closest('.card');
    const fullHierarchyPath = JSON.parse(card.dataset.fullHierarchyPath);
    const finalCategory = fullHierarchyPath[fullHierarchyPath.length - 1];
    
    const basePrompt = finalCategory.fullPrompt;
    if (!basePrompt) {
        handleApiError({ message: "No 'fullPrompt' is configured for this category in the Hierarchy Manager." }, container.closest('.card-content').querySelector('.details-container'));
        button.disabled = false;
        button.innerHTML = 'Error: Prompt not configured';
        return;
    }

    const existingTitles = allThemeData[categoryId].map(item => item.title);
    const topicsToRequest = 8;
    
    const prompt = `
        Based on the following core instruction, generate ${topicsToRequest} new and unique topics.
        ---
        Core Instruction: "${basePrompt}"
        ---
        This is attempt number ${attempt}. Be extra creative and ensure the new topics are genuinely different from the following list of ${existingTitles.length} existing topics. Do NOT repeat any topics from this list.
        Existing Topics:
        - ${existingTitles.join('\n- ')}
        
        For each new topic, provide a "title" and a short one-sentence "description".
        IMPORTANT: Your response MUST be a JSON array of objects, where each object has a "title" and a "description" key.
    `;

    try {
        const jsonText = await callGeminiAPI(prompt, true, `Generate More Topics (Attempt ${attempt})`);
        if (!jsonText) throw new Error("AI did not return any new items.");
        
        const newItems = parseJsonWithCorrections(jsonText);

        if (!Array.isArray(newItems)) {
            console.error("The AI response was not a valid array.", jsonText);
            throw new Error("The AI returned data in an unexpected format. Please try again.");
        }

        const addedItems = [];

        newItems.forEach(newItem => {
            if (newItem.title && !allThemeData[categoryId].some(existing => existing.title.toLowerCase() === newItem.title.toLowerCase())) {
                newItem.id = `${sanitizeTitle(newItem.title).replace(/\s+/g, '-')}-${Date.now()}`;
                addedItems.push(newItem);
            }
        });

        if (addedItems.length === 0 && attempt < MAX_ATTEMPTS) {
            console.warn(`Attempt ${attempt} yielded 0 new topics. Retrying...`);
            await handleGenerateMoreClick(button, attempt + 1);
            return; 
        }

        if (addedItems.length > 0) {
            const newItemIds = new Set();
            addedItems.forEach(item => {
                 allThemeData[categoryId].push(item);
                 newItemIds.add(item.id);
            });
            allThemeData[categoryId].sort((a, b) => a.title.localeCompare(b.title));
            populateCardGridSelector(container, categoryId, newItemIds);
            document.getElementById(`details-${categoryId}`).innerHTML = '';
        } else {
             throw new Error("After multiple attempts, the AI failed to generate unique topics.");
        }
        
    } catch (error) {
        console.error(`Error generating more items for ${categoryId}:`, error);
        button.disabled = false;
        button.innerHTML = 'Error. Try Again.';
        button.classList.add('bg-red-100', 'text-red-700');
        setTimeout(() => {
            button.classList.remove('bg-red-100', 'text-red-700');
            button.innerHTML = `<span class="flex items-center justify-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>Add 8 more topics</span>`;
        }, 3000);
    } 
}

async function handleGridSelect(target) {
    const { topicId, categoryId } = target.dataset;
    let item = allThemeData[categoryId]?.find(d => String(d.id) === String(topicId)) || stickyTopics[categoryId]?.find(d => String(d.id) === String(topicId)) || userAddedTopics[categoryId]?.find(d => String(d.id) === String(topicId));
    if (!item) return;
    const gridContainer = target.closest('.card-grid-container');
    if (gridContainer) {
        const currentlyActive = gridContainer.querySelector('.active');
        if (currentlyActive) currentlyActive.classList.remove('active');
        target.classList.add('active');
    }
    const card = target.closest('.card');
    const fullHierarchyPath = JSON.parse(card.dataset.fullHierarchyPath);
    const cardTitle = fullHierarchyPath[fullHierarchyPath.length - 1].title;
    await markItemAsViewed(cardTitle, item.title);
    if (!target.querySelector('.viewed-indicator') && !target.querySelector('.sticky-indicator') && !target.querySelector('[title="Your Added Topic"]')) {
        const indicator = document.createElement('div');
        indicator.className = 'indicator viewed-indicator';
        indicator.title = 'Viewed';
        indicator.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg></div>`;
        target.prepend(indicator);
    }
    const prompt = `You are creating a summary for an IT administration guide. The overall category is: "${cardTitle}" The category description is: "${item.description || 'General task'}" The specific topic is: "${item.title}" Based on this context, generate a very brief, condensed summary for the guide on "${item.title}". For each section (Objective, Pre-requisites, Key Steps, Verification, Helpful Resources), provide a single descriptive sentence. Return the response as a simple markdown string where each section is a bullet point, starting with '*'.`;
    const resultContainer = document.getElementById(`details-${categoryId}`);
    resultContainer.innerHTML = getLoaderHTML(`Generating summary for ${item.title}...`);
    try {
        let resultText = await callGeminiAPI(prompt, false, "Generate Topic Summary");
        resultText = resultText ? resultText.replace(/^```(markdown)?\n?/g, '').replace(/\n?```$/g, '').trim() : '';
        originalGeneratedText.set(topicId, resultText); 
        const resultHtml = marked.parse(resultText || '');
        resultContainer.innerHTML = `<div class="prose max-w-none">${resultHtml}</div>`;
        
        addPostGenerationButtons(resultContainer, topicId, categoryId);
    } catch (error) {
        handleApiError(error, resultContainer, `guide for ${item.title}`);
    }
}

async function markItemAsViewed(cardTitle, buttonTitle) {
    if (!viewedItemsCollectionRef) return;
    const compositeKey = `${cardTitle} - ${buttonTitle}`;
    try {
        const docRef = doc(viewedItemsCollectionRef, compositeKey);
        await setDoc(docRef, { viewedAt: Timestamp.fromDate(new Date()) });
    } catch (error) {
        console.error("Error marking item as viewed:", error);
    }
}

async function handleGeminiSubmit(e) {
    e.preventDefault();
    const form = e.target;
    
    const coreTask = document.getElementById('core-task-input').value.trim();
    if (!coreTask) {
        displayMessageInModal("Please define the core task before generating.", 'warning');
        return;
    }

    const persona = document.querySelector('#persona-selector .active').dataset.value;
    const tone = document.querySelector('#tone-selector .active').dataset.value;
    const outputFormat = form.querySelector('input[name="output-format"]:checked').value;
    const additionalContext = document.getElementById('additional-context-input').value.trim();

    if (outputFormat === 'guide') {
        generateCustomGuide(coreTask, persona, tone, additionalContext);
    } else if (outputFormat === 'card') {
        generateAndPopulateAITopicCard(coreTask, persona, tone, additionalContext);
    }
    
    form.reset();
    document.querySelectorAll('#persona-selector .prompt-builder-btn').forEach((btn, i) => btn.classList.toggle('active', i === 0));
    document.querySelectorAll('#tone-selector .prompt-builder-btn').forEach((btn, i) => btn.classList.toggle('active', i === 0));
}

async function generateCustomGuide(coreTask, persona, tone, additionalContext) {
    const fullTitle = `Custom Guide: ${coreTask}`;

    const titleEl = document.getElementById('inDepthModalTitle');
    const contentEl = document.getElementById('inDepthModalContent');
    const footerEl = document.getElementById('inDepthModalFooter');
    const buttonContainer = document.getElementById('inDepthModalButtons');

    titleEl.textContent = truncateText(fullTitle, 40);
    contentEl.innerHTML = getLoaderHTML(`Generating initial sections for your custom guide for "${coreTask}"...`);
    buttonContainer.innerHTML = '';
    document.getElementById('modal-status-message').textContent = '';
    footerEl.dataset.fullTitle = fullTitle;
    footerEl.dataset.cardName = "Custom Task";
    openModal('inDepthModal');
    
    const context = {
        coreTask: coreTask,
        persona: persona,
        tone: tone,
        additionalContext: additionalContext,
        fullHierarchyPath: [] // Pass empty array to signify it's a workshop custom guide
    };
    const initialCustomPrompt = getMasterGuidePrompt('blueprint', context);

    try {
        let initialResultText = await callGeminiAPI(initialCustomPrompt, false, "Generate Custom Guide (Initial)");
        initialResultText = initialResultText ? initialResultText.replace(/^```(markdown)?\n?/g, '').replace(/\n?```$/g, '').trim() : '';
        originalGeneratedText.set(fullTitle, initialResultText);
        contentEl.innerHTML = '';
        renderAccordionFromMarkdown(initialResultText, contentEl);
        const dummyHierarchy = [{title: "Custom Topic", description: `A guide for ${coreTask}`}];
        footerEl.dataset.fullHierarchyPath = JSON.stringify(dummyHierarchy);
        addModalActionButtons(buttonContainer, true, !!(oauthToken && oauthToken.access_token));
    } catch(error) {
        handleApiError(error, contentEl, 'custom IT guide (initial sections)');
    }
}


async function generateAndPopulateAITopicCard(coreTask, persona, tone, additionalContext) {
    const cardId = `category-card-${sanitizeTitle(coreTask).replace(/\s+/g, '-')}-${Date.now()}`;
    const card = document.createElement('div');
    card.className = 'card';
    card.id = cardId;
    const selectorId = `selector-${cardId}`;

    const descriptionPrompt = `Persona: You are a helpful AI assistant. Based on the user's request for a topic card about "${coreTask}", write a concise, one-sentence description for this topic card.`;
    
    let description = `A collection of topics related to: ${coreTask}`;
    try {
        description = (await callGeminiAPI(descriptionPrompt, false, "Generate Topic Card Description")).trim();
    } catch (e) {
        console.warn("Could not generate dynamic description, using default.", e);
    }
    
    const hierarchyArray = [
        { title: "Prompt Workshop" },
        { title: coreTask }
    ];
    const fullHierarchyPath = JSON.stringify(hierarchyArray);

    card.dataset.fullHierarchyPath = fullHierarchyPath;
    
    const breadcrumbsHtml = createBreadcrumbsHtml(hierarchyArray);
    card.innerHTML = `<div class="p-8 card-content">${breadcrumbsHtml}<h2 class="text-2xl font-bold mb-2 themed-text-primary">${coreTask}</h2><p class="mb-6 themed-text-muted">${description}</p><div id="${selectorId}" data-category-id="${cardId}" class="w-full">${getLoaderHTML(`AI is generating topics for ${coreTask}...`)}</div><div id="details-${cardId}" class="details-container mt-4"></div></div>`;
    
    const container = document.getElementById('dynamic-card-container');
    container.prepend(card);
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });

    allThemeData[cardId] = null;

    try {
        const topicGenerationPrompt = `
            Persona: You are an expert ${persona}.
            Objective: Generate a list of 8 common sub-topics for the main IT administration task: "${coreTask}".
            
            //-- CONTEXT --//
            - **Audience & Tone:** The topics should be suitable for a "${tone}" audience.
            - **Additional Details:** ${additionalContext || 'None'}

            //-- INSTRUCTIONS --//
            For each of the 8 topics, provide a unique "id" (a short, URL-friendly string), a "title", and a short one-sentence "description".
            Return the response as a valid JSON array of objects.
        `;

        const jsonText = await callGeminiAPI(topicGenerationPrompt, true, "Generate Topic Card");
        if (!jsonText) throw new Error(`API returned empty content for ${coreTask}.`);
        
        const data = parseJsonWithCorrections(jsonText);
        if (!Array.isArray(data)) {
            throw new Error("Invalid API response format: Expected an array of topics.");
        }
        
        data.sort((a, b) => a.title.localeCompare(b.title));
        allThemeData[cardId] = data;
        
        populateCardGridSelector(card.querySelector(`#${selectorId}`), cardId);
        return card;
    } catch (error) {
        allThemeData[cardId] = [];
        handleApiError(error, card.querySelector(`#${selectorId}`), coreTask, card);
        throw error;
    }
}

function parseJsonWithCorrections(jsonString) {
    if (!jsonString || typeof jsonString !== 'string') {
        throw new Error("Invalid input: not a string.");
    }
    let cleanedString = jsonString.replace(/```(json|markdown)?\n?/g, '').replace(/```/g, '').trim();
    try {
        return JSON.parse(cleanedString);
    }
    catch (error) {
        console.warn("Initial JSON.parse failed. Attempting correction for common errors.", error);
        try {
            // Attempt to fix common JSON issues: unquoted keys, trailing commas, etc.
            // This is a very basic attempt and might not catch all cases.
            const correctedJsonString = cleanedString
                .replace(/\\'/g, "'") // Unescape single quotes that might have been escaped
                .replace(/([{\s,])(\w+)(:)/g, '$1"$2"$3') // Quote unquoted keys
                .replace(/,\s*([\]}])/g, '$1'); // Remove trailing commas
            return JSON.parse(correctedJsonString);
        } catch (finalError) {
             console.error("Failed to parse JSON even after cleaning:", finalError);
             console.error("Original string received from API:", jsonString);
            console.error("String after cleaning attempts:", cleanedString);
            throw new Error(`JSON Parse Error: ${finalError.message}. Check console for the problematic string.`);
        }
    }
}

function logAiInteraction(prompt, response, type) {
    aiLog.push({ timestamp: new Date(), type: type, prompt: prompt, response: response });
}

async function callApi(apiUrl, payload, authorization = null) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);
    const headers = { 'Content-Type': 'application/json' };
    if (authorization) {
        headers['Authorization'] = authorization;
    }
    try {
        const response = await fetch(apiUrl, { method: 'POST', headers: headers, body: JSON.stringify(payload), signal: controller.signal });
        clearTimeout(timeoutId);
        if (!response.ok) {
            let errorBody;
            try { errorBody = await response.json(); } catch { errorBody = await response.text(); }
            console.error("API Error Response:", { status: response.status, body: errorBody });
            const errorMsg = errorBody?.error?.message || response.statusText;
            throw new Error(`API request failed with status ${response.status}. Message: ${errorMsg}`);
        }
        return await response.json();
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') throw new Error('The AI service request timed out. Please try again.');
        throw error;
    }
}

async function callGeminiAPI(prompt, isJson = false, logType = "General") {
    if (!geminiApiKey) {
        throw new Error("Gemini API Key is not set. Please enter it in the initial modal.");
    }
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;
    
    let finalPrompt = prompt;
    if (isJson && !prompt.includes(jsonInstruction)) {
        finalPrompt += jsonInstruction;
    }

    const payload = { contents: [{ parts: [{ text: finalPrompt }] }] };
    if (isJson) {
        payload.generationConfig = { responseMimeType: "application/json", maxOutputTokens: 8192 };
    }
    const result = await callApi(apiUrl, payload);
    const responseText = result?.candidates?.[0]?.content?.parts?.[0]?.text || null;
    logAiInteraction(finalPrompt, responseText, logType);
    return responseText;
}

async function callColorGenAPI(prompt) {
    const fullPrompt = `Based on the theme "${prompt}", generate a color palette. I need a JSON object with keys: "bg", "text", "primary", "primaryDark", "accent", "cardBg", "cardBorder", "textMuted", "inputBg", "inputBorder", "buttonText". Determine if the "primary" color is light or dark to set the "buttonText" appropriately (#FFFFFF for dark, #111827 for light).`;
    const jsonText = await callGeminiAPI(fullPrompt, true, "Generate Color Theme");
    if (jsonText) return parseJsonWithCorrections(jsonText);
    throw new Error("Could not parse a valid color theme from API response.");
}

function handleApiError(error, container, contentType = 'content') {
    console.error(`Error generating ${contentType}:`, error);
    const errorMessage = generateErrorMessage(error, contentType);
    if (container) {
        container.innerHTML = `<div class="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">${errorMessage}</div>`;
    }
}

async function generateAndApplyDefaultTheme() {
    showThemeLoading(true);
    const themePrompt = "Modern Data Center";
    try {
        const colors = await callColorGenAPI(themePrompt);
        applyTheme(colors);
    } catch (error) {
        handleApiError(null, null, 'default theme');
        console.error("Failed to generate default theme, continuing with default styles.", error);
    } finally {
        showThemeLoading(false);
    }
}

async function loadDynamicPlaceholders() {
    const promptInput = document.getElementById('core-task-input');
    const prompt = `Generate a JSON array of 3 creative IT administration task ideas for input placeholders. Examples: "Onboard a new employee", "Decommission a legacy server". Return ONLY the valid JSON array of strings, ensuring any double quotes inside the strings are properly escaped (e.g., \\"like this\\").`;
    try {
        const jsonText = await callGeminiAPI(prompt, true, "Load Placeholders");
        if(!jsonText) return;
        const placeholders = parseJsonWithCorrections(jsonText);
        if (placeholders && placeholders.length > 0) {
            let i = 0;
            promptInput.placeholder = `e.g., '${placeholders[i]}'`;
            setInterval(() => {
                i = (i + 1) % placeholders.length;
                promptInput.placeholder = `e.g., '${placeholders[i]}'`;
            }, 3000);
        }
    } catch(error) {
        console.error("Could not load dynamic placeholders", error);
    }
}

function applyTheme(colors) {
    Object.entries(colors).forEach(([key, value]) => {
        const cssVar = `--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
        root.style.setProperty(cssVar, value);
    });
}

function applyHeaderImage(imageUrl) {
    if (!imageUrl) return;
    document.getElementById('header-bg-image').style.backgroundImage = `url('${imageUrl}')`;
}

function showThemeLoading(isLoading) {
    document.getElementById('header-loader').classList.toggle('hidden', !isLoading);
    document.getElementById('header-loader').classList.toggle('flex', isLoading);
}

function getAppPrompts() {
    const prompts = {};
    const blueprintContext = {
        coreTask: '{core_task}',
        persona: '{persona}', // from workshop
        tone: '{tone}', // from workshop
        additionalContext: '{additional_context}', // from workshop
        fullHierarchyPath: [{ title: 'Example Main Category' }, { title: 'Example Final Topic', initialPrompt: 'Persona: an example persona.' }]
    };
    const fullGuideContext = {
        blueprintMarkdown: '{blueprint_markdown}',
        coreTask: '{core_task}',
        fullHierarchyPath: [{ title: 'Example Main Category' }, { title: 'Example Final Topic', initialPrompt: 'Persona: an example persona.' }]
    };
    prompts["Blueprint Generation Prompt"] = getMasterGuidePrompt('blueprint', blueprintContext);
    prompts["Full Guide Generation Prompt"] = getMasterGuidePrompt('fullGuide', fullGuideContext);
    prompts["Refinement Prompt"] = getRefinementPrompt();
    return prompts;
}

/**
 * Creates a curated list of key prompt engineering functions and their source code for display.
 * @returns {object} An object where keys are function names and values are their source code as a string.
 */
function getAppFunctionsForDisplay() {
    const functions = {
        'getMasterGuidePrompt': `
function getMasterGuidePrompt(type, context) {
    const {
        blueprintMarkdown = '',
        coreTask = '',
        persona = '',
        tone = '',
        additionalContext = '',
        fullHierarchyPath = []
    } = context;

    let personaAndObjective;
    let fullSubject = coreTask;

    if (fullHierarchyPath && Array.isArray(fullHierarchyPath) && fullHierarchyPath.length > 0) {
        const pathString = fullHierarchyPath.map(p => p.title || p).join(' -> ');
        const finalCategory = fullHierarchyPath[fullHierarchyPath.length - 1];
        if (fullHierarchyPath.length > 1) {
            fullSubject = \`\${coreTask} for \${fullHierarchyPath[0].title}\`;
        }
        
        let personaDescription = "an expert IT Administrator";
        if (finalCategory && finalCategory.initialPrompt) {
            const match = finalCategory.initialPrompt.match(/Persona:(.*?)(Objective:|Instructions:|$)/is);
            if (match && match[1]) {
                personaDescription = match[1].trim();
            }
        }
        personaAndObjective = \`
//-- PERSONA & CONTEXT (Derived from Hierarchy) --//
Persona: You are \${personaDescription}.
Your writing should be professional, technical, and authoritative.
The guide is part of a knowledge base: \${pathString}.\`;
    } else {
        personaAndObjective = \`
//-- PERSONA & OBJECTIVE (FROM WORKSHOP) --//
Persona: You are an expert \${persona}.
Audience & Tone: The guide is for a "\${tone}" audience.
Additional Context: \${additionalContext || 'None'}\`;
    }

    if (type === 'blueprint') {
        return \`
        //-- MASTER INSTRUCTION: GENERATE GUIDE BLUEPRINT --//
        Generate ONLY the "Introduction", "Architectural Overview", "Key Concepts & Terminology", and "Prerequisites" sections for an IT guide.
        //-- PRIMARY SUBJECT (MANDATORY) --//
        The Primary Subject is exclusively: "\${fullSubject}". You MUST NOT deviate from this.
        \${personaAndObjective}
        //-- REQUIRED OUTPUT --//
        1.  **Generate Four Sections:**
            * ### 1. Introduction: Introduce the guide's purpose, focusing only on "\${fullSubject}". State the guide's scope (e.g., GUI, PowerShell, API).
            * ### 2. Architectural Overview: Describe the architecture relevant to "\${fullSubject}".
            * ### 3. Key Concepts & Terminology: Define terms essential for "\${fullSubject}".
            * ### 4. Prerequisites: List skills and access required for "\${fullSubject}".
        2.  **Format:** Use '###' for headers. Return ONLY markdown for these four sections.\`;
    }

    if (type === 'fullGuide') {
        return \`
        //-- MASTER INSTRUCTION: COMPLETE THE GUIDE --//
        You have ALREADY CREATED the foundational blueprint (sections 1-4). Your mission is to generate ONLY the remaining detailed sections (5 through 12) with expert-level detail.
        
        //-- CONTEXT: THE GUIDE BLUEPRINT (SECTIONS 1-4) --//
        \${blueprintMarkdown}
        \${personaAndObjective}
        
        //-- CRITICAL QUALITY CONTROL (MANDATORY) --//
        - **Brand Accuracy:** The primary subject is "HPE Active Health System (AHS)". You MUST NOT use incorrect brand names like "Altiris".
        - **Actionable Content:** All instructions must be practical and clear for a technical audience.

        //-- REQUIRED OUTPUT: GENERATE SECTIONS 5-12 WITH ENHANCED SPECIFICITY --//
        
        ### 5. Detailed Implementation Guide
        **CRITICAL:** This section must be highly practical.
        - Provide exact click-paths and UI element names (e.g., "Navigate to Storage > Controllers > Array A").
        
        ### 6. Verification and Validation
        **CRITICAL:** Provide concrete, objective success criteria. Do not use abstract descriptions.
        - Give specific commands (e.g., \\\`ping <server>\\\`) or GUI steps (e.g., "Check the status light; it should be solid green.").
        - Any command provided **must** use modern, non-obsolete, and non-aliased cmdlets (e.g., use \\\`Get-Service\\\` not \\\`gsv\\\`). Prefer native cmdlets over those requiring third-party modules.
        - Describe the exact expected output or visual confirmation of success.
        
        ### 7. Best Practices
        - List 3-5 actionable best practices directly related to the topic.
        
        ### 8. Automation Techniques
        - [AUTOMATION_RESOURCES_PLACEHOLDER]
        
        ### 9. Security Considerations
        - [SECURITY_CONSIDERATIONS_PLACEHOLDER]
        
        ### 10. Advanced Use Cases & Scenarios
        - Describe at least two advanced scenarios where this knowledge could be applied.
        
        ### 11. Troubleshooting
        - **CRITICAL:** List three advanced troubleshooting scenarios for an L3 engineer. Focus on issues where initial diagnostics are inconclusive or where there is a complex interaction between components. For each, describe the subtle symptoms and the logical process for isolating the true root cause.
        
        ### 12. Helpful Resources
        - Provide a list of 3-4 placeholder links to high-quality, relevant resources. This section will be replaced by a live web search.
        
        Your response must contain ONLY the markdown for sections 5 through 12. Start directly with "### 5. Detailed Implementation Guide".\`;
    }
    return '';
}`,
        'getRefinementPrompt': `
function getRefinementPrompt(originalText = '{original_text}', refinementRequest = '{refinement_request}') {
    return \`Persona: You are a Master Technical Editor and Content Strategist AI. You specialize in interpreting revision requests and surgically modifying existing technical content to meet new new requirements while upholding the highest standards of quality. Core Mandate: Your task is to analyze the ORIGINAL TEXT and the USER'S REVISION DIRECTIVE provided below. You must then rewrite the original text to flawlessly execute the user's directive, producing a new, complete, and professionally polished version of the text. //-- INPUT 1: ORIGINAL TEXT --// \${originalText} //-- INPUT 2: USER'S REVISION DIRECTIVE --// \${refinementRequest} //-- GUIDING PRINCIPLES FOR REVISION --// - **Interpret Intent:** Understand the objective behind the directive. If the user asks to "make it simpler," you must simplify terminology, rephrase complex sentences, and perhaps add analogies. - **Seamless Integration:** The new content must flow naturally. The final output should feel like a single, cohesive piece. - **Maintain Structural Integrity:** Preserve the original markdown formatting unless the directive requires a structural change. - **Uphold Technical Accuracy:** Ensure any changes or additions are technically accurate and align with modern best practices. Final Output Instruction: Return ONLY the new, complete, and rewritten markdown text. Do not provide a preamble, an explanation of your changes, or any text other than the final, revised content itself.\`;
}`,
        'callGeminiAPI': `
async function callGeminiAPI(prompt, isJson = false, logType = "General") {
    if (!geminiApiKey) {
        throw new Error("Gemini API Key is not set. Please enter it in the initial modal.");
    }
    const apiUrl = \`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=\${geminiApiKey}\`;
    
    let finalPrompt = prompt;
    if (isJson && !prompt.includes(jsonInstruction)) {
        finalPrompt += jsonInstruction;
    }

    const payload = { contents: [{ parts: [{ text: finalPrompt }] }] };
    if (isJson) {
        payload.generationConfig = { responseMimeType: "application/json", maxOutputTokens: 8192 };
    }
    const result = await callApi(apiUrl, payload);
    const responseText = result?.candidates?.[0]?.content?.parts?.[0]?.text || null;
    logAiInteraction(finalPrompt, responseText, logType);
    return responseText;
}`
    };
    return functions;
}

/**
 * Displays both AI prompts and the source code of key prompt engineering functions in a modal.
 */
function displayAppInternalsModal() {
    const contentEl = document.getElementById('promptsModalContent');
    contentEl.innerHTML = ''; // Clear previous content

    // Section for AI Prompts
    const promptsContainer = document.createElement('div');
    promptsContainer.innerHTML = '<h2 class="text-2xl font-bold themed-text-primary mb-4 border-b pb-2">Key AI Prompts</h2>';
    const prompts = getAppPrompts();
    for (const [title, promptText] of Object.entries(prompts)) {
        const promptEl = document.createElement('div');
        promptEl.className = 'mb-6';
        promptEl.innerHTML = `
            <h3 class="text-lg font-semibold themed-text-accent mb-2">${title}</h3>
            <div class="code-block-container !mt-0">
                <div class="code-block-header"><span>Prompt</span><button class="copy-code-button">Copy</button></div>
                <pre class="text-sm" style="color: var(--code-text);">${promptText}</pre>
            </div>`;
        promptsContainer.appendChild(promptEl);
    }
    contentEl.appendChild(promptsContainer);

    // Section for Prompt Engineering Functions
    const functionsContainer = document.createElement('div');
    functionsContainer.innerHTML = '<h2 class="text-2xl font-bold themed-text-primary mt-8 mb-4 border-b pb-2">Prompt Engineering Functions</h2>';
    const functions = getAppFunctionsForDisplay();
    for (const [name, code] of Object.entries(functions)) {
        const functionEl = document.createElement('div');
        functionEl.className = 'mb-6';
        functionEl.innerHTML = `
            <h3 class="text-lg font-semibold themed-text-accent mb-2">${name}</h3>
            <div class="code-block-container !mt-0">
                <div class="code-block-header"><span>JavaScript</span><button class="copy-code-button">Copy</button></div>
                <pre><code class="language-javascript text-sm" style="color: var(--code-text);">${code.trim()}</code></pre>
            </div>`;
        functionsContainer.appendChild(functionEl);
    }
    contentEl.appendChild(functionsContainer);

    openModal('promptsModal');
}

function getRefinementPrompt(originalText = '{original_text}', refinementRequest = '{refinement_request}') {
    return `Persona: You are a Master Technical Editor and Content Strategist AI. You specialize in interpreting revision requests and surgically modifying existing technical content to meet new new
