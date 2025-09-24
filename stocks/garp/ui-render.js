import { CONSTANTS, state } from './config.js';
import { getDocs, collection } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { _calculateGarpScorecardMetrics } from './analysis-helpers.js';
import { handleAnalysisRequest, handleInvestmentMemoRequest, handleGarpCandidacyRequest, handlePositionAnalysisRequest } from './ui-handlers.js';
import { getFmpStockData } from './api.js';

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

        // Update dashboard counts
        const portfolioCount = state.portfolioCache.filter(s => s.status === 'Portfolio').length;
        const watchlistCount = state.portfolioCache.filter(s => s.status === 'Watchlist').length;
        const revisit3MonthsCount = state.portfolioCache.filter(s => s.status === 'Revisit 3 months').length;
        const revisit6MonthsCount = state.portfolioCache.filter(s => s.status === 'Revisit 6 months').length;

        document.getElementById('portfolio-count').textContent = portfolioCount;
        document.getElementById('watchlist-count').textContent = watchlistCount;
        document.getElementById('revisit-3-months-count').textContent = revisit3MonthsCount;
        document.getElementById('revisit-6-months-count').textContent = revisit6MonthsCount;
        
        // Render the new overview card after data is fetched
        await renderPortfolioGarpOverview();
        
    } catch (error) {
        console.error("Error fetching portfolio data:", error);
    }
}


// --- UI RENDERING ---

export function renderPeerComparisonTable(container, ticker, companyMetrics, peerData) {
    if (!container || !companyMetrics || !peerData || !peerData.averages) {
        container.innerHTML = '<p class="text-center text-gray-500 p-4">Could not render peer comparison data.</p>';
        return;
    }

    const metricsToCompare = [
        { key: 'P/E (TTM)', label: 'P/E Ratio', higherIsBetter: false, format: 'decimal' },
        { key: 'P/S Ratio', label: 'P/S Ratio', higherIsBetter: false, format: 'decimal' },
        { key: 'Price to FCF', label: 'P/FCF Ratio', higherIsBetter: false, format: 'decimal' },
        { key: 'Return on Equity', label: 'ROE', higherIsBetter: true, format: 'percent' }
    ];

    const formatValue = (value, format) => {
        if (typeof value !== 'number' || !isFinite(value)) return 'N/A';
        if (format === 'percent') return `${(value * 100).toFixed(1)}%`;
        return value.toFixed(2);
    };

    let tableRowsHtml = '';
    for (const metric of metricsToCompare) {
        const companyValue = companyMetrics[metric.key]?.value;
        const peerValue = peerData.averages[metric.key];
        
        let premiumHtml = '<td class="text-center text-gray-500">N/A</td>';
        if (typeof companyValue === 'number' && typeof peerValue === 'number' && peerValue !== 0) {
            const premium = (companyValue / peerValue) - 1;
            let premiumClass = '';

            if (companyValue > 0 && peerValue < 0) {
                premiumClass = metric.higherIsBetter ? 'price-gain' : 'price-loss';
            } else if (companyValue < 0 && peerValue > 0) {
                premiumClass = metric.higherIsBetter ? 'price-loss' : 'price-gain';
            } else {
                if (!metric.higherIsBetter && companyValue < 0) {
                    premiumClass = 'price-loss'; 
                } else if (premium > 0.001) {
                    premiumClass = metric.higherIsBetter ? 'price-gain' : 'price-loss';
                } else if (premium < -0.001) {
                    premiumClass = metric.higherIsBetter ? 'price-loss' : 'price-gain';
                }
            }
            premiumHtml = `<td class="text-center font-semibold ${premiumClass}">${(premium * 100).toFixed(1)}%</td>`;
        }
        
        tableRowsHtml += `
            <tr class="border-b">
                <td class="py-2 px-3 font-semibold text-gray-700">${metric.label}</td>
                <td class="text-center">${formatValue(companyValue, metric.format)}</td>
                <td class="text-center">${formatValue(peerValue, metric.format)}</td>
                ${premiumHtml}
            </tr>
        `;
    }

    const peerList = peerData.peers.join(', ');
    const lastUpdated = peerData.cachedAt ? `Last updated: ${peerData.cachedAt.toDate().toLocaleDateString()}` : '';

    container.innerHTML = `
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead>
                    <tr class="bg-gray-100">
                        <th class="text-left py-2 px-3">Metric</th>
                        <th class="text-center">${ticker}</th>
                        <th class="text-center">Peer Average</th>
                        <th class="text-center">Premium / (Discount)</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRowsHtml}
                </tbody>
            </table>
        </div>
        <div class="mt-3 text-xs text-gray-500">
            <p><strong>Peers:</strong> ${peerList}</p>
            <p>${lastUpdated}</p>
        </div>
    `;
}


export async function renderPortfolioGarpOverview() {
    const overviewContainer = document.getElementById('portfolio-garp-overview-container');
    const breakdownContainer = document.getElementById('portfolio-garp-breakdown-container');
    const aiSummaryContainer = document.getElementById('portfolio-garp-ai-summary-container');
    
    // Clear old content from containers we are replacing
    if (overviewContainer) overviewContainer.innerHTML = '';
    if (breakdownContainer) breakdownContainer.innerHTML = '';
    if (aiSummaryContainer) aiSummaryContainer.innerHTML = ''; // Clear previous AI summary

    try {
        const portfolioStocks = state.portfolioCache.filter(s => s.status === 'Portfolio');

        if (portfolioStocks.length === 0) {
            overviewContainer.innerHTML = `<p class="text-center text-gray-500 py-8">Add stocks to your portfolio to see a summary here.</p>`;
            return;
        }
        
        // Sort by score, putting stocks without a score at the bottom
        portfolioStocks.sort((a, b) => (b.garpConvictionScore || 0) - (a.garpConvictionScore || 0));

        let overviewHtml = '<ul class="divide-y divide-gray-200 border rounded-lg bg-white">';
        
        for (const stock of portfolioStocks) {
            const score = stock.garpConvictionScore;
            let scoreBadgeHtml = '<span class="conviction-score-badge low" data-tooltip="Generate a GARP Candidacy Report to get a score.">N/A</span>';

            if (score) {
                let scoreClass = 'low';
                let scoreTooltip = 'Score indicates a low alignment with GARP principles.';
                if (score > 75) {
                    scoreClass = 'high';
                    scoreTooltip = 'Score indicates a high alignment with GARP principles.';
                } else if (score > 50) {
                    scoreClass = 'medium';
                    scoreTooltip = 'Score indicates a medium alignment with GARP principles.';
                }
                scoreBadgeHtml = `<span class="conviction-score-badge ${scoreClass}" data-tooltip="${scoreTooltip}">${score}</span>`;
            }

            overviewHtml += `
                <li class="p-3 flex justify-between items-center hover:bg-gray-50">
                    <div class="flex items-center gap-4">
                        ${scoreBadgeHtml}
                        <div>
                            <p class="font-semibold text-gray-800">${sanitizeText(stock.companyName)} (${sanitizeText(stock.ticker)})</p>
                            <p class="text-sm text-gray-500">${sanitizeText(stock.sector) || 'N/A'}</p>
                        </div>
                    </div>
                </li>
            `;
        }
        
        overviewHtml += '</ul>';
        overviewContainer.innerHTML = overviewHtml;

    } catch (error) {
        console.error("Error rendering portfolio GARP overview:", error);
        overviewContainer.innerHTML = `<p class="text-center text-red-500 py-8">Could not load the overview: ${error.message}</p>`;
    }
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
        html += `<div class="p-2 sticky top-0 bg-indigo-50 text-indigo-800 font-semibold text-sm">${sanitizeText(sector)}</div>`;
        html += '<ul class="divide-y divide-gray-200">';
        groupedBySector[sector].sort((a,b) => a.companyName.localeCompare(b.companyName)).forEach(stock => {
            let statusBadge = '';
            switch (stock.status) {
                case 'Portfolio':
                    statusBadge = '<span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-100 text-green-800">Portfolio</span>';
                    break;
                default:
                    statusBadge = `<span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800">${sanitizeText(stock.status)}</span>`;
            }

            html += `
                <li class="p-4 flex justify-between items-center hover:bg-gray-50">
                    <div>
                        <p class="font-semibold text-gray-800 flex items-center">${sanitizeText(stock.companyName)} (${sanitizeText(stock.ticker)})</p>
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
        const stocks = groupedBySector[sector].sort((a, b) => (b.garpConvictionScore || 0) - (a.garpConvictionScore || 0));
        html += `
            <details class="border-b" open>
                <summary class="p-3 font-semibold cursor-pointer hover:bg-gray-50 flex justify-between">
                    <span>${sanitizeText(sector)}</span>
                    <span>&#9660;</span>
                </summary>
                <div class="bg-gray-50">
                    <ul class="divide-y divide-gray-200">`;
        
        stocks.forEach(stock => {
            const refreshedAt = stock.fmpData?.cachedAt ? stock.fmpData.cachedAt.toDate().toLocaleString() : 'N/A';
            const score = stock.garpConvictionScore;
            let scoreBadgeHtml = '';
            if (score) {
                let scoreClass = 'low';
                if (score > 75) scoreClass = 'high';
                else if (score > 50) scoreClass = 'medium';
                scoreBadgeHtml = `<span class="conviction-score-badge ${scoreClass}">${score}</span>`;
            }

            html += `
                <li class="p-4 flex justify-between items-center">
                    <div class="flex items-center gap-3">
                        ${scoreBadgeHtml}
                        <div>
                            <p class="font-bold text-indigo-700">${sanitizeText(stock.companyName)}</p>
                            <p class="text-sm text-gray-600">${sanitizeText(stock.ticker)}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="flex items-center justify-end gap-2">
                            <button class="dashboard-item-view bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold py-1 px-3 rounded-full" data-ticker="${sanitizeText(stock.ticker)}">View</button>
                            <button class="dashboard-item-refresh bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-semibold py-1 px-3 rounded-full" data-ticker="${sanitizeText(stock.ticker)}">Refresh</button>
                            <button class="dashboard-item-edit bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold py-1 px-3 rounded-full" data-ticker="${sanitizeText(stock.ticker)}">Edit</button>
                        </div>
                        <p class="text-xs text-gray-400 mt-2" title="Last Refreshed">Refreshed: ${refreshedAt}</p>
                    </div>
                </li>`;
        });

        html += `</ul></div></details>`;
    });
    container.innerHTML = html;
}

export function renderGarpScorecardDashboard(container, ticker, fmpData) {
    if (!container) return;

    const metrics = _calculateGarpScorecardMetrics(fmpData);
    
    const tilesHtml = Object.entries(metrics).map(([name, data]) => {
        if (name === 'garpConvictionScore') return '';
        let valueDisplay = 'N/A';
        let colorClass = 'text-gray-500 italic'; // Muted gray for N/A

        if (typeof data.value === 'number' && isFinite(data.value)) {
            colorClass = data.isMet ? 'price-gain' : 'price-loss'; // Green for pass, Red for fail
            if (data.format === 'percent') {
                valueDisplay = `${(data.value * 100).toFixed(2)}%`;
            } else {
                valueDisplay = data.value.toFixed(2);
            }
        }
        
        return `
            <div class="metric-tile p-4">
                <p class="metric-title text-sm">${name}</p>
                <p class="metric-value text-2xl ${colorClass}">${valueDisplay}</p>
            </div>
        `;
    }).join('');

    const score = metrics.garpConvictionScore;
    let scoreClass = 'low';
    if (score > 75) scoreClass = 'high';
    else if (score > 50) scoreClass = 'medium';
    
    const helpIconSvg = `<button data-report-type="GarpConvictionScore" class="ai-help-button p-1 rounded-full hover:bg-indigo-100" title="What is this?"><svg class="w-5 h-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg></button>`;

    const scoreHtml = `
        <div class="conviction-score-display ${scoreClass}">
            <div class="flex items-center justify-center gap-2">
                <div class="text-sm font-bold text-gray-600">CONVICTION SCORE</div>
                ${helpIconSvg}
            </div>
            <div class="score-value">${score}</div>
        </div>
    `;

    container.innerHTML = `
        <div class="flex justify-between items-start mb-4 border-b pb-2">
            <h3 class="text-xl font-bold text-gray-800">GARP Scorecard</h3>
            ${scoreHtml}
        </div>
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4">${tilesHtml}</div>`;
    
    return metrics; // Return metrics for reuse
}

/**
 * NEW: Renders the qualitative interpretation of the GARP scorecard.
 * @param {HTMLElement} container The container to render the content into.
 * @param {object} metrics The enhanced metrics object from _calculateGarpScorecardMetrics.
 */
export function renderGarpInterpretationAnalysis(container, metrics) {
    if (!container || !metrics) {
        container.innerHTML = '';
        return;
    };

    const toKebabCase = (str) => str.replace(/\s+/g, '-').toLowerCase();

    const metricGroups = {
        'Growth': ['EPS Growth (5Y)', 'EPS Growth (Next 1Y)', 'Revenue Growth (5Y)'],
        'Profitability': ['Return on Equity', 'Return on Invested Capital'],
        'Valuation & Debt': ['P/E (TTM)', 'Forward P/E', 'PEG Ratio', 'P/S Ratio', 'Price to FCF', 'Debt-to-Equity']
    };

    let html = '<h3 class="text-xl font-bold text-gray-800 mb-4 border-b pb-2">GARP Criteria Interpretation</h3>';
    html += '<div class="space-y-6">';

    for (const groupName in metricGroups) {
        html += '<div>';
        html += `<h4 class="text-lg font-semibold text-gray-700 mb-3">${groupName} Analysis</h4>`;
        html += '<div class="space-y-4">';

        metricGroups[groupName].forEach(metricName => {
            const metricData = metrics[metricName];
            if (metricData && metricData.interpretation) {
                const interp = metricData.interpretation;
                const badgeClass = toKebabCase(interp.category);
                
                html += `
                    <div class="p-3 bg-gray-50 rounded-lg border">
                        <p class="font-semibold text-gray-800 flex items-center gap-3">
                            ${metricName}
                            <span class="interp-badge ${badgeClass}">${interp.category}</span>
                        </p>
                        <p class="text-sm text-gray-600 mt-1">${interp.text}</p>
                    </div>
                `;
            }
        });

        html += '</div></div>';
    }
    
    html += '</div>';
    container.innerHTML = html;
}


export function renderValuationHealthDashboard(container, ticker, fmpData) {
    if (!container) return;

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
            const y = height - ((d - min) / range) * (height - 4) + 2;
            return `${x},${y}`;
        }).join(' ');
        
        return `<svg viewBox="0 0 ${width} ${height}" class="sparkline-container"><polyline points="${points}" class="sparkline ${statusClass}" /></svg>`;
    };
    
    const evaluateMetric = (name, key, history, type, isPercentage, lowerIsBetter) => {
        const latest = history[history.length - 1]?.[key];
        const dataPoints = history.map(h => h[key]).filter(v => typeof v === 'number');
        if (typeof latest !== 'number') return { value: 'N/A', status: 'neutral', text: 'No Data', gaugePercent: 0, sparkline: '' };
        
        const avg = dataPoints.reduce((a, b) => a + b, 0) / dataPoints.length;
        let text, gaugePercent, statusClass;

        if (type === 'ratio') {
            const premium = ((latest / avg) - 1);
            if (premium < -0.2) { statusClass = 'good'; text = 'Undervalued'; }
            else if (premium > 0.2) { statusClass = 'bad'; text = 'Expensive'; }
            else { statusClass = 'neutral'; text = 'Fair Value'; }
            gaugePercent = Math.max(0, Math.min(100, 50 - (premium * 100)));
        } else if (type === 'health') {
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
        } else {
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

    const profile = fmpData.profile?.[0] || {};
    const keyMetrics = (fmpData.key_metrics_annual || []).slice(0, 5).reverse();
    const ratios = (fmpData.ratios_annual || []).slice(0, 5).reverse();
    
    if (keyMetrics.length > 0) {
        keyMetrics[keyMetrics.length - 1].marketCap = profile.mktCap;
    }

    if (keyMetrics.length < 2 || ratios.length < 2) {
        container.innerHTML = `<h3 class="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Valuation & Health Dashboard</h3><p class="text-center text-gray-500 py-8">Not enough historical data to generate the dashboard.</p>`;
        return;
    }

    const dashboardMetrics = [
        { name: 'P/E Ratio', key: 'peRatio', source: keyMetrics, type: 'ratio', isPct: false, lowerIsBetter: true, tooltip: 'Price-to-Earnings (P/E) Ratio: Measures how expensive a stock is relative to its annual earnings. A lower P/E may indicate a bargain.' },
        { name: 'P/S Ratio', key: 'priceToSalesRatio', source: ratios, type: 'ratio', isPct: false, lowerIsBetter: true, tooltip: 'Price-to-Sales (P/S) Ratio: Compares the stock price to its revenue per share. Useful for valuing companies that are not yet profitable.' },
        { name: 'ROE', key: 'roe', source: keyMetrics, type: 'health', isPct: true, lowerIsBetter: false, tooltip: 'Return on Equity (ROE): A measure of profitability that calculates how many dollars of profit a company generates with each dollar of shareholders\' equity.' },
        { name: 'Debt/Equity', key: 'debtToEquity', source: keyMetrics, type: 'health', isPct: false, lowerIsBetter: true, tooltip: 'Debt/Equity Ratio: Measures a company\'s financial leverage by dividing its total liabilities by shareholder equity. A high ratio indicates more debt.' },
    ];
    
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

export function renderGarpAnalysisSummary(container, ticker) {
    if (!container) return;
    const helpIconSvg = `<button data-report-type="GarpCandidacy" class="ai-help-button p-1 rounded-full hover:bg-indigo-100" title="What is this?"><svg class="w-5 h-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg></button>`;

    container.innerHTML = `
        <div class="flex justify-between items-center mb-4 border-b pb-2">
            <div class="flex items-center gap-2">
                <h3 class="text-xl font-bold text-gray-800">AI GARP Candidacy Analysis</h3>
                ${helpIconSvg}
            </div>
             <button id="analyze-garp-button" data-ticker="${ticker}" class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-1 px-4 rounded-lg text-sm">
                Analyze Candidacy
            </button>
        </div>
        <div id="garp-candidacy-status-container" class="hidden p-2 mb-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between gap-4"></div>
        <div id="garp-analysis-container" class="prose prose-sm max-w-none bg-gray-50 p-4 rounded-md border min-h-[100px]">
            <p class="text-gray-500 italic">Click the button to have AI analyze this stock's GARP characteristics based on the scorecard data.</p>
        </div>
    `;
}

export function updateGarpCandidacyStatus(statusContainer, reports, activeReportId, ticker) {
    statusContainer.classList.remove('hidden');
    let statusHtml = '';

    const activeReport = reports.find(r => r.id === activeReportId) || reports[0];
    const savedDate = activeReport.savedAt.toDate().toLocaleString();
    
    statusHtml = `
        <div class="flex items-center gap-2">
            <span class="text-sm font-semibold text-blue-800">Displaying report from:</span>
            <select id="version-selector-candidacy" class="text-sm border-gray-300 rounded-md">
                ${reports.map(r => `<option value="${r.id}" ${r.id === activeReport.id ? 'selected' : ''}>${r.savedAt.toDate().toLocaleString()}</option>`).join('')}
            </select>
        </div>
        <button id="generate-new-candidacy" data-ticker="${ticker}" class="bg-green-500 hover:bg-green-600 text-white text-xs font-semibold py-1 px-3 rounded-full">Generate New</button>
    `;
    
    statusContainer.innerHTML = statusHtml;

    document.getElementById('version-selector-candidacy')?.addEventListener('change', (e) => {
        const selectedReport = reports.find(r => r.id === e.target.value);
        if (selectedReport) {
            const contentContainer = document.getElementById('garp-analysis-container');
            renderCandidacyAnalysis(contentContainer, selectedReport.content, selectedReport.prompt, selectedReport.diligenceQuestions);
            updateGarpCandidacyStatus(statusContainer, reports, selectedReport.id, ticker);
        }
    });

    document.getElementById('generate-new-candidacy')?.addEventListener('click', (e) => {
        handleGarpCandidacyRequest(e.target.dataset.ticker);
    });
}

export function renderCandidacyAnalysis(container, reportContent, prompt, diligenceQuestions = []) {
    let accordionHtml = '';
    if (prompt) {
        const sanitizedPrompt = sanitizeText(prompt);
        accordionHtml = `
            <div class="mb-4 border-b pb-4">
                <details class="border rounded-md">
                    <summary class="p-2 font-semibold text-sm text-gray-700 cursor-pointer hover:bg-gray-50 bg-gray-100">View Full Prompt Sent to AI</summary>
                    <pre class="text-xs whitespace-pre-wrap break-all bg-gray-900 text-white p-3 rounded-b-md">${sanitizedPrompt}</pre>
                </details>
            </div>
        `;
    }

    let diligenceQuestionsHtml = '';
    if (diligenceQuestions && diligenceQuestions.length > 0) {
        diligenceQuestionsHtml = `
            <h4 class="text-lg font-bold text-red-700 mb-2 mt-4 border-t pt-4">Critical Diligence Required</h4>
            <p class="text-sm text-gray-700 mb-3">The following key questions were identified by the AI during the initial assessment and require investigation before a final investment decision is made. Click to copy the question to the diligence investigation box.</p>
            <ul class="space-y-2">
                ${diligenceQuestions.map(q => `
                    <li class="p-3 bg-red-50 border border-red-200 rounded-lg cursor-pointer hover:bg-red-100 transition-colors duration-150" data-ai-query="${sanitizeText(q.aiQuery)}">
                        <p class="font-semibold text-sm text-red-800">${sanitizeText(q.humanQuestion)}</p>
                    </li>
                `).join('')}
            </ul>
        `;
    }

    container.innerHTML = accordionHtml + marked.parse(reportContent || '') + diligenceQuestionsHtml;
    
    // Add event listeners for the new diligence questions
    container.querySelectorAll('[data-ai-query]').forEach(item => {
        item.addEventListener('click', () => {
            const query = item.dataset.aiQuery;
            const diligenceInput = document.getElementById('diligence-question-input');
            if (diligenceInput) {
                diligenceInput.value = query;
                // Scroll to the diligence section to show the user the field has been populated
                diligenceInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    });
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

export function renderDiligenceLog(container, reports) {
    if (!container) return;

    if (reports.length === 0) {
        container.innerHTML = `
            <h3 class="text-lg font-semibold text-gray-800 mb-2">Diligence Log</h3>
            <p class="text-sm text-center text-gray-500 italic p-4 bg-gray-50 rounded-md">No saved investigations for this stock yet.</p>
        `;
        return;
    }

    const itemsHtml = reports.map(report => {
        const prompt = report.prompt || '';
        const question = prompt.split('Diligence Question from User:')[1]?.trim() || 'Could not parse question.';
        const savedDate = report.savedAt.toDate().toLocaleDateString();

        return `
            <li class="p-3 hover:bg-indigo-50 flex justify-between items-center">
                <div class="flex-grow min-w-0">
                     <p class="font-semibold text-sm text-indigo-700 truncate cursor-pointer view-diligence-answer" title="${sanitizeText(question)}" data-report-id="${report.id}">${sanitizeText(question)}</p>
                     <p class="text-xs text-gray-400">Saved: ${savedDate}</p>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0 ml-4">
                    <button class="diligence-rerun-btn text-xs font-semibold py-1 px-3 rounded-full bg-blue-100 text-blue-800 hover:bg-blue-200" title="Re-run this query" data-report-id="${report.id}" data-question="${sanitizeText(question)}">Re-run</button>
                    <button class="diligence-delete-btn text-xs font-semibold py-1 px-3 rounded-full bg-red-100 text-red-800 hover:bg-red-200" title="Delete this entry" data-report-id="${report.id}">Delete</button>
                </div>
            </li>
        `;
    }).join('');

    container.innerHTML = `
         <details class="border rounded-lg bg-white" open>
            <summary class="p-3 font-semibold text-gray-700 cursor-pointer hover:bg-gray-50 text-lg">Diligence Log (${reports.length})</summary>
            <ul class="divide-y divide-gray-200 max-h-48 overflow-y-auto">
                ${itemsHtml}
            </ul>
        </details>
    `;

    container.querySelectorAll('.view-diligence-answer').forEach(item => {
        item.addEventListener('click', () => {
            const reportId = item.dataset.reportId;
            const report = reports.find(r => r.id === reportId);
            if (report) {
                const articleContainer = document.getElementById('ai-article-container');
                const statusContainer = document.getElementById('report-status-container-ai');
                
                displayReport(articleContainer, report.content, report.prompt);
                
                statusContainer.classList.remove('hidden');
                statusContainer.innerHTML = `<span class="text-sm font-semibold text-blue-800">Displaying saved Diligence Investigation from: ${report.savedAt.toDate().toLocaleString()}</span>`;
            }
        });
    });
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
        generateNewBtn.addEventListener('click', () => {
            if (analysisParams.reportType === 'InvestmentMemo') {
                handleInvestmentMemoRequest(analysisParams.symbol, true);
            } else if (analysisParams.reportType === 'PositionAnalysis') {
                handlePositionAnalysisRequest(analysisParams.symbol, true);
            } else {
                handleAnalysisRequest(analysisParams.symbol, analysisParams.reportType, analysisParams.promptConfig, true);
            }
        });
    }
}
