# Log Modifiche

Ogni volta che viene effettuata una modifica al codice, Claude DEVE:

1. Creare un file nella cartella `modifiche/` con nome formato `DD-MM-YYYY - nome descrittivo della modifica.md` (es. `13-03-2026 - creazione dashboard.md`, `13-03-2026 - fix bug prenotazioni.md`). Ogni modifica ha il suo file separato, anche se fatta nello stesso giorno.
2. Per ogni modifica scrivere:
   - **Ora**: orario della modifica
   - **File modificato**: percorso completo del file
   - **Cosa è stato modificato**: descrizione breve
   - **Motivo**: perché è stata fatta la modifica
3. Salvare il file al termine della modifica

Questo serve al proprietario per sapere sempre cosa è stato cambiato e dove intervenire se necessario.
