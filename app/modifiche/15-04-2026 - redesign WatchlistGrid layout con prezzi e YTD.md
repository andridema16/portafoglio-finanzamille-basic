# Redesign WatchlistGrid - Layout riga singola con prezzi e YTD

- **Ora**: 15-04-2026
- **File modificati**:
  - `src/components/WatchlistGrid.tsx` — riscrittura completa del layout
  - `src/lib/yahoo.ts` — fix TypeScript strict null check (riga 224)

- **Cosa è stato modificato**:
  - Cambiato layout da griglia 2 colonne a lista singola colonna con card orizzontali
  - Aggiunta nuova interfaccia Props con `prezziData` e `prezziTimestamp`
  - Integrato TickerLogo (36px desktop, 32px mobile) per ogni titolo
  - Aggiunto prezzo attuale formattato con `formatValuta()`, mostra "-" se null
  - Aggiunto YTD percentuale con colore verde/rosso tramite `colorePL()`
  - Aggiunto timestamp "Prezzi aggiornati alle HH:MM" sotto il conteggio risultati
  - Rimossa anteprima descrizione (line-clamp-3) — la descrizione resta nel drawer
  - Link "Vedi articolo" reso compatto (solo testo, non piu bottone)
  - Aggiunta icona chevron (>) a destra di ogni card desktop per indicare cliccabilita
  - Layout responsive: desktop riga orizzontale, mobile 2-3 righe impilate
  - Fix non-null assertion su `cacheInizioAnno.prezzi` in yahoo.ts

- **Motivo**: Migliorare la densita informativa della watchlist mostrando prezzi live e performance YTD direttamente nella lista, senza dover aprire il drawer per ogni titolo

- **Impatto**: Pagina watchlist (`/watchlist`) — layout completamente ridisegnato, tutte le funzionalita esistenti (ricerca, filtri, drawer) preservate
