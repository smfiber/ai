import { state, promptMap } from './config.js';
import { openModal, closeModal } from './ui-modals.js';
import { callGeminiApi } from './api.js';
import { getFilingContent } from './sec-api.js';

/**
 * Handles the AI analysis of a specific SEC filing.
 * @param {string} filingUrl The URL of the filing to analyze.
 * @param {string} formType The type of the filing (e.g., '10-K', '10-Q').
 * @param {string} ticker The stock ticker.
 */
export async function handleFilingAnalysis(filingUrl, formType, ticker) {
    const analysisContainer = document.getElementById('filing-analysis-container');
    const loadingMessage = document.getElementById('loading-message');
    if (!analysisContainer || !loadingMessage) return;

    openModal('loadingStateModal');
    loadingMessage.textContent = `Fetching text for ${formType} filing...`;
    analysisContainer.innerHTML = '';

    try {
        const filingText = await getFilingContent(filingUrl);

        loadingMessage.textContent = 'AI is analyzing the filing...';

        const stock = state.portfolioCache.find(s => s.ticker === ticker);
        const companyName = stock ? stock.companyName : ticker;

        let reportType;
        if (formType === '10-K') {
            reportType = 'Form10KAnalysis';
        } else if (formType === '10-Q') {
            reportType = 'Form10QAnalysis';
        } else if (formType === '8-K') {
            reportType = 'Form8KAnalysis';
        } else {
            throw new Error(`Analysis for form type ${formType} is not supported.`);
        }

        const promptTemplate = promptMap[reportType].prompt;
        const prompt = promptTemplate
            .replace(/{companyName}/g, companyName)
            .replace(/{tickerSymbol}/g, ticker)
            .replace('{filingText}', filingText);

        const analysisContent = await callGeminiApi(prompt);
        
        analysisContainer.innerHTML = marked.parse(analysisContent);

    } catch (error)
    {
        console.error("Error during filing analysis:", error);
        analysisContainer.innerHTML = `<div class="p-4 text-center text-red-500">Error: ${error.message}</div>`;
    } finally {
        closeModal('loadingStateModal');
    }
}
