import { CONSTANTS, state, TOP_25_INVESTORS } from './config.js'; 
// --- MODIFICATION: Removed 'query' and 'where' as they are no longer needed ---
import { getDocs, collection } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getEarningsCalendar } from './api.js';
import { getRecentPortfolioFilings, getPortfolioInsiderTrading, getPortfolioInstitutionalOwnership, getSecMaterialEvents, getSecAnnualReports, getSecQuarterlyReports, get13FHoldings, getWhaleFilings } from './sec-api.js';
import { callApi } from './api.js';

// --- UTILITY & SECURITY HELPERS ---
function sanitizeText(text) {
    if (typeof text !== 'string') return '';
    const tempDiv = document.createElement('div');
    tempDiv.textContent = text;
    return tempDiv.innerHTML;
}

// --- DATA FETCHING & CACHING ---
export async function fetchAndCachePortfolioData() {
    try {
        if (!state.db) {
            console.error("Firestore is not initialized.");
            state.portfolioCache = [];
            return;
        }
        
        // --- CHANGE STARTS HERE ---
        // Reverted to fetching the entire collection, per user request, to match other apps.
        // This is less secure in a multi-user environment but will work for a single user.
        const querySnapshot = await getDocs(collection(state.db, CONSTANTS.DB_COLLECTION_PORTFOLIO));
        // --- CHANGE ENDS HERE ---
        
        state.portfolioCache = querySnapshot.docs.map(doc => ({ ticker: doc.id, ...doc.data() }));
        
    } catch (error) {
        console.error("Error fetching portfolio data:", error);
        state.portfolioCache = []; // Ensure cache is empty on error
    }
}

// --- DASHBOARD RENDERING ---

function renderFilingsCard(containerId, filings) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const formType = containerId.includes('8k') ? '8-K' : (containerId.includes('10q') ? '10-Q' : '10-K');

    if (filings.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-500 py-4">No recent ${formType} filings found.</p>`;
        return;
    }

    filings.sort((a, b) => new Date(b.filedAt) - new Date(a.filedAt));

    const filingsHtml = `
        <ul class="divide-y divide-gray-200">
            ${filings.map(filing => {
                const stock = state.portfolioCache.find(s => s.ticker === filing.ticker);
                const companyName = stock ? stock.companyName : filing.ticker;
                const filingDate = new Date(filing.filedAt).toLocaleDateString();

                return `
                    <li class="p-3 hover:bg-gray-50">
                        <div class="flex justify-between items-center">
                            <div>
                                <a href="#" class="company-link font-semibold text-sm text-gray-800 hover:text-indigo-600" data-ticker="${sanitizeText(filing.ticker)}">
                                    ${sanitizeText(companyName)} (${sanitizeText(filing.ticker)})
                                </a>
                                <p class="text-xs text-gray-500 mt-1">Filed on ${filingDate}</p>
                            </div>
                            <a href="${sanitizeText(filing.linkToFilingDetails)}" target="_blank" rel="noopener noreferrer" class="text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-1 px-3 rounded-lg">
                                View
                            </a>
                        </div>
                    </li>
                `;
            }).join('')}
        </ul>
    `;
    container.innerHTML = filingsHtml;
}


export async function fetchAndRenderRecentFilings() {
    const containers = {
        '8-K': document.getElementById('recent-8k-container'),
        '10-Q': document.getElementById('recent-10q-container'),
        '10-K': document.getElementById('recent-10k-container'),
    };
    
    const loadingHtml = `
        <div class="loader mx-auto my-8"></div>
        <p class="text-center text-gray-500">Loading...</p>`;
    
    Object.values(containers).forEach(container => {
        if(container) container.innerHTML = loadingHtml;
    });

    try {
        const portfolioStocks = state.portfolioCache.filter(s => s.status === 'Portfolio');
        if (portfolioStocks.length === 0) {
            const emptyMsg = `<p class="text-center text-gray-500 py-8">Your portfolio is empty.</p>`;
            Object.values(containers).forEach(container => {
                if(container) container.innerHTML = emptyMsg;
            });
            return;
        }

        const tickers = portfolioStocks.map(s => s.ticker);
        const allFilings = await getRecentPortfolioFilings(tickers);
        state.recentFilingsCache = allFilings; // Cache the results

        const latestFilings = {
            '8-K': new Map(),
            '10-Q': new Map(),
            '10-K': new Map()
        };

        for (const filing of allFilings) {
            const formType = filing.formType;
            const ticker = filing.ticker;

            if (latestFilings[formType] && !latestFilings[formType].has(ticker)) {
                latestFilings[formType].set(ticker, filing);
            }
        }
        
        renderFilingsCard('recent-8k-container', Array.from(latestFilings['8-K'].values()));
        renderFilingsCard('recent-10q-container', Array.from(latestFilings['10-Q'].values()));
        renderFilingsCard('recent-10k-container', Array.from(latestFilings['10-K'].values()));
        
    } catch (error) {
        console.error("Error fetching or rendering recent filings:", error);
        const errorMsg = `<p class="text-center text-red-500 p-8">Could not load filings: ${error.message}</p>`;
        Object.values(containers).forEach(container => {
            if(container) container.innerHTML = errorMsg;
        });
    }
}

export async function fetchAndRenderRevisitFilings() {
    const containers = {
        '8-K': document.getElementById('revisit-8k-container'),
        '10-Q': document.getElementById('revisit-10q-container'),
        '10-K': document.getElementById('revisit-10k-container'),
    };
    
    const loadingHtml = `<div class="loader mx-auto my-8"></div><p class="text-center text-gray-500">Loading...</p>`;
    Object.values(containers).forEach(c => { if(c) c.innerHTML = loadingHtml; });

    try {
        const revisitStocks = state.portfolioCache.filter(s => s.status === 'Revisit 6 months');
        if (revisitStocks.length === 0) {
            const emptyMsg = `<p class="text-center text-gray-500 py-8">No stocks to revisit.</p>`;
            Object.values(containers).forEach(c => { if(c) c.innerHTML = emptyMsg; });
            return;
        }

        const tickers = revisitStocks.map(s => s.ticker);
        const allFilings = await getRecentPortfolioFilings(tickers);
        const latestFilings = { '8-K': new Map(), '10-Q': new Map(), '10-K': new Map() };

        for (const filing of allFilings) {
            if (latestFilings[filing.formType] && !latestFilings[filing.formType].has(filing.ticker)) {
                latestFilings[filing.formType].set(filing.ticker, filing);
            }
        }
        
        renderFilingsCard('revisit-8k-container', Array.from(latestFilings['8-K'].values()));
        renderFilingsCard('revisit-10q-container', Array.from(latestFilings['10-Q'].values()));
        renderFilingsCard('revisit-10k-container', Array.from(latestFilings['10-K'].values()));
        
    } catch (error) {
        console.error("Error fetching revisit filings:", error);
        const errorMsg = `<p class="text-center text-red-500 p-8">Could not load filings: ${error.message}</p>`;
        Object.values(containers).forEach(c => { if(c) c.innerHTML = errorMsg; });
    }
}

export async function fetchAndRenderWatchlistFilings() {
    const containers = {
        '8-K': document.getElementById('watchlist-8k-container'),
        '10-Q': document.getElementById('watchlist-10q-container'),
        '10-K': document.getElementById('watchlist-10k-container'),
    };
    
    const loadingHtml = `<div class="loader mx-auto my-8"></div><p class="text-center text-gray-500">Loading...</p>`;
    Object.values(containers).forEach(c => { if(c) c.innerHTML = loadingHtml; });

    try {
        const watchlistStocks = state.portfolioCache.filter(s => s.status === 'Watchlist');
        if (watchlistStocks.length === 0) {
            const emptyMsg = `<p class="text-center text-gray-500 py-8">Your watchlist is empty.</p>`;
            Object.values(containers).forEach(c => { if(c) c.innerHTML = emptyMsg; });
            return;
        }

        const tickers = watchlistStocks.map(s => s.ticker);
        const allFilings = await getRecentPortfolioFilings(tickers);
        const latestFilings = { '8-K': new Map(), '10-Q': new Map(), '10-K': new Map() };

        for (const filing of allFilings) {
            if (latestFilings[filing.formType] && !latestFilings[filing.formType].has(filing.ticker)) {
                latestFilings[filing.formType].set(filing.ticker, filing);
            }
        }
        
        renderFilingsCard('watchlist-8k-container', Array.from(latestFilings['8-K'].values()));
        renderFilingsCard('watchlist-10q-container', Array.from(latestFilings['10-Q'].values()));
        renderFilingsCard('watchlist-10k-container', Array.from(latestFilings['10-K'].values()));
        
    } catch (error) {
        console.error("Error fetching watchlist filings:", error);
        const errorMsg = `<p class="text-center text-red-500 p-8">Could not load filings: ${error.message}</p>`;
        Object.values(containers).forEach(c => { if(c) c.innerHTML = errorMsg; });
    }
}

// --- NEW TAB CONTENT RENDERERS ---

function renderFilingsByCompany(filings) {
    const container = document.getElementById('filings-by-company-container');
    if (!container) return;

    const sevenDaysAgo = new Date(Date.now() - 168 * 60 * 60 * 1000);
    const recentFilings = filings.filter(f => new Date(f.filedAt) > sevenDaysAgo);

    if (recentFilings.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-500 py-4">No new filings in the last 7 days.</p>`;
        return;
    }

    const filingsByCompany = recentFilings.reduce((acc, filing) => {
        if (!acc[filing.ticker]) {
            acc[filing.ticker] = 0;
        }
        acc[filing.ticker]++;
        return acc;
    }, {});

    const listHtml = `
        <ul class="divide-y divide-gray-200">
            ${Object.entries(filingsByCompany).map(([ticker, count]) => `
                <li class="p-2 flex justify-between items-center text-sm">
                    <a href="#" class="company-link font-semibold text-gray-700 hover:text-indigo-600" data-ticker="${sanitizeText(ticker)}">${sanitizeText(ticker)}</a>
                    <span class="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">${count} new</span>
                </li>
            `).join('')}
        </ul>
    `;
    container.innerHTML = listHtml;
}

async function renderUpcomingEarnings() {
    const container = document.getElementById('upcoming-filings-container');
    if (!container) return;
    container.innerHTML = `<div class="loader mx-auto my-8"></div>`;

    try {
        const tickers = state.portfolioCache.filter(s => s.status === 'Portfolio').map(s => s.ticker);
        if (tickers.length === 0) {
             container.innerHTML = `<p class="text-center text-gray-500 py-4">Your portfolio is empty.</p>`;
            return;
        }

        const earningsData = await getEarningsCalendar(tickers);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcomingEarnings = earningsData
            .filter(e => e.date && new Date(e.date) >= today)
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        if (upcomingEarnings.length === 0) {
            container.innerHTML = `<p class="text-center text-gray-500 py-4">No upcoming earnings scheduled.</p>`;
            return;
        }
        
        const listHtml = `
            <ul class="divide-y divide-gray-200">
                ${upcomingEarnings.slice(0, 25).map(e => `
                     <li class="p-2 flex justify-between items-center text-sm">
                        <span class="font-semibold text-gray-700">${sanitizeText(e.symbol)}</span>
                        <span class="text-gray-600">${new Date(e.date).toLocaleDateString()}</span>
                    </li>
                `).join('')}
            </ul>
        `;
        container.innerHTML = listHtml;

    } catch (error) {
        console.error("Error rendering upcoming earnings:", error);
        container.innerHTML = `<p class="text-center text-red-500 py-4">Could not load earnings data.</p>`;
    }
}

export function renderUpcomingEarningsView() {
    renderUpcomingEarnings();
}

export function renderFilingsActivityView() {
    renderFilingsByCompany(state.recentFilingsCache);
}


// --- DEEP DIVE MODAL RENDERING ---
async function renderOwnershipFlow(ticker) {
    const container = document.getElementById('ownership-flow-container');
    if (!container) return;
    container.innerHTML = `<div class="p-4"><div class="loader mx-auto"></div></div>`;

    try {
        const url = `https://api.sec-api.io?token=${state.secApiKey}`;
        const queryObject = {
            "query": { "query_string": { "query": `formType:\"13F-HR\" AND holdings.ticker:\"${ticker}\"` } },
            "from": "0", "size": "250", "sort": [{ "filedAt": { "order": "desc" } }]
        };
        const result = await callApi(url, { method: 'POST', body: JSON.stringify(queryObject) });
        const allFilings = result.filings || [];

        const filingsByQuarter = allFilings.reduce((acc, f) => {
            const quarter = f.periodOfReport;
            if (!acc[quarter]) acc[quarter] = [];
            acc[quarter].push(f);
            return acc;
        }, {});

        const sortedQuarters = Object.keys(filingsByQuarter).sort().reverse();
        if (sortedQuarters.length < 2) {
            container.innerHTML = `<p class="text-sm text-center text-gray-500 p-4">Not enough historical data to compare ownership.</p>`;
            return;
        }

        const currentHoldingsList = filingsByQuarter[sortedQuarters[0]];
        const prevHoldingsList = filingsByQuarter[sortedQuarters[1]];
        
        const currentHoldings = new Map(currentHoldingsList.map(f => [f.companyName, f.holdings.find(h => h.ticker === ticker).value]));
        const prevHoldings = new Map(prevHoldingsList.map(f => [f.companyName, f.holdings.find(h => h.ticker === ticker).value]));

        const increased = [], decreased = [], newPositions = [], soldPositions = [];

        for (const [name, value] of currentHoldings.entries()) {
            if (prevHoldings.has(name)) {
                if (value > prevHoldings.get(name)) increased.push({ name, value });
                else if (value < prevHoldings.get(name)) decreased.push({ name, value });
            } else {
                newPositions.push({ name, value });
            }
        }
        for (const [name, value] of prevHoldings.entries()) {
            if (!currentHoldings.has(name)) soldPositions.push({ name, value });
        }
        
        const renderList = (title, items, color) => {
            if (items.length === 0) return '';
            return `
                <div>
                    <h4 class="font-semibold text-xs uppercase tracking-wider text-gray-500 mb-1">${title}</h4>
                    <ul class="text-sm space-y-1">
                        ${items.sort((a,b) => b.value - a.value).slice(0, 5).map(item => `
                            <li class="flex justify-between items-center">
                                <span class="truncate pr-2">${sanitizeText(item.name)}</span>
                                <span class="font-mono text-xs ${color} font-semibold">$${item.value.toLocaleString()}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>`;
        };

        container.innerHTML = `
             <div class="p-3 border rounded-lg bg-gray-50">
                <h3 class="text-base font-semibold text-gray-800 mb-3">Institutional Ownership Flow</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    ${renderList('New Positions', newPositions, 'text-green-600')}
                    ${renderList('Increased Positions', increased, 'text-green-500')}
                    ${renderList('Sold Out', soldPositions, 'text-red-600')}
                    ${renderList('Decreased Positions', decreased, 'text-red-500')}
                </div>
            </div>`;

    } catch (error) {
        console.error('Error rendering ownership flow:', error);
        container.innerHTML = `<p class="text-sm text-center text-red-500 p-4">Could not load ownership data.</p>`;
    }
}


export async function renderCompanyDeepDive(ticker) {
    const container = document.getElementById('historical-filings-container');
    const ownershipContainer = document.getElementById('ownership-flow-container');
    if (!container || !ownershipContainer) return;
    
    renderOwnershipFlow(ticker);

    try {
        const [events, annual, quarterly] = await Promise.all([
            getSecMaterialEvents(ticker),
            getSecAnnualReports(ticker),
            getSecQuarterlyReports(ticker)
        ]);

        const allFilings = [...events, ...annual, ...quarterly];

        if (allFilings.length === 0) {
            container.innerHTML = `<p class="text-center text-gray-500 py-8">No filings found for ${ticker}.</p>`;
            return;
        }

        allFilings.sort((a, b) => new Date(b.filedAt) - new Date(a.filedAt));

        const listHtml = `
            <ul class="divide-y divide-gray-200">
                ${allFilings.map(filing => {
                    const filingDate = new Date(filing.filedAt).toLocaleDateString();
                    let formTypeBadge = '';

                    if (filing.formType === '8-K') {
                        formTypeBadge = '<span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">8-K</span>';
                    } else if (filing.formType === '10-K') {
                        formTypeBadge = '<span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-800">10-K</span>';
                    } else if (filing.formType === '10-Q') {
                        formTypeBadge = '<span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">10-Q</span>';
                    }

                    return `
                        <li class="p-3 hover:bg-gray-50">
                            <div class="flex justify-between items-center">
                                <div>
                                    <p class="font-semibold text-gray-700">${formTypeBadge}</p>
                                    <p class="text-xs text-gray-500 mt-1">Filed: ${filingDate}</p>
                                </div>
                                <div class="flex items-center gap-2">
                                     <button data-filing-url="${sanitizeText(filing.linkToFilingDetails)}" data-form-type="${filing.formType}" data-ticker="${ticker}" class="analyze-filing-btn text-sm bg-indigo-100 hover:bg-indigo-200 text-indigo-800 font-semibold py-1 px-3 rounded-lg">Analyze</button>
                                    <a href="${sanitizeText(filing.linkToFilingDetails)}" target="_blank" rel="noopener noreferrer" class="text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-1 px-3 rounded-lg">View</a>
                                </div>
                            </div>
                        </li>
                    `;
                }).join('')}
            </ul>
        `;
        container.innerHTML = listHtml;
    } catch (error) {
        console.error(`Error rendering deep dive for ${ticker}:`, error);
        container.innerHTML = `<p class="text-center text-red-500 p-4">Could not load historical filings: ${error.message}</p>`;
    }
}

// --- ACTIVITY TRACKER RENDERING ---

export async function renderInsiderTrackerView() {
    const container = document.getElementById('insider-tracker-view');
    if (!container) return;
    container.innerHTML = `<div class="loader mx-auto my-8"></div>`;

    try {
        const tickers = state.portfolioCache.filter(s => s.status === 'Portfolio').map(s => s.ticker);
        if (tickers.length === 0) {
            container.innerHTML = `<p class="text-center text-gray-500 py-8">Your portfolio is empty.</p>`;
            return;
        }

        const filings = await getPortfolioInsiderTrading(tickers);
        const transactions = filings.flatMap(filing => {
            const allTxns = [
                ...(filing.transactionTable?.nonDerivativeTable || []),
                ...(filing.transactionTable?.derivativeTable || [])
            ];
            return allTxns
                .filter(txn => ['P', 'S'].includes(txn.transactionCoding?.transactionCode))
                .map(txn => ({
                    filedAt: filing.filedAt,
                    ticker: filing.ticker,
                    reportingOwnerName: filing.reportingOwnerName,
                    linkToFilingDetails: filing.linkToFilingDetails,
                    transactionCode: txn.transactionCoding?.transactionCode,
                    transactionShares: txn.transactionShares?.value,
                    transactionPricePerShare: txn.transactionPricePerShare?.value
                }));
        }).sort((a, b) => new Date(b.filedAt) - new Date(a.filedAt));

        if (transactions.length === 0) {
            container.innerHTML = `<p class="text-center text-gray-500 py-8">No recent insider transactions (buys or sells) found for your portfolio.</p>`;
            return;
        }

        const tableHtml = `
            <div class="dashboard-card">
                <h2 class="dashboard-card-title">Portfolio-Wide Insider Transactions (Form 4)</h2>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200 text-sm">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th class="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Ticker</th>
                                <th class="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Filer</th>
                                <th class="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th class="px-4 py-2 text-right font-medium text-gray-500 uppercase tracking-wider">Value</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            ${transactions.map(t => {
                                const type = t.transactionCode === 'P' ? 'Buy' : 'Sell';
                                const typeClass = type === 'Buy' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold';
                                const value = (t.transactionPricePerShare || 0) * (t.transactionShares || 0);
                                return `
                                    <tr>
                                        <td class="px-4 py-2 whitespace-nowrap">${new Date(t.filedAt).toLocaleDateString()}</td>
                                        <td class="px-4 py-2 whitespace-nowrap font-bold">${sanitizeText(t.ticker)}</td>
                                        <td class="px-4 py-2 whitespace-nowrap"><a href="${sanitizeText(t.linkToFilingDetails)}" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:underline">${sanitizeText(t.reportingOwnerName)}</a></td>
                                        <td class="px-4 py-2 whitespace-nowrap ${typeClass}">${type}</td>
                                        <td class="px-4 py-2 whitespace-nowrap text-right">$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
        container.innerHTML = tableHtml;
    } catch (error) {
        console.error("Error rendering insider tracker:", error);
        container.innerHTML = `<p class="text-center text-red-500 p-8">Could not load insider activity: ${error.message}</p>`;
    }
}

export async function renderInstitutionalTrackerView() {
    const container = document.getElementById('institutional-tracker-view');
    if (!container) return;
    container.innerHTML = `<div class="loader mx-auto my-8"></div>`;

    try {
        const portfolioTickers = state.portfolioCache.filter(s => s.status === 'Portfolio').map(s => s.ticker);
        if (portfolioTickers.length === 0) {
            container.innerHTML = `<p class="text-center text-gray-500 py-8">Your portfolio is empty.</p>`;
            return;
        }

        const filings = await getPortfolioInstitutionalOwnership(portfolioTickers);

        const holdingsByInstitution = filings.reduce((acc, filing) => {
            const institution = filing.companyName;
            if (!acc[institution]) {
                acc[institution] = { holdings: [], latestFiling: '1970-01-01' };
            }
            filing.holdings.forEach(h => {
                if (portfolioTickers.includes(h.ticker)) {
                    acc[institution].holdings.push(h);
                }
            });
            if (filing.filedAt > acc[institution].latestFiling) {
                acc[institution].latestFiling = filing.filedAt;
            }
            return acc;
        }, {});
        
        if (Object.keys(holdingsByInstitution).length === 0) {
             container.innerHTML = `<p class="text-center text-gray-500 py-8">No recent institutional ownership filings found for your portfolio.</p>`;
            return;
        }

        const sortedInstitutions = Object.entries(holdingsByInstitution)
            .map(([name, data]) => ({ name, ...data, totalValue: data.holdings.reduce((sum, h) => sum + h.value, 0) }))
            .filter(inst => inst.totalValue > 0)
            .sort((a, b) => b.totalValue - a.totalValue);

        let html = `<div class="dashboard-card">
                        <h2 class="dashboard-card-title">Portfolio-Wide Institutional Ownership (Form 13F)</h2>
                        <div class="space-y-4">`;

        sortedInstitutions.slice(0, 50).forEach(inst => {
            html += `
                <details class="sector-group">
                    <summary class="sector-header">
                        <span class="truncate">${sanitizeText(inst.name)}</span>
                        <span class="font-normal text-gray-600 text-sm">$${inst.totalValue.toLocaleString()}</span>
                    </summary>
                    <div class="sector-content">
                        <ul class="divide-y divide-gray-100">
                        ${inst.holdings.map(h => `
                            <li class="p-3 flex justify-between items-center">
                                <span class="font-semibold">${sanitizeText(h.ticker)}</span>
                                <span class="text-sm text-gray-700">$${h.value.toLocaleString()}</span>
                            </li>
                        `).join('')}
                        </ul>
                    </div>
                </details>
            `;
        });

        html += '</div></div>';
        container.innerHTML = html;

    } catch (error) {
        console.error("Error rendering institutional tracker:", error);
        container.innerHTML = `<p class="text-center text-red-500 p-8">Could not load institutional ownership: ${error.message}</p>`;
    }
}

export function renderMarketAnalysisView() {
    const container = document.getElementById('market-analysis-view');
    if (!container) return;

    const html = `
        <div class="dashboard-card max-w-4xl mx-auto">
            <h2 class="dashboard-card-title">Institutional Market-Wide Analysis</h2>
            <div class="p-4 border rounded-lg bg-gray-50">
                <h3 class="font-semibold text-gray-800">Phase 1: Data Aggregation</h3>
                <p class="text-sm text-gray-600 mt-1 mb-4">
                    Process the latest 13F filings from the top 25 institutional investors. This collects and calculates all portfolio changes (new buys, sells, etc.) and saves them to the database for analysis. This may take a few minutes.
                </p>
                <button id="start-batch-process-btn" class="text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm">
                    Process All Investor Data
                </button>
                <div id="batch-progress-container" class="mt-4"></div>
            </div>

            <div class="p-4 border rounded-lg bg-gray-50 mt-6">
                <h3 class="font-semibold text-gray-800">Phase 2: AI-Powered Trend Analysis</h3>
                <p class="text-sm text-gray-600 mt-1 mb-4">
                    After the data has been processed, you can analyze it. This will query all the aggregated changes and use an AI to identify and summarize key market trends, sector rotations, and high-conviction trades.
                </p>
                <button id="analyze-market-data-btn" class="hidden text-sm bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm">
                    Analyze Market Data
                </button>
            </div>
             <div id="market-analysis-container" class="mt-6"></div>
        </div>
    `;
    container.innerHTML = html;
}

// --- Renders the initial dropdown for the Investor Filings tab ---
export function renderInvestorFilingsDropdownView() {
    const container = document.getElementById('investor-filings-view');
    if (!container) return;

    const optionsHtml = TOP_25_INVESTORS
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(investor => `<option value="${investor.cik}" data-name="${investor.name}">${investor.name}</option>`)
        .join('');

    container.innerHTML = `
        <div class="dashboard-card">
            <h2 class="dashboard-card-title">Investor 13F Filings</h2>
            <div class="max-w-xl">
                <label for="investor-select" class="block text-sm font-medium text-gray-700 mb-2">Select an investor to track their quarterly holdings:</label>
                <select id="investor-select" class="block w-full p-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="">-- Choose an Investor --</option>
                    ${optionsHtml}
                </select>
            </div>
        </div>
        <div id="investor-filings-container" class="mt-8"></div>
    `;
}

// --- Renders the detailed filings for a selected investor ---
export async function renderInvestorFilingsView(cik, investorName) {
    const container = document.getElementById('investor-filings-container');
    if (!container) return;
    container.innerHTML = `<div class="dashboard-card"><div class="loader mx-auto my-8"></div></div>`;

    try {
        const { filings, payload } = await getWhaleFilings(cik);

        const renderDebugInfo = () => {
            return `
                <div class="mt-6 border-t pt-4 space-y-2">
                    <details>
                        <summary class="cursor-pointer text-sm font-semibold text-gray-500 hover:text-gray-800">Show API Query Payload</summary>
                        <div class="mt-2 p-4 bg-gray-800 text-white text-xs rounded-lg overflow-x-auto">
                            <pre><code>${sanitizeText(JSON.stringify(payload, null, 2))}</code></pre>
                        </div>
                    </details>
                    <details>
                        <summary class="cursor-pointer text-sm font-semibold text-gray-500 hover:text-gray-800">Show Raw API Response (Filings List)</summary>
                        <div class="mt-2 p-4 bg-gray-800 text-white text-xs rounded-lg overflow-x-auto">
                            <pre><code>${sanitizeText(JSON.stringify({ total: filings.length, filings: filings }, null, 2))}</code></pre>
                        </div>
                    </details>
                </div>`;
        };

        if (!filings || filings.length === 0) {
            container.innerHTML = `
                <div class="dashboard-card">
                    <h2 class="dashboard-card-title">Filings for: ${investorName}</h2>
                    <p class="text-center text-gray-500 py-8">No 13F filings found for this investor in the last year.</p>
                    ${renderDebugInfo()}
                </div>`;
            return;
        }
        
        const groupedByPeriod = filings.reduce((acc, filing) => {
            const period = filing.periodOfReport;
            if (!acc[period]) {
                acc[period] = {};
            }
            if (filing.formType.endsWith('/A')) {
                acc[period].amendment = filing;
            } else {
                acc[period].original = filing;
            }
            return acc;
        }, {});

        const filingsToRender = Object.values(groupedByPeriod).map(group => {
            if (group.original && group.amendment) {
                const holdingsMap = new Map(group.original.holdings.map(h => [h.cusip, h]));
                group.amendment.holdings.forEach(h => holdingsMap.set(h.cusip, h));
                
                return {
                    ...group.amendment,
                    holdings: Array.from(holdingsMap.values()),
                };
            }
            return group.amendment || group.original;
        }).sort((a, b) => new Date(b.periodOfReport) - new Date(a.periodOfReport));
        
        state.whaleFilingsCache = filingsToRender;
        
        let html = `
            <div class="dashboard-card">
                <div class="flex justify-between items-center mb-6 border-b pb-4">
                    <div>
                        <h2 class="text-xl font-bold text-indigo-800">Filings for: ${investorName}</h2>
                        <p class="text-sm text-gray-500">Displaying aggregated quarterly holdings from the last year.</p>
                    </div>
                    ${filingsToRender.length >= 2 ? `
                        <button id="compare-quarters-btn" class="text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm">
                            Compare Latest Quarters
                        </button>
                    ` : ''}
                </div>
                
                <div id="whale-comparison-container" class="mb-8"></div>

                <div class="space-y-4">`;

        for (const filing of filingsToRender) {
            const filingDate = new Date(filing.filedAt).toLocaleDateString();
            const periodOfReport = filing.periodOfReport ? new Date(filing.periodOfReport).toLocaleDateString() : 'N/A';
            
            const aggregatedHoldings = (filing.holdings || []).reduce((acc, holding) => {
                const ticker = holding.ticker || 'N/A';
                if (!acc[ticker]) {
                    acc[ticker] = {
                        nameOfIssuer: holding.nameOfIssuer,
                        shares: 0,
                        value: 0
                    };
                }
                acc[ticker].shares += Number(holding.shrsOrPrnAmt.sshPrnamt);
                acc[ticker].value += (holding.value * 1000);
                return acc;
            }, {});
            
            const holdings = Object.entries(aggregatedHoldings).map(([ticker, data]) => ({
                ticker,
                ...data
            })).sort((a, b) => b.value - a.value);

            html += `
                <details class="sector-group">
                    <summary class="sector-header">
                        <span>Filing Date: ${filingDate} (For Period: ${periodOfReport})</span>
                        <span>${holdings.length} Holdings</span>
                    </summary>
                    <div class="sector-content overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200 text-sm">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Ticker</th>
                                    <th class="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Name of Issuer</th>
                                    <th class="px-4 py-2 text-right font-medium text-gray-500 uppercase tracking-wider">Shares</th>
                                    <th class="px-4 py-2 text-right font-medium text-gray-500 uppercase tracking-wider">Value ($)</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                ${holdings.map(h => `
                                    <tr>
                                        <td class="px-4 py-2 whitespace-nowrap font-bold">${sanitizeText(h.ticker)}</td>
                                        <td class="px-4 py-2 whitespace-nowrap">${sanitizeText(h.nameOfIssuer)}</td>
                                        <td class="px-4 py-2 whitespace-nowrap text-right">${h.shares.toLocaleString()}</td>
                                        <td class="px-4 py-2 whitespace-nowrap text-right">${h.value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </details>
            `;
        }

        html += `</div>${renderDebugInfo()}</div>`;
        container.innerHTML = html;

    } catch(error) {
        console.error("Error rendering investor filings view:", error);
        container.innerHTML = `<div class="dashboard-card"><p class="text-red-500">Error: ${error.message}</p></div>`;
    }
}

// --- Renders the comparison view for a selected investor ---
export function renderWhaleComparisonView() {
    const container = document.getElementById('whale-comparison-container');
    if (!container) return;
    
    if (!state.whaleFilingsCache || state.whaleFilingsCache.length < 2) {
        container.innerHTML = `<p class="text-center text-gray-500">Not enough data to perform a comparison.</p>`;
        return;
    }

    const latestFiling = state.whaleFilingsCache[0];
    const previousFiling = state.whaleFilingsCache[1];

    const aggregateHoldingsByTicker = (filing) => {
        if (!filing || !filing.holdings) return new Map();
        
        const holdingsMap = new Map();
        for (const holding of filing.holdings) {
            const ticker = holding.ticker || 'N/A';
            if (!holdingsMap.has(ticker)) {
                holdingsMap.set(ticker, {
                    nameOfIssuer: holding.nameOfIssuer,
                    shares: 0,
                    value: 0
                });
            }
            const existing = holdingsMap.get(ticker);
            existing.shares += Number(holding.shrsOrPrnAmt.sshPrnamt);
            existing.value += holding.value;
        }
        return holdingsMap;
    };

    const latestHoldingsMap = aggregateHoldingsByTicker(latestFiling);
    const previousHoldingsMap = aggregateHoldingsByTicker(previousFiling);
    
    const changes = {
        new: [],
        exited: [],
        increased: [],
        decreased: []
    };

    for (const [ticker, latest] of latestHoldingsMap.entries()) {
        const previous = previousHoldingsMap.get(ticker);
        
        if (!previous) {
            changes.new.push({ ticker, ...latest });
        } else {
            if (latest.shares > previous.shares) {
                changes.increased.push({ ticker, ...latest, change: latest.shares - previous.shares });
            } else if (latest.shares < previous.shares) {
                changes.decreased.push({ ticker, ...latest, change: latest.shares - previous.shares });
            }
        }
    }

    for (const [ticker, previous] of previousHoldingsMap.entries()) {
        if (!latestHoldingsMap.has(ticker)) {
            changes.exited.push({ ticker, ...previous });
        }
    }

    const renderChangeTable = (title, holdings, color, showChange = false, isExited = false) => {
        if (holdings.length === 0) return '';
        
        holdings.sort((a,b) => b.value - a.value);

        return `
            <div class="mb-6">
                <h3 class="text-lg font-semibold ${color} mb-2">${title} (${holdings.length})</h3>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200 text-sm">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-2 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Ticker</th>
                                <th class="px-2 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Issuer</th>
                                ${showChange ? `<th class="px-2 py-2 text-right font-medium text-gray-500 uppercase tracking-wider">Share Change</th>` : ''}
                                <th class="px-2 py-2 text-right font-medium text-gray-500 uppercase tracking-wider">${isExited ? 'Value at Previous Qtr' : 'Current Value'}</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            ${holdings.map(h => `
                                <tr>
                                    <td class="px-2 py-2 whitespace-nowrap font-bold">${sanitizeText(h.ticker)}</td>
                                    <td class="px-2 py-2 whitespace-nowrap">${sanitizeText(h.nameOfIssuer)}</td>
                                    ${showChange ? `<td class="px-2 py-2 whitespace-nowrap text-right font-medium">${h.change.toLocaleString()}</td>` : ''}
                                    <td class="px-2 py-2 whitespace-nowrap text-right">${(h.value * 1000).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
    };
    
    const latestPeriod = new Date(latestFiling.periodOfReport).toLocaleDateString();
    const prevPeriod = new Date(previousFiling.periodOfReport).toLocaleDateString();

    container.innerHTML = `
        <div class="p-4 border-l-4 border-indigo-500 bg-indigo-50 rounded-lg">
             <h2 class="text-xl font-bold text-gray-800 mb-2">Portfolio Changes: ${prevPeriod} vs. ${latestPeriod}</h2>
             ${renderChangeTable('🆕 New Positions', changes.new, 'text-green-700')}
             ${renderChangeTable('📈 Increased Positions', changes.increased, 'text-green-600', true)}
             ${renderChangeTable('📉 Decreased Positions', changes.decreased, 'text-red-600', true)}
             ${renderChangeTable('❌ Exited Positions', changes.exited, 'text-red-700', false, true)}
        </div>
    `;
}
