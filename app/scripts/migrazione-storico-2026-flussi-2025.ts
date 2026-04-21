/**
 * Migrazione: storico settimanale 2026 + flussi di capitale 2025.
 *
 * 1. Inserisce 12 punti storico settimanali 2026 (upsert)
 * 2. Inserisce 5 flussi di capitale 2025 (inizio + 3 depositi + 1 prelievo)
 * 3. Verifica conteggi e stampa flussi
 *
 * Esegui con: cd app && node --env-file=.env.local node_modules/.bin/tsx scripts/migrazione-storico-2026-flussi-2025.ts
 */

import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error(
    "DATABASE_URL non trovata. Esegui con: node --env-file=.env.local node_modules/.bin/tsx scripts/migrazione-storico-2026-flussi-2025.ts"
  );
  process.exit(1);
}

const sql = neon(DATABASE_URL);

// --- Dati ---

const STORICO_2026: Array<{ data: string; valore: number }> = [
  { data: "2026-01-07", valore: 30900 },
  { data: "2026-01-14", valore: 31397 },
  { data: "2026-01-23", valore: 32158 },
  { data: "2026-01-30", valore: 33600 },
  { data: "2026-02-06", valore: 35735 },
  { data: "2026-02-13", valore: 31500 },
  { data: "2026-02-18", valore: 31500 },
  { data: "2026-02-26", valore: 32451 },
  { data: "2026-03-06", valore: 31482 },
  { data: "2026-03-13", valore: 31135 },
  { data: "2026-03-19", valore: 30700 },
  { data: "2026-03-25", valore: 30016 },
];

const FLUSSI_2025: Array<{
  data: string;
  tipo: string;
  importo: number;
  valore_pre: number;
  capitale_post: number;
  nota: string;
}> = [
  {
    data: "2025-01-01",
    tipo: "inizio",
    importo: 30600,
    valore_pre: 30600,
    capitale_post: 30600,
    nota: "Avvio portafoglio intermedio 2025",
  },
  {
    data: "2025-04-30",
    tipo: "deposito",
    importo: 500,
    valore_pre: 31899,
    capitale_post: 31100,
    nota: "Deposito fine aprile 2025",
  },
  {
    data: "2025-07-31",
    tipo: "deposito",
    importo: 500,
    valore_pre: 34582,
    capitale_post: 31600,
    nota: "Deposito fine luglio 2025",
  },
  {
    data: "2025-11-30",
    tipo: "deposito",
    importo: 9000,
    valore_pre: 38500,
    capitale_post: 40600,
    nota: "Deposito fine novembre 2025",
  },
  {
    data: "2025-12-31",
    tipo: "prelievo",
    importo: 20225,
    valore_pre: 51000,
    capitale_post: 30775,
    nota: "Chiusura anno 2025 — Azzerati profitti, mantenute solo perdite. Ripartenza 2026.",
  },
];

async function main() {
  console.log("=== Migrazione storico 2026 + flussi 2025 ===\n");

  // 1. Storico settimanale 2026
  console.log(`1. Inserimento storico settimanale 2026 (${STORICO_2026.length} punti, upsert)...`);
  for (const punto of STORICO_2026) {
    await sql`
      INSERT INTO storico (data, valore)
      VALUES (${punto.data}, ${punto.valore})
      ON CONFLICT (data) DO UPDATE SET valore = EXCLUDED.valore
    `;
  }
  console.log(`   ${STORICO_2026.length} punti storico inseriti/aggiornati.\n`);

  // 2. Flussi di capitale 2025
  // Elimina eventuali flussi 2025 preesistenti per idempotenza (non tocca i flussi 2026)
  await sql`DELETE FROM flussi_capitale WHERE data < '2026-01-01'`;
  console.log(`2. Inserimento flussi di capitale 2025 (${FLUSSI_2025.length} record)...`);
  for (const f of FLUSSI_2025) {
    await sql`
      INSERT INTO flussi_capitale (data, tipo, importo, valore_pre, capitale_post, nota)
      VALUES (${f.data}, ${f.tipo}, ${f.importo}, ${f.valore_pre}, ${f.capitale_post}, ${f.nota})
    `;
  }
  console.log(`   ${FLUSSI_2025.length} flussi 2025 inseriti.\n`);

  // 3. Verifica
  console.log("=== Verifica ===\n");

  const countStorico = await sql`SELECT count(*) AS cnt FROM storico`;
  console.log(`storico: ${countStorico[0].cnt} righe (atteso ~27)`);

  const countFlussi = await sql`SELECT count(*) AS cnt FROM flussi_capitale`;
  console.log(`flussi_capitale: ${countFlussi[0].cnt} righe (atteso 7)\n`);

  const flussi = await sql`SELECT * FROM flussi_capitale ORDER BY data ASC`;
  console.log("flussi_capitale (tutti):");
  for (const r of flussi) {
    const data =
      r.data instanceof Date ? r.data.toISOString().slice(0, 10) : String(r.data).slice(0, 10);
    console.log(
      `  ${data} | ${String(r.tipo).padEnd(8)} | importo: ${String(r.importo).padStart(6)} | valore_pre: ${String(r.valore_pre).padStart(6)} | capitale_post: ${String(r.capitale_post).padStart(6)} | ${r.nota}`
    );
  }

  // Validazione
  const storicoOk = Number(countStorico[0].cnt) >= 25;
  const flussiOk = Number(countFlussi[0].cnt) === 7;

  console.log(
    `\n${storicoOk && flussiOk ? "MIGRAZIONE COMPLETATA CON SUCCESSO" : "ATTENZIONE: conteggi diversi dal previsto — verificare manualmente"}`
  );
  process.exit(storicoOk && flussiOk ? 0 : 1);
}

main().catch((err) => {
  console.error("Errore durante la migrazione:", err);
  process.exit(1);
});
