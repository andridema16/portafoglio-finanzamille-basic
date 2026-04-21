---
Ora: 23:30
---

## File modificati
- `app/src/data/portafoglio.json`
- `app/src/data/titoli.json`
- `app/src/data/categorie.json`
- `app/src/data/transazioni.json`
- `app/src/data/storico.json`

## Cosa è stato modificato
Aggiornamento completo del portafoglio intermedio con i dati dal PDF "PORTFOLIO 2026 - NEW.pdf":

**Riepilogo portafoglio:**
- Investimento iniziale: $30,775 -> $29,792 (ricalcolato dopo vendite)
- Valore attuale: $31,256 -> $30,556
- Utile realizzato: $65 -> $186
- P&L: +$546 (+1.77%) -> +$951 (+3.19%)

**5 nuove vendite parziali (utile totale $123):**
- XOM: 0.5 azioni, utile $22 (35.34%)
- TDW: 1 azione, utile $25 (47.42%)
- GUNR: 5 azioni, utile $34 (14.43%)
- EOG: 0.5 azioni, utile $14 (24.35%)
- SU: 1.5 azioni, utile $28 (40.38%)

**16 nuovi dividendi (periodo 02/17 - 03/17/2026):**
CAKE, GOOGL, NVS, NEE, CPA, PRU, ATO, ITUB, AMGN, SHY, BIL, COR, AFL, ENB, V, CCL

**Aggiornamento prezzi:** tutti i 66 titoli aggiornati con nuovi valori, P&L, dividendi cumulativi, P/E ratio

**Correzione dato BKNG:** prezzoMedioCarico corretto da 5323 a 213 (era errato nel dataset precedente)

## Motivo
Aggiornamento periodico del portafoglio con i nuovi dati forniti dal gestore tramite il PDF aggiornato.

## Impatto
Tutte le pagine del sito: dashboard (riepilogo, grafici esposizione, andamento), pagine categoria (tabelle titoli aggiornate), pagina transazioni (nuovi dividendi e operazioni di vendita).
