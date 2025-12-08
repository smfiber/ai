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
    exportUserData, importUserData, getKnowledgeBaseContent 
} from './firestore.js';
import { 
    initializeUI, openModal, closeModal, displayMessageInModal, 
    generateAndApplyDefaultTheme, getLoaderHTML, 
    renderAccordionFromMarkdown, 
    populateCardGridSelector, truncateText, 
    displayImportedGuide, applyTheme,
    toggleSpeech 
} from './ui.js';
import { 
    getPsychologyArticlePrompt
} from './prompts.js';

// --- Static Data: Comprehensive Domains ---
const PSYCH_DOMAINS = [
    { title: "Clinical Psychology", desc: "Mental health, disorders, and therapy.", icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" },
    { title: "Cognitive Psychology", desc: "Memory, decision-making, and language.", icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" },
    { title: "Social Psychology", desc: "Group behavior, bias, and relationships.", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
    { title: "Developmental Psychology", desc: "Lifespan growth from childhood to aging.", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
    { title: "Behavioral Neuroscience", desc: "Brain structure, chemistry, and genetics.", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
    { title: "Industrial-Organizational", desc: "Workplace behavior and leadership.", icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
    { title: "Forensic Psychology", desc: "Psychology within the legal/criminal system.", icon: "M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" },
    { title: "Educational Psychology", desc: "How people learn and teaching methods.", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
    { title: "Health Psychology", desc: "Stress, wellness, and lifestyle factors.", icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" },
    { title: "Personality Psychology", desc: "Individual differences and character traits.", icon: "M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
    { title: "Sports & Performance", desc: "Motivation, resilience, and peak performance.", icon: "M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" },
    { title: "Evolutionary Psychology", desc: "Adaptation and human nature.", icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }
];

document.addEventListener('DOMContentLoaded', () => {
    initializeUI();
    setupEventListeners();
    renderDomainExplorer();

    localStorage.removeItem('psych_geminiApiKey'); 
    localStorage.removeItem('psych_firebaseConfig'); 
    generateAndApplyDefaultTheme();

    const appContainer = document.getElementById('app-container');
    if (appContainer) appContainer.classList.add('hidden');

    setupAuthUI(null); 
    openModal('apiKeyModal');
});

function renderDomainExplorer() {
    const container = document.getElementById('domain-explorer-container');
    if (!container) return;

    container.innerHTML = PSYCH_DOMAINS.map(domain => `
        <div class="group bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md hover:border-green-300 transition-all cursor-pointer flex flex-col justify-between h-full" onclick="window.triggerDomainSearch('${domain.title}')">
            <div>
                <div class="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-3 text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${domain.icon}"></path></svg>
                </div>
                <h3 class="font-bold text-gray-800 text-lg mb-1 group-hover:text-green-700">${domain.title}</h3>
                <p class="text-sm text-gray-500 leading-snug">${domain.desc}</p>
            </div>
            <div class="mt-4 pt-3 border-t border-gray-100 flex items-center text-xs font-semibold text-green-600 uppercase tracking-wide group-hover:text-green-800">
                <span>Discover Topics</span>
                <svg class="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
            </div>
        </div>
    `).join('');
}

window.triggerDomainSearch = (title) => {
    generateAndPopulateTopicCard(title, "Science Journalist", "Casual", "Comprehensive overview of this field.");
};

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
    const cardTitle = card.querySelector('h2')?.textContent || "Unknown Topic";
    markItemAsViewed(cardTitle, item.title);

    const resultContainer = document.getElementById(`details-${categoryId}`);
    resultContainer.innerHTML = getLoaderHTML(`Explaining ${item.title}...`);

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
    const categoryId = fullHierarchyPath[fullHierarchyPath.length - 1]?.id || Object.keys(appState.allThemeData).find(k => appState.allThemeData[k].find(i => i.id == topicId));
    
    if(!categoryId) {
        generateCustomArticle(fullHierarchyPath[0]?.title || topicId, "Science Journalist", "Casual", "");
        return;
    }

    const item = appState.allThemeData[categoryId]?.find(d => String(d.id) === String(topicId));
    
    if(item) {
        generateCustomArticle(item.title, "Science Journalist", "Casual", `Context: ${fullHierarchyPath.map(p=>p.title || p).join(' > ')}`);
    } else {
        generateCustomArticle(fullHierarchyPath[0]?.title || "Psychology Topic", "Science Journalist", "Casual", "");
    }
}

// [ADDED] Library Handler
async function handleOpenLibrary() {
    if (!appState.userId) {
        displayMessageInModal("Please login to access your library.", "warning");
        return;
    }
    
    openModal('libraryModal');
    const content = document.getElementById('libraryModalContent');
    content.innerHTML = getLoaderHTML("Fetching your saved articles...");
    
    try {
        const items = await getKnowledgeBaseContent();
        renderLibraryItems(items);
    } catch(e) {
        content.innerHTML = `<p class="text-red-500 p-4">Error loading library: ${e.message}</p>`;
    }
}

// [ADDED] Library Renderer
function renderLibraryItems(items) {
    const content = document.getElementById('libraryModalContent');
    if (!items || items.length === 0) {
        content.innerHTML = `<div class="col-span-full text-center p-8 text-gray-500">Your library is empty. Save an article to see it here.</div>`;
        return;
    }

    content.innerHTML = items.map(item => `
        <div class="bg-white p-5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full">
            <div>
                <h3 class="font-bold text-lg text-gray-800 mb-1 line-clamp-2">${item.title}</h3>
                <p class="text-xs text-green-600 font-semibold uppercase mb-2">${item.type || 'Article'}</p>
                <p class="text-xs text-gray-400">Saved: ${item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}</p>
            </div>
            <button onclick="window.openSavedArticle('${item.id}')" class="mt-4 w-full btn-secondary text-sm border-green-200 text-green-700 hover:bg-green-50">Read Now</button>
        </div>
    `).join('');
    
    // Store items in memory for search filtering
    appState.libraryCache = items;
}

// [CHANGED] Fixed to include buttons & ensure audio works
window.openSavedArticle = (id) => {
    const item = appState.libraryCache.find(i => i.id === id);
    if (!item) return;

    // Reuse inDepthModal
    const titleEl = document.getElementById('inDepthModalTitle');
    const contentEl = document.getElementById('inDepthModalContent');
    const footerEl = document.getElementById('inDepthModalFooter');
    const buttonContainer = document.getElementById('inDepthModalButtons');

    titleEl.textContent = item.title;
    contentEl.innerHTML = '';
    
    // Set text in appState so Audio can find it
    appState.originalGeneratedText.set(item.title, item.markdownContent);
    
    // Render markdown
    renderAccordionFromMarkdown(item.markdownContent, contentEl);
    
    // Inject Copy & Read Aloud Buttons
    buttonContainer.innerHTML = `
        <button class="btn-secondary text-sm copy-button py-2 px-4 shadow-sm hover:shadow-md transition-shadow">Copy Text</button>
        <button id="read-aloud-btn" class="btn-secondary text-sm py-2 px-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-2 text-green-700 border-green-200 hover:bg-green-50">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path></svg>
            Read Aloud
        </button>
    `;

    footerEl.dataset.fullTitle = item.title; // Key for lookup
    
    closeModal('libraryModal');
    openModal('inDepthModal');
};

async function handleExportData() {
    try {
        const btn = document.getElementById('export-data-button');
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
    
    // [ADDED] Library Listeners
    document.getElementById('my-library-btn')?.addEventListener('click', handleOpenLibrary);
    
    // Library Search Filter
    document.getElementById('library-search')?.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = appState.libraryCache.filter(item => item.title.toLowerCase().includes(term));
        renderLibraryItems(filtered);
    });

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

        // [ADDED] Read Aloud Listener
        if (target.closest('#read-aloud-btn')) {
            const btn = target.closest('#read-aloud-btn');
            // Locate the footer specifically for the button clicked (works for both Blueprint and Detailed modals)
            const footer = btn.closest('[id$="Footer"]');
            
            if (footer) {
                const fullTitle = footer.dataset.fullTitle;
                const text = appState.originalGeneratedText.get(fullTitle);
                if (text) toggleSpeech(text, btn);
            }
        }

        // [FIXED] Close Button Logic (now handles child SVG clicks)
        const closeBtn = target.closest('button');
        if (closeBtn && closeBtn.id.startsWith('close') && closeBtn.closest('.modal')) {
            closeModal(closeBtn.closest('.modal').id);
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
    // [UPDATED] Added "Read Aloud" button here
    let html = `<button class="btn-secondary text-sm copy-button py-2 px-4 shadow-sm hover:shadow-md transition-shadow">Copy Text</button>`;
    
    // Read Aloud Button (with Speaker Icon)
    html += `
        <button id="read-aloud-btn" class="btn-secondary text-sm py-2 px-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-2 text-green-700 border-green-200 hover:bg-green-50">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path></svg>
            Read Aloud
        </button>
    `;

    html += `<button id="add-to-kb-btn" class="btn-primary text-sm px-6 py-2 shadow-md hover:shadow-lg transition-shadow">Add to KB</button>`;
    if(hasAuth) html += `<button id="save-to-drive-btn" class="btn-secondary text-sm py-2 px-4">Save to Drive</button>`;
    
    container.innerHTML = html;
}

function addPostGenerationButtons(container, topicId, categoryId) {
    let btnBar = document.createElement('div');
    btnBar.className = "flex gap-2 mt-4 pt-4 border-t border-green-100";
    
    const btn = document.createElement('button');
    btn.className = "btn-primary text-sm w-full py-2 shadow-sm hover:shadow-md transition-all";
    btn.textContent = "Explore In-Depth";
    btn.onclick = () => {
        const card = document.getElementById(`selector-${categoryId}`)?.closest('.card');
        const path = JSON.parse(card?.dataset.fullHierarchyPath || "[]");
        handleExploreInDepth(topicId, path);
    };
    
    btnBar.appendChild(btn);
    container.appendChild(btnBar);
}
