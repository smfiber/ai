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
    fetchAugmentedPlantData,
    // Database functions
    savePlantToGarden,
    removePlantFromGarden,
    isPlantInGarden,
    getGardenPlants
} from './api.js';

// --- Global DOM Element Variables ---
let modalBackdrop, apiKeyForm, appContainer, mainContent, authContainer,
    signInBtn, signOutBtn, userInfo, userName, userPhoto, myGardenBtn, 
    searchForm, searchInput, plantGalleryContainer, plantGallery, loader,
    paginationContainer, prevBtn, nextBtn, pageInfo,
    plantDetailModal, modalTitle, modalCloseBtn, modalContentContainer,
    modalLoader, modalContent, savePlantBtn,
    gardenView, backToSearchBtn, gardenLoader, gardenGallery, gardenEmptyState;

// --- App State ---
let currentSearchQuery = null;
let currentPage = 1;
let currentLinks = null;
let currentMeta = null;
let currentUser = null; // Track the logged-in user
let currentModalPlant = null; // Track data for the currently open modal

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
        myGardenBtn = document.getElementById('my-garden-btn');

        searchForm = document.getElementById('search-form');
        searchInput = document.getElementById('search-input');
        
        plantGalleryContainer = document.getElementById('plant-gallery-container');
        plantGallery = document.getElementById('plant-gallery');
        loader = document.getElementById('loader');

        plantDetailModal = document.getElementById('plant-detail-modal');
        modalTitle = document.getElementById('modal-title');
        modalCloseBtn = document.getElementById('modal-close-btn');
        modalContentContainer = document.getElementById('modal-content-container');
        modalLoader = document.getElementById('modal-loader');
        modalContent = document.getElementById('modal-content');
        savePlantBtn = document.getElementById('save-plant-btn');

        paginationContainer = document.getElementById('pagination-container');
        prevBtn = document.getElementById('prev-btn');
        nextBtn = document.getElementById('next-btn');
        pageInfo = document.getElementById('page-info');

        // Garden View Elements
        gardenView = document.getElementById('garden-view');
        backToSearchBtn = document.getElementById('back-to-search-btn');
        gardenLoader = document.getElementById('garden-loader');
        gardenGallery = document.getElementById('garden-gallery');
        gardenEmptyState = document.getElementById('garden-empty-state');
        
        // 3. Add all event listeners
        addEventListeners();

        // 4. App is ready
        console.log("App ready. Waiting for API keys.");
        plantGallery.innerHTML = '<p class="text-gray-400">Please enter a search term to find plants.</p>';
    });
}

/**
 * Groups all event listeners for clean initialization
 */
function addEventListeners() {
    apiKeyForm.addEventListener('submit', handleApiKeySubmit);
    signInBtn.addEventListener('click', handleGoogleSignIn);
    signOutBtn.addEventListener('click', handleGoogleSignOut);
    myGardenBtn.addEventListener('click', showGardenView);
    backToSearchBtn.addEventListener('click', showDiscoveryView);

    searchForm.addEventListener('submit', handleSearchSubmit);
    prevBtn.addEventListener('click', handlePrevClick);
    nextBtn.addEventListener('click', handleNextClick);
    
    // Gallery clicks (delegated)
    plantGallery.addEventListener('click', handlePlantCardClick);
    gardenGallery.addEventListener('click', handlePlantCardClick);
    
    // Modal listeners
    modalCloseBtn.addEventListener('click', closeModal);
    plantDetailModal.addEventListener('click', (e) => {
        if (e.target === plantDetailModal) {
            closeModal();
        }
    });
    savePlantBtn.addEventListener('click', handleSaveToggle);
}

/**
 * Handles the submission of the API key modal.
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

// --- Auth Functions ---
async function handleGoogleSignIn() {
    try {
        await signInWithGoogle();
    } catch (error) {
        console.error("Sign-in failed:", error);
    }
}

async function handleGoogleSignOut() {
    try {
        await signOutUser();
    } catch (error) {
        console.error("Sign-out failed:", error);
    }
}

function updateAuthState(user) {
    currentUser = user; // Update global state
    
    if (user) {
        signInBtn.classList.add('hidden');
        userInfo.classList.remove('hidden');
        userInfo.classList.add('flex');
        userName.textContent = user.displayName;
        userPhoto.src = user.photoURL;
        // Enable garden button
        myGardenBtn.classList.remove('hidden');
    } else {
        signInBtn.classList.remove('hidden');
        userInfo.classList.add('hidden');
        userInfo.classList.remove('flex');
        userName.textContent = '';
        userPhoto.src = '';
        // Reset views
        showDiscoveryView();
        myGardenBtn.classList.add('hidden');
    }
}

// --- View Toggling ---

function showGardenView() {
    document.getElementById('discovery-view').classList.add('hidden');
    gardenView.classList.remove('hidden');
    loadGardenPlants(); // Fetch data
}

function showDiscoveryView() {
    gardenView.classList.add('hidden');
    document.getElementById('discovery-view').classList.remove('hidden');
}

// --- Search & Filtering ---

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

    console.log(`Global searching for: ${currentSearchQuery}`);
    fetchAndRenderPlants();
}

async function fetchAndRenderPlants() {
    loader.classList.remove('hidden');
    plantGallery.innerHTML = '';
    paginationContainer.classList.add('hidden');

    try {
        let results = { data: [], links: {}, meta: {} };

        if (currentSearchQuery) {
            results = await searchNativePlants(currentSearchQuery, currentPage);
            console.log(`Found ${results.data.length} plants for query "${currentSearchQuery}", page ${currentPage}.`);
        } else {
            plantGallery.innerHTML = '<p class="text-gray-400">Please enter a search term to find plants.</p>';
            loader.classList.add('hidden');
            return;
        }
        
        currentLinks = results.links;
        currentMeta = results.meta;

        renderPlantGallery(results.data, plantGallery); // Render to main gallery
        renderPagination(results.links, results.meta);

    } catch (error) {
        console.error(error);
        plantGallery.innerHTML = '<p class="text-red-400">Could not load plants. Check console for errors.</p>';
    } finally {
        loader.classList.add('hidden');
    }
}

// --- Garden Logic ---

async function loadGardenPlants() {
    if (!currentUser) return;
    
    gardenLoader.classList.remove('hidden');
    gardenGallery.innerHTML = '';
    gardenEmptyState.classList.add('hidden');

    try {
        const savedPlants = await getGardenPlants(currentUser.uid);
        
        if (savedPlants.length === 0) {
            gardenEmptyState.classList.remove('hidden');
        } else {
            renderPlantGallery(savedPlants, gardenGallery);
        }
    } catch (error) {
        console.error("Error loading garden:", error);
        gardenGallery.innerHTML = '<p class="text-red-400">Failed to load garden.</p>';
    } finally {
        gardenLoader.classList.add('hidden');
    }
}

// --- Pagination & Gallery Rendering ---

function handlePrevClick() {
    if (currentPage > 1) {
        currentPage--;
        fetchAndRenderPlants();
    }
}

function handleNextClick() {
    currentPage++;
    fetchAndRenderPlants();
}

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
 * Generic render function for any gallery container
 */
function renderPlantGallery(plants, container) {
    container.innerHTML = '';
    if (plants.length === 0 && container === plantGallery) {
        container.innerHTML = '<p class="text-gray-400">No plants found for this search or filter.</p>';
        return;
    }

    plants.forEach(plant => {
        const card = document.createElement('div');
        card.className = 'plant-card bg-gray-800 rounded-lg shadow-lg overflow-hidden cursor-pointer transition-transform hover:scale-105';
        card.dataset.slug = plant.slug;
        card.dataset.name = plant.common_name;

        card.innerHTML = `
            <img src="${plant.image_url}" alt="${plant.common_name}" class="w-full h-48 object-cover">
            <div class="p-4">
                <h3 class="text-xl font-semibold text-white">${plant.common_name}</h3>
                <p class="text-gray-400 text-sm italic">${plant.scientific_name}</p>
            </div>
        `;
        container.appendChild(card);
    });
}

// --- Modal Functions ---

function isValueMissing(value) {
    return value === null || value === undefined || value === 'N/A' || value === '';
}

function mergePlantData(trefleData, geminiData) {
    const finalData = {
        image_url: trefleData.image_url,
        scientific_name: trefleData.scientific_name,
        common_name: trefleData.common_name,
        edible: trefleData.edible,
        slug: trefleData.slug, // Ensure slug is preserved
        distributions: trefleData.distributions,

        family_common_name: !isValueMissing(trefleData.family_common_name) ? trefleData.family_common_name : 
                              !isValueMissing(trefleData.family?.name) ? trefleData.family.name : 
                              geminiData.family_common_name,
        
        genus_name: !isValueMissing(trefleData.genus?.name) ? trefleData.genus.name : 
                      geminiData.genus_name,

        growth_form: !isValueMissing(trefleData.growth?.growth_form) ? trefleData.growth.growth_form :
                       geminiData.growth_form,

        sunlight: !isValueMissing(trefleData.growth?.sunlight) ? trefleData.growth.sunlight :
                    geminiData.sunlight,

        watering: !isValueMissing(trefleData.growth?.watering) ? trefleData.growth.watering :
                    geminiData.watering,
        
        soil_texture: !isValueMissing(trefleData.growth?.soil_texture) ? trefleData.growth.soil_texture :
                        geminiData.soil_texture,

        ph_min_max: (trefleData.growth?.ph_minimum && trefleData.growth?.ph_maximum) ? 
                      `${trefleData.growth.ph_minimum} / ${trefleData.growth.ph_maximum}` : 
                      geminiData.ph_min_max,
        
        bloom_months: !isValueMissing(trefleData.growth?.bloom_months) ? trefleData.growth.bloom_months :
                        geminiData.bloom_months,
        
        care_plan: geminiData.care_plan
    };

    return finalData;
}

async function handlePlantCardClick(e) {
    const card = e.target.closest('.plant-card');
    if (!card) return;

    const { slug, name } = card.dataset;
    console.log(`Card clicked: ${name} (slug: ${slug})`);

    plantDetailModal.classList.remove('hidden');
    modalContent.classList.add('hidden');
    modalLoader.classList.remove('hidden');
    modalTitle.textContent = name || "Loading...";
    modalLoader.querySelector('p').textContent = 'Loading plant details...';
    modalContent.innerHTML = ''; 
    
    // Reset Save Button
    savePlantBtn.classList.add('hidden');
    savePlantBtn.textContent = 'Save';
    savePlantBtn.classList.remove('bg-red-600', 'hover:bg-red-700');
    savePlantBtn.classList.add('bg-green-600', 'hover:bg-green-700');

    try {
        // --- 1. Check if saved (if logged in) ---
        let isSaved = false;
        if (currentUser) {
            isSaved = await isPlantInGarden(currentUser.uid, slug);
            updateSaveButtonState(isSaved);
            savePlantBtn.classList.remove('hidden');
        }

        // --- 2. Get base data from Trefle ---
        const trefleData = await getPlantDetails(slug);
        if (!trefleData) {
            throw new Error("Could not fetch plant details.");
        }

        // --- 3. Augment data with Gemini ---
        modalLoader.querySelector('p').textContent = 'Augmenting data with AI...';
        const geminiData = await fetchAugmentedPlantData(trefleData);

        // --- 4. Merge Data ---
        currentModalPlant = mergePlantData(trefleData, geminiData);

        // --- 5. Render ---
        const articleHtml = createPlantDetailHtml(currentModalPlant);
        
        modalTitle.textContent = currentModalPlant.common_name || currentModalPlant.scientific_name;
        modalContent.innerHTML = articleHtml;

    } catch (error) {
        console.error(error);
        modalContent.innerHTML = `<p class="text-red-400">Sorry, an error occurred: ${error.message}</p>`;
    } finally {
        modalLoader.classList.add('hidden');
        modalContent.classList.remove('hidden');
        modalContentContainer.scrollTop = 0;
        modalLoader.querySelector('p').textContent = 'Loading plant details...';
    }
}

function updateSaveButtonState(isSaved) {
    if (isSaved) {
        savePlantBtn.textContent = 'Remove';
        savePlantBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
        savePlantBtn.classList.add('bg-red-600', 'hover:bg-red-700');
        savePlantBtn.dataset.action = 'remove';
    } else {
        savePlantBtn.textContent = 'Save';
        savePlantBtn.classList.remove('bg-red-600', 'hover:bg-red-700');
        savePlantBtn.classList.add('bg-green-600', 'hover:bg-green-700');
        savePlantBtn.dataset.action = 'save';
    }
}

async function handleSaveToggle() {
    if (!currentUser || !currentModalPlant) return;
    
    const action = savePlantBtn.dataset.action;
    const originalText = savePlantBtn.textContent;
    savePlantBtn.disabled = true;
    savePlantBtn.textContent = '...';

    try {
        if (action === 'save') {
            await savePlantToGarden(currentUser.uid, currentModalPlant);
            updateSaveButtonState(true);
        } else {
            await removePlantFromGarden(currentUser.uid, currentModalPlant.slug);
            updateSaveButtonState(false);
            // If we are in garden view, reload the list to reflect removal
            if (!gardenView.classList.contains('hidden')) {
                loadGardenPlants();
            }
        }
    } catch (error) {
        console.error("Save action failed:", error);
        alert("Failed to update garden. See console.");
        savePlantBtn.textContent = originalText;
    } finally {
        savePlantBtn.disabled = false;
    }
}

function createPlantDetailHtml(plantData) {
    const get = (value, defaultValue = 'N/A') => {
        return !isValueMissing(value) ? value : defaultValue;
    };

    const nativeDists = (plantData.distributions && plantData.distributions.native) ? plantData.distributions.native : [];
    let distributionText = 'No native distribution data available.';
    
    if (Array.isArray(nativeDists) && nativeDists.length > 0) {
        distributionText = nativeDists
            .map(dist => dist.name)
            .filter(name => name) 
            .join(', ');
    }

    return `
        <img src="${get(plantData.image_url)}" alt="${get(plantData.common_name)}" class="w-full rounded-lg shadow-lg mb-6 max-h-[50vh] object-cover">
        
        <h3>Scientific Classification</h3>
        <ul class="plant-data-list">
            <li><strong>Scientific Name:</strong> <em>${get(plantData.scientific_name)}</em></li>
            <li><strong>Family:</strong> ${get(plantData.family_common_name)}</li>
            <li><strong>Genus:</strong> ${get(plantData.genus_name)}</li>
        </ul>

        <h3>Growth &amp; Characteristics</h3>
        <ul class="plant-data-list">
            <li><strong>Growth Form:</strong> ${get(plantData.growth_form)}</li>
            <li><strong>Sunlight:</strong> ${get(plantData.sunlight)}</li>
            <li><strong>Watering:</strong> ${get(plantData.watering)}</li>
            <li><strong>Soil Texture:</strong> ${get(plantData.soil_texture)}</li>
            <li><strong>Soil pH (Min/Max):</strong> ${get(plantData.ph_min_max)}</li>
            <li><strong>Bloom Months:</strong> ${get(plantData.bloom_months)}</li>
            <li><strong>Edible:</strong> ${get(plantData.edible, 'N/A')}</li>
        </ul>

        <h3>Care Plan</h3>
        <p>${get(plantData.care_plan, 'No care plan available.')}</p>

        <h3>Distributions</h3>
        <p>This plant is native to the following regions:</p>
        <p class="text-gray-400 text-sm">${distributionText}</p>
    `;
}

function closeModal() {
    plantDetailModal.classList.add('hidden');
    modalContent.innerHTML = '';
    modalTitle.textContent = 'Plant Details';
    currentModalPlant = null;
}

// --- Run the app ---
main();
