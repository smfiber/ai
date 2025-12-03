/*
 * API.JS
 * Final Version - "Gemini Search Engine"
 * Updated: 
 * - Added Video Support to uploadMedia
 * - Added 5-Card Perspective System (Prompts & Logic)
 * - Full Code (No Truncation)
 */

import { configStore } from './config.js';

// --- Firebase Imports ---
let app, auth, db, storage; 
let GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut;
let collection, addDoc, deleteDoc, doc, query, where, getDocs, setDoc, writeBatch; 
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
        const { getFirestore, collection: col, addDoc: ad, deleteDoc: dd, doc: d, query: q, where: w, getDocs: gd, setDoc: setD, writeBatch: wb } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js');
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
        writeBatch = wb;
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

/**
 * Helper to resize image client-side before upload.
 * Max Width: 600px, Quality: 0.7 JPEG
 */
function createThumbnail(file, maxWidth = 600, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    resolve(blob);
                }, 'image/jpeg', quality);
            };
            img.onerror = (e) => reject(e);
        };
        reader.onerror = (e) => reject(e);
    });
}

// Renamed to generic "uploadMedia" but kept old name export for compatibility
export async function uploadSpecimenImage(file, userId) {
    return uploadMedia(file, userId);
}

export async function uploadMedia(file, userId) {
    if (!storage) throw new Error("Storage not init");
    
    const timestamp = Date.now();
    
    // Check if Video
    if (file.type.startsWith('video/')) {
        const videoPath = `users/${userId}/videos/${timestamp}-${file.name}`;
        const videoRef = ref(storage, videoPath);
        const snap = await uploadBytes(videoRef, file);
        const url = await getDownloadURL(snap.ref);
        return { type: 'video', url: url };
    } 
    
    // Assume Image
    const originalPath = `users/${userId}/specimens/${timestamp}-${file.name}`;
    const thumbPath = `users/${userId}/specimens/${timestamp}-${file.name}_thumb`;

    // Create Thumbnail Blob
    const thumbBlob = await createThumbnail(file);

    // Create Refs
    const originalRef = ref(storage, originalPath);
    const thumbRef = ref(storage, thumbPath);

    // Upload Both (Parallel)
    const [originalSnap, thumbSnap] = await Promise.all([
        uploadBytes(originalRef, file),
        uploadBytes(thumbRef, thumbBlob)
    ]);

    // Get URLs
    const [originalUrl, thumbUrl] = await Promise.all([
        getDownloadURL(originalSnap.ref),
        getDownloadURL(thumbSnap.ref)
    ]);

    return { type: 'image', original: originalUrl, thumb: thumbUrl };
}

// --- Firestore: Saved Specimens ---
const DB_COLLECTION = "saved_specimens"; 

export async function saveSpecimen(userId, specimen, docId = null) {
    if (!db) return;
    const data = { ...specimen }; delete data.docId;
    
    // Ensure data structures exist
    if (!data.gallery_images) data.gallery_images = [];
    if (!data.cards) data.cards = {}; // Ensure cards map exists
    
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

// --- Firestore: Folders ---
const FOLDER_COLLECTION = "user_folders";

export async function createFolder(userId, name) {
    if (!db) return;
    const ref = await addDoc(collection(db, FOLDER_COLLECTION), {
        uid: userId,
        name: name,
        created_at: Date.now()
    });
    return { id: ref.id, name };
}

export async function getUserFolders(userId) {
    if (!db) return [];
    const q = query(collection(db, FOLDER_COLLECTION), where("uid", "==", userId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function deleteUserFolder(userId, folderId) {
    if (!db) return;
    
    // 1. Delete the folder doc
    await deleteDoc(doc(db, FOLDER_COLLECTION, folderId));

    // 2. Orphan the specimens (Batch update) - prevent data loss
    const q = query(collection(db, DB_COLLECTION), where("uid", "==", userId), where("folderId", "==", folderId));
    const snap = await getDocs(q);
    
    if (!snap.empty) {
        const batch = writeBatch(db);
        snap.docs.forEach(d => {
            batch.update(doc(db, DB_COLLECTION, d.id), { folderId: null });
        });
        await batch.commit();
    }
}

export async function moveSpecimenToFolder(userId, specimenId, folderId) {
    if (!db) return;
    // folderId can be null to "remove" from folder
    await setDoc(doc(db, DB_COLLECTION, specimenId), { folderId: folderId }, { merge: true });
}

// --- Firestore: Custom Field Guides (Expeditions) ---
const EXPEDITIONS_COLLECTION = "user_expeditions";

export async function saveUserCollection(userId, c) {
    if (!db) return;
    
    const d = { updated_at: Date.now(), uid: userId };
    
    if (c.title !== undefined) d.title = c.title;
    if (c.query !== undefined) d.query = c.query;
    if (c.image !== undefined) d.image = c.image;
    if (c.results !== undefined) d.results = c.results; 

    if (c.id) { 
        await setDoc(doc(db, EXPEDITIONS_COLLECTION, c.id), d, { merge: true }); 
        return c.id; 
    } else { 
        const ref = await addDoc(collection(db, EXPEDITIONS_COLLECTION), d); 
        return ref.id; 
    }
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

// --- GBIF API Helpers ---

function cleanScientificName(name) {
    if (!name) return "Unknown";
    const parts = name.split(' ');
    if (parts.length >= 2) {
        return `${parts[0]} ${parts[1]}`;
    }
    return name;
}

function mapGbifRecord(record) {
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

// --- Gemini Functions ---

function extractJson(text) {
    const firstOpenBrace = text.indexOf('{');
    const firstOpenBracket = text.indexOf('[');

    let startIdx = -1;
    let endIdx = -1;
    let mode = ''; 

    if (firstOpenBrace !== -1 && firstOpenBracket !== -1) {
        if (firstOpenBracket < firstOpenBrace) {
            mode = 'array';
        } else {
            mode = 'object';
        }
    } else if (firstOpenBracket !== -1) {
        mode = 'array';
    } else if (firstOpenBrace !== -1) {
        mode = 'object';
    } else {
        throw new Error("No JSON structure found in response");
    }

    if (mode === 'array') {
        startIdx = firstOpenBracket;
        endIdx = text.lastIndexOf(']');
    } else {
        startIdx = firstOpenBrace;
        endIdx = text.lastIndexOf('}');
    }

    if (startIdx === -1 || endIdx === -1) throw new Error("Incomplete JSON structure");
    
    return JSON.parse(text.substring(startIdx, endIdx + 1));
}

// --- CORE SEARCH LOGIC ---

export async function getCategorySpecimens(classKey, page) {
    const limit = 20;
    const offset = (page - 1) * limit;
    
    const url = `https://api.gbif.org/v1/species/search?taxonKey=${classKey}&kingdomKey=1&rank=SPECIES&status=ACCEPTED&limit=${limit}&offset=${offset}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`GBIF Error: ${response.status}`);
        const data = await response.json();
        
        let mapped = data.results.map(mapGbifRecord);

        // We could augment here, but skipping for category view speed
        // mapped = await augmentListWithGemini(mapped);

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
    if (!configStore.geminiApiKey) {
        return { data: [], meta: { total: 0, endOfRecords: true } };
    }

    if (page > 1) {
        return { data: [], meta: { total: 20, endOfRecords: true } };
    }

    const prompt = `
    List 20 distinct animal species related to "${queryText}".
    
    Rules:
    1. Return ONLY animals (mammals, birds, reptiles, amphibians, fish, insects). NO plants or fungi.
    2. Provide the "common_name" and "scientific_name".
    3. Return a valid JSON Array.
    
    Format:
    [
      { "common_name": "Gray Wolf", "scientific_name": "Canis lupus" },
      ...
    ]
    `;

    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${configStore.geminiApiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });

        const d = await res.json();
        const text = d.candidates[0].content.parts[0].text;
        const results = extractJson(text);

        const mapped = results.map(item => ({
            slug: item.scientific_name, 
            scientific_name: item.scientific_name,
            common_name: item.common_name,
            image_url: null, 
            family: "Unknown",
            order: "Unknown", 
            class: "Unknown"
        }));

        return { 
            data: mapped, 
            meta: { total: results.length, endOfRecords: true } 
        };

    } catch (error) {
        console.error("Gemini Search Error:", error);
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
                throw new Error("Species not found in GBIF");
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
            gallery_images: [],
            cards: {} 
        };
    } catch (error) {
        console.error("Details Error:", error);
        return null;
    }
}

// --- NEW 5-CARD SYSTEM PROMPTS ---

const PROMPTS = {
    'field_guide': `You are an expert Zoologist writing a comprehensive field guide.
    Output a valid JSON object with the following structure (no markdown formatting, NO ITALICS):
    {
        "zoologist_intro": "A robust, detailed introduction (approx 100 words) describing the species, its significance, and general nature.",
        "detailed_physical": "A comprehensive paragraph describing size, coloration, sexual dimorphism, and unique adaptations.",
        "detailed_habitat": "A comprehensive paragraph describing geographic range, preferred terrain, and migration patterns.",
        "detailed_behavior": "A comprehensive paragraph describing hunting/foraging strategies, social structure, mating rituals, and parenting.",
        "diet": "Concise summary",
        "habitat": "Concise summary",
        "lifespan": "Concise summary",
        "conservation_status": "Concise status",
        "physical_characteristics": "Concise summary",
        "predators": "Concise list",
        "fun_facts": ["Fact 1", "Fact 2", "Fact 3"]
    }`,

    'historian': `You are a Cultural Historian. Analyze the relationship between humans and this animal.
    Output a valid JSON object:
    {
        "title": "The Historian's View",
        "main_text": "A rich narrative about folklore, mythology, indigenous names, and historical uses/interactions involving this animal.",
        "insights": ["Myth/Legend 1", "Historical Fact 2", "Etymology Detail"],
        "data_points": { "Symbolism": "...", "First Described": "...", "Region of Myth": "..." }
    }`,

    'evolutionist': `You are an Evolutionary Biologist. Analyze the lineage of this animal.
    Output a valid JSON object:
    {
        "title": "Evolutionary Origins",
        "main_text": "Deep dive into its fossil ancestors, cladistics, when it evolved, and its closest living genetic relatives.",
        "insights": ["Adaptation 1 (Why it has feature X)", "Evolutionary Milestone"],
        "data_points": { "Era": "...", "Ancestor": "...", "Closest Relative": "..." }
    }`,

    'ecologist': `You are a Systems Ecologist. Analyze the environmental role of this animal.
    Output a valid JSON object:
    {
        "title": "Ecological Impact",
        "main_text": "Analyze its trophic level, its role as a keystone species (if applicable), specific conservation threats (poaching vs habitat), and what happens if it vanishes.",
        "insights": ["Food Web Role", "Specific Threat Detail"],
        "data_points": { "Trophic Level": "...", "Keystone Status": "...", "Population Trend": "..." }
    }`,

    'storyteller': `You are a Master Storyteller. Write a short, immersive narrative.
    Output a valid JSON object:
    {
        "title": "A Day in the Life",
        "main_text": "A vivid, sensory-rich story (200-300 words) written from the PERSPECTIVE of the animal (or 2nd person 'You are the...'). Focus on hunting, fleeing, or raising young.",
        "insights": ["Sensory Detail 1", "Behavioral Insight"],
        "data_points": { "Mood": "...", "Setting": "...", "Time of Day": "..." }
    }`
};

// --- Gemini Augmented Data ---

export async function fetchSpecimenCard(specimen, cardType = 'field_guide') {
    if (!configStore.geminiApiKey) return null;
    
    const promptTemplate = PROMPTS[cardType] || PROMPTS['field_guide'];
    const fullPrompt = `${promptTemplate}\n\nSubject: "${specimen.scientific_name}" (${specimen.common_name}).\nRules: JSON only. No markdown.`;

    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${configStore.geminiApiKey}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: fullPrompt }] }] })
        });
        const d = await res.json();
        return extractJson(d.candidates[0].content.parts[0].text);
    } catch (e) { 
        console.error("Gemini Card Error:", e);
        return null; 
    }
}

// Backward compatibility wrapper for old calls
export async function fetchAugmentedSpecimenData(specimen) {
    return fetchSpecimenCard(specimen, 'field_guide');
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
            body: JSON.stringify({ contents: [{ parts: [{ text: `Zoologist. Animal: ${s.common_name}. User asks: "${q}". Answer in 2 paragraphs. NO italics.` }] }] })
        });
        const d = await res.json();
        return d.candidates[0].content.parts[0].text;
    } catch (e) { return "Error."; }
}
