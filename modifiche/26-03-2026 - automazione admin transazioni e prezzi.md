# Automazione Admin — Transazioni e Prezzi

- **Ora**: 26-03-2026
- **File modificati**:
  - `src/lib/calcoli.ts` — Aggiunte 4 funzioni di calcolo automatico
  - `src/lib/ricalcola-portafoglio.ts` — Nuovo modulo per ricalcolo a cascata
  - `src/app/api/admin/transazioni/route.ts` — Riscrittura completa POST con logica automatica
  - `src/app/api/admin/aggiorna-prezzo/route.ts` — Nuovo endpoint aggiornamento prezzi
  - `src/components/admin/FormTransazione.tsx` — Riscrittura con form semplificato e preview
  - `src/components/admin/FormAggiornaPrezzi.tsx` — Nuovo componente tabella prezzi batch
  - `src/app/(protected)/admin/prezzi/page.tsx` — Nuova pagina aggiornamento prezzi
  - `src/app/(protected)/admin/transazioni/nuova/page.tsx` — Aggiunto passaggio categorie al form
  - `src/components/Sidebar.tsx` — Aggiunto link "Aggiorna Prezzi" nel menu admin
  - `src/lib/__tests__/calcoli-auto.test.ts` — 71 test per le nuove funzioni di calcolo
- **Cosa è stato modificato**:
  - Il sistema admin ora calcola automaticamente tutti i valori derivati quando si inserisce una transazione (vendita, acquisto, dividendo). L'admin inserisce solo dati minimi (ticker, azioni, prezzo, nota). Il sistema ricava nome, prezzo di carico, utile/perdita, percentuale, e aggiorna automaticamente titolo, categoria, portafoglio e liquidità.
  - Aggiunta pagina batch per aggiornamento prezzi manuali con preview delle variazioni.
  - Il form transazioni ora ha autocomplete ticker, preview calcoli in tempo reale, e rilevamento automatico di nuovi ticker.
- **Motivo**: Ridurre al minimo l'input manuale dell'admin, eliminando errori di calcolo e velocizzando l'inserimento operazioni.
- **Impatto**: Pannello admin — pagina transazioni, nuova pagina prezzi, sidebar admin, ricalcolo portafoglio/categorie
