# Supporto Multi-Portafoglio nelle Pagine Admin

- **Ora**: 13/04/2026
- **File modificati**:
  - `src/app/(protected)/admin/page.tsx`
  - `src/app/(protected)/admin/titoli/page.tsx`
  - `src/app/(protected)/admin/categorie/page.tsx`
  - `src/app/(protected)/admin/transazioni/page.tsx`
  - `src/app/(protected)/admin/flussi/page.tsx`
  - `src/app/(protected)/admin/prezzi/page.tsx`
  - `src/app/(protected)/admin/titoli/nuovo/page.tsx`
  - `src/app/(protected)/admin/titoli/[ticker]/modifica/page.tsx`
  - `src/app/(protected)/admin/transazioni/nuova/page.tsx`
  - `src/components/admin/FormAggiornaPrezzi.tsx`
  - `src/components/admin/FormTitolo.tsx`
  - `src/components/admin/FormTransazione.tsx`

- **Cosa è stato modificato**: Aggiunto selettore portafoglio (Intermedio/Basic) a tutte le pagine admin. Ogni pagina ora passa `?portfolio=X` nelle chiamate GET e `portfolioId` nel body delle chiamate POST/PUT/DELETE. I componenti form (FormTitolo, FormTransazione, FormAggiornaPrezzi) accettano ora una prop `portfolioId`. La pagina `transazioni/nuova` è stata convertita da server component a client component per supportare la lettura del portfolio dai search params.

- **Motivo**: Le API e il database ora supportano portafogli multipli (intermedio e basic). Le pagine admin dovevano essere aggiornate per permettere la gestione separata dei dati di ciascun portafoglio.

- **Impatto**: Tutte le pagine della sezione admin: dashboard admin, gestione titoli, categorie, transazioni, flussi di capitale, aggiornamento prezzi. I form di creazione/modifica titolo e nuova transazione ora includono il contesto del portafoglio selezionato.
