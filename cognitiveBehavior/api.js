// api.js
import { appState } from './config.js';
import { jsonInstruction } from './prompts.js';

// --- Helper: Parse JSON with fault tolerance ---
export function parseJsonWithCorrections(jsonString) {
    // [FIX] Strict type check to prevent "u[v] is not a function" or regex errors
    if (!jsonString || typeof jsonString !== 'string') {
        console.warn("parseJsonWithCorrections received invalid input:", jsonString);
        return []; 
    }

    let cleanedString = jsonString.replace(/```(json|markdown)?\n?/g, '').replace(/```/g, '').trim();
    try {
        return JSON.parse(cleanedString);
    }
    catch (error) {
        console.warn("Initial JSON.parse failed. Attempting correction.", error);
        try {
            // Basic cleanup for common AI JSON errors
            const correctedJsonString = cleanedString
                .replace(/\\'/g, "'") // Fix escaped single quotes
                .replace(/([{\s,])(\w+)(:)/g, '$1"$2"$3') // Quote unquoted keys
                .replace(/,\s*([\]}])/g, '$1'); // Remove trailing commas
            return JSON.parse(correctedJsonString);
        } catch (finalError) {
            console.error("Failed to parse JSON even after cleaning:", finalError);
            // Return null instead of throwing to keep the app alive
            return null; 
        }
    }
}

// --- Internal: Log AI Interaction ---
function logAiInteraction(prompt, response, type) {
    // We log to the shared app state
    if (appState.aiLog) {
        appState.aiLog.push({ timestamp: new Date(), type: type, prompt: prompt, response: response });
    }
}

// --- Internal: Generic Fetch Wrapper ---
async function callApi(apiUrl, payload, authorization = null) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90s timeout
    const headers = { 'Content-Type': 'application/json' };
    if (authorization) {
        headers['Authorization'] = authorization;
    }
    try {
        const response = await fetch(apiUrl, { 
            method: 'POST', 
            headers: headers, 
            body: JSON.stringify(payload), 
            signal: controller.signal 
        });
        clearTimeout(timeoutId);
        if (!response.ok) {
            let errorBody;
            try { errorBody = await response.json(); } catch { errorBody = await response.text(); }
            console.error("API Error Response:", { status: response.status, body: errorBody });
            const errorMsg = errorBody?.error?.message || response.statusText;
            throw new Error(`API request failed with status ${response.status}. Message: ${errorMsg}`);
        }
        return await response.json();
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') throw new Error('The AI service request timed out. Please try again.');
        throw error;
    }
}

// --- Exported: Call Gemini API ---
export async function callGeminiAPI(prompt, isJson = false, logType = "General") {
    if (!appState.geminiApiKey) {
        throw new Error("Gemini API Key is not set.");
    }
    
    // Using strict version as requested
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${appState.geminiApiKey}`;
    
    let finalPrompt = prompt;
    if (isJson && !prompt.includes(jsonInstruction)) {
        finalPrompt += jsonInstruction;
    }

    const payload = { contents: [{ parts: [{ text: finalPrompt }] }] };
    if (isJson) {
        payload.generationConfig = { responseMimeType: "application/json", maxOutputTokens: 8192 };
    }
    
    const result = await callApi(apiUrl, payload);
    const responseText = result?.candidates?.[0]?.content?.parts?.[0]?.text || null;
    
    logAiInteraction(finalPrompt, responseText, logType);
    return responseText;
}

// --- Exported: Google Custom Search ---
export async function searchGoogleForTopic(query) {
    if (!appState.googleSearchEngineId || !appState.geminiApiKey) {
        console.warn("Google Search credentials not configured. Skipping real-time search.");
        return [];
    }
    try {
        // Note: Custom Search API uses the same API key project usually
        const searchApiUrl = `https://www.googleapis.com/customsearch/v1?key=${appState.geminiApiKey}&cx=${appState.googleSearchEngineId}&q=${encodeURIComponent(query)}`;
        const searchResponse = await fetch(searchApiUrl);
        if (!searchResponse.ok) {
            const errorData = await searchResponse.json();
            throw new Error(`Google Search API request failed: ${errorData.error.message}`);
        }
        const searchResults = await searchResponse.json();
        return searchResults.items?.slice(0, 8) || [];
    } catch (error) {
        console.error(`Error during Google Search for "${query}":`, error);
        return []; // Fail gracefully
    }
}

// --- Exported: Generate Color Theme ---
// [REMOVED] callColorGenAPI - No longer used as we have a permanent green theme.
