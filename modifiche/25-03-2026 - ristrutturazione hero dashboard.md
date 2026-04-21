# Ristrutturazione Hero Dashboard

- **Ora**: 25/03/2026
- **File modificati**:
  - `src/lib/db.ts` — aggiunta funzione `getDividendiTotaleAnno`
  - `src/app/(protected)/dashboard/page.tsx` — ristrutturata sezione Hero

- **Cosa è stato modificato**:
  - Aggiunta query `getDividendiTotaleAnno(anno)` in `db.ts` che calcola il totale dividendi ricevuti in un anno dalla tabella `dividendi`
  - Sostituita la vecchia sezione Hero (valore singolo + variazione YTD) con un layout a griglia 2x3/3x2 con 6 metriche: Capitale Investito, Valore Attuale, Profitto/Perdita, Dividendi 2026, Utile Realizzato, Liquidità
  - Aggiunta barra totale in fondo alla card con Valore Totale (portafoglio + liquidità)
  - Rimossi variabili inutilizzate `varYTD` e `varYTDPerc`

- **Motivo**: Rendere la sezione riepilogo della dashboard più informativa e allineata al layout dei PDF del portafoglio, mostrando tutte le metriche chiave in un colpo d'occhio

- **Impatto**: Dashboard — sezione Hero completamente ridisegnata. Nessun impatto su altre pagine.
