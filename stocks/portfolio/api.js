import { CONSTANTS, state, MORNING_BRIEFING_PROMPT } from './config.js';
import { getFirestore, Timestamp, doc, setDoc, getDoc, deleteDoc, collection, getDocs, query, limit, addDoc, increment, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- UTILITY & SECURITY HELPERS (Moved from ui.js) ---
function isValidHttpUrl(urlString) {
    if (typeof urlString !== 'string' || !urlString) return false;
    try {
        const url = new URL(urlString);
        return url.protocol === "http:" || url.protocol === "https:";
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

        let score = 0;
        let factors = 0;

        // Factor 1: Debt-to-Equity (lower is better)
        const debtToEquity = _getLatestAnnualMetric(fmpData, 'key_metrics_annual', 'debtToEquity');
        if (debtToEquity !== null) {
            factors++;
            if (debtToEquity < 0.5) score += 100;      // Very low debt
            else if (debtToEquity < 1.0) score += 75; // Moderate debt
            else if (debtToEquity < 2.0) score += 50; // High debt
            else score += 25;                         // Very high debt
        }

        // Factor 2: Current Ratio (higher is better)
        const currentRatio = _getLatestAnnualMetric(fmpData, 'key_metrics_annual', 'currentRatio');
        if (currentRatio !== null) {
            factors++;
            if (currentRatio > 2.0) score += 100;     // Very strong liquidity
            else if (currentRatio > 1.5) score += 80; // Strong liquidity
            else if (currentRatio > 1.0) score += 60; // Healthy liquidity
            else score += 30;                         // Potential risk
        }

        // Factor 3: Return on Equity (ROE) (higher is better)
        const roe = _getLatestAnnualMetric(fmpData, 'ratios_annual', 'returnOnEquity');
        if (roe !== null) {
            factors++;
            if (roe > 0.20) score += 100; // Excellent
            else if (roe > 0.15) score += 85; // Very Good
            else if (roe > 0.10) score += 70; // Good
            else if (roe > 0.0) score += 50;  // Positive
            else score += 20;                 // Negative
        }
        
        // Factor 4: Net Profit Margin (higher is better)
        const netProfitMargin = _getLatestAnnualMetric(fmpData, 'ratios_annual', 'netProfitMargin');
         if (netProfitMargin !== null) {
            factors++;
            if (netProfitMargin > 0.20) score += 100; // Excellent
            else if (netProfitMargin > 0.10) score += 80; // Very Good
            else if (netProfitMargin > 0.05) score += 60; // Good
            else if (netProfitMargin > 0.0) score += 40;  // Profitable
            else score += 10;                  // Unprofitable
        }

        // Return the average score for the stock, or a neutral 50 if no factors were found
        return factors > 0 ? score / factors : 50;
    }).filter(score => score !== null);

    if (stockScores.length === 0) {
        return 50; // Return neutral score if no stocks could be scored
    }

    const totalScore = stockScores.reduce((acc, current) => acc + current, 0);
    return Math.round(totalScore / stockScores.length);
}
