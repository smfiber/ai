import { CONSTANTS, state, MORNING_BRIEFING_PROMPT, NEWS_SENTIMENT_PROMPT, OPPORTUNITY_SCANNER_PROMPT, PORTFOLIO_ANALYSIS_PROMPT, TREND_ANALYSIS_PROMPT } from './config.js';
import { getFirestore, Timestamp, doc, setDoc, getDoc, deleteDoc, collection, getDocs, query, limit, addDoc, increment, updateDoc, where, orderBy } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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
            const errorMsg = typeof errorBody === 'object' ? (errorBody?.error?.message || errorBody?.Information) : errorBody;
            throw new Error(`API request failed: ${response.statusText || errorMsg}`);
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

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${state.geminiApiKey}`;
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

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${state.geminiApiKey}`;
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
    const newsUrl = `https://financialmodelingprep.com/api/v3/stock_news?tickers=${tickersString}&limit=5&apikey=${state.fmpApiKey}`;
    const newsPromise = callApi(newsUrl);

    const [allStockData, allNews] = await Promise.all([
        Promise.all(dataPromises),
        newsPromise
    ]);

    // 2. Consolidate data for the prompt
    const portfolioDataForPrompt = portfolioStocks.map((stock, index) => {
        const stockData = allStockData[index];
        const profile = stockData?.profile?.[0] || {};
        const grades = stockData?.stock_grade_news?.slice(0, 3) || [];
        
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
        stockData[docSnap.id] = docData.data;

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
    if (!fmpData || !fmpData[endpoint] || !Array.isArray(fmpData[endpoint]) || fmpData[endpoint].length === 0) {
        return null;
    }
    // FMP data is usually ordered most recent first.
    const latestRecord = fmpData[endpoint][0];
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
        const beta = fmpData?.profile?.[0]?.beta;
        if (typeof beta === 'number') {
            if (beta < 0.8) riskScore = 100;      // Very Low Risk
            else if (beta < 1.0) riskScore = 80;  // Low Risk
            else if (beta < 1.2) riskScore = 60;  // Average Risk
            else if (beta < 1.5) riskScore = 40;  // Moderate-High Risk
            else riskScore = 20;                  // High Risk
        }

        // --- 3. Analyst Sentiment Score (25% weight) ---
        let sentimentScore = 50; // Default neutral score
        const grades = fmpData?.stock_grade_news?.slice(0, 10) || [];
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
            const newsUrl = `https://financialmodelingprep.com/api/v3/stock_news?tickers=${stock.ticker}&limit=10&apikey=${state.fmpApiKey}`;
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

            if (!fmpData || !fmpData.profile || !fmpData.profile[0]) {
                console.warn(`Skipping ${stock.ticker} due to missing profile data.`);
                processedCount++;
                continue;
            }

            const profile = fmpData.profile[0];
            const analystRatings = (fmpData.stock_grade_news || []).slice(0, 5).map(r => ({
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

        const profile = fmpData.profile?.[0] || {};
        const latestMetrics = fmpData.key_metrics_annual?.[0] || {};
        const grades = (fmpData.stock_grade_news || []).slice(0, 3);

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
            returnOnEquity: fmpData.ratios_annual?.[0]?.returnOnEquity,
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
