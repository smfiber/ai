import { setupEventListeners } from './ui.js';

// --- Global State ---
let db;
let auth;
let userId;
let firebaseConfig = null;
let appIsInitialized = false;
let fmpApiKey = "";
let geminiApiKey = "";
let searchApiKey = "";
let searchEngineId = "";
let googleClientId = "";
let driveTokenClient = null;
let driveFolderId = null; // Cache for Drive folder
let portfolioCache = [];
let calendarEvents = { earnings: [], ipos: [] };
let calendarCurrentDate = new Date();
let availableIndustries = [];

// --- CONFIG & INITIALIZATION ---

function safeParseConfig(str) {
    try {
        const startIndex = str.indexOf('{');
        if (startIndex === -1) throw new Error("Could not find a '{' in the config string.");
        const objectStr = str.substring(startIndex);
        return JSON.parse(objectStr);
    } catch (error) {
        console.error("Failed to parse config string:", error);
        throw new Error("The provided Firebase config is not valid. Please paste the complete, valid JSON object from the Firebase console.");
    }
}

async function initializeAppContent() {
    if (appIsInitialized) return;
    appIsInitialized = true;
    
    document.getElementById('dashboard-section').classList.remove(CONSTANTS.CLASS_HIDDEN);
    document.getElementById('stock-screener-section').classList.remove(CONSTANTS.CLASS_HIDDEN);
    document.getElementById('sector-screener-section').classList.remove(CONSTANTS.CLASS_HIDDEN);
    document.getElementById('industry-screener-section').classList.remove(CONSTANTS.CLASS_HIDDEN);
    document.getElementById('market-calendar-accordion').classList.remove(CONSTANTS.CLASS_HIDDEN);
    
    await fetchAndCachePortfolioData();
    displayMarketCalendar();
    renderSectorButtons();
    displayIndustryScreener();
}

async function initializeFirebase() {
    if (!firebaseConfig) return;
    try {
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);

        onAuthStateChanged(auth, user => {
            if (user) {
                userId = user.uid;
                if (!appIsInitialized) {
                    initializeAppContent();
                }
            } else {
                userId = null;
                if (appIsInitialized) {
                    displayMessageInModal("Your session has expired. Please log in again to continue.", "warning");
                }
                appIsInitialized = false;
                document.getElementById(CONSTANTS.CONTAINER_DYNAMIC_CONTENT).innerHTML = '';
            }
            setupAuthUI(user);
        });
        
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
        }

    } catch (error) {
        console.error("Firebase initialization error:", error);
        displayMessageInModal(`Firebase Error: ${error.message}. Please check your config object.`, 'error');
    }
}

async function handleApiKeySubmit(e) {
    e.preventDefault();
    fmpApiKey = document.getElementById('fmpApiKeyInput').value.trim();
    geminiApiKey = document.getElementById(CONSTANTS.INPUT_GEMINI_KEY).value.trim();
    googleClientId = document.getElementById(CONSTANTS.INPUT_GOOGLE_CLIENT_ID).value.trim();
    searchApiKey = document.getElementById(CONSTANTS.INPUT_WEB_SEARCH_KEY).value.trim();
    searchEngineId = document.getElementById(CONSTANTS.INPUT_SEARCH_ENGINE_ID).value.trim();
    const tempFirebaseConfigText = document.getElementById('firebaseConfigInput').value.trim();
    let tempFirebaseConfig;

    if (!fmpApiKey || !geminiApiKey || !googleClientId || !searchApiKey || !searchEngineId || !tempFirebaseConfigText) {
        displayMessageInModal("All API Keys, Client ID, and the Firebase Config are required.", "warning");
        return;
    }
    
    try {
        tempFirebaseConfig = safeParseConfig(tempFirebaseConfigText);
        if (!tempFirebaseConfig.apiKey || !tempFirebaseConfig.projectId) {
            throw new Error("The parsed Firebase config is invalid or missing required properties.");
        }
    } catch (err) {
        displayMessageInModal(`Invalid Firebase Config: ${err.message}`, "error");
        return;
    }
    
    firebaseConfig = tempFirebaseConfig;
    
    initializeFirebase();
    initializeGoogleSignIn();
    closeModal(CONSTANTS.MODAL_API_KEY);
}

// --- AUTHENTICATION & GAPI INITIALIZATION ---

function initializeGoogleSignIn() {
    if (!googleClientId) return;
    try {
        google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleCredentialResponse,
        });
    } catch (error) {
        console.error("Google Sign-In initialization error:", error);
        displayMessageInModal("Could not initialize Google Sign-In. Check your Client ID and ensure you are loading the page from a valid origin.", "error");
    }
}

async function handleCredentialResponse(response) {
    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = "Verifying login...";
    try {
        const credential = GoogleAuthProvider.credential(response.credential);
        await signInWithCredential(auth, credential);
    } catch (error) {
        console.error("Firebase sign-in with Google credential failed:", error);
        displayMessageInModal(`Login failed: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

function initializeDriveTokenClient() {
    if (!googleClientId) return;
    try {
        driveTokenClient = google.accounts.oauth2.initTokenClient({
            client_id: googleClientId,
            scope: 'https://www.googleapis.com/auth/drive.file',
            callback: '', // Callback is handled by the promise in getDriveToken
        });
    } catch (error) {
        console.error("Drive token client initialization failed:", error);
    }
}

function handleLogout() {
    if (auth) {
        signOut(auth).catch(error => console.error("Sign out failed:", error));
    }
    if (typeof google !== 'undefined' && google.accounts) {
        google.accounts.id.disableAutoSelect();
    }
}

function setupAuthUI(user) {
    const authStatusEl = document.getElementById('auth-status');
    const appContainer = document.getElementById('app-container');
    if (!authStatusEl || !appContainer) return;

    authStatusEl.innerHTML = ''; // Clear previous state

    if (user && !user.isAnonymous) {
        appContainer.classList.remove(CONSTANTS.CLASS_HIDDEN);
        closeModal(CONSTANTS.MODAL_API_KEY);
        const photoEl = isValidHttpUrl(user.photoURL) 
            ? `<img src="${sanitizeText(user.photoURL)}" alt="User photo" class="w-8 h-8 rounded-full">`
            : `<div class="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-bold">${sanitizeText(user.displayName.charAt(0))}</div>`;
        
        authStatusEl.innerHTML = `
            <div class="bg-white/20 backdrop-blur-sm rounded-full p-1 flex items-center gap-2 text-white text-sm">
                ${photoEl}
                <span class="font-medium pr-2">${sanitizeText(user.displayName)}</span>
                <button id="logout-button" class="bg-white/20 hover:bg-white/40 text-white font-semibold py-1 px-3 rounded-full" title="Sign Out">Logout</button>
            </div>`;
        document.getElementById('logout-button').addEventListener('click', handleLogout);
        initializeDriveTokenClient();
    } else {
        appContainer.classList.add(CONSTANTS.CLASS_HIDDEN);
        if (typeof google !== 'undefined' && google.accounts) {
            google.accounts.id.renderButton(
                authStatusEl,
                { theme: "outline", size: "large", type: "standard", text: "signin_with" }
            );
        }
    }
}

// --- APP INITIALIZATION TRIGGER ---

function initializeApplication() {
    setupEventListeners();
    document.getElementById(CONSTANTS.FORM_API_KEY)?.addEventListener('submit', handleApiKeySubmit);
    const versionDisplay = document.getElementById('app-version-display');
    if(versionDisplay) versionDisplay.textContent = `v${APP_VERSION}`;
    openModal(CONSTANTS.MODAL_API_KEY);
}

document.addEventListener('DOMContentLoaded', initializeApplication);
