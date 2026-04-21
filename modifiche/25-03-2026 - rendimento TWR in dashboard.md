# Rendimento TWR in Dashboard

- **Ora**: 25/03/2026
- **File modificati**:
  - `src/app/(protected)/dashboard/page.tsx`

- **Cosa è stato modificato**:
  - Aggiunta importazione di `getFlussiCapitale` da `@/lib/db` e `calcolaTWR` da `@/lib/calcoli`
  - Aggiunta chiamata `getFlussiCapitale()` nel `Promise.all` iniziale per caricare i flussi di capitale
  - Calcolo del TWR (Time-Weighted Return) dopo il ricalcolo del portafoglio
  - Sostituita la card "Profitto / Perdita" con la card "Performance" che mostra:
    - TWR formattato come percentuale con segno (es. +0.92%) come valore principale
    - Etichetta "Rendimento ponderato (TWR)"
    - P&L semplice in dollari sotto (es. -$300 su $30,300 investiti)
  - Aggiornata la sottotitolo della card "Capitale Investito" da "Investimento iniziale" a "Capitale corrente"

- **Motivo**: Il rendimento semplice (P&L%) non tiene conto dei cambi di capitale (depositi/prelievi). Il TWR elimina l'effetto dei flussi di capitale e misura la performance pura degli investimenti. La card ora mostra sia il TWR come metrica principale sia il P&L in dollari come contesto secondario.

- **Impatto**: Dashboard — sezione metriche principali (card Performance e card Capitale Investito)
