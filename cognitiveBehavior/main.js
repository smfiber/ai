import { initAuth } from './auth.js';
import * as DB from './db.js';
import * as UI from './ui.js';
import { generateCBTContent } from './gemini.js';

let GEMINI_KEY = null;
let CURRENT_USER = null;

// 1. Start Auth Flow
initAuth((user) => {
    CURRENT_USER = user;
    // Show Key Modal
    document.getElementById('key-modal').classList.remove('hidden');
});

// 2. Handle Key Entry
document.getElementById('btn-save-key').addEventListener('click', () => {
    const input = document.getElementById('input-api-key');
    if (input.value) {
        GEMINI_KEY = input.value;
        document.getElementById('key-modal').classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');
        startApp();
    }
});

// 3. Main Application Logic
function startApp() {
    // Subscribe to DB changes
    DB.subscribeToModules((modules) => {
        UI.renderModules(modules, handleTopicClick);
    });

    // Toggle Manager Mode
    document.getElementById('edit-mode-toggle').addEventListener('change', (e) => {
        UI.toggleManagerView(e.target.checked);
    });

    // Add Module Handler
    document.getElementById('btn-add-module').addEventListener('click', () => {
        const title = prompt("Name of new Module?");
        if(title) DB.addModule(title);
    });
}

// 4. Topic Click Handler (The Core Feature)
async function handleTopicClick(topicId, topicTitle, moduleTitle) {
    // Show loading state
    UI.renderContent("### Loading lesson...");

    // Check DB for existing article
    const existing = await DB.getArticle(CURRENT_USER.uid, topicId);
    
    if (existing) {
        UI.renderContent(existing.content);
    } else {
        try {
            const content = await generateCBTContent(GEMINI_KEY, topicTitle, moduleTitle);
            UI.renderContent(content);
            // Save for future use
            await DB.saveArticle(CURRENT_USER.uid, topicId, content);
        } catch (err) {
            UI.renderContent(`### Error generating content: \n ${err.message}`);
        }
    }
}
