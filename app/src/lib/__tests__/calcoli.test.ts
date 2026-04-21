/**
 * Tests for app/src/lib/calcoli.ts
 *
 * Covers:
 * 1. calcolaTitoloConPrezzoLive — costo override, live price recalc, null fallback with fix, edge cases, real portfolio cases
 * 2. ricalcolaCategoriaConTitoli — totals aggregation, peso % recalc, empty titoli
 * 3. ricalcolaPortafoglioConTitoli — portfolio totals, varPercentuale, category peso %
 */

import { describe, it, expect } from "vitest";
import {
  calcolaTitoloConPrezzoLive,
  ricalcolaCategoriaConTitoli,
  ricalcolaPortafoglioConTitoli,
} from "@/lib/calcoli";
import type { Titolo, Categoria, Portafoglio } from "@/types/portafoglio";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeTitolo(overrides: Partial<Titolo> = {}): Titolo {
  return {
    ticker: "EOG",
    nome: "EOG Resources Inc",
    categoria: "commodities",
    numAzioni: 2.5,
    prezzoMedioCarico: 115,
    costo: 287.5, // 2.5 * 115
    valoreAttuale: 356,
    pesoPercentuale: 8.45,
    varPrezzo: 27.4,
    dividendi: 0,
    profittoOPerdita: 68.5,
    plPercentuale: 23.83,
    peRatio: 15.63,
    isin: "US26875P1012",
    assetClass: "azione",
    paese: "USA",
    settore: "energia",
    ...overrides,
  };
}

function makeCategoria(overrides: Partial<Categoria> = {}): Categoria {
  return {
    id: "cat-1",
    nome: "Commodities",
    slug: "commodities",
    pesoPercentuale: 13.93,
    costo: 500,
    valoreAttuale: 600,
    profittoOPerdita: 100,
    plPercentuale: 20,
    dividendi: 5,
    ...overrides,
  };
}

function makePortafoglio(overrides: Partial<Portafoglio> = {}): Portafoglio {
  return {
    investimentoIniziale: 30775,
    valoreAttuale: 30275,
    utileRealizzato: 65,
    profittoOPerdita: -500,
    varPercentuale: -1.62,
    liquidita: 15000,
    notaLiquidita: "Investiti short term con rendimento del 4%",
    valuta: "USD",
    dataInizio: "2026-01-02",
    dataAggiornamento: "2026-03-25",
    ...overrides,
  };
}

// ─── 1. calcolaTitoloConPrezzoLive ─────────────────────────────────────────────

describe("calcolaTitoloConPrezzoLive", () => {
  // ── 1a. Con prezzo live ──────────────────────────────────────────────────────

  describe("con prezzo live", () => {
    it("costo viene SEMPRE ricalcolato come numAzioni * prezzoMedioCarico (sovrascrive DB errato)", () => {
      const titolo = makeTitolo({
        numAzioni: 10,
        prezzoMedioCarico: 100,
        costo: 500, // DB errato
      });
      const result = calcolaTitoloConPrezzoLive(titolo, 110);
      expect(result.costo).toBe(1000); // 10 * 100, NON il 500 del DB
    });

    it("valoreAttuale = numAzioni * prezzoLive", () => {
      const titolo = makeTitolo({ numAzioni: 2.5, prezzoMedioCarico: 115 });
      const result = calcolaTitoloConPrezzoLive(titolo, 140);
      expect(result.valoreAttuale).toBeCloseTo(350, 5); // 2.5 * 140
    });

    it("profittoOPerdita = valoreAttuale - costoTotale (usa costo ricalcolato)", () => {
      const titolo = makeTitolo({
        numAzioni: 4,
        prezzoMedioCarico: 50,
        costo: 100, // DB errato
      });
      const result = calcolaTitoloConPrezzoLive(titolo, 60);
      // costoTotale = 4 * 50 = 200, valoreAttuale = 4 * 60 = 240, P&L = 40
      expect(result.profittoOPerdita).toBe(40);
    });

    it("plPercentuale = (P&L / costoTotale) * 100", () => {
      const titolo = makeTitolo({ numAzioni: 4, prezzoMedioCarico: 50 });
      const result = calcolaTitoloConPrezzoLive(titolo, 60);
      // P&L = 40, costo = 200 -> 20%
      expect(result.plPercentuale).toBeCloseTo(20, 2);
    });

    it("varPrezzo = prezzoLive - prezzoMedioCarico", () => {
      const titolo = makeTitolo({ prezzoMedioCarico: 115 });
      const result = calcolaTitoloConPrezzoLive(titolo, 140);
      expect(result.varPrezzo).toBeCloseTo(25, 5); // 140 - 115
    });

    it("gestisce P&L negativo correttamente", () => {
      const titolo = makeTitolo({ numAzioni: 10, prezzoMedioCarico: 100 });
      const result = calcolaTitoloConPrezzoLive(titolo, 90);
      // costo = 1000, valore = 900, P&L = -100, P&L% = -10%
      expect(result.costo).toBe(1000);
      expect(result.valoreAttuale).toBe(900);
      expect(result.profittoOPerdita).toBe(-100);
      expect(result.plPercentuale).toBeCloseTo(-10, 2);
      expect(result.varPrezzo).toBeCloseTo(-10, 2);
    });

    it("preserva i campi non ricalcolati (ticker, nome, dividendi, ecc.)", () => {
      const titolo = makeTitolo({
        ticker: "ABC",
        nome: "Abc Inc",
        dividendi: 12.5,
        peRatio: 18,
        isin: "US1234567890",
        assetClass: "etf",
        paese: "Canada",
        settore: "finanza",
        pesoPercentuale: 5.5,
      });
      const result = calcolaTitoloConPrezzoLive(titolo, 140);
      expect(result.ticker).toBe("ABC");
      expect(result.nome).toBe("Abc Inc");
      expect(result.dividendi).toBe(12.5);
      expect(result.peRatio).toBe(18);
      expect(result.isin).toBe("US1234567890");
      expect(result.assetClass).toBe("etf");
      expect(result.paese).toBe("Canada");
      expect(result.settore).toBe("finanza");
      expect(result.pesoPercentuale).toBe(5.5);
    });
  });

  // ── 1b. Senza prezzo live (null) ─────────────────────────────────────────────

  describe("senza prezzo live (null)", () => {
    it("ricalcola costo = numAzioni * prezzoMedioCarico anche senza prezzo live", () => {
      const titolo = makeTitolo({
        numAzioni: 10,
        prezzoMedioCarico: 100,
        costo: 500, // DB errato
        valoreAttuale: 1050,
      });
      const result = calcolaTitoloConPrezzoLive(titolo, null);
      expect(result.costo).toBe(1000); // corretto a 10 * 100
    });

    it("ricalcola P&L usando il costo corretto e il valoreAttuale originale", () => {
      const titolo = makeTitolo({
        numAzioni: 10,
        prezzoMedioCarico: 100,
        costo: 500, // DB errato
        valoreAttuale: 1050,
        profittoOPerdita: 550, // DB errato (basato su costo=500)
      });
      const result = calcolaTitoloConPrezzoLive(titolo, null);
      // P&L = 1050 - 1000 = 50
      expect(result.profittoOPerdita).toBe(50);
      expect(result.plPercentuale).toBeCloseTo(5, 2);
    });

    it("NON modifica il valoreAttuale quando prezzoLive e' null", () => {
      const titolo = makeTitolo({ valoreAttuale: 999 });
      const result = calcolaTitoloConPrezzoLive(titolo, null);
      expect(result.valoreAttuale).toBe(999);
    });

    it("NON modifica varPrezzo quando prezzoLive e' null (resta il valore originale)", () => {
      const titolo = makeTitolo({ varPrezzo: 42 });
      const result = calcolaTitoloConPrezzoLive(titolo, null);
      expect(result.varPrezzo).toBe(42);
    });

    it("restituisce un nuovo oggetto (non la stessa reference)", () => {
      const titolo = makeTitolo();
      const result = calcolaTitoloConPrezzoLive(titolo, null);
      // La funzione ora fa spread {...titolo, ...}, quindi e' un nuovo oggetto
      expect(result).not.toBe(titolo);
    });

    it("quando costo DB e' corretto, P&L non cambia", () => {
      const titolo = makeTitolo({
        numAzioni: 5,
        prezzoMedioCarico: 100,
        costo: 500, // corretto: 5 * 100
        valoreAttuale: 550,
        profittoOPerdita: 50,
        plPercentuale: 10,
      });
      const result = calcolaTitoloConPrezzoLive(titolo, null);
      expect(result.costo).toBe(500);
      expect(result.profittoOPerdita).toBe(50);
      expect(result.plPercentuale).toBeCloseTo(10, 2);
    });
  });

  // ── 1c. Edge cases ───────────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("numAzioni = 0 con prezzoLive -> costo=0, valore=0, P&L=0, P&L%=0", () => {
      const titolo = makeTitolo({ numAzioni: 0, prezzoMedioCarico: 100 });
      const result = calcolaTitoloConPrezzoLive(titolo, 110);
      expect(result.costo).toBe(0);
      expect(result.valoreAttuale).toBe(0);
      expect(result.profittoOPerdita).toBe(0);
      expect(result.plPercentuale).toBe(0); // guard: costoTotale = 0
    });

    it("prezzoMedioCarico = 0 -> costo=0, P&L% = 0 (no division by zero)", () => {
      const titolo = makeTitolo({ numAzioni: 5, prezzoMedioCarico: 0 });
      const result = calcolaTitoloConPrezzoLive(titolo, 50);
      expect(result.costo).toBe(0);
      expect(result.valoreAttuale).toBe(250);
      expect(result.profittoOPerdita).toBe(250);
      expect(result.plPercentuale).toBe(0); // guard: costoTotale = 0
    });

    it("prezzo live = prezzoMedioCarico -> P&L = 0, P&L% = 0, varPrezzo = 0", () => {
      const titolo = makeTitolo({ numAzioni: 8, prezzoMedioCarico: 75 });
      const result = calcolaTitoloConPrezzoLive(titolo, 75);
      expect(result.costo).toBe(600);
      expect(result.valoreAttuale).toBe(600);
      expect(result.profittoOPerdita).toBe(0);
      expect(result.plPercentuale).toBe(0);
      expect(result.varPrezzo).toBe(0);
    });

    it("numAzioni = 0 con prezzoLive null -> costo=0, P&L e P&L% basati su valoreAttuale DB", () => {
      const titolo = makeTitolo({
        numAzioni: 0,
        prezzoMedioCarico: 100,
        valoreAttuale: 0,
      });
      const result = calcolaTitoloConPrezzoLive(titolo, null);
      expect(result.costo).toBe(0);
      expect(result.profittoOPerdita).toBe(0);
      expect(result.plPercentuale).toBe(0);
    });

    it("numAzioni frazionario (2.5 azioni)", () => {
      const titolo = makeTitolo({ numAzioni: 2.5, prezzoMedioCarico: 40 });
      const result = calcolaTitoloConPrezzoLive(titolo, 48);
      // costo = 100, valore = 120, P&L = 20, P&L% = 20%
      expect(result.costo).toBe(100);
      expect(result.valoreAttuale).toBe(120);
      expect(result.profittoOPerdita).toBe(20);
      expect(result.plPercentuale).toBeCloseTo(20, 2);
    });

    it("prezzoLive = 0 (total loss scenario)", () => {
      const titolo = makeTitolo({ numAzioni: 5, prezzoMedioCarico: 100 });
      const result = calcolaTitoloConPrezzoLive(titolo, 0);
      expect(result.costo).toBe(500);
      expect(result.valoreAttuale).toBe(0);
      expect(result.profittoOPerdita).toBe(-500);
      expect(result.plPercentuale).toBeCloseTo(-100, 5);
    });

    it("numAzioni molto piccole (0.001)", () => {
      const titolo = makeTitolo({ numAzioni: 0.001, prezzoMedioCarico: 50000 });
      const result = calcolaTitoloConPrezzoLive(titolo, 55000);
      // costo = 50, valore = 55, P&L = 5
      expect(result.costo).toBeCloseTo(50, 5);
      expect(result.valoreAttuale).toBeCloseTo(55, 5);
      expect(result.profittoOPerdita).toBeCloseTo(5, 5);
    });
  });

  // ── 1d. Casi reali dal portafoglio ───────────────────────────────────────────

  describe("casi reali dal portafoglio", () => {
    it("GOOGL: numAzioni=3, carico=315, live=290.44 -> costo=945, valore=871.32, P&L=-73.68 (-7.80%)", () => {
      const googl = makeTitolo({
        ticker: "GOOGL",
        nome: "Alphabet Inc",
        numAzioni: 3,
        prezzoMedioCarico: 315,
        costo: 210, // DB errato
        valoreAttuale: 870, // DB vecchio
      });
      const result = calcolaTitoloConPrezzoLive(googl, 290.44);

      expect(result.costo).toBe(945); // 3 * 315
      expect(result.valoreAttuale).toBeCloseTo(871.32, 2); // 3 * 290.44
      expect(result.profittoOPerdita).toBeCloseTo(-73.68, 2); // 871.32 - 945
      expect(result.plPercentuale).toBeCloseTo(-7.7968, 1); // (-73.68 / 945) * 100
      expect(result.varPrezzo).toBeCloseTo(-24.56, 2); // 290.44 - 315
    });

    it("BIL: numAzioni=18, carico=91, live=91.59 -> costo=1638, valore=1648.62, P&L=+10.62 (+0.65%)", () => {
      const bil = makeTitolo({
        ticker: "BIL",
        nome: "SPDR Bloomberg 1-3 Month T-Bill ETF",
        numAzioni: 18,
        prezzoMedioCarico: 91,
        costo: 91, // DB errato (valore per-share)
        valoreAttuale: 1640,
        assetClass: "obbligazione",
      });
      const result = calcolaTitoloConPrezzoLive(bil, 91.59);

      expect(result.costo).toBe(1638); // 18 * 91
      expect(result.valoreAttuale).toBeCloseTo(1648.62, 2); // 18 * 91.59
      expect(result.profittoOPerdita).toBeCloseTo(10.62, 2); // 1648.62 - 1638
      expect(result.plPercentuale).toBeCloseTo(0.6484, 1); // (10.62 / 1638) * 100
      expect(result.varPrezzo).toBeCloseTo(0.59, 2); // 91.59 - 91
    });

    it("EOG: numAzioni=2.5, carico=115, live=142.4", () => {
      const eog = makeTitolo({
        ticker: "EOG",
        nome: "EOG Resources Inc",
        numAzioni: 2.5,
        prezzoMedioCarico: 115,
        costo: 143, // DB errato
        assetClass: "azione",
        settore: "energia",
      });
      const result = calcolaTitoloConPrezzoLive(eog, 142.4);

      expect(result.costo).toBe(287.5); // 2.5 * 115
      expect(result.valoreAttuale).toBeCloseTo(356, 2); // 2.5 * 142.4
      expect(result.profittoOPerdita).toBeCloseTo(68.5, 2); // 356 - 287.5
      expect(result.plPercentuale).toBeCloseTo(23.8261, 1); // (68.5 / 287.5) * 100
      expect(result.varPrezzo).toBeCloseTo(27.4, 2); // 142.4 - 115
    });

    it("Titolo con costo DB corretto: il ricalcolo non cambia i valori", () => {
      // Simula un titolo dove il DB aveva gia' il costo corretto
      const titolo = makeTitolo({
        ticker: "V",
        nome: "Visa Inc",
        numAzioni: 5,
        prezzoMedioCarico: 200,
        costo: 1000, // corretto: 5 * 200
        valoreAttuale: 1100,
        profittoOPerdita: 100,
        plPercentuale: 10,
      });
      const result = calcolaTitoloConPrezzoLive(titolo, 220);

      expect(result.costo).toBe(1000); // invariato: 5 * 200 = 1000
      expect(result.valoreAttuale).toBe(1100); // 5 * 220
      expect(result.profittoOPerdita).toBe(100); // 1100 - 1000
      expect(result.plPercentuale).toBeCloseTo(10, 2); // (100 / 1000) * 100
    });
  });
});

// ─── 2. ricalcolaCategoriaConTitoli ───────────────────────────────────────────

describe("ricalcolaCategoriaConTitoli", () => {
  // Happy path
  it("sums valoreAttuale across all titoli", () => {
    const cat = makeCategoria();
    const titoli = [
      makeTitolo({ valoreAttuale: 200, costo: 150, dividendi: 2 }),
      makeTitolo({ ticker: "XOM", valoreAttuale: 300, costo: 250, dividendi: 3 }),
    ];
    const { categoria } = ricalcolaCategoriaConTitoli(cat, titoli);
    expect(categoria.valoreAttuale).toBeCloseTo(500, 5);
  });

  it("sums costo across all titoli", () => {
    const cat = makeCategoria();
    const titoli = [
      makeTitolo({ costo: 150, valoreAttuale: 200, dividendi: 0 }),
      makeTitolo({ ticker: "XOM", costo: 250, valoreAttuale: 300, dividendi: 0 }),
    ];
    const { categoria } = ricalcolaCategoriaConTitoli(cat, titoli);
    expect(categoria.costo).toBeCloseTo(400, 5);
  });

  it("calculates profittoOPerdita as valoreAttuale - costo", () => {
    const cat = makeCategoria();
    const titoli = [
      makeTitolo({ costo: 150, valoreAttuale: 200, dividendi: 0 }),
      makeTitolo({ ticker: "XOM", costo: 250, valoreAttuale: 300, dividendi: 0 }),
    ];
    const { categoria } = ricalcolaCategoriaConTitoli(cat, titoli);
    expect(categoria.profittoOPerdita).toBeCloseTo(100, 5); // 500 - 400
  });

  it("calculates plPercentuale as (P&L / costo) * 100", () => {
    const cat = makeCategoria();
    const titoli = [
      makeTitolo({ costo: 400, valoreAttuale: 500, dividendi: 0 }),
    ];
    const { categoria } = ricalcolaCategoriaConTitoli(cat, titoli);
    expect(categoria.plPercentuale).toBeCloseTo(25, 5); // (100/400)*100
  });

  it("sums dividendi across all titoli", () => {
    const cat = makeCategoria();
    const titoli = [
      makeTitolo({ dividendi: 3.5, costo: 100, valoreAttuale: 110 }),
      makeTitolo({ ticker: "XOM", dividendi: 1.75, costo: 100, valoreAttuale: 110 }),
    ];
    const { categoria } = ricalcolaCategoriaConTitoli(cat, titoli);
    expect(categoria.dividendi).toBeCloseTo(5.25, 5);
  });

  it("preserves other categoria fields (id, nome, slug)", () => {
    const cat = makeCategoria({ id: "abc-123", nome: "Test Cat", slug: "test-cat" });
    const titoli = [makeTitolo({ costo: 100, valoreAttuale: 120, dividendi: 0 })];
    const { categoria } = ricalcolaCategoriaConTitoli(cat, titoli);
    expect(categoria.id).toBe("abc-123");
    expect(categoria.nome).toBe("Test Cat");
    expect(categoria.slug).toBe("test-cat");
  });

  // Peso percentuale recalculation on titoli
  it("recalculates each titolo pesoPercentuale relative to categoria valoreAttuale", () => {
    const cat = makeCategoria();
    const t1 = makeTitolo({ ticker: "A", valoreAttuale: 200, costo: 150, dividendi: 0 });
    const t2 = makeTitolo({ ticker: "B", valoreAttuale: 300, costo: 200, dividendi: 0 });
    const { titoli } = ricalcolaCategoriaConTitoli(cat, [t1, t2]);
    // total = 500; A = 40%, B = 60%
    expect(titoli[0].pesoPercentuale).toBeCloseTo(40, 5);
    expect(titoli[1].pesoPercentuale).toBeCloseTo(60, 5);
  });

  it("peso percentuali sum to ~100%", () => {
    const cat = makeCategoria();
    const titoli = [
      makeTitolo({ ticker: "A", valoreAttuale: 100, costo: 80, dividendi: 0 }),
      makeTitolo({ ticker: "B", valoreAttuale: 200, costo: 160, dividendi: 0 }),
      makeTitolo({ ticker: "C", valoreAttuale: 300, costo: 240, dividendi: 0 }),
    ];
    const { titoli: risultato } = ricalcolaCategoriaConTitoli(cat, titoli);
    const somma = risultato.reduce((s, t) => s + t.pesoPercentuale, 0);
    expect(somma).toBeCloseTo(100, 5);
  });

  it("returns same number of titoli as input", () => {
    const cat = makeCategoria();
    const titoli = [
      makeTitolo({ ticker: "A", valoreAttuale: 100, costo: 80, dividendi: 0 }),
      makeTitolo({ ticker: "B", valoreAttuale: 200, costo: 160, dividendi: 0 }),
    ];
    const { titoli: risultato } = ricalcolaCategoriaConTitoli(cat, titoli);
    expect(risultato.length).toBe(2);
  });

  // Edge case — empty titoli array
  it("handles empty titoli array: all totals are 0", () => {
    const cat = makeCategoria();
    const { categoria } = ricalcolaCategoriaConTitoli(cat, []);
    expect(categoria.valoreAttuale).toBe(0);
    expect(categoria.costo).toBe(0);
    expect(categoria.profittoOPerdita).toBe(0);
    expect(categoria.plPercentuale).toBe(0);
    expect(categoria.dividendi).toBe(0);
  });

  it("handles empty titoli array: returns empty titoli array", () => {
    const cat = makeCategoria();
    const { titoli } = ricalcolaCategoriaConTitoli(cat, []);
    expect(titoli).toEqual([]);
  });

  // Edge case — zero costo (avoid division by zero in plPercentuale)
  it("returns plPercentuale = 0 when total costo is 0", () => {
    const cat = makeCategoria();
    const titoli = [makeTitolo({ costo: 0, valoreAttuale: 100, dividendi: 0 })];
    const { categoria } = ricalcolaCategoriaConTitoli(cat, titoli);
    expect(categoria.plPercentuale).toBe(0);
  });

  // Edge case — single titolo gets 100% peso
  it("single titolo gets pesoPercentuale = 100%", () => {
    const cat = makeCategoria();
    const titoli = [makeTitolo({ valoreAttuale: 500, costo: 400, dividendi: 0 })];
    const { titoli: risultato } = ricalcolaCategoriaConTitoli(cat, titoli);
    expect(risultato[0].pesoPercentuale).toBeCloseTo(100, 5);
  });
});

// ─── 3. ricalcolaPortafoglioConTitoli ─────────────────────────────────────────

describe("ricalcolaPortafoglioConTitoli", () => {
  // Happy path
  it("sums valoreAttuale across all categories", () => {
    const port = makePortafoglio({ investimentoIniziale: 30000 });
    const categorie: Categoria[] = [
      makeCategoria({ id: "1", slug: "cat1", valoreAttuale: 12000, costo: 10000, profittoOPerdita: 2000, plPercentuale: 20, dividendi: 0 }),
      makeCategoria({ id: "2", slug: "cat2", valoreAttuale: 8000, costo: 7000, profittoOPerdita: 1000, plPercentuale: 14.3, dividendi: 0 }),
      makeCategoria({ id: "3", slug: "cat3", valoreAttuale: 10000, costo: 9000, profittoOPerdita: 1000, plPercentuale: 11.1, dividendi: 0 }),
    ];
    const result = ricalcolaPortafoglioConTitoli(port, categorie);
    expect(result.valoreAttuale).toBeCloseTo(30000, 5);
  });

  it("calculates profittoOPerdita as valoreAttuale - investimentoIniziale", () => {
    const port = makePortafoglio({ investimentoIniziale: 30000 });
    const categorie: Categoria[] = [
      makeCategoria({ id: "1", slug: "cat1", valoreAttuale: 31500, costo: 30000, profittoOPerdita: 1500, plPercentuale: 5, dividendi: 0 }),
    ];
    const result = ricalcolaPortafoglioConTitoli(port, categorie);
    expect(result.profittoOPerdita).toBeCloseTo(1500, 5); // 31500 - 30000
  });

  it("calculates varPercentuale as (P&L / investimentoIniziale) * 100", () => {
    const port = makePortafoglio({ investimentoIniziale: 30000 });
    const categorie: Categoria[] = [
      makeCategoria({ id: "1", slug: "cat1", valoreAttuale: 31500, costo: 30000, profittoOPerdita: 1500, plPercentuale: 5, dividendi: 0 }),
    ];
    const result = ricalcolaPortafoglioConTitoli(port, categorie);
    expect(result.varPercentuale).toBeCloseTo(5, 5); // 1500/30000*100
  });

  it("calculates negative varPercentuale correctly (loss scenario)", () => {
    const port = makePortafoglio({ investimentoIniziale: 30000 });
    const categorie: Categoria[] = [
      makeCategoria({ id: "1", slug: "cat1", valoreAttuale: 29400, costo: 30000, profittoOPerdita: -600, plPercentuale: -2, dividendi: 0 }),
    ];
    const result = ricalcolaPortafoglioConTitoli(port, categorie);
    expect(result.profittoOPerdita).toBeCloseTo(-600, 5);
    expect(result.varPercentuale).toBeCloseTo(-2, 5);
  });

  it("preserves other portafoglio fields (liquidita, valuta, date, utileRealizzato)", () => {
    const port = makePortafoglio({
      investimentoIniziale: 30000,
      liquidita: 15000,
      valuta: "USD",
      dataInizio: "2026-01-02",
      dataAggiornamento: "2026-03-25",
      utileRealizzato: 65,
    });
    const categorie: Categoria[] = [
      makeCategoria({ id: "1", slug: "c", valoreAttuale: 30000, costo: 30000, profittoOPerdita: 0, plPercentuale: 0, dividendi: 0 }),
    ];
    const result = ricalcolaPortafoglioConTitoli(port, categorie);
    expect(result.liquidita).toBe(15000);
    expect(result.valuta).toBe("USD");
    expect(result.dataInizio).toBe("2026-01-02");
    expect(result.dataAggiornamento).toBe("2026-03-25");
    expect(result.utileRealizzato).toBe(65);
  });

  // Category peso % recalculation (side effect on input array)
  it("recalculates pesoPercentuale for each category", () => {
    const port = makePortafoglio({ investimentoIniziale: 30000 });
    const cat1 = makeCategoria({ id: "1", slug: "c1", valoreAttuale: 10000, costo: 8000, profittoOPerdita: 2000, plPercentuale: 25, dividendi: 0 });
    const cat2 = makeCategoria({ id: "2", slug: "c2", valoreAttuale: 20000, costo: 16000, profittoOPerdita: 4000, plPercentuale: 25, dividendi: 0 });
    ricalcolaPortafoglioConTitoli(port, [cat1, cat2]);
    // total = 30000; cat1 = 33.33%, cat2 = 66.67%
    expect(cat1.pesoPercentuale).toBeCloseTo(33.333, 2);
    expect(cat2.pesoPercentuale).toBeCloseTo(66.667, 2);
  });

  it("category pesoPercentuali sum to ~100%", () => {
    const port = makePortafoglio({ investimentoIniziale: 30000 });
    const categorie: Categoria[] = [
      makeCategoria({ id: "1", slug: "c1", valoreAttuale: 9000, costo: 8000, profittoOPerdita: 1000, plPercentuale: 12.5, dividendi: 0 }),
      makeCategoria({ id: "2", slug: "c2", valoreAttuale: 8000, costo: 7000, profittoOPerdita: 1000, plPercentuale: 14.3, dividendi: 0 }),
      makeCategoria({ id: "3", slug: "c3", valoreAttuale: 7000, costo: 6000, profittoOPerdita: 1000, plPercentuale: 16.7, dividendi: 0 }),
      makeCategoria({ id: "4", slug: "c4", valoreAttuale: 6000, costo: 5000, profittoOPerdita: 1000, plPercentuale: 20, dividendi: 0 }),
    ];
    ricalcolaPortafoglioConTitoli(port, categorie);
    const somma = categorie.reduce((s, c) => s + c.pesoPercentuale, 0);
    expect(somma).toBeCloseTo(100, 5);
  });

  // Edge case — zero investimentoIniziale
  it("returns varPercentuale = 0 when investimentoIniziale is 0", () => {
    const port = makePortafoglio({ investimentoIniziale: 0 });
    const categorie: Categoria[] = [
      makeCategoria({ id: "1", slug: "c1", valoreAttuale: 5000, costo: 0, profittoOPerdita: 5000, plPercentuale: 0, dividendi: 0 }),
    ];
    const result = ricalcolaPortafoglioConTitoli(port, categorie);
    expect(result.varPercentuale).toBe(0);
  });

  // Edge case — no categories
  it("handles empty categories array: valoreAttuale = 0", () => {
    const port = makePortafoglio({ investimentoIniziale: 30000 });
    const result = ricalcolaPortafoglioConTitoli(port, []);
    expect(result.valoreAttuale).toBe(0);
    expect(result.profittoOPerdita).toBe(-30000);
    expect(result.varPercentuale).toBeCloseTo(-100, 5);
  });

  // Edge case — single category gets 100% peso
  it("single category gets pesoPercentuale = 100%", () => {
    const port = makePortafoglio({ investimentoIniziale: 30000 });
    const cat = makeCategoria({ id: "1", slug: "c1", valoreAttuale: 30000, costo: 28000, profittoOPerdita: 2000, plPercentuale: 7.14, dividendi: 0 });
    ricalcolaPortafoglioConTitoli(port, [cat]);
    expect(cat.pesoPercentuale).toBeCloseTo(100, 5);
  });
});
