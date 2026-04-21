# Storico completo e toggle grafico — Fasi 1-4

- **Ora**: 25-03-2026
- **File modificati**:
  - `src/lib/db.ts`
  - `src/lib/yahoo.ts`
  - `src/app/(protected)/dashboard/page.tsx`
  - `src/app/(protected)/dashboard/DashboardCharts.tsx`
  - `src/components/charts/GraficoComparativo.tsx`
  - `src/__tests__/dashboard-data-inizio-storico.test.ts`

---

## Fase 1 — Vincolo UNIQUE su storico e inserimento dati storici

- **Cosa è stato modificato**: Aggiunto vincolo UNIQUE sulla colonna `data` della tabella `storico` nel database Neon. Creata la funzione `addStorico()` in `db.ts` con `INSERT ... ON CONFLICT (data) DO UPDATE SET valore` per upsert sicuro. Inseriti 13 punti di storico mensile del portafoglio (da dicembre 2024 a marzo 2026) nel database tramite query SQL dirette.
- **Motivo**: il portafoglio aveva solo 2 punti storico (inizio e oggi). Serviva lo storico completo mensile per il grafico comparativo, e il vincolo UNIQUE previene duplicati sulle date.
- **Impatto**: database — tabella `storico`, grafico comparativo nella dashboard (ora ha 13 punti invece di 2).

## Fase 2 — Fix cache SPY con parametro dataInizio

- **Cosa è stato modificato**: La cache in-memory di `getStoricoSPY()` in `yahoo.ts` ora tiene conto del parametro `dataInizio`. Aggiunto campo `dataInizio: string` a `SpyCacheEntry`, verifica nel check cache che `spyCache.dataInizio === dataInizio`, e salvataggio del valore in cache.
- **Motivo**: la cache era singola e non distingueva tra chiamate con `dataInizio` diversi. Se veniva chiamata prima con "2024-12-31" e poi con "2026-01-01", ritornava i dati sbagliati dalla cache.
- **Impatto**: dashboard — grafico comparativo SPY, qualsiasi pagina che usa `getStoricoSPY` con date diverse.

## Fase 3 — Fetch SPY da data inizio storico e prop dataInizioAnno

- **Cosa è stato modificato**:
  - In `page.tsx`: aggiunto calcolo di `dataInizioStorico` (data piu vecchia dello storico con fallback a `portafoglioDB.dataInizio`) e usato per fetchare lo storico SPY al posto di `portafoglioDB.dataInizio`. Aggiunta prop `dataInizioAnno="2026-01-01"` a `DashboardCharts`.
  - In `DashboardCharts.tsx`: aggiunta prop `dataInizioAnno: string` all'interfaccia Props, passata a `GraficoComparativo`.
  - In `GraficoComparativo.tsx`: aggiunta `dataInizioAnno: string` all'interfaccia Props (preparazione per la fase 4).
- **Motivo**: disaccoppiare la data di fetch SPY dalla data di inizio portafoglio, in modo che SPY venga fetchato dalla data piu vecchia effettivamente presente nello storico. Preparazione per il toggle YTD/storico completo.
- **Impatto**: dashboard — grafico comparativo (dati SPY ora coprono da dicembre 2024 a oggi).

## Fase 4 — Toggle YTD e storico completo nel grafico comparativo

- **Cosa è stato modificato**:
  - In `GraficoComparativo.tsx`: aggiunto state `vista` ("ytd" | "completo", default "ytd"). Aggiunto filtraggio dati PRIMA della normalizzazione in base alla vista selezionata. Toggle UI con due bottoni (verde scuro attivo, grigio chiaro inattivo). Formato asse X diverso per le due modalita (DD/MM per YTD, MMM YY in italiano per storico completo). Titolo dinamico. Array `MESI_IT` per abbreviazioni italiane dei mesi.
  - In `dashboard-data-inizio-storico.test.ts`: aggiornato test per riflettere `dataInizioAnno` da opzionale a required.
- **Motivo**: permettere all'utente di vedere sia la performance YTD che quella storica completa del portafoglio rispetto all'S&P 500.
- **Impatto**: dashboard — grafico comparativo. Il toggle funziona client-side senza ricaricare la pagina. In modalita YTD mostra i dati dal 2 gennaio 2026, in modalita storico completo mostra da dicembre 2024 con 13 punti portafoglio e la linea SPY giornaliera. La normalizzazione riparte da 0% per entrambe le modalita.
