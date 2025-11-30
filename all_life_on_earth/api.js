/*
 * API.JS
 * Final Version - "Gemini Translator"
 * - GBIF provides the raw data.
 * - Gemini sanitizes the list by converting Scientific Names to readable Common Names in batch.
 * - No image fetching from APIs (User uploads manually).
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

function mapGbifRecord(record) {
    // We initially set common_name to vernacularName or scientificName.
    // This will likely be overwritten by Gemini later.
    let displayName = record.vernacularName;
    if (!displayName) {
        displayName = cleanScientificName(record.scientificName);
    }

    return {
        slug: (record.key || record.usageKey).toString(), 
        scientific_name: record.scientificName,
        common_name: displayName, 
        image_url: null, 
        family: record.family,
        order: record.order,
        class: record.class,
        phylum: record.phylum,
        kingdom: record.kingdom
    };
}

// --- NEW: Gemini Batch Augmentation ---
async function augmentListWithGemini(records) {
    if (!configStore.geminiApiKey || records.length === 0) return records;

    // Create a list of names to send
    const namesList = records.map(r => r.scientific_name);
    
    // Construct Prompt
    const prompt = `
    You are a translator for a biology database.
    I will provide a list of Scientific Names.
    Your job is to provide the most common, recognizable English Common Name for each.
    
    Rules:
    1. If it is a specific animal (e.g. Canis lupus), return "Gray Wolf".
    2. If it is obscure (e.g. Vilpianus spec), return the Family or Order common name (e.g. "Spider Wasp" or "Beetle").
    3. Return ONLY a valid JSON object mapping the Scientific Name to the Common Name.
    4. Format: { "Scientific Name": "Common Name", ... }
    
    List:
    ${JSON.stringify(namesList)}
    `;

    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${configStore.geminiApiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const d = await res.json();
        const responseText = d.candidates[0].content.parts[0].text;
        const mapping = extractJson(responseText);

        // Apply the mapping back to the records
        return records.map(record => {
            if (mapping[record.scientific_name]) {
                return { ...record, common_name: mapping[record.scientific_name] };
            }
            return record;
        });

    } catch (error) {
        console.error("Gemini Augmentation Failed:", error);
        return records; // Fallback to original list
    }
}

export async function getCategorySpecimens(classKey, page) {
    const limit = 20; // Reduced limit to ensure Gemini processes quickly
    const offset = (page - 1) * limit;
    const url = `https://api.gbif.org/v1/species/search?classKey=${classKey}&rank=SPECIES&status=ACCEPTED&limit=${limit}&offset=${offset}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`GBIF Error: ${response.status}`);
        const data = await response.json();
        
        let mapped = data.results.map(mapGbifRecord);

        // AUGMENT WITH GEMINI
        mapped = await augmentListWithGemini(mapped);

        return { 
            data: mapped, 
            meta: { total: data.count, endOfRecords: data.endOfRecords } 
        };
    } catch (error) {
        console.error("GBIF Fetch Error:", error);
        return { data: [], meta: {} };
    }
}

export async function searchSpecimens(queryText, page) {
    const limit = 20; // Reduced limit for Gemini speed
    const offset = (page - 1) * limit;
    
    try {
        let smartMatchResult = null;

        // Step A: Best Match
        if (page === 1) {
            const matchUrl = `https://api.gbif.org/v1/species/match?name=${encodeURIComponent(queryText)}&kingdom=Animalia`;
            const matchRes = await fetch(matchUrl);
            if (matchRes.ok) {
                const matchData = await matchRes.json();
                if (matchData.usageKey && matchData.matchType !== 'NONE' && (matchData.rank === 'SPECIES' || matchData.rank === 'SUBSPECIES')) {
                    smartMatchResult = mapGbifRecord(matchData);
                }
            }
        }

        // Step B: Broad Search
        const searchUrl = `https://api.gbif.org/v1/species/search?q=${encodeURIComponent(queryText)}&rank=SPECIES&highertaxonKey=1&status=ACCEPTED&limit=${limit}&offset=${offset}`;
        const response = await fetch(searchUrl);
        if (!response.ok) throw new Error(`GBIF Error: ${response.status}`);
        const data = await response.json();

        let mapped = data.results.map(mapGbifRecord);

        if (smartMatchResult) {
            mapped = mapped.filter(item => item.slug !== smartMatchResult.slug);
            mapped.unshift(smartMatchResult);
        }

        // AUGMENT WITH GEMINI
        // This will fix "Vilpianus spec" -> "Spider Wasp"
        mapped = await augmentListWithGemini(mapped);
        
        return { 
            data: mapped, 
            meta: { total: data.count, endOfRecords: data.endOfRecords } 
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
            const matchUrl = `https://api.gbif.org/v1/species/match?name=${encodeURIComponent(keyOrName)}&kingdom=Animalia`;
            const matchRes = await fetch(matchUrl);
            if (!matchRes.ok) throw new Error("Match failed");
            const matchData = await matchRes.json();
            
            if (matchData.usageKey) {
                key = matchData.usageKey;
            } else {
                throw new Error("Species not found");
            }
        }

        const detailsRes = await fetch(`https://api.gbif.org/v1/species/${key}`);
        if (!detailsRes.ok) throw new Error("Specimen details not found");
        
        const data = await detailsRes.json();

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
            image_url: null, 
            gallery_images: [] 
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
