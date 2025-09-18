import { CONSTANTS, state, promptMap } from './config.js';
import { openModal, closeModal, openStockListModal, openSessionLogModal, openManageStockModal, openPortfolioManagerModal, openViewFmpDataModal, openManageFmpEndpointsModal, openManageBroadEndpointsModal, openRawDataViewer, openThesisTrackerModal } from './ui-modals.js';
import { fetchAndCachePortfolioData, renderPortfolioManagerList, renderSecFilings, renderFilingAnalysisTab } from './ui-render.js';
import { handleResearchSubmit, handleSaveStock, handleDeleteStock, handleRefreshFmpData, handleAnalysisRequest, handleInvestmentMemoRequest, handleSaveReportToDb, handleSaveToDrive, cancelFmpEndpointEdit, cancelBroadEndpointEdit, handleSaveThesis, handleGenerateAllReportsRequest, handleSaveManualFiling, handleFilingAnalysisRequest, handleGarpExitMemoRequest } from './ui-handlers.js';

// --- DYNAMIC TOOLTIPS ---
function initializeTooltips() {
    let tooltipElement;

    document.body.addEventListener('mouseover', e => {
        const target = e.target.closest('[data-tooltip]');
        if (!target) return;

        const tooltipText = target.getAttribute('data-tooltip');
        if (!tooltipText) return;

        tooltipElement = document.createElement('div');
        tooltipElement.className = 'custom-tooltip';
        tooltipElement.textContent = tooltipText;
        document.body.appendChild(tooltipElement);
        
        positionTooltip(target, tooltipElement);

        requestAnimationFrame(() => {
            tooltipElement.style.opacity = '1';
        });
    });

    document.body.addEventListener('mouseout', e => {
        const target = e.target.closest('[data-tooltip]');
        if (target && tooltipElement) {
            tooltipElement.remove();
            tooltipElement = null;
        }
    });
    
    function positionTooltip(target, tooltip) {
        const targetRect = target.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect(); 
        const margin = 8;

        let top = targetRect.top - tooltipRect.height - margin;
        let left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);

        if (top < 0) {
            top = targetRect.bottom + margin;
        }

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

        if (target.classList.contains('refresh-fmp-button')) handleRefreshFmpData(symbol);
        if (target.classList.contains('view-fmp-data-button')) openViewFmpDataModal(symbol);
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

    document.getElementById('cancel-fmp-endpoint-edit')?.addEventListener('click', cancelFmpEndpointEdit);
    document.getElementById('cancel-broad-endpoint-edit')?.addEventListener('click', cancelBroadEndpointEdit);

    document.querySelectorAll('.save-to-drive-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const modalId = e.target.dataset.modalId;
            handleSaveToDrive(modalId);
        });
    });
    
    document.querySelectorAll('.save-to-db-button').forEach(button => {
        button.addEventListener('click', (e) => {
            handleSaveReportToDb();
        });
    });

    const scrollTopBtn = document.getElementById(CONSTANTS.BUTTON_SCROLL_TOP);
    if (scrollTopBtn) scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    document.getElementById('manage-all-stocks-button')?.addEventListener('click', openPortfolioManagerModal);
    document.getElementById('manage-fmp-endpoints-button')?.addEventListener('click', openManageFmpEndpointsModal);
    document.getElementById('manage-broad-endpoints-button')?.addEventListener('click', openManageBroadEndpointsModal);
    document.getElementById('session-log-button')?.addEventListener('click', openSessionLogModal);

    const modalsToClose = [
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
    
    const analysisModal = document.getElementById('rawDataViewerModal');

    analysisModal.addEventListener('submit', (e) => {
        e.preventDefault();
        const ticker = analysisModal.dataset.activeTicker;
        if (!ticker) return;

        if (e.target.id === 'manual-8k-form') {
            handleSaveManualFiling(ticker, '8-K');
        } else if (e.target.id === 'manual-10k-form') {
            handleSaveManualFiling(ticker, '10-K');
        } else if (e.target.id === 'manual-10q-form') {
            handleSaveManualFiling(ticker, '10-Q');
        }
    });

    analysisModal.addEventListener('click', (e) => {
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
		    
		    const scrollContainer = analysisModal.querySelector('.flex-grow.overflow-y-auto');
		    if (scrollContainer) {
		        scrollContainer.scrollTop = 0;
		    }
		
		    document.querySelectorAll('#rawDataViewerModal .tab-content').forEach(c => c.classList.add('hidden'));
		    document.querySelectorAll('#rawDataViewerModal .tab-button').forEach(b => b.classList.remove('active'));
		    document.getElementById(`${tabId}-tab`).classList.remove('hidden');
		    target.classList.add('active');
		
		    const ticker = document.getElementById('rawDataViewerModal').dataset.activeTicker;
		    if (!ticker) return;
		
		    if (tabId === 'sec-filings' && !target.dataset.loaded) {
		        renderSecFilings(ticker);
		        target.dataset.loaded = 'true';
		    } else if (tabId === 'form-8k-analysis' && !target.dataset.loaded) {
		        renderFilingAnalysisTab(ticker, '8-K');
		        target.dataset.loaded = 'true';
		    } else if (tabId === 'form-10k-analysis' && !target.dataset.loaded) {
		        renderFilingAnalysisTab(ticker, '10-K');
		        target.dataset.loaded = 'true';
            } else if (tabId === 'form-10q-analysis' && !target.dataset.loaded) {
                renderFilingAnalysisTab(ticker, '10-Q');
                target.dataset.loaded = 'true';
            }
		    return;
		}
        
        const symbol = target.dataset.symbol || analysisModal.dataset.activeTicker;
        if (!symbol) return;

        if (target.matches('.ai-analysis-button')) {
            const reportType = target.dataset.reportType;
            const promptConfig = promptMap[reportType];
            if (promptConfig) handleAnalysisRequest(symbol, reportType, promptConfig);
        }
        
        if (target.id === 'investment-memo-button') handleInvestmentMemoRequest(symbol);
        // NEW: Event listener for the Exit Memo button
        if (target.id === 'garp-exit-memo-button') handleGarpExitMemoRequest(symbol);
        if (target.id === 'generate-all-reports-button') handleGenerateAllReportsRequest(symbol);
        if (target.id === 'analyze-latest-8k-button') handleFilingAnalysisRequest(symbol, '8-K');
        if (target.id === 'analyze-latest-10k-button') handleFilingAnalysisRequest(symbol, '10-K');
        if (target.id === 'analyze-latest-10q-button') handleFilingAnalysisRequest(symbol, '10-Q');
    });
	
    document.getElementById('thesis-tracker-form')?.addEventListener('submit', handleSaveThesis);

    setupGlobalEventListeners();
}
