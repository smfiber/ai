import { CONSTANTS, state, MORNING_BRIEFING_PROMPT, NEWS_SENTIMENT_PROMPT, OPPORTUNITY_SCANNER_PROMPT, PORTFOLIO_ANALYSIS_PROMPT, TREND_ANALYSIS_PROMPT, SEC_RISK_FACTOR_SUMMARY_PROMPT, SEC_MDA_SUMMARY_PROMPT, COMPETITOR_ANALYSIS_PROMPT } from './config.js';
import { getFirestore, Timestamp, doc, setDoc, getDoc, deleteDoc, collection, getDocs, query, limit, addDoc, increment, updateDoc, where, orderBy } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- PROMPTS (Moved from config.js for better organization) ---
export const SEC_8K_SUMMARY_PROMPT = `
Role: You are an expert financial analyst AI. Your mission is to analyze the text from a company's 8-K filing and generate a concise, easy-to-understand summary of all disclosed material events for a potential investor.

Instructions:

Identify All Material Events: Scan the entire document and identify each distinct material event. Pay close attention to disclosures filed under specific 8-K Items, such as:

Business & Operations: Entry into/termination of a material definitive agreement (Item 1.01), bankruptcy (Item 1.03), completion of acquisition or disposition of assets (Item 2.01).

Financial Information: Results of operations and financial condition (Item 2.02), creation of a direct financial obligation (Item 2.03), material impairments (Item 2.06).

Management & Governance: Departure or appointment of directors or principal officers (Item 5.02), amendments to articles of incorporation or bylaws (Item 5.03).

Explain the Impact: For each event, do not just state what happened. Briefly explain its significance or potential impact on the company's finances, leadership, or strategy from an investor's perspective.

Format as a Bulleted List:

Use one clear, concise bullet point per distinct material event.

Do not impose a fixed number of bullet points; the goal is to cover all material events disclosed in the filing, however many there may be.

If the filing contains no new material information (e.g., it is purely administrative), return a single bullet point stating: * No new material events were disclosed in this filing.

Be Concise and Professional: Ignore boilerplate language, forward-looking statement disclaimers, and legal jargon. Maintain a neutral, objective tone.

Output Only the Summary: Return ONLY the markdown-formatted bulleted list. Do not add any introductory or concluding text.

Raw Text from "8-K" filing:
---
{sectionText}
---
`.trim();

// --- UTILITY & SECURITY HELPERS (Moved from ui.js) ---
function isValidHttpUrl(urlString) {
    if (typeof urlString !== 'string' || !urlString) return false;
    try {
        const url = new URL(urlString);
        return url.protocol === "http:" || url.protocol === "https:"
    } catch (_) {
        return false;
    }
}

export function filterValidNews(articles) {
    if (!Array.isArray(articles)) return [];
    return articles.filter(article => 
        article.title && article.text && isValidHttpUrl(article.url)
    );
}

// --- API CALLS ---
export async function callApi(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            let errorBody;
            try {
                errorBody = JSON.parse(errorText);
            } catch {
                errorBody = errorText;
            }
            const errorMsg = typeof errorBody === 'object' ? (errorBody?.error?.message || errorBody?.Information || JSON.stringify(errorBody)) : errorBody;
            throw new Error(`API request failed: ${errorMsg || 'No error message provided by API.'}`);
        }
        return await response.json();
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') throw new Error('The API request timed out.');
        throw error;
    }
}

export async function callGeminiApi(prompt) {
    if (!state.geminiApiKey) throw new Error("Gemini API key is not configured.");
    
    state.sessionLog.push({ type: 'prompt', timestamp: new Date(), content: prompt });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${state.geminiApiKey}`;
    const body = { contents: [{ parts: [{ "text": prompt }] }] };
    const data = await callApi(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    const candidate = data.candidates?.[0];
    if (candidate?.content?.parts?.[0]?.text) {
        const responseText = candidate.content.parts[0].text;
        state.sessionLog.push({ type: 'response', timestamp: new Date(), content: responseText });
        return responseText;
    }
    if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
        throw new Error(`The API call was terminated. Reason: ${candidate.finishReason}.`);
    }

    console.error("Unexpected Gemini API response structure:", data);
    throw new Error("Failed to parse the response from the Gemini API.");
}

export async function callGeminiApiWithTools(contents) {
    if (!state.geminiApiKey) throw new Error("Gemini API key is not configured.");

    state.sessionLog.push({ type: 'prompt', timestamp: new Date(), content: JSON.stringify(contents, null, 2) });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${state.geminiApiKey}`;
    const data = await callApi(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contents),
    });

    const candidate = data.candidates?.[0];
    if (candidate?.content) {
        state.sessionLog.push({ type: 'response', timestamp: new Date(), content: JSON.stringify(candidate.content, null, 2) });
        return candidate.content;
    }
    if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
        throw new Error(`The API call was terminated. Reason: ${candidate.finishReason}.`);
    }
    console.error("Unexpected Gemini API response structure:", data);
    throw new Error("Failed to parse the response from the Gemini API with tools.");
}

export async function generatePolishedArticle(initialPrompt, loadingMessageElement = null) {
    const updateLoadingMessage = (msg) => {
        if (loadingMessageElement) {
            loadingMessageElement.textContent = msg;
        }
    };

    updateLoadingMessage("AI is drafting the article...");
    const draft = await callGeminiApi(initialPrompt);

    updateLoadingMessage("Refining focus...");
    const focusPrompt = `Your first pass is to ensure the article is doing exactly what you asked for in the original prompt. Reread the original prompt below, then read your draft. Trim anything that doesn't belong and add anything that's missing. Is the main point clear? Did it miss anything? Did it add fluff? Return only the improved article.\n\nORIGINAL PROMPT:\n${initialPrompt}\n\nDRAFT:\n${draft}`;
    const focusedDraft = await callGeminiApi(focusPrompt);

    updateLoadingMessage("Improving flow...");
    const flowPrompt = `This pass is all about the reader's experience. Read the article out loud to catch awkward phrasing. Are the transitions smooth? Is the order logical? Are any sentences too long or clumsy? Return only the improved article.\n\nARTICLE:\n${focusedDraft}`;
    const flowedDraft = await callGeminiApi(flowPrompt);

    updateLoadingMessage("Adding final flair...");
    const flairPrompt = `This final pass is about elevating the article from "correct" to "compelling." Is the intro boring? Is the conclusion weak? Is the language engaging? Rewrite the introduction to be more engaging. Strengthen the conclusion. Replace basic words with more dynamic ones. Return only the final, polished article.\n\nARTICLE:\n${flowedDraft}`;
    const finalArticle = await callGeminiApi(flairPrompt);

    return finalArticle;
}

export async function generateMorningBriefing(portfolioStocks) {
    if (!portfolioStocks || portfolioStocks.length === 0) {
        return "Your portfolio is empty. Please add stocks to generate a briefing.";
    }

    // 1. Fetch all necessary data in parallel
    const dataPromises = portfolioStocks.map(stock => getFmpStockData(stock.ticker));
    
    const tickersString = portfolioStocks.map(s => s.ticker).join(',');
    const newsUrl = `https://financialmodelingprep.com/stable/news/stock?symbols=${tickersString}&limit=20&apikey=${state.fmpApiKey}`;
    const newsPromise = callApi(newsUrl);

    const [allStockData, allNews] = await Promise.all([
        Promise.all(dataPromises),
        newsPromise
    ]);

    // 2. Consolidate data for the prompt
    const portfolioDataForPrompt = portfolioStocks.map((stock, index) => {
        const stockData = allStockData[index];
        const profile = stockData?.profile?.data?.[0] || {};
        const grades = stockData?.stock_grade_news?.data?.slice(0, 3) || [];
        
        const stockNews = allNews.filter(n => n.symbol === stock.ticker).map(n => ({
            headline: n.title,
            source: n.site
        }));

        return {
            ticker: stock.ticker,
            companyName: stock.companyName,
            profile: {
                price: profile.price,
                change: profile.change,
                changesPercentage: profile.changesPercentage
            },
            news: stockNews,
            analyst_grades: grades.map(g => ({
                company: g.gradingCompany,
                action: g.action,
                from: g.previousGrade,
                to: g.newGrade
            }))
        };
    });

    // 3. Prepare and call the AI
    const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const prompt = MORNING_BRIEFING_PROMPT
        .replace('{portfolioJson}', JSON.stringify({ portfolio_stocks: portfolioDataForPrompt }, null, 2))
        .replace('{currentDate}', currentDate);

    return await callGeminiApi(prompt);
}


export async function getFmpStockData(symbol) {
    const fmpCacheRef = collection(state.db, CONSTANTS.DB_COLLECTION_FMP_CACHE, symbol, 'endpoints');
    const fmpCacheSnapshot = await getDocs(fmpCacheRef);

    if (fmpCacheSnapshot.empty) {
        console.warn(`No FMP data found for ${symbol}.`);
        return null;
    }

    const stockData = { cachedAt: null };
    let latestTimestamp = null;

    fmpCacheSnapshot.forEach(docSnap => {
        const docData = docSnap.data();
        // Use the document ID (e.g., 'profile', 'income_statement_annual') as the key
        stockData[docSnap.id] = docData;

        if (docData.cachedAt && typeof docData.cachedAt.toMillis === 'function') {
            if (!latestTimestamp || docData.cachedAt.toMillis() > latestTimestamp.toMillis()) {
                latestTimestamp = docData.cachedAt;
            }
        }
    });

    stockData.cachedAt = latestTimestamp;
    return stockData;
}

export async function getGroupedFmpData(symbol) {
    // Get all endpoint definitions to map ID to name
    const endpointsSnapshot = await getDocs(collection(state.db, CONSTANTS.DB_COLLECTION_FMP_ENDPOINTS));
    const endpointNames = {};
    endpointsSnapshot.forEach(doc => {
        endpointNames[doc.id] = doc.data().name || 'Unnamed Endpoint';
    });

    // Get the cached data for the specific symbol
    const fmpCacheRef = collection(state.db, CONSTANTS.DB_COLLECTION_FMP_CACHE, symbol, 'endpoints');
    const fmpCacheSnapshot = await getDocs(fmpCacheRef);

    if (fmpCacheSnapshot.empty) {
        console.warn(`No FMP data found for ${symbol}.`);
        return null;
    }

    const groupedData = {};
    fmpCacheSnapshot.forEach(docSnap => {
        const endpointId = docSnap.id;
        const endpointName = endpointNames[endpointId] || `Unknown (${endpointId})`;
        const docData = docSnap.data();
        groupedData[endpointName] = docData.data; // Store the raw data under the endpoint's name
    });

    return groupedData;
}

export async function getCachedNews(ticker) {
    const newsDocRef = doc(state.db, CONSTANTS.DB_COLLECTION_FMP_NEWS_CACHE, ticker);
    const newsDoc = await getDoc(newsDocRef);
    if (newsDoc.exists()) {
        return newsDoc.data().articles || [];
    }
    return [];
}

// --- GOOGLE DRIVE FUNCTIONS ---
export function getDriveToken() {
    return new Promise((resolve, reject) => {
        if (!state.driveTokenClient) {
            return reject(new Error("Drive token client not initialized."));
        }
        
        try {
            state.driveTokenClient.callback = (tokenResponse) => {
                if (tokenResponse.error) {
                    return reject(new Error(`Error getting drive token: ${tokenResponse.error}`));
                }
                resolve(tokenResponse.access_token);
            };
        
            state.driveTokenClient.requestAccessToken({ prompt: '' });
        } catch (e) {
            reject(e);
        }
    });
}

export async function getOrCreateDriveFolder() {
    let folderId = state.driveFolderId;
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
    state.driveFolderId = folderId;
    return folderId;
}

export async function createDriveFile(folderId, fileName, content) {
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

// --- PORTFOLIO HEALTH SCORE ---
/**
 * Helper to get the most recent annual value for a given metric from FMP data.
 * @param {object} fmpData The cached FMP data for a single stock.
 * @param {string} endpoint The endpoint name (e.g., 'key_metrics_annual').
 * @param {string} metric The metric key (e.g., 'debtToEquity').
 * @returns {number|null} The latest value or null if not found.
 */
function _getLatestAnnualMetric(fmpData, endpoint, metric) {
    const endpointData = fmpData?.[endpoint]?.data;
    if (!endpointData || !Array.isArray(endpointData) || endpointData.length === 0) {
        return null;
    }
    // FMP data is usually ordered most recent first.
    const latestRecord = endpointData[0];
    return latestRecord[metric] ?? null;
}

/**
 * Calculates a health score for the entire portfolio.
 * @param {Array<object>} portfolioStocks - Array of stock objects from the portfolio cache.
 * @returns {Promise<number>} A score from 0 to 100.
 */
export async function calculatePortfolioHealthScore(portfolioStocks) {
    if (!portfolioStocks || portfolioStocks.length === 0) {
        return 0; // Return 0 if portfolio is empty
    }

    const dataPromises = portfolioStocks.map(stock => getFmpStockData(stock.ticker));
    const allStockData = await Promise.all(dataPromises);

    const stockScores = allStockData.map(fmpData => {
        if (!fmpData) return 50; // Assign a neutral score if data is missing

        // --- 1. Financial Health Score (50% weight) ---
        let healthScore = 0;
        let healthFactors = 0;

        // Factor 1a: Debt-to-Equity (lower is better)
        const debtToEquity = _getLatestAnnualMetric(fmpData, 'key_metrics_annual', 'debtToEquity');
        if (debtToEquity !== null) {
            healthFactors++;
            if (debtToEquity < 0.5) healthScore += 100;      // Very low debt
            else if (debtToEquity < 1.0) healthScore += 75; // Moderate debt
            else if (debtToEquity < 2.0) healthScore += 50; // High debt
            else healthScore += 25;                         // Very high debt
        }

        // Factor 1b: Current Ratio (higher is better)
        const currentRatio = _getLatestAnnualMetric(fmpData, 'key_metrics_annual', 'currentRatio');
        if (currentRatio !== null) {
            healthFactors++;
            if (currentRatio > 2.0) healthScore += 100;     // Very strong liquidity
            else if (currentRatio > 1.5) healthScore += 80; // Strong liquidity
            else if (currentRatio > 1.0) healthScore += 60; // Healthy liquidity
            else healthScore += 30;                         // Potential risk
        }

        // Factor 1c: Return on Equity (ROE) (higher is better)
        const roe = _getLatestAnnualMetric(fmpData, 'ratios_annual', 'returnOnEquity');
        if (roe !== null) {
            healthFactors++;
            if (roe > 0.20) healthScore += 100; // Excellent
            else if (roe > 0.15) healthScore += 85; // Very Good
            else if (roe > 0.10) healthScore += 70; // Good
            else if (roe > 0.0) healthScore += 50;  // Positive
            else healthScore += 20;                 // Negative
        }
        
        // Factor 1d: Net Profit Margin (higher is better)
        const netProfitMargin = _getLatestAnnualMetric(fmpData, 'ratios_annual', 'netProfitMargin');
         if (netProfitMargin !== null) {
            healthFactors++;
            if (netProfitMargin > 0.20) healthScore += 100; // Excellent
            else if (netProfitMargin > 0.10) healthScore += 80; // Very Good
            else if (netProfitMargin > 0.05) healthScore += 60; // Good
            else if (netProfitMargin > 0.0) healthScore += 40;  // Profitable
            else healthScore += 10;                  // Unprofitable
        }

        const finalHealthScore = healthFactors > 0 ? healthScore / healthFactors : 50;

        // --- 2. Risk Score (Beta) (25% weight) ---
        let riskScore = 50; // Default neutral score for missing beta
        const beta = fmpData?.profile?.data?.[0]?.beta;
        if (typeof beta === 'number') {
            if (beta < 0.8) riskScore = 100;      // Very Low Risk
            else if (beta < 1.0) riskScore = 80;  // Low Risk
            else if (beta < 1.2) riskScore = 60;  // Average Risk
            else if (beta < 1.5) riskScore = 40;  // Moderate-High Risk
            else riskScore = 20;                  // High Risk
        }

        // --- 3. Analyst Sentiment Score (25% weight) ---
        let sentimentScore = 50; // Default neutral score
        const grades = fmpData?.stock_grade_news?.data?.slice(0, 10) || [];
        if (grades.length > 0) {
            let sentimentPoints = 0;
            grades.forEach(grade => {
                const action = grade.action?.toLowerCase() || '';
                const newGrade = grade.newGrade?.toLowerCase() || '';
                if (action.includes('upgrade')) {
                    sentimentPoints += 2;
                } else if (action.includes('downgrade')) {
                    sentimentPoints -= 2;
                } else if (action.includes('initiate') && ['buy', 'outperform', 'strong buy', 'overweight'].some(g => newGrade.includes(g))) {
                    sentimentPoints += 1;
                }
            });
            // Normalize score from a potential range of -20 to +20 -> 0 to 100
            const normalized = ((sentimentPoints + 20) / 40) * 100;
            sentimentScore = Math.max(0, Math.min(100, normalized)); // Clamp between 0 and 100
        }

        // --- Final Weighted Score for the stock ---
        const finalScore = (finalHealthScore * 0.50) + (riskScore * 0.25) + (sentimentScore * 0.25);
        return finalScore;

    }).filter(score => score !== null);

    if (stockScores.length === 0) {
        return 50; // Return neutral score if no stocks could be scored
    }

    const totalScore = stockScores.reduce((acc, current) => acc + current, 0);
    return Math.round(totalScore / stockScores.length);
}

/**
 * Internal helper to get a structured news summary for a single stock.
 * @param {string} ticker The stock ticker.
 * @param {string} companyName The company name.
 * @param {Array} newsData The raw news articles from FMP.
 * @returns {Promise<object|null>} An object with the news summary or null on failure.
 */
async function _getNewsAnalysisForScanner(ticker, companyName, newsData) {
    try {
        const validArticles = filterValidNews(newsData);
        if (validArticles.length === 0) return null;

        const articlesForPrompt = validArticles.map(a => ({
            title: a.title,
            snippet: a.text,
            publicationDate: a.publishedDate ? a.publishedDate.split(' ')[0] : 'N/A'
        }));

        const prompt = NEWS_SENTIMENT_PROMPT
            .replace('{companyName}', companyName)
            .replace('{tickerSymbol}', ticker)
            .replace('{news_articles_json}', JSON.stringify(articlesForPrompt, null, 2));

        const rawResult = await callGeminiApi(prompt);
        const summaryMatch = rawResult.match(/## News Narrative & Pulse([\s\S]*)/);
        const summaryMarkdown = summaryMatch ? summaryMatch[1].trim() : "Could not parse summary.";
        
        // Extract dominant narrative for a concise summary
        const narrativeMatch = summaryMarkdown.match(/\*\*Dominant Narrative:\*\*\s*(.*)/);
        const overallSentimentMatch = summaryMarkdown.match(/\*\*Overall Sentiment:\*\*\s*(.*)/);

        return {
            overall_sentiment: overallSentimentMatch ? overallSentimentMatch[1].trim() : "N/A",
            dominant_narrative: narrativeMatch ? narrativeMatch[1].trim() : "N/A"
        };
    } catch (error) {
        console.error(`Failed to get news analysis for ${ticker}:`, error);
        return null;
    }
}

/**
 * Runs the opportunity scanner across a list of stocks.
 * @param {Array<object>} stocksToScan - Array of stock objects from the portfolio cache.
 * @param {function} updateProgress - Callback function to update UI with progress.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of significant opportunities.
 */
export async function runOpportunityScanner(stocksToScan, updateProgress) {
    const opportunities = [];
    let processedCount = 0;
    
    for (const stock of stocksToScan) {
        try {
            updateProgress(processedCount, stocksToScan.length, `Analyzing ${stock.ticker}...`);
            
            // --- Fetch and Save FMP News ---
            const newsUrl = `https://financialmodelingprep.com/stable/news/stock?symbols=${stock.ticker}&limit=20&apikey=${state.fmpApiKey}`;
            const newsData = await callApi(newsUrl);
            const newsDocRef = doc(state.db, CONSTANTS.DB_COLLECTION_FMP_NEWS_CACHE, stock.ticker);
            await setDoc(newsDocRef, {
                cachedAt: Timestamp.now(),
                articles: newsData
            });

            // --- Fetch other data in parallel ---
            const fmpDataPromise = getFmpStockData(stock.ticker);
            const newsSummaryPromise = _getNewsAnalysisForScanner(stock.ticker, stock.companyName, newsData);
            const [fmpData, newsSummary] = await Promise.all([fmpDataPromise, newsSummaryPromise]);

            if (!fmpData || !fmpData.profile || !fmpData.profile.data || !fmpData.profile.data[0]) {
                console.warn(`Skipping ${stock.ticker} due to missing profile data.`);
                processedCount++;
                continue;
            }

            const profile = fmpData.profile.data[0];
            const analystRatings = (fmpData.stock_grade_news?.data || []).slice(0, 5).map(r => ({
                date: r.date, action: r.action, from: r.previousGrade, to: r.newGrade, firm: r.gradingCompany
            }));

            const dataPacket = {
                companyName: stock.companyName,
                tickerSymbol: stock.ticker,
                price_action: {
                    current_price: profile.price,
                    '50_day_ma': profile.priceAvg50,
                    '200_day_ma': profile.priceAvg200,
                    '52_week_high': profile.yearHigh,
                    '52_week_low': profile.yearLow,
                },
                recent_analyst_ratings: analystRatings,
                recent_news_summary: newsSummary || {
                    overall_sentiment: "N/A",
                    dominant_narrative: "No recent news found."
                }
            };

            const prompt = OPPORTUNITY_SCANNER_PROMPT
                .replace('{companyName}', stock.companyName)
                .replace('{tickerSymbol}', stock.ticker)
                .replace('{jsonData}', JSON.stringify(dataPacket, null, 2));

            const resultStr = await callGeminiApi(prompt);
            const resultJson = JSON.parse(resultStr.replace(/```json\n?|\n?```/g, ''));

            if (resultJson && resultJson.is_significant) {
                const reportData = {
                    ticker: stock.ticker,
                    companyName: stock.companyName,
                    scannedAt: Timestamp.now(),
                    ...resultJson
                };
                await addDoc(collection(state.db, CONSTANTS.DB_COLLECTION_SCANNER_RESULTS), reportData);
                opportunities.push(reportData);
            }
        } catch (error) {
            console.error(`Error processing ${stock.ticker} in opportunity scanner:`, error);
        } finally {
            processedCount++;
        }
    }
    
    updateProgress(stocksToScan.length, stocksToScan.length, "Scan complete.");
    return opportunities;
}

export async function getScannerResults(ticker) {
    const scannerQuery = query(
        collection(state.db, CONSTANTS.DB_COLLECTION_SCANNER_RESULTS),
        where("ticker", "==", ticker),
        orderBy("scannedAt", "desc")
    );
    const scannerSnapshot = await getDocs(scannerQuery);
    return scannerSnapshot.docs.map(doc => doc.data());
}

export async function generatePortfolioAnalysis(userQuestion) {
    const portfolioStocks = state.portfolioCache.filter(s => s.status === 'Portfolio');
    if (!portfolioStocks || portfolioStocks.length === 0) {
        return "Your portfolio is empty. Please add stocks with the 'Portfolio' status to use this feature.";
    }

    // 1. Fetch all necessary data in parallel
    const dataPromises = portfolioStocks.map(stock => getFmpStockData(stock.ticker));
    const allStockData = await Promise.all(dataPromises);

    // 2. Consolidate and simplify data for the prompt
    const portfolioDataForPrompt = portfolioStocks.map((stock, index) => {
        const fmpData = allStockData[index];
        if (!fmpData) return null;

        const profile = fmpData.profile?.data?.[0] || {};
        const latestMetrics = fmpData.key_metrics_annual?.data?.[0] || {};
        const grades = (fmpData.stock_grade_news?.data || []).slice(0, 3);

        return {
            ticker: stock.ticker,
            companyName: stock.companyName,
            sector: profile.sector,
            industry: profile.industry,
            price: profile.price,
            change: profile.change,
            marketCap: profile.mktCap,
            peRatio: latestMetrics.peRatio,
            debtToEquity: latestMetrics.debtToEquity,
            returnOnEquity: fmpData.ratios_annual?.data?.[0]?.returnOnEquity,
            analyst_grades_summary: grades.map(g => `${g.action} to ${g.newGrade} by ${g.gradingCompany}`).join('; ')
        };
    }).filter(Boolean);

    if (portfolioDataForPrompt.length === 0) {
        return "Could not retrieve sufficient data for the stocks in your portfolio. Please try refreshing their data.";
    }

    // 3. Prepare and call the AI
    const prompt = PORTFOLIO_ANALYSIS_PROMPT
        .replace('{userQuestion}', userQuestion)
        .replace('{portfolioJson}', JSON.stringify(portfolioDataForPrompt, null, 2));

    return await callGeminiApi(prompt);
}

export async function generateTrendAnalysis(ticker) {
    // 1. Get latest and historical scanner results
    const scannerQuery = query(
        collection(state.db, CONSTANTS.DB_COLLECTION_SCANNER_RESULTS),
        where("ticker", "==", ticker),
        orderBy("scannedAt", "desc")
    );
    const scannerSnapshot = await getDocs(scannerQuery);
    const allScanResults = scannerSnapshot.docs.map(doc => ({ ...doc.data(), scannedAt: doc.data().scannedAt.toDate().toISOString().split('T')[0] }));
    
    if (allScanResults.length < 2) {
        return "Not enough historical scanner data exists for this stock to perform a trend analysis. At least two past significant results are needed.";
    }

    const latestScanResult = allScanResults[0];
    const historicalScanResults = allScanResults.slice(1);

    // 2. Get historical news context
    const newsDocRef = doc(state.db, CONSTANTS.DB_COLLECTION_FMP_NEWS_CACHE, ticker);
    const newsDoc = await getDoc(newsDocRef);
    let historicalNewsSummary = "No historical news context available.";
    if (newsDoc.exists()) {
        const articles = newsDoc.data().articles || [];
        historicalNewsSummary = "Recent news headlines include: " + articles.slice(0, 5).map(a => `"${a.title}"`).join('; ');
    }

    // 3. Prepare payload for AI
    const dataForPrompt = {
        latest_scan_result: {
            date: latestScanResult.scannedAt,
            type: latestScanResult.type,
            headline: latestScanResult.headline,
            summary: latestScanResult.summary
        },
        historical_scan_results: historicalScanResults.map(r => ({
            date: r.scannedAt,
            type: r.type,
            headline: r.headline
        })),
        historical_news_summary: historicalNewsSummary
    };

    // 4. Prepare and call the AI
    const stockInfo = state.portfolioCache.find(s => s.ticker === ticker) || { companyName: ticker };
    const prompt = TREND_ANALYSIS_PROMPT
        .replace(/{companyName}/g, stockInfo.companyName)
        .replace(/{tickerSymbol}/g, ticker)
        .replace('{jsonData}', JSON.stringify(dataForPrompt, null, 2));
    
    return await callGeminiApi(prompt);
}

/**
 * Generates a concise summary of a specific section from an SEC filing.
 * @param {string} sectionName - The name of the section (e.g., 'Risk Factors', 'MD&A').
 * @param {string} sectionText - The full text of the section to be summarized.
 * @returns {Promise<string>} A promise that resolves to the AI-generated summary.
 */
export async function summarizeSecFilingSection(sectionName, sectionText) {
    let promptTemplate;
    if (sectionName === 'Risk Factors') {
        promptTemplate = SEC_RISK_FACTOR_SUMMARY_PROMPT;
    } else if (sectionName === 'MD&A') {
        promptTemplate = SEC_MDA_SUMMARY_PROMPT;
    } else if (sectionName === '8-K') {
        promptTemplate = SEC_8K_SUMMARY_PROMPT;
    } else {
        throw new Error(`Unsupported SEC section for summarization: ${sectionName}`);
    }

    const prompt = promptTemplate.replace('{sectionText}', sectionText);
    return await callGeminiApi(prompt);
}

/**
 * Generates a concise news summary and sentiment for a single stock.
 * @param {string} ticker The stock ticker.
 * @param {string} companyName The company name.
 * @returns {Promise<object|null>} An object with the news summary or null on failure.
 */
export async function generateNewsSummary(ticker, companyName) {
    try {
        const newsUrl = `https://financialmodelingprep.com/stable/news/stock?symbols=${ticker}&limit=20&apikey=${state.fmpApiKey}`;
        const newsData = await callApi(newsUrl);
        const validArticles = filterValidNews(newsData);
        if (validArticles.length === 0) return { dominant_narrative: "No recent news found.", overall_sentiment: "Neutral" };

        const articlesForPrompt = validArticles.map(a => ({
            title: a.title,
            snippet: a.text,
            publicationDate: a.publishedDate ? a.publishedDate.split(' ')[0] : 'N/A'
        }));

        const prompt = NEWS_SENTIMENT_PROMPT
            .replace('{companyName}', companyName)
            .replace('{tickerSymbol}', ticker)
            .replace('{news_articles_json}', JSON.stringify(articlesForPrompt, null, 2));

        const rawResult = await callGeminiApi(prompt);
        
        // Use regex to be more robust against small formatting changes from the AI
        const summaryMatch = rawResult.match(/## News Narrative & Pulse([\s\S]*)/);
        if (!summaryMatch) return { dominant_narrative: "Could not parse news summary.", overall_sentiment: "N/A" };
        
        const summaryMarkdown = summaryMatch[1].trim();
        const narrativeMatch = summaryMarkdown.match(/\*\*Dominant Narrative:\*\*\s*(.*)/);
        const overallSentimentMatch = summaryMarkdown.match(/\*\*Overall Sentiment:\*\*\s*(.*)/);

        return {
            overall_sentiment: overallSentimentMatch ? overallSentimentMatch[1].trim() : "N/A",
            dominant_narrative: narrativeMatch ? narrativeMatch[1].trim() : "Could not parse dominant narrative."
        };
    } catch (error) {
        console.error(`Failed to generate news summary for ${ticker}:`, error);
        return { dominant_narrative: `Error fetching news: ${error.message}`, overall_sentiment: "N/A" };
    }
}

/**
 * [NEW] Extracts and formats key metrics for a single competitor from cached FMP data.
 * @param {object} fmpData The full cached FMP data object for a single stock.
 * @returns {object} An object containing key financial metrics for the peer analysis.
 */
function _getCompetitorMetricsFromCache(fmpData) {
    // Helper to format numbers consistently for the AI prompt
    const formatMetric = (value, isPercentage = false) => {
        if (typeof value !== 'number') return 'N/A';
        const num = Number(value);
        if (isPercentage) return `${(num * 100).toFixed(2)}%`;
        return Math.abs(num) > 100 ? num.toFixed(0) : num.toFixed(2);
    };

    const ratiosTTM = fmpData.ratios_ttm?.data?.[0] || {};
    const growthAnnual = fmpData.income_statement_growth_annual?.data?.[0] || {};
    const keyMetricsAnnual = fmpData.key_metrics_annual?.data?.[0] || {};
    
    return {
        pe_ratio: formatMetric(ratiosTTM.peRatioTTM),
        ps_ratio: formatMetric(ratiosTTM.priceToSalesRatioTTM),
        ev_ebitda: formatMetric(keyMetricsAnnual.enterpriseValueOverEBITDA),
        gross_margin: formatMetric(ratiosTTM.grossProfitMarginTTM, true),
        net_margin: formatMetric(ratiosTTM.netProfitMarginTTM, true),
        roe: formatMetric(ratiosTTM.returnOnEquityTTM, true),
        roa: formatMetric(ratiosTTM.returnOnAssetsTTM, true),
        revenue_growth: formatMetric(growthAnnual.growthRevenue, true),
        debt_to_equity: formatMetric(ratiosTTM.debtEquityRatioTTM),
    };
}

/**
 * [NEW] Fetches live FMP data for a list of peer tickers.
 * @param {Array<string>} peerTickers - An array of ticker symbols.
 * @returns {Promise<object>} A promise that resolves to an object mapping tickers to their live data.
 */
async function _fetchLivePeerData(peerTickers) {
    if (!peerTickers || peerTickers.length === 0) return {};

    const peersString = peerTickers.join(',');
    const apiKey = state.fmpApiKey;

    // Profile can usually be fetched in bulk reliably
    const profileUrl = `https://financialmodelingprep.com/api/v3/profile/${peersString}?apikey=${apiKey}`;

    // Helper to create promises that catch their own errors
    const makePromise = (url, ticker, type) => callApi(url).catch(e => {
        console.warn(`Failed to fetch ${type} data for peer ${ticker}:`, e);
        return []; // Return empty array on failure for this specific peer
    });

    // Define promises for endpoints that are more reliable when called individually
    const ratiosTtmPromises = peerTickers.map(ticker => {
        const url = `https://financialmodelingprep.com/api/v3/ratios-ttm/${ticker}?apikey=${apiKey}`;
        return makePromise(url, ticker, 'ratios TTM');
    });

    const keyMetricsAnnualPromises = peerTickers.map(ticker => {
        const url = `https://financialmodelingprep.com/api/v3/key-metrics-annual/${ticker}?limit=1&apikey=${apiKey}`;
        return makePromise(url, ticker, 'key metrics annual');
    });

    const growthPromises = peerTickers.map(ticker => {
        const url = `https://financialmodelingprep.com/stable/income-statement-growth?symbol=${ticker}&period=annual&limit=5&apikey=${apiKey}`;
        return makePromise(url, ticker, 'income growth');
    });

    const [profiles, allRatiosTtm, allKeyMetricsAnnual, allGrowthData] = await Promise.all([
        callApi(profileUrl), // Keep bulk profile fetch
        Promise.all(ratiosTtmPromises),
        Promise.all(keyMetricsAnnualPromises),
        Promise.all(growthPromises)
    ]);

    // Map the arrays of results back to their respective tickers
    const liveData = {};
    peerTickers.forEach((ticker, index) => {
        const profileData = Array.isArray(profiles) ? profiles.find(p => p.symbol === ticker) : null;
        // Individual FMP calls often return an array with a single object. Get the first element.
        const ratiosTtmData = Array.isArray(allRatiosTtm[index]) ? allRatiosTtm[index][0] : null;
        const keyMetricsAnnualData = Array.isArray(allKeyMetricsAnnual[index]) ? allKeyMetricsAnnual[index][0] : null;
        
        liveData[ticker] = {
            profile: { data: profileData ? [profileData] : [] },
            ratios_ttm: { data: ratiosTtmData ? [ratiosTtmData] : [] },
            key_metrics_annual: { data: keyMetricsAnnualData ? [keyMetricsAnnualData] : [] },
            income_statement_growth_annual: { data: allGrowthData[index] || [] }
        };
    });

    return liveData;
}


/**
 * Finds competitors for a given stock, fetches comparative data,
 * and generates a group analysis summary using an AI.
 * @param {string} targetSymbol The ticker symbol of the company to analyze.
 * @returns {Promise<string|null>} A markdown string of the competitor analysis, or null if it fails.
 */
export async function getCompetitorAnalysis(targetSymbol) {
    try {
        // 1. Fetch the list of peer tickers from FMP
        const peersUrl = `https://financialmodelingprep.com/api/v4/stock_peers?symbol=${targetSymbol}&apikey=${state.fmpApiKey}`;
        const peersResponse = await callApi(peersUrl);
        let peerTickers = peersResponse[0]?.peersList;
        if (!peerTickers || peerTickers.length === 0) {
            console.warn(`No peers found for ${targetSymbol}`);
            return "No peer data could be found for comparison.";
        }
        
        // Logic to prevent GOOG vs GOOGL comparison
        if (targetSymbol === 'GOOG') {
            peerTickers = peerTickers.filter(p => p !== 'GOOGL');
        } else if (targetSymbol === 'GOOGL') {
            peerTickers = peerTickers.filter(p => p !== 'GOOG');
        }
        
        const limitedPeers = peerTickers.slice(0, 10); // Limit to 10 peers for efficiency
        
        // 2. Fetch CACHED data for the target and LIVE data for peers in parallel
        const targetFmpDataPromise = getFmpStockData(targetSymbol);
        const livePeerDataPromise = _fetchLivePeerData(limitedPeers);
        
        const [targetFmpData, livePeerDataMap] = await Promise.all([targetFmpDataPromise, livePeerDataPromise]);

        if (!targetFmpData || !targetFmpData.profile?.data?.[0]) {
            throw new Error(`Could not retrieve cached profile data for target stock ${targetSymbol}. Please refresh its data.`);
        }
        
        // Helper to format market cap into billions
        const formatMarketCap = (value) => {
            if (typeof value !== 'number') return 'N/A';
            return (value / 1e9).toFixed(2);
        };

        // 3. Assemble the data for the AI prompt
        const peerData = [];
        limitedPeers.forEach(peerSymbol => {
            const fmpData = livePeerDataMap[peerSymbol];
            const profile = fmpData?.profile?.data?.[0];
            
            if (profile && fmpData) {
                peerData.push({
                    symbol: peerSymbol,
                    name: profile.companyName,
                    market_cap_raw: profile.mktCap,
                    market_cap: formatMarketCap(profile.mktCap),
                    ..._getCompetitorMetricsFromCache(fmpData) // This function can be reused
                });
            } else {
                 console.warn(`Skipping peer ${peerSymbol} due to missing live data or profile.`);
            }
        });

        if (peerData.length === 0) {
            throw new Error("Failed to gather sufficient live financial data for peer comparison.");
        }

        // Find the largest competitor by raw market cap
        const largestCompetitor = peerData.reduce((max, p) => (p.market_cap_raw > max.market_cap_raw ? p : max), peerData[0]);

        const targetProfile = targetFmpData.profile.data[0];
        const comparisonData = {
            target: {
                name: targetProfile.companyName,
                market_cap: formatMarketCap(targetProfile.mktCap),
                ..._getCompetitorMetricsFromCache(targetFmpData) // Use cached data for target
            },
            peers: peerData, // Use live data for peers
            largest_competitor: largestCompetitor.name || 'N/A'
        };

        // 5. Generate the AI summary using the new prompt
        const prompt = COMPETITOR_ANALYSIS_PROMPT
            .replace('{comparisonData}', JSON.stringify(comparisonData, null, 2))
            .replace(/{companyName}/g, targetProfile.companyName)
            .replace(/{companySymbol}/g, targetSymbol)
            .replace('{largestCompetitor}', comparisonData.largest_competitor);

        return await callGeminiApi(prompt);

    } catch (error) {
        console.error(`Failed to get competitor analysis for ${targetSymbol}:`, error);
        return `*Error generating peer comparison: ${error.message}*`;
    }
}
