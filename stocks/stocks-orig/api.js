import { CONSTANTS, state } from './config.js';
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

// --- SEC FILING FUNCTIONS ---
async function callSecQueryApi(queryObject) {
    if (!state.secApiKey) throw new Error("SEC API Key is not configured.");
    const url = `https://api.sec-api.io?token=${state.secApiKey}`;
    
    const data = await callApi(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(queryObject)
    });

    return data;
}

export async function getSecInsiderTrading(ticker) {
    const queryObject = {
      "query": { "query_string": { "query": `formType:\"4\" AND ticker:\"${ticker}\"` } },
      "from": "0",
      "size": "25",
      "sort": [{ "filedAt": { "order": "desc" } }]
    };
    const result = await callSecQueryApi(queryObject);
    return result?.filings || [];
}

export async function getSecInstitutionalOwnership(ticker) {
    if (!state.secApiKey) throw new Error("SEC API Key is not configured.");
    const url = `https://api.sec-api.io/holding/search?ticker=${ticker}&token=${state.secApiKey}`;
    const result = await callApi(url);
    return result || [];
}

export async function getSecMaterialEvents(ticker) {
    const queryObject = {
      "query": { "query_string": { "query": `formType:\"8-K\" AND ticker:\"${ticker}\"` } },
      "from": "0",
      "size": "15",
      "sort": [{ "filedAt": { "order": "desc" } }]
    };
    const result = await callSecQueryApi(queryObject);
    return result?.filings || [];
}

// --- SECTOR ANALYSIS: AI AGENT WORKFLOW ---
export async function searchSectorNews({ sectorName, sectorStocks }) {
    if (!state.fmpApiKey) {
        throw new Error("FMP API Key is required for news search.");
    }
    const url = `https://financialmodelingprep.com/api/v3/stock_news?limit=100&apikey=${state.fmpApiKey}`;
    
    const newsData = await callApi(url);
    const validArticles = filterValidNews(newsData || []);

    if (validArticles.length === 0) {
        return { error: "No relevant news articles found", detail: `Could not find any recent news.` };
    }

    return {
        articles: validArticles.map((a, index) => ({
            title: a.title,
            snippet: a.text,
            link: a.url,
            source: a.site,
            symbol: a.symbol,
            publicationDate: a.publishedDate ? a.publishedDate.split(' ')[0] : 'N/A',
            articleIndex: index
        })),
        sectorStocks: sectorStocks
    };
}

export async function synthesizeAndRankCompanies({ newsArticles, sectorStocks }) {
    const prompt = `
        Role: You are a quantitative financial analyst AI. Your task is to analyze a general list of financial news articles and identify the most noteworthy companies that belong to a specific sector.

        Task:
        1. You are given a list of stock tickers that belong to the target sector: [${sectorStocks.join(', ')}].
        2. Read the provided JSON data of general news articles.
        3. Filter these articles, considering only those where the article's "symbol" matches one of the tickers in the provided sector list.
        4. From this filtered list, identify the Top 3-5 most favorably mentioned companies. Your ranking must be based on the significance (e.g., earnings reports > product updates) and positive sentiment of the news.
        
        Output Format: Return ONLY a valid JSON object. The JSON should have a single key "topCompanies" which is an array of objects. Each object must contain "companyName", "ticker", and a "rankingJustification" that briefly explains why it was ranked highly based on its positive news mentions. Include the source article indices in the justification.

        News Articles JSON Data:
        ${JSON.stringify(newsArticles, null, 2)}
    `;

    const resultText = await callGeminiApi(prompt);
    try {
        const cleanedJson = resultText.replace(/```json\n|```/g, '').trim();
        return JSON.parse(cleanedJson);
    } catch (error) {
        console.error("Error parsing synthesis result:", error);
        return { error: "Failed to parse analysis from AI", detail: error.message };
    }
}

export async function generateDeepDiveReport({ companyAnalysis, sectorName, originalArticles }) {
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
    
    let finalReport = await generatePolishedArticle(prompt);

    finalReport = finalReport.replace(/\[Source: (?:Article )?(\d+)\]/g, (match, indexStr) => {
        const index = parseInt(indexStr, 10);
        const article = originalArticles.find(a => a.articleIndex === index);
        if (article) {
            const sourceParts = article.source.split('.');
            const sourceName = sourceParts.length > 1 ? sourceParts[sourceParts.length - 2] : article.source;
            return `[(Source: ${sourceName}, ${article.publicationDate})](${article.link})`;
        }
        return match;
    });

    return { report: finalReport };
}

export async function findStocksByIndustry({ industryName }) {
    if (!state.fmpApiKey) {
        throw new Error("FMP API Key is required for this feature.");
    }
    const url = `https://financialmodelingprep.com/api/v3/stock-screener?industry=${encodeURIComponent(industryName)}&limit=50&apikey=${state.fmpApiKey}`;
    
    try {
        const stocks = await callApi(url);
        if (!stocks || stocks.length === 0) {
            return { error: "No stocks found", detail: `Could not find any stocks for the ${industryName} industry.` };
        }
        return { stocks: stocks.map(s => s.symbol) };
    } catch (error) {
        console.error("Error fetching stocks by industry:", error);
        return { error: "API call failed", detail: error.message };
    }
}

export async function findStocksBySector({ sectorName }) {
    if (!state.fmpApiKey) {
        throw new Error("FMP API Key is required for this feature.");
    }
    const url = `https://financialmodelingprep.com/api/v3/stock-screener?sector=${encodeURIComponent(sectorName)}&limit=100&apikey=${state.fmpApiKey}`;
    
    try {
        const stocks = await callApi(url);
        if (!stocks || stocks.length === 0) {
            return { error: "No stocks found", detail: `Could not find any stocks for the ${sectorName} sector.` };
        }
        return { stocks: stocks.map(s => s.symbol) };
    } catch (error) {
        console.error("Error fetching stocks by sector:", error);
        return { error: "API call failed", detail: error.message };
    }
}
