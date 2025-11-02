// fileName: ui-handlers.js
import { CONSTANTS, state, promptMap, ANALYSIS_REQUIREMENTS, ANALYSIS_NAMES, SECTOR_KPI_SUGGESTIONS, STRUCTURED_DILIGENCE_QUESTIONS, QUALITATIVE_DILIGENCE_QUESTIONS, MARKET_SENTIMENT_QUESTIONS, QUARTERLY_REVIEW_QUESTIONS, ANNUAL_REVIEW_QUESTIONS, FINAL_THESIS_QUESTIONS } from './config.js';
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

async function autoSaveReport(ticker, reportType, content, prompt, diligenceQuestions = null, synthesisData = null) {
    try {
        const reportTypesToPreserve = [
            'DiligenceInvestigation',
            'FilingDiligence',
            'EightKAnalysis',
            'QuarterlyReview',
            'AnnualReview'
        ];

        if (!reportTypesToPreserve.includes(reportType)) {
            // Remove existing reports of the same type from the local cache first
            state.reportCache = state.reportCache.filter(r => r.reportType !== reportType || r.ticker !== ticker);

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
    const section = document.getElementById('sector-momentum-section');
    const container = document.getElementById('sector-momentum-container');
    const summaryContainer = document.getElementById('sector-momentum-ai-summary');
    if (!section || !container || !summaryContainer) return;

    summaryContainer.textContent = 'Fetching sector performance data...';
    container.innerHTML = '<div class="loader mx-auto my-8"></div>';
    section.classList.remove('hidden');

    try {
        const url = `https://financialmodelingprep.com/api/v3/historical-sectors-performance?apikey=${state.fmpApiKey}`;
        const historicalData = await callApi(url);

        if (!historicalData || historicalData.length < 2) {
            throw new Error("Not enough historical sector performance data was returned from the API.");
        }

        const latestData = historicalData[0];
        const sectors = Object.keys(latestData).filter(k => k !== 'date' && typeof latestData[k] === 'number');

        const findClosestDateRecord = (targetDate) => {
            const targetTime = targetDate.getTime();
            return historicalData.reduce((prev, curr) => {
                const prevDiff = Math.abs(new Date(prev.date).getTime() - targetTime);
                const currDiff = Math.abs(new Date(curr.date).getTime() - targetTime);
                return currDiff < prevDiff ? curr : prev;
            });
        };

        const today = new Date();
        const date1M = new Date();
        date1M.setMonth(today.getMonth() - 1);
        const date3M = new Date();
        date3M.setMonth(today.getMonth() - 3);

        const record1M = findClosestDateRecord(date1M);
        const record3M = findClosestDateRecord(date3M);

        const processedData = sectors.map(sector => {
            const latestPerf = latestData[sector];

            const calcPerf = (startRecord) => {
                const startValue = startRecord ? startRecord[sector] : null;
                if (typeof latestPerf !== 'number' || typeof startValue !== 'number') return null;

                const endFactor = 1 + (latestPerf / 100);
                const startFactor = 1 + (startValue / 100);

                if (startFactor === 0) return null;

                return ((endFactor / startFactor) - 1) * 100;
            };

            return {
                sector: sector.replace(/([A-Z])/g, ' $1').replace('Changes Percentage','').trim(),
                perf1M: calcPerf(record1M),
                perf3M: calcPerf(record3M),
                perfYTD: latestPerf
            };
        }).sort((a, b) => (b.perfYTD || -Infinity) - (a.perfYTD || -Infinity));

        summaryContainer.textContent = 'AI is analyzing sector trends...';
        const promptConfig = promptMap['SectorMomentum'];
        const prompt = promptConfig.prompt.replace('{jsonData}', JSON.stringify(processedData, null, 2));
        const aiSummary = await callGeminiApi(prompt);

        renderSectorMomentumHeatMap(processedData, aiSummary);

    } catch (error) {
        console.error("Error fetching or rendering sector momentum:", error);
        section.innerHTML = `<div class="p-4 bg-red-50 text-red-700 rounded-lg text-center">Could not load Sector Momentum data: ${error.message}</div>`;
    }
}

export function handleKpiSuggestionRequest() {
    const sector = document.getElementById('manage-stock-sector').value;
    const container = document.getElementById('kpi-suggestion-container');
    if (!container) return;

    const suggestions = SECTOR_KPI_SUGGESTIONS[sector];
    if (!suggestions) {
        container.innerHTML = `<p class="text-xs text-gray-500 italic">No specific KPI suggestions for the "${sector}" sector.</p>`;
        return;
    }

    const suggestionHtml = suggestions.map(kpi =>
        `<button type="button" class="kpi-suggestion-chip" data-kpi-name="${kpi.name}" title="${kpi.description}">
            + ${kpi.name}
        </button>`
    ).join('');

    container.innerHTML = `<div class="flex flex-wrap gap-2">${suggestionHtml}</div>`;
}


export async function handleSaveStock(e) {
    e.preventDefault();
    const originalTicker = document.getElementById('manage-stock-original-ticker').value.trim().toUpperCase();
    const newTicker = document.getElementById('manage-stock-ticker').value.trim().toUpperCase();

    if (!/^[A-Z.]{1,10}$/.test(newTicker)) {
        displayMessageInModal("Please enter a valid stock ticker symbol.", "warning");
        return;
    }

    const transactionRows = document.querySelectorAll('#transaction-list-container .transaction-row');
    const transactions = [];
    transactionRows.forEach(row => {
        const date = row.querySelector('.transaction-date-input').value;
        const shares = parseFloat(row.querySelector('.transaction-shares-input').value);
        const costPerShare = parseFloat(row.querySelector('.transaction-cost-input').value);
        if (date && !isNaN(shares) && !isNaN(costPerShare)) {
            transactions.push({ date, shares, costPerShare });
        }
    });

    const kpiRows = document.querySelectorAll('#kpi-list-container .kpi-row');
    const customKpis = [];
    kpiRows.forEach(row => {
        const name = row.querySelector('.kpi-name-input').value.trim();
        const value = row.querySelector('.kpi-value-input').value.trim();
        if (name) {
            customKpis.push({ name, value });
        }
    });

    const stockData = {
        ticker: newTicker,
        companyName: document.getElementById('manage-stock-name').value.trim(),
        exchange: document.getElementById('manage-stock-exchange').value.trim(),
        status: document.getElementById('manage-stock-status').value.trim(),
        sector: document.getElementById('manage-stock-sector').value.trim(),
        industry: document.getElementById('manage-stock-industry').value.trim(),
        transactions: transactions,
        customKpis: customKpis,
        purchaseDate: null, // Clear legacy fields
        shares: null,
        costPerShare: null
    };

    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = "Saving to your lists...";

    try {
        if (originalTicker && originalTicker !== newTicker) {
            // If ticker changed, delete the old document
            await state.db.collection(CONSTANTS.DB_COLLECTION_PORTFOLIO).doc(originalTicker).delete();
        }

        // Set (overwrite or create) the document with the new ticker
        await state.db.collection(CONSTANTS.DB_COLLECTION_PORTFOLIO).doc(newTicker).set(stockData, { merge: true });

        // Check if FMP data needs to be cached for the new ticker
        const fmpCacheRef = state.db.collection(CONSTANTS.DB_COLLECTION_FMP_CACHE).doc(newTicker).collection('endpoints');
        const fmpSnapshot = await fmpCacheRef.limit(1).get();
        if (fmpSnapshot.empty) {
            document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `First time setup: Caching FMP data for ${newTicker}...`;
            await handleRefreshFmpData(newTicker);
        }

        closeModal(CONSTANTS.MODAL_MANAGE_STOCK);
        await fetchAndCachePortfolioData(); // Refresh portfolio cache and UI
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
                await state.db.collection(CONSTANTS.DB_COLLECTION_PORTFOLIO).doc(ticker).delete();
                await fetchAndCachePortfolioData(); // Refresh cache and UI
                if(document.getElementById(CONSTANTS.MODAL_PORTFOLIO_MANAGER).classList.contains(CONSTANTS.CLASS_MODAL_OPEN)) {
                    renderPortfolioManagerList(); // Re-render manager list if open
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
        // Check if stock already exists in portfolio
        const docRef = state.db.collection(CONSTANTS.DB_COLLECTION_PORTFOLIO).doc(symbol);
        if ((await docRef.get()).exists) {
             displayMessageInModal(`${symbol} is already in your lists. You can edit it from the dashboard.`, 'info');
             tickerInput.value = '';
             closeModal(CONSTANTS.MODAL_LOADING);
             return;
        }

        // Fetch profile data from FMP
        document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Fetching overview for ${symbol}...`;
        const profileUrl = `https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${state.fmpApiKey}`;
        const profileData = await callApi(profileUrl);

        if (!profileData || profileData.length === 0 || !profileData[0].symbol) {
            throw new Error(`Could not fetch data for ${symbol}. It may be an invalid ticker.`);
        }
        const overviewData = profileData[0];

        // Prepare data for the Manage Stock modal
        const newStock = {
            ticker: overviewData.symbol,
            companyName: overviewData.companyName,
            exchange: overviewData.exchange,
            sector: overviewData.sector,
            industry: overviewData.industry,
            isEditMode: false // Indicate this is a new stock
        };

        tickerInput.value = ''; // Clear input
        openManageStockModal(newStock); // Open modal to add details

    } catch (error) {
        console.error("Error during stock research:", error);
        displayMessageInModal(error.message, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

// --- AI ANALYSIS REPORT GENERATORS ---
export function handleWorkflowHelpRequest() {
    const helpModal = document.getElementById(CONSTANTS.MODAL_HELP);
    const helpTitle = helpModal.querySelector('#help-modal-title');
    const helpContent = helpModal.querySelector('#help-modal-content');

    helpTitle.textContent = 'Recommended GARP Analysis Workflow';

    helpContent.innerHTML = `
        <div>
            <h3 class="text-lg font-bold text-gray-800 mb-2">Step 1: Add Stock & Initial Data Cache</h3>
            <p class="text-sm text-gray-600 mb-4">
                Begin by adding a stock using the "Add Stock to Portfolio" form on the main dashboard. This fetches the company's profile and saves it to one of your lists, creating its initial entry in the database.
            </p>

            <h3 class="text-lg font-bold text-gray-800 mb-2">Step 2: Generate the GARP Analysis Report</h3>
            <p class="text-sm text-gray-600 mb-4">
                This is the most critical step for an initial assessment. In the stock's analysis panel, go to the "Dashboard" tab and click "Analyze Candidacy". This calculates the stock's key metrics, generates the proprietary <strong>GARP Conviction Score</strong>, and creates an initial bull/bear case. This step answers the question: "What are the core quantitative strengths and weaknesses of this stock as a potential GARP candidate?"
            </p>

            <h3 class="text-lg font-bold text-gray-800 mb-2">Step 3: Conduct Deeper Diligence</h3>
            <p class="text-sm text-gray-600 mb-4">
                If the stock still looks promising, use the tools in the "AI Analysis" and "Diligence Hub" tabs to build higher conviction. You can run specialized "Deep Dive" reports (like Moat or Risk Assessment) or use the "Diligence Investigation" tool to ask the AI specific questions that arose during your analysis. Fill out the structured Q&A forms in the Diligence Hub.
            </p>

            <h3 class="text-lg font-bold text-gray-800 mb-2">Step 4: Synthesize the Investment Memo</h3>
            <p class="text-sm text-gray-600">
                This is the final step where all research comes together. Clicking "Generate GARP Memo" synthesizes the Candidacy Report, the quantitative scorecard, your diligence memos, and market sentiment data into a formal investment memo with a clear buy, sell, or hold recommendation.
            </p>
        </div>
    `;

    openModal(CONSTANTS.MODAL_HELP);
}

export async function handleReportHelpRequest(reportType) {
    const reportName = ANALYSIS_NAMES[reportType];
    const promptConfig = promptMap[reportType];
    const calcSummary = CALCULATION_SUMMARIES[reportType];

    if (!reportName || !promptConfig || !calcSummary) {
        displayMessageInModal(`Could not find help configuration for report type: ${reportType}`, 'error');
        return;
    }
    const prompt = promptConfig.prompt;

    const helpModal = document.getElementById(CONSTANTS.MODAL_HELP);
    const helpTitle = helpModal.querySelector('#help-modal-title');
    const helpContent = helpModal.querySelector('#help-modal-content');

    helpTitle.textContent = `Explanation for: ${reportName}`;
    helpContent.innerHTML = '<div class="flex justify-center items-center p-8"><div class="loader"></div></div>';
    openModal(CONSTANTS.MODAL_HELP);

    try {
        const metaPrompt = `
        Role: You are an AI assistant who excels at explaining the purpose and methodology of financial analysis reports to everyday investors. Your tone should be educational, clear, and encouraging.

        Task: Based on the provided "Core Prompt" and "Data Summary" for a report called "${reportName}", generate a concise explanation for the user. The explanation must be in markdown and follow this structure precisely:

        ## What is the "${reportName}" Report?
        (Provide a one-paragraph, high-level summary of the report's main goal. Use a relatable analogy if it helps.)

        ## Key Questions It Answers
        (Create a bulleted list of 2-4 key questions the user can expect this report to answer.)

        ## How It Works
        (In one paragraph, briefly explain the methodology. Mention the key data points it uses based on the "Data Summary" and what the AI is instructed to do based on the "Core Prompt".)

        ---

        **Core Prompt (The instructions given to the analysis AI):**
        \`\`\`
        ${prompt}
        \`\`\`

        **Data Summary (A description of the data prepared for the AI):**
        \`\`\`
        ${calcSummary}
        \`\`\`
        `;

        const explanation = await callGeminiApi(metaPrompt);

        const sanitizeText = (text) => {
            if (typeof text !== 'string') return '';
            const tempDiv = document.createElement('div');
            tempDiv.textContent = text;
            return tempDiv.innerHTML;
        };

        const accordionHtml = `
            <details class="mb-4 border rounded-md bg-gray-50/50">
                <summary class="p-2 font-semibold text-sm text-gray-700 cursor-pointer hover:bg-gray-100">
                    View Full Prompt Sent to AI
                </summary>
                <pre class="text-xs whitespace-pre-wrap break-all bg-gray-900 text-white p-3 rounded-b-md">${sanitizeText(metaPrompt)}</pre>
            </details>
        `;

        helpContent.innerHTML = accordionHtml + marked.parse(explanation);

    } catch (error) {
        console.error('Error generating help content:', error);
        helpContent.innerHTML = `<p class="text-red-500">Sorry, I couldn't generate an explanation at this time. Error: ${error.message}</p>`;
    }
}

export async function handlePositionAnalysisRequest(ticker, forceNew = false) {
    const container = document.getElementById('position-analysis-content-container');
    const statusContainer = document.getElementById('report-status-container-position');
    const reportType = 'PositionAnalysis';
    if (!container || !statusContainer) return;

    try {
        const savedReports = getReportsFromCache(ticker, reportType);

        if (savedReports.length > 0 && !forceNew) {
            const latestReport = savedReports[0];
            displayReport(container, latestReport.content, latestReport.prompt);
            container.dataset.currentPrompt = latestReport.prompt || '';
            container.dataset.rawMarkdown = latestReport.content;
            updateReportStatus(statusContainer, savedReports, latestReport.id, { reportType, symbol: ticker });
            return;
        }

        openModal(CONSTANTS.MODAL_LOADING);
        const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);
        loadingMessage.textContent = 'Synthesizing position analysis...';

        const portfolioData = state.portfolioCache.find(s => s.ticker === ticker);
        const fmpData = await getFmpStockData(ticker);

        const memoReports = getReportsFromCache(ticker, 'InvestmentMemo');
        const moatReports = getReportsFromCache(ticker, 'MoatAnalysis');
        const capitalReports = getReportsFromCache(ticker, 'CapitalAllocators');

        let sourceReportContent;
        if (memoReports.length > 0) {
            sourceReportContent = memoReports[0].content;
        } else {
            const candidacyReports = getReportsFromCache(ticker, 'GarpCandidacy');
            if (candidacyReports.length === 0) {
                throw new Error(`The foundational 'GARP Analysis Report' or 'Investment Memo' must be generated first.`);
            }
            sourceReportContent = (candidacyReports[0].content || '').split('## Actionable Diligence Questions')[0].trim();
        }

        if (moatReports.length === 0) {
            throw new Error("The 'Moat Analysis' report must be generated first to re-evaluate the thesis.");
        }
        if (capitalReports.length === 0) {
            throw new Error("The 'Capital Allocators' report must be generated first to re-evaluate the thesis.");
        }

        if (!fmpData || !fmpData.profile || !fmpData.profile.length === 0) {
            throw new Error(`Could not retrieve the latest price data for ${ticker}.`);
        }

        const currentPrice = fmpData.profile[0].price;
        const { companyName, transactions } = portfolioData;

        let totalShares = 0;
        let totalCost = 0;
        let earliestDate = null;

        if(transactions && transactions.length > 0) {
            transactions.forEach(t => {
                totalShares += t.shares;
                totalCost += t.shares * t.costPerShare;
                if (!earliestDate || new Date(t.date) < new Date(earliestDate)) {
                    earliestDate = t.date;
                }
            });
        }

        const avgCostPerShare = totalShares > 0 ? totalCost / totalShares : 0;
        const marketValue = totalShares * currentPrice;
        const unrealizedGainLoss = marketValue - totalCost;
        const unrealizedGainLossPct = totalCost > 0 ? (unrealizedGainLoss / totalCost) * 100 : 0;

        let holdingPeriod = 'N/A';
        if (earliestDate) {
            const pDate = new Date(earliestDate);
            const now = new Date();
            const diffTime = Math.abs(now - pDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const years = Math.floor(diffDays / 365);
            const months = Math.floor((diffDays % 365) / 30.44);

            let periodStr = '';
            if (years > 0) periodStr += `${years} year(s), `;
            if (months > 0) periodStr += `${months} month(s)`;
            if (periodStr === '') periodStr = `${diffDays} day(s)`;
            holdingPeriod = periodStr.replace(/, $/, '');
        }

        const positionDetails = {
            totalShares: totalShares.toFixed(3),
            averageCostPerShare: `$${avgCostPerShare.toFixed(2)}`,
            totalCostBasis: `$${totalCost.toFixed(2)}`,
            currentMarketValue: `$${marketValue.toFixed(2)}`,
            unrealizedGainLoss: `$${unrealizedGainLoss.toFixed(2)} (${unrealizedGainLossPct.toFixed(2)}%)`,
            holdingPeriod
        };

        loadingMessage.textContent = "AI is re-evaluating the thesis...";
        const promptConfig = promptMap[reportType];
        const prompt = promptConfig.prompt
            .replace('{companyName}', companyName)
            .replace('{tickerSymbol}', ticker)
            .replace('{moatAnalysisReport}', moatReports[0].content)
            .replace('{capitalAllocatorsReport}', capitalReports[0].content)
            .replace('{investmentMemoContent}', sourceReportContent)
            .replace('{positionDetails}', JSON.stringify(positionDetails, null, 2))
            .replace('{currentPrice}', `$${currentPrice.toFixed(2)}`);

        const analysisResult = await callGeminiApi(prompt);

        await autoSaveReport(ticker, reportType, analysisResult, prompt);

        const refreshedReports = getReportsFromCache(ticker, reportType);

        displayReport(container, analysisResult, prompt);
        updateReportStatus(statusContainer, refreshedReports, refreshedReports[0].id, { reportType, symbol: ticker });

    } catch (error) {
        console.error("Error during Position Analysis:", error);
        displayMessageInModal(`Could not complete analysis: ${error.message}`, 'error');
        const containerHtml = `<p class="text-red-500 p-4">Could not complete analysis: ${error.message}</p>`;

        if(statusContainer) {
            statusContainer.classList.add('hidden');
            statusContainer.innerHTML = '';
        }
        container.innerHTML = containerHtml;
        throw error; // Re-throw to signal failure
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

export async function handlePortfolioGarpAnalysisRequest() {
    const container = document.getElementById('portfolio-garp-ai-summary-container');
    if (!container) return;

    container.innerHTML = `<div class="flex items-center justify-center p-4"><div class="loader"></div><p class="ml-4 text-gray-600 font-semibold">AI is analyzing portfolio...</p></div>`;

    try {
        const portfolioStocks = state.portfolioCache.filter(s => s.status === 'Portfolio');
        if (portfolioStocks.length === 0) {
            container.innerHTML = `<p class="text-center text-gray-500 italic">No stocks in portfolio to analyze.</p>`;
            return;
        }

        const stocksWithData = await Promise.all(
            portfolioStocks.map(async (stock) => {
                const fmpData = await getFmpStockData(stock.ticker);
                if (!fmpData) return null;
                const metrics = _calculateGarpScorecardMetrics(fmpData);
                return { stock, metrics, fmpData };
            })
        );

        const validStocks = stocksWithData.filter(Boolean);

        const payload = validStocks.map(({ stock, metrics, fmpData }) => {
            const profile = fmpData.profile?.[0] || {};
            const cleanScorecard = {};
            for (const [key, data] of Object.entries(metrics)) {
                if (key === 'garpConvictionScore') continue;
                 cleanScorecard[key] = {
                    value: (typeof data.value === 'number' && isFinite(data.value))
                        ? (data.format === 'percent' ? `${(data.value * 100).toFixed(2)}%` : data.value.toFixed(2))
                        : 'N/A',
                    isMet: data.isMet,
                    interpretation: data.interpretation
                };
            }

            return {
                companyName: stock.companyName,
                ticker: stock.ticker,
                sector: stock.sector,
                mktCap: profile.mktCap,
                garpConvictionScore: metrics.garpConvictionScore,
                scorecard: cleanScorecard
            };
        });

        const promptConfig = promptMap['PortfolioGarpAnalysis'];
        const prompt = promptConfig.prompt.replace('{jsonData}', JSON.stringify(payload, null, 2));

        const analysisResult = await generateRefinedArticle(prompt);
        container.innerHTML = marked.parse(analysisResult);

    } catch (error) {
        console.error("Error during portfolio GARP analysis:", error);
        container.innerHTML = `<p class="text-red-500">Could not complete analysis: ${error.message}</p>`;
    }
}

export async function handleSaveReportToDb() {
    const modal = document.getElementById('rawDataViewerModal');
    const symbol = modal.dataset.activeTicker;
    const statusContainer = document.getElementById('report-status-container-analysis'); // Get status container
    const reportType = statusContainer?.dataset.activeReportType; // Get active report type from dataset
    const contentContainer = document.getElementById('ai-article-container-analysis');

    if (!symbol || !reportType || !contentContainer) {
        displayMessageInModal("Could not determine which report to save. Please generate or select a report first.", "warning");
        return;
    }

    const contentToSave = contentContainer.dataset.rawMarkdown;
    const promptToSave = contentContainer.dataset.currentPrompt;

    if (!contentToSave) {
        displayMessageInModal("Report content is missing. Please generate the report again.", "warning");
        return;
    }

    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Saving ${reportType} report to database...`;

    try {
        // Assume autoSaveReport handles adding to DB and updating local cache
        await autoSaveReport(symbol, reportType, contentToSave, promptToSave);
        displayMessageInModal("Report saved successfully!", "info");

        // Mark button as having saved report
        const analysisButtonContainer = document.getElementById('analysis-content-container');
        if (analysisButtonContainer) {
            const button = analysisButtonContainer.querySelector(`button[data-report-type="${reportType}"]`);
            if (button) {
                button.classList.add('has-saved-report');
            }
        }

        // Refresh status display with potentially updated list of saved reports
        const savedReports = getReportsFromCache(symbol, reportType);
        const latestReport = savedReports[0]; // Should be the one just saved
        const promptConfig = promptMap[reportType]; // Needed for updateReportStatus

        if (statusContainer && latestReport) {
            updateReportStatus(statusContainer, savedReports, latestReport.id, { symbol, reportType, promptConfig });
        }

    } catch (error) {
        console.error("Error saving report to DB:", error);
        displayMessageInModal(`Could not save report: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

export async function handleGarpCandidacyRequest(ticker, forceNew = false) {
    const resultContainer = document.getElementById('garp-analysis-container');
    const statusContainer = document.getElementById('garp-candidacy-status-container');
    if (!resultContainer || !statusContainer) return; // Added check for status container

    resultContainer.innerHTML = `<div class="flex items-center justify-center p-4"><div class="loader"></div><p class="ml-4 text-gray-600 font-semibold">AI is analyzing...</p></div>`;
    statusContainer.classList.add('hidden');

    try {
        const fmpData = await getFmpStockData(ticker);
        if (!fmpData) throw new Error("Could not retrieve financial data to perform analysis.");

        const scorecardData = _calculateGarpScorecardMetrics(fmpData);
        const newScore = scorecardData.garpConvictionScore;

        // Update score in portfolio cache
        const stockDocRef = state.db.collection(CONSTANTS.DB_COLLECTION_PORTFOLIO).doc(ticker);
        await stockDocRef.update({ garpConvictionScore: newScore });
        await fetchAndCachePortfolioData(); // Refresh UI counts etc.

        const profile = fmpData.profile?.[0] || {};
        const companyName = profile.companyName || ticker;
        const tickerSymbol = profile.symbol || ticker;
        const sector = profile.sector || 'N/A';
        const peerDocRef = state.db.collection(CONSTANTS.DB_COLLECTION_FMP_CACHE).doc(ticker).collection('analysis').doc('peer_comparison');
        const peerDocSnap = await peerDocRef.get();
        const peerAverages = peerDocSnap.exists ? peerDocSnap.data().averages : null;
        const peerDataChanges = peerDocSnap.exists ? peerDocSnap.data().changes : null; // Added peer changes

        const cleanScorecard = {};
        for (const [key, value] of Object.entries(scorecardData)) {
            // Include score for Confidence calculation in prompt
            // if (key === 'garpConvictionScore') continue; // Keep score for prompt

            const formattedValue = (typeof value.value === 'number' && isFinite(value.value))
                ? (value.format === 'percent' ? `${(value.value * 100).toFixed(2)}%` : value.value.toFixed(2))
                : 'N/A';

            cleanScorecard[key] = {
                value: formattedValue,
                isMet: value.isMet,
                interpretation: value.interpretation
            };
        }

        const payload = {
            scorecard: cleanScorecard,
            garpConvictionScore: scorecardData.garpConvictionScore, // Ensure score is passed
            peerAverages: peerAverages,
            peerDataChanges: peerDataChanges, // Pass changes data
        };

        const promptConfig = promptMap['GarpCandidacy'];
        let prompt = promptConfig.prompt
            .replace(/{companyName}/g, companyName)
            .replace(/{tickerSymbol}/g, tickerSymbol)
            .replace(/{sector}/g, sector)
            .replace('{jsonData}', JSON.stringify(payload, null, 2));

        const analysisResult = await generateRefinedArticle(prompt);

        // Extract diligence questions generated by the AI
        // This is a basic example; might need more robust parsing
        let diligenceQuestions = null;
        const dqSection = analysisResult.split('## Actionable Diligence Questions')[1];
        if (dqSection) {
            // Basic parsing assumes format "- Human-Led Question: ... \n- Suggested AI Investigation Query: ..."
             const questionRegex = /- \*\*Human-Led Question:\*\* (.*?)\n- \*\*Suggested AI Investigation Query:\*\* "(.*?)"/g;
             diligenceQuestions = [];
             let match;
             while ((match = questionRegex.exec(dqSection)) !== null) {
                 diligenceQuestions.push({ human: match[1].trim(), ai: match[2].trim() });
             }
        }


        const reportType = 'GarpCandidacy';
        await autoSaveReport(ticker, reportType, analysisResult, prompt, diligenceQuestions); // Save extracted questions

        const reports = getReportsFromCache(ticker, reportType);
        if (reports.length > 0) {
            renderCandidacyAnalysis(resultContainer, reports[0].content, reports[0].prompt, reports[0].diligenceQuestions); // Pass questions to render
            updateGarpCandidacyStatus(statusContainer, reports, reports[0].id, ticker);
        }

    } catch (error) {
        console.error("Error in GARP Candidacy Request:", error);
        resultContainer.innerHTML = `<p class="text-center text-red-500 p-4">${error.message}</p>`;
        throw error; // Re-throw to signal failure
    }
}

export async function handleAnalysisRequest(symbol, reportType, promptConfig, forceNew = false) {
    const contentContainer = document.getElementById('ai-article-container-analysis');
    const statusContainer = document.getElementById('report-status-container-analysis');

    contentContainer.innerHTML = '';
    statusContainer.classList.add('hidden');

    try {
        const savedReports = getReportsFromCache(symbol, reportType);

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
                        await handleAnalysisRequest(symbol, reportType, promptConfig, true); // Retry after refresh
                    }
                );
                return;
            }
            // If missing non-critical data, log warning but continue? Or throw error?
            console.warn(`Missing non-critical FMP data for ${reportType}: ${missingEndpoints.join(', ')}`);
        }

        let payloadData;
        if (reportType === 'MoatAnalysis') {
            payloadData = _calculateMoatAnalysisMetrics(data);
        } else if (reportType === 'CapitalAllocators') {
            payloadData = _calculateCapitalAllocatorsMetrics(data);
        } else if (reportType === 'QarpAnalysis') {
            payloadData = _calculateGarpScorecardMetrics(data); // Use scorecard data
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

        contentContainer.dataset.currentPrompt = prompt; // Store prompt before AI call

        const finalReportContent = await generateRefinedArticle(prompt, loadingMessage);
        contentContainer.dataset.rawMarkdown = finalReportContent; // Store raw markdown

        let synthesisData = null;
        if (promptMap[`${reportType}_Extract`]) {
             synthesisData = await extractSynthesisData(finalReportContent, reportType);
        }

        await autoSaveReport(symbol, reportType, finalReportContent, prompt, null, synthesisData);

        const refreshedReports = getReportsFromCache(symbol, reportType);
        const latestReport = refreshedReports[0]; // Should be the one just generated

        displayReport(contentContainer, finalReportContent, prompt); // Display the new report

        // Update status only if the container exists and we have reports
        if (statusContainer && latestReport) {
             updateReportStatus(statusContainer, refreshedReports, latestReport.id, { symbol, reportType, promptConfig });
        }


    } catch (error) {
        displayMessageInModal(`Could not generate or load analysis: ${error.message}`, 'error');
        contentContainer.innerHTML = `<p class="text-red-500">Failed to generate report: ${error.message}</p>`;
        throw error; // Re-throw to signal failure
    } finally {
        // Ensure loading modal is always closed
        if (document.getElementById(CONSTANTS.MODAL_LOADING).classList.contains('is-open')) {
            closeModal(CONSTANTS.MODAL_LOADING);
        }
    }
}

export async function handleGarpMemoRequest(symbol, forceNew = false) {
    const contentContainer = document.getElementById('ai-article-container-analysis');
    const statusContainer = document.getElementById('report-status-container-analysis');
    contentContainer.innerHTML = '';
    statusContainer.classList.add('hidden');

    try {
        const reportType = 'InvestmentMemo';
        const promptConfig = promptMap[reportType];
        const savedReports = getReportsFromCache(symbol, reportType);

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
        loadingMessage.textContent = "Gathering prerequisite reports for memo synthesis...";

        const requiredMemos = {
            'GarpCandidacy': 'GARP Analysis Report',
            'StructuredDiligenceMemo': 'Structured Diligence Memo',
            'QualitativeDiligenceMemo': 'Qualitative Diligence Memo',
            'MarketSentimentMemo': 'Market Sentiment Memo'
        };

        const fetchedMemos = {};

        for (const [type, name] of Object.entries(requiredMemos)) {
            const reports = getReportsFromCache(symbol, type);
            if (reports.length === 0) {
                throw new Error(`The foundational '${name}' has not been generated yet. Please generate it from the 'Diligence Hub' or 'Dashboard' tab first.`);
            }
            if (type === 'GarpCandidacy') {
                 fetchedMemos[type] = (reports[0].content || '').split('## Actionable Diligence Questions')[0].trim();
            } else {
                 fetchedMemos[type] = reports[0].content;
            }
        }

        const data = await getFmpStockData(symbol);
        if (!data) throw new Error(`Could not retrieve financial data for ${symbol}.`);
        const scorecardData = _calculateGarpScorecardMetrics(data);

        const profile = data.profile?.[0] || {};
        const companyName = profile.companyName || 'the company';

        const prompt = promptMap.InvestmentMemo.prompt
            .replace(/{companyName}/g, companyName)
            .replace(/{tickerSymbol}/g, symbol)
            .replace('{scorecardJson}', JSON.stringify(scorecardData, null, 2))
            .replace('{garpCandidacyReport}', fetchedMemos.GarpCandidacy)
            .replace('{structuredDiligenceMemo}', fetchedMemos.StructuredDiligenceMemo)
            .replace('{qualitativeDiligenceMemo}', fetchedMemos.QualitativeDiligenceMemo)
            .replace('{marketSentimentMemo}', fetchedMemos.MarketSentimentMemo);

        const memoContent = await generateRefinedArticle(prompt, loadingMessage);
        const synthesisData = await extractSynthesisData(memoContent, reportType);

        await autoSaveReport(symbol, reportType, memoContent, prompt, null, synthesisData);
        const refreshedReports = getReportsFromCache(symbol, reportType);
        const latestReport = refreshedReports[0];

        contentContainer.dataset.currentPrompt = prompt;
        contentContainer.dataset.rawMarkdown = memoContent;
        displayReport(contentContainer, memoContent, prompt);

        updateReportStatus(statusContainer, refreshedReports, latestReport.id, { symbol, reportType, promptConfig });

    } catch (error) {
        console.error("Error generating investment memo:", error);
        displayMessageInModal(`Could not generate memo: ${error.message}`, 'error');
        contentContainer.innerHTML = `<p class="text-red-500">Failed to generate memo: ${error.message}</p>`;
        throw error; // Re-throw to signal failure
    } finally {
        if (document.getElementById(CONSTANTS.MODAL_LOADING).classList.contains('is-open')) {
            closeModal(CONSTANTS.MODAL_LOADING);
        }
    }
}

export async function handleCompounderMemoRequest(symbol, forceNew = false) {
    const contentContainer = document.getElementById('ai-article-container-analysis');
    const statusContainer = document.getElementById('report-status-container-analysis');
    contentContainer.innerHTML = '';
    statusContainer.classList.add('hidden');

    try {
        const reportType = 'LongTermCompounder';
        const promptConfig = promptMap[reportType];
        const savedReports = getReportsFromCache(symbol, reportType);

        if (savedReports.length > 0 && !forceNew) {
            const latestReport = savedReports[0];
            displayReport(contentContainer, latestReport.content, latestReport.prompt);
            updateReportStatus(statusContainer, savedReports, latestReport.id, { symbol, reportType, promptConfig });
            return;
        }

        openModal(CONSTANTS.MODAL_LOADING);
        const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);
        loadingMessage.textContent = "Calculating source metrics for Compounder Memo...";

        const data = await getFmpStockData(symbol);
        if (!data) {
            throw new Error(`Could not retrieve financial data for ${symbol} to generate the memo.`);
        }

        const moatData = _calculateMoatAnalysisMetrics(data);
        const capitalData = _calculateCapitalAllocatorsMetrics(data);
        const payload = {
            moatAnalysis: moatData,
            capitalAllocation: capitalData
        };

        loadingMessage.textContent = "Synthesizing the Long-Term Compounder Memo...";
        const profile = state.portfolioCache.find(s => s.ticker === symbol);
        const companyName = profile ? profile.companyName : symbol;

        const prompt = promptConfig.prompt
            .replace(/{companyName}/g, companyName)
            .replace(/{tickerSymbol}/g, symbol)
            .replace('{jsonData}', JSON.stringify(payload, null, 2));

        const memoContent = await generateRefinedArticle(prompt, loadingMessage);
        const synthesisData = await extractSynthesisData(memoContent, reportType);
        await autoSaveReport(symbol, reportType, memoContent, prompt, null, synthesisData);

        const refreshedReports = getReportsFromCache(symbol, reportType);
        displayReport(contentContainer, memoContent, prompt);
        updateReportStatus(statusContainer, refreshedReports, refreshedReports[0].id, { symbol, reportType, promptConfig });

    } catch (error) {
        console.error("Error generating Long-Term Compounder memo:", error);
        displayMessageInModal(`Could not generate memo: ${error.message}`, 'error');
        contentContainer.innerHTML = `<p class="text-red-500">${error.message}</p>`;
        throw error; // Re-throw to signal failure
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

export async function handleBmqvMemoRequest(symbol, forceNew = false) {
    const contentContainer = document.getElementById('ai-article-container-analysis');
    const statusContainer = document.getElementById('report-status-container-analysis');
    contentContainer.innerHTML = '';
    statusContainer.classList.add('hidden');

    try {
        const reportType = 'BmqvMemo';
        const synthesisPromptConfig = promptMap[reportType];
        const savedReports = getReportsFromCache(symbol, reportType);

        if (savedReports.length > 0 && !forceNew) {
            const latestReport = savedReports[0];
            displayReport(contentContainer, latestReport.content, latestReport.prompt);
            updateReportStatus(statusContainer, savedReports, latestReport.id, { symbol, reportType, promptConfig: synthesisPromptConfig });
            return;
        }

        openModal(CONSTANTS.MODAL_LOADING);
        const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);
        loadingMessage.textContent = "Calculating source metrics for BMQV Memo...";

        const data = await getFmpStockData(symbol);
        if (!data) {
            throw new Error(`Could not retrieve financial data for ${symbol} to generate the memo.`);
        }

        const moatData = _calculateMoatAnalysisMetrics(data);
        const capitalData = _calculateCapitalAllocatorsMetrics(data);
        const payload = {
            moatAnalysis: moatData,
            capitalAllocation: capitalData
        };

        loadingMessage.textContent = "Synthesizing the BMQV Memo from source data...";
        const profile = state.portfolioCache.find(s => s.ticker === symbol);
        const companyName = profile ? profile.companyName : symbol;

        const synthesisPrompt = synthesisPromptConfig.prompt
            .replace(/{companyName}/g, companyName)
            .replace(/{tickerSymbol}/g, symbol)
            .replace('{jsonData}', JSON.stringify(payload, null, 2));

        const memoContent = await generateRefinedArticle(synthesisPrompt, loadingMessage);
        const synthesisData = await extractSynthesisData(memoContent, reportType);
        await autoSaveReport(symbol, reportType, memoContent, synthesisPrompt, null, synthesisData);

        const refreshedReports = getReportsFromCache(symbol, reportType);
        displayReport(contentContainer, memoContent, synthesisPrompt);
        updateReportStatus(statusContainer, refreshedReports, refreshedReports[0].id, { symbol, reportType, promptConfig: synthesisPromptConfig });

    } catch (error) {
        console.error("Error generating Buffett-Munger Q&V memo:", error);
        displayMessageInModal(`Could not generate memo: ${error.message}`, 'error');
        contentContainer.innerHTML = `<p class="text-red-500">${error.message}</p>`;
        throw error; // Re-throw to signal failure
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

export async function handleFinalThesisRequest(symbol, forceNew = false) {
    const contentContainer = document.getElementById('ai-article-container-analysis');
    const statusContainer = document.getElementById('report-status-container-analysis');
    contentContainer.innerHTML = '';
    statusContainer.classList.add('hidden');

    try {
        const reportType = 'FinalInvestmentThesis';
        const promptConfig = promptMap[reportType];
        const savedReports = getReportsFromCache(symbol, reportType);

        if (savedReports.length > 0 && !forceNew) {
            const latestReport = savedReports[0];
            displayReport(contentContainer, latestReport.content, latestReport.prompt);
            updateReportStatus(statusContainer, savedReports, latestReport.id, { symbol, reportType, promptConfig });
            return;
        }

        openModal(CONSTANTS.MODAL_LOADING);
        const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);

        loadingMessage.textContent = "Gathering prerequisite analyst summaries...";

        const portfolioStock = state.portfolioCache.find(s => s.ticker === symbol);
        const garpScore = portfolioStock ? portfolioStock.garpConvictionScore : 'N/A';
        if (garpScore === 'N/A') {
            throw new Error("GARP Conviction Score not found. Please generate the GARP Candidacy report first.");
        }

        const requiredReportTypes = ['InvestmentMemo', 'QarpAnalysis', 'LongTermCompounder', 'BmqvMemo'];
        const analystSummaries = {};
        let missingExtraction = [];

        for (const type of requiredReportTypes) {
            const reports = getReportsFromCache(symbol, type);
            if (reports.length === 0) {
                throw new Error(`The prerequisite '${ANALYSIS_NAMES[type]}' has not been generated yet.`);
            }
            const reportData = reports[0];
            if (!reportData.synthesis_data) {
                console.warn(`Synthesis data missing for ${type}, attempting extraction...`);
                const extractedData = await extractSynthesisData(reportData.content, type);
                if (!extractedData) {
                    missingExtraction.push(ANALYSIS_NAMES[type]);
                    analystSummaries[type] = null; // Mark as missing
                } else {
                    analystSummaries[type] = extractedData;
                    // Optionally save back
                     await state.db.collection(CONSTANTS.DB_COLLECTION_AI_REPORTS).doc(reportData.id).update({ synthesis_data: extractedData });
                     const cacheIndex = state.reportCache.findIndex(r => r.id === reportData.id);
                     if (cacheIndex !== -1) state.reportCache[cacheIndex].synthesis_data = extractedData;
                }
            } else {
                analystSummaries[type] = reportData.synthesis_data;
            }
        }

        if (missingExtraction.length > 0) {
            throw new Error(`Synthesis data is missing and could not be extracted for: ${missingExtraction.join(', ')}. Please regenerate them.`);
        }


        loadingMessage.textContent = "Synthesizing final thesis...";
        const profile = state.portfolioCache.find(s => s.ticker === symbol);
        const companyName = profile ? profile.companyName : symbol;

        const finalPrompt = promptConfig.prompt
            .replace(/{companyName}/g, companyName)
            .replace(/{tickerSymbol}/g, symbol)
            .replace('{garpScore}', garpScore)
            .replace('{analystSummaries}', JSON.stringify(analystSummaries, null, 2));

        const memoContent = await generateRefinedArticle(finalPrompt, loadingMessage);
        await autoSaveReport(symbol, reportType, memoContent, finalPrompt);

        const refreshedReports = getReportsFromCache(symbol, reportType);
        displayReport(contentContainer, memoContent, finalPrompt);
        updateReportStatus(statusContainer, refreshedReports, refreshedReports[0].id, { symbol, reportType, promptConfig });

    } catch (error) {
        console.error("Error generating Final Investment Thesis:", error);
        displayMessageInModal(`Could not generate final thesis: ${error.message}`, 'error');
        contentContainer.innerHTML = `<p class="text-red-500">${error.message}</p>`;
        throw error; // Re-throw to signal failure
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

// --- NEW HANDLER FOR UPDATED FINAL THESIS ---
export async function handleUpdatedFinalThesisRequest(symbol, forceNew = false) {
    const contentContainer = document.getElementById('ai-article-container-analysis');
    const statusContainer = document.getElementById('report-status-container-analysis');
    contentContainer.innerHTML = '';
    statusContainer.classList.add('hidden');

    try {
        const reportType = 'UpdatedFinalThesis';
        const promptConfig = promptMap[reportType];
        const savedReports = getReportsFromCache(symbol, reportType);

        if (savedReports.length > 0 && !forceNew) {
            const latestReport = savedReports[0];
            displayReport(contentContainer, latestReport.content, latestReport.prompt);
            updateReportStatus(statusContainer, savedReports, latestReport.id, { symbol, reportType, promptConfig });
            return;
        }

        openModal(CONSTANTS.MODAL_LOADING);
        const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);
        loadingMessage.textContent = "Gathering original thesis and new diligence answers...";

        // 1. Get the original FinalInvestmentThesis content
        const originalThesisReports = getReportsFromCache(symbol, 'FinalInvestmentThesis');
        if (originalThesisReports.length === 0) {
            throw new Error(`The original 'Final Investment Thesis' must be generated first.`);
        }
        const originalFinalThesisContent = originalThesisReports[0].content;

        // 2. Get the two specific answers from the *NEW* FinalThesis document
        loadingMessage.textContent = "Fetching your final thesis diligence answers...";
        
        // --- MODIFICATION: Point to the new, isolated document ---
        const docRef = state.db.collection(CONSTANTS.DB_COLLECTION_FMP_CACHE).doc(symbol).collection('diligence_answers').doc('FinalThesis');
        const docSnap = await docRef.get(); // No cache-busting needed, it's a direct read

        if (!docSnap.exists) {
            throw new Error(`You must first save your answers for the 'Final Thesis' section in the 'Final Thesis' tab.`);
        }

        const savedData = docSnap.data().answers || [];
        const answersMap = new Map(savedData.map(item => [item.question, item.answer]));

        // --- MODIFICATION: Use the new FINAL_THESIS_QUESTIONS constant ---
        const question1 = FINAL_THESIS_QUESTIONS['Business Quality & Flaw Assessment'];
        const question2 = FINAL_THESIS_QUESTIONS['Final Thesis & Margin of Safety'];

        const answer1 = answersMap.get(question1) || "";
        const answer2 = answersMap.get(question2) || "";
        
        // Removed the checks that threw errors for blank/missing answers.
        // Blank answers are now a valid state.


        loadingMessage.textContent = "Synthesizing updated final thesis...";
        const profile = state.portfolioCache.find(s => s.ticker === symbol);
        const companyName = profile ? profile.companyName : symbol;

        const finalPrompt = promptConfig.prompt
            .replace(/{companyName}/g, companyName)
            .replace(/{tickerSymbol}/g, symbol)
            .replace('{originalFinalThesisContent}', originalFinalThesisContent)
            .replace('{businessQualityFlawAnswer}', answer1)
            .replace('{finalThesisMarginOfSafetyAnswer}', answer2);

        const memoContent = await generateRefinedArticle(finalPrompt, loadingMessage);

        await autoSaveReport(symbol, reportType, memoContent, finalPrompt);

        const refreshedReports = getReportsFromCache(symbol, reportType);
        displayReport(contentContainer, memoContent, finalPrompt);
        updateReportStatus(statusContainer, refreshedReports, refreshedReports[0].id, { symbol, reportType, promptConfig });

    } catch (error) {
        console.error("Error generating Updated Final Thesis:", error);
        displayMessageInModal(`Could not generate updated thesis: ${error.message}`, 'error');
        contentContainer.innerHTML = `<p class="text-red-500">${error.message}</p>`;
        throw error; // Re-throw to signal failure
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}
// --- END NEW HANDLER ---


export async function handleGeneratePrereqsRequest(symbol) {
    // Deprecated or replace with individual calls if needed
     console.warn("handleGeneratePrereqsRequest is likely deprecated.");
     displayMessageInModal("Batch prerequisite generation is currently disabled.", "info");
     return;
}

export async function handleDiligenceMemoRequest(symbol, reportType, forceNew = false) {
    const contentContainer = document.getElementById('ai-article-container-analysis');
    const statusContainer = document.getElementById('report-status-container-analysis');
    contentContainer.innerHTML = '';
    statusContainer.classList.add('hidden');

    const config = {
        'QualitativeDiligenceMemo': {
            diligenceType: 'Qualitative',
            questions: QUALITATIVE_DILIGENCE_QUESTIONS,
            name: 'Qualitative Diligence'
        },
        'StructuredDiligenceMemo': {
            diligenceType: 'Structured',
            questions: STRUCTURED_DILIGENCE_QUESTIONS,
            name: 'Structured Diligence'
        },
        'MarketSentimentMemo': {
            diligenceType: 'MarketSentiment',
            questions: MARKET_SENTIMENT_QUESTIONS,
            name: 'Market Sentiment'
        }
    };
    const memoConfig = config[reportType];
    const promptConfig = promptMap[reportType];

    try {
        const savedReports = getReportsFromCache(symbol, reportType);

        if (savedReports.length > 0 && !forceNew) {
            const latestReport = savedReports[0];
            displayReport(contentContainer, latestReport.content, latestReport.prompt);
             updateReportStatus(statusContainer, savedReports, latestReport.id, { symbol, reportType, promptConfig });
            return;
        }

        openModal(CONSTANTS.MODAL_LOADING);
        const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);
        loadingMessage.textContent = `Gathering saved answers for ${memoConfig.name} Memo...`;

        const docRef = state.db.collection(CONSTANTS.DB_COLLECTION_FMP_CACHE).doc(symbol).collection('diligence_answers').doc(memoConfig.diligenceType);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            throw new Error(`You must first save your answers for the '${memoConfig.name}' section in the 'Diligence Hub' tab.`);
        }

        const savedData = docSnap.data().answers || [];
        if (savedData.length === 0) {
            throw new Error(`No saved answers found for the '${memoConfig.name}' section.`);
        }

        loadingMessage.textContent = `Synthesizing ${memoConfig.name} Memo...`;

        const qaData = savedData.map(pair => `**Question:** ${pair.question}\n\n**Answer:**\n${pair.answer}`).join('\n\n---\n\n');

        const profile = state.portfolioCache.find(s => s.ticker === symbol) || {};
        const companyName = profile.companyName || symbol;

        const prompt = promptConfig.prompt
            .replace(/{companyName}/g, companyName)
            .replace(/{tickerSymbol}/g, symbol)
            .replace('{qaData}', qaData);

        const memoContent = await generateRefinedArticle(prompt);
        const synthesisData = await extractSynthesisData(memoContent, reportType);
        await autoSaveReport(symbol, reportType, memoContent, prompt, null, synthesisData);

        document.querySelectorAll('#rawDataViewerModal .tab-content').forEach(c => c.classList.add('hidden'));
        document.querySelectorAll('#rawDataViewerModal .tab-button').forEach(b => b.classList.remove('active'));
        document.getElementById('ai-analysis-tab').classList.remove('hidden');
        document.querySelector('.tab-button[data-tab="ai-analysis"]').classList.add('active');

        const refreshedReports = getReportsFromCache(symbol, reportType);

        displayReport(contentContainer, memoContent, prompt);
        updateReportStatus(statusContainer, refreshedReports, refreshedReports[0].id, { symbol, reportType, promptConfig });

        displayMessageInModal(`${memoConfig.name} Memo generated and saved successfully.`, 'info');

    } catch (error) {
        console.error(`Error generating ${memoConfig.name} Memo:`, error);
        displayMessageInModal(`Could not generate memo: ${error.message}`, 'error');
        throw error; // Re-throw to signal failure
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

export async function handleInvestigationSummaryRequest(symbol, forceNew = false) {
    const contentContainer = document.getElementById('ai-article-container-analysis');
    const statusContainer = document.getElementById('report-status-container-analysis');
    contentContainer.innerHTML = '';
    statusContainer.classList.add('hidden');

    try {
        const reportType = 'InvestigationSummaryMemo';
        const promptConfig = promptMap[reportType];
        const savedReports = getReportsFromCache(symbol, reportType);

        if (savedReports.length > 0 && !forceNew) {
            const latestReport = savedReports[0];
            displayReport(contentContainer, latestReport.content, latestReport.prompt);
            updateReportStatus(statusContainer, savedReports, latestReport.id, { symbol, reportType, promptConfig });
            return;
        }

        openModal(CONSTANTS.MODAL_LOADING);
        const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);
        loadingMessage.textContent = "Gathering your manual diligence entries...";

        const diligenceReports = getReportsFromCache(symbol, 'DiligenceInvestigation');
        if (diligenceReports.length === 0) {
            throw new Error("No manual diligence entries found. Please add at least one Q&A entry in the 'Diligence Hub' tab before generating this summary.");
        }

        const qaData = diligenceReports.map(report => {
            const question = report.prompt.split('Diligence Question from User:')[1]?.trim() || 'Question not found.';
            const answer = report.content;
            return `**Question:** ${question}\n\n**Answer:**\n${answer}`;
        }).join('\n\n---\n\n');

        const profile = state.portfolioCache.find(s => s.ticker === symbol) || {};
        const companyName = profile.companyName || symbol;

        const prompt = promptConfig.prompt
            .replace(/{companyName}/g, companyName)
            .replace(/{tickerSymbol}/g, symbol)
            .replace('{qaData}', qaData);

        loadingMessage.textContent = 'AI is synthesizing your investigation notes...';
        const memoContent = await generateRefinedArticle(prompt, loadingMessage);

        const synthesisData = await extractSynthesisData(memoContent, reportType);
        await autoSaveReport(symbol, reportType, memoContent, prompt, null, synthesisData);


        const refreshedReports = getReportsFromCache(symbol, reportType);
        displayReport(contentContainer, memoContent, prompt);
        updateReportStatus(statusContainer, refreshedReports, refreshedReports[0].id, { symbol, reportType, promptConfig });

    } catch (error) {
        console.error("Error generating Investigation Summary Memo:", error);
        displayMessageInModal(`Could not generate summary: ${error.message}`, 'error');
        contentContainer.innerHTML = `<p class="text-red-500">${error.message}</p>`;
        throw error; // Re-throw to signal failure
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}


export async function handleSaveDiligenceAnswers(symbol, diligenceType) {
    const config = {
        'Qualitative': {
            selector: '.qualitative-diligence-answer',
            questions: QUALITATIVE_DILIGENCE_QUESTIONS,
            name: 'Qualitative Diligence'
        },
        'Structured': {
            selector: '.structured-diligence-answer',
            questions: STRUCTURED_DILIGENCE_QUESTIONS,
            name: 'Structured Diligence'
        },
        'MarketSentiment': {
            selector: '.market-sentiment-answer',
            questions: MARKET_SENTIMENT_QUESTIONS,
            name: 'Market Sentiment'
        }
    };

    const sectionConfig = config[diligenceType];
    if (!sectionConfig) {
        displayMessageInModal(`Invalid diligence type for saving: ${diligenceType}`, 'error');
        return;
    }

    const answerElements = document.querySelectorAll(sectionConfig.selector);
    const qaPairs = [];
    let hasAnswers = false;

    answerElements.forEach(textarea => {
        const answer = textarea.value.trim();

        // Find the corresponding question text element in the parent hierarchy
        const questionElement = textarea.closest('.diligence-card').querySelector('[data-question-text]');
        if (!questionElement) {
             console.warn('Could not find question element for textarea.');
             return;
        }

        // Use the actual text from the DOM, which is guaranteed to match the UI
        const question = questionElement.textContent.trim();

        if (question) {
            qaPairs.push({ question, answer });
            if (answer) {
                hasAnswers = true;
            }
        }
    });

    // --- MODIFICATION: Removed the check that prevents saving blank answers ---
    // if (!hasAnswers) {
    //     displayMessageInModal(`Please provide at least one answer for the ${sectionConfig.name} section before saving.`, 'warning');
    //     return;
    // }

    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Saving ${sectionConfig.name} answers...`;

    try {
        const docRef = state.db.collection(CONSTANTS.DB_COLLECTION_FMP_CACHE).doc(symbol).collection('diligence_answers').doc(diligenceType);
        await docRef.set({
            savedAt: firebase.firestore.Timestamp.now(),
            answers: qaPairs
        });

        // --- REMOVED THE CACHE-BUSTING LINE AS IT WAS INEFFECTIVE ---
        // await docRef.get({ source: 'server' }); 

        displayMessageInModal(`${sectionConfig.name} answers have been saved. You can now generate the memo from the 'AI Analysis' tab.`, 'info');

    } catch (error) {
        console.error(`Error saving ${sectionConfig.name} answers:`, error);
        displayMessageInModal(`Could not save answers: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

// --- NEW FUNCTION TO SAVE FINAL THESIS ANSWERS ---
export async function handleSaveFinalThesisAnswers(symbol) {
    const diligenceType = 'FinalThesis';
    const sectionConfig = {
        selector: '.final-thesis-answer',
        questions: FINAL_THESIS_QUESTIONS,
        name: 'Final Thesis Diligence'
    };

    const answerElements = document.querySelectorAll(sectionConfig.selector);
    const qaPairs = [];

    answerElements.forEach(textarea => {
        const answer = textarea.value.trim();
        const questionElement = textarea.closest('.diligence-card').querySelector('[data-question-text]');
        if (!questionElement) {
             console.warn('Could not find question element for textarea.');
             return;
        }
        const question = questionElement.textContent.trim();
        if (question) {
            qaPairs.push({ question, answer });
        }
    });

    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Saving ${sectionConfig.name} answers...`;

    try {
        const docRef = state.db.collection(CONSTANTS.DB_COLLECTION_FMP_CACHE).doc(symbol).collection('diligence_answers').doc(diligenceType);
        await docRef.set({
            savedAt: firebase.firestore.Timestamp.now(),
            answers: qaPairs
        });
        
        // No cache-busting needed here, as it's a separate document.
        
        displayMessageInModal(`${sectionConfig.name} answers have been saved. You can now generate the 'Updated Final Thesis' from the 'AI Analysis' tab.`, 'info');

    } catch (error) {
        console.error(`Error saving ${sectionConfig.name} answers:`, error);
        displayMessageInModal(`Could not save answers: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}
// --- END NEW FUNCTION ---


export async function handleManualDiligenceSave(symbol) {
    const entriesContainer = document.getElementById('manual-diligence-entries-container');
    if (!entriesContainer) return;

    const entryRows = entriesContainer.querySelectorAll('.diligence-entry-row');
    const entriesToSave = [];

    entryRows.forEach(row => {
        const question = row.querySelector('.diligence-question-manual-input').value.trim();
        const answer = row.querySelector('.diligence-answer-manual-input').value.trim();

        if (question && answer) {
            entriesToSave.push({ question, answer });
        }
    });

    if (entriesToSave.length === 0) {
        displayMessageInModal("Please add at least one complete Q&A entry before saving.", "warning");
        return;
    }

    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Saving ${entriesToSave.length} diligence log(s)...`;

    try {
        const savePromises = entriesToSave.map(entry => {
            const prompt = `Diligence Question from User: ${entry.question}`;
            const content = entry.answer;
            return autoSaveReport(symbol, 'DiligenceInvestigation', content, prompt);
        });

        await Promise.all(savePromises);

        entriesContainer.innerHTML = ''; // Clear the input fields
        addDiligenceEntryRow(); // Add back one empty row

        const diligenceReports = getReportsFromCache(symbol, 'DiligenceInvestigation'); // Corrected typo here
        const diligenceLogContainer = document.getElementById('diligence-log-container');
        renderDiligenceLog(diligenceLogContainer, diligenceReports);

        displayMessageInModal(`Successfully saved ${entriesToSave.length} diligence entries.`, 'info');

    } catch (error) {
        console.error("Error saving manual diligence entries:", error);
        displayMessageInModal(`Could not save entries: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

export async function handleDeleteAllDiligenceAnswers(symbol) {
    openConfirmationModal(
        'Delete All Saved Answers?',
        `Are you sure you want to permanently delete all saved diligence answers (Qualitative, Structured, Market Sentiment, Final Thesis) for ${symbol}? This action cannot be undone.`,
        async () => {
            openModal(CONSTANTS.MODAL_LOADING);
            document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Deleting all saved answers for ${symbol}...`;
            try {
                const collectionRef = state.db.collection(CONSTANTS.DB_COLLECTION_FMP_CACHE).doc(symbol).collection('diligence_answers');
                const snapshot = await collectionRef.get();

                if (snapshot.empty) {
                    displayMessageInModal('No saved diligence answers to delete.', 'info');
                    closeModal(CONSTANTS.MODAL_LOADING);
                    return;
                }

                const deletePromises = [];
                snapshot.forEach(doc => {
                    deletePromises.push(doc.ref.delete());
                });

                await Promise.all(deletePromises);

                // Clear text areas in the UI
                document.querySelectorAll('.qualitative-diligence-answer, .structured-diligence-answer, .market-sentiment-answer, .final-thesis-answer').forEach(textarea => {
                    textarea.value = '';
                });

                displayMessageInModal(`Successfully deleted all saved diligence answers for ${symbol}.`, 'info');
            } catch (error) {
                console.error("Error deleting all diligence answers:", error);
                displayMessageInModal(`Could not delete answers: ${error.message}`, 'error');
            } finally {
                closeModal(CONSTANTS.MODAL_LOADING);
            }
        }
    );
}

export async function handleDeleteOldDiligenceLogs(symbol) {
    openConfirmationModal(
        'Delete Old Diligence Logs?',
        `Are you sure you want to permanently delete all old-format, individual diligence log entries ('DiligenceInvestigation') for ${symbol}? This will clean up the "Diligence Log" list but cannot be undone.`,
        async () => {
            openModal(CONSTANTS.MODAL_LOADING);
            document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Deleting old diligence logs for ${symbol}...`;
            try {
                const reportsRef = state.db.collection(CONSTANTS.DB_COLLECTION_AI_REPORTS);
                const q = reportsRef.where("ticker", "==", symbol).where("reportType", "==", "DiligenceInvestigation");
                const querySnapshot = await q.get();

                if (querySnapshot.empty) {
                    displayMessageInModal('No old diligence logs found to delete.', 'info');
                    closeModal(CONSTANTS.MODAL_LOADING);
                    return;
                }

                const deletePromises = [];
                querySnapshot.forEach(doc => {
                    deletePromises.push(doc.ref.delete());
                });

                await Promise.all(deletePromises);

                // Update local cache
                state.reportCache = state.reportCache.filter(r => r.reportType !== 'DiligenceInvestigation' || r.ticker !== symbol);

                // Re-render the log container
                const diligenceLogContainer = document.getElementById('diligence-log-container');
                if (diligenceLogContainer) {
                    renderDiligenceLog(diligenceLogContainer, []); // Render empty log
                }

                displayMessageInModal(`Successfully deleted ${deletePromises.length} old diligence log entries for ${symbol}.`, 'info');
            } catch (error) {
                console.error("Error deleting old diligence logs:", error);
                displayMessageInModal(`Could not delete old logs: ${error.message}`, 'error');
            } finally {
                closeModal(CONSTANTS.MODAL_LOADING);
            }
        }
    );
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
        const reportType = 'FilingDiligence';
        const prompt = `User-answered diligence questions from SEC filing for ${symbol} saved on ${new Date().toLocaleDateString()}`;
        await autoSaveReport(symbol, reportType, reportContent, prompt);

        // Reset UI
        formContainer.innerHTML = '';
        formContainer.classList.add('hidden');
        document.getElementById('filing-diligence-input-container').classList.remove('hidden');
        document.getElementById('filing-diligence-textarea').value = '';

        // Refresh log
        const logContainer = document.getElementById('ongoing-review-log-container');
        const reportTypes = ['FilingDiligence', 'EightKAnalysis', 'UpdatedGarpMemo', 'UpdatedQarpMemo', 'QuarterlyReview', 'AnnualReview'];
        const savedReports = getReportsFromCache(symbol, reportTypes);
        renderOngoingReviewLog(logContainer, savedReports);

        // Show update memo section
        document.getElementById('updated-memo-section').classList.remove('hidden');

        displayMessageInModal('Your filing diligence has been saved successfully.', 'info');
    } catch (error) {
        console.error("Error saving filing diligence:", error);
        displayMessageInModal(`Could not save your answers: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

export async function handleGenerateFilingQuestionsRequest(symbol) {
    const filingTextarea = document.getElementById('filing-diligence-textarea');
    const formContainer = document.getElementById('filing-diligence-form-container');

    const filingText = filingTextarea.value.trim();
    if (!filingText) {
        displayMessageInModal("Please paste the filing text into the text area first.", "warning");
        return;
    }

    openModal(CONSTANTS.MODAL_LOADING);
    const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);
    loadingMessage.textContent = `AI is analyzing the filing to generate questions...`;

    try {
        const profile = state.portfolioCache.find(s => s.ticker === symbol);
        const companyName = profile ? profile.companyName : symbol;

        const promptConfig = promptMap['FilingQuestionGeneration'];
        const prompt = promptConfig.prompt
            .replace('{companyName}', companyName)
            .replace('{filingText}', filingText);

        const aiResponse = await callGeminiApi(prompt);

        const cleanedResponse = aiResponse.trim().replace(/^```json\s*|```\s*$/g, '');
        const questions = JSON.parse(cleanedResponse);

        if (!Array.isArray(questions) || questions.length === 0) {
            throw new Error("AI did not return a valid list of questions.");
        }

        let formHtml = `<div class="text-left mt-4 border rounded-lg p-4 bg-gray-50 space-y-4">`;
        questions.forEach((q, index) => {
            formHtml += `
                <div class="filing-qa-pair p-3 bg-white rounded-lg border border-gray-200">
                    <div class="flex justify-between items-start gap-2 mb-2">
                        <p class="filing-question-text font-semibold text-sm text-indigo-700 flex-grow">${q}</p>
                        <button type="button" class="copy-icon-btn copy-filing-question-btn" title="Copy Question">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125H4.875A1.125 1.125 0 013.75 20.625V7.875c0-.621.504-1.125 1.125-1.125H6.75m9 9.375h3.375c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125h-9.75A1.125 1.125 0 006 9.375v9.75c0 .621.504 1.125 1.125 1.125h3.375m-3.75-9.375V6.125c0-.621.504-1.125 1.125-1.125h9.75c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-3.375" /></svg>
                        </button>
                    </div>
                    <textarea class="filing-answer-textarea w-full border border-gray-300 rounded-lg p-2 text-sm"
                              rows="5"
                              data-question-index="${index}"
                              placeholder="Your analysis and findings here..."></textarea>
                </div>
            `;
        });
        formHtml += `
            <div class="text-right mt-4 flex justify-end gap-2">
                <button type="button" id="cancel-filing-diligence-button" class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg">Cancel</button>
                <button id="save-filing-diligence-button" class="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg">Save Answers</button>
            </div>
        </div>`;

        formContainer.innerHTML = formHtml;
        formContainer.classList.remove('hidden');
        document.getElementById('filing-diligence-input-container').classList.add('hidden');

    } catch (error) {
        console.error("Error generating filing questions:", error);
        displayMessageInModal(`Could not generate questions. The AI may have returned an invalid format. Error: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

export async function handleAnalyzeEightKRequest(symbol) {
    const filingTextarea = document.getElementById('filing-diligence-textarea');
    const filingText = filingTextarea.value.trim();
    if (!filingText) {
        displayMessageInModal("Please paste the 8-K filing text into the text area first.", "warning");
        return;
    }

    openModal(CONSTANTS.MODAL_LOADING);
    const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);
    loadingMessage.textContent = `AI is analyzing the 8-K filing...`;

    try {
        const profile = state.portfolioCache.find(s => s.ticker === symbol);
        const companyName = profile ? profile.companyName : symbol;

        const reportType = 'EightKAnalysis';
        const promptConfig = promptMap[reportType];
        const prompt = promptConfig.prompt
            .replace('{companyName}', companyName)
            .replace('{filingText}', filingText);

        const analysisResult = await generateRefinedArticle(prompt);

        await autoSaveReport(symbol, reportType, analysisResult, prompt);

        filingTextarea.value = ''; // Clear textarea after successful analysis

        // Refresh the log
        const logContainer = document.getElementById('ongoing-review-log-container');
        const reportTypes = ['FilingDiligence', 'EightKAnalysis', 'UpdatedGarpMemo', 'UpdatedQarpMemo', 'QuarterlyReview', 'AnnualReview'];
        const savedReports = getReportsFromCache(symbol, reportTypes);
        renderOngoingReviewLog(logContainer, savedReports);

        // Optionally display the generated report
        const displayContainer = document.getElementById('ongoing-review-display-container');
        if (displayContainer) {
            displayReport(displayContainer, analysisResult, prompt);
        }

        displayMessageInModal('8-K analysis saved to the log.', 'info');

    } catch (error) {
        console.error("Error analyzing 8-K filing:", error);
        displayMessageInModal(`Could not complete 8-K analysis: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}


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
                const reportTypes = ['FilingDiligence', 'EightKAnalysis', 'UpdatedGarpMemo', 'UpdatedQarpMemo', 'QuarterlyReview', 'AnnualReview'];
                const savedReports = getReportsFromCache(ticker, reportTypes);
                renderOngoingReviewLog(logContainer, savedReports);

                // Clear display if the deleted report was showing
                if (displayContainer && displayContainer.dataset.displayingReportId === reportId) {
                    displayContainer.innerHTML = '';
                    delete displayContainer.dataset.displayingReportId;
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
        // Gather logs - Prioritize FilingDiligence, then Investigations, then 8-Ks
        const filingDiligenceReports = getReportsFromCache(symbol, 'FilingDiligence');
        const diligenceInvestigationReports = getReportsFromCache(symbol, 'DiligenceInvestigation');
        const eightKReports = getReportsFromCache(symbol, 'EightKAnalysis');

        let combinedDiligenceLog = '';
        const logs = [];

        if (filingDiligenceReports.length > 0) {
            logs.push(`**Recent Filing Q&A (from ${filingDiligenceReports[0].savedAt.toDate().toLocaleDateString()}):**\n${filingDiligenceReports[0].content}`);
        }
        if (diligenceInvestigationReports.length > 0) {
             const investigationLog = diligenceInvestigationReports.map(report => {
                const question = report.prompt.split('Diligence Question from User:')[1]?.trim() || 'Question not found.';
                const answer = report.content;
                return `**Manual Q&A (${report.savedAt.toDate().toLocaleDateString()}):**\n*Question:* ${question}\n*Answer:* ${answer}`;
            }).join('\n\n---\n\n');
             logs.push(investigationLog);
        }
        if (eightKReports.length > 0) {
            const eightKLog = eightKReports.map(report => `**8-K Analysis Summary (${report.savedAt.toDate().toLocaleDateString()}):**\n${report.content}`).join('\n\n---\n\n');
            logs.push(eightKLog);
        }

        combinedDiligenceLog = logs.length > 0 ? logs.join('\n\n---\n\n') : 'No recent diligence logs available.';

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
                .replace('{diligenceLog}', combinedDiligenceLog);
        } else { // GARP
            // Needs original candidacy + structured/qual/sentiment memos
            const candidacyReports = getReportsFromCache(symbol, 'GarpCandidacy');
            const structuredMemoReports = getReportsFromCache(symbol, 'StructuredDiligenceMemo');
            const qualitativeMemoReports = getReportsFromCache(symbol, 'QualitativeDiligenceMemo');
            const marketSentimentMemoReports = getReportsFromCache(symbol, 'MarketSentimentMemo');

            if (candidacyReports.length === 0) throw new Error(`The foundational 'GARP Analysis Report' must be generated first.`);
            if (structuredMemoReports.length === 0 || qualitativeMemoReports.length === 0 || marketSentimentMemoReports.length === 0) {
                throw new Error("Missing prerequisite diligence memos (Structured, Qualitative, or Market Sentiment) required for GARP Memo synthesis.");
            }

            const candidacyReportContent = (candidacyReports[0].content || '').split('## Actionable Diligence Questions')[0].trim();

            prompt = promptTemplate // Using UPDATED_GARP_MEMO_PROMPT structure
                .replace(/{companyName}/g, companyName)
                .replace(/{tickerSymbol}/g, symbol)
                .replace('{scorecardJson}', JSON.stringify(scorecardData, null, 2))
                .replace('{garpCandidacyReport}', candidacyReportContent)
                .replace('{structuredDiligenceMemo}', structuredMemoReports[0].content)
                .replace('{qualitativeDiligenceMemo}', qualitativeMemoReports[0].content)
                .replace('{marketSentimentMemo}', marketSentimentMemoReports[0].content);
        }

        const memoContent = await generateRefinedArticle(prompt);

        await autoSaveReport(symbol, reportType, memoContent, prompt);

        updatedMemoContainer.innerHTML = `<div class="prose max-w-none">${marked.parse(memoContent)}</div>`;
        displayMessageInModal(`Updated ${memoType} Memo generated and saved.`, 'info');

        // Refresh log
        const logContainer = document.getElementById('ongoing-review-log-container');
        const reportTypes = ['FilingDiligence', 'EightKAnalysis', 'UpdatedGarpMemo', 'UpdatedQarpMemo', 'QuarterlyReview', 'AnnualReview'];
        const savedReports = getReportsFromCache(symbol, reportTypes);
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
    openConfirmationModal(
        'Delete Log Entry?',
        'Are you sure you want to permanently delete this Q&A entry? This action cannot be undone.',
        async () => {
            openModal(CONSTANTS.MODAL_LOADING);
            document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Deleting entry...`;
            try {
                await state.db.collection(CONSTANTS.DB_COLLECTION_AI_REPORTS).doc(reportId).delete();

                state.reportCache = state.reportCache.filter(r => r.id !== reportId);

                const diligenceReports = getReportsFromCache(ticker, 'DiliglenceInvestigation');
                const diligenceLogContainer = document.getElementById('diligence-log-container');
                renderDiligenceLog(diligenceLogContainer, diligenceReports);

                // Clear display if showing deleted report
                const articleContainer = document.getElementById('ai-article-container-analysis');
                const statusContainer = document.getElementById('report-status-container-analysis');
                 // Check if the currently displayed report is the one being deleted
                if (statusContainer && statusContainer.dataset.activeReportId === reportId) {
                    articleContainer.innerHTML = '';
                    statusContainer.classList.add('hidden');
                    delete statusContainer.dataset.activeReportId;
                }


                displayMessageInModal('Diligence log entry deleted.', 'info');
            } catch (error) {
                console.error("Error deleting diligence log:", error);
                displayMessageInModal(`Could not delete entry: ${error.message}`, 'error');
            } finally {
                closeModal(CONSTANTS.MODAL_LOADING);
            }
        }
    );
}

async function _fetchAndCachePeerData(tickers) {
    if (!state.fmpApiKey) {
        throw new Error("FMP API key is required to fetch peer data.");
    }
    const successfullyFetchedTickers = [];
    
    // --- START MODIFICATION ---
    // Use the full list of endpoints required for the scorecard
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
    const totalEndpoints = tickers.length * coreEndpoints.length;
    // --- END MODIFICATION ---

    let fetchedCount = 0;

    const progressBarFill = document.getElementById('progress-bar-fill');
    const progressStatus = document.getElementById('progress-status');
    const currentReportName = document.getElementById('current-report-name');
    const progressContainer = document.getElementById('progress-container');

    if (progressContainer) {
        progressContainer.classList.remove('hidden');
        progressStatus.textContent = 'Fetching Peer Data';
        progressBarFill.style.width = '0%';
    }


    for (const ticker of tickers) {
        let allEndpointsFetched = true;
        try {
            // --- START MODIFICATION ---
            // Check for a more critical endpoint to see if cache is complete
            const checkDocRef = state.db.collection(CONSTANTS.DB_COLLECTION_FMP_CACHE).doc(ticker).collection('endpoints').doc('income_statement_annual');
            const checkDocSnap = await checkDocRef.get();

            if (checkDocSnap.exists) {
            // --- END MODIFICATION ---
                console.log(`Peer data for ${ticker} likely in cache. Skipping fetch.`);
                successfullyFetchedTickers.push(ticker);
                fetchedCount += coreEndpoints.length; // Assume all are cached if profile is
                if (progressBarFill) {
                    const progress = Math.min(100, (fetchedCount / totalEndpoints) * 100);
                    progressBarFill.style.width = `${progress}%`;
                }
                continue;
            }

            if (currentReportName) {
                currentReportName.textContent = `Fetching data for ${ticker}...`;
            }
            
            // --- START MODIFICATION ---
            // Use the more robust loop from handleRefreshFmpData
            for (const endpoint of coreEndpoints) {
                let url;
                const version = endpoint.version || 'v3';

                if (version === 'stable') {
                    url = `https://financialmodelingprep.com/stable/${endpoint.path}?symbol=${ticker}&${endpoint.params ? endpoint.params + '&' : ''}apikey=${state.fmpApiKey}`;
                } else {
                    url = `https://financialmodelingprep.com/api/${version}/${endpoint.path}/${ticker}?${endpoint.params ? endpoint.params + '&' : ''}apikey=${state.fmpApiKey}`;
                }
            // --- END MODIFICATION ---

                const data = await callApi(url);

                if (data && (!Array.isArray(data) || data.length > 0)) {
                    const endpointDocRef = state.db.collection(CONSTANTS.DB_COLLECTION_FMP_CACHE).doc(ticker).collection('endpoints').doc(endpoint.name);
                    await endpointDocRef.set({ cachedAt: firebase.firestore.Timestamp.now(), data: data });
                } else {
                    console.warn(`No data returned from FMP for peer endpoint: ${endpoint.name} for ticker ${ticker}.`);
                    allEndpointsFetched = false;
                }
                fetchedCount++;
                if (progressBarFill) {
                    const progress = Math.min(100, (fetchedCount / totalEndpoints) * 100);
                    progressBarFill.style.width = `${progress}%`;
                }
            }

            if (allEndpointsFetched) {
                successfullyFetchedTickers.push(ticker);
            } else {
                console.warn(`Incomplete data fetched for ${ticker}. It will be excluded from analysis.`);
            }

        } catch (error) {
            console.error(`Error fetching data for peer ${ticker}:`, error);
        }
    }
    if (progressContainer) {
        progressContainer.classList.add('hidden');
    }
    return successfullyFetchedTickers;
}


async function runPeerAnalysis(primaryTicker, peerTickers) {
    const container = document.getElementById('peer-analysis-content-container');
    const companyFmpData = await getFmpStockData(primaryTicker);
    if (!companyFmpData) throw new Error(`Could not get data for primary ticker ${primaryTicker}.`);

    const peerDataPromises = peerTickers.map(peerTicker => getFmpStockData(peerTicker));
    const allPeerFmpData = await Promise.all(peerDataPromises);

    const peerMetricsList = allPeerFmpData.filter(Boolean).map(fmpData => _calculateGarpScorecardMetrics(fmpData));

    if (peerMetricsList.length === 0) {
        throw new Error("Could not calculate metrics for any identified peers.");
    }

    const peerAverages = {};
    const metricKeys = Object.keys(peerMetricsList[0]); // Use keys from the first peer's metrics

    for (const key of metricKeys) {
        if (key === 'garpConvictionScore') continue; // Exclude score from average

        // Check if the key exists in the first peer's metrics (should exist in all if calculated)
        const sampleMetric = peerMetricsList[0][key];
        if (!sampleMetric || typeof sampleMetric.value === 'undefined') continue; // Skip if metric structure is unexpected


        const values = peerMetricsList
            .map(metrics => metrics[key]?.value) // Safely access value
            .filter(v => typeof v === 'number' && isFinite(v));

        if (values.length > 0) {
            peerAverages[key] = values.reduce((sum, v) => sum + v, 0) / values.length;
        } else {
             peerAverages[key] = null; // Indicate no valid data for averaging
        }
    }

    const companyMetrics = _calculateGarpScorecardMetrics(companyFmpData);
    const finalPeerDataObject = {
        peers: peerTickers,
        averages: peerAverages,
        cachedAt: firebase.firestore.Timestamp.now()
    };

    // Save to Firestore
    const peerDocRef = state.db.collection(CONSTANTS.DB_COLLECTION_FMP_CACHE).doc(primaryTicker).collection('analysis').doc('peer_comparison');
    await peerDocRef.set(finalPeerDataObject);

    // Render the table
    if (container) { // Check if container exists before rendering
        renderPeerComparisonTable(container, primaryTicker, companyMetrics, finalPeerDataObject);
    } else {
        console.error("Peer analysis content container not found for rendering.");
    }
}

export async function handleManualPeerAnalysisRequest(ticker) {
    const input = document.getElementById('manual-peer-input');
    if (!input) return;

    const tickersStr = input.value.trim();
    if (!tickersStr) {
        displayMessageInModal("Please enter at least one peer ticker.", "warning");
        return;
    }

    const peerTickers = tickersStr.split(',').map(t => t.trim().toUpperCase()).filter(Boolean);
    const genericLoader = document.getElementById('generic-loader-container');
    const progressContainer = document.getElementById('progress-container'); // Get progress container

    try {
        openModal(CONSTANTS.MODAL_LOADING);
        genericLoader?.classList.add('hidden'); // Hide generic loader if exists
        progressContainer?.classList.remove('hidden'); // Show progress bar container

        const fetchedPeers = await _fetchAndCachePeerData(peerTickers); // Fetch/cache data with progress
        await runPeerAnalysis(ticker, fetchedPeers); // Run analysis using cached data

         // Hide manual entry after successful analysis
        const manualEntryContainer = document.getElementById('manual-peer-entry-container');
        if (manualEntryContainer) manualEntryContainer.classList.add('hidden');


    } catch (error) {
        console.error("Error handling manual peer analysis:", error);
        const container = document.getElementById('peer-analysis-content-container');
        if (container) { // Check if container exists
             container.innerHTML = `<p class="text-red-500 p-4">Could not complete manual peer analysis: ${error.message}</p>`;
        }
        // Keep manual entry visible on error
        const manualEntryContainer = document.getElementById('manual-peer-entry-container');
        if (manualEntryContainer) manualEntryContainer.classList.remove('hidden');

    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
        genericLoader?.classList.remove('hidden'); // Show generic loader again
        progressContainer?.classList.add('hidden'); // Hide progress bar
    }
}

export async function handleCopyReportRequest(symbol, reportType, buttonElement) {
    if (!buttonElement) return;

    try {
        const reports = getReportsFromCache(symbol, reportType);
        if (reports.length === 0) {
            displayMessageInModal(`No saved '${ANALYSIS_NAMES[reportType]}' report found to copy.`, 'warning');
            return;
        }

        const latestReport = reports[0];
        // Basic conversion: remove markdown headers, bolding, list markers
        const plainText = latestReport.content
            .replace(/^(#+)\s/gm, '') // Remove headers
            .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
            .replace(/^- /gm, '') // Remove list markers
            .replace(/---/g,'') // Remove horizontal rules
            .trim();

        await navigator.clipboard.writeText(plainText);

        const originalIcon = buttonElement.innerHTML;
        const checkIcon = `<svg class="w-5 h-5 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>`;
        buttonElement.innerHTML = checkIcon;
        buttonElement.disabled = true;

        setTimeout(() => {
            buttonElement.innerHTML = originalIcon;
            buttonElement.disabled = false;
        }, 2000);

    } catch (error) {
        console.error("Error copying report:", error);
        displayMessageInModal(`Could not copy report: ${error.message}`, 'error');
    }
}

export async function handleFullAnalysisWorkflow(symbol) {
    const preliminaryStage = []; // Still empty

    const foundationalStage = [
        { reportType: 'MoatAnalysis', handler: handleAnalysisRequest },
        { reportType: 'CapitalAllocators', handler: handleAnalysisRequest },
        { reportType: 'QualitativeDiligenceMemo', handler: handleDiligenceMemoRequest },
        { reportType: 'StructuredDiligenceMemo', handler: handleDiligenceMemoRequest },
        { reportType: 'MarketSentimentMemo', handler: handleDiligenceMemoRequest },
        { reportType: 'InvestigationSummaryMemo', handler: handleInvestigationSummaryRequest }
    ];

    const synthesisStage = [
        { reportType: 'LongTermCompounder', handler: handleCompounderMemoRequest },
        { reportType: 'BmqvMemo', handler: handleBmqvMemoRequest },
        { reportType: 'InvestmentMemo', handler: handleGarpMemoRequest },
        { reportType: 'QarpAnalysis', handler: handleAnalysisRequest }
    ];

    const finalStage = [
        { reportType: 'FinalInvestmentThesis', handler: handleFinalThesisRequest }
    ];
    const updatedFinalStage = [
        { reportType: 'UpdatedFinalThesis', handler: handleUpdatedFinalThesisRequest }
    ];

    const allStages = [
        { name: 'Preliminary Analysis', reports: preliminaryStage },
        { name: 'Foundational Analysis', reports: foundationalStage },
        { name: 'Synthesis Memos', reports: synthesisStage },
        { name: 'Final Thesis', reports: finalStage },
        { name: 'Updated Final Thesis', reports: updatedFinalStage }
    ];

    openModal(CONSTANTS.MODAL_LOADING);
    const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);
    const progressContainer = document.getElementById('progress-container');
    const progressStatus = document.getElementById('progress-status');
    const currentReportName = document.getElementById('current-report-name');
    const progressBarFill = document.getElementById('progress-bar-fill');

    progressContainer.classList.remove('hidden');
    progressBarFill.style.width = '0%';

    let totalReports = 0;
    allStages.forEach(stage => totalReports += stage.reports.filter(r => !r.isSilent).length);
    let completedReports = 0;

    try {
        for (const stage of allStages) {
            if (stage.reports.filter(r => !r.isSilent).length > 0) {
                 progressStatus.textContent = `Running Stage: ${stage.name}...`;
            }

            for (const step of stage.reports) {
                const reportType = step.reportType;
                const handler = step.handler;
                const promptConfig = promptMap[reportType]; // Get prompt config here

                if (!step.isSilent) {
                    currentReportName.textContent = `Generating: ${ANALYSIS_NAMES[reportType]}...`;
                }

                // --- CORRECTED LOGIC ---
                if (reportType === 'InvestigationSummaryMemo') {
                    await handler(symbol, true); // forceNew = true
                } else if (['QualitativeDiligenceMemo', 'StructuredDiligenceMemo', 'MarketSentimentMemo'].includes(reportType)) {
                    await handler(symbol, reportType, true); // Pass reportType and forceNew = true
                } else if (reportType === 'UpdatedFinalThesis') {
                    await handler(symbol, true); // forceNew = true
                } else {
                    // Default case for handleAnalysisRequest, handleGarpMemoRequest, etc.
                    await handler(symbol, reportType, promptConfig, true); // Pass all expected args + forceNew = true
                }
                // --- END CORRECTION ---

                const analysisContentContainer = document.getElementById('analysis-content-container');
                if (analysisContentContainer) {
                    const button = analysisContentContainer.querySelector(`button[data-report-type="${reportType}"]`);
                    if (button) {
                        button.classList.add('has-saved-report');
                    }
                }

                if (!step.isSilent) {
                    completedReports++;
                    const progress = (completedReports / totalReports) * 100;
                    progressBarFill.style.width = `${progress}%`;
                }
            }
        }

        displayMessageInModal(`Full analysis workflow for ${symbol} completed successfully.`, 'info');

    } catch (error) {
        console.error("Error during full analysis workflow:", error);
        const failedReportName = currentReportName.textContent.replace('Generating: ', '');
        displayMessageInModal(`Workflow failed during "${failedReportName}". Reason: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
        progressContainer.classList.add('hidden');
    }
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
        const reportTypes = ['FilingDiligence', 'EightKAnalysis', 'UpdatedGarpMemo', 'UpdatedQarpMemo', 'QuarterlyReview', 'AnnualReview'];
        const savedReports = getReportsFromCache(symbol, reportTypes);
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
