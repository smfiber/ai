import { CONSTANTS, state, promptMap, NEWS_SENTIMENT_PROMPT, DISRUPTOR_ANALYSIS_PROMPT, MACRO_PLAYBOOK_PROMPT, INDUSTRY_CAPITAL_ALLOCATORS_PROMPT, INDUSTRY_DISRUPTOR_ANALYSIS_PROMPT, INDUSTRY_MACRO_PLAYBOOK_PROMPT, ONE_SHOT_INDUSTRY_TREND_PROMPT, FORTRESS_ANALYSIS_PROMPT, PHOENIX_ANALYSIS_PROMPT, PICK_AND_SHOVEL_PROMPT, LINCHPIN_ANALYSIS_PROMPT, HIDDEN_VALUE_PROMPT, UNTOUCHABLES_ANALYSIS_PROMPT, INVESTMENT_MEMO_PROMPT, GARP_VALIDATION_PROMPT, ENABLE_STARTER_PLAN_MODE, STARTER_SYMBOLS, ANALYSIS_REQUIREMENTS } from './config.js';
import { callApi, filterValidNews, callGeminiApi, generatePolishedArticle, getDriveToken, getOrCreateDriveFolder, createDriveFile, findStocksByIndustry, searchSectorNews, findStocksBySector, synthesizeAndRankCompanies, generateDeepDiveReport, getFmpStockData, getCompetitorsFromGemini } from './api.js';
import { getFirestore, Timestamp, doc, setDoc, getDoc, deleteDoc, collection, getDocs, query, limit, addDoc, increment, updateDoc, where, orderBy } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { openModal, closeModal, displayMessageInModal, openConfirmationModal, openManageStockModal } from './ui-modals.js';
import { renderPortfolioManagerList, renderFmpEndpointsList, renderBroadEndpointsList, renderNewsArticles, displayReport, updateReportStatus, updateBroadReportStatus, fetchAndCachePortfolioData, renderThesisTracker, renderFilingAnalysisTab } from './ui-render.js';
import { _calculateUndervaluedMetrics, _calculateFinancialAnalysisMetrics, _calculateBullVsBearMetrics, _calculateMoatAnalysisMetrics, _calculateDividendSafetyMetrics, _calculateGrowthOutlookMetrics, _calculateRiskAssessmentMetrics, _calculateCapitalAllocatorsMetrics, _calculateNarrativeCatalystMetrics, _calculateGarpAnalysisMetrics, _calculateCompetitiveLandscapeMetrics, _calculateStockDisruptorMetrics, _calculateStockFortressMetrics, _calculateStockPhoenixMetrics, _calculateStockLinchpinMetrics, _calculateStockUntouchablesMetrics } from './analysis-helpers.js';

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
            // Annual Data (for long-term trends)
            { name: 'income_statement_annual', path: 'income-statement', params: 'period=annual&limit=10', version: 'v3' },
            { name: 'balance_sheet_statement_annual', path: 'balance-sheet-statement', params: 'period=annual&limit=10', version: 'v3' },
            { name: 'cash_flow_statement_annual', path: 'cash-flow-statement', params: 'period=annual&limit=10', version: 'v3' },
            { name: 'key_metrics_annual', path: 'key-metrics', params: 'period=annual&limit=10', version: 'v3' },
            { name: 'ratios_annual', path: 'ratios', params: 'period=annual&limit=10', version: 'v3' },
            // TTM Data (for the most current analysis)
            { name: 'key_metrics_ttm', path: 'key-metrics-ttm', version: 'v3' },
            { name: 'ratios_ttm', path: 'ratios-ttm', version: 'v3' },
            // Quarterly Data (for recent performance)
            { name: 'income_statement_quarterly', path: 'income-statement', params: 'period=quarter&limit=5', version: 'v3' },
            { name: 'balance_sheet_statement_quarterly', path: 'balance-sheet-statement', params: 'period=quarter&limit=5', version: 'v3' },
            { name: 'cash_flow_statement_quarterly', path: 'cash-flow-statement', params: 'period=quarter&limit=5', version: 'v3' },
            { name: 'key_metrics_quarterly', path: 'key-metrics', params: 'period=quarter&limit=5', version: 'v3' },
            { name: 'ratios_quarterly', path: 'ratios', params: 'period=quarter&limit=5', version: 'v3' },
            // Other point-in-time and supplemental data
            { name: 'income_statement_growth_annual', path: 'income-statement-growth', params: 'period=annual&limit=5', version: 'v3' },
            { name: 'stock_grade_news', path: 'grade', version: 'v3' },
            { name: 'analyst_estimates', path: 'analyst-estimates', version: 'v3'},
            { name: 'historical_price', path: 'historical-price-full', params: 'serietype=line', version: 'v3' },
            { name: 'company_core_information', path: 'company-core-information', version: 'v4', symbolAsQuery: true }
        ];

        let successfulFetches = 0;

        for (const endpoint of coreEndpoints) {
            if (endpoint.name === 'executive_compensation' && ENABLE_STARTER_PLAN_MODE && !STARTER_SYMBOLS.includes(symbol)) {
                console.log(`Skipping starter-plan-limited endpoint '${endpoint.name}' for non-starter symbol ${symbol}.`);
                continue;
            }

            loadingMessage.textContent = `Fetching FMP Data: ${endpoint.name.replace(/_/g, ' ')}...`;
            
            const version = endpoint.version || 'v4';
            const base = version === 'stable'
                ? `https://financialmodelingprep.com/${version}/`
                : `https://financialmodelingprep.com/api/${version}/`;
            
            const key = `apikey=${state.fmpApiKey}`;
            const params = endpoint.params ? `${endpoint.params}&` : '';
            let url;

            if (endpoint.symbolAsQuery) {
                // For endpoints like `.../grade?symbol=AAPL&...` or `.../stable/key-executives?symbol=AAPL...`
                url = `${base}${endpoint.path}?symbol=${symbol}&${params}${key}`;
            } else {
                // For endpoints like `.../profile/AAPL?...`
                url = `${base}${endpoint.path}/${symbol}?${params}${key}`;
            }

            const data = await callApi(url);

            if (!data || (Array.isArray(data) && data.length === 0)) {
                console.warn(`No data returned from FMP for core endpoint: ${endpoint.name}`);
                continue;
            }

            const docRef = doc(state.db, CONSTANTS.DB_COLLECTION_FMP_CACHE, symbol, 'endpoints', endpoint.name);
            await setDoc(docRef, { cachedAt: Timestamp.now(), data: data });
            successfulFetches++;
        }
        
        // Fetch user-defined endpoints
        const endpointsSnapshot = await getDocs(collection(state.db, CONSTANTS.DB_COLLECTION_FMP_ENDPOINTS));
        if (!endpointsSnapshot.empty) {
            const userEndpoints = endpointsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            for (const endpoint of userEndpoints) {
                 if (!endpoint.url_template || !endpoint.name) continue;
                loadingMessage.textContent = `Fetching FMP Data: ${endpoint.name}...`;
                const url = endpoint.url_template.replace('${symbol}', symbol).replace('${fmpApiKey}', state.fmpApiKey);
                const data = await callApi(url);

                if (data && (!Array.isArray(data) || data.length > 0)) {
                    const docRef = doc(state.db, CONSTANTS.DB_COLLECTION_FMP_CACHE, symbol, 'endpoints', endpoint.id);
                    await setDoc(docRef, { cachedAt: Timestamp.now(), data: data });
                    await updateDoc(doc(state.db, CONSTANTS.DB_COLLECTION_FMP_ENDPOINTS, endpoint.id), { usageCount: increment(1) });
                    successfulFetches++;
                }
            }
        }
        
        displayMessageInModal(`Successfully fetched and updated data for ${successfulFetches} FMP endpoint(s).`, 'info');
        await fetchAndCachePortfolioData(); // Refresh portfolio cache which might contain new FMP data references

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
             displayMessageInModal(`${symbol} is already in your lists (Portfolio, Watchlist, or Revisit). You can edit it from the dashboard.`, 'info');
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

// --- NEWS FEATURE ---

export async function handleFetchNews(symbol) {
    const button = document.querySelector(`#card-${symbol} .fetch-news-button`);
    if (!button) return;
    
    button.disabled = true;
    button.textContent = 'Analyzing...';

    try {
        const stockData = await getFmpStockData(symbol);
        const profile = stockData?.profile?.[0] || {};
        const companyName = profile.companyName || symbol;
        const url = `https://financialmodelingprep.com/api/v3/stock_news?tickers=${symbol}&limit=50&apikey=${state.fmpApiKey}`;
        
        const newsData = await callApi(url);
        const validArticles = filterValidNews(newsData);

        if (validArticles.length > 0) {
            const articlesForPrompt = validArticles.slice(0, 10).map(a => ({ 
                title: a.title, 
                snippet: a.text,
                publicationDate: a.publishedDate ? a.publishedDate.split(' ')[0] : 'N/A' 
            }));

            const prompt = NEWS_SENTIMENT_PROMPT
                .replace('{companyName}', companyName)
                .replace('{tickerSymbol}', symbol)
                .replace('{news_articles_json}', JSON.stringify(articlesForPrompt, null, 2));

            const rawResult = await callGeminiApi(prompt);
            
            const jsonMatch = rawResult.match(/```json\n([\s\S]*?)\n```|(\[[\s\S]*\])/);
            const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[2]).trim() : '';
            const summaryMarkdown = rawResult.split(jsonMatch ? jsonMatch[0] : ']').pop().trim();

            const sentiments = JSON.parse(jsonString);
            
            if (Array.isArray(sentiments) && sentiments.length > 0) {
                 const articlesWithSentiment = sentiments.map((sentiment, index) => ({
                    ...sentiment,
                    title: validArticles[index].title,
                    url: validArticles[index].url
                }));
                 renderNewsArticles(articlesWithSentiment, summaryMarkdown, symbol);
            } else {
                 renderNewsArticles([], '', symbol);
            }
        } else {
             renderNewsArticles([], '', symbol);
        }

    } catch (error) {
        console.error("Error fetching news:", error);
        displayMessageInModal(`Could not fetch news: ${error.message}`, 'error');
        renderNewsArticles([], '', symbol);
    } finally {
        button.disabled = false;
        button.textContent = 'Fetch News';
    }
}

// --- FMP ENDPOINT MANAGEMENT ---

export function handleEditFmpEndpoint(id, name, url) {
    document.getElementById('fmp-endpoint-id').value = id;
    document.getElementById('fmp-endpoint-name').value = name;
    document.getElementById('fmp-endpoint-url').value = url;
    document.getElementById('cancel-fmp-endpoint-edit').classList.remove('hidden');
    document.querySelector('#manage-fmp-endpoint-form button[type="submit"]').textContent = "Update Endpoint";
}

export function cancelFmpEndpointEdit() {
    document.getElementById('manage-fmp-endpoint-form').reset();
    document.getElementById('fmp-endpoint-id').value = '';
    document.getElementById('cancel-fmp-endpoint-edit').classList.add('hidden');
    document.querySelector('#manage-fmp-endpoint-form button[type="submit"]').textContent = "Save Endpoint";
}

export async function handleSaveFmpEndpoint(e) {
    e.preventDefault();
    const id = document.getElementById('fmp-endpoint-id').value;
    const name = document.getElementById('fmp-endpoint-name').value.trim();
    const url_template = document.getElementById('fmp-endpoint-url').value.trim();

    if (!name || !url_template) {
        displayMessageInModal('Endpoint Name and URL Template are required.', 'warning');
        return;
    }

    const data = { name, url_template };
    
    try {
        if (id) {
            await setDoc(doc(state.db, CONSTANTS.DB_COLLECTION_FMP_ENDPOINTS, id), data, { merge: true });
        } else {
            const docId = name.toLowerCase().replace(/\s+/g, '_');
            data.usageCount = 0;
            await setDoc(doc(state.db, CONSTANTS.DB_COLLECTION_FMP_ENDPOINTS, docId), data);
        }
        cancelFmpEndpointEdit();
        await renderFmpEndpointsList();
    } catch (error) {
        console.error('Error saving FMP endpoint:', error);
        displayMessageInModal(`Could not save endpoint: ${error.message}`, 'error');
    }
}

export function handleDeleteFmpEndpoint(id) {
    openConfirmationModal('Delete Endpoint?', 'Are you sure you want to delete this endpoint? This cannot be undone.', async () => {
        try {
            await deleteDoc(doc(state.db, CONSTANTS.DB_COLLECTION_FMP_ENDPOINTS, id));
            await renderFmpEndpointsList();
        } catch (error) {
            console.error('Error deleting FMP endpoint:', error);
            displayMessageInModal(`Could not delete endpoint: ${error.message}`, 'error');
        }
    });
}

// --- BROAD API ENDPOINT MANAGEMENT ---

export function handleEditBroadEndpoint(id, name, url) {
    document.getElementById('broad-endpoint-id').value = id;
    document.getElementById('broad-endpoint-name').value = name;
    document.getElementById('broad-endpoint-url').value = url;
    document.getElementById('cancel-broad-endpoint-edit').classList.remove('hidden');
    document.querySelector('#manage-broad-endpoint-form button[type="submit"]').textContent = "Update Endpoint";
}

export function cancelBroadEndpointEdit() {
    document.getElementById('manage-broad-endpoint-form').reset();
    document.getElementById('broad-endpoint-id').value = '';
    document.getElementById('cancel-broad-endpoint-edit').classList.add('hidden');
    document.querySelector('#manage-broad-endpoint-form button[type="submit"]').textContent = "Save Endpoint";
}

export async function handleSaveBroadEndpoint(e) {
    e.preventDefault();
    const id = document.getElementById('broad-endpoint-id').value;
    const name = document.getElementById('broad-endpoint-name').value.trim();
    const url_template = document.getElementById('broad-endpoint-url').value.trim();

    if (!name || !url_template) {
        displayMessageInModal('Endpoint Name and URL Template are required.', 'warning');
        return;
    }

    const data = { name, url_template };
    
    try {
        if (id) {
            await setDoc(doc(state.db, CONSTANTS.DB_COLLECTION_BROAD_ENDPOINTS, id), data, { merge: true });
        } else {
            const docId = name.toLowerCase().replace(/\s+/g, '_');
            data.usageCount = 0;
            await setDoc(doc(state.db, CONSTANTS.DB_COLLECTION_BROAD_ENDPOINTS, docId), data);
        }
        cancelBroadEndpointEdit();
        await renderBroadEndpointsList();
    } catch (error) {
        console.error('Error saving Broad API endpoint:', error);
        displayMessageInModal(`Could not save endpoint: ${error.message}`, 'error');
    }
}

export function handleDeleteBroadEndpoint(id) {
    openConfirmationModal('Delete Endpoint?', 'Are you sure you want to delete this endpoint? This cannot be undone.', async () => {
        try {
            await deleteDoc(doc(state.db, CONSTANTS.DB_COLLECTION_BROAD_ENDPOINTS, id));
            await renderBroadEndpointsList();
        } catch (error) {
            console.error('Error deleting Broad API endpoint:', error);
            displayMessageInModal(`Could not delete endpoint: ${error.message}`, 'error');
        }
    });
}

// --- SECTOR & INDUSTRY ANALYSIS HANDLERS ---

async function handleMarketTrendsAnalysis(sectorName) {
    openModal(CONSTANTS.MODAL_LOADING);
    const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);
    const contentArea = document.getElementById('custom-analysis-content');

    try {
        loadingMessage.textContent = `Finding companies for the ${sectorName} sector...`;
        contentArea.innerHTML = `<div class="p-4 text-center text-gray-500">${loadingMessage.textContent}</div>`;
        
        const stocksResult = await findStocksBySector({ sectorName });
        if (stocksResult.error || !stocksResult.stocks || stocksResult.stocks.length === 0) {
            throw new Error(stocksResult.detail || `Could not find any companies for the ${sectorName} sector.`);
        }
        const sectorStocks = stocksResult.stocks;

        loadingMessage.textContent = `Searching news for up to ${sectorStocks.length} companies...`;
        contentArea.innerHTML = `<div class="p-4 text-center text-gray-500">${loadingMessage.textContent}</div>`;
        const newsResult = await searchSectorNews({ sectorName, sectorStocks });

        if (newsResult.error || !newsResult.articles || newsResult.articles.length === 0) {
            throw new Error(newsResult.detail || `Could not find any recent news for the ${sectorName} sector.`);
        }
        const validArticles = newsResult.articles;

        loadingMessage.textContent = `AI is analyzing news and ranking companies...`;
        contentArea.innerHTML = `<div class="p-4 text-center text-gray-500">${loadingMessage.textContent}</div>`;
        const synthesisResult = await synthesizeAndRankCompanies({ newsArticles: validArticles, sectorStocks });
        
        if (synthesisResult.error || !synthesisResult.topCompanies || synthesisResult.topCompanies.length === 0) {
            throw new Error(synthesisResult.detail || "AI could not identify top companies from the news.");
        }

        loadingMessage.textContent = `AI is generating the final deep dive report...`;
        contentArea.innerHTML = `<div class="p-4 text-center text-gray-500">${loadingMessage.textContent}</div>`;
        const reportResult = await generateDeepDiveReport({
            companyAnalysis: synthesisResult,
            sectorName: sectorName,
            originalArticles: validArticles
        });

        contentArea.innerHTML = marked.parse(reportResult.report);

    } catch (error) {
        console.error("Error during AI agent sector analysis:", error);
        displayMessageInModal(`Could not complete AI analysis: ${error.message}`, 'error');
        contentArea.innerHTML = `<div class="p-4 text-center text-red-500">Error: ${error.message}</div>`;
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

export async function handleSectorSelection(sectorName, buttonElement) {
    const modal = document.getElementById(CONSTANTS.MODAL_CUSTOM_ANALYSIS);
    const modalTitle = modal.querySelector('#custom-analysis-modal-title');
    const selectorContainer = modal.querySelector('#custom-analysis-selector-container');
    const contentArea = modal.querySelector('#custom-analysis-content');
    const statusContainer = modal.querySelector('#report-status-container-sector');

    modalTitle.textContent = `Sector Deep Dive | ${sectorName}`;
    contentArea.innerHTML = `<div class="text-center text-gray-500 pt-16">Please select an analysis type above to begin.</div>`;
    statusContainer.classList.add('hidden');
    modal.dataset.analysisName = 'Sector_Deep_Dive'; // Reset on new selection
    
    const savedReports = await getSavedBroadReports(sectorName, 'sector');
    const savedReportTypes = new Set(savedReports.map(doc => doc.reportType));

    const analysisTypes = [
        {
            name: 'Market Trends',
            promptName: 'MarketTrends',
            description: 'AI agent searches news, finds top companies in your portfolio for this sector, and generates a market summary.',
            svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>`
        },
        {
            name: 'The Disruptor',
            promptName: 'DisruptorAnalysis',
            description: "VC-style report on a high-growth, innovative company with potential to disrupt its industry.",
            svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>`
        },
        {
            name: 'The Fortress',
            promptName: 'FortressAnalysis',
            description: 'Identifies a resilient, "all-weather" business with strong pricing power and a rock-solid balance sheet, built to withstand economic downturns.',
            svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286zm0 13.036h.008v.008h-.008v-.008z" /></svg>`
        },
        {
            name: 'The Phoenix',
            promptName: 'PhoenixAnalysis',
            description: 'Analyzes a "fallen angel" company that has stumbled badly but is now showing credible, quantifiable signs of a fundamental business turnaround.',
            svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.62a8.983 8.983 0 013.362-3.867 8.262 8.262 0 013 2.456z" /><path stroke-linecap="round" stroke-linejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" /></svg>`
        },
        {
            name: 'Pick & Shovel',
            promptName: 'PickAndShovel',
            description: 'Identifies essential suppliers that power an entire industry, a lower-risk way to invest in a trend.',
            svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21.75 17.25v-.228a4.5 4.5 0 00-.12-1.03l-2.268-9.64a3.375 3.375 0 00-3.285-2.602H7.923a3.375 3.375 0 00-3.285 2.602l-2.268 9.64a4.5 4.5 0 00-.12 1.03v.228m19.5 0a3 3 0 01-3 3H5.25a3 3 0 01-3-3m19.5 0a3 3 0 00-3-3H5.25a3 3 0 00-3 3m16.5 0h.008v.008h-.008v-.008zm-3 0h.008v.008h-.008v-.008z" /></svg>`
        },
        {
            name: 'The Linchpin',
            promptName: 'Linchpin',
            description: 'Focuses on companies that control a vital, irreplaceable choke point in an industry’s value chain.',
            svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M13.192 7.027a5.25 5.25 0 017.423 0L21 7.402a5.25 5.25 0 010 7.423l-.385.385a5.25 5.25 0 01-7.423 0L13.192 7.027zm-6.384 0a5.25 5.25 0 017.423 0L15 7.402a5.25 5.25 0 010 7.423l-5.385 5.385a5.25 5.25 0 01-7.423 0L2 19.973a5.25 5.25 0 010-7.423l.385-.385z" /><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6" /></svg>`
        },
        {
            name: 'Hidden Value',
            promptName: 'HiddenValue',
            description: 'A sum-of-the-parts investigation to find complex companies the market may be undervaluing.',
            svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h12v-1.5M3.75 3h16.5v13.5A2.25 2.25 0 0118 18.75h-9.75A2.25 2.25 0 016 16.5v-1.5" /><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6h1.5m-1.5 3h1.5m-1.5 3h1.5" /></svg>`
        },
        {
            name: 'The Untouchables',
            promptName: 'Untouchables',
            description: 'Deconstructs the "cult" brand moat of a company with fanatical customer loyalty, analyzing how that translates into durable pricing power and long-term profits.',
            svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>`
        }
    ];

    let html = `
        <div class="text-center w-full">
            <span class="block text-sm font-bold text-gray-500 uppercase mb-4">AI Analysis</span>
            <div class="flex flex-wrap justify-center gap-4">`;

    analysisTypes.forEach(type => {
        const hasSaved = savedReportTypes.has(type.promptName) ? 'has-saved-report' : '';
        html += `
            <button class="analysis-tile ${hasSaved}" data-sector="${sectorName}" data-prompt-name="${type.promptName}" data-tooltip="${type.description}">
                ${type.svgIcon}
                <span class="tile-name">${type.name}</span>
            </button>
        `;
    });

    html += `</div></div>`;
    selectorContainer.innerHTML = html;
    openModal(CONSTANTS.MODAL_CUSTOM_ANALYSIS);
    
    try {
        const docRef = doc(state.db, CONSTANTS.DB_COLLECTION_SCREENER_INTERACTIONS, sectorName);
        await setDoc(docRef, { lastClicked: Timestamp.now(), contextType: 'sector' });
        if (buttonElement) {
            const dateElement = buttonElement.querySelector('.last-clicked-date');
            if (dateElement) {
                dateElement.textContent = `Last Clicked: ${new Date().toLocaleDateString()}`;
            }
        }
    } catch (error) {
        console.error(`Error updating last clicked for ${sectorName}:`, error);
    }
}

async function handleDisruptorAnalysis(contextName) {
    openModal(CONSTANTS.MODAL_LOADING);
    const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);

    const contentArea = document.getElementById('custom-analysis-content');
    contentArea.innerHTML = `<div class="p-4 text-center text-gray-500">Generating AI article: "Disruptor Analysis"...</div>`;

    try {
        const prompt = DISRUPTOR_ANALYSIS_PROMPT.replace(/{sectorName}/g, contextName);
        const report = await generatePolishedArticle(prompt, loadingMessage);
        contentArea.innerHTML = marked.parse(report);
    } catch (error) {
        console.error(`Error generating disruptor analysis for ${contextName}:`, error);
        displayMessageInModal(`Could not generate AI article: ${error.message}`, 'error');
        contentArea.innerHTML = `<div class="p-4 text-center text-red-500">Error: ${error.message}</div>`;
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

async function handleMacroPlaybookAnalysis(contextName) {
    openModal(CONSTANTS.MODAL_LOADING);
    const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);

    const contentArea = document.getElementById('custom-analysis-content');
    contentArea.innerHTML = `<div class="p-4 text-center text-gray-500">Generating AI article: "Macro Playbook"...</div>`;

    try {
        const standardDisclaimer = "This article is for informational purposes only and should not be considered financial advice. Readers should consult with a qualified financial professional before making any investment decisions.";
        const prompt = MACRO_PLAYBOOK_PROMPT
            .replace(/{sectorName}/g, contextName)
            .replace(/\[Include standard disclaimer\]/g, standardDisclaimer);
        const report = await generatePolishedArticle(prompt, loadingMessage);
        contentArea.innerHTML = marked.parse(report);
    } catch (error) {
        console.error(`Error generating macro playbook analysis for ${contextName}:`, error);
        displayMessageInModal(`Could not generate AI article: ${error.message}`, 'error');
        contentArea.innerHTML = `<div class="p-4 text-center text-red-500">Error: ${error.message}</div>`;
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

async function handleFortressAnalysis(contextName, contextType) {
    openModal(CONSTANTS.MODAL_LOADING);
    const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);

    const modalId = contextType === 'sector' ? 'customAnalysisModal' : 'industryAnalysisModal';
    const contentArea = document.getElementById(modalId).querySelector(contextType === 'sector' ? '#custom-analysis-content' : '#industry-analysis-content');
    contentArea.innerHTML = `<div class="p-4 text-center text-gray-500">Generating AI article: "The Fortress"...</div>`;

    try {
        const prompt = FORTRESS_ANALYSIS_PROMPT
            .replace(/{contextName}/g, contextName)
            .replace(/{contextType}/g, contextType);
        const report = await generatePolishedArticle(prompt, loadingMessage);
        contentArea.innerHTML = marked.parse(report);
    } catch (error) {
        console.error(`Error generating fortress analysis for ${contextName}:`, error);
        displayMessageInModal(`Could not generate AI article: ${error.message}`, 'error');
        contentArea.innerHTML = `<div class="p-4 text-center text-red-500">Error: ${error.message}</div>`;
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

async function handlePhoenixAnalysis(contextName, contextType) {
    openModal(CONSTANTS.MODAL_LOADING);
    const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);
    
    const modalId = contextType === 'sector' ? 'customAnalysisModal' : 'industryAnalysisModal';
    const contentArea = document.getElementById(modalId).querySelector(contextType === 'sector' ? '#custom-analysis-content' : '#industry-analysis-content');
    contentArea.innerHTML = `<div class="p-4 text-center text-gray-500">Generating AI article: "The Phoenix"...</div>`;

    try {
        const prompt = PHOENIX_ANALYSIS_PROMPT
            .replace(/{contextName}/g, contextName)
            .replace(/{contextType}/g, contextType);
        const report = await generatePolishedArticle(prompt, loadingMessage);
        contentArea.innerHTML = marked.parse(report);
    } catch (error) {
        console.error(`Error generating phoenix analysis for ${contextName}:`, error);
        displayMessageInModal(`Could not generate AI article: ${error.message}`, 'error');
        contentArea.innerHTML = `<div class="p-4 text-center text-red-500">Error: ${error.message}</div>`;
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

async function handlePickAndShovelAnalysis(contextName, contextType) {
    openModal(CONSTANTS.MODAL_LOADING);
    const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);
    const modalId = contextType === 'sector' ? 'customAnalysisModal' : 'industryAnalysisModal';
    const contentArea = document.getElementById(modalId).querySelector(contextType === 'sector' ? '#custom-analysis-content' : '#industry-analysis-content');
    contentArea.innerHTML = `<div class="p-4 text-center text-gray-500">Generating AI article: "The Pick and Shovel Play"...</div>`;

    try {
        const prompt = PICK_AND_SHOVEL_PROMPT
            .replace(/{contextName}/g, contextName)
            .replace(/{contextType}/g, contextType);
        const report = await generatePolishedArticle(prompt, loadingMessage);
        contentArea.innerHTML = marked.parse(report);
    } catch (error) {
        console.error(`Error generating Pick and Shovel analysis for ${contextName}:`, error);
        displayMessageInModal(`Could not generate AI article: ${error.message}`, 'error');
        contentArea.innerHTML = `<div class="p-4 text-center text-red-500">Error: ${error.message}</div>`;
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

async function handleLinchpinAnalysis(contextName, contextType) {
    openModal(CONSTANTS.MODAL_LOADING);
    const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);
    const modalId = contextType === 'sector' ? 'customAnalysisModal' : 'industryAnalysisModal';
    const contentArea = document.getElementById(modalId).querySelector(contextType === 'sector' ? '#custom-analysis-content' : '#industry-analysis-content');
    contentArea.innerHTML = `<div class="p-4 text-center text-gray-500">Generating AI article: "The Linchpin"...</div>`;

    try {
        const prompt = LINCHPIN_ANALYSIS_PROMPT
            .replace(/{contextName}/g, contextName)
            .replace(/{contextType}/g, contextType);
        const report = await generatePolishedArticle(prompt, loadingMessage);
        contentArea.innerHTML = marked.parse(report);
    } catch (error) {
        console.error(`Error generating Linchpin analysis for ${contextName}:`, error);
        displayMessageInModal(`Could not generate AI article: ${error.message}`, 'error');
        contentArea.innerHTML = `<div class="p-4 text-center text-red-500">Error: ${error.message}</div>`;
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

async function handleHiddenValueAnalysis(contextName, contextType) {
    openModal(CONSTANTS.MODAL_LOADING);
    const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);
    const modalId = contextType === 'sector' ? 'customAnalysisModal' : 'industryAnalysisModal';
    const contentArea = document.getElementById(modalId).querySelector(contextType === 'sector' ? '#custom-analysis-content' : '#industry-analysis-content');
    contentArea.innerHTML = `<div class="p-4 text-center text-gray-500">Generating AI article: "Hidden Value"...</div>`;

    try {
        const prompt = HIDDEN_VALUE_PROMPT
            .replace(/{contextName}/g, contextName)
            .replace(/{contextType}/g, contextType);
        const report = await generatePolishedArticle(prompt, loadingMessage);
        contentArea.innerHTML = marked.parse(report);
    } catch (error) {
        console.error(`Error generating Hidden Value analysis for ${contextName}:`, error);
        displayMessageInModal(`Could not generate AI article: ${error.message}`, 'error');
        contentArea.innerHTML = `<div class="p-4 text-center text-red-500">Error: ${error.message}</div>`;
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

async function handleUntouchablesAnalysis(contextName, contextType) {
    openModal(CONSTANTS.MODAL_LOADING);
    const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);
    const modalId = contextType === 'sector' ? 'customAnalysisModal' : 'industryAnalysisModal';
    const contentArea = document.getElementById(modalId).querySelector(contextType === 'sector' ? '#custom-analysis-content' : '#industry-analysis-content');
    contentArea.innerHTML = `<div class="p-4 text-center text-gray-500">Generating AI article: "The Untouchables"...</div>`;

    try {
        const prompt = UNTOUCHABLES_ANALYSIS_PROMPT
            .replace(/{contextName}/g, contextName)
            .replace(/{contextType}/g, contextType);
        const report = await generatePolishedArticle(prompt, loadingMessage);
        contentArea.innerHTML = marked.parse(report);
    } catch (error) {
        console.error(`Error generating Untouchables analysis for ${contextName}:`, error);
        displayMessageInModal(`Could not generate AI article: ${error.message}`, 'error');
        contentArea.innerHTML = `<div class="p-4 text-center text-red-500">Error: ${error.message}</div>`;
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

export async function handleIndustrySelection(industryName, buttonElement) {
    const modal = document.getElementById(CONSTANTS.MODAL_INDUSTRY_ANALYSIS);
    const modalTitle = modal.querySelector('#industry-analysis-modal-title');
    const selectorContainer = modal.querySelector('#industry-analysis-selector-container');
    const contentArea = modal.querySelector('#industry-analysis-content');
    const statusContainer = modal.querySelector('#report-status-container-industry');

    modalTitle.textContent = `Industry Deep Dive | ${industryName}`;
    contentArea.innerHTML = `<div class="text-center text-gray-500 pt-16">Please select an analysis type above to begin.</div>`;
    statusContainer.classList.add('hidden');
    modal.dataset.analysisName = 'Industry_Deep_Dive'; // Reset on new selection
    
    const savedReports = await getSavedBroadReports(industryName, 'industry');
    const savedReportTypes = new Set(savedReports.map(doc => doc.reportType));

    const analysisTypes = [
        {
            name: 'Market Trends',
            promptName: 'MarketTrends',
            description: 'AI agent finds companies in this industry, searches news, and generates a market summary.',
            svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>`
        },
        {
            name: 'The Disruptor',
            promptName: 'DisruptorAnalysis',
            description: "VC-style report on a high-growth, innovative company with potential to disrupt its industry.",
            svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>`
        },
        {
            name: 'The Fortress',
            promptName: 'FortressAnalysis',
            description: 'Identifies a resilient, "all-weather" business with strong pricing power and a rock-solid balance sheet, built to withstand economic downturns.',
            svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286zm0 13.036h.008v.008h-.008v-.008z" /></svg>`
        },
        {
            name: 'The Phoenix',
            promptName: 'PhoenixAnalysis',
            description: 'Analyzes a "fallen angel" company that has stumbled badly but is now showing credible, quantifiable signs of a fundamental business turnaround.',
            svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.62a8.983 8.983 0 013.362-3.867 8.262 8.262 0 013 2.456z" /><path stroke-linecap="round" stroke-linejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" /></svg>`
        },
        {
            name: 'Pick & Shovel',
            promptName: 'PickAndShovel',
            description: 'Identifies essential suppliers that power an entire industry, a lower-risk way to invest in a trend.',
            svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21.75 17.25v-.228a4.5 4.5 0 00-.12-1.03l-2.268-9.64a3.375 3.375 0 00-3.285-2.602H7.923a3.375 3.375 0 00-3.285 2.602l-2.268 9.64a4.5 4.5 0 00-.12 1.03v.228m19.5 0a3 3 0 01-3 3H5.25a3 3 0 01-3-3m19.5 0a3 3 0 00-3-3H5.25a3 3 0 00-3 3m16.5 0h.008v.008h-.008v-.008zm-3 0h.008v.008h-.008v-.008z" /></svg>`
        },
        {
            name: 'The Linchpin',
            promptName: 'Linchpin',
            description: 'Focuses on companies that control a vital, irreplaceable choke point in an industry’s value chain.',
            svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M13.192 7.027a5.25 5.25 0 017.423 0L21 7.402a5.25 5.25 0 010 7.423l-.385.385a5.25 5.25 0 01-7.423 0L13.192 7.027zm-6.384 0a5.25 5.25 0 017.423 0L15 7.402a5.25 5.25 0 010 7.423l-5.385 5.385a5.25 5.25 0 01-7.423 0L2 19.973a5.25 5.25 0 010-7.423l.385-.385z" /><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6" /></svg>`
        },
        {
            name: 'Hidden Value',
            promptName: 'HiddenValue',
            description: 'A sum-of-the-parts investigation to find complex companies the market may be undervaluing.',
            svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h12v-1.5M3.75 3h16.5v13.5A2.25 2.25 0 0118 18.75h-9.75A2.25 2.25 0 016 16.5v-1.5" /><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6h1.5m-1.5 3h1.5m-1.5 3h1.5" /></svg>`
        },
        {
            name: 'The Untouchables',
            promptName: 'Untouchables',
            description: 'Deconstructs the "cult" brand moat of a company with fanatical customer loyalty, analyzing how that translates into durable pricing power and long-term profits.',
            svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" class="tile-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>`
        }
    ];

    let html = `
        <div class="text-center w-full">
            <span class="block text-sm font-bold text-gray-500 uppercase mb-4">AI Analysis</span>
            <div class="flex flex-wrap justify-center gap-4">`;

    analysisTypes.forEach(type => {
        const hasSaved = savedReportTypes.has(type.promptName) ? 'has-saved-report' : '';
        html += `
            <button class="analysis-tile ${hasSaved}" data-industry="${industryName}" data-prompt-name="${type.promptName}" data-tooltip="${type.description}">
                ${type.svgIcon}
                <span class="tile-name">${type.name}</span>
            </button>
        `;
    });

    html += `</div></div>`;
    selectorContainer.innerHTML = html;
    openModal(CONSTANTS.MODAL_INDUSTRY_ANALYSIS);

    try {
        const docRef = doc(state.db, CONSTANTS.DB_COLLECTION_SCREENER_INTERACTIONS, industryName);
        await setDoc(docRef, { lastClicked: Timestamp.now(), contextType: 'industry' });
        if (buttonElement) {
            const dateElement = buttonElement.querySelector('.last-clicked-date');
            if (dateElement) {
                dateElement.textContent = `Last Clicked: ${new Date().toLocaleDateString()}`;
            }
        }
    } catch (error) {
        console.error(`Error updating last clicked for ${industryName}:`, error);
    }
}

async function handleIndustryMarketTrendsAnalysis(industryName) {
    openModal(CONSTANTS.MODAL_LOADING);
    const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);
    const contentArea = document.getElementById('industry-analysis-content');

    try {
        loadingMessage.textContent = `Finding companies in the ${industryName} industry...`;
        contentArea.innerHTML = `<div class="p-4 text-center text-gray-500">${loadingMessage.textContent}</div>`;

        const stocksResult = await findStocksByIndustry({ industryName });
        if (stocksResult.error || !stocksResult.stocks || stocksResult.stocks.length === 0) {
            throw new Error(`Could not find any companies for the ${industryName} industry.`);
        }
        const industryStocks = stocksResult.stocks;

        loadingMessage.textContent = `Searching news for up to ${industryStocks.length} companies...`;
        contentArea.innerHTML = `<div class="p-4 text-center text-gray-500">${loadingMessage.textContent}</div>`;
        const newsResult = await searchSectorNews({ sectorName: industryName, sectorStocks: industryStocks });
        if (newsResult.error || !newsResult.articles || newsResult.articles.length === 0) {
            throw new Error(`Could not find any recent news for the ${industryName} industry.`);
        }
        const validArticles = newsResult.articles;

        loadingMessage.textContent = `AI is analyzing news and generating the report...`;
        contentArea.innerHTML = `<div class="p-4 text-center text-gray-500">${loadingMessage.textContent}</div>`;

        const prompt = ONE_SHOT_INDUSTRY_TREND_PROMPT
            .replace(/{industryName}/g, industryName)
            .replace('${industryStocks}', industryStocks.join(', '))
            .replace('{newsArticlesJson}', JSON.stringify(validArticles, null, 2));

        let finalReport = await generatePolishedArticle(prompt, loadingMessage);

        finalReport = finalReport.replace(/\[Source: (?:Article )?(\d+)\]/g, (match, indexStr) => {
            const index = parseInt(indexStr, 10);
            const article = validArticles.find(a => a.articleIndex === index);
            if (article) {
                const sourceParts = article.source.split('.');
                const sourceName = sourceParts.length > 1 ? sourceParts[sourceParts.length - 2] : article.source;
                return `[(Source: ${sourceName}, ${article.publicationDate})](${article.link})`;
            }
            return match;
        });

        contentArea.innerHTML = marked.parse(finalReport);

    } catch (error) {
        console.error("Error during AI agent industry analysis:", error);
        displayMessageInModal(`Could not complete AI analysis: ${error.message}`, 'error');
        contentArea.innerHTML = `<p class="p-4 text-center text-red-500">Error: ${error.message}</p>`;
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

async function handleIndustryDisruptorAnalysis(industryName) {
    openModal(CONSTANTS.MODAL_LOADING);
    const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);

    const contentArea = document.getElementById('industry-analysis-content');
    contentArea.innerHTML = `<div class="p-4 text-center text-gray-500">Generating AI article: "Disruptor Analysis"...</div>`;

    try {
        const prompt = INDUSTRY_DISRUPTOR_ANALYSIS_PROMPT.replace(/{industryName}/g, industryName);
        const report = await generatePolishedArticle(prompt, loadingMessage);
        contentArea.innerHTML = marked.parse(report);
    } catch (error) {
        console.error(`Error generating disruptor analysis for ${industryName}:`, error);
        displayMessageInModal(`Could not generate AI article: ${error.message}`, 'error');
        contentArea.innerHTML = `<div class="p-4 text-center text-red-500">Error: ${error.message}</div>`;
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

async function handleIndustryMacroPlaybookAnalysis(industryName) {
    openModal(CONSTANTS.MODAL_LOADING);
    const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);

    const contentArea = document.getElementById('industry-analysis-content');
    contentArea.innerHTML = `<div class="p-4 text-center text-gray-500">Generating AI article: "Macro Playbook"...</div>`;

    try {
        const standardDisclaimer = "This article is for informational purposes only and should not be considered financial advice. Readers should consult with a qualified financial professional before making any investment decisions.";
        const prompt = INDUSTRY_MACRO_PLAYBOOK_PROMPT
            .replace(/{industryName}/g, industryName)
            .replace(/\[Include standard disclaimer\]/g, standardDisclaimer);
        const report = await generatePolishedArticle(prompt, loadingMessage);
        contentArea.innerHTML = marked.parse(report);
    } catch (error) {
        console.error(`Error generating macro playbook analysis for ${industryName}:`, error);
        displayMessageInModal(`Could not generate AI article: ${error.message}`, 'error');
        contentArea.innerHTML = `<div class="p-4 text-center text-red-500">Error: ${error.message}</div>`;
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

async function getSavedBroadReports(contextName, contextType) {
    const reportsRef = collection(state.db, CONSTANTS.DB_COLLECTION_BROAD_REPORTS);
    const q = query(reportsRef, where("contextName", "==", contextName), where("contextType", "==", contextType), orderBy("savedAt", "desc"));
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

// --- ADDED FOR AUTO-SAVE ---
/**
 * A helper function to save a generated report to Firestore.
 * @param {string} ticker The stock ticker.
 * @param {string} reportType The type of the report (e.g., 'InvestmentMemo').
 * @param {string} content The markdown content of the report.
 * @param {string} prompt The prompt used to generate the report.
 */
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
        // Display a non-blocking message to the user
        displayMessageInModal(`The ${reportType} report was generated but failed to auto-save. You can still save it manually. Error: ${error.message}`, 'warning');
    }
}
// --- END OF ADDITION ---

export async function handleAnalysisRequest(symbol, reportType, promptConfig, forceNew = false) {
    const contentContainer = document.getElementById('ai-article-container');
    const statusContainer = document.getElementById('report-status-container-ai');
    
    contentContainer.innerHTML = ''; // Clear previous content
    statusContainer.classList.add('hidden');

    // Special handling for CompetitiveLandscape which has a different data fetching flow
    if (reportType === 'CompetitiveLandscape') {
        openModal(CONSTANTS.MODAL_LOADING);
        const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);
        try {
            loadingMessage.textContent = `Analyzing ${symbol} and its competitors...`;

            // Get cached data first, but we will supplement it with fresh TTM data
            const targetData = await getFmpStockData(symbol);
            if (!targetData || !targetData.profile || !targetData.profile[0]) {
                throw new Error(`Could not retrieve primary data for ${symbol}.`);
            }

            // --- FIX: Explicitly fetch TTM data for the target company ---
            loadingMessage.textContent = `Fetching latest TTM data for ${symbol}...`;
            const targetKeyMetricsUrl = `https://financialmodelingprep.com/api/v3/key-metrics-ttm/${symbol}?apikey=${state.fmpApiKey}`;
            const targetRatiosUrl = `https://financialmodelingprep.com/api/v3/ratios-ttm/${symbol}?apikey=${state.fmpApiKey}`;
            targetData.key_metrics_ttm = await callApi(targetKeyMetricsUrl);
            targetData.ratios_ttm = await callApi(targetRatiosUrl);
            // --- END FIX ---

            const companyName = targetData.profile[0].companyName;
            loadingMessage.textContent = `Identifying competitors for ${companyName}...`;

            const competitors = await getCompetitorsFromGemini(companyName, symbol);
            if (!competitors || competitors.length === 0) {
                throw new Error(`Could not identify any competitors for ${symbol}.`);
            }
            
            const peersData = [];
            for (const peer of competitors) {
                try {
                    loadingMessage.textContent = `Fetching data for competitor ${peer.ticker}...`;
                    const keyMetricsUrl = `https://financialmodelingprep.com/api/v3/key-metrics-ttm/${peer.ticker}?apikey=${state.fmpApiKey}`;
                    const ratiosUrl = `https://financialmodelingprep.com/api/v3/ratios-ttm/${peer.ticker}?apikey=${state.fmpApiKey}`;
                    
                    const keyMetrics = await callApi(keyMetricsUrl);
                    const ratios = await callApi(ratiosUrl);

                    peersData.push({ 
                        ticker: peer.ticker, 
                        data: { key_metrics_ttm: keyMetrics, ratios_ttm: ratios } 
                    });
                } catch (peerError) {
                    console.warn(`Could not fetch data for competitor ${peer.ticker}:`, peerError);
                }
            }

            if (peersData.length === 0) {
                throw new Error('Could not fetch financial data for any identified competitors.');
            }

            const payloadData = _calculateCompetitiveLandscapeMetrics(targetData, peersData);
            
            const promptTemplate = promptConfig.prompt;
            const prompt = promptTemplate
                .replace(/{companyName}/g, companyName)
                .replace('{jsonData}', JSON.stringify(payloadData, null, 2));

            contentContainer.dataset.currentPrompt = prompt;
            const newReportContent = await generatePolishedArticle(prompt, loadingMessage);
            contentContainer.dataset.rawMarkdown = newReportContent;
            
            // --- ADDED FOR AUTO-SAVE ---
            await autoSaveReport(symbol, reportType, newReportContent, prompt);
            const refreshedReports = await getSavedReports(symbol, reportType);
            const latestReport = refreshedReports[0];
            
            displayReport(contentContainer, newReportContent, prompt);
            updateReportStatus(statusContainer, refreshedReports, latestReport.id, { symbol, reportType, promptConfig });
            // --- END OF ADDITION ---

        } catch (error) {
             displayMessageInModal(`Could not generate competitive analysis: ${error.message}`, 'error');
             contentContainer.innerHTML = `<p class="text-red-500">Failed to generate report: ${error.message}</p>`;
        } finally {
            closeModal(CONSTANTS.MODAL_LOADING);
        }
        return; // End execution for this special case
    }

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
                        // After refresh, re-run the request forcing a new generation
                        await handleAnalysisRequest(symbol, reportType, promptConfig, true);
                    }
                );
                return;
            }
        }
        
        let payloadData;
        if (reportType === 'UndervaluedAnalysis') {
            payloadData = _calculateUndervaluedMetrics(data);
        } else if (reportType === 'FinancialAnalysis') {
            payloadData = _calculateFinancialAnalysisMetrics(data);
        } else if (reportType === 'BullVsBear') {
            payloadData = _calculateBullVsBearMetrics(data);
        } else if (reportType === 'MoatAnalysis') {
            payloadData = _calculateMoatAnalysisMetrics(data);
        } else if (reportType === 'DividendSafety') {
            payloadData = _calculateDividendSafetyMetrics(data);
        } else if (reportType === 'GrowthOutlook') {
            payloadData = _calculateGrowthOutlookMetrics(data);
        } else if (reportType === 'RiskAssessment') {
            payloadData = _calculateRiskAssessmentMetrics(data);
        } else if (reportType === 'CapitalAllocators') {
            payloadData = _calculateCapitalAllocatorsMetrics(data);
        } else if (reportType === 'NarrativeCatalyst') {
            payloadData = _calculateNarrativeCatalystMetrics(data);
        } else if (reportType === 'GarpAnalysis') {
            payloadData = _calculateGarpAnalysisMetrics(data);
        } else if (reportType === 'StockDisruptor') {
            payloadData = _calculateStockDisruptorMetrics(data);
        } else if (reportType === 'StockFortress') {
            payloadData = _calculateStockFortressMetrics(data);
        } else if (reportType === 'StockPhoenix') {
            payloadData = _calculateStockPhoenixMetrics(data);
        } else if (reportType === 'StockLinchpin') {
            payloadData = _calculateStockLinchpinMetrics(data);
        } else if (reportType === 'StockUntouchables') {
            payloadData = _calculateStockUntouchablesMetrics(data);
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

        const newReportContent = await generatePolishedArticle(prompt, loadingMessage);
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
        // --- UPDATED REPORT LIST ---
        const reportTypes = [
            // Quantitative Analysis
            'FinancialAnalysis', 'UndervaluedAnalysis', 'GarpAnalysis', 'BullVsBear',
            'MoatAnalysis', 'DividendSafety', 'GrowthOutlook', 'RiskAssessment',
            'CapitalAllocators', 'NarrativeCatalyst',
            // Competitive Analysis
            'CompetitiveLandscape', 
            // Investment Thesis & Narrative Analysis
            'StockFortress', 'StockDisruptor', 'StockPhoenix', 'StockLinchpin', 'StockUntouchables',
            // Filing Analysis
            'Form8KAnalysis', 'Form10KAnalysis',
            // Synthesis Reports
            'GarpValidation'
        ];
        // --- END OF UPDATE ---

        const reportPromises = reportTypes.map(type => getSavedReports(symbol, type).then(reports => reports[0])); // Get only the latest
        const allLatestReports = await Promise.all(reportPromises);

        const foundReports = allLatestReports.filter(Boolean); // Filter out any undefined/null reports
        const missingReports = reportTypes.filter((type, index) => !allLatestReports[index]);

        if (missingReports.length > 0) {
            const optionalReports = ['Form8KAnalysis', 'Form10KAnalysis', 'Form10QAnalysis'];
            const requiredMissingReports = missingReports.filter(report => !optionalReports.includes(report));

            if (requiredMissingReports.length > 0) {
                throw new Error(`Cannot generate memo. Please generate and save the following reports first: ${requiredMissingReports.join(', ')}`);
            }
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
        const memoContent = await generatePolishedArticle(prompt, loadingMessage);
        
        // --- ADDED FOR AUTO-SAVE ---
        await autoSaveReport(symbol, reportType, memoContent, prompt);
        const refreshedReports = await getSavedReports(symbol, reportType);
        const latestReport = refreshedReports[0];

        contentContainer.dataset.currentPrompt = prompt;
        contentContainer.dataset.rawMarkdown = memoContent;
        displayReport(contentContainer, memoContent, prompt);
        
        updateReportStatus(statusContainer, refreshedReports, latestReport.id, { symbol, reportType, promptConfig });
        // --- END OF ADDITION ---

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

export async function handleGarpValidationRequest(symbol, forceNew = false) {
    const contentContainer = document.getElementById('ai-article-container');
    const statusContainer = document.getElementById('report-status-container-ai');
    contentContainer.innerHTML = '';
    statusContainer.classList.add('hidden');

    try {
        const reportType = 'GarpValidation';
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

        loadingMessage.textContent = "Gathering required analysis reports...";
        const requiredReports = ['GarpAnalysis', 'FinancialAnalysis', 'RiskAssessment'];
        
        const reportPromises = requiredReports.map(type => getSavedReports(symbol, type).then(reports => reports[0]));
        const latestReports = await Promise.all(reportPromises);

        const missingReports = requiredReports.filter((type, index) => !latestReports[index]);
        if (missingReports.length > 0) {
            throw new Error(`Please generate and save the following required reports first: ${missingReports.join(', ')}`);
        }

        let allAnalysesData = latestReports.map(report => {
            const reportTitle = report.content.match(/#\s*(.*)/)?.[1] || report.reportType;
            return `--- REPORT: ${reportTitle} ---\n\n${report.content}\n\n`;
        }).join('\n');

        const data = await getFmpStockData(symbol);
        const profile = data.profile?.[0] || {};
        const companyName = profile.companyName || 'the company';

        const prompt = GARP_VALIDATION_PROMPT
            .replace(/{companyName}/g, companyName)
            .replace(/{tickerSymbol}/g, symbol)
            .replace('{allAnalysesData}', allAnalysesData);

        loadingMessage.textContent = "AI is drafting the GARP validation report...";
        const validationContent = await generatePolishedArticle(prompt, loadingMessage);
        
        // --- ADDED FOR AUTO-SAVE ---
        await autoSaveReport(symbol, reportType, validationContent, prompt);
        const refreshedReports = await getSavedReports(symbol, reportType);
        const latestReport = refreshedReports[0];
        
        contentContainer.dataset.currentPrompt = prompt;
        contentContainer.dataset.rawMarkdown = validationContent;
        displayReport(contentContainer, validationContent, prompt);
        
        updateReportStatus(statusContainer, refreshedReports, latestReport.id, { symbol, reportType, promptConfig });
        // --- END OF ADDITION ---

    } catch (error) {
        console.error("Error generating GARP Validation report:", error);
        displayMessageInModal(`Could not generate report: ${error.message}`, 'error');
        contentContainer.innerHTML = `<p class="text-red-500">Failed to generate report: ${error.message}</p>`;
    } finally {
        if (document.getElementById(CONSTANTS.MODAL_LOADING).classList.contains('is-open')) {
            closeModal(CONSTANTS.MODAL_LOADING);
        }
    }
}

export async function handleGenerateAllReportsRequest(symbol) {
    const reportTypes = [
        'FinancialAnalysis', 'UndervaluedAnalysis', 'GarpAnalysis', 'BullVsBear', 
        'MoatAnalysis', 'DividendSafety', 'GrowthOutlook', 'RiskAssessment', 
        'CapitalAllocators', 'NarrativeCatalyst', 
        'StockFortress', 'StockDisruptor', 'StockPhoenix', 'StockLinchpin', 'StockUntouchables',
        'Form8KAnalysis', 'Form10KAnalysis', 'Form10QAnalysis'
    ];
    const reportDisplayNames = {
        'FinancialAnalysis': 'Financial Analysis', 'UndervaluedAnalysis': 'Undervalued Analysis', 'GarpAnalysis': 'GARP Analysis', 
        'BullVsBear': 'Bull vs. Bear', 'MoatAnalysis': 'Moat Analysis', 'DividendSafety': 'Dividend Safety', 
        'GrowthOutlook': 'Growth Outlook', 'RiskAssessment': 'Risk Assessment', 'CapitalAllocators': 'Capital Allocators', 
        'NarrativeCatalyst': 'Narrative & Catalyst',
        'StockFortress': 'The Fortress', 'StockDisruptor': 'The Disruptor', 'StockPhoenix': 'The Phoenix',
        'StockLinchpin': 'The Linchpin', 'StockUntouchables': 'The Untouchables',
        'Form8KAnalysis': '8-K Filing Analysis', 'Form10KAnalysis': '10-K Filing Analysis', 'Form10QAnalysis': '10-Q Filing Analysis'
    };

    const metricCalculators = {
        'FinancialAnalysis': _calculateFinancialAnalysisMetrics,
        'UndervaluedAnalysis': _calculateUndervaluedMetrics,
        'GarpAnalysis': _calculateGarpAnalysisMetrics,
        'BullVsBear': _calculateBullVsBearMetrics,
        'MoatAnalysis': _calculateMoatAnalysisMetrics,
        'DividendSafety': _calculateDividendSafetyMetrics,
        'GrowthOutlook': _calculateGrowthOutlookMetrics,
        'RiskAssessment': _calculateRiskAssessmentMetrics,
        'CapitalAllocators': _calculateCapitalAllocatorsMetrics,
        'NarrativeCatalyst': _calculateNarrativeCatalystMetrics,
        'StockFortress': _calculateStockFortressMetrics,
        'StockDisruptor': _calculateStockDisruptorMetrics,
        'StockPhoenix': _calculateStockPhoenixMetrics,
        'StockLinchpin': _calculateStockLinchpinMetrics,
        'StockUntouchables': _calculateStockUntouchablesMetrics
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

            let prompt;

            if (reportType.startsWith('Form')) {
                 const formTypeMap = { 'Form8KAnalysis': '8-K', 'Form10KAnalysis': '10-K', 'Form10QAnalysis': '10-Q' };
                 const formType = formTypeMap[reportType];
                const q = query(collection(state.db, CONSTANTS.DB_COLLECTION_MANUAL_FILINGS), where("ticker", "==", symbol), where("formType", "==", formType), orderBy("filingDate", "desc"), limit(1));
                const manualFilingSnapshot = await getDocs(q);
                
                if (manualFilingSnapshot.empty) {
                    console.warn(`Skipping ${reportType} generation: No manual filing saved for ${symbol}.`);
                    continue; 
                }
                const filingData = manualFilingSnapshot.docs[0].data();
                const promptTemplate = promptMap[reportType].prompt;
                prompt = promptTemplate
                    .replace(/{companyName}/g, companyName)
                    .replace(/{tickerSymbol}/g, tickerSymbol)
                    .replace('{filingText}', filingData.content);

            } else {
                const promptConfig = promptMap[reportType];
                const calculateMetrics = metricCalculators[reportType];
                if (!promptConfig || !calculateMetrics) {
                    console.warn(`Skipping report: No config for ${reportType}`);
                    continue;
                }
                const payloadData = calculateMetrics(data);
                prompt = promptConfig.prompt
                    .replace(/{companyName}/g, companyName)
                    .replace(/{tickerSymbol}/g, tickerSymbol)
                    .replace('{jsonData}', JSON.stringify(payloadData, null, 2));
            }

            const reportContent = await generatePolishedArticle(prompt, loadingMessage);

            const reportData = {
                ticker: symbol,
                reportType: reportType,
                content: reportContent,
                savedAt: Timestamp.now(),
                prompt: prompt
            };
            await addDoc(collection(state.db, CONSTANTS.DB_COLLECTION_AI_REPORTS), reportData);

            if (aiButtonsContainer) {
                // This check prevents the error for 8-K, 10-K, 10-Q reports
                if (!reportType.startsWith('Form')) {
                    const button = aiButtonsContainer.querySelector(`button[data-report-type="${reportType}"]`);
                    if (button) {
                        button.classList.add('has-saved-report');
                    }
                }
            }
            const progress = ((i + 1) / reportTypes.length) * 100;
            progressBarFill.style.width = `${progress}%`;
        }

        displayMessageInModal(`Successfully generated and saved all reports for ${symbol}. You can now generate the Investment Memo.`, 'info');

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
        
        // Add a check to only update the button if it's a standard AI analysis tab
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

export async function handleSaveBroadReportToDb(modalId) {
    const modal = document.getElementById(modalId);
    const contextName = modal.dataset.contextName;
    const contextType = modal.dataset.contextType;
    const reportType = modal.dataset.reportType;
    
    const contentContainer = modal.querySelector('.prose');
    if (!contentContainer || !contentContainer.innerHTML.trim() || contentContainer.textContent.includes('Please select an analysis type')) {
        displayMessageInModal("Please generate an analysis before saving.", "warning");
        return;
    }

    const contentToSave = contentContainer.innerHTML;

    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Saving ${reportType} report for ${contextName}...`;

    try {
        const reportData = {
            contextName,
            contextType,
            reportType,
            content: contentToSave,
            savedAt: Timestamp.now()
        };
        await addDoc(collection(state.db, CONSTANTS.DB_COLLECTION_BROAD_REPORTS), reportData);
        displayMessageInModal("Report saved successfully!", "info");
        
        // Refresh the status to show the new version
        const savedReports = await getSavedBroadReports(contextName, contextType);
        const latestReport = savedReports.find(r => r.reportType === reportType);
        const statusContainer = modal.querySelector('[id^="report-status-container"]');
        if (latestReport && statusContainer) {
            updateBroadReportStatus(statusContainer, savedReports.filter(r => r.reportType === reportType), latestReport.id, { contextName, contextType, reportType });
        }

    } catch (error) {
        console.error("Error saving broad report to DB:", error);
        displayMessageInModal(`Could not save report: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

export async function handleBroadAnalysisRequest(contextName, contextType, promptName, forceNew = false) {
    const modalId = contextType === 'sector' ? CONSTANTS.MODAL_CUSTOM_ANALYSIS : CONSTANTS.MODAL_INDUSTRY_ANALYSIS;
    const modal = document.getElementById(modalId);
    const contentArea = modal.querySelector('.prose');
    const statusContainer = modal.querySelector('[id^="report-status-container"]');

    contentArea.innerHTML = '';
    statusContainer.classList.add('hidden');

    try {
        const savedReports = (await getSavedBroadReports(contextName, contextType)).filter(r => r.reportType === promptName);

        if (savedReports.length > 0 && !forceNew) {
            const latestReport = savedReports[0];
            displayReport(contentArea, latestReport.content);
            updateBroadReportStatus(statusContainer, savedReports, latestReport.id, { contextName, contextType, reportType: promptName });
            return;
        }

        // Map promptName to the correct handler function
        const analysisHandlers = {
            'MarketTrends': contextType === 'sector' ? handleMarketTrendsAnalysis : handleIndustryMarketTrendsAnalysis,
            'DisruptorAnalysis': contextType === 'sector' ? handleDisruptorAnalysis : handleIndustryDisruptorAnalysis,
            'FortressAnalysis': handleFortressAnalysis,
            'PhoenixAnalysis': handlePhoenixAnalysis,
            'PickAndShovel': handlePickAndShovelAnalysis,
            'Linchpin': handleLinchpinAnalysis,
            'HiddenValue': handleHiddenValueAnalysis,
            'Untouchables': handleUntouchablesAnalysis,
        };

        const handler = analysisHandlers[promptName];
        if (handler) {
            await handler(contextName, contextType); // Pass contextType for relevant handlers
            updateBroadReportStatus(statusContainer, [], null, { contextName, contextType, reportType: promptName });
        } else {
            throw new Error(`No handler found for analysis type: ${promptName}`);
        }

    } catch (error) {
        console.error(`Error during broad analysis for ${contextName}:`, error);
        displayMessageInModal(`Could not complete analysis: ${error.message}`, 'error');
        contentArea.innerHTML = `<p class="text-red-500">Failed to generate report: ${error.message}</p>`;
    }
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

    const contentContainer = modal.querySelector('#custom-analysis-content, #industry-analysis-content, #view-fmp-data-content, #ai-article-container');

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
    } else {
        const titleParts = modalTitleText.split('|').map(s => s.trim());
        if (!reportTypeName) {
            reportTypeName = titleParts[0];
        }
        symbolOrContext = titleParts.length > 1 ? titleParts[1] : '';
    }

    const cleanSymbol = symbolOrContext.replace(/\s+/g, '_');
    const cleanReportType = reportTypeName.replace(/\s+/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];

    if (cleanSymbol && cleanReportType) {
        fileName = `${cleanSymbol}_${cleanReportType}_${dateStr}.md`;
    } else {
        fileName = `${(cleanReportType || cleanSymbol).replace(/ /g, '_') || 'AI_Analysis'}_${dateStr}.md`;
    }


    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Saving to Google Drive...`;

    try {
        const accessToken = await getDriveToken();
        
        await new Promise((resolve, reject) => {
            gapi.load('client', () => {
                gapi.client.setToken({ access_token: accessToken });
                gapi.client.load('drive', 'v3').then(resolve).catch(reject);
            });
        });

        const folderId = await getOrCreateDriveFolder();
        await createDriveFile(folderId, fileName, contentToSave);
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
        // Step 1: Save the filing text
        const dataToSave = {
            ticker,
            formType,
            filingDate,
            content,
            savedAt: Timestamp.now()
        };
        await addDoc(collection(state.db, CONSTANTS.DB_COLLECTION_MANUAL_FILINGS), dataToSave);
        await renderFilingAnalysisTab(ticker, formType); // Refresh UI to show the new saved text

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

        const newReportContent = await generatePolishedArticle(prompt, loadingMessage);
        contentContainer.dataset.rawMarkdown = newReportContent;
        displayReport(contentContainer, newReportContent, prompt);
        updateReportStatus(statusContainer, [], null, { symbol, reportType });
        
        const stockRef = doc(state.db, CONSTANTS.DB_COLLECTION_PORTFOLIO, symbol);
        const stockDoc = await getDoc(stockRef);
        if (stockDoc.exists() && stockDoc.data().hasNewFilings) {
            await updateDoc(stockRef, {
                hasNewFilings: false
            });
            console.log(`Reset 'hasNewFilings' flag for ${symbol}.`);
            await fetchAndCachePortfolioData();
        }

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
