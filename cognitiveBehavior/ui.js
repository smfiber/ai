// ui.js
import { appState } from './config.js';
import { markItemAsViewed } from './firestore.js';

// --- Constants for Isolation ---
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
    
    applyUserPreferences();
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
    const settingsBtn = document.getElementById('settings-button');
    const settingsPanel = document.getElementById('settings-panel');
    
    if (settingsBtn && settingsPanel) {
        settingsBtn.onclick = () => {
            if (settingsPanel.classList.contains('hidden')) {
                settingsPanel.classList.remove('hidden');
                setTimeout(() => settingsPanel.classList.add('active'), 10);
            } else {
                settingsPanel.classList.remove('active');
                setTimeout(() => settingsPanel.classList.add('hidden'), 200);
            }
        };
    }

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
    
    if (!fSelect || !sSelect || !hSelect) return;

    fSelect.innerHTML = families.map(f => `<option value="${f.value}">${f.name}</option>`).join('');
    fSelect.value = localStorage.getItem(`${UI_STORAGE_PREFIX}fontFamily`) || families[0].value;
    fSelect.onchange = (e) => {
        document.documentElement.style.setProperty('--font-family', e.target.value);
        localStorage.setItem(`${UI_STORAGE_PREFIX}fontFamily`, e.target.value);
    };

    sSelect.innerHTML = sizes.map(s => `<option value="${s}">${s}</option>`).join('');
    sSelect.value = localStorage.getItem(`${UI_STORAGE_PREFIX}fontSize`) || "16px";
    sSelect.onchange = (e) => {
        document.documentElement.style.fontSize = e.target.value;
        localStorage.setItem(`${UI_STORAGE_PREFIX}fontSize`, e.target.value);
    };

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
    
    // Header Color based on type
    let headerColor = 'var(--color-primary)'; // Default Green
    let headerTitle = 'Information';
    if (type === 'error') { headerColor = '#991b1b'; headerTitle = 'Error'; }
    if (type === 'warning') { headerColor = '#d97706'; headerTitle = 'Warning'; }

    // Rich HTML for Message Modal
    modal.innerHTML = `
        <div class="bg-white rounded-lg shadow-2xl w-full max-w-sm m-4 overflow-hidden border border-gray-200">
            <div class="px-6 py-3 flex items-center justify-between" style="background-color: ${headerColor}; color: white;">
                <h2 id="messageModalTitle" class="text-lg font-bold">${headerTitle}</h2>
                <button id="closeMessageModalHeader" class="text-white hover:text-gray-200 focus:outline-none">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
            <div class="p-6 text-center">
                <p id="messageModalContent" class="text-gray-700 leading-relaxed mb-6">${message}</p>
                <button id="closeMessageModal" class="btn-primary w-full py-2 shadow-md">OK</button>
            </div>
        </div>`;
    
    const closeBtn = modal.querySelector('#closeMessageModal');
    const closeHeader = modal.querySelector('#closeMessageModalHeader');

    const closeAction = () => closeModal(modalId);
    closeBtn.onclick = closeAction;
    closeHeader.onclick = closeAction;
    
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

export async function generateAndApplyDefaultTheme() {
    applyTheme(PERMANENT_THEME);
}

export function getIconForTheme(categoryId, topicId) {
    const hash = (categoryId + topicId).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const variant = hash % 4;

    const icons = [
        `<svg class="w-8 h-8 mx-auto themed-text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>`,
        `<svg class="w-8 h-8 mx-auto themed-text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>`,
        `<svg class="w-8 h-8 mx-auto themed-text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>`,
        `<svg class="w-8 h-8 mx-auto themed-text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>`
    ];

    return icons[variant];
}

// --- Content Rendering (Markdown & Components) ---

export function getLoaderHTML(message) { 
    return `<div class="flex flex-col justify-center items-center my-8"><div class="loader themed-loader w-10 h-10 mb-3"></div><p class="themed-text-muted font-medium animate-pulse">${message}</p></div>`; 
}

export function truncateText(text, maxLength = 50) {
    if (typeof text !== 'string' || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function convertMarkdownToHtml(text) {
    if (!text) return '<p class="themed-text-muted italic">No content available.</p>';
    return marked.parse(text);
}

// [CHANGED] Rich "Card Style" Accordion Rendering
export function renderAccordionFromMarkdown(markdownText, containerElement) {
    containerElement.innerHTML = '';
    if (!markdownText || !markdownText.trim()) {
        containerElement.innerHTML = convertMarkdownToHtml(null);
        return;
    }

    const rawHtml = convertMarkdownToHtml(markdownText);
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtml, 'text/html');
    const nodes = Array.from(doc.body.childNodes);

    const introContainer = document.createElement('div');
    introContainer.className = 'accordion-intro mb-8 prose max-w-none text-gray-700 leading-relaxed p-4 bg-white rounded-lg border border-gray-100 shadow-sm';
    
    const accordionContainer = document.createElement('div');
    accordionContainer.className = 'space-y-6'; // More space between cards

    let currentSectionContent = null;
    let isInsideSection = false;

    nodes.forEach(node => {
        const tagName = node.tagName;
        // Treat H3/H4 as Card Headers
        if (tagName === 'H3' || tagName === 'H4') {
            isInsideSection = true;
            
            // Outer Card Container
            const itemDiv = document.createElement('div');
            itemDiv.className = 'accordion-item border rounded-xl overflow-hidden shadow-md transition-all duration-300 hover:shadow-lg bg-white';
            itemDiv.style.borderColor = 'var(--color-card-border)';

            // Card Header (Rich Color Strip)
            const headerBtn = document.createElement('button');
            headerBtn.className = 'accordion-header w-full px-5 py-4 flex justify-between items-center text-left font-bold focus:outline-none transition-colors duration-200';
            // Use Primary Color Background, White Text
            headerBtn.style.backgroundColor = 'var(--color-primary)';
            headerBtn.style.color = 'white';
            
            headerBtn.onclick = () => {
                const content = itemDiv.querySelector('.accordion-content');
                const icon = headerBtn.querySelector('.icon');
                content.classList.toggle('hidden');
                headerBtn.classList.toggle('active');
                if (content.classList.contains('hidden')) {
                    icon.style.transform = 'rotate(0deg)';
                } else {
                    icon.style.transform = 'rotate(180deg)';
                }
            };

            // Header Content
            headerBtn.innerHTML = `
                <span class="text-lg tracking-wide flex items-center gap-2">
                    ${node.textContent}
                </span>
                <svg class="icon w-6 h-6 transition-transform duration-300 text-green-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"></path></svg>
            `;

            // Card Body
            const contentDiv = document.createElement('div');
            contentDiv.className = 'accordion-content hidden px-6 py-6 prose max-w-none bg-white text-gray-700';
            // Style inner headings to match theme
            contentDiv.style.setProperty('--tw-prose-headings', 'var(--color-primary-dark)');
            contentDiv.style.setProperty('--tw-prose-links', 'var(--color-accent)');
            
            itemDiv.appendChild(headerBtn);
            itemDiv.appendChild(contentDiv);
            accordionContainer.appendChild(itemDiv);

            currentSectionContent = contentDiv;
        } 
        else {
            if (isInsideSection && currentSectionContent) {
                currentSectionContent.appendChild(node.cloneNode(true));
            } else {
                introContainer.appendChild(node.cloneNode(true));
            }
        }
    });

    if (introContainer.hasChildNodes() && introContainer.textContent.trim().length > 0) {
        containerElement.appendChild(introContainer);
    }
    if (accordionContainer.hasChildNodes()) {
        containerElement.appendChild(accordionContainer);
    }

    // Auto-open first item
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
    const pathSegments = pathArray.map(p => `<span>${p.title}</span>`).join('<span class="mx-2 opacity-50 text-gray-400">/</span>');
    return `<div class="flex items-center flex-wrap gap-x-2 text-sm font-medium text-gray-500 mb-4 bg-white px-3 py-1 rounded-full w-max shadow-sm border border-gray-100">${pathSegments}</div>`;
}

export function populateCardGridSelector(container, categoryId) {
    if (!container) return;
    
    const data = appState.allThemeData[categoryId] || [];
    const stickies = appState.stickyTopics[categoryId] || [];
    const userAdded = appState.userAddedTopics[categoryId] || [];

    if (data.length === 0 && stickies.length === 0 && userAdded.length === 0) {
         if(!container.querySelector('.loader')) {
             container.innerHTML = `<div class="bg-gray-50 rounded-lg p-8 text-center border-2 border-dashed border-gray-200"><p class="themed-text-muted mb-4">No topics found.</p></div>`;
             renderAddTopicInput(container.querySelector('div'), categoryId); 
         }
         return;
    }

    const stickyTitles = new Set(stickies.map(s => s.title));
    const userAddedTitles = new Set(userAdded.map(u => u.title));

    const stickyHtml = stickies.map(item => createGridItemHtml(item, categoryId, 'sticky')).join('');
    const userAddedHtml = userAdded.map(item => createGridItemHtml(item, categoryId, 'user')).join('');
    const regularHtml = data
        .filter(item => !stickyTitles.has(item.title) && !userAddedTitles.has(item.title))
        .map(item => createGridItemHtml(item, categoryId, 'regular'))
        .join('');

    container.innerHTML = `<div class="card-grid-container grid grid-cols-2 md:grid-cols-4 gap-4">${stickyHtml}${userAddedHtml}${regularHtml}</div>`;
    
    const footerDiv = document.createElement('div');
    footerDiv.className = "mt-6 pt-4 border-t border-gray-100";
    container.appendChild(footerDiv);
    
    renderAddTopicInput(footerDiv, categoryId);
    renderGenerateMoreButton(footerDiv, categoryId);
}

function createGridItemHtml(item, categoryId, type) {
    let indicatorHtml = '';
    // Base classes for the card look
    let classes = 'grid-card-selector cursor-pointer group relative flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 hover:shadow-md';
    
    // Specific styling per type
    if (type === 'sticky') {
        classes += ' bg-amber-50 border-amber-200 hover:border-amber-400';
        indicatorHtml = `<div class="absolute top-2 right-2 text-amber-500" title="Sticky Topic"><svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L13 7.414V17a1 1 0 11-2 0V7.414L7.707 10.707a1 1 0 01-1.414-1.414l4-4z" clip-rule="evenodd" /></svg></div>`;
    } else if (type === 'user') {
        classes += ' bg-blue-50 border-blue-200 hover:border-blue-400';
        indicatorHtml = `<div class="absolute top-2 right-2 text-blue-500" title="Your Topic"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4"><path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.41-1.412A6.962 6.962 0 0010 11.5c-2.25 0-4.33.9-5.535 2.993z"></path></svg></div>`;
    } else {
        classes += ' bg-white border-gray-200 hover:border-green-400 hover:bg-green-50';
    }

    return `
        <div id="grid-selector-${item.id}" class="${classes}" data-topic-id="${item.id}" data-category-id="${categoryId}" title="${item.title}">
            ${indicatorHtml}
            <div class="icon mb-2 transform group-hover:scale-110 transition-transform duration-200">${getIconForTheme(categoryId, item.id)}</div>
            <div class="w-full text-center"><span class="text-sm font-semibold text-gray-700 leading-tight block group-hover:text-green-800">${truncateText(item.title, 40)}</span></div>
        </div>`;
}

function renderAddTopicInput(container, categoryId) {
    const div = document.createElement('div');
    div.className = "flex gap-2 mb-4";
    div.innerHTML = `
        <input type="text" id="add-topic-input-${categoryId}" placeholder="Add custom topic..." class="themed-input flex-grow px-4 py-2 rounded-lg text-sm border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent">
        <button class="btn-secondary !px-5 !py-2 whitespace-nowrap" data-container-id="${container.id}" data-category-id="${categoryId}">+ Add</button>
    `;
    container.appendChild(div);
}

function renderGenerateMoreButton(container, categoryId) {
    const div = document.createElement('div');
    div.className = "text-center";
    div.innerHTML = `
        <button class="generate-more-button text-sm font-medium text-green-700 hover:text-green-900 flex items-center justify-center gap-2 mx-auto py-2 px-4 rounded-full hover:bg-green-50 transition-colors" data-container-id="${container.id}" data-category-id="${categoryId}">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Find more topics
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
    card.className = 'card mb-8 overflow-hidden rounded-xl border border-gray-200 shadow-sm bg-white'; 
    card.id = cardId;

    const cardContent = document.createElement('div');
    // Rich Header for Imported Guide
    cardContent.className = 'flex flex-col';
    cardContent.innerHTML = `
        <div class="p-6 text-white bg-slate-700 flex justify-between items-center">
             <h2 class="text-xl font-bold flex items-center gap-3">
                <svg class="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                ${fileName}
             </h2>
             <span class="text-xs bg-slate-600 px-2 py-1 rounded text-slate-200">Imported</span>
        </div>
        <div class="p-8 prose max-w-none"></div>
    `;
    
    const renderTarget = cardContent.querySelector('.prose');
    renderAccordionFromMarkdown(markdownContent, renderTarget);
    
    card.appendChild(cardContent);
    container.prepend(card);
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
