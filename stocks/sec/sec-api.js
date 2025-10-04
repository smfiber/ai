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
                ticker: filing.ticker // Add ticker to the transaction object
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
            ticker: ticker // Add ticker to the holding object
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
      "size": "50", // Increased size to capture all within 2 years
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
      "size": "10",
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
      "size": "10",
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

export async function getFilingContent(filingUrl) {
    if (!state.secApiKey) throw new Error("SEC API Key is not configured.");
    if (!filingUrl) throw new Error("A filing URL is required.");

    // This endpoint now uses a POST request
    const url = `https://api.sec-api.io/filing-text`;
    const body = {
        token: state.secApiKey,
        url: filingUrl
    };
    
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch filing text: ${response.statusText} - ${errorText}`);
    }
    // This endpoint returns raw text, not JSON
    return await response.text();
}

export async function getPortfolioInsiderTrading(tickers) {
    if (!tickers || tickers.length === 0) return [];
    
    const tickerQueryString = tickers.join(" OR ");
    const queryObject = {
      "query": { "query_string": { "query": `formType:\"4\" AND ticker:(${tickerQueryString})` } },
      "from": "0",
      "size": "100", // Get more results for a portfolio-wide view
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
