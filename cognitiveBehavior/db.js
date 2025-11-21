import { getDb } from './config.js'; // CHANGED IMPORT
import { collection, doc, addDoc, getDoc, setDoc, updateDoc, onSnapshot, arrayUnion, query, orderBy } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// Helper to get DB safely
const db = () => getDb(); 

export function subscribeToModules(callback) {
    const q = query(collection(db(), "modules"), orderBy("createdAt")); // Note db() function call
    return onSnapshot(q, (snapshot) => {
        const modules = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(modules);
    });
}

export async function addModule(title) {
    await addDoc(collection(db(), "modules"), {
        title: title,
        createdAt: Date.now(),
        topics: [] 
    });
}

export async function addTopic(moduleId, topicTitle) {
    const moduleRef = doc(db(), "modules", moduleId);
    const newTopic = { id: Date.now().toString(), title: topicTitle };
    await updateDoc(moduleRef, { topics: arrayUnion(newTopic) });
}

export async function getArticle(userId, topicId) {
    const ref = doc(db(), `users/${userId}/articles/${topicId}`);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
}

export async function saveArticle(userId, topicId, content, moduleTitle, topicTitle) {
    const ref = doc(db(), `users/${userId}/articles/${topicId}`);
    await setDoc(ref, { 
        content: content,
        moduleContext: moduleTitle,
        title: topicTitle,
        savedAt: Date.now() 
    });
}
