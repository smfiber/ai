// firestore.js
import { appState, getHierarchyBasePath, APP_ID } from './config.js';
import { 
    getFirestore, collection, addDoc, getDocs, onSnapshot, 
    Timestamp, doc, setDoc, deleteDoc, updateDoc, query, getDoc 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { setupAuthUI, initializeAppContent } from './main.js'; // Circular dep handling

// --- Initialization ---
export function initializeFirebase() {
    if (!appState.firebaseConfig) {
        console.warn("Firebase config missing.");
        return;
    }
    try {
        const app = initializeApp(appState.firebaseConfig);
        appState.db = getFirestore(app);
        appState.auth = getAuth(app);

        onAuthStateChanged(appState.auth, user => {
            if (user) {
                appState.userId = user.uid;
                // Path: artifacts/everything-psychology-v1/users/{uid}/viewedItems
                const userBasePath = `artifacts/${APP_ID}/users/${appState.userId}`;
                listenForViewedItems(userBasePath);
                
                if (!appState.appIsInitialized) {
                    initializeAppContent();
                }
            } else {
                appState.userId = null;
                appState.appIsInitialized = false;
            }
            setupAuthUI(user);
        });
    } catch (error) {
        console.error("Firebase Init Error:", error);
        throw error; // Rethrow to be caught by main init
    }
}

// --- Knowledge Base Operations ---

export async function saveArticleToKB(title, markdownContent, hierarchyPath, type = 'article') {
    if (!appState.userId || !appState.db) throw new Error("Not logged in or DB not ready.");

    // Collection: artifacts/everything-psychology-v1/public/data/knowledgeBase
    const collectionName = type === 'explanatory' ? 'explanatoryArticles' : 'knowledgeBase';
    const kbRef = collection(appState.db, `${getHierarchyBasePath()}/${collectionName}`);
    
    const data = {
        title: title,
        markdownContent: markdownContent,
        hierarchyPath: hierarchyPath.map(p => p.title || p).join(' / '),
        createdAt: Timestamp.now(),
        status: 'completed',
        userId: appState.userId,
        type: type // 'article' (structured) or 'explanatory'
    };

    const docRef = await addDoc(kbRef, data);
    console.log(`Saved ${type} to KB:`, docRef.id);
    return docRef.id;
}

export async function getKnowledgeBaseContent() {
    if (!appState.db) return [];
    
    const guideRef = collection(appState.db, `${getHierarchyBasePath()}/knowledgeBase`);
    const explRef = collection(appState.db, `${getHierarchyBasePath()}/explanatoryArticles`);

    const [guides, expls] = await Promise.all([
        getDocs(query(guideRef)),
        getDocs(query(explRef))
    ]);

    const items = [];
    guides.forEach(d => items.push({ id: d.id, type: 'Structured Article', ...d.data() }));
    expls.forEach(d => items.push({ id: d.id, type: 'Explanatory Article', ...d.data() }));
    
    return items.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
}

export async function loadKbItem(id, type) {
    const collectionName = type === 'Explanatory Article' ? 'explanatoryArticles' : 'knowledgeBase';
    const docRef = doc(appState.db, `${getHierarchyBasePath()}/${collectionName}`, id);
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data() : null;
}

// --- User Interaction Tracking ---

function listenForViewedItems(userBasePath) {
    const colRef = collection(appState.db, `${userBasePath}/viewedItems`);
    onSnapshot(colRef, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
                appState.viewedItemIds.add(change.doc.id);
            }
        });
    });
}

export async function markItemAsViewed(cardTitle, topicTitle) {
    if (!appState.userId) return;
    const compositeKey = `${cardTitle} - ${topicTitle}`;
    const userBasePath = `artifacts/${APP_ID}/users/${appState.userId}`;
    const docRef = doc(appState.db, `${userBasePath}/viewedItems`, compositeKey);
    try {
        await setDoc(docRef, { viewedAt: Timestamp.now() });
    } catch (e) { console.error("Error marking viewed:", e); }
}

// --- Sticky Topics (User Favorites) ---

export function listenForStickyTopics(categoryId) {
    // Unsubscribe previous listener if exists
    if (appState.stickyTopicsUnsubscribe) appState.stickyTopicsUnsubscribe();
    
    if (!appState.userId || !categoryId) {
        appState.stickyTopics[categoryId] = [];
        return;
    }

    const path = `artifacts/${APP_ID}/users/${appState.userId}/stickyTopics/${categoryId}/topics`;
    appState.stickyTopicsUnsubscribe = onSnapshot(collection(appState.db, path), (snap) => {
        appState.stickyTopics[categoryId] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Trigger UI update event or callback (handled via main.js integration)
        const event = new CustomEvent('stickyTopicsUpdated', { detail: { categoryId } });
        document.dispatchEvent(event);
    });
}

export async function addStickyTopic(categoryId, title) {
    const path = `artifacts/${APP_ID}/users/${appState.userId}/stickyTopics/${categoryId}/topics`;
    await addDoc(collection(appState.db, path), {
        title, 
        description: `Custom topic: ${title}`,
        createdAt: Timestamp.now()
    });
}

export async function deleteStickyTopic(categoryId, docId) {
    const path = `artifacts/${APP_ID}/users/${appState.userId}/stickyTopics/${categoryId}/topics`;
    await deleteDoc(doc(appState.db, path, docId));
}

export async function updateStickyTopic(categoryId, docId, newTitle) {
    const path = `artifacts/${APP_ID}/users/${appState.userId}/stickyTopics/${categoryId}/topics`;
    await updateDoc(doc(appState.db, path, docId), { title: newTitle });
}

// --- User Added Topics (Custom Topics in Grid) ---

export function listenForUserAddedTopics(categoryId) {
    if (appState.userTopicsUnsubscribes[categoryId]) {
        appState.userTopicsUnsubscribes[categoryId]();
    }
    if (!appState.userId) return;

    const path = `artifacts/${APP_ID}/users/${appState.userId}/userTopics/${categoryId}/topics`;
    appState.userTopicsUnsubscribes[categoryId] = onSnapshot(collection(appState.db, path), (snap) => {
        appState.userAddedTopics[categoryId] = snap.docs.map(d => ({ docId: d.id, ...d.data() }));
        const event = new CustomEvent('userTopicsUpdated', { detail: { categoryId } });
        document.dispatchEvent(event);
    });
}

export async function addUserTopic(categoryId, title) {
    const path = `artifacts/${APP_ID}/users/${appState.userId}/userTopics/${categoryId}/topics`;
    await addDoc(collection(appState.db, path), {
        title,
        id: `${title.replace(/\s+/g, '-')}-${Date.now()}`,
        description: `User added: ${title}`,
        createdAt: Timestamp.now()
    });
}

// --- Hierarchy Management (Admin) ---

export async function getHierarchyData(level, parentPath = null) {
    let ref;
    if (level === 'main') {
        ref = collection(appState.db, getHierarchyBasePath(), 'topicHierarchy');
    } else if (level === 'sub') {
        ref = collection(appState.db, parentPath, 'subCategories');
    } else if (level === 'final') {
        ref = collection(appState.db, parentPath, 'finalCategories');
    }
    
    const snap = await getDocs(query(ref));
    return snap.docs.map(d => ({ id: d.id, ...d.data(), path: d.ref.path })).sort((a,b) => a.title.localeCompare(b.title));
}

export async function addHierarchyItem(level, parentPath, data) {
    let ref;
    if (level === 'main') {
        ref = collection(appState.db, getHierarchyBasePath(), 'topicHierarchy');
    } else if (level === 'sub') {
        ref = collection(appState.db, parentPath, 'subCategories');
    } else if (level === 'final') {
        ref = collection(appState.db, parentPath, 'finalCategories');
    }
    await addDoc(ref, data);
}

export async function updateHierarchyItem(path, data) {
    await updateDoc(doc(appState.db, path), data);
}

export async function deleteHierarchyItem(path) {
    await deleteDoc(doc(appState.db, path));
}
