// ui.js
import * as DB from './db.js';

// Cache DOM elements
const moduleList = document.getElementById('module-list');
const articleView = document.getElementById('article-view');
const editToggle = document.getElementById('edit-mode-toggle');

/**
 * Renders the Sidebar Curriculum Tree
 * @param {Array} modules - List of module objects from Firestore
 * @param {Function} onTopicClick - Callback when a topic is selected
 */
export function renderModules(modules, onTopicClick) {
    moduleList.innerHTML = ''; // Clear current list

    if (modules.length === 0) {
        moduleList.innerHTML = '<div class="loading-state">No modules found. Enable Manager Mode to add one.</div>';
        return;
    }

    modules.forEach(mod => {
        // 1. Create Module Container
        const modDiv = document.createElement('div');
        modDiv.className = 'module-item';
        
        // 2. Build Topic HTML Strings
        // We use data attributes to pass IDs easily
        const topicsHtml = (mod.topics || []).map(t => `
            <div class="topic-item" data-id="${t.id}" data-title="${t.title}" data-mod="${mod.title}">
                <span><i class="fa-regular fa-file-lines"></i> ${t.title}</span>
                <i class="fa-solid fa-chevron-right" style="opacity:0.3; font-size:0.8em;"></i>
            </div>
        `).join('');

        // 3. Construct the Full HTML (Header + Topics + Add New Input)
        modDiv.innerHTML = `
            <div class="module-header">
                <span>${mod.title}</span>
            </div>
            <div class="topic-list">
                ${topicsHtml}
                
                <div class="manager-only" style="margin-top: 8px; padding: 5px;">
                    <div style="display:flex; gap:5px;">
                        <input type="text" placeholder="New Topic Name" class="input-topic-add" data-mod-id="${mod.id}">
                        <button class="btn-mini btn-add-topic" data-mod-id="${mod.id}">Add</button>
                    </div>
                </div>
            </div>
        `;
        
        moduleList.appendChild(modDiv);
    });

    // 4. Attach Event Listeners (Post-Render)
    attachTopicListeners(onTopicClick);
    attachManagerListeners();
    
    // Re-apply Manager Mode visibility state
    toggleManagerView(editToggle.checked);
}

/**
 * Internal: Attach clicks to the topic items
 */
function attachTopicListeners(callback) {
    document.querySelectorAll('.topic-item').forEach(item => {
        item.addEventListener('click', () => {
            // Remove active class from others
            document.querySelectorAll('.topic-item').forEach(el => el.classList.remove('active'));
            // Add active class to clicked
            item.classList.add('active');
            
            // Trigger the main app logic
            callback(item.dataset.id, item.dataset.title, item.dataset.mod);
        });
    });
}

/**
 * Internal: Attach clicks to the "Add Topic" buttons
 */
function attachManagerListeners() {
    document.querySelectorAll('.btn-add-topic').forEach(btn => {
        btn.addEventListener('click', () => {
            const modId = btn.dataset.modId;
            const input = document.querySelector(`.input-topic-add[data-mod-id="${modId}"]`);
            
            if (input && input.value.trim() !== "") {
                DB.addTopic(modId, input.value.trim());
                input.value = ''; // Clear input
            }
        });
    });
}

/**
 * Shows/Hides the "Edit" controls based on the toggle switch
 */
export function toggleManagerView(isManager) {
    const elements = document.querySelectorAll('.manager-only');
    elements.forEach(el => {
        el.style.display = isManager ? 'block' : 'none';
    });
}

/**
 * Renders the main article content (converting Markdown to HTML)
 */
export function renderContent(markdown) {
    // "marked" is loaded via CDN in index.html
    articleView.innerHTML = marked.parse(markdown);
}

/**
 * Helper to show loading state in the main view
 */
export function showLoading(message) {
    articleView.innerHTML = `
        <div style="text-align:center; padding: 50px; color: #666;">
            <i class="fa-solid fa-circle-notch fa-spin fa-2x"></i>
            <p style="margin-top:15px;">${message}</p>
        </div>
    `;
}
