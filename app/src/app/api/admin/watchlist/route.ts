import { NextResponse } from "next/server";
import { verificaAdmin } from "@/lib/admin";
import { getWatchlist, createWatchlistItem } from "@/lib/db";
import type { WatchlistItem } from "@/types/portafoglio";

export async function GET() {
  const denied = await verificaAdmin();
  if (denied) return denied;

  const items = await getWatchlist();
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const denied = await verificaAdmin();
  if (denied) return denied;

  let body: Partial<WatchlistItem>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Richiesta non valida" }, { status: 400 });
  }

  const { ticker, nome, settore, paese, descrizione } = body;
  if (!ticker || !nome || !settore || !paese || !descrizione) {
    return NextResponse.json({ error: "Campi obbligatori mancanti" }, { status: 400 });
  }

  const oggi = new Date().toISOString().slice(0, 10);

  const item: Omit<WatchlistItem, "id"> = {
    ticker,
    tickerYahoo: body.tickerYahoo ?? null,
    nome,
    settore,
    paese,
    assetClass: body.assetClass ?? "azione",
    descrizione,
    targetPrice: body.targetPrice ?? null,
    rating: body.rating ?? null,
    peRatio: body.peRatio ?? null,
    dividendYield: body.dividendYield ?? null,
    metricheExtra: body.metricheExtra ?? {},
    analisiTesto: body.analisiTesto ?? null,
    dataInserimento: oggi,
    dataAggiornamento: oggi,
  };

  const id = await createWatchlistItem(item);
  return NextResponse.json({ id, ...item }, { status: 201 });
}
