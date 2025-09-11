import { CONSTANTS, state, promptMap } from './config.js';
import { openModal, closeModal, openStockListModal, openSessionLogModal, openManageStockModal, openPortfolioManagerModal, openViewFmpDataModal, openManageFmpEndpointsModal, openManageBroadEndpointsModal, openRawDataViewer, openThesisTrackerModal } from './ui-modals.js';
import { fetchAndCachePortfolioData, renderPortfolioManagerList, renderSecFilings } from './ui-render.js';
import { handleResearchSubmit, handleSaveStock, handleDeleteStock, handleRefreshFmpData, handleFetchNews, handleAnalysisRequest, handleInvestmentMemoRequest, handleSaveReportToDb, handleSaveBroadReportToDb, handleSaveToDrive, handleSectorSelection, handleIndustrySelection, handleSaveFmpEndpoint, cancelFmpEndpointEdit, handleEditFmpEndpoint, handleDeleteFmpEndpoint, handleSaveBroadEndpoint, cancelBroadEndpointEdit, handleEditBroadEndpoint, handleDeleteBroadEndpoint, handleSaveThesis, handleBroadAnalysisRequest } from './ui-handlers.js';

// --- PROMPT MAPPING ---
// The main promptMap is now imported directly from config.js

// Map specific AI analysis types to the FMP endpoints they require.
const ANALYSIS_REQUIREMENTS = {
    'ManagementScorecard': ['executive_compensation']
};

// v13.1.0: Icons for stock-specific analysis tiles
const ANALYSIS_ICONS = {
    'FinancialAnalysis': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6a7.5 7.5 0 100 15 7.5 7.5 0 000-15z" /><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.2-5.2" /><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 10.5H10.5v.008H10.5V10.5zm.008 0h.008v4.502h-.008V10.5z" /></svg>`,
    'UndervaluedAnalysis': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0l.879-.659M7.5 14.25l6-6M4.5 12l6-6m6 6l-6 6" /></svg>`,
    'BullVsBear': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.774 4.774zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
    'MoatAnalysis': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286zm0 13.036h.008v.008h-.008v-.008z" /></svg>`,
    'DividendSafety': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25-2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 3a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 12m15 0a2.25 2.25 0 01-2.25 2.25H12a2.25 2.25 0 01-2.25-2.25" /></svg>`,
    'GrowthOutlook': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>`,
    'RiskAssessment': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>`,
    'CapitalAllocators': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15.91 15.91a2.25 2.25 0 01-3.182 0l-3.03-3.03a.75.75 0 011.06-1.061l2.47 2.47 2.47-2.47a.75.75 0 011.06 1.06l-3.03 3.03z" /></svg>`,
    'NarrativeCatalyst': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.62a8.983 8.983 0 013.362-3.867 8.262 8.262 0 013 2.456z" /><path stroke-linecap="round" stroke-linejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" /></svg>`,
    'InvestmentMemo': `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>`
};

// --- DYNAMIC TOOLTIPS ---
function initializeTooltips() {
    let tooltipElement;

    // Use event delegation on the body for efficiency
    document.body.addEventListener('mouseover', e => {
        const target = e.target.closest('[data-tooltip]');
        if (!target) return;

        const tooltipText = target.getAttribute('data-tooltip');
        if (!tooltipText) return;

        // Create and append tooltip element
        tooltipElement = document.createElement('div');
        tooltipElement.className = 'custom-tooltip';
        tooltipElement.textContent = tooltipText;
        document.body.appendChild(tooltipElement);
        
        // Position the tooltip dynamically
        positionTooltip(target, tooltipElement);

        // Use requestAnimationFrame to ensure the element is in the DOM before animating opacity
        requestAnimationFrame(() => {
            tooltipElement.style.opacity = '1';
        });
    });

    document.body.addEventListener('mouseout', e => {
        const target = e.target.closest('[data-tooltip]');
        // Hide and remove the tooltip when the mouse leaves the target
        if (target && tooltipElement) {
            tooltipElement.remove();
            tooltipElement = null;
        }
    });
    
    // Helper function to calculate the best position for the tooltip
    function positionTooltip(target, tooltip) {
        const targetRect = target.getBoundingClientRect();
        // Get tooltip dimensions *after* adding content but before making it visible
        const tooltipRect = tooltip.getBoundingClientRect(); 
        const margin = 8; // Space between the target and the tooltip

        // Default position: centered above the target
        let top = targetRect.top - tooltipRect.height - margin;
        let left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);

        // If the tooltip would go off the top of the screen, place it below the target instead
        if (top < 0) {
            top = targetRect.bottom + margin;
        }

        // Adjust horizontally to keep it within the viewport
        if (left < 0) {
            left = margin;
        } else if (left + tooltipRect.width > window.innerWidth) {
            left = window.innerWidth - tooltipRect.width - margin;
        }

        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
    }
}

// --- EVENT LISTENER SETUP ---

function setupGlobalEventListeners() {
    document.getElementById('dashboard-section').addEventListener('click', (e) => {
        const refreshButton = e.target.closest('.dashboard-refresh-button');
        if (refreshButton) {
            fetchAndCachePortfolioData();
            return;
        }
        
        const portfolioButton = e.target.closest('#open-portfolio-modal-button');
        if (portfolioButton) {
            openStockListModal('Portfolio');
            return;
        }

        const watchlistButton = e.target.closest('#open-watchlist-modal-button');
        if (watchlistButton) {
            openStockListModal('Watchlist');
            return;
        }

        const revisit3MonthsButton = e.target.closest('#open-revisit-3-months-modal-button');
        if (revisit3MonthsButton) {
            openStockListModal('Revisit 3 months');
            return;
        }

        const revisit6MonthsButton = e.target.closest('#open-revisit-6-months-modal-button');
        if (revisit6MonthsButton) {
            openStockListModal('Revisit 6 months');
            return;
        }
    });

    document.getElementById(CONSTANTS.MODAL_STOCK_LIST).addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        if (target.id === 'expand-all-button') {
            document.querySelectorAll('#stock-list-modal-content .sector-group').forEach(d => d.open = true);
            return;
        }
        if (target.id === 'collapse-all-button') {
            document.querySelectorAll('#stock-list-modal-content .sector-group').forEach(d => d.open = false);
            return;
        }
        
        const ticker = target.dataset.ticker;
        if (ticker) {
            if (target.classList.contains('dashboard-item-edit')) {
                const stockData = state.portfolioCache.find(s => s.ticker === ticker);
                if (stockData) {
                    openManageStockModal({ ...stockData, isEditMode: true });
                }
            } else if (target.classList.contains('dashboard-item-view')) {
                openRawDataViewer(ticker);
            } else if (target.classList.contains('dashboard-item-refresh')) {
                handleRefreshFmpData(ticker);
            }
        }
    });

    document.getElementById(CONSTANTS.CONTAINER_DYNAMIC_CONTENT).addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        
        const symbol = target.dataset.symbol || target.dataset.ticker;
        if (!symbol) return;

        if (target.classList.contains('fetch-news-button')) handleFetchNews(symbol);
        if (target.classList.contains('refresh-fmp-button')) handleRefreshFmpData(symbol);
        if (target.classList.contains('view-fmp-data-button')) openViewFmpDataModal(symbol);
    });

    document.getElementById('customAnalysisModal').addEventListener('click', (e) => {
        const button = e.target.closest('button[data-prompt-name]');
        if (button) {
            const sector = button.dataset.sector;
            const promptName = button.dataset.promptName;
            const analysisName = button.querySelector('.tile-name')?.textContent || promptName;

            const modal = document.getElementById('customAnalysisModal');
            modal.dataset.analysisName = analysisName;
            modal.dataset.contextName = sector;
            modal.dataset.contextType = 'sector';
            modal.dataset.reportType = promptName;
            
            handleBroadAnalysisRequest(sector, 'sector', promptName, false);
        }
    });

    document.getElementById('industryAnalysisModal').addEventListener('click', (e) => {
        const button = e.target.closest('button[data-prompt-name]');
        if (button) {
            const industry = button.dataset.industry;
            const promptName = button.dataset.promptName;
            const analysisName = button.querySelector('.tile-name')?.textContent || promptName;
            
            const modal = document.getElementById('industryAnalysisModal');
            modal.dataset.analysisName = analysisName;
            modal.dataset.contextName = industry;
            modal.dataset.contextType = 'industry';
            modal.dataset.reportType = promptName;

            handleBroadAnalysisRequest(industry, 'industry', promptName, false);
        }
    });

    document.getElementById('portfolioManagerModal').addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        const ticker = target.dataset.ticker;
        if (!ticker) return;

        if (target.classList.contains('edit-stock-btn')) {
            const stockData = state.portfolioCache.find(s => s.ticker === ticker);
            if (stockData) {
                openManageStockModal({ ...stockData, isEditMode: true });
            }
        } else if (target.classList.contains('delete-stock-btn')) {
            handleDeleteStock(ticker);
        }
    });
    
    document.getElementById('manageFmpEndpointsModal')?.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        const id = target.dataset.id;
        if (target.classList.contains('edit-fmp-endpoint-btn')) {
            handleEditFmpEndpoint(id, target.dataset.name, target.dataset.url);
        } else if (target.classList.contains('delete-fmp-endpoint-btn')) {
            handleDeleteFmpEndpoint(id);
        }
    });
}

export function setupEventListeners() {
    initializeTooltips();
    document.getElementById(CONSTANTS.FORM_STOCK_RESEARCH)?.addEventListener('submit', handleResearchSubmit);
    
    document.getElementById('manage-stock-form')?.addEventListener('submit', handleSaveStock);
    document.getElementById('cancel-manage-stock-button')?.addEventListener('click', () => closeModal(CONSTANTS.MODAL_MANAGE_STOCK));
    document.getElementById('delete-stock-button')?.addEventListener('click', (e) => {
        const ticker = document.getElementById('manage-stock-original-ticker').value;
        if(ticker) {
            closeModal(CONSTANTS.MODAL_MANAGE_STOCK);
            handleDeleteStock(ticker);
        }
    });

    document.getElementById('manage-fmp-endpoint-form')?.addEventListener('submit', handleSaveFmpEndpoint);
    document.getElementById('cancel-fmp-endpoint-edit')?.addEventListener('click', cancelFmpEndpointEdit);

    document.getElementById('manage-broad-endpoint-form')?.addEventListener('submit', handleSaveBroadEndpoint);
    document.getElementById('cancel-broad-endpoint-edit')?.addEventListener('click', cancelBroadEndpointEdit);

    document.querySelectorAll('.save-to-drive-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const modalId = e.target.dataset.modalId;
            handleSaveToDrive(modalId);
        });
    });
    
    document.querySelectorAll('.save-to-db-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const modalId = e.target.dataset.modalId;
            if (modalId === 'rawDataViewerModal') {
                handleSaveReportToDb();
            } else {
                handleSaveBroadReportToDb(modalId);
            }
        });
    });

    const scrollTopBtn = document.getElementById(CONSTANTS.BUTTON_SCROLL_TOP);
    if (scrollTopBtn) scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    document.getElementById('manage-all-stocks-button')?.addEventListener('click', openPortfolioManagerModal);
    document.getElementById('manage-fmp-endpoints-button')?.addEventListener('click', openManageFmpEndpointsModal);
    document.getElementById('manage-broad-endpoints-button')?.addEventListener('click', openManageBroadEndpointsModal);
    document.getElementById('session-log-button')?.addEventListener('click', openSessionLogModal);

    const modalsToClose = [
        { modal: CONSTANTS.MODAL_CUSTOM_ANALYSIS, button: 'close-custom-analysis-modal', bg: 'close-custom-analysis-modal-bg' },
        { modal: CONSTANTS.MODAL_INDUSTRY_ANALYSIS, button: 'close-industry-analysis-modal', bg: 'close-industry-analysis-modal-bg' },
        { modal: CONSTANTS.MODAL_MANAGE_STOCK, bg: 'close-manage-stock-modal-bg'},
        { modal: CONSTANTS.MODAL_CONFIRMATION, button: 'cancel-button'},
        { modal: CONSTANTS.MODAL_PORTFOLIO_MANAGER, button: 'close-portfolio-manager-modal', bg: 'close-portfolio-manager-modal-bg' },
        { modal: CONSTANTS.MODAL_VIEW_FMP_DATA, button: 'close-view-fmp-data-modal', bg: 'close-view-fmp-data-modal-bg' },
        { modal: CONSTANTS.MODAL_MANAGE_FMP_ENDPOINTS, button: 'close-manage-fmp-endpoints-modal', bg: 'close-manage-fmp-endpoints-modal-bg' },
        { modal: CONSTANTS.MODAL_MANAGE_BROAD_ENDPOINTS, button: 'close-manage-broad-endpoints-modal', bg: 'close-manage-broad-endpoints-modal-bg' },
        { modal: 'rawDataViewerModal', button: 'close-raw-data-viewer-modal-button', bg: 'close-raw-data-viewer-modal-bg' },
        { modal: 'rawDataViewerModal', button: 'close-raw-data-viewer-modal' },
        { modal: CONSTANTS.MODAL_STOCK_LIST, button: 'close-stock-list-modal', bg: 'close-stock-list-modal-bg' },
        { modal: CONSTANTS.MODAL_SESSION_LOG, button: 'close-session-log-modal', bg: 'close-session-log-modal-bg' },
        { modal: 'thesisTrackerModal', button: 'cancel-thesis-tracker-button', bg: 'close-thesis-tracker-modal-bg' },
    ];

    modalsToClose.forEach(item => {
        const close = () => closeModal(item.modal);
        if (item.button) document.getElementById(item.button)?.addEventListener('click', close);
        if (item.bg) document.getElementById(item.bg)?.addEventListener('click', close);
    });

    window.addEventListener('scroll', () => {
        const btn = document.getElementById(CONSTANTS.BUTTON_SCROLL_TOP);
        if (btn) btn.classList.toggle(CONSTANTS.CLASS_HIDDEN, window.scrollY <= 300);
    });
    
    document.getElementById('sector-buttons-container')?.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (target && target.dataset.sector) {
            handleSectorSelection(target.dataset.sector, target);
        }
    });

    document.getElementById('industry-buttons-container')?.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (target && target.dataset.industry) {
            handleIndustrySelection(target.dataset.industry, target);
        }
    });

    document.getElementById('rawDataViewerModal').addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        if (target.id === 'edit-thesis-button') {
            const ticker = target.dataset.ticker;
            if (ticker) {
                openThesisTrackerModal(ticker);
            }
            return; 
        }

        if (target.matches('.tab-button')) {
            const tabId = target.dataset.tab;
            document.querySelectorAll('#rawDataViewerModal .tab-content').forEach(c => c.classList.add('hidden'));
            document.querySelectorAll('#rawDataViewerModal .tab-button').forEach(b => b.classList.remove('active'));
            document.getElementById(`${tabId}-tab`).classList.remove('hidden');
            target.classList.add('active');

            // Lazy-load SEC data on first click
            if (tabId === 'sec-filings' && !target.dataset.loaded) {
                const ticker = document.getElementById('rawDataViewerModal').dataset.activeTicker;
                if(ticker) {
                    renderSecFilings(ticker);
                    target.dataset.loaded = 'true'; // Prevent re-loading
                }
            }
            return;
        }
        
        const symbol = target.dataset.symbol;
        if (!symbol) return;

        if (target.matches('.ai-analysis-button')) {
            const reportType = target.dataset.reportType;
            const promptConfig = promptMap[reportType];
            if (promptConfig) {
                handleAnalysisRequest(symbol, reportType, promptConfig);
            }
        }
        
        if (target.id === 'investment-memo-button') {
            handleInvestmentMemoRequest(symbol);
        }
    });
	
	document.getElementById('manageBroadEndpointsModal')?.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        const id = target.dataset.id;
        if (target.classList.contains('edit-broad-endpoint-btn')) {
            handleEditBroadEndpoint(id, target.dataset.name, target.dataset.url);
        } else if (target.classList.contains('delete-broad-endpoint-btn')) {
            handleDeleteBroadEndpoint(id);
        }
    });
    
    document.getElementById('thesis-tracker-form')?.addEventListener('submit', handleSaveThesis);

    setupGlobalEventListeners();
}
