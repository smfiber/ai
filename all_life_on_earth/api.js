/*
 * API.JS
 * Final Version - "Gemini Search Engine"
 * Updated: 
 * - PROMPTS: Added 'jester' (Jokes) prompt.
 * - FOLDERS: Added parentId support for nesting.
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

export async function uploadSpecimenImage(file, userId) {
    return uploadMedia(file, userId);
}

export async function uploadMedia(file, userId) {
    if (!storage) throw new Error("Storage not init");
    
    const timestamp = Date.now();
    
    if (file.type.startsWith('video/')) {
        const videoPath = `users/${userId}/videos/${timestamp}-${file.name}`;
        const videoRef = ref(storage, videoPath);
        const snap = await uploadBytes(videoRef, file);
        const url = await getDownloadURL(snap.ref);
        return { type: 'video', url: url };
    } 
    
    const originalPath = `users/${userId}/specimens/${timestamp}-${file.name}`;
    const thumbPath = `users/${userId}/specimens/${timestamp}-${file.name}_thumb`;

    const thumbBlob = await createThumbnail(file);

    const originalRef = ref(storage, originalPath);
    const thumbRef = ref(storage, thumbPath);

    const [originalSnap, thumbSnap] = await Promise.all([
        uploadBytes(originalRef, file),
        uploadBytes(thumbRef, thumbBlob)
    ]);

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
    if (!data.gallery_images) data.gallery_images = [];
    if (!data.cards) data.cards = {}; 
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

// UPDATED: Now accepts optional parentId
export async function createFolder(userId, name, parentId = null) {
    if (!db) return;
    const payload = {
        uid: userId,
        name: name,
        created_at: Date.now()
    };
    if (parentId) payload.parentId = parentId;
    
    const ref = await addDoc(collection(db, FOLDER_COLLECTION), payload);
    return { id: ref.id, name, parentId: parentId || null };
}

export async function getUserFolders(userId) {
    if (!db) return [];
    const q = query(collection(db, FOLDER_COLLECTION), where("uid", "==", userId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function deleteUserFolder(userId, folderId) {
    if (!db) return;
    await deleteDoc(doc(db, FOLDER_COLLECTION, folderId));
    // Note: This does not recursively delete children folders or specimens inside children. 
    // It only resets specimens directly in this folder.
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

// --- GBIF API Helpers ---

function cleanScientificName(name) {
    if (!name) return "Unknown";
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0]} ${parts[1]}`;
    return name;
}

function mapGbifRecord(record) {
    let displayName = record.vernacularName;
    if (!displayName) displayName = cleanScientificName(record.scientificName);
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
    let startIdx = -1; let endIdx = -1; let mode = ''; 

    if (firstOpenBrace !== -1 && firstOpenBracket !== -1) {
        if (firstOpenBracket < firstOpenBrace) mode = 'array';
        else mode = 'object';
    } else if (firstOpenBracket !== -1) mode = 'array';
    else if (firstOpenBrace !== -1) mode = 'object';
    else throw new Error("No JSON structure found in response");

    if (mode === 'array') { startIdx = firstOpenBracket; endIdx = text.lastIndexOf(']'); } 
    else { startIdx = firstOpenBrace; endIdx = text.lastIndexOf('}'); }

    if (startIdx === -1 || endIdx === -1) throw new Error("Incomplete JSON structure");
    return JSON.parse(text.substring(startIdx, endIdx + 1));
}

// --- CORE SEARCH LOGIC ---

export async function getCategorySpecimens(classKey, page) {
    const limit = 20; const offset = (page - 1) * limit;
    const url = `https://api.gbif.org/v1/species/search?taxonKey=${classKey}&kingdomKey=1&rank=SPECIES&status=ACCEPTED&limit=${limit}&offset=${offset}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`GBIF Error: ${response.status}`);
        const data = await response.json();
        let mapped = data.results.map(mapGbifRecord);
        return { data: mapped, meta: { total: data.count, endOfRecords: data.endOfRecords } };
    } catch (error) {
        console.error("GBIF Fetch Error:", error);
        return { data: [], meta: {} };
    }
}

export async function searchSpecimens(queryText, page) {
    if (!configStore.geminiApiKey) return { data: [], meta: { total: 0, endOfRecords: true } };
    
    // UPDATED: Using gemini-1.5-flash for speed
    const prompt = `List EXACTLY 10 distinct animals that are strictly "${queryText}" or specific breeds/subspecies of "${queryText}".
    
    STRICT RULES:
    1. MATCH TYPE ONLY: 
       - If searching 'Lion', list distinct Lion populations (e.g. Asiatic Lion). DO NOT list Tigers, Leopards, or Jaguars.
       - If searching 'Horse', list Horse breeds (e.g. Arabian) or wild horses. DO NOT list Zebras, Donkeys, or Rhinos.
    2. JSON ONLY: Return a valid JSON Array.
    3. FORMAT: [{ "common_name": "...", "scientific_name": "..." }]`;

    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${configStore.geminiApiKey}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const d = await res.json();
        const text = d.candidates[0].content.parts[0].text;
        const results = extractJson(text);
        
        // HARD LIMIT ENFORCEMENT
        const limitedResults = results.slice(0, 10);
        
        const mapped = limitedResults.map(item => ({
            slug: item.scientific_name, scientific_name: item.scientific_name, common_name: item.common_name,
            image_url: null, family: "Unknown", order: "Unknown", class: "Unknown"
        }));
        
        return { data: mapped, meta: { total: mapped.length, endOfRecords: true } };
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
            if (matchData.usageKey) key = matchData.usageKey;
            else throw new Error("Species not found in GBIF");
        }
        const detailsRes = await fetch(`https://api.gbif.org/v1/species/${key}`);
        if (!detailsRes.ok) throw new Error("Specimen details not found");
        const data = await detailsRes.json();
        return {
            slug: data.key.toString(), scientific_name: data.scientificName, common_name: data.vernacularName || data.scientificName,
            kingdom: data.kingdom, phylum: data.phylum, class: data.class, order: data.order, family: data.family, genus: data.genus,
            image_url: null, gallery_images: [], cards: {} 
        };
    } catch (error) { console.error("Details Error:", error); return null; }
}

// --- UPDATED 5-CARD SYSTEM PROMPTS (SIMPLIFIED FOR GENERAL AUDIENCE) ---

const PROMPTS = {
    'field_guide': `You are a friendly Nature Guide writing a guide for a general audience (8th grade level).
    Avoid complex biological jargon. Explain things simply.
    Output a valid JSON object:
    {
        "zoologist_intro": "A fun, clear introduction (approx 100 words) describing the animal's personality and what makes it special. Use simple language.",
        "detailed_physical": "Describe what it looks like. Mention size, colors, and unique features. Avoid technical terms like 'sexual dimorphism' - just say 'females are larger'.",
        "detailed_habitat": "Where does it live? Describe its home and where travelers might see it.",
        "detailed_behavior": "How does it act? Is it social? How does it hunt or find food? How does it raise its babies?",
        "diet": "What it eats",
        "habitat": "Where it lives",
        "lifespan": "How long it lives",
        "conservation_status": "Safe or Endangered?",
        "physical_characteristics": "Short description",
        "predators": "What eats it",
        "fun_facts": ["Fun Fact 1", "Fun Fact 2", "Fun Fact 3"]
    }`,

    'historian': `You are a Cultural Storyteller. Tell us how humans have interacted with this animal throughout history.
    Write for a general audience.
    Output a valid JSON object:
    {
        "title": "Stories & Legends",
        "subtitle": "Human Connections",
        "main_text": "A fascinating story (200 words) about this animal in myths, legends, or history. How did ancient people view it? Is it a symbol of anything today?",
        "insights": ["A cool legend", "A historical event", "What its name means"],
        "data_points": {
            "Symbol Of": "e.g. Strength/Freedom",
            "First Found": "When did we find it?",
            "Legend": "Name of a myth",
            "Status": "Loved or Feared?"
        }
    }`,

    'evolutionist': `You are a Time Traveler looking at this animal's family tree.
    Explain its history simply (no 'clades' or 'taxons').
    Output a valid JSON object:
    {
        "title": "Through Time",
        "subtitle": "Ancient Ancestors",
        "main_text": "A simple story (200 words) about where this animal came from millions of years ago. Who were its great-grandparents? Did it survive the Ice Age?",
        "insights": ["A cool adaptation", "An ancient relative", "Survival skill"],
        "data_points": {
            "Appeared": "How long ago?",
            "Ancestor": "Ancient relative name",
            "Cousin": "Closest living relative",
            "Family Group": "Animal family name"
        }
    }`,

    'ecologist': `You are a Nature Guardian. Explain this animal's job in the wild.
    Use simple terms (avoid 'trophic levels' or 'biomass').
    Output a valid JSON object:
    {
        "title": "Job in Nature",
        "subtitle": "The Circle of Life",
        "main_text": "Explain why this animal is important to its home (200 words). Does it keep other animals in check? Does it help plants grow? What happens if it disappears?",
        "insights": ["Who relies on it?", "A specific threat", "Why we need it"],
        "data_points": {
            "Job Title": "e.g. Top Predator / Recycler",
            "Important Because": "Why it matters",
            "Home Type": "e.g. Forest / Ocean",
            "Numbers": "Growing or Shrinking?"
        }
    }`,

    'storyteller': `You are a Master Storyteller. Write a short, exciting scene.
    Output a valid JSON object:
    {
        "title": "A Day in the Life",
        "subtitle": "An Adventure",
        "main_text": "A vivid story (200-300 words) written from the ANIMAL'S point of view (or 'You are the...'). Make the reader feel the wind, water, or danger. Keep it exciting but easy to read.",
        "insights": ["A sensory detail", "A survival habit", "Daily routine"],
        "data_points": {
            "Mood": "e.g. Exciting / Calm",
            "Location": "Where is the story?",
            "Time": "Morning / Night",
            "Viewpoint": "Through the animal's eyes"
        }
    }`,

    'jester': `You are a Wildlife Comedian. Write 5 funny jokes or puns about this animal.
    Output a valid JSON object:
    {
        "title": "Jungle Jokes",
        "subtitle": "Wild Laughter",
        "main_text": "A short stand-up routine (100 words) about this animal's funny habits or looks. Keep it light and family-friendly.",
        "insights": ["Joke 1", "Joke 2", "Joke 3", "Joke 4", "Joke 5"],
        "data_points": {
            "Humor Style": "Puns/Dad Jokes",
            "Laugh Rating": "5/5",
            "Audience": "Everyone",
            "Topic": "Animal Life"
        }
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
            body: JSON.stringify({ contents: [{ parts: [{ text: `List 60 distinct animal species related to "${query}". Sorted A-Z. JSON Array: [{"common_name": "...", "scientific_name": "..."}, ...]` }] }] })
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
            body: JSON.stringify({ contents: [{ parts: [{ text: `You are a friendly nature guide. Animal: ${s.common_name}. Kid asks: "${q}". Answer simply in 2 paragraphs. NO italics.` }] }] })
        });
        const d = await res.json();
        return d.candidates[0].content.parts[0].text;
    } catch (e) { return "Error."; }
}
