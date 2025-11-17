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
    getAllDistributions, // New import
    getFilteredPlants // New import
} from './api.js';

// --- Global DOM Element Variables ---
let modalBackdrop, apiKeyForm, appContainer, mainContent, authContainer,
    signInBtn, signOutBtn, userInfo, userName, userPhoto, searchForm,
    searchInput, plantGalleryContainer, plantGallery, loader,
    paginationContainer, prevBtn, nextBtn, pageInfo,
    plantDetailModal, modalTitle, modalCloseBtn, modalContentContainer,
    modalLoader, modalContent;

// New Advanced Search elements
let advancedSearchToggle, advancedSearchView, backToSimpleSearch,
    advancedSearchForm, distributionSelect, growthFormSelect;

// --- App State ---
let currentSearchQuery = null;
let currentPage = 1;
let currentLinks = null;
let currentMeta = null;
let isAdvancedSearchActive = false; // Track search mode
let currentAdvancedFilters = {}; // Store advanced filters
let distributionsCache = null; // Cache for distributions

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

        // Assign new advanced search elements
        advancedSearchToggle = document.getElementById('advanced-search-toggle');
        advancedSearchView = document.getElementById('advanced-search-view');
        backToSimpleSearch = document.getElementById('back-to-simple-search');
        advancedSearchForm = document.getElementById('advanced-search-form');
        distributionSelect = document.getElementById('distribution-select');
        growthFormSelect = document.getElementById('growth-form-select');
        
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
    
    // Modal listeners
    modalCloseBtn.addEventListener('click', closeModal);
    plantDetailModal.addEventListener('click', (e) => {
        if (e.target === plantDetailModal) {
            closeModal();
        }
    });

    // Advanced search listeners
    advancedSearchToggle.addEventListener('click', showAdvancedSearch);
    backToSimpleSearch.addEventListener('click', showSimpleSearch);
    advancedSearchForm.addEventListener('submit', handleAdvancedSearchSubmit);
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

// --- View Toggling ---

/**
 * Shows the Advanced Search view and populates dropdowns.
 */
function showAdvancedSearch() {
    document.getElementById('discovery-view').classList.add('hidden');
    advancedSearchView.classList.remove('hidden');
    paginationContainer.classList.add('hidden'); // Hide pagination
    plantGallery.innerHTML = '<p class="text-gray-400">Please select filters to find plants.</p>'; // Reset gallery

    // Populate dropdowns if not already populated
    if (!distributionsCache) {
        populateDistributionDropdown();
    }
}

/**
 * Shows the Simple Search (main gallery) view.
 */
function showSimpleSearch() {
    advancedSearchView.classList.add('hidden');
    document.getElementById('discovery-view').classList.remove('hidden');
    // Restore previous search state if it exists
    if (currentLinks || currentMeta) {
        renderPagination(currentLinks, currentMeta);
    }
    // Re-render gallery if we have a query
    if (currentSearchQuery) {
        fetchAndRenderPlants(); // Re-runs simple search
    } else {
        plantGallery.innerHTML = '<p class="text-gray-400">Please enter a search term to find native plants.</p>';
    }
}

// --- Search & Filtering ---

/**
 * Handles the simple search form submission (Florida only).
 * @param {Event} e - The form submit event
 */
function handleSearchSubmit(e) {
    e.preventDefault();
    const query = searchInput.value.trim();

    // Reset advanced search
    isAdvancedSearchActive = false;
    currentAdvancedFilters = {};

    if (query === currentSearchQuery) {
        return;
    }

    currentSearchQuery = query;
    currentPage = 1;
    currentLinks = null;
    currentMeta = null;

    console.log(`Simple searching for: ${currentSearchQuery}`);
    fetchAndRenderPlants();
}

/**
 * Handles the advanced search form submission.
 * @param {Event} e - The form submit event
 */
function handleAdvancedSearchSubmit(e) {
    e.preventDefault();
    
    // Set advanced search mode
    isAdvancedSearchActive = true;
    currentSearchQuery = null; // Clear simple search
    currentPage = 1;
    currentLinks = null;
    currentMeta = null;

    // Store the selected filters
    currentAdvancedFilters = {
        distributionId: distributionSelect.value,
        growthForm: growthFormSelect.value
    };

    console.log("Advanced searching with filters:", currentAdvancedFilters);
    fetchAndRenderPlants();
}

/**
 * Fetches plant data from the API and renders the gallery and pagination.
 * This function now intelligently decides which API to call.
 */
async function fetchAndRenderPlants() {
    loader.classList.remove('hidden');
    plantGallery.innerHTML = '';
    paginationContainer.classList.add('hidden');

    // Restore gallery view in case modal was open
    document.getElementById('discovery-view').classList.remove('hidden');
    advancedSearchView.classList.add('hidden');

    try {
        let results = { data: [], links: {}, meta: {} };

        if (isAdvancedSearchActive) {
            // --- Advanced Filter Path ---
            if (!currentAdvancedFilters.distributionId && !currentAdvancedFilters.growthForm) {
                plantGallery.innerHTML = '<p class="text-gray-400">Please select at least one filter for advanced search.</p>';
                loader.classList.add('hidden');
                return;
            }
            results = await getFilteredPlants(currentAdvancedFilters, currentPage);
            console.log(`Found ${results.data.length} plants for advanced filter, page ${currentPage}.`);

        } else if (currentSearchQuery) {
            // --- Simple Search Path ---
            results = await searchNativePlants(currentSearchQuery, currentPage);
            console.log(`Found ${results.data.length} native plants for query "${currentSearchQuery}", page ${currentPage}.`);
        
        } else {
            // --- No Search Active ---
            plantGallery.innerHTML = '<p class="text-gray-400">Please enter a search term to find native plants.</p>';
            loader.classList.add('hidden');
            return;
        }
        
        currentLinks = results.links;
        currentMeta = results.meta;

        renderPlantGallery(results.data);
        renderPagination(results.links, results.meta);

    } catch (error) {
        console.error(error);
        plantGallery.innerHTML = '<p class="text-red-400">Could not load plants. Check console for errors.</p>';
    } finally {
        loader.classList.add('hidden');
    }
}

/**
 * Populates the distribution (region) dropdown.
 */
async function populateDistributionDropdown() {
    distributionSelect.disabled = true;
    
    try {
        const distributions = await getAllDistributions();
        // Sort alphabetically by name
        distributions.sort((a, b) => a.name.localeCompare(b.name));
        
        distributionsCache = distributions; // Cache the results
        
        distributionSelect.innerHTML = '<option value="">-- Any Region --</option>'; // Reset
        
        distributions.forEach(dist => {
            const option = document.createElement('option');
            option.value = dist.id;
            option.textContent = dist.name;
            distributionSelect.appendChild(option);
        });

        // Set default to Florida (ID 63)
        distributionSelect.value = '63'; 

    } catch (error) {
        console.error("Could not load distributions:", error);
        distributionSelect.innerHTML = '<option value="">-- Error loading regions --</option>';
    } finally {
        distributionSelect.disabled = false;
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
    const perPage = 20; // Trefle default is 20 per page
    const totalPages = Math.ceil(totalPlants / perPage);

    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    prevBtn.disabled = !links.prev;
    nextBtn.disabled = !links.next;

    paginationContainer.classList.remove('hidden');
}

function renderPlantGallery(plants) {
    plantGallery.innerHTML = '';
    if (plants.length === 0) {
        plantGallery.innerHTML = '<p class="text-gray-400">No plants found for this search or filter.</p>';
        return;
    }

    plants.forEach(plant => {
        const card = document.createElement('div');
        card.className = 'plant-card bg-gray-800 rounded-lg shadow-lg overflow-hidden cursor-pointer transition-transform hover:scale-105';
        card.dataset.slug = plant.slug;
        card.dataset.name = plant.common_name;
        // We can't hardcode region anymore
        // card.dataset.region = "Florida"; 

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

// --- Modal Functions ---

async function handlePlantCardClick(e) {
    const card = e.target.closest('.plant-card');
    if (!card) return;

    const { slug, name } = card.dataset;
    console.log(`Card clicked: ${name} (slug: ${slug})`);

    plantDetailModal.classList.remove('hidden');
    modalContent.classList.add('hidden');
    modalLoader.classList.remove('hidden');
    modalTitle.textContent = name || "Loading...";
    modalContent.innerHTML = ''; 

    try {
        const plantData = await getPlantDetails(slug);
        if (!plantData) {
            throw new Error("Could not fetch plant details.");
        }
        console.log("Got plant details:", plantData);

        const articleHtml = createPlantDetailHtml(plantData);
        
        modalTitle.textContent = plantData.common_name || plantData.scientific_name;
        modalContent.innerHTML = articleHtml;

    } catch (error) {
        console.error(error);
        modalContent.innerHTML = `<p class="text-red-400">Sorry, an error occurred: ${error.message}</p>`;
    } finally {
        modalLoader.classList.add('hidden');
        modalContent.classList.remove('hidden');
        modalContentContainer.scrollTop = 0;
    }
}

function createPlantDetailHtml(plantData) {
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

function closeModal() {
    plantDetailModal.classList.add('hidden');
    modalContent.innerHTML = '';
    modalTitle.textContent = 'Plant Details';
}

// --- Run the app ---
main();
