# Variazione Giornaliera Real-Time in Dashboard

- **Ora**: 26/03/2026
- **File modificati**:
  - `src/lib/yahoo.ts` — Aggiunta funzione `getPrezziConPreviousClose()`, interfaccia `PrezzoDettaglio`, cache dedicata 1 minuto, batch fetch con previousClose
  - `src/app/api/variazione-giornaliera/route.ts` — Nuovo API route GET per calcolo variazione giornaliera portafoglio
  - `src/components/VariazioneGiornaliera.tsx` — Nuovo client component con auto-refresh ogni 60 secondi
  - `src/app/(protected)/dashboard/page.tsx` — Integrazione componente VariazioneGiornaliera nella card "Valore Attuale"
- **Cosa è stato modificato**: Aggiunta variazione giornaliera del portafoglio in tempo reale nella card "Valore Attuale" della dashboard. Mostra variazione in dollari e percentuale (es. +$125.40 / +0.41%), con colore verde se positiva e rosso se negativa. Si aggiorna automaticamente ogni 60 secondi tramite fetch client-side verso un API route che calcola la differenza tra valore corrente (prezzi live Yahoo Finance) e valore chiusura giorno precedente (previousClose). Include indicatore "Ultimo aggiornamento: HH:MM".
- **Motivo**: Richiesta dell'utente per dare ai clienti visibilità immediata sulla variazione giornaliera del portafoglio, senza dover attendere aggiornamenti manuali.
- **Impatto**: Dashboard — card "Valore Attuale" mostra ora la variazione giornaliera sotto il valore del portafoglio. Nessun impatto su altre pagine.
