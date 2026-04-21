import {
  getTitoli,
  getCategorie,
  getPortafoglio,
  updateTitolo,
  updateCategoria,
  updatePortafoglio,
} from "@/lib/db";
import {
  ricalcolaCategoriaConTitoli,
  ricalcolaPortafoglioConTitoli,
} from "@/lib/calcoli";
import type { Titolo, PortfolioId } from "@/types/portafoglio";

/**
 * Ricalcola a cascata categorie e portafoglio dopo una modifica a un titolo.
 * Accetta opzionalmente un titolo già aggiornato (evita di rileggerlo dal DB).
 * Salva tutto nel DB.
 */
export async function ricalcolaCascata(
  portfolioId: PortfolioId = "basic",
  titoloModificato?: Titolo
): Promise<void> {
  const [tuttiTitoli, categorie, portafoglio] = await Promise.all([
    getTitoli(portfolioId),
    getCategorie(portfolioId),
    getPortafoglio(portfolioId),
  ]);

  // Sostituisci il titolo modificato se fornito
  const titoli = titoloModificato
    ? tuttiTitoli.map((t) =>
        t.ticker === titoloModificato.ticker ? titoloModificato : t
      )
    : tuttiTitoli;

  // Ricalcola categorie
  const categorieAggiornate = categorie.map((cat) => {
    const titoliCat = titoli.filter((t) => t.categoria === cat.id);
    return ricalcolaCategoriaConTitoli(cat, titoliCat);
  });

  // Ricalcola portafoglio
  const categorieFinali = categorieAggiornate.map((r) => r.categoria);
  const portafoglioAggiornato = ricalcolaPortafoglioConTitoli(
    portafoglio,
    categorieFinali
  );
  portafoglioAggiornato.dataAggiornamento = new Date()
    .toISOString()
    .slice(0, 10);

  // Aggiorna pesi titoli
  const titoliConPesi = categorieAggiornate.flatMap((r) => r.titoli);

  // Salva tutto nel DB
  await Promise.all([
    ...titoliConPesi.map((t) => updateTitolo(t.ticker, t, portfolioId)),
    ...categorieFinali.map((c) => updateCategoria(c.id, c)),
    updatePortafoglio(portafoglioAggiornato),
  ]);
}
