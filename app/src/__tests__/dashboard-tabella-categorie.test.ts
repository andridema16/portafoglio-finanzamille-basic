/**
 * Static source checks for the refactored "Composizione Portafoglio" table
 * in dashboard/page.tsx.
 *
 * Changes verified:
 *  - Fragment imported from "react"
 *  - Column "Categoria" removed from thead (now 7 columns)
 *  - thead has exactly: Titolo, N. Azioni, Prezzo Carico, Valore Attuale, Peso %, P&L, P&L %
 *  - tbody iterates with categorieDB.map (not titoliTyped.map)
 *  - <Fragment key={cat.id}> used for grouping
 *  - bg-verde-scuro on category header rows
 *  - colSpan={7} spans all columns in the category header row
 *  - tfoot uses colSpan={3} (not colSpan={2})
 *  - catInfo variable removed
 *  - pesoPortafoglio removed (uses t.pesoPercentuale instead)
 *  - t.pesoPercentuale.toFixed(2) used for per-title weight
 *  - Link to /categoria/${cat.slug} inside category header row
 *  - TickerLogo in the title column of each row
 *
 * Strategy: parse raw TypeScript source text — same approach as the other
 * source-level test files in this project.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const SRC = resolve(__dirname, "..");

function read(relativePath: string): string {
  return readFileSync(resolve(SRC, relativePath), "utf-8");
}

const src = read("app/(protected)/dashboard/page.tsx");

// ---------------------------------------------------------------------------
// 1. Imports
// ---------------------------------------------------------------------------

describe("dashboard/page.tsx — imports", () => {
  it("imports Fragment from 'react'", () => {
    // Must have: import { ... Fragment ... } from "react"
    expect(src).toMatch(/import\s*\{[^}]*\bFragment\b[^}]*\}\s*from\s*["']react["']/);
  });

  it("imports Link from 'next/link'", () => {
    expect(src).toContain('from "next/link"');
  });

  it("imports TickerLogo from '@/components/TickerLogo'", () => {
    expect(src).toContain('from "@/components/TickerLogo"');
  });
});

// ---------------------------------------------------------------------------
// 2. thead — 7 columns, no "Categoria" column
// ---------------------------------------------------------------------------

describe("dashboard/page.tsx — thead structure", () => {
  it("does NOT contain a 'Categoria' column header", () => {
    // The old table had a <th> with text "Categoria"; it must be gone
    expect(src).not.toMatch(/<th[^>]*>\s*Categoria\s*<\/th>/);
  });

  it("contains the 'Titolo' column header", () => {
    expect(src).toMatch(/<th[^>]*>\s*Titolo\s*<\/th>/);
  });

  it("contains the 'N. Azioni' column header", () => {
    expect(src).toMatch(/<th[^>]*>N\. Azioni<\/th>/);
  });

  it("contains the 'Prezzo Carico' column header", () => {
    expect(src).toMatch(/<th[^>]*>Prezzo Carico<\/th>/);
  });

  it("contains the 'Valore Attuale' column header", () => {
    expect(src).toMatch(/<th[^>]*>Valore Attuale<\/th>/);
  });

  it("contains the 'Peso %' column header", () => {
    expect(src).toMatch(/<th[^>]*>Peso %<\/th>/);
  });

  it("contains the 'P&L' column header (plain, not 'P&L %')", () => {
    // There must be a <th> whose text is exactly P&L (the non-% one)
    expect(src).toMatch(/<th[^>]*>P&amp;L<\/th>|<th[^>]*>\{["']P&L["']\}<\/th>|<th[^>]*>P&L<\/th>/);
  });

  it("contains the 'P&L %' column header", () => {
    expect(src).toMatch(/P&L %/);
  });

  it("has exactly 7 <th> elements in the thead", () => {
    // Extract the thead block and count <th occurrences
    const theadMatch = src.match(/<thead[\s\S]*?<\/thead>/);
    expect(theadMatch).not.toBeNull();
    const thead = theadMatch![0];
    const thCount = (thead.match(/<th\b/g) ?? []).length;
    expect(thCount).toBe(7);
  });
});

// ---------------------------------------------------------------------------
// 3. tbody — iteration per category, Fragment grouping
// ---------------------------------------------------------------------------

describe("dashboard/page.tsx — tbody structure", () => {
  it("iterates with categorieDB.map in the tbody", () => {
    expect(src).toContain("categorieDB.map");
  });

  it("uses <Fragment key={cat.id}> for category grouping", () => {
    expect(src).toMatch(/<Fragment\s+key=\{cat\.id\}/);
  });

  it("uses bg-verde-scuro for category header rows", () => {
    expect(src).toContain("bg-verde-scuro");
  });

  it("uses colSpan={7} on the category header <td>", () => {
    expect(src).toContain("colSpan={7}");
  });

  it("renders a Link to /categoria/${cat.slug} in the category header", () => {
    expect(src).toContain("/categoria/${cat.slug}");
  });

  it("renders TickerLogo in the title column", () => {
    expect(src).toMatch(/<TickerLogo/);
    // Specifically called with ticker={t.ticker}
    expect(src).toContain("ticker={t.ticker}");
  });

  it("uses t.pesoPercentuale.toFixed(2) for the per-title weight cell", () => {
    expect(src).toContain("t.pesoPercentuale.toFixed(2)");
  });
});

// ---------------------------------------------------------------------------
// 4. tfoot — colSpan={3}
// ---------------------------------------------------------------------------

describe("dashboard/page.tsx — tfoot structure", () => {
  it("uses colSpan={3} in the tfoot totale row", () => {
    // Extract tfoot block and verify colSpan={3}
    const tfootMatch = src.match(/<tfoot[\s\S]*?<\/tfoot>/);
    expect(tfootMatch).not.toBeNull();
    const tfoot = tfootMatch![0];
    expect(tfoot).toContain("colSpan={3}");
  });

  it("does NOT use colSpan={2} anywhere in the tfoot", () => {
    const tfootMatch = src.match(/<tfoot[\s\S]*?<\/tfoot>/);
    expect(tfootMatch).not.toBeNull();
    const tfoot = tfootMatch![0];
    expect(tfoot).not.toContain("colSpan={2}");
  });
});

// ---------------------------------------------------------------------------
// 5. Removed variables / patterns
// ---------------------------------------------------------------------------

describe("dashboard/page.tsx — removed variables", () => {
  it("does NOT contain the variable catInfo", () => {
    expect(src).not.toContain("catInfo");
  });

  it("does NOT contain pesoPortafoglio", () => {
    expect(src).not.toContain("pesoPortafoglio");
  });
});
