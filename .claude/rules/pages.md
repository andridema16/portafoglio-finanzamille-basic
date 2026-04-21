# Struttura Pagine

## Pagina 1 — Login (`/`)
- Schermata semplice con logo FinanzaMille centrato
- Campo password + bottone "Accedi"
- Messaggio errore se password sbagliata
- Nessun link visibile, nessun menu
- Sfondo pulito, coerente col brand

## Pagina 2 — Dashboard (`/dashboard`)
- **Header**: logo + titolo "Portafoglio FinanzaMille"
- **Card riepilogo**: valore iniziale, valore attuale, P&L, P&L%, utile realizzato, liquidità
- **Grafico andamento**: linea temporale del valore del portafoglio (per ora solo 2 punti: inizio e oggi)
- **Tabella categorie**: nome categoria, peso %, valore, P&L con colore rosso/verde

### Grafici di esposizione (sezione sotto le card)

**Grafico 1 — Esposizione per Categoria** (torta/donut)
- Le 5 categorie del portafoglio con peso %:
  - Obbligazionario/Metalli/BTC/Small Cap
  - Dividend
  - International Equity
  - Commodities
  - Growth

**Grafico 2 — Esposizione per Asset Class** (torta/donut)
- Raggruppamento per tipo di strumento:
  - Azioni (singoli titoli: EOG, FDX, V, GOOGL, ecc.)
  - ETF/Fondi (BIL, SHY, VWO, VGK, GUNR, ecc.)
  - Obbligazioni (BIL, SHY — short term treasuries)
  - Crypto (GBTC — Bitcoin)
  - Metalli preziosi (PHYS oro, SIVR argento, PPLT platino)
  - Liquidità ($15,000)

**Grafico 3 — Esposizione Geografica** (torta/donut o mappa mondiale)
- Raggruppamento per area geografica basata sui titoli:
  - USA (EOG, XOM, AMZN, GOOGL, FDX, ecc.)
  - Canada (SU, CNQ, NTR, ENB, BN)
  - Europa (TTE Francia, SHEL UK, BTI UK, BP UK, NVS Svizzera)
  - America Latina (ILF, MELI, CIB, ITUB, OMAB, CPA)
  - Asia/Pacifico (VPL, HDB India, INDA)
  - Sud-Est Asiatico (ASEA)
  - Mercati Emergenti (VWO)
  - Globale (titoli con esposizione mista come ETF internazionali)

**Grafico 4 — Esposizione per Settore** (barre orizzontali o torta)
- Raggruppamento per settore industriale:
  - Energia/Oil & Gas (EOG, SU, CNQ, TTE, SHEL, XOM, BP, HAL, TDW)
  - Risorse naturali/Mining (GUNR, RIO, NTR)
  - Tecnologia (GOOGL, AMZN, ADBE, CSCO, ACN)
  - Finanza (V, PYPL, AXP, USB, OZK, PRU, ICE, BN, CIB, ITUB, AFL)
  - Sanità (CI, CVS, COR, AMGN, NVS, ELV)
  - Consumer (PEP, CAKE, BKNG, MO, BTI, CCL)
  - Trasporti/Logistica (FDX, UNP, CPA, OMAB)
  - Utilities/Energia pulita (NEE, ATO, ENB)
  - Metalli preziosi (PHYS, SIVR, PPLT)
  - Crypto (GBTC)
  - Obbligazionario (BIL, SHY)
  - Small Cap (SLYV)

## Pagina 3 — Dettaglio Categoria (`/categoria/[slug]`)
- Titolo categoria + peso % sul portafoglio
- Tabella con tutti i titoli della categoria:
  - Ticker, Nome, N. Azioni, Prezzo Carico, Valore Attuale, Peso %, P&L, P&L%, Dividendi
- Riga totale in fondo
- Colori rosso/verde per P&L

## Pagina 4 — Transazioni (`/transazioni`)
- **Sezione dividendi**: tabella con data, ticker, importo
- **Sezione operazioni**: card per ogni operazione (vendita/acquisto) con:
  - Ticker, nome, azioni, prezzo acquisto/vendita, utile/perdita
  - Nota operativa (il commento del gestore)

## Navigazione
- Dopo il login, sidebar o navbar con: Dashboard, Categorie (dropdown 5 voci), Transazioni
- Stile coerente col sito principale (sidebar verde scuro a sinistra)
- Footer minimale: "© 2026 FinanzaMille"

## Comportamento
- Se l'utente non è autenticato, QUALSIASI pagina lo rimanda a `/`
- Il sito è SOLO lettura, non ci sono form di editing
- Responsive: su mobile la sidebar diventa hamburger menu
