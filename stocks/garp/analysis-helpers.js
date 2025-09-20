/**
 * Formats a large number into a more readable string with suffixes (K, M, B, T).
 * @param {number|string} value The number to format.
 * @param {number} precision The number of decimal places to use.
 * @returns {string} The formatted number string or "N/A".
 */
function formatLargeNumber(value, precision = 2) {
    const num = parseFloat(value);
    if (isNaN(num) || num === 0) return "N/A";
    const tiers = [
        { value: 1e12, suffix: 'T' }, { value: 1e9,  suffix: 'B' },
        { value: 1e6,  suffix: 'M' }, { value: 1e3,  suffix: 'K' },
    ];
    const tier = tiers.find(t => Math.abs(num) >= t.value);
    if (tier) {
        const formattedNum = (num / tier.value).toFixed(precision);
        return `${formattedNum}${tier.suffix}`;
    }
    return num.toFixed(precision);
}

/**
 * NEW: Analyzes a metric's value against GARP criteria to provide a qualitative interpretation.
 * @param {string} metricName The name of the metric being analyzed.
 * @param {number|null} value The calculated value of the metric.
 * @returns {object} An object containing the category and explanatory text.
 */
function _getMetricInterpretation(metricName, value) {
    if (value === null || !isFinite(value)) {
        return { category: 'No Data', text: 'Data was not available to generate an interpretation for this metric.' };
    }

    switch (metricName) {
        case 'EPS Growth (5Y)':
        case 'EPS Growth (Next 1Y)':
            if (value > 1.0) return { category: 'Rebound Growth', text: 'An extremely high growth forecast, often due to a recovery from a prior period of very low earnings. This figure requires scrutiny to determine the true, sustainable long-term growth rate.' };
            if (value > 0.3) return { category: 'Hyper-Growth', text: 'Signals a hyper-growth company. The key question is sustainability, as this often comes with a premium valuation.' };
            if (value > 0.1) return { category: 'GARP Sweet Spot', text: 'Indicates strong, steady, and likely sustainable growth. A key sign of a well-managed business.' };
            if (value > 0.0) return { category: 'Modest Growth', text: 'Could highlight a value or turnaround opportunity if the valuation is very low, but requires investigation.' };
            return { category: 'Negative Growth', text: 'A significant red flag indicating potential business decline or cyclical weakness.' };

        case 'Revenue Growth (5Y)':
            if (value > 0.15) return { category: 'Strong Growth', text: 'Indicates a company rapidly expanding its market share or operating in a strong industry.' };
            if (value > 0.05) return { category: 'Solid Growth', text: 'Represents healthy, sustainable top-line growth that supports the investment thesis.' };
            return { category: 'Slow Growth', text: 'A potential concern. The company may be in a mature industry or losing market share.' };

        case 'Return on Equity':
        case 'Return on Invested Capital':
            if (value > 0.3) return { category: 'Exceptional Quality', text: 'Indicates a dominant, best-in-breed business with a very strong competitive moat. Finding this at a reasonable price is rare.' };
            if (value > 0.15) return { category: 'High Quality', text: 'The sign of a strong, well-run company with a solid competitive advantage and efficient management.' };
            if (value > 0.1) return { category: 'Warning Sign', text: 'Suggests the company operates in a competitive industry or is less effective at deploying capital. Profitability may be a concern.' };
            return { category: 'Low Quality', text: 'Indicates poor profitability and likely a weak or non-existent competitive moat.' };
            
        case 'P/E (TTM)':
        case 'Forward P/E':
            if (value < 12) return { category: 'Potential Value Trap', text: 'Appears very cheap, but this could be a red flag. Requires deep investigation to ensure it isn\'t cheap for a good reason.' };
            if (value < 25) return { category: 'Reasonable Price', text: 'The valuation appears reasonable or attractive given the company\'s growth prospects. A classic GARP profile.' };
            return { category: 'Expensive', text: 'The stock is trading at a premium. The investment thesis relies heavily on future growth meeting high expectations.' };

        case 'PEG Ratio':
            if (value < 0.5) return { category: 'Investigate', text: 'The stock appears extremely cheap relative to its growth forecast. This is a potential red flag that requires deep investigation to confirm the growth estimates are realistic and not based on one-time factors.' };
            if (value <= 1.5) return { category: 'Fairly Priced', text: 'Suggests a balanced risk/reward profile where the price is justified by the expected growth.' };
            return { category: 'Priced for Perfection', text: 'Indicates the price may have run ahead of growth expectations, reducing the margin of safety.' };

        case 'P/S Ratio':
            if (value < 1.0) return { category: 'Potentially Undervalued', text: 'May indicate the company\'s sales are undervalued by the market, especially for growing, not-yet-profitable companies.' };
            if (value < 2.5) return { category: 'Reasonable Price', text: 'A healthy valuation that suggests the market price is not excessive relative to the company\'s revenue.' };
            return { category: 'Expensive', text: 'The stock is trading at a high multiple of its sales, suggesting high expectations are priced in.' };
            
        case 'Debt-to-Equity':
            if (value < 0.3) return { category: 'Fortress Balance Sheet', text: 'A sign of financial conservatism, making the company highly resilient to economic downturns.' };
            if (value < 0.7) return { category: 'Low Leverage', text: 'Indicates a healthy and manageable debt level, reducing financial risk.' };
            return { category: 'High Leverage', text: 'A potential red flag. The company relies heavily on debt, which increases risk during economic weakness.' };

        default:
            return { category: 'N/A', text: '' };
    }
}


/**
 * Calculates a score multiplier (0.0 to 1.2) for a given metric based on its performance.
 * @param {string} metricName - The name of the metric.
 * @param {number|null} value - The value of the metric.
 * @returns {number} The score multiplier.
 */
function _getMetricScoreMultiplier(metricName, value) {
    if (value === null || !isFinite(value)) return 0;

    switch (metricName) {
        case 'EPS Growth (5Y)':
            if (value > 0.20) return 1.2;
            if (value > 0.10) return 1.0;
            if (value > 0.05) return 0.5;
            return 0;

        case 'EPS Growth (Next 1Y)':
            if (value > 1.0) return 0.5; // Rebound Growth (Partial Credit)
            if (value > 0.25) return 1.2;
            if (value > 0.10) return 1.0;
            if (value > 0.05) return 0.5;
            return 0;

        case 'Revenue Growth (5Y)':
            if (value > 0.15) return 1.2;
            if (value > 0.05) return 1.0;
            if (value > 0.0) return 0.5;
            return 0;

        case 'Return on Equity':
        case 'Return on Invested Capital':
            if (value > 0.30) return 1.2;
            if (value > 0.15) return 1.0;
            if (value > 0.10) return 0.5;
            return 0;
        
        case 'P/E (TTM)':
        case 'Forward P/E':
            if (value <= 0) return 0;
            if (value < 15) return 1.2;
            if (value < 25) return 1.0;
            if (value < 40) return 0.5;
            return 0;

        case 'PEG Ratio':
            if (value <= 0) return 0;
            if (value < 0.5) return 0.5; // Investigate (Partial Credit)
            if (value <= 1.5) return 1.0;
            if (value <= 2.5) return 0.5;
            return 0;

        case 'P/S Ratio':
             if (value <= 0) return 0;
             if (value < 1.5) return 1.2;
             if (value < 2.5) return 1.0;
             if (value < 4.0) return 0.5;
             return 0;
        
        case 'Debt-to-Equity':
            if (value < 0.3) return 1.2;
            if (value < 0.7) return 1.0;
            if (value < 1.0) return 0.5;
            return 0;

        default:
            return 0;
    }
}


/**
 * Calculates metrics for the GARP Scorecard dashboard.
 * @param {object} data - The full FMP data object for a stock.
 * @returns {object} An object containing GARP metrics with their values and pass/fail status.
 */
export function _calculateGarpScorecardMetrics(data) {
    const profile = data.profile?.[0] || {};
    const income = (data.income_statement_annual || []).slice().reverse();
    const metricsTtm = data.key_metrics_ttm?.[0] || {};
    const ratiosTtm = data.ratios_ttm?.[0] || {};
    const estimates = data.analyst_estimates?.[0] || {};
    const keyMetricsAnnual = (data.key_metrics_annual || []).slice().reverse();
    const latestAnnualMetrics = keyMetricsAnnual[keyMetricsAnnual.length - 1] || {};
    const ratiosAnnual = (data.ratios_annual || []).slice().reverse();
    const latestAnnualRatios = ratiosAnnual[ratiosAnnual.length - 1] || {};

    const getCagr = (startValue, endValue, periods) => {
        if (typeof startValue !== 'number' || typeof endValue !== 'number' || startValue <= 0 || periods <= 0) return null;
        return Math.pow(endValue / startValue, 1 / periods) - 1;
    };

    // --- CALCULATIONS ---
    const lastIndex = income.length - 1;
    const startIndex = income.length - 6;
    const eps5y = income.length >= 6 ? getCagr(income[startIndex].eps, income[lastIndex].eps, 5) : null;
    const rev5y = income.length >= 6 ? getCagr(income[startIndex].revenue, income[lastIndex].revenue, 5) : null;
    
    const roe = metricsTtm.roe ?? latestAnnualMetrics.roe;
    const roic = metricsTtm.roic ?? latestAnnualMetrics.roic;
    const pe = metricsTtm.peRatioTTM ?? latestAnnualMetrics.peRatio;
    const de = metricsTtm.debtToEquity ?? latestAnnualMetrics.debtToEquity;
    const ps = ratiosTtm.priceToSalesRatioTTM ?? latestAnnualRatios.priceToSalesRatio;

    let epsNext1y = null;
    const lastActualEps = income.length > 0 ? income[lastIndex].eps : null;
    const forwardEpsForGrowth = estimates.estimatedEpsAvg;
    if (lastActualEps > 0 && forwardEpsForGrowth > 0) {
        epsNext1y = (forwardEpsForGrowth / lastActualEps) - 1;
    }

    let forwardPe = null;
    const forwardEps = estimates.estimatedEpsAvg;
    const currentPrice = profile.price;
    if (currentPrice > 0 && forwardEps > 0) {
        forwardPe = currentPrice / forwardEps;
    }

    let peg = null;
    if (pe > 0 && epsNext1y > 0) {
        peg = pe / (epsNext1y * 100);
    }

    // --- METRICS DEFINITION ---
    const metrics = {
        'EPS Growth (5Y)': { value: eps5y, format: 'percent', weight: 8 },
        'EPS Growth (Next 1Y)': { value: epsNext1y, format: 'percent', weight: 15 },
        'Revenue Growth (5Y)': { value: rev5y, format: 'percent', weight: 8 },
        'Return on Equity': { value: roe, format: 'percent', weight: 12 },
        'Return on Invested Capital': { value: roic, format: 'percent', weight: 12 },
        'P/E (TTM)': { value: pe, format: 'decimal', weight: 5 },
        'Forward P/E': { value: forwardPe, format: 'decimal', weight: 8 },
        'PEG Ratio': { value: peg, format: 'decimal', weight: 15 },
        'P/S Ratio': { value: ps, format: 'decimal', weight: 5 },
        'Debt-to-Equity': { value: de, format: 'decimal', weight: 5 },
    };

    // --- CONVICTION SCORE CALCULATION ---
    let score = 0;
    let totalWeight = 0;
    for (const key in metrics) {
        const metric = metrics[key];
        totalWeight += metric.weight;
        score += metric.weight * _getMetricScoreMultiplier(key, metric.value);
        
        // Add interpretation to each metric
        metric.interpretation = _getMetricInterpretation(key, metric.value);
    }

    const convictionScore = (score / totalWeight) * 100;
    metrics.garpConvictionScore = isNaN(convictionScore) ? 0 : Math.round(convictionScore);
    
    return metrics;
}


/**
 * Calculates a comprehensive summary of metrics for the "Financial Analysis" prompt.
 * @param {object} data - The full FMP data object for a stock.
 * @returns {object} A summary object with pre-calculated metrics and trends.
 */
export function _calculateFinancialAnalysisMetrics(data) {
    // 1. Helpers
    const getTrendStatus = (series, lookback = 5, isPercentage = true) => {
        if (!series || series.length < 3) return "Not enough data for a trend.";
        const recentSeries = series.slice(-lookback);
        if (recentSeries.length < 3) return "Not enough data for a trend.";

        const firstHalf = recentSeries.slice(0, Math.floor(recentSeries.length / 2));
        const secondHalf = recentSeries.slice(Math.ceil(recentSeries.length / 2));
        
        const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
        const firstAvg = avg(firstHalf);
        const secondAvg = avg(secondHalf);

        const change = ((secondAvg - firstAvg) / Math.abs(firstAvg)) * 100;
        
        if (change > (isPercentage ? 5 : 10)) return 'is improving';
        if (change < -(isPercentage ? 5 : 10)) return 'is declining';
        return 'has been stable';
    };
    
    const calculateAverage = (data, key) => {
        const values = data.slice(-5).map(d => d[key]).filter(v => typeof v === 'number');
        if (values.length === 0) return null;
        return values.reduce((a, b) => a + b, 0) / values.length;
    };

    // 2. Data Preparation
    const profile = data.profile?.[0] || {};
    const incomeStatements = (data.income_statement_annual || []).slice().reverse();
    const keyMetrics = (data.key_metrics_annual || []).slice().reverse();
    const cashFlows = (data.cash_flow_statement_annual || []).slice().reverse();
    const grades = (data.stock_grade_news || []).slice(0, 15);
    const ratios = (data.ratios_annual || []).slice().reverse();

    const latestIncome = incomeStatements[incomeStatements.length - 1] || {};
    const latestMetrics = data.key_metrics_ttm?.[0] || keyMetrics[keyMetrics.length - 1] || {};
    const latestCashFlow = cashFlows[cashFlows.length - 1] || {};
    const latestRatios = data.ratios_ttm?.[0] || ratios[ratios.length - 1] || {};

    const incomeQuarterly = data.income_statement_quarterly || [];
    let recentPerformance = {
        mrqDate: 'N/A',
        mrqRevenue: 'N/A',
        mrqNetIncome: 'N/A',
        revenueYoyGrowth: 'N/A',
        netIncomeYoyGrowth: 'N/A',
        ttmNetIncome: 'N/A'
    };

    if (incomeQuarterly.length > 0) {
        recentPerformance.mrqDate = incomeQuarterly[0].date;
        const last4Quarters = incomeQuarterly.slice(0, 4);
        if (last4Quarters.length === 4) {
            const ttmNetIncome = last4Quarters.reduce((sum, q) => sum + (q.netIncome || 0), 0);
            recentPerformance.ttmNetIncome = formatLargeNumber(ttmNetIncome);
        }

        if (incomeQuarterly.length >= 5) {
            const mrq = incomeQuarterly[0];
            const prevYearQ = incomeQuarterly[4];

            recentPerformance.mrqRevenue = formatLargeNumber(mrq.revenue);
            recentPerformance.mrqNetIncome = formatLargeNumber(mrq.netIncome);

            if (prevYearQ.revenue && prevYearQ.revenue !== 0) {
                const revGrowth = ((mrq.revenue - prevYearQ.revenue) / Math.abs(prevYearQ.revenue)) * 100;
                recentPerformance.revenueYoyGrowth = `${revGrowth.toFixed(2)}%`;
            }

            if (prevYearQ.netIncome && prevYearQ.netIncome !== 0) {
                const niGrowth = ((mrq.netIncome - prevYearQ.netIncome) / Math.abs(prevYearQ.netIncome)) * 100;
                recentPerformance.netIncomeYoyGrowth = `${niGrowth.toFixed(2)}%`;
            }
        }
    }

    // 3. Calculations
    const marketCapValue = profile.mktCap || data.market_cap?.[0]?.marketCap;

    const analystConsensus = (() => {
        if (grades.length === 0) return "No recent analyst ratings available.";
        const buys = grades.filter(g => g.newGrade && ['buy', 'outperform', 'overweight', 'strong buy'].includes(g.newGrade.toLowerCase())).length;
        const sells = grades.filter(g => g.newGrade && ['sell', 'underperform', 'underweight'].includes(g.newGrade.toLowerCase())).length;
        const holds = grades.length - buys - sells;
        return `Generally ${buys > sells ? 'positive' : 'neutral'}, with ${buys} buys, ${holds} holds, and ${sells} sells in the last ${grades.length} ratings.`;
    })();

    const latestRoe = latestMetrics.roeTTM ?? latestMetrics.roe ?? latestMetrics.returnOnEquity;
    const highRoe = keyMetrics.slice(-5).every(k => (k.roe ?? k.returnOnEquity) > 0.15);

    const summary = {
        companyName: profile.companyName,
        tickerSymbol: profile.symbol,
        description: profile.description,
        sector: profile.sector,
        industry: profile.industry,
        marketCap: formatLargeNumber(marketCapValue),
        price: profile.price ? `$${profile.price.toFixed(2)}` : 'N/A',
        priceRange: profile.range || 'N/A',
        analystConsensus: analystConsensus,
        insiderOwnership: 'N/A'
    };

    const performance = {
        revenueTrend: `Revenue ${getTrendStatus(incomeStatements.map(i=>i.revenue), 5, false)}.`,
        netIncomeTrend: `Net income ${getTrendStatus(incomeStatements.map(i=>i.netIncome), 5, false)}.`,
        grossProfitMargin: { status: getTrendStatus(ratios.map(r=>r.grossProfitMargin)) },
        operatingProfitMargin: { status: getTrendStatus(ratios.map(r=>r.operatingProfitMargin)) },
        netProfitMargin: { status: getTrendStatus(ratios.map(r=>r.netProfitMargin)) },
        returnOnEquity: { quality: latestRoe > 0.15 ? 'High' : (latestRoe > 0.05 ? 'Moderate' : 'Low') }
    };
    
    const health = {
        currentRatio: { status: latestRatios.currentRatio > 2 ? 'Strong' : (latestRatios.currentRatio > 1 ? 'Healthy' : 'a potential risk') },
        debtToEquity: { status: latestMetrics.debtToEquity > 1 ? 'Aggressive' : (latestMetrics.debtToEquity > 0.5 ? 'Moderate' : 'Conservative') },
        interestCoverage: { status: latestRatios.interestCoverage > 5 ? 'Very strong' : (latestRatios.interestCoverage > 2 ? 'Healthy' : 'a potential concern') }
    };

    const capitalAllocationStory = (() => {
        const recentFlows = cashFlows.slice(-3);
        if (recentFlows.length === 0) return "Not enough data.";
        const total = (key) => recentFlows.reduce((sum, cf) => sum + Math.abs(cf[key] || 0), 0);
        const capex = total('capitalExpenditure');
        const dividends = total('dividendsPaid');
        const buybacks = total('commonStockRepurchased');
        const debtRepay = total('debtRepayment');
        const allocations = { 'investing in growth (CapEx)': capex, 'paying dividends': dividends, 'buying back stock': buybacks, 'paying down debt': debtRepay };
        const largest = Object.keys(allocations).reduce((a, b) => allocations[a] > allocations[b] ? a : b);
        return `The company is primarily in return/deleveraging mode, with its largest use of cash over the last few years being ${largest}.`;
    })();
    const cashFlow = {
        qualityOfEarnings: latestCashFlow.operatingCashFlow > latestIncome.netIncome ? "Strong, as operating cash flow exceeds net income." : "A potential concern, as net income is higher than operating cash flow.",
        capitalAllocationStory
    };

    const valuationMetrics = [
        { name: 'peRatio', key: 'peRatio', source: keyMetrics, ttmKey: 'peRatioTTM' },
        { name: 'priceToSalesRatio', key: 'priceToSalesRatio', source: ratios, ttmKey: 'priceToSalesRatioTTM' },
        { name: 'pbRatio', key: 'priceToBookRatio', source: ratios, ttmKey: 'priceToBookRatioTTM' },
        { name: 'enterpriseValueToEBITDA', key: 'enterpriseValueMultiple', source: ratios, ttmKey: 'enterpriseValueMultipleTTM' }
    ];
    const valuation = valuationMetrics.map(metric => {
        const currentSource = metric.ttmKey ? (metric.source === keyMetrics ? data.key_metrics_ttm?.[0] : data.ratios_ttm?.[0]) : (metric.source === keyMetrics ? latestMetrics : latestRatios);
        const current = currentSource ? (currentSource[metric.ttmKey] ?? currentSource[metric.key]) : null;
        const historicalAverage = calculateAverage(metric.source, metric.key);
        let status = 'N/A';
        if (current && historicalAverage) {
            status = current > historicalAverage ? 'trading at a premium to its historical average' : 'trading at a discount to its historical average';
        }
        return { metric: metric.name, status };
    });

    const bullCasePoints = [];
    if (performance.revenueTrend.includes('growing')) bullCasePoints.push("Consistent or growing revenue.");
    if (cashFlow.qualityOfEarnings.includes('Strong')) bullCasePoints.push("Strong operating cash flow that exceeds net income.");
    if (health.debtToEquity.status === 'Conservative') bullCasePoints.push("A strong balance sheet with a conservative debt load.");
    if (performance.returnOnEquity.quality === 'High') bullCasePoints.push("High return on equity, indicating efficient use of shareholder capital.");

    const bearCasePoints = [];
    if (performance.revenueTrend.includes('declining')) bearCasePoints.push("Declining or stagnant revenue.");
    if (performance.netIncomeTrend.includes('declining')) bearCasePoints.push("Declining profitability.");
    if (health.debtToEquity.status === 'Aggressive') bearCasePoints.push("High debt load, which adds financial risk.");
    if (health.currentRatio.status === 'a potential risk') bearCasePoints.push("Low liquidity, which could be a short-term risk.");
    
    const moatIndicator = (() => {
        const stableMargins = !performance.netProfitMargin.status.includes('declining');
        if (highRoe && stableMargins) return "The data, showing consistently high ROE and stable margins, suggests the presence of a strong competitive moat.";
        if (stableMargins) return "The data suggests a potential moat, indicated by stable profit margins.";
        return "The data does not strongly indicate a durable competitive moat, due to fluctuating margins or returns.";
    })();

    const thesis = { bullCasePoints, bearCasePoints, moatIndicator };
    
    return { summary, performance, health, cashFlow, valuation, thesis, recentPerformance };
}

/**
 * NEW: Calculates metrics for the "Moat Analysis" prompt.
 */
export function _calculateMoatAnalysisMetrics(data) {
    const profile = data.profile?.[0] || {};
    const metrics = (data.key_metrics_annual || []).slice(0, 10);
    const income = (data.income_statement_annual || []).slice(0, 10);
    const cashFlow = (data.cash_flow_statement_annual || []).slice(0, 10);
    const ratios = (data.ratios_annual || []).slice(0, 10);

    const formatPercentTrend = (arr, key1, key2) => arr.map(item => {
        const value = item[key1] ?? item[key2];
        return { year: item.calendarYear, value: value ? `${(value * 100).toFixed(2)}%` : 'N/A' };
    });

    return {
        qualitativeClues: {
             description: profile.description
        },
        roicTrend: formatPercentTrend(metrics, 'roic', 'returnOnInvestedCapital'),
        profitabilityTrends: {
            netProfitMargin: formatPercentTrend(ratios, 'netProfitMargin'),
            operatingIncome: income.map(i => ({ year: i.calendarYear, value: formatLargeNumber(i.operatingIncome) })),
            grossProfitMargin: formatPercentTrend(ratios, 'grossProfitMargin'),
        },
        reinvestmentTrends: {
            capex: cashFlow.map(cf => ({ year: cf.calendarYear, value: formatLargeNumber(cf.capitalExpenditure) })),
            rdExpenses: income.map(i => ({ year: i.calendarYear, value: formatLargeNumber(i.researchAndDevelopmentExpenses) }))
        },
        balanceSheetHealth: {
            debtToEquity: metrics[metrics.length - 1]?.debtToEquity?.toFixed(2) || 'N/A'
        }
    };
}

/**
 * NEW: Calculates metrics for the "Risk Assessment" prompt.
 */
export function _calculateRiskAssessmentMetrics(data) {
    const profile = data.profile?.[0] || {};
    const metrics = (data.key_metrics_annual || []).slice(0, 5);
    const cashFlow = (data.cash_flow_statement_annual || []).slice(0, 5);
    const income = (data.income_statement_annual || []).slice(0, 5);
    const grades = (data.stock_grade_news || []).slice(0, 10);
    const ratios = (data.ratios_annual || []).slice(0, 5);

    const latestRatios = data.ratios_ttm?.[0] || ratios[ratios.length - 1] || {};
    const latestCashFlow = cashFlow[cashFlow.length - 1] || {};
    const latestIncome = income[income.length - 1] || {};
    const latestMetrics = data.key_metrics_ttm?.[0] || metrics[metrics.length - 1] || {};

    return {
        financialRisks: {
            debtToEquity: latestMetrics.debtToEquity?.toFixed(2) || 'N/A',
            currentRatio: latestRatios.currentRatio?.toFixed(2) || 'N/A',
            earningsQuality: {
                operating_cash_flow: formatLargeNumber(latestCashFlow.operatingCashFlow),
                net_income: formatLargeNumber(latestIncome.netIncome)
            },
            dividends_paid: formatLargeNumber(Math.abs(latestCashFlow.dividendsPaid)),
            net_income: formatLargeNumber(latestIncome.netIncome)
        },
        marketRisks: {
            beta: profile.beta?.toFixed(2) || 'N/A',
            valuation: {
                peRatio: (latestMetrics.peRatioTTM ?? latestMetrics.peRatio)?.toFixed(2) || 'N/A',
                psRatio: (latestRatios.priceToSalesRatioTTM ?? latestRatios.priceToSalesRatio)?.toFixed(2) || 'N/A'
            },
            analystPessimism: grades.filter(g => g.newGrade && ['sell', 'underperform', 'underweight'].includes(g.newGrade.toLowerCase()))
                                .map(g => `${g.gradingCompany} rated ${g.newGrade}`)
        },
        businessRisks: {
            recession_sensitivity_sector: profile.sector,
            marginTrend: ratios.map(r => ({ year: r.calendarYear, net_profit_margin: r.netProfitMargin ? `${(r.netProfitMargin * 100).toFixed(2)}%` : 'N/A' })),
            netInterestMarginTrend: (profile.sector === 'Financial Services') ? 'Data for this metric is not available in the ratios endpoint.' : 'N/A for this sector'
        }
    };
}

/**
 * NEW: Calculates metrics for the "Capital Allocators" prompt.
 */
export function _calculateCapitalAllocatorsMetrics(data) {
    const cashFlow = (data.cash_flow_statement_annual || []).slice(0, 10);
    const metrics = (data.key_metrics_annual || []).slice(0, 10);
    const income = (data.income_statement_annual || []).slice(0, 10);
    const balanceSheet = (data.balance_sheet_statement_annual || []).slice(0, 10);
    const ratios = (data.ratios_annual || []).slice(0, 10);

    const ratiosMap = new Map(ratios.map(r => [r.calendarYear, r]));
    const metricsMap = new Map(metrics.map(m => [m.calendarYear, m]));

    const metricsWithNormalizedKeys = metrics.map(m => ({
        ...m,
        returnOnInvestedCapital: m.roic ?? m.returnOnInvestedCapital,
        returnOnEquity: m.roe ?? m.returnOnEquity
    }));

    const buybacksWithValuation = cashFlow.map(cf => {
        const correspondingRatios = ratiosMap.get(cf.calendarYear);
        const correspondingMetrics = metricsMap.get(cf.calendarYear);
        return {
            year: cf.calendarYear,
            common_stock_repurchased: formatLargeNumber(cf.commonStockRepurchased),
            pe_ratio: correspondingMetrics?.peRatio?.toFixed(2) || 'N/A',
            pb_ratio: correspondingRatios?.priceToBookRatio?.toFixed(2) || 'N/A'
        };
    });
    
    const formatPercentTrend = (arr, key) => arr.map(item => ({ year: item.calendarYear, value: item[key] ? `${(item[key] * 100).toFixed(2)}%` : 'N/A' }));

    return {
        cashFlowPriorities: cashFlow.map(cf => ({
            year: cf.calendarYear,
            capex: formatLargeNumber(cf.capitalExpenditure),
            acquisitions: formatLargeNumber(cf.acquisitionsNet),
            dividends: formatLargeNumber(cf.dividendsPaid),
            buybacks: formatLargeNumber(cf.commonStockRepurchased)
        })),
        reinvestmentEffectiveness: {
            roicTrend: formatPercentTrend(metricsWithNormalizedKeys, 'returnOnInvestedCapital'),
            roeTrend: formatPercentTrend(metricsWithNormalizedKeys, 'returnOnEquity'),
            revenueGrowth: income.map(i => ({ year: i.calendarYear, revenue: formatLargeNumber(i.revenue) })),
            grossProfitGrowth: income.map(i => ({ year: i.calendarYear, grossProfit: formatLargeNumber(i.grossProfit) }))
        },
        acquisitionHistory: balanceSheet.map(bs => ({
            year: bs.calendarYear,
            goodwill: formatLargeNumber(bs.goodwill),
            acquisitions: formatLargeNumber(cashFlow.find(cf => cf.calendarYear === bs.calendarYear)?.acquisitionsNet)
        })),
        shareholderReturns: {
            buybacksWithValuation: buybacksWithValuation,
            fcfPayoutRatioTrend: cashFlow.map(cf => {
                const dividends = Math.abs(cf.dividendsPaid || 0);
                const fcf = cf.freeCashFlow;
                return {
                    year: cf.calendarYear,
                    ratio: (fcf && fcf > 0) ? `${((dividends / fcf) * 100).toFixed(2)}%` : 'N/A'
                };
            })
        }
    };
}

/**
 * NEW: Calculates metrics for the "GARP Analysis" prompt.
 */
export function _calculateGarpAnalysisMetrics(data) {
    const keyMetrics = (data.key_metrics_annual || []).slice().reverse();
    const ratios = (data.ratios_annual || []).slice().reverse();
    const estimates = (data.analyst_estimates || []).slice().reverse();
    const income = (data.income_statement_annual || []).slice().reverse();

    const latestMetrics = data.key_metrics_ttm?.[0] || keyMetrics[keyMetrics.length - 1] || {};
    const latestRatios = data.ratios_ttm?.[0] || ratios[ratios.length - 1] || {};
    const lastActualIncome = income[income.length - 1] || {};
    
    const peRatio = latestMetrics.peRatioTTM ?? latestMetrics.peRatio;
    const psRatio = latestRatios.priceToSalesRatioTTM ?? latestRatios.priceToSalesRatio;

    const peHistory = keyMetrics.slice(-5).map(m => m.peRatio).filter(pe => typeof pe === 'number');
    const historicalPeAvg = peHistory.length > 0 ? peHistory.reduce((a, b) => a + b, 0) / peHistory.length : null;

    const peStatusVsHistory = (peRatio && historicalPeAvg) ? 
        (peRatio > historicalPeAvg ? 'trading at a premium to its history' : 'trading at a discount to its history')
        : 'N/A';

    const lastActualEps = lastActualIncome.eps;
    let historicalEpsGrowth = 'N/A';
    if (income.length >= 2) {
        const priorEps = income[income.length - 2].eps;
        if (priorEps && lastActualEps && priorEps !== 0) {
            historicalEpsGrowth = `${(((lastActualEps / priorEps) - 1) * 100).toFixed(2)}%`;
        }
    }
    
    const nextYearEstimate = estimates.find(e => new Date(e.date).getFullYear() > new Date(lastActualIncome.date).getFullYear());
    let forwardEpsGrowth = 'N/A';
    if (nextYearEstimate && lastActualEps && lastActualEps !== 0) {
        forwardEpsGrowth = `${(((nextYearEstimate.estimatedEpsAvg / lastActualEps) - 1) * 100).toFixed(2)}%`;
    }

    let pegValue = 'N/A';
    let pegVerdict = 'Not applicable';
    const forwardGrowthRate = parseFloat(forwardEpsGrowth);

    if (peRatio > 0 && forwardGrowthRate > 0) {
        pegValue = (peRatio / forwardGrowthRate).toFixed(2);
        if (pegValue < 1.2) {
            pegVerdict = 'Potentially attractive';
        } else if (pegValue < 2.0) {
            pegVerdict = 'Fairly priced';
        } else {
            pegVerdict = 'Appears expensive';
        }
    }

    return {
        valuation: {
            peRatio: peRatio ? peRatio.toFixed(2) : 'N/A',
            psRatio: psRatio ? psRatio.toFixed(2) : 'N/A',
            peStatusVsHistory,
        },
        growth: {
            historicalEpsGrowth,
            forwardEpsGrowth,
        },
        pegRatio: {
            value: pegValue,
            verdict: pegVerdict,
        }
    };
}

export const CALCULATION_SUMMARIES = {
    'FinancialAnalysis': 'Calculates a comprehensive financial overview by analyzing multi-year trends in revenue and income, recent quarterly performance (YoY growth), financial health ratios (e.g., Debt-to-Equity), cash flow quality, and how the current stock valuation compares to its own historical average.',
    'GarpAnalysis': 'Focuses on the Growth at a Reasonable Price (GARP) philosophy by calculating historical and forward-looking EPS growth, the current P/E ratio, and synthesizes them into a Price/Earnings-to-Growth (PEG) ratio to determine if the stock\'s growth justifies its price.',
    'MoatAnalysis': 'Assesses a company\'s competitive advantage ("moat") by calculating 10-year historical trends for key quality metrics like Return on Invested Capital (ROIC), profitability margins (net, operating, gross), and reinvestment rates (e.g., CapEx, R&D expenses).',
    'RiskAssessment': 'Identifies potential red flags by calculating financial health ratios (e.g., Debt-to-Equity, Current Ratio), checking for earnings quality (cash flow vs. net income), assessing stock volatility (Beta), and looking for signs of high valuation or negative analyst sentiment.',
    'CapitalAllocators': 'Evaluates management\'s effectiveness by analyzing historical data on how they prioritize cash flow (e.g., CapEx vs. buybacks), the effectiveness of their investments (ROIC trends), their acquisition history (goodwill), and how they return capital to shareholders (dividends and buybacks).',
    'InvestmentMemo': 'This report does not perform new calculations. Instead, it synthesizes the existing "GARP Candidacy Report" and the "GARP Scorecard" data into a formal, thesis-driven investment memo.',
    'GarpCandidacy': 'Calculates a 10-point GARP scorecard, checking key metrics like EPS & Revenue Growth, Profitability (ROE, ROIC), and Valuation (P/E, PEG, P/S, D/E) against predefined thresholds to determine if a stock qualifies as a GARP candidate.',
    'PositionAnalysis': 'This report does not perform new calculations. It uses the previously generated "GARP Candidacy Report" as the original investment thesis and compares it against the user\'s specific position details (cost basis, shares) and the current market price.',
    'PortfolioGarpAnalysis': 'This report aggregates the pre-calculated GARP scorecards for every stock currently in the user\'s "Portfolio" status. It then prepares this aggregated data for an AI to analyze.'
};
