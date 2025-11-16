/*
 * APP.JS
 * This file handles all the DOM manipulation and user interaction.
 * It connects the UI (index.html) to the logic (api.js).
 */

import { setApiKeys } from './config.js';
import { 
    initFirebase, 
    signInWithGoogle, 
    signOutUser,
    getNativePlants,
    getPlantDetails,
    generatePlantArticle
} from './api.js';

// --- Global DOM Element Variables ---
let modalBackdrop, apiKeyForm, appContainer, mainContent, authContainer,
    signInBtn, signOutBtn, userInfo, userName, userPhoto, regionSelect,
    plantGalleryContainer, plantGallery, loader, articleView, 
    articleContent, articleLoader, backToGalleryBtn;

/**
 * Main function to initialize the application
 */
function main() {
    // 1. Wait for the DOM to be fully loaded
    document.addEventListener('DOMContentLoaded', () => {
        
        // 2. Assign all DOM elements
        modalBackdrop = document.getElementById('api-key-modal-backdrop');
        apiKeyForm = document.getElementById('api-key-form');
        appContainer = document.getElementById('app-container');
        mainContent = document.getElementById('main-content');
        
        authContainer = document.getElementById('auth-container');
        signInBtn = document.getElementById('google-signin-btn');
        signOutBtn = document.getElementById('google-signout-btn');
        userInfo = document.getElementById('user-info');
        userName = document.getElementById('user-name');
        userPhoto = document.getElementById('user-photo');

        regionSelect = document.getElementById('region-select');
        plantGalleryContainer = document.getElementById('plant-gallery-container');
        plantGallery = document.getElementById('plant-gallery');
        loader = document.getElementById('loader');

        articleView = document.getElementById('article-view');
        articleContent = document.getElementById('article-content');
        articleLoader = document.getElementById('article-loader');
        backToGalleryBtn = document.getElementById('back-to-gallery-btn');
        
        // 3. Add all event listeners
        addEventListeners();

        // 4. App is ready (but modal is still showing)
        console.log("App ready. Waiting for API keys.");
    });
}

/**
 * Groups all event listeners for clean initialization
 */
function addEventListeners() {
    // Listen for API key modal submission
    apiKeyForm.addEventListener('submit', handleApiKeySubmit);

    // Listen for Google Sign-in button click
    signInBtn.addEventListener('click', handleGoogleSignIn);
    
    // Listen for Google Sign-out button click
    signOutBtn.addEventListener('click', handleGoogleSignOut);

    // Listen for region selection change
    regionSelect.addEventListener('change', handleRegionSelect);

    // Listen for clicks on the plant gallery (event delegation)
    plantGallery.addEventListener('click', handlePlantCardClick);

    // Listen for "Back" button click from article
    backToGalleryBtn.addEventListener('click', showGalleryView);
}

/**
 * Handles the submission of the API key modal.
 * @param {Event} e - The form submit event
 */
async function handleApiKeySubmit(e) {
    e.preventDefault();
    const submitButton = document.getElementById('api-key-submit');
    submitButton.disabled = true;
    submitButton.textContent = 'Initializing...';

    try {
        const formData = new FormData(apiKeyForm);
        const trefle = formData.get('trefle-key');
        const gemini = formData.get('gemini-key');
        const googleClientId = formData.get('google-client-id');
        const firebaseConfigString = formData.get('firebase-config');

        // Validate and parse the Firebase config
        let firebase;
        try {
            firebase = JSON.parse(firebaseConfigString);
            if (typeof firebase !== 'object' || !firebase.apiKey) {
                throw new Error("Invalid JSON format or missing 'apiKey'.");
            }
        } catch (parseError) {
            alert(`Error parsing Firebase Config: ${parseError.message}\nPlease paste the valid JSON object from your Firebase project settings.`);
            submitButton.disabled = false;
            submitButton.textContent = 'Save and Continue';
            return;
        }

        // Save keys to in-memory configStore
        setApiKeys({ trefle, gemini, googleClientId, firebase });

        // Initialize Firebase with the new config
        const authModule = await initFirebase();

        // Set up the auth state listener
        if (authModule && authModule.auth) {
            authModule.onAuthStateChanged(authModule.auth, (user) => {
                updateAuthState(user);
            });
        } else {
            throw new Error("Firebase auth module not loaded.");
        }

        // Hide modal and show the app
        modalBackdrop.classList.add('hidden');
        console.log("API keys set and Firebase initialized. App is live.");

    } catch (error) {
        console.error("Error during API key submission:", error);
        alert(`Failed to initialize: ${error.message}`);
        submitButton.disabled = false;
        submitButton.textContent = 'Save and Continue';
    }
}

/**
 * Handles the Google Sign-In process.
 */
async function handleGoogleSignIn() {
    try {
        await signInWithGoogle();
        // The onAuthStateChanged listener will handle the UI update
    } catch (error) {
        console.error("Sign-in failed:", error);
    }
}

/**
 * Handles the Google Sign-Out process.
 */
async function handleGoogleSignOut() {
    try {
        await signOutUser();
        // The onAuthStateChanged listener will handle the UI update
    } catch (error) {
        console.error("Sign-out failed:", error);
    }
}

/**
 * Updates the UI based on the user's authentication state.
 * @param {object | null} user - The Firebase user object, or null
 */
function updateAuthState(user) {
    if (user) {
        // User is signed in
        signInBtn.classList.add('hidden');
        userInfo.classList.remove('hidden');
        userInfo.classList.add('flex');
        userName.textContent = user.displayName;
        userPhoto.src = user.photoURL;
    } else {
        // User is signed out
        signInBtn.classList.remove('hidden');
        userInfo.classList.add('hidden');
        userInfo.classList.remove('flex');
        userName.textContent = '';
        userPhoto.src = '';
    }
}

/**
 * Handles the selection of a new region from the dropdown.
 */
async function handleRegionSelect(e) {
    const regionSlug = e.target.value;
    if (!regionSlug) {
        plantGallery.innerHTML = ''; // Clear gallery if they select "--"
        return;
    }

    console.log(`Region selected: ${regionSlug}`);
    loader.classList.remove('hidden');
    plantGallery.innerHTML = '';
    articleView.classList.add('hidden');
    plantGalleryContainer.classList.remove('hidden');

    try {
        const plants = await getNativePlants(regionSlug);
        console.log(`Found ${plants.length} native plants.`);
        renderPlantGallery(plants);
    } catch (error) {
        console.error(error);
        plantGallery.innerHTML = '<p class="text-red-400">Could not load plants. Check console for errors.</p>';
    } finally {
        loader.classList.add('hidden');
    }
}

/**
 * Renders the plant cards in the gallery.
 * @param {Array} plants - An array of plant objects from Trefle.
 */
function renderPlantGallery(plants) {
    plantGallery.innerHTML = ''; // Clear previous results
    if (plants.length === 0) {
        plantGallery.innerHTML = '<p class="text-gray-400">No native plants found for this region with images.</p>';
        return;
    }

    plants.forEach(plant => {
        const card = document.createElement('div');
        card.className = 'plant-card bg-gray-800 rounded-lg shadow-lg overflow-hidden cursor-pointer transition-transform hover:scale-105';
        card.dataset.slug = plant.slug;
        card.dataset.name = plant.common_name;
        card.dataset.region = regionSelect.options[regionSelect.selectedIndex].text; // Store common name of region

        card.innerHTML = `
            <img src="${plant.image_url}" alt="${plant.common_name}" class="w-full h-48 object-cover">
            <div class="p-4">
                <h3 class="text-xl font-semibold text-white">${plant.common_name}</h3>
                <p class="text-gray-400 text-sm italic">${plant.scientific_name}</p>
            </div>
        `;
        plantGallery.appendChild(card);
    });
}

/**
 * Handles the click on a plant card, triggering detail fetch and article generation.
 * @param {Event} e - The click event
 */
async function handlePlantCardClick(e) {
    const card = e.target.closest('.plant-card');
    if (!card) return; // Clicked on the gap, not a card

    const { slug, name, region } = card.dataset;
    console.log(`Card clicked: ${name} (slug: ${slug})`);

    // Show article view and loader
    plantGalleryContainer.classList.add('hidden');
    articleView.classList.remove('hidden');
    articleContent.innerHTML = '';
    articleLoader.classList.remove('hidden');

    try {
        // --- This is the main workflow ---
        // 1. Get detailed plant data from Trefle
        const plantData = await getPlantDetails(slug);
        if (!plantData) {
            throw new Error("Could not fetch plant details.");
        }
        console.log("Got plant details:", plantData);

        // 2. Generate the article with Gemini
        // We pass the common name of the region for a better prompt
        const articleHtml = await generatePlantArticle(plantData, region);
        
        // 3. Render the article
        renderArticle(articleHtml, name);

    } catch (error) {
        console.error(error);
        articleContent.innerHTML = `<p class="text-red-400">Sorry, an error occurred: ${error.message}</p>`;
    } finally {
        articleLoader.classList.add('hidden');
    }
}

/**
 * Renders the generated article content.
 * @param {string} articleHtml - The HTML content from Gemini.
 * @param {string} plantName - The common name of the plant.
 */
function renderArticle(articleHtml, plantName) {
    // We prepend the title separately to ensure consistent styling
    // (though the prompt asks Gemini to create its own)
    const titleHtml = `<h2 class="text-3xl font-bold text-white mb-4">${plantName}</h2>`;
    articleContent.innerHTML = titleHtml + articleHtml;
}

/**
 * Hides the article view and shows the main gallery.
 */
function showGalleryView() {
    articleView.classList.add('hidden');
    plantGalleryContainer.classList.remove('hidden');
    articleContent.innerHTML = '';
}

// --- Run the app ---
main();
