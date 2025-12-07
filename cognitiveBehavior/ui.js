// ui.js
import { appState } from './config.js';
// [CHANGED] Removed callColorGenAPI import as it is no longer needed
import { markItemAsViewed } from './firestore.js';

// --- Constants for Isolation ---
// ensuring we don't conflict with other apps on localhost
const UI_STORAGE_PREFIX = 'psych_ui_';

// --- Permanent Theme Palette (Shades of Green) ---
const PERMANENT_THEME = {
    bg: "#f0fdf4",          // Mint Mist (green-50)
    text: "#1f2937",        // Gray-800
    primary: "#15803d",     // Green-700 (Forest)
    primaryDark: "#14532d", // Green-900
    accent: "#16a34a",      // Green-600
    cardBg: "#ffffff",
    cardBorder: "#dcfce7",  // Green-100
    textMuted: "#6b7280",
    inputBg: "#ffffff",
    inputBorder: "#cbd5e1",
    buttonText: "#ffffff"
};

// --- Global UI Init ---
export function initializeUI() {
    marked.setOptions({
        renderer: new marked.Renderer(),
        highlight: (code, lang) => code,
        langPrefix: 'language-',
        gfm: true,
        breaks: true,
    });
    
    // [ADDED] Apply isolated user preferences on load
    applyUserPreferences();
    
    // [ADDED] Initialize the settings panel logic
    populateSettingsPanel();
}

// --- User Preferences & Settings Panel ---

function applyUserPreferences() {
    const root = document.documentElement;
    
    const savedFont = localStorage.getItem(`${UI_STORAGE_PREFIX}fontFamily`);
    const savedSize = localStorage.getItem(`${UI_STORAGE_PREFIX}fontSize`);
    const savedLineHeight = localStorage.getItem(`${UI_STORAGE_PREFIX}lineHeight`);

    if (savedFont) root.style.setProperty('--font-family', savedFont);
    else root.style.setProperty('--font-family', "'Inter', sans-serif");

    if (savedSize) root.style.fontSize = savedSize;
    if (savedLineHeight) document.body.style.lineHeight = savedLineHeight;
}

function populateSettingsPanel() {
    // 1. Attach Toggle Logic FIRST (Fix for dead button)
    const settingsBtn = document.getElementById('settings-button');
    const settingsPanel = document.getElementById('settings-panel');
    
    if (settingsBtn && settingsPanel) {
        settingsBtn.onclick = () => {
            // Toggle visibility using the hidden class logic we fixed in index.html
            if (settingsPanel.classList.contains('hidden')) {
                settingsPanel.classList.remove('hidden');
                // Small timeout to allow display:block to render before opacity transition
                setTimeout(() => settingsPanel.classList.add('active'), 10);
            } else {
                settingsPanel.classList.remove('active');
                setTimeout(() => settingsPanel.classList.add('hidden'), 200); // Wait for transition
            }
        };
    }

    // 2. Populate Dropdowns
    const families = [
        { name: "Inter (Default)", value: "'Inter', sans-serif" },
        { name: "Lato", value: "'Lato', sans-serif" },
        { name: "Montserrat", value: "'Montserrat', sans-serif" },
        { name: "Open Sans", value: "'Open Sans', sans-serif" },
        { name: "Roboto Slab", value: "'Roboto Slab', serif" },
        { name: "System UI", value: "system-ui, sans-serif" }
    ];
    const sizes = ["14px", "16px", "18px", "20px"];
    const heights = ["1.5", "1.6", "1.8", "2.0"];

    const fSelect = document.getElementById('font-family-select');
    const sSelect = document.getElementById('font-size-select');
    const hSelect = document.getElementById('line-height-select');
    
    // Only proceed with population if elements exist
    if (!fSelect || !sSelect || !hSelect) return;

    // Font Family
    fSelect.innerHTML = families.map(f => `<option value="${f.value}">${f.name}</option>`).join('');
    fSelect.value = localStorage.getItem(`${UI_STORAGE_PREFIX}fontFamily`) || families[0].value;
    fSelect.onchange = (e) => {
        document.documentElement.style.setProperty('--font-family', e.target.value);
        localStorage.setItem(`${UI_STORAGE_PREFIX}fontFamily`, e.target.value);
    };

    // Font Size
    sSelect.innerHTML = sizes.map(s => `<option value="${s}">${s}</option>`).join('');
    sSelect.value = localStorage.getItem(`${UI_STORAGE_PREFIX}fontSize`) || "16px";
    sSelect.onchange = (e) => {
        document.documentElement.style.fontSize = e.target.value;
        localStorage.setItem(`${UI_STORAGE_PREFIX}fontSize`, e.target.value);
    };

    // Line Height
    hSelect.innerHTML = heights.map(h => `<option value="${h}">${h}</option>`).join('');
    hSelect.value = localStorage.getItem(`${UI_STORAGE_PREFIX}lineHeight`) || "1.5";
    hSelect.onchange = (e) => {
        document.body.style.lineHeight = e.target.value;
        localStorage.setItem(`${UI_STORAGE_PREFIX}lineHeight`, e.target.value);
    };
}

// --- Modal Management ---

export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if(modal) {
        modal.classList.remove('hidden'); 
        document.body.classList.add('modal-open');
        modal.classList.add('is-open');
    }
}

export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if(modal) {
        modal.classList.add('hidden'); 
        modal.classList.remove('is-open');
        if (document.querySelectorAll('.modal.is-open').length === 0) {
             document.body.classList.remove('modal-open');
        }
    }
}

export function displayMessageInModal(message, type = 'info') {
    const modalId = 'messageModal';
    const modal = document.getElementById(modalId);
    
    // Simple innerHTML replacement for the message modal
    modal.innerHTML = `
        <div class="card p-8 w-full max-w-sm m-4 text-center">
            <h2 id="messageModalTitle" class="text-2xl font-bold mb-4"></h2>
            <p id="messageModalContent" class="mb-6 themed-text-muted"></p>
            <button id="closeMessageModal" class="btn-primary w-full">OK</button>
        </div>`;
    
    const titleEl = modal.querySelector('#messageModalTitle');
    const contentEl = modal.querySelector('#messageModalContent');
    const closeBtn = modal.querySelector('#closeMessageModal');

    titleEl.textContent = type === 'error' ? 'Error' : (type === 'warning' ? 'Warning' : 'Info');
    titleEl.className = `text-2xl font-bold mb-4 ${type === 'error' ? 'text-red-600' : (type === 'warning' ? 'text-yellow-600' : 'themed-text-primary')}`;
    contentEl.textContent = message;
    
    closeBtn.onclick = () => closeModal(modalId);
    openModal(modalId);
}

// --- Visual Themes & Icons ---

export function applyTheme(colors) {
    const root = document.documentElement;
    Object.entries(colors).forEach(([key, value]) => {
        const cssVar = `--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
        root.style.setProperty(cssVar, value);
    });
}

// [CHANGED] Replaced async generator with instant application of permanent theme
export async function generateAndApplyDefaultTheme() {
    applyTheme(PERMANENT_THEME);
}

export function getIconForTheme(categoryId, topicId) {
    // Generate a consistent pseudo-random hash from the ID
    const hash = (categoryId + topicId).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const variant = hash % 4;

    // Psychology Themed Icons
    const icons = [
        // 1. Brain/Mind (Cognitive/Neuro)
        `<svg class="w-8 h-8 mx-auto themed-text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>`,
        // 2. People/Social (Behavioral/Social)
        `<svg class="w-8 h-8 mx-auto themed-text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>`,
        // 3. Book/Research (Academic/History)
        `<svg class="w-8 h-8 mx-auto themed-text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>`,
        // 4. DNA/Biological (Clinical/Bio)
        `<svg class="w-8 h-8 mx-auto themed-text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>`
    ];

    return icons[variant];
}

// --- Content Rendering (Markdown & Components) ---

export function getLoaderHTML(message) { 
    return `<div class="flex justify-center items-center my-4"><div class="loader themed-loader"></div><p class="ml-4 themed-text-muted">${message}</p></div>`; 
}

export function truncateText(text, maxLength = 50) {
    if (typeof text !== 'string' || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function convertMarkdownToHtml(text) {
    if (!text) return '<p class="themed-text-muted">No content.</p>';
    // marked is loaded globally via CDN script in index.html
    return marked.parse(text);
}

// [CHANGED] Rewritten to robustly separate Intro from Accordion Sections
export function renderAccordionFromMarkdown(markdownText, containerElement) {
    containerElement.innerHTML = '';
    if (!markdownText || !markdownText.trim()) {
        containerElement.innerHTML = convertMarkdownToHtml(null);
        return;
    }

    // 1. Convert Markdown to a standard HTML string
    const rawHtml = convertMarkdownToHtml(markdownText);
    
    // 2. Parse into DOM nodes safely
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtml, 'text/html');
    const nodes = Array.from(doc.body.childNodes);

    // 3. Create Containers
    const introContainer = document.createElement('div');
    introContainer.className = 'accordion-intro mb-6 prose max-w-none prose-p:text-gray-700 prose-headings:text-gray-900';
    
    const accordionContainer = document.createElement('div');
    accordionContainer.className = 'space-y-4'; // Add spacing between items

    let currentSectionContent = null;
    let isInsideSection = false;

    // 4. Iterate and Group
    nodes.forEach(node => {
        // Handle Header Tags (H3, H4) -> Start New Accordion Item
        const tagName = node.tagName;
        if (tagName === 'H3' || tagName === 'H4') {
            isInsideSection = true;
            
            // Create the Accordion Item Structure
            const itemDiv = document.createElement('div');
            itemDiv.className = 'accordion-item border rounded-lg bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200';
            itemDiv.style.borderColor = 'var(--color-card-border)';

            const headerBtn = document.createElement('button');
            headerBtn.className = 'accordion-header w-full px-6 py-4 flex justify-between items-center text-left font-semibold focus:outline-none bg-gray-50 hover:bg-gray-100 transition-colors duration-200';
            headerBtn.style.color = 'var(--color-primary-dark)';
            
            // Add click handler for this specific item
            headerBtn.onclick = () => {
                const content = itemDiv.querySelector('.accordion-content');
                const icon = headerBtn.querySelector('.icon');
                
                // Toggle classes
                content.classList.toggle('hidden');
                headerBtn.classList.toggle('active');
                
                // Rotate icon
                if (content.classList.contains('hidden')) {
                    icon.style.transform = 'rotate(0deg)';
                } else {
                    icon.style.transform = 'rotate(180deg)';
                }
            };

            headerBtn.innerHTML = `
                <span>${node.textContent}</span>
                <svg class="icon w-5 h-5 transition-transform duration-200 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
            `;

            const contentDiv = document.createElement('div');
            contentDiv.className = 'accordion-content hidden px-6 py-4 prose max-w-none bg-white';
            
            itemDiv.appendChild(headerBtn);
            itemDiv.appendChild(contentDiv);
            accordionContainer.appendChild(itemDiv);

            // Update reference to where we should append subsequent nodes
            currentSectionContent = contentDiv;
        } 
        else {
            // Non-Header Node
            if (isInsideSection && currentSectionContent) {
                // Append to current accordion section
                currentSectionContent.appendChild(node.cloneNode(true));
            } else {
                // Append to Intro (before any headers found)
                introContainer.appendChild(node.cloneNode(true));
            }
        }
    });

    // 5. Append final structures to the main container
    if (introContainer.hasChildNodes()) {
        containerElement.appendChild(introContainer);
    }
    if (accordionContainer.hasChildNodes()) {
        containerElement.appendChild(accordionContainer);
    }

    // 6. Automatically open the first accordion item for better UX
    const firstItem = accordionContainer.firstElementChild;
    if (firstItem) {
        const btn = firstItem.querySelector('.accordion-header');
        const content = firstItem.querySelector('.accordion-content');
        const icon = firstItem.querySelector('.icon');
        
        btn.classList.add('active');
        content.classList.remove('hidden');
        if(icon) icon.style.transform = 'rotate(180deg)';
    }
}

// --- Grid & Card Rendering ---

export function createBreadcrumbsHtml(pathArray) {
    if (!pathArray || pathArray.length === 0) return '';
    const pathSegments = pathArray.map(p => `<span>${p.title}</span>`).join('<span class="mx-2 opacity-50">/</span>');
    return `<div class="flex items-center flex-wrap gap-x-2 text-sm themed-text-muted mb-3">${pathSegments}</div>`;
}

export function populateCardGridSelector(container, categoryId) {
    if (!container) return;
    
    // Retrieve data from appState
    const data = appState.allThemeData[categoryId] || [];
    const stickies = appState.stickyTopics[categoryId] || [];
    const userAdded = appState.userAddedTopics[categoryId] || [];

    if (data.length === 0 && stickies.length === 0 && userAdded.length === 0) {
         if(!container.querySelector('.loader')) {
             container.innerHTML = `<p class="themed-text-muted text-center py-8">No topics found. Add your own below.</p>`;
             renderAddTopicInput(container, categoryId);
         }
         return;
    }

    const stickyTitles = new Set(stickies.map(s => s.title));
    const userAddedTitles = new Set(userAdded.map(u => u.title));

    // Render HTML Strings
    const stickyHtml = stickies.map(item => createGridItemHtml(item, categoryId, 'sticky')).join('');
    const userAddedHtml = userAdded.map(item => createGridItemHtml(item, categoryId, 'user')).join('');
    const regularHtml = data
        .filter(item => !stickyTitles.has(item.title) && !userAddedTitles.has(item.title))
        .map(item => createGridItemHtml(item, categoryId, 'regular'))
        .join('');

    container.innerHTML = `<div class="card-grid-container">${stickyHtml}${userAddedHtml}${regularHtml}</div>`;
    renderAddTopicInput(container, categoryId);
    renderGenerateMoreButton(container, categoryId);
}

function createGridItemHtml(item, categoryId, type) {
    let indicatorHtml = '';
    let classes = 'grid-card-selector';
    
    if (type === 'sticky') {
        indicatorHtml = `<div class="indicator sticky-indicator" title="Sticky Topic"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L13 7.414V17a1 1 0 11-2 0V7.414L7.707 10.707a1 1 0 01-1.414-1.414l4-4z" clip-rule="evenodd" /></svg></div>`;
    } else if (type === 'user') {
        indicatorHtml = `<div class="indicator" style="background-color: #f59e0b;" title="Your Topic"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3"><path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.41-1.412A6.962 6.962 0 0010 11.5c-2.25 0-4.33.9-5.535 2.993z"></path></svg></div>`;
    }

    return `
        <div id="grid-selector-${item.id}" class="${classes}" data-topic-id="${item.id}" data-category-id="${categoryId}" title="${item.title}">
            ${indicatorHtml}
            <div class="icon">${getIconForTheme(categoryId, item.id)}</div>
            <div class="mt-2 overflow-hidden"><div class="text-sm font-normal leading-tight block">${truncateText(item.title, 50)}</div></div>
        </div>`;
}

function renderAddTopicInput(container, categoryId) {
    const div = document.createElement('div');
    div.className = "add-topic-container";
    div.innerHTML = `
        <input type="text" id="add-topic-input-${categoryId}" placeholder="Add your own topic..." class="themed-input w-full p-2 rounded-lg text-sm">
        <button class="btn-secondary add-topic-button !px-4 !py-2" data-container-id="${container.id}" data-category-id="${categoryId}">Add</button>
    `;
    container.appendChild(div);
}

function renderGenerateMoreButton(container, categoryId) {
    const div = document.createElement('div');
    div.className = "col-span-full text-center mt-4";
    div.innerHTML = `
        <button class="generate-more-button btn-secondary" data-container-id="${container.id}" data-category-id="${categoryId}">
            <span class="flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Find more topics
            </span>
        </button>`;
    container.appendChild(div);
}

// --- Import Display ---

export function displayImportedGuide(fileName, markdownContent) {
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
        <h2 class="text-2xl font-bold mb-2 themed-text-primary flex items-center">
            Imported: ${fileName}
        </h2>
        <div class="prose max-w-none mt-4"></div>
    `;
    
    const renderTarget = cardContent.querySelector('.prose');
    renderAccordionFromMarkdown(markdownContent, renderTarget);
    
    card.appendChild(cardContent);
    container.prepend(card);
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
