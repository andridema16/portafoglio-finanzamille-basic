# Filtro flussi di capitale per calcolo TWR dashboard

- **Ora**: 26/03/2026
- **File modificati**:
  - `src/lib/db.ts`
  - `src/app/(protected)/dashboard/page.tsx`

- **Cosa è stato modificato**:
  - Aggiunta funzione `getFlussiCapitaleDa(dataInizio)` in db.ts che filtra i flussi con `WHERE data >= dataInizio`
  - La funzione esistente `getFlussiCapitale()` non è stata toccata (serve per la pagina Ribilanciamenti)
  - Nella dashboard, la chiamata a `getFlussiCapitale()` è stata sostituita con `getFlussiCapitaleDa(portafoglioDB.dataInizio)` per usare solo i flussi del portafoglio corrente (dal 2026-01-02)

- **Motivo**: Il calcolo TWR nella dashboard includeva i flussi 2025 (inizio, depositi, prelievo) che appartengono al portafoglio precedente, falsando il rendimento ponderato del portafoglio 2026

- **Impatto**: Dashboard — il calcolo TWR ora considera solo i flussi dal 2026-01-02 in poi (inizio + prelievo 24/03). La pagina Ribilanciamenti continua a mostrare tutti i flussi.
