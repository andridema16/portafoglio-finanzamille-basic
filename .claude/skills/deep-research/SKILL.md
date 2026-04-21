---
name: deep-research
description: "Use when the user needs thorough research on financial topics, market analysis, technology evaluation, or any investigation requiring multiple sources and citations."
---

# Deep Research — Ricerca Approfondita Multi-Fonte

Report di ricerca con citazioni da fonti multiple.
Produce analisi verificabili per decisioni informate.

## Quando Usare

- Ricerca su temi finanziari/macroeconomici
- Analisi di mercato per la newsletter
- Valutazione tecnologie o servizi
- Investigazione su trend o settori
- Qualsiasi analisi che richiede fonti multiple e verificabilità

## Workflow

### 1. Chiarire gli Obiettivi
Fare 1-2 domande sull'intento:
- **Apprendimento**: panoramica ampia, molte fonti
- **Decisione**: pro/contro specifici, raccomandazione
- **Scrittura**: dati e citazioni per contenuto (newsletter, articolo)

### 2. Pianificare la Ricerca
Scomporre il tema in 3-5 sotto-domande:
```
Tema: "Impatto decisioni Fed sui mercati europei"
→ 1. Ultima decisione Fed e forward guidance
→ 2. Reazione mercati USA (S&P 500, Treasury yields)
→ 3. Correlazione storica con mercati europei
→ 4. Posizionamento BCE e divergenza politiche
→ 5. Implicazioni per investitori retail italiani
```

### 3. Ricerca Multi-Fonte
- Eseguire **15-30 ricerche uniche** via web search
- Fonti prioritarie per FinanzAmille:
  - **Dati mercato**: Alpha Vantage, Yahoo Finance, Investing.com
  - **Macro USA**: Fed, Bureau of Labor Statistics, FRED
  - **Macro Italia/EU**: BCE, ISTAT, Eurostat
  - **Analisi**: Seeking Alpha, Bloomberg, Financial Times
  - **Italiano**: Il Sole 24 Ore, Milano Finanza
- Cercare prospettive diverse (bull e bear case)

### 4. Analisi Approfondita Fonti Chiave
- Leggere in profondità 3-5 URL più promettenti
- Estrarre dati specifici, citazioni, grafici
- Cross-reference tra fonti diverse

### 5. Sintesi Report
Strutturare per tema con citazioni inline:

```markdown
## Sommario Esecutivo
[3-5 frasi — il quadro completo]

## Sezione 1: [Tema]
[Findings con citazioni: "L'inflazione USA è scesa al 2.8% (BLS, marzo 2026)"]

## Sezione 2: [Tema]
[...]

## Takeaway Chiave
- [Punto 1 con fonte]
- [Punto 2 con fonte]
- [Punto 3 con fonte]

## Fonti
1. [Nome fonte] — [URL] — [Riassunto 1 riga]
2. [...]

## Note Metodologiche
[Limitazioni, gap informativi, avvertenze]
```

### 6. Consegna
- Postare sommario nella conversazione
- Salvare report completo su file se richiesto

## Standard di Qualità

- **Ogni claim richiede attribuzione** — nessuna affermazione senza fonte
- **Cross-reference** — verificare claim importanti su fonti multiple
- **Preferire fonti recenti** — ultimi 12 mesi, idealmente ultimi 30 giorni per dati mercato
- **Segnalare asserzioni da fonte singola** — "secondo [fonte], ..." quando non confermato altrove
- **Etichettare chiaramente**: stime, proiezioni, opinioni
- **Riconoscere gap informativi** — dire esplicitamente cosa NON si è trovato

## Parallelizzazione

Per temi ampi, usare il tool Agent per distribuire sotto-domande
su più agenti di ricerca in parallelo:

```
Sotto-domanda 1 → Agent ricerca (mercati USA)
Sotto-domanda 2 → Agent ricerca (macro Europa)
Sotto-domanda 3 → Agent ricerca (implicazioni retail)
→ Sintesi finale nel report
```

## Output per la Newsletter

Quando la ricerca è destinata alla newsletter quotidiana:
- Evidenziare i 3-5 dati più significativi
- Formattare per il template della Content Engine
- Includere fonti verificabili per ogni dato citato
- Segnalare se un dato è preliminare o soggetto a revisione
