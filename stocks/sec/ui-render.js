import { CONSTANTS, state } from './config.js'; 
import { getRecentPortfolioFilings } from './sec-api.js';

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

// --- NEW SEC FILING RENDERING ---
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
            return;
        }

        const tickers = portfolioStocks.map(s => s.ticker);
        const filings = await getRecentPortfolioFilings(tickers);

        if (filings.length === 0) {
            container.innerHTML = `<p class="text-center text-gray-500 py-8">No recent 8-K, 10-K, or 10-Q filings found for your portfolio.</p>`;
            return;
        }

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
        
    } catch (error) {
        console.error("Error fetching or rendering recent filings:", error);
        container.innerHTML = `<p class="text-center text-red-500 p-8">Could not load filings: ${error.message}</p>`;
    }
}
