## Aggiunta sezione Watchlist completa

**Ora**: 14/04/2026

**File modificati**:
- `app/src/types/portafoglio.ts` — Aggiunti tipi `WatchlistRating` e `WatchlistItem`
- `app/src/lib/db.ts` — Aggiunto mapper `rowToWatchlistItem` + 6 funzioni CRUD watchlist
- `app/src/app/api/watchlist/route.ts` — API pubblica GET (tutti gli utenti autenticati)
- `app/src/app/api/admin/watchlist/route.ts` — API admin GET + POST
- `app/src/app/api/admin/watchlist/[id]/route.ts` — API admin GET + PUT + DELETE
- `app/src/components/admin/FormWatchlistItem.tsx` — Form CRUD admin con editor metriche key-value
- `app/src/app/(protected)/admin/watchlist/page.tsx` — Pagina admin lista watchlist
- `app/src/app/(protected)/admin/watchlist/nuovo/page.tsx` — Pagina admin creazione/modifica
- `app/src/components/WatchlistSidebar.tsx` — Sidebar dedicata per sezione watchlist
- `app/src/app/(protected)/watchlist/layout.tsx` — Layout watchlist con sidebar
- `app/src/app/(protected)/watchlist/page.tsx` — Pagina watchlist utente (server component)
- `app/src/components/WatchlistGrid.tsx` — Grid card con ricerca + filtri settore/paese/rating
- `app/src/components/WatchlistDrawer.tsx` — Drawer laterale con dettaglio completo
- `app/src/components/Sidebar.tsx` — Aggiunta voce "Gestione Watchlist" in admin + link "Watchlist" nel footer
- `app/src/app/scegli-portafoglio/page.tsx` — Terza card "Watchlist" + grid a 3 colonne

**Cosa e' stato modificato**:
Aggiunta una nuova sezione indipendente "Watchlist" al sito. La watchlist permette di monitorare azioni con descrizione, analisi opzionale e dati strutturati (target price, rating buy/hold/sell, P/E, dividend yield, metriche custom). Include: tabella DB in Neon PostgreSQL, API CRUD, pannello admin per gestione, e interfaccia utente con grid di card + drawer laterale + ricerca e filtri.

**Motivo**:
I clienti necessitano di una sezione per visualizzare titoli sotto osservazione con le relative analisi del gestore, separata dai portafogli di investimento attivi.

**Impatto**:
- Nuova sezione accessibile dalla pagina "Scegli portafoglio" (terza card)
- Nuova voce "Watchlist" nel footer della sidebar di ogni portafoglio
- Nuova voce "Gestione Watchlist" nel pannello admin
- 12 nuovi file, 4 file modificati, 1 nuova tabella database
