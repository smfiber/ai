import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, onSnapshot, Timestamp, doc, setDoc, deleteDoc, updateDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
// --- Firebase State ---
let db;
let auth;
let userId;
let viewedItemsCollectionRef;
const viewedItemIds = new Set(); [cite_start]
let stickyTopicsUnsubscribe = null;
let stickyTopics = {};
let userAddedTopics = {};
// NEW: For user-added sticky topics
let userTopicsUnsubscribes = {};
// NEW: To manage listeners for user topics
let firebaseConfig = null;
let appIsInitialized = false;

const jsonInstruction = ` IMPORTANT: Ensure your response is ONLY a valid JSON object.
All strings must be enclosed in double quotes. Any double quotes or backslashes within a string value must be properly escaped (e.g., "This is a \\"sample\\" description." or "C:\\\\Users\\\\Admin").
Do not wrap the JSON in markdown code fences.`;

// --- Prompt Engineering Constants ---
// ** UPDATED PROMPT (Final Review Prompt) **
const finalReviewPrompt = `
Persona: You are a Lead Technical Editor and a Senior IT Systems Architect.
Your role is final quality assurance.
Objective: Your mission is to audit the DRAFT CONTENT provided below against its ORIGINAL BLUEPRINT. [cite_start]/*
You will then rewrite and enhance the draft to produce final, publishable-grade technical documentation.
You must directly implement all corrections and improvements into the text.
//-- INPUT 1: ORIGINAL GUIDE BLUEPRINT (SECTIONS 1-4) --//
{blueprint_from_step_1}

//-- INPUT 2: DRAFT CONTENT TO REVIEW (SECTIONS 5-12) --//
{draft_content_to_review}

//-- SYSTEMATIC REVIEW PROTOCOL --//
(AI: Execute the following review protocol on the DRAFT CONTENT. Your output will be the rewritten content itself, not a list of your actions.)

1.  **Blueprint Adherence Audit:**
    * Scrutinize the draft against the ORIGINAL BLUEPRINT.
    * [cite_start]**Crucially, remove any information or sections that violate the established OUT-OF-SCOPE rules (e.g., if the blueprint scopes the guide to GUI only, remove all PowerShell/API sections).
    * Ensure all IN-SCOPE topics are present and are the primary focus.
    * Verify the content's depth and tone are appropriate for the defined TARGET_AUDIENCE.
2.  **Technical Accuracy Validation:**
    * Scrutinize every technical statement. [cite_start]/* [cite: 228] */
    * [cite_start]**Treat any placeholder (e.g., "api.example.com") or hypothetical information as a critical error to be corrected with factual data.** /* [cite: 229] */
    * Verify and correct all PowerShell/CLI cmdlets, parameters, and object properties. [cite_start]/* [cite: 229] */
    * Validate API endpoints, request bodies, and expected response codes against public documentation. [cite_start]/* [cite: 230] */
    * Fact-check procedural steps against current product interfaces and documentation patterns. [cite_start]/* [cite: 231] */
3.  **Clarity and Professionalism Polish:**
    * Rephrase awkward or ambiguous sentences to be direct and clear. [cite_start]/* [cite: 232] */
    * **Eliminate all meta-commentary, asides, and notes from the AI (e.g., "Pro Tip:", "Note:", "This is a hypothetical example"). [cite_start]/* [cite: 233] */
    [cite_start]Integrate advice naturally into the narrative.** /* [cite: 234] */
    * Enforce consistent terminology. [cite_start]/* [cite: 234] */
    * Ensure all formatting is clean and consistent, preserving the '###' header structure. [cite_start]/* [cite: 235] */
**Final Output Instruction:**
Return ONLY the complete, final, rewritten markdown for the sections you were asked to review. [cite_start]/* [cite: 236] */
Do not provide a preamble, a list of your changes, or any text other than the final, revised document. [cite_start]/* [cite: 237] */
Your response must begin directly with the first header of the content you are reviewing (e.g., ### 5. Key Concepts - In-Depth Application & Management). [cite_start]/* [cite: 238] */
`;

// --- Global State & Configuration ---
let geminiApiKey = ""; [cite_start]/* [cite: 239] */
const root = document.documentElement; [cite_start]/* [cite: 240] */
const allThemeData = {}; [cite_start]/* [cite: 240] */
let originalGeneratedText = new Map(); [cite_start]/* [cite: 240] */
let aiLog = []; [cite_start]/* [cite: 240] */
let currentHierarchyPath = []; [cite_start]/* [cite: 241] */
let selectedHierarchyItems = { main: null, sub: null, final: null }; [cite_start]/* [cite: 241] */
// --- Google Drive Integration State & Config ---
let gapiInited = false; [cite_start]/* [cite: 242] */
let gisInited = false; [cite_start]/* [cite: 243] */
let tokenClient; [cite_start]/* [cite: 243] */
let GOOGLE_CLIENT_ID = ''; [cite_start]/* [cite: 243] */
const G_SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/cloud-platform'; [cite_start]/* [cite: 243] */
let driveFolderId = null; [cite_start]/* [cite: 243] */
// --- App Initialization & Event Listeners ---
function initializeApplication() {
    setupEventListeners(); [cite_start]/* [cite: 244] */
    populateTypographySettings(); [cite_start]/* [cite: 245] */
    marked.setOptions({
        renderer: new marked.Renderer(),
        highlight: (code, lang) => code,
        langPrefix: 'language-',
        gfm: true,
        breaks: true,
  });

    if (loadConfigFromStorage()) {
        initializeFirebase(); [cite_start]/* [cite: 246] */
        initializeGoogleClients(); [cite_start]/* [cite: 247] */
    } else {
        openModal('apiKeyModal'); [cite_start]/* [cite: 247] */
    }
}

document.addEventListener('DOMContentLoaded', initializeApplication); [cite_start]/* [cite: 248] */
function loadConfigFromStorage() {
    geminiApiKey = localStorage.getItem('geminiApiKey'); [cite_start]/* [cite: 249] */
    const firebaseConfigString = localStorage.getItem('firebaseConfig'); [cite_start]/* [cite: 250] */
    GOOGLE_CLIENT_ID = localStorage.getItem('googleClientId'); [cite_start]/* [cite: 250] */

    if (firebaseConfigString) {
        try {
            firebaseConfig = JSON.parse(firebaseConfigString); [cite_start]/* [cite: 250] */
        } catch (e) {
            console.error("Failed to parse Firebase config from localStorage", e); [cite_start]/* [cite: 251] */
            localStorage.clear(); [cite_start]/* [cite: 252] */
            return false;
        }
    }

    if (geminiApiKey && firebaseConfig) {
        document.getElementById('geminiApiKeyInput').value = geminiApiKey; [cite_start]/* [cite: 252] */
        document.getElementById('firebaseConfigInput').value = JSON.stringify(firebaseConfig, null, 2); [cite_start]/* [cite: 253] */
        if (GOOGLE_CLIENT_ID) {
            document.getElementById('googleClientIdInput').value = GOOGLE_CLIENT_ID; [cite_start]/* [cite: 253] */
        }
        return true; [cite_start]/* [cite: 254] */
    }
    return false; [cite_start]/* [cite: 255] */
}

// --- Login/Logout UI and Handlers ---
function setupAuthUI(user) {
    const authStatusEl = document.getElementById('auth-status'); [cite_start]/* [cite: 256] */
    const appContainer = document.getElementById('app-container'); [cite_start]/* [cite: 257] */

    if (user) {
        appContainer.classList.remove('hidden'); [cite_start]/* [cite: 257] */
        closeModal('apiKeyModal'); [cite_start]/* [cite: 258] */
        
        authStatusEl.innerHTML = `
            <div class="bg-white/20 backdrop-blur-sm rounded-full p-1 flex items-center gap-2 text-white text-sm">
                <img src="${user.photoURL}" alt="User photo" class="w-8 h-8 rounded-full">
                <span class="font-medium pr-2">${user.displayName}</span>
            
            <button id="logout-button" class="bg-white/20 hover:bg-white/40 text-white font-semibold py-1 px-3 rounded-full flex items-center justify-center gap-2" title="Sign Out">
                    <span>Logout</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 
1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                </button>
            </div>
        `; [cite_start]/* [cite: 259] */
        document.getElementById('logout-button').addEventListener('click', handleLogout); [cite_start]/* [cite: 261] */
        
        if (!appIsInitialized) {
            initializeAppContent(); [cite_start]/* [cite: 261] */
        }

    } else {
         authStatusEl.innerHTML = `
             <button id="login-button" class="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white font-semibold py-2 px-4 rounded-full flex items-center justify-center gap-2" title="Sign In with Google">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 
0 48 48" fill="none"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path><path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path><path fill="#4CAF50" d="M24 44c5.166 0 9.599-1.521 12.643-4.001L30.27 34.138C28.714 36.548 26.521 38 24 38c-5.223 0-9.657-3.341-11.303-7.918l-6.573 4.818C9.656 39.663 16.318 44 24 44z"></path><path fill="#1976D2" d="M43.611 20.083H24v8h11.303c-.792 2.237-2.231 4.16-4.082 5.571l5.657 5.657C41.389 36.197 44 30.669 44 24c0-1.341-.138-2.65-.389-3.917z"></path></svg>
               
                 <span>Login with Google</span>
            </button>
        `; [cite_start]/* [cite: 263] */
        document.getElementById('login-button').addEventListener('click', handleLogin); [cite_start]/* [cite: 265] */
        
        appContainer.classList.add('hidden'); [cite_start]/* [cite: 265] */
        if (!localStorage.getItem('geminiApiKey')) {
             openModal('apiKeyModal'); [cite_start]/* [cite: 265] */
        }
    }
}

async function handleLogin() {
    const provider = new GoogleAuthProvider(); [cite_start]/* [cite: 266] */
    provider.addScope('https://www.googleapis.com/auth/cloud-platform'); [cite_start]/* [cite: 267] */
    try {
        const result = await signInWithPopup(auth, provider); [cite_start]/* [cite: 267] */
        console.log("Popup sign-in successful for:", result.user.displayName); [cite_start]/* [cite: 268] */
    } catch (error) {
        console.error("Google Sign-In Popup failed:", error); [cite_start]/* [cite: 268] */
        const errorEl = document.getElementById('api-key-error'); [cite_start]/* [cite: 269] */
        if (errorEl) {
           let userMessage = `Login failed: ${error.code}.`; [cite_start]/* [cite: 269] */
           if (error.code === 'auth/popup-closed-by-user') {
               userMessage += ' You closed the login window before completing sign-in.'; [cite_start]/* [cite: 270] */
           } else if (error.code === 'auth/cancelled-popup-request') {
               userMessage += ' Multiple login windows were opened. [cite_start]/* [cite: 271] */
Please try again.'; [cite_start]/* [cite: 272] */
           } else {
               userMessage += ' This can be caused by browser pop-up blockers or security settings. [cite_start]/* [cite: 272] */
Please check your browser settings and try again.'; [cite_start]/* [cite: 273] */
           }
           errorEl.textContent = userMessage; [cite_start]/* [cite: 273] */
        }
    }
}

function handleLogout() {
    const driveToken = gapi?.client?.getToken(); [cite_start]/* [cite: 274] */
    if (driveToken) {
        google.accounts.oauth2.revoke(driveToken.access_token, () => {
             console.log('Google Drive token revoked.');
        }); [cite_start]/* [cite: 275] */
    }
    signOut(auth).then(() => {
        updateSigninStatus(false);
        localStorage.removeItem('geminiApiKey');
        localStorage.removeItem('firebaseConfig');
        localStorage.removeItem('googleClientId');
        [cite_start]console.log('User signed out and local storage /* [cite: 276] */
cleared.'); [cite_start]/* [cite: 277] */
        location.reload();
    }).catch(error => {
        console.error("Sign out failed:", error);
        const authStatusEl = document.getElementById('auth-status');
        [cite_start]if(authStatusEl) authStatusEl.innerHTML = `<p class="text-red-300">Sign out failed.</p>`; /* [cite: 277] */
  });
}

async function initializeAppContent() {
    appIsInitialized = true; [cite_start]/* [cite: 278] */
    openModal('loadingStateModal'); [cite_start]/* [cite: 279] */
    const loadingMessageEl = document.getElementById('loading-message');
    loadingMessageEl.textContent = "Waking up the AI...";

    document.getElementById('gemini-result-container').innerHTML = '';
    
    checkBackupReminder(); [cite_start]/* [cite: 279] */
// NEW: Check for backup reminder on app load

    try {
        await generateAndApplyDefaultTheme(); [cite_start]/* [cite: 280] */
        loadingMessageEl.textContent = "Loading application content..."; [cite_start]/* [cite: 281] */
        await loadAppContent();
    } catch (error) {
        const errorMessage = error ? [cite_start]/* [cite: 281] */
error.message : "An unknown error occurred."; [cite_start]/* [cite: 282] */
        console.error("A critical error occurred during app initialization:", errorMessage);
        localStorage.clear();
        openModal('apiKeyModal');
        const errorEl = document.getElementById('api-key-error'); [cite_start]/* [cite: 282] */
        if(errorEl) {
            errorEl.textContent = `Setup failed: ${errorMessage}. [cite_start]/* [cite: 283] */
Your keys have been cleared. Please check and re-enter them.`; [cite_start]/* [cite: 284] */
        }
    } finally {
        closeModal('loadingStateModal'); [cite_start]/* [cite: 285] */
    }
}

function initializeGoogleClients() {
    if (!GOOGLE_CLIENT_ID) {
        console.warn("Google Client ID is not provided. Cloud features will be disabled."); [cite_start]/* [cite: 286] */
        return;
    }

    document.getElementById('cloud-storage-card').classList.remove('hidden');
    document.getElementById('google-drive-section').classList.remove('hidden'); [cite_start]/* [cite: 287] */
    const gapiInterval = setInterval(() => {
        if (window.gapi && window.gapi.load) {
            clearInterval(gapiInterval);
            gapi.load('client:picker', () => {
                [cite_start]gapiInited = true; /* [cite: 288] */
  
                 initializeGapiClient(); [cite_start]/* [cite: 289] */
            });
        }
    }, 100); [cite_start]/* [cite: 289] */
    const gsiInterval = setInterval(() => {
        if (window.google && window.google.accounts) {
            clearInterval(gsiInterval);
            google.accounts.id.initialize({
                [cite_start]client_id: GOOGLE_CLIENT_ID, /* [cite: 290] */
  
               [cite_start]callback: () => {},  /* [cite: 291] */
            });
            gisInited = true;
        }
    }, 100); [cite_start]/* [cite: 291] */
}

function initializeFirebase() {
     if (!firebaseConfig) {
        console.warn("Firebase config is missing. Firebase initialization skipped."); [cite_start]/* [cite: 292] */
        return;
    }
    
    try {
        const app = initializeApp(firebaseConfig); [cite_start]/* [cite: 293] */
        db = getFirestore(app); [cite_start]/* [cite: 294] */
        auth = getAuth(app);

        onAuthStateChanged(auth, user => {
            if (user) {
                userId = user.uid;
                [cite_start]const appId = firebaseConfig.appId || 'it-admin-hub-global';  /* [cite: 294] */
            
                viewedItemsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/viewedItems`); [cite_start]/* [cite: 295] */
                listenForViewedItems();
            } else {
                userId = null;
              
                viewedItemsCollectionRef = null; [cite_start]/* [cite: 296] */
            }
            setupAuthUI(user);
        }); [cite_start]/* [cite: 296] */
    } catch (error) {
        console.error("Firebase initialization error:", error); [cite_start]/* [cite: 297] */
        openModal('apiKeyModal'); [cite_start]/* [cite: 298] */
        const errorEl = document.getElementById('api-key-error');
        if(errorEl) {
            errorEl.textContent = `Firebase Error: ${error.message}. [cite_start]/* [cite: 298] */
Please check your config object.`; [cite_start]/* [cite: 299] */
        }
    }
}

function listenForViewedItems() {
    if (!viewedItemsCollectionRef) return; [cite_start]/* [cite: 299] */
    onSnapshot(viewedItemsCollectionRef, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
                viewedItemIds.add(change.doc.id);
            }
           
     [cite_start]}); /* [cite: 301] */
    }, (error) => {
        console.error("Error listening to viewed items:", error);
    }); [cite_start]/* [cite: 301] */
}

function setupEventListeners() {
    document.getElementById('apiKeyForm').addEventListener('submit', handleApiKeySubmit); [cite_start]/* [cite: 302] */
    document.getElementById('gemini-form').addEventListener('submit', handleGeminiSubmit); [cite_start]/* [cite: 303] */
    document.getElementById('generate-theme-btn').addEventListener('click', handleCustomVisualThemeGeneration);
    
    document.getElementById('explore-featured-btn').addEventListener('click', () => openCategoryBrowser('featured'));
    document.getElementById('browse-all-btn').addEventListener('click', () => openCategoryBrowser('all'));
    document.getElementById('closeCategoryBrowserModal').addEventListener('click', () => closeModal('categoryBrowserModal'));

    document.getElementById('auth-button').addEventListener('click', handleAuthClick); [cite_start]/* [cite: 303] */
    document.getElementById('load-from-drive-btn').addEventListener('click', async () => {
        const folderId = await getDriveFolderId();
        createPicker('open', folderId);
    }); [cite_start]/* [cite: 304] */
    document.getElementById('new-plan-button').addEventListener('click', () => location.reload()); [cite_start]/* [cite: 305] */
    document.getElementById('prompts-button').addEventListener('click', displayPromptsInModal);
    document.getElementById('real-time-log-button').addEventListener('click', displayAiLog);
    document.getElementById('theme-changer-button').addEventListener('click', () => {
        if(!geminiApiKey) { openModal('apiKeyModal'); return; }
        openModal('themeGeneratorModal');
    }); [cite_start]/* [cite: 305] */
    document.getElementById('ai-help-button').addEventListener('click', handleAIHelpRequest); [cite_start]/* [cite: 306] */
    document.getElementById('scroll-to-top-button').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' })); [cite_start]/* [cite: 306] */
    // NEW: Listeners for data management buttons
    document.getElementById('export-data-button').addEventListener('click', handleExportData); [cite_start]/* [cite: 307] */
    document.getElementById('import-data-button').addEventListener('click', handleImportData); [cite_start]/* [cite: 308] */

    const settingsPanel = document.getElementById('settings-panel');
    document.getElementById('settings-button').addEventListener('click', (e) => {
        e.stopPropagation();
        settingsPanel.classList.toggle('hidden');
    }); [cite_start]/* [cite: 308] */
    document.getElementById('font-family-select').addEventListener('change', (e) => root.style.setProperty('--font-family', e.target.value)); [cite_start]/* [cite: 309] */
    document.getElementById('font-size-select').addEventListener('change', (e) => root.style.setProperty('--font-size-base', e.target.value));
    document.getElementById('line-height-select').addEventListener('change', (e) => root.style.setProperty('--line-height-base', e.target.value)); [cite_start]/* [cite: 309] */
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.closest('[id^="close"]')) {
                closeModal(modal.id);
            }
         
       [cite_start]}); /* [cite: 311] */
    }); [cite_start]/* [cite: 310] */
    document.getElementById('search-gemini-button').addEventListener('click', handleSearchGemini); [cite_start]/* [cite: 312] */

    document.addEventListener('mouseup', handleTextSelection);
    document.addEventListener('mousedown', (e) => {
         const searchButton = document.getElementById('search-gemini-button');
         if (!searchButton.classList.contains('hidden') && !searchButton.contains(e.target)) {
            searchButton.classList.add('hidden');
         }
    }); [cite_start]/* [cite: 312] */
    document.addEventListener('click', (e) => {
        const menuItem = e.target.closest('.topics-menu-item');
        if (menuItem) {
            e.preventDefault(); 
            const targetCard = document.getElementById(menuItem.dataset.targetId);
                
            if (targetCard) {
                targetCard.scrollIntoView({ behavior: 'smooth', block: 'start'});
                targetCard.style.boxShadow = '0 0 0 4px var(--color-primary)';
                setTimeout(() => targetCard.style.boxShadow = '', 2000);
       
            }
            return;
        }

        if (e.target.classList.contains('copy-code-button')) {
            const codeBlock = e.target.closest('.code-block-container').querySelector('code, pre');
         
            [cite_start]copyElementTextToClipboard(codeBlock, e.target); /* [cite: 316] */
            return;
        }
        
        if (e.target.id === 'save-to-drive-btn') {
                
             handleSaveToDriveClick(e.target); [cite_start]/* [cite: 317] */
             return;
        }
        
        const addTopicBtn = e.target.closest('.add-topic-button'); [cite_start]/* [cite: 317] */
        if(addTopicBtn) {
            handleAddNewTopic(addTopicBtn); [cite_start]/* [cite: 318] */
            return;
        }
        
        const tailorBtn = e.target.closest('#tailoring-buttons-container .btn-toggle'); [cite_start]/* [cite: 319] */
        if (tailorBtn) {
            tailorBtn.classList.toggle('active'); [cite_start]/* [cite: 320] */
            return;
        }

        const gridSelector = e.target.closest('.grid-card-selector'); [cite_start]/* [cite: 321] */
        if (gridSelector) {
            handleGridSelect(gridSelector); [cite_start]/* [cite: 322] */
            return;
        }

        const exploreBtn = e.target.closest('.explore-button'); [cite_start]/* [cite: 323] */
        if (exploreBtn) {
            const card = exploreBtn.closest('.card'); [cite_start]/* [cite: 324] */
            const fullHierarchyPath = JSON.parse(card.dataset.fullHierarchyPath); [cite_start]/* [cite: 325] */
            const topicId = exploreBtn.dataset.topicId;
            handleExploreInDepth(topicId, fullHierarchyPath);
            return; [cite_start]/* [cite: 325] */
        }
        
        const refineBtn = e.target.closest('.refine-button'); [cite_start]/* [cite: 326] */
        if (refineBtn) {
            toggleRefineUI(refineBtn.parentElement); [cite_start]/* [cite: 327] */
            return;
        }

        const modalRefineBtn = e.target.closest('.modal-refine-button'); [cite_start]/* [cite: 328] */
        if (modalRefineBtn) {
            const modal = e.target.closest('.card'); [cite_start]/* [cite: 329] */
            const targetModalId = modal.parentElement.id; [cite_start]/* [cite: 330] */
            if(targetModalId) {
                 toggleRefineUI(modalRefineBtn.parentElement, true, targetModalId); [cite_start]/* [cite: 330] */
            }
            return; [cite_start]/* [cite: 331] */
        }
        
        const submitRefineBtn = e.target.closest('.submit-refinement-button'); [cite_start]/* [cite: 332] */
        if(submitRefineBtn) {
            const targetModalId = submitRefineBtn.dataset.targetModalId; [cite_start]/* [cite: 333] */
            handleRefineRequest(submitRefineBtn.closest('.refine-container'), targetModalId);
            return;
        }

        const generateMoreBtn = e.target.closest('.generate-more-button'); [cite_start]/* [cite: 334] */
        if (generateMoreBtn) {
            handleGenerateMoreClick(generateMoreBtn); [cite_start]/* [cite: 335] */
            return;
        }

        const accordionHeader = e.target.closest('.accordion-header'); [cite_start]/* [cite: 336] */
        if (accordionHeader) { 
            accordionHeader.classList.toggle('active'); [cite_start]/* [cite: 337] */
            const icon = accordionHeader.querySelector('.icon'); [cite_start]/* [cite: 337] */
            if(icon) {
               icon.style.transform = accordionHeader.classList.contains('active') ? [cite_start]/* [cite: 338] */
'rotate(180deg)' : 'rotate(0deg)'; [cite_start]/* [cite: 339] */
            }
            accordionHeader.nextElementSibling.classList.toggle('open'); [cite_start]/* [cite: 339] */
            return;
        }

        if (!settingsPanel.classList.contains('hidden') && !settingsPanel.contains(e.target) && !e.target.closest('#settings-button')) {
            settingsPanel.classList.add('hidden'); [cite_start]/* [cite: 340] */
        }

        const generateDetailedStepsBtn = e.target.closest('#generate-detailed-steps-btn'); [cite_start]/* [cite: 341] */
        if (generateDetailedStepsBtn) {
            generateFullDetailedGuide(generateDetailedStepsBtn); [cite_start]/* [cite: 342] */
            return;
        }
    }); [cite_start]/* [cite: 343] */
    window.addEventListener('scroll', () => {
        const scrollTopButton = document.getElementById('scroll-to-top-button');
        if (window.scrollY > 300) {
            scrollTopButton.classList.remove('hidden');
        } else {
            
            [cite_start]scrollTopButton.classList.add('hidden'); /* [cite: 345] */
        }
    }); [cite_start]/* [cite: 344] */
    // MODIFIED: Added listeners for Hierarchy Management
    document.getElementById('hierarchy-manager-button').addEventListener('click', openHierarchyManagementModal); [cite_start]/* [cite: 346] */
    document.getElementById('add-main-category-btn').addEventListener('click', () => handleAddHierarchyItem('main')); [cite_start]/* [cite: 347] */
    document.getElementById('add-sub-category-btn').addEventListener('click', () => handleAddHierarchyItem('sub'));
    document.getElementById('add-final-category-btn').addEventListener('click', () => handleAddHierarchyItem('final'));
    document.getElementById('save-hierarchy-item-btn').addEventListener('click', handleSaveHierarchyItem);
    document.getElementById('delete-hierarchy-item-btn').addEventListener('click', handleDeleteHierarchyItem);


    document.getElementById('firebase-tools-button').addEventListener('click', openStickyTopicsModal); [cite_start]/* [cite: 347] */
    document.getElementById('sticky-topic-category-select').addEventListener('change', (e) => listenForStickyTopics(e.target.value)); [cite_start]/* [cite: 348] */
    document.getElementById('add-sticky-topic-button').addEventListener('click', handleAddStickyTopic);
}

async function handleApiKeySubmit(e) {
    e.preventDefault(); [cite_start]/* [cite: 348] */
    const tempGeminiKey = document.getElementById('geminiApiKeyInput').value.trim();
    const tempFirebaseConfigText = document.getElementById('firebaseConfigInput').value.trim();
    const tempGoogleClientId = document.getElementById('googleClientIdInput').value.trim();
    let tempFirebaseConfig;

    const errorEl = document.getElementById('api-key-error'); [cite_start]/* [cite: 349] */
    errorEl.textContent = ''; [cite_start]/* [cite: 350] */

    if (!tempGeminiKey || !tempFirebaseConfigText) {
        errorEl.textContent = "Gemini API Key and Firebase Config are required."; [cite_start]/* [cite: 350] */
        return;
    }
    
    try {
        const match = tempFirebaseConfigText.match(/\{[\s\S]*\}/); [cite_start]/* [cite: 351] */
        if (!match) {
            throw new Error("Could not find a config object starting with '{' and ending with '}'."); [cite_start]/* [cite: 352] */
        }
        const configString = match[0]; [cite_start]/* [cite: 353] */
        const configFactory = new Function(`return ${configString}`); [cite_start]/* [cite: 354] */
        tempFirebaseConfig = configFactory();

        if (!tempFirebaseConfig || typeof tempFirebaseConfig !== 'object' || !tempFirebaseConfig.apiKey || !tempFirebaseConfig.projectId) {
            throw new Error("The parsed Firebase config is invalid or missing required properties like 'apiKey' or 'projectId'."); [cite_start]/* [cite: 354] */
        }
    } catch (err) {
        errorEl.textContent = `Invalid Firebase Config: ${err.message}. [cite_start]/* [cite: 355] */
Please ensure you've pasted the complete snippet from your Firebase project settings.`; [cite_start]/* [cite: 356] */
        return; [cite_start]/* [cite: 356] */
    }
    
    localStorage.setItem('geminiApiKey', tempGeminiKey); [cite_start]/* [cite: 357] */
    localStorage.setItem('firebaseConfig', JSON.stringify(tempFirebaseConfig)); [cite_start]/* [cite: 358] */
    localStorage.setItem('googleClientId', tempGoogleClientId);
    
    if (loadConfigFromStorage()) {
        initializeFirebase(); [cite_start]/* [cite: 358] */
        initializeGoogleClients(); [cite_start]/* [cite: 359] */
        handleLogin();
    }
}

// --- Google Drive & Firebase Functions ---

async function initializeGapiClient() {
    try {
        await gapi.client.init({
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
     
        }); [cite_start]/* [cite: 360] */
        gapiInited = true;
        initializeTokenClient(); [cite_start]/* [cite: 360] */
    } catch(error) {
        console.error("Error initializing GAPI Client", error); [cite_start]/* [cite: 361] */
        document.getElementById('drive-status').textContent = 'Google API init failed. Check keys.'; [cite_start]/* [cite: 362] */
    }
}

function initializeTokenClient() {
    if (!gisInited || !GOOGLE_CLIENT_ID) {
        console.error("Google GSI client or Client ID is missing. Cannot initialize token client."); [cite_start]/* [cite: 362] */
        return;
    }
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
     
            [cite_start]}, /* [cite: 366] */
            popup_closed_callback: () => {
                console.log('User closed the Google auth popup.');
                const statusEl = document.getElementById('drive-status');
      
                if (statusEl.textContent.includes('Connecting')) {
                    statusEl.textContent = 'Connection cancelled.'; [cite_start]/* [cite: 367] */
                    setTimeout(() => updateSigninStatus(false), 2000); [cite_start]/* [cite: 368] */
                }
            }
        }); [cite_start]/* [cite: 368] */
        tokenClient.requestAccessToken({prompt: 'none'}); [cite_start]/* [cite: 369] */
    } catch(err) {
         console.error("Failed to initialize Google token client:", err); [cite_start]/* [cite: 369] */
    }
}

function handleAuthClick() {
     if (!gapiInited || !gisInited || !tokenClient) {
        console.error('Google services are not initialized yet.'); [cite_start]/* [cite: 370] */
        document.getElementById('drive-status').textContent = 'Services initializing, please wait...'; [cite_start]/* [cite: 371] */
        return;
    }

    if (gapi.client.getToken() === null) {
        document.getElementById('drive-status').textContent = 'Connecting to Google Drive...'; [cite_start]/* [cite: 371] */
        tokenClient.requestAccessToken({prompt: 'consent'}); [cite_start]/* [cite: 372] */
    } else {
        const token = gapi.client.getToken(); [cite_start]/* [cite: 372] */
        if (token) {
            google.accounts.oauth2.revoke(token.access_token, () => {
                gapi.client.setToken(null);
                updateSigninStatus(false);
            }); [cite_start]/* [cite: 373] */
        }
    }
}

function updateSigninStatus(isSignedIn) {
    const authButton = document.getElementById('auth-button'); [cite_start]/* [cite: 374] */
    const loadBtn = document.getElementById('load-from-drive-btn'); [cite_start]/* [cite: 375] */
    const statusEl = document.getElementById('drive-status');
    
    if (isSignedIn) {
        authButton.textContent = 'Disconnect'; [cite_start]/* [cite: 375] */
        authButton.title = 'Disconnect your Google Account'; [cite_start]/* [cite: 376] */
        loadBtn.classList.remove('hidden');
        statusEl.textContent = 'Connected to Google Drive.';
        getDriveFolderId(); [cite_start]/* [cite: 376] */
    } else {
        authButton.textContent = 'Connect'; [cite_start]/* [cite: 377] */
        authButton.title = 'Connect your Google Account'; [cite_start]/* [cite: 378] */
        loadBtn.classList.add('hidden');
        statusEl.textContent = 'Connect to load/save guides and enable AI image generation.'; [cite_start]/* [cite: 378] */
        driveFolderId = null; [cite_start]/* [cite: 379] */
    }

    if (document.body.classList.contains('inDepthModal-open')) {
        const isInitial = !!document.getElementById('generate-detailed-steps-btn'); [cite_start]/* [cite: 379] */
        addModalActionButtons(document.getElementById('inDepthModalButtons'), isInitial); [cite_start]/* [cite: 380] */
    }
    if (document.body.classList.contains('inDepthDetailedModal-open')) {
        addDetailedModalActionButtons(document.getElementById('inDepthDetailedModalButtons')); [cite_start]/* [cite: 380] */
    }
    if (document.body.classList.contains('searchGeminiModal-open')) {
        addSearchModalActionButtons(document.getElementById('searchGeminiModalButtons')); [cite_start]/* [cite: 381] */
    }
}

async function getDriveFolderId() {
    if (driveFolderId) return driveFolderId; [cite_start]/* [cite: 382] */
    const driveStatusEl = document.getElementById('drive-status'); [cite_start]/* [cite: 383] */
    driveStatusEl.textContent = 'Searching for app folder...'; [cite_start]/* [cite: 383] */
    try {
        const response = await gapi.client.drive.files.list({
            q: "mimeType='application/vnd.google-apps.folder' and name='IT Administration Hub' and trashed=false",
            fields: 'files(id, name)',
        }); [cite_start]/* [cite: 384] */
        if (response.result.files && response.result.files.length > 0) {
            driveFolderId = response.result.files[0].id; [cite_start]/* [cite: 385] */
        } else {
            driveStatusEl.textContent = 'Creating app folder...'; [cite_start]/* [cite: 386] */
            const folderResponse = await gapi.client.drive.files.create({
                resource: { 'name': 'IT Administration Hub', 'mimeType': 'application/vnd.google-apps.folder' },
                fields: 'id'
            }); [cite_start]/* [cite: 387] */
            driveFolderId = folderResponse.result.id; [cite_start]/* [cite: 388] */
        }
        driveStatusEl.textContent = 'Connected to Google Drive.'; [cite_start]/* [cite: 388] */
        return driveFolderId;
    } catch (error) {
        console.error("Error finding/creating Drive folder:", error); [cite_start]/* [cite: 389] */
        driveStatusEl.textContent = 'Error with Drive folder access.'; [cite_start]/* [cite: 390] */
        return null;
    }
}

async function handleSaveToDriveClick(button) {
     const modal = button.closest('.card'); [cite_start]/* [cite: 390] */
     if (!modal) return;
     
     let contentToSave;
     let statusEl;
     let cardName;
     let topicTitle; [cite_start]/* [cite: 391] */
     if (modal.parentElement.id === 'searchGeminiModal') {
        contentToSave = document.getElementById('searchGeminiResult').innerText; [cite_start]/* [cite: 392] */
        cardName = "Gemini Search"; [cite_start]/* [cite: 393] */
        const fullTopicTitle = document.getElementById('searchGeminiQueryText').value;
        topicTitle = truncateText(fullTopicTitle, 40);
        statusEl = document.getElementById('search-modal-status-message'); [cite_start]/* [cite: 393] */
    } else {
        const modalFooter = button.closest('[id$="ModalFooter"]'); [cite_start]/* [cite: 394] */
        const fullTitle = modalFooter.dataset.fullTitle; [cite_start]/* [cite: 395] */
        cardName = modalFooter.dataset.cardName || "Guide";
        contentToSave = originalGeneratedText.get(fullTitle);
        topicTitle = fullTitle.replace(/In-Depth: |Custom Guide: /g, ''); [cite_start]/* [cite: 395] */
        statusEl = modalFooter.querySelector('p[id$="status-message"]'); [cite_start]/* [cite: 396] */
    }
     
     if (!contentToSave) {
        console.error("Could not find content to save for:", topicTitle); [cite_start]/* [cite: 396] */
        if (statusEl) statusEl.textContent = "Error: Content not found."; [cite_start]/* [cite: 397] */
        return;
     }

     const fileName = `${cardName} - ${topicTitle}.md`.replace(/[/\\?%*:|"<>]/g, '-');
     await saveContentToDrive(contentToSave, fileName, statusEl);
}

async function saveContentToDrive(content, fileName, statusElement) {
    if (gapi.client.getToken() === null) {
        [cite_start]statusElement.textContent = 'Please /* [cite: 397] */
connect to Google Drive first.'; [cite_start]/* [cite: 398] */
        return;
    }

    statusElement.textContent = 'Saving to Google Drive...';
    const folderId = await getDriveFolderId();
    if (!folderId) {
        [cite_start]statusElement.textContent = 'Could not find /* [cite: 398] */
or create the app folder in Drive.'; [cite_start]/* [cite: 399] */
        return;
    }

    try {
        const searchResponse = await gapi.client.drive.files.list({
            q: `name='${fileName.replace(/'/g, "\\'")}' and '${folderId}' in parents and trashed=false`,
     
            [cite_start]fields: 'files(id)', /* [cite: 400] */
            spaces: 'drive'
        }); [cite_start]/* [cite: 400] */
        const boundary = '-------314159265358979323846'; [cite_start]/* [cite: 401] */
        const delimiter = "\r\n--" + boundary + "\r\n";
        const close_delim = "\r\n--" + boundary + "--"; [cite_start]/* [cite: 401] */
        const contentType = 'text/markdown'; [cite_start]/* [cite: 402] */
        const metadata = { name: fileName }; [cite_start]/* [cite: 402] */
        if (!searchResponse.result.files || searchResponse.result.files.length === 0) {
             metadata.parents = [folderId]; [cite_start]/* [cite: 403] */
        }
        
        const multipartRequestBody =
            delimiter + `Content-Type: application/json; [cite_start]/* [cite: 404] */
charset=UTF-8\r\n\r\n` + JSON.stringify(metadata) +
            delimiter + `Content-Type: ${contentType}\r\n\r\n` + content +
            close_delim; [cite_start]/* [cite: 405] */
        const fileExists = searchResponse.result.files && searchResponse.result.files.length > 0; [cite_start]/* [cite: 406] */
        const fileId = fileExists ? searchResponse.result.files[0].id : null; [cite_start]/* [cite: 406] */
        await gapi.client.request({
            path: `/upload/drive/v3/files${fileExists ? '/' + fileId : ''}`,
            method: fileExists ? 'PATCH' : 'POST',
            params: { uploadType: 'multipart' },
            [cite_start]headers: {'Content-Type': `multipart/related; /* [cite: 407] */
[cite_start]boundary="${boundary}"`}, /* [cite: 408] */
            body: multipartRequestBody
        }); [cite_start]/* [cite: 408] */
        statusElement.textContent = `File '${fileName}' ${fileExists ? 'updated' : 'saved'} in Drive!`; [cite_start]/* [cite: 409] */
// NEW: Clear the message after a delay
        setTimeout(() => {
            if (statusElement) statusElement.textContent = '';
        }, 4000); [cite_start]/* [cite: 410] */
    } catch (error) {
        console.error('Error saving file to Drive:', error); [cite_start]/* [cite: 411] */
        statusElement.textContent = 'Error saving file. Check console.'; [cite_start]/* [cite: 412] */
    }
}


function createPicker(mode, startInFolderId = null) { 
    if (!gisInited || !gapiInited) {
         console.error("Google services not ready for picker."); [cite_start]/* [cite: 412] */
         (document.getElementById('drive-status') || document.getElementById('modal-status-message')).textContent = 'Google API not ready.'; [cite_start]/* [cite: 413] */
         return;
     }
    
     const token = gapi.client.getToken()?.access_token; [cite_start]/* [cite: 413] */
     if (!token) {
         (document.getElementById('drive-status') || document.getElementById('modal-status-message')).textContent = 'You are not signed in.'; [cite_start]/* [cite: 414] */
         return;
     }
     const builder = new google.picker.PickerBuilder()
        .setOAuthToken(token)
        .setDeveloperKey(geminiApiKey); [cite_start]/* [cite: 415] */
     if (mode === 'open') {
        const view = new google.picker.View(google.picker.ViewId.DOCS); [cite_start]/* [cite: 416] */
        view.setMimeTypes("text/markdown,text/plain,.md"); [cite_start]/* [cite: 417] */
        if (startInFolderId) {
            view.setParent(startInFolderId); [cite_start]/* [cite: 417] */
        }
        builder.addView(view).setCallback(pickerCallbackOpen); [cite_start]/* [cite: 418] */
    } 

     const picker = builder.build();
     picker.setVisible(true); [cite_start]/* [cite: 419] */
}

async function pickerCallbackOpen(data) {
    if (data.action === google.picker.Action.PICKED) {
        const fileId = data.docs[0].id; [cite_start]/* [cite: 420] */
        const statusEl = document.getElementById('drive-status'); [cite_start]/* [cite: 421] */
        statusEl.textContent = 'Loading selected file...';
        try {
            const response = await gapi.client.drive.files.get({ fileId, alt: 'media' }); [cite_start]/* [cite: 421] */
            const fileContent = response.body; [cite_start]/* [cite: 422] */
            const fileName = data.docs[0].name;
            
            displayImportedGuide(fileName, fileContent);
            statusEl.textContent = 'File loaded successfully.';
            setTimeout(() => updateSigninStatus(true), 3000); [cite_start]/* [cite: 422] */
        } catch (error) {
            console.error("Error loading file content:", error); [cite_start]/* [cite: 423] */
            statusEl.textContent = 'Error loading file from Google Drive.'; [cite_start]/* [cite: 424] */
        }
    }
}

function displayImportedGuide(fileName, markdownContent) {
    const section = document.getElementById('imported-guides-section'); [cite_start]/* [cite: 424] */
    const container = document.getElementById('imported-guides-container'); [cite_start]/* [cite: 425] */
    section.classList.remove('hidden');

    const cardId = `imported-${fileName.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now()}`;
    
    const card = document.createElement('div');
    card.className = 'card';
    card.id = cardId; [cite_start]/* [cite: 425] */
    const cardContent = document.createElement('div');
    cardContent.className = 'p-8 card-content';
    
    cardContent.innerHTML = `
        <h2 class="text-2xl font-bold mb-2 themed-text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 inline-block mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
           
            Imported: ${fileName}
        </h2>
        <div class="prose max-w-none mt-4"></div>
    `; [cite_start]/* [cite: 427] */
    const renderTarget = cardContent.querySelector('.prose'); [cite_start]/* [cite: 428] */
    renderAccordionFromMarkdown(markdownContent, renderTarget, false);

    card.appendChild(cardContent);
    container.prepend(card);

    card.scrollIntoView({ behavior: 'smooth', block: 'start' }); [cite_start]/* [cite: 428] */
}

// --- Core Application Functions ---

async function loadAppContent() {
    try {
        await Promise.allSettled([loadAITailoringOptions(), loadDynamicPlaceholders()]); [cite_start]/* [cite: 429] */
    } catch (error) {
        console.error("An error occurred while loading app content:", error.message); [cite_start]/* [cite: 430] */
        throw error;
    }
}

async function generateAndPopulateAICategory(fullHierarchyPath) {
    const finalCategory = fullHierarchyPath[fullHierarchyPath.length - 1]; [cite_start]/* [cite: 431] */
    const cardId = `category-card-${finalCategory.id}`; [cite_start]/* [cite: 432] */
    const existingCard = document.getElementById(cardId);
    if (existingCard) {
        existingCard.scrollIntoView({ behavior: 'smooth', block: 'center' }); [cite_start]/* [cite: 432] */
        return;
    }

    const card = document.createElement('div');
    card.className = 'card'; [cite_start]/* [cite: 433] */
    card.id = cardId;
    card.dataset.fullHierarchyPath = JSON.stringify(fullHierarchyPath);
    
    const selectorId = `selector-${finalCategory.id}`; [cite_start]/* [cite: 434] */
    card.innerHTML = `<div class="p-8 card-content"><h2 class="text-2xl font-bold mb-2 themed-text-primary">${finalCategory.title}</h2><p class="mb-6 themed-text-muted">${finalCategory.description}</p><div id="${selectorId}" data-category-id="${finalCategory.id}" class="w-full">${getLoaderHTML(`AI is generating topics for ${finalCategory.title}...`)}</div><div id="details-${finalCategory.id}" class="details-container mt-4"></div></div>`; [cite_start]/* [cite: 435] */
    const container = document.getElementById('dynamic-card-container');
    container.prepend(card);
    card.scrollIntoView({ behavior: 'smooth', block: 'center' }); [cite_start]/* [cite: 436] */
    // NEW: Listen for user-added topics for this category
    listenForUserAddedTopics(finalCategory.id); [cite_start]/* [cite: 437] */
    try {
        const prompt = finalCategory.initialPrompt || [cite_start]/* [cite: 438] */
`Generate 8 common topics for ${finalCategory.title}.`; [cite_start]/* [cite: 439] */
        const jsonText = await callGeminiAPI(prompt, true, "Initial Category Population"); [cite_start]/* [cite: 439] */
        if (!jsonText) throw new Error(`API returned empty content for ${finalCategory.title}.`); [cite_start]/* [cite: 440] */
        
        const data = parseJsonWithCorrections(jsonText); [cite_start]/* [cite: 440] */
        if (!Array.isArray(data)) {
            console.error("API response for category topics is not an array:", data); [cite_start]/* [cite: 441] */
            throw new Error("Invalid API response format: Expected an array of topics for the category."); [cite_start]/* [cite: 442] */
        }
        
        data.sort((a, b) => a.title.localeCompare(b.title)); [cite_start]/* [cite: 443] */
        allThemeData[finalCategory.id] = data;
        
        populateCardGridSelector(card.querySelector(`#${selectorId}`), finalCategory.id);
        return card;

    } catch (error) {
        handleApiError(error, card.querySelector(`#${selectorId}`), finalCategory.title, card); [cite_start]/* [cite: 444] */
        throw error;
    }
}

function populateCardGridSelector(container, categoryId, newItemsIds = new Set()) {
    const data = allThemeData[categoryId] || [cite_start]/* [cite: 445] */
[]; [cite_start]/* [cite: 446] */
    const stickies = stickyTopics[categoryId] || [];
    const userAdded = userAddedTopics[categoryId] || []; [cite_start]/* [cite: 446] */
// NEW: Get user-added topics
    
    if (!container) return; [cite_start]/* [cite: 447] */
    if (data.length === 0 && stickies.length === 0 && userAdded.length === 0) {
         container.innerHTML = `<p class="themed-text-muted">No items to display.</p>`; [cite_start]/* [cite: 448] */
         return;
    }

    const gridClass = 'card-grid-container'; [cite_start]/* [cite: 449] */
    const card = container.closest('.card');
    const cardTitle = card.querySelector('h2').textContent;

    const stickyTitles = new Set(stickies.map(s => s.title)); [cite_start]/* [cite: 450] */
    const userAddedTitles = new Set(userAdded.map(u => u.title)); [cite_start]// NEW /* [cite: 451] */

    const stickyHtml = stickies.map(item => `
        <div id="grid-selector-${item.id}" class="grid-card-selector" data-topic-id="${item.id}" data-category-id="${categoryId}" title="${item.title}">
            <div class="indicator sticky-indicator" title="Sticky Topic">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" 
fill="currentColor"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L13 7.414V17a1 1 0 11-2 0V7.414L7.707 10.707a1 1 0 01-1.414-1.414l4-4z" clip-rule="evenodd" /></svg>
            </div>
            <div class="icon">${getIconForTheme(categoryId, item.id)}</div>
            <div class="mt-2 overflow-hidden"><div class="text-sm font-normal leading-tight block">${truncateText(item.title, 50)}</div></div>
        
        </div>`
    ).join(''); [cite_start]/* [cite: 453] */
// NEW: HTML for user-added topics
    const userAddedHtml = userAdded.map(item => `
        <div id="grid-selector-${item.id}" class="grid-card-selector" data-topic-id="${item.id}" data-category-id="${categoryId}" title="${item.title}">
            <div class="indicator" style="background-color: #f59e0b;" title="Your Added Topic">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" 
class="w-4 h-4"><path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.41-1.412A6.962 6.962 0 0010 11.5c-2.25 0-4.33.9-5.535 2.993z"></path></svg>
            </div>
            <div class="icon">${getIconForTheme(categoryId, item.id)}</div>
            <div class="mt-2 overflow-hidden"><div class="text-sm font-normal leading-tight block">${truncateText(item.title, 50)}</div></div>
  
              </div>`
    ).join(''); [cite_start]/* [cite: 456] */
    const regularItemsHtml = data
        .filter(item => !stickyTitles.has(item.title) && !userAddedTitles.has(item.title)) // MODIFIED: Also filter out user-added titles
        .map(item => {
            const compositeKey = `${cardTitle} - ${item.title}`;
            const isViewed = viewedItemIds.has(compositeKey);
    
            [cite_start]const isNew = newItemsIds.has(item.id); /* [cite: 458] */
            
            const viewedIndicatorHtml = isViewed ? `<div class="indicator viewed-indicator" title="Viewed"><svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg></div>` : '';
 
            const newClass = isNew ? 'new-item-highlight' : ''; [cite_start]/* [cite: 459] */
            
            return `
            [cite_start]<div id="grid-selector-${item.id}" class="grid-card-selector ${newClass}" data-topic-id="${item.id}" data-category-id="${categoryId}" title="${item.description || /* [cite: 459] */
item.title}">
                ${viewedIndicatorHtml}
                <div class="icon">${getIconForTheme(categoryId, item.id)}</div>
                <div class="mt-2 overflow-hidden"><div class="text-sm font-normal leading-tight block">${truncateText(item.title, 50)}</div></div>
                   
 </div>`;
    [cite_start]}).join(''); /* [cite: 461] */
    
    const topicInputId = `add-topic-input-${categoryId}`;
    const containerId = container.id;
    const addNewTopicHtml = `
        <div class="add-topic-container">
             
       <input type="text" id="${topicInputId}" name="${topicInputId}" placeholder="Add your own topic..." class="themed-input w-full p-2 rounded-lg text-sm">
            <button class="btn-secondary add-topic-button !px-4 !py-2" data-container-id="${containerId}" data-category-id="${categoryId}">Add Topic</button>
        </div>
    `; [cite_start]/* [cite: 462] */
    
    [cite_start]const fullHierarchyPath /* [cite: 462] */
= JSON.parse(card.dataset.fullHierarchyPath); [cite_start]/* [cite: 463] */
    const finalCategory = fullHierarchyPath[fullHierarchyPath.length - 1];
    const fullPrompt = finalCategory.fullPrompt;
    
    let actionButtonsHtml = ''; [cite_start]/* [cite: 463] */
// MODIFIED: Removed "Show All" button and changed text for generate more.
    if (fullPrompt && data.length > 0) {
        actionButtonsHtml = `<div class="col-span-full text-center mt-4"><button class="generate-more-button btn-secondary" data-container-id="${containerId}" data-category-id="${categoryId}" title="Use AI to generate more topics for this category"><span class="flex items-center justify-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>Add 8 more topics</span></button></div>`; [cite_start]/* [cite: 465] */
    }
    container.innerHTML = `<div class="${gridClass}">${stickyHtml}${userAddedHtml}${regularItemsHtml}</div>${addNewTopicHtml}<div class="mt-4">${actionButtonsHtml}</div>`; [cite_start]/* [cite: 466] */
}

async function handleAddNewTopic(button) {
    const { categoryId } = button.dataset; [cite_start]/* [cite: 467] */
    const inputField = button.previousElementSibling;
    const newTitle = inputField.value.trim();

    if (!newTitle) { inputField.focus(); return; [cite_start]/* [cite: 468] */
    }
    if (!userId) {
        displayMessageInModal("You must be logged in to add your own topics.", 'warning'); [cite_start]/* [cite: 469] */
        return;
    }

    const appId = firebaseConfig.appId || 'it-admin-hub-global'; [cite_start]/* [cite: 470] */
// NEW: Path for user-added topics
    const userTopicsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/userTopics/${categoryId}/topics`); [cite_start]/* [cite: 471] */
    button.disabled = true;
    button.innerHTML = 'Adding...';

    try {
        const newTopicData = {
            title: newTitle,
            id: `${sanitizeTitle(newTitle).replace(/\s+/g, '-')}-${Date.now()}`,
            description: `Custom user-added topic: ${newTitle}`,
       
             createdAt: Timestamp.now()
        }; [cite_start]/* [cite: 473] */
        await addDoc(userTopicsCollectionRef, newTopicData); [cite_start]/* [cite: 474] */
        inputField.value = '';
        // The onSnapshot listener will automatically update the UI.
    } catch (error) {
        console.error("Error adding user topic to Firebase:", error); [cite_start]/* [cite: 475] */
        displayMessageInModal(`Could not add topic: ${error.message}`, 'error'); [cite_start]/* [cite: 476] */
    } finally {
        button.disabled = false; [cite_start]/* [cite: 476] */
        button.innerHTML = 'Add Topic'; [cite_start]/* [cite: 477] */
    }
}

async function handleGenerateMoreClick(button) {
    const { containerId, categoryId } = button.dataset; [cite_start]/* [cite: 477] */
    const container = document.getElementById(containerId);
    if (!container || !categoryId || !allThemeData[categoryId]) return;

    button.disabled = true; [cite_start]/* [cite: 478] */
    button.innerHTML = `<span class="flex items-center justify-center gap-2"><div class="loader themed-loader" style="width:20px; height:20px; border-width: 2px;"></div>Generating...</span>`; [cite_start]/* [cite: 479] */

    const card = container.closest('.card'); [cite_start]/* [cite: 479] */
    const fullHierarchyPath = JSON.parse(card.dataset.fullHierarchyPath); [cite_start]/* [cite: 480] */
    const categoryTitle = fullHierarchyPath[fullHierarchyPath.length - 1].title;
    const existingTitles = allThemeData[categoryId].map(item => item.title); [cite_start]/* [cite: 480] */
    const prompt = `Generate 8 new and unique administrative task ideas for the IT category "${categoryTitle}". [cite_start]/* [cite: 481] */
These tasks must be different from the ones in the following list. [cite_start]/* [cite: 482] */
Existing Task List:\n- ${existingTitles.join('\n- ')}\n
            For each new task, provide a unique "id", a "title", and a short "description". [cite_start]/* [cite: 483] */
            Return the response as a valid JSON array.`; [cite_start]/* [cite: 484] */

    try {
        const jsonText = await callGeminiAPI(prompt, true, "Generate More Topics"); [cite_start]/* [cite: 484] */
        if (!jsonText) throw new Error("AI did not return any new items."); [cite_start]/* [cite: 485] */

        const newItems = parseJsonWithCorrections(jsonText); [cite_start]/* [cite: 485] */
        const newItemIds = new Set(newItems.map(item => item.id));
        
        newItems.forEach(newItem => {
            if (!allThemeData[categoryId].some(existing => existing.id === newItem.id || existing.title === newItem.title)) {
                allThemeData[categoryId].push(newItem);
            }
        }); [cite_start]/* [cite: 486] */
        allThemeData[categoryId].sort((a, b) => a.title.localeCompare(b.title)); [cite_start]/* [cite: 487] */
        populateCardGridSelector(container, categoryId, newItemIds);
        document.getElementById(`details-${categoryId}`).innerHTML = ''; [cite_start]/* [cite: 487] */
    } catch (error) {
        console.error(`Error generating more items for ${categoryId}:`, error); [cite_start]/* [cite: 488] */
        const originalButtonHTML = button.innerHTML;
        button.disabled = false;
        button.innerHTML = 'Error. Try Again.';
        button.classList.add('bg-red-100', 'text-red-700'); [cite_start]/* [cite: 489] */
        setTimeout(() => {
            button.classList.remove('bg-red-100', 'text-red-700');
            button.innerHTML = originalButtonHTML.replace('Generating...','Add 8 more topics');
        }, 3000); [cite_start]/* [cite: 490] */
    } 
}

async function handleGridSelect(target) {
    const { topicId, categoryId } = target.dataset; [cite_start]/* [cite: 491] */
    // MODIFIED: Check user-added topics as well
    let item = allThemeData[categoryId]?.find(d => String(d.id) === String(topicId)) || [cite_start]/* [cite: 492] */
        stickyTopics[categoryId]?.find(d => String(d.id) === String(topicId)) || [cite_start]/* [cite: 493] */
               userAddedTopics[categoryId]?.find(d => String(d.id) === String(topicId)); [cite_start]/* [cite: 493] */
    if (!item) {
        console.error("Could not find theme item for:", {topicId, categoryId}); [cite_start]/* [cite: 494] */
        return;
    }
    
    const gridContainer = target.closest('.card-grid-container'); [cite_start]/* [cite: 495] */
    if (gridContainer) {
        const currentlyActive = gridContainer.querySelector('.active'); [cite_start]/* [cite: 496] */
        if (currentlyActive) currentlyActive.classList.remove('active');
        target.classList.add('active');
    }

    const card = target.closest('.card'); [cite_start]/* [cite: 497] */
    const fullHierarchyPath = JSON.parse(card.dataset.fullHierarchyPath);
    const cardTitle = fullHierarchyPath[fullHierarchyPath.length - 1].title;
    
    await markItemAsViewed(cardTitle, item.title); [cite_start]/* [cite: 498] */
    if (!target.querySelector('.viewed-indicator') && !target.querySelector('.sticky-indicator') && !target.querySelector('[title="Your Added Topic"]')) {
        const indicator = document.createElement('div'); [cite_start]/* [cite: 499] */
        indicator.className = 'indicator viewed-indicator'; [cite_start]/* [cite: 500] */
        indicator.title = 'Viewed';
        indicator.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg></div>`;
        target.prepend(indicator); [cite_start]/* [cite: 501] */
    }

    const prompt = `
        You are creating a summary for an IT administration guide. [cite_start]/* [cite: 501] */
        The overall category is: "${cardTitle}"
        The category description is: "${item.description || 'General task'}"
        The specific topic is: "${item.title}"
        Based on this context, generate a very brief, condensed summary for the guide on "${item.title}". [cite_start]/* [cite: 502] */
        For each section (Objective, Pre-requisites, Key Steps, Verification, Helpful Resources), provide a single descriptive sentence. [cite_start]/* [cite: 503] */
        Return the response as a simple markdown string where each section is a bullet point, starting with '*'.
    `; [cite_start]/* [cite: 504] */
    const resultContainer = document.getElementById(`details-${categoryId}`);
    resultContainer.innerHTML = getLoaderHTML(`Generating summary for ${item.title}...`); [cite_start]/* [cite: 505] */
    try {
        let resultText = await callGeminiAPI(prompt, false, "Generate Topic Summary"); [cite_start]/* [cite: 506] */
        resultText = resultText ? resultText.replace(/^```(markdown)?\n?/g, '').replace(/\n?```$/g, '').trim() : ''; [cite_start]/* [cite: 507] */
        originalGeneratedText.set(topicId, resultText); 
        
        const resultHtml = marked.parse(resultText || ''); [cite_start]/* [cite: 507] */
        resultContainer.innerHTML = `<div class="prose max-w-none">${resultHtml}</div>`;

        addPostGenerationButtons(resultContainer, topicId, categoryId);
    } catch (error) {
        handleApiError(error, resultContainer, `guide for ${item.title}`); [cite_start]/* [cite: 508] */
    }
}

async function markItemAsViewed(cardTitle, buttonTitle) {
    if (!viewedItemsCollectionRef) return; [cite_start]/* [cite: 509] */
    const compositeKey = `${cardTitle} - ${buttonTitle}`; [cite_start]/* [cite: 510] */
    try {
        const docRef = doc(viewedItemsCollectionRef, compositeKey); [cite_start]/* [cite: 510] */
        await setDoc(docRef, { viewedAt: Timestamp.fromDate(new Date()) }); [cite_start]/* [cite: 511] */
    } catch (error) {
        console.error("Error marking item as viewed:", error); [cite_start]/* [cite: 511] */
    }
}

async function handleGeminiSubmit(e) {
    e.preventDefault(); [cite_start]/* [cite: 512] */
    const promptInput = document.getElementById('gemini-prompt');
    const userPrompt = promptInput.value.trim();
    if (!userPrompt) return;

    const titleEl = document.getElementById('inDepthModalTitle');
    const contentEl = document.getElementById('inDepthModalContent'); [cite_start]/* [cite: 513] */
    const footerEl = document.getElementById('inDepthModalFooter'); [cite_start]/* [cite: 514] */
    const buttonContainer = document.getElementById('inDepthModalButtons');

    const fullTitle = `Custom Guide: ${userPrompt}`;
    titleEl.textContent = truncateText(fullTitle, 40); [cite_start]/* [cite: 514] */
    contentEl.innerHTML = getLoaderHTML(`Generating initial sections for your custom guide for "${userPrompt}"...`);
    buttonContainer.innerHTML = '';
    document.getElementById('modal-status-message').textContent = '';
    
    footerEl.dataset.fullTitle = fullTitle; [cite_start]/* [cite: 515] */
    footerEl.dataset.cardName = "Custom Task";  [cite_start]/* [cite: 516] */
    
    openModal('inDepthModal');
    
    const selectedOptions = Array.from(document.querySelectorAll('#tailoring-buttons-container .btn-toggle.active'))
                                .map(btn => btn.textContent.trim())
                                .join(', '); [cite_start]/* [cite: 516] */
    const initialCustomPrompt = `
Persona: You are an expert senior IT administrator and technical writer AI. [cite_start]/* [cite: 517] */
Objective: Your task is to generate ONLY the "Introduction", "Architectural Overview", "Key Concepts & Terminology", and "Prerequisites" sections for a comprehensive IT administration guide. [cite_start]/* [cite: 518] */
This output will serve as the foundational "blueprint" for a more detailed guide later. [cite_start]/* [cite: 519] */
//-- BLUEPRINT DETAILS --//
- **Topic:** "${userPrompt}"
- **Context:** "Custom user-generated topic"
- **Tailoring Options:** "${selectedOptions || 'None'}"

//-- INSTRUCTIONS --//
1.  **Generate Four Sections Only:** Create detailed content exclusively for:
    * ### 1. Introduction
    * ### 2. Architectural Overview
    * ### 3. Key Concepts & Terminology
    * ### 4. Prerequisites
2.  **Define Scope Clearly:** Within the "Introduction" section, you MUST clearly state the scope. [cite_start]/* [cite: 520] */
For example, explicitly mention if the guide will cover GUI, PowerShell, and/or API methods. [cite_start]/* [cite: 521] */
This is critical as it will dictate the content of the full guide. [cite_start]/* [cite: 522] */
3.  **Professional & Accurate:** The content must be technically accurate, detailed, and written in a professional tone suitable for experienced IT administrators. [cite_start]/* [cite: 523] */
4.  **Markdown Format:** Use '###' for section headers.

Return only the markdown for these four sections. [cite_start]/* [cite: 524] */
Do not include any other content or explanatory text.`; [cite_start]/* [cite: 525] */

    try {
        let initialResultText = await callGeminiAPI(initialCustomPrompt, false, "Generate Custom Guide (Initial)"); [cite_start]/* [cite: 525] */
        initialResultText = initialResultText ? initialResultText.replace(/^```(markdown)?\n?/g, '').replace(/\n?```$/g, '').trim() : ''; [cite_start]/* [cite: 526] */
        
        originalGeneratedText.set(fullTitle, initialResultText);
        
        contentEl.innerHTML = '';
        renderAccordionFromMarkdown(initialResultText, contentEl, false); [cite_start]/* [cite: 526] */
        const dummyHierarchy = [{title: "Custom Topic", description: `A guide for ${userPrompt}`}]; [cite_start]/* [cite: 527] */
        footerEl.dataset.fullHierarchyPath = JSON.stringify(dummyHierarchy);

        addModalActionButtons(buttonContainer, true); [cite_start]/* [cite: 527] */
    } catch(error) {
        handleApiError(error, contentEl, 'custom IT guide (initial sections)'); [cite_start]/* [cite: 528] */
    } finally {
        promptInput.value = ''; [cite_start]/* [cite: 529] */
    }
}

function parseJsonWithCorrections(jsonString) {
    if (!jsonString || typeof jsonString !== 'string') {
        throw new Error("Invalid input: not a string."); [cite_start]/* [cite: 530] */
    }
    let cleanedString = jsonString.replace(/```(json|markdown)?\n?/g, '').replace(/```/g, '').trim(); [cite_start]/* [cite: 531] */
    try {
        return JSON.parse(cleanedString); [cite_start]/* [cite: 532] */
    } catch (error) {
        console.warn("Initial JSON.parse failed. Attempting correction for common errors.", error); [cite_start]/* [cite: 533] */
        try {
            const correctedJsonString = cleanedString
                .replace(/\\'/g, "'") 
                .replace(/([{\s,])(\w+)(:)/g, '$1"$2"$3'); [cite_start]/* [cite: 534] */
            return JSON.parse(correctedJsonString); [cite_start]/* [cite: 535] */
        } catch (finalError) {
             console.error("Failed to parse JSON even after cleaning:", finalError); [cite_start]/* [cite: 535] */
             console.error("Original string received from API:", jsonString); [cite_start]/* [cite: 536] */
            console.error("String after cleaning attempts:", cleanedString); [cite_start]/* [cite: 536] */
            throw new Error(`JSON Parse Error: ${finalError.message}. Check console for the problematic string.`); [cite_start]/* [cite: 537] */
        }
    }
}

function logAiInteraction(prompt, response, type) {
    aiLog.push({
        timestamp: new Date(),
        type: type,
             
        [cite_start]prompt: prompt, /* [cite: 539] */
        response: response
    }); [cite_start]/* [cite: 539] */
}

async function callApi(apiUrl, payload, authorization = null) {
    const controller = new AbortController(); [cite_start]/* [cite: 540] */
    const timeoutId = setTimeout(() => controller.abort(), 90000); [cite_start]/* [cite: 541] */

    const headers = { 'Content-Type': 'application/json' }; [cite_start]/* [cite: 541] */
    if (authorization) {
        headers['Authorization'] = authorization; [cite_start]/* [cite: 542] */
    }

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload),
   
            signal: controller.signal
        }); [cite_start]/* [cite: 544] */
        clearTimeout(timeoutId); [cite_start]/* [cite: 545] */

        if (!response.ok) {
            let errorBody; [cite_start]/* [cite: 545] */
            try { errorBody = await response.json(); } catch { errorBody = await response.text(); [cite_start]/* [cite: 546] */
            }
            console.error("API Error Response:", { status: response.status, body: errorBody }); [cite_start]/* [cite: 547] */
            const errorMsg = errorBody?.error?.message || response.statusText;
            throw new Error(`API request failed with status ${response.status}. Message: ${errorMsg}`); [cite_start]/* [cite: 548] */
        }
        return await response.json(); [cite_start]/* [cite: 549] */
    } catch (error) {
        clearTimeout(timeoutId); [cite_start]/* [cite: 550] */
        if (error.name === 'AbortError') throw new Error('The AI service request timed out. Please try again.'); [cite_start]/* [cite: 551] */
        throw error; [cite_start]/* [cite: 551] */
    }
}

async function callGeminiAPI(prompt, isJson = false, logType = "General") {
    if (!geminiApiKey) {
        throw new Error("Gemini API Key is not set. Please enter it in the initial modal."); [cite_start]/* [cite: 552] */
    }
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`; [cite_start]/* [cite: 553] */
    const payload = { contents: [{ parts: [{ text: prompt }] }] }; [cite_start]/* [cite: 554] */
    if (isJson) {
        payload.generationConfig = { responseMimeType: "application/json", maxOutputTokens: 8192 }; [cite_start]/* [cite: 555] */
    }
    const result = await callApi(apiUrl, payload); [cite_start]/* [cite: 556] */
    const responseText = result?.candidates?.[0]?.content?.parts?.[0]?.text || null; [cite_start]/* [cite: 557] */
    logAiInteraction(prompt, responseText, logType);
    return responseText; [cite_start]/* [cite: 557] */
}

async function callImageGenAPI(prompt) {
    const token = gapi.client.getToken(); [cite_start]/* [cite: 558] */
    if (!token) {
        throw new Error("Please connect your Google Account to generate images."); [cite_start]/* [cite: 559] */
    }
    if (!firebaseConfig || !firebaseConfig.projectId) {
        throw new Error("Firebase project ID is not configured. Cannot make image generation request."); [cite_start]/* [cite: 560] */
    }

    const apiUrl = `https://us-central1-aiplatform.googleapis.com/v1/projects/${firebaseConfig.projectId}/locations/us-central1/publishers/google/models/imagegeneration@0.0.5:predict`; [cite_start]/* [cite: 561] */
    const payload = { instances: [{ prompt: prompt }], parameters: { "sampleCount": 1 } }; [cite_start]/* [cite: 562] */
    const authHeader = `Bearer ${token.access_token}`; [cite_start]/* [cite: 562] */
    const result = await callApi(apiUrl, payload, authHeader);
    const base64 = result?.predictions?.[0]?.bytesBase64Encoded;
    return base64 ? `data:image/png;base64,${base64}` : null; [cite_start]/* [cite: 563] */
}

async function callColorGenAPI(prompt) {
    const fullPrompt = `Based on the theme "${prompt}", generate a color palette. [cite_start]/* [cite: 564] */
I need a JSON object with keys: "bg", "text", "primary", "primaryDark", "accent", "cardBg", "cardBorder", "textMuted", "inputBg", "inputBorder", "buttonText". [cite_start]/* [cite: 565] */
Determine if the "primary" color is light or dark to set the "buttonText" appropriately (#FFFFFF for dark, #111827 for light). [cite_start]/* [cite: 566] */
${jsonInstruction}`;
    const jsonText = await callGeminiAPI(fullPrompt, true, "Generate Color Theme");
    if (jsonText) return parseJsonWithCorrections(jsonText); [cite_start]/* [cite: 567] */
    throw new Error("Could not parse a valid color theme from API response."); [cite_start]/* [cite: 568] */
}

function handleApiError(error, container, contentType = 'content') {
    console.error(`Error generating ${contentType}:`, error); [cite_start]/* [cite: 569] */
    const errorMessage = generateErrorMessage(error, contentType); [cite_start]/* [cite: 570] */
    if (container) {
        container.innerHTML = `<div class="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">${errorMessage}</div>`; [cite_start]/* [cite: 570] */
    }
}

async function generateAndApplyDefaultTheme() {
    showThemeLoading(true); [cite_start]/* [cite: 571] */
    const themePrompt = "Modern Data Center";
    const imagePrompt = `Artistic, abstract background image inspired by "${themePrompt}". [cite_start]/* [cite: 572] */
Suitable for an IT administration website. Professional, clean. Wide aspect ratio, photographic, cinematic lighting.`; [cite_start]/* [cite: 573] */
    try {
        const colors = await callColorGenAPI(themePrompt); [cite_start]/* [cite: 574] */
        applyTheme(colors);

        if (gapi.client.getToken()) {
            const imageUrl = await callImageGenAPI(imagePrompt); [cite_start]/* [cite: 575] */
            applyHeaderImage(imageUrl); [cite_start]/* [cite: 576] */
        } else {
            console.warn("Skipping default header image generation: Google user not signed in."); [cite_start]/* [cite: 576] */
        }

    } catch (error) {
        handleApiError(null, null, 'default theme'); [cite_start]/* [cite: 577] */
        console.error("Failed to generate default theme, continuing with default styles.", error); [cite_start]/* [cite: 578] */
    } finally {
        showThemeLoading(false); [cite_start]/* [cite: 579] */
    }
}

async function loadAITailoringOptions() {
    const container = document.getElementById('tailoring-buttons-container'); [cite_start]/* [cite: 580] */
    container.innerHTML = getLoaderHTML('Loading AI options...'); [cite_start]/* [cite: 581] */
    try {
        const prompt = `Generate a comprehensive list of 16 diverse keywords and concepts for tailoring IT administration guides. [cite_start]/* [cite: 581] */
The list should cover a wide range of topics including security, performance, automation, specific technologies (like PowerShell, Ansible), methodologies (like IaC), and user levels (like 'for beginners', 'for experts'). [cite_start]/* [cite: 582] */
Return ONLY a valid JSON array of strings. IMPORTANT: Ensure any double quotes inside the strings are properly escaped.`; [cite_start]/* [cite: 583] */
        const jsonText = await callGeminiAPI(prompt, true, "Load Tailoring Options"); [cite_start]/* [cite: 584] */
        if (!jsonText) {
            throw new Error("AI did not return any tailoring options."); [cite_start]/* [cite: 584] */
        }
        const options = parseJsonWithCorrections(jsonText); [cite_start]/* [cite: 585] */
        populateTailoringButtons(options);
    } catch (error) {
        handleApiError(error, container, 'tailoring options'); [cite_start]/* [cite: 586] */
        const fallbackOptions = ["Security Hardening", "Performance Tuning", "Automation Script", "For Beginners"];
        populateTailoringButtons(fallbackOptions); [cite_start]/* [cite: 587] */
    }
}


function populateTailoringButtons(options) {
    const container = document.getElementById('tailoring-buttons-container'); [cite_start]/* [cite: 588] */
    container.innerHTML = options.map(option =>
        `<button type="button" class="btn-toggle text-sm px-3 py-1 rounded-full">${option}</button>`
    ).join(''); [cite_start]/* [cite: 589] */
}

async function loadDynamicPlaceholders() {
    const promptInput = document.getElementById('gemini-prompt'); [cite_start]/* [cite: 590] */
    const prompt = `Generate a JSON array of 3 creative IT administration task ideas for input placeholders. [cite_start]/* [cite: 591] */
Examples: "Onboard a new employee", "Decommission a legacy server". Return ONLY the valid JSON array of strings, ensuring any double quotes inside the strings are properly escaped (e.g., \\"like this\\").`; [cite_start]/* [cite: 592] */
    try {
        const jsonText = await callGeminiAPI(prompt, true, "Load Placeholders"); [cite_start]/* [cite: 593] */
        if(!jsonText) return;
        const placeholders = parseJsonWithCorrections(jsonText);
        if (placeholders && placeholders.length > 0) {
            let i = 0; [cite_start]/* [cite: 594] */
            promptInput.placeholder = `e.g., '${placeholders[i]}'`;
            setInterval(() => {
                i = (i + 1) % placeholders.length;
                promptInput.placeholder = `e.g., '${placeholders[i]}'`;
            }, 3000); [cite_start]/* [cite: 595] */
        }
    } catch(error) {
        console.error("Could not load dynamic placeholders", error); [cite_start]/* [cite: 596] */
    }
}

function applyTheme(colors) {
    Object.entries(colors).forEach(([key, value]) => {
        const cssVar = `--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
        root.style.setProperty(cssVar, value);
    }); [cite_start]/* [cite: 597] */
}

function applyHeaderImage(imageUrl) {
    if (!imageUrl) return; [cite_start]/* [cite: 598] */
    const bgImageDiv = document.getElementById('header-bg-image');
    bgImageDiv.style.backgroundImage = `url('${imageUrl}')`;
}

function showThemeLoading(isLoading) {
    const loader = document.getElementById('header-loader'); [cite_start]/* [cite: 599] */
    loader.classList.toggle('hidden', !isLoading); [cite_start]/* [cite: 600] */
    loader.classList.toggle('flex', isLoading);
}

function getAppPrompts() {
    const prompts = {}; [cite_start]/* [cite: 600] */
    prompts["Full Guide Generation Prompt"] = getFullGuideGenerationPrompt(); [cite_start]/* [cite: 601] */
    prompts["Refinement Prompt"] = getRefinementPrompt();
    prompts["Final Review Prompt"] = finalReviewPrompt;
    return prompts; [cite_start]/* [cite: 601] */
}

function displayPromptsInModal() {
    const contentEl = document.getElementById('promptsModalContent'); [cite_start]/* [cite: 602] */
    contentEl.innerHTML = ''; [cite_start]/* [cite: 603] */

    const prompts = getAppPrompts();

    for (const [title, promptText] of Object.entries(prompts)) {
        const promptContainer = document.createElement('div'); [cite_start]/* [cite: 603] */
        promptContainer.className = 'mb-6';
        
        const promptTitle = document.createElement('h3');
        promptTitle.className = 'text-lg font-semibold themed-text-accent mb-2';
        promptTitle.textContent = title;
        promptContainer.appendChild(promptTitle); [cite_start]/* [cite: 604] */
        const codeBlockContainer = document.createElement('div');
        codeBlockContainer.className = 'code-block-container !mt-0';
        
        const header = document.createElement('div');
        header.className = 'code-block-header';
        header.innerHTML = `<span>Prompt</span><button class="copy-code-button">Copy</button>`;
        codeBlockContainer.appendChild(header); [cite_start]/* [cite: 605] */
        const pre = document.createElement('pre');
        pre.className = 'text-sm';
        pre.style.color = 'var(--code-text)';
        pre.textContent = promptText;
        codeBlockContainer.appendChild(pre);
        
        promptContainer.appendChild(codeBlockContainer);
        contentEl.appendChild(promptContainer); [cite_start]/* [cite: 606] */
    }

    openModal('promptsModal'); [cite_start]/* [cite: 607] */
}

function getRefinementPrompt(originalText = '{original_text}', refinementRequest = '{refinement_request}') {
    return `Persona: You are a Master Technical Editor and Content Strategist AI. [cite_start]/* [cite: 608] */
You specialize in interpreting revision requests and surgically modifying existing technical content to meet new requirements while upholding the highest standards of quality. [cite_start]/* [cite: 609] */
Core Mandate: Your task is to analyze the ORIGINAL TEXT and the USER'S REVISION DIRECTIVE provided below. [cite_start]/* [cite: 610] */
You must then rewrite the original text to flawlessly execute the user's directive, producing a new, complete, and professionally polished version of the text. [cite_start]/* [cite: 611] */
//-- INPUT 1: ORIGINAL TEXT --//
${originalText}

//-- INPUT 2: USER'S REVISION DIRECTIVE --//
${refinementRequest}

//-- GUIDING PRINCIPLES FOR REVISION --//
- **Interpret Intent:** Understand the objective behind the directive. [cite_start]/* [cite: 612] */
If the user asks to "make it simpler," you must simplify terminology, rephrase complex sentences, and perhaps add analogies. [cite_start]/* [cite: 613] */
- **Seamless Integration:** The new content must flow naturally. The final output should feel like a single, cohesive piece. [cite_start]/* [cite: 614] */
- **Maintain Structural Integrity:** Preserve the original markdown formatting unless the directive requires a structural change. [cite_start]/* [cite: 615] */
- **Uphold Technical Accuracy:** Ensure any changes or additions are technically accurate and align with modern best practices. [cite_start]/* [cite: 616] */
Final Output Instruction
Return ONLY the new, complete, and rewritten markdown text. [cite_start]/* [cite: 617] */
Do not provide a preamble, an explanation of your changes, or any text other than the final, revised content itself.`; [cite_start]/* [cite: 618] */
}

// ** ENHANCED PROMPT FUNCTION **
function getFullGuideGenerationPrompt(context = {}) {
    const hierarchy = context.hierarchyContext || [cite_start]/* [cite: 619] */
[]; [cite_start]/* [cite: 620] */
    const task = context.task || '{task}';
    const options = context.options || '{options}'; [cite_start]/* [cite: 620] */
    const topicTechnology = hierarchy.map(h => h.title).join(' - ') || 'General IT'; [cite_start]/* [cite: 621] */
    const specificGoal = `A complete reference guide to designing, implementing, and troubleshooting for the task: ${task}.`; [cite_start]/* [cite: 622] */
    const targetAudience = `An IT administrator with 3-5 years of experience who understands basic concepts related to ${hierarchy[0]?.title || [cite_start]/* [cite: 622] */
'the topic'}.`; [cite_start]/* [cite: 624] */
    const inScope = `Management via GUI, CLI (PowerShell/bash), and APIs where applicable for the task: ${task}. ${options}`; [cite_start]/* [cite: 624] */
    const outOfScope = `Basic setup of the core technology (e.g., installing Windows Server). Licensing or cost analysis.`; [cite_start]/* [cite: 625] */
    return `Persona: You are an elite-level AI, functioning as a Senior IT Administrator and a Principal Technical Writer. [cite_start]/* [cite: 626] */
Mission: Produce a definitive, practical, and deeply conceptual reference guide based on the blueprint provided below. [cite_start]/* [cite: 627] */
Your output must be exhaustive, clear, and focused entirely on the defined scope. [cite_start]/* [cite: 628] */
The goal is for a technical professional to transition from having a basic awareness of a topic to possessing a deep and applicable understanding of its core concepts and management. [cite_start]/* [cite: 629] */
//-- GUIDE BLUEPRINT & SCOPE --//
1. Topic Technology: ${topicTechnology}
2. Specific Goal: ${specificGoal}
3. Target Audience: ${targetAudience}
4. IN-SCOPE (Must be included):
${inScope}
5. OUT-OF-SCOPE (Must be excluded):
${outOfScope}

//-- CRITICAL STRUCTURE & FORMATTING RULES --//
A. Markdown Formatting: You MUST format each of the 12 main sections below with a ### header. [cite_start]/* [cite: 630] */
Example: ### 1. Introduction.

B. Required Guide Content (Generate all 12 sections):
1. Introduction: Overview, Importance, What You'll Learn. [cite_start]/* [cite: 631] */
2. Architectural Overview: Components and interactions.
3. Key Concepts & Terminology: Definitions only.
4. Prerequisites: Permissions, Software/Licensing, System Requirements. [cite_start]/* [cite: 632] */
5. Key Concepts - In-Depth Application & Management: CRITICAL SECTION. [cite_start]/* [cite: 633] */
For each concept from Section 3, provide detailed mini-guides for GUI, PowerShell/CLI, and API/SDK management. [cite_start]/* [cite: 634] */
**Crucially, for each technique, you MUST provide at least one clear, practical example of what a user would actually type or do. [cite_start]/* [cite: 635] */
Use markdown blockquotes to showcase these example prompts or code snippets so the user can copy them directly.**
6. Verification and Validation: Specific commands/procedures to confirm correct configuration. [cite_start]/* [cite: 636] */
7. Best Practices: Expert advice for implementation and management.
8. Automation Techniques for Key Concepts: Concept-specific automation opportunities with full scripts. [cite_start]/* [cite: 637] */
9. Security Considerations: Concept-specific hardening, vulnerabilities, and auditing.
10. Advanced Use Cases & Scenarios: 2-3 advanced examples combining concepts. [cite_start]/* [cite: 638] */
11. Troubleshooting: A table of common problems, causes, and solutions by concept. [cite_start]/* [cite: 639] */
12. Helpful Resources: Bulleted list of high-quality, working links to official documentation. [cite_start]/* [cite: 640] */
//-- MANDATORY QUALITY STANDARDS --//
1.  **Factual Accuracy:** All technical content, especially code snippets, API endpoints, and procedural steps, MUST be factually correct and based on current, official documentation. [cite_start]/* [cite: 641] */
2.  **No Placeholders:** Your output MUST NOT contain placeholder links, hypothetical API endpoints (e.g., "api.gemini.example.com"), or notes to the user like "(Replace with actual link)". [cite_start]/* [cite: 642] */
You must use your capabilities to find and provide real, authoritative information. [cite_start]/* [cite: 643] */
3.  **PowerShell/CLI Standards:** Scripts must be robust and production-ready. [cite_start]/* [cite: 644] */
This includes using modern cmdlets, server-side filtering (e.g., \`-Filter\`), and comprehensive \`try/catch\` error handling with \`-ErrorAction Stop\`. [cite_start]/* [cite: 645] */
4.  **Professional Tone:** The guide must be written in a clean, professional voice. [cite_start]/* [cite: 646] */
Do not include your own meta-commentary or asides (e.g., "Pro Tip:", "Note:", "This is a hypothetical example"). [cite_start]/* [cite: 647] */
Instead, integrate advice naturally into the text.`; [cite_start]/* [cite: 648] */
}

async function handleExploreInDepth(topicId, fullHierarchyPath) {
    const categoryId = fullHierarchyPath[fullHierarchyPath.length - 1].id; [cite_start]/* [cite: 648] */
    const item = allThemeData[categoryId]?.find(d => String(d.id) === String(topicId)) ||
               stickyTopics[categoryId]?.find(d => String(d.id) === String(topicId)) ||
               userAddedTopics[categoryId]?.find(d => String(d.id) === String(topicId)); [cite_start]/* [cite: 649] */
    if (!item) {
        console.error("Could not find item for in-depth view", { topicId, categoryId }); [cite_start]/* [cite: 650] */
        return;
    }

    const titleEl = document.getElementById('inDepthModalTitle'); [cite_start]/* [cite: 651] */
    const contentEl = document.getElementById('inDepthModalContent');
    const footerEl = document.getElementById('inDepthModalFooter');
    const buttonContainer = document.getElementById('inDepthModalButtons');

    const fullTitle = `In-Depth: ${item.title}`;
    titleEl.textContent = fullTitle; [cite_start]/* [cite: 652] */
    contentEl.innerHTML = getLoaderHTML(`Generating foundational guide for ${item.title}...`);
    buttonContainer.innerHTML = '';
    document.getElementById('modal-status-message').textContent = '';

    footerEl.dataset.topicId = topicId;
    footerEl.dataset.fullHierarchyPath = JSON.stringify(fullHierarchyPath); [cite_start]/* [cite: 653] */
    footerEl.dataset.fullTitle = fullTitle;
    footerEl.dataset.cardName = fullHierarchyPath.map(p => p.title).join(' / ');

    openModal('inDepthModal');
    
    const contextString = fullHierarchyPath.map(p => p.title).join(' -> '); [cite_start]/* [cite: 654] */
    const initialPrompt = `
Persona: You are an expert senior IT administrator and technical writer AI. [cite_start]/* [cite: 655] */
Objective: Your task is to generate ONLY the "Introduction", "Architectural Overview", "Key Concepts & Terminology", and "Prerequisites" sections for a comprehensive IT administration guide. [cite_start]/* [cite: 656] */
This output will serve as the foundational "blueprint" for a more detailed guide later. [cite_start]/* [cite: 657] */
//-- BLUEPRINT DETAILS --//
- **Topic:** "${item.title}"
- **Context:** "${contextString}"
- **Tailoring Options:** "None"

//-- INSTRUCTIONS --//
1.  **Generate Four Sections Only:** Create detailed content exclusively for:
    * ### 1. Introduction
    * ### 2. Architectural Overview
    * ### 3. Key Concepts & Terminology
    * ### 4. Prerequisites
2.  **Define Scope Clearly:** Within the "Introduction" section, you MUST clearly state the scope. [cite_start]/* [cite: 658] */
For example, explicitly mention if the guide will cover GUI, PowerShell, and/or API methods. [cite_start]/* [cite: 659] */
This is critical as it will dictate the content of the full guide. [cite_start]/* [cite: 660] */
3.  **Professional & Accurate:** The content must be technically accurate, detailed, and written in a professional tone suitable for experienced IT administrators. [cite_start]/* [cite: 661] */
4.  **Markdown Format:** Use '###' for section headers.

Return only the markdown for these four sections. [cite_start]/* [cite: 662] */
Do not include any other content or explanatory text.`; [cite_start]/* [cite: 663] */

    try {
        let initialResultText = await callGeminiAPI(initialPrompt, false, "Explore In-Depth (Initial)"); [cite_start]/* [cite: 663] */
        initialResultText = initialResultText ? initialResultText.replace(/^```(markdown)?\n?/g, '').replace(/\n?```$/g, '').trim() : ''; [cite_start]/* [cite: 664] */

        originalGeneratedText.set(fullTitle, initialResultText);

        contentEl.innerHTML = '';
        renderAccordionFromMarkdown(initialResultText, contentEl, false);

        addModalActionButtons(buttonContainer, true); [cite_start]/* [cite: 664] */
    } catch (error) {
        handleApiError(error, contentEl, 'initial in-depth content'); [cite_start]/* [cite: 665] */
    }
}

// ** REFACTORED FUNCTION FOR EFFICIENCY **
async function generateFullDetailedGuide(button) {
    const firstModalFooter = document.getElementById('inDepthModalFooter'); [cite_start]/* [cite: 666] */
    const fullTitleFromFirstModal = firstModalFooter.dataset.fullTitle;
    const fullHierarchyPath = JSON.parse(firstModalFooter.dataset.fullHierarchyPath);
    const blueprintMarkdown = originalGeneratedText.get(fullTitleFromFirstModal); [cite_start]/* [cite: 667] */
    if (!blueprintMarkdown) {
        handleApiError({ message: "Could not find the initial guide blueprint to proceed." }, document.getElementById('inDepthDetailedModalContent'), 'full detailed guide'); [cite_start]/* [cite: 668] */
        return;
    }
    
    button.disabled = true; [cite_start]/* [cite: 669] */
    button.innerHTML = `<span class="flex items-center justify-center gap-2"><div class="loader themed-loader" style="width:20px; height:20px; border-width: 2px;"></div>Opening...</span>`; [cite_start]/* [cite: 670] */

    const detailedTitleEl = document.getElementById('inDepthDetailedModalTitle'); [cite_start]/* [cite: 670] */
    const detailedContentEl = document.getElementById('inDepthDetailedModalContent');
    const detailedFooterEl = document.getElementById('inDepthDetailedModalFooter');
    const detailedButtonContainer = document.getElementById('inDepthDetailedModalButtons'); [cite_start]/* [cite: 671] */
    const detailedModalTitle = `Complete Guide: ${fullTitleFromFirstModal.replace(/In-Depth: |Custom Guide: /g, '')}`;
    detailedTitleEl.textContent = detailedModalTitle;
    detailedButtonContainer.innerHTML = '';
    
    detailedFooterEl.dataset.fullTitle = detailedModalTitle; [cite_start]/* [cite: 672] */
    detailedFooterEl.dataset.cardName = fullHierarchyPath.map(p => p.title).join(' / ');
    
    openModal('inDepthDetailedModal');

    try {
        detailedContentEl.innerHTML = getLoaderHTML('Generating detailed sections (5-12)...'); [cite_start]/* [cite: 673] */
// New prompt to generate only the remaining sections
        const remainingSectionsPrompt = `
Persona: You are an elite-level AI, functioning as a Senior IT Administrator and a Principal Technical Writer. [cite_start]/* [cite: 674] */
Mission: Based on the provided GUIDE BLUEPRINT, generate the remaining detailed sections (5 through 12) for the guide. [cite_start]/* [cite: 675] */
//-- GUIDE BLUEPRINT (SECTIONS 1-4 for Context) --//
${blueprintMarkdown}

//-- INSTRUCTIONS --//
1.  **Generate Sections 5-12 ONLY:** Your output must start with "### 5. Key Concepts - In-Depth Application & Management" and end with "### 12. Helpful Resources". [cite_start]/* [cite: 676] */
2.  **Adhere to Blueprint:** All content you generate must strictly adhere to the scope and details defined in the provided blueprint. [cite_start]/* [cite: 677] */
3.  **Provide Concrete Examples:** For section 5, for each technique discussed (e.g., Few-Shot Learning), you MUST provide at least one clear, practical example of what a user would actually type or do. [cite_start]/* [cite: 678] */
Use markdown blockquotes to showcase these example prompts.
4.  **Uphold Quality Standards:** Ensure all information is factually accurate, contains no placeholders, and is written in a professional tone. [cite_start]/* [cite: 679] */
Your response must be ONLY the markdown for sections 5 through 12.`; [cite_start]/* [cite: 680] */
        let draftSections5to12 = await callGeminiAPI(remainingSectionsPrompt, false, "Generate Full Guide (Sections 5-12 Draft)");
        draftSections5to12 = draftSections5to12 ? [cite_start]/* [cite: 681] */
draftSections5to12.replace(/^```(markdown)?\n?/g, '').replace(/\n?```$/g, '').trim() : ''; [cite_start]/* [cite: 682] */
        if (!draftSections5to12) throw new Error("Failed to generate the detailed sections of the guide."); [cite_start]/* [cite: 682] */
        detailedContentEl.innerHTML = getLoaderHTML('AI is now reviewing and refining the new sections...'); [cite_start]/* [cite: 683] */
// Use the final review prompt on the new sections
        let reviewRequestPrompt = finalReviewPrompt
            .replace('{blueprint_from_step_1}', blueprintMarkdown)
            .replace('{draft_content_to_review}', draftSections5to12); [cite_start]/* [cite: 684] */
        let finalSections5to12 = await callGeminiAPI(reviewRequestPrompt, false, "Refine Full Guide (Sections 5-12 Final)");
        finalSections5to12 = finalSections5to12 ? [cite_start]/* [cite: 685] */
finalSections5to12.replace(/^```(markdown)?\n?/g, '').replace(/\n?```$/g, '').trim() : ''; [cite_start]/* [cite: 686] */
        if (!finalSections5to12) throw new Error("Failed to generate the final, refined guide sections."); [cite_start]/* [cite: 686] */
// Concatenate the final guide
        const finalCompleteGuideMarkdown = blueprintMarkdown + "\n\n" + finalSections5to12; [cite_start]/* [cite: 687] */
        originalGeneratedText.set(detailedModalTitle, finalCompleteGuideMarkdown);

        detailedContentEl.innerHTML = '';
        renderAccordionFromMarkdown(finalCompleteGuideMarkdown, detailedContentEl, false);

        addDetailedModalActionButtons(detailedButtonContainer);
        document.getElementById('detailed-modal-status-message').textContent = 'Full guide generated & refined successfully!'; [cite_start]/* [cite: 688] */
    } catch (error) {
        handleApiError(error, detailedContentEl, 'full detailed guide'); [cite_start]/* [cite: 689] */
    } finally {
         button.disabled = false; [cite_start]/* [cite: 690] */
         button.innerHTML = `Generate Full Detailed Guide`; [cite_start]/* [cite: 691] */
    }
}

function openModal(modalId) {
    const modal = document.getElementById(modalId); [cite_start]/* [cite: 691] */
    if(modal) {
        modal.classList.remove('hidden');
        document.body.classList.add('modal-open', `${modalId}-open`); [cite_start]/* [cite: 692] */
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId); [cite_start]/* [cite: 693] */
    if(modal) {
        modal.classList.add('hidden');
        document.body.classList.remove(`${modalId}-open`); [cite_start]/* [cite: 694] */
        if (document.querySelectorAll('.modal:not(.hidden)').length === 0) {
             document.body.classList.remove('modal-open'); [cite_start]/* [cite: 695] */
        }
    }
}

function addModalActionButtons(buttonContainer, isInitialPhase = false) {
    buttonContainer.innerHTML = ''; [cite_start]/* [cite: 696] */
    const saveDriveBtnHtml = gapi.client.getToken() !== null ?
        `<button id="save-to-drive-btn" class="btn-secondary">Save to Google Drive</button>` : ''; [cite_start]/* [cite: 697] */
    if (isInitialPhase) {
        buttonContainer.innerHTML = `
            <button class="btn-secondary text-sm modal-refine-button">Refine with AI</button>
            <button class="btn-secondary text-sm copy-button">Copy Text</button>
            <button id="generate-detailed-steps-btn" class="btn-primary text-sm px-4 py-2" title="Generate a full, detailed guide 
in a new modal">Generate Full Detailed Guide</button>
            ${saveDriveBtnHtml}
        `; [cite_start]/* [cite: 699] */
    } else {
        buttonContainer.innerHTML = `
            <button class="btn-secondary text-sm modal-refine-button">Refine with AI</button>
            <button class="btn-secondary text-sm copy-button">Copy Text</button>
            ${saveDriveBtnHtml}
           
     `; [cite_start]/* [cite: 701] */
    }

    const copyButton = buttonContainer.querySelector('.copy-button'); [cite_start]/* [cite: 701] */
    if (copyButton) {
        copyButton.addEventListener('click', e => {
            const contentToCopy = e.target.closest('.card').querySelector('[id$="ModalContent"]');
            copyElementTextToClipboard(contentToCopy, e.target);
        }); [cite_start]/* [cite: 702] */
    }
}

function addDetailedModalActionButtons(buttonContainer) {
    const saveDriveBtnHtml = gapi.client.getToken() !== null ? [cite_start]/* [cite: 703] */
`<button id="save-to-drive-btn" class="btn-secondary">Save to Google Drive</button>` : ''; [cite_start]/* [cite: 704] */
    
    buttonContainer.innerHTML = `
        <button class="btn-secondary text-sm modal-refine-button">Refine with AI</button>
        <button class="btn-secondary text-sm copy-button">Copy Text</button>
        ${saveDriveBtnHtml}
    `; [cite_start]/* [cite: 704] */
    const copyButton = buttonContainer.querySelector('.copy-button'); [cite_start]/* [cite: 705] */
    if (copyButton) {
        copyButton.addEventListener('click', e => {
            const contentToCopy = e.target.closest('.card').querySelector('[id$="ModalContent"]');
            copyElementTextToClipboard(contentToCopy, e.target);
        }); [cite_start]/* [cite: 705] */
    }
}

function addSearchModalActionButtons(buttonContainer) {
     const saveDriveBtnHtml = gapi.client.getToken() !== null ? [cite_start]/* [cite: 706] */
`<button id="save-to-drive-btn" class="btn-secondary">Save to Google Drive</button>` : ''; [cite_start]/* [cite: 707] */
     buttonContainer.innerHTML = `
        <button class="btn-secondary text-sm modal-refine-button">Refine with AI</button>
        <button class="btn-secondary text-sm copy-button">Copy Text</button>
        ${saveDriveBtnHtml}
    `; [cite_start]/* [cite: 707] */
    const copyButton = buttonContainer.querySelector('.copy-button'); [cite_start]/* [cite: 708] */
    if (copyButton) {
        copyButton.addEventListener('click', e => {
            const contentToCopy = document.getElementById('searchGeminiResult');
            copyElementTextToClipboard(contentToCopy, e.target);
        }); [cite_start]/* [cite: 708] */
    }
}

function handleTextSelection(e) {
    const selection = window.getSelection(); [cite_start]/* [cite: 709] */
    const selectedText = selection.toString().trim(); [cite_start]/* [cite: 710] */
    const searchButton = document.getElementById('search-gemini-button');

    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        searchButton.classList.add('hidden'); [cite_start]/* [cite: 710] */
        return;
    }
    
    const isInsideModal = e.target.closest('#inDepthModalContent, #inDepthDetailedModalContent, #promptsModalContent'); [cite_start]/* [cite: 711] */
    if (selectedText && isInsideModal) {
        searchButton.classList.remove('hidden'); [cite_start]/* [cite: 712] */
    } else {
         searchButton.classList.add('hidden'); [cite_start]/* [cite: 713] */
    }
}

async function handleSearchGemini() {
    const searchButton = document.getElementById('search-gemini-button'); [cite_start]/* [cite: 714] */
    const selection = window.getSelection(); [cite_start]/* [cite: 715] */
    const selectedText = selection.toString().trim();
    if (!selectedText) return;

    searchButton.classList.add('hidden');

    const searchTextEl = document.getElementById('searchGeminiQueryText');
    const resultEl = document.getElementById('searchGeminiResult'); [cite_start]/* [cite: 715] */
    searchTextEl.value = selectedText; [cite_start]/* [cite: 716] */
    resultEl.innerHTML = getLoaderHTML(`Searching Gemini for an explanation of "${selectedText}"...`);
    
    addSearchModalActionButtons(document.getElementById('searchGeminiModalButtons'));
    
    openModal('searchGeminiModal'); [cite_start]/* [cite: 716] */
    const prompt = `In the context of IT administration, please explain the following term or concept clearly and concisely: "${selectedText}". [cite_start]/* [cite: 717] */
Provide a simple definition and a practical example of how it's used. Format the response as a simple markdown string.`; [cite_start]/* [cite: 718] */
    try {
        let resultText = await callGeminiAPI(prompt, false, "Text Selection Search"); [cite_start]/* [cite: 719] */
        resultText = resultText ? resultText.replace(/```(markdown|json)?\n?/g, '').replace(/\n?```$/g, '').trim() : ''; [cite_start]/* [cite: 720] */
        
        originalGeneratedText.set("currentSearch", resultText);
        
        resultEl.innerHTML = marked.parse(resultText || 'No explanation found.'); [cite_start]/* [cite: 720] */
    } catch (error) {
        handleApiError(error, resultEl, 'Gemini search'); [cite_start]/* [cite: 721] */
    }
}


function convertMarkdownToHtml(text, generateImages = true) {
    if (!text) return '<p class="themed-text-muted">No content received from AI. [cite_start]/* [cite: 722] */
Please try a different prompt.</p>'; [cite_start]/* [cite: 723] */

    let processedText;
    if (generateImages) {
        processedText = text.replace(/\[Screenshot: (.*?)\]/g, (match, description) => {
            const placeholderId = `image-placeholder-${Date.now()}-${Math.random()}`;
            return `<div id="${placeholderId}" class="image-generation-container" data-prompt="${description.replace(/"/g, '&quot;')}">
                    
            <div class="loader themed-loader"></div>
                        <p class="mt-2 text-sm italic">${description}</p>
                    </div>`;
        [cite_start]}); /* [cite: 724] */
       
     } else {
        processedText = text.replace(/\[Screenshot: (.*?)\]/g, ''); [cite_start]/* [cite: 725] */
    }


    let html = marked.parse(processedText);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    tempDiv.querySelectorAll('pre').forEach(preBlock => {
   
        [cite_start]if (preBlock.parentElement.classList.contains('code-block-container')) return; /* [cite: 726] */

        const codeBlock = preBlock.querySelector('code'); [cite_start]/* [cite: 726] */
        const lang = codeBlock ? (Array.from(codeBlock.classList).find(c => c.startsWith('language-'))?.replace('language-', '') || 'text') : 'text';
        
        const container = document.createElement('div');
        container.className = 'code-block-container'; [cite_start]/* [cite: 727] */
        const header = document.createElement('div');
        header.className = 'code-block-header';
        header.innerHTML = `
            <span>${lang}</span>
            <button class="copy-code-button">Copy</button>
        `; [cite_start]/* [cite: 728] */
        container.appendChild(header);
        preBlock.parentNode.insertBefore(container, preBlock);
        container.appendChild(preBlock);
    });

    return tempDiv.innerHTML;
}

async function generateAndInjectImages(container) {
    const placeholders = container.querySelectorAll('.image-generation-container'); [cite_start]/* [cite: 729] */
    if (placeholders.length === 0) return;
    
    if (!gapi.client.getToken()) {
        placeholders.forEach(placeholder => {
            placeholder.innerHTML = `<p class="text-sm themed-text-muted">Connect Google Account to generate images.</p>`;
        }); [cite_start]/* [cite: 730] */
        return;
    }

    placeholders.forEach(async (placeholder) => {
        const prompt = placeholder.dataset.prompt;
        const imagePrompt = `UI Screenshot for an IT Administration guide showing: ${prompt}. Clean, professional, minimal.`;
        try {
                  
           [cite_start]const imageUrl = await callImageGenAPI(imagePrompt); /* [cite: 732] */
            if (imageUrl) {
                placeholder.innerHTML = `<img src="${imageUrl}" alt="${prompt}">`;
            } else {
                      
           throw new Error('API returned no image.'); [cite_start]/* [cite: 733] */
            }
        } catch (error) {
            console.error(`Failed to generate image for prompt: "${prompt}"`, error);
            placeholder.innerHTML = `<p class="text-red-500 text-sm">Image generation failed.</p><p 
class="text-xs">${prompt}</p>`; [cite_start]/* [cite: 734] */
        }
    }); [cite_start]/* [cite: 734] */
}


function addPostGenerationButtons(container, topicId, categoryId) {
    let buttonBar = container.querySelector('.button-bar'); [cite_start]/* [cite: 735] */
    if (buttonBar) buttonBar.remove();

    buttonBar = document.createElement('div');
    buttonBar.className = 'button-bar flex flex-wrap gap-2 mt-4 pt-4 border-t';
    buttonBar.style.borderColor = 'var(--color-card-border)'; [cite_start]/* [cite: 736] */
    const card = container.closest('.card');
    const fullHierarchyPath = JSON.parse(card.dataset.fullHierarchyPath);

    buttonBar.innerHTML = `
        <button class="btn-secondary text-sm refine-button">Refine with AI</button>
        <button class="btn-secondary text-sm copy-button">Copy Text</button>
        <button class="btn-secondary text-sm explore-button" data-topic-id="${topicId}" data-category-id="${categoryId}" data-full-hierarchy-path='${JSON.stringify(fullHierarchyPath).replace(/'/g, "&#39;")}'>Explore In-Depth</button>
    `; [cite_start]/* [cite: 737] */
    container.appendChild(buttonBar);
    buttonBar.querySelector('.copy-button').addEventListener('click', e => {
        const contentToCopy = e.target.closest('.details-container, #gemini-result-container');
        if(contentToCopy) copyElementTextToClipboard(contentToCopy, e.target);
    }); [cite_start]/* [cite: 738] */
    buttonBar.querySelector('.explore-button').addEventListener('click', e => {
        const { topicId, categoryId } = e.currentTarget.dataset;
        handleExploreInDepth(topicId, fullHierarchyPath);
    }); [cite_start]/* [cite: 739] */
}

async function handleCustomVisualThemeGeneration() {
    const prompt = document.getElementById('theme-prompt').value; [cite_start]/* [cite: 740] */
    if(!prompt) return;

    const loader = document.getElementById('theme-loader-container');
    const errorContainer = document.getElementById('theme-error-container');
    const generateBtn = document.getElementById('generate-theme-btn');
    
    loader.classList.remove('hidden');
    errorContainer.classList.add('hidden');
    generateBtn.disabled = true; [cite_start]/* [cite: 741] */
    try {
        const imagePrompt = `Artistic, abstract background image inspired by "${prompt}". [cite_start]/* [cite: 742] */
Suitable for an IT administration website. Professional, clean. Wide aspect ratio, photographic, cinematic lighting.`; [cite_start]/* [cite: 743] */
        
        const promises = [callColorGenAPI(prompt)]; [cite_start]/* [cite: 743] */
        if (gapi.client.getToken()) {
            promises.push(callImageGenAPI(imagePrompt)); [cite_start]/* [cite: 744] */
        } else {
            showThemeError("Connect your Google Account to generate a new header image."); [cite_start]/* [cite: 745] */
        }

        const [colorResult, imageResult] = await Promise.allSettled(promises); [cite_start]/* [cite: 746] */
        if (colorResult.status === 'fulfilled' && colorResult.value) {
            applyTheme(colorResult.value); [cite_start]/* [cite: 747] */
        } else {
            throw colorResult.reason || [cite_start]/* [cite: 748] */
                new Error("Failed to generate color theme.");
        }

        if (imageResult && imageResult.status === 'fulfilled' && imageResult.value) {
            applyHeaderImage(imageResult.value); [cite_start]/* [cite: 749] */
        } else if (imageResult) {
            showThemeError("Failed to generate header image, but colors were updated."); [cite_start]/* [cite: 750] */
        }
        
        closeModal('themeGeneratorModal'); [cite_start]/* [cite: 751] */
    } catch (error) {
        showThemeError(error.message); [cite_start]/* [cite: 752] */
    } finally {
        loader.classList.add('hidden'); [cite_start]/* [cite: 753] */
        generateBtn.disabled = false;
    }
}

function showThemeError(message) {
    const errorContainer = document.getElementById('theme-error-container'); [cite_start]/* [cite: 754] */
    errorContainer.textContent = message;
    errorContainer.classList.remove('hidden');
}

function populateTypographySettings() {
    const fontSelect = document.getElementById('font-family-select'); [cite_start]/* [cite: 755] */
    const sizeSelect = document.getElementById('font-size-select');
    const lineHeightSelect = document.getElementById('line-height-select');
    
    const fonts = { 'Default (Inter)': "'Inter', sans-serif", 'Lato': "'Lato', sans-serif", 'Montserrat': "'Montserrat', sans-serif", 'Nunito Sans': "'Nunito Sans', sans-serif", 'Open Sans': "'Open Sans', sans-serif", 'Poppins': "'Poppins', sans-serif", 'Roboto Slab': "'Roboto Slab', serif" }; [cite_start]/* [cite: 756] */
    const sizes = { '14': '14px', '15': '15px', '16 (Default)': '16px', '17': '17px', '18': '18px' }; [cite_start]/* [cite: 757] */
    const lineHeights = { '1.4': '1.4', '1.5 (Default)': '1.5', '1.6': '1.6', '1.7': '1.7', '1.8': '1.8' }; [cite_start]/* [cite: 758] */
    Object.entries(fonts).forEach(([name, value]) => fontSelect.add(new Option(name, value)));
    Object.entries(sizes).forEach(([name, value]) => sizeSelect.add(new Option(name, value)));
    Object.entries(lineHeights).forEach(([name, value]) => lineHeightSelect.add(new Option(name, value))); [cite_start]/* [cite: 759] */
    fontSelect.value = fonts['Default (Inter)'];
    sizeSelect.value = '16px';
    lineHeightSelect.value = '1.5';
    
    root.style.setProperty('--font-family', fontSelect.value);
    root.style.setProperty('--font-size-base', sizeSelect.value);
    root.style.setProperty('--line-height-base', lineHeightSelect.value); [cite_start]/* [cite: 760] */
}

function copyElementTextToClipboard(element, button) {
    const textToCopy = element.innerText; [cite_start]/* [cite: 761] */
    const textarea = document.createElement('textarea');
    textarea.value = textToCopy;
    textarea.style.position = 'fixed'; 
    document.body.appendChild(textarea);
    textarea.select(); [cite_start]/* [cite: 762] */
    try {
        document.execCommand('copy'); [cite_start]/* [cite: 763] */
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        setTimeout(() => { button.textContent = originalText; }, 2000); [cite_start]/* [cite: 764] */
    } catch (err) {
        console.error('Fallback: Oops, unable to copy', err); [cite_start]/* [cite: 765] */
    }
    document.body.removeChild(textarea); [cite_start]/* [cite: 766] */
}

function renderAccordionFromMarkdown(markdownText, containerElement, generateImages = true) {
    containerElement.innerHTML = ''; [cite_start]/* [cite: 767] */
    if (!markdownText || !markdownText.trim()) {
        containerElement.innerHTML = convertMarkdownToHtml(null, false); [cite_start]/* [cite: 768] */
        return;
    }

    const fullHtml = convertMarkdownToHtml(markdownText, generateImages); [cite_start]/* [cite: 769] */
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = fullHtml;

    const nodes = Array.from(tempDiv.childNodes);
    let currentAccordionItem = null;
    let introContent = document.createElement('div'); [cite_start]/* [cite: 770] */
    introContent.className = 'accordion-intro mb-4 prose max-w-none';

    let firstHeaderFound = false; [cite_start]/* [cite: 771] */
    nodes.forEach(node => {
        if (!firstHeaderFound && node.tagName !== 'H3') {
            introContent.appendChild(node.cloneNode(true));
            return;
        }
        
    
        if (node.tagName === 'H3') {
            firstHeaderFound = true;
            if (introContent.hasChildNodes()) {
                containerElement.appendChild(introContent);
                
                [cite_start]introContent = document.createElement('div');  /* [cite: 774] */
                introContent.className = 'accordion-intro mb-4 prose max-w-none';
            }

            currentAccordionItem = document.createElement('div');
                  
            currentAccordionItem.className = 'accordion-item'; [cite_start]/* [cite: 775] */

            const title = node.textContent;
            const contentDiv = document.createElement('div');
            contentDiv.className = 'accordion-content prose max-w-none';

            currentAccordionItem.innerHTML = `
    
            <button type="button" class="accordion-header">
                    <span class="text-left">${title}</span>
                    <svg class="icon w-5 h-5 transition-transform shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
    
            </button>
        `; [cite_start]/* [cite: 777] */
            currentAccordionItem.appendChild(contentDiv);
            containerElement.appendChild(currentAccordionItem);
        } else if (currentAccordionItem) {
            const contentDiv = currentAccordionItem.querySelector('.accordion-content'); [cite_start]/* [cite: 778] */
            contentDiv.appendChild(node.cloneNode(true));
        }
    }); [cite_start]/* [cite: 779] */
    if (!firstHeaderFound && introContent.hasChildNodes()) {
         containerElement.appendChild(introContent); [cite_start]/* [cite: 780] */
         return;
    }


    if (introContent.hasChildNodes()) {
        containerElement.appendChild(introContent); [cite_start]/* [cite: 781] */
    }

    const firstItem = containerElement.querySelector('.accordion-item'); [cite_start]/* [cite: 782] */
    if (firstItem) {
        const header = firstItem.querySelector('.accordion-header'); [cite_start]/* [cite: 783] */
        header.classList.add('active'); [cite_start]/* [cite: 784] */
        header.querySelector('.icon').style.transform = 'rotate(180deg)';
        firstItem.querySelector('.accordion-content').classList.add('open');
    }
}

async function handleAIHelpRequest() {
    document.getElementById('inDepthModalTitle').textContent = "Code Documentation Generation"; [cite_start]/* [cite: 784] */
    const contentEl = document.getElementById('inDepthModalContent');
    contentEl.innerHTML = getLoaderHTML('AI is generating the technical code documentation...');
    
    document.getElementById('inDepthModalButtons').innerHTML = '';
    document.getElementById('modal-status-message').innerHTML = '';
    
    openModal('inDepthModal'); [cite_start]/* [cite: 785] */
    const codeDocPrompt = `
        **Persona:** You are an expert technical writer and senior software architect. [cite_start]/* [cite: 786] */
        **Objective:** Your task is to analyze this application's structure and generate comprehensive code documentation. [cite_start]/* [cite: 787] */
        The application is a sophisticated "IT Administration Hub" built with HTML, CSS, and modern JavaScript (ESM), integrating with Firebase and various Google Cloud APIs. [cite_start]/* [cite: 788] */
        **Instructions:**
        Based on the application's known features and structure, generate a detailed technical documentation guide. [cite_start]/* [cite: 789] */
        The guide must be written in markdown format and use '###' for all main section headers. [cite_start]/* [cite: 790] */
        **Required Sections:**

        ### 1. Application Overview
        * Describe the application's primary purpose as an AI-powered tool for IT professionals. [cite_start]/* [cite: 791] */
        * Explain its core value proposition: generating dynamic, in-depth administrative guides. [cite_start]/* [cite: 792] */
        ### 2. Technologies & Languages
        * List and describe the core technologies used:
            * **Frontend:** HTML5, Tailwind CSS, Vanilla JavaScript (ECMAScript Modules). [cite_start]/* [cite: 793] */
            * **Backend & Cloud Services:** Firebase (Authentication, Firestore), Google Cloud Platform. [cite_start]/* [cite: 794] */
            * **Core APIs:** Google Gemini API (for content generation), Google Drive API (for storage), Google Identity Services (for auth), and the Google AI Platform API (for image generation). [cite_start]/* [cite: 795] */
        ### 3. Architectural Design
        * **Component-Based UI:** Explain how the UI is dynamically built from cards and modals. [cite_start]/* [cite: 796] */
        * **State Management:** Describe how the application state is managed, including API keys in localStorage, user session state via Firebase Auth, and in-memory state for generated content. [cite_start]/* [cite: 797] */
        * **Event-Driven Logic:** Explain the role of the central 'setupEventListeners' function and how it delegates tasks based on user interactions. [cite_start]/* [cite: 798] */
        * **Hierarchical Content Model:** Explain the Firestore data structure ('topicHierarchy' collection) for managing content in a nested Main -> Sub -> Final Category structure. [cite_start]/* [cite: 799] */
        ### 4. Core Features Deep Dive
        * For each key feature below, describe its purpose and implementation:
            * **Dynamic Category Generation:** How 'openCategoryBrowser' and 'generateAndPopulateAICategory' work with Firestore to create UI on demand. [cite_start]/* [cite: 800] */
            * **Multi-Stage Guide Generation:** Detail the process that starts with a summary ('handleGridSelect'), moves to an initial guide ('handleExploreInDepth'), and finishes with a complete, AI-reviewed document ('generateFullDetailedGuide'). [cite_start]/* [cite: 801] */
            * **Hierarchy Management:** Describe the purpose and functionality of the 'hierarchyManagementModal' for CRUD operations on the content structure in Firestore. [cite_start]/* [cite: 802] */
        ### 5. Key Functions & Logic
        * **\`initializeApplication()\`:** The main entry point. [cite_start]/* [cite: 803] */
        * **\`callGeminiAPI()\` / \`callApi()\`:** Centralized functions for all generative AI requests. [cite_start]/* [cite: 804] */
        * **\`openHierarchyManagementModal()\` & related functions:** The logic for populating and interacting with the hierarchy management UI. [cite_start]/* [cite: 805] */
        * **\`openCategoryBrowser()\`:** The function that initiates the user-facing topic exploration flow.

        Return only the complete markdown documentation.
        `; [cite_start]/* [cite: 806] */
    try {
        const documentationResult = await callGeminiAPI(codeDocPrompt, false, "Generate Code Documentation"); [cite_start]/* [cite: 807] */
        const documentationHtml = documentationResult ? marked.parse(documentationResult.replace(/^```(markdown)?\n?/g, '').replace(/\n?```$/g, '').trim()) : '<p class="themed-text-muted">Could not load documentation.</p>';
        
        contentEl.innerHTML = `<div class="prose max-w-none">${documentationHtml}</div>`; [cite_start]/* [cite: 808] */
    } catch (error) {
        handleApiError(error, contentEl, 'code documentation'); [cite_start]/* [cite: 809] */
    }
}

function toggleRefineUI(buttonContainer, isModal = false, targetModalId = 'inDepthModal') {
    const refineContainerId = `refine-container-${targetModalId}`; [cite_start]/* [cite: 810] */
    let refineContainer = document.getElementById(refineContainerId);

    if (refineContainer) {
        refineContainer.remove(); [cite_start]/* [cite: 811] */
        return;
    }

    refineContainer = document.createElement('div');
    refineContainer.id = refineContainerId; [cite_start]/* [cite: 812] */
    refineContainer.className = 'refine-container w-full';
    
    const textareaId = `refine-textarea-${targetModalId}`;
    refineContainer.innerHTML = `<textarea id="${textareaId}" name="${textareaId}" class="w-full p-2 themed-input border rounded-lg" rows="2" placeholder="e.g., 'Make it for a junior admin' or 'Add PowerShell examples'"></textarea><button class="btn-primary text-sm mt-2 submit-refinement-button" data-is-modal="${isModal}" data-target-modal-id="${targetModalId}">Submit Refinement</button>`; [cite_start]/* [cite: 813] */
    buttonContainer.insertAdjacentElement('afterend', refineContainer);
    refineContainer.querySelector('textarea').focus();
}

async function handleRefineRequest(refineContainer, targetModalId) {
    const refinementRequest = refineContainer.querySelector('textarea').value; [cite_start]/* [cite: 814] */
    if (!refinementRequest) return;

    let contentArea, titleElement, isSearchModal, textKey;
    
    isSearchModal = (targetModalId === 'searchGeminiModal');
    contentArea = document.getElementById(`${targetModalId}Content`); [cite_start]/* [cite: 815] */
    if (isSearchModal) {
         textKey = "currentSearch"; [cite_start]/* [cite: 816] */
    } else {
         titleElement = document.getElementById(`${targetModalId}Title`); [cite_start]/* [cite: 817] */
         textKey = titleElement.textContent;
    }
    
    const originalText = originalGeneratedText.get(textKey); [cite_start]/* [cite: 818] */
    if (!originalText) {
        handleApiError({message: "Could not find the original text to refine."}, contentArea, "refinement"); [cite_start]/* [cite: 819] */
        return;
    }
    
    const renderTarget = isSearchModal ? [cite_start]/* [cite: 820] */
document.getElementById('searchGeminiResult') : contentArea; [cite_start]/* [cite: 821] */
    renderTarget.innerHTML = getLoaderHTML(`Refining content based on your request...`);
    
    const prompt = getRefinementPrompt(originalText, refinementRequest); [cite_start]/* [cite: 821] */
    try {
        let newText = await callGeminiAPI(prompt, false, "Refine Content"); [cite_start]/* [cite: 822] */
        newText = newText ? newText.replace(/^```(markdown)?\n?/g, '').replace(/\n?```$/g, '').trim() : '';
        
        originalGeneratedText.set(textKey, newText); [cite_start]/* [cite: 823] */
        if (isSearchModal) {
            const queryTextEl = document.getElementById('searchGeminiQueryText'); [cite_start]/* [cite: 824] */
            const newQueryText = `${queryTextEl.value} (Refined: ${refinementRequest})`;
            queryTextEl.value = newQueryText;
        }
        
        if (isSearchModal) {
            renderTarget.innerHTML = marked.parse(newText || ''); [cite_start]/* [cite: 825] */
        } else {
            renderTarget.innerHTML = ''; [cite_start]/* [cite: 826] */
            renderAccordionFromMarkdown(newText, renderTarget, false);
        }
        
    } catch(error) {
        handleApiError(error, renderTarget, 'refinement'); [cite_start]/* [cite: 827] */
    }
}

function getIconForTheme(categoryId, topicId) { 
    const icons = {
        serviceNowAdmin: `<svg class="w-8 h-8 mx-auto themed-text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 
[cite_start]2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37.996.608 2.296.096 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>`, /* [cite: 829] */
        windowsServer: `<svg class="w-8 h-8 mx-auto themed-text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>`,
        m365Admin: `<svg class="w-8 h-8 mx-auto themed-text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 15a4 
[cite_start]4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path></svg>`, /* [cite: 830] */
        default: `<svg class="w-8 h-8 mx-auto themed-text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>`
    }
    // Simple logic to pick an icon based on a hash of 
    const keys = Object.keys(icons);
    const hash = categoryId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0); [cite_start]/* [cite: 831] */
    return icons[keys[hash % keys.length]] || icons.default; [cite_start]/* [cite: 832] */
}

function getLoaderHTML(message) { return `<div class="flex justify-center items-center my-4"><div class="loader themed-loader"></div><p class="ml-4 themed-text-muted">${message}</p></div>`; [cite_start]/* [cite: 832] */
}

function sanitizeTitle(title) {
    if (typeof title !== 'string') return ''; [cite_start]/* [cite: 833] */
    return title.replace(/^["*-\s]+|["*-\s]+$/g, '').trim();
}

function truncateText(text, maxLength = 50) {
    if (typeof text !== 'string' || text.length <= maxLength) { return text; [cite_start]/* [cite: 834] */
    }
    return text.substring(0, maxLength) + '...'; [cite_start]/* [cite: 835] */
}

function generateErrorMessage(error, type = 'general') { 
    console.error(`Error during ${type} generation:`, error); [cite_start]/* [cite: 836] */
    const baseErrorMessage = error && error.message ? error.message : "An unknown error occurred";
    let message = `An unknown error occurred. [cite_start]/* [cite: 837] */
${baseErrorMessage}`; 
    const errText = baseErrorMessage.toLowerCase(); 
    if (errText.includes('safety') || errText.includes('blocked')) {
        message = `Request blocked for safety reasons. [cite_start]/* [cite: 838] */
Please try a different prompt.`;
    } else if (errText.includes('api key not valid')) {
        message = `Authentication failed. [cite_start]/* [cite: 839] */
Your API Key is not valid. Please re-enter it.`;
    } else if (errText.includes('429')) {
        message = `Request limit exceeded. [cite_start]/* [cite: 840] */
Please try again later.`; [cite_start]/* [cite: 841] */
    } else if (errText.includes('timed out')) {
        message = `The request timed out. [cite_start]/* [cite: 841] */
Please check your connection and try again.`;
    } else if (errText.includes('google account to generate images')) {
        message = `Image generation requires you to connect your Google Account. [cite_start]/* [cite: 842] */
Please use the 'Connect' button in the Cloud Storage card.`
    } else if (errText.includes('data.sort is not a function') || errText.includes('invalid api response format')) {
        message = `The AI returned data in an unexpected format. [cite_start]/* [cite: 843] */
This usually means the AI did not return a list of topics as expected. [cite_start]/* [cite: 844] */
Please try again, or adjust the prompt in Hierarchy Management.`; [cite_start]/* [cite: 845] */
    }
    return `Sorry, a critical error occurred: ${message}`; [cite_start]/* [cite: 846] */
}

// --- Sticky Topics & User Topics Functions ---

// NEW: Listener for user-added topics
function listenForUserAddedTopics(categoryKey) {
    if (userTopicsUnsubscribes[categoryKey]) {
        userTopicsUnsubscribes[categoryKey](); [cite_start]/* [cite: 847] */
    }
    if (!userId || !categoryKey) {
        if(userAddedTopics[categoryKey]) { userAddedTopics[categoryKey] = []; [cite_start]/* [cite: 848] */
        }
        return; [cite_start]/* [cite: 849] */
    }

    const appId = firebaseConfig.appId || 'it-admin-hub-global'; [cite_start]/* [cite: 850] */
    const userTopicsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/userTopics/${categoryKey}/topics`);

    userTopicsUnsubscribes[categoryKey] = onSnapshot(userTopicsCollectionRef, (snapshot) => {
        const topics = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
        userAddedTopics[categoryKey] = topics;

        const gridContainer = document.getElementById(`selector-${categoryKey}`);
        if (gridContainer) {
          
            [cite_start]populateCardGridSelector(gridContainer, categoryKey); /* [cite: 852] */
        }
    }, (error) => {
        console.error(`Error listening to user-added topics for ${categoryKey}:`, error);
    }); [cite_start]/* [cite: 852] */
}

async function openStickyTopicsModal() {
    const select = document.getElementById('sticky-topic-category-select'); [cite_start]/* [cite: 853] */
    select.innerHTML = '<option value="">Select a category...</option>';
    
    try {
        const finalCategories = []; [cite_start]/* [cite: 854] */
        const mainCatsSnapshot = await getDocs(collection(db, getHierarchyBasePath(), 'topicHierarchy'));
        for (const mainDoc of mainCatsSnapshot.docs) {
            const subCatsSnapshot = await getDocs(collection(db, mainDoc.ref.path, 'subCategories')); [cite_start]/* [cite: 855] */
            for (const subDoc of subCatsSnapshot.docs) {
                const finalCatsSnapshot = await getDocs(collection(db, subDoc.ref.path, 'finalCategories')); [cite_start]/* [cite: 856] */
                finalCatsSnapshot.forEach(finalDoc => {
                    finalCategories.push({ id: finalDoc.id, ...finalDoc.data() });
                }); [cite_start]/* [cite: 857] */
            }
        }
        
        finalCategories.sort((a, b) => a.title.localeCompare(b.title)); [cite_start]/* [cite: 858] */
        finalCategories.forEach(cat => {
            select.add(new Option(cat.title, cat.id));
        }); [cite_start]/* [cite: 859] */
    } catch (error) {
        console.error("Error populating sticky topic categories:", error); [cite_start]/* [cite: 860] */
        select.innerHTML = '<option value="">Error loading categories</option>'; [cite_start]/* [cite: 861] */
    }

    document.getElementById('sticky-topics-list').innerHTML = ''; [cite_start]/* [cite: 861] */
    document.getElementById('new-sticky-topic-input').value = '';

    openModal('stickyTopicsModal');
}

function listenForStickyTopics(categoryKey) {
    if (stickyTopicsUnsubscribe) {
        stickyTopicsUnsubscribe(); [cite_start]/* [cite: 862] */
    }
    if (!userId || !categoryKey) {
         if(stickyTopics[categoryKey]) { stickyTopics[categoryKey] = []; [cite_start]/* [cite: 863] */
         }
         renderStickyTopics(categoryKey);
         return; [cite_start]/* [cite: 864] */
    }
    
    const appId = firebaseConfig.appId || [cite_start]/* [cite: 865] */
'it-admin-hub-global';
    const stickyTopicsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/stickyTopics/${categoryKey}/topics`);
    
    stickyTopicsUnsubscribe = onSnapshot(stickyTopicsCollectionRef, (snapshot) => {
        const topics = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        stickyTopics[categoryKey] = topics;
        renderStickyTopics(categoryKey);
        
              
        [cite_start]const gridContainer = document.getElementById(`selector-${categoryKey}`); /* [cite: 867] */
        if (gridContainer) {
            populateCardGridSelector(gridContainer, categoryKey);
        }
    }, (error) => {
        console.error(`Error listening to sticky topics for ${categoryKey}:`, error);
  
        }); [cite_start]/* [cite: 869] */
}

function renderStickyTopics(categoryKey) {
    const listEl = document.getElementById('sticky-topics-list'); [cite_start]/* [cite: 869] */
    const topics = stickyTopics[categoryKey] || [];
    if(topics.length === 0) {
        listEl.innerHTML = `<p class="text-sm themed-text-muted text-center">No sticky topics for this category yet.</p>`; [cite_start]/* [cite: 870] */
        return;
    }
    listEl.innerHTML = topics.map(topic => `
        <div class="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
            <input type="text" value="${topic.title}" class="themed-input w-full p-1 rounded text-sm sticky-topic-title-input" data-doc-id="${topic.id}">
            <button class="p-1 text-green-600 hover:text-green-800 update-sticky-topic-btn" title="Save Changes">&#10004;</button>
      
            <button class="p-1 text-red-600 hover:text-red-800 delete-sticky-topic-btn" title="Delete Topic">&times;</button>
        </div>
    `).join(''); [cite_start]/* [cite: 872] */
    listEl.querySelectorAll('.update-sticky-topic-btn').forEach(btn => btn.onclick = (e) => handleUpdateStickyTopic(e));
    listEl.querySelectorAll('.delete-sticky-topic-btn').forEach(btn => btn.onclick = (e) => handleDeleteStickyTopic(e)); [cite_start]/* [cite: 873] */
}

async function handleAddStickyTopic() {
    const categoryKey = document.getElementById('sticky-topic-category-select').value; [cite_start]/* [cite: 874] */
    const input = document.getElementById('new-sticky-topic-input');
    const title = input.value.trim();

    if (!categoryKey || !title || !userId) {
        displayMessageInModal('Please select a category and enter a title.', 'warning'); [cite_start]/* [cite: 875] */
        return;
    }
    const appId = firebaseConfig.appId || 'it-admin-hub-global'; [cite_start]/* [cite: 876] */
    const stickyTopicsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/stickyTopics/${categoryKey}/topics`);
    
    try {
        await addDoc(stickyTopicsCollectionRef, { 
            title: title, 
            description: `Custom sticky topic: ${title}`,
            createdAt: Timestamp.now() 
       
         }); [cite_start]/* [cite: 878] */
        input.value = ''; [cite_start]/* [cite: 878] */
    } catch(error) {
        console.error("Error adding sticky topic:", error); [cite_start]/* [cite: 879] */
    }
}

async function handleUpdateStickyTopic(e) {
    const categoryKey = document.getElementById('sticky-topic-category-select').value; [cite_start]/* [cite: 880] */
    const input = e.target.previousElementSibling;
    const docId = input.dataset.docId;
    const newTitle = input.value.trim(); [cite_start]/* [cite: 881] */
    if (!categoryKey || !docId || !newTitle || !userId) return;

    const appId = firebaseConfig.appId || 'it-admin-hub-global'; [cite_start]/* [cite: 882] */
    const docRef = doc(db, `artifacts/${appId}/users/${userId}/stickyTopics/${categoryKey}/topics`, docId);
    try {
        await updateDoc(docRef, { title: newTitle }); [cite_start]/* [cite: 883] */
        e.target.textContent = '✓';
        setTimeout(() => e.target.innerHTML = '&#10004;', 2000);
    } catch (error) {
        console.error("Error updating sticky topic:", error); [cite_start]/* [cite: 884] */
    }
}

async function handleDeleteStickyTopic(e) {
    const categoryKey = document.getElementById('sticky-topic-category-select').value; [cite_start]/* [cite: 885] */
    const docId = e.target.previousElementSibling.previousElementSibling.dataset.docId;

    if (!categoryKey || !docId || !userId) return; [cite_start]/* [cite: 886] */
    showConfirmationModal("Are you sure you want to delete this sticky topic?", async () => {
        const appId = firebaseConfig.appId || 'it-admin-hub-global';
        const docRef = doc(db, `artifacts/${appId}/users/${userId}/stickyTopics/${categoryKey}/topics`, docId);
        try {
            await deleteDoc(docRef);
       
        } catch (error) {
            console.error("Error deleting sticky topic:", error);
            displayMessageInModal('Failed to delete topic. Check console.', 'error');
        }
    }); [cite_start]/* [cite: 888] */
}

// --- MODIFIED: Topic Browser Functions ---
const getHierarchyBasePath = () => `artifacts/${firebaseConfig.appId || [cite_start]/* [cite: 889] */
'it-admin-hub-global'}/public/data`;

async function openCategoryBrowser(mode) {
    const modalTitle = document.getElementById('categoryBrowserModalTitle'); [cite_start]/* [cite: 890] */
    modalTitle.textContent = 'Browse Categories';
    currentHierarchyPath = [];
    updateBreadcrumbs();
    await renderCategoryLevel(collection(db, getHierarchyBasePath(), 'topicHierarchy'));
    openModal('categoryBrowserModal'); [cite_start]/* [cite: 891] */
}

async function renderCategoryLevel(collectionRef) {
    const modalContent = document.getElementById('categoryBrowserModalContent'); [cite_start]/* [cite: 892] */
    modalContent.innerHTML = getLoaderHTML('Loading categories...');
    try {
        const snapshot = await getDocs(query(collectionRef)); [cite_start]/* [cite: 893] */
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), path: doc.ref.path }));
        items.sort((a, b) => a.title.localeCompare(b.title)); [cite_start]/* [cite: 894] */
        if (items.length === 0) {
            modalContent.innerHTML = `<p class="themed-text-muted text-center">No categories found at this level.</p>`; [cite_start]/* [cite: 895] */
            return;
        }

        const categoryGrid = document.createElement('div'); [cite_start]/* [cite: 896] */
        categoryGrid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';

        categoryGrid.innerHTML = items.map(item => `
            <div class="border rounded-lg p-4 flex flex-col items-start hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 cursor-pointer category-selector-item" data-item='${JSON.stringify(item).replace(/'/g, "&#39;")}'>
                <h3 class="font-semibold text-lg themed-text-accent">${item.title}</h3>
                ${item.description ? `<p class="text-sm 
themed-text-muted mt-1 flex-grow">${item.description}</p>` : ''}
                <span class="text-sm font-semibold themed-text-primary mt-4 self-end">Select →</span>
            </div>
        `).join(''); [cite_start]/* [cite: 898] */
        modalContent.innerHTML = '';
        modalContent.appendChild(categoryGrid);
        
        modalContent.querySelectorAll('.category-selector-item').forEach(itemEl => {
            itemEl.addEventListener('click', handleCategoryDrillDown);
        }); [cite_start]/* [cite: 899] */
    } catch (error) {
        console.error("Error rendering category level:", error); [cite_start]/* [cite: 900] */
        modalContent.innerHTML = `<p class="text-red-500 text-center">Error loading categories. Check console for details.</p>`; [cite_start]/* [cite: 901] */
    }
}

async function handleCategoryDrillDown(e) {
    const itemData = JSON.parse(e.currentTarget.dataset.item); [cite_start]/* [cite: 902] */
    currentHierarchyPath.push(itemData);
    updateBreadcrumbs();

    let nextCollectionName;
    if (currentHierarchyPath.length === 1) nextCollectionName = 'subCategories';
    else if (currentHierarchyPath.length === 2) nextCollectionName = 'finalCategories'; [cite_start]/* [cite: 903] */
    else {
        // This is a final category selection
        closeModal('categoryBrowserModal'); [cite_start]/* [cite: 904] */
        await generateAndPopulateAICategory(currentHierarchyPath);
        return;
    }
    
    const currentDocRef = doc(db, itemData.path); [cite_start]/* [cite: 905] */
    const nextCollectionRef = collection(currentDocRef, nextCollectionName);
    await renderCategoryLevel(nextCollectionRef);
}

function updateBreadcrumbs() {
    const breadcrumbsContainer = document.getElementById('categoryBrowserBreadcrumbs'); [cite_start]/* [cite: 906] */
    if (currentHierarchyPath.length === 0) {
        breadcrumbsContainer.innerHTML = `<span class="font-semibold themed-text-primary cursor-pointer" data-index="-1">Top Level</span>`; [cite_start]/* [cite: 907] */
    } else {
         breadcrumbsContainer.innerHTML = `<span class="breadcrumb-item cursor-pointer hover:underline" data-index="-1">Top Level</span>` + 
         currentHierarchyPath.map((item, index) => 
            `<span class="mx-2 themed-text-muted">/</span><span class="breadcrumb-item cursor-pointer hover:underline" data-index="${index}">${item.title}</span>`
        ).join(''); [cite_start]/* [cite: 908] */
    }
    

    breadcrumbsContainer.querySelectorAll('.breadcrumb-item').forEach(crumb => {
        crumb.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index, 10);
            if (index === -1) {
       
                 [cite_start]currentHierarchyPath = []; /* [cite: 910] */
                renderCategoryLevel(collection(db, getHierarchyBasePath(), 'topicHierarchy'));
            } else {
                currentHierarchyPath = currentHierarchyPath.slice(0, index + 1);
    
                const parentPath = currentHierarchyPath[currentHierarchyPath.length - 1].path; [cite_start]/* [cite: 911] */
                const parentRef = doc(db, parentPath);
                renderCategoryLevel(collection(parentRef, index === 0 ? 'subCategories' : 'finalCategories'));
                
            }
            updateBreadcrumbs();
        });
    }); [cite_start]/* [cite: 912] */
}


// --- NEW: Hierarchy Management Functions ---
function openHierarchyManagementModal() {
    resetHierarchySelection(); [cite_start]/* [cite: 913] */
    loadHierarchyColumn('main');
    openModal('hierarchyManagementModal');
}

function resetHierarchySelection() {
    selectedHierarchyItems = { main: null, sub: null, final: null }; [cite_start]/* [cite: 914] */
    document.getElementById('main-category-list').innerHTML = '';
    document.getElementById('sub-category-list').innerHTML = '';
    document.getElementById('final-category-list').innerHTML = '';
    document.getElementById('new-sub-category-input').disabled = true;
    document.getElementById('add-sub-category-btn').disabled = true;
    document.getElementById('new-final-category-input').disabled = true; [cite_start]/* [cite: 915] */
    document.getElementById('add-final-category-btn').disabled = true;
    hideHierarchyForm();
}

async function loadHierarchyColumn(level, parentDocData = null) {
    let collectionRef; [cite_start]/* [cite: 916] */
    let listElementId;

    if (level === 'main') {
        collectionRef = collection(db, getHierarchyBasePath(), 'topicHierarchy'); [cite_start]/* [cite: 917] */
        listElementId = 'main-category-list';
    } else if (level === 'sub' && parentDocData) {
        collectionRef = collection(db, parentDocData.path, 'subCategories'); [cite_start]/* [cite: 918] */
        listElementId = 'sub-category-list';
    } else if (level === 'final' && parentDocData) {
        collectionRef = collection(db, parentDocData.path, 'finalCategories'); [cite_start]/* [cite: 919] */
        listElementId = 'final-category-list';
    } else {
        return; [cite_start]/* [cite: 920] */
    }

    const listElement = document.getElementById(listElementId);
    listElement.innerHTML = getLoaderHTML('Loading...'); [cite_start]/* [cite: 921] */
    try {
        const q = query(collectionRef); [cite_start]/* [cite: 922] */
        const snapshot = await getDocs(q);
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), path: doc.ref.path })); [cite_start]/* [cite: 923] */
        items.sort((a, b) => a.title.localeCompare(b.title));
        
        listElement.innerHTML = items.map(item => `
            <div class="hierarchy-item" data-id="${item.id}" data-level="${level}">
                ${item.title}
            </div>
        `).join(''); [cite_start]/* [cite: 924] */
        listElement.querySelectorAll('.hierarchy-item').forEach(itemEl => {
            itemEl.addEventListener('click', () => handleHierarchySelection(level, itemEl.dataset.id, items));
        }); [cite_start]/* [cite: 925] */
    } catch (error) {
        console.error(`Error loading ${level} categories:`, error); [cite_start]/* [cite: 926] */
        listElement.innerHTML = `<p class="text-red-500 text-xs">Error loading. Check console for details.</p>`; [cite_start]/* [cite: 927] */
    }
}

function handleHierarchySelection(level, id, items) {
    const selectedItem = items.find(item => item.id === id); [cite_start]/* [cite: 928] */
    document.querySelectorAll(`[data-level="${level}"]`).forEach(el => el.classList.remove('selected'));
    document.querySelector(`[data-level="${level}"][data-id="${id}"]`).classList.add('selected');

    if (level === 'main') {
        selectedHierarchyItems.main = selectedItem; [cite_start]/* [cite: 929] */
        selectedHierarchyItems.sub = null;
        selectedHierarchyItems.final = null;
        document.getElementById('sub-category-list').innerHTML = '';
        document.getElementById('final-category-list').innerHTML = '';
        document.getElementById('new-sub-category-input').disabled = false;
        document.getElementById('add-sub-category-btn').disabled = false; [cite_start]/* [cite: 930] */
        document.getElementById('new-final-category-input').disabled = true;
        document.getElementById('add-final-category-btn').disabled = true;
        loadHierarchyColumn('sub', selectedItem);
        showHierarchyForm(selectedItem, 'main'); [cite_start]/* [cite: 931] */
    } else if (level === 'sub') {
        selectedHierarchyItems.sub = selectedItem; [cite_start]/* [cite: 932] */
        selectedHierarchyItems.final = null;
        document.getElementById('final-category-list').innerHTML = '';
        document.getElementById('new-final-category-input').disabled = false;
        document.getElementById('add-final-category-btn').disabled = false;
        loadHierarchyColumn('final', selectedItem);
        showHierarchyForm(selectedItem, 'sub'); [cite_start]/* [cite: 933] */
    } else if (level === 'final') {
        selectedHierarchyItems.final = selectedItem; [cite_start]/* [cite: 934] */
        showHierarchyForm(selectedItem, 'final');
    }
}

async function handleAddHierarchyItem(level) {
    let parentData, collectionName, inputElementId; [cite_start]/* [cite: 935] */
    const data = {};

    if (level === 'main') {
        collectionName = 'topicHierarchy'; [cite_start]/* [cite: 936] */
        inputElementId = 'new-main-category-input';
    } else if (level === 'sub') {
        parentData = selectedHierarchyItems.main; [cite_start]/* [cite: 937] */
        if (!parentData) { displayMessageInModal("Please select a Main Category first.", 'warning'); return; [cite_start]/* [cite: 938] */
        }
        collectionName = 'subCategories'; [cite_start]/* [cite: 939] */
        inputElementId = 'new-sub-category-input';
    } else if (level === 'final') {
        parentData = selectedHierarchyItems.sub; [cite_start]/* [cite: 940] */
        if (!parentData) { displayMessageInModal("Please select a Sub Category first.", 'warning'); return; [cite_start]/* [cite: 941] */
        }
        collectionName = 'finalCategories'; [cite_start]/* [cite: 942] */
        inputElementId = 'new-final-category-input';
        data.description = "Default description.";
        data.initialPrompt = "Default initial prompt.";
        data.fullPrompt = "Default full prompt."; [cite_start]/* [cite: 943] */
    }

    const inputElement = document.getElementById(inputElementId);
    const title = inputElement.value.trim(); [cite_start]/* [cite: 944] */
    if (!title) return;

    data.title = title;

    try {
        const collectionRef = parentData ? [cite_start]/* [cite: 945] */
collection(db, parentData.path, collectionName) : 
            collection(db, getHierarchyBasePath(), collectionName); [cite_start]/* [cite: 946] */
        await addDoc(collectionRef, data); [cite_start]/* [cite: 947] */
        inputElement.value = '';
        loadHierarchyColumn(level, parentData);
    } catch (error) {
        console.error(`Error adding ${level} item:`, error); [cite_start]/* [cite: 947] */
        displayMessageInModal(`Failed to add item. Check console.`, 'error');
    }
}

function showHierarchyForm(item, level) {
    document.getElementById('hierarchy-form-placeholder').classList.add('hidden'); [cite_start]/* [cite: 948] */
    const form = document.getElementById('hierarchy-edit-form');
    form.classList.remove('hidden');
    form.dataset.itemPath = item.path;
    form.dataset.level = level;

    document.getElementById('edit-title').value = item.title || ''; [cite_start]/* [cite: 949] */
    const finalFields = ['edit-description-container', 'edit-initial-prompt-container', 'edit-full-prompt-container'];
    if (level === 'final') {
        finalFields.forEach(id => document.getElementById(id).classList.remove('hidden')); [cite_start]/* [cite: 950] */
        document.getElementById('edit-description').value = item.description || '';
        document.getElementById('edit-initial-prompt').value = item.initialPrompt || '';
        document.getElementById('edit-full-prompt').value = item.fullPrompt || ''; [cite_start]/* [cite: 951] */
    } else {
        finalFields.forEach(id => document.getElementById(id).classList.add('hidden')); [cite_start]/* [cite: 952] */
    }
}

function hideHierarchyForm() {
    document.getElementById('hierarchy-form-placeholder').classList.remove('hidden'); [cite_start]/* [cite: 953] */
    document.getElementById('hierarchy-edit-form').classList.add('hidden');
}

async function handleSaveHierarchyItem() {
    const form = document.getElementById('hierarchy-edit-form'); [cite_start]/* [cite: 954] */
    const itemPath = form.dataset.itemPath;
    const level = form.dataset.level;
    if (!itemPath) return; [cite_start]/* [cite: 955] */
    const data = {
        title: document.getElementById('edit-title').value.trim()
    }; [cite_start]/* [cite: 956] */
    if (level === 'final') {
        data.description = document.getElementById('edit-description').value.trim(); [cite_start]/* [cite: 957] */
        data.initialPrompt = document.getElementById('edit-initial-prompt').value.trim();
        data.fullPrompt = document.getElementById('edit-full-prompt').value.trim();
    }

    try {
        const docRef = doc(db, itemPath); [cite_start]/* [cite: 958] */
        await updateDoc(docRef, data);
        displayMessageInModal('Item updated successfully!', 'success');
        
        let parentData = null;
        if (level === 'sub') parentData = selectedHierarchyItems.main; [cite_start]/* [cite: 588] */
        if (level === 'final') parentData = selectedHierarchyItems.sub;

        loadHierarchyColumn(level, parentData);
        hideHierarchyForm(); [cite_start]/* [cite: 960] */
    } catch (error) {
        console.error("Error saving item:", error); [cite_start]/* [cite: 961] */
        displayMessageInModal("Failed to save. Check console.", 'error');
    }
}

async function handleDeleteHierarchyItem() {
    const form = document.getElementById('hierarchy-edit-form'); [cite_start]/* [cite: 962] */
    const itemPath = form.dataset.itemPath;
    const title = document.getElementById('edit-title').value;
    if (!itemPath) return; [cite_start]/* [cite: 963] */
    showConfirmationModal(`Are you sure you want to delete "${title}"? This will also delete all of its children.`, async () => {
        try {
            const docRef = doc(db, itemPath);
            await deleteDoc(docRef);
                   
            [cite_start]displayMessageInModal('Item deleted successfully!', 'success'); /* [cite: 965] */
            resetHierarchySelection();
            loadHierarchyColumn('main');
        } catch (error) {
            console.error("Error deleting item:", error);
              
            displayMessageInModal("Failed to delete. Check console.", 'error'); [cite_start]/* [cite: 966] */
        }
    }); [cite_start]/* [cite: 966] */
}

// --- Custom Modal/Message Box Functions (replacing alert/confirm) ---
function displayMessageInModal(message, type = 'info') {
    const modalId = 'messageModal'; [cite_start]/* [cite: 967] */
    let modal = document.getElementById(modalId);
    if (!modal) {
        modal = document.createElement('div'); [cite_start]/* [cite: 968] */
        modal.id = modalId;
        modal.className = 'fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4 hidden modal'; [cite_start]/* [cite: 969] */
        modal.innerHTML = `
            <div class="card p-8 w-full max-w-sm m-4 text-center">
                <h2 id="messageModalTitle" class="text-2xl font-bold mb-4"></h2>
                <p id="messageModalContent" class="mb-6 themed-text-muted"></p>
                 
               <button id="closeMessageModal" class="btn-primary w-full">OK</button>
            </div>
        `; [cite_start]/* [cite: 971] */
        document.body.appendChild(modal);
        modal.querySelector('#closeMessageModal').addEventListener('click', () => closeModal(modalId));
    }

    const titleEl = modal.querySelector('#messageModalTitle'); [cite_start]/* [cite: 972] */
    const contentEl = modal.querySelector('#messageModalContent');
    
    titleEl.textContent = type === 'error' ? 'Error!' : (type === 'warning' ? 'Warning!' : 'Info'); [cite_start]/* [cite: 973] */
    titleEl.className = `text-2xl font-bold mb-4 ${type === 'error' ? 'text-red-600' : (type === 'warning' ? 'text-yellow-600' : 'themed-text-primary')}`; [cite_start]/* [cite: 974] */
    contentEl.textContent = message;

    openModal(modalId);
}

function showConfirmationModal(message, onConfirmCallback) {
    const modalId = 'confirmationModal'; [cite_start]/* [cite: 975] */
    let modal = document.getElementById(modalId);
    if (!modal) {
        modal = document.createElement('div'); [cite_start]/* [cite: 976] */
        modal.id = modalId;
        modal.className = 'fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4 hidden modal'; [cite_start]/* [cite: 977] */
        modal.innerHTML = `
            <div class="card p-8 w-full max-w-sm m-4 text-center">
                <h2 class="text-2xl font-bold mb-4 themed-text-primary">Confirm Action</h2>
                <p id="confirmationModalContent" class="mb-6 themed-text-muted"></p>
                
                <div class="flex justify-center gap-4">
                    <button id="confirmYesBtn" class="btn-primary">Yes</button>
                    <button id="confirmNoBtn" class="btn-secondary">No</button>
                </div>
     
               </div>
        `; [cite_start]/* [cite: 980] */
        document.body.appendChild(modal);
    }

    const contentEl = modal.querySelector('#confirmationModalContent');
    contentEl.textContent = message; [cite_start]/* [cite: 981] */
    const confirmYesBtn = modal.querySelector('#confirmYesBtn');
    const confirmNoBtn = modal.querySelector('#confirmNoBtn');

    // Clear previous listeners to prevent multiple calls
    const newConfirmYesBtn = confirmYesBtn.cloneNode(true); [cite_start]/* [cite: 982] */
    confirmYesBtn.parentNode.replaceChild(newConfirmYesBtn, confirmYesBtn);
    const newConfirmNoBtn = confirmNoBtn.cloneNode(true);
    confirmNoBtn.parentNode.replaceChild(newConfirmNoBtn, confirmNoBtn);

    newConfirmYesBtn.addEventListener('click', () => {
        onConfirmCallback();
        closeModal(modalId);
    }); [cite_start]/* [cite: 983] */
    newConfirmNoBtn.addEventListener('click', () => {
        closeModal(modalId);
    }); [cite_start]/* [cite: 984] */
    openModal(modalId);
}


// --- AI Log Functions ---
function displayAiLog() {
    const contentEl = document.getElementById('aiLogModalContent'); [cite_start]/* [cite: 985] */
    contentEl.innerHTML = '';
    
    if (aiLog.length === 0) {
        contentEl.innerHTML = `<p class="themed-text-muted text-center">No AI interactions have been logged yet.</p>`; [cite_start]/* [cite: 986] */
        openModal('aiLogModal');
        return;
    }

    const reversedLog = [...aiLog].reverse(); [cite_start]/* [cite: 987] */
    reversedLog.forEach((log, index) => {
        const logItem = document.createElement('div');
        logItem.className = 'accordion-item';

        const promptBlockId = `prompt-block-${index}`;
        const responseBlockId = `response-block-${index}`;

        logItem.innerHTML = `
    
        <button type="button" class="accordion-header">
                <span class="text-left font-semibold">${log.timestamp.toLocaleTimeString()} - ${log.type}</span>
                <svg class="icon w-5 h-5 transition-transform shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
             
       </button>
            <div class="accordion-content">
                <div class="mb-4">
                    <h4 class="font-semibold themed-text-accent mb-2">Prompt:</h4>
                
            <div id="${promptBlockId}" class="code-block-container !mt-0">
                        <div class="code-block-header"><span>Prompt</span><button class="copy-code-button">Copy</button></div>
                        <pre class="text-sm">${log.prompt}</pre>
                  
           </div>
                </div>
                <div>
                    <h4 class="font-semibold themed-text-accent mb-2">Response:</h4>
           
                  <div id="${responseBlockId}" class="code-block-container !mt-0">
                        <div class="code-block-header"><span>Response</span><button class="copy-code-button">Copy</button></div>
                        <pre class="text-sm">${log.response || [cite_start]/* [cite: 993] */
"No response text received."}</pre>
                    </div>
                </div>
            </div>
        `; [cite_start]/* [cite: 994] */
        contentEl.appendChild(logItem);
    });

    openModal('aiLogModal');
}

// --- NEW: Data Management Functions ---
function checkBackupReminder() {
    const lastBackup = localStorage.getItem('lastBackupTimestamp'); [cite_start]/* [cite: 995] */
    if (!lastBackup) {
        document.getElementById('backup-reminder-banner').classList.remove('hidden');
        return; [cite_start]/* [cite: 996] */
    }
    const sevenDaysInMillis = 7 * 24 * 60 * 60 * 1000; [cite_start]/* [cite: 997] */
    if (Date.now() - parseInt(lastBackup, 10) > sevenDaysInMillis) {
        document.getElementById('backup-reminder-banner').classList.remove('hidden'); [cite_start]/* [cite: 998] */
    }
}

async function handleExportData() {
    const button = document.getElementById('export-data-button'); [cite_start]/* [cite: 999] */
    const originalContent = button.innerHTML;
    button.innerHTML = 'Exporting...';
    button.disabled = true; [cite_start]/* [cite: 1000] */
    try {
        const exportData = {
            topicHierarchy: {},
        }; [cite_start]/* [cite: 1001] */
        async function getCollectionData(collectionPath) {
            const collectionRef = collection(db, ...collectionPath); [cite_start]/* [cite: 1002] */
            const snapshot = await getDocs(collectionRef);
            if (snapshot.empty) return null;
            
            const docs = {}; [cite_start]/* [cite: 1003] */
            for (const docSnap of snapshot.docs) {
                const docData = docSnap.data(); [cite_start]/* [cite: 1004] */
                docs[docSnap.id] = { data: docData, subcollections: {} };
                
                const subcollectionNames = ['subCategories', 'finalCategories']; [cite_start]/* [cite: 1005] */
                for (const subName of subcollectionNames) {
                    const subPath = [...collectionPath, docSnap.id, subName]; [cite_start]/* [cite: 1006] */
                    const subDocs = await getCollectionData(subPath);
                    if (subDocs) {
                        docs[docSnap.id].subcollections[subName] = subDocs; [cite_start]/* [cite: 1007] */
                    }
                }
            }
            return docs; [cite_start]/* [cite: 1008] */
        }

        exportData.topicHierarchy = await getCollectionData([getHierarchyBasePath(), 'topicHierarchy']); [cite_start]/* [cite: 1009] */
        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob); [cite_start]/* [cite: 1010] */
        const a = document.createElement('a');
        a.href = url;
        a.download = `it-admin-hub-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        localStorage.setItem('lastBackupTimestamp', Date.now().toString());
        document.getElementById('backup-reminder-banner').classList.add('hidden'); [cite_start]/* [cite: 1011] */
        displayMessageInModal('Data exported successfully!', 'success');

    } catch (error) {
        console.error("Error exporting data:", error); [cite_start]/* [cite: 1012] */
        displayMessageInModal(`Export failed: ${error.message}`, 'error');
    } finally {
        button.innerHTML = originalContent; [cite_start]/* [cite: 1013] */
        button.disabled = false;
    }
}

function handleImportData() {
    const input = document.createElement('input'); [cite_start]/* [cite: 1014] */
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
        const file = e.target.files[0]; [cite_start]/* [cite: 1015] */
        if (!file) return;

        const reader = new FileReader();
        reader.onload = readerEvent => {
            try {
                const importedData = JSON.parse(readerEvent.target.result); [cite_start]/* [cite: 1016] */
                if (!importedData.topicHierarchy) {
                    throw new Error("Invalid backup file format. Missing 'topicHierarchy' key."); [cite_start]/* [cite: 1017] */
                }

                showConfirmationModal("Are you sure you want to import this data? This will PERMANENTLY OVERWRITE the existing topic hierarchy. This action cannot be undone.", async () => {
                    const button = document.getElementById('import-data-button');
                    
                    const originalContent = button.innerHTML;
                    button.innerHTML = 'Importing...';
                    button.disabled = true;

                    [cite_start]try /* [cite: 1019] */
{
                        async function setCollectionData(collectionPath, collectionData) {
                            for (const docId in collectionData) {
                       
                                const docInfo = collectionData[docId]; [cite_start]/* [cite: 1021] */
                                const docRef = doc(db, ...collectionPath, docId);
                                   
                                await setDoc(docRef, docInfo.data); [cite_start]/* [cite: 1022] */

                                for (const subName in docInfo.subcollections) {
                                    [cite_start]const subPath = [...collectionPath, /* [cite: 1022] */
docId, subName];
                                    await setCollectionData(subPath, docInfo.subcollections[subName]);
                                }
                            }
                        }

                           
                        await setCollectionData([getHierarchyBasePath(), 'topicHierarchy'], importedData.topicHierarchy); [cite_start]/* [cite: 1024] */
                        displayMessageInModal('Data imported successfully! The application will now reload.', 'success'); [cite_start]/* [cite: 1024] */
                        setTimeout(() => location.reload(), 3000);

                    } catch (importError) {
                        console.error("Error during import:", importError); [cite_start]/* [cite: 1025] */
                        displayMessageInModal(`Import failed: ${importError.message}`, 'error');
                    } finally {
                         button.innerHTML = originalContent; [cite_start]/* [cite: 1026] */
                         button.disabled = false;
                    }
                }); [cite_start]/* [cite: 1027] */
            } catch (parseError) {
                console.error("Error parsing import file:", parseError); [cite_start]/* [cite: 1028] */
                displayMessageInModal(`Could not read file. Is it a valid JSON backup?`, 'error'); [cite_start]/* [cite: 1029] */
            }
        };
        reader.readAsText(file);
    };
    input.click(); [cite_start]/* [cite: 1030] */
}
