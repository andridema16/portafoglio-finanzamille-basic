/**
 * Aggiornamento portafoglio Aprile 2026.
 *
 * Legge i file JSON aggiornati da src/data/ e sincronizza il database Neon.
 * Aggiorna: portafoglio, categorie, titoli, storico.
 *
 * Esegui con: cd app && node --env-file=.env.local node_modules/.bin/tsx scripts/aggiornamento-aprile-2026.ts
 */

import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { join } from "path";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error(
    "DATABASE_URL non trovata. Esegui con: node --env-file=.env.local node_modules/.bin/tsx scripts/aggiornamento-aprile-2026.ts"
  );
  process.exit(1);
}

const sql = neon(DATABASE_URL);

// --- Carica JSON ---

const dataDir = join(__dirname, "../src/data");

function loadJSON(filename: string) {
  return JSON.parse(readFileSync(join(dataDir, filename), "utf-8"));
}

const portafoglio = loadJSON("portafoglio.json");
const categorie = loadJSON("categorie.json");
const titoli = loadJSON("titoli.json");
const storico = loadJSON("storico.json");

// --- Aggiorna portafoglio ---

async function aggiornaPortafoglio() {
  console.log("Aggiorno portafoglio...");
  await sql`UPDATE portafoglio SET
    investimento_iniziale = ${portafoglio.investimentoIniziale},
    valore_attuale = ${portafoglio.valoreAttuale},
    utile_realizzato = ${portafoglio.utileRealizzato},
    profitto_o_perdita = ${portafoglio.profittoOPerdita},
    var_percentuale = ${portafoglio.varPercentuale},
    liquidita = ${portafoglio.liquidita},
    nota_liquidita = ${portafoglio.notaLiquidita},
    valuta = ${portafoglio.valuta},
    data_inizio = ${portafoglio.dataInizio},
    data_aggiornamento = ${portafoglio.dataAggiornamento}
  WHERE id = (SELECT id FROM portafoglio LIMIT 1)`;
  console.log(`  Valore attuale: $${portafoglio.valoreAttuale}, P&L: $${portafoglio.profittoOPerdita} (${portafoglio.varPercentuale}%)`);
}

// --- Aggiorna categorie ---

async function aggiornaCategorie() {
  console.log("Aggiorno categorie...");
  for (const c of categorie) {
    await sql`UPDATE categorie SET
      nome = ${c.nome},
      slug = ${c.slug},
      peso_percentuale = ${c.pesoPercentuale},
      costo = ${c.costo},
      valore_attuale = ${c.valoreAttuale},
      profitto_o_perdita = ${c.profittoOPerdita},
      pl_percentuale = ${c.plPercentuale},
      dividendi = ${c.dividendi}
    WHERE id = ${c.id}`;
    console.log(`  ${c.nome}: $${c.valoreAttuale} (${c.plPercentuale > 0 ? "+" : ""}${c.plPercentuale}%)`);
  }
}

// --- Aggiorna titoli ---

async function aggiornaTitoli() {
  console.log("Aggiorno titoli...");
  let aggiornati = 0;
  let nonTrovati: string[] = [];

  for (const t of titoli) {
    const result = await sql`SELECT ticker FROM titoli WHERE ticker = ${t.ticker}`;
    if (result.length === 0) {
      // Titolo non esiste, crealo
      await sql`INSERT INTO titoli (ticker, nome, categoria, num_azioni, prezzo_medio_carico, costo, valore_attuale, peso_percentuale, var_prezzo, dividendi, profitto_o_perdita, pl_percentuale, pe_ratio, isin, asset_class, paese, settore)
        VALUES (${t.ticker}, ${t.nome}, ${t.categoria}, ${t.numAzioni}, ${t.prezzoMedioCarico}, ${t.costo}, ${t.valoreAttuale}, ${t.pesoPercentuale}, ${t.varPrezzo}, ${t.dividendi}, ${t.profittoOPerdita}, ${t.plPercentuale}, ${t.peRatio}, ${t.isin}, ${t.assetClass}, ${t.paese}, ${t.settore})`;
      nonTrovati.push(t.ticker);
    } else {
      await sql`UPDATE titoli SET
        nome = ${t.nome},
        categoria = ${t.categoria},
        num_azioni = ${t.numAzioni},
        prezzo_medio_carico = ${t.prezzoMedioCarico},
        costo = ${t.costo},
        valore_attuale = ${t.valoreAttuale},
        peso_percentuale = ${t.pesoPercentuale},
        var_prezzo = ${t.varPrezzo},
        dividendi = ${t.dividendi},
        profitto_o_perdita = ${t.profittoOPerdita},
        pl_percentuale = ${t.plPercentuale},
        pe_ratio = ${t.peRatio},
        isin = ${t.isin},
        asset_class = ${t.assetClass},
        paese = ${t.paese},
        settore = ${t.settore}
      WHERE ticker = ${t.ticker}`;
    }
    aggiornati++;
  }

  console.log(`  ${aggiornati} titoli aggiornati`);
  if (nonTrovati.length > 0) {
    console.log(`  Nuovi titoli creati: ${nonTrovati.join(", ")}`);
  }
}

// --- Aggiorna storico ---

async function aggiornaStorico() {
  console.log("Aggiorno storico...");
  // Aggiungi solo il nuovo punto (2026-04-13)
  const ultimoPunto = storico[storico.length - 1];
  await sql`INSERT INTO storico (data, valore, portfolio_id)
    VALUES (${ultimoPunto.data}, ${ultimoPunto.valore}, 'intermedio')
    ON CONFLICT (portfolio_id, data) DO UPDATE SET valore = ${ultimoPunto.valore}`;
  console.log(`  Punto aggiunto: ${ultimoPunto.data} → $${ultimoPunto.valore}`);
}

// --- Verifica ---

async function verifica() {
  console.log("\nVerifica...");
  const [p] = await sql`SELECT valore_attuale, data_aggiornamento FROM portafoglio LIMIT 1`;
  console.log(`  DB portafoglio: $${p.valore_attuale} al ${p.data_aggiornamento}`);

  const cats = await sql`SELECT nome, valore_attuale FROM categorie ORDER BY peso_percentuale DESC`;
  console.log(`  DB categorie: ${cats.length}`);

  const tits = await sql`SELECT COUNT(*) as n FROM titoli`;
  console.log(`  DB titoli: ${tits[0].n}`);

  const st = await sql`SELECT data, valore FROM storico ORDER BY data DESC LIMIT 1`;
  console.log(`  DB ultimo storico: ${st[0].data} → $${st[0].valore}`);
}

// --- Main ---

async function main() {
  console.log("=== Aggiornamento portafoglio Aprile 2026 ===\n");

  await aggiornaPortafoglio();
  await aggiornaCategorie();
  await aggiornaTitoli();
  await aggiornaStorico();
  await verifica();

  console.log("\nAggiornamento completato!");
}

main().catch((err) => {
  console.error("Errore:", err);
  process.exit(1);
});
