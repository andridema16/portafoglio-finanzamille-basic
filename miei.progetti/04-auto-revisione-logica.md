# Ciclo di Auto-Revisione

**Obiettivo: 98-99% di accuratezza.** Ogni pezzo di codice deve essere quasi perfetto prima di essere presentato all'utente. I subagent QA e Code Review devono lavorare finché questo standard non è raggiunto. Non esiste un limite massimo di iterazioni — si continua finché il codice non è solido.

Per QUALSIASI istruzione, Claude DEVE seguire automaticamente il ciclo appropriato in base al tipo di modifica.

---

## Tipo A: Codice e logica (non visivo)

### Fase 1: Esecuzione
1. **Eseguire** l'istruzione (scrivere/modificare il codice)

### Fase 2: Auto-revisione
2. **Rileggere** il codice appena scritto con occhio critico
3. **Verificare**: funziona correttamente? Mancano casi limite? Ci sono bug? È efficiente? È sicuro?
4. **Migliorare** il codice in base ai problemi trovati

### Fase 3: Quality Gate (subagent obbligatori)
Dopo l'auto-revisione, lanciare ENTRAMBI i subagent in parallelo:

5. **QA subagent** (`.claude/agents/qa.md`) — Genera test automatici per il codice appena scritto, li esegue, e riporta PASS/FAIL. Copre: happy path, edge case, errori, sicurezza multi-tenant.

6. **Code Review subagent** (`.claude/agents/code-review-subagent.md`) — Review imparziale senza contesto del progetto. Controlla: correttezza, leggibilità, performance, sicurezza, error handling. Restituisce un verdetto: PASS / PASS WITH NOTES / NEEDS CHANGES.

### Fase 4: Correzione e ri-verifica
7. Se QA riporta **FAIL** → correggere i bug, rilanciare QA
8. Se Code Review riporta **NEEDS CHANGES** → applicare le correzioni, rilanciare Code Review
9. **Ripetere finché entrambi non danno PASS.** Non fermarsi dopo un numero fisso di iterazioni — continuare fino al risultato.
10. Se un problema è strutturalmente irrisolvibile (dipendenza esterna mancante, limite della piattaforma), spiegare all'utente cosa blocca e proporre alternative.

### Fase 5: Presentazione
11. **Presentare** il risultato finale all'utente solo quando:
    - Auto-revisione completata
    - QA: **PASS** (100% test passati)
    - Code Review: **PASS** o **PASS WITH NOTES** (nessun issue high/medium aperto)
    - Accuratezza stimata: **98-99%**

---

## Tipo B: Layout, UI e elementi visivi

Quando l'istruzione riguarda layout, design, logo, schermate o qualsiasi elemento visivo (incluso quando l'utente fornisce un'immagine di riferimento):

### Fase 1: Esecuzione
1. **Eseguire** l'istruzione (creare/modificare il codice UI)

### Fase 2: Screenshot e confronto
2. **Catturare uno screenshot** del risultato e salvarlo in `risultato/` con nome descrittivo (es. `dashboard-v1.png`)
3. **Confrontare** lo screenshot con l'istruzione originale (foto/riferimento fornito dall'utente)
4. **Valutare** le differenze pixel per pixel: colori, spaziature, allineamenti, font, icone, proporzioni

### Fase 3: Quality Gate (subagent + screenshot)
Lanciare in parallelo:

5. **QA subagent** — Test sul codice UI (rendering, props, stati)
6. **Code Review subagent** — Review del codice del componente
7. **Screenshot** — Nuovo screenshot dopo correzioni (es. `dashboard-v2.png`)

### Fase 4: Correzione e ri-verifica
8. Correggere sia i problemi di codice (dai subagent) sia quelli visivi (dal confronto screenshot)
9. **Ripetere finché:**
   - Subagent danno PASS
   - Screenshot corrisponde al riferimento al **98-99%** (differenze accettabili: variazioni minime di anti-aliasing o rendering del sistema operativo)
10. Se il risultato visivo non può raggiungere il 98% per limiti tecnici (es. font non disponibile, componente nativo diverso tra iOS/Android), spiegare all'utente cosa diverge e perché.

### Fase 5: Presentazione
11. **Mostrare** lo screenshot finale all'utente per approvazione, insieme al risultato dei subagent

---

## Regole generali
- Questo ciclo è **AUTOMATICO**: Claude non deve chiedere conferma a ogni iterazione
- I subagent vengono lanciati in **parallelo** per risparmiare tempo
- **Non esiste un limite di iterazioni** — si continua finché il risultato non raggiunge il 98-99% di accuratezza
- L'unico motivo per fermarsi prima è un blocco tecnico irrisolvibile — in quel caso, spiegare il problema all'utente
- Il ciclo si applica a: codice backend (Python), codice mobile (TypeScript/React Native), query SQL, script, componenti UI
- Il ciclo NON si applica a: file di documentazione (.md), file di configurazione semplici (JSON/YAML), modifiche cosmetiche (commenti, formattazione)
- Se un'istruzione è MISTA (codice + visivo), applicare ENTRAMBI i tipi
