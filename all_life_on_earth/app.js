/*
 * APP.JS
 * The Controller for the "Life Explorer" SPA.
 * Updated: "Zoologist Mode" Layout.
 * Updated: Folder Management (Create, Move, Delete, Filter).
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
    deleteUserCollection,
    // Folder Imports
    createFolder,
    getUserFolders,
    deleteUserFolder,
    moveSpecimenToFolder
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
    collectionFileInput, collectionImagePreview, collectionPreviewPlaceholder, collectionImageUrlInput,
    // Lightbox Variables
    lightboxModal, lightboxImage, lightboxPlaceholder, lightboxCloseBtn,
    // Folder Variables
    createFolderBtn, foldersSection, foldersGallery, folderBackBtn, sanctuaryTitle, sanctuarySubtitle,
    moveModal, moveModalCloseBtn, moveFolderSelect, confirmMoveBtn;

// --- State ---
let currentSearchQuery = null;
let currentCollectionKey = null;
let currentPage = 1;
let currentMeta = null;
let currentUser = null; 
let currentModalSpecimen = null; 
let customCollections = []; 
let userFolders = [];
let currentFolderId = null; // null = root (unsorted)
let specimenToMoveId = null; // Track which animal is being moved

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
        if (careQuestionSection) careQuestionSection.classList.add('hidden');
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
    // Lightbox assignments
    lightboxModal = document.getElementById('lightbox-modal');
    lightboxImage = document.getElementById('lightbox-image');
    lightboxPlaceholder = document.getElementById('lightbox-placeholder');
    lightboxCloseBtn = document.getElementById('lightbox-close-btn');
    // Folder Assignments
    createFolderBtn = document.getElementById('create-folder-btn');
    foldersSection = document.getElementById('folders-section');
    foldersGallery = document.getElementById('folders-gallery');
    folderBackBtn = document.getElementById('folder-back-btn');
    sanctuaryTitle = document.getElementById('sanctuary-title');
    sanctuarySubtitle = document.getElementById('sanctuary-subtitle');
    moveModal = document.getElementById('move-modal');
    moveModalCloseBtn = document.getElementById('move-modal-close-btn');
    moveFolderSelect = document.getElementById('move-folder-select');
    confirmMoveBtn = document.getElementById('confirm-move-btn');
}

function addEventListeners() {
    if (apiKeyForm) apiKeyForm.addEventListener('submit', handleApiKeySubmit);
    if (signInBtn) signInBtn.addEventListener('click', handleGoogleSignIn);
    if (signOutBtn) signOutBtn.addEventListener('click', handleGoogleSignOut);
    if (mySanctuaryBtn) mySanctuaryBtn.addEventListener('click', showSanctuaryView);
    if (backToSearchBtn) backToSearchBtn.addEventListener('click', showDiscoveryView);
    if (backToCollectionsBtn) backToCollectionsBtn.addEventListener('click', returnToCollections);
    if (searchForm) searchForm.addEventListener('submit', handleSearchSubmit);
    if (scientificLookupBtn) scientificLookupBtn.addEventListener('click', handleScientificLookup);
    
    // Pagination Listeners
    if (prevBtn) prevBtn.addEventListener('click', handlePrevClick);
    if (nextBtn) nextBtn.addEventListener('click', handleNextClick);

    // Gallery Click Listeners (Delegation)
    if (specimenGallery) specimenGallery.addEventListener('click', handleSpecimenCardClick);
    
    // Sanctuary Gallery Delegation (Handles Click AND Move Button)
    if (sanctuaryGallery) sanctuaryGallery.addEventListener('click', handleSanctuaryGridClick);
    
    if (collectionsGrid) collectionsGrid.addEventListener('click', handleCollectionCardClick);
    
    if (customCollectionsGrid) {
        customCollectionsGrid.addEventListener('click', handleCustomCollectionsGridClick);
    }

    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
    if (specimenDetailModal) {
        specimenDetailModal.addEventListener('click', (e) => {
            if (e.target === specimenDetailModal) closeModal();
        });
    }
    if (saveSpecimenBtn) saveSpecimenBtn.addEventListener('click', handleSaveToggle);
    if (refreshSpecimenBtn) refreshSpecimenBtn.addEventListener('click', handleRefreshData);
    if (updateImageBtn && updateImageInput) updateImageBtn.addEventListener('click', () => updateImageInput.click());
    if (updateImageInput) updateImageInput.addEventListener('change', handleUpdatePhoto);
    if (identifySpecimenBtn) identifySpecimenBtn.addEventListener('click', openImageUploadModal);
    if (imageModalCloseBtn) imageModalCloseBtn.addEventListener('click', closeImageUploadModal);
    if (imageUploadForm) imageUploadForm.addEventListener('submit', handleImageUpload);
    if (imageFileInput) imageFileInput.addEventListener('change', handleImageFileChange);
    if (collectionModalCloseBtn) collectionModalCloseBtn.addEventListener('click', closeCollectionModal);
    if (collectionForm) collectionForm.addEventListener('submit', handleSaveCollection);
    if (collectionFileInput) collectionFileInput.addEventListener('change', handleCollectionFileChange);

    // Lightbox Listeners
    if (lightboxCloseBtn) lightboxCloseBtn.addEventListener('click', closeLightbox);
    if (lightboxModal) {
        lightboxModal.addEventListener('click', (e) => {
            if (e.target === lightboxModal) closeLightbox();
        });
    }
    
    // Folder Listeners
    if (createFolderBtn) createFolderBtn.addEventListener('click', handleCreateFolder);
    if (folderBackBtn) folderBackBtn.addEventListener('click', () => {
        currentFolderId = null;
        loadSanctuarySpecimens();
    });
    if (foldersGallery) foldersGallery.addEventListener('click', handleFolderClick);
    if (moveModalCloseBtn) moveModalCloseBtn.addEventListener('click', () => moveModal.classList.add('hidden'));
    if (confirmMoveBtn) confirmMoveBtn.addEventListener('click', executeMoveSpecimen);
}

// --- LIGHTBOX FUNCTIONS ---
function openLightbox(src) {
    if (!lightboxModal) return;
    lightboxModal.classList.remove('hidden');
    const isPlaceholder = !src || src.includes('placehold.co') || src === 'null';
    if (!isPlaceholder) {
        lightboxImage.src = src;
        lightboxImage.classList.remove('hidden');
        lightboxPlaceholder.classList.add('hidden');
    } else {
        lightboxImage.classList.add('hidden');
        lightboxPlaceholder.classList.remove('hidden');
    }
}

function closeLightbox() {
    if (lightboxModal) lightboxModal.classList.add('hidden');
    if (lightboxImage) lightboxImage.src = ''; 
}

// --- FOLDER LOGIC ---

async function handleCreateFolder() {
    const name = prompt("Enter folder name (e.g., 'Big Cats'):");
    if (!name || !name.trim()) return;
    
    try {
        await createFolder(currentUser.uid, name.trim());
        loadSanctuarySpecimens(); // Refresh view
    } catch (e) {
        alert("Could not create folder: " + e.message);
    }
}

function handleFolderClick(e) {
    // 1. Delete Folder
    const deleteBtn = e.target.closest('.delete-folder-btn');
    if (deleteBtn) {
        e.stopPropagation();
        const folderId = deleteBtn.dataset.id;
        if (confirm("Delete this folder? Animals inside will be moved to Unsorted.")) {
            deleteUserFolder(currentUser.uid, folderId).then(loadSanctuarySpecimens);
        }
        return;
    }

    // 2. Open Folder
    const card = e.target.closest('.folder-card');
    if (card) {
        currentFolderId = card.dataset.id;
        loadSanctuarySpecimens();
    }
}

function handleSanctuaryGridClick(e) {
    // 1. Check if Move Button was clicked
    const moveBtn = e.target.closest('.move-specimen-btn');
    if (moveBtn) {
        e.stopPropagation(); // Stop card from opening
        const card = moveBtn.closest('.specimen-card');
        specimenToMoveId = card.dataset.docid; // Get the Firestore ID
        openMoveModal();
        return;
    }

    // 2. Otherwise, treat as normal card click (Open Modal)
    handleSpecimenCardClick(e);
}

function openMoveModal() {
    moveModal.classList.remove('hidden');
    moveFolderSelect.innerHTML = '<option value="">(Unsorted)</option>';
    userFolders.forEach(f => {
        const option = document.createElement('option');
        option.value = f.id;
        option.textContent = f.name;
        // Pre-select if currently in this folder
        if (f.id === currentFolderId) option.selected = true;
        moveFolderSelect.appendChild(option);
    });
}

async function executeMoveSpecimen() {
    if (!specimenToMoveId) return;
    
    const folderId = moveFolderSelect.value || null; // Convert empty string to null
    confirmMoveBtn.innerText = "Moving...";
    confirmMoveBtn.disabled = true;
    
    try {
        await moveSpecimenToFolder(currentUser.uid, specimenToMoveId, folderId);
        moveModal.classList.add('hidden');
        loadSanctuarySpecimens(); // Refresh grid
    } catch (e) {
        alert("Move failed: " + e.message);
    } finally {
        confirmMoveBtn.innerText = "Move Specimen";
        confirmMoveBtn.disabled = false;
        specimenToMoveId = null;
    }
}

function renderFolders(folders) {
    foldersGallery.innerHTML = folders.map(f => `
        <div class="folder-card rounded-xl p-4 cursor-pointer relative group flex flex-col items-center justify-center h-32 transition-all" data-id="${f.id}">
            <button class="delete-folder-btn absolute top-2 right-2 text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1" data-id="${f.id}" title="Delete Folder">×</button>
            <span class="text-4xl mb-2">📁</span>
            <span class="text-white font-bold text-center truncate w-full px-2">${f.name}</span>
        </div>
    `).join('');
}

// --- RENDER FUNCTIONS (SPECIMEN GALLERY) ---

function renderSpecimenGallery(specimens, container) {
    container.innerHTML = '';
    if (specimens.length === 0 && container === specimenGallery) {
        container.innerHTML = '<div class="col-span-full text-center py-10"><p class="text-gray-300">No specimens found.</p></div>';
        return;
    }

    specimens.forEach(specimen => {
        const card = document.createElement('div');
        card.className = 'specimen-card glass-panel rounded-xl overflow-hidden cursor-pointer';
        card.dataset.slug = specimen.slug;
        card.dataset.name = specimen.common_name;
        // Needed for move logic:
        if (specimen.docId) card.dataset.docid = specimen.docId;

        const hasImage = !!specimen.image_url;

        // Condition to show Move Button: Only if we are in Sanctuary view (container is sanctuaryGallery)
        const showMoveBtn = (container === sanctuaryGallery);

        card.innerHTML = `
            <div class="card-image-container group-hover:scale-105 transition-transform duration-700 relative">
                <img src="${hasImage ? specimen.image_url : ''}" 
                     alt="${specimen.common_name}" 
                     loading="lazy"
                     class="w-full h-full object-cover transition-opacity duration-300 ${hasImage ? '' : 'hidden'}"
                     onload="this.style.opacity=1"
                     onerror="this.style.display='none'; this.nextElementSibling.classList.remove('hidden');"
                >
                <div class="${hasImage ? 'hidden' : ''} absolute inset-0 flex items-center justify-center bg-gray-800 card-image-placeholder">
                    <div class="text-center opacity-30">
                        <span class="text-5xl">🐾</span>
                        <p class="text-xs mt-2 text-gray-400">No Photo</p>
                    </div>
                </div>
                
                ${showMoveBtn ? `
                <div class="absolute top-2 right-2 z-10">
                    <button class="move-specimen-btn bg-gray-900/80 hover:bg-indigo-600 text-white p-2 rounded-lg backdrop-blur-sm transition-colors shadow-lg border border-white/10" title="Move to Folder">
                        📁
                    </button>
                </div>` : ''}

                <div class="card-text-overlay">
                    <h3 class="text-lg font-bold text-white leading-tight drop-shadow-md truncate">${specimen.common_name}</h3>
                    <p class="text-green-400 text-xs mt-1 font-medium truncate">${specimen.scientific_name}</p>
                </div>
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

async function handleCustomCollectionsGridClick(e) {
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
    const editBtn = e.target.closest('.edit-collection-btn');
    if (editBtn) {
        e.stopPropagation();
        const id = editBtn.dataset.id;
        const collection = customCollections.find(c => c.id === id);
        if (collection) openCollectionModal(collection);
        return;
    }
    const card = e.target.closest('.collection-card');
    if (card) {
        const id = card.dataset.id; 
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
        
        const collection = customCollections.find(c => c.id === id);
        
        if (collection && collection.results && collection.results.length > 0) {
            console.log("Loading from Cache:", title);
            renderSpecimenGallery(collection.results, specimenGallery);
            renderPagination({ total: collection.results.length, endOfRecords: true });
        } else {
            console.log("Cache Miss. Fetching API:", title);
            loader.classList.remove('hidden');
            try {
                const results = await searchSpecimens(query, 1);
                renderSpecimenGallery(results.data, specimenGallery);
                renderPagination(results.meta);
                if (results.data.length > 0) {
                     await saveUserCollection(currentUser.uid, { id: id, results: results.data });
                     collection.results = results.data; 
                }
            } catch(e) { console.error(e); } finally { loader.classList.add('hidden'); }
        }
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
// ... (Previous modal code reused, simplified for brevity as logic is unchanged)
function handleSpecimenCardClick(e) {
    const card = e.target.closest('.specimen-card');
    if (!card) return;
    const { slug, name } = card.dataset;
    openSpecimenModal(slug, name);
}

// --- NAVIGATION HANDLERS ---
function handlePrevClick() { if (currentPage > 1) { currentPage--; fetchAndRenderSpecimens(); } }
function handleNextClick() { currentPage++; fetchAndRenderSpecimens(); }

async function openSpecimenModal(slug, name) {
    specimenDetailModal.classList.remove('hidden');
    modalContent.classList.add('hidden');
    modalLoader.classList.remove('hidden');
    modalTitle.textContent = name || "Loading...";
    refreshSpecimenBtn.classList.add('hidden');
    updateImageBtn.classList.remove('hidden'); 
    modalContent.innerHTML = '';
    
    const qaSectionClone = careQuestionSection.cloneNode(true);
    qaSectionClone.classList.remove('hidden'); 
    careQuestionSection.classList.add('hidden'); 
    
    saveSpecimenBtn.classList.add('hidden');
    saveSpecimenBtn.textContent = 'Save to Sanctuary';
    saveSpecimenBtn.classList.remove('bg-red-600');
    saveSpecimenBtn.classList.add('bg-green-600');

    try {
        let gbifData = null;
        let isSaved = false;
        let resolvedSlug = slug;

        if (isNaN(slug)) {
             modalLoader.querySelector('p').textContent = 'Identifying species ID...';
             gbifData = await getSpecimenDetails(slug);
             if (gbifData) resolvedSlug = gbifData.slug; 
        }

        if (currentUser) {
            modalLoader.querySelector('p').textContent = 'Checking sanctuary...';
            const savedResult = await getSavedSpecimen(currentUser.uid, resolvedSlug);
            
            if (savedResult.data && savedResult.data.diet) {
                currentModalSpecimen = { ...savedResult.data, docId: savedResult.docId };
                modalTitle.textContent = currentModalSpecimen.common_name;
                modalContent.innerHTML = createSpecimenDetailHtml(currentModalSpecimen);
                updateSaveButtonState(true);
                saveSpecimenBtn.classList.remove('hidden');
                refreshSpecimenBtn.classList.remove('hidden'); 
                modalContent.appendChild(qaSectionClone);
                setupCareQuestionForm(currentModalSpecimen.qa_history);
                modalLoader.classList.add('hidden');
                modalContent.classList.remove('hidden');
                setupGalleryListeners();
                return;
            }
            if (savedResult.data) isSaved = true;
        }

        if (currentUser) {
             updateSaveButtonState(isSaved);
             saveSpecimenBtn.classList.remove('hidden');
        }

        if (!gbifData) {
            modalLoader.querySelector('p').textContent = 'Fetching GBIF Taxonomy...';
            gbifData = await getSpecimenDetails(resolvedSlug);
        }
        
        if (!gbifData) throw new Error("Could not fetch specimen details.");

        modalLoader.querySelector('p').textContent = 'Consulting the Zoologist (AI)...';
        const geminiData = await fetchAugmentedSpecimenData(gbifData);

        currentModalSpecimen = { ...gbifData, ...geminiData, qa_history: [] };
        if (name && currentModalSpecimen.common_name === currentModalSpecimen.scientific_name) {
            currentModalSpecimen.common_name = name;
        }

        modalTitle.textContent = currentModalSpecimen.common_name;
        modalContent.innerHTML = createSpecimenDetailHtml(currentModalSpecimen);
        setupGalleryListeners();
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

function setupGalleryListeners() {
    const mainImg = document.getElementById('main-specimen-image');
    const thumbs = modalContent.querySelectorAll('.gallery-thumb');
    
    if (mainImg) {
        mainImg.style.cursor = 'zoom-in';
        mainImg.addEventListener('click', () => {
            openLightbox(mainImg.dataset.fullRes || mainImg.src);
        });
    }
    
    if (mainImg && thumbs.length > 0) {
        thumbs.forEach(thumb => {
            thumb.addEventListener('click', () => {
                const newSrc = thumb.src;
                mainImg.src = newSrc;
                thumbs.forEach(t => t.classList.remove('ring-2', 'ring-green-400', 'opacity-100'));
                thumbs.forEach(t => t.classList.add('opacity-70'));
                thumb.classList.remove('opacity-70');
                thumb.classList.add('ring-2', 'ring-green-400', 'opacity-100');
            });
        });
    }
}

function createSpecimenDetailHtml(data) {
    const get = (v, d = 'N/A') => (v === null || v === undefined || v === '') ? d : v;
    const isZoologistMode = !!data.zoologist_intro;
    const funFacts = Array.isArray(data.fun_facts) ? data.fun_facts.map(f => `<li class="text-gray-300 text-sm mb-1">• ${f}</li>`).join('') : '<li class="text-gray-500">No facts available.</li>';
    const hasImage = !!data.image_url;
    const image = hasImage ? data.image_url : 'https://placehold.co/400x400/374151/FFFFFF?text=No+Photo';
    const fullRes = data.original_image_url || data.image_url;
    const galleryHtml = (data.gallery_images && data.gallery_images.length > 1) ? `<div class="flex gap-2 overflow-x-auto pb-2 mt-4 custom-scrollbar">${data.gallery_images.map((img, idx) => `<img src="${img}" class="gallery-thumb h-20 w-20 object-cover rounded-lg cursor-pointer transition-all ${idx===0 ? 'ring-2 ring-green-400 opacity-100' : 'opacity-70 hover:opacity-100'}" alt="Thumbnail">`).join('')}</div>` : '';

    let zoologistHtml = '';
    if (isZoologistMode) {
        zoologistHtml = `
            <div class="zoologist-text space-y-8 mt-10 border-t border-gray-700 pt-8">
                <div class="prose prose-invert max-w-none"><p class="text-lg text-gray-200 leading-relaxed font-medium">${get(data.zoologist_intro)}</p></div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div><h3 class="text-2xl font-bold text-white mb-4 flex items-center"><span class="text-green-400 mr-3 text-lg">●</span> Physical Characteristics</h3><p class="text-gray-300 leading-relaxed">${get(data.detailed_physical)}</p></div>
                    <div><h3 class="text-2xl font-bold text-white mb-4 flex items-center"><span class="text-blue-400 mr-3 text-lg">●</span> Habitat & Distribution</h3><p class="text-gray-300 leading-relaxed">${get(data.detailed_habitat)}</p></div>
                </div>
                <div class="bg-gray-800/30 p-6 rounded-2xl border border-white/5"><h3 class="text-2xl font-bold text-white mb-4 flex items-center"><span class="text-orange-400 mr-3 text-lg">●</span> Behavior & Life Cycle</h3><p class="text-gray-300 leading-relaxed">${get(data.detailed_behavior)}</p></div>
            </div>`;
    } else {
        zoologistHtml = `<div class="bg-gray-800/50 p-6 rounded-xl border border-yellow-500/30 mt-6 text-center"><p class="text-gray-300 mb-2">This specimen has legacy data.</p><p class="text-yellow-400 font-bold">Click the 🔄 Refresh button above to generate a full Field Guide report.</p></div>`;
    }

    return `
        <div class="flex flex-col lg:flex-row gap-8 mb-8">
            <div class="w-full lg:w-1/3 flex-shrink-0"><div class="card-image-wrapper rounded-xl overflow-hidden shadow-lg bg-gray-900/50"><img id="main-specimen-image" src="${image}" data-full-res="${fullRes}" alt="${get(data.common_name)}" class="w-full h-auto object-cover" onerror="this.onerror=null;this.src='https://placehold.co/400x400/374151/FFFFFF?text=No+Image';"></div>${galleryHtml}</div>
            <div class="w-full lg:w-2/3">
                 <div class="mb-6 border-b border-gray-700 pb-6"><h2 class="text-4xl font-bold text-white mb-2">${get(data.common_name)}</h2><p class="text-xl text-gray-400 font-mono">${get(data.scientific_name)}</p><div class="flex items-center mt-3 gap-3"><span class="inline-block px-3 py-1 rounded-full text-sm font-bold bg-gray-700 text-white border border-gray-600">${get(data.conservation_status)}</span><span class="text-xs text-gray-500 uppercase tracking-widest font-semibold">${get(data.class)} / ${get(data.order)}</span></div></div>
                 <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                     <div class="bg-gray-800/40 p-3 rounded-lg border border-white/5"><span class="text-gray-500 text-xs uppercase block mb-1">Diet</span><span class="text-gray-200 font-bold text-sm block">${get(data.diet)}</span></div>
                     <div class="bg-gray-800/40 p-3 rounded-lg border border-white/5"><span class="text-gray-500 text-xs uppercase block mb-1">Lifespan</span><span class="text-green-400 font-bold text-sm block">${get(data.lifespan)}</span></div>
                     <div class="bg-gray-800/40 p-3 rounded-lg border border-white/5"><span class="text-gray-500 text-xs uppercase block mb-1">Family</span><span class="text-gray-200 text-sm block truncate" title="${get(data.family)}">${get(data.family)}</span></div>
                     <div class="bg-gray-800/40 p-3 rounded-lg border border-white/5"><span class="text-gray-500 text-xs uppercase block mb-1">Predators</span><span class="text-orange-300 text-sm block truncate" title="${get(data.predators)}">${get(data.predators)}</span></div>
                 </div>
                 <div class="bg-indigo-900/20 border-l-4 border-indigo-500 p-4 rounded-r-lg"><h3 class="flex items-center text-sm font-bold text-indigo-300 mb-2 uppercase tracking-wide">Did You Know?</h3><ul class="list-none space-y-1">${funFacts}</ul></div>
            </div>
        </div>
        ${zoologistHtml}`;
}

// --- UTILS ---
function setupCareQuestionForm(history) {
    const form = modalContent.querySelector('#care-question-form');
    const input = modalContent.querySelector('#care-question-input');
    const btn = modalContent.querySelector('#care-question-submit');
    const loader = modalContent.querySelector('#care-response-loader');
    const responseText = modalContent.querySelector('#care-response-text');
    if (!form || !input || !btn) return;
    input.value = '';
    btn.disabled = true;
    input.oninput = () => { btn.disabled = input.value.trim().length === 0; };
    form.onsubmit = async (e) => {
        e.preventDefault();
        const question = input.value.trim();
        if (!question) return;
        btn.disabled = true; 
        if (loader) loader.classList.remove('hidden'); 
        if (responseText) responseText.classList.add('hidden');
        const ans = await fetchCustomCareAdvice(currentModalSpecimen, question);
        if (loader) loader.classList.add('hidden'); 
        if (responseText) { responseText.textContent = ans; responseText.classList.remove('hidden'); }
        btn.disabled = false; 
        if(!currentModalSpecimen.qa_history) currentModalSpecimen.qa_history = [];
        currentModalSpecimen.qa_history.push({question: question, answer: ans});
        if(currentModalSpecimen.docId) await saveSpecimen(currentUser.uid, currentModalSpecimen, currentModalSpecimen.docId);
    };
    if(history && history.length && responseText) {
        responseText.innerHTML = history.map(h => `<b>Q: ${h.question}</b><br>${h.answer}<hr class="my-2 border-gray-600">`).join('');
        responseText.classList.remove('hidden');
    }
}

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
        const preservedImage = currentModalSpecimen.image_url;
        const preservedOriginal = currentModalSpecimen.original_image_url;
        const freshData = { ...gbifData, ...geminiData, image_url: preservedImage || gbifData.image_url, original_image_url: preservedOriginal, docId: currentModalSpecimen.docId, qa_history: currentModalSpecimen.qa_history };
        await saveSpecimen(currentUser.uid, freshData, freshData.docId);
        currentModalSpecimen = freshData;
        modalContent.innerHTML = createSpecimenDetailHtml(currentModalSpecimen);
        setupGalleryListeners();
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
    currentFolderId = null; // Reset to root
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

// --- UPDATED: Sanctuary Load Logic with Folders ---
async function loadSanctuarySpecimens() {
    sanctuaryLoader.classList.remove('hidden');
    sanctuaryGallery.innerHTML = '';
    foldersGallery.innerHTML = '';
    
    // Fetch data in parallel
    const [specimens, folders] = await Promise.all([
        getSavedSpecimens(currentUser.uid),
        getUserFolders(currentUser.uid)
    ]);
    
    userFolders = folders; // Update local state
    sanctuaryLoader.classList.add('hidden');

    if (currentFolderId) {
        // --- Folder View ---
        const folder = folders.find(f => f.id === currentFolderId);
        sanctuaryTitle.textContent = folder ? folder.name : "Unknown Folder";
        sanctuarySubtitle.textContent = "Folder Collection";
        folderBackBtn.classList.remove('hidden');
        foldersSection.classList.add('hidden'); // Hide folders grid
        createFolderBtn.classList.add('hidden'); // Cannot create nested folders
        
        const filtered = specimens.filter(s => s.folderId === currentFolderId);
        
        if (filtered.length === 0) sanctuaryEmptyState.classList.remove('hidden');
        else {
            sanctuaryEmptyState.classList.add('hidden');
            renderSpecimenGallery(filtered, sanctuaryGallery);
        }

    } else {
        // --- Root View ---
        sanctuaryTitle.textContent = "My Sanctuary";
        sanctuarySubtitle.textContent = "Your collection of saved specimens";
        folderBackBtn.classList.add('hidden');
        foldersSection.classList.remove('hidden');
        createFolderBtn.classList.remove('hidden');
        
        renderFolders(folders);
        
        // Show "Unsorted" (null or undefined folderId)
        const unsorted = specimens.filter(s => !s.folderId);
        
        if (unsorted.length === 0 && folders.length === 0) {
            sanctuaryEmptyState.classList.remove('hidden');
        } else {
            sanctuaryEmptyState.classList.add('hidden');
            renderSpecimenGallery(unsorted, sanctuaryGallery);
        }
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
        const { original, thumb } = await uploadSpecimenImage(imageFileInput.files[0], currentUser.uid);
        const result = await fetchImageIdentification(original); 
        
        // Use thumb for display, keep original for lightbox
        const imageToSave = thumb;
        
        if (result && result.scientific_name !== 'Unknown') {
            uploadMessage.textContent = `Found: ${result.common_name}`;
            const gbifResult = await searchSpecimens(result.scientific_name, 1);
            if (gbifResult.data.length > 0) {
                const foundSpecimen = gbifResult.data[0];
                await openSpecimenModal(foundSpecimen.slug, result.common_name);
                currentModalSpecimen.image_url = thumb;
                currentModalSpecimen.original_image_url = original;
                const mainImg = document.getElementById('main-specimen-image');
                if(mainImg) {
                    mainImg.src = thumb;
                    mainImg.dataset.fullRes = original;
                }
                closeImageUploadModal();
                alert("Identified! Don't forget to click 'Save to Sanctuary' to keep your photo.");
            } else { alert("Identified as " + result.common_name + ", but not found in GBIF."); }
        } else { throw new Error("Could not identify."); }
    } catch (err) { uploadMessage.textContent = 'Error: ' + err.message; }
}

function openCollectionModal(collectionToEdit = null) {
    collectionModal.classList.remove('hidden');
    collectionModalTitle.textContent = "Create Field Guide";
    saveCollectionBtn.textContent = "Create Guide";
    collectionIdInput.value = "";
    collectionTitleInput.value = "";
    collectionQueryInput.value = "";
    collectionImageUrlInput.value = ""; 
    
    if (collectionToEdit) {
        collectionModalTitle.textContent = "Edit Field Guide";
        saveCollectionBtn.textContent = "Update Guide";
        collectionIdInput.value = collectionToEdit.id;
        collectionTitleInput.value = collectionToEdit.title;
        collectionQueryInput.value = collectionToEdit.query;
    }
}

function closeCollectionModal() { collectionModal.classList.add('hidden'); }
function handleCollectionFileChange(e) { /* same as plant */ }

async function handleSaveCollection(e) {
    e.preventDefault();
    const id = collectionIdInput.value;
    const oldCollection = id ? customCollections.find(c => c.id === id) : null;
    const newQuery = collectionQueryInput.value;
    const data = { 
        id: id || null,
        title: collectionTitleInput.value, 
        query: newQuery,
        image: oldCollection ? oldCollection.image : 'https://placehold.co/150' 
    };
    if (oldCollection && oldCollection.query !== newQuery) {
        data.results = []; // Clear cache
    }
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

async function handleUpdatePhoto() {
    if (!updateImageInput.files || !updateImageInput.files[0]) return;
    const file = updateImageInput.files[0];
    const originalText = updateImageBtn.innerHTML;
    updateImageBtn.innerHTML = '⏳';
    updateImageBtn.disabled = true;

    try {
        if (!currentUser) throw new Error("Please sign in to upload photos.");
        const { original, thumb } = await uploadSpecimenImage(file, currentUser.uid);
        currentModalSpecimen.image_url = thumb; // Use thumbnail for display
        currentModalSpecimen.original_image_url = original; // Keep original for lightbox
        const mainImg = document.getElementById('main-specimen-image');
        if (mainImg) {
            mainImg.src = thumb;
            mainImg.dataset.fullRes = original;
        }
        if (currentModalSpecimen.docId) {
             await saveSpecimen(currentUser.uid, currentModalSpecimen, currentModalSpecimen.docId);
             alert("Photo uploaded and saved!");
        } else {
             alert("Photo uploaded! Click 'Save to Sanctuary' to keep it.");
        }
    } catch (e) {
        console.error(e);
        alert("Upload failed: " + e.message);
    } finally {
        updateImageBtn.innerHTML = '📷'; // Reset icon
        updateImageBtn.disabled = false;
        updateImageInput.value = ''; // Clear input
    }
}

main();
