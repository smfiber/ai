/*
 * CONFIG.JS
 * This file does NOT store keys.
 * It provides an in-memory object `configStore` to hold the keys 
 * for the duration of the user's session.
 * These keys are LOST on page refresh and must be re-entered.
 */

// 1. Create an in-memory store.
export const configStore = {
    geminiApiKey: null,
    googleClientId: null,
    firebaseConfig: null
};

// 2. Create a function to populate the store.
/**
 * Saves the provided API keys and config to the in-memory configStore.
 * @param {object} keys - An object containing the API keys.
 * @param {string} keys.gemini
 * @param {string} keys.googleClientId
 * @param {object} keys.firebase
 */
export function setApiKeys({ gemini, googleClientId, firebase }) {
    if (!gemini || !googleClientId || !firebase) {
        console.error("setApiKeys: One or more keys are missing.", { gemini, googleClientId, firebase });
        throw new Error("Missing API keys. All fields are required.");
    }
    
    configStore.geminiApiKey = gemini;
    configStore.googleClientId = googleClientId;
    configStore.firebaseConfig = firebase;

    console.log("Config store populated (keys are not shown for security).");
}
