/*
 * API.JS
 * Updated:
 * 1. Separated Collections ("user_expeditions")
 * 2. Fixed Search to ensure Images (Occurrence API)
 */

import { configStore } from './config.js';

// --- Firebase Imports (Preserved) ---
let app, auth, db, storage; 
let GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut;
let collection, addDoc, deleteDoc, doc, query, where, getDocs, setDoc; 
let getStorage, ref, uploadBytes, getDownloadURL; 

export async function initFirebase() {
    if (app) return; 

    if (!configStore.firebaseConfig || !configStore.googleClientId) {
        console.error("Firebase config/Client ID missing.");
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
        console.log("Firebase Initialized.");
        return { auth, onAuthStateChanged };
    } catch (error) {
        console.error("Firebase Init Error:", error);
    }
}

// --- Auth & Storage (Preserved) ---
export async function signInWithGoogle() {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ 'client_id': configStore.googleClientId });
    try { const result = await signInWithPopup(auth, provider); return result.user; } catch (e) { console.error(e); }
}
export async function signOutUser() { if (auth) await signOut(auth); }

export async function uploadSpecimenImage(file, userId) {
    if (!storage) throw new Error("Storage not init");
    const path = `users/${userId}/specimens/${Date.now()}-${file.name}`;
    const sRef = ref(storage, path);
    const snap = await uploadBytes(sRef, file);
    return await getDownloadURL(snap.ref);
}

// --- Firestore: Saved Specimens (Preserved) ---
// This collection is already unique ("saved_specimens") so it won't conflict with "digital_gardener"
const DB_COLLECTION = "saved_specimens"; 

export async function saveSpecimen(userId, specimen, docId = null) {
    if (!db) return;
    const data = { ...specimen }; delete data.docId;
    if (docId) { await setDoc(doc(db, DB_COLLECTION, docId), { ...data, uid: userId, saved_at: Date.now() }); return docId; }
    else { const ref = await addDoc(collection(db, DB_COLLECTION), { ...data, uid: userId, saved_at: Date.now() }); return ref.id; }
}
export async function removeSpecimen(userId, slug) {
    if (!db) return;
    const q = query(collection(db, DB_COLLECTION), where("uid", "==", userId), where("slug", "==", slug));
    const snap = await getDocs(q);
    await Promise.all(snap.docs.map(d => deleteDoc(doc(db, DB_COLLECTION, d.id))));
}
export async function getSavedSpecimen(userId, slug) {
    if (!db) return { data: null, docId: null };
    const q = query(collection(db, DB_COLLECTION), where("uid", "==", userId), where("slug", "==", slug));
    const snap = await getDocs(q);
    if (!snap.empty) return { data: snap.docs[0].data(), docId: snap.docs[0].id };
    return { data: null, docId: null };
}
export async function getSavedSpecimens(userId) {
    if (!db) return [];
    const q = query(collection(db, DB_COLLECTION), where("uid", "==", userId));
    const snap = await getDocs(q);
    const list = [];
    snap.forEach(d => list.push({ ...d.data(), docId: d.id }));
    return list;
}

// --- Firestore: Custom Collections (UPDATED) ---
// Changed from "user_collections" to "user_expeditions" to prevent overlap with the Garden App

const EXPEDITIONS_COLLECTION = "user_expeditions";

export async function saveUserCollection(userId, c) {
    if (!db) return;
    const d = { title: c.title, query: c.query, image: c.image, uid: userId, updated_at: Date.now() };
    if (c.id) { await setDoc(doc(db, EXPEDITIONS_COLLECTION, c.id), d, { merge: true }); return c.id; }
    else { const ref = await addDoc(collection(db, EXPEDITIONS_COLLECTION), d); return ref.id; }
}

export async function getUserCollections(userId) {
    if (!db) return [];
    // We now query the NEW collection
    const q = query(collection(db, EXPEDITIONS_COLLECTION), where("uid", "==", userId));
    const snap = await getDocs(q);
    const list = [];
    snap.forEach(d => list.push({ ...d.data(), id: d.id }));
    return list;
}

export async function deleteUserCollection(userId, id) { 
    if (db) await deleteDoc(doc(db, EXPEDITIONS_COLLECTION, id)); 
}


// --- GBIF API (Updated) ---

function mapGbifRecord(record) {
    // Occurrence records hold images in 'media'
    const imageObj = record.media ? record.media.find(m => m.type === 'StillImage') : null;
    let imageUrl = imageObj ? imageObj.identifier : null;
    if (!imageUrl && imageObj && imageObj.references) imageUrl = imageObj.references;

    return {
        slug: (record.speciesKey || record.key).toString(), 
        scientific_name: record.scientificName,
        common_name: record.vernacularName || record.scientificName, 
        image_url: imageUrl,
        family: record.family,
        order: record.order,
        class: record.class,
        phylum: record.phylum,
        kingdom: record.kingdom
    };
}

export async function getCategorySpecimens(classKey, page) {
    const limit = 20;
    const offset = (page - 1) * limit;
    // kingdomKey=1 ensures animals
    const url = `https://api.gbif.org/v1/occurrence/search?classKey=${classKey}&kingdomKey=1&mediaType=StillImage&limit=${limit}&offset=${offset}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`GBIF Error: ${response.status}`);
        const data = await response.json();
        
        const seen = new Set();
        const cleanData = data.results
            .map(mapGbifRecord)
            .filter(item => {
                // strict filters for high quality gallery
                if (!item.image_url) return false;
                if (seen.has(item.scientific_name)) return false;
                seen.add(item.scientific_name);
                return true;
            });

        return { data: cleanData, meta: { total: data.count, endOfRecords: data.endOfRecords } };
    } catch (error) {
        console.error("GBIF Fetch Error:", error);
        return { data: [], meta: {} };
    }
}

export async function searchSpecimens(query, page) {
    const limit = 20;
    const offset = (page - 1) * limit;
    
    // UPDATED: Now using OCCURRENCE search instead of Species search.
    // This allows us to enforce "mediaType=StillImage", guaranteeing photos.
    // q={query} performs a full-text search on the records.
    const url = `https://api.gbif.org/v1/occurrence/search?q=${query}&kingdomKey=1&mediaType=StillImage&limit=${limit}&offset=${offset}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`GBIF Error: ${response.status}`);
        const data = await response.json();

        const seen = new Set();
        const cleanData = data.results
            .map(mapGbifRecord) // Use the same mapper as categories
            .filter(item => {
                if (!item.image_url) return false;
                // Deduplicate: If we get 10 records of "Panthera leo", only show the first one
                if (seen.has(item.scientific_name)) return false;
                seen.add(item.scientific_name);
                return true;
            });
        
        return { data: cleanData, meta: { total: data.count, endOfRecords: data.endOfRecords } };
    } catch (error) {
        console.error("GBIF Search Error:", error);
        return { data: [], meta: {} };
    }
}

export async function getSpecimenDetails(key) {
    try {
        // We still use Species API for details as it has better taxonomy data
        const response = await fetch(`https://api.gbif.org/v1/species/${key}`);
        if (!response.ok) throw new Error("Specimen not found");
        const data = await response.json();
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
            image_url: null // We rely on the gallery image or placeholder here
        };
    } catch (error) {
        console.error("Details Error:", error);
        return null;
    }
}

// --- Gemini Functions (Preserved) ---
function extractJson(text) {
    const s = text.indexOf('{'); const e = text.lastIndexOf('}');
    if (s === -1 || e === -1) {
        const as = text.indexOf('['); const ae = text.lastIndexOf(']');
        if (as !== -1 && ae !== -1) return JSON.parse(text.substring(as, ae + 1));
        throw new Error("No JSON found");
    }
    return JSON.parse(text.substring(s, e + 1));
}

export async function fetchAugmentedSpecimenData(specimen) {
    if (!configStore.geminiApiKey) return {}; 
    const prompt = `You are a zoologist. Animal: "${specimen.scientific_name}" (${specimen.common_name}). Provide JSON: { "common_name": "...", "diet": "...", "habitat": "...", "lifespan": "...", "conservation_status": "...", "physical_characteristics": "...", "fun_facts": ["...", "...", "..."], "predators": "...", "behavior": "..." }`;
    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${configStore.geminiApiKey}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const d = await res.json();
        return extractJson(d.candidates[0].content.parts[0].text);
    } catch (e) { return {}; }
}

export async function fetchScientificNameLookup(common) {
    if (!configStore.geminiApiKey) return null;
    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${configStore.geminiApiKey}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: `Zoologist. Scientific name for "${common}"? ONLY the name.` }] }] })
        });
        const d = await res.json();
        return d.candidates[0].content.parts[0].text.trim();
    } catch (e) { return null; }
}

export async function fetchCollectionSuggestions(query) {
    if (!configStore.geminiApiKey) return [];
    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${configStore.geminiApiKey}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: `List 30 animals related to "${query}". Sorted A-Z. JSON Array: [{"common_name": "...", "scientific_name": "..."}, ...]` }] }] })
        });
        const d = await res.json();
        return extractJson(d.candidates[0].content.parts[0].text);
    } catch (e) { return []; }
}

export async function fetchImageIdentification(url) { return null; }
export async function fetchCustomCareAdvice(s, q) {
    if (!configStore.geminiApiKey) return "Key missing";
    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${configStore.geminiApiKey}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: `Zoologist. Animal: ${s.common_name}. User asks: "${q}". Answer in 2 paragraphs.` }] }] })
        });
        const d = await res.json();
        return d.candidates[0].content.parts[0].text;
    } catch (e) { return "Error."; }
}
