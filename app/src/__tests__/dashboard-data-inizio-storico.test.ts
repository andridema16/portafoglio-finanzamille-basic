/**
 * Tests for dashboard refactor:
 *
 * 1. dataInizioStorico calculation (dashboard/page.tsx):
 *    - When storico has entries → use storico[0].data (earliest date)
 *    - When storico is empty   → fallback to portafoglioDB.dataInizio
 *
 * 2. DashboardCharts Props interface (DashboardCharts.tsx):
 *    - Only storicoPortafoglio and storicoSPY (no dataInizioAnno)
 *
 * 3. GraficoComparativo Props interface (GraficoComparativo.tsx):
 *    - Only storicoPortafoglio and storicoSPY (no dataInizioAnno)
 *    - Toggle "2026"/"2025" gestito internamente
 *
 * Because DashboardCharts and GraficoComparativo are "use client" React
 * components and this vitest environment uses environment: "node" (no jsdom),
 * we cannot render them.  Instead we:
 *   a) Test the pure dataInizioStorico logic directly (extracted inline).
 *   b) Inspect the module's TypeScript source to confirm interface shapes
 *      as a static analysis check (via reading the file content at runtime).
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

// ---------------------------------------------------------------------------
// Helper — read source file as text for interface-shape assertions
// ---------------------------------------------------------------------------

const SRC = resolve(__dirname, "..");

function readSource(relativePath: string): string {
  return readFileSync(resolve(SRC, relativePath), "utf-8");
}

// ---------------------------------------------------------------------------
// 1. dataInizioStorico logic
//    Extracted from dashboard/page.tsx line 54 as a pure function so it can
//    be tested in isolation without instantiating the full Next.js page.
// ---------------------------------------------------------------------------

interface PuntoStorico {
  data: string;
  valore: number;
}

interface Portafoglio {
  dataInizio: string;
  [key: string]: unknown;
}

/** Mirror of the line introduced in page.tsx */
function calcolaDataInizioStorico(
  storico: PuntoStorico[],
  portafoglioDB: Portafoglio
): string {
  return storico.length > 0 ? storico[0].data : portafoglioDB.dataInizio;
}

describe("dataInizioStorico — calcolo data più vecchia dello storico", () => {
  it("usa la prima data dello storico quando ci sono dati", () => {
    const storico: PuntoStorico[] = [
      { data: "2026-01-02", valore: 30775 },
      { data: "2026-02-01", valore: 31000 },
      { data: "2026-03-01", valore: 30500 },
    ];
    const portafoglioDB: Portafoglio = { dataInizio: "2026-01-01" };

    const risultato = calcolaDataInizioStorico(storico, portafoglioDB);
    expect(risultato).toBe("2026-01-02");
  });

  it("usa storico[0].data (il primo elemento, non il minimo calcolato)", () => {
    // The implementation picks index 0, not a min() over all dates.
    // Storico is expected to be ordered ascending, so [0] is the earliest.
    const storico: PuntoStorico[] = [
      { data: "2026-01-05", valore: 30000 },
      { data: "2026-01-02", valore: 29000 }, // intentionally out of order
    ];
    const portafoglioDB: Portafoglio = { dataInizio: "2025-12-31" };

    const risultato = calcolaDataInizioStorico(storico, portafoglioDB);
    // Must be the first element's data regardless of ordering
    expect(risultato).toBe("2026-01-05");
  });

  it("usa portafoglioDB.dataInizio come fallback quando lo storico è vuoto", () => {
    const storico: PuntoStorico[] = [];
    const portafoglioDB: Portafoglio = { dataInizio: "2026-01-02" };

    const risultato = calcolaDataInizioStorico(storico, portafoglioDB);
    expect(risultato).toBe("2026-01-02");
  });

  it("restituisce la data corretta con storico di un solo punto", () => {
    const storico: PuntoStorico[] = [{ data: "2026-03-25", valore: 30275 }];
    const portafoglioDB: Portafoglio = { dataInizio: "2026-01-01" };

    const risultato = calcolaDataInizioStorico(storico, portafoglioDB);
    expect(risultato).toBe("2026-03-25");
  });

  it("non modifica portafoglioDB.dataInizio (nessun side effect)", () => {
    const storico: PuntoStorico[] = [];
    const portafoglioDB: Portafoglio = { dataInizio: "2026-01-02" };

    calcolaDataInizioStorico(storico, portafoglioDB);

    expect(portafoglioDB.dataInizio).toBe("2026-01-02");
  });

  it("restituisce una stringa in ogni caso", () => {
    const withData = calcolaDataInizioStorico(
      [{ data: "2026-01-02", valore: 100 }],
      { dataInizio: "2026-01-01" }
    );
    const withoutData = calcolaDataInizioStorico([], { dataInizio: "2026-01-01" });

    expect(typeof withData).toBe("string");
    expect(typeof withoutData).toBe("string");
  });

  it("fallback preserva esattamente il formato YYYY-MM-DD di dataInizio", () => {
    const storico: PuntoStorico[] = [];
    const portafoglioDB: Portafoglio = { dataInizio: "2026-01-02" };

    const risultato = calcolaDataInizioStorico(storico, portafoglioDB);
    expect(risultato).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

// ---------------------------------------------------------------------------
// 2. DashboardCharts — interfaccia Props NON contiene dataInizioAnno
// ---------------------------------------------------------------------------

describe("DashboardCharts — interfaccia Props", () => {
  it("il file sorgente NON dichiara dataInizioAnno nell'interfaccia Props", () => {
    const src = readSource("app/(protected)/dashboard/DashboardCharts.tsx");
    expect(src).not.toMatch(/dataInizioAnno/);
  });

  it("l'interfaccia Props contiene solo storicoPortafoglio e storicoSPY", () => {
    const src = readSource("app/(protected)/dashboard/DashboardCharts.tsx");
    expect(src).toMatch(/storicoPortafoglio\s*:\s*PuntoStorico\[\]/);
    expect(src).toMatch(/storicoSPY\s*:\s*PuntoStorico\[\]/);
  });
});

// ---------------------------------------------------------------------------
// 3. GraficoComparativo — interfaccia Props NON contiene dataInizioAnno
// ---------------------------------------------------------------------------

describe("GraficoComparativo — interfaccia Props", () => {
  it("il file sorgente NON dichiara dataInizioAnno nell'interfaccia Props", () => {
    const src = readSource("components/charts/GraficoComparativo.tsx");
    expect(src).not.toMatch(/dataInizioAnno/);
  });

  it("il file sorgente esporta una funzione default (componente React)", () => {
    const src = readSource("components/charts/GraficoComparativo.tsx");
    expect(src).toMatch(/export\s+default\s+function\s+GraficoComparativo/);
  });

  it("l'interfaccia Props include sia storicoPortafoglio che storicoSPY", () => {
    const src = readSource("components/charts/GraficoComparativo.tsx");
    expect(src).toMatch(/storicoPortafoglio\s*:\s*PuntoStorico\[\]/);
    expect(src).toMatch(/storicoSPY\s*:\s*PuntoStorico\[\]/);
  });

  it("usa toggle 2026/2025 invece di ytd/completo", () => {
    const src = readSource("components/charts/GraficoComparativo.tsx");
    expect(src).toMatch(/useState<"2026" \| "2025">/);
    expect(src).not.toMatch(/ytd/);
    expect(src).not.toMatch(/completo/);
  });
});

// ---------------------------------------------------------------------------
// 4. dashboard/page.tsx — NON passa dataInizioAnno a DashboardCharts
// ---------------------------------------------------------------------------

describe("dashboard/page.tsx — passaggio prop a DashboardCharts", () => {
  it("NON passa dataInizioAnno a DashboardCharts", () => {
    const src = readSource("app/(protected)/dashboard/page.tsx");
    expect(src).not.toMatch(/dataInizioAnno/);
  });

  it("calcola dataInizioStorico prima del fetch di SPY", () => {
    const src = readSource("app/(protected)/dashboard/page.tsx");
    expect(src).toMatch(/dataInizioStorico/);
    expect(src).toMatch(/getStoricoSPY\(dataInizioStorico\)/);
  });

  it("usa storico[0].data con fallback a portafoglioDB.dataInizio", () => {
    const src = readSource("app/(protected)/dashboard/page.tsx");
    expect(src).toMatch(/storico\.length\s*>\s*0\s*\?\s*storico\[0\]\.data\s*:\s*portafoglioDB\.dataInizio/);
  });
});
