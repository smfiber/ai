// fileName: ui.js
import { CONSTANTS, state, promptMap } from './config.js';
import { openModal, closeModal, openStockListModal, openManageStockModal, openPortfolioManagerModal, openRawDataViewer, QUARTERLY_REVIEW_QUESTIONS, ANNUAL_REVIEW_QUESTIONS, addDiligenceEntryRow } from './ui-modals.js';
import { fetchAndCachePortfolioData, renderPortfolioManagerList } from './ui-render.js';
import { handleResearchSubmit, handleSaveStock, handleDeleteStock, handleRefreshFmpData, handleAnalysisRequest, handleInvestmentMemoRequest, handleSaveReportToDb, handleGenerateAllReportsRequest, handleGarpCandidacyRequest, handlePortfolioGarpAnalysisRequest, handlePositionAnalysisRequest, handleReportHelpRequest, handleManualDiligenceSave, handleDeleteDiligenceLog, handleWorkflowHelpRequest, handlePeerAnalysisRequest, handleManualPeerAnalysisRequest, handleStructuredDiligenceSave, handleOngoingReviewSave, handleFilingAnalysisRequest } from './ui-handlers.js';
import { getFmpStockData } from './api.js';

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
            if (tooltipElement) {
                tooltipElement.style.opacity = '1';
            }
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
        
        const listButton = e.target.closest('.dashboard-list-button');
        if (listButton) {
            const status = listButton.dataset.status;
            if (status) {
                openStockListModal(status);
            }
            return;
        }

        const helpButton = e.target.closest('.ai-help-button');
        if (helpButton) {
            const reportType = helpButton.dataset.reportType;
            if (reportType) {
                handleReportHelpRequest(reportType);
            }
            return;
        }
    });

    document.getElementById(CONSTANTS.MODAL_STOCK_LIST).addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        if (target.id === 'expand-all-button') {
            document.querySelectorAll('#stock-list-modal-content details').forEach(d => d.open = true);
            return;
        }
        if (target.id === 'collapse-all-button') {
            document.querySelectorAll('#stock-list-modal-content details').forEach(d => d.open = false);
            return;
        }
        
        const ticker = target.dataset.ticker;
        if (ticker) {
            if (target.classList.contains('dashboard-item-edit')) {
                closeModal(CONSTANTS.MODAL_STOCK_LIST);
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

    document.querySelectorAll('.save-to-db-button').forEach(button => {
        button.addEventListener('click', handleSaveReportToDb);
    });

    document.getElementById('manage-all-stocks-button')?.addEventListener('click', openPortfolioManagerModal);
    document.getElementById('workflow-guide-button')?.addEventListener('click', handleWorkflowHelpRequest);
    
    // NEW event listener for the portfolio analysis button
    document.getElementById('analyze-portfolio-garp-button')?.addEventListener('click', handlePortfolioGarpAnalysisRequest);

    const modalsToClose = [
        { modal: CONSTANTS.MODAL_MANAGE_STOCK, bg: 'close-manage-stock-modal-bg'},
        { modal: CONSTANTS.MODAL_CONFIRMATION, button: 'cancel-button'},
        { modal: CONSTANTS.MODAL_PORTFOLIO_MANAGER, button: 'close-portfolio-manager-modal', bg: 'close-portfolio-manager-modal-bg' },
        { modal: 'rawDataViewerModal', button: 'close-raw-data-viewer-modal-button', bg: 'close-raw-data-viewer-modal-bg' },
        { modal: 'rawDataViewerModal', button: 'close-raw-data-viewer-modal' },
        { modal: CONSTANTS.MODAL_STOCK_LIST, button: 'close-stock-list-modal', bg: 'close-stock-list-modal-bg' },
        { modal: CONSTANTS.MODAL_SESSION_LOG, button: 'close-session-log-modal', bg: 'close-session-log-modal-bg' },
        { modal: CONSTANTS.MODAL_HELP, button: 'close-help-modal-button', bg: 'close-help-modal-bg' },
        { modal: CONSTANTS.MODAL_HELP, button: 'close-help-modal' },
    ];

    modalsToClose.forEach(item => {
        const close = () => closeModal(item.modal);
        if (item.button) document.getElementById(item.button)?.addEventListener('click', close);
        if (item.bg) document.getElementById(item.bg)?.addEventListener('click', close);
    });

    const analysisModal = document.getElementById('rawDataViewerModal');

    analysisModal.addEventListener('submit', (e) => {
        if (e.target.id === 'transcript-search-form') {
            e.preventDefault();
            const symbol = analysisModal.dataset.activeTicker;
            if (symbol) {
                handleTranscriptSearch(symbol);
            }
        }
    });

    analysisModal.addEventListener('click', async (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        if (target.matches('.ai-help-button')) {
            const reportType = target.dataset.reportType;
            if (reportType) {
                handleReportHelpRequest(reportType);
            }
            return;
        }

        if (target.id === 'fetch-peer-analysis-button') {
            const ticker = target.dataset.ticker;
            if (ticker) {
                handlePeerAnalysisRequest(ticker);
            }
            return;
        }
        
        if (target.id === 'analyze-manual-peers-button') {
            const ticker = target.dataset.ticker;
            if (ticker) {
                handleManualPeerAnalysisRequest(ticker);
            }
            return;
        }

        if (target.id === 'analyze-garp-button') {
            const ticker = target.dataset.ticker;
            if (ticker) {
                handleGarpCandidacyRequest(ticker);
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
		
		    return;
		}
        
        const symbol = target.dataset.symbol || analysisModal.dataset.activeTicker;
        if (!symbol) return;
        
        if (target.id === 'add-diligence-entry-button') {
            addDiligenceEntryRow();
            return;
        }

        // Diligence Log Management
        const deleteBtn = e.target.closest('.diligence-delete-btn');
        if (deleteBtn) {
            const reportId = deleteBtn.dataset.reportId;
            if (reportId) {
                handleDeleteDiligenceLog(reportId, symbol);
            }
            return;
        }
        
        // --- ONGOING DILIGENCE HANDLERS ---
        if (target.id === 'analyze-filing-button') {
            const reviewType = target.dataset.reviewType || 'Quarterly'; // Default to Quarterly
            handleFilingAnalysisRequest(symbol, reviewType);
            return;
        }

        if (target.id === 'start-quarterly-review-button' || target.id === 'start-annual-review-button') {
            const reviewType = target.dataset.reviewType; // 'Quarterly' or 'Annual'
            const questionSet = reviewType === 'Annual' ? ANNUAL_REVIEW_QUESTIONS : QUARTERLY_REVIEW_QUESTIONS;
            
            document.getElementById('ongoing-diligence-controls').classList.add('hidden');
            const formContainer = document.getElementById('quarterly-review-form-container');
            
            let formHtml = `<div class="text-left mt-4 border rounded-lg p-4 bg-gray-50 space-y-4" data-review-type="${reviewType}">`;
            for (const [category, question] of Object.entries(questionSet)) {
                formHtml += `
                    <div class="p-3 bg-white rounded-lg border border-gray-200">
                        <h5 class="font-semibold text-sm text-indigo-700 mb-2">${category}</h5>
                        <p class="text-xs text-gray-600 mb-2">${question}</p>
                        <textarea class="ongoing-review-answer w-full border border-gray-300 rounded-lg p-2 text-sm" 
                                  rows="5" 
                                  data-category="${category}"
                                  placeholder="Your analysis and findings here..."></textarea>
                    </div>
                `;
            }
            formHtml += `
                <div class="text-right mt-4 flex justify-end gap-2">
                    <button id="cancel-ongoing-review-button" class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg">Cancel</button>
                    <button id="save-ongoing-review-button" class="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg">Save Review</button>
                </div>
            </div>`;
            formContainer.innerHTML = formHtml;
            formContainer.classList.remove('hidden');
            return;
        }


        if (target.id === 'save-ongoing-review-button') {
            const form = target.closest('[data-review-type]');
            const reviewType = form.dataset.reviewType;
            handleOngoingReviewSave(symbol, reviewType);
            return;
        }

        if (target.id === 'cancel-ongoing-review-button') {
            const formContainer = document.getElementById('quarterly-review-form-container');
            formContainer.innerHTML = '';
            formContainer.classList.add('hidden');
            document.getElementById('ongoing-diligence-controls').classList.remove('hidden');
            return;
        }
        
        if (target.id === 'save-structured-diligence-button') {
            handleStructuredDiligenceSave(symbol);
            return;
        }

        if (target.id === 'save-manual-diligence-button') {
            handleManualDiligenceSave(symbol);
            return;
        }

        if (target.id === 'generate-position-analysis-button') {
            handlePositionAnalysisRequest(symbol);
            return;
        }

        if (target.matches('.generate-candidacy-button')) {
            handleGarpCandidacyRequest(symbol);
            return;
        }

        if (target.matches('.ai-analysis-button')) {
            const reportType = target.dataset.reportType;
            const promptConfig = promptMap[reportType];
            if (promptConfig) {
                handleAnalysisRequest(symbol, reportType, promptConfig);
            }
        }
        
        if (target.id === 'investment-memo-button') handleInvestmentMemoRequest(symbol);
        if (target.id === 'generate-all-reports-button') handleGenerateAllReportsRequest(symbol);
    });
    
    setupGlobalEventListeners();
}
