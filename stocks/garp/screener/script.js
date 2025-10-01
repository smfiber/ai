// Version 5.7.0
document.addEventListener("DOMContentLoaded", () => {
    // --- 1. Global Configuration Object ---
    const appConfig = {
        fmpApiKey: "",
        geminiApiKey: "",
        googleClientId: "",
        firebaseConfig: {},
        cachedStockInfo: {}
    };
    
    let db = null;
    let savedStocks = new Set();
    let sessionTimer = null;
    let advancedScreenerData = [];
    let currentSort = { key: 'marketCap', direction: 'desc' };
    let currentModalDataToSave = null;


    // --- Utility to pause execution ---
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // --- 2. DOM Element Selection ---
    const apiKeyModal = document.getElementById('apiKeyModal');
    const apiKeyForm = document.getElementById('apiKeyForm');
    const errorMessage = document.getElementById('api-key-error');
    const geminiApiKeyInput = document.getElementById('geminiApiKeyInput');
    const googleClientIdInput = document.getElementById('googleClientIdInput');
    const fmpApiKeyInput = document.getElementById('fmpApiKeyInput');
    const firebaseConfigInput = document.getElementById('firebaseConfigInput');
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const advancedScreenerFilterForm = document.getElementById('advancedScreenerFilterForm');
    const financialsModal = document.getElementById('financialsModal');
    const financialsModalOverlay = document.getElementById('financialsModalOverlay');
    const financialsModalCloseBtn = document.getElementById('financialsModalCloseBtn');
    const refreshFinancialsBtn = document.getElementById('refreshFinancialsBtn');
    const saveToFirebaseBtn = document.getElementById('saveToFirebaseBtn');
    const deleteOldDataBtn = document.getElementById('deleteOldDataBtn');
    const batchProcessBtn = document.getElementById('batchProcessBtn');
    const batchStatus = document.getElementById('batchStatus');
    const appContent = document.getElementById('appContent');
    const financialsModalTabs = document.getElementById('financials-modal-tabs');
    // Auth Elements
    const googleSignInBtn = document.getElementById('googleSignInBtn');
    const signOutBtn = document.getElementById('signOutBtn');
    const authUserInfo = document.getElementById('auth-user-info');
    const userEmailSpan = document.getElementById('user-email');


    // --- DATA PROCESSING LOGIC ---

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

            default:
                return { category: 'N/A', text: '' };
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

            default:
                return 0;
        }
    }


    /**
     * Calculates metrics for the GARP Scorecard dashboard.
     * @param {object} data - The FMP data object needed for the score.
     * @returns {object} An object containing GARP metrics with their values and pass/fail status.
     */
    function _calculateGarpScorecardMetrics(data) {
        if (!data || !Array.isArray(data.income_statement_annual)) {
            console.error("Invalid or incomplete data passed to _calculateGarpScorecardMetrics. Skipping.", data);
            return { garpConvictionScore: 'ERR' };
        }
        
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

        const eps5y = income.length >= 6 ? getCagr(income[startIndex].eps, income[lastIndex].eps, 5) : null;
        const rev5y = income.length >= 6 ? getCagr(income[startIndex].revenue, income[lastIndex].revenue, 5) : null;
        
        const roe = metricsTtm.roe ?? latestAnnualMetrics.roe;
        const roic = metricsTtm.roic ?? latestAnnualMetrics.roic;
        const de = metricsTtm.debtToEquity ?? latestAnnualMetrics.debtToEquity;

        // --- FIX: Find the correct forward-looking estimate for NEXT YEAR ---
        const currentYear = new Date().getFullYear();
        const nextYear = currentYear + 1;
        const nextYearEstimate = estimates.find(est => parseInt(est.calendarYear) === nextYear);

        let epsNext1y = null;
        const lastActualEps = income.length > 0 ? income[lastIndex].eps : null;
        const forwardEpsForGrowth = nextYearEstimate ? nextYearEstimate.estimatedEpsAvg : null;
        if (lastActualEps > 0 && forwardEpsForGrowth > 0) {
            epsNext1y = (forwardEpsForGrowth / lastActualEps) - 1;
        }

        let forwardPe = null;
        const forwardEps = nextYearEstimate ? nextYearEstimate.estimatedEpsAvg : null;
        const currentPrice = profile.price;
        if (currentPrice > 0 && forwardEps > 0) {
            forwardPe = currentPrice / forwardEps;
        }

        let peg = null;
        if (forwardPe > 0 && epsNext1y > 0) {
            peg = forwardPe / (epsNext1y * 100);
        }

        let pfcf = null;
        const fcfPerShareTtm = metricsTtm.freeCashFlowPerShareTTM;
        if (currentPrice > 0 && fcfPerShareTtm > 0) {
            pfcf = currentPrice / fcfPerShareTtm;
        }
        
        let interestCoverage = null;
        if (latestIncome.operatingIncome && latestIncome.interestExpense > 0) {
             interestCoverage = latestIncome.operatingIncome / latestIncome.interestExpense;
        } else if (latestIncome.operatingIncome > 0 && latestIncome.interestExpense <= 0) {
            interestCoverage = 999; // Effectively infinite coverage
        }
        
        const consistency = _calculateConsistencyMetrics(income);

        // --- METRICS DEFINITION (Rebalanced Weights) ---
        const metrics = {
            // -- Growth (25%)
            'EPS Growth (Next 1Y)': { value: epsNext1y, format: 'percent', weight: 12 },
            'EPS Growth (5Y)': { value: eps5y, format: 'percent', weight: 8 },
            'Revenue Growth (5Y)': { value: rev5y, format: 'percent', weight: 5 },
            // -- Quality & Stability (40%)
            'Return on Invested Capital': { value: roic, format: 'percent', weight: 12 },
            'Return on Equity': { value: roe, format: 'percent', weight: 10 },
            'Profitable Yrs (5Y)': { value: consistency.profitableYears, format: 'number', weight: 10 },
            'Rev. Growth Stability': { value: consistency.revenueGrowthStdDev, format: 'decimal', weight: 8 },
            // -- Financial Health (10%)
            'Debt-to-Equity': { value: de, format: 'decimal', weight: 5 },
            'Interest Coverage': { value: interestCoverage, format: 'decimal', weight: 5 },
            // -- Valuation (25%)
            'PEG Ratio': { value: peg, format: 'decimal', weight: 10 },
            'Forward P/E': { value: forwardPe, format: 'decimal', weight: 8 },
            'Price to FCF': { value: pfcf, format: 'decimal', weight: 7 },
        };

        // --- CONVICTION SCORE CALCULATION ---
        let weightedScore = 0;
        let totalWeight = 0;

        for (const key in metrics) {
            const metric = metrics[key];
            const multiplier = _getMetricScoreMultiplier(key, metric.value);

            totalWeight += metric.weight;
            weightedScore += metric.weight * multiplier;
            
            metric.isMet = multiplier >= 1.0;
            metric.multiplier = multiplier;
            metric.interpretation = _getMetricInterpretation(key, metric.value);
        }

        const rawScore = (weightedScore / totalWeight) * 100;
        
        metrics.garpConvictionScore = Math.round(Math.min(100, rawScore) || 0);
        
        return metrics;
    }

    function renderGarpScorecardDashboard(container, metrics) {
        if (!container) return;

        const tilesHtml = Object.entries(metrics).map(([name, data]) => {
            if (name === 'garpConvictionScore') return '';
            let valueDisplay = 'N/A';
            
            let colorClass = 'text-gray-500 italic';
            if (typeof data.multiplier === 'number') {
                if (data.multiplier > 1.0) {
                    colorClass = 'price-gain'; // Green for exceptional
                } else if (data.multiplier === 1.0) {
                    colorClass = 'price-neutral'; // Yellow for good
                } else {
                    colorClass = 'price-loss'; // Red for fail/partial
                }
            }

            if (typeof data.value === 'number' && isFinite(data.value)) {
                if (data.format === 'percent') {
                    valueDisplay = `${(data.value * 100).toFixed(2)}%`;
                } else if (data.format === 'number') {
                    valueDisplay = `${data.value} / 5`;
                }
                else {
                    valueDisplay = data.value.toFixed(2);
                }
            } else {
                 colorClass = 'text-gray-500 italic';
            }
            
            return `
                <div class="metric-tile p-3">
                    <p class="metric-title text-xs">${name}</p>
                    <p class="metric-value text-xl ${colorClass}">${valueDisplay}</p>
                </div>
            `;
        }).join('');

        const score = metrics.garpConvictionScore;
        let scoreClass = 'low';
        if (score > 75) scoreClass = 'high';
        else if (score > 50) scoreClass = 'medium';
        
        const scoreHtml = `
            <div class="conviction-score-display ${scoreClass}">
                <div class="text-xs font-bold text-gray-600">CONVICTION SCORE</div>
                <div class="score-value">${score}</div>
            </div>
        `;

        container.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <h3 class="text-lg font-bold text-gray-800">GARP Scorecard</h3>
                ${scoreHtml}
            </div>
            <div class="grid grid-cols-3 md:grid-cols-5 gap-3">${tilesHtml}</div>`;
    }
    
    function renderGarpInterpretationAnalysis(container, metrics) {
        if (!container || !metrics) {
            container.innerHTML = '';
            return;
        };

        const toKebabCase = (str) => str.replace(/\s+/g, '-').toLowerCase();

        const metricGroups = {
            'Growth': ['EPS Growth (Next 1Y)', 'EPS Growth (5Y)', 'Revenue Growth (5Y)'],
            'Quality & Consistency': ['Return on Invested Capital', 'Return on Equity', 'Profitable Yrs (5Y)', 'Rev. Growth Stability'],
            'Financial Health': ['Debt-to-Equity', 'Interest Coverage'],
            'Valuation': ['PEG Ratio', 'Forward P/E', 'Price to FCF']
        };

        let html = '<h3 class="text-lg font-bold text-gray-800 my-4 pt-4 border-t">GARP Criteria Interpretation</h3>';
        html += '<div class="space-y-4">';

        for (const groupName in metricGroups) {
            html += '<div>';
            html += `<h4 class="text-base font-semibold text-gray-700 mb-2">${groupName} Analysis</h4>`;
            html += '<div class="space-y-3">';

            metricGroups[groupName].forEach(metricName => {
                const metricData = metrics[metricName];
                if (metricData && metricData.interpretation) {
                    const interp = metricData.interpretation;
                    const badgeClass = toKebabCase(interp.category);
                    
                    html += `
                        <div class="p-3 bg-gray-50 rounded-lg border">
                            <p class="font-semibold text-gray-800 text-sm flex items-center gap-2">
                                ${metricName}
                                <span class="interp-badge ${badgeClass}">${interp.category}</span>
                            </p>
                            <p class="text-xs text-gray-600 mt-1">${interp.text}</p>
                        </div>
                    `;
                }
            });
            html += '</div></div>';
        }
        
        html += '</div>';
        container.innerHTML += html;
    }


    // --- 3. Initialization Logic ---
    function initialize() {
        showModal();
        googleSignInBtn.addEventListener('click', signInWithGoogle);
        signOutBtn.addEventListener('click', signOut);
        apiKeyForm.addEventListener('submit', handleApiKeyFormSubmit);
        deleteOldDataBtn.addEventListener('click', async () => {
            if (db && confirm('Are you sure you want to permanently delete all old data from the "financial-details" table? This action cannot be undone.')) {
                try {
                    await db.ref('financial-details').remove();
                    alert('The old "financial-details" table has been successfully deleted.');
                } catch (error) {
                    console.error("Failed to delete old data:", error);
                    alert(`An error occurred while trying to delete the data: ${error.message}`);
                }
            } else if (!db) {
                alert("Please save your configuration and sign in first to connect to the database.");
            }
        });
    }
    
    // --- 4. Auth and Session Management ---
    function signInWithGoogle() {
        if (!firebase.apps.length) {
            alert("Please provide your configuration and API keys and click 'Save and Continue' first to initialize the application.");
            return;
        }
        const provider = new firebase.auth.GoogleAuthProvider();
        firebase.auth().signInWithPopup(provider).catch(error => {
            console.error("Google Sign-In Error:", error);
            errorMessage.textContent = `Sign-in failed: ${error.message}`;
        });
    }

    function signOut() {
        firebase.auth().signOut();
    }

    function startSessionTimer() {
        clearSessionTimer(); 
        localStorage.setItem('loginTimestamp', Date.now());
        sessionTimer = setInterval(checkSession, 60000); // Check every minute
        console.log("Session timer started.");
    }

    function checkSession() {
        const loginTimestamp = localStorage.getItem('loginTimestamp');
        if (!loginTimestamp) return;

        const thirtyMinutes = 30 * 60 * 1000;
        if (Date.now() - loginTimestamp > thirtyMinutes) {
            console.log("Session expired after 30 minutes.");
            clearSessionTimer();
            alert("Your session has expired. Please sign in again.");
            signInWithGoogle();
        }
    }
    
    function clearSessionTimer() {
        if (sessionTimer) {
            clearInterval(sessionTimer);
            sessionTimer = null;
            localStorage.removeItem('loginTimestamp');
            console.log("Session timer cleared.");
        }
    }
    
    // --- 5. Form Submission Handler ---
    function handleApiKeyFormSubmit(event) {
        event.preventDefault();
        errorMessage.textContent = '';
        const formValues = {
            geminiApiKey: geminiApiKeyInput.value.trim(),
            googleClientId: googleClientIdInput.value.trim(),
            fmpApiKey: fmpApiKeyInput.value.trim(),
            firebaseConfigString: firebaseConfigInput.value.trim()
        };
        if (Object.values(formValues).some(value => value === '')) {
            errorMessage.textContent = 'All fields are required.';
            return;
        }
        try {
            const parsedFirebaseConfig = JSON.parse(formValues.firebaseConfigString);
            if (!parsedFirebaseConfig.databaseURL) {
                errorMessage.textContent = 'Firebase Config must include a "databaseURL" property.';
                return;
            }
            Object.assign(appConfig, { ...formValues, firebaseConfig: parsedFirebaseConfig });
            
            try {
                if (!firebase.apps.length) {
                    firebase.initializeApp(appConfig.firebaseConfig);
                }
                db = firebase.database();
                console.log("Firebase initialized successfully.");

                firebase.auth().onAuthStateChanged(user => {
                    if (user) {
                        console.log("User signed in:", user.email);
                        userEmailSpan.textContent = user.email;
                        googleSignInBtn.style.display = 'none';
                        authUserInfo.style.display = 'block';
                        
                        startSessionTimer();
                        hideModal();
                        startApp();
                    } else {
                        console.log("User is signed out.");
                        userEmailSpan.textContent = '';
                        googleSignInBtn.style.display = 'block';
                        authUserInfo.style.display = 'none';
                        appContent.style.display = 'none';
                        showModal(); 
                        clearSessionTimer();
                    }
                });

            } catch (e) {
                 if (!/already exists/.test(e.message)) {
                    console.error("Firebase initialization failed:", e);
                    alert("Could not initialize Firebase. Please check your configuration.");
                    return;
                }
            }
        } catch (error) {
            errorMessage.textContent = 'Invalid Firebase Config JSON.';
        }
    }

    // --- 6. Modal & Tab Utility Functions ---
    function showModal() { apiKeyModal.style.display = 'flex'; }
    function hideModal() { 
        apiKeyModal.style.display = 'none'; 
        appContent.style.display = 'block';
    }
    
    function showFinancialsModal() { financialsModal.style.display = 'flex'; }
    function hideFinancialsModal() { financialsModal.style.display = 'none'; }

    function setupTabs() {
        const tabMap = {
            'advanced-screener-tab-button': 'advanced-screener-tab-content',
            'saved-stocks-tab-button': 'saved-stocks-tab-content'
        };

        const setActiveTab = (activeButtonId) => {
            tabButtons.forEach(button => {
                const isActive = button.id === activeButtonId;
                button.classList.toggle('border-indigo-500', isActive);
                button.classList.toggle('text-indigo-600', isActive);
                button.classList.toggle('border-transparent', !isActive);
                button.classList.toggle('text-gray-500', !isActive);
            });
            Object.values(tabMap).forEach(contentId => {
                const contentEl = document.getElementById(contentId);
                if (contentEl) {
                   contentEl.style.display = (tabMap[activeButtonId] === contentId) ? 'block' : 'none';
                }
            });
            if (activeButtonId === 'saved-stocks-tab-button') {
                renderSavedStocksTable();
            }
        };

        tabButtons.forEach(button => {
            button.addEventListener('click', () => setActiveTab(button.id));
        });
        
        setActiveTab('advanced-screener-tab-button');
    }
    
    async function handleAdvancedScreenerRun(event) {
        event.preventDefault();
        await fetchAdvancedStockScreener();
    }

    // --- 7. Main Application Logic ---
    async function startApp() {
        console.log("Application starting...");
        
        loadSavedStocks();
        setupTabs();
        setupFinancialsModalListeners();
        advancedScreenerFilterForm.addEventListener('submit', handleAdvancedScreenerRun);
        document.getElementById('advanced-screener-data-container').addEventListener('click', handleSortClick);
        batchProcessBtn.addEventListener('click', handleBatchProcess);
        
        await populateIndustryDropdown();

        document.getElementById('sector').value = 'Consumer Cyclical';
        document.getElementById('industry').value = 'Advertising Agencies';
        
        appContent.addEventListener('click', (e) => {
            const saveBtn = e.target.closest('.save-stock-btn');
            if (saveBtn && saveBtn.dataset.symbol) {
                toggleSaveStock(saveBtn.dataset.symbol);
            }
        });
        
        console.log("Application loaded. Ready for screening.");
    }
    
    async function populateIndustryDropdown() {
        const industrySelect = document.getElementById('industry');
        if (!industrySelect) return;
        
        while (industrySelect.options.length > 1) {
            industrySelect.remove(1);
        }
        industrySelect.disabled = false;

        try {
            const url = `https://financialmodelingprep.com/stable/available-industries?apikey=${appConfig.fmpApiKey}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch industry list');
            const industries = await response.json();

            if (Array.isArray(industries)) {
                industries.sort((a, b) => {
                    const nameA = a && typeof a === 'object' ? String(Object.values(a)[0] || '') : String(a);
                    const nameB = b && typeof b === 'object' ? String(Object.values(b)[0] || '') : String(b);
                    return nameA.localeCompare(nameB);
                });

                industries.forEach(industry => {
                    const industryName = industry && typeof industry === 'object' ? Object.values(industry)[0] : industry;
                    if(industryName && typeof industryName === 'string') {
                        const option = document.createElement('option');
                        option.value = industryName;
                        option.textContent = industryName;
                        industrySelect.appendChild(option);
                    }
                });
            }
        } catch (error) {
            console.error("Could not populate industry dropdown:", error);
            industrySelect.disabled = true;
            const errorOption = document.createElement('option');
            errorOption.textContent = 'Could not load industries';
            errorOption.value = '';
            industrySelect.appendChild(errorOption);
        }
    }
    
    // --- 8. Saved Stocks Logic ---
    function loadSavedStocks() {
        const stored = localStorage.getItem('magickalOracleSavedStocks');
        if (stored) {
            savedStocks = new Set(JSON.parse(stored));
        }
    }

    function updateSavedStocksStorage() {
        localStorage.setItem('magickalOracleSavedStocks', JSON.stringify(Array.from(savedStocks)));
    }

    function toggleSaveStock(symbol) {
        if (savedStocks.has(symbol)) {
            savedStocks.delete(symbol);
        } else {
            savedStocks.add(symbol);
        }
        updateSavedStocksStorage();
        updateUiForSymbol(symbol);
        renderSavedStocksTable();
    }

    function updateUiForSymbol(symbol) {
        const isSaved = savedStocks.has(symbol);
        document.querySelectorAll(`tr[data-symbol-row="${symbol}"]`).forEach(row => {
            row.classList.toggle('saved-stock-row', isSaved);
        });
        document.querySelectorAll(`.save-stock-btn[data-symbol="${symbol}"]`).forEach(btn => {
            btn.classList.toggle('saved', isSaved);
            const icon = btn.querySelector('i');
            if (icon) {
                icon.classList.toggle('fas', isSaved);
                icon.classList.toggle('far', !isSaved);
            }
        });
    }

    // --- 9. Accordion Toggle Logic ---
    function setupAccordionToggle(button, content, icon) {
        if (!button) return;
        button.addEventListener('click', () => {
            const isOpen = content.style.maxHeight && content.style.maxHeight !== "0px";
            content.style.maxHeight = isOpen ? "0px" : content.scrollHeight + "px";
            if(icon) icon.style.transform = isOpen ? "rotate(0deg)" : "rotate(180deg)";
        });
    }

    // --- 10. Screener Fetching & Sorting Functions ---
    async function fetchAdvancedStockScreener() {
        const tableEl = document.getElementById('advanced-screener-data-container');
        const cardEl = document.getElementById('advanced-screener-card-view');
        const loadingMsg = `<p class="text-gray-500">Loading screener data...</p>`;
        if(tableEl) tableEl.innerHTML = loadingMsg;
        if(cardEl) cardEl.innerHTML = loadingMsg;

        if (!appConfig.fmpApiKey) {
            const errorMsg = '<p class="text-red-500">Financial Modeling Prep API Key is missing.</p>';
            if(tableEl) tableEl.innerHTML = errorMsg;
            if(cardEl) cardEl.innerHTML = errorMsg;
            return;
        }

        let url = `https://financialmodelingprep.com/api/v3/stock-screener?apikey=${appConfig.fmpApiKey}&limit=1000&isEtf=false&isFund=false`;
        
        const formIds = ["marketCapMoreThan", "marketCapLowerThan", "betaMoreThan", "betaLowerThan", "volumeMoreThan", "volumeLowerThan", "dividendMoreThan", "dividendLowerThan", "sector", "industry", "exchange", "country"];
        const form = document.getElementById('advancedScreenerFilterForm');
        formIds.forEach(id => {
            const element = form.querySelector(`#${id}`);
            if(element && element.value) {
                 url += `&${id}=${encodeURIComponent(element.value)}`;
            }
        });

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`API request failed: ${response.status}`);
            const data = await response.json();
            
            advancedScreenerData = data;
            currentSort = { key: 'marketCap', direction: 'desc' };
            sortAndRerenderAdvancedTable();
            renderStockCards(data, cardEl, "Advanced Screener");
            
        } catch (error) {
            console.error(`Error fetching advanced screener data:`, error);
            const errorMsg = `<p class="text-red-500">Error fetching screener data. Check console for details.</p>`;
            if(tableEl) tableEl.innerHTML = errorMsg;
            if(cardEl) cardEl.innerHTML = errorMsg;
        }
    }
    
    function handleSortClick(e) {
        const header = e.target.closest('[data-sort-key]');
        if (!header) return;

        const key = header.dataset.sortKey;
        
        if (currentSort.key === key) {
            currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            currentSort.key = key;
            const numericDesc = ['marketCap', 'volume', 'price', 'lastAnnualDividend', 'dividendYield', 'cachedTimestamp'];
            currentSort.direction = numericDesc.includes(key) ? 'desc' : 'asc';
        }
        sortAndRerenderAdvancedTable();
    }

    function sortAndRerenderAdvancedTable() {
        const container = document.getElementById('advanced-screener-data-container');
        const scrollableDiv = container.querySelector('.overflow-y-auto');
        const scrollTop = scrollableDiv ? scrollableDiv.scrollTop : 0;

        const { key, direction } = currentSort;
        const sortedData = [...advancedScreenerData].sort((a, b) => {
            let valA = a[key];
            let valB = b[key];

            if (valA === null || valA === undefined) return 1;
            if (valB === null || valB === undefined) return -1;

            if (typeof valA === 'string') {
                return direction === 'asc' 
                    ? valA.localeCompare(valB) 
                    : valB.localeCompare(valA);
            } else {
                return direction === 'asc' ? valA - valB : valB - valA;
            }
        });
        renderAdvancedStockTable(sortedData, container);

        const newScrollableDiv = container.querySelector('.overflow-y-auto');
        if (newScrollableDiv) {
            newScrollableDiv.scrollTop = scrollTop;
        }
    }

    // --- 11. Firebase Functions ---
    async function saveTickerDetailsToFirebase(symbol, data) {
        if (!db) return;
        try {
            await db.ref(`financial-details-v2/${symbol}`).set(data);
            console.log(`Details for ${symbol} saved to Firebase.`);
        } catch (error) {
            console.error(`Failed to save details for ${symbol}:`, error);
        }
    }

    // --- 12. Rendering Functions ---
    const formatText = (text) => text || 'N/A';
    const formatMarketCap = (num) => {
        if (!num) return 'N/A';
        if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
        if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
        return num.toLocaleString();
    };

    function formatDate(timestamp) {
        if (!timestamp) return 'N/A';
        const date = new Date(timestamp);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
    }

    function getRatingHtml(symbol) {
        const score = appConfig.cachedStockInfo[symbol]?.rating;
        if (score === null || typeof score === 'undefined') return 'N/A';
        
        let scoreClass = 'text-red-600';
        if (score > 75) scoreClass = 'text-green-600';
        else if (score > 50) scoreClass = 'text-yellow-600';

        return `<span class="${scoreClass} font-medium">${score}</span>`;
    }
    
    function getRatingDateHtml(symbol) {
        const timestamp = appConfig.cachedStockInfo[symbol]?.timestamp;
        if (!timestamp) return '';
        return `<span class="text-xs text-gray-400">as of ${formatDate(timestamp)}</span>`;
    }

    function updateScoreInUI(symbol, score, timestamp) {
        if (score === 'ERR') {
            document.querySelectorAll(`[data-rating-symbol="${symbol}"]`).forEach(cell => {
                cell.innerHTML = `<span class="text-red-500 font-bold">ERR</span>`;
            });
            return;
        }

        appConfig.cachedStockInfo[symbol] = { 
            rating: score,
            timestamp: timestamp 
        };
        const numericTimestamp = new Date(timestamp).getTime();

        const stockInDataModel = advancedScreenerData.find(s => s.symbol === symbol);
        if (stockInDataModel) {
            stockInDataModel.cachedTimestamp = numericTimestamp;
        }

        document.querySelectorAll(`[data-rating-symbol="${symbol}"]`).forEach(cell => {
            cell.innerHTML = getRatingHtml(symbol);
        });
        document.querySelectorAll(`[data-rating-date-symbol="${symbol}"]`).forEach(el => {
            el.innerHTML = getRatingDateHtml(symbol);
        });
        document.querySelectorAll(`[data-cached-on-symbol="${symbol}"]`).forEach(cell => {
            cell.textContent = formatDate(timestamp);
        });
    }

    function renderAdvancedStockTable(data, container) {
        if (!container) return;
        if (!data || data.length === 0) {
            container.innerHTML = '<p class="text-gray-500">No stock data found for the selected criteria.</p>';
            return;
        }

        const getSortableHeaderHtml = (key, title, width, align = 'left') => {
            const sortIndicator = currentSort.key === key ? (currentSort.direction === 'asc' ? '▲' : '▼') : '↕';
            const textAlign = `text-${align}`;
            return `<th class="${width} px-4 py-3 ${textAlign} text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100" data-sort-key="${key}">${title} <span class="text-gray-400">${sortIndicator}</span></th>`;
        };

        const headers = [
            getSortableHeaderHtml('symbol', 'Symbol', 'w-[10%]', 'left'),
            getSortableHeaderHtml('companyName', 'Company', 'w-[15%]', 'left'),
            getSortableHeaderHtml('marketCap', 'Mkt Cap', 'w-[8%]', 'right'),
            getSortableHeaderHtml('volume', 'Volume', 'w-[8%]', 'right'),
            getSortableHeaderHtml('sector', 'Sector', 'w-[10%]', 'left'),
            getSortableHeaderHtml('industry', 'Industry', 'w-[10%]', 'left'),
            getSortableHeaderHtml('beta', 'Beta', 'w-[5%]', 'right'),
            `<th class="w-[8%] px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Conviction Score</th>`,
            getSortableHeaderHtml('price', 'Price', 'w-[6%]', 'right'),
            getSortableHeaderHtml('lastAnnualDividend', 'Dividend $', 'w-[6%]', 'right'),
            getSortableHeaderHtml('dividendYield', 'Dividend %', 'w-[6%]', 'right'),
            getSortableHeaderHtml('cachedTimestamp', 'Cached On', 'w-[8%]', 'left')
        ].join('');

        const tableRows = data.map(stock => {
            const isSaved = savedStocks.has(stock.symbol);
            return `
            <tr data-symbol-row="${stock.symbol}" class="${isSaved ? 'saved-stock-row' : ''}">
                <td class="px-4 py-3 whitespace-nowrap text-sm">
                    <button class="save-stock-btn ${isSaved ? 'saved' : ''}" data-symbol="${stock.symbol}" title="Save Stock">
                        <i class="${isSaved ? 'fas' : 'far'} fa-star"></i>
                    </button>
                     <button class="ticker-details-btn font-medium text-indigo-600 hover:text-indigo-800" data-symbol="${stock.symbol}">${stock.symbol}</button>
                </td>
                <td class="px-4 py-3 text-sm text-gray-600 break-words">${formatText(stock.companyName)}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">${formatMarketCap(stock.marketCap)}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">${stock.volume ? stock.volume.toLocaleString() : 'N/A'}</td>
                <td class="px-4 py-3 text-sm text-gray-500 break-words">${formatText(stock.sector)}</td>
                <td class="px-4 py-3 text-sm text-gray-500 break-words">${formatText(stock.industry)}</td>
                 <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">${stock.beta ? stock.beta.toFixed(2) : 'N/A'}</td>
                 <td class="px-4 py-3 whitespace-nowrap text-sm text-center" data-rating-symbol="${stock.symbol}">${getRatingHtml(stock.symbol)}</td>
                 <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">${stock.price ? '$'+stock.price.toFixed(2) : 'N/A'}</td>
                 <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">${stock.lastAnnualDividend ? '$'+stock.lastAnnualDividend.toFixed(2) : 'N/A'}</td>
                 <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">${typeof stock.dividendYield === 'number' ? stock.dividendYield.toFixed(2) + '%' : 'N/A'}</td>
                 <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500" data-cached-on-symbol="${stock.symbol}">${formatDate(stock.cachedTimestamp)}</td>
            </tr>`;
        }).join('');
        container.innerHTML = `<div class="overflow-y-auto max-h-[60vh]"><table class="w-full table-fixed divide-y divide-gray-200"><thead class="bg-gray-50 sticky top-0"><tr>${headers}</tr></thead><tbody class="bg-white divide-y divide-gray-200">${tableRows}</tbody></table></div>`;
    }
    
    async function renderSavedStocksTable() {
        const container = document.getElementById('saved-stocks-data-container');
        if (!container) return;

        if (savedStocks.size === 0) {
            container.innerHTML = '<p class="text-gray-500">You have not saved any stocks yet.</p>';
            return;
        }
        
        container.innerHTML = '<p class="text-gray-500">Loading saved stocks...</p>';

        try {
            const symbols = Array.from(savedStocks).join(',');
            const url = `https://financialmodelingprep.com/api/v3/profile/${symbols}?apikey=${appConfig.fmpApiKey}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch saved stock details');
            const data = await response.json();

            const tableRows = data.map(stock => {
                const isSaved = savedStocks.has(stock.symbol);
                return `
                <tr data-symbol-row="${stock.symbol}" class="saved-stock-row">
                    <td class="px-4 py-3 whitespace-nowrap text-sm">
                        <button class="save-stock-btn ${isSaved ? 'saved' : ''}" data-symbol="${stock.symbol}" title="Save Stock">
                            <i class="${isSaved ? 'fas' : 'far'} fa-star"></i>
                        </button>
                        <button class="ticker-details-btn font-medium text-indigo-600 hover:text-indigo-800" data-symbol="${stock.symbol}">${stock.symbol}</button>
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-600 break-words">${formatText(stock.companyName)}</td>
                    <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">${formatMarketCap(stock.mktCap)}</td>
                    <td class="px-4 py-3 text-sm text-gray-500 break-words">${formatText(stock.sector)}</td>
                    <td class="px-4 py-3 whitespace-nowrap text-sm text-center" data-rating-symbol="${stock.symbol}">${getRatingHtml(stock.symbol)}</td>
                    <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">${stock.beta ? stock.beta.toFixed(2) : 'N/A'}</td>
                    <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">${stock.price ? '$'+stock.price.toFixed(2) : 'N/A'}</td>
                </tr>`;
            }).join('');

            container.innerHTML = `<div class="overflow-y-auto max-h-[60vh]"><table class="w-full table-fixed divide-y divide-gray-200"><thead class="bg-gray-50 sticky top-0"><tr><th class="w-[15%] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Symbol</th><th class="w-[30%] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th><th class="w-[15%] px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Market Cap</th><th class="w-[15%] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sector</th><th class="w-[10%] px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Conviction Score</th><th class="w-[5%] px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Beta</th><th class="w-[10%] px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th></tr></thead><tbody class="bg-white divide-y divide-gray-200">${tableRows}</tbody></table></div>`;

        } catch (error) {
            console.error("Error rendering saved stocks table:", error);
            container.innerHTML = '<p class="text-red-500">Could not load saved stocks.</p>';
        }
    }

    function renderStockCards(data, container, title) {
        if (!container) return;
        if (!data || data.length === 0) {
            container.innerHTML = '<p class="text-center text-gray-500">No stocks found to display in card view.</p>'; return;
        }
        const grouped = data.reduce((acc, stock) => {
            const sector = stock.sector || 'Unclassified';
            const industry = stock.industry || 'Unclassified';
            acc[sector] = acc[sector] || {};
            acc[sector][industry] = acc[sector][industry] || [];
            acc[sector][industry].push(stock);
            return acc;
        }, {});

        let html = `<h3 class="text-xl font-bold mb-4 text-gray-700">${title} Stocks by Sector</h3>`;
        for (const sector in grouped) {
            html += `<div class="mb-6"><h4 class="text-lg font-semibold text-indigo-700 p-2 bg-indigo-50 rounded-md">${sector}</h4>`;
            for (const industry in grouped[sector]) {
                html += `<div class="mt-4"><h5 class="text-md font-medium text-gray-600 mb-3 ml-2">${industry}</h5><div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">`;
                grouped[sector][industry].forEach(stock => {
                    const isSaved = savedStocks.has(stock.symbol);
                    html += `<div class="bg-white border border-gray-200 rounded-lg p-3 shadow-sm flex flex-col justify-between h-full">
                                <div>
                                    <div class="flex justify-between items-start mb-1">
                                        <div class="flex items-center truncate">
                                            <button class="save-stock-btn ${isSaved ? 'saved' : ''}" data-symbol="${stock.symbol}" title="Save Stock">
                                                <i class="${isSaved ? 'fas' : 'far'} fa-star"></i>
                                            </button>
                                            <p class="font-bold text-sm text-indigo-600 truncate pr-2">
                                                <button class="ticker-details-btn text-left w-full" data-symbol="${stock.symbol}">${stock.symbol}</button>
                                            </p>
                                        </div>
                                        <p class="text-xs font-semibold text-gray-700 whitespace-nowrap">${formatMarketCap(stock.marketCap)}</p>
                                    </div>
                                    <p class="text-xs text-gray-500 truncate" title="${formatText(stock.companyName)}">${formatText(stock.companyName)}</p>
                                </div>
                                <div class="mt-2 pt-2 border-t border-gray-100 flex justify-between items-end">
                                    <div>
                                        <span class="text-xs text-gray-500">Conviction Score</span>
                                        <div data-rating-date-symbol="${stock.symbol}">${getRatingDateHtml(stock.symbol)}</div>
                                    </div>
                                    <span class="font-bold text-lg" data-rating-symbol="${stock.symbol}">${getRatingHtml(stock.symbol)}</span>
                                </div>
                            </div>`;
                });
                html += `</div></div>`;
            }
            html += `</div>`;
        }
        container.innerHTML = html;
    }

    // --- 13. Financials Modal Logic ---
    function setupFinancialsModalListeners() {
        financialsModalOverlay.addEventListener('click', hideFinancialsModal);
        financialsModalCloseBtn.addEventListener('click', hideFinancialsModal);
        
        appContent.addEventListener('click', (e) => {
            const button = e.target.closest('.ticker-details-btn');
            if (button && button.dataset.symbol) {
                handleTickerClick(button.dataset.symbol);
            }
        });

        refreshFinancialsBtn.addEventListener('click', async () => {
            const symbol = refreshFinancialsBtn.dataset.symbol;
            if (symbol) {
                document.getElementById('modal-ai-summary-content').innerHTML = '<p class="text-center text-gray-500">Refreshing analysis...</p>';
                document.getElementById('modal-raw-data-content').innerHTML = '<p class="text-center text-gray-500">Refreshing raw data...</p>';

                const liveData = await fetchFullTickerDetails(symbol);
                if (liveData) {
                    const garpData = mapDataForGarp(liveData);
                    const metrics = _calculateGarpScorecardMetrics(garpData);
                    
                    populateGarpScorecardInModal(metrics);
                    populateRawDataModal(garpData);
                    
                    const dataToSave = { ...garpData, garpConvictionScore: metrics.garpConvictionScore, timestamp: new Date().toISOString() };
                    currentModalDataToSave = dataToSave; // Update data available for manual save
                    
                    // Reset save button state on refresh
                    saveToFirebaseBtn.disabled = false;
                    saveToFirebaseBtn.innerHTML = '<i class="fas fa-cloud-upload-alt mr-2"></i>Save to Cloud';
                } else {
                    document.getElementById('modal-ai-summary-content').innerHTML = '<p class="text-center text-red-500">Could not refresh data.</p>';
                    document.getElementById('modal-raw-data-content').innerHTML = '';
                }
            }
        });
        
        saveToFirebaseBtn.addEventListener('click', async () => {
            const symbol = saveToFirebaseBtn.dataset.symbol;
            if (symbol && currentModalDataToSave) {
                await saveTickerDetailsToFirebase(symbol, currentModalDataToSave);
                
                const { garpConvictionScore, timestamp } = currentModalDataToSave;
                updateScoreInUI(symbol, garpConvictionScore, timestamp);
                
                saveToFirebaseBtn.disabled = true;
                saveToFirebaseBtn.innerHTML = '<i class="fas fa-check mr-2"></i>Saved!';
            }
        });

        financialsModalTabs.addEventListener('click', (e) => {
            const button = e.target.closest('.modal-tab-button');
            if (button) {
                financialsModalTabs.querySelectorAll('.modal-tab-button').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                document.querySelectorAll('.modal-tab-content').forEach(content => content.classList.remove('active'));
                document.querySelector(button.dataset.tabTarget).classList.add('active');
            }
        });
    }
    
    async function handleBatchProcess() {
        if (!advancedScreenerData || advancedScreenerData.length === 0) {
            alert("No stocks in the screener results to process.");
            return;
        }

        batchProcessBtn.disabled = true;
        const total = advancedScreenerData.length;

        for (let i = 0; i < total; i++) {
            const stock = advancedScreenerData[i];
            batchStatus.textContent = `Processing ${i + 1} of ${total}: ${stock.symbol}`;
            
            try {
                const liveData = await fetchFullTickerDetails(stock.symbol);
                if (liveData) {
                    const garpData = mapDataForGarp(liveData);
                    const metrics = _calculateGarpScorecardMetrics(garpData);
                    const timestamp = new Date().toISOString();
                    updateScoreInUI(stock.symbol, metrics.garpConvictionScore, timestamp);
                }
                await delay(1000); // 1-second delay to respect API rate limits
            } catch (error) {
                console.error(`Failed to process ${stock.symbol}:`, error);
                batchStatus.textContent = `Error on ${stock.symbol}. Skipping...`;
                updateScoreInUI(stock.symbol, 'ERR', new Date().toISOString());
                await delay(1000);
            }
        }

        batchStatus.textContent = "Batch complete!";
        batchProcessBtn.disabled = false;
        setTimeout(() => batchStatus.textContent = "", 3000);
    }

    async function handleTickerClick(symbol) {
        showFinancialsModal();
        refreshFinancialsBtn.dataset.symbol = symbol;
        saveToFirebaseBtn.dataset.symbol = symbol;
        
        saveToFirebaseBtn.disabled = false;
        saveToFirebaseBtn.innerHTML = '<i class="fas fa-cloud-upload-alt mr-2"></i>Save to Cloud';
        
        document.getElementById('modal-company-name').textContent = `Loading... (${symbol})`;
        document.getElementById('modal-stock-price').textContent = '';
        document.getElementById('modal-last-updated').textContent = '...';
        document.getElementById('modal-ai-summary-content').innerHTML = '<p class="text-center text-gray-500">Loading GARP analysis...</p>';
        document.getElementById('modal-raw-data-content').innerHTML = '<p class="text-center text-gray-500">Loading raw data...</p>';
        
         // Reset to first tab
        financialsModalTabs.querySelectorAll('.modal-tab-button').forEach(btn => btn.classList.remove('active'));
        financialsModalTabs.querySelector('button').classList.add('active');
        document.querySelectorAll('.modal-tab-content').forEach(content => content.classList.remove('active'));
        document.querySelector('#modal-ai-summary-content').classList.add('active');

        const liveData = await fetchFullTickerDetails(symbol);
        if (liveData) {
            const garpData = mapDataForGarp(liveData);
            const metrics = _calculateGarpScorecardMetrics(garpData);
            
            const profile = liveData.profile?.[0] || {};
            document.getElementById('modal-company-name').textContent = `${profile.companyName || 'N/A'} (${profile.symbol || ''})`;
            document.getElementById('modal-stock-price').textContent = profile.price ? `$${Number(profile.price).toFixed(2)}` : 'N/A';
            document.getElementById('modal-last-updated').textContent = `Live Data (just now)`;
            populateGarpScorecardInModal(metrics);
            populateRawDataModal(garpData);
            
            const dataToSave = { ...garpData, garpConvictionScore: metrics.garpConvictionScore, timestamp: new Date().toISOString() };
            currentModalDataToSave = dataToSave;
            
        } else {
             document.getElementById('modal-ai-summary-content').innerHTML = '<p class="text-center text-red-500">Could not fetch financial data.</p>';
             document.getElementById('modal-raw-data-content').innerHTML = '';
             currentModalDataToSave = null;
        }
    }

    function mapDataForGarp(fetchedData) {
        // This function now creates the exact data structure that will be saved and used for raw data view
        return {
            profile: fetchedData.profile,
            income_statement_annual: fetchedData.incomeStatement,
            key_metrics_ttm: fetchedData.key_metrics_ttm,
            ratios_ttm: fetchedData.ratios_ttm,
            analyst_estimates: fetchedData.analyst_estimates,
            key_metrics_annual: fetchedData.keyMetrics,
            ratios_annual: fetchedData.ratios,
        };
    }

    async function fetchFullTickerDetails(symbol) {
        if (!appConfig.fmpApiKey) return null;
        const apiKey = appConfig.fmpApiKey;
        
        const endpoints = {
            profile: `https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${apiKey}`,
            keyMetrics: `https://financialmodelingprep.com/api/v3/key-metrics/${symbol}?period=annual&limit=10&apikey=${apiKey}`,
            ratios: `https://financialmodelingprep.com/api/v3/ratios/${symbol}?period=annual&limit=10&apikey=${apiKey}`,
            incomeStatement: `https://financialmodelingprep.com/api/v3/income-statement/${symbol}?period=annual&limit=10&apikey=${apiKey}`,
            key_metrics_ttm: `https://financialmodelingprep.com/api/v3/key-metrics-ttm/${symbol}?apikey=${apiKey}`,
            ratios_ttm: `https://financialmodelingprep.com/api/v3/ratios-ttm/${symbol}?apikey=${apiKey}`,
            analyst_estimates: `https://financialmodelingprep.com/api/v3/analyst-estimates/${symbol}?apikey=${apiKey}`,
        };

        try {
            const promises = Object.values(endpoints).map(url => fetch(url).then(async (res) => {
                if (!res.ok) {
                    // For errors like 429, the response body might contain useful info
                    const errorBody = await res.text();
                    console.warn(`HTTP error ${res.status} for ${url}:`, errorBody);
                    return { error: `HTTP error ${res.status}` }; // Return an error object
                }
                return res.json();
            }));

            const results = await Promise.allSettled(promises);
            
            const data = {};
            const keys = Object.keys(endpoints);

            results.forEach((result, index) => {
                const key = keys[index];
                if (result.status === 'fulfilled') {
                    // Check if FMP returned an error message in a 200 OK response
                    if (result.value && result.value["Error Message"]) {
                         console.warn(`API returned an error for ${keys[index]} (${symbol}):`, result.value["Error Message"]);
                         data[key] = []; // Treat as no data
                    } else {
                         data[key] = result.value;
                    }
                } else {
                    console.warn(`Failed to fetch data for ${keys[index]} (${symbol}):`, result.reason);
                    data[key] = []; // Treat as no data
                }
            });

            return data;

        } catch (error) {
            console.error(`A critical error occurred while fetching details for ${symbol}:`, error);
            return null;
        }
    }
    
    function populateGarpScorecardInModal(metrics) {
        const contentEl = document.getElementById('modal-ai-summary-content');
        if (!contentEl) return;
        
        const tempContainer = document.createElement('div');
        renderGarpScorecardDashboard(tempContainer, metrics);
        renderGarpInterpretationAnalysis(tempContainer, metrics);
        
        contentEl.innerHTML = tempContainer.innerHTML;
    }

    function populateRawDataModal(data) {
        const contentEl = document.getElementById('modal-raw-data-content');
        if (!data) {
            contentEl.innerHTML = '<p class="text-center text-red-500">No raw data available to display.</p>';
            return;
        }
        const formattedJson = JSON.stringify(data, null, 2);
        contentEl.innerHTML = `<pre><code>${formattedJson}</code></pre>`;
    }
    
    // --- Run the initialization function ---
    initialize();

});
