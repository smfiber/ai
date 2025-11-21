import * as DB from './db.js';

export function renderModules(modules, onTopicClick) {
    const list = document.getElementById('module-list');
    list.innerHTML = ''; // Clear

    modules.forEach(mod => {
        const div = document.createElement('div');
        div.className = 'module-item';
        
        // Build Topic HTML
        const topicsHtml = (mod.topics || []).map(t => 
            `<div class="topic-item" data-id="${t.id}" data-title="${t.title}" data-mod="${mod.title}">${t.title}</div>`
        ).join('');

        // Module HTML (Includes Add Topic input for Manager Mode)
        div.innerHTML = `
            <div class="module-header">${mod.title}</div>
            <div class="topic-list">${topicsHtml}</div>
            <div class="manager-only" style="margin-top:5px; padding-left:15px;">
                <input type="text" placeholder="New Topic..." class="input-topic-add" data-mod-id="${mod.id}">
                <button class="btn-add-topic" data-mod-id="${mod.id}">Add</button>
            </div>
        `;
        list.appendChild(div);
    });

    // Add Event Listeners for Topic Clicks
    list.querySelectorAll('.topic-item').forEach(el => {
        el.addEventListener('click', () => onTopicClick(el.dataset.id, el.dataset.title, el.dataset.mod));
    });

    // Add Event Listeners for "Add Topic" buttons (Manager Mode)
    list.querySelectorAll('.btn-add-topic').forEach(btn => {
        btn.addEventListener('click', () => {
            const modId = btn.dataset.modId;
            const input = list.querySelector(`.input-topic-add[data-mod-id="${modId}"]`);
            if(input.value) {
                DB.addTopic(modId, input.value);
                input.value = '';
            }
        });
    });
    
    // Re-apply view mode visibility
    toggleManagerView(document.getElementById('edit-mode-toggle').checked);
}

export function toggleManagerView(isManager) {
    const elements = document.querySelectorAll('.manager-only');
    elements.forEach(el => el.style.display = isManager ? 'block' : 'none');
}

export function renderContent(markdown) {
    document.getElementById('article-container').innerHTML = marked.parse(markdown);
}
