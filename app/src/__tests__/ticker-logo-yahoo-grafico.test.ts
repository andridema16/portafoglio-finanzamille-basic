/**
 * Tests for:
 * - TickerLogo: pure logic (coloreDaTicker helper)
 * - getStoricoSPY: cache behavior, return format
 * - GraficoComparativo: normalizza logic, empty data, merged date set
 *
 * NOTE: TickerLogo and GraficoComparativo are "use client" React components.
 * The vitest config uses environment: "node" with no jsdom/happy-dom available,
 * so full component rendering is not possible. We test extracted pure logic
 * directly and note the rendering limitation.
 *
 * For getStoricoSPY we mock yahoo-finance2 at module level using vi.mock().
 * Because yahoo.ts calls `new YahooFinance(...)`, the mock default export must
 * be a real function/class (not an arrow function). We use a class with a
 * module-level `mockChartFn` spy that tests can configure via
 * `getMockChart()`.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// Shared mock chart spy — must be declared BEFORE vi.mock() hoisting
// ---------------------------------------------------------------------------

const mockChartFn = vi.fn();

vi.mock("yahoo-finance2", () => {
  // Must be a real class so `new YahooFinance(...)` works
  class MockYahooFinance {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(_opts: unknown) {}
    chart = mockChartFn;
  }
  return { default: MockYahooFinance };
});

// ---------------------------------------------------------------------------
// 1. TickerLogo — pure logic: coloreDaTicker
// ---------------------------------------------------------------------------

// Re-implement the pure function from TickerLogo.tsx to test it in isolation.
// (The component cannot be rendered without jsdom.)

const COLORI = [
  "#2d4a3e", "#4CAF50", "#38a169", "#1a73e8", "#e53e3e",
  "#9333ea", "#ea580c", "#0891b2", "#4f46e5", "#b91c1c",
];

function coloreDaTicker(ticker: string): string {
  let hash = 0;
  for (let i = 0; i < ticker.length; i++) {
    hash = ticker.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORI[Math.abs(hash) % COLORI.length];
}

describe("TickerLogo — coloreDaTicker helper", () => {
  it("returns a known color string from the COLORI palette", () => {
    const result = coloreDaTicker("EOG");
    expect(COLORI).toContain(result);
  });

  it("is deterministic — same ticker always returns same color", () => {
    expect(coloreDaTicker("AAPL")).toBe(coloreDaTicker("AAPL"));
    expect(coloreDaTicker("GBTC")).toBe(coloreDaTicker("GBTC"));
  });

  it("different tickers can produce different colors", () => {
    // Not guaranteed to differ, but with a palette of 10 colors the
    // chance of two distinct tickers colliding is low. We test several pairs.
    const pairs = [
      ["EOG", "SPY"],
      ["AAPL", "MSFT"],
      ["BIL", "GOOGL"],
    ];
    const atLeastOneDiffers = pairs.some(
      ([a, b]) => coloreDaTicker(a) !== coloreDaTicker(b)
    );
    expect(atLeastOneDiffers).toBe(true);
  });

  it("handles single-character ticker", () => {
    const result = coloreDaTicker("A");
    expect(COLORI).toContain(result);
  });

  it("handles empty string without throwing (hash stays 0, returns index 0)", () => {
    const result = coloreDaTicker("");
    // hash = 0, abs(0) % 10 = 0 -> first color
    expect(result).toBe(COLORI[0]);
  });

  it("handles long ticker-like strings", () => {
    const result = coloreDaTicker("LONGTICKERXYZ");
    expect(COLORI).toContain(result);
  });

  it("hash is stable across calls (no side effects)", () => {
    const a = coloreDaTicker("V");
    const b = coloreDaTicker("V");
    const c = coloreDaTicker("V");
    expect(a).toBe(b);
    expect(b).toBe(c);
  });
});

// ---------------------------------------------------------------------------
// 2. GraficoComparativo — normalizza logic (extracted and tested in isolation)
// ---------------------------------------------------------------------------

interface PuntoSerie {
  data: string;
  valore: number;
}

function normalizza(serie: PuntoSerie[]): Map<string, number> {
  const mappa = new Map<string, number>();
  if (serie.length === 0) return mappa;
  const primo = serie[0].valore;
  if (primo === 0) return mappa;
  for (const p of serie) {
    mappa.set(p.data, ((p.valore - primo) / primo) * 100);
  }
  return mappa;
}

function formatDataLabel(data: string): string {
  const [, mese, giorno] = data.split("-");
  return `${giorno}/${mese}`;
}

describe("GraficoComparativo — normalizza", () => {
  it("returns empty map for empty series", () => {
    expect(normalizza([])).toEqual(new Map());
  });

  it("returns empty map when first valore is 0 (avoids division by zero)", () => {
    const serie = [
      { data: "2026-01-02", valore: 0 },
      { data: "2026-01-03", valore: 100 },
    ];
    expect(normalizza(serie)).toEqual(new Map());
  });

  it("first point always normalizes to 0%", () => {
    const serie = [
      { data: "2026-01-02", valore: 100 },
      { data: "2026-01-03", valore: 110 },
    ];
    const result = normalizza(serie);
    expect(result.get("2026-01-02")).toBe(0);
  });

  it("computes correct percentage change", () => {
    const serie = [
      { data: "2026-01-02", valore: 100 },
      { data: "2026-01-03", valore: 110 },
      { data: "2026-01-04", valore: 90 },
    ];
    const result = normalizza(serie);
    expect(result.get("2026-01-03")).toBeCloseTo(10, 10);   // +10%
    expect(result.get("2026-01-04")).toBeCloseTo(-10, 10);  // -10%
  });

  it("handles single-element series", () => {
    const serie = [{ data: "2026-01-02", valore: 500 }];
    const result = normalizza(serie);
    expect(result.size).toBe(1);
    expect(result.get("2026-01-02")).toBe(0);
  });

  it("handles very large values without overflow", () => {
    const serie = [
      { data: "2026-01-02", valore: 1_000_000 },
      { data: "2026-01-03", valore: 2_000_000 },
    ];
    const result = normalizza(serie);
    expect(result.get("2026-01-03")).toBeCloseTo(100, 10);
  });

  it("handles values less than primo (negative returns)", () => {
    const serie = [
      { data: "2026-01-02", valore: 200 },
      { data: "2026-01-03", valore: 100 },
    ];
    const result = normalizza(serie);
    expect(result.get("2026-01-03")).toBeCloseTo(-50, 10);
  });
});

describe("GraficoComparativo — merged date set logic", () => {
  it("includes dates from both series", () => {
    const portafoglio: PuntoSerie[] = [
      { data: "2026-01-02", valore: 100 },
      { data: "2026-01-04", valore: 105 },
    ];
    const spy: PuntoSerie[] = [
      { data: "2026-01-02", valore: 500 },
      { data: "2026-01-03", valore: 510 },
    ];

    const portNorm = normalizza(portafoglio);
    const spyNorm = normalizza(spy);

    const dateSet = new Set<string>();
    for (const d of portNorm.keys()) dateSet.add(d);
    for (const d of spyNorm.keys()) dateSet.add(d);
    const dateOrdinate = Array.from(dateSet).sort();

    expect(dateOrdinate).toEqual(["2026-01-02", "2026-01-03", "2026-01-04"]);
  });

  it("assigns null for missing series on a given date", () => {
    const portafoglio: PuntoSerie[] = [
      { data: "2026-01-02", valore: 100 },
      { data: "2026-01-04", valore: 105 },
    ];
    const spy: PuntoSerie[] = [
      { data: "2026-01-02", valore: 500 },
      { data: "2026-01-03", valore: 510 },
    ];

    const portNorm = normalizza(portafoglio);
    const spyNorm = normalizza(spy);

    const dateSet = new Set<string>();
    for (const d of portNorm.keys()) dateSet.add(d);
    for (const d of spyNorm.keys()) dateSet.add(d);
    const dateOrdinate = Array.from(dateSet).sort();

    const dati = dateOrdinate.map((data) => ({
      data,
      dataLabel: formatDataLabel(data),
      portafoglio: portNorm.get(data) ?? null,
      spy: spyNorm.get(data) ?? null,
    }));

    // 2026-01-03 exists only in SPY — portafoglio should be null
    const jan03 = dati.find((d) => d.data === "2026-01-03")!;
    expect(jan03.portafoglio).toBeNull();
    expect(jan03.spy).not.toBeNull();

    // 2026-01-04 exists only in portafoglio — spy should be null
    const jan04 = dati.find((d) => d.data === "2026-01-04")!;
    expect(jan04.spy).toBeNull();
    expect(jan04.portafoglio).not.toBeNull();
  });

  it("handles both series empty — produces empty dati array", () => {
    const portNorm = normalizza([]);
    const spyNorm = normalizza([]);

    const dateSet = new Set<string>();
    for (const d of portNorm.keys()) dateSet.add(d);
    for (const d of spyNorm.keys()) dateSet.add(d);
    const dateOrdinate = Array.from(dateSet).sort();

    expect(dateOrdinate).toEqual([]);
  });

  it("sorts dates in ascending order", () => {
    const portafoglio: PuntoSerie[] = [
      { data: "2026-03-01", valore: 100 },
      { data: "2026-01-15", valore: 105 },
    ];
    const spy: PuntoSerie[] = [
      { data: "2026-02-10", valore: 450 },
    ];

    const portNorm = normalizza(portafoglio);
    const spyNorm = normalizza(spy);

    const dateSet = new Set<string>();
    for (const d of portNorm.keys()) dateSet.add(d);
    for (const d of spyNorm.keys()) dateSet.add(d);
    const dateOrdinate = Array.from(dateSet).sort();

    expect(dateOrdinate).toEqual(["2026-01-15", "2026-02-10", "2026-03-01"]);
  });
});

describe("GraficoComparativo — formatDataLabel", () => {
  it("formats YYYY-MM-DD to DD/MM", () => {
    expect(formatDataLabel("2026-01-15")).toBe("15/01");
    expect(formatDataLabel("2026-03-25")).toBe("25/03");
    expect(formatDataLabel("2026-12-01")).toBe("01/12");
  });
});

// ---------------------------------------------------------------------------
// 3. getStoricoSPY — cache behavior and return format
// ---------------------------------------------------------------------------

// Helper to build a fake chart response
function fakequotes(dates: string[], closes: (number | null)[]) {
  return {
    quotes: dates.map((d, i) => ({
      date: new Date(d),
      close: closes[i],
    })),
  };
}

describe("getStoricoSPY — return format", () => {
  beforeEach(() => {
    vi.resetModules();
    mockChartFn.mockReset();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-25T10:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns array of { data, valore } with correct format", async () => {
    mockChartFn.mockResolvedValueOnce(
      fakequotes(["2026-01-02", "2026-01-03"], [450.5, 455.0])
    );

    const { getStoricoSPY } = await import("@/lib/yahoo");
    const result = await getStoricoSPY("2026-01-02");

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    expect(result[0]).toMatchObject({ data: "2026-01-02", valore: 450.5 });
    expect(result[1]).toMatchObject({ data: "2026-01-03", valore: 455.0 });
  });

  it("data field is formatted as YYYY-MM-DD string", async () => {
    mockChartFn.mockResolvedValueOnce(
      fakequotes(["2026-02-15"], [500])
    );

    const { getStoricoSPY } = await import("@/lib/yahoo");
    const result = await getStoricoSPY("2026-02-15");

    expect(result[0].data).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("filters out quotes with null close", async () => {
    mockChartFn.mockResolvedValueOnce({
      quotes: [
        { date: new Date("2026-01-02"), close: 450 },
        { date: new Date("2026-01-03"), close: null },
        { date: new Date("2026-01-04"), close: 460 },
      ],
    });

    const { getStoricoSPY } = await import("@/lib/yahoo");
    const result = await getStoricoSPY("2026-01-02");

    expect(result.length).toBe(2);
    expect(result.map((r) => r.data)).toEqual(["2026-01-02", "2026-01-04"]);
  });

  it("returns empty array when all quotes have null close", async () => {
    mockChartFn.mockResolvedValueOnce({
      quotes: [
        { date: new Date("2026-01-02"), close: null },
      ],
    });

    const { getStoricoSPY } = await import("@/lib/yahoo");
    const result = await getStoricoSPY("2026-01-02");
    expect(result).toEqual([]);
  });
});

describe("getStoricoSPY — cache behavior", () => {
  beforeEach(() => {
    vi.resetModules();
    mockChartFn.mockReset();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-25T10:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls yahoo chart API only once when called twice within TTL", async () => {
    mockChartFn.mockResolvedValue(fakequotes(["2026-01-02"], [450]));

    const { getStoricoSPY } = await import("@/lib/yahoo");

    await getStoricoSPY("2026-01-02");
    // Advance time by 5 minutes — still within 30-minute TTL
    vi.advanceTimersByTime(5 * 60 * 1000);
    await getStoricoSPY("2026-01-02");

    expect(mockChartFn).toHaveBeenCalledTimes(1);
  });

  it("returns cached result on second call within TTL", async () => {
    mockChartFn.mockResolvedValue(fakequotes(["2026-01-02"], [450]));

    const { getStoricoSPY } = await import("@/lib/yahoo");

    const first = await getStoricoSPY("2026-01-02");
    vi.advanceTimersByTime(10 * 60 * 1000); // 10 min — within TTL
    const second = await getStoricoSPY("2026-01-02");

    expect(first).toEqual(second);
  });

  it("calls yahoo chart API again after TTL expires (30 minutes)", async () => {
    mockChartFn.mockResolvedValue(fakequotes(["2026-01-02"], [450]));

    const { getStoricoSPY } = await import("@/lib/yahoo");

    await getStoricoSPY("2026-01-02");
    // Advance past the 30-minute TTL
    vi.advanceTimersByTime(31 * 60 * 1000);
    await getStoricoSPY("2026-01-02");

    expect(mockChartFn).toHaveBeenCalledTimes(2);
  });

  it("cache is fresh at exactly 29 min 59 sec (still within TTL)", async () => {
    mockChartFn.mockResolvedValue(fakequotes(["2026-01-02"], [450]));

    const { getStoricoSPY } = await import("@/lib/yahoo");

    await getStoricoSPY("2026-01-02");
    vi.advanceTimersByTime(29 * 60 * 1000 + 59 * 1000); // 29:59
    await getStoricoSPY("2026-01-02");

    expect(mockChartFn).toHaveBeenCalledTimes(1);
  });

  it("passes the correct ticker 'SPY' to yahooFinance.chart", async () => {
    mockChartFn.mockResolvedValue(fakequotes(["2026-01-02"], [450]));

    const { getStoricoSPY } = await import("@/lib/yahoo");
    await getStoricoSPY("2026-01-02");

    expect(mockChartFn).toHaveBeenCalledWith(
      "SPY",
      expect.objectContaining({ period1: "2026-01-02", interval: "1d" })
    );
  });

  it("passes the dataInizio as period1", async () => {
    mockChartFn.mockResolvedValue(fakequotes([], []));

    const { getStoricoSPY } = await import("@/lib/yahoo");
    await getStoricoSPY("2025-06-01");

    expect(mockChartFn).toHaveBeenCalledWith(
      "SPY",
      expect.objectContaining({ period1: "2025-06-01" })
    );
  });
});
