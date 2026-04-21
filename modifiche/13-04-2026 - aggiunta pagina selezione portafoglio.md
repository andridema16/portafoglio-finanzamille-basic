# Aggiunta pagina selezione portafoglio

- **Ora**: 13-04-2026
- **File modificati**:
  - `src/app/scegli-portafoglio/page.tsx` (NUOVO)
  - `src/app/page.tsx`
  - `src/components/Sidebar.tsx`

- **Cosa è stato modificato**:
  - Creata nuova pagina `/scegli-portafoglio` con 2 card: "Portafoglio Intermedio" (attivo, link a /dashboard) e "Portafoglio Basic" (disabilitato, in arrivo)
  - Modificato il redirect post-login da `/dashboard` a `/scegli-portafoglio` (solo per utenti, admin resta su `/admin`)
  - Aggiunto link "Cambia portafoglio" nel footer della Sidebar per tornare alla selezione

- **Motivo**: Preparazione per supporto multi-portafoglio. L'utente deve poter scegliere tra portafoglio Basic e Intermedio dopo il login, invece di essere portato direttamente al dashboard.

- **Impatto**: Flusso di login (utenti normali vedono la pagina di selezione prima del dashboard), Sidebar (nuovo link nel footer), nessun impatto su dashboard, composizione, transazioni o altre pagine esistenti.
