import { state, promptMap, TOP_25_INVESTORS, CONSTANTS } from './config.js';
import { openModal, closeModal, displayMessageInModal } from './ui-modals.js';
import { callGeminiApi } from './api.js';
import { getFilingContent, getWhaleFilings } from './sec-api.js';
import { doc, setDoc, getDocs, collection, query, writeBatch } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

/**
 * Handles the AI analysis of a specific SEC filing.
 */
export async function handleFilingAnalysis(filingUrl, formType, ticker, filingItem = null) {
    const container = document.getElementById('filing-analysis-container');
    if (!container) return;

    // 1. Reset Container Styling for Custom Layout
    // We remove the default padding and prose classes to take full control of the layout
    container.classList.remove('p-6', 'prose', 'max-w-none');
    container.classList.add('h-full', 'flex', 'flex-col', 'bg-gray-50', 'overflow-hidden');

    // 2. Set Loading State (Centered)
    container.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full">
            <div class="loader mb-4"></div>
            <p class="text-gray-600 font-medium">Gemini is analyzing the ${formType} for ${ticker}...</p>
            <p class="text-xs text-gray-400 mt-2">Extracting text & generating insights.</p>
        </div>
    `;

    try {
        // 3. Determine Target Section (if not specified)
        let targetItem = filingItem;
        if (!targetItem) {
            if (formType === '10-Q') targetItem = 'part1item2'; // MD&A
            if (formType === '10-K') targetItem = 'item7';      // MD&A
        }

        // 4. Fetch Filing Content with Smart Retry for 8-K
        let filingText = '';
        let usedItem = targetItem;

        try {
            filingText = await getFilingContent(filingUrl, targetItem);
        } catch (error) {
            // Check if this is the specific "Supported items" error for 8-Ks
            if (error.message.includes('Supported items are:')) {
                const match = error.message.match(/Supported items are: (.*?)["}]/);
                if (match) {
                    const availableItems = match[1].split(',').map(s => s.trim());
                    
                    // Priority list for 8-K items (Earnings, Other Events, Agreements, Reg FD, Departures)
                    const priorities = ['2-2', '8-1', '1-1', '7-1', '5-2']; 
                    
                    // Find the first available item that matches our priority list, or default to the first one available
                    usedItem = priorities.find(p => availableItems.includes(p)) || availableItems[0];

                    console.log(`Full text failed. Retrying with Item ${usedItem} from list: ${availableItems.join(', ')}`);
                    
                    // Retry fetch with the specific item
                    filingText = await getFilingContent(filingUrl, usedItem);
                } else {
                    throw error; // Could not parse items, rethrow
                }
            } else {
                throw error; // Not the specific error we can handle, rethrow
            }
        }

        if (filingText.length > 500000) {
            filingText = filingText.substring(0, 500000) + "... [Text Truncated]";
        }

        // 5. Construct Prompt
        const basePrompt = promptMap[formType] || promptMap['8-K']; 
        let fullPrompt = `${basePrompt}\n\n`;
        
        // Add a contextual note if we had to narrow down the item
        if (usedItem && usedItem !== filingItem) {
            fullPrompt += `NOTE: Due to the filing structure, this analysis is based specifically on **Item ${usedItem}** of the report.\n\n`;
        }

        fullPrompt += `--- START OF FILING TEXT ---\n${filingText}\n--- END OF FILING TEXT ---`;

        // 6. Call Gemini API
        const analysisResult = await callGeminiApi(fullPrompt);

        // 7. Render Result (New "Intelligence Report" Layout)
        container.innerHTML = `
            <div class="bg-white border-b px-6 py-3 flex justify-between items-center shadow-sm shrink-0 z-10">
                <div class="flex items-center gap-3">
                    <div class="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M16 13H8"></path><path d="M16 17H8"></path><path d="M10 9H8"></path></svg>
                    </div>
                    <div>
                        <h3 class="font-bold text-gray-900 leading-tight">Analysis Report</h3>
                        <p class="text-xs text-gray-500 font-medium">${formType} • ${ticker} • ${new Date().toLocaleDateString()}</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                        Gemini 3 Pro
                    </span>
                </div>
            </div>

            <div class="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
                <div class="bg-white p-8 sm:p-10 rounded-xl shadow-sm border border-gray-200 max-w-3xl mx-auto">
                    
                    ${usedItem ? `
                        <div class="mb-8 flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0 text-blue-600 mt-0.5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" /></svg>
                            <div>
                                <span class="font-bold block mb-1 text-blue-900">Scope Note</span>
                                To ensure analysis accuracy, this report focuses specifically on <strong>Item ${usedItem}</strong>.
                            </div>
                        </div>
                    ` : ''}
                    
                    <div class="prose prose-slate prose-headings:text-indigo-900 prose-a:text-indigo-600 hover:prose-a:text-indigo-500 max-w-none">
                        ${marked.parse(analysisResult)}
                    </div>

                    <div class="mt-12 pt-6 border-t border-gray-100 text-center">
                        <p class="text-xs text-gray-400 uppercase tracking-widest font-semibold">AI Generated Content • Verify with Original Filings</p>
                    </div>
                </div>
                <div class="h-8"></div> </div>
        `;

    } catch (error) {
        console.error("Analysis failed:", error);
        // Restore padding for error view
        container.classList.add('p-6');
        container.classList.remove('bg-gray-50', 'flex', 'flex-col', 'h-full'); 
        
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-red-500 pt-12">
                <div class="bg-red-50 p-4 rounded-full mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h3 class="text-lg font-bold text-gray-900">Analysis Failed</h3>
                <p class="text-sm mt-2 text-center max-w-xs text-gray-600 bg-white p-3 rounded border border-gray-200 shadow-sm">${error.message}</p>
            </div>
        `;
    }
}

/**
 * Helper function to create a delay.
 * @param {number} ms Milliseconds to wait.
 * @returns {Promise<void>}
 */
const delay = ms => new Promise(res => setTimeout(res, ms));

// --- PHASE 1 BATCH PROCESSING ---
export async function handleBatchProcess() {
    const btn = document.getElementById('start-batch-process-btn');
    const analyzeBtn = document.getElementById('analyze-market-data-btn');
    const progressContainer = document.getElementById('batch-progress-container');
    if (!btn || !progressContainer || !analyzeBtn) return;

    btn.disabled = true;
    analyzeBtn.classList.add('hidden');
    progressContainer.innerHTML = `
        <p id="progress-status" class="text-sm font-medium text-gray-700">Starting process...</p>
        <div class="mt-2 w-full bg-gray-200 rounded-full h-2.5">
            <div id="progress-bar-fill" class="bg-indigo-600 h-2.5 rounded-full" style="width: 0%"></div>
        </div>
    `;
    const statusBar = document.getElementById('progress-status');
    const progressBar = document.getElementById('progress-bar-fill');

    try {
        for (let i = 0; i < TOP_25_INVESTORS.length; i++) {
            const investor = TOP_25_INVESTORS[i];
            const progress = ((i + 1) / TOP_25_INVESTORS.length) * 100;
            
            statusBar.textContent = `(${i + 1}/${TOP_25_INVESTORS.length}) Fetching filings for ${investor.name}...`;
            progressBar.style.width = `${progress}%`;
            
            // Add a 1-second delay between each request to avoid hitting the API rate limit.
            await delay(1000); 

            // 1. Fetch filings
            const { filings } = await getWhaleFilings(investor.cik);
            if (!filings || filings.length === 0) continue;

            // 2. Process filings (merge amendments, aggregate holdings)
            const groupedByPeriod = filings.reduce((acc, filing) => { /* ... */ acc[filing.periodOfReport] = acc[filing.periodOfReport] || {}; if (filing.formType.endsWith('/A')) acc[filing.periodOfReport].amendment = filing; else acc[filing.periodOfReport].original = filing; return acc; }, {});
            const filingsToProcess = Object.values(groupedByPeriod).map(group => { if (group.original && group.amendment) { const holdingsMap = new Map(group.original.holdings.map(h => [h.cusip, h])); group.amendment.holdings.forEach(h => holdingsMap.set(h.cusip, h)); return { ...group.amendment, holdings: Array.from(holdingsMap.values()) }; } return group.amendment || group.original; }).sort((a, b) => new Date(b.periodOfReport) - new Date(a.periodOfReport));

            const batch = writeBatch(state.db);

            for (let j = 0; j < filingsToProcess.length; j++) {
                const currentFiling = filingsToProcess[j];
                const previousFiling = filingsToProcess[j + 1];

                // 3. Aggregate holdings for the current quarter
                const aggregate = (filing) => { if (!filing || !filing.holdings) return []; const map = new Map(); for (const h of filing.holdings) { const t = h.ticker || 'N/A'; if (!map.has(t)) map.set(t, { n: h.nameOfIssuer, s: 0, v: 0 }); const e = map.get(t); e.s += Number(h.shrsOrPrnAmt.sshPrnamt); e.v += h.value; } return Array.from(map.entries()).map(([t, d]) => ({ t, ...d })); };
                const currentHoldingsAggregated = aggregate(currentFiling);

                let changes = {};
                if (previousFiling) {
                    // 4. Calculate Changes
                    const latestHoldingsMap = new Map(currentHoldingsAggregated.map(h => [h.t, h]));
                    const previousHoldingsMap = new Map(aggregate(previousFiling).map(h => [h.t, h]));
                    const c = { new: [], exited: [], increased: [], decreased: [] };
                    for (const [ticker, latest] of latestHoldingsMap.entries()) { const previous = previousHoldingsMap.get(ticker); if (!previous) { c.new.push(latest); } else { if (latest.s > previous.s) c.increased.push({ ...latest, c: latest.s - previous.s }); else if (latest.s < previous.s) c.decreased.push({ ...latest, c: latest.s - previous.s }); } }
                    for (const [ticker, previous] of previousHoldingsMap.entries()) { if (!latestHoldingsMap.has(ticker)) c.exited.push(previous); }
                    changes = c;
                }
                
                // 5. Save to Firestore
                const docRef = doc(state.db, CONSTANTS.DB_COLLECTION_INVESTOR_DATA, investor.cik, "QuarterlyReports", currentFiling.periodOfReport);
                batch.set(docRef, {
                    investorName: investor.name,
                    periodOfReport: currentFiling.periodOfReport,
                    filedAt: currentFiling.filedAt,
                    holdings: currentHoldingsAggregated,
                    changes: changes
                });
            }
            await batch.commit();
        }

        statusBar.textContent = 'Processing complete! All data has been saved to the database.';
        btn.textContent = 'Reprocess All Data';
        btn.disabled = false;
        analyzeBtn.classList.remove('hidden');
        displayMessageInModal('Successfully processed and saved data for all 25 investors.', 'info');

    } catch (error) {
        console.error("Error during batch process:", error);
        statusBar.textContent = `Error: ${error.message}`;
        displayMessageInModal(`Batch process failed: ${error.message}`, 'error');
        btn.disabled = false;
    }
}

// --- PHASE 2 ANALYSIS ---
export async function handleMarketAnalysis() {
    const analyzeBtn = document.getElementById('analyze-market-data-btn');
    const analysisContainer = document.getElementById('market-analysis-container');
    if (!analyzeBtn || !analysisContainer) return;

    analyzeBtn.disabled = true;
    analysisContainer.innerHTML = `<div class="p-4"><div class="loader mx-auto my-4"></div><p class="text-center text-gray-500">Querying database and analyzing trends...</p></div>`;

    try {
        // 1. Query all data from Firestore
        const allChanges = { buys: {}, sells: {} };
        const latestPeriods = {};

        for(const investor of TOP_25_INVESTORS) {
            const q = query(collection(state.db, CONSTANTS.DB_COLLECTION_INVESTOR_DATA, investor.cik, "QuarterlyReports"));
            const querySnapshot = await getDocs(q);
            
            let latestReport = null;
            querySnapshot.forEach(doc => {
                const report = doc.data();
                if (!latestReport || new Date(report.periodOfReport) > new Date(latestReport.periodOfReport)) {
                    latestReport = report;
                }
            });
            if(latestReport && latestReport.changes) latestPeriods[investor.cik] = latestReport;
        }

        // 2. Aggregate the changes
        for(const report of Object.values(latestPeriods)) {
            const buys = [...(report.changes.new || []), ...(report.changes.increased || [])];
            const sells = [...(report.changes.exited || []), ...(report.changes.decreased || [])];

            buys.forEach(stock => {
                if(!allChanges.buys[stock.t]) allChanges.buys[stock.t] = { count: 0, name: stock.n };
                allChanges.buys[stock.t].count++;
            });
            sells.forEach(stock => {
                if(!allChanges.sells[stock.t]) allChanges.sells[stock.t] = { count: 0, name: stock.n };
                allChanges.sells[stock.t].count++;
            });
        }
        
        const topBuys = Object.entries(allChanges.buys).sort(([,a],[,b]) => b.count - a.count).slice(0, 20).map(([ticker, data]) => ({ ticker, ...data }));
        const topSells = Object.entries(allChanges.sells).sort(([,a],[,b]) => b.count - a.count).slice(0, 20).map(([ticker, data]) => ({ ticker, ...data }));

        // 3. Construct GenAI Prompt
        const prompt = `
        You are a senior hedge fund analyst delivering a concise, data-driven market briefing to your Portfolio Manager. Your analysis will synthesize historical institutional positioning (from 13F filings) with the immediate, real-time market and macroeconomic context to identify potential investment opportunities.
        
        Contextual Data:
        
        Timestamp: ${new Date().toISOString()}
        
        Current US Economic Indicators:
        
        Latest CPI (YoY): [Insert latest CPI %]
        
        Latest Unemployment Rate: [Insert latest Unemployment %]
        
        Latest Non-Farm Payrolls: [Insert latest NFP number]
        
        Fed Funds Rate: [Insert current Fed Funds Rate Range]
        
        US 10-Year Treasury Yield: [Insert current 10-Yr Yield]
        
        Today's Market Snapshot:
        
        S&P 500: [Insert S&P 500 daily change %]
        
        NASDAQ 100: [Insert NASDAQ 100 daily change %]
        
        CBOE Volatility Index (VIX): [Insert current VIX level]
        
        Aggregated 13F Data (Last Quarter) from 25 Top Firms:
        
        Top Buys (by conviction & number of firms):
        Data should include symbol, sector, number of firms buying, total shares added, and number of firms initiating a new position.
        
        JSON
        
        ${JSON.stringify(topBuys, null, 2)}
        Top Sells (by conviction & number of firms):
        Data should include symbol, sector, number of firms selling, total shares sold, and number of firms exiting their position completely.
        
        JSON
        
        ${JSON.stringify(topSells, null, 2)}
        Analysis Required:
        
        Executive Summary (The "So What?"):
        
        Synthesize the macro context with the institutional positioning. Is the "smart money" positioning (from the 13Fs) aligned with or contrary to the latest economic data?
        
        Based on this synthesis, characterize the prevailing market sentiment. Is it risk-on, risk-off, or something more nuanced (e.g., cautiously optimistic, defensively positioned for a slowdown)?
        
        Key Sector & Thematic Rotations:
        
        Identify the top 2-3 sectors being bought and the top 2-3 sectors being sold.
        
        What macro-thematic narrative do these flows suggest? (e.g., a rotation into cyclical value, a flight to defensive tech, an exit from consumer discretionary due to inflation fears, etc.).
        
        High-Conviction Stock Analysis:
        
        Highlight the top 2-3 stocks with the highest conviction from the topBuys data (consider new positions and large share increases). For each, provide a plausible thesis explaining why top managers are buying now.
        
        Highlight the most notable stock from the topSells data, especially if it represents a major trend reversal or an exit by multiple respected firms. What is the likely bear thesis?
        
        Prospective QARP & GARP Screener:
        
        From the topBuys list, identify 2-3 potential GARP candidates. Justify your selection based on their sector, growth narrative, and the fact that respected growth-oriented funds are accumulating shares.
        
        From the topBuys list, identify 2-3 potential QARP candidates. Justify your selection based on their likely stable earnings, strong balance sheets, and acquisition by value or quality-focused managers at a perceived reasonable valuation.
        
        Contrarian & Risk Signals:
        
        Are there any highly crowded trades evident in the data that might pose a risk?
        
        Does the selling activity point to any sectors or themes that may be falling out of favor, presenting a potential "value trap" or short opportunity?
        `.trim();

        // 4. Get and render analysis
        const analysisContent = await callGeminiApi(prompt);
        analysisContainer.innerHTML = `<div class="prose max-w-none p-4 border-l-4 border-indigo-500 bg-indigo-50 rounded-lg">${marked.parse(analysisContent)}</div>`;

    } catch (error) {
        console.error("Error during market analysis:", error);
        analysisContainer.innerHTML = `<p class="text-red-500">Error: ${error.message}</p>`;
    } finally {
        analyzeBtn.disabled = false;
    }
}
