## Doppia autenticazione con ruoli user e admin

- **Ora**: 25-03-2026
- **File modificati**:
  - `app/.env.local` — aggiunta variabile `ADMIN_PASSWORD`
  - `app/src/types/portafoglio.ts` — aggiunto tipo `UserRole`
  - `app/src/lib/auth.ts` — riscritto: `hashTokenWithRole` (token HMAC diversi per ruolo), `verifyTokenAndGetRole` (con `timingSafeEqual`), rimosso vecchio `hashToken`
  - `app/src/app/api/auth/route.ts` — controlla entrambe le password, ritorna il ruolo nella risposta JSON
  - `app/src/proxy.ts` — verifica ruolo dal token, blocca `/admin/*` per non-admin, inietta header `x-user-role` nella request
  - `app/src/app/page.tsx` — redirect a `/admin` per admin, `/dashboard` per user
  - `app/src/components/Sidebar.tsx` — aggiunta prop `ruolo`, sezione "Gestione" visibile solo per admin con link a `/admin`, `/admin/titoli`, `/admin/categorie`, `/admin/transazioni`
  - `app/src/app/(protected)/layout.tsx` — legge ruolo da `headers()` e lo passa alla Sidebar

- **Cosa è stato modificato**: Implementata doppia autenticazione con password diverse per ruoli diversi. `SITE_PASSWORD` autentica come "user" e porta a `/dashboard`. `ADMIN_PASSWORD` autentica come "admin" e porta a `/admin`. I token HMAC sono diversi per ruolo (prefisso `role:password`). Il proxy blocca le rotte `/admin/*` per utenti non-admin. La sidebar mostra la sezione "Gestione" solo per gli admin.

- **Motivo**: Separare l'accesso clienti dall'accesso amministratore per preparare il pannello di gestione del portafoglio.

- **Impatto**: Login, tutte le pagine protette (dashboard, categorie, transazioni), sidebar, middleware/proxy. Le pagine `/admin/*` non esistono ancora ma sono già protette.
