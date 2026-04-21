# CLAUDE.md

Questo file guida Claude Code nello sviluppo del sito Portafoglio FinanzaMille.

## Progetto

Sito web **Portafoglio FinanzaMille** — mostra ai clienti il portafoglio di investimento dell'azienda: composizione, performance, transazioni e dividendi. Protetto da password mensile. Accessibile dal sito principale FinanzaMille.

## Struttura repository

- **`app/`** — Progetto Next.js (qui si lavora)
- **`file-excel/`** — PDF sorgente con i dati del portafoglio
- **`references/`** — Logo, screenshot del sito principale come riferimento visivo
- **`.claude/rules/`** — Regole dettagliate per argomento

## Regole (in `.claude/rules/`)

- **`brand.md`** — Colori, logo, stile visivo, coerenza col sito principale
- **`data.md`** — Struttura dati: categorie, titoli, transazioni, formato JSON
- **`pages.md`** — Pagine del sito: login, dashboard, categorie, transazioni
- **`auth.md`** — Autenticazione con password mensile, cookie, middleware
- **`auto-revisione.md`** — Ciclo obbligatorio di auto-revisione: ogni codice passa per QA + Code Review prima di essere presentato. Target 98-99% accuratezza.
- **`log-modifiche.md`** — Ogni modifica al codice genera un file di log in `modifiche/` con data, file toccati, cosa/perché/impatto.

## Comandi

Tutti da eseguire dentro `app/`:

```bash
cd app
npm run dev      # Dev server su http://localhost:3000
npm run build    # Build produzione
npm run lint     # ESLint
```

## Tech stack

- **Next.js 16** — App Router, `src/app/`
- **React 19** — React Compiler attivo
- **TypeScript** — Strict mode
- **Tailwind CSS v4** — Config CSS-based (`@theme inline`), NO `tailwind.config.js`
- **Recharts** — Grafici
- **date-fns** — Formattazione date

## Regole generali

- L'interfaccia è TUTTA in italiano
- Consultare `app/node_modules/next/dist/docs/` prima di scrivere codice Next.js (versione 16 con breaking changes)
- Path alias: `@/*` → `./src/*`
- NON committare `.env.local`
- I dati del portafoglio sono in `app/src/data/` come file JSON
