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
        console.log("User signed in.");
    } catch (error) {
        console.error("Sign out error:", error);
    }
}


/**
 * Fetches native plants for Florida based on species type and page.
 * @param {string} speciesType - The Trefle growth_form (e.g., 'tree', 'shrub').
 * @param {number} page - The page number to fetch.
 * @returns {Promise<object>} A promise that resolves to an object containing plant data, links, and meta.
 */
export async function getNativePlants(speciesType, page) {
    if (!configStore.trefleApiKey) {
        console.error("Trefle API Key is missing.");
        return { data: [], links: {}, meta: {} }; // Return a structured object
    }
    
    // NOTE: This function is not currently called by app.js,
    // but we will leave it in case we want to add a category filter later.
    // The regional filter has been removed.
    const trefleUrl = `https://trefle.io/api/v1/species?filter[growth_form]=${speciesType}&page=${page}&token=${configStore.trefleApiKey}`;
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(trefleUrl)}`;

    try {
        const response = await fetch(proxyUrl); // Use the proxied URL
        if (!response.ok) {
            throw new Error(`Trefle API error (via proxy): ${response.statusText}`);
        }
        const data = await response.json();
        
        // Filter the results for a cleaner UI, but return the full object for pagination
        const filteredData = data.data.filter(plant => plant.common_name && plant.image_url);
        
        return {
            data: filteredData,
            links: data.links,
            meta: data.meta
        };
    } catch (error) {
        console.error("Error fetching native plants:", error);
        return { data: [], links: {}, meta: {} }; // Return empty structure on error
    }
}

/**
 * Searches plants based on a query string.
 * @param {string} query - The user's search term (e.g., 'Oak').
 * @param {number} page - The page number to fetch.
 * @returns {Promise<object>} A promise that resolves to an object containing plant data, links, and meta.
 */
export async function searchNativePlants(query, page) {
    if (!configStore.trefleApiKey) {
        console.error("Trefle API Key is missing.");
        return { data: [], links: {}, meta: {} }; // Return a structured object
    }

    // Removed the hard-coded distributionId = 63 to make this a global search.
    const trefleUrl = `https://trefle.io/api/v1/species/search?q=${query}&page=${page}&token=${configStore.trefleApiKey}`;
    
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(trefleUrl)}`;

    try {
        const response = await fetch(proxyUrl); // Use the proxied URL
        if (!response.ok) {
            throw new Error(`Trefle API error (via proxy): ${response.statusText}`);
        }
        const data = await response.json();
        
        // Filter the results for a cleaner UI, but return the full object for pagination
        const filteredData = data.data.filter(plant => plant.common_name && plant.image_url);
        
        return {
            data: filteredData,
            links: data.links,
            meta: data.meta
        };
    } catch (error) {
        console.error("Error searching native plants:", error);
        return { data: [], links: {}, meta: {} }; // Return empty structure on error
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

    // --- We must get /api/v1/species, NOT /api/v1/plants ---
    const trefleUrl = `https://trefle.io/api/v1/species/${plantSlug}?token=${configStore.trefleApiKey}`;
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(trefleUrl)}`;


    try {
        const response = await fetch(proxyUrl); // Use the proxied URL
        if (!response.ok) {
            throw new Error(`Trefle API error (via proxy): ${response.statusText}`);
        }
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error("Error fetching plant details:", error);
        return null;
    }
}

/**
 * Augments plant data by fetching missing fields from the Gemini API.
 * @param {object} plantData - The incomplete plant data object from Trefle.
 * @returns {Promise<object>} A promise that resolves to an object with the augmented data.
 */
export async function fetchAugmentedPlantData(plantData) {
    if (!configStore.geminiApiKey) {
        console.error("Gemini API Key is missing. Skipping augmentation.");
        return {}; // Return empty object
    }

    const scientificName = plantData.scientific_name;
    const commonName = plantData.common_name;

    // This prompt asks Gemini for a JSON object with keys that
    // match the structure of the Trefle API response.
    const prompt = `
        You are an expert botanist. A user has incomplete data for the plant: "${scientificName}" (Common Name: ${commonName}).

        Please provide the following missing details. If you do not know a value, use "N/A".
        - Family (common name, e.g., "Rose family")
        - Genus (scientific name, e.g., "Syagrus")
        - Growth Form (e.g., "Tree", "Shrub", "Herb")
        - Sunlight (e.g., "Full Sun", "Partial Shade")
        - Watering (e.g., "Low", "Medium", "High")
        - Soil Texture (e.g., "Sandy", "Loamy", "Clay")
        - Soil pH (Min/Max) (e.g., "6.0 / 7.5")
        - Bloom Months (e.g., "June, July, August")

        Respond with ONLY a valid JSON object matching this structure. Do not use markdown.
        {
          "family_common_name": "...",
          "genus_name": "...",
          "growth_form": "...",
          "sunlight": "...",
          "watering": "...",
          "soil_texture": "...",
          "ph_min_max": "...",
          "bloom_months": "..."
        }
    `;

    // --- THIS LINE IS NOW FIXED ---
    // Using the v1 endpoint and the 2.5-pro model as requested in guidelines.
    const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:generateContent?key=${configStore.geminiApiKey}`;

    const requestBody = {
        contents: [{
            parts: [{ text: prompt }]
        }],
        generationConfig: {
            response_mime_type: "application/json", // Request JSON output
            temperature: 0.2,
        }
    };

    try {
        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Extract the JSON string from Gemini's response
        const jsonText = data.candidates[0].content.parts[0].text;
        
        // Parse the JSON text into a usable object
        const augmentedData = JSON.parse(jsonText);
        
        console.log("Gemini augmentation successful:", augmentedData);
        return augmentedData;

    } catch (error)
 {
        console.error("Error augmenting plant data with Gemini:", error);
        return {}; // Return empty object on failure
    }
}
