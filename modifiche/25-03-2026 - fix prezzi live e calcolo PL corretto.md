# Fix prezzi live e calcolo P&L corretto

**Ora**: 19:50

## File modificati
- `app/src/lib/calcoli.ts` — Correzione formula P&L in `calcolaTitoloConPrezzoLive`
- `app/src/app/api/admin/ricalcola/route.ts` — Fix tipo `undefined` → `null` per prezzi mancanti
- `app/src/lib/__tests__/calcoli.test.ts` — Test aggiornati per nuova logica (47/47 PASS)

## Database (Neon PostgreSQL)
- Aggiornato `costo` per tutti i titoli: ora = `num_azioni * prezzo_medio_carico`
- Ricalcolato `profitto_o_perdita` e `pl_percentuale` per tutti i titoli
- Corretto ticker `FIV` → `FISV` (Fiserv Inc — Yahoo Finance non riconosceva FIV)

## Cosa e' stato modificato
Il campo `costo` nel database conteneva valori errati dal PDF originale (non era il costo totale della posizione). La funzione `calcolaTitoloConPrezzoLive` usava `titolo.costo` per calcolare il P&L, producendo risultati assurdi (es. PHYS +5339%, BIL +1691%).

**Fix**: il costo totale viene ora calcolato sempre come `numAzioni * prezzoMedioCarico`, sia con prezzo live che senza.

## Motivo
I prezzi mostrati nel sito non riflettevano i valori reali. I P&L erano completamente sbagliati perche' il campo `costo` nel DB non rappresentava il costo totale della posizione.

## Impatto
- Dashboard: valori P&L e P&L% ora corretti per tutti i titoli
- Pagina Categoria: stessi fix (usano la stessa funzione)
- Pagina Analisi: grafici di esposizione con valori corretti
- Admin Ricalcola: fix tipo TypeScript per prezzi mancanti
- Tutti i 66 ticker ora riconosciuti da Yahoo Finance (FISV al posto di FIV)
