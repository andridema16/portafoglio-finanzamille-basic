/**
 * Script per calcolare il valore reale del portafoglio al 31/12/2025
 * usando i prezzi di chiusura da Yahoo Finance.
 *
 * Il portafoglio a dicembre 2025 era identico a quello attuale
 * MA con queste differenze (le operazioni sono tutte del 2026):
 * - VAL: 4 azioni (non 2.5 — vendute 1.5 il 15/01/2026)
 * - FDX: 1 azione (non 0.7 — vendute 0.3 il 02/02/2026)
 * - PEP: 2.2 azioni (non 1.6 — vendute 0.6 il 04/02/2026)
 * - CPA: 0 azioni (comprate 2 il 20/01/2026)
 *
 * Esegui con: cd app && npx tsx scripts/calcola-dicembre-2025.ts
 */

import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

// Portafoglio al 31/12/2025 (pre-operazioni 2026)
const PORTAFOGLIO: Record<string, number> = {
  ACN: 1, ADBE: 1, AFL: 1.5, AMGN: 0.65, AMZN: 2, APD: 1,
  ASEA: 30, ATO: 1.25, AXP: 1, BIL: 18, BKNG: 0.1, BN: 5,
  BP: 5, BTI: 5.5, CAKE: 1.5, CCL: 9, CI: 1, CIB: 4,
  CNQ: 5.5, COR: 1, CSCO: 3, CVS: 3, ELV: 1, ENB: 3.5,
  EOG: 2.5, FISV: 3, GBTC: 20, GOOGL: 3, GUNR: 20, HAL: 5.5,
  HDB: 10, ICE: 1, ILF: 32, INDA: 14, ITUB: 22, MELI: 0.1,
  MO: 4, NEE: 2.5, NTR: 3.5, NVS: 2, OMAB: 2, OZK: 7,
  PPLT: 4, PRU: 2, PYPL: 12, PHYS: 54, RIO: 3.5, SHEL: 2.5,
  SHY: 17, SIVR: 24, SLYV: 13, SU: 5.5, TDW: 4, TRV: 1,
  TTE: 3, UNP: 1, USB: 6, V: 1, VGK: 12, VPL: 12,
  VWO: 20, XOM: 2,
  // Posizioni pre-2026 (diverse da quelle attuali)
  VAL: 4,     // attuale: 2.5 (vendute 1.5 il 15/01/2026)
  FDX: 1,     // attuale: 0.7 (vendute 0.3 il 02/02/2026)
  PEP: 2.2,   // attuale: 1.6 (vendute 0.6 il 04/02/2026)
  // CPA: 0 — non esisteva ancora (comprate 2 il 20/01/2026)
};

const DATA_TARGET = "2025-12-31";
const BATCH_SIZE = 10;

async function getPrezzoChiusura(ticker: string, data: string): Promise<number | null> {
  try {
    // Prendi 5 giorni prima per gestire weekend/festivi
    const target = new Date(data);
    const inizio = new Date(target);
    inizio.setDate(inizio.getDate() - 5);
    const fine = new Date(target);
    fine.setDate(fine.getDate() + 1);

    const result = await yahooFinance.chart(ticker, {
      period1: inizio.toISOString().slice(0, 10),
      period2: fine.toISOString().slice(0, 10),
      interval: "1d",
    });

    const quotes = (result.quotes ?? []).filter((q) => q.close != null);
    if (quotes.length === 0) return null;

    // Prendi l'ultimo quote <= data target
    const targetStr = data;
    let best = quotes[0];
    for (const q of quotes) {
      const qDate = q.date.toISOString().slice(0, 10);
      if (qDate <= targetStr) best = q;
    }
    return best.close!;
  } catch (e) {
    console.error(`  Errore per ${ticker}:`, (e as Error).message);
    return null;
  }
}

async function main() {
  console.log(`\nCalcolo valore portafoglio al ${DATA_TARGET}`);
  console.log("=".repeat(60));

  const tickers = Object.keys(PORTAFOGLIO);
  console.log(`\nTicker totali: ${tickers.length}`);
  console.log("Fetching prezzi da Yahoo Finance...\n");

  const prezzi: Record<string, number | null> = {};

  // Fetch in batch da 10
  for (let i = 0; i < tickers.length; i += BATCH_SIZE) {
    const batch = tickers.slice(i, i + BATCH_SIZE);
    const risultati = await Promise.all(
      batch.map(async (ticker) => ({
        ticker,
        prezzo: await getPrezzoChiusura(ticker, DATA_TARGET),
      }))
    );
    for (const r of risultati) {
      prezzi[r.ticker] = r.prezzo;
    }
    console.log(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(tickers.length / BATCH_SIZE)} completato`);
  }

  // Calcola il valore totale
  console.log("\n" + "-".repeat(60));
  console.log(`${"Ticker".padEnd(8)} ${"Azioni".padStart(8)} ${"Prezzo".padStart(10)} ${"Valore".padStart(12)}`);
  console.log("-".repeat(60));

  let valoreTotale = 0;
  const tickerMancanti: string[] = [];

  for (const ticker of tickers) {
    const azioni = PORTAFOGLIO[ticker];
    const prezzo = prezzi[ticker];

    if (prezzo == null) {
      tickerMancanti.push(ticker);
      console.log(`${ticker.padEnd(8)} ${azioni.toString().padStart(8)} ${"N/A".padStart(10)} ${"N/A".padStart(12)}`);
      continue;
    }

    const valore = azioni * prezzo;
    valoreTotale += valore;
    console.log(
      `${ticker.padEnd(8)} ${azioni.toString().padStart(8)} ${("$" + prezzo.toFixed(2)).padStart(10)} ${("$" + valore.toFixed(2)).padStart(12)}`
    );
  }

  console.log("-".repeat(60));
  console.log(`${"TOTALE".padEnd(8)} ${"".padStart(8)} ${"".padStart(10)} ${("$" + valoreTotale.toFixed(2)).padStart(12)}`);
  console.log("=".repeat(60));

  // Calcola variazione dal punto iniziale (dic 2024)
  const valoreIniziale = 30644.8; // dal PDF PTF al 31.12.2024
  const variazione = ((valoreTotale - valoreIniziale) / valoreIniziale) * 100;

  console.log(`\nValore iniziale (31/12/2024): $${valoreIniziale.toFixed(2)}`);
  console.log(`Valore al ${DATA_TARGET}: $${valoreTotale.toFixed(2)}`);
  console.log(`Ritorno annuale 2025: ${variazione >= 0 ? "+" : ""}${variazione.toFixed(2)}%`);

  if (tickerMancanti.length > 0) {
    console.log(`\nATTENZIONE: ${tickerMancanti.length} ticker senza prezzo: ${tickerMancanti.join(", ")}`);
  }

  // SQL pronto per l'inserimento
  console.log(`\n-- SQL per inserire nel DB:`);
  console.log(`INSERT INTO storico (data, valore) VALUES ('${DATA_TARGET}', ${valoreTotale.toFixed(2)})`);
  console.log(`ON CONFLICT (data) DO UPDATE SET valore = ${valoreTotale.toFixed(2)};`);
}

main().catch(console.error);
