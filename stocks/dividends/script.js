// Version 5.5.0 (Dividend Focused)
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
    const appContent = document.getElementById('appContent');
    const financialsModalTabs = document.getElementById('financials-modal-tabs');
    // Auth Elements
    const googleSignInBtn = document.getElementById('googleSignInBtn');
    const signOutBtn = document.getElementById('signOutBtn');
    const authUserInfo = document.getElementById('auth-user-info');
    const userEmailSpan = document.getElementById('user-email');


    // --- DATA PROCESSING LOGIC - CONVERTED FOR DIVIDEND ANALYSIS ---

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
     * Analyzes a metric's value against Dividend criteria to provide a qualitative interpretation.
     * @param {string} metricName The name of the metric being analyzed.
     * @param {number|null} value The calculated value of the metric.
     * @returns {object} An object containing the category and explanatory text.
     */
    function _getDividendMetricInterpretation(metricName, value) {
        if (value === null || !isFinite(value)) {
            return { category: 'No Data', text: 'Data was not available to generate an interpretation for this metric.' };
        }

        switch (metricName) {
            case 'Dividend Yield':
                if (value > 0.10) return { category: 'Potential Yield Trap', text: 'An extremely high yield may be a warning sign of an impending dividend cut or underlying business problems.' };
                if (value > 0.04) return { category: 'High Yield', text: 'Indicates a strong income stream, attractive to income-focused investors.' };
                if (value > 0.015) return { category: 'Solid Yield', text: 'A healthy and likely sustainable yield that provides a decent income return.' };
                if (value > 0) return { category: 'Low Yield', text: 'The dividend provides a minimal income return, suggesting the company may be prioritizing growth or is in a low-payout sector.' };
                return { category: 'No Yield', text: 'The company does not currently pay a dividend.'};

            case 'Payout Ratio':
                if (value < 0) return { category: 'Warning Sign', text: 'A negative payout ratio indicates the company is unprofitable (negative EPS) but still paying a dividend, which is unsustainable.' };
                if (value > 0.8) return { category: 'High & Risky', text: 'The company is returning most of its earnings to shareholders, leaving little room for reinvestment, debt repayment, or safety in a downturn.' };
                if (value > 0.6) return { category: 'Moderate', text: 'The company is paying a significant portion of its earnings. Monitor for sustainability.' };
                if (value > 0) return { category: 'Safe & Sustainable', text: 'A healthy ratio that indicates the dividend is well-covered by earnings and leaves ample room for growth and financial flexibility.' };
                return { category: 'No Payout', text: 'The company is not paying a dividend or has zero earnings.' };

            case 'Dividend Growth (5Y)':
                if (value > 0.15) return { category: 'Exceptional Growth', text: 'Indicates a strong commitment to increasing shareholder returns and confidence in future earnings growth.' };
                if (value > 0.05) return { category: 'Steady Growth', text: 'Shows a healthy and sustainable pace of dividend increases, a key sign of a reliable dividend payer.' };
                if (value > 0) return { category: 'Slow Growth', text: 'Dividend growth is minimal, which may not keep up with inflation.' };
                return { category: 'Negative Growth', text: 'A significant red flag, indicating the dividend has been cut in the past, signaling potential business weakness.' };

            case 'FCF Payout Ratio':
                if (value > 1.0) return { category: 'Unsupported by Cash', text: 'Warning: The company is paying out more in dividends than it generates in free cash flow. This is unsustainable and may require debt.' };
                if (value > 0.7) return { category: 'High', text: 'The dividend consumes a large portion of the company\'s cash flow, reducing flexibility.' };
                return { category: 'Well-Covered', text: 'The dividend is comfortably covered by free cash flow, a strong sign of dividend safety and sustainability.' };
            
            case 'Debt-to-Equity':
                if (value < 0.3) return { category: 'Fortress Balance Sheet', text: 'A sign of financial conservatism, making the company highly resilient to economic downturns.' };
                if (value < 1.0) return { category: 'Manageable Debt', text: 'Indicates a healthy and manageable debt level that doesn\'t pose a significant risk to the dividend.' };
                if (value < 2.0) return { category: 'Moderate Leverage', text: 'The company uses a fair amount of debt. Review against industry norms.'};
                return { category: 'High Leverage', text: 'A potential red flag. High debt levels can threaten dividend payments during economic weakness.' };

            default:
                return { category: 'N/A', text: '' };
        }
    }


    /**
     * Calculates a score multiplier (0.0 to 1.2) for a given dividend metric based on its performance.
     * @param {string} metricName - The name of the metric.
     * @param {number|null} value - The value of the metric.
     * @returns {number} The score multiplier.
     */
    function _getDividendMetricScoreMultiplier(metricName, value) {
        if (value === null || !isFinite(value)) return 0;

        switch (metricName) {
            case 'Dividend Yield':
                if (value > 0.10) return 0.2; // Potential Trap (Low credit)
                if (value > 0.04) return 1.2; // High Yield
                if (value > 0.015) return 1.0; // Solid Yield
                if (value > 0) return 0.5; // Low Yield (Partial credit)
                return 0;

            case 'Payout Ratio':
                if (value < 0 || value > 0.9) return 0; // Negative or >90% is unsustainable
                if (value > 0.8) return 0.2; // Risky
                if (value > 0.6) return 0.8; // Moderate
                if (value > 0) return 1.2; // Safe & Sustainable
                return 0;

            case 'Dividend Growth (5Y)':
                if (value > 0.10) return 1.2;  // Strong growth
                if (value > 0.05) return 1.0;  // Steady growth
                if (value > 0.02) return 0.5;  // Slow growth
                if (value <= 0) return -1.0; // PENALTY for stagnant or negative growth
                return 0;

            case 'FCF Payout Ratio':
                 if (value > 1.0 || value < 0) return 0; // Not covered by cash or negative
                 if (value > 0.7) return 0.5; // High
                 if (value <= 0.7) return 1.2; // Well-covered
                 return 0;
            
            case 'Debt-to-Equity':
                if (value < 0.5) return 1.2; // Low debt
                if (value < 1.0) return 1.0; // Manageable debt
                if (value < 2.0) return 0.5; // Moderate leverage
                return 0; // High leverage

            default:
                return 0;
        }
    }


    /**
     * Calculates metrics for the Dividend Scorecard dashboard.
     * @param {object} data - The full FMP data object for a stock.
     * @returns {object} An object containing Dividend metrics with their values and pass/fail status.
     */
    function _calculateDividendScorecardMetrics(data) {
        const metricsTtm = data.key_metrics_ttm?.[0] || {};
        const ratiosTtm = data.ratios_ttm?.[0] || {};
        const cashFlowAnnual = (data.cash_flow_statement_annual || []).slice().reverse();
        const financialGrowth = data.financial_growth?.[0] || {};

        // --- CALCULATIONS ---
        const yieldTtm = ratiosTtm.dividendYielTTM; // CORRECTED PROPERTY NAME
        const payoutRatioTtm = ratiosTtm.payoutRatioTTM;
        const de = metricsTtm.debtEquityRatioTTM; // CORRECTED PROPERTY NAME

        // Dividend Growth (5Y CAGR) from pre-calculated total growth
        let divGrowth5y = null;
        const totalGrowth5Y = financialGrowth.fiveYDividendperShareGrowthPerShare;
        if (typeof totalGrowth5Y === 'number' && isFinite(totalGrowth5Y)) {
            // Convert total growth over 5 years to a Compound Annual Growth Rate (CAGR)
            divGrowth5y = Math.pow(1 + totalGrowth5Y, 1/5) - 1;
        }

        // FCF Payout Ratio
        let fcfPayout = null;
        if (cashFlowAnnual.length > 0) {
            const latestCashFlow = cashFlowAnnual[cashFlowAnnual.length - 1];
            const dividendsPaid = Math.abs(latestCashFlow.dividendsPaid); // Dividends paid is often negative
            const freeCashFlow = latestCashFlow.freeCashFlow;
            if (dividendsPaid > 0 && freeCashFlow > 0) {
                fcfPayout = dividendsPaid / freeCashFlow;
            } else if (dividendsPaid === 0) {
                fcfPayout = 0;
            }
        }
        
        // --- METRICS DEFINITION ---
        const metrics = {
            'Dividend Yield': { value: yieldTtm, format: 'percent', weight: 25 },
            'Payout Ratio': { value: payoutRatioTtm, format: 'percent', weight: 20 },
            'Dividend Growth (5Y)': { value: divGrowth5y, format: 'percent', weight: 25 },
            'FCF Payout Ratio': { value: fcfPayout, format: 'percent', weight: 15 },
            'Debt-to-Equity': { value: de, format: 'decimal', weight: 15 },
        };

        // --- QUALITY SCORE CALCULATION ---
        let weightedScore = 0;
        let totalWeight = 0;

        for (const key in metrics) {
            const metric = metrics[key];
            const multiplier = _getDividendMetricScoreMultiplier(key, metric.value);

            totalWeight += metric.weight;
            weightedScore += metric.weight * multiplier;

            metric.isMet = multiplier >= 1.0;
            metric.interpretation = _getDividendMetricInterpretation(key, metric.value);
        }

        const rawScore = (weightedScore / totalWeight) * 100;
        
        metrics.dividendQualityScore = Math.round(Math.min(100, rawScore) || 0);
        
        return metrics;
    }

    function renderDividendScorecardDashboard(container, metrics) {
        if (!container) return;

        const tilesHtml = Object.entries(metrics).map(([name, data]) => {
            if (name === 'dividendQualityScore') return '';
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

        const score = metrics.dividendQualityScore;
        let scoreClass = 'low';
        if (score > 75) scoreClass = 'high';
        else if (score > 50) scoreClass = 'medium';
        
        const scoreHtml = `
            <div class="quality-score-display ${scoreClass}">
                <div class="text-xs font-bold text-gray-600">QUALITY SCORE</div>
                <div class="score-value">${score}</div>
            </div>
        `;

        container.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <h3 class="text-lg font-bold text-gray-800">Dividend Scorecard</h3>
                ${scoreHtml}
            </div>
            <div class="grid grid-cols-3 md:grid-cols-5 gap-3">${tilesHtml}</div>`;
    }
    
    function renderDividendInterpretationAnalysis(container, metrics) {
        if (!container || !metrics) {
            container.innerHTML = '';
            return;
        };

        const toKebabCase = (str) => str.replace(/\s+/g, '-').toLowerCase();

        const metricGroups = {
            'Yield & Growth': ['Dividend Yield', 'Dividend Growth (5Y)'],
            'Safety & Sustainability': ['Payout Ratio', 'FCF Payout Ratio', 'Debt-to-Equity']
        };

        let html = '<h3 class="text-lg font-bold text-gray-800 my-4 pt-4 border-t">Dividend Criteria Interpretation</h3>';
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
        
        await populateIndustryDropdown();

        // Set default filter values
        document.getElementById('sector').value = 'Consumer Cyclical';
        document.getElementById('industry').value = 'Advertising Agencies';
        
        appContent.addEventListener('click', (e) => {
            const saveBtn = e.target.closest('.save-stock-btn');
            if (saveBtn && saveBtn.dataset.symbol) {
                toggleSaveStock(saveBtn.dataset.symbol);
            }
        });

        await loadAllCachedInfo();
        
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

    // --- 11. Batch Score Calculation ---
    // REMOVED runBatchConvictionScores function

    // --- 12. Firebase Functions ---
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
                    const stockData = allDetails[symbol];
                    // Check for the new dividendQualityScore, otherwise don't cache a rating
                    if (stockData.hasOwnProperty('dividendQualityScore') && stockData.timestamp) {
                        appConfig.cachedStockInfo[symbol] = { 
                            rating: stockData.dividendQualityScore, // Store score as 'rating' for UI
                            timestamp: stockData.timestamp 
                        };
                    }
                }
                console.log("Successfully loaded all cached stock info (scores and timestamps).");
            }
        } catch(error) {
            console.error("Could not load cached stock info from Firebase:", error);
        }
    }

    // --- 13. Rendering Functions ---
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

    function updateCachedOnDisplayForSymbol(symbol) {
        const timestamp = appConfig.cachedStockInfo[symbol]?.timestamp;
        document.querySelectorAll(`[data-cached-on-symbol="${symbol}"]`).forEach(cell => {
            cell.textContent = formatDate(timestamp);
        });
    }

    function updateSingleStockInScreener(symbol, timestamp) {
        const numericTimestamp = new Date(timestamp).getTime();
        
        const stockInDataModel = advancedScreenerData.find(s => s.symbol === symbol);
        if (stockInDataModel) {
            stockInDataModel.cachedTimestamp = numericTimestamp;
        }

        updateRatingDisplayForSymbol(symbol);
        updateRatingDateDisplayForSymbol(symbol);
        updateCachedOnDisplayForSymbol(symbol);
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
            `<th class="w-[8%] px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Quality Score</th>`,
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
                 <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500" data-cached-on-symbol="${stock.symbol}">${formatDate(stock.cachedTimestamp)}</td>
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
                const isSaved = savedStocks.has(stock.symbol);
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

            container.innerHTML = `<div class="overflow-y-auto max-h-[60vh]"><table class="w-full table-fixed divide-y divide-gray-200"><thead class="bg-gray-50 sticky top-0"><tr><th class="w-[15%] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Symbol</th><th class="w-[30%] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th><th class="w-[15%] px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Market Cap</th><th class="w-[15%] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sector</th><th class="w-[10%] px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Quality Score</th><th class="w-[5%] px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Beta</th><th class="w-[10%] px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th></tr></thead><tbody class="bg-white divide-y divide-gray-200">${tableRows}</tbody></table></div>`;
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
                                        <span class="text-xs text-gray-500">Quality Score</span>
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

    // --- 14. Financials Modal Logic ---
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
                document.getElementById('modal-dividend-analysis-content').innerHTML = '<p class="text-center text-gray-500">Refreshing analysis...</p>';
                
                const liveData = await fetchFullTickerDetails(symbol, true); // Force refresh
                if (liveData) {
                    const analysisData = mapDataForAnalysis(liveData);
                    const metrics = _calculateDividendScorecardMetrics(analysisData);
                    
                    populateRawDataModal(liveData);
                    populateDividendScorecardInModal(metrics);
                    
                    const dataToSave = { ...analysisData, dividendQualityScore: metrics.dividendQualityScore, timestamp: new Date().toISOString() };
                    await saveTickerDetailsToFirebase(symbol, dataToSave);
                    appConfig.cachedStockInfo[symbol] = { rating: metrics.dividendQualityScore, timestamp: dataToSave.timestamp };
                    
                    updateSingleStockInScreener(symbol, dataToSave.timestamp);
                } else {
                     document.getElementById('modal-dividend-analysis-content').innerHTML = '<p class="text-center text-red-500">Could not refresh analysis.</p>';
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
        document.getElementById('modal-dividend-analysis-content').innerHTML = '<p class="text-center text-gray-500">Loading dividend analysis...</p>';
        document.getElementById('modal-raw-data-content').innerHTML = '<p class="text-center text-gray-500">Loading raw data...</p>';
        document.getElementById('modal-company-name').textContent = `Loading... (${symbol})`;
        document.getElementById('modal-stock-price').textContent = '';
        document.getElementById('modal-last-updated').textContent = '...';
         // Reset to first tab
        financialsModalTabs.querySelectorAll('.modal-tab-button').forEach(btn => btn.classList.remove('active'));
        financialsModalTabs.querySelector('button').classList.add('active');
        document.querySelectorAll('.modal-tab-content').forEach(content => content.classList.remove('active'));
        document.querySelector('#modal-dividend-analysis-content').classList.add('active');

        // Always fetch live data and update cache
        const liveData = await fetchFullTickerDetails(symbol);
            if (liveData) {
                const analysisData = mapDataForAnalysis(liveData);
                const metrics = _calculateDividendScorecardMetrics(analysisData);
                
                // Set modal header with live data
                const profile = liveData.profile?.[0] || {};
                document.getElementById('modal-company-name').textContent = `${profile.companyName || 'N/A'} (${profile.symbol || ''})`;
                document.getElementById('modal-stock-price').textContent = profile.price ? `$${profile.price.toFixed(2)}` : 'Price N/A';
                document.getElementById('modal-last-updated').textContent = `Live Data (just now)`;
                
                populateRawDataModal(liveData);
                populateDividendScorecardInModal(metrics);
                
                const newTimestamp = new Date().toISOString();
                const dataToSave = { ...analysisData, dividendQualityScore: metrics.dividendQualityScore, timestamp: newTimestamp };
                await saveTickerDetailsToFirebase(symbol, dataToSave);
                appConfig.cachedStockInfo[symbol] = { rating: metrics.dividendQualityScore, timestamp: newTimestamp };
                
                updateSingleStockInScreener(symbol, newTimestamp);
            } else {
                 document.getElementById('modal-dividend-analysis-content').innerHTML = '<p class="text-center text-red-500">Could not fetch financial data.</p>';
                 document.getElementById('modal-raw-data-content').innerHTML = '';
            }
        updateViewedIndicatorForSymbol(symbol);
    }

    function mapDataForAnalysis(fetchedData) {
        return {
            profile: fetchedData.profile,
            key_metrics_ttm: fetchedData.key_metrics_ttm,
            ratios_ttm: fetchedData.ratios_ttm,
            cash_flow_statement_annual: fetchedData.cashFlow,
            financial_growth: fetchedData.financial_growth
        };
    }


    async function fetchFullTickerDetails(symbol) {
        if (!appConfig.fmpApiKey) return null;
        const apiKey = appConfig.fmpApiKey;
        // UPDATED: Reduced to only the endpoints required for dividend analysis
        const endpoints = {
            profile: `https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${apiKey}`,
            cashFlow: `https://financialmodelingprep.com/api/v3/cash-flow-statement/${symbol}?period=annual&limit=1&apikey=${apiKey}`,
            metrics_ratios_ttm: `https://financialmodelingprep.com/api/v3/ratios-ttm/${symbol}?apikey=${apiKey}`,
            financial_growth: `https://financialmodelingprep.com/api/v3/financial-growth/${symbol}?period=annual&limit=1&apikey=${apiKey}`,
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

            // Add aliases for the new combined endpoint to avoid breaking other functions
            data.key_metrics_ttm = data.metrics_ratios_ttm;
            data.ratios_ttm = data.metrics_ratios_ttm;

            return data;

        } catch (error) {
            console.error(`A critical error occurred while fetching details for ${symbol}:`, error);
            return null;
        }
    }
    
    function populateDividendScorecardInModal(metrics) {
        const contentEl = document.getElementById('modal-dividend-analysis-content');
        if (!contentEl) return;
        const tempContainer = document.createElement('div');
        renderDividendScorecardDashboard(tempContainer, metrics);
        renderDividendInterpretationAnalysis(tempContainer, metrics);
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
