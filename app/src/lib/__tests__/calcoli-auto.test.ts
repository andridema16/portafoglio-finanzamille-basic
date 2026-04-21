/**
 * Tests for admin-facing calculation functions in app/src/lib/calcoli.ts
 *
 * Covers:
 * 1. calcolaVendita — sell shares, update titolo, produce OperazioneVendita
 * 2. calcolaAcquisto — buy shares, weighted-average carico, produce OperazioneAcquisto
 * 3. calcolaDividendo — update dividendi, recalc P&L, produce Dividendo record
 * 4. calcolaAggiornamentoPrezzo — wrapper around calcolaTitoloConPrezzoLive
 */

import { describe, it, expect } from "vitest";
import {
  calcolaVendita,
  calcolaAcquisto,
  calcolaDividendo,
  calcolaAggiornamentoPrezzo,
} from "@/lib/calcoli";
import type { Titolo } from "@/types/portafoglio";

// ─── Fixture helpers ──────────────────────────────────────────────────────────

function makeTitolo(overrides: Partial<Titolo> = {}): Titolo {
  return {
    ticker: "EOG",
    nome: "EOG Resources Inc",
    categoria: "commodities",
    numAzioni: 5,
    prezzoMedioCarico: 100,
    costo: 500,
    valoreAttuale: 600, // prezzoCorrente = 120 per azione
    pesoPercentuale: 10,
    varPrezzo: 20,
    dividendi: 0,
    profittoOPerdita: 100,
    plPercentuale: 20,
    peRatio: 15,
    isin: "US26875P1012",
    assetClass: "azione",
    paese: "USA",
    settore: "energia",
    ...overrides,
  };
}

// ─── 1. calcolaVendita ────────────────────────────────────────────────────────

describe("calcolaVendita", () => {
  // ── 1a. Happy path — vendita parziale ────────────────────────────────────────

  describe("vendita parziale (2 di 5 azioni)", () => {
    it("numAzioni del titolo aggiornato si riduce correttamente", () => {
      const titolo = makeTitolo();
      const { titoloAggiornato } = calcolaVendita(titolo, 2, 130, "2026-03-01");
      expect(titoloAggiornato.numAzioni).toBe(3); // 5 - 2
    });

    it("titoloEliminato = false per vendita parziale", () => {
      const titolo = makeTitolo();
      const { titoloEliminato } = calcolaVendita(titolo, 2, 130, "2026-03-01");
      expect(titoloEliminato).toBe(false);
    });

    it("utileRealizzato = (prezzoVendita - prezzoMedioCarico) * azioniVendute", () => {
      // (130 - 100) * 2 = 60
      const titolo = makeTitolo();
      const { utileRealizzato } = calcolaVendita(titolo, 2, 130, "2026-03-01");
      expect(utileRealizzato).toBeCloseTo(60, 5);
    });

    it("deltaLiquidita = azioniVendute * prezzoVendita", () => {
      // 2 * 130 = 260
      const titolo = makeTitolo();
      const { deltaLiquidita } = calcolaVendita(titolo, 2, 130, "2026-03-01");
      expect(deltaLiquidita).toBeCloseTo(260, 5);
    });

    it("prezzoAcquisto nell'operazione corrisponde a prezzoMedioCarico del titolo", () => {
      const titolo = makeTitolo({ prezzoMedioCarico: 100 });
      const { operazione } = calcolaVendita(titolo, 2, 130, "2026-03-01");
      expect(operazione.prezzoAcquisto).toBe(100);
    });

    it("percentuale dell'operazione = (prezzoVendita - carico) / carico * 100", () => {
      // (130 - 100) / 100 * 100 = 30%
      const titolo = makeTitolo();
      const { operazione } = calcolaVendita(titolo, 2, 130, "2026-03-01");
      expect(operazione.percentuale).toBeCloseTo(30, 5);
    });

    it("il costo residuo = numAzioniRimaste * prezzoMedioCarico", () => {
      // 3 * 100 = 300
      const titolo = makeTitolo();
      const { titoloAggiornato } = calcolaVendita(titolo, 2, 130, "2026-03-01");
      expect(titoloAggiornato.costo).toBeCloseTo(300, 5);
    });

    it("il valoreAttuale residuo usa il prezzo corrente per azione (non il prezzo di vendita)", () => {
      // prezzoCorrente = 600 / 5 = 120; 3 * 120 = 360
      const titolo = makeTitolo({ numAzioni: 5, valoreAttuale: 600 });
      const { titoloAggiornato } = calcolaVendita(titolo, 2, 130, "2026-03-01");
      expect(titoloAggiornato.valoreAttuale).toBeCloseTo(360, 5);
    });

    it("P&L del titolo residuo = valoreAttuale - costo (senza dividendi)", () => {
      // valoreAttuale=360, costo=300, dividendi=0 => P&L=60
      const titolo = makeTitolo();
      const { titoloAggiornato } = calcolaVendita(titolo, 2, 130, "2026-03-01");
      expect(titoloAggiornato.profittoOPerdita).toBeCloseTo(60, 5);
    });

    it("P&L del titolo residuo include i dividendi", () => {
      // valoreAttuale=360, costo=300, dividendi=15 => P&L=75
      const titolo = makeTitolo({ dividendi: 15 });
      const { titoloAggiornato } = calcolaVendita(titolo, 2, 130, "2026-03-01");
      expect(titoloAggiornato.profittoOPerdita).toBeCloseTo(75, 5);
    });

    it("plPercentuale = P&L / costo * 100", () => {
      // P&L=60, costo=300 => 20%
      const titolo = makeTitolo();
      const { titoloAggiornato } = calcolaVendita(titolo, 2, 130, "2026-03-01");
      expect(titoloAggiornato.plPercentuale).toBeCloseTo(20, 5);
    });

    it("l'operazione ha il tipo corretto e tutti i campi chiave", () => {
      const titolo = makeTitolo();
      const { operazione } = calcolaVendita(titolo, 2, 130, "2026-03-01", "Nota test");
      expect(operazione.tipo).toBe("vendita");
      expect(operazione.ticker).toBe("EOG");
      expect(operazione.nome).toBe("EOG Resources Inc");
      expect(operazione.azioniVendute).toBe(2);
      expect(operazione.prezzoVendita).toBe(130);
      expect(operazione.data).toBe("2026-03-01");
      expect(operazione.nota).toBe("Nota test");
    });

    it("nota vuota di default se non fornita", () => {
      const titolo = makeTitolo();
      const { operazione } = calcolaVendita(titolo, 2, 130, "2026-03-01");
      expect(operazione.nota).toBe("");
    });
  });

  // ── 1b. Vendita totale — titoloEliminato ─────────────────────────────────────

  describe("vendita totale (tutte le azioni)", () => {
    it("titoloEliminato = true quando si vendono tutte le azioni", () => {
      const titolo = makeTitolo({ numAzioni: 5 });
      const { titoloEliminato } = calcolaVendita(titolo, 5, 130, "2026-03-01");
      expect(titoloEliminato).toBe(true);
    });

    it("numAzioni del titolo aggiornato = 0", () => {
      const titolo = makeTitolo({ numAzioni: 5 });
      const { titoloAggiornato } = calcolaVendita(titolo, 5, 130, "2026-03-01");
      expect(titoloAggiornato.numAzioni).toBe(0);
    });

    it("costo residuo = 0 dopo vendita totale", () => {
      const titolo = makeTitolo({ numAzioni: 5 });
      const { titoloAggiornato } = calcolaVendita(titolo, 5, 130, "2026-03-01");
      expect(titoloAggiornato.costo).toBe(0);
    });

    it("valoreAttuale residuo = 0 dopo vendita totale", () => {
      const titolo = makeTitolo({ numAzioni: 5 });
      const { titoloAggiornato } = calcolaVendita(titolo, 5, 130, "2026-03-01");
      expect(titoloAggiornato.valoreAttuale).toBe(0);
    });

    it("deltaLiquidita = tutte le azioni * prezzoVendita", () => {
      // 5 * 130 = 650
      const titolo = makeTitolo({ numAzioni: 5 });
      const { deltaLiquidita } = calcolaVendita(titolo, 5, 130, "2026-03-01");
      expect(deltaLiquidita).toBeCloseTo(650, 5);
    });

    it("utileRealizzato = (prezzoVendita - carico) * tutteLeAzioni", () => {
      // (130 - 100) * 5 = 150
      const titolo = makeTitolo({ numAzioni: 5, prezzoMedioCarico: 100 });
      const { utileRealizzato } = calcolaVendita(titolo, 5, 130, "2026-03-01");
      expect(utileRealizzato).toBeCloseTo(150, 5);
    });
  });

  // ── 1c. Vendita in perdita ────────────────────────────────────────────────────

  describe("vendita in perdita", () => {
    it("utileRealizzato e' negativo se prezzoVendita < prezzoMedioCarico", () => {
      // (80 - 100) * 2 = -40
      const titolo = makeTitolo();
      const { utileRealizzato } = calcolaVendita(titolo, 2, 80, "2026-03-01");
      expect(utileRealizzato).toBeCloseTo(-40, 5);
    });

    it("percentuale e' negativa se prezzoVendita < prezzoMedioCarico", () => {
      // (80 - 100) / 100 * 100 = -20%
      const titolo = makeTitolo();
      const { operazione } = calcolaVendita(titolo, 2, 80, "2026-03-01");
      expect(operazione.percentuale).toBeCloseTo(-20, 5);
    });
  });

  // ── 1d. Azioni frazionarie ────────────────────────────────────────────────────

  describe("azioni frazionarie", () => {
    it("vende 1.5 di 2.5 azioni: numAzioni residuo = 1", () => {
      const titolo = makeTitolo({ numAzioni: 2.5, prezzoMedioCarico: 100, valoreAttuale: 300 });
      const { titoloAggiornato } = calcolaVendita(titolo, 1.5, 120, "2026-03-01");
      expect(titoloAggiornato.numAzioni).toBeCloseTo(1, 5);
    });

    it("deltaLiquidita corretto con azioni frazionarie", () => {
      // 1.5 * 120 = 180
      const titolo = makeTitolo({ numAzioni: 2.5, valoreAttuale: 300 });
      const { deltaLiquidita } = calcolaVendita(titolo, 1.5, 120, "2026-03-01");
      expect(deltaLiquidita).toBeCloseTo(180, 5);
    });
  });

  // ── 1e. Edge: numAzioni = 0 prima della vendita ───────────────────────────────

  describe("edge case: prezzoCorrentePerAzione da valoreAttuale 0", () => {
    it("prezzoCorrentePerAzione = 0 quando numAzioni e' 0 nel DB (titolo gia' venduto)", () => {
      // Questo puo' succedere se il DB e' in stato incoerente
      const titolo = makeTitolo({ numAzioni: 0, valoreAttuale: 0 });
      const { titoloAggiornato, titoloEliminato } = calcolaVendita(titolo, 0, 100, "2026-03-01");
      expect(titoloAggiornato.numAzioni).toBe(0);
      expect(titoloEliminato).toBe(true);
    });
  });
});

// ─── 2. calcolaAcquisto ───────────────────────────────────────────────────────

describe("calcolaAcquisto", () => {
  // ── 2a. Acquisto aggiuntivo — titolo esistente ────────────────────────────────

  describe("acquisto aggiuntivo su titolo esistente", () => {
    it("numAzioni = vecchie + nuove", () => {
      // 5 + 3 = 8
      const titolo = makeTitolo({ numAzioni: 5, prezzoMedioCarico: 100 });
      const { titoloAggiornato } = calcolaAcquisto(titolo, 3, 120, "2026-03-15");
      expect(titoloAggiornato.numAzioni).toBe(8);
    });

    it("nuovoTitolo = false per titolo esistente", () => {
      const titolo = makeTitolo({ numAzioni: 5 });
      const { nuovoTitolo } = calcolaAcquisto(titolo, 3, 120, "2026-03-15");
      expect(nuovoTitolo).toBe(false);
    });

    it("prezzoMedioCarico e' la media ponderata corretta", () => {
      // (5*100 + 3*120) / 8 = (500 + 360) / 8 = 860 / 8 = 107.5
      const titolo = makeTitolo({ numAzioni: 5, prezzoMedioCarico: 100 });
      const { titoloAggiornato } = calcolaAcquisto(titolo, 3, 120, "2026-03-15");
      expect(titoloAggiornato.prezzoMedioCarico).toBeCloseTo(107.5, 5);
    });

    it("costo totale = nuoveAzioni * nuovoPrezzoMedio", () => {
      // 8 * 107.5 = 860
      const titolo = makeTitolo({ numAzioni: 5, prezzoMedioCarico: 100 });
      const { titoloAggiornato } = calcolaAcquisto(titolo, 3, 120, "2026-03-15");
      expect(titoloAggiornato.costo).toBeCloseTo(860, 5);
    });

    it("deltaLiquidita e' negativo (soldi spesi)", () => {
      // -(3 * 120) = -360
      const titolo = makeTitolo();
      const { deltaLiquidita } = calcolaAcquisto(titolo, 3, 120, "2026-03-15");
      expect(deltaLiquidita).toBeCloseTo(-360, 5);
    });

    it("deltaLiquidita = -(azioniComprate * prezzoAcquisto)", () => {
      const titolo = makeTitolo();
      const { deltaLiquidita } = calcolaAcquisto(titolo, 4, 200, "2026-03-15");
      expect(deltaLiquidita).toBeCloseTo(-800, 5);
    });

    it("valoreAttuale usa il prezzo corrente del titolo esistente per le vecchie azioni", () => {
      // prezzoCorrente = 600/5 = 120; nuoveAzioni = 8; valoreAttuale = 8 * 120 = 960
      const titolo = makeTitolo({ numAzioni: 5, valoreAttuale: 600 });
      const { titoloAggiornato } = calcolaAcquisto(titolo, 3, 120, "2026-03-15");
      expect(titoloAggiornato.valoreAttuale).toBeCloseTo(960, 5);
    });

    it("P&L = valoreAttuale - costo + dividendi (con prezzi uguali => P&L = dividendi)", () => {
      // prezzoCorrente = 100 (pari a carico), acquisto a 100 => P&L = dividendi
      const titolo = makeTitolo({ numAzioni: 5, prezzoMedioCarico: 100, valoreAttuale: 500, dividendi: 20 });
      const { titoloAggiornato } = calcolaAcquisto(titolo, 5, 100, "2026-03-15");
      // nuoveAzioni=10, prezzoMedio=100, costo=1000, prezzoCorrente=100, valore=1000, P&L=0+20=20
      expect(titoloAggiornato.profittoOPerdita).toBeCloseTo(20, 5);
    });

    it("varPrezzo = prezzoCorrentePerAzione - nuovoPrezzoMedio", () => {
      // prezzoCorrente = 600/5 = 120; nuovoPrezzoMedio = 107.5; varPrezzo = 12.5
      const titolo = makeTitolo({ numAzioni: 5, prezzoMedioCarico: 100, valoreAttuale: 600 });
      const { titoloAggiornato } = calcolaAcquisto(titolo, 3, 120, "2026-03-15");
      expect(titoloAggiornato.varPrezzo).toBeCloseTo(12.5, 5);
    });

    it("l'operazione ha i campi corretti", () => {
      const titolo = makeTitolo();
      const { operazione } = calcolaAcquisto(titolo, 3, 120, "2026-03-15", "Media al ribasso");
      expect(operazione.tipo).toBe("acquisto");
      expect(operazione.ticker).toBe("EOG");
      expect(operazione.nome).toBe("EOG Resources Inc");
      expect(operazione.azioniComprate).toBe(3);
      expect(operazione.prezzoAcquisto).toBe(120);
      expect(operazione.data).toBe("2026-03-15");
      expect(operazione.nota).toBe("Media al ribasso");
    });

    it("nota vuota di default", () => {
      const titolo = makeTitolo();
      const { operazione } = calcolaAcquisto(titolo, 3, 120, "2026-03-15");
      expect(operazione.nota).toBe("");
    });
  });

  // ── 2b. Nuovo titolo (numAzioni = 0) ─────────────────────────────────────────

  describe("nuovo titolo (numAzioni = 0)", () => {
    it("nuovoTitolo = true quando numAzioni era 0", () => {
      const titolo = makeTitolo({ numAzioni: 0, valoreAttuale: 0, costo: 0 });
      const { nuovoTitolo } = calcolaAcquisto(titolo, 5, 100, "2026-03-15");
      expect(nuovoTitolo).toBe(true);
    });

    it("prezzoMedioCarico = prezzoAcquisto per nuovo titolo", () => {
      const titolo = makeTitolo({ numAzioni: 0, valoreAttuale: 0, costo: 0 });
      const { titoloAggiornato } = calcolaAcquisto(titolo, 5, 100, "2026-03-15");
      expect(titoloAggiornato.prezzoMedioCarico).toBeCloseTo(100, 5);
    });

    it("numAzioni = azioniComprate per nuovo titolo", () => {
      const titolo = makeTitolo({ numAzioni: 0, valoreAttuale: 0, costo: 0 });
      const { titoloAggiornato } = calcolaAcquisto(titolo, 5, 100, "2026-03-15");
      expect(titoloAggiornato.numAzioni).toBe(5);
    });

    it("valoreAttuale = azioniComprate * prezzoAcquisto per nuovo titolo (nessun prezzo corrente)", () => {
      // 5 * 100 = 500
      const titolo = makeTitolo({ numAzioni: 0, valoreAttuale: 0, costo: 0 });
      const { titoloAggiornato } = calcolaAcquisto(titolo, 5, 100, "2026-03-15");
      expect(titoloAggiornato.valoreAttuale).toBeCloseTo(500, 5);
    });

    it("P&L = 0 per nuovo titolo appena acquistato (valore = costo, dividendi = 0)", () => {
      const titolo = makeTitolo({ numAzioni: 0, valoreAttuale: 0, costo: 0, dividendi: 0 });
      const { titoloAggiornato } = calcolaAcquisto(titolo, 5, 100, "2026-03-15");
      expect(titoloAggiornato.profittoOPerdita).toBeCloseTo(0, 5);
    });

    it("deltaLiquidita = -(azioniComprate * prezzoAcquisto)", () => {
      // -(5 * 100) = -500
      const titolo = makeTitolo({ numAzioni: 0, valoreAttuale: 0, costo: 0 });
      const { deltaLiquidita } = calcolaAcquisto(titolo, 5, 100, "2026-03-15");
      expect(deltaLiquidita).toBeCloseTo(-500, 5);
    });
  });

  // ── 2c. Azioni frazionarie ────────────────────────────────────────────────────

  describe("azioni frazionarie", () => {
    it("media ponderata corretta con azioni frazionarie", () => {
      // (2.5*100 + 1.5*120) / 4 = (250 + 180) / 4 = 430/4 = 107.5
      const titolo = makeTitolo({ numAzioni: 2.5, prezzoMedioCarico: 100, valoreAttuale: 300 });
      const { titoloAggiornato } = calcolaAcquisto(titolo, 1.5, 120, "2026-03-15");
      expect(titoloAggiornato.numAzioni).toBeCloseTo(4, 5);
      expect(titoloAggiornato.prezzoMedioCarico).toBeCloseTo(107.5, 5);
    });
  });

  // ── 2d. Acquisto allo stesso prezzo del carico ────────────────────────────────

  describe("acquisto allo stesso prezzo del carico esistente", () => {
    it("prezzoMedioCarico rimane invariato", () => {
      const titolo = makeTitolo({ numAzioni: 5, prezzoMedioCarico: 100, valoreAttuale: 500 });
      const { titoloAggiornato } = calcolaAcquisto(titolo, 5, 100, "2026-03-15");
      expect(titoloAggiornato.prezzoMedioCarico).toBeCloseTo(100, 5);
    });
  });
});

// ─── 3. calcolaDividendo ──────────────────────────────────────────────────────

describe("calcolaDividendo", () => {
  // ── 3a. Happy path ───────────────────────────────────────────────────────────

  describe("dividendo normale", () => {
    it("dividendi del titolo aggiornato = vecchi dividendi + importo", () => {
      const titolo = makeTitolo({ dividendi: 5 });
      const { titoloAggiornato } = calcolaDividendo(titolo, 3.5, "2026-02-15");
      expect(titoloAggiornato.dividendi).toBeCloseTo(8.5, 5);
    });

    it("primo dividendo: dividendi = importo (da 0)", () => {
      const titolo = makeTitolo({ dividendi: 0 });
      const { titoloAggiornato } = calcolaDividendo(titolo, 10, "2026-02-15");
      expect(titoloAggiornato.dividendi).toBeCloseTo(10, 5);
    });

    it("P&L ricalcolato include i nuovi dividendi", () => {
      // costo = 5*100=500, valoreAttuale=600, vecchiDividendi=5, nuoviDividendi=8.5
      // P&L = 600 - 500 + 8.5 = 108.5
      const titolo = makeTitolo({ numAzioni: 5, prezzoMedioCarico: 100, valoreAttuale: 600, dividendi: 5 });
      const { titoloAggiornato } = calcolaDividendo(titolo, 3.5, "2026-02-15");
      expect(titoloAggiornato.profittoOPerdita).toBeCloseTo(108.5, 5);
    });

    it("plPercentuale ricalcolato correttamente", () => {
      // P&L = 108.5, costo = 500 => 21.7%
      const titolo = makeTitolo({ numAzioni: 5, prezzoMedioCarico: 100, valoreAttuale: 600, dividendi: 5 });
      const { titoloAggiornato } = calcolaDividendo(titolo, 3.5, "2026-02-15");
      expect(titoloAggiornato.plPercentuale).toBeCloseTo(21.7, 1);
    });

    it("deltaLiquidita = importo dividendo (positivo)", () => {
      const titolo = makeTitolo();
      const { deltaLiquidita } = calcolaDividendo(titolo, 7.25, "2026-02-15");
      expect(deltaLiquidita).toBeCloseTo(7.25, 5);
    });

    it("il valoreAttuale del titolo NON cambia dopo dividendo", () => {
      const titolo = makeTitolo({ valoreAttuale: 600 });
      const { titoloAggiornato } = calcolaDividendo(titolo, 10, "2026-02-15");
      expect(titoloAggiornato.valoreAttuale).toBe(600);
    });
  });

  // ── 3b. Descrizione auto-generata ────────────────────────────────────────────

  describe("descrizione auto-generata", () => {
    it("genera descrizione automatica quando non e' fornita", () => {
      const titolo = makeTitolo({ ticker: "EOG", nome: "EOG Resources Inc" });
      const { dividendo } = calcolaDividendo(titolo, 5, "2026-02-15");
      expect(dividendo.descrizione).toBe("EOG Resources Inc (EOG) - Dividendo");
    });

    it("usa descrizione personalizzata quando fornita", () => {
      const titolo = makeTitolo();
      const { dividendo } = calcolaDividendo(titolo, 5, "2026-02-15", "EOG CASH DIV Q1 2026");
      expect(dividendo.descrizione).toBe("EOG CASH DIV Q1 2026");
    });

    it("genera descrizione corretta con ticker diverso", () => {
      const titolo = makeTitolo({ ticker: "ACN", nome: "Accenture PLC" });
      const { dividendo } = calcolaDividendo(titolo, 1.63, "2026-02-13");
      expect(dividendo.descrizione).toBe("Accenture PLC (ACN) - Dividendo");
    });
  });

  // ── 3c. Struttura del record dividendo ───────────────────────────────────────

  describe("struttura del record Dividendo", () => {
    it("il record ha tipo = 'dividendo'", () => {
      const titolo = makeTitolo();
      const { dividendo } = calcolaDividendo(titolo, 5, "2026-02-15");
      expect(dividendo.tipo).toBe("dividendo");
    });

    it("il record ha ticker corretto", () => {
      const titolo = makeTitolo({ ticker: "EOG" });
      const { dividendo } = calcolaDividendo(titolo, 5, "2026-02-15");
      expect(dividendo.ticker).toBe("EOG");
    });

    it("il record ha importo corretto", () => {
      const titolo = makeTitolo();
      const { dividendo } = calcolaDividendo(titolo, 7.5, "2026-02-15");
      expect(dividendo.importo).toBeCloseTo(7.5, 5);
    });

    it("il record ha data corretta", () => {
      const titolo = makeTitolo();
      const { dividendo } = calcolaDividendo(titolo, 5, "2026-02-13");
      expect(dividendo.data).toBe("2026-02-13");
    });
  });

  // ── 3d. Edge case: costo = 0 ─────────────────────────────────────────────────

  describe("edge case: costo totale = 0", () => {
    it("plPercentuale = 0 se costo = 0 (nessuna divisione per zero)", () => {
      const titolo = makeTitolo({ numAzioni: 0, prezzoMedioCarico: 0, valoreAttuale: 0, dividendi: 0 });
      const { titoloAggiornato } = calcolaDividendo(titolo, 10, "2026-02-15");
      expect(titoloAggiornato.plPercentuale).toBe(0);
    });
  });

  // ── 3e. Piu' dividendi consecutivi ───────────────────────────────────────────

  describe("dividendi multipli cumulativi", () => {
    it("tre dividendi consecutivi si sommano correttamente", () => {
      let titolo = makeTitolo({ dividendi: 0 });
      titolo = calcolaDividendo(titolo, 5, "2026-01-15").titoloAggiornato;
      titolo = calcolaDividendo(titolo, 3, "2026-02-15").titoloAggiornato;
      titolo = calcolaDividendo(titolo, 2, "2026-03-15").titoloAggiornato;
      expect(titolo.dividendi).toBeCloseTo(10, 5);
    });
  });
});

// ─── 4. calcolaAggiornamentoPrezzo ────────────────────────────────────────────

describe("calcolaAggiornamentoPrezzo", () => {
  // ── 4a. Ricalcoli fondamentali ───────────────────────────────────────────────

  describe("ricalcolo valori fondamentali", () => {
    it("valoreAttuale = numAzioni * nuovoPrezzo", () => {
      // 5 * 140 = 700
      const titolo = makeTitolo({ numAzioni: 5, prezzoMedioCarico: 100, valoreAttuale: 600 });
      const result = calcolaAggiornamentoPrezzo(titolo, 140);
      expect(result.valoreAttuale).toBeCloseTo(700, 5);
    });

    it("costo = numAzioni * prezzoMedioCarico (immutato)", () => {
      // 5 * 100 = 500
      const titolo = makeTitolo({ numAzioni: 5, prezzoMedioCarico: 100, costo: 300 /* DB errato */ });
      const result = calcolaAggiornamentoPrezzo(titolo, 140);
      expect(result.costo).toBe(500);
    });

    it("varPrezzo = nuovoPrezzo - prezzoMedioCarico", () => {
      // 140 - 100 = 40
      const titolo = makeTitolo({ numAzioni: 5, prezzoMedioCarico: 100 });
      const result = calcolaAggiornamentoPrezzo(titolo, 140);
      expect(result.varPrezzo).toBeCloseTo(40, 5);
    });

    it("P&L = valoreAttuale - costo", () => {
      // 700 - 500 = 200
      const titolo = makeTitolo({ numAzioni: 5, prezzoMedioCarico: 100, dividendi: 0 });
      const result = calcolaAggiornamentoPrezzo(titolo, 140);
      expect(result.profittoOPerdita).toBeCloseTo(200, 5);
    });

    it("P&L include dividendi", () => {
      // 700 - 500 + 25 = 225
      const titolo = makeTitolo({ numAzioni: 5, prezzoMedioCarico: 100, dividendi: 25 });
      const result = calcolaAggiornamentoPrezzo(titolo, 140);
      expect(result.profittoOPerdita).toBeCloseTo(225, 5);
    });

    it("plPercentuale = P&L / costo * 100", () => {
      // 200 / 500 * 100 = 40%
      const titolo = makeTitolo({ numAzioni: 5, prezzoMedioCarico: 100, dividendi: 0 });
      const result = calcolaAggiornamentoPrezzo(titolo, 140);
      expect(result.plPercentuale).toBeCloseTo(40, 5);
    });
  });

  // ── 4b. P&L negativo ─────────────────────────────────────────────────────────

  describe("nuovo prezzo inferiore al carico", () => {
    it("P&L e' negativo se il prezzo scende", () => {
      // 5 * 80 = 400 vs 500 => P&L = -100
      const titolo = makeTitolo({ numAzioni: 5, prezzoMedioCarico: 100, dividendi: 0 });
      const result = calcolaAggiornamentoPrezzo(titolo, 80);
      expect(result.profittoOPerdita).toBeCloseTo(-100, 5);
    });

    it("varPrezzo e' negativo se il prezzo scende", () => {
      const titolo = makeTitolo({ numAzioni: 5, prezzoMedioCarico: 100 });
      const result = calcolaAggiornamentoPrezzo(titolo, 80);
      expect(result.varPrezzo).toBeCloseTo(-20, 5);
    });
  });

  // ── 4c. Prezzo invariato rispetto al carico ───────────────────────────────────

  describe("prezzo uguale al carico", () => {
    it("P&L = 0 se prezzoAttuale = prezzoMedioCarico", () => {
      const titolo = makeTitolo({ numAzioni: 5, prezzoMedioCarico: 100, dividendi: 0 });
      const result = calcolaAggiornamentoPrezzo(titolo, 100);
      expect(result.profittoOPerdita).toBe(0);
    });

    it("varPrezzo = 0 se prezzoAttuale = prezzoMedioCarico", () => {
      const titolo = makeTitolo({ numAzioni: 5, prezzoMedioCarico: 100 });
      const result = calcolaAggiornamentoPrezzo(titolo, 100);
      expect(result.varPrezzo).toBe(0);
    });
  });

  // ── 4d. Campi non ricalcolati ─────────────────────────────────────────────────

  describe("campi non ricalcolati restano invariati", () => {
    it("preserva ticker, nome, categoria, numAzioni, prezzoMedioCarico, assetClass, paese, settore", () => {
      const titolo = makeTitolo({
        ticker: "XYZ",
        nome: "XYZ Corp",
        categoria: "growth",
        numAzioni: 10,
        prezzoMedioCarico: 200,
        assetClass: "etf",
        paese: "Canada",
        settore: "tecnologia",
      });
      const result = calcolaAggiornamentoPrezzo(titolo, 220);
      expect(result.ticker).toBe("XYZ");
      expect(result.nome).toBe("XYZ Corp");
      expect(result.categoria).toBe("growth");
      expect(result.numAzioni).toBe(10);
      expect(result.prezzoMedioCarico).toBe(200);
      expect(result.assetClass).toBe("etf");
      expect(result.paese).toBe("Canada");
      expect(result.settore).toBe("tecnologia");
    });
  });

  // ── 4e. Edge case: prezzo = 0 ────────────────────────────────────────────────

  describe("edge case: prezzo = 0 (azzeramento totale)", () => {
    it("valoreAttuale = 0 e P&L = -costo", () => {
      const titolo = makeTitolo({ numAzioni: 5, prezzoMedioCarico: 100, dividendi: 0 });
      const result = calcolaAggiornamentoPrezzo(titolo, 0);
      expect(result.valoreAttuale).toBe(0);
      expect(result.profittoOPerdita).toBeCloseTo(-500, 5);
    });
  });

  // ── 4f. Azioni frazionarie ────────────────────────────────────────────────────

  describe("azioni frazionarie", () => {
    it("calcola correttamente con 2.5 azioni a prezzo 142.4", () => {
      // costo = 2.5*115 = 287.5, valore = 2.5*142.4 = 356, P&L = 68.5
      const titolo = makeTitolo({ numAzioni: 2.5, prezzoMedioCarico: 115, dividendi: 0 });
      const result = calcolaAggiornamentoPrezzo(titolo, 142.4);
      expect(result.valoreAttuale).toBeCloseTo(356, 2);
      expect(result.costo).toBeCloseTo(287.5, 2);
      expect(result.profittoOPerdita).toBeCloseTo(68.5, 2);
    });
  });
});
