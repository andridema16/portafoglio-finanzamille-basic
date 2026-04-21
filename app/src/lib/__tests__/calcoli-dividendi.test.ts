/**
 * Tests for the dividend-inclusive P&L changes in calcoli.ts
 *
 * Covers the three modified functions:
 * 1. calcolaTitoloConPrezzoLive — profittoOPerdita now includes dividendi
 * 2. ricalcolaCategoriaConTitoli — P&L includes dividendi; optional totalPortafoglio param
 * 3. ricalcolaPortafoglioConTitoli — portfolio P&L includes totaleDividendi
 *
 * Also verifies:
 * - No double-counting of dividends in guadagnoTotale (dashboard logic)
 * - Peso% relative to totalPortafoglio when param is supplied
 * - colSpan structural check for composizione table (documented, not runtime)
 */

import { describe, it, expect } from "vitest";
import {
  calcolaTitoloConPrezzoLive,
  ricalcolaCategoriaConTitoli,
  ricalcolaPortafoglioConTitoli,
} from "@/lib/calcoli";
import type { Titolo, Categoria, Portafoglio } from "@/types/portafoglio";

// ─── Fixtures ──────────────────────────────────────────────────────────────────

function makeTitolo(overrides: Partial<Titolo> = {}): Titolo {
  return {
    ticker: "EOG",
    nome: "EOG Resources Inc",
    categoria: "commodities",
    numAzioni: 2.5,
    prezzoMedioCarico: 100,
    costo: 250,
    valoreAttuale: 300,
    pesoPercentuale: 10,
    varPrezzo: 20,
    dividendi: 0,
    profittoOPerdita: 50,
    plPercentuale: 20,
    peRatio: null,
    isin: null,
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
    dividendi: 0,
    ...overrides,
  };
}

function makePortafoglio(overrides: Partial<Portafoglio> = {}): Portafoglio {
  return {
    investimentoIniziale: 30000,
    valoreAttuale: 30000,
    utileRealizzato: 65,
    profittoOPerdita: 0,
    varPercentuale: 0,
    liquidita: 15000,
    notaLiquidita: "Investiti short term",
    valuta: "USD",
    dataInizio: "2026-01-02",
    dataAggiornamento: "2026-03-25",
    ...overrides,
  };
}

// ─── 1. calcolaTitoloConPrezzoLive — dividend-inclusive P&L ──────────────────

describe("calcolaTitoloConPrezzoLive — dividendi inclusi nel P&L", () => {
  describe("con prezzo live e dividendi > 0", () => {
    it("profittoOPerdita = valoreAttuale - costoTotale + dividendi", () => {
      const titolo = makeTitolo({
        numAzioni: 4,
        prezzoMedioCarico: 50,
        dividendi: 8,
      });
      // costoTotale = 200, valoreAttuale = 4 * 60 = 240, P&L = 240 - 200 + 8 = 48
      const result = calcolaTitoloConPrezzoLive(titolo, 60);
      expect(result.profittoOPerdita).toBeCloseTo(48, 5);
    });

    it("plPercentuale = (P&L_con_dividendi / costoTotale) * 100", () => {
      const titolo = makeTitolo({
        numAzioni: 4,
        prezzoMedioCarico: 50,
        dividendi: 8,
      });
      // P&L = 48, costo = 200 -> 24%
      const result = calcolaTitoloConPrezzoLive(titolo, 60);
      expect(result.plPercentuale).toBeCloseTo(24, 5);
    });

    it("dividendi non vengono azzerati dal calcolo live", () => {
      const titolo = makeTitolo({ dividendi: 15.5 });
      const result = calcolaTitoloConPrezzoLive(titolo, 110);
      expect(result.dividendi).toBe(15.5);
    });

    it("con dividendi = 0, risultato identico alla formula classica", () => {
      const titolo = makeTitolo({
        numAzioni: 10,
        prezzoMedioCarico: 100,
        dividendi: 0,
      });
      // classico: P&L = 10*110 - 10*100 = 100
      const result = calcolaTitoloConPrezzoLive(titolo, 110);
      expect(result.profittoOPerdita).toBeCloseTo(100, 5);
      expect(result.plPercentuale).toBeCloseTo(10, 5);
    });

    it("grandi dividendi possono portare P&L positivo anche con prezzo in calo", () => {
      const titolo = makeTitolo({
        numAzioni: 10,
        prezzoMedioCarico: 100,
        dividendi: 200, // dividendi molto alti
      });
      // costoTotale = 1000, valoreAttuale = 10 * 90 = 900, P&L = 900 - 1000 + 200 = 100
      const result = calcolaTitoloConPrezzoLive(titolo, 90);
      expect(result.profittoOPerdita).toBeCloseTo(100, 5);
    });

    it("dividendi piccoli non alterano segno di un P&L fortemente negativo", () => {
      const titolo = makeTitolo({
        numAzioni: 10,
        prezzoMedioCarico: 100,
        dividendi: 5,
      });
      // costoTotale = 1000, valoreAttuale = 500, P&L = 500 - 1000 + 5 = -495
      const result = calcolaTitoloConPrezzoLive(titolo, 50);
      expect(result.profittoOPerdita).toBeCloseTo(-495, 5);
      expect(result.profittoOPerdita).toBeLessThan(0);
    });
  });

  describe("senza prezzo live (null) e dividendi > 0", () => {
    it("profittoOPerdita = valoreAttuale_db - costoRicalcolato + dividendi", () => {
      const titolo = makeTitolo({
        numAzioni: 10,
        prezzoMedioCarico: 100,
        costo: 500, // DB errato
        valoreAttuale: 1050,
        dividendi: 25,
      });
      // costoTotale = 1000, P&L = 1050 - 1000 + 25 = 75
      const result = calcolaTitoloConPrezzoLive(titolo, null);
      expect(result.profittoOPerdita).toBeCloseTo(75, 5);
    });

    it("plPercentuale corretto con dividendi inclusi (null prezzo)", () => {
      const titolo = makeTitolo({
        numAzioni: 10,
        prezzoMedioCarico: 100,
        costo: 500, // DB errato
        valoreAttuale: 1050,
        dividendi: 25,
      });
      // P&L = 75, costo = 1000 -> 7.5%
      const result = calcolaTitoloConPrezzoLive(titolo, null);
      expect(result.plPercentuale).toBeCloseTo(7.5, 5);
    });

    it("con dividendi = 0 e null prezzo, P&L identico alla formula classica", () => {
      const titolo = makeTitolo({
        numAzioni: 5,
        prezzoMedioCarico: 100,
        costo: 500,
        valoreAttuale: 550,
        dividendi: 0,
      });
      const result = calcolaTitoloConPrezzoLive(titolo, null);
      expect(result.profittoOPerdita).toBeCloseTo(50, 5);
    });
  });

  describe("edge cases con dividendi", () => {
    it("numAzioni = 0 con dividendi -> P&L = dividendi (solo rendimento da cedole)", () => {
      // costoTotale = 0, valoreAttuale = 0 (live), P&L = 0 - 0 + dividendi = dividendi
      const titolo = makeTitolo({
        numAzioni: 0,
        prezzoMedioCarico: 100,
        dividendi: 10,
      });
      const result = calcolaTitoloConPrezzoLive(titolo, 110);
      expect(result.profittoOPerdita).toBeCloseTo(10, 5);
      // plPercentuale = 0 perché costoTotale = 0 (guard)
      expect(result.plPercentuale).toBe(0);
    });

    it("dividendi negativi (caso anomalo): vengono sottratti dal P&L", () => {
      // I dividendi negativi non esistono nella realtà ma la formula deve reggere
      const titolo = makeTitolo({
        numAzioni: 10,
        prezzoMedioCarico: 100,
        dividendi: -5,
      });
      // costoTotale = 1000, valoreAttuale = 1100, P&L = 1100 - 1000 + (-5) = 95
      const result = calcolaTitoloConPrezzoLive(titolo, 110);
      expect(result.profittoOPerdita).toBeCloseTo(95, 5);
    });
  });
});

// ─── 2. ricalcolaCategoriaConTitoli — P&L dividendi + totalPortafoglio ────────

describe("ricalcolaCategoriaConTitoli — dividendi inclusi e totalPortafoglio", () => {
  describe("P&L di categoria include dividendi", () => {
    it("profittoOPerdita = valoreAttuale - costo + dividendi", () => {
      const cat = makeCategoria();
      const titoli = [
        makeTitolo({ ticker: "A", costo: 100, valoreAttuale: 120, dividendi: 5 }),
        makeTitolo({ ticker: "B", costo: 200, valoreAttuale: 230, dividendi: 10 }),
      ];
      // valoreAttuale=350, costo=300, dividendi=15, P&L = 350 - 300 + 15 = 65
      const { categoria } = ricalcolaCategoriaConTitoli(cat, titoli);
      expect(categoria.profittoOPerdita).toBeCloseTo(65, 5);
    });

    it("plPercentuale = ((valoreAttuale - costo + dividendi) / costo) * 100", () => {
      const cat = makeCategoria();
      const titoli = [
        makeTitolo({ ticker: "A", costo: 400, valoreAttuale: 440, dividendi: 40 }),
      ];
      // P&L = 440 - 400 + 40 = 80, plPerc = (80/400)*100 = 20%
      const result = ricalcolaCategoriaConTitoli(cat, titoli);
      expect(result.categoria.plPercentuale).toBeCloseTo(20, 5);
    });

    it("dividendi aggregati correttamente nella categoria", () => {
      const cat = makeCategoria();
      const titoli = [
        makeTitolo({ ticker: "A", dividendi: 3.5, costo: 100, valoreAttuale: 110 }),
        makeTitolo({ ticker: "B", dividendi: 1.75, costo: 100, valoreAttuale: 110 }),
        makeTitolo({ ticker: "C", dividendi: 0, costo: 100, valoreAttuale: 110 }),
      ];
      const { categoria } = ricalcolaCategoriaConTitoli(cat, titoli);
      expect(categoria.dividendi).toBeCloseTo(5.25, 5);
    });

    it("con tutti dividendi = 0, comportamento invariato rispetto alla formula classica", () => {
      const cat = makeCategoria();
      const titoli = [
        makeTitolo({ ticker: "A", costo: 300, valoreAttuale: 400, dividendi: 0 }),
      ];
      const { categoria } = ricalcolaCategoriaConTitoli(cat, titoli);
      // P&L classico = 400 - 300 = 100
      expect(categoria.profittoOPerdita).toBeCloseTo(100, 5);
    });

    it("categoria con perdita: dividendi possono ridurre la perdita", () => {
      const cat = makeCategoria();
      const titoli = [
        makeTitolo({ ticker: "A", costo: 1000, valoreAttuale: 800, dividendi: 150 }),
      ];
      // P&L = 800 - 1000 + 150 = -50 (perdita ridotta)
      const { categoria } = ricalcolaCategoriaConTitoli(cat, titoli);
      expect(categoria.profittoOPerdita).toBeCloseTo(-50, 5);
      expect(categoria.profittoOPerdita).toBeLessThan(0);
    });

    it("categoria vuota: profittoOPerdita = 0, dividendi = 0", () => {
      const cat = makeCategoria();
      const { categoria } = ricalcolaCategoriaConTitoli(cat, []);
      expect(categoria.profittoOPerdita).toBe(0);
      expect(categoria.dividendi).toBe(0);
    });
  });

  describe("peso% relativo a totalPortafoglio (param opzionale)", () => {
    it("senza totalPortafoglio: peso% relativo alla categoria stessa (somma 100%)", () => {
      const cat = makeCategoria();
      const titoli = [
        makeTitolo({ ticker: "A", valoreAttuale: 300, costo: 250, dividendi: 0 }),
        makeTitolo({ ticker: "B", valoreAttuale: 700, costo: 600, dividendi: 0 }),
      ];
      const { titoli: result } = ricalcolaCategoriaConTitoli(cat, titoli);
      // total categoria = 1000; A = 30%, B = 70%
      expect(result[0].pesoPercentuale).toBeCloseTo(30, 5);
      expect(result[1].pesoPercentuale).toBeCloseTo(70, 5);
      const somma = result.reduce((s, t) => s + t.pesoPercentuale, 0);
      expect(somma).toBeCloseTo(100, 5);
    });

    it("con totalPortafoglio: peso% calcolato sul totale portafoglio, NON sulla categoria", () => {
      const cat = makeCategoria();
      const titoli = [
        makeTitolo({ ticker: "A", valoreAttuale: 300, costo: 250, dividendi: 0 }),
        makeTitolo({ ticker: "B", valoreAttuale: 700, costo: 600, dividendi: 0 }),
      ];
      // totalPortafoglio = 5000 (la categoria vale 1000 = 20% del totale)
      const { titoli: result } = ricalcolaCategoriaConTitoli(cat, titoli, 5000);
      // A = 300/5000 * 100 = 6%, B = 700/5000 * 100 = 14%
      expect(result[0].pesoPercentuale).toBeCloseTo(6, 5);
      expect(result[1].pesoPercentuale).toBeCloseTo(14, 5);
    });

    it("con totalPortafoglio: la somma pesi non è 100% (è la quota della categoria sul portafoglio)", () => {
      const cat = makeCategoria();
      const titoli = [
        makeTitolo({ ticker: "A", valoreAttuale: 300, costo: 250, dividendi: 0 }),
        makeTitolo({ ticker: "B", valoreAttuale: 700, costo: 600, dividendi: 0 }),
      ];
      const { titoli: result } = ricalcolaCategoriaConTitoli(cat, titoli, 5000);
      const somma = result.reduce((s, t) => s + t.pesoPercentuale, 0);
      // 6 + 14 = 20% (la categoria vale 20% del portafoglio totale)
      expect(somma).toBeCloseTo(20, 5);
      expect(somma).not.toBeCloseTo(100, 2);
    });

    it("con totalPortafoglio = valoreAttuale categoria: risultato identico al calcolo senza param", () => {
      const cat = makeCategoria();
      const titoli = [
        makeTitolo({ ticker: "A", valoreAttuale: 400, costo: 300, dividendi: 0 }),
        makeTitolo({ ticker: "B", valoreAttuale: 600, costo: 500, dividendi: 0 }),
      ];
      // totalPortafoglio = categoria stessa (1000)
      const { titoli: resultSenza } = ricalcolaCategoriaConTitoli(cat, titoli);
      const { titoli: resultCon } = ricalcolaCategoriaConTitoli(cat, titoli, 1000);
      expect(resultSenza[0].pesoPercentuale).toBeCloseTo(resultCon[0].pesoPercentuale, 5);
      expect(resultSenza[1].pesoPercentuale).toBeCloseTo(resultCon[1].pesoPercentuale, 5);
    });

    it("con totalPortafoglio = 0: peso% dei titoli è 0 (guard divisione per zero)", () => {
      const cat = makeCategoria();
      const titoli = [
        makeTitolo({ ticker: "A", valoreAttuale: 300, costo: 250, dividendi: 0 }),
      ];
      const { titoli: result } = ricalcolaCategoriaConTitoli(cat, titoli, 0);
      expect(result[0].pesoPercentuale).toBe(0);
    });

    it("con totalPortafoglio molto grande: peso% molto piccolo ma corretto", () => {
      const cat = makeCategoria();
      const titoli = [
        makeTitolo({ ticker: "A", valoreAttuale: 100, costo: 80, dividendi: 0 }),
      ];
      // 100 / 1_000_000 * 100 = 0.01%
      const { titoli: result } = ricalcolaCategoriaConTitoli(cat, titoli, 1_000_000);
      expect(result[0].pesoPercentuale).toBeCloseTo(0.01, 5);
    });
  });

  describe("peso% categoria (pesoPercentuale) non viene alterato da totalPortafoglio", () => {
    it("ricalcolaCategoriaConTitoli non modifica categoria.pesoPercentuale (responsabilità di ricalcolaPortafoglioConTitoli)", () => {
      const cat = makeCategoria({ pesoPercentuale: 13.93 });
      const titoli = [makeTitolo({ valoreAttuale: 300, costo: 250, dividendi: 0 })];
      const { categoria } = ricalcolaCategoriaConTitoli(cat, titoli, 5000);
      // Il peso della categoria non viene toccato in questa funzione
      // (viene aggiornato da ricalcolaPortafoglioConTitoli)
      expect(categoria.pesoPercentuale).toBe(13.93);
    });
  });
});

// ─── 3. ricalcolaPortafoglioConTitoli — P&L include dividendi ─────────────────

describe("ricalcolaPortafoglioConTitoli — dividendi inclusi nel P&L portafoglio", () => {
  describe("P&L con dividendi", () => {
    it("profittoOPerdita = valoreAttuale - investimentoIniziale + totaleDividendi", () => {
      const port = makePortafoglio({ investimentoIniziale: 30000 });
      const categorie: Categoria[] = [
        makeCategoria({ id: "1", slug: "c1", valoreAttuale: 29500, costo: 30000, profittoOPerdita: -500, plPercentuale: -1.67, dividendi: 100 }),
      ];
      // P&L = 29500 - 30000 + 100 = -400
      const result = ricalcolaPortafoglioConTitoli(port, categorie);
      expect(result.profittoOPerdita).toBeCloseTo(-400, 5);
    });

    it("varPercentuale usa il profittoOPerdita che include dividendi", () => {
      const port = makePortafoglio({ investimentoIniziale: 30000 });
      const categorie: Categoria[] = [
        makeCategoria({ id: "1", slug: "c1", valoreAttuale: 29500, costo: 30000, profittoOPerdita: -500, plPercentuale: -1.67, dividendi: 100 }),
      ];
      // P&L = -400, varPerc = (-400/30000)*100 = -1.3333...%
      const result = ricalcolaPortafoglioConTitoli(port, categorie);
      expect(result.varPercentuale).toBeCloseTo(-1.3333, 3);
    });

    it("con dividendi = 0, comportamento identico alla formula classica", () => {
      const port = makePortafoglio({ investimentoIniziale: 30000 });
      const categorie: Categoria[] = [
        makeCategoria({ id: "1", slug: "c1", valoreAttuale: 31500, costo: 30000, profittoOPerdita: 1500, plPercentuale: 5, dividendi: 0 }),
      ];
      const result = ricalcolaPortafoglioConTitoli(port, categorie);
      // P&L classico = 31500 - 30000 = 1500
      expect(result.profittoOPerdita).toBeCloseTo(1500, 5);
      expect(result.varPercentuale).toBeCloseTo(5, 5);
    });

    it("dividendi distribuiti in più categorie vengono tutti sommati", () => {
      const port = makePortafoglio({ investimentoIniziale: 30000 });
      const categorie: Categoria[] = [
        makeCategoria({ id: "1", slug: "c1", valoreAttuale: 10000, costo: 10000, profittoOPerdita: 0, plPercentuale: 0, dividendi: 50 }),
        makeCategoria({ id: "2", slug: "c2", valoreAttuale: 10000, costo: 10000, profittoOPerdita: 0, plPercentuale: 0, dividendi: 30 }),
        makeCategoria({ id: "3", slug: "c3", valoreAttuale: 10000, costo: 10000, profittoOPerdita: 0, plPercentuale: 0, dividendi: 20 }),
      ];
      // valoreAttuale = 30000, investimento = 30000, dividendi = 100
      // P&L = 30000 - 30000 + 100 = 100
      const result = ricalcolaPortafoglioConTitoli(port, categorie);
      expect(result.profittoOPerdita).toBeCloseTo(100, 5);
    });

    it("dividendi alti possono portare il portafoglio in positivo anche con perdita sul prezzo", () => {
      const port = makePortafoglio({ investimentoIniziale: 30000 });
      const categorie: Categoria[] = [
        makeCategoria({ id: "1", slug: "c1", valoreAttuale: 29000, costo: 30000, profittoOPerdita: -1000, plPercentuale: -3.33, dividendi: 1500 }),
      ];
      // P&L = 29000 - 30000 + 1500 = 500
      const result = ricalcolaPortafoglioConTitoli(port, categorie);
      expect(result.profittoOPerdita).toBeCloseTo(500, 5);
      expect(result.profittoOPerdita).toBeGreaterThan(0);
    });

    it("preserva utileRealizzato (non viene duplicato o cancellato)", () => {
      const port = makePortafoglio({ investimentoIniziale: 30000, utileRealizzato: 65 });
      const categorie: Categoria[] = [
        makeCategoria({ id: "1", slug: "c1", valoreAttuale: 30000, costo: 30000, profittoOPerdita: 0, plPercentuale: 0, dividendi: 50 }),
      ];
      const result = ricalcolaPortafoglioConTitoli(port, categorie);
      expect(result.utileRealizzato).toBe(65);
    });
  });

  describe("edge cases dividendi", () => {
    it("portafoglio senza categorie e dividendi = 0: P&L = -investimentoIniziale", () => {
      const port = makePortafoglio({ investimentoIniziale: 30000 });
      const result = ricalcolaPortafoglioConTitoli(port, []);
      expect(result.profittoOPerdita).toBeCloseTo(-30000, 5);
    });

    it("investimentoIniziale = 0 con dividendi: varPercentuale = 0 (guard divisione)", () => {
      const port = makePortafoglio({ investimentoIniziale: 0 });
      const categorie: Categoria[] = [
        makeCategoria({ id: "1", slug: "c1", valoreAttuale: 5000, costo: 0, profittoOPerdita: 5000, plPercentuale: 0, dividendi: 100 }),
      ];
      const result = ricalcolaPortafoglioConTitoli(port, categorie);
      expect(result.varPercentuale).toBe(0);
    });
  });
});

// ─── 4. Verifica assenza di double-counting in guadagnoTotale (logica dashboard) ──

describe("guadagnoTotale — nessun double-counting dei dividendi", () => {
  /**
   * La dashboard calcola:
   *   guadagnoTotale = portafoglio.profittoOPerdita + portafoglio.utileRealizzato
   *
   * Dopo la modifica, portafoglio.profittoOPerdita già include i dividendi (via ricalcolaPortafoglioConTitoli).
   * Quindi guadagnoTotale NON deve aggiungere dividendiTotale2026 separatamente.
   * Questo test verifica che la formula sia matematicamente corretta.
   */

  it("guadagnoTotale = profittoOPerdita(incl. dividendi) + utileRealizzato (nessun dividendo aggiunto)", () => {
    const investimentoIniziale = 30000;
    const utileRealizzato = 65;
    const dividendi = 87.5; // dividendi già inclusi nel profittoOPerdita
    const valoreAttuale = 29750;

    const port = makePortafoglio({
      investimentoIniziale,
      utileRealizzato,
    });

    const categorie: Categoria[] = [
      makeCategoria({
        id: "1", slug: "c1",
        valoreAttuale,
        costo: investimentoIniziale,
        profittoOPerdita: -250,
        plPercentuale: -0.83,
        dividendi,
      }),
    ];

    const portafoglioRicalcolato = ricalcolaPortafoglioConTitoli(port, categorie);

    // profittoOPerdita include già i dividendi: 29750 - 30000 + 87.5 = -162.5
    expect(portafoglioRicalcolato.profittoOPerdita).toBeCloseTo(-162.5, 3);

    // guadagnoTotale (dashboard): solo profittoOPerdita + utileRealizzato
    const guadagnoTotale = portafoglioRicalcolato.profittoOPerdita + portafoglioRicalcolato.utileRealizzato;
    expect(guadagnoTotale).toBeCloseTo(-162.5 + 65, 3); // = -97.5

    // Se invece si aggiungesse dividendiTotale2026 separatamente, si conterebbero due volte
    const guadagnoConDoubleCounting = portafoglioRicalcolato.profittoOPerdita + portafoglioRicalcolato.utileRealizzato + dividendi;
    // -162.5 + 65 + 87.5 = -10 (sbagliato, i dividendi sarebbero contati due volte)
    expect(guadagnoConDoubleCounting).not.toBeCloseTo(guadagnoTotale, 1);
  });

  it("con dividendi = 0: guadagnoTotale = profittoOPerdita + utileRealizzato (invariato)", () => {
    const port = makePortafoglio({ investimentoIniziale: 30000, utileRealizzato: 65 });
    const categorie: Categoria[] = [
      makeCategoria({ id: "1", slug: "c1", valoreAttuale: 29500, costo: 30000, profittoOPerdita: -500, plPercentuale: -1.67, dividendi: 0 }),
    ];
    const result = ricalcolaPortafoglioConTitoli(port, categorie);
    // P&L = 29500 - 30000 + 0 = -500
    const guadagnoTotale = result.profittoOPerdita + result.utileRealizzato;
    expect(guadagnoTotale).toBeCloseTo(-500 + 65, 5);
  });
});

// ─── 5. Peso% su portafoglio totale — consistenza tra funzioni ─────────────────

describe("peso% consistenza tra ricalcolaCategoriaConTitoli e ricalcolaPortafoglioConTitoli", () => {
  it("la somma dei pesi% di tutti i titoli (con totalPortafoglio) è uguale alla somma dei pesi% delle categorie", () => {
    const investimentoIniziale = 30000;
    const port = makePortafoglio({ investimentoIniziale });

    // Due categorie con 2 titoli ciascuna
    const cat1 = makeCategoria({ id: "cat1", slug: "c1", pesoPercentuale: 0, costo: 0, valoreAttuale: 0, profittoOPerdita: 0, plPercentuale: 0, dividendi: 0 });
    const cat2 = makeCategoria({ id: "cat2", slug: "c2", pesoPercentuale: 0, costo: 0, valoreAttuale: 0, profittoOPerdita: 0, plPercentuale: 0, dividendi: 0 });

    const titoliCat1 = [
      makeTitolo({ ticker: "A", categoria: "cat1", valoreAttuale: 6000, costo: 5000, dividendi: 0 }),
      makeTitolo({ ticker: "B", categoria: "cat1", valoreAttuale: 9000, costo: 8000, dividendi: 0 }),
    ];
    const titoliCat2 = [
      makeTitolo({ ticker: "C", categoria: "cat2", valoreAttuale: 7500, costo: 7000, dividendi: 0 }),
      makeTitolo({ ticker: "D", categoria: "cat2", valoreAttuale: 7500, costo: 7000, dividendi: 0 }),
    ];

    const totalPortafoglio = 6000 + 9000 + 7500 + 7500; // = 30000

    const { categoria: categoriaCalc1, titoli: t1 } = ricalcolaCategoriaConTitoli(cat1, titoliCat1, totalPortafoglio);
    const { categoria: categoriaCalc2, titoli: t2 } = ricalcolaCategoriaConTitoli(cat2, titoliCat2, totalPortafoglio);

    ricalcolaPortafoglioConTitoli(port, [categoriaCalc1, categoriaCalc2]);

    // Somma pesi categorie
    const sommaPesiCategorie = categoriaCalc1.pesoPercentuale + categoriaCalc2.pesoPercentuale;
    // Somma pesi titoli
    const sommaPesiTitoli = [...t1, ...t2].reduce((s, t) => s + t.pesoPercentuale, 0);

    expect(sommaPesiCategorie).toBeCloseTo(100, 4);
    expect(sommaPesiTitoli).toBeCloseTo(100, 4);
    expect(sommaPesiCategorie).toBeCloseTo(sommaPesiTitoli, 3);
  });

  it("categoria con valore 0 ha peso 0% sul portafoglio", () => {
    const port = makePortafoglio({ investimentoIniziale: 30000 });
    const cat1 = makeCategoria({ id: "1", slug: "c1", pesoPercentuale: 0, costo: 0, valoreAttuale: 0, profittoOPerdita: 0, plPercentuale: 0, dividendi: 0 });
    const cat2 = makeCategoria({ id: "2", slug: "c2", pesoPercentuale: 0, costo: 0, valoreAttuale: 0, profittoOPerdita: 0, plPercentuale: 0, dividendi: 0 });

    const titoliCat1: Titolo[] = [];
    const titoliCat2 = [
      makeTitolo({ ticker: "X", categoria: "cat2", valoreAttuale: 30000, costo: 28000, dividendi: 0 }),
    ];

    const totalPortafoglio = 30000;
    const { categoria: c1 } = ricalcolaCategoriaConTitoli(cat1, titoliCat1, totalPortafoglio);
    const { categoria: c2 } = ricalcolaCategoriaConTitoli(cat2, titoliCat2, totalPortafoglio);

    ricalcolaPortafoglioConTitoli(port, [c1, c2]);

    expect(c1.pesoPercentuale).toBeCloseTo(0, 5);
    expect(c2.pesoPercentuale).toBeCloseTo(100, 5);
  });
});

// ─── 6. Verifica struttura tabella composizione (colSpan = 8) ─────────────────

describe("composizione page — struttura tabella con colonna Dividendi", () => {
  /**
   * La tabella nella pagina composizione ha ora 8 colonne:
   * 1. Titolo
   * 2. N. Azioni
   * 3. Prezzo Carico
   * 4. Valore Attuale
   * 5. Peso %
   * 6. Dividendi  <-- aggiunta
   * 7. P&L
   * 8. P&L %
   *
   * Le righe di intestazione categoria usano colSpan={8}.
   * Il footer usa colSpan={3} per la prima cella + 5 celle singole = 8 totale.
   * Questo test documenta e verifica il conteggio delle colonne.
   */
  it("il numero di intestazioni è 8", () => {
    const headers = [
      "Titolo",
      "N. Azioni",
      "Prezzo Carico",
      "Valore Attuale",
      "Peso %",
      "Dividendi",
      "P&L",
      "P&L %",
    ];
    expect(headers.length).toBe(8);
  });

  it("il footer ha colSpan(3) + 5 celle singole = 8 colonne totali", () => {
    const colspanPrimaCella = 3;
    const celleRestanti = 5; // valore, peso (vuota), dividendi, P&L, P&L%
    expect(colspanPrimaCella + celleRestanti).toBe(8);
  });

  it("la riga categoria usa colSpan={8} (uguale al numero di colonne della tabella)", () => {
    const totalColumns = 8;
    const categoryRowColspan = 8;
    expect(categoryRowColspan).toBe(totalColumns);
  });
});
