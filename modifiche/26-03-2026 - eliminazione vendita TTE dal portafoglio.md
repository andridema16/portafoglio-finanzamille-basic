## Eliminazione vendita TTE dal portafoglio

- **Ora**: 26-03-2026
- **File modificati**: Nessun file di codice modificato. Modifiche dirette al database Neon PostgreSQL.
- **Cosa è stato modificato**:
  - Eliminata operazione di vendita TTE (id=5): 1 azione venduta a $89, utile $25
  - Ripristinato num_azioni di TTE da 2.0 a 3.0 (3 azioni a $67 di prezzo medio carico)
  - Utile realizzato portafoglio invariato a $65 (la vendita TTE non era ancora stata conteggiata)
- **Motivo**: Richiesta dell'utente di annullare la vendita di TTE come se non fosse mai avvenuta.
- **Impatto**: Dashboard (valori portafoglio ricalcolati con 3 azioni TTE), Composizione Portafoglio (TTE con 3 azioni), Categoria Commodities (TTE con posizione completa), Transazioni (vendita TTE rimossa)
