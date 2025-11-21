import { auth, provider } from './config.js';
import { signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

export function initAuth(onUserLogin) {
    const loginBtn = document.getElementById('btn-login');
    
    loginBtn.addEventListener('click', async () => {
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Login failed", error);
            alert("Login failed: " + error.message);
        }
    });

    onAuthStateChanged(auth, (user) => {
        if (user) {
            document.getElementById('auth-overlay').classList.add('hidden');
            onUserLogin(user); // Trigger main app flow
        }
    });
}
