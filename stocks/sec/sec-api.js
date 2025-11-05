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
            return [];
        } else {
            return allTransactions.map(txn => ({
                filedAt: filing.filedAt,
                reportingOwnerName: filing.reportingOwnerName,
                linkToFilingDetails: filing.linkToFilingDetails,
                transactionCode: txn.transactionCoding?.transactionCode,
                transactionShares: txn.transactionShares?.value,
                transactionPricePerShare: txn.transactionPricePerShare?.value,
                ticker: filing.ticker
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
        "size": "50",
        "sort": [{ "filedAt": { "order": "desc" } }]
    };
    const result = await callSecQueryApi(queryObject);
    const filings = result?.filings || [];

    return filings.map(filing => {
        const holdingInfo = filing.holdings.find(h => h.ticker === ticker);
        return {
            investorName: filing.companyName,
            shares: holdingInfo?.shrsOrPrnAmt?.sshPrnamt,
            value: holdingInfo?.value,
            filedAt: filing.filedAt,
            ticker: ticker
        };
    }).filter(h => h.value > 0);
}

export async function getSecMaterialEvents(ticker) {
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    const twoYearsAgoDateString = twoYearsAgo.toISOString().split('T')[0];

    const queryObject = {
      "query": { "query_string": { "query": `formType:\"8-K\" AND ticker:${ticker} AND filedAt:[${twoYearsAgoDateString} TO *]` } },
      "from": "0",
      // --- CHANGE STARTS HERE ---
      "size": "5",
      // --- CHANGE ENDS HERE ---
      "sort": [{ "filedAt": { "order": "desc" } }]
    };
    const result = await callSecQueryApi(queryObject);
    return result?.filings || [];
}

export async function getSecAnnualReports(ticker) {
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    const twoYearsAgoDateString = twoYearsAgo.toISOString().split('T')[0];

    const queryObject = {
      "query": { "query_string": { "query": `formType:\"10-K\" AND ticker:${ticker} AND filedAt:[${twoYearsAgoDateString} TO *]` } },
      "from": "0",
      // --- CHANGE STARTS HERE ---
      "size": "5",
      // --- CHANGE ENDS HERE ---
      "sort": [{ "filedAt": { "order": "desc" } }]
    };
    const result = await callSecQueryApi(queryObject);
    return result?.filings || [];
}

export async function getSecQuarterlyReports(ticker) {
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    const twoYearsAgoDateString = twoYearsAgo.toISOString().split('T')[0];

    const queryObject = {
      "query": { "query_string": { "query": `formType:\"10-Q\" AND ticker:${ticker} AND filedAt:[${twoYearsAgoDateString} TO *]` } },
      "from": "0",
      // --- CHANGE STARTS HERE ---
      "size": "5",
      // --- CHANGE ENDS HERE ---
      "sort": [{ "filedAt": { "order": "desc" } }]
    };
    const result = await callSecQueryApi(queryObject);
    return result?.filings || [];
}

export async function getRecentPortfolioFilings(tickers) {
    if (!tickers || tickers.length === 0) {
        return [];
    }
    const tickerQueryString = tickers.join(" OR ");
    const queryObject = {
        "query": { 
            "query_string": { 
                "query": `formType:("8-K" OR "10-K" OR "10-Q") AND ticker:(${tickerQueryString})` 
            } 
        },
        "from": "0",
        "size": "200",
        "sort": [{ "filedAt": { "order": "desc" } }]
    };
    const result = await callSecQueryApi(queryObject);
    return result?.filings || [];
}

export async function getFilingContent(filingUrl, item = null) {
    if (!state.secApiKey) throw new Error("SEC API Key is not configured.");
    if (!filingUrl) throw new Error("A filing URL is required.");

    let url = `https://api.sec-api.io/extractor?url=${encodeURIComponent(filingUrl)}&type=text&token=${state.secApiKey}`;

    if (item) {
        url += `&item=${item}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch filing text: ${response.statusText} - ${errorText}`);
    }
    return await response.text();
}

export async function getPortfolioInsiderTrading(tickers) {
    if (!tickers || tickers.length === 0) return [];
    
    const tickerQueryString = tickers.join(" OR ");
    const queryObject = {
      "query": { "query_string": { "query": `formType:\"4\" AND ticker:(${tickerQueryString})` } },
      "from": "0",
      "size": "100", 
      "sort": [{ "filedAt": { "order": "desc" } }]
    };

    const result = await callSecQueryApi(queryObject);
    return result?.filings || [];
}

export async function getPortfolioInstitutionalOwnership(tickers) {
    if (!tickers || tickers.length === 0) return [];

    const tickerQueryString = tickers.join(" OR ");
    const queryObject = {
        "query": {
            "query_string": {
                "query": `formType:\"13F-HR\" AND holdings.ticker:(${tickerQueryString})`
            }
        },
        "from": "0",
        "size": "100",
        "sort": [{ "filedAt": { "order": "desc" } }]
    };
    const result = await callSecQueryApi(queryObject);
    return result?.filings || [];
}

/**
 * DEFINITIVELY CORRECTED: Fetches the detailed holdings of a specific 13F filing
 * by using the Query API to search for the filing's unique accession number.
 * @param {string} accessionNo The accession number of the 13F filing.
 * @returns {Promise<Array>} A promise that resolves to the array of holdings.
 */
export async function get13FHoldings(accessionNo) {
    if (!accessionNo) throw new Error("An accession number is required.");
    
    const queryObject = {
        "query": { "query_string": { "query": `accessionNo:\"${accessionNo}\"` } },
        "from": "0",
        "size": "1"
    };

    const result = await callSecQueryApi(queryObject);
    
    if (result.filings && result.filings.length > 0) {
        return result.filings[0].holdings || [];
    }
    
    return [];
}

/**
 * Fetches the most recent 13F-HR filings for a specific CIK using the Query API.
 * This is a more reliable method than full-text search for this use case.
 * @param {string} cik The CIK of the whale investor.
 * @returns {Promise<{filings: Array, payload: object}>} A promise that resolves to an object containing the filings (with holdings included) and the request payload.
 */
export async function getWhaleFilings(cik) {
    if (!state.secApiKey) throw new Error("SEC API Key is not configured.");
    if (!cik) throw new Error("A CIK is required.");

    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);
    
    const formatDate = (date) => date.toISOString().split('T')[0];

    const queryObject = {
      "query": {
        "query_string": {
          // FIX: Wrap the CIK in quotes to force an exact string match, resolving API inconsistencies.
          "query": `formType:("13F-HR" OR "13F-HR/A") AND cik:"${cik}" AND filedAt:[${formatDate(startDate)} TO ${formatDate(endDate)}]`
        }
      },
      "from": "0",
      "size": "20",
      "sort": [{ "filedAt": { "order": "desc" } }]
    };

    const result = await callSecQueryApi(queryObject);
    
    const filings = result?.filings || [];
    
    return { filings: filings, payload: queryObject };
}
