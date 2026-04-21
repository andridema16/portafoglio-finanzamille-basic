## Watchlist UI utente

- **Ora**: 14/04/2026
- **File modificati**:
  - `src/components/WatchlistSidebar.tsx` (nuovo)
  - `src/app/(protected)/watchlist/layout.tsx` (nuovo)
  - `src/app/(protected)/watchlist/page.tsx` (nuovo)
  - `src/components/WatchlistGrid.tsx` (nuovo)
  - `src/components/WatchlistDrawer.tsx` (nuovo)
- **Cosa è stato modificato**: Creata l'intera sezione watchlist lato utente con 5 file: sidebar dedicata, layout, pagina server, griglia con filtri e ricerca, drawer laterale per dettaglio titolo.
- **Motivo**: Implementare la pagina watchlist pubblica che mostra ai clienti i titoli sotto osservazione, con possibilità di filtrare per settore/paese/rating e visualizzare i dettagli in un pannello laterale.
- **Impatto**: Nuova sezione `/watchlist` accessibile dal menu. Include sidebar con navigazione, griglia card filtrabili, e drawer dettaglio con analisi, metriche e rating.
