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
    getGardenPlants,
    getSavedPlant,
    fetchCustomCareAdvice // <--- NEW IMPORT
} from './api.js';

// --- Global DOM Element Variables ---
let modalBackdrop, apiKeyForm, appContainer, mainContent, authContainer,
    signInBtn, signOutBtn, userInfo, userName, userPhoto, myGardenBtn, 
    searchForm, searchInput, plantGalleryContainer, plantGallery, loader,
    paginationContainer, prevBtn, nextBtn, pageInfo,
    plantDetailModal, modalTitle, modalCloseBtn, modalContentContainer,
    modalLoader, modalContent, savePlantBtn,
    gardenView, backToSearchBtn, gardenLoader, gardenGallery, gardenEmptyState;

// --- New Global DOM Variables for Q&A ---
let careQuestionSection, careQuestionForm, careQuestionInput, careQuestionSubmit,
    careResponseContainer, careResponseText, careResponseLoader;

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
        
        // --- New Q&A DOM Assignments (Elements exist in index.html) ---
        careQuestionSection = document.getElementById('care-question-section');
        careQuestionForm = document.getElementById('care-question-form');
        careQuestionInput = document.getElementById('care-question-input');
        careQuestionSubmit = document.getElementById('care-question-submit');
        careResponseContainer = document.getElementById('care-response-container');
        careResponseText = document.getElementById('care-response-text');
        careResponseLoader = document.getElementById('care-response-loader');
        
        // 3. Add all event listeners (Initial setup)
        addEventListeners();
        
        // 4. App is ready
        console.log("App ready. Waiting for API keys.");
        plantGallery.innerHTML = '<p class="text-gray-400">Please enter a search term to find plants.</p>';
        
        // Initial setup for the Q&A section which is loaded but not active
        careQuestionSection.classList.add('hidden');
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

    // Q&A listeners are set up/torn down dynamically in handlePlantCardClick
}

/**
 * Sets up listeners and resets the state for the dynamic Q&A form.
 */
function setupCareQuestionForm() {
    // 1. Remove previous listeners to prevent multiple execution
    careQuestionForm.removeEventListener('submit', handleCustomCareQuestion);
    careQuestionInput.removeEventListener('input', toggleQuestionSubmitButton);

    // 2. Add new listeners (must be done after modalContent is updated)
    careQuestionForm.addEventListener('submit', handleCustomCareQuestion);
    careQuestionInput.addEventListener('input', toggleQuestionSubmitButton);

    // 3. Reset state
    careQuestionInput.value = '';
    careQuestionSubmit.disabled = true;
    careQuestionInput.disabled = false;
    careResponseText.textContent = 'Submit a question above to get customized AI care advice.';
    careResponseText.classList.remove('text-red-400');
    careResponseText.classList.remove('hidden');
    careResponseLoader.classList.add('hidden');
    
    // Check auth state to control form interaction
    if (!currentUser) {
        careQuestionSubmit.disabled = true;
        careQuestionInput.disabled = true;
        careResponseText.textContent = 'Sign in to enable custom care questions.';
    }

    careQuestionSection.classList.remove('hidden');
}

/**
 * Toggles the submit button based on the input field content.
 */
function toggleQuestionSubmitButton() {
    careQuestionSubmit.disabled = careQuestionInput.value.trim().length === 0;
}

/**
 * Handles the submission of a custom care question to Gemini.
 */
async function handleCustomCareQuestion(e) {
    e.preventDefault();

    if (!currentUser || !currentModalPlant) {
        careResponseText.textContent = 'Error: Please sign in to ask custom questions.';
        careResponseText.classList.add('text-red-400');
        careResponseText.classList.remove('hidden');
        return;
    }

    const question = careQuestionInput.value.trim();
    if (question.length === 0) return;

    // UI Feedback: Disable input/button, show loader
    careQuestionInput.disabled = true;
    careQuestionSubmit.disabled = true;
    const originalSubmitText = careQuestionSubmit.textContent;
    careQuestionSubmit.textContent = 'Getting Advice...';
    
    // Clear previous response and show loader
    careResponseText.classList.add('hidden');
    careResponseLoader.classList.remove('hidden');

    try {
        const responseText = await fetchCustomCareAdvice(currentModalPlant, question);
        
        // Render the response, replacing the placeholder
        careResponseText.innerHTML = responseText.replace(/\n/g, '<br><br>'); // Preserve paragraphs/line breaks
        careResponseText.classList.remove('text-red-400');
        careResponseText.classList.remove('hidden');

    } catch (error) {
        console.error("Custom care question failed:", error);
        careResponseText.textContent = `Error: Could not get advice. ${error.message}`;
        careResponseText.classList.add('text-red-400');
        careResponseText.classList.remove('hidden');
    } finally {
        // Restore UI state
        careResponseLoader.classList.add('hidden');
        careQuestionInput.disabled = false;
        careQuestionSubmit.textContent = originalSubmitText;
        // Keep submit button disabled if input is still empty, enabled otherwise
        careQuestionSubmit.disabled = careQuestionInput.value.trim().length === 0;
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
        
        // Enable Q&A form elements if modal is open
        if (plantDetailModal.classList.contains('hidden') === false) {
             careQuestionInput.disabled = false;
             // Only enable submit button if there's text
             careQuestionSubmit.disabled = careQuestionInput.value.trim().length === 0;
             if (careResponseText.textContent === 'Sign in to enable custom care questions.') {
                careResponseText.textContent = 'Submit a question above to get customized AI care advice.';
             }
        }

    } else {
        signInBtn.classList.remove('hidden');
        userInfo.classList.add('hidden');
        userInfo.classList.remove('flex');
        userName.textContent = '';
        userPhoto.src = '';
        // Reset views
        showDiscoveryView();
        myGardenBtn.classList.add('hidden');
        
        // Disable Q&A form elements if modal is open
        if (plantDetailModal.classList.contains('hidden') === false) {
            careQuestionSubmit.disabled = true;
            careQuestionInput.disabled = true;
            careResponseText.textContent = 'Sign in to enable custom care questions.';
        }
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
    
    // --- Q&A Management START: Extract and prepare the form element ---
    // The Q&A section will be overwritten, so we clone the current DOM element
    const qaSectionClone = careQuestionSection.cloneNode(true);
    // Hide it immediately until data is loaded
    careQuestionSection.classList.add('hidden'); 
    
    // Clear modal content (which removes the static Q&A form if it was present)
    modalContent.innerHTML = '';
    // --- Q&A Management END ---

    // Reset Save Button
    savePlantBtn.classList.add('hidden');
    savePlantBtn.textContent = 'Save';
    savePlantBtn.classList.remove('bg-red-600', 'hover:bg-red-700');
    savePlantBtn.classList.add('bg-green-600', 'hover:bg-green-700');

    try {
        let isSaved = false;
        
        // --- 1. Fast Path: Check if already saved with full data ---
        if (currentUser) {
            modalLoader.querySelector('p').textContent = 'Checking your garden...';
            const savedPlant = await getSavedPlant(currentUser.uid, slug);
            
            // If we have the plant AND it has a care_plan, we know it's the full Augmented version
            if (savedPlant && savedPlant.care_plan) {
                console.log("Loaded from Garden (Skipped APIs)");
                currentModalPlant = savedPlant;
                
                // Render immediately
                const articleHtml = createPlantDetailHtml(currentModalPlant);
                modalTitle.textContent = currentModalPlant.common_name || currentModalPlant.scientific_name;
                modalContent.innerHTML = articleHtml;
                
                // Update button to "Remove" state
                updateSaveButtonState(true);
                savePlantBtn.classList.remove('hidden');
                
                // --- Q&A Management: Re-append and set up ---
                modalContent.appendChild(qaSectionClone);
                setupCareQuestionForm();
                
                // Skip the rest of the function
                modalLoader.classList.add('hidden');
                modalContent.classList.remove('hidden');
                modalContentContainer.scrollTop = 0;
                return;
            }
            
            // If found but partial data (legacy save), or not found, update status boolean
            if (savedPlant) isSaved = true;
        }

        // --- 2. Slow Path: Fetch from APIs ---
        if (currentUser) {
             updateSaveButtonState(isSaved);
             savePlantBtn.classList.remove('hidden');
        }

        // Get base data from Trefle
        modalLoader.querySelector('p').textContent = 'Fetching data from Trefle...';
        const trefleData = await getPlantDetails(slug);
        if (!trefleData) {
            throw new Error("Could not fetch plant details.");
        }

        // Augment data with Gemini
        modalLoader.querySelector('p').textContent = 'Augmenting data with AI...';
        const geminiData = await fetchAugmentedPlantData(trefleData);

        // Merge Data
        currentModalPlant = mergePlantData(trefleData, geminiData);

        // Render
        const articleHtml = createPlantDetailHtml(currentModalPlant);
        
        modalTitle.textContent = currentModalPlant.common_name || currentModalPlant.scientific_name;
        modalContent.innerHTML = articleHtml;
        
        // --- Q&A Management: Re-append and set up ---
        modalContent.appendChild(qaSectionClone);
        setupCareQuestionForm();

    } catch (error) {
        console.error(error);
        modalContent.innerHTML = `<p class="text-red-400">Sorry, an error occurred: ${error.message}</p>`;
        careQuestionSection.classList.add('hidden'); // Ensure it stays hidden on error
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

    // --- Rich HTML Layout ---
    return `
        <img src="${get(plantData.image_url)}" alt="${get(plantData.common_name)}" class="w-full rounded-lg shadow-lg mb-8 max-h-[50vh] object-cover">
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            
            <div class="bg-gray-700/50 p-5 rounded-xl shadow-inner border border-gray-600">
                <h3 class="flex items-center text-xl font-bold text-green-400 mb-4 pb-2 border-b border-gray-600">
                    <span class="mr-2">🔬</span> Scientific Classification
                </h3>
                <ul class="space-y-3 text-gray-200">
                    <li class="flex justify-between">
                        <span class="text-gray-400">Scientific Name</span>
                        <span class="font-medium italic text-right">${get(plantData.scientific_name)}</span>
                    </li>
                    <li class="flex justify-between">
                        <span class="text-gray-400">Family</span>
                        <span class="font-medium text-right">${get(plantData.family_common_name)}</span>
                    </li>
                    <li class="flex justify-between">
                        <span class="text-gray-400">Genus</span>
                        <span class="font-medium text-right">${get(plantData.genus_name)}</span>
                    </li>
                </ul>
            </div>

            <div class="bg-gray-700/50 p-5 rounded-xl shadow-inner border border-gray-600">
                <h3 class="flex items-center text-xl font-bold text-green-400 mb-4 pb-2 border-b border-gray-600">
                    <span class="mr-2">🌿</span> Characteristics
                </h3>
                <ul class="space-y-3 text-gray-200">
                    <li class="flex justify-between items-center">
                        <span class="text-gray-400">Form</span>
                        <span class="font-medium text-right">${get(plantData.growth_form)}</span>
                    </li>
                    <li class="flex justify-between items-center">
                        <span class="text-gray-400">Sunlight</span>
                        <span class="font-medium text-right flex items-center gap-1">☀️ ${get(plantData.sunlight)}</span>
                    </li>
                    <li class="flex justify-between items-center">
                        <span class="text-gray-400">Watering</span>
                        <span class="font-medium text-right flex items-center gap-1">💧 ${get(plantData.watering)}</span>
                    </li>
                    <li class="flex justify-between items-center">
                        <span class="text-gray-400">Soil</span>
                        <span class="font-medium text-right">${get(plantData.soil_texture)}</span>
                    </li>
                    <li class="flex justify-between items-center">
                        <span class="text-gray-400">Edible</span>
                        <span class="px-2 py-0.5 rounded text-xs font-bold ${String(plantData.edible) === 'true' ? 'bg-green-900 text-green-300' : 'bg-gray-600 text-gray-300'}">
                            ${get(plantData.edible, 'N/A')}
                        </span>
                    </li>
                </ul>
            </div>
        </div>

        <div class="bg-green-900/20 border-l-4 border-green-500 p-6 rounded-r-xl mb-8 shadow-lg">
            <h3 class="flex items-center text-xl font-bold text-white mb-3">
                <span class="mr-2">🤖</span> AI Care Plan (Detailed)
            </h3>
            <p class="text-gray-300 leading-relaxed italic whitespace-pre-wrap">
                ${get(plantData.care_plan, 'No care plan available.')}
            </p>
        </div>

        <div class="bg-gray-800 p-6 rounded-xl">
            <h3 class="flex items-center text-xl font-bold text-white mb-3">
                <span class="mr-2">🗺️</span> Native Distributions
            </h3>
            <p class="text-gray-400 text-sm leading-relaxed">
                ${distributionText}
            </p>
        </div>
    `;
}

function closeModal() {
    plantDetailModal.classList.add('hidden');
    modalContent.innerHTML = '';
    modalTitle.textContent = 'Plant Details';
    currentModalPlant = null;
    
    // --- Q&A Management: Hide and reset the form ---
    careQuestionSection.classList.add('hidden');
    careQuestionInput.value = '';
    careQuestionSubmit.disabled = true;
    careResponseText.textContent = 'Submit a question above to get customized AI care advice.';
    careResponseText.classList.remove('text-red-400');
    careResponseText.classList.remove('hidden');
    careResponseLoader.classList.add('hidden');
}

// --- Run the app ---
main();
