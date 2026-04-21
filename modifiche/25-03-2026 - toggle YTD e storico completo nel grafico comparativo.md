# Toggle YTD e storico completo nel grafico comparativo

- **Ora**: 25-03-2026
- **File modificati**:
  - `src/components/charts/GraficoComparativo.tsx`
  - `src/__tests__/dashboard-data-inizio-storico.test.ts`
- **Cosa è stato modificato**:
  - Aggiunto toggle con due modalità al grafico comparativo: "Da inizio anno" (YTD, default) e "Storico completo"
  - In modalità YTD: filtra i dati dal 01/01/2026, formato asse X in DD/MM
  - In modalità completo: mostra tutti i dati storici, formato asse X in MMM YY (mesi abbreviati in italiano)
  - La normalizzazione (variazione %) si ricalcola dal primo punto della vista selezionata
  - Titolo dinamico in base alla modalità selezionata
  - `dataInizioAnno` cambiata da prop opzionale a required
  - Aggiornato test esistente per riflettere il cambio da opzionale a required
- **Motivo**: permettere all'utente di vedere sia la performance YTD che quella storica completa del portafoglio rispetto all'S&P 500
- **Impatto**: dashboard — grafico comparativo. Il toggle funziona client-side senza ricaricare la pagina.
