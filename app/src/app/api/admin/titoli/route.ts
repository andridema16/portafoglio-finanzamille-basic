import { NextResponse } from "next/server";
import { verificaAdmin } from "@/lib/admin";
import { getTitoli, createTitolo } from "@/lib/db";
import type { Titolo, PortfolioId } from "@/types/portafoglio";

export async function GET(request: Request) {
  const denied = await verificaAdmin();
  if (denied) return denied;

  const url = new URL(request.url);
  const portfolioId = (url.searchParams.get("portfolio") || "basic") as PortfolioId;

  const titoli = await getTitoli(portfolioId);
  return NextResponse.json(titoli);
}

export async function POST(request: Request) {
  const denied = await verificaAdmin();
  if (denied) return denied;

  let body: Partial<Titolo>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Richiesta non valida" }, { status: 400 });
  }

  const portfolioId = ((body as Record<string, unknown>).portfolioId as PortfolioId) || "basic";
  const { ticker, nome, categoria, numAzioni, prezzoMedioCarico, assetClass, paese, settore } = body;
  if (!ticker || !nome || !categoria || numAzioni == null || prezzoMedioCarico == null || !assetClass || !paese || !settore) {
    return NextResponse.json({ error: "Campi obbligatori mancanti" }, { status: 400 });
  }

  const costo = numAzioni * prezzoMedioCarico;

  const titolo: Titolo = {
    portfolioId,
    ticker,
    nome,
    categoria,
    numAzioni,
    prezzoMedioCarico,
    costo,
    valoreAttuale: costo,
    pesoPercentuale: 0,
    varPrezzo: 0,
    dividendi: body.dividendi ?? 0,
    profittoOPerdita: 0,
    plPercentuale: 0,
    peRatio: body.peRatio ?? null,
    isin: body.isin ?? null,
    assetClass,
    paese,
    settore,
  };

  await createTitolo(titolo);
  return NextResponse.json(titolo, { status: 201 });
}
