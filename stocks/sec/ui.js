import { CONSTANTS, state } from './config.js';
import { fetchAndRenderRecentFilings } from './ui-render.js';

function setupGlobalEventListeners() {
    const refreshButton = document.getElementById('refresh-filings-button');
    if (refreshButton) {
        refreshButton.addEventListener('click', () => {
            // Add a visual cue for the user
            const icon = refreshButton.querySelector('svg');
            if(icon) icon.classList.add('animate-spin');
            
            fetchAndRenderRecentFilings().finally(() => {
                // Remove the spin animation after the fetch is complete
                if(icon) icon.classList.remove('animate-spin');
            });
        });
    }

    // Add other global event listeners for the new SPA here as needed
}

export function setupEventListeners() {
    setupGlobalEventListeners();

    const modalsToClose = [
        { modal: CONSTANTS.MODAL_CONFIRMATION, button: 'cancel-button'},
    ];

    modalsToClose.forEach(item => {
        const close = () => closeModal(item.modal);
        if (item.button) document.getElementById(item.button)?.addEventListener('click', close);
    });
}
