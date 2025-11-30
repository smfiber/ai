/*
 * API.JS
 * This file handles all external communication:
 * - Firebase Initialization & Auth
 * - Trefle API calls (with Proxy Redundancy & Validation)
 * - Gemini API calls
 * - Firestore Database calls
 * - Firebase Storage calls
 */

import { configStore } from './config.js';

// --- Firebase SDKs (will be dynamically imported) ---
let app, auth, db, storage; 
let GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut;
// Firestore functions
let collection, addDoc, deleteDoc, doc, query, where, getDocs, setDoc, getDoc; 
// Storage functions
let getStorage, ref, uploadBytes, getDownloadURL; 

// --- Cache for Trefle Zone IDs ---
let floridaZoneId = null;

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
        const { getFirestore, collection: col, addDoc: ad, deleteDoc: dd, doc: d, query: q, where: w, getDocs: gd, setDoc: setD, getDoc: getD } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js');
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
        getDoc = getD;

        // Assign Storage variables
        getStorage = StorageModules.getStorage;
        ref = StorageModules.ref;
        uploadBytes = StorageModules.uploadBytes;
        getDownloadURL = StorageModules.getDownloadURL;


        // Initialize Firebase
        app = initializeApp(configStore.firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        storage = getStorage(app); 

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
 * Now supports distinct varieties via specificCommonName.
 * @param {string} userId 
 * @param {string} plantSlug 
 * @param {string|null} specificCommonName - If provided, looks for exact match on common name.
 * @returns {Promise<{plantData: object|null, docId: string|null}>} The plant data and its Firestore ID.
 */
export async function getSavedPlant(userId, plantSlug, specificCommonName = null) {
    if (!db) return { plantData: null, docId: null };
    try {
        // 1. Fetch ALL saved plants with this slug (e.g. all 'allium-sativum')
        const q = query(
            collection(db, "digital_gardener"), 
            where("uid", "==", userId),
            where("slug", "==", plantSlug)
        );
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
            // 2. If a specific variety name is requested (e.g., "Ajo Rojo")
            if (specificCommonName) {
                const targetName = specificCommonName.trim().toLowerCase();
                const match = snapshot.docs.find(d => {
                    const data = d.data();
                    return data.common_name && data.common_name.trim().toLowerCase() === targetName;
                });
                
                if (match) {
                     return { plantData: match.data(), docId: match.id };
                }
                // If specific name requested but not found, return null (treat as new entry)
                return { plantData: null, docId: null };
            }

            // 3. If no specific name requested, fallback to the first one found
            // (This maintains compatibility for generic lookups)
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

// --- BOOKMARKS FUNCTIONS (NEW) ---

export async function savePlantToBookmarks(userId, plant, docId = null) {
    if (!db) return;
    
    // Clean up temporary docId property
    const plantToSave = { ...plant };
    delete plantToSave.docId;

    try {
        if (docId) {
            await setDoc(doc(db, "user_bookmarks", docId), {
                ...plantToSave,
                uid: userId,
                saved_at: Date.now()
            });
            return docId;
        } else {
            const docRef = await addDoc(collection(db, "user_bookmarks"), {
                ...plantToSave, 
                uid: userId,
                saved_at: Date.now()
            });
            console.log(`Saved ${plant.common_name} to bookmarks.`);
            return docRef.id;
        }
    } catch (error) {
        console.error("Error saving bookmark:", error);
        throw error;
    }
}

export async function removePlantFromBookmarks(userId, plantSlug) {
    if (!db) return;
    try {
        const q = query(
            collection(db, "user_bookmarks"), 
            where("uid", "==", userId),
            where("slug", "==", plantSlug)
        );
        const snapshot = await getDocs(q);
        const deletePromises = snapshot.docs.map(document => 
            deleteDoc(doc(db, "user_bookmarks", document.id))
        );
        await Promise.all(deletePromises);
        console.log(`Removed ${plantSlug} from bookmarks.`);
    } catch (error) {
        console.error("Error removing bookmark:", error);
        throw error;
    }
}

export async function getBookmarkPlants(userId) {
    if (!db) return [];
    try {
        const q = query(
            collection(db, "user_bookmarks"), 
            where("uid", "==", userId)
        );
        const snapshot = await getDocs(q);
        const plants = [];
        snapshot.forEach(doc => {
            plants.push({ ...doc.data(), docId: doc.id });
        });
        return plants;
    } catch (error) {
        console.error("Error fetching bookmarks:", error);
        return [];
    }
}

export async function getSavedBookmark(userId, plantSlug, specificCommonName = null) {
    if (!db) return { plantData: null, docId: null };
    try {
        const q = query(
            collection(db, "user_bookmarks"), 
            where("uid", "==", userId),
            where("slug", "==", plantSlug)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            if (specificCommonName) {
                const targetName = specificCommonName.trim().toLowerCase();
                const match = snapshot.docs.find(d => {
                    const data = d.data();
                    return data.common_name && data.common_name.trim().toLowerCase() === targetName;
                });
                if (match) return { plantData: match.data(), docId: match.id };
                return { plantData: null, docId: null };
            }

            const doc = snapshot.docs[0];
            return { plantData: doc.data(), docId: doc.id };
        }
        return { plantData: null, docId: null };
    } catch (error) {
        console.error("Error fetching bookmark details:", error);
        return { plantData: null, docId: null };
    }
}


// --- USER COLLECTIONS FUNCTIONS (CRUD) ---

export async function saveUserCollection(userId, collectionData) {
    if (!db) return;
    try {
        const dataToSave = {
            title: collectionData.title,
            query: collectionData.query,
            image: collectionData.image,
            uid: userId,
            updated_at: Date.now()
        };

        if (collectionData.id) {
            // Update existing
            await setDoc(doc(db, "user_collections", collectionData.id), dataToSave, { merge: true });
            return collectionData.id;
        } else {
            // Create new
            const docRef = await addDoc(collection(db, "user_collections"), dataToSave);
            return docRef.id;
        }
    } catch (error) {
        console.error("Error saving collection:", error);
        throw error;
    }
}

export async function getUserCollections(userId) {
    if (!db) return [];
    try {
        const q = query(
            collection(db, "user_collections"),
            where("uid", "==", userId)
        );
        const snapshot = await getDocs(q);
        const collections = [];
        snapshot.forEach(doc => {
            collections.push({ ...doc.data(), id: doc.id });
        });
        return collections;
    } catch (error) {
        console.error("Error fetching user collections:", error);
        return [];
    }
}

export async function deleteUserCollection(userId, collectionId) {
    if (!db) return;
    try {
        await deleteDoc(doc(db, "user_collections", collectionId));
        console.log(`Deleted collection ${collectionId}`);
    } catch (error) {
        console.error("Error deleting collection:", error);
        throw error;
    }
}

// --- NEW: CALENDAR EVENT FUNCTIONS ---

export async function addCalendarEvent(userId, plantDocId, plantName, eventData) {
    if (!db) return;
    try {
        const docRef = await addDoc(collection(db, "user_calendar_events"), {
            uid: userId,
            plantId: plantDocId,
            plantName: plantName,
            eventType: eventData.type,
            date: eventData.date, 
            created_at: Date.now()
        });
        console.log(`Event added: ${docRef.id}`);
        return docRef.id;
    } catch (error) {
        console.error("Error adding event:", error);
        throw error;
    }
}

export async function getPlantEvents(userId, plantDocId) {
    if (!db) return [];
    try {
        const q = query(
            collection(db, "user_calendar_events"),
            where("uid", "==", userId),
            where("plantId", "==", plantDocId)
        );
        const snapshot = await getDocs(q);
        const events = [];
        snapshot.forEach(doc => {
            events.push({ ...doc.data(), id: doc.id });
        });
        
        // Client-side sort to avoid requiring composite indexes immediately for every user
        return events.sort((a, b) => new Date(a.date) - new Date(b.date));
    } catch (error) {
        console.error("Error fetching events:", error);
        return [];
    }
}

export async function deleteCalendarEvent(eventId) {
    if (!db) return;
    try {
        await deleteDoc(doc(db, "user_calendar_events", eventId));
        console.log(`Event deleted: ${eventId}`);
    } catch (error) {
        console.error("Error deleting event:", error);
        throw error;
    }
}


// --- NEW: AI Suggestion Caching ---

function getCacheId(userId, queryTerm) {
    // Sanitize query to be safe for ID (alphanumeric only + underscores)
    const cleanQuery = queryTerm.toLowerCase().replace(/[^a-z0-9]/g, '_');
    return `${userId}_${cleanQuery}`;
}

export async function getStoredSuggestions(userId, queryTerm) {
    if (!db) return null;
    try {
        const cacheId = getCacheId(userId, queryTerm);
        const docRef = doc(db, "ai_search_cache", cacheId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            console.log(`Cache HIT for ${queryTerm}`);
            return docSnap.data().suggestions;
        } else {
            console.log(`Cache MISS for ${queryTerm}`);
            return null;
        }
    } catch (error) {
        console.error("Error fetching suggestion cache:", error);
        return null;
    }
}

export async function saveStoredSuggestions(userId, queryTerm, suggestions) {
    if (!db) return;
    try {
        const cacheId = getCacheId(userId, queryTerm);
        await setDoc(doc(db, "ai_search_cache", cacheId), {
            uid: userId,
            query: queryTerm.toLowerCase(),
            suggestions: suggestions,
            updated_at: Date.now()
        });
        console.log(`Saved cache for ${queryTerm}`);
    } catch (error) {
        console.error("Error saving suggestion cache:", error);
    }
}


// --- Trefle API Functions (With Proxy Redundancy & Validation) ---

/**
 * Helper function to fetch data through a proxy with redundancy.
 * Tries corsproxy.io first, falls back to allorigins.win.
 * CRITICAL: Validates that the response is actually JSON before returning.
 */
async function fetchWithProxy(targetUrl) {
    // List of proxies to try in order
    const strategies = [
        (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
        (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
    ];

    let lastError = null;

    for (const strategy of strategies) {
        const proxyUrl = strategy(targetUrl);
        try {
            console.log(`Fetching via proxy: ${proxyUrl}`);
            const response = await fetch(proxyUrl);
            
            // 1. Check HTTP Status
            // Trefle returns 404 for "not found", which is valid JSON. 
            // We only consider 500+ (Server Errors) as proxy/upstream failures.
            if (response.status >= 500) {
                throw new Error(`Proxy/Server returned status ${response.status}`);
            }

            // 2. Validate JSON Content
            // We clone the response because reading the body consumes it.
            const clone = response.clone();
            try {
                const text = await clone.text();
                if (!text || text.trim() === "") {
                    throw new Error("Empty response body");
                }
                JSON.parse(text); // This is the crucial check
            } catch (jsonErr) {
                // If it's not valid JSON (e.g. HTML error page or empty), fail this strategy
                throw new Error(`Invalid JSON received: ${jsonErr.message}`);
            }
            
            // If we get here, response is safe to use
            return response;

        } catch (error) {
            console.warn(`Proxy strategy failed (${proxyUrl}):`, error);
            lastError = error;
            // Continue loop to try next strategy
        }
    }

    // If we get here, all strategies failed
    throw lastError || new Error("All proxy strategies failed.");
}


// NEW FUNCTION: Edible & Vegetable Plants (Global, not limited to Florida)
export async function getEdiblePlants(category, page) {
    if (!configStore.trefleApiKey) {
        console.error("Trefle API Key is missing.");
        return { data: [], links: {}, meta: {} };
    }

    // Fetch 50 items to buffer for filtering, then slice to 18
    let trefleUrl = `https://trefle.io/api/v1/species?page=${page}&limit=54&token=${configStore.trefleApiKey}`;

    // Append filters
    if (category === 'vegetables') {
        trefleUrl += '&filter[vegetable]=true';
    } else if (category === 'edible') {
        trefleUrl += '&filter[edible]=true';
    }
    
    try {
        const response = await fetchWithProxy(trefleUrl);
        if (!response.ok) {
            throw new Error(`Trefle API error (via proxy): ${response.statusText}`);
        }
        const data = await response.json();
        const filteredData = data.data.filter(plant => plant.common_name && plant.image_url);
        
        // Explicitly slice to 18 to fix pagination "rando" counts
        return { data: filteredData.slice(0, 18), links: data.links, meta: data.meta };
    } catch (error) {
        console.error("Error fetching edible plants:", error);
        return { data: [], links: {}, meta: {} };
    }
}

export async function getFloridaNativePlants(category, page) {
    if (!configStore.trefleApiKey) {
        console.error("Trefle API Key is missing.");
        return { data: [], links: {}, meta: {} };
    }

    // 1. Resolve Florida Zone ID if not cached
    if (!floridaZoneId) {
        console.log("Resolving Florida Zone ID...");
        const searchUrl = `https://trefle.io/api/v1/distributions/search?q=florida&token=${configStore.trefleApiKey}`;
        
        try {
            const res = await fetchWithProxy(searchUrl);
            if (!res.ok) throw new Error("Failed to search distribution zones.");
            const data = await res.json();
            
            if (data.data && data.data.length > 0) {
                floridaZoneId = data.data[0].id;
                console.log(`Florida Zone ID resolved: ${floridaZoneId}`);
            } else {
                throw new Error("Florida distribution zone not found.");
            }
        } catch (err) {
            console.error("Error resolving Zone ID:", err);
            return { data: [], links: {}, meta: {} };
        }
    }

    // 2. Build URL using the resolved ID
    // Fetch 50 to buffer
    let trefleUrl = `https://trefle.io/api/v1/distributions/${floridaZoneId}/plants?page=${page}&limit=54&token=${configStore.trefleApiKey}`;

    switch (category) {
        case 'trees':
            trefleUrl += '&filter[growth_form]=Tree';
            break;
        case 'shrubs':
            trefleUrl += '&filter[growth_form]=Shrub';
            break;
        case 'wildflowers':
            trefleUrl += '&filter[growth_form]=Forb'; 
            break;
        case 'ferns':
            trefleUrl += '&filter[growth_form]=Fern';
            break;
        case 'vines':
            trefleUrl += '&filter[growth_form]=Vine';
            break;
        default:
            break;
    }
    
    try {
        const response = await fetchWithProxy(trefleUrl);
        if (!response.ok) {
            throw new Error(`Trefle API error (via proxy): ${response.statusText}`);
        }
        const data = await response.json();
        const filteredData = data.data.filter(plant => plant.common_name && plant.image_url);
        
        // Slice to 18
        return { data: filteredData.slice(0, 18), links: data.links, meta: data.meta };
    } catch (error) {
        console.error("Error fetching Florida native plants:", error);
        return { data: [], links: {}, meta: {} };
    }
}

export async function getNativePlants(speciesType, page) {
    if (!configStore.trefleApiKey) {
        console.error("Trefle API Key is missing.");
        return { data: [], links: {}, meta: {} };
    }
    
    // Fetch 50 to buffer
    const trefleUrl = `https://trefle.io/api/v1/species?filter[growth_form]=${speciesType}&page=${page}&limit=54&token=${configStore.trefleApiKey}`;
    
    try {
        const response = await fetchWithProxy(trefleUrl);
        if (!response.ok) {
            throw new Error(`Trefle API error (via proxy): ${response.statusText}`);
        }
        const data = await response.json();
        const filteredData = data.data.filter(plant => plant.common_name && plant.image_url);
        
        // Slice to 18
        return { data: filteredData.slice(0, 18), links: data.links, meta: data.meta };
    } catch (error) {
        console.error("Error fetching native plants:", error);
        return { data: [], links: {}, meta: {} };
    }
}

export async function searchNativePlants(query, page, filters = {}) {
    if (!configStore.trefleApiKey) {
        console.error("Trefle API Key is missing.");
        return { data: [], links: {}, meta: {} };
    }

    // Fetch 50 to buffer
    let trefleUrl = `https://trefle.io/api/v1/species/search?q=${query}&page=${page}&limit=54&token=${configStore.trefleApiKey}`;
    
    // NEW: Apply optional filters
    if (filters.vegetable) {
        trefleUrl += '&filter[vegetable]=true';
    }
    if (filters.edible) {
        trefleUrl += '&filter[edible]=true';
    }

    try {
        const response = await fetchWithProxy(trefleUrl);
        if (!response.ok) {
            throw new Error(`Trefle API error (via proxy): ${response.statusText}`);
        }
        const data = await response.json();
        const filteredData = data.data.filter(plant => plant.common_name && plant.image_url);
        
        // Slice to 18
        return { data: filteredData.slice(0, 18), links: data.links, meta: data.meta };
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
    
    try {
        const response = await fetchWithProxy(trefleUrl);
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
    
    // Check for Array notation if object notation fails, or if prompt requested list
    const arrayStart = text.indexOf('[');
    const arrayEnd = text.lastIndexOf(']');

    if (arrayStart !== -1 && arrayEnd !== -1 && (jsonStart === -1 || arrayStart < jsonStart)) {
         const jsonText = text.substring(arrayStart, arrayEnd + 1);
         return JSON.parse(jsonText);
    }
    
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
        - Fun Facts & History: Elaborate on where this plant comes from, its cultural significance in those native regions, and any interesting trivia.
        - Cultivar Origin: If this is a specific variety (e.g., 'Phillips' garlic), state its historical origin (e.g., 'Phillips, Maine'). If wild/generic, use 'N/A'.
        
        - Fertilizer Recommendation: Type and frequency (e.g., "Balanced 10-10-10 monthly").
        - Pruning Season: Best time to prune (e.g., "Late Winter").
        - Propagation Methods: Common ways to reproduce (e.g., "Stem cuttings, seeds").
        - Toxicity Info: Safety for humans and pets (e.g., "Toxic to cats if ingested").
        - Is Edible: Boolean (true/false). Does this plant produce parts generally considered safe and common for human consumption?
        - Wildlife & Ecology: Describe if this plant attracts birds (e.g., for berries/seeds), pollinators (bees, butterflies), or other wildlife. Mention specific animals if possible.

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
          "frost_sensitivity": "...",
          "fun_facts": "...",
          "cultivar_origin": "...",
          "fertilizer_info": "...",
          "pruning_season": "...",
          "propagation_methods": "...",
          "toxicity_info": "...",
          "is_edible": true,
          "wildlife_attractant": "..."
        }
    `;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${configStore.geminiApiKey}`;

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

export async function fetchImageIdentification(imageUrl) {
    if (!configStore.geminiApiKey) {
        console.error("Gemini API Key is missing. Skipping image identification.");
        return null;
    }

    try {
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
            throw new Error(`Failed to fetch image from storage: ${imageResponse.statusText}`);
        }
        const blob = await imageResponse.blob();
        
        const base64Data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });

        const prompt = `
            You are an expert botanist specialized in plant identification from images.
            Identify the plant shown in the image.
            
            Provide ONLY the following information in a valid JSON object: the scientific name (Genus species) and the common name. If you cannot identify the plant, use "Unknown" for both fields. Do not use markdown.

            {
              "scientific_name": "...",
              "common_name": "..."
            }
        `;

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${configStore.geminiApiKey}`;

        const requestBody = {
            contents: [
                {
                    parts: [{ text: prompt }]
                },
                {
                    parts: [{
                        inlineData: {
                            mimeType: blob.type || 'image/jpeg', 
                            data: base64Data 
                        }
                    }]
                }
            ]
        };

        const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error("Gemini API Error Detail:", errText);
            throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
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

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${configStore.geminiApiKey}`;

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

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${configStore.geminiApiKey}`;

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
        return data.candidates[0].content.parts[0].text.trim();

    } catch (error) {
        console.error("Error fetching scientific name with Gemini:", error);
        return null; 
    }
}

// NEW FUNCTION: Collection Suggestions
export async function fetchCollectionSuggestions(query) {
    if (!configStore.geminiApiKey) {
        console.error("Gemini API Key is missing.");
        return [];
    }

    const prompt = `
        You are an expert gardener. The user is exploring a collection based on the term: "${query}".

        Please provide a **comprehensive** list of distinct, popular, or interesting varieties/species related to this term that a home gardener might want to grow. 
        
        Aim for as many as possible (up to 150) to provide a complete A-Z view.
        
        Ensure you provide specific Scientific Names (e.g., 'Solanum lycopersicum') and Common Names.
        
        CRITICAL: The list MUST be sorted alphabetically (A-Z) by the Common Name.

        Respond ONLY with a valid JSON array of objects. Do not use markdown.
        
        [
            { "common_name": "Ajo Rojo", "scientific_name": "Allium sativum" },
            { "common_name": "Beefsteak Tomato", "scientific_name": "Solanum lycopersicum" },
            ...
        ]
    `;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${configStore.geminiApiKey}`;

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
        const suggestions = extractJsonFromGeminiResponse(rawText);
        
        console.log("Gemini collection suggestions:", suggestions);
        return suggestions;

    } catch (error) {
        console.error("Error fetching collection suggestions:", error);
        return [];
    }
}
