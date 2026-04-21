---
name: security-scan
description: "Use to run AgentShield security scan on the codebase. Detects hardcoded secrets, injection vulnerabilities, auth bypasses, insecure AI integrations, and OWASP Top 10 issues. Run before merging, after adding API endpoints, or when touching auth/security code."
---

# AgentShield — Security Scan

Sistema di scansione di sicurezza per il codebase FinanzAmille.
Rileva vulnerabilità, secrets esposti, problemi di autenticazione e rischi
specifici delle integrazioni AI.

## Quando Usare

- **Prima di merge/PR** — scansione completa obbligatoria
- **Dopo aver aggiunto API endpoint** — verifica autenticazione e validazione
- **Dopo modifica codice auth** — verifica non ci siano bypass
- **Dopo modifica integrazione AI** — verifica prompt injection e data leakage
- **Dopo aggiornamento dipendenze** — verifica CVE note
- **Su richiesta** — `/security-scan` o quando si sospettano problemi

## Pipeline di Scansione (3 fasi)

### Fase 1: Scan Automatico (14 regole di detection)

Eseguire in sequenza:

#### 1.1 Secrets Detection
```bash
# Cerca API keys hardcodate
grep -rn "sk-[a-zA-Z0-9]" --include="*.ts" --include="*.tsx" app/ components/ lib/
grep -rn "OPENAI_API_KEY\|ANTHROPIC_API_KEY\|ALPHA_VANTAGE" --include="*.ts" --include="*.tsx" app/ components/ lib/ | grep -v "process.env"

# Cerca password e token hardcodati
grep -rn "password.*=.*['\"]" --include="*.ts" --include="*.tsx" app/ components/ lib/ | grep -v "process.env" | grep -v "\.test\." | grep -v "__tests__"
grep -rn "token.*=.*['\"]" --include="*.ts" --include="*.tsx" app/ components/ lib/ | grep -v "process.env" | grep -v "\.test\." | grep -v "__tests__"

# Verifica .env in .gitignore
grep -q "\.env" .gitignore && echo "✅ .env in .gitignore" || echo "❌ .env NON in .gitignore"
```

#### 1.2 Injection Detection
```bash
# SQL injection (string concatenation in query)
grep -rn "query.*\`.*\$\{" --include="*.ts" lib/db/
grep -rn "sql\`.*\$\{" --include="*.ts" lib/db/

# XSS (dangerouslySetInnerHTML)
grep -rn "dangerouslySetInnerHTML" --include="*.tsx" components/ app/

# Command injection
grep -rn "exec(\|spawn(\|execSync(" --include="*.ts" app/ lib/
```

#### 1.3 Auth Verification
```bash
# API routes senza auth check
for file in $(find app/api -name "route.ts"); do
  if ! grep -q "auth\|session\|getServerSession\|NextAuth" "$file"; then
    echo "⚠️  NO AUTH: $file"
  fi
done

# Client-side env access
grep -rn "process\.env\." --include="*.tsx" components/ | grep -v "NEXT_PUBLIC"
```

#### 1.4 AI Integration Security
```bash
# Risposte AI non validate
grep -rn "completion\|chat\|generate" --include="*.ts" app/api/ lib/ | grep -v "validate\|sanitize\|parse"

# Prompt injection vectors (user input in prompt senza sanitizzazione)
grep -rn "userMessage\|userInput\|req\.body" --include="*.ts" app/api/ | head -20
```

#### 1.5 Dependency Audit
```bash
npm audit --production
```

### Fase 2: Analisi OWASP Top 10

Revisione manuale sistematica di ogni categoria:

| # | Categoria | Cosa Cercare |
|---|-----------|-------------|
| 1 | Injection | SQL via Drizzle ORM (parametrizzato?), prompt injection |
| 2 | Broken Auth | NextAuth config, session timeout, password policy |
| 3 | Sensitive Data | Dati finanziari esposti, PII soci, log con dati sensibili |
| 4 | XXE | Parsing XML nei feed RSS (validare!) |
| 5 | Broken Access | Route protection, API authorization, role check |
| 6 | Misconfiguration | CORS, headers, env variables, Vercel config |
| 7 | XSS | Output da RSS feed, risposte AI, contenuti utente |
| 8 | Insecure Deser. | JSON parsing da fonti esterne |
| 9 | Vulnerable Deps | `npm audit`, dipendenze con CVE note |
| 10 | Insufficient Log | Audit trail login, azioni admin, errori API |

### Fase 3: Analisi Rischi Specifici FinanzAmille

- **Dati finanziari**: posizioni portafoglio accessibili solo con auth?
- **API AI**: chiavi server-side only? Token usage monitorato?
- **News scraping**: contenuti RSS sanitizzati prima del rendering?
- **Pagamenti/affiliazioni**: link affiliazione non manipolabili?
- **Community/Chat**: messaggi sanitizzati? Rate limiting?

## Output: Report di Sicurezza

```
🔒 AGENTSHIELD SECURITY REPORT
================================

Secrets Detection:     ✅ PASS (0 secrets found)
Injection Detection:   ✅ PASS (0 injection vectors)
Auth Verification:     ⚠️  WARNING (1 unprotected route)
AI Security:           ✅ PASS (all inputs sanitized)
Dependency Audit:      ✅ PASS (0 critical CVE)
OWASP Assessment:      ✅ PASS (10/10 categories reviewed)

ISSUES FOUND:
- [HIGH] app/api/news/route.ts — no auth check
  → FIX: Add getServerSession check

OVERALL: ⚠️  NEEDS FIX (1 issue)
```

## Severity Levels

- **CRITICAL**: Secrets esposti, SQL injection, auth bypass → FIX IMMEDIATO, non procedere
- **HIGH**: Route non protette, XSS, missing rate limit → Fix prima di merge
- **MEDIUM**: Logging dati sensibili, dependency warning → Fix nel prossimo ciclo
- **LOW**: Headers mancanti, error messages verbosi → Backlog

## Protocollo Risposta Critica

Se trovata vulnerabilità CRITICAL:
1. **STOP** — non procedere con altro lavoro
2. **Documentare** — posizione esatta nel codice
3. **Fix immediato** — fornire codice sostitutivo
4. **Verificare** — il fix elimina la vulnerabilità
5. **Se secrets esposti** → ruotare credenziali immediatamente
6. **Aggiornare** `.claude/rules/04-sicurezza.md` se serve nuova regola

## Checklist Pre-Deploy

- [ ] `npm audit` senza vulnerabilità critiche
- [ ] Nessun secret nel codice
- [ ] Tutte le API routes autenticate (o giustificazione per quelle pubbliche)
- [ ] Input validati su ogni endpoint
- [ ] Output sanitizzati per contenuti user-facing
- [ ] HTTPS configurato
- [ ] Rate limiting attivo
- [ ] Error handling non leak informazioni
- [ ] Security headers configurati (CSP, HSTS)
- [ ] `.env.local` in `.gitignore`
