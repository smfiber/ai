// main.js
import { appState, loadConfigFromStorage, APP_VERSION, STORAGE_KEYS } from './config.js';
import { 
    callGeminiAPI, searchGoogleForTopic, parseJsonWithCorrections 
} from './api.js';
import { 
    handleFirebaseLogin, handleFirebaseLogout, initializeGoogleApiClients, 
    handleDriveAuthClick, saveContentToDrive, createPicker 
} from './auth.js';
import { 
    initializeFirebase, saveArticleToKB, markItemAsViewed, 
    listenForStickyTopics, listenForUserAddedTopics, addStickyTopic, 
    addUserTopic, updateStickyTopic, deleteStickyTopic, 
    getHierarchyData, addHierarchyItem, updateHierarchyItem, deleteHierarchyItem,
    loadKbItem, getKnowledgeBaseContent,
    exportUserData, importUserData 
} from './firestore.js';
import { 
    initializeUI, openModal, closeModal, displayMessageInModal, 
    generateAndApplyDefaultTheme, getLoaderHTML, renderAccordionFromMarkdown, 
    populateCardGridSelector, createBreadcrumbsHtml, truncateText, 
    displayImportedGuide, applyTheme
} from './ui.js';
import { 
    getPsychologyArticlePrompt, getRefinementPrompt, getExplanatoryArticlePrompt
} from './prompts.js';

// --- Initialization ---

document.addEventListener('DOMContentLoaded', () => {
    initializeUI();
    setupEventListeners();

    // Version Check: Force Modal if version mismatch
    const storedVersion = localStorage.getItem(STORAGE_KEYS.APP_VERSION);
    const configLoaded = loadConfigFromStorage();

    if (configLoaded && storedVersion === APP_VERSION) {
        // Config exists and version matches -> Start App
        initializeFirebase();
        initializeGoogleApiClients();
    } else {
        // Config missing OR Old Version -> Open Setup Modal & Show Logout UI
        setupAuthUI(null); // [CHANGED] Ensure header buttons render so user can access settings
        openModal('apiKeyModal');
    }
});

export async function initializeAppContent() {
    if (appState.appIsInitialized) return;
    appState.appIsInitialized = true;

    openModal('loadingStateModal');
    document.getElementById('loading-message').textContent = "Initializing Research Assistant...";
    
    // Check for backup reminder logic
    const lastBackup = localStorage.getItem(STORAGE_KEYS.LAST_BACKUP);
    if (lastBackup && (Date.now() - parseInt(lastBackup) > 604800000)) { // 7 days
        document.getElementById('backup-reminder-banner').classList.remove('hidden');
    }

    try {
        await generateAndApplyDefaultTheme(); // Now applies hardcoded green theme
        document.getElementById('loading-message').textContent = "Loading content...";
        await loadDynamicPlaceholders();
    } catch (error) {
        console.error("Init Error:", error);
    } finally {
        closeModal('loadingStateModal');
    }
}

export function setupAuthUI(user) {
    const authStatusEl = document.getElementById('auth-status');
    const appContainer = document.getElementById('app-container');
    if (!authStatusEl) return;

    if (user) {
        if (appContainer) appContainer.classList.remove('hidden');
        closeModal('apiKeyModal');
        
        // Render User Profile & Logout Button
        authStatusEl.innerHTML = `
            <div class="bg-white/20 backdrop-blur-sm rounded-full p-1 flex items-center gap-2 text-white text-sm">
                <img src="${user.photoURL || 'https://via.placeholder.com/32'}" alt="User" class="w-8 h-8 rounded-full">
                <span class="font-medium pr-2">${user.displayName || 'Researcher'}</span>
                <button id="logout-button" class="bg-white/20 hover:bg-white/40 text-white font-semibold py-1 px-3 rounded-full flex items-center justify-center gap-2" title="Sign Out">
                    <span>Logout</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                </button>
            </div>
        `;
        document.getElementById('logout-button').addEventListener('click', handleFirebaseLogout);
    } else {
         if (appContainer) appContainer.classList.add('hidden');
         
         // Render Login Button + Settings Button (For accessing API keys when logged out)
         authStatusEl.innerHTML = `
             <div class="flex gap-2">
                 <button id="auth-settings-btn" class="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-2 rounded-full" title="API Settings">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                 </button>
                 <button id="login-button" class="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white font-semibold py-2 px-4 rounded-full flex items-center justify-center gap-2" title="Sign In with Google">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48" fill="none"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path><path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path><path fill="#4CAF50" d="M24 44c5.166 0 9.599-1.521 12.643-4.001L30.27 34.138C28.714 36.548 26.521 38 24 38c-5.223 0-9.657-3.341-11.303-7.918l-6.573 4.818C9.656 39.663 16.318 44 24 44z"></path><path fill="#1976D2" d="M43.611 20.083H24v8h11.303c-.792 2.237-2.231 4.16-4.082 5.571l5.657 5.657C41.389 36.197 44 30.669 44 24c0-1.341-.138-2.65-.389-3.917z"></path></svg>
                     <span>Login with Google</span>
                </button>
            </div>
        `;
        document.getElementById('login-button').addEventListener('click', handleFirebaseLogin);
        document.getElementById('auth-settings-btn').addEventListener('click', () => openModal('apiKeyModal'));
        
        // Ensure modal is open if no keys exist (Fallback)
        if (!localStorage.getItem(STORAGE_KEYS.GEMINI_KEY)) {
             openModal('apiKeyModal');
        }
    }
}

async function handleApiKeySubmit(e) {
    e.preventDefault();
    const geminiKey = document.getElementById('geminiApiKeyInput').value.trim();
    const firebaseConfigText = document.getElementById('firebaseConfigInput').value.trim();
    
    const googleClientId = document.getElementById('googleClientIdInput').value.trim();
    const googleSearchId = document.getElementById('googleSearchEngineIdInput').value.trim();
    const algoliaAppId = document.getElementById('algoliaAppIdInput').value.trim();
    const algoliaKey = document.getElementById('algoliaSearchKeyInput').value.trim();

    if (!geminiKey || !firebaseConfigText) {
        document.getElementById('api-key-error').textContent = "Gemini Key and Firebase Config are required.";
        return;
    }

    try {
        const match = firebaseConfigText.match(/\{[\s\S]*\}/);
        if (!match) throw new Error("Invalid Config Object. Paste the full object starting with { and ending with }.");
        const config = new Function(`return ${match[0]}`)();
        
        if (!config.apiKey || !config.projectId) throw new Error("Invalid Firebase Config properties.");

        localStorage.setItem(STORAGE_KEYS.GEMINI_KEY, geminiKey);
        localStorage.setItem(STORAGE_KEYS.FB_CONFIG, JSON.stringify(config));
        localStorage.setItem(STORAGE_KEYS.APP_VERSION, APP_VERSION);

        if(googleClientId) localStorage.setItem(STORAGE_KEYS.GOOGLE_CLIENT_ID, googleClientId);
        if(googleSearchId) localStorage.setItem(STORAGE_KEYS.GOOGLE_SEARCH_ID, googleSearchId);
        if(algoliaAppId) localStorage.setItem(STORAGE_KEYS.ALGOLIA_APP_ID, algoliaAppId);
        if(algoliaKey) localStorage.setItem(STORAGE_KEYS.ALGOLIA_KEY, algoliaKey);

        if (loadConfigFromStorage()) {
            initializeFirebase();
            initializeGoogleApiClients();
            handleFirebaseLogin(); 
            closeModal('apiKeyModal');
        }
    } catch (err) {
        document.getElementById('api-key-error').textContent = `Config Error: ${err.message}`;
    }
}

async function loadDynamicPlaceholders() {
    const promptInput = document.getElementById('core-task-input');
    const prompt = `Generate a JSON array of 3 intriguing psychology research topics for input placeholders. Examples: "Impact of Social Media on Teen Anxiety", "Neuroplasticity in Adult Learners". Return ONLY the JSON array of strings.`;
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
            }, 4000);
        }
    } catch(e) { console.warn("Placeholder gen failed", e); }
}

async function handleGeminiSubmit(e) {
    e.preventDefault();
    const taskInput = document.getElementById('core-task-input').value.trim();
    if (!taskInput) {
        displayMessageInModal("Please define a research topic first.", 'warning');
        return;
    }

    const persona = document.querySelector('#persona-selector .active')?.dataset.value || "Clinical Psychologist";
    const tone = document.querySelector('#tone-selector .active')?.dataset.value || "Academic";
    const outputFormat = document.querySelector('input[name="output-format"]:checked').value;
    const extraContext = document.getElementById('additional-context-input').value.trim();

    if (outputFormat === 'guide') {
        generateCustomArticle(taskInput, persona, tone, extraContext);
    } else {
        generateAndPopulateTopicCard(taskInput, persona, tone, extraContext);
    }
    
    e.target.reset();
}

async function generateCustomArticle(topic, persona, tone, extraContext) {
    const fullTitle = `Custom Article: ${topic}`;
    const titleEl = document.getElementById('inDepthModalTitle');
    const contentEl = document.getElementById('inDepthModalContent');
    const footerEl = document.getElementById('inDepthModalFooter');
    const buttonContainer = document.getElementById('inDepthModalButtons');

    titleEl.textContent = truncateText(fullTitle, 40);
    contentEl.innerHTML = getLoaderHTML(`Drafting article blueprint for "${topic}"...`);
    buttonContainer.innerHTML = '';
    document.getElementById('modal-status-message').textContent = '';
    
    footerEl.dataset.fullTitle = fullTitle;
    footerEl.dataset.cardName = "Custom Research";
    
    openModal('inDepthModal');

    const context = {
        topic: topic,
        persona: persona,
        tone: tone,
        additionalContext: extraContext,
        fullHierarchyPath: [] 
    };

    try {
        const prompt = getPsychologyArticlePrompt('blueprint', context);
        let resultMarkdown = await callGeminiAPI(prompt, false, "Generate Blueprint");
        
        resultMarkdown = cleanMarkdown(resultMarkdown);
        appState.originalGeneratedText.set(fullTitle, resultMarkdown);
        
        contentEl.innerHTML = '';
        renderAccordionFromMarkdown(resultMarkdown, contentEl);
        
        footerEl.dataset.fullHierarchyPath = JSON.stringify([]); 
        
        addModalActionButtons(buttonContainer, true, true);
    } catch (error) {
        contentEl.innerHTML = `<p class="text-red-500">Error: ${error.message}</p>`;
    }
}

async function generateFullDetailedArticle(button) {
    const footerEl = document.getElementById('inDepthModalFooter');
    const fullTitle = footerEl.dataset.fullTitle;
    const blueprintMarkdown = appState.originalGeneratedText.get(fullTitle);
    
    if (!blueprintMarkdown) {
        displayMessageInModal("Error: Blueprint not found.", "error");
        return;
    }

    button.disabled = true;
    button.innerHTML = `<span class="flex items-center gap-2"><div class="loader themed-loader w-4 h-4"></div> Generating...</span>`;

    const detailTitleEl = document.getElementById('inDepthDetailedModalTitle');
    const detailContentEl = document.getElementById('inDepthDetailedModalContent');
    const detailFooterEl = document.getElementById('inDepthDetailedModalFooter');
    const detailBtnContainer = document.getElementById('inDepthDetailedModalButtons');

    const coreTopic = fullTitle.replace("Custom Article: ", "").replace("In-Depth: ", "").trim();
    const finalTitle = `Full Article: ${coreTopic}`;

    detailTitleEl.textContent = finalTitle;
    detailContentEl.innerHTML = getLoaderHTML("Researching and writing sections 5-10...");
    detailFooterEl.dataset.fullTitle = finalTitle;
    detailFooterEl.dataset.fullHierarchyPath = footerEl.dataset.fullHierarchyPath;
    
    openModal('inDepthDetailedModal');

    try {
        const researchLinks = await searchGoogleForTopic(`${coreTopic} psychology research`);
        
        const hierarchyPath = JSON.parse(footerEl.dataset.fullHierarchyPath || "[]");
        const context = {
            topic: coreTopic,
            blueprintMarkdown: blueprintMarkdown,
            fullHierarchyPath: hierarchyPath,
            researchLinks: researchLinks
        };
        
        const prompt = getPsychologyArticlePrompt('fullArticle', context);
        let fullContentMarkdown = await callGeminiAPI(prompt, false, "Generate Full Article");
        fullContentMarkdown = cleanMarkdown(fullContentMarkdown);

        const finalMergedMarkdown = `${blueprintMarkdown}\n\n${fullContentMarkdown}`;
        appState.originalGeneratedText.set(finalTitle, finalMergedMarkdown);

        detailContentEl.innerHTML = '';
        renderAccordionFromMarkdown(finalMergedMarkdown, detailContentEl);
        
        addDetailedModalActionButtons(detailBtnContainer, true);
        document.getElementById('detailed-modal-status-message').textContent = 'Article completed.';
    } catch (error) {
        detailContentEl.innerHTML = `<p class="text-red-500">Error: ${error.message}</p>`;
    } finally {
        button.disabled = false;
        button.innerHTML = "Generate Full Article";
    }
}

async function generateAndPopulateTopicCard(topic, persona, tone, extraContext) {
    const cardId = `category-card-${topic.replace(/\s+/g, '-')}-${Date.now()}`;
    const container = document.getElementById('dynamic-card-container');
    
    const card = document.createElement('div');
    card.className = 'card';
    card.id = cardId;
    card.dataset.fullHierarchyPath = JSON.stringify([{ title: topic }]);
    
    const selectorId = `selector-${cardId}`;
    card.innerHTML = `
        <div class="p-8 card-content">
            <h2 class="text-2xl font-bold mb-2 themed-text-primary">${topic}</h2>
            <div id="${selectorId}" class="w-full">${getLoaderHTML(`Identifying sub-fields...`)}</div>
            <div id="details-${cardId}" class="details-container mt-4"></div>
        </div>`;
    
    container.prepend(card);
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const prompt = `
        Persona: Expert ${persona}.
        Task: Generate 8 specific sub-fields or research areas related to "${topic}".
        Audience: ${tone}.
        Format: JSON array of objects { "title": "string", "description": "string", "id": "string" }.
    `;

    try {
        const jsonText = await callGeminiAPI(prompt, true, "Generate Topic Card");
        const data = parseJsonWithCorrections(jsonText);
        appState.allThemeData[cardId] = data;
        
        const selectorContainer = card.querySelector(`#${selectorId}`);
        populateCardGridSelector(selectorContainer, cardId); 
    } catch (error) {
        card.querySelector(`#${selectorId}`).innerHTML = `<p class="text-red-500">Generation failed.</p>`;
    }
}

async function handleGridSelect(target) {
    const { topicId, categoryId } = target.dataset;
    
    let item = appState.allThemeData[categoryId]?.find(d => String(d.id) === String(topicId)) 
        || appState.stickyTopics[categoryId]?.find(d => String(d.id) === String(topicId))
        || appState.userAddedTopics[categoryId]?.find(d => String(d.id) === String(topicId));
    
    if (!item) return;

    const gridContainer = target.closest('.card-grid-container');
    gridContainer.querySelectorAll('.grid-card-selector').forEach(el => el.classList.remove('active'));
    target.classList.add('active');

    const card = target.closest('.card');
    const cardTitle = card.querySelector('h2').textContent;
    markItemAsViewed(cardTitle, item.title);

    const resultContainer = document.getElementById(`details-${categoryId}`);
    resultContainer.innerHTML = getLoaderHTML(`Generating abstract for ${item.title}...`);

    const prompt = `
        Topic: "${item.title}" (Context: ${cardTitle}).
        Task: Write a concise 3-sentence abstract summarizing this psychological concept.
        Return raw markdown.
    `;

    try {
        let summary = await callGeminiAPI(prompt, false, "Generate Summary");
        summary = cleanMarkdown(summary);
        
        resultContainer.innerHTML = `<div class="prose max-w-none">${marked.parse(summary)}</div>`;
        
        addPostGenerationButtons(resultContainer, topicId, categoryId);
    } catch (error) {
        resultContainer.innerHTML = `<p class="text-red-500">Error.</p>`;
    }
}

async function handleExploreInDepth(topicId, fullHierarchyPath) {
    const categoryId = fullHierarchyPath[fullHierarchyPath.length - 1].id || fullHierarchyPath[0].id;
    const item = appState.allThemeData[categoryId]?.find(d => String(d.id) === String(topicId));
    if(item) {
        generateCustomArticle(item.title, "Academic Researcher", "Professional", `Context: ${fullHierarchyPath.map(p=>p.title).join(' > ')}`);
    }
}

// --- Data Export / Import Handlers ---

async function handleExportData() {
    try {
        const btn = document.getElementById('export-data-button');
        const originalText = btn.textContent;
        btn.textContent = "Exporting...";
        btn.disabled = true;

        const data = await exportUserData();
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `psych-research-backup-${new Date().toISOString().slice(0,10)}.json`);
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();

        // Update Backup Timestamp to silence reminder
        const now = Date.now().toString();
        localStorage.setItem(STORAGE_KEYS.LAST_BACKUP, now);
        document.getElementById('backup-reminder-banner').classList.add('hidden');
        
        displayMessageInModal("Data exported successfully.", "success");
    } catch (error) {
        console.error("Export failed:", error);
        displayMessageInModal(`Export failed: ${error.message}`, "error");
    } finally {
        const btn = document.getElementById('export-data-button');
        btn.textContent = "Export Data";
        btn.disabled = false;
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
        reader.onload = async (event) => {
            try {
                const json = JSON.parse(event.target.result);
                const count = await importUserData(json);
                displayMessageInModal(`Successfully imported ${count} items. Refresh to see changes.`, "success");
            } catch (error) {
                console.error("Import failed:", error);
                displayMessageInModal(`Import failed: ${error.message}`, "error");
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
}

function setupEventListeners() {
    document.getElementById('apiKeyForm')?.addEventListener('submit', handleApiKeySubmit);
    document.getElementById('auth-button')?.addEventListener('click', () => {
        if (appState.oauthToken) handleDriveAuthClick(); 
        else handleFirebaseLogin();
    });
    document.getElementById('load-from-drive-btn')?.addEventListener('click', () => createPicker('open'));

    document.getElementById('gemini-form')?.addEventListener('submit', handleGeminiSubmit);
    // [CHANGED] Removed Theme Button Listeners

    // Data Management Listeners
    document.getElementById('export-data-button')?.addEventListener('click', handleExportData);
    document.getElementById('import-data-button')?.addEventListener('click', handleImportData);

    document.addEventListener('click', (e) => {
        const target = e.target;
        
        if (target.closest('.grid-card-selector')) {
            handleGridSelect(target.closest('.grid-card-selector'));
        }
        
        if (target.closest('.copy-button')) {
            const content = target.closest('.card').querySelector('[id$="Content"]')?.innerText;
            if(content) navigator.clipboard.writeText(content);
        }
        
        if (target.closest('#generate-detailed-steps-btn')) {
            generateFullDetailedArticle(target.closest('#generate-detailed-steps-btn'));
        }
        
        if (target.closest('#add-to-kb-btn')) {
            const footer = document.getElementById('inDepthDetailedModalFooter');
            saveArticleToKB(footer.dataset.fullTitle, appState.originalGeneratedText.get(footer.dataset.fullTitle), JSON.parse(footer.dataset.fullHierarchyPath || "[]"));
            displayMessageInModal("Saved to Knowledge Base", "success");
        }

        if (target.id.startsWith('close') && target.closest('.modal')) {
            closeModal(target.closest('.modal').id);
        }
    });
}

function cleanMarkdown(text) {
    if (!text) return "";
    return text.replace(/^```(markdown)?\n?/g, '').replace(/\n?```$/g, '').trim();
}

function addModalActionButtons(container, isInitial, hasAuth) {
    let html = `<button class="btn-secondary text-sm copy-button">Copy Text</button>`;
    if (isInitial) {
        html += `<button id="generate-detailed-steps-btn" class="btn-primary text-sm px-4 py-2">Generate Full Article (Sections 5-10)</button>`;
    } else {
        html += `<button id="add-to-kb-btn" class="btn-primary text-sm">Add to KB</button>`;
        if(hasAuth) html += `<button id="save-to-drive-btn" class="btn-secondary text-sm">Save to Drive</button>`;
    }
    container.innerHTML = html;
}

function addDetailedModalActionButtons(container, hasAuth) {
    addModalActionButtons(container, false, hasAuth);
}

function addPostGenerationButtons(container, topicId, categoryId) {
    let btnBar = document.createElement('div');
    btnBar.className = "flex gap-2 mt-4 pt-4 border-t";
    
    const btn = document.createElement('button');
    btn.className = "btn-primary text-sm w-full";
    btn.textContent = "Explore In-Depth";
    btn.onclick = () => {
        const card = document.getElementById(`selector-${categoryId}`)?.closest('.card');
        const path = JSON.parse(card?.dataset.fullHierarchyPath || "[]");
        handleExploreInDepth(topicId, path);
    };
    
    btnBar.appendChild(btn);
    container.appendChild(btnBar);
}
