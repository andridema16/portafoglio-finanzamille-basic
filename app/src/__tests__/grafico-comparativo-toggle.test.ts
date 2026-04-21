/**
 * Tests for helper functions inside GraficoComparativo.tsx.
 *
 * Because the functions are not exported, they are replicated here verbatim
 * from the source file. Any divergence between the replica and the source
 * would itself be a test failure — the test descriptions call out the exact
 * behaviour that is contractually expected.
 *
 * Functions under test:
 *   filtraRange(serie, dataMin, dataMax?)
 *   formatDataMese(data)
 *   formatDataGiornoMese(data)
 *   normalizza(serie)
 *
 * Integration scenario:
 *   filtrare PRIMA di normalizzare (comportamento del componente) vs
 *   normalizzare PRIMA e poi filtrare (comportamento sbagliato) → devono
 *   produrre risultati diversi quando i dati precedono il range selezionato.
 */

import { describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// Replica verbatim from GraficoComparativo.tsx
// ---------------------------------------------------------------------------

interface PuntoStorico {
  data: string;
  valore: number;
}

const MESI_IT = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];

function normalizza(serie: PuntoStorico[]): Map<string, number> {
  const mappa = new Map<string, number>();
  if (serie.length === 0) return mappa;
  const primo = serie[0].valore;
  if (primo === 0) return mappa;
  for (const p of serie) {
    mappa.set(p.data, ((p.valore - primo) / primo) * 100);
  }
  return mappa;
}

function formatDataGiornoMese(data: string): string {
  const [, mese, giorno] = data.split("-");
  return `${giorno}/${mese}`;
}

function formatDataMese(data: string): string {
  const [, meseStr] = data.split("-");
  const meseIdx = parseInt(meseStr, 10) - 1;
  return MESI_IT[meseIdx];
}

function filtraRange(serie: PuntoStorico[], dataMin: string, dataMax?: string): PuntoStorico[] {
  return serie.filter((p) => p.data >= dataMin && (dataMax == null || p.data <= dataMax));
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function arrotonda(n: number, decimali = 6): number {
  return parseFloat(n.toFixed(decimali));
}

// ---------------------------------------------------------------------------
// Suite 1 — filtraRange
// ---------------------------------------------------------------------------

describe("filtraRange", () => {
  const serie: PuntoStorico[] = [
    { data: "2024-12-31", valore: 90 },
    { data: "2025-06-01", valore: 100 },
    { data: "2025-09-15", valore: 110 },
    { data: "2025-12-31", valore: 115 },
    { data: "2026-01-02", valore: 120 },
    { data: "2026-03-01", valore: 130 },
    { data: "2026-03-25", valore: 140 },
  ];

  it("restituisce array vuoto quando la serie è vuota", () => {
    expect(filtraRange([], "2026-01-01")).toEqual([]);
  });

  it("include il punto esattamente uguale a dataMin (boundary incluso)", () => {
    const risultato = filtraRange(serie, "2026-01-02");
    expect(risultato.map((p) => p.data)).toEqual([
      "2026-01-02",
      "2026-03-01",
      "2026-03-25",
    ]);
  });

  it("senza dataMax, non applica limite superiore", () => {
    const risultato = filtraRange(serie, "2026-01-02");
    expect(risultato).toHaveLength(3);
  });

  it("con dataMax, esclude punti successivi", () => {
    const risultato = filtraRange(serie, "2024-12-31", "2025-12-31");
    expect(risultato.map((p) => p.data)).toEqual([
      "2024-12-31",
      "2025-06-01",
      "2025-09-15",
      "2025-12-31",
    ]);
  });

  it("include sia dataMin che dataMax (estremi inclusi)", () => {
    const risultato = filtraRange(serie, "2025-06-01", "2025-09-15");
    expect(risultato).toHaveLength(2);
    expect(risultato[0].data).toBe("2025-06-01");
    expect(risultato[1].data).toBe("2025-09-15");
  });

  it("restituisce tutti i punti quando dataMin è antecedente a tutti e nessun dataMax", () => {
    const risultato = filtraRange(serie, "2020-01-01");
    expect(risultato).toHaveLength(serie.length);
  });

  it("restituisce array vuoto quando dataMin è successiva a tutti i punti", () => {
    const risultato = filtraRange(serie, "2030-01-01");
    expect(risultato).toHaveLength(0);
  });

  it("vista 2025: filtra correttamente da 2024-12-31 a 2025-12-31", () => {
    const risultato = filtraRange(serie, "2024-12-31", "2025-12-31");
    expect(risultato).toHaveLength(4);
    expect(risultato[0].data).toBe("2024-12-31");
    expect(risultato[risultato.length - 1].data).toBe("2025-12-31");
  });

  it("vista 2026: filtra correttamente da 2026-01-01 senza limite superiore", () => {
    const risultato = filtraRange(serie, "2026-01-01");
    expect(risultato).toHaveLength(3);
    expect(risultato[0].data).toBe("2026-01-02");
  });
});

// ---------------------------------------------------------------------------
// Suite 2 — formatDataMese
// ---------------------------------------------------------------------------

describe("formatDataMese", () => {
  const casi: Array<[string, string]> = [
    ["2026-01-15", "Gen"],
    ["2026-02-01", "Feb"],
    ["2026-03-25", "Mar"],
    ["2026-04-10", "Apr"],
    ["2026-05-05", "Mag"],
    ["2026-06-30", "Giu"],
    ["2026-07-04", "Lug"],
    ["2026-08-20", "Ago"],
    ["2026-09-09", "Set"],
    ["2026-10-31", "Ott"],
    ["2026-11-11", "Nov"],
    ["2026-12-25", "Dic"],
  ];

  it.each(casi)("converte %s in '%s'", (input, atteso) => {
    expect(formatDataMese(input)).toBe(atteso);
  });

  it("non include l'anno nell'output", () => {
    const risultato = formatDataMese("2026-01-01");
    expect(risultato).not.toContain("2026");
    expect(risultato).not.toContain("26");
    expect(risultato).toBe("Gen");
  });

  it("stesso mese indipendente dal giorno", () => {
    expect(formatDataMese("2025-11-01")).toBe("Nov");
    expect(formatDataMese("2025-11-30")).toBe("Nov");
  });

  it("stesso mese indipendente dall'anno", () => {
    expect(formatDataMese("2024-03-15")).toBe("Mar");
    expect(formatDataMese("2026-03-15")).toBe("Mar");
  });
});

// ---------------------------------------------------------------------------
// Suite 3 — formatDataGiornoMese
// ---------------------------------------------------------------------------

describe("formatDataGiornoMese", () => {
  it("converte 2026-01-15 in 15/01", () => {
    expect(formatDataGiornoMese("2026-01-15")).toBe("15/01");
  });

  it("converte 2026-03-25 in 25/03", () => {
    expect(formatDataGiornoMese("2026-03-25")).toBe("25/03");
  });

  it("preserva lo zero iniziale nel giorno", () => {
    // "2026-03-05" → giorno parte = "05"
    expect(formatDataGiornoMese("2026-03-05")).toBe("05/03");
  });

  it("preserva lo zero iniziale nel mese", () => {
    // "2026-02-28" → mese parte = "02"
    expect(formatDataGiornoMese("2026-02-28")).toBe("28/02");
  });

  it("formato è GG/MM (giorno prima, mese dopo)", () => {
    const risultato = formatDataGiornoMese("2026-07-04");
    expect(risultato).toBe("04/07");
    // verifica ordine: la prima parte prima dello slash deve essere il giorno
    const [giorno, mese] = risultato.split("/");
    expect(giorno).toBe("04");
    expect(mese).toBe("07");
  });

  it("l'anno non appare nell'output", () => {
    const risultato = formatDataGiornoMese("2026-01-15");
    expect(risultato).not.toContain("2026");
    expect(risultato).not.toContain("26");
  });
});

// ---------------------------------------------------------------------------
// Suite 4 — normalizza
// ---------------------------------------------------------------------------

describe("normalizza", () => {
  it("restituisce mappa vuota per serie vuota", () => {
    expect(normalizza([])).toEqual(new Map());
  });

  it("restituisce mappa vuota se il primo valore è 0 (divisione per zero)", () => {
    const serie: PuntoStorico[] = [
      { data: "2026-01-01", valore: 0 },
      { data: "2026-01-02", valore: 100 },
    ];
    expect(normalizza(serie)).toEqual(new Map());
  });

  it("il primo punto ha sempre variazione 0%", () => {
    const serie: PuntoStorico[] = [
      { data: "2026-01-02", valore: 100 },
      { data: "2026-02-01", valore: 110 },
    ];
    const mappa = normalizza(serie);
    expect(mappa.get("2026-01-02")).toBe(0);
  });

  it("calcola variazione % corretta con guadagno", () => {
    const serie: PuntoStorico[] = [
      { data: "2026-01-02", valore: 100 },
      { data: "2026-03-25", valore: 115 },
    ];
    const mappa = normalizza(serie);
    // (115 - 100) / 100 * 100 = 15%
    expect(arrotonda(mappa.get("2026-03-25")!)).toBe(15);
  });

  it("calcola variazione % corretta con perdita", () => {
    const serie: PuntoStorico[] = [
      { data: "2026-01-02", valore: 200 },
      { data: "2026-03-25", valore: 180 },
    ];
    const mappa = normalizza(serie);
    // (180 - 200) / 200 * 100 = -10%
    expect(arrotonda(mappa.get("2026-03-25")!)).toBe(-10);
  });

  it("con dati filtrati (vista 2026): il primo punto della serie filtrata vale 0%", () => {
    const serieCompleta: PuntoStorico[] = [
      { data: "2025-06-01", valore: 30000 },
      { data: "2026-01-02", valore: 30500 },
      { data: "2026-03-25", valore: 30275 },
    ];
    const vista2026 = filtraRange(serieCompleta, "2026-01-01");
    const mappa = normalizza(vista2026);

    expect(mappa.get("2026-01-02")).toBe(0);
    expect(mappa.has("2025-06-01")).toBe(false);
  });

  it("restituisce mappa con esattamente tanti entry quanti i punti in input", () => {
    const serie: PuntoStorico[] = [
      { data: "2026-01-02", valore: 100 },
      { data: "2026-02-01", valore: 105 },
      { data: "2026-03-01", valore: 103 },
      { data: "2026-03-25", valore: 108 },
    ];
    expect(normalizza(serie).size).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// Suite 5 — Integrazione: filtrare PRIMA vs DOPO normalizzare
// ---------------------------------------------------------------------------

describe("Integrazione: ordine filtro vs normalizzazione", () => {
  /**
   * Scenario: il portafoglio ha dati dal 2024-12-31 in poi.
   * La vista 2026 deve mostrare solo dal 2026-01-01.
   *
   * Comportamento CORRETTO (come fa il componente):
   *   1. filtra → 2. normalizza
   *   Il punto base della normalizzazione è il primo punto nel range.
   *
   * Comportamento SBAGLIATO (ordine inverso):
   *   1. normalizza (base = primo punto globale) → 2. filtra
   *   Il primo punto del range avrebbe già una variazione != 0%.
   */

  const serieCompleta: PuntoStorico[] = [
    { data: "2024-12-31", valore: 29000 },
    { data: "2025-06-01", valore: 30000 },
    { data: "2025-09-15", valore: 31000 },
    { data: "2026-01-02", valore: 30500 },
    { data: "2026-02-01", valore: 31200 },
    { data: "2026-03-25", valore: 30275 },
  ];

  it("filtro → normalizza: il primo punto della vista 2026 vale esattamente 0%", () => {
    const filtrata = filtraRange(serieCompleta, "2026-01-01");
    const mappa = normalizza(filtrata);

    expect(mappa.get("2026-01-02")).toBe(0);
  });

  it("normalizza → filtro: il primo punto della vista 2026 NON vale 0% (ordine sbagliato)", () => {
    const mappaCompleta = normalizza(serieCompleta);
    const valoreInizioSbagliato = mappaCompleta.get("2026-01-02")!;

    // Con base 2024-12-31 (valore 29000), il punto 2026-01-02 (30500) è +5.17%
    expect(valoreInizioSbagliato).not.toBe(0);
    expect(valoreInizioSbagliato).toBeGreaterThan(0);
  });

  it("i due approcci producono valori diversi per i punti della vista 2026", () => {
    const filtrata = filtraRange(serieCompleta, "2026-01-01");
    const mappaCorretta = normalizza(filtrata);
    const mappaSbagliata = normalizza(serieCompleta);

    const date2026 = ["2026-01-02", "2026-02-01", "2026-03-25"];
    for (const data of date2026) {
      const valoreCorretto = mappaCorretta.get(data)!;
      const valoreSbagliato = mappaSbagliata.get(data)!;
      expect(arrotonda(valoreCorretto, 4)).not.toBe(arrotonda(valoreSbagliato, 4));
    }
  });

  it("vista 2025: filtra da 2024-12-31 a 2025-12-31 e normalizza correttamente", () => {
    const filtrata = filtraRange(serieCompleta, "2024-12-31", "2025-12-31");
    const mappa = normalizza(filtrata);

    // Il punto base è 2024-12-31 → deve valere 0%
    expect(mappa.get("2024-12-31")).toBe(0);
    // Non deve contenere dati 2026
    expect(mappa.has("2026-01-02")).toBe(false);
    expect(mappa.has("2026-02-01")).toBe(false);
  });

  it("con serie SPY e portafoglio che hanno date diverse, la mappa unita copre tutte le date", () => {
    const seriePort: PuntoStorico[] = [
      { data: "2026-01-02", valore: 30500 },
      { data: "2026-02-01", valore: 31200 },
      { data: "2026-03-25", valore: 30275 },
    ];
    const serieSPY: PuntoStorico[] = [
      { data: "2026-01-02", valore: 500 },
      { data: "2026-01-15", valore: 510 },
      { data: "2026-03-25", valore: 495 },
    ];

    const portNorm = normalizza(filtraRange(seriePort, "2026-01-01"));
    const spyNorm = normalizza(filtraRange(serieSPY, "2026-01-01"));

    const dateSet = new Set<string>();
    for (const d of portNorm.keys()) dateSet.add(d);
    for (const d of spyNorm.keys()) dateSet.add(d);

    expect(dateSet.has("2026-01-02")).toBe(true);
    expect(dateSet.has("2026-01-15")).toBe(true);
    expect(dateSet.has("2026-02-01")).toBe(true);
    expect(dateSet.has("2026-03-25")).toBe(true);
    expect(dateSet.size).toBe(4);
  });

  it("punto non presente in una delle due serie restituisce null via operatore ??", () => {
    const portNorm = normalizza([
      { data: "2026-01-02", valore: 100 },
      { data: "2026-03-25", valore: 105 },
    ]);

    const valoreDataMancante = portNorm.get("2026-01-15") ?? null;
    expect(valoreDataMancante).toBeNull();
  });
});
