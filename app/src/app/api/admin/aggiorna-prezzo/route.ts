import { NextResponse } from "next/server";
import { verificaAdmin } from "@/lib/admin";
import { getTitoloByTicker, updateTitolo } from "@/lib/db";
import { calcolaAggiornamentoPrezzo } from "@/lib/calcoli";
import { ricalcolaCascata } from "@/lib/ricalcola-portafoglio";
import type { PortfolioId } from "@/types/portafoglio";

/**
 * Aggiorna il prezzo di uno o più titoli e ricalcola a cascata.
 * Body: { ticker, prezzo, portfolioId? } oppure { aggiornamenti: [{ ticker, prezzo }], portfolioId? }
 */
export async function POST(request: Request) {
  const denied = await verificaAdmin();
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Richiesta non valida" },
      { status: 400 }
    );
  }

  const portfolioId = ((body.portfolioId as string) || "basic") as PortfolioId;

  // Supporta sia singolo che batch
  const aggiornamenti: Array<{ ticker: string; prezzo: number }> =
    body.aggiornamenti
      ? (body.aggiornamenti as Array<{ ticker: string; prezzo: number }>)
      : [{ ticker: body.ticker as string, prezzo: Number(body.prezzo) }];

  if (aggiornamenti.length === 0) {
    return NextResponse.json(
      { error: "Nessun aggiornamento fornito" },
      { status: 400 }
    );
  }

  const risultati: Array<{
    ticker: string;
    prezzoVecchio: number;
    prezzoNuovo: number;
    valoreVecchio: number;
    valoreNuovo: number;
    plVecchio: number;
    plNuovo: number;
  }> = [];
  const errori: Array<{ ticker: string; errore: string }> = [];

  for (const { ticker, prezzo } of aggiornamenti) {
    if (!ticker || !prezzo || prezzo <= 0) {
      errori.push({
        ticker: ticker || "?",
        errore: "Ticker e prezzo (> 0) obbligatori",
      });
      continue;
    }

    const tickerUp = ticker.toUpperCase();
    const titolo = await getTitoloByTicker(tickerUp, portfolioId);
    if (!titolo) {
      errori.push({ ticker: tickerUp, errore: "Ticker non trovato" });
      continue;
    }

    const prezzoVecchio =
      titolo.numAzioni > 0
        ? titolo.valoreAttuale / titolo.numAzioni
        : 0;

    const aggiornato = calcolaAggiornamentoPrezzo(titolo, prezzo);
    await updateTitolo(tickerUp, aggiornato, portfolioId);

    risultati.push({
      ticker: tickerUp,
      prezzoVecchio,
      prezzoNuovo: prezzo,
      valoreVecchio: titolo.valoreAttuale,
      valoreNuovo: aggiornato.valoreAttuale,
      plVecchio: titolo.profittoOPerdita,
      plNuovo: aggiornato.profittoOPerdita,
    });
  }

  // Ricalcola tutto una volta sola alla fine
  if (risultati.length > 0) {
    await ricalcolaCascata(portfolioId);
  }

  return NextResponse.json({
    aggiornati: risultati.length,
    errori: errori.length > 0 ? errori : undefined,
    risultati,
  });
}
