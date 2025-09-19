import { CONSTANTS, state } from './config.js';
import { getDocs, collection } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { _calculateGarpScorecardMetrics } from './analysis-helpers.js';
import { handleAnalysisRequest, handleInvestmentMemoRequest } from './ui-handlers.js';

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
        document.getElementById('portfolio-count').textContent = portfolioCount;
        
    } catch (error) {
        console.error("Error fetching portfolio data:", error);
    }
}


// --- UI RENDERING ---

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
        const stocks = groupedBySector[sector].sort((a, b) => a.companyName.localeCompare(b.companyName));
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
            html += `
                <li class="p-4 flex justify-between items-center">
                    <div>
                        <p class="font-bold text-indigo-700">${sanitizeText(stock.companyName)}</p>
                        <p class="text-sm text-gray-600">${sanitizeText(stock.ticker)}</p>
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

    container.innerHTML = `
        <h3 class="text-xl font-bold text-gray-800 mb-4 border-b pb-2">GARP Scorecard</h3>
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4">${tilesHtml}</div>`;
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

export function renderThesisTracker(container, ticker) {
    if (!container) return;

    const stock = state.portfolioCache.find(s => s.ticker === ticker);

    if (!stock) {
        container.innerHTML = `<div class="p-4 text-center text-red-500">Error: Could not find data for ${ticker} in the cache.</div>`;
        return;
    }

    const thesisContent = stock.thesis || ''; 

    let contentHtml = '';
    if (thesisContent) {
        contentHtml = `<div class="prose prose-sm max-w-none bg-gray-50 p-4 rounded-md border">${marked.parse(thesisContent)}</div>`;
    } else {
        contentHtml = `<p class="text-gray-500 italic">You haven't written an investment thesis for this stock yet.</p>`;
    }
    
    container.innerHTML = `
        <div class="flex justify-between items-center mb-4 border-b pb-2">
             <h3 class="text-xl font-bold text-gray-800">My Investment Thesis</h3>
             <div class="flex items-center gap-2">
                <button id="test-thesis-button" data-ticker="${ticker}" class="bg-green-600 hover:bg-green-700 text-white font-semibold py-1 px-4 rounded-lg text-sm disabled:bg-gray-400 disabled:cursor-not-allowed" ${!thesisContent ? 'disabled' : ''} title="Use AI to test this thesis against the latest data">
                    Test Thesis
                </button>
                <button id="edit-thesis-button" data-ticker="${ticker}" class="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-semibold py-1 px-4 rounded-lg text-sm">
                    ${thesisContent ? 'Edit Thesis' : 'Write Thesis'}
                </button>
             </div>
        </div>
        ${contentHtml}
        <div id="thesis-test-result-container" class="mt-4"></div>
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
        generateNewBtn.addEventListener('click', () => {
            if (analysisParams.reportType === 'InvestmentMemo') {
                handleInvestmentMemoRequest(analysisParams.symbol, true);
            } else {
                handleAnalysisRequest(analysisParams.symbol, analysisParams.reportType, analysisParams.promptConfig, true);
            }
        });
    }
}
