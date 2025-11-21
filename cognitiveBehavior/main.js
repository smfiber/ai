// main.js
import { initAuth } from './auth.js';
import * as DB from './db.js';
import * as UI from './ui.js';
import { generateCBTContent } from './gemini.js';

// Global State
let GEMINI_KEY = null;
let CURRENT_USER = null;

// --- 1. Initialization Flow ---

// Start Authentication Listener
initAuth((user) => {
    CURRENT_USER = user;
    // Once logged in, show the API Key Modal
    document.getElementById('key-modal').classList.remove('hidden');
});

// Handle API Key Submission
document.getElementById('btn-save-key').addEventListener('click', () => {
    const input = document.getElementById('input-api-key');
    if (input.value.trim()) {
        GEMINI_KEY = input.value.trim();
        
        // Hide Modal, Show App
        document.getElementById('key-modal').classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');
        
        // Start the Core App Logic
        startApp();
    } else {
        alert("Please enter a valid API Key.");
    }
});

// --- 2. Core Application Logic ---

function startApp() {
    console.log("App Started. Listening for DB changes...");

    // A. Subscribe to Curriculum Updates (Real-time)
    DB.subscribeToModules((modules) => {
        UI.renderModules(modules, handleTopicSelection);
    });

    // B. Setup Manager Mode Toggles
    document.getElementById('edit-mode-toggle').addEventListener('change', (e) => {
        UI.toggleManagerView(e.target.checked);
    });

    // C. Setup "New Module" Button (Manager Only)
    document.getElementById('btn-add-module').addEventListener('click', () => {
        const title = prompt("Enter name for new Module:");
        if (title) {
            DB.addModule(title);
        }
    });
}

/**
 * Handles what happens when a user clicks a Topic in the sidebar
 */
async function handleTopicSelection(topicId, topicTitle, moduleTitle) {
    // 1. Show Loading State
    UI.showLoading(`Loading lesson: ${topicTitle}...`);

    try {
        // 2. Check Firestore: Do we already have this article?
        const existingArticle = await DB.getArticle(CURRENT_USER.uid, topicId);

        if (existingArticle) {
            console.log("Found cached article in Firestore.");
            UI.renderContent(existingArticle.content);
        } else {
            console.log("No local article. generating via Gemini...");
            UI.showLoading(`Gemini is writing your lesson on "${topicTitle}"...`);

            // 3. Generate via API
            const content = await generateCBTContent(GEMINI_KEY, topicTitle, moduleTitle);

            // 4. Render immediately
            UI.renderContent(content);

            // 5. Save to Firestore (Background)
            await DB.saveArticle(CURRENT_USER.uid, topicId, content, moduleTitle, topicTitle);
        }

    } catch (error) {
        console.error("Error loading content:", error);
        UI.renderContent(`
            ### Error Loading Content
            Something went wrong. Please check your API Key and connection.
            
            **Error details:** ${error.message}
        `);
    }
}
