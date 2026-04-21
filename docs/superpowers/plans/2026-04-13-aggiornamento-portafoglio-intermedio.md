# Aggiornamento Portafoglio Intermedio - Aprile 2026

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aggiornare tutti i dati JSON del portafoglio intermedio con i valori dal nuovo PDF `PORTFOLIO 2026 - NEW.pdf`.

**Architecture:** Aggiornamento puro di dati — nessuna modifica a componenti UI, tipi, o logica. Si aggiornano 5 file JSON in `app/src/data/` con i nuovi valori estratti dal PDF. L'ordine è: portafoglio.json → titoli.json → categorie.json → transazioni.json → storico.json.

**Tech Stack:** JSON data files, nessuna dipendenza

**Fonte dati:** `/Users/andreademarchi/Downloads/PORTFOLIO 2026 - NEW.pdf`

---

## Riepilogo Cambiamenti dal PDF

### Riepilogo Portafoglio
| Campo | Vecchio | Nuovo |
|-------|---------|-------|
| investimentoIniziale | 30,775 | 29,792 |
| valoreAttuale | 31,256 | 30,556 |
| utileRealizzato | 65 | 186 |
| profittoOPerdita | 546 | 951 |
| varPercentuale | 1.77% | 3.19% |
| liquidita | 15,000 | 15,000 (invariato) |

### Nuove Operazioni (5 vendite)
1. **XOM** — 0.5 azioni vendute @ 123→166, utile $22 (35.34%)
2. **TDW** — 1 azione venduta @ 52→77, utile $25 (47.42%)
3. **GUNR** — 5 azioni vendute @ 47→53, utile $34 (14.43%)
4. **EOG** — 0.5 azioni vendute @ 115→143, utile $14 (24.35%)
5. **SU** — 1.5 azioni vendute @ 46→64, utile $28 (40.38%)

### Nuovi Dividendi (15 nuovi, da 02/17 a 03/17)
CCL, V, ENB, AFL, COR, BIL, SHY, AMGN, ITUB, ATO, PRU, CPA, NEE, NVS, GOOGL, CAKE

### Titoli con variazione azioni (post-vendite)
- EOG: 2.5 → 2
- GUNR: 20 → 15
- SU: 5.5 → 4
- XOM: 2 → 1.5
- TDW: 4 → 3

### Tutti i titoli aggiornati (prezzi, valori, P&L, dividendi, P/E)

---

## Task 1: Aggiornare `portafoglio.json`

**Files:**
- Modify: `app/src/data/portafoglio.json`

- [ ] **Step 1: Aggiornare il file con i nuovi valori dal PDF**

Sovrascrivere `app/src/data/portafoglio.json` con:

```json
{
  "investimentoIniziale": 29792,
  "valoreAttuale": 30556,
  "utileRealizzato": 186,
  "profittoOPerdita": 951,
  "varPercentuale": 3.19,
  "liquidita": 15000,
  "notaLiquidita": "Investiti short term con rendimento del 4%",
  "valuta": "USD",
  "dataInizio": "2026-01-02",
  "dataAggiornamento": "2026-04-13"
}
```

Nota: `investimentoIniziale` è il costo totale delle posizioni attuali (29,792), non il capitale iniziale. `valoreAttuale` è il valore di mercato delle posizioni (30,556), NON il totale finale (30,743 che include utile realizzato).

- [ ] **Step 2: Verificare che il JSON sia valido**

Run: `cd app && node -e "const d = require('./src/data/portafoglio.json'); console.log('OK:', d.investimentoIniziale, d.valoreAttuale, d.utileRealizzato)"`
Expected: `OK: 29792 30556 186`

---

## Task 2: Aggiornare `titoli.json` — Categoria Obbligazionario

**Files:**
- Modify: `app/src/data/titoli.json` (posizioni 1-7, ticker BIL/GBTC/PHYS/SHY/SLYV/SIVR/PPLT)

- [ ] **Step 1: Aggiornare i 7 titoli Obbligazionario/Metalli Preziosi/BTC/Small Cap**

Valori dal PDF pagina 2:

| Ticker | numAzioni | costo | valoreAttuale | pesoPercentuale | varPrezzo | dividendi | profittoOPerdita | plPercentuale | peRatio |
|--------|-----------|-------|---------------|-----------------|-----------|-----------|------------------|---------------|---------|
| BIL | 18 | 1646 | 1647 | 16.80 | 2 | 4.38 | 6.00 | 0.36 | null |
| GBTC | 20 | 1434 | 1117 | 11.40 | -317 | 0 | -316.60 | -22.08 | null |
| PHYS | 54 | 1789 | 1927 | 19.66 | 138 | 0 | 138.24 | 7.73 | 2.74 |
| SHY | 17 | 1409 | 1401 | 14.29 | -7 | 3.79 | -3.69 | -0.26 | null |
| SLYV | 13 | 1194 | 1274 | 13.00 | 80 | 0 | 80.34 | 6.73 | null |
| SIVR | 24 | 1657 | 1694 | 17.28 | 37 | 0 | 36.96 | 2.23 | null |
| PPLT | 4 | 778 | 742 | 7.57 | -36 | 0 | -36.32 | -4.67 | null |

Note: `prezzoMedioCarico`, `nome`, `categoria`, `isin`, `assetClass`, `paese`, `settore` restano invariati dai valori attuali.

Dividendi aggiornati: BIL da 4.93→4.38, SHY da 4.25→3.79. Questi sono i dividendi dell'ultimo periodo, non cumulativi.

---

## Task 3: Aggiornare `titoli.json` — Categoria Commodities

**Files:**
- Modify: `app/src/data/titoli.json` (12 titoli Commodities)

- [ ] **Step 1: Aggiornare i 12 titoli Commodities**

**ATTENZIONE: 5 titoli hanno numAzioni ridotto per vendite:**
- EOG: 2.5 → 2, costo: 288→230
- GUNR: 20 → 15, costo: 932→699
- SU: 5.5 → 4, costo: 251→182
- XOM: 2 → 1.5, costo: 245→184
- TDW: 4 → 3, costo: 209→157

Valori dal PDF:

| Ticker | numAzioni | costo | valoreAttuale | pesoPercentuale | varPrezzo | dividendi | profittoOPerdita | plPercentuale | peRatio |
|--------|-----------|-------|---------------|-----------------|-----------|-----------|------------------|---------------|---------|
| EOG | 2 | 230 | 274 | 7.35 | 44 | 0 | 44.06 | 19.16 | 15.06 |
| GUNR | 15 | 699 | 838 | 22.47 | 139 | 0 | 138.90 | 19.88 | null |
| RIO | 3.5 | 285 | 344 | 9.23 | 59 | 0 | 59.12 | 20.74 | 16.15 |
| SU | 4 | 182 | 262 | 7.02 | 79 | 0 | 79.44 | 43.56 | 18.67 |
| CNQ | 5.5 | 189 | 259 | 6.96 | 71 | 2.34 | 72.91 | 38.62 | 12.68 |
| NTR | 3.5 | 221 | 262 | 7.03 | 41 | 1.91 | 43.14 | 19.51 | null |
| TTE | 3 | 200 | 279 | 7.49 | 80 | 3.84 | 83.52 | 41.86 | null |
| SHEL | 2.5 | 189 | 233 | 6.25 | 45 | 0 | 44.50 | 23.59 | 15.55 |
| XOM | 1.5 | 184 | 231 | 6.19 | 47 | 0 | 46.80 | 25.44 | 23.07 |
| BP | 5 | 179 | 234 | 6.28 | 55 | 0 | 54.85 | 30.62 | null |
| VAL | 2.5 | 130 | 250 | 6.70 | 119 | 0 | 119.30 | 91.51 | null |
| TDW | 3 | 157 | 262 | 7.04 | 106 | 0 | 105.72 | 67.47 | null |

Note per VAL: `peRatio` nel PDF appare come 7.2 — aggiornare il campo. La nota "no data" accanto indica assenza di grafico, non di P/E.

---

## Task 4: Aggiornare `titoli.json` — Categoria Growth

**Files:**
- Modify: `app/src/data/titoli.json` (8 titoli Growth)

- [ ] **Step 1: Aggiornare gli 8 titoli Growth**

Valori dal PDF:

| Ticker | numAzioni | costo | valoreAttuale | pesoPercentuale | varPrezzo | dividendi | profittoOPerdita | plPercentuale | peRatio |
|--------|-----------|-------|---------------|-----------------|-----------|-----------|------------------|---------------|---------|
| HDB | 10 | 365 | 265 | 9.34 | -100 | 0 | -99.90 | -27.38 | null |
| BKNG | 0.1 | 21 | 18 | 0.62 | -4 | 0 | -3.79 | -17.78 | 26.46 |
| ADBE | 1 | 405 | 236 | 8.32 | -169 | 0 | -168.87 | -41.70 | 13.77 |
| AMZN | 2 | 453 | 477 | 16.80 | 24 | 0 | 23.56 | 5.20 | 33.11 |
| FIV | 3 | 197 | 147 | 5.17 | -50 | 0 | -50.07 | -25.45 | null |
| GOOGL | 3 | 945 | 955 | 33.66 | 9 | 0.63 | 9.90 | 1.05 | 29.45 |
| MELI | 0.1 | 197 | 180 | 6.33 | -18 | 0 | -17.78 | -9.01 | 45.59 |
| PYPL | 12 | 804 | 561 | 19.76 | -243 | 0 | -243.36 | -30.27 | 8.64 |

Note: BKNG `prezzoMedioCarico` nel PDF dice 213 → valore singolo non "per azione" dato 0.1 azioni. Il costo attuale è 532 ma nel PDF è 21. Controllare: 0.1 * 213 = 21.3 ≈ 21. Quindi `prezzoMedioCarico` diventa 213 (era 5323) e `costo` diventa 21 (era 532). Questo indica una correzione del dato sorgente.

GOOGL ora ha dividendi: 0.63 (nuovo).

---

## Task 5: Aggiornare `titoli.json` — Categoria International Equity

**Files:**
- Modify: `app/src/data/titoli.json` (6 titoli International Equity)

- [ ] **Step 1: Aggiornare i 6 titoli International Equity**

Valori dal PDF:

| Ticker | numAzioni | costo | valoreAttuale | pesoPercentuale | varPrezzo | dividendi | profittoOPerdita | plPercentuale | peRatio |
|--------|-----------|-------|---------------|-----------------|-----------|-----------|------------------|---------------|---------|
| VWO | 20 | 1099 | 1134 | 19.27 | 35 | 0 | 35.40 | 3.22 | null |
| VPL | 12 | 1102 | 1237 | 21.03 | 136 | 0 | 135.60 | 12.31 | null |
| VGK | 12 | 1015 | 1041 | 17.69 | 26 | 0 | 26.16 | 2.58 | null |
| ILF | 32 | 987 | 1208 | 20.54 | 222 | 6.44 | 228.20 | 23.13 | null |
| ASEA | 30 | 553 | 590 | 10.03 | 38 | 11.11 | 48.91 | 8.85 | null |
| INDA | 14 | 764 | 673 | 11.44 | -91 | 0 | -91.00 | -11.91 | null |

---

## Task 6: Aggiornare `titoli.json` — Categoria Dividend

**Files:**
- Modify: `app/src/data/titoli.json` (33 titoli Dividend)

- [ ] **Step 1: Aggiornare tutti i 33 titoli Dividend**

Valori dal PDF:

| Ticker | numAzioni | costo | valoreAttuale | pesoPercentuale | varPrezzo | dividendi | profittoOPerdita | plPercentuale | peRatio |
|--------|-----------|-------|---------------|-----------------|-----------|-----------|------------------|---------------|---------|
| FDX | 0.7 | 205 | 259 | 3.16 | 54 | 1.45 | 55.54 | 27.07 | 19.73 |
| V | 1 | 346 | 305 | 3.71 | -42 | 0.67 | -40.92 | -11.81 | 28.62 |
| BTI | 5.5 | 311 | 322 | 3.92 | 11 | 4.53 | 15.36 | 4.94 | 12.31 |
| MO | 4 | 229 | 267 | 3.25 | 37 | 4.24 | 41.60 | 18.15 | 16.19 |
| TRV | 1 | 285 | 298 | 3.62 | 12 | 0 | 12.39 | 4.34 | 10.86 |
| ATO | 1.25 | 212 | 234 | 2.85 | 22 | 1.25 | 23.54 | 11.12 | 24.30 |
| PEP | 1.6 | 237 | 249 | 3.03 | 12 | 3.13 | 14.84 | 6.27 | 25.96 |
| CI | 1 | 279 | 270 | 3.29 | -9 | 0 | -9.20 | -3.30 | 12.17 |
| BN | 5 | 233 | 214 | 2.60 | -20 | 0 | -19.65 | -8.43 | 87.57 |
| CVS | 3 | 240 | 233 | 2.84 | -7 | 3.33 | -3.66 | -1.52 | 55.84 |
| COR | 1 | 339 | 316 | 3.85 | -23 | 0.60 | -21.98 | -6.49 | null |
| ENB | 3.5 | 168 | 189 | 2.31 | 21 | 2.48 | 23.51 | 13.96 | 23.17 |
| OMAB | 2 | 218 | 230 | 2.80 | 12 | 0 | 11.80 | 5.42 | 17.94 |
| AMGN | 0.65 | 213 | 225 | 2.74 | 12 | 1.64 | 14.00 | 6.57 | 24.44 |
| CSCO | 3 | 228 | 245 | 2.98 | 17 | 1.37 | 18.20 | 7.98 | 29.41 |
| NVS | 2 | 277 | 306 | 3.73 | 29 | 9.48 | 38.46 | 13.88 | 21.40 |
| PRU | 2 | 228 | 194 | 2.36 | -34 | 2.80 | -31.42 | -13.80 | 9.68 |
| USB | 6 | 324 | 333 | 4.05 | 9 | 3.12 | 12.12 | 3.75 | 12.00 |
| UNP | 1 | 232 | 249 | 3.03 | 17 | 0 | 17.20 | 7.42 | 20.80 |
| AFL | 1.5 | 165 | 166 | 2.02 | 1 | 0.91 | 1.51 | 0.92 | 16.23 |
| CAKE | 1.5 | 79 | 88 | 1.07 | 8 | 0.45 | 8.81 | 11.12 | 19.11 |
| NEE | 2.5 | 202 | 231 | 2.81 | 28 | 1.56 | 29.76 | 14.71 | 27.93 |
| HAL | 5.5 | 163 | 212 | 2.58 | 49 | 0 | 48.84 | 30.00 | 25.64 |
| OZK | 7 | 329 | 331 | 4.04 | 2 | 3.22 | 5.39 | 1.64 | 7.65 |
| ELV | 1 | 354 | 311 | 3.79 | -43 | 0 | -43.35 | -12.24 | null |
| CIB | 4 | 253 | 301 | 3.67 | 49 | 0 | 48.52 | 19.19 | 6.89 |
| ITUB | 22 | 159 | 198 | 2.42 | 39 | 2.51 | 41.89 | 26.34 | 11.25 |
| APD | 1 | 275 | 298 | 3.63 | 23 | 1.79 | 24.79 | 9.02 | null |
| ICE | 1 | 160 | 162 | 1.98 | 2 | 0 | 2.37 | 1.48 | 28.16 |
| AXP | 1 | 373 | 316 | 3.85 | -57 | 0.82 | -55.83 | -14.98 | 20.57 |
| ACN | 1 | 260 | 186 | 2.27 | -73 | 1.63 | -71.86 | -27.64 | 15.27 |
| CPA | 2 | 280 | 232 | 2.82 | -48 | 3.42 | -44.58 | -15.92 | 7.13 |
| CCL | 9 | 278 | 244 | 2.97 | -35 | 1.35 | -33.30 | -11.97 | 11.97 |

Note dividendi aggiornati (cumulativi dal PDF):
- V: 0→0.67, COR: 0→0.60, ENB: 0→2.48, AMGN: 0→1.64, NVS: 0→9.48
- PRU: 0→2.80, AFL: 0→0.91, CAKE: 0→0.45, NEE: 0→1.56
- ITUB: 0.30→2.51, CPA: 0→3.42, CCL: 0→1.35
- CIB nome: "Bancolombia SA ADR" → "Grupo Cibest SA ADR" (dal PDF: "Grupo Cibest SA ADR")

---

## Task 7: Aggiornare `categorie.json`

**Files:**
- Modify: `app/src/data/categorie.json`

- [ ] **Step 1: Aggiornare le 5 categorie con i totali dal PDF**

Valori dal PDF (totali per categoria):

```json
[
  {
    "id": "obbligazionario-metalli-preziosi-btc-small-cap",
    "nome": "Obbligazionario/Metalli Preziosi/BTC/Small Cap",
    "slug": "obbligazionario-metalli-preziosi-btc-small-cap",
    "pesoPercentuale": 32.08,
    "costo": 9906,
    "valoreAttuale": 9803,
    "profittoOPerdita": -95,
    "plPercentuale": -0.96,
    "dividendi": 8
  },
  {
    "id": "commodities",
    "nome": "Commodities",
    "slug": "commodities",
    "pesoPercentuale": 12.20,
    "costo": 2844,
    "valoreAttuale": 3728,
    "profittoOPerdita": 892.25,
    "plPercentuale": 31.37,
    "dividendi": 8.09
  },
  {
    "id": "growth",
    "nome": "Growth",
    "slug": "growth",
    "pesoPercentuale": 9.28,
    "costo": 3388,
    "valoreAttuale": 2837,
    "profittoOPerdita": -550.31,
    "plPercentuale": -16.24,
    "dividendi": 0.63
  },
  {
    "id": "international-equity",
    "nome": "International Equity",
    "slug": "international-equity",
    "pesoPercentuale": 19.26,
    "costo": 5518,
    "valoreAttuale": 5884,
    "profittoOPerdita": 383.27,
    "plPercentuale": 6.95,
    "dividendi": 17.55
  },
  {
    "id": "dividend",
    "nome": "Dividend",
    "slug": "dividend",
    "pesoPercentuale": 26.88,
    "costo": 8136,
    "valoreAttuale": 8213,
    "profittoOPerdita": 134.69,
    "plPercentuale": 1.66,
    "dividendi": 57.75
  }
]
```

- [ ] **Step 2: Verificare coerenza**

Run: `cd app && node -e "const c = require('./src/data/categorie.json'); const tot = c.reduce((s,x)=>s+x.valoreAttuale,0); console.log('Totale categorie:', tot); console.log('Pesi:', c.reduce((s,x)=>s+x.pesoPercentuale,0).toFixed(2)+'%')"`
Expected: Totale ~30,465 (vicino a 30,556 con arrotondamenti), Pesi ~99.70%

---

## Task 8: Aggiornare `transazioni.json` — Nuovi Dividendi

**Files:**
- Modify: `app/src/data/transazioni.json` (sezione `dividendi`)

- [ ] **Step 1: Aggiungere 16 nuovi dividendi (02/17 - 03/17)**

Aggiungere IN TESTA all'array `dividendi` (ordine cronologico decrescente) i seguenti dividendi dal PDF pagina 3:

```json
{
  "data": "2026-03-17",
  "tipo": "dividendo",
  "descrizione": "CHEESECAKE FACTORY INC CASH DIV ON 2.50000 SHS REC 03/04/26 PAY 03/17/26",
  "ticker": "CAKE",
  "importo": 0.45
},
{
  "data": "2026-03-16",
  "tipo": "dividendo",
  "descrizione": "ALPHABET INC CLASS A COMMON STOCK CASH DIV ON 3 SHS REC 03/09/26 PAY 03/16/26",
  "ticker": "GOOGL",
  "importo": 0.63
},
{
  "data": "2026-03-16",
  "tipo": "dividendo",
  "descrizione": "NOVARTIS AG AMERICAN DEPOSITARY SHARES CASH DIV ON 3 SHS REC 03/11/26 PAY 03/16/26 FOREIGN TAX WITHHELD",
  "ticker": "NVS",
  "importo": 9.48
},
{
  "data": "2026-03-16",
  "tipo": "dividendo",
  "descrizione": "NEXTERA ENERGY INC CASH DIV ON 4.20000 SHS REC 02/27/26 PAY 03/16/26",
  "ticker": "NEE",
  "importo": 1.56
},
{
  "data": "2026-03-09",
  "tipo": "dividendo",
  "descrizione": "COPA HOLDINGS S A CL A CASH DIV ON 2 SHS REC 02/27/26 PAY 03/13/26",
  "ticker": "CPA",
  "importo": 3.42
},
{
  "data": "2026-03-09",
  "tipo": "dividendo",
  "descrizione": "PRUDENTIAL FINANCIAL INC CASH DIV ON 3.50000 SHS REC 02/17/26 PAY 03/12/26",
  "ticker": "PRU",
  "importo": 2.80
},
{
  "data": "2026-03-09",
  "tipo": "dividendo",
  "descrizione": "ATMOS ENERGY CORP CASH DIV ON 2 SHS REC 02/23/26 PAY 03/09/26",
  "ticker": "ATO",
  "importo": 1.25
},
{
  "data": "2026-03-06",
  "tipo": "dividendo",
  "descrizione": "ITAU UNIBANCO BANCO HOLDINGS A SPONSORED ADR REPSTG 500 PFD CASH DIV ON 36 SHS REC 02/03/26 PAY 03/09/26 FOREIGN TAX WITHHELD",
  "ticker": "ITUB",
  "importo": 2.51
},
{
  "data": "2026-03-06",
  "tipo": "dividendo",
  "descrizione": "AMGEN INC CASH DIV ON 1 SHS REC 02/13/26 PAY 03/06/26",
  "ticker": "AMGN",
  "importo": 1.64
},
{
  "data": "2026-03-05",
  "tipo": "dividendo",
  "descrizione": "ISHARES TRUST ISHARES 1 3 YEAR TREASURY BOND ETF CASH DIV ON 79 SHS REC 03/02/26 PAY 03/05/26",
  "ticker": "SHY",
  "importo": 3.79
},
{
  "data": "2026-03-05",
  "tipo": "dividendo",
  "descrizione": "SPDR SERIES TRUST STATE STREET SPDR BLOOMBERG 1-3 MONTH T-BILL ETF CASH DIV ON 60 SHS REC 03/02/26 PAY 03/05/26",
  "ticker": "BIL",
  "importo": 4.38
},
{
  "data": "2026-03-02",
  "tipo": "dividendo",
  "descrizione": "CENCORA INC COMMON STOCK CASH DIV ON 1 SHS REC 02/13/26 PAY 03/02/26",
  "ticker": "COR",
  "importo": 0.60
},
{
  "data": "2026-03-02",
  "tipo": "dividendo",
  "descrizione": "AFLAC INC CASH DIV ON 2.20000 SHS REC 02/18/26 PAY 03/02/26",
  "ticker": "AFL",
  "importo": 0.91
},
{
  "data": "2026-03-02",
  "tipo": "dividendo",
  "descrizione": "ENBRIDGE INC CASH DIV ON 5.50000 SHS REC 02/17/26 PAY 03/01/26 FOREIGN TAX WITHHELD",
  "ticker": "ENB",
  "importo": 2.48
},
{
  "data": "2026-03-02",
  "tipo": "dividendo",
  "descrizione": "VISA INC CL A COMMON STOCK CASH DIV ON 1.60000 SHS REC 02/10/26 PAY 03/02/26",
  "ticker": "V",
  "importo": 0.67
},
{
  "data": "2026-02-17",
  "tipo": "dividendo",
  "descrizione": "CARNIVAL CORP COMMON PAIRED STOCK CASH DIV ON 15 SHS REC 02/13/26 PAY 02/27/26",
  "ticker": "CCL",
  "importo": 1.35
}
```

---

## Task 9: Aggiornare `transazioni.json` — Nuove Operazioni

**Files:**
- Modify: `app/src/data/transazioni.json` (sezione `operazioni`)

- [ ] **Step 1: Aggiungere 5 nuove operazioni di vendita**

Aggiungere alla fine dell'array `operazioni` (dopo PEP) le 5 nuove vendite dal PDF pagina 4. Non hanno date esplicite nel PDF, quindi usare date stimate ragionevoli nel periodo marzo 2026:

```json
{
  "data": "2026-03-01",
  "tipo": "vendita",
  "ticker": "XOM",
  "nome": "Exxon Mobil Corp",
  "azioniVendute": 0.5,
  "prezzoAcquisto": 123,
  "prezzoVendita": 166,
  "utileRealizzato": 22,
  "percentuale": 35.34,
  "nota": "Riduzione posizione per presa di profitto dopo buona performance"
},
{
  "data": "2026-03-01",
  "tipo": "vendita",
  "ticker": "TDW",
  "nome": "Tidewater Inc",
  "azioniVendute": 1,
  "prezzoAcquisto": 52,
  "prezzoVendita": 77,
  "utileRealizzato": 25,
  "percentuale": 47.42,
  "nota": "Riduzione posizione per presa di profitto"
},
{
  "data": "2026-03-01",
  "tipo": "vendita",
  "ticker": "GUNR",
  "nome": "FlexShs Morningstar Glbl Upsteam Ntrl Res Idx Fd",
  "azioniVendute": 5,
  "prezzoAcquisto": 47,
  "prezzoVendita": 53,
  "utileRealizzato": 34,
  "percentuale": 14.43,
  "nota": "Riduzione posizione ETF risorse naturali"
},
{
  "data": "2026-03-01",
  "tipo": "vendita",
  "ticker": "EOG",
  "nome": "EOG Resources Inc",
  "azioniVendute": 0.5,
  "prezzoAcquisto": 115,
  "prezzoVendita": 143,
  "utileRealizzato": 14,
  "percentuale": 24.35,
  "nota": "Riduzione posizione per presa di profitto"
},
{
  "data": "2026-03-01",
  "tipo": "vendita",
  "ticker": "SU",
  "nome": "Suncor Energy Inc",
  "azioniVendute": 1.5,
  "prezzoAcquisto": 46,
  "prezzoVendita": 64,
  "utileRealizzato": 28,
  "percentuale": 40.38,
  "nota": "Riduzione posizione per presa di profitto"
}
```

---

## Task 10: Aggiornare `storico.json`

**Files:**
- Modify: `app/src/data/storico.json`

- [ ] **Step 1: Aggiornare l'ultimo punto storico**

Il valore attuale aggiornato è 30,556 (non più 31,256). Aggiornare il terzo punto e mantenere coerenza. Il valore iniziale è cambiato a 29,792.

```json
[
  { "data": "2026-01-02", "valore": 29792 },
  { "data": "2026-03-25", "valore": 30275 },
  { "data": "2026-04-13", "valore": 30556 }
]
```

Nota: il primo punto va aggiornato a 29,792 per coerenza col nuovo investimentoIniziale.

- [ ] **Step 2: Verificare coerenza**

Run: `cd app && node -e "const s = require('./src/data/storico.json'); const p = require('./src/data/portafoglio.json'); console.log('Storico ultimo:', s[s.length-1].valore, 'Portafoglio:', p.valoreAttuale, 'Match:', s[s.length-1].valore === p.valoreAttuale)"`
Expected: `Match: true`

---

## Task 11: Verifica finale e build

**Files:**
- Tutti i file JSON in `app/src/data/`

- [ ] **Step 1: Verificare validità JSON di tutti i file**

Run: `cd app && for f in src/data/*.json; do node -e "JSON.parse(require('fs').readFileSync('$f','utf8')); console.log('OK: $f')" || echo "ERRORE: $f"; done`

- [ ] **Step 2: Verificare coerenza dati**

Run: `cd app && node -e "
const t = require('./src/data/titoli.json');
const c = require('./src/data/categorie.json');
const p = require('./src/data/portafoglio.json');
// Verifica totale titoli per categoria
const cats = {};
t.forEach(x => { if(!cats[x.categoria]) cats[x.categoria]={n:0,val:0,costo:0}; cats[x.categoria].n++; cats[x.categoria].val+=x.valoreAttuale; cats[x.categoria].costo+=x.costo; });
Object.entries(cats).forEach(([k,v]) => console.log(k, 'n='+v.n, 'val='+v.val.toFixed(0), 'costo='+v.costo.toFixed(0)));
console.log('Totale titoli:', t.length);
console.log('Totale valore titoli:', t.reduce((s,x)=>s+x.valoreAttuale,0).toFixed(0));
console.log('Portafoglio valoreAttuale:', p.valoreAttuale);
"`

Expected: 66 titoli totali. Totale valore titoli vicino a `valoreAttuale` del portafoglio (30,556).

- [ ] **Step 3: Build di produzione**

Run: `cd app && npm run build`
Expected: Build completata senza errori.

---

## Task 12: Copiare il PDF aggiornato

**Files:**
- Copy: `/Users/andreademarchi/Downloads/PORTFOLIO 2026 - NEW.pdf` → `file-excel/`

- [ ] **Step 1: Copiare il nuovo PDF nella cartella sorgenti**

Run: `cp "/Users/andreademarchi/Downloads/PORTFOLIO 2026 - NEW.pdf" /Users/andreademarchi/portafoglio-finanzamille/file-excel/`

---

## Task 13: Creare log modifica

**Files:**
- Create: `modifiche/13-04-2026 - aggiornamento portafoglio intermedio.md`

- [ ] **Step 1: Creare il file di log**

```markdown
---
Ora: [ora corrente]
---

## File modificati
- `app/src/data/portafoglio.json`
- `app/src/data/titoli.json`
- `app/src/data/categorie.json`
- `app/src/data/transazioni.json`
- `app/src/data/storico.json`

## Cosa è stato modificato
Aggiornamento completo del portafoglio intermedio con i dati dal PDF "PORTFOLIO 2026 - NEW.pdf":
- Riepilogo: investimento iniziale 29,792$, valore attuale 30,556$, utile realizzato 186$, P&L +951$ (+3.19%)
- 5 nuove vendite parziali: XOM, TDW, GUNR, EOG, SU (utile totale $123)
- 16 nuovi dividendi (periodo 02/17 - 03/17/2026, totale ~$49)
- Aggiornamento prezzi e valori di tutti i 66 titoli
- Aggiornamento totali delle 5 categorie
- Aggiornamento storico andamento

## Motivo
Aggiornamento periodico del portafoglio con i nuovi dati forniti dal gestore.

## Impatto
Tutte le pagine: dashboard (riepilogo, grafici), pagine categoria (tabelle titoli), pagina transazioni (nuovi dividendi e operazioni).
```
