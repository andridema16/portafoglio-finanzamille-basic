- **Ora**: 01:30
- **File modificati**: Nessun file di codice modificato. Aggiornamenti al database Neon (silent-lake-22915658), tabella `storico`.
- **Cosa è stato modificato**:
  1. Verificati tutti gli 11 valori esistenti dello storico 2025 confrontandoli con i PDF in `storico.ptf/` — tutti corrispondono
  2. Inseriti 3 punti mancanti:
     - **2025-01-01**: $30,600 (capitale iniziale da flusso "inizio" 2025)
     - **2025-11-30**: $47,500 → poi aggiustato a $37,500 (vedi punto 3)
     - **2025-12-31**: $51,000 → poi aggiustato a $41,000 (vedi punto 3)
  3. Lo storico 2025 ora ha 14 righe complete
  4. **Correzione depositi**: i valori dello storico sono stati aggiustati sottraendo i depositi cumulativi per mostrare il rendimento reale degli investimenti (non i depositi come profitto):
     - Da Apr 30: sottratti $500 (deposito aprile)
     - Da Lug 31: sottratti $1,000 (depositi aprile + luglio)
     - Da Nov 30: sottratti $10,000 (tutti i depositi: $500 + $500 + $9,000)
     - Risultato: il grafico mostra +33.8% a fine anno invece del falso +55%
- **Motivo**: Il grafico "Anno 2025" era incompleto (mancavano 3 punti) e mostrava percentuali gonfiate perche' i depositi ($10,000 totali nel 2025) venivano conteggiati come profitto.
- **Impatto**: Dashboard — grafico comparativo Portafoglio vs S&P 500 nella vista "2025". Le percentuali ora riflettono il rendimento reale degli investimenti (~34%), non il semplice aumento di valore che includeva i depositi (~55%).
