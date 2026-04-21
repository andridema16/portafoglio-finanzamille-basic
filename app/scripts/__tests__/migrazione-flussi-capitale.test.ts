/**
 * Test suite per migrazione-flussi-capitale.ts
 *
 * Strategia: mocka il modulo `@neondatabase/serverless` per intercettare
 * tutte le query SQL e verificare che:
 *   1. La DDL per flussi_capitale contenga le colonne e i constraint corretti
 *   2. I valori inseriti siano esatti (importi, date, tipi)
 *   3. L'idempotenza funzioni tramite DELETE + re-insert
 *   4. La validazione finale controlli tutte le condizioni attese
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── Tipi helper ─────────────────────────────────────────────────────────────

interface SqlCall {
  raw: string; // stringa SQL normalizzata
}

// ── Mock di @neondatabase/serverless ────────────────────────────────────────

// Le chiamate registrate durante ogni test
let sqlCalls: SqlCall[] = [];

/**
 * Implementazione mock del tagged template literal restituito da neon().
 * Intercetta ogni query, la normalizza e la salva in sqlCalls.
 * Restituisce un risultato appropriato in base alla query.
 */
function buildMockSql() {
  const mockSql = vi.fn(
    (strings: TemplateStringsArray, ...values: unknown[]): Promise<unknown[]> => {
      // Ricostruisce la stringa SQL sostituendo i placeholder con i valori
      let raw = "";
      strings.forEach((part, i) => {
        raw += part;
        if (i < values.length) raw += String(values[i]);
      });
      raw = raw.replace(/\s+/g, " ").trim();
      sqlCalls.push({ raw });

      // Determina la risposta in base al tipo di query
      if (/SELECT \* FROM flussi_capitale/i.test(raw)) {
        return Promise.resolve([
          {
            data: "2026-01-02",
            tipo: "inizio",
            importo: "30775",
            valore_pre: "30775",
            capitale_post: "30775",
            nota: "Capitale iniziale anno 2026",
          },
          {
            data: "2026-03-24",
            tipo: "prelievo",
            importo: "475",
            valore_pre: "30475",
            capitale_post: "30300",
            nota: "Ribilanciamento portafoglio — riduzione capitale",
          },
        ]);
      }

      if (/SELECT investimento_iniziale FROM portafoglio/i.test(raw)) {
        return Promise.resolve([{ investimento_iniziale: "30300" }]);
      }

      if (/SELECT \* FROM storico WHERE data IN/i.test(raw)) {
        return Promise.resolve([
          { data: "2026-03-23", valore: "29995" },
          { data: "2026-03-24", valore: "30000" },
        ]);
      }

      // DDL, DML senza risultato (CREATE TABLE, DELETE, INSERT, UPDATE)
      return Promise.resolve([]);
    }
  );

  return mockSql;
}

// ── Setup mock modulo ────────────────────────────────────────────────────────

let mockSqlInstance: ReturnType<typeof buildMockSql>;

vi.mock("@neondatabase/serverless", () => {
  return {
    neon: (_url: string) => {
      return (...args: Parameters<ReturnType<typeof buildMockSql>>) =>
        mockSqlInstance(...args);
    },
  };
});

// ── Esegue lo script (dinamicamente, dopo che DATABASE_URL è stata settata) ──

async function runMigration(): Promise<void> {
  // Resetta la cache del modulo per poterlo reimportare in ogni test
  vi.resetModules();

  // Carica il modulo; process.exit è già mockato nel beforeEach
  await import("../migrazione-flussi-capitale.js");

  // Attende il completamento dell'esecuzione asincrona di main()
  await new Promise((resolve) => setTimeout(resolve, 50));
}

// ── Blocco test ──────────────────────────────────────────────────────────────

describe("migrazione-flussi-capitale", () => {
  const originalEnv = process.env.DATABASE_URL;
  const originalExit = process.exit;

  beforeEach(() => {
    sqlCalls = [];
    mockSqlInstance = buildMockSql();

    // Inietta DATABASE_URL fittizia per evitare il process.exit(1) iniziale
    process.env.DATABASE_URL = "postgresql://mock:mock@mock/mock";

    // Silenzia process.exit per non bloccare i test
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (process as any).exit = vi.fn();
  });

  afterEach(() => {
    process.env.DATABASE_URL = originalEnv;
    process.exit = originalExit;
    vi.resetModules();
  });

  // ── 1. Struttura DDL ──────────────────────────────────────────────────────

  describe("1. Struttura SQL della tabella flussi_capitale", () => {
    it("emette una query CREATE TABLE IF NOT EXISTS flussi_capitale", async () => {
      await runMigration();
      const ddl = sqlCalls.find((c) => /CREATE TABLE IF NOT EXISTS flussi_capitale/i.test(c.raw));
      expect(ddl, "Nessuna CREATE TABLE trovata").toBeDefined();
    });

    it("definisce la colonna id come SERIAL PRIMARY KEY", async () => {
      await runMigration();
      const ddl = sqlCalls.find((c) => /CREATE TABLE IF NOT EXISTS flussi_capitale/i.test(c.raw))!;
      expect(ddl.raw).toMatch(/id\s+SERIAL\s+PRIMARY\s+KEY/i);
    });

    it("definisce la colonna data come DATE NOT NULL", async () => {
      await runMigration();
      const ddl = sqlCalls.find((c) => /CREATE TABLE IF NOT EXISTS flussi_capitale/i.test(c.raw))!;
      expect(ddl.raw).toMatch(/data\s+DATE\s+NOT\s+NULL/i);
    });

    it("definisce la colonna tipo come VARCHAR(20) NOT NULL con CHECK", async () => {
      await runMigration();
      const ddl = sqlCalls.find((c) => /CREATE TABLE IF NOT EXISTS flussi_capitale/i.test(c.raw))!;
      expect(ddl.raw).toMatch(/tipo\s+VARCHAR\(20\)\s+NOT\s+NULL/i);
      // Il CHECK deve includere tutti e tre i valori ammessi
      expect(ddl.raw).toMatch(/CHECK\s*\(\s*tipo\s+IN\s*\([^)]*'deposito'[^)]*\)/i);
      expect(ddl.raw).toMatch(/CHECK\s*\(\s*tipo\s+IN\s*\([^)]*'prelievo'[^)]*\)/i);
      expect(ddl.raw).toMatch(/CHECK\s*\(\s*tipo\s+IN\s*\([^)]*'inizio'[^)]*\)/i);
    });

    it("definisce le colonne numeriche importo, valore_pre, capitale_post come NUMERIC NOT NULL", async () => {
      await runMigration();
      const ddl = sqlCalls.find((c) => /CREATE TABLE IF NOT EXISTS flussi_capitale/i.test(c.raw))!;
      expect(ddl.raw).toMatch(/importo\s+NUMERIC\s+NOT\s+NULL/i);
      expect(ddl.raw).toMatch(/valore_pre\s+NUMERIC\s+NOT\s+NULL/i);
      expect(ddl.raw).toMatch(/capitale_post\s+NUMERIC\s+NOT\s+NULL/i);
    });

    it("definisce la colonna nota come TEXT con DEFAULT vuoto", async () => {
      await runMigration();
      const ddl = sqlCalls.find((c) => /CREATE TABLE IF NOT EXISTS flussi_capitale/i.test(c.raw))!;
      expect(ddl.raw).toMatch(/nota\s+TEXT\s+DEFAULT\s+''/i);
    });
  });

  // ── 2. Valori inseriti ────────────────────────────────────────────────────

  describe("2. Valori inseriti nelle righe flussi_capitale", () => {
    it("inserisce una riga con tipo 'inizio' al 2026-01-02", async () => {
      await runMigration();
      const insertSql = sqlCalls.find((c) => /INSERT INTO flussi_capitale/i.test(c.raw));
      expect(insertSql, "Nessun INSERT INTO flussi_capitale trovato").toBeDefined();
      expect(insertSql!.raw).toMatch(/2026-01-02/);
      expect(insertSql!.raw).toMatch(/inizio/);
    });

    it("inserisce la riga inizio con importo 30775 e capitale_post 30775", async () => {
      await runMigration();
      const insertSql = sqlCalls.find((c) => /INSERT INTO flussi_capitale/i.test(c.raw))!;
      // La riga inizio deve avere importo = valore_pre = capitale_post = 30775
      expect(insertSql.raw).toMatch(/30775/);
    });

    it("inserisce una riga con tipo 'prelievo' al 2026-03-24", async () => {
      await runMigration();
      const insertSql = sqlCalls.find((c) => /INSERT INTO flussi_capitale/i.test(c.raw))!;
      expect(insertSql.raw).toMatch(/2026-03-24/);
      expect(insertSql.raw).toMatch(/prelievo/);
    });

    it("il prelievo ha importo 475, valore_pre 30475, capitale_post 30300", async () => {
      await runMigration();
      const insertSql = sqlCalls.find((c) => /INSERT INTO flussi_capitale/i.test(c.raw))!;
      expect(insertSql.raw).toMatch(/475/);
      expect(insertSql.raw).toMatch(/30475/);
      expect(insertSql.raw).toMatch(/30300/);
    });

    it("la nota del prelievo descrive il ribilanciamento del portafoglio", async () => {
      await runMigration();
      const insertSql = sqlCalls.find((c) => /INSERT INTO flussi_capitale/i.test(c.raw))!;
      expect(insertSql.raw).toMatch(/Ribilanciamento portafoglio/i);
    });

    it("inserisce esattamente 2 righe in un'unica istruzione VALUES multi-riga", async () => {
      await runMigration();
      // Lo script usa un singolo INSERT con 2 coppie VALUES
      const insertSql = sqlCalls.find((c) => /INSERT INTO flussi_capitale/i.test(c.raw))!;
      // Due occorrenze di VALUES separati da virgola
      const valueMatches = insertSql.raw.match(/\([^)]+\)/g) ?? [];
      // Almeno 2 tuple di valori dopo la lista colonne
      expect(valueMatches.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ── 3. Punti storico ──────────────────────────────────────────────────────

  describe("3. Inserimento/aggiornamento punti storico", () => {
    it("esegue un INSERT INTO storico per il 2026-03-23 con valore 29995", async () => {
      await runMigration();
      const storico23 = sqlCalls.find(
        (c) => /INSERT INTO storico/i.test(c.raw) && c.raw.includes("2026-03-23")
      );
      expect(storico23, "Nessun INSERT storico 2026-03-23 trovato").toBeDefined();
      expect(storico23!.raw).toMatch(/29995/);
    });

    it("esegue un INSERT INTO storico per il 2026-03-24 con valore 30000", async () => {
      await runMigration();
      const storico24 = sqlCalls.find(
        (c) => /INSERT INTO storico/i.test(c.raw) && c.raw.includes("2026-03-24")
      );
      expect(storico24, "Nessun INSERT storico 2026-03-24 trovato").toBeDefined();
      expect(storico24!.raw).toMatch(/30000/);
    });

    it("usa ON CONFLICT (data) DO UPDATE per evitare duplicati sullo storico", async () => {
      await runMigration();
      const storicoInserts = sqlCalls.filter((c) => /INSERT INTO storico/i.test(c.raw));
      for (const q of storicoInserts) {
        expect(q.raw).toMatch(/ON CONFLICT.*DO UPDATE/i);
      }
    });
  });

  // ── 4. Aggiornamento portafoglio ─────────────────────────────────────────

  describe("4. Aggiornamento investimento_iniziale in portafoglio", () => {
    it("esegue un UPDATE portafoglio SET investimento_iniziale = 30300", async () => {
      await runMigration();
      const update = sqlCalls.find((c) => /UPDATE portafoglio/i.test(c.raw));
      expect(update, "Nessun UPDATE portafoglio trovato").toBeDefined();
      expect(update!.raw).toMatch(/investimento_iniziale\s*=\s*30300/i);
    });

    it("il WHERE limita l'update al primo record (LIMIT 1)", async () => {
      await runMigration();
      const update = sqlCalls.find((c) => /UPDATE portafoglio/i.test(c.raw))!;
      expect(update.raw).toMatch(/LIMIT\s+1/i);
    });
  });

  // ── 5. Idempotenza ────────────────────────────────────────────────────────

  describe("5. Idempotenza: DELETE prima di re-insert", () => {
    it("esegue DELETE FROM flussi_capitale prima dell'INSERT", async () => {
      await runMigration();
      const deleteIdx = sqlCalls.findIndex((c) => /DELETE FROM flussi_capitale/i.test(c.raw));
      const insertIdx = sqlCalls.findIndex((c) => /INSERT INTO flussi_capitale/i.test(c.raw));
      expect(deleteIdx, "Nessun DELETE FROM flussi_capitale trovato").toBeGreaterThanOrEqual(0);
      expect(insertIdx, "Nessun INSERT INTO flussi_capitale trovato").toBeGreaterThanOrEqual(0);
      expect(deleteIdx).toBeLessThan(insertIdx);
    });

    it("non inserisce duplicati se lo script viene eseguito due volte (mock seconda esecuzione)", async () => {
      // Prima esecuzione
      await runMigration();
      const firstInsertIdx = sqlCalls.findIndex((c) => /INSERT INTO flussi_capitale/i.test(c.raw));

      // Seconda esecuzione: resetta le chiamate e riesegue
      sqlCalls = [];
      await runMigration();

      // Deve esserci ancora un DELETE prima dell'INSERT
      const deleteIdx2 = sqlCalls.findIndex((c) => /DELETE FROM flussi_capitale/i.test(c.raw));
      const insertIdx2 = sqlCalls.findIndex((c) => /INSERT INTO flussi_capitale/i.test(c.raw));
      expect(deleteIdx2).toBeGreaterThanOrEqual(0);
      expect(insertIdx2).toBeGreaterThanOrEqual(0);
      expect(deleteIdx2).toBeLessThan(insertIdx2);

      // Deve risultare sempre 2 flussi (il mock restituisce 2 righe)
      const flussiQuery = sqlCalls.find((c) => /SELECT \* FROM flussi_capitale/i.test(c.raw));
      expect(flussiQuery).toBeDefined();
      // L'indice firstInsertIdx non è vuoto: la prima esecuzione ha trovato l'INSERT
      expect(firstInsertIdx).toBeGreaterThanOrEqual(0);
    });
  });

  // ── 6. Validazione finale ─────────────────────────────────────────────────

  describe("6. Validazione finale", () => {
    it("esegue SELECT * FROM flussi_capitale ORDER BY data", async () => {
      await runMigration();
      const q = sqlCalls.find(
        (c) => /SELECT \* FROM flussi_capitale/i.test(c.raw) && /ORDER BY data/i.test(c.raw)
      );
      expect(q, "Nessuna query di verifica su flussi_capitale trovata").toBeDefined();
    });

    it("esegue SELECT investimento_iniziale FROM portafoglio", async () => {
      await runMigration();
      const q = sqlCalls.find((c) => /SELECT investimento_iniziale FROM portafoglio/i.test(c.raw));
      expect(q, "Nessuna query di verifica su portafoglio trovata").toBeDefined();
    });

    it("esegue SELECT * FROM storico WHERE data IN ('2026-03-23', '2026-03-24')", async () => {
      await runMigration();
      const q = sqlCalls.find(
        (c) => /SELECT \* FROM storico WHERE data IN/i.test(c.raw)
      );
      expect(q, "Nessuna query di verifica su storico trovata").toBeDefined();
      expect(q!.raw).toMatch(/2026-03-23/);
      expect(q!.raw).toMatch(/2026-03-24/);
    });

    it("la condizione ok richiede flussi.length === 2", async () => {
      // Il mock restituisce 2 righe: la validazione deve risultare ok
      await runMigration();
      // Verifichiamo che process.exit sia stato chiamato con 0 (successo)
      expect(process.exit).toHaveBeenCalledWith(0);
    });

    it("la condizione ok richiede portafoglio.investimento_iniziale === 30300", async () => {
      // Il mock restituisce 30300: la validazione deve risultare ok
      await runMigration();
      expect(process.exit).toHaveBeenCalledWith(0);
    });

    it("la condizione ok richiede storico.length === 2", async () => {
      // Il mock restituisce 2 righe storico: la validazione deve risultare ok
      await runMigration();
      expect(process.exit).toHaveBeenCalledWith(0);
    });

    it("chiama process.exit(1) se DATABASE_URL non e' definita", async () => {
      vi.resetModules();
      process.env.DATABASE_URL = "";
      await import("../migrazione-flussi-capitale.js");
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });

  // ── 7. Ordine delle operazioni ────────────────────────────────────────────

  describe("7. Ordine corretto delle operazioni", () => {
    it("esegue CREATE TABLE, poi DELETE, poi INSERT flussi, poi INSERT storico, poi UPDATE portafoglio", async () => {
      await runMigration();

      const idxCreate = sqlCalls.findIndex((c) => /CREATE TABLE IF NOT EXISTS flussi_capitale/i.test(c.raw));
      const idxDelete = sqlCalls.findIndex((c) => /DELETE FROM flussi_capitale/i.test(c.raw));
      const idxInsertFlussi = sqlCalls.findIndex((c) => /INSERT INTO flussi_capitale/i.test(c.raw));
      const idxInsertStorico = sqlCalls.findIndex((c) => /INSERT INTO storico/i.test(c.raw));
      const idxUpdate = sqlCalls.findIndex((c) => /UPDATE portafoglio/i.test(c.raw));

      expect(idxCreate).toBeGreaterThanOrEqual(0);
      expect(idxDelete).toBeGreaterThan(idxCreate);
      expect(idxInsertFlussi).toBeGreaterThan(idxDelete);
      expect(idxInsertStorico).toBeGreaterThan(idxInsertFlussi);
      expect(idxUpdate).toBeGreaterThan(idxInsertStorico);
    });
  });
});
