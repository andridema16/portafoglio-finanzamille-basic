---
Ora: 14/04/2026
---

## File modificati
- `app/src/app/(protected)/[portfolio]/dashboard/page.tsx`

## Cosa è stato modificato
- Rimossa la card "Valore Attuale" dalla griglia delle metriche principali
- Rimossa la card "Performance (TWR)" dalla griglia delle metriche principali
- La griglia è passata da 6 card (2x3) a 4 card (2x2): Capitale Investito, Dividendi, Utile Realizzato, Guadagno Totale
- La performance TWR (%) è stata spostata nella barra "Valore Totale" in basso, affiancata al valore, colorata in verde o rosso in base al segno
- Il componente VariazioneGiornaliera è stato spostato sotto il Valore Totale

## Motivo
Richiesta dell'utente per semplificare la UX della dashboard, riducendo le metriche visibili e mettendo in evidenza la performance accanto al valore totale.

## Impatto
- Dashboard: layout card riepilogo e barra valore totale
