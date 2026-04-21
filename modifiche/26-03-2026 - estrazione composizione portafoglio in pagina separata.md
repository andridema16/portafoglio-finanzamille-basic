## Estrazione Composizione Portafoglio in pagina separata

- **Ora**: 26-03-2026
- **File modificati**:
  - `src/app/(protected)/dashboard/page.tsx` — rimossa sezione "Composizione Portafoglio" e import non utilizzati
  - `src/app/(protected)/composizione/page.tsx` — nuova pagina con la tabella composizione
  - `src/components/Sidebar.tsx` — aggiunta voce "Composizione" nella navigazione
- **Cosa è stato modificato**: La sezione "Composizione Portafoglio" (tabella categorie e titoli con P&L) è stata estratta dalla dashboard e spostata in una pagina dedicata accessibile da `/composizione`. La sidebar è stata aggiornata con la nuova voce di navigazione.
- **Motivo**: Richiesta dell'utente di separare la composizione del portafoglio dalla dashboard per avere una scheda dedicata.
- **Impatto**: Dashboard (rimossa tabella composizione), nuova pagina Composizione Portafoglio, sidebar (nuova voce di navigazione)
