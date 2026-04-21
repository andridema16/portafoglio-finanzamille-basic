# Migrazione storico settimanale 2026 e flussi di capitale 2025

- **Ora**: 26/03/2026
- **File modificati**:
  - `scripts/migrazione-storico-2026-flussi-2025.ts` (nuovo)

- **Cosa è stato modificato**:
  - Creato script di migrazione che inserisce 12 punti storico settimanali 2026 nella tabella `storico` (upsert) e 5 flussi di capitale 2025 nella tabella `flussi_capitale`
  - Lo storico copre dal 7 gennaio al 25 marzo 2026 con valori settimanali del portafoglio
  - I flussi 2025 tracciano: avvio portafoglio (gen), 2 depositi da $500 (apr, lug), 1 deposito da $9000 (nov), 1 prelievo da $20225 (dic — chiusura anno)
  - Il punto 2026-03-25 è stato aggiornato da 30572.14 a 30016
  - Lo script è idempotente: storico usa upsert, flussi 2025 vengono cancellati e reinseriti senza toccare quelli 2026

- **Motivo**: Popolare lo storico con dati settimanali per il grafico andamento e registrare i movimenti di capitale del 2025 per il calcolo corretto delle performance

- **Impatto**: Dashboard (grafico andamento portafoglio con più punti), calcolo performance TWR (flussi capitale 2025 inclusi nella serie storica)
