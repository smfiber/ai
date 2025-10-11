// fileName: analysis-helpers.js
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
        { value: 1e6,  suffix: 'M' }, { value: 1e3,  suffix: 'K' },// fileName: analysis-helpers.js
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
 * Analyzes a metric's value against GARP criteria to provide a qualitative interpretation.
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
            if (value < 12) return { category: 'Potentially Undervalued', text: 'Appears very cheap, but this could be a red flag. Requires deep investigation to ensure it isn\'t cheap for a good reason.' };
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

        case 'Price to FCF':
            if (value < 15) return { category: 'Potentially Undervalued', text: 'The market price appears low relative to the company\'s ability to generate cash, a strong sign of value.' };
            if (value < 25) return { category: 'Reasonable Price', text: 'A healthy valuation that suggests the market price is not excessive relative to the company\'s cash flow.' };
            return { category: 'Expensive', text: 'The stock is trading at a high multiple of its cash flow, suggesting high expectations are priced in.' };
        
        case 'Interest Coverage':
             if (value > 10) return { category: 'Very Safe', text: 'Earnings cover interest payments many times over, indicating extremely low financial risk from debt.' };
             if (value > 4) return { category: 'Healthy', text: 'The company generates ample earnings to comfortably service its debt obligations.' };
             if (value > 2) return { category: 'Adequate', text: 'Coverage is acceptable, but a significant downturn in earnings could create pressure.' };
             return { category: 'High Risk', text: 'Earnings may not be sufficient to cover interest payments, a major red flag for financial distress.' };

        case 'Profitable Yrs (5Y)':
            if (value === 5) return { category: 'Highly Consistent', text: 'A perfect track record of profitability, indicating a durable and resilient business model.' };
            if (value === 4) return { category: 'Consistent', text: 'A strong track record of profitability with only a minor blip, suggesting business strength.' };
            return { category: 'Inconsistent', text: 'The company has struggled with consistent profitability, signaling higher operational or cyclical risk.' };

        case 'Rev. Growth Stability':
            if (value < 0.10) return { category: 'Highly Stable', text: 'Revenue growth is very consistent, indicating a predictable business with a strong competitive position.' };
            if (value < 0.25) return { category: 'Stable', text: 'Revenue growth is relatively stable, suggesting a reliable business model.' };
            return { category: 'Volatile', text: 'Revenue growth is erratic and unpredictable, which may point to cyclicality or competitive pressures.' };

        case 'Quarterly Earnings Progress':
            if (value > 1.15) return { category: 'Exceptional Beat', text: 'The company is significantly outperforming its seasonally-adjusted earnings targets for the year.' };
            if (value > 1.0) return { category: 'Beating Estimates', text: 'The company is currently ahead of its seasonally-adjusted earnings estimates for the year.' };
            if (value > 0.95) return { category: 'On Track', text: 'The company is meeting its seasonally-adjusted earnings targets for the year.' };
            if (value > 0.85) return { category: 'Lagging', text: 'The company is slightly behind its seasonally-adjusted earnings targets, which warrants monitoring.' };
            return { category: 'Significantly Behind', text: 'The company is substantially underperforming its earnings estimates, a potential red flag.' };

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
            if (value > 1.0) return 0.5;    // Rebound Growth > 100% (Partial Credit)
            if (value > 0.40) return 0.8;    // Suspicious Growth 40%-100% (Reduced Credit)
            if (value > 0.20) return 1.2;    // Exceptional Growth 20%-40% (Bonus)
            if (value > 0.10) return 1.0;    // Strong Growth 10%-20% (Full Credit)
            if (value > 0.05) return 0.5;    // Modest Growth 5%-10% (Partial Credit)
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

        case 'Price to FCF':
            if (value <= 0) return 0;
            if (value < 15) return 1.2;
            if (value < 25) return 1.0;
            if (value < 40) return 0.5;
            return 0;
        
        case 'Debt-to-Equity':
            if (value < 0.3) return 1.2;
            if (value < 0.7) return 1.0;
            if (value < 1.0) return 0.5;
            return 0;

        case 'Interest Coverage':
            if (value > 10) return 1.2;
            if (value > 4) return 1.0;
            if (value > 2) return 0.5;
            return 0;
        
        case 'Profitable Yrs (5Y)':
            if (value === 5) return 1.2;
            if (value === 4) return 1.0;
            if (value === 3) return 0.5;
            return 0;
        
        case 'Rev. Growth Stability': // Lower is better
            if (value < 0.10) return 1.2;
            if (value < 0.25) return 1.0;
            if (value < 0.40) return 0.5;
            return 0;
        
        case 'Quarterly Earnings Progress':
             if (value > 1.15) return 1.2; // Exceptional Beat
             if (value > 1.0) return 1.1; // Beating Estimates (slight bonus)
             if (value > 0.95) return 1.0; // On Track
             if (value > 0.85) return 0.5; // Lagging
             return 0; // Significantly Behind

        default:
            return 0;
    }
}

/**
 * Calculates consistency metrics based on 5-year historical data.
 * @param {Array} income_statements - Array of annual income statement objects from FMP.
 * @returns {object} An object containing profitable years count and revenue growth standard deviation.
 */
function _calculateConsistencyMetrics(income_statements) {
    const result = { profitableYears: null, revenueGrowthStdDev: null };
    if (!income_statements || income_statements.length < 5) return result;

    const recent_statements = income_statements.slice(-5);

    // 1. Calculate Profitable Years
    result.profitableYears = recent_statements.filter(stmt => stmt.eps > 0).length;

    // 2. Calculate Revenue Growth Stability (Standard Deviation)
    const growthRates = [];
    for (let i = 1; i < recent_statements.length; i++) {
        const prevRevenue = recent_statements[i-1].revenue;
        const currRevenue = recent_statements[i].revenue;
        if (prevRevenue > 0) {
            growthRates.push((currRevenue / prevRevenue) - 1);
        }
    }
    
    if (growthRates.length > 1) {
        const mean = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;
        const variance = growthRates.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / growthRates.length;
        result.revenueGrowthStdDev = Math.sqrt(variance);
    }

    return result;
}

/**
 * Calculates if a company is on track with annual estimates based on quarterly performance.
 * @param {Array} income_statement_quarterly - Array of quarterly income statements.
 * @param {Array} analyst_estimates_annual - Array of annual analyst estimates.
 * @returns {object} An object containing the performance ratio.
 */
function _calculateQuarterlyPerformance(income_statement_quarterly, analyst_estimates_annual) {
    const result = { performanceRatio: null, reportedQuarters: 0 };
    if (!income_statement_quarterly || income_statement_quarterly.length < 5 || !analyst_estimates_annual || analyst_estimates_annual.length === 0) {
        return result;
    }

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-11
    
    // Find the full-year estimate for the current year
    const annualEstimate = analyst_estimates_annual.find(e => parseInt(e.date.substring(0, 4)) === currentYear);
    if (!annualEstimate || !annualEstimate.epsAvg) {
        return result;
    }
    const annualEpsEstimate = annualEstimate.epsAvg;

    // Group historical quarterly EPS by year
    const historicalData = {};
    income_statement_quarterly.slice().reverse().forEach(q => {
        const year = parseInt(q.calendarYear);
        if (year < currentYear) {
            if (!historicalData[year]) {
                historicalData[year] = { q1: 0, q2: 0, q3: 0, q4: 0, total: 0 };
            }
            const quarter = parseInt(q.period.substring(1));
            historicalData[year][`q${quarter}`] = q.eps;
            historicalData[year].total += q.eps;
        }
    });

    // Calculate average historical weights for each quarter
    const weights = { q1: [], q2: [], q3: [], q4: [] };
    let validYears = 0;
    for (const year in historicalData) {
        const yearData = historicalData[year];
        if (yearData.total > 0 && yearData.q1 && yearData.q2 && yearData.q3 && yearData.q4) {
             validYears++;
             weights.q1.push(yearData.q1 / yearData.total);
             weights.q2.push(yearData.q2 / yearData.total);
             weights.q3.push(yearData.q3 / yearData.total);
             weights.q4.push(yearData.q4 / yearData.total);
        }
    }

    if (validYears < 1) return result; // Need at least one full historical year

    const avgWeights = {
        q1: weights.q1.reduce((a, b) => a + b, 0) / weights.q1.length,
        q2: weights.q2.reduce((a, b) => a + b, 0) / weights.q2.length,
        q3: weights.q3.reduce((a, b) => a + b, 0) / weights.q3.length,
        q4: weights.q4.reduce((a, b) => a + b, 0) / weights.q4.length,
    };
    
    // Find reported quarters for the current year
    const currentYearQuarters = income_statement_quarterly.filter(q => parseInt(q.calendarYear) === currentYear);
    if (currentYearQuarters.length === 0) return result;
    
    result.reportedQuarters = currentYearQuarters.length;

    // Calculate target and actual EPS for the reported period
    let targetEpsSum = 0;
    let actualEpsSum = 0;
    
    currentYearQuarters.forEach(q => {
        const quarter = parseInt(q.period.substring(1));
        targetEpsSum += avgWeights[`q${quarter}`] * annualEpsEstimate;
        actualEpsSum += q.eps;
    });

    if (targetEpsSum === 0) return result;
    
    result.performanceRatio = actualEpsSum / targetEpsSum;
    return result;
}


/**
 * Calculates metrics for the GARP Scorecard dashboard.
 * @param {object} data - The full FMP data object for a stock.
 * @returns {object} An object containing GARP metrics with their values and pass/fail status.
 */
export function _calculateGarpScorecardMetrics(data) {
    if (!data || !Array.isArray(data.income_statement_annual)) {
        console.error("Invalid or incomplete data passed to _calculateGarpScorecardMetrics. Skipping.", data);
        return { garpConvictionScore: 'ERR' };
    }
    
    const overrides = data.manualOverrides || {};
    const profile = data.profile?.[0] || {};
    const income = data.income_statement_annual.slice().reverse();
    const metricsTtm = data.key_metrics_ttm?.[0] || {};
    const ratiosTtm = data.ratios_ttm?.[0] || {};
    const estimates = data.analyst_estimates || [];
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
    const latestIncome = income[lastIndex] || {};

    const eps5y = overrides.eps_growth_5y ?? (income.length >= 6 ? getCagr(income[startIndex].eps, income[lastIndex].eps, 5) : null);
    const rev5y = overrides.rev_growth_5y ?? (income.length >= 6 ? getCagr(income[startIndex].revenue, income[lastIndex].revenue, 5) : null);
    
    const roe = overrides.roe ?? metricsTtm.roe ?? latestAnnualMetrics.roe;
    const roic = overrides.roic ?? metricsTtm.roic ?? latestAnnualMetrics.roic;
    const de = overrides.de ?? metricsTtm.debtToEquity ?? latestAnnualMetrics.debtToEquity;
    const pe = overrides.pe_ttm ?? metricsTtm.peRatioTTM ?? latestAnnualMetrics.peRatio;
    const psRatio = overrides.ps_ratio ?? ratiosTtm.priceToSalesRatioTTM ?? latestAnnualRatios.priceToSalesRatio;

    // --- FIX: Find the correct forward-looking estimate ---
    const currentYear = new Date().getFullYear();
    const forwardEstimate = Array.isArray(estimates) ? estimates.find(est => parseInt(est.date.substring(0, 4)) === currentYear) : null;

    const lastActualEps = income.length > 0 ? income[lastIndex].eps : null;
    const forwardEpsForGrowth = forwardEstimate ? forwardEstimate.epsAvg : null;
    const epsNext1y = overrides.eps_growth_next_1y ?? (lastActualEps > 0 && forwardEpsForGrowth ? (forwardEpsForGrowth / lastActualEps) - 1 : null);

    const currentPrice = profile.price;
    const forwardPe = overrides.forward_pe ?? (currentPrice > 0 && forwardEpsForGrowth > 0 ? currentPrice / forwardEpsForGrowth : null);
    
    const peg = overrides.peg ?? (forwardPe > 0 && epsNext1y > 0 ? forwardPe / (epsNext1y * 100) : null);

    const fcfPerShareTtm = metricsTtm.freeCashFlowPerShareTTM;
    const pfcf = overrides.pfcf ?? (currentPrice > 0 && fcfPerShareTtm > 0 ? currentPrice / fcfPerShareTtm : null);
    
    const interestCoverageCalc = () => {
        if (latestIncome.operatingIncome && latestIncome.interestExpense > 0) return latestIncome.operatingIncome / latestIncome.interestExpense;
        if (latestIncome.operatingIncome > 0 && latestIncome.interestExpense <= 0) return 999;
        return null;
    };
    const interestCoverage = overrides.interest_coverage ?? interestCoverageCalc();
    
    const consistency = _calculateConsistencyMetrics(income);
    const profitableYears = overrides.profitable_yrs ?? consistency.profitableYears;
    const quarterlyPerformance = _calculateQuarterlyPerformance(data.income_statement_quarterly, data.analyst_estimates);

    // --- METRICS DEFINITION (Rebalanced Weights) ---
    const metrics = {
        // -- Growth (25%)
        'EPS Growth (Next 1Y)': { value: epsNext1y, format: 'percent', weight: 12 },
        'EPS Growth (5Y)': { value: eps5y, format: 'percent', weight: 8 },
        'Revenue Growth (5Y)': { value: rev5y, format: 'percent', weight: 5 },
        // -- Quality & Stability (35%)
        'Return on Invested Capital': { value: roic, format: 'percent', weight: 10 },
        'Return on Equity': { value: roe, format: 'percent', weight: 8 },
        'Quarterly Earnings Progress': { value: quarterlyPerformance.performanceRatio, format: 'ratio', weight: 8 },
        'Profitable Yrs (5Y)': { value: profitableYears, format: 'number', weight: 6 },
        'Rev. Growth Stability': { value: consistency.revenueGrowthStdDev, format: 'decimal', weight: 3 },
        // -- Financial Health (10%)
        'Debt-to-Equity': { value: de, format: 'decimal', weight: 5 },
        'Interest Coverage': { value: interestCoverage, format: 'decimal', weight: 5 },
        // -- Valuation (30%)
        'PEG Ratio': { value: peg, format: 'decimal', weight: 10 },
        'Forward P/E': { value: forwardPe, format: 'decimal', weight: 8 },
        'Price to FCF': { value: pfcf, format: 'decimal', weight: 7 },
        'P/S Ratio': { value: psRatio, format: 'decimal', weight: 5 },
        // -- For AI Prompt Compatibility (No Weight)
        'P/E (TTM)': { value: pe, format: 'decimal' },
    };

    // --- CONVICTION SCORE CALCULATION ---
    let weightedScore = 0;
    let totalWeight = 0;

    for (const key in metrics) {
        const metric = metrics[key];
        const multiplier = _getMetricScoreMultiplier(key, metric.value);

        if (metric.weight) { // Only include weighted metrics in the score
            totalWeight += metric.weight;
            weightedScore += metric.weight * multiplier;
        }
        
        metric.isMet = multiplier >= 1.0;
        metric.multiplier = multiplier;
        metric.interpretation = _getMetricInterpretation(key, metric.value);
    }

    const rawScore = (weightedScore / totalWeight) * 100;
    
    metrics.garpConvictionScore = Math.round(Math.min(100, rawScore) || 0);
    
    return metrics;
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

export const CALCULATION_SUMMARIES = {
    'QarpAnalysis': 'Performs a "Quality at a Reasonable Price" (QARP) analysis. This report uses the same underlying data as the GARP Scorecard but instructs the AI to synthesize it through a different lens, focusing on the critical balance between business quality (measured by ROE, ROIC, D/E) and valuation (measured by P/E, PEG, P/FCF).',
    'MoatAnalysis': 'Assesses a company\'s competitive advantage ("moat") by calculating 10-year historical trends for key quality metrics like Return on Invested Capital (ROIC), profitability margins (net, operating, gross), and reinvestment rates (e.g., CapEx, R&D expenses).',
    'CapitalAllocators': 'Evaluates management\'s effectiveness by analyzing historical data on how they prioritize cash flow (e.g., CapEx vs. buybacks), the effectiveness of their investments (ROIC trends), their acquisition history (goodwill), and how they return capital to shareholders (dividends and buybacks).',
    'InvestmentMemo': 'This report does not perform new calculations. Instead, it synthesizes the existing "GARP Candidacy Report" and the "GARP Scorecard" data into a formal, thesis-driven investment memo.',
    'GarpCandidacy': 'Calculates a 10-point GARP scorecard, checking key metrics like EPS & Revenue Growth, Profitability (ROE, ROIC), and Valuation (P/E, PEG, P/S, D/E) against predefined thresholds to determine if a stock qualifies as a GARP candidate.',
    'PositionAnalysis': 'This report does not perform new calculations. It uses the previously generated "GARP Candidacy Report" as the original investment thesis and compares it against the user\'s specific position details (cost basis, shares) and the current market price.',
    'PortfolioGarpAnalysis': 'This report aggregates the pre-calculated GARP scorecards for every stock currently in the user\'s "Portfolio" status. It then prepares this aggregated data for an AI to analyze.',
    'PeerComparison': 'This section uses AI to identify a company\'s top publicly traded competitors. It then fetches key financial metrics for both the primary company and the peer group, calculating the average for each metric. The "Premium / (Discount)" column shows how the primary company\'s metric compares to the peer average. A negative percentage (discount) is generally better for valuation ratios like P/E, while a positive percentage (premium) is better for performance ratios like ROE.',
    'GarpConvictionScore': 'The GARP Conviction Score is a proprietary metric calculated out of 100, designed to provide a nuanced view of a company\'s quality. Instead of a simple pass/fail, it uses a scaled scoring system. Each of the 10 GARP criteria (covering Growth, Profitability, and Valuation) is graded on its performance, earning a score multiplier (e.g., 0x for poor, 1.0x for good, 1.2x for exceptional). The final score is the weighted sum of these graded results, providing a more precise measure of a company\'s alignment with the GARP strategy.',
    'SectorMomentum': 'This report fetches historical sector performance data from the FMP API, which provides a cumulative year-to-date return for each day. It then calculates the 1-month and 3-month performance by comparing the most recent cumulative figure against the figures from one and three months prior. The Year-to-Date (YTD) figure is the latest cumulative performance data available. The AI then summarizes these trends to identify market leaders and laggards.'
};

/**
 * Extracts key conclusions from memo reports using targeted regular expressions.
 * @param {string} reportContent The text content of the memo.
 * @param {string} reportType The type of the memo ('InvestmentMemo', 'QarpAnalysis', etc.).
 * @returns {object} A structured object with the extracted conclusions.
 */
export function _extractMemoConclusions(reportContent, reportType) {
    const getMatch = (patterns, content) => {
        for (const pattern of patterns) {
            const match = content.match(pattern);
            if (match && match[1]) {
                return match[1].replace(/["*]/g, '').trim();
            }
        }
        return 'Not Found';
    };

    let patterns;
    switch (reportType) {
        case 'InvestmentMemo':
            patterns = [
                /### Recommendation\s*\n\s*\*{0,2}(.*?)\*{0,2}(?=\n)/si,
                /Recommendation\s*\n\s*\*{0,2}(.*?)\*{0,2}/si
            ];
            return { recommendation: getMatch(patterns, reportContent) };

        case 'QarpAnalysis':
            patterns = [
                /verdict:.*?appears to be a \*\*(.*?)\*\*/si,
                /classified as a \*\*(.*?)\*\*/si
            ];
            return { finalVerdict: getMatch(patterns, reportContent) };

        case 'LongTermCompounder':
            patterns = [
                /classifications:.*?\*\*(.*?)\*\*/si,
                /classified as a \*\*(.*?)\*\*/si
            ];
            return { finalVerdict: getMatch(patterns, reportContent) };

        case 'BmqvMemo':
            patterns = [
                /classifications:.*?\*\*(.*?)\*\*/si,
                /classified as \*\*(.*?)\*\*/si,
                /final verdict is \*\*(.*?)\*\*/si
            ];
            return { finalVerdict: getMatch(patterns, reportContent) };
            
        default:
            return null;
    }
}
    ];
    const tier = tiers.find(t => Math.abs(num) >= t.value);
    if (tier) {
        const formattedNum = (num / tier.value).toFixed(precision);
        return `${formattedNum}${tier.suffix}`;
    }
    return num.toFixed(precision);
}

/**
 * Analyzes a metric's value against GARP criteria to provide a qualitative interpretation.
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
            if (value < 12) return { category: 'Potentially Undervalued', text: 'Appears very cheap, but this could be a red flag. Requires deep investigation to ensure it isn\'t cheap for a good reason.' };
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

        case 'Price to FCF':
            if (value < 15) return { category: 'Potentially Undervalued', text: 'The market price appears low relative to the company\'s ability to generate cash, a strong sign of value.' };
            if (value < 25) return { category: 'Reasonable Price', text: 'A healthy valuation that suggests the market price is not excessive relative to the company\'s cash flow.' };
            return { category: 'Expensive', text: 'The stock is trading at a high multiple of its cash flow, suggesting high expectations are priced in.' };
        
        case 'Interest Coverage':
             if (value > 10) return { category: 'Very Safe', text: 'Earnings cover interest payments many times over, indicating extremely low financial risk from debt.' };
             if (value > 4) return { category: 'Healthy', text: 'The company generates ample earnings to comfortably service its debt obligations.' };
             if (value > 2) return { category: 'Adequate', text: 'Coverage is acceptable, but a significant downturn in earnings could create pressure.' };
             return { category: 'High Risk', text: 'Earnings may not be sufficient to cover interest payments, a major red flag for financial distress.' };

        case 'Profitable Yrs (5Y)':
            if (value === 5) return { category: 'Highly Consistent', text: 'A perfect track record of profitability, indicating a durable and resilient business model.' };
            if (value === 4) return { category: 'Consistent', text: 'A strong track record of profitability with only a minor blip, suggesting business strength.' };
            return { category: 'Inconsistent', text: 'The company has struggled with consistent profitability, signaling higher operational or cyclical risk.' };

        case 'Rev. Growth Stability':
            if (value < 0.10) return { category: 'Highly Stable', text: 'Revenue growth is very consistent, indicating a predictable business with a strong competitive position.' };
            if (value < 0.25) return { category: 'Stable', text: 'Revenue growth is relatively stable, suggesting a reliable business model.' };
            return { category: 'Volatile', text: 'Revenue growth is erratic and unpredictable, which may point to cyclicality or competitive pressures.' };

        case 'Quarterly Earnings Progress':
            if (value > 1.15) return { category: 'Exceptional Beat', text: 'The company is significantly outperforming its seasonally-adjusted earnings targets for the year.' };
            if (value > 1.0) return { category: 'Beating Estimates', text: 'The company is currently ahead of its seasonally-adjusted earnings estimates for the year.' };
            if (value > 0.95) return { category: 'On Track', text: 'The company is meeting its seasonally-adjusted earnings targets for the year.' };
            if (value > 0.85) return { category: 'Lagging', text: 'The company is slightly behind its seasonally-adjusted earnings targets, which warrants monitoring.' };
            return { category: 'Significantly Behind', text: 'The company is substantially underperforming its earnings estimates, a potential red flag.' };

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
            if (value > 1.0) return 0.5;    // Rebound Growth > 100% (Partial Credit)
            if (value > 0.40) return 0.8;    // Suspicious Growth 40%-100% (Reduced Credit)
            if (value > 0.20) return 1.2;    // Exceptional Growth 20%-40% (Bonus)
            if (value > 0.10) return 1.0;    // Strong Growth 10%-20% (Full Credit)
            if (value > 0.05) return 0.5;    // Modest Growth 5%-10% (Partial Credit)
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

        case 'Price to FCF':
            if (value <= 0) return 0;
            if (value < 15) return 1.2;
            if (value < 25) return 1.0;
            if (value < 40) return 0.5;
            return 0;
        
        case 'Debt-to-Equity':
            if (value < 0.3) return 1.2;
            if (value < 0.7) return 1.0;
            if (value < 1.0) return 0.5;
            return 0;

        case 'Interest Coverage':
            if (value > 10) return 1.2;
            if (value > 4) return 1.0;
            if (value > 2) return 0.5;
            return 0;
        
        case 'Profitable Yrs (5Y)':
            if (value === 5) return 1.2;
            if (value === 4) return 1.0;
            if (value === 3) return 0.5;
            return 0;
        
        case 'Rev. Growth Stability': // Lower is better
            if (value < 0.10) return 1.2;
            if (value < 0.25) return 1.0;
            if (value < 0.40) return 0.5;
            return 0;
        
        case 'Quarterly Earnings Progress':
             if (value > 1.15) return 1.2; // Exceptional Beat
             if (value > 1.0) return 1.1; // Beating Estimates (slight bonus)
             if (value > 0.95) return 1.0; // On Track
             if (value > 0.85) return 0.5; // Lagging
             return 0; // Significantly Behind

        default:
            return 0;
    }
}

/**
 * Calculates consistency metrics based on 5-year historical data.
 * @param {Array} income_statements - Array of annual income statement objects from FMP.
 * @returns {object} An object containing profitable years count and revenue growth standard deviation.
 */
function _calculateConsistencyMetrics(income_statements) {
    const result = { profitableYears: null, revenueGrowthStdDev: null };
    if (!income_statements || income_statements.length < 5) return result;

    const recent_statements = income_statements.slice(-5);

    // 1. Calculate Profitable Years
    result.profitableYears = recent_statements.filter(stmt => stmt.eps > 0).length;

    // 2. Calculate Revenue Growth Stability (Standard Deviation)
    const growthRates = [];
    for (let i = 1; i < recent_statements.length; i++) {
        const prevRevenue = recent_statements[i-1].revenue;
        const currRevenue = recent_statements[i].revenue;
        if (prevRevenue > 0) {
            growthRates.push((currRevenue / prevRevenue) - 1);
        }
    }
    
    if (growthRates.length > 1) {
        const mean = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;
        const variance = growthRates.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / growthRates.length;
        result.revenueGrowthStdDev = Math.sqrt(variance);
    }

    return result;
}

/**
 * Calculates if a company is on track with annual estimates based on quarterly performance.
 * @param {Array} income_statement_quarterly - Array of quarterly income statements.
 * @param {Array} analyst_estimates_annual - Array of annual analyst estimates.
 * @returns {object} An object containing the performance ratio.
 */
function _calculateQuarterlyPerformance(income_statement_quarterly, analyst_estimates_annual) {
    const result = { performanceRatio: null, reportedQuarters: 0 };
    if (!income_statement_quarterly || income_statement_quarterly.length < 5 || !analyst_estimates_annual || analyst_estimates_annual.length === 0) {
        return result;
    }

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-11
    
    // Find the full-year estimate for the current year
    const annualEstimate = analyst_estimates_annual.find(e => parseInt(e.date.substring(0, 4)) === currentYear);
    if (!annualEstimate || !annualEstimate.epsAvg) {
        return result;
    }
    const annualEpsEstimate = annualEstimate.epsAvg;

    // Group historical quarterly EPS by year
    const historicalData = {};
    income_statement_quarterly.slice().reverse().forEach(q => {
        const year = parseInt(q.calendarYear);
        if (year < currentYear) {
            if (!historicalData[year]) {
                historicalData[year] = { q1: 0, q2: 0, q3: 0, q4: 0, total: 0 };
            }
            const quarter = parseInt(q.period.substring(1));
            historicalData[year][`q${quarter}`] = q.eps;
            historicalData[year].total += q.eps;
        }
    });

    // Calculate average historical weights for each quarter
    const weights = { q1: [], q2: [], q3: [], q4: [] };
    let validYears = 0;
    for (const year in historicalData) {
        const yearData = historicalData[year];
        if (yearData.total > 0 && yearData.q1 && yearData.q2 && yearData.q3 && yearData.q4) {
             validYears++;
             weights.q1.push(yearData.q1 / yearData.total);
             weights.q2.push(yearData.q2 / yearData.total);
             weights.q3.push(yearData.q3 / yearData.total);
             weights.q4.push(yearData.q4 / yearData.total);
        }
    }

    if (validYears < 1) return result; // Need at least one full historical year

    const avgWeights = {
        q1: weights.q1.reduce((a, b) => a + b, 0) / weights.q1.length,
        q2: weights.q2.reduce((a, b) => a + b, 0) / weights.q2.length,
        q3: weights.q3.reduce((a, b) => a + b, 0) / weights.q3.length,
        q4: weights.q4.reduce((a, b) => a + b, 0) / weights.q4.length,
    };
    
    // Find reported quarters for the current year
    const currentYearQuarters = income_statement_quarterly.filter(q => parseInt(q.calendarYear) === currentYear);
    if (currentYearQuarters.length === 0) return result;
    
    result.reportedQuarters = currentYearQuarters.length;

    // Calculate target and actual EPS for the reported period
    let targetEpsSum = 0;
    let actualEpsSum = 0;
    
    currentYearQuarters.forEach(q => {
        const quarter = parseInt(q.period.substring(1));
        targetEpsSum += avgWeights[`q${quarter}`] * annualEpsEstimate;
        actualEpsSum += q.eps;
    });

    if (targetEpsSum === 0) return result;
    
    result.performanceRatio = actualEpsSum / targetEpsSum;
    return result;
}


/**
 * Calculates metrics for the GARP Scorecard dashboard.
 * @param {object} data - The full FMP data object for a stock.
 * @returns {object} An object containing GARP metrics with their values and pass/fail status.
 */
export function _calculateGarpScorecardMetrics(data) {
    if (!data || !Array.isArray(data.income_statement_annual)) {
        console.error("Invalid or incomplete data passed to _calculateGarpScorecardMetrics. Skipping.", data);
        return { garpConvictionScore: 'ERR' };
    }
    
    const overrides = data.manualOverrides || {};
    const profile = data.profile?.[0] || {};
    const income = data.income_statement_annual.slice().reverse();
    const metricsTtm = data.key_metrics_ttm?.[0] || {};
    const ratiosTtm = data.ratios_ttm?.[0] || {};
    const estimates = data.analyst_estimates || [];
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
    const latestIncome = income[lastIndex] || {};

    const eps5y = overrides.eps_growth_5y ?? (income.length >= 6 ? getCagr(income[startIndex].eps, income[lastIndex].eps, 5) : null);
    const rev5y = overrides.rev_growth_5y ?? (income.length >= 6 ? getCagr(income[startIndex].revenue, income[lastIndex].revenue, 5) : null);
    
    const roe = overrides.roe ?? metricsTtm.roe ?? latestAnnualMetrics.roe;
    const roic = overrides.roic ?? metricsTtm.roic ?? latestAnnualMetrics.roic;
    const de = overrides.de ?? metricsTtm.debtToEquity ?? latestAnnualMetrics.debtToEquity;
    const pe = overrides.pe_ttm ?? metricsTtm.peRatioTTM ?? latestAnnualMetrics.peRatio;
    const psRatio = overrides.ps_ratio ?? ratiosTtm.priceToSalesRatioTTM ?? latestAnnualRatios.priceToSalesRatio;

    // --- FIX: Find the correct forward-looking estimate ---
    const currentYear = new Date().getFullYear();
    const forwardEstimate = Array.isArray(estimates) ? estimates.find(est => parseInt(est.date.substring(0, 4)) === currentYear) : null;

    const lastActualEps = income.length > 0 ? income[lastIndex].eps : null;
    const forwardEpsForGrowth = forwardEstimate ? forwardEstimate.epsAvg : null;
    const epsNext1y = overrides.eps_growth_next_1y ?? (lastActualEps > 0 && forwardEpsForGrowth ? (forwardEpsForGrowth / lastActualEps) - 1 : null);

    const currentPrice = profile.price;
    const forwardPe = overrides.forward_pe ?? (currentPrice > 0 && forwardEpsForGrowth > 0 ? currentPrice / forwardEpsForGrowth : null);
    
    const peg = overrides.peg ?? (forwardPe > 0 && epsNext1y > 0 ? forwardPe / (epsNext1y * 100) : null);

    const fcfPerShareTtm = metricsTtm.freeCashFlowPerShareTTM;
    const pfcf = overrides.pfcf ?? (currentPrice > 0 && fcfPerShareTtm > 0 ? currentPrice / fcfPerShareTtm : null);
    
    const interestCoverageCalc = () => {
        if (latestIncome.operatingIncome && latestIncome.interestExpense > 0) return latestIncome.operatingIncome / latestIncome.interestExpense;
        if (latestIncome.operatingIncome > 0 && latestIncome.interestExpense <= 0) return 999;
        return null;
    };
    const interestCoverage = overrides.interest_coverage ?? interestCoverageCalc();
    
    const consistency = _calculateConsistencyMetrics(income);
    const profitableYears = overrides.profitable_yrs ?? consistency.profitableYears;
    const quarterlyPerformance = _calculateQuarterlyPerformance(data.income_statement_quarterly, data.analyst_estimates);

    // --- METRICS DEFINITION (Rebalanced Weights) ---
    const metrics = {
        // -- Growth (25%)
        'EPS Growth (Next 1Y)': { value: epsNext1y, format: 'percent', weight: 12 },
        'EPS Growth (5Y)': { value: eps5y, format: 'percent', weight: 8 },
        'Revenue Growth (5Y)': { value: rev5y, format: 'percent', weight: 5 },
        // -- Quality & Stability (35%)
        'Return on Invested Capital': { value: roic, format: 'percent', weight: 10 },
        'Return on Equity': { value: roe, format: 'percent', weight: 8 },
        'Quarterly Earnings Progress': { value: quarterlyPerformance.performanceRatio, format: 'ratio', weight: 8 },
        'Profitable Yrs (5Y)': { value: profitableYears, format: 'number', weight: 6 },
        'Rev. Growth Stability': { value: consistency.revenueGrowthStdDev, format: 'decimal', weight: 3 },
        // -- Financial Health (10%)
        'Debt-to-Equity': { value: de, format: 'decimal', weight: 5 },
        'Interest Coverage': { value: interestCoverage, format: 'decimal', weight: 5 },
        // -- Valuation (30%)
        'PEG Ratio': { value: peg, format: 'decimal', weight: 10 },
        'Forward P/E': { value: forwardPe, format: 'decimal', weight: 8 },
        'Price to FCF': { value: pfcf, format: 'decimal', weight: 7 },
        'P/S Ratio': { value: psRatio, format: 'decimal', weight: 5 },
        // -- For AI Prompt Compatibility (No Weight)
        'P/E (TTM)': { value: pe, format: 'decimal' },
    };

    // --- CONVICTION SCORE CALCULATION ---
    let weightedScore = 0;
    let totalWeight = 0;

    for (const key in metrics) {
        const metric = metrics[key];
        const multiplier = _getMetricScoreMultiplier(key, metric.value);

        if (metric.weight) { // Only include weighted metrics in the score
            totalWeight += metric.weight;
            weightedScore += metric.weight * multiplier;
        }
        
        metric.isMet = multiplier >= 1.0;
        metric.multiplier = multiplier;
        metric.interpretation = _getMetricInterpretation(key, metric.value);
    }

    const rawScore = (weightedScore / totalWeight) * 100;
    
    metrics.garpConvictionScore = Math.round(Math.min(100, rawScore) || 0);
    
    return metrics;
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

export const CALCULATION_SUMMARIES = {
    'QarpAnalysis': 'Performs a "Quality at a Reasonable Price" (QARP) analysis. This report uses the same underlying data as the GARP Scorecard but instructs the AI to synthesize it through a different lens, focusing on the critical balance between business quality (measured by ROE, ROIC, D/E) and valuation (measured by P/E, PEG, P/FCF).',
    'MoatAnalysis': 'Assesses a company\'s competitive advantage ("moat") by calculating 10-year historical trends for key quality metrics like Return on Invested Capital (ROIC), profitability margins (net, operating, gross), and reinvestment rates (e.g., CapEx, R&D expenses).',
    'CapitalAllocators': 'Evaluates management\'s effectiveness by analyzing historical data on how they prioritize cash flow (e.g., CapEx vs. buybacks), the effectiveness of their investments (ROIC trends), their acquisition history (goodwill), and how they return capital to shareholders (dividends and buybacks).',
    'InvestmentMemo': 'This report does not perform new calculations. Instead, it synthesizes the existing "GARP Candidacy Report" and the "GARP Scorecard" data into a formal, thesis-driven investment memo.',
    'GarpCandidacy': 'Calculates a 10-point GARP scorecard, checking key metrics like EPS & Revenue Growth, Profitability (ROE, ROIC), and Valuation (P/E, PEG, P/S, D/E) against predefined thresholds to determine if a stock qualifies as a GARP candidate.',
    'PositionAnalysis': 'This report does not perform new calculations. It uses the previously generated "GARP Candidacy Report" as the original investment thesis and compares it against the user\'s specific position details (cost basis, shares) and the current market price.',
    'PortfolioGarpAnalysis': 'This report aggregates the pre-calculated GARP scorecards for every stock currently in the user\'s "Portfolio" status. It then prepares this aggregated data for an AI to analyze.',
    'PeerComparison': 'This section uses AI to identify a company\'s top publicly traded competitors. It then fetches key financial metrics for both the primary company and the peer group, calculating the average for each metric. The "Premium / (Discount)" column shows how the primary company\'s metric compares to the peer average. A negative percentage (discount) is generally better for valuation ratios like P/E, while a positive percentage (premium) is better for performance ratios like ROE.',
    'GarpConvictionScore': 'The GARP Conviction Score is a proprietary metric calculated out of 100, designed to provide a nuanced view of a company\'s quality. Instead of a simple pass/fail, it uses a scaled scoring system. Each of the 10 GARP criteria (covering Growth, Profitability, and Valuation) is graded on its performance, earning a score multiplier (e.g., 0x for poor, 1.0x for good, 1.2x for exceptional). The final score is the weighted sum of these graded results, providing a more precise measure of a company\'s alignment with the GARP strategy.',
    'SectorMomentum': 'This report fetches historical sector performance data from the FMP API, which provides a cumulative year-to-date return for each day. It then calculates the 1-month and 3-month performance by comparing the most recent cumulative figure against the figures from one and three months prior. The Year-to-Date (YTD) figure is the latest cumulative performance data available. The AI then summarizes these trends to identify market leaders and laggards.'
};
