/*
 * API.JS
 * This file handles all external communication:
 * - Firebase Initialization & Auth
 * - Trefle API calls
 * - Gemini API calls
 */

import { configStore } from './config.js';

// --- Firebase SDKs (will be dynamically imported) ---
let app, auth, db;
let GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut;

/**
 * Dynamically imports Firebase modules and initializes the app.
 * This is called by app.js *after* the config is provided.
 */
export async function initFirebase() {
    if (app) return; // Already initialized

    if (!configStore.firebaseConfig || !configStore.googleClientId) {
        console.error("Firebase config or Google Client ID is missing.");
        return;
    }

    try {
        // Dynamically import the Firebase modules
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js');
        const { getAuth, GoogleAuthProvider: GAuthProvider, signInWithPopup: siwp, onAuthStateChanged: oasc, setPersistence, browserSessionPersistence, signOut: so } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js');
        const { getFirestore } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js');

        // Assign to module-level variables
        GoogleAuthProvider = GAuthProvider;
        signInWithPopup = siwp;
        onAuthStateChanged = oasc;
        signOut = so;

        // Initialize Firebase
        app = initializeApp(configStore.firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);

        // Set auth persistence to session. This respects the "no local storage" rule.
        // User stays logged in for the session (tab) but is logged out when tab is closed.
        await setPersistence(auth, browserSessionPersistence);

        console.log("Firebase Initialized Successfully.");
        
        // Pass auth to the app to set up the listener
        return { auth, onAuthStateChanged };

    } catch (error) {
        console.error("Error initializing Firebase:", error);
        alert("Could not initialize Firebase. Please check your config JSON.");
    }
}

/**
 * Initiates the Google Sign-In popup flow.
 */
export async function signInWithGoogle() {
    if (!auth || !GoogleAuthProvider) {
        console.error("Firebase Auth not initialized.");
        return;
    }

    const provider = new GoogleAuthProvider();
    // Specify the Client ID from the config
    provider.setCustomParameters({
      'client_id': configStore.googleClientId
    });

    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        console.log("User signed in:", user.displayName);
        return user;
    } catch (error) {
        console.error("Google Sign-In Error:", error);
    }
}

/**
 * Signs the current user out.
 */
export async function signOutUser() {
    if (!auth) return;
    try {
        await signOut(auth);
        console.log("User signed out.");
    } catch (error) {
        console.error("Sign out error:", error);
    }
}


/**
 * Fetches native plants for a specific Trefle distribution zone (slug).
 * @param {string} regionSlug - The Trefle slug for the region (e.g., 'fla').
 * @returns {Promise<Array>} A promise that resolves to an array of plant objects.
 */
export async function getNativePlants(regionSlug) {
    if (!configStore.trefleApiKey) {
        console.error("Trefle API Key is missing.");
        return [];
    }

    // Note: Trefle API can be slow.
    const url = `https://trefle.io/api/v1/distributions/${regionSlug}/plants?filter[establishment]=native&token=${configStore.trefleApiKey}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Trefle API error: ${response.statusText}`);
        }
        const data = await response.json();
        // Filter out plants with no common name or image for a cleaner UI
        return data.data.filter(plant => plant.common_name && plant.image_url);
    } catch (error) {
        console.error("Error fetching native plants:", error);
        return [];
    }
}

/**
 * Fetches detailed information for a single plant by its slug.
 * @param {string} plantSlug - The Trefle slug for the plant (e.g., 'serenoa-repens').
 * @returns {Promise<object>} A promise that resolves to the detailed plant object.
 */
export async function getPlantDetails(plantSlug) {
    if (!configStore.trefleApiKey) {
        console.error("Trefle API Key is missing.");
        return null;
    }

    const url = `https://trefle.io/api/v1/plants/${plantSlug}?token=${configStore.trefleApiKey}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Trefle API error: ${response.statusText}`);
        }
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error("Error fetching plant details:", error);
        return null;
    }
}

/**
 * Generates a plant care article using the Gemini API.
 * @param {object} plantData - The detailed plant object from Trefle.
 * @param {string} regionName - The common name of the region (e.g., 'Florida').
 * @returns {Promise<string>} A promise that resolves to the generated article text (Markdown/HTML).
 */
export async function generatePlantArticle(plantData, regionName) {
    if (!configStore.geminiApiKey) {
        console.error("Gemini API Key is missing.");
        return "Error: Gemini API key not configured.";
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${configStore.geminiApiKey}`;

    // Helper function to safely extract nested data
    const get = (obj, path, defaultValue = 'N/A') => {
        const result = path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined) ? acc[key] : undefined, obj);
        return result !== undefined ? result : defaultValue;
    };

    // Construct a detailed prompt
    const prompt = `
        You are an expert, friendly gardener writing for a "Digital Gardener's Almanac."
        Your tone is encouraging, wise, and helpful.
        Write a comprehensive 'How to Grow' guide for the plant specified below.
        This plant is native to ${regionName}, so please emphasize its benefits as a native plant (low maintenance, good for local wildlife, etc.).
        
        Use the following structured data to ensure your article is factually correct.
        Weave this data naturally into engaging paragraphs. DO NOT just list the data.
        Generate the response in HTML format.

        **Plant Data:**
        * **Common Name:** ${get(plantData, 'common_name')}
        * **Scientific Name:** ${get(plantData, 'scientific_name')}
        * **Primary Image URL:** ${get(plantData, 'image_url')}
        * **Sunlight Needs:** ${get(plantData, 'growth.sunlight', 'See description')}
        * **Watering Needs:** ${get(plantData, 'growth.watering', 'See description')}
        * **Soil Needs:** ${get(plantData, 'growth.soil_texture', 'See description')}
        * **Min. pH:** ${get(plantData, 'growth.ph_minimum', 'N/A')}
        * **Max. pH:** ${get(plantData, 'growth.ph_maximum', 'N/A')}
        * **Bloom Months:** ${get(plantData, 'growth.bloom_months', []).join(', ') || 'N/A'}
        * **Family:** ${get(plantData, 'family_common_name', get(plantData, 'family'))}

        **Article Structure:**
        1.  **Main Image:** Start with the <img> tag using the 'Primary Image URL' from the data.
        2.  **Introduction:** A beautiful intro to the ${get(plantData, 'common_name')}.
        3.  **A True Native:** Explain why this is a great low-maintenance choice for a ${regionName} garden.
        4.  **Planting & Care:** A section combining sunlight, soil, and watering needs.
        5.  **Seasonal Beauty:** Describe its appearance, especially during its bloom months.
        6.  **A final, encouraging tip.**
    `;

    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            // Requesting HTML output
            responseMimeType: "text/html",
        }
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Gemini API error: ${response.status} ${errorBody}`);
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates.length > 0) {
            // Check for HTML part
            const htmlPart = data.candidates[0].content.parts.find(part => part.html);
            if (htmlPart) {
                return htmlPart.html;
            }
            // Fallback to text part
            const textPart = data.candidates[0].content.parts.find(part => part.text);
            if (textPart) {
                return textPart.text; // Will be raw text, but better than nothing
            }
        }
        
        // Handle cases where generation might be blocked
        if (data.candidates && data.candidates.length > 0 && data.candidates[0].finishReason) {
             console.warn("Gemini generation finished with reason:", data.candidates[0].finishReason);
             if(data.candidates[0].finishReason === "SAFETY") {
                 return "<p>The generated content was blocked for safety reasons. Please try a different plant.</p>";
             }
        }

        return "<p>Sorry, could not generate the article. The model returned an empty response.</p>";

    } catch (error) {
        console.error("Error generating article:", error);
        return `<p><strong>Error:</strong> Could not generate the article. ${error.message}</p>`;
    }
}
