import { initializeFirebase } from './config.js';
import { initAuth } from './auth.js';
import * as DB from './db.js';
import * as UI from './ui.js';
import { generateCBTContent } from './gemini.js';

// State
let GEMINI_KEY = null;
let CURRENT_USER = null;

// DOM Elements
const setupModal = document.getElementById('setup-modal');
const appContainer = document.getElementById('app-container');
const inputGemini = document.getElementById('input-gemini-key');
const inputFirebase = document.getElementById('input-firebase-json');
const btnSaveConfig = document.getElementById('btn-save-config');
const errorMsg = document.getElementById('config-error');

// --- 1. Bootstrap Application ---

function checkConfigAndStart() {
    const storedGemini = localStorage.getItem('cbt_gemini_key');
    const storedFirebase = localStorage.getItem('cbt_firebase_config');

    if (storedGemini && storedFirebase) {
        // Attempt to Start
        try {
            initializeFirebase(storedFirebase);
            GEMINI_KEY = storedGemini;
            setupModal.classList.add('hidden');
            appContainer.classList.remove('hidden');
            startMainApp();
        } catch (e) {
            console.error("Saved config is invalid", e);
            localStorage.clear(); // Clear bad config
            setupModal.classList.remove('hidden');
        }
    } else {
        // Show Setup Modal
        setupModal.classList.remove('hidden');
    }
}

// Handle "Save and Continue"
btnSaveConfig.addEventListener('click', () => {
    const geminiKey = inputGemini.value.trim();
    const firebaseJson = inputFirebase.value.trim();

    if (!geminiKey || !firebaseJson) {
        showError("Please fill in both fields.");
        return;
    }

    try {
        // 1. Try to Init Firebase (validates JSON)
        initializeFirebase(firebaseJson);
        
        // 2. If success, save to LocalStorage
        localStorage.setItem('cbt_gemini_key', geminiKey);
        localStorage.setItem('cbt_firebase_config', firebaseJson);
        GEMINI_KEY = geminiKey;

        // 3. Transition UI
        setupModal.classList.add('hidden');
        appContainer.classList.remove('hidden');
        startMainApp();

    } catch (err) {
        showError(err.message);
    }
});

function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.classList.remove('hidden');
}

// --- 2. Main App Logic (Only runs after config is set) ---

function startMainApp() {
    // Initialize Auth Listener
    initAuth((user) => {
        CURRENT_USER = user;
    });

    // Initialize Database Listener
    DB.subscribeToModules((modules) => {
        UI.renderModules(modules, handleTopicSelection);
    });

    // Setup Manager Mode UI
    document.getElementById('edit-mode-toggle').addEventListener('change', (e) => {
        UI.toggleManagerView(e.target.checked);
    });
    
    // New Module Button
    document.getElementById('btn-add-module').addEventListener('click', () => {
        const title = prompt("Enter name for new Module:");
        if (title) DB.addModule(title);
    });

    // Reset Config Button
    document.getElementById('btn-clear-config').addEventListener('click', () => {
        if(confirm("Clear all saved keys and reset?")) {
            localStorage.clear();
            location.reload();
        }
    });
}

async function handleTopicSelection(topicId, topicTitle, moduleTitle) {
    // ... Same logic as before ...
    UI.showLoading(`Loading: ${topicTitle}...`);
    try {
        const existingArticle = await DB.getArticle(CURRENT_USER.uid, topicId);
        if (existingArticle) {
            UI.renderContent(existingArticle.content);
        } else {
            const content = await generateCBTContent(GEMINI_KEY, topicTitle, moduleTitle);
            UI.renderContent(content);
            await DB.saveArticle(CURRENT_USER.uid, topicId, content, moduleTitle, topicTitle);
        }
    } catch (error) {
        UI.renderContent(`### Error: ${error.message}`);
    }
}

// Start Boot Sequence
checkConfigAndStart();
