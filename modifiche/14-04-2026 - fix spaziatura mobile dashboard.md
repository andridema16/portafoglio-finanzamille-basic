## Fix spaziatura e dimensioni mobile dashboard

- **Ora**: 19:30
- **File modificati**:
  - `src/app/(protected)/[portfolio]/layout.tsx`
  - `src/app/(protected)/[portfolio]/dashboard/page.tsx`
  - `src/app/(protected)/[portfolio]/composizione/page.tsx`
  - `src/app/(protected)/[portfolio]/categoria/[slug]/page.tsx`
- **Cosa è stato modificato**:
  - Layout wrapper: padding ridotto da 24px a 16px su mobile (p-4 md:p-6)
  - Hero card dashboard: padding, gap griglia, font importi ridotti su mobile
  - Card metriche: da text-xl a text-base su mobile, padding da p-4 a p-3
  - Sezione "Valore Totale": label e importo ridimensionati su mobile
  - Sezione Liquidita: padding compattato
  - Card Categorie: padding ridotto
  - Gap tra sezioni: da space-y-6 a space-y-4 su mobile
  - Tabelle composizione/categoria/dashboard: layout a card stile Trade Republic su mobile (niente scroll orizzontale)
  - Link Next.js al posto di `<a>` nel dashboard
- **Motivo**: L'interfaccia su telefono aveva padding eccessivi, font troppo grandi e tabelle con scroll orizzontale. Il sito doveva essere compatto come Trade Republic su mobile.
- **Impatto**: Dashboard (tutte le sezioni), composizione, dettaglio categoria — versione mobile
