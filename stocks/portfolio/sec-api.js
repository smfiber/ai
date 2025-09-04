import { state } from './config.js';
import { callApi } from './api.js';

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
    const filings = result?.filings || [];

    return filings.flatMap(filing => {
        const nonDerivativeTxns = filing.transactionTable?.nonDerivativeTable || [];
        const derivativeTxns = filing.transactionTable?.derivativeTable || [];
        const allTransactions = [...nonDerivativeTxns, ...derivativeTxns];

        if (allTransactions.length === 0) {
            // If a filing has no specific buy/sell transactions listed, it's often a grant, award, or other event
            // not relevant to our insider trading view. We'll filter it out by returning an empty array.
            return [];
        } else {
            // If there are transactions, map them to the format the UI expects.
            return allTransactions.map(txn => ({
                filedAt: filing.filedAt,
                reportingOwnerName: filing.reportingOwnerName,
                linkToFilingDetails: filing.linkToFilingDetails,
                transactionCode: txn.transactionCoding?.transactionCode,
                transactionShares: txn.transactionShares?.value,
                transactionPricePerShare: txn.transactionPricePerShare?.value
            }));
        }
    });
}

export async function getSecInstitutionalOwnership(ticker) {
    const queryObject = {
        "query": {
            "query_string": {
                "query": `formType:\"13F-HR\" AND holdings.ticker:\"${ticker}\"`
            }
        },
        "from": "0",
        "size": "100",
        "sort": [{ "filedAt": { "order": "desc" } }]
    };
    const result = await callSecQueryApi(queryObject);
    const filings = result?.filings || [];

    // Transform the filings data into the flat list of holders the UI expects
    return filings.map(filing => {
        // Find the specific holding information for the ticker within the filing
        const holdingInfo = filing.holdings.find(h => h.ticker === ticker);
        return {
            investorName: filing.companyName,
            shares: holdingInfo?.shrsOrPrnAmt?.sshPrnamt, // Correctly access nested share count
            value: holdingInfo?.value,
            filedAt: filing.filedAt
        };
    }).filter(h => h.value > 0); // Filter out cases where the holding might not be found or has no value
}

export async function getSecMaterialEvents(ticker) {
    const queryObject = {
      "query": { "query_string": { "query": `formType:\"8-K\" AND ticker:\"${ticker}\"` } },
      "from": "0",
      "size": "1",
      "sort": [{ "filedAt": { "order": "desc" } }]
    };
    const result = await callSecQueryApi(queryObject);
    return result?.filings || [];
}

export async function getSecAnnualReports(ticker) {
    const queryObject = {
      "query": { "query_string": { "query": `formType:\"10-K\" AND ticker:\"${ticker}\"` } },
      "from": "0",
      "size": "1",
      "sort": [{ "filedAt": { "order": "desc" } }]
    };
    const result = await callSecQueryApi(queryObject);
    return result?.filings || [];
}

export async function getSecQuarterlyReports(ticker) {
    const queryObject = {
      "query": { "query_string": { "query": `formType:\"10-Q\" AND ticker:\"${ticker}\"` } },
      "from": "0",
      "size": "1",
      "sort": [{ "filedAt": { "order": "desc" } }]
    };
    const result = await callSecQueryApi(queryObject);
    return result?.filings || [];
}

/**
 * Helper to call SEC API endpoints that return plain text.
 * @param {string} url The full URL to fetch.
 * @returns {Promise<string>} The response as a plain text string.
 */
async function _callSecTextApi(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`SEC Text API request failed: ${errorText}`);
        }
        return await response.text();
    } catch (error) {
        console.error("Error in _callSecTextApi:", error);
        throw error;
    }
}

/**
 * Fetches the raw text of "Item 1A. Risk Factors" from the latest 10-K filing.
 * @param {string} ticker The stock ticker.
 * @returns {Promise<string|null>} The text of the section or null if not found.
 */
export async function getLatest10KRiskFactorsText(ticker) {
    if (!state.secApiKey) return null;
    try {
        const filings = await getSecAnnualReports(ticker);
        if (!filings || filings.length === 0) return null;

        const latestFilingUrl = filings[0].linkToFilingDetails;
        const extractorUrl = `https://api.sec-api.io/extractor?url=${latestFilingUrl}&item=1A&type=text&token=${state.secApiKey}`;
        
        return await _callSecTextApi(extractorUrl);
    } catch (error) {
        console.warn(`Could not fetch 10-K risk factors for ${ticker}:`, error.message);
        return null;
    }
}

/**
 * Fetches the raw text of "Item 2. MD&A" from the latest 10-Q filing.
 * @param {string} ticker The stock ticker.
 * @returns {Promise<string|null>} The text of the section or null if not found.
 */
export async function getLatest10QMdaText(ticker) {
    if (!state.secApiKey) return null;
    try {
        const filings = await getSecQuarterlyReports(ticker);
        if (!filings || filings.length === 0) return null;

        const latestFilingUrl = filings[0].linkToFilingDetails;
        const extractorUrl = `https://api.sec-api.io/extractor?url=${latestFilingUrl}&item=part1item2&type=text&token=${state.secApiKey}`;
        
        return await _callSecTextApi(extractorUrl);
    } catch (error) {
        console.warn(`Could not fetch 10-Q MD&A for ${ticker}:`, error.message);
        return null;
    }
}
