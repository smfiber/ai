// fileName: ui.js
import { CONSTANTS, state, promptMap } from './config.js';
import { openModal, closeModal, openStockListModal, openManageStockModal, openPortfolioManagerModal, openRawDataViewer, QUARTERLY_REVIEW_QUESTIONS, ANNUAL_REVIEW_QUESTIONS, addDiligenceEntryRow } from './ui-modals.js';
import { fetchAndCachePortfolioData, renderPortfolioManagerList } from './ui-render.js';
import { handleResearchSubmit, handleSaveStock, handleDeleteStock, handleRefreshFmpData, handleAnalysisRequest, handleGarpMemoRequest, handleSaveReportToDb, handleGeneratePrereqsRequest, handleGarpCandidacyRequest, handlePortfolioGarpAnalysisRequest, handlePositionAnalysisRequest, handleReportHelpRequest, handleManualDiligenceSave, handleDeleteDiligenceLog, handleWorkflowHelpRequest, handlePeerAnalysisRequest, handleManualPeerAnalysisRequest, handleStructuredDiligenceSave, handleGenerateFilingQuestionsRequest, handleSaveFilingDiligenceRequest, handleDeleteFilingDiligenceLog, handleGenerateUpdatedGarpMemoRequest, handleGenerateUpdatedQarpMemoRequest, handleAnalyzeEightKRequest, handleCompounderMemoRequest, handleFinalThesisRequest } from './ui-handlers.js';
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
        if (target.id === 'generate-filing-questions-button') {
            handleGenerateFilingQuestionsRequest(symbol);
            return;
        }
        
        if (target.id === 'analyze-eight-k-button') {
            handleAnalyzeEightKRequest(symbol);
            return;
        }
        
        if (target.id === 'save-filing-diligence-button') {
            handleSaveFilingDiligenceRequest(symbol);
            return;
        }

        if (target.id === 'cancel-filing-diligence-button') {
            const formContainer = document.getElementById('filing-diligence-form-container');
            formContainer.innerHTML = '';
            formContainer.classList.add('hidden');
            document.getElementById('filing-diligence-input-container').classList.remove('hidden');
            return;
        }

        const deleteFilingBtn = e.target.closest('.delete-filing-diligence-log-btn');
        if (deleteFilingBtn) {
            const reportId = deleteFilingBtn.dataset.reportId;
            if (reportId) {
                handleDeleteFilingDiligenceLog(reportId, symbol);
            }
            return;
        }

        const copyFilingQuestionBtn = e.target.closest('.copy-filing-question-btn');
        if (copyFilingQuestionBtn) {
            const questionText = copyFilingQuestionBtn.previousElementSibling.textContent;
            navigator.clipboard.writeText(questionText).then(() => {
                copyFilingQuestionBtn.classList.add('copied');
                const originalIcon = copyFilingQuestionBtn.innerHTML;
                copyFilingQuestionBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>`;
                setTimeout(() => {
                    copyFilingQuestionBtn.classList.remove('copied');
                    copyFilingQuestionBtn.innerHTML = originalIcon;
                }, 2000);
            });
            return;
        }

        if (target.id === 'generate-updated-garp-memo-button') {
            handleGenerateUpdatedGarpMemoRequest(symbol);
            return;
        }

        if (target.id === 'generate-updated-qarp-memo-button') {
            handleGenerateUpdatedQarpMemoRequest(symbol);
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
        
        if (target.id === 'garp-memo-button') handleGarpMemoRequest(symbol);
        if (target.id === 'long-term-compounder-button') handleCompounderMemoRequest(symbol);
        if (target.id === 'final-thesis-button') handleFinalThesisRequest(symbol);
        if (target.id === 'generate-prereqs-button') handleGeneratePrereqsRequest(symbol);
    });
    
    setupGlobalEventListeners();
}
