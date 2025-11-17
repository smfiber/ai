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
    
    const distributionId = 63; // Trefle Distribution ID for Florida
    const trefleUrl = `https://trefle.io/api/v1/species?filter[distribution_id]=${distributionId}&filter[growth_form]=${speciesType}&page=${page}&token=${configStore.trefleApiKey}`;
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
 * Searches native plants for Florida based on a query string.
 * @param {string} query - The user's search term (e.g., 'Oak').
 * @param {number} page - The page number to fetch.
 * @returns {Promise<object>} A promise that resolves to an object containing plant data, links, and meta.
 */
export async function searchNativePlants(query, page) {
    if (!configStore.trefleApiKey) {
        console.error("Trefle API Key is missing.");
        return { data: [], links: {}, meta: {} }; // Return a structured object
    }

    const distributionId = 63; // Trefle Distribution ID for Florida
    const trefleUrl = `https://trefle.io/api/v1/species/search?filter[distribution_id]=${distributionId}&q=${query}&page=${page}&token=${configStore.trefleApiKey}`;
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

// --- Removed generatePlantArticle function ---
