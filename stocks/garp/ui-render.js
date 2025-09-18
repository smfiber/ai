// ADD _renderGroupedStockList to the export list
import { CONSTANTS, SECTORS, SECTOR_ICONS, state, ANALYSIS_ICONS } from './config.js'; 
import { callApi, getFmpStockData } from './api.js';
import { getSecInsiderTrading, getSecInstitutionalOwnership, getSecMaterialEvents, getSecAnnualReports, getSecQuarterlyReports } from './sec-api.js';
import { getFirestore, Timestamp, doc, setDoc, getDoc, deleteDoc, collection, getDocs, query, limit, addDoc, increment, updateDoc, where, orderBy } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- UTILITY & SECURITY HELPERS ---

function sanitizeText(text) {
    if (typeof text !== 'string') return '';
    const tempDiv = document.createElement('div');
    tempDiv.textContent = text;
    return tempDiv.innerHTML;
}

async function getScreenerInteractions() {
    const interactions = {};
    if (!state.db) return interactions;
    try {
        const querySnapshot = await getDocs(collection(state.db, CONSTANTS.DB_COLLECTION_SCREENER_INTERACTIONS));
        querySnapshot.forEach(doc => {
            interactions[doc.id] = doc.data();
        });
    } catch (error) {
        console.error("Error fetching screener interactions:", error);
    }
    return interactions;
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

        // Update dashboard counts
        const portfolioCount = state.portfolioCache.filter(s => s.status === 'Portfolio').length;
        const watchlistCount = state.portfolioCache.filter(s => s.status === 'Watchlist').length;
        const revisit3Count = state.portfolioCache.filter(s => s.status === 'Revisit 3 months').length;
        const revisit6Count = state.portfolioCache.filter(s => s.status === 'Revisit 6 months').length;

        document.getElementById('portfolio-count').textContent = portfolioCount;
        document.getElementById('watchlist-count').textContent = watchlistCount;
        document.getElementById('revisit-3-months-count').textContent = revisit3Count;
        document.getElementById('revisit-6-months-count').textContent = revisit6Count;
        
    } catch (error) {
        console.error("Error fetching portfolio data:", error);
    }
}


// --- UI RENDERING ---

export async function renderSectorButtons() {
    const container = document.getElementById('sector-buttons-container');
    if (!container) return;
    
    const interactions = await getScreenerInteractions();

    container.innerHTML = SECTORS.map(sector => {
        const icon = SECTOR_ICONS[sector] || '';
        const interaction = interactions[sector];
        const lastClickedDate = interaction?.lastClicked ? interaction.lastClicked.toDate().toLocaleDateString() : 'Never';
        return `
            <button class="flex flex-col items-center justify-center p-4 text-center bg-sky-100 text-sky-800 hover:bg-sky-200 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-1" data-sector="${sanitizeText(sector)}">
                ${icon}
                <span class="mt-2 font-semibold text-sm">${sanitizeText(sector)}</span>
                <span class="mt-1 text-xs text-sky-600 last-clicked-date">Last Clicked: ${lastClickedDate}</span>
            </button>
        `
    }).join('');
}

export async function displayIndustryScreener() {
    try {
        const url = `https://financialmodelingprep.com/stable/available-industries?apikey=${state.fmpApiKey}`;
        const industryData = await callApi(url);
        if (Array.isArray(industryData)) {
            // FIX: Handle both object array and string array formats from the API.
            state.availableIndustries = industryData.map(item => (typeof item === 'object' && item.industry) ? item.industry : item).filter(Boolean).sort();
            await renderIndustryButtons();
        }
    } catch (error) {
        console.error("Error fetching available industries:", error);
        const container = document.getElementById('industry-buttons-container');
        if (container) {
            container.innerHTML = `<p class="text-red-500 col-span-full">Could not load industry data.</p>`;
        }
    }
}

async function renderIndustryButtons() {
    const container = document.getElementById('industry-buttons-container');
    if (!container) return;
    
    const interactions = await getScreenerInteractions();
    const genericIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>`; // Using Industrials icon as generic

    container.innerHTML = state.availableIndustries.map(industry => {
        const interaction = interactions[industry];
        const lastClickedDate = interaction?.lastClicked ? interaction.lastClicked.toDate().toLocaleDateString() : 'Never';
        return `
        <button class="flex flex-col items-center justify-center p-4 text-center bg-teal-100 text-teal-800 hover:bg-teal-200 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-1" data-industry="${sanitizeText(industry)}">
            ${genericIcon}
            <span class="mt-2 font-semibold text-sm">${sanitizeText(industry)}</span>
            <span class="mt-1 text-xs text-teal-600 last-clicked-date">Last Clicked: ${lastClickedDate}</span>
        </button>
    `}).join('');
}

export function renderOverviewCard(data, symbol, status) {
    const profile = data.profile?.[0] || {};
    if (!profile.symbol) return '';

    const price = profile.price || 0;
    const change = profile.change || 0;
    const changePercent = profile.changesPercentage || 0;
    const changeColorClass = change >= 0 ? 'price-gain' : 'price-loss';
    const changeSign = change >= 0 ? '+' : '';

    let statusBadge = '';
    if (status === 'Portfolio') {
        statusBadge = '<span class="ml-2 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-100 text-green-800">Portfolio</span>';
    } else if (status === 'Watchlist') {
        statusBadge = '<span class="ml-2 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">Watchlist</span>';
    } else if (status === 'Revisit 3 months') {
        statusBadge = '<span class="ml-2 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800">Revisit 3 Months</span>';
    } else if (status === 'Revisit 6 months') {
        statusBadge = '<span class="ml-2 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800">Revisit 6 Months</span>';
    }

    let needsReviewClass = '';
    if (status && status.startsWith('Revisit') && data.cachedAt) {
        const months = parseInt(status.match(/\d+/)[0]);
        const cachedDate = data.cachedAt.toDate();
        const thresholdDate = new Date();
        thresholdDate.setMonth(thresholdDate.getMonth() - months);

        if (cachedDate < thresholdDate) {
            needsReviewClass = 'needs-review';
        }
    }

    const marketCap = profile.mktCap ? (profile.mktCap / 1e9).toFixed(2) + 'B' : 'N/A';
    const keyMetricsLatest = data.key_metrics_annual?.[0] || {};
    const peRatio = keyMetricsLatest.peRatio ? keyMetricsLatest.peRatio.toFixed(2) : 'N/A';
    
    const sma50 = profile.priceAvg50 || 'N/A';
    const sma200 = profile.priceAvg200 || 'N/A';
    
    const fmpTimestampString = data.cachedAt ? `FMP Data Stored On: ${data.cachedAt.toDate().toLocaleDateString()}` : '';

    return `
        <div class="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 ${needsReviewClass}" id="card-${symbol}">
            <div class="flex justify-between items-start gap-4">
                <div>
                    <h2 class="text-2xl font-bold text-gray-800 flex items-center">${sanitizeText(profile.companyName)} (${sanitizeText(profile.symbol)}) ${statusBadge}</h2>
                    <p class="text-gray-500">${sanitizeText(profile.exchange)} | ${sanitizeText(profile.sector)}</p>
                </div>
                <div class="text-right flex-shrink-0">
                    <p class="text-2xl font-bold">$${price.toFixed(2)}</p>
                    <p class="text-sm font-semibold ${changeColorClass}">${changeSign}${change.toFixed(2)} (${changeSign}${changePercent.toFixed(2)}%)</p>
                </div>
            </div>
            
            <p class="mt-4 text-sm text-gray-600">${sanitizeText(profile.description)}</p>
            
            <div class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center border-t pt-4">
                <div><p class="text-sm text-gray-500">Market Cap</p><p class="text-lg font-semibold">${sanitizeText(marketCap)}</p></div>
                <div><p class="text-sm text-gray-500">P/E Ratio</p><p class="text-lg font-semibold">${sanitizeText(peRatio)}</p></div>
                <div><p class="text-sm text-gray-500">50-Day MA</p><p class="text-lg font-semibold">$${typeof sma50 === 'number' ? sma50.toFixed(2) : 'N/A'}</p></div>
                <div><p class="text-sm text-gray-500">200-Day MA</p><p class="text-lg font-semibold">$${typeof sma200 === 'number' ? sma200.toFixed(2) : 'N/A'}</p></div>
            </div>

            <div class="mt-6 border-t pt-4 flex items-center flex-wrap gap-x-4 gap-y-2 justify-center">
                <button data-symbol="${symbol}" class="refresh-fmp-button text-sm bg-cyan-100 text-cyan-700 hover:bg-cyan-200 font-semibold py-2 px-4 rounded-lg">Refresh FMP</button>
                <button data-symbol="${symbol}" class="view-fmp-data-button text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg">View FMP Data</button>
                <button data-symbol="${symbol}" class="fetch-news-button text-sm bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg">Fetch News</button>
            </div>
            <div class="text-right text-xs text-gray-400 mt-4">
                <div>${fmpTimestampString}</div>
            </div>
        </div>`;
}

function getSentimentDisplay(sentiment) {
    switch (sentiment) {
        case 'Bullish':
        case 'Positive':
            return { icon: '総', colorClass: 'text-green-600', bgClass: 'bg-green-100', textClass: 'text-green-800' };
        case 'Bearish':
        case 'Negative':
            return { icon: '綜', colorClass: 'text-red-600', bgClass: 'bg-red-100', textClass: 'text-red-800' };
        case 'Neutral':
            return { icon: '', colorClass: 'text-gray-600', bgClass: 'bg-gray-100', textClass: 'text-gray-800' };
        default:
            return { icon: '', colorClass: '', bgClass: '', textClass: '' };
    }
}

export function renderNewsArticles(articlesWithSentiment, summaryMarkdown, symbol) {
    const card = document.getElementById(`card-${symbol}`);
    if (!card) return;

    let existingNewsContainer = card.querySelector('.news-container');
    if (existingNewsContainer) existingNewsContainer.remove();

    const newsContainer = document.createElement('div');
    newsContainer.className = 'news-container mt-4 border-t pt-4';

    if (articlesWithSentiment.length === 0) {
        newsContainer.innerHTML = `<p class="text-sm text-gray-500">No recent news articles found in the last 30 days.</p>`;
    } else {
        const impactColorMap = { 'High': 'bg-red-500', 'Medium': 'bg-yellow-500', 'Low': 'bg-blue-500' };
        const articlesHtml = articlesWithSentiment.map(article => {
            const { bgClass: sentimentBg, textClass: sentimentText } = getSentimentDisplay(article.sentiment);
            const impactColor = impactColorMap[article.impact] || 'bg-gray-500';

            return `
                <div class="mb-4 p-4 rounded-lg border border-gray-200 bg-white shadow-sm">
                    <a href="${sanitizeText(article.url)}" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:underline font-semibold block mb-2">${sanitizeText(article.title)}</a>
                    <p class="text-sm text-gray-700 mb-3">"${sanitizeText(article.summary)}"</p>
                    <div class="flex flex-wrap items-center gap-2 text-xs font-medium">
                        <span class="px-2 py-1 rounded-full ${sentimentBg} ${sentimentText}">${sanitizeText(article.sentiment)}</span>
                        <span class="px-2 py-1 rounded-full text-white ${impactColor}">Impact: ${sanitizeText(article.impact)}</span>
                        <span class="px-2 py-1 rounded-full bg-gray-200 text-gray-800">${sanitizeText(article.category)}</span>
                        <span class="px-2 py-1 rounded-full bg-gray-200 text-gray-800">${sanitizeText(article.date)}</span>
                    </div>
                </div>
            `;
        }).join('');
        
        const summaryHtml = summaryMarkdown ? marked.parse(summaryMarkdown) : '';
        newsContainer.innerHTML = `<h3 class="text-lg font-bold text-gray-700 mb-3">Recent News Analysis</h3>${articlesHtml}${summaryHtml}`;
    }
    card.appendChild(newsContainer);
}

export function renderPortfolioManagerList() {
    const container = document.getElementById('portfolio-manager-list-container');
    if (!container) return;

    if (state.portfolioCache.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-500 p-8">No stocks in your portfolio or watchlist.</p>`;
        return;
    }

    const groupedBySector = state.portfolioCache.reduce((acc, stock) => {
        const sector = stock.sector || 'Uncategorized';
        if (!acc[sector]) {
            acc[sector] = [];
        }
        acc[sector].push(stock);
        return acc;
    }, {});

    let html = '';
    const sortedSectors = Object.keys(groupedBySector).sort();
    
    for (const sector of sortedSectors) {
        html += `<div class="portfolio-exchange-header">${sanitizeText(sector)}</div>`;
        html += '<ul class="divide-y divide-gray-200">';
        groupedBySector[sector].sort((a,b) => a.companyName.localeCompare(b.companyName)).forEach(stock => {
            let statusBadge = '';
            switch (stock.status) {
                case 'Portfolio':
                    statusBadge = '<span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-100 text-green-800">Portfolio</span>';
                    break;
                case 'Watchlist':
                    statusBadge = '<span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">Watchlist</span>';
                    break;
                case 'Revisit 3 months':
                    statusBadge = '<span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800">Revisit 3 Months</span>';
                    break;
                case 'Revisit 6 months':
                    statusBadge = '<span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800">Revisit 6 Months</span>';
                    break;
                default:
                    statusBadge = `<span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800">${sanitizeText(stock.status)}</span>`;
            }

            const hasNewFilings = stock.hasNewFilings === true;
            const newFilingBadge = hasNewFilings
              ? `<span class="ml-2 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 animate-pulse">New Filing</span>`
              : '';

            html += `
                <li class="p-4 flex justify-between items-center hover:bg-gray-50">
                    <div>
                        <p class="font-semibold text-gray-800 flex items-center">${sanitizeText(stock.companyName)} (${sanitizeText(stock.ticker)}) ${newFilingBadge}</p>
                        <p class="text-sm text-gray-500">${statusBadge}</p>
                    </div>
                    <div class="flex gap-2">
                        <button class="edit-stock-btn text-sm font-medium text-indigo-600 hover:text-indigo-800" data-ticker="${sanitizeText(stock.ticker)}">Edit</button>
                        <button class="delete-stock-btn text-sm font-medium text-red-600 hover:text-red-800" data-ticker="${sanitizeText(stock.ticker)}">Delete</button>
                    </div>
                </li>
            `;
        });
        html += '</ul>';
    }
    container.innerHTML = html;
}

export async function _renderGroupedStockList(container, stocksWithData, listType) {
    container.innerHTML = ''; 
    if (stocksWithData.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-500 py-8">No stocks in your ${listType}.</p>`;
        return;
    }

    const groupedBySector = stocksWithData.reduce((acc, stock) => {
        const sector = stock.sector || 'Uncategorized';
        if (!acc[sector]) acc[sector] = [];
        acc[sector].push(stock);
        return acc;
    }, {});

    const sortedSectors = Object.keys(groupedBySector).sort();

    let html = '';
    sortedSectors.forEach(sector => {
        const stocks = groupedBySector[sector].sort((a, b) => a.companyName.localeCompare(b.companyName));
        html += `
            <details class="sector-group" open>
                <summary class="sector-header">
                    <span>${sanitizeText(sector)}</span>
                    <span class="sector-toggle-icon"></span>
                </summary>
                <div class="sector-content">
                    <ul class="divide-y divide-gray-200">`;
        
        stocks.forEach(stock => {
            const profile = stock.fmpData?.profile?.[0] || {};
            const refreshedAt = stock.fmpData?.cachedAt ? stock.fmpData.cachedAt.toDate().toLocaleString() : 'N/A';
            const hasNewFilings = stock.hasNewFilings === true;
            const newFilingBadge = hasNewFilings
              ? `<span class="ml-2 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 animate-pulse">New Filing</span>`
              : '';

            html += `
                <li class="dashboard-list-item-detailed">
                    <div class="stock-main-info">
                        <p class="font-bold text-indigo-700 flex items-center">${sanitizeText(stock.companyName)} ${newFilingBadge}</p>
                        <p class="text-sm text-gray-600">${sanitizeText(stock.ticker)}</p>
                    </div>
                    <div class="stock-actions">
                        <div class="flex items-center justify-end gap-2">
                            <button class="dashboard-item-view bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold py-1 px-3 rounded-full" data-ticker="${sanitizeText(stock.ticker)}">View</button>
                            <button class="dashboard-item-refresh bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-semibold py-1 px-3 rounded-full" data-ticker="${sanitizeText(stock.ticker)}">Refresh</button>
                            <button class="dashboard-item-edit" data-ticker="${sanitizeText(stock.ticker)}">Edit</button>
                        </div>
                        <p class="text-xs text-gray-400 mt-2 text-right whitespace-nowrap" title="Last Refreshed">Refreshed: ${refreshedAt}</p>
                    </div>
                </li>`;
        });

        html += `</ul></div></details>`;
    });
    container.innerHTML = html;
}

export async function renderFmpEndpointsList() {
    const container = document.getElementById('fmp-endpoints-list-container');
    container.innerHTML = 'Loading endpoints...';
    try {
        const querySnapshot = await getDocs(collection(state.db, CONSTANTS.DB_COLLECTION_FMP_ENDPOINTS));
        if (querySnapshot.empty) {
            container.innerHTML = '<p class="text-center text-gray-500 py-4">No endpoints saved.</p>';
            return;
        }
        const endpoints = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        container.innerHTML = endpoints.map(ep => `
            <div class="p-3 bg-white border rounded-lg flex justify-between items-center">
                <div>
                    <p class="font-semibold text-gray-700">${sanitizeText(ep.name)} <span class="text-xs font-normal text-gray-500">(Used: ${ep.usageCount || 0})</span></p>
                    <p class="text-xs text-gray-500 font-mono">${sanitizeText(ep.url_template)}</p>
                </div>
                <div class="flex gap-2">
                    <button class="edit-fmp-endpoint-btn text-sm font-medium text-indigo-600 hover:text-indigo-800" data-id="${ep.id}" data-name="${sanitizeText(ep.name)}" data-url="${sanitizeText(ep.url_template)}">Edit</button>
                    <button class="delete-fmp-endpoint-btn text-sm font-medium text-red-600 hover:text-red-800" data-id="${ep.id}">Delete</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error rendering FMP endpoints:', error);
        container.innerHTML = '<p class="text-red-500">Could not load endpoints.</p>';
    }
}

export async function renderBroadEndpointsList() {
    const container = document.getElementById('broad-endpoints-list-container');
    container.innerHTML = 'Loading endpoints...';
    try {
        const querySnapshot = await getDocs(collection(state.db, CONSTANTS.DB_COLLECTION_BROAD_ENDPOINTS));
        if (querySnapshot.empty) {
            container.innerHTML = '<p class="text-center text-gray-500 py-4">No endpoints saved.</p>';
            return;
        }
        const endpoints = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        container.innerHTML = endpoints.map(ep => `
            <div class="p-3 bg-white border rounded-lg flex justify-between items-center">
                <div>
                    <p class="font-semibold text-gray-700">${sanitizeText(ep.name)} <span class="text-xs font-normal text-gray-500">(Used: ${ep.usageCount || 0})</span></p>
                    <p class="text-xs text-gray-500 font-mono">${sanitizeText(ep.url_template)}</p>
                </div>
                <div class="flex gap-2">
                    <button class="edit-broad-endpoint-btn text-sm font-medium text-indigo-600 hover:text-indigo-800" data-id="${ep.id}" data-name="${sanitizeText(ep.name)}" data-url="${sanitizeText(ep.url_template)}">Edit</button>
                    <button class="delete-broad-endpoint-btn text-sm font-medium text-red-600 hover:text-red-800" data-id="${ep.id}">Delete</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error rendering Broad API endpoints:', error);
        container.innerHTML = '<p class="text-red-500">Could not load endpoints.</p>';
    }
}

function _renderInsiderTrading(filings) {
    const container = document.getElementById('insider-trading-container');
    if (!container) return;
    
    container.innerHTML = `<h3 class="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Recent Insider Activity (Form 4)</h3>`;

    if (!filings || filings.length === 0) {
        container.innerHTML += `<p class="text-center text-gray-500 py-8">No recent insider activity found.</p>`;
        return;
    }
    
    const tableHtml = `
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 text-sm">
                <thead class="bg-gray-50">
                    <tr>
                        <th scope="col" class="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th scope="col" class="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Filer</th>
                        <th scope="col" class="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th scope="col" class="px-4 py-2 text-right font-medium text-gray-500 uppercase tracking-wider">Shares</th>
                        <th scope="col" class="px-4 py-2 text-right font-medium text-gray-500 uppercase tracking-wider">Value</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    ${filings.map(f => {
                        const transactionType = f.transactionCode === 'P' ? 'Buy' : (f.transactionCode === 'S' ? 'Sell' : 'Other');
                        const typeClass = f.transactionCode === 'P' ? 'text-green-600 font-semibold' : (f.transactionCode === 'S' ? 'text-red-600 font-semibold' : '');
                        const value = (f.transactionPricePerShare || 0) * (f.transactionShares || 0);

                        return `
                            <tr>
                                <td class="px-4 py-2 whitespace-nowrap">${new Date(f.filedAt).toLocaleDateString()}</td>
                                <td class="px-4 py-2 whitespace-nowrap"><a href="${sanitizeText(f.linkToFilingDetails)}" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:underline">${sanitizeText(f.reportingOwnerName)}</a></td>
                                <td class="px-4 py-2 whitespace-nowrap ${typeClass}">${transactionType}</td>
                                <td class="px-4 py-2 whitespace-nowrap text-right">${(f.transactionShares || 0).toLocaleString()}</td>
                                <td class="px-4 py-2 whitespace-nowrap text-right">$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
    container.innerHTML += tableHtml;
}

function _renderInstitutionalOwnership(holdings) {
    const container = document.getElementById('institutional-ownership-container');
    if (!container) return;

    container.innerHTML = `<h3 class="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Top Institutional Holders (13F)</h3>`;

    if (!holdings || holdings.length === 0) {
        container.innerHTML += `<p class="text-center text-gray-500 py-8">No institutional ownership data found.</p>`;
        return;
    }

    const sortedHoldings = holdings.sort((a, b) => b.value - a.value).slice(0, 15); // Top 15

    const tableHtml = `
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 text-sm">
                <thead class="bg-gray-50">
                    <tr>
                        <th scope="col" class="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Holder</th>
                        <th scope="col" class="px-4 py-2 text-right font-medium text-gray-500 uppercase tracking-wider">Shares</th>
                        <th scope="col" class="px-4 py-2 text-right font-medium text-gray-500 uppercase tracking-wider">Value</th>
                        <th scope="col" class="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Report Date</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    ${sortedHoldings.map(h => `
                        <tr>
                            <td class="px-4 py-2 whitespace-nowrap">${sanitizeText(h.investorName)}</td>
                            <td class="px-4 py-2 whitespace-nowrap text-right">${(h.shares || 0).toLocaleString()}</td>
                            <td class="px-4 py-2 whitespace-nowrap text-right">$${(h.value || 0).toLocaleString()}</td>
                            <td class="px-4 py-2 whitespace-nowrap">${new Date(h.filedAt).toLocaleDateString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    container.innerHTML += tableHtml;
}

function _renderMaterialEvents(filings) {
    const container = document.getElementById('material-events-container');
    if (!container) return;

    container.innerHTML = `<h3 class="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Recent Material Events (8-K)</h3>`;

    if (!filings || filings.length === 0) {
        container.innerHTML += `<p class="text-center text-gray-500 py-8">No recent material events found.</p>`;
        return;
    }

    const listHtml = `
        <ul class="divide-y divide-gray-200">
            ${filings.map(f => `
                <li class="p-3 hover:bg-gray-50">
                    <a href="${sanitizeText(f.linkToFilingDetails)}" target="_blank" rel="noopener noreferrer" class="block">
                        <p class="font-semibold text-indigo-600">${sanitizeText(f.description)}</p>
                        <p class="text-xs text-gray-500">Filed: ${new Date(f.filedAt).toLocaleString()}</p>
                    </a>
                </li>
            `).join('')}
        </ul>
    `;
    container.innerHTML += listHtml;
}

function _renderAnnualReports(filings) {
    const container = document.getElementById('annual-reports-container');
    if (!container) return;

    container.innerHTML = `<h3 class="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Recent Annual Reports (10-K)</h3>`;

    if (!filings || filings.length === 0) {
        container.innerHTML += `<p class="text-center text-gray-500 py-8">No recent annual reports found.</p>`;
        return;
    }

    const listHtml = `
        <ul class="divide-y divide-gray-200">
            ${filings.map(f => `
                <li class="p-3 hover:bg-gray-50">
                    <a href="${sanitizeText(f.linkToFilingDetails)}" target="_blank" rel="noopener noreferrer" class="block">
                        <p class="font-semibold text-indigo-600">Annual Report (Form 10-K)</p>
                        <p class="text-xs text-gray-500">Filed: ${new Date(f.filedAt).toLocaleString()}</p>
                    </a>
                </li>
            `).join('')}
        </ul>
    `;
    container.innerHTML += listHtml;
}

function _renderQuarterlyReports(filings) {
    const container = document.getElementById('quarterly-reports-container');
    if (!container) return;

    container.innerHTML = `<h3 class="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Recent Quarterly Reports (10-Q)</h3>`;

    if (!filings || filings.length === 0) {
        container.innerHTML += `<p class="text-center text-gray-500 py-8">No recent quarterly reports found.</p>`;
        return;
    }

    const listHtml = `
        <ul class="divide-y divide-gray-200">
            ${filings.map(f => `
                <li class="p-3 hover:bg-gray-50">
                    <a href="${sanitizeText(f.linkToFilingDetails)}" target="_blank" rel="noopener noreferrer" class="block">
                        <p class="font-semibold text-indigo-600">Quarterly Report (Form 10-Q)</p>
                        <p class="text-xs text-gray-500">Filed: ${new Date(f.filedAt).toLocaleString()}</p>
                    </a>
                </li>
            `).join('')}
        </ul>
    `;
    container.innerHTML += listHtml;
}

export async function renderSecFilings(ticker) {
    try {
        // Run requests sequentially to avoid rate limiting
        const insider = await getSecInsiderTrading(ticker);
        _renderInsiderTrading(insider);
        
        const institutional = await getSecInstitutionalOwnership(ticker);
        _renderInstitutionalOwnership(institutional);

        const events = await getSecMaterialEvents(ticker);
        _renderMaterialEvents(events);

        const annual = await getSecAnnualReports(ticker);
        _renderAnnualReports(annual);

        const quarterly = await getSecQuarterlyReports(ticker);
        _renderQuarterlyReports(quarterly);

    } catch (error) {
        console.error("Error rendering SEC filings:", error);
        const secTab = document.getElementById('sec-filings-tab');
        if (secTab) {
            secTab.innerHTML = `<div class="p-4 text-center text-red-500">Could not load SEC Filings: ${error.message}</div>`;
        }
    }
}

export function renderValuationHealthDashboard(container, ticker, fmpData) {
    if (!container) return;

    // Helper to generate an SVG sparkline from an array of numbers
    const createSparkline = (data, statusClass) => {
        if (!data || data.length < 2) return '';
        const validData = data.filter(d => typeof d === 'number' && isFinite(d));
        if (validData.length < 2) return '';

        const width = 100;
        const height = 40;
        const min = Math.min(...validData);
        const max = Math.max(...validData);
        const range = max - min === 0 ? 1 : max - min;

        const points = validData.map((d, i) => {
            const x = (i / (validData.length - 1)) * width;
            const y = height - ((d - min) / range) * (height - 4) + 2; // -4 and +2 add padding
            return `${x},${y}`;
        }).join(' ');
        
        return `<svg viewBox="0 0 ${width} ${height}" class="sparkline-container"><polyline points="${points}" class="sparkline ${statusClass}" /></svg>`;
    };
    
    // Helper to evaluate metrics and return consistent object
    const evaluateMetric = (name, key, history, type, isPercentage, lowerIsBetter) => {
        const latest = history[history.length - 1]?.[key];
        const dataPoints = history.map(h => h[key]).filter(v => typeof v === 'number');
        if (typeof latest !== 'number') return { value: 'N/A', status: 'neutral', text: 'No Data', gaugePercent: 0, sparkline: '' };
        
        const avg = dataPoints.reduce((a, b) => a + b, 0) / dataPoints.length;
        let text, gaugePercent, statusClass;

        if (type === 'ratio') { // For valuation ratios
            const premium = ((latest / avg) - 1);
            if (premium < -0.2) { statusClass = 'good'; text = 'Undervalued'; }
            else if (premium > 0.2) { statusClass = 'bad'; text = 'Expensive'; }
            else { statusClass = 'neutral'; text = 'Fair Value'; }
            gaugePercent = Math.max(0, Math.min(100, 50 - (premium * 100))); // Centered at 50%
        } else if (type === 'health') { // For health/profitability metrics
            const thresholds = {
                'Debt/Equity': [0.5, 1.5], 'Current Ratio': [2, 1], 'ROE': [0.15, 0.05], 'Net Margin': [0.10, 0],
                'Gross Margin': [0.40, 0.20], 'ROA': [0.08, 0.03], 'Debt/Assets': [0.4, 0.6]
            };
            const [good, bad] = thresholds[name];
            if ((!lowerIsBetter && latest >= good) || (lowerIsBetter && latest <= good)) { statusClass = 'good'; text = name.includes('Debt') ? 'Conservative' : 'High'; }
            else if ((!lowerIsBetter && latest < bad) || (lowerIsBetter && latest > bad)) { statusClass = 'bad'; text = name.includes('Debt') ? 'Aggressive' : 'Low'; }
            else { statusClass = 'neutral'; text = 'Moderate'; }
            gaugePercent = (latest - bad) / (good - bad) * 100;
            if (lowerIsBetter) gaugePercent = 100 - gaugePercent;
            gaugePercent = Math.max(0, Math.min(100, gaugePercent));
        } else { // Neutral metrics like Market Cap
            statusClass = 'neutral';
            text = 'Trend';
            gaugePercent = 50;
        }

        return {
            value: isPercentage ? `${(latest * 100).toFixed(2)}%` : (name === 'Market Cap' ? (latest / 1e9).toFixed(2) + 'B' : latest.toFixed(2)),
            status: statusClass,
            text: text,
            gaugePercent: gaugePercent,
            sparkline: createSparkline(dataPoints, statusClass)
        };
    };

    // --- DATA EXTRACTION & CALCULATION ---
    const profile = fmpData.profile?.[0] || {};
    const keyMetrics = (fmpData.key_metrics_annual || []).slice(0, 5).reverse();
    const ratios = (fmpData.ratios_annual || []).slice(0, 5).reverse();
    
    // Add mktCap from profile to the latest keyMetrics entry for historical comparison
    if (keyMetrics.length > 0) {
        keyMetrics[keyMetrics.length - 1].marketCap = profile.mktCap;
    }

    if (keyMetrics.length < 2 || ratios.length < 2) {
        container.innerHTML = `<h3 class="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Valuation & Health Dashboard</h3><p class="text-center text-gray-500 py-8">Not enough historical data to generate the dashboard.</p>`;
        return;
    }

    // --- TILE DEFINITIONS ---
    const dashboardMetrics = [
        // Valuation
        { name: 'P/E Ratio', key: 'peRatio', source: keyMetrics, type: 'ratio', isPct: false, lowerIsBetter: true, tooltip: 'Price-to-Earnings (P/E) Ratio: Measures how expensive a stock is relative to its annual earnings. A lower P/E may indicate a bargain.' },
        { name: 'P/S Ratio', key: 'priceToSalesRatio', source: ratios, type: 'ratio', isPct: false, lowerIsBetter: true, tooltip: 'Price-to-Sales (P/S) Ratio: Compares the stock price to its revenue per share. Useful for valuing companies that are not yet profitable.' },
        { name: 'P/B Ratio', key: 'priceToBookRatio', source: ratios, type: 'ratio', isPct: false, lowerIsBetter: true, tooltip: 'Price-to-Book (P/B) Ratio: Compares a company\'s market capitalization to its book value. A ratio under 1.0 may indicate it\'s undervalued.' },
        { name: 'EV/EBITDA', key: 'enterpriseValueMultiple', source: ratios, type: 'ratio', isPct: false, lowerIsBetter: true, tooltip: 'EV/EBITDA Ratio: Compares a company\'s Enterprise Value to its Earnings Before Interest, Taxes, Depreciation, and Amortization. Often used to find attractive takeover candidates.' },
        // Profitability
        { name: 'ROE', key: 'roe', source: keyMetrics, type: 'health', isPct: true, lowerIsBetter: false, tooltip: 'Return on Equity (ROE): A measure of profitability that calculates how many dollars of profit a company generates with each dollar of shareholders\' equity.' },
        { name: 'ROA', key: 'returnOnAssets', source: keyMetrics, type: 'health', isPct: true, lowerIsBetter: false, tooltip: 'Return on Assets (ROA): An indicator of how profitable a company is relative to its total assets.' },
        { name: 'Net Margin', key: 'netProfitMargin', source: ratios, type: 'health', isPct: true, lowerIsBetter: false, tooltip: 'Net Profit Margin: Represents the percentage of revenue that becomes profit. A higher margin indicates a more profitable company.' },
        { name: 'Gross Margin', key: 'grossProfitMargin', source: ratios, type: 'health', isPct: true, lowerIsBetter: false, tooltip: 'Gross Profit Margin: The percentage of revenue left after subtracting the cost of goods sold.' },
        // Health
        { name: 'Debt/Equity', key: 'debtToEquity', source: keyMetrics, type: 'health', isPct: false, lowerIsBetter: true, tooltip: 'Debt/Equity Ratio: Measures a company\'s financial leverage by dividing its total liabilities by shareholder equity. A high ratio indicates more debt.' },
        { name: 'Debt/Assets', key: 'debtRatio', source: ratios, type: 'health', isPct: true, lowerIsBetter: true, tooltip: 'Debt/Assets Ratio: The proportion of a company\'s assets that are financed through debt.' },
        { name: 'Current Ratio', key: 'currentRatio', source: ratios, type: 'health', isPct: false, lowerIsBetter: false, tooltip: 'Current Ratio: A liquidity ratio that measures a company\'s ability to pay its short-term obligations or those due within one year.' },
        // Neutral
        { name: 'Market Cap', key: 'marketCap', source: keyMetrics, type: 'neutral', isPct: false, lowerIsBetter: false, tooltip: 'The total market value of a company\'s outstanding shares. Represents the size of the company.' },
    ];
    
    // --- HTML RENDERING ---
    const tilesHtml = dashboardMetrics.map(m => {
        const data = evaluateMetric(m.name, m.key, m.source, m.type, m.isPct, m.lowerIsBetter);
        return `
            <div class="metric-tile" data-tooltip="${sanitizeText(m.tooltip)}">
                <div>
                    <p class="metric-title">${m.name}</p>
                    <p class="metric-value">${data.value}</p>
                    <p class="metric-status ${data.status}">${data.text}</p>
                    <div class="gauge-container">
                        <div class="gauge-bar">
                            <div class="gauge-fill ${data.status}" style="width: ${data.gaugePercent}%;"></div>
                        </div>
                    </div>
                </div>
                ${data.sparkline}
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <h3 class="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Valuation & Health Dashboard</h3>
        <div class="health-dashboard-grid">${tilesHtml}</div>`;
}

export function renderThesisTracker(container, ticker) {
    if (!container) return;

    const stock = state.portfolioCache.find(s => s.ticker === ticker);

    // --- START OF FIX: Added a guard clause to prevent crash ---
    if (!stock) {
        container.innerHTML = `<div class="p-4 text-center text-red-500">Error: Could not find data for ${ticker} in the cache.</div>`;
        return;
    }
    // --- END OF FIX ---

    const thesisContent = stock.thesis || ''; 

    let contentHtml = '';
    if (thesisContent) {
        const preview = thesisContent.split('\n').slice(0, 5).join('\n');
        contentHtml = `
            <div class="prose prose-sm max-w-none bg-gray-50 p-4 rounded-md border">${marked.parse(preview)}</div>
            ${thesisContent.split('\n').length > 5 ? '<p class="text-xs text-gray-500 mt-1">Showing a preview...</p>' : ''}
        `;
    } else {
        contentHtml = `<p class="text-gray-500 italic">You haven't written an investment thesis for this stock yet.</p>`;
    }
    
    container.innerHTML = `
        <div class="flex justify-between items-center mb-4 border-b pb-2">
             <h3 class="text-xl font-bold text-gray-800">My Investment Thesis</h3>
             <button id="edit-thesis-button" data-ticker="${ticker}" class="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-semibold py-1 px-4 rounded-lg text-sm">
                ${thesisContent ? 'Edit Thesis' : 'Write Thesis'}
             </button>
        </div>
        ${contentHtml}
    `;
}

export function displayReport(container, content, prompt = null) {
    let finalHtml = '';
    if (prompt) {
        finalHtml += `
            <details class="mb-4 border rounded-lg">
                <summary class="p-2 font-semibold text-sm text-gray-700 cursor-pointer hover:bg-gray-50 bg-gray-100">View Prompt</summary>
                <pre class="text-xs whitespace-pre-wrap break-all bg-gray-900 text-white p-3 rounded-b-lg">${sanitizeText(prompt)}</pre>
            </details>
        `;
    }

    finalHtml += marked.parse(content || '');
    container.innerHTML = finalHtml;
}

export function updateReportStatus(statusContainer, reports, activeReportId, analysisParams) {
    statusContainer.classList.remove('hidden');
    statusContainer.dataset.activeReportType = analysisParams.reportType;
    let statusHtml = '';

    if (reports.length > 0) {
        const activeReport = reports.find(r => r.id === activeReportId) || reports[0];
        const savedDate = activeReport.savedAt.toDate().toLocaleString();
        
        statusHtml = `
            <div class="flex items-center gap-2">
                <span class="text-sm font-semibold text-blue-800">Displaying report from: ${savedDate}</span>
                <select id="version-selector-${analysisParams.reportType}" class="text-sm border-gray-300 rounded-md">
                    ${reports.map(r => `<option value="${r.id}" ${r.id === activeReport.id ? 'selected' : ''}>${r.savedAt.toDate().toLocaleString()}</option>`).join('')}
                </select>
            </div>
            <button id="generate-new-${analysisParams.reportType}" class="bg-green-500 hover:bg-green-600 text-white text-xs font-semibold py-1 px-3 rounded-full">Generate New Report</button>
        `;
    } else {
        statusHtml = `
            <span class="text-sm font-semibold text-green-800">Displaying newly generated report.</span>
            <button id="generate-new-${analysisParams.reportType}" class="bg-green-500 hover:bg-green-600 text-white text-xs font-semibold py-1 px-3 rounded-full">Generate New Report</button>
        `;
    }
    
    statusContainer.innerHTML = statusHtml;

    const versionSelector = document.getElementById(`version-selector-${analysisParams.reportType}`);
    if (versionSelector) {
        versionSelector.addEventListener('change', (e) => {
            const selectedReport = reports.find(r => r.id === e.target.value);
            if (selectedReport) {
                const contentContainer = statusContainer.nextElementSibling;
                displayReport(contentContainer, selectedReport.content, selectedReport.prompt);
                contentContainer.dataset.currentPrompt = selectedReport.prompt || '';
                contentContainer.dataset.rawMarkdown = selectedReport.content;
                updateReportStatus(statusContainer, reports, selectedReport.id, analysisParams);
            }
        });
    }

    const generateNewBtn = document.getElementById(`generate-new-${analysisParams.reportType}`);
    if (generateNewBtn) {
        generateNewBtn.addEventListener('click', async () => {
            // Dynamically import the handlers only when needed
            const handlers = await import('./ui-handlers.js');
            
            // Add special handling for reports with custom generation logic
            if (analysisParams.reportType === 'InvestmentMemo') {
                handlers.handleInvestmentMemoRequest(analysisParams.symbol, true);
            } else if (analysisParams.reportType === 'GarpValidation') {
                handlers.handleGarpValidationRequest(analysisParams.symbol, true);
            } else if (analysisParams.reportType.startsWith('Form')) {
                let formType;
                if (analysisParams.reportType.includes('8K')) formType = '8-K';
                else if (analysisParams.reportType.includes('10K')) formType = '10-K';
                else if (analysisParams.reportType.includes('10Q')) formType = '10-Q';
                if (formType) {
                    handlers.handleFilingAnalysisRequest(analysisParams.symbol, formType, true);
                }
            } else {
                handlers.handleAnalysisRequest(analysisParams.symbol, analysisParams.reportType, analysisParams.promptConfig, true);
            }
        });
    }
}

export function updateBroadReportStatus(statusContainer, reports, activeReportId, analysisParams) {
    statusContainer.classList.remove('hidden');
    statusContainer.dataset.activeReportType = analysisParams.reportType;
    let statusHtml = '';

    if (reports.length > 0) {
        const activeReport = reports.find(r => r.id === activeReportId) || reports[0];
        const savedDate = activeReport.savedAt.toDate().toLocaleString();
        
        statusHtml = `
            <div class="flex items-center gap-2">
                <span class="text-sm font-semibold text-blue-800">Displaying report from: ${savedDate}</span>
                <select id="broad-version-selector-${analysisParams.reportType}" class="text-sm border-gray-300 rounded-md">
                    ${reports.map(r => `<option value="${r.id}" ${r.id === activeReport.id ? 'selected' : ''}>${r.savedAt.toDate().toLocaleString()}</option>`).join('')}
                </select>
            </div>
            <button id="broad-generate-new-${analysisParams.reportType}" class="bg-green-500 hover:bg-green-600 text-white text-xs font-semibold py-1 px-3 rounded-full">Generate New Report</button>
        `;
    } else {
        statusHtml = `<span class="text-sm font-semibold text-green-800">Displaying newly generated report.</span>`;
    }
    
    statusContainer.innerHTML = statusHtml;

    const versionSelector = document.getElementById(`broad-version-selector-${analysisParams.reportType}`);
    if (versionSelector) {
        versionSelector.addEventListener('change', (e) => {
            const selectedReport = reports.find(r => r.id === e.target.value);
            if (selectedReport) {
                const contentContainer = statusContainer.parentElement.querySelector('.prose');
                displayReport(contentContainer, selectedReport.content);
                updateBroadReportStatus(statusContainer, reports, selectedReport.id, analysisParams);
            }
        });
    }

    const generateNewBtn = document.getElementById(`broad-generate-new-${analysisParams.reportType}`);
    if (generateNewBtn) {
        generateNewBtn.addEventListener('click', () => {
            handleBroadAnalysisRequest(analysisParams.contextName, analysisParams.contextType, analysisParams.reportType, true);
        });
    }
}


export async function renderFilingAnalysisTab(ticker, formType) {
    const formTypeLower = formType.toLowerCase().replace('-', '');
    const reportType = `Form${formType.replace('-', '')}Analysis`;

    const recentListContainer = document.getElementById(`recent-${formTypeLower}-list`);
    const savedContainer = document.getElementById(`latest-saved-${formTypeLower}-container`);
    const analyzeBtn = document.getElementById(`analyze-latest-${formTypeLower}-button`);
    const aiArticleContainer = document.getElementById(`ai-article-container-${formTypeLower}`);
    const statusContainer = document.getElementById(`report-status-container-${formTypeLower}`);

    try {
        // 1. Fetch and render recent filings from SEC API
        let filings;
        if (formType === '8-K') {
            filings = await getSecMaterialEvents(ticker);
        } else if (formType === '10-K') {
            filings = await getSecAnnualReports(ticker);
        } else if (formType === '10-Q') {
            filings = await getSecQuarterlyReports(ticker);
        }
        
        const topFilings = filings.slice(0, 2);
        if (topFilings.length > 0) {
            recentListContainer.innerHTML = `
                <ul class="divide-y divide-gray-200">
                    ${topFilings.map(f => `
                        <li class="p-3 hover:bg-gray-50">
                            <a href="${sanitizeText(f.linkToFilingDetails)}" target="_blank" rel="noopener noreferrer" class="block">
                                <p class="font-semibold text-indigo-600">${sanitizeText(f.description || `Form ${formType}`)}</p>
                                <p class="text-xs text-gray-500">Filed: ${new Date(f.filedAt).toLocaleString()}</p>
                            </a>
                        </li>
                    `).join('')}
                </ul>
            `;
        } else {
            recentListContainer.innerHTML = `<p class="text-center text-gray-500 py-8">No recent ${formType} filings found via SEC API.</p>`;
        }

        // 2. Fetch and render latest manually saved filing from Firestore
        const q = query(
            collection(state.db, CONSTANTS.DB_COLLECTION_MANUAL_FILINGS),
            where("ticker", "==", ticker),
            where("formType", "==", formType),
            orderBy("filingDate", "desc"),
            limit(1)
        );
        const manualFilingSnapshot = await getDocs(q);
        if (!manualFilingSnapshot.empty) {
            const latestFiling = manualFilingSnapshot.docs[0].data();
            savedContainer.innerHTML = `
                <div class="bg-gray-100 p-4 rounded-lg border">
                    <p class="text-sm font-semibold text-gray-700">Displaying saved filing from: ${latestFiling.filingDate}</p>
                    <pre class="mt-2 text-xs whitespace-pre-wrap break-all bg-white p-2 rounded border max-h-48 overflow-y-auto">${sanitizeText(latestFiling.content)}</pre>
                </div>
            `;
            analyzeBtn.disabled = false;
        } else {
            savedContainer.innerHTML = `<div class="content-placeholder text-center text-gray-500 py-8">No filing text has been saved yet for this stock.</div>`;
            analyzeBtn.disabled = true;
        }

        // 3. Fetch and render latest AI analysis from Firestore
        const reportsRef = collection(state.db, CONSTANTS.DB_COLLECTION_AI_REPORTS);
        const reportQuery = query(reportsRef, where("ticker", "==", ticker), where("reportType", "==", reportType), orderBy("savedAt", "desc"));
        const reportSnapshot = await getDocs(reportQuery);
        const savedReports = reportSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        aiArticleContainer.innerHTML = '';
        statusContainer.classList.add('hidden');
        if (savedReports.length > 0) {
            const latestReport = savedReports[0];
            displayReport(aiArticleContainer, latestReport.content, latestReport.prompt);
            updateReportStatus(statusContainer, savedReports, latestReport.id, { symbol: ticker, reportType });
        }

    } catch (error) {
        console.error(`Error rendering ${formType} tab:`, error);
        recentListContainer.innerHTML = `<p class="text-red-500">Error loading data: ${error.message}</p>`;
    }
}
