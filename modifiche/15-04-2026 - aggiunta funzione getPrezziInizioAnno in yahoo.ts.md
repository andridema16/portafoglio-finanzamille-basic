# Aggiunta funzione getPrezziInizioAnno in yahoo.ts

- **Ora**: 15-04-2026
- **File modificati**: `src/lib/yahoo.ts`

## Cosa è stato modificato

Aggiunta la funzione esportata `getPrezziInizioAnno(tickers: string[])` e la relativa cache in-memory `cacheInizioAnno`.

Nuovi elementi aggiunti in coda al file:
- Interfaccia `CacheInizioAnnoEntry` con campi `prezzi`, `anno`, `timestamp`
- Costante `INIZIO_ANNO_TTL_MS` (24 ore)
- Variabile `cacheInizioAnno` inizializzata a `null`
- Funzione `getPrezziInizioAnno(tickers)` che:
  - Recupera il prezzo di chiusura del primo giorno di trading dell'anno corrente per ogni ticker
  - Usa `yahooFinance.chart()` con intervallo `YYYY-01-01` / `YYYY-01-06` e `interval: "1d"`
  - Prende la prima quota con `close != null` per gestire festività e weekend
  - Processa i ticker in batch da `BATCH_SIZE` (10) con `Promise.all`
  - In caso di errore su un singolo ticker restituisce `null` per quel ticker senza bloccare gli altri
  - Invalida automaticamente la cache al cambio d'anno (campo `anno` nel cache entry)
  - Cache con TTL di 24 ore (prezzi storici non cambiano nel corso dell'anno)

## Motivo

La funzione è necessaria per calcolare la performance Year-To-Date (YTD) dei titoli nella watchlist, confrontando il prezzo corrente con quello del primo giorno di borsa dell'anno.

## Impatto

- `src/lib/yahoo.ts` — solo aggiunta, nessuna modifica al codice esistente
- Nessuna pagina impattata direttamente; la funzione verrà chiamata nei passaggi successivi dalla pagina watchlist
