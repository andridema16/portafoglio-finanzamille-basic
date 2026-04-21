# Log Modifiche

Ogni volta che viene effettuata una modifica al codice del sito, Claude DEVE:

1. Creare un file nella cartella `modifiche/` con nome formato `DD-MM-YYYY - nome descrittivo della modifica.md` (es. `25-03-2026 - creazione pagina login.md`, `25-03-2026 - aggiunta grafico esposizione geografica.md`). Ogni modifica ha il suo file separato, anche se fatta nello stesso giorno.

2. Per ogni modifica scrivere:
   - **Ora**: orario della modifica
   - **File modificati**: elenco dei percorsi dei file toccati (relativi a `app/`)
   - **Cosa è stato modificato**: descrizione breve e chiara
   - **Motivo**: perché è stata fatta la modifica
   - **Impatto**: quali pagine/funzionalità del sito sono coinvolte (es. dashboard, login, categoria commodities, grafico a torta)

3. Salvare il file al termine della modifica

## Quando creare un log
- Creazione o modifica di componenti React
- Modifica ai file JSON dei dati (`app/src/data/`)
- Modifica ai tipi TypeScript (`app/src/types/`)
- Modifica allo stile (Tailwind, globals.css)
- Modifica all'autenticazione (middleware, API route)
- Aggiunta/rimozione dipendenze npm

## Quando NON creare un log
- Modifiche a file `.md` (documentazione, regole, agenti)
- Modifiche a file di configurazione che non impattano il sito (`.eslintrc`, `.gitignore`)

Questo serve al proprietario per sapere sempre cosa è stato cambiato e dove intervenire se necessario.
