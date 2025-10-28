// fileName: ui-modals.js
import { CONSTANTS, state, ANALYSIS_ICONS, SECTOR_KPI_SUGGESTIONS, QUALITATIVE_DILIGENCE_QUESTIONS, STRUCTURED_DILIGENCE_QUESTIONS, MARKET_SENTIMENT_QUESTIONS } from './config.js';
import { getFmpStockData, getGroupedFmpData } from './api.js';
import { renderValuationHealthDashboard, _renderGroupedStockList, renderPortfolioManagerList, renderGarpScorecardDashboard, renderGarpInterpretationAnalysis, updateGarpCandidacyStatus, renderCandidacyAnalysis, renderGarpAnalysisSummary, renderDiligenceLog, renderPeerComparisonTable, renderOngoingReviewLog } from './ui-render.js';
import { getSavedReports } from './ui-handlers.js'; // Keep this import

// --- GENERIC MODAL HELPERS ---

export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add(CONSTANTS.CLASS_MODAL_OPEN);
        document.body.classList.add(CONSTANTS.CLASS_BODY_MODAL_OPEN);
    }
}

export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove(CONSTANTS.CLASS_MODAL_OPEN);
        // Only remove the body class if no other modals are open
        const anyModalOpen = document.querySelector('.modal.is-open');
        if (!anyModalOpen) {
            document.body.classList.remove(CONSTANTS.CLASS_BODY_MODAL_OPEN);
        }
    }
}

export function displayMessageInModal(message, type = 'info', duration = 2500) {
    const modal = document.getElementById(CONSTANTS.MODAL_MESSAGE);
    const content = modal.querySelector('.modal-content');
    if (!content) return;

    const typeClasses = {
        info: 'bg-blue-100 border-blue-500 text-blue-700',
        warning: 'bg-yellow-100 border-yellow-500 text-yellow-700',
        error: 'bg-red-100 border-red-500 text-red-700',
    };

    content.innerHTML = `<div class="p-6 rounded-lg border-l-4 ${typeClasses[type] || typeClasses.info}" role="alert">
                           <p class="font-bold">${type.charAt(0).toUpperCase() + type.slice(1)}</p>
                           <p>${message}</p>
                         </div>`;
    openModal(CONSTANTS.MODAL_MESSAGE);
    setTimeout(() => closeModal(CONSTANTS.MODAL_MESSAGE), duration);
}

export function openConfirmationModal(title, message, onConfirm) {
    document.getElementById('confirmation-title').textContent = title;
    document.getElementById('confirmation-message').textContent = message;

    const confirmButton = document.getElementById('confirm-button');
    // Clone and replace the button to remove old event listeners
    const newConfirmButton = confirmButton.cloneNode(true);
    confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);

    newConfirmButton.addEventListener('click', () => {
        closeModal(CONSTANTS.MODAL_CONFIRMATION);
        onConfirm();
    }, { once: true });

    openModal(CONSTANTS.MODAL_CONFIRMATION);
}

// --- SPECIFIC MODAL HELPERS ---

export function addKpiRow(kpi = {}) {
    const container = document.getElementById('kpi-list-container');
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'kpi-row grid grid-cols-12 gap-2 items-center';
    row.innerHTML = `
        <div class="col-span-5">
            <input type="text" class="kpi-name-input mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm" placeholder="KPI Name (e.g., MAU)" value="${kpi.name || ''}">
        </div>
        <div class="col-span-5">
            <input type="text" class="kpi-value-input mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm" placeholder="Value or Trend" value="${kpi.value || ''}">
        </div>
        <div class="col-span-2 text-right">
            <button type="button" class="remove-kpi-button text-red-500 hover:text-red-700 font-bold text-xl">&times;</button>
        </div>
    `;
    container.appendChild(row);
}

export function openManageStockModal(stockData) {
    // ... (content unchanged)
}


export function openPortfolioManagerModal() {
    renderPortfolioManagerList();
    openModal(CONSTANTS.MODAL_PORTFOLIO_MANAGER);
}

export async function openStockListModal(listType) {
    // ... (content unchanged)
}

export function addDiligenceEntryRow() {
    const container = document.getElementById('manual-diligence-entries-container');
    if (!container) return;
    const entryDiv = document.createElement('div');
    entryDiv.className = 'diligence-entry-row border p-3 rounded-lg bg-gray-50 space-y-2';
    entryDiv.innerHTML = `
        <div class="flex justify-between items-center">
            <label class="block text-sm font-medium text-gray-700">New Question</label>
            <button type="button" class="delete-diligence-entry-button text-red-500 hover:text-red-700 font-bold text-xl">&times;</button>
        </div>
        <textarea class="diligence-question-manual-input w-full border border-gray-300 rounded-lg p-2 text-sm" rows="3" placeholder="Enter your diligence question..."></textarea>
        <label class="block text-sm font-medium text-gray-700 pt-2">Answer</label>
        <textarea class="diligence-answer-manual-input w-full border border-gray-300 rounded-lg p-2 text-sm" rows="5" placeholder="Enter the answer you found..."></textarea>
    `;
    container.appendChild(entryDiv);
}

/**
 * Resets the analysis modal to a clean state.
 */
function _resetAnalysisModal() {
    const safeClear = (id, content = '') => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = content;
    };

    state.reportCache = [];

    // Clear main tab containers
    safeClear('dashboard-tab', '<div class="loader mx-auto my-8"></div>');
    safeClear('ai-analysis-tab');
    safeClear('diligence-hub-tab');
    safeClear('ongoing-diligence-tab');
    safeClear('position-analysis-tab');
    safeClear('raw-data-tab', '<div id="raw-data-accordion-container"><div class="loader mx-auto my-8"></div></div>');

    // Reset tabs
    document.querySelectorAll('#rawDataViewerModal .tab-content').forEach(c => c.classList.add('hidden'));
    document.querySelectorAll('#rawDataViewerModal .tab-button').forEach(b => {
        b.classList.remove('active');
        b.removeAttribute('data-loaded');
    });
    document.getElementById('dashboard-tab')?.classList.remove('hidden');
    document.querySelector('.tab-button[data-tab="dashboard"]')?.classList.add('active');

    // Ensure position analysis tab button is hidden initially
    document.querySelector('.tab-button[data-tab="position-analysis"]')?.classList.add('hidden');

    // Ensure thesis impact buttons are hidden initially
    document.querySelectorAll('.analyze-thesis-impact-button').forEach(btn => btn.classList.add('hidden'));

    // Clear specific elements
    safeClear('raw-data-accordion-container', '<div class="loader mx-auto my-8"></div>');
    safeClear('position-analysis-content-container');
    safeClear('ai-article-container-analysis');
    safeClear('company-profile-display-container');
    safeClear('garp-scorecard-container');
    safeClear('peer-analysis-section-container');
    safeClear('valuation-health-container');
    safeClear('ai-garp-summary-container');
    safeClear('analysis-content-container');
    safeClear('ongoing-review-log-container'); // Clear log display area
    safeClear('ongoing-review-display-container'); // Clear report display area

    // Reset status containers
    ['report-status-container-analysis', 'report-status-container-position'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.innerHTML = '';
            el.classList.add('hidden');
            delete el.dataset.activeReportType;
        }
    });
}

// *** UPDATED openRawDataViewer Function ***
export async function openRawDataViewer(ticker) {
    const modalId = 'rawDataViewerModal';
    openModal(modalId);

    // 1. Reset Modal State
    _resetAnalysisModal();

    // 2. Set Context
    const modal = document.getElementById(modalId);
    modal.dataset.activeTicker = ticker;
    const titleEl = document.getElementById('raw-data-viewer-modal-title');
    titleEl.textContent = `Analyzing ${ticker}...`;

    const sanitizeText = (text) => {
        if (typeof text !== 'string') return '';
        const tempDiv = document.createElement('div');
        tempDiv.textContent = text;
        return tempDiv.innerHTML;
    };

    try {
        // --- 3. Fetch Data ---
        const fmpDataPromise = getFmpStockData(ticker);
        const groupedDataPromise = getGroupedFmpData(ticker);
        // Fetch all reports initially to populate cache
        const reportsRef = state.db.collection(CONSTANTS.DB_COLLECTION_AI_REPORTS).where("ticker", "==", ticker);
        const savedReportsPromise = reportsRef.get().then(snapshot => {
            // Populate state.reportCache directly
            state.reportCache = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return state.reportCache; // Return for consistency if needed, but main goal is state update
        });

        // Fetch diligence answers promises (structured slightly differently for clarity)
        const getDiligenceAnswers = async (type) => {
            const snap = await state.db.collection(CONSTANTS.DB_COLLECTION_FMP_CACHE).doc(ticker).collection('diligence_answers').doc(type).get();
            return snap.exists ? new Map(snap.data().answers.map(item => [item.question, item.answer])) : new Map();
        };
        const qualitativeAnswersPromise = getDiligenceAnswers('Qualitative');
        const structuredAnswersPromise = getDiligenceAnswers('Structured');
        const marketSentimentAnswersPromise = getDiligenceAnswers('MarketSentiment'); // Kept for now

        const [
            fmpData,
            groupedFmpData,
            allSavedReports, // Already populated state.reportCache
            savedQualitativeAnswers,
            savedStructuredAnswers,
            savedMarketSentimentAnswers
        ] = await Promise.all([
            fmpDataPromise,
            groupedDataPromise,
            savedReportsPromise, // Wait for cache population
            qualitativeAnswersPromise,
            structuredAnswersPromise,
            marketSentimentAnswersPromise
        ]);

        if (!fmpData || !fmpData.profile || !fmpData.profile.length === 0) {
            closeModal(modalId);
            displayMessageInModal(`Crucial data is missing for ${ticker}. Please use the "Refresh FMP" button for this stock, then try again.`, 'warning');
            return;
        }

        // --- 4. Populate Tabs ---
        titleEl.textContent = `Analysis for ${ticker}`;
        const profile = fmpData.profile[0];
        const savedReportTypes = new Set(allSavedReports.map(report => report.reportType)); // Use reports from populated cache

        // --- DASHBOARD TAB ---
        const dashboardTab = document.getElementById('dashboard-tab');
        if (dashboardTab) {
            dashboardTab.innerHTML = `
                <div class="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
                    <div id="company-profile-display-container" class="bg-white p-6 rounded-2xl shadow-lg border border-gray-200"></div>
                    <div id="peer-analysis-section-container" class="bg-white p-6 rounded-2xl shadow-lg border border-gray-200"></div>
                </div>
                <div id="ai-garp-summary-container" class="bg-white p-6 rounded-2xl shadow-lg border border-gray-200"></div>
                <div id="garp-scorecard-container" class="bg-white p-6 rounded-2xl shadow-lg border border-gray-200"></div>
                <div id="garp-interpretation-container" class="bg-white p-6 rounded-2xl shadow-lg border border-gray-200"></div>
                <div id="valuation-health-container" class="bg-white p-6 rounded-2xl shadow-lg border border-gray-200"></div>
            `;
            const profileDisplayContainer = document.getElementById('company-profile-display-container');
            const peerAnalysisContainer = document.getElementById('peer-analysis-section-container');
            const aiGarpSummaryContainer = document.getElementById('ai-garp-summary-container');
            const garpScorecardContainer = document.getElementById('garp-scorecard-container');
            const valuationHealthContainer = document.getElementById('valuation-health-container');

            const description = profile.description || 'No description available.';
            profileDisplayContainer.innerHTML = `<h3 class="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Company Overview</h3><p class="text-sm text-gray-700">${description}</p>`;

            const metrics = renderGarpScorecardDashboard(garpScorecardContainer, ticker, fmpData);
            renderGarpInterpretationAnalysis(garpScorecardContainer, metrics);
            renderValuationHealthDashboard(valuationHealthContainer, ticker, fmpData);
            renderGarpAnalysisSummary(aiGarpSummaryContainer, ticker); // Renders the container + button

            const peerDocRef = state.db.collection(CONSTANTS.DB_COLLECTION_FMP_CACHE).doc(ticker).collection('analysis').doc('peer_comparison');
            const peerDocSnap = await peerDocRef.get();
            const peerHelpIcon = `<button data-report-type="PeerComparison" class="ai-help-button p-1 rounded-full hover:bg-indigo-100" title="What is this?"><svg class="w-5 h-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"></path></svg></button>`;
            peerAnalysisContainer.innerHTML = `
                <div class="flex justify-between items-center mb-4 border-b pb-2">
                    <div class="flex items-center gap-2"> <h3 class="text-xl font-bold text-gray-800">Peer Comparison</h3> ${peerHelpIcon} </div>
                </div>
                <div id="peer-analysis-content-container"> <p class="text-gray-500 italic">Enter comma-separated tickers below and click "Analyze Peers" to build a comparison table.</p> </div>
                <div id="manual-peer-entry-container" class="mt-4 pt-4 border-t">
                    <label for="manual-peer-input" class="block text-sm font-medium text-gray-700">Enter Comma-Separated Peer Tickers:</label>
                    <textarea id="manual-peer-input" rows="2" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 uppercase" placeholder="e.g., PEP, KOF, CCEP"></textarea>
                    <div class="mt-2 text-right"> <button id="analyze-manual-peers-button" data-ticker="${ticker}" class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-1 px-4 rounded-lg text-sm">Analyze Peers</button> </div>
                </div>`;
            if (peerDocSnap.exists) {
                renderPeerComparisonTable(peerAnalysisContainer.querySelector('#peer-analysis-content-container'), ticker, metrics, peerDocSnap.data());
            }

            const savedCandidacyReports = getReportsFromCache(ticker, 'GarpCandidacy'); // Use cache
            if (savedCandidacyReports.length > 0) {
                 const latestReport = savedCandidacyReports[0];
                 const resultContainer = aiGarpSummaryContainer.querySelector('#garp-analysis-container');
                 const statusContainer = aiGarpSummaryContainer.querySelector('#garp-candidacy-status-container');
                 updateGarpCandidacyStatus(statusContainer, savedCandidacyReports, latestReport.id, ticker);
                 const savedDate = latestReport.savedAt.toDate().toLocaleString();
                 const tempContainer = document.createElement('div');
                 renderCandidacyAnalysis(tempContainer, latestReport.content, latestReport.prompt, latestReport.diligenceQuestions);
                 resultContainer.innerHTML = `<details class="border rounded-md bg-gray-50/50"><summary class="p-3 font-semibold text-gray-700 cursor-pointer hover:bg-gray-50">View Latest Saved Report (from ${savedDate})</summary><div class="p-4 border-t bg-white">${tempContainer.innerHTML}</div></details>`;
            }
        }

        // --- AI ANALYSIS TAB ---
        const aiAnalysisContainer = document.getElementById('ai-analysis-tab');
        if (aiAnalysisContainer) {
            const deepDiveButtons = [
                { reportType: 'MoatAnalysis', text: 'Moat Analysis', tooltip: 'Evaluates the company\'s competitive advantages.' },
                { reportType: 'CapitalAllocators', text: 'Capital Allocators', tooltip: 'Assesses management\'s skill in deploying capital.' },
                { reportType: 'InvestigationSummaryMemo', text: 'Investigation Summary', tooltip: 'Synthesizes your manual Q&A from the Diligence Hub into a summary memo.' },
                { reportType: 'QualitativeDiligenceMemo', text: 'Qualitative Memo', tooltip: 'Synthesizes your answers on moat and management.' },
                { reportType: 'StructuredDiligenceMemo', text: 'Structured Memo', tooltip: 'Synthesizes your answers on financial health.' },
                { reportType: 'MarketSentimentMemo', text: 'Market Sentiment', tooltip: 'Synthesizes analyst ratings, technicals, and factor scores.' },
            ];
            const copyIconSvg = `<svg class="w-5 h-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125H4.875A1.125 1.125 0 013.75 20.625V7.875c0-.621.504-1.125 1.125-1.125H6.75m9 9.375h3.375c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125h-9.75A1.125 1.125 0 006 9.375v9.75c0 .621.504 1.125 1.125 1.125h3.375m-3.75-9.375V6.125c0-.621.504-1.125 1.125-1.125h9.75c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-3.375" /></svg>`;
            const buildButtonHtml = (buttons) => buttons.map((btn) => {
                const hasSaved = savedReportTypes.has(btn.reportType) ? 'has-saved-report' : '';
                const icon = ANALYSIS_ICONS[btn.reportType] || '';
                const helpIconSvg = `<svg class="w-5 h-5 text-indigo-500 group-hover:text-indigo-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg>`;
                return `<div class="relative group"> <button data-symbol="${ticker}" data-report-type="${btn.reportType}" class="ai-analysis-button analysis-tile ${hasSaved}" data-tooltip="${btn.tooltip}"> ${icon} <span class="tile-name">${btn.text}</span> </button> <button data-report-type="${btn.reportType}" class="ai-help-button absolute -top-2 -right-2 bg-white p-1 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity" title="What is this report?"> ${helpIconSvg} </button> <button type="button" class="copy-report-btn absolute -bottom-2 -right-2 p-2 rounded-full bg-gray-200 hover:bg-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" data-report-type="${btn.reportType}" title="Copy Latest Report to Clipboard"> <svg class="w-4 h-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125H4.875A1.125 1.125 0 013.75 20.625V7.875c0-.621.504-1.125 1.125-1.125H6.75m9 9.375h3.375c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125h-9.75A1.125 1.125 0 006 9.375v9.75c0 .621.504 1.125 1.125 1.125h3.375m-3.75-9.375V6.125c0-.621.504-1.125 1.125-1.125h9.75c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-3.375" /></svg> </button> </div>`;
            }).join('');
            const buildSynthesisButton = (reportType, buttonId, text, bgColor = 'bg-indigo-600', hoverColor = 'hover:bg-indigo-700') => `<div class="relative flex items-center gap-2"> <button data-symbol="${ticker}" id="${buttonId}" data-report-type="${reportType}" class="ai-analysis-button ${bgColor} ${hoverColor} text-white font-bold py-3 px-4 rounded-lg text-sm flex-grow">${text}</button> <button type="button" class="copy-report-btn p-2 rounded-full bg-gray-200 hover:bg-gray-300" data-report-type="${reportType}" title="Copy Latest Report to Clipboard"> ${copyIconSvg} </button> </div>`;

            aiAnalysisContainer.innerHTML = `
                <div id="analysis-content-container" class="space-y-8 text-center bg-gray-50 p-4 rounded-lg border-b pb-4 mb-4">
                    <div class="p-4 bg-white rounded-lg border shadow-sm"> <h3 class="text-lg font-bold text-gray-800 mb-4">Automated Workflow</h3> <p class="text-sm text-gray-500 mb-4">Run the entire sequence of reports, from foundational analysis to the final thesis, in one click.</p> <button id="run-full-workflow-button" data-symbol="${ticker}" class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg text-base shadow-md transition-transform hover:scale-105"> Run Full Analysis Workflow </button> </div>
                    <div class="p-4 bg-white rounded-lg border shadow-sm"> <h3 class="text-lg font-bold text-gray-800 mb-4">Step 1: Foundational Analysis</h3> <p class="text-sm text-gray-500 mb-4">Generate these core reports first. They are the building blocks for the synthesis memos.</p> <div class="flex flex-wrap gap-4 justify-center"> ${buildButtonHtml(deepDiveButtons)} </div> </div>
                    <div class="p-4 bg-white rounded-lg border shadow-sm"> <h3 class="text-lg font-bold text-gray-800 mb-4">Step 2: Synthesis Memos</h3> <p class="text-sm text-gray-500 mb-4">Synthesize the foundational reports into different analytical frameworks.</p> <div class="grid grid-cols-1 sm:grid-cols-2 gap-4"> ${buildSynthesisButton('LongTermCompounder', 'long-term-compounder-button', 'Compounder Memo')} ${buildSynthesisButton('BmqvMemo', 'bmqv-memo-button', 'BMQV Memo')} ${buildSynthesisButton('InvestmentMemo', 'garp-memo-button', 'GARP Memo')} ${buildSynthesisButton('QarpAnalysis', 'qarp-analysis-button', 'QARP Memo')} </div> </div>
                    <div class="p-4 bg-white rounded-lg border shadow-sm"> <h3 class="text-lg font-bold text-gray-800 mb-4">Step 3: The Final Verdict</h3> <p class="text-sm text-gray-500 mb-4">Combine all synthesis memos into a single, definitive investment thesis. Then, refine it with your latest diligence.</p> <div class="flex justify-center flex-wrap gap-4"> ${buildSynthesisButton('FinalInvestmentThesis', 'final-thesis-button', 'Final Thesis')} ${buildSynthesisButton('UpdatedFinalThesis', 'updated-final-thesis-button', 'Update with Diligence', 'bg-emerald-600', 'hover:bg-emerald-700')} </div> </div>
                </div>
                <div id="report-status-container-analysis" class="hidden p-3 mb-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between gap-4"></div>
                <div id="ai-article-container-analysis" class="prose max-w-none"></div>`;
        }


        // --- DILIGENCE HUB TAB ---
        const diligenceHubContainer = document.getElementById('diligence-hub-tab');
        if (diligenceHubContainer) {
            const copyIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125H4.875A1.125 1.125 0 013.75 20.625V7.875c0-.621.504-1.125 1.125-1.125H6.75m9 9.375h3.375c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125h-9.75A1.125 1.125 0 006 9.375v9.75c0 .621.504 1.125 1.125 1.125h3.375m-3.75-9.375V6.125c0-.621.504-1.125 1.125-1.125h9.75c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-3.375" /></svg>`;
            diligenceHubContainer.innerHTML = `
                <div class="space-y-6">
                    <div class="mb-4 text-right p-4 bg-gray-100 rounded-lg border flex justify-end gap-4"> <button id="delete-old-diligence-logs-button" data-symbol="${ticker}" class="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-lg text-sm">Delete Old Log Entries</button> <button id="delete-all-diligence-button" class="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg text-sm">Delete All Saved Answers</button> </div>
                    <div id="manual-diligence-forms-container"></div>
                    <div id="qualitative-diligence-forms-container"></div>
                    <div id="structured-diligence-forms-container"></div>
                    <div id="market-sentiment-forms-container"></div>
                    <div id="diligence-log-display-container"> <div id="diligence-log-container" class="mb-6 text-left"></div> </div>
                </div>`;

            // Populate Manual Diligence
            const manualContainer = diligenceHubContainer.querySelector('#manual-diligence-forms-container');
            manualContainer.innerHTML = `<div class="p-6 bg-white rounded-lg border shadow-sm text-left"><div class="flex justify-between items-center mb-4"><div><h4 class="text-base font-semibold text-gray-800">Manual Diligence Entry</h4><p class="text-sm text-gray-500">Add custom questions and answers to the log.</p></div><button id="add-diligence-entry-button" class="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg text-sm">Add New Q&A</button></div><div id="manual-diligence-entries-container" class="space-y-4"></div><div class="text-right mt-4"><button id="save-manual-diligence-button" class="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg">Save Manual Entries</button></div></div>`;
            addDiligenceEntryRow(); // Add initial blank row

            // Populate Qualitative, Structured, Market Sentiment Forms
            const populateDiligenceForm = (containerId, questions, savedAnswers, type) => {
                const container = diligenceHubContainer.querySelector(`#${containerId}`);
                let html = `<div class="text-left border rounded-lg p-4 bg-gray-50"><h4 class="text-base font-semibold text-gray-800 mb-1">${type.replace('Diligence','')} Diligence</h4><div class="space-y-4">`;
                for (const [category, question] of Object.entries(questions)) {
                    const savedAnswer = sanitizeText(savedAnswers.get(question) || '');
                    html += `<div class="diligence-card p-3 bg-white rounded-lg border border-gray-200"><h5 class="font-semibold text-sm text-indigo-700 mb-2">${category}</h5><div class="flex items-start gap-2 mb-2"><p class="text-xs text-gray-600 flex-grow" data-question-text>${question}</p><button type="button" class="copy-icon-btn structured-diligence-copy-btn" title="Copy Question">${copyIcon}</button></div><textarea class="${type.toLowerCase()}-diligence-answer w-full border border-gray-300 rounded-lg p-2 text-sm" rows="4" data-category="${category}" placeholder="Your analysis and findings here...">${savedAnswer}</textarea></div>`;
                }
                html += `</div><div class="text-right mt-4"><button data-diligence-type="${type}" class="save-diligence-answers-button bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg">Save ${type.replace('Diligence','')} Answers</button></div></div>`;
                container.innerHTML = html;
            };
            populateDiligenceForm('qualitative-diligence-forms-container', QUALITATIVE_DILIGENCE_QUESTIONS, savedQualitativeAnswers, 'Qualitative');
            populateDiligenceForm('structured-diligence-forms-container', STRUCTURED_DILIGENCE_QUESTIONS, savedStructuredAnswers, 'Structured');
            populateDiligenceForm('market-sentiment-forms-container', MARKET_SENTIMENT_QUESTIONS, savedMarketSentimentAnswers, 'MarketSentiment'); // Kept for now

            // Populate Diligence Log
            const diligenceReports = getReportsFromCache(ticker, 'DiligenceInvestigation'); // Use cache
            renderDiligenceLog(diligenceHubContainer.querySelector('#diligence-log-container'), diligenceReports);
        }

        // --- ONGOING DILIGENCE TAB ---
        const ongoingDiligenceContainer = document.getElementById('ongoing-diligence-tab');
        if (ongoingDiligenceContainer) {
            let nextEarningsDate = 'N/A';
            if (fmpData.earning_calendar && fmpData.earning_calendar.length > 0) {
                const today = new Date(); today.setHours(0, 0, 0, 0);
                const futureEarnings = fmpData.earning_calendar.map(e => ({ ...e, dateObj: new Date(e.date) })).filter(e => e.dateObj >= today).sort((a, b) => a.dateObj - b.dateObj);
                if (futureEarnings.length > 0) { nextEarningsDate = futureEarnings[0].date; }
            }

            // Define the structure (already done in index.html, just get container)
            const logContainer = ongoingDiligenceContainer.querySelector('#ongoing-review-log-container');

            // Set dynamic data
            ongoingDiligenceContainer.querySelector('#next-earnings-date-display').textContent = nextEarningsDate;
            ongoingDiligenceContainer.querySelector('#analyze-tenq-button').dataset.symbol = ticker;
            ongoingDiligenceContainer.querySelector('#analyze-tenk-button').dataset.symbol = ticker;
            ongoingDiligenceContainer.querySelector('#analyze-eightk-button').dataset.symbol = ticker;
            ongoingDiligenceContainer.querySelector('#generate-updated-garp-memo-button').dataset.symbol = ticker;
            ongoingDiligenceContainer.querySelector('#generate-updated-qarp-memo-button').dataset.symbol = ticker;
            ongoingDiligenceContainer.querySelector('#analyze-tenq-thesis-impact-button').dataset.symbol = ticker;
            ongoingDiligenceContainer.querySelector('#analyze-tenk-thesis-impact-button').dataset.symbol = ticker;
            ongoingDiligenceContainer.querySelector('#analyze-eightk-thesis-impact-button').dataset.symbol = ticker;


            // Render the log initially using the cached reports
            const ongoingReports = getReportsFromCache(ticker, ONGOING_DILIGENCE_REPORT_TYPES); // Use constant and cache
            renderOngoingReviewLog(logContainer, ongoingReports);

             // Ensure thesis impact buttons are hidden initially (redundant due to _resetAnalysisModal, but safe)
            ongoingDiligenceContainer.querySelectorAll('.analyze-thesis-impact-button').forEach(btn => btn.classList.add('hidden'));
            ongoingDiligenceContainer.querySelector('#updated-memo-section').classList.add('hidden'); // Ensure updated memo section is hidden
            ongoingDiligenceContainer.querySelector('#review-form-container').classList.add('hidden'); // Ensure review form is hidden
            ongoingDiligenceContainer.querySelector('#filing-diligence-input-container').classList.add('hidden'); // Ensure filing input is hidden
            ongoingDiligenceContainer.querySelector('#ongoing-review-actions').classList.remove('hidden'); // Ensure action buttons are shown
        }

        // --- POSITION ANALYSIS TAB ---
        const positionAnalysisTab = document.getElementById('position-analysis-tab');
        const positionAnalysisTabButton = document.querySelector('.tab-button[data-tab="position-analysis"]');
        const portfolioData = state.portfolioCache.find(s => s.ticker === ticker);
        if (positionAnalysisTab && positionAnalysisTabButton && portfolioData && (portfolioData.transactions?.length > 0 || portfolioData.shares > 0)) {
            positionAnalysisTabButton.classList.remove('hidden');
            const helpIconHtmlPos = `<button data-report-type="PositionAnalysis" class="ai-help-button p-1 rounded-full hover:bg-indigo-100" title="What is this?"><svg class="w-5 h-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg></button>`;
            positionAnalysisTab.innerHTML = `
                <div id="report-status-container-position" class="hidden p-3 mb-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between gap-4"></div>
                <div id="position-analysis-content-container">
                    <div class="text-center p-8 bg-gray-50 rounded-lg">
                        <div class="flex justify-center items-center gap-2 mb-2"> <h3 class="text-xl font-bold text-gray-800">Position Review</h3> ${helpIconHtmlPos} </div>
                        <p class="text-gray-600 mb-6 max-w-2xl mx-auto">Re-evaluate the original GARP thesis for this holding based on your actual cost basis and the current market price.</p>
                        <button id="generate-position-analysis-button" data-symbol="${ticker}" data-report-type="PositionAnalysis" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg text-base shadow-md transition-transform hover:scale-105"> Generate Position Analysis </button>
                    </div>
                    <div id="position-analysis-report-container" class="prose max-w-none mt-6"></div>
                </div>`;
        }

        // --- RAW DATA TAB ---
        const rawDataTab = document.getElementById('raw-data-tab');
        if (rawDataTab) {
            const rawDataContainer = rawDataTab.querySelector('#raw-data-accordion-container');
            let rawDataAccordionHtml = '';
            if (groupedFmpData) {
                const sortedKeys = Object.keys(groupedFmpData).sort();
                for (const key of sortedKeys) {
                    rawDataAccordionHtml += `<details class="mb-2 bg-white rounded-lg border"><summary class="p-3 font-semibold text-gray-700 cursor-pointer hover:bg-gray-50">${key.replace(/_/g, ' ')}</summary><pre class="text-xs whitespace-pre-wrap break-all bg-gray-900 text-white p-3 rounded-b-lg">${JSON.stringify(groupedFmpData[key], null, 2)}</pre></details>`;
                }
                rawDataContainer.innerHTML = rawDataAccordionHtml;
            } else {
                 rawDataContainer.innerHTML = '<p class="text-center text-gray-500 py-8">Could not load grouped raw data.</p>';
            }
        }

    } catch (error) {
        console.error('Error opening raw data viewer:', error);
        titleEl.textContent = `Error Loading Data for ${ticker}`;
        const errorMsgHtml = `<p class="text-red-500 text-center p-4">${error.message}</p>`;
        ['dashboard-tab', 'ai-analysis-tab', 'diligence-hub-tab', 'ongoing-diligence-tab', 'position-analysis-tab', 'raw-data-tab'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = errorMsgHtml;
        });
    }
}
