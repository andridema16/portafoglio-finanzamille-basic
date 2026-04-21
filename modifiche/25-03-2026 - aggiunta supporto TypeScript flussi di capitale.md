## Aggiunta supporto TypeScript flussi di capitale

- **Ora**: 25-03-2026
- **File modificati**:
  - `src/types/portafoglio.ts`
  - `src/lib/db.ts`
- **Cosa è stato modificato**:
  - Aggiunto tipo `FlussoCapitale` con campi: id, data, tipo (deposito/prelievo/inizio), importo, valorePre, capitalePost, nota
  - Aggiunto helper `rowToFlussoCapitale` per conversione riga DB → tipo TS
  - Aggiunte funzioni CRUD: `getFlussiCapitale`, `addFlussoCapitale`, `updateFlussoCapitale`, `deleteFlussoCapitale`
  - Aggiunta funzione `getCapitaleInvestitoCorrente` con fallback su investimento iniziale
- **Motivo**: Supporto per tracciare i flussi di capitale (depositi, prelievi) nel portafoglio, necessario per calcolare correttamente il rendimento TWR
- **Impatto**: Layer dati — nessun impatto visivo diretto. Prerequisito per future pagine/componenti che mostreranno i flussi di capitale
