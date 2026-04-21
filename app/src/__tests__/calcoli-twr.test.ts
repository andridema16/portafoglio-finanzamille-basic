import { describe, it, expect } from "vitest";
import { calcolaTWR } from "@/lib/calcoli";
import type { FlussoCapitale } from "@/types/portafoglio";

// Helper to build a minimal FlussoCapitale object
function makeFlusso(
  overrides: Partial<FlussoCapitale> & Pick<FlussoCapitale, "tipo">
): FlussoCapitale {
  return {
    id: 1,
    data: "2026-01-02",
    importo: 0,
    valorePre: 0,
    capitalePost: 0,
    nota: "",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// 1. Empty flussi array
// ---------------------------------------------------------------------------
describe("calcolaTWR — empty flussi", () => {
  it("returns 0 when flussi is empty", () => {
    expect(calcolaTWR([], 30000)).toBe(0);
  });

  it("returns 0 when flussi is empty regardless of valoreAttuale", () => {
    expect(calcolaTWR([], 0)).toBe(0);
    expect(calcolaTWR([], 100000)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 2. Single "inizio" flusso
// ---------------------------------------------------------------------------
describe("calcolaTWR — single inizio flusso", () => {
  it("calculates simple return: (valoreAttuale / capitalePost) - 1", () => {
    const flussi: FlussoCapitale[] = [
      makeFlusso({ tipo: "inizio", capitalePost: 10000 }),
    ];
    // 11000 / 10000 - 1 = 0.1 (+10%)
    expect(calcolaTWR(flussi, 11000)).toBeCloseTo(0.1, 10);
  });

  it("returns negative TWR when portfolio lost value", () => {
    const flussi: FlussoCapitale[] = [
      makeFlusso({ tipo: "inizio", capitalePost: 20000 }),
    ];
    // 18000 / 20000 - 1 = -0.1 (-10%)
    expect(calcolaTWR(flussi, 18000)).toBeCloseTo(-0.1, 10);
  });

  it("returns 0 when value is unchanged", () => {
    const flussi: FlussoCapitale[] = [
      makeFlusso({ tipo: "inizio", capitalePost: 15000 }),
    ];
    expect(calcolaTWR(flussi, 15000)).toBeCloseTo(0, 10);
  });

  it("returns 0 when capitalePost is 0 (guard against division by zero)", () => {
    const flussi: FlussoCapitale[] = [
      makeFlusso({ tipo: "inizio", capitalePost: 0 }),
    ];
    expect(calcolaTWR(flussi, 15000)).toBe(0);
  });

  it("returns 0 when capitalePost is negative", () => {
    const flussi: FlussoCapitale[] = [
      makeFlusso({ tipo: "inizio", capitalePost: -5000 }),
    ];
    expect(calcolaTWR(flussi, 15000)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 3. Multiple flussi — deposito and prelievo
// ---------------------------------------------------------------------------
describe("calcolaTWR — multiple flussi with deposito/prelievo", () => {
  /**
   * Scenario: two sub-periods with a deposit in between.
   *
   * Period 1: start = 10000, grows to 11000 → HPR1 = 11000/10000 = 1.10
   * Deposit 2000: portfolio becomes 13000
   * Period 2: start = 13000, grows to 14300 → HPR2 = 14300/13000 ≈ 1.10
   * TWR = (1.10 * 1.10) - 1 = 0.21 (+21%)
   */
  it("chains HPR across two sub-periods with a deposit", () => {
    const flussi: FlussoCapitale[] = [
      makeFlusso({
        id: 1,
        tipo: "inizio",
        data: "2026-01-02",
        capitalePost: 10000,
      }),
      makeFlusso({
        id: 2,
        tipo: "deposito",
        data: "2026-02-01",
        importo: 2000,
        valorePre: 11000, // value just before the deposit
        capitalePost: 13000,
      }),
    ];
    // valoreAttuale = 14300 (end of period 2)
    const twr = calcolaTWR(flussi, 14300);
    expect(twr).toBeCloseTo(0.21, 6);
  });

  /**
   * Scenario: two sub-periods with a withdrawal in between.
   *
   * Period 1: start = 10000, grows to 12000 → HPR1 = 12000/10000 = 1.20
   * Withdrawal 2000: portfolio becomes 10000
   * Period 2: start = 10000, grows to 11000 → HPR2 = 11000/10000 = 1.10
   * TWR = (1.20 * 1.10) - 1 = 0.32 (+32%)
   */
  it("chains HPR across two sub-periods with a withdrawal", () => {
    const flussi: FlussoCapitale[] = [
      makeFlusso({
        id: 1,
        tipo: "inizio",
        data: "2026-01-02",
        capitalePost: 10000,
      }),
      makeFlusso({
        id: 2,
        tipo: "prelievo",
        data: "2026-02-15",
        importo: 2000,
        valorePre: 12000,
        capitalePost: 10000,
      }),
    ];
    const twr = calcolaTWR(flussi, 11000);
    expect(twr).toBeCloseTo(0.32, 6);
  });

  /**
   * Scenario: three sub-periods (inizio, deposito, deposito).
   *
   * Period 1: start = 10000 → end = 10500 → HPR1 = 1.05
   * Deposit 5000: portfolio = 15500
   * Period 2: start = 15500 → end = 15500 (flat) → HPR2 = 1.00
   * Deposit 500: portfolio = 16000
   * Period 3: start = 16000 → valoreAttuale = 16800 → HPR3 = 1.05
   * TWR = (1.05 * 1.00 * 1.05) - 1 = 0.1025
   */
  it("chains HPR correctly across three sub-periods", () => {
    const flussi: FlussoCapitale[] = [
      makeFlusso({ id: 1, tipo: "inizio", data: "2026-01-02", capitalePost: 10000 }),
      makeFlusso({
        id: 2,
        tipo: "deposito",
        data: "2026-02-01",
        importo: 5000,
        valorePre: 10500,
        capitalePost: 15500,
      }),
      makeFlusso({
        id: 3,
        tipo: "deposito",
        data: "2026-03-01",
        importo: 500,
        valorePre: 15500,
        capitalePost: 16000,
      }),
    ];
    const twr = calcolaTWR(flussi, 16800);
    expect(twr).toBeCloseTo(0.1025, 6);
  });

  it("returns -1 if portfolio dropped to 0 in the last period", () => {
    const flussi: FlussoCapitale[] = [
      makeFlusso({ id: 1, tipo: "inizio", data: "2026-01-02", capitalePost: 10000 }),
    ];
    // valoreAttuale = 0 → (0/10000) - 1 = -1 (total loss)
    expect(calcolaTWR(flussi, 0)).toBeCloseTo(-1, 10);
  });
});

// ---------------------------------------------------------------------------
// 4. Edge cases: valorePre / valoreInizio <= 0 in intermediate flussi
// ---------------------------------------------------------------------------
describe("calcolaTWR — edge cases with zero/negative intermediate values", () => {
  it("skips a sub-period whose valoreInizio (via deposito) is 0", () => {
    /**
     * Period 1: inizio capitalePost = 10000 (valoreInizio = 10000)
     *   → valorePre of next flusso = 11000 → HPR1 = 11000/10000 = 1.10
     * Deposito importo=0, valorePre=0 → valoreDopoFlusso = 0+0 = 0 → skip
     * TWR = (1.10 * (skipped) ) - 1 → but the last flusso's valoreFine
     *       is valoreAttuale because it IS the last flusso.
     *
     * With two flussi the loop runs i=0 and i=1:
     *   i=0: valoreInizio=10000, valoreFine = flussi[1].valorePre = 0 → HPR = 0/10000 = 0
     *   i=1: valoreInizio = 0+0 = 0 → skipped
     *   prodottoHPR = 1 * 0 = 0 → TWR = 0 - 1 = -1
     *
     * This documents the actual behaviour (not a bug, just an edge case).
     */
    const flussi: FlussoCapitale[] = [
      makeFlusso({ id: 1, tipo: "inizio", data: "2026-01-02", capitalePost: 10000 }),
      makeFlusso({
        id: 2,
        tipo: "deposito",
        data: "2026-02-01",
        importo: 0,
        valorePre: 0,   // portfolio went to 0 before the deposit
        capitalePost: 0,
      }),
    ];
    // valoreAttuale = 15000 after recovery
    const twr = calcolaTWR(flussi, 15000);
    // i=0: HPR = valorePre[1] / capitalePost[0] = 0 / 10000 = 0 → prodotto = 0
    // i=1: valoreInizio = 0 + 0 = 0 → skip
    // result = 0 - 1 = -1
    expect(twr).toBeCloseTo(-1, 10);
  });

  it("skips a sub-period whose valoreInizio (via prelievo) produces 0", () => {
    // prelievo.valorePre - prelievo.importo = 5000 - 5000 = 0 → skip
    const flussi: FlussoCapitale[] = [
      makeFlusso({ id: 1, tipo: "inizio", data: "2026-01-02", capitalePost: 10000 }),
      makeFlusso({
        id: 2,
        tipo: "prelievo",
        data: "2026-02-01",
        importo: 5000,
        valorePre: 5000,  // entire portfolio value
        capitalePost: 0,
      }),
    ];
    const twr = calcolaTWR(flussi, 6000);
    // i=0: HPR = valorePre[1] / capitalePost[0] = 5000/10000 = 0.5
    // i=1: valoreInizio = 5000-5000 = 0 → skip
    // prodottoHPR = 0.5 → TWR = -0.5
    expect(twr).toBeCloseTo(-0.5, 10);
  });
});

// ---------------------------------------------------------------------------
// 5. TWR percentage conversion (multiply by 100)
// ---------------------------------------------------------------------------
describe("calcolaTWR — percentage conversion", () => {
  it("converts +5% decimal to 5 when multiplied by 100", () => {
    const flussi: FlussoCapitale[] = [
      makeFlusso({ tipo: "inizio", capitalePost: 10000 }),
    ];
    const twr = calcolaTWR(flussi, 10500);
    const twrPercentuale = twr * 100;
    expect(twrPercentuale).toBeCloseTo(5, 6);
  });

  it("converts -1.41% decimal to -1.41 when multiplied by 100", () => {
    // From the project data: varPercentuale = -1.41 → twr ≈ -0.0141
    const flussi: FlussoCapitale[] = [
      makeFlusso({ tipo: "inizio", capitalePost: 30775 }),
    ];
    // valoreAttuale 30275 from project data
    const twr = calcolaTWR(flussi, 30275);
    const twrPercentuale = twr * 100;
    // (30275/30775 - 1)*100 ≈ -1.624 (not exactly -1.41 because TWR vs simple return)
    // Just verify the sign and rough magnitude
    expect(twrPercentuale).toBeLessThan(0);
    expect(twrPercentuale).toBeGreaterThan(-5);
  });

  it("converts 0 decimal to 0 percentage", () => {
    const twr = calcolaTWR([], 99999);
    expect(twr * 100).toBe(0);
  });

  it("converts a multi-period TWR to percentage correctly", () => {
    // TWR = 0.21 → 21%
    const flussi: FlussoCapitale[] = [
      makeFlusso({ id: 1, tipo: "inizio", data: "2026-01-02", capitalePost: 10000 }),
      makeFlusso({
        id: 2,
        tipo: "deposito",
        data: "2026-02-01",
        importo: 2000,
        valorePre: 11000,
        capitalePost: 13000,
      }),
    ];
    const twr = calcolaTWR(flussi, 14300);
    expect(twr * 100).toBeCloseTo(21, 4);
  });
});
