/*
 * API.JS
 * This file handles all external communication:
 * - Firebase Initialization & Auth
 * - GBIF API calls (The "Life Explorer" Engine)
 * - Gemini API calls (The "Zoologist" Brain)
 * - Firestore Database calls
 * - Firebase Storage calls
 */

import { configStore } from './config.js';

// --- Firebase SDKs (will be dynamically imported) ---
let app, auth, db, storage; 
let GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut;
// Firestore functions
let collection, addDoc, deleteDoc, doc, query, where, getDocs, setDoc; 
// Storage functions
let getStorage, ref, uploadBytes, getDownloadURL; 

/**
 * Dynamically imports Firebase modules and initializes the app.
 */
export async function initFirebase() {
    if (app) return; // Already initialized

    if (!configStore.firebaseConfig || !configStore.googleClientId) {
        console.error("Firebase config or Google Client ID is missing.");
        return;
    }

    try {
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js');
        const { getAuth, GoogleAuthProvider: GAuthProvider, signInWithPopup: siwp, onAuthStateChanged: oasc, setPersistence, browserSessionPersistence, signOut: so } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js');
        const { getFirestore, collection: col, addDoc: ad, deleteDoc: dd, doc: d, query: q, where: w, getDocs: gd, setDoc: setD } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js');
        const StorageModules = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js');
        
        GoogleAuthProvider = GAuthProvider;
        signInWithPopup = siwp;
        onAuthStateChanged = oasc;
        signOut = so;

        collection = col;
        addDoc = ad;
        deleteDoc = dd;
        doc = d;
        query = q;
        where = w;
        getDocs = gd;
        setDoc = setD;

        getStorage = StorageModules.getStorage;
        ref = StorageModules.ref;
        uploadBytes = StorageModules.uploadBytes;
        getDownloadURL = StorageModules.getDownloadURL;

        app = initializeApp(configStore.firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        storage = getStorage(app); 

        await setPersistence(auth, browserSessionPersistence);

        console.log("Firebase Initialized Successfully.");
        return { auth, onAuthStateChanged };

    } catch (error) {
        console.error("Error initializing Firebase:", error);
        alert("Could not initialize Firebase. Please check your config JSON.");
    }
}

// --- Auth Functions ---

export async function signInWithGoogle() {
    if (!auth || !GoogleAuthProvider) return;
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ 'client_id': configStore.googleClientId });
    try {
        const result = await signInWithPopup(auth, provider);
        return result.user;
    } catch (error) {
        console.error("Google Sign-In Error:", error);
    }
}

export async function signOutUser() {
    if (!auth) return;
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Sign out error:", error);
    }
}

// --- Firebase Storage Functions ---

export async function uploadSpecimenImage(file, userId) {
    if (!storage) throw new Error("Firebase Storage not initialized.");
    const filePath = `users/${userId}/specimens/${Date.now()}-${file.name}`;
    const storageRef = ref(storage, filePath);
    try {
        const snapshot = await uploadBytes(storageRef, file);
        return await getDownloadURL(snapshot.ref);
    } catch (error) {
        console.error("Error uploading image:", error);
        throw error;
    }
}

// --- Firestore Database Functions (Saved Specimens) ---

const DB_COLLECTION = "saved_specimens"; // NEW COLLECTION NAME

export async function saveSpecimen(userId, specimen, docId = null) {
    if (!db) return;
    const dataToSave = { ...specimen };
    delete dataToSave.docId; // Clean up before saving

    try {
        if (docId) {
            await setDoc(doc(db, DB_COLLECTION, docId), {
                ...dataToSave,
                uid: userId,
                saved_at: Date.now()
            });
            return docId;
        } else {
            const docRef = await addDoc(collection(db, DB_COLLECTION), {
                ...dataToSave, 
                uid: userId,
                saved_at: Date.now()
            });
            return docRef.id;
        }
    } catch (error) {
        console.error("Error saving specimen:", error);
        throw error;
    }
}

export async function removeSpecimen(userId, slug) {
    if (!db) return;
    try {
        // We use the scientific name or GBIF key as the "slug" equivalent
        const q = query(
            collection(db, DB_COLLECTION), 
            where("uid", "==", userId),
            where("slug", "==", slug)
        );
        const snapshot = await getDocs(q);
        const deletePromises = snapshot.docs.map(document => 
            deleteDoc(doc(db, DB_COLLECTION, document.id))
        );
        await Promise.all(deletePromises);
    } catch (error) {
        console.error("Error removing specimen:", error);
        throw error;
    }
}

export async function getSavedSpecimen(userId, slug) {
    if (!db) return { data: null, docId: null };
    try {
        const q = query(
            collection(db, DB_COLLECTION), 
            where("uid", "==", userId),
            where("slug", "==", slug)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            return { data: doc.data(), docId: doc.id };
        }
        return { data: null, docId: null };
    } catch (error) {
        console.error("Error fetching saved specimen:", error);
        return { data: null, docId: null };
    }
}

export async function getSavedSpecimens(userId) {
    if (!db) return [];
    try {
        const q = query(collection(db, DB_COLLECTION), where("uid", "==", userId));
        const snapshot = await getDocs(q);
        const specimens = [];
        snapshot.forEach(doc => {
            specimens.push({ ...doc.data(), docId: doc.id });
        });
        return specimens;
    } catch (error) {
        console.error("Error fetching library:", error);
        return [];
    }
}

// --- User Collections CRUD (Custom Lists) ---

export async function saveUserCollection(userId, collectionData) {
    if (!db) return;
    try {
        const dataToSave = {
            title: collectionData.title,
            query: collectionData.query, // Stores the Taxon Key or Search Term
            image: collectionData.image,
            uid: userId,
            updated_at: Date.now()
        };
        if (collectionData.id) {
            await setDoc(doc(db, "user_collections", collectionData.id), dataToSave, { merge: true });
            return collectionData.id;
        } else {
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
        const q = query(collection(db, "user_collections"), where("uid", "==", userId));
        const snapshot = await getDocs(q);
        const collections = [];
        snapshot.forEach(doc => collections.push({ ...doc.data(), id: doc.id }));
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
    } catch (error) {
        console.error("Error deleting collection:", error);
        throw error;
    }
}

// --- GBIF API Functions (The New Engine) ---

/**
 * Maps raw GBIF data to our app's format.
 */
function mapGbifRecord(record) {
    // GBIF images are inside the 'media' array. We find the first StillImage.
    const imageObj = record.media ? record.media.find(m => m.type === 'StillImage') : null;
    let imageUrl = imageObj ? imageObj.identifier : null;

    // Fallback: Sometimes identifier is not a direct link, check references
    if (!imageUrl && imageObj && imageObj.references) imageUrl = imageObj.references;

    return {
        // Use speciesKey if available (more specific), else usageKey (occurrence)
        slug: (record.speciesKey || record.key).toString(), 
        scientific_name: record.scientificName,
        // Vernacular name is rare in occurrence search, but common in species search.
        // We defaults to scientific, and let Gemini fix it later if needed.
        common_name: record.vernacularName || record.scientificName, 
        image_url: imageUrl,
        family: record.family,
        order: record.order,
        class: record.class,
        phylum: record.phylum,
        kingdom: record.kingdom
    };
}

/**
 * Fetches animals by Class (e.g., Mammalia) using Occurrence Search.
 * We use Occurrence search because it allows filtering by "Has Image".
 */
export async function getCategorySpecimens(classKey, page) {
    const limit = 20;
    const offset = (page - 1) * limit;
    
    // taxonKey: The Class ID (e.g., 359 for Mammals)
    // mediaType=StillImage: Only results with photos
    const url = `https://api.gbif.org/v1/occurrence/search?classKey=${classKey}&mediaType=StillImage&limit=${limit}&offset=${offset}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`GBIF API Error: ${response.statusText}`);
        const data = await response.json();
        
        // Filter out duplicates based on scientific name to keep the grid diverse
        const seen = new Set();
        const cleanData = data.results
            .map(mapGbifRecord)
            .filter(item => {
                if (!item.image_url) return false;
                if (seen.has(item.scientific_name)) return false;
                seen.add(item.scientific_name);
                return true;
            });

        return { 
            data: cleanData, 
            meta: { total: data.count, endOfRecords: data.endOfRecords } 
        };
    } catch (error) {
        console.error("Error fetching GBIF category:", error);
        return { data: [], meta: {} };
    }
}

/**
 * Text Search for Species.
 */
export async function searchSpecimens(query, page) {
    const limit = 20;
    const offset = (page - 1) * limit;
    // We search the Species backbone, not occurrences, for better text matching.
    const url = `https://api.gbif.org/v1/species/search?q=${query}&rank=SPECIES&limit=${limit}&offset=${offset}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`GBIF API Error: ${response.statusText}`);
        const data = await response.json();

        // Species API doesn't guarantee images. 
        // We map what we have, but the UI might show a placeholder.
        const cleanData = data.results.map(record => ({
            slug: record.key.toString(),
            scientific_name: record.scientificName,
            common_name: record.vernacularName || record.scientificName,
            image_url: null, // Species search often lacks images directly
            family: record.family,
            kingdom: record.kingdom
        }));

        // OPTIONAL: Fetch one occurrence image for each species found (Parallel fetch)
        // This is "expensive" but makes the UI look good. 
        // We will skip for speed, or let the user click to see details.
        
        return { 
            data: cleanData, 
            meta: { total: data.count, endOfRecords: data.endOfRecords } 
        };
    } catch (error) {
        console.error("Error searching GBIF species:", error);
        return { data: [], meta: {} };
    }
}

/**
 * Fetch details for a specific ID.
 */
export async function getSpecimenDetails(key) {
    // Try species endpoint first
    let url = `https://api.gbif.org/v1/species/${key}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Specimen not found");
        const data = await response.json();
        
        // Convert to our format
        return {
            slug: data.key.toString(),
            scientific_name: data.scientificName,
            common_name: data.vernacularName || data.scientificName,
            kingdom: data.kingdom,
            phylum: data.phylum,
            class: data.class,
            order: data.order,
            family: data.family,
            genus: data.genus,
            image_url: null // GBIF Details often lack the image, we might pass it from the grid
        };
    } catch (error) {
        console.error("Error fetching details:", error);
        return null;
    }
}

// --- Gemini API Functions (The Zoologist) ---

function extractJson(text) {
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    const arrayStart = text.indexOf('[');
    const arrayEnd = text.lastIndexOf(']');

    if (arrayStart !== -1 && arrayEnd !== -1 && (jsonStart === -1 || arrayStart < jsonStart)) {
         return JSON.parse(text.substring(arrayStart, arrayEnd + 1));
    }
    if (jsonStart === -1 || jsonEnd === -1) throw new Error("No JSON found");
    return JSON.parse(text.substring(jsonStart, jsonEnd + 1));
}

export async function fetchAugmentedSpecimenData(specimenData) {
    if (!configStore.geminiApiKey) return {}; 

    const sciName = specimenData.scientific_name;
    const comName = specimenData.common_name;

    const prompt = `
        You are an expert zoologist. The user is looking at: "${sciName}" (Common: ${comName}).
        
        Provide the following missing details. Use "N/A" if unknown.
        - Common Name (If the input common name is scientific/latin, provide the real English common name).
        - Diet (e.g., "Carnivore", "Herbivore", "Insectivore").
        - Habitat (e.g., "Rainforest", "Coral Reef").
        - Lifespan (e.g., "10-15 years").
        - Conservation Status (e.g., "Endangered", "Least Concern").
        - Physical Characteristics: A short description of size, color, and unique features.
        - Fun Facts: An array of 3 interesting facts.
        - Predators: Common natural predators.
        - Behavior: (e.g., "Nocturnal", "Social", "Solitary").
        
        Respond ONLY with a valid JSON object. No markdown.
        {
          "common_name": "...",
          "diet": "...",
          "habitat": "...",
          "lifespan": "...",
          "conservation_status": "...",
          "physical_characteristics": "...",
          "fun_facts": ["...", "...", "..."],
          "predators": "...",
          "behavior": "..."
        }
    `;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${configStore.geminiApiKey}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        return extractJson(data.candidates[0].content.parts[0].text);
    } catch (error) {
        console.error("Gemini augmentation failed:", error);
        return {}; 
    }
}

export async function fetchScientificNameLookup(commonName) {
    if (!configStore.geminiApiKey) return null;

    const prompt = `
        You are an expert zoologist. User search: "${commonName}".
        Provide ONLY the scientific name (Genus species) for this animal.
        No conversational text.
    `;
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${configStore.geminiApiKey}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        return data.candidates[0].content.parts[0].text.trim();
    } catch (error) {
        return null; 
    }
}

export async function fetchCollectionSuggestions(query) {
    if (!configStore.geminiApiKey) return [];

    const prompt = `
        You are a wildlife expert. The user is interested in: "${query}".
        Provide a list of exactly 60 distinct, interesting animal species related to this term.
        CRITICAL: The list MUST be sorted alphabetically (A-Z) by Common Name.
        Respond ONLY with a valid JSON array.
        [ { "common_name": "African Lion", "scientific_name": "Panthera leo" }, ... ]
    `;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${configStore.geminiApiKey}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        return extractJson(data.candidates[0].content.parts[0].text);
    } catch (error) {
        console.error("Gemini suggestions failed:", error);
        return [];
    }
}

export async function fetchImageIdentification(imageUrl) {
    if (!configStore.geminiApiKey) return null;

    try {
        const imageResponse = await fetch(imageUrl);
        const blob = await imageResponse.blob();
        
        const base64Data = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.readAsDataURL(blob);
        });

        const prompt = `
            You are an expert zoologist. Identify the animal in this image.
            Provide ONLY JSON: { "scientific_name": "...", "common_name": "..." }.
            If unknown, use "Unknown".
        `;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${configStore.geminiApiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    { parts: [{ text: prompt }] },
                    { parts: [{ inlineData: { mimeType: blob.type || 'image/jpeg', data: base64Data } }] }
                ]
            })
        });

        const data = await response.json();
        return extractJson(data.candidates[0].content.parts[0].text);

    } catch (error) {
        console.error("Gemini ID failed:", error);
        return null; 
    }
}

export async function fetchCustomCareAdvice(specimenData, question) {
    if (!configStore.geminiApiKey) return "API Key Missing";

    const prompt = `
        You are an expert zoologist. 
        Animal: ${specimenData.common_name} (${specimenData.scientific_name}).
        User Question: "${question}"
        Provide a detailed, accurate, and educational answer (2 paragraphs max).
    `;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${configStore.geminiApiKey}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        return "Error fetching advice.";
    }
}
