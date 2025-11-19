/*
 * API.JS
 * This file handles all external communication:
 * - Firebase Initialization & Auth
 * - Trefle API calls
 * - Gemini API calls
 * - Firestore Database calls
 * - Firebase Storage calls (NEW)
 */

import { configStore } from './config.js';

// --- Firebase SDKs (will be dynamically imported) ---
let app, auth, db, storage; // storage added
let GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut;
// Firestore functions
let collection, addDoc, deleteDoc, doc, query, where, getDocs, setDoc; 
// Storage functions
let getStorage, ref, uploadBytes, getDownloadURL; // Storage functions added

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
        const { getFirestore, collection: col, addDoc: ad, deleteDoc: dd, doc: d, query: q, where: w, getDocs: gd, setDoc: setD } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js');
        // Dynamically import Storage modules
        const StorageModules = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js');
        
        // Assign Auth variables
        GoogleAuthProvider = GAuthProvider;
        signInWithPopup = siwp;
        onAuthStateChanged = oasc;
        signOut = so;

        // Assign Firestore variables
        collection = col;
        addDoc = ad;
        deleteDoc = dd;
        doc = d;
        query = q;
        where = w;
        getDocs = gd;
        setDoc = setD;

        // Assign Storage variables
        getStorage = StorageModules.getStorage;
        ref = StorageModules.ref;
        uploadBytes = StorageModules.uploadBytes;
        getDownloadURL = StorageModules.getDownloadURL;


        // Initialize Firebase
        app = initializeApp(configStore.firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        storage = getStorage(app); // Initialize Storage

        // Set auth persistence to session.
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

// --- Firebase Storage Functions ---

/**
 * Uploads a plant image file to Firebase Storage.
 * @param {File} file - The file object to upload.
 * @param {string} userId - The Firebase User UID.
 * @returns {Promise<string>} The public download URL for the image.
 */
export async function uploadPlantImage(file, userId) {
    if (!storage) throw new Error("Firebase Storage not initialized.");

    // Create a unique file path: users/<uid>/<timestamp>-<filename>
    const filePath = `users/${userId}/${Date.now()}-${file.name}`;
    const storageRef = ref(storage, filePath);

    try {
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        console.log("Image uploaded successfully:", downloadURL);
        return downloadURL;
    } catch (error) {
        console.error("Error uploading image:", error);
        throw error;
    }
}


// --- Firestore Database Functions ---

/**
 * Saves a plant to the user's 'digital_gardener' collection.
 * Uses setDoc to update if docId is known, or addDoc for initial save.
 * @param {string} userId - The Firebase User UID.
 * @param {object} plant - The full plant data object.
 * @param {string} [docId] - Optional ID of the existing document for updating.
 */
export async function savePlantToGarden(userId, plant, docId = null) {
    if (!db) return;
    
    // Clean up temporary docId property if it exists on the plant object
    const plantToSave = { ...plant };
    delete plantToSave.docId;

    try {
        if (docId) {
            // Update existing document
            await setDoc(doc(db, "digital_gardener", docId), {
                ...plantToSave,
                uid: userId,
                saved_at: Date.now()
            });
            console.log(`Updated ${plant.common_name} (ID: ${docId}) in garden.`);
            return docId;
        } else {
            // Initial save: create a new document
            const docRef = await addDoc(collection(db, "digital_gardener"), {
                ...plantToSave, 
                uid: userId,
                saved_at: Date.now()
            });
            console.log(`Saved ${plant.common_name} (New ID: ${docRef.id}) to garden.`);
            return docRef.id;
        }
    } catch (error) {
        console.error("Error saving plant:", error);
        throw error;
    }
}

/**
 * Removes a plant from the user's 'digital_gardener' collection.
 * @param {string} userId - The Firebase User UID.
 * @param {string} plantSlug - The slug of the plant to remove.
 */
export async function removePlantFromGarden(userId, plantSlug) {
    if (!db) return;
    try {
        // Query to find the document with matching UID and Slug
        const q = query(
            collection(db, "digital_gardener"), 
            where("uid", "==", userId),
            where("slug", "==", plantSlug)
        );
        
        const snapshot = await getDocs(q);
        
        // Delete all matching documents (should usually be one)
        const deletePromises = snapshot.docs.map(document => 
            deleteDoc(doc(db, "digital_gardener", document.id))
        );
        
        await Promise.all(deletePromises);
        console.log(`Removed ${plantSlug} from garden.`);
    } catch (error) {
        console.error("Error removing plant:", error);
        throw error;
    }
}

/**
 * Retrieves the FULL saved plant data for a specific slug.
 * Used to skip API calls if the data is already in Firestore.
 * @param {string} userId 
 * @param {string} plantSlug 
 * @returns {Promise<{plantData: object|null, docId: string|null}>} The plant data and its Firestore ID.
 */
export async function getSavedPlant(userId, plantSlug) {
    if (!db) return { plantData: null, docId: null };
    try {
        const q = query(
            collection(db, "digital_gardener"), 
            where("uid", "==", userId),
            where("slug", "==", plantSlug)
        );
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
            // Return the data AND the document ID of the first match
            const doc = snapshot.docs[0];
            return { plantData: doc.data(), docId: doc.id };
        }
        return { plantData: null, docId: null };
    } catch (error) {
        console.error("Error fetching saved plant details:", error);
        return { plantData: null, docId: null };
    }
}

/**
 * Gets all plants saved by the user.
 * @param {string} userId - The Firebase User UID.
 * @returns {Promise<Array>} An array of plant objects.
 */
export async function getGardenPlants(userId) {
    if (!db) return [];
    try {
        const q = query(
            collection(db, "digital_gardener"), 
            where("uid", "==", userId)
        );
        const snapshot = await getDocs(q);
        
        const plants = [];
        snapshot.forEach(doc => {
            // Attach the Firestore ID to the plant object for easier referencing/updating later
            plants.push({ ...doc.data(), docId: doc.id });
        });
        return plants;
    } catch (error) {
        console.error("Error fetching garden:", error);
        return [];
    }
}


// --- Trefle API Functions ---

export async function getNativePlants(speciesType, page) {
    if (!configStore.trefleApiKey) {
        console.error("Trefle API Key is missing.");
        return { data: [], links: {}, meta: {} };
    }
    
    const trefleUrl = `https://trefle.io/api/v1/species?filter[growth_form]=${speciesType}&page=${page}&token=${configStore.trefleApiKey}`;
    
    // UPDATED PROXY (CorsProxy.io)
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(trefleUrl)}`;

    try {
        const response = await fetch(proxyUrl);
        if (!response.ok) {
            throw new Error(`Trefle API error (via proxy): ${response.statusText}`);
        }
        const data = await response.json();
        const filteredData = data.data.filter(plant => plant.common_name && plant.image_url);
        
        return { data: filteredData, links: data.links, meta: data.meta };
    } catch (error) {
        console.error("Error fetching native plants:", error);
        return { data: [], links: {}, meta: {} };
    }
}

export async function searchNativePlants(query, page) {
    if (!configStore.trefleApiKey) {
        console.error("Trefle API Key is missing.");
        return { data: [], links: {}, meta: {} };
    }

    const trefleUrl = `https://trefle.io/api/v1/species/search?q=${query}&page=${page}&token=${configStore.trefleApiKey}`;
    
    // UPDATED PROXY (CorsProxy.io)
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(trefleUrl)}`;

    try {
        const response = await fetch(proxyUrl);
        if (!response.ok) {
            throw new Error(`Trefle API error (via proxy): ${response.statusText}`);
        }
        const data = await response.json();
        const filteredData = data.data.filter(plant => plant.common_name && plant.image_url);
        
        return { data: filteredData, links: data.links, meta: data.meta };
    } catch (error) {
        console.error("Error searching native plants:", error);
        return { data: [], links: {}, meta: {} };
    }
}

export async function getPlantDetails(plantSlug) {
    if (!configStore.trefleApiKey) {
        console.error("Trefle API Key is missing.");
        return null;
    }

    const trefleUrl = `https://trefle.io/api/v1/species/${plantSlug}?token=${configStore.trefleApiKey}`;
    
    // UPDATED PROXY (CorsProxy.io)
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(trefleUrl)}`;

    try {
        const response = await fetch(proxyUrl);
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

// --- Gemini API Functions ---

function extractJsonFromGeminiResponse(text) {
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    
    if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error("Could not find JSON in Gemini's response.");
    }

    const jsonText = text.substring(jsonStart, jsonEnd + 1);
    return JSON.parse(jsonText);
}

export async function fetchAugmentedPlantData(plantData) {
    if (!configStore.geminiApiKey) {
        console.error("Gemini API Key is missing. Skipping augmentation.");
        return {}; 
    }

    const scientificName = plantData.scientific_name;
    const commonName = plantData.common_name;

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
        - A detailed, multi-paragraph care plan covering light, water, and soil requirements.
        - Pests and Diseases: A list of common pests and diseases and simple preventative measures.
        - Minimum Winter Temperature: The lowest temperature (in Fahrenheit) the plant can survive.
        - Maximum Summer Temperature: The highest temperature (in Fahrenheit) the plant can tolerate.
        - Frost Sensitivity: Describe its tolerance level (e.g., "High tolerance, very hardy", "Moderate sensitivity, protect from hard frost", "Zero tolerance").

        Respond with ONLY a valid JSON object matching this structure. Do not use markdown.
        {
          "family_common_name": "...",
          "genus_name": "...",
          "growth_form": "...",
          "sunlight": "...",
          "watering": "...",
          "soil_texture": "...",
          "ph_min_max": "...",
          "bloom_months": "...",
          "care_plan": "...",
          "pests_and_diseases": "...",
          "min_winter_temp_f": "...",
          "max_summer_temp_f": "...",
          "frost_sensitivity": "..."
        }
    `;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:generateContent?key=${configStore.geminiApiKey}`;

    const requestBody = {
        contents: [{
            parts: [{ text: prompt }]
        }]
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
        const rawText = data.candidates[0].content.parts[0].text;
        const augmentedData = extractJsonFromGeminiResponse(rawText);
        
        console.log("Gemini augmentation successful:", augmentedData);
        return augmentedData;

    } catch (error) {
        console.error("Error augmenting plant data with Gemini:", error);
        return {}; 
    }
}

/**
 * Identifies a plant from an image URL using Gemini Vision.
 * @param {string} imageUrl - Public URL of the image to analyze.
 * @returns {Promise<{scientific_name: string, common_name: string}|null>} Structured identification data.
 */
export async function fetchImageIdentification(imageUrl) {
    if (!configStore.geminiApiKey) {
        console.error("Gemini API Key is missing. Skipping image identification.");
        return null;
    }

    const prompt = `
        You are an expert botanist specialized in plant identification from images.
        Identify the plant shown in the image.
        
        Provide ONLY the following information in a valid JSON object: the scientific name (Genus species) and the common name. If you cannot identify the plant, use "Unknown" for both fields. Do not use markdown.

        {
          "scientific_name": "...",
          "common_name": "..."
        }
    `;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:generateContent?key=${configStore.geminiApiKey}`;

    const requestBody = {
        contents: [
            {
                parts: [{ text: prompt }]
            },
            {
                // Image part using the public URL
                parts: [{
                    inlineData: {
                        mimeType: 'image/jpeg', // Assuming images will be stored as JPEGs or convertible
                        data: imageUrl // Gemini API can handle public URLs in this structure
                    }
                }]
            }
        ]
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
        const rawText = data.candidates[0].content.parts[0].text;
        const identifiedData = extractJsonFromGeminiResponse(rawText);
        
        console.log("Gemini identification successful:", identifiedData);
        return identifiedData;

    } catch (error) {
        console.error("Error fetching image identification with Gemini:", error);
        return null; 
    }
}


export async function fetchCustomCareAdvice(plantData, question) {
    if (!configStore.geminiApiKey) {
        console.error("Gemini API Key is missing. Skipping custom advice.");
        return "Gemini API Key is missing.";
    }

    const scientificName = plantData.scientific_name;
    const commonName = plantData.common_name;

    const prompt = `
        You are an expert botanist providing highly specific advice. 
        
        The plant in question is: ${commonName} (${scientificName}).
        
        The user has asked the following question regarding its care: "${question}"
        
        Provide a detailed, helpful, and concise answer (2-3 paragraphs max) based on your knowledge of the plant's requirements. Do not include any JSON or markdown formatting.
    `;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:generateContent?key=${configStore.geminiApiKey}`;

    const requestBody = {
        contents: [{
            parts: [{ text: prompt }]
        }]
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
        // Since we asked for plain text, just return the raw text output.
        return data.candidates[0].content.parts[0].text;

    } catch (error) {
        console.error("Error fetching custom care advice with Gemini:", error);
        return `Failed to get custom advice: ${error.message}`;
    }
}

export async function fetchScientificNameLookup(commonName) {
    if (!configStore.geminiApiKey) {
        console.error("Gemini API Key is missing. Skipping scientific name lookup.");
        return null; 
    }

    const prompt = `
        You are an expert botanist. The common name for a plant is: "${commonName}".
        
        Provide ONLY the scientific name (Genus species) for this plant. 
        Do not include any conversational text, descriptions, or markdown formatting.
    `;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:generateContent?key=${configStore.geminiApiKey}`;

    const requestBody = {
        contents: [{
            parts: [{ text: prompt }]
        }]
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
        // Return the clean, trimmed text response
        return data.candidates[0].content.parts[0].text.trim();

    } catch (error) {
        console.error("Error fetching scientific name with Gemini:", error);
        return null; 
    }
}
