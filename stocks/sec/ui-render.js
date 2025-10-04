import { CONSTANTS, state } from './config.js'; 
import { getDocs, collection } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getEarningsCalendar } from './api.js';
import { getRecentPortfolioFilings, getPortfolioInsiderTrading, getPortfolioInstitutionalOwnership, getSecMaterialEvents, getSecAnnualReports, getSecQuarterlyReports } from './sec-api.js';

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
            return;
        }
        const querySnapshot = await getDocs(collection(state.db, CONSTANTS.DB_COLLECTION_PORTFOLIO));
        state.portfolioCache = querySnapshot.docs.map(doc => ({ ticker: doc.id, ...doc.data() }));
        
    } catch (error) {
        console.error("Error fetching portfolio data:", error);
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

        // Since the API returns filings sorted by date descending, the first one we encounter for a ticker is the latest.
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
export async function renderCompanyDeepDive(ticker) {
    const container = document.getElementById('historical-filings-container');
    if (!container) return;

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
                    let analyzeButton = '';
                    let filingItemAttr = '';

                    if (filing.formType === '8-K') {
                        formTypeBadge = '<span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">8-K</span>';
                        // For 8-K, find the first available item and add it as a data attribute
                        const firstItem = filing.items?.[0];
                        if (firstItem) {
                            filingItemAttr = `data-filing-item="${sanitizeText(firstItem)}"`;
                        }
                    } else if (filing.formType === '10-K') {
                        formTypeBadge = '<span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-800">10-K</span>';
                    } else if (filing.formType === '10-Q') {
                        formTypeBadge = '<span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">10-Q</span>';
                    }

                    if (['8-K', '10-K', '10-Q'].includes(filing.formType)) {
                        analyzeButton = `<button class="analyze-filing-btn text-sm bg-green-600 hover:bg-green-700 text-white font-semibold py-1 px-3 rounded-lg" data-filing-url="${sanitizeText(filing.linkToFilingDetails)}" data-form-type="${sanitizeText(filing.formType)}" data-ticker="${sanitizeText(ticker)}" ${filingItemAttr}>Analyze</button>`;
                    }

                    return `
                        <li class="p-3 hover:bg-gray-50">
                            <div class="flex justify-between items-center">
                                <div>
                                    <p class="font-semibold text-gray-700">${formTypeBadge}</p>
                                    <p class="text-xs text-gray-500 mt-1">Filed: ${filingDate}</p>
                                </div>
                                <div class="flex items-center gap-2">
                                    ${analyzeButton}
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
            // Only add holdings from the user's portfolio
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

        // Sort institutions by the total value of their holdings in the user's portfolio
        const sortedInstitutions = Object.entries(holdingsByInstitution)
            .map(([name, data]) => ({ name, ...data, totalValue: data.holdings.reduce((sum, h) => sum + h.value, 0) }))
            .filter(inst => inst.totalValue > 0) // Filter out institutions that no longer hold any portfolio stocks
            .sort((a, b) => b.totalValue - a.totalValue);

        let html = `<div class="dashboard-card">
                        <h2 class="dashboard-card-title">Portfolio-Wide Institutional Ownership (Form 13F)</h2>
                        <div class="space-y-4">`;

        sortedInstitutions.slice(0, 50).forEach(inst => { // Limit to top 50 institutions
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
