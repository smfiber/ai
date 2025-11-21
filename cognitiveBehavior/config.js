// config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

// Holds the instances after initialization
let appInstance = null;
let dbInstance = null;
let authInstance = null;
let providerInstance = null;

/**
 * Takes the JSON string from the textarea, parses it, and initializes Firebase.
 */
export function initializeFirebase(configJson) {
    try {
        // 1. Parse the JSON string
        const firebaseConfig = JSON.parse(configJson);

        // 2. Initialize
        appInstance = initializeApp(firebaseConfig);
        dbInstance = getFirestore(appInstance);
        authInstance = getAuth(appInstance);
        providerInstance = new GoogleAuthProvider();

        console.log("Firebase Initialized Successfully");
        return true;
    } catch (error) {
        console.error("Firebase Init Error:", error);
        throw new Error("Invalid JSON Config or Firebase Error: " + error.message);
    }
}

// Getters to access the instances safely
export const getDb = () => {
    if (!dbInstance) throw new Error("Database not initialized. Set config first.");
    return dbInstance;
};

export const getAuthInstance = () => {
    if (!authInstance) throw new Error("Auth not initialized. Set config first.");
    return authInstance;
};

export const getProvider = () => providerInstance;
