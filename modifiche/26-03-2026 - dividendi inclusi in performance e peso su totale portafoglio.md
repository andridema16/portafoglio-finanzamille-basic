## Dividendi inclusi nella performance e peso % sul totale portafoglio

- **Ora**: 26-03-2026
- **File modificati**:
  - `src/lib/calcoli.ts` — P&L ora include dividendi a tutti i livelli (titolo, categoria, portafoglio). Peso % titoli calcolato sul totale portafoglio.
  - `src/app/(protected)/dashboard/page.tsx` — Guadagno Totale non aggiunge dividendi separatamente (gia inclusi nel P&L). Passa totalPortafoglio a ricalcolaCategoriaConTitoli.
  - `src/app/(protected)/composizione/page.tsx` — Aggiunta colonna Dividendi. Passa totalPortafoglio per peso % corretto.
  - `src/app/(protected)/categoria/[slug]/page.tsx` — Fetch tutti i titoli per calcolo totale portafoglio. Peso % sul totale invece che sulla categoria. Footer mostra peso categoria su portafoglio.
- **Cosa è stato modificato**:
  - Formula P&L: da `valoreAttuale - costo` a `valoreAttuale - costo + dividendi` a tutti i livelli
  - Peso % titoli: da relativo alla categoria a relativo al totale portafoglio
  - Aggiunta colonna Dividendi nella tabella composizione
  - Rimosso doppio conteggio dividendi nel Guadagno Totale della dashboard
- **Motivo**: I dividendi devono essere parte integrante della performance. Il peso di ogni azione deve riflettere la sua importanza sul portafoglio totale.
- **Impatto**: Dashboard (guadagno totale), Composizione Portafoglio (nuova colonna, pesi), Dettaglio Categoria (pesi, footer), tutti i calcoli P&L del sito
