/**
 * Test suite per migrazione-storico-2026-flussi-2025.ts
 *
 * Strategia: senza toccare il DB reale, il file sorgente viene analizzato
 * in due modi complementari:
 *
 *   A) Analisi statica del sorgente — il file .ts viene letto come testo
 *      e verificato con espressioni regolari. Garantisce che i valori
 *      dichiarati, i pattern SQL e i controlli strutturali siano corretti
 *      anche senza eseguire lo script.
 *
 *   B) Esecuzione con mock di @neondatabase/serverless — lo script viene
 *      importato dinamicamente con il modulo neon sostituito da un mock
 *      che intercetta tutte le chiamate SQL. Verifica il comportamento
 *      a runtime: ordine operazioni, valori passati come parametri,
 *      logica di validazione, process.exit.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

// ── Lettura sorgente per analisi statica ─────────────────────────────────────

const SOURCE_PATH = resolve(
  __dirname,
  "../migrazione-storico-2026-flussi-2025.ts"
);
const SOURCE = readFileSync(SOURCE_PATH, "utf-8");

// ── Tipi helper ──────────────────────────────────────────────────────────────

interface SqlCall {
  raw: string;
}

// ── Mock di @neondatabase/serverless ─────────────────────────────────────────

let sqlCalls: SqlCall[] = [];

function buildMockSql() {
  const mockSql = vi.fn(
    (strings: TemplateStringsArray, ...values: unknown[]): Promise<unknown[]> => {
      let raw = "";
      strings.forEach((part, i) => {
        raw += part;
        if (i < values.length) raw += String(values[i]);
      });
      raw = raw.replace(/\s+/g, " ").trim();
      sqlCalls.push({ raw });

      // Risposta per SELECT count(*) AS cnt FROM storico
      if (/SELECT count\(\*\) AS cnt FROM storico/i.test(raw)) {
        return Promise.resolve([{ cnt: "27" }]);
      }

      // Risposta per SELECT count(*) AS cnt FROM flussi_capitale
      if (/SELECT count\(\*\) AS cnt FROM flussi_capitale/i.test(raw)) {
        return Promise.resolve([{ cnt: "7" }]);
      }

      // Risposta per SELECT * FROM flussi_capitale ORDER BY data
      if (/SELECT \* FROM flussi_capitale ORDER BY data/i.test(raw)) {
        return Promise.resolve([
          {
            data: new Date("2025-01-01"),
            tipo: "inizio",
            importo: "30600",
            valore_pre: "30600",
            capitale_post: "30600",
            nota: "Avvio portafoglio intermedio 2025",
          },
          {
            data: new Date("2025-04-30"),
            tipo: "deposito",
            importo: "500",
            valore_pre: "31899",
            capitale_post: "31100",
            nota: "Deposito fine aprile 2025",
          },
          {
            data: new Date("2025-07-31"),
            tipo: "deposito",
            importo: "500",
            valore_pre: "34582",
            capitale_post: "31600",
            nota: "Deposito fine luglio 2025",
          },
          {
            data: new Date("2025-11-30"),
            tipo: "deposito",
            importo: "9000",
            valore_pre: "38500",
            capitale_post: "40600",
            nota: "Deposito fine novembre 2025",
          },
          {
            data: new Date("2025-12-31"),
            tipo: "prelievo",
            importo: "20225",
            valore_pre: "51000",
            capitale_post: "30775",
            nota: "Chiusura anno 2025 — Azzerati profitti, mantenute solo perdite. Ripartenza 2026.",
          },
          {
            data: new Date("2026-01-02"),
            tipo: "inizio",
            importo: "30775",
            valore_pre: "30775",
            capitale_post: "30775",
            nota: "Capitale iniziale anno 2026",
          },
          {
            data: new Date("2026-03-24"),
            tipo: "prelievo",
            importo: "475",
            valore_pre: "30475",
            capitale_post: "30300",
            nota: "Ribilanciamento portafoglio",
          },
        ]);
      }

      // Tutte le altre query (INSERT, ecc.)
      return Promise.resolve([]);
    }
  );
  return mockSql;
}

let mockSqlInstance: ReturnType<typeof buildMockSql>;

vi.mock("@neondatabase/serverless", () => {
  return {
    neon: (_url: string) => {
      return (...args: Parameters<ReturnType<typeof buildMockSql>>) =>
        mockSqlInstance(...args);
    },
  };
});

async function runMigration(): Promise<void> {
  vi.resetModules();
  await import("../migrazione-storico-2026-flussi-2025.js");
  await new Promise((resolve) => setTimeout(resolve, 50));
}

// ── Setup / Teardown ─────────────────────────────────────────────────────────

describe("migrazione-storico-2026-flussi-2025", () => {
  const originalEnv = process.env.DATABASE_URL;
  const originalExit = process.exit;

  beforeEach(() => {
    sqlCalls = [];
    mockSqlInstance = buildMockSql();
    process.env.DATABASE_URL = "postgresql://mock:mock@mock/mock";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (process as any).exit = vi.fn();
  });

  afterEach(() => {
    process.env.DATABASE_URL = originalEnv;
    process.exit = originalExit;
    vi.resetModules();
  });

  // ── 1. Analisi statica: dati STORICO_2026 ────────────────────────────────

  describe("1. Dati STORICO_2026 nel sorgente (analisi statica)", () => {
    const storiciAttesi: Array<{ data: string; valore: number }> = [
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

    it("contiene esattamente 12 voci nell'array STORICO_2026", () => {
      // Conta le occorrenze di "data:" seguite da una data 2026-
      const matches = SOURCE.match(/data:\s*"2026-\d{2}-\d{2}"/g) ?? [];
      expect(matches.length).toBe(12);
    });

    for (const { data, valore } of storiciAttesi) {
      it(`contiene il punto storico ${data} con valore ${valore}`, () => {
        // Cerca la coppia data+valore vicine nel sorgente
        const pattern = new RegExp(
          `data:\\s*"${data}"[\\s\\S]{0,60}valore:\\s*${valore}|valore:\\s*${valore}[\\s\\S]{0,60}data:\\s*"${data}"`
        );
        expect(
          pattern.test(SOURCE),
          `Punto storico ${data}: ${valore} non trovato nel sorgente`
        ).toBe(true);
      });
    }
  });

  // ── 2. Analisi statica: dati FLUSSI_2025 ────────────────────────────────

  describe("2. Dati FLUSSI_2025 nel sorgente (analisi statica)", () => {
    it("contiene esattamente 5 voci nell'array FLUSSI_2025", () => {
      // Conta le occorrenze di "data:" seguite da una data 2025-
      const matches = SOURCE.match(/data:\s*"2025-\d{2}-\d{2}"/g) ?? [];
      expect(matches.length).toBe(5);
    });

    it("contiene il flusso inizio 2025-01-01 con importo 30600", () => {
      expect(SOURCE).toContain('"2025-01-01"');
      expect(SOURCE).toContain('"inizio"');
      // importo, valore_pre, capitale_post devono essere tutti 30600
      const pattern = /data:\s*"2025-01-01"[\s\S]{0,200}importo:\s*30600/;
      expect(pattern.test(SOURCE)).toBe(true);
    });

    it("flusso inizio 2025-01-01: valore_pre = 30600 e capitale_post = 30600", () => {
      const block = SOURCE.match(/data:\s*"2025-01-01"[\s\S]{0,300}/)?.[0] ?? "";
      expect(block).toMatch(/valore_pre:\s*30600/);
      expect(block).toMatch(/capitale_post:\s*30600/);
    });

    it("contiene il flusso deposito 2025-04-30 con importo 500", () => {
      expect(SOURCE).toContain('"2025-04-30"');
      const block = SOURCE.match(/data:\s*"2025-04-30"[\s\S]{0,300}/)?.[0] ?? "";
      expect(block).toMatch(/tipo:\s*"deposito"/);
      expect(block).toMatch(/importo:\s*500/);
    });

    it("flusso deposito 2025-04-30: valore_pre = 31899, capitale_post = 31100", () => {
      const block = SOURCE.match(/data:\s*"2025-04-30"[\s\S]{0,300}/)?.[0] ?? "";
      expect(block).toMatch(/valore_pre:\s*31899/);
      expect(block).toMatch(/capitale_post:\s*31100/);
    });

    it("contiene il flusso deposito 2025-07-31 con importo 500", () => {
      expect(SOURCE).toContain('"2025-07-31"');
      const block = SOURCE.match(/data:\s*"2025-07-31"[\s\S]{0,300}/)?.[0] ?? "";
      expect(block).toMatch(/tipo:\s*"deposito"/);
      expect(block).toMatch(/importo:\s*500/);
    });

    it("flusso deposito 2025-07-31: valore_pre = 34582, capitale_post = 31600", () => {
      const block = SOURCE.match(/data:\s*"2025-07-31"[\s\S]{0,300}/)?.[0] ?? "";
      expect(block).toMatch(/valore_pre:\s*34582/);
      expect(block).toMatch(/capitale_post:\s*31600/);
    });

    it("contiene il flusso deposito 2025-11-30 con importo 9000", () => {
      expect(SOURCE).toContain('"2025-11-30"');
      const block = SOURCE.match(/data:\s*"2025-11-30"[\s\S]{0,300}/)?.[0] ?? "";
      expect(block).toMatch(/tipo:\s*"deposito"/);
      expect(block).toMatch(/importo:\s*9000/);
    });

    it("flusso deposito 2025-11-30: valore_pre = 38500, capitale_post = 40600", () => {
      const block = SOURCE.match(/data:\s*"2025-11-30"[\s\S]{0,300}/)?.[0] ?? "";
      expect(block).toMatch(/valore_pre:\s*38500/);
      expect(block).toMatch(/capitale_post:\s*40600/);
    });

    it("contiene il flusso prelievo 2025-12-31 con importo 20225", () => {
      expect(SOURCE).toContain('"2025-12-31"');
      const block = SOURCE.match(/data:\s*"2025-12-31"[\s\S]{0,300}/)?.[0] ?? "";
      expect(block).toMatch(/tipo:\s*"prelievo"/);
      expect(block).toMatch(/importo:\s*20225/);
    });

    it("flusso prelievo 2025-12-31: valore_pre = 51000, capitale_post = 30775", () => {
      const block = SOURCE.match(/data:\s*"2025-12-31"[\s\S]{0,300}/)?.[0] ?? "";
      expect(block).toMatch(/valore_pre:\s*51000/);
      expect(block).toMatch(/capitale_post:\s*30775/);
    });
  });

  // ── 3. Analisi statica: pattern SQL critici ──────────────────────────────

  describe("3. Pattern SQL nel sorgente (analisi statica)", () => {
    it("usa ON CONFLICT (data) DO UPDATE SET valore = EXCLUDED.valore per lo storico", () => {
      expect(SOURCE).toMatch(
        /ON CONFLICT\s*\(\s*data\s*\)\s*DO UPDATE\s+SET\s+valore\s*=\s*EXCLUDED\.valore/i
      );
    });

    it("non usa una variabile hardcoded al posto di EXCLUDED.valore", () => {
      // La riga con DO UPDATE non deve contenere un numero ma EXCLUDED.valore
      const doUpdateLine = SOURCE.split("\n").find((l) =>
        /DO UPDATE\s+SET\s+valore/i.test(l)
      );
      expect(doUpdateLine).toBeDefined();
      expect(doUpdateLine!).not.toMatch(/=\s*\d+/);
      expect(doUpdateLine!).toMatch(/EXCLUDED\.valore/i);
    });

    it("inserisce nelle tabelle storico e flussi_capitale", () => {
      expect(SOURCE).toMatch(/INSERT INTO storico/i);
      expect(SOURCE).toMatch(/INSERT INTO flussi_capitale/i);
    });

    it("la query di verifica usa SELECT count\\(\\*\\) AS cnt FROM storico", () => {
      expect(SOURCE).toMatch(/SELECT count\(\*\) AS cnt FROM storico/i);
    });

    it("la query di verifica usa SELECT count\\(\\*\\) AS cnt FROM flussi_capitale", () => {
      expect(SOURCE).toMatch(/SELECT count\(\*\) AS cnt FROM flussi_capitale/i);
    });

    it("stampa tutti i flussi con SELECT * FROM flussi_capitale ORDER BY data", () => {
      expect(SOURCE).toMatch(/SELECT \* FROM flussi_capitale ORDER BY data/i);
    });
  });

  // ── 4. Analisi statica: connessione DB e guard ───────────────────────────

  describe("4. Connessione DB e guard DATABASE_URL (analisi statica)", () => {
    it("importa neon da @neondatabase/serverless", () => {
      expect(SOURCE).toMatch(/from\s+["']@neondatabase\/serverless["']/);
    });

    it("usa process.env.DATABASE_URL per la connessione", () => {
      expect(SOURCE).toContain("process.env.DATABASE_URL");
    });

    it("chiama neon(DATABASE_URL) per creare il client SQL", () => {
      expect(SOURCE).toMatch(/neon\s*\(\s*DATABASE_URL\s*\)/);
    });

    it("ha un check esplicito per DATABASE_URL mancante prima di usarla", () => {
      // Deve esserci un if che controlla DATABASE_URL (falsy check o typeof check)
      expect(SOURCE).toMatch(/if\s*\(\s*!DATABASE_URL\s*\)/);
    });

    it("chiama process.exit(1) quando DATABASE_URL non e' definita", () => {
      // La riga del process.exit(1) deve essere nel blocco del check DATABASE_URL
      const checkBlock = SOURCE.match(/if\s*\(\s*!DATABASE_URL\s*\)[\s\S]{0,200}process\.exit\(1\)/);
      expect(checkBlock).toBeTruthy();
    });
  });

  // ── 5. Analisi statica: logica di validazione finale ─────────────────────

  describe("5. Logica di validazione finale (analisi statica)", () => {
    it("verifica che count storico >= 25", () => {
      expect(SOURCE).toMatch(/>=\s*25/);
    });

    it("verifica che count flussi === 7", () => {
      expect(SOURCE).toMatch(/===\s*7/);
    });

    it("chiama process.exit con 0 su successo (letterale o ternario)", () => {
      // Lo script puo' usare process.exit(0) direttamente oppure
      // un ternario come process.exit(ok ? 0 : 1).
      // Entrambe le forme sono accettabili: verifichiamo che `0` compaia
      // come argomento di process.exit in qualsiasi forma.
      expect(SOURCE).toMatch(/process\.exit\([^)]*\b0\b[^)]*\)/);
    });

    it("chiama process.exit(1) su errore o conteggi errati", () => {
      // Deve esserci almeno 2 occorrenze di process.exit(1): una per DATABASE_URL, una per errore
      const exitOneMatches = SOURCE.match(/process\.exit\(1\)/g) ?? [];
      expect(exitOneMatches.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ── 6. Test di esecuzione con mock: INSERT storico ───────────────────────

  describe("6. Esecuzione con mock: inserimento storico", () => {
    it("esegue esattamente 12 INSERT INTO storico", async () => {
      await runMigration();
      const storicoInserts = sqlCalls.filter((c) => /INSERT INTO storico/i.test(c.raw));
      expect(storicoInserts.length).toBe(12);
    });

    it("ogni INSERT storico usa ON CONFLICT DO UPDATE SET valore = EXCLUDED.valore", async () => {
      await runMigration();
      const storicoInserts = sqlCalls.filter((c) => /INSERT INTO storico/i.test(c.raw));
      for (const call of storicoInserts) {
        expect(call.raw).toMatch(/ON CONFLICT.*DO UPDATE.*EXCLUDED\.valore/i);
      }
    });

    it("inserisce il punto 2026-01-07 con valore 30900", async () => {
      await runMigration();
      const call = sqlCalls.find(
        (c) => /INSERT INTO storico/i.test(c.raw) && c.raw.includes("2026-01-07")
      );
      expect(call, "INSERT storico 2026-01-07 non trovato").toBeDefined();
      expect(call!.raw).toContain("30900");
    });

    it("inserisce il punto 2026-02-06 con valore 35735", async () => {
      await runMigration();
      const call = sqlCalls.find(
        (c) => /INSERT INTO storico/i.test(c.raw) && c.raw.includes("2026-02-06")
      );
      expect(call, "INSERT storico 2026-02-06 non trovato").toBeDefined();
      expect(call!.raw).toContain("35735");
    });

    it("inserisce il punto 2026-03-25 con valore 30016", async () => {
      await runMigration();
      const call = sqlCalls.find(
        (c) => /INSERT INTO storico/i.test(c.raw) && c.raw.includes("2026-03-25")
      );
      expect(call, "INSERT storico 2026-03-25 non trovato").toBeDefined();
      expect(call!.raw).toContain("30016");
    });
  });

  // ── 7. Test di esecuzione con mock: INSERT flussi ────────────────────────

  describe("7. Esecuzione con mock: inserimento flussi 2025", () => {
    it("esegue esattamente 5 INSERT INTO flussi_capitale", async () => {
      await runMigration();
      const flussiInserts = sqlCalls.filter((c) => /INSERT INTO flussi_capitale/i.test(c.raw));
      expect(flussiInserts.length).toBe(5);
    });

    it("inserisce il flusso inizio 2025-01-01 con importo 30600", async () => {
      await runMigration();
      const call = sqlCalls.find(
        (c) => /INSERT INTO flussi_capitale/i.test(c.raw) && c.raw.includes("2025-01-01")
      );
      expect(call, "INSERT flusso 2025-01-01 non trovato").toBeDefined();
      expect(call!.raw).toContain("inizio");
      expect(call!.raw).toContain("30600");
    });

    it("inserisce il flusso deposito 2025-04-30 con importo 500 e valore_pre 31899", async () => {
      await runMigration();
      const call = sqlCalls.find(
        (c) => /INSERT INTO flussi_capitale/i.test(c.raw) && c.raw.includes("2025-04-30")
      );
      expect(call, "INSERT flusso 2025-04-30 non trovato").toBeDefined();
      expect(call!.raw).toContain("deposito");
      expect(call!.raw).toContain("500");
      expect(call!.raw).toContain("31899");
    });

    it("inserisce il flusso deposito 2025-07-31 con valore_pre 34582 e capitale_post 31600", async () => {
      await runMigration();
      const call = sqlCalls.find(
        (c) => /INSERT INTO flussi_capitale/i.test(c.raw) && c.raw.includes("2025-07-31")
      );
      expect(call, "INSERT flusso 2025-07-31 non trovato").toBeDefined();
      expect(call!.raw).toContain("34582");
      expect(call!.raw).toContain("31600");
    });

    it("inserisce il flusso deposito 2025-11-30 con importo 9000 e capitale_post 40600", async () => {
      await runMigration();
      const call = sqlCalls.find(
        (c) => /INSERT INTO flussi_capitale/i.test(c.raw) && c.raw.includes("2025-11-30")
      );
      expect(call, "INSERT flusso 2025-11-30 non trovato").toBeDefined();
      expect(call!.raw).toContain("9000");
      expect(call!.raw).toContain("40600");
    });

    it("inserisce il flusso prelievo 2025-12-31 con importo 20225 e capitale_post 30775", async () => {
      await runMigration();
      const call = sqlCalls.find(
        (c) => /INSERT INTO flussi_capitale/i.test(c.raw) && c.raw.includes("2025-12-31")
      );
      expect(call, "INSERT flusso 2025-12-31 non trovato").toBeDefined();
      expect(call!.raw).toContain("prelievo");
      expect(call!.raw).toContain("20225");
      expect(call!.raw).toContain("30775");
    });
  });

  // ── 8. Test di esecuzione con mock: query verifica ───────────────────────

  describe("8. Esecuzione con mock: query di verifica", () => {
    it("esegue SELECT count(*) AS cnt FROM storico", async () => {
      await runMigration();
      const q = sqlCalls.find((c) => /SELECT count\(\*\) AS cnt FROM storico/i.test(c.raw));
      expect(q, "Query count storico non trovata").toBeDefined();
    });

    it("esegue SELECT count(*) AS cnt FROM flussi_capitale", async () => {
      await runMigration();
      const q = sqlCalls.find((c) => /SELECT count\(\*\) AS cnt FROM flussi_capitale/i.test(c.raw));
      expect(q, "Query count flussi non trovata").toBeDefined();
    });

    it("esegue SELECT * FROM flussi_capitale ORDER BY data ASC", async () => {
      await runMigration();
      const q = sqlCalls.find(
        (c) =>
          /SELECT \* FROM flussi_capitale/i.test(c.raw) &&
          /ORDER BY data/i.test(c.raw)
      );
      expect(q, "Query stampa flussi non trovata").toBeDefined();
    });
  });

  // ── 9. Test di esecuzione con mock: ordine operazioni ───────────────────

  describe("9. Ordine delle operazioni", () => {
    it("esegue prima tutti i 12 INSERT storico, poi tutti i 5 INSERT flussi", async () => {
      await runMigration();
      const lastStoricoIdx = sqlCalls.reduce(
        (last, c, i) => (/INSERT INTO storico/i.test(c.raw) ? i : last),
        -1
      );
      const firstFlussiIdx = sqlCalls.findIndex((c) =>
        /INSERT INTO flussi_capitale/i.test(c.raw)
      );
      expect(lastStoricoIdx, "Nessun INSERT storico trovato").toBeGreaterThanOrEqual(0);
      expect(firstFlussiIdx, "Nessun INSERT flussi trovato").toBeGreaterThanOrEqual(0);
      expect(lastStoricoIdx).toBeLessThan(firstFlussiIdx);
    });

    it("esegue le query di verifica count dopo tutti gli INSERT", async () => {
      await runMigration();
      const lastInsertIdx = sqlCalls.reduce(
        (last, c, i) =>
          /INSERT INTO (storico|flussi_capitale)/i.test(c.raw) ? i : last,
        -1
      );
      const firstCountIdx = sqlCalls.findIndex((c) =>
        /SELECT count\(\*\)/i.test(c.raw)
      );
      expect(lastInsertIdx).toBeGreaterThanOrEqual(0);
      expect(firstCountIdx).toBeGreaterThanOrEqual(0);
      expect(firstCountIdx).toBeGreaterThan(lastInsertIdx);
    });

    it("esegue la SELECT * FROM flussi_capitale dopo i count", async () => {
      await runMigration();
      const lastCountIdx = sqlCalls.reduce(
        (last, c, i) => (/SELECT count\(\*\)/i.test(c.raw) ? i : last),
        -1
      );
      const selectFlussiIdx = sqlCalls.findIndex(
        (c) =>
          /SELECT \* FROM flussi_capitale/i.test(c.raw) &&
          /ORDER BY data/i.test(c.raw)
      );
      expect(lastCountIdx).toBeGreaterThanOrEqual(0);
      expect(selectFlussiIdx).toBeGreaterThanOrEqual(0);
      expect(selectFlussiIdx).toBeGreaterThan(lastCountIdx);
    });
  });

  // ── 10. Test di esecuzione con mock: process.exit ────────────────────────

  describe("10. process.exit", () => {
    it("chiama process.exit(0) quando count storico >= 25 e count flussi === 7", async () => {
      // Il mock restituisce cnt=27 per storico e cnt=7 per flussi
      await runMigration();
      expect(process.exit).toHaveBeenCalledWith(0);
    });

    it("chiama process.exit(1) quando DATABASE_URL non e' definita", async () => {
      vi.resetModules();
      process.env.DATABASE_URL = "";
      await import("../migrazione-storico-2026-flussi-2025.js");
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it("chiama process.exit(1) quando count storico < 25", async () => {
      // Sostituisce il mock con uno che restituisce cnt=10 per storico
      sqlCalls = [];
      mockSqlInstance = vi.fn(
        (strings: TemplateStringsArray, ...values: unknown[]): Promise<unknown[]> => {
          let raw = "";
          strings.forEach((part, i) => {
            raw += part;
            if (i < values.length) raw += String(values[i]);
          });
          raw = raw.replace(/\s+/g, " ").trim();
          sqlCalls.push({ raw });

          if (/SELECT count\(\*\) AS cnt FROM storico/i.test(raw)) {
            return Promise.resolve([{ cnt: "10" }]); // < 25: deve fallire
          }
          if (/SELECT count\(\*\) AS cnt FROM flussi_capitale/i.test(raw)) {
            return Promise.resolve([{ cnt: "7" }]);
          }
          if (/SELECT \* FROM flussi_capitale ORDER BY data/i.test(raw)) {
            return Promise.resolve([]);
          }
          return Promise.resolve([]);
        }
      );

      vi.resetModules();
      await import("../migrazione-storico-2026-flussi-2025.js");
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(process.exit).toHaveBeenCalledWith(1);
    });

    it("chiama process.exit(1) quando count flussi !== 7", async () => {
      // Mock con cnt=5 per flussi (non uguale a 7)
      sqlCalls = [];
      mockSqlInstance = vi.fn(
        (strings: TemplateStringsArray, ...values: unknown[]): Promise<unknown[]> => {
          let raw = "";
          strings.forEach((part, i) => {
            raw += part;
            if (i < values.length) raw += String(values[i]);
          });
          raw = raw.replace(/\s+/g, " ").trim();
          sqlCalls.push({ raw });

          if (/SELECT count\(\*\) AS cnt FROM storico/i.test(raw)) {
            return Promise.resolve([{ cnt: "27" }]);
          }
          if (/SELECT count\(\*\) AS cnt FROM flussi_capitale/i.test(raw)) {
            return Promise.resolve([{ cnt: "5" }]); // !== 7: deve fallire
          }
          if (/SELECT \* FROM flussi_capitale ORDER BY data/i.test(raw)) {
            return Promise.resolve([]);
          }
          return Promise.resolve([]);
        }
      );

      vi.resetModules();
      await import("../migrazione-storico-2026-flussi-2025.js");
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });
});
