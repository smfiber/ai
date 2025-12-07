// ui.js
import { appState, DEFAULT_THEME_PROMPT } from './config.js';
import { callColorGenAPI } from './api.js';
import { markItemAsViewed } from './firestore.js';

// --- Global UI Init ---
export function initializeUI() {
    marked.setOptions({
        renderer: new marked.Renderer(),
        highlight: (code, lang) => code,
        langPrefix: 'language-',
        gfm: true,
        breaks: true,
    });
    
    // Set default font settings if not in CSS
    const root = document.documentElement;
    if (!root.style.getPropertyValue('--font-family')) {
        root.style.setProperty('--font-family', "'Inter', sans-serif");
    }
}

// --- Modal Management ---

export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if(modal) {
        document.body.classList.add('modal-open');
        modal.classList.add('is-open');
    }
}

export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if(modal) {
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

export async function generateAndApplyDefaultTheme() {
    const loader = document.getElementById('header-loader');
    if(loader) {
        loader.classList.remove('hidden');
        loader.classList.add('flex');
    }
    
    try {
        const colors = await callColorGenAPI(DEFAULT_THEME_PROMPT);
        applyTheme(colors);
    } catch (error) {
        console.error("Theme Gen Error:", error);
    } finally {
        if(loader) loader.classList.add('hidden');
    }
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

export function renderAccordionFromMarkdown(markdownText, containerElement) {
    containerElement.innerHTML = '';
    if (!markdownText || !markdownText.trim()) {
        containerElement.innerHTML = convertMarkdownToHtml(null);
        return;
    }

    // Convert raw markdown to HTML structure
    const fullHtml = convertMarkdownToHtml(markdownText);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = fullHtml;

    const nodes = Array.from(tempDiv.childNodes);
    let currentAccordionItem = null;
    let introContent = document.createElement('div');
    introContent.className = 'accordion-intro mb-4 prose max-w-none';
    let firstHeaderFound = false;

    // Logic to group content under H3/H4 headers into accordion folds
    nodes.forEach(node => {
        const isHeader = node.tagName === 'H3' || node.tagName === 'H4';
        
        if (!firstHeaderFound && !isHeader) {
            introContent.appendChild(node.cloneNode(true));
            return;
        }

        if (isHeader) {
            firstHeaderFound = true;
            // Append any pending intro content
            if (introContent.hasChildNodes()) {
                containerElement.appendChild(introContent);
                introContent = document.createElement('div'); 
                introContent.className = 'accordion-intro mb-4 prose max-w-none';
            }
            
            // Create new accordion item
            currentAccordionItem = document.createElement('div');
            currentAccordionItem.className = 'accordion-item';
            const title = node.textContent;
            
            currentAccordionItem.innerHTML = `
                <button type="button" class="accordion-header">
                    <span class="text-left">${title}</span>
                    <svg class="icon w-5 h-5 transition-transform shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                <div class="accordion-content prose max-w-none"></div>`;
            
            containerElement.appendChild(currentAccordionItem);
        } else if (currentAccordionItem) {
            currentAccordionItem.querySelector('.accordion-content').appendChild(node.cloneNode(true));
        }
    });

    if (!firstHeaderFound && introContent.hasChildNodes()) {
         containerElement.appendChild(introContent);
    } else if (introContent.hasChildNodes()) {
        containerElement.appendChild(introContent);
    }

    // Open first item by default
    const firstItem = containerElement.querySelector('.accordion-item');
    if (firstItem) {
        const header = firstItem.querySelector('.accordion-header');
        header.classList.add('active');
        header.querySelector('.icon').style.transform = 'rotate(180deg)';
        firstItem.querySelector('.accordion-content').classList.add('open');
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
    } else {
        // Check viewed status
        // We need the parent card title to check viewed status accurately based on composite key logic
        // This is a slight limitation of the modular split, we'll check viewed status via JS logic after render or pass it in.
        // For simplicity, we'll render without and let the logic in main.js apply the class, OR we check appState here:
        // Note: Checking appState.viewedItemIds requires constructing the key: "CategoryTitle - TopicTitle".
        // Accessing the CategoryTitle here is hard without passing it down. 
        // Strategy: We will check logic in main.js to update viewed status classes on render or interaction.
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
