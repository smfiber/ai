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
    searchNativePlants,
    getPlantDetails,
    // generatePlantArticle // We are leaving this imported but unused for now
} from './api.js';

// --- Global DOM Element Variables ---
let modalBackdrop, apiKeyForm, appContainer, mainContent, authContainer,
    signInBtn, signOutBtn, userInfo, userName, userPhoto, searchForm,
    searchInput, plantGalleryContainer, plantGallery, loader,
    paginationContainer, prevBtn, nextBtn, pageInfo,
    plantDetailModal, modalTitle, modalCloseBtn, modalContentContainer,
    modalLoader, modalContent; // New modal variables

// --- App State ---
let currentSearchQuery = null;
let currentPage = 1;
let currentLinks = null;
let currentMeta = null;

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

        searchForm = document.getElementById('search-form');
        searchInput = document.getElementById('search-input');
        
        plantGalleryContainer = document.getElementById('plant-gallery-container');
        plantGallery = document.getElementById('plant-gallery');
        loader = document.getElementById('loader');

        // Assign new modal elements
        plantDetailModal = document.getElementById('plant-detail-modal');
        modalTitle = document.getElementById('modal-title');
        modalCloseBtn = document.getElementById('modal-close-btn');
        modalContentContainer = document.getElementById('modal-content-container');
        modalLoader = document.getElementById('modal-loader');
        modalContent = document.getElementById('modal-content');

        paginationContainer = document.getElementById('pagination-container');
        prevBtn = document.getElementById('prev-btn');
        nextBtn = document.getElementById('next-btn');
        pageInfo = document.getElementById('page-info');
        
        // 3. Add all event listeners
        addEventListeners();

        // 4. App is ready
        console.log("App ready. Waiting for API keys.");
        plantGallery.innerHTML = '<p class="text-gray-400">Please enter a search term to find native plants.</p>';
    });
}

/**
 * Groups all event listeners for clean initialization
 */
function addEventListeners() {
    apiKeyForm.addEventListener('submit', handleApiKeySubmit);
    signInBtn.addEventListener('click', handleGoogleSignIn);
    signOutBtn.addEventListener('click', handleGoogleSignOut);
    searchForm.addEventListener('submit', handleSearchSubmit);
    prevBtn.addEventListener('click', handlePrevClick);
    nextBtn.addEventListener('click', handleNextClick);
    plantGallery.addEventListener('click', handlePlantCardClick);
    
    // New modal listeners
    modalCloseBtn.addEventListener('click', closeModal);
    plantDetailModal.addEventListener('click', (e) => {
        // Close if click is on the backdrop
        if (e.target === plantDetailModal) {
            closeModal();
        }
    });
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

        setApiKeys({ trefle, gemini, googleClientId, firebase });

        const authModule = await initFirebase();

        if (authModule && authModule.auth) {
            authModule.onAuthStateChanged(authModule.auth, (user) => {
                updateAuthState(user);
            });
        } else {
            throw new Error("Firebase auth module not loaded.");
        }

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
        signInBtn.classList.add('hidden');
        userInfo.classList.remove('hidden');
        userInfo.classList.add('flex');
        userName.textContent = user.displayName;
        userPhoto.src = user.photoURL;
    } else {
        signInBtn.classList.remove('hidden');
        userInfo.classList.add('hidden');
        userInfo.classList.remove('flex');
        userName.textContent = '';
        userPhoto.src = '';
    }
}

/**
 * Handles the search form submission.
 * @param {Event} e - The form submit event
 */
function handleSearchSubmit(e) {
    e.preventDefault();
    const query = searchInput.value.trim();

    if (query === currentSearchQuery) {
        return;
    }

    currentSearchQuery = query;
    currentPage = 1;
    currentLinks = null;
    currentMeta = null;

    console.log(`Searching for: ${currentSearchQuery}`);
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
    if (!currentSearchQuery) {
        plantGallery.innerHTML = '<p class="text-gray-400">Please enter a search term to find native plants.</p>';
        paginationContainer.classList.add('hidden');
        return;
    }

    loader.classList.remove('hidden');
    plantGallery.innerHTML = '';
    paginationContainer.classList.add('hidden');

    try {
        const { data, links, meta } = await searchNativePlants(currentSearchQuery, currentPage);
        console.log(`Found ${data.length} native plants for query "${currentSearchQuery}", page ${currentPage}.`);
        
        currentLinks = links;
        currentMeta = meta;

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
    if (!meta || !meta.total || meta.total === 0) {
        paginationContainer.classList.add('hidden');
        return;
    }

    const totalPlants = meta.total;
    const perPage = 20;
    const totalPages = Math.ceil(totalPlants / perPage);

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
    plantGallery.innerHTML = '';
    if (plants.length === 0) {
        plantGallery.innerHTML = '<p class="text-gray-400">No native plants found for this search.</p>';
        return;
    }

    plants.forEach(plant => {
        const card = document.createElement('div');
        card.className = 'plant-card bg-gray-800 rounded-lg shadow-lg overflow-hidden cursor-pointer transition-transform hover:scale-105';
        card.dataset.slug = plant.slug;
        card.dataset.name = plant.common_name;
        card.dataset.region = "Florida";

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
 * Handles the click on a plant card, fetching details and showing the modal.
 * @param {Event} e - The click event
 */
async function handlePlantCardClick(e) {
    const card = e.target.closest('.plant-card');
    if (!card) return;

    const { slug, name } = card.dataset;
    console.log(`Card clicked: ${name} (slug: ${slug})`);

    // Show modal and loader
    plantDetailModal.classList.remove('hidden');
    modalContent.classList.add('hidden');
t
    modalLoader.classList.remove('hidden');
    modalTitle.textContent = name || "Loading...";
    modalContent.innerHTML = ''; // Clear previous content

    try {
        const plantData = await getPlantDetails(slug);
        if (!plantData) {
            throw new Error("Could not fetch plant details.");
        }
        console.log("Got plant details:", plantData);

        // Generate rich HTML from the data
        const articleHtml = createPlantDetailHtml(plantData);
        
        // Render the article
        modalTitle.textContent = plantData.common_name || plantData.scientific_name;
        modalContent.innerHTML = articleHtml;

    } catch (error) {
        console.error(error);
        modalContent.innerHTML = `<p class="text-red-400">Sorry, an error occurred: ${error.message}</p>`;
    } finally {
        // Hide loader and show content
        modalLoader.classList.add('hidden');
        modalContent.classList.remove('hidden');
        // Reset scroll to top
        modalContentContainer.scrollTop = 0;
    }
}

/**
 * Takes a Trefle plant data object and generates rich HTML.
 * @param {object} plantData - The detailed plant object from Trefle.
 * @returns {string} - The generated HTML string.
 */
function createPlantDetailHtml(plantData) {
    // Helper to safely get nested data
    const get = (obj, path, defaultValue = 'N/A') => {
        const result = path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined) ? acc[key] : undefined, obj);
        const value = result !== undefined ? result : defaultValue;
        if (Array.isArray(value)) {
            return value.length > 0 ? value.join(', ') : defaultValue;
        }
        return value;
    };

    return `
        <img src="${get(plantData, 'image_url')}" alt="${get(plantData, 'common_name')}" class="w-full rounded-lg shadow-lg mb-6">
        
        <h3>Scientific Classification</h3>
        <ul class="plant-data-list">
            <li><strong>Scientific Name:</strong> <em>${get(plantData, 'scientific_name')}</em></li>
            <li><strong>Family:</strong> ${get(plantData, 'family_common_name', get(plantData, 'family.name'))}</li>
            <li><strong>Genus:</strong> ${get(plantData, 'genus.name', 'N/A')}</li>
        </ul>

        <h3>Growth &amp; Characteristics</h3>
        <ul class="plant-data-list">
            <li><strong>Growth Form:</strong> ${get(plantData, 'growth.growth_form', 'N/A')}</li>
            <li><strong>Sunlight:</strong> ${get(plantData, 'growth.sunlight', 'N/A')}</li>
            <li><strong>Watering:</strong> ${get(plantData, 'growth.watering', 'N/A')}</li>
            <li><strong>Soil Texture:</strong> ${get(plantData, 'growth.soil_texture', 'N/A')}</li>
            <li><strong>Soil pH (Min/Max):</strong> ${get(plantData, 'growth.ph_minimum', 'N/A')} / ${get(plantData, 'growth.ph_maximum', 'N/A')}</li>
            <li><strong>Bloom Months:</strong> ${get(plantData, 'growth.bloom_months', 'N/A')}</li>
            <li><strong>Edible:</strong> ${get(plantData, 'edible', 'N/A')}</li>
        </ul>

        <h3>Distributions</h3>
        <p>This plant is native to the following regions:</p>
        <p class="text-gray-400 text-sm">${get(plantData, 'distributions.native', 'No native distribution data available.')}</p>
    `;
}

/**
 * Hides the plant detail modal.
 */
function closeModal() {
    plantDetailModal.classList.add('hidden');
    modalContent.innerHTML = ''; // Clear content
    modalTitle.textContent = 'Plant Details'; // Reset title
}

// --- Run the app ---
main();
