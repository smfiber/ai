import { CONSTANTS, state, promptMap, ANALYSIS_REQUIREMENTS } from './config.js';
import { callApi, callGeminiApi, generateRefinedArticle, generatePolishedArticleForSynthesis, getFmpStockData } from './api.js';
import { getFirestore, Timestamp, doc, setDoc, getDoc, deleteDoc, collection, getDocs, query, limit, addDoc, updateDoc, where, orderBy } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { openModal, closeModal, displayMessageInModal, openConfirmationModal, openManageStockModal } from './ui-modals.js';
import { renderPortfolioManagerList, displayReport, updateReportStatus, fetchAndCachePortfolioData, updateGarpCandidacyStatus, renderCandidacyAnalysis } from './ui-render.js';
import { _calculateFinancialAnalysisMetrics, _calculateMoatAnalysisMetrics, _calculateRiskAssessmentMetrics, _calculateCapitalAllocatorsMetrics, _calculateGarpAnalysisMetrics, _calculateGarpScorecardMetrics } from './analysis-helpers.js';

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
            { name: 'income_statement_quarterly', path: 'income-statement', params: 'period=quarter&limit=5', version: 'v3' },
            { name: 'stock_grade_news', path: 'grade', version: 'v3' },
            { name: 'analyst_estimates', path: 'analyst-estimates', version: 'v3'},
        ];

        let successfulFetches = 0;

        for (const endpoint of coreEndpoints) {
            loadingMessage.textContent = `Fetching FMP Data: ${endpoint.name.replace(/_/g, ' ')}...`;
            
            const version = endpoint.version || 'v3';
            const url = `https://financialmodelingprep.com/api/${version}/${endpoint.path}/${symbol}?${endpoint.params ? endpoint.params + '&' : ''}apikey=${state.fmpApiKey}`;
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

// --- AI ANALYSIS REPORT GENERATORS ---

export async function getSavedReports(ticker, reportType) {
    const reportsRef = collection(state.db, CONSTANTS.DB_COLLECTION_AI_REPORTS);
    const q = query(reportsRef, where("ticker", "==", ticker), where("reportType", "==", reportType), orderBy("savedAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
            const specialReqs = ANALYSIS_REQUIREMENTS[reportType] || [];
            const isSpecialMissing = specialReqs.some(req => missingEndpoints.includes(req));

            if (isSpecialMissing) {
                closeModal(CONSTANTS.MODAL_LOADING);
                openConfirmationModal(
                    'Data Refresh Required',
                    `This analysis requires specific data that is not yet cached for ${symbol} (${missingEndpoints.join(', ')}). Would you like to refresh all FMP data now? This may take a moment.`,
                    async () => {
                        await handleRefreshFmpData(symbol);
                        await handleAnalysisRequest(symbol, reportType, promptConfig, true);
                    }
                );
                return;
            }
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
        } else {
            payloadData = buildAnalysisPayload(data, requiredEndpoints);
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

        let finalReportContent;
        let generatedThesis = '';

        if (reportType === 'GarpAnalysis') {
            loadingMessage.textContent = "AI is drafting the GARP Analysis report...";
            const garpReportContent = await generateRefinedArticle(prompt, loadingMessage);

            const thesisSynthesisPrompt = `
Role: You are a concise investment writer.
Context: You are given a full GARP analysis report and the source JSON data used to create it.
Task: Synthesize these two sources into a formal investment thesis suitable for a thesis tracker. The thesis must consist of 2-3 bullet points, and each point must be quantified with specific data from the JSON source.

GARP Report:
${garpReportContent}

Source JSON:
${JSON.stringify(payloadData, null, 2)}
            `;

            loadingMessage.textContent = "AI is synthesizing the investment thesis...";
            generatedThesis = await callGeminiApi(thesisSynthesisPrompt);

            finalReportContent = `
${garpReportContent}

---

<div class="flex justify-between items-center my-4">
    <h2 class="text-2xl font-bold !my-0">AI-Generated Investment Thesis</h2>
    <button id="insert-thesis-button" class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg text-sm">Insert into Thesis Tracker</button>
</div>

${marked.parse(generatedThesis)}
            `;
        } else {
            finalReportContent = await generateRefinedArticle(prompt, loadingMessage);
        }

        contentContainer.dataset.rawMarkdown = finalReportContent;
        await autoSaveReport(symbol, reportType, finalReportContent, prompt);
        const refreshedReports = await getSavedReports(symbol, reportType);
        
        displayReport(contentContainer, finalReportContent, prompt);

        if (reportType === 'GarpAnalysis') {
            const insertButton = document.getElementById('insert-thesis-button');
            if (insertButton) {
                insertButton.addEventListener('click', async () => {
                    await _saveThesisContent(symbol, generatedThesis);
                    insertButton.textContent = 'Thesis Saved!';
                    insertButton.disabled = true;
                    insertButton.classList.add('bg-green-600', 'hover:bg-green-600');
                    insertButton.classList.remove('bg-indigo-600', 'hover:bg-indigo-700');
                }, { once: true });
            }
        }
        
        updateReportStatus(statusContainer, refreshedReports, refreshedReports[0]?.id, { symbol, reportType, promptConfig });

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
        
        const reportTypes = ['GarpAnalysis', 'FinancialAnalysis', 'RiskAssessment', 'MoatAnalysis', 'CapitalAllocators'];
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

        const prompt = promptMap.InvestmentMemo.prompt
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
    const reportTypes = ['GarpAnalysis', 'FinancialAnalysis', 'RiskAssessment', 'MoatAnalysis', 'CapitalAllocators'];
    const reportDisplayNames = {
        'GarpAnalysis': 'GARP Analysis',
        'FinancialAnalysis': 'Financial Analysis',
        'RiskAssessment': 'Risk Assessment',
        'MoatAnalysis': 'Moat Analysis',
        'CapitalAllocators': 'Capital Allocators',
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
    
    progressContainer.classList.remove('hidden');
    progressBarFill.style.width = '0%';
    
    try {
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

            const aiButtonsContainer = document.getElementById('ai-buttons-container');
            if (aiButtonsContainer) {
                const button = aiButtonsContainer.querySelector(`button[data-report-type="${reportType}"]`);
                if (button) {
                    button.classList.add('has-saved-report');
                }
            }
            const progress = ((i + 1) / reportTypes.length) * 100;
            progressBarFill.style.width = `${progress}%`;
        }

        displayMessageInModal(`Successfully generated and saved all prerequisite reports for ${symbol}. You can now generate the Investment Memo.`, 'info');

    } catch (error) {
        console.error("Error generating all reports:", error);
        displayMessageInModal(`Could not complete batch generation: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
        progressContainer.classList.add('hidden');
    }
}

export async function handleSaveReportToDb() {
    const modal = document.getElementById('rawDataViewerModal');
    const symbol = modal.dataset.activeTicker;
    const reportType = document.getElementById('report-status-container-ai').dataset.activeReportType;
    const contentContainer = document.getElementById('ai-article-container');

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
        
        const aiButtonsContainer = document.getElementById('ai-buttons-container');
        if (aiButtonsContainer) {
            const button = aiButtonsContainer.querySelector(`button[data-report-type="${reportType}"]`);
            if (button) {
                button.classList.add('has-saved-report');
            }
        }

        const savedReports = await getSavedReports(symbol, reportType);
        const latestReport = savedReports[0];
        const statusContainer = document.getElementById('report-status-container-ai');
        const promptConfig = promptMap[reportType];
        
        updateReportStatus(statusContainer, savedReports, latestReport.id, { symbol, reportType, promptConfig });

    } catch (error) {
        console.error("Error saving report to DB:", error);
        displayMessageInModal(`Could not save report: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

export async function handleGarpCandidacyRequest(ticker) {
    const resultContainer = document.getElementById('garp-analysis-container');
    const statusContainer = document.getElementById('garp-candidacy-status-container');
    if (!resultContainer) return;

    resultContainer.innerHTML = `<div class="flex items-center justify-center p-4"><div class="loader"></div><p class="ml-4 text-gray-600 font-semibold">AI is analyzing...</p></div>`;
    statusContainer.classList.add('hidden');
    
    try {
        const fmpData = await getFmpStockData(ticker);
        if (!fmpData) throw new Error("Could not retrieve financial data to perform analysis.");
        
        const scorecardData = _calculateGarpScorecardMetrics(fmpData);

        const cleanData = {};
        for (const [key, value] of Object.entries(scorecardData)) {
            let formattedValue;
            if (typeof value.value === 'number' && isFinite(value.value)) {
                formattedValue = value.format === 'percent' ? `${(value.value * 100).toFixed(2)}%` : value.value.toFixed(2);
            } else {
                formattedValue = 'N/A';
            }
            cleanData[key] = {
                value: formattedValue,
                isMet: value.isMet
            };
        }

        const prompt = `
            **Role:** You are a sharp-witted financial analyst specializing in Growth at a Reasonable Price (GARP) investing.

            **Context:** You are given a set of GARP criteria and the calculated scorecard data for a specific stock. Your task is to provide a brief, insightful analysis.

            **GARP Criteria:**
            - EPS Growth (Last 5 Years) > 10%
            - EPS Growth (Next 1 Year) > 10%
            - Revenue Growth (Last 5 Years) > 5%
            - Return on Equity (ROE) > 15%
            - Return on Invested Capital (ROIC) > 12%
            - P/E (TTM) < 25
            - Forward P/E < 20
            - PEG Ratio between 0.5 and 1.5
            - P/S Ratio < 2.5
            - Debt-to-Equity < 0.7

            **Stock's Scorecard Data:**
            \`\`\`json
            ${JSON.stringify(cleanData, null, 2)}
            \`\`\`

            **Task:**
            Write a concise, one-paragraph analysis based *only* on the provided data. Start by stating how many criteria the stock passes. Then, briefly interpret the stock's profile, highlighting its key strengths (areas where it passes) and weaknesses (areas where it fails) according to the GARP philosophy. Conclude with a definitive statement on whether it appears to be a strong, weak, or borderline GARP candidate at this moment.
        `;
        
        const analysisResult = await generateRefinedArticle(prompt);
        renderCandidacyAnalysis(resultContainer, analysisResult, prompt);
        
        const reportType = 'GarpCandidacy';
        await autoSaveReport(ticker, reportType, analysisResult, prompt);
        
        const reports = await getSavedReports(ticker, reportType);
        if (reports.length > 0) {
            updateGarpCandidacyStatus(statusContainer, reports, reports[0].id, ticker);
        }

    } catch (error) {
        console.error("Error in GARP Candidacy Request:", error);
        resultContainer.innerHTML = `<p class="text-center text-red-500 p-4">${error.message}</p>`;
    }
}
