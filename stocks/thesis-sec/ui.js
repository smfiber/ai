// fileName: ui.js
import { CONSTANTS, state, promptMap, QUARTERLY_REVIEW_QUESTIONS, ANNUAL_REVIEW_QUESTIONS } from './config.js';
import { openModal, closeModal, openStockListModal, openManageStockModal, openPortfolioManagerModal, openRawDataViewer, addDiligenceEntryRow, addKpiRow } from './ui-modals.js';
import { fetchAndCachePortfolioData, renderPortfolioManagerList, renderGarpScorecardDashboard, renderGarpInterpretationAnalysis } from './ui-render.js';
// Removed handleGenerateFilingQuestionsRequest, Added new handlers
import { handleResearchSubmit, handleSaveStock, handleDeleteStock, handleRefreshFmpData, handleAnalysisRequest, handleGarpMemoRequest, handleSaveReportToDb, handleGeneratePrereqsRequest, handleGarpCandidacyRequest, handlePortfolioGarpAnalysisRequest, handlePositionAnalysisRequest, handleReportHelpRequest, handleManualDiligenceSave, handleDeleteDiligenceLog, handleWorkflowHelpRequest, handleManualPeerAnalysisRequest, handleSaveFilingDiligenceRequest, handleDeleteFilingDiligenceLog, handleGenerateUpdatedGarpMemoRequest, handleGenerateUpdatedQarpMemoRequest, handleAnalyzeEightKRequest, handleCompounderMemoRequest, handleBmqvMemoRequest, handleFinalThesisRequest, handleKpiSuggestionRequest, handleCopyReportRequest, handleFullAnalysisWorkflow, handleDiligenceMemoRequest, handleSaveDiligenceAnswers, handleDeleteAllDiligenceAnswers, handleDeleteOldDiligenceLogs, handleInvestigationSummaryRequest, handleQuarterlyReviewRequest, handleAnnualReviewRequest, handleUpdatedFinalThesisRequest, handleEightKThesisImpactRequest, handleAnalyzeTenQRequest, handleAnalyzeTenKRequest, handleTenQThesisImpactRequest, handleTenKThesisImpactRequest } from './ui-handlers.js';
import { getFmpStockData } from './api.js';
import { _calculateGarpScorecardMetrics } from './analysis-helpers.js';

// --- DYNAMIC TOOLTIPS ---
function initializeTooltips() {
    // ... (content unchanged)
}

// --- EVENT LISTENER SETUP ---

async function handleScorecardEdit(target) {
    // ... (content unchanged)
}

function setupGlobalEventListeners() {
    // ... (content unchanged)
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

    // Event delegation for the Manage Stock modal
    document.getElementById('manageStockModal')?.addEventListener('click', (e) => {
        // ... (content unchanged)
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
        // Removed transcript search form listener as AI Analysis tab is gone
    });

    analysisModal.addEventListener('click', async (e) => {
        // Removed scorecard edit listener as scorecard is gone
        // if (e.target.matches('.metric-value')) { ... }

        const target = e.target.closest('button');
        if (!target) return;

        if (target.matches('.ai-help-button')) {
            const reportType = target.dataset.reportType;
            if (reportType) {
                handleReportHelpRequest(reportType);
            }
            return;
        }

        // Removed manual peer analysis listener as peer section is gone
        // if (target.id === 'analyze-manual-peers-button') { ... }

        // Removed GARP candidacy listener as candidacy section is gone
        // if (target.id === 'analyze-garp-button') { ... }

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

        // Removed copy report button listener as AI Analysis tab is gone
        // const copyReportBtn = e.target.closest('.copy-report-btn'); ...

        if (target.id === 'add-diligence-entry-button') {
            addDiligenceEntryRow();
            return;
        }

        if (target.id === 'delete-all-diligence-button') {
            handleDeleteAllDiligenceAnswers(symbol);
            return;
        }

        if (target.id === 'delete-old-diligence-logs-button') {
            handleDeleteOldDiligenceLogs(symbol);
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
        if (target.matches('.start-review-button')) {
            const reviewType = target.dataset.reviewType; // 'Quarterly' or 'Annual'
            const formContainer = document.getElementById('review-form-container');
            const questions = reviewType === 'Quarterly' ? QUARTERLY_REVIEW_QUESTIONS : ANNUAL_REVIEW_QUESTIONS;

            let formHtml = `<div class="p-4 border rounded-lg bg-gray-50"><h4 class="text-base font-semibold text-gray-800 mb-4">${reviewType} Review Checklist</h4><div class="space-y-4">`;
            for(const [key, question] of Object.entries(questions)) {
                formHtml += `
                    <div class="review-qa-pair p-3 bg-white rounded-lg border">
                        <label class="font-semibold text-sm text-indigo-700 block mb-2">${key}</label>
                        <p class="text-xs text-gray-600 mb-2">${question}</p>
                        <textarea class="review-answer-textarea w-full border border-gray-300 rounded-lg p-2 text-sm" rows="4" data-question-key="${key}" placeholder="Your findings and analysis..."></textarea>
                    </div>
                `;
            }
            formHtml += `</div><div class="text-right mt-4 flex justify-end gap-2">
                            <button type="button" class="cancel-review-button bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg">Cancel</button>
                            <button type="button" data-review-type="${reviewType}" data-symbol="${symbol}" class="submit-review-button bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg">Synthesize ${reviewType} Memo</button>
                        </div></div>`;

            formContainer.innerHTML = formHtml;
            formContainer.classList.remove('hidden');
            document.getElementById('ongoing-review-actions').classList.add('hidden');
            document.getElementById('filing-diligence-input-container').classList.add('hidden'); // Hide filing input too
            return;
        }

        if (target.matches('.submit-review-button')) {
            const reviewType = target.dataset.reviewType;
            if (reviewType === 'Quarterly') {
                handleQuarterlyReviewRequest(symbol);
            } else if (reviewType === 'Annual') {
                handleAnnualReviewRequest(symbol);
            }
            return;
        }

        if (target.matches('.cancel-review-button')) {
            const formContainer = document.getElementById('review-form-container');
            formContainer.innerHTML = '';
            formContainer.classList.add('hidden');
            document.getElementById('ongoing-review-actions').classList.remove('hidden');
            return;
        }

        if (target.id === 'show-filing-input-button') {
            document.getElementById('filing-diligence-input-container').classList.remove('hidden');
            document.getElementById('ongoing-review-actions').classList.add('hidden');
            document.getElementById('review-form-container').classList.add('hidden'); // Hide review form if open
             document.getElementById('filing-diligence-form-container').classList.add('hidden'); // Hide old Q&A form if open
            return;
        }

        // *** REMOVED listener for 'generate-filing-questions-button' ***

        // *** UPDATED listener for analyze 8-K button ID ***
        if (target.id === 'analyze-eightk-button') {
            handleAnalyzeEightKRequest(symbol);
            return;
        }
        // *** NEW listeners for 10-Q and 10-K analysis ***
        if (target.id === 'analyze-tenq-button') {
            handleAnalyzeTenQRequest(symbol);
            return;
        }
        if (target.id === 'analyze-tenk-button') {
            handleAnalyzeTenKRequest(symbol);
            return;
        }

        // *** NEW listeners for thesis impact buttons ***
        if (target.id === 'analyze-eightk-thesis-impact-button') {
             handleEightKThesisImpactRequest(symbol);
             return;
        }
        if (target.id === 'analyze-tenq-thesis-impact-button') {
             handleTenQThesisImpactRequest(symbol);
             return;
        }
        if (target.id === 'analyze-tenk-thesis-impact-button') {
             handleTenKThesisImpactRequest(symbol);
             return;
        }

        // Listener for saving manual Q&A generated from old process (can likely be removed if UI changes)
        if (target.id === 'save-filing-diligence-button') {
            handleSaveFilingDiligenceRequest(symbol);
            return;
        }

        // *** REMOVED listener for 'cancel-filing-diligence-button' ***

        // Handles deleting ANY log entry from ongoing diligence now
        const deleteFilingBtn = e.target.closest('.delete-filing-diligence-log-btn');
        if (deleteFilingBtn) {
            const reportId = deleteFilingBtn.dataset.reportId;
            if (reportId) {
                handleDeleteFilingDiligenceLog(reportId, symbol);
            }
            return;
        }

        // Removed copy button for generated Q&A form
        // const copyFilingQuestionBtn = e.target.closest('.copy-filing-question-btn'); ...

        if (target.id === 'generate-updated-garp-memo-button') {
            handleGenerateUpdatedGarpMemoRequest(symbol);
            return;
        }

        if (target.id === 'generate-updated-qarp-memo-button') {
            handleGenerateUpdatedQarpMemoRequest(symbol);
            return;
        }

        // --- Diligence Hub Specific ---
        const saveDiligenceBtn = e.target.closest('.save-diligence-answers-button');
        if (saveDiligenceBtn) {
            const diligenceType = saveDiligenceBtn.dataset.diligenceType;
            if (symbol && diligenceType) {
                handleSaveDiligenceAnswers(symbol, diligenceType);
            }
            return;
        }

        if (target.id === 'save-manual-diligence-button') {
            handleManualDiligenceSave(symbol);
            return;
        }

        // --- Position Analysis ---
        if (target.id === 'generate-position-analysis-button') {
            handlePositionAnalysisRequest(symbol);
            return;
        }

        // --- AI Analysis Tab Specific ---
        if (target.id === 'run-full-workflow-button') {
             handleFullAnalysisWorkflow(symbol);
             return;
        }

        // Removed listener for '.generate-candidacy-button' as it's now on dashboard tab

        if (target.matches('.ai-analysis-button')) {
            const reportType = target.dataset.reportType;
            const promptConfig = promptMap[reportType];
            const diligenceMemoTypes = ['QualitativeDiligenceMemo', 'StructuredDiligenceMemo', 'MarketSentimentMemo']; // MarketSentimentMemo kept here for now

            if (reportType === 'InvestigationSummaryMemo') {
                handleInvestigationSummaryRequest(symbol);
            } else if (diligenceMemoTypes.includes(reportType)) {
                handleDiligenceMemoRequest(symbol, reportType);
            } else if (promptConfig) {
                // Ensure correct arguments for different handlers
                if (['InvestmentMemo', 'LongTermCompounder', 'BmqvMemo', 'FinalInvestmentThesis', 'UpdatedFinalThesis'].includes(reportType)) {
                    // Call handlers that expect (symbol, forceNew = false) or (symbol, reportType, promptConfig, forceNew = false) implicitly using default forceNew
                    if (reportType === 'InvestmentMemo') handleGarpMemoRequest(symbol);
                    else if (reportType === 'LongTermCompounder') handleCompounderMemoRequest(symbol);
                    else if (reportType === 'BmqvMemo') handleBmqvMemoRequest(symbol);
                    else if (reportType === 'FinalInvestmentThesis') handleFinalThesisRequest(symbol);
                    else if (reportType === 'UpdatedFinalThesis') handleUpdatedFinalThesisRequest(symbol);
                 } else {
                    handleAnalysisRequest(symbol, reportType, promptConfig);
                }
            }
            return; // Added return to prevent falling through
        }

        // Explicit button IDs removed as they are covered by '.ai-analysis-button' logic above
        // if (target.id === 'garp-memo-button') ...
        // if (target.id === 'long-term-compounder-button') ...
        // if (target.id === 'bmqv-memo-button') ...
        // if (target.id === 'final-thesis-button') ...
        // if (target.id === 'updated-final-thesis-button') ...
        if (target.id === 'generate-prereqs-button') { // Kept separate as it doesn't fit standard pattern
            handleGeneratePrereqsRequest(symbol);
            return; // Added return
        }
    });

    setupGlobalEventListeners();
}
