# Fix cache SPY con parametro dataInizio

- **Ora**: 25-03-2026
- **File modificati**: `src/lib/yahoo.ts`
- **Cosa è stato modificato**: La cache in-memory di `getStoricoSPY` ora tiene conto del parametro `dataInizio`. Aggiunto campo `dataInizio: string` a `SpyCacheEntry`, verifica nel check cache che `spyCache.dataInizio === dataInizio`, e salvataggio del valore in cache.
- **Motivo**: La cache era singola e non distingueva tra chiamate con `dataInizio` diversi. Se veniva chiamata prima con "2024-12-31" e poi con "2026-01-01", ritornava i dati sbagliati dalla cache.
- **Impatto**: Dashboard (grafico comparativo SPY), qualsiasi pagina che usa `getStoricoSPY` con date diverse.
