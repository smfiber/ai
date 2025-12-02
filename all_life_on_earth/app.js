/*
 * APP.JS
 * The Controller for the "Life Explorer" SPA.
 * Updated: Improved Folder Click Responsiveness & Error Handling
 */

import { setApiKeys } from './config.js';
import { 
    initFirebase, 
    signInWithGoogle, 
    signOutUser,
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
    // Folder Imports
    createFolder,
    getUserFolders,
    deleteUserFolder,
    moveSpecimenToFolder
} from './api.js';

// --- DOM Variables ---
let modalBackdrop, apiKeyForm, appContainer, mainContent, authContainer,
    signInBtn, signOutBtn, userInfo, userName, userPhoto, 
    searchForm, searchInput, 
    // Views
    sanctuaryView, searchResultsView, 
    // Search Gallery
    specimenGallery, loader, paginationContainer, prevBtn, nextBtn, pageInfo, galleryHeader, galleryTitle, backToSanctuaryBtn,
    // Sanctuary Elements
    sanctuaryLoader, sanctuaryGallery, sanctuaryEmptyState, createFolderBtn, foldersSection, foldersGallery, folderBackBtn, sanctuaryTitle, sanctuarySubtitle,
    // AI & Modals
    specimenDetailModal, modalTitle, modalCloseBtn, modalContentContainer, modalLoader, modalContent, saveSpecimenBtn, refreshSpecimenBtn, updateImageBtn, updateImageInput,
    careQuestionSection, careQuestionForm, careQuestionInput, careQuestionSubmit, careResponseContainer, careResponseText, careResponseLoader, scientificLookupBtn,
    aiSuggestionsContainer, aiSuggestionsList, aiSuggestionsLoader,
    identifySpecimenBtn, imageUploadModal, imageModalCloseBtn, imageUploadForm, imageFileInput, imagePreviewContainer, imagePreview, previewPlaceholder, uploadStatus, uploadMessage, identifyImageBtn,
    // Lightbox
    lightboxModal, lightboxImage, lightboxPlaceholder, lightboxCloseBtn,
    // Folders
    moveModal, moveModalCloseBtn, moveFolderSelect, confirmMoveBtn;

// --- State ---
let currentSearchQuery = null;
let currentPage = 1;
let currentMeta = null;
let currentUser = null; 
let currentModalSpecimen = null; 
let userFolders = [];
let currentFolderId = null; // null = root (unsorted)
let specimenToMoveId = null; // Track which animal is being moved

function main() {
    document.addEventListener('DOMContentLoaded', () => {
        assignDomElements();
        addEventListeners();
        console.log("Life Explorer ready.");
        
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
    
    // Search & Views
    searchForm = document.getElementById('search-form');
    searchInput = document.getElementById('search-input');
    scientificLookupBtn = document.getElementById('scientific-lookup-btn');
    sanctuaryView = document.getElementById('sanctuary-view');
    searchResultsView = document.getElementById('search-results-view');
    
    // Search Gallery Elements
    specimenGallery = document.getElementById('specimen-gallery');
    loader = document.getElementById('loader');
    galleryHeader = document.getElementById('gallery-header');
    galleryTitle = document.getElementById('gallery-title');
    backToSanctuaryBtn = document.getElementById('back-to-collections-btn'); 
    paginationContainer = document.getElementById('pagination-container');
    prevBtn = document.getElementById('prev-btn');
    nextBtn = document.getElementById('next-btn');
    pageInfo = document.getElementById('page-info');
    
    // Sanctuary Elements
    sanctuaryLoader = document.getElementById('sanctuary-loader');
    sanctuaryGallery = document.getElementById('sanctuary-gallery');
    sanctuaryEmptyState = document.getElementById('sanctuary-empty-state');
    createFolderBtn = document.getElementById('create-folder-btn');
    foldersSection = document.getElementById('folders-section');
    foldersGallery = document.getElementById('folders-gallery');
    folderBackBtn = document.getElementById('folder-back-btn');
    sanctuaryTitle = document.getElementById('sanctuary-title');
    sanctuarySubtitle = document.getElementById('sanctuary-subtitle');

    // AI Suggestions
    aiSuggestionsContainer = document.getElementById('ai-suggestions-container');
    aiSuggestionsList = document.getElementById('ai-suggestions-list');
    aiSuggestionsLoader = document.getElementById('ai-suggestions-loader');

    // Modal Elements
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
    
    // Care Chat
    careQuestionSection = document.getElementById('care-question-section');
    careQuestionForm = document.getElementById('care-question-form');
    careQuestionInput = document.getElementById('care-question-input');
    careQuestionSubmit = document.getElementById('care-question-submit');
    careResponseContainer = document.getElementById('care-response-container');
    careResponseText = document.getElementById('care-response-text');
    careResponseLoader = document.getElementById('care-response-loader');

    // Image Upload
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

    // Lightbox
    lightboxModal = document.getElementById('lightbox-modal');
    lightboxImage = document.getElementById('lightbox-image');
    lightboxPlaceholder = document.getElementById('lightbox-placeholder');
    lightboxCloseBtn = document.getElementById('lightbox-close-btn');
    
    // Move Modal
    moveModal = document.getElementById('move-modal');
    moveModalCloseBtn = document.getElementById('move-modal-close-btn');
    moveFolderSelect = document.getElementById('move-folder-select');
    confirmMoveBtn = document.getElementById('confirm-move-btn');
}

function addEventListeners() {
    if (apiKeyForm) apiKeyForm.addEventListener('submit', handleApiKeySubmit);
    if (signInBtn) signInBtn.addEventListener('click', handleGoogleSignIn);
    if (signOutBtn) signOutBtn.addEventListener('click', handleGoogleSignOut);
    
    if (backToSanctuaryBtn) backToSanctuaryBtn.addEventListener('click', returnToSanctuary);
    if (searchForm) searchForm.addEventListener('submit', handleSearchSubmit);
    if (scientificLookupBtn) scientificLookupBtn.addEventListener('click', handleScientificLookup);
    
    // Pagination
    if (prevBtn) prevBtn.addEventListener('click', handlePrevClick);
    if (nextBtn) nextBtn.addEventListener('click', handleNextClick);

    // Gallery Click (Search Results)
    if (specimenGallery) specimenGallery.addEventListener('click', handleSpecimenCardClick);
    
    // Sanctuary Click (View + Move)
    if (sanctuaryGallery) sanctuaryGallery.addEventListener('click', handleSanctuaryGridClick);
    
    // Modal & Details
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
    
    // Image Upload
    if (identifySpecimenBtn) identifySpecimenBtn.addEventListener('click', openImageUploadModal);
    if (imageModalCloseBtn) imageModalCloseBtn.addEventListener('click', closeImageUploadModal);
    if (imageUploadForm) imageUploadForm.addEventListener('submit', handleImageUpload);
    if (imageFileInput) imageFileInput.addEventListener('change', handleImageFileChange);

    // Lightbox
    if (lightboxCloseBtn) lightboxCloseBtn.addEventListener('click', closeLightbox);
    if (lightboxModal) {
        lightboxModal.addEventListener('click', (e) => {
            if (e.target === lightboxModal) closeLightbox();
        });
    }
    
    // Folders
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
        loadSanctuarySpecimens();
    } catch (e) { alert("Could not create folder: " + e.message); }
}

function handleFolderClick(e) {
    const deleteBtn = e.target.closest('.delete-folder-btn');
    if (deleteBtn) {
        e.stopPropagation();
        const folderId = deleteBtn.dataset.id;
        if (confirm("Delete this folder? Animals inside will be moved to Unsorted.")) {
            deleteUserFolder(currentUser.uid, folderId).then(loadSanctuarySpecimens);
        }
        return;
    }
    
    const card = e.target.closest('.folder-card');
    if (card) {
        // Immediate UI feedback
        sanctuaryLoader.classList.remove('hidden');
        foldersSection.classList.add('hidden');
        
        currentFolderId = card.dataset.id;
        console.log("Opening folder:", currentFolderId);
        loadSanctuarySpecimens();
    }
}

function handleSanctuaryGridClick(e) {
    const moveBtn = e.target.closest('.move-specimen-btn');
    if (moveBtn) {
        e.stopPropagation();
        const card = moveBtn.closest('.specimen-card');
        specimenToMoveId = card.dataset.docid; 
        openMoveModal();
        return;
    }
    handleSpecimenCardClick(e);
}

function openMoveModal() {
    moveModal.classList.remove('hidden');
    moveFolderSelect.innerHTML = '<option value="">(Unsorted)</option>';
    userFolders.forEach(f => {
        const option = document.createElement('option');
        option.value = f.id;
        option.textContent = f.name;
        if (f.id === currentFolderId) option.selected = true;
        moveFolderSelect.appendChild(option);
    });
}

async function executeMoveSpecimen() {
    if (!specimenToMoveId) return;
    const folderId = moveFolderSelect.value || null;
    confirmMoveBtn.innerText = "Moving...";
    confirmMoveBtn.disabled = true;
    try {
        await moveSpecimenToFolder(currentUser.uid, specimenToMoveId, folderId);
        moveModal.classList.add('hidden');
        loadSanctuarySpecimens();
    } catch (e) { alert("Move failed: " + e.message); } 
    finally {
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
            <span class="text-white font-bold text-center truncate w-full px-2 pointer-events-none">${f.name}</span>
        </div>
    `).join('');
}

// --- RENDER FUNCTIONS (GALLERY) ---

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
        if (specimen.docId) card.dataset.docid = specimen.docId;

        const hasImage = !!specimen.image_url;
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
                ${showMoveBtn ? `<div class="absolute top-2 right-2 z-10"><button class="move-specimen-btn bg-gray-900/80 hover:bg-indigo-600 text-white p-2 rounded-lg backdrop-blur-sm transition-colors shadow-lg border border-white/10" title="Move to Folder">📁</button></div>` : ''}
                <div class="card-text-overlay">
                    <h3 class="text-lg font-bold text-white leading-tight drop-shadow-md truncate">${specimen.common_name}</h3>
                    <p class="text-green-400 text-xs mt-1 font-medium truncate">${specimen.scientific_name}</p>
                </div>
            </div>`;
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

// --- SEARCH LOGIC ---

async function fetchAndRenderSpecimens() {
    loader.classList.remove('hidden');
    specimenGallery.innerHTML = '';
    paginationContainer.classList.add('hidden');
    try {
        const results = await searchSpecimens(currentSearchQuery, currentPage);
        currentMeta = results.meta;
        renderSpecimenGallery(results.data, specimenGallery);
        renderPagination(results.meta);
    } catch (error) {
        specimenGallery.innerHTML = '<div class="col-span-full text-center py-10"><p class="text-red-400">Error loading specimens.</p></div>';
    } finally { loader.classList.add('hidden'); }
}

function handleSearchSubmit(e) {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (query === currentSearchQuery && !searchResultsView.classList.contains('hidden')) return;
    
    currentSearchQuery = query;
    currentPage = 1;
    
    // Switch Views
    sanctuaryView.classList.add('hidden');
    searchResultsView.classList.remove('hidden');
    
    fetchAndRenderSpecimens();
    loadCollectionSuggestions(query);
}

function returnToSanctuary() {
    searchResultsView.classList.add('hidden');
    sanctuaryView.classList.remove('hidden');
    specimenGallery.innerHTML = ''; // Clear search results to save memory
    aiSuggestionsContainer.classList.add('hidden');
    currentSearchQuery = null;
    searchInput.value = ''; // Optional: clear bar
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

// --- SANCTUARY LOAD LOGIC ---

async function loadSanctuarySpecimens() {
    try {
        sanctuaryLoader.classList.remove('hidden');
        sanctuaryGallery.innerHTML = '';
        if (!currentFolderId) foldersGallery.innerHTML = '';
        
        const [specimens, folders] = await Promise.all([
            getSavedSpecimens(currentUser.uid),
            getUserFolders(currentUser.uid)
        ]);
        userFolders = folders; 
        
        if (currentFolderId) {
            const folder = folders.find(f => f.id === currentFolderId);
            sanctuaryTitle.textContent = folder ? folder.name : "Unknown Folder";
            sanctuarySubtitle.textContent = "Folder Collection";
            folderBackBtn.classList.remove('hidden');
            foldersSection.classList.add('hidden'); 
            createFolderBtn.classList.add('hidden'); 
            
            const filtered = specimens.filter(s => s.folderId === currentFolderId);
            if (filtered.length === 0) sanctuaryEmptyState.classList.remove('hidden');
            else {
                sanctuaryEmptyState.classList.add('hidden');
                renderSpecimenGallery(filtered, sanctuaryGallery);
            }
        } else {
            sanctuaryTitle.textContent = "My Sanctuary";
            sanctuarySubtitle.textContent = "Your collection of saved specimens";
            folderBackBtn.classList.add('hidden');
            foldersSection.classList.remove('hidden');
            createFolderBtn.classList.remove('hidden');
            
            renderFolders(folders);
            
            const unsorted = specimens.filter(s => !s.folderId);
            if (unsorted.length === 0 && folders.length === 0) {
                sanctuaryEmptyState.classList.remove('hidden');
            } else {
                sanctuaryEmptyState.classList.add('hidden');
                renderSpecimenGallery(unsorted, sanctuaryGallery);
            }
        }
    } catch (error) {
        console.error("Failed to load sanctuary:", error);
        sanctuaryGallery.innerHTML = `<div class="col-span-full text-center text-red-400">Error loading sanctuary data.</div>`;
    } finally {
        sanctuaryLoader.classList.add('hidden');
    }
}

// --- MODAL & DETAILS ---
function handleSpecimenCardClick(e) {
    const card = e.target.closest('.specimen-card');
    if (!card) return;
    const { slug, name } = card.dataset;
    openSpecimenModal(slug, name);
}

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
                     <div class="bg-gray-800/40 p-3 rounded-lg border border-white/5"><span class="text-gray-500 text-xs uppercase block mb-1">Predators</span><span class="text-orange-300 text-sm block" title="${get(data.predators)}">${get(data.predators)}</span></div>
                 </div>
                 <div class="bg-indigo-900/20 border-l-4 border-indigo-500 p-4 rounded-r-lg"><h3 class="flex items-center text-sm font-bold text-indigo-300 mb-2 uppercase tracking-wide">Did You Know?</h3><ul class="list-none space-y-1">${funFacts}</ul></div>
            </div>
        </div>
        ${zoologistHtml}`;
}

// --- CORE INIT LOGIC ---
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
                    userName.textContent = user.displayName; userPhoto.src = user.photoURL; 
                    loadSanctuarySpecimens();
                } else {
                    signInBtn.classList.remove('hidden'); userInfo.classList.add('hidden'); userInfo.classList.remove('flex');
                    // When signed out, show empty sanctuary state
                    loadSanctuarySpecimens();
                }
            });
            modalBackdrop.classList.add('hidden');
        });
    } catch (e) { alert("Init failed: " + e.message); }
}

// --- SAVE / DELETE / QA LOGIC ---

async function handleSaveToggle() {
    if (!currentUser) return alert("Sign in to save.");
    saveSpecimenBtn.disabled = true;
    try {
        if (saveSpecimenBtn.textContent === 'Saved') {
            await removeSpecimen(currentUser.uid, currentModalSpecimen.slug);
            updateSaveButtonState(false);
        } else {
            await saveSpecimen(currentUser.uid, currentModalSpecimen);
            updateSaveButtonState(true);
        }
        loadSanctuarySpecimens();
    } catch (e) { console.error(e); } finally { saveSpecimenBtn.disabled = false; }
}

function updateSaveButtonState(isSaved) {
    if (isSaved) {
        saveSpecimenBtn.textContent = 'Saved';
        saveSpecimenBtn.classList.remove('bg-green-600');
        saveSpecimenBtn.classList.add('bg-red-600');
    } else {
        saveSpecimenBtn.textContent = 'Save to Sanctuary';
        saveSpecimenBtn.classList.remove('bg-red-600');
        saveSpecimenBtn.classList.add('bg-green-600');
    }
}

async function handleRefreshData() {
    if (!confirm("Regenerate Field Guide with AI?")) return;
    refreshSpecimenBtn.classList.add('rotate-center');
    try {
        const geminiData = await fetchAugmentedSpecimenData(currentModalSpecimen);
        const updated = { ...currentModalSpecimen, ...geminiData };
        if (updated.docId) {
             await saveSpecimen(currentUser.uid, updated, updated.docId);
        }
        currentModalSpecimen = updated;
        modalContent.innerHTML = createSpecimenDetailHtml(updated);
        
        // Re-attach QA section
        const qaSectionClone = careQuestionSection.cloneNode(true); // Create fresh clone
        qaSectionClone.classList.remove('hidden');
        modalContent.appendChild(qaSectionClone);
        
        // Re-bind events for the new clone
        // Note: The global careQuestionForm variable still points to the original hidden one in the DOM.
        // We need to find the NEW form inside modalContent.
        const newForm = modalContent.querySelector('#care-question-form');
        if (newForm) {
            newForm.addEventListener('submit', (e) => {
                e.preventDefault();
                handleCareQuestionSubmit(e, modalContent); // Pass context
            });
        }

        setupGalleryListeners();
    } catch (e) { alert("Refresh failed."); } 
    finally { refreshSpecimenBtn.classList.remove('rotate-center'); }
}

function setupCareQuestionForm(history) {
    // This is called when Modal OPENS. 
    // The elements careQuestionForm etc are the ones CLONED into the modal.
    // We need to attach the listener to the *visible* form inside modalContent.
    
    const visibleForm = modalContent.querySelector('#care-question-form');
    if (!visibleForm) return;

    // Remove old listeners (by cloning replacing)? 
    // Easier to just attach a fresh one that delegates.
    visibleForm.onsubmit = (e) => handleCareQuestionSubmit(e, modalContent);
}

async function handleCareQuestionSubmit(e, context) {
    e.preventDefault();
    const input = context.querySelector('#care-question-input');
    const responseContainer = context.querySelector('#care-response-container');
    const responseText = context.querySelector('#care-response-text');
    const loader = context.querySelector('#care-response-loader');
    const submitBtn = context.querySelector('#care-question-submit');

    const q = input.value.trim();
    if (!q) return;

    responseText.classList.add('hidden');
    loader.classList.remove('hidden');
    submitBtn.disabled = true;

    try {
        const answer = await fetchCustomCareAdvice(currentModalSpecimen, q);
        responseText.innerHTML = `<span class="text-indigo-300 font-bold">Q: ${q}</span><br><br>${answer}`;
        
        // Save QA to history if saved
        if (currentModalSpecimen.docId) {
            const entry = { q, a: answer, date: Date.now() };
            const history = currentModalSpecimen.qa_history || [];
            history.push(entry);
            currentModalSpecimen.qa_history = history;
            await saveSpecimen(currentUser.uid, currentModalSpecimen, currentModalSpecimen.docId);
        }
    } catch (err) {
        responseText.textContent = "Zoologist is busy. Try again.";
    } finally {
        loader.classList.add('hidden');
        responseText.classList.remove('hidden');
        submitBtn.disabled = false;
        input.value = '';
    }
}

// --- AI SUGGESTIONS ---

async function loadCollectionSuggestions(query) {
    aiSuggestionsContainer.classList.remove('hidden');
    aiSuggestionsList.classList.add('hidden');
    aiSuggestionsLoader.classList.remove('hidden');
    aiSuggestionsList.innerHTML = '';

    try {
        const suggestions = await fetchCollectionSuggestions(query);
        aiSuggestionsLoader.classList.add('hidden');
        aiSuggestionsList.classList.remove('hidden');
        
        if (suggestions.length === 0) {
            aiSuggestionsContainer.classList.add('hidden');
            return;
        }

        aiSuggestionsList.innerHTML = `
            <div class="flex flex-wrap gap-2">
                ${suggestions.map(s => `
                    <button class="suggestion-btn px-3 py-1 bg-gray-700 hover:bg-green-600 rounded-full text-xs text-white transition-colors border border-gray-600" data-name="${s.common_name}">
                        ${s.common_name}
                    </button>
                `).join('')}
            </div>
        `;
        
        aiSuggestionsList.querySelectorAll('.suggestion-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                searchInput.value = btn.dataset.name;
                handleSearchSubmit({ preventDefault: () => {} });
            });
        });

    } catch (e) {
        aiSuggestionsContainer.classList.add('hidden');
    }
}

// --- IMAGE UPLOAD LOGIC ---
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

async function handleUpdatePhoto() {
    if (!updateImageInput.files || !updateImageInput.files[0]) return;
    const file = updateImageInput.files[0];
    updateImageBtn.innerHTML = '⏳';
    updateImageBtn.disabled = true;
    try {
        if (!currentUser) throw new Error("Please sign in to upload photos.");
        const { original, thumb } = await uploadSpecimenImage(file, currentUser.uid);
        currentModalSpecimen.image_url = thumb; 
        currentModalSpecimen.original_image_url = original;
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
        updateImageInput.value = ''; 
    }
}
function closeModal() { specimenDetailModal.classList.add('hidden'); currentModalSpecimen = null; }

main();
