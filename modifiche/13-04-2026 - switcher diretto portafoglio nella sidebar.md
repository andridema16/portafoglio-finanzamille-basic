# Switcher diretto portafoglio nella Sidebar

- **Ora**: 13-04-2026
- **File modificati**: `src/components/Sidebar.tsx`
- **Cosa è stato modificato**: Aggiunto uno switcher diretto nel footer della sidebar che permette di passare da un portafoglio all'altro (basic/intermedio) senza tornare alla pagina di selezione. Lo switcher mostra il portafoglio attivo, un link diretto all'altro portafoglio (con fallback a dashboard se la pagina corrente non esiste nell'altro portafoglio), e un link secondario "Tutti i portafogli" verso `/scegli-portafoglio`.
- **Motivo**: L'utente voleva poter cambiare portafoglio direttamente dalla sidebar senza dover navigare alla pagina `/scegli-portafoglio`.
- **Impatto**: Sidebar di tutte le pagine protette (dashboard, composizione, transazioni, pagamenti, ribilanciamenti, categorie) per entrambi i portafogli. Funziona anche su mobile.
