import { state, promptMap, TOP_25_INVESTORS, CONSTANTS } from './config.js';
import { openModal, closeModal, displayMessageInModal } from './ui-modals.js';
import { callGeminiApi } from './api.js';
import { getFilingContent, getWhaleFilings } from './sec-api.js';
import { doc, setDoc, getDocs, collection, query, writeBatch } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

/**
 * Handles the AI analysis of a specific SEC filing.
 * (This function is unchanged)
 */
export async function handleFilingAnalysis(filingUrl, formType, ticker, filingItem = null) {
    // ... (no changes in this function) ...
}

// --- CHANGE STARTS HERE ---
/**
 * Helper function to create a delay.
 * @param {number} ms Milliseconds to wait.
 * @returns {Promise<void>}
 */
const delay = ms => new Promise(res => setTimeout(res, ms));
// --- CHANGE ENDS HERE ---


// --- NEW: PHASE 1 BATCH PROCESSING ---
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
            
            // --- CHANGE STARTS HERE ---
            // Add a 1-second delay between each request to avoid hitting the API rate limit.
            await delay(1000); 
            // --- CHANGE ENDS HERE ---

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

// --- NEW: PHASE 2 ANALYSIS ---
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
