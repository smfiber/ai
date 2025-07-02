import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, onSnapshot, Timestamp, doc, setDoc, deleteDoc, updateDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- Firebase State ---
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

const jsonInstruction = ` IMPORTANT: Ensure your response is ONLY a valid JSON object.
All strings must be enclosed in double quotes. Any double quotes or backslashes within a string value must be properly escaped (e.g., "This is a \\"sample\\" description." or "C:\\\\Users\\\\Admin").
Do not wrap the JSON in markdown code fences.`;

// --- Prompt Engineering Constants ---
// ** UPDATED PROMPT (Final Review Prompt) **
const finalReviewPrompt = `
Persona: You are a Lead Technical Editor and a Senior IT Systems Architect.
Your role is final quality assurance.
Objective: Your mission is to audit the DRAFT CONTENT provided below against its ORIGINAL BLUEPRINT.
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
    * **Eliminate all meta-commentary, asides, and notes from the AI (e.g., "Pro Tip:", "Note:", "This is a hypothetical example").
    Integrate advice naturally into the narrative.**
    * Enforce consistent terminology.
    * Ensure all formatting is clean and consistent, preserving the '###' header structure.
**Final Output Instruction:**
Return ONLY the complete, final, rewritten markdown for the sections you were asked to review.
Do not provide a preamble, a list of your changes, or any text other than the final, revised document.
Your response must begin directly with the first header of the content you are reviewing (e.g., ### 5. Key Concepts - In-Depth Application & Management).
`;

// --- Global State & Configuration ---
let geminiApiKey = "";
const root = document.documentElement;
const allThemeData = {};
let originalGeneratedText = new Map();
let aiLog = [];
let currentHierarchyPath = [];
let selectedHierarchyItems = { main: null, sub: null, final: null };
// --- Google Drive Integration State & Config ---
let gapiInited = false;
let gisInited = false;
let tokenClient;
let GOOGLE_CLIENT_ID = '';
const G_SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/cloud-platform';
let driveFolderId = null;

// --- App Initialization & Event Listeners ---
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
        const geminiInput = document.getElementById('geminiApiKeyInput');
        if (geminiInput) geminiInput.value = geminiApiKey;

        const firebaseInput = document.getElementById('firebaseConfigInput');
        if (firebaseInput) firebaseInput.value = JSON.stringify(firebaseConfig, null, 2);
        
        if (GOOGLE_CLIENT_ID) {
            const googleClientInput = document.getElementById('googleClientIdInput');
            if (googleClientInput) googleClientInput.value = GOOGLE_CLIENT_ID;
        }
        return true;
    }
    return false;
}

/**
 * [MODIFIED] This is the new gatekeeper function. It checks if all required services
 * (Firebase Auth, Google GAPI Client) are ready before launching the main app.
 * It's designed to be called by both Firebase and Google auth callbacks.
 */
function checkAndLaunchApp() {
    // Conditions to prevent launch:
    // 1. App is already initialized.
    // 2. Firebase user isn't authenticated yet.
    // 3. Google API client doesn't have a token yet (for features like image gen).
    if (appIsInitialized || !auth.currentUser || !gapi.client.getToken()) {
        return;
    }

    // All conditions met, proceed with app initialization.
    initializeAppContent();
}


// --- Login/Logout UI and Handlers ---
/**
 * [MODIFIED] This function NO LONGER calls initializeAppContent(). Its only job
 * is to update the UI based on the user's authentication status.
 */
function _performAuthUISetup(user, authStatusEl, appContainer) {
    if (user) {
        appContainer.classList.remove('hidden');
        appContainer.style.display = 'block';
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
        
        // CRITICAL CHANGE: The call to initializeAppContent() is removed from here.
        // It is now handled by the checkAndLaunchApp() gatekeeper function.

    } else {
         authStatusEl.innerHTML = `
             <button id="login-button" class="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white font-semibold py-2 px-4 rounded-full flex items-center justify-center gap-2" title="Sign In with Google">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48" fill="none"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path><path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path><path fill="#4CAF50" d="M24 44c5.166 0 9.599-1.521 12.643-4.001L30.27 34.138C28.714 36.548 26.521 38 24 38c-5.223 0-9.657-3.341-11.303-7.918l-6.573 4.818C9.656 39.663 16.318 44 24 44z"></path><path fill="#1976D2" d="M43.611 20.083H24v8h11.303c-.792 2.237-2.231 4.16-4.082 5.571l5.657 5.657C41.389 36.197 44 30.669 44 24c0-1.341-.138-2.65-.389-3.917z"></path></svg>
               
                 <span>Login with Google</span>
            </button>
        `;
        document.getElementById('login-button').addEventListener('click', handleLogin);
        
        appContainer.classList.add('hidden');
        if (!localStorage.getItem('geminiApiKey')) {
             openModal('apiKeyModal');
        }
    }
}

function setupAuthUI(user) {
    let authStatusEl = document.getElementById('auth-status');
    let appContainer = document.getElementById('app-container');

    if (authStatusEl && appContainer) {
        _performAuthUISetup(user, authStatusEl, appContainer);
    } else {
        const interval = setInterval(() => {
            authStatusEl = document.getElementById('auth-status');
            appContainer = document.getElementById('app-container');
            if (authStatusEl && appContainer) {
                clearInterval(interval);
                _performAuthUISetup(user, authStatusEl, appContainer);
            }
        }, 100);
    }
}

async function handleLogin() {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/cloud-platform');
    try {
        const result = await signInWithPopup(auth, provider);
        console.log("Popup sign-in successful for:", result.user.displayName);
    } catch (error) {
        console.error("Google Sign-In Popup failed:", error);
        const errorEl = document.getElementById('api-key-error');
        if (errorEl) {
           let userMessage = `Login failed: ${error.code}.`;
           if (error.code === 'auth/popup-closed-by-user') {
               userMessage += ' You closed the login window before completing sign-in.';
           } else if (error.code === 'auth/cancelled-popup-request') {
               userMessage += ' Multiple login windows were opened. Please try again.';
           } else {
               userMessage += ' This can be caused by browser pop-up blockers or security settings. Please check your browser settings and try again.';
           }
           errorEl.textContent = userMessage;
        }
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
        localStorage.removeItem('geminiApiKey');
        localStorage.removeItem('firebaseConfig');
        localStorage.removeItem('googleClientId');
        console.log('User signed out and local storage cleared.');
        location.reload();
    }).catch(error => {
        console.error("Sign out failed:", error);
        const authStatusEl = document.getElementById('auth-status');
        if(authStatusEl) authStatusEl.innerHTML = `<p class="text-red-300">Sign out failed.</p>`;
  });
}

async function initializeAppContent() {
    // This flag prevents this function from running multiple times.
    appIsInitialized = true; 
    
    openModal('loadingStateModal');
    const loadingMessageEl = document.getElementById('loading-message');
    loadingMessageEl.textContent = "Waking up the AI...";

    document.getElementById('gemini-result-container').innerHTML = '';
    
    checkBackupReminder();

    try {
        await generateAndApplyDefaultTheme();
        loadingMessageEl.textContent = "Loading application content...";
        await loadAppContent();
    } catch (error) {
        const errorMessage = error ? error.message : "An unknown error occurred.";
        console.error("A critical error occurred during app initialization:", errorMessage);
        localStorage.clear();
        openModal('apiKeyModal');
        const errorEl = document.getElementById('api-key-error');
        if(errorEl) {
            errorEl.textContent = `Setup failed: ${errorMessage}. Your keys have been cleared. Please check and re-enter them.`;
        }
    } finally {
        closeModal('loadingStateModal');
    }
}

function initializeGoogleClients() {
    if (!GOOGLE_CLIENT_ID) {
        console.warn("Google Client ID is not provided. Cloud features will be disabled.");
        return;
    }

    const cloudStorageCard = document.getElementById('cloud-storage-card');
    if (cloudStorageCard) cloudStorageCard.classList.remove('hidden');

    const googleDriveSection = document.getElementById('google-drive-section');
    if (googleDriveSection) googleDriveSection.classList.remove('hidden');

    const gapiInterval = setInterval(() => {
        if (window.gapi && window.gapi.load) {
            clearInterval(gapiInterval);
            gapi.load('client:picker', () => {
                gapiInited = true;
                initializeGapiClient();
            });
        }
    }, 100);
    const gsiInterval = setInterval(() => {
        if (window.google && window.google.accounts) {
            clearInterval(gsiInterval);
            google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: () => {}, 
            });
            gisInited = true;
        }
    }, 100);
}

/**
 * [MODIFIED] The onAuthStateChanged listener now calls checkAndLaunchApp()
 * after it has set up the user's state.
 */
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
            // Attempt to launch the app now that Firebase auth state is known.
            checkAndLaunchApp(); 
        });
    } catch (error) {
        console.error("Firebase initialization error:", error);
        openModal('apiKeyModal');
        const errorEl = document.getElementById('api-key-error');
        if(errorEl) {
            errorEl.textContent = `Firebase Error: ${error.message}. Please check your config object.`;
        }
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

function setupEventListeners() {
    const apiKeyForm = document.getElementById('apiKeyForm');
    if (apiKeyForm) apiKeyForm.addEventListener('submit', handleApiKeySubmit);

    const geminiForm = document.getElementById('gemini-form');
    if (geminiForm) geminiForm.addEventListener('submit', handleGeminiSubmit);

    const generateThemeBtn = document.getElementById('generate-theme-btn');
    if (generateThemeBtn) generateThemeBtn.addEventListener('click', handleCustomVisualThemeGeneration);
    
    const exploreFeaturedBtn = document.getElementById('explore-featured-btn');
    if (exploreFeaturedBtn) exploreFeaturedBtn.addEventListener('click', () => openCategoryBrowser('featured'));

    const browseAllBtn = document.getElementById('browse-all-btn');
    if (browseAllBtn) browseAllBtn.addEventListener('click', () => openCategoryBrowser('all'));

    const closeCategoryBrowserModal = document.getElementById('closeCategoryBrowserModal');
    if (closeCategoryBrowserModal) closeCategoryBrowserModal.addEventListener('click', () => closeModal('categoryBrowserModal'));

    const authButton = document.getElementById('auth-button');
    if (authButton) authButton.addEventListener('click', handleAuthClick);

    const loadFromDriveBtn = document.getElementById('load-from-drive-btn');
    if (loadFromDriveBtn) loadFromDriveBtn.addEventListener('click', async () => {
        const folderId = await getDriveFolderId();
        createPicker('open', folderId);
    });

    const newPlanButton = document.getElementById('new-plan-button');
    if (newPlanButton) newPlanButton.addEventListener('click', () => location.reload());

    const promptsButton = document.getElementById('prompts-button');
    if (promptsButton) promptsButton.addEventListener('click', displayPromptsInModal);

    const realTimeLogButton = document.getElementById('real-time-log-button');
    if (realTimeLogButton) realTimeLogButton.addEventListener('click', displayAiLog);

    const themeChangerButton = document.getElementById('theme-changer-button');
    if (themeChangerButton) themeChangerButton.addEventListener('click', () => {
        if(!geminiApiKey) { openModal('apiKeyModal'); return; }
        openModal('themeGeneratorModal');
    });

    const aiHelpButton = document.getElementById('ai-help-button');
    if (aiHelpButton) aiHelpButton.addEventListener('click', handleAIHelpRequest);

    const scrollToTopButton = document.getElementById('scroll-to-top-button');
    if (scrollToTopButton) scrollToTopButton.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    
    const exportDataButton = document.getElementById('export-data-button');
    if (exportDataButton) exportDataButton.addEventListener('click', handleExportData);

    const importDataButton = document.getElementById('import-data-button');
    if (importDataButton) importDataButton.addEventListener('click', handleImportData);

    const settingsButton = document.getElementById('settings-button');
    const settingsPanel = document.getElementById('settings-panel');
    if (settingsButton && settingsPanel) {
        settingsButton.addEventListener('click', (e) => {
            e.stopPropagation();
            settingsPanel.classList.toggle('hidden');
        });
    }

    const fontFamilySelect = document.getElementById('font-family-select');
    if (fontFamilySelect) fontFamilySelect.addEventListener('change', (e) => root.style.setProperty('--font-family', e.target.value));

    const fontSizeSelect = document.getElementById('font-size-select');
    if (fontSizeSelect) fontSizeSelect.addEventListener('change', (e) => root.style.setProperty('--font-size-base', e.target.value));

    const lineHeightSelect = document.getElementById('line-height-select');
    if (lineHeightSelect) lineHeightSelect.addEventListener('change', (e) => root.style.setProperty('--line-height-base', e.target.value));
    
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.closest('[id^="close"]')) {
                closeModal(modal.id);
            }
        });
    });

    const searchGeminiButton = document.getElementById('search-gemini-button');
    if (searchGeminiButton) searchGeminiButton.addEventListener('click', handleSearchGemini);

    document.addEventListener('mouseup', handleTextSelection);
    document.addEventListener('mousedown', (e) => {
         const searchButton = document.getElementById('search-gemini-button');
         if (searchButton && !searchButton.classList.contains('hidden') && !searchButton.contains(e.target)) {
            searchButton.classList.add('hidden');
         }
    });
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
         
            copyElementTextToClipboard(codeBlock, e.target);
            return;
        }
        
        if (e.target.id === 'save-to-drive-btn') {
                
             handleSaveToDriveClick(e.target);
             return;
        }
        
        const addTopicBtn = e.target.closest('.add-topic-button');
        if(addTopicBtn) {
            handleAddNewTopic(addTopicBtn);
            return;
        }
        
        const tailorBtn = e.target.closest('#tailoring-buttons-container .btn-toggle');
        if (tailorBtn) {
            tailorBtn.classList.toggle('active');
            return;
        }

        const gridSelector = e.target.closest('.grid-card-selector');
        if (gridSelector) {
            handleGridSelect(gridSelector);
            return;
        }

        const exploreBtn = e.target.closest('.explore-button');
        if (exploreBtn) {
            const card = exploreBtn.closest('.card');
            const fullHierarchyPath = JSON.parse(card.dataset.fullHierarchyPath);
            const topicId = exploreBtn.dataset.topicId;
            handleExploreInDepth(topicId, fullHierarchyPath);
            return;
        }
        
        const refineBtn = e.target.closest('.refine-button');
        if (refineBtn) {
            toggleRefineUI(refineBtn.parentElement);
            return;
        }

        const modalRefineBtn = e.target.closest('.modal-refine-button');
        if (modalRefineBtn) {
            const modal = e.target.closest('.card');
            const targetModalId = modal.parentElement.id;
            if(targetModalId) {
                 toggleRefineUI(modalRefineBtn.parentElement, true, targetModalId);
            }
            return;
        }
        
        const submitRefineBtn = e.target.closest('.submit-refinement-button');
        if(submitRefineBtn) {
            const targetModalId = submitRefineBtn.dataset.targetModalId;
            handleRefineRequest(submitRefineBtn.closest('.refine-container'), targetModalId);
            return;
        }

        const generateMoreBtn = e.target.closest('.generate-more-button');
        if (generateMoreBtn) {
            handleGenerateMoreClick(generateMoreBtn);
            return;
        }

        const accordionHeader = e.target.closest('.accordion-header');
        if (accordionHeader) { 
            accordionHeader.classList.toggle('active');
            const icon = accordionHeader.querySelector('.icon');
            if(icon) {
               icon.style.transform = accordionHeader.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0deg)';
            }
            accordionHeader.nextElementSibling.classList.toggle('open');
            return;
        }

        if (settingsPanel && !settingsPanel.classList.contains('hidden') && !settingsPanel.contains(e.target) && !e.target.closest('#settings-button')) {
            settingsPanel.classList.add('hidden');
        }

        const generateDetailedStepsBtn = e.target.closest('#generate-detailed-steps-btn');
        if (generateDetailedStepsBtn) {
            generateFullDetailedGuide(generateDetailedStepsBtn);
            return;
        }
    });
    window.addEventListener('scroll', () => {
        const scrollTopButton = document.getElementById('scroll-to-top-button');
        if (scrollTopButton) {
            if (window.scrollY > 300) {
                scrollTopButton.classList.remove('hidden');
            } else {
                scrollTopButton.classList.add('hidden');
            }
        }
    });

    const hierarchyManagerButton = document.getElementById('hierarchy-manager-button');
    if(hierarchyManagerButton) hierarchyManagerButton.addEventListener('click', openHierarchyManagementModal);
    
    const addMainCategoryBtn = document.getElementById('add-main-category-btn');
    if(addMainCategoryBtn) addMainCategoryBtn.addEventListener('click', () => handleAddHierarchyItem('main'));
    
    const addSubCategoryBtn = document.getElementById('add-sub-category-btn');
    if(addSubCategoryBtn) addSubCategoryBtn.addEventListener('click', () => handleAddHierarchyItem('sub'));
    
    const addFinalCategoryBtn = document.getElementById('add-final-category-btn');
    if(addFinalCategoryBtn) addFinalCategoryBtn.addEventListener('click', () => handleAddHierarchyItem('final'));
    
    const saveHierarchyItemBtn = document.getElementById('save-hierarchy-item-btn');
    if(saveHierarchyItemBtn) saveHierarchyItemBtn.addEventListener('click', handleSaveHierarchyItem);
    
    const deleteHierarchyItemBtn = document.getElementById('delete-hierarchy-item-btn');
    if(deleteHierarchyItemBtn) deleteHierarchyItemBtn.addEventListener('click', handleDeleteHierarchyItem);

    const firebaseToolsButton = document.getElementById('firebase-tools-button');
    if(firebaseToolsButton) firebaseToolsButton.addEventListener('click', openStickyTopicsModal);
    
    const stickyTopicCategorySelect = document.getElementById('sticky-topic-category-select');
    if(stickyTopicCategorySelect) stickyTopicCategorySelect.addEventListener('change', (e) => listenForStickyTopics(e.target.value));
    
    const addStickyTopicButton = document.getElementById('add-sticky-topic-button');
    if(addStickyTopicButton) addStickyTopicButton.addEventListener('click', handleAddStickyTopic);
}

async function handleApiKeySubmit(e) {
    e.preventDefault();
    const tempGeminiKey = document.getElementById('geminiApiKeyInput').value.trim();
    const tempFirebaseConfigText = document.getElementById('firebaseConfigInput').value.trim();
    const tempGoogleClientId = document.getElementById('googleClientIdInput').value.trim();
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
    
    if (loadConfigFromStorage()) {
        initializeFirebase();
        initializeGoogleClients();
        handleLogin();
    }
}

// --- Google Drive & Firebase Functions ---

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
    if (!gisInited || !GOOGLE_CLIENT_ID) {
        console.error("Google GSI client or Client ID is missing. Cannot initialize token client.");
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
            },
            popup_closed_callback: () => {
                console.log('User closed the Google auth popup.');
                const statusEl = document.getElementById('drive-status');
      
                if (statusEl.textContent.includes('Connecting')) {
                    statusEl.textContent = 'Connection cancelled.';
                    setTimeout(() => updateSigninStatus(false), 2000);
                }
            }
        });
        tokenClient.requestAccessToken({prompt: 'none'});
    } catch(err) {
         console.error("Failed to initialize Google token client:", err);
    }
}

function handleAuthClick() {
     if (!gapiInited || !gisInited || !tokenClient) {
        console.error('Google services are not initialized yet.');
        document.getElementById('drive-status').textContent = 'Services initializing, please wait...';
        return;
    }

    if (gapi.client.getToken() === null) {
        document.getElementById('drive-status').textContent = 'Connecting to Google Drive...';
        tokenClient.requestAccessToken({prompt: 'consent'});
    } else {
        const token = gapi.client.getToken();
        if (token) {
            google.accounts.oauth2.revoke(token.access_token, () => {
                gapi.client.setToken(null);
                updateSigninStatus(false);
            });
        }
    }
}

/**
 * [MODIFIED] This function now calls checkAndLaunchApp() after updating the UI.
 * This ensures that if the Google Auth finishes after Firebase, it can trigger
 * the app launch.
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

    // Attempt to launch the app now that Google auth state is known.
    checkAndLaunchApp();
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
     
     let contentToSave;
     let statusEl;
     let cardName;
     let topicTitle;
     if (modal.parentElement.id === 'searchGeminiModal') {
        contentToSave = document.getElementById('searchGeminiResult').innerText;
        cardName = "Gemini Search";
        const fullTopicTitle = document.getElementById('searchGeminiQueryText').value;
        topicTitle = truncateText(fullTopicTitle, 40);
        statusEl = document.getElementById('search-modal-status-message');
    } else {
        const modalFooter = button.closest('[id$="ModalFooter"]');
        const fullTitle = modalFooter.dataset.fullTitle;
        cardName = modalFooter.dataset.cardName || "Guide";
        contentToSave = originalGeneratedText.get(fullTitle);
        topicTitle = fullTitle.replace(/In-Depth: |Custom Guide: /g, '');
        statusEl = modalFooter.querySelector('p[id$="status-message"]');
    }
     
     if (!contentToSave) {
        console.error("Could not find content to save for:", topicTitle);
        if (statusEl) statusEl.textContent = "Error: Content not found.";
        return;
     }

     const fileName = `${cardName} - ${topicTitle}.md`.replace(/[/\\?%*:|"<>]/g, '-');
     await saveContentToDrive(contentToSave, fileName, statusEl);
}

async function saveContentToDrive(content, fileName, statusElement) {
    if (gapi.client.getToken() === null) {
        statusElement.textContent = 'Please connect to Google Drive first.';
        return;
    }

    statusElement.textContent = 'Saving to Google Drive...';
    const folderId = await getDriveFolderId();
    if (!folderId) {
        statusElement.textContent = 'Could not find or create the app folder in Drive.';
        return;
    }

    try {
        const searchResponse = await gapi.client.drive.files.list({
            q: `name='${fileName.replace(/'/g, "\\'")}' and '${folderId}' in parents and trashed=false`,
            fields: 'files(id)',
            spaces: 'drive'
        });
        const boundary = '-------314159265358979323846';
        const delimiter = "\r\n--" + boundary + "\r\n";
        const close_delim = "\r\n--" + boundary + "--";
        const contentType = 'text/markdown';
        const metadata = { name: fileName };
        if (!searchResponse.result.files || searchResponse.result.files.length === 0) {
             metadata.parents = [folderId];
        }
        
        const multipartRequestBody =
            delimiter + `Content-Type: application/json; charset=UTF-8\r\n\r\n` + JSON.stringify(metadata) +
            delimiter + `Content-Type: ${contentType}\r\n\r\n` + content +
            close_delim;
        const fileExists = searchResponse.result.files && searchResponse.result.files.length > 0;
        const fileId = fileExists ? searchResponse.result.files[0].id : null;
        await gapi.client.request({
            path: `/upload/drive/v3/files${fileExists ? '/' + fileId : ''}`,
            method: fileExists ? 'PATCH' : 'POST',
            params: { uploadType: 'multipart' },
            headers: {'Content-Type': `multipart/related; boundary="${boundary}"`},
            body: multipartRequestBody
        });
        statusElement.textContent = `File '${fileName}' ${fileExists ? 'updated' : 'saved'} in Drive!`;
        setTimeout(() => {
            if (statusElement) statusElement.textContent = '';
        }, 4000);
    } catch (error) {
        console.error('Error saving file to Drive:', error);
        statusElement.textContent = 'Error saving file. Check console.';
    }
}


function createPicker(mode, startInFolderId = null) { 
    if (!gisInited || !gapiInited) {
         console.error("Google services not ready for picker.");
         (document.getElementById('drive-status') || document.getElementById('modal-status-message')).textContent = 'Google API not ready.';
         return;
     }
    
     const token = gapi.client.getToken()?.access_token;
     if (!token) {
         (document.getElementById('drive-status') || document.getElementById('modal-status-message')).textContent = 'You are not signed in.';
         return;
     }
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
            setTimeout(() => updateSigninStatus(true), 3000);
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
        <h2 class="text-2xl font-bold mb-2 themed-text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 inline-block mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
           
            Imported: ${fileName}
        </h2>
        <div class="prose max-w-none mt-4"></div>
    `;
    const renderTarget = cardContent.querySelector('.prose');
    renderAccordionFromMarkdown(markdownContent, renderTarget, false);

    card.appendChild(cardContent);
    container.prepend(card);

    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// --- Core Application Functions ---

async function loadAppContent() {
    try {
        await Promise.allSettled([loadAITailoringOptions(), loadDynamicPlaceholders()]);
    } catch (error) {
        console.error("An error occurred while loading app content:", error.message);
        throw error;
    }
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
    card.innerHTML = `<div class="p-8 card-content"><h2 class="text-2xl font-bold mb-2 themed-text-primary">${finalCategory.title}</h2><p class="mb-6 themed-text-muted">${finalCategory.description}</p><div id="${selectorId}" data-category-id="${finalCategory.id}" class="w-full">${getLoaderHTML(`AI is generating topics for ${finalCategory.title}...`)}</div><div id="details-${finalCategory.id}" class="details-container mt-4"></div></div>`;
    const container = document.getElementById('dynamic-card-container');
    container.prepend(card);
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    listenForUserAddedTopics(finalCategory.id);
    try {
        const prompt = finalCategory.initialPrompt ||
`Generate 8 common topics for ${finalCategory.title}.`;
        const jsonText = await callGeminiAPI(prompt, true, "Initial Category Population");
        if (!jsonText) throw new Error(`API returned empty content for ${finalCategory.title}.`);
        
        const data = parseJsonWithCorrections(jsonText);
        if (!Array.isArray(data)) {
            console.error("API response for category topics is not an array:", data);
            throw new Error("Invalid API response format: Expected an array of topics for the category.");
        }
        
        data.sort((a, b) => a.title.localeCompare(b.title));
        allThemeData[finalCategory.id] = data;
        
        populateCardGridSelector(card.querySelector(`#${selectorId}`), finalCategory.id);
        return card;

    } catch (error) {
        handleApiError(error, card.querySelector(`#${selectorId}`), finalCategory.title, card);
        throw error;
    }
}

function populateCardGridSelector(container, categoryId, newItemsIds = new Set()) {
    const data = allThemeData[categoryId] || [];
    const stickies = stickyTopics[categoryId] || [];
    const userAdded = userAddedTopics[categoryId] || [];
    
    if (!container) return;
    if (data.length === 0 && stickies.length === 0 && userAdded.length === 0) {
         container.innerHTML = `<p class="themed-text-muted">No items to display.</p>`;
         return;
    }

    const gridClass = 'card-grid-container';
    const card = container.closest('.card');
    const cardTitle = card.querySelector('h2').textContent;

    const stickyTitles = new Set(stickies.map(s => s.title));
    const userAddedTitles = new Set(userAdded.map(u => u.title));

    const stickyHtml = stickies.map(item => `
        <div id="grid-selector-${item.id}" class="grid-card-selector" data-topic-id="${item.id}" data-category-id="${categoryId}" title="${item.title}">
            <div class="indicator sticky-indicator" title="Sticky Topic">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L13 7.414V17a1 1 0 11-2 0V7.414L7.707 10.707a1 1 0 01-1.414-1.414l4-4z" clip-rule="evenodd" /></svg>
            </div>
            <div class="icon">${getIconForTheme(categoryId, item.id)}</div>
            <div class="mt-2 overflow-hidden"><div class="text-sm font-normal leading-tight block">${truncateText(item.title, 50)}</div></div>
        
        </div>`
    ).join('');
    const userAddedHtml = userAdded.map(item => `
        <div id="grid-selector-${item.id}" class="grid-card-selector" data-topic-id="${item.id}" data-category-id="${categoryId}" title="${item.title}">
            <div class="indicator" style="background-color: #f59e0b;" title="Your Added Topic">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4"><path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.41-1.412A6.962 6.962 0 0010 11.5c-2.25 0-4.33.9-5.535 2.993z"></path></svg>
            </div>
            <div class="icon">${getIconForTheme(categoryId, item.id)}</div>
            <div class="mt-2 overflow-hidden"><div class="text-sm font-normal leading-tight block">${truncateText(item.title, 50)}</div></div>
  
              </div>`
    ).join('');
    const regularItemsHtml = data
        .filter(item => !stickyTitles.has(item.title) && !userAddedTitles.has(item.title))
        .map(item => {
            const compositeKey = `${cardTitle} - ${item.title}`;
            const isViewed = viewedItemIds.has(compositeKey);
    
            const isNew = newItemsIds.has(item.id);
            
            const viewedIndicatorHtml = isViewed ? `<div class="indicator viewed-indicator" title="Viewed"><svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg></div>` : '';
 
            const newClass = isNew ? 'new-item-highlight' : '';
            
            return `
            <div id="grid-selector-${item.id}" class="grid-card-selector ${newClass}" data-topic-id="${item.id}" data-category-id="${categoryId}" title="${item.description || item.title}">
                ${viewedIndicatorHtml}
                <div class="icon">${getIconForTheme(categoryId, item.id)}</div>
                <div class="mt-2 overflow-hidden"><div class="text-sm font-normal leading-tight block">${truncateText(item.title, 50)}</div></div>
                   
 </div>`;
    }).join('');
    
    const topicInputId = `add-topic-input-${categoryId}`;
    const containerId = container.id;
    const addNewTopicHtml = `
        <div class="add-topic-container">
             
       <input type="text" id="${topicInputId}" name="${topicInputId}" placeholder="Add your own topic..." class="themed-input w-full p-2 rounded-lg text-sm">
            <button class="btn-secondary add-topic-button !px-4 !py-2" data-container-id="${containerId}" data-category-id="${categoryId}">Add Topic</button>
        </div>
    `;
    
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

    if (!newTitle) { inputField.focus(); return;
    }
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

async function handleGenerateMoreClick(button) {
    const { containerId, categoryId } = button.dataset;
    const container = document.getElementById(containerId);
    if (!container || !categoryId || !allThemeData[categoryId]) return;

    button.disabled = true;
    button.innerHTML = `<span class="flex items-center justify-center gap-2"><div class="loader themed-loader" style="width:20px; height:20px; border-width: 2px;"></div>Generating...</span>`;

    const card = container.closest('.card');
    const fullHierarchyPath = JSON.parse(card.dataset.fullHierarchyPath);
    const categoryTitle = fullHierarchyPath[fullHierarchyPath.length - 1].title;
    const existingTitles = allThemeData[categoryId].map(item => item.title);
    const prompt = `Generate 8 new and unique administrative task ideas for the IT category "${categoryTitle}". These tasks must be different from the ones in the following list.
Existing Task List:\n- ${existingTitles.join('\n- ')}\n
            For each new task, provide a unique "id", a "title", and a short "description".
            Return the response as a valid JSON array.`;

    try {
        const jsonText = await callGeminiAPI(prompt, true, "Generate More Topics");
        if (!jsonText) throw new Error("AI did not return any new items.");

        const newItems = parseJsonWithCorrections(jsonText);
        const newItemIds = new Set(newItems.map(item => item.id));
        
        newItems.forEach(newItem => {
            if (!allThemeData[categoryId].some(existing => existing.id === newItem.id || existing.title === newItem.title)) {
                allThemeData[categoryId].push(newItem);
            }
        });
        allThemeData[categoryId].sort((a, b) => a.title.localeCompare(b.title));
        populateCardGridSelector(container, categoryId, newItemIds);
        document.getElementById(`details-${categoryId}`).innerHTML = '';
    } catch (error) {
        console.error(`Error generating more items for ${categoryId}:`, error);
        const originalButtonHTML = button.innerHTML;
        button.disabled = false;
        button.innerHTML = 'Error. Try Again.';
        button.classList.add('bg-red-100', 'text-red-700');
        setTimeout(() => {
            button.classList.remove('bg-red-100', 'text-red-700');
            button.innerHTML = originalButtonHTML.replace('Generating...','Add 8 more topics');
        }, 3000);
    } 
}

async function handleGridSelect(target) {
    const { topicId, categoryId } = target.dataset;
    let item = allThemeData[categoryId]?.find(d => String(d.id) === String(topicId)) ||
        stickyTopics[categoryId]?.find(d => String(d.id) === String(topicId)) ||
               userAddedTopics[categoryId]?.find(d => String(d.id) === String(topicId));
    if (!item) {
        console.error("Could not find theme item for:", {topicId, categoryId});
        return;
    }
    
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

    const prompt = `
        You are creating a summary for an IT administration guide.
        The overall category is: "${cardTitle}"
        The category description is: "${item.description || 'General task'}"
        The specific topic is: "${item.title}"
        Based on this context, generate a very brief, condensed summary for the guide on "${item.title}".
        For each section (Objective, Pre-requisites, Key Steps, Verification, Helpful Resources), provide a single descriptive sentence.
        Return the response as a simple markdown string where each section is a bullet point, starting with '*'.
    `;
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
    const promptInput = document.getElementById('gemini-prompt');
    const userPrompt = promptInput.value.trim();
    if (!userPrompt) return;

    const titleEl = document.getElementById('inDepthModalTitle');
    const contentEl = document.getElementById('inDepthModalContent');
    const footerEl = document.getElementById('inDepthModalFooter');
    const buttonContainer = document.getElementById('inDepthModalButtons');

    const fullTitle = `Custom Guide: ${userPrompt}`;
    titleEl.textContent = truncateText(fullTitle, 40);
    contentEl.innerHTML = getLoaderHTML(`Generating initial sections for your custom guide for "${userPrompt}"...`);
    buttonContainer.innerHTML = '';
    document.getElementById('modal-status-message').textContent = '';
    
    footerEl.dataset.fullTitle = fullTitle;
    footerEl.dataset.cardName = "Custom Task"; 
    
    openModal('inDepthModal');
    
    const selectedOptions = Array.from(document.querySelectorAll('#tailoring-buttons-container .btn-toggle.active'))
                                .map(btn => btn.textContent.trim())
                                .join(', ');
    const initialCustomPrompt = `
Persona: You are an expert senior IT administrator and technical writer AI.
Objective: Your task is to generate ONLY the "Introduction", "Architectural Overview", "Key Concepts & Terminology", and "Prerequisites" sections for a comprehensive IT administration guide.
This output will serve as the foundational "blueprint" for a more detailed guide later.
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
2.  **Define Scope Clearly:** Within the "Introduction" section, you MUST clearly state the scope.
For example, explicitly mention if the guide will cover GUI, PowerShell, and/or API methods.
This is critical as it will dictate the content of the full guide.
3.  **Professional & Accurate:** The content must be technically accurate, detailed, and written in a professional tone suitable for experienced IT administrators.
4.  **Markdown Format:** Use '###' for section headers.

Return only the markdown for these four sections.
Do not include any other content or explanatory text.`;

    try {
        let initialResultText = await callGeminiAPI(initialCustomPrompt, false, "Generate Custom Guide (Initial)");
        initialResultText = initialResultText ? initialResultText.replace(/^```(markdown)?\n?/g, '').replace(/\n?```$/g, '').trim() : '';
        
        originalGeneratedText.set(fullTitle, initialResultText);
        
        contentEl.innerHTML = '';
        renderAccordionFromMarkdown(initialResultText, contentEl, false);
        const dummyHierarchy = [{title: "Custom Topic", description: `A guide for ${userPrompt}`}];
        footerEl.dataset.fullHierarchyPath = JSON.stringify(dummyHierarchy);

        addModalActionButtons(buttonContainer, true);
    } catch(error) {
        handleApiError(error, contentEl, 'custom IT guide (initial sections)');
    } finally {
        promptInput.value = '';
    }
}

function parseJsonWithCorrections(jsonString) {
    if (!jsonString || typeof jsonString !== 'string') {
        throw new Error("Invalid input: not a string.");
    }
    let cleanedString = jsonString.replace(/```(json|markdown)?\n?/g, '').replace(/```/g, '').trim();
    try {
        return JSON.parse(cleanedString);
    } catch (error) {
        console.warn("Initial JSON.parse failed. Attempting correction for common errors.", error);
        try {
            const correctedJsonString = cleanedString
                .replace(/\\'/g, "'") 
                .replace(/([{\s,])(\w+)(:)/g, '$1"$2"$3');
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
    aiLog.push({
        timestamp: new Date(),
        type: type,
        prompt: prompt,
        response: response
    });
}

async function callApi(apiUrl, payload, authorization = null) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    const headers = { 'Content-Type': 'application/json' };
    if (authorization) {
        headers['Authorization'] = authorization;
    }

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            let errorBody;
            try { errorBody = await response.json(); } catch { errorBody = await response.text();
            }
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
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`;
    const payload = { contents: [{ parts: [{ text: prompt }] }] };
    if (isJson) {
        payload.generationConfig = { responseMimeType: "application/json", maxOutputTokens: 8192 };
    }
    const result = await callApi(apiUrl, payload);
    const responseText = result?.candidates?.[0]?.content?.parts?.[0]?.text || null;
    logAiInteraction(prompt, responseText, logType);
    return responseText;
}

async function callImageGenAPI(prompt) {
    const token = gapi.client.getToken();
    if (!token) {
        throw new Error("Please connect your Google Account to generate images.");
    }
    if (!firebaseConfig || !firebaseConfig.projectId) {
        throw new Error("Firebase project ID is not configured. Cannot make image generation request.");
    }

    const apiUrl = `https://us-central1-aiplatform.googleapis.com/v1/projects/${firebaseConfig.projectId}/locations/us-central1/publishers/google/models/imagegeneration@0.0.5:predict`;
    const payload = { instances: [{ prompt: prompt }], parameters: { "sampleCount": 1 } };
    const authHeader = `Bearer ${token.access_token}`;
    const result = await callApi(apiUrl, payload, authHeader);
    const base64 = result?.predictions?.[0]?.bytesBase64Encoded;
    return base64 ? `data:image/png;base64,${base64}` : null;
}

async function callColorGenAPI(prompt) {
    const fullPrompt = `Based on the theme "${prompt}", generate a color palette.
I need a JSON object with keys: "bg", "text", "primary", "primaryDark", "accent", "cardBg", "cardBorder", "textMuted", "inputBg", "inputBorder", "buttonText".
Determine if the "primary" color is light or dark to set the "buttonText" appropriately (#FFFFFF for dark, #111827 for light).
${jsonInstruction}`;
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
    const imagePrompt = `Artistic, abstract background image inspired by "${themePrompt}".
Suitable for an IT administration website. Professional, clean. Wide aspect ratio, photographic, cinematic lighting.`;
    try {
        const colors = await callColorGenAPI(themePrompt);
        applyTheme(colors);

        if (gapi.client.getToken()) {
            const imageUrl = await callImageGenAPI(imagePrompt);
            applyHeaderImage(imageUrl);
        } else {
            console.warn("Skipping default header image generation: Google user not signed in.");
        }

    } catch (error) {
        handleApiError(null, null, 'default theme');
        console.error("Failed to generate default theme, continuing with default styles.", error);
    } finally {
        showThemeLoading(false);
    }
}

async function loadAITailoringOptions() {
    const container = document.getElementById('tailoring-buttons-container');
    container.innerHTML = getLoaderHTML('Loading AI options...');
    try {
        const prompt = `Generate a comprehensive list of 16 diverse keywords and concepts for tailoring IT administration guides.
The list should cover a wide range of topics including security, performance, automation, specific technologies (like PowerShell, Ansible), methodologies (like IaC), and user levels (like 'for beginners', 'for experts').
Return ONLY a valid JSON array of strings. IMPORTANT: Ensure any double quotes inside the strings are properly escaped.`;
        const jsonText = await callGeminiAPI(prompt, true, "Load Tailoring Options");
        if (!jsonText) {
            throw new Error("AI did not return any tailoring options.");
        }
        const options = parseJsonWithCorrections(jsonText);
        populateTailoringButtons(options);
    } catch (error) {
        handleApiError(error, container, 'tailoring options');
        const fallbackOptions = ["Security Hardening", "Performance Tuning", "Automation Script", "For Beginners"];
        populateTailoringButtons(fallbackOptions);
    }
}


function populateTailoringButtons(options) {
    const container = document.getElementById('tailoring-buttons-container');
    container.innerHTML = options.map(option =>
        `<button type="button" class="btn-toggle text-sm px-3 py-1 rounded-full">${option}</button>`
    ).join('');
}

async function loadDynamicPlaceholders() {
    const promptInput = document.getElementById('gemini-prompt');
    const prompt = `Generate a JSON array of 3 creative IT administration task ideas for input placeholders.
Examples: "Onboard a new employee", "Decommission a legacy server". Return ONLY the valid JSON array of strings, ensuring any double quotes inside the strings are properly escaped (e.g., \\"like this\\").`;
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
    const bgImageDiv = document.getElementById('header-bg-image');
    bgImageDiv.style.backgroundImage = `url('${imageUrl}')`;
}

function showThemeLoading(isLoading) {
    const loader = document.getElementById('header-loader');
    loader.classList.toggle('hidden', !isLoading);
    loader.classList.toggle('flex', isLoading);
}

function getAppPrompts() {
    const prompts = {};
    prompts["Full Guide Generation Prompt"] = getFullGuideGenerationPrompt();
    prompts["Refinement Prompt"] = getRefinementPrompt();
    prompts["Final Review Prompt"] = finalReviewPrompt;
    return prompts;
}

function displayPromptsInModal() {
    const contentEl = document.getElementById('promptsModalContent');
    contentEl.innerHTML = '';

    const prompts = getAppPrompts();

    for (const [title, promptText] of Object.entries(prompts)) {
        const promptContainer = document.createElement('div');
        promptContainer.className = 'mb-6';
        
        const promptTitle = document.createElement('h3');
        promptTitle.className = 'text-lg font-semibold themed-text-accent mb-2';
        promptTitle.textContent = title;
        promptContainer.appendChild(promptTitle);
        const codeBlockContainer = document.createElement('div');
        codeBlockContainer.className = 'code-block-container !mt-0';
        
        const header = document.createElement('div');
        header.className = 'code-block-header';
        header.innerHTML = `<span>Prompt</span><button class="copy-code-button">Copy</button>`;
        codeBlockContainer.appendChild(header);
        const pre = document.createElement('pre');
        pre.className = 'text-sm';
        pre.style.color = 'var(--code-text)';
        pre.textContent = promptText;
        codeBlockContainer.appendChild(pre);
        
        promptContainer.appendChild(codeBlockContainer);
        contentEl.appendChild(promptContainer);
    }

    openModal('promptsModal');
}

function getRefinementPrompt(originalText = '{original_text}', refinementRequest = '{refinement_request}') {
    return `Persona: You are a Master Technical Editor and Content Strategist AI.
You specialize in interpreting revision requests and surgically modifying existing technical content to meet new requirements while upholding the highest standards of quality.
Core Mandate: Your task is to analyze the ORIGINAL TEXT and the USER'S REVISION DIRECTIVE provided below.
You must then rewrite the original text to flawlessly execute the user's directive, producing a new, complete, and professionally polished version of the text.
//-- INPUT 1: ORIGINAL TEXT --//
${originalText}

//-- INPUT 2: USER'S REVISION DIRECTIVE --//
${refinementRequest}

//-- GUIDING PRINCIPLES FOR REVISION --//
- **Interpret Intent:** Understand the objective behind the directive.
If the user asks to "make it simpler," you must simplify terminology, rephrase complex sentences, and perhaps add analogies.
- **Seamless Integration:** The new content must flow naturally. The final output should feel like a single, cohesive piece.
- **Maintain Structural Integrity:** Preserve the original markdown formatting unless the directive requires a structural change.
- **Uphold Technical Accuracy:** Ensure any changes or additions are technically accurate and align with modern best practices.
Final Output Instruction
Return ONLY the new, complete, and rewritten markdown text.
Do not provide a preamble, an explanation of your changes, or any text other than the final, revised content itself.`;
}

// ** ENHANCED PROMPT FUNCTION **
function getFullGuideGenerationPrompt(context = {}) {
    const hierarchy = context.hierarchyContext || [];
    const task = context.task || '{task}';
    const options = context.options || '{options}';
    const topicTechnology = hierarchy.map(h => h.title).join(' - ') || 'General IT';
    const specificGoal = `A complete reference guide to designing, implementing, and troubleshooting for the task: ${task}.`;
    const targetAudience = `An IT administrator with 3-5 years of experience who understands basic concepts related to ${hierarchy[0]?.title || 'the topic'}.`;
    const inScope = `Management via GUI, CLI (PowerShell/bash), and APIs where applicable for the task: ${task}. ${options}`;
    const outOfScope = `Basic setup of the core technology (e.g., installing Windows Server). Licensing or cost analysis.`;
    return `Persona: You are an elite-level AI, functioning as a Senior IT Administrator and a Principal Technical Writer.
Mission: Produce a definitive, practical, and deeply conceptual reference guide based on the blueprint provided below.
Your output must be exhaustive, clear, and focused entirely on the defined scope.
The goal is for a technical professional to transition from having a basic awareness of a topic to possessing a deep and applicable understanding of its core concepts and management.
//-- GUIDE BLUEPRINT & SCOPE --//
1. Topic Technology: ${topicTechnology}
2. Specific Goal: ${specificGoal}
3. Target Audience: ${targetAudience}
4. IN-SCOPE (Must be included):
${inScope}
5. OUT-OF-SCOPE (Must be excluded):
${outOfScope}

//-- CRITICAL STRUCTURE & FORMATTING RULES --//
A. Markdown Formatting: You MUST format each of the 12 main sections below with a ### header.
Example: ### 1. Introduction.

B. Required Guide Content (Generate all 12 sections):
1. Introduction: Overview, Importance, What You'll Learn.
2. Architectural Overview: Components and interactions.
3. Key Concepts & Terminology: Definitions only.
4. Prerequisites: Permissions, Software/Licensing, System Requirements.
5. Key Concepts - In-Depth Application & Management: CRITICAL SECTION.
For each concept from Section 3, provide detailed mini-guides for GUI, PowerShell/CLI, and API/SDK management.
**Crucially, for each technique, you MUST provide at least one clear, practical example of what a user would actually type or do.
Use markdown blockquotes to showcase these example prompts or code snippets so the user can copy them directly.**
6. Verification and Validation: Specific commands/procedures to confirm correct configuration.
7. Best Practices: Expert advice for implementation and management.
8. Automation Techniques for Key Concepts: Concept-specific automation opportunities with full scripts.
9. Security Considerations: Concept-specific hardening, vulnerabilities, and auditing.
10. Advanced Use Cases & Scenarios: 2-3 advanced examples combining concepts.
11. Troubleshooting: A table of common problems, causes, and solutions by concept.
12. Helpful Resources: Bulleted list of high-quality, working links to official documentation.
//-- MANDATORY QUALITY STANDARDS --//
1.  **Factual Accuracy:** All technical content, especially code snippets, API endpoints, and procedural steps, MUST be factually correct and based on current, official documentation.
2.  **No Placeholders:** Your output MUST NOT contain placeholder links, hypothetical API endpoints (e.g., "api.gemini.example.com"), or notes to the user like "(Replace with actual link)".
You must use your capabilities to find and provide real, authoritative information.
3.  **PowerShell/CLI Standards:** Scripts must be robust and production-ready.
This includes using modern cmdlets, server-side filtering (e.g., \`-Filter\`), and comprehensive \`try/catch\` error handling with \`-ErrorAction Stop\`.
4.  **Professional Tone:** The guide must be written in a clean, professional voice.
Do not include your own meta-commentary or asides (e.g., "Pro Tip:", "Note:", "This is a hypothetical example").
Instead, integrate advice naturally into the text.`;
}

async function handleExploreInDepth(topicId, fullHierarchyPath) {
    const categoryId = fullHierarchyPath[fullHierarchyPath.length - 1].id;
    const item = allThemeData[categoryId]?.find(d => String(d.id) === String(topicId)) ||
               stickyTopics[categoryId]?.find(d => String(d.id) === String(topicId)) ||
               userAddedTopics[categoryId]?.find(d => String(d.id) === String(topicId));
    if (!item) {
        console.error("Could not find item for in-depth view", { topicId, categoryId });
        return;
    }

    const titleEl = document.getElementById('inDepthModalTitle');
    const contentEl = document.getElementById('inDepthModalContent');
    const footerEl = document.getElementById('inDepthModalFooter');
    const buttonContainer = document.getElementById('inDepthModalButtons');

    const fullTitle = `In-Depth: ${item.title}`;
    titleEl.textContent = fullTitle;
    contentEl.innerHTML = getLoaderHTML(`Generating foundational guide for ${item.title}...`);
    buttonContainer.innerHTML = '';
    document.getElementById('modal-status-message').textContent = '';

    footerEl.dataset.topicId = topicId;
    footerEl.dataset.fullHierarchyPath = JSON.stringify(fullHierarchyPath);
    footerEl.dataset.fullTitle = fullTitle;
    footerEl.dataset.cardName = fullHierarchyPath.map(p => p.title).join(' / ');

    openModal('inDepthModal');
    
    const contextString = fullHierarchyPath.map(p => p.title).join(' -> ');
    const initialPrompt = `
Persona: You are an expert senior IT administrator and technical writer AI.
Objective: Your task is to generate ONLY the "Introduction", "Architectural Overview", "Key Concepts & Terminology", and "Prerequisites" sections for a comprehensive IT administration guide.
This output will serve as the foundational "blueprint" for a more detailed guide later.
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
2.  **Define Scope Clearly:** Within the "Introduction" section, you MUST clearly state the scope.
For example, explicitly mention if the guide will cover GUI, PowerShell, and/or API methods.
This is critical as it will dictate the content of the full guide.
3.  **Professional & Accurate:** The content must be technically accurate, detailed, and written in a professional tone suitable for experienced IT administrators.
4.  **Markdown Format:** Use '###' for section headers.

Return only the markdown for these four sections.
Do not include any other content or explanatory text.`;

    try {
        let initialResultText = await callGeminiAPI(initialPrompt, false, "Explore In-Depth (Initial)");
        initialResultText = initialResultText ? initialResultText.replace(/^```(markdown)?\n?/g, '').replace(/\n?```$/g, '').trim() : '';

        originalGeneratedText.set(fullTitle, initialResultText);

        contentEl.innerHTML = '';
        renderAccordionFromMarkdown(initialResultText, contentEl, false);

        addModalActionButtons(buttonContainer, true);
    } catch (error) {
        handleApiError(error, contentEl, 'initial in-depth content');
    }
}

// ** REFACTORED FUNCTION FOR EFFICIENCY **
async function generateFullDetailedGuide(button) {
    const firstModalFooter = document.getElementById('inDepthModalFooter');
    const fullTitleFromFirstModal = firstModalFooter.dataset.fullTitle;
    const fullHierarchyPath = JSON.parse(firstModalFooter.dataset.fullHierarchyPath);
    const blueprintMarkdown = originalGeneratedText.get(fullTitleFromFirstModal);
    if (!blueprintMarkdown) {
        handleApiError({ message: "Could not find the initial guide blueprint to proceed." }, document.getElementById('inDepthDetailedModalContent'), 'full detailed guide');
        return;
    }
    
    button.disabled = true;
    button.innerHTML = `<span class="flex items-center justify-center gap-2"><div class="loader themed-loader" style="width:20px; height:20px; border-width: 2px;"></div>Opening...</span>`;

    const detailedTitleEl = document.getElementById('inDepthDetailedModalTitle');
    const detailedContentEl = document.getElementById('inDepthDetailedModalContent');
    const detailedFooterEl = document.getElementById('inDepthDetailedModalFooter');
    const detailedButtonContainer = document.getElementById('inDepthDetailedModalButtons');
    const detailedModalTitle = `Complete Guide: ${fullTitleFromFirstModal.replace(/In-Depth: |Custom Guide: /g, '')}`;
    detailedTitleEl.textContent = detailedModalTitle;
    detailedButtonContainer.innerHTML = '';
    
    detailedFooterEl.dataset.fullTitle = detailedModalTitle;
    detailedFooterEl.dataset.cardName = fullHierarchyPath.map(p => p.title).join(' / ');
    
    openModal('inDepthDetailedModal');

    try {
        detailedContentEl.innerHTML = getLoaderHTML('Generating detailed sections (5-12)...');
// New prompt to generate only the remaining sections
        const remainingSectionsPrompt = `
Persona: You are an elite-level AI, functioning as a Senior IT Administrator and a Principal Technical Writer.
Mission: Based on the provided GUIDE BLUEPRINT, generate the remaining detailed sections (5 through 12) for the guide.
//-- GUIDE BLUEPRINT (SECTIONS 1-4 for Context) --//
${blueprintMarkdown}

//-- INSTRUCTIONS --//
1.  **Generate Sections 5-12 ONLY:** Your output must start with "### 5. Key Concepts - In-Depth Application & Management" and end with "### 12. Helpful Resources".
2.  **Adhere to Blueprint:** All content you generate must strictly adhere to the scope and details defined in the provided blueprint.
3.  **Provide Concrete Examples:** For section 5, for each technique discussed (e.g., Few-Shot Learning), you MUST provide at least one clear, practical example of what a user would actually type or do.
Use markdown blockquotes to showcase these example prompts.
4.  **Uphold Quality Standards:** Ensure all information is factually accurate, contains no placeholders, and is written in a professional tone.
Your response must be ONLY the markdown for sections 5 through 12.`;
        let draftSections5to12 = await callGeminiAPI(remainingSectionsPrompt, false, "Generate Full Guide (Sections 5-12 Draft)");
        draftSections5to12 = draftSections5to12 ?
draftSections5to12.replace(/^```(markdown)?\n?/g, '').replace(/\n?```$/g, '').trim() : '';
        if (!draftSections5to12) throw new Error("Failed to generate the detailed sections of the guide.");
        detailedContentEl.innerHTML = getLoaderHTML('AI is now reviewing and refining the new sections...');
// Use the final review prompt on the new sections
        let reviewRequestPrompt = finalReviewPrompt
            .replace('{blueprint_from_step_1}', blueprintMarkdown)
            .replace('{draft_content_to_review}', draftSections5to12);
        let finalSections5to12 = await callGeminiAPI(reviewRequestPrompt, false, "Refine Full Guide (Sections 5-12 Final)");
        finalSections5to12 = finalSections5to12 ?
finalSections5to12.replace(/^```(markdown)?\n?/g, '').replace(/\n?```$/g, '').trim() : '';
        if (!finalSections5to12) throw new Error("Failed to generate the final, refined guide sections.");
// Concatenate the final guide
        const finalCompleteGuideMarkdown = blueprintMarkdown + "\n\n" + finalSections5to12;
        originalGeneratedText.set(detailedModalTitle, finalCompleteGuideMarkdown);

        detailedContentEl.innerHTML = '';
        renderAccordionFromMarkdown(finalCompleteGuideMarkdown, detailedContentEl, false);

        addDetailedModalActionButtons(detailedButtonContainer);
        document.getElementById('detailed-modal-status-message').textContent = 'Full guide generated & refined successfully!';
    } catch (error) {
        handleApiError(error, detailedContentEl, 'full detailed guide');
    } finally {
         button.disabled = false;
         button.innerHTML = `Generate Full Detailed Guide`;
    }
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if(modal) {
        modal.classList.remove('hidden');
        document.body.classList.add('modal-open', `${modalId}-open`);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if(modal) {
        modal.classList.add('hidden');
        document.body.classList.remove(`${modalId}-open`);
        if (document.querySelectorAll('.modal:not(.hidden)').length === 0) {
             document.body.classList.remove('modal-open');
        }
    }
}

function addModalActionButtons(buttonContainer, isInitialPhase = false) {
    buttonContainer.innerHTML = '';
    const saveDriveBtnHtml = gapi.client.getToken() !== null ?
        `<button id="save-to-drive-btn" class="btn-secondary">Save to Google Drive</button>` : '';
    if (isInitialPhase) {
        buttonContainer.innerHTML = `
            <button class="btn-secondary text-sm modal-refine-button">Refine with AI</button>
            <button class="btn-secondary text-sm copy-button">Copy Text</button>
            <button id="generate-detailed-steps-btn" class="btn-primary text-sm px-4 py-2" title="Generate a full, detailed guide 
in a new modal">Generate Full Detailed Guide</button>
            ${saveDriveBtnHtml}
        `;
    } else {
        buttonContainer.innerHTML = `
            <button class="btn-secondary text-sm modal-refine-button">Refine with AI</button>
            <button class="btn-secondary text-sm copy-button">Copy Text</button>
            ${saveDriveBtnHtml}
           
     `;
    }

    const copyButton = buttonContainer.querySelector('.copy-button');
    if (copyButton) {
        copyButton.addEventListener('click', e => {
            const contentToCopy = e.target.closest('.card').querySelector('[id$="ModalContent"]');
            copyElementTextToClipboard(contentToCopy, e.target);
        });
    }
}

function addDetailedModalActionButtons(buttonContainer) {
    const saveDriveBtnHtml = gapi.client.getToken() !== null ?
`<button id="save-to-drive-btn" class="btn-secondary">Save to Google Drive</button>` : '';
    
    buttonContainer.innerHTML = `
        <button class="btn-secondary text-sm modal-refine-button">Refine with AI</button>
        <button class="btn-secondary text-sm copy-button">Copy Text</button>
        ${saveDriveBtnHtml}
    `;
    const copyButton = buttonContainer.querySelector('.copy-button');
    if (copyButton) {
        copyButton.addEventListener('click', e => {
            const contentToCopy = e.target.closest('.card').querySelector('[id$="ModalContent"]');
            copyElementTextToClipboard(contentToCopy, e.target);
        });
    }
}

function addSearchModalActionButtons(buttonContainer) {
     const saveDriveBtnHtml = gapi.client.getToken() !== null ?
`<button id="save-to-drive-btn" class="btn-secondary">Save to Google Drive</button>` : '';
     buttonContainer.innerHTML = `
        <button class="btn-secondary text-sm modal-refine-button">Refine with AI</button>
        <button class="btn-secondary text-sm copy-button">Copy Text</button>
        ${saveDriveBtnHtml}
    `;
    const copyButton = buttonContainer.querySelector('.copy-button');
    if (copyButton) {
        copyButton.addEventListener('click', e => {
            const contentToCopy = document.getElementById('searchGeminiResult');
            copyElementTextToClipboard(contentToCopy, e.target);
        });
    }
}

function handleTextSelection(e) {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    const searchButton = document.getElementById('search-gemini-button');

    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        searchButton.classList.add('hidden');
        return;
    }
    
    const isInsideModal = e.target.closest('#inDepthModalContent, #inDepthDetailedModalContent, #promptsModalContent');
    if (selectedText && isInsideModal) {
        searchButton.classList.remove('hidden');
    } else {
         searchButton.classList.add('hidden');
    }
}

async function handleSearchGemini() {
    const searchButton = document.getElementById('search-gemini-button');
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    if (!selectedText) return;

    searchButton.classList.add('hidden');

    const searchTextEl = document.getElementById('searchGeminiQueryText');
    const resultEl = document.getElementById('searchGeminiResult');
    searchTextEl.value = selectedText;
    resultEl.innerHTML = getLoaderHTML(`Searching Gemini for an explanation of "${selectedText}"...`);
    
    addSearchModalActionButtons(document.getElementById('searchGeminiModalButtons'));
    
    openModal('searchGeminiModal');
    const prompt = `In the context of IT administration, please explain the following term or concept clearly and concisely: "${selectedText}".
Provide a simple definition and a practical example of how it's used. Format the response as a simple markdown string.`;
    try {
        let resultText = await callGeminiAPI(prompt, false, "Text Selection Search");
        resultText = resultText ? resultText.replace(/```(markdown)?\n?/g, '').replace(/\n?```$/g, '').trim() : '';
        
        originalGeneratedText.set("currentSearch", resultText);
        
        resultEl.innerHTML = marked.parse(resultText || 'No explanation found.');
    } catch (error) {
        handleApiError(error, resultEl, 'Gemini search');
    }
}


function convertMarkdownToHtml(text, generateImages = true) {
    if (!text) return '<p class="themed-text-muted">No content received from AI. Please try a different prompt.</p>';

    let processedText;
    if (generateImages) {
        processedText = text.replace(/\[Screenshot: (.*?)\]/g, (match, description) => {
            const placeholderId = `image-placeholder-${Date.now()}-${Math.random()}`;
            return `<div id="${placeholderId}" class="image-generation-container" data-prompt="${description.replace(/"/g, '&quot;')}">
                    
            <div class="loader themed-loader"></div>
                        <p class="mt-2 text-sm italic">${description}</p>
                    </div>`;
        });
       
     } else {
        processedText = text.replace(/\[Screenshot: (.*?)\]/g, '');
    }


    let html = marked.parse(processedText);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    tempDiv.querySelectorAll('pre').forEach(preBlock => {
   
        if (preBlock.parentElement.classList.contains('code-block-container')) return;

        const codeBlock = preBlock.querySelector('code');
        const lang = codeBlock ? (Array.from(codeBlock.classList).find(c => c.startsWith('language-'))?.replace('language-', '') || 'text') : 'text';
        
        const container = document.createElement('div');
        container.className = 'code-block-container';
        const header = document.createElement('div');
        header.className = 'code-block-header';
        header.innerHTML = `
            <span>${lang}</span>
            <button class="copy-code-button">Copy</button>
        `;
        container.appendChild(header);
        preBlock.parentNode.insertBefore(container, preBlock);
        container.appendChild(preBlock);
    });

    return tempDiv.innerHTML;
}

async function generateAndInjectImages(container) {
    const placeholders = container.querySelectorAll('.image-generation-container');
    if (placeholders.length === 0) return;
    
    if (!gapi.client.getToken()) {
        placeholders.forEach(placeholder => {
            placeholder.innerHTML = `<p class="text-sm themed-text-muted">Connect Google Account to generate images.</p>`;
        });
        return;
    }

    placeholders.forEach(async (placeholder) => {
        const prompt = placeholder.dataset.prompt;
        const imagePrompt = `UI Screenshot for an IT Administration guide showing: ${prompt}. Clean, professional, minimal.`;
        try {
                  
           const imageUrl = await callImageGenAPI(imagePrompt);
            if (imageUrl) {
                placeholder.innerHTML = `<img src="${imageUrl}" alt="${prompt}">`;
            } else {
                      
           throw new Error('API returned no image.');
            }
        } catch (error) {
            console.error(`Failed to generate image for prompt: "${prompt}"`, error);
            placeholder.innerHTML = `<p class="text-red-500 text-sm">Image generation failed.</p><p 
class="text-xs">${prompt}</p>`;
        }
    });
}


function addPostGenerationButtons(container, topicId, categoryId) {
    let buttonBar = container.querySelector('.button-bar');
    if (buttonBar) buttonBar.remove();

    buttonBar = document.createElement('div');
    buttonBar.className = 'button-bar flex flex-wrap gap-2 mt-4 pt-4 border-t';
    buttonBar.style.borderColor = 'var(--color-card-border)';
    const card = container.closest('.card');
    const fullHierarchyPath = JSON.parse(card.dataset.fullHierarchyPath);

    buttonBar.innerHTML = `
        <button class="btn-secondary text-sm refine-button">Refine with AI</button>
        <button class="btn-secondary text-sm copy-button">Copy Text</button>
        <button class="btn-secondary text-sm explore-button" data-topic-id="${topicId}" data-category-id="${categoryId}" data-full-hierarchy-path='${JSON.stringify(fullHierarchyPath).replace(/'/g, "&#39;")}'>Explore In-Depth</button>
    `;
    container.appendChild(buttonBar);
    buttonBar.querySelector('.copy-button').addEventListener('click', e => {
        const contentToCopy = e.target.closest('.details-container, #gemini-result-container');
        if(contentToCopy) copyElementTextToClipboard(contentToCopy, e.target);
    });
    buttonBar.querySelector('.explore-button').addEventListener('click', e => {
        const { topicId, categoryId } = e.currentTarget.dataset;
        handleExploreInDepth(topicId, fullHierarchyPath);
    });
}

async function handleCustomVisualThemeGeneration() {
    const prompt = document.getElementById('theme-prompt').value;
    if(!prompt) return;

    const loader = document.getElementById('theme-loader-container');
    const errorContainer = document.getElementById('theme-error-container');
    const generateBtn = document.getElementById('generate-theme-btn');
    
    loader.classList.remove('hidden');
    errorContainer.classList.add('hidden');
    generateBtn.disabled = true;
    try {
        const imagePrompt = `Artistic, abstract background image inspired by "${prompt}".
Suitable for an IT administration website. Professional, clean. Wide aspect ratio, photographic, cinematic lighting.`;
        
        const promises = [callColorGenAPI(prompt)];
        if (gapi.client.getToken()) {
            promises.push(callImageGenAPI(imagePrompt));
        } else {
            showThemeError("Connect your Google Account to generate a new header image.");
        }

        const [colorResult, imageResult] = await Promise.allSettled(promises);
        if (colorResult.status === 'fulfilled' && colorResult.value) {
            applyTheme(colorResult.value);
        } else {
            throw colorResult.reason ||
                new Error("Failed to generate color theme.");
        }

        if (imageResult && imageResult.status === 'fulfilled' && imageResult.value) {
            applyHeaderImage(imageResult.value);
        } else if (imageResult) {
            showThemeError("Failed to generate header image, but colors were updated.");
        }
        
        closeModal('themeGeneratorModal');
    } catch (error) {
        showThemeError(error.message);
    } finally {
        loader.classList.add('hidden');
        generateBtn.disabled = false;
    }
}

function showThemeError(message) {
    const errorContainer = document.getElementById('theme-error-container');
    errorContainer.textContent = message;
    errorContainer.classList.remove('hidden');
}

function populateTypographySettings() {
    const fontSelect = document.getElementById('font-family-select');
    const sizeSelect = document.getElementById('font-size-select');
    const lineHeightSelect = document.getElementById('line-height-select');
    
    const fonts = { 'Default (Inter)': "'Inter', sans-serif", 'Lato': "'Lato', sans-serif", 'Montserrat': "'Montserrat', sans-serif", 'Nunito Sans': "'Nunito Sans', sans-serif", 'Open Sans': "'Open Sans', sans-serif", 'Poppins': "'Poppins', sans-serif", 'Roboto Slab': "'Roboto Slab', serif" };
    const sizes = { '14': '14px', '15': '15px', '16 (Default)': '16px', '17': '17px', '18': '18px' };
    const lineHeights = { '1.4': '1.4', '1.5 (Default)': '1.5', '1.6': '1.6', '1.7': '1.7', '1.8': '1.8' };

    if (fontSelect) {
        Object.entries(fonts).forEach(([name, value]) => fontSelect.add(new Option(name, value)));
        fontSelect.value = fonts['Default (Inter)'];
        root.style.setProperty('--font-family', fontSelect.value);
    }

    if (sizeSelect) {
        Object.entries(sizes).forEach(([name, value]) => sizeSelect.add(new Option(name, value)));
        sizeSelect.value = '16px';
        root.style.setProperty('--font-size-base', sizeSelect.value);
    }

    if (lineHeightSelect) {
        Object.entries(lineHeights).forEach(([name, value]) => lineHeightSelect.add(new Option(name, value)));
        lineHeightSelect.value = '1.5';
        root.style.setProperty('--line-height-base', lineHeightSelect.value);
    }
}

function copyElementTextToClipboard(element, button) {
    const textToCopy = element.innerText;
    const textarea = document.createElement('textarea');
    textarea.value = textToCopy;
    textarea.style.position = 'fixed'; 
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        setTimeout(() => { button.textContent = originalText; }, 2000);
    } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
    }
    document.body.removeChild(textarea);
}

function renderAccordionFromMarkdown(markdownText, containerElement, generateImages = true) {
    containerElement.innerHTML = '';
    if (!markdownText || !markdownText.trim()) {
        containerElement.innerHTML = convertMarkdownToHtml(null, false);
        return;
    }

    const fullHtml = convertMarkdownToHtml(markdownText, generateImages);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = fullHtml;

    const nodes = Array.from(tempDiv.childNodes);
    let currentAccordionItem = null;
    let introContent = document.createElement('div');
    introContent.className = 'accordion-intro mb-4 prose max-w-none';

    let firstHeaderFound = false;
    nodes.forEach(node => {
        if (!firstHeaderFound && node.tagName !== 'H3') {
            introContent.appendChild(node.cloneNode(true));
            return;
        }
        
    
        if (node.tagName === 'H3') {
            firstHeaderFound = true;
            if (introContent.hasChildNodes()) {
                containerElement.appendChild(introContent);
                
                introContent = document.createElement('div'); 
                introContent.className = 'accordion-intro mb-4 prose max-w-none';
            }

            currentAccordionItem = document.createElement('div');
                  
            currentAccordionItem.className = 'accordion-item';

            const title = node.textContent;
            const contentDiv = document.createElement('div');
            contentDiv.className = 'accordion-content prose max-w-none';

            currentAccordionItem.innerHTML = `
    
            <button type="button" class="accordion-header">
                    <span class="text-left">${title}</span>
                    <svg class="icon w-5 h-5 transition-transform shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
    
            </button>
        `;
            currentAccordionItem.appendChild(contentDiv);
            containerElement.appendChild(currentAccordionItem);
        } else if (currentAccordionItem) {
            const contentDiv = currentAccordionItem.querySelector('.accordion-content');
            contentDiv.appendChild(node.cloneNode(true));
        }
    });
    if (!firstHeaderFound && introContent.hasChildNodes()) {
         containerElement.appendChild(introContent);
         return;
    }


    if (introContent.hasChildNodes()) {
        containerElement.appendChild(introContent);
    }

    const firstItem = containerElement.querySelector('.accordion-item');
    if (firstItem) {
        const header = firstItem.querySelector('.accordion-header');
        header.classList.add('active');
        header.querySelector('.icon').style.transform = 'rotate(180deg)';
        firstItem.querySelector('.accordion-content').classList.add('open');
    }
}

async function handleAIHelpRequest() {
    document.getElementById('inDepthModalTitle').textContent = "Code Documentation Generation";
    const contentEl = document.getElementById('inDepthModalContent');
    contentEl.innerHTML = getLoaderHTML('AI is generating the technical code documentation...');
    
    document.getElementById('inDepthModalButtons').innerHTML = '';
    document.getElementById('modal-status-message').innerHTML = '';
    
    openModal('inDepthModal');
    const codeDocPrompt = `
        **Persona:** You are an expert technical writer and senior software architect.
        **Objective:** Your task is to analyze this application's structure and generate comprehensive code documentation.
        The application is a sophisticated "IT Administration Hub" built with HTML, CSS, and modern JavaScript (ESM), integrating with Firebase and various Google Cloud APIs.
        **Instructions:**
        Based on the application's known features and structure, generate a detailed technical documentation guide.
        The guide must be written in markdown format and use '###' for all main section headers.
        **Required Sections:**

        ### 1. Application Overview
        * Describe the application's primary purpose as an AI-powered tool for IT professionals.
        * Explain its core value proposition: generating dynamic, in-depth administrative guides.
        ### 2. Technologies & Languages
        * List and describe the core technologies used:
            * **Frontend:** HTML5, Tailwind CSS, Vanilla JavaScript (ECMAScript Modules).
            * **Backend & Cloud Services:** Firebase (Authentication, Firestore), Google Cloud Platform.
            * **Core APIs:** Google Gemini API (for content generation), Google Drive API (for storage), Google Identity Services (for auth), and the Google AI Platform API (for image generation).
        ### 3. Architectural Design
        * **Component-Based UI:** Explain how the UI is dynamically built from cards and modals.
        * **State Management:** Describe how the application state is managed, including API keys in localStorage, user session state via Firebase Auth, and in-memory state for generated content.
        * **Event-Driven Logic:** Explain the role of the central 'setupEventListeners' function and how it delegates tasks based on user interactions.
        * **Hierarchical Content Model:** Explain the Firestore data structure ('topicHierarchy' collection) for managing content in a nested Main -> Sub -> Final Category structure.
        ### 4. Core Features Deep Dive
        * For each key feature below, describe its purpose and implementation:
            * **Dynamic Category Generation:** How 'openCategoryBrowser' and 'generateAndPopulateAICategory' work with Firestore to create UI on demand.
            * **Multi-Stage Guide Generation:** Detail the process that starts with a summary ('handleGridSelect'), moves to an initial guide ('handleExploreInDepth'), and finishes with a complete, AI-reviewed document ('generateFullDetailedGuide').
            * **Hierarchy Management:** Describe the purpose and functionality of the 'hierarchyManagementModal' for CRUD operations on the content structure in Firestore.
        ### 5. Key Functions & Logic
        * **\`initializeApplication()\`:** The main entry point.
        * **\`callGeminiAPI()\` / \`callApi()\`:** Centralized functions for all generative AI requests.
        * **\`openHierarchyManagementModal()\` & related functions:** The logic for populating and interacting with the hierarchy management UI.
        * **\`openCategoryBrowser()\`:** The function that initiates the user-facing topic exploration flow.

        Return only the complete markdown documentation.
        `;
    try {
        const documentationResult = await callGeminiAPI(codeDocPrompt, false, "Generate Code Documentation");
        const documentationHtml = documentationResult ? marked.parse(documentationResult.replace(/^```(markdown)?\n?/g, '').replace(/\n?```$/g, '').trim()) : '<p class="themed-text-muted">Could not load documentation.</p>';
        
        contentEl.innerHTML = `<div class="prose max-w-none">${documentationHtml}</div>`;
    } catch (error) {
        handleApiError(error, contentEl, 'code documentation');
    }
}

function toggleRefineUI(buttonContainer, isModal = false, targetModalId = 'inDepthModal') {
    const refineContainerId = `refine-container-${targetModalId}`;
    let refineContainer = document.getElementById(refineContainerId);

    if (refineContainer) {
        refineContainer.remove();
        return;
    }

    refineContainer = document.createElement('div');
    refineContainer.id = refineContainerId;
    refineContainer.className = 'refine-container w-full';
    
    const textareaId = `refine-textarea-${targetModalId}`;
    refineContainer.innerHTML = `<textarea id="${textareaId}" name="${textareaId}" class="w-full p-2 themed-input border rounded-lg" rows="2" placeholder="e.g., 'Make it for a junior admin' or 'Add PowerShell examples'"></textarea><button class="btn-primary text-sm mt-2 submit-refinement-button" data-is-modal="${isModal}" data-target-modal-id="${targetModalId}">Submit Refinement</button>`;
    buttonContainer.insertAdjacentElement('afterend', refineContainer);
    refineContainer.querySelector('textarea').focus();
}

async function handleRefineRequest(refineContainer, targetModalId) {
    const refinementRequest = refineContainer.querySelector('textarea').value;
    if (!refinementRequest) return;

    let contentArea, titleElement, isSearchModal, textKey;
    
    isSearchModal = (targetModalId === 'searchGeminiModal');
    contentArea = document.getElementById(`${targetModalId}Content`);
    if (isSearchModal) {
         textKey = "currentSearch";
    } else {
         titleElement = document.getElementById(`${targetModalId}Title`);
         textKey = titleElement.textContent;
    }
    
    const originalText = originalGeneratedText.get(textKey);
    if (!originalText) {
        handleApiError({message: "Could not find the original text to refine."}, contentArea, "refinement");
        return;
    }
    
    const renderTarget = isSearchModal ?
document.getElementById('searchGeminiResult') : contentArea;
    renderTarget.innerHTML = getLoaderHTML(`Refining content based on your request...`);
    
    const prompt = getRefinementPrompt(originalText, refinementRequest);
    try {
        let newText = await callGeminiAPI(prompt, false, "Refine Content");
        newText = newText ? newText.replace(/^```(markdown)?\n?/g, '').replace(/\n?```$/g, '').trim() : '';
        
        originalGeneratedText.set(textKey, newText);
        if (isSearchModal) {
            const queryTextEl = document.getElementById('searchGeminiQueryText');
            const newQueryText = `${queryTextEl.value} (Refined: ${refinementRequest})`;
            queryTextEl.value = newQueryText;
        }
        
        if (isSearchModal) {
            renderTarget.innerHTML = marked.parse(newText || '');
        } else {
            renderTarget.innerHTML = '';
            renderAccordionFromMarkdown(newText, renderTarget, false);
        }
        
    } catch(error) {
        handleApiError(error, renderTarget, 'refinement');
    }
}

function getIconForTheme(categoryId, topicId) { 
    const icons = {
        serviceNowAdmin: `<svg class="w-8 h-8 mx-auto themed-text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37.996.608 2.296.096 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>`,
        windowsServer: `<svg class="w-8 h-8 mx-auto themed-text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>`,
        m365Admin: `<svg class="w-8 h-8 mx-auto themed-text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path></svg>`,
        default: `<svg class="w-8 h-8 mx-auto themed-text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>`
    }
    const keys = Object.keys(icons);
    const hash = categoryId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return icons[keys[hash % keys.length]] || icons.default;
}

function getLoaderHTML(message) { return `<div class="flex justify-center items-center my-4"><div class="loader themed-loader"></div><p class="ml-4 themed-text-muted">${message}</p></div>`;
}

function sanitizeTitle(title) {
    if (typeof title !== 'string') return '';
    return title.replace(/^["*-\s]+|["*-\s]+$/g, '').trim();
}

function truncateText(text, maxLength = 50) {
    if (typeof text !== 'string' || text.length <= maxLength) { return text;
    }
    return text.substring(0, maxLength) + '...';
}

function generateErrorMessage(error, type = 'general') { 
    console.error(`Error during ${type} generation:`, error);
    const baseErrorMessage = error && error.message ? error.message : "An unknown error occurred";
    let message = `An unknown error occurred.
${baseErrorMessage}`; 
    const errText = baseErrorMessage.toLowerCase(); 
    if (errText.includes('safety') || errText.includes('blocked')) {
        message = `Request blocked for safety reasons.
Please try a different prompt.`;
    } else if (errText.includes('api key not valid')) {
        message = `Authentication failed.
Your API Key is not valid. Please re-enter it.`;
    } else if (errText.includes('429')) {
        message = `Request limit exceeded.
Please try again later.`;
    } else if (errText.includes('timed out')) {
        message = `The request timed out.
Please check your connection and try again.`;
    } else if (errText.includes('google account to generate images')) {
        message = `Image generation requires you to connect your Google Account.
Please use the 'Connect' button in the Cloud Storage card.`
    } else if (errText.includes('data.sort is not a function') || errText.includes('invalid api response format')) {
        message = `The AI returned data in an unexpected format.
This usually means the AI did not return a list of topics as expected.
Please try again, or adjust the prompt in Hierarchy Management.`;
    }
    return `Sorry, a critical error occurred: ${message}`;
}

// --- Sticky Topics & User Topics Functions ---

function listenForUserAddedTopics(categoryKey) {
    if (userTopicsUnsubscribes[categoryKey]) {
        userTopicsUnsubscribes[categoryKey]();
    }
    if (!userId || !categoryKey) {
        if(userAddedTopics[categoryKey]) { userAddedTopics[categoryKey] = [];
        }
        return;
    }

    const appId = firebaseConfig.appId || 'it-admin-hub-global';
    const userTopicsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/userTopics/${categoryKey}/topics`);

    userTopicsUnsubscribes[categoryKey] = onSnapshot(userTopicsCollectionRef, (snapshot) => {
        const topics = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
        userAddedTopics[categoryKey] = topics;

        const gridContainer = document.getElementById(`selector-${categoryKey}`);
        if (gridContainer) {
          
            populateCardGridSelector(gridContainer, categoryKey);
        }
    }, (error) => {
        console.error(`Error listening to user-added topics for ${categoryKey}:`, error);
    });
}

async function openStickyTopicsModal() {
    const select = document.getElementById('sticky-topic-category-select');
    select.innerHTML = '<option value="">Select a category...</option>';
    
    try {
        const finalCategories = [];
        const mainCatsSnapshot = await getDocs(collection(db, getHierarchyBasePath(), 'topicHierarchy'));
        for (const mainDoc of mainCatsSnapshot.docs) {
            const subCatsSnapshot = await getDocs(collection(db, mainDoc.ref.path, 'subCategories'));
            for (const subDoc of subCatsSnapshot.docs) {
                const finalCatsSnapshot = await getDocs(collection(db, subDoc.ref.path, 'finalCategories'));
                finalCatsSnapshot.forEach(finalDoc => {
                    finalCategories.push({ id: finalDoc.id, ...finalDoc.data() });
                });
            }
        }
        
        finalCategories.sort((a, b) => a.title.localeCompare(b.title));
        finalCategories.forEach(cat => {
            select.add(new Option(cat.title, cat.id));
        });
    } catch (error) {
        console.error("Error populating sticky topic categories:", error);
        select.innerHTML = '<option value="">Error loading categories</option>';
    }

    document.getElementById('sticky-topics-list').innerHTML = '';
    document.getElementById('new-sticky-topic-input').value = '';

    openModal('stickyTopicsModal');
}

function listenForStickyTopics(categoryKey) {
    if (stickyTopicsUnsubscribe) {
        stickyTopicsUnsubscribe();
    }
    if (!userId || !categoryKey) {
         if(stickyTopics[categoryKey]) { stickyTopics[categoryKey] = [];
         }
         renderStickyTopics(categoryKey);
         return;
    }
    
    const appId = firebaseConfig.appId || 'it-admin-hub-global';
    const stickyTopicsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/stickyTopics/${categoryKey}/topics`);
    
    stickyTopicsUnsubscribe = onSnapshot(stickyTopicsCollectionRef, (snapshot) => {
        const topics = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        stickyTopics[categoryKey] = topics;
        renderStickyTopics(categoryKey);
        
              
        const gridContainer = document.getElementById(`selector-${categoryKey}`);
        if (gridContainer) {
            populateCardGridSelector(gridContainer, categoryKey);
        }
    }, (error) => {
        console.error(`Error listening to sticky topics for ${categoryKey}:`, error);
  
        });
}

function renderStickyTopics(categoryKey) {
    const listEl = document.getElementById('sticky-topics-list');
    const topics = stickyTopics[categoryKey] || [];
    if(topics.length === 0) {
        listEl.innerHTML = `<p class="text-sm themed-text-muted text-center">No sticky topics for this category yet.</p>`;
        return;
    }
    listEl.innerHTML = topics.map(topic => `
        <div class="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
            <input type="text" value="${topic.title}" class="themed-input w-full p-1 rounded text-sm sticky-topic-title-input" data-doc-id="${topic.id}">
            <button class="p-1 text-green-600 hover:text-green-800 update-sticky-topic-btn" title="Save Changes">&#10004;</button>
      
            <button class="p-1 text-red-600 hover:text-red-800 delete-sticky-topic-btn" title="Delete Topic">&times;</button>
        </div>
    `).join('');
    listEl.querySelectorAll('.update-sticky-topic-btn').forEach(btn => btn.onclick = (e) => handleUpdateStickyTopic(e));
    listEl.querySelectorAll('.delete-sticky-topic-btn').forEach(btn => btn.onclick = (e) => handleDeleteStickyTopic(e));
}

async function handleAddStickyTopic() {
    const categoryKey = document.getElementById('sticky-topic-category-select').value;
    const input = document.getElementById('new-sticky-topic-input');
    const title = input.value.trim();

    if (!categoryKey || !title || !userId) {
        displayMessageInModal('Please select a category and enter a title.', 'warning');
        return;
    }
    const appId = firebaseConfig.appId || 'it-admin-hub-global';
    const stickyTopicsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/stickyTopics/${categoryKey}/topics`);
    
    try {
        await addDoc(stickyTopicsCollectionRef, { 
            title: title, 
            description: `Custom sticky topic: ${title}`,
            createdAt: Timestamp.now() 
       
         });
        input.value = '';
    } catch(error) {
        console.error("Error adding sticky topic:", error);
    }
}

async function handleUpdateStickyTopic(e) {
    const categoryKey = document.getElementById('sticky-topic-category-select').value;
    const input = e.target.previousElementSibling;
    const docId = input.dataset.docId;
    const newTitle = input.value.trim();
    if (!categoryKey || !docId || !newTitle || !userId) return;

    const appId = firebaseConfig.appId || 'it-admin-hub-global';
    const docRef = doc(db, `artifacts/${appId}/users/${userId}/stickyTopics/${categoryKey}/topics`, docId);
    try {
        await updateDoc(docRef, { title: newTitle });
        e.target.textContent = '✓';
        setTimeout(() => e.target.innerHTML = '&#10004;', 2000);
    } catch (error) {
        console.error("Error updating sticky topic:", error);
    }
}

async function handleDeleteStickyTopic(e) {
    const categoryKey = document.getElementById('sticky-topic-category-select').value;
    const docId = e.target.previousElementSibling.previousElementSibling.dataset.docId;

    if (!categoryKey || !docId || !userId) return;
    showConfirmationModal("Are you sure you want to delete this sticky topic?", async () => {
        const appId = firebaseConfig.appId || 'it-admin-hub-global';
        const docRef = doc(db, `artifacts/${appId}/users/${userId}/stickyTopics/${categoryKey}/topics`, docId);
        try {
            await deleteDoc(docRef);
       
        } catch (error) {
            console.error("Error deleting sticky topic:", error);
            displayMessageInModal('Failed to delete topic. Check console.', 'error');
        }
    });
}

// --- MODIFIED: Topic Browser Functions ---
const getHierarchyBasePath = () => `artifacts/${firebaseConfig.appId || 'it-admin-hub-global'}/public/data`;

async function openCategoryBrowser(mode) {
    const modalTitle = document.getElementById('categoryBrowserModalTitle');
    modalTitle.textContent = 'Browse Categories';
    currentHierarchyPath = [];
    updateBreadcrumbs();
    await renderCategoryLevel(collection(db, getHierarchyBasePath(), 'topicHierarchy'));
    openModal('categoryBrowserModal');
}

async function renderCategoryLevel(collectionRef) {
    const modalContent = document.getElementById('categoryBrowserModalContent');
    modalContent.innerHTML = getLoaderHTML('Loading categories...');
    try {
        const snapshot = await getDocs(query(collectionRef));
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), path: doc.ref.path }));
        items.sort((a, b) => a.title.localeCompare(b.title));
        if (items.length === 0) {
            modalContent.innerHTML = `<p class="themed-text-muted text-center">No categories found at this level.</p>`;
            return;
        }

        const categoryGrid = document.createElement('div');
        categoryGrid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';

        categoryGrid.innerHTML = items.map(item => `
            <div class="border rounded-lg p-4 flex flex-col items-start hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 cursor-pointer category-selector-item" data-item='${JSON.stringify(item).replace(/'/g, "&#39;")}'>
                <h3 class="font-semibold text-lg themed-text-accent">${item.title}</h3>
                ${item.description ? `<p class="text-sm themed-text-muted mt-1 flex-grow">${item.description}</p>` : ''}
                <span class="text-sm font-semibold themed-text-primary mt-4 self-end">Select →</span>
            </div>
        `).join('');
        modalContent.innerHTML = '';
        modalContent.appendChild(categoryGrid);
        
        modalContent.querySelectorAll('.category-selector-item').forEach(itemEl => {
            itemEl.addEventListener('click', handleCategoryDrillDown);
        });
    } catch (error) {
        console.error("Error rendering category level:", error);
        modalContent.innerHTML = `<p class="text-red-500 text-center">Error loading categories. Check console for details.</p>`;
    }
}

async function handleCategoryDrillDown(e) {
    const itemData = JSON.parse(e.currentTarget.dataset.item);
    currentHierarchyPath.push(itemData);
    updateBreadcrumbs();

    let nextCollectionName;
    if (currentHierarchyPath.length === 1) nextCollectionName = 'subCategories';
    else if (currentHierarchyPath.length === 2) nextCollectionName = 'finalCategories';
    else {
        // This is a final category selection
        closeModal('categoryBrowserModal');
        await generateAndPopulateAICategory(currentHierarchyPath);
        return;
    }
    
    const currentDocRef = doc(db, itemData.path);
    const nextCollectionRef = collection(currentDocRef, nextCollectionName);
    await renderCategoryLevel(nextCollectionRef);
}

function updateBreadcrumbs() {
    const breadcrumbsContainer = document.getElementById('categoryBrowserBreadcrumbs');
    if (currentHierarchyPath.length === 0) {
        breadcrumbsContainer.innerHTML = `<span class="font-semibold themed-text-primary cursor-pointer" data-index="-1">Top Level</span>`;
    } else {
         breadcrumbsContainer.innerHTML = `<span class="breadcrumb-item cursor-pointer hover:underline" data-index="-1">Top Level</span>` + 
         currentHierarchyPath.map((item, index) => 
            `<span class="mx-2 themed-text-muted">/</span><span class="breadcrumb-item cursor-pointer hover:underline" data-index="${index}">${item.title}</span>`
        ).join('');
    }
    

    breadcrumbsContainer.querySelectorAll('.breadcrumb-item').forEach(crumb => {
        crumb.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index, 10);
            if (index === -1) {
       
                 currentHierarchyPath = [];
                renderCategoryLevel(collection(db, getHierarchyBasePath(), 'topicHierarchy'));
            } else {
                currentHierarchyPath = currentHierarchyPath.slice(0, index + 1);
    
                const parentPath = currentHierarchyPath[currentHierarchyPath.length - 1].path;
                const parentRef = doc(db, parentPath);
                renderCategoryLevel(collection(parentRef, index === 0 ? 'subCategories' : 'finalCategories'));
                
            }
            updateBreadcrumbs();
        });
    });
}


// --- NEW: Hierarchy Management Functions ---
function openHierarchyManagementModal() {
    resetHierarchySelection();
    loadHierarchyColumn('main');
    openModal('hierarchyManagementModal');
}

function resetHierarchySelection() {
    selectedHierarchyItems = { main: null, sub: null, final: null };
    document.getElementById('main-category-list').innerHTML = '';
    document.getElementById('sub-category-list').innerHTML = '';
    document.getElementById('final-category-list').innerHTML = '';
    document.getElementById('new-sub-category-input').disabled = true;
    document.getElementById('add-sub-category-btn').disabled = true;
    document.getElementById('new-final-category-input').disabled = true;
    document.getElementById('add-final-category-btn').disabled = true;
    hideHierarchyForm();
}

async function loadHierarchyColumn(level, parentDocData = null) {
    let collectionRef;
    let listElementId;

    if (level === 'main') {
        collectionRef = collection(db, getHierarchyBasePath(), 'topicHierarchy');
        listElementId = 'main-category-list';
    } else if (level === 'sub' && parentDocData) {
        collectionRef = collection(db, parentDocData.path, 'subCategories');
        listElementId = 'sub-category-list';
    } else if (level === 'final' && parentDocData) {
        collectionRef = collection(db, parentDocData.path, 'finalCategories');
        listElementId = 'final-category-list';
    } else {
        return;
    }

    const listElement = document.getElementById(listElementId);
    listElement.innerHTML = getLoaderHTML('Loading...');
    try {
        const q = query(collectionRef);
        const snapshot = await getDocs(q);
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), path: doc.ref.path }));
        items.sort((a, b) => a.title.localeCompare(b.title));
        
        listElement.innerHTML = items.map(item => `
            <div class="hierarchy-item" data-id="${item.id}" data-level="${level}">
                ${item.title}
            </div>
        `).join('');
        listElement.querySelectorAll('.hierarchy-item').forEach(itemEl => {
            itemEl.addEventListener('click', () => handleHierarchySelection(level, itemEl.dataset.id, items));
        });
    } catch (error) {
        console.error(`Error loading ${level} categories:`, error);
        listElement.innerHTML = `<p class="text-red-500 text-xs">Error loading. Check console for details.</p>`;
    }
}

function handleHierarchySelection(level, id, items) {
    const selectedItem = items.find(item => item.id === id);
    document.querySelectorAll(`[data-level="${level}"]`).forEach(el => el.classList.remove('selected'));
    document.querySelector(`[data-level="${level}"][data-id="${id}"]`).classList.add('selected');

    if (level === 'main') {
        selectedHierarchyItems.main = selectedItem;
        selectedHierarchyItems.sub = null;
        selectedHierarchyItems.final = null;
        document.getElementById('sub-category-list').innerHTML = '';
        document.getElementById('final-category-list').innerHTML = '';
        document.getElementById('new-sub-category-input').disabled = false;
        document.getElementById('add-sub-category-btn').disabled = false;
        document.getElementById('new-final-category-input').disabled = true;
        document.getElementById('add-final-category-btn').disabled = true;
        loadHierarchyColumn('sub', selectedItem);
        showHierarchyForm(selectedItem, 'main');
    } else if (level === 'sub') {
        selectedHierarchyItems.sub = selectedItem;
        selectedHierarchyItems.final = null;
        document.getElementById('final-category-list').innerHTML = '';
        document.getElementById('new-final-category-input').disabled = false;
        document.getElementById('add-final-category-btn').disabled = false;
        loadHierarchyColumn('final', selectedItem);
        showHierarchyForm(selectedItem, 'sub');
    } else if (level === 'final') {
        selectedHierarchyItems.final = selectedItem;
        showHierarchyForm(selectedItem, 'final');
    }
}

async function handleAddHierarchyItem(level) {
    let parentData, collectionName, inputElementId;
    const data = {};

    if (level === 'main') {
        collectionName = 'topicHierarchy';
        inputElementId = 'new-main-category-input';
    } else if (level === 'sub') {
        parentData = selectedHierarchyItems.main;
        if (!parentData) { displayMessageInModal("Please select a Main Category first.", 'warning'); return;
        }
        collectionName = 'subCategories';
        inputElementId = 'new-sub-category-input';
    } else if (level === 'final') {
        parentData = selectedHierarchyItems.sub;
        if (!parentData) { displayMessageInModal("Please select a Sub Category first.", 'warning'); return;
        }
        collectionName = 'finalCategories';
        inputElementId = 'new-final-category-input';
        data.description = "Default description.";
        data.initialPrompt = "Default initial prompt.";
        data.fullPrompt = "Default full prompt.";
    }

    const inputElement = document.getElementById(inputElementId);
    const title = inputElement.value.trim();
    if (!title) return;

    data.title = title;

    try {
        const collectionRef = parentData ?
collection(db, parentData.path, collectionName) : 
            collection(db, getHierarchyBasePath(), collectionName);
        await addDoc(collectionRef, data);
        inputElement.value = '';
        loadHierarchyColumn(level, parentData);
    } catch (error) {
        console.error(`Error adding ${level} item:`, error);
        displayMessageInModal(`Failed to add item. Check console.`, 'error');
    }
}

function showHierarchyForm(item, level) {
    document.getElementById('hierarchy-form-placeholder').classList.add('hidden');
    const form = document.getElementById('hierarchy-edit-form');
    form.classList.remove('hidden');
    form.dataset.itemPath = item.path;
    form.dataset.level = level;

    document.getElementById('edit-title').value = item.title || '';
    const finalFields = ['edit-description-container', 'edit-initial-prompt-container', 'edit-full-prompt-container'];
    if (level === 'final') {
        finalFields.forEach(id => document.getElementById(id).classList.remove('hidden'));
        document.getElementById('edit-description').value = item.description || '';
        document.getElementById('edit-initial-prompt').value = item.initialPrompt || '';
        document.getElementById('edit-full-prompt').value = item.fullPrompt || '';
    } else {
        finalFields.forEach(id => document.getElementById(id).classList.add('hidden'));
    }
}

function hideHierarchyForm() {
    document.getElementById('hierarchy-form-placeholder').classList.remove('hidden');
    document.getElementById('hierarchy-edit-form').classList.add('hidden');
}

async function handleSaveHierarchyItem() {
    const form = document.getElementById('hierarchy-edit-form');
    const itemPath = form.dataset.itemPath;
    const level = form.dataset.level;
    if (!itemPath) return;
    const data = {
        title: document.getElementById('edit-title').value.trim()
    };
    if (level === 'final') {
        data.description = document.getElementById('edit-description').value.trim();
        data.initialPrompt = document.getElementById('edit-initial-prompt').value.trim();
        data.fullPrompt = document.getElementById('edit-full-prompt').value.trim();
    }

    try {
        const docRef = doc(db, itemPath);
        await updateDoc(docRef, data);
        displayMessageInModal('Item updated successfully!', 'success');
        
        let parentData = null;
        if (level === 'sub') parentData = selectedHierarchyItems.main;
        if (level === 'final') parentData = selectedHierarchyItems.sub;

        loadHierarchyColumn(level, parentData);
        hideHierarchyForm();
    } catch (error) {
        console.error("Error saving item:", error);
        displayMessageInModal("Failed to save. Check console.", 'error');
    }
}

async function handleDeleteHierarchyItem() {
    const form = document.getElementById('hierarchy-edit-form');
    const itemPath = form.dataset.itemPath;
    const title = document.getElementById('edit-title').value;
    if (!itemPath) return;
    showConfirmationModal(`Are you sure you want to delete "${title}"? This will also delete all of its children.`, async () => {
        try {
            const docRef = doc(db, itemPath);
            await deleteDoc(docRef);
                   
            displayMessageInModal('Item deleted successfully!', 'success');
            resetHierarchySelection();
            loadHierarchyColumn('main');
        } catch (error) {
            console.error("Error deleting item:", error);
              
            displayMessageInModal("Failed to delete. Check console.", 'error');
        }
    });
}

// --- Custom Modal/Message Box Functions (replacing alert/confirm) ---
function displayMessageInModal(message, type = 'info') {
    const modalId = 'messageModal';
    let modal = document.getElementById(modalId);
    if (!modal) {
        modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4 hidden modal';
        modal.innerHTML = `
            <div class="card p-8 w-full max-w-sm m-4 text-center">
                <h2 id="messageModalTitle" class="text-2xl font-bold mb-4"></h2>
                <p id="messageModalContent" class="mb-6 themed-text-muted"></p>
                 
               <button id="closeMessageModal" class="btn-primary w-full">OK</button>
            </div>
        `;
        document.body.appendChild(modal);
        modal.querySelector('#closeMessageModal').addEventListener('click', () => closeModal(modalId));
    }

    const titleEl = modal.querySelector('#messageModalTitle');
    const contentEl = modal.querySelector('#messageModalContent');
    
    titleEl.textContent = type === 'error' ? 'Error!' : (type === 'warning' ? 'Warning!' : 'Info');
    titleEl.className = `text-2xl font-bold mb-4 ${type === 'error' ? 'text-red-600' : (type === 'warning' ? 'text-yellow-600' : 'themed-text-primary')}`;
    contentEl.textContent = message;

    openModal(modalId);
}

function showConfirmationModal(message, onConfirmCallback) {
    const modalId = 'confirmationModal';
    let modal = document.getElementById(modalId);
    if (!modal) {
        modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4 hidden modal';
        modal.innerHTML = `
            <div class="card p-8 w-full max-w-sm m-4 text-center">
                <h2 class="text-2xl font-bold mb-4 themed-text-primary">Confirm Action</h2>
                <p id="confirmationModalContent" class="mb-6 themed-text-muted"></p>
                
                <div class="flex justify-center gap-4">
                    <button id="confirmYesBtn" class="btn-primary">Yes</button>
                    <button id="confirmNoBtn" class="btn-secondary">No</button>
                </div>
     
               </div>
        `;
        document.body.appendChild(modal);
    }

    const contentEl = modal.querySelector('#confirmationModalContent');
    contentEl.textContent = message;
    const confirmYesBtn = modal.querySelector('#confirmYesBtn');
    const confirmNoBtn = modal.querySelector('#confirmNoBtn');

    // Clear previous listeners to prevent multiple calls
    const newConfirmYesBtn = confirmYesBtn.cloneNode(true);
    confirmYesBtn.parentNode.replaceChild(newConfirmYesBtn, confirmYesBtn);
    const newConfirmNoBtn = confirmNoBtn.cloneNode(true);
    confirmNoBtn.parentNode.replaceChild(newConfirmNoBtn, confirmNoBtn);

    newConfirmYesBtn.addEventListener('click', () => {
        onConfirmCallback();
        closeModal(modalId);
    });
    newConfirmNoBtn.addEventListener('click', () => {
        closeModal(modalId);
    });
    openModal(modalId);
}


// --- AI Log Functions ---
function displayAiLog() {
    const contentEl = document.getElementById('aiLogModalContent');
    contentEl.innerHTML = '';
    
    if (aiLog.length === 0) {
        contentEl.innerHTML = `<p class="themed-text-muted text-center">No AI interactions have been logged yet.</p>`;
        openModal('aiLogModal');
        return;
    }

    const reversedLog = [...aiLog].reverse();
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
                        <pre class="text-sm">${log.response || "No response text received."}</pre>
                    </div>
                </div>
            </div>
        `;
        contentEl.appendChild(logItem);
    });

    openModal('aiLogModal');
}

// --- NEW: Data Management Functions ---
function checkBackupReminder() {
    const lastBackup = localStorage.getItem('lastBackupTimestamp');
    if (!lastBackup) {
        document.getElementById('backup-reminder-banner').classList.remove('hidden');
        return;
    }
    const sevenDaysInMillis = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - parseInt(lastBackup, 10) > sevenDaysInMillis) {
        document.getElementById('backup-reminder-banner').classList.remove('hidden');
    }
}

async function handleExportData() {
    const button = document.getElementById('export-data-button');
    const originalContent = button.innerHTML;
    button.innerHTML = 'Exporting...';
    button.disabled = true;
    try {
        const exportData = {
            topicHierarchy: {},
        };
        async function getCollectionData(collectionPath) {
            const collectionRef = collection(db, ...collectionPath);
            const snapshot = await getDocs(collectionRef);
            if (snapshot.empty) return null;
            
            const docs = {};
            for (const docSnap of snapshot.docs) {
                const docData = docSnap.data();
                docs[docSnap.id] = { data: docData, subcollections: {} };
                
                const subcollectionNames = ['subCategories', 'finalCategories'];
                for (const subName of subcollectionNames) {
                    const subPath = [...collectionPath, docSnap.id, subName];
                    const subDocs = await getCollectionData(subPath);
                    if (subDocs) {
                        docs[docSnap.id].subcollections[subName] = subDocs;
                    }
                }
            }
            return docs;
        }

        exportData.topicHierarchy = await getCollectionData([getHierarchyBasePath(), 'topicHierarchy']);
        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `it-admin-hub-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        localStorage.setItem('lastBackupTimestamp', Date.now().toString());
        document.getElementById('backup-reminder-banner').classList.add('hidden');
        displayMessageInModal('Data exported successfully!', 'success');

    } catch (error) {
        console.error("Error exporting data:", error);
        displayMessageInModal(`Export failed: ${error.message}`, 'error');
    } finally {
        button.innerHTML = originalContent;
        button.disabled = false;
    }
}

function handleImportData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = readerEvent => {
            try {
                const importedData = JSON.parse(readerEvent.target.result);
                if (!importedData.topicHierarchy) {
                    throw new Error("Invalid backup file format. Missing 'topicHierarchy' key.");
                }

                showConfirmationModal("Are you sure you want to import this data? This will PERMANENTLY OVERWRITE the existing topic hierarchy. This action cannot be undone.", async () => {
                    const button = document.getElementById('import-data-button');
                    
                    const originalContent = button.innerHTML;
                    button.innerHTML = 'Importing...';
                    button.disabled = true;

                    try {
                        async function setCollectionData(collectionPath, collectionData) {
                            for (const docId in collectionData) {
                       
                                const docInfo = collectionData[docId];
                                const docRef = doc(db, ...collectionPath, docId);
                                   
                                await setDoc(docRef, docInfo.data);

                                for (const subName in docInfo.subcollections) {
                                    const subPath = [...collectionPath, docId, subName];
                                    await setCollectionData(subPath, docInfo.subcollections[subName]);
                                }
                            }
                        }

                           
                        await setCollectionData([getHierarchyBasePath(), 'topicHierarchy'], importedData.topicHierarchy);
                        displayMessageInModal('Data imported successfully! The application will now reload.', 'success');
                        setTimeout(() => location.reload(), 3000);

                    } catch (importError) {
                        console.error("Error during import:", importError);
                        displayMessageInModal(`Import failed: ${importError.message}`, 'error');
                    } finally {
                         button.innerHTML = originalContent;
                         button.disabled = false;
                    }
                });
            } catch (parseError) {
                console.error("Error parsing import file:", parseError);
                displayMessageInModal(`Could not read file. Is it a valid JSON backup?`, 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}
