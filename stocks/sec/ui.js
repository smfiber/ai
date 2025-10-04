import { CONSTANTS, state } from './config.js';
import { fetchAndRenderRecentFilings, renderCompanyDeepDive, renderInsiderTrackerView, renderInstitutionalTrackerView, renderUpcomingEarningsView, renderFilingsActivityView, renderMarketAnalysisView } from './ui-render.js';
import { closeModal, openDeepDiveModal } from './ui-modals.js';
import { handleFilingAnalysis, handleBatchProcess, handleMarketAnalysis } from './ui-handlers.js';

function setupGlobalEventListeners() {
    const appContainer = document.getElementById('app-container');
    if (!appContainer) return;

    // Main event delegation for the app
    appContainer.addEventListener('click', (e) => {
        const target = e.target;

        if (target.closest('#refresh-filings-button')) {
            // ... (unchanged) ...
        }

        if (target.closest('.company-link')) {
            // ... (unchanged) ...
        }

        // NEW: Handle clicks for new Market Analysis buttons
        if (target.closest('#start-batch-process-btn')) {
            handleBatchProcess();
            return;
        }

        if (target.closest('#analyze-market-data-btn')) {
            handleMarketAnalysis();
            return;
        }
    });

    // Event delegation for the Deep Dive Modal
    const deepDiveModal = document.getElementById('deepDiveModal');
    if (deepDiveModal) {
        // ... (unchanged) ...
    }
    
    // Event delegation for the main tabs
    const mainTabs = document.getElementById('main-tabs');
    if (mainTabs) {
        mainTabs.addEventListener('click', (e) => {
            const tabButton = e.target.closest('.tab-button');
            if (!tabButton || tabButton.classList.contains('active')) return;

            const tabId = tabButton.dataset.tab;

            document.querySelectorAll('#main-tabs .tab-button').forEach(b => b.classList.remove('active'));
            tabButton.classList.add('active');

            document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
            document.getElementById(tabId).classList.remove('hidden');

            const isLoaded = tabButton.dataset.loaded === 'true';
            if (!isLoaded) {
                if (tabId === 'insider-tracker-view') {
                    renderInsiderTrackerView();
                } else if (tabId === 'institutional-tracker-view') {
                    renderInstitutionalTrackerView();
                } else if (tabId === 'market-analysis-view') {
                    renderMarketAnalysisView();
                } else if (tabId === 'earnings-calendar-view') {
                    renderUpcomingEarningsView();
                } else if (tabId === 'filings-activity-view') {
                    renderFilingsActivityView();
                }
                tabButton.dataset.loaded = 'true';
            }
        });
    }
}

export function setupEventListeners() {
    setupGlobalEventListeners();

    const modalsToClose = [
        { modal: CONSTANTS.MODAL_CONFIRMATION, button: 'cancel-button'},
        { modal: 'deepDiveModal', button: 'close-deep-dive-modal', bg: 'close-deep-dive-modal-bg' },
    ];

    modalsToClose.forEach(item => {
        // ... (unchanged) ...
    });
}
