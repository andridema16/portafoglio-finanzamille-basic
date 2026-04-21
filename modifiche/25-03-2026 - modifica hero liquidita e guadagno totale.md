# Modifica Hero: Liquidità e Guadagno Totale

- **Ora**: 25/03/2026
- **File modificati**:
  - `src/app/(protected)/dashboard/page.tsx` — sezione Hero

- **Cosa è stato modificato**:
  - Sostituito il 6o box della griglia da "Liquidità" a "Guadagno Totale" (profittoOPerdita + utileRealizzato + dividendiTotale2026) con colore condizionale verde/rosso
  - "Valore Totale" nella barra in fondo ora mostra solo portafoglio.valoreAttuale (senza liquidità), sottotitolo cambiato in "Controvalore portafoglio"
  - Aggiunta sezione Liquidità separata sotto la barra totale: mostra importo liquidità, interessi giornalieri (liquidità * 4% / 365) con formatValutaDecimali, e nota "Rendimento 4% annuo"
  - Layout Liquidità responsive: verticale su mobile, orizzontale su sm+
  - Aggiunto import di formatValutaDecimali

- **Motivo**: Separare la liquidità dalle metriche principali del portafoglio e aggiungere un indicatore di guadagno complessivo (P&L + utili + dividendi) per dare una visione più chiara della performance totale

- **Impatto**: Dashboard — sezione Hero. Nessun impatto su altre pagine.
