// fileName: ui-handlers.js
import { CONSTANTS, state, promptMap, ANALYSIS_REQUIREMENTS, ANALYSIS_NAMES, SECTOR_KPI_SUGGESTIONS, STRUCTURED_DILIGENCE_QUESTIONS, QUALITATIVE_DILIGENCE_QUESTIONS, QUARTERLY_REVIEW_QUESTIONS, ANNUAL_REVIEW_QUESTIONS } from './config.js';
import { callApi, callGeminiApi, generateRefinedArticle, generatePolishedArticleForSynthesis, getFmpStockData, extractSynthesisData } from './api.js';
import { openModal, closeModal, displayMessageInModal, openConfirmationModal, openManageStockModal, addKpiRow, addDiligenceEntryRow } from './ui-modals.js';
import { renderPortfolioManagerList, displayReport, updateReportStatus, fetchAndCachePortfolioData, updateGarpCandidacyStatus, renderCandidacyAnalysis, renderGarpAnalysisSummary, renderDiligenceLog, renderPeerComparisonTable, renderSectorMomentumHeatMap, renderOngoingReviewLog } from './ui-render.js';
import { _calculateMoatAnalysisMetrics, _calculateCapitalAllocatorsMetrics, _calculateGarpScorecardMetrics, CALCULATION_SUMMARIES } from './analysis-helpers.js';

// --- UTILITY HELPERS ---
function getReportsFromCache(ticker, reportType) {
    if (!Array.isArray(state.reportCache)) return [];

    const filterFn = (r) => {
        if (r.ticker !== ticker) return false;
        if (Array.isArray(reportType)) {
            return reportType.includes(r.reportType);
        }
        return r.reportType === reportType;
    };

    const reports = state.reportCache.filter(filterFn);

    return reports.sort((a, b) => b.savedAt.toMillis() - a.savedAt.toMillis());
}

export async function getSavedReports(ticker, reportType) {
    // This function is now primarily for fetching reports when the cache might not be populated, like on initial load.
    try {
        const reportsRef = state.db.collection(CONSTANTS.DB_COLLECTION_AI_REPORTS);
        let q;
        if (Array.isArray(reportType)) {
             q = reportsRef.where("ticker", "==", ticker).where("reportType", "in", reportType).orderBy("savedAt", "desc");
        } else {
             q = reportsRef.where("ticker", "==", ticker).where("reportType", "==", reportType).orderBy("savedAt", "desc");
        }
        const querySnapshot = await q.get();
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching saved reports:", error);
        return [];
    }
}

function buildAnalysisPayload(fullData, requiredEndpoints) {
    const payload = {};
    for (const endpointName of requiredEndpoints) {
        if (fullData.hasOwnProperty(endpointName)) {
            payload[endpointName] = fullData[endpointName];
        }
    }
    return payload;
}

// *** UPDATED List of report types to include in ongoing diligence log ***
const ONGOING_DILIGENCE_REPORT_TYPES = [
    'FilingDiligence', // Manual Q&A saved
    'EightKAnalysis',
    'EightKThesisImpact',
    'TenQAnalysis',         // NEW
    'TenQThesisImpact',     // NEW
    'TenKAnalysis',         // NEW
    'TenKThesisImpact',     // NEW
    'UpdatedGarpMemo',
    'UpdatedQarpMemo',
    'QuarterlyReview',
    'AnnualReview'
];

async function autoSaveReport(ticker, reportType, content, prompt, diligenceQuestions = null, synthesisData = null) {
    try {
        const reportTypesToPreserve = [
            'DiligenceInvestigation', // Manual diligence entries
            ...ONGOING_DILIGENCE_REPORT_TYPES // Preserve all ongoing logs
        ];

        if (!reportTypesToPreserve.includes(reportType)) {
            // Remove existing non-preserved reports of the same type from the local cache first
            state.reportCache = state.reportCache.filter(r => r.reportType !== reportType || r.ticker !== ticker);

            // Delete from Firestore
            const reportsRef = state.db.collection(CONSTANTS.DB_COLLECTION_AI_REPORTS);
            const q = reportsRef.where("ticker", "==", ticker).where("reportType", "==", reportType);
            const querySnapshot = await q.get();

            const deletePromises = [];
            querySnapshot.forEach(doc => {
                deletePromises.push(doc.ref.delete());
            });

            if (deletePromises.length > 0) {
                await Promise.all(deletePromises);
                console.log(`Deleted ${deletePromises.length} old report(s) of type ${reportType} for ${ticker}.`);
            }
        }

        const reportData = {
            ticker,
            reportType,
            content,
            prompt: prompt || '',
            savedAt: firebase.firestore.Timestamp.now(),
            diligenceQuestions: diligenceQuestions,
            ...(synthesisData && { synthesis_data: synthesisData })
        };

        const docRef = await state.db.collection(CONSTANTS.DB_COLLECTION_AI_REPORTS).add(reportData);

        // Add the newly saved report to the front of the local cache
        state.reportCache.unshift({ id: docRef.id, ...reportData });

        console.log(`${reportType} for ${ticker} was auto-saved successfully.`);
    } catch (error) {
        console.error(`Auto-save for ${reportType} failed:`, error);
        displayMessageInModal(`The ${reportType} report was generated but failed to auto-save. You can still save it manually. Error: ${error.message}`, 'warning');
    }
}

// --- FMP API INTEGRATION & MANAGEMENT ---
export async function handleRefreshFmpData(symbol) {
    if (!state.fmpApiKey) {
        displayMessageInModal("Financial Modeling Prep API Key is required for this feature.", "warning");
        return;
    }

    openModal(CONSTANTS.MODAL_LOADING);
    const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);
    loadingMessage.textContent = `Fetching all FMP data for ${symbol}...`;

    try {
        const coreEndpoints = [
            { name: 'profile', path: 'profile', version: 'v3' },
            { name: 'income_statement_annual', path: 'income-statement', params: 'period=annual&limit=10', version: 'v3' },
            { name: 'balance_sheet_statement_annual', path: 'balance-sheet-statement', params: 'period=annual&limit=10', version: 'v3' },
            { name: 'cash_flow_statement_annual', path: 'cash-flow-statement', params: 'period=annual&limit=10', version: 'v3' },
            { name: 'key_metrics_annual', path: 'key-metrics', params: 'period=annual&limit=10', version: 'v3' },
            { name: 'ratios_annual', path: 'ratios', params: 'period=annual&limit=10', version: 'v3' },
            { name: 'key_metrics_ttm', path: 'key-metrics-ttm', version: 'v3' },
            { name: 'ratios_ttm', path: 'ratios-ttm', version: 'v3' },
            { name: 'income_statement_quarterly', path: 'income-statement', params: 'period=quarter&limit=12', version: 'v3' },
            { name: 'stock_grade_news', path: 'grade', version: 'v3' },
            { name: 'analyst_estimates', path: 'analyst-estimates', params: 'period=annual', version: 'stable'},
            { name: 'earning_calendar', path: 'earnings', version: 'stable' },
        ];

        let successfulFetches = 0;

        for (const endpoint of coreEndpoints) {
            loadingMessage.textContent = `Fetching FMP Data: ${endpoint.name.replace(/_/g, ' ')}...`;

            let url;
            const version = endpoint.version || 'v3';

            if (version === 'stable') {
                url = `https://financialmodelingprep.com/stable/${endpoint.path}?symbol=${symbol}&${endpoint.params ? endpoint.params + '&' : ''}apikey=${state.fmpApiKey}`;
            } else {
                url = `https://financialmodelingprep.com/api/${version}/${endpoint.path}/${symbol}?${endpoint.params ? endpoint.params + '&' : ''}apikey=${state.fmpApiKey}`;
            }

            const data = await callApi(url);

            if (!data || (Array.isArray(data) && data.length === 0)) {
                console.warn(`No data returned from FMP for core endpoint: ${endpoint.name}`);
                continue;
            }

            const docRef = state.db.collection(CONSTANTS.DB_COLLECTION_FMP_CACHE).doc(symbol).collection('endpoints').doc(endpoint.name);
            await docRef.set({ cachedAt: firebase.firestore.Timestamp.now(), data: data });
            successfulFetches++;
        }

        displayMessageInModal(`Successfully fetched and updated data for ${successfulFetches} FMP endpoint(s).`, 'info');
        await fetchAndCachePortfolioData();

    } catch (error) {
        console.error("Error fetching FMP data:", error);
        displayMessageInModal(`Could not fetch FMP data: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

// --- PORTFOLIO & DASHBOARD MANAGEMENT ---

export async function handleSectorMomentumRequest() {
    // ... (content unchanged)
}

export function handleKpiSuggestionRequest() {
    // ... (content unchanged)
}


export async function handleSaveStock(e) {
    // ... (content unchanged)
}

export async function handleDeleteStock(ticker) {
    // ... (content unchanged)
}

// --- CORE STOCK RESEARCH LOGIC ---

export async function handleResearchSubmit(e) {
    // ... (content unchanged)
}

// --- AI ANALYSIS REPORT GENERATORS ---
export function handleWorkflowHelpRequest() {
    // ... (content unchanged)
}

export async function handleReportHelpRequest(reportType) {
    // ... (content unchanged)
}

export async function handlePositionAnalysisRequest(ticker, forceNew = false) {
    // ... (content unchanged)
}

export async function handlePortfolioGarpAnalysisRequest() {
    // ... (content unchanged)
}

export async function handleSaveReportToDb() {
    // ... (content unchanged)
}

export async function handleGarpCandidacyRequest(ticker, forceNew = false) {
    // ... (content unchanged)
}

export async function handleAnalysisRequest(symbol, reportType, promptConfig, forceNew = false) {
    // ... (content unchanged)
}

export async function handleGarpMemoRequest(symbol, forceNew = false) {
    // ... (content unchanged)
}

export async function handleCompounderMemoRequest(symbol, forceNew = false) {
    // ... (content unchanged)
}

export async function handleBmqvMemoRequest(symbol, forceNew = false) {
    // ... (content unchanged)
}

export async function handleFinalThesisRequest(symbol, forceNew = false) {
    // ... (content unchanged)
}

export async function handleUpdatedFinalThesisRequest(symbol, forceNew = false) {
    // ... (content unchanged)
}

export async function handleGeneratePrereqsRequest(symbol) {
    // ... (content unchanged)
}

export async function handleDiligenceMemoRequest(symbol, reportType, forceNew = false) {
    // ... (content unchanged)
}

export async function handleInvestigationSummaryRequest(symbol, forceNew = false) {
    // ... (content unchanged)
}


export async function handleSaveDiligenceAnswers(symbol, diligenceType) {
    // ... (content unchanged)
}


export async function handleManualDiligenceSave(symbol) {
    // ... (content unchanged)
}

export async function handleDeleteAllDiligenceAnswers(symbol) {
    // ... (content unchanged)
}

export async function handleDeleteOldDiligenceLogs(symbol) {
    // ... (content unchanged)
}


export async function handleSaveFilingDiligenceRequest(symbol) {
    const formContainer = document.getElementById('filing-diligence-form-container');
    const qaPairs = formContainer.querySelectorAll('.filing-qa-pair');

    let reportContent = '';
    qaPairs.forEach(pair => {
        const question = pair.querySelector('.filing-question-text').textContent;
        const answer = pair.querySelector('.filing-answer-textarea').value.trim();

        if (answer) {
            reportContent += `## ${question}\n\n${answer}\n\n---\n\n`;
        }
    });

    if (!reportContent) {
        displayMessageInModal("Please answer at least one question before saving.", "warning");
        return;
    }

    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Saving your diligence answers...`;

    try {
        const reportType = 'FilingDiligence'; // Kept for saving manually entered Q&A
        const prompt = `User-answered diligence questions from SEC filing for ${symbol} saved on ${new Date().toLocaleDateString()}`;
        await autoSaveReport(symbol, reportType, reportContent, prompt);

        // Reset UI
        formContainer.innerHTML = '';
        formContainer.classList.add('hidden');
        document.getElementById('filing-diligence-input-container').classList.remove('hidden');
        document.getElementById('filing-diligence-textarea').value = '';

        // Refresh log
        const logContainer = document.getElementById('ongoing-review-log-container');
        // *** UPDATED to use shared constant ***
        const savedReports = getReportsFromCache(symbol, ONGOING_DILIGENCE_REPORT_TYPES);
        renderOngoingReviewLog(logContainer, savedReports);

        // Show update memo section
        document.getElementById('updated-memo-section').classList.remove('hidden');

        displayMessageInModal('Your filing diligence Q&A has been saved successfully.', 'info');
    } catch (error) {
        console.error("Error saving filing diligence:", error);
        displayMessageInModal(`Could not save your answers: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

// *** DEPRECATED/REMOVED FUNCTION ***
// export async function handleGenerateFilingQuestionsRequest(symbol) { ... }

// --- NEW/UPDATED Filing Analysis Handlers ---

// Generic helper for analyzing filings (10-Q, 10-K, 8-K)
async function _handleAnalyzeFilingRequest(symbol, reportType, promptConfig) {
    const filingTextarea = document.getElementById('filing-diligence-textarea');
    const filingText = filingTextarea.value.trim();
    if (!filingText) {
        displayMessageInModal(`Please paste the ${reportType.replace('Analysis', '')} filing text into the text area first.`, "warning");
        return;
    }

    openModal(CONSTANTS.MODAL_LOADING);
    const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);
    loadingMessage.textContent = `AI is summarizing the ${reportType.replace('Analysis', '')} filing...`;

    try {
        const profile = state.portfolioCache.find(s => s.ticker === symbol);
        const companyName = profile ? profile.companyName : symbol;

        // Extract period/year for titles if possible (simple extraction)
        let period = '';
        const quarterMatch = filingText.match(/QUARTERLY REPORT.*?(\bQ[1-4]\b.*?)(?:ending|ended|for)/i);
        const yearMatch = filingText.match(/(?:for the fiscal year ended|fiscal year)(.*?)(?:20\d{2})/i);
        if (quarterMatch) period = quarterMatch[1].trim();
        else if (yearMatch) period = `FY ${yearMatch[1].trim()}`;

        const prompt = promptConfig.prompt
            .replace('{companyName}', companyName)
            .replace('{Period}', period) // For 10-Q title
            .replace('{Year}', period) // For 10-K title
            .replace('{filingText}', filingText);

        const analysisResult = await generateRefinedArticle(prompt);

        await autoSaveReport(symbol, reportType, analysisResult, prompt);

        filingTextarea.value = ''; // Clear textarea after successful analysis

        // Refresh the log
        const logContainer = document.getElementById('ongoing-review-log-container');
        // *** UPDATED to use shared constant ***
        const savedReports = getReportsFromCache(symbol, ONGOING_DILIGENCE_REPORT_TYPES);
        renderOngoingReviewLog(logContainer, savedReports);

        // Optionally display the generated report
        const displayContainer = document.getElementById('ongoing-review-display-container');
        if (displayContainer) {
            displayReport(displayContainer, analysisResult, prompt);
            // Add dataset attribute to track displayed report
             const newReport = getReportsFromCache(symbol, reportType)[0];
             if(newReport) displayContainer.dataset.displayingReportId = newReport.id;
        }

        displayMessageInModal(`${reportType.replace('Analysis', '')} Summary saved to the log.`, 'info');

        // Show thesis impact button for the generated report type
        document.querySelectorAll('.analyze-thesis-impact-button').forEach(btn => btn.classList.add('hidden')); // Hide all first
        const impactButton = document.getElementById(`analyze-${reportType.toLowerCase().replace('analysis', '')}-thesis-impact-button`);
        if (impactButton) {
            impactButton.classList.remove('hidden');
        }


    } catch (error) {
        console.error(`Error analyzing ${reportType.replace('Analysis', '')} filing:`, error);
        displayMessageInModal(`Could not complete ${reportType.replace('Analysis', '')} summary: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

// Specific handlers calling the generic helper
export async function handleAnalyzeTenQRequest(symbol) {
    await _handleAnalyzeFilingRequest(symbol, 'TenQAnalysis', promptMap['TenQAnalysis']);
}

export async function handleAnalyzeTenKRequest(symbol) {
    await _handleAnalyzeFilingRequest(symbol, 'TenKAnalysis', promptMap['TenKAnalysis']);
}

export async function handleAnalyzeEightKRequest(symbol) {
    await _handleAnalyzeFilingRequest(symbol, 'EightKAnalysis', promptMap['EightKAnalysis']);
}

// --- NEW/UPDATED Thesis Impact Handlers ---

// Generic helper for analyzing thesis impact (10-Q, 10-K, 8-K)
async function _handleThesisImpactRequest(symbol, analysisReportType, impactReportType, promptConfig) {
    openModal(CONSTANTS.MODAL_LOADING);
    const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);
    loadingMessage.textContent = `Analyzing ${analysisReportType.replace('Analysis', '')} impact on thesis for ${symbol}...`;

    try {
        // 1. Get the latest Filing Summary
        const filingSummaries = getReportsFromCache(symbol, analysisReportType);
        if (filingSummaries.length === 0) {
            throw new Error(`The '${ANALYSIS_NAMES[analysisReportType]}' must be generated first.`);
        }
        const latestFilingSummary = filingSummaries[0];

        // 2. Get the latest Updated Final Thesis
        const updatedThesisReports = getReportsFromCache(symbol, 'UpdatedFinalThesis');
        if (updatedThesisReports.length === 0) {
            throw new Error(`The 'Updated Final Thesis' report was not found. Please generate it first.`);
        }
        const latestUpdatedThesisContent = updatedThesisReports[0].content;

        // 3. Construct the prompt
        const profile = state.portfolioCache.find(s => s.ticker === symbol) || {};
        const companyName = profile.companyName || symbol;

        let prompt;
        // Adjust placeholder based on report type
        if (analysisReportType === 'EightKAnalysis') {
            prompt = promptConfig.prompt
                .replace(/{companyName}/g, companyName)
                .replace(/{tickerSymbol}/g, symbol)
                .replace('{eightKSummary}', latestFilingSummary.content) // Specific placeholder for 8K
                .replace('{originalThesis}', latestUpdatedThesisContent);
        } else { // For 10-Q and 10-K
            prompt = promptConfig.prompt
                .replace(/{companyName}/g, companyName)
                .replace(/{tickerSymbol}/g, symbol)
                .replace('{filingSummary}', latestFilingSummary.content) // Generic placeholder
                .replace('{originalThesis}', latestUpdatedThesisContent);
        }


        // 4. Call AI
        loadingMessage.textContent = `AI is comparing ${analysisReportType.replace('Analysis', '')} findings to your updated thesis...`;
        const impactAnalysisResult = await generateRefinedArticle(prompt);

        // 5. Save the report
        await autoSaveReport(symbol, impactReportType, impactAnalysisResult, prompt);

        // 6. Update UI
        const logContainer = document.getElementById('ongoing-review-log-container');
        // *** UPDATED to use shared constant ***
        const savedReports = getReportsFromCache(symbol, ONGOING_DILIGENCE_REPORT_TYPES);
        renderOngoingReviewLog(logContainer, savedReports);

        // Display the newly generated report
        const displayContainer = document.getElementById('ongoing-review-display-container');
        if (displayContainer) {
            displayReport(displayContainer, impactAnalysisResult, prompt);
             const newReport = getReportsFromCache(symbol, impactReportType)[0];
             if(newReport) displayContainer.dataset.displayingReportId = newReport.id;
        }

        displayMessageInModal(`${impactReportType.replace('ThesisImpact','')} Thesis Impact analysis saved to the log.`, 'info');

    } catch (error) {
        console.error(`Error generating ${impactReportType.replace('ThesisImpact','')} Thesis Impact analysis:`, error);
        displayMessageInModal(`Could not complete thesis impact analysis: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

// Specific handlers calling the generic helper
export async function handleTenQThesisImpactRequest(symbol) {
    await _handleThesisImpactRequest(symbol, 'TenQAnalysis', 'TenQThesisImpact', promptMap['TenQThesisImpact']);
}

export async function handleTenKThesisImpactRequest(symbol) {
    await _handleThesisImpactRequest(symbol, 'TenKAnalysis', 'TenKThesisImpact', promptMap['TenKThesisImpact']);
}

export async function handleEightKThesisImpactRequest(symbol) {
    await _handleThesisImpactRequest(symbol, 'EightKAnalysis', 'EightKThesisImpact', promptMap['EightKThesisImpact']);
}

// --- END NEW Filing Analysis Handlers ---


export async function handleDeleteFilingDiligenceLog(reportId, ticker) {
    openConfirmationModal(
        'Delete Log Entry?',
        'Are you sure you want to permanently delete this entry from the Ongoing Diligence Log? This action cannot be undone.',
        async () => {
            openModal(CONSTANTS.MODAL_LOADING);
            document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Deleting entry...`;
            try {
                await state.db.collection(CONSTANTS.DB_COLLECTION_AI_REPORTS).doc(reportId).delete();

                // Update local cache
                state.reportCache = state.reportCache.filter(r => r.id !== reportId);

                // Re-render the log
                const logContainer = document.getElementById('ongoing-review-log-container');
                const displayContainer = document.getElementById('ongoing-review-display-container');
                // *** UPDATED to use shared constant ***
                const savedReports = getReportsFromCache(ticker, ONGOING_DILIGENCE_REPORT_TYPES);
                renderOngoingReviewLog(logContainer, savedReports);

                // Clear display if the deleted report was showing
                if (displayContainer && displayContainer.dataset.displayingReportId === reportId) {
                    displayContainer.innerHTML = '';
                    delete displayContainer.dataset.displayingReportId;
                    // Hide all thesis impact buttons after deleting the source
                    document.querySelectorAll('.analyze-thesis-impact-button').forEach(btn => btn.classList.add('hidden'));
                }

                displayMessageInModal('Log entry deleted.', 'info');
            } catch (error) {
                console.error("Error deleting log entry:", error);
                displayMessageInModal(`Could not delete entry: ${error.message}`, 'error');
            } finally {
                closeModal(CONSTANTS.MODAL_LOADING);
            }
        }
    );
}

async function generateUpdatedMemo(symbol, memoType) {
    const updatedMemoContainer = document.getElementById('updated-memo-container');
    if (!updatedMemoContainer) return;
    updatedMemoContainer.innerHTML = `<div class="p-4 text-center">Generating updated ${memoType} memo... <div class="loader mx-auto mt-2"></div></div>`;

    let reportType;
    let promptTemplate;

    if (memoType === 'QARP') {
        reportType = 'UpdatedQarpMemo';
        promptTemplate = promptMap.UpdatedQarpMemo.prompt;
    } else { // Default to GARP
        reportType = 'UpdatedGarpMemo';
        promptTemplate = promptMap.InvestmentMemo.prompt; // Use standard GARP structure
    }

    try {
        // Gather ALL relevant logs
        const filingDiligenceReports = getReportsFromCache(symbol, 'FilingDiligence'); // Manual Q&A
        const diligenceInvestigationReports = getReportsFromCache(symbol, 'DiligenceInvestigation'); // Old manual entries
        const eightKReports = getReportsFromCache(symbol, 'EightKAnalysis');
        const eightKImpactReports = getReportsFromCache(symbol, 'EightKThesisImpact');
        const tenQReports = getReportsFromCache(symbol, 'TenQAnalysis'); // NEW
        const tenQImpactReports = getReportsFromCache(symbol, 'TenQThesisImpact'); // NEW
        const tenKReports = getReportsFromCache(symbol, 'TenKAnalysis'); // NEW
        const tenKImpactReports = getReportsFromCache(symbol, 'TenKThesisImpact'); // NEW

        let combinedDiligenceLog = '';
        const logs = [];

        // Helper to add logs chronologically if they exist
        const addLogEntry = (reports, titlePrefix) => {
            if (reports.length > 0) {
                logs.push(...reports.map(report => ({
                    date: report.savedAt.toDate(),
                    text: `**${titlePrefix} (${report.savedAt.toDate().toLocaleDateString()}):**\n${report.content}`
                })));
            }
        };
        const addInvestigationLogEntry = (reports) => {
             if (reports.length > 0) {
                logs.push(...reports.map(report => {
                    const question = report.prompt.split('Diligence Question from User:')[1]?.trim() || 'Question not found.';
                    const answer = report.content;
                    return {
                         date: report.savedAt.toDate(),
                         text: `**Manual Q&A (${report.savedAt.toDate().toLocaleDateString()}):**\n*Question:* ${question}\n*Answer:* ${answer}`
                     };
                }));
            }
        }

        addLogEntry(filingDiligenceReports, 'Manual Filing Q&A');
        addInvestigationLogEntry(diligenceInvestigationReports); // Add old manual logs
        addLogEntry(eightKReports, '8-K Summary');
        addLogEntry(eightKImpactReports, '8-K Thesis Impact');
        addLogEntry(tenQReports, '10-Q Summary'); // NEW
        addLogEntry(tenQImpactReports, '10-Q Thesis Impact'); // NEW
        addLogEntry(tenKReports, '10-K Summary'); // NEW
        addLogEntry(tenKImpactReports, '10-K Thesis Impact'); // NEW

        // Sort logs by date descending and join
        combinedDiligenceLog = logs
            .sort((a, b) => b.date - a.date)
            .map(log => log.text)
            .join('\n\n---\n\n') || 'No recent diligence logs available.';


        // Fetch current scorecard data
        const data = await getFmpStockData(symbol);
        if (!data) throw new Error(`Could not retrieve financial data for ${symbol}.`);
        const scorecardData = _calculateGarpScorecardMetrics(data);

        const profile = data.profile?.[0] || {};
        const companyName = profile.companyName || 'the company';

        let prompt;
        if (memoType === 'QARP') {
             prompt = promptTemplate
                .replace(/{companyName}/g, companyName)
                .replace(/{tickerSymbol}/g, symbol)
                .replace('{jsonData}', JSON.stringify(scorecardData, null, 2))
                .replace('{diligenceLog}', combinedDiligenceLog); // Pass combined log
        } else { // GARP
            const candidacyReports = getReportsFromCache(symbol, 'GarpCandidacy');
            const structuredMemoReports = getReportsFromCache(symbol, 'StructuredDiligenceMemo');
            const qualitativeMemoReports = getReportsFromCache(symbol, 'QualitativeDiligenceMemo');
            // Market Sentiment Memo removed

            if (candidacyReports.length === 0) throw new Error(`The foundational 'GARP Analysis Report' must be generated first.`);
            if (structuredMemoReports.length === 0 || qualitativeMemoReports.length === 0) {
                throw new Error("Missing prerequisite diligence memos (Structured or Qualitative) required for GARP Memo synthesis.");
            }

            const candidacyReportContent = (candidacyReports[0].content || '').split('## Actionable Diligence Questions')[0].trim();

            prompt = promptTemplate // Using UPDATED_GARP_MEMO_PROMPT structure
                .replace(/{companyName}/g, companyName)
                .replace(/{tickerSymbol}/g, symbol)
                .replace('{scorecardJson}', JSON.stringify(scorecardData, null, 2))
                .replace('{garpCandidacyReport}', candidacyReportContent)
                .replace('{structuredDiligenceMemo}', structuredMemoReports[0].content)
                .replace('{qualitativeDiligenceMemo}', qualitativeMemoReports[0].content)
                .replace('{marketSentimentMemo}', ''); // Replace removed placeholder
            // Note: Updated GARP Memo doesn't explicitly use the combined log like QARP does. We could modify its prompt if needed.
        }

        const memoContent = await generateRefinedArticle(prompt);

        await autoSaveReport(symbol, reportType, memoContent, prompt);

        updatedMemoContainer.innerHTML = `<div class="prose max-w-none">${marked.parse(memoContent)}</div>`;
        displayMessageInModal(`Updated ${memoType} Memo generated and saved.`, 'info');

        // Refresh log
        const logContainer = document.getElementById('ongoing-review-log-container');
        // *** UPDATED to use shared constant ***
        const savedReports = getReportsFromCache(symbol, ONGOING_DILIGENCE_REPORT_TYPES);
        renderOngoingReviewLog(logContainer, savedReports);

    } catch(error) {
        console.error(`Error generating updated ${memoType} memo:`, error);
        updatedMemoContainer.innerHTML = `<p class="text-red-500">${error.message}</p>`;
    }
}

export async function handleGenerateUpdatedGarpMemoRequest(symbol) {
    await generateUpdatedMemo(symbol, 'GARP');
}

export async function handleGenerateUpdatedQarpMemoRequest(symbol) {
    await generateUpdatedMemo(symbol, 'QARP');
}


export async function handleDeleteDiligenceLog(reportId, ticker) {
    // ... (content unchanged - handles 'DiligenceInvestigation' type only)
}

async function _fetchAndCachePeerData(tickers) {
    // ... (content unchanged)
}


async function runPeerAnalysis(primaryTicker, peerTickers) {
    // ... (content unchanged)
}

export async function handleManualPeerAnalysisRequest(ticker) {
    // ... (content unchanged)
}

export async function handleCopyReportRequest(symbol, reportType, buttonElement) {
    // ... (content unchanged)
}

export async function handleFullAnalysisWorkflow(symbol) {
    // ... (content unchanged - MarketSentimentMemo removed)
}

async function _handleReviewRequest(symbol, reviewType) {
    openModal(CONSTANTS.MODAL_LOADING);
    const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);

    try {
        const reportType = reviewType === 'Quarterly' ? 'QuarterlyReview' : 'AnnualReview';
        const questions = reviewType === 'Quarterly' ? QUARTERLY_REVIEW_QUESTIONS : ANNUAL_REVIEW_QUESTIONS;
        const promptConfig = promptMap[reportType];

        loadingMessage.textContent = 'Gathering your findings...';
        const answerElements = document.querySelectorAll('.review-answer-textarea');
        const qaPairs = [];
        let hasAnswers = false;

        answerElements.forEach(textarea => {
            const answer = textarea.value.trim();
            const questionKey = textarea.dataset.questionKey;
            const question = questions[questionKey];
            if (question) {
                qaPairs.push({ question: `${questionKey}: ${question}`, answer });
                if (answer) hasAnswers = true;
            }
        });

        if (!hasAnswers) {
            throw new Error(`Please provide at least one answer for the ${reviewType} Review before generating the memo.`);
        }

        loadingMessage.textContent = 'Retrieving original investment thesis...';
        const memoReports = getReportsFromCache(symbol, ['InvestmentMemo', 'UpdatedGarpMemo']);
        let originalInvestmentMemo;
        if (memoReports.length > 0) {
            originalInvestmentMemo = memoReports[0].content;
        } else {
            const candidacyReports = getReportsFromCache(symbol, 'GarpCandidacy');
            if (candidacyReports.length === 0) {
                throw new Error("The foundational 'GARP Analysis Report' or 'Investment Memo' must be generated first to serve as the baseline thesis.");
            }
            originalInvestmentMemo = (candidacyReports[0].content || '').split('## Actionable Diligence Questions')[0].trim();
        }

        const qaData = qaPairs.map(pair => `**Question:** ${pair.question}\n\n**Answer:**\n${pair.answer}`).join('\n\n---\n\n');

        const profile = state.portfolioCache.find(s => s.ticker === symbol) || {};
        const companyName = profile.companyName || symbol;

        const prompt = promptConfig.prompt
            .replace(/{companyName}/g, companyName)
            .replace(/{tickerSymbol}/g, symbol)
            .replace('{originalInvestmentMemo}', originalInvestmentMemo)
            .replace('{qaData}', qaData);

        loadingMessage.textContent = `AI is synthesizing your ${reviewType} Review Memo...`;
        const memoContent = await generateRefinedArticle(prompt);

        await autoSaveReport(symbol, reportType, memoContent, prompt);

        // Update UI
        const logContainer = document.getElementById('ongoing-review-log-container');
        // *** UPDATED to use shared constant ***
        const savedReports = getReportsFromCache(symbol, ONGOING_DILIGENCE_REPORT_TYPES);
        renderOngoingReviewLog(logContainer, savedReports);

        const displayContainer = document.getElementById('ongoing-review-display-container');
        if (displayContainer) {
            displayReport(displayContainer, memoContent, prompt);
             displayContainer.dataset.displayingReportId = savedReports.find(r => r.reportType === reportType)?.id; // Set ID for potential deletion check
        }


        const formContainer = document.getElementById('review-form-container');
        formContainer.innerHTML = '';
        formContainer.classList.add('hidden');
        document.getElementById('ongoing-review-actions').classList.remove('hidden');

        displayMessageInModal(`${reviewType} Review Memo saved to the log.`, 'info');

    } catch (error) {
        console.error(`Error handling ${reviewType} review request:`, error);
        displayMessageInModal(`Could not complete ${reviewType} review: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

export async function handleQuarterlyReviewRequest(symbol) {
    await _handleReviewRequest(symbol, 'Quarterly');
}

export async function handleAnnualReviewRequest(symbol) {
    await _handleReviewRequest(symbol, 'Annual');
}
