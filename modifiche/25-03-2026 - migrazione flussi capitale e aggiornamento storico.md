# Migrazione flussi capitale e aggiornamento storico

- **Ora**: 25/03/2026
- **File modificati**:
  - `app/scripts/migrazione-flussi-capitale.ts` (nuovo)
- **Cosa è stato modificato**:
  - Creato script di migrazione che:
    1. Crea la tabella `flussi_capitale` nel database Neon (id, data, tipo, importo, valore_pre, capitale_post, nota)
    2. Inserisce 2 flussi: capitale iniziale (02/01/2026, $30,775) e prelievo (24/03/2026, $475)
    3. Inserisce/aggiorna 2 punti nello storico: 23/03 ($29,995) e 24/03 ($30,000)
    4. Aggiorna `investimento_iniziale` in tabella `portafoglio` da 30775 a 30300
  - Lo script è stato eseguito con successo e i dati verificati
- **Motivo**: Tracciare i flussi di capitale (depositi/prelievi) per calcolare correttamente la performance del portafoglio dopo il ribilanciamento del 24 marzo (prelievo di $475)
- **Impatto**: Database — nuova tabella `flussi_capitale`, storico aggiornato con 2 nuovi punti, valore investimento iniziale aggiornato. Impatta la dashboard (valore investimento iniziale), il grafico andamento (nuovi punti storico), e future funzionalità di tracking flussi.
