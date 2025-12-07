// main.js
import { appState, loadConfigFromStorage, APP_ID } from './config.js';
import { 
    callGeminiAPI, searchGoogleForTopic, parseJsonWithCorrections 
} from './api.js';
import { 
    handleFirebaseLogin, handleFirebaseLogout, initializeGoogleApiClients, 
    handleDriveAuthClick, saveContentToDrive, createPicker, updateSigninStatus 
} from './auth.js';
import { 
    initializeFirebase, saveArticleToKB, markItemAsViewed, 
    listenForStickyTopics, listenForUserAddedTopics, addStickyTopic, 
    addUserTopic, updateStickyTopic, deleteStickyTopic, 
    getHierarchyData, addHierarchyItem, updateHierarchyItem, deleteHierarchyItem,
    loadKbItem, getKnowledgeBaseContent
} from './firestore.js';
import { 
    initializeUI, openModal, closeModal, displayMessageInModal, 
    generateAndApplyDefaultTheme, getLoaderHTML, renderAccordionFromMarkdown, 
    populateCardGridSelector, createBreadcrumbsHtml, truncateText, getIconForTheme, 
    displayImportedGuide, applyTheme
} from './ui.js';
import { 
    getPsychologyArticlePrompt, getRefinementPrompt, getExplanatoryArticlePrompt, jsonInstruction 
} from './prompts.js';

// --- Initialization ---

document.addEventListener('DOMContentLoaded', () => {
    initializeUI();
    setupEventListeners();

    if (loadConfigFromStorage()) {
        initializeFirebase();
        initializeGoogleApiClients();
    } else {
        openModal('apiKeyModal');
    }
});

async function initializeAppContent() {
    if (appState.appIsInitialized) return;
    appState.appIsInitialized = true;

    openModal('loadingStateModal');
    document.getElementById('loading-message').textContent = "Initializing Research Assistant...";
    
    // Check for backup reminder logic (unchanged)
    const lastBackup = localStorage.getItem('lastBackupTimestamp');
    if (lastBackup && (Date.now() - parseInt(lastBackup) > 604800000)) { // 7 days
        document.getElementById('backup-reminder-banner').classList.remove('hidden');
    }

    try {
        await generateAndApplyDefaultTheme();
        document.getElementById('loading-message').textContent = "Loading content...";
        await loadDynamicPlaceholders();
        
        // Load Featured Categories (Optional: could load specific hardcoded IDs if desired)
        // For now, we wait for user interaction.
    } catch (error) {
        console.error("Init Error:", error);
    } finally {
        closeModal('loadingStateModal');
    }
}

async function handleApiKeySubmit(e) {
    e.preventDefault();
    const geminiKey = document.getElementById('geminiApiKeyInput').value.trim();
    const firebaseConfigText = document.getElementById('firebaseConfigInput').value.trim();
    
    // Optional keys
    const googleClientId = document.getElementById('googleClientIdInput').value.trim();
    const googleSearchId = document.getElementById('googleSearchEngineIdInput').value.trim();
    const algoliaAppId = document.getElementById('algoliaAppIdInput').value.trim();
    const algoliaKey = document.getElementById('algoliaSearchKeyInput').value.trim();

    if (!geminiKey || !firebaseConfigText) {
        document.getElementById('api-key-error').textContent = "Gemini Key and Firebase Config are required.";
        return;
    }

    try {
        // Parse Firebase Config safely
        const match = firebaseConfigText.match(/\{[\s\S]*\}/);
        if (!match) throw new Error("Invalid Config Object");
        const config = new Function(`return ${match[0]}`)();
        
        localStorage.setItem('geminiApiKey', geminiKey);
        localStorage.setItem('firebaseConfig', JSON.stringify(config));
        if(googleClientId) localStorage.setItem('googleClientId', googleClientId);
        if(googleSearchId) localStorage.setItem('googleSearchEngineId', googleSearchId);
        if(algoliaAppId) localStorage.setItem('algoliaAppId', algoliaAppId);
        if(algoliaKey) localStorage.setItem('algoliaSearchKey', algoliaKey);

        if (loadConfigFromStorage()) {
            initializeFirebase();
            initializeGoogleApiClients();
            handleFirebaseLogin(); // Prompt login immediately on setup
            closeModal('apiKeyModal');
        }
    } catch (err) {
        document.getElementById('api-key-error').textContent = `Config Error: ${err.message}`;
    }
}

async function loadDynamicPlaceholders() {
    const promptInput = document.getElementById('core-task-input');
    // Updated prompt for Psychology context
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

// --- Main Form Handling ---

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

// --- Article Generation Logic ---

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
        // Step 1: Generate Blueprint (Sections 1-4)
        const prompt = getPsychologyArticlePrompt('blueprint', context);
        let resultMarkdown = await callGeminiAPI(prompt, false, "Generate Blueprint");
        
        // Store and Render
        resultMarkdown = cleanMarkdown(resultMarkdown);
        appState.originalGeneratedText.set(fullTitle, resultMarkdown);
        
        contentEl.innerHTML = '';
        renderAccordionFromMarkdown(resultMarkdown, contentEl);
        
        // Pass empty hierarchy for custom search
        footerEl.dataset.fullHierarchyPath = JSON.stringify([]); 
        
        // Add "Generate Full Article" button
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
    button.innerHTML = `Generating...`;

    const detailTitleEl = document.getElementById('inDepthDetailedModalTitle');
    const detailContentEl = document.getElementById('inDepthDetailedModalContent');
    const detailFooterEl = document.getElementById('inDepthDetailedModalFooter');
    const detailBtnContainer = document.getElementById('inDepthDetailedModalButtons');

    const coreTopic = fullTitle.replace("Custom Article: ", "").replace("In-Depth: ", "").trim();
    const finalTitle = `Full Article: ${coreTopic}`;

    detailTitleEl.textContent = finalTitle;
    detailContentEl.innerHTML = getLoaderHTML("Researching and writing sections 5-10...");
    detailFooterEl.dataset.fullTitle = finalTitle;
    // Persist hierarchy path if exists
    detailFooterEl.dataset.fullHierarchyPath = footerEl.dataset.fullHierarchyPath;
    
    openModal('inDepthDetailedModal');

    try {
        // Step 1: Live Research
        const researchLinks = await searchGoogleForTopic(`${coreTopic} psychology research`);
        
        // Step 2: Generate Full Content
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

        // Merge Blueprint + Full Content
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

// --- Topic Card Logic ---

async function generateAndPopulateTopicCard(topic, persona, tone, extraContext) {
    const cardId = `category-card-${topic.replace(/\s+/g, '-')}-${Date.now()}`;
    const container = document.getElementById('dynamic-card-container');
    
    // Create UI Skeleton
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

    // Generate Topics
    const prompt = `
        Persona: Expert ${persona}.
        Task: Generate 8 specific sub-fields or research areas related to "${topic}".
        Audience: ${tone}.
        Format: JSON array of objects { "title": "string", "description": "string", "id": "string" }.
    `;

    try {
        const jsonText = await callGeminiAPI(prompt, true, "Generate Topic Card");
        const data = parseJsonWithCorrections(jsonText);
        appState.allThemeData[cardId] = data; // Store data
        
        const selectorContainer = card.querySelector(`#${selectorId}`);
        populateCardGridSelector(selectorContainer, cardId); // Render Grid
    } catch (error) {
        card.querySelector(`#${selectorId}`).innerHTML = `<p class="text-red-500">Generation failed.</p>`;
    }
}

// --- Grid Interaction (Summary & Explore) ---

async function handleGridSelect(target) {
    const { topicId, categoryId } = target.dataset;
    
    // Find item data
    let item = appState.allThemeData[categoryId]?.find(d => String(d.id) === String(topicId)) 
        || appState.stickyTopics[categoryId]?.find(d => String(d.id) === String(topicId))
        || appState.userAddedTopics[categoryId]?.find(d => String(d.id) === String(topicId));
    
    if (!item) return;

    // UI Active State
    const gridContainer = target.closest('.card-grid-container');
    gridContainer.querySelectorAll('.grid-card-selector').forEach(el => el.classList.remove('active'));
    target.classList.add('active');

    // Mark Viewed
    const card = target.closest('.card');
    const cardTitle = card.querySelector('h2').textContent;
    markItemAsViewed(cardTitle, item.title);

    // Generate Summary
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
        
        // Add buttons
        addPostGenerationButtons(resultContainer, topicId, categoryId);
    } catch (error) {
        resultContainer.innerHTML = `<p class="text-red-500">Error.</p>`;
    }
}

async function handleExploreInDepth(topicId, fullHierarchyPath) {
    // Logic similar to custom article, but using hierarchy data
    const categoryId = fullHierarchyPath[fullHierarchyPath.length - 1].id || fullHierarchyPath[0].id; // Fallback
    
    // Find item again (data persistence check)
    // Note: If hierarchy browsing, data is in appState.allThemeData[categoryId]
    // If custom card, data is in appState.allThemeData[categoryId]
    // ... (Reuse generateCustomArticle logic but with specific hierarchy context)
    
    // Simplification: We fetch the title and call generation
    const cardId = `category-card-${categoryId}`; 
    // This part requires robust state mapping which we simplified in appState.allThemeData.
    
    // For this implementation, we will extract the title from the clicked element's parent data
    // In a full app, we'd pass the item object directly.
    
    // Let's assume we can get the title.
    // For the sake of the example flow:
    // 1. Get Title from button dataset (we need to update button generation to pass title)
    // OR 2. Lookup in appState.
    
    // Implementation:
    const item = appState.allThemeData[categoryId]?.find(d => String(d.id) === String(topicId));
    if(item) {
        // Trigger the Custom Article flow with context
        generateCustomArticle(item.title, "Academic Researcher", "Professional", `Context: ${fullHierarchyPath.map(p=>p.title).join(' > ')}`);
    }
}

// --- Event Listeners Hub ---

function setupEventListeners() {
    // Auth
    document.getElementById('apiKeyForm')?.addEventListener('submit', handleApiKeySubmit);
    document.getElementById('auth-button')?.addEventListener('click', () => {
        if (appState.oauthToken) handleDriveAuthClick(); // Disconnect logic
        else handleFirebaseLogin(); // Default to Firebase for main app
    });
    document.getElementById('load-from-drive-btn')?.addEventListener('click', () => createPicker('open'));

    // Generation
    document.getElementById('gemini-form')?.addEventListener('submit', handleGeminiSubmit);

    // Tools
    document.getElementById('theme-changer-button')?.addEventListener('click', () => openModal('themeGeneratorModal'));
    document.getElementById('generate-theme-btn')?.addEventListener('click', async () => {
        const p = document.getElementById('theme-prompt').value;
        const c = await import('./api.js').then(m => m.callColorGenAPI(p));
        import('./ui.js').then(m => { m.applyTheme(c); m.closeModal('themeGeneratorModal'); });
    });

    // Delegated Clicks (Grid, Buttons, Modals)
    document.addEventListener('click', (e) => {
        const target = e.target;
        
        // Grid Selection
        if (target.closest('.grid-card-selector')) {
            handleGridSelect(target.closest('.grid-card-selector'));
        }
        
        // Modal Actions
        if (target.closest('.copy-button')) {
            // Copy logic
            const content = target.closest('.card').querySelector('[id$="Content"]')?.innerText;
            if(content) navigator.clipboard.writeText(content);
        }
        
        if (target.closest('#generate-detailed-steps-btn')) {
            generateFullDetailedArticle(target.closest('#generate-detailed-steps-btn'));
        }
        
        if (target.closest('#add-to-kb-btn')) {
            // Save logic
            const footer = document.getElementById('inDepthDetailedModalFooter');
            saveArticleToKB(footer.dataset.fullTitle, appState.originalGeneratedText.get(footer.dataset.fullTitle), JSON.parse(footer.dataset.fullHierarchyPath || "[]"));
            displayMessageInModal("Saved to Knowledge Base", "success");
        }

        // Close Modals
        if (target.id.startsWith('close') && target.closest('.modal')) {
            closeModal(target.closest('.modal').id);
        }
    });
}

// --- Helpers ---

function cleanMarkdown(text) {
    if (!text) return "";
    return text.replace(/^```(markdown)?\n?/g, '').replace(/\n?```$/g, '').trim();
}

function addModalActionButtons(container, isInitial, hasAuth) {
    // Dynamically build buttons
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
    // Add "Read Article" button
    let btnBar = document.createElement('div');
    btnBar.className = "flex gap-2 mt-4 pt-4 border-t";
    
    const btn = document.createElement('button');
    btn.className = "btn-primary text-sm w-full";
    btn.textContent = "Explore In-Depth";
    btn.onclick = () => {
        // Need to reconstruct hierarchy path or just pass ID
        // Simplified for this context:
        const card = document.getElementById(`selector-${categoryId}`)?.closest('.card');
        const path = JSON.parse(card?.dataset.fullHierarchyPath || "[]");
        handleExploreInDepth(topicId, path);
    };
    
    btnBar.appendChild(btn);
    container.appendChild(btnBar);
}
