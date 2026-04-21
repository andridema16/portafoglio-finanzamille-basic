# Autenticazione

## Meccanismo
- Protezione con **password singola** (non ci sono utenti/registrazione)
- La password è la stessa per tutti i clienti
- Cambia ogni mese (il gestore la aggiorna manualmente)

## Implementazione
- La password è salvata in una variabile d'ambiente `SITE_PASSWORD` nel file `.env.local`
- Al login, il sito verifica la password tramite un API route (`/api/auth`)
- Se corretta, setta un **cookie HTTP-only** con un token (hash della password + secret)
- Il cookie dura 30 giorni
- Un middleware Next.js controlla il cookie su ogni richiesta alle pagine protette
- Se il cookie manca o non è valido → redirect a `/`

## File coinvolti
- `.env.local` — contiene `SITE_PASSWORD` e `AUTH_SECRET`
- `src/app/api/auth/route.ts` — endpoint di verifica password
- `src/middleware.ts` — controlla autenticazione su tutte le rotte tranne `/` e `/api/auth`

## Cambio password mensile
- Il gestore cambia `SITE_PASSWORD` in `.env.local`
- Al prossimo deploy i vecchi cookie non funzionano più (perché il token è basato sulla password)
- I clienti dovranno reinserire la nuova password

## Sicurezza
- NON salvare la password in chiaro nel codice
- NON committare `.env.local` nel repository
- Il `.gitignore` deve includere `.env.local`
