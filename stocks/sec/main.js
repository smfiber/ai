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
    
    // First, ensure the portfolio data is loaded into the cache
    await fetchAndCachePortfolioData();

    const lastCheckTimestamp = localStorage.getItem('lastFilingCheck');
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const now = new Date().getTime();

    // This background check is still useful for other parts of the app
    if (!lastCheckTimestamp || (now - parseInt(lastCheckTimestamp) > twentyFourHours)) {
        await checkForNewFilings();
        localStorage.setItem('lastFilingCheck', now.toString());
    }
    
    // Now, call the function to populate our new dashboard
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
                
                // Clear dynamic content if logged out, checking if elements exist first
                const containerIds = [
                    'recent-8k-container', 
                    'recent-10q-container', 
                    'recent-10k-container',
                    'filings-by-company-container', 
                    'upcoming-filings-container'
                ];

                containerIds.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) {
                        el.innerHTML = '';
                    }
                });
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
    if (state.auth && state.auth.currentUser) {
        // New: Get the Google Sign-In ID to revoke it
        const googleId = state.auth.currentUser.providerData.find(p => p.providerId === 'google.com')?.uid;
        if (googleId && typeof google !== 'undefined' && google.accounts) {
             google.accounts.id.revoke(googleId, done => {
                console.log('Google session revoked.');
             });
        }
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
        // --- CHANGE STARTS HERE: Replace Google's button with our own ---
        authStatusEl.innerHTML = `
            <button id="google-signin-btn" class="bg-white text-gray-800 font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-gray-100 flex items-center gap-2">
                <svg class="w-5 h-5" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path></svg>
                Sign in with Google
            </button>
        `;
        document.getElementById('google-signin-btn').addEventListener('click', () => {
            if (typeof google !== 'undefined' && google.accounts) {
                google.accounts.id.prompt();
            } else {
                displayMessageInModal('Google Sign-In is not available.', 'error');
            }
        });
        // --- CHANGE ENDS HERE ---
    }
}

// --- APP INITIALIZATION TRIGGER ---
function initializeApplication() {
    setupEventListeners();
    document.getElementById(CONSTANTS.FORM_API_KEY)?.addEventListener('submit', handleApiKeySubmit);
    openModal(CONSTANTS.MODAL_API_KEY);
}

document.addEventListener('DOMContentLoaded', initializeApplication);
