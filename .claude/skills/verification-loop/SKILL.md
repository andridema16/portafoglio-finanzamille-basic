---
name: verification-loop
description: "Use after completing a feature or significant code change, before creating a PR, or when ensuring quality gates pass. Runs 6 sequential verification phases."
---

# Verification Loop — Ciclo di Verifica Completo

Sistema di quality assurance in 6 fasi sequenziali.
Esegue build, type check, lint, test, security scan e diff review.

## Quando Usare

- Dopo aver completato una feature o modifica significativa
- Prima di creare un PR
- Per assicurarsi che i quality gate passino
- Dopo refactoring

## Le 6 Fasi di Verifica

### Fase 1: Build Verification
```bash
npm run build
```
Il progetto deve compilare senza errori.
- Se fallisce → invocare `build-error-resolver` agent
- Non procedere alla fase 2 finché non passa

### Fase 2: Type Check
```bash
npx tsc --noEmit --pretty
```
Tutti i tipi TypeScript devono essere corretti.
- Controllare: tipo `any` espliciti non necessari
- Controllare: tipi mancanti su parametri funzione
- Controllare: interface/type non allineati con schema DB

### Fase 3: Lint Check
```bash
npm run lint
```
Il codice deve rispettare gli standard del progetto.
- Warning: accettabili ma da valutare
- Errori: devono essere risolti

### Fase 4: Test Suite
```bash
npm test
```
Tutti i test devono passare.
- Target: 100% dei test passati
- Obiettivo copertura: 80%+ sulle aree modificate
- Se falliscono → analizzare se il test è sbagliato o il codice

### Fase 5: Security Scan
Controllo manuale per:
- [ ] Nessun secret hardcodato (API keys, password, token)
- [ ] Nessun `console.log` con dati sensibili
- [ ] Input utente validato su ogni endpoint
- [ ] API keys solo server-side (non in `"use client"`)
- [ ] Import di `process.env` solo in server components/API routes
- [ ] Nessun dato finanziario esposto senza auth

```bash
# Cerca pattern sospetti
grep -rn "OPENAI_API_KEY\|ANTHROPIC_API_KEY\|password\|secret" --include="*.ts" --include="*.tsx" app/ components/ lib/ | grep -v ".env" | grep -v "process.env"
```

### Fase 6: Diff Review
Revisione finale delle modifiche:
```bash
git diff --stat
git diff
```
Controllare:
- [ ] Nessuna modifica non intenzionale
- [ ] File temporanei non inclusi
- [ ] Import inutilizzati rimossi
- [ ] Nessun codice commentato lasciato
- [ ] Le modifiche corrispondono all'obiettivo originale

## Output: Report di Verifica

```
Fase 1 Build:     ✅ PASS
Fase 2 Types:     ✅ PASS
Fase 3 Lint:      ⚠️  2 warning (non bloccanti)
Fase 4 Tests:     ✅ PASS (45/45, 83% coverage)
Fase 5 Security:  ✅ PASS
Fase 6 Diff:      ✅ PASS

PR READY: SI
```

## Regole

- Le fasi sono **SEQUENZIALI** — non procedere se una fase critica fallisce
- Build e Types sono **bloccanti** — devono passare
- Lint warning sono accettabili, errori no
- Test falliti sono **bloccanti** — analizzare causa prima di procedere
- Security è **bloccante** — nessun secret può passare
- Diff review è l'ultimo controllo di sanità

## Applicazione Continua

Per sessioni di lavoro estese:
- Eseguire dopo ogni modifica significativa
- Eseguire prima di ogni commit
- Checkpoint mentale dopo ogni componente/funzione completata
