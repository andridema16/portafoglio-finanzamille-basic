## Aggiunta calcolo rendimento Time-Weighted (TWR)

- **Ora**: 00:15
- **File modificati**:
  - `app/src/lib/calcoli.ts`
- **Cosa è stato modificato**:
  - Aggiunta funzione helper privata `valoreDopoFlusso` che calcola il valore del portafoglio subito dopo un flusso di capitale (inizio/deposito/prelievo)
  - Aggiunta funzione esportata `calcolaTWR(flussi, valoreAttuale)` che calcola il rendimento time-weighted del portafoglio
  - Aggiunto import del tipo `FlussoCapitale` da `@/types/portafoglio`
- **Motivo**: Il TWR è la metrica standard per valutare la performance di un portafoglio eliminando l'effetto distorsivo di depositi e prelievi. Permette di misurare la performance pura degli investimenti.
- **Impatto**: Funzione di libreria utilizzabile da dashboard, pagine analisi, e qualsiasi componente che necessiti del rendimento corretto del portafoglio. Non modifica pagine esistenti direttamente.
