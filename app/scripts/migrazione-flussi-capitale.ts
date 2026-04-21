/**
 * Migrazione: crea tabella flussi_capitale e aggiorna dati correlati.
 *
 * 1. Crea tabella flussi_capitale (depositi/prelievi/inizio)
 * 2. Inserisce i dati iniziali (inizio + prelievo 24/03)
 * 3. Inserisce/aggiorna punti storico mancanti (23/03 e 24/03)
 * 4. Aggiorna investimento_iniziale in portafoglio a 30300
 *
 * Esegui con: cd app && node --env-file=.env.local node_modules/.bin/tsx scripts/migrazione-flussi-capitale.ts
 */

import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL non trovata. Esegui con: node --env-file=.env.local node_modules/.bin/tsx scripts/migrazione-flussi-capitale.ts");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function main() {
  console.log("=== Migrazione flussi_capitale ===\n");

  // 1. Crea tabella flussi_capitale
  console.log("1. Creazione tabella flussi_capitale...");
  await sql`
    CREATE TABLE IF NOT EXISTS flussi_capitale (
      id SERIAL PRIMARY KEY,
      data DATE NOT NULL,
      tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('deposito', 'prelievo', 'inizio')),
      importo NUMERIC NOT NULL,
      valore_pre NUMERIC NOT NULL,
      capitale_post NUMERIC NOT NULL,
      nota TEXT DEFAULT ''
    )
  `;
  console.log("   Tabella creata.\n");

  // 2. Inserisce dati iniziali
  console.log("2. Inserimento flussi di capitale...");

  // Svuota la tabella se esiste già per evitare duplicati
  await sql`DELETE FROM flussi_capitale`;

  await sql`
    INSERT INTO flussi_capitale (data, tipo, importo, valore_pre, capitale_post, nota)
    VALUES
      ('2026-01-02', 'inizio', 30775, 30775, 30775, 'Capitale iniziale anno 2026'),
      ('2026-03-24', 'prelievo', 475, 30475, 30300, 'Ribilanciamento portafoglio — riduzione capitale')
  `;
  console.log("   2 flussi inseriti.\n");

  // 3. Inserisce/aggiorna punti storico
  console.log("3. Inserimento punti storico mancanti...");

  await sql`
    INSERT INTO storico (data, valore)
    VALUES ('2026-03-23', 29995)
    ON CONFLICT (data) DO UPDATE SET valore = 29995
  `;
  await sql`
    INSERT INTO storico (data, valore)
    VALUES ('2026-03-24', 30000)
    ON CONFLICT (data) DO UPDATE SET valore = 30000
  `;
  console.log("   Storico 23/03 (29995) e 24/03 (30000) inseriti/aggiornati.\n");

  // 4. Aggiorna investimento_iniziale in portafoglio
  console.log("4. Aggiornamento investimento_iniziale a 30300...");
  await sql`
    UPDATE portafoglio SET investimento_iniziale = 30300
    WHERE id = (SELECT id FROM portafoglio LIMIT 1)
  `;
  console.log("   Aggiornato.\n");

  // 5. Verifica finale
  console.log("=== Verifica ===\n");

  const flussi = await sql`SELECT * FROM flussi_capitale ORDER BY data`;
  console.log(`flussi_capitale: ${flussi.length} righe`);
  for (const r of flussi) {
    console.log(`  ${r.data} | ${r.tipo} | importo: ${r.importo} | valore_pre: ${r.valore_pre} | capitale_post: ${r.capitale_post} | ${r.nota}`);
  }

  const portafoglio = await sql`SELECT investimento_iniziale FROM portafoglio LIMIT 1`;
  console.log(`\nportafoglio.investimento_iniziale: ${portafoglio[0].investimento_iniziale}`);

  const storico = await sql`SELECT * FROM storico WHERE data IN ('2026-03-23', '2026-03-24') ORDER BY data`;
  console.log(`\nStorico verificato:`);
  for (const r of storico) {
    console.log(`  ${r.data} | valore: ${r.valore}`);
  }

  // Validazione
  const ok =
    flussi.length === 2 &&
    Number(portafoglio[0].investimento_iniziale) === 30300 &&
    storico.length === 2;

  console.log(`\n${ok ? "MIGRAZIONE COMPLETATA CON SUCCESSO" : "ERRORE: verifica fallita!"}`);
  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  console.error("Errore durante la migrazione:", err);
  process.exit(1);
});
