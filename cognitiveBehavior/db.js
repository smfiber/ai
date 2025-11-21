// db.js
import { db } from './config.js';
import { 
    collection, doc, addDoc, getDoc, setDoc, updateDoc, 
    onSnapshot, arrayUnion, query, orderBy 
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// --- 1. Curriculum Management (Public/Manager) ---

/**
 * Real-time listener for the curriculum tree.
 * Automatically triggers 'callback' whenever the database changes.
 */
export function subscribeToModules(callback) {
    // Order by creation time so modules don't jump around
    const q = query(collection(db, "modules"), orderBy("createdAt"));
    
    return onSnapshot(q, (snapshot) => {
        const modules = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
        }));
        callback(modules);
    });
}

/**
 * Manager Mode: Creates a new high-level Module
 */
export async function addModule(title) {
    try {
        await addDoc(collection(db, "modules"), {
            title: title,
            createdAt: Date.now(),
            topics: [] // Initialize empty array for topics
        });
    } catch (error) {
        console.error("Error adding module:", error);
        alert("Error: You do not have permission to edit the curriculum.");
    }
}

/**
 * Manager Mode: Adds a specific Topic to a Module
 * Uses 'arrayUnion' to add to the existing list without overwriting
 */
export async function addTopic(moduleId, topicTitle) {
    const moduleRef = doc(db, "modules", moduleId);
    const newTopic = { 
        id: Date.now().toString(), // Simple unique ID
        title: topicTitle 
    };

    try {
        await updateDoc(moduleRef, { 
            topics: arrayUnion(newTopic) 
        });
    } catch (error) {
        console.error("Error adding topic:", error);
        alert("Error: Permission denied.");
    }
}

// --- 2. Article Management (Private User Data) ---

/**
 * Checks if an article already exists for this user/topic
 */
export async function getArticle(userId, topicId) {
    const ref = doc(db, `users/${userId}/articles/${topicId}`);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
}

/**
 * Saves the AI-generated content so we don't have to regenerate it later
 */
export async function saveArticle(userId, topicId, content, moduleTitle, topicTitle) {
    const ref = doc(db, `users/${userId}/articles/${topicId}`);
    await setDoc(ref, { 
        content: content,
        moduleContext: moduleTitle,
        title: topicTitle,
        savedAt: Date.now() 
    });
}
