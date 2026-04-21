# Raggruppamento WatchlistGrid per settore

- **Ora**: 15-04-2026
- **File modificati**: `src/components/WatchlistGrid.tsx`
- **Cosa è stato modificato**:
  - Aggiunto `ETICHETTE_SETTORE` con mapping slug -> etichetta italiana leggibile per 15 settori
  - Aggiunto `raggruppati` useMemo che raggruppa i titoli filtrati per settore usando una Map
  - Sostituito il rendering piatto (un card per titolo) con il rendering raggruppato per settore: header verde scuro con nome settore + conteggio titoli, seguito da righe bianche con divider
  - Rimosso il tag settore (badge grigio) da dentro ogni riga, sia nel layout desktop che mobile, dato che ora il settore è indicato dall'header del gruppo
  - Mantenuto il tag paese in ogni riga
  - Aggiornato lo stile delle righe: rimosso `bg-white rounded-xl shadow-sm p-4` individuale, sostituito con `px-4 py-3 hover:bg-gray-50 transition-colors` dentro il contenitore del gruppo
  - Importato `Fragment` da React per il wrapping dei gruppi
- **Motivo**: Replicare il pattern visivo della pagina Composizione, raggruppando i titoli per settore con header verde scuro
- **Impatto**: Pagina Watchlist (`/watchlist`) - layout della griglia titoli completamente ridisegnato con raggruppamento per settore
