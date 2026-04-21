/**
 * QA tests — Aggiornamento dati aprile 2026
 *
 * Verifica la correttezza di tutti i file JSON del portafoglio dopo
 * l'aggiornamento del 13 aprile 2026.
 *
 * Punti verificati:
 *   1. portafoglio.json — valori di riepilogo
 *   2. categorie.json   — 5 categorie con totali corretti
 *   3. titoli.json      — struttura, tipi, coerenza per categoria, campioni
 *   4. storico.json     — 3 punti, ordinamento, ultimo punto
 *   5. transazioni.json — 19 dividendi, 4 operazioni
 *   6. Coerenza globale — somma valori categoria vs portafoglio
 */

import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

import type {
  Portafoglio,
  Categoria,
  Titolo,
  PuntoStorico,
  Dividendo,
  Operazione,
} from "@/types/portafoglio";

// ── helpers ──────────────────────────────────────────────────────────────────

const DATA_DIR = resolve(__dirname, "../data");

function loadJSON<T>(filename: string): T {
  return JSON.parse(readFileSync(resolve(DATA_DIR, filename), "utf-8")) as T;
}

const TOLERANCE = 2; // USD — differenze di arrotondamento accettabili

function isWithin(actual: number, expected: number, tol = TOLERANCE): boolean {
  return Math.abs(actual - expected) <= tol;
}

// ── dati caricati una sola volta ─────────────────────────────────────────────

const portafoglio = loadJSON<Portafoglio>("portafoglio.json");
const categorie = loadJSON<Categoria[]>("categorie.json");
const titoli = loadJSON<Titolo[]>("titoli.json");
const storico = loadJSON<PuntoStorico[]>("storico.json");
const transazioni = loadJSON<{ dividendi: Dividendo[]; operazioni: Operazione[] }>(
  "transazioni.json"
);

// ─────────────────────────────────────────────────────────────────────────────
// 1. portafoglio.json
// ─────────────────────────────────────────────────────────────────────────────

describe("portafoglio.json — valori di riepilogo", () => {
  it("investimentoIniziale è 30775", () => {
    expect(portafoglio.investimentoIniziale).toBe(30775);
  });

  it("valoreAttuale è 31256", () => {
    expect(portafoglio.valoreAttuale).toBe(31256);
  });

  it("utileRealizzato è 65", () => {
    expect(portafoglio.utileRealizzato).toBe(65);
  });

  it("profittoOPerdita è 546", () => {
    expect(portafoglio.profittoOPerdita).toBe(546);
  });

  it("varPercentuale è 1.77", () => {
    expect(portafoglio.varPercentuale).toBe(1.77);
  });

  it("liquidita è 15000", () => {
    expect(portafoglio.liquidita).toBe(15000);
  });

  it("dataAggiornamento è 2026-04-13", () => {
    expect(portafoglio.dataAggiornamento).toBe("2026-04-13");
  });

  it("dataInizio è 2026-01-02", () => {
    expect(portafoglio.dataInizio).toBe("2026-01-02");
  });

  it("valuta è USD", () => {
    expect(portafoglio.valuta).toBe("USD");
  });

  it("notaLiquidita è una stringa non vuota", () => {
    expect(typeof portafoglio.notaLiquidita).toBe("string");
    expect(portafoglio.notaLiquidita.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. categorie.json
// ─────────────────────────────────────────────────────────────────────────────

describe("categorie.json — struttura e totali", () => {
  it("contiene esattamente 5 categorie", () => {
    expect(categorie).toHaveLength(5);
  });

  it("ogni categoria ha tutti i campi obbligatori", () => {
    const campiRichiesti: (keyof Categoria)[] = [
      "id", "nome", "slug", "pesoPercentuale",
      "costo", "valoreAttuale", "profittoOPerdita", "plPercentuale", "dividendi",
    ];
    for (const cat of categorie) {
      for (const campo of campiRichiesti) {
        expect(cat[campo], `${cat.id} — campo "${campo}" mancante`).toBeDefined();
      }
    }
  });

  it("i pesi percentuali sommano ~100%", () => {
    const sommaPesi = categorie.reduce((acc, c) => acc + c.pesoPercentuale, 0);
    expect(sommaPesi).toBeGreaterThan(99);
    expect(sommaPesi).toBeLessThan(101);
  });

  // Categoria: Obbligazionario
  describe("Obbligazionario/Metalli Preziosi/BTC/Small Cap", () => {
    let cat: Categoria;
    beforeAll(() => {
      cat = categorie.find((c) => c.id === "obbligazionario-metalli-preziosi-btc-small-cap")!;
    });

    it("esiste nel file", () => expect(cat).toBeDefined());
    it("costo è 9906", () => expect(cat.costo).toBe(9906));
    it("valoreAttuale è 9900", () => expect(cat.valoreAttuale).toBe(9900));
    it("profittoOPerdita è ~4", () => expect(isWithin(cat.profittoOPerdita, 4)).toBe(true));
    it("peso è 31.67%", () => expect(cat.pesoPercentuale).toBe(31.67));
  });

  // Categoria: Commodities
  describe("Commodities", () => {
    let cat: Categoria;
    beforeAll(() => {
      cat = categorie.find((c) => c.id === "commodities")!;
    });

    it("esiste nel file", () => expect(cat).toBeDefined());
    it("costo è 3317", () => expect(cat.costo).toBe(3317));
    it("valoreAttuale è 4300", () => expect(cat.valoreAttuale).toBe(4300));
    it("profittoOPerdita è ~991.61", () => expect(isWithin(cat.profittoOPerdita, 991.61)).toBe(true));
    it("peso è 13.76%", () => expect(cat.pesoPercentuale).toBe(13.76));
  });

  // Categoria: Growth
  describe("Growth", () => {
    let cat: Categoria;
    beforeAll(() => {
      cat = categorie.find((c) => c.id === "growth")!;
    });

    it("esiste nel file", () => expect(cat).toBeDefined());
    it("costo è 3899", () => expect(cat.costo).toBe(3899));
    it("valoreAttuale è 2802", () => expect(cat.valoreAttuale).toBe(2802));
    it("profittoOPerdita è ~-1096.68", () => expect(isWithin(cat.profittoOPerdita, -1096.68)).toBe(true));
    it("peso è 8.96%", () => expect(cat.pesoPercentuale).toBe(8.96));
  });

  // Categoria: International Equity
  describe("International Equity", () => {
    let cat: Categoria;
    beforeAll(() => {
      cat = categorie.find((c) => c.id === "international-equity")!;
    });

    it("esiste nel file", () => expect(cat).toBeDefined());
    it("costo è 5518", () => expect(cat.costo).toBe(5518));
    it("valoreAttuale è 5935", () => expect(cat.valoreAttuale).toBe(5935));
    it("profittoOPerdita è ~434.37", () => expect(isWithin(cat.profittoOPerdita, 434.37)).toBe(true));
    it("peso è 18.99%", () => expect(cat.pesoPercentuale).toBe(18.99));
  });

  // Categoria: Dividend
  describe("Dividend", () => {
    let cat: Categoria;
    beforeAll(() => {
      cat = categorie.find((c) => c.id === "dividend")!;
    });

    it("esiste nel file", () => expect(cat).toBeDefined());
    it("costo è 8136", () => expect(cat.costo).toBe(8136));
    it("valoreAttuale è 8256", () => expect(cat.valoreAttuale).toBe(8256));
    it("profittoOPerdita è ~148.62", () => expect(isWithin(cat.profittoOPerdita, 148.62)).toBe(true));
    it("peso è 26.41%", () => expect(cat.pesoPercentuale).toBe(26.41));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. titoli.json
// ─────────────────────────────────────────────────────────────────────────────

const CAMPI_TITOLO: (keyof Titolo)[] = [
  "ticker", "nome", "categoria", "numAzioni", "prezzoMedioCarico",
  "costo", "valoreAttuale", "pesoPercentuale", "varPrezzo", "dividendi",
  "profittoOPerdita", "plPercentuale", "peRatio", "isin",
  "assetClass", "paese", "settore",
];

const ASSET_CLASS_VALIDI = new Set(["azione", "etf", "obbligazione", "crypto", "metallo"]);
const PAESI_VALIDI = new Set([
  "USA", "Canada", "UK", "Francia", "Svizzera", "India", "Brasile",
  "Messico", "Colombia", "Panama", "Europa", "Asia-Pacifico",
  "Sud-Est Asiatico", "Mercati Emergenti", "America Latina", "Globale",
]);
const SETTORI_VALIDI = new Set([
  "energia", "risorse-naturali", "tecnologia", "finanza", "sanita",
  "consumer", "trasporti", "utilities", "metalli-preziosi", "crypto",
  "obbligazionario", "small-cap", "diversificato",
]);

describe("titoli.json — struttura e tipi TypeScript", () => {
  it("è un array non vuoto", () => {
    expect(Array.isArray(titoli)).toBe(true);
    expect(titoli.length).toBeGreaterThan(0);
  });

  it("ogni titolo ha tutti i campi obbligatori", () => {
    for (const t of titoli) {
      for (const campo of CAMPI_TITOLO) {
        expect(
          Object.prototype.hasOwnProperty.call(t, campo),
          `${t.ticker} — campo "${campo}" mancante`
        ).toBe(true);
      }
    }
  });

  it("i campi numerici sono numeri (non stringhe)", () => {
    const campiNumerici: (keyof Titolo)[] = [
      "numAzioni", "prezzoMedioCarico", "costo", "valoreAttuale",
      "pesoPercentuale", "varPrezzo", "dividendi", "profittoOPerdita", "plPercentuale",
    ];
    for (const t of titoli) {
      for (const campo of campiNumerici) {
        expect(
          typeof t[campo],
          `${t.ticker}.${campo} dovrebbe essere number`
        ).toBe("number");
      }
    }
  });

  it("peRatio è number oppure null", () => {
    for (const t of titoli) {
      expect(
        t.peRatio === null || typeof t.peRatio === "number",
        `${t.ticker}.peRatio non valido: ${t.peRatio}`
      ).toBe(true);
    }
  });

  it("isin è stringa oppure null", () => {
    for (const t of titoli) {
      expect(
        t.isin === null || typeof t.isin === "string",
        `${t.ticker}.isin non valido: ${t.isin}`
      ).toBe(true);
    }
  });

  it("assetClass è uno dei valori consentiti", () => {
    for (const t of titoli) {
      expect(
        ASSET_CLASS_VALIDI.has(t.assetClass),
        `${t.ticker}.assetClass non valido: "${t.assetClass}"`
      ).toBe(true);
    }
  });

  it("paese è uno dei valori consentiti", () => {
    for (const t of titoli) {
      expect(
        PAESI_VALIDI.has(t.paese),
        `${t.ticker}.paese non valido: "${t.paese}"`
      ).toBe(true);
    }
  });

  it("settore è uno dei valori consentiti", () => {
    for (const t of titoli) {
      expect(
        SETTORI_VALIDI.has(t.settore),
        `${t.ticker}.settore non valido: "${t.settore}"`
      ).toBe(true);
    }
  });

  it("ticker è una stringa non vuota", () => {
    for (const t of titoli) {
      expect(typeof t.ticker).toBe("string");
      expect(t.ticker.length).toBeGreaterThan(0);
    }
  });

  it("nome è una stringa non vuota", () => {
    for (const t of titoli) {
      expect(typeof t.nome).toBe("string");
      expect(t.nome.length).toBeGreaterThan(0);
    }
  });

  it("categoria corrisponde a uno slug di categoria valido", () => {
    const slugValidi = new Set(categorie.map((c) => c.slug));
    for (const t of titoli) {
      expect(
        slugValidi.has(t.categoria),
        `${t.ticker}.categoria non valida: "${t.categoria}"`
      ).toBe(true);
    }
  });

  it("numAzioni è positivo", () => {
    for (const t of titoli) {
      expect(t.numAzioni, `${t.ticker}.numAzioni non positivo`).toBeGreaterThan(0);
    }
  });
});

describe("titoli.json — coerenza valoreAttuale per categoria", () => {
  function sommaValoreCategoria(slug: string): number {
    return titoli
      .filter((t) => t.categoria === slug)
      .reduce((acc, t) => acc + t.valoreAttuale, 0);
  }

  it("somma valoreAttuale Obbligazionario ≈ 9900", () => {
    const somma = sommaValoreCategoria("obbligazionario-metalli-preziosi-btc-small-cap");
    expect(isWithin(somma, 9900, 5)).toBe(true);
  });

  it("somma valoreAttuale Commodities ≈ 4300", () => {
    const somma = sommaValoreCategoria("commodities");
    expect(isWithin(somma, 4300, 5)).toBe(true);
  });

  it("somma valoreAttuale Growth ≈ 2802", () => {
    const somma = sommaValoreCategoria("growth");
    expect(isWithin(somma, 2802, 5)).toBe(true);
  });

  it("somma valoreAttuale International Equity ≈ 5935", () => {
    const somma = sommaValoreCategoria("international-equity");
    expect(isWithin(somma, 5935, 5)).toBe(true);
  });

  it("somma valoreAttuale Dividend ≈ 8256", () => {
    const somma = sommaValoreCategoria("dividend");
    expect(isWithin(somma, 8256, 5)).toBe(true);
  });
});

describe("titoli.json — pesi percentuali per categoria sommano ~100%", () => {
  function sommaPesiCategoria(slug: string): number {
    return titoli
      .filter((t) => t.categoria === slug)
      .reduce((acc, t) => acc + t.pesoPercentuale, 0);
  }

  const slugs = [
    "obbligazionario-metalli-preziosi-btc-small-cap",
    "commodities",
    "growth",
    "international-equity",
    "dividend",
  ];

  for (const slug of slugs) {
    it(`pesi ${slug} sommano tra 98 e 102`, () => {
      const somma = sommaPesiCategoria(slug);
      expect(somma).toBeGreaterThanOrEqual(98);
      expect(somma).toBeLessThanOrEqual(102);
    });
  }
});

describe("titoli.json — titoli a campione", () => {
  it("EOG: categoria=commodities, numAzioni=2.5, valoreAttuale≈340", () => {
    const t = titoli.find((x) => x.ticker === "EOG");
    expect(t).toBeDefined();
    expect(t!.categoria).toBe("commodities");
    expect(t!.numAzioni).toBe(2.5);
    expect(isWithin(t!.valoreAttuale, 340)).toBe(true);
  });

  it("GOOGL: categoria=growth, numAzioni=3, valoreAttuale≈952", () => {
    const t = titoli.find((x) => x.ticker === "GOOGL");
    expect(t).toBeDefined();
    expect(t!.categoria).toBe("growth");
    expect(t!.numAzioni).toBe(3);
    expect(isWithin(t!.valoreAttuale, 952)).toBe(true);
  });

  it("VPL: categoria=international-equity, numAzioni=12, valoreAttuale≈1247", () => {
    const t = titoli.find((x) => x.ticker === "VPL");
    expect(t).toBeDefined();
    expect(t!.categoria).toBe("international-equity");
    expect(t!.numAzioni).toBe(12);
    expect(isWithin(t!.valoreAttuale, 1247)).toBe(true);
  });

  it("FDX: categoria=dividend, numAzioni=0.7, valoreAttuale≈262", () => {
    const fdxDividend = titoli.find((x) => x.ticker === "FDX" && x.categoria === "dividend");
    expect(fdxDividend).toBeDefined();
    expect(fdxDividend!.numAzioni).toBe(0.7);
    expect(isWithin(fdxDividend!.valoreAttuale, 262)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. storico.json
// ─────────────────────────────────────────────────────────────────────────────

describe("storico.json", () => {
  it("contiene esattamente 3 punti dati", () => {
    expect(storico).toHaveLength(3);
  });

  it("ogni punto ha 'data' (stringa) e 'valore' (numero)", () => {
    for (const p of storico) {
      expect(typeof p.data).toBe("string");
      expect(typeof p.valore).toBe("number");
    }
  });

  it("i punti sono ordinati cronologicamente (crescente)", () => {
    for (let i = 1; i < storico.length; i++) {
      expect(
        new Date(storico[i].data) >= new Date(storico[i - 1].data),
        `Punto ${i} non ordinato: ${storico[i - 1].data} -> ${storico[i].data}`
      ).toBe(true);
    }
  });

  it("il primo punto è 2026-01-02, valore 30775", () => {
    expect(storico[0].data).toBe("2026-01-02");
    expect(storico[0].valore).toBe(30775);
  });

  it("l'ultimo punto ha data 2026-04-13", () => {
    expect(storico[storico.length - 1].data).toBe("2026-04-13");
  });

  it("l'ultimo punto ha valore 31256", () => {
    expect(storico[storico.length - 1].valore).toBe(31256);
  });

  it("le date sono nel formato YYYY-MM-DD", () => {
    const re = /^\d{4}-\d{2}-\d{2}$/;
    for (const p of storico) {
      expect(re.test(p.data), `Data non valida: ${p.data}`).toBe(true);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. transazioni.json
// ─────────────────────────────────────────────────────────────────────────────

describe("transazioni.json", () => {
  it("contiene esattamente 19 dividendi", () => {
    expect(transazioni.dividendi).toHaveLength(19);
  });

  it("contiene esattamente 4 operazioni", () => {
    expect(transazioni.operazioni).toHaveLength(4);
  });

  it("ogni dividendo ha data, tipo='dividendo', ticker, importo", () => {
    for (const d of transazioni.dividendi) {
      expect(d.tipo).toBe("dividendo");
      expect(typeof d.data).toBe("string");
      expect(typeof d.ticker).toBe("string");
      expect(typeof d.importo).toBe("number");
      expect(d.importo).toBeGreaterThan(0);
    }
  });

  it("ogni operazione ha data, tipo (vendita|acquisto), ticker", () => {
    for (const op of transazioni.operazioni) {
      expect(["vendita", "acquisto"]).toContain(op.tipo);
      expect(typeof op.data).toBe("string");
      expect(typeof op.ticker).toBe("string");
    }
  });

  it("le date dei dividendi sono nel formato YYYY-MM-DD", () => {
    const re = /^\d{4}-\d{2}-\d{2}$/;
    for (const d of transazioni.dividendi) {
      expect(re.test(d.data), `Data dividendo non valida: ${d.data}`).toBe(true);
    }
  });

  it("le date delle operazioni sono nel formato YYYY-MM-DD", () => {
    const re = /^\d{4}-\d{2}-\d{2}$/;
    for (const op of transazioni.operazioni) {
      expect(re.test(op.data), `Data operazione non valida: ${op.data}`).toBe(true);
    }
  });

  it("importi dividendi sono tutti > 0", () => {
    for (const d of transazioni.dividendi) {
      expect(d.importo, `Dividendo ${d.ticker} importo non positivo`).toBeGreaterThan(0);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Coerenza globale
// ─────────────────────────────────────────────────────────────────────────────

describe("Coerenza globale — somma categorie vs portafoglio", () => {
  it("somma valoreAttuale di tutte le categorie ≈ portafoglio.valoreAttuale", () => {
    const sommaCategorie = categorie.reduce((acc, c) => acc + c.valoreAttuale, 0);
    // portafoglio.valoreAttuale esclude la liquidità (15000 tenuta separata)
    // la somma delle categorie deve coincidere
    expect(isWithin(sommaCategorie, portafoglio.valoreAttuale, 10)).toBe(true);
  });

  it("somma titoli valoreAttuale ≈ somma categorie valoreAttuale", () => {
    const sommaTitoli = titoli.reduce((acc, t) => acc + t.valoreAttuale, 0);
    const sommaCategorie = categorie.reduce((acc, c) => acc + c.valoreAttuale, 0);
    expect(isWithin(sommaTitoli, sommaCategorie, 10)).toBe(true);
  });

  it("portafoglio.valoreAttuale + liquidita > portafoglio.investimentoIniziale (portafoglio in crescita)", () => {
    const totale = portafoglio.valoreAttuale + portafoglio.liquidita;
    expect(totale).toBeGreaterThan(portafoglio.investimentoIniziale);
  });

  it("storico ultimo punto coincide con portafoglio.valoreAttuale", () => {
    const ultimoPunto = storico[storico.length - 1];
    expect(ultimoPunto.valore).toBe(portafoglio.valoreAttuale);
  });

  it("ogni titolo appartiene a una categoria esistente in categorie.json", () => {
    const slugValidi = new Set(categorie.map((c) => c.id));
    for (const t of titoli) {
      expect(
        slugValidi.has(t.categoria),
        `${t.ticker}.categoria "${t.categoria}" non esiste in categorie.json`
      ).toBe(true);
    }
  });
});
