## Test Results
**Status: PASS**
**Tests run:** 38 | **Passed:** 38 | **Failed:** 0

## Test Cases

### scegli-portafoglio/page.tsx — static source checks (13 tests)
- [PASS] exports a default function (ScegliPortafoglioPage)
- [PASS] imports Link from next/link
- [PASS] does NOT use 'use client' directive (it is a Server Component)
- [PASS] contains the heading text 'Scegli il tuo portafoglio'
- [PASS] contains the brand name split across Finanz + Amille spans
- [PASS] contains 'Portafoglio Intermedio' card text
- [PASS] contains 'Portafoglio Basic' card text
- [PASS] Portafoglio Intermedio is wrapped in a Link component pointing to /dashboard
- [PASS] Portafoglio Intermedio card shows an 'Attivo' badge
- [PASS] Portafoglio Basic card shows an 'In arrivo' badge
- [PASS] Portafoglio Basic is a div, not a Link — it is disabled
- [PASS] Portafoglio Basic div has opacity-60 and cursor-not-allowed classes
- [PASS] uses a 2-column responsive grid layout for the cards
- [PASS] does NOT link to /scegli-portafoglio (avoids a self-referencing loop)

### page.tsx (login) — redirect routing after auth (9 tests)
- [PASS] is a client component ('use client' directive present)
- [PASS] exports a default function (LoginPage)
- [PASS] redirects regular users to /scegli-portafoglio after login
- [PASS] does NOT redirect regular users directly to /dashboard
- [PASS] redirects admin users to /admin after login (admin branch unchanged)
- [PASS] branches on role === 'admin' to determine the redirect target
- [PASS] calls /api/auth endpoint with POST method
- [PASS] shows 'Password errata' on failed login (401 response)
- [PASS] shows a loading state while the request is in flight
- [PASS] has a password input field

### Sidebar.tsx — 'Cambia portafoglio' footer link (11 tests)
- [PASS] contains a link with href='/scegli-portafoglio'
- [PASS] contains the visible label 'Cambia portafoglio'
- [PASS] the 'Cambia portafoglio' link is a Next.js Link element (not a plain a)
- [PASS] the 'Cambia portafoglio' link is positioned before the copyright line in the footer
- [PASS] the 'Cambia portafoglio' link closes the mobile sidebar on click (onClick handler)
- [PASS] still contains all main navigation links (unchanged)
- [PASS] still contains admin navigation section
- [PASS] still uses 'use client' directive (required for hooks)
- [PASS] accepts a ruolo prop of type UserRole
- [PASS] copyright footer is still present

### Cross-file consistency — scegli-portafoglio route (4 tests)
- [PASS] login and sidebar both reference the same /scegli-portafoglio path
- [PASS] the selection page itself links onward to /dashboard (the next step in the flow)
- [PASS] the selection page does NOT import or reference the login page (no circular dep)
- [PASS] login page does NOT directly push to /dashboard for user role (uses scegli-portafoglio instead)

## TypeScript Check
`npx tsc --noEmit` produced zero errors in the three modified/new files:
- src/app/scegli-portafoglio/page.tsx
- src/app/page.tsx
- src/components/Sidebar.tsx

Pre-existing TypeScript errors exist in unrelated test files (auth-dual.test.ts, calcolaTWR.test.ts, composizione-refactor.test.ts) that were present before these changes.

## Build
`npm run build` completed successfully. The /scegli-portafoglio route is correctly compiled as a static page (Server Component with no dynamic data fetching). All 31 routes compiled without errors.

## Notes
- jsdom is not installed in this project, so React component rendering via @testing-library is not possible. The static source-text analysis strategy is consistent with all existing tests in this codebase.
- The 'Cambia portafoglio' Link in the Sidebar correctly includes an onClick={() => setMobileOpen(false)} handler, matching the behaviour of all other nav links (mobile sidebar collapses on navigation).
- The proxy middleware (src/proxy.ts) does not special-case /scegli-portafoglio, meaning authenticated users can access it directly from the sidebar and unauthenticated users will be redirected to / as expected. No changes are needed in the proxy for this feature.
- One edge case not covered by the code: if a user manually navigates to /dashboard without going through /scegli-portafoglio first, the app allows it (no enforcement of the selection step). This appears to be intentional — the selection page is a UX step, not an access control boundary.
