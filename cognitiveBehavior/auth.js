import { getAuthInstance, getProvider } from './config.js'; // CHANGED IMPORT
import { signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

export function initAuth(onUserLogin) {
    const loginBtn = document.getElementById('btn-google-login');
    const authSection = document.getElementById('auth-section');
    const articleView = document.getElementById('article-view');
    
    // Initialize auth instance dynamically
    const auth = getAuthInstance(); 

    loginBtn.addEventListener('click', async () => {
        try {
            await signInWithPopup(auth, getProvider());
        } catch (error) {
            alert(`Login Error: ${error.message}`);
        }
    });

    onAuthStateChanged(auth, (user) => {
        if (user) {
            authSection.classList.add('hidden'); // Hide login button
            articleView.classList.remove('hidden'); // Show content
            if (onUserLogin) onUserLogin(user);
        } else {
            authSection.classList.remove('hidden');
            articleView.classList.add('hidden');
        }
    });
}
