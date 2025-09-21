// Version 5.5.0
document.addEventListener("DOMContentLoaded", () => {
    // --- 1. Global Configuration Object ---
    const appConfig = {
        fmpApiKey: "",
        geminiApiKey: "",
        searchApiKey: "",
        searchEngineId: "",
        googleClientId: "",
        firebaseConfig: {},
        cachedStockInfo: {}
    };
    
    let db = null;
    let savedStocks = new Set();
    let sessionTimer = null;
    let advancedScreenerData = [];
    let currentSort = { key: 'marketCap', direction: 'desc' };


    // --- Utility to pause execution ---
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // --- 2. DOM Element Selection ---
    const apiKeyModal = document.getElementById('apiKeyModal');
    const apiKeyForm = document.getElementById('apiKeyForm');
    const errorMessage = document.getElementById('api-key-error');
    const geminiApiKeyInput = document.getElementById('geminiApiKeyInput');
    const googleClientIdInput = document.getElementById('googleClientIdInput');
    const webSearchApiKeyInput = document.getElementById('webSearchApiKeyInput');
    const searchEngineIdInput = document.getElementById('searchEngineIdInput');
    const fmpApiKeyInput = document.getElementById('fmpApiKeyInput');
    const firebaseConfigInput = document.getElementById('firebaseConfigInput');
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const advancedScreenerFilterForm = document.getElementById('advancedScreenerFilterForm');
    const financialsModal = document.getElementById('financialsModal');
    const financialsModalOverlay = document.getElementById('financialsModalOverlay');
    const financialsModalCloseBtn = document.getElementById('financialsModalCloseBtn');
    const refreshFinancialsBtn = document.getElementById('refreshFinancialsBtn');
    const appContent = document.getElementById('appContent');
    const financialsModalTabs = document.getElementById('financials-modal-tabs');
    // Auth Elements
    const googleSignInBtn = document.getElementById('googleSignInBtn');
    const signOutBtn = document.getElementById('signOutBtn');
    const authUserInfo = document.getElementById('auth-user-info');
    const userEmailSpan = document.getElementById('user-email');
    // Batch Calculation Elements
    const calculateSimpleScreenerScoresBtn = document.getElementById('calculateSimpleScreenerScoresBtn');
    const simpleScreenerStatus = document.getElementById('simpleScreenerStatus');
    const calculateAdvancedScreenerScoresBtn = document.getElementById('calculateAdvancedScreenerScoresBtn');
    const advancedScreenerStatus = document.getElementById('advancedScreenerStatus');


    // --- NEW: DATA PROCESSING LOGIC FROM STOCK RESEARCH HUB ---

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
    function _calculateGarpScorecardMetrics(data) {
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
        let weightedScore = 0;
        let totalWeight = 0;

        for (const key in metrics) {
            const metric = metrics[key];
            const multiplier = _getMetricScoreMultiplier(key, metric.value);

            totalWeight += metric.weight;
            weightedScore += metric.weight * multiplier;

            // Restore the isMet property for UI coloring (pass >= 1.0)
            metric.isMet = multiplier >= 1.0;
            
            metric.interpretation = _getMetricInterpretation(key, metric.value);
        }

        const rawScore = (weightedScore / totalWeight) * 100;
        
        // Cap the final score at 100 and handle potential NaN results
        metrics.garpConvictionScore = Math.round(Math.min(100, rawScore) || 0);
        
        return metrics;
    }

    function renderGarpScorecardDashboard(container, metrics) {
        if (!container) return;

        const tilesHtml = Object.entries(metrics).map(([name, data]) => {
            if (name === 'garpConvictionScore') return '';
            let valueDisplay = 'N/A';
            let colorClass = 'text-gray-500 italic';

            if (typeof data.value === 'number' && isFinite(data.value)) {
                colorClass = data.isMet ? 'price-gain' : 'price-loss';
                if (data.format === 'percent') {
                    valueDisplay = `${(data.value * 100).toFixed(2)}%`;
                } else {
                    valueDisplay = data.value.toFixed(2);
                }
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
            'Growth': ['EPS Growth (5Y)', 'EPS Growth (Next 1Y)', 'Revenue Growth (5Y)'],
            'Profitability': ['Return on Equity', 'Return on Invested Capital'],
            'Valuation & Debt': ['P/E (TTM)', 'Forward P/E', 'PEG Ratio', 'P/S Ratio', 'Debt-to-Equity']
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
            searchApiKey: webSearchApiKeyInput.value.trim(),
            searchEngineId: searchEngineIdInput.value.trim(),
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
            
            // Initialize Firebase here, after getting the config
            try {
                if (!firebase.apps.length) {
                    firebase.initializeApp(appConfig.firebaseConfig);
                }
                db = firebase.database();
                console.log("Firebase initialized successfully.");

                // NOW, attach the auth listener
                firebase.auth().onAuthStateChanged(user => {
                    if (user) {
                        // User is signed in.
                        console.log("User signed in:", user.email);
                        userEmailSpan.textContent = user.email;
                        googleSignInBtn.style.display = 'none';
                        authUserInfo.style.display = 'block';
                        
                        startSessionTimer();
                        hideModal();
                        startApp();
                    } else {
                        // User is signed out.
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
            'screener-tab-button': 'screener-tab-content',
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
        
        setActiveTab('screener-tab-button');
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
        populateIndustryDropdown();

        calculateSimpleScreenerScoresBtn.addEventListener('click', () => {
            const symbolNodes = document.querySelectorAll('#screener-tab-content .ticker-details-btn');
            const symbols = Array.from(symbolNodes).map(btn => btn.dataset.symbol);
            const uniqueSymbols = [...new Set(symbols)];
            runBatchConvictionScores(uniqueSymbols, 'simpleScreenerStatus');
        });

        calculateAdvancedScreenerScoresBtn.addEventListener('click', () => {
            const symbols = advancedScreenerData.map(stock => stock.symbol);
            runBatchConvictionScores(symbols, 'advancedScreenerStatus');
        });
        
        appContent.addEventListener('click', (e) => {
            const saveBtn = e.target.closest('.save-stock-btn');
            if (saveBtn && saveBtn.dataset.symbol) {
                toggleSaveStock(saveBtn.dataset.symbol);
            }
        });

        await loadAllCachedInfo();

        // Initialize Advanced Screener with default values
        fetchAdvancedStockScreener();

        const exchanges = ['nasdaq', 'nyse', 'amex'];
        
        for (const exchange of exchanges) {
            console.log(`Initializing components for ${exchange.toUpperCase()}...`);
            await initExchangeData(exchange);
            console.log(`Completed ${exchange.toUpperCase()}.`);
        }
        console.log("All data loaded.");
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
                 // Sort array of objects by the first value of each object
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
        renderSavedStocksTable(); // Re-render the saved stocks table
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

    // --- 9. Data Initialization for Each Exchange ---
    async function initExchangeData(exchange) {
        const exchangeUpperCase = exchange.toUpperCase();
        // Simple Screener Accordion
        const screenerAccordionButton = document.getElementById(`${exchange}-accordion-button`);
        const screenerAccordionContent = document.getElementById(`${exchange}-accordion-content`);
        const screenerAccordionIcon = document.getElementById(`${exchange}-accordion-icon`);
        // Data Containers
        const tableContainer = document.getElementById(`${exchange}-screener-data-container`);
        const cardContainer = document.getElementById(`${exchange}-card-view`);

        setupAccordionToggle(screenerAccordionButton, screenerAccordionContent, screenerAccordionIcon);
        
        await fetchSimpleStockScreener(exchangeUpperCase, tableContainer, cardContainer);
    }

    // --- 10. Accordion Toggle Logic ---
    function setupAccordionToggle(button, content, icon) {
        if (!button) return;
        button.addEventListener('click', () => {
            const isOpen = content.style.maxHeight && content.style.maxHeight !== "0px";
            content.style.maxHeight = isOpen ? "0px" : content.scrollHeight + "px";
            if(icon) icon.style.transform = isOpen ? "rotate(0deg)" : "rotate(180deg)";
        });
    }

    // --- 11. Screener Fetching & Sorting Functions ---
    async function fetchSimpleStockScreener(exchange, tableEl, cardEl) {
        const loadingMsg = `<p class="text-gray-500">Loading screener for ${exchange}...</p>`;
        if(tableEl) tableEl.innerHTML = loadingMsg;
        if(cardEl) cardEl.innerHTML = loadingMsg;

        if (!appConfig.fmpApiKey) {
            const errorMsg = '<p class="text-red-500">Financial Modeling Prep API Key is missing.</p>';
            if(tableEl) tableEl.innerHTML = errorMsg;
            if(cardEl) cardEl.innerHTML = errorMsg;
            return [];
        }

        const url = `https://financialmodelingprep.com/api/v3/stock-screener?marketCapMoreThan=1000000000&exchange=${exchange}&limit=1000&apikey=${appConfig.fmpApiKey}`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`API request failed: ${response.status}`);
            const data = await response.json();
            
            renderSimpleStockTable(data, tableEl);
            renderStockCards(data, cardEl, exchange);
            return data;
        } catch (error) {
            console.error(`Error fetching simple screener data for ${exchange}:`, error);
            const errorMsg = `<p class="text-red-500">Error fetching data for ${exchange}.</p>`;
             if(tableEl) tableEl.innerHTML = errorMsg;
            if(cardEl) cardEl.innerHTML = errorMsg;
            return [];
        }
    }
    
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

        let url = `https://financialmodelingprep.com/api/v3/stock-screener?apikey=${appConfig.fmpApiKey}&limit=1000&isEtf=false&isFund=false&dividendYieldMoreThan=0.00001`;
        
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

            data.forEach(stock => {
                const cachedInfo = appConfig.cachedStockInfo[stock.symbol];
                stock.cachedTimestamp = cachedInfo?.timestamp ? new Date(cachedInfo.timestamp).getTime() : null;
                stock.dividendYield = stock.dividendYieldPercentage || null;
            });
            
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
        renderAdvancedStockTable(sortedData, document.getElementById('advanced-screener-data-container'));
    }

    // --- 12. Batch Score Calculation ---
    async function runBatchConvictionScores(symbols, statusElementId) {
        const statusEl = document.getElementById(statusElementId);
        if (!symbols || symbols.length === 0) {
            if (statusEl) statusEl.textContent = 'No stocks to process.';
            return;
        }

        const oneDay = 24 * 60 * 60 * 1000;
        let processedCount = 0;
        let skippedCount = 0;

        for (const [index, symbol] of symbols.entries()) {
            if (statusEl) {
                statusEl.innerHTML = `Processing ${index + 1} of ${symbols.length}: <strong>${symbol}</strong>...`;
            }

            const cached = appConfig.cachedStockInfo[symbol];
            if (cached && cached.timestamp && (new Date() - new Date(cached.timestamp)) < oneDay) {
                skippedCount++;
                continue;
            }

            const liveData = await fetchTickerDetails(symbol);
            if (liveData) {
                const garpData = mapDataForGarp(liveData);
                const metrics = _calculateGarpScorecardMetrics(garpData);
                
                const newTimestamp = new Date().toISOString();
                const dataToSave = { ...garpData, news: liveData.news, garpConvictionScore: metrics.garpConvictionScore, timestamp: newTimestamp };
                
                await saveTickerDetailsToFirebase(symbol, dataToSave);
                appConfig.cachedStockInfo[symbol] = { rating: metrics.garpConvictionScore, timestamp: newTimestamp };
                
                updateRatingDisplayForSymbol(symbol);
                updateRatingDateDisplayForSymbol(symbol);
                updateScreenerAndRerender(symbol, new Date(newTimestamp).getTime());
                processedCount++;
            }
            
            await delay(600);
        }

        if (statusEl) {
            statusEl.textContent = `Batch complete. Processed: ${processedCount}, Skipped (recent): ${skippedCount}.`;
        }
    }

    // --- 13. Firebase Functions ---
    async function saveTickerDetailsToFirebase(symbol, data) {
        if (!db) return;
        try {
            await db.ref(`financial-details/${symbol}`).set(data);
            console.log(`Details for ${symbol} saved to Firebase.`);
        } catch (error) {
            console.error(`Failed to save details for ${symbol}:`, error);
        }
    }

    async function loadTickerDetailsFromFirebase(symbol) {
        if (!db) return null;
        try {
            const snapshot = await db.ref(`financial-details/${symbol}`).get();
            return snapshot.exists() ? snapshot.val() : null;
        } catch (error) {
            console.error(`Failed to load details for ${symbol} from Firebase:`, error);
            return null;
        }
    }
    
    async function getAllCachedSymbols() {
        if(!db) return new Set();
        try {
            const snapshot = await db.ref('financial-details').get();
            return snapshot.exists() ? new Set(Object.keys(snapshot.val())) : new Set();
        } catch (error) {
            console.error("Failed to get all cached symbols:", error);
            return new Set();
        }
    }
    
    async function loadAllCachedInfo() {
        if (!db) return;
        try {
            const snapshot = await db.ref('financial-details').get();
            if (snapshot.exists()) {
                const allDetails = snapshot.val();
                for (const symbol in allDetails) {
                    // Check for the new garpConvictionScore, otherwise don't cache a rating
                    if (allDetails[symbol].garpConvictionScore && allDetails[symbol].timestamp) {
                        appConfig.cachedStockInfo[symbol] = { 
                            rating: allDetails[symbol].garpConvictionScore, // Store score as 'rating' for UI
                            timestamp: allDetails[symbol].timestamp 
                        };
                    }
                }
                console.log("Successfully loaded all cached stock info (scores and timestamps).");
            }
        } catch(error) {
            console.error("Could not load cached stock info from Firebase:", error);
        }
    }

    // --- 16. Rendering Functions ---
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
    
    function updateViewedIndicatorForSymbol(symbol) {
        const indicators = document.querySelectorAll(`.viewed-indicator[data-indicator-symbol="${symbol}"]`);
        indicators.forEach(indicator => {
            indicator.innerHTML = '👁️';
            indicator.title = "You have viewed the details for this stock."
        });
    }

    async function updateViewedIndicators() {
        const cachedSymbols = await getAllCachedSymbols();
        const indicators = document.querySelectorAll('.viewed-indicator');
        indicators.forEach(indicator => {
            if (cachedSymbols.has(indicator.dataset.indicatorSymbol)) {
                indicator.innerHTML = '👁️';
                indicator.title = "You have viewed the details for this stock."
            } else {
                indicator.innerHTML = '';
            }
        });
    }

    function getRatingHtml(symbol) {
        const score = appConfig.cachedStockInfo[symbol]?.rating;
        if (score === null || typeof score === 'undefined') return 'N/A';
        
        let scoreClass = 'text-red-600';
        if (score > 75) scoreClass = 'text-green-600';
        else if (score > 50) scoreClass = 'text-yellow-600';

        return `<span class="${scoreClass} font-medium">${score}</span>`;
    }
    
    function updateRatingDisplayForSymbol(symbol) {
        document.querySelectorAll(`[data-rating-symbol="${symbol}"]`).forEach(cell => {
            cell.innerHTML = getRatingHtml(symbol);
        });
    }

    function getRatingDateHtml(symbol) {
        const timestamp = appConfig.cachedStockInfo[symbol]?.timestamp;
        if (!timestamp) return '';
        return `<span class="text-xs text-gray-400">as of ${formatDate(timestamp)}</span>`;
    }

    function updateRatingDateDisplayForSymbol(symbol) {
        document.querySelectorAll(`[data-rating-date-symbol="${symbol}"]`).forEach(el => {
            el.innerHTML = getRatingDateHtml(symbol);
        });
    }

    function renderSimpleStockTable(data, container) {
        if (!container) return;
        if (!data || data.length === 0) {
            container.innerHTML = '<p class="text-gray-500">No stock data found.</p>';
            return;
        }
        const tableRows = data.map(stock => {
            const isSaved = savedStocks.has(stock.symbol);
            return `
            <tr data-symbol-row="${stock.symbol}" class="${isSaved ? 'saved-stock-row' : ''}">
                <td class="px-4 py-3 whitespace-nowrap text-sm">
                     <button class="save-stock-btn ${isSaved ? 'saved' : ''}" data-symbol="${stock.symbol}" title="Save Stock">
                        <i class="${isSaved ? 'fas' : 'far'} fa-star"></i>
                    </button>
                    <button class="ticker-details-btn font-medium text-indigo-600 hover:text-indigo-800" data-symbol="${stock.symbol}">${stock.symbol}</button>
                    <span class="viewed-indicator" data-indicator-symbol="${stock.symbol}"></span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600">${formatText(stock.companyName)}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">${formatMarketCap(stock.marketCap)}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">${formatText(stock.sector)}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-center" data-rating-symbol="${stock.symbol}">${getRatingHtml(stock.symbol)}</td>
            </tr>`;
        }).join('');
        container.innerHTML = `<div class="overflow-x-auto max-h-96"><table class="min-w-full divide-y divide-gray-200"><thead class="bg-gray-50 sticky top-0"><tr><th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Symbol</th><th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th><th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Market Cap</th><th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sector</th><th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Conviction Score</th></tr></thead><tbody class="bg-white divide-y divide-gray-200">${tableRows}</tbody></table></div>`;
        updateViewedIndicators();
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
            getSortableHeaderHtml('lastAnnualDividend', 'Dividend', 'w-[6%]', 'right'),
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
                     <span class="viewed-indicator" data-indicator-symbol="${stock.symbol}"></span>
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
                 <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">${stock.dividendYield ? stock.dividendYield.toFixed(2) + '%' : 'N/A'}</td>
                 <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">${formatDate(stock.cachedTimestamp)}</td>
            </tr>`;
        }).join('');
        container.innerHTML = `<div class="overflow-y-auto max-h-[60vh]"><table class="w-full table-fixed divide-y divide-gray-200"><thead class="bg-gray-50 sticky top-0"><tr>${headers}</tr></thead><tbody class="bg-white divide-y divide-gray-200">${tableRows}</tbody></table></div>`;
        updateViewedIndicators();
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
                const isSaved = savedStocks.has(stock.symbol); // Should always be true here
                return `
                <tr data-symbol-row="${stock.symbol}" class="saved-stock-row">
                    <td class="px-4 py-3 whitespace-nowrap text-sm">
                        <button class="save-stock-btn ${isSaved ? 'saved' : ''}" data-symbol="${stock.symbol}" title="Save Stock">
                            <i class="${isSaved ? 'fas' : 'far'} fa-star"></i>
                        </button>
                        <button class="ticker-details-btn font-medium text-indigo-600 hover:text-indigo-800" data-symbol="${stock.symbol}">${stock.symbol}</button>
                        <span class="viewed-indicator" data-indicator-symbol="${stock.symbol}"></span>
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
            updateViewedIndicators();

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
                                                <button class="ticker-details-btn text-left w-full" data-symbol="${stock.symbol}">${stock.symbol}
                                                    <span class="viewed-indicator" data-indicator-symbol="${stock.symbol}"></span>
                                                </button>
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
        updateViewedIndicators();
    }

    // --- 17. Financials Modal Logic ---
    function updateScreenerAndRerender(symbol, newTimestamp) {
        const stockInScreener = advancedScreenerData.find(s => s.symbol === symbol);
        if (stockInScreener) {
            stockInScreener.cachedTimestamp = newTimestamp;
        }

        const tableContainerParent = document.getElementById('advanced-screener-data-container');
        if (tableContainerParent) {
            const tableContainer = tableContainerParent.querySelector('.overflow-y-auto');
            const scrollPos = tableContainer ? tableContainer.scrollTop : 0;
            
            sortAndRerenderAdvancedTable();

            if (tableContainer) {
                setTimeout(() => {
                    tableContainer.scrollTop = scrollPos;
                }, 0);
            }
        }
    }

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
                document.getElementById('modal-key-metrics-content').innerHTML = '<p class="text-center text-gray-500">Refreshing data...</p>';
                document.getElementById('modal-financial-trends-content').innerHTML = '<p class="text-center text-gray-500">Refreshing trend data...</p>';
                document.getElementById('modal-news-content').innerHTML = '<p class="text-center text-gray-500">Refreshing news...</p>';

                const liveData = await fetchTickerDetails(symbol, true); // Force refresh
                if (liveData) {
                    const garpData = mapDataForGarp(liveData);
                    const metrics = _calculateGarpScorecardMetrics(garpData);
                    
                    populateFinancialsModal(liveData);
                    populateFinancialTrends(liveData);
                    populateRawDataModal(liveData);
                    populateNewsTab(liveData.news, null);
                    populateGarpScorecardInModal(metrics);
                    
                    const dataToSave = { ...liveData, garpConvictionScore: metrics.garpConvictionScore, timestamp: new Date().toISOString() };
                    await saveTickerDetailsToFirebase(symbol, dataToSave);
                    appConfig.cachedStockInfo[symbol] = { rating: metrics.garpConvictionScore, timestamp: dataToSave.timestamp };
                    
                    updateRatingDisplayForSymbol(symbol);
                    updateRatingDateDisplayForSymbol(symbol);
                    updateScreenerAndRerender(symbol, new Date(dataToSave.timestamp).getTime());
                } else {
                    document.getElementById('modal-key-metrics-content').innerHTML = '<p class="text-center text-red-500">Could not refresh data.</p>';
                }
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

    async function handleTickerClick(symbol) {
        showFinancialsModal();
        refreshFinancialsBtn.dataset.symbol = symbol;
        // Reset UI
        document.getElementById('modal-ai-summary-content').innerHTML = '<p class="text-center text-gray-500">Loading GARP analysis...</p>';
        document.getElementById('modal-key-metrics-content').innerHTML = '<p class="text-center text-gray-500">Loading financial data...</p>';
        document.getElementById('modal-raw-data-content').innerHTML = '<p class="text-center text-gray-500">Loading raw data...</p>';
        document.getElementById('modal-financial-trends-content').innerHTML = '<p class="text-center text-gray-500">Loading trend data...</p>';
        document.getElementById('modal-news-content').innerHTML = '<p class="text-center text-gray-500">Loading news...</p>';
        document.getElementById('modal-company-name').textContent = `Loading... (${symbol})`;
        document.getElementById('modal-stock-price').textContent = '';
        document.getElementById('modal-last-updated').textContent = '...';
         // Reset to first tab
        financialsModalTabs.querySelectorAll('.modal-tab-button').forEach(btn => btn.classList.remove('active'));
        financialsModalTabs.querySelector('button').classList.add('active');
        document.querySelectorAll('.modal-tab-content').forEach(content => content.classList.remove('active'));
        document.querySelector('#modal-ai-summary-content').classList.add('active');

        const cachedData = await loadTickerDetailsFromFirebase(symbol);
        if (cachedData && cachedData.key_metrics_annual) { // Check for a key that confirms new format
            const metrics = _calculateGarpScorecardMetrics(cachedData);
            populateFinancialsModal(cachedData);
            populateFinancialTrends(cachedData);
            populateRawDataModal(cachedData);
            populateNewsTab(cachedData.news, cachedData.timestamp);
            populateGarpScorecardInModal(metrics);
        } else {
            const liveData = await fetchTickerDetails(symbol);
             if (liveData) {
                const garpData = mapDataForGarp(liveData);
                const metrics = _calculateGarpScorecardMetrics(garpData);
                
                populateFinancialsModal(liveData);
                populateFinancialTrends(liveData);
                populateRawDataModal(liveData);
                populateNewsTab(liveData.news, null);
                populateGarpScorecardInModal(metrics);
                
                const newTimestamp = new Date().toISOString();
                const dataToSave = { ...garpData, news: liveData.news, garpConvictionScore: metrics.garpConvictionScore, timestamp: newTimestamp };
                await saveTickerDetailsToFirebase(symbol, dataToSave);
                appConfig.cachedStockInfo[symbol] = { rating: metrics.garpConvictionScore, timestamp: newTimestamp };
                
                updateRatingDisplayForSymbol(symbol);
                updateRatingDateDisplayForSymbol(symbol);
                updateScreenerAndRerender(symbol, new Date(newTimestamp).getTime());
            } else {
                 document.getElementById('modal-key-metrics-content').innerHTML = '<p class="text-center text-red-500">Could not fetch financial data.</p>';
                 document.getElementById('modal-ai-summary-content').innerHTML = '';
                 document.getElementById('modal-raw-data-content').innerHTML = '';
                 document.getElementById('modal-financial-trends-content').innerHTML = '';
                 document.getElementById('modal-news-content').innerHTML = '';
            }
        }
        updateViewedIndicatorForSymbol(symbol);
    }

    function mapDataForGarp(fetchedData) {
        return {
            profile: fetchedData.profile,
            income_statement_annual: fetchedData.incomeStatement,
            key_metrics_ttm: fetchedData.key_metrics_ttm,
            ratios_ttm: fetchedData.ratios_ttm,
            analyst_estimates: fetchedData.analyst_estimates,
            key_metrics_annual: fetchedData.keyMetrics,
            ratios_annual: fetchedData.ratios,
            balance_sheet_statement_annual: fetchedData.balanceSheet,
            cash_flow_statement_annual: fetchedData.cashFlow
        };
    }


    async function fetchTickerDetails(symbol) {
        if (!appConfig.fmpApiKey) return null;
        const apiKey = appConfig.fmpApiKey;
        const endpoints = {
            profile: `https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${apiKey}`,
            keyMetrics: `https://financialmodelingprep.com/api/v3/key-metrics/${symbol}?period=annual&limit=10&apikey=${apiKey}`,
            ratios: `https://financialmodelingprep.com/api/v3/ratios/${symbol}?period=annual&limit=10&apikey=${apiKey}`,
            incomeStatement: `https://financialmodelingprep.com/api/v3/income-statement/${symbol}?period=annual&limit=10&apikey=${apiKey}`,
            balanceSheet: `https://financialmodelingprep.com/api/v3/balance-sheet-statement/${symbol}?period=annual&limit=10&apikey=${apiKey}`,
            cashFlow: `https://financialmodelingprep.com/api/v3/cash-flow-statement/${symbol}?period=annual&limit=10&apikey=${apiKey}`,
            key_metrics_ttm: `https://financialmodelingprep.com/api/v3/key-metrics-ttm/${symbol}?apikey=${apiKey}`,
            ratios_ttm: `https://financialmodelingprep.com/api/v3/ratios-ttm/${symbol}?apikey=${apiKey}`,
            analyst_estimates: `https://financialmodelingprep.com/api/v3/analyst-estimates/${symbol}?apikey=${apiKey}`,
            generalNews: `https://financialmodelingprep.com/stable/news/stock?symbols=${symbol}&limit=20&apikey=${apiKey}`,
            priceTargetNews: `https://financialmodelingprep.com/stable/price-target-news?symbol=${symbol}&limit=10&apikey=${apiKey}`,
            stockGradeNews: `https://financialmodelingprep.com/stable/grades-news?symbol=${symbol}&limit=10&apikey=${apiKey}`,
        };

        try {
            const promises = Object.values(endpoints).map(url => fetch(url).then(res => res.json()));
            const results = await Promise.allSettled(promises);
            
            const data = {};
            const keys = Object.keys(endpoints);

            results.forEach((result, index) => {
                const key = keys[index];
                if (result.status === 'fulfilled') {
                    data[key] = result.value;
                } else {
                    console.warn(`Failed to fetch data for ${key} (${symbol}):`, result.reason);
                    data[key] = []; // Default to empty array on failure
                }
            });

            const { generalNews, priceTargetNews, stockGradeNews } = data;

            // Normalize and combine news
            const normalizedGeneralNews = (generalNews || []).map(item => ({
                type: 'General',
                title: item.title,
                site: item.site,
                url: item.url,
                publishedDate: item.publishedDate || new Date().toISOString()
            }));

            const normalizedPriceTargetNews = (priceTargetNews || []).map(item => ({
                type: 'Price Target',
                title: item.newsTitle,
                site: item.newsPublisher,
                url: item.newsURL,
                publishedDate: item.publishedDate || new Date().toISOString(),
                analyst: `${item.analystName || 'N/A'} @ ${item.analystCompany || 'N/A'}`,
                priceTarget: item.priceTarget
            }));
            
            const normalizedGradeNews = (stockGradeNews || []).map(item => ({
                type: 'Grade Change',
                title: `Grade Change by ${item.gradingCompany}: ${item.previousGrade} → ${item.newGrade}`,
                site: item.gradingCompany,
                url: '#', 
                publishedDate: item.date || new Date().toISOString(),
                previousGrade: item.previousGrade,
                newGrade: item.newGrade
            }));
            
            const combinedNews = [...normalizedGeneralNews, ...normalizedPriceTargetNews, ...normalizedGradeNews]
                .sort((a, b) => new Date(b.publishedDate) - new Date(a.publishedDate));

            return { ...data, news: combinedNews };

        } catch (error) {
            console.error(`A critical error occurred while fetching details for ${symbol}:`, error);
            return null;
        }
    }
    
    function populateGarpScorecardInModal(metrics) {
        const contentEl = document.getElementById('modal-ai-summary-content');
        if (!contentEl) return;
        // Create a temporary container to render into
        const tempContainer = document.createElement('div');
        renderGarpScorecardDashboard(tempContainer, metrics);
        renderGarpInterpretationAnalysis(tempContainer, metrics);
        // Set the modal content to the rendered HTML
        contentEl.innerHTML = tempContainer.innerHTML;
    }


    function populateFinancialsModal(data) {
        const profile = data.profile?.[0] || {};
        const metrics = (data.key_metrics_annual || data.keyMetrics)?.[0] || {};
        const ratios = (data.ratios_annual || data.ratios)?.[0] || {};
        const income = (data.income_statement_annual || data.incomeStatement)?.[0] || {};
        const { timestamp } = data;
        
        const format = (value, prefix = '', suffix = '', digits = 2) => {
            return (value !== null && typeof value !== 'undefined' && !isNaN(value)) ? `${prefix}${Number(value).toFixed(digits)}${suffix}` : 'N/A';
        };

        const eps = metrics.netIncomePerShare;
        const bvps = metrics.bookValuePerShare;
        let grahamNumber = null;
        if (eps > 0 && bvps > 0) {
            grahamNumber = Math.sqrt(22.5 * eps * bvps);
        }
        
        document.getElementById('modal-company-name').textContent = `${profile.companyName || 'N/A'} (${profile.symbol || ''})`;
        document.getElementById('modal-stock-price').textContent = format(profile.price, '$');
        if (timestamp) {
            document.getElementById('modal-last-updated').textContent = `Cached: ${formatDate(timestamp)}`;
        } else {
             document.getElementById('modal-last-updated').textContent = `Live Data (just now)`;
        }

        const contentEl = document.getElementById('modal-key-metrics-content');
        contentEl.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
                <div class="space-y-3">
                    <h4 class="font-semibold text-gray-700 border-b pb-2">Valuation Ratios (Annual)</h4>
                    <div class="flex justify-between text-sm"><span class="text-gray-500">P/E Ratio</span><span class="font-medium">${format(metrics.peRatio)}</span></div>
                    <div class="flex justify-between text-sm"><span class="text-gray-500">Price to Sales</span><span class="font-medium">${format(metrics.priceToSalesRatio)}</span></div>
                    <div class="flex justify-between text-sm"><span class="text-gray-500">Price to Book</span><span class="font-medium">${format(metrics.pbRatio)}</span></div>
                    <div class="flex justify-between text-sm"><span class="text-gray-500">EV/EBITDA</span><span class="font-medium">${format(metrics.enterpriseValueOverEBITDA)}</span></div>
                    <div class="flex justify-between text-sm"><span class="text-gray-500">Graham Number</span><span class="font-medium">${format(grahamNumber, '$')}</span></div>
                </div>
                <div class="space-y-3">
                    <h4 class="font-semibold text-gray-700 border-b pb-2">Financial Health (Annual)</h4>
                    <div class="flex justify-between text-sm"><span class="text-gray-500">Debt to Equity</span><span class="font-medium">${format(metrics.debtToEquity)}</span></div>
                    <div class="flex justify-between text-sm"><span class="text-gray-500">Return on Equity (ROE)</span><span class="font-medium">${format(metrics.roe * 100, '', '%')}</span></div>
                     <div class="flex justify-between text-sm"><span class="text-gray-500">Operating Margin</span><span class="font-medium">${format(((ratios.operatingMargin || (income.operatingIncome / income.revenue)) || 0) * 100, '', '%')}</span></div>
                    <div class="flex justify-between text-sm"><span class="text-gray-500">Net Profit Margin</span><span class="font-medium">${format((ratios.netProfitMargin || 0) * 100, '', '%')}</span></div>
                </div>
                <div class="space-y-3">
                    <h4 class="font-semibold text-gray-700 border-b pb-2">Dividend Info (Annual)</h4>
                     <div class="flex justify-between text-sm"><span class="text-gray-500">Dividend Yield</span><span class="font-medium">${format((metrics.dividendYield || 0) * 100, '', '%')}</span></div>
                    <div class="flex justify-between text-sm"><span class="text-gray-500">Payout Ratio</span><span class="font-medium">${format((ratios.payoutRatio || 0) * 100, '', '%')}</span></div>
                </div>
            </div>
        `;
    }
    
    function populateFinancialTrends(data) {
        const contentEl = document.getElementById('modal-financial-trends-content');
        
        const metrics = data.key_metrics_annual ? [...data.key_metrics_annual].reverse() : (data.keyMetrics ? [...data.keyMetrics].reverse() : []);
        const income = data.income_statement_annual ? [...data.income_statement_annual].reverse() : (data.incomeStatement ? [...data.incomeStatement].reverse() : []);
        const cashflow = data.cash_flow_statement_annual ? [...data.cash_flow_statement_annual].reverse() : (data.cashFlow ? [...data.cashFlow].reverse() : []);

        if (metrics.length === 0 || income.length === 0) {
            contentEl.innerHTML = '<p class="text-center text-gray-500">Trend data is not available.</p>';
            return;
        }
        
        const formatNum = (val, type = 'default') => {
            if (val === null || typeof val === 'undefined' || isNaN(val)) return 'N/A';
            if (type === 'currency') {
                 if (Math.abs(val) >= 1e12) return `${(val / 1e12).toFixed(2)}T`;
                 if (Math.abs(val) >= 1e9) return `${(val / 1e9).toFixed(2)}B`;
                 if (Math.abs(val) >= 1e6) return `${(val / 1e6).toFixed(2)}M`;
                 return val.toFixed(2);
            }
            if (type === 'percent') return `${(val * 100).toFixed(2)}%`;
            if (type === 'eps') return val.toFixed(2);
            return val.toFixed(2);
        };

        const years = income.map(i => i.calendarYear);
        const headers = years.map(y => `<th class="px-3 py-2 text-xs text-right font-medium text-gray-500 uppercase tracking-wider">${y}</th>`).join('');

        const createRow = (title, dataArray, key, formatType) => {
            const cells = years.map(year => {
                const record = dataArray.find(d => d.calendarYear === year);
                const value = record ? record[key] : undefined;
                return `<td class="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-500">${formatNum(value, formatType)}</td>`;
            }).join('');
            return `<tr><td class="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">${title}</td>${cells}</tr>`;
        };

        const tableRows = [
            createRow('Revenue', income, 'revenue', 'currency'),
            createRow('Net Income', income, 'netIncome', 'currency'),
            createRow('EPS (Diluted)', income, 'epsdiluted', 'eps'),
            createRow('Return on Equity (ROE)', metrics, 'roe', 'percent'),
            createRow('Debt to Equity', metrics, 'debtToEquity', 'default'),
            createRow('Free Cash Flow', cashflow, 'freeCashFlow', 'currency')
        ].join('');

        contentEl.innerHTML = `
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metric</th>
                            ${headers}
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">${tableRows}</tbody>
                </table>
            </div>
        `;
    }

    function populateNewsTab(newsData, timestamp) {
        const contentEl = document.getElementById('modal-news-content');
        if (!newsData || newsData.length === 0) {
            contentEl.innerHTML = '<p class="text-center text-gray-500">No recent news found for this stock.</p>';
            return;
        }

        const timeString = timestamp ? `Last Fetched: ${formatDate(timestamp)}` : 'Live Data (just now)';
        let newsHtml = `<p class="text-xs text-gray-400 mb-3">${timeString}</p><div class="space-y-3 max-h-96 overflow-y-auto pr-2">`;
        
        newsHtml += newsData.map(news => {
            let detailsHtml = '';
            let title = formatText(news.title);
            let url = news.url || '#';
            let bgColor = 'bg-gray-50';
            let linkWrapper = (content) => `<a href="${url}" target="_blank" rel="noopener noreferrer" class="block ${bgColor} p-3 rounded-lg shadow-sm hover:bg-gray-100 transition-colors">${content}</a>`;

            if (news.type === 'Price Target') {
                detailsHtml = `
                    <span><strong>Publisher:</strong> ${formatText(news.site)}</span>
                    <span><strong>Analyst:</strong> ${formatText(news.analyst)}</span>
                    <span><strong>Target:</strong> ${news.priceTarget ? '$'+news.priceTarget.toFixed(2) : 'N/A'}</span>`;
            } else if (news.type === 'Grade Change') {
                bgColor = 'bg-blue-50';
                detailsHtml = `
                    <span><strong>Firm:</strong> ${formatText(news.site)}</span>
                    <span><strong>Previous:</strong> ${formatText(news.previousGrade)}</span>
                    <span><strong>New:</strong> ${formatText(news.newGrade)}</span>`;
                // Grade changes don't have a URL, so we don't wrap them in an <a> tag
                linkWrapper = (content) => `<div class="block ${bgColor} p-3 rounded-lg shadow-sm">${content}</div>`;
            } else { // General News
                detailsHtml = `<span><strong>Publisher:</strong> ${formatText(news.site)}</span>`;
            }

            const content = `
                <div class="flex justify-between items-start mb-1">
                     <p class="font-semibold text-gray-800 text-sm">${title}</p>
                    <p class="text-xs text-gray-500 whitespace-nowrap ml-4">${new Date(news.publishedDate).toLocaleDateString()}</p>
                </div>
                <div class="text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1 mt-2">
                   ${detailsHtml}
                </div>`;
            
            return linkWrapper(content);
        }).join('');

        newsHtml += `</div>`;
        contentEl.innerHTML = newsHtml;
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
