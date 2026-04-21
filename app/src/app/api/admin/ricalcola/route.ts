import { NextResponse } from "next/server";
import { verificaAdmin } from "@/lib/admin";
import { getTitoli, getCategorie, getPortafoglio, updateTitolo, updateCategoria, updatePortafoglio, addStorico } from "@/lib/db";
import { getPrezziMultipli } from "@/lib/yahoo";
import { calcolaTitoloConPrezzoLive, ricalcolaCategoriaConTitoli, ricalcolaPortafoglioConTitoli } from "@/lib/calcoli";
import type { PortfolioId } from "@/types/portafoglio";

export async function POST(request: Request) {
  const denied = await verificaAdmin();
  if (denied) return denied;

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    // Body vuoto è accettabile, si usa il default
  }

  const portfolioId = ((body.portfolioId as string) || "basic") as PortfolioId;

  try {
    // 1. Carica dati correnti
    const [titoli, categorie, portafoglio] = await Promise.all([
      getTitoli(portfolioId),
      getCategorie(portfolioId),
      getPortafoglio(portfolioId),
    ]);

    // 2. Fetch prezzi live da Yahoo Finance
    const tickers = titoli.map((t) => t.ticker);
    const { prezzi, timestamp } = await getPrezziMultipli(tickers);

    // 3. Ricalcola titoli con prezzi live
    const titoliAggiornati = titoli.map((t) =>
      calcolaTitoloConPrezzoLive(t, prezzi[t.ticker] ?? null)
    );

    // 4. Ricalcola categorie
    const categorieAggiornate = categorie.map((cat) => {
      const titoliCat = titoliAggiornati.filter((t) => t.categoria === cat.id);
      return ricalcolaCategoriaConTitoli(cat, titoliCat);
    });

    // 5. Ricalcola portafoglio
    const categorieFinali = categorieAggiornate.map((r) => r.categoria);
    const portafoglioAggiornato = ricalcolaPortafoglioConTitoli(portafoglio, categorieFinali);
    const oggi = new Date().toISOString().slice(0, 10);
    portafoglioAggiornato.dataAggiornamento = oggi;

    // 6. Unisci i pesi aggiornati dai risultati delle categorie nei titoli
    const titoliConPesi = categorieAggiornate.flatMap((r) => r.titoli);

    // 7. Salva tutto nel DB in un'unica passata
    const salvataggiTitoli = titoliConPesi.map((t) => updateTitolo(t.ticker, t, portfolioId));
    const salvataggiCategorie = categorieFinali.map((c) => updateCategoria(c.id, c));

    await Promise.all([
      ...salvataggiTitoli,
      ...salvataggiCategorie,
      updatePortafoglio(portafoglioAggiornato),
      addStorico({ data: oggi, valore: portafoglioAggiornato.valoreAttuale }, portfolioId),
    ]);

    return NextResponse.json({
      success: true,
      timestamp,
      titoli: titoliAggiornati.length,
      valoreAttuale: portafoglioAggiornato.valoreAttuale,
      dataAggiornamento: oggi,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Errore sconosciuto";
    return NextResponse.json({ error: `Errore durante il ricalcolo: ${message}` }, { status: 500 });
  }
}
