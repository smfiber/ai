/*
 * APP.JS
 * The Controller for the "Life Explorer" SPA.
 * Connects the UI to the GBIF/Gemini Engine.
 */

import { setApiKeys } from './config.js';
import { 
    initFirebase, 
    signInWithGoogle, 
    signOutUser,
    getCategorySpecimens,
    searchSpecimens,
    getSpecimenDetails,
    fetchAugmentedSpecimenData,
    fetchCustomCareAdvice,
    fetchScientificNameLookup,
    fetchCollectionSuggestions,
    fetchImageIdentification,
    saveSpecimen,
    removeSpecimen,
    getSavedSpecimens,
    getSavedSpecimen,
    uploadSpecimenImage,
    saveUserCollection,
    getUserCollections,
    deleteUserCollection
} from './api.js';

// --- DOM Variables ---
let modalBackdrop, apiKeyForm, appContainer, mainContent, authContainer,
    signInBtn, signOutBtn, userInfo, userName, userPhoto, mySanctuaryBtn, 
    searchForm, searchInput, specimenGalleryContainer, specimenGallery, loader,
    paginationContainer, prevBtn, nextBtn, pageInfo,
    specimenDetailModal, modalTitle, modalCloseBtn, modalContentContainer,
    modalLoader, modalContent, saveSpecimenBtn,
    sanctuaryView, backToSearchBtn, sanctuaryLoader, sanctuaryGallery, sanctuaryEmptyState,
    careQuestionSection, careQuestionForm, careQuestionInput, careQuestionSubmit,
    careResponseContainer, careResponseText, careResponseLoader, scientificLookupBtn,
    aiSuggestionsContainer, aiSuggestionsList, aiSuggestionsLoader,
    identifySpecimenBtn, imageUploadModal, imageModalCloseBtn, imageUploadForm,
    imageFileInput, imagePreviewContainer, imagePreview, previewPlaceholder,
    uploadStatus, uploadMessage, identifyImageBtn,
    refreshSpecimenBtn, updateImageBtn, updateImageInput,
    collectionsContainer, collectionsGrid, galleryHeader, galleryTitle, backToCollectionsBtn,
    customCollectionsContainer, customCollectionsGrid,
    collectionModal, collectionModalTitle, collectionModalCloseBtn, collectionForm, 
    collectionIdInput, collectionTitleInput, collectionQueryInput, saveCollectionBtn,
    collectionFileInput, collectionImagePreview, collectionPreviewPlaceholder, collectionImageUrlInput;

// --- State ---
let currentSearchQuery = null;
let currentCollectionKey = null;
let currentPage = 1;
let currentMeta = null;
let currentUser = null; 
let currentModalSpecimen = null; 
let customCollections = []; 

const ANIMAL_COLLECTIONS = [
    { id: 359, title: 'Mammals', subtitle: 'Warm-blooded vertebrates', image: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=600&q=80', key: 359 },
    { id: 212, title: 'Birds', subtitle: 'Feathered friends', image: 'https://images.unsplash.com/photo-1444464666168-49d633b86797?auto=format&fit=crop&w=600&q=80', key: 212 },
    { id: 358, title: 'Reptiles', subtitle: 'Scaly & cold-blooded', image: 'https://images.unsplash.com/photo-1533743983669-94fa5c4338ec?auto=format&fit=crop&w=600&q=80', key: 358 },
    { id: 131, title: 'Amphibians', subtitle: 'Frogs & Salamanders', image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=600&q=80', key: 131 }
];

function main() {
    document.addEventListener('DOMContentLoaded', () => {
        assignDomElements();
        addEventListeners();
        console.log("Life Explorer ready.");
        renderCollections();
        renderCustomCollections(); 
        careQuestionSection.classList.add('hidden');
    });
}

function assignDomElements() {
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
    mySanctuaryBtn = document.getElementById('my-sanctuary-btn'); 
    searchForm = document.getElementById('search-form');
    searchInput = document.getElementById('search-input');
    scientificLookupBtn = document.getElementById('scientific-lookup-btn');
    collectionsContainer = document.getElementById('collections-container');
    collectionsGrid = document.getElementById('collections-grid');
    customCollectionsContainer = document.getElementById('custom-collections-container');
    customCollectionsGrid = document.getElementById('custom-collections-grid');
    galleryHeader = document.getElementById('gallery-header');
    galleryTitle = document.getElementById('gallery-title');
    backToCollectionsBtn = document.getElementById('back-to-collections-btn');
    specimenGalleryContainer = document.getElementById('specimen-gallery-container');
    specimenGallery = document.getElementById('specimen-gallery');
    loader = document.getElementById('loader');
    aiSuggestionsContainer = document.getElementById('ai-suggestions-container');
    aiSuggestionsList = document.getElementById('ai-suggestions-list');
    aiSuggestionsLoader = document.getElementById('ai-suggestions-loader');
    specimenDetailModal = document.getElementById('specimen-detail-modal');
    modalTitle = document.getElementById('modal-title');
    modalCloseBtn = document.getElementById('modal-close-btn');
    modalContentContainer = document.getElementById('modal-content-container');
    modalLoader = document.getElementById('modal-loader');
    modalContent = document.getElementById('modal-content');
    saveSpecimenBtn = document.getElementById('save-specimen-btn');
    refreshSpecimenBtn = document.getElementById('refresh-specimen-btn');
    updateImageBtn = document.getElementById('update-image-btn');
    updateImageInput = document.getElementById('update-image-input');
    paginationContainer = document.getElementById('pagination-container');
    prevBtn = document.getElementById('prev-btn');
    nextBtn = document.getElementById('next-btn');
    pageInfo = document.getElementById('page-info');
    sanctuaryView = document.getElementById('sanctuary-view');
    backToSearchBtn = document.getElementById('back-to-search-btn');
    sanctuaryLoader = document.getElementById('sanctuary-loader');
    sanctuaryGallery = document.getElementById('sanctuary-gallery');
    sanctuaryEmptyState = document.getElementById('sanctuary-empty-state');
    careQuestionSection = document.getElementById('care-question-section');
    careQuestionForm = document.getElementById('care-question-form');
    careQuestionInput = document.getElementById('care-question-input');
    careQuestionSubmit = document.getElementById('care-question-submit');
    careResponseContainer = document.getElementById('care-response-container');
    careResponseText = document.getElementById('care-response-text');
    careResponseLoader = document.getElementById('care-response-loader');
    identifySpecimenBtn = document.getElementById('identify-specimen-btn');
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
    collectionModal = document.getElementById('collection-modal');
    collectionModalTitle = document.getElementById('collection-modal-title');
    collectionModalCloseBtn = document.getElementById('collection-modal-close-btn');
    collectionForm = document.getElementById('collection-form');
    collectionIdInput = document.getElementById('collection-id');
    collectionTitleInput = document.getElementById('collection-title');
    collectionQueryInput = document.getElementById('collection-query');
    saveCollectionBtn = document.getElementById('save-collection-btn');
    collectionFileInput = document.getElementById('collection-file-input');
    collectionImagePreview = document.getElementById('collection-image-preview');
    collectionPreviewPlaceholder = document.getElementById('collection-preview-placeholder');
    collectionImageUrlInput = document.getElementById('collection-image-url');
}

function addEventListeners() {
    apiKeyForm.addEventListener('submit', handleApiKeySubmit);
    signInBtn.addEventListener('click', handleGoogleSignIn);
    signOutBtn.addEventListener('click', handleGoogleSignOut);
    mySanctuaryBtn.addEventListener('click', showSanctuaryView);
    backToSearchBtn.addEventListener('click', showDiscoveryView);
    backToCollectionsBtn.addEventListener('click', returnToCollections);
    searchForm.addEventListener('submit', handleSearchSubmit);
    scientificLookupBtn.addEventListener('click', handleScientificLookup);
    
    // Pagination Listeners (FIXED)
    prevBtn.addEventListener('click', handlePrevClick);
    nextBtn.addEventListener('click', handleNextClick);

    // Gallery Click Listeners (FIXED)
    specimenGallery.addEventListener('click', handleSpecimenCardClick);
    sanctuaryGallery.addEventListener('click', handleSpecimenCardClick);
    collectionsGrid.addEventListener('click', handleCollectionCardClick);
    
    if (customCollectionsGrid) {
        customCollectionsGrid.addEventListener('click', handleCustomCollectionsGridClick);
    }

    modalCloseBtn.addEventListener('click', closeModal);
    specimenDetailModal.addEventListener('click', (e) => {
        if (e.target === specimenDetailModal) closeModal();
    });
    saveSpecimenBtn.addEventListener('click', handleSaveToggle);
    refreshSpecimenBtn.addEventListener('click', handleRefreshData);
    updateImageBtn.addEventListener('click', () => updateImageInput.click());
    updateImageInput.addEventListener('change', handleUpdatePhoto);
    identifySpecimenBtn.addEventListener('click', openImageUploadModal);
    imageModalCloseBtn.addEventListener('click', closeImageUploadModal);
    imageUploadForm.addEventListener('submit', handleImageUpload);
    imageFileInput.addEventListener('change', handleImageFileChange);
    collectionModalCloseBtn.addEventListener('click', closeCollectionModal);
    collectionForm.addEventListener('submit', handleSaveCollection);
    collectionFileInput.addEventListener('change', handleCollectionFileChange);
}

// --- NAVIGATION HANDLERS ---

function handlePrevClick() {
    if (currentPage > 1) {
        currentPage--;
        fetchAndRenderSpecimens();
    }
}

function handleNextClick() {
    currentPage++;
    fetchAndRenderSpecimens();
}

function handleSpecimenCardClick(e) {
    const card = e.target.closest('.specimen-card');
    if (!card) return;
    const { slug, name } = card.dataset;
    openSpecimenModal(slug, name);
}

// --- RENDER FUNCTIONS ---

function renderCollections() {
    collectionsGrid.innerHTML = ANIMAL_COLLECTIONS.map(col => `
        <div class="collection-card glass-panel rounded-xl overflow-hidden cursor-pointer hover:scale-105 hover-glow transition-transform group" data-key="${col.key}" data-title="${col.title}">
            <div class="h-32 w-full overflow-hidden card-image-wrapper">
                <img src="${col.image}" alt="${col.title}" class="w-full h-full object-cover">
            </div>
            <div class="p-4">
                <h3 class="text-lg font-bold text-white group-hover:text-green-400 transition-colors">${col.title}</h3>
                <p class="text-sm text-gray-400">${col.subtitle}</p>
            </div>
        </div>
    `).join('');
}

function renderCustomCollections() {
    const customHtml = customCollections.map(col => `
        <div class="collection-card glass-panel rounded-xl overflow-hidden cursor-pointer hover:scale-105 hover-glow transition-transform group relative" data-query="${col.query}" data-title="${col.title}">
            <div class="h-32 w-full overflow-hidden card-image-wrapper">
                <img src="${col.image}" alt="${col.title}" class="w-full h-full object-cover">
                <div class="absolute top-2 right-2 z-20 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button class="delete-collection-btn bg-red-600 p-1.5 rounded text-white hover:bg-red-500" data-id="${col.id}" data-title="${col.title}">×</button>
                </div>
            </div>
            <div class="p-4">
                <h3 class="text-lg font-bold text-white group-hover:text-green-400 transition-colors">${col.title}</h3>
                <p class="text-sm text-gray-400">Custom Search</p>
            </div>
        </div>
    `).join('');

    let addBtnHtml = '';
    if (currentUser) {
        addBtnHtml = `
            <div id="add-collection-btn" class="glass-panel rounded-xl overflow-hidden cursor-pointer hover:scale-105 hover-glow transition-transform flex flex-col items-center justify-center min-h-[200px] border-2 border-dashed border-gray-600 hover:border-green-500 group">
                <div class="text-5xl text-gray-600 group-hover:text-green-500 mb-2 transition-colors">+</div>
                <span class="text-gray-400 font-medium group-hover:text-green-400 transition-colors">Add Search</span>
            </div>
        `;
    }

    customCollectionsGrid.innerHTML = customHtml + addBtnHtml;
}

function renderSpecimenGallery(specimens, container) {
    container.innerHTML = '';
    if (specimens.length === 0 && container === specimenGallery) {
        container.innerHTML = '<div class="col-span-full text-center py-10"><p class="text-gray-300">No specimens found.</p></div>';
        return;
    }

    specimens.forEach(specimen => {
        const card = document.createElement('div');
        card.className = 'specimen-card glass-panel rounded-xl overflow-hidden cursor-pointer transition-transform hover:scale-105 hover-glow';
        card.dataset.slug = specimen.slug;
        card.dataset.name = specimen.common_name;

        // Better placeholder
        const placeholder = 'https://placehold.co/400x300/374151/FFFFFF?text=No+Image';
        const displayImage = specimen.image_url || placeholder;

        card.innerHTML = `
            <div class="w-full h-48 card-image-wrapper">
                <img src="${displayImage}" 
                     alt="${specimen.common_name}" 
                     class="w-full h-full object-cover"
                     onerror="this.onerror=null;this.src='${placeholder}';"
                >
            </div>
            <div class="p-3">
                <h3 class="text-lg font-semibold text-white drop-shadow-sm truncate">${specimen.common_name}</h3>
                <p class="text-gray-400 text-xs italic truncate">${specimen.scientific_name}</p>
            </div>
        `;
        container.appendChild(card);
    });
}

function renderPagination(meta) {
    if (!meta || meta.endOfRecords) {
        if (currentPage === 1) paginationContainer.classList.add('hidden');
        nextBtn.disabled = true;
    } else {
        paginationContainer.classList.remove('hidden');
        nextBtn.disabled = false;
    }
    prevBtn.disabled = currentPage === 1;
    pageInfo.textContent = `Page ${currentPage}`;
}

// --- FETCHING & LOGIC ---

async function fetchAndRenderSpecimens() {
    loader.classList.remove('hidden');
    specimenGallery.innerHTML = '';
    paginationContainer.classList.add('hidden');

    try {
        let results = { data: [], meta: {} };

        if (currentCollectionKey) {
            results = await getCategorySpecimens(currentCollectionKey, currentPage);
        } else if (currentSearchQuery) {
            results = await searchSpecimens(currentSearchQuery, currentPage);
        }
        
        currentMeta = results.meta;
        renderSpecimenGallery(results.data, specimenGallery);
        renderPagination(results.meta);

    } catch (error) {
        console.error(error);
        specimenGallery.innerHTML = '<div class="col-span-full text-center py-10"><p class="text-red-400">Error loading specimens.</p></div>';
    } finally {
        loader.classList.add('hidden');
    }
}

function handleCollectionCardClick(e) {
    const card = e.target.closest('.collection-card');
    if (!card) return;
    const key = card.dataset.key; 
    const title = card.dataset.title;

    currentPage = 1;
    currentCollectionKey = key;
    currentSearchQuery = null;

    collectionsContainer.classList.add('hidden');
    customCollectionsContainer.classList.add('hidden');
    galleryHeader.classList.remove('hidden');
    galleryTitle.textContent = title;
    backToCollectionsBtn.classList.remove('hidden');
    
    fetchAndRenderSpecimens();
}

function handleCustomCollectionsGridClick(e) {
    if (e.target.closest('#add-collection-btn')) {
        openCollectionModal();
        return;
    }
    const deleteBtn = e.target.closest('.delete-collection-btn');
    if (deleteBtn) {
        e.stopPropagation();
        const { id, title } = deleteBtn.dataset;
        if (confirm(`Delete "${title}"?`)) {
            deleteUserCollection(currentUser.uid, id).then(loadUserCollections);
        }
        return;
    }
    const card = e.target.closest('.collection-card');
    if (card) {
        const query = card.dataset.query;
        const title = card.dataset.title;
        currentPage = 1;
        currentSearchQuery = query;
        currentCollectionKey = null;
        collectionsContainer.classList.add('hidden');
        customCollectionsContainer.classList.add('hidden');
        galleryHeader.classList.remove('hidden');
        galleryTitle.textContent = title;
        backToCollectionsBtn.classList.remove('hidden');
        fetchAndRenderSpecimens();
        loadCollectionSuggestions(query);
    }
}

function handleSearchSubmit(e) {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (query === currentSearchQuery) return;
    currentSearchQuery = query;
    currentCollectionKey = null;
    currentPage = 1;
    collectionsContainer.classList.add('hidden');
    customCollectionsContainer.classList.add('hidden');
    galleryHeader.classList.remove('hidden');
    galleryTitle.textContent = `Search: "${query}"`;
    backToCollectionsBtn.classList.remove('hidden');
    fetchAndRenderSpecimens();
}

async function handleScientificLookup() {
    const common = searchInput.value.trim();
    if (!common) return alert("Enter a common name first.");
    scientificLookupBtn.textContent = 'Thinking...';
    try {
        const sciName = await fetchScientificNameLookup(common);
        if (sciName) searchInput.value = sciName;
        else alert("Could not find scientific name.");
    } catch (e) { console.error(e); } finally {
        scientificLookupBtn.textContent = 'AI Sci. Name';
    }
}

// --- MODAL & DETAILS ---

async function openSpecimenModal(slug, name) {
    specimenDetailModal.classList.remove('hidden');
    modalContent.classList.add('hidden');
    modalLoader.classList.remove('hidden');
    modalTitle.textContent = name || "Loading...";
    refreshSpecimenBtn.classList.add('hidden');
    updateImageBtn.classList.add('hidden');
    modalContent.innerHTML = '';
    const qaSectionClone = careQuestionSection.cloneNode(true);
    careQuestionSection.classList.add('hidden'); 
    saveSpecimenBtn.classList.add('hidden');
    saveSpecimenBtn.textContent = 'Save to Sanctuary';
    saveSpecimenBtn.classList.remove('bg-red-600');
    saveSpecimenBtn.classList.add('bg-green-600');

    try {
        let isSaved = false;
        if (currentUser) {
            modalLoader.querySelector('p').textContent = 'Checking sanctuary...';
            const savedResult = await getSavedSpecimen(currentUser.uid, slug);
            if (savedResult.data && savedResult.data.diet) {
                currentModalSpecimen = { ...savedResult.data, docId: savedResult.docId };
                modalTitle.textContent = currentModalSpecimen.common_name;
                modalContent.innerHTML = createSpecimenDetailHtml(currentModalSpecimen);
                updateSaveButtonState(true);
                saveSpecimenBtn.classList.remove('hidden');
                refreshSpecimenBtn.classList.remove('hidden'); 
                updateImageBtn.classList.remove('hidden'); 
                modalContent.appendChild(qaSectionClone);
                setupCareQuestionForm(currentModalSpecimen.qa_history);
                modalLoader.classList.add('hidden');
                modalContent.classList.remove('hidden');
                return;
            }
            if (savedResult.data) isSaved = true;
        }

        if (currentUser) {
             updateSaveButtonState(isSaved);
             saveSpecimenBtn.classList.remove('hidden');
        }

        modalLoader.querySelector('p').textContent = 'Fetching GBIF Taxonomy...';
        const gbifData = await getSpecimenDetails(slug);
        if (!gbifData) throw new Error("Could not fetch specimen details.");

        modalLoader.querySelector('p').textContent = 'Consulting the Zoologist (AI)...';
        const geminiData = await fetchAugmentedSpecimenData(gbifData);

        currentModalSpecimen = { ...gbifData, ...geminiData, qa_history: [] };
        if (name && currentModalSpecimen.common_name === currentModalSpecimen.scientific_name) {
            currentModalSpecimen.common_name = name;
        }

        modalTitle.textContent = currentModalSpecimen.common_name;
        modalContent.innerHTML = createSpecimenDetailHtml(currentModalSpecimen);
        modalContent.appendChild(qaSectionClone);
        setupCareQuestionForm(currentModalSpecimen.qa_history);

    } catch (error) {
        console.error(error);
        modalContent.innerHTML = `<p class="text-red-400">Error: ${error.message}</p>`;
    } finally {
        modalLoader.classList.add('hidden');
        modalContent.classList.remove('hidden');
        modalLoader.querySelector('p').textContent = 'Loading details...';
    }
}

function createSpecimenDetailHtml(data) {
    const get = (v, d = 'N/A') => (v === null || v === undefined || v === '') ? d : v;
    const funFacts = Array.isArray(data.fun_facts) 
        ? data.fun_facts.map(f => `<li class="text-gray-300 text-sm mb-1">• ${f}</li>`).join('') 
        : '<li class="text-gray-500 italic">No facts available.</li>';
    const image = data.image_url || 'https://placehold.co/400x400/374151/FFFFFF?text=No+Image';

    return `
        <div class="flex flex-col lg:flex-row gap-8 mb-8">
            <div class="w-full lg:w-1/3 flex-shrink-0 card-image-wrapper rounded-xl">
                <img src="${image}" alt="${get(data.common_name)}" 
                     class="w-full rounded-xl shadow-lg object-cover bg-gray-900/50"
                     onerror="this.onerror=null;this.src='https://placehold.co/400x400/374151/FFFFFF?text=No+Image';">
            </div>

            <div class="w-full lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-6 content-start">
                <div class="md:col-span-2 flex justify-between items-center bg-gray-800/50 p-4 rounded-xl border border-white/10">
                    <div>
                        <h3 class="text-xl font-bold text-green-400">${get(data.common_name)}</h3>
                        <p class="text-gray-400 italic">${get(data.scientific_name)}</p>
                    </div>
                    <div class="text-right">
                        <span class="block text-xs text-gray-500 uppercase">Conservation Status</span>
                        <span class="inline-block px-3 py-1 rounded-full text-sm font-bold bg-gray-700 text-white border border-gray-600">
                            ${get(data.conservation_status)}
                        </span>
                    </div>
                </div>

                <div class="bg-gray-800/50 p-5 rounded-xl border border-white/10">
                    <h3 class="text-lg font-bold text-orange-400 mb-3 border-b border-gray-600 pb-1">Biological Profile</h3>
                    <ul class="space-y-2 text-sm">
                        <li class="flex justify-between"><span class="text-gray-400">Class</span> <span class="text-gray-200">${get(data.class)}</span></li>
                        <li class="flex justify-between"><span class="text-gray-400">Order</span> <span class="text-gray-200">${get(data.order)}</span></li>
                        <li class="flex justify-between"><span class="text-gray-400">Family</span> <span class="text-gray-200">${get(data.family)}</span></li>
                        <li class="flex justify-between mt-2 pt-2 border-t border-gray-700"><span class="text-gray-400">Lifespan</span> <span class="text-green-300">${get(data.lifespan)}</span></li>
                    </ul>
                </div>

                <div class="bg-gray-800/50 p-5 rounded-xl border border-white/10">
                    <h3 class="text-lg font-bold text-blue-400 mb-3 border-b border-gray-600 pb-1">Ecology</h3>
                    <div class="space-y-3 text-sm">
                        <div><span class="block text-gray-400 text-xs">Diet</span><span class="text-gray-200">${get(data.diet)}</span></div>
                        <div><span class="block text-gray-400 text-xs">Habitat</span><span class="text-gray-200">${get(data.habitat)}</span></div>
                        <div><span class="block text-gray-400 text-xs">Predators</span><span class="text-red-300">${get(data.predators)}</span></div>
                    </div>
                </div>

                <div class="md:col-span-2 bg-gray-800/50 p-5 rounded-xl border border-white/10">
                    <h3 class="text-lg font-bold text-white mb-2">Physical Characteristics</h3>
                    <p class="text-gray-300 text-sm leading-relaxed">${get(data.physical_characteristics)}</p>
                </div>
            </div>
        </div>

        <div class="bg-indigo-900/30 backdrop-blur-sm border-l-4 border-indigo-500 p-6 rounded-r-xl mb-8 shadow-lg">
            <h3 class="flex items-center text-xl font-bold text-white mb-3">
                <span class="mr-2">💡</span> Did You Know?
            </h3>
            <ul class="list-none space-y-2">
                ${funFacts}
            </ul>
        </div>
    `;
}

// --- UTILS ---

async function handleSaveToggle() {
    if (!currentUser || !currentModalSpecimen) return;
    const action = saveSpecimenBtn.dataset.action;
    saveSpecimenBtn.disabled = true;
    try {
        if (action === 'save') {
            const newId = await saveSpecimen(currentUser.uid, currentModalSpecimen);
            currentModalSpecimen.docId = newId;
            updateSaveButtonState(true);
            refreshSpecimenBtn.classList.remove('hidden');
        } else {
            await removeSpecimen(currentUser.uid, currentModalSpecimen.slug);
            currentModalSpecimen.docId = null;
            updateSaveButtonState(false);
            refreshSpecimenBtn.classList.add('hidden');
            if (!sanctuaryView.classList.contains('hidden')) loadSanctuarySpecimens();
        }
    } catch (e) { console.error(e); alert("Action failed."); } finally { saveSpecimenBtn.disabled = false; }
}

function updateSaveButtonState(isSaved) {
    if (isSaved) {
        saveSpecimenBtn.textContent = 'Remove from Sanctuary';
        saveSpecimenBtn.classList.replace('bg-green-600', 'bg-red-600');
        saveSpecimenBtn.dataset.action = 'remove';
    } else {
        saveSpecimenBtn.textContent = 'Save to Sanctuary';
        saveSpecimenBtn.classList.replace('bg-red-600', 'bg-green-600');
        saveSpecimenBtn.dataset.action = 'save';
    }
}

async function handleRefreshData() {
    if (!currentModalSpecimen || !currentUser) return;
    refreshSpecimenBtn.innerHTML = '↻ Updating...';
    try {
        const gbifData = await getSpecimenDetails(currentModalSpecimen.slug);
        const geminiData = await fetchAugmentedSpecimenData(gbifData);
        const freshData = { ...gbifData, ...geminiData, docId: currentModalSpecimen.docId, qa_history: currentModalSpecimen.qa_history };
        await saveSpecimen(currentUser.uid, freshData, freshData.docId);
        currentModalSpecimen = freshData;
        modalContent.innerHTML = createSpecimenDetailHtml(currentModalSpecimen);
        const qaSectionClone = careQuestionSection;
        careQuestionSection.classList.remove('hidden');
        modalContent.appendChild(qaSectionClone);
        setupCareQuestionForm(freshData.qa_history);
        alert("Specimen data updated.");
    } catch (e) { alert("Update failed: " + e.message); } finally { refreshSpecimenBtn.innerHTML = '🔄 Refresh'; }
}

async function loadCollectionSuggestions(query) {
    aiSuggestionsContainer.classList.remove('hidden');
    aiSuggestionsLoader.classList.remove('hidden');
    aiSuggestionsList.innerHTML = '';
    const suggestions = await fetchCollectionSuggestions(query);
    aiSuggestionsLoader.classList.add('hidden');
    if (suggestions.length) {
        aiSuggestionsList.classList.remove('hidden');
        aiSuggestionsList.className = "grid grid-cols-1 md:grid-cols-3 gap-4";
        suggestions.forEach(s => {
            const div = document.createElement('div');
            div.className = "p-2 bg-gray-800 border border-gray-700 rounded cursor-pointer hover:bg-gray-700";
            div.innerHTML = `<span class="font-bold text-gray-200">${s.common_name}</span> <span class="text-xs text-gray-500 block">${s.scientific_name}</span>`;
            div.onclick = () => openSpecimenModal(s.scientific_name, s.common_name);
            aiSuggestionsList.appendChild(div);
        });
    } else { aiSuggestionsContainer.classList.add('hidden'); }
}

function showSanctuaryView() {
    document.getElementById('discovery-view').classList.add('hidden');
    sanctuaryView.classList.remove('hidden');
    loadSanctuarySpecimens();
}

function showDiscoveryView() {
    sanctuaryView.classList.add('hidden');
    document.getElementById('discovery-view').classList.remove('hidden');
}

function returnToCollections() {
    collectionsContainer.classList.remove('hidden');
    customCollectionsContainer.classList.remove('hidden');
    galleryHeader.classList.add('hidden');
    specimenGallery.innerHTML = '';
    aiSuggestionsContainer.classList.add('hidden');
}

async function loadSanctuarySpecimens() {
    sanctuaryLoader.classList.remove('hidden');
    sanctuaryGallery.innerHTML = '';
    const specimens = await getSavedSpecimens(currentUser.uid);
    sanctuaryLoader.classList.add('hidden');
    if (specimens.length === 0) sanctuaryEmptyState.classList.remove('hidden');
    else {
        sanctuaryEmptyState.classList.add('hidden');
        renderSpecimenGallery(specimens, sanctuaryGallery);
    }
}

async function handleGoogleSignIn() { await signInWithGoogle(); }
async function handleGoogleSignOut() { await signOutUser(); }

function handleApiKeySubmit(e) {
    e.preventDefault();
    const fd = new FormData(apiKeyForm);
    try {
        setApiKeys({ gemini: fd.get('gemini-key'), googleClientId: fd.get('google-client-id'), firebase: JSON.parse(fd.get('firebase-config')) });
        initFirebase().then(({auth, onAuthStateChanged}) => {
            onAuthStateChanged(auth, user => {
                currentUser = user;
                if (user) {
                    signInBtn.classList.add('hidden'); userInfo.classList.remove('hidden'); userInfo.classList.add('flex');
                    userName.textContent = user.displayName; userPhoto.src = user.photoURL; mySanctuaryBtn.classList.remove('hidden');
                    loadUserCollections();
                } else {
                    signInBtn.classList.remove('hidden'); userInfo.classList.add('hidden'); userInfo.classList.remove('flex');
                    mySanctuaryBtn.classList.add('hidden'); showDiscoveryView();
                }
            });
            modalBackdrop.classList.add('hidden');
            collectionsContainer.classList.remove('hidden'); customCollectionsContainer.classList.remove('hidden');
        });
    } catch (e) { alert("Init failed: " + e.message); }
}

function openImageUploadModal() { imageUploadModal.classList.remove('hidden'); }
function closeImageUploadModal() { imageUploadModal.classList.add('hidden'); }
function handleImageFileChange(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => { imagePreview.src = ev.target.result; imagePreview.classList.remove('hidden'); previewPlaceholder.classList.add('hidden'); identifyImageBtn.disabled = false; };
        reader.readAsDataURL(file);
    }
}
async function handleImageUpload(e) {
    e.preventDefault();
    uploadStatus.classList.remove('hidden');
    uploadMessage.textContent = 'Uploading & Identifying...';
    try {
        const url = await uploadSpecimenImage(imageFileInput.files[0], currentUser.uid);
        const result = await fetchImageIdentification(url); 
        if (result && result.scientific_name !== 'Unknown') {
            uploadMessage.textContent = `Found: ${result.common_name}`;
            const gbifResult = await searchSpecimens(result.scientific_name, 1);
            if (gbifResult.data.length > 0) {
                openSpecimenModal(gbifResult.data[0].slug, result.common_name);
                closeImageUploadModal();
            } else { alert("Identified as " + result.common_name + ", but not found in GBIF."); }
        } else { throw new Error("Could not identify."); }
    } catch (err) { uploadMessage.textContent = 'Error: ' + err.message; }
}

function openCollectionModal() { collectionModal.classList.remove('hidden'); }
function closeCollectionModal() { collectionModal.classList.add('hidden'); }
function handleCollectionFileChange(e) { /* same as plant */ }
async function handleSaveCollection(e) {
    e.preventDefault();
    const data = { title: collectionTitleInput.value, query: collectionQueryInput.value, image: 'https://placehold.co/150' };
    await saveUserCollection(currentUser.uid, data);
    closeCollectionModal();
    loadUserCollections();
}
async function loadUserCollections() {
    if(!currentUser) return;
    customCollections = await getUserCollections(currentUser.uid);
    renderCustomCollections();
}
function closeModal() { specimenDetailModal.classList.add('hidden'); currentModalSpecimen = null; }

function setupCareQuestionForm(history) {
    careQuestionInput.value = ''; careQuestionSubmit.disabled = false;
    careQuestionForm.onsubmit = async (e) => {
        e.preventDefault();
        careResponseLoader.classList.remove('hidden'); careResponseText.classList.add('hidden');
        const ans = await fetchCustomCareAdvice(currentModalSpecimen, careQuestionInput.value);
        careResponseLoader.classList.add('hidden'); careResponseText.textContent = ans; careResponseText.classList.remove('hidden');
        if(!currentModalSpecimen.qa_history) currentModalSpecimen.qa_history = [];
        currentModalSpecimen.qa_history.push({question: careQuestionInput.value, answer: ans});
        if(currentModalSpecimen.docId) await saveSpecimen(currentUser.uid, currentModalSpecimen, currentModalSpecimen.docId);
    };
    if(history && history.length) {
        careResponseText.innerHTML = history.map(h => `<b>Q: ${h.question}</b><br>${h.answer}<hr class="my-2 border-gray-600">`).join('');
        careResponseText.classList.remove('hidden');
    }
}
function handleUpdatePhoto() { /* logic */ }

main();
