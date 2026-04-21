# Creazione copia sito (Portafoglio Basic + Watchlist)

**Ora**: 06:30
**Cartella destinazione**: `~/Desktop/portafoglio-finanzamille-basic/`

## File modificati (relativi a `app/`)

- `src/types/portafoglio.ts` — `PortfolioId = "basic"` (rimosso "intermedio")
- `src/lib/portfolio.ts` — rimosso `intermedio` da `PORTFOLIOS`, semplificato `isValidPortfolioId` e `getNavItems`
- `src/lib/db.ts` — tutti i default `"intermedio"` → `"basic"`
- `src/lib/ricalcola-portafoglio.ts` — default `"intermedio"` → `"basic"`
- `src/components/Sidebar.tsx` — rimosso blocco portfolio-switcher (non c'è più un "altro portafoglio")
- `src/app/scegli-portafoglio/page.tsx` — 2 card: Basic + Watchlist
- `src/app/(protected)/admin/layout.tsx` — `portfolioId="basic"`
- `src/app/(protected)/admin/page.tsx` — selector solo `["basic"]`
- `src/app/(protected)/admin/prezzi/page.tsx` — idem
- `src/app/(protected)/admin/categorie/page.tsx` — idem
- `src/app/(protected)/admin/transazioni/page.tsx` — idem
- `src/app/(protected)/admin/transazioni/nuova/page.tsx` — idem
- `src/app/(protected)/admin/flussi/page.tsx` — idem
- `src/app/(protected)/admin/titoli/page.tsx` — idem
- `src/app/(protected)/admin/titoli/nuovo/page.tsx` — idem
- `src/app/(protected)/admin/titoli/[ticker]/modifica/page.tsx` — idem
- `src/components/VariazioneGiornaliera.tsx` — default `"basic"`
- `src/components/admin/FormTitolo.tsx` — default `"basic"`
- `src/components/admin/FormAggiornaPrezzi.tsx` — default `"basic"`
- `src/components/admin/FormTransazione.tsx` — default `"basic"`
- tutte le API routes in `src/app/api/**/*.ts` — default `"basic"`

## File rimossi

- `src/app/(protected)/[portfolio]/transazioni/` — route solo intermedio
- `src/app/(protected)/[portfolio]/pagamenti/` — route solo intermedio
- `src/__tests__/sidebar-portfolio-switcher.test.ts` — test switcher obsoleto
- `src/__tests__/sidebar-portfolio-switcher-qa-report.md` — report QA obsoleto
- `src/__tests__/scegli-portafoglio-login-sidebar.test.ts` — testava 3 card
- `src/__tests__/analisi-pagamenti-transazioni-sidebar-layout.test.ts` — testava pagine rimosse

## Cosa è stato modificato

Copiato l'intero progetto `portafoglio-finanzamille` sul Desktop come `portafoglio-finanzamille-basic` ed escluso il Portafoglio Intermedio. Il nuovo sito espone solo il Portafoglio Basic + la Watchlist.

## Motivo

L'utente sta per pubblicare online il progetto originale e ha bisogno di una seconda build che mostri esclusivamente il Portafoglio Basic e la Watchlist, da distribuire separatamente.

## Impatto

- Pagina `/scegli-portafoglio`: 2 card (Basic + Watchlist)
- Sidebar: sparisce il link "Vai a Intermedio" e il relativo switcher
- Rotte `/intermedio/*`: non più esistenti → 404 via `isValidPortfolioId`
- Rotte `/basic/*`: invariate (dashboard, composizione, ribilanciamenti, categoria)
- Rotta `/watchlist`: invariata
- Area admin: selector portafoglio mostra solo "Basic"; tutte le API default to `"basic"`
- Database (Neon): lo stesso DB viene interrogato ma solo con `portfolio_id='basic'`

## Note per il deploy

1. `cd app && npm install`
2. Configurare `.env.local` con `DATABASE_URL`, `SITE_PASSWORD`, `ADMIN_PASSWORD`, `AUTH_SECRET` (lo stesso o uno nuovo a seconda di come si vuole gestire il secondo dominio)
3. `npm run dev` per test locale, oppure `vercel` per il deploy

## Verifica

- `npx tsc --noEmit` sul codice sorgente non-test: **0 errori** (gli errori nei `__tests__` sono pre-esistenti nel progetto originale e non bloccano il build Next.js)
- Tutti i riferimenti testuali a `"intermedio"` sono stati rimossi da `.ts/.tsx` sotto `src/`
