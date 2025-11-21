import { db } from './config.js';
import { collection, doc, addDoc, getDoc, setDoc, onSnapshot, updateDoc, arrayUnion, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Real-time listener for the curriculum tree
export function subscribeToModules(callback) {
    const q = query(collection(db, "modules"), orderBy("createdAt"));
    return onSnapshot(q, (snapshot) => {
        const modules = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(modules);
    });
}

// Manager Mode: Add a high-level Module
export async function addModule(title) {
    await addDoc(collection(db, "modules"), {
        title: title,
        createdAt: Date.now(),
        topics: [] // Array of objects {id, title}
    });
}

// Manager Mode: Add a Topic to a Module
export async function addTopic(moduleId, topicTitle) {
    const moduleRef = doc(db, "modules", moduleId);
    const newTopic = { id: Date.now().toString(), title: topicTitle };
    await updateDoc(moduleRef, { topics: arrayUnion(newTopic) });
}

// Article Management
export async function getArticle(userId, topicId) {
    // Checks private user subcollection
    const ref = doc(db, `users/${userId}/articles/${topicId}`);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
}

export async function saveArticle(userId, topicId, content) {
    const ref = doc(db, `users/${userId}/articles/${topicId}`);
    await setDoc(ref, { content: content, savedAt: Date.now() });
}
