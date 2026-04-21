# Struttura Dati Portafoglio

## Fonte dati
- Il file sorgente è `file-excel/PORTFOLIO 2026.pdf`
- I dati vengono estratti e salvati in file JSON dentro `app/src/data/`
- Quando il portafoglio viene aggiornato, si aggiornano i file JSON manualmente

## Struttura portafoglio

### Riepilogo generale
```json
{
  "investimentoIniziale": 30775,
  "valoreAttuale": 30275,
  "utileRealizzato": 65,
  "profittoOPerdita": -435,
  "varPercentuale": -1.41,
  "liquidita": 15000,
  "notaLiquidita": "Investiti short term con rendimento del 4%",
  "valuta": "USD",
  "dataInizio": "2026-01-02",
  "dataAggiornamento": "2026-03-25"
}
```

### Categorie (5 totali)
1. **Obbligazionario/Metalli Preziosi/BTC/Small Cap** — 31.11%
2. **Dividend** — 26.32%
3. **International Equity** — 18.38%
4. **Commodities** — 13.93%
5. **Growth** — 10.05%

### Struttura singolo titolo
```json
{
  "ticker": "EOG",
  "nome": "EOG Resources Inc",
  "categoria": "commodities",
  "numAzioni": 2.5,
  "prezzoMedioCarico": 115,
  "costo": 143,
  "valoreAttuale": 356,
  "pesoPercentuale": 8.45,
  "varPrezzo": 69,
  "dividendi": 0,
  "profittoOPerdita": 68.83,
  "plPercentuale": 23.94,
  "peRatio": 15.63,
  "isin": "US26875P1012",
  "assetClass": "azione",
  "paese": "USA",
  "settore": "energia"
}
```

### Campi aggiuntivi per i grafici di esposizione

**assetClass** — tipo di strumento:
- `"azione"` — titoli singoli (EOG, FDX, GOOGL, ecc.)
- `"etf"` — ETF e fondi (VWO, VGK, GUNR, ILF, ecc.)
- `"obbligazione"` — treasury/bond (BIL, SHY)
- `"crypto"` — criptovalute (GBTC)
- `"metallo"` — metalli preziosi (PHYS, SIVR, PPLT)

**paese** — area geografica principale:
- `"USA"`, `"Canada"`, `"UK"`, `"Francia"`, `"Svizzera"`, `"India"`, `"Brasile"`, `"Messico"`, `"Colombia"`, `"Panama"`
- `"Europa"` (per ETF europei come VGK)
- `"Asia-Pacifico"` (per VPL)
- `"Sud-Est Asiatico"` (per ASEA)
- `"Mercati Emergenti"` (per VWO)
- `"America Latina"` (per ILF)
- `"Globale"` (per strumenti multi-area)

**settore** — settore industriale:
- `"energia"`, `"risorse-naturali"`, `"tecnologia"`, `"finanza"`, `"sanita"`, `"consumer"`, `"trasporti"`, `"utilities"`, `"metalli-preziosi"`, `"crypto"`, `"obbligazionario"`, `"small-cap"`

### Transazioni (dividendi e operazioni)
```json
{
  "data": "2026-02-13",
  "tipo": "dividendo",
  "descrizione": "ACCENTURE PLC IRELAND SHS CL A CASH DIV...",
  "ticker": "ACN",
  "importo": 1.63
}
```

```json
{
  "data": "2026-01-15",
  "tipo": "vendita",
  "ticker": "VAL",
  "nome": "Valaris Ltd",
  "azioniVendute": 1.5,
  "prezzoAcquisto": 52,
  "prezzoVendita": 78,
  "utileRealizzato": 48,
  "percentuale": 61.07,
  "nota": "Dopo una crescita improvvisa del 36% in un giorno, ho deciso di ridurre la mia posizione del 30%"
}
```

## Storico andamento
- NON ancora disponibile
- Quando sarà disponibile, sarà un array di oggetti `{ data, valore }` per il grafico a linee
- Per ora il grafico andamento mostra solo il punto iniziale e il punto attuale

## Regole dati
- Tutti gli importi sono in **USD ($)**
- I dividendi NON sono inclusi nel calcolo del P&L delle singole posizioni (come da PDF)
- Le percentuali di peso sono relative alla categoria, NON al portafoglio totale
- I prezzi sono aggiornati manualmente (non c'è API live)
