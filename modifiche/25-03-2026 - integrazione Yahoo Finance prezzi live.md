## Integrazione Yahoo Finance per prezzi live

- **Ora**: 18:25
- **File modificati**:
  - `app/src/lib/yahoo.ts` (nuovo)
  - `app/src/lib/calcoli.ts` (nuovo)
  - `app/src/app/api/prezzi/route.ts` (nuovo)
  - `app/src/app/(protected)/dashboard/page.tsx` (modificato)
  - `app/src/app/(protected)/categoria/[slug]/page.tsx` (modificato)
  - `app/src/lib/__tests__/calcoli.test.ts` (nuovo - test)
  - `app/src/lib/__tests__/yahoo.test.ts` (nuovo - test)
  - `app/package.json` (aggiunta dipendenza yahoo-finance2)

- **Cosa è stato modificato**:
  - Aggiunta libreria `yahoo-finance2` per recuperare prezzi di mercato in tempo reale
  - Creato servizio `yahoo.ts` con cache in-memory (TTL 3 minuti) e fetch in batch da 10 ticker
  - Creato modulo `calcoli.ts` con funzioni pure per ricalcolare P&L, percentuali e pesi a partire dai prezzi live
  - Creato endpoint API GET `/api/prezzi` che ritorna i prezzi live per tutti i ticker
  - Aggiornate dashboard e pagina categoria: fetch DB, arricchimento con prezzi live, ricalcolo completo di valori, P&L e percentuali
  - Aggiunto indicatore "Prezzi aggiornati alle HH:MM" (timezone Europe/Rome) su dashboard e pagine categoria
  - Dashboard e pagina categoria sono ora `force-dynamic` per garantire prezzi aggiornati ad ogni richiesta
  - Se Yahoo Finance non è raggiungibile, il sito usa i valori del database come fallback

- **Motivo**: Permettere ai clienti di vedere prezzi di mercato aggiornati in tempo reale invece dei soli dati statici del database

- **Impatto**: Dashboard, tutte le pagine categoria, nuovo endpoint API `/api/prezzi`. Il fallback al DB garantisce che il sito funzioni anche senza connessione a Yahoo Finance.
