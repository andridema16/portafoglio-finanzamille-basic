/**
 * Tests for Modifica 1 & 2:
 *   - src/lib/db.ts: nuova funzione getFlussiCapitaleDa(dataInizio)
 *   - src/app/(protected)/dashboard/page.tsx: import e utilizzo di getFlussiCapitaleDa
 *
 * Copertura:
 * 1. getFlussiCapitaleDa è esportata da db.ts
 * 2. getFlussiCapitale (senza parametro) esiste ancora ed è esportata
 * 3. getFlussiCapitaleDa accetta un parametro stringa e restituisce FlussoCapitale[]
 * 4. I risultati sono ordinati per data ASC
 * 5. La data di filtro funziona: nessun risultato antecedente a dataInizio
 * 6. Funziona con date al limite (oggi, data futura, data molto vecchia)
 * 7. La dashboard importa getFlussiCapitaleDa (NON getFlussiCapitale)
 * 8. La dashboard chiama getFlussiCapitaleDa con portafoglioDB.dataInizio
 * 9. Il Promise.all della dashboard NON contiene getFlussiCapitale
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

// ─── 1 & 2. VERIFICA EXPORT da db.ts ─────────────────────────────────────────

describe("db.ts — export verification", () => {
  it("getFlussiCapitaleDa è esportata da @/lib/db", async () => {
    const mod = await import("@/lib/db");
    expect(typeof (mod as Record<string, unknown>).getFlussiCapitaleDa).toBe("function");
  });

  it("getFlussiCapitale (senza parametro) è ancora esportata da @/lib/db", async () => {
    const mod = await import("@/lib/db");
    expect(typeof (mod as Record<string, unknown>).getFlussiCapitale).toBe("function");
  });
});

// ─── 3. getFlussiCapitaleDa — firma e tipo di ritorno ────────────────────────

describe("getFlussiCapitaleDa() — firma", () => {
  it("accetta un parametro stringa e restituisce una Promise", async () => {
    const { getFlussiCapitaleDa } = await import("@/lib/db");
    const result = getFlussiCapitaleDa("2026-01-01");
    // Deve restituire una Promise
    expect(result).toBeInstanceOf(Promise);
  });

  it("la Promise risolve in un array", async () => {
    const { getFlussiCapitaleDa } = await import("@/lib/db");
    const flussi = await getFlussiCapitaleDa("2026-01-01");
    expect(Array.isArray(flussi)).toBe(true);
  });
});

// ─── 4 & 5. getFlussiCapitaleDa — filtraggio e ordinamento ───────────────────

describe("getFlussiCapitaleDa() — filtraggio e ordinamento", () => {
  it("ogni FlussoCapitale ha i campi richiesti con tipi corretti", async () => {
    const { getFlussiCapitaleDa } = await import("@/lib/db");
    const flussi = await getFlussiCapitaleDa("2026-01-01");
    const tipiValidi = ["deposito", "prelievo", "inizio"] as const;
    for (const f of flussi) {
      expect(typeof f.id).toBe("number");
      expect(typeof f.data).toBe("string");
      expect(f.data).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(tipiValidi as readonly string[]).toContain(f.tipo);
      expect(typeof f.importo).toBe("number");
      expect(typeof f.valorePre).toBe("number");
      expect(typeof f.capitalePost).toBe("number");
      expect(typeof f.nota).toBe("string");
    }
  });

  it("nessun flusso è antecedente a dataInizio='2026-01-01'", async () => {
    const { getFlussiCapitaleDa } = await import("@/lib/db");
    const flussi = await getFlussiCapitaleDa("2026-01-01");
    for (const f of flussi) {
      expect(f.data >= "2026-01-01").toBe(true);
    }
  });

  it("i flussi sono ordinati per data ASC", async () => {
    const { getFlussiCapitaleDa } = await import("@/lib/db");
    const flussi = await getFlussiCapitaleDa("2026-01-01");
    for (let i = 0; i < flussi.length - 1; i++) {
      expect(flussi[i].data <= flussi[i + 1].data).toBe(true);
    }
  });

  it("getFlussiCapitaleDa con data futura restituisce array vuoto o solo flussi futuri", async () => {
    const { getFlussiCapitaleDa } = await import("@/lib/db");
    const flussi = await getFlussiCapitaleDa("2099-12-31");
    // Nessun flusso può essere >= 2099-12-31 nei dati reali
    expect(flussi.length).toBe(0);
  });

  it("getFlussiCapitaleDa con data molto vecchia restituisce tutti i flussi", async () => {
    const { getFlussiCapitaleDa } = await import("@/lib/db");
    const { getFlussiCapitale } = await import("@/lib/db");
    const tutti = await getFlussiCapitale();
    const daTuttiTempo = await getFlussiCapitaleDa("1900-01-01");
    expect(daTuttiTempo.length).toBe(tutti.length);
  });

  it("getFlussiCapitaleDa con dataInizio inclusa restituisce il flusso della stessa data", async () => {
    const { getFlussiCapitaleDa } = await import("@/lib/db");
    // Prima recuperiamo tutti i flussi per trovare una data valida
    const { getFlussiCapitale } = await import("@/lib/db");
    const tutti = await getFlussiCapitale();
    if (tutti.length === 0) return; // skip se DB vuoto

    const primaData = tutti[0].data; // data più vecchia (ordinati ASC)
    const flussiDaPrima = await getFlussiCapitaleDa(primaData);
    // Deve includere almeno il flusso di quella data
    expect(flussiDaPrima.some((f) => f.data === primaData)).toBe(true);
  });
});

// ─── 6. Confronto getFlussiCapitale vs getFlussiCapitaleDa ───────────────────

describe("getFlussiCapitale vs getFlussiCapitaleDa — coerenza", () => {
  it("getFlussiCapitaleDa('1900-01-01') e getFlussiCapitale() ritornano gli stessi elementi", async () => {
    const { getFlussiCapitale, getFlussiCapitaleDa } = await import("@/lib/db");
    const [tutti, daInizio] = await Promise.all([
      getFlussiCapitale(),
      getFlussiCapitaleDa("1900-01-01"),
    ]);
    expect(daInizio.length).toBe(tutti.length);
    // Stesso ordinamento ASC in entrambi
    for (let i = 0; i < tutti.length; i++) {
      expect(daInizio[i].id).toBe(tutti[i].id);
      expect(daInizio[i].data).toBe(tutti[i].data);
    }
  });
});

// ─── 7, 8 & 9. Analisi statica del file dashboard/page.tsx ───────────────────
// Non possiamo importare la dashboard Server Component direttamente nei test
// (dipende da Next.js runtime), quindi leggiamo il sorgente come testo.

const DASHBOARD_PATH = resolve(
  __dirname,
  "../../app/(protected)/dashboard/page.tsx"
);

describe("dashboard/page.tsx — analisi sorgente", () => {
  let source: string;

  it("il file dashboard esiste ed è leggibile", () => {
    source = readFileSync(DASHBOARD_PATH, "utf-8");
    expect(source.length).toBeGreaterThan(0);
  });

  it("importa getFlussiCapitaleDa (non getFlussiCapitale) da @/lib/db", () => {
    source = readFileSync(DASHBOARD_PATH, "utf-8");
    // Deve contenere getFlussiCapitaleDa nell'import
    expect(source).toContain("getFlussiCapitaleDa");
    // NON deve importare getFlussiCapitale (senza 'Da') nell'istruzione import
    const importLines = source
      .split("\n")
      .filter((l) => l.includes("import") && l.includes("@/lib/db"));
    const importBlock = importLines.join(" ");
    // Cerca il pattern import { ... } from "@/lib/db"
    // getFlussiCapitale deve apparire solo come parte di getFlussiCapitaleDa
    // quindi non deve comparire come parola standalone nell'import
    const hasBareGetFlussiCapitale = /\bgetFlussiCapitale\b(?!Da)/.test(importBlock);
    expect(hasBareGetFlussiCapitale).toBe(false);
  });

  it("chiama getFlussiCapitaleDa con portafoglioDB.dataInizio", () => {
    source = readFileSync(DASHBOARD_PATH, "utf-8");
    expect(source).toContain("getFlussiCapitaleDa(portafoglioDB.dataInizio)");
  });

  it("la chiamata a getFlussiCapitaleDa è DOPO il Promise.all (non dentro)", () => {
    source = readFileSync(DASHBOARD_PATH, "utf-8");
    const promiseAllIdx = source.indexOf("Promise.all(");
    const getFlussiIdx = source.indexOf("getFlussiCapitaleDa(portafoglioDB.dataInizio)");
    expect(promiseAllIdx).toBeGreaterThan(-1);
    expect(getFlussiIdx).toBeGreaterThan(-1);
    // getFlussiCapitaleDa deve apparire DOPO la chiusura del Promise.all
    expect(getFlussiIdx).toBeGreaterThan(promiseAllIdx);
  });

  it("il Promise.all NON contiene getFlussiCapitale o getFlussiCapitaleDa al suo interno", () => {
    source = readFileSync(DASHBOARD_PATH, "utf-8");
    // Estrai il blocco Promise.all([ ... ])
    const startIdx = source.indexOf("Promise.all([");
    expect(startIdx).toBeGreaterThan(-1);
    // Trova la chiusura del Promise.all contando le parentesi
    let depth = 0;
    let endIdx = -1;
    for (let i = startIdx; i < source.length; i++) {
      if (source[i] === "(") depth++;
      if (source[i] === ")") {
        depth--;
        if (depth === 0) {
          endIdx = i;
          break;
        }
      }
    }
    expect(endIdx).toBeGreaterThan(startIdx);
    const promiseAllBlock = source.slice(startIdx, endIdx + 1);
    // Il blocco Promise.all non deve contenere nessuna chiamata a flussi capitale
    expect(promiseAllBlock).not.toContain("getFlussiCapitale");
    expect(promiseAllBlock).not.toContain("getFlussiCapitaleDa");
  });

  it("assegna il risultato di getFlussiCapitaleDa a una variabile 'flussi'", () => {
    source = readFileSync(DASHBOARD_PATH, "utf-8");
    // Deve esserci un'assegnazione tipo: const flussi = await getFlussiCapitaleDa(...)
    expect(source).toMatch(/const flussi\s*=\s*await\s+getFlussiCapitaleDa\(/);
  });
});
