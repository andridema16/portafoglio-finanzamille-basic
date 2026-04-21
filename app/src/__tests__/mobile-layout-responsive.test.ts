/**
 * QA: Mobile layout responsive structure checks
 *
 * These tests parse the raw TSX source as text to verify structural correctness
 * of the Trade Republic-style mobile layouts added to three pages.
 *
 * Checks:
 * 1. Responsive class pairing: md:hidden (mobile) and hidden md:block (desktop)
 * 2. Key props present on all mapped elements
 * 3. Both views expose the same core data fields
 * 4. JSX tag balance (div open/close count parity)
 * 5. Desktop view is not stripped of its columns
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, test, expect, beforeAll } from "vitest";

const ROOT = resolve(__dirname, "../app/(protected)/[portfolio]");

const FILES = {
  dashboard: resolve(ROOT, "dashboard/page.tsx"),
  composizione: resolve(ROOT, "composizione/page.tsx"),
  categoria: resolve(ROOT, "categoria/[slug]/page.tsx"),
};

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────

function readSrc(filePath: string): string {
  return readFileSync(filePath, "utf-8");
}

function countOccurrences(source: string, needle: string): number {
  let count = 0;
  let pos = 0;
  while ((pos = source.indexOf(needle, pos)) !== -1) {
    count++;
    pos += needle.length;
  }
  return count;
}

/** Count open and close tags for a given HTML element name */
function countOpenClose(source: string, tag: string): { open: number; close: number } {
  const openRe = new RegExp(`<${tag}[\\s>/]`, "g");
  const closeRe = new RegExp(`</${tag}>`, "g");
  return {
    open: (source.match(openRe) ?? []).length,
    close: (source.match(closeRe) ?? []).length,
  };
}

/** Extract the mobile section (between md:hidden and hidden md:block) */
function mobilePart(src: string): string {
  const start = src.indexOf("md:hidden");
  const end = src.indexOf("hidden md:block");
  if (start === -1 || end === -1 || start >= end) return "";
  return src.slice(start, end);
}

/** Extract the desktop section (from hidden md:block onwards) */
function desktopPart(src: string): string {
  const start = src.indexOf("hidden md:block");
  if (start === -1) return "";
  return src.slice(start);
}

// ────────────────────────────────────────────────────────────────
// dashboard/page.tsx
// ────────────────────────────────────────────────────────────────

describe("dashboard/page.tsx — mobile layout", () => {
  let src: string;
  let mobile: string;
  let desktop: string;
  beforeAll(() => {
    src = readSrc(FILES.dashboard);
    mobile = mobilePart(src);
    desktop = desktopPart(src);
  });

  test("has exactly one md:hidden mobile block", () => {
    expect(countOccurrences(src, "md:hidden")).toBe(1);
  });

  test("has exactly one hidden md:block desktop block", () => {
    expect(countOccurrences(src, "hidden md:block")).toBe(1);
  });

  test("mobile block appears before desktop block in source", () => {
    expect(src.indexOf("md:hidden")).toBeLessThan(src.indexOf("hidden md:block"));
  });

  test("mobile view renders category name", () => {
    expect(mobile).toContain("cat.nome");
  });

  test("mobile view renders category value", () => {
    expect(mobile).toContain("cat.valoreAttuale");
  });

  test("mobile view renders P&L percentage", () => {
    expect(mobile).toContain("cat.plPercentuale");
  });

  test("mobile view renders weight percentage", () => {
    expect(mobile).toContain("pesoPercentuale");
  });

  test("mobile card items have key prop", () => {
    expect(mobile).toContain("key={cat.id}");
  });

  test("mobile card links to category detail page", () => {
    expect(mobile).toContain("categoria");
    expect(mobile).toContain("cat.slug");
  });

  test("desktop view renders same core data fields as mobile", () => {
    expect(desktop).toContain("cat.nome");
    expect(desktop).toContain("cat.valoreAttuale");
    expect(desktop).toContain("cat.plPercentuale");
    expect(desktop).toContain("pesoPercentuale");
  });

  test("desktop table rows have key prop", () => {
    expect(desktop).toContain("key={cat.id}");
  });

  test("desktop table has all five header columns", () => {
    expect(desktop).toContain("Categoria");
    expect(desktop).toContain("Peso %");
    expect(desktop).toContain("Valore");
  });

  test("div tags are balanced", () => {
    const { open, close } = countOpenClose(src, "div");
    expect(open).toBe(close);
  });
});

// ────────────────────────────────────────────────────────────────
// composizione/page.tsx
// ────────────────────────────────────────────────────────────────

describe("composizione/page.tsx — mobile layout", () => {
  let src: string;
  let mobile: string;
  let desktop: string;
  beforeAll(() => {
    src = readSrc(FILES.composizione);
    mobile = mobilePart(src);
    desktop = desktopPart(src);
  });

  test("has exactly one md:hidden mobile block", () => {
    expect(countOccurrences(src, "md:hidden")).toBe(1);
  });

  test("has exactly one hidden md:block desktop block", () => {
    expect(countOccurrences(src, "hidden md:block")).toBe(1);
  });

  test("mobile block appears before desktop block in source", () => {
    expect(src.indexOf("md:hidden")).toBeLessThan(src.indexOf("hidden md:block"));
  });

  test("mobile view shows a Totale summary row", () => {
    expect(mobile).toContain("Totale");
  });

  test("mobile view shows total value (totaleTitoli)", () => {
    expect(mobile).toContain("totaleTitoli");
  });

  test("mobile view shows portfolio P&L percentage", () => {
    expect(mobile).toContain("portafoglio.varPercentuale");
  });

  test("mobile view shows category name", () => {
    expect(mobile).toContain("cat.nome");
  });

  test("mobile view shows category value", () => {
    expect(mobile).toContain("cat.valoreAttuale");
  });

  test("mobile view shows TickerLogo component", () => {
    expect(mobile).toContain("TickerLogo");
  });

  test("mobile view shows ticker symbol", () => {
    expect(mobile).toContain("t.ticker");
  });

  test("mobile view shows P&L percentage per ticker", () => {
    expect(mobile).toContain("plPercentuale");
  });

  test("mobile ticker rows have key prop (t.ticker)", () => {
    expect(mobile).toContain("key={t.ticker}");
  });

  test("mobile category sections use Fragment with key for categories", () => {
    expect(mobile).toContain("key={cat.id}");
  });

  test("mobile category headers link to category detail page", () => {
    expect(mobile).toContain("cat.slug");
  });

  test("desktop table has all required column headers", () => {
    expect(desktop).toContain("N. Azioni");
    expect(desktop).toContain("Prezzo Carico");
    expect(desktop).toContain("Valore Attuale");
    expect(desktop).toContain("Dividendi");
  });

  test("desktop view shows TickerLogo component", () => {
    expect(desktop).toContain("TickerLogo");
  });

  test("desktop total row uses formatValutaDecimali for dividendi sum", () => {
    expect(desktop).toContain("formatValutaDecimali");
  });

  test("desktop table rows have key prop", () => {
    expect(desktop).toContain("key={t.ticker}");
  });

  test("div tags are balanced", () => {
    const { open, close } = countOpenClose(src, "div");
    expect(open).toBe(close);
  });
});

// ────────────────────────────────────────────────────────────────
// categoria/[slug]/page.tsx
// ────────────────────────────────────────────────────────────────

describe("categoria/[slug]/page.tsx — mobile layout", () => {
  let src: string;
  let mobile: string;
  let desktop: string;
  beforeAll(() => {
    src = readSrc(FILES.categoria);
    mobile = mobilePart(src);
    desktop = desktopPart(src);
  });

  test("has exactly one md:hidden mobile block", () => {
    expect(countOccurrences(src, "md:hidden")).toBe(1);
  });

  test("has exactly one hidden md:block desktop block", () => {
    expect(countOccurrences(src, "hidden md:block")).toBe(1);
  });

  test("mobile block appears before desktop block in source", () => {
    expect(src.indexOf("md:hidden")).toBeLessThan(src.indexOf("hidden md:block"));
  });

  test("mobile total row shows total value (totaleValore)", () => {
    expect(mobile).toContain("totaleValore");
  });

  test("mobile total row shows total P&L percentage (totalePLPerc)", () => {
    expect(mobile).toContain("totalePLPerc");
  });

  // The mobile total row shows totaleCosto and totaleDividendi in the subtitle
  // (space-efficient design: no weight % in mobile summary)
  test("mobile total row shows totaleCosto in subtitle line", () => {
    expect(mobile).toContain("totaleCosto");
  });

  test("mobile total row shows totaleDividendi in subtitle line", () => {
    expect(mobile).toContain("totaleDividendi");
  });

  test("mobile total row uses formatValutaDecimali for P&L value", () => {
    expect(mobile).toContain("formatValutaDecimali");
  });

  test("mobile ticker rows show TickerLogo", () => {
    expect(mobile).toContain("TickerLogo");
  });

  test("mobile ticker rows show ticker symbol", () => {
    expect(mobile).toContain("titolo.ticker");
  });

  test("mobile ticker rows show current value", () => {
    expect(mobile).toContain("titolo.valoreAttuale");
  });

  test("mobile ticker rows show P&L percentage", () => {
    expect(mobile).toContain("titolo.plPercentuale");
  });

  test("mobile ticker rows have key prop (titolo.ticker)", () => {
    expect(mobile).toContain("key={titolo.ticker}");
  });

  test("desktop table has a tfoot with totals", () => {
    expect(desktop).toContain("<tfoot>");
    expect(desktop).toContain("</tfoot>");
  });

  test("desktop tfoot shows totaleCosto", () => {
    expect(desktop).toContain("totaleCosto");
  });

  test("desktop tfoot shows totaleDividendi", () => {
    expect(desktop).toContain("totaleDividendi");
  });

  test("desktop tfoot shows totalePL", () => {
    expect(desktop).toContain("totalePL");
  });

  test("desktop tfoot shows totalePesoPortafoglio", () => {
    expect(desktop).toContain("totalePesoPortafoglio");
  });

  test("desktop table has all required column headers", () => {
    expect(desktop).toContain("N. Azioni");
    expect(desktop).toContain("Prezzo Carico");
    expect(desktop).toContain("Valore Attuale");
    expect(desktop).toContain("Dividendi");
    expect(desktop).toContain("Costo");
    expect(desktop).toContain("Peso %");
  });

  test("desktop table rows have key prop (titolo.ticker)", () => {
    expect(desktop).toContain("key={titolo.ticker}");
  });

  test("div tags are balanced", () => {
    const { open, close } = countOpenClose(src, "div");
    expect(open).toBe(close);
  });
});

// ────────────────────────────────────────────────────────────────
// Cross-file: both views must expose identical core fields
// ────────────────────────────────────────────────────────────────

describe("data parity — same core fields in mobile and desktop views", () => {
  const cases: Array<{ label: string; file: keyof typeof FILES; fields: string[] }> = [
    {
      label: "dashboard",
      file: "dashboard",
      fields: ["cat.nome", "cat.valoreAttuale", "cat.plPercentuale", "pesoPercentuale"],
    },
    {
      label: "composizione",
      file: "composizione",
      fields: ["t.ticker", "t.valoreAttuale", "plPercentuale"],
    },
    {
      label: "categoria",
      file: "categoria",
      fields: ["titolo.ticker", "titolo.valoreAttuale", "titolo.plPercentuale"],
    },
  ];

  for (const { label, file, fields } of cases) {
    describe(`[${label}]`, () => {
      let mobile: string;
      let desktop: string;
      beforeAll(() => {
        const src = readSrc(FILES[file]);
        mobile = mobilePart(src);
        desktop = desktopPart(src);
      });

      for (const field of fields) {
        test(`field "${field}" present in mobile view`, () => {
          expect(mobile).toContain(field);
        });
        test(`field "${field}" present in desktop view`, () => {
          expect(desktop).toContain(field);
        });
      }
    });
  }
});
