import { setupEventListeners } from './ui.js';
import { openModal, closeModal, displayMessageInModal } from './ui-modals.js';
import { fetchAndCachePortfolioData, fetchAndRenderRecentFilings } from './ui-render.js';
import { CONSTANTS, APP_VERSION, state } from './config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithCredential, signOut, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { checkForNewFilings } from './monitoring.js';

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
    
    const lastCheckTimestamp = localStorage.getItem('lastFilingCheck');
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const now = new Date().getTime();

    // This background check is still useful for other parts of the app
    if (!lastCheckTimestamp || (now - parseInt(lastCheckTimestamp) > twentyFourHours)) {
        await checkForNewFilings();
        localStorage.setItem('lastFilingCheck', now.toString());
    } else {
        await fetchAndCachePortfolioData();
    }
    
    // --- NEW: Call the function to populate our new dashboard ---
    await fetchAndRenderRecentFilings();
}

async function initializeFirebase() {
    if (!state.firebaseConfig) return;
    try {
        const app = initializeApp(state.firebaseConfig);
        state.db = getFirestore(app);
        state.auth = getAuth(app);

        onAuthStateChanged(state.auth, user => {
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
                // Clear any dynamic content if logged out
                document.getElementById('recent-filings-container').innerHTML = '';
                document.getElementById('filings-by-company-container').innerHTML = '';
                document.getElementById('upcoming-filings-container').innerHTML = '';
            }
            setupAuthUI(user);
        });
        
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(state.auth, __initial_auth_token);
        }

    } catch (error) {
        console.error("Firebase initialization error:", error);
        displayMessageInModal(`Firebase Error: ${error.message}. Please check your config object.`, 'error');
    }
}

async function handleApiKeySubmit(e) {
    e.preventDefault();
    const fmpApiKey = document.getElementById('fmpApiKeyInput').value.trim();
    const geminiApiKey = document.getElementById('geminiApiKeyInput')?.value.trim(); // Optional for this SPA
    const googleClientId = document.getElementById('googleClientIdInput').value.trim();
    const secApiKey = document.getElementById('secApiKeyInput').value.trim();
    const tempFirebaseConfigText = document.getElementById('firebaseConfigInput').value.trim();
    let tempFirebaseConfig;

    if (!fmpApiKey || !googleClientId || !secApiKey || !tempFirebaseConfigText) {
        displayMessageInModal("FMP Key, SEC Key, Client ID, and Firebase Config are required.", "warning");
        return;
    }
    
    // Assign to state
    state.fmpApiKey = fmpApiKey;
    state.geminiApiKey = geminiApiKey;
    state.googleClientId = googleClientId;
    state.secApiKey = secApiKey;

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

// --- AUTHENTICATION ---
function initializeGoogleSignIn() {
    if (!state.googleClientId) return;
    try {
        google.accounts.id.initialize({
            client_id: state.googleClientId,
            callback: handleCredentialResponse,
        });
    } catch (error) {
        console.error("Google Sign-In initialization error:", error);
        displayMessageInModal("Could not initialize Google Sign-In. Check your Client ID.", "error");
    }
}

async function handleCredentialResponse(response) {
    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = "Verifying login...";
    try {
        const credential = GoogleAuthProvider.credential(response.credential);
        await signInWithCredential(state.auth, credential);
    } catch (error) {
        console.error("Firebase sign-in with Google credential failed:", error);
        displayMessageInModal(`Login failed: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

function handleLogout() {
    if (state.auth) {
        signOut(state.auth).catch(error => console.error("Sign out failed:", error));
    }
    if (typeof google !== 'undefined' && google.accounts) {
        google.accounts.id.disableAutoSelect();
    }
}

function setupAuthUI(user) {
    const authStatusEl = document.getElementById('auth-status');
    const appContainer = document.getElementById('app-container');
    if (!authStatusEl || !appContainer) return;

    authStatusEl.innerHTML = ''; 

    if (user && !user.isAnonymous) {
        appContainer.classList.remove(CONSTANTS.CLASS_HIDDEN);
        closeModal(CONSTANTS.MODAL_API_KEY);
        
        const displayName = user.displayName || 'User';
        
        authStatusEl.innerHTML = `
            <div class="bg-white/20 backdrop-blur-sm rounded-full p-1 flex items-center gap-2 text-white text-sm">
                <div class="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-bold">${displayName.charAt(0)}</div>
                <span class="font-medium pr-2">${displayName}</span>
                <button id="logout-button" class="bg-white/20 hover:bg-white/40 text-white font-semibold py-1 px-3 rounded-full" title="Sign Out">Logout</button>
            </div>`;
        document.getElementById('logout-button').addEventListener('click', handleLogout);
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
    setupEventListeners(); // We will simplify this file next
    document.getElementById(CONSTANTS.FORM_API_KEY)?.addEventListener('submit', handleApiKeySubmit);
    openModal(CONSTANTS.MODAL_API_KEY);
}

document.addEventListener('DOMContentLoaded', initializeApplication);
