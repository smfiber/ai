import { CONSTANTS, state } from './config.js';
import { fetchAndRenderRecentFilings, renderCompanyDeepDive } from './ui-render.js';
import { closeModal, openDeepDiveModal } from './ui-modals.js';

function setupGlobalEventListeners() {
    const appContainer = document.getElementById('app-container');
    if (!appContainer) return;

    // Main event delegation for the app
    appContainer.addEventListener('click', (e) => {
        const target = e.target;

        // Handle refresh button clicks
        if (target.closest('#refresh-filings-button')) {
            const refreshButton = target.closest('#refresh-filings-button');
            const icon = refreshButton.querySelector('svg');
            if (icon) icon.classList.add('animate-spin');
            
            fetchAndRenderRecentFilings().finally(() => {
                if (icon) icon.classList.remove('animate-spin');
            });
            return;
        }

        // Handle clicks on company links to open the deep dive modal
        if (target.closest('.company-link')) {
            e.preventDefault();
            const ticker = target.closest('.company-link').dataset.ticker;
            if (ticker) {
                openDeepDiveModal(ticker);
                // This function will now be called to populate the modal
                renderCompanyDeepDive(ticker); 
            }
            return;
        }
    });
}

export function setupEventListeners() {
    setupGlobalEventListeners();

    const modalsToClose = [
        { modal: CONSTANTS.MODAL_CONFIRMATION, button: 'cancel-button'},
        { modal: 'deepDiveModal', button: 'close-deep-dive-modal', bg: 'close-deep-dive-modal-bg' },
    ];

    modalsToClose.forEach(item => {
        const close = () => closeModal(item.modal);
        if (item.button) {
            const buttonEl = document.getElementById(item.button);
            if(buttonEl) buttonEl.addEventListener('click', close);
        }
        if (item.bg) {
            const bgEl = document.getElementById(item.bg);
            if(bgEl) bgEl.addEventListener('click', close);
        }
    });
}
