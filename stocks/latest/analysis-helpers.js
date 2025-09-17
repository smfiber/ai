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
 * Calculates a summary of metrics for the "Undervalued Analysis" prompt.
 * @param {object} data - The full FMP data object for a stock.
 * @returns {object} A summary object with pre-calculated metrics.
 */
export function _calculateUndervaluedMetrics(data) {
    const profile = data.profile?.[0] || {};
    const incomeStatements = (data.income_statement_annual || []).slice().reverse(); // Oldest to newest
    const keyMetrics = (data.key_metrics_annual || []).slice().reverse(); // Oldest to newest
    const cashFlows = (data.cash_flow_statement_annual || []).slice().reverse();
    const ratios = (data.ratios_annual || []).slice().reverse(); // Oldest to newest

    // MODIFICATION: Prioritize TTM data for latest metrics. Fall back to annual if TTM is not available.
    const latestMetrics = data.key_metrics_ttm?.[0] || keyMetrics[keyMetrics.length - 1] || {};
    const latestCashFlow = cashFlows[cashFlows.length - 1] || {};
    const latestRatios = data.ratios_ttm?.[0] || ratios[ratios.length - 1] || {};
    
    // Helper to calculate YoY Growth
    const calculateYoyGrowth = (data, key) => {
        const trends = [];
        for (let i = 1; i < data.length; i++) {
            const prev = data[i - 1][key];
            const curr = data[i][key];
            if (prev && curr && prev !== 0) {
                const growth = ((curr - prev) / prev) * 100;
                trends.push({ year: data[i].calendarYear, growth: `${growth.toFixed(2)}%` });
            }
        }
        return trends.slice(-6); // Last 6 years of growth
    };

    // Helper to get last N years of a metric
    const getTrend = (data, key1, key2, formatFn) => {
        return data.slice(-6).map(d => ({ year: d.calendarYear, value: formatFn(d[key1] ?? d[key2]) }));
    };
    
    // Helper to calculate historical average
    const calculateAverage = (data, key) => {
        const values = data.slice(-5).map(d => d[key]).filter(v => typeof v === 'number');
        if (values.length === 0) return null;
        return values.reduce((a, b) => a + b, 0) / values.length;
    };

    // 1. Growth & Profitability
    const revenueGrowthTrend = calculateYoyGrowth(incomeStatements, 'revenue');
    const profitabilityTrend = getTrend(ratios, 'netProfitMargin', null, v => typeof v === 'number' ? `${(v * 100).toFixed(2)}%` : 'N/A');

    // 2. Financial Health
    const roeTrend = getTrend(keyMetrics, 'roe', 'returnOnEquity', v => typeof v === 'number' ? `${(v * 100).toFixed(2)}%` : 'N/A');
    const debtToEquity = latestMetrics.debtToEquity ? latestMetrics.debtToEquity.toFixed(2) : 'Data not available';
    
    // 3. Dividend Analysis
    // MODIFICATION: Use TTM dividend yield first, then fall back to annual.
    const dividendYieldValue = latestRatios.dividendYieldTTM ?? latestRatios.dividendYield;
    const dividendYield = dividendYieldValue ? `${(dividendYieldValue * 100).toFixed(2)}%` : 'N/A';
    let cashFlowPayoutRatio = 'N/A';
    if (latestCashFlow.operatingCashFlow && latestCashFlow.dividendsPaid) {
        if (latestCashFlow.operatingCashFlow > 0) {
            const ratio = (Math.abs(latestCashFlow.dividendsPaid) / latestCashFlow.operatingCashFlow) * 100;
            cashFlowPayoutRatio = `${ratio.toFixed(2)}%`;
        }
    }

    // 4. Valuation Multiples
    // MODIFICATION: Prioritize TTM valuation metrics.
    const peRatio = latestMetrics.peRatioTTM ?? latestMetrics.peRatio;
    const psRatio = latestRatios.priceToSalesRatioTTM ?? latestRatios.priceToSalesRatio;
    const pbRatio = latestRatios.priceToBookRatioTTM ?? latestRatios.priceToBookRatio;

    // 5. Valuation in Context
    const historicalPe = calculateAverage(keyMetrics, 'peRatio');
    const historicalPs = calculateAverage(ratios, 'priceToSalesRatio');
    const historicalPb = calculateAverage(ratios, 'priceToBookRatio');

    const valuationRelativeToHistory = {
        pe: {
            current: peRatio ? peRatio.toFixed(2) : 'N/A',
            historicalAverage: historicalPe ? historicalPe.toFixed(2) : 'N/A',
            status: historicalPe && peRatio ? (peRatio > historicalPe ? 'Premium' : 'Discount') : 'N/A'
        },
        ps: {
            current: psRatio ? psRatio.toFixed(2) : 'N/A',
            historicalAverage: historicalPs ? historicalPs.toFixed(2) : 'N/A',
            status: historicalPs && psRatio ? (psRatio > historicalPs ? 'Premium' : 'Discount') : 'N/A'
        },
        pb: {
            current: pbRatio ? pbRatio.toFixed(2) : 'N/A',
            historicalAverage: historicalPb ? historicalPb.toFixed(2) : 'N/A',
            status: historicalPb && pbRatio ? (pbRatio > pbRatio ? 'Premium' : 'Discount') : 'N/A'
        }
    };
    
    // 6. Graham Number
    const grahamNumber = latestMetrics.grahamNumber;
    const currentPrice = profile.price;
    let grahamVerdict = 'N/A';
    if (grahamNumber && currentPrice) {
        grahamVerdict = currentPrice < grahamNumber ? 'UNDERVALUED' : 'OVERVALUED';
    }

    // 7. Analyst Consensus & Estimates
    const analystConsensus = (data.stock_grade_news || []).slice(0, 5).map(g => `${g.gradingCompany}: ${g.newGrade}`).join(', ');
    const latestEstimate = (data.analyst_estimates || []).find(e => new Date(e.date).getFullYear() === new Date().getFullYear() + 1);

    return {
        summary: {
            industry: profile.industry || 'N/A',
        },
        revenueGrowthTrend,
        profitabilityTrend,
        roeTrend,
        debtToEquity,
        dividendYield,
        cashFlowPayoutRatio,
        peRatio: peRatio ? peRatio.toFixed(2) : 'Not applicable (e.g. negative earnings)',
        psRatio: psRatio ? psRatio.toFixed(2) : 'N/A',
        pbRatio: pbRatio ? pbRatio.toFixed(2) : 'N/A',
        valuationRelativeToHistory,
        grahamNumberAnalysis: {
            grahamNumber: grahamNumber ? grahamNumber.toFixed(2) : 'N/A',
            currentPrice: currentPrice || 'N/A',
            verdict: grahamVerdict
        },
        analystConsensus: analystConsensus || 'No recent ratings.',
        analystEstimatesSummary: latestEstimate ? `Avg. estimated revenue for next year is ${formatLargeNumber(latestEstimate.estimatedRevenueAvg)}.` : 'No estimates available.'
    };
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

    // MODIFICATION: Prioritize TTM data.
    const latestIncome = incomeStatements[incomeStatements.length - 1] || {};
    const latestMetrics = data.key_metrics_ttm?.[0] || keyMetrics[keyMetrics.length - 1] || {};
    const latestCashFlow = cashFlows[cashFlows.length - 1] || {};
    const latestRatios = data.ratios_ttm?.[0] || ratios[ratios.length - 1] || {};

    // 2.5 Quarterly Performance Calculations
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

    // MODIFICATION: Prioritize TTM ROE.
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
 * NEW: Calculates metrics for the "Bull Vs Bear" prompt.
 */
export function _calculateBullVsBearMetrics(data) {
    const income = (data.income_statement_annual || []).slice(0, 5);
    const metrics = (data.key_metrics_annual || []).slice(0, 5);
    const cashFlow = (data.cash_flow_statement_annual || []).slice(0, 5);
    const grades = (data.stock_grade_news || []).slice(0, 10);
    const ratios = (data.ratios_annual || []).slice(0, 5);
    const history = (data.historical_price?.historical || []);

    const formatTrend = (arr, key) => arr.map(item => ({ year: item.calendarYear, value: formatLargeNumber(item[key]) }));
    const formatPercentTrend = (arr, key1, key2) => arr.map(item => {
        const value = item[key1] ?? item[key2];
        return { year: item.calendarYear, value: value ? `${(value * 100).toFixed(2)}%` : 'N/A' };
    });

    const findPriceClosestToDate = (targetDate, priceHistory) => {
        if (!priceHistory || priceHistory.length === 0) return null;
        const targetTimestamp = targetDate.getTime();
        for (const point of priceHistory) {
            const pointDate = new Date(point.date);
            if (pointDate.getTime() <= targetTimestamp) {
                return point.close;
            }
        }
        return priceHistory[priceHistory.length - 1].close;
    };

    let price_performance = {
        '1M': 'N/A', '3M': 'N/A', '6M': 'N/A', '12M': 'N/A'
    };

    if (history.length > 1) {
        history.sort((a, b) => new Date(b.date) - new Date(a.date));

        const today = new Date();
        const currentPrice = history[0].close;

        const dates = {
            '1M': new Date(new Date().setMonth(today.getMonth() - 1)),
            '3M': new Date(new Date().setMonth(today.getMonth() - 3)),
            '6M': new Date(new Date().setMonth(today.getMonth() - 6)),
            '12M': new Date(new Date().setFullYear(today.getFullYear() - 1)),
        };

        for (const period in dates) {
            const pastPrice = findPriceClosestToDate(dates[period], history);
            if (currentPrice && pastPrice && pastPrice !== 0) {
                const change = ((currentPrice - pastPrice) / pastPrice) * 100;
                price_performance[period] = `${change.toFixed(2)}%`;
            }
        }
    }

    return {
        growth_trends: {
            revenue: formatTrend(income, 'revenue'),
            net_income: formatTrend(income, 'netIncome')
        },
        profitability_metrics: {
            roe_trend: formatPercentTrend(metrics, 'roe', 'returnOnEquity'),
            net_profit_margin_trend: formatPercentTrend(ratios, 'netProfitMargin'),
            operating_margin_trend: formatPercentTrend(ratios, 'operatingProfitMargin')
        },
        cash_flow_trends: {
            operating_cash_flow: formatTrend(cashFlow, 'operatingCashFlow')
        },
        valuation_metrics: {
            pe_ratio_trend: metrics.map(m => ({ year: m.calendarYear, value: m.peRatio?.toFixed(2) })),
            pb_ratio_trend: ratios.map(m => ({ year: m.calendarYear, value: m.priceToBookRatio?.toFixed(2) }))
        },
        price_performance,
        balance_sheet_health: {
            debt_to_equity_trend: metrics.map(m => ({ year: m.calendarYear, value: m.debtToEquity?.toFixed(2) }))
        },
        analyst_ratings: grades.map(g => ({ company: g.gradingCompany, from: g.previousGrade, to: g.newGrade }))
    };
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
 * NEW: Calculates metrics for the "Dividend Deep Dive" prompt.
 */
export function _calculateDividendDeepDiveMetrics(data) {
    const metrics = (data.key_metrics_annual || []).slice(0, 10);
    const cashFlow = (data.cash_flow_statement_annual || []).slice(0, 10);
    const income = (data.income_statement_annual || []).slice(0, 10);
    const balanceSheet = (data.balance_sheet_statement_annual || []).slice(0, 10);
    const ratios = (data.ratios_annual || []).slice(0, 10);

    // MODIFICATION: Prioritize TTM data for the latest ratios.
    const latestRatios = data.ratios_ttm?.[0] || ratios[ratios.length - 1] || {};
    
    const incomeMap = new Map(income.map(i => [i.calendarYear, i]));

    const payoutRatios = cashFlow.map(cf => {
        const correspondingIncome = incomeMap.get(cf.calendarYear);
        const dividends = Math.abs(cf.dividendsPaid || 0);
        const fcf = cf.freeCashFlow;
        const netIncome = correspondingIncome?.netIncome;

        return {
            year: cf.calendarYear,
            fcf_payout_ratio: (fcf && fcf > 0) ? `${((dividends / fcf) * 100).toFixed(2)}%` : 'N/A',
            earnings_payout_ratio: (netIncome && netIncome > 0) ? `${((dividends / netIncome) * 100).toFixed(2)}%` : 'N/A'
        };
    }).slice(0, 5);

    // MODIFICATION: Prioritize TTM yield, then fall back to annual.
    const currentYieldValue = latestRatios.dividendYieldTTM ?? latestRatios.dividendYield;

    return {
        currentYield: currentYieldValue ? `${(currentYieldValue * 100).toFixed(2)}` : 'N/A',
        payoutRatios: {
            fcfPayoutRatio: payoutRatios[payoutRatios.length -1]?.fcf_payout_ratio || 'N/A',
            earningsPayoutRatio: payoutRatios[payoutRatios.length -1]?.earnings_payout_ratio || 'N/A'
        },
        dividendHistory: {
            dividendsPaid: cashFlow.slice(0, 5).map(cf => ({ year: cf.calendarYear, value: formatLargeNumber(cf.dividendsPaid) })),
        },
        debtToEquityTrend: metrics.slice(0, 5).map(m => ({ year: m.calendarYear, value: m.debtToEquity?.toFixed(2) })),
        cashTrend: balanceSheet.slice(0, 5).map(bs => ({ year: bs.calendarYear, value: formatLargeNumber(bs.cashAndCashEquivalents) }))
    };
}

/**
 * NEW: Calculates metrics for the "Growth Outlook" prompt.
 */
export function _calculateGrowthOutlookMetrics(data) {
    const income = (data.income_statement_annual || []).slice(0, 5);
    const metrics = (data.key_metrics_annual || []).slice(0, 5);
    const grades = (data.stock_grade_news || []).slice(0, 10);
    const estimates = (data.analyst_estimates || []).slice(0, 5);
    const ratios = (data.ratios_annual || []).slice(0, 5);

    // MODIFICATION: Prioritize TTM data.
    const latestRatios = data.ratios_ttm?.[0] || ratios[ratios.length - 1] || {};
    const latestMetrics = data.key_metrics_ttm?.[0] || metrics[metrics.length - 1] || {};

    return {
        historicalGrowth: {
            revenue_trend: income.map(i => ({ year: i.calendarYear, value: formatLargeNumber(i.revenue) })),
            net_income_trend: income.map(i => ({ year: i.calendarYear, value: formatLargeNumber(i.netIncome) }))
        },
        valuation: {
            // MODIFICATION: Use TTM values with fallback.
            peRatio: (latestMetrics.peRatioTTM ?? latestMetrics.peRatio)?.toFixed(2) || 'N/A',
            evToSalesRatio: (latestRatios.enterpriseValueMultipleTTM ?? latestRatios.enterpriseValueMultiple)?.toFixed(2) || 'N/A'
        },
        reinvestment: {
            rdToRevenue: latestMetrics.researchAndDevelopmentToRevenue ? `${(latestMetrics.researchAndDevelopmentToRevenue * 100).toFixed(2)}%` : 'N/A',
            capexToRevenue: latestMetrics.capexToRevenue ? `${(latestMetrics.capexToRevenue * 100).toFixed(2)}%` : 'N/A'
        },
        analystView: {
            grades: grades.map(g => ({ date: g.date, company: g.gradingCompany, action: g.action, from: g.previousGrade, to: g.newGrade })),
            estimates: estimates.map(e => ({
                date: e.date,
                revenue_avg: formatLargeNumber(e.estimatedRevenueAvg),
                eps_avg: e.estimatedEpsAvg?.toFixed(2)
            }))
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

    // MODIFICATION: Prioritize TTM data.
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
                // MODIFICATION: Use TTM values with fallback.
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
 * NEW: Calculates metrics for the "Narrative & Catalyst" prompt.
 */
export function _calculateNarrativeCatalystMetrics(data) {
    const profile = data.profile?.[0] || {};
    const metrics = (data.key_metrics_annual || []).slice(0, 5);
    const cashFlow = (data.cash_flow_statement_annual || []).slice(0, 5);
    const income = (data.income_statement_annual || []).slice(0, 5);
    const grades = (data.stock_grade_news || []).slice(0, 10);
    const ratios = (data.ratios_annual || []).slice(0, 5);

    const latestCashFlow = cashFlow[cashFlow.length - 1] || {};
    const latestIncome = income[income.length - 1] || {};
    // MODIFICATION: Prioritize TTM data.
    const latestMetrics = data.key_metrics_ttm?.[0] || metrics[metrics.length - 1] || {};

    const isGrowthAccelerating = () => {
        if (income.length < 3) return false;
        const yoy = (arr, key) => ((arr[arr.length - 1][key] / arr[arr.length - 2][key]) - 1);
        const latestGrowth = yoy(income, 'revenue');
        const prevGrowth = yoy(income.slice(0, -1), 'revenue');
        return latestGrowth > prevGrowth;
    };

    const isMarginExpanding = () => {
        if (ratios.length < 2) return false;
        return ratios[ratios.length - 1].operatingProfitMargin > ratios[ratios.length - 2].operatingProfitMargin;
    };

    return {
        description: profile.description,
        industry: profile.industry,
        isProfitable: (latestIncome.netIncome || 0) > 0,
        isCashFlowPositive: (latestCashFlow.freeCashFlow || 0) > 0,
        manageableDebt: (latestMetrics.debtToEquity || 0) < 2.0,
        isGrowthAccelerating: isGrowthAccelerating(),
        isMarginExpanding: isMarginExpanding(),
        hasRecentUpgrades: grades.filter(g => g.action && g.action.toLowerCase() === 'upgrade').length > 0
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

    // MODIFICATION: Prioritize TTM data.
    const latestMetrics = data.key_metrics_ttm?.[0] || keyMetrics[keyMetrics.length - 1] || {};
    const latestRatios = data.ratios_ttm?.[0] || ratios[ratios.length - 1] || {};
    const lastActualIncome = income[income.length - 1] || {};
    
    // Valuation
    // MODIFICATION: Prioritize TTM PE/PS ratios.
    const peRatio = latestMetrics.peRatioTTM ?? latestMetrics.peRatio;
    const psRatio = latestRatios.priceToSalesRatioTTM ?? latestRatios.priceToSalesRatio;

    const peHistory = keyMetrics.slice(-5).map(m => m.peRatio).filter(pe => typeof pe === 'number');
    const historicalPeAvg = peHistory.length > 0 ? peHistory.reduce((a, b) => a + b, 0) / peHistory.length : null;

    const peStatusVsHistory = (peRatio && historicalPeAvg) ? 
        (peRatio > historicalPeAvg ? 'trading at a premium to its history' : 'trading at a discount to its history')
        : 'N/A';

    // Growth
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

    // PEG Ratio
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

// --- NEW NARRATIVE & COMPARATIVE HELPERS (v14.17.0) ---

export function _calculateCompetitiveLandscapeMetrics(targetData, peersData) {
    const metricsToCompare = [
        { key: 'peRatio', ttmKey: 'peRatioTTM', name: 'P/E Ratio', source: 'key_metrics' },
        { key: 'priceToSalesRatio', ttmKey: 'priceToSalesRatioTTM', name: 'P/S Ratio', source: 'ratios' },
        { key: 'returnOnEquity', ttmKey: 'roeTTM', name: 'ROE', source: 'key_metrics', isPercent: true, fallbackKey: 'roe' },
        { key: 'netProfitMargin', ttmKey: 'netProfitMarginTTM', name: 'Net Profit Margin', source: 'ratios', isPercent: true },
        { key: 'debtToEquity', ttmKey: 'debtToEquityTTM', name: 'Debt/Equity', source: 'key_metrics' }
    ];

    const getLatestMetric = (data, metricInfo) => {
        const sourceData = metricInfo.source === 'key_metrics'
            ? data?.key_metrics_ttm?.[0] || data?.key_metrics_annual?.[0]
            : data?.ratios_ttm?.[0] || data?.ratios_annual?.[0];

        const value = sourceData ? (sourceData[metricInfo.ttmKey] ?? sourceData[metricInfo.key] ?? sourceData[metricInfo.fallbackKey]) : null;

        if (typeof value !== 'number') return 'N/A';
        return metricInfo.isPercent ? `${(value * 100).toFixed(2)}%` : value.toFixed(2);
    };

    const getRawMetric = (data, metricInfo) => {
        const sourceData = metricInfo.source === 'key_metrics'
            ? data?.key_metrics_ttm?.[0] || data?.key_metrics_annual?.[0]
            : data?.ratios_ttm?.[0] || data?.ratios_annual?.[0];

        return sourceData ? (sourceData[metricInfo.ttmKey] ?? sourceData[metricInfo.key] ?? sourceData[metricInfo.fallbackKey]) : null;
    };
    
    // Target Company Metrics
    const targetCompanyMetrics = { ticker: targetData.profile?.[0]?.symbol };
    metricsToCompare.forEach(m => {
        targetCompanyMetrics[m.key] = getLatestMetric(targetData, m);
    });

    // Peer Metrics
    const peerMetricsList = peersData.map(peer => {
        const metrics = { ticker: peer.ticker };
        metricsToCompare.forEach(m => {
            metrics[m.key] = getLatestMetric(peer.data, m);
        });
        return metrics;
    });

    // Peer Average Calculation
    const peerAverage = {};
    metricsToCompare.forEach(m => {
        const validPeerValues = peersData
            .map(p => getRawMetric(p.data, m))
            .filter(v => typeof v === 'number');
        
        if (validPeerValues.length > 0) {
            const avg = validPeerValues.reduce((a, b) => a + b, 0) / validPeerValues.length;
            peerAverage[m.key] = m.isPercent ? `${(avg * 100).toFixed(2)}%` : avg.toFixed(2);
        } else {
            peerAverage[m.key] = 'N/A';
        }
    });

    return {
        targetCompany: targetCompanyMetrics,
        peers: peerMetricsList,
        peerAverage: peerAverage
    };
}

export function _calculateStockDisruptorMetrics(data) {
    const profile = data.profile?.[0] || {};
    const income = (data.income_statement_annual || []).slice(0, 5).reverse();
    const metrics = (data.key_metrics_annual || []).slice(0, 5).reverse();
    
    // MODIFICATION: Prioritize TTM data.
    const latestMetrics = data.key_metrics_ttm?.[0] || metrics[metrics.length - 1] || {};
    const latestRatios = data.ratios_ttm?.[0] || (data.ratios_annual || [])[0] || {};

    return {
        description: profile.description,
        revenueGrowth: income.map(d => ({ year: d.calendarYear, value: formatLargeNumber(d.revenue) })),
        netIncomeGrowth: income.map(d => ({ year: d.calendarYear, value: formatLargeNumber(d.netIncome) })),
        rdToRevenue: latestMetrics.researchAndDevelopmentToRevenue ? `${(latestMetrics.researchAndDevelopmentToRevenue * 100).toFixed(2)}%` : 'N/A',
        capexToRevenue: latestMetrics.capexToRevenue ? `${(latestMetrics.capexToRevenue * 100).toFixed(2)}%` : 'N/A',
        peRatio: (latestMetrics.peRatioTTM ?? latestMetrics.peRatio)?.toFixed(2) || 'N/A',
        psRatio: (latestRatios.priceToSalesRatioTTM ?? latestRatios.priceToSalesRatio)?.toFixed(2) || 'N/A'
    };
}

export function _calculateStockFortressMetrics(data) {
    const ratios = (data.ratios_annual || []).slice(0, 5).reverse();
    const metrics = (data.key_metrics_annual || []).slice(0, 5).reverse();

    // MODIFICATION: Prioritize TTM data.
    const latestRatios = data.ratios_ttm?.[0] || ratios[ratios.length - 1] || {};
    const latestMetrics = data.key_metrics_ttm?.[0] || metrics[metrics.length - 1] || {};

    return {
        grossMarginTrend: ratios.map(r => ({ year: r.calendarYear, value: r.grossProfitMargin ? `${(r.grossProfitMargin * 100).toFixed(2)}%` : 'N/A' })),
        netMarginTrend: ratios.map(r => ({ year: r.calendarYear, value: r.netProfitMargin ? `${(r.netProfitMargin * 100).toFixed(2)}%` : 'N/A' })),
        debtToEquity: latestMetrics.debtToEquity ? latestMetrics.debtToEquity.toFixed(2) : 'N/A',
        currentRatio: latestRatios.currentRatio ? latestRatios.currentRatio.toFixed(2) : 'N/A',
        roeTrend: metrics.map(m => {
            const roeValue = m.roe ?? m.returnOnEquity;
            return { year: m.calendarYear, value: roeValue ? `${(roeValue * 100).toFixed(2)}%` : 'N/A' };
        }),
        peRatio: (latestMetrics.peRatioTTM ?? latestMetrics.peRatio)?.toFixed(2) || 'N/A',
        pbRatio: (latestRatios.priceToBookRatioTTM ?? latestRatios.priceToBookRatio)?.toFixed(2) || 'N/A',
    };
}

export function _calculateStockPhoenixMetrics(data) {
    const income = (data.income_statement_annual || []).slice(0, 5).reverse();
    const incomeQ = data.income_statement_quarterly || [];
    const ratios = (data.ratios_annual || []).slice(0, 5).reverse();
    const metrics = (data.key_metrics_annual || []).slice(0, 5).reverse();
    
    // MODIFICATION: Prioritize TTM data.
    const latestRatios = data.ratios_ttm?.[0] || ratios[ratios.length - 1] || {};
    const latestMetrics = data.key_metrics_ttm?.[0] || metrics[metrics.length - 1] || {};

    let revenueYoyGrowth = 'N/A';
    if (incomeQ.length >= 5) {
        const mrqRevenue = incomeQ[0].revenue;
        const prevYearQRevenue = incomeQ[4].revenue;
        if (mrqRevenue && prevYearQRevenue && prevYearQRevenue !== 0) {
            revenueYoyGrowth = `${(((mrqRevenue / prevYearQRevenue) - 1) * 100).toFixed(2)}%`;
        }
    }

    return {
        revenueTrend: income.map(d => ({ year: d.calendarYear, value: formatLargeNumber(d.revenue) })),
        netIncomeTrend: income.map(d => ({ year: d.calendarYear, value: formatLargeNumber(d.netIncome) })),
        revenueYoyGrowth,
        profitabilityTrend: {
            netProfitMargin: ratios.map(r => r.netProfitMargin ? `${(r.netProfitMargin * 100).toFixed(2)}%` : 'N/A'),
            operatingMargin: ratios.map(r => r.operatingProfitMargin ? `${(r.operatingProfitMargin * 100).toFixed(2)}%` : 'N/A')
        },
        debtToEquity: latestMetrics.debtToEquity?.toFixed(2) || 'N/A',
        peRatio: (latestMetrics.peRatioTTM ?? latestMetrics.peRatio)?.toFixed(2) || 'N/A',
        psRatio: (latestRatios.priceToSalesRatioTTM ?? latestRatios.priceToSalesRatio)?.toFixed(2) || 'N/A',
    };
}

export function _calculateStockLinchpinMetrics(data) {
    const profile = data.profile?.[0] || {};
    const ratios = (data.ratios_annual || []).slice(0, 5).reverse();
    const metrics = (data.key_metrics_annual || []).slice(0, 5).reverse();
    
    // MODIFICATION: Prioritize TTM data.
    const latestRatios = data.ratios_ttm?.[0] || ratios[ratios.length - 1] || {};
    const latestMetrics = data.key_metrics_ttm?.[0] || metrics[metrics.length - 1] || {};
    
    return {
        description: profile.description,
        profitabilityTrends: {
            grossProfitMargin: ratios.map(r => r.grossProfitMargin ? `${(r.grossProfitMargin * 100).toFixed(2)}%` : 'N/A'),
            netProfitMargin: ratios.map(r => r.netProfitMargin ? `${(r.netProfitMargin * 100).toFixed(2)}%` : 'N/A')
        },
        roicTrend: metrics.map(m => {
            const roicValue = m.roic ?? m.returnOnInvestedCapital;
            return roicValue ? `${(roicValue * 100).toFixed(2)}%` : 'N/A';
        }),
        peRatio: (latestMetrics.peRatioTTM ?? latestMetrics.peRatio)?.toFixed(2) || 'N/A',
        psRatio: (latestRatios.priceToSalesRatioTTM ?? latestRatios.priceToSalesRatio)?.toFixed(2) || 'N/A'
    };
}

export function _calculateStockUntouchablesMetrics(data) {
    const profile = data.profile?.[0] || {};
    const income = (data.income_statement_annual || []).slice(0, 5).reverse();
    const ratios = (data.ratios_annual || []).slice(0, 5).reverse();
    const metrics = (data.key_metrics_annual || []).slice(0, 5).reverse();

    // MODIFICATION: Prioritize TTM data.
    const latestRatios = data.ratios_ttm?.[0] || ratios[ratios.length - 1] || {};
    const latestMetrics = data.key_metrics_ttm?.[0] || metrics[metrics.length - 1] || {};
    const latestIncome = data.income_statement_ttm?.[0] || income[income.length - 1] || {};

    return {
        description: profile.description,
        profitabilityMetrics: {
            grossMargin: (latestRatios.grossProfitMarginTTM ?? latestRatios.grossProfitMargin) ? `${((latestRatios.grossProfitMarginTTM ?? latestRatios.grossProfitMargin) * 100).toFixed(2)}%` : 'N/A'
        },
        rdToRevenue: latestMetrics.researchAndDevelopmentToRevenue ? `${(latestMetrics.researchAndDevelopmentToRevenue * 100).toFixed(2)}%` : 'N/A',
        sgnaToRevenue: (latestIncome.sellingGeneralAndAdministrativeExpenses / latestIncome.revenue) ? `${(((latestIncome.sellingGeneralAndAdministrativeExpenses / latestIncome.revenue)) * 100).toFixed(2)}%` : 'N/A',
        valuation: {
            peRatio: (latestMetrics.peRatioTTM ?? latestMetrics.peRatio)?.toFixed(2) || 'N/A',
            psRatio: (latestRatios.priceToSalesRatioTTM ?? latestRatios.priceToSalesRatio)?.toFixed(2) || 'N/A'
        }
    };
}

/**
 * NEW: Calculates metrics for the "Income Memo" prompt.
 * @param {object} data - The full FMP data object for a stock.
 * @returns {object} A summary object with pre-calculated metrics.
 */
export function _calculateIncomeMemoMetrics(data) {
    // Annual data, reversed for easy access to latest
    const ratios_annual = (data.ratios_annual || []).slice().reverse();
    const keyMetrics_annual = (data.key_metrics_annual || []).slice().reverse();
    const cashFlow_annual = (data.cash_flow_statement_annual || []).slice().reverse();
    const balanceSheet_annual = (data.balance_sheet_statement_annual || []).slice().reverse();
    
    // Prioritize TTM data where available
    const latestRatios = data.ratios_ttm?.[0] || ratios_annual[ratios_annual.length - 1] || {};
    const latestKeyMetrics = data.key_metrics_ttm?.[0] || keyMetrics_annual[keyMetrics_annual.length - 1] || {};
    const latestCashFlow = cashFlow_annual[cashFlow_annual.length - 1] || {};
    const latestBalanceSheet = balanceSheet_annual[balanceSheet_annual.length - 1] || {};

    // 1. Dividend Yield
    const currentYieldValue = latestRatios.dividendYieldTTM ?? latestRatios.dividendYield;
    const currentYield = currentYieldValue ? `${(currentYieldValue * 100).toFixed(2)}%` : 'N/A';

    // 2. Payout Ratios
    let fcfPayoutRatio = 'N/A';
    if (latestCashFlow.freeCashFlow && latestCashFlow.dividendsPaid && latestCashFlow.freeCashFlow > 0) {
        const ratio = (Math.abs(latestCashFlow.dividendsPaid) / latestCashFlow.freeCashFlow) * 100;
        fcfPayoutRatio = `${ratio.toFixed(2)}%`;
    }
    const earningsPayoutRatioValue = latestKeyMetrics.payoutRatioTTM ?? latestKeyMetrics.payoutRatio;
    const earningsPayoutRatio = earningsPayoutRatioValue ? `${(earningsPayoutRatioValue * 100).toFixed(2)}%` : 'N/A';

    // 3. Dividend Growth History
    const dividendGrowthHistory = (() => {
        const dividendsPaid = cashFlow_annual.slice(-5).map(cf => Math.abs(cf.dividendsPaid || 0));
        if (dividendsPaid.length < 3) return "Not enough data for a trend.";
        
        let growthCount = 0;
        for (let i = 1; i < dividendsPaid.length; i++) {
            if (dividendsPaid[i] > dividendsPaid[i - 1]) {
                growthCount++;
            }
        }
        if (growthCount >= dividendsPaid.length - 2) return "Consistent growth";
        if (dividendsPaid[dividendsPaid.length - 1] >= dividendsPaid[dividendsPaid.length - 2]) return "Stable or growing recently";
        return "Inconsistent or declining";
    })();

    // 4. Financial Health
    const debtToEquityValue = latestKeyMetrics.debtToEquityTTM ?? latestKeyMetrics.debtToEquity;
    const debtToEquity = debtToEquityValue ? debtToEquityValue.toFixed(2) : 'N/A';
    const cashAndEquivalents = latestBalanceSheet.cashAndCashEquivalents ? formatLargeNumber(latestBalanceSheet.cashAndCashEquivalents) : 'N/A';
    
    return {
        currentYield,
        fcfPayoutRatio,
        earningsPayoutRatio,
        dividendGrowthHistory,
        financialHealth: {
            debtToEquity,
            cashAndEquivalents
        }
    };
}
