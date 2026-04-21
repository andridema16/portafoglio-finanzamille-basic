# Aggiornamento API routes per supporto multi-portafoglio

- **Ora**: 13/04/2026
- **File modificati**:
  - `src/app/api/admin/titoli/route.ts`
  - `src/app/api/admin/titoli/[ticker]/route.ts`
  - `src/app/api/admin/categorie/route.ts`
  - `src/app/api/admin/categorie/[id]/route.ts`
  - `src/app/api/admin/transazioni/route.ts`
  - `src/app/api/admin/transazioni/[id]/route.ts`
  - `src/app/api/admin/flussi/route.ts`
  - `src/app/api/admin/flussi/[id]/route.ts`
  - `src/app/api/admin/aggiorna-prezzo/route.ts`
  - `src/app/api/admin/ricalcola/route.ts`
  - `src/app/api/variazione-giornaliera/route.ts`
  - `src/app/api/prezzi/route.ts`

- **Cosa è stato modificato**: Tutti i 12 API route del progetto sono stati aggiornati per accettare e propagare il parametro `portfolioId` (tipo `PortfolioId = "intermedio" | "basic"`). Per le richieste GET il parametro viene letto dal query param `?portfolio=`, per POST/PUT/DELETE viene letto dal body della richiesta (`body.portfolioId`). Il valore di default è sempre `"intermedio"`. Il parametro viene passato a tutte le funzioni del database (`getTitoli`, `createTitolo`, `getTitoloByTicker`, `updateTitolo`, `deleteTitolo`, `getCategorie`, `createCategoria`, `getDividendiConId`, `getOperazioniConId`, `createDividendo`, `createOperazione`, `getPortafoglio`, `getFlussiCapitale`, `addFlussoCapitale`, `addStorico`, `updateInvestimentoIniziale`) e a `ricalcolaCascata()` come primo argomento.

- **Motivo**: Supporto multi-portafoglio. Il sistema ora gestisce due portafogli separati ("intermedio" e "basic") e ogni API deve operare sul portafoglio corretto.

- **Impatto**: Tutte le funzionalità admin (gestione titoli, categorie, transazioni, flussi, aggiornamento prezzi, ricalcolo completo) e le API pubbliche (prezzi live, variazione giornaliera) ora supportano il parametro portafoglio. Senza specificarlo, il comportamento resta invariato (default "intermedio").
