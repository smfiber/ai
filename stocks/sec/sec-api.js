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
            filedAt: filing.filedAt
        };
    }).filter(h => h.value > 0);
}

export async function getSecMaterialEvents(ticker) {
    const queryObject = {
      "query": { "query_string": { "query": `formType:\"8-K\" AND ticker:${ticker}` } },
      "from": "0",
      "size": "25",
      "sort": [{ "filedAt": { "order": "desc" } }]
    };
    const result = await callSecQueryApi(queryObject);
    return result?.filings || [];
}

export async function getSecAnnualReports(ticker) {
    const queryObject = {
      "query": { "query_string": { "query": `formType:\"10-K\" AND ticker:${ticker}` } },
      "from": "0",
      "size": "10",
      "sort": [{ "filedAt": { "order": "desc" } }]
    };
    const result = await callSecQueryApi(queryObject);
    return result?.filings || [];
}

export async function getSecQuarterlyReports(ticker) {
    const queryObject = {
      "query": { "query_string": { "query": `formType:\"10-Q\" AND ticker:${ticker}` } },
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
        "size": "50", // Fetch the latest 50 filings across the entire portfolio
        "sort": [{ "filedAt": { "order": "desc" } }]
    };
    const result = await callSecQueryApi(queryObject);
    return result?.filings || [];
}
