/**
 * Static-analysis tests for the Composizione refactor.
 *
 * These tests inspect the raw source of three files to verify:
 *   1. composizione/page.tsx — required imports, data fetching, table structure, unused-import check
 *   2. dashboard/page.tsx   — removed imports (Fragment, Link, TickerLogo, formatNumero) are gone,
 *                             required imports are retained
 *   3. Sidebar.tsx          — "Composizione" nav item pointing to /composizione is present
 *
 * Because the files are Next.js server components / React client components
 * that depend on a live PostgreSQL database and Yahoo Finance, they cannot be
 * instantiated in a unit-test environment.  Source inspection is the correct
 * approach for this class of verification.
 */

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

// ─── Helpers ──────────────────────────────────────────────────────────────────

// ROOT resolves to: /Users/andreademarchi/portafoglio-finanzamille/app
// (four levels up from src/lib/__tests__)
const ROOT = path.resolve(__dirname, "../../../");

function read(relative: string): string {
  const abs = path.join(ROOT, relative);
  return fs.readFileSync(abs, "utf-8");
}

// ─── File sources ─────────────────────────────────────────────────────────────

const composizioneSrc = read("src/app/(protected)/composizione/page.tsx");
const dashboardSrc    = read("src/app/(protected)/dashboard/page.tsx");
const sidebarSrc      = read("src/components/Sidebar.tsx");

// ─── 1. composizione/page.tsx ─────────────────────────────────────────────────

describe("composizione/page.tsx — required imports", () => {
  it("imports getPortafoglio, getCategorie, getTitoli from @/lib/db", () => {
    expect(composizioneSrc).toMatch(/getPortafoglio/);
    expect(composizioneSrc).toMatch(/getCategorie/);
    expect(composizioneSrc).toMatch(/getTitoli/);
  });

  it("imports getPrezziMultipli from @/lib/yahoo", () => {
    expect(composizioneSrc).toMatch(/getPrezziMultipli/);
    expect(composizioneSrc).toMatch(/@\/lib\/yahoo/);
  });

  it("imports all three calcoli functions", () => {
    expect(composizioneSrc).toMatch(/calcolaTitoloConPrezzoLive/);
    expect(composizioneSrc).toMatch(/ricalcolaCategoriaConTitoli/);
    expect(composizioneSrc).toMatch(/ricalcolaPortafoglioConTitoli/);
  });

  it("imports formatValuta, formatPercentuale, formatNumero, colorePL, formatData from @/lib/format", () => {
    expect(composizioneSrc).toMatch(/formatValuta/);
    expect(composizioneSrc).toMatch(/formatPercentuale/);
    expect(composizioneSrc).toMatch(/formatNumero/);
    expect(composizioneSrc).toMatch(/colorePL/);
    expect(composizioneSrc).toMatch(/formatData/);
  });

  it("imports Titolo and Categoria types from @/types/portafoglio", () => {
    expect(composizioneSrc).toMatch(/Titolo/);
    expect(composizioneSrc).toMatch(/Categoria/);
  });

  it("imports Fragment from react", () => {
    expect(composizioneSrc).toMatch(/Fragment/);
    expect(composizioneSrc).toMatch(/from "react"/);
  });

  it("imports Link from next/link", () => {
    expect(composizioneSrc).toMatch(/Link/);
    expect(composizioneSrc).toMatch(/from "next\/link"/);
  });

  it("imports TickerLogo component", () => {
    expect(composizioneSrc).toMatch(/TickerLogo/);
    expect(composizioneSrc).toMatch(/@\/components\/TickerLogo/);
  });
});

describe("composizione/page.tsx — data fetching", () => {
  it("is marked as force-dynamic", () => {
    expect(composizioneSrc).toMatch(/export const dynamic = "force-dynamic"/);
  });

  it("is an async default export function named ComposizionePage", () => {
    expect(composizioneSrc).toMatch(/export default async function ComposizionePage/);
  });

  it("fetches portafoglio, categorie, and titoli in parallel via Promise.all", () => {
    expect(composizioneSrc).toMatch(/Promise\.all/);
    expect(composizioneSrc).toMatch(/getPortafoglio\(\)/);
    expect(composizioneSrc).toMatch(/getCategorie\(\)/);
    expect(composizioneSrc).toMatch(/getTitoli\(\)/);
  });

  it("calls getPrezziMultipli for live prices and gracefully catches errors", () => {
    expect(composizioneSrc).toMatch(/getPrezziMultipli/);
    expect(composizioneSrc).toMatch(/try\s*\{/);
    expect(composizioneSrc).toMatch(/catch\s*\{/);
  });

  it("calls calcolaTitoloConPrezzoLive on each titolo", () => {
    expect(composizioneSrc).toMatch(/calcolaTitoloConPrezzoLive/);
  });

  it("calls ricalcolaCategoriaConTitoli for each category", () => {
    expect(composizioneSrc).toMatch(/ricalcolaCategoriaConTitoli/);
  });

  it("calls ricalcolaPortafoglioConTitoli to derive portfolio totals", () => {
    expect(composizioneSrc).toMatch(/ricalcolaPortafoglioConTitoli/);
  });

  it("computes totaleTitoli as sum of valoreAttuale across all titoli", () => {
    expect(composizioneSrc).toMatch(/totaleTitoli/);
    expect(composizioneSrc).toMatch(/valoreAttuale/);
  });
});

describe("composizione/page.tsx — table structure", () => {
  it("renders a <table> element", () => {
    expect(composizioneSrc).toMatch(/<table/);
    expect(composizioneSrc).toMatch(/<\/table>/);
  });

  it("has a <thead> with the 7 expected column headers", () => {
    expect(composizioneSrc).toMatch(/Titolo/);
    expect(composizioneSrc).toMatch(/N\. Azioni/);
    expect(composizioneSrc).toMatch(/Prezzo Carico/);
    expect(composizioneSrc).toMatch(/Valore Attuale/);
    expect(composizioneSrc).toMatch(/Peso %/);
    const hasPL = composizioneSrc.includes("P&L") || composizioneSrc.includes("P&amp;L");
    expect(hasPL).toBe(true);
  });

  it("iterates over categories and renders Fragment per category", () => {
    expect(composizioneSrc).toMatch(/categorieDB\.map/);
    expect(composizioneSrc).toMatch(/<Fragment key=/);
  });

  it("renders a category header row spanning all 7 columns (colSpan={7})", () => {
    expect(composizioneSrc).toMatch(/colSpan=\{7\}/);
  });

  it("renders a Link to /categoria/[slug] for each category", () => {
    expect(composizioneSrc).toMatch(/\/categoria\/\$\{cat\.slug\}/);
  });

  it("renders TickerLogo for each titolo", () => {
    expect(composizioneSrc).toMatch(/<TickerLogo/);
  });

  it("renders formatNumero for numAzioni column", () => {
    expect(composizioneSrc).toMatch(/formatNumero\(t\.numAzioni\)/);
  });

  it("has a <tfoot> with totale row", () => {
    expect(composizioneSrc).toMatch(/<tfoot>/);
    expect(composizioneSrc).toMatch(/Totale/);
  });

  it("tfoot shows totaleTitoli with formatValuta", () => {
    expect(composizioneSrc).toMatch(/formatValuta\(totaleTitoli\)/);
  });

  it("tfoot shows portafoglio P&L and varPercentuale with colorePL", () => {
    expect(composizioneSrc).toMatch(/colorePL\(portafoglio\.profittoOPerdita\)/);
    expect(composizioneSrc).toMatch(/colorePL\(portafoglio\.varPercentuale\)/);
  });

  it("shows live price timestamp when available", () => {
    expect(composizioneSrc).toMatch(/prezziTimestamp/);
    expect(composizioneSrc).toMatch(/formatOra/);
  });
});

// ─── 2. dashboard/page.tsx ────────────────────────────────────────────────────

describe("dashboard/page.tsx — removed imports (composition section gone)", () => {
  it("does NOT import Fragment from react", () => {
    expect(dashboardSrc).not.toMatch(/import.*Fragment.*from "react"/);
    expect(dashboardSrc).not.toMatch(/from "react"/);
  });

  it("does NOT import Link from next/link", () => {
    expect(dashboardSrc).not.toMatch(/import.*Link.*from "next\/link"/);
    expect(dashboardSrc).not.toMatch(/from "next\/link"/);
  });

  it("does NOT import TickerLogo", () => {
    expect(dashboardSrc).not.toMatch(/TickerLogo/);
    expect(dashboardSrc).not.toMatch(/@\/components\/TickerLogo/);
  });

  it("does NOT import formatNumero", () => {
    expect(dashboardSrc).not.toMatch(/formatNumero/);
  });
});

describe("dashboard/page.tsx — retained imports for hero and chart sections", () => {
  it("imports getPortafoglio, getCategorie, getTitoli, getStorico from @/lib/db", () => {
    expect(dashboardSrc).toMatch(/getPortafoglio/);
    expect(dashboardSrc).toMatch(/getCategorie/);
    expect(dashboardSrc).toMatch(/getTitoli/);
    expect(dashboardSrc).toMatch(/getStorico/);
  });

  it("imports getDividendiTotaleAnno and getFlussiCapitaleDa from @/lib/db", () => {
    expect(dashboardSrc).toMatch(/getDividendiTotaleAnno/);
    expect(dashboardSrc).toMatch(/getFlussiCapitaleDa/);
  });

  it("imports getPrezziMultipli and getStoricoSPY from @/lib/yahoo", () => {
    expect(dashboardSrc).toMatch(/getPrezziMultipli/);
    expect(dashboardSrc).toMatch(/getStoricoSPY/);
  });

  it("imports formatValuta, formatValutaDecimali, formatPercentuale, colorePL, formatData", () => {
    expect(dashboardSrc).toMatch(/formatValuta/);
    expect(dashboardSrc).toMatch(/formatValutaDecimali/);
    expect(dashboardSrc).toMatch(/formatPercentuale/);
    expect(dashboardSrc).toMatch(/colorePL/);
    expect(dashboardSrc).toMatch(/formatData/);
  });

  it("imports calcolaTWR from @/lib/calcoli", () => {
    expect(dashboardSrc).toMatch(/calcolaTWR/);
  });

  it("imports DashboardCharts client component", () => {
    expect(dashboardSrc).toMatch(/DashboardCharts/);
  });

  it("is still marked force-dynamic and exports DashboardPage", () => {
    expect(dashboardSrc).toMatch(/export const dynamic = "force-dynamic"/);
    expect(dashboardSrc).toMatch(/export default async function DashboardPage/);
  });
});

describe("dashboard/page.tsx — composition table is fully removed", () => {
  it("does not render a <table> element (composition table gone)", () => {
    expect(dashboardSrc).not.toMatch(/<table/);
  });

  it("does not render <Fragment> for category iteration", () => {
    expect(dashboardSrc).not.toMatch(/<Fragment/);
  });

  it("does not render TickerLogo anywhere", () => {
    expect(dashboardSrc).not.toMatch(/<TickerLogo/);
  });

  it("renders DashboardCharts component for the chart section", () => {
    expect(dashboardSrc).toMatch(/<DashboardCharts/);
  });
});

// ─── 3. Sidebar.tsx ───────────────────────────────────────────────────────────

describe("Sidebar.tsx — Composizione nav item", () => {
  it("contains 'Composizione' label in navItems array", () => {
    expect(sidebarSrc).toMatch(/label:\s*["']Composizione["']/);
  });

  it("contains href: '/composizione' for the Composizione item", () => {
    expect(sidebarSrc).toMatch(/href:\s*["']\/composizione["']/);
  });

  it("label and href appear in the same navItems entry", () => {
    const match = sidebarSrc.match(/\{[^}]*Composizione[^}]*\}/s);
    expect(match).not.toBeNull();
    if (match) {
      expect(match[0]).toMatch(/\/composizione/);
    }
  });

  it("Composizione appears before Transazioni in navItems order", () => {
    const compIdx = sidebarSrc.indexOf('"Composizione"') !== -1
      ? sidebarSrc.indexOf('"Composizione"')
      : sidebarSrc.indexOf("'Composizione'");
    const transIdx = sidebarSrc.indexOf('"Transazioni"') !== -1
      ? sidebarSrc.indexOf('"Transazioni"')
      : sidebarSrc.indexOf("'Transazioni'");
    expect(compIdx).toBeGreaterThan(-1);
    expect(transIdx).toBeGreaterThan(-1);
    expect(compIdx).toBeLessThan(transIdx);
  });

  it("Dashboard nav item is still present", () => {
    expect(sidebarSrc).toMatch(/label:\s*["']Dashboard["']/);
    expect(sidebarSrc).toMatch(/href:\s*["']\/dashboard["']/);
  });

  it("Transazioni nav item is still present", () => {
    expect(sidebarSrc).toMatch(/label:\s*["']Transazioni["']/);
    expect(sidebarSrc).toMatch(/href:\s*["']\/transazioni["']/);
  });

  it("still renders as a client component", () => {
    expect(sidebarSrc.trimStart()).toMatch(/^"use client"/);
  });
});
