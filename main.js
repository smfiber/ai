import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, onSnapshot, Timestamp, doc, setDoc, deleteDoc, updateDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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

// --- Google API State ---
let gapiInited = false;
let gisInited = false;
let tokenClient;
let GOOGLE_CLIENT_ID = '';
const G_SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/cloud-platform';
let driveFolderId = null;

// --- Prompt Engineering Constants ---
const jsonInstruction = ` IMPORTANT: Ensure your response is ONLY a valid JSON object. All strings must be enclosed in double quotes. Any double quotes or backslashes within a string value must be properly escaped (e.g., "This is a \\"sample\\" description." or "C:\\\\Users\\\\Admin"). Do not wrap the JSON in markdown code fences.`;

const finalReviewPrompt = `
Persona: You are a Lead Technical Editor and a Senior IT Systems Architect.
Your role is final quality assurance.
Objective: Your mission is to audit the DRAFT CONTENT provided below against its ORIGINAL BLUEPRINT. You will then rewrite and enhance the draft to produce final, publishable-grade technical documentation. You must directly implement all corrections and improvements into the text.
//-- INPUT 1: ORIGINAL GUIDE BLUEPRINT (SECTIONS 1-4) --//
{blueprint_from_step_1}
//-- INPUT 2: DRAFT CONTENT TO REVIEW (SECTIONS 5-12) --//
{draft_content_to_review}
//-- SYSTEMATIC REVIEW PROTOCOL --//
(AI: Execute the following review protocol on the DRAFT CONTENT. Your output will be the rewritten content itself, not a list of your actions.)
1.  **Blueprint Adherence Audit:**
    * Scrutinize the draft against the ORIGINAL BLUEPRINT.
    * **Crucially, remove any information or sections that violate the established OUT-OF-SCOPE rules (e.g., if the blueprint scopes the guide to GUI only, remove all PowerShell/API sections).
    * Ensure all IN-SCOPE topics are present and are the primary focus.
    * Verify the content's depth and tone are appropriate for the defined TARGET_AUDIENCE.
2.  **Technical Accuracy Validation:**
    * Scrutinize every technical statement.
    * **Treat any placeholder (e.g., "api.example.com") or hypothetical information as a critical error to be corrected with factual data.**
    * Verify and correct all PowerShell/CLI cmdlets, parameters, and object properties.
    * Validate API endpoints, request bodies, and expected response codes against public documentation.
    * Fact-check procedural steps against current product interfaces and documentation patterns.
3.  **Clarity and Professionalism Polish:**
    * Rephrase awkward or ambiguous sentences to be direct and clear.
    * **Eliminate all meta-commentary, asides, and notes from the AI (e.g., "Pro Tip:", "Note:", "This is a hypothetical example"). Integrate advice naturally into the narrative.**
    * Enforce consistent terminology.
    * Ensure all formatting is clean and consistent, preserving the '###' header structure.
**Final Output Instruction:**
Return ONLY the complete, final, rewritten markdown for the sections you were asked to review. Do not provide a preamble, a list of your changes, or any text other than the final, revised document. Your response must begin directly with the first header of the content you are reviewing (e.g., ### 5. Key Concepts - In-Depth Application & Management).`;

// --- App Initialization ---
function initializeApplication() {
    setupEventListeners();
    populateTypographySettings();
    marked.setOptions({
        renderer: new marked.Renderer(),
        highlight: (code, lang) => code,
        langPrefix: 'language-',
        gfm: true,
        breaks: true,
    });

    if (loadConfigFromStorage()) {
        initializeFirebase();
        initializeGoogleClients();
    } else {
        openModal('apiKeyModal');
    }
}

document.addEventListener('DOMContentLoaded', initializeApplication);

function loadConfigFromStorage() {
    geminiApiKey = localStorage.getItem('geminiApiKey');
    const firebaseConfigString = localStorage.getItem('firebaseConfig');
    GOOGLE_CLIENT_ID = localStorage.getItem('googleClientId');

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
        if (GOOGLE_CLIENT_ID) {
            document.getElementById('googleClientIdInput').value = GOOGLE_CLIENT_ID;
        }
        return true;
    }
    return false;
}

/**
 * Gatekeeper function to prevent race conditions.
 * Checks if all required services (Firebase Auth, Google GAPI Client) are ready
 * before launching the main app content.
 */
function checkAndLaunchApp() {
    const googleToken = gapi?.client?.getToken();
    const hasGoogleToken = googleToken && googleToken.access_token;

    if (appIsInitialized || !auth.currentUser || !hasGoogleToken) {
        return; // Exit if app is already running, user isn't logged in, or Google token is missing.
    }

    initializeAppContent(); // Launch app
}

/**
 * Initializes the main application content once all auth checks have passed.
 * This function is now only called by the `checkAndLaunchApp` gatekeeper.
 */
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

// --- Authentication and Authorization ---

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
            } else {
                userId = null;
                viewedItemsCollectionRef = null;
            }
            setupAuthUI(user);
            checkAndLaunchApp(); // Attempt to launch the app after Firebase auth state is known.
        });
    } catch (error) {
        console.error("Firebase initialization error:", error);
        openModal('apiKeyModal');
        document.getElementById('api-key-error').textContent = `Firebase Error: ${error.message}. Please check your config object.`;
    }
}

function initializeGoogleClients() {
    if (!GOOGLE_CLIENT_ID) {
        console.warn("Google Client ID is not provided. Cloud features will be disabled.");
        return;
    }
    document.getElementById('cloud-storage-card').classList.remove('hidden');
    document.getElementById('google-drive-section').classList.remove('hidden');

    // Load GAPI (for Drive Picker)
    gapi.load('client:picker', () => {
        gapiInited = true;
        initializeGapiClient();
    });

    // Load GIS (for Auth)
    google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: () => {},
    });
    gisInited = true;
}

async function initializeGapiClient() {
    try {
        await gapi.client.init({
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        });
        gapiInited = true;
        initializeTokenClient();
    } catch(error) {
        console.error("Error initializing GAPI Client", error);
        document.getElementById('drive-status').textContent = 'Google API init failed. Check keys.';
    }
}

function initializeTokenClient() {
    if (!gisInited || !GOOGLE_CLIENT_ID) return;
    try {
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: G_SCOPES,
            callback: (tokenResponse) => {
                if (tokenResponse && tokenResponse.access_token) {
                    gapi.client.setToken(tokenResponse);
                    updateSigninStatus(true);
                } else {
                    console.error('User denied access or token response was invalid.', tokenResponse);
                    updateSigninStatus(false);
                }
            },
            popup_closed_callback: () => {
                const statusEl = document.getElementById('drive-status');
                if (statusEl.textContent.includes('Connecting')) {
                    statusEl.textContent = 'Connection cancelled.';
                    setTimeout(() => updateSigninStatus(false), 2000);
                }
            }
        });
        tokenClient.requestAccessToken({prompt: 'none'}); // Check for existing session
    } catch(err) {
         console.error("Failed to initialize Google token client:", err);
    }
}

/**
 * Updates the UI based on Google Sign-In status and calls the gatekeeper.
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
        statusEl.textContent = 'Connect to load/save guides and enable AI image generation.';
        driveFolderId = null;
    }

    // Refresh modal buttons that depend on auth state
    if (document.body.classList.contains('inDepthModal-open')) {
        const isInitial = !!document.getElementById('generate-detailed-steps-btn');
        addModalActionButtons(document.getElementById('inDepthModalButtons'), isInitial);
    }
    if (document.body.classList.contains('inDepthDetailedModal-open')) {
        addDetailedModalActionButtons(document.getElementById('inDepthDetailedModalButtons'));
    }
    if (document.body.classList.contains('searchGeminiModal-open')) {
        addSearchModalActionButtons(document.getElementById('searchGeminiModalButtons'));
    }

    checkAndLaunchApp(); // Attempt to launch the app after Google auth state is known.
}

/**
 * Updates the UI based on Firebase auth state.
 * Does NOT call initializeAppContent directly.
 */
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
    const driveToken = gapi?.client?.getToken();
    if (driveToken) {
        google.accounts.oauth2.revoke(driveToken.access_token, () => {
             console.log('Google Drive token revoked.');
        });
    }
    signOut(auth).then(() => {
        updateSigninStatus(false);
        localStorage.clear();
        location.reload();
    }).catch(error => {
        console.error("Sign out failed:", error);
    });
}

// ... the rest of the JavaScript functions from your main.js file would go here ...
// (This includes setupEventListeners, API call functions, modal handlers, etc.)
// I am omitting them for brevity, but you should paste the entire content of your
// corrected main.js file here.

// NOTE: Ensure all functions from the previous main.js file are included below this line.
// For example:
async function generateAndApplyDefaultTheme() {
    showThemeLoading(true);
    const themePrompt = "Modern Data Center";
    const imagePrompt = `Artistic, abstract background image inspired by "${themePrompt}". Suitable for an IT administration website. Professional, clean. Wide aspect ratio, photographic, cinematic lighting.`;
    try {
        const colors = await callColorGenAPI(themePrompt);
        applyTheme(colors);

        const googleToken = gapi?.client?.getToken();
        if (googleToken && googleToken.access_token) {
            const imageUrl = await callImageGenAPI(imagePrompt);
            applyHeaderImage(imageUrl);
        } else {
            console.warn("Skipping default header image generation: Google auth token not yet available.");
        }
    } catch (error) {
        handleApiError(null, null, 'default theme');
        console.error("Failed to generate default theme, continuing with default styles.", error);
    } finally {
        showThemeLoading(false);
    }
}
// (and so on for all other functions)
