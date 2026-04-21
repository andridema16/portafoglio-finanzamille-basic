/**
 * Tests for app/src/lib/yahoo.ts
 *
 * Covers:
 * 1. Cache — second call within TTL returns cached result without re-fetching
 * 2. Cache — call after TTL expiry re-fetches fresh data
 * 3. Batch — input of >10 tickers is split into batches of 10
 * 4. Fallback — when Yahoo throws, affected tickers return null
 * 5. Mixed — some batches succeed, some fail → partial nulls
 * 6. Edge cases — empty tickers, undefined price, omitted key
 *
 * Isolation strategy:
 * Each test calls resetModulesAndImport() which (a) resets all modules so the
 * module-level `cache` variable starts as null, (b) re-creates the mock for
 * yahoo-finance2 with a fresh mockQuote spy, and (c) re-imports getPrezziMultipli.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── Helpers ──────────────────────────────────────────────────────────────────

type GetPrezziMultipli = (
  tickers: string[]
) => Promise<{ prezzi: Record<string, number | null>; timestamp: number }>;

/**
 * Build the "object" return shape: Record<ticker, { regularMarketPrice }>.
 */
function buildQuoteObject(
  tickers: string[],
  prices: (number | undefined)[]
): Record<string, { regularMarketPrice: number | undefined }> {
  const result: Record<string, { regularMarketPrice: number | undefined }> = {};
  tickers.forEach((t, i) => {
    result[t] = { regularMarketPrice: prices[i] };
  });
  return result;
}

/**
 * Reset the module registry, set up a fresh mock for yahoo-finance2 with a new
 * mockQuote spy, and return both the spy and a freshly imported getPrezziMultipli.
 *
 * We use vi.doMock (not vi.mock) here because vi.doMock is NOT hoisted, which
 * means we can call it inside a function that runs per-test.
 */
async function resetModulesAndImport(): Promise<{
  getPrezziMultipli: GetPrezziMultipli;
  mockQuote: ReturnType<typeof vi.fn>;
}> {
  vi.resetModules();

  const mockQuote = vi.fn();

  vi.doMock("yahoo-finance2", () => {
    class FakeYahooFinance {
      quote = mockQuote;
    }
    return { default: FakeYahooFinance };
  });

  const mod = await import("@/lib/yahoo");
  return { getPrezziMultipli: mod.getPrezziMultipli, mockQuote };
}

// ─── Timer management ─────────────────────────────────────────────────────────

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.resetModules();
  vi.restoreAllMocks();
});

// ─── 1. Cache behaviour ────────────────────────────────────────────────────────

describe("cache behaviour", () => {
  it("calls Yahoo only once when two requests happen within the 3-minute TTL", async () => {
    const { getPrezziMultipli, mockQuote } = await resetModulesAndImport();
    const tickers = ["AAPL", "MSFT"];
    mockQuote.mockResolvedValueOnce(buildQuoteObject(tickers, [150, 300]));

    const first = await getPrezziMultipli(tickers);
    expect(mockQuote).toHaveBeenCalledTimes(1);
    expect(first.prezzi["AAPL"]).toBe(150);
    expect(first.prezzi["MSFT"]).toBe(300);

    // 1 minute elapsed — still within 3-min TTL
    vi.advanceTimersByTime(60 * 1000);

    const second = await getPrezziMultipli(tickers);
    expect(mockQuote).toHaveBeenCalledTimes(1); // no extra call
    expect(second.prezzi["AAPL"]).toBe(150);
    expect(second.prezzi["MSFT"]).toBe(300);
  });

  it("returns the same timestamp from cache on the second call", async () => {
    const { getPrezziMultipli, mockQuote } = await resetModulesAndImport();
    const tickers = ["AAPL"];
    mockQuote.mockResolvedValueOnce(buildQuoteObject(tickers, [150]));

    const first = await getPrezziMultipli(tickers);

    vi.advanceTimersByTime(30 * 1000); // 30 s — within TTL

    const second = await getPrezziMultipli(tickers);
    expect(second.timestamp).toBe(first.timestamp);
  });

  it("re-fetches after TTL (3 minutes) has expired", async () => {
    const { getPrezziMultipli, mockQuote } = await resetModulesAndImport();
    const tickers = ["AAPL"];
    mockQuote
      .mockResolvedValueOnce(buildQuoteObject(tickers, [150]))
      .mockResolvedValueOnce(buildQuoteObject(tickers, [160]));

    const first = await getPrezziMultipli(tickers);
    expect(first.prezzi["AAPL"]).toBe(150);
    expect(mockQuote).toHaveBeenCalledTimes(1);

    // Advance past TTL (3 min + 1 ms)
    vi.advanceTimersByTime(3 * 60 * 1000 + 1);

    const second = await getPrezziMultipli(tickers);
    expect(mockQuote).toHaveBeenCalledTimes(2);
    expect(second.prezzi["AAPL"]).toBe(160);
  });

  it("re-fetched call gets a newer timestamp", async () => {
    const { getPrezziMultipli, mockQuote } = await resetModulesAndImport();
    const tickers = ["AAPL"];
    mockQuote
      .mockResolvedValueOnce(buildQuoteObject(tickers, [150]))
      .mockResolvedValueOnce(buildQuoteObject(tickers, [160]));

    const first = await getPrezziMultipli(tickers);
    vi.advanceTimersByTime(3 * 60 * 1000 + 1);
    const second = await getPrezziMultipli(tickers);

    expect(second.timestamp).toBeGreaterThan(first.timestamp);
  });
});

// ─── 2. Batch splitting ───────────────────────────────────────────────────────

describe("batch splitting", () => {
  it("sends exactly 1 batch for <= 10 tickers", async () => {
    const { getPrezziMultipli, mockQuote } = await resetModulesAndImport();
    const tickers = ["A", "B", "C", "D", "E"];
    mockQuote.mockResolvedValueOnce(buildQuoteObject(tickers, [1, 2, 3, 4, 5]));

    await getPrezziMultipli(tickers);
    expect(mockQuote).toHaveBeenCalledTimes(1);
    expect(mockQuote).toHaveBeenCalledWith(tickers, { return: "object" });
  });

  it("sends exactly 2 batches for 11 tickers (10 + 1)", async () => {
    const { getPrezziMultipli, mockQuote } = await resetModulesAndImport();
    const tickers = Array.from({ length: 11 }, (_, i) => `T${i}`);
    const batch1 = tickers.slice(0, 10);
    const batch2 = tickers.slice(10);

    mockQuote
      .mockResolvedValueOnce(buildQuoteObject(batch1, batch1.map((_, i) => i * 10)))
      .mockResolvedValueOnce(buildQuoteObject(batch2, [99]));

    await getPrezziMultipli(tickers);
    expect(mockQuote).toHaveBeenCalledTimes(2);
    expect(mockQuote).toHaveBeenNthCalledWith(1, batch1, { return: "object" });
    expect(mockQuote).toHaveBeenNthCalledWith(2, batch2, { return: "object" });
  });

  it("sends exactly 3 batches for 25 tickers (10 + 10 + 5)", async () => {
    const { getPrezziMultipli, mockQuote } = await resetModulesAndImport();
    const tickers = Array.from({ length: 25 }, (_, i) => `T${i}`);

    mockQuote
      .mockResolvedValueOnce(buildQuoteObject(tickers.slice(0, 10), new Array(10).fill(100)))
      .mockResolvedValueOnce(buildQuoteObject(tickers.slice(10, 20), new Array(10).fill(200)))
      .mockResolvedValueOnce(buildQuoteObject(tickers.slice(20, 25), new Array(5).fill(300)));

    await getPrezziMultipli(tickers);
    expect(mockQuote).toHaveBeenCalledTimes(3);
  });

  it("returns all prices merged into a single Record for 11 tickers", async () => {
    const { getPrezziMultipli, mockQuote } = await resetModulesAndImport();
    const tickers = Array.from({ length: 11 }, (_, i) => `T${i}`);
    const batch1 = tickers.slice(0, 10);
    const batch2 = tickers.slice(10);

    mockQuote
      .mockResolvedValueOnce(buildQuoteObject(batch1, batch1.map((_, i) => (i + 1) * 10)))
      .mockResolvedValueOnce(buildQuoteObject(batch2, [999]));

    const result = await getPrezziMultipli(tickers);
    expect(Object.keys(result.prezzi).length).toBe(11);
    expect(result.prezzi["T0"]).toBe(10);
    expect(result.prezzi["T9"]).toBe(100);
    expect(result.prezzi["T10"]).toBe(999);
  });
});

// ─── 3. Error fallback ────────────────────────────────────────────────────────

describe("error fallback", () => {
  it("returns null for all tickers in a batch that throws", async () => {
    const { getPrezziMultipli, mockQuote } = await resetModulesAndImport();
    const tickers = ["FAIL1", "FAIL2"];
    mockQuote.mockRejectedValueOnce(new Error("Network error"));

    const result = await getPrezziMultipli(tickers);
    expect(result.prezzi["FAIL1"]).toBeNull();
    expect(result.prezzi["FAIL2"]).toBeNull();
  });

  it("does not throw — getPrezziMultipli resolves even when Yahoo throws", async () => {
    const { getPrezziMultipli, mockQuote } = await resetModulesAndImport();
    mockQuote.mockRejectedValueOnce(new Error("Rate limited"));

    await expect(getPrezziMultipli(["X"])).resolves.toBeDefined();
  });

  it("returns object with prezzi and timestamp after an error", async () => {
    const { getPrezziMultipli, mockQuote } = await resetModulesAndImport();
    const tickers = ["FAIL"];
    mockQuote.mockRejectedValueOnce(new Error("Timeout"));

    const result = await getPrezziMultipli(tickers);
    expect(result).toHaveProperty("prezzi");
    expect(result).toHaveProperty("timestamp");
    expect(result.prezzi["FAIL"]).toBeNull();
  });

  it("caches all-null result (avoids hammering Yahoo on consecutive errors)", async () => {
    const { getPrezziMultipli, mockQuote } = await resetModulesAndImport();
    const tickers = ["FAIL"];
    mockQuote.mockRejectedValue(new Error("Down"));

    const first = await getPrezziMultipli(tickers);

    // 30 s — still within TTL
    vi.advanceTimersByTime(30 * 1000);
    const second = await getPrezziMultipli(tickers);

    expect(mockQuote).toHaveBeenCalledTimes(1); // only the first call triggered a fetch
    expect(second.timestamp).toBe(first.timestamp);
  });
});

// ─── 4. Mixed batches (some succeed, some fail) ───────────────────────────────

describe("mixed batch results", () => {
  it("returns prices for successful batch and nulls for failed batch", async () => {
    const { getPrezziMultipli, mockQuote } = await resetModulesAndImport();
    const tickers = Array.from({ length: 12 }, (_, i) => `T${i}`);
    const batch1 = tickers.slice(0, 10);
    const batch2 = tickers.slice(10);

    mockQuote
      .mockResolvedValueOnce(buildQuoteObject(batch1, batch1.map(() => 50)))
      .mockRejectedValueOnce(new Error("Partial failure"));

    const result = await getPrezziMultipli(tickers);

    for (const t of batch1) {
      expect(result.prezzi[t]).toBe(50);
    }
    for (const t of batch2) {
      expect(result.prezzi[t]).toBeNull();
    }
  });
});

// ─── 5. Edge cases ────────────────────────────────────────────────────────────

describe("edge cases", () => {
  it("handles empty tickers array: returns empty prezzi Record without calling Yahoo", async () => {
    const { getPrezziMultipli, mockQuote } = await resetModulesAndImport();

    const result = await getPrezziMultipli([]);
    expect(mockQuote).not.toHaveBeenCalled();
    expect(result.prezzi).toEqual({});
  });

  it("returns null when Yahoo returns undefined regularMarketPrice for a ticker", async () => {
    const { getPrezziMultipli, mockQuote } = await resetModulesAndImport();
    const tickers = ["UNKNOWN"];
    mockQuote.mockResolvedValueOnce({ UNKNOWN: { regularMarketPrice: undefined } });

    const result = await getPrezziMultipli(tickers);
    expect(result.prezzi["UNKNOWN"]).toBeNull();
  });

  it("returns null when Yahoo omits the ticker key entirely from the response", async () => {
    const { getPrezziMultipli, mockQuote } = await resetModulesAndImport();
    const tickers = ["GHOST"];
    mockQuote.mockResolvedValueOnce({}); // no entry for "GHOST"

    const result = await getPrezziMultipli(tickers);
    expect(result.prezzi["GHOST"]).toBeNull();
  });

  it("timestamp is a positive number", async () => {
    const { getPrezziMultipli, mockQuote } = await resetModulesAndImport();
    const tickers = ["AAPL"];
    mockQuote.mockResolvedValueOnce(buildQuoteObject(tickers, [150]));

    const result = await getPrezziMultipli(tickers);
    expect(typeof result.timestamp).toBe("number");
    expect(result.timestamp).toBeGreaterThan(0);
  });

  it("returns prezzi Record with correct ticker key and price", async () => {
    const { getPrezziMultipli, mockQuote } = await resetModulesAndImport();
    const tickers = ["GOOG"];
    mockQuote.mockResolvedValueOnce(buildQuoteObject(tickers, [2800]));

    const result = await getPrezziMultipli(tickers);
    expect(result.prezzi).toHaveProperty("GOOG");
    expect(result.prezzi["GOOG"]).toBe(2800);
  });
});
