// fileName: ui-handlers.js
import { CONSTANTS, state, promptMap, ANALYSIS_REQUIREMENTS, ANALYSIS_NAMES } from './config.js';
import { callApi, callGeminiApi, generateRefinedArticle, generatePolishedArticleForSynthesis, getFmpStockData } from './api.js';
import { getFirestore, Timestamp, doc, setDoc, getDoc, deleteDoc, collection, getDocs, query, limit, addDoc, updateDoc, where, orderBy } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { openModal, closeModal, displayMessageInModal, openConfirmationModal, openManageStockModal, openDiligenceWarningModal } from './ui-modals.js';
import { renderPortfolioManagerList, displayReport, updateReportStatus, fetchAndCachePortfolioData, updateGarpCandidacyStatus, renderCandidacyAnalysis, renderGarpAnalysisSummary, renderDiligenceLog, renderPeerComparisonTable, renderSectorMomentumHeatMap } from './ui-render.js';
import { _calculateFinancialAnalysisMetrics, _calculateMoatAnalysisMetrics, _calculateRiskAssessmentMetrics, _calculateCapitalAllocatorsMetrics, _calculateGarpAnalysisMetrics, _calculateGarpScorecardMetrics, CALCULATION_SUMMARIES } from './analysis-helpers.js';

// --- UTILITY HELPERS ---
export async function getSavedReports(ticker, reportType) {
    try {
        const reportsRef = collection(state.db, CONSTANTS.DB_COLLECTION_AI_REPORTS);
        const q = query(reportsRef, where("ticker", "==", ticker), where("reportType", "==", reportType), orderBy("savedAt", "desc"));
        const querySnapshot = await getDocs(q);
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

async function autoSaveReport(ticker, reportType, content, prompt, diligenceQuestions = null) {
    try {
        const reportData = {
            ticker,
            reportType,
            content,
            prompt: prompt || '',
            savedAt: Timestamp.now(),
            diligenceQuestions: diligenceQuestions // Save the questions with the report
        };
        await addDoc(collection(state.db, CONSTANTS.DB_COLLECTION_AI_REPORTS), reportData);
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
        const dateYTD = new Date(today.getFullYear(), 0, 2); 

        const record1M = findClosestDateRecord(date1M);
        const record3M = findClosestDateRecord(date3M);
        const recordYTD = findClosestDateRecord(dateYTD);

        const processedData = sectors.map(sector => {
            const latestPerf = latestData[sector];
            const calcPerf = (startRecord) => {
                if (!startRecord || !startRecord[sector] || startRecord[sector] === 0) return null;
                return ((latestPerf / startRecord[sector]) - 1) * 100;
            };
            
            return {
                sector: sector.replace(/([A-Z])/g, ' $1').replace('Changes Percentage','').trim(),
                perf1M: calcPerf(record1M),
                perf3M: calcPerf(record3M),
                perfYTD: calcPerf(recordYTD)
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

    const stockData = {
        ticker: newTicker,
        companyName: document.getElementById('manage-stock-name').value.trim(),
        exchange: document.getElementById('manage-stock-exchange').value.trim(),
        status: document.getElementById('manage-stock-status').value.trim(),
        sector: document.getElementById('manage-stock-sector').value.trim(),
        industry: document.getElementById('manage-stock-industry').value.trim(),
        transactions: transactions,
        // Set old fields to null to clean up data model
        purchaseDate: null, 
        shares: null,
        costPerShare: null
    };

    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = "Saving to your lists...";
    
    try {
        if (originalTicker && originalTicker !== newTicker) {
            await deleteDoc(doc(state.db, CONSTANTS.DB_COLLECTION_PORTFOLIO, originalTicker));
        }

        await setDoc(doc(state.db, CONSTANTS.DB_COLLECTION_PORTFOLIO, newTicker), stockData, { merge: true });

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

            <h3 class="text-lg font-bold text-gray-800 mb-2">Step 2: Generate the GARP Candidacy Report</h3>
            <p class="text-sm text-gray-600 mb-4">
                This is the most critical step for an initial assessment. In the stock's analysis panel, go to the "Dashboard" tab and click "Analyze Candidacy". This calculates the stock's key metrics, generates the proprietary <strong>GARP Conviction Score</strong>, and creates an initial bull/bear case. This step answers the question: "Is this stock even a potential GARP candidate?"
            </p>

            <h3 class="text-lg font-bold text-gray-800 mb-2">Step 3: Fetch Peer Comparison</h3>
            <p class="text-sm text-gray-600 mb-4">
                To ground the scorecard numbers in reality, click the "Fetch Peer Data" button on the "Dashboard" tab. This uses AI to identify direct competitors and compares key metrics against the peer average. This step provides crucial <strong>context</strong> to the company's valuation and performance.
            </p>

            <h3 class="text-lg font-bold text-gray-800 mb-2">Step 4: Conduct Deeper Diligence (Optional)</h3>
            <p class="text-sm text-gray-600 mb-4">
                If the stock still looks promising, use the tools in the "AI Analysis" tab to build higher conviction. You can run specialized "Deep Dive" reports (like Moat or Risk Assessment) or use the "Diligence Investigation" tool to ask the AI specific questions that arose during your analysis.
            </p>

            <h3 class="text-lg font-bold text-gray-800 mb-2">Step 5: Synthesize the Investment Memo</h3>
            <p class="text-sm text-gray-600">
                This is the final step where all research comes together. Clicking "Generate GARP Memo" synthesizes the Candidacy Report, the quantitative scorecard, your diligence log, and the peer comparison data into a formal investment memo with a clear buy, sell, or hold recommendation.
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
        const savedReports = await getSavedReports(ticker, reportType);

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
        
        // --- MODIFIED LOGIC ---
        const memoReports = await getSavedReports(ticker, 'InvestmentMemo');
        let sourceReportContent;
        
        if (memoReports.length > 0) {
            // Prioritize the InvestmentMemo
            sourceReportContent = memoReports[0].content;
        } else {
            // Fallback to GarpCandidacy report
            const candidacyReports = await getSavedReports(ticker, 'GarpCandidacy');
            if (candidacyReports.length === 0) {
                throw new Error(`The foundational 'GARP Candidacy Report' or 'Investment Memo' has not been generated yet. Please generate one from the 'Dashboard' or 'AI Analysis' tab first.`);
            }
            sourceReportContent = candidacyReports[0].content;
        }
        
        if (!fmpData || !fmpData.profile || !fmpData.profile.length === 0) {
            throw new Error(`Could not retrieve the latest price data for ${ticker}.`);
        }

        const currentPrice = fmpData.profile[0].price;
        const { companyName, transactions } = portfolioData;

        // --- Calculate position details from transactions ---
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
            .replace('{investmentMemoContent}', sourceReportContent)
            .replace('{positionDetails}', JSON.stringify(positionDetails, null, 2))
            .replace('{currentPrice}', `$${currentPrice.toFixed(2)}`);

        const analysisResult = await callGeminiApi(prompt);
        
        const finalHtml = marked.parse(analysisResult);
        await autoSaveReport(ticker, reportType, finalHtml, prompt);
        
        const refreshedReports = await getSavedReports(ticker, reportType);

        displayReport(container, finalHtml, prompt);
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
        const newScore = scorecardData.garpConvictionScore;

        // Save the new score to the database
        const stockDocRef = doc(state.db, CONSTANTS.DB_COLLECTION_PORTFOLIO, ticker);
        await updateDoc(stockDocRef, { garpConvictionScore: newScore });
        
        // Refresh local cache to reflect the change immediately
        await fetchAndCachePortfolioData();

        const profile = fmpData.profile?.[0] || {};
        const companyName = profile.companyName || ticker;
        const tickerSymbol = profile.symbol || ticker;
        const sector = profile.sector || 'N/A';
        const peerDocRef = doc(state.db, CONSTANTS.DB_COLLECTION_FMP_CACHE, ticker, 'analysis', 'peer_comparison');
        const peerDocSnap = await getDoc(peerDocRef);
        const peerAverages = peerDocSnap.exists() ? peerDocSnap.data().averages : null;
        const peerDataChanges = peerDocSnap.exists() ? peerDocSnap.data().changes : null;


        // Check for hyper-growth to generate diligence questions
        const epsNext1yValue = scorecardData['EPS Growth (Next 1Y)'].value;
        const diligenceQuestions = [];

        if (epsNext1yValue > 0.40) {
            diligenceQuestions.push({
                humanQuestion: `What are the key drivers behind the projected near-term hyper-growth (${(epsNext1yValue * 100).toFixed(2)}% EPS Growth), and how sustainable are these factors beyond the next fiscal year?`,
                aiQuery: `${companyName} (${tickerSymbol}) EPS growth guidance Q3 2024 earnings call transcript revenue backlog contracts 2025 outlook analyst day presentation`
            });
        }

        const cleanScorecard = {};
        for (const [key, value] of Object.entries(scorecardData)) {
            if (key === 'garpConvictionScore') continue;
            
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
            garpConvictionScore: scorecardData.garpConvictionScore,
            peerAverages: peerAverages,
            peerDataChanges: peerDataChanges,
            diligenceQuestions: diligenceQuestions
        };

        const promptConfig = promptMap['GarpCandidacy'];
        let prompt = promptConfig.prompt
            .replace(/{companyName}/g, companyName)
            .replace(/{tickerSymbol}/g, tickerSymbol)
            .replace(/{sector}/g, sector)
            .replace('{jsonData}', JSON.stringify(payload, null, 2));
            
        // Manually handle the diligence questions section
        if (diligenceQuestions.length > 0) {
            let questionsHtml = `
(1 paragraph)
Based on your analysis, propose 2-3 critical diligence questions. For each question, you MUST provide two parts:
1.  **Human-Led Question:** A high-level, strategic question for an analyst to answer through deeper research and judgment.
2.  **Suggested AI Investigation Query:** A specific, fact-based query designed to be used with a search-enabled AI (like the 'Diligence Investigation' tool) to find source material. This query should target information from recent earnings calls, SEC filings (10-K, 10-Q), or investor presentations.

Format each item precisely like this:
`;
            questionsHtml += diligenceQuestions.map(q => `
- **Human-Led Question:** ${q.humanQuestion}
- **Suggested AI Investigation Query:** "${q.aiQuery}"
`).join('\n');
            prompt = prompt.replace('{diligenceQuestions}', questionsHtml);
        } else {
            prompt = prompt.replace('{diligenceQuestions}', 'No critical diligence questions were identified by the AI in this initial assessment.');
        }

        const analysisResult = await generateRefinedArticle(prompt);
        renderCandidacyAnalysis(resultContainer, analysisResult, prompt, diligenceQuestions);
        
        const reportType = 'GarpCandidacy';
        await autoSaveReport(ticker, reportType, analysisResult, prompt, diligenceQuestions);
        
        const reports = await getSavedReports(ticker, reportType);
        if (reports.length > 0) {
            updateGarpCandidacyStatus(statusContainer, reports, reports[0].id, ticker);
        }

    } catch (error) {
        console.error("Error in GARP Candidacy Request:", error);
        resultContainer.innerHTML = `<p class="text-center text-red-500 p-4">${error.message}</p>`;
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

        loadingMessage.textContent = "Gathering data for memo synthesis...";
        
        const candidacyReports = await getSavedReports(symbol, 'GarpCandidacy');
        if (candidacyReports.length === 0) {
            throw new Error(`Cannot generate memo. Please generate the "GARP Candidacy Report" from Step 1 first.`);
        }
        const candidacyReport = candidacyReports[0];

        // --- NEW: AI-powered check for un-investigated diligence questions ---
        if (candidacyReport.diligenceQuestions && candidacyReport.diligenceQuestions.length > 0) {
            loadingMessage.textContent = "AI is verifying diligence log...";
            
            const diligenceReports = await getSavedReports(symbol, 'DiligenceInvestigation');
            const answeredQuestions = diligenceReports.map(report => {
                return report.prompt.split('Diligence Question from User:')[1]?.trim() || '';
            }).filter(Boolean);

            if (answeredQuestions.length > 0) {
                const requiredQuestion = candidacyReport.diligenceQuestions[0].humanQuestion;

                const validationPrompt = `
                Role: You are a meticulous research assistant.
                Task: Your sole purpose is to determine if a list of "Answered Questions" sufficiently addresses the core topic of a "Required Critical Question".
                Constraints:
                - You MUST return ONLY the word "Yes" or "No".
                - Do NOT return any other text, explanation, or punctuation.
                - "Yes" means the answered questions cover the topic.
                - "No" means they do not.

                Required Critical Question:
                "${requiredQuestion}"

                List of Answered Questions:
                ${answeredQuestions.map(q => `- "${q}"`).join('\n')}
                `.trim();

                const validationResponse = await callGeminiApi(validationPrompt);

                if (validationResponse.trim().toLowerCase().includes('yes')) {
                    loadingMessage.textContent = "Diligence verified. Continuing memo generation...";
                } else {
                    closeModal(CONSTANTS.MODAL_LOADING);
                    return openDiligenceWarningModal(symbol, candidacyReport.diligenceQuestions, () => {
                         handleInvestmentMemoRequest(symbol, true);
                    });
                }
            } else {
                closeModal(CONSTANTS.MODAL_LOADING);
                return openDiligenceWarningModal(symbol, candidacyReport.diligenceQuestions, () => {
                     handleInvestmentMemoRequest(symbol, true);
                });
            }
        }

        const diligenceReports = await getSavedReports(symbol, 'DiligenceInvestigation');
        let diligenceLog = 'No recent diligence is available.';
        if (diligenceReports.length > 0) {
            diligenceLog = diligenceReports.map(report => {
                const question = report.prompt.split('Diligence Question from User:')[1]?.trim() || 'Question not found.';
                const answer = report.content;
                return `**Question:** ${question}\n\n**Answer:**\n${answer}\n\n---`;
            }).join('\n\n');
        }

        const data = await getFmpStockData(symbol);
        if (!data) throw new Error(`Could not retrieve financial data for ${symbol}.`);
        const scorecardData = _calculateGarpScorecardMetrics(data);

        const profile = data.profile?.[0] || {};
        const companyName = profile.companyName || 'the company';

        // Fetch peer data
        const peerDocRef = doc(state.db, CONSTANTS.DB_COLLECTION_FMP_CACHE, symbol, 'analysis', 'peer_comparison');
        const peerDocSnap = await getDoc(peerDocRef);
        let peerAverages = { "note": "Peer data has not been generated for this stock yet." };
        if (peerDocSnap.exists()) {
            peerAverages = peerDocSnap.data().averages || peerAverages;
        }
        
        let peerDataChanges = {}; // Placeholder for now

        const prompt = promptMap.InvestmentMemo.prompt
            .replace(/{companyName}/g, companyName)
            .replace(/{tickerSymbol}/g, symbol)
            .replace('{candidacyReport}', candidacyReport.content)
            .replace('{scorecardJson}', JSON.stringify(scorecardData, null, 2))
            .replace('{diligenceLog}', diligenceLog)
            .replace('{peerAverages}', JSON.stringify(peerAverages, null, 2))
            .replace('{peerDataChanges}', JSON.stringify(peerDataChanges, null, 2));

        const memoContent = await generateRefinedArticle(prompt, loadingMessage);
        
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
            const content = marked.parse(entry.answer);
            return autoSaveReport(symbol, 'DiligenceInvestigation', content, prompt);
        });

        await Promise.all(savePromises);

        entriesContainer.innerHTML = '';
        const diligenceReports = await getSavedReports(symbol, 'DiligenceInvestigation');
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

export async function handleDeleteDiligenceLog(reportId, ticker) {
    openConfirmationModal(
        'Delete Log Entry?',
        'Are you sure you want to permanently delete this Q&A entry? This action cannot be undone.',
        async () => {
            openModal(CONSTANTS.MODAL_LOADING);
            document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Deleting entry...`;
            try {
                await deleteDoc(doc(state.db, CONSTANTS.DB_COLLECTION_AI_REPORTS, reportId));

                const diligenceReports = await getSavedReports(ticker, 'DiligenceInvestigation');
                const diligenceLogContainer = document.getElementById('diligence-log-container');
                renderDiligenceLog(diligenceLogContainer, diligenceReports);

                const articleContainer = document.getElementById('ai-article-container');
                const statusContainer = document.getElementById('report-status-container-ai');
                articleContainer.innerHTML = '';
                statusContainer.classList.add('hidden');

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
    const endpointsToFetch = ['profile', 'key_metrics_ttm', 'ratios_ttm', 'key_metrics_annual', 'ratios_annual'];
    const totalEndpoints = tickers.length * endpointsToFetch.length;
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
            // Check if the peer data is already cached
            const docRef = doc(state.db, CONSTANTS.DB_COLLECTION_FMP_CACHE, ticker, 'endpoints', 'profile');
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                console.log(`Peer data for ${ticker} already in cache. Skipping fetch.`);
                successfullyFetchedTickers.push(ticker);
                fetchedCount += endpointsToFetch.length;
                if (progressBarFill) {
                    const progress = (fetchedCount / totalEndpoints) * 100;
                    progressBarFill.style.width = `${progress}%`;
                }
                continue;
            }
            
            if (currentReportName) {
                currentReportName.textContent = `Fetching data for ${ticker}...`;
            }

            for (const endpoint of endpointsToFetch) {
                const url = `https://financialmodelingprep.com/api/v3/${endpoint}/${ticker}?apikey=${state.fmpApiKey}`;
                const data = await callApi(url);

                if (data && (!Array.isArray(data) || data.length > 0)) {
                    const endpointDocRef = doc(state.db, CONSTANTS.DB_COLLECTION_FMP_CACHE, ticker, 'endpoints', endpoint);
                    await setDoc(endpointDocRef, { cachedAt: Timestamp.now(), data: data });
                } else {
                    console.warn(`No data returned from FMP for peer endpoint: ${endpoint} for ticker ${ticker}.`);
                    allEndpointsFetched = false;
                }
                fetchedCount++;
                if (progressBarFill) {
                    const progress = (fetchedCount / totalEndpoints) * 100;
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
    const metricKeys = Object.keys(peerMetricsList[0]);
    
    for (const key of metricKeys) {
        if (key === 'garpConvictionScore') continue; 
        const values = peerMetricsList
            .map(metrics => metrics[key]?.value)
            .filter(v => typeof v === 'number' && isFinite(v));
        
        if (values.length > 0) {
            peerAverages[key] = values.reduce((sum, v) => sum + v, 0) / values.length;
        } else {
             peerAverages[key] = null;
        }
    }
    
    const companyMetrics = _calculateGarpScorecardMetrics(companyFmpData);
    const finalPeerDataObject = {
        peers: peerTickers,
        averages: peerAverages,
        cachedAt: Timestamp.now()
    };

    const peerDocRef = doc(state.db, CONSTANTS.DB_COLLECTION_FMP_CACHE, primaryTicker, 'analysis', 'peer_comparison');
    await setDoc(peerDocRef, finalPeerDataObject);
    
    renderPeerComparisonTable(container, primaryTicker, companyMetrics, finalPeerDataObject);
}

export async function handlePeerAnalysisRequest(ticker) {
    const container = document.getElementById('peer-analysis-content-container');
    container.innerHTML = `<div class="flex items-center justify-center p-4"><div class="loader"></div><p class="ml-4 text-gray-600 font-semibold">AI is identifying peers...</p></div>`;
    
    const profileData = state.portfolioCache.find(s => s.ticker === ticker);
    if (!profileData) {
        container.innerHTML = `<p class="text-red-500 p-4">Could not find profile data for ${ticker}. Please refresh the FMP data first.</p>`;
        return;
    }

    let peerTickers = [];
    let source = '';
    const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);
    const progressContainer = document.getElementById('progress-container');
    const genericLoader = document.getElementById('generic-loader-container');

    try {
        // Tier 1: Direct Competitor Search
        const directPromptConfig = promptMap['PeerIdentification'];
        const directPrompt = directPromptConfig.prompt
            .replace('{companyName}', profileData.companyName)
            .replace('{tickerSymbol}', profileData.ticker)
            .replace('{description}', profileData.description);
        
        const directResponse = await callGeminiApi(directPrompt);
        const directPeers = JSON.parse(directResponse.trim());

        if (Array.isArray(directPeers) && directPeers.length > 0) {
            peerTickers = directPeers;
            source = 'AI (Direct)';
        } else {
            // Tier 2: Fallback AI Search (by sector & market cap)
            loadingMessage.textContent = 'Direct search failed. Trying broader search...';
            const fallbackPromptConfig = promptMap['PeerIdentificationFallback'];
            const fallbackPrompt = fallbackPromptConfig.prompt
                .replace('{tickerSymbol}', profileData.ticker)
                .replace('{sectorName}', profileData.sector)
                .replace('{marketCap}', profileData.mktCap);
            
            const fallbackResponse = await callGeminiApi(fallbackPrompt);
            const fallbackPeers = JSON.parse(fallbackResponse.trim());
            
            if (Array.isArray(fallbackPeers) && fallbackPeers.length > 0) {
                peerTickers = fallbackPeers;
                source = 'AI (Fallback)';
            } else {
                // Tier 3: FMP Peer API
                loadingMessage.textContent = 'AI search failed. Using FMP\'s Peer API...';
                const fmpUrl = `https://financialmodelingprep.com/api/v4/stock_peers?symbol=${ticker}&apikey=${state.fmpApiKey}`;
                const fmpResponse = await callApi(fmpUrl);

                if (fmpResponse && fmpResponse.peersList && Array.isArray(fmpResponse.peersList) && fmpResponse.peersList.length > 0) {
                    peerTickers = fmpResponse.peersList;
                    source = 'FMP API';
                } else {
                     throw new Error("Could not find any peers using any automated method.");
                }
            }
        }
        
        openModal(CONSTANTS.MODAL_LOADING);
        genericLoader.classList.add('hidden');
        
        const fetchedPeers = await _fetchAndCachePeerData(peerTickers);
        
        await runPeerAnalysis(ticker, fetchedPeers);
        displayMessageInModal(`Successfully found ${fetchedPeers.length} peers using ${source}.`, 'info');

    } catch (error) {
        console.error("Error handling peer analysis request:", error);
        container.innerHTML = `<p class="text-red-500 p-4">Could not complete peer analysis: ${error.message}</p>`;
        document.getElementById('manual-peer-entry-container').classList.remove('hidden');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
        genericLoader.classList.remove('hidden');
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

    try {
        openModal(CONSTANTS.MODAL_LOADING);
        genericLoader.classList.add('hidden');
        const fetchedPeers = await _fetchAndCachePeerData(peerTickers);
        await runPeerAnalysis(ticker, fetchedPeers);
    } catch (error) {
        console.error("Error handling manual peer analysis:", error);
        const container = document.getElementById('peer-analysis-content-container');
        container.innerHTML = `<p class="text-red-500 p-4">Could not complete manual peer analysis: ${error.message}</p>`;
        document.getElementById('manual-peer-entry-container').classList.remove('hidden');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
        genericLoader.classList.remove('hidden');
    }
}
