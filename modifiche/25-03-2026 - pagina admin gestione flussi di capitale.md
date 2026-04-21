# Pagina Admin Gestione Flussi di Capitale

- **Ora**: 25/03/2026
- **File modificati**:
  - `src/app/api/admin/flussi/route.ts` (nuovo)
  - `src/app/api/admin/flussi/[id]/route.ts` (nuovo)
  - `src/app/(protected)/admin/flussi/page.tsx` (nuovo)
  - `src/components/Sidebar.tsx` (modificato)
  - `src/lib/db.ts` (modificato)

- **Cosa è stato modificato**:
  - Creata API route GET/POST per flussi di capitale (`/api/admin/flussi`) con verifica admin, validazione campi, e aggiornamento automatico di `investimento_iniziale` nel portafoglio quando il nuovo flusso ha la data più recente
  - Creata API route DELETE per singolo flusso (`/api/admin/flussi/[id]`) con protezione contro eliminazione del flusso di tipo "inizio"
  - Creata pagina admin `/admin/flussi` con form di inserimento (data, tipo deposito/prelievo, importo, valorePre, capitalePost, nota) e tabella con tutti i flussi con badge colorati (verde deposito, rosso prelievo, grigio inizio)
  - Aggiunta funzione `updateInvestimentoIniziale` in `db.ts` per aggiornare il capitale iniziale del portafoglio
  - Aggiunto link "Flussi Capitale" nella sidebar admin dopo "Gestione Transazioni"

- **Motivo**: Permettere all'admin di gestire depositi e prelievi dal portafoglio, tracciando i flussi di capitale con relativo aggiornamento del valore di investimento iniziale

- **Impatto**: Pannello admin (nuova sezione flussi), sidebar di navigazione, dati portafoglio (investimento_iniziale)
