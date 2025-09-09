// api.js
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

export const SEC_10K_SUMMARY_PROMPT = `
Role: You are an expert financial analyst AI. Your task is to read the text from a company's full 10-K filing and create a prioritized, categorized, and concise summary of the most critical takeaways for a potential investor.

Instructions:

Identify Key Themes: Scan the entire document, paying close attention to sections like "Business," "Risk Factors," and "Management's Discussion and Analysis (MD&A)."

Prioritize: Identify the top 5-7 most material takeaways for an investor.

Categorize: Assign each takeaway to one of the following categories: Business Strategy, Financial Performance, Key Risks, or Management Outlook.

Focus: Filter out boilerplate language and concentrate on specific commentary regarding the company's competitive position, financial results, primary risks, and future guidance or challenges.

Format: For each takeaway, create a single bullet point in the format: **[Category]:** [Description of the takeaway and its potential impact on the business.]

Constraints: The entire summary must be 5-7 bullet points. Return ONLY the markdown summary without any introductory or concluding text.

Example of Desired Output:
**Business Strategy:** The company is focusing on expanding its direct-to-consumer channel, which now accounts for 30% of total revenue.
**Financial Performance:** Full-year revenue increased by 15%, primarily driven by strong performance in the cloud segment, though overall net margin declined slightly due to restructuring charges.
**Key Risks:** The company identifies the loss of a key supplier and increased competition in international markets as primary risks to future growth.
**Management Outlook:** Management expressed caution for the upcoming fiscal year, citing macroeconomic headwinds, but expects new product launches in the second half to improve performance.

Raw Text from "10-K" filing:
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

function calculateMedian(arr) {
    if (!arr || arr.length === 0) return null;
    const sorted = arr.slice().sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
        return (sorted[mid - 1] + sorted[mid]) / 2;
    }
    return sorted[mid];
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

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${state.geminiApiKey}`;
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

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${state.geminiApiKey}`;
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
    const newsUrl = `https://financialmodelingprep.com/stable/news/general-latest?symbols=${tickersString}&limit=20&apikey=${state.fmpApiKey}`;
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
            const newsUrl = `https://financialmodelingprep.com/stable/news/stock-latest?symbols=${stock.ticker}&limit=20&apikey=${state.fmpApiKey}`;
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

            if (resultJson) {
                const reportData = {
                    ticker: stock.ticker,
                    companyName: stock.companyName,
                    scannedAt: Timestamp.now(),
                    ...resultJson
                };
                await addDoc(collection(state.db, CONSTANTS.DB_COLLECTION_SCANNER_RESULTS), reportData);
                
                if (resultJson.is_significant) {
                    opportunities.push(reportData);
                }
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
    } else if (sectionName === '10-K Filing') {
        promptTemplate = SEC_10K_SUMMARY_PROMPT;
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
        const newsUrl = `https://financialmodelingprep.com/stable/news/stock-latest?symbols=${ticker}&limit=20&apikey=${state.fmpApiKey}`;
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
 * Extracts and formats key metrics for a single competitor from fetched FMP data.
 * @param {object} fmpData The full FMP data object for a single stock.
 * @returns {object} An object containing key financial metrics for the peer analysis.
 */
function _getCompetitorMetricsFromCache(fmpData) {
    const formatMetric = (value, isPercentage = false) => {
        if (typeof value !== 'number' || !isFinite(value)) return 'N/A';
        const num = Number(value);
        if (isPercentage) return `${(num * 100).toFixed(2)}%`;
        return Math.abs(num) > 100 ? num.toFixed(0) : num.toFixed(2);
    };

    const ratiosTTM = fmpData.ratios_ttm?.data?.[0] || {};
    const ratiosAnnual = fmpData.ratios_annual?.data?.[0] || {};
    const keyMetricsTTM = fmpData.key_metrics_ttm?.data?.[0] || {};
    const growthAnnual = fmpData.income_statement_growth_annual?.data?.[0] || {};
    
    const peRatio = ratiosTTM.peRatioTTM;
    const evToEbitda = keyMetricsTTM.evToEbitdaTTM;

    return {
        pe_ratio: (typeof peRatio === 'number' && peRatio > 0 && isFinite(peRatio)) ? formatMetric(peRatio) : 'N/M',
        ps_ratio: formatMetric(ratiosTTM.priceToSalesRatioTTM),
        ev_ebitda: (typeof evToEbitda === 'number' && evToEbitda > 0 && isFinite(evToEbitda)) ? formatMetric(evToEbitda) : 'N/M',
        gross_margin: formatMetric(ratiosTTM.grossProfitMarginTTM, true),
        net_margin: formatMetric(ratiosTTM.netProfitMarginTTM, true),
        roe: formatMetric(ratiosTTM.returnOnEquityTTM ?? ratiosAnnual.returnOnEquity, true),
        roa: formatMetric(ratiosTTM.returnOnAssetsTTM ?? ratiosAnnual.returnOnAssets, true),
        revenue_growth: formatMetric(growthAnnual.growthRevenue, true),
        debt_to_equity: formatMetric(ratiosTTM.debtEquityRatioTTM ?? ratiosAnnual.debtEquityRatio),
    };
}


/**
 * Fetches live FMP data for a list of peer tickers. This function is designed for resilience,
 * making individual API calls for each ticker to prevent one bad ticker from failing the entire batch.
 * @param {Array<string>} tickers - An array of ticker symbols.
 * @returns {Promise<object>} A promise that resolves to an object mapping tickers to their live data.
 */
async function _fetchLivePeerData(tickers) {
    if (!tickers || tickers.length === 0) return {};

    const apiKey = state.fmpApiKey;

    // Helper to create promises that catch their own errors, returning null on failure
    const makePromise = (url, ticker, type) => callApi(url).catch(e => {
        console.warn(`Failed to fetch ${type} data for peer ${ticker}:`, e);
        return null; // Return null on failure for this specific peer
    });

    const allPromises = tickers.flatMap(ticker => [
        makePromise(`https://financialmodelingprep.com/api/v3/profile/${ticker}?apikey=${apiKey}`, ticker, 'profile'),
        makePromise(`https://financialmodelingprep.com/stable/ratios-ttm?symbol=${ticker}&apikey=${apiKey}`, ticker, 'ratios TTM'),
        makePromise(`https://financialmodelingprep.com/stable/key-metrics-ttm?symbol=${ticker}&apikey=${apiKey}`, ticker, 'key metrics TTM'),
        makePromise(`https://financialmodelingprep.com/stable/income-statement-growth?symbol=${ticker}&period=annual&limit=1&apikey=${apiKey}`, ticker, 'income growth'),
        // Add annual fallbacks for ROE/ROA/Debt-Equity
        makePromise(`https://financialmodelingprep.com/stable/ratios?symbol=${ticker}&period=annual&limit=1&apikey=${apiKey}`, ticker, 'ratios annual')
    ]);

    const results = await Promise.all(allPromises);

    const liveData = {};
    tickers.forEach((ticker, i) => {
        const profileData = results[i * 5];
        const ratiosTtmData = results[i * 5 + 1];
        const keyMetricsTtmData = results[i * 5 + 2];
        const growthData = results[i * 5 + 3];
        const ratiosAnnualData = results[i * 5 + 4];

        liveData[ticker] = {
            profile: { data: profileData || [] },
            ratios_ttm: { data: ratiosTtmData || [] },
            key_metrics_ttm: { data: keyMetricsTtmData || [] },
            income_statement_growth_annual: { data: growthData || [] },
            ratios_annual: { data: ratiosAnnualData || [] }
        };
    });
    
    return liveData;
}


/**
 * Finds competitors, fetches comparative data, and generates a group analysis.
 * @param {string} targetSymbol The ticker symbol to analyze.
 * @returns {Promise<string|null>} A markdown string of the analysis.
 */
export async function getCompetitorAnalysis(targetSymbol) {
    try {
        const targetProfileUrl = `https://financialmodelingprep.com/api/v3/profile/${targetSymbol}?apikey=${state.fmpApiKey}`;
        const targetProfileResponse = await callApi(targetProfileUrl);
        if (!targetProfileResponse || targetProfileResponse.length === 0) {
            throw new Error(`Could not fetch profile for target symbol ${targetSymbol}.`);
        }
        const targetProfileData = targetProfileResponse[0];

        const peersUrl = `https://financialmodelingprep.com/api/v4/stock_peers?symbol=${targetSymbol}&apikey=${state.fmpApiKey}`;
        const peersResponse = await callApi(peersUrl);
        const peerTickers = peersResponse[0]?.peersList;
        if (!peerTickers || peerTickers.length === 0) {
            return "No peer data could be found for comparison.";
        }

        const limitedPeers = peerTickers.slice(0, 10);
        const allTickersToFetch = [targetSymbol, ...limitedPeers];
        const liveDataMap = await _fetchLivePeerData(allTickersToFetch);

        const targetFmpData = liveDataMap[targetSymbol];
        if (!targetFmpData) {
            throw new Error(`Could not retrieve live data for target stock ${targetSymbol}.`);
        }
        
        const formatMarketCap = (value) => (typeof value !== 'number' ? 'N/A' : (value / 1e9).toFixed(2));

        const peerData = [];
        const metricsForAggregation = {
            marketCap: [], peRatio: [], evToEbitda: [], psRatio: [], grossMargin: [],
            netMargin: [], roe: [], roa: [], revenueGrowth: [], debtToEquity: []
        };
        
        limitedPeers.forEach(peerSymbol => {
            const fmpData = liveDataMap[peerSymbol];
            const profile = fmpData?.profile?.data?.[0];
            if (profile && fmpData) {
                const formattedMetrics = _getCompetitorMetricsFromCache(fmpData);
                peerData.push({
                    symbol: peerSymbol,
                    name: profile.companyName,
                    market_cap_raw: profile.mktCap,
                    market_cap: formatMarketCap(profile.mktCap),
                    ...formattedMetrics
                });

                // For aggregation, get the raw numbers
                const ratiosTTM = fmpData.ratios_ttm?.data?.[0];
                const keyMetricsTTM = fmpData.key_metrics_ttm?.data?.[0];
                const growthAnnual = fmpData.income_statement_growth_annual?.data?.[0];

                if (typeof profile.mktCap === 'number') metricsForAggregation.marketCap.push(profile.mktCap);
                if (ratiosTTM) {
                    if (typeof ratiosTTM.peRatioTTM === 'number' && isFinite(ratiosTTM.peRatioTTM) && ratiosTTM.peRatioTTM > 0) metricsForAggregation.peRatio.push(ratiosTTM.peRatioTTM);
                    if (typeof ratiosTTM.priceToSalesRatioTTM === 'number' && isFinite(ratiosTTM.priceToSalesRatioTTM)) metricsForAggregation.psRatio.push(ratiosTTM.priceToSalesRatioTTM);
                    if (typeof ratiosTTM.grossProfitMarginTTM === 'number' && isFinite(ratiosTTM.grossProfitMarginTTM)) metricsForAggregation.grossMargin.push(ratiosTTM.grossProfitMarginTTM);
                    if (typeof ratiosTTM.netProfitMarginTTM === 'number' && isFinite(ratiosTTM.netProfitMarginTTM)) metricsForAggregation.netMargin.push(ratiosTTM.netProfitMarginTTM);
                    if (typeof ratiosTTM.returnOnEquityTTM === 'number' && isFinite(ratiosTTM.returnOnEquityTTM)) metricsForAggregation.roe.push(ratiosTTM.returnOnEquityTTM);
                    if (typeof ratiosTTM.returnOnAssetsTTM === 'number' && isFinite(ratiosTTM.returnOnAssetsTTM)) metricsForAggregation.roa.push(ratiosTTM.returnOnAssetsTTM);
                    if (typeof ratiosTTM.debtEquityRatioTTM === 'number' && isFinite(ratiosTTM.debtEquityRatioTTM)) metricsForAggregation.debtToEquity.push(ratiosTTM.debtEquityRatioTTM);
                }
                if (keyMetricsTTM && typeof keyMetricsTTM.evToEbitdaTTM === 'number' && isFinite(keyMetricsTTM.evToEbitdaTTM) && keyMetricsTTM.evToEbitdaTTM > 0) {
                    metricsForAggregation.evToEbitda.push(keyMetricsTTM.evToEbitdaTTM);
                }
                if (growthAnnual && typeof growthAnnual.growthRevenue === 'number' && isFinite(growthAnnual.growthRevenue)) {
                    metricsForAggregation.revenueGrowth.push(growthAnnual.growthRevenue);
                }
            } else {
                 console.warn(`Skipping peer ${peerSymbol} due to missing live data or profile.`);
            }
        });
        
        if (peerData.length === 0) {
            throw new Error("Failed to gather sufficient live financial data for peer comparison.");
        }

        const largestCompetitor = peerData.reduce((max, p) => (p.market_cap_raw > max.market_cap_raw ? p : max), peerData[0]);
        
        const calculatedMedians = {
            pe_ratio: calculateMedian(metricsForAggregation.peRatio),
            ps_ratio: calculateMedian(metricsForAggregation.psRatio),
            ev_ebitda: calculateMedian(metricsForAggregation.evToEbitda),
            gross_margin: calculateMedian(metricsForAggregation.grossMargin),
            net_margin: calculateMedian(metricsForAggregation.netMargin),
            roe: calculateMedian(metricsForAggregation.roe),
            roa: calculateMedian(metricsForAggregation.roa),
            revenue_growth: calculateMedian(metricsForAggregation.revenueGrowth),
            debt_to_equity: calculateMedian(metricsForAggregation.debtToEquity),
        };

        const formatMedianMetric = (value, isPercentage = false) => {
            if (value === null || typeof value !== 'number') return 'N/A';
            if (isPercentage) return `${(value * 100).toFixed(2)}%`;
            return Math.abs(value) > 100 ? value.toFixed(0) : value.toFixed(2);
        };
        
        const formattedMedians = Object.fromEntries(
            Object.entries(calculatedMedians).map(([key, value]) => {
                const isPercent = ['gross_margin', 'net_margin', 'roe', 'roa', 'revenue_growth'].includes(key);
                return [key, formatMedianMetric(value, isPercent)];
            })
        );

        const comparisonData = {
            target: {
                name: targetProfileData.companyName,
                market_cap: formatMarketCap(targetProfileData.mktCap),
                ..._getCompetitorMetricsFromCache(targetFmpData)
            },
            peers: peerData,
            largest_competitor: largestCompetitor.name || 'N/A',
            calculated_medians: formattedMedians
        };

        const prompt = COMPETITOR_ANALYSIS_PROMPT
            .replace('{comparisonData}', JSON.stringify(comparisonData, null, 2))
            .replace(/{companyName}/g, targetProfileData.companyName)
            .replace(/{companySymbol}/g, targetSymbol)
            .replace('{largestCompetitor}', comparisonData.largest_competitor);

        return await callGeminiApi(prompt);

    } catch (error) {
        console.error(`Failed to get competitor analysis for ${targetSymbol}:`, error);
        return `*Error generating peer comparison: ${error.message}*`;
    }
}


/**
 * Fetches live data for a stock's peers and calculates the median for key metrics.
 * @param {string} targetSymbol The ticker symbol of the company.
 * @returns {Promise<object|null>} An object with median metrics or null if data is insufficient.
 */
export async function getPeerMedianMetrics(targetSymbol) {
    try {
        const peersUrl = `https://financialmodelingprep.com/api/v4/stock_peers?symbol=${targetSymbol}&apikey=${state.fmpApiKey}`;
        const peersResponse = await callApi(peersUrl);
        let peerTickers = peersResponse[0]?.peersList;

        if (!peerTickers || peerTickers.length === 0) {
            console.warn(`No peers found for ${targetSymbol} to calculate medians.`);
            return null;
        }
        
        // Logic to prevent GOOG vs GOOGL comparison
        if (targetSymbol === 'GOOG') {
            peerTickers = peerTickers.filter(p => p !== 'GOOGL');
        } else if (targetSymbol === 'GOOGL') {
            peerTickers = peerTickers.filter(p => p !== 'GOOG');
        }

        const limitedPeers = peerTickers.slice(0, 10);
        const livePeerDataMap = await _fetchLivePeerData(limitedPeers);
        
        const metrics = {
            peRatio: [],
            psRatio: [],
            netMargin: [],
            roe: [],
            debtToEquity: []
        };
        
        limitedPeers.forEach(peerSymbol => {
            const fmpData = livePeerDataMap[peerSymbol];
            if (!fmpData) return;

            const ratiosTTM = fmpData.ratios_ttm?.data?.[0];
            if (!ratiosTTM) return;
            
            // Push valid, numeric data into arrays for median calculation
            if (typeof ratiosTTM.peRatioTTM === 'number' && ratiosTTM.peRatioTTM > 0) metrics.peRatio.push(ratiosTTM.peRatioTTM);
            if (typeof ratiosTTM.priceToSalesRatioTTM === 'number') metrics.psRatio.push(ratiosTTM.priceToSalesRatioTTM);
            if (typeof ratiosTTM.netProfitMarginTTM === 'number') metrics.netMargin.push(ratiosTTM.netProfitMarginTTM);
            if (typeof ratiosTTM.returnOnEquityTTM === 'number') metrics.roe.push(ratiosTTM.returnOnEquityTTM);
            if (typeof ratiosTTM.debtEquityRatioTTM === 'number') metrics.debtToEquity.push(ratiosTTM.debtEquityRatioTTM);
        });

        // Format the final results nicely for the prompt.
        const formatMedian = (value, isPercentage = false) => {
            if (value === null) return 'N/A';
            return isPercentage ? `${(value * 100).toFixed(2)}%` : value.toFixed(2);
        };
        
        return {
            peRatio: formatMedian(calculateMedian(metrics.peRatio)),
            psRatio: formatMedian(calculateMedian(metrics.psRatio)),
            netMargin: formatMedian(calculateMedian(metrics.netMargin), true),
            roe: formatMedian(calculateMedian(metrics.roe), true),
            debtToEquity: formatMedian(calculateMedian(metrics.debtToEquity))
        };

    } catch (error) {
        console.error(`Could not calculate peer medians for ${targetSymbol}:`, error);
        return null; // Return null on failure so the deep dive can proceed without it.
    }
}

/**
 * [NEW] Fetches live TTM data for a single symbol.
 * @param {string} symbol The ticker symbol.
 * @returns {Promise<object|null>} The live data object for the symbol, or null.
 */
export async function getLiveMetricsForSymbol(symbol) {
    if (!symbol) return null;
    const liveDataMap = await _fetchLivePeerData([symbol]);
    return liveDataMap[symbol] || null;
}
