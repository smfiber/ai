import { CONSTANTS, state } from './config.js';
import { fetchAndRenderRecentFilings, fetchAndRenderRevisitFilings, fetchAndRenderWatchlistFilings, renderCompanyDeepDive, renderInsiderTrackerView, renderInstitutionalTrackerView, renderUpcomingEarningsView, renderFilingsActivityView, renderMarketAnalysisView, renderInvestorFilingsDropdownView, renderInvestorFilingsView, renderWhaleComparisonView } from './ui-render.js';
import { closeModal, openDeepDiveModal } from './ui-modals.js';
// UPDATED: Added handleFilingAnalysis to the import
import { handleFilingAnalysis, handleBatchProcess, handleMarketAnalysis } from './ui-handlers.js';

function setupGlobalEventListeners() {
    const appContainer = document.getElementById('app-container');
    if (!appContainer) return;

    // Main event delegation for the app
    appContainer.addEventListener('click', (e) => {
        const target = e.target;

        if (target.closest('#refresh-filings-button')) {
             const btn = target.closest('#refresh-filings-button');
             const icon = btn.querySelector('svg');
             icon.classList.add('animate-spin');
             fetchAndRenderRecentFilings().then(() => {
                 setTimeout(() => icon.classList.remove('animate-spin'), 500);
             });
             return;
        }

        if (target.closest('.company-link')) {
            e.preventDefault();
            const ticker = target.closest('.company-link').dataset.ticker;
            if (ticker) {
                openDeepDiveModal(ticker);
                renderCompanyDeepDive(ticker);
            }
            return;
        }

        // --- NEW: Analyze Filing Button Listener ---
        if (target.closest('.analyze-filing-btn')) {
            const btn = target.closest('.analyze-filing-btn');
            const url = btn.dataset.filingUrl;
            const type = btn.dataset.formType;
            const ticker = btn.dataset.ticker;
            
            // Trigger the analysis handler defined in ui-handlers.js
            handleFilingAnalysis(url, type, ticker);
            return;
        }
        // -------------------------------------------

        if (target.closest('#start-batch-process-btn')) {
            handleBatchProcess();
            return;
        }

        if (target.closest('#analyze-market-data-btn')) {
            handleMarketAnalysis();
            return;
        }

        // Handle compare quarters button click in the new Investor Filings tab
        if (target.closest('#compare-quarters-btn')) {
            renderWhaleComparisonView();
            target.closest('#compare-quarters-btn').remove(); // Remove button after clicking
            return;
        }
    });

    // Listen for changes on the investor dropdown
    appContainer.addEventListener('change', (e) => {
        const target = e.target;
        if (target.id === 'investor-select') {
            const selectedOption = target.options[target.selectedIndex];
            const cik = selectedOption.value;
            const investorName = selectedOption.dataset.name;
            if (cik) {
                renderInvestorFilingsView(cik, investorName);
            } else {
                // Clear the view if they select the placeholder
                const container = document.getElementById('investor-filings-container');
                if (container) container.innerHTML = '';
            }
        }
    });

    // Event delegation for the Deep Dive Modal
    const deepDiveModal = document.getElementById('deepDiveModal');
    if (deepDiveModal) {
         deepDiveModal.addEventListener('click', (e) => {
             // Any specific modal-internal events can go here if not covered by appContainer
         });
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
                if (tabId === 'revisit-view') {
                    fetchAndRenderRevisitFilings();
                } else if (tabId === 'watchlist-view') {
                    fetchAndRenderWatchlistFilings();
                } else if (tabId === 'insider-tracker-view') {
                    renderInsiderTrackerView();
                } else if (tabId === 'institutional-tracker-view') {
                    renderInstitutionalTrackerView();
                } else if (tabId === 'market-analysis-view') {
                    renderMarketAnalysisView();
                } else if (tabId === 'investor-filings-view') {
                    renderInvestorFilingsDropdownView();
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

    // Adds the event listeners for closing modals
    modalsToClose.forEach(item => {
        const modalEl = document.getElementById(item.modal);
        if (!modalEl) return;

        const closeButton = document.getElementById(item.button);
        if (closeButton) {
            closeButton.addEventListener('click', () => closeModal(item.modal));
        }

        const bgClose = document.getElementById(item.bg);
        if (bgClose) {
            bgClose.addEventListener('click', () => closeModal(item.modal));
        }
    });
}
