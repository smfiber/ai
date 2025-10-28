// fileName: ui.js
import { CONSTANTS, state, promptMap, QUARTERLY_REVIEW_QUESTIONS, ANNUAL_REVIEW_QUESTIONS } from './config.js';
import { openModal, closeModal, openStockListModal, openManageStockModal, openPortfolioManagerModal, openRawDataViewer, addDiligenceEntryRow, addKpiRow } from './ui-modals.js';
import { fetchAndCachePortfolioData, renderPortfolioManagerList, renderGarpScorecardDashboard, renderGarpInterpretationAnalysis } from './ui-render.js';
// Removed handleUpdatedFinalThesisRequest from the import below
import { handleResearchSubmit, handleSaveStock, handleDeleteStock, handleRefreshFmpData, handleAnalysisRequest, handleGarpMemoRequest, handleSaveReportToDb, handleGeneratePrereqsRequest, handleGarpCandidacyRequest, handlePortfolioGarpAnalysisRequest, handlePositionAnalysisRequest, handleReportHelpRequest, handleManualDiligenceSave, handleDeleteDiligenceLog, handleWorkflowHelpRequest, handleManualPeerAnalysisRequest, handleGenerateFilingQuestionsRequest, handleSaveFilingDiligenceRequest, handleDeleteFilingDiligenceLog, handleGenerateUpdatedGarpMemoRequest, handleGenerateUpdatedQarpMemoRequest, handleAnalyzeEightKRequest, handleCompounderMemoRequest, handleBmqvMemoRequest, handleFinalThesisRequest, handleKpiSuggestionRequest, handleCopyReportRequest, handleFullAnalysisWorkflow, handleDiligenceMemoRequest, handleSaveDiligenceAnswers, handleDeleteAllDiligenceAnswers, handleDeleteOldDiligenceLogs, handleInvestigationSummaryRequest, handleQuarterlyReviewRequest, handleAnnualReviewRequest, handleEightKThesisImpactRequest } from './ui-handlers.js'; // Added handleEightKThesisImpactRequest
import { getFmpStockData } from './api.js';
import { _calculateGarpScorecardMetrics } from './analysis-helpers.js';

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

        // Adjust if tooltip goes off-screen
        if (top < 0) { // If above screen
            top = targetRect.bottom + margin;
        }
        if (left < 0) { // If left of screen
            left = margin;
        } else if (left + tooltipRect.width > window.innerWidth) { // If right of screen
            left = window.innerWidth - tooltipRect.width - margin;
        }

        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
    }
}

// --- EVENT LISTENER SETUP ---

async function handleScorecardEdit(target) {
    const metricKey = target.dataset.metricKey;
    const ticker = target.dataset.ticker;
    const format = target.dataset.format;

    if (!metricKey || !ticker) return;

    const originalValueText = target.textContent.replace(/%|\s|x|\/|5/g, '').trim();
    const originalValue = parseFloat(originalValueText);

    const input = document.createElement('input');
    input.type = 'text';
    input.value = isNaN(originalValue) ? '' : originalValue;
    input.className = 'w-full text-center text-2xl font-bold bg-gray-200 rounded-md';

    target.style.display = 'none';
    target.parentNode.appendChild(input);
    input.focus();
    input.select();

    const saveAndClose = async () => {
        let newValue = parseFloat(input.value);

        if (isNaN(newValue)) {
            // If input is blank, we remove the override
            const docRef = state.db.collection(CONSTANTS.DB_COLLECTION_FMP_CACHE).doc(ticker).collection('analysis').doc('manual_overrides');
            await docRef.update({
                [metricKey]: firebase.firestore.FieldValue.delete()
            });
        } else {
             // If it's a percentage, divide by 100 before saving
            if (format === 'percent') {
                newValue = newValue / 100;
            }
            const docRef = state.db.collection(CONSTANTS.DB_COLLECTION_FMP_CACHE).doc(ticker).collection('analysis').doc('manual_overrides');
            await docRef.set({ [metricKey]: newValue }, { merge: true });
        }

        // Re-render the dashboard to show the updated score and indicator
        // Note: The related components are removed, so this rendering won't happen, but we keep the logic in case they are re-added.
        const garpScorecardContainer = document.getElementById('garp-scorecard-container');
        if (garpScorecardContainer) {
            const fmpData = await getFmpStockData(ticker);
            renderGarpScorecardDashboard(garpScorecardContainer, ticker, fmpData);
            renderGarpInterpretationAnalysis(garpScorecardContainer, _calculateGarpScorecardMetrics(fmpData));
        }

        // Cleanup
        input.remove();
        target.style.display = 'block';
    };

    input.addEventListener('blur', saveAndClose);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            input.blur(); // Trigger the save and close
        } else if (e.key === 'Escape') {
            input.remove();
            target.style.display = 'block';
        }
    });
}

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

    // Event delegation for the Manage Stock modal
    document.getElementById('manageStockModal')?.addEventListener('click', (e) => {
        if (e.target.closest('#suggest-kpis-button')) {
            handleKpiSuggestionRequest();
            return;
        }
        if (e.target.closest('#add-kpi-button')) {
            addKpiRow();
            return;
        }

        const suggestionChip = e.target.closest('.kpi-suggestion-chip');
        if (suggestionChip) {
            const kpiName = suggestionChip.dataset.kpiName;
            addKpiRow({ name: kpiName });
            return;
        }

        const removeKpiButton = e.target.closest('.remove-kpi-button');
        if (removeKpiButton) {
            removeKpiButton.closest('.kpi-row').remove();
            return;
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
            document.getElementById('filing-diligence-input-container').classList.add('hidden');
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
            document.getElementById('review-form-container').classList.add('hidden');
            return;
        }

        if (target.id === 'generate-filing-questions-button') {
            handleGenerateFilingQuestionsRequest(symbol);
            return;
        }

        if (target.id === 'analyze-eight-k-button-new') {
            handleAnalyzeEightKRequest(symbol);
            return;
        }

        // *** ADDED EVENT LISTENER FOR NEW BUTTON ***
        if (target.id === 'analyze-eight-k-thesis-impact-button') {
             handleEightKThesisImpactRequest(symbol);
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

        if (target.id === 'generate-position-analysis-button') {
            handlePositionAnalysisRequest(symbol);
            return;
        }

        // Removed AI Analysis related button listeners
        // if (target.id === 'run-full-workflow-button') { ... }
        // if (target.matches('.generate-candidacy-button')) { ... }
        // if (target.matches('.ai-analysis-button')) { ... }
        // if (target.id === 'garp-memo-button') ...
        // if (target.id === 'long-term-compounder-button') ...
        // if (target.id === 'bmqv-memo-button') ...
        // if (target.id === 'final-thesis-button') ...
        // if (target.id === 'updated-final-thesis-button') ... // This usage was likely removed previously as well
        // if (target.id === 'generate-prereqs-button') ...
    });

    setupGlobalEventListeners();
}
