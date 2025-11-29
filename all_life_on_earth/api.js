/*
 * API.JS
 * Final Version - "Catalog First" Architecture
 * - Search: Hits Species API first to get a clean list of animals.
 * - Hydration: Fetches 1 high-quality Human Observation photo for each result.
 */

import { configStore } from './config.js';

// --- Firebase Imports ---
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

// --- Auth & Storage ---
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

// --- Firestore: Saved Specimens ---
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

// --- Firestore: Custom Expeditions ---
const EXPEDITIONS_COLLECTION = "user_expeditions";

export async function saveUserCollection(userId, c) {
    if (!db) return;
    const d = { title: c.title, query: c.query, image: c.image, uid: userId, updated_at: Date.now() };
    if (c.id) { await setDoc(doc(db, EXPEDITIONS_COLLECTION, c.id), d, { merge: true }); return c.id; }
    else { const ref = await addDoc(collection(db, EXPEDITIONS_COLLECTION), d); return ref.id; }
}

export async function getUserCollections(userId) {
    if (!db) return [];
    const q = query(collection(db, EXPEDITIONS_COLLECTION), where("uid", "==", userId));
    const snap = await getDocs(q);
    const list = [];
    snap.forEach(d => list.push({ ...d.data(), id: d.id }));
    return list;
}

export async function deleteUserCollection(userId, id) { 
    if (db) await deleteDoc(doc(db, EXPEDITIONS_COLLECTION, id)); 
}

// --- GBIF API (The Engine) ---

function cleanScientificName(name) {
    if (!name) return "Unknown";
    const parts = name.split(' ');
    if (parts.length >= 2) {
        return `${parts[0]} ${parts[1]}`;
    }
    return name;
}

// Mappers
function mapGbifRecord(record) {
    const imageObj = record.media ? record.media.find(m => m.type === 'StillImage') : null;
    let imageUrl = imageObj ? imageObj.identifier : null;
    if (!imageUrl && imageObj && imageObj.references) imageUrl = imageObj.references;

    let displayName = record.vernacularName;
    if (!displayName) {
        displayName = cleanScientificName(record.scientificName);
    }

    return {
        slug: (record.speciesKey || record.key).toString(), 
        scientific_name: record.scientificName,
        common_name: displayName, 
        image_url: imageUrl,
        family: record.family,
        order: record.order,
        class: record.class,
        phylum: record.phylum,
        kingdom: record.kingdom
    };
}

function mapGbifSpecies(species, imageUrl) {
    return {
        slug: species.key.toString(),
        scientific_name: species.scientificName,
        common_name: species.vernacularName || cleanScientificName(species.scientificName),
        image_url: imageUrl, // Injected via Hydration
        family: species.family,
        order: species.order,
        class: species.class,
        phylum: species.phylum,
        kingdom: species.kingdom
    };
}

// Helper: Fetch 1 High-Quality Image for a Taxon Key
async function getOneImageForTaxon(key) {
    try {
        const url = `https://api.gbif.org/v1/occurrence/search?taxonKey=${key}&mediaType=StillImage&basisOfRecord=HUMAN_OBSERVATION&limit=1`;
        const res = await fetch(url);
        if(!res.ok) return null;
        const data = await res.json();
        if(data.results && data.results.length > 0) {
            const rec = data.results[0];
            const img = rec.media ? rec.media.find(m => m.type === 'StillImage') : null;
            return img ? img.identifier : null;
        }
        return null;
    } catch(e) { return null; }
}

export async function getCategorySpecimens(classKey, page) {
    // Categories act as a filter on observations directly (browsing)
    const limit = 20;
    const offset = (page - 1) * limit;
    const url = `https://api.gbif.org/v1/occurrence/search?classKey=${classKey}&kingdomKey=1&mediaType=StillImage&basisOfRecord=HUMAN_OBSERVATION&limit=${limit}&offset=${offset}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`GBIF Error: ${response.status}`);
        const data = await response.json();
        
        const seen = new Set();
        const cleanData = data.results
            .map(mapGbifRecord)
            .filter(item => {
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

// REWRITTEN: CATALOG FIRST SEARCH
export async function searchSpecimens(queryText, page) {
    const limit = 20;
    const offset = (page - 1) * limit;

    try {
        // STEP 1: Search the Catalog (Species API)
        // We look for species matching the text (e.g., "Eagle")
        const speciesUrl = `https://api.gbif.org/v1/species/search?q=${encodeURIComponent(queryText)}&rank=SPECIES&status=ACCEPTED&limit=${limit}&offset=${offset}`;
        const speciesRes = await fetch(speciesUrl);
        if (!speciesRes.ok) throw new Error(`GBIF Species Error: ${speciesRes.status}`);
        const speciesData = await speciesRes.json();

        // STEP 2: Hydrate with Photos (Parallel Requests)
        // For each species found, we fetch the best "Human Observation" photo
        const hydratedResults = await Promise.all(
            speciesData.results
                .filter(s => s.kingdom === 'Animalia') // Ensure it's an animal
                .map(async (species) => {
                    const imageUrl = await getOneImageForTaxon(species.key);
                    return mapGbifSpecies(species, imageUrl);
                })
        );

        // Filter out items that have no image (optional, but cleaner UI)
        // or keep them if you want to show the Species even without a photo.
        // Let's keep them, as the UI now handles "No Photo" gracefully.
        
        return { 
            data: hydratedResults, 
            meta: { total: speciesData.count, endOfRecords: speciesData.endOfRecords } 
        };

    } catch (error) {
        console.error("GBIF Search Error:", error);
        return { data: [], meta: {} };
    }
}

export async function getSpecimenDetails(keyOrName) {
    try {
        let key = keyOrName;

        if (isNaN(keyOrName)) {
            const fuzzyUrl = `https://api.gbif.org/v1/species/search?q=${encodeURIComponent(keyOrName)}&rank=SPECIES&status=ACCEPTED&limit=1`;
            const matchRes = await fetch(fuzzyUrl);
            
            if (!matchRes.ok) throw new Error("Match failed");
            const matchData = await matchRes.json();
            
            const bestMatch = matchData.results.find(r => r.kingdom === 'Animalia');
            if (bestMatch) {
                key = bestMatch.key;
            } else {
                throw new Error("Species not found in GBIF Backbone");
            }
        }

        // Details + High Quality Gallery
        const [detailsRes, imagesRes] = await Promise.all([
            fetch(`https://api.gbif.org/v1/species/${key}`),
            fetch(`https://api.gbif.org/v1/occurrence/search?taxonKey=${key}&mediaType=StillImage&basisOfRecord=HUMAN_OBSERVATION&limit=8`)
        ]);

        if (!detailsRes.ok) throw new Error("Specimen details not found");
        
        const data = await detailsRes.json();
        let imageData = { results: [] };
        if (imagesRes.ok) imageData = await imagesRes.json();
        
        const gallery = imageData.results
            .map(record => {
                const img = record.media ? record.media.find(m => m.type === 'StillImage') : null;
                return img ? img.identifier : null;
            })
            .filter(url => url !== null);

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
            image_url: gallery.length > 0 ? gallery[0] : null, 
            gallery_images: gallery 
        };
    } catch (error) {
        console.error("Details Error:", error);
        return null;
    }
}

// --- Gemini Functions ---

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
