// fileName: api.js
import { CONSTANTS, state } from './config.js';
import { getFirestore, Timestamp, doc, setDoc, getDoc, deleteDoc, collection, getDocs, query, limit, addDoc, increment, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- API CALLS ---
export async function callApi(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);
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

    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${state.geminiApiKey}`;
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

export async function callSynthesisGeminiApi(prompt) {
    if (!state.geminiApiKey) throw new Error("Gemini API key is not configured.");

    state.sessionLog.push({ type: 'prompt', timestamp: new Date(), content: prompt });

    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${state.geminiApiKey}`;
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

/**
 * Generates a two-pass refined article from the AI.
 * @param {string} initialPrompt The prompt for the AI.
 * @param {HTMLElement|null} loadingMessageElement The element to update with loading messages.
 * @returns {Promise<string>} The AI-generated and refined article content.
 */
export async function generateRefinedArticle(initialPrompt, loadingMessageElement = null) {
    const updateLoadingMessage = (msg) => {
        if (loadingMessageElement) {
            loadingMessageElement.textContent = msg;
        }
    };

    updateLoadingMessage("AI is drafting the report...");
    const draft = await callGeminiApi(initialPrompt);

    updateLoadingMessage("AI is refining the content for clarity and professionalism...");
    const refinementPrompt = `Please review the following draft report. Check it for clarity, conciseness, and a professional tone. Ensure all markdown formatting is correct, especially for headings and bullet points. Return only the final, improved report. Do not add any new sections or analysis.\n\nDRAFT:\n${draft}`;
    const finalArticle = await callGeminiApi(refinementPrompt);

    return finalArticle;
}

export async function generatePolishedArticleForSynthesis(initialPrompt, loadingMessageElement = null) {
    const updateLoadingMessage = (msg) => {
        if (loadingMessageElement) {
            loadingMessageElement.textContent = msg;
        }
    };

    updateLoadingMessage("AI is drafting the article...");
    const draft = await callSynthesisGeminiApi(initialPrompt);

    updateLoadingMessage("Refining focus...");
    const focusPrompt = `Your first pass is to ensure the article is doing exactly what you asked for in the original prompt. Reread the original prompt below, then read your draft. Trim anything that doesn't belong and add anything that's missing. Is the main point clear? Did it miss anything? Did it add fluff? Return only the improved article.\n\nORIGINAL PROMPT:\n${initialPrompt}\n\nDRAFT:\n${draft}`;
    const focusedDraft = await callSynthesisGeminiApi(focusPrompt);

    updateLoadingMessage("Improving flow...");
    const flowPrompt = `This pass is all about the reader's experience. Read the article out loud to catch awkward phrasing. Are the transitions smooth? Is the order logical? Are any sentences too long or clumsy? Return only the improved article.\n\nARTICLE:\n${focusedDraft}`;
    const flowedDraft = await callSynthesisGeminiApi(flowPrompt);

    updateLoadingMessage("Adding final flair...");
    const flairPrompt = `This final pass is about elevating the article from "correct" to "compelling." Is the intro boring? Is the conclusion weak? Is the language engaging? Rewrite the introduction to be more engaging. Strengthen the conclusion. Replace basic words with more dynamic ones. Return only the final, polished article.\n\nARTICLE:\n${flowedDraft}`;
    const finalArticle = await callSynthesisGeminiApi(flairPrompt);

    return finalArticle;
}


export async function getFmpStockData(symbol) {
    // Promise to get all endpoint documents
    const endpointsRef = collection(state.db, CONSTANTS.DB_COLLECTION_FMP_CACHE, symbol, 'endpoints');
    const endpointsPromise = getDocs(endpointsRef);

    // Promise to get the manual overrides document
    const overridesRef = doc(state.db, CONSTANTS.DB_COLLECTION_FMP_CACHE, symbol, 'analysis', 'manual_overrides');
    const overridesPromise = getDoc(overridesRef);

    const [endpointsSnapshot, overridesSnapshot] = await Promise.all([endpointsPromise, overridesPromise]);

    if (endpointsSnapshot.empty) {
        console.warn(`No FMP data found for ${symbol}.`);
        return null;
    }

    const stockData = { cachedAt: null, manualOverrides: null };
    let latestTimestamp = null;

    // Process endpoint data
    endpointsSnapshot.forEach(docSnap => {
        const docData = docSnap.data();
        stockData[docSnap.id] = docData.data;

        if (docData.cachedAt && typeof docData.cachedAt.toMillis === 'function') {
            if (!latestTimestamp || docData.cachedAt.toMillis() > latestTimestamp.toMillis()) {
                latestTimestamp = docData.cachedAt;
            }
        }
    });
    
    // Process and attach manual overrides
    if (overridesSnapshot.exists()) {
        stockData.manualOverrides = overridesSnapshot.data();
    }

    stockData.cachedAt = latestTimestamp;
    return stockData;
}

export async function getGroupedFmpData(symbol) {
    const fmpCacheRef = collection(state.db, CONSTANTS.DB_COLLECTION_FMP_CACHE, symbol, 'endpoints');
    const fmpCacheSnapshot = await getDocs(fmpCacheRef);

    if (fmpCacheSnapshot.empty) {
        console.warn(`No FMP data found for ${symbol}.`);
        return null;
    }

    const groupedData = {};
    fmpCacheSnapshot.forEach(docSnap => {
        const endpointId = docSnap.id;
        const endpointName = endpointId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const docData = docSnap.data();
        groupedData[endpointName] = docData.data;
    });

    return groupedData;
}
