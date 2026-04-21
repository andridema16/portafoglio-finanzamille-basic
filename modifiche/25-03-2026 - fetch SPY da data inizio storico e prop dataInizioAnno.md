# Fetch SPY da data inizio storico e prop dataInizioAnno

- **Ora**: 25-03-2026
- **File modificati**:
  - `src/app/(protected)/dashboard/page.tsx`
  - `src/app/(protected)/dashboard/DashboardCharts.tsx`
  - `src/components/charts/GraficoComparativo.tsx`
- **Cosa è stato modificato**:
  - In `page.tsx`: aggiunto calcolo di `dataInizioStorico` (data più vecchia dello storico, con fallback a `portafoglioDB.dataInizio`) e usato per fetchare lo storico SPY al posto di `portafoglioDB.dataInizio`. Aggiunta prop `dataInizioAnno="2026-01-01"` a `DashboardCharts`.
  - In `DashboardCharts.tsx`: aggiunta prop `dataInizioAnno: string` all'interfaccia Props, passata a `GraficoComparativo`.
  - In `GraficoComparativo.tsx`: aggiunta `dataInizioAnno?: string` all'interfaccia Props (solo dichiarazione, nessuna logica — verrà usata nella fase successiva).
- **Motivo**: disaccoppiare la data di fetch SPY dalla data di inizio portafoglio, in modo che SPY venga fetchato dalla data più vecchia effettivamente presente nello storico. Preparazione per filtraggio YTD nel grafico comparativo.
- **Impatto**: dashboard — grafico comparativo (dati SPY potenzialmente più ampi), nessun impatto visivo immediato per `dataInizioAnno` (prop preparatoria).
