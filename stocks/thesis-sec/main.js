import { setupEventListeners } from './ui.js';
import { openModal, closeModal, displayMessageInModal } from './ui-modals.js';
import { fetchAndCachePortfolioData } from './ui-render.js';
import { handleSectorMomentumRequest } from './ui-handlers.js';
import { CONSTANTS, APP_VERSION, state } from './config.js';

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
    if (state.appIsInitialized) return;
    state.appIsInitialized = true;
    
    document.getElementById('dashboard-section').classList.remove(CONSTANTS.CLASS_HIDDEN);
    document.getElementById('stock-screener-section').classList.remove(CONSTANTS.CLASS_HIDDEN);
    
    await fetchAndCachePortfolioData();
    await handleSectorMomentumRequest();
}

async function initializeFirebase() {
    if (!state.firebaseConfig) return;
    try {
        const app = firebase.initializeApp(state.firebaseConfig);
        state.db = firebase.firestore();
        state.auth = firebase.auth();

        state.auth.onAuthStateChanged(user => {
            if (user) {
                state.userId = user.uid;
                if (!state.appIsInitialized) {
                    initializeAppContent();
                }
            } else {
                state.userId = null;
                if (state.appIsInitialized) {
                    displayMessageInModal("Your session has expired. Please log in again to continue.", "warning");
                }
                state.appIsInitialized = false;
            }
            setupAuthUI(user);
        });
        
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await state.auth.signInWithCustomToken(__initial_auth_token);
        }

    } catch (error) {
        console.error("Firebase initialization error:", error);
        displayMessageInModal(`Firebase Error: ${error.message}. Please check your config object.`, 'error');
    }
}

async function handleApiKeySubmit(e) {
    e.preventDefault();
    state.fmpApiKey = document.getElementById('fmpApiKeyInput').value.trim();
    state.geminiApiKey = document.getElementById(CONSTANTS.INPUT_GEMINI_KEY).value.trim();
    state.googleClientId = document.getElementById(CONSTANTS.INPUT_GOOGLE_CLIENT_ID).value.trim();
    const tempFirebaseConfigText = document.getElementById('firebaseConfigInput').value.trim();
    let tempFirebaseConfig;

    if (!state.fmpApiKey || !state.geminiApiKey || !state.googleClientId || !tempFirebaseConfigText) {
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
    
    state.firebaseConfig = tempFirebaseConfig;
    
    initializeFirebase();
    initializeGoogleSignIn();
    closeModal(CONSTANTS.MODAL_API_KEY);
}

// --- AUTHENTICATION & GAPI INITIALIZATION ---
function initializeGoogleSignIn() {
    if (!state.googleClientId) return;
    try {
        google.accounts.id.initialize({
            client_id: state.googleClientId,
            callback: handleCredentialResponse,
        });
        
        // After successful initialization, check if we need to render the button
        const authStatusEl = document.getElementById('auth-status');
        if (authStatusEl && (!state.auth || !state.auth.currentUser || state.auth.currentUser.isAnonymous)) {
             google.accounts.id.renderButton(
                authStatusEl,
                { theme: "outline", size: "large", type: "standard", text: "signin_with" }
            );
        }

    } catch (error) {
        console.error("Google Sign-In initialization error:", error);
        displayMessageInModal("Could not initialize Google Sign-In. Check your Client ID and ensure you are loading the page from a valid origin.", "error");
    }
}

async function handleCredentialResponse(response) {
    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById('loading-message').textContent = "Verifying login...";
    try {
        const credential = firebase.auth.GoogleAuthProvider.credential(response.credential);
        await state.auth.signInWithCredential(credential);
    } catch (error) {
        console.error("Firebase sign-in with Google credential failed:", error);
        displayMessageInModal(`Login failed: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

function handleLogout() {
    if (state.auth) {
        state.auth.signOut().catch(error => console.error("Sign out failed:", error));
    }
    if (typeof google !== 'undefined' && google.accounts) {
        google.accounts.id.disableAutoSelect();
    }
}

function setupAuthUI(user) {
    const authStatusEl = document.getElementById('auth-status');
    const appContainer = document.getElementById('app-container');
    if (!authStatusEl || !appContainer) return;

    if (user && !user.isAnonymous) {
        authStatusEl.innerHTML = ''; // MOVED this line here
        appContainer.classList.remove(CONSTANTS.CLASS_HIDDEN);
        closeModal(CONSTANTS.MODAL_API_KEY);
        
        const photoURL = user.photoURL || '';
        const displayName = user.displayName || 'User';
        
        const photoEl = photoURL 
            ? `<img src="${photoURL}" alt="User photo" class="w-8 h-8 rounded-full">`
            : `<div class="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-bold">${displayName.charAt(0)}</div>`;
        
        authStatusEl.innerHTML = `
            <div class="bg-white/20 backdrop-blur-sm rounded-full p-1 flex items-center gap-2 text-white text-sm">
                ${photoEl}
                <span class="font-medium pr-2">${displayName}</span>
                <button id="logout-button" class="bg-white/20 hover:bg-white/40 text-white font-semibold py-1 px-3 rounded-full" title="Sign Out">Logout</button>
            </div>`;
        document.getElementById('logout-button').addEventListener('click', handleLogout);
    } else {
        appContainer.classList.add(CONSTANTS.CLASS_HIDDEN);
        // Button rendering logic is now handled in initializeGoogleSignIn
        // And we no longer clear the authStatusEl here, allowing the button to persist
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
