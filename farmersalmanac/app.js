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
    signInBtn, signOutBtn, userInfo, userName, userPhoto, speciesTypeSelect,
    plantGalleryContainer, plantGallery, loader, articleView, 
    articleContent, articleLoader, backToGalleryBtn,
    paginationContainer, prevBtn, nextBtn, pageInfo;

// --- App State ---
let currentSpeciesType = null;
let currentPage = 1;

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

        speciesTypeSelect = document.getElementById('species-type-select');
        plantGalleryContainer = document.getElementById('plant-gallery-container');
        plantGallery = document.getElementById('plant-gallery');
        loader = document.getElementById('loader');

        articleView = document.getElementById('article-view');
        articleContent = document.getElementById('article-content');
        articleLoader = document.getElementById('article-loader');
        backToGalleryBtn = document.getElementById('back-to-gallery-btn');

        paginationContainer = document.getElementById('pagination-container');
        prevBtn = document.getElementById('prev-btn');
        nextBtn = document.getElementById('next-btn');
        pageInfo = document.getElementById('page-info');
        
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

    // Listen for species type selection change
    speciesTypeSelect.addEventListener('change', handleSpeciesTypeSelect);

    // Listen for pagination clicks
    prevBtn.addEventListener('click', handlePrevClick);
    nextBtn.addEventListener('click', handleNextClick);

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
 * Handles the selection of a new species type from the dropdown.
 */
function handleSpeciesTypeSelect(e) {
    currentSpeciesType = e.target.value;
    currentPage = 1; // Reset to page 1

    if (!currentSpeciesType) {
        plantGallery.innerHTML = '';
        paginationContainer.classList.add('hidden');
        return;
    }

    console.log(`Species type selected: ${currentSpeciesType}`);
    fetchAndRenderPlants();
}

/**
 * Handles the "Previous Page" button click.
 */
function handlePrevClick() {
    if (currentPage > 1) {
        currentPage--;
        fetchAndRenderPlants();
    }
}

/**
 * Handles the "Next Page" button click.
 */
function handleNextClick() {
    currentPage++;
    fetchAndRenderPlants();
}

/**
 * Fetches plant data from the API and renders the gallery and pagination.
 */
async function fetchAndRenderPlants() {
    loader.classList.remove('hidden');
    plantGallery.innerHTML = '';
    articleView.classList.add('hidden');
    plantGalleryContainer.classList.remove('hidden');
    paginationContainer.classList.add('hidden'); // Hide until we know we have pages

    try {
        const { data, links, meta } = await getNativePlants(currentSpeciesType, currentPage);
        console.log(`Found ${data.length} native plants for page ${currentPage}.`);
        renderPlantGallery(data);
        renderPagination(links, meta);
    } catch (error) {
        console.error(error);
        plantGallery.innerHTML = '<p class="text-red-400">Could not load plants. Check console for errors.</p>';
    } finally {
        loader.classList.add('hidden');
    }
}

/**
 * Renders the pagination controls (buttons, page info).
 * @param {object} links - The links object from Trefle (next, prev, last).
 * @param {object} meta - The meta object from Trefle (total).
 */
function renderPagination(links, meta) {
    if (!meta || !meta.total) {
        paginationContainer.classList.add('hidden');
        return;
    }

    const totalPlants = meta.total;
    const totalPages = Math.ceil(totalPlants / 20); // Trefle API uses 20 per page

    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    prevBtn.disabled = !links.prev;
    nextBtn.disabled = !links.next;

    paginationContainer.classList.remove('hidden');
}

/**
 * Renders the plant cards in the gallery.
 * @param {Array} plants - An array of plant objects from Trefle.
 */
function renderPlantGallery(plants) {
    plantGallery.innerHTML = ''; // Clear previous results
    if (plants.length === 0) {
        plantGallery.innerHTML = '<p class="text-gray-400">No native plants found for this species type with images.</p>';
        return;
    }

    plants.forEach(plant => {
        const card = document.createElement('div');
        card.className = 'plant-card bg-gray-800 rounded-lg shadow-lg overflow-hidden cursor-pointer transition-transform hover:scale-105';
        card.dataset.slug = plant.slug;
        card.dataset.name = plant.common_name;
        card.dataset.region = "Florida"; // Hardcode region for the prompt

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
    paginationContainer.classList.add('hidden');
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
    paginationContainer.classList.remove('hidden'); // Show pagination again
    articleContent.innerHTML = '';
}

// --- Run the app ---
main();
