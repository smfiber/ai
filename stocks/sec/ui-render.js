import { CONSTANTS, state } from './config.js'; 
import { getRecentPortfolioFilings, getEarningsCalendar } from './sec-api.js';

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

// --- NEW SEC DASHBOARD RENDERING ---

export async function renderFilingsByCompany(filings) {
    const container = document.getElementById('filings-by-company-container');
    if (!container) return;

    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const recentFilings = filings.filter(f => new Date(f.filedAt) > fortyEightHoursAgo);

    if (recentFilings.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-500 py-4">No new filings in the last 48 hours.</p>`;
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
                    <span class="font-semibold text-gray-700">${sanitizeText(ticker)}</span>
                    <span class="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">${count} new</span>
                </li>
            `).join('')}
        </ul>
    `;
    container.innerHTML = listHtml;
}

export async function renderUpcomingEarnings(tickers) {
    const container = document.getElementById('upcoming-filings-container');
    if (!container) return;
    container.innerHTML = `<p class="text-center text-gray-500 py-4">Loading earnings dates...</p>`;

    try {
        const earningsData = await getEarningsCalendar(tickers);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcomingEarnings = earningsData
            .filter(e => e.date && new Date(e.date) >= today)
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        if (upcomingEarnings.length === 0) {
            container.innerHTML = `<p class="text-center text-gray-500 py-4">No upcoming earnings scheduled for your portfolio.</p>`;
            return;
        }
        
        const listHtml = `
            <ul class="divide-y divide-gray-200">
                ${upcomingEarnings.slice(0, 10).map(e => `
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

export async function fetchAndRenderRecentFilings() {
    const container = document.getElementById('recent-filings-container');
    if (!container) return;

    container.innerHTML = `
        <div class="loader mx-auto my-8"></div>
        <p class="text-center text-gray-500">Loading recent filings for your portfolio...</p>`;

    try {
        const portfolioStocks = state.portfolioCache.filter(s => s.status === 'Portfolio');
        if (portfolioStocks.length === 0) {
            container.innerHTML = `<p class="text-center text-gray-500 py-8">Your portfolio is empty. Add stocks to see recent filings.</p>`;
            document.getElementById('filings-by-company-container').innerHTML = `<p class="text-center text-gray-500 py-4">Portfolio empty.</p>`;
            document.getElementById('upcoming-filings-container').innerHTML = `<p class="text-center text-gray-500 py-4">Portfolio empty.</p>`;
            return;
        }

        const tickers = portfolioStocks.map(s => s.ticker);
        const filings = await getRecentPortfolioFilings(tickers);

        // --- Render Main Feed ---
        if (filings.length === 0) {
            container.innerHTML = `<p class="text-center text-gray-500 py-8">No recent 8-K, 10-K, or 10-Q filings found for your portfolio.</p>`;
        } else {
            const filingsHtml = `
                <ul class="divide-y divide-gray-200">
                    ${filings.map(filing => {
                        const stock = state.portfolioCache.find(s => s.ticker === filing.ticker);
                        const companyName = stock ? stock.companyName : filing.ticker;
                        const filingDate = new Date(filing.filedAt).toLocaleDateString();

                        let formTypeBadge = '';
                        if (filing.formType === '8-K') {
                            formTypeBadge = '<span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800">8-K</span>';
                        } else if (filing.formType === '10-K') {
                            formTypeBadge = '<span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800">10-K</span>';
                        } else if (filing.formType === '10-Q') {
                            formTypeBadge = '<span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">10-Q</span>';
                        }

                        return `
                            <li class="p-4 hover:bg-gray-50 flex justify-between items-center">
                                <div>
                                    <p class="font-semibold text-gray-800">${sanitizeText(companyName)} (${sanitizeText(filing.ticker)})</p>
                                    <p class="text-sm text-gray-500">Filed on ${filingDate}</p>
                                </div>
                                <div class="flex items-center gap-4">
                                    ${formTypeBadge}
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
        
        // --- Render Sidebar Cards ---
        renderFilingsByCompany(filings);
        renderUpcomingEarnings(tickers);
        
    } catch (error) {
        console.error("Error fetching or rendering recent filings:", error);
        container.innerHTML = `<p class="text-center text-red-500 p-8">Could not load filings: ${error.message}</p>`;
    }
}
