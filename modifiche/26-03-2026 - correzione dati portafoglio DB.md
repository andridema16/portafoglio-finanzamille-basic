- **Ora**: 01:15
- **File modificati**: Nessun file di codice modificato. Aggiornamenti al database Neon (silent-lake-22915658).
- **Cosa è stato modificato**:
  1. **Tabella `portafoglio`**: aggiornati valore_attuale (30016), profitto_o_perdita (-284), var_percentuale (-0.94) con i valori reali forniti dal gestore
  2. **Tabella `titoli` — PEP**: corretto num_azioni da 1.6 a 1.0 (vendita di 0.6 azioni del 04/02/2026 non era riflessa nel DB). Ricalcolati valore_attuale, P&L e P&L%
  3. **Tabella `titoli` — TTE**: corretto num_azioni da 3 a 2 (vendita di 1 azione del 25/03/2026 non era riflessa nel DB). Ricalcolati valore_attuale, P&L e P&L%
- **Motivo**: Il portafoglio appariva in guadagno nella dashboard ma in realta' e' in perdita. Le cause erano: (a) num_azioni errato per PEP e TTE (vendite registrate in `operazioni` ma non aggiornate in `titoli`), che inflazionava il valore totale calcolato da Yahoo; (b) valori aggregati nel portafoglio non allineati ai dati reali del gestore
- **Impatto**: Dashboard — riepilogo portafoglio, tutte le card con P&L e valore attuale. Con num_azioni corretto, i prezzi live di Yahoo ora moltiplicano per il numero giusto di azioni, producendo un valore totale piu' vicino alla realta'
