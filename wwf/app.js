import { setApiKeys } from './config.js';
import { 
    initFirebase, signInWithGoogle, signOutUser,
    getPlayers, addPlayer, togglePlayerStatus,
    getWeeks, createNewWeek, updateWeekData
} from './api.js';

// DOM Elements
let apiKeyForm, modalBackdrop, appContainer, authContainer, signInBtn, signOutBtn, userInfo, userName, userPhoto, mainContent;
let viewDashboardBtn, viewPlayersBtn, dashboardView, playersView, playersGrid;
let weekSelector, startWeekBtn, weekTableBody, totalBoostsEl, totalScoreEl, emptyWeekMsg;
let playerModal, newPlayerNameInput, savePlayerBtn, cancelPlayerBtn;
let addPlayerBtn;

// State
let currentUser = null;
let allPlayers = [];
let allWeeks = [];
let currentWeekId = null;
let currentWeekData = null;

document.addEventListener('DOMContentLoaded', () => {
    assignDomElements();
    addEventListeners();
});

function assignDomElements() {
    apiKeyForm = document.getElementById('api-key-form');
    modalBackdrop = document.getElementById('api-key-modal-backdrop');
    appContainer = document.getElementById('app-container');
    authContainer = document.getElementById('auth-container');
    signInBtn = document.getElementById('google-signin-btn');
    signOutBtn = document.getElementById('google-signout-btn');
    userInfo = document.getElementById('user-info');
    userName = document.getElementById('user-name');
    userPhoto = document.getElementById('user-photo');
    mainContent = document.getElementById('main-content');

    viewDashboardBtn = document.getElementById('view-dashboard-btn');
    viewPlayersBtn = document.getElementById('view-players-btn');
    dashboardView = document.getElementById('dashboard-view');
    playersView = document.getElementById('players-view');
    playersGrid = document.getElementById('players-grid');
    addPlayerBtn = document.getElementById('add-player-btn');

    weekSelector = document.getElementById('week-selector');
    startWeekBtn = document.getElementById('start-week-btn');
    weekTableBody = document.getElementById('week-table-body');
    totalBoostsEl = document.getElementById('total-boosts');
    totalScoreEl = document.getElementById('total-score');
    emptyWeekMsg = document.getElementById('empty-week-msg');

    playerModal = document.getElementById('player-modal');
    newPlayerNameInput = document.getElementById('new-player-name');
    savePlayerBtn = document.getElementById('save-player-btn');
    cancelPlayerBtn = document.getElementById('cancel-player-btn');
}

function addEventListeners() {
    apiKeyForm.addEventListener('submit', handleApiKeySubmit);
    signInBtn.addEventListener('click', handleGoogleSignIn);
    signOutBtn.addEventListener('click', handleGoogleSignOut);
    
    viewDashboardBtn.addEventListener('click', () => switchView('dashboard'));
    viewPlayersBtn.addEventListener('click', () => switchView('players'));

    startWeekBtn.addEventListener('click', handleStartNewWeek);
    weekSelector.addEventListener('change', (e) => loadWeekData(e.target.value));

    addPlayerBtn.addEventListener('click', () => playerModal.classList.remove('hidden'));
    cancelPlayerBtn.addEventListener('click', () => playerModal.classList.add('hidden'));
    savePlayerBtn.addEventListener('click', handleAddPlayer);
}

// --- Auth & Init ---

async function handleApiKeySubmit(e) {
    e.preventDefault();
    const formData = new FormData(apiKeyForm);
    const clientId = formData.get('google-client-id');
    const firebaseConfigStr = formData.get('firebase-config');

    try {
        const firebaseConfig = JSON.parse(firebaseConfigStr);
        setApiKeys({ googleClientId: clientId, firebase: firebaseConfig });
        
        modalBackdrop.classList.add('hidden');
        const { onAuthStateChanged } = await initFirebase();
        
        onAuthStateChanged(auth, (user) => {
            currentUser = user;
            updateAuthUI();
            if (user) loadAppData();
            else {
                mainContent.classList.add('hidden');
            }
        });
    } catch (error) {
        alert('Init Error: ' + error.message);
    }
}

async function handleGoogleSignIn() { await signInWithGoogle(); }
async function handleGoogleSignOut() { await signOutUser(); }

function updateAuthUI() {
    if (currentUser) {
        signInBtn.classList.add('hidden');
        userInfo.classList.remove('hidden');
        userInfo.classList.add('flex');
        userName.textContent = currentUser.displayName;
        userPhoto.src = currentUser.photoURL;
        mainContent.classList.remove('hidden');
    } else {
        signInBtn.classList.remove('hidden');
        userInfo.classList.add('hidden');
        userInfo.classList.remove('flex');
    }
}

function switchView(view) {
    if (view === 'dashboard') {
        dashboardView.classList.remove('hidden');
        playersView.classList.add('hidden');
        viewDashboardBtn.classList.remove('bg-gray-700', 'text-gray-400');
        viewDashboardBtn.classList.add('bg-gray-700', 'text-white');
        viewPlayersBtn.classList.remove('bg-gray-700', 'text-white');
        viewPlayersBtn.classList.add('text-gray-400');
        loadWeekData(weekSelector.value); // Refresh
    } else {
        dashboardView.classList.add('hidden');
        playersView.classList.remove('hidden');
        viewDashboardBtn.classList.remove('bg-gray-700', 'text-white');
        viewDashboardBtn.classList.add('text-gray-400');
        viewPlayersBtn.classList.add('bg-gray-700', 'text-white');
        viewPlayersBtn.classList.remove('text-gray-400');
        renderPlayers();
    }
}

async function loadAppData() {
    allPlayers = await getPlayers();
    allWeeks = await getWeeks();
    renderWeekSelector();
    renderPlayers();
    
    if (allWeeks.length > 0) {
        weekSelector.value = allWeeks[0].id;
        loadWeekData(allWeeks[0].id);
    } else {
        weekTableBody.innerHTML = '';
        emptyWeekMsg.classList.remove('hidden');
    }
}

// --- WEEK LOGIC ---

function renderWeekSelector() {
    weekSelector.innerHTML = '';
    if (allWeeks.length === 0) {
        weekSelector.innerHTML = '<option value="">No Data</option>';
        return;
    }
    allWeeks.forEach(w => {
        const opt = document.createElement('option');
        opt.value = w.id;
        opt.textContent = `Week of ${w.startDate}`;
        weekSelector.appendChild(opt);
    });
}

function loadWeekData(weekId) {
    if (!weekId) return;
    currentWeekId = weekId;
    const week = allWeeks.find(w => w.id === weekId);
    if (!week) return;

    currentWeekData = week.data || {};
    emptyWeekMsg.classList.add('hidden');
    weekTableBody.innerHTML = '';

    // Convert map to array and sort by score desc
    const rows = Object.entries(currentWeekData).map(([pid, data]) => ({ id: pid, ...data }));
    rows.sort((a, b) => b.score - a.score);

    rows.forEach(player => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-white/5 transition-colors group';
        tr.innerHTML = `
            <td class="p-4 font-bold text-white">${player.name}</td>
            <td class="p-4">
                <input type="number" class="table-input" value="${player.boosts}" 
                    data-pid="${player.id}" data-field="boosts">
            </td>
            <td class="p-4">
                <input type="number" class="table-input text-right font-mono text-yellow-400" value="${player.score}" 
                    data-pid="${player.id}" data-field="score">
            </td>
            <td class="p-4 text-center text-xs text-gray-500">
                <span class="opacity-0 group-hover:opacity-100 transition-opacity">Auto-Saved</span>
            </td>
        `;
        weekTableBody.appendChild(tr);
    });

    calculateTotals();

    // Attach listeners to inputs
    const inputs = weekTableBody.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('change', handleInputChange);
    });
}

async function handleInputChange(e) {
    const input = e.target;
    const pid = input.dataset.pid;
    const field = input.dataset.field;
    let val = parseFloat(input.value) || 0;
    
    // Update local state for immediate math
    currentWeekData[pid][field] = val;
    calculateTotals();
    
    // Update DB
    await updateWeekData(currentWeekId, pid, field, val);
    
    // Visual feedback
    const span = input.parentElement.parentElement.querySelector('span');
    span.textContent = "Saved ✓";
    span.classList.add('text-green-500');
    setTimeout(() => {
        span.classList.remove('text-green-500');
        span.textContent = "Auto-Saved";
    }, 2000);
}

function calculateTotals() {
    let tBoosts = 0;
    let tScore = 0;
    Object.values(currentWeekData).forEach(p => {
        tBoosts += (p.boosts || 0);
        tScore += (p.score || 0);
    });
    totalBoostsEl.textContent = tBoosts;
    totalScoreEl.textContent = tScore.toLocaleString();
}

async function handleStartNewWeek() {
    const dateStr = prompt("Enter Start Date (e.g., Dec 23, 2025):", new Date().toLocaleDateString());
    if (!dateStr) return;

    if (allPlayers.length === 0) {
        alert("Add players to the roster first!");
        switchView('players');
        return;
    }

    try {
        await createNewWeek(dateStr, allPlayers);
        // Reload everything
        await loadAppData();
        switchView('dashboard');
    } catch (e) {
        alert("Error creating week: " + e.message);
    }
}

// --- PLAYER LOGIC ---

function renderPlayers() {
    playersGrid.innerHTML = '';
    allPlayers.forEach(p => {
        const div = document.createElement('div');
        div.className = `p-4 rounded-xl border ${p.active ? 'bg-gray-800/50 border-gray-600' : 'bg-red-900/20 border-red-900'} flex justify-between items-center`;
        div.innerHTML = `
            <div>
                <h4 class="font-bold text-white text-lg">${p.name}</h4>
                <p class="text-xs ${p.active ? 'text-green-400' : 'text-red-400'}">${p.active ? 'Active' : 'Inactive'}</p>
            </div>
            <button class="text-xs border border-gray-600 p-2 rounded hover:bg-white/10 toggle-btn" data-id="${p.id}" data-active="${p.active}">
                ${p.active ? 'Deactivate' : 'Activate'}
            </button>
        `;
        playersGrid.appendChild(div);
    });

    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.dataset.id;
            const isActive = e.target.dataset.active === 'true';
            await togglePlayerStatus(id, !isActive);
            allPlayers = await getPlayers();
            renderPlayers();
        });
    });
}

async function handleAddPlayer() {
    const name = newPlayerNameInput.value.trim();
    if (!name) return;
    savePlayerBtn.textContent = "...";
    await addPlayer(name);
    
    newPlayerNameInput.value = '';
    playerModal.classList.add('hidden');
    savePlayerBtn.textContent = "Save";
    
    allPlayers = await getPlayers();
    renderPlayers();
}
