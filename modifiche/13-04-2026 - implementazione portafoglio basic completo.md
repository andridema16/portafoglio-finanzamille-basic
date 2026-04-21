## Implementazione Portafoglio Basic

**Ora**: 15:00

### File modificati

**Database (Neon PostgreSQL)**:
- Aggiunta colonna `portfolio_id` a 7 tabelle: portafoglio, categorie, titoli, dividendi, operazioni, storico, flussi_capitale
- Aggiornati vincoli UNIQUE per supporto multi-portafoglio
- Inseriti dati Basic: 1 portafoglio (EUR), 3 categorie, 7 titoli ETF, 2 punti storico, 5 operazioni ribilanciamento

**Tipi e librerie core**:
- `src/types/portafoglio.ts` — Aggiunto tipo `PortfolioId`, campo `portfolioId` in Portafoglio/Categoria/Titolo
- `src/lib/portfolio.ts` — Nuovo file: metadata portafogli, validazione, menu navigazione
- `src/lib/db.ts` — Tutte le ~30 funzioni accettano `portfolioId` con filtro WHERE
- `src/lib/format.ts` — `formatValuta` e `formatValutaDecimali` accettano parametro `valuta` (EUR/USD)
- `src/lib/ricalcola-portafoglio.ts` — `ricalcolaCascata` accetta `portfolioId`

**Routing (ristrutturazione completa)**:
- `src/app/(protected)/layout.tsx` — Semplificato a wrapper minimo
- `src/app/(protected)/[portfolio]/layout.tsx` — Nuovo: valida portfolio, renderizza Sidebar
- `src/app/(protected)/admin/layout.tsx` — Nuovo: layout admin dedicato
- Tutte le pagine spostate da `(protected)/X` a `(protected)/[portfolio]/X`
- Dashboard, composizione, categoria, transazioni, pagamenti, ribilanciamenti

**Componenti**:
- `src/components/Sidebar.tsx` — Nuova prop `portfolioId`, menu dinamico
- `src/components/VariazioneGiornaliera.tsx` — Supporto multi-valuta e portfolio
- `src/components/charts/GraficoEsposizione.tsx` — Prop `valuta` per tooltip
- `src/app/(protected)/[portfolio]/dashboard/DashboardCharts.tsx` — Grafico donut per Basic, comparativo per Intermedio

**Pagine**:
- `src/app/scegli-portafoglio/page.tsx` — Card Basic attivata, link a `/basic/dashboard`
- `src/proxy.ts` — Redirect `/dashboard` a `/scegli-portafoglio`

**API Routes** (tutti aggiornati per accettare `portfolioId`):
- admin/titoli, admin/categorie, admin/transazioni, admin/flussi
- admin/aggiorna-prezzo, admin/ricalcola
- variazione-giornaliera, prezzi

### Cosa è stato modificato
Implementazione completa del sistema multi-portafoglio. Il sito ora supporta due portafogli:
- **Intermedio**: 50+ titoli USD, 5 categorie (esistente)
- **Basic**: 7 ETF europei EUR, 3 categorie (Obbligazionario, Azionario Globale, Oro)

Architettura: colonna `portfolio_id` in tutte le tabelle DB, segmento dinamico `[portfolio]` nel routing Next.js, formattazione valuta dinamica (USD/EUR).

### Motivo
Richiesta del cliente di aggiungere un secondo portafoglio "Basic" per investitori principianti, con la stessa struttura del portafoglio intermedio ma contenuto semplificato (solo ETF europei).

### Impatto
- **Tutte le pagine**: routing cambiato da `/dashboard` a `/[portfolio]/dashboard`
- **Login flow**: dopo login si passa per `/scegli-portafoglio`
- **Dashboard Basic**: mostra grafico donut con 3 categorie invece di confronto SPY
- **Admin**: può gestire entrambi i portafogli
- **Nessuna regressione**: portafoglio intermedio funziona come prima
