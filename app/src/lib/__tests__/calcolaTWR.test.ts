/**
 * Tests for calcolaTWR in app/src/lib/calcoli.ts
 *
 * The TWR (Time-Weighted Return) eliminates the distortion of external cash
 * flows (deposits/withdrawals) by chaining sub-period HPRs.
 *
 * Algorithm:
 *   For each flusso[i], valoreInizio = valoreDopoFlusso(flusso[i])
 *   valoreFine = flusso[i+1].valorePre  OR  valoreAttuale (for the last period)
 *   HPR = valoreFine / valoreInizio
 *   TWR = (product of all HPRs) - 1
 *
 * valoreDopoFlusso:
 *   "inizio"   → capitalePost
 *   "deposito" → valorePre + importo
 *   "prelievo" → valorePre - importo
 */

import { describe, it, expect } from "vitest";
import { calcolaTWR } from "@/lib/calcoli";
import type { FlussoCapitale } from "@/types/portafoglio";

// ─── Fixture helper ────────────────────────────────────────────────────────────

function makeFlusso(overrides: Partial<FlussoCapitale> & Pick<FlussoCapitale, "tipo">): FlussoCapitale {
  return {
    id: 1,
    data: "2026-01-02",
    tipo: overrides.tipo,
    importo: 0,
    valorePre: 0,
    capitalePost: 0,
    nota: "",
    ...overrides,
  };
}

// ─── Test cases ────────────────────────────────────────────────────────────────

describe("calcolaTWR", () => {

  // TC1: Flussi vuoti → 0
  it("flussi vuoti restituisce 0", () => {
    expect(calcolaTWR([], 30000)).toBe(0);
  });

  // TC2: Solo flusso "inizio"
  // valoreInizio = capitalePost = 30775
  // valoreAttuale = 31000
  // TWR = (31000 / 30775) - 1 ≈ 0.007311
  it("solo flusso inizio: (valoreAttuale / capitalePost) - 1", () => {
    const flussi: FlussoCapitale[] = [
      makeFlusso({ tipo: "inizio", capitalePost: 30775 }),
    ];
    const result = calcolaTWR(flussi, 31000);
    expect(result).toBeCloseTo(0.0073, 4);
  });

  // TC3: Flusso inizio + flusso prelievo (scenario dati reali)
  // flusso[0]: inizio, capitalePost=30775
  //   → valoreInizio = 30775
  //   → valoreFine = flusso[1].valorePre = 30475
  //   → HPR1 = 30475 / 30775 ≈ 0.99025
  // flusso[1]: prelievo, valorePre=30475, importo=475
  //   → valoreInizio = 30475 - 475 = 30000
  //   → valoreFine = valoreAttuale = 30572
  //   → HPR2 = 30572 / 30000 ≈ 1.01907
  // TWR = (HPR1 * HPR2) - 1 ≈ 0.009133
  it("inizio + prelievo: TWR con dati reali approssimati", () => {
    const flussi: FlussoCapitale[] = [
      makeFlusso({ id: 1, tipo: "inizio", capitalePost: 30775 }),
      makeFlusso({ id: 2, tipo: "prelievo", valorePre: 30475, importo: 475 }),
    ];
    const hpr1 = 30475 / 30775;
    const hpr2 = 30572 / 30000;
    const expectedTWR = hpr1 * hpr2 - 1;
    const result = calcolaTWR(flussi, 30572);
    expect(result).toBeCloseTo(expectedTWR, 4);
    // actual value ≈ 0.009133, verified to 3 decimal places
    expect(result).toBeCloseTo(0.009133, 3);
  });

  // TC4: Flusso inizio + flusso deposito
  // flusso[0]: inizio, capitalePost=10000
  //   → valoreInizio = 10000
  //   → valoreFine = flusso[1].valorePre = 10500
  //   → HPR1 = 10500 / 10000 = 1.05
  // flusso[1]: deposito, valorePre=10500, importo=2000
  //   → valoreInizio = 10500 + 2000 = 12500
  //   → valoreFine = valoreAttuale = 13000
  //   → HPR2 = 13000 / 12500 = 1.04
  // TWR = (1.05 * 1.04) - 1 = 0.092
  it("inizio + deposito: HPR1=1.05 * HPR2=1.04 → TWR=0.092", () => {
    const flussi: FlussoCapitale[] = [
      makeFlusso({ id: 1, tipo: "inizio", capitalePost: 10000 }),
      makeFlusso({ id: 2, tipo: "deposito", valorePre: 10500, importo: 2000 }),
    ];
    const result = calcolaTWR(flussi, 13000);
    expect(result).toBeCloseTo(0.092, 4);
  });

  // TC5: Flussi misti (inizio + deposito + prelievo)
  // flusso[0]: inizio, capitalePost=20000
  //   → valoreInizio = 20000
  //   → valoreFine = flusso[1].valorePre = 21000
  //   → HPR1 = 21000 / 20000 = 1.05
  // flusso[1]: deposito, valorePre=21000, importo=5000
  //   → valoreInizio = 21000 + 5000 = 26000
  //   → valoreFine = flusso[2].valorePre = 26500
  //   → HPR2 = 26500 / 26000 ≈ 1.019231
  // flusso[2]: prelievo, valorePre=26500, importo=1500
  //   → valoreInizio = 26500 - 1500 = 25000
  //   → valoreFine = valoreAttuale = 26000
  //   → HPR3 = 26000 / 25000 = 1.04
  // TWR = (1.05 * 1.019231 * 1.04) - 1 ≈ 0.113538
  it("flussi misti inizio + deposito + prelievo: verifica prodotto HPR incatenati", () => {
    const flussi: FlussoCapitale[] = [
      makeFlusso({ id: 1, tipo: "inizio", capitalePost: 20000 }),
      makeFlusso({ id: 2, tipo: "deposito", valorePre: 21000, importo: 5000 }),
      makeFlusso({ id: 3, tipo: "prelievo", valorePre: 26500, importo: 1500 }),
    ];
    const hpr1 = 21000 / 20000;          // 1.05
    const hpr2 = 26500 / 26000;          // ≈ 1.019231
    const hpr3 = 26000 / 25000;          // 1.04
    const expectedTWR = hpr1 * hpr2 * hpr3 - 1;
    const result = calcolaTWR(flussi, 26000);
    expect(result).toBeCloseTo(expectedTWR, 4);
  });

  // TC6: Divisione per 0 — flusso "inizio" con capitalePost=0 deve essere saltato
  // Con array di solo quel flusso e flussi.length === 1, il ramo single-flusso
  // verifica valoreInizio=0 → return 0 direttamente.
  it("flusso inizio con capitalePost=0: valoreInizio<=0 → restituisce 0 (no divisione per zero)", () => {
    const flussi: FlussoCapitale[] = [
      makeFlusso({ tipo: "inizio", capitalePost: 0 }),
    ];
    const result = calcolaTWR(flussi, 10000);
    expect(result).toBe(0);
  });

  // TC7: Valore inizio negativo deve essere saltato (ramo single-flusso)
  // flusso "inizio" con capitalePost negativo → valoreInizio <= 0 → return 0
  it("valore inizio negativo con singolo flusso: capitalePost<0 → restituisce 0", () => {
    const flussi: FlussoCapitale[] = [
      makeFlusso({ tipo: "inizio", capitalePost: -500 }),
    ];
    const result = calcolaTWR(flussi, 1000);
    expect(result).toBe(0);
  });

  // TC7b: Con due flussi, uno ha valoreInizio negativo: quel periodo viene saltato
  // flusso[0]: inizio, capitalePost=-100 → valoreInizio=-100 → skip (prodottoHPR resta 1)
  // flusso[1]: deposito, valorePre=1000, importo=500
  //   → valoreInizio = 1500
  //   → valoreFine = valoreAttuale = 2000
  //   → HPR2 = 2000 / 1500 = 1.3333...
  // TWR = (1 * 1.3333...) - 1 = 0.3333...
  it("con due flussi, valore inizio negativo nel primo flusso: primo periodo saltato", () => {
    const flussi: FlussoCapitale[] = [
      makeFlusso({ id: 1, tipo: "inizio", capitalePost: -100 }),
      makeFlusso({ id: 2, tipo: "deposito", valorePre: 1000, importo: 500 }),
    ];
    const result = calcolaTWR(flussi, 2000);
    // Solo HPR2 = 2000 / 1500 conta, il primo periodo e' saltato
    expect(result).toBeCloseTo(1 / 3, 4);
  });

  // Extra: TWR nullo quando il valore finale coincide con quello iniziale
  // valoreInizio = valoreAttuale → HPR = 1 → TWR = 0
  it("nessun guadagno netto: valoreAttuale uguale al capitale iniziale → TWR = 0", () => {
    const flussi: FlussoCapitale[] = [
      makeFlusso({ tipo: "inizio", capitalePost: 30000 }),
    ];
    const result = calcolaTWR(flussi, 30000);
    expect(result).toBeCloseTo(0, 4);
  });

  // Extra: TWR negativo (perdita)
  // flusso[0]: inizio, capitalePost=10000
  //   → valoreInizio = 10000, valoreFine = valoreAttuale = 9000
  //   → HPR = 9000 / 10000 = 0.9
  // TWR = 0.9 - 1 = -0.1
  it("perdita: TWR negativo correttamente calcolato", () => {
    const flussi: FlussoCapitale[] = [
      makeFlusso({ tipo: "inizio", capitalePost: 10000 }),
    ];
    const result = calcolaTWR(flussi, 9000);
    expect(result).toBeCloseTo(-0.1, 4);
  });

});
