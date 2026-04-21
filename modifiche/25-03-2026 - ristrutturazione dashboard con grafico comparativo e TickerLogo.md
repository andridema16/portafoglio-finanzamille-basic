# Ristrutturazione Dashboard con Grafico Comparativo e TickerLogo

- **Ora**: 19:12
- **File modificati**:
  - `src/components/TickerLogo.tsx` (nuovo)
  - `src/components/charts/GraficoComparativo.tsx` (nuovo)
  - `src/lib/yahoo.ts` (modificato)
  - `src/app/(protected)/dashboard/page.tsx` (riscritto)
  - `src/app/(protected)/dashboard/DashboardCharts.tsx` (semplificato)
  - `next.config.ts` (modificato)
  - `src/__tests__/ticker-logo-yahoo-grafico.test.ts` (nuovo)

- **Cosa è stato modificato**:
  1. Creato componente TickerLogo con immagine da Parqet e fallback cerchio colorato
  2. Aggiunta funzione getStoricoSPY in yahoo.ts per dati storici S&P 500 con cache 30 min
  3. Creato GraficoComparativo (LineChart a 2 linee normalizzate a % variazione)
  4. Ristrutturata la dashboard: hero card con valore totale, grafico comparativo portafoglio vs SPY, tabella composizione con tutti i titoli
  5. Rimossi i 4 grafici di esposizione dalla dashboard (da spostare in pagina Analisi)
  6. Rimossa tabella categorie dalla dashboard
  7. Aggiunto dominio assets.parqet.com in next.config.ts per immagini remote

- **Motivo**: Ristrutturazione richiesta per migliorare la dashboard con confronto benchmark S&P 500 e vista completa di tutti i titoli con loghi

- **Impatto**: Dashboard completamente ridisegnata. I grafici di esposizione (categoria, asset class, geografia, settore) non sono più visibili finché non vengono aggiunti alla pagina Analisi.
