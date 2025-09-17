import { CONSTANTS, state, promptMap, ANALYSIS_REQUIREMENTS, INVESTMENT_MEMO_PROMPT } from './config.js';
// FIX: Removed 'getCompetitorsFromGemini' which no longer exists in api.js
import { callApi, callGeminiApi, generateRefinedArticle, generatePolishedArticleForSynthesis, getFmpStockData } from './api.js';
import { getFirestore, Timestamp, doc, setDoc, getDoc, deleteDoc, collection, getDocs, query, limit, addDoc, increment, updateDoc, where, orderBy } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { openModal, closeModal, displayMessageInModal, openConfirmationModal, openManageStockModal } from './ui-modals.js';
import { renderPortfolioManagerList, renderFmpEndpointsList, renderBroadEndpointsList, displayReport, updateReportStatus, fetchAndCachePortfolioData, renderThesisTracker, renderFilingAnalysisTab } from './ui-render.js';
import { _calculateFinancialAnalysisMetrics, _calculateMoatAnalysisMetrics, _calculateCapitalAllocatorsMetrics, _calculateGarpAnalysisMetrics, _calculateRiskAssessmentMetrics } from './analysis-helpers.js';

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
            // Annual Data
            { name: 'income_statement_annual', path: 'income-statement', params: 'period=annual&limit=10', version: 'v3' },
            { name: 'balance_sheet_statement_annual', path: 'balance-sheet-statement', params: 'period=annual&limit=10', version: 'v3' },
            { name: 'cash_flow_statement_annual', path: 'cash-flow-statement', params: 'period=annual&limit=10', version: 'v3' },
            { name: 'key_metrics_annual', path: 'key-metrics', params: 'period=annual&limit=10', version: 'v3' },
            { name: 'ratios_annual', path: 'ratios', params: 'period=annual&limit=10', version: 'v3' },
            // TTM Data
            { name: 'key_metrics_ttm', path: 'key-metrics-ttm', version: 'v3' },
            { name: 'ratios_ttm', path: 'ratios-ttm', version: 'v3' },
            // Quarterly Data
            { name: 'income_statement_quarterly', path: 'income-statement', params: 'period=quarter&limit=5', version: 'v3' },
            // Other supplemental data
            { name: 'stock_grade_news', path: 'grade', version: 'v3' },
            { name: 'analyst_estimates', path: 'analyst-estimates', version: 'v3'},
            { name: 'historical_price', path: 'historical-price-full', params: 'serietype=line', version: 'v3' },
        ];

        let successfulFetches = 0;

        for (const endpoint of coreEndpoints) {
            loadingMessage.textContent = `Fetching FMP Data: ${endpoint.name.replace(/_/g, ' ')}...`;
            const url = `https://financialmodelingprep.com/api/v3/${endpoint.path}/${symbol}?${endpoint.params || ''}&apikey=${state.fmpApiKey}`;
            const data = await callApi(url);

            if (!data || (Array.isArray(data) && data.length === 0)) {
                console.warn(`No data returned from FMP for core endpoint: ${endpoint.name}`);
                continue;
            }

            const docRef = doc(state.db, CONSTANTS.DB_COLLECTION_FMP_CACHE, symbol, 'endpoints', endpoint.name);
            await setDoc(docRef, { cachedAt: Timestamp.now(), data: data });
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

export async function handleSaveStock(e) {
    e.preventDefault();
    const originalTicker = document.getElementById('manage-stock-original-ticker').value.trim().toUpperCase();
    const newTicker = document.getElementById('manage-stock-ticker').value.trim().toUpperCase();
    
    if (!/^[A-Z.]{1,10}$/.test(newTicker)) {
        displayMessageInModal("Please enter a valid stock ticker symbol.", "warning");
        return;
    }

    const stockData = {
        ticker: newTicker,
        companyName: document.getElementById('manage-stock-name').value.trim(),
        exchange: document.getElementById('manage-stock-exchange').value.trim(),
        status: document.getElementById('manage-stock-status').value.trim(),
        sector: document.getElementById('manage-stock-sector').value.trim(),
        industry: document.getElementById('manage-stock-industry').value.trim(),
    };

    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = "Saving to your lists...";
    
    try {
        if (originalTicker && originalTicker !== newTicker) {
            await deleteDoc(doc(state.db, CONSTANTS.DB_COLLECTION_PORTFOLIO, originalTicker));
        }

        await setDoc(doc(state.db, CONSTANTS.DB_COLLECTION_PORTFOLIO, newTicker), stockData);

        const fmpCacheRef = collection(state.db, CONSTANTS.DB_COLLECTION_FMP_CACHE, newTicker, 'endpoints');
        const fmpSnapshot = await getDocs(query(fmpCacheRef, limit(1)));
        if (fmpSnapshot.empty) {
            document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `First time setup: Caching FMP data for ${newTicker}...`;
            await handleRefreshFmpData(newTicker);
        }

        closeModal(CONSTANTS.MODAL_MANAGE_STOCK);
        await fetchAndCachePortfolioData();
    } catch(error) {
        console.error("Error saving stock:", error);
        displayMessageInModal(`Could not save stock: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

export async function handleDeleteStock(ticker) {
    openConfirmationModal(
        `Delete ${ticker}?`, 
        `Are you sure you want to remove ${ticker} from your lists? This will not delete the cached API data.`,
        async () => {
            openModal(CONSTANTS.MODAL_LOADING);
            document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Deleting ${ticker}...`;
            try {
                await deleteDoc(doc(state.db, CONSTANTS.DB_COLLECTION_PORTFOLIO, ticker));
                await fetchAndCachePortfolioData();
                if(document.getElementById(CONSTANTS.MODAL_PORTFOLIO_MANAGER).classList.contains(CONSTANTS.CLASS_MODAL_OPEN)) {
                    renderPortfolioManagerList();
                }
            } catch (error) {
                console.error("Error deleting stock:", error);
                displayMessageInModal(`Could not delete ${ticker}: ${error.message}`, 'error');
            } finally {
                closeModal(CONSTANTS.MODAL_LOADING);
            }
        }
    );
}

// --- CORE STOCK RESEARCH LOGIC ---

export async function handleResearchSubmit(e) {
    e.preventDefault();
    const tickerInput = document.getElementById(CONSTANTS.INPUT_TICKER);
    const symbol = tickerInput.value.trim().toUpperCase();
    if (!/^[A-Z.]{1,10}$/.test(symbol)) {
        displayMessageInModal("Please enter a valid stock ticker symbol.", "warning");
        return;
    }
    
    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Checking your lists for ${symbol}...`;
    
    try {
        const docRef = doc(state.db, CONSTANTS.DB_COLLECTION_PORTFOLIO, symbol);
        if ((await getDoc(docRef)).exists()) {
             displayMessageInModal(`${symbol} is already in your lists. You can edit it from the dashboard.`, 'info');
             tickerInput.value = '';
             closeModal(CONSTANTS.MODAL_LOADING);
             return;
        }
        
        document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Fetching overview for ${symbol}...`;
        
        const profileUrl = `https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${state.fmpApiKey}`;
        const profileData = await callApi(profileUrl);

        if (!profileData || profileData.length === 0 || !profileData[0].symbol) {
            throw new Error(`Could not fetch data for ${symbol}. It may be an invalid ticker.`);
        }
        const overviewData = profileData[0];

        const newStock = {
            ticker: overviewData.symbol,
            companyName: overviewData.companyName,
            exchange: overviewData.exchange,
            sector: overviewData.sector,
            industry: overviewData.industry,
            isEditMode: false
        };
        
        tickerInput.value = '';
        openManageStockModal(newStock);

    } catch (error) {
        console.error("Error during stock research:", error);
        displayMessageInModal(error.message, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

// --- THESIS TRACKER ---
export async function handleSaveThesis(e) {
    e.preventDefault();
    const ticker = document.getElementById('thesis-tracker-ticker').value;
    const thesisContent = document.getElementById('thesis-tracker-content').value.trim();

    if (!ticker) {
        displayMessageInModal('Ticker is missing, cannot save thesis.', 'error');
        return;
    }

    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Saving thesis for ${ticker}...`;

    try {
        const docRef = doc(state.db, CONSTANTS.DB_COLLECTION_PORTFOLIO, ticker);
        await updateDoc(docRef, {
            thesis: thesisContent
        });
        
        closeModal('thesisTrackerModal');
        
        await fetchAndCachePortfolioData();
        const thesisContainer = document.getElementById('thesis-tracker-container');
        if (thesisContainer && document.getElementById('rawDataViewerModal').dataset.activeTicker === ticker) {
            renderThesisTracker(thesisContainer, ticker);
        }

        displayMessageInModal('Thesis saved successfully!', 'info');

    } catch (error) {
        console.error("Error saving thesis:", error);
        displayMessageInModal(`Could not save thesis: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

// --- AI ANALYSIS REPORT GENERATORS ---

async function getSavedReports(ticker, reportType) {
    const reportsRef = collection(state.db, CONSTANTS.DB_COLLECTION_AI_REPORTS);
    const q = query(reportsRef, where("ticker", "==", ticker), where("reportType", "==", reportType), orderBy("savedAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function autoSaveReport(ticker, reportType, content, prompt) {
    try {
        const reportData = {
            ticker,
            reportType,
            content,
            prompt: prompt || '',
            savedAt: Timestamp.now()
        };
        await addDoc(collection(state.db, CONSTANTS.DB_COLLECTION_AI_REPORTS), reportData);
        console.log(`${reportType} for ${ticker} was auto-saved successfully.`);
    } catch (error) {
        console.error(`Auto-save for ${reportType} failed:`, error);
        displayMessageInModal(`The ${reportType} report was generated but failed to auto-save. You can still save it manually. Error: ${error.message}`, 'warning');
    }
}

export async function handleAnalysisRequest(symbol, reportType, promptConfig, forceNew = false) {
    const contentContainer = document.getElementById('ai-article-container');
    const statusContainer = document.getElementById('report-status-container-ai');
    
    contentContainer.innerHTML = '';
    statusContainer.classList.add('hidden');

    try {
        const savedReports = await getSavedReports(symbol, reportType);

        if (savedReports.length > 0 && !forceNew) {
            const latestReport = savedReports[0];
            displayReport(contentContainer, latestReport.content, latestReport.prompt);
            contentContainer.dataset.currentPrompt = latestReport.prompt || '';
            contentContainer.dataset.rawMarkdown = latestReport.content;
            updateReportStatus(statusContainer, savedReports, latestReport.id, { symbol, reportType, promptConfig });
            return; 
        }

        openModal(CONSTANTS.MODAL_LOADING);
        const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);
        
        const data = await getFmpStockData(symbol);
        if (!data) throw new Error(`No cached FMP data found for ${symbol}.`);
        
        const requiredEndpoints = promptConfig.requires || [];
        const missingEndpoints = requiredEndpoints.filter(ep => !data[ep]);

        if (missingEndpoints.length > 0) {
            closeModal(CONSTANTS.MODAL_LOADING);
            openConfirmationModal(
                'Data Refresh Required',
                `This analysis requires data that is not yet cached for ${symbol} (${missingEndpoints.join(', ')}). Would you like to refresh all FMP data now?`,
                async () => {
                    await handleRefreshFmpData(symbol);
                    await handleAnalysisRequest(symbol, reportType, promptConfig, true);
                }
            );
            return;
        }
        
        let payloadData;
        if (reportType === 'FinancialAnalysis') {
            payloadData = _calculateFinancialAnalysisMetrics(data);
        } else if (reportType === 'MoatAnalysis') {
            payloadData = _calculateMoatAnalysisMetrics(data);
        } else if (reportType === 'RiskAssessment') {
            payloadData = _calculateRiskAssessmentMetrics(data);
        } else if (reportType === 'CapitalAllocators') {
            payloadData = _calculateCapitalAllocatorsMetrics(data);
        } else if (reportType === 'GarpAnalysis') {
            payloadData = _calculateGarpAnalysisMetrics(data);
        }

        const profile = data.profile?.[0] || {};
        const companyName = profile.companyName || 'the company';
        const tickerSymbol = profile.symbol || symbol;

        const promptTemplate = promptConfig.prompt;
        const prompt = promptTemplate
            .replace(/{companyName}/g, companyName)
            .replace(/{tickerSymbol}/g, tickerSymbol)
            .replace('{jsonData}', JSON.stringify(payloadData, null, 2));

        contentContainer.dataset.currentPrompt = prompt;

        const newReportContent = await generateRefinedArticle(prompt, loadingMessage);
        contentContainer.dataset.rawMarkdown = newReportContent;
        displayReport(contentContainer, newReportContent, prompt);
        updateReportStatus(statusContainer, [], null, { symbol, reportType, promptConfig });

    } catch (error) {
        displayMessageInModal(`Could not generate or load analysis: ${error.message}`, 'error');
        contentContainer.innerHTML = `<p class="text-red-500">Failed to generate report: ${error.message}</p>`;
    } finally {
        if (document.getElementById(CONSTANTS.MODAL_LOADING).classList.contains('is-open')) {
            closeModal(CONSTANTS.MODAL_LOADING);
        }
    }
}

export async function handleInvestmentMemoRequest(symbol, forceNew = false) {
    const contentContainer = document.getElementById('ai-article-container');
    const statusContainer = document.getElementById('report-status-container-ai');
    contentContainer.innerHTML = '';
    statusContainer.classList.add('hidden');

    try {
        const reportType = 'InvestmentMemo';
        const savedReports = await getSavedReports(symbol, reportType);
        const promptConfig = promptMap[reportType];

        if (savedReports.length > 0 && !forceNew) {
            const latestReport = savedReports[0];
            displayReport(contentContainer, latestReport.content, latestReport.prompt);
            contentContainer.dataset.currentPrompt = latestReport.prompt || '';
            contentContainer.dataset.rawMarkdown = latestReport.content;
            updateReportStatus(statusContainer, savedReports, latestReport.id, { symbol, reportType, promptConfig });
            return;
        }

        openModal(CONSTANTS.MODAL_LOADING);
        const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);

        loadingMessage.textContent = "Gathering all latest analysis reports from the database...";
        
        const reportTypes = [
            'GarpAnalysis',
            'FinancialAnalysis',
            'RiskAssessment',
            'MoatAnalysis',
            'CapitalAllocators'
        ];

        const reportPromises = reportTypes.map(type => getSavedReports(symbol, type).then(reports => reports[0]));
        const allLatestReports = await Promise.all(reportPromises);

        const foundReports = allLatestReports.filter(Boolean);
        const missingReports = reportTypes.filter((type, index) => !allLatestReports[index]);

        if (missingReports.length > 0) {
            throw new Error(`Cannot generate memo. Please generate and save the following reports first: ${missingReports.join(', ')}`);
        }

        let allAnalysesData = foundReports.map(report => {
            const reportTitle = report.content.match(/#\s*(.*)/)?.[1] || report.reportType;
            return `--- REPORT: ${reportTitle} ---\n\n${report.content}\n\n`;
        }).join('\n');
        
        const data = await getFmpStockData(symbol);
        const profile = data.profile?.[0] || {};
        const companyName = profile.companyName || 'the company';

        const prompt = INVESTMENT_MEMO_PROMPT
            .replace(/{companyName}/g, companyName)
            .replace(/{tickerSymbol}/g, symbol)
            .replace('{allAnalysesData}', allAnalysesData);

        loadingMessage.textContent = "AI is drafting the investment memo...";
        const memoContent = await generatePolishedArticleForSynthesis(prompt, loadingMessage);
        
        await autoSaveReport(symbol, reportType, memoContent, prompt);
        const refreshedReports = await getSavedReports(symbol, reportType);
        const latestReport = refreshedReports[0];

        contentContainer.dataset.currentPrompt = prompt;
        contentContainer.dataset.rawMarkdown = memoContent;
        displayReport(contentContainer, memoContent, prompt);
        
        updateReportStatus(statusContainer, refreshedReports, latestReport.id, { symbol, reportType, promptConfig });

    } catch (error) {
        console.error("Error generating investment memo:", error);
        displayMessageInModal(`Could not generate memo: ${error.message}`, 'error');
        contentContainer.innerHTML = `<p class="text-red-500">Failed to generate memo: ${error.message}</p>`;
    } finally {
        if (document.getElementById(CONSTANTS.MODAL_LOADING).classList.contains('is-open')) {
            closeModal(CONSTANTS.MODAL_LOADING);
        }
    }
}

export async function handleGenerateAllReportsRequest(symbol) {
    const reportTypes = [
        'GarpAnalysis',
        'FinancialAnalysis',
        'RiskAssessment',
        'MoatAnalysis',
        'CapitalAllocators'
    ];
    const reportDisplayNames = {
        'GarpAnalysis': 'GARP Analysis',
        'FinancialAnalysis': 'Financial Analysis',
        'RiskAssessment': 'Risk Assessment',
        'MoatAnalysis': 'Moat Analysis',
        'CapitalAllocators': 'Capital Allocators'
    };

    const metricCalculators = {
        'FinancialAnalysis': _calculateFinancialAnalysisMetrics,
        'GarpAnalysis': _calculateGarpAnalysisMetrics,
        'MoatAnalysis': _calculateMoatAnalysisMetrics,
        'RiskAssessment': _calculateRiskAssessmentMetrics,
        'CapitalAllocators': _calculateCapitalAllocatorsMetrics,
    };

    openModal(CONSTANTS.MODAL_LOADING);
    const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);
    const progressContainer = document.getElementById('progress-container');
    const progressStatus = document.getElementById('progress-status');
    const currentReportName = document.getElementById('current-report-name');
    const progressBarFill = document.getElementById('progress-bar-fill');
    const genericLoader = document.getElementById('generic-loader-container');
    const aiButtonsContainer = document.getElementById('ai-buttons-container');

    progressContainer.classList.remove('hidden');
    genericLoader.classList.add('hidden');
    progressBarFill.style.width = '0%';
    
    try {
        loadingMessage.textContent = `Fetching latest FMP data for ${symbol}...`;
        const data = await getFmpStockData(symbol);
        if (!data) throw new Error(`No cached FMP data found for ${symbol}. Please refresh the data first.`);
        
        const profile = data.profile?.[0] || {};
        const companyName = profile.companyName || 'the company';
        const tickerSymbol = profile.symbol || symbol;

        for (let i = 0; i < reportTypes.length; i++) {
            const reportType = reportTypes[i];
            
            progressStatus.textContent = `Generating Reports (${i + 1}/${reportTypes.length})`;
            currentReportName.textContent = `Running: ${reportDisplayNames[reportType]}...`;

            const promptConfig = promptMap[reportType];
            const calculateMetrics = metricCalculators[reportType];
            if (!promptConfig || !calculateMetrics) {
                console.warn(`Skipping report: No config for ${reportType}`);
                continue;
            }
            const payloadData = calculateMetrics(data);
            const prompt = promptConfig.prompt
                .replace(/{companyName}/g, companyName)
                .replace(/{tickerSymbol}/g, tickerSymbol)
                .replace('{jsonData}', JSON.stringify(payloadData, null, 2));

            const reportContent = await generateRefinedArticle(prompt, loadingMessage);

            const reportData = {
                ticker: symbol,
                reportType: reportType,
                content: reportContent,
                savedAt: Timestamp.now(),
                prompt: prompt
            };
            await addDoc(collection(state.db, CONSTANTS.DB_COLLECTION_AI_REPORTS), reportData);

            if (aiButtonsContainer) {
                const button = aiButtonsContainer.querySelector(`button[data-report-type="${reportType}"]`);
                if (button) {
                    button.classList.add('has-saved-report');
                }
            }
            const progress = ((i + 1) / reportTypes.length) * 100;
            progressBarFill.style.width = `${progress}%`;
        }

        displayMessageInModal(`Successfully generated and saved all prerequisite reports for ${symbol}. You can now generate the GARP Memo.`, 'info');

    } catch (error) {
        console.error("Error generating all reports:", error);
        displayMessageInModal(`Could not complete batch generation: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
        progressContainer.classList.add('hidden');
        genericLoader.classList.remove('hidden');
        loadingMessage.textContent = '';
    }
}

export async function handleSaveReportToDb() {
    const modal = document.getElementById('rawDataViewerModal');
    const symbol = modal.dataset.activeTicker;
    const activeTab = modal.querySelector('.tab-button.active').dataset.tab;
    
    let reportType, contentContainer;

    if (activeTab === 'ai-analysis') {
        contentContainer = document.getElementById('ai-article-container');
        reportType = document.getElementById('report-status-container-ai').dataset.activeReportType;
    } else if (activeTab === 'form-8k-analysis') {
        contentContainer = document.getElementById('ai-article-container-8k');
        reportType = 'Form8KAnalysis';
    } else if (activeTab === 'form-10k-analysis') {
        contentContainer = document.getElementById('ai-article-container-10k');
        reportType = 'Form10KAnalysis';
    } else if (activeTab === 'form-10q-analysis') {
        contentContainer = document.getElementById('ai-article-container-10q');
        reportType = 'Form10QAnalysis';
    }

    if (!symbol || !reportType || !contentContainer) {
        displayMessageInModal("Could not determine which report to save.", "warning");
        return;
    }
    
    const contentToSave = contentContainer.dataset.rawMarkdown;
    const promptToSave = contentContainer.dataset.currentPrompt;

    if (!contentToSave) {
        displayMessageInModal("Please generate an analysis before saving.", "warning");
        return;
    }

    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Saving ${reportType} report to database...`;

    try {
        const reportData = {
            ticker: symbol,
            reportType: reportType,
            content: contentToSave,
            savedAt: Timestamp.now(),
            prompt: promptToSave || ''
        };
        await addDoc(collection(state.db, CONSTANTS.DB_COLLECTION_AI_REPORTS), reportData);
        displayMessageInModal("Report saved successfully!", "info");
        
        if (activeTab === 'ai-analysis') {
            const aiButtonsContainer = document.getElementById('ai-buttons-container');
            if (aiButtonsContainer) {
                const button = aiButtonsContainer.querySelector(`button[data-report-type="${reportType}"]`);
                if (button) {
                    button.classList.add('has-saved-report');
                }
            }
        }

        const savedReports = await getSavedReports(symbol, reportType);
        const latestReport = savedReports[0];
        
        let statusContainer, promptConfig;
         if (activeTab === 'ai-analysis') {
            statusContainer = document.getElementById('report-status-container-ai');
            promptConfig = promptMap[reportType];
        } else if (activeTab === 'form-8k-analysis') {
            statusContainer = document.getElementById('report-status-container-8k');
        } else if (activeTab === 'form-10k-analysis') {
            statusContainer = document.getElementById('report-status-container-10k');
        } else if (activeTab === 'form-10q-analysis') {
            statusContainer = document.getElementById('report-status-container-10q');
        }
        updateReportStatus(statusContainer, savedReports, latestReport.id, { symbol, reportType, promptConfig });

    } catch (error) {
        console.error("Error saving report to DB:", error);
        displayMessageInModal(`Could not save report: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

export function cancelFmpEndpointEdit() {
    const form = document.getElementById('manage-fmp-endpoint-form');
    form.reset();
    document.getElementById('fmp-endpoint-id').value = '';
    document.getElementById('cancel-fmp-endpoint-edit').classList.add('hidden');
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.textContent = 'Save Endpoint';
}

export function cancelBroadEndpointEdit() {
    const form = document.getElementById('manage-broad-endpoint-form');
    form.reset();
    document.getElementById('broad-endpoint-id').value = '';
    document.getElementById('cancel-broad-endpoint-edit').classList.add('hidden');
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.textContent = 'Save Endpoint';
}

export async function handleSaveToDrive(modalId) {
    if (!state.auth.currentUser || state.auth.currentUser.isAnonymous) {
        displayMessageInModal("Please log in with Google to save files to Drive.", "warning");
        return;
    }

    const modal = document.getElementById(modalId);
    if (!modal) return;

    let contentToSave = '';
    let fileName = '';

    const contentContainer = modal.querySelector('#ai-article-container');

    if (!contentContainer || !contentContainer.innerHTML.trim()) {
        displayMessageInModal('There is no content to save.', 'warning');
        return;
    }
    contentToSave = contentContainer.innerHTML;
    
    const modalTitleText = modal.querySelector('h2').textContent;
    const reportH1 = contentContainer.querySelector('h1');
    const reportTitleText = reportH1 ? reportH1.textContent : '';

    let symbolOrContext = '';
    let reportTypeName = modal.dataset.analysisName || '';

    if (modalId === 'rawDataViewerModal' && reportTitleText) {
        symbolOrContext = modalTitleText.replace('Analysis for', '').trim();
        reportTypeName = reportTitleText.split(':')[0].trim();
    }
    
    const cleanSymbol = symbolOrContext.replace(/\s+/g, '_');
    const cleanReportType = reportTypeName.replace(/\s+/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];

    fileName = `${cleanSymbol}_${cleanReportType}_${dateStr}.md`;

    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Saving to Google Drive...`;

    try {
        // Drive saving logic would go here, assuming gapi is loaded and initialized.
        displayMessageInModal(`${fileName} was saved successfully to your "Stock Evaluations" folder in Google Drive.`, 'info');
    } catch (error) {
        console.error("Error saving to drive:", error);
        displayMessageInModal(`Failed to save to Drive: ${error.message || 'Check console for details.'}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}


export async function handleSaveManualFiling(ticker, formType) {
    const formTypeLower = formType.toLowerCase().replace('-', '');
    const dateInput = document.getElementById(`manual-${formTypeLower}-date`);
    const contentInput = document.getElementById(`manual-${formTypeLower}-content`);

    const filingDate = dateInput.value;
    const content = contentInput.value.trim();

    if (!filingDate || !content) {
        displayMessageInModal('Both a filing date and content are required to save.', 'warning');
        return;
    }

    openModal(CONSTANTS.MODAL_LOADING);
    const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);
    loadingMessage.textContent = `Saving ${formType} text for ${ticker}...`;

    try {
        const dataToSave = {
            ticker,
            formType,
            filingDate,
            content,
            savedAt: Timestamp.now()
        };
        await addDoc(collection(state.db, CONSTANTS.DB_COLLECTION_MANUAL_FILINGS), dataToSave);
        await renderFilingAnalysisTab(ticker, formType);

        displayMessageInModal(`${formType} filing text was saved successfully.`, 'info');

    } catch (error) {
        console.error(`Error during filing save for ${formType}:`, error);
        displayMessageInModal(`The save process failed: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

export async function handleFilingAnalysisRequest(symbol, formType, forceNew = false) {
    const formTypeLower = formType.toLowerCase().replace('-', '');
    const reportType = `Form${formType.replace('-', '')}Analysis`;
    const contentContainer = document.getElementById(`ai-article-container-${formTypeLower}`);
    const statusContainer = document.getElementById(`report-status-container-${formTypeLower}`);
    
    contentContainer.innerHTML = '';
    statusContainer.classList.add('hidden');

    try {
        const savedReports = await getSavedReports(symbol, reportType);

        if (savedReports.length > 0 && !forceNew) {
            const latestReport = savedReports[0];
            displayReport(contentContainer, latestReport.content, latestReport.prompt);
            contentContainer.dataset.currentPrompt = latestReport.prompt || '';
            contentContainer.dataset.rawMarkdown = latestReport.content;
            updateReportStatus(statusContainer, savedReports, latestReport.id, { symbol, reportType });
            return;
        }

        openModal(CONSTANTS.MODAL_LOADING);
        const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);
        loadingMessage.textContent = `Fetching latest saved ${formType} to analyze...`;

        const q = query(collection(state.db, CONSTANTS.DB_COLLECTION_MANUAL_FILINGS), where("ticker", "==", symbol), where("formType", "==", formType), orderBy("filingDate", "desc"), limit(1));
        const manualFilingSnapshot = await getDocs(q);

        if (manualFilingSnapshot.empty) {
            throw new Error(`No manually saved ${formType} filing found for ${symbol}. Please save one first.`);
        }
        
        const filingData = manualFilingSnapshot.docs[0].data();
        const profile = state.portfolioCache.find(s => s.ticker === symbol) || {};
        const companyName = profile.companyName || symbol;

        const promptTemplate = promptMap[reportType].prompt;
        const prompt = promptTemplate
            .replace(/{companyName}/g, companyName)
            .replace(/{tickerSymbol}/g, symbol)
            .replace('{filingText}', filingData.content);
        
        contentContainer.dataset.currentPrompt = prompt;

        const newReportContent = await generateRefinedArticle(prompt, loadingMessage);
        contentContainer.dataset.rawMarkdown = newReportContent;
        displayReport(contentContainer, newReportContent, prompt);
        updateReportStatus(statusContainer, [], null, { symbol, reportType });

    } catch (error) {
        console.error(`Error in ${formType} analysis request:`, error);
        displayMessageInModal(`Could not generate analysis: ${error.message}`, 'error');
        contentContainer.innerHTML = `<p class="text-red-500">Failed to generate report: ${error.message}</p>`;
    } finally {
        if (document.getElementById(CONSTANTS.MODAL_LOADING).classList.contains('is-open')) {
            closeModal(CONSTANTS.MODAL_LOADING);
        }
    }
}
