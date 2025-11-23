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
    getGardenPlants,
    getSavedPlant,
    fetchCustomCareAdvice,
    fetchScientificNameLookup,
    // NEW Image Functions
    uploadPlantImage, 
    fetchImageIdentification 
} from './api.js';

// --- Global DOM Element Variables ---
let modalBackdrop, apiKeyForm, appContainer, mainContent, authContainer,
    signInBtn, signOutBtn, userInfo, userName, userPhoto, myGardenBtn, 
    searchForm, searchInput, plantGalleryContainer, plantGallery, loader,
    paginationContainer, prevBtn, nextBtn, pageInfo,
    plantDetailModal, modalTitle, modalCloseBtn, modalContentContainer,
    modalLoader, modalContent, savePlantBtn,
    gardenView, backToSearchBtn, gardenLoader, gardenGallery, gardenEmptyState;

// --- New Global DOM Variables for Q&A and Search Lookup ---
let careQuestionSection, careQuestionForm, careQuestionInput, careQuestionSubmit,
    careResponseContainer, careResponseText, careResponseLoader;

let scientificLookupBtn; 

// --- NEW Image Upload DOM Variables ---
let identifyPlantBtn, imageUploadModal, imageModalCloseBtn, imageUploadForm,
    imageFileInput, imagePreviewContainer, imagePreview, previewPlaceholder,
    uploadStatus, uploadMessage, identifyImageBtn;

// --- NEW Refresh & Update Image Variables ---
let refreshPlantBtn, updateImageBtn, updateImageInput;

// --- NEW Analytics Variables ---
let viewGalleryBtn, viewAnalyticsBtn, gardenAnalytics;

// --- App State ---
let currentSearchQuery = null;
let currentPage = 1;
let currentLinks = null;
let currentMeta = null;
let currentUser = null; // Track the logged-in user
let currentModalPlant = null; // Track data for the currently open modal
let myGardenCache = []; // Store garden plants for analytics switching

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
        
        scientificLookupBtn = document.getElementById('scientific-lookup-btn');

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
        refreshPlantBtn = document.getElementById('refresh-plant-btn');
        updateImageBtn = document.getElementById('update-image-btn');
        updateImageInput = document.getElementById('update-image-input');

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
        gardenAnalytics = document.getElementById('garden-analytics'); // NEW
        viewGalleryBtn = document.getElementById('view-gallery-btn'); // NEW
        viewAnalyticsBtn = document.getElementById('view-analytics-btn'); // NEW
        
        // --- Q&A DOM Assignments ---
        careQuestionSection = document.getElementById('care-question-section');
        careQuestionForm = document.getElementById('care-question-form');
        careQuestionInput = document.getElementById('care-question-input');
        careQuestionSubmit = document.getElementById('care-question-submit');
        careResponseContainer = document.getElementById('care-response-container');
        careResponseText = document.getElementById('care-response-text');
        careResponseLoader = document.getElementById('care-response-loader');
        
        // --- NEW Image Upload DOM Assignments ---
        identifyPlantBtn = document.getElementById('identify-plant-btn');
        imageUploadModal = document.getElementById('image-upload-modal');
        imageModalCloseBtn = document.getElementById('image-modal-close-btn');
        imageUploadForm = document.getElementById('image-upload-form');
        imageFileInput = document.getElementById('image-file-input');
        imagePreviewContainer = document.getElementById('image-preview-container');
        imagePreview = document.getElementById('image-preview');
        previewPlaceholder = document.getElementById('preview-placeholder');
        uploadStatus = document.getElementById('upload-status');
        uploadMessage = document.getElementById('upload-message');
        identifyImageBtn = document.getElementById('identify-image-btn');


        // 3. Add all event listeners (Initial setup)
        addEventListeners();
        
        // 4. App is ready
        console.log("App ready. Waiting for API keys.");
        plantGallery.innerHTML = '<div class="col-span-full text-center py-10"><p class="text-gray-300 text-lg">Enter a search term above to begin your botanical journey.</p></div>';
        
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
    
    scientificLookupBtn.addEventListener('click', handleScientificLookup);

    // Gallery clicks (delegated)
    plantGallery.addEventListener('click', handlePlantCardClick);
    gardenGallery.addEventListener('click', handlePlantCardClick);
    
    // NEW: Analytics clicks (delegated)
    gardenAnalytics.addEventListener('click', handleAnalyticsItemClick);
    
    // Modal listeners
    modalCloseBtn.addEventListener('click', closeModal);
    plantDetailModal.addEventListener('click', (e) => {
        if (e.target === plantDetailModal) {
            closeModal();
        }
    });
    savePlantBtn.addEventListener('click', handleSaveToggle);
    refreshPlantBtn.addEventListener('click', handleRefreshData);
    
    // Update Photo Listeners
    updateImageBtn.addEventListener('click', () => updateImageInput.click());
    updateImageInput.addEventListener('change', handleUpdatePhoto);

    // --- NEW IMAGE UPLOAD LISTENERS ---
    identifyPlantBtn.addEventListener('click', openImageUploadModal);
    imageModalCloseBtn.addEventListener('click', closeImageUploadModal);
    imageUploadForm.addEventListener('submit', handleImageUpload);
    imageFileInput.addEventListener('change', handleImageFileChange);

    // --- NEW ANALYTICS LISTENERS ---
    viewGalleryBtn.addEventListener('click', () => switchGardenMode('gallery'));
    viewAnalyticsBtn.addEventListener('click', () => switchGardenMode('analytics'));
}

// --- NEW IMAGE UPLOAD FUNCTIONS ---

function openImageUploadModal() {
    if (!currentUser) {
        alert("Please sign in with Google to use the Plant Identification feature.");
        return;
    }
    imageUploadModal.classList.remove('hidden');
    // Ensure form is reset on open
    imageUploadForm.reset();
    imagePreview.classList.add('hidden');
    previewPlaceholder.classList.remove('hidden');
    identifyImageBtn.disabled = true;
    uploadStatus.classList.add('hidden');
}

function closeImageUploadModal() {
    imageUploadModal.classList.add('hidden');
}

function handleImageFileChange(e) {
    const file = e.target.files[0];
    if (file) {
        // Show preview
        const reader = new FileReader();
        reader.onload = (event) => {
            imagePreview.src = event.target.result;
            imagePreview.classList.remove('hidden');
            previewPlaceholder.classList.add('hidden');
            identifyImageBtn.disabled = false;
        };
        reader.readAsDataURL(file);
    } else {
        imagePreview.classList.add('hidden');
        previewPlaceholder.classList.remove('hidden');
        identifyImageBtn.disabled = true;
    }
}

async function handleImageUpload(e) {
    e.preventDefault();

    if (!currentUser) {
        alert("Authentication required.");
        return;
    }

    const file = imageFileInput.files[0];
    if (!file) return;

    // UI State: Start Processing
    identifyImageBtn.disabled = true;
    const originalBtnText = identifyImageBtn.textContent;
    uploadStatus.classList.remove('hidden');
    uploadMessage.textContent = 'Step 1 of 4: Uploading image to storage...';

    let imageUrl = null;
    let plantData = null;
    let identifiedName = null;
    let trefleData = null;

    try {
        // 1. UPLOAD IMAGE TO FIREBASE STORAGE
        imageUrl = await uploadPlantImage(file, currentUser.uid);
        uploadMessage.textContent = 'Step 2 of 4: Analyzing image with AI...';

        // 2. IDENTIFY PLANT VIA GEMINI VISION
        identifiedName = await fetchImageIdentification(imageUrl);

        // FIX: safely handle if identifiedName is null (API failure) or Unknown
        if (!identifiedName || identifiedName.scientific_name === 'Unknown') {
            const debugInfo = identifiedName ? identifiedName.scientific_name : "API Error / Null Response";
            throw new Error(`AI could not identify the plant. Result: ${debugInfo}`);
        }

        const scientificName = identifiedName.scientific_name;
        uploadMessage.textContent = `Step 3 of 4: Identified as "${scientificName}". Searching database...`;

        // 3. SEARCH TREFLE (using scientific name for highest accuracy)
        const trefleSearch = await searchNativePlants(scientificName, 1);
        
        if (trefleSearch.data.length === 0) {
             throw new Error("Could not find detailed data on Trefle after AI identification.");
        }

        // Use the slug of the first result to get full details
        const plantSlug = trefleSearch.data[0].slug;
        trefleData = await getPlantDetails(plantSlug);

        if (!trefleData) {
            throw new Error("Trefle details not found.");
        }
        
        // Inject the image URL from storage since Trefle doesn't have it
        trefleData.image_url = imageUrl;
        
        // 4. AUGMENT DATA WITH GEMINI
        uploadMessage.textContent = 'Step 4 of 4: Augmenting care plan and hazards with AI...';
        const geminiData = await fetchAugmentedPlantData(trefleData);

        // 5. MERGE AND SAVE TO GARDEN
        plantData = mergePlantData(trefleData, geminiData);
        // Ensure new saves have the image URL included in the final object
        plantData.image_url = imageUrl; 
        plantData.qa_history = []; // Initialize history
        
        const docId = await savePlantToGarden(currentUser.uid, plantData);

        // Success!
        closeImageUploadModal();
        alert(`Success! Plant "${plantData.common_name}" has been identified and saved to your garden.`);
        // Reload the garden view if currently open
        if (!gardenView.classList.contains('hidden')) {
             loadGardenPlants();
        }

    } catch (error) {
        console.error("Image Identification Workflow Failed:", error);
        uploadMessage.textContent = `Error: ${error.message}. Please try a different photo.`;
        uploadMessage.classList.add('text-red-400');
        uploadMessage.classList.remove('text-green-400');

    } finally {
        identifyImageBtn.textContent = originalBtnText;
        identifyImageBtn.disabled = false;
    }
}


// --- Q&A AND MODAL FUNCTIONS ---

async function handleScientificLookup() {
    const commonName = searchInput.value.trim();

    if (commonName.length === 0) {
        alert("Please enter a common plant name (e.g., Sea Grape Tree) into the search box first.");
        return;
    }
    
    // UI Feedback
    const originalText = scientificLookupBtn.textContent;
    scientificLookupBtn.disabled = true;
    scientificLookupBtn.textContent = 'AI Looking Up...';
    searchInput.disabled = true;

    try {
        const scientificName = await fetchScientificNameLookup(commonName);

        if (scientificName && scientificName.toLowerCase().includes('error') === false) {
            alert(`AI Suggestion for "${commonName}":\n\n${scientificName}\n\nPaste this name into the search box and press Enter for a more accurate Trefle search!`);
            
            // Optionally populate the search box for the user
            searchInput.value = scientificName; 
        } else {
            alert(`Sorry, the AI could not reliably find the scientific name for "${commonName}". Please try a more specific common name.`);
        }
    } catch (error) {
        console.error("Scientific Lookup Error:", error);
        alert("An unexpected error occurred during AI lookup.");
    } finally {
        // Restore UI state
        scientificLookupBtn.textContent = originalText;
        scientificLookupBtn.disabled = false;
        searchInput.disabled = false;
        searchInput.focus();
    }
}


function setupCareQuestionForm(history) {
    // 1. Remove previous listeners to prevent multiple execution
    careQuestionForm.removeEventListener('submit', handleCustomCareQuestion);
    careQuestionInput.removeEventListener('input', toggleQuestionSubmitButton);

    // 2. Add new listeners (must be done after modalContent is updated)
    careQuestionForm.addEventListener('submit', handleCustomCareQuestion);
    careQuestionInput.addEventListener('input', toggleQuestionSubmitButton);

    // 3. Reset Q&A input/loader state
    careQuestionInput.value = '';
    careQuestionSubmit.disabled = true;
    careQuestionInput.disabled = false;
    careResponseLoader.classList.add('hidden');
    
    // 4. Render or reset history text
    if (history && history.length > 0) {
        renderQaHistory(history);
    } else {
        careResponseText.textContent = 'Submit a question above to get customized AI care advice.';
        careResponseText.classList.remove('text-red-400');
        careResponseText.classList.remove('hidden');
    }

    // 5. Check auth state to control form interaction
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

/**
 * Renders the saved Q&A history into the response container.
 * @param {Array<object>} history - Array of {question, answer} objects.
 */
function renderQaHistory(history) {
    if (!history || history.length === 0) {
        careResponseText.textContent = 'Submit a question above to get customized AI care advice.';
        careResponseText.classList.remove('hidden');
        return;
    }
    
    // Clear the response text content
    careResponseText.innerHTML = '';
    careResponseText.classList.remove('hidden');

    const historyHtml = history.map(item => `
        <div class="mb-4 pb-4 border-b border-gray-600 last:border-b-0">
            <p class="text-base font-semibold text-white mb-2">Q: ${item.question}</p>
            <p class="text-sm text-gray-300 whitespace-pre-wrap">${item.answer.replace(/\n/g, '<br>')}</p>
        </div>
    `).join('');

    careResponseText.innerHTML = historyHtml;
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
    
    // Clear current text and show loader
    careResponseText.classList.add('hidden');
    careResponseLoader.classList.remove('hidden');

    try {
        const responseText = await fetchCustomCareAdvice(currentModalPlant, question);
        
        // 1. Save to state for persistence
        if (!currentModalPlant.qa_history) {
            currentModalPlant.qa_history = [];
        }
        currentModalPlant.qa_history.push({ 
            question: question, 
            answer: responseText 
        });

        // 2. Render all history
        renderQaHistory(currentModalPlant.qa_history);
        careResponseText.classList.remove('text-red-400');
        
        // 3. Auto-save if the plant is already saved to Firestore
        if (currentModalPlant.docId) {
            await savePlantToGarden(currentUser.uid, currentModalPlant, currentModalPlant.docId);
            console.log(`Auto-saved Q&A history for ${currentModalPlant.slug}`);
        }

    } catch (error) {
        console.error("Custom care question failed:", error);
        careResponseText.innerHTML = `
            <p class="text-red-400">Error: Could not get advice. ${error.message}</p>
            <p class="text-gray-400 mt-2">Previous Q&A history remains available.</p>
        `;
        careResponseText.classList.remove('hidden');
    } finally {
        // Restore UI state
        careResponseLoader.classList.add('hidden');
        careQuestionInput.disabled = false;
        careQuestionSubmit.textContent = originalSubmitText;
        // Keep submit button disabled if input is still empty, enabled otherwise
        careQuestionSubmit.disabled = careQuestionInput.value.trim().length === 0;
        careQuestionInput.value = ''; // Clear the input after submission
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
                // Re-render history or reset to placeholder if no history exists
                setupCareQuestionForm(currentModalPlant.qa_history); 
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
            // INITIAL STATE - Updated visual
            plantGallery.innerHTML = '<div class="col-span-full text-center py-10"><p class="text-gray-300 text-lg">Enter a search term above to begin your botanical journey.</p></div>';
            loader.classList.add('hidden');
            return;
        }
        
        currentLinks = results.links;
        currentMeta = results.meta;

        renderPlantGallery(results.data, plantGallery); // Render to main gallery
        renderPagination(results.links, results.meta);

    } catch (error) {
        console.error(error);
        plantGallery.innerHTML = '<div class="col-span-full text-center py-10"><p class="text-red-400">Could not load plants. Check console for errors.</p></div>';
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
    
    // Reset view to Gallery by default on load
    switchGardenMode('gallery');

    try {
        const savedPlants = await getGardenPlants(currentUser.uid);
        myGardenCache = savedPlants; // Cache for analytics switching
        
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

// --- NEW GARDEN ANALYTICS FUNCTIONS ---

function switchGardenMode(mode) {
    if (mode === 'gallery') {
        gardenGallery.classList.remove('hidden');
        gardenAnalytics.classList.add('hidden');
        viewGalleryBtn.classList.add('bg-green-600', 'text-white');
        viewGalleryBtn.classList.remove('text-gray-300');
        viewAnalyticsBtn.classList.remove('bg-green-600', 'text-white');
        viewAnalyticsBtn.classList.add('text-gray-300');
    } else {
        gardenGallery.classList.add('hidden');
        gardenAnalytics.classList.remove('hidden');
        viewAnalyticsBtn.classList.add('bg-green-600', 'text-white');
        viewAnalyticsBtn.classList.remove('text-gray-300');
        viewGalleryBtn.classList.remove('bg-green-600', 'text-white');
        viewGalleryBtn.classList.add('text-gray-300');
        
        renderAnalyticsView(myGardenCache);
    }
}

function renderAnalyticsView(plants) {
    if(!plants || plants.length === 0) return;

    gardenAnalytics.innerHTML = '';

    // --- 1. TEMPERATURE SENSITIVITY (Updated for Florida Climate) ---
    
    // Arrays for different risk categories
    const coldHardy = [];       // < 32F
    const coldSensitive = [];   // 32F - 40F
    const coldIntolerant = [];  // > 40F
    
    const heatSensitive = [];   // < 90F (needs afternoon shade/extra water)
    const heatTolerant = [];    // >= 90F (thrives in FL summer)

    plants.forEach(p => {
        const minTemp = parseInt(p.min_winter_temp_f);
        const maxTemp = parseInt(p.max_summer_temp_f);
        
        const plantObj = { name: p.common_name, slug: p.slug, min: p.min_winter_temp_f, max: p.max_summer_temp_f };

        // Cold Logic
        if (!isNaN(minTemp)) {
            if (minTemp < 32) {
                coldHardy.push(plantObj);
            } else if (minTemp >= 32 && minTemp <= 40) {
                coldSensitive.push(plantObj);
            } else {
                // > 40 degrees
                coldIntolerant.push(plantObj);
            }
        }

        // Heat Logic
        if (!isNaN(maxTemp)) {
            if (maxTemp < 90) {
                heatSensitive.push(plantObj);
            } else {
                heatTolerant.push(plantObj);
            }
        }
    });

    // Helper to generate list items
    const generateList = (list) => {
        if (list.length === 0) return '<p class="text-gray-500 italic text-sm">None</p>';
        return list.map(p => `
            <div class="analytics-plant-link flex justify-between items-center py-1 border-b border-white/5 last:border-0 cursor-pointer hover:bg-white/5 px-2 rounded transition-colors" data-slug="${p.slug}" data-name="${p.name}">
                <span class="text-gray-300 hover:text-white text-sm truncate pr-2">${p.name}</span>
                <span class="text-xs font-mono text-gray-500 whitespace-nowrap">${p.min || p.max}°F</span>
            </div>
        `).join('');
    };

    const tempHtml = `
        <div class="glass-panel p-6 rounded-xl border border-orange-500/30">
            <h3 class="text-xl font-bold text-orange-300 mb-6 flex items-center">
                <span class="mr-2">🌡️</span> Temperature Sensitivity (Florida Guide)
            </h3>
            
            <div class="mb-8">
                <h4 class="text-blue-300 font-bold mb-3 border-b border-blue-500/30 pb-2 flex items-center">
                    ❄️ Cold Tolerance
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <h5 class="text-sm font-semibold text-green-400 mb-2">❄️ Freeze Hardy (Survives < 32°F)</h5>
                        <div class="bg-gray-900/30 rounded-lg p-2 max-h-48 overflow-y-auto">
                            ${generateList(coldHardy)}
                        </div>
                    </div>
                    <div>
                        <h5 class="text-sm font-semibold text-yellow-400 mb-2">⚠️ Frost Sensitive (Protect at 32-40°F)</h5>
                        <div class="bg-gray-900/30 rounded-lg p-2 max-h-48 overflow-y-auto border border-yellow-500/20">
                            ${generateList(coldSensitive)}
                        </div>
                    </div>
                    <div>
                        <h5 class="text-sm font-semibold text-red-400 mb-2">🚫 Tropical / No Freeze (Keep > 40°F)</h5>
                        <div class="bg-gray-900/30 rounded-lg p-2 max-h-48 overflow-y-auto border border-red-500/20">
                            ${generateList(coldIntolerant)}
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <h4 class="text-orange-400 font-bold mb-3 border-b border-orange-500/30 pb-2 flex items-center">
                    ☀️ Heat Tolerance
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h5 class="text-sm font-semibold text-red-300 mb-2">Heat Sensitive (< 90°F)</h5>
                        <p class="text-xs text-gray-500 mb-2">Needs afternoon shade or extra water.</p>
                        <div class="bg-gray-900/30 rounded-lg p-2 max-h-48 overflow-y-auto">
                             ${generateList(heatSensitive)}
                        </div>
                    </div>
                    <div>
                        <h5 class="text-sm font-semibold text-green-400 mb-2">Heat Tolerant (90°F+)</h5>
                        <p class="text-xs text-gray-500 mb-2">Thrives in Florida summers.</p>
                        <div class="bg-gray-900/30 rounded-lg p-2 max-h-48 overflow-y-auto">
                             ${generateList(heatTolerant)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // --- 2. FERTILIZER GROUPS ---
    const fertilizerGroups = {};
    plants.forEach(p => {
        const info = (p.fertilizer_info || "").toLowerCase();
        let group = "General / Other";
        if (info.includes("acid")) group = "Acid Loving (Azalea/Camellia)";
        else if (info.includes("palm") || info.includes("citrus")) group = "Palms & Citrus";
        else if (info.includes("succulent") || info.includes("cactus")) group = "Succulents & Cacti";
        else if (info.includes("orchid")) group = "Orchids";
        else if (info.includes("balanced") || info.includes("10-10-10")) group = "Balanced Feeders";
        
        if (!fertilizerGroups[group]) fertilizerGroups[group] = [];
        fertilizerGroups[group].push({ name: p.common_name, slug: p.slug });
    });

    const fertilizerHtml = `
        <div class="glass-panel p-6 rounded-xl border border-green-500/30">
            <h3 class="text-xl font-bold text-green-400 mb-4 flex items-center">
                <span class="mr-2">🧪</span> Fertilizer Groups
            </h3>
            <div class="space-y-4">
                ${Object.entries(fertilizerGroups).map(([group, plantObjects]) => `
                    <div>
                        <h4 class="text-sm uppercase text-gray-400 font-bold mb-2">${group}</h4>
                        <div class="flex flex-wrap gap-2">
                            ${plantObjects.map(p => `<span class="analytics-plant-link px-2 py-1 bg-gray-800 rounded text-sm text-green-300 border border-gray-600 cursor-pointer hover:bg-gray-700 hover:text-white transition-colors" data-slug="${p.slug}" data-name="${p.name}">${p.name}</span>`).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    // --- 3. WATERING SCHEDULE ---
    const waterGroups = { 'Low': [], 'Medium': [], 'High': [] };
    plants.forEach(p => {
        const w = (p.watering || "").toLowerCase();
        const plantObj = { name: p.common_name, slug: p.slug };
        if (w.includes("low") || w.includes("minimum")) waterGroups['Low'].push(plantObj);
        else if (w.includes("high") || w.includes("frequent")) waterGroups['High'].push(plantObj);
        else waterGroups['Medium'].push(plantObj);
    });

    const waterHtml = `
        <div class="glass-panel p-6 rounded-xl border border-blue-500/30">
            <h3 class="text-xl font-bold text-blue-400 mb-4 flex items-center">
                <span class="mr-2">💧</span> Watering Needs
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <h4 class="text-blue-200 font-bold mb-3 border-b border-blue-500/30 pb-1">Low / Dry</h4>
                    <ul class="space-y-1 text-sm text-gray-300">
                        ${waterGroups['Low'].map(p => `<li class="analytics-plant-link cursor-pointer hover:text-blue-300 transition-colors" data-slug="${p.slug}" data-name="${p.name}">• ${p.name}</li>`).join('') || '<li class="text-gray-500 italic">None</li>'}
                    </ul>
                </div>
                <div>
                    <h4 class="text-blue-300 font-bold mb-3 border-b border-blue-500/30 pb-1">Medium</h4>
                    <ul class="space-y-1 text-sm text-gray-300">
                         ${waterGroups['Medium'].map(p => `<li class="analytics-plant-link cursor-pointer hover:text-blue-300 transition-colors" data-slug="${p.slug}" data-name="${p.name}">• ${p.name}</li>`).join('') || '<li class="text-gray-500 italic">None</li>'}
                    </ul>
                </div>
                <div>
                    <h4 class="text-blue-400 font-bold mb-3 border-b border-blue-500/30 pb-1">High / Wet</h4>
                    <ul class="space-y-1 text-sm text-gray-300">
                         ${waterGroups['High'].map(p => `<li class="analytics-plant-link cursor-pointer hover:text-blue-300 transition-colors" data-slug="${p.slug}" data-name="${p.name}">• ${p.name}</li>`).join('') || '<li class="text-gray-500 italic">None</li>'}
                    </ul>
                </div>
            </div>
        </div>
    `;

    gardenAnalytics.innerHTML = tempHtml + waterHtml + fertilizerHtml;
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
        container.innerHTML = '<div class="col-span-full text-center py-10"><p class="text-gray-300">No plants found for this search.</p></div>';
        return;
    }

    plants.forEach(plant => {
        const card = document.createElement('div');
        // UPDATED CLASS: glass-panel, rounded-xl, hover-glow
        card.className = 'plant-card glass-panel rounded-xl overflow-hidden cursor-pointer transition-transform hover:scale-105 hover-glow';
        card.dataset.slug = plant.slug;
        card.dataset.name = plant.common_name;

        // UPDATED IMAGE CLASS: fixed height h-48 for smaller/more uniform cards
        card.innerHTML = `
            <img src="${plant.image_url}" alt="${plant.common_name}" class="w-full h-48 object-cover">
            <div class="p-3">
                <h3 class="text-lg font-semibold text-white drop-shadow-sm truncate">${plant.common_name}</h3>
                <p class="text-gray-400 text-xs italic truncate">${plant.scientific_name}</p>
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
        
        care_plan: geminiData.care_plan,

        // --- NEW ENVIRONMENTAL & HAZARD FIELDS ---
        pests_and_diseases: geminiData.pests_and_diseases,
        min_winter_temp_f: geminiData.min_winter_temp_f,
        max_summer_temp_f: geminiData.max_summer_temp_f,
        frost_sensitivity: geminiData.frost_sensitivity,

        // --- NEW MAINTENANCE & SAFETY FIELDS ---
        fertilizer_info: geminiData.fertilizer_info,
        pruning_season: geminiData.pruning_season,
        propagation_methods: geminiData.propagation_methods,
        toxicity_info: geminiData.toxicity_info
        // --- END NEW FIELDS ---
    };

    return finalData;
}

// --- NEW UPDATE PHOTO FUNCTION ---
async function handleUpdatePhoto(e) {
    const file = e.target.files[0];
    if (!file || !currentModalPlant || !currentUser) return;

    // UI Feedback
    const originalText = updateImageBtn.textContent;
    updateImageBtn.disabled = true;
    updateImageBtn.textContent = 'Uploading...';

    try {
        // 1. Upload new image
        const newImageUrl = await uploadPlantImage(file, currentUser.uid);
        
        // 2. Update local state
        currentModalPlant.image_url = newImageUrl;

        // 3. Update Firestore
        // We ensure we pass the existing docId to update, not create
        await savePlantToGarden(currentUser.uid, currentModalPlant, currentModalPlant.docId);

        // 4. Update DOM immediately
        const modalImg = modalContent.querySelector('img');
        if (modalImg) {
            modalImg.src = newImageUrl;
        }

        alert("Photo updated successfully!");

    } catch (error) {
        console.error("Update photo failed:", error);
        alert(`Failed to update photo: ${error.message}`);
    } finally {
        updateImageBtn.disabled = false;
        updateImageBtn.textContent = originalText;
        updateImageInput.value = ''; // Reset input to allow re-selection of same file if needed
    }
}

// --- NEW REFRESH FUNCTION ---
async function handleRefreshData() {
    if (!currentModalPlant || !currentModalPlant.docId || !currentUser) return;

    // UI Feedback
    const originalText = refreshPlantBtn.innerHTML;
    refreshPlantBtn.disabled = true;
    refreshPlantBtn.innerHTML = '↻ Updating...';

    try {
        console.log(`Refreshing data for ${currentModalPlant.slug}...`);
        
        // 1. Fetch fresh Trefle Data
        const trefleData = await getPlantDetails(currentModalPlant.slug);
        if (!trefleData) throw new Error("Could not fetch fresh Trefle data.");

        // 2. Fetch fresh Gemini Data
        const geminiData = await fetchAugmentedPlantData(trefleData);

        // 3. Merge
        const freshPlantData = mergePlantData(trefleData, geminiData);

        // 4. Restore Persistence & User State
        freshPlantData.docId = currentModalPlant.docId;
        freshPlantData.qa_history = currentModalPlant.qa_history || [];
        
        // --- PRESERVE CUSTOM IMAGE LOGIC ---
        // If the OLD image was a custom upload (contains 'firebasestorage'), keep it.
        // Trefle data would try to overwrite it with the stock image otherwise.
        if (currentModalPlant.image_url && currentModalPlant.image_url.includes('firebasestorage')) {
            freshPlantData.image_url = currentModalPlant.image_url;
        } else if (!freshPlantData.image_url && currentModalPlant.image_url) {
            // Fallback: If fresh data has NO image, but we had one, keep the old one.
            freshPlantData.image_url = currentModalPlant.image_url;
        }

        // 5. Update Firestore
        await savePlantToGarden(currentUser.uid, freshPlantData, freshPlantData.docId);

        // 6. Update Global State
        currentModalPlant = freshPlantData;

        // 7. Re-render Modal
        const articleHtml = createPlantDetailHtml(currentModalPlant);
        modalContent.innerHTML = articleHtml;
        modalTitle.textContent = currentModalPlant.common_name || currentModalPlant.scientific_name;

        // 8. Re-append Q&A Section
        const qaSectionClone = careQuestionSection; // Reference to the global element
        careQuestionSection.classList.remove('hidden'); // Ensure it's visible
        modalContent.appendChild(qaSectionClone);
        setupCareQuestionForm(currentModalPlant.qa_history);

        alert("Plant data refreshed and saved successfully!");

    } catch (error) {
        console.error("Refresh failed:", error);
        alert(`Failed to refresh data: ${error.message}`);
    } finally {
        refreshPlantBtn.disabled = false;
        refreshPlantBtn.innerHTML = originalText;
    }
}

/**
 * NEW: Delegated handler for analytics items
 */
function handleAnalyticsItemClick(e) {
    const target = e.target.closest('.analytics-plant-link');
    if (!target) return;

    const { slug, name } = target.dataset;
    console.log(`Analytics item clicked: ${name} (${slug})`);
    openPlantModal(slug, name);
}

/**
 * Delegated handler for gallery cards
 */
function handlePlantCardClick(e) {
    const card = e.target.closest('.plant-card');
    if (!card) return;

    const { slug, name } = card.dataset;
    console.log(`Card clicked: ${name} (slug: ${slug})`);
    openPlantModal(slug, name);
}

/**
 * REFACTORED: Unified function to open the modal for any plant slug
 */
async function openPlantModal(slug, name) {
    plantDetailModal.classList.remove('hidden');
    modalContent.classList.add('hidden');
    modalLoader.classList.remove('hidden');
    modalTitle.textContent = name || "Loading...";
    modalLoader.querySelector('p').textContent = 'Loading plant details...';
    
    // Default: Hide Refresh & Update Image buttons until we confirm it's a saved plant
    refreshPlantBtn.classList.add('hidden');
    updateImageBtn.classList.add('hidden');

    // --- Q&A Management START: Extract and prepare the form element ---
    // Clone the static Q&A form element
    const qaSectionClone = careQuestionSection.cloneNode(true);
    // Hide it immediately until data is loaded
    careQuestionSection.classList.add('hidden'); 
    
    // Clear modal content (removes dynamic content)
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
            // getSavedPlant now returns { plantData, docId }
            const savedResult = await getSavedPlant(currentUser.uid, slug);
            
            // If we have the plant AND it has a care_plan, we know it's the full Augmented version
            if (savedResult.plantData && savedResult.plantData.care_plan) {
                console.log("Loaded from Garden (Skipped APIs)");
                currentModalPlant = { ...savedResult.plantData, docId: savedResult.docId };
                
                // Render immediately
                const articleHtml = createPlantDetailHtml(currentModalPlant);
                modalTitle.textContent = currentModalPlant.common_name || currentModalPlant.scientific_name;
                modalContent.innerHTML = articleHtml;
                
                // Update button to "Remove" state
                updateSaveButtonState(true);
                savePlantBtn.classList.remove('hidden');
                refreshPlantBtn.classList.remove('hidden'); // SHOW REFRESH BUTTON
                updateImageBtn.classList.remove('hidden');  // SHOW UPDATE PHOTO BUTTON
                
                // --- Q&A Management: Re-append and set up ---
                modalContent.appendChild(qaSectionClone);
                setupCareQuestionForm(currentModalPlant.qa_history);
                
                // Skip the rest of the function
                modalLoader.classList.add('hidden');
                modalContent.classList.remove('hidden');
                modalContentContainer.scrollTop = 0;
                return;
            }
            
            // If found but partial data (legacy save), or not found, update status boolean
            if (savedResult.plantData) isSaved = true;
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
        // Initialize history for a newly fetched plant
        currentModalPlant.qa_history = [];

        // Render
        const articleHtml = createPlantDetailHtml(currentModalPlant);
        
        modalTitle.textContent = currentModalPlant.common_name || currentModalPlant.scientific_name;
        modalContent.innerHTML = articleHtml;
        
        // --- Q&A Management: Re-append and set up ---
        modalContent.appendChild(qaSectionClone);
        setupCareQuestionForm(currentModalPlant.qa_history);

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
    // Note: Since currentModalPlant now holds the potentially updated qa_history AND docId, 
    // saving the whole object handles persistence automatically.
    if (!currentUser || !currentModalPlant) return;
    
    const action = savePlantBtn.dataset.action;
    const originalText = savePlantBtn.textContent;
    savePlantBtn.disabled = true;
    savePlantBtn.textContent = '...';

    try {
        if (action === 'save') {
            const newDocId = await savePlantToGarden(currentUser.uid, currentModalPlant, currentModalPlant.docId);
            // Ensure the docId is stored if it was a new save
            currentModalPlant.docId = newDocId; 
            updateSaveButtonState(true);
            refreshPlantBtn.classList.remove('hidden'); // Show refresh button after saving
            updateImageBtn.classList.remove('hidden');  // Show update photo button
        } else {
            await removePlantFromGarden(currentUser.uid, currentModalPlant.slug);
            // Clear docId and reset state after removal
            currentModalPlant.docId = null;
            updateSaveButtonState(false);
            refreshPlantBtn.classList.add('hidden'); // Hide refresh button
            updateImageBtn.classList.add('hidden');  // Hide update photo button
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

    // --- UPDATED: Rich HTML Layout with Split View for Dense Information ---
    return `
        <div class="flex flex-col lg:flex-row gap-8 mb-8">
            <div class="w-full lg:w-1/3 flex-shrink-0">
                <img src="${get(plantData.image_url)}" alt="${get(plantData.common_name)}" class="w-full rounded-xl shadow-lg object-cover bg-gray-900/50">
            </div>

            <div class="w-full lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-6 content-start">
                
                <div class="bg-gray-800/50 backdrop-blur-sm p-5 rounded-xl border border-white/10 h-fit">
                    <h3 class="flex items-center text-xl font-bold text-green-400 mb-4 pb-2 border-b border-gray-600">
                        <span class="mr-2">🔬</span> Scientific Classification
                    </h3>
                    <ul class="space-y-3 text-gray-200">
                        <li class="flex justify-between">
                            <span class="text-gray-300">Scientific Name</span>
                            <span class="font-medium italic text-right">${get(plantData.scientific_name)}</span>
                        </li>
                        <li class="flex justify-between">
                            <span class="text-gray-300">Family</span>
                            <span class="font-medium text-right">${get(plantData.family_common_name)}</span>
                        </li>
                        <li class="flex justify-between">
                            <span class="text-gray-300">Genus</span>
                            <span class="font-medium text-right">${get(plantData.genus_name)}</span>
                        </li>
                    </ul>
                </div>

                <div class="bg-gray-800/50 backdrop-blur-sm p-5 rounded-xl border border-white/10 h-fit">
                    <h3 class="flex items-center text-xl font-bold text-green-400 mb-4 pb-2 border-b border-gray-600">
                        <span class="mr-2">🌿</span> Characteristics
                    </h3>
                    <ul class="space-y-3 text-gray-200">
                        <li class="flex justify-between items-center">
                            <span class="text-gray-300">Form</span>
                            <span class="font-medium text-right">${get(plantData.growth_form)}</span>
                        </li>
                        <li class="flex justify-between items-center">
                            <span class="text-gray-300">Sunlight</span>
                            <span class="font-medium text-right flex items-center gap-1">☀️ ${get(plantData.sunlight)}</span>
                        </li>
                        <li class="flex justify-between items-center">
                            <span class="text-gray-300">Watering</span>
                            <span class="font-medium text-right flex items-center gap-1">💧 ${get(plantData.watering)}</span>
                        </li>
                        <li class="flex justify-between items-center">
                            <span class="text-gray-300">Edible</span>
                            <span class="px-2 py-0.5 rounded text-xs font-bold ${String(plantData.edible) === 'true' ? 'bg-green-900 text-green-300' : 'bg-gray-600 text-gray-300'}">
                                ${get(plantData.edible, 'N/A')}
                            </span>
                        </li>
                    </ul>
                </div>

                <div class="md:col-span-2 bg-gray-800/50 backdrop-blur-sm p-5 rounded-xl border border-white/10 h-fit">
                    <h3 class="flex items-center text-xl font-bold text-orange-400 mb-4 pb-2 border-b border-gray-600">
                        <span class="mr-2">🌡️</span> Temperature Limits
                    </h3>
                    <ul class="space-y-3 text-gray-200">
                        <li class="flex justify-between items-center">
                            <span class="text-gray-300">Min Winter Temp</span>
                            <span class="font-medium text-right text-blue-300">${get(plantData.min_winter_temp_f)}°F</span>
                        </li>
                        <li class="flex justify-between items-center">
                            <span class="text-gray-300">Max Summer Temp</span>
                            <span class="font-medium text-right text-orange-300">${get(plantData.max_summer_temp_f)}°F</span>
                        </li>
                        <li class="flex flex-col mt-2">
                            <span class="text-gray-300 text-sm mb-1">Frost Sensitivity</span>
                            <span class="font-medium italic text-gray-400">${get(plantData.frost_sensitivity)}</span>
                        </li>
                    </ul>
                </div>

                <div class="md:col-span-2 bg-gray-800/50 backdrop-blur-sm p-5 rounded-xl border border-white/10 h-fit">
                    <h3 class="flex items-center text-xl font-bold text-green-400 mb-4 pb-2 border-b border-gray-600">
                        <span class="mr-2">🛡️</span> Maintenance & Safety
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                         <div class="flex flex-col">
                            <span class="text-gray-400 text-sm">Fertilizer</span>
                            <span class="font-medium">${get(plantData.fertilizer_info)}</span>
                         </div>
                         <div class="flex flex-col">
                            <span class="text-gray-400 text-sm">Pruning</span>
                            <span class="font-medium">${get(plantData.pruning_season)}</span>
                         </div>
                         <div class="flex flex-col">
                            <span class="text-gray-400 text-sm">Propagation</span>
                            <span class="font-medium">${get(plantData.propagation_methods)}</span>
                         </div>
                         <div class="flex flex-col">
                            <span class="text-gray-400 text-sm">Toxicity</span>
                            <span class="font-medium text-yellow-200">${get(plantData.toxicity_info)}</span>
                         </div>
                    </div>
                </div>

            </div>
        </div>

        <div class="bg-green-900/40 backdrop-blur-sm border-l-4 border-green-500 p-6 rounded-r-xl mb-8 shadow-lg">
            <h3 class="flex items-center text-xl font-bold text-white mb-3 drop-shadow-md">
                <span class="mr-2">🤖</span> AI Care Plan (Detailed)
            </h3>
            <p class="text-gray-200 leading-relaxed whitespace-pre-wrap m-0">${get(plantData.care_plan, 'No care plan available.')}</p>
        </div>
        
        <div class="bg-red-900/40 backdrop-blur-sm border-l-4 border-red-500 p-6 rounded-r-xl mb-8 shadow-lg">
            <h3 class="flex items-center text-xl font-bold text-white mb-3 drop-shadow-md">
                <span class="mr-2">🐞</span> Pests & Diseases
            </h3>
            <p class="text-gray-200 leading-relaxed whitespace-pre-wrap m-0">${get(plantData.pests_and_diseases, 'No specific pest information available.')}</p>
        </div>

        <div class="bg-gray-800/60 backdrop-blur-sm p-6 rounded-xl border border-white/10">
            <h3 class="flex items-center text-xl font-bold text-white mb-3 drop-shadow-md">
                <span class="mr-2">🗺️</span> Native Distributions
            </h3>
            <p class="text-gray-300 text-sm leading-relaxed">
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
