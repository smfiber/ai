import { state, promptMap, TOP_25_INVESTORS, CONSTANTS } from './config.js';
import { openModal, closeModal, displayMessageInModal } from './ui-modals.js';
import { callGeminiApi } from './api.js';
import { getFilingContent, getWhaleFilings } from './sec-api.js';
import { doc, setDoc, getDocs, collection, query, writeBatch } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

/**
 * Helper to format SEC Item codes into readable text.
 */
function formatItemName(item) {
    const map = {
        'part1item2': 'MD&A',
        'item7': 'MD&A',
        'item1': 'Business',
        'item1a': 'Risk Factors',
        'part2item1a': 'Risk Factors',
        '2-2': 'Earnings Results',
        '8-1': 'Other Events',
        '1-1': 'Material Agreements',
        '7-1': 'Reg FD Disclosure',
        '5-2': 'Officer Departures'
    };
    return map[item] || `Item ${item}`;
}

/**
 * Handles the AI analysis of a specific SEC filing.
 */
export async function handleFilingAnalysis(filingUrl, formType, ticker, filingItem = null) {
    const container = document.getElementById('filing-analysis-container');
    if (!container) return;

    // 1. Adjust Layout for Better Readability (33% List / 66% Report)
    const parentGrid = container.parentElement;
    if (parentGrid) {
        parentGrid.classList.remove('md:grid-cols-2');
        parentGrid.classList.add('md:grid-cols-3');
        if (parentGrid.firstElementChild) parentGrid.firstElementChild.classList.add('md:col-span-1');
        container.classList.add('md:col-span-2');
    }

    // 2. Reset Container Styling
    container.classList.remove('p-6', 'prose', 'max-w-none');
    container.classList.add('h-full', 'flex', 'flex-col', 'bg-gray-50', 'overflow-hidden');

    container.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full">
            <div class="loader mb-4"></div>
            <p class="text-gray-600 font-medium">Gemini is analyzing the ${formType} for ${ticker}...</p>
            <p class="text-xs text-gray-400 mt-2">Extracting full text & generating insights.</p>
        </div>
    `;

    try {
        // 3. Fetch Filing Content (Attempt Full Text First)
        let filingText = '';
        let usedSections = [];
        
        try {
            // Try to get the whole thing first
            filingText = await getFilingContent(filingUrl, filingItem); 
            if(filingItem) usedSections.push(formatItemName(filingItem));
            else usedSections.push('Full Filing Text');

        } catch (error) {
            // 4. Handle "Item Not Supported" / 404 Errors (The Composite Strategy)
            if (error.message.includes('Supported items are:') || error.message.includes('404')) {
                console.log("Full text failed. Switching to Composite Strategy.");
                
                let partsToFetch = [];
                
                // Define Composite Parts based on Form Type
                if (formType === '10-K') {
                    // MD&A + Risks + Business
                    partsToFetch = ['item7', 'item1a', 'item1']; 
                } else if (formType === '10-Q') {
                    // MD&A + Updated Risks
                    partsToFetch = ['part1item2', 'part2item1a']; 
                } else if (formType === '8-K') {
                    // 8-K Smart Retry Logic (Existing)
                    const match = error.message.match(/Supported items are: (.*?)["}]/);
                    if (match) {
                        const available = match[1].split(',').map(s => s.trim());
                        const priority = ['2-2', '8-1', '1-1', '7-1', '5-2'];
                        const bestItem = priority.find(p => available.includes(p)) || available[0];
                        partsToFetch = [bestItem];
                    }
                }

                if (partsToFetch.length > 0) {
                    // Fetch all parts in parallel
                    const results = await Promise.all(
                        partsToFetch.map(item => 
                            getFilingContent(filingUrl, item)
                                .then(text => ({ item, text }))
                                .catch(() => ({ item, text: '' })) // Ignore individual failures
                        )
                    );

                    // Stitch them together
                    filingText = results
                        .filter(r => r.text.length > 100) // Filter empty/failed sections
                        .map(r => {
                            usedSections.push(formatItemName(r.item));
                            return `\n\n=== SECTION: ${formatItemName(r.item)} ===\n${r.text}`;
                        })
                        .join('\n');
                        
                    if (!filingText) throw new Error("Could not extract any meaningful sections from this filing.");
                    
                } else {
                    throw error; // Rethrow if we can't handle it
                }
            } else {
                throw error;
            }
        }

        // Truncate if still too huge (Gemini 1.5 Pro has a huge context window, but let's be safe for the generic endpoint)
        if (filingText.length > 700000) {
            filingText = filingText.substring(0, 700000) + "... [Text Truncated]";
        }

        // 5. Construct Prompt
        const basePrompt = promptMap[formType] || promptMap['8-K']; 
        const fullPrompt = `${basePrompt}\n\n--- START OF FILING DATA ---\n${filingText}\n--- END OF FILING DATA ---`;

        // 6. Call Gemini API
        const analysisResult = await callGeminiApi(fullPrompt);

        // 7. Render Result
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
                    <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">Gemini 3 Pro</span>
                </div>
            </div>

            <div class="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
                <div class="bg-white p-8 sm:p-10 rounded-xl shadow-sm border border-gray-200 max-w-3xl mx-auto">
                    
                    ${usedSections.length > 0 && usedSections[0] !== 'Full Filing Text' ? `
                        <div class="mb-8 flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
                             <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0 text-blue-600 mt-0.5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" /></svg>
                            <div>
                                <span class="font-bold block mb-1 text-blue-900">Composite Analysis Mode</span>
                                Full text unavailable via API. Analysis synthesized from: <strong>${usedSections.join(', ')}</strong>.
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
                <div class="h-8"></div>
            </div>
        `;

    } catch (error) {
        console.error("Analysis failed:", error);
        container.classList.add('p-6');
        container.classList.remove('bg-gray-50', 'flex', 'flex-col', 'h-full'); 
        
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-red-500 pt-12">
                <div class="bg-red-50 p-4 rounded-full mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h3 class="text-lg font-bold text-gray-900">Analysis Failed</h3>
                <p class="text-sm mt-2 text-center max-w-xs text-gray-600 bg-white p-3 rounded border border-gray-200 shadow-sm">${error.message}</p>
            </div>
        `;
    }
}

/**
 * Helper function to create a delay.
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
            
            await delay(1000); 

            const { filings } = await getWhaleFilings(investor.cik);
            if (!filings || filings.length === 0) continue;

            const groupedByPeriod = filings.reduce((acc, filing) => { acc[filing.periodOfReport] = acc[filing.periodOfReport] || {}; if (filing.formType.endsWith('/A')) acc[filing.periodOfReport].amendment = filing; else acc[filing.periodOfReport].original = filing; return acc; }, {});
            const filingsToProcess = Object.values(groupedByPeriod).map(group => { if (group.original && group.amendment) { const holdingsMap = new Map(group.original.holdings.map(h => [h.cusip, h])); group.amendment.holdings.forEach(h => holdingsMap.set(h.cusip, h)); return { ...group.amendment, holdings: Array.from(holdingsMap.values()) }; } return group.amendment || group.original; }).sort((a, b) => new Date(b.periodOfReport) - new Date(a.periodOfReport));

            const batch = writeBatch(state.db);

            for (let j = 0; j < filingsToProcess.length; j++) {
                const currentFiling = filingsToProcess[j];
                const previousFiling = filingsToProcess[j + 1];

                const aggregate = (filing) => { if (!filing || !filing.holdings) return []; const map = new Map(); for (const h of filing.holdings) { const t = h.ticker || 'N/A'; if (!map.has(t)) map.set(t, { n: h.nameOfIssuer, s: 0, v: 0 }); const e = map.get(t); e.s += Number(h.shrsOrPrnAmt.sshPrnamt); e.v += h.value; } return Array.from(map.entries()).map(([t, d]) => ({ t, ...d })); };
                const currentHoldingsAggregated = aggregate(currentFiling);

                let changes = {};
                if (previousFiling) {
                    const latestHoldingsMap = new Map(currentHoldingsAggregated.map(h => [h.t, h]));
                    const previousHoldingsMap = new Map(aggregate(previousFiling).map(h => [h.t, h]));
                    const c = { new: [], exited: [], increased: [], decreased: [] };
                    for (const [ticker, latest] of latestHoldingsMap.entries()) { const previous = previousHoldingsMap.get(ticker); if (!previous) { c.new.push(latest); } else { if (latest.s > previous.s) c.increased.push({ ...latest, c: latest.s - previous.s }); else if (latest.s < previous.s) c.decreased.push({ ...latest, c: latest.s - previous.s }); } }
                    for (const [ticker, previous] of previousHoldingsMap.entries()) { if (!latestHoldingsMap.has(ticker)) c.exited.push(previous); }
                    changes = c;
                }
                
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
        
        Top Buys:
        ${JSON.stringify(topBuys, null, 2)}
        
        Top Sells:
        ${JSON.stringify(topSells, null, 2)}
        
        Analysis Required:
        1. Executive Summary (The "So What?")
        2. Key Sector & Thematic Rotations
        3. High-Conviction Stock Analysis
        4. Prospective QARP & GARP Screener
        5. Contrarian & Risk Signals
        `.trim();

        const analysisContent = await callGeminiApi(prompt);
        analysisContainer.innerHTML = `<div class="prose max-w-none p-4 border-l-4 border-indigo-500 bg-indigo-50 rounded-lg">${marked.parse(analysisContent)}</div>`;

    } catch (error) {
        console.error("Error during market analysis:", error);
        analysisContainer.innerHTML = `<p class="text-red-500">Error: ${error.message}</p>`;
    } finally {
        analyzeBtn.disabled = false;
    }
}
