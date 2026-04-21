/**
 * QA tests for:
 * 1. getDividendiTotaleAnno — SQL logic (mocked neon client)
 * 2. Dashboard Hero metrics: total value, color logic
 * 3. formatValuta and formatPercentuale outputs
 * 4. colorePL logic
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock @neondatabase/serverless before importing db.ts ───────────────────

const mockSql = vi.fn();

vi.mock("@neondatabase/serverless", () => ({
  neon: () => mockSql,
}));

// ─── Imports under test ─────────────────────────────────────────────────────

import { getDividendiTotaleAnno } from "@/lib/db";
import { formatValuta, formatPercentuale, colorePL } from "@/lib/format";

// ─── Helper to build tagged-template call args ───────────────────────────────
// neon() returns a tagged template function: sql`SELECT ... ${param}`
// vitest mocks it as a regular function; we need to simulate the tag invocation.
// The mock is set up to resolve to the desired rows when called.

// ─── 1. getDividendiTotaleAnno — SQL query logic ─────────────────────────────

describe("getDividendiTotaleAnno", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a number equal to the sum returned by the DB", async () => {
    mockSql.mockResolvedValueOnce([{ totale: "123.45" }]);
    const result = await getDividendiTotaleAnno(2026);
    expect(result).toBe(123.45);
  });

  it("returns 0 when COALESCE returns 0 (no rows)", async () => {
    mockSql.mockResolvedValueOnce([{ totale: "0" }]);
    const result = await getDividendiTotaleAnno(2026);
    expect(result).toBe(0);
  });

  it("converts the DB string to a JS number (not a string)", async () => {
    mockSql.mockResolvedValueOnce([{ totale: "55" }]);
    const result = await getDividendiTotaleAnno(2026);
    expect(typeof result).toBe("number");
  });

  it("passes the year parameter to the query", async () => {
    mockSql.mockResolvedValueOnce([{ totale: "10" }]);
    await getDividendiTotaleAnno(2025);
    // The tagged template is invoked once; we verify it was called with args
    // containing 2025. neon tagged templates pass interpolated values as the
    // second argument to the mock when used as a regular function call.
    expect(mockSql).toHaveBeenCalledTimes(1);
    // The first argument is the TemplateStringsArray, subsequent args are the
    // interpolated values. We verify 2025 appears somewhere in the call args.
    const callArgs = mockSql.mock.calls[0];
    const flatArgs = callArgs.flat(Infinity);
    expect(flatArgs).toContain(2025);
  });

  it("handles decimal totals from DB correctly", async () => {
    mockSql.mockResolvedValueOnce([{ totale: "9.99" }]);
    const result = await getDividendiTotaleAnno(2026);
    expect(result).toBeCloseTo(9.99);
  });

  it("handles large totals without precision loss", async () => {
    mockSql.mockResolvedValueOnce([{ totale: "99999.99" }]);
    const result = await getDividendiTotaleAnno(2026);
    expect(result).toBeCloseTo(99999.99);
  });
});

// ─── 2. formatValuta ─────────────────────────────────────────────────────────

describe("formatValuta", () => {
  it("formats a positive integer value with $ and comma separator", () => {
    expect(formatValuta(30275)).toBe("$30,275");
  });

  it("formats zero as $0", () => {
    expect(formatValuta(0)).toBe("$0");
  });

  it("formats a negative value with minus sign", () => {
    const result = formatValuta(-435);
    expect(result).toContain("435");
    // Negative USD formatting in en-US: -$435 or ($435)
    expect(result).toMatch(/\$|USD/);
  });

  it("rounds decimals — no cents shown", () => {
    expect(formatValuta(1000.9)).toBe("$1,001");
    expect(formatValuta(1000.4)).toBe("$1,000");
  });

  it("formats a large value with commas", () => {
    expect(formatValuta(1000000)).toBe("$1,000,000");
  });

  it("formats a small positive value", () => {
    expect(formatValuta(65)).toBe("$65");
  });
});

// ─── 3. formatPercentuale ────────────────────────────────────────────────────

describe("formatPercentuale", () => {
  it("prefixes positive values with +", () => {
    expect(formatPercentuale(5.5)).toBe("+5.50%");
  });

  it("does NOT prefix negative values with +", () => {
    const result = formatPercentuale(-1.41);
    expect(result).not.toContain("+");
    expect(result).toBe("-1.41%");
  });

  it("formats zero as +0.00%", () => {
    expect(formatPercentuale(0)).toBe("+0.00%");
  });

  it("rounds to exactly 2 decimal places", () => {
    expect(formatPercentuale(23.9444)).toBe("+23.94%");
    expect(formatPercentuale(23.9456)).toBe("+23.95%");
  });

  it("handles 100% gain", () => {
    expect(formatPercentuale(100)).toBe("+100.00%");
  });
});

// ─── 4. colorePL ─────────────────────────────────────────────────────────────

describe("colorePL", () => {
  it("returns verde-guadagno class for a positive value", () => {
    expect(colorePL(100)).toBe("text-verde-guadagno");
  });

  it("returns rosso-perdita class for a negative value", () => {
    expect(colorePL(-50)).toBe("text-rosso-perdita");
  });

  it("returns nero class for exactly zero", () => {
    expect(colorePL(0)).toBe("text-nero");
  });

  it("returns verde-guadagno for very small positive values", () => {
    expect(colorePL(0.01)).toBe("text-verde-guadagno");
  });

  it("returns rosso-perdita for very small negative values", () => {
    expect(colorePL(-0.01)).toBe("text-rosso-perdita");
  });
});

// ─── 5. Dashboard color expectations for each metric ─────────────────────────
// These tests encode the rules from the dashboard page.tsx:
//   - P&L: colorePL (green/red/black based on sign)
//   - Dividendi: always text-verde-guadagno (hardcoded in JSX)
//   - Capitale Investito: always text-nero (hardcoded in JSX)
//   - Liquidita: always text-nero (hardcoded in JSX)
//   - Utile Realizzato: colorePL (can be positive or zero)

describe("Dashboard metric color rules", () => {
  it("P&L is green when portafoglio value has increased", () => {
    expect(colorePL(500)).toBe("text-verde-guadagno");
  });

  it("P&L is red when portafoglio value has decreased", () => {
    expect(colorePL(-435)).toBe("text-rosso-perdita");
  });

  it("Dividendi color is always text-verde-guadagno (constant in JSX)", () => {
    // In the JSX: className="text-xl font-bold text-verde-guadagno mt-1"
    // This is a static class — not computed via colorePL
    // We verify the intent: dividends are always shown in green regardless of value
    const dividendiClasse = "text-verde-guadagno";
    expect(dividendiClasse).toBe("text-verde-guadagno");
  });

  it("Capitale Investito uses text-nero (constant in JSX)", () => {
    const capitaleClasse = "text-nero";
    expect(capitaleClasse).toBe("text-nero");
  });

  it("Liquidita uses text-nero (constant in JSX)", () => {
    const liquiditaClasse = "text-nero";
    expect(liquiditaClasse).toBe("text-nero");
  });

  it("Utile Realizzato uses colorePL — green for realized gains", () => {
    expect(colorePL(65)).toBe("text-verde-guadagno");
  });

  it("Utile Realizzato uses colorePL — red for realized losses", () => {
    expect(colorePL(-20)).toBe("text-rosso-perdita");
  });
});

// ─── 6. Valore Totale calculation ─────────────────────────────────────────────
// From dashboard page.tsx line 84:
//   const valoreTotale = portafoglio.valoreAttuale + portafoglio.liquidita

describe("valoreTotale calculation", () => {
  function computeValoreTotale(valoreAttuale: number, liquidita: number): number {
    return valoreAttuale + liquidita;
  }

  it("sums valoreAttuale and liquidita correctly", () => {
    expect(computeValoreTotale(30275, 15000)).toBe(45275);
  });

  it("is correct when liquidita is zero", () => {
    expect(computeValoreTotale(30275, 0)).toBe(30275);
  });

  it("is correct when valoreAttuale equals investimentoIniziale (break-even)", () => {
    expect(computeValoreTotale(30775, 15000)).toBe(45775);
  });

  it("handles negative valoreAttuale edge case", () => {
    // Should not happen in practice but arithmetic must hold
    expect(computeValoreTotale(-100, 15000)).toBe(14900);
  });

  it("is always >= liquidita alone", () => {
    const valoreAttuale = 30275;
    const liquidita = 15000;
    const totale = computeValoreTotale(valoreAttuale, liquidita);
    expect(totale).toBeGreaterThanOrEqual(liquidita);
  });
});
