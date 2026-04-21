# Migrazione da JSON a Database Neon PostgreSQL

- **Ora**: 25/03/2026
- **File modificati**:
  - `app/src/lib/db.ts` (NUOVO) — funzioni di lettura e CRUD admin per il database
  - `app/src/app/(protected)/layout.tsx` — fetch categorie dal DB, passate come props alla Sidebar
  - `app/src/app/(protected)/dashboard/page.tsx` — sostituiti import JSON con funzioni db.ts
  - `app/src/app/(protected)/dashboard/DashboardCharts.tsx` — aggiunta prop storico
  - `app/src/app/(protected)/categoria/[slug]/page.tsx` — rimosso generateStaticParams, usa db.ts
  - `app/src/app/(protected)/transazioni/page.tsx` — sostituiti import JSON con getTransazioni()
  - `app/src/components/Sidebar.tsx` — riceve categorie come props invece di importare JSON
  - `app/src/components/charts/GraficoAndamento.tsx` — riceve storico come props invece di importare JSON
  - `app/.env.local` — aggiunta DATABASE_URL
  - `app/package.json` — aggiunto @neondatabase/serverless

- **Cosa è stato modificato**:
  Migrazione completa del sito da file JSON statici (`app/src/data/*.json`) a database Neon PostgreSQL.
  Creato progetto Neon "portafoglio-finanzamille" con 6 tabelle: portafoglio, categorie, titoli, storico, dividendi, operazioni.
  Inseriti tutti i dati (1 portafoglio, 5 categorie, 66 titoli, 2 punti storico, 19 dividendi, 4 operazioni).
  Creato modulo `db.ts` con 7 funzioni di lettura (getPortafoglio, getCategorie, getCategoriaBySlug, getTitoli, getTitoliByCategoria, getStorico, getTransazioni) e 11 funzioni CRUD admin.
  Aggiornati tutti i componenti e le pagine per leggere dal DB invece che dai JSON.
  La Sidebar ora riceve le categorie come props dal layout. GraficoAndamento riceve i dati storico come props.
  Rimosso generateStaticParams dalla pagina categoria (ora dinamica).
  Aggiunto React.cache() su getCategorie per deduplica intra-request.

- **Motivo**: Permettere l'aggiornamento dei dati del portafoglio tramite database invece di dover modificare file JSON e rifare il deploy. Preparazione per future funzionalità admin.

- **Impatto**: Tutte le pagine del sito (dashboard, categorie, transazioni, sidebar). Il sito ora dipende dalla connessione al database Neon per funzionare.
