/*
 * APP.JS
 * The Controller for the "Life Explorer" SPA.
 * Updated: 
 * - FIX: Implemented thumbnail-for-display, original-for-lightbox logic.
 * - FIX: Image uploads now correctly store both thumbnail and original URLs.
 */

import { setApiKeys } from './config.js';
import { 
    initFirebase, signInWithGoogle, signOutUser, searchSpecimens, getSpecimenDetails,
    fetchSpecimenCard, 
    fetchCustomCareAdvice, fetchScientificNameLookup, fetchCollectionSuggestions, fetchImageIdentification,
    saveSpecimen, removeSpecimen, getSavedSpecimens, getSavedSpecimen, uploadMedia,
    createFolder, getUserFolders, deleteUserFolder, moveSpecimenToFolder
} from './api.js';

// --- DOM Variables ---
let modalBackdrop, apiKeyForm, appContainer, mainContent, authContainer, signInBtn, signOutBtn, userInfo, userName, userPhoto, 
    searchForm, searchInput, sanctuaryView, searchResultsView, specimenGallery, loader, paginationContainer, prevBtn, nextBtn, pageInfo, galleryHeader, galleryTitle, backToSanctuaryBtn,
    sanctuaryLoader, sanctuaryGallery, sanctuaryEmptyState, createFolderBtn, foldersSection, foldersGallery, folderBackBtn, sanctuaryTitle, sanctuarySubtitle,
    specimenDetailModal, modalTitle, modalCloseBtn, modalContentContainer, modalLoader, modalContent, saveSpecimenBtn, refreshSpecimenBtn, 
    updateImageBtn, updateImageInput, uploadVideoBtn, uploadVideoInput,
    careQuestionSection, careQuestionForm, careQuestionInput, careQuestionSubmit, careResponseContainer, careResponseText, careResponseLoader, scientificLookupBtn,
    aiSuggestionsContainer, aiSuggestionsList, aiSuggestionsLoader,
    identifySpecimenBtn, imageUploadModal, imageModalCloseBtn, imageUploadForm, imageFileInput, imagePreviewContainer, imagePreview, previewPlaceholder, uploadStatus, uploadMessage, identifyImageBtn,
    lightboxModal, lightboxImage, lightboxPlaceholder, lightboxCloseBtn,
    moveModal, moveModalCloseBtn, moveFolderSelect, confirmMoveBtn;

// --- State ---
let currentSearchQuery = null;
let currentPage = 1;
let currentMeta = null;
let currentUser = null; 
let currentModalSpecimen = null; 
let userFolders = [];
let currentFolderId = null; 
let specimenToMoveId = null; 
let currentCardType = 'field_guide'; 

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
    
    searchForm = document.getElementById('search-form');
    searchInput = document.getElementById('search-input');
    scientificLookupBtn = document.getElementById('scientific-lookup-btn');
    sanctuaryView = document.getElementById('sanctuary-view');
    searchResultsView = document.getElementById('search-results-view');
    
    specimenGallery = document.getElementById('specimen-gallery');
    loader = document.getElementById('loader');
    galleryHeader = document.getElementById('gallery-header');
    galleryTitle = document.getElementById('gallery-title');
    backToSanctuaryBtn = document.getElementById('back-to-collections-btn'); 
    paginationContainer = document.getElementById('pagination-container');
    prevBtn = document.getElementById('prev-btn');
    nextBtn = document.getElementById('next-btn');
    pageInfo = document.getElementById('page-info');
    
    sanctuaryLoader = document.getElementById('sanctuary-loader');
    sanctuaryGallery = document.getElementById('sanctuary-gallery');
    sanctuaryEmptyState = document.getElementById('sanctuary-empty-state');
    createFolderBtn = document.getElementById('create-folder-btn');
    foldersSection = document.getElementById('folders-section');
    foldersGallery = document.getElementById('folders-gallery');
    folderBackBtn = document.getElementById('folder-back-btn');
    sanctuaryTitle = document.getElementById('sanctuary-title');
    sanctuarySubtitle = document.getElementById('sanctuary-subtitle');

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
    uploadVideoBtn = document.getElementById('upload-video-btn');
    uploadVideoInput = document.getElementById('upload-video-input');
    
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

    lightboxModal = document.getElementById('lightbox-modal');
    lightboxImage = document.getElementById('lightbox-image');
    lightboxPlaceholder = document.getElementById('lightbox-placeholder');
    lightboxCloseBtn = document.getElementById('lightbox-close-btn');
    
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
    if (prevBtn) prevBtn.addEventListener('click', handlePrevClick);
    if (nextBtn) nextBtn.addEventListener('click', handleNextClick);
    if (specimenGallery) specimenGallery.addEventListener('click', handleSpecimenCardClick);
    if (sanctuaryGallery) sanctuaryGallery.addEventListener('click', handleSanctuaryGridClick);
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
    if (specimenDetailModal) {
        specimenDetailModal.addEventListener('click', (e) => {
            if (e.target === specimenDetailModal) closeModal();
        });
    }
    if (saveSpecimenBtn) saveSpecimenBtn.addEventListener('click', handleSaveToggle);
    if (refreshSpecimenBtn) refreshSpecimenBtn.addEventListener('click', handleRefreshData);
    if (updateImageBtn && updateImageInput) updateImageBtn.addEventListener('click', () => updateImageInput.click());
    if (updateImageInput) updateImageInput.addEventListener('change', handleAddImage); 
    if (uploadVideoBtn && uploadVideoInput) uploadVideoBtn.addEventListener('click', () => uploadVideoInput.click());
    if (uploadVideoInput) uploadVideoInput.addEventListener('change', handleUploadVideo);
    if (identifySpecimenBtn) identifySpecimenBtn.addEventListener('click', openImageUploadModal);
    if (imageModalCloseBtn) imageModalCloseBtn.addEventListener('click', closeImageUploadModal);
    if (imageUploadForm) imageUploadForm.addEventListener('submit', handleImageUpload);
    if (imageFileInput) imageFileInput.addEventListener('change', handleImageFileChange);
    if (lightboxCloseBtn) lightboxCloseBtn.addEventListener('click', closeLightbox);
    if (lightboxModal) {
        lightboxModal.addEventListener('click', (e) => {
            if (e.target === lightboxModal) closeLightbox();
        });
    }
    if (createFolderBtn) createFolderBtn.addEventListener('click', handleCreateFolder);
    if (folderBackBtn) folderBackBtn.addEventListener('click', () => { currentFolderId = null; loadSanctuarySpecimens(); });
    if (foldersGallery) foldersGallery.addEventListener('click', handleFolderClick);
    if (moveModalCloseBtn) moveModalCloseBtn.addEventListener('click', () => moveModal.classList.add('hidden'));
    if (confirmMoveBtn) confirmMoveBtn.addEventListener('click', executeMoveSpecimen);
}

// --- HANDLERS ---

async function handleApiKeySubmit(e) {
    e.preventDefault();
    const formData = new FormData(apiKeyForm);
    const geminiKey = formData.get('gemini-key');
    const clientId = formData.get('google-client-id');
    const firebaseConfigStr = formData.get('firebase-config');

    try {
        const firebaseConfig = JSON.parse(firebaseConfigStr);
        setApiKeys({ gemini: geminiKey, googleClientId: clientId, firebase: firebaseConfig });
        modalBackdrop.classList.add('hidden');
        const result = await initFirebase();
        if (result && result.auth) {
            result.onAuthStateChanged(result.auth, (user) => {
                currentUser = user;
                updateAuthUI();
                if (user) {
                    loadSanctuarySpecimens();
                    getUserFolders(user.uid).then(folders => { userFolders = folders; renderFolders(); });
                } else {
                    sanctuaryGallery.innerHTML = '';
                    foldersGallery.innerHTML = '';
                    sanctuaryEmptyState.classList.remove('hidden');
                }
            });
        }
    } catch (error) {
        console.error(error);
        alert('Error initializing: ' + error.message);
    }
}

async function handleGoogleSignIn() {
    try {
        const user = await signInWithGoogle();
        if (user) { currentUser = user; updateAuthUI(); loadSanctuarySpecimens(); }
    } catch (e) { console.error("Sign in error:", e); }
}

async function handleGoogleSignOut() {
    await signOutUser();
    currentUser = null;
    updateAuthUI();
    sanctuaryGallery.innerHTML = '';
    foldersGallery.innerHTML = '';
    sanctuaryEmptyState.classList.remove('hidden');
    foldersSection.classList.add('hidden');
}

function updateAuthUI() {
    if (currentUser) {
        authContainer.classList.add('bg-gray-800', 'rounded-full');
        signInBtn.classList.add('hidden');
        userInfo.classList.remove('hidden');
        userInfo.classList.add('flex');
        userName.textContent = currentUser.displayName || "Explorer";
        userPhoto.src = currentUser.photoURL || "https://ui-avatars.com/api/?name=Explorer&background=random";
    } else {
        authContainer.classList.remove('bg-gray-800', 'rounded-full');
        signInBtn.classList.remove('hidden');
        userInfo.classList.add('hidden');
        userInfo.classList.remove('flex');
    }
}

async function loadSanctuarySpecimens() {
    if (!currentUser) return;
    sanctuaryLoader.classList.remove('hidden');
    sanctuaryGallery.innerHTML = '';
    sanctuaryEmptyState.classList.add('hidden');

    if (currentFolderId) {
        const folder = userFolders.find(f => f.id === currentFolderId);
        sanctuaryTitle.textContent = folder ? folder.name : 'Folder';
        sanctuarySubtitle.textContent = 'Folder Collection';
        foldersSection.classList.add('hidden');
        folderBackBtn.classList.remove('hidden');
        createFolderBtn.classList.add('hidden');
    } else {
        sanctuaryTitle.textContent = 'My Sanctuary';
        sanctuarySubtitle.textContent = 'Your collection of saved specimens';
        foldersSection.classList.remove('hidden');
        folderBackBtn.classList.add('hidden');
        createFolderBtn.classList.remove('hidden');
    }

    try {
        const specimens = await getSavedSpecimens(currentUser.uid);
        const filtered = specimens.filter(s => {
            if (currentFolderId) return s.folderId === currentFolderId;
            return !s.folderId;
        });

        if (filtered.length === 0) {
            sanctuaryEmptyState.classList.remove('hidden');
            if (currentFolderId) sanctuaryEmptyState.querySelector('h3').textContent = "Empty Folder";
        } else {
            renderSpecimenGallery(filtered, sanctuaryGallery);
        }
    } catch (error) {
        console.error(error);
        sanctuaryGallery.innerHTML = '<p class="text-red-400">Error loading sanctuary.</p>';
    } finally {
        sanctuaryLoader.classList.add('hidden');
    }
}

async function handleCreateFolder() {
    if (!currentUser) return alert("Sign in first.");
    const name = prompt("Folder Name:");
    if (!name) return;
    try {
        await createFolder(currentUser.uid, name);
        userFolders = await getUserFolders(currentUser.uid);
        renderFolders();
    } catch (e) { alert(e.message); }
}

function renderFolders() {
    if (!foldersGallery) return;
    foldersGallery.innerHTML = '';
    userFolders.forEach(folder => {
        const div = document.createElement('div');
        div.className = 'folder-card p-4 rounded-xl cursor-pointer transition-all duration-300 relative group';
        div.dataset.id = folder.id;
        div.innerHTML = `
            <button class="delete-folder-btn absolute top-2 right-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity z-10" title="Delete Folder">&times;</button>
            <div class="text-center">
                <span class="text-4xl block mb-2">📁</span>
                <h4 class="text-white font-bold truncate">${folder.name}</h4>
                <p class="text-xs text-gray-400 mt-1">Collection</p>
            </div>
        `;
        div.querySelector('.delete-folder-btn').addEventListener('click', async (e) => {
            e.stopPropagation();
            if(confirm(`Delete folder "${folder.name}"? Items inside will be moved to main sanctuary.`)) {
                await deleteUserFolder(currentUser.uid, folder.id);
                userFolders = await getUserFolders(currentUser.uid);
                renderFolders();
                loadSanctuarySpecimens();
            }
        });
        foldersGallery.appendChild(div);
    });
}

function handleFolderClick(e) {
    const card = e.target.closest('.folder-card');
    if (card) { currentFolderId = card.dataset.id; loadSanctuarySpecimens(); }
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
        const opt = document.createElement('option');
        opt.value = f.id; opt.textContent = f.name;
        moveFolderSelect.appendChild(opt);
    });
}

async function executeMoveSpecimen() {
    if (!specimenToMoveId) return;
    const folderId = moveFolderSelect.value || null;
    confirmMoveBtn.disabled = true; confirmMoveBtn.textContent = "Moving...";
    try {
        await moveSpecimenToFolder(currentUser.uid, specimenToMoveId, folderId);
        moveModal.classList.add('hidden');
        loadSanctuarySpecimens();
    } catch (e) { alert("Move failed: " + e.message); } 
    finally { confirmMoveBtn.disabled = false; confirmMoveBtn.textContent = "Move Specimen"; }
}

function handleSpecimenCardClick(e) {
    const card = e.target.closest('.specimen-card');
    if (!card) return;
    const slug = card.dataset.slug;
    const name = card.dataset.name;
    if (slug) openSpecimenModal(slug, name);
}

async function handleScientificLookup() {
    const common = searchInput.value.trim();
    if (!common) return alert("Enter a name first.");
    scientificLookupBtn.classList.add('animate-spin');
    try {
        const sciName = await fetchScientificNameLookup(common);
        if (sciName) { searchInput.value = sciName; handleSearchSubmit({ preventDefault: () => {} }); } 
        else { alert("Could not determine scientific name."); }
    } catch (e) { console.error(e); }
    finally { scientificLookupBtn.classList.remove('animate-spin'); }
}

// --- LIGHTBOX ---
function openLightbox(src) {
    if (!lightboxModal) return;
    lightboxImage.src = src;
    lightboxImage.className = 'max-w-[95vw] max-h-[95vh] object-contain rounded shadow-2xl'; 
    lightboxImage.classList.remove('hidden');
    lightboxPlaceholder.classList.add('hidden');
    lightboxModal.classList.remove('hidden');
}

function closeLightbox() {
    lightboxModal.classList.add('hidden');
    lightboxImage.src = '';
}

// --- TAB RENDERING ---
function renderTabs() {
    const tabs = [
        { id: 'field_guide', icon: '📖', label: 'Field Guide' },
        { id: 'historian', icon: '🏺', label: 'History' },
        { id: 'evolutionist', icon: '🧬', label: 'Evolution' },
        { id: 'ecologist', icon: '🛡️', label: 'Ecology' },
        { id: 'storyteller', icon: '✍️', label: 'Story' }
    ];

    const tabContainer = document.createElement('div');
    tabContainer.className = 'flex flex-wrap gap-2 mb-6 border-b border-gray-700 pb-2';
    tabs.forEach(tab => {
        const btn = document.createElement('button');
        const isActive = currentCardType === tab.id;
        btn.className = `px-4 py-2 rounded-t-lg font-bold text-sm transition-colors flex items-center gap-2 ${isActive ? 'bg-gray-700 text-white border-b-2 border-green-500' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`;
        btn.innerHTML = `<span>${tab.icon}</span> <span class="hidden sm:inline">${tab.label}</span>`;
        btn.onclick = () => handleTabSwitch(tab.id);
        tabContainer.appendChild(btn);
    });
    return tabContainer;
}

async function handleTabSwitch(newType) {
    if (currentCardType === newType) return;
    currentCardType = newType;
    modalContent.innerHTML = '';
    modalLoader.classList.remove('hidden');
    modalContent.classList.add('hidden');
    
    let hasData = false;
    if (newType === 'field_guide') { hasData = !!currentModalSpecimen.zoologist_intro; } 
    else { hasData = currentModalSpecimen.cards && currentModalSpecimen.cards[newType]; }

    if (hasData) {
        modalLoader.classList.add('hidden');
        modalContent.classList.remove('hidden');
        renderFullModalContent();
    } else {
        await handleRefreshData(true);
    }
}

// --- MODAL & DETAILS ---
async function openSpecimenModal(slug, name) {
    specimenDetailModal.classList.remove('hidden');
    modalContent.classList.add('hidden');
    modalLoader.classList.remove('hidden');
    modalTitle.textContent = name || "Loading...";
    refreshSpecimenBtn.classList.add('hidden');
    updateImageBtn.classList.remove('hidden'); 
    uploadVideoBtn.classList.remove('hidden');
    
    currentCardType = 'field_guide';
    modalContent.innerHTML = '';
    
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
                if (!currentModalSpecimen.cards) currentModalSpecimen.cards = {};
                if (!currentModalSpecimen.gallery_images) currentModalSpecimen.gallery_images = [];
                if (currentModalSpecimen.image_url && !currentModalSpecimen.gallery_images.includes(currentModalSpecimen.image_url)) {
                    currentModalSpecimen.gallery_images.unshift(currentModalSpecimen.image_url);
                }
                
                modalTitle.textContent = currentModalSpecimen.common_name;
                renderFullModalContent();
                updateSaveButtonState(true);
                saveSpecimenBtn.classList.remove('hidden');
                refreshSpecimenBtn.classList.remove('hidden'); 
                modalLoader.classList.add('hidden');
                modalContent.classList.remove('hidden');
                return;
            }
            if (savedResult.data) isSaved = true;
        }
        if (currentUser) { updateSaveButtonState(isSaved); saveSpecimenBtn.classList.remove('hidden'); }

        if (!gbifData) {
            modalLoader.querySelector('p').textContent = 'Fetching GBIF Taxonomy...';
            gbifData = await getSpecimenDetails(resolvedSlug);
        }
        
        modalLoader.querySelector('p').textContent = 'Consulting the Zoologist (AI)...';
        const geminiData = await fetchSpecimenCard(gbifData, 'field_guide');

        currentModalSpecimen = { ...gbifData, ...geminiData, qa_history: [], gallery_images: [], cards: {} };
        if (currentModalSpecimen.image_url) currentModalSpecimen.gallery_images.push(currentModalSpecimen.image_url);
        if (name && currentModalSpecimen.common_name === currentModalSpecimen.scientific_name) currentModalSpecimen.common_name = name;

        modalTitle.textContent = currentModalSpecimen.common_name;
        renderFullModalContent();

    } catch (error) {
        console.error(error);
        modalContent.innerHTML = `<p class="text-red-400">Error: ${error.message}</p>`;
    } finally {
        modalLoader.classList.add('hidden');
        modalContent.classList.remove('hidden');
        modalLoader.querySelector('p').textContent = 'Loading details...';
    }
}

function renderFullModalContent() {
    modalContent.innerHTML = '';
    modalContent.appendChild(renderTabs());
    const contentDiv = document.createElement('div');
    contentDiv.innerHTML = createSpecimenDetailHtml(currentModalSpecimen);
    modalContent.appendChild(contentDiv);
    
    // Attach delete listeners
    const deleteBtns = contentDiv.querySelectorAll('.delete-img-btn');
    deleteBtns.forEach(btn => {
        btn.addEventListener('click', (e) => handleDeleteImage(e, btn.dataset.src));
    });

    const qaSectionClone = careQuestionSection.cloneNode(true);
    qaSectionClone.classList.remove('hidden');
    modalContent.appendChild(qaSectionClone);
    
    const newForm = modalContent.querySelector('#care-question-form');
    if (newForm) newForm.onsubmit = (e) => handleCareQuestionSubmit(e, modalContent);
    
    setupGalleryListeners();
}

function createSpecimenDetailHtml(data) {
    const get = (v, d = 'N/A') => (v === null || v === undefined || v === '') ? d : v;
    
    // Media
    const hasImage = !!data.image_url;
    // Use thumbnail for display if available, otherwise fall back to image_url
    const displayImage = data.thumb_url || data.image_url || 'https://placehold.co/400x400/374151/FFFFFF?text=No+Photo';
    const fullRes = data.original_image_url || data.image_url;
    
    let galleryImages = data.gallery_images || [];
    if (galleryImages.length === 0 && hasImage) galleryImages = [displayImage];

    const videoHtml = data.video_url ? `
        <div class="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-lg mb-4 relative group">
            <video src="${data.video_url}" controls class="w-full h-full object-contain"></video>
        </div>` : '';

    const mainImageHtml = !data.video_url ? `
        <div class="card-image-wrapper rounded-xl overflow-hidden shadow-lg bg-gray-900/50 mb-4 group relative">
            <img id="main-specimen-image" src="${displayImage}" data-full-res="${fullRes}" alt="${get(data.common_name)}" class="w-full h-auto object-cover cursor-zoom-in" onerror="this.onerror=null;this.src='https://placehold.co/400x400/374151/FFFFFF?text=No+Image';">
        </div>` : '';

    const galleryHtml = (galleryImages.length > 0) ? 
        `<div class="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
            ${galleryImages.map((img, idx) => {
                const isActive = !data.video_url && (img === displayImage);
                return `
                <div class="relative flex-shrink-0 group">
                    <img src="${img}" 
                         data-full-res="${data.original_image_url}" 
                         class="gallery-thumb h-20 w-20 object-cover rounded-lg cursor-pointer transition-all border border-gray-600 ${isActive ? 'ring-2 ring-green-400 opacity-100' : 'opacity-70 hover:opacity-100'}" 
                         alt="Thumbnail">
                    <button class="delete-img-btn absolute -top-1 -right-1 bg-red-600 hover:bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-sm" data-src="${img}" title="Delete Photo">&times;</button>
                </div>`;
            }).join('')}
        </div>` : '';

    const mediaColumn = `
        <div class="w-full lg:w-1/3 flex-shrink-0">
            ${videoHtml}
            ${mainImageHtml}
            ${galleryHtml}
        </div>`;

    let headerAndStats = '';
    let narrativeText = '';

    if (currentCardType === 'field_guide') {
        const funFacts = Array.isArray(data.fun_facts) ? data.fun_facts.map(f => `<li class="text-gray-300 text-sm mb-1">• ${f}</li>`).join('') : '<li class="text-gray-500">No facts available.</li>';
        
        headerAndStats = `
             <div class="mb-6 border-b border-gray-700 pb-6">
                <h2 class="text-4xl font-bold text-white mb-2">${get(data.common_name)}</h2>
                <p class="text-xl text-gray-400 font-mono">${get(data.scientific_name)}</p>
                <div class="flex items-center mt-3 gap-3">
                    <span class="inline-block px-3 py-1 rounded-full text-sm font-bold bg-gray-700 text-white border border-gray-600">${get(data.conservation_status)}</span>
                    <span class="text-xs text-gray-500 uppercase tracking-widest font-semibold">${get(data.class)} / ${get(data.order)}</span>
                </div>
             </div>
             <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                 <div class="bg-gray-800/40 p-3 rounded-lg border border-white/5"><span class="text-gray-500 text-xs uppercase block mb-1">Diet</span><span class="text-gray-200 font-bold text-sm block">${get(data.diet)}</span></div>
                 <div class="bg-gray-800/40 p-3 rounded-lg border border-white/5"><span class="text-gray-500 text-xs uppercase block mb-1">Lifespan</span><span class="text-green-400 font-bold text-sm block">${get(data.lifespan)}</span></div>
                 <div class="bg-gray-800/40 p-3 rounded-lg border border-white/5"><span class="text-gray-500 text-xs uppercase block mb-1">Family</span><span class="text-gray-200 text-sm block truncate" title="${get(data.family)}">${get(data.family)}</span></div>
                 <div class="bg-gray-800/40 p-3 rounded-lg border border-white/5"><span class="text-gray-500 text-xs uppercase block mb-1">Predators</span><span class="text-orange-300 text-sm block" title="${get(data.predators)}">${get(data.predators)}</span></div>
             </div>
             <div class="bg-indigo-900/20 border-l-4 border-indigo-500 p-4 rounded-r-lg">
                <h3 class="flex items-center text-sm font-bold text-indigo-300 mb-2 uppercase tracking-wide">Did You Know?</h3>
                <ul class="list-none space-y-1">${funFacts}</ul>
             </div>`;

        if (data.zoologist_intro) {
            narrativeText = `
                <div class="zoologist-text space-y-8 mt-4 border-t border-gray-700 pt-8 animate-fade-in">
                    <div class="prose prose-invert max-w-none"><p class="text-lg text-gray-200 leading-relaxed font-medium">${get(data.zoologist_intro)}</p></div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div><h3 class="text-2xl font-bold text-white mb-4 flex items-center"><span class="text-green-400 mr-3 text-lg">●</span> Physical Characteristics</h3><p class="text-gray-300 leading-relaxed">${get(data.detailed_physical)}</p></div>
                        <div><h3 class="text-2xl font-bold text-white mb-4 flex items-center"><span class="text-blue-400 mr-3 text-lg">●</span> Habitat & Distribution</h3><p class="text-gray-300 leading-relaxed">${get(data.detailed_habitat)}</p></div>
                    </div>
                    <div class="bg-gray-800/30 p-6 rounded-2xl border border-white/5"><h3 class="text-2xl font-bold text-white mb-4 flex items-center"><span class="text-orange-400 mr-3 text-lg">●</span> Behavior & Life Cycle</h3><p class="text-gray-300 leading-relaxed">${get(data.detailed_behavior)}</p></div>
                </div>`;
        } else {
            narrativeText = `<div class="bg-gray-800/50 p-6 rounded-xl border border-yellow-500/30 mt-6 text-center"><p class="text-gray-300 mb-2">This specimen has legacy data.</p><p class="text-yellow-400 font-bold">Click the 🔄 Refresh button to generate.</p></div>`;
        }

    } else {
        // Generic Card
        const cardData = data.cards[currentCardType];
        if (!cardData) return `<div class="flex flex-col lg:flex-row gap-8 mb-8">${mediaColumn}<div class="w-full lg:w-2/3 flex items-center justify-center border border-dashed border-gray-600 rounded-xl p-10"><p class="text-gray-400">Data not generated yet.</p></div></div>`;
        
        const insightsHtml = Array.isArray(cardData.insights) ? cardData.insights.map(i => `<li class="text-gray-300 text-lg mb-2 pl-2 border-l-2 border-green-500">${i}</li>`).join('') : '';
        const dataPointsHtml = cardData.data_points ? `<div class="grid grid-cols-2 gap-4 mb-4">${Object.entries(cardData.data_points).map(([k, v]) => `
            <div class="bg-gray-800/50 p-3 rounded-lg"><span class="block text-xs uppercase text-gray-500 tracking-wider">${k}</span><span class="block text-white font-bold">${v}</span></div>
        `).join('')}</div>` : '';

        headerAndStats = `
             <div class="mb-6 border-b border-gray-700 pb-6">
                <h2 class="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 mb-2">${cardData.title}</h2>
                <p class="text-xl text-gray-400">${get(data.common_name)}</p>
             </div>
             ${dataPointsHtml}
             <div class="bg-gray-800/30 p-6 rounded-2xl border border-white/5 mt-6">
                <h3 class="text-sm font-bold text-green-400 uppercase tracking-wide mb-4">Key Insights</h3>
                <ul class="list-none space-y-2">${insightsHtml}</ul>
             </div>`;

        narrativeText = `
             <div class="prose prose-invert prose-lg max-w-none mt-4 border-t border-gray-700 pt-8 animate-fade-in">
                <p class="text-gray-200 leading-loose">${cardData.main_text}</p>
             </div>`;
    }

    return `
    <div class="flex flex-col lg:flex-row gap-8 mb-8">
        ${mediaColumn}
        <div class="w-full lg:w-2/3">
            ${headerAndStats}
        </div>
    </div>
    <div class="w-full">
        ${narrativeText}
    </div>`;
}

async function handleDeleteImage(e, srcToDelete) {
    e.stopPropagation();
    if (!currentUser) return alert("Sign in required.");
    if (!confirm("Delete this photo? This cannot be undone.")) return;
    
    let images = currentModalSpecimen.gallery_images || [];
    images = images.filter(img => img !== srcToDelete);
    currentModalSpecimen.gallery_images = images;

    if (currentModalSpecimen.image_url === srcToDelete) {
        currentModalSpecimen.image_url = images.length > 0 ? images[0] : null;
        // Also update original_image_url if it matches
        if (currentModalSpecimen.original_image_url === srcToDelete) {
             currentModalSpecimen.original_image_url = images.length > 0 ? images[0] : null;
        }
    }

    if (currentModalSpecimen.docId) {
        try {
            await saveSpecimen(currentUser.uid, currentModalSpecimen, currentModalSpecimen.docId);
            renderFullModalContent();
        } catch (err) {
            alert("Error deleting image: " + err.message);
        }
    } else {
        renderFullModalContent();
    }
}

async function handleRefreshData(isTabSwitch = false) {
    if (!isTabSwitch && !confirm(`Regenerate "${currentCardType.replace('_', ' ')}" data with AI?`)) return;
    
    refreshSpecimenBtn.classList.add('rotate-center');
    refreshSpecimenBtn.disabled = true;
    modalLoader.classList.remove('hidden');
    if(isTabSwitch) modalContent.classList.add('hidden'); 

    try {
        const geminiData = await fetchSpecimenCard(currentModalSpecimen, currentCardType);
        
        if (currentCardType === 'field_guide') {
            currentModalSpecimen = { ...currentModalSpecimen, ...geminiData };
        } else {
            if (!currentModalSpecimen.cards) currentModalSpecimen.cards = {};
            currentModalSpecimen.cards[currentCardType] = geminiData;
        }

        if (currentModalSpecimen.docId) {
             await saveSpecimen(currentUser.uid, currentModalSpecimen, currentModalSpecimen.docId);
        }
        renderFullModalContent();

    } catch (e) { alert("Refresh failed: " + e.message); } 
    finally { 
        refreshSpecimenBtn.classList.remove('rotate-center'); 
        refreshSpecimenBtn.disabled = false;
        modalLoader.classList.add('hidden');
        modalContent.classList.remove('hidden');
    }
}

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

async function handleAddImage() {
    if (!updateImageInput.files || !updateImageInput.files[0]) return;
    const file = updateImageInput.files[0];
    updateImageBtn.innerHTML = '⏳';
    updateImageBtn.disabled = true;
    try {
        if (!currentUser) throw new Error("Please sign in.");
        const { original, thumb } = await uploadMedia(file, currentUser.uid);
        if (!currentModalSpecimen.gallery_images) currentModalSpecimen.gallery_images = [];
        currentModalSpecimen.gallery_images.push(thumb);
        // Store BOTH URLs
        if (!currentModalSpecimen.image_url) {
            currentModalSpecimen.image_url = thumb; // Use thumb for display
            currentModalSpecimen.original_image_url = original; // Keep original for lightbox
        }
        renderFullModalContent();
        if (currentModalSpecimen.docId) await saveSpecimen(currentUser.uid, currentModalSpecimen, currentModalSpecimen.docId);
    } catch (e) { alert("Upload failed: " + e.message); } 
    finally { updateImageBtn.innerHTML = '🖼️ Add Image'; updateImageBtn.disabled = false; updateImageInput.value = ''; }
}

async function handleUploadVideo() {
    if (!uploadVideoInput.files || !uploadVideoInput.files[0]) return;
    const file = uploadVideoInput.files[0];
    uploadVideoBtn.innerHTML = '⏳';
    uploadVideoBtn.disabled = true;
    try {
        if (!currentUser) throw new Error("Please sign in.");
        const { url } = await uploadMedia(file, currentUser.uid);
        currentModalSpecimen.video_url = url;
        renderFullModalContent();
        if (currentModalSpecimen.docId) await saveSpecimen(currentUser.uid, currentModalSpecimen, currentModalSpecimen.docId);
    } catch (e) { alert("Video failed: " + e.message); } 
    finally { uploadVideoBtn.innerHTML = '🎥 Upload Video'; uploadVideoBtn.disabled = false; uploadVideoInput.value = ''; }
}

function setupGalleryListeners() {
    const mainImg = document.getElementById('main-specimen-image');
    const thumbs = modalContent.querySelectorAll('.gallery-thumb');
    
    if (mainImg) {
        mainImg.addEventListener('click', () => {
            // Use data-full-res for lightbox
            openLightbox(mainImg.dataset.fullRes || mainImg.src);
        });
    }
    
    if (thumbs.length > 0) {
        thumbs.forEach(thumb => {
            thumb.addEventListener('click', (e) => {
                if(e.target.closest('.delete-img-btn')) return; 
                // Get full-res URL
                const newSrc = thumb.dataset.fullRes || thumb.src;
                if (mainImg) {
                    // Update main image display (still using thumb for performance)
                    mainImg.src = thumb.src; 
                    // Update data-full-res for when main image is clicked
                    mainImg.dataset.fullRes = newSrc; 
                    thumbs.forEach(t => {
                        t.classList.remove('ring-2', 'ring-green-400', 'opacity-100');
                        t.classList.add('opacity-70');
                    });
                    thumb.classList.remove('opacity-70');
                    thumb.classList.add('ring-2', 'ring-green-400', 'opacity-100');
                } else {
                    // If video is playing, open lightbox directly with full-res
                    openLightbox(newSrc);
                }
            });
        });
    }
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

function handleSearchSubmit(e) {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (query === currentSearchQuery && !searchResultsView.classList.contains('hidden')) return;
    currentSearchQuery = query; currentPage = 1;
    sanctuaryView.classList.add('hidden'); searchResultsView.classList.remove('hidden');
    fetchAndRenderSpecimens(); loadCollectionSuggestions(query);
}

async function fetchAndRenderSpecimens() {
    loader.classList.remove('hidden'); specimenGallery.innerHTML = ''; paginationContainer.classList.add('hidden');
    try {
        const results = await searchSpecimens(currentSearchQuery, currentPage);
        currentMeta = results.meta;
        renderSpecimenGallery(results.data, specimenGallery);
        renderPagination(results.meta);
    } catch (error) { specimenGallery.innerHTML = '<p class="col-span-full text-center text-red-400">Error loading specimens.</p>'; } finally { loader.classList.add('hidden'); }
}

function renderSpecimenGallery(specimens, container) {
    container.innerHTML = '';
    if (specimens.length === 0) {
        container.innerHTML = '<div class="col-span-full text-center py-10"><p class="text-gray-300">No specimens found.</p></div>';
        return;
    }
    specimens.forEach(specimen => {
        const card = document.createElement('div');
        card.className = 'specimen-card glass-panel rounded-xl overflow-hidden cursor-pointer';
        card.dataset.slug = specimen.slug; card.dataset.name = specimen.common_name; if (specimen.docId) card.dataset.docid = specimen.docId;
        const hasImage = !!specimen.image_url;
        const showMoveBtn = (container === sanctuaryGallery);
        card.innerHTML = `
            <div class="card-image-container group-hover:scale-105 transition-transform duration-700 relative">
                <img src="${hasImage ? specimen.image_url : ''}" class="w-full h-full object-cover transition-opacity duration-300 ${hasImage ? '' : 'hidden'}" onload="this.style.opacity=1" onerror="this.style.display='none'; this.nextElementSibling.classList.remove('hidden');">
                <div class="${hasImage ? 'hidden' : ''} absolute inset-0 flex items-center justify-center bg-gray-800 card-image-placeholder"><div class="text-center opacity-30"><span class="text-5xl">🐾</span><p class="text-xs mt-2 text-gray-400">No Photo</p></div></div>
                ${showMoveBtn ? `<div class="absolute top-2 right-2 z-10"><button class="move-specimen-btn bg-gray-900/80 hover:bg-indigo-600 text-white p-2 rounded-lg backdrop-blur-sm transition-colors shadow-lg border border-white/10">📁</button></div>` : ''}
                <div class="card-text-overlay"><h3 class="text-lg font-bold text-white truncate">${specimen.common_name}</h3><p class="text-green-400 text-xs mt-1 truncate">${specimen.scientific_name}</p></div>
            </div>`;
        container.appendChild(card);
    });
}

function handlePrevClick() { if (currentPage > 1) { currentPage--; fetchAndRenderSpecimens(); } }
function handleNextClick() { currentPage++; fetchAndRenderSpecimens(); }
function returnToSanctuary() { searchResultsView.classList.add('hidden'); sanctuaryView.classList.remove('hidden'); specimenGallery.innerHTML = ''; currentSearchQuery = null; }

async function loadCollectionSuggestions(query) {
    aiSuggestionsContainer.classList.remove('hidden');
    aiSuggestionsList.classList.add('hidden');
    aiSuggestionsLoader.classList.remove('hidden');
    aiSuggestionsList.innerHTML = '';
    try {
        const suggestions = await fetchCollectionSuggestions(query);
        aiSuggestionsLoader.classList.add('hidden');
        aiSuggestionsList.classList.remove('hidden');
        if (suggestions.length === 0) { aiSuggestionsContainer.classList.add('hidden'); return; }
        aiSuggestionsList.innerHTML = `
            <div class="flex flex-wrap gap-2">
                ${suggestions.map(s => `
                    <button class="suggestion-btn px-3 py-1 bg-gray-700 hover:bg-green-600 rounded-full text-xs text-white transition-colors border border-gray-600" data-name="${s.common_name}">${s.common_name}</button>
                `).join('')}
            </div>`;
        aiSuggestionsList.querySelectorAll('.suggestion-btn').forEach(btn => {
            btn.addEventListener('click', () => { searchInput.value = btn.dataset.name; handleSearchSubmit({ preventDefault: () => {} }); });
        });
    } catch (e) { aiSuggestionsContainer.classList.add('hidden'); }
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
        const { original, thumb } = await uploadMedia(imageFileInput.files[0], currentUser.uid);
        const result = await fetchImageIdentification(original); 
        if (result && result.scientific_name !== 'Unknown') {
            uploadMessage.textContent = `Found: ${result.common_name}`;
            const gbifResult = await searchSpecimens(result.scientific_name, 1);
            if (gbifResult.data.length > 0) {
                const foundSpecimen = gbifResult.data[0];
                await openSpecimenModal(foundSpecimen.slug, result.common_name);
                
                // Store BOTH URLs correctly
                currentModalSpecimen.image_url = thumb; // Use thumb for display
                currentModalSpecimen.original_image_url = original; // Keep original for lightbox
                currentModalSpecimen.gallery_images = [thumb];
                
                renderFullModalContent();
                closeImageUploadModal();
                alert("Identified! Don't forget to click 'Save to Sanctuary' to keep your photo.");
            } else { alert("Identified as " + result.common_name + ", but not found in GBIF."); }
        } else { throw new Error("Could not identify."); }
    } catch (err) { uploadMessage.textContent = 'Error: ' + err.message; }
}

function closeModal() { specimenDetailModal.classList.add('hidden'); currentModalSpecimen = null; }

main();
