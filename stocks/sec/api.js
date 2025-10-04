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

    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${state.geminiApiKey}`;
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

export async function getEarningsCalendar(tickers) {
    if (!state.fmpApiKey) {
        throw new Error("FMP API Key is required for this feature.");
    }
    if (!tickers || tickers.length === 0) {
        return [];
    }

    const earningsPromises = tickers.map(ticker => {
        const url = `https://financialmodelingprep.com/api/v3/historical/earning_calendar/${ticker}?apikey=${state.fmpApiKey}`;
        return callApi(url).catch(error => {
            console.warn(`Could not fetch earnings for ${ticker}:`, error);
            return []; // Return an empty array for this ticker on failure
        });
    });

    const results = await Promise.all(earningsPromises);
    // Flatten the array of arrays into a single array of earnings events
    return results.flat();
}
