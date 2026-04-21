# Ciclo di Auto-Revisione

**Obiettivo: 98-99% di accuratezza.** Ogni pezzo di codice deve essere quasi perfetto prima di essere presentato all'utente. I subagent QA e Code Review devono lavorare finché questo standard non è raggiunto. Non esiste un limite massimo di iterazioni — si continua finché il codice non è solido.

Per QUALSIASI istruzione, Claude DEVE seguire automaticamente il ciclo appropriato in base al tipo di modifica.

---

## Tipo A: Codice e logica (non visivo)

Esempi in questo progetto: API route autenticazione, middleware password, logica dati JSON, formattazione numeri/valute, calcoli P&L.

### Fase 1: Esecuzione
1. **Eseguire** l'istruzione (scrivere/modificare il codice)

### Fase 2: Auto-revisione
2. **Rileggere** il codice appena scritto con occhio critico
3. **Verificare**: funziona correttamente? Mancano casi limite? Ci sono bug? È efficiente? È sicuro?
4. **Controllare specificamente**:
   - I calcoli finanziari sono corretti? (P&L, percentuali, totali)
   - I dati USD sono formattati correttamente? (virgola migliaia, punto decimali)
   - Il middleware auth blocca tutte le rotte protette?
   - I tipi TypeScript sono strict e corretti?
5. **Migliorare** il codice in base ai problemi trovati

### Fase 3: Quality Gate (subagent obbligatori)
Dopo l'auto-revisione, lanciare ENTRAMBI i subagent in parallelo:

6. **QA subagent** (`.claude/agents/qa.md`) — Genera test per il codice appena scritto, li esegue, e riporta PASS/FAIL. Copre: happy path, edge case, errori, dati mancanti/malformati.

7. **Code Review subagent** (`.claude/agents/code-reviewer.md`) — Review imparziale. Controlla: correttezza, leggibilità, performance, sicurezza, error handling. Restituisce: PASS / PASS WITH NOTES / NEEDS CHANGES.

### Fase 4: Correzione e ri-verifica
8. Se QA riporta **FAIL** → correggere i bug, rilanciare QA
9. Se Code Review riporta **NEEDS CHANGES** → applicare le correzioni, rilanciare Code Review
10. **Ripetere finché entrambi non danno PASS.**
11. Se un problema è irrisolvibile (dipendenza mancante, limite piattaforma), spiegare all'utente e proporre alternative.

### Fase 5: Presentazione
12. **Presentare** il risultato finale all'utente solo quando:
    - Auto-revisione completata
    - QA: **PASS** (100% test passati)
    - Code Review: **PASS** o **PASS WITH NOTES**
    - Accuratezza stimata: **98-99%**

---

## Tipo B: Layout, UI e elementi visivi

Esempi in questo progetto: pagina login, dashboard con grafici, tabelle titoli, sidebar, card riepilogo, grafico a torta Recharts.

### Fase 1: Esecuzione
1. **Eseguire** l'istruzione (creare/modificare il componente UI)

### Fase 2: Screenshot e confronto
2. **Catturare uno screenshot** del risultato
3. **Confrontare** con i riferimenti in `references/` (stile sito principale FinanzaMille)
4. **Valutare**: colori brand rispettati? Spaziature coerenti? Card arrotondate? Sidebar verde scuro? Font Geist? Responsive?

### Fase 3: Quality Gate (subagent + screenshot)
Lanciare in parallelo:

5. **QA subagent** — Test sul componente UI (rendering, props, stati)
6. **Code Review subagent** — Review del codice del componente
7. **Screenshot** — Nuovo screenshot dopo correzioni

### Fase 4: Correzione e ri-verifica
8. Correggere problemi di codice (dai subagent) e visivi (dal confronto screenshot)
9. **Ripetere finché:**
   - Subagent danno PASS
   - Screenshot coerente col brand FinanzaMille al **98-99%**
10. Se il risultato visivo non può raggiungere il 98% per limiti tecnici, spiegare all'utente cosa diverge.

### Fase 5: Presentazione
11. **Mostrare** lo screenshot finale all'utente per approvazione, insieme al risultato dei subagent

---

## Regole generali
- Questo ciclo è **AUTOMATICO**: Claude non deve chiedere conferma a ogni iterazione
- I subagent vengono lanciati in **parallelo** per risparmiare tempo
- **Non esiste un limite di iterazioni** — si continua finché il risultato non raggiunge il 98-99%
- L'unico motivo per fermarsi prima è un blocco tecnico irrisolvibile
- Il ciclo si applica a: componenti React, API routes, middleware, logica dati, pagine Next.js, stili Tailwind, grafici Recharts
- Il ciclo NON si applica a: file di documentazione (.md), file di configurazione (JSON/YAML), modifiche cosmetiche
- Se un'istruzione è MISTA (codice + visivo), applicare ENTRAMBI i tipi
