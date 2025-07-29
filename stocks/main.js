import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithCredential, signOut, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, Timestamp, doc, setDoc, getDoc, deleteDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- App Version ---
const APP_VERSION = "7.1.4"; 

// --- Constants ---
const CONSTANTS = {
    // Modals
    MODAL_API_KEY: 'apiKeyModal',
    MODAL_LOADING: 'loadingStateModal',
    MODAL_MESSAGE: 'messageModal',
    MODAL_CONFIRMATION: 'confirmationModal',
    MODAL_FULL_DATA: 'fullDataModal',
    MODAL_FINANCIAL_ANALYSIS: 'financialAnalysisModal',
    MODAL_UNDERVALUED_ANALYSIS: 'undervaluedAnalysisModal',
    MODAL_CUSTOM_ANALYSIS: 'customAnalysisModal',
    MODAL_PORTFOLIO: 'portfolioModal',
    MODAL_MANAGE_STOCK: 'manageStockModal',
    // Forms & Inputs
    FORM_API_KEY: 'apiKeyForm',
    FORM_STOCK_RESEARCH: 'stock-research-form',
    INPUT_TICKER: 'ticker-input',
    INPUT_ALPHA_VANTAGE_KEY: 'alphaVantageApiKeyInput',
    INPUT_GEMINI_KEY: 'geminiApiKeyInput',
    INPUT_GOOGLE_CLIENT_ID: 'googleClientIdInput',
    INPUT_WEB_SEARCH_KEY: 'webSearchApiKeyInput',
    INPUT_SEARCH_ENGINE_ID: 'searchEngineIdInput',
    // Containers & Elements
    CONTAINER_DYNAMIC_CONTENT: 'dynamic-content-container',
    CONTAINER_PORTFOLIO_LIST: 'portfolio-list-container',
    ELEMENT_LOADING_MESSAGE: 'loading-message',
    ELEMENT_FULL_DATA_CONTENT: 'full-data-content',
    ELEMENT_FINANCIAL_ANALYSIS_CONTENT: 'financial-analysis-content',
    ELEMENT_UNDERVALUED_ANALYSIS_CONTENT: 'undervalued-analysis-content',
    // Buttons
    BUTTON_SCROLL_TOP: 'scroll-to-top-button',
    BUTTON_VIEW_STOCKS: 'view-stocks-button',
    BUTTON_ADD_NEW_STOCK: 'add-new-stock-button',
    // Classes
    CLASS_MODAL_OPEN: 'is-open',
    CLASS_BODY_MODAL_OPEN: 'modal-open',
    CLASS_HIDDEN: 'hidden',
    // Database Collections
    DB_COLLECTION_CACHE: 'cached_stock_data',
    DB_COLLECTION_PORTFOLIO: 'portfolio_stocks',
    DB_COLLECTION_SECTOR_ANALYSIS: 'sector_analysis_runs',
    DB_COLLECTION_CALENDAR: 'calendar_data',
};

// List of comprehensive data endpoints to fetch for caching
const API_FUNCTIONS = ['OVERVIEW', 'GLOBAL_QUOTE', 'TIME_SERIES_DAILY', 'EARNINGS', 'SMA'];

const SECTORS = [
    'Technology', 'Health Care', 'Financials', 'Consumer Discretionary',
    'Communication Services', 'Industrials', 'Consumer Staples',
    'Energy', 'Utilities', 'Real Estate', 'Materials'
];

const FINANCIAL_NEWS_SOURCES = [
    'reuters.com', 'bloomberg.com', 'wsj.com', 'ft.com', 'marketwatch.com',
    'cnbc.com', 'finance.yahoo.com', 'seekingalpha.com', 'themotleyfool.com',
    'investors.com', 'barrons.com', 'forbes.com', 'investopedia.com',
    'benzinga.com', 'zacks.com', 'kiplinger.com', 'thestreet.com',
    'morningstar.com', 'nasdaq.com', 'fool.com', 'businessinsider.com',
    'fortune.com', 'cnn.com', 'foxbusiness.com', 'twst.com',
    'americanbanker.com', 'theinformation.com', 'axios.com', 'asia.nikkei.com',
    'caixinglobal.com', 'economist.com', 'theglobeandmail.com', 'economictimes.indiatimes.com',
    'afr.com', 'tipranks.com', 'businesswire.com', 'prnewswire.com',
    'globenewswire.com', 'apnews.com', 'money.usatoday.com', 'npr.org',
    'theguardian.com', 'bbc.com', 'financialpost.com', 'scmp.com',
    'spglobal.com', 'nytimes.com', 'gurufocus.com', 'streetinsider.com', 'moodys.com'
];

const FINANCIAL_ANALYSIS_PROMPT = [
    "Role: You are a financial analyst AI who excels at explaining complex topics to everyday investors. Your purpose is to generate a rigorous, data-driven financial analysis that is also educational, objective, and easy to understand. Use relatable analogies to clarify financial concepts (e.g., comparing debt to a mortgage). Your analysis must be derived exclusively from the provided JSON data.",
    "Output Format: The final report must be in professional markdown format. Use # for the main title, ## for major sections, ### for sub-sections, and bullet points for key data and lists. Present financial figures clearly, using 'Billion' or 'Million' where appropriate for readability.",
    "IMPORTANT: Do not include any HTML tags in your output. Generate pure markdown only.",
    '',
    'Analyze the comprehensive financial data for {companyName} (Ticker: {tickerSymbol}) provided below. If a specific data point is "N/A" or missing, state that clearly in your analysis.',
    '',
    'JSON Data:',
    '{jsonData}',
    '',
    'Based on the provided data, generate the following multi-faceted financial report:',
    '',
    '# Comprehensive Financial Analysis: {companyName} ({tickerSymbol})',
    '',
    '## 1. Executive Summary',
    "Begin with a concise, one-paragraph summary written in plain English. For someone in a hurry, what is the most important takeaway about this company's financial health, performance, and overall story as a potential investment?",
    '',
    '## 2. Company Profile (What Do They Actually Do?)',
    '### Business Description',
    "In simple terms, describe the company's business based on the Description, Sector, and Industry from the OVERVIEW data. Avoid jargon.",
    '### Market Snapshot',
    'Present key market-related metrics for context.',
    '- Market Capitalization: $XXX.XX Billion',
    '- 52-Week Price Range: $XX.XX - $XX.XX',
    '- 50-Day Moving Average: $XX.XX',
    '- 200-Day Moving Average: $XX.XX',
    '- Analyst Target Price: $XX.XX',
    '',
    '## 3. Performance & Profitability (How Well Does It Make Money?)',
    "Assess the company's ability to generate profit. Explain all concepts simply.",
    '### 3.1. Revenue & Earnings Trend',
    'Analyze the historical trend of totalRevenue and netIncome. Is the company making more money and keeping more profit over time? Discuss the Year-over-Year (YoY) growth rates for the most recent two years in simple terms.',
    '### 3.2. Profitability Margins & Returns',
    'Explain what ProfitMargin and OperatingMarginTTM mean. For every $100 in sales, how much is actual profit? Analyze the trend in these margins. Are they getting better or worse?',
    "Explain ReturnOnEquityTTM (ROE) and ReturnOnAssetsTTM (ROA) as a grade for the management team. How well are they using shareholder money and company resources to make a profit?",
    '',
    '## 4. Financial Health & Risk (Is the Company on Solid Ground?)',
    "Evaluate the company's financial stability. Use an analogy to explain debt (e.g., like a mortgage on a house).",
    '### 4.1. Liquidity Analysis',
    "Calculate and interpret the Current Ratio. Explain its meaning: Does the company have enough cash and easily-sold assets to pay its bills for the next year?",
    "Calculate and interpret the Quick Ratio. Explain what this reveals about its reliance on selling inventory to pay its bills.",
    '### 4.2. Solvency and Debt Structure',
    "Analyze the Debt-to-Equity Ratio. How much of the company is funded by debt versus shareholder money? Is the trend getting riskier or safer?",
    "Explain the Interest Coverage Ratio simply: From its operating earnings, how many times over can the company pay the interest on its debt? A high number is safer.",
    '',
    '## 5. Cash Flow Analysis (Following the Actual Cash)',
    'Analyze where the company\'s cash came from and where it went. Explain the key difference between "profit" (netIncome) and "cash flow" (operatingCashflow).',
    '### Operating Cash Flow (OCF)',
    'Is the company consistently generating real cash from its main business operations? Is this amount growing?',
    '### Quality of Earnings',
    "Compare operatingCashflow to netIncome. Are the company's profits backed by actual cash? A big difference can be a red flag.",
    '### Investing and Financing Activities',
    "Briefly explain what the company is doing with its cash. Is it reinvesting for growth (capitalExpenditures), paying down debt, or returning money to shareholders (dividendPayout, stock buybacks)?",
    '',
    '## 6. Valuation Analysis (Is the Stock Price Fair?)',
    "Assess if the company's stock price seems expensive, cheap, or reasonable. Explain what the key ratios mean.",
    'Present and interpret the following valuation multiples:',
    '- P/E Ratio (PERatio): Explain this simply (e.g., "The price you pay for $1 of the company\'s profit").',
    '- Forward P/E (ForwardPE): Compare this to the P/E Ratio to see if analysts expect profits to grow or shrink.',
    '- Price-to-Sales Ratio (PriceToSalesRatioTTM)',
    '- Price-to-Book Ratio (PriceToBookRatio)',
    'Briefly discuss what these multiples imply. Is the stock priced for high growth, or is it seen as a stable value company?',
    '',
    '## 7. The Long-Term Investment Thesis: Bull vs. Bear',
    'Conclude with a final synthesis that integrates all the preceding analyses into a clear bull and bear case.',
    '### The Bull Case (Key Strengths & Competitive Edge)',
    'Identify 2-3 of the most significant financial strengths and what they mean for a long-term investor. What is the primary "bull" argument for owning this stock?',
    '### The Bear Case (Potential Weaknesses & Risks)',
    'Identify 2-3 of the most significant weaknesses or financial red flags. What is the primary "bear" argument against owning this stock?',
    '### Final Verdict: The "Moat" and Long-Hold Potential',
    'Based purely on this quantitative analysis, what is the primary story? And what, if anything, in the data suggests the company has a strong competitive advantage (a "moat")? Conclude with a final statement on its profile as a potential long-term holding.'
].join('\n');

const UNDERVALUED_ANALYSIS_PROMPT = [
    'Role: You are a financial analyst AI who excels at explaining complex topics to everyday investors. Your purpose is to conduct a clear, data-driven valuation analysis to determine if a stock is a potential bargain. Use relatable analogies and explain all financial terms simply. Your analysis must be derived exclusively from the provided JSON data.',
    'Output Format: The final report must be in professional markdown format. Use # for the main title, ## for major sections, ### for sub-sections, and bullet points for key data points.',
    'IMPORTANT: Do not include any HTML tags in your output. Generate pure markdown only.',
    '',
    'Conduct a comprehensive valuation analysis for {companyName} (Ticker: {tickerSymbol}) using the financial data provided below. If a specific data point is "N/A" or missing, state that clearly in your analysis.',
    '',
    'JSON Data:',
    '{jsonData}',
    '',
    'Based on the data, generate the following in-depth report:',
    '# Investment Valuation Report: Is {companyName} ({tickerSymbol}) a Bargain?',
    '',
    '## 1. The Bottom Line: Our Verdict',
    'Provide a concise, one-paragraph conclusion that immediately answers the main question: Based on the data, does this stock seem Undervalued, Fairly Valued, or Overvalued? Briefly mention the top 1-2 reasons for this verdict in plain English, considering its fundamentals, health, and market sentiment.',
    '',
    '## 2. Is the Price Fair? (Fundamental & Health Analysis)',
    "Let's look at the company's valuation metrics and financial health to see if the price makes sense.",
    '### 2.1. Valuation Multiples Explained',
    '- **Price-to-Earnings (P/E) Ratio:** [Value from OVERVIEW.PERatio]. Explain this simply: It’s the price you pay for $1 of the company’s profit. Compare the current P/E to the Forward P/E to see if analysts expect profits to rise or fall.',
    "- **Price-to-Book (P/B) Ratio:** [Value from OVERVIEW.PriceToBookRatio]. Explain this as the stock's price compared to the company's net worth on paper. A value under 1.0 can sometimes suggest it's a bargain.",
    '- **Price-to-Sales (P/S) Ratio:** [Value from OVERVIEW.PriceToSalesRatioTTM]. Explain this as the price you pay for $1 of the company’s sales. Is it a good deal, or does it signal low profitability?',
    '### 2.2. Financial Health Check (Debt Load)',
    '- **Debt-to-Equity Ratio:** Calculate this using totalLiabilities / totalShareholderEquity from the most recent annual BALANCE_SHEET. Explain this like a personal debt-to-income ratio. A high number means the company relies heavily on debt, which can be risky.',
    '### 2.3. Value vs. Growth (The PEG Ratio)',
    '- **PEG Ratio:** [Value from OVERVIEW.PEGRatio]. Explain this as the secret weapon for value investors. It balances the P/E ratio with future growth expectations. A PEG ratio under 1.0 is often a green flag for an undervalued growth stock.',
    "### 2.4. Getting Paid to Wait (Dividend Analysis)",
    '- **Dividend Yield:** [Value from OVERVIEW.DividendYield]%. Explain this as the annual return you get from dividends, like interest from a savings account.',
    '- **Is the Dividend Safe?** Calculate the Cash Flow Payout Ratio (dividendPayout / operatingCashflow). Explain what this means for the dividend\'s sustainability. A low number is a good sign.',
    '### 2.5. What Does Wall Street Think?',
    "- **Analyst Target Price:** $[Value from OVERVIEW.AnalystTargetPrice]. How does Wall Street's target price compare to the current price? Is there potential upside according to the pros?",
    '',
    '## 3. Sizing Up the Competition (Relative Value)',
    'A stock might seem cheap or expensive on its own, but how does it look compared to its peers?',
    '- **Industry Context:** Using the `Industry` from the OVERVIEW data, comment on the valuation. For example, are the P/E and P/S ratios high or low for a company in this specific industry? (e.g., "Tech stocks often have higher P/E ratios than banks.") This provides crucial context.',
    '',
    '## 4. Market Mood & Stock Trends (Sentiment & Technicals)',
    "Let's check the stock's recent price trends and what other investors are doing.",
    '### 4.1. The Trend is Your Friend',
    '- **50-Day & 200-Day Moving Averages:** Analyze the stock\'s current trend by comparing the price to these key levels. Is it in a "hot" uptrend or a "cold" downtrend?',
    '### 4.2. Where Does the Price Stand?',
    '- **52-Week Range:** The stock has traded between $[Value from OVERVIEW.52WeekLow] and $[Value from OVERVIEW.52WeekHigh]. Is the price currently near its yearly low (a potential discount) or its high (strong momentum)?',
    '### 4.3. Market Sentiment Check',
    '- **Short Interest:** [Value from OVERVIEW.ShortPercentOutstanding]%. Explain this as the percentage of shares being bet *against* the company. A high number (>10%) is a red flag that many investors expect the price to fall.',
    '- **Insider Ownership:** [Value from OVERVIEW.PercentInsiders]%. Explain this as "skin in the game." When executives and directors own a good chunk of the stock, their interests are better aligned with shareholders.',
    '',
    '## 5. Final Conclusion: The Investment Case',
    'Combine all our findings into a final, clear summary.',
    '- **The Case for a Bargain:** Summarize the key data points (e.g., low P/E, healthy balance sheet, positive trend, strong insider ownership) that suggest the stock is undervalued.',
    '- **The Case for Caution:** Summarize the key risks or red flags (e.g., high debt, high valuation vs. peers, bearish trend, high short interest) that suggest the stock might not be a good deal right now.',
    '- **Final Takeaway:** End with a clear, final statement. For example: "The stock looks like a potential bargain based on its fundamentals and low debt. However, it appears expensive compared to its industry, and high short interest suggests market caution. A patient approach may be warranted."',
    '',
    '**Disclaimer:** This AI-generated analysis is for informational and educational purposes only. It is not financial advice. Data may not be real-time.'
].join('\n');

const NEWS_SENTIMENT_PROMPT = [
    'Role: You are a financial news analyst AI who is an expert at cutting through the noise and explaining what headlines *really* mean for an everyday investor. Your goal is to assess the mood and key narratives surrounding a company based on recent news.',
    'Task: Analyze the sentiment of the following news articles for {companyName} ({tickerSymbol}). IMPORTANT: Process only the articles that include a publication date. Ignore any articles where this date is missing.',
    'For each valid article, you will perform five actions:',
    '1. Extract the publication date (format as YYYY-MM-DD).',
    '2. Classify the sentiment as \'Bullish\' (good news), \'Bearish\' (bad news), or \'Neutral\' (factual).',
    '3. Classify the impact as \'High\', \'Medium\', or \'Low\'. High impact news (like earnings reports, CEO changes, or major lawsuits) is likely to move the stock price.',
    '4. Categorize the news into one of the following themes: \'Financials\', \'Legal/Regulatory\', \'Product/Innovation\', \'Management\', or \'Market\'.',
    '5. Provide a brief, one-sentence summary explaining the key takeaway for a potential investor.',
    '',
    'After analyzing all articles, you will provide a final, overall summary of the news sentiment.',
    '',
    'Output Format:',
    'First, return a JSON array of objects for programmatic use. Each object must have "date", "sentiment", "impact", "category", and "summary" keys. The final JSON array MUST be sorted by impact, from \'High\' down to \'Low\'. This JSON block must be clean, with no text before or after it.',
    'Second, after the JSON block, add a final markdown section titled "## Overall News Pulse". In this section, provide a 2-3 sentence summary of the collective sentiment. Focus on the most impactful news. Are there any recurring themes (e.g., multiple articles about legal troubles or product successes)?',
    '',
    'Articles (JSON format):',
    '{news_articles_json}',
    '',
    '--- START OF EXAMPLE ---',
    'Example JSON Output:',
    '[',
    '  { "date": "2025-07-28", "sentiment": "Bullish", "impact": "High", "category": "Financials", "summary": "The company reported stronger-than-expected earnings, which is a significant positive for profitability." },',
    '  { "date": "2025-07-27", "sentiment": "Bearish", "impact": "High", "category": "Legal/Regulatory", "summary": "A new regulatory investigation creates uncertainty and potentially significant legal and financial risks." },',
    '  { "date": "2025-07-25", "sentiment": "Bearish", "impact": "Medium", "category": "Product/Innovation", "summary": "A key product launch has been delayed by one quarter, potentially affecting next quarter\'s revenue." },',
    '  { "date": "2025-07-26", "sentiment": "Neutral", "impact": "Low", "category": "Management", "summary": "The article factually reports on an upcoming shareholder meeting without offering a strong opinion." }',
    ']',
    '',
    '## Overall News Pulse',
    'The overall news sentiment is mixed but defined by high-impact events. While the strong earnings report is very bullish, it is counter-balanced by a new, high-risk regulatory investigation. The dominant theme is a conflict between strong financial performance and emerging legal risks.',
    '--- END OF EXAMPLE ---'
].join('\n');

const BULL_VS_BEAR_PROMPT = [
    'Role: You are a financial analyst AI who excels at presenting a balanced view. Your task is to explain the two sides of the investment story for {companyName}, acting as a neutral moderator in a debate. Use ONLY the provided JSON data to build your arguments.',
    'Output Format: Use markdown format. Explain each point in simple terms, as if talking to a friend who is new to investing. Create a clear "Bull Case" and a "Bear Case" section, each with 3-5 bullet points supported by specific data from the JSON.',
    '',
    'JSON Data:',
    '{jsonData}',
    '',
    '# The Investment Debate: {companyName} ({tickerSymbol})',
    '',
    '## The Bull Case (The Bright Side: Reasons to be Optimistic)',
    'Construct a positive argument for the company. For each point, state the supporting data and then briefly explain *why* it matters to an investor.',
    'Focus on strengths like:',
    '- **Strong Growth:** Is revenue or profit consistently increasing? (Use INCOME_STATEMENT data).',
    '- **High Profitability:** Is the company a good money-maker? (Use ProfitMargin, ROE from OVERVIEW). Explain ROE as a "grade" for how well management uses shareholder money.',
    '- **Solid Cash Flow:** Is the business generating real cash? (Use operatingCashflow from CASH_FLOW). Explain this as the company\'s "lifeblood".',
    '- **Potential Bargain:** Does the stock seem cheap relative to its earnings or growth? (Use PERatio, PEGRatio from OVERVIEW).',
    '- **Wall Street Optimism:** Does the AnalystTargetPrice suggest significant upside from the current price, indicating that market experts are also bullish?',
    '',
    '## The Bear Case (The Cautious View: Reasons for Concern)',
    'Construct a negative argument for the company. For each point, state the supporting data and explain the potential risk.',
    'Focus on weaknesses like:',
    '- **Heavy Debt Load:** Does the company owe a lot of money? (Use Debt-to-Equity from BALANCE_SHEET). Explain this like having a large mortgage; it can be risky if times get tough.',
    '- **Slowing Growth or Profitability:** Are sales or profits shrinking, potentially falling behind competitors? (Use INCOME_STATEMENT data).',
    '- **Weak Cash Flow:** Is the company burning through cash? (Use CASH_FLOW data).',
    '- **Expensive Stock:** Does the stock seem overpriced for its performance? (Use high valuation multiples from OVERVIEW).',
    '- **Analyst Skepticism:** Is the AnalystTargetPrice near or below the current price, suggesting experts see limited room for growth?',
    '',
    '## The Final Takeaway: What\'s the Core Debate?',
    'Conclude with a 1-2 sentence summary that frames the central conflict for an investor. For example: "The core debate for {companyName} is whether its strong profitability and growth (the bull case) are enough to outweigh its significant debt load and increasing competition (the bear case)."'
].join('\n');

const MOAT_ANALYSIS_PROMPT = [
    'Role: You are a business strategist AI who excels at explaining complex business concepts in simple, relatable terms. Your task is to analyze {companyName}\'s competitive advantages.',
    'Concept: An "economic moat" is a company\'s ability to maintain its competitive advantages and defend its long-term profits from competitors. Think of it like the moat around a castle—the wider the moat, the harder it is for invaders (competitors) to attack.',
    'Output Format: Provide a brief report in markdown. Explain each point simply and conclude with a clear verdict on the moat\'s strength.',
    '',
    'JSON Data:',
    '{jsonData}',
    '',
    '# Economic Moat Analysis: {companyName} ({tickerSymbol})',
    '',
    '## 1. What Gives This Company Its Edge? (Sources of the Moat)',
    'Analyze the data for signs of a durable competitive advantage. Discuss:',
    '- **Return on Invested Capital (ROIC):** Calculate a simplified ROIC using (EBIT / (totalAssets - totalCurrentLiabilities)). Explain this as the "gold standard" for moat analysis: it shows how much profit the company generates for every dollar of capital invested. A consistently high ROIC (>15%) is a strong sign of a moat.',
    '- **Pricing Power:** Are the ProfitMargin and OperatingMarginTTM consistently high? Explain this as a sign that the company can charge more for its products without losing customers, often due to a strong brand or unique technology.',
    '- **Qualitative Clues (Network Effects/Switching Costs):** Analyze the company\'s Description. Does it mention a "platform," "network," or "marketplace" that grows more valuable as more people use it? Does it sell "enterprise software" or "integrated systems" that would be difficult for a customer to switch away from?',
    '- **Shareholder Returns (ROE):** Is the ReturnOnEquityTTM (ROE) high? Explain this as a sign that management is highly effective at turning shareholder money into profits, a hallmark of a well-run company.',
    '',
    '## 2. How Strong is the Castle Wall? (Moat Sustainability)',
    'Assess how sustainable this advantage might be by looking at:',
    '- **Reinvesting in the Business:** Are capitalExpenditures (from CASH_FLOW) significant? Explain this as the company spending money to strengthen its moat, like building higher castle walls.',
    '- **Financial Fortress:** Is the balance sheet strong (low Debt-to-Equity)? A company with low debt is better equipped to survive tough times and fight off competitors.',
    '',
    '## 3. The Verdict: How Wide is the Moat?',
    'Based on all the evidence (quantitative and qualitative), provide a concluding assessment. Classify the moat as "Wide," "Narrow," or "None," and explain what this means for a long-term investor.',
    '- **Wide Moat:** The company has strong, sustainable advantages (like high ROIC and clear network effects) that are very difficult for competitors to copy.',
    '- **Narrow Moat:** The company has some advantages (like good profitability), but they could be overcome by competitors over time.',
    '- **No Moat:** The company has no clear, sustainable competitive advantage and is vulnerable to competition.'
].join('\n');

const DIVIDEND_SAFETY_PROMPT = [
    'Role: You are a conservative income investment analyst AI. Your goal is to explain dividend safety in simple, clear terms for an investor who relies on that income.',
    'Concept: Dividend safety analysis is all about figuring out how likely a company is to continue paying its dividend. A safe dividend is supported by strong earnings and cash flow and isn\'t threatened by high debt.',
    'Output Format: Create a markdown report. Explain each point using simple analogies and conclude with a clear safety rating.',
    '',
    'JSON Data:',
    '{jsonData}',
    '',
    '# Dividend Safety Analysis: {companyName} ({tickerSymbol})',
    '',
    '## 1. The Payout: What Are You Earning?',
    '- **Current Dividend Yield:** [Value from OVERVIEW.DividendYield]%. Explain this as the annual return you get from dividends, like interest from a savings account.',
    '',
    '## 2. Can the Company Afford Its Dividend? (Payout Ratios)',
    'This is the most important test. A company should pay its dividend from the money it actually makes.',
    '- **Free Cash Flow (FCF) Payout Ratio:** Calculate this using (dividendPayout / (operatingCashflow - capitalExpenditures)). Explain this as the most conservative test: "Is the dividend covered by the true discretionary cash left after running and growing the business?" A low ratio here is an excellent sign of safety.',
    '- **Earnings Payout Ratio:** (dividendPayout / netIncome). Explain this as: "For every $1 of profit, how much is paid out as a dividend?" A ratio over 100% means the company is paying out more than it earns, which is a red flag.',
    '',
    '## 3. What is the Track Record? (History & Consistency)',
    'A company\'s past behavior is a good indicator of its future commitment to the dividend.',
    '- **Dividend Growth:** Analyze the trend of dividendPayout over the last several years from the CASH_FLOW statements. Has the company consistently increased its dividend payment? Explain that a history of dividend growth is a powerful sign of a healthy, confident business.',
    '',
    '## 4. Does the Company Have a Safety Net? (Balance Sheet Health)',
    'A strong company can protect its dividend even when times get tough.',
    '- **Debt Load:** How has the Debt-to-Equity ratio (from BALANCE_SHEET) trended? Explain this like a personal mortgage: high or rising debt can put dividend payments at risk if the company needs to prioritize paying back lenders.',
    '- **Cash Cushion:** Examine the trend in cashAndShortTermInvestments (from BALANCE_SHEET). Does the company have a healthy cash pile to fall back on? This acts as a buffer to protect the dividend during a downturn.',
    '',
    '## 5. The Final Verdict: How Safe Are Your Dividend Checks?',
    'Conclude with a clear rating and a simple, one-sentence justification.',
    '- **"Very Safe":** The dividend has a history of growth, is easily covered by free cash flow, and the balance sheet is strong. Like a salary from a very stable job that gives you a raise every year.',
    '- **"Safe":** The dividend is covered, but may lack a long history of growth or there might be a minor concern (like rising debt) to watch. Like a salary from a good job, but the company is taking on some new projects.',
    '- **"At Risk":** The payout ratios are high, the dividend isn\'t growing, and/or the balance sheet is weak. The dividend could be cut if business slows down. Like a salary from a job that is facing financial trouble.'
].join('\n');

const GROWTH_OUTLOOK_PROMPT = [
    'Role: You are a forward-looking equity analyst AI. Your goal is to identify the key signs of future growth for {companyName} and explain them in simple terms.',
    'Concept: Growth outlook analysis tries to answer the question, "Where will this company be in the future?" We look at its history, recent performance, how it invests in itself, and what the market expects.',
    'Output Format: A concise markdown summary of key growth indicators and a concluding outlook.',
    '',
    'JSON Data:',
    '{jsonData}',
    '',
    '# Growth Outlook: {companyName} ({tickerSymbol})',
    '',
    '## 1. What is the Long-Term Track Record? (Historical Growth)',
    'Analyze the annual INCOME_STATEMENT data for the last 3-5 years.',
    '- **Revenue & Earnings Trend:** Has the company consistently grown its totalRevenue and netIncome over the long term? Explain that a proven track record is a strong sign of a durable business.',
    '',
    '## 2. Is the Company Growing Right Now? (Recent Momentum)',
    'Analyze the most recent growth signals from the OVERVIEW data:',
    '- **Quarterly Growth:** What do the QuarterlyRevenueGrowthYOY and QuarterlyEarningsGrowthYOY figures tell us? Explain this as a recent "report card" on the company\'s performance.',
    '',
    '## 3. Are You Paying a Fair Price for Growth? (PEG Ratio)',
    'It\'s important not to overpay for growth. Analyze the valuation of the company\'s growth:',
    '- **PEG Ratio:** [Value from OVERVIEW.PEGRatio]. Explain this as a key metric that balances the stock\'s P/E ratio with its growth rate. A PEG ratio under 1.0 is often considered a sign that the stock is reasonably priced for its growth.',
    '',
    '## 4. Planting Seeds for Future Trees (Reinvestment)',
    'A company must invest today to grow tomorrow. Examine the CASH_FLOW statement for signs of this:',
    '- **Capital Expenditures:** What is the trend in capitalExpenditures? Explain this as the company spending money on new projects, equipment, or technology to fuel future growth.',
    '',
    '## 5. What Does the Market Expect? (Future Outlook)',
    'Interpret the market\'s view on the company\'s growth prospects from the OVERVIEW data:',
    '- **Earnings Expectations (Forward P/E):** Compare the ForwardPE to the current PERatio. If the Forward P/E is lower, it suggests that analysts expect earnings to grow over the next year.',
    '- **Wall Street\'s Target:** How does the AnalystTargetPrice compare to the current stock price? This gives us a hint about how much growth professional analysts are forecasting.',
    '',
    '## 6. Final Outlook: What is the Growth Story?',
    'Based on all the factors above, provide a brief, synthesized outlook. Is this a consistent, long-term grower that is reasonably priced, or is its growth recent and potentially expensive? What is the primary story for a potential investor looking for growth?'
].join('\n');

const RISK_ASSESSMENT_PROMPT = [
    'Role: You are a risk analyst AI. Your job is to act like a cautious inspector, identifying the most significant potential problems or "red flags" for {companyName} and explaining them simply.',
    'Concept: Risk assessment is about looking for potential problems that could hurt a company or its stock price. We will check the company\'s financial health, its stock price valuation, and its business operations for any warning signs.',
    'Output Format: A prioritized, bulleted list in markdown, categorized by risk type. Explain each risk in simple terms.',
    '',
    'JSON Data:',
    '{jsonData}',
    '',
    '# Uncovering the Risks: {companyName} ({tickerSymbol})',
    '',
    '## 1. Financial Risks (Is the Foundation Solid?)',
    'These are risks related to the company\'s balance sheet and cash flow.',
    '- **Debt Load (Leverage):** Is the Debt-to-Equity ratio high? Explain this risk like having a large mortgage; it can become a heavy burden, especially if business slows down.',
    '- **Paying Short-Term Bills (Liquidity):** Is the Current Ratio low (below 1.5)? This could suggest the company might have trouble paying its bills over the next year without selling long-term assets.',
    '- **"Real" Cash vs. "Paper" Profit (Earnings Quality):** Is operatingCashflow significantly lower than netIncome? This can be a red flag that the company\'s reported profits aren\'t turning into actual cash.',
    '- **Dividend Sustainability:** Is the dividendPayout greater than netIncome? This is a major warning sign that the dividend is being funded by debt or cash reserves, not profits, and could be at risk of a cut.',
    '',
    '## 2. Market & Stock Price Risks (Is the Stock Itself Risky?)',
    'These are risks related to the stock\'s price and behavior in the market.',
    '- **Negative Market Sentiment (Short Interest):** Is the ShortPercentOutstanding high (e.g., >10%)? Explain that this means a significant number of investors are betting that the stock price will fall.',
    '- **Volatility (The "Drama" Level):** Is the Beta (from OVERVIEW) greater than 1? This means the stock tends to have bigger price swings (both up and down) than the overall market.',
    '- **Priced for Perfection? (Valuation Risk):** Is the PERatio or PriceToSalesRatioTTM exceptionally high? Explain that this means the stock price is built on high expectations and could fall sharply if the company delivers even slightly disappointing news.',
    '',
    '## 3. Business Risks (Are There Cracks in the Operations?)',
    'These are risks related to the day-to-day health of the business.',
    '- **Recession Sensitivity (Economic Cycle Risk):** Based on the company\'s Sector, is it "Cyclical" (like automotive or travel) or "Defensive" (like utilities or consumer staples)? Cyclical companies are often hit harder during economic downturns.',
    '- **Losing Steam? (Growth Deceleration):** Is the QuarterlyRevenueGrowthYOY negative or showing a sharp slowdown? This is a key warning sign that the business is facing headwinds.',
    '- **Shrinking Profits? (Margin Compression):** Are profitability margins (ProfitMargin, OperatingMarginTTM) trending downwards? This means it\'s getting harder for the company to make a profit on what it sells.',
    '',
    '## 4. The Bottom Line: What Are the Biggest Worries?',
    'Based on the data, provide a brief, 1-2 sentence summary highlighting the top 2-3 risks an investor should be most aware of.'
].join('\n');

// --- Global State ---
let db;
let auth;
let userId;
let firebaseConfig = null;
let appIsInitialized = false;
let alphaVantageApiKey = "";
let geminiApiKey = "";
let searchApiKey = "";
let searchEngineId = "";
let googleClientId = "";
let driveTokenClient = null;
let driveFolderId = null; // Cache for Drive folder
let portfolioCache = [];
let calendarEvents = { earnings: [], ipos: [] };
let calendarCurrentDate = new Date();

// --- UTILITY & SECURITY HELPERS ---

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

function sanitizeText(text) {
    if (typeof text !== 'string') return '';
    const tempDiv = document.createElement('div');
    tempDiv.textContent = text;
    return tempDiv.innerHTML;
}

function isValidHttpUrl(urlString) {
    if (typeof urlString !== 'string' || !urlString) return false;
    try {
        const url = new URL(urlString);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch (_) {
        return false;
    }
}

function get(obj, path, defaultValue = undefined) {
  const value = path.split('.').reduce((a, b) => (a ? a[b] : undefined), obj);
  return value !== undefined ? value : defaultValue;
}

// --- MODAL HELPERS ---

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if(modal) {
        document.body.classList.add(CONSTANTS.CLASS_BODY_MODAL_OPEN);
        modal.classList.add(CONSTANTS.CLASS_MODAL_OPEN);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if(modal) {
        modal.classList.remove(CONSTANTS.CLASS_MODAL_OPEN);
        if (document.querySelectorAll('.modal.is-open').length === 0) {
             document.body.classList.remove(CONSTANTS.CLASS_BODY_MODAL_OPEN);
        }
    }
}

function displayMessageInModal(message, type = 'info') {
    const modalId = CONSTANTS.MODAL_MESSAGE;
    const modal = document.getElementById(modalId);
    const modalContent = modal ? modal.querySelector('.modal-content') : null;
    if (!modal || !modalContent) return;

    const card = document.createElement('div');
    card.className = 'bg-white rounded-2xl shadow-lg border border-gray-200 p-8 w-full max-w-sm m-4 text-center';
    const titleEl = document.createElement('h2');
    titleEl.className = 'text-2xl font-bold mb-4';
    const contentEl = document.createElement('p');
    contentEl.className = 'mb-6 text-gray-500 whitespace-pre-wrap';
    contentEl.textContent = message;
    const okButton = document.createElement('button');
    okButton.textContent = 'OK';
    okButton.className = 'bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-5 rounded-lg shadow-md transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 w-full';
    okButton.addEventListener('click', () => closeModal(modalId));

    switch (type) {
        case 'error': titleEl.textContent = 'Error!'; titleEl.classList.add('text-red-600'); break;
        case 'warning': titleEl.textContent = 'Warning!'; titleEl.classList.add('text-yellow-600'); break;
        default: titleEl.textContent = 'Info'; titleEl.classList.add('text-gray-800');
    }

    card.append(titleEl, contentEl, okButton);
    modalContent.innerHTML = '';
    modalContent.appendChild(card);
    openModal(modalId);
}

function openConfirmationModal(title, message, onConfirm) {
    const modalId = CONSTANTS.MODAL_CONFIRMATION;
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.querySelector('#confirmation-title').textContent = title;
    modal.querySelector('#confirmation-message').textContent = message;
    const confirmBtn = modal.querySelector('#confirm-button');
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    newConfirmBtn.addEventListener('click', () => {
        onConfirm();
        closeModal(modalId);
    });
    openModal(modalId);
}

// --- CONFIG & INITIALIZATION ---

function safeParseConfig(str) {
    try {
        const startIndex = str.indexOf('{');
        if (startIndex === -1) throw new Error("Could not find a '{' in the config string.");
        const objectStr = str.substring(startIndex);
        return JSON.parse(objectStr);
    } catch (error) {
        console.error("Failed to parse config string:", error);
        throw new Error("The provided Firebase config is not valid. Please paste the complete, valid JSON object from the Firebase console.");
    }
}

async function initializeAppContent() {
    if (appIsInitialized) return;
    appIsInitialized = true;
    document.getElementById('main-view').classList.remove(CONSTANTS.CLASS_HIDDEN);
    document.getElementById('stock-screener-section').classList.remove(CONSTANTS.CLASS_HIDDEN);
    document.getElementById('sector-screener-section').classList.remove(CONSTANTS.CLASS_HIDDEN);
    document.getElementById('market-calendar-section').classList.remove(CONSTANTS.CLASS_HIDDEN);
    displayMarketCalendar();
    renderSectorButtons();
}

async function initializeFirebase() {
    if (!firebaseConfig) return;
    try {
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);

        onAuthStateChanged(auth, user => {
            if (user) {
                userId = user.uid;
                if (!appIsInitialized) {
                    initializeAppContent();
                }
            } else {
                userId = null;
                if (appIsInitialized) {
                    displayMessageInModal("Your session has expired. Please log in again to continue.", "warning");
                }
                appIsInitialized = false;
                document.getElementById(CONSTANTS.CONTAINER_DYNAMIC_CONTENT).innerHTML = '';
            }
            setupAuthUI(user);
        });
        
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
        }

    } catch (error) {
        console.error("Firebase initialization error:", error);
        displayMessageInModal(`Firebase Error: ${error.message}. Please check your config object.`, 'error');
    }
}

async function handleApiKeySubmit(e) {
    e.preventDefault();
    alphaVantageApiKey = document.getElementById(CONSTANTS.INPUT_ALPHA_VANTAGE_KEY).value.trim();
    geminiApiKey = document.getElementById(CONSTANTS.INPUT_GEMINI_KEY).value.trim();
    googleClientId = document.getElementById(CONSTANTS.INPUT_GOOGLE_CLIENT_ID).value.trim();
    searchApiKey = document.getElementById(CONSTANTS.INPUT_WEB_SEARCH_KEY).value.trim();
    searchEngineId = document.getElementById(CONSTANTS.INPUT_SEARCH_ENGINE_ID).value.trim();
    const tempFirebaseConfigText = document.getElementById('firebaseConfigInput').value.trim();
    let tempFirebaseConfig;

    if (!alphaVantageApiKey || !geminiApiKey || !googleClientId || !searchApiKey || !searchEngineId || !tempFirebaseConfigText) {
        displayMessageInModal("All API Keys, Client ID, and the Firebase Config are required.", "warning");
        return;
    }
    
    try {
        tempFirebaseConfig = safeParseConfig(tempFirebaseConfigText);
        if (!tempFirebaseConfig.apiKey || !tempFirebaseConfig.projectId) {
            throw new Error("The parsed Firebase config is invalid or missing required properties.");
        }
    } catch (err) {
        displayMessageInModal(`Invalid Firebase Config: ${err.message}`, "error");
        return;
    }
    
    firebaseConfig = tempFirebaseConfig;
    
    initializeFirebase();
    initializeGoogleSignIn();
    closeModal(CONSTANTS.MODAL_API_KEY);
}

// --- AUTHENTICATION & GAPI INITIALIZATION ---

function initializeGoogleSignIn() {
    if (!googleClientId) return;
    try {
        google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleCredentialResponse,
        });
    } catch (error) {
        console.error("Google Sign-In initialization error:", error);
        displayMessageInModal("Could not initialize Google Sign-In. Check your Client ID and ensure you are loading the page from a valid origin.", "error");
    }
}

async function handleCredentialResponse(response) {
    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = "Verifying login...";
    try {
        const credential = GoogleAuthProvider.credential(response.credential);
        await signInWithCredential(auth, credential);
    } catch (error) {
        console.error("Firebase sign-in with Google credential failed:", error);
        displayMessageInModal(`Login failed: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

function initializeDriveTokenClient() {
    if (!googleClientId) return;
    try {
        driveTokenClient = google.accounts.oauth2.initTokenClient({
            client_id: googleClientId,
            scope: 'https://www.googleapis.com/auth/drive.file',
            callback: '', // Callback is handled by the promise in getDriveToken
        });
    } catch (error) {
        console.error("Drive token client initialization failed:", error);
    }
}

function handleLogout() {
    if (auth) {
        signOut(auth).catch(error => console.error("Sign out failed:", error));
    }
    if (typeof google !== 'undefined' && google.accounts) {
        google.accounts.id.disableAutoSelect();
    }
}

function setupAuthUI(user) {
    const authStatusEl = document.getElementById('auth-status');
    const appContainer = document.getElementById('app-container');
    if (!authStatusEl || !appContainer) return;

    authStatusEl.innerHTML = ''; // Clear previous state

    if (user && !user.isAnonymous) {
        appContainer.classList.remove(CONSTANTS.CLASS_HIDDEN);
        closeModal(CONSTANTS.MODAL_API_KEY);
        const photoEl = isValidHttpUrl(user.photoURL) 
            ? `<img src="${sanitizeText(user.photoURL)}" alt="User photo" class="w-8 h-8 rounded-full">`
            : `<div class="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-bold">${sanitizeText(user.displayName.charAt(0))}</div>`;
        
        authStatusEl.innerHTML = `
            <div class="bg-white/20 backdrop-blur-sm rounded-full p-1 flex items-center gap-2 text-white text-sm">
                ${photoEl}
                <span class="font-medium pr-2">${sanitizeText(user.displayName)}</span>
                <button id="logout-button" class="bg-white/20 hover:bg-white/40 text-white font-semibold py-1 px-3 rounded-full" title="Sign Out">Logout</button>
            </div>`;
        document.getElementById('logout-button').addEventListener('click', handleLogout);
        initializeDriveTokenClient();
    } else {
        appContainer.classList.add(CONSTANTS.CLASS_HIDDEN);
        if (typeof google !== 'undefined' && google.accounts) {
            google.accounts.id.renderButton(
                authStatusEl,
                { theme: "outline", size: "large", type: "standard", text: "signin_with" }
            );
        }
    }
}

// --- API CALLS ---

async function callApi(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timeoutId);
        if (!response.ok) {
            let errorBody;
            try { errorBody = await response.json(); } catch { errorBody = await response.text(); }
            const errorMsg = errorBody?.error?.message || errorBody?.Information || response.statusText;
            throw new Error(`API request failed: ${errorMsg}`);
        }
        return await response.json();
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') throw new Error('The API request timed out.');
        throw error;
    }
}

async function callGeminiApi(prompt) {
    if (!geminiApiKey) throw new Error("Gemini API key is not configured.");
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;
    const body = { contents: [{ parts: [{ "text": prompt }] }] };
    const data = await callApi(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    const candidate = data.candidates?.[0];

    if (candidate?.content?.parts?.[0]?.text) {
        return candidate.content.parts[0].text;
    }
    
    if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
        throw new Error(`The API call was terminated. Reason: ${candidate.finishReason}.`);
    }

    console.error("Unexpected Gemini API response structure:", data);
    throw new Error("Failed to parse the response from the Gemini API.");
}

async function callGeminiApiWithTools(contents) {
    if (!geminiApiKey) throw new Error("Gemini API key is not configured.");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;
    const data = await callApi(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contents),
    });

    const candidate = data.candidates?.[0];

    if (candidate?.content) {
        return candidate.content;
    }

    if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
        throw new Error(`The API call was terminated. Reason: ${candidate.finishReason}.`);
    }

    console.error("Unexpected Gemini API response structure:", data);
    throw new Error("Failed to parse the response from the Gemini API with tools.");
}


// --- PORTFOLIO MANAGEMENT (v6.0.0) ---

async function renderPortfolioView() {
    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = "Loading portfolio...";
    
    try {
        const querySnapshot = await getDocs(collection(db, CONSTANTS.DB_COLLECTION_PORTFOLIO));
        portfolioCache = querySnapshot.docs.map(doc => doc.data());
        portfolioCache.sort((a, b) => a.companyName.localeCompare(b.companyName));

        const container = document.getElementById(CONSTANTS.CONTAINER_PORTFOLIO_LIST);
        if (portfolioCache.length === 0) {
            container.innerHTML = `<p class="p-8 text-center text-gray-500">Your portfolio is empty. Add a stock to get started.</p>`;
            closeModal(CONSTANTS.MODAL_LOADING);
            return;
        }

        displayFilteredPortfolio(); // Initial display
        
    } catch (error) {
        console.error("Error loading portfolio:", error);
        displayMessageInModal(`Failed to load portfolio: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

function displayFilteredPortfolio(filter = '') {
    const container = document.getElementById(CONSTANTS.CONTAINER_PORTFOLIO_LIST);
    const lowercasedFilter = filter.toLowerCase();

    const filteredPortfolio = portfolioCache.filter(stock => 
        stock.companyName.toLowerCase().includes(lowercasedFilter) || 
        stock.ticker.toLowerCase().includes(lowercasedFilter)
    );

    if (filteredPortfolio.length === 0) {
        container.innerHTML = `<p class="p-8 text-center text-gray-500">No stocks match your search.</p>`;
        return;
    }

    const groupedByExchange = filteredPortfolio.reduce((acc, stock) => {
        const exchange = stock.exchange || 'Uncategorized';
        if (!acc[exchange]) acc[exchange] = [];
        acc[exchange].push(stock);
        return acc;
    }, {});

    const sortedExchanges = Object.keys(groupedByExchange).sort();
    
    let html = '';
    for (const exchange of sortedExchanges) {
        html += `<div class="portfolio-exchange-header">${sanitizeText(exchange)}</div>`;
        html += `<ul class="divide-y divide-gray-200">`;
        for (const stock of groupedByExchange[exchange]) {
            html += `
                <li class="p-4 flex justify-between items-center hover:bg-gray-50">
                    <div>
                        <button class="text-left portfolio-item-view" data-ticker="${sanitizeText(stock.ticker)}">
                            <p class="font-bold text-indigo-700">${sanitizeText(stock.companyName)}</p>
                            <p class="text-sm text-gray-600">${sanitizeText(stock.ticker)}</p>
                        </button>
                    </div>
                    <div class="flex gap-2">
                        <button class="portfolio-item-edit text-sm bg-yellow-100 text-yellow-800 hover:bg-yellow-200 font-semibold py-1 px-3 rounded-full" data-ticker="${sanitizeText(stock.ticker)}">Edit</button>
                        <button class="portfolio-item-delete text-sm bg-red-100 text-red-800 hover:bg-red-200 font-semibold py-1 px-3 rounded-full" data-ticker="${sanitizeText(stock.ticker)}">Delete</button>
                    </div>
                </li>`;
        }
        html += `</ul>`;
    }
    container.innerHTML = html;
}

async function openManageStockModal(ticker = null) {
    const form = document.getElementById('manage-stock-form');
    form.reset();
    
    if (ticker) {
        // Edit mode
        document.getElementById('manage-stock-modal-title').textContent = `Edit ${ticker}`;
        const stockData = portfolioCache.find(s => s.ticker === ticker);
        if (stockData) {
            document.getElementById('manage-stock-original-ticker').value = stockData.ticker;
            document.getElementById('manage-stock-ticker').value = stockData.ticker;
            document.getElementById('manage-stock-name').value = stockData.companyName;
            document.getElementById('manage-stock-exchange').value = stockData.exchange;
        }
    } else {
        // Add mode
        document.getElementById('manage-stock-modal-title').textContent = 'Add New Stock';
        document.getElementById('manage-stock-original-ticker').value = '';
    }
    openModal(CONSTANTS.MODAL_MANAGE_STOCK);
}

async function handleSaveStock(e) {
    e.preventDefault();
    const originalTicker = document.getElementById('manage-stock-original-ticker').value.trim().toUpperCase();
    const newTicker = document.getElementById('manage-stock-ticker').value.trim().toUpperCase();
    
    if (!/^[A-Z.]{1,10}$/.test(newTicker)) {
        displayMessageInModal("Please enter a valid stock ticker symbol.", "warning");
        return;
    }

    const stockData = {
        ticker: newTicker,
        companyName: document.getElementById('manage-stock-name').value.trim(),
        exchange: document.getElementById('manage-stock-exchange').value.trim(),
    };

    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = "Saving to portfolio...";
    
    try {
        if (originalTicker && originalTicker !== newTicker) {
            await deleteDoc(doc(db, CONSTANTS.DB_COLLECTION_PORTFOLIO, originalTicker));
        }
        await setDoc(doc(db, CONSTANTS.DB_COLLECTION_PORTFOLIO, newTicker), stockData);
        closeModal(CONSTANTS.MODAL_MANAGE_STOCK);
        await renderPortfolioView(); 
    } catch(error) {
        console.error("Error saving stock:", error);
        displayMessageInModal(`Could not save stock: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

async function handleDeleteStock(ticker) {
    openConfirmationModal(
        `Delete ${ticker}?`, 
        `Are you sure you want to remove ${ticker} from your portfolio? This will not delete the cached API data.`,
        async () => {
            openModal(CONSTANTS.MODAL_LOADING);
            document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Deleting ${ticker}...`;
            try {
                await deleteDoc(doc(db, CONSTANTS.DB_COLLECTION_PORTFOLIO, ticker));
                await renderPortfolioView();
            } catch (error) {
                console.error("Error deleting stock:", error);
                displayMessageInModal(`Could not delete ${ticker}: ${error.message}`, 'error');
            } finally {
                closeModal(CONSTANTS.MODAL_LOADING);
            }
        }
    );
}

// --- CORE STOCK RESEARCH LOGIC ---

async function fetchAndCacheStockData(symbol) {
    const dataToCache = {};
    const failedFetches = [];

    const promises = API_FUNCTIONS.map(async (func) => {
        try {
            let url;
            if (func === 'SMA') {
                url = `https://www.alphavantage.co/query?function=SMA&symbol=${symbol}&interval=daily&time_period=50&series_type=close&apikey=${alphaVantageApiKey}`;
            } else {
                url = `https://www.alphavantage.co/query?function=${func}&symbol=${symbol}&apikey=${alphaVantageApiKey}`;
            }
            if (func === 'TIME_SERIES_DAILY') {
                url += '&outputsize=compact';
            }
            
            const data = await callApi(url);
            if (data.Note || Object.keys(data).length === 0 || data.Information || data["Error Message"]) {
                throw new Error(data.Note || data.Information || data["Error Message"] || 'No data returned.');
            }
            return { func, data };
        } catch (error) {
            console.error(`Failed to fetch ${func} for ${symbol}:`, error);
            failedFetches.push(func);
            return null;
        }
    });

    const results = await Promise.all(promises);

    if (failedFetches.length > 0) {
        throw new Error(`Could not retrieve all required data. Failed to fetch: ${failedFetches.join(', ')}.`);
    }

    results.forEach(result => {
        if (result) dataToCache[result.func] = result.data;
    });

    if (!dataToCache.OVERVIEW || !dataToCache.OVERVIEW.Symbol) {
        throw new Error(`Essential 'OVERVIEW' data for ${symbol} could not be fetched. The symbol may be invalid.`);
    }

    dataToCache.cachedAt = Timestamp.now();
    await setDoc(doc(db, CONSTANTS.DB_COLLECTION_CACHE, symbol), dataToCache);
    return dataToCache;
}

async function handleRefreshData(symbol) {
    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Refreshing all data for ${symbol}...`;
    try {
        const refreshedData = await fetchAndCacheStockData(symbol);
        document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Rendering UI...`;
        
        const newCardHtml = renderOverviewCard(refreshedData, symbol);
        const oldCard = document.getElementById(`card-${symbol}`);
        if(oldCard) {
             const tempDiv = document.createElement('div');
             tempDiv.innerHTML = newCardHtml;
             oldCard.replaceWith(tempDiv.firstChild);
             
             // Re-render sparkline
             const timeSeries = refreshedData.TIME_SERIES_DAILY ? refreshedData.TIME_SERIES_DAILY['Time Series (Daily)'] : null;
             const quoteData = refreshedData.GLOBAL_QUOTE ? refreshedData.GLOBAL_QUOTE['Global Quote'] : {};
             const change = quoteData && quoteData['09. change'] ? parseFloat(quoteData['09. change']) : 0;
             renderSparkline(`sparkline-${symbol}`, timeSeries, change);
        } else { 
            await displayStockCard(symbol);
        }

    } catch (error) {
        console.error("Error refreshing stock data:", error);
        displayMessageInModal(error.message, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

async function handleResearchSubmit(e) {
    e.preventDefault();
    const tickerInput = document.getElementById(CONSTANTS.INPUT_TICKER);
    const symbol = tickerInput.value.trim().toUpperCase();
    if (!/^[A-Z.]{1,10}$/.test(symbol)) {
        displayMessageInModal("Please enter a valid stock ticker symbol.", "warning");
        return;
    }
    
    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Checking portfolio for ${symbol}...`;
    
    try {
        const docRef = doc(db, CONSTANTS.DB_COLLECTION_PORTFOLIO, symbol);
        if ((await getDoc(docRef)).exists()) {
             displayMessageInModal(`${symbol} is already in your portfolio.`, 'info');
             tickerInput.value = '';
             closeModal(CONSTANTS.MODAL_LOADING);
             return;
        }
        
        document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Fetching overview for ${symbol}...`;
        const overviewData = await callApi(`https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${alphaVantageApiKey}`);
        
        if (!overviewData.Symbol) {
            throw new Error(`Could not fetch data for ${symbol}. It may be an invalid ticker.`);
        }

        const newStock = {
            ticker: overviewData.Symbol,
            companyName: overviewData.Name,
            exchange: overviewData.Exchange,
        };
        
        document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Adding ${symbol} to portfolio...`;
        await setDoc(doc(db, CONSTANTS.DB_COLLECTION_PORTFOLIO, newStock.ticker), newStock);

        tickerInput.value = '';
        displayMessageInModal(`${symbol} has been added to your portfolio.`, 'info');
        await displayStockCard(newStock.ticker);

    } catch (error) {
        console.error("Error during stock research:", error);
        displayMessageInModal(error.message, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

async function displayStockCard(ticker) {
    if (document.getElementById(`card-${ticker}`)) {
        document.getElementById(`card-${ticker}`).scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Loading card for ${ticker}...`;
    
    try {
        let stockData;
        const cachedDocRef = doc(db, CONSTANTS.DB_COLLECTION_CACHE, ticker);
        const cachedDocSnap = await getDoc(cachedDocRef);

        if (cachedDocSnap.exists()) {
            stockData = cachedDocSnap.data();
        } else {
            document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `First time load: Fetching all data for ${ticker}...`;
            stockData = await fetchAndCacheStockData(ticker);
        }

        const newCardHtml = renderOverviewCard(stockData, ticker);
        document.getElementById(CONSTANTS.CONTAINER_DYNAMIC_CONTENT).insertAdjacentHTML('beforeend', newCardHtml);
        
        const timeSeries = stockData.TIME_SERIES_DAILY ? stockData.TIME_SERIES_DAILY['Time Series (Daily)'] : null;
        const quoteData = stockData.GLOBAL_QUOTE ? stockData.GLOBAL_QUOTE['Global Quote'] : {};
        const change = quoteData && quoteData['09. change'] ? parseFloat(quoteData['09. change']) : 0;
        renderSparkline(`sparkline-${ticker}`, timeSeries, change);

    } catch(error) {
        console.error(`Error displaying card for ${ticker}:`, error);
        displayMessageInModal(error.message, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

// --- NEWS FEATURE ---

function filterValidNews(articles) {
    if (!Array.isArray(articles)) return [];
    return articles.filter(article => 
        article.title && article.snippet && isValidHttpUrl(article.link)
    );
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

function renderNewsArticles(articlesWithSentiment, summaryMarkdown, symbol) {
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
                    <a href="${sanitizeText(article.link)}" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:underline font-semibold block mb-2">${sanitizeText(article.title)}</a>
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

async function handleFetchNews(symbol) {
    const button = document.querySelector(`#card-${symbol} .fetch-news-button`);
    if (!button) return;

    if (!searchApiKey || !searchEngineId) {
        displayMessageInModal("News feature requires the Web Search API Key and Search Engine ID.", "warning");
        return;
    }
    
    button.disabled = true;
    button.textContent = 'Analyzing...';

    try {
        const stockData = await getStockDataFromCache(symbol);
        const companyName = get(stockData, 'OVERVIEW.Name', symbol);
        const query = encodeURIComponent(`${companyName} (${symbol}) stock market news`);
        const url = `https://www.googleapis.com/customsearch/v1?key=${searchApiKey}&cx=${searchEngineId}&q=${query}&sort=date&dateRestrict=m[1]`;
        
        const newsData = await callApi(url);
        let validArticles = filterValidNews(newsData.items);

        // Filter for articles in the last 30 days that have a publication date
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentArticles = validArticles.map(a => {
            const pubDateStr = a.pagemap?.newsarticle?.[0]?.datepublished || a.pagemap?.metatags?.[0]?.['article:published_time'] || a.pagemap?.metatags?.[0]?.date;
            if (!pubDateStr) return null;
            const publicationDate = new Date(pubDateStr);
            return { ...a, publicationDate };
        }).filter(a => a && a.publicationDate >= thirtyDaysAgo);

        if (recentArticles.length > 0) {
            const articlesForPrompt = recentArticles.slice(0, 10).map(a => ({ 
                title: a.title, 
                snippet: a.snippet,
                publicationDate: a.publicationDate.toISOString().split('T')[0] 
            }));

            const prompt = NEWS_SENTIMENT_PROMPT
                .replace('{companyName}', companyName)
                .replace('{tickerSymbol}', symbol)
                .replace('{news_articles_json}', JSON.stringify(articlesForPrompt, null, 2));

            const rawResult = await callGeminiApi(prompt);
            
            // Separate JSON from markdown summary
            const jsonMatch = rawResult.match(/```json\n([\s\S]*?)\n```|(\[[\s\S]*\])/);
            const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[2]).trim() : '';
            const summaryMarkdown = rawResult.split(jsonMatch ? jsonMatch[0] : ']').pop().trim();

            const sentiments = JSON.parse(jsonString);
            
            // The prompt asks the AI to return data for the articles we sent.
            // We can add the link back by matching the titles or assuming the order is preserved.
            // Assuming order is preserved is simpler and likely correct.
            if (Array.isArray(sentiments) && sentiments.length === articlesForPrompt.length) {
                const articlesWithSentiment = sentiments.map((sentiment, index) => ({
                    ...sentiment,
                    title: recentArticles[index].title,
                    link: recentArticles[index].link
                }));
                 renderNewsArticles(articlesWithSentiment, summaryMarkdown, symbol);
            } else {
                 renderNewsArticles([], '', symbol); // Fallback if parsing fails
            }
        } else {
             renderNewsArticles([], '', symbol);
        }

    } catch (error) {
        console.error("Error fetching news:", error);
        displayMessageInModal(`Could not fetch news: ${error.message}`, 'error');
        renderNewsArticles([], '', symbol); // Render empty state on error
    } finally {
        button.disabled = false;
        button.textContent = 'Fetch News';
    }
}

// --- UI RENDERING ---

function renderSparkline(canvasId, timeSeriesData, change) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !timeSeriesData) return;
    
    // Destroy previous chart instance if it exists
    const existingChart = Chart.getChart(canvasId);
    if (existingChart) {
        existingChart.destroy();
    }

    const dataPoints = Object.entries(timeSeriesData).map(([date, values]) => ({
        x: new Date(date),
        y: parseFloat(values['4. close'])
    })).sort((a, b) => a.x - b.x);

    if (dataPoints.length < 2) return;

    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                data: dataPoints,
                borderColor: change >= 0 ? '#16a34a' : '#dc2626',
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    intersect: false,
                    mode: 'index',
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day'
                    },
                    display: false
                },
                y: {
                    display: false
                }
            }
        }
    });
}

function renderCalendar() {
    const year = calendarCurrentDate.getFullYear();
    const month = calendarCurrentDate.getMonth();
    
    const calendarBody = document.getElementById('calendar-grid-body');
    const monthYearHeader = document.getElementById('month-year-header');
    if (!calendarBody || !monthYearHeader) return;
    
    monthYearHeader.textContent = `${calendarCurrentDate.toLocaleString('default', { month: 'long' })} ${year}`;

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    calendarBody.innerHTML = '';
    
    let date = 1;
    let html = '';
    
    for (let i = 0; i < 6; i++) { // 6 rows
        for (let j = 0; j < 7; j++) { // 7 days
            if (i === 0 && j < firstDayOfMonth) {
                html += `<div class="calendar-day calendar-day-other-month"></div>`;
            } else if (date > daysInMonth) {
                html += `<div class="calendar-day calendar-day-other-month"></div>`;
            } else {
                const currentDate = new Date(year, month, date);
                const today = new Date();
                let todayClass = '';
                if (date === today.getDate() && year === today.getFullYear() && month === today.getMonth()) {
                    todayClass = ' calendar-day-today';
                }

                // Find events for this day
                const earningsForDay = calendarEvents.earnings.filter(e => e.eventDate.toDateString() === currentDate.toDateString());
                const iposForDay = calendarEvents.ipos.filter(i => i.eventDate.toDateString() === currentDate.toDateString());
                
                let eventsHtml = '<div class="overflow-y-auto h-full">';
                earningsForDay.forEach(e => {
                    eventsHtml += `<div class="calendar-event calendar-event-earnings" title="${sanitizeText(e.name)}">${sanitizeText(e.symbol)}</div>`;
                });
                iposForDay.forEach(i => {
                    eventsHtml += `<div class="calendar-event calendar-event-ipo" title="${sanitizeText(i.name)}">${sanitizeText(i.symbol)}</div>`;
                });
                eventsHtml += '</div>';

                html += `
                    <div class="calendar-day${todayClass}">
                        <div class="font-semibold text-gray-700">${date}</div>
                        ${eventsHtml}
                    </div>
                `;
                date++;
            }
        }
    }
    calendarBody.innerHTML = html;
}

async function displayMarketCalendar() {
    const calendarBody = document.getElementById('calendar-grid-body');
    const monthYearHeader = document.getElementById('month-year-header');

    if (!calendarBody || !monthYearHeader) return;

    calendarBody.innerHTML = `<div class="col-span-7 p-4 text-center text-gray-400">Loading calendar data...</div>`;

    function processRawCalendarData(earningsData, ipoData) {
        calendarEvents.earnings = [];
        calendarEvents.ipos = [];
        if (earningsData && earningsData.length > 0 && earningsData[0].symbol) {
            calendarEvents.earnings = earningsData
                .filter(e => e.symbol && e.reportDate)
                .filter(e => !e.symbol.includes('.') && e.symbol.length <= 4 && !e.name.toUpperCase().includes('OTC'))
                .map(e => ({...e, eventDate: new Date(e.reportDate)}));
        }
        if (ipoData && ipoData.length > 0 && ipoData[0].symbol) {
             calendarEvents.ipos = ipoData
                .filter(i => i.symbol && i.ipoDate)
                .filter(i => !i.symbol.includes('.') && i.symbol.length <= 4 && !i.name.toUpperCase().includes('OTC'))
                .map(i => ({...i, eventDate: new Date(i.ipoDate)}));
        }
    }
    
    const docRef = doc(db, CONSTANTS.DB_COLLECTION_CALENDAR, 'latest');
    let shouldFetchNewData = true;

    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const cachedData = docSnap.data();
            const cacheDate = cachedData.cachedAt.toDate();
            const daysSinceCache = (new Date() - cacheDate) / (1000 * 60 * 60 * 24);
            
            if (daysSinceCache < 30) {
                processRawCalendarData(cachedData.earnings, cachedData.ipos);
                shouldFetchNewData = false;
            }
        }
    } catch (dbError) {
        console.error("Error reading calendar cache from Firestore:", dbError);
        // Proceed to fetch new data if cache read fails
    }
    
    if (shouldFetchNewData) {
        try {
            const [earningsResponse, ipoResponse] = await Promise.all([
                fetch(`https://www.alphavantage.co/query?function=EARNINGS_CALENDAR&horizon=3month&apikey=${alphaVantageApiKey}`),
                fetch(`https://www.alphavantage.co/query?function=IPO_CALENDAR&apikey=${alphaVantageApiKey}`)
            ]);

            const earningsCsv = await earningsResponse.text();
            const ipoCsv = await ipoResponse.text();
            
            const rawEarningsData = Papa.parse(earningsCsv, { header: true, skipEmptyLines: true }).data;
            const rawIpoData = Papa.parse(ipoCsv, { header: true, skipEmptyLines: true }).data;
            
            const earningsToCache = rawEarningsData
                .filter(e => e.symbol && e.reportDate && !e.symbol.includes('.') && e.symbol.length <= 4 && !e.name.toUpperCase().includes('OTC'))
                .map(e => ({ symbol: e.symbol, name: e.name, reportDate: e.reportDate }));
            
            const iposToCache = rawIpoData
                .filter(i => i.symbol && i.ipoDate && !i.symbol.includes('.') && i.symbol.length <= 4 && !i.name.toUpperCase().includes('OTC'))
                .map(i => ({ symbol: i.symbol, name: i.name, ipoDate: i.ipoDate }));

            const dataToCache = { 
                earnings: earningsToCache, 
                ipos: iposToCache, 
                cachedAt: Timestamp.now() 
            };
            await setDoc(docRef, dataToCache);

            processRawCalendarData(earningsToCache, iposToCache);

        } catch (apiError) {
            console.error("Error fetching calendar data from API:", apiError);
            calendarBody.innerHTML = `<div class="col-span-7 p-4 text-center text-red-500">Could not load calendar data. The API might be unavailable.</div>`;
            monthYearHeader.textContent = 'Error';
            return;
        }
    }

    renderCalendar();
}

function renderSectorButtons() {
    const container = document.getElementById('sector-buttons-container');
    if (!container) return;
    container.innerHTML = SECTORS.map(sector => 
        `<button class="btn-sector bg-sky-100 text-sky-800 hover:bg-sky-200 font-semibold py-2 px-4 rounded-lg transition-all duration-200" data-sector="${sanitizeText(sector)}">${sanitizeText(sector)}</button>`
    ).join('');
}

function renderOverviewCard(data, symbol) {
    const overviewData = data.OVERVIEW;
    if (!overviewData || !overviewData.Symbol) return '';

    const quoteData = data.GLOBAL_QUOTE ? data.GLOBAL_QUOTE['Global Quote'] : {};
    const price = quoteData && quoteData['05. price'] ? parseFloat(quoteData['05. price']).toFixed(2) : 'N/A';
    const change = quoteData && quoteData['09. change'] ? parseFloat(quoteData['09. change']) : 0;
    const changePercent = quoteData && quoteData['10. change percent'] ? parseFloat(quoteData['10. change percent'].replace('%','')).toFixed(2) : 0;
    const changeColorClass = change >= 0 ? 'price-gain' : 'price-loss';
    const changeSign = change >= 0 ? '+' : '';

    const smaData = data.SMA ? data.SMA['Technical Analysis: SMA'] : null;
    let sma50 = 'N/A';
    if (smaData) {
        const latestSmaDate = Object.keys(smaData)[0];
        if (latestSmaDate) {
            sma50 = parseFloat(smaData[latestSmaDate]['SMA']).toFixed(2);
        }
    }
    
    const marketCap = formatLargeNumber(overviewData.MarketCapitalization);
    const peRatio = overviewData.PERatio !== "None" ? overviewData.PERatio : "N/A";
    const sma200 = overviewData['200DayMovingAverage'] && overviewData['200DayMovingAverage'] !== "None" ? `$${parseFloat(overviewData['200DayMovingAverage']).toFixed(2)}` : "N/A";
    const timestampString = data.cachedAt ? `Data Stored On: ${data.cachedAt.toDate().toLocaleString()}` : '';

    return `
        <div class="bg-white rounded-2xl shadow-lg border border-gray-200 p-6" id="card-${symbol}">
            <div class="flex justify-between items-start gap-4">
                <div>
                    <h2 class="text-2xl font-bold text-gray-800">${sanitizeText(overviewData.Name)} (${sanitizeText(overviewData.Symbol)})</h2>
                    <p class="text-gray-500">${sanitizeText(overviewData.Exchange)} | ${sanitizeText(overviewData.Sector)}</p>
                </div>
                <div class="text-right flex-shrink-0">
                    <p class="text-2xl font-bold">${price}</p>
                    <p class="text-sm font-semibold ${changeColorClass}">${changeSign}${change.toFixed(2)} (${changeSign}${changePercent}%)</p>
                </div>
            </div>
            
            <div class="my-4 h-20 relative">
                <canvas id="sparkline-${symbol}"></canvas>
            </div>

            <p class="mt-4 text-sm text-gray-600">${sanitizeText(overviewData.Description)}</p>
            
            <div class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center border-t pt-4">
                <div><p class="text-sm text-gray-500">Market Cap</p><p class="text-lg font-semibold">${sanitizeText(marketCap)}</p></div>
                <div><p class="text-sm text-gray-500">P/E Ratio</p><p class="text-lg font-semibold">${sanitizeText(peRatio)}</p></div>
                <div><p class="text-sm text-gray-500">50-Day MA</p><p class="text-lg font-semibold">$${sanitizeText(sma50)}</p></div>
                <div><p class="text-sm text-gray-500">200-Day MA</p><p class="text-lg font-semibold">${sanitizeText(sma200)}</p></div>
            </div>

            <div class="mt-6 border-t pt-4 flex flex-wrap gap-2 justify-center">
                <button data-symbol="${symbol}" class="refresh-data-button text-xs bg-indigo-100 text-indigo-700 hover:bg-indigo-200 font-semibold py-1 px-3 rounded-full">Refresh Data</button>
                <button data-symbol="${symbol}" class="view-json-button text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg">View JSON</button>
                <button data-symbol="${symbol}" class="fetch-news-button text-sm bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg">Fetch News</button>
                <button data-symbol="${symbol}" class="undervalued-analysis-button text-sm bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-4 rounded-lg">Undervalued Analysis</button>
                <button data-symbol="${symbol}" class="financial-analysis-button text-sm bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg">Financial Analysis</button>
            </div>
            <div class="mt-4 border-t pt-4 flex flex-wrap gap-2 justify-center">
                <button data-symbol="${symbol}" class="bull-bear-analysis-button text-sm bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg">Bull vs. Bear</button>
                <button data-symbol="${symbol}" class="moat-analysis-button text-sm bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-2 px-4 rounded-lg">Moat Analysis</button>
                <button data-symbol="${symbol}" class="dividend-safety-button text-sm bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-4 rounded-lg">Dividend Safety</button>
                <button data-symbol="${symbol}" class="growth-outlook-button text-sm bg-lime-500 hover:bg-lime-600 text-white font-semibold py-2 px-4 rounded-lg">Growth Outlook</button>
                <button data-symbol="${symbol}" class="risk-assessment-button text-sm bg-rose-500 hover:bg-rose-600 text-white font-semibold py-2 px-4 rounded-lg">Risk Assessment</button>
            </div>
            <div class="text-right text-xs text-gray-400 mt-4">${timestampString}</div>
        </div>`;
}

// --- EVENT LISTENER SETUP ---

function setupGlobalEventListeners() {
    document.getElementById(CONSTANTS.CONTAINER_DYNAMIC_CONTENT).addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        
        const symbol = target.dataset.symbol || target.dataset.ticker;
        if (!symbol) return;

        if (target.classList.contains('refresh-data-button')) handleRefreshData(symbol);
        if (target.classList.contains('view-json-button')) handleViewFullData(symbol);
        if (target.classList.contains('financial-analysis-button')) handleFinancialAnalysis(symbol);
        if (target.classList.contains('undervalued-analysis-button')) handleUndervaluedAnalysis(symbol);
        if (target.classList.contains('fetch-news-button')) handleFetchNews(symbol);
        if (target.classList.contains('bull-bear-analysis-button')) handleBullBearAnalysis(symbol);
        if (target.classList.contains('moat-analysis-button')) handleMoatAnalysis(symbol);
        if (target.classList.contains('dividend-safety-button')) handleDividendSafetyAnalysis(symbol);
        if (target.classList.contains('growth-outlook-button')) handleGrowthOutlookAnalysis(symbol);
        if (target.classList.contains('risk-assessment-button')) handleRiskAssessmentAnalysis(symbol);
    });

    document.getElementById(CONSTANTS.CONTAINER_PORTFOLIO_LIST).addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        const ticker = target.dataset.ticker;
        if (!ticker) return;

        if (target.classList.contains('portfolio-item-view')) {
            displayStockCard(ticker);
            closeModal(CONSTANTS.MODAL_PORTFOLIO);
        }
        if (target.classList.contains('portfolio-item-edit')) openManageStockModal(ticker);
        if (target.classList.contains('portfolio-item-delete')) handleDeleteStock(ticker);
    });
}

function setupEventListeners() {
    document.getElementById(CONSTANTS.FORM_API_KEY)?.addEventListener('submit', handleApiKeySubmit);
    document.getElementById(CONSTANTS.FORM_STOCK_RESEARCH)?.addEventListener('submit', handleResearchSubmit);
    document.getElementById(CONSTANTS.BUTTON_VIEW_STOCKS)?.addEventListener('click', () => {
        renderPortfolioView();
        openModal(CONSTANTS.MODAL_PORTFOLIO);
    });

    document.getElementById('portfolio-search-input')?.addEventListener('input', (e) => displayFilteredPortfolio(e.target.value));
    document.getElementById(CONSTANTS.BUTTON_ADD_NEW_STOCK)?.addEventListener('click', () => openManageStockModal());

    document.getElementById('manage-stock-form')?.addEventListener('submit', handleSaveStock);
    document.getElementById('cancel-manage-stock-button')?.addEventListener('click', () => closeModal(CONSTANTS.MODAL_MANAGE_STOCK));

    document.querySelectorAll('.save-to-drive-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const modalId = e.target.dataset.modalId;
            handleSaveToDrive(modalId);
        });
    });

    const scrollTopBtn = document.getElementById(CONSTANTS.BUTTON_SCROLL_TOP);
    if (scrollTopBtn) scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    const modalsToClose = [
        { modal: CONSTANTS.MODAL_FULL_DATA, button: 'close-full-data-modal', bg: 'close-full-data-modal-bg' },
        { modal: CONSTANTS.MODAL_FINANCIAL_ANALYSIS, button: 'close-financial-analysis-modal', bg: 'close-financial-analysis-modal-bg' },
        { modal: CONSTANTS.MODAL_UNDERVALUED_ANALYSIS, button: 'close-undervalued-analysis-modal', bg: 'close-undervalued-analysis-modal-bg' },
        { modal: CONSTANTS.MODAL_CUSTOM_ANALYSIS, button: 'close-custom-analysis-modal', bg: 'close-custom-analysis-modal-bg' },
        { modal: CONSTANTS.MODAL_PORTFOLIO, button: 'close-portfolio-modal', bg: 'close-portfolio-modal-bg' },
        { modal: CONSTANTS.MODAL_MANAGE_STOCK, bg: 'close-manage-stock-modal-bg'},
        { modal: CONSTANTS.MODAL_CONFIRMATION, button: 'cancel-button'},
    ];

    modalsToClose.forEach(item => {
        const close = () => closeModal(item.modal);
        if (item.button) document.getElementById(item.button)?.addEventListener('click', close);
        if (item.bg) document.getElementById(item.bg)?.addEventListener('click', close);
    });

    window.addEventListener('scroll', () => {
        const btn = document.getElementById(CONSTANTS.BUTTON_SCROLL_TOP);
        if (btn) btn.classList.toggle(CONSTANTS.CLASS_HIDDEN, window.scrollY <= 300);
    });
    
    document.getElementById('sector-buttons-container')?.addEventListener('click', (e) => {
        const target = e.target.closest('button.btn-sector');
        if (target && target.dataset.sector) {
            handleSectorAnalysisWithAIAgent(target.dataset.sector);
        }
    });

    document.getElementById('prev-month-button')?.addEventListener('click', () => {
        calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() - 1);
        renderCalendar();
    });

    document.getElementById('next-month-button')?.addEventListener('click', () => {
        calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() + 1);
        renderCalendar();
    });

    setupGlobalEventListeners();
}

// --- SECTOR ANALYSIS: AI AGENT WORKFLOW (v7.0.3) ---

/**
 * Tool 1: Searches for recent news articles for a given financial sector.
 * This tool is declared to the Gemini model, which can then request its execution.
 */
async function searchSectorNews({ sectorName }) {
    if (!searchApiKey || !searchEngineId) {
        throw new Error("Web Search API Key and Search Engine ID are required for news search.");
    }
    const siteQuery = FINANCIAL_NEWS_SOURCES.map(site => `site:${site}`).join(' OR ');
    const query = encodeURIComponent(`"${sectorName} sector" ("earnings report" OR "analyst rating" OR "growth driver" OR "stock upgrade") (${siteQuery})`);
    const url = `https://www.googleapis.com/customsearch/v1?key=${searchApiKey}&cx=${searchEngineId}&q=${query}&sort=date&dateRestrict=d[30]&num=10`;
    
    const newsData = await callApi(url);
    const validArticles = filterValidNews(newsData.items || []);

    if (validArticles.length === 0) {
        // Return a structured error that the model can understand
        return { error: "No relevant news articles found", detail: `Could not find any recent news for the ${sectorName} sector in the last 30 days.` };
    }

    // Return a clean list of articles for the next tool
    return {
        articles: validArticles.map((a, index) => {
            const pubDateStr = a.pagemap?.newsarticle?.[0]?.datepublished || a.pagemap?.metatags?.[0]?.['article:published_time'] || a.pagemap?.metatags?.[0]?.date;
            return {
                title: a.title,
                snippet: a.snippet,
                link: a.link,
                source: a.displayLink,
                publicationDate: pubDateStr ? new Date(pubDateStr).toISOString().split('T')[0] : 'N/A',
                articleIndex: index
            };
        })
    };
}

/**
 * Tool 2: Synthesizes news articles to identify and rank noteworthy companies.
 * This tool is declared to the Gemini model.
 */
async function synthesizeAndRankCompanies({ newsArticles }) {
    const prompt = `
        Role: You are a quantitative financial analyst AI. Your task is to analyze a list of financial news articles and identify the most noteworthy companies based on the significance and sentiment of the news.

        Task:
        1. Read the provided JSON data of news articles.
        2. For each article, extract any mentioned companies, their ticker symbols (if possible), and the context of the mention.
        3. Based on the collective news, identify the Top 3-5 most favorably mentioned companies. Your ranking must be based on the significance (e.g., earnings reports > product updates) and positive sentiment of the news.
        
        Output Format: Return ONLY a valid JSON object. The JSON should have a single key "topCompanies" which is an array of objects. Each object must contain "companyName", "ticker", and a "rankingJustification" that briefly explains why it was ranked highly based on its positive news mentions. Include the source article indices in the justification.

        News Articles JSON Data:
        ${JSON.stringify(newsArticles, null, 2)}
    `;

    const resultText = await callGeminiApi(prompt);
    try {
        // Clean and parse the JSON response from the model
        const cleanedJson = resultText.replace(/```json\n|```/g, '').trim();
        return JSON.parse(cleanedJson);
    } catch (error) {
        console.error("Error parsing synthesis result:", error);
        return { error: "Failed to parse analysis from AI", detail: error.message };
    }
}

/**
 * Tool 3: Generates the final, user-facing deep-dive report.
 * This tool is declared to the Gemini model.
 */
async function generateDeepDiveReport({ companyAnalysis, sectorName, originalArticles }) {
    const prompt = `
        Role: You are an expert financial analyst AI. Your task is to write a detailed investment research report for a specific economic sector based on pre-analyzed news data.

        Task: Use the provided "Top Companies" JSON to generate a comprehensive markdown report. For each company, create a detailed section including an investment thesis and a list of the positive catalysts mentioned in the news.

        Output Format: Use professional markdown. For each catalyst, you MUST append a source placeholder at the end of the line, like this: \`[Source: X]\`, where X is the \`articleIndex\` from the original news data.

        Top Ranked Companies JSON:
        ${JSON.stringify(companyAnalysis, null, 2)}

        ---
        ## AI-Powered Market Analysis: ${sectorName} Sector

        ### Overall Sector Outlook & Key Themes
        Provide a 2-3 sentence summary of the overall outlook for the ${sectorName} sector based on the collective news represented in the ranked companies. Identify the most significant themes present.

        ### Deeper Dive: Top Companies in the News
        For each of the companies in the "Top Ranked Companies JSON", create a detailed section:
        1. Use its name and ticker as a sub-header (e.g., "### 1. NVIDIA Corp (NVDA)").
        2. **Investment Thesis:** Write a concise, 2-3 sentence investment thesis summarizing why this company is currently viewed favorably based on the provided justification.
        3. **Positive Catalysts:** Create a bulleted list of the specific positive events mentioned in the news. Use the 'rankingJustification' to construct these points and append the source placeholder for verifiability.
    `;
    
    let finalReport = await callGeminiApi(prompt);

    // Post-processing to inject verifiable source links
    finalReport = finalReport.replace(/\[Source: (\d+)\]/g, (match, indexStr) => {
        const index = parseInt(indexStr, 10);
        const article = originalArticles.find(a => a.articleIndex === index);
        if (article) {
            const sourceParts = article.source.split('.');
            const sourceName = sourceParts.length > 1 ? sourceParts[sourceParts.length - 2] : article.source;
            return `[(Source: ${sourceName}, ${article.publicationDate})](${article.link})`;
        }
        return match; // Return original placeholder if article not found
    });

    return { report: finalReport };
}


/**
 * Main orchestrator function for the AI-driven sector analysis.
 * This function manages the conversation with Gemini, including executing tool calls.
 */
async function handleSectorAnalysisWithAIAgent(sectorName) {
    if (!searchApiKey || !searchEngineId || !geminiApiKey) {
        displayMessageInModal("This feature requires the Web Search API Key, Search Engine ID, and Gemini API Key.", "warning");
        return;
    }

    openModal(CONSTANTS.MODAL_LOADING);
    const loadingMessage = document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE);
    loadingMessage.textContent = `Initiating AI analysis for the ${sectorName} sector...`;

    // 1. Define the tools available to the Gemini model.
    const tools = {
        functionDeclarations: [
            {
                name: "searchSectorNews",
                description: "Searches for recent (last 30 days) financial news articles for a given economic sector from a list of reputable sources.",
                parameters: {
                    type: "object",
                    properties: {
                        sectorName: { type: "string", description: "The financial sector to search for, e.g., 'Technology' or 'Health Care'." },
                    },
                    required: ["sectorName"],
                },
            },
            {
                name: "synthesizeAndRankCompanies",
                description: "Analyzes a list of news articles to identify and rank the top 3-5 most favorably mentioned companies, returning a JSON object with justifications.",
                parameters: {
                    type: "object",
                    properties: {
                        newsArticles: { type: "array", description: "An array of news article objects, each with a title and snippet.", items: { type: "object" } },
                    },
                    required: ["newsArticles"],
                },
            },
            {
                name: "generateDeepDiveReport",
                description: "Generates a final, user-facing markdown report summarizing the analysis of top companies in a sector.",
                parameters: {
                    type: "object",
                    properties: {
                        companyAnalysis: { type: "object", description: "The JSON object containing the ranked list of top companies and their analysis." },
                        sectorName: { type: "string", description: "The name of the sector being analyzed." },
                    },
                    required: ["companyAnalysis", "sectorName"],
                },
            },
        ],
    };

    // 2. Map tool names to their actual callable JavaScript functions.
    const toolFunctions = {
        'searchSectorNews': searchSectorNews,
        'synthesizeAndRankCompanies': synthesizeAndRankCompanies,
        'generateDeepDiveReport': generateDeepDiveReport,
    };

    // 3. Start the conversation with the initial user request.
    const conversationHistory = [{
        role: "user",
        parts: [{ text: `Generate a deep-dive analysis report for the ${sectorName} sector. Start by searching for relevant news.` }],
    }];
    
    let originalArticles = []; // Store articles to pass to the final tool

    try {
        for (let i = 0; i < 5; i++) { // Max 5 turns to prevent infinite loops
            const contents = {
                contents: conversationHistory,
                tools: [tools]
            };
            
            const responseContent = await callGeminiApiWithTools(contents);
            const responseParts = responseContent.parts;
            conversationHistory.push({ role: 'model', parts: responseParts });

            const toolCalls = responseParts
                .filter(part => part.functionCall)
                .map(part => part.functionCall);

            if (toolCalls.length === 0) {
                // Final response received from the model
                loadingMessage.textContent = 'Finalizing report...';
                const finalReportText = responseParts.map(part => part.text || '').join('\n');
                document.getElementById('custom-analysis-content').innerHTML = marked.parse(finalReportText);
                document.getElementById('custom-analysis-modal-title').textContent = `Sector Analysis | ${sectorName}`;
                openModal(CONSTANTS.MODAL_CUSTOM_ANALYSIS);
                break; // Exit the loop
            }

            // Execute tool calls in parallel
            loadingMessage.textContent = `AI is running tools: ${toolCalls.map(tc => tc.name).join(', ')}...`;
            const toolExecutionPromises = toolCalls.map(toolCall => {
                const func = toolFunctions[toolCall.name];
                if (!func) throw new Error(`Unknown tool: ${toolCall.name}`);
                
                // Special handling to pass original articles to the final reporting tool
                if (toolCall.name === 'generateDeepDiveReport') {
                    toolCall.args.originalArticles = originalArticles;
                }
                
                return func(toolCall.args);
            });
            
            const toolResults = await Promise.all(toolExecutionPromises);

            // Store articles if they were just fetched
            const newsSearchResult = toolResults.find((res, idx) => toolCalls[idx].name === 'searchSectorNews');
            if(newsSearchResult && newsSearchResult.articles) {
                originalArticles = newsSearchResult.articles;
            }

            // Add tool responses to conversation history
            conversationHistory.push({
                role: 'user', // Function results are sent back as the user
                parts: toolResults.map((result, i) => ({
                    functionResponse: { name: toolCalls[i].name, response: result }
                }))
            });
        }
    } catch (error) {
        console.error("Error during AI agent sector analysis:", error);
        displayMessageInModal(`Could not complete AI analysis: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}


// --- AI ANALYSIS REPORT GENERATORS ---

async function getStockDataFromCache(symbol, collection = CONSTANTS.DB_COLLECTION_CACHE) {
    const docRef = doc(db, collection, symbol);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
        throw new Error(`Could not find cached data for ${symbol}. Please research it first.`);
    }
    const data = docSnap.data();
    if (collection === CONSTANTS.DB_COLLECTION_CACHE && (!data.OVERVIEW)) {
         throw new Error(`Cached analysis data for ${symbol} is incomplete. Please refresh it.`);
    }
    return data;
}

async function handleViewFullData(symbol) {
    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Loading full data for ${symbol}...`;
    try {
        const data = await getStockDataFromCache(symbol);
        document.getElementById(CONSTANTS.ELEMENT_FULL_DATA_CONTENT).textContent = JSON.stringify(data, null, 2);
        document.getElementById('full-data-modal-title').textContent = `Full Cached Data for ${symbol}`;
        document.getElementById('full-data-modal-timestamp').textContent = `Data Stored On: ${data.cachedAt.toDate().toLocaleString()}`;
        openModal(CONSTANTS.MODAL_FULL_DATA);
    } catch (error) {
        displayMessageInModal(`Error loading data: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

async function handleFinancialAnalysis(symbol) {
    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Generating AI financial analysis for ${symbol}...`;
    try {
        const data = await getStockDataFromCache(symbol);
        const companyName = get(data, 'OVERVIEW.Name', 'the company');
        const tickerSymbol = get(data, 'OVERVIEW.Symbol', symbol);

        const prompt = FINANCIAL_ANALYSIS_PROMPT
            .replace(/{companyName}/g, companyName)
            .replace(/{tickerSymbol}/g, tickerSymbol)
            .replace('{jsonData}', JSON.stringify(data, null, 2));

        const report = await callGeminiApi(prompt);
        document.getElementById(CONSTANTS.ELEMENT_FINANCIAL_ANALYSIS_CONTENT).innerHTML = marked.parse(report);
        document.getElementById('financial-analysis-modal-title').textContent = `Financial Analysis for ${symbol}`;
        openModal(CONSTANTS.MODAL_FINANCIAL_ANALYSIS);

    } catch (error) {
        displayMessageInModal(`Could not generate AI analysis: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

async function handleUndervaluedAnalysis(symbol) {
    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Performing AI valuation for ${symbol}...`;
    try {
        const cachedData = await getStockDataFromCache(symbol);
        
        const companyName = get(cachedData, 'OVERVIEW.Name', 'the company');
        const tickerSymbol = get(cachedData, 'OVERVIEW.Symbol', symbol);

        const prompt = UNDERVALUED_ANALYSIS_PROMPT
            .replace(/{companyName}/g, companyName)
            .replace(/{tickerSymbol}/g, tickerSymbol)
            .replace('{jsonData}', JSON.stringify(cachedData, null, 2));
        
        const report = await callGeminiApi(prompt);
        document.getElementById('undervalued-analysis-content').innerHTML = marked.parse(report);
        document.getElementById('undervalued-analysis-modal-title').textContent = `Undervalued Analysis for ${symbol}`;
        openModal(CONSTANTS.MODAL_UNDERVALUED_ANALYSIS);

    } catch (error) {
        displayMessageInModal(`Could not generate AI analysis: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

async function handleBullBearAnalysis(symbol) {
    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Generating Bull vs. Bear case for ${symbol}...`;
    try {
        const data = await getStockDataFromCache(symbol);
        const companyName = get(data, 'OVERVIEW.Name', 'the company');
        const tickerSymbol = get(data, 'OVERVIEW.Symbol', symbol);
        const prompt = BULL_VS_BEAR_PROMPT
            .replace(/{companyName}/g, companyName)
            .replace(/{tickerSymbol}/g, tickerSymbol)
            .replace('{jsonData}', JSON.stringify(data, null, 2));
        const report = await callGeminiApi(prompt);
        document.getElementById('custom-analysis-content').innerHTML = marked.parse(report);
        document.getElementById('custom-analysis-modal-title').textContent = `Bull vs. Bear | ${symbol}`;
        openModal(CONSTANTS.MODAL_CUSTOM_ANALYSIS);
    } catch (error) {
        displayMessageInModal(`Could not generate analysis: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

async function handleMoatAnalysis(symbol) {
    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Generating Moat analysis for ${symbol}...`;
    try {
        const data = await getStockDataFromCache(symbol);
        const companyName = get(data, 'OVERVIEW.Name', 'the company');
        const tickerSymbol = get(data, 'OVERVIEW.Symbol', symbol);
        const prompt = MOAT_ANALYSIS_PROMPT
            .replace(/{companyName}/g, companyName)
            .replace(/{tickerSymbol}/g, tickerSymbol)
            .replace('{jsonData}', JSON.stringify(data, null, 2));
        const report = await callGeminiApi(prompt);
        document.getElementById('custom-analysis-content').innerHTML = marked.parse(report);
        document.getElementById('custom-analysis-modal-title').textContent = `Moat Analysis | ${symbol}`;
        openModal(CONSTANTS.MODAL_CUSTOM_ANALYSIS);
    } catch (error) {
        displayMessageInModal(`Could not generate analysis: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

async function handleDividendSafetyAnalysis(symbol) {
    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Generating Dividend Safety analysis for ${symbol}...`;
    try {
        const data = await getStockDataFromCache(symbol);
        const companyName = get(data, 'OVERVIEW.Name', 'the company');
        const tickerSymbol = get(data, 'OVERVIEW.Symbol', symbol);
        const prompt = DIVIDEND_SAFETY_PROMPT
            .replace(/{companyName}/g, companyName)
            .replace(/{tickerSymbol}/g, tickerSymbol)
            .replace('{jsonData}', JSON.stringify(data, null, 2));
        const report = await callGeminiApi(prompt);
        document.getElementById('custom-analysis-content').innerHTML = marked.parse(report);
        document.getElementById('custom-analysis-modal-title').textContent = `Dividend Safety | ${symbol}`;
        openModal(CONSTANTS.MODAL_CUSTOM_ANALYSIS);
    } catch (error) {
        displayMessageInModal(`Could not generate analysis: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

async function handleGrowthOutlookAnalysis(symbol) {
    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Generating Growth Outlook analysis for ${symbol}...`;
    try {
        const data = await getStockDataFromCache(symbol);
        const companyName = get(data, 'OVERVIEW.Name', 'the company');
        const tickerSymbol = get(data, 'OVERVIEW.Symbol', symbol);
        const prompt = GROWTH_OUTLOOK_PROMPT
            .replace(/{companyName}/g, companyName)
            .replace(/{tickerSymbol}/g, tickerSymbol)
            .replace('{jsonData}', JSON.stringify(data, null, 2));
        const report = await callGeminiApi(prompt);
        document.getElementById('custom-analysis-content').innerHTML = marked.parse(report);
        document.getElementById('custom-analysis-modal-title').textContent = `Growth Outlook | ${symbol}`;
        openModal(CONSTANTS.MODAL_CUSTOM_ANALYSIS);
    } catch (error) {
        displayMessageInModal(`Could not generate analysis: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

async function handleRiskAssessmentAnalysis(symbol) {
    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Generating Risk Assessment for ${symbol}...`;
    try {
        const data = await getStockDataFromCache(symbol);
        const companyName = get(data, 'OVERVIEW.Name', 'the company');
        const tickerSymbol = get(data, 'OVERVIEW.Symbol', symbol);
        const prompt = RISK_ASSESSMENT_PROMPT
            .replace(/{companyName}/g, companyName)
            .replace(/{tickerSymbol}/g, tickerSymbol)
            .replace('{jsonData}', JSON.stringify(data, null, 2));
        const report = await callGeminiApi(prompt);
        document.getElementById('custom-analysis-content').innerHTML = marked.parse(report);
        document.getElementById('custom-analysis-modal-title').textContent = `Risk Assessment | ${symbol}`;
        openModal(CONSTANTS.MODAL_CUSTOM_ANALYSIS);
    } catch (error) {
        displayMessageInModal(`Could not generate analysis: ${error.message}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}


// --- GOOGLE DRIVE FUNCTIONS (v6.1.0) ---

function getDriveToken() {
    return new Promise((resolve, reject) => {
        if (!driveTokenClient) {
            return reject(new Error("Drive token client not initialized."));
        }
        
        try {
            driveTokenClient.callback = (tokenResponse) => {
                if (tokenResponse.error) {
                    return reject(new Error(`Error getting drive token: ${tokenResponse.error}`));
                }
                resolve(tokenResponse.access_token);
            };
        
            driveTokenClient.requestAccessToken({ prompt: '' });
        } catch (e) {
            reject(e);
        }
    });
}

async function handleSaveToDrive(modalId) {
    if (!auth.currentUser || auth.currentUser.isAnonymous) {
        displayMessageInModal("Please log in with Google to save files to Drive.", "warning");
        return;
    }

    const modal = document.getElementById(modalId);
    if (!modal) return;

    let contentToSave = '';
    let stockSymbol = '';
    let analysisType = '';

    if (modalId === CONSTANTS.MODAL_FULL_DATA) {
        contentToSave = modal.querySelector('#full-data-content').textContent;
        stockSymbol = modal.querySelector('#full-data-modal-title').textContent.replace('Full Cached Data for ', '').trim();
        analysisType = 'FullData';
    } else {
        const proseContent = modal.querySelector('.prose').innerHTML;
        contentToSave = proseContent.replace(/<br\s*\/?>/gi, '\n')
                                     .replace(/<p>/gi, '\n').replace(/<\/p>/gi, '')
                                     .replace(/<h2>/gi, '## ').replace(/<\/h2>/gi, '\n')
                                     .replace(/<h3>/gi, '### ').replace(/<\/h3>/gi, '\n')
                                     .replace(/<ul>/gi, '').replace(/<\/ul>/gi, '')
                                     .replace(/<li>/gi, '* ').replace(/<\/li>/gi, '\n');
        
        const titleText = modal.querySelector('h2').textContent;
        if (modalId === CONSTANTS.MODAL_CUSTOM_ANALYSIS) {
            const parts = titleText.split(' | ');
            analysisType = parts[0].trim().replace(/\s/g, '');
            stockSymbol = parts[1].trim();
        } else {
            stockSymbol = titleText.split(' for ')[1].trim();
            analysisType = titleText.split(' for ')[0].replace(/\s/g, '');
        }
    }

    const fileName = `${stockSymbol}_${analysisType}_${new Date().toISOString().split('T')[0]}.md`;

    openModal(CONSTANTS.MODAL_LOADING);
    document.getElementById(CONSTANTS.ELEMENT_LOADING_MESSAGE).textContent = `Saving to Google Drive...`;

    try {
        const accessToken = await getDriveToken();
        
        await new Promise((resolve, reject) => {
            gapi.load('client', () => {
                gapi.client.setToken({ access_token: accessToken });
                gapi.client.load('drive', 'v3').then(resolve).catch(reject);
            });
        });

        const folderId = await getOrCreateDriveFolder();
        await createDriveFile(folderId, fileName, contentToSave);
        displayMessageInModal(`${fileName} was saved successfully to your "Stock Evaluations" folder in Google Drive.`, 'info');
    } catch (error) {
        console.error("Error saving to drive:", error);
        displayMessageInModal(`Failed to save to Drive: ${error.message || 'Check console for details.'}`, 'error');
    } finally {
        closeModal(CONSTANTS.MODAL_LOADING);
    }
}

async function getOrCreateDriveFolder() {
    let folderId = driveFolderId;
    if (folderId) return folderId;

    const folderName = "Stock Evaluations";
    
    const response = await gapi.client.drive.files.list({
        q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`,
        fields: 'files(id, name)',
    });

    if (response.result.files && response.result.files.length > 0) {
        folderId = response.result.files[0].id;
    } else {
        const fileMetadata = {
            'name': folderName,
            'mimeType': 'application/vnd.google-apps.folder'
        };
        const createResponse = await gapi.client.drive.files.create({
            resource: fileMetadata,
            fields: 'id'
        });
        folderId = createResponse.result.id;
    }
    driveFolderId = folderId;
    return folderId;
}

async function createDriveFile(folderId, fileName, content) {
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const close_delim = `\r\n--${boundary}--`;

    const metadata = {
        name: fileName,
        mimeType: 'text/markdown',
        parents: [folderId]
    };

    const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: text/markdown\r\n\r\n' +
        content +
        close_delim;

    const response = await gapi.client.request({
        path: '/upload/drive/v3/files',
        method: 'POST',
        params: { uploadType: 'multipart' },
        headers: { 'Content-Type': 'multipart/related; boundary="' + boundary + '"' },
        body: multipartRequestBody,
    });
    
    return response;
}

// --- APP INITIALIZATION TRIGGER ---

function initializeApplication() {
    setupEventListeners();
    const versionDisplay = document.getElementById('app-version-display');
    if(versionDisplay) versionDisplay.textContent = `v${APP_VERSION}`;
    openModal(CONSTANTS.MODAL_API_KEY);
}

document.addEventListener('DOMContentLoaded', initializeApplication);
