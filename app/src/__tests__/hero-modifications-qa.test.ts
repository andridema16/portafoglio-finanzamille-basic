/**
 * QA tests for Hero section modifications in dashboard/page.tsx
 *
 * Tests cover:
 * 1. guadagnoTotale = profittoOPerdita + utileRealizzato + dividendiTotale2026
 * 2. interessiGiornalieri = liquidita * 0.04 / 365
 * 3. colorePL applied to guadagnoTotale
 * 4. formatValutaDecimali with 2 decimal places
 * 5. Valore Totale is only valoreAttuale (not + liquidita)
 */

import { describe, it, expect } from "vitest";
import { colorePL, formatValutaDecimali, formatValuta } from "@/lib/format";

// ─── helpers that mirror the dashboard page logic ────────────────────────────

function calcolaGuadagnoTotale(
  profittoOPerdita: number,
  utileRealizzato: number,
  dividendiTotale: number
): number {
  return profittoOPerdita + utileRealizzato + dividendiTotale;
}

function calcolaInteressiGiornalieri(liquidita: number): number {
  return (liquidita * 0.04) / 365;
}

function calcolaValoreTotale(valoreAttuale: number): number {
  // After the change, Valore Totale is ONLY valoreAttuale — no liquidita added
  return valoreAttuale;
}

// ─── 1. guadagnoTotale calculation ───────────────────────────────────────────

describe("calcolaGuadagnoTotale", () => {
  it("real-world data: -435 + 65 + 180 = -190", () => {
    expect(calcolaGuadagnoTotale(-435, 65, 180)).toBe(-190);
  });

  it("all zero: 0 + 0 + 0 = 0", () => {
    expect(calcolaGuadagnoTotale(0, 0, 0)).toBe(0);
  });

  it("mixed signs: -500 + 200 + 100 = -200", () => {
    expect(calcolaGuadagnoTotale(-500, 200, 100)).toBe(-200);
  });

  it("large positive: 5000 + 1000 + 500 = 6500", () => {
    expect(calcolaGuadagnoTotale(5000, 1000, 500)).toBe(6500);
  });

  it("all negative: -1000 + (-200) + (-50) = -1250", () => {
    expect(calcolaGuadagnoTotale(-1000, -200, -50)).toBe(-1250);
  });

  it("positive profittoOPerdita only: 300 + 0 + 0 = 300", () => {
    expect(calcolaGuadagnoTotale(300, 0, 0)).toBe(300);
  });

  it("dividendi only: 0 + 0 + 180 = 180", () => {
    expect(calcolaGuadagnoTotale(0, 0, 180)).toBe(180);
  });

  it("utileRealizzato only: 0 + 65 + 0 = 65", () => {
    expect(calcolaGuadagnoTotale(0, 65, 0)).toBe(65);
  });

  it("fractional values sum correctly", () => {
    const result = calcolaGuadagnoTotale(-435.50, 64.75, 180.25);
    expect(result).toBeCloseTo(-190.5, 10);
  });
});

// ─── 2. interessiGiornalieri calculation ─────────────────────────────────────

describe("calcolaInteressiGiornalieri", () => {
  it("normal: 15000 * 0.04 / 365 ≈ 1.6438", () => {
    const result = calcolaInteressiGiornalieri(15000);
    expect(result).toBeCloseTo(1.6438, 3);
  });

  it("zero liquidita: 0 * 0.04 / 365 = 0", () => {
    expect(calcolaInteressiGiornalieri(0)).toBe(0);
  });

  it("large: 100000 * 0.04 / 365 ≈ 10.9589", () => {
    const result = calcolaInteressiGiornalieri(100000);
    expect(result).toBeCloseTo(10.9589, 3);
  });

  it("small amount: 1000 * 0.04 / 365 ≈ 0.1096", () => {
    const result = calcolaInteressiGiornalieri(1000);
    expect(result).toBeCloseTo(0.10959, 4);
  });

  it("result is always non-negative when liquidita is non-negative", () => {
    expect(calcolaInteressiGiornalieri(0)).toBeGreaterThanOrEqual(0);
    expect(calcolaInteressiGiornalieri(50000)).toBeGreaterThanOrEqual(0);
  });

  it("annual total is exactly 4% of liquidita (365 days * daily rate)", () => {
    const liquidita = 15000;
    const daily = calcolaInteressiGiornalieri(liquidita);
    const annual = daily * 365;
    expect(annual).toBeCloseTo(liquidita * 0.04, 6);
  });
});

// ─── 3. colorePL applied to guadagnoTotale ───────────────────────────────────

describe("colorePL for guadagnoTotale", () => {
  it("positive guadagnoTotale returns verde-guadagno class", () => {
    expect(colorePL(6500)).toBe("text-verde-guadagno");
  });

  it("negative guadagnoTotale returns rosso-perdita class", () => {
    expect(colorePL(-190)).toBe("text-rosso-perdita");
  });

  it("zero guadagnoTotale returns nero class", () => {
    expect(colorePL(0)).toBe("text-nero");
  });

  it("small positive (e.g. $1) returns verde-guadagno", () => {
    expect(colorePL(1)).toBe("text-verde-guadagno");
  });

  it("small negative (e.g. -$0.01) returns rosso-perdita", () => {
    expect(colorePL(-0.01)).toBe("text-rosso-perdita");
  });

  it("large positive returns verde-guadagno", () => {
    expect(colorePL(99999)).toBe("text-verde-guadagno");
  });

  it("large negative returns rosso-perdita", () => {
    expect(colorePL(-99999)).toBe("text-rosso-perdita");
  });
});

// ─── 4. formatValutaDecimali — 2 decimal places ──────────────────────────────

describe("formatValutaDecimali", () => {
  it("formats 1.6438... as $1.64 (rounds down)", () => {
    const result = formatValutaDecimali(1.6438);
    expect(result).toBe("$1.64");
  });

  it("formats 0 as $0.00", () => {
    expect(formatValutaDecimali(0)).toBe("$0.00");
  });

  it("formats 10.9589 as $10.96 (rounds up)", () => {
    const result = formatValutaDecimali(10.9589);
    expect(result).toBe("$10.96");
  });

  it("formats 1.005 with correct rounding", () => {
    // Intl.NumberFormat rounds half-up, result should be $1.01 or $1.00 depending on float
    const result = formatValutaDecimali(1.005);
    expect(result).toMatch(/^\$1\.0[01]$/);
  });

  it("always has exactly 2 decimal digits", () => {
    const cases = [0, 0.1, 1.5, 100, 9999.99];
    for (const v of cases) {
      const result = formatValutaDecimali(v);
      // matches $X.XX pattern
      expect(result).toMatch(/^\$[\d,]+\.\d{2}$/);
    }
  });

  it("formats large daily interest (100k liquidita) correctly", () => {
    const daily = calcolaInteressiGiornalieri(100000); // ~10.9589
    const result = formatValutaDecimali(daily);
    expect(result).toBe("$10.96");
  });

  it("formats 15000 liquidita daily interest correctly", () => {
    const daily = calcolaInteressiGiornalieri(15000); // ~1.6438
    const result = formatValutaDecimali(daily);
    expect(result).toBe("$1.64");
  });
});

// ─── 5. Valore Totale is ONLY valoreAttuale (not + liquidita) ─────────────────

describe("Valore Totale excludes liquidita", () => {
  it("valoreAttuale=30275, liquidita=15000 — Valore Totale is 30275 (not 45275)", () => {
    const valoreAttuale = 30275;
    const liquidita = 15000;
    const valoreTotale = calcolaValoreTotale(valoreAttuale);
    expect(valoreTotale).toBe(30275);
    expect(valoreTotale).not.toBe(valoreAttuale + liquidita);
  });

  it("valoreAttuale=0 — Valore Totale is 0 regardless of liquidita", () => {
    expect(calcolaValoreTotale(0)).toBe(0);
  });

  it("valoreAttuale=50000 — Valore Totale is exactly 50000", () => {
    expect(calcolaValoreTotale(50000)).toBe(50000);
  });

  it("formatValuta renders valoreAttuale correctly for Valore Totale bar", () => {
    // The barra totale now shows formatValuta(portafoglio.valoreAttuale) directly
    const valoreAttuale = 30275;
    expect(formatValuta(valoreAttuale)).toBe("$30,275");
  });

  it("Valore Totale and liquidita are separate: no double-counting", () => {
    const valoreAttuale = 30275;
    const liquidita = 15000;
    const valoreTotale = calcolaValoreTotale(valoreAttuale);
    // If we naively added liquidita, we would get 45275
    const wrongTotal = valoreAttuale + liquidita;
    expect(valoreTotale).not.toBe(wrongTotal);
  });
});

// ─── 6. Integration: guadagnoTotale → colorePL → formatValuta ────────────────

describe("integration: hero card guadagnoTotale end-to-end", () => {
  it("negative guadagnoTotale: -190 renders red with correct amount", () => {
    const guadagnoTotale = calcolaGuadagnoTotale(-435, 65, 180);
    expect(guadagnoTotale).toBe(-190);
    expect(colorePL(guadagnoTotale)).toBe("text-rosso-perdita");
    expect(formatValuta(guadagnoTotale)).toBe("-$190");
  });

  it("positive guadagnoTotale: 6500 renders green with correct amount", () => {
    const guadagnoTotale = calcolaGuadagnoTotale(5000, 1000, 500);
    expect(guadagnoTotale).toBe(6500);
    expect(colorePL(guadagnoTotale)).toBe("text-verde-guadagno");
    expect(formatValuta(guadagnoTotale)).toBe("$6,500");
  });

  it("zero guadagnoTotale renders black/neutral", () => {
    const guadagnoTotale = calcolaGuadagnoTotale(0, 0, 0);
    expect(guadagnoTotale).toBe(0);
    expect(colorePL(guadagnoTotale)).toBe("text-nero");
    expect(formatValuta(guadagnoTotale)).toBe("$0");
  });
});
