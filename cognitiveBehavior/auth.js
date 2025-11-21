// auth.js
import { auth, provider } from './config.js';
import { signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

/**
 * Initializes Authentication Logic
 * @param {Function} onUserLogin - Callback function to run when user successfully logs in
 */
export function initAuth(onUserLogin) {
    const loginBtn = document.getElementById('btn-login');
    const overlay = document.getElementById('auth-overlay');
    
    // 1. Handle Login Click
    loginBtn.addEventListener('click', async () => {
        try {
            await signInWithPopup(auth, provider);
            // onAuthStateChanged will handle the UI update
        } catch (error) {
            console.error("Login Failed:", error);
            alert(`Login Error: ${error.message}`);
        }
    });

    // 2. Listen for Auth State Changes (Login, Logout, Page Refresh)
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log(`User logged in: ${user.uid}`);
            
            // Hide the full-screen overlay
            overlay.classList.add('hidden');
            
            // Trigger the main app flow (passed from main.js)
            if (onUserLogin) onUserLogin(user);
        } else {
            // Show the overlay if not logged in
            overlay.classList.remove('hidden');
        }
    });
}

/**
 * Utility to log out (can be attached to a button later)
 */
export function logoutUser() {
    signOut(auth).then(() => {
        window.location.reload(); // Reload to reset state/keys
    });
}
