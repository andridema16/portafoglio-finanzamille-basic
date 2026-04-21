/**
 * Tests for the dataInizio-aware cache logic in getStoricoSPY (yahoo.ts).
 *
 * The four scenarios under test:
 * 1. Cache has a different dataInizio → invalidate and re-fetch.
 * 2. Cache has the same dataInizio and is not expired → return from cache.
 * 3. Cache is expired (timestamp old) even with the same dataInizio → re-fetch.
 * 4. No cache at all (null) → fetch.
 *
 * Each test runs in an isolated module scope via vi.resetModules() in beforeEach,
 * so the module-level `spyCache` variable is always reset to null.
 *
 * vi.mock() is hoisted to the top of the file by Vitest, but the mock
 * implementation references the module-level `mockChartFn` spy which is
 * declared before the vi.mock() call. This is the same pattern used in the
 * existing ticker-logo-yahoo-grafico.test.ts file.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// Shared chart spy — must be declared BEFORE vi.mock() hoisting
// ---------------------------------------------------------------------------

const mockChartFn = vi.fn();

vi.mock("yahoo-finance2", () => {
  class MockYahooFinance {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(_opts: unknown) {}
    chart = mockChartFn;
  }
  return { default: MockYahooFinance };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal fake yahoo-finance2 chart response. */
function fakeChart(dates: string[], closes: number[]) {
  return {
    quotes: dates.map((d, i) => ({
      date: new Date(d),
      close: closes[i],
    })),
  };
}

const DATA_A = "2026-01-02";
const DATA_B = "2026-06-01";
const SPY_TTL_MS = 30 * 60 * 1000; // mirrors yahoo.ts constant

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("getStoricoSPY — dataInizio-aware cache", () => {
  beforeEach(() => {
    // Reset the module registry so the `spyCache` variable starts as null
    // for every test.
    vi.resetModules();
    mockChartFn.mockReset();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-25T10:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // -------------------------------------------------------------------------
  // Test 1 — Different dataInizio invalidates the cache
  // -------------------------------------------------------------------------
  it("re-fetches when cache has a different dataInizio", async () => {
    // First response for DATA_A
    mockChartFn.mockResolvedValueOnce(fakeChart([DATA_A], [450]));
    // Second response for DATA_B (different dataInizio)
    mockChartFn.mockResolvedValueOnce(fakeChart([DATA_B], [460]));

    const { getStoricoSPY } = await import("@/lib/yahoo");

    // Populate cache with DATA_A
    const first = await getStoricoSPY(DATA_A);
    expect(first[0].data).toBe(DATA_A);
    expect(mockChartFn).toHaveBeenCalledTimes(1);

    // Call with a different dataInizio — must bypass the cache
    const second = await getStoricoSPY(DATA_B);
    expect(second[0].data).toBe(DATA_B);
    expect(mockChartFn).toHaveBeenCalledTimes(2);
  });

  it("re-fetches with correct period1 when dataInizio changes", async () => {
    mockChartFn.mockResolvedValue(fakeChart([], []));

    const { getStoricoSPY } = await import("@/lib/yahoo");

    await getStoricoSPY(DATA_A);
    await getStoricoSPY(DATA_B);

    expect(mockChartFn).toHaveBeenNthCalledWith(
      1,
      "SPY",
      expect.objectContaining({ period1: DATA_A })
    );
    expect(mockChartFn).toHaveBeenNthCalledWith(
      2,
      "SPY",
      expect.objectContaining({ period1: DATA_B })
    );
  });

  // -------------------------------------------------------------------------
  // Test 2 — Same dataInizio, cache not expired → return from cache
  // -------------------------------------------------------------------------
  it("returns cached data when same dataInizio and within TTL", async () => {
    mockChartFn.mockResolvedValue(fakeChart([DATA_A, "2026-01-03"], [450, 455]));

    const { getStoricoSPY } = await import("@/lib/yahoo");

    const first = await getStoricoSPY(DATA_A);
    expect(mockChartFn).toHaveBeenCalledTimes(1);

    // Advance by 5 minutes — well within the 30-minute TTL
    vi.advanceTimersByTime(5 * 60 * 1000);

    const second = await getStoricoSPY(DATA_A);

    // No new network call — served from cache
    expect(mockChartFn).toHaveBeenCalledTimes(1);
    // The returned data is identical to the first call
    expect(second).toEqual(first);
  });

  it("does not call chart API on repeated same-dataInizio calls within TTL", async () => {
    mockChartFn.mockResolvedValue(fakeChart([DATA_A], [450]));

    const { getStoricoSPY } = await import("@/lib/yahoo");

    await getStoricoSPY(DATA_A);
    vi.advanceTimersByTime(29 * 60 * 1000 + 59 * 1000); // 29:59 — still valid
    await getStoricoSPY(DATA_A);
    await getStoricoSPY(DATA_A);

    expect(mockChartFn).toHaveBeenCalledTimes(1);
  });

  // -------------------------------------------------------------------------
  // Test 3 — Same dataInizio but cache is expired → re-fetch
  // -------------------------------------------------------------------------
  it("re-fetches when cache is expired even with same dataInizio", async () => {
    mockChartFn.mockResolvedValue(fakeChart([DATA_A], [450]));

    const { getStoricoSPY } = await import("@/lib/yahoo");

    await getStoricoSPY(DATA_A);
    expect(mockChartFn).toHaveBeenCalledTimes(1);

    // Advance past the 30-minute TTL
    vi.advanceTimersByTime(SPY_TTL_MS + 1);

    await getStoricoSPY(DATA_A);
    expect(mockChartFn).toHaveBeenCalledTimes(2);
  });

  it("re-fetches at exactly TTL + 1 ms (boundary: expired)", async () => {
    mockChartFn.mockResolvedValue(fakeChart([DATA_A], [450]));

    const { getStoricoSPY } = await import("@/lib/yahoo");

    await getStoricoSPY(DATA_A);
    vi.advanceTimersByTime(SPY_TTL_MS + 1);
    await getStoricoSPY(DATA_A);

    expect(mockChartFn).toHaveBeenCalledTimes(2);
  });

  it("does NOT re-fetch at exactly TTL - 1 ms (boundary: still valid)", async () => {
    mockChartFn.mockResolvedValue(fakeChart([DATA_A], [450]));

    const { getStoricoSPY } = await import("@/lib/yahoo");

    await getStoricoSPY(DATA_A);
    vi.advanceTimersByTime(SPY_TTL_MS - 1);
    await getStoricoSPY(DATA_A);

    expect(mockChartFn).toHaveBeenCalledTimes(1);
  });

  // -------------------------------------------------------------------------
  // Test 4 — No cache (null on first call) → fetch
  // -------------------------------------------------------------------------
  it("fetches from yahoo when cache is empty (first call)", async () => {
    mockChartFn.mockResolvedValueOnce(
      fakeChart([DATA_A, "2026-01-03", "2026-01-04"], [450, 451, 449])
    );

    const { getStoricoSPY } = await import("@/lib/yahoo");

    const result = await getStoricoSPY(DATA_A);

    expect(mockChartFn).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ data: DATA_A, valore: 450 });
    expect(result[1]).toEqual({ data: "2026-01-03", valore: 451 });
    expect(result[2]).toEqual({ data: "2026-01-04", valore: 449 });
  });

  it("fetches on first call and caches the dataInizio along with the data", async () => {
    mockChartFn
      .mockResolvedValueOnce(fakeChart([DATA_A], [450])) // first call
      .mockResolvedValueOnce(fakeChart([DATA_A], [999])); // second call — should not be reached

    const { getStoricoSPY } = await import("@/lib/yahoo");

    // First call — cold cache
    const first = await getStoricoSPY(DATA_A);
    expect(mockChartFn).toHaveBeenCalledTimes(1);

    // Second call with same dataInizio within TTL — must use cache
    vi.advanceTimersByTime(1 * 60 * 1000); // 1 minute
    const second = await getStoricoSPY(DATA_A);
    expect(mockChartFn).toHaveBeenCalledTimes(1); // no new call
    expect(second).toEqual(first); // same cached data (450, not 999)
  });
});
