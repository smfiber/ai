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
    exportUserData, importUserData 
} from './firestore.js';
import { 
    initializeUI, openModal, closeModal, displayMessageInModal, 
    generateAndApplyDefaultTheme, getLoaderHTML, 
    renderAccordionFromMarkdown, 
    populateCardGridSelector, truncateText, 
    displayImportedGuide, applyTheme
} from './ui.js';
import { 
    getPsychologyArticlePrompt
} from './prompts.js';

// --- Initialization ---

document.addEventListener('DOMContentLoaded', () => {
    initializeUI();
    setupEventListeners();

    // 1. Security Wipe
    localStorage.removeItem('psych_geminiApiKey'); 
    localStorage.removeItem('psych_firebaseConfig'); 

    // 2. Apply Visual Theme
    generateAndApplyDefaultTheme();

    // 3. Force "Fresh Start" UI
    const appContainer = document.getElementById('app-container');
    if (appContainer) appContainer.classList.add('hidden');

    setupAuthUI(null); 
    openModal('apiKeyModal');
});

export async function initializeAppContent() {
    if (appState.appIsInitialized) return;
    appState.appIsInitialized = true;

    openModal('loadingStateModal');
    document.getElementById('loading-message').textContent = "Initializing Research Assistant...";
    
    const lastBackup = localStorage.getItem(STORAGE_KEYS.LAST_BACKUP);
    if (lastBackup && (Date.now() - parseInt(lastBackup) > 604800000)) { 
        document.getElementById('backup-reminder-banner').classList.remove('hidden');
    }

    try {
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
        
        authStatusEl.innerHTML = `
            <div class="bg-white/10 backdrop-blur-sm rounded-full p-1 flex items-center gap-3 text-white text-sm border border-white/20 shadow-inner">
                <img src="${user.photoURL || 'https://via.placeholder.com/32'}" alt="User" class="w-8 h-8 rounded-full border border-white/50">
                <span class="font-medium pr-2 text-green-50">${user.displayName || 'Researcher'}</span>
                <button id="logout-button" class="bg-red-500/20 hover:bg-red-500/40 text-red-100 font-semibold py-1 px-3 rounded-full flex items-center justify-center gap-2 transition-colors" title="Sign Out">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                </button>
            </div>
        `;
        document.getElementById('logout-button').addEventListener('click', handleFirebaseLogout);
    } else {
         if (appContainer) appContainer.classList.add('hidden');
         
         authStatusEl.innerHTML = `
             <div class="flex gap-2">
                 <button id="auth-settings-btn" class="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white p-2 rounded-full transition-all" title="API Settings">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                 </button>
                 <button id="login-button" class="bg-green-600 hover:bg-green-500 text-white font-semibold py-2 px-4 rounded-full flex items-center justify-center gap-2 shadow-lg transition-all transform hover:-translate-y-0.5" title="Sign In with Google">
                    <span>Login</span>
                </button>
            </div>
        `;
        document.getElementById('login-button').addEventListener('click', handleFirebaseLogin);
        document.getElementById('auth-settings-btn').addEventListener('click', () => openModal('apiKeyModal'));
    }
}

async function handleApiKeySubmit(e) {
    e.preventDefault();
    const geminiKey = document.getElementById('geminiApiKeyInput').value.trim();
    const firebaseConfigText = document.getElementById('firebaseConfigInput').value.trim();
    
    // Optional Keys
    const googleClientId = document.getElementById('googleClientIdInput').value.trim();

    if (!geminiKey || !firebaseConfigText) {
        document.getElementById('api-key-error').textContent = "Gemini Key and Firebase Config are required.";
        document.getElementById('api-key-error').classList.remove('hidden'); 
        return;
    }

    try {
        const match = firebaseConfigText.match(/\{[\s\S]*\}/);
        if (!match) throw new Error("Invalid Config Object. Paste the full object starting with { and ending with }.");
        const config = new Function(`return ${match[0]}`)();
        
        if (!config.apiKey || !config.projectId) throw new Error("Invalid Firebase Config properties.");

        appState.geminiApiKey = geminiKey;
        appState.firebaseConfig = config;
        
        if(googleClientId) appState.googleClientId = googleClientId;

        document.getElementById('api-key-error').classList.add('hidden');
        
        initializeFirebase();
        initializeGoogleApiClients();
        
        closeModal('apiKeyModal');

    } catch (err) {
        document.getElementById('api-key-error').textContent = `Config Error: ${err.message}`;
        document.getElementById('api-key-error').classList.remove('hidden');
    }
}

async function loadDynamicPlaceholders() {
    const promptInput = document.getElementById('core-task-input');
    if (!promptInput) return;

    // [CHANGED] Simpler placeholder prompt
    const prompt = `Generate a JSON array of 3 simple, popular psychology questions for beginners. Examples: "Why do we dream?", "How to reduce stress". Return ONLY the JSON array of strings.`;
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

    // [CHANGED] Get values directly from active buttons
    const persona = document.querySelector('#persona-selector .active')?.dataset.value || "Science Journalist";
    const tone = document.querySelector('#tone-selector .active')?.dataset.value || "Casual";
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
    contentEl.innerHTML = getLoaderHTML(`Drafting easy-to-read blueprint for "${topic}"...`);
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
        
        // Clean and store
        resultMarkdown = resultMarkdown.replace(/^```(markdown)?\n?/g, '').replace(/\n?```$/g, '').trim();
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
    button.innerHTML = `<span class="flex items-center gap-2"><div class="loader themed-loader w-4 h-4 border-white"></div> Writing...</span>`;

    const detailTitleEl = document.getElementById('inDepthDetailedModalTitle');
    const detailContentEl = document.getElementById('inDepthDetailedModalContent');
    const detailFooterEl = document.getElementById('inDepthDetailedModalFooter');
    const detailBtnContainer = document.getElementById('inDepthDetailedModalButtons');

    const coreTopic = fullTitle.replace("Custom Article: ", "").replace("In-Depth: ", "").trim();
    const finalTitle = `Full Article: ${coreTopic}`;

    detailTitleEl.textContent = finalTitle;
    detailContentEl.innerHTML = getLoaderHTML("Writing the rest of the article (Sections 5-10)...");
    detailFooterEl.dataset.fullTitle = finalTitle;
    detailFooterEl.dataset.fullHierarchyPath = footerEl.dataset.fullHierarchyPath;
    
    openModal('inDepthDetailedModal');

    try {
        const researchLinks = await searchGoogleForTopic(`${coreTopic} psychology concepts`);
        
        const hierarchyPath = JSON.parse(footerEl.dataset.fullHierarchyPath || "[]");
        const context = {
            topic: coreTopic,
            blueprintMarkdown: blueprintMarkdown,
            fullHierarchyPath: hierarchyPath,
            researchLinks: researchLinks
        };
        
        const prompt = getPsychologyArticlePrompt('fullArticle', context);
        let fullContentMarkdown = await callGeminiAPI(prompt, false, "Generate Full Article");
        fullContentMarkdown = fullContentMarkdown.replace(/^```(markdown)?\n?/g, '').replace(/\n?```$/g, '').trim();

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
    card.className = 'card bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden mb-8';
    card.id = cardId;
    card.dataset.fullHierarchyPath = JSON.stringify([{ title: topic }]);
    
    const selectorId = `selector-${cardId}`;
    card.innerHTML = `
        <div class="px-6 py-4 bg-slate-800 text-white flex justify-between items-center">
            <h2 class="text-xl font-bold">${topic}</h2>
            <span class="text-xs bg-white/20 px-2 py-1 rounded text-white/90">Topic Card</span>
        </div>
        <div class="p-6">
            <div id="${selectorId}" class="w-full min-h-[100px]">${getLoaderHTML(`Brainstorming ideas...`)}</div>
            <div id="details-${cardId}" class="details-container mt-6"></div>
        </div>`;
    
    container.prepend(card);
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // [CHANGED] Request simpler topics
    const prompt = `
        Persona: ${persona}.
        Task: Generate 8 interesting, beginner-friendly sub-topics or concepts related to "${topic}". 
        Avoid overly academic jargon. Focus on things people might google.
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
    gridContainer.querySelectorAll('.grid-card-selector').forEach(el => el.classList.remove('active', 'ring-2', 'ring-green-500'));
    target.classList.add('active', 'ring-2', 'ring-green-500');

    const card = target.closest('.card');
    // Safe check for title
    const cardTitle = card.querySelector('h2')?.textContent || "Unknown Topic";
    markItemAsViewed(cardTitle, item.title);

    const resultContainer = document.getElementById(`details-${categoryId}`);
    resultContainer.innerHTML = getLoaderHTML(`Explaining ${item.title}...`);

    // [CHANGED] Request simpler summary
    const prompt = `
        Topic: "${item.title}" (Context: ${cardTitle}).
        Task: Write a simple, engaging 3-sentence summary explaining this concept to a beginner.
        Return raw markdown.
    `;

    try {
        let summary = await callGeminiAPI(prompt, false, "Generate Summary");
        summary = summary.replace(/^```(markdown)?\n?/g, '').replace(/\n?```$/g, '').trim();
        
        resultContainer.innerHTML = `
            <div class="bg-green-50 rounded-lg p-6 border border-green-100">
                <h3 class="text-lg font-bold text-green-800 mb-2">${item.title}</h3>
                <div class="prose max-w-none text-gray-700">${marked.parse(summary)}</div>
            </div>`;
        
        addPostGenerationButtons(resultContainer, topicId, categoryId);
    } catch (error) {
        resultContainer.innerHTML = `<p class="text-red-500">Error.</p>`;
    }
}

async function handleExploreInDepth(topicId, fullHierarchyPath) {
    // Find the item name from the ID using the path or state
    const categoryId = fullHierarchyPath[fullHierarchyPath.length - 1]?.id || Object.keys(appState.allThemeData).find(k => appState.allThemeData[k].find(i => i.id == topicId));
    
    if(!categoryId) {
        console.warn("Could not find category for in-depth.");
        return;
    }

    const item = appState.allThemeData[categoryId]?.find(d => String(d.id) === String(topicId));
    
    if(item) {
        generateCustomArticle(item.title, "Science Journalist", "Casual", `Context: ${fullHierarchyPath.map(p=>p.title || p).join(' > ')}`);
    } else {
        // Fallback if data structure is slightly off
        generateCustomArticle(fullHierarchyPath[0]?.title || "Psychology Topic", "Science Journalist", "Casual", "");
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
        document.body.appendChild(downloadAnchorNode); 
        downloadAnchorNode.click();
        downloadAnchorNode.remove();

        const now = Date.now().toString();
        localStorage.setItem(STORAGE_KEYS.LAST_BACKUP, now);
        document.getElementById('backup-reminder-banner').classList.add('hidden');
        
        displayMessageInModal("Data exported successfully.", "success");
    } catch (error) {
        console.error("Export failed:", error);
        displayMessageInModal(`Export failed: ${error.message}`, "error");
    } finally {
        const btn = document.getElementById('export-data-button');
        btn.textContent = "Backup Data";
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

    // [ADDED] Fix for Persona/Tone Button Selection
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.prompt-builder-btn');
        if (btn) {
            const container = btn.parentElement;
            container.querySelectorAll('.prompt-builder-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        }
    });

    document.getElementById('export-data-button')?.addEventListener('click', handleExportData);
    document.getElementById('import-data-button')?.addEventListener('click', handleImportData);

    document.addEventListener('click', (e) => {
        const target = e.target;
        
        if (target.closest('.grid-card-selector')) {
            handleGridSelect(target.closest('.grid-card-selector'));
        }
        
        if (target.closest('.copy-button')) {
            const content = target.closest('.modal').querySelector('[id$="Content"]')?.innerText;
            if(content) navigator.clipboard.writeText(content);
        }
        
        if (target.closest('#generate-detailed-steps-btn')) {
            generateFullDetailedArticle(target.closest('#generate-detailed-steps-btn'));
        }
        
        if (target.closest('#add-to-kb-btn')) {
            const footer = document.getElementById('inDepthDetailedModalFooter') || document.getElementById('inDepthModalFooter');
            saveArticleToKB(footer.dataset.fullTitle, appState.originalGeneratedText.get(footer.dataset.fullTitle), JSON.parse(footer.dataset.fullHierarchyPath || "[]"));
            displayMessageInModal("Saved to Knowledge Base", "success");
        }

        if (target.id.startsWith('close') && target.closest('.modal')) {
            closeModal(target.closest('.modal').id);
        }
    });
}

function addModalActionButtons(container, isInitial, hasAuth) {
    let html = `<button class="btn-secondary text-sm copy-button py-2 px-4 shadow-sm hover:shadow-md transition-shadow">Copy Text</button>`;
    if (isInitial) {
        html += `<button id="generate-detailed-steps-btn" class="btn-primary text-sm px-6 py-2 shadow-md hover:shadow-lg transition-shadow">Write Full Article</button>`;
    } else {
        html += `<button id="add-to-kb-btn" class="btn-primary text-sm px-6 py-2 shadow-md hover:shadow-lg transition-shadow">Add to KB</button>`;
        if(hasAuth) html += `<button id="save-to-drive-btn" class="btn-secondary text-sm py-2 px-4">Save to Drive</button>`;
    }
    container.innerHTML = html;
}

function addDetailedModalActionButtons(container, hasAuth) {
    addModalActionButtons(container, false, hasAuth);
}

function addPostGenerationButtons(container, topicId, categoryId) {
    let btnBar = document.createElement('div');
    btnBar.className = "flex gap-2 mt-4 pt-4 border-t border-green-100";
    
    // [CHANGED] Robust Explore button
    const btn = document.createElement('button');
    btn.className = "btn-primary text-sm w-full py-2 shadow-sm hover:shadow-md transition-all";
    btn.textContent = "Explore In-Depth";
    btn.onclick = () => {
        // Try to find the card container context
        const card = document.getElementById(`selector-${categoryId}`)?.closest('.card');
        const path = JSON.parse(card?.dataset.fullHierarchyPath || "[]");
        handleExploreInDepth(topicId, path);
    };
    
    btnBar.appendChild(btn);
    container.appendChild(btnBar);
}
