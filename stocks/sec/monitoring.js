import { getDocs, query, where, collection, doc, updateDoc, Timestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getSecMaterialEvents, getSecAnnualReports, getSecQuarterlyReports } from './sec-api.js';
import { state, CONSTANTS } from './config.js';
import { fetchAndCachePortfolioData } from './ui-render.js';

// --- CHANGE STARTS HERE ---
const delay = ms => new Promise(res => setTimeout(res, ms));
// --- CHANGE ENDS HERE ---

export async function checkForNewFilings() {
  console.log("Checking for new SEC filings...");
  try {
    const portfolioRef = collection(state.db, CONSTANTS.DB_COLLECTION_PORTFOLIO);
    const q = query(portfolioRef, where("status", "in", ["Portfolio", "Watchlist"]));

    const querySnapshot = await getDocs(q);
    for (const stockDoc of querySnapshot.docs) {
      const stockData = stockDoc.data();
      const ticker = stockDoc.id;
      // Use a very old date as a default if one isn't stored
      const lastKnownDate = stockData.lastKnownFilingDate ? stockData.lastKnownFilingDate.toDate() : new Date(0);

      // --- CHANGE STARTS HERE ---
      // Add a small delay to avoid hitting rate limits on large portfolios
      await delay(250);
      // --- CHANGE ENDS HERE ---

      // Fetch the single most recent filing of each type
      const latest8K = (await getSecMaterialEvents(ticker)).slice(0, 1);
      const latest10K = (await getSecAnnualReports(ticker)).slice(0, 1);
      const latest10Q = (await getSecQuarterlyReports(ticker)).slice(0, 1);

      const latestFilings = [...latest8K, ...latest10K, ...latest10Q];

      let newestFilingDate = lastKnownDate;
      let hasNew = false;

      for (const filing of latestFilings) {
        if (filing && filing.filedAt) {
            const filedAt = new Date(filing.filedAt);
            if (filedAt > lastKnownDate) {
                hasNew = true;
                if (filedAt > newestFilingDate) {
                    newestFilingDate = filedAt;
                }
            }
        }
      }

      if (hasNew) {
        console.log(`New filing found for ${ticker}! Updating database.`);
        const stockRef = doc(state.db, CONSTANTS.DB_COLLECTION_PORTFOLIO, ticker);
        await updateDoc(stockRef, {
          hasNewFilings: true,
          lastKnownFilingDate: Timestamp.fromDate(newestFilingDate)
        });
      }
    }
    // After checking all stocks, refresh the portfolio data to show any new badges
    await fetchAndCachePortfolioData();
    console.log("Filings check complete.");
  } catch (error) {
      console.error("Error during filings check:", error);
  }
}
