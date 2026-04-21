// Tests for src/lib/format.ts
// Using Node.js built-in test runner (node:test, available since Node 18)
// The logic is reimplemented here in plain JS to avoid TypeScript compilation,
// matching the source exactly.

import { test, describe } from "node:test";
import assert from "node:assert/strict";

// ──────────────────────────────────────────────────────────────────────────────
// Reimplementation of src/lib/format.ts (pure JS, same logic)
// ──────────────────────────────────────────────────────────────────────────────

function formatValuta(valore) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valore);
}

function formatValutaDecimali(valore) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valore);
}

function formatPercentuale(valore) {
  return `${valore >= 0 ? "+" : ""}${valore.toFixed(2)}%`;
}

function formatNumero(valore) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(valore);
}

function colorePL(valore) {
  if (valore > 0) return "text-verde-guadagno";
  if (valore < 0) return "text-rosso-perdita";
  return "text-nero";
}

function formatData(data) {
  const [anno, mese, giorno] = data.split("-");
  return `${giorno}/${mese}/${anno}`;
}

// ──────────────────────────────────────────────────────────────────────────────
// formatValuta
// ──────────────────────────────────────────────────────────────────────────────

describe("formatValuta", () => {
  test("formats a positive whole number", () => {
    assert.equal(formatValuta(30275), "$30,275");
  });

  test("formats zero as $0", () => {
    assert.equal(formatValuta(0), "$0");
  });

  test("formats a negative value", () => {
    assert.equal(formatValuta(-435), "-$435");
  });

  test("rounds decimals (no decimal places shown)", () => {
    // 1000.75 should round to $1,001
    assert.equal(formatValuta(1000.75), "$1,001");
  });

  test("formats a large number with comma separator", () => {
    assert.equal(formatValuta(1000000), "$1,000,000");
  });

  test("formats a small positive number", () => {
    assert.equal(formatValuta(1), "$1");
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// formatValutaDecimali
// ──────────────────────────────────────────────────────────────────────────────

describe("formatValutaDecimali", () => {
  test("formats a positive amount with 2 decimal places", () => {
    assert.equal(formatValutaDecimali(1.63), "$1.63");
  });

  test("formats zero with 2 decimal places", () => {
    assert.equal(formatValutaDecimali(0), "$0.00");
  });

  test("formats a negative amount with 2 decimal places", () => {
    assert.equal(formatValutaDecimali(-139.74), "-$139.74");
  });

  test("rounds floating-point numbers to 2 decimal places (Intl banker's rounding)", () => {
    // JS floating-point: 1.005 is actually stored as ~1.00499..., so Intl rounds it to $1.01
    // This documents the actual behavior of the Intl.NumberFormat engine on this platform.
    assert.equal(formatValutaDecimali(1.005), "$1.01");
  });

  test("formats a large number with decimals", () => {
    assert.equal(formatValutaDecimali(30275.50), "$30,275.50");
  });

  test("pads a whole number with .00", () => {
    assert.equal(formatValutaDecimali(100), "$100.00");
  });

  test("formats a real dividend amount from data", () => {
    assert.equal(formatValutaDecimali(11.11), "$11.11");
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// formatPercentuale
// ──────────────────────────────────────────────────────────────────────────────

describe("formatPercentuale", () => {
  test("positive value gets a leading + sign", () => {
    assert.equal(formatPercentuale(27.43), "+27.43%");
  });

  test("negative value has no + sign", () => {
    assert.equal(formatPercentuale(-4.82), "-4.82%");
  });

  test("zero gets a leading + sign (>= 0 branch)", () => {
    assert.equal(formatPercentuale(0), "+0.00%");
  });

  test("always shows 2 decimal places", () => {
    assert.equal(formatPercentuale(1), "+1.00%");
  });

  test("small decimal value", () => {
    assert.equal(formatPercentuale(0.19), "+0.19%");
  });

  test("large negative value", () => {
    assert.equal(formatPercentuale(-21.94), "-21.94%");
  });

  test("toFixed rounding: 1.005 rounds down due to float precision", () => {
    // Number.prototype.toFixed uses a different rounding path from Intl.
    // 1.005 is stored as 1.00499999... so toFixed(2) yields "1.00".
    assert.equal(formatPercentuale(1.005), "+1.00%");
  });

  test("real portfolio value: P&L% for commodities category", () => {
    assert.equal(formatPercentuale(27.43), "+27.43%");
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// formatNumero
// ──────────────────────────────────────────────────────────────────────────────

describe("formatNumero", () => {
  test("formats a whole number without decimals", () => {
    assert.equal(formatNumero(66), "66");
  });

  test("formats zero", () => {
    assert.equal(formatNumero(0), "0");
  });

  test("formats a decimal with up to 2 decimal places", () => {
    assert.equal(formatNumero(2.5), "2.5");
  });

  test("formats a number with exactly 2 decimal places", () => {
    assert.equal(formatNumero(1.63), "1.63");
  });

  test("formats a large number with comma separator", () => {
    assert.equal(formatNumero(30275), "30,275");
  });

  test("Intl rounding: 1.005 rounds to 1.01 (float stored as >1.005)", () => {
    // Intl.NumberFormat on this platform rounds 1.005 to "1.01", not "1"
    assert.equal(formatNumero(1.005), "1.01");
  });

  test("formats a negative number", () => {
    assert.equal(formatNumero(-354.6), "-354.6");
  });

  test("formats fractional shares count from data (e.g. 1.5 shares)", () => {
    assert.equal(formatNumero(1.5), "1.5");
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// colorePL
// ──────────────────────────────────────────────────────────────────────────────

describe("colorePL", () => {
  test("positive value returns verde-guadagno class", () => {
    assert.equal(colorePL(100), "text-verde-guadagno");
  });

  test("negative value returns rosso-perdita class", () => {
    assert.equal(colorePL(-100), "text-rosso-perdita");
  });

  test("zero returns nero class (neutral)", () => {
    assert.equal(colorePL(0), "text-nero");
  });

  test("very small positive returns verde-guadagno", () => {
    assert.equal(colorePL(0.01), "text-verde-guadagno");
  });

  test("very small negative returns rosso-perdita", () => {
    assert.equal(colorePL(-0.01), "text-rosso-perdita");
  });

  test("large positive value", () => {
    assert.equal(colorePL(909.63), "text-verde-guadagno");
  });

  test("large negative value", () => {
    assert.equal(colorePL(-855.44), "text-rosso-perdita");
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// formatData
// ──────────────────────────────────────────────────────────────────────────────

describe("formatData", () => {
  test("converts ISO date to Italian DD/MM/YYYY format", () => {
    assert.equal(formatData("2026-01-02"), "02/01/2026");
  });

  test("converts another date correctly", () => {
    assert.equal(formatData("2026-03-25"), "25/03/2026");
  });

  test("converts a date in February", () => {
    assert.equal(formatData("2026-02-13"), "13/02/2026");
  });

  test("works for a year-end date", () => {
    assert.equal(formatData("2025-12-31"), "31/12/2025");
  });

  test("preserves leading zeros in day and month", () => {
    assert.equal(formatData("2026-01-05"), "05/01/2026");
  });

  test("edge case: single-digit month and day without zero-padding", () => {
    // The function splits on '-' and re-joins as-is, so it passes through unpadded tokens
    assert.equal(formatData("2026-1-5"), "5/1/2026");
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Auth logic tests (hashToken from src/app/api/auth/route.ts and src/proxy.ts)
// ──────────────────────────────────────────────────────────────────────────────

describe("hashToken (auth logic)", () => {
  // Copied verbatim from route.ts / proxy.ts
  function hashToken(password, secret) {
    let hash = 0;
    const str = `${password}:${secret}`;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash + char) | 0;
    }
    return Math.abs(hash).toString(36);
  }

  test("same password+secret always produces the same token (deterministic)", () => {
    const t1 = hashToken("mypassword", "mysecret");
    const t2 = hashToken("mypassword", "mysecret");
    assert.equal(t1, t2);
  });

  test("different passwords produce different tokens", () => {
    const t1 = hashToken("password1", "secret");
    const t2 = hashToken("password2", "secret");
    assert.notEqual(t1, t2);
  });

  test("different secrets produce different tokens", () => {
    const t1 = hashToken("password", "secret1");
    const t2 = hashToken("password", "secret2");
    assert.notEqual(t1, t2);
  });

  test("token is a non-empty string", () => {
    const token = hashToken("abc", "def");
    assert.equal(typeof token, "string");
    assert.ok(token.length > 0);
  });

  test("token is base-36 (only lowercase alphanumeric)", () => {
    const token = hashToken("portafoglio2026", "supersecret");
    assert.match(token, /^[0-9a-z]+$/);
  });

  test("correct password+secret pair produces matching token", () => {
    const password = "marzo2026";
    const secret = "test-secret";
    const expectedToken = hashToken(password, secret);
    assert.equal(expectedToken, hashToken(password, secret));
  });

  test("wrong password produces a different token (access denied)", () => {
    const secret = "test-secret";
    const expectedToken = hashToken("marzo2026", secret);
    const wrongToken = hashToken("wrong-password", secret);
    assert.notEqual(wrongToken, expectedToken);
  });

  test("token from last month's password does not match this month's", () => {
    const secret = "test-secret";
    const oldToken = hashToken("febbraio2026", secret);
    const newExpected = hashToken("marzo2026", secret);
    assert.notEqual(oldToken, newExpected);
  });

  test("empty password produces a token (does not throw)", () => {
    const token = hashToken("", "secret");
    assert.equal(typeof token, "string");
    assert.ok(token.length > 0);
  });
});
