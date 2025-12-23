import { configStore } from './config.js';

let app, auth, db; 
let GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, setPersistence, browserSessionPersistence;
let collection, addDoc, doc, query, where, getDocs, setDoc, orderBy, limit, updateDoc; 

export async function initFirebase() {
    if (app) return; 

    try {
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js');
        
        // ADDED: setPersistence and browserSessionPersistence
        const { getAuth, GoogleAuthProvider: GAP, signInWithPopup: SIWP, signOut: SO, onAuthStateChanged: OASC, setPersistence: SP, browserSessionPersistence: BSP } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js');
        
        const { getFirestore, collection: COL, addDoc: AD, doc: DOC, query: Q, where: W, getDocs: GD, setDoc: SD, orderBy: OB, limit: L, updateDoc: UD } = await import('https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js');

        GoogleAuthProvider = GAP; signInWithPopup = SIWP; signOut = SO; onAuthStateChanged = OASC;
        setPersistence = SP; browserSessionPersistence = BSP;
        
        collection = COL; addDoc = AD; doc = DOC; query = Q; where = W; getDocs = GD; setDoc = SD; orderBy = OB; limit = L; updateDoc = UD;

        app = initializeApp(configStore.firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);

        // ADDED: This ensures the browser allows the session to exist
        await setPersistence(auth, browserSessionPersistence);
        
        return { auth, onAuthStateChanged };
    } catch (error) {
        console.error("Firebase Init Error:", error);
        throw error;
    }
}

export async function signInWithGoogle() {
    try {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ 'client_id': configStore.googleClientId });
        const result = await signInWithPopup(auth, provider);
        return result.user;
    } catch (error) {
        console.error("Sign In Error:", error);
        alert(`Authentication Error: ${error.message}`);
    }
}

export async function signOutUser() { await signOut(auth); }

// --- PLAYERS ---
const PLAYERS_COL = "wwf_players";

export async function getPlayers() {
    if (!db) return [];
    const q = query(collection(db, PLAYERS_COL), orderBy("name"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addPlayer(name) {
    if (!db) return;
    await addDoc(collection(db, PLAYERS_COL), {
        name: name,
        active: true,
        created_at: Date.now()
    });
}

export async function togglePlayerStatus(id, isActive) {
    if (!db) return;
    await updateDoc(doc(db, PLAYERS_COL, id), { active: isActive });
}

// --- WEEKS ---
const WEEKS_COL = "wwf_weeks";

export async function getWeeks() {
    if (!db) return [];
    const q = query(collection(db, WEEKS_COL), orderBy("startDate", "desc"), limit(20));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function createNewWeek(dateStr, playerList) {
    if (!db) return;
    
    const weekData = {};
    playerList.forEach(p => {
        if(p.active) {
            weekData[p.id] = {
                name: p.name,
                boosts: 0,
                score: 0
            };
        }
    });

    const payload = {
        startDate: dateStr,
        created_at: Date.now(),
        data: weekData
    };

    await addDoc(collection(db, WEEKS_COL), payload);
}

export async function updateWeekData(weekId, playerId, field, value) {
    if (!db) return;
    const key = `data.${playerId}.${field}`;
    await updateDoc(doc(db, WEEKS_COL, weekId), {
        [key]: value
    });
}
